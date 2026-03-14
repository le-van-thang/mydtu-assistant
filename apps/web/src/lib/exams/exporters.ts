"use client";

import type { ParsedExamRecord } from "@/lib/exams/parseWorkbook";

export type ExportExamSession = {
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
};

type WorkbookOptions = {
  isVi?: boolean;
  filePrefix?: string;
};

type PrintableExamSlipInput = {
  record: ParsedExamRecord;
  session?: ExportExamSession | null;
  locale: string;
  isVi: boolean;
};

function sanitizeVisualText(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/\|{2,}/g, " | ")
    .replace(/\s*\|\s*\|\s*/g, " | ")
    .replace(/\s*\|\s*/g, " | ")
    .replace(/\s{2,}/g, " ")
    .replace(/\|\s*:\s*\|/g, ": ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function sanitizeExamMeta(value: string | null | undefined) {
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

function formatDate(value: string | null, locale = "vi-VN") {
  if (!value) return locale.startsWith("vi") ? "Chưa rõ ngày" : "Unknown date";
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(locale);
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildSessionSummaries(records: ParsedExamRecord[]): ExportExamSession[] {
  const map = new Map<string, ParsedExamRecord[]>();

  for (const record of records) {
    const key = [
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
      const first = items[0];

      return {
        id: [
          first.planType,
          first.courseCode,
          first.examDate,
          first.startTime,
          first.room,
          first.campus,
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
        studentCount: new Set(items.map((x) => x.studentId).filter(Boolean)).size || items.length,
        classCourseCount: new Set(items.map((x) => x.classCourse).filter(Boolean)).size,
        classStudentCount: new Set(items.map((x) => x.classStudent).filter(Boolean)).size,
        records: items.slice(),
      };
    })
    .sort((a, b) => {
      const av = `${a.examDate || "9999-12-31"} ${a.startTime || "23:59"} ${a.courseCode || ""}`;
      const bv = `${b.examDate || "9999-12-31"} ${b.startTime || "23:59"} ${b.courseCode || ""}`;
      return av.localeCompare(bv);
    });
}

function buildStudentRows(records: ParsedExamRecord[], isVi: boolean) {
  return records.map((record) => ({
    [isVi ? "Loại lịch" : "Plan type"]:
      record.planType === "official"
        ? isVi
          ? "Chính thức"
          : "Official"
        : isVi
          ? "Dự kiến"
          : "Tentative",
    [isVi ? "Mã môn" : "Course code"]: record.courseCode || "",
    [isVi ? "Tên môn" : "Course name"]: record.courseName || "",
    [isVi ? "Ngày thi" : "Exam date"]: record.examDate || "",
    [isVi ? "Giờ bắt đầu" : "Start time"]: record.startTime || "",
    [isVi ? "Giờ kết thúc" : "End time"]: record.endTime || "",
    [isVi ? "Phòng" : "Room"]: sanitizeVisualText(record.room),
    [isVi ? "Cơ sở" : "Campus"]: sanitizeVisualText(record.campus),
    MSSV: record.studentId || "",
    [isVi ? "Họ tên" : "Student name"]: record.studentName || "",
    [isVi ? "Lớp môn học" : "Course class"]: record.classCourse || "",
    [isVi ? "Lớp sinh hoạt" : "Student class"]: record.classStudent || "",
    [isVi ? "Ngày sinh" : "Birth date"]: record.birthDate || "",
    [isVi ? "Thông báo" : "Notice"]: record.noticeTitle || "",
    [isVi ? "Nguồn đăng" : "Published at"]: record.publishedAtRaw || "",
    [isVi ? "Tệp lịch thi" : "Attachment"]: record.attachmentName || "",
    [isVi ? "URL chi tiết" : "Detail URL"]: record.detailUrl || "",
    [isVi ? "URL tệp" : "Attachment URL"]: record.attachmentUrl || "",
    [isVi ? "Thông tin ca thi" : "Exam session info"]: sanitizeExamMeta(record.examMetaRaw),
    [isVi ? "Ghi chú" : "Note"]: record.note || "",
  }));
}

function buildSessionRows(sessions: ExportExamSession[], isVi: boolean) {
  return sessions.map((session) => ({
    [isVi ? "Loại lịch" : "Plan type"]:
      session.planType === "official"
        ? isVi
          ? "Chính thức"
          : "Official"
        : isVi
          ? "Dự kiến"
          : "Tentative",
    [isVi ? "Mã môn" : "Course code"]: session.courseCode || "",
    [isVi ? "Tên môn" : "Course name"]: session.courseName || "",
    [isVi ? "Ngày thi" : "Exam date"]: session.examDate || "",
    [isVi ? "Giờ bắt đầu" : "Start time"]: session.startTime || "",
    [isVi ? "Giờ kết thúc" : "End time"]: session.endTime || "",
    [isVi ? "Phòng" : "Room"]: sanitizeVisualText(session.room),
    [isVi ? "Cơ sở" : "Campus"]: sanitizeVisualText(session.campus),
    [isVi ? "Sinh viên" : "Students"]: session.studentCount,
    [isVi ? "Số lớp môn học" : "Course classes"]: session.classCourseCount,
    [isVi ? "Số lớp sinh hoạt" : "Student classes"]: session.classStudentCount,
    [isVi ? "Thông tin ca thi" : "Exam session info"]: sanitizeExamMeta(session.examMetaRaw),
    [isVi ? "Thông báo" : "Notice"]: session.noticeTitle || "",
    [isVi ? "Nguồn đăng" : "Published at"]: session.publishedAtRaw || "",
    [isVi ? "Tệp lịch thi" : "Attachment"]: session.attachmentName || "",
    [isVi ? "URL chi tiết" : "Detail URL"]: session.detailUrl || "",
    [isVi ? "URL tệp" : "Attachment URL"]: session.attachmentUrl || "",
  }));
}

function buildOverviewRows(records: ParsedExamRecord[], sessions: ExportExamSession[], isVi: boolean, locale: string) {
  const official = records.filter((r) => r.planType === "official").length;
  const tentative = records.filter((r) => r.planType === "tentative").length;
  const uniqueCourses = new Set(records.map((r) => r.courseCode).filter(Boolean)).size;
  const uniqueStudents = new Set(records.map((r) => r.studentId).filter(Boolean)).size;
  const uniqueDays = new Set(records.map((r) => r.examDate).filter(Boolean)).size;

  return [
    {
      [isVi ? "Chỉ số" : "Metric"]: isVi ? "Tổng bản ghi sinh viên" : "Total student rows",
      [isVi ? "Giá trị" : "Value"]: records.length,
    },
    {
      [isVi ? "Chỉ số" : "Metric"]: isVi ? "Tổng phiên thi" : "Total sessions",
      [isVi ? "Giá trị" : "Value"]: sessions.length,
    },
    {
      [isVi ? "Chỉ số" : "Metric"]: isVi ? "Lịch chính thức" : "Official rows",
      [isVi ? "Giá trị" : "Value"]: official,
    },
    {
      [isVi ? "Chỉ số" : "Metric"]: isVi ? "Lịch dự kiến" : "Tentative rows",
      [isVi ? "Giá trị" : "Value"]: tentative,
    },
    {
      [isVi ? "Chỉ số" : "Metric"]: isVi ? "Số môn học" : "Unique courses",
      [isVi ? "Giá trị" : "Value"]: uniqueCourses,
    },
    {
      [isVi ? "Chỉ số" : "Metric"]: isVi ? "Số sinh viên" : "Unique students",
      [isVi ? "Giá trị" : "Value"]: uniqueStudents,
    },
    {
      [isVi ? "Chỉ số" : "Metric"]: isVi ? "Số ngày thi" : "Unique exam days",
      [isVi ? "Giá trị" : "Value"]: uniqueDays,
    },
    {
      [isVi ? "Chỉ số" : "Metric"]: isVi ? "Xuất lúc" : "Exported at",
      [isVi ? "Giá trị" : "Value"]: new Date().toLocaleString(locale),
    },
  ];
}

function getColumnWidths(rows: Array<Record<string, unknown>>) {
  const headers = Object.keys(rows[0] || {});
  return headers.map((header) => {
    const maxContent = Math.max(
      header.length,
      ...rows.map((row) => String((row as Record<string, unknown>)[header] ?? "").length)
    );
    return { wch: Math.min(Math.max(maxContent + 2, 14), 42) };
  });
}

function applyAutoFilter(
  XLSX: typeof import("xlsx"),
  ws: import("xlsx").WorkSheet,
  rowCount: number,
  colCount: number
) {
  ws["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: Math.max(rowCount, 1), c: Math.max(colCount - 1, 0) },
    }),
  };
}

function downloadWorkbook(
  XLSX: typeof import("xlsx"),
  wb: import("xlsx").WorkBook,
  filename: string
) {
  XLSX.writeFile(wb, filename);
}

export function exportExamCsv(
  records: ParsedExamRecord[],
  locale: string,
  fileLabel: string
) {
  const rows = [
    [
      "planType",
      "courseCode",
      "courseName",
      "examDate",
      "startTime",
      "endTime",
      "room",
      "campus",
      "studentId",
      "studentName",
      "classCourse",
      "classStudent",
      "birthDate",
      "publishedAtRaw",
      "attachmentName",
      "noticeTitle",
      "detailUrl",
      "attachmentUrl",
      "examMetaRaw",
      "note",
    ],
    ...records.map((record) => [
      record.planType,
      record.courseCode || "",
      record.courseName || "",
      record.examDate || "",
      record.startTime || "",
      record.endTime || "",
      sanitizeVisualText(record.room),
      sanitizeVisualText(record.campus),
      record.studentId || "",
      record.studentName || "",
      record.classCourse || "",
      record.classStudent || "",
      record.birthDate || "",
      record.publishedAtRaw || "",
      record.attachmentName || "",
      record.noticeTitle || "",
      record.detailUrl || "",
      record.attachmentUrl || "",
      sanitizeExamMeta(record.examMetaRaw),
      record.note || "",
    ]),
  ];

  const escapeCsv = (value: string) => {
    const safe = String(value ?? "");
    if (safe.includes('"') || safe.includes(",") || safe.includes("\n")) {
      return `"${safe.replace(/"/g, '""')}"`;
    }
    return safe;
  };

  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" });

  const fileDate = new Date().toLocaleDateString(locale).replace(/[^\d]+/g, "-");
  const filename = `${fileLabel}-${fileDate}.csv`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function exportExamWorkbook(
  records: ParsedExamRecord[],
  locale: string,
  options?: WorkbookOptions
) {
  const XLSX = await import("xlsx");
  const isVi = options?.isVi ?? locale.startsWith("vi");
  const sessions = buildSessionSummaries(records);

  const studentRows = buildStudentRows(records, isVi);
  const sessionRows = buildSessionRows(sessions, isVi);
  const overviewRows = buildOverviewRows(records, sessions, isVi, locale);

  const wb = XLSX.utils.book_new();

  const wsStudents = XLSX.utils.json_to_sheet(studentRows);
  const wsSessions = XLSX.utils.json_to_sheet(sessionRows);
  const wsOverview = XLSX.utils.json_to_sheet(overviewRows);

  wsStudents["!cols"] = getColumnWidths(studentRows);
  wsSessions["!cols"] = getColumnWidths(sessionRows);
  wsOverview["!cols"] = getColumnWidths(overviewRows);

  applyAutoFilter(XLSX, wsStudents, studentRows.length, Object.keys(studentRows[0] || {}).length);
  applyAutoFilter(XLSX, wsSessions, sessionRows.length, Object.keys(sessionRows[0] || {}).length);
  applyAutoFilter(XLSX, wsOverview, overviewRows.length, Object.keys(overviewRows[0] || {}).length);

  XLSX.utils.book_append_sheet(
    wb,
    wsStudents,
    isVi ? "Danh_sach_sinh_vien" : "Student_List"
  );
  XLSX.utils.book_append_sheet(
    wb,
    wsSessions,
    isVi ? "Phien_thi" : "Sessions"
  );
  XLSX.utils.book_append_sheet(
    wb,
    wsOverview,
    isVi ? "Tong_quan" : "Overview"
  );

  const fileDate = new Date().toLocaleDateString(locale).replace(/[^\d]+/g, "-");
  const prefix = options?.filePrefix || (isVi ? "bao-cao-lich-thi" : "exam-report");
  downloadWorkbook(XLSX, wb, `${prefix}-${fileDate}.xlsx`);
}

export async function exportExamSessionWorkbook(
  session: ExportExamSession,
  locale: string,
  options?: WorkbookOptions
) {
  const XLSX = await import("xlsx");
  const isVi = options?.isVi ?? locale.startsWith("vi");

  const studentRows = buildStudentRows(session.records, isVi);
  const sessionInfoRows = [
    {
      [isVi ? "Trường" : "Field"]: isVi ? "Mã môn" : "Course code",
      [isVi ? "Giá trị" : "Value"]: session.courseCode || "",
    },
    {
      [isVi ? "Trường" : "Field"]: isVi ? "Tên môn" : "Course name",
      [isVi ? "Giá trị" : "Value"]: session.courseName || "",
    },
    {
      [isVi ? "Trường" : "Field"]: isVi ? "Loại lịch" : "Plan type",
      [isVi ? "Giá trị" : "Value"]:
        session.planType === "official"
          ? isVi
            ? "Chính thức"
            : "Official"
          : isVi
            ? "Dự kiến"
            : "Tentative",
    },
    {
      [isVi ? "Trường" : "Field"]: isVi ? "Ngày thi" : "Exam date",
      [isVi ? "Giá trị" : "Value"]: session.examDate || "",
    },
    {
      [isVi ? "Trường" : "Field"]: isVi ? "Giờ bắt đầu" : "Start time",
      [isVi ? "Giá trị" : "Value"]: session.startTime || "",
    },
    {
      [isVi ? "Trường" : "Field"]: isVi ? "Giờ kết thúc" : "End time",
      [isVi ? "Giá trị" : "Value"]: session.endTime || "",
    },
    {
      [isVi ? "Trường" : "Field"]: isVi ? "Phòng" : "Room",
      [isVi ? "Giá trị" : "Value"]: sanitizeVisualText(session.room),
    },
    {
      [isVi ? "Trường" : "Field"]: isVi ? "Cơ sở" : "Campus",
      [isVi ? "Giá trị" : "Value"]: sanitizeVisualText(session.campus),
    },
    {
      [isVi ? "Trường" : "Field"]: isVi ? "Sinh viên" : "Students",
      [isVi ? "Giá trị" : "Value"]: session.studentCount,
    },
    {
      [isVi ? "Trường" : "Field"]: isVi ? "Thông tin ca thi" : "Exam session info",
      [isVi ? "Giá trị" : "Value"]: sanitizeExamMeta(session.examMetaRaw),
    },
    {
      [isVi ? "Trường" : "Field"]: isVi ? "Thông báo" : "Notice",
      [isVi ? "Giá trị" : "Value"]: session.noticeTitle || "",
    },
  ];

  const wb = XLSX.utils.book_new();
  const wsStudents = XLSX.utils.json_to_sheet(studentRows);
  const wsInfo = XLSX.utils.json_to_sheet(sessionInfoRows);

  wsStudents["!cols"] = getColumnWidths(studentRows);
  wsInfo["!cols"] = getColumnWidths(sessionInfoRows);

  applyAutoFilter(XLSX, wsStudents, studentRows.length, Object.keys(studentRows[0] || {}).length);
  applyAutoFilter(XLSX, wsInfo, sessionInfoRows.length, Object.keys(sessionInfoRows[0] || {}).length);

  XLSX.utils.book_append_sheet(
    wb,
    wsStudents,
    isVi ? "Danh_sach_sinh_vien" : "Student_List"
  );
  XLSX.utils.book_append_sheet(
    wb,
    wsInfo,
    isVi ? "Thong_tin_ca_thi" : "Session_Info"
  );

  const fileDate = new Date().toLocaleDateString(locale).replace(/[^\d]+/g, "-");
  const safeCode = sanitizeVisualText(session.courseCode || "ca-thi").replace(/[^\w-]+/g, "-");
  const prefix = options?.filePrefix || (isVi ? "ds-ca-thi" : "session-list");
  downloadWorkbook(XLSX, wb, `${prefix}-${safeCode}-${fileDate}.xlsx`);
}

export function openPrintableExamSlip({
  record,
  session,
  locale,
  isVi,
}: PrintableExamSlipInput) {
  const title = isVi ? "Phiếu thông tin dự thi cá nhân" : "Personal exam information slip";

  const examDateText = formatDate(record.examDate, locale);
  const examTimeText =
    [record.startTime || null, record.endTime || null].filter(Boolean).join(" - ") ||
    (record.startTime || (isVi ? "Chưa rõ giờ" : "Unknown time"));

  const roomText = sanitizeVisualText(record.room) || (isVi ? "Chưa rõ phòng" : "Unknown room");
  const campusText = sanitizeVisualText(record.campus) || "—";
  const courseCodeText = record.courseCode || (isVi ? "Chưa rõ mã môn" : "Unknown course code");
  const courseNameText = record.courseName || record.noticeTitle || "—";
  const studentIdText = record.studentId || "—";
  const studentNameText = record.studentName || "—";
  const birthDateText = record.birthDate || "—";
  const classCourseText = record.classCourse || "—";
  const classStudentText = record.classStudent || "—";
  const planTypeText =
    record.planType === "official"
      ? isVi
        ? "Chính thức"
        : "Official"
      : isVi
        ? "Dự kiến"
        : "Tentative";
  const metaText = sanitizeExamMeta(record.examMetaRaw) || "—";
  const publishText = record.publishedAtRaw || "—";
  const attachmentText = record.attachmentName || "—";
  const noticeTitleText = record.noticeTitle || "—";
  const studentCountText =
    session?.studentCount != null ? String(session.studentCount) : isVi ? "Không rõ" : "Unknown";

  const html = `<!doctype html>
<html lang="${isVi ? "vi" : "en"}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #f5f7fb;
      color: #0f172a;
      font-family: Arial, Helvetica, sans-serif;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 16mm;
    }
    .card {
      background: #ffffff;
      border: 1px solid #dbe3ef;
      border-radius: 18px;
      padding: 18px;
      box-shadow: 0 8px 30px rgba(15, 23, 42, 0.08);
    }
    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: start;
      gap: 16px;
      border-bottom: 1px dashed #cbd5e1;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .brand {
      font-size: 22px;
      font-weight: 700;
      line-height: 1.2;
    }
    .subtitle {
      color: #475569;
      font-size: 12px;
      margin-top: 4px;
    }
    .badge {
      display: inline-block;
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      background: #e2e8f0;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-top: 10px;
    }
    .item {
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 10px 12px;
      background: #fafcff;
    }
    .label {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: .04em;
      margin-bottom: 6px;
      font-weight: 700;
    }
    .value {
      font-size: 14px;
      font-weight: 600;
      line-height: 1.45;
      word-break: break-word;
    }
    .wide {
      grid-column: 1 / -1;
    }
    .hint {
      margin-top: 14px;
      font-size: 12px;
      color: #475569;
      line-height: 1.5;
      border-top: 1px dashed #cbd5e1;
      padding-top: 10px;
    }
    .foot {
      margin-top: 12px;
      font-size: 11px;
      color: #64748b;
    }
    @media print {
      html, body {
        background: #fff;
      }
      .page {
        width: auto;
        min-height: auto;
        margin: 0;
        padding: 0;
      }
      .card {
        box-shadow: none;
        border: 1px solid #cbd5e1;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="card">
      <div class="topbar">
        <div>
          <div class="brand">${escapeHtml(title)}</div>
          <div class="subtitle">
            ${escapeHtml(
              isVi
                ? "Biểu mẫu cá nhân để tra cứu / in nhanh thông tin dự thi."
                : "Personal form for quick lookup / printing."
            )}
          </div>
        </div>
        <div class="badge">${escapeHtml(planTypeText)}</div>
      </div>

      <div class="grid">
        <div class="item">
          <div class="label">${escapeHtml(isVi ? "MSSV" : "Student ID")}</div>
          <div class="value">${escapeHtml(studentIdText)}</div>
        </div>

        <div class="item">
          <div class="label">${escapeHtml(isVi ? "Họ tên" : "Student name")}</div>
          <div class="value">${escapeHtml(studentNameText)}</div>
        </div>

        <div class="item">
          <div class="label">${escapeHtml(isVi ? "Ngày sinh" : "Birth date")}</div>
          <div class="value">${escapeHtml(birthDateText)}</div>
        </div>

        <div class="item">
          <div class="label">${escapeHtml(isVi ? "Lớp sinh hoạt" : "Student class")}</div>
          <div class="value">${escapeHtml(classStudentText)}</div>
        </div>

        <div class="item wide">
          <div class="label">${escapeHtml(isVi ? "Môn học" : "Course")}</div>
          <div class="value">${escapeHtml(
            `${courseCodeText}${courseNameText !== "—" ? ` • ${courseNameText}` : ""}`
          )}</div>
        </div>

        <div class="item">
          <div class="label">${escapeHtml(isVi ? "Ngày thi" : "Exam date")}</div>
          <div class="value">${escapeHtml(examDateText)}</div>
        </div>

        <div class="item">
          <div class="label">${escapeHtml(isVi ? "Giờ thi" : "Exam time")}</div>
          <div class="value">${escapeHtml(examTimeText)}</div>
        </div>

        <div class="item">
          <div class="label">${escapeHtml(isVi ? "Phòng thi" : "Room")}</div>
          <div class="value">${escapeHtml(roomText)}</div>
        </div>

        <div class="item">
          <div class="label">${escapeHtml(isVi ? "Cơ sở" : "Campus")}</div>
          <div class="value">${escapeHtml(campusText)}</div>
        </div>

        <div class="item">
          <div class="label">${escapeHtml(isVi ? "Lớp môn học" : "Course class")}</div>
          <div class="value">${escapeHtml(classCourseText)}</div>
        </div>

        <div class="item">
          <div class="label">${escapeHtml(isVi ? "Số SV cùng ca" : "Students in session")}</div>
          <div class="value">${escapeHtml(studentCountText)}</div>
        </div>

        <div class="item wide">
          <div class="label">${escapeHtml(isVi ? "Thông tin ca thi" : "Exam session details")}</div>
          <div class="value">${escapeHtml(metaText)}</div>
        </div>

        <div class="item wide">
          <div class="label">${escapeHtml(isVi ? "Thông báo" : "Notice")}</div>
          <div class="value">${escapeHtml(noticeTitleText)}</div>
        </div>

        <div class="item">
          <div class="label">${escapeHtml(isVi ? "Nguồn đăng" : "Published at")}</div>
          <div class="value">${escapeHtml(publishText)}</div>
        </div>

        <div class="item">
          <div class="label">${escapeHtml(isVi ? "Tệp lịch thi" : "Attachment")}</div>
          <div class="value">${escapeHtml(attachmentText)}</div>
        </div>
      </div>

      <div class="hint">
        ${escapeHtml(
          isVi
            ? "Biểu mẫu này dùng để tra cứu và in nhanh cho cá nhân, không thay thế thông báo chính thức của nhà trường."
            : "This form is for quick lookup and printing only and does not replace the official school notice."
        )}
      </div>

      <div class="foot">
        ${escapeHtml(
          isVi
            ? `In lúc: ${new Date().toLocaleString(locale)}`
            : `Printed at: ${new Date().toLocaleString(locale)}`
        )}
      </div>
    </div>
  </div>
  <script>
    window.onload = function () {
      setTimeout(function () {
        window.print();
      }, 180);
    };
  </script>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "width=980,height=720");
  if (!printWindow) return false;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  return true;
}