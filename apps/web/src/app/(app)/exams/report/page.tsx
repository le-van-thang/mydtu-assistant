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
      ].join(" | ")
    ),
    compact: normalizeCompact(
      [
        record.studentId,
        record.classCourse,
        record.classStudent,
        record.courseCode,
        record.room,
        record.campus,
      ].join(" ")
    ),
  };
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

function groupRecordsByRoom(records: ParsedExamRecord[]) {
  const map = new Map<
    string,
    {
      room: string;
      campus: string | null;
      totalStudents: number;
      sessions: ExamSessionSummary[];
      records: ParsedExamRecord[];
    }
  >();

  const sessions = buildSessionSummaries(records);

  for (const session of sessions) {
    const roomKey = sanitizeVisualText(session.room) || "unknown-room";
    const existing = map.get(roomKey);

    if (existing) {
      existing.totalStudents += session.studentCount;
      existing.sessions.push(session);
      existing.records.push(...session.records);
    } else {
      map.set(roomKey, {
        room: sanitizeVisualText(session.room) || "—",
        campus: session.campus || null,
        totalStudents: session.studentCount,
        sessions: [session],
        records: [...session.records],
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.room === "—") return 1;
    if (b.room === "—") return -1;
    return a.room.localeCompare(b.room);
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
                : "Cannot resolve current user."
            );
          }
          return;
        }

        const allRecords = await fetchExamsFromDb({ userId });
        if (cancelled) return;

        const noticeRecords = allRecords.filter((x) => x.detailUrl === notice);
        setRecords(noticeRecords);

        if (!noticeRecords.length) {
          setError(
            isVi
              ? "Không tìm thấy dữ liệu cho file lịch / thông báo này."
              : "No data found for this notice."
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
      setError(isVi ? "Thiếu tham số hồ sơ lịch." : "Missing notice parameter.");
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
      Array.from(new Set(records.map((x) => sanitizeVisualText(x.room)).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b)
      ),
    [records]
  );

  const classOptions = useMemo(
    () =>
      Array.from(
        new Set(
          records.flatMap((x) => [x.classCourse || "", x.classStudent || ""]).filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [records]
  );

  const sessionOptions = useMemo(
    () =>
      sessions.map((session) => ({
        id: session.id,
        label: `${session.courseCode || "?"} • ${formatDate(session.examDate, locale)} • ${
          session.startTime || "?"
        } • ${sanitizeVisualText(session.room) || "?"}`,
      })),
    [locale, sessions]
  );

  const filteredRecords = useMemo(() => {
    const qLoose = normalizeText(query);
    const qCompact = normalizeCompact(query);

    return records.filter((record) => {
      if (roomFilter !== "all" && sanitizeVisualText(record.room) !== roomFilter) return false;

      if (classFilter !== "all") {
        const courseClass = record.classCourse || "";
        const studentClass = record.classStudent || "";
        if (courseClass !== classFilter && studentClass !== classFilter) return false;
      }

      if (sessionFilter !== "all") {
        const matched = sessions.find((s) => s.id === sessionFilter);
        if (!matched) return false;
        if (
          record.courseCode !== matched.courseCode ||
          record.examDate !== matched.examDate ||
          record.startTime !== matched.startTime ||
          record.room !== matched.room ||
          record.campus !== matched.campus
        ) {
          return false;
        }
      }

      if (!qLoose && !qCompact) return true;

      const idx = buildSearchText(record);
      return idx.loose.includes(qLoose) || (qCompact ? idx.compact.includes(qCompact) : false);
    });
  }, [classFilter, query, records, roomFilter, sessionFilter, sessions]);

  const filteredSessions = useMemo(() => buildSessionSummaries(filteredRecords), [filteredRecords]);

  const roomGroups = useMemo(() => groupRecordsByRoom(filteredRecords), [filteredRecords]);

  const stats = useMemo(() => {
    return {
      totalStudents: records.length,
      visibleStudents: filteredRecords.length,
      totalSessions: sessions.length,
      visibleSessions: filteredSessions.length,
      uniqueStudents: new Set(records.map((x) => x.studentId).filter(Boolean)).size,
      uniqueRooms: new Set(records.map((x) => sanitizeVisualText(x.room)).filter(Boolean)).size,
    };
  }, [filteredRecords.length, filteredSessions.length, records, sessions.length]);

  const noticeTitle = records[0]?.noticeTitle || "";
  const attachmentName = records[0]?.attachmentName || "";
  const publishedAtRaw = records[0]?.publishedAtRaw || null;
  const detailUrl = records[0]?.detailUrl || "";
  const attachmentUrl = records[0]?.attachmentUrl || null;

  async function handleCopyStudentIds(session: ExamSessionSummary) {
    const ids = Array.from(
      new Set(session.records.map((x) => x.studentId).filter(Boolean))
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
              className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              {isVi ? "Quay lại" : "Back"}
            </button>

            {detailUrl ? (
              <a
                href={detailUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-cyan-400/15 bg-cyan-400/8 px-3.5 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/14"
              >
                {isVi ? "Mở nguồn gốc" : "Open source"}
              </a>
            ) : null}

            {attachmentUrl ? (
              <a
                href={attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-emerald-400/15 bg-emerald-400/8 px-3.5 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-400/14"
              >
                {isVi ? "Tải file gốc" : "Download original file"}
              </a>
            ) : null}

            <Link
              href="/exams"
              className="rounded-xl bg-[var(--accent)] px-3.5 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(59,130,246,0.28)] transition hover:brightness-110"
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
                ? "Tối giản hơn, gọn hơn, dễ tìm MSSV / họ tên / lớp / phòng."
                : "Compact controls for searching by student, class, room, or session."}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setViewMode("session")}
              className={[
                "rounded-xl px-3 py-2 text-sm font-medium transition",
                viewMode === "session" ? "app-btn-primary" : "app-btn",
              ].join(" ")}
            >
              {isVi ? "Theo phiên thi" : "By session"}
            </button>

            <button
              type="button"
              onClick={() => setViewMode("room")}
              className={[
                "rounded-xl px-3 py-2 text-sm font-medium transition",
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
            className="app-input h-11 text-sm"
            placeholder={
              isVi
                ? "Tìm MSSV, họ tên, lớp, môn, phòng..."
                : "Search by student ID, name, class, course, room..."
            }
          />

          <label htmlFor="exam-report-room-filter" className="sr-only">
            {isVi ? "Lọc theo phòng" : "Filter by room"}
          </label>
          <select
            id="exam-report-room-filter"
            aria-label={isVi ? "Lọc theo phòng" : "Filter by room"}
            title={isVi ? "Lọc theo phòng" : "Filter by room"}
            className="app-input h-11 text-sm"
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

          <label htmlFor="exam-report-class-filter" className="sr-only">
            {isVi ? "Lọc theo lớp" : "Filter by class"}
          </label>
          <select
            id="exam-report-class-filter"
            aria-label={isVi ? "Lọc theo lớp" : "Filter by class"}
            title={isVi ? "Lọc theo lớp" : "Filter by class"}
            className="app-input h-11 text-sm"
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

          <label htmlFor="exam-report-session-filter" className="sr-only">
            {isVi ? "Lọc theo phiên thi" : "Filter by session"}
          </label>
          <select
            id="exam-report-session-filter"
            aria-label={isVi ? "Lọc theo phiên thi" : "Filter by session"}
            title={isVi ? "Lọc theo phiên thi" : "Filter by session"}
            className="app-input h-11 text-sm"
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
          >
            <option value="all">{isVi ? "Tất cả phiên thi" : "All sessions"}</option>
            {sessionOptions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="app-section p-4 md:p-5">
          <div className="mb-3">
            <div className="text-base font-semibold">
              {viewMode === "session"
                ? isVi
                  ? "Cụm phiên thi trong file này"
                  : "Sessions in this notice"
                : isVi
                  ? "Tổng hợp theo phòng thi"
                  : "Grouped by room"}
            </div>
            <div className="text-xs app-text-muted">
              {viewMode === "session"
                ? isVi
                  ? "Tất cả ca thi lấy từ cùng một file lịch của trường."
                  : "All sessions rebuilt from the same original workbook."
                : isVi
                  ? "Dữ liệu được gom theo từng phòng để kiểm tra phân bố."
                  : "Data is grouped by room for allocation review."}
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="rounded-xl app-soft p-4 text-sm app-text-muted">
                {t("common.loading")}
              </div>
            ) : error ? (
              <div className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">
                {error}
              </div>
            ) : viewMode === "session" ? (
              filteredSessions.length === 0 ? (
                <div className="rounded-xl app-soft p-4 text-sm app-text-muted">
                  {isVi ? "Không có phiên thi phù hợp." : "No matching sessions."}
                </div>
              ) : (
                filteredSessions.map((session: ExamSessionSummary) => (
                  <div
                    key={session.id}
                    className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-card-strong)] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold">
                          {session.courseCode || "—"}
                          <span className="font-normal app-text-muted">
                            {session.courseName ? ` • ${session.courseName}` : ""}
                          </span>
                        </div>
                        <div className="mt-1 text-sm app-text-muted">
                          {formatDate(session.examDate, locale)} • {session.startTime || "—"} •{" "}
                          {sanitizeVisualText(session.room) || "—"}
                          {session.campus ? ` • ${sanitizeVisualText(session.campus)}` : ""}
                        </div>
                        <div className="mt-2 text-xs app-text-muted">
                          {sanitizeExamMeta(session.examMetaRaw) || "—"}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
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
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="inline-flex rounded-full app-pill px-3 py-1 font-medium">
                        {isVi
                          ? `${session.studentCount} sinh viên`
                          : `${session.studentCount} students`}
                      </span>
                      <span className="inline-flex rounded-full app-pill px-3 py-1 font-medium">
                        {isVi
                          ? `${session.classCourseCount} lớp môn học`
                          : `${session.classCourseCount} course classes`}
                      </span>
                      <span className="inline-flex rounded-full app-pill px-3 py-1 font-medium">
                        {isVi
                          ? `${session.classStudentCount} lớp sinh hoạt`
                          : `${session.classStudentCount} student classes`}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
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
                ))
              )
            ) : roomGroups.length === 0 ? (
              <div className="rounded-xl app-soft p-4 text-sm app-text-muted">
                {isVi ? "Không có phòng thi phù hợp." : "No matching rooms."}
              </div>
            ) : (
              roomGroups.map((group) => (
                <div
                  key={group.room}
                  className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-card-strong)] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{group.room}</div>
                      <div className="mt-1 text-sm app-text-muted">
                        {group.campus ? sanitizeVisualText(group.campus) : "—"}
                      </div>
                    </div>

                    <span
                      className={[
                        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                        getDensityBadgeClass(group.totalStudents),
                      ].join(" ")}
                    >
                      {getDensityLabel(group.totalStudents, isVi)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex rounded-full app-pill px-3 py-1 font-medium">
                      {isVi
                        ? `${group.totalStudents} sinh viên`
                        : `${group.totalStudents} students`}
                    </span>
                    <span className="inline-flex rounded-full app-pill px-3 py-1 font-medium">
                      {isVi
                        ? `${group.sessions.length} phiên thi`
                        : `${group.sessions.length} sessions`}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {group.sessions.map((session) => (
                      <div
                        key={session.id}
                        className="rounded-xl border border-[var(--border-main)]/70 bg-[var(--bg-soft)] px-3 py-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-medium">
                            {session.courseCode || "—"}
                            {session.courseName ? ` • ${session.courseName}` : ""}
                          </div>
                          <div className="text-xs app-text-muted">
                            {formatDate(session.examDate, locale)} • {session.startTime || "—"} •{" "}
                            {isVi
                              ? `${session.studentCount} sinh viên`
                              : `${session.studentCount} students`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="app-section p-4 md:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-base font-semibold">
                {isVi ? "Danh sách sinh viên" : "Student roster"}
              </div>
              <div className="text-xs app-text-muted">
                {isVi
                  ? "Form này thay cho Excel thô, nhìn gọn và dễ tra cứu hơn."
                  : "This replaces the raw spreadsheet with a cleaner in-app roster."}
              </div>
            </div>

            <div className="inline-flex rounded-full border border-[var(--border-main)] bg-[var(--bg-soft)] px-3 py-1 text-xs font-medium app-text-muted">
              {isVi
                ? `${filteredRecords.length} dòng hiển thị`
                : `${filteredRecords.length} visible rows`}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[var(--border-main)]">
            <table className="min-w-[980px] w-full text-sm">
              <thead>
                <tr className="bg-[var(--bg-soft)] text-left">
                  <th className="px-4 py-3 font-semibold">MSSV</th>
                  <th className="px-4 py-3 font-semibold">{isVi ? "Họ tên" : "Name"}</th>
                  <th className="px-4 py-3 font-semibold">
                    {isVi ? "Lớp môn học" : "Course class"}
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    {isVi ? "Lớp sinh hoạt" : "Student class"}
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    {isVi ? "Ngày sinh" : "Birth date"}
                  </th>
                  <th className="px-4 py-3 font-semibold">{isVi ? "Ca thi" : "Session"}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center app-text-muted">
                      {t("common.loading")}
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-[var(--danger)]">
                      {error}
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center app-text-muted">
                      {isVi ? "Không có dữ liệu phù hợp." : "No matching data."}
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.id} className="border-t border-[var(--border-main)]/70">
                      <td className="px-4 py-3">{record.studentId || "—"}</td>
                      <td className="px-4 py-3">{record.studentName || "—"}</td>
                      <td className="px-4 py-3">{record.classCourse || "—"}</td>
                      <td className="px-4 py-3">{record.classStudent || "—"}</td>
                      <td className="px-4 py-3">{record.birthDate || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          {formatDate(record.examDate, locale)} • {record.startTime || "—"}
                        </div>
                        <div className="mt-1 text-xs app-text-muted">
                          {sanitizeVisualText(record.room) || "—"}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-xs app-text-muted">
            {isVi
              ? `Cập nhật giao diện lúc: ${formatDateTime(new Date().toISOString(), locale)}`
              : `Rendered at: ${formatDateTime(new Date().toISOString(), locale)}`}
          </div>
        </div>
      </section>
    </div>
  );
}