// apps/web/src/components/shell/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

const items = [
  { href: "/dashboard", key: "dashboard" },
  { href: "/planner", key: "planner" },
  { href: "/reminders", key: "reminders" },
  { href: "/settings", key: "settings" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto grid max-w-6xl grid-cols-4 gap-1 px-2 py-2">
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={[
                "rounded-xl px-2 py-2 text-center text-xs",
                active
                  ? "bg-slate-900 text-cyan-300"
                  : "text-slate-200 hover:bg-slate-900/60",
              ].join(" ")}
            >
              {t(`nav.${it.key}`)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}