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

  const buttonBaseStyle = `relative overflow-hidden group rounded-2xl px-6 py-2.5 text-[14px] font-black shadow-lg transition-all flex items-center justify-center gap-2 text-white w-full sm:w-auto`;
  const btnClass = loading 
    ? `${buttonBaseStyle} bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/30 opacity-90 cursor-wait`
    : `${buttonBaseStyle} bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 active:translate-y-0`;

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={onSync}
        disabled={loading}
        className={btnClass}
      >
        {!loading && <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />}
        {loading ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <span>{t("transcript.sync.loading", "Đang đồng bộ...")}</span>
          </>
        ) : (
          <>
            <span className="text-lg group-hover:scale-110 transition-transform">⚡</span>
            <span>{t("transcript.sync.button", "Đồng bộ bảng điểm")}</span>
          </>
        )}
      </button>

      {msg ? (
        <div className="rounded-xl px-3 py-2 text-sm" style={messageStyle}>
          {msg}
        </div>
      ) : null}
    </div>
  );
}
