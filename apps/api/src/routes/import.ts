// path: apps/api/src/routes/import.ts

import { ImportPayloadSchema, normalizeGpa4, normalizeSemesterKey } from "@mydtu/shared";
import { CourseStatus, ImportStatus, SectionType } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../db";
import { buildOccurrenceDate, parseWeekLabel } from "../services/timetable/expandOccurrences";
import { sha256Payload } from "../utils/payloadHash";

export const importRouter = Router();

// mật khẩu placeholder đã hash bcrypt, chỉ dùng cho user được tạo bởi import
// không dùng để login thật
const IMPORT_PLACEHOLDER_PASSWORD_HASH =
  "$2b$10$8m7VY6m2G2H5f9fG1mS1KOPx5mDqRj0m2QW5f3QG4Oe2s7Y7wM8dK";

// ngày sinh placeholder để satisfy schema hiện tại
const IMPORT_PLACEHOLDER_BIRTHDATE = new Date("2000-01-01T00:00:00.000Z");

function normalizeStatus(input: unknown, score10: number | null, letter: string | null): CourseStatus {
  const s = String(input ?? "").toLowerCase().trim();

  if (s === "passed") return CourseStatus.passed;
  if (s === "failed") return CourseStatus.failed;
  if (s === "retaken") return CourseStatus.retaken;
  if (s === "in_progress") return CourseStatus.in_progress;
  if (s === "absent_final") return CourseStatus.absent_final;
  if (s === "banned_final") return CourseStatus.banned_final;

  if (typeof score10 === "number") return score10 < 4 ? CourseStatus.failed : CourseStatus.passed;

  const L = String(letter ?? "").trim().toUpperCase();
  if (L) {
    if (L === "F") return CourseStatus.failed;
    if (L === "P" || L === "I" || L === "X" || L === "R") return CourseStatus.unknown;
    return CourseStatus.passed;
  }

  return CourseStatus.unknown;
}

