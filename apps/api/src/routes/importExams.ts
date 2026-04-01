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
  sheetName?: string | null;
  sheetIndex?: number | null;
  rowIndex?: number | null;
  sessionOrder?: number | null;
  recordOrder?: number | null;
};

type ImportExamBody = {
  userId: string;
  adapterKey: string;
  adapterVersion: string;
  sourcePage: string;
  notices: ExamNoticeInput[];
};

const RECORD_CHUNK_SIZE = 200;

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
  value: unknown,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;

  try {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  } catch {
    return Prisma.JsonNull;
  }
}

function normalizeNoticeForHash(notice: ExamNoticeInput) {
  return {
    detailUrl: notice.detailUrl,
    attachmentUrl: notice.attachmentUrl ?? null,
    attachmentName: notice.attachmentName ?? null,
    title: notice.title,
    publishedAtRaw: notice.publishedAtRaw ?? null,
    planType: notice.planType ?? "official",
    parseStatus: notice.parseStatus ?? "parsed",
    recordsCount: Array.isArray(notice.records) ? notice.records.length : 0,
  };
}

function normalizeRecordForHash(record: ExamRecordInput) {
  return {
    detailUrl: record.detailUrl,
    courseCode: record.courseCode,
    examDate: record.examDate ?? null,
    startTime: record.startTime ?? null,
    endTime: record.endTime ?? null,
    room: record.room ?? null,
    campus: record.campus ?? null,
    studentId: record.studentId ?? null,
    studentName: record.studentName ?? null,
    classCourse: record.classCourse ?? null,
    classStudent: record.classStudent ?? null,
    birthDate: record.birthDate ?? null,
    note: record.note ?? null,
    planType: record.planType ?? "official",
    sheetName: record.sheetName ?? null,
    sheetIndex: record.sheetIndex ?? null,
    rowIndex: record.rowIndex ?? null,
    sessionOrder: record.sessionOrder ?? null,
    recordOrder: record.recordOrder ?? null,
  };
}

