// path: apps/api/src/routes/importExams.ts
import {
  ExamParseStatus,
  ExamPlanType,
  ImportStatus,
  Prisma,
} from "@prisma/client";
import { Router } from "express";
import crypto from "node:crypto";
import { prisma } from "../db";

export const importExamsRouter = Router();

type ExamNoticeInput = {
  title: string;
  rawTitle?: string | null;
  sourceText?: string | null;
  courseCodeHint?: string | null;
  courseNameHint?: string | null;
  detailUrl: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  publishedAtRaw?: string | null;
  publishedAt?: string | null;
  planType?: "tentative" | "official";
  parseStatus?: "parsed" | "partial" | "failed";
  detailText?: string | null;
  parseError?: string | null;
  records?: ExamRecordInput[];
};

type ExamRecordInput = {
  noticeTitle: string;
  publishedAtRaw?: string | null;
  publishedAtDate?: string | null;
  detailUrl: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  courseCode: string;
  courseName?: string | null;
  examDate?: string | null;
  examDateRaw?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  room?: string | null;
  campus?: string | null;
  examMetaRaw?: string | null;
  studentId?: string | null;
  studentName?: string | null;
  classCourse?: string | null;
  classStudent?: string | null;
  birthDateRaw?: string | null;
  birthDate?: string | null;
  note?: string | null;
  planType?: "tentative" | "official";
  parseStatus?: "parsed" | "partial" | "failed";
  parseError?: string | null;
  rawRow?: unknown;
};

type ImportExamBody = {
  userId: string;
  adapterKey: string;
  adapterVersion: string;
  sourcePage: string;
  notices: ExamNoticeInput[];
};

