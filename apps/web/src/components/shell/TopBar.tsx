// apps/web/src/components/shell/TopBar.tsx
"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import LanguageToggle from "@/components/common/LanguageToggle";

export default function TopBar() {
  const { t } = useTranslation();

  return (
    <header className="flex items-center justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-900/40 px-3 py-3 md:px-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-cyan-300">
          M
        </div>

        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">
            {t("app.name")}
          </div>
          <div className="text-xs text-slate-400">{t("app.tagline")}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <LanguageToggle />
        <Link
          href="/login"
          className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 hover:bg-slate-900"
        >
          {t("auth.login")}
        </Link>
      </div>
    </header>
  );
}