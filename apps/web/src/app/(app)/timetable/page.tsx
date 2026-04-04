"use client";

import SyncTimetableButton from "@/components/SyncTimetableButton";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ExtensionConnect from "./ExtensionConnect";

type TimetableItem = {
  id: string;
  semester: string;
  weekLabel?: string | null;
  weekStartDate?: string | null;
  weekEndDate?: string | null;
  occurrenceDate?: string | null;
  courseCode: string;
  courseName: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  campus: string | null;
  weeksIncluded: string | null;
  weeksCanceled?: string | null;
};

type ApiResponse = {
  ok: boolean;
  mode?: "all" | "day" | "week" | "month";
  from?: string | null;
  to?: string | null;
  items?: TimetableItem[];
  message?: string;
  meta?: {
    lastSyncedAt?: string | null;
    lastSyncStatus?: string | null;
    lastSyncCounts?: unknown;
  };
};

type ViewMode = "day" | "week" | "month";

type DisplayGroup = {
  key: string;
  label: string;
  items: TimetableItem[];
};

type MonthCell = {
  key: string;
  date: Date;
  items: TimetableItem[];
  inCurrentMonth: boolean;
  isToday: boolean;
};

type ToastTone = "success" | "info" | "warning" | "error";

type AppToast = {
  id: string;
  tone: ToastTone;
  title: string;
  message?: string;
};