function sha256(input: unknown) {
  return crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function toDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toPlanType(value?: string | null): ExamPlanType {
  return value === "tentative" ? ExamPlanType.tentative : ExamPlanType.official;
}

function toParseStatus(value?: string | null): ExamParseStatus {
  if (value === "failed") return ExamParseStatus.failed;
  if (value === "partial") return ExamParseStatus.partial;
  return ExamParseStatus.parsed;
}

function toNullableJson(
  value: unknown
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;

  try {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  } catch {
    return Prisma.JsonNull;
  }
}

importExamsRouter.post("/", async (req, res) => {
  try {
    const body = req.body as ImportExamBody;

    if (
      !body?.userId ||
      !body?.adapterKey ||
      !body?.adapterVersion ||
      !body?.sourcePage
    ) {
      return res.status(400).json({
        ok: false,
        error: "Missing required fields: userId, adapterKey, adapterVersion, sourcePage",
      });
    }

    if (!Array.isArray(body.notices)) {
      return res.status(400).json({
        ok: false,
        error: "notices must be an array",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: body.userId },
      select: { id: true },
    });

    if (!existingUser) {
      return res.status(400).json({
        ok: false,
        error: `Invalid userId: ${body.userId}`,
      });
    }

    const payloadHash = sha256({
      adapterKey: body.adapterKey,
      adapterVersion: body.adapterVersion,
      sourcePage: body.sourcePage,
      notices: body.notices.map((n) => ({
        detailUrl: n.detailUrl,
        attachmentUrl: n.attachmentUrl,
        publishedAtRaw: n.publishedAtRaw,
        title: n.title,
        recordsCount: Array.isArray(n.records) ? n.records.length : 0,
      })),
    });

    const result = await prisma.$transaction(
      async (tx) => {
        const importSession = await tx.importSession.upsert({
          where: {
            uq_importsession_idempotent: {
              userId: body.userId,
              adapterKey: body.adapterKey,
              adapterVersion: body.adapterVersion,
              payloadHash,
            },
          },
          update: {
            finishedAt: new Date(),
            status: ImportStatus.SUCCESS,
          },
          create: {
            userId: body.userId,
            adapterKey: body.adapterKey,
            adapterVersion: body.adapterVersion,
            sourcePage: body.sourcePage,
            payloadHash,
            status: ImportStatus.SUCCESS,
            startedAt: new Date(),
            finishedAt: new Date(),
          },
        });

        let noticesUpserted = 0;
        let recordsUpserted = 0;

        for (const notice of body.notices) {
          const noticeHash = sha256({
            detailUrl: notice.detailUrl,
            attachmentUrl: notice.attachmentUrl,
            title: notice.title,
            publishedAtRaw: notice.publishedAtRaw,
            planType: notice.planType,
          });

          const savedNotice = await tx.examNotice.upsert({
            where: {
              uq_exam_notice_hash: {
                userId: body.userId,
                noticeHash,
              },
            },
            update: {
              importId: importSession.id,
              title: notice.title,
              rawTitle: notice.rawTitle ?? null,
              sourceText: notice.sourceText ?? null,
              courseCodeHint: notice.courseCodeHint ?? null,
              courseNameHint: notice.courseNameHint ?? null,
              detailUrl: notice.detailUrl,
              attachmentUrl: notice.attachmentUrl ?? null,
              attachmentName: notice.attachmentName ?? null,
              publishedAtRaw: notice.publishedAtRaw ?? null,
              publishedAt: toDate(notice.publishedAt),
              planType: toPlanType(notice.planType),
              parseStatus: toParseStatus(notice.parseStatus),
              detailText: notice.detailText ?? null,
              parseError: notice.parseError ?? null,
              sourcePage: body.sourcePage,
              adapterKey: body.adapterKey,
              adapterVersion: body.adapterVersion,
              isLatest: true,
              isSuperseded: false,
              supersededAt: null,
              supersededReason: null,
              lastSyncedAt: new Date(),
            },
            create: {
              userId: body.userId,
              importId: importSession.id,
              title: notice.title,
              rawTitle: notice.rawTitle ?? null,
              sourceText: notice.sourceText ?? null,
              courseCodeHint: notice.courseCodeHint ?? null,
              courseNameHint: notice.courseNameHint ?? null,
              detailUrl: notice.detailUrl,
              attachmentUrl: notice.attachmentUrl ?? null,
              attachmentName: notice.attachmentName ?? null,
              publishedAtRaw: notice.publishedAtRaw ?? null,
              publishedAt: toDate(notice.publishedAt),
              planType: toPlanType(notice.planType),
              parseStatus: toParseStatus(notice.parseStatus),
              detailText: notice.detailText ?? null,
              parseError: notice.parseError ?? null,
              sourcePage: body.sourcePage,
              adapterKey: body.adapterKey,
              adapterVersion: body.adapterVersion,
              noticeHash,
              isLatest: true,
              isSuperseded: false,
              lastSyncedAt: new Date(),
            },
          });

          noticesUpserted++;

          const records = Array.isArray(notice.records) ? notice.records : [];

          for (const record of records) {
            const recordHash = sha256({
              detailUrl: record.detailUrl,
              courseCode: record.courseCode,
              examDate: record.examDate,
              startTime: record.startTime,
              room: record.room,
              studentId: record.studentId,
            });

            await tx.examRecord.upsert({
              where: {
                uq_exam_record_hash: {
                  userId: body.userId,
                  recordHash,
                },
              },
              update: {
                importId: importSession.id,
                noticeId: savedNotice.id,
                planType: toPlanType(record.planType ?? notice.planType),
                parseStatus: toParseStatus(record.parseStatus),
                noticeTitle: record.noticeTitle,
                publishedAtRaw: record.publishedAtRaw ?? null,
                publishedAtDate: toDate(record.publishedAtDate),
                detailUrl: record.detailUrl,
                attachmentUrl: record.attachmentUrl ?? null,
                attachmentName: record.attachmentName ?? null,
                courseCode: record.courseCode,
                courseName: record.courseName ?? null,
                examDate: toDate(record.examDate),
                examDateRaw: record.examDateRaw ?? null,
                startTime: record.startTime ?? null,
                endTime: record.endTime ?? null,
                room: record.room ?? null,
                campus: record.campus ?? null,
                examMetaRaw: record.examMetaRaw ?? null,
                studentId: record.studentId ?? null,
                studentName: record.studentName ?? null,
                classCourse: record.classCourse ?? null,
                classStudent: record.classStudent ?? null,
                birthDateRaw: record.birthDateRaw ?? null,
                birthDate: toDate(record.birthDate),
                note: record.note ?? null,
                rawRow: toNullableJson(record.rawRow),
                parseError: record.parseError ?? null,
                isLatest: true,
                isSuperseded: false,
                supersededAt: null,
                supersededReason: null,
                sourcePage: body.sourcePage,
                adapterKey: body.adapterKey,
                adapterVersion: body.adapterVersion,
                lastSyncedAt: new Date(),
              },
              create: {
                userId: body.userId,
                importId: importSession.id,
                noticeId: savedNotice.id,
                planType: toPlanType(record.planType ?? notice.planType),
                parseStatus: toParseStatus(record.parseStatus),
                noticeTitle: record.noticeTitle,
                publishedAtRaw: record.publishedAtRaw ?? null,
                publishedAtDate: toDate(record.publishedAtDate),
                detailUrl: record.detailUrl,
                attachmentUrl: record.attachmentUrl ?? null,
                attachmentName: record.attachmentName ?? null,
                courseCode: record.courseCode,
                courseName: record.courseName ?? null,
                examDate: toDate(record.examDate),
                examDateRaw: record.examDateRaw ?? null,
                startTime: record.startTime ?? null,
                endTime: record.endTime ?? null,
                room: record.room ?? null,
                campus: record.campus ?? null,
                examMetaRaw: record.examMetaRaw ?? null,
                studentId: record.studentId ?? null,
                studentName: record.studentName ?? null,
                classCourse: record.classCourse ?? null,
                classStudent: record.classStudent ?? null,
                birthDateRaw: record.birthDateRaw ?? null,
                birthDate: toDate(record.birthDate),
                note: record.note ?? null,
                rawRow: toNullableJson(record.rawRow),
                recordHash,
                sourcePage: body.sourcePage,
                adapterKey: body.adapterKey,
                adapterVersion: body.adapterVersion,
                parseError: record.parseError ?? null,
                isLatest: true,
                isSuperseded: false,
                lastSyncedAt: new Date(),
              },
            });

            recordsUpserted++;
          }
        }

        await tx.importSession.update({
          where: { id: importSession.id },
          data: {
            status: ImportStatus.SUCCESS,
            finishedAt: new Date(),
            recordCounts: {
              examNotices: noticesUpserted,
              examRecords: recordsUpserted,
            },
          },
        });

        return {
          importId: importSession.id,
          noticesUpserted,
          recordsUpserted,
        };
      },
      {
        maxWait: 10_000,
        timeout: 120_000,
      }
    );

    return res.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: String((error as Error)?.message || error),
    });
  }
});