// path: apps/api/src/routes/sync.ts
import { CourseStatus, ImportStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth } from "../middlewares/auth";
import {
  buildOccurrenceDate,
  parseWeekLabel,
} from "../services/timetable/expandOccurrences";
import { resolveTimetableDateRange } from "../services/timetable/queryTimetable";
import { sha256Json } from "../utils/hash";

const router = Router();

const TimetableItemSchema = z.object({
  semester: z.string().min(1).optional(),
  courseCode: z.string().min(1),
  courseName: z.string().nullable().optional(),
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  room: z.string().min(1),
  campus: z.string().nullable().optional(),
  weeksIncluded: z.string().optional(),
  weeksCanceled: z.string().optional(),
});

const SyncTimetableSchema = z.object({
  adapterKey: z.string().min(1),
  adapterVersion: z.string().min(1),
  sourcePage: z.string().min(1).default("extension"),
  semester: z.string().min(1),
  items: z.array(TimetableItemSchema).min(1),
});

const TranscriptItemSchema = z.object({
  semester: z.string().min(1),
  courseCode: z.string().min(1),
  classCode: z.string().optional().default(""),
  courseName: z.string().min(1),
  credits: z.number().int().min(0),
  score10: z.number().nullable().optional(),
  letter: z.string().nullable().optional(),
  gpa4: z.number().nullable().optional(),
  status: z.string().nullable().optional(),
  componentsBreakdown: z.any().optional(),
});