function exportToExcel(items: TimetableItem[], periodLabel: string, t: any, language: string) {
  const tableHtml = `
    <table border="1" cellpadding="4" cellspacing="0" style="font-family: Arial, sans-serif; font-size: 11pt; border-collapse: collapse;">
      <tr>
        <th colspan="8" style="background-color: #1e3a8a; color: white; font-size: 14pt; font-weight: bold; text-align: center; height: 40px; border: 1px solid #1e3a8a;">${t("timetable.export.title", "LỊCH HỌC")} (${periodLabel})</th>
      </tr>
      <tr>
        <th style="background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; height: 30px;">${t("timetable.export.stt", "STT")}</th>
        <th style="background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;">${t("timetable.export.date", "Ngày học")}</th>
        <th style="background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;">${t("timetable.export.weekday", "Thứ")}</th>
        <th style="background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;">${t("timetable.export.time", "Thời gian")}</th>
        <th style="background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; width: 300px;">${t("timetable.export.course", "Môn học & Mã môn")}</th>
        <th style="background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;">${t("timetable.export.roomMode", "Phòng / Hình thức")}</th>
        <th style="background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;">${t("timetable.export.campus", "Cơ sở")}</th>
        <th style="background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;">${t("timetable.export.weekLabel", "Tuần / Học kỳ")}</th>
      </tr>
      ${items.map((it, i) => {
        const d = parseOccurrenceDate(it.occurrenceDate);
        const dateStr = d ? formatShortDate(d, language) : "--";
        const weekday = toWeekdayLabel(it.dayOfWeek, language);
        const mode = getDeliveryMode(it);
        const badgeColor = mode === 'online' ? '#1d4ed8' : '#c2410c';
        const badgeBg = mode === 'online' ? '#dbeafe' : '#ffedd5';
        
        return `
        <tr>
          <td style="text-align: center; border: 1px solid #e2e8f0; vertical-align: middle;">${i + 1}</td>
          <td style="font-weight: bold; text-align: center; border: 1px solid #e2e8f0; vertical-align: middle;">${dateStr}</td>
          <td style="text-align: center; border: 1px solid #e2e8f0; vertical-align: middle;">${weekday}</td>
          <td style="text-align: center; font-weight: bold; color: #334155; border: 1px solid #e2e8f0; vertical-align: middle;">${it.startTime} - ${it.endTime}</td>
          <td style="border: 1px solid #e2e8f0; vertical-align: middle;">
            <div style="font-weight: bold; color: #1e3a8a;">${it.courseName || ""}</div>
            <div style="color: #64748b; font-size: 10pt;">${it.courseCode}</div>
          </td>
          <td style="text-align: center; border: 1px solid #e2e8f0; vertical-align: middle;">
            <span style="font-weight: bold;">${it.room || "--"}</span><br>
            <span style="display: inline-block; padding: 2px 6px; font-size: 9pt; font-weight: bold; color: ${badgeColor}; background-color: ${badgeBg}; border-radius: 4px; margin-top: 4px;">
              ${mode === 'online' ? t("timetable.export.online", "Online") : t("timetable.export.onsite", "Onsite")}
            </span>
          </td>
          <td style="text-align: center; border: 1px solid #e2e8f0; vertical-align: middle;">${it.campus || "--"}</td>
          <td style="text-align: center; color: #64748b; border: 1px solid #e2e8f0; vertical-align: middle;">${it.weekLabel || it.weeksIncluded || it.semester || "--"}</td>
        </tr>
      `}).join('')}
    </table>
  `;

  const htmlStr = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>DL</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
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
  a.download = `lich_hoc_${new Date().toLocaleDateString("vi-VN").replace(/\//g, "-")}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportToHTML(items: TimetableItem[], periodLabel: string, t: any, language: string) {
  const now = new Date().toLocaleString(language === "vi" ? "vi-VN" : "en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
  const totalClasses = items.length;

  let rowsHtml = items.map((it, i) => {
    const d = parseOccurrenceDate(it.occurrenceDate);
    const dateStr = d ? formatShortDate(d, language) : "--";
    const weekday = toWeekdayLabel(it.dayOfWeek, language);
    const mode = getDeliveryMode(it);
    return `
      <tr>
        <td style="text-align:center">${i + 1}</td>
        <td>${dateStr}</td>
        <td>${weekday}</td>
        <td><span class="badge time">${it.startTime} - ${it.endTime}</span></td>
        <td style="font-weight:bold; color:#1e3a8a">${it.courseCode}</td>
        <td>${it.courseName || ""}</td>
        <td>${it.room}</td>
        <td>${it.campus || ""}</td>
        <td><span class="badge mode ${mode === 'online' ? 'online' : 'onsite'}">${mode === 'online' ? t("timetable.export.online", "Online") : t("timetable.export.onsite", "Onsite")}</span></td>
      </tr>
    `;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="${language}"><head>
  <meta charset="UTF-8">
  <title>${t("timetable.export.title", "Lịch Học")}</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:#f0f4f8;color:#1a202c;padding:24px}
    .report{max-width:1080px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,.06);overflow:hidden}
    .header{background:linear-gradient(135deg,#1e3a8a,#2563eb);color:#fff;padding:28px 32px}
    .header h1{font-size:1.6rem;font-weight:800;margin:0 0 6px}
    .header p{opacity:.85;font-size:.88rem;margin:0}
    .content{padding:24px}
    table{width:100%;border-collapse:collapse;font-size:.85rem}
    th{background:#f8faff;color:#64748b;font-weight:700;font-size:.7rem;text-transform:uppercase;padding:10px 14px;text-align:left;border-bottom:2px solid #e2e8f0}
    td{padding:10px 14px;border-bottom:1px solid #f1f5f9}
    .badge{display:inline-flex;align-items:center;border-radius:999px;padding:3px 10px;font-size:.72rem;font-weight:700}
    .time{background:#f1f5f9;color:#475569}
    .online{background:#dbeafe;color:#1d4ed8}
    .onsite{background:#ffedd5;color:#c2410c}
    @media print{body{background:#fff;padding:0}.report{box-shadow:none}}
  </style>
</head><body><div class="report">
  <div class="header">
    <h1>🗓 ${t("timetable.export.title", "Lịch Học")} ${periodLabel ? "(" + periodLabel + ")" : ""}</h1>
    <p>${t("timetable.export.exportedFrom", "Xuất từ MYDTU Assistant")} &bull; ${now} &bull; ${t("timetable.export.events", { count: totalClasses, defaultValue: `${totalClasses} sự kiện học` })}</p>
  </div>
  <div class="content">
    <table>
      <thead><tr>
        <th style="width:40px;text-align:center">${t("timetable.export.stt", "STT")}</th>
        <th>${t("timetable.export.date", "Ngày học")}</th>
        <th>${t("timetable.export.weekday", "Thứ")}</th>
        <th>${t("timetable.export.time", "Thời gian")}</th>
        <th>${t("timetable.export.course", "Mã môn")}</th>
        <th>${t("timetable.export.courseName", "Tên môn")}</th>
        <th>${t("timetable.export.roomMode", "Phòng / Hình thức")}</th>
        <th>${t("timetable.export.campus", "Cơ sở")}</th>
        <th>${t("timetable.export.mode", "Loại")}</th>
      </tr></thead>
      <tbody>${rowsHtml || "<tr><td colspan=\"9\" style=\"text-align:center;padding:20px\">" + t("timetable.content.emptyWeek", "Không có dữ liệu lịch học") + "</td></tr>"}</tbody>
    </table>
  </div>
</div></body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lich_hoc_${new Date().toLocaleDateString("vi-VN").replace(/\//g, "-")}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

const BTN_NEUTRAL =
  "inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--border-main)] bg-[var(--bg-card)] px-5 text-sm font-bold text-[var(--text-main)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--accent)]/50 hover:text-[var(--accent)] active:scale-95";

const BTN_PRIMARY =
  "inline-flex h-11 items-center justify-center rounded-2xl border border-transparent bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-blue-500/40 active:scale-95";

function ExpandableHint({ title, children, isWarning }: { title: string; children: React.ReactNode; isWarning?: boolean }) {
  const [open, setOpen] = useState(false);
  const toneClass = isWarning ? "text-[var(--warning)]" : "text-[var(--accent)]";
  
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)] transition-all hover:border-[var(--accent)]/40 w-full mb-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold ${toneClass} hover:bg-[var(--bg-card-strong)] transition-colors`}
      >
        <span className="flex items-center gap-2">
          {isWarning ? (
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
             <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
          )}
          <span>{title}</span>
        </span>
        <svg
          className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"} shrink-0`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-[var(--border-main)] px-4 py-4 text-sm app-text-muted leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TimetablePage() {
  const { t, i18n } = useTranslation();

  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [items, setItems] = useState<TimetableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<ApiResponse["meta"] | null>(null);
  const [campusFilter, setCampusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("");
  const [toasts, setToasts] = useState<AppToast[]>([]);
  const [syncing, setSyncing] = useState(false);

  const selectedDateInputValue = formatDateInputValue(selectedDate);

  function pushToast(
    tone: ToastTone,
    title: string,
    message?: string,
    duration = 3600,
  ) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, tone, title, message }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, duration);
  }

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }

  async function load(mode = viewMode, date = selectedDate) {
    setLoading(true);
    setError(null);

    try {
      const qs = new URLSearchParams();
      qs.set("mode", mode);
      qs.set("date", formatDateInputValue(date));

      const res = await fetch(`/api/timetable?${qs.toString()}`, {
        cache: "no-store",
      });

      const text = await res.text();
      let data: ApiResponse | null = null;

      try {
        data = JSON.parse(text) as ApiResponse;
      } catch {
        data = null;
      }

      if (!res.ok) {
        setItems([]);
        setMeta(null);
        setError(data?.message || text || "Load timetable failed");
        return;
      }

      setItems(Array.isArray(data?.items) ? data.items : []);
      setMeta(data?.meta ?? null);
    } catch (e) {
      setItems([]);
      setMeta(null);
      setError(String((e as Error)?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(viewMode, selectedDate);
  }, [viewMode, selectedDate]);

  useEffect(() => {
    const onUpdated = () => {
      const successText = t("timetable.sync.successSimple");
      setSyncMessage(successText);
      setSyncing(false);
      pushToast(
        "success",
        i18n.language === "en"
          ? "Sync successful"
          : "Đồng bộ thời khoá biểu thành công",
        i18n.language === "en"
          ? "The latest timetable data has been updated from the extension."
          : "Dữ liệu thời khoá biểu mới nhất đã được cập nhật từ extension.",
      );
      void load(viewMode, selectedDate);
    };

    window.addEventListener("mydtu:timetable-updated", onUpdated);
    return () => {
      window.removeEventListener("mydtu:timetable-updated", onUpdated);
    };
  }, [viewMode, selectedDate, t, i18n.language]);

  const today = startOfToday();

  const campusOptions = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.campus?.trim()) set.add(item.campus.trim());
    }
    return Array.from(set).sort();
  }, [items]);

  const courseOptions = useMemo(() => {
    const map = new Map<string, { code: string; name: string }>();
    for (const item of items) {
      if (item.courseCode) {
        map.set(item.courseCode, {
          code: item.courseCode,
          name: item.courseName || "",
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCampus =
        campusFilter === "all" ? true : (item.campus || "") === campusFilter;

      const matchCourse = courseFilter === "all" || !courseFilter
        ? true
        : item.courseCode === courseFilter;

      return matchCampus && matchCourse;
    });
  }, [items, campusFilter, courseFilter]);

  const todayItems = useMemo(() => {
    return sortByTime(
      filteredItems.filter((item) => {
        const d = parseOccurrenceDate(item.occurrenceDate);
        return d ? isSameDate(d, today) : false;
      }),
    );
  }, [filteredItems, today]);

  const groupedForDisplay = useMemo<DisplayGroup[]>(() => {
    if (viewMode === "day") {
      return [
        {
          key: formatDateKey(selectedDate),
          label: formatFullDate(selectedDate, i18n.language),
          items: sortByTime(
            filteredItems.filter((item) => {
              const d = parseOccurrenceDate(item.occurrenceDate);
              return d ? isSameDate(d, selectedDate) : false;
            }),
          ),
        },
      ];
    }

    return groupWeekItems(filteredItems, selectedDate, i18n.language);
  }, [filteredItems, selectedDate, viewMode, i18n.language]);

  const monthCells = useMemo(() => {
    return buildMonthCells(filteredItems, selectedDate, today);
  }, [filteredItems, selectedDate, today]);

  const periodLabel = useMemo(() => {
    if (viewMode === "day") {
      return formatFullDate(selectedDate, i18n.language);
    }

    if (viewMode === "week") {
      const start = startOfWeek(selectedDate);
      const end = endOfWeek(selectedDate);
      return `${formatShortDate(start, i18n.language)} - ${formatShortDate(
        end,
        i18n.language,
      )}`;
    }

    return formatMonthYear(selectedDate, i18n.language);
  }, [selectedDate, viewMode, i18n.language]);

  const noClassToday = todayItems.length === 0;
  const lastSyncedText = meta?.lastSyncedAt
    ? formatDateTime(new Date(meta.lastSyncedAt), i18n.language)
    : t("common.noData");

  const syncStatusTone =
    meta?.lastSyncStatus === "SUCCESS"
      ? "success"
      : meta?.lastSyncStatus === "PARTIAL"
        ? "warning"
        : meta?.lastSyncStatus === "FAILED"
          ? "error"
          : "info";

  const syncStatusLabel =
    meta?.lastSyncStatus === "SUCCESS"
      ? i18n.language === "en"
        ? "Successful"
        : "Thành công"
      : meta?.lastSyncStatus === "PARTIAL"
        ? i18n.language === "en"
          ? "Partial"
          : "Một phần"
        : meta?.lastSyncStatus === "FAILED"
          ? i18n.language === "en"
            ? "Failed"
            : "Thất bại"
          : i18n.language === "en"
            ? "Not checked"
            : "Chưa có";

  function handlePrev() {
    if (viewMode === "day") {
      setSelectedDate(addDays(selectedDate, -1));
      return;
    }

    if (viewMode === "week") {
      setSelectedDate(addDays(selectedDate, -7));
      return;
    }

    setSelectedDate(addMonths(selectedDate, -1));
  }

  function handleNext() {
    if (viewMode === "day") {
      setSelectedDate(addDays(selectedDate, 1));
      return;
    }

    if (viewMode === "week") {
      setSelectedDate(addDays(selectedDate, 7));
      return;
    }

    setSelectedDate(addMonths(selectedDate, 1));
  }

  function handleToday() {
    setSelectedDate(startOfToday());
  }

  function handleSyncClick() {
    setSyncing(true);
    setSyncMessage(null);

    pushToast(
      "info",
      i18n.language === "en" ? "Sync started" : "Đang bắt đầu đồng bộ",
      i18n.language === "en"
        ? "Please wait while timetable data is fetched from the extension."
        : "Vui lòng chờ trong lúc hệ thống lấy dữ liệu thời khoá biểu từ extension.",
      2500,
    );

    window.setTimeout(() => {
      setSyncing(false);
    }, 5000);
  }

  return (
    <>
      <ToastViewport toasts={toasts} onClose={removeToast} />

      <style jsx global>{`
        @keyframes toastShrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        .syncing-timetable-button button {
          background: linear-gradient(
            180deg,
            #ef4444 0%,
            #dc2626 100%
          ) !important;
          border-color: transparent !important;
          color: #ffffff !important;
          box-shadow: 0 14px 30px rgba(239, 68, 68, 0.3) !important;
        }

        .syncing-timetable-button button:hover {
          filter: brightness(1.03);
        }
      `}</style>

      <div className="mx-auto w-full max-w-7xl space-y-4">
        {/* Tiêu đề & Sync */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-[1.9rem] font-bold tracking-tight">
              {t("timetable.title", "Thời khoá biểu")}
            </h1>
            <p className="mt-1 text-sm font-medium app-text-muted">
              {t("timetable.subtitle", "Xem lịch học theo ngày/tuần/tháng.")}
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 lg:items-end shrink-0">
            <div
              onClickCapture={handleSyncClick}
              className={syncing ? "syncing-timetable-button" : ""}
            >
              <SyncTimetableButton />
            </div>
            {syncMessage ? (
              <div
                className="mt-1 rounded-xl px-3 py-2 text-[14px] font-bold shadow-sm"
                style={{
                  background: "#dcfce7",
                  color: "#166534",
                  border: "1px solid #86efac",
                }}
              >
                {syncMessage}
              </div>
            ) : null}
          </div>
        </div>

        {/* Tùy chỉnh Layout cho Action: Tải lại, Export, Nhắc nhở */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
               pushToast(
                 "info",
                 i18n.language === "en" ? "Reloading data" : "Đang tải lại dữ liệu",
                 i18n.language === "en"
                   ? "Refreshing timetable from the current database snapshot."
                   : "Đang làm mới thời khoá biểu từ dữ liệu hiện có trong hệ thống.",
                 2200,
               );
               void load(viewMode, selectedDate);
            }}
            className={BTN_NEUTRAL}
          >
            {t("timetable.actions.reloadData", "Tải lại dữ liệu")}
          </button>

          <button
            type="button"
            onClick={() => {
              if (typeof Notification === "undefined") {
                 pushToast("error", i18n.language === "en" ? "Not Supported" : "Không hỗ trợ", i18n.language === "en" ? "Your browser does not support notifications." : "Trình duyệt của bạn không hỗ trợ thông báo.");
                 return;
              }
              if (Notification.permission === "default") {
                 Notification.requestPermission().then((perm) => {
                   if (perm === "granted") pushToast("success", i18n.language === "en" ? "Enabled" : "Đã bật", i18n.language === "en" ? "Notifications are allowed." : "Thông báo học tập đã được cấp quyền từ trình duyệt.");
                   else pushToast("error", i18n.language === "en" ? "Declined" : "Từ chối", i18n.language === "en" ? "Permission has been declined." : "Bạn chưa cấp quyền thông báo.");
                 });
              } else if (Notification.permission === "granted") {
                 pushToast("info", i18n.language === "en" ? "Already On" : "Đang bật", i18n.language === "en" ? "Notifications are already allowed." : "Trình duyệt đã cho phép nhận thông báo học tập.");
              } else {
                 pushToast("error", i18n.language === "en" ? "Blocked" : "Bị chặn", i18n.language === "en" ? "Please unblock notifications in site settings." : "Xin hãy vào cài đặt Cấp quyền cho Trang để mở lại.");
              }
            }}
            title={i18n.language === "en" ? "Enable study reminders" : "Bật/Tắt thông báo nhắc nhở lịch học"}
            className={BTN_NEUTRAL}
          >
            🔔 {t("timetable.actions.enableNotifications", "Bật nhắc nhở")}
          </button>
          
          <div className="ml-auto overflow-x-auto overflow-y-hidden pl-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportToExcel(filteredItems, periodLabel, t, i18n.language)}
              title={i18n.language === "en" ? "Export to styled Excel" : "Xuất lịch học ra tệp Excel với bố cục màu sắc trực quan, đẹp mắt"}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#b7ead9] bg-[#ecfdf5] px-5 text-sm font-bold text-[#047857] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-[#dff8ee] active:scale-95 gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {t("timetable.actions.exportExcel", "Xuất Excel")}
            </button>
            <button
              type="button"
              onClick={() => exportToHTML(filteredItems, periodLabel, t, i18n.language)}
              title={i18n.language === "en" ? "Export to HTML" : "Xuất báo cáo HTML cấu trúc chuyên nghiệp để thao tác in trực tiếp"}
              className={`${BTN_PRIMARY} gap-2`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              {t("timetable.actions.exportHtml", "Báo cáo HTML")}
            </button>
          </div>
        </div>

        {/* Các alert thông báo gọn gàng nhất */}
        <div className="flex flex-col xl:flex-row gap-4 items-start">
          <div className="flex-1 w-full xl:w-1/2">
             <ExpandableHint title={t("timetable.sync.guideTitle", "Lưu ý đồng bộ")} isWarning={true}>
                {t("timetable.sync.guideDesc", "Bước 1: Kết nối MYDTU. Bước 2: Kiểm tra kết nối. Bước 3: Khi thông báo báo kết nối thành công thay vì 'Chưa kết nối', vui lòng cuộn lên và bấm mục Đồng bộ lịch học phía trên.")}
             </ExpandableHint>
          </div>

          <div
            className="flex-1 w-full xl:w-1/2 mt-4 xl:mt-4 rounded-2xl px-5 py-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
            style={{
              background: "linear-gradient(135deg, rgba(240,253,244,0.78), rgba(220,252,231,0.62))",
              border: "1px solid rgba(134,239,172,0.55)",
            }}
          >
            <div className="font-extrabold text-[15px] text-[#14532d] flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/></svg>
               {t("timetable.summary.todayNotice", "Thông báo hôm nay")}
            </div>
            <div className="mt-1.5 font-semibold text-[#166534] text-sm leading-relaxed">
              {noClassToday
                ? t("timetable.notice.noClassToday", "Hôm nay bạn không có lịch học. Có thể nghỉ ngơi hoặc dành thời gian cá nhân.")
                : t("timetable.notice.hasClassToday", { count: todayItems.length, defaultValue: `Hôm nay bạn có ${todayItems.length} lịch học.` })}
            </div>
          </div>
        </div>

        <ExtensionConnect />

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4 items-start">
          <div className="min-w-0 space-y-4">
            <div className="app-card rounded-3xl p-4">
              <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
                <div className="flex min-w-0 flex-nowrap items-center gap-3 overflow-x-auto">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="app-btn inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] text-sm font-semibold"
                    aria-label={t("timetable.labels.viewPrevious")}
                    title={t("timetable.labels.viewPrevious")}
                  >
                    ←
                  </button>

                  <div className="min-w-0 shrink whitespace-nowrap text-[clamp(1.25rem,1.8vw,1.9rem)] font-bold tracking-tight">
                    {periodLabel}
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="app-btn inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] text-sm font-semibold"
                    aria-label={t("timetable.labels.viewNext")}
                    title={t("timetable.labels.viewNext")}
                  >
                    →
                  </button>

                  <button
                    type="button"
                    onClick={handleToday}
                    className="app-btn-primary inline-flex h-12 shrink-0 items-center justify-center rounded-[18px] px-5 text-sm font-semibold whitespace-nowrap"
                  >
                    {t("common.today")}
                  </button>
                </div>

                <div className="flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto">
                  <label htmlFor="timetable-date" className="sr-only">
                    {t("timetable.labels.selectDate")}
                  </label>

                  <div className="relative shrink-0">
                    <input
                      id="timetable-date"
                      type="date"
                      value={selectedDateInputValue}
                      onChange={(e) =>
                        setSelectedDate(parseDateInputValue(e.target.value))
                      }
                      className="app-input !w-[150px] min-w-[200px] max-w-[150px] h-10 shrink-0 rounded-[16px] pl-3 pr-9 text-[13px] outline-none"
                    />
                  </div>

                  <div className="app-card-strong flex shrink-0 rounded-[30px] p-1">
                    <ModeButton
                      active={viewMode === "day"}
                      onClick={() => setViewMode("day")}
                      label={t("timetable.viewMode.day")}
                    />
                    <ModeButton
                      active={viewMode === "week"}
                      onClick={() => setViewMode("week")}
                      label={t("timetable.viewMode.week")}
                    />
                    <ModeButton
                      active={viewMode === "month"}
                      onClick={() => setViewMode("month")}
                      label={t("timetable.viewMode.month")}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div>
                  <label htmlFor="campus-filter" className="sr-only">
                    {t("timetable.labels.filterCampus")}
                  </label>
                  <select
                    id="campus-filter"
                    value={campusFilter}
                    onChange={(e) => setCampusFilter(e.target.value)}
                    className="app-input rounded-2xl px-3 py-2 text-sm outline-none"
                    title={t("timetable.labels.filterCampus")}
                  >
                    <option value="all">
                      {t("timetable.filters.allCampuses")}
                    </option>
                    {campusOptions.map((campus) => (
                      <option key={campus} value={campus}>
                        {campus}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="course-filter" className="sr-only">
                    {i18n.language === "en" ? "Filter by course" : "Lọc theo môn học"}
                  </label>
                  <select
                    id="course-filter"
                    value={courseFilter}
                    onChange={(e) => setCourseFilter(e.target.value)}
                    className="app-input rounded-2xl px-3 py-2 text-sm outline-none w-full"
                    title={i18n.language === "en" ? "Filter by course" : "Lọc theo môn học"}
                  >
                    <option value="all">{t("timetable.filters.allCourses", "Tất cả các môn")}</option>
                    {courseOptions.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name ? `${c.name} (${c.code})` : c.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="app-card rounded-3xl p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-xl font-semibold">
                    {viewMode === "day"
                      ? t("timetable.content.daySchedule")
                      : viewMode === "week"
                        ? t("timetable.content.weekSchedule")
                        : t("timetable.content.monthSchedule")}
                  </div>
                  <div className="mt-1 text-sm app-text-muted">
                    {viewMode === "month"
                      ? t("timetable.content.monthOverview")
                      : t("timetable.content.fullDetails")}
                  </div>
                </div>

                <div className="text-sm app-text-muted">
                  {loading
                    ? t("common.loading")
                    : t("timetable.content.classes", {
                        count: filteredItems.length,
                      })}
                </div>
              </div>

              {loading ? (
                <EmptyState text={t("timetable.content.loadingTimetable")} />
              ) : error ? (
                <EmptyState text={error} isError />
              ) : viewMode === "month" ? (
                <MonthCalendar
                  cells={monthCells}
                  selectedDate={selectedDate}
                  onPickDate={(date) => {
                    setSelectedDate(date);
                    setViewMode("day");
                  }}
                  language={i18n.language}
                  t={t}
                />
              ) : groupedForDisplay.every(
                  (group) => group.items.length === 0,
                ) ? (
                <EmptyState
                  text={
                    viewMode === "day"
                      ? t("timetable.content.emptyDay")
                      : t("timetable.content.emptyWeek")
                  }
                />
              ) : (
                <div className="space-y-6">
                  {groupedForDisplay.map((group) => (
                    <div key={group.key}>
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold uppercase tracking-wide app-text-soft">
                          {group.label}
                        </h3>
                        <span className="app-pill rounded-full px-2.5 py-1 text-xs font-medium">
                          {t("timetable.content.classes", {
                            count: group.items.length,
                          })}
                        </span>
                      </div>

                      {group.items.length === 0 ? (
                        <div className="rounded-2xl border border-dashed px-4 py-4 text-sm app-text-muted">
                          {t("timetable.content.noSchedule")}
                        </div>
                      ) : (
                        <div
                          className="overflow-hidden rounded-3xl border"
                          style={{ borderColor: "var(--border-main)" }}
                        >
                          <div className="overflow-auto">
                            <table
                              className="w-full text-sm"
                              style={{ minWidth: 1080 }}
                            >
                              <thead
                                style={{ background: "var(--bg-soft)" }}
                                className="app-text-soft"
                              >
                                <tr className="text-left">
                                  <th className="px-4 py-3">
                                    {t("timetable.table.date")}
                                  </th>
                                  <th className="px-4 py-3">
                                    {t("timetable.table.weekday")}
                                  </th>
                                  <th className="px-4 py-3">
                                    {t("timetable.table.time")}
                                  </th>
                                  <th className="px-4 py-3">
                                    {t("timetable.table.courseCode")}
                                  </th>
                                  <th className="px-4 py-3">
                                    {t("timetable.table.courseName")}
                                  </th>
                                  <th className="px-4 py-3">
                                    {t("timetable.table.room")}
                                  </th>
                                  <th className="px-4 py-3">
                                    {t("timetable.table.campus")}
                                  </th>
                                  <th className="px-4 py-3">
                                    {t("timetable.table.mode")}
                                  </th>
                                  <th className="px-4 py-3">
                                    {t("timetable.table.week")}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.items.map((it) => {
                                  const occurrence = parseOccurrenceDate(
                                    it.occurrenceDate,
                                  );

                                  return (
                                    <tr
                                      key={it.id}
                                      style={{
                                        borderTop:
                                          "1px solid var(--border-main)",
                                      }}
                                    >
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        {occurrence
                                          ? formatShortDate(
                                              occurrence,
                                              i18n.language,
                                            )
                                          : "--"}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        {toWeekdayLabel(
                                          it.dayOfWeek,
                                          i18n.language,
                                        )}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <span
                                          className="rounded-xl px-2 py-1 text-xs font-medium"
                                          style={{
                                            background: "var(--bg-soft)",
                                          }}
                                        >
                                          {it.startTime} - {it.endTime}
                                        </span>
                                      </td>
                                      <td
                                        className="px-4 py-3 whitespace-nowrap font-semibold"
                                        style={{ color: "var(--accent)" }}
                                      >
                                        {it.courseCode}
                                      </td>
                                      <td className="px-4 py-3">
                                        {it.courseName || ""}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        {it.room}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        {it.campus || ""}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <DeliveryBadge item={it} t={t} />
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap app-text-soft">
                                        {it.weekLabel ||
                                          it.weeksIncluded ||
                                          it.semester ||
                                          ""}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="w-full xl:w-[280px] shrink-0 space-y-4">
            <div className="app-card rounded-3xl p-3 sticky top-6">
              <div className="text-[10px] font-semibold uppercase tracking-widest app-text-muted">
                {t("timetable.todayCard.title", "HÔM NAY")}
              </div>
              <div className="mt-1 text-base font-semibold">
                {formatFullDate(today, i18n.language)}
              </div>

              {todayItems.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed px-4 py-4 text-sm app-text-muted">
                  {t("timetable.labels.todayNoClass")}
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {todayItems.map((item) => (
                    <div
                      key={item.id}
                      className="app-card-strong rounded-2xl p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">
                            {item.courseName || item.courseCode}
                          </div>
                          <div
                            className="mt-1 text-sm"
                            style={{ color: "var(--accent)" }}
                          >
                            {item.courseCode}
                          </div>
                        </div>
                        <div className="app-pill rounded-xl px-2.5 py-1 text-xs font-semibold">
                          {item.startTime} - {item.endTime}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <DeliveryBadge item={item} t={t} />
                      </div>

                      <div className="mt-3 space-y-1 text-sm app-text-soft">
                        <div>
                          {t("timetable.labels.roomLabel", {
                            value: item.room || "--",
                          })}
                        </div>
                        <div>
                          {t("timetable.labels.campusLabel", {
                            value: item.campus || "--",
                          })}
                        </div>
                        <div>
                          {t("timetable.labels.weekLabel", {
                            value:
                              item.weekLabel ||
                              item.weeksIncluded ||
                              item.semester ||
                              "--",
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="app-card rounded-3xl p-3">
              <div className="text-[10px] font-semibold uppercase tracking-widest app-text-muted">
                {t("timetable.quickOverview.title")}
              </div>

              <div className="mt-4 rounded-3xl border border-[var(--border-main)] bg-[var(--bg-soft)]/55 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide app-text-muted">
                      {i18n.language === "en"
                        ? "Sync status"
                        : "Trạng thái đồng bộ"}
                    </div>
                    <div className="mt-2 text-base font-semibold">
                      {syncStatusLabel}
                    </div>
                    <div className="mt-1 text-sm app-text-muted">
                      {i18n.language === "en"
                        ? `Last sync: ${lastSyncedText}`
                        : `Lần sync cuối: ${lastSyncedText}`}
                    </div>
                  </div>

                  <span
                    className={[
                      "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                      syncStatusTone === "success"
                        ? "app-badge-online"
                        : syncStatusTone === "warning"
                          ? "app-pill-warning"
                          : syncStatusTone === "error"
                            ? "app-pill-danger"
                            : "app-pill",
                    ].join(" ")}
                  >
                    {syncStatusLabel}
                  </span>
                </div>
              </div>

              <div className="app-card mt-4 rounded-3xl p-4">
                <div className="text-sm font-semibold uppercase tracking-wide app-text-muted">
                  {t("timetable.quickOverview.colorLegend")}
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="app-badge-online rounded-full px-2.5 py-1 text-xs font-semibold">
                      {t("timetable.quickOverview.online")}
                    </span>
                    <span className="text-sm app-text-soft">
                      {t("timetable.labels.onlineDescription")}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="app-badge-onsite rounded-full px-2.5 py-1 text-xs font-semibold">
                      {t("timetable.quickOverview.onsite")}
                    </span>
                    <span className="text-sm app-text-soft">
                      {t("timetable.labels.onsiteDescription")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2">
                <QuickStatCard
                  label={t("timetable.quickOverview.currentViewMode")}
                  value={
                    viewMode === "day"
                      ? t("timetable.viewMode.day")
                      : viewMode === "week"
                        ? t("timetable.viewMode.week")
                        : t("timetable.viewMode.month")
                  }
                />
                <QuickStatCard
                  label={t("timetable.quickOverview.visibleItems")}
                  value={String(filteredItems.length)}
                />
                <QuickStatCard
                  label={t("timetable.quickOverview.todayItems")}
                  value={String(todayItems.length)}
                />
                <QuickStatCard
                  label={t("timetable.quickOverview.selectedDate")}
                  value={formatShortDate(selectedDate, i18n.language)}
                />
                <QuickStatCard
                  label={t("timetable.quickOverview.lastSync")}
                  value={lastSyncedText}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ToastViewport({
  toasts,
  onClose,
}: {
  toasts: AppToast[];
  onClose: (id: string) => void;
}) {
  if (!toasts.length) return null;

  function getToastStyle(tone: ToastTone): React.CSSProperties {
    if (tone === "success") {
      return {
        background: "linear-gradient(135deg, #059669, #047857)",
        color: "#ffffff",
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow: "0 18px 40px rgba(16,185,129,0.25)",
      };
    }

    if (tone === "warning") {
      return {
        background: "linear-gradient(135deg, #d97706, #b45309)",
        color: "#ffffff",
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow: "0 18px 40px rgba(245,158,11,0.24)",
      };
    }

    if (tone === "error") {
      return {
        background: "linear-gradient(135deg, #e11d48, #be123c)",
        color: "#ffffff",
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow: "0 18px 40px rgba(244,63,94,0.24)",
      };
    }

    return {
      background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
      color: "#ffffff",
      border: "1px solid rgba(255,255,255,0.18)",
      boxShadow: "0 18px 40px rgba(59,130,246,0.24)",
    };
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[90] flex w-[min(92vw,420px)] flex-col gap-3 md:right-6 md:top-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto overflow-hidden rounded-[24px]"
          style={getToastStyle(toast.tone)}
        >
          <div className="flex items-start gap-3 px-4 py-4">
            <div
              className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.14)",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            >
              {toast.tone === "success" ? (
                <CheckCircleIcon />
              ) : toast.tone === "warning" ? (
                <WarningIcon />
              ) : toast.tone === "error" ? (
                <WarningIcon />
              ) : (
                <InfoIcon />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 800,
                  color: "#ffffff",
                }}
              >
                {toast.title}
              </div>

              {toast.message ? (
                <div
                  className="mt-1"
                  style={{
                    fontSize: "14px",
                    lineHeight: 1.65,
                    fontWeight: 600,
                    color: "#ffffff",
                  }}
                >
                  {toast.message}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => onClose(toast.id)}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{
                background: "rgba(255,255,255,0.14)",
                color: "#ffffff",
              }}
              aria-label="Close toast"
            >
              <XSmallIcon />
            </button>
          </div>

          <div className="h-1 w-full bg-white/10">
            <div className="h-1 w-full animate-[toastShrink_3.6s_linear_forwards] bg-white/50" />
          </div>
        </div>
      ))}
    </div>
  );
}
function ModeButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 items-center justify-center rounded-2xl px-3 text-sm font-semibold transition ${
        active
          ? "text-white shadow-[0_10px_24px_rgba(59,130,246,0.28)]"
          : "app-text-soft"
      }`}
      style={active ? { background: "var(--accent)" } : undefined}
    >
      {label}
    </button>
  );
}

function QuickStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-card-strong rounded-2xl p-3">
      <div className="text-xs uppercase tracking-wide app-text-muted">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function EmptyState({
  text,
  isError = false,
}: {
  text: string;
  isError?: boolean;
}) {
  return (
    <div
      className="rounded-2xl border px-4 py-5 text-sm"
      style={
        isError
          ? {
              borderColor: "rgba(220, 38, 38, 0.3)",
              background: "var(--danger-soft)",
              color: "var(--danger)",
            }
          : {
              borderStyle: "dashed",
              borderColor: "var(--border-main)",
              color: "var(--text-muted)",
            }
      }
    >
      {text}
    </div>
  );
}

function DeliveryBadge({
  item,
  t,
}: {
  item: TimetableItem;
  t: (key: string) => string;
}) {
  const delivery = getDeliveryMode(item);

  if (delivery === "online") {
    return (
      <span className="app-badge-online rounded-full px-2.5 py-1 text-xs font-semibold">
        {t("timetable.modeLabel.online")}
      </span>
    );
  }

  return (
    <span className="app-badge-onsite rounded-full px-2.5 py-1 text-xs font-semibold">
      {t("timetable.modeLabel.onsite")}
    </span>
  );
}

function MonthCalendar({
  cells,
  selectedDate,
  onPickDate,
  language,
  t,
}: {
  cells: MonthCell[];
  selectedDate: Date;
  onPickDate: (date: Date) => void;
  language: string;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const hasAnyItem = cells.some((cell) => cell.items.length > 0);

  if (!hasAnyItem) {
    return <EmptyState text={t("timetable.content.emptyMonth")} />;
  }

  const monthWeekdayLabels =
    language === "en"
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-3">
        {monthWeekdayLabels.map((label) => (
          <div
            key={label}
            className="px-2 text-center text-xs font-semibold uppercase tracking-wide app-text-muted"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
        {cells.map((cell) => {
          const selected = isSameDate(cell.date, selectedDate);

          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => onPickDate(cell.date)}
              className={[
                "app-month-cell text-left transition hover:translate-y-[-1px]",
                cell.inCurrentMonth ? "" : "is-outside",
                cell.isToday ? "is-today" : "",
              ].join(" ")}
              style={
                selected
                  ? {
                      boxShadow:
                        "inset 0 0 0 1px var(--accent), var(--shadow-card)",
                    }
                  : undefined
              }
              title={formatFullDate(cell.date, language)}
            >
              <div className="flex items-center justify-between gap-2">
                <div
                  className="text-sm font-semibold"
                  style={cell.isToday ? { color: "var(--accent)" } : undefined}
                >
                  {pad2(cell.date.getDate())}
                </div>
                <div className="text-xs app-text-muted">
                  {cell.items.length > 0
                    ? t("timetable.content.classes", {
                        count: cell.items.length,
                      })
                    : ""}
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {cell.items.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl px-2 py-2"
                    style={{ background: "var(--bg-soft)" }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className="truncate text-xs font-semibold"
                        style={{ color: "var(--accent)" }}
                      >
                        {item.courseCode}
                      </div>
                      <DeliveryBadge
                        item={item}
                        t={t as (key: string) => string}
                      />
                    </div>

                    <div className="mt-1 text-xs">
                      {item.startTime} - {item.endTime}
                    </div>
                    <div className="mt-1 truncate text-xs app-text-soft">
                      {item.room || "--"}
                    </div>
                  </div>
                ))}

                {cell.items.length > 3 ? (
                  <div className="text-xs font-medium app-text-muted">
                    {t("timetable.content.moreClasses", {
                      count: cell.items.length - 3,
                    })}
                  </div>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function buildMonthCells(
  items: TimetableItem[],
  selectedDate: Date,
  today: Date,
): MonthCell[] {
  const monthStart = startOfMonth(selectedDate);
  const gridStart = startOfWeek(monthStart);

  const cells: MonthCell[] = Array.from({ length: 42 }).map((_, index) => {
    const date = addDays(gridStart, index);
    return {
      key: formatDateKey(date),
      date,
      items: [],
      inCurrentMonth: date.getMonth() === selectedDate.getMonth(),
      isToday: isSameDate(date, today),
    };
  });

  const map = new Map(cells.map((cell) => [cell.key, cell] as const));

  for (const item of sortByTime(items)) {
    const occurrence = parseOccurrenceDate(item.occurrenceDate);
    if (!occurrence) continue;

    const key = formatDateKey(occurrence);
    const cell = map.get(key);
    if (cell) {
      cell.items.push(item);
    }
  }

  return cells;
}

function groupWeekItems(
  items: TimetableItem[],
  selectedDate: Date,
  language: string,
): DisplayGroup[] {
  const weekStart = startOfWeek(selectedDate);

  const days: DisplayGroup[] = Array.from({ length: 7 }).map((_, index) => {
    const day = addDays(weekStart, index);
    return {
      key: formatDateKey(day),
      label: `${getWeekdayShort(index + 1, language)} • ${formatShortDate(day, language)}`,
      items: [],
    };
  });

  const map = new Map(days.map((day) => [day.key, day] as const));

  for (const item of sortByTime(items)) {
    const occurrence = parseOccurrenceDate(item.occurrenceDate);
    if (!occurrence) continue;

    const key = formatDateKey(occurrence);
    const bucket = map.get(key);
    if (bucket) {
      bucket.items.push(item);
    }
  }

  return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
}

function sortByTime(items: TimetableItem[]) {
  return [...items].sort((a, b) => {
    const aKey = `${a.occurrenceDate || ""}_${a.startTime}_${a.courseCode}`;
    const bKey = `${b.occurrenceDate || ""}_${b.startTime}_${b.courseCode}`;
    return aKey.localeCompare(bKey);
  });
}

function getDeliveryMode(item: TimetableItem) {
  const raw = `${item.room || ""} ${item.campus || ""}`.toLowerCase();
  if (raw.includes("online")) return "online";
  return "onsite";
}

function parseOccurrenceDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : startOfDay(d);
}

function startOfToday() {
  return startOfDay(new Date());
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

function endOfWeek(date: Date) {
  return addDays(startOfWeek(date), 6);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, amount: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return startOfDay(d);
}

function addMonths(date: Date, amount: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + amount);
  return startOfDay(d);
}

function isSameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatDateInputValue(date: Date) {
  return formatDateKey(date);
}

function parseDateInputValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return startOfToday();
  return new Date(year, month - 1, day);
}

function formatShortDate(date: Date, language = "vi") {
  return new Intl.DateTimeFormat(language === "en" ? "en-GB" : "vi-VN").format(
    date,
  );
}

function formatFullDate(date: Date, language = "vi") {
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatMonthYear(date: Date, language = "vi") {
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "vi-VN", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateTime(date: Date, language = "vi") {
  return new Intl.DateTimeFormat(language === "en" ? "en-GB" : "vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toWeekdayLabel(dayOfWeek: number, language = "vi") {
  const vi: Record<number, string> = {
    1: "Thứ 2",
    2: "Thứ 3",
    3: "Thứ 4",
    4: "Thứ 5",
    5: "Thứ 6",
    6: "Thứ 7",
    7: "CN",
  };

  const en: Record<number, string> = {
    1: "Mon",
    2: "Tue",
    3: "Wed",
    4: "Thu",
    5: "Fri",
    6: "Sat",
    7: "Sun",
  };

  return (language === "en" ? en : vi)[dayOfWeek] || `(${dayOfWeek})`;
}

function getWeekdayShort(dayOfWeek: number, language = "vi") {
  return toWeekdayLabel(dayOfWeek, language);
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M10 17A7 7 0 1 0 10 3A7 7 0 1 0 10 17Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M7 10.2L8.9 12.1L13.1 7.9"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M10 17A7 7 0 1 0 10 3A7 7 0 1 0 10 17Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M10 8.5V12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10 6.5H10.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M9.13 4.32C9.5 3.67 10.5 3.67 10.87 4.32L15.97 13.24C16.33 13.88 15.87 14.67 15.11 14.67H4.89C4.13 14.67 3.67 13.88 4.03 13.24L9.13 4.32Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M10 7.5V10.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10 12.45H10.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function XSmallIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="h-3.5 w-3.5"
    >
      <path
        d="M6 6L14 14M14 6L6 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
