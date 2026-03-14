"use client";

import {
  buildImportPayloadFromExtensionNotices,
  fetchExamsFromDb,
  importExamsToDb,
} from "@/lib/exams/api";
import {
  readExamMeta,
  readExamRecords,
  writeExamMeta,
  writeExamRecords,
} from "@/lib/exams/cache";
import { exportExamWorkbook } from "@/lib/exams/exporters";
import {
  ensureNotificationPermission,
  notifyNewExams,
} from "@/lib/exams/notify";
import {
  parseWorkbookFromNotice,
  type ParsedExamRecord,
} from "@/lib/exams/parseWorkbook";
import {
  buildSessionSummaries,
  formatDate,
  formatDateTime,
  getCountdownLabel,
  getStatusTone,
  sanitizeExamMeta,
  sanitizeVisualText,
  type ExamSessionSummary,
} from "@/lib/exams/sessionUtils";
import {
  openExamPageInExtension,
  requestExamSync,
} from "@/lib/extensionBridge";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

type PlanFilter = "all" | "tentative" | "official";
type SortMode = "date-asc" | "date-desc" | "course-asc" | "student-asc";
type BannerTone = "info" | "success" | "warning" | "error";
type GroupMode = "date" | "course";
type ToastTone = "success" | "info" | "warning" | "error";

type SearchToken = {
  raw: string;
  loose: string;
  compact: string;
};

type HeatmapBucket = {
  date: string;
  count: number;
  level: number;
};

type ExamsPageProps = {
  userId?: string;
};

type MeResponse = {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  } | null;
};

type FilterOption = {
  value: string;
  label: string;
};

type AppToast = {
  id: string;
  tone: ToastTone;
  title: string;
  message?: string;
};

const BTN_NEUTRAL =
  "inline-flex h-11 items-center justify-center rounded-2xl border border-[#cfd8e6] bg-white px-4 text-sm font-semibold text-[#1e293b] shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition hover:-translate-y-[1px] hover:border-[#b8c4d8] hover:bg-[#f8fbff]";

const BTN_SOFT_INFO =
  "inline-flex h-11 items-center justify-center rounded-2xl border border-[#bfd3ff] bg-[#edf4ff] px-4 text-sm font-semibold text-[#2563eb] shadow-[0_10px_24px_rgba(37,99,235,0.10)] transition hover:-translate-y-[1px] hover:bg-[#e3efff]";

const BTN_SOFT_SUCCESS =
  "inline-flex h-11 items-center justify-center rounded-2xl border border-[#b7ead9] bg-[#ecfdf5] px-4 text-sm font-semibold text-[#059669] shadow-[0_10px_24px_rgba(5,150,105,0.10)] transition hover:-translate-y-[1px] hover:bg-[#dff8ee]";

const BTN_SOFT_WARNING =
  "inline-flex h-11 items-center justify-center rounded-2xl border border-[#f5d7a6] bg-[#fff7e8] px-4 text-sm font-semibold text-[#d97706] shadow-[0_10px_24px_rgba(217,119,6,0.10)] transition hover:-translate-y-[1px] hover:bg-[#fff1d6]";

const BTN_PRIMARY =
  "inline-flex h-11 items-center justify-center rounded-2xl border border-transparent bg-[linear-gradient(180deg,#5b95ff_0%,#2563eb_100%)] px-4 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.24)] transition hover:-translate-y-[1px] hover:brightness-105";

const BTN_PRIMARY_ACTIVE =
  "inline-flex h-11 items-center justify-center rounded-2xl border border-transparent bg-[linear-gradient(180deg,#6ea3ff_0%,#3b82f6_100%)] px-4 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(59,130,246,0.28)] transition";

const BTN_DANGER =
  "inline-flex h-11 items-center justify-center rounded-2xl border border-transparent bg-[linear-gradient(180deg,#ef4444_0%,#dc2626_100%)] px-4 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(239,68,68,0.22)] transition hover:-translate-y-[1px] hover:brightness-105";

const BTN_DETAIL_LINK =
  "inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border-main)] bg-[rgba(255,255,255,0.035)] px-4 text-sm font-semibold text-[var(--text-main)] shadow-[0_8px_20px_rgba(2,8,23,0.16)] transition hover:-translate-y-[1px] hover:border-[var(--border-strong)] hover:bg-[rgba(255,255,255,0.06)]";

const BTN_DOWNLOAD_LINK =
  "inline-flex h-10 items-center justify-center rounded-xl border border-[var(--accent)]/18 bg-[var(--accent)]/10 px-4 text-sm font-semibold text-[var(--accent)] shadow-[0_8px_20px_rgba(59,130,246,0.14)] transition hover:-translate-y-[1px] hover:bg-[var(--accent)]/14";

const EXAM_NOTIFY_ENABLED_KEY = "exam-notify-enabled";

function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCompact(value: unknown) {
  return normalizeText(value).replace(/[^a-z0-9]/g, "");
}

function tokenizeQuery(query: string): SearchToken[] {
  return query
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((raw) => ({
      raw,
      loose: normalizeText(raw),
      compact: normalizeCompact(raw),
    }));
}

function getInitialPlan(
  searchParams: ReturnType<typeof useSearchParams>,
): PlanFilter {
  const plan = searchParams.get("plan");
  if (plan === "tentative" || plan === "official") return plan;
  return "all";
}

function getInitialSort(
  searchParams: ReturnType<typeof useSearchParams>,
): SortMode {
  const sort = searchParams.get("sort");
  if (
    sort === "date-asc" ||
    sort === "date-desc" ||
    sort === "course-asc" ||
    sort === "student-asc"
  ) {
    return sort;
  }
  return "date-asc";
}

function compareDateTimeAsc(a: ParsedExamRecord, b: ParsedExamRecord) {
  const av = `${a.examDate || "9999-12-31"} ${a.startTime || "23:59"}`;
  const bv = `${b.examDate || "9999-12-31"} ${b.startTime || "23:59"}`;
  return av.localeCompare(bv);
}

function compareDateTimeDesc(a: ParsedExamRecord, b: ParsedExamRecord) {
  return compareDateTimeAsc(b, a);
}

function buildSearchIndex(record: ParsedExamRecord) {
  const looseHaystacks = [
    record.courseCode,
    record.courseName,
    record.studentId,
    record.studentName,
    record.classCourse,
    record.classStudent,
    record.birthDate,
    record.examDate,
    record.room,
    record.campus,
    record.noticeTitle,
    record.examMetaRaw,
    record.attachmentName,
    record.publishedAtRaw,
  ]
    .map(sanitizeVisualText)
    .map(normalizeText);

  const compactHaystacks = [
    record.courseCode,
    record.studentId,
    record.classCourse,
    record.classStudent,
    record.room,
    record.campus,
  ]
    .map(sanitizeVisualText)
    .map(normalizeCompact);

  return { looseHaystacks, compactHaystacks };
}

function makeHeatmapBuckets(records: ParsedExamRecord[]): HeatmapBucket[] {
  const countMap = new Map<string, number>();

  for (const record of records) {
    const key = record.examDate || "unknown";
    countMap.set(key, (countMap.get(key) || 0) + 1);
  }

  const validDates = Array.from(countMap.keys())
    .filter((x) => x !== "unknown")
    .sort((a, b) => a.localeCompare(b));

  if (!validDates.length) return [];

  const maxCount = Math.max(...validDates.map((d) => countMap.get(d) || 0));

  return validDates.map((date) => {
    const count = countMap.get(date) || 0;
    const ratio = maxCount > 0 ? count / maxCount : 0;

    let level = 1;
    if (ratio >= 0.75) level = 4;
    else if (ratio >= 0.5) level = 3;
    else if (ratio >= 0.25) level = 2;

    return { date, count, level };
  });
}

function getHeatmapClass(level: number) {
  if (level === 4) return "bg-[var(--danger)]/90";
  if (level === 3) return "bg-[var(--warning)]/85";
  if (level === 2) return "bg-[var(--accent)]/75";
  return "bg-[var(--accent)]/35";
}

function getNewestRecordsForNotify(
  previousIds: string[],
  nextRecords: ParsedExamRecord[],
  limit = 5,
) {
  const known = new Set(previousIds);
  const news = nextRecords.filter((record) => !known.has(record.id));
  news.sort(compareDateTimeAsc);
  return news.slice(0, limit);
}

function getBannerClass(tone: BannerTone) {
  if (tone === "success") {
    return "border border-[var(--success)]/20 bg-[var(--success)]/10 text-[var(--success)]";
  }
  if (tone === "warning") {
    return "border border-[var(--warning)]/20 bg-[var(--warning)]/10 text-[var(--warning)]";
  }
  if (tone === "error") {
    return "border border-[var(--danger)]/20 bg-[var(--danger-soft)] text-[var(--danger)]";
  }
  return "border border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)]";
}

function mapSyncErrorMessage(
  raw: string,
  t: (key: string, options?: Record<string, unknown>) => string,
  isVi: boolean,
) {
  const text = String(raw || "").trim();
  const normalized = text.toLowerCase();

  if (
    normalized.includes("receiving end does not exist") ||
    normalized.includes("could not establish connection")
  ) {
    return t("exams.sync.errors.extensionReload");
  }

  if (normalized.includes("timeout")) {
    return t("exams.sync.errors.timeout");
  }

  if (normalized.includes("chrome.runtime.sendmessage unavailable")) {
    return t("exams.sync.errors.extensionUnavailable");
  }

  if (normalized.includes("empty response from extension")) {
    return t("exams.sync.errors.emptyResponse");
  }

  if (normalized.includes("không scrape được danh sách thi")) {
    return t("exams.sync.errors.scrapeFailed");
  }

  if (normalized.includes("attachment fetch failed")) {
    return t("exams.sync.errors.attachmentFailed");
  }

  if (normalized.includes("fetch failed")) {
    return t("exams.sync.errors.portalFetchFailed");
  }

  if (normalized.includes("invalid userid")) {
    return isVi
      ? "Không tìm thấy người dùng hợp lệ để đồng bộ. Vui lòng đăng nhập lại."
      : "Cannot find a valid user for sync. Please sign in again.";
  }

  if (
    normalized.includes("transaction not found") ||
    normalized.includes("transaction api error") ||
    normalized.includes("closed transaction")
  ) {
    return isVi
      ? "Đồng bộ thất bại vì server xử lý quá lâu. Hãy thử lại."
      : "Sync failed because the server transaction timed out. Please try again.";
  }

  if (
    normalized.startsWith("<!doctype html") ||
    normalized.startsWith("<html") ||
    normalized.includes("this page could not be found") ||
    normalized.includes("next-router-not-mounted") ||
    normalized.includes("__next")
  ) {
    return isVi
      ? "Đồng bộ thất bại do API trả về phản hồi không hợp lệ."
      : "Sync failed because the API returned an invalid response.";
  }

  return text || t("exams.sync.errors.unknown");
}

