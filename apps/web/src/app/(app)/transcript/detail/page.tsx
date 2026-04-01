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

function formatScore(value: number | null | undefined) {
  if (value === null || value === undefined) return "--";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
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

    try {
      const data = await fetchTranscriptDetail();
      setItems(data.items || []);
      setMeta(data.meta ?? null);
    } catch (e) {
      setItems([]);
      setMeta(null);
      setError(String((e as Error)?.message || e));
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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

        <div className="flex flex-col items-start gap-2 lg:items-end">
          <SyncTranscriptDetailButton />
          <button
            type="button"
            onClick={() => void load()}
            className="text-sm font-bold text-[var(--accent)] hover:underline"
          >
            {t("transcriptDetail.reload", "Tải lại dữ liệu")}
          </button>
        </div>
      </div>

      <div className="rounded-[22px] border border-[var(--warning)]/25 bg-[var(--warning)]/10 px-5 py-4 text-sm text-[var(--warning)] shadow-[0_10px_30px_rgba(245,158,11,0.10)]">
        <div className="font-extrabold">
          {t("transcriptDetail.notice.title", "Lưu ý đồng bộ")}
        </div>
        <div className="mt-2 font-semibold leading-7 opacity-100">
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
      </div>

      <div className="app-card rounded-3xl p-4">
        {loading ? (
          <EmptyBox>
            {t("transcriptDetail.loading", "Đang tải dữ liệu chi tiết...")}
          </EmptyBox>
        ) : error ? (
          <EmptyBox>{error}</EmptyBox>
        ) : grouped.length === 0 ? (
          <EmptyBox>
            {t(
              "transcriptDetail.empty",
              "Chưa có dữ liệu bảng điểm chi tiết phù hợp.",
            )}
          </EmptyBox>
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
                                value={`${formatScore(totalWeightPercent)}%`}
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
                          <table className="w-full min-w-[980px] text-sm">
                            <thead className="bg-[var(--bg-soft)] text-left app-text-soft">
                              <tr>
                                <th className="px-4 py-3">#</th>
                                <th className="px-4 py-3">
                                  {t(
                                    "transcriptDetail.table.component",
                                    "Thành phần",
                                  )}
                                </th>
                                <th className="px-4 py-3">
                                  {t(
                                    "transcriptDetail.table.score1",
                                    "Điểm lần 1",
                                  )}
                                </th>
                                <th className="px-4 py-3">
                                  {t(
                                    "transcriptDetail.table.score2",
                                    "Điểm lần 2",
                                  )}
                                </th>
                                <th className="px-4 py-3">
                                  {t(
                                    "transcriptDetail.table.scale",
                                    "Thang điểm",
                                  )}
                                </th>
                                <th className="px-4 py-3">
                                  {t("transcriptDetail.table.weight", "% Điểm")}
                                </th>
                                <th className="px-4 py-3">
                                  {t("transcriptDetail.table.max", "% Tối đa")}
                                </th>
                                <th className="px-4 py-3">
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
                                  className="border-t border-[var(--border-main)]"
                                >
                                  <td className="px-4 py-3 font-semibold">
                                    {index + 1}
                                  </td>
                                  <td className="px-4 py-3 font-bold">
                                    {row.componentLabel}
                                  </td>
                                  <td className="px-4 py-3 font-semibold">
                                    {formatScore(row.score1)}
                                  </td>
                                  <td className="px-4 py-3 font-semibold">
                                    {formatScore(row.score2)}
                                  </td>
                                  <td className="px-4 py-3 font-semibold">
                                    {formatScore(row.scaleScore)}
                                  </td>
                                  <td className="px-4 py-3 font-semibold">
                                    {row.weightPercent !== null &&
                                    row.weightPercent !== undefined
                                      ? `${formatScore(row.weightPercent)}%`
                                      : "--"}
                                  </td>
                                  <td className="px-4 py-3 font-semibold">
                                    {row.contributionMax !== null &&
                                    row.contributionMax !== undefined
                                      ? `${formatScore(row.contributionMax)}%`
                                      : "--"}
                                  </td>
                                  <td className="px-4 py-3 font-semibold">
                                    {formatScore(row.contributionScore)}
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
