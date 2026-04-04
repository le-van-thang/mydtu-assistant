// path: apps/web/src/app/(app)/transcript/detail/page.tsx
"use client";

import SyncTranscriptDetailButton from "@/components/SyncTranscriptDetailButton";
import {
  fetchTranscriptDetail,
  type TranscriptDetailItem,
} from "@/lib/transcript/detail";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import TranscriptDetailExtensionConnect from "../TranscriptDetailExtensionConnect";
import Skeleton from "@/components/ui/Skeleton";

type MetaState = {
  lastSyncedAt?: string | null;
  lastSyncStatus?: string | null;
  lastSyncCounts?: unknown;
} | null;

function normalizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

// Định dạng điểm tổng kết (score10 từ transcript — đã là số thực)
function formatScore(value: number | null | undefined) {
  if (value === null || value === undefined) return "--";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

// Định dạng điểm thành phần (DB lưu số nguyên × 100 → ví dụ: 820 → "8.20")
function formatDetailScore(value: number | null | undefined): string {
  if (value === null || value === undefined) return "--";
  return (value / 100).toFixed(2);
}

// Định dạng tỷ lệ phần trăm thành phần (DB × 100 → ví dụ: 500 → "5.00%")
function formatDetailPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "--";
  return (value / 100).toFixed(2) + "%";
}

// Màu CSS cho điểm thành phần dựa trên giá trị thực (sau khi chia 100)
function getScoreColor(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const n = value / 100;
  if (n >= 8.5) return "text-emerald-600 dark:text-emerald-400";
  if (n >= 7.0) return "text-blue-600 dark:text-blue-400";
  if (n >= 5.5) return "text-amber-600 dark:text-amber-400";
  if (n > 0) return "text-red-600 dark:text-red-400";
  return "";
}

