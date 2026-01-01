// apps/api/src/routes/import.ts
import { CourseStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { sha256Payload } from "../utils/payloadHash";

export const importRouter = Router();

// Schema nhận payload từ extension
const ImportPayloadSchema = z.object({
  user: z.object({
    email: z.string().email(),
    name: z.string().optional(),
  }),
  meta: z.object({
    adapterKey: z.string().default("dtu"),
    adapterVersion: z.string().default("dtu.v1"),
    sourcePage: z.string().default("extension"),
  }),
  data: z.object({
    transcripts: z
      .array(
        z.object({
          courseCode: z.string(),
          courseName: z.string(),
          credits: z.number().int(),
          semester: z.string(),
          score10: z.number().optional().nullable(),
          letter: z.string().optional().nullable(),
          gpa4: z.number().optional().nullable(),
          status: z.string().optional().nullable(),
          componentsBreakdown: z.any().optional().nullable(),
        })
      )
      .default([]),

    timetables: z
      .array(
        z.object({
          semester: z.string(),
          courseCode: z.string(),
          courseName: z.string().optional().nullable(),
          dayOfWeek: z.number().int(),
          startTime: z.string(),
          endTime: z.string().optional().nullable(),
          room: z.string().optional().nullable(),
          campus: z.string().optional().nullable(),
          weeksIncluded: z.string().optional().nullable(),
          weeksCanceled: z.string().optional().nullable(),
        })
      )
      .default([]),
  }),
});

function score10ToGpa4(score10: number): number {
  if (score10 >= 8.5) return 4.0;
  if (score10 >= 8.0) return 3.5;
  if (score10 >= 7.0) return 3.0;
  if (score10 >= 6.5) return 2.5;
  if (score10 >= 5.5) return 2.0;
  if (score10 >= 5.0) return 1.5;
  if (score10 >= 4.0) return 1.0;
  return 0.0;
}

//  Map string -> Prisma enum CourseStatus
function normalizeStatus(input: string | null | undefined, score10: number | null): CourseStatus {
  const s = (input ?? "").toLowerCase().trim();

 if (s === "passed") return CourseStatus.passed;
if (s === "failed") return CourseStatus.failed;
if (s === "retaken") return CourseStatus.retaken;
if (s === "in_progress") return CourseStatus.in_progress;
if (s === "absent_final") return CourseStatus.absent_final;
if (s === "banned_final") return CourseStatus.banned_final;


  // fallback theo điểm nếu extension không gửi status
  if (typeof score10 === "number") {
    return score10 < 4 ? CourseStatus.failed : CourseStatus.passed;
  }
  return CourseStatus.unknown;
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
    userEmail: email,
    meta: payload.meta,
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

      // 2) Upsert ImportSession (idempotent)
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
          status: "SUCCESS",
          payloadHash,
          recordCounts: {
            transcript: payload.data.transcripts.length,
            timetable: payload.data.timetables.length,
          },
        },
        update: {
          sourcePage,
          status: "SUCCESS",
          recordCounts: {
            transcript: payload.data.transcripts.length,
            timetable: payload.data.timetables.length,
          },
        },
      });

      // 3) Upsert Transcript
      let transcriptsUpserted = 0;
      for (const t of payload.data.transcripts) {
        const score10 = t.score10 ?? null;
        const gpa4 =
          typeof t.gpa4 === "number"
            ? t.gpa4
            : score10 != null
            ? score10ToGpa4(score10)
            : null;

        const status = normalizeStatus(t.status, score10);

        await tx.transcript.upsert({
          where: {
            uq_transcript_natural: {
              userId: user.id,
              courseCode: t.courseCode,
              semester: t.semester,
            },
          },
          create: {
            userId: user.id,
            importId: importSession.id,
            courseCode: t.courseCode,
            courseName: t.courseName,
            credits: t.credits,
            semester: t.semester,
            score10,
            letter: t.letter ?? null,
            gpa4,
            status, //  enum
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
            letter: t.letter ?? null,
            gpa4,
            status, //  enum
            componentsBreakdown: t.componentsBreakdown ?? null,
            adapterKey,
            adapterVersion,
            sourcePage,
            lastSyncedAt: new Date(),
          },
        });

        transcriptsUpserted++;
      }

      // 4) Upsert Timetable
      let timetablesUpserted = 0;
      for (const s of payload.data.timetables) {
        const roomKey = s.room ?? ""; // unique key needs string
        const endTime = s.endTime ?? ""; //  vì Prisma đang là string (không nullable)

        await tx.timetable.upsert({
          where: {
            uq_timetable_natural: {
              userId: user.id,
              semester: s.semester,
              courseCode: s.courseCode,
              dayOfWeek: s.dayOfWeek,
              startTime: s.startTime,
              room: roomKey,
            },
          },
          create: {
            userId: user.id,
            importId: importSession.id,
            semester: s.semester,
            courseCode: s.courseCode,
            courseName: s.courseName ?? null,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime, // string
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
            endTime, //  string
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

      return {
        userId: user.id,
        importId: importSession.id,
        payloadHash,
        counts: {
          transcripts: transcriptsUpserted,
          timetables: timetablesUpserted,
        },
      };
    });

    return res.json({ ok: true, ...result });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e?.message ?? "Import failed" });
  }
});
