// apps/web/src/app/(app)/dashboard/page.tsx
"use client";

import { useTranslation } from "react-i18next";

export default function DashboardPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {t("dashboard.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {t("dashboard.subtitle")}
          </p>
        </div>

        <button className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 hover:bg-slate-900">
          {t("common.new")}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="text-sm font-semibold">{t("dashboard.card.gpa")}</div>
          <div className="mt-2 text-3xl font-semibold text-cyan-300">3.45</div>
          <div className="mt-1 text-xs text-slate-400">
            {t("dashboard.card.gpaHint")}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="text-sm font-semibold">{t("dashboard.card.todo")}</div>
          <ul className="mt-2 space-y-2 text-sm text-slate-200">
            <li className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
              {t("dashboard.card.todoItem1")}
            </li>
            <li className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
              {t("dashboard.card.todoItem2")}
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}