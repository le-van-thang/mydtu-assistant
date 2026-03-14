import type { ExamNoticeFromExtension } from "@/lib/extensionBridge";
import type { ParsedExamRecord } from "./parseWorkbook";

export type ExamsApiRecord = {
  id: string;
  planType: "tentative" | "official";
  parseStatus?: "parsed" | "partial" | "failed";

  noticeTitle: string;
  publishedAtRaw: string | null;
  publishedAtDate: string | null;

  detailUrl: string;
  attachmentUrl: string | null;
  attachmentName: string | null;

  courseCode: string;
  courseName: string | null;

  examDate: string | null;
  examDateRaw?: string | null;
  startTime: string | null;
  endTime: string | null;

  room: string | null;
  campus: string | null;
  examMetaRaw: string | null;

  studentId: string | null;
  studentName: string | null;

  classCourse: string | null;
  classStudent: string | null;

  birthDate: string | null;
  birthDateRaw?: string | null;
  note: string | null;
};

export type ImportExamNoticePayload = {
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
  records?: Array<{
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
  }>;
};

export type ImportExamsBody = {
  userId: string;
  adapterKey: string;
  adapterVersion: string;
  sourcePage: string;
  notices: ImportExamNoticePayload[];
};

type ApiListExamsResponse = {
  ok: boolean;
  items: Array<{
    id: string;
    planType: "tentative" | "official";
    parseStatus: "parsed" | "partial" | "failed";
    noticeTitle: string;
    publishedAtRaw: string | null;
    publishedAtDate: string | null;
    detailUrl: string;
    attachmentUrl: string | null;
    attachmentName: string | null;
    courseCode: string;
    courseName: string | null;
    examDate: string | null;
    examDateRaw: string | null;
    startTime: string | null;
    endTime: string | null;
    room: string | null;
    campus: string | null;
    examMetaRaw: string | null;
    studentId: string | null;
    studentName: string | null;
    classCourse: string | null;
    classStudent: string | null;
    birthDateRaw: string | null;
    birthDate: string | null;
    note: string | null;
    sourcePage: string;
    adapterKey: string;
    adapterVersion: string;
    parseError: string | null;
    lastSyncedAt: string;
    createdAt: string;
    updatedAt: string;
  }>;
  error?: string;
};