// Xuất bảng điểm chi tiết ra file Excel (định dạng HTML giả lập .xls) để giữ nguyên cấu trúc nhóm và màu sắc
function exportToExcel(grouped: GroupedForReport) {
  function fmt(v: number | null): string {
    return v != null ? (v / 100).toFixed(2) : "--";
  }
  function fmtPct(v: number | null): string {
    return v != null ? (v / 100).toFixed(2) + "%" : "--";
  }

  let tableHtml = `
    <table border="1" cellpadding="4" cellspacing="0" style="font-family: Arial, sans-serif; font-size: 11pt; border-collapse: collapse;">
      <tr>
        <th colspan="8" style="background-color: #1e3a8a; color: white; font-size: 14pt; font-weight: bold; text-align: center; height: 40px; border: 1px solid #1e3a8a;">BẢNG ĐIỂM CHI TIẾT — MYDTU ASSISTANT</th>
      </tr>
      <tr>
        <td colspan="8" style="height: 10px; border: none;"></td>
      </tr>
  `;

  grouped.forEach((sem) => {
    tableHtml += `
      <tr>
        <td colspan="8" style="background-color: #cbd5e1; color: #0f172a; font-weight: bold; font-size: 12pt; height: 30px; border: 1px solid #94a3b8;">📅 Học kỳ: ${sem.semester}</td>
      </tr>
    `;

    sem.classes.forEach((cls) => {
      tableHtml += `
        <tr>
          <td colspan="8" style="background-color: #e0e7ff; color: #1e3a8a; font-weight: bold; border: 1px solid #a5b4fc; padding-top: 8px; padding-bottom: 8px;">
            📚 [${cls.classCode}] ${cls.courseName || cls.courseCode} 
            ${cls.transcript?.credits ? `&nbsp;&nbsp;&bull;&nbsp;&nbsp; ${cls.transcript.credits} tín chỉ` : ""}
            ${cls.transcript?.letter ? `&nbsp;&nbsp;&bull;&nbsp;&nbsp; Điểm chữ: <span style="color: #b91c1c;">${cls.transcript.letter}</span>` : ""}
            ${cls.transcript?.score10 != null ? `&nbsp;&nbsp;&bull;&nbsp;&nbsp; Điểm 10: <span style="color: #b91c1c;">${cls.transcript.score10.toFixed(1)}</span>` : ""}
          </td>
        </tr>
        <tr>
          <th style="background-color: #f1f5f9; color: #475569; width: 40px; border: 1px solid #cbd5e1;">STT</th>
          <th style="background-color: #f1f5f9; color: #475569; width: 250px; border: 1px solid #cbd5e1;">Thành phần điểm</th>
          <th style="background-color: #f1f5f9; color: #475569; width: 90px; border: 1px solid #cbd5e1;">Điểm lần 1</th>
          <th style="background-color: #f1f5f9; color: #475569; width: 90px; border: 1px solid #cbd5e1;">Điểm lần 2</th>
          <th style="background-color: #f1f5f9; color: #475569; width: 90px; border: 1px solid #cbd5e1;">Thang điểm</th>
          <th style="background-color: #f1f5f9; color: #475569; width: 90px; border: 1px solid #cbd5e1;">% Đóng góp</th>
          <th style="background-color: #f1f5f9; color: #475569; width: 90px; border: 1px solid #cbd5e1;">% Tối đa</th>
          <th style="background-color: #f1f5f9; color: #475569; width: 90px; border: 1px solid #cbd5e1;">Quy đổi</th>
        </tr>
      `;

      cls.rows.forEach((row, i) => {
        const isPass = Number.isFinite(row.score1) ? (row.score1! / 100 >= 5.0) : true;
        const color = row.score1 === null ? '#94a3b8' : (isPass ? '#15803d' : '#b91c1c');

        tableHtml += `
          <tr>
            <td style="text-align: center; border: 1px solid #e2e8f0;">${i + 1}</td>
            <td style="border: 1px solid #e2e8f0;">${row.componentLabel}</td>
            <td style="text-align: right; color: ${color}; font-weight: ${row.score1 !== null ? 'bold' : 'normal'}; border: 1px solid #e2e8f0;">${fmt(row.score1)}</td>
            <td style="text-align: right; border: 1px solid #e2e8f0;">${fmt(row.score2)}</td>
            <td style="text-align: right; border: 1px solid #e2e8f0;">${fmt(row.scaleScore)}</td>
            <td style="text-align: right; border: 1px solid #e2e8f0;">${fmtPct(row.weightPercent)}</td>
            <td style="text-align: right; border: 1px solid #e2e8f0;">${fmtPct(row.contributionMax)}</td>
            <td style="text-align: right; font-weight: bold; color: #1e3a8a; border: 1px solid #e2e8f0;">${fmt(row.contributionScore)}</td>
          </tr>
        `;
      });
      // Khoảng trống giữa các môn học
      tableHtml += `<tr><td colspan="8" style="height: 15px; border: none;"></td></tr>`;
    });
  });

  tableHtml += `</table>`;

  const htmlStr = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Bảng Điểm Chi Tiết</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
    </head>
    <body>
      ${tableHtml}
    </body>
    </html>
  `;

  const blob = new Blob(["\uFEFF" + htmlStr], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bang_diem_chi_tiet_${new Date().toLocaleDateString("vi-VN").replace(/\//g, "-")}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

// Màu score dùng cho HTML report
function scoreHtmlClass(value: number | null | undefined): string {
  if (value === null || value === undefined) return "score-gray";
  const n = value / 100;
  if (n >= 8.5) return "score-green";
  if (n >= 7.0) return "score-blue";
  if (n >= 5.5) return "score-yellow";
  if (n > 0) return "score-red";
  return "score-gray";
}

// Xuất báo cáo HTML đẹp, dễ đọc — có chú giải từng cột
type GroupedForReport = Array<{
  semester: string;
  classes: Array<{
    classKey: string;
    courseCode: string;
    classCode: string;
    courseName: string;
    transcript: {
      letter: string | null;
      score10: number | null;
      credits: number;
      gpa4?: number | null;
    } | null;
    rows: TranscriptDetailItem[];
  }>;
}>;

function exportToHTML(grouped: GroupedForReport) {
  const now = new Date().toLocaleString("vi-VN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const totalCourses = grouped.reduce((s, g) => s + g.classes.length, 0);
  const totalSemesters = grouped.length;
  const totalComponents = grouped.reduce(
    (s, g) => s + g.classes.reduce((s2, c) => s2 + c.rows.length, 0), 0,
  );

  function badgeClass(letter: string | null): string {
    if (!letter) return "badge-gray";
    const l = letter.toUpperCase();
    if (l.startsWith("A")) return "badge-grade-A";
    if (l.startsWith("B")) return "badge-grade-B";
    if (l.startsWith("C")) return "badge-grade-C";
    return "badge-grade-F";
  }

  function fmt(v: number | null): string {
    return v != null ? (v / 100).toFixed(2) : "--";
  }
  function fmtPct(v: number | null): string {
    return v != null ? (v / 100).toFixed(2) + "%" : "--";
  }

  const semesterHtml = grouped.map((sem) => {
    const classHtml = sem.classes.map((cls) => {
      const rowHtml = cls.rows.map((row, i) => {
        const missing = row.score1 === null ? ' class="no-score"' : "";
        return `<tr${missing}>
          <td>${i + 1}</td>
          <td>${row.componentLabel}</td>
          <td class="${scoreHtmlClass(row.score1)}">${fmt(row.score1)}</td>
          <td class="${scoreHtmlClass(row.score2)}">${fmt(row.score2)}</td>
          <td>${fmt(row.scaleScore)}</td>
          <td>${fmtPct(row.weightPercent)}</td>
          <td>${fmtPct(row.contributionMax)}</td>
          <td class="${scoreHtmlClass(row.contributionScore)}">${fmt(row.contributionScore)}</td>
        </tr>`;
      }).join("");

      const letter = cls.transcript?.letter ?? null;
      const score10 = cls.transcript?.score10;
      const credits = cls.transcript?.credits;
      const sc10Label = score10 != null ? score10.toFixed(1) : "--";

      return `<div class="course-block">
        <div class="course-header">
          <div class="course-name">📚 ${cls.courseName || cls.classCode}</div>
          <span class="badge badge-gray">${cls.classCode}</span>
          ${letter ? `<span class="badge ${badgeClass(letter)}">${letter}</span>` : ""}
          ${score10 != null ? `<span class="badge badge-gray">Điểm 10: ${sc10Label}</span>` : ""}
          ${credits != null ? `<span class="badge badge-gray">${credits} tín chỉ</span>` : ""}
        </div>
        <table class="component-table">
          <thead><tr>
            <th>#</th>
            <th>Thành phần điểm</th>
            <th>Điểm lần 1</th>
            <th>Điểm lần 2</th>
            <th>Thang điểm</th>
            <th>% Đóng góp</th>
            <th>% Tối đa</th>
            <th>Quy đổi</th>
          </tr></thead>
          <tbody>${rowHtml}</tbody>
        </table>
      </div>`;
    }).join("");

    return `<div class="semester-section">
      <div class="semester-header">📅 ${sem.semester} — ${sem.classes.length} lớp học phần</div>
      ${classHtml}
    </div>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="vi"><head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bảng Điểm Chi Tiết — MYDTU Assistant</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:#f0f4f8;color:#1a202c;padding:24px}
    .report{max-width:1080px;margin:0 auto}
    .header{background:linear-gradient(135deg,#1e3a8a,#2563eb);color:#fff;border-radius:16px;padding:28px 32px;margin-bottom:20px}
    .header h1{font-size:1.6rem;font-weight:800;margin-bottom:6px}
    .header p{opacity:.85;font-size:.88rem}
    .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:14px;margin-bottom:20px}
    .stat-card{background:#fff;border-radius:12px;padding:14px 18px;box-shadow:0 2px 8px rgba(0,0,0,.06)}
    .stat-label{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b}
    .stat-value{font-size:1.5rem;font-weight:800;color:#1e3a8a;margin-top:4px}
    .semester-section{background:#fff;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,.06);margin-bottom:20px;overflow:hidden}
    .semester-header{background:linear-gradient(to right,#1e3a8a,#2563eb);color:#fff;padding:13px 20px;font-weight:700;font-size:.93rem}
    .course-block{border-bottom:1px solid #e2e8f0}
    .course-block:last-child{border-bottom:none}
    .course-header{padding:12px 18px;background:#f8faff;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
    .course-name{font-weight:700;font-size:.92rem;color:#1e3a8a;flex:1;min-width:160px}
    .badge{display:inline-flex;align-items:center;border-radius:999px;padding:3px 10px;font-size:.72rem;font-weight:700}
    .badge-grade-A{background:#dcfce7;color:#14532d}
    .badge-grade-B{background:#dbeafe;color:#1e3a8a}
    .badge-grade-C{background:#fef9c3;color:#713f12}
    .badge-grade-F{background:#fee2e2;color:#7f1d1d}
    .badge-gray{background:#f1f5f9;color:#475569}
    .component-table{width:100%;border-collapse:collapse;font-size:.85rem}
    .component-table th{background:#f8faff;color:#64748b;font-weight:700;font-size:.68rem;text-transform:uppercase;letter-spacing:.06em;padding:9px 14px;text-align:left;border-bottom:1px solid #e2e8f0}
    .component-table td{padding:9px 14px;border-bottom:1px solid #f1f5f9}
    .component-table tr:last-child td{border-bottom:none}
    .component-table tr.no-score td{background:#fffbeb}
    .score-green{font-weight:700;color:#15803d}
    .score-blue{font-weight:700;color:#1d4ed8}
    .score-yellow{font-weight:700;color:#b45309}
    .score-red{font-weight:700;color:#b91c1c}
    .score-gray{color:#94a3b8}
    .legend{background:#fff;border-radius:12px;padding:18px 22px;box-shadow:0 2px 8px rgba(0,0,0,.06);margin-top:8px}
    .legend h3{font-size:.88rem;font-weight:800;color:#1e3a8a;margin-bottom:10px}
    .legend-item{font-size:.8rem;margin-bottom:6px;color:#334155;line-height:1.5}
    .color-legend{display:flex;gap:16px;flex-wrap:wrap;margin-top:8px}
    .color-dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px;vertical-align:middle}
    @media print{body{background:#fff;padding:8px}.semester-section{box-shadow:none;border:1px solid #e2e8f0}}
  </style>
</head><body><div class="report">
  <div class="header">
    <h1>📊 Bảng Điểm Chi Tiết</h1>
    <p>Xuất từ MYDTU Assistant &bull; ${now} &bull; ${totalCourses} lớp học phần &bull; ${totalSemesters} học kỳ</p>
  </div>
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-label">Tổng lớp học phần</div><div class="stat-value">${totalCourses}</div></div>
    <div class="stat-card"><div class="stat-label">Học kỳ</div><div class="stat-value">${totalSemesters}</div></div>
    <div class="stat-card"><div class="stat-label">Thành phần điểm</div><div class="stat-value">${totalComponents}</div></div>
  </div>
  ${semesterHtml}
  <div class="legend">
    <h3>📖 Hướng dẫn đọc bảng điểm</h3>
    <div class="legend-item">📝 <b>Thành phần điểm</b>: Tên bài kiểm tra / bài tập (Chuyên cần, Kiểm tra giữa kỳ, Cuối kỳ, Bài tập…)</div>
    <div class="legend-item">🔢 <b>Điểm lần 1 / Lần 2</b>: Điểm thực tế nhận được. Lần 2 là điểm thi lại nếu có. <span class="score-gray">--</span> nghĩa là chưa có điểm hoặc chưa chấm.</div>
    <div class="legend-item">📐 <b>Thang điểm</b>: Điểm tối đa của thành phần (thường 10).</div>
    <div class="legend-item">⚖️ <b>% Đóng góp</b>: Điểm thực tế bạn đã đóng góp vào tổng điểm <em>(= điểm / thang × trọng số)</em>.</div>
    <div class="legend-item">🎯 <b>% Tối đa</b>: Trọng số / tỷ lệ của thành phần trong tổng điểm (ví dụ: Chuyên cần = 5%, Cuối kỳ = 55%).</div>
    <div class="legend-item">✅ <b>Quy đổi</b>: Điểm quy đổi đã cộng vào điểm tổng kết môn.</div>
    <div class="legend-item">🟡 <b>Nền vàng nhạt</b>: Thành phần chưa có điểm (chưa thi / chưa chấm).</div>
    <div class="color-legend">
      <span><span class="color-dot" style="background:#15803d"></span><span class="score-green">Xuất sắc ≥8.5</span></span>
      <span><span class="color-dot" style="background:#1d4ed8"></span><span class="score-blue">Khá ≥7.0</span></span>
      <span><span class="color-dot" style="background:#b45309"></span><span class="score-yellow">Trung bình ≥5.5</span></span>
      <span><span class="color-dot" style="background:#b91c1c"></span><span class="score-red">Yếu &lt;5.5</span></span>
    </div>
  </div>
</div></body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bao_cao_diem_${new Date().toLocaleDateString("vi-VN").replace(/\//g, "-")}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

function extractSemesterMeta(semester: string) {
  const source = String(semester || "").trim();
  const normalized = normalizeText(source);

  let term = "Khác";
  let termOrder = 99;

  if (
    normalized.includes("học kỳ ii") ||
    normalized.includes("hoc ky ii") ||
    normalized.includes("học kỳ 2") ||
    normalized.includes("hoc ky 2")
  ) {
    term = "Học kỳ II";
    termOrder = 2;
  } else if (
    normalized.includes("học kỳ i") ||
    normalized.includes("hoc ky i") ||
    normalized.includes("học kỳ 1") ||
    normalized.includes("hoc ky 1")
  ) {
    term = "Học kỳ I";
    termOrder = 1;
  } else if (
    normalized.includes("học kỳ hè") ||
    normalized.includes("hoc ky he")
  ) {
    term = "Học kỳ Hè";
    termOrder = 3;
  }

  const yearMatch = source.match(/\d{4}\s*-\s*\d{4}/);
  const academicYear = yearMatch ? yearMatch[0].replace(/\s+/g, "") : "Khác";

  return {
    raw: source,
    academicYear,
    term,
    termOrder,
  };
}

function compareSemesters(a: string, b: string) {
  const ma = extractSemesterMeta(a);
  const mb = extractSemesterMeta(b);

  if (ma.academicYear !== mb.academicYear) {
    return mb.academicYear.localeCompare(ma.academicYear);
  }

  if (ma.termOrder !== mb.termOrder) {
    return mb.termOrder - ma.termOrder;
  }

  return a.localeCompare(b);
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="app-card-strong rounded-xl px-3 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] app-text-muted">
        {label}
      </div>
      <div className="mt-1 text-[15px] font-bold">{value}</div>
    </div>
  );
}

function TranscriptDetailSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="app-section p-4">
          <div className="flex justify-between mb-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((__, j) => (
              <div key={j} className="border border-[var(--border-main)] rounded-2xl p-4">
                <Skeleton className="h-5 w-1/2 mb-3" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border-main)] px-4 py-5 text-sm font-medium app-text-muted">
      {children}
    </div>
  );
}

export default function TranscriptDetailPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<TranscriptDetailItem[]>([]);
  const [meta, setMeta] = useState<MetaState>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [classCodeFilter, setClassCodeFilter] = useState("all");

  async function load() {
    setLoading(true);
    setError(null);

    // --- STEP 1: LOAD CACHE ---
    try {
      const cached = localStorage.getItem("mydtu:transcript-detail-cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.items) {
          setItems(parsed.items);
          setMeta(parsed.meta);
          setLoading(false); // Quick display
        }
      }
    } catch {
      // Ignore
    }

    // --- STEP 2: FETCH FRESH ---
    try {
      const data = await fetchTranscriptDetail();
      setItems(data.items || []);
      setMeta(data.meta ?? null);
      
      // Save cache
      localStorage.setItem("mydtu:transcript-detail-cache", JSON.stringify({
        items: data.items,
        meta: data.meta,
      }));
    } catch (e) {
      if (items.length === 0) {
        setError(String((e as Error)?.message || e));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const onUpdated = () => {
      void load();
    };

    window.addEventListener("mydtu:transcript-detail-updated", onUpdated);
    return () => {
      window.removeEventListener("mydtu:transcript-detail-updated", onUpdated);
    };
  }, []);

  const semesterOptions = useMemo(() => {
    return Array.from(new Set(items.map((x) => x.semester))).sort(
      compareSemesters,
    );
  }, [items]);

  const classCodeOptions = useMemo(() => {
    return Array.from(new Set(items.map((x) => x.classCode))).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const source = [
        item.semester,
        item.courseCode,
        item.classCode,
        item.courseName,
        item.componentLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchText.trim()
        ? source.includes(searchText.trim().toLowerCase())
        : true;

      const matchesSemester =
        semesterFilter === "all" ? true : item.semester === semesterFilter;

      const matchesClass =
        classCodeFilter === "all" ? true : item.classCode === classCodeFilter;

      return matchesSearch && matchesSemester && matchesClass;
    });
  }, [items, searchText, semesterFilter, classCodeFilter]);

  const grouped = useMemo(() => {
    const semesterMap = new Map<string, Map<string, TranscriptDetailItem[]>>();

    for (const item of filteredItems) {
      if (!semesterMap.has(item.semester)) {
        semesterMap.set(item.semester, new Map());
      }

      const classKey = `${item.courseCode}||${item.classCode}||${item.courseName || ""}`;
      const classMap = semesterMap.get(item.semester)!;

      if (!classMap.has(classKey)) {
        classMap.set(classKey, []);
      }

      classMap.get(classKey)!.push(item);
    }

    return Array.from(semesterMap.entries())
      .sort((a, b) => compareSemesters(a[0], b[0]))
      .map(([semester, classMap]) => ({
        semester,
        classes: Array.from(classMap.entries())
          .map(([classKey, rows]) => ({
            classKey,
            courseCode: rows[0]?.courseCode || "",
            classCode: rows[0]?.classCode || "",
            courseName: rows[0]?.courseName || "",
            transcript: rows[0]?.transcript || null,
            rows: [...rows].sort((a, b) => a.displayOrder - b.displayOrder),
          }))
          .sort((a, b) => {
            const byCode = a.courseCode.localeCompare(b.courseCode);
            if (byCode !== 0) return byCode;
            return a.classCode.localeCompare(b.classCode);
          }),
      }));
  }, [filteredItems]);

  const lastSyncedLabel = meta?.lastSyncedAt
    ? new Date(meta.lastSyncedAt).toLocaleString("vi-VN")
    : t("common.noDataYet", "Chưa có");

  const totalClasses = useMemo(
    () =>
      new Set(
        filteredItems.map((item) => `${item.semester}||${item.classCode}`),
      ).size,
    [filteredItems],
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      {/* Dòng 1: Tiêu đề + nút Sync */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[1.9rem] font-bold tracking-tight">
            {t("transcriptDetail.title", "Bảng điểm chi tiết")}
          </h1>
          <p className="mt-1 text-sm font-medium app-text-muted">
            {t(
              "transcriptDetail.subtitle",
              "Theo dõi điểm thành phần, tỷ trọng đánh giá và tiến độ chấm theo từng lớp học phần.",
            )}
          </p>
        </div>
        <div className="shrink-0">
          <SyncTranscriptDetailButton />
        </div>
      </div>

      {/* Dòng 2: Các nút action — luôn một hàng, không wrap */}
      <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="text-[13px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline flex items-center gap-1.5 transition-colors"
          >
            <span className={loading ? "animate-spin" : ""}>🔄</span> {t("common.reload", "Tải lại dữ liệu")}
          </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => exportToExcel(grouped as GroupedForReport)}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-main)] bg-[var(--bg-soft)] px-4 py-2 text-[13px] font-bold shadow-sm hover:bg-[var(--bg-card)] hover:border-emerald-500/30 hover:text-emerald-600 dark:hover:text-emerald-400 hover:-translate-y-0.5 transition-all group"
          >
            <svg className="w-4 h-4 text-[var(--text-muted)] group-hover:text-emerald-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Xuất Excel
          </button>
          <button
            onClick={() => exportToHTML(grouped as GroupedForReport)}
            title="Xuất báo cáo HTML đẹp — có hướng dẫn đọc từng cột, màu sắc theo điểm, in được"
            className="relative overflow-hidden group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 text-[13px] font-bold shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <svg className="w-4 h-4 group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            Báo cáo HTML
          </button>
        </div>
      </div>

      <div className="msg-notice rounded-[22px] px-5 py-4 text-sm shadow-[0_10px_30px_rgba(245,158,11,0.08)]">
        <div className="font-extrabold">
          {t("transcriptDetail.notice.title", "Lưu ý đồng bộ")}
        </div>
        <div className="mt-2 font-semibold leading-7">
          {t(
            "transcriptDetail.notice.steps",
            "Bước 1: bấm “Kết nối MYDTU”. Bước 2: đăng nhập nếu cần. Bước 3: quay lại ứng dụng và bấm “Sync bảng điểm chi tiết”.",
          )}
        </div>
      </div>

      <TranscriptDetailExtensionConnect />

      <div className="app-card rounded-3xl p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="lg:col-span-3">
            <label
              htmlFor="detail-search"
              className="mb-2 block text-sm font-bold"
            >
              {t("transcriptDetail.search.label", "Tìm kiếm")}
            </label>
            <input
              id="detail-search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={t(
                "transcriptDetail.search.placeholder",
                "Tìm theo mã môn, mã lớp, tên môn, thành phần điểm...",
              )}
              className="app-input rounded-2xl px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="detail-semester"
              className="mb-2 block text-sm font-bold"
            >
              {t("transcriptDetail.filter.semester", "Lọc học kỳ")}
            </label>
            <select
              id="detail-semester"
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="app-input rounded-2xl px-3 py-2 text-sm outline-none"
            >
              <option value="all">{t("common.all", "Tất cả")}</option>
              {semesterOptions.map((semester) => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="detail-class"
              className="mb-2 block text-sm font-bold"
            >
              {t("transcriptDetail.filter.classCode", "Lọc mã lớp")}
            </label>
            <select
              id="detail-class"
              value={classCodeFilter}
              onChange={(e) => setClassCodeFilter(e.target.value)}
              className="app-input rounded-2xl px-3 py-2 text-sm outline-none"
            >
              <option value="all">{t("common.all", "Tất cả")}</option>
              {classCodeOptions.map((classCode) => (
                <option key={classCode} value={classCode}>
                  {classCode}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setSearchText("");
                setSemesterFilter("all");
                setClassCodeFilter("all");
              }}
              className="app-btn rounded-2xl px-4 py-2 text-sm font-bold"
            >
              {t("common.resetFilters", "Reset bộ lọc")}
            </button>
          </div>
        </div>

        {loading && items.length === 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="app-card-strong rounded-xl px-3 py-3">
                <Skeleton className="h-2.5 w-20 mb-2" />
                <Skeleton className="h-5 w-12" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={t("transcriptDetail.stat.rows", "Số dòng thành phần")}
              value={filteredItems.length}
            />
            <StatCard
              label={t("transcriptDetail.stat.classes", "Số lớp học phần")}
              value={totalClasses}
            />
            <StatCard
              label={t("transcriptDetail.stat.semesters", "Số học kỳ")}
              value={grouped.length}
            />
            <StatCard
              label={t("transcriptDetail.stat.lastSync", "Lần sync cuối")}
              value={lastSyncedLabel}
            />
          </div>
        )}
      </div>

      <div className="app-card rounded-3xl p-4">
        {loading && items.length === 0 ? (
          <TranscriptDetailSkeleton />
        ) : error ? (
          <EmptyBox>{error}</EmptyBox>
        ) : grouped.length === 0 ? (
          <div className="space-y-4">
          <div className="py-8">
            <div className="border border-indigo-200 dark:border-indigo-800/50 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-3xl p-6 text-center flex flex-col items-center justify-center gap-4 max-w-2xl mx-auto shadow-sm">
              <span className="text-5xl opacity-90 drop-shadow-sm mb-1">📭</span>
              <div className="text-lg font-black text-indigo-900 dark:text-indigo-200">Không tìm thấy dữ liệu bảng điểm</div>
              <p className="text-[13px] font-medium text-indigo-700/80 dark:text-indigo-300/80 leading-relaxed max-w-lg">
                Nếu bạn vừa quét đồng bộ nhưng MYDTU không trả về điểm của học kỳ này, <strong>rất có chuyên khả năng do bạn chưa Đánh giá Giảng viên</strong> nên hệ thống MYDTU đã tạm ẩn toàn bộ kết quả học tập.
              </p>
              <a
                href="/rateflow"
                className="mt-3 relative overflow-hidden group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-[14px] font-black text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-lg group-hover:scale-110 transition-transform">⚡</span>
                <span>Chuyển vào Đánh Giá Giảng Viên</span>
              </a>
            </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map((semesterGroup) => (
              <section key={semesterGroup.semester} className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold">
                    {semesterGroup.semester}
                  </h2>
                  <div className="mt-1 text-sm font-medium app-text-muted">
                    {semesterGroup.classes.length} lớp học phần
                  </div>
                </div>

                <div className="space-y-4">
                  {semesterGroup.classes.map((classGroup) => {
                    const totalWeightPercent = classGroup.rows.reduce(
                      (sum, row) => sum + Number(row.weightPercent || 0),
                      0,
                    );

                    return (
                      <div
                        key={classGroup.classKey}
                        className="overflow-hidden rounded-3xl border border-[var(--border-main)] bg-[var(--bg-card)]"
                      >
                        <div className="border-b border-[var(--border-main)] bg-[var(--bg-soft)]/40 px-4 py-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <div className="text-lg font-bold">
                                {classGroup.courseName}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm app-text-muted">
                                <span className="app-pill rounded-full px-3 py-1">
                                  {classGroup.courseCode}
                                </span>
                                <span className="app-pill rounded-full px-3 py-1">
                                  {classGroup.classCode}
                                </span>
                                {classGroup.transcript?.letter ? (
                                  <span className="app-pill rounded-full px-3 py-1">
                                    {t("transcript.table.letter", "Điểm chữ")}:{" "}
                                    {classGroup.transcript.letter}
                                  </span>
                                ) : null}
                                {typeof classGroup.transcript?.score10 ===
                                "number" ? (
                                  <span className="app-pill rounded-full px-3 py-1">
                                    {t("transcript.table.score10", "Điểm 10")}:{" "}
                                    {formatScore(classGroup.transcript.score10)}
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                              <StatCard
                                label={t(
                                  "transcriptDetail.class.totalWeight",
                                  "Tổng %",
                                )}
                                value={`${(totalWeightPercent / 100).toFixed(2)}%`}
                              />
                              <StatCard
                                label={t(
                                  "transcriptDetail.class.components",
                                  "Thành phần",
                                )}
                                value={classGroup.rows.length}
                              />
                              <StatCard
                                label={t("transcript.table.credits", "Tín chỉ")}
                                value={classGroup.transcript?.credits ?? "--"}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="overflow-auto">
                          <table className="w-full min-w-[700px] text-sm">
                            <thead className="bg-[var(--bg-soft)] text-left app-text-soft">
                              <tr>
                                <th className="px-3 py-2.5">#</th>
                                <th className="px-3 py-2.5">
                                  {t(
                                    "transcriptDetail.table.component",
                                    "Thành phần",
                                  )}
                                </th>
                                <th className="px-3 py-2.5">
                                  {t(
                                    "transcriptDetail.table.score1",
                                    "Điểm L1",
                                  )}
                                </th>
                                <th className="px-3 py-2.5">
                                  {t(
                                    "transcriptDetail.table.score2",
                                    "Điểm L2",
                                  )}
                                </th>
                                <th className="px-3 py-2.5">
                                  {t(
                                    "transcriptDetail.table.scale",
                                    "Thang",
                                  )}
                                </th>
                                <th className="px-3 py-2.5">
                                  {t("transcriptDetail.table.weight", "% Điểm")}
                                </th>
                                <th className="px-3 py-2.5">
                                  {t("transcriptDetail.table.max", "% Tối đa")}
                                </th>
                                <th className="px-3 py-2.5">
                                  {t(
                                    "transcriptDetail.table.contribution",
                                    "Quy đổi",
                                  )}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {classGroup.rows.map((row, index) => (
                                <tr
                                  key={row.id}
                                  className={`border-t border-[var(--border-main)] ${row.score1 === null ? "bg-[var(--bg-soft)]/50" : ""}`}
                                >
                                  <td className="px-3 py-2.5 font-semibold">
                                    {index + 1}
                                  </td>
                                  <td className="px-3 py-2.5 font-bold">
                                    {row.componentLabel}
                                  </td>
                                  <td className={`px-3 py-2.5 font-bold ${getScoreColor(row.score1)}`}>
                                    {formatDetailScore(row.score1)}
                                  </td>
                                  <td className={`px-3 py-2.5 font-bold ${getScoreColor(row.score2)}`}>
                                    {formatDetailScore(row.score2)}
                                  </td>
                                  <td className="px-3 py-2.5 font-semibold">
                                    {formatDetailScore(row.scaleScore)}
                                  </td>
                                  <td className="px-3 py-2.5 font-semibold">
                                    {formatDetailPercent(row.weightPercent)}
                                  </td>
                                  <td className="px-3 py-2.5 font-semibold">
                                    {formatDetailPercent(row.contributionMax)}
                                  </td>
                                  <td className={`px-3 py-2.5 font-bold ${getScoreColor(row.contributionScore)}`}>
                                    {formatDetailScore(row.contributionScore)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
