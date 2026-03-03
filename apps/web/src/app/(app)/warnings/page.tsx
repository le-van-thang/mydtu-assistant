"use client";
import { useTranslation } from "react-i18next";

export default function WarningsPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="text-xl font-semibold">{t("warnings.title")}</h1>
      <p className="mt-1 text-sm text-slate-400">{t("warnings.subtitle")}</p>

      <div className="mt-4 rounded-2xl border border-amber-800/60 bg-amber-950/20 p-4">
        <div className="text-sm font-semibold text-amber-200">
          {t("warnings.section")}
        </div>
        <div className="mt-2 text-sm text-slate-200">
          {t("warnings.placeholder")}
        </div>
      </div>
    </div>
  );
}