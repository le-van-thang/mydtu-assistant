"use client";
import { useTranslation } from "react-i18next";

export default function TranscriptPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="text-xl font-semibold">{t("transcript.title")}</h1>
      <p className="mt-1 text-sm text-slate-400">{t("transcript.subtitle")}</p>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
        <div className="text-sm font-semibold">{t("transcript.section")}</div>
        <div className="mt-2 text-sm text-slate-200">
          {t("transcript.placeholder")}
        </div>
      </div>
    </div>
  );
}