import type { ParsedExamRecord } from "./parseWorkbook";

export type ExamSessionSummary = {
  id: string;
  planType: "tentative" | "official";
  courseCode: string;
  courseName: string | null;
  examDate: string | null;
  startTime: string | null;
  endTime: string | null;
  room: string | null;
  campus: string | null;
  examMetaRaw: string | null;
  detailUrl: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  publishedAtRaw: string | null;
  noticeTitle: string;
  studentCount: number;
  classCourseCount: number;
  classStudentCount: number;
  records: ParsedExamRecord[];
  sheetIndex?: number | null;
  sessionOrder?: number | null;
  firstRowIndex?: number | null;
  firstRecordOrder?: number | null;
};

export function sanitizeVisualText(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/\|{2,}/g, " | ")
    .replace(/\s*\|\s*\|\s*/g, " | ")
    .replace(/\s*\|\s*/g, " | ")
    .replace(/\s{2,}/g, " ")
    .replace(/\|\s*:\s*\|/g, ": ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function sanitizeExamMeta(value: string | null | undefined) {
  const raw = sanitizeVisualText(value);

  return raw
    .replace(/Thời gian\s*:?\s*/gi, "Thời gian: ")
    .replace(/Ngày\s*:?\s*/gi, "Ngày: ")
    .replace(/Phòng\s*:?\s*/gi, "Phòng: ")
    .replace(/cơ sở\s*:?\s*/gi, "Cơ sở: ")
    .replace(/Lần thi\s*:?\s*/gi, "Lần thi: ")
    .replace(/\s+\|\s+\|\s+/g, " | ")
    .replace(/\|\s*$/g, "")
    .trim();
}

export function formatDate(value: string | null, locale = "vi-VN") {
  if (!value) return locale.startsWith("vi") ? "Chưa rõ ngày" : "Unknown date";
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(locale);
}

export function formatDateTime(value: string | null, locale = "vi-VN") {
  if (!value) return locale.startsWith("vi") ? "Chưa có dữ liệu" : "No data";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(locale);
}

export function getDayDiff(dateValue: string | null) {
  if (!dateValue) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(target.getTime())) return null;

  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((target.getTime() - today.getTime()) / msPerDay);
}

export function getCountdownLabel(
  dateValue: string | null,
  t: (key: string, options?: Record<string, unknown>) => string
) {
  const diff = getDayDiff(dateValue);

  if (diff === null) return t("exams.labels.unknownDate");
  if (diff < 0) return t("exams.labels.passedDays", { count: Math.abs(diff) });
  if (diff === 0) return t("exams.labels.today");
  if (diff === 1) return t("exams.labels.tomorrow");
  return t("exams.labels.remainingDays", { count: diff });
}

export function getStatusTone(dateValue: string | null) {
  const diff = getDayDiff(dateValue);

  if (diff === null) return "app-badge-empty";
  if (diff < 0) return "app-pill";
  if (diff <= 1) return "app-pill-danger";
  if (diff <= 7) return "app-pill-warning";
  return "app-pill-success";
}

export function buildSessionSummaries(records: ParsedExamRecord[]): ExamSessionSummary[] {
  const map = new Map<string, ParsedExamRecord[]>();

  for (const record of records) {
    const key = [
      record.sheetIndex ?? "",
      record.sessionOrder ?? "",
      record.planType,
      record.courseCode || "",
      record.courseName || "",
      record.examDate || "",
      record.startTime || "",
      record.room || "",
      record.campus || "",
      record.detailUrl || "",
    ].join("|||");

    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(record);
  }

  return Array.from(map.values())
    .map((items) => {
      const sortedItems = items.slice().sort((a, b) => {
        const sa = a.sheetIndex ?? 999999;
        const sb = b.sheetIndex ?? 999999;
        if (sa !== sb) return sa - sb;

        const xa = a.sessionOrder ?? 999999;
        const xb = b.sessionOrder ?? 999999;
        if (xa !== xb) return xa - xb;

        const ra = a.rowIndex ?? 999999;
        const rb = b.rowIndex ?? 999999;
        if (ra !== rb) return ra - rb;

        const oa = a.recordOrder ?? 999999;
        const ob = b.recordOrder ?? 999999;
        return oa - ob;
      });

      const first = sortedItems[0];

      return {
        id: [
          first.planType,
          first.courseCode,
          first.examDate,
          first.startTime,
          first.room,
          first.campus,
          first.sheetIndex ?? "",
          first.sessionOrder ?? "",
        ]
          .map((x) => x || "")
          .join("::"),
        planType: first.planType,
        courseCode: first.courseCode,
        courseName: first.courseName,
        examDate: first.examDate,
        startTime: first.startTime,
        endTime: first.endTime,
        room: first.room,
        campus: first.campus,
        examMetaRaw: first.examMetaRaw,
        detailUrl: first.detailUrl,
        attachmentUrl: first.attachmentUrl,
        attachmentName: first.attachmentName,
        publishedAtRaw: first.publishedAtRaw,
        noticeTitle: first.noticeTitle,
        studentCount: new Set(sortedItems.map((x) => x.studentId).filter(Boolean)).size || sortedItems.length,
        classCourseCount: new Set(sortedItems.map((x) => x.classCourse).filter(Boolean)).size,
        classStudentCount: new Set(sortedItems.map((x) => x.classStudent).filter(Boolean)).size,
        records: sortedItems,
        sheetIndex: first.sheetIndex,
        sessionOrder: first.sessionOrder,
        firstRowIndex: first.rowIndex,
        firstRecordOrder: first.recordOrder,
      };
    })
    .sort((a, b) => {
      const sa = a.sheetIndex ?? 999999;
      const sb = b.sheetIndex ?? 999999;
      if (sa !== sb) return sa - sb;

      const xa = a.sessionOrder ?? 999999;
      const xb = b.sessionOrder ?? 999999;
      if (xa !== xb) return xa - xb;

      const ra = a.firstRowIndex ?? 999999;
      const rb = b.firstRowIndex ?? 999999;
      if (ra !== rb) return ra - rb;

      const oa = a.firstRecordOrder ?? 999999;
      const ob = b.firstRecordOrder ?? 999999;
      return oa - ob;
    });
}