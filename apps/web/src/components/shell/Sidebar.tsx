// apps/web/src/components/shell/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { NAV_ITEMS } from "./navItems";
import { useLastSync } from "@/hooks/useLastSync";

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const lastSyncText = useLastSync();

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
      <div className="mb-3 text-xs font-semibold text-slate-300">
        {t("nav.title")}
      </div>

      <nav className="space-y-1">
        {NAV_ITEMS.map((it) => {
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={[
                "block rounded-xl px-3 py-2 text-sm transition",
                active
                  ? "border border-slate-700 bg-slate-950 text-cyan-300"
                  : "border border-transparent text-slate-200 hover:border-slate-800 hover:bg-slate-950/60",
              ].join(" ")}
            >
              {t(`nav.${it.key}`)}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
        <div className="text-xs font-semibold text-slate-200">
          {t("status.title")}
        </div>
        <div className="mt-1 text-xs text-slate-400">
          {t("status.lastSync")}:{" "}
          <span className="text-slate-200">{lastSyncText}</span>
        </div>
      </div>
    </div>
  );
}