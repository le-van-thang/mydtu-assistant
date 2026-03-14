// path: apps/web/src/lib/exams/parseWorkbook.ts

import type { ExamNoticeFromExtension } from "@/lib/extensionBridge";
import * as XLSX from "xlsx";

export type ParsedExamRecord = {
  id: string;

  noticeTitle: string;
  planType: "tentative" | "official";

  publishedAtRaw: string | null;
  publishedAtDate: string | null;

  detailUrl: string;
  attachmentUrl: string | null;
  attachmentName: string | null;

  courseCode: string;
  courseName: string | null;

  examDate: string | null;
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
  note: string | null;
};

type HeaderIndexes = {
  studentId: number;
  hoVa: number;
  ten: number;
  fullName: number;
  classCourse: number;
  classStudent: number;
  birthDate: number;
  note: number;
};

type ExamMeta = {
  examDate: string | null;
  startTime: string | null;
  endTime: string | null;
  room: string | null;
  campus: string | null;
  raw: string | null;
};

function normalizeSpace(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function cleanVisualSeparators(value: unknown) {
  return normalizeSpace(value)
    .replace(/\|{2,}/g, " | ")
    .replace(/\s*\|\s*\|\s*/g, " | ")
    .replace(/\s*\|\s*/g, " | ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function stripTrailingMetaNoise(value: unknown) {
  return cleanVisualSeparators(value)
    .replace(/\|\s*Lần\s*thi\s*:?\s*\d+\s*$/i, "")
    .replace(/\|\s*$/g, "")
    .trim();
}

function cleanRoomText(value: unknown) {
  return stripTrailingMetaNoise(value)
    .replace(/^phòng\s*:?\s*/i, "")
    .trim();
}

function cleanCampusText(value: unknown) {
  return stripTrailingMetaNoise(value)
    .replace(/^cơ\s*sở\s*:?\s*/i, "")
    .trim();
}

function cleanAttemptText(value: unknown) {
  return cleanVisualSeparators(value)
    .replace(/^lần\s*thi\s*:?\s*/i, "")
    .replace(/[|]+/g, "")
    .trim();
}

function makeId(parts: Array<string | null | undefined>) {
  return parts.map((p) => normalizeSpace(p || "")).join("||");
}

function parseDdMmYyyy(value: string | null) {
  if (!value) return null;

  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeSearch(value: unknown) {
  return normalizeSpace(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function detectPlanType(text: string) {
  const s = normalizeSearch(text);
  if (s.includes("du kien")) return "tentative";
  if (s.includes("chinh thuc")) return "official";
  return "official";
}

function extractCourseMeta(text: string) {
  const raw = normalizeSpace(text);

  const match = raw.match(/MÔN\s*:\s*(.+?)\s*\*\s*MÃ\s*MÔN\s*:\s*([A-Z0-9\s-]+)/i);

  if (!match) {
    return {
      courseName: null,
      courseCode: "",
    };
  }

  return {
    courseName: normalizeSpace(match[1]) || null,
    courseCode: normalizeSpace(match[2]),
  };
}

function buildMetaRaw(params: {
  startTime: string | null;
  datePart: string | null;
  room: string | null;
  campus: string | null;
  attempt: string | null;
}) {
  const parts = [
    params.startTime ? `Thời gian: ${params.startTime}` : "",
    params.datePart ? `Ngày: ${params.datePart}` : "",
    params.room ? `Phòng: ${params.room}` : "",
    params.campus ? `Cơ sở: ${params.campus}` : "",
    params.attempt ? `Lần thi: ${params.attempt}` : "",
  ].filter(Boolean);

  return parts.join(" | ") || null;
}

function extractExamSessionMeta(text: string): ExamMeta {
  const raw = cleanVisualSeparators(text);

  const regexes = [
    /Thời\s*gian\s*:?\s*([0-9hH:]{4,8})\s*-\s*Ngày\s*([0-9/]{10})\s*-\s*Phòng\s*:?\s*([^|\n-]+?)(?:\s*-\s*cơ\s*sở\s*:?\s*([^|]+?))?(?:\s*\|\s*Lần\s*thi\s*:?\s*(\d+))?$/i,
    /Thời\s*gian\s*:?\s*([0-9hH:]{4,8})\s*-\s*Ngày\s*([0-9/]{10})\s*-\s*Phòng\s*:?\s*(.+)$/i,
  ];

  let match: RegExpMatchArray | null = null;
  for (const regex of regexes) {
    match = raw.match(regex);
    if (match) break;
  }

  if (!match) {
    return {
      examDate: null,
      startTime: null,
      endTime: null,
      room: null,
      campus: null,
      raw,
    };
  }

  const timePart = match[1] || null;
  const datePart = match[2] || null;
  let roomPart = match[3] || "";
  let campusPart = match[4] || "";
  let attemptPart = match[5] || "";

  if (!campusPart && roomPart.includes(" - cơ sở")) {
    const pieces = roomPart.split(/\s*-\s*cơ\s*sở\s*:?\s*/i);
    roomPart = pieces[0] || "";
    campusPart = pieces.slice(1).join(" - ") || "";
  }

  if (!attemptPart) {
    const attemptMatch = raw.match(/\bLần\s*thi\s*:?\s*(\d+)/i);
    attemptPart = attemptMatch?.[1] || "";
  }

  const normalizedTime = String(timePart || "").replace(/[Hh]/g, ":");
  const timeMatch = normalizedTime.match(/(\d{1,2}):(\d{2})/);

  const startTime = timeMatch
    ? `${String(timeMatch[1]).padStart(2, "0")}:${timeMatch[2]}`
    : null;

  const room = cleanRoomText(roomPart) || null;
  const campus = cleanCampusText(campusPart) || null;
  const attempt = cleanAttemptText(attemptPart) || null;

  return {
    examDate: parseDdMmYyyy(datePart),
    startTime,
    endTime: null,
    room,
    campus,
    raw: buildMetaRaw({
      startTime,
      datePart,
      room,
      campus,
      attempt,
    }),
  };
}

function emptyHeaderIndexes(): HeaderIndexes {
  return {
    studentId: -1,
    hoVa: -1,
    ten: -1,
    fullName: -1,
    classCourse: -1,
    classStudent: -1,
    birthDate: -1,
    note: -1,
  };
}

function getHeaderIndexes(row: unknown[]): HeaderIndexes {
  const indexes = emptyHeaderIndexes();

  row.forEach((cell, index) => {
    const s = normalizeSearch(cell);

    if (s === "msv") indexes.studentId = index;
    if (s === "ho va") indexes.hoVa = index;
    if (s === "ten") indexes.ten = index;
    if (s.includes("ho ten")) indexes.fullName = index;
    if (s.includes("lop mon hoc")) indexes.classCourse = index;
    if (s.includes("lop sinh hoat")) indexes.classStudent = index;
    if (s.includes("ngay sinh")) indexes.birthDate = index;
    if (s.includes("ghi chu")) indexes.note = index;
  });

  return indexes;
}

function isHeaderRow(row: unknown[]) {
  const joined = normalizeSearch(row.join(" | "));
  return joined.includes("msv") && (joined.includes("ho va") || joined.includes("ho ten"));
}

function isLikelyDataRow(row: unknown[], headerIndexes: HeaderIndexes) {
  if (headerIndexes.studentId < 0) return false;
  const studentId = normalizeSpace(row[headerIndexes.studentId]);
  return /^\d{6,}$/.test(studentId);
}

function combineStudentName(row: unknown[], headerIndexes: HeaderIndexes) {
  if (headerIndexes.fullName >= 0) {
    const full = normalizeSpace(row[headerIndexes.fullName]);
    return full || null;
  }

  const hoVa = headerIndexes.hoVa >= 0 ? normalizeSpace(row[headerIndexes.hoVa]) : "";
  const ten = headerIndexes.ten >= 0 ? normalizeSpace(row[headerIndexes.ten]) : "";
  const full = normalizeSpace(`${hoVa} ${ten}`);

  return full || null;
}

function cleanBirthDate(value: unknown) {
  const raw = normalizeSpace(value);
  if (!raw) return null;
  return raw;
}

export function parseWorkbookFromNotice(notice: ExamNoticeFromExtension): ParsedExamRecord[] {
  if (!notice.attachmentBase64) return [];

  const workbook = XLSX.read(notice.attachmentBase64, { type: "base64" });
  const records: ParsedExamRecord[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
      header: 1,
      raw: false,
      blankrows: false,
    });

    let currentCourseName: string | null = null;
    let currentCourseCode = notice.courseCode || "";
    let currentExamMeta: ExamMeta = {
      examDate: null,
      startTime: null,
      endTime: null,
      room: null,
      campus: null,
      raw: null,
    };
    let headerIndexes: HeaderIndexes = emptyHeaderIndexes();

    for (const row of rows) {
      const joined = cleanVisualSeparators(row.join(" | "));
      const joinedSearch = normalizeSearch(joined);

      if (!joined) continue;

      if (joinedSearch.includes("ma mon") && joinedSearch.includes("mon")) {
        const meta = extractCourseMeta(joined);
        currentCourseName = meta.courseName;
        if (meta.courseCode) currentCourseCode = meta.courseCode;
        continue;
      }

      if (joinedSearch.includes("thoi gian") && joinedSearch.includes("ngay")) {
        currentExamMeta = extractExamSessionMeta(joined);
        continue;
      }

      if (isHeaderRow(row)) {
        headerIndexes = getHeaderIndexes(row);
        continue;
      }

      if (!isLikelyDataRow(row, headerIndexes)) continue;

      const studentId =
        headerIndexes.studentId >= 0
          ? normalizeSpace(row[headerIndexes.studentId]) || null
          : null;

      const studentName = combineStudentName(row, headerIndexes);

      const classCourse =
        headerIndexes.classCourse >= 0
          ? normalizeSpace(row[headerIndexes.classCourse]) || null
          : null;

      const classStudent =
        headerIndexes.classStudent >= 0
          ? normalizeSpace(row[headerIndexes.classStudent]) || null
          : null;

      const birthDate =
        headerIndexes.birthDate >= 0 ? cleanBirthDate(row[headerIndexes.birthDate]) : null;

      const note =
        headerIndexes.note >= 0
          ? cleanVisualSeparators(row[headerIndexes.note]) || null
          : null;

      records.push({
        id: makeId([
          notice.detailUrl,
          currentCourseCode,
          currentExamMeta.examDate,
          currentExamMeta.startTime,
          currentExamMeta.room,
          studentId,
        ]),
        noticeTitle: notice.title,
        planType: notice.planType || detectPlanType(notice.title),
        publishedAtRaw: notice.publishedAt?.raw || null,
        publishedAtDate: notice.publishedAt?.date
          ? parseDdMmYyyy(notice.publishedAt.date)
          : null,
        detailUrl: notice.detailUrl,
        attachmentUrl: notice.attachmentUrl,
        attachmentName: notice.attachmentName || null,
        courseCode: currentCourseCode || notice.courseCode || "",
        courseName: currentCourseName || null,
        examDate: currentExamMeta.examDate,
        startTime: currentExamMeta.startTime,
        endTime: currentExamMeta.endTime,
        room: currentExamMeta.room,
        campus: currentExamMeta.campus,
        examMetaRaw: currentExamMeta.raw,
        studentId,
        studentName,
        classCourse,
        classStudent,
        birthDate,
        note,
      });
    }
  }

  return Array.from(new Map(records.map((r) => [r.id, r])).values());
}