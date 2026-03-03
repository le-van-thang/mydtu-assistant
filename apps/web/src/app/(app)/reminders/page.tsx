"use client";
import { useTranslation } from "react-i18next";

export default function RemindersPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="text-xl font-semibold">{t("reminders.title")}</h1>
      <p className="mt-1 text-sm text-slate-400">{t("reminders.subtitle")}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="text-sm font-semibold">{t("reminders.card1")}</div>
          <div className="mt-2 text-sm text-slate-200">{t("reminders.p1")}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="text-sm font-semibold">{t("reminders.card2")}</div>
          <div className="mt-2 text-sm text-slate-200">{t("reminders.p2")}</div>
        </div>
      </div>
    </div>
  );
}