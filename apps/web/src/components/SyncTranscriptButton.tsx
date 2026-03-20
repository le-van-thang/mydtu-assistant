"use client";

import { requestTranscriptSync } from "@/lib/extensionBridge";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function SyncTranscriptButton() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [tone, setTone] = useState<"info" | "success" | "error">("info");

  async function onSync() {
    setLoading(true);
    setMsg(t("transcript.sync.scanning", "Đang quét bảng điểm từ MYDTU..."));
    setTone("info");

    try {
      const res = await requestTranscriptSync();

      if (!res.ok) {
        setTone("error");
        setMsg(
          res.error ||
            t("transcript.sync.failed", "Đồng bộ bảng điểm thất bại."),
        );
        return;
      }

      const upstream = await fetch("/api/sync/transcript", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(res.payload),
        credentials: "include",
        cache: "no-store",
      });

      const json = await upstream.json().catch(() => null);

      if (!upstream.ok || !json?.ok) {
        setTone("error");
        setMsg(
          json?.message ||
            json?.error ||
            t("transcript.sync.saveFailed", "Lưu bảng điểm thất bại."),
        );
        return;
      }

      const inserted = Number(json?.counts?.inserted || 0);
      const updated = Number(json?.counts?.updated || 0);
      const total = inserted + updated;

      setTone("success");
      setMsg(
        total > 0
          ? `Đã đồng bộ thành công ${total} dòng bảng điểm.`
          : "Đã đồng bộ thành công.",
      );

      window.dispatchEvent(new CustomEvent("mydtu:transcript-updated"));
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

  const buttonStyle = loading
    ? {
        background: "linear-gradient(180deg, #ef4444 0%, #dc2626 100%)",
        borderColor: "transparent",
        color: "#ffffff",
        boxShadow: "0 12px 24px rgba(239, 68, 68, 0.24)",
      }
    : undefined;

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={onSync}
        disabled={loading}
        className="app-btn-primary rounded-2xl px-4 py-2 text-sm font-semibold transition disabled:opacity-60"
        style={buttonStyle}
      >
        {loading
          ? t("transcript.sync.loading", "Đang đồng bộ...")
          : t("transcript.sync.button", "Sync bảng điểm")}
      </button>

      {msg ? (
        <div className="rounded-xl px-3 py-2 text-sm" style={messageStyle}>
          {msg}
        </div>
      ) : null}
    </div>
  );
}
