// path: apps/api/src/routes/sync.ts

import { ImportStatus } from "@prisma/client";
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
      const skippedReasons: Array<{ courseCode: string; reason: string }> = [];

      for (const it of payload.items) {
        const semesterLabel = String(it.semester || payload.semester).trim();
        const parsedWeek =
          parseWeekLabel(semesterLabel) ||
          parseWeekLabel(it.weeksIncluded || "");

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
          it.dayOfWeek
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
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
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