function buildRoomOptions(records: ParsedExamRecord[]) {
  return Array.from(
    new Set(records.map((x) => sanitizeVisualText(x.room)).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
}

function buildCampusOptions(records: ParsedExamRecord[]) {
  return Array.from(
    new Set(records.map((x) => sanitizeVisualText(x.campus)).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
}

function getMonthMatrix(baseDate: Date) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - startWeekday);

  return Array.from({ length: 42 }).map((_, index) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + index);
    return d;
  });
}

function buildNoticeReportHref(detailUrl: string) {
  return `/exams/report?notice=${encodeURIComponent(detailUrl)}`;
}

function isUpcomingDate(dateValue: string | null) {
  if (!dateValue) return false;
  const today = new Date();
  const current = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();
  const exam = new Date(`${dateValue}T00:00:00`).getTime();
  if (Number.isNaN(exam)) return false;
  return exam >= current;
}

function readExamNotifyEnabled() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(EXAM_NOTIFY_ENABLED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeExamNotifyEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(EXAM_NOTIFY_ENABLED_KEY, enabled ? "1" : "0");
  } catch {
    // ignore
  }
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M8.75 3.75A5 5 0 1 0 8.75 13.75A5 5 0 1 0 8.75 3.75Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M12.5 12.5L16.25 16.25"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M10 3.75L16 7L10 10.25L4 7L10 3.75Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M4 10.25L10 13.5L16 10.25"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M4 13.5L10 16.25L16 13.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M6 4.5V15.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M3.75 13.25L6 15.5L8.25 13.25"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 15.5V4.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M11.75 6.75L14 4.5L16.25 6.75"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RoomIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M4.5 16V6.5C4.5 5.4 5.4 4.5 6.5 4.5H13.5C14.6 4.5 15.5 5.4 15.5 6.5V16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M3.5 16H16.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M8 8.25H12"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M8 11H12"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CampusIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M10 16.25C10 16.25 14.25 12.2 14.25 8.75A4.25 4.25 0 1 0 5.75 8.75C5.75 12.2 10 16.25 10 16.25Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M10 10.5A1.75 1.75 0 1 0 10 7A1.75 1.75 0 1 0 10 10.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function XIcon() {
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

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M10 3.5A3.75 3.75 0 0 1 13.75 7.25V9.08C13.75 9.78 13.98 10.47 14.41 11.03L15.22 12.08C15.83 12.87 15.26 14 14.25 14H5.75C4.74 14 4.17 12.87 4.78 12.08L5.59 11.03C6.02 10.47 6.25 9.78 6.25 9.08V7.25A3.75 3.75 0 0 1 10 3.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M8.25 15.25C8.55 16.02 9.2 16.5 10 16.5C10.8 16.5 11.45 16.02 11.75 15.25"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
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

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  icon,
  className = "",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative min-w-0 ${className}`}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>

      {icon ? (
        <div className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[var(--text-muted)]">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-soft)]">
            {icon}
          </span>
        </div>
      ) : null}

      <div className="pointer-events-none absolute right-4 top-1/2 z-10 -translate-y-1/2 text-[var(--text-muted)]">
        <ChevronDownIcon />
      </div>

      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        title={label}
        className={[
          "h-14 w-full appearance-none rounded-[22px] border border-[var(--border-main)] bg-[var(--bg-card-strong)] pr-12 text-[15px] font-semibold text-[var(--text-main)] shadow-sm outline-none transition",
          icon ? "pl-16" : "pl-5",
          "hover:border-[var(--border-strong)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(59,130,246,0.14)]",
        ].join(" ")}
      >
        {options.map((option) => (
          <option key={`${id}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FilterChip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-3 text-xs font-medium text-[var(--accent)]">
      <span className="max-w-[220px] truncate">{label}</span>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)]/12 hover:bg-[var(--accent)]/18"
        aria-label={`Clear ${label}`}
      >
        <XIcon />
      </button>
    </span>
  );
}

function SyncedHorizontalTable({
  children,
  minWidthClassName = "min-w-[1280px]",
  stickyTop = "top-[98px] md:top-[106px]",
}: {
  children: ReactNode;
  minWidthClassName?: string;
  stickyTop?: string;
}) {
  const topScrollRef = useRef<HTMLDivElement | null>(null);
  const bottomScrollRef = useRef<HTMLDivElement | null>(null);
  const contentMeasureRef = useRef<HTMLDivElement | null>(null);
  const syncingRef = useRef<"top" | "bottom" | null>(null);

  const [metrics, setMetrics] = useState({
    clientWidth: 0,
    scrollWidth: 0,
    hasOverflow: false,
  });

  useEffect(() => {
    const updateMetrics = () => {
      const bottomEl = bottomScrollRef.current;
      const contentEl = contentMeasureRef.current;
      if (!bottomEl || !contentEl) return;

      const clientWidth = bottomEl.clientWidth;
      const scrollWidth = contentEl.scrollWidth;

      setMetrics({
        clientWidth,
        scrollWidth,
        hasOverflow: scrollWidth > clientWidth + 4,
      });
    };

    updateMetrics();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updateMetrics())
        : null;

    if (bottomScrollRef.current)
      resizeObserver?.observe(bottomScrollRef.current);
    if (contentMeasureRef.current)
      resizeObserver?.observe(contentMeasureRef.current);

    window.addEventListener("resize", updateMetrics);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateMetrics);
    };
  }, []);

  useEffect(() => {
    const topEl = topScrollRef.current;
    const bottomEl = bottomScrollRef.current;
    if (!topEl || !bottomEl) return;

    const syncFromTop = () => {
      if (syncingRef.current === "bottom") return;
      syncingRef.current = "top";
      bottomEl.scrollLeft = topEl.scrollLeft;
      requestAnimationFrame(() => {
        if (syncingRef.current === "top") syncingRef.current = null;
      });
    };

    const syncFromBottom = () => {
      if (syncingRef.current === "top") return;
      syncingRef.current = "bottom";
      topEl.scrollLeft = bottomEl.scrollLeft;
      requestAnimationFrame(() => {
        if (syncingRef.current === "bottom") syncingRef.current = null;
      });
    };

    topEl.addEventListener("scroll", syncFromTop, { passive: true });
    bottomEl.addEventListener("scroll", syncFromBottom, { passive: true });

    return () => {
      topEl.removeEventListener("scroll", syncFromTop);
      bottomEl.removeEventListener("scroll", syncFromBottom);
    };
  }, [metrics.hasOverflow]);

  return (
    <div className="relative">
      {metrics.hasOverflow ? (
        <div className={`sticky z-20 mb-2 ${stickyTop}`}>
          <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-card-strong)]/98 px-3 py-2 shadow-lg backdrop-blur">
            <div className="mb-1 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>Kéo ngang nhanh</span>
              <span>↔</span>
            </div>

            <div
              ref={topScrollRef}
              className="overflow-x-auto overflow-y-hidden rounded-full"
              style={{ scrollbarWidth: "thin" }}
            >
              <div
                style={{
                  width: metrics.scrollWidth || metrics.clientWidth || 1,
                  height: 8,
                }}
                className="rounded-full bg-[var(--accent)]/20"
              />
            </div>
          </div>
        </div>
      ) : null}

      <div
        ref={bottomScrollRef}
        className="overflow-x-auto pb-2"
        style={{ scrollbarWidth: "thin" }}
      >
        <div ref={contentMeasureRef} className={minWidthClassName}>
          {children}
        </div>
      </div>
    </div>
  );
}