function normalizeSectionType(t: unknown): SectionType {
  const s = String(t ?? "").toUpperCase().trim();
  if (s === "LEC") return SectionType.LEC;
  if (s === "LAB") return SectionType.LAB;
  return SectionType.OTHER;
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveWeekInfo(input: {
  semester?: unknown;
  weeksIncluded?: unknown;
  fallbackSemester?: unknown;
}) {
  const candidates = [
    toNonEmptyString(input.semester),
    toNonEmptyString(input.weeksIncluded),
    toNonEmptyString(input.fallbackSemester),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const parsed = parseWeekLabel(candidate);
    if (parsed) {
      return {
        semesterLabel: candidate,
        weekLabel: parsed.weekLabel,
        weekStartDate: parsed.weekStartDate,
        weekEndDate: parsed.weekEndDate,
      };
    }
  }

  return null;
}

importRouter.post("/", async (req, res) => {
  const parsed = ImportPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const payload = parsed.data;
  const { email, name } = payload.user;
  const { adapterKey, adapterVersion, sourcePage } = payload.meta;

  const payloadHash = sha256Payload({
    adapterKey,
    adapterVersion,
    sourcePage,
    data: payload.data,
  });

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1) Upsert User
      const user = await tx.user.upsert({
        where: { email },
        create: {
          email,
          name,
          password: IMPORT_PLACEHOLDER_PASSWORD_HASH,
          birthDate: IMPORT_PLACEHOLDER_BIRTHDATE,
        },
        update: {
          name: name ?? undefined,
        },
      });

      // 2) Check existing session (idempotent)
      const existingSession = await tx.importSession.findUnique({
        where: {
          uq_importsession_idempotent: {
            userId: user.id,
            adapterKey,
            adapterVersion,
            payloadHash,
          },
        },
      });

      if (existingSession) {
        return {
          userId: user.id,
          importId: existingSession.id,
          payloadHash,
          idempotent: true,
          counts: existingSession.recordCounts ?? {
            transcripts: 0,
            timetables: 0,
            timetablesSkipped: 0,
            sections: 0,
            evaluations: 0,
          },
        };
      }

      // 3) Create ImportSession trước, update counts ở cuối
      const importSession = await tx.importSession.create({
        data: {
          userId: user.id,
          adapterKey,
          adapterVersion,
          sourcePage,
          status: ImportStatus.SUCCESS,
          payloadHash,
          startedAt: new Date(),
        },
      });

      // 4) Upsert Transcript
      let transcriptsUpserted = 0;
      for (const t of payload.data.transcripts) {
        const score10 = t.score10 ?? null;
        const letter = t.letter ?? null;
        const semesterKey = normalizeSemesterKey(t.semester);

        const status = normalizeStatus(t.status, score10, letter);
        const g = normalizeGpa4({
          gpa4: t.gpa4 ?? null,
          letter,
          score10,
          status,
        });

        await tx.transcript.upsert({
          where: {
            uq_transcript_natural: {
              userId: user.id,
              courseCode: t.courseCode,
              semester: semesterKey,
            },
          },
          create: {
            userId: user.id,
            importId: importSession.id,
            courseCode: t.courseCode,
            courseName: t.courseName,
            credits: t.credits,
            semester: semesterKey,
            score10,
            letter,
            gpa4: g.gpa4,
            status,
            componentsBreakdown: t.componentsBreakdown ?? null,
            adapterKey,
            adapterVersion,
            sourcePage,
          },
          update: {
            importId: importSession.id,
            courseName: t.courseName,
            credits: t.credits,
            score10,
            letter,
            gpa4: g.gpa4,
            status,
            componentsBreakdown: t.componentsBreakdown ?? null,
            adapterKey,
            adapterVersion,
            sourcePage,
            lastSyncedAt: new Date(),
          },
        });

        transcriptsUpserted++;
      }

      // 5) Upsert Timetable theo schema mới
      let timetablesUpserted = 0;
      let timetablesSkipped = 0;

      const timetableSkipReasons: Array<{
        courseCode: string;
        semester?: string | null;
        reason: string;
      }> = [];

      for (const s of payload.data.timetables) {
        const roomKey = String(s.room ?? "").trim();
        const endTime = String(s.endTime ?? "").trim();

        const weekInfo = resolveWeekInfo({
          semester: s.semester,
          weeksIncluded: s.weeksIncluded,
          fallbackSemester: payload.meta?.sourcePage,
        });

        if (!weekInfo) {
          timetablesSkipped++;
          timetableSkipReasons.push({
            courseCode: s.courseCode,
            semester: toNonEmptyString(s.semester),
            reason:
              'Không parse được tuần. Cần chuỗi dạng "Tuần 30: 02/03/2026 - 08/03/2026" trong semester hoặc weeksIncluded.',
          });
          continue;
        }

        const occurrenceDate = buildOccurrenceDate(weekInfo.weekStartDate, s.dayOfWeek);

        await tx.timetable.upsert({
          where: {
            uq_timetable_occurrence: {
              userId: user.id,
              occurrenceDate,
              courseCode: s.courseCode,
              startTime: s.startTime,
              room: roomKey,
            },
          },
          create: {
            userId: user.id,
            importId: importSession.id,

            semester: weekInfo.semesterLabel,
            weekLabel: weekInfo.weekLabel,
            weekStartDate: weekInfo.weekStartDate,
            weekEndDate: weekInfo.weekEndDate,
            occurrenceDate,

            courseCode: s.courseCode,
            courseName: s.courseName ?? null,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime,
            room: roomKey,
            campus: s.campus ?? null,
            weeksIncluded: s.weeksIncluded ?? null,
            weeksCanceled: s.weeksCanceled ?? null,

            adapterKey,
            adapterVersion,
            sourcePage,
            lastSyncedAt: new Date(),
          },
          update: {
            importId: importSession.id,

            semester: weekInfo.semesterLabel,
            weekLabel: weekInfo.weekLabel,
            weekStartDate: weekInfo.weekStartDate,
            weekEndDate: weekInfo.weekEndDate,

            courseName: s.courseName ?? null,
            dayOfWeek: s.dayOfWeek,
            endTime,
            campus: s.campus ?? null,
            weeksIncluded: s.weeksIncluded ?? null,
            weeksCanceled: s.weeksCanceled ?? null,

            adapterKey,
            adapterVersion,
            sourcePage,
            lastSyncedAt: new Date(),
          },
        });

        timetablesUpserted++;
      }

      // 6) Upsert ClassSection
      let sectionsUpserted = 0;
      for (const sec of payload.data.sections) {
        const semesterKey = normalizeSemesterKey(sec.semester);

        await tx.classSection.upsert({
          where: {
            uq_section_natural: {
              userId: user.id,
              semester: semesterKey,
              classCode: sec.classCode,
            },
          },
          create: {
            userId: user.id,
            importId: importSession.id,
            semester: semesterKey,
            classCode: sec.classCode,
            courseCode: sec.courseCode,
            credits: sec.credits,
            type: normalizeSectionType(sec.type),
            capacityStatus: sec.capacityStatus,
            note: sec.note ?? null,
            scheduleSlots: sec.scheduleSlots ?? null,
            weeksIncluded: sec.weeksIncluded ?? null,
            weeksCanceled: sec.weeksCanceled ?? null,
            adapterKey,
            adapterVersion,
            sourcePage,
          },
          update: {
            importId: importSession.id,
            courseCode: sec.courseCode,
            credits: sec.credits,
            type: normalizeSectionType(sec.type),
            capacityStatus: sec.capacityStatus,
            note: sec.note ?? null,
            scheduleSlots: sec.scheduleSlots ?? null,
            weeksIncluded: sec.weeksIncluded ?? null,
            weeksCanceled: sec.weeksCanceled ?? null,
            adapterKey,
            adapterVersion,
            sourcePage,
            lastSyncedAt: new Date(),
          },
        });

        sectionsUpserted++;
      }

      // 7) Upsert EvaluationDraft
      let evaluationsUpserted = 0;
      for (const ev of payload.data.evaluations) {
        const semesterKey = normalizeSemesterKey(ev.semester);

        const existing = await tx.evaluationDraft.findFirst({
          where: {
            userId: user.id,
            semester: semesterKey,
            lecturer: ev.lecturer,
            courseCode: ev.courseCode,
          },
        });

        if (!existing) {
          await tx.evaluationDraft.create({
            data: {
              userId: user.id,
              importId: importSession.id,
              semester: semesterKey,
              lecturer: ev.lecturer,
              courseCode: ev.courseCode,
              courseName: ev.courseName ?? null,
              answers: ev.answers,
              adapterKey,
              adapterVersion,
              sourcePage,
            },
          });
        } else {
          await tx.evaluationDraft.update({
            where: { id: existing.id },
            data: {
              importId: importSession.id,
              courseName: ev.courseName ?? null,
              answers: ev.answers,
              adapterKey,
              adapterVersion,
              sourcePage,
              lastSyncedAt: new Date(),
            },
          });
        }

        evaluationsUpserted++;
      }

      const finalStatus =
        timetablesSkipped > 0 ? ImportStatus.PARTIAL : ImportStatus.SUCCESS;

      const recordCounts = {
        transcripts: transcriptsUpserted,
        timetables: timetablesUpserted,
        timetablesSkipped,
        sections: sectionsUpserted,
        evaluations: evaluationsUpserted,
      };

      const diffSummaryValue =
        timetablesSkipped > 0
          ? {
              skippedTimetables: timetableSkipReasons,
            }
          : undefined;

      await tx.importSession.update({
        where: { id: importSession.id },
        data: {
          status: finalStatus,
          recordCounts,
          diffSummary: diffSummaryValue,
          finishedAt: new Date(),
        },
      });

      return {
        userId: user.id,
        importId: importSession.id,
        payloadHash,
        idempotent: false,
        counts: recordCounts,
      };
    });

    return res.json({ ok: true, ...result });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e?.message ?? "Import failed" });
  }
});