const SyncTranscriptSchema = z.object({
  adapterKey: z.string().min(1),
  adapterVersion: z.string().min(1),
  sourcePage: z.string().min(1),
  scrapedAt: z.string().optional(),
  student: z
    .object({
      studentId: z.string().nullable().optional(),
      fullName: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  items: z.array(TranscriptItemSchema).min(1),
});

function normalizeSpace(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeLoose(value: unknown) {
  return normalizeSpace(value).toLowerCase();
}

function normalizeClassCode(value: unknown) {
  return normalizeSpace(value);
}

function normalizeSemester(value: unknown) {
  return normalizeSpace(value);
}

function hasRealGrade(item: {
  score10?: number | null;
  letter?: string | null;
  gpa4?: number | null;
  status?: string | null;
}) {
  const status = normalizeLoose(item.status);
  return (
    typeof item.score10 === "number" ||
    !!normalizeSpace(item.letter) ||
    typeof item.gpa4 === "number" ||
    status === "passed" ||
    status === "failed"
  );
}

function normalizeTranscriptStatus(
  rawStatus: unknown,
  score10: number | null | undefined,
  letter: string | null | undefined,
): CourseStatus {
  const s = normalizeLoose(rawStatus);

  if (s === "passed") return CourseStatus.passed;
  if (s === "failed") return CourseStatus.failed;
  if (s === "retaken") return CourseStatus.retaken;
  if (s === "in_progress") return CourseStatus.in_progress;
  if (s === "absent_final") return CourseStatus.absent_final;
  if (s === "banned_final") return CourseStatus.banned_final;

  if (typeof score10 === "number") {
    return score10 < 4 ? CourseStatus.failed : CourseStatus.passed;
  }

  const L = normalizeSpace(letter).toUpperCase();
  if (!L) return CourseStatus.unknown;
  if (L === "F") return CourseStatus.failed;
  if (L === "P" || L === "P/F" || L === "I" || L === "X" || L === "R") {
    return CourseStatus.unknown;
  }

  return CourseStatus.passed;
}

type SyncTranscriptItem = z.infer<typeof TranscriptItemSchema>;

function scoreFieldCount(item: SyncTranscriptItem) {
  return (
    (typeof item.score10 === "number" ? 1 : 0) +
    (normalizeSpace(item.letter) ? 1 : 0) +
    (typeof item.gpa4 === "number" ? 1 : 0)
  );
}

function pickBetterTranscriptItem(a: SyncTranscriptItem, b: SyncTranscriptItem) {
  const aHasGrade = hasRealGrade(a);
  const bHasGrade = hasRealGrade(b);

  if (aHasGrade !== bHasGrade) {
    return aHasGrade ? a : b;
  }

  const aCredits = Number(a.credits || 0);
  const bCredits = Number(b.credits || 0);
  if (aCredits !== bCredits) {
    return aCredits > bCredits ? a : b;
  }

  const aFields = scoreFieldCount(a);
  const bFields = scoreFieldCount(b);
  if (aFields !== bFields) {
    return aFields > bFields ? a : b;
  }

  const aNameLen = normalizeSpace(a.courseName).length;
  const bNameLen = normalizeSpace(b.courseName).length;
  if (aNameLen !== bNameLen) {
    return aNameLen > bNameLen ? a : b;
  }

  return a;
}

function mergeTranscriptItems(
  base: SyncTranscriptItem,
  extra: SyncTranscriptItem,
): SyncTranscriptItem {
  const better = pickBetterTranscriptItem(base, extra);
  const weaker = better === base ? extra : base;

  return {
    semester: normalizeSemester(better.semester || weaker.semester),
    courseCode: normalizeSpace(better.courseCode || weaker.courseCode),
    classCode: normalizeClassCode(better.classCode || weaker.classCode || ""),
    courseName: normalizeSpace(better.courseName || weaker.courseName),
    credits: Math.max(Number(base.credits || 0), Number(extra.credits || 0)),
    score10:
      typeof better.score10 === "number"
        ? better.score10
        : typeof weaker.score10 === "number"
        ? weaker.score10
        : null,
    letter: normalizeSpace(better.letter) || normalizeSpace(weaker.letter) || null,
    gpa4:
      typeof better.gpa4 === "number"
        ? better.gpa4
        : typeof weaker.gpa4 === "number"
        ? weaker.gpa4
        : null,
    status:
      normalizeSpace(better.status) ||
      normalizeSpace(weaker.status) ||
      null,
    componentsBreakdown: {
      ...(weaker.componentsBreakdown ?? {}),
      ...(better.componentsBreakdown ?? {}),
      classCode:
        normalizeClassCode(better.classCode || weaker.classCode || "") || null,
    },
  };
}

function dedupeTranscriptPayloadItems(items: SyncTranscriptItem[]) {
  const map = new Map<string, SyncTranscriptItem>();

  for (const raw of items) {
    const item: SyncTranscriptItem = {
      ...raw,
      semester: normalizeSemester(raw.semester),
      courseCode: normalizeSpace(raw.courseCode),
      classCode: normalizeClassCode(raw.classCode || ""),
      courseName: normalizeSpace(raw.courseName),
      letter: normalizeSpace(raw.letter) || null,
      status: normalizeSpace(raw.status) || null,
      componentsBreakdown: raw.componentsBreakdown ?? null,
    };

    const key = [
      normalizeLoose(item.semester),
      normalizeLoose(item.courseCode),
      normalizeLoose(item.classCode),
    ].join("||");

    const existing = map.get(key);
    if (!existing) {
      map.set(key, item);
      continue;
    }

    map.set(key, mergeTranscriptItems(existing, item));
  }

  return Array.from(map.values());
}

router.post("/transcript", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const parsed = SyncTranscriptSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      message: "Invalid transcript payload",
      issues: parsed.error.issues,
    });
  }

  const payload = parsed.data;
  const cleanedItems = dedupeTranscriptPayloadItems(payload.items);

  const payloadHash = sha256Json({
    adapterKey: payload.adapterKey,
    adapterVersion: payload.adapterVersion,
    sourcePage: payload.sourcePage,
    items: cleanedItems,
  });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existed = await tx.importSession.findUnique({
        where: {
          uq_importsession_idempotent: {
            userId,
            adapterKey: payload.adapterKey,
            adapterVersion: payload.adapterVersion,
            payloadHash,
          },
        },
      });

      const importSession = existed
        ? existed
        : await tx.importSession.create({
            data: {
              userId,
              adapterKey: payload.adapterKey,
              adapterVersion: payload.adapterVersion,
              sourcePage: payload.sourcePage,
              status: ImportStatus.SUCCESS,
              payloadHash,
              startedAt: new Date(),
            },
          });

      // Quan trọng: luôn replace toàn bộ transcript hiện tại của user
      await tx.transcriptComponent.deleteMany({
        where: { userId },
      });

      await tx.transcript.deleteMany({
        where: { userId },
      });

      let inserted = 0;

      for (const item of cleanedItems) {
        const classCode = normalizeClassCode(item.classCode || "");
        const semester = normalizeSemester(item.semester);

        await tx.transcript.create({
          data: {
            userId,
            importId: importSession.id,
            courseCode: item.courseCode,
            classCode,
            courseName: item.courseName,
            credits: item.credits,
            semester,
            score10: item.score10 ?? null,
            letter: item.letter ?? null,
            gpa4: item.gpa4 ?? null,
            status: normalizeTranscriptStatus(
              item.status,
              item.score10,
              item.letter,
            ),
            componentsBreakdown: item.componentsBreakdown ?? null,
            adapterKey: payload.adapterKey,
            adapterVersion: payload.adapterVersion,
            sourcePage: payload.sourcePage,
            lastSyncedAt: new Date(),
          },
        });

        inserted++;
      }

      await tx.importSession.update({
        where: { id: importSession.id },
        data: {
          sourcePage: payload.sourcePage,
          status: ImportStatus.SUCCESS,
          startedAt: existed?.startedAt ?? new Date(),
          finishedAt: new Date(),
          recordCounts: {
            inserted,
            updated: 0,
            skipped: 0,
            total: cleanedItems.length,
            rawTotal: payload.items.length,
            mode: "replace_all_user_transcripts",
            reusedImportSession: !!existed,
          },
        },
      });

      return {
        alreadyImported: false,
        importId: importSession.id,
        counts: {
          inserted,
          updated: 0,
          skipped: 0,
        },
      };
    });

    return res.json({ ok: true, ...result });
  } catch (e: any) {
    return res.status(500).json({
      ok: false,
      message: "Transcript sync failed",
      error: e?.message ?? String(e),
    });
  }
});