function DisplayModeBar({
  isVi,
  onlyUpcoming,
  setOnlyUpcoming,
  groupMode,
  setGroupMode,
}: {
  isVi: boolean;
  onlyUpcoming: boolean;
  setOnlyUpcoming: React.Dispatch<React.SetStateAction<boolean>>;
  groupMode: GroupMode;
  setGroupMode: React.Dispatch<React.SetStateAction<GroupMode>>;
}) {
  return (
    <div className="rounded-[26px] border border-[var(--border-main)] bg-[var(--bg-soft)]/55 p-4 md:p-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-start xl:gap-8">
        <div className="min-w-0 xl:max-w-[220px]">
          <div className="text-[15px] font-bold text-[var(--text-main)]">
            {isVi ? "Chế độ hiển thị" : "Display mode"}
          </div>
          <div className="mt-1 text-sm text-[var(--text-muted)]">
            {isVi
              ? "Chọn cách xem nhanh dữ liệu và kiểu nhóm danh sách thi."
              : "Choose how exam data should be displayed and grouped."}
          </div>
        </div>

       <div className="flex flex-nowrap items-center gap-3 overflow-x-auto pb-1 xl:justify-end">
          <button
            type="button"
            onClick={() => setOnlyUpcoming((v) => !v)}
            className={`${onlyUpcoming ? BTN_PRIMARY_ACTIVE : BTN_NEUTRAL} min-w-[205px] shrink-0 whitespace-nowrap px-5`}
          >
            {isVi ? "Chỉ xem lịch sắp thi" : "Upcoming only"}
          </button>

          <button
            type="button"
            onClick={() => setGroupMode("date")}
            className={`${groupMode === "date" ? BTN_PRIMARY_ACTIVE : BTN_NEUTRAL} min-w-[110px] shrink-0 whitespace-nowrap px-5`}
          >
            {isVi ? "Nhóm theo ngày" : "Group by date"}
          </button>

          <button
            type="button"
            onClick={() => setGroupMode("course")}
            className={`${groupMode === "course" ? BTN_PRIMARY_ACTIVE : BTN_NEUTRAL} min-w-[110px] shrink-0 whitespace-nowrap px-5`}
          >
            {isVi ? "Nhóm theo môn" : "Group by course"}
          </button>
        </div>
      </div>
    </div>
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

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[90] flex w-[min(92vw,380px)] flex-col gap-3 md:right-6 md:top-6">
      {toasts.map((toast) => {
        const toneClass =
          toast.tone === "success"
            ? "border-emerald-400/30 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(5,150,105,0.10))] text-emerald-50 shadow-[0_18px_40px_rgba(16,185,129,0.18)]"
            : toast.tone === "warning"
              ? "border-amber-400/30 bg-[linear-gradient(135deg,rgba(245,158,11,0.18),rgba(217,119,6,0.10))] text-amber-50 shadow-[0_18px_40px_rgba(245,158,11,0.16)]"
              : toast.tone === "error"
                ? "border-rose-400/30 bg-[linear-gradient(135deg,rgba(244,63,94,0.18),rgba(225,29,72,0.10))] text-rose-50 shadow-[0_18px_40px_rgba(244,63,94,0.18)]"
                : "border-sky-400/30 bg-[linear-gradient(135deg,rgba(59,130,246,0.18),rgba(37,99,235,0.10))] text-sky-50 shadow-[0_18px_40px_rgba(59,130,246,0.18)]";

        const iconClass =
          toast.tone === "success"
            ? "bg-emerald-400/16 text-emerald-200 ring-1 ring-emerald-300/18"
            : toast.tone === "warning"
              ? "bg-amber-400/16 text-amber-200 ring-1 ring-amber-300/18"
              : toast.tone === "error"
                ? "bg-rose-400/16 text-rose-200 ring-1 ring-rose-300/18"
                : "bg-sky-400/16 text-sky-200 ring-1 ring-sky-300/18";

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto overflow-hidden rounded-[24px] border backdrop-blur-xl ${toneClass}`}
          >
            <div className="flex items-start gap-3 px-4 py-4">
              <div
                className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
              >
                {toast.tone === "success" ? (
                  <CheckCircleIcon />
                ) : toast.tone === "warning" ? (
                  <WarningIcon />
                ) : toast.tone === "error" ? (
                  <WarningIcon />
                ) : (
                  <BellIcon />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold tracking-[0.01em]">
                  {toast.title}
                </div>
                {toast.message ? (
                  <div className="mt-1 text-[13px] leading-5 text-white/78">
                    {toast.message}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => onClose(toast.id)}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/8 text-white/75 transition hover:bg-white/14 hover:text-white"
                aria-label="Close toast"
              >
                <XIcon />
              </button>
            </div>

            <div className="h-1 w-full bg-white/10">
              <div className="h-1 w-full animate-[toastShrink_3.6s_linear_forwards] bg-white/50" />
            </div>
          </div>
        );
      })}

      <style jsx global>{`
        @keyframes toastShrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

export default function ExamsPage({ userId: initialUserId }: ExamsPageProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("vi") ? "vi-VN" : "en-US";
  const isVi = locale.startsWith("vi");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [resolvedUserId, setResolvedUserId] = useState<string | null>(
    initialUserId ?? null,
  );
  const [records, setRecords] = useState<ParsedExamRecord[]>([]);
  const [query, setQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<PlanFilter>(
    getInitialPlan(searchParams),
  );
  const [sortMode, setSortMode] = useState<SortMode>(
    getInitialSort(searchParams),
  );
  const [groupMode, setGroupMode] = useState<GroupMode>("date");
  const [roomFilter, setRoomFilter] = useState("all");
  const [campusFilter, setCampusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [lastNoticeCount, setLastNoticeCount] = useState(0);
  const [notifyPermission, setNotifyPermission] = useState<
    NotificationPermission | "unsupported"
  >("unsupported");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [bannerTone, setBannerTone] = useState<BannerTone>("info");
  const [bannerText, setBannerText] = useState<string>("");
  const [onlyUpcoming, setOnlyUpcoming] = useState(false);
  const [visibleGroupsLimit, setVisibleGroupsLimit] = useState(8);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [activeSession, setActiveSession] = useState<ExamSessionSummary | null>(
    null,
  );
  const [stickyFilters, setStickyFilters] = useState(false);
  const [toasts, setToasts] = useState<AppToast[]>([]);

  const pushToast = (
    tone: ToastTone,
    title: string,
    message?: string,
    duration = 3600,
  ) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, tone, title, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  };

  useEffect(() => {
    const onScroll = () => {
      setStickyFilters(window.scrollY > 180);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function fetchCurrentUserId(): Promise<string | null> {
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) return null;

      const json = (await res.json()) as MeResponse;
      return json?.user?.id ?? null;
    } catch {
      return null;
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setLoading(true);

      try {
        const uid = initialUserId ?? (await fetchCurrentUserId());

        if (cancelled) return;

        if (!uid) {
          setResolvedUserId(null);
          setRecords([]);
          setBannerTone("warning");
          setBannerText(
            isVi
              ? "Không xác định được người dùng hiện tại. Vui lòng đăng nhập lại."
              : "Cannot resolve current user. Please sign in again.",
          );
          return;
        }

        setResolvedUserId(uid);

        const meta = readExamMeta();
        const permission = await ensureNotificationPermission();
        if (cancelled) return;

        setNotifyPermission(permission);
        setLastSyncedAt(meta.lastSyncedAt);
        setLastNoticeCount(meta.lastNoticeCount);
        const savedNotifyEnabled = readExamNotifyEnabled();
        setNotificationsEnabled(
          permission === "granted" ? savedNotifyEnabled : false,
        );

        try {
          const dbRecords = await fetchExamsFromDb({ userId: uid });
          if (cancelled) return;

          setRecords(dbRecords);
          await writeExamRecords(dbRecords);

          if (!dbRecords.length) {
            setBannerTone("info");
            setBannerText(t("exams.sync.idleHelp"));
          } else {
            setBannerTone("success");
            setBannerText(
              t("exams.sync.cachedReady", {
                count: dbRecords.length,
                time: meta.lastSyncedAt
                  ? formatDateTime(meta.lastSyncedAt, locale)
                  : t("exams.sync.noSyncYet"),
              }),
            );
          }
        } catch {
          const cachedRecords = await readExamRecords();
          if (cancelled) return;

          setRecords(cachedRecords);

          if (!cachedRecords.length) {
            setBannerTone("warning");
            setBannerText(t("exams.sync.cacheFallback"));
          } else {
            setBannerTone("warning");
            setBannerText(
              t("exams.sync.cachedReady", {
                count: cachedRecords.length,
                time: meta.lastSyncedAt
                  ? formatDateTime(meta.lastSyncedAt, locale)
                  : t("exams.sync.noSyncYet"),
              }),
            );
          }
        }
      } catch {
        if (!cancelled) {
          setBannerTone("warning");
          setBannerText(t("exams.sync.cacheFallback"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    boot();

    return () => {
      cancelled = true;
    };
  }, [initialUserId, isVi, locale, t]);

  useEffect(() => {
    setPlanFilter(getInitialPlan(searchParams));
    setSortMode(getInitialSort(searchParams));
  }, [searchParams]);

  useEffect(() => {
    setVisibleGroupsLimit(8);
  }, [
    query,
    planFilter,
    sortMode,
    onlyUpcoming,
    roomFilter,
    campusFilter,
    dateFilter,
    groupMode,
  ]);

  const roomOptionsRaw = useMemo(() => buildRoomOptions(records), [records]);
  const campusOptionsRaw = useMemo(
    () => buildCampusOptions(records),
    [records],
  );
  const tokens = useMemo(() => tokenizeQuery(query), [query]);

  const indexedRecords = useMemo(
    () =>
      records.map((record) => ({
        record,
        index: buildSearchIndex(record),
      })),
    [records],
  );

  const filtered = useMemo(() => {
    let next = indexedRecords;

    if (planFilter !== "all") {
      next = next.filter(({ record }) => record.planType === planFilter);
    }

    if (onlyUpcoming) {
      next = next.filter(({ record }) => isUpcomingDate(record.examDate));
    }

    if (roomFilter !== "all") {
      next = next.filter(
        ({ record }) =>
          sanitizeVisualText(record.room) === sanitizeVisualText(roomFilter),
      );
    }

    if (campusFilter !== "all") {
      next = next.filter(
        ({ record }) =>
          sanitizeVisualText(record.campus) ===
          sanitizeVisualText(campusFilter),
      );
    }

    if (dateFilter) {
      next = next.filter(({ record }) => record.examDate === dateFilter);
    }

    if (tokens.length) {
      next = next.filter(({ index }) => {
        return tokens.some((token) => {
          const looseMatch = index.looseHaystacks.some((value) =>
            value.includes(token.loose),
          );
          const compactMatch = token.compact
            ? index.compactHaystacks.some((value) =>
                value.includes(token.compact),
              )
            : false;
          return looseMatch || compactMatch;
        });
      });
    }

    const mapped = next.map((x) => x.record);

    if (sortMode === "date-asc") mapped.sort(compareDateTimeAsc);
    else if (sortMode === "date-desc") mapped.sort(compareDateTimeDesc);
    else if (sortMode === "course-asc") {
      mapped.sort((a, b) =>
        `${a.courseCode} ${a.courseName || ""}`.localeCompare(
          `${b.courseCode} ${b.courseName || ""}`,
          i18n.language?.startsWith("vi") ? "vi" : "en",
        ),
      );
    } else if (sortMode === "student-asc") {
      mapped.sort((a, b) =>
        `${a.studentName || ""} ${a.studentId || ""}`.localeCompare(
          `${b.studentName || ""} ${b.studentId || ""}`,
          i18n.language?.startsWith("vi") ? "vi" : "en",
        ),
      );
    }

    return mapped;
  }, [
    campusFilter,
    dateFilter,
    i18n.language,
    indexedRecords,
    onlyUpcoming,
    planFilter,
    roomFilter,
    sortMode,
    tokens,
  ]);

  const filteredSessions = useMemo(
    () => buildSessionSummaries(filtered),
    [filtered],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, ExamSessionSummary[]>();

    for (const session of filteredSessions) {
      const key =
        groupMode === "date"
          ? session.examDate || "unknown"
          : session.courseCode || session.noticeTitle || "unknown";

      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(session);
    }

    const entries = Array.from(map.entries());
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    return entries;
  }, [filteredSessions, groupMode]);

  const visibleGroups = useMemo(
    () => grouped.slice(0, visibleGroupsLimit),
    [grouped, visibleGroupsLimit],
  );

  const hasMoreGroups = visibleGroupsLimit < grouped.length;

  const stats = useMemo(() => {
    const official = records.filter((r) => r.planType === "official").length;
    const tentative = records.filter((r) => r.planType === "tentative").length;
    const uniqueCourses = new Set(
      records.map((r) => r.courseCode).filter(Boolean),
    ).size;
    const uniqueStudents = new Set(
      records.map((r) => r.studentId).filter(Boolean),
    ).size;
    const uniqueDays = new Set(records.map((r) => r.examDate).filter(Boolean))
      .size;

    return {
      total: records.length,
      official,
      tentative,
      uniqueCourses,
      uniqueStudents,
      visible: filtered.length,
      visibleSessions: filteredSessions.length,
      uniqueDays,
    };
  }, [filtered.length, filteredSessions.length, records]);

  const heatmapDays = useMemo(() => makeHeatmapBuckets(records), [records]);

  const heatmapHighlights = useMemo(() => {
    return [...heatmapDays]
      .sort((a, b) => b.count - a.count || a.date.localeCompare(b.date))
      .slice(0, 3);
  }, [heatmapDays]);

  const sessionSummaries = useMemo(
    () => buildSessionSummaries(records),
    [records],
  );

  const nextUpcomingSessions = useMemo(() => {
    return sessionSummaries.slice(0, 8);
  }, [sessionSummaries]);

  const topCourses = useMemo(() => {
    const map = new Map<
      string,
      { code: string; name: string | null; count: number }
    >();

    for (const session of filteredSessions) {
      const key = session.courseCode || session.noticeTitle || "unknown";
      const current = map.get(key);

      if (current) {
        current.count += session.studentCount;
      } else {
        map.set(key, {
          code: session.courseCode || t("exams.labels.unknownCourseCode"),
          name: session.courseName || null,
          count: session.studentCount,
        });
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code))
      .slice(0, 8);
  }, [filteredSessions, t]);

  const monthCells = useMemo(
    () => getMonthMatrix(calendarMonth),
    [calendarMonth],
  );

  const monthCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const record of records) {
      if (!record.examDate) continue;
      map.set(record.examDate, (map.get(record.examDate) || 0) + 1);
    }
    return map;
  }, [records]);

  const planOptions = useMemo<FilterOption[]>(
    () => [
      { value: "all", label: t("exams.filters.allTypes") },
      { value: "official", label: t("exams.filters.official") },
      { value: "tentative", label: t("exams.filters.tentative") },
    ],
    [t],
  );

  const sortOptions = useMemo<FilterOption[]>(
    () => [
      { value: "date-asc", label: t("exams.sort.dateAsc") },
      { value: "date-desc", label: t("exams.sort.dateDesc") },
      { value: "course-asc", label: t("exams.sort.courseAsc") },
      { value: "student-asc", label: t("exams.sort.studentAsc") },
    ],
    [t],
  );

  const roomOptions = useMemo<FilterOption[]>(
    () => [
      { value: "all", label: isVi ? "Tất cả phòng" : "All rooms" },
      ...roomOptionsRaw.map((room) => ({
        value: room,
        label: room,
      })),
    ],
    [isVi, roomOptionsRaw],
  );

  const campusOptions = useMemo<FilterOption[]>(
    () => [
      { value: "all", label: isVi ? "Tất cả cơ sở" : "All campuses" },
      ...campusOptionsRaw.map((campus) => ({
        value: campus,
        label: campus,
      })),
    ],
    [campusOptionsRaw, isVi],
  );

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; clear: () => void }> = [];

    if (planFilter !== "all") {
      chips.push({
        key: "plan",
        label: `${isVi ? "Loại lịch" : "Plan"}: ${
          planFilter === "official"
            ? t("exams.filters.official")
            : t("exams.filters.tentative")
        }`,
        clear: () => setPlanFilter("all"),
      });
    }

    if (sortMode !== "date-asc") {
      const label =
        sortMode === "date-desc"
          ? t("exams.sort.dateDesc")
          : sortMode === "course-asc"
            ? t("exams.sort.courseAsc")
            : t("exams.sort.studentAsc");

      chips.push({
        key: "sort",
        label: `${isVi ? "Sắp xếp" : "Sort"}: ${label}`,
        clear: () => setSortMode("date-asc"),
      });
    }

    if (roomFilter !== "all") {
      chips.push({
        key: "room",
        label: `${isVi ? "Phòng" : "Room"}: ${roomFilter}`,
        clear: () => setRoomFilter("all"),
      });
    }

    if (campusFilter !== "all") {
      chips.push({
        key: "campus",
        label: `${isVi ? "Cơ sở" : "Campus"}: ${campusFilter}`,
        clear: () => setCampusFilter("all"),
      });
    }

    if (dateFilter) {
      chips.push({
        key: "date",
        label: `${isVi ? "Ngày thi" : "Exam date"}: ${formatDate(dateFilter, locale)}`,
        clear: () => setDateFilter(""),
      });
    }

    if (onlyUpcoming) {
      chips.push({
        key: "upcoming",
        label: isVi ? "Chỉ lịch sắp thi" : "Upcoming only",
        clear: () => setOnlyUpcoming(false),
      });
    }

    if (groupMode === "course") {
      chips.push({
        key: "group",
        label: isVi ? "Nhóm theo môn" : "Grouped by course",
        clear: () => setGroupMode("date"),
      });
    }

    tokens.forEach((token, index) => {
      chips.push({
        key: `token-${index}`,
        label: `${isVi ? "Từ khóa" : "Keyword"}: ${token.raw}`,
        clear: () => {
          const parts = tokenizeQuery(query)
            .filter((_, i) => i !== index)
            .map((x) => x.raw);
          setQuery(parts.join(", "));
        },
      });
    });

    return chips;
  }, [
    campusFilter,
    dateFilter,
    groupMode,
    isVi,
    locale,
    onlyUpcoming,
    planFilter,
    query,
    roomFilter,
    sortMode,
    t,
    tokens,
  ]);

  function replaceQueryParams(nextParams: {
    plan?: PlanFilter;
    sort?: SortMode;
  }) {
    const next = new URLSearchParams(searchParams.toString());

    if (nextParams.plan) {
      if (nextParams.plan === "all") next.delete("plan");
      else next.set("plan", nextParams.plan);
    }

    if (nextParams.sort) {
      if (nextParams.sort === "date-asc") next.delete("sort");
      else next.set("sort", nextParams.sort);
    }

    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  function updatePlanFilter(value: PlanFilter) {
    setPlanFilter(value);
    replaceQueryParams({ plan: value });
  }

  function updateSortMode(value: SortMode) {
    setSortMode(value);
    replaceQueryParams({ sort: value });
  }

  function resetFilters() {
    setQuery("");
    setOnlyUpcoming(false);
    setPlanFilter("all");
    setSortMode("date-asc");
    setGroupMode("date");
    setRoomFilter("all");
    setCampusFilter("all");
    setDateFilter("");
    router.replace(pathname);
  }

  function jumpToDetailedList(
    date?: string | null,
    courseCode?: string | null,
  ) {
    if (date) {
      setDateFilter(date);
      setGroupMode("date");
    } else if (courseCode) {
      setQuery(courseCode);
      setGroupMode("course");
    }

    window.setTimeout(() => {
      document.getElementById("exam-detail-list")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }

  async function handleSync() {
    setSyncing(true);
    setError(null);
    setBannerTone("info");
    setBannerText(t("exams.sync.preparing"));

    try {
      const uid =
        resolvedUserId ?? initialUserId ?? (await fetchCurrentUserId());

      if (!uid) {
        const msg = isVi
          ? "Không tìm thấy userId hợp lệ để đồng bộ. Vui lòng đăng nhập lại."
          : "Cannot find a valid userId for sync. Please sign in again.";
        setError(msg);
        setBannerTone("error");
        setBannerText(msg);
        pushToast(
          "error",
          isVi ? "Đồng bộ thất bại" : "Sync failed",
          msg,
        );
        return;
      }

      setResolvedUserId(uid);

      const previousMeta = readExamMeta();

      setBannerText(t("exams.sync.fetchingPortal"));
      const extensionRes = await requestExamSync({
        maxPages: 2,
        maxItems: 24,
      });

      if (!extensionRes.ok) {
        const friendly = mapSyncErrorMessage(extensionRes.error || "", t, isVi);
        setError(friendly);
        setBannerTone("error");
        setBannerText(friendly);
        pushToast(
          "error",
          isVi ? "Đồng bộ thất bại" : "Sync failed",
          friendly,
        );
        return;
      }

      setBannerText(t("exams.sync.parsingWorkbook"));

      const parsedChunks = await Promise.all(
        extensionRes.payload.notices.map(async (notice) =>
          parseWorkbookFromNotice(notice),
        ),
      );

      const parsedRecords = parsedChunks.flat();

      const deduped = Array.from(
        new Map(parsedRecords.map((record) => [record.id, record])).values(),
      ).sort(compareDateTimeAsc);

      const importBody = buildImportPayloadFromExtensionNotices(
        uid,
        extensionRes.payload.notices,
        parsedChunks,
      );

      setBannerText(
        isVi ? "Đang lưu dữ liệu thi vào hệ thống..." : "Saving exam data...",
      );
      await importExamsToDb(importBody);

      const dbRecords = await fetchExamsFromDb({ userId: uid });
      const finalRecords = dbRecords.length ? dbRecords : deduped;

      setRecords(finalRecords);
      setLastSyncedAt(extensionRes.payload.scrapedAt);
      setLastNoticeCount(extensionRes.payload.notices.length);

      await writeExamRecords(finalRecords);

      const newRecordsForNotify = getNewestRecordsForNotify(
        previousMeta.lastNotifiedIds,
        finalRecords,
        5,
      );

      const nextMeta = {
        lastSyncedAt: extensionRes.payload.scrapedAt,
        lastNoticeCount: extensionRes.payload.notices.length,
        lastNotifiedIds: finalRecords.map((x) => x.id).slice(0, 300),
      };

      writeExamMeta(nextMeta);

      if (newRecordsForNotify.length) {
        const permission = await ensureNotificationPermission();
        setNotifyPermission(permission);

        if (permission === "granted" && notificationsEnabled) {
          notifyNewExams(newRecordsForNotify, locale);
        }
      }

      setBannerTone("success");
      setBannerText(
        t("exams.sync.successDetailed", {
          totalRecords: finalRecords.length,
          totalNotices: extensionRes.payload.notices.length,
        }),
      );

      pushToast(
        "success",
        isVi ? "Đồng bộ thành công" : "Sync completed",
        isVi
          ? `Đã cập nhật ${finalRecords.length} bản ghi từ ${extensionRes.payload.notices.length} thông báo.`
          : `Updated ${finalRecords.length} records from ${extensionRes.payload.notices.length} notices.`,
      );
    } catch (e) {
      const friendly = mapSyncErrorMessage(
        String((e as Error)?.message || e),
        t,
        isVi,
      );
      setError(friendly);
      setBannerTone("error");
      setBannerText(friendly);
      pushToast(
        "error",
        isVi ? "Đồng bộ thất bại" : "Sync failed",
        friendly,
      );
    } finally {
      setSyncing(false);
    }
  }

  async function handleEnableNotify() {
    if (notifyPermission === "granted") {
      const nextEnabled = !notificationsEnabled;
      setNotificationsEnabled(nextEnabled);
      writeExamNotifyEnabled(nextEnabled);

      setBannerTone(nextEnabled ? "success" : "info");
      setBannerText(
        nextEnabled
          ? isVi
            ? "Đã bật thông báo lịch thi trong ứng dụng."
            : "Exam notifications are enabled in the app."
          : isVi
            ? "Đã tắt thông báo lịch thi trong ứng dụng."
            : "Exam notifications are disabled in the app.",
      );

      pushToast(
        nextEnabled ? "success" : "info",
        nextEnabled
          ? isVi
            ? "Đã bật thông báo"
            : "Notifications enabled"
          : isVi
            ? "Đã tắt thông báo"
            : "Notifications disabled",
        nextEnabled
          ? isVi
            ? "Bạn sẽ nhận thông báo khi có lịch thi mới sau các lần đồng bộ tiếp theo."
            : "You will receive alerts when new exam schedules appear after future syncs."
          : isVi
            ? "Thông báo lịch thi đã được tắt trong ứng dụng."
            : "Exam schedule notifications have been turned off in the app.",
      );
      return;
    }

    const permission = await ensureNotificationPermission();
    setNotifyPermission(permission);

    if (permission === "granted") {
      setNotificationsEnabled(true);
      writeExamNotifyEnabled(true);
      setBannerTone("success");
      setBannerText(
        isVi
          ? "Đã bật thông báo lịch thi trong ứng dụng."
          : "Exam notifications are enabled in the app.",
      );

      pushToast(
        "success",
        isVi ? "Đã bật thông báo" : "Notifications enabled",
        isVi
          ? "Trình duyệt đã cho phép và ứng dụng sẽ báo lịch thi mới ở góc phải."
          : "Browser permission has been granted and the app will show exam alerts in the top-right corner.",
      );
    } else if (permission === "denied") {
      setNotificationsEnabled(false);
      writeExamNotifyEnabled(false);
      setBannerTone("warning");
      setBannerText(
        isVi
          ? "Trình duyệt đang chặn thông báo. Hãy bật quyền trong cài đặt trang nếu muốn dùng."
          : "Browser notifications are blocked. Enable site permission in browser settings to use them.",
      );

      pushToast(
        "warning",
        isVi ? "Thông báo đang bị chặn" : "Notifications blocked",
        isVi
          ? "Hãy mở quyền thông báo của trình duyệt cho trang này để sử dụng."
          : "Enable browser notification permission for this site to use alerts.",
      );
    } else {
      setNotificationsEnabled(false);
      writeExamNotifyEnabled(false);
      setBannerTone("info");
      setBannerText(t("exams.notify.pending"));

      pushToast(
        "info",
        isVi ? "Chưa bật thông báo" : "Notifications pending",
        isVi
          ? "Quyền thông báo chưa sẵn sàng. Hãy thử lại sau."
          : "Notification permission is not ready yet. Please try again.",
      );
    }
  }

  async function handleOpenPdaotao() {
    const res = await openExamPageInExtension();

    if (!res.ok) {
      window.open(
        "https://pdaotao.duytan.edu.vn/EXAM_LIST/?page=1&lang=VN",
        "_blank",
      );
      setBannerTone("info");
      setBannerText(t("exams.sync.portalOpenedFallback"));
      pushToast(
        "info",
        isVi ? "Đã mở cổng đào tạo" : "Portal opened",
        isVi
          ? "Extension chưa phản hồi nên hệ thống đã mở cổng đào tạo ở tab mới."
          : "The extension did not respond, so the portal was opened in a new tab.",
      );
      return;
    }

    setBannerTone("info");
    setBannerText(t("exams.sync.portalOpened"));
    pushToast(
      "info",
      isVi ? "Đã mở cổng đào tạo" : "Portal opened",
      isVi
        ? "Bạn có thể quay lại đây và bấm Đồng bộ khi trang lịch thi đã sẵn sàng."
        : "You can come back here and click Sync after the exam portal page is ready.",
    );
  }

  async function handleExportExcel() {
    try {
      setExportingExcel(true);

      await exportExamWorkbook(filtered, locale, {
        isVi,
        filePrefix: isVi ? "bao-cao-lich-thi" : "exam-report",
      });

      setBannerTone("success");
      setBannerText(
        isVi
          ? `Đã xuất báo cáo lịch thi với ${filtered.length} dòng dữ liệu. File gồm danh sách sinh viên, phiên thi và tổng quan.`
          : `Exported exam report with ${filtered.length} rows. The file includes students, sessions, and overview sheets.`,
      );

      pushToast(
        "success",
        isVi ? "Xuất báo cáo thành công" : "Report exported",
        isVi
          ? `Đã tạo file báo cáo với ${filtered.length} dòng dữ liệu.`
          : `Created a report file with ${filtered.length} rows.`,
      );
    } catch {
      setBannerTone("error");
      setBannerText(isVi ? "Xuất báo cáo thất bại." : "Report export failed.");

      pushToast(
        "error",
        isVi ? "Xuất báo cáo thất bại" : "Report export failed",
        isVi
          ? "Có lỗi khi tạo file báo cáo lịch thi."
          : "An error occurred while generating the exam report file.",
      );
    } finally {
      setExportingExcel(false);
    }
  }

  const guideText = isVi
    ? "Cách dùng nhanh: bấm “Mở cổng đào tạo” trước để extension đứng đúng trang lịch thi, sau đó quay lại bấm “Đồng bộ”. Dữ liệu sẽ được tái dựng thành giao diện web dễ đọc hơn Excel gốc."
    : "Quick usage: click “Open portal” first, then come back and click “Sync”. Data will be rebuilt into a cleaner web view.";

  const detailHintText = isVi
    ? "Nút mới “Mở hồ sơ lịch” sẽ mở form web đẹp cho toàn bộ file lịch tương ứng, thay vì xuất Excel thô khó đọc."
    : "The new “Open roster view” button opens a clean in-app view for the whole workbook instead of a raw spreadsheet export.";

  return (
    <>
      <ToastViewport toasts={toasts} onClose={removeToast} />

      <div className="space-y-5">
        <section className="app-section p-4 md:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="text-[1.9rem] font-bold tracking-tight">
                {t("exams.page.title")}
              </div>  
              <div className="mt-1.5 text-sm app-text-muted">
                {t("exams.page.subtitle")}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleOpenPdaotao}
                className={BTN_NEUTRAL}
              >
                {t("exams.actions.openPortal")}
              </button>

              <button
                type="button"
                onClick={handleEnableNotify}
                className={
                  notifyPermission === "denied"
                    ? BTN_SOFT_WARNING
                    : notificationsEnabled
                      ? BTN_SOFT_SUCCESS
                      : BTN_SOFT_INFO
                }
              >
                {notifyPermission === "denied"
                  ? isVi
                    ? "Thông báo bị chặn"
                    : "Notifications blocked"
                  : notificationsEnabled
                    ? isVi
                      ? "Tắt thông báo"
                      : "Turn off notifications"
                    : isVi
                      ? "Bật thông báo"
                      : "Turn on notifications"}
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                disabled={exportingExcel}
                className={`${BTN_SOFT_SUCCESS} disabled:opacity-60`}
              >
                {exportingExcel
                  ? isVi
                    ? "Đang xuất..."
                    : "Exporting..."
                  : isVi
                    ? "Xuất báo cáo"
                    : "Export report"}
              </button>

              <button
                type="button"
                onClick={handleSync}
                disabled={syncing}
                className={`${syncing ? BTN_DANGER : BTN_PRIMARY} disabled:opacity-60`}
              >
                {syncing ? t("exams.actions.syncing") : t("exams.actions.sync")}
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[var(--warning)]/18 bg-[var(--warning)]/10 px-5 py-4 text-sm text-[var(--warning)]">
            <div className="font-semibold">
              {isVi ? "Lưu ý đồng bộ" : "Sync note"}
            </div>
            <div className="mt-1.5 opacity-95">{guideText}</div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
            <div className="app-panel p-3.5">
              <div className="text-[11px] uppercase tracking-wide app-text-muted">
                {t("exams.stats.totalRecords")}
              </div>
              <div className="mt-1.5 text-2xl font-bold">{stats.total}</div>
            </div>

            <div className="app-panel p-3.5">
              <div className="text-[11px] uppercase tracking-wide app-text-muted">
                {t("exams.stats.visible")}
              </div>
              <div className="mt-1.5 text-2xl font-bold">{stats.visible}</div>
            </div>

            <div className="app-panel p-3.5">
              <div className="text-[11px] uppercase tracking-wide app-text-muted">
                {isVi ? "Phiên đang hiển thị" : "Visible sessions"}
              </div>
              <div className="mt-1.5 text-2xl font-bold">
                {stats.visibleSessions}
              </div>
            </div>

            <div className="app-panel p-3.5">
              <div className="text-[11px] uppercase tracking-wide app-text-muted">
                {t("exams.stats.uniqueDays")}
              </div>
              <div className="mt-1.5 text-2xl font-bold">
                {stats.uniqueDays}
              </div>
            </div>

            <div className="app-panel p-3.5">
              <div className="text-[11px] uppercase tracking-wide app-text-muted">
                {t("exams.stats.courses")}
              </div>
              <div className="mt-1.5 text-2xl font-bold">
                {stats.uniqueCourses}
              </div>
            </div>

            <div className="app-panel p-3.5">
              <div className="text-[11px] uppercase tracking-wide app-text-muted">
                {t("exams.stats.students")}
              </div>
              <div className="mt-1.5 text-2xl font-bold">
                {stats.uniqueStudents}
              </div>
            </div>

            <div className="app-panel p-3.5">
              <div className="text-[11px] uppercase tracking-wide app-text-muted">
                {t("exams.stats.official")}
              </div>
              <div className="mt-1.5 text-2xl font-bold text-[var(--success)]">
                {stats.official}
              </div>
            </div>

            <div className="app-panel p-3.5">
              <div className="text-[11px] uppercase tracking-wide app-text-muted">
                {t("exams.stats.tentative")}
              </div>
              <div className="mt-1.5 text-2xl font-bold text-[var(--warning)]">
                {stats.tentative}
              </div>
            </div>
          </div>

          <div
            className={[
              "mt-4 rounded-[32px] border border-[var(--border-main)] bg-[var(--bg-card-strong)]/98 p-5 md:p-6 shadow-sm transition-all duration-200",
              stickyFilters
                ? "sticky top-[88px] z-20 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-[var(--bg-card-strong)]/95 md:top-[96px]"
                : "",
            ].join(" ")}
          >
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[1.15rem] font-bold text-[var(--text-main)]">
                  {isVi ? "Thanh lọc nhanh" : "Quick filters"}
                </div>
                <div className="mt-1 text-sm text-[var(--text-muted)]">
                  {isVi
                    ? "Bố cục được canh lại gọn, rõ và cân đối hơn để không lệch hàng hoặc đè nội dung."
                    : "Cleaner, more balanced layout to avoid overlap and awkward spacing."}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-11 items-center rounded-full border border-[#bfd3ff] bg-[#edf4ff] px-4 text-sm font-bold text-[#2563eb] shadow-[0_8px_18px_rgba(37,99,235,0.08)]">
                  {isVi ? `${stats.visible} kết quả` : `${stats.visible} results`}
                </span>

                {stickyFilters ? (
                  <span className="inline-flex h-11 items-center rounded-full border border-[#d8e2f0] bg-[#f8fbff] px-4 text-sm font-semibold text-[#4f6b95] shadow-[0_8px_18px_rgba(15,23,42,0.05)]">
                    {isVi ? "Đang ghim" : "Pinned"}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
              <div className="relative min-w-0 xl:col-span-12 2xl:col-span-9">
                <label htmlFor="exam-search" className="sr-only">
                  {t("exams.filters.searchPlaceholder")}
                </label>

                <div className="flex h-11 w-full items-center overflow-hidden rounded-[22px] border-[2px] border-[var(--border-strong)] bg-[var(--bg-card-strong)] transition hover:border-[var(--border-strong)] focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/20">
                  <div className="flex h-full shrink-0 items-center">
                    <div className="flex h-11 w-10 items-center justify-center rounded-[16px] bg-[var(--accent)]/18 text-[var(--accent)] shadow-sm">
                      <SearchIcon />
                    </div>
                    <div className="ml-1 h-8 w-px bg-[var(--border-strong)]/55" />
                  </div>

                  <input
                    id="exam-search"
                    className="h-full min-w-0 flex-1 bg-transparent pl-4 pr-[54px] text-[15px] font-semibold text-[var(--text-main)] outline-none placeholder:text-[15px] placeholder:font-medium placeholder:text-[var(--text-soft)]"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                      isVi
                        ? "Tìm mã môn, tên môn, MSSV, họ tên, lớp, phòng thi..."
                        : "Search course, student, class, room"
                    }
                  />
                </div>

                {query.trim().length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--bg-soft)] text-[var(--text-muted)] transition hover:bg-[var(--accent)]/15 hover:text-[var(--accent)]"
                    aria-label={isVi ? "Xóa nội dung tìm kiếm" : "Clear search"}
                  >
                    <XIcon />
                  </button>
                ) : null}
              </div>

              <div className="xl:col-span-4 2xl:col-span-2">
                <SelectField
                  id="exam-plan-filter"
                  label={t("exams.filters.planLabel")}
                  value={planFilter}
                  onChange={(value) => updatePlanFilter(value as PlanFilter)}
                  options={planOptions}
                  icon={<LayersIcon />}
                />
              </div>

              <div className="xl:col-span-4 2xl:col-span-2">
                <SelectField
                  id="exam-sort-filter"
                  label={t("exams.filters.sortLabel")}
                  value={sortMode}
                  onChange={(value) => updateSortMode(value as SortMode)}
                  options={sortOptions}
                  icon={<SortIcon />}
                />
              </div>

              <div className="xl:col-span-3 2xl:col-span-2">
                <input
                  type="date"
                  className="app-input h-14 w-full rounded-[22px] px-5 pr-12 text-[15px] font-semibold text-[var(--text-main)]"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  title={isVi ? "Lọc theo ngày thi" : "Filter by exam date"}
                />
              </div>

              <div className="xl:col-span-4">
                <SelectField
                  id="exam-room-filter"
                  label={isVi ? "Lọc theo phòng" : "Filter by room"}
                  value={roomFilter}
                  onChange={setRoomFilter}
                  options={roomOptions}
                  icon={<RoomIcon />}
                />
              </div>

              <div className="xl:col-span-4">
                <SelectField
                  id="exam-campus-filter"
                  label={isVi ? "Lọc theo cơ sở" : "Filter by campus"}
                  value={campusFilter}
                  onChange={setCampusFilter}
                  options={campusOptions}
                  icon={<CampusIcon />}
                />
              </div>

              <div className="xl:col-span-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  className={`${BTN_NEUTRAL} h-14 w-full text-[15px]`}
                >
                  {t("exams.actions.resetFilters")}
                </button>
              </div>

              <div className="xl:col-span-12">
                <DisplayModeBar
                  isVi={isVi}
                  onlyUpcoming={onlyUpcoming}
                  setOnlyUpcoming={setOnlyUpcoming}
                  groupMode={groupMode}
                  setGroupMode={setGroupMode}
                />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {activeFilterChips.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {activeFilterChips.map((chip) => (
                    <FilterChip
                      key={chip.key}
                      label={chip.label}
                      onClear={chip.clear}
                    />
                  ))}
                </div>
              ) : (
                <span className="text-sm text-[var(--text-muted)]">
                  {t("exams.filters.tip")}
                </span>
              )}

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--text-muted)]">
                <span>
                  {lastSyncedAt
                    ? t("exams.meta.lastSyncAt", {
                        time: formatDateTime(lastSyncedAt, locale),
                      })
                    : t("exams.meta.noSyncYet")}
                </span>
                <span>
                  {t("exams.meta.noticeCount", { count: lastNoticeCount })}
                </span>
                <span>
                  {t("exams.meta.visibleCount", { count: stats.visible })}
                </span>
                <span>
                  {t("exams.meta.groupCount", { count: grouped.length })}
                </span>
                <span>
                  {t("exams.meta.notifyStatus", {
                    status:
                      notifyPermission === "denied"
                        ? isVi
                          ? "trình duyệt chặn"
                          : "browser blocked"
                        : notifyPermission === "granted"
                          ? notificationsEnabled
                            ? isVi
                              ? "đã bật"
                              : "enabled"
                            : isVi
                              ? "đã tắt"
                              : "disabled"
                          : notifyPermission === "default"
                            ? t("exams.notify.statusDefault")
                            : t("exams.notify.statusUnsupported"),
                  })}
                </span>
              </div>
            </div>
          </div>

          <div
            className={`mt-4 rounded-2xl px-4 py-3 text-sm ${getBannerClass(bannerTone)}`}
          >
            <div className="font-medium">
              {loading
                ? t("common.loading")
                : bannerText || t("exams.sync.idleHelp")}
            </div>
            {!syncing && !loading ? (
              <div className="mt-1 text-xs opacity-80">
                {t("exams.sync.hint")}
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="mt-3 rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
              {error}
            </div>
          ) : null}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <div className="app-section p-4 md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-base font-semibold">
                    {t("exams.insights.title")}
                  </div>
                  <div className="mt-1 text-sm app-text-muted">
                    {t("exams.insights.subtitle")}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("exam-detail-list")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className={BTN_NEUTRAL}
                >
                  {isVi
                    ? "Xem danh sách chi tiết phía dưới"
                    : "View detailed list below"}
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-[var(--accent)]/16 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--accent)]">
                <div className="font-medium">
                  {isVi ? "Gợi ý sử dụng" : "Helpful tip"}
                </div>
                <div className="mt-1 opacity-90">{detailHintText}</div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border-main)] p-4">
                  <div className="text-sm font-bold">
                    {t("exams.insights.peakDays")}
                  </div>
                  <div className="mt-1 text-xs app-text-muted">
                    {t("exams.insights.peakDaysHint")}
                  </div>

                  {heatmapHighlights.length === 0 ? (
                    <div className="mt-4 rounded-xl app-soft p-4 text-sm app-text-muted">
                      {t("exams.insights.noHeatmap")}
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {heatmapHighlights.map((item) => (
                        <button
                          key={item.date}
                          type="button"
                          onClick={() => jumpToDetailedList(item.date, null)}
                          className="block w-full rounded-xl border border-transparent p-2 text-left transition hover:border-[var(--accent)]/20 hover:bg-[var(--bg-soft)]/60"
                        >
                          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                            <span className="font-medium">
                              {formatDate(item.date, locale)}
                            </span>
                            <span className="app-text-muted">
                              {t("exams.insights.recordCount", {
                                count: item.count,
                              })}
                            </span>
                          </div>
                          <div className="h-2.5 rounded-full bg-[var(--bg-soft)]">
                            <div
                              className={`h-2.5 rounded-full ${getHeatmapClass(item.level)}`}
                              style={{
                                width: `${Math.max(
                                  12,
                                  (item.count /
                                    Math.max(
                                      ...heatmapHighlights.map((x) => x.count),
                                    )) *
                                    100,
                                )}%`,
                              }}
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-[var(--border-main)] p-4">
                  <div className="text-sm font-bold">
                    {t("exams.insights.courseLoad")}
                  </div>
                  <div className="mt-1 text-xs app-text-muted">
                    {t("exams.insights.courseLoadHint")}
                  </div>

                  {topCourses.length === 0 ? (
                    <div className="mt-4 rounded-xl app-soft p-4 text-sm app-text-muted">
                      {t("exams.insights.noCourseLoad")}
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {topCourses.map((course) => (
                        <button
                          key={`${course.code}-${course.name || ""}`}
                          type="button"
                          onClick={() => jumpToDetailedList(null, course.code)}
                          className="w-full rounded-xl bg-[var(--bg-soft)] p-3 text-left transition hover:opacity-90"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate font-semibold">
                                {course.code}
                              </div>
                              <div className="mt-1 truncate text-sm app-text-muted">
                                {course.name || "—"}
                              </div>
                            </div>
                            <span className="inline-flex rounded-full app-pill px-3 py-1 text-xs font-medium">
                              {course.count}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="app-section p-4 md:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">
                    {isVi ? "Mini calendar tháng" : "Mini monthly calendar"}
                  </div>
                  <div className="mt-1 text-xs app-text-muted">
                    {isVi
                      ? "Bấm vào một ngày để lọc nhanh danh sách thi theo ngày đó."
                      : "Click a day to filter the exam list quickly."}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={`${BTN_NEUTRAL} h-9 px-3 text-xs`}
                    onClick={() =>
                      setCalendarMonth(
                        new Date(
                          calendarMonth.getFullYear(),
                          calendarMonth.getMonth() - 1,
                          1,
                        ),
                      )
                    }
                  >
                    ←
                  </button>
                  <div className="text-sm font-medium">
                    {calendarMonth.toLocaleDateString(locale, {
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                  <button
                    type="button"
                    className={`${BTN_NEUTRAL} h-9 px-3 text-xs`}
                    onClick={() =>
                      setCalendarMonth(
                        new Date(
                          calendarMonth.getFullYear(),
                          calendarMonth.getMonth() + 1,
                          1,
                        ),
                      )
                    }
                  >
                    →
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-7 gap-2 text-center text-[11px] app-text-muted">
                {(isVi
                  ? ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
                  : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                ).map((label) => (
                  <div key={label} className="py-1 font-medium">
                    {label}
                  </div>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-7 gap-2">
                {monthCells.map((day) => {
                  const key = `${day.getFullYear()}-${String(
                    day.getMonth() + 1,
                  ).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
                  const count = monthCountMap.get(key) || 0;
                  const inMonth = day.getMonth() === calendarMonth.getMonth();
                  const active = dateFilter === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setDateFilter((prev) => (prev === key ? "" : key))
                      }
                      className={[
                        "rounded-xl border p-2 text-left transition",
                        active
                          ? "border-[var(--accent)] bg-[var(--accent)]/15"
                          : "border-[var(--border-main)] bg-[var(--bg-soft)] hover:bg-[var(--bg-card-strong)]",
                        !inMonth ? "opacity-40" : "",
                      ].join(" ")}
                    >
                      <div className="text-sm font-semibold">{day.getDate()}</div>
                      <div className="mt-1 text-[10px] app-text-muted">
                        {count > 0
                          ? isVi
                            ? `${count} lịch`
                            : `${count} exams`
                          : "—"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="app-section p-4 md:p-5">
              <div>
                <div className="text-sm font-semibold">
                  {t("exams.insights.timelineTitle")}
                </div>
                <div className="mt-1 text-xs app-text-muted">
                  {isVi
                    ? "Mỗi thẻ là một phiên thi. Từ đây có thể mở hồ sơ lịch đầy đủ của cả file."
                    : "Each card is one exam session. You can also open the full roster view of the source file."}
                </div>
              </div>

              {nextUpcomingSessions.length === 0 ? (
                <div className="mt-4 rounded-xl app-soft p-4 text-sm app-text-muted">
                  {t("exams.insights.noTimeline")}
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {nextUpcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="rounded-[28px] border border-[var(--border-main)] bg-[var(--bg-card-strong)] p-4 shadow-[0_10px_30px_rgba(2,8,23,0.10)]"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[15px] font-semibold leading-6">
                              {session.courseCode ||
                                t("exams.labels.unknownCourseCode")}
                              <span className="app-text-muted font-normal">
                                {session.courseName
                                  ? ` • ${session.courseName}`
                                  : ""}
                              </span>
                            </div>

                            <div className="mt-1 text-xs app-text-muted">
                              {formatDate(session.examDate, locale)} •{" "}
                              {session.startTime ||
                                t("exams.labels.unknownTime")}{" "}
                              •{" "}
                              {sanitizeVisualText(session.room) ||
                                t("exams.labels.unknownRoom")}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex rounded-full app-pill px-3 py-1.5 text-xs font-medium">
                            {isVi
                              ? `${session.studentCount} sinh viên`
                              : `${session.studentCount} students`}
                          </span>

                          <span
                            className={[
                              "inline-flex rounded-full px-3 py-1.5 text-xs font-semibold",
                              getStatusTone(session.examDate),
                            ].join(" ")}
                          >
                            {getCountdownLabel(session.examDate, t)}
                          </span>
                        </div>

                        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
                          <button
                            type="button"
                            onClick={() => setActiveSession(session)}
                            className={`${BTN_NEUTRAL} shrink-0 whitespace-nowrap`}
                          >
                            {isVi ? "Xem ca thi" : "View session"}
                          </button>

                          <Link
                            href={buildNoticeReportHref(session.detailUrl)}
                            className={`${BTN_PRIMARY} shrink-0 whitespace-nowrap`}
                          >
                            {isVi ? "Mở hồ sơ lịch" : "Open roster view"}
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="exam-detail-list" className="space-y-4">
          <div className="rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--accent)]">
            <div className="font-semibold">
              {isVi ? "Danh sách phiên thi" : "Exam session list"}
            </div>
            <div className="mt-1 opacity-90">
              {isVi
                ? "Đã đổi logic: không còn xuất Excel theo ca thi ở đây nữa. Thay vào đó là nút mở hồ sơ lịch đầy đủ cho cả file nguồn."
                : "Session export is replaced by a full in-app roster view for the source workbook."}
            </div>
          </div>

          {grouped.length === 0 ? (
            <div className="app-section p-8 text-center">
              <div className="text-lg font-semibold">
                {t("exams.empty.title")}
              </div>
              <div className="mt-2 text-sm app-text-muted">
                {t("exams.empty.subtitle")}
              </div>
            </div>
          ) : (
            <>
              {visibleGroups.map(([groupKey, items]) => {
                const first = items[0];
                const groupLabel =
                  groupMode === "date"
                    ? formatDate(groupKey, locale)
                    : `${groupKey}${first?.courseName ? ` • ${first.courseName}` : ""}`;

                return (
                  <div key={groupKey} className="app-section">
                    <div className="border-b border-[var(--border-main)] px-4 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-lg font-semibold">
                            {groupLabel}
                          </div>
                          <div className="mt-1 text-sm app-text-muted">
                            {isVi
                              ? `${items.length} phiên thi`
                              : `${items.length} exam sessions`}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 pb-3 pt-3">
                      <SyncedHorizontalTable minWidthClassName="min-w-[1320px]">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[var(--border-main)] bg-[var(--bg-soft)] text-left">
                              <th className="whitespace-nowrap px-4 py-3 font-semibold">
                                {t("exams.table.type")}
                              </th>
                              <th className="whitespace-nowrap px-4 py-3 font-semibold">
                                {t("exams.table.course")}
                              </th>
                              <th className="whitespace-nowrap px-4 py-3 font-semibold">
                                {isVi ? "Lịch thi" : "Exam session"}
                              </th>
                              <th className="whitespace-nowrap px-4 py-3 font-semibold">
                                {isVi ? "Quy mô" : "Scale"}
                              </th>
                              <th className="whitespace-nowrap px-4 py-3 font-semibold">
                                {t("exams.table.class")}
                              </th>
                              <th className="whitespace-nowrap px-4 py-3 font-semibold">
                                {isVi ? "Thao tác" : "Actions"}
                              </th>
                              <th className="whitespace-nowrap px-4 py-3 font-semibold">
                                {t("exams.table.source")}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((session) => (
                              <tr
                                key={session.id}
                                className="border-b border-[var(--border-main)]/70 align-top"
                              >
                                <td className="px-4 py-3">
                                  <div className="space-y-2">
                                    <span
                                      className={[
                                        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                                        session.planType === "official"
                                          ? "app-pill-success"
                                          : "app-pill-warning",
                                      ].join(" ")}
                                    >
                                      {session.planType === "official"
                                        ? t("exams.filters.official")
                                        : t("exams.filters.tentative")}
                                    </span>

                                    <div>
                                      <span
                                        className={[
                                          "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                                          getStatusTone(session.examDate),
                                        ].join(" ")}
                                      >
                                        {getCountdownLabel(session.examDate, t)}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-4 py-3">
                                  <div className="font-semibold">
                                    {session.courseCode ||
                                      t("exams.labels.unknownCourseCode")}
                                  </div>
                                  <div className="mt-1 text-sm app-text-muted">
                                    {session.courseName || session.noticeTitle}
                                  </div>
                                </td>

                                <td className="px-4 py-3">
                                  <div className="font-medium">
                                    {formatDate(session.examDate, locale)} •{" "}
                                    {session.startTime ||
                                      t("exams.labels.unknownTime")}
                                  </div>
                                  <div className="mt-1 text-sm app-text-muted">
                                    {sanitizeVisualText(session.room) ||
                                      t("exams.labels.unknownRoom")}
                                    {session.campus
                                      ? ` • ${sanitizeVisualText(session.campus)}`
                                      : ""}
                                  </div>
                                  <div className="mt-1 max-w-[360px] text-xs leading-5 app-text-muted">
                                    {sanitizeExamMeta(session.examMetaRaw) || "—"}
                                  </div>
                                </td>

                                <td className="px-4 py-3">
                                  <div className="inline-flex rounded-full app-pill px-3 py-1 text-xs font-semibold">
                                    {isVi
                                      ? `${session.studentCount} sinh viên`
                                      : `${session.studentCount} students`}
                                  </div>

                                  <div className="mt-2 space-y-1 text-xs app-text-muted">
                                    <div>
                                      {isVi ? "Lớp môn học" : "Course classes"}:{" "}
                                      {session.classCourseCount || 0}
                                    </div>
                                    <div>
                                      {isVi ? "Lớp sinh hoạt" : "Student classes"}
                                      : {session.classStudentCount || 0}
                                    </div>
                                  </div>
                                </td>

                                <td className="px-4 py-3">
                                  <div>
                                    {session.records[0]?.classCourse || "—"}
                                  </div>
                                  {session.records[0]?.classStudent ? (
                                    <div className="mt-1 text-xs app-text-muted">
                                      {session.records[0].classStudent}
                                    </div>
                                  ) : null}
                                </td>

                                <td className="px-4 py-3">
                                  <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
                                    <button
                                      type="button"
                                      onClick={() => setActiveSession(session)}
                                      className={`${BTN_NEUTRAL} shrink-0 whitespace-nowrap`}
                                    >
                                      {isVi ? "Xem ca thi" : "View session"}
                                    </button>

                                    <Link
                                      href={buildNoticeReportHref(
                                        session.detailUrl,
                                      )}
                                      className={`${BTN_PRIMARY} shrink-0 whitespace-nowrap`}
                                    >
                                      {isVi
                                        ? "Mở hồ sơ lịch"
                                        : "Open roster view"}
                                    </Link>
                                  </div>

                                  <div className="mt-2 max-w-[360px] text-[11px] leading-5 app-text-muted">
                                    {isVi
                                      ? "Hồ sơ lịch là trang form web đầy đủ của cả file nguồn, dễ xem hơn Excel gốc."
                                      : "Roster view opens the full in-app form of the source workbook."}
                                  </div>
                                </td>

                                <td className="px-4 py-3">
                                  <div className="text-xs app-text-muted">
                                    {session.publishedAtRaw ||
                                      t("exams.labels.unknownPublishTime")}
                                  </div>

                                  {session.attachmentName ? (
                                    <div className="mt-1 text-xs app-text-muted">
                                      {session.attachmentName}
                                    </div>
                                  ) : null}

                                  <div className="mt-2 flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
                                    <a
                                      href={session.detailUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={`${BTN_DETAIL_LINK} shrink-0 whitespace-nowrap`}
                                    >
                                      {t("exams.actions.openDetail")}
                                    </a>

                                    {session.attachmentUrl ? (
                                      <a
                                        href={session.attachmentUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={`${BTN_DOWNLOAD_LINK} shrink-0 whitespace-nowrap`}
                                      >
                                        {isVi
                                          ? "Tải file lịch thi"
                                          : "Download exam file"}
                                      </a>
                                    ) : null}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </SyncedHorizontalTable>
                    </div>
                  </div>
                );
              })}

              {hasMoreGroups ? (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleGroupsLimit((v) => v + 8)}
                    className={BTN_PRIMARY}
                  >
                    {t("exams.actions.loadMore")}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </section>

        {activeSession ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-[var(--border-main)] bg-[var(--bg-card)] shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-[var(--border-main)] px-5 py-4">
                <div>
                  <div className="text-lg font-bold">
                    {activeSession.courseCode ||
                      t("exams.labels.unknownCourseCode")}
                    {activeSession.courseName
                      ? ` • ${activeSession.courseName}`
                      : ""}
                  </div>
                  <div className="mt-1 text-sm app-text-muted">
                    {formatDate(activeSession.examDate, locale)} •{" "}
                    {activeSession.startTime || t("exams.labels.unknownTime")} •{" "}
                    {sanitizeVisualText(activeSession.room) ||
                      t("exams.labels.unknownRoom")}
                    {activeSession.campus
                      ? ` • ${sanitizeVisualText(activeSession.campus)}`
                      : ""}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveSession(null)}
                  className={BTN_NEUTRAL}
                >
                  {t("common.close")}
                </button>
              </div>

              <div className="max-h-[calc(90vh-88px)] overflow-auto px-5 py-4">
                <div className="grid gap-4 lg:grid-cols-4">
                  <div className="rounded-xl border border-[var(--border-main)] p-4">
                    <div className="text-[11px] uppercase app-text-muted">
                      {isVi ? "Loại lịch" : "Plan type"}
                    </div>
                    <div className="mt-2 font-semibold">
                      {activeSession.planType === "official"
                        ? t("exams.filters.official")
                        : t("exams.filters.tentative")}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--border-main)] p-4">
                    <div className="text-[11px] uppercase app-text-muted">
                      {isVi ? "Sinh viên" : "Students"}
                    </div>
                    <div className="mt-2 font-semibold">
                      {activeSession.studentCount}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--border-main)] p-4">
                    <div className="text-[11px] uppercase app-text-muted">
                      {isVi ? "Lớp môn học" : "Course classes"}
                    </div>
                    <div className="mt-2 font-semibold">
                      {activeSession.classCourseCount}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--border-main)] p-4">
                    <div className="text-[11px] uppercase app-text-muted">
                      {isVi ? "Trạng thái" : "Status"}
                    </div>
                    <div className="mt-2">
                      <span
                        className={[
                          "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                          getStatusTone(activeSession.examDate),
                        ].join(" ")}
                      >
                        {getCountdownLabel(activeSession.examDate, t)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-[var(--border-main)] bg-[var(--bg-soft)] p-4">
                  <div className="text-sm font-semibold">
                    {isVi ? "Thông tin phiên thi" : "Session details"}
                  </div>
                  <div className="mt-2 text-sm app-text-muted">
                    {sanitizeExamMeta(activeSession.examMetaRaw) || "—"}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={buildNoticeReportHref(activeSession.detailUrl)}
                      className={BTN_PRIMARY}
                    >
                      {isVi ? "Mở hồ sơ lịch đầy đủ" : "Open full roster view"}
                    </Link>

                    <a
                      href={activeSession.detailUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={BTN_DETAIL_LINK}
                    >
                      {t("exams.actions.openDetail")}
                    </a>

                    {activeSession.attachmentUrl ? (
                      <a
                        href={activeSession.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={BTN_DOWNLOAD_LINK}
                      >
                        {isVi ? "Tải file lịch thi" : "Download exam file"}
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-base font-semibold">
                      {isVi
                        ? `Danh sách sinh viên (${activeSession.records.length})`
                        : `Students (${activeSession.records.length})`}
                    </div>
                    <div className="text-xs app-text-muted">
                      {isVi
                        ? "Bản xem nhanh theo 1 ca thi. Muốn xem đủ cả file thì bấm nút hồ sơ lịch."
                        : "Quick per-session preview. Use roster view for the full workbook."}
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-[var(--border-main)]">
                    <table className="min-w-[980px] w-full text-sm">
                      <thead>
                        <tr className="bg-[var(--bg-soft)] text-left">
                          <th className="px-4 py-3 font-semibold">
                            {isVi ? "MSSV" : "Student ID"}
                          </th>
                          <th className="px-4 py-3 font-semibold">
                            {isVi ? "Họ tên" : "Name"}
                          </th>
                          <th className="px-4 py-3 font-semibold">
                            {isVi ? "Lớp môn học" : "Course class"}
                          </th>
                          <th className="px-4 py-3 font-semibold">
                            {isVi ? "Lớp sinh hoạt" : "Student class"}
                          </th>
                          <th className="px-4 py-3 font-semibold">
                            {isVi ? "Ngày sinh" : "Birth date"}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeSession.records.map((record) => (
                          <tr
                            key={record.id}
                            className="border-t border-[var(--border-main)]/70"
                          >
                            <td className="px-4 py-3">
                              {record.studentId || "—"}
                            </td>
                            <td className="px-4 py-3">
                              {record.studentName || "—"}
                            </td>
                            <td className="px-4 py-3">
                              {record.classCourse || "—"}
                            </td>
                            <td className="px-4 py-3">
                              {record.classStudent || "—"}
                            </td>
                            <td className="px-4 py-3">
                              {record.birthDate || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}