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

  sheetName?: string | null;
  sheetIndex?: number | null;
  rowIndex?: number | null;
  sessionOrder?: number | null;
  recordOrder?: number | null;
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

function makeId(parts: Array<string | number | null | undefined>) {
  return parts.map((p) => normalizeSpace(p ?? "")).join("||");
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

  const match = raw.match(
    /MÔN\s*:\s*(.+?)\s*\*?\s*SỐ\s*TÍN\s*CHỈ\s*:\s*(\d+)?\s*MÃ\s*MÔN\s*:\s*([A-Z0-9\s-]+)/i,
  );

  if (match) {
    return {
      courseName: normalizeSpace(match[1]) || null,
      courseCode: normalizeSpace(match[3]) || "",
    };
  }

  const fallback = raw.match(
    /MÔN\s*:\s*(.+?)\s*MÃ\s*MÔN\s*:\s*([A-Z0-9\s-]+)/i,
  );
  if (fallback) {
    return {
      courseName: normalizeSpace(fallback[1]) || null,
      courseCode: normalizeSpace(fallback[2]) || "",
    };
  }

  return {
    courseName: null,
    courseCode: "",
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

  const timeMatch =
    raw.match(/Thời\s*gian\s*:\s*([0-9]{1,2}[:hH][0-9]{2})/i) || null;
  const dateMatch = raw.match(/(\d{2}\/\d{2}\/\d{4})/);
  const roomMatch =
    raw.match(/Phòng\s*:\s*([^|]+?)(?:\s{2,}|$)/i) ||
    raw.match(/Phòng\s*:\s*(.+)$/i);
  const attemptMatch = raw.match(/Lần\s*thi\s*:\s*(\d+)/i);

  let roomRaw = normalizeSpace(roomMatch?.[1] || "");
  let campus: string | null = null;

  if (roomRaw.includes("-")) {
    const parts = roomRaw.split(/\s*-\s*/);
    if (parts.length >= 2) {
      roomRaw = normalizeSpace(parts[0]);
      campus = normalizeSpace(parts.slice(1).join(" - ")) || null;
    }
  }

  const normalizedTime = String(timeMatch?.[1] || "").replace(/[Hh]/g, ":");
  const m = normalizedTime.match(/(\d{1,2}):(\d{2})/);
  const startTime = m ? `${String(m[1]).padStart(2, "0")}:${m[2]}` : null;
  const datePart = dateMatch?.[1] || null;
  const examDate = parseDdMmYyyy(datePart);

  return {
    examDate,
    startTime,
    endTime: null,
    room: roomRaw || null,
    campus,
    raw: buildMetaRaw({
      startTime,
      datePart,
      room: roomRaw || null,
      campus,
      attempt: attemptMatch?.[1] || null,
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

    if (s === "msv" || s === "ma sv") indexes.studentId = index;
    if (s === "ho va") indexes.hoVa = index;
    if (s === "ten") indexes.ten = index;
    if (s.includes("ho ten")) indexes.fullName = index;
    if (s.includes("lop hoc phan") || s.includes("lop mon hoc")) {
      indexes.classCourse = index;
    }
    if (s.includes("lop sh") || s.includes("lop sinh hoat")) {
      indexes.classStudent = index;
    }
    if (s.includes("ngay sinh")) indexes.birthDate = index;
    if (s.includes("ghi chu")) indexes.note = index;
  });

  return indexes;
}

function isHeaderRow(row: unknown[]) {
  const joined = normalizeSearch(row.join(" | "));
  return (
    (joined.includes("msv") || joined.includes("ma sv")) &&
    (joined.includes("ho va") || joined.includes("ho ten"))
  );
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

  const hoVa =
    headerIndexes.hoVa >= 0 ? normalizeSpace(row[headerIndexes.hoVa]) : "";
  const ten =
    headerIndexes.ten >= 0 ? normalizeSpace(row[headerIndexes.ten]) : "";
  const full = normalizeSpace(`${hoVa} ${ten}`);

  return full || null;
}

function getAttachmentKind(
  notice: ExamNoticeFromExtension,
): "excel" | "pdf" | "unknown" {
  const mime = String(notice.attachmentMimeType || "").toLowerCase();
  const name = String(
    notice.attachmentName || notice.attachmentUrl || "",
  ).toLowerCase();

  if (mime.includes("spreadsheet") || mime.includes("excel")) return "excel";
  if (mime.includes("pdf")) return "pdf";
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return "excel";
  if (name.endsWith(".pdf")) return "pdf";
  return "unknown";
}

function uint8FromBase64(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

let pdfJsPromise: Promise<any> | null = null;

async function getPdfJs() {
  if (!pdfJsPromise) {
    pdfJsPromise = import("pdfjs-dist/legacy/build/pdf.mjs").then((pdfjs) => {
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
      }
      return pdfjs;
    });
  }

  return pdfJsPromise;
}

async function extractPdfLines(base64: string): Promise<string[]> {
  const pdfjs = await getPdfJs();
  const data = uint8FromBase64(base64);

  const doc = await pdfjs.getDocument({
    data,
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
  }).promise;

  const lines: string[] = [];

  for (let pageNo = 1; pageNo <= doc.numPages; pageNo += 1) {
    const page = await doc.getPage(pageNo);
    const textContent = await page.getTextContent();

    const buckets = new Map<number, string[]>();

    for (const item of textContent.items as Array<any>) {
      const str = normalizeSpace(item?.str || "");
      if (!str) continue;

      const y = Math.round(item.transform?.[5] || 0);
      if (!buckets.has(y)) buckets.set(y, []);
      buckets.get(y)!.push(str);
    }

    const sorted = Array.from(buckets.entries()).sort((a, b) => b[0] - a[0]);
    for (const [, parts] of sorted) {
      const line = normalizeSpace(parts.join(" "));
      if (line) lines.push(line);
    }
  }

  return lines;
}

function parsePdfStudentLine(
  line: string,
  context: {
    courseCode: string;
    sessionMeta: ExamMeta;
    notice: ExamNoticeFromExtension;
    courseName: string | null;
    rowIndex: number;
    recordOrder: number;
    sessionOrder: number;
    sheetIndex: number;
  },
): ParsedExamRecord | null {
  const normalized = normalizeSpace(line);
  if (!/^\d+\s+\d{6,}/.test(normalized)) return null;

  const sttAndId = normalized.match(/^(\d+)\s+(\d{6,})\s+(.+)$/);
  if (!sttAndId) return null;

  const studentId = sttAndId[2];
  const rest = sttAndId[3];

  const courseCodePattern = context.courseCode
    ? context.courseCode.replace(/\s+/g, "\\s+")
    : "";

  let classCourse: string | null = null;
  let classStudent: string | null = null;
  let studentName: string | null = null;

  if (courseCodePattern) {
    const re = new RegExp(
      `^(.+?)\\s+(${courseCodePattern}\\s+\\S+)\\s+([A-Za-z0-9-]+)$`,
      "i",
    );
    const m = rest.match(re);
    if (m) {
      studentName = normalizeSpace(m[1]) || null;
      classCourse = normalizeSpace(m[2]) || null;
      classStudent = normalizeSpace(m[3]) || null;
    }
  }

  if (!studentName) {
    const fallback = rest.split(/\s+/);
    if (fallback.length >= 3) {
      classStudent = fallback[fallback.length - 1] || null;
      studentName =
        normalizeSpace(fallback.slice(0, fallback.length - 1).join(" ")) ||
        null;
    } else {
      studentName = rest || null;
    }
  }

  return {
    id: makeId([
      context.notice.detailUrl,
      context.courseCode,
      context.sessionMeta.examDate,
      context.sessionMeta.startTime,
      context.sessionMeta.room,
      studentId,
      context.sheetIndex,
      context.rowIndex,
    ]),
    noticeTitle: context.notice.title,
    planType: context.notice.planType || detectPlanType(context.notice.title),
    publishedAtRaw: context.notice.publishedAt?.raw || null,
    publishedAtDate: context.notice.publishedAt?.date
      ? parseDdMmYyyy(context.notice.publishedAt.date)
      : null,
    detailUrl: context.notice.detailUrl,
    attachmentUrl: context.notice.attachmentUrl,
    attachmentName: context.notice.attachmentName || null,
    courseCode: context.courseCode || context.notice.courseCode || "",
    courseName: context.courseName || context.notice.courseName || null,
    examDate: context.sessionMeta.examDate,
    startTime: context.sessionMeta.startTime,
    endTime: context.sessionMeta.endTime,
    room: context.sessionMeta.room,
    campus: context.sessionMeta.campus,
    examMetaRaw: context.sessionMeta.raw,
    studentId,
    studentName,
    classCourse,
    classStudent,
    birthDate: null,
    note: null,
    sheetName: "PDF",
    sheetIndex: context.sheetIndex,
    rowIndex: context.rowIndex,
    sessionOrder: context.sessionOrder,
    recordOrder: context.recordOrder,
  };
}

async function parsePdfNotice(
  notice: ExamNoticeFromExtension,
): Promise<ParsedExamRecord[]> {
  if (!notice.attachmentBase64) return [];

  const lines = await extractPdfLines(notice.attachmentBase64);

  let currentCourseCode = notice.courseCode || "";
  let currentCourseName = notice.courseName || null;
  let currentMeta: ExamMeta = {
    examDate: null,
    startTime: null,
    endTime: null,
    room: null,
    campus: null,
    raw: null,
  };
  let sessionOrder = -1;
  let recordOrder = 0;

  const records: ParsedExamRecord[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const search = normalizeSearch(line);

    if (
      search.includes("mon:") ||
      search.includes("ma mon") ||
      (search.includes("mon") && search.includes("hk"))
    ) {
      const meta = extractCourseMeta(line);
      if (meta.courseCode) currentCourseCode = meta.courseCode;
      if (meta.courseName) currentCourseName = meta.courseName;
    }

    if (search.includes("thoi gian") && search.includes("phong")) {
      currentMeta = extractExamSessionMeta(line);
      sessionOrder += 1;
      continue;
    }

    if (search.includes("ma sv") && search.includes("lop hoc phan")) {
      continue;
    }

    const row = parsePdfStudentLine(line, {
      courseCode: currentCourseCode,
      sessionMeta: currentMeta,
      notice,
      courseName: currentCourseName,
      rowIndex: i,
      recordOrder,
      sessionOrder,
      sheetIndex: 0,
    });

    if (row) {
      records.push(row);
      recordOrder += 1;
    }
  }

  return records;
}

function parseExcelNotice(notice: ExamNoticeFromExtension): ParsedExamRecord[] {
  if (!notice.attachmentBase64) return [];

  const workbook = XLSX.read(notice.attachmentBase64, { type: "base64" });
  const records: ParsedExamRecord[] = [];
  let globalRecordOrder = 0;

  workbook.SheetNames.forEach((sheetName, sheetIndex) => {
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
    let sessionOrder = -1;

    rows.forEach((row, rowIndex) => {
      const joined = cleanVisualSeparators(row.join(" | "));
      const joinedSearch = normalizeSearch(joined);

      if (!joined) return;

      if (joinedSearch.includes("ma mon") && joinedSearch.includes("mon")) {
        const meta = extractCourseMeta(joined);
        currentCourseName = meta.courseName;
        if (meta.courseCode) currentCourseCode = meta.courseCode;
        return;
      }

      if (
        joinedSearch.includes("thoi gian") &&
        (joinedSearch.includes("ngay") || joinedSearch.includes("phong"))
      ) {
        currentExamMeta = extractExamSessionMeta(joined);
        sessionOrder += 1;
        return;
      }

      if (isHeaderRow(row)) {
        headerIndexes = getHeaderIndexes(row);
        return;
      }

      if (!isLikelyDataRow(row, headerIndexes)) return;

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
        headerIndexes.birthDate >= 0
          ? normalizeSpace(row[headerIndexes.birthDate]) || null
          : null;

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
          sheetIndex,
          rowIndex,
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
        courseName: currentCourseName || notice.courseName || null,
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
        sheetName,
        sheetIndex,
        rowIndex,
        sessionOrder,
        recordOrder: globalRecordOrder++,
      });
    });
  });

  return records;
}

export async function parseWorkbookFromNotice(
  notice: ExamNoticeFromExtension,
): Promise<ParsedExamRecord[]> {
  if (!notice.attachmentBase64) return [];

  const kind = getAttachmentKind(notice);

  if (kind === "pdf") {
    return await parsePdfNotice(notice);
  }

  return parseExcelNotice(notice);
}