"use client";

import { fetchExamsFromDb } from "@/lib/exams/api";
import type { ParsedExamRecord } from "@/lib/exams/parseWorkbook";
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
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type MeResponse = {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  } | null;
};

type ViewMode = "session" | "room";

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

function buildSearchText(record: ParsedExamRecord) {
  return {
    loose: normalizeText(
      [
        record.studentId,
        record.studentName,
        record.classCourse,
        record.classStudent,
        record.courseCode,
        record.courseName,
        record.room,
        record.campus,
        record.birthDate,
      ].join(" | "),
    ),
    compact: normalizeCompact(
      [
        record.studentId,
        record.classCourse,
        record.classStudent,
        record.courseCode,
        record.room,
        record.campus,
      ].join(" "),
    ),
  };
}

function sortRecordsByExcelOrder(items: ParsedExamRecord[]) {
  return items.slice().sort((a, b) => {
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
}

function getDensityBadgeClass(studentCount: number) {
  if (studentCount >= 80) {
    return "border border-red-400/20 bg-red-500/12 text-red-300";
  }
  if (studentCount >= 45) {
    return "border border-amber-400/20 bg-amber-500/12 text-amber-200";
  }
  if (studentCount >= 20) {
    return "border border-cyan-400/20 bg-cyan-500/12 text-cyan-200";
  }
  return "border border-emerald-400/20 bg-emerald-500/12 text-emerald-300";
}

function getDensityLabel(studentCount: number, isVi: boolean) {
  if (studentCount >= 80) return isVi ? "Rất đông" : "Very crowded";
  if (studentCount >= 45) return isVi ? "Đông" : "Crowded";
  if (studentCount >= 20) return isVi ? "Vừa" : "Moderate";
  return isVi ? "Ít" : "Light";
}

function groupSessionsByRoom(sessions: ExamSessionSummary[]) {
  const map = new Map<
    string,
    {
      room: string;
      campus: string | null;
      totalStudents: number;
      sessions: ExamSessionSummary[];
      firstSheetIndex: number;
      firstSessionOrder: number;
      firstRowIndex: number;
    }
  >();

  for (const session of sessions) {
    const key = `${sanitizeVisualText(session.room) || "—"}|||${sanitizeVisualText(session.campus) || ""}`;
    const room = sanitizeVisualText(session.room) || "—";
    const campus = session.campus || null;

    if (!map.has(key)) {
      map.set(key, {
        room,
        campus,
        totalStudents: 0,
        sessions: [],
        firstSheetIndex: session.sheetIndex ?? 999999,
        firstSessionOrder: session.sessionOrder ?? 999999,
        firstRowIndex: session.firstRowIndex ?? 999999,
      });
    }

    const item = map.get(key)!;
    item.totalStudents += session.studentCount;
    item.sessions.push(session);
    item.firstSheetIndex = Math.min(
      item.firstSheetIndex,
      session.sheetIndex ?? 999999,
    );
    item.firstSessionOrder = Math.min(
      item.firstSessionOrder,
      session.sessionOrder ?? 999999,
    );
    item.firstRowIndex = Math.min(
      item.firstRowIndex,
      session.firstRowIndex ?? 999999,
    );
  }

  return Array.from(map.values())
    .map((group) => ({
      ...group,
      sessions: group.sessions.slice().sort((a, b) => {
        const sa = a.sheetIndex ?? 999999;
        const sb = b.sheetIndex ?? 999999;
        if (sa !== sb) return sa - sb;

        const xa = a.sessionOrder ?? 999999;
        const xb = b.sessionOrder ?? 999999;
        if (xa !== xb) return xa - xb;

        const ra = a.firstRowIndex ?? 999999;
        const rb = b.firstRowIndex ?? 999999;
        return ra - rb;
      }),
    }))
    .sort((a, b) => {
      if (a.firstSheetIndex !== b.firstSheetIndex)
        return a.firstSheetIndex - b.firstSheetIndex;
      if (a.firstSessionOrder !== b.firstSessionOrder)
        return a.firstSessionOrder - b.firstSessionOrder;
      return a.firstRowIndex - b.firstRowIndex;
    });
}

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

function StudentTable({
  records,
  locale,
  isVi,
}: {
  records: ParsedExamRecord[];
  locale: string;
  isVi: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--border-main)]">
      <table className="min-w-[1080px] w-full text-sm">
        <thead>
          <tr className="bg-[var(--bg-soft)] text-left">
            <th className="px-4 py-3 font-semibold">STT</th>
            <th className="px-4 py-3 font-semibold">MSSV</th>
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
            <th className="px-4 py-3 font-semibold">
              {isVi ? "Phòng" : "Room"}
            </th>
            <th className="px-4 py-3 font-semibold">
              {isVi ? "Ca thi" : "Session"}
            </th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => (
            <tr
              key={record.id}
              className="border-t border-[var(--border-main)]/70"
            >
              <td className="px-4 py-3">{index + 1}</td>
              <td className="px-4 py-3">{record.studentId || "—"}</td>
              <td className="px-4 py-3">{record.studentName || "—"}</td>
              <td className="px-4 py-3">{record.classCourse || "—"}</td>
              <td className="px-4 py-3">{record.classStudent || "—"}</td>
              <td className="px-4 py-3">{record.birthDate || "—"}</td>
              <td className="px-4 py-3">
                {sanitizeVisualText(record.room) || "—"}
              </td>
              <td className="px-4 py-3">
                <div>
                  {formatDate(record.examDate, locale)} •{" "}
                  {record.startTime || "—"}
                </div>
                <div className="mt-1 text-xs app-text-muted">
                  {sanitizeVisualText(record.campus) || "—"}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ExamReportPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("vi") ? "vi-VN" : "en-US";
  const isVi = locale.startsWith("vi");

  const router = useRouter();
  const searchParams = useSearchParams();
  const notice = searchParams.get("notice") || "";

  const [records, setRecords] = useState<ParsedExamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [roomFilter, setRoomFilter] = useState("all");
  const [sessionFilter, setSessionFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("session");
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setLoading(true);
      setError(null);

      try {
        const userId = await fetchCurrentUserId();

        if (!userId) {
          if (!cancelled) {
            setError(
              isVi
                ? "Không xác định được người dùng hiện tại."
                : "Cannot resolve current user.",
            );
          }
          return;
        }

        const allRecords = await fetchExamsFromDb({ userId });
        if (cancelled) return;

        const noticeRecords = sortRecordsByExcelOrder(
          allRecords.filter((x) => x.detailUrl === notice),
        );

        setRecords(noticeRecords);

        if (!noticeRecords.length) {
          setError(
            isVi
              ? "Không tìm thấy dữ liệu cho file lịch / thông báo này."
              : "No data found for this notice.",
          );
        }
      } catch {
        if (!cancelled) {
          setError(isVi ? "Tải dữ liệu thất bại." : "Failed to load data.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (!notice) {
      setLoading(false);
      setError(
        isVi ? "Thiếu tham số hồ sơ lịch." : "Missing notice parameter.",
      );
      return;
    }

    boot();

    return () => {
      cancelled = true;
    };
  }, [isVi, notice]);

  const sessions = useMemo(() => buildSessionSummaries(records), [records]);

  const roomOptions = useMemo(
    () =>
      Array.from(
        new Set(records.map((x) => sanitizeVisualText(x.room)).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b)),
    [records],
  );

  const classOptions = useMemo(
    () =>
      Array.from(
        new Set(
          records
            .flatMap((x) => [x.classCourse || "", x.classStudent || ""])
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [records],
  );

  const sessionOptions = useMemo(
    () =>
      sessions.map((session) => ({
        id: session.id,
        label: `${session.courseCode || "?"} • ${formatDate(session.examDate, locale)} • ${session.startTime || "?"} • ${sanitizeVisualText(session.room) || "?"}`,
      })),
    [locale, sessions],
  );

  const filteredRecords = useMemo(() => {
    const qLoose = normalizeText(query);
    const qCompact = normalizeCompact(query);

    const items = records.filter((record) => {
      if (
        roomFilter !== "all" &&
        sanitizeVisualText(record.room) !== roomFilter
      )
        return false;

      if (classFilter !== "all") {
        const courseClass = record.classCourse || "";
        const studentClass = record.classStudent || "";
        if (courseClass !== classFilter && studentClass !== classFilter)
          return false;
      }

      if (sessionFilter !== "all") {
        const matched = sessions.find((s) => s.id === sessionFilter);
        if (!matched) return false;

        const sameSession =
          record.sheetIndex === matched.sheetIndex &&
          record.sessionOrder === matched.sessionOrder &&
          record.courseCode === matched.courseCode &&
          record.examDate === matched.examDate &&
          record.startTime === matched.startTime &&
          record.room === matched.room &&
          record.campus === matched.campus;

        if (!sameSession) return false;
      }

      if (!qLoose && !qCompact) return true;

      const idx = buildSearchText(record);
      return (
        idx.loose.includes(qLoose) ||
        (qCompact ? idx.compact.includes(qCompact) : false)
      );
    });

    return sortRecordsByExcelOrder(items);
  }, [classFilter, query, records, roomFilter, sessionFilter, sessions]);

  const filteredSessions = useMemo(
    () => buildSessionSummaries(filteredRecords),
    [filteredRecords],
  );
  const roomGroups = useMemo(
    () => groupSessionsByRoom(filteredSessions),
    [filteredSessions],
  );

  const stats = useMemo(() => {
    return {
      totalStudents: records.length,
      visibleStudents: filteredRecords.length,
      totalSessions: sessions.length,
      visibleSessions: filteredSessions.length,
      uniqueStudents: new Set(records.map((x) => x.studentId).filter(Boolean))
        .size,
      uniqueRooms: new Set(
        records.map((x) => sanitizeVisualText(x.room)).filter(Boolean),
      ).size,
    };
  }, [
    filteredRecords.length,
    filteredSessions.length,
    records,
    sessions.length,
  ]);

  const noticeTitle = records[0]?.noticeTitle || "";
  const attachmentName = records[0]?.attachmentName || "";
  const publishedAtRaw = records[0]?.publishedAtRaw || null;
  const detailUrl = records[0]?.detailUrl || "";
  const attachmentUrl = records[0]?.attachmentUrl || null;

  async function handleCopyStudentIds(session: ExamSessionSummary) {
    const ids = Array.from(
      new Set(session.records.map((x) => x.studentId).filter(Boolean)),
    ).join("\n");
    if (!ids) return;

    try {
      await navigator.clipboard.writeText(ids);
      setCopiedSessionId(session.id);
      window.setTimeout(() => setCopiedSessionId(null), 1600);
    } catch {
      setCopiedSessionId(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className="app-section p-4 md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <div className="text-[1.8rem] font-bold tracking-tight">
              {isVi ? "Hồ sơ lịch thi" : "Exam roster report"}
            </div>
            <div className="mt-2 text-sm app-text-muted">
              {noticeTitle ||
                (isVi
                  ? "Biểu mẫu hiển thị lại từ dữ liệu file lịch của trường."
                  : "Rebuilt from the original school workbook.")}
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {attachmentName ? (
                <span className="inline-flex rounded-full app-pill px-3 py-1 font-medium">
                  {attachmentName}
                </span>
              ) : null}
              {publishedAtRaw ? (
                <span className="inline-flex rounded-full app-pill px-3 py-1 font-medium">
                  {isVi ? "Nguồn đăng" : "Published"}: {publishedAtRaw}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="
    inline-flex items-center justify-center
    rounded-xl border px-4 py-2.5 text-sm font-bold transition
    border-slate-300
    bg-slate-900
    text-white
    shadow-[0_10px_28px_rgba(2,8,23,0.18)]
    hover:-translate-y-[1px]
    hover:bg-slate-800

    dark:border-slate-600
    dark:bg-white
    dark:text-slate-900
    dark:hover:bg-slate-100
  "
            >
              {isVi ? "Quay lại" : "Back"}
            </button>
            {detailUrl ? (
              <a
                href={detailUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-cyan-400/15 bg-cyan-400/8 px-4 py-2.5 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/14"
              >
                {isVi ? "Mở nguồn gốc" : "Open source"}
              </a>
            ) : null}

            {attachmentUrl ? (
              <a
                href={attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-emerald-400/15 bg-emerald-400/8 px-4 py-2.5 text-sm font-medium text-emerald-200 transition hover:bg-emerald-400/14"
              >
                {isVi ? "Tải file gốc" : "Download original file"}
              </a>
            ) : null}

            <Link
              href="/exams"
              className="rounded-xl bg-[var(--accent)] px-2 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(59,130,246,0.28)] transition hover:brightness-110"
            >
              {isVi ? "Về danh sách thi" : "Back to exams"}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <div className="app-panel p-4">
          <div className="text-[11px] uppercase tracking-wide app-text-muted">
            {isVi ? "Tổng dòng sinh viên" : "Total student rows"}
          </div>
          <div className="mt-2 text-2xl font-bold">{stats.totalStudents}</div>
        </div>

        <div className="app-panel p-4">
          <div className="text-[11px] uppercase tracking-wide app-text-muted">
            {isVi ? "Đang hiển thị" : "Visible rows"}
          </div>
          <div className="mt-2 text-2xl font-bold">{stats.visibleStudents}</div>
        </div>

        <div className="app-panel p-4">
          <div className="text-[11px] uppercase tracking-wide app-text-muted">
            {isVi ? "Tổng phiên thi" : "Total sessions"}
          </div>
          <div className="mt-2 text-2xl font-bold">{stats.totalSessions}</div>
        </div>

        <div className="app-panel p-4">
          <div className="text-[11px] uppercase tracking-wide app-text-muted">
            {isVi ? "Phiên đang lọc" : "Filtered sessions"}
          </div>
          <div className="mt-2 text-2xl font-bold">{stats.visibleSessions}</div>
        </div>

        <div className="app-panel p-4">
          <div className="text-[11px] uppercase tracking-wide app-text-muted">
            {isVi ? "Sinh viên duy nhất" : "Unique students"}
          </div>
          <div className="mt-2 text-2xl font-bold">{stats.uniqueStudents}</div>
        </div>

        <div className="app-panel p-4">
          <div className="text-[11px] uppercase tracking-wide app-text-muted">
            {isVi ? "Số phòng" : "Rooms"}
          </div>
          <div className="mt-2 text-2xl font-bold">{stats.uniqueRooms}</div>
        </div>
      </section>

      <section className="app-section p-4 md:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">
              {isVi ? "Bộ lọc hồ sơ lịch" : "Roster filters"}
            </div>
            <div className="text-xs app-text-muted">
              {isVi
                ? "Giữ nguyên cấu trúc Excel nhưng hiển thị gọn, rõ và dễ tra cứu hơn."
                : "Keeps the original Excel structure, but cleaner and easier to scan."}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setViewMode("session")}
              className={[
                "rounded-xl px-4 py-2.5 text-sm font-medium transition",
                viewMode === "session" ? "app-btn-primary" : "app-btn",
              ].join(" ")}
            >
              {isVi ? "Theo phiên thi" : "By session"}
            </button>

            <button
              type="button"
              onClick={() => setViewMode("room")}
              className={[
                "rounded-xl px-4 py-2.5 text-sm font-medium transition",
                viewMode === "room" ? "app-btn-primary" : "app-btn",
              ].join(" ")}
            >
              {isVi ? "Theo phòng thi" : "By room"}
            </button>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1.7fr_1fr_1fr_1.2fr]">
          <label htmlFor="exam-report-search" className="sr-only">
            {isVi ? "Tìm kiếm hồ sơ lịch thi" : "Search exam roster"}
          </label>
          <input
            id="exam-report-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="app-input h-12 text-sm leading-none"
            placeholder={
              isVi
                ? "Tìm MSSV, họ tên, lớp, môn, phòng..."
                : "Search by student ID, name, class, course, room..."
            }
          />

          <select
            id="exam-report-room-filter"
            aria-label={isVi ? "Lọc theo phòng" : "Filter by room"}
            title={isVi ? "Lọc theo phòng" : "Filter by room"}
            className="app-input h-12 text-sm leading-none"
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
          >
            <option value="all">{isVi ? "Tất cả phòng" : "All rooms"}</option>
            {roomOptions.map((room) => (
              <option key={room} value={room}>
                {room}
              </option>
            ))}
          </select>

          <select
            id="exam-report-class-filter"
            aria-label={isVi ? "Lọc theo lớp" : "Filter by class"}
            title={isVi ? "Lọc theo lớp" : "Filter by class"}
            className="app-input h-12 text-sm leading-none"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="all">{isVi ? "Tất cả lớp" : "All classes"}</option>
            {classOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            id="exam-report-session-filter"
            aria-label={isVi ? "Lọc theo phiên thi" : "Filter by session"}
            title={isVi ? "Lọc theo phiên thi" : "Filter by session"}
            className="app-input h-12 text-sm leading-none"
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
          >
            <option value="all">
              {isVi ? "Tất cả phiên thi" : "All sessions"}
            </option>
            {sessionOptions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="space-y-5">
        {loading ? (
          <div className="rounded-xl app-soft p-4 text-sm app-text-muted">
            {t("common.loading")}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">
            {error}
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="rounded-xl app-soft p-4 text-sm app-text-muted">
            {isVi ? "Không có dữ liệu phù hợp." : "No matching data."}
          </div>
        ) : viewMode === "session" ? (
          filteredSessions.map((session) => (
            <section
              key={session.id}
              className="app-section overflow-hidden p-0"
            >
              <div className="border-b border-[var(--border-main)] px-4 py-4 md:px-5">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="text-xl font-bold">
                      {session.courseCode || "—"}
                    </div>
                    <div className="mt-1 text-sm app-text-muted">
                      {session.courseName || "—"}
                    </div>
                    <div className="mt-2 text-sm">
                      {formatDate(session.examDate, locale)} •{" "}
                      {session.startTime || "—"} •{" "}
                      {sanitizeVisualText(session.room) || "—"}
                      {session.campus
                        ? ` • ${sanitizeVisualText(session.campus)}`
                        : ""}
                    </div>
                    <div className="mt-2 text-xs app-text-muted">
                      {sanitizeExamMeta(session.examMetaRaw) || "—"}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <span
                      className={[
                        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                        getStatusTone(session.examDate),
                      ].join(" ")}
                    >
                      {getCountdownLabel(session.examDate, t)}
                    </span>

                    <span
                      className={[
                        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                        getDensityBadgeClass(session.studentCount),
                      ].join(" ")}
                    >
                      {getDensityLabel(session.studentCount, isVi)}
                    </span>

                    <span className="inline-flex rounded-full app-pill px-3 py-1 text-xs font-medium">
                      {isVi
                        ? `${session.studentCount} sinh viên`
                        : `${session.studentCount} students`}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopyStudentIds(session)}
                      className="rounded-xl border border-violet-400/15 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-200 transition hover:bg-violet-500/16"
                    >
                      {copiedSessionId === session.id
                        ? isVi
                          ? "Đã copy MSSV"
                          : "Student IDs copied"
                        : isVi
                          ? "Copy danh sách MSSV"
                          : "Copy student IDs"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-5">
                <StudentTable
                  records={session.records}
                  locale={locale}
                  isVi={isVi}
                />
              </div>
            </section>
          ))
        ) : (
          roomGroups.map((group) => (
            <section
              key={`${group.room}-${group.campus || ""}`}
              className="app-section p-4 md:p-5"
            >
              <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="text-xl font-bold">{group.room}</div>
                  <div className="mt-1 text-sm app-text-muted">
                    {group.campus ? sanitizeVisualText(group.campus) : "—"}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={[
                      "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                      getDensityBadgeClass(group.totalStudents),
                    ].join(" ")}
                  >
                    {getDensityLabel(group.totalStudents, isVi)}
                  </span>

                  <span className="inline-flex rounded-full app-pill px-3 py-1 text-xs font-medium">
                    {isVi
                      ? `${group.totalStudents} sinh viên`
                      : `${group.totalStudents} students`}
                  </span>

                  <span className="inline-flex rounded-full app-pill px-3 py-1 text-xs font-medium">
                    {isVi
                      ? `${group.sessions.length} phiên thi`
                      : `${group.sessions.length} sessions`}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {group.sessions.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-card-strong)] p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">
                          {session.courseCode || "—"}
                          <span className="font-normal app-text-muted">
                            {session.courseName
                              ? ` • ${session.courseName}`
                              : ""}
                          </span>
                        </div>
                        <div className="mt-1 text-sm app-text-muted">
                          {formatDate(session.examDate, locale)} •{" "}
                          {session.startTime || "—"} •{" "}
                          {sanitizeVisualText(session.room) || "—"}
                        </div>
                      </div>

                      <span className="inline-flex rounded-full app-pill px-3 py-1 text-xs font-medium">
                        {isVi
                          ? `${session.studentCount} sinh viên`
                          : `${session.studentCount} students`}
                      </span>
                    </div>

                    <StudentTable
                      records={session.records}
                      locale={locale}
                      isVi={isVi}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </section>

      <div className="text-xs app-text-muted">
        {isVi
          ? `Cập nhật giao diện lúc: ${formatDateTime(new Date().toISOString(), locale)}`
          : `Rendered at: ${formatDateTime(new Date().toISOString(), locale)}`}
      </div>
    </div>
  );
}
