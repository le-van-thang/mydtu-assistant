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
        "Đang mở trang bảng điểm chi tiết MYDTU. Nếu MYDTU yêu cầu đăng nhập thì hãy đăng nhập trước, sau đó quay lại ứng dụng để đồng bộ.",
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
          "Đã kết nối MYDTU thành công. Hãy đăng nhập nếu cần, sau đó quay lại và bấm “Sync bảng điểm chi tiết”.",
        ),
      );
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

  const badgeStyle =
    status === "ready"
      ? {
          background: "#dcfce7",
          color: "#065f46",
          border: "1px solid #86efac",
          fontWeight: 800,
        }
      : status === "opening"
        ? {
            background: "#fee2e2",
            color: "#991b1b",
            border: "1px solid #fca5a5",
            fontWeight: 800,
          }
        : status === "error"
          ? {
              background: "#fee2e2",
              color: "#991b1b",
              border: "1px solid #fca5a5",
              fontWeight: 800,
            }
          : {
              background: "#dbeafe",
              color: "#1d4ed8",
              border: "1px solid #93c5fd",
              fontWeight: 800,
            };

  const label =
    status === "ready"
      ? t("transcriptDetail.extension.ready", "Sẵn sàng đồng bộ")
      : status === "opening"
        ? t("transcriptDetail.extension.opening", "Đang kết nối")
        : status === "error"
          ? t("transcriptDetail.extension.error", "Kết nối lỗi")
          : t("transcriptDetail.extension.idle", "Chưa kết nối");

  const buttonClass =
    status === "opening"
      ? "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-[0_14px_34px_rgba(185,28,28,0.35)] transition bg-gradient-to-r from-rose-600 to-red-500"
      : "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-[0_14px_34px_rgba(37,99,235,0.30)] transition bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-110";

  const messageClass =
    status === "ready"
      ? "border border-emerald-400/40 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
      : status === "opening"
        ? "border border-rose-400/40 bg-rose-500/12 text-rose-700 dark:text-rose-200"
        : status === "error"
          ? "border border-red-400/40 bg-red-500/12 text-red-700 dark:text-red-200"
          : "border border-sky-400/40 bg-sky-500/12 text-sky-700 dark:text-sky-200";

  return (
    <div className="app-card rounded-3xl p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleOpen}
            disabled={status === "opening"}
            className={`${buttonClass} disabled:cursor-not-allowed disabled:opacity-95`}
          >
            {status === "opening"
              ? t(
                  "transcriptDetail.extension.openingButton",
                  "Đang kết nối MYDTU...",
                )
              : t("transcriptDetail.extension.openButton", "Kết nối MYDTU")}
          </button>
        </div>

        <div className="rounded-2xl px-4 py-2 text-sm" style={badgeStyle}>
          {t("transcriptDetail.extension.statusLabel", "Trạng thái")}: {label}
        </div>
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