function chunkArray<T>(items: T[], size: number) {
  if (size <= 0) return [items];
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

function buildNoticeData(params: {
  body: ImportExamBody;
  notice: ExamNoticeInput;
  importId: string;
  noticeHash: string;
}) {
  const { body, notice, importId, noticeHash } = params;

  return {
    importId,
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
    supersededAt: null,
    supersededReason: null,
    lastSyncedAt: new Date(),
  };
}

function buildRecordCreateData(params: {
  body: ImportExamBody;
  record: ExamRecordInput;
  notice: ExamNoticeInput;
  userId: string;
  importId: string;
  noticeId: string;
  recordHash: string;
}) {
  const { body, record, notice, userId, importId, noticeId, recordHash } = params;

  return {
    userId,
    importId,
    noticeId,
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
    recordHash,
    rawRow: toNullableJson(record.rawRow),
    sourcePage: body.sourcePage,
    adapterKey: body.adapterKey,
    adapterVersion: body.adapterVersion,
    parseError: record.parseError ?? null,
    isLatest: true,
    isSuperseded: false,
    supersededAt: null,
    supersededReason: null,
    lastSyncedAt: new Date(),
  };
}

function buildRecordUpdateData(params: {
  body: ImportExamBody;
  record: ExamRecordInput;
  notice: ExamNoticeInput;
  importId: string;
  noticeId: string;
}) {
  const { body, record, notice, importId, noticeId } = params;

  return {
    importId,
    noticeId,
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
    sourcePage: body.sourcePage,
    adapterKey: body.adapterKey,
    adapterVersion: body.adapterVersion,
    parseError: record.parseError ?? null,
    isLatest: true,
    isSuperseded: false,
    supersededAt: null,
    supersededReason: null,
    lastSyncedAt: new Date(),
  };
}

async function upsertNotice(params: {
  body: ImportExamBody;
  userId: string;
  importId: string;
  notice: ExamNoticeInput;
}) {
  const { body, userId, importId, notice } = params;

  const noticeHash = sha256(normalizeNoticeForHash(notice));
  const noticeData = buildNoticeData({
    body,
    notice,
    importId,
    noticeHash,
  });

  const existingNotice = await prisma.examNotice.findUnique({
    where: {
      uq_exam_notice_detail: {
        userId,
        detailUrl: notice.detailUrl,
      },
    },
    select: { id: true },
  });

  if (existingNotice) {
    return prisma.examNotice.update({
      where: { id: existingNotice.id },
      data: noticeData,
      select: { id: true },
    });
  }

  return prisma.examNotice.create({
    data: {
      userId,
      ...noticeData,
    },
    select: { id: true },
  });
}

async function syncRecordChunk(params: {
  body: ImportExamBody;
  userId: string;
  importId: string;
  notice: ExamNoticeInput;
  noticeId: string;
  records: ExamRecordInput[];
}) {
  const { body, userId, importId, notice, noticeId, records } = params;

  if (!records.length) {
    return {
      recordsUpserted: 0,
      recordsFailed: 0,
    };
  }

  const prepared = records.map((record) => ({
    record,
    recordHash: sha256(normalizeRecordForHash(record)),
  }));

  const existing = await prisma.examRecord.findMany({
    where: {
      userId,
      recordHash: {
        in: prepared.map((x) => x.recordHash),
      },
    },
    select: {
      id: true,
      recordHash: true,
    },
  });

  const existingMap = new Map(existing.map((x) => [x.recordHash, x.id]));
  const toCreate = prepared.filter((x) => !existingMap.has(x.recordHash));
  const toUpdate = prepared.filter((x) => existingMap.has(x.recordHash));

  let recordsUpserted = 0;
  let recordsFailed = 0;

  if (toCreate.length) {
    try {
      await prisma.examRecord.createMany({
        data: toCreate.map(({ record, recordHash }) =>
          buildRecordCreateData({
            body,
            record,
            notice,
            userId,
            importId,
            noticeId,
            recordHash,
          }),
        ),
        skipDuplicates: true,
      });

      recordsUpserted += toCreate.length;
    } catch {
      for (const { record, recordHash } of toCreate) {
        try {
          await prisma.examRecord.create({
            data: buildRecordCreateData({
              body,
              record,
              notice,
              userId,
              importId,
              noticeId,
              recordHash,
            }),
          });
          recordsUpserted += 1;
        } catch {
          recordsFailed += 1;
        }
      }
    }
  }

  for (const { record, recordHash } of toUpdate) {
    try {
      const id = existingMap.get(recordHash);
      if (!id) {
        recordsFailed += 1;
        continue;
      }

      await prisma.examRecord.update({
        where: { id },
        data: buildRecordUpdateData({
          body,
          record,
          notice,
          importId,
          noticeId,
        }),
      });

      recordsUpserted += 1;
    } catch {
      recordsFailed += 1;
    }
  }

  return {
    recordsUpserted,
    recordsFailed,
  };
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
        error:
          "Missing required fields: userId, adapterKey, adapterVersion, sourcePage",
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
      notices: body.notices.map(normalizeNoticeForHash),
    });

    const importSession = await prisma.importSession.upsert({
      where: {
        uq_importsession_idempotent: {
          userId: body.userId,
          adapterKey: body.adapterKey,
          adapterVersion: body.adapterVersion,
          payloadHash,
        },
      },
      update: {
        status: ImportStatus.SUCCESS,
        finishedAt: new Date(),
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
      select: { id: true },
    });

    let noticesUpserted = 0;
    let recordsUpserted = 0;
    let recordsFailed = 0;

    for (const notice of body.notices) {
      const savedNotice = await upsertNotice({
        body,
        userId: body.userId,
        importId: importSession.id,
        notice,
      });

      noticesUpserted += 1;

      const records = Array.isArray(notice.records) ? notice.records : [];
      const recordChunks = chunkArray(records, RECORD_CHUNK_SIZE);

      for (const recordChunk of recordChunks) {
        const result = await syncRecordChunk({
          body,
          userId: body.userId,
          importId: importSession.id,
          notice,
          noticeId: savedNotice.id,
          records: recordChunk,
        });

        recordsUpserted += result.recordsUpserted;
        recordsFailed += result.recordsFailed;
      }
    }

    const finalStatus =
      recordsFailed > 0 ? ImportStatus.PARTIAL : ImportStatus.SUCCESS;

    await prisma.importSession.update({
      where: { id: importSession.id },
      data: {
        status: finalStatus,
        finishedAt: new Date(),
        recordCounts: {
          noticesUpserted,
          recordsUpserted,
          recordsFailed,
        },
      },
    });

    return res.json({
      ok: true,
      importId: importSession.id,
      noticesUpserted,
      recordsUpserted,
      recordsFailed,
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: error?.message || "Import exams failed",
    });
  }
});