// path: apps/web/src/lib/exams/notify.ts

import type { ParsedExamRecord } from "./parseWorkbook";

function toReadableDate(value: string | null, locale = "vi-VN") {
  if (!value) return locale.startsWith("vi") ? "chưa rõ ngày" : "unknown date";

  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleDateString(locale);
}

export async function ensureNotificationPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  if (window.Notification.permission === "granted") return "granted";
  if (window.Notification.permission === "denied") return "denied";

  return await window.Notification.requestPermission();
}

export function notifyNewExams(records: ParsedExamRecord[], locale = "vi-VN") {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (window.Notification.permission !== "granted") return;
  if (!records.length) return;

  const sample = records[0];
  const isVi = locale.startsWith("vi");

  const title =
    records.length === 1
      ? isVi
        ? `Lịch thi mới: ${sample.courseCode || "Môn học"}`
        : `New exam: ${sample.courseCode || "Course"}`
      : isVi
      ? `Có ${records.length} lịch thi mới`
      : `${records.length} new exam records`;

  const body =
    records.length === 1
      ? `${sample.courseName || sample.noticeTitle} • ${toReadableDate(
          sample.examDate,
          locale
        )} • ${sample.startTime || (isVi ? "chưa rõ giờ" : "unknown time")}`
      : `${records
          .slice(0, 3)
          .map((r) => r.courseCode || r.courseName || (isVi ? "Môn học" : "Course"))
          .join(", ")}${records.length > 3 ? "..." : ""}`;

  try {
    const notification = new window.Notification(title, {
      body,
      tag: "mydtu-exams-new",
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    // ignore
  }
}