"use client";

import { requestTranscriptDetailSync } from "@/lib/extensionBridge";
import { fetchTranscript } from "@/lib/transcript/api";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type Tone = "info" | "success" | "error";

function normalizeSpace(value: unknown) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLower(value: unknown) {
  return normalizeSpace(value).toLowerCase();
}

function parseAcademicYearStart(label: string) {
  const m = normalizeSpace(label).match(/(\d{4})\s*-\s*(\d{4})/);
  return m ? Number(m[1]) : -1;
}

function termOrder(label: string) {
  const v = normalizeLower(label);

  if (
    v.includes("học kỳ i") ||
    v.includes("hoc ky i") ||
    v.includes("học kỳ 1") ||
    v.includes("hoc ky 1")
  ) {
    return 1;
  }

  if (
    v.includes("học kỳ ii") ||
    v.includes("hoc ky ii") ||
    v.includes("học kỳ 2") ||
    v.includes("hoc ky 2")
  ) {
    return 2;
  }

  if (v.includes("hè") || v.includes("he")) {
    return 3;
  }

  return 99;
}

function sortSemesters(list: string[]) {
  return [...list].sort((a, b) => {
    const ay = parseAcademicYearStart(a);
    const by = parseAcademicYearStart(b);

    if (ay !== by) return by - ay;
    return termOrder(a) - termOrder(b);
  });
}

export default function SyncTranscriptDetailButton() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [tone, setTone] = useState<Tone>("info");

  async function onSync() {
    setLoading(true);
    setTone("info");
    setMsg(
      t(
        "transcriptDetail.sync.preparing",
        "Đang chuẩn bị danh sách học kỳ cần quét từ bảng điểm tổng quát...",
      ),
    );

    try {
      const transcript = await fetchTranscript();

      const targetSemesters = sortSemesters(
        Array.from(
          new Set(
            (transcript.items || [])
              .map((item) => normalizeSpace(item.semester))
              .filter(Boolean),
          ),
        ),
      );

      if (!targetSemesters.length) {
        setTone("error");
        setMsg(
          t(
            "transcriptDetail.sync.noTranscript",
            "Chưa có dữ liệu bảng điểm tổng quát. Hãy sync bảng điểm tổng quát trước rồi mới sync bảng điểm chi tiết.",
          ),
        );
        return;
      }

      let totalInserted = 0;
      let totalSkipped = 0;
      let totalItems = 0;
      let totalClasses = 0;
      let successSemesters = 0;
      let failedSemesters = 0;
      const failedDetails: string[] = [];

      for (let i = 0; i < targetSemesters.length; i += 1) {
        const semester = targetSemesters[i];

        setTone("info");
        setMsg(
          t(
            "transcriptDetail.sync.progress",
            "Đang sync học kỳ {{index}}/{{total}}: {{semester}}",
            {
              index: i + 1,
              total: targetSemesters.length,
              semester,
            },
          ),
        );

        try {
          const res = await requestTranscriptDetailSync({
            targetSemesters: [semester],
          });

          if (!res.ok || !res.payload) {
            failedSemesters += 1;
            failedDetails.push(
              `${semester}: ${res.error || "Extension failed"}`,
            );
            continue;
          }

          const upstream = await fetch("/api/sync/transcript-detail", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(res.payload),
            credentials: "include",
            cache: "no-store",
          });

          const json = await upstream.json().catch(() => null);

          if (!upstream.ok || !json?.ok) {
            failedSemesters += 1;
            failedDetails.push(
              `${semester}: ${json?.message || json?.error || "Save failed"}`,
            );
            continue;
          }

          successSemesters += 1;
          totalInserted += Number(json?.counts?.inserted || 0);
          totalSkipped += Number(json?.counts?.skipped || 0);
          totalItems += Number((res.payload as any)?.meta?.totalItems || 0);
          totalClasses += Number((res.payload as any)?.meta?.totalClasses || 0);
        } catch (error) {
          failedSemesters += 1;
          failedDetails.push(
            `${semester}: ${String((error as Error)?.message || error)}`,
          );
        }
      }

      if (successSemesters > 0) {
        setTone("success");
        setMsg(
          t(
            "transcriptDetail.sync.done",
            "Hoàn tất. Sync thành công {{successSemesters}}/{{totalSemesters}} học kỳ, lưu {{inserted}} dòng thành phần, bỏ qua {{skipped}} dòng không match transcript.",
            {
              successSemesters,
              totalSemesters: targetSemesters.length,
              inserted: totalInserted,
              skipped: totalSkipped,
            },
          ) +
            (failedSemesters > 0
              ? ` ${t(
                  "transcriptDetail.sync.partialFailure",
                  "Có {{failedSemesters}} học kỳ lỗi.",
                  { failedSemesters },
                )}`
              : ""),
        );

        window.dispatchEvent(
          new CustomEvent("mydtu:transcript-detail-updated"),
        );
        return;
      }

      setTone("error");
      setMsg(
        failedDetails[0] ||
          t(
            "transcriptDetail.sync.failedAll",
            "Tất cả học kỳ đều sync thất bại.",
          ),
      );
    } catch (e) {
      setTone("error");
      setMsg(String((e as Error)?.message || e));
    } finally {
      setLoading(false);
    }
  }

  const messageClass =
    tone === "success"
      ? "border border-emerald-400/50 bg-emerald-500/14 text-emerald-700 dark:text-emerald-300"
      : tone === "error"
        ? "border border-red-400/50 bg-red-500/14 text-red-700 dark:text-red-200"
        : "border border-sky-400/50 bg-sky-500/14 text-sky-700 dark:text-sky-200";

  const buttonClass = loading
    ? "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-[0_14px_34px_rgba(37,99,235,0.30)] transition bg-gradient-to-r from-sky-500 to-blue-600 disabled:cursor-not-allowed disabled:opacity-90"
    : "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-[0_14px_34px_rgba(37,99,235,0.30)] transition bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-110";

  return (
    <div className="flex w-full flex-col items-end gap-2">
      <button
        type="button"
        onClick={onSync}
        disabled={loading}
        className={buttonClass}
      >
        {loading
          ? t("transcriptDetail.sync.loading", "Đang đồng bộ...")
          : t("transcriptDetail.sync.button", "Sync bảng điểm chi tiết")}
      </button>

      {msg ? (
        <div
          className={`rounded-2xl px-4 py-3 text-sm font-extrabold leading-7 shadow-sm ${messageClass}`}
        >
          {msg}
        </div>
      ) : null}
    </div>
  );
}
