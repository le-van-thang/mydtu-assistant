"use client";

import InAppNotice from "@/components/common/InAppNotice";
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

  const selectedDateInputValue = formatDateInputValue(selectedDate);

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
      setSyncMessage(t("timetable.sync.successSimple"));
      void load(viewMode, selectedDate);
    };

    window.addEventListener("mydtu:timetable-updated", onUpdated);
    return () => {
      window.removeEventListener("mydtu:timetable-updated", onUpdated);
    };
  }, [viewMode, selectedDate, t]);

  const today = startOfToday();

  const campusOptions = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.campus?.trim()) set.add(item.campus.trim());
    }
    return Array.from(set).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCampus =
        campusFilter === "all" ? true : (item.campus || "") === campusFilter;

      const courseText = `${item.courseCode} ${item.courseName || ""}`
        .toLowerCase()
        .trim();

      const matchCourse = courseFilter.trim()
        ? courseText.includes(courseFilter.trim().toLowerCase())
        : true;

      return matchCampus && matchCourse;
    });
  }, [items, campusFilter, courseFilter]);

  const todayItems = useMemo(() => {
    return sortByTime(
      filteredItems.filter((item) => {
        const d = parseOccurrenceDate(item.occurrenceDate);
        return d ? isSameDate(d, today) : false;
      })
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
            })
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
        i18n.language
      )}`;
    }

    return formatMonthYear(selectedDate, i18n.language);
  }, [selectedDate, viewMode, i18n.language]);

  const noClassToday = todayItems.length === 0;
  const lastSyncedText = meta?.lastSyncedAt
    ? formatDateTime(new Date(meta.lastSyncedAt), i18n.language)
    : t("common.noData");

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

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("timetable.title")}</h1>
          <p className="mt-1 text-sm app-text-muted">{t("timetable.subtitle")}</p>
        </div>

        <div className="flex flex-col items-start gap-2 lg:items-end">
          <SyncTimetableButton />
          <button
            type="button"
            onClick={() => void load(viewMode, selectedDate)}
            className="text-sm font-medium hover:underline"
            style={{ color: "var(--accent)" }}
          >
            {t("timetable.actions.reloadData")}
          </button>
          {syncMessage ? (
            <div className="text-sm" style={{ color: "var(--success)" }}>
              {syncMessage}
            </div>
          ) : null}
        </div>
      </div>

      {noClassToday ? (
        <InAppNotice
          tone="warning"
          title={t("timetable.summary.todayNotice")}
          message={t("timetable.notice.noClassToday")}
        />
      ) : (
        <InAppNotice
          tone="success"
          title={t("timetable.summary.todayNotice")}
          message={t("timetable.notice.hasClassToday", { count: todayItems.length })}
        />
      )}

      {meta?.lastSyncStatus ? (
        <InAppNotice
          tone={
            meta.lastSyncStatus === "SUCCESS"
              ? "success"
              : meta.lastSyncStatus === "PARTIAL"
              ? "warning"
              : "error"
          }
          title={t("timetable.summary.syncStatus")}
          message={
            meta.lastSyncStatus === "SUCCESS"
              ? t("timetable.labels.successfulSync", { time: lastSyncedText })
              : meta.lastSyncStatus === "PARTIAL"
              ? t("timetable.labels.partialSync", { time: lastSyncedText })
              : t("timetable.labels.lastSyncFailed")
          }
        />
      ) : null}

      <ExtensionConnect />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <div className="app-card rounded-3xl p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="app-btn rounded-2xl px-3 py-2 text-sm font-medium"
                  aria-label={t("timetable.labels.viewPrevious")}
                  title={t("timetable.labels.viewPrevious")}
                >
                  ←
                </button>

                <div className="min-w-56 text-lg font-semibold">{periodLabel}</div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="app-btn rounded-2xl px-3 py-2 text-sm font-medium"
                  aria-label={t("timetable.labels.viewNext")}
                  title={t("timetable.labels.viewNext")}
                >
                  →
                </button>

                <button
                  type="button"
                  onClick={handleToday}
                  className="app-btn-primary rounded-2xl px-4 py-2 text-sm font-medium"
                >
                  {t("common.today")}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="timetable-date" className="sr-only">
                  {t("timetable.labels.selectDate")}
                </label>
                <input
                  id="timetable-date"
                  type="date"
                  value={selectedDateInputValue}
                  onChange={(e) =>
                    setSelectedDate(parseDateInputValue(e.target.value))
                  }
                  className="app-input rounded-2xl px-3 py-2 text-sm outline-none"
                />

                <div className="app-card-strong flex rounded-2xl p-1">
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
                  <option value="all">{t("timetable.filters.allCampuses")}</option>
                  {campusOptions.map((campus) => (
                    <option key={campus} value={campus}>
                      {campus}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="course-filter" className="sr-only">
                  {t("timetable.filters.searchPlaceholder")}
                </label>
                <input
                  id="course-filter"
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  placeholder={t("timetable.filters.searchPlaceholder")}
                  className="app-input rounded-2xl px-3 py-2 text-sm outline-none"
                />
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
                  : t("timetable.content.classes", { count: filteredItems.length })}
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
            ) : groupedForDisplay.every((group) => group.items.length === 0) ? (
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
                        {t("timetable.content.classes", { count: group.items.length })}
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
                          <table className="w-full text-sm" style={{ minWidth: 1080 }}>
                            <thead
                              style={{ background: "var(--bg-soft)" }}
                              className="app-text-soft"
                            >
                              <tr className="text-left">
                                <th className="px-4 py-3">{t("timetable.table.date")}</th>
                                <th className="px-4 py-3">{t("timetable.table.weekday")}</th>
                                <th className="px-4 py-3">{t("timetable.table.time")}</th>
                                <th className="px-4 py-3">{t("timetable.table.courseCode")}</th>
                                <th className="px-4 py-3">{t("timetable.table.courseName")}</th>
                                <th className="px-4 py-3">{t("timetable.table.room")}</th>
                                <th className="px-4 py-3">{t("timetable.table.campus")}</th>
                                <th className="px-4 py-3">{t("timetable.table.mode")}</th>
                                <th className="px-4 py-3">{t("timetable.table.week")}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.items.map((it) => {
                                const occurrence = parseOccurrenceDate(it.occurrenceDate);

                                return (
                                  <tr
                                    key={it.id}
                                    style={{ borderTop: "1px solid var(--border-main)" }}
                                  >
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      {occurrence
                                        ? formatShortDate(occurrence, i18n.language)
                                        : "--"}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      {toWeekdayLabel(it.dayOfWeek, i18n.language)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <span
                                        className="rounded-xl px-2 py-1 text-xs font-medium"
                                        style={{ background: "var(--bg-soft)" }}
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
                                    <td className="px-4 py-3">{it.courseName || ""}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">{it.room}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      {it.campus || ""}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <DeliveryBadge item={it} t={t} />
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap app-text-soft">
                                      {it.weekLabel || it.weeksIncluded || it.semester || ""}
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

        <div className="space-y-4">
          <div className="app-card rounded-3xl p-4">
            <div className="text-sm font-semibold uppercase tracking-wide app-text-muted">
              {t("timetable.todayCard.title")}
            </div>
            <div className="mt-1 text-lg font-semibold">
              {formatFullDate(today, i18n.language)}
            </div>

            {todayItems.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed px-4 py-4 text-sm app-text-muted">
                {t("timetable.labels.todayNoClass")}
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {todayItems.map((item) => (
                  <div key={item.id} className="app-card-strong rounded-2xl p-4">
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
                      <div>{t("timetable.labels.roomLabel", { value: item.room || "--" })}</div>
                      <div>
                        {t("timetable.labels.campusLabel", {
                          value: item.campus || "--",
                        })}
                      </div>
                      <div>
                        {t("timetable.labels.weekLabel", {
                          value: item.weekLabel || item.weeksIncluded || item.semester || "--",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="app-card rounded-3xl p-4">
            <div className="text-sm font-semibold uppercase tracking-wide app-text-muted">
              {t("timetable.quickOverview.title")}
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

            <div className="mt-4 grid grid-cols-1 gap-3">
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
      className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
        active ? "text-white" : "app-text-soft"
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
      <div className="text-xs uppercase tracking-wide app-text-muted">{label}</div>
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
                  ? { boxShadow: "inset 0 0 0 1px var(--accent), var(--shadow-card)" }
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
                    ? t("timetable.content.classes", { count: cell.items.length })
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
                      <DeliveryBadge item={item} t={t as (key: string) => string} />
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
  today: Date
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
  language: string
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
  return new Intl.DateTimeFormat(language === "en" ? "en-GB" : "vi-VN").format(date);
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