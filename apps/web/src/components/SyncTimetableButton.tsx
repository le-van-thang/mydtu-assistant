"use client";

import { requestSyncFromExtension } from "@/lib/extensionBridge";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type RawTimetableItem = {
  semester?: string | null;
  courseCode?: string | null;
  courseName?: string | null;
  dayOfWeek?: number | string | null;
  startTime?: string | null;
  endTime?: string | null;
  room?: string | null;
  campus?: string | null;
  weeksIncluded?: string | null;
  weeksCanceled?: string | null;
};

type RawExtensionPayload = {
  adapterKey?: string;
  adapterVersion?: string;
  semester?: string;
  sourcePage?: string;
  items?: RawTimetableItem[];
  meta?: {
    totalWeeks?: number;
    totalItems?: number;
  };
};

type ImportBody = {
  adapterKey: string;
  adapterVersion: string;
  semester: string;
  sourcePage: string;
  items: Array<{
    semester: string;
    courseCode: string;
    courseName: string | null;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room: string;
    campus: string | null;
    weeksIncluded: string;
    weeksCanceled: string;
  }>;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toDayOfWeek(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const n = Math.trunc(value);
    return n >= 1 && n <= 7 ? n : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const n = Number(trimmed);
    if (Number.isFinite(n)) {
      const intVal = Math.trunc(n);
      return intVal >= 1 && intVal <= 7 ? intVal : null;
    }
  }

  return null;
}

function buildImportBody(
  rawPayload: unknown,
  t: (key: string, options?: Record<string, unknown>) => string,
): ImportBody {
  if (!isObject(rawPayload)) {
    throw new Error(t("timetable.sync.invalidPayload"));
  }

  const payload = rawPayload as RawExtensionPayload;

  const adapterKey =
    toNonEmptyString(payload.adapterKey) || "mydtu_timetable_v1";
  const adapterVersion = toNonEmptyString(payload.adapterVersion) || "1.4.0";
  const semester = toNonEmptyString(payload.semester) || "MYDTU_TIMETABLE";
  const sourcePage =
    toNonEmptyString(payload.sourcePage) ||
    "https://mydtu.duytan.edu.vn/sites/index.aspx?p=home_timetable&functionid=13";

  const rawItems = Array.isArray(payload.items) ? payload.items : [];

  if (rawItems.length === 0) {
    throw new Error(t("timetable.sync.emptyItems"));
  }

  const items = rawItems.map((item, index) => {
    const row = index + 1;
    const courseCode = toNonEmptyString(item.courseCode);
    const dayOfWeek = toDayOfWeek(item.dayOfWeek);
    const startTime = toNonEmptyString(item.startTime);
    const endTime = toNonEmptyString(item.endTime);
    const room = toNonEmptyString(item.room);

    if (!courseCode) {
      throw new Error(t("timetable.sync.missingCourseCode", { row }));
    }

    if (!dayOfWeek) {
      throw new Error(t("timetable.sync.missingDayOfWeek", { row }));
    }

    if (!startTime) {
      throw new Error(t("timetable.sync.missingStartTime", { row }));
    }

    if (!endTime) {
      throw new Error(t("timetable.sync.missingEndTime", { row }));
    }

    if (!room) {
      throw new Error(t("timetable.sync.missingRoom", { row }));
    }

    return {
      semester: toNonEmptyString(item.semester) || semester,
      courseCode,
      courseName: toNonEmptyString(item.courseName),
      dayOfWeek,
      startTime,
      endTime,
      room,
      campus: toNonEmptyString(item.campus),
      weeksIncluded: toNonEmptyString(item.weeksIncluded) ?? "",
      weeksCanceled: toNonEmptyString(item.weeksCanceled) ?? "",
    };
  });

  return {
    adapterKey,
    adapterVersion,
    semester,
    sourcePage,
    items,
  };
}

function buildSuccessMessage(
  language: string,
  totalItems: number,
  totalWeeks: number,
) {
  if (language === "en") {
    return `Synced successfully ${totalItems} classes across ${totalWeeks} weeks.`;
  }
  return `Đã đồng bộ thành công ${totalItems} buổi học trong ${totalWeeks} tuần.`;
}

export default function SyncTimetableButton() {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [tone, setTone] = useState<"info" | "success" | "error">("info");

  async function onSync() {
    setLoading(true);
    setMsg(t("timetable.sync.scanning"));
    setTone("info");

    try {
      const res = await requestSyncFromExtension("timetable", t);

      if (!res.ok) {
        setTone("error");
        setMsg(res.error || t("timetable.sync.extensionFailed"));
        return;
      }

      const importBody = buildImportBody(res.payload, t);

      const upstream = await fetch("/api/sync/timetable", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(importBody),
        cache: "no-store",
        credentials: "include",
      });

      const json = await upstream.json().catch(() => null);

      if (!upstream.ok) {
        setTone("error");
        setMsg(
          json?.message ||
            json?.error ||
            t("timetable.sync.importFailedWithStatus", {
              status: upstream.status,
            }),
        );
        return;
      }

      const totalWeeks = Number((res.payload as any)?.meta?.totalWeeks || 0);
      const totalItems = Number(
        (res.payload as any)?.meta?.totalItems || importBody.items.length,
      );

      setTone("success");
      setMsg(buildSuccessMessage(i18n.language, totalItems, totalWeeks));

      window.dispatchEvent(new CustomEvent("mydtu:timetable-updated"));
    } catch (e) {
      setTone("error");
      setMsg(String((e as Error)?.message || e));
    } finally {
      setLoading(false);
    }
  }

  const messageStyle =
    tone === "success"
      ? {
          background: "#dcfce7",
          color: "#166534",
          border: "1px solid #86efac",
          fontWeight: 700,
        }
      : tone === "error"
        ? {
            background: "#fee2e2",
            color: "#b91c1c",
            border: "1px solid #fca5a5",
            fontWeight: 700,
          }
        : {
            background: "#dbeafe",
            color: "#1d4ed8",
            border: "1px solid #93c5fd",
            fontWeight: 700,
          };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={onSync}
        disabled={loading}
        className="app-btn-primary rounded-2xl px-4 py-2 text-sm font-semibold disabled:opacity-60"
      >
        {loading
          ? t("timetable.sync.syncing")
          : t("timetable.actions.syncExtension")}
      </button>

      {msg ? (
        <div className="rounded-xl px-3 py-2 text-sm" style={messageStyle}>
          {msg}
        </div>
      ) : null}
    </div>
  );
}