router.post("/timetable", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const parsed = SyncTimetableSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      message: "Invalid payload",
      issues: parsed.error.issues,
    });
  }

  const payload = parsed.data;
  const payloadHash = sha256Json({
    adapterKey: payload.adapterKey,
    adapterVersion: payload.adapterVersion,
    sourcePage: payload.sourcePage,
    semester: payload.semester,
    items: payload.items,
  });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existed = await tx.importSession.findUnique({
        where: {
          uq_importsession_idempotent: {
            userId,
            adapterKey: payload.adapterKey,
            adapterVersion: payload.adapterVersion,
            payloadHash,
          },
        },
      });

      if (existed) {
        return {
          alreadyImported: true,
          importId: existed.id,
          counts: {
            inserted: 0,
            updated: 0,
            skipped: payload.items.length,
          },
        };
      }

      const importSession = await tx.importSession.create({
        data: {
          userId,
          adapterKey: payload.adapterKey,
          adapterVersion: payload.adapterVersion,
          sourcePage: payload.sourcePage,
          status: ImportStatus.SUCCESS,
          payloadHash,
          startedAt: new Date(),
        },
      });

      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      const skippedReasons = [];

      for (const it of payload.items) {
        const semesterLabel = String(it.semester || payload.semester).trim();
        const parsedWeek =
          parseWeekLabel(semesterLabel) || parseWeekLabel(it.weeksIncluded || "");

        if (!parsedWeek) {
          skipped++;
          skippedReasons.push({
            courseCode: it.courseCode,
            reason: `Không parse được tuần từ semester="${semesterLabel}" hoặc weeksIncluded.`,
          });
          continue;
        }

        const occurrenceDate = buildOccurrenceDate(
          parsedWeek.weekStartDate,
          it.dayOfWeek,
        );

        const where = {
          uq_timetable_occurrence: {
            userId,
            occurrenceDate,
            courseCode: it.courseCode,
            startTime: it.startTime,
            room: it.room,
          },
        } as const;

        const before = await tx.timetable.findUnique({ where });

        await tx.timetable.upsert({
          where,
          create: {
            userId,
            importId: importSession.id,
            semester: semesterLabel,
            weekLabel: parsedWeek.weekLabel,
            weekStartDate: parsedWeek.weekStartDate,
            weekEndDate: parsedWeek.weekEndDate,
            occurrenceDate,
            courseCode: it.courseCode,
            courseName: it.courseName ?? null,
            dayOfWeek: it.dayOfWeek,
            startTime: it.startTime,
            endTime: it.endTime,
            room: it.room,
            campus: it.campus ?? null,
            weeksIncluded:
              typeof it.weeksIncluded === "string" ? it.weeksIncluded : null,
            weeksCanceled:
              typeof it.weeksCanceled === "string" ? it.weeksCanceled : null,
            adapterKey: payload.adapterKey,
            adapterVersion: payload.adapterVersion,
            sourcePage: payload.sourcePage,
            lastSyncedAt: new Date(),
          },
          update: {
            importId: importSession.id,
            semester: semesterLabel,
            weekLabel: parsedWeek.weekLabel,
            weekStartDate: parsedWeek.weekStartDate,
            weekEndDate: parsedWeek.weekEndDate,
            courseName: it.courseName ?? null,
            dayOfWeek: it.dayOfWeek,
            endTime: it.endTime,
            campus: it.campus ?? null,
            weeksIncluded:
              typeof it.weeksIncluded === "string" ? it.weeksIncluded : null,
            weeksCanceled:
              typeof it.weeksCanceled === "string" ? it.weeksCanceled : null,
            adapterKey: payload.adapterKey,
            adapterVersion: payload.adapterVersion,
            sourcePage: payload.sourcePage,
            lastSyncedAt: new Date(),
          },
        });

        if (before) updated++;
        else inserted++;
      }

      await tx.importSession.update({
        where: { id: importSession.id },
        data: {
          finishedAt: new Date(),
          status: skipped > 0 ? ImportStatus.PARTIAL : ImportStatus.SUCCESS,
          recordCounts: {
            inserted,
            updated,
            skipped,
            total: payload.items.length,
          },
          diffSummary:
            skipped > 0
              ? {
                  skippedItems: skippedReasons,
                }
              : undefined,
        },
      });

      return {
        alreadyImported: false,
        importId: importSession.id,
        counts: {
          inserted,
          updated,
          skipped,
        },
      };
    });

    return res.json({ ok: true, ...result });
  } catch (e: any) {
    return res.status(500).json({
      ok: false,
      message: "Sync failed",
      error: e?.message ?? String(e),
    });
  }
});

router.get("/timetable", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const range = resolveTimetableDateRange(req.query);

    const items = await prisma.timetable.findMany({
      where: {
        userId,
        ...(range.mode === "all"
          ? {}
          : {
              occurrenceDate: {
                gte: range.from,
                lte: range.to,
              },
            }),
      },
      orderBy: [
        { occurrenceDate: "asc" },
        { startTime: "asc" },
        { courseCode: "asc" },
      ],
    });

    const lastSynced = await prisma.importSession.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        status: true,
        recordCounts: true,
      },
    });

    return res.json({
      ok: true,
      mode: range.mode,
      from: range.mode === "all" ? null : range.from,
      to: range.mode === "all" ? null : range.to,
      items,
      meta: {
        lastSyncedAt: lastSynced?.createdAt ?? null,
        lastSyncStatus: lastSynced?.status ?? null,
        lastSyncCounts: lastSynced?.recordCounts ?? null,
      },
    });
  } catch (e: any) {
    return res.status(400).json({
      ok: false,
      message: e?.message ?? "Invalid timetable query",
    });
  }
});

export default router;