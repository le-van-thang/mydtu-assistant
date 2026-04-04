// path: apps/web/src/app/(app)/transcript/TranscriptDetailExtensionConnect.tsx
"use client";

import { openTranscriptDetailPageInExtension } from "@/lib/extensionBridge";
import React from "react";
import { useTranslation } from "react-i18next";

type ConnectStatus = "idle" | "opening" | "ready" | "error";

export default function TranscriptDetailExtensionConnect() {
  const { t } = useTranslation();
  const [status, setStatus] = React.useState<ConnectStatus>("idle");
  const [message, setMessage] = React.useState("");

  async function handleOpen() {
    setStatus("opening");
    setMessage(
      t(
        "transcriptDetail.extension.connectingMessage",
        "Đang mở trang bảng điểm chi tiết MYDTU. Nếu cần thì đăng nhập trên đó, sau đó quay lại đây để đồng bộ.",
      ),
    );

    try {
      const res = await openTranscriptDetailPageInExtension();

      if (!res.ok) {
        throw new Error(
          res.error ||
            t(
              "transcriptDetail.extension.openFailed",
              "Không thể mở trang bảng điểm chi tiết MYDTU.",
            ),
        );
      }

      setStatus("ready");
      setMessage(
        t(
          "transcriptDetail.extension.opened",
          "MYDTU đã sẵn sàng. Hãy giữ tab đã mở, đảm bảo bộ lọc học kỳ và bảng hiển thị đúng, sau đó bấm Sync bảng điểm chi tiết ở đây.",
        ),
      );

      // Notify other components that extension is ready
      window.dispatchEvent(new CustomEvent("mydtu:extension-ready"));
    } catch (error) {
      setStatus("error");
      setMessage(
        String(
          (error as Error)?.message ||
            t(
              "transcriptDetail.extension.errorMessage",
              "Kết nối MYDTU thất bại.",
            ),
        ),
      );
    }
  }

  // Badge dùng class Tailwind để hỗ trợ tốt cả light và dark mode
  const badgeClass =
    status === "ready"
      ? "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40"
      : status === "opening"
        ? "bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/40"
        : status === "error"
          ? "bg-red-100 text-red-800 border border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40"
          : "bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30";

  const label =
    status === "ready"
      ? t("transcriptDetail.extension.ready", "Sẵn sàng đồng bộ")
      : status === "opening"
        ? t("transcriptDetail.extension.opening", "Đang kết nối")
        : status === "error"
          ? t("transcriptDetail.extension.error", "Kết nối lỗi")
          : t("transcriptDetail.extension.idle", "Chưa kết nối");

  const messageClass =
    status === "ready"
      ? "border border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-500/12 dark:text-emerald-300"
      : status === "opening"
        ? "border border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-400/40 dark:bg-sky-500/12 dark:text-sky-200"
        : status === "error"
          ? "border border-red-300 bg-red-50 text-red-900 dark:border-red-400/40 dark:bg-red-500/12 dark:text-red-200"
          : "border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-300/40 dark:bg-slate-500/8 dark:text-slate-200";

  return (
    <div className="app-card rounded-3xl p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-sm font-bold">
            {t(
              "transcriptDetail.extension.title",
              "Kết nối trang nguồn MYDTU",
            )}
          </div>
          <div className="mt-1 text-sm app-text-muted">
            {t(
              "transcriptDetail.extension.helperPrimary",
              "Dùng bước này trước nếu nút sync cũ bị treo hoặc hay lỗi.",
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleOpen}
            disabled={status === "opening"}
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-3 text-sm font-bold text-white shadow-[0_14px_34px_rgba(37,99,235,0.30)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-95"
          >
            {status === "opening"
              ? t(
                  "transcriptDetail.extension.openingButton",
                  "Đang kết nối MYDTU...",
                )
              : t(
                  "transcriptDetail.extension.openButton",
                  "Kết nối MYDTU",
                )}
          </button>

          <div className={`rounded-2xl px-4 py-2 text-sm font-extrabold ${badgeClass}`}>
            {t("transcriptDetail.extension.statusLabel", "Trạng thái")}:{" "}
            {label}
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs app-text-muted">
        {t(
          "transcriptDetail.extension.helperSecondary",
          "Sau khi trang thông tin tải xong, không đóng tab MYDTU trong lúc sync.",
        )}
      </div>

      {message ? (
        <div
          className={`mt-4 rounded-2xl px-4 py-3 text-sm font-extrabold leading-7 shadow-sm ${messageClass}`}
        >
          {message}
        </div>
      ) : null}
    </div>
  );
}
