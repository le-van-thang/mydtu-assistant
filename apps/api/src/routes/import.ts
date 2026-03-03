// file: apps/api/src/routes/import.ts

import { ImportPayloadSchema, normalizeGpa4, normalizeSemesterKey } from "@mydtu/shared";
import { CourseStatus, ImportStatus, SectionType } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../db";
import { sha256Payload } from "../utils/payloadHash";

export const importRouter = Router();

function normalizeStatus(input: unknown, score10: number | null, letter: string | null): CourseStatus {
  const s = String(input ?? "").toLowerCase().trim();

  if (s === "passed") return CourseStatus.passed;
  if (s === "failed") return CourseStatus.failed;
  if (s === "retaken") return CourseStatus.retaken;
  if (s === "in_progress") return CourseStatus.in_progress;
  if (s === "absent_final") return CourseStatus.absent_final;
  if (s === "banned_final") return CourseStatus.banned_final;

  // fallback theo score10
  if (typeof score10 === "number") return score10 < 4 ? CourseStatus.failed : CourseStatus.passed;

  // fallback theo letter nếu thiếu score10
  const L = String(letter ?? "").trim().toUpperCase();
  if (L) {
    if (L === "F") return CourseStatus.failed;
    // các điểm không tính GPA kiểu P/I/X/R: coi như unknown để khỏi tính GPA
    if (L === "P" || L === "I" || L === "X" || L === "R") return CourseStatus.unknown;
    // còn lại coi như passed
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

importRouter.post("/", async (req, res) => {
  const parsed = ImportPayloadSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });

  const payload = parsed.data;
  const { email, name } = payload.user;
  const { adapterKey, adapterVersion, sourcePage } = payload.meta;

  // Hash idempotent: không dính email/name
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
        create: { email, name },
        update: { name: name ?? undefined },
      });

      // 2) check existing session (để trả idempotent)
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
      const idempotent = Boolean(existingSession);

      // 3) Upsert ImportSession
      const importSession = await tx.importSession.upsert({
        where: {
          uq_importsession_idempotent: {
            userId: user.id,
            adapterKey,
            adapterVersion,
            payloadHash,
          },
        },
        create: {
          userId: user.id,
          adapterKey,
          adapterVersion,
          sourcePage,
          status: ImportStatus.SUCCESS,
          payloadHash,
          recordCounts: {
            transcripts: payload.data.transcripts.length,
            timetables: payload.data.timetables.length,
            sections: payload.data.sections.length,
            evaluations: payload.data.evaluations.length,
          },
          finishedAt: new Date(),
        },
        update: {
          sourcePage,
          status: ImportStatus.SUCCESS,
          recordCounts: {
            transcripts: payload.data.transcripts.length,
            timetables: payload.data.timetables.length,
            sections: payload.data.sections.length,
            evaluations: payload.data.evaluations.length,
          },
          finishedAt: new Date(),
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
          status: status,
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

      // 5) Upsert Timetable
      let timetablesUpserted = 0;
      for (const s of payload.data.timetables) {
        const semesterKey = normalizeSemesterKey(s.semester);

        const roomKey = (s.room ?? "").trim();
        const endTime = (s.endTime ?? "").trim();

        await tx.timetable.upsert({
          where: {
            uq_timetable_natural: {
              userId: user.id,
              semester: semesterKey,
              courseCode: s.courseCode,
              dayOfWeek: s.dayOfWeek,
              startTime: s.startTime,
              room: roomKey,
            },
          },
          create: {
            userId: user.id,
            importId: importSession.id,
            semester: semesterKey,
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
          },
          update: {
            importId: importSession.id,
            courseName: s.courseName ?? null,
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

      return {
        userId: user.id,
        importId: importSession.id,
        payloadHash,
        idempotent,
        counts: {
          transcripts: transcriptsUpserted,
          timetables: timetablesUpserted,
          sections: sectionsUpserted,
          evaluations: evaluationsUpserted,
        },
      };
    });

    return res.json({ ok: true, ...result });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e?.message ?? "Import failed" });
  }
});
