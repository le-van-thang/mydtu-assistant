// path: apps/web/src/components/common/InAppNotice.tsx
"use client";

type NoticeTone = "info" | "success" | "warning" | "error";

export default function InAppNotice({
  tone = "info",
  title,
  message,
}: {
  tone?: NoticeTone;
  title: string;
  message: string;
}) {
  const toneClass =
    tone === "success"
      ? "border-[color:var(--success)]/30 bg-[var(--success-soft)] text-[var(--success)]"
      : tone === "warning"
      ? "border-[color:var(--warning)]/30 bg-[var(--warning-soft)] text-[var(--warning)]"
      : tone === "error"
      ? "border-[color:var(--danger)]/30 bg-[var(--danger-soft)] text-[var(--danger)]"
      : "border-[color:var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent)]";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-sm opacity-90">{message}</div>
    </div>
  );
}