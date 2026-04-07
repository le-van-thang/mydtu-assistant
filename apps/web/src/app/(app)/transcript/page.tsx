"use client";

// import SyncTranscriptButton from "@/components/SyncTranscriptButton";
import { fetchTranscript, type TranscriptItem } from "@/lib/transcript/api";
import {
  exportTranscriptCsv,
  exportTranscriptHtml,
  openPrintableTranscriptSlip,
} from "@/lib/transcript/exporters";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
// import TranscriptExtensionConnect from "./TranscriptExtensionConnect";
import VisionOcrUploader from "@/components/VisionOcrUploader";
import Skeleton from "@/components/ui/Skeleton";

type MetaState = {
  lastSyncedAt?: string | null;
  lastSyncStatus?: string | null;
  lastSyncCounts?: unknown;
} | null;

type ToastTone = "success" | "info" | "warning" | "error";

type AppToast = {
  id: string;
  tone: ToastTone;
  title: string;
  message?: string;
};

type ScoreStateFilter = "all" | "counted" | "passfail" | "pending";
type StatusFilter = "all" | "passed" | "failed" | "unknown";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="app-card-strong rounded-xl px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-[0.14em] app-text-muted">
        {label}
      </div>
      <div className="mt-1 text-[15px] font-semibold">{value}</div>
    </div>
  );
}

function QuickStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-card-strong rounded-xl px-3 py-3">
      <div className="text-[10px] uppercase tracking-[0.14em] app-text-muted">
        {label}
      </div>
      <div className="mt-1 text-[15px] font-semibold">{value}</div>
    </div>
  );
}


function TranscriptStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="app-card-strong rounded-xl px-3 py-3">
          <Skeleton className="h-2 w-16 mb-2" />
          <Skeleton className="h-5 w-12" />
        </div>
      ))}
    </div>
  );
}

function TranscriptTableSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="app-section p-4">
          <div className="flex justify-between mb-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((__, j) => (
              <div key={j} className="flex gap-4 items-center">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-16 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyBox({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "error";
}) {
  if (tone === "error") {
    return (
      <div className="rounded-2xl border border-red-500/25 bg-red-500/8 px-4 py-5 text-sm text-red-300">
        {children}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-[var(--border-main)] px-4 py-5 text-sm app-text-muted">
      {children}
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
    <div className="pointer-events-none fixed right-4 top-4 z-[90] flex w-[min(92vw,390px)] flex-col gap-3 md:right-6 md:top-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto overflow-hidden rounded-[22px]"
          style={getToastStyle(toast.tone)}
        >
          <div className="flex items-start gap-3 px-4 py-4">
            <div
              className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.14)",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            >
              {toast.tone === "success"
                ? "✓"
                : toast.tone === "error"
                ? "!"
                : "i"}
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-sm font-extrabold text-white">{toast.title}</div>
              {toast.message ? (
                <div className="mt-1 text-sm font-semibold leading-6 text-white">
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
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function compactToken(value: unknown) {
  return normalizeText(value).replace(/\s+/g, "");
}

function getUnitType(item: TranscriptItem) {
  return compactToken(
    item.componentsBreakdown?.unitType || item.componentsBreakdown?.type || "",
  );
}

function getLetterToken(item: TranscriptItem) {
  return compactToken(item.letter || "");
}

function isPassFailExcluded(item: TranscriptItem) {
  const unitType = getUnitType(item);
  const letter = getLetterToken(item);

  return (
    letter === "p" ||
    letter === "p/pf" ||
    letter === "p(p/f)" ||
    letter === "p(pf)" ||
    letter.includes("p/f") ||
    letter.includes("p(p/f)") ||
    unitType === "p" ||
    unitType === "p/f" ||
    unitType === "pf" ||
    unitType.includes("p/f") ||
    unitType.includes("p(f)") ||
    unitType.includes("pf")
  );
}

function hasRealGrade(item: TranscriptItem) {
  return (
    item.score10 !== null ||
    item.letter !== null ||
    item.gpa4 !== null ||
    normalizeText(item.status) === "passed" ||
    normalizeText(item.status) === "failed"
  );
}

function isCountedInOfficialCredits(item: TranscriptItem) {
  return hasRealGrade(item) && !isPassFailExcluded(item);
}

function isPassed(item: TranscriptItem) {
  return normalizeText(item.status) === "passed";
}

function isFailed(item: TranscriptItem) {
  return normalizeText(item.status) === "failed";
}

function calcCountedCredits(items: TranscriptItem[]) {
  return items.reduce((sum, item) => {
    if (!isCountedInOfficialCredits(item)) return sum;
    return sum + Number(item.credits || 0);
  }, 0);
}

function calcPassedCountedCredits(items: TranscriptItem[]) {
  return items.reduce((sum, item) => {
    if (!isPassed(item) || !isCountedInOfficialCredits(item)) return sum;
    return sum + Number(item.credits || 0);
  }, 0);
}

function calcPassFailCredits(items: TranscriptItem[]) {
  return items.reduce((sum, item) => {
    if (!isPassFailExcluded(item)) return sum;
    return sum + Number(item.credits || 0);
  }, 0);
}

function calcPendingCredits(items: TranscriptItem[]) {
  return items.reduce((sum, item) => {
    if (hasRealGrade(item)) return sum;
    return sum + Number(item.credits || 0);
  }, 0);
}

function calcRegisteredCredits(items: TranscriptItem[]) {
  return items.reduce((sum, item) => sum + Number(item.credits || 0), 0);
}

function countPassed(items: TranscriptItem[]) {
  return items.filter(
    (item) => isPassed(item) && isCountedInOfficialCredits(item),
  ).length;
}

function countFailed(items: TranscriptItem[]) {
  return items.filter(
    (item) => isFailed(item) && isCountedInOfficialCredits(item),
  ).length;
}

function calcWeightedGpa(items: TranscriptItem[]) {
  let credits = 0;
  let weighted = 0;

  for (const item of items) {
    if (typeof item.gpa4 !== "number") continue;
    if (!isCountedInOfficialCredits(item)) continue;

    const c = Number(item.credits || 0);
    if (!Number.isFinite(c) || c <= 0) continue;

    credits += c;
    weighted += item.gpa4 * c;
  }

  if (!credits) return "--";
  return (weighted / credits).toFixed(2);
}

function getStatusLabel(
  status: string | null | undefined,
  t: ReturnType<typeof useTranslation>["t"],
) {
  const s = normalizeText(status);

  if (s === "passed") return t("transcript.status.passed", "Đạt");
  if (s === "failed") return t("transcript.status.failed", "Chưa đạt");
  if (s === "unknown") return t("transcript.status.unknown", "Chưa rõ");
  if (!s) return t("transcript.status.unknown", "Chưa rõ");

  return status || t("transcript.status.unknown", "Chưa rõ");
}

function getStatusPillClass(status: string | null | undefined) {
  const s = normalizeText(status);
  if (s === "passed") return "app-badge-online";
  if (s === "failed") return "app-pill-danger";
  return "app-pill";
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
    sortKey: `${academicYear}-${String(termOrder).padStart(2, "0")}`,
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

function formatScore(value: number | null | undefined) {
  if (value === null || value === undefined) return "--";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function TranscriptDetailModal({
  item,
  onClose,
}: {
  item: TranscriptItem | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  if (!item) return null;

  const meta = extractSemesterMeta(item.semester);
  const method =
    item.componentsBreakdown?.method ||
    item.componentsBreakdown?.type ||
    item.componentsBreakdown?.unitType ||
    "--";
  const cumulative =
    typeof item.componentsBreakdown?.cumulative === "number"
      ? formatScore(item.componentsBreakdown.cumulative)
      : "--";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 px-4 py-6">
      <div className="app-card w-full max-w-2xl rounded-[24px] p-4 shadow-[0_25px_80px_rgba(2,8,23,0.55)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] app-text-muted">
              {t("transcript.detail.titleSmall", "Bảng điểm cụ thể")}
            </div>
            <h3 className="mt-2 text-[24px] font-bold leading-tight">
              {item.courseName}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="app-pill rounded-full px-3 py-1 text-xs font-semibold">
                {item.courseCode}
              </span>
              <span className="app-pill rounded-full px-3 py-1 text-xs font-semibold">
                {item.classCode || "--"}
              </span>
              <span
                className={[
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  getStatusPillClass(item.status),
                ].join(" ")}
              >
                {getStatusLabel(item.status, t)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-main)] text-lg"
          >
            ×
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <QuickStatCard
            label={t("transcript.filter.academicYear", "Năm học")}
            value={meta.academicYear}
          />
          <QuickStatCard
            label={t("transcript.detail.term", "Học kỳ")}
            value={meta.term}
          />
          <QuickStatCard
            label={t("transcript.table.credits", "Tín chỉ")}
            value={String(item.credits || 0)}
          />
          <QuickStatCard
            label={t("transcript.table.status", "Trạng thái")}
            value={getStatusLabel(item.status, t)}
          />
          <QuickStatCard
            label={t("transcript.table.score10", "Điểm 10")}
            value={formatScore(item.score10)}
          />
          <QuickStatCard
            label={t("transcript.table.letter", "Điểm chữ")}
            value={item.letter || "--"}
          />
          <QuickStatCard
            label={t("transcript.table.gpa4", "GPA hệ 4")}
            value={formatScore(item.gpa4)}
          />
          <QuickStatCard
            label={t("transcript.table.cumulative", "Điểm tích lũy")}
            value={cumulative}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="app-card-strong rounded-2xl p-4">
            <div className="text-xs font-semibold uppercase tracking-wide app-text-muted">
              {t("transcript.detail.classInfo", "Thông tin lớp")}
            </div>
            <div className="mt-3 space-y-2.5 text-sm">
              <div className="flex items-start justify-between gap-4">
                <span className="app-text-muted">
                  {t("transcript.table.classCode", "Mã lớp")}
                </span>
                <span className="text-right font-semibold">
                  {item.classCode || "--"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="app-text-muted">
                  {t("transcript.table.method", "Hình thức")}
                </span>
                <span className="text-right font-semibold">{method}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="app-text-muted">
                  {t("transcript.detail.semesterText", "Chuỗi học kỳ")}
                </span>
                <span className="text-right font-semibold">{item.semester}</span>
              </div>
            </div>
          </div>

          <div className="app-card-strong rounded-2xl p-4">
            <div className="text-xs font-semibold uppercase tracking-wide app-text-muted">
              {t("transcript.detail.evaluation", "Đánh giá học phần")}
            </div>
            <div className="mt-3 space-y-2.5 text-sm">
              <div className="flex items-start justify-between gap-4">
                <span className="app-text-muted">
                  {t("transcript.detail.hasGrade", "Đã có điểm")}
                </span>
                <span className="text-right font-semibold">
                  {hasRealGrade(item)
                    ? t("common.yes", "Có")
                    : t("common.no", "Chưa")}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="app-text-muted">
                  {t("transcript.table.score10", "Điểm 10")}
                </span>
                <span className="text-right font-semibold">
                  {formatScore(item.score10)}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="app-text-muted">
                  {t("transcript.table.letter", "Điểm chữ")}
                </span>
                <span className="text-right font-semibold">
                  {item.letter || "--"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="app-text-muted">
                  {t("transcript.table.gpa4", "GPA 4")}
                </span>
                <span className="text-right font-semibold">
                  {formatScore(item.gpa4)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)]/40 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide app-text-muted">
            {t("transcript.detail.note", "Ghi chú")}
          </div>
          <div className="mt-2 text-sm leading-6 app-text-soft">
            {t(
              "transcript.detail.noteText",
              "Hiện tại popup này đang hiển thị dữ liệu đã lưu từ bảng điểm tổng quan. Phần đồng bộ tự động bảng điểm cụ thể theo từng môn sẽ nối tiếp ở bước sau khi có HTML của trang Bảng điểm Cụ thể.",
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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

export default function TranscriptPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [items, setItems] = useState<TranscriptItem[]>([]);
  const [meta, setMeta] = useState<MetaState>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [academicYearFilter, setAcademicYearFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [scoreStateFilter, setScoreStateFilter] =
    useState<ScoreStateFilter>("all");
  const [selectedItem, setSelectedItem] = useState<TranscriptItem | null>(null);
  const [toasts, setToasts] = useState<AppToast[]>([]);

  function pushToast(
    tone: ToastTone,
    title: string,
    message?: string,
    duration = 3200,
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

  async function load() {
    setLoading(true);
    setError(null);

    // --- STEP 1: LOAD CACHE ---
    try {
      const cached = localStorage.getItem("mydtu:transcript-cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.items) {
          setItems(parsed.items);
          setMeta(parsed.meta);
          setLoading(false); // Quick display
        }
      }
    } catch {
      // Ignore cache errors
    }

    // --- STEP 2: FETCH FRESH ---
    try {
      const data = await fetchTranscript();
      setItems(data.items || []);
      setMeta(data.meta ?? null);
      
      // Save cache
      localStorage.setItem("mydtu:transcript-cache", JSON.stringify({
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
      pushToast(
        "success",
        t("transcript.toast.syncSuccessTitle", "Đồng bộ bảng điểm thành công"),
        t(
          "transcript.toast.syncSuccessMessage",
          "Dữ liệu bảng điểm mới nhất đã được cập nhật từ extension.",
        ),
      );
      void load();
    };

    window.addEventListener("mydtu:transcript-updated", onUpdated);
    return () => {
      window.removeEventListener("mydtu:transcript-updated", onUpdated);
    };
  }, [t]);

  const academicYearOptions = useMemo(() => {
    const years = new Set<string>();
    for (const item of items) {
      years.add(extractSemesterMeta(item.semester).academicYear);
    }
    return Array.from(years).filter(Boolean).sort().reverse();
  }, [items]);

  const semesterOptions = useMemo(() => {
    return Array.from(new Set(items.map((x) => x.semester))).sort(compareSemesters);
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const semesterMeta = extractSemesterMeta(item.semester);

      const searchSource = [
        item.courseCode,
        item.classCode,
        item.courseName,
        item.semester,
        item.componentsBreakdown?.method,
        item.componentsBreakdown?.type,
        item.componentsBreakdown?.unitType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchText.trim()
        ? searchSource.includes(searchText.trim().toLowerCase())
        : true;

      const matchesAcademicYear =
        academicYearFilter === "all"
          ? true
          : semesterMeta.academicYear === academicYearFilter;

      const matchesSemester =
        semesterFilter === "all" ? true : item.semester === semesterFilter;

      const matchesStatus =
        statusFilter === "all"
          ? true
          : normalizeText(item.status) === statusFilter;

      const matchesScoreState =
        scoreStateFilter === "all"
          ? true
          : scoreStateFilter === "counted"
          ? isCountedInOfficialCredits(item)
          : scoreStateFilter === "passfail"
          ? isPassFailExcluded(item)
          : !hasRealGrade(item);

      return (
        matchesSearch &&
        matchesAcademicYear &&
        matchesSemester &&
        matchesStatus &&
        matchesScoreState
      );
    });
  }, [
    items,
    searchText,
    academicYearFilter,
    semesterFilter,
    statusFilter,
    scoreStateFilter,
  ]);

  const grouped = useMemo(() => {
    const map = new Map<string, TranscriptItem[]>();

    for (const item of filteredItems) {
      if (!map.has(item.semester)) map.set(item.semester, []);
      map.get(item.semester)!.push(item);
    }

    return Array.from(map.entries())
      .sort((a, b) => compareSemesters(a[0], b[0]))
      .map(
        ([semester, semesterItems]) =>
          [
            semester,
            [...semesterItems].sort((a, b) => {
              const codeDiff = a.courseCode.localeCompare(b.courseCode);
              if (codeDiff !== 0) return codeDiff;
              return (a.classCode || "").localeCompare(b.classCode || "");
            }),
          ] as const,
      );
  }, [filteredItems]);

  const lastSyncedLabel = meta?.lastSyncedAt
    ? new Date(meta.lastSyncedAt).toLocaleString("vi-VN")
    : t("common.noDataYet", "Chưa có");

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
      ? t("common.success", "Thành công")
      : meta?.lastSyncStatus === "PARTIAL"
      ? t("common.partial", "Một phần")
      : meta?.lastSyncStatus === "FAILED"
      ? t("common.failed", "Thất bại")
      : t("common.none", "Chưa có");

  const countedCredits = useMemo(() => calcCountedCredits(filteredItems), [filteredItems]);
  const passedCountedCredits = useMemo(
    () => calcPassedCountedCredits(filteredItems),
    [filteredItems],
  );
  const passFailCredits = useMemo(() => calcPassFailCredits(filteredItems), [filteredItems]);
  const pendingCredits = useMemo(() => calcPendingCredits(filteredItems), [filteredItems]);
  const registeredCredits = useMemo(
    () => calcRegisteredCredits(filteredItems),
    [filteredItems],
  );
  const passedCount = useMemo(() => countPassed(filteredItems), [filteredItems]);
  const failedCount = useMemo(() => countFailed(filteredItems), [filteredItems]);
  const overallGpa4 = useMemo(() => calcWeightedGpa(filteredItems), [filteredItems]);

  return (
    <>
      <ToastViewport toasts={toasts} onClose={removeToast} />
      <TranscriptDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />

      <div className="mx-auto w-full max-w-7xl space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-[1.9rem] font-bold tracking-tight">
              {t("transcript.title", "Bảng điểm tổng quan")}
            </h1>
            <p className="mt-1 text-sm app-text-muted">
              {t(
                "transcript.subtitle",
                "Đồng bộ và xem dữ liệu học tập dùng cho GPA, CPA, risk và trends.",
              )}
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 lg:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  openPrintableTranscriptSlip(
                    filteredItems,
                    {
                      name: user?.name || t("common.defaultName", "Sinh viên"),
                      id: user?.id || "",
                      major: (user as any)?.schoolType || "",
                    },
                    {
                      gpa4: overallGpa4,
                      passedCredits: String(passedCountedCredits),
                      totalCredits: String(registeredCredits),
                    },
                    i18n.language,
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-main)] bg-[var(--bg-soft)] px-4 py-2.5 text-[13px] font-bold shadow-sm hover:bg-[var(--bg-card)] hover:border-blue-500/30 hover:text-blue-600 dark:hover:text-blue-400 hover:-translate-y-0.5 transition-all group"
                title={t("transcript.export.printTip", "In phiếu điểm A4 cực đẹp")}
              >
                <svg className="w-4 h-4 text-[var(--text-muted)] group-hover:text-blue-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="6 9 6 2 18 2 18 9"/>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                  <rect x="6" y="14" width="12" height="8"/>
                </svg>
                {t("transcript.export.print", "In phiếu điểm")}
              </button>

              <button
                type="button"
                onClick={() =>
                  exportTranscriptCsv(
                    filteredItems,
                    i18n.language,
                    `bang-diem-${user?.id || "mydtu"}`,
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-main)] bg-[var(--bg-soft)] px-4 py-2.5 text-[13px] font-bold shadow-sm hover:bg-[var(--bg-card)] hover:border-emerald-500/30 hover:text-emerald-600 dark:hover:text-emerald-400 hover:-translate-y-0.5 transition-all group"
                title={t("transcript.export.csv", "Xuất bản CSV")}
              >
                <svg className="w-4 h-4 text-[var(--text-muted)] group-hover:text-emerald-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                CSV
              </button>

              <button
                type="button"
                onClick={() =>
                  exportTranscriptHtml(
                    filteredItems,
                    i18n.language,
                    `bang-diem-${user?.id || "mydtu"}`,
                  )
                }
                className="relative overflow-hidden group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2.5 text-[13px] font-bold shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                title={t("transcript.export.html", "Xuất bản HTML")}
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                HTML
              </button>

{/* <SyncTranscriptButton /> */}
            </div>

            <button
              type="button"
              onClick={() => {
                pushToast(
                  "info",
                  t("transcript.reload.title", "Đang tải lại dữ liệu"),
                  t(
                    "transcript.reload.message",
                    "Đang làm mới bảng điểm từ dữ liệu hiện có trong hệ thống.",
                  ),
                  2200,
                );
                void load();
              }}
              className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
            >
              <span className={loading ? "animate-spin" : ""}>🔄</span> {t("transcript.reload.title", "Tải lại dữ liệu")}
            </button>
          </div>
        </div>

        <ExpandableHint title={t("transcript.notice.title", "Lưu ý đồng bộ")} isWarning={true}>
          {t(
            "transcript.notice.steps",
            "Bước 1: bấm \"Mở bảng điểm MYDTU\". Bước 2: đăng nhập MYDTU nếu cần. Bước 3: bấm \"Kiểm tra kết nối\". Bước 4: quay lại và bấm \"Đồng bộ bảng điểm\".",
          )}
        </ExpandableHint>

        <VisionOcrUploader onUploadComplete={() => {
          pushToast("success", "Trích xuất hoàn tất", "Bảng điểm đã được AI xử lý và phân tích thành công.");
          void load();
        }} />

        <div className="app-card rounded-3xl p-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
            <div className="xl:col-span-3">
              <label htmlFor="transcript-search" className="mb-2 block text-sm font-medium">
                {t("transcript.search.label", "Tìm kiếm môn học")}
              </label>
              <input
                id="transcript-search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder={t(
                  "transcript.search.placeholder",
                  "Tìm theo mã môn, mã lớp, tên môn, hình thức...",
                )}
                className="app-input rounded-2xl px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="transcript-academic-year-filter"
                className="mb-2 block text-sm font-medium"
              >
                {t("transcript.filter.academicYear", "Lọc năm học")}
              </label>
              <select
                id="transcript-academic-year-filter"
                value={academicYearFilter}
                onChange={(e) => {
                  setAcademicYearFilter(e.target.value);
                  setSemesterFilter("all");
                }}
                className="app-input rounded-2xl px-3 py-2 text-sm outline-none"
              >
                <option value="all">
                  {t("transcript.filter.allAcademicYears", "Tất cả năm học")}
                </option>
                {academicYearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="transcript-semester-filter"
                className="mb-2 block text-sm font-medium"
              >
                {t("transcript.filter.semesterString", "Lọc theo chuỗi học kỳ")}
              </label>
              <select
                id="transcript-semester-filter"
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="app-input rounded-2xl px-3 py-2 text-sm outline-none"
              >
                <option value="all">
                  {t("transcript.filter.allSemesters", "Tất cả học kỳ")}
                </option>
                {semesterOptions
                  .filter((semester) => {
                    if (academicYearFilter === "all") return true;
                    return extractSemesterMeta(semester).academicYear === academicYearFilter;
                  })
                  .map((semester) => (
                    <option key={semester} value={semester}>
                      {semester}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="transcript-status-filter"
                className="mb-2 block text-sm font-medium"
              >
                {t("transcript.filter.status", "Trạng thái học phần")}
              </label>
              <select
                id="transcript-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="app-input rounded-2xl px-3 py-2 text-sm outline-none"
              >
                <option value="all">
                  {t("transcript.filter.allStatuses", "Tất cả trạng thái")}
                </option>
                <option value="passed">{t("transcript.status.passed", "Đạt")}</option>
                <option value="failed">{t("transcript.status.failed", "Chưa đạt")}</option>
                <option value="unknown">{t("transcript.status.unknown", "Chưa rõ")}</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="transcript-score-state-filter"
                className="mb-2 block text-sm font-medium"
              >
                {t("transcript.filter.creditMode", "Tình trạng tín chỉ")}
              </label>
              <select
                id="transcript-score-state-filter"
                value={scoreStateFilter}
                onChange={(e) => setScoreStateFilter(e.target.value as ScoreStateFilter)}
                className="app-input rounded-2xl px-3 py-2 text-sm outline-none"
              >
                <option value="all">{t("common.all", "Tất cả")}</option>
                <option value="counted">{t("transcript.filter.counted", "Tính vào tổng")}</option>
                <option value="passfail">{t("transcript.filter.passFail", "P / P(F)")}</option>
                <option value="pending">{t("transcript.filter.pending", "Chưa có điểm")}</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setSearchText("");
                  setAcademicYearFilter("all");
                  setSemesterFilter("all");
                  setStatusFilter("all");
                  setScoreStateFilter("all");
                }}
                className="app-btn rounded-2xl px-4 py-2 text-sm font-semibold"
              >
                {t("common.resetFilters", "Reset bộ lọc")}
              </button>
            </div>
          </div>

          {loading && items.length === 0 ? (
            <div className="mt-4">
              <TranscriptStatsSkeleton />
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-3">
              <StatCard
                label={t("transcript.stat.visibleRows", "Số dòng hiển thị")}
                value={filteredItems.length}
              />
              <StatCard
                label={t("transcript.stat.visibleSemesters", "Số học kỳ hiển thị")}
                value={grouped.length}
              />
              <StatCard
                label={t("transcript.stat.lastSync", "Lần sync cuối")}
                value={lastSyncedLabel}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(280px,1fr)]">
          <div className="space-y-4">
            <div className="app-card rounded-3xl p-4">
              {loading && items.length === 0 ? (
                <TranscriptTableSkeleton />
              ) : error ? (
                <EmptyBox tone="error">{error}</EmptyBox>
              ) : grouped.length === 0 ? (
                <EmptyBox>
                  {t(
                    "transcript.emptyFiltered",
                    "Không có dữ liệu phù hợp với bộ lọc hiện tại.",
                  )}
                </EmptyBox>
              ) : (
                <div className="space-y-6">
                  {grouped.map(([semester, semesterItems]) => (
                    <div key={semester}>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-[15px] font-semibold">{semester}</h3>
                          <div className="mt-1 text-sm app-text-muted">
                            {extractSemesterMeta(semester).academicYear} •{" "}
                            {extractSemesterMeta(semester).term}
                          </div>
                        </div>
                        <span className="app-pill rounded-full px-2.5 py-1 text-xs font-medium">
                          {t("transcript.courseCount", "{{count}} môn", {
                            count: semesterItems.length,
                          })}
                        </span>
                      </div>

                      <div className="overflow-hidden rounded-3xl border border-[var(--border-main)]">
                        <div className="overflow-auto">
                          <table className="w-full min-w-[1080px] text-sm">
                            <thead className="app-text-soft bg-[var(--bg-soft)]">
                              <tr className="text-left">
                                <th className="px-4 py-3">
                                  {t("transcript.table.courseCode", "Mã môn")}
                                </th>
                                <th className="px-4 py-3">
                                  {t("transcript.table.classCode", "Mã lớp")}
                                </th>
                                <th className="px-4 py-3">
                                  {t("transcript.table.courseName", "Tên môn")}
                                </th>
                                <th className="px-4 py-3">
                                  {t("transcript.table.method", "Hình thức")}
                                </th>
                                <th className="px-4 py-3">
                                  {t("transcript.table.credits", "Tín chỉ")}
                                </th>
                                <th className="px-4 py-3">
                                  {t("transcript.table.score10", "Điểm 10")}
                                </th>
                                <th className="px-4 py-3">
                                  {t("transcript.table.letter", "Điểm chữ")}
                                </th>
                                <th className="px-4 py-3">
                                  {t("transcript.table.gpa4", "GPA 4")}
                                </th>
                                <th className="px-4 py-3">
                                  {t("transcript.table.status", "Trạng thái")}
                                </th>
                                <th className="px-4 py-3">
                                  {t("transcript.table.detail", "Bảng điểm cụ thể")}
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {semesterItems.map((item) => {
                                const method =
                                  item.componentsBreakdown?.method ||
                                  item.componentsBreakdown?.type ||
                                  item.componentsBreakdown?.unitType ||
                                  "--";

                                return (
                                  <tr
                                    key={item.id}
                                    className="border-t border-[var(--border-main)]"
                                  >
                                    <td className="px-4 py-3 font-semibold text-[var(--accent)]">
                                      {item.courseCode}
                                    </td>
                                    <td className="px-4 py-3">
                                      {item.classCode ||
                                        item.componentsBreakdown?.classCode ||
                                        "--"}
                                    </td>
                                    <td className="px-4 py-3">{item.courseName}</td>
                                    <td className="px-4 py-3">{method}</td>
                                    <td className="px-4 py-3">{item.credits}</td>
                                    <td className="px-4 py-3">
                                      {formatScore(item.score10)}
                                    </td>
                                    <td className="px-4 py-3">{item.letter ?? "--"}</td>
                                    <td className="px-4 py-3">
                                      {formatScore(item.gpa4)}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span
                                        className={[
                                          "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                                          getStatusPillClass(item.status),
                                        ].join(" ")}
                                      >
                                        {getStatusLabel(item.status, t)}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedItem(item)}
                                        className="app-btn rounded-xl px-3 py-1.5 text-xs font-semibold"
                                      >
                                        {t(
                                          "transcript.table.detailButton",
                                          "Xem bảng điểm cụ thể",
                                        )}
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <div className="app-card rounded-3xl p-4">
              <div className="text-sm font-semibold uppercase tracking-wide app-text-muted">
                {t("transcript.quickOverview", "Tổng quan nhanh")}
              </div>

              {loading && items.length === 0 ? (
                <div className="mt-4 space-y-4">
                  <Skeleton className="h-20 w-full rounded-2xl" />
                  <Skeleton className="h-40 w-full rounded-2xl" />
                </div>
              ) : (
                <>
                  <div className="mt-4 rounded-3xl border border-[var(--border-main)] bg-[var(--bg-soft)]/55 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-wide app-text-muted">
                          {t("transcript.sync.status", "Trạng thái đồng bộ")}
                        </div>
                        <div className="mt-2 text-base font-semibold">{syncStatusLabel}</div>
                        <div className="mt-1 text-sm app-text-muted">
                          {t("transcript.sync.last", "Lần sync cuối")}: {lastSyncedLabel}
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

                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <QuickStatCard
                      label={t("transcript.quick.gpa4", "GPA hệ 4 hiện tại")}
                      value={overallGpa4}
                    />
                    <QuickStatCard
                      label={t("transcript.quick.countedCredits", "Tín chỉ tính vào tổng")}
                      value={String(countedCredits)}
                    />
                    <QuickStatCard
                      label={t(
                        "transcript.quick.passedCountedCredits",
                        "Tín chỉ đạt tính vào tổng",
                      )}
                      value={String(passedCountedCredits)}
                    />
                    <QuickStatCard
                      label={t("transcript.quick.passFailCredits", "Tín chỉ P / P(F)")}
                      value={String(passFailCredits)}
                    />
                    <QuickStatCard
                      label={t("transcript.quick.pendingCredits", "Tín chỉ chờ điểm")}
                      value={String(pendingCredits)}
                    />
                    <QuickStatCard
                      label={t(
                        "transcript.quick.registeredCredits",
                        "Tổng ĐVHT đang hiển thị",
                      )}
                      value={String(registeredCredits)}
                    />
                    <QuickStatCard
                      label={t("transcript.quick.passedCourses", "Môn đạt")}
                      value={String(passedCount)}
                    />
                    <QuickStatCard
                      label={t("transcript.quick.failedCourses", "Môn chưa đạt")}
                      value={String(failedCount)}
                    />
                    <QuickStatCard
                      label={t("transcript.quick.semesters", "Số học kỳ")}
                      value={String(grouped.length)}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}