type ApiImportExamsResponse = {
  ok: boolean;
  importId?: string;
  noticesUpserted?: number;
  recordsUpserted?: number;
  error?: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:4000";

const IMPORT_NOTICE_BATCH_SIZE = 4;

function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

function isHtmlLike(value: string) {
  const s = String(value || "").trim().toLowerCase();
  return s.startsWith("<!doctype html") || s.startsWith("<html") || s.includes("<body");
}

function toSafeErrorMessage(input: unknown, fallback: string) {
  const raw = String(input ?? "").trim();
  if (!raw) return fallback;
  if (isHtmlLike(raw)) return fallback;
  return raw;
}

function assertOk<T extends { ok: boolean; error?: string }>(json: T): T {
  if (!json.ok) {
    throw new Error(toSafeErrorMessage(json.error, "Request failed"));
  }
  return json;
}

function chunkArray<T>(items: T[], size: number) {
  if (size <= 0) return [items];

  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

export function mapDbRecordToParsedRecord(
  item: ApiListExamsResponse["items"][number]
): ParsedExamRecord {
  return {
    id: item.id,
    planType: item.planType,
    noticeTitle: item.noticeTitle,
    publishedAtRaw: item.publishedAtRaw,
    publishedAtDate: item.publishedAtDate,
    detailUrl: item.detailUrl,
    attachmentUrl: item.attachmentUrl,
    attachmentName: item.attachmentName,
    courseCode: item.courseCode,
    courseName: item.courseName,
    examDate: item.examDate,
    startTime: item.startTime,
    endTime: item.endTime,
    room: item.room,
    campus: item.campus,
    examMetaRaw: item.examMetaRaw,
    studentId: item.studentId,
    studentName: item.studentName,
    classCourse: item.classCourse,
    classStudent: item.classStudent,
    birthDate: item.birthDate,
    note: item.note,
  };
}

export function mapParsedRecordToImportRecord(record: ParsedExamRecord) {
  return {
    noticeTitle: record.noticeTitle,
    publishedAtRaw: record.publishedAtRaw,
    publishedAtDate: record.publishedAtDate,
    detailUrl: record.detailUrl,
    attachmentUrl: record.attachmentUrl,
    attachmentName: record.attachmentName,
    courseCode: record.courseCode,
    courseName: record.courseName,
    examDate: record.examDate,
    examDateRaw: record.examDate,
    startTime: record.startTime,
    endTime: record.endTime,
    room: record.room,
    campus: record.campus,
    examMetaRaw: record.examMetaRaw,
    studentId: record.studentId,
    studentName: record.studentName,
    classCourse: record.classCourse,
    classStudent: record.classStudent,
    birthDateRaw: record.birthDate,
    birthDate: record.birthDate,
    note: record.note,
    planType: record.planType,
    parseStatus: "parsed" as const,
    rawRow: undefined,
  };
}

export function buildImportPayloadFromExtensionNotices(
  userId: string,
  notices: ExamNoticeFromExtension[],
  parsedByNotice: ParsedExamRecord[][]
): ImportExamsBody {
  return {
    userId,
    adapterKey: "mydtu-exams-extension",
    adapterVersion: "1.0.0",
    sourcePage: "https://pdaotao.duytan.edu.vn/EXAM_LIST/?page=1&lang=VN",
    notices: notices.map((notice, index) => ({
      title: notice.title,
      rawTitle: notice.title,
      sourceText: null,
      courseCodeHint: notice.courseCode || null,
      courseNameHint: notice.courseName || null,
      detailUrl: notice.detailUrl,
      attachmentUrl: notice.attachmentUrl || null,
      attachmentName: notice.attachmentName || null,
      publishedAtRaw: notice.publishedAt?.raw || null,
      publishedAt: notice.publishedAt?.date || null,
      planType: notice.planType || "official",
      parseStatus: "parsed",
      detailText: null,
      parseError: notice.detailError || notice.attachmentError || null,
      records: (parsedByNotice[index] || []).map(mapParsedRecordToImportRecord),
    })),
  };
}

export async function fetchExamsFromDb(params: {
  userId: string;
  planType?: "tentative" | "official";
  courseCode?: string;
  studentId?: string;
}): Promise<ParsedExamRecord[]> {
  const qs = new URLSearchParams();
  qs.set("userId", params.userId);
  if (params.planType) qs.set("planType", params.planType);
  if (params.courseCode) qs.set("courseCode", params.courseCode);
  if (params.studentId) qs.set("studentId", params.studentId);

  const res = await fetch(apiUrl(`/exams?${qs.toString()}`), {
    method: "GET",
    headers: { "content-type": "application/json" },
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(toSafeErrorMessage(text, `Failed to fetch exams: ${res.status}`));
  }

  const json = assertOk((await res.json()) as ApiListExamsResponse);
  return json.items.map(mapDbRecordToParsedRecord);
}

async function importSingleExamBatch(body: ImportExamsBody): Promise<ApiImportExamsResponse> {
  const res = await fetch(apiUrl("/import/exams"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    cache: "no-store",
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(toSafeErrorMessage(text, `Failed to import exams: ${res.status}`));
  }

  return assertOk((await res.json()) as ApiImportExamsResponse);
}

export async function importExamsToDb(
  body: ImportExamsBody
): Promise<ApiImportExamsResponse> {
  const noticeChunks = chunkArray(body.notices || [], IMPORT_NOTICE_BATCH_SIZE);

  let noticesUpserted = 0;
  let recordsUpserted = 0;
  let lastImportId: string | undefined;

  for (const notices of noticeChunks) {
    const chunkBody: ImportExamsBody = {
      ...body,
      notices,
    };

    const result = await importSingleExamBatch(chunkBody);

    noticesUpserted += Number(result.noticesUpserted || 0);
    recordsUpserted += Number(result.recordsUpserted || 0);

    if (result.importId) {
      lastImportId = result.importId;
    }
  }

  return {
    ok: true,
    importId: lastImportId,
    noticesUpserted,
    recordsUpserted,
  };
}