// apps/web/src/components/shell/AppShell.tsx
"use client";

import ThemeToggle from "@/components/common/ThemeToggle";
import LanguageToggle from "@/components/common/LanguageToggle";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";

const navItems = [
  { key: "dashboard", href: "/dashboard" },
  { key: "planner", href: "/planner" },
  { key: "study", href: "/study" },
  { key: "timetable", href: "/timetable" },
  { key: "transcript", href: "/transcript" },
  { key: "warnings", href: "/warnings" },
  { key: "reminders", href: "/reminders" },
  { key: "settings", href: "/settings" },
] as const;

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { user, logout, loading } = useAuth();

  const currentLabel = useMemo(() => {
    const found = navItems.find((n) => n.href === pathname);
    return found ? t(`nav.${found.key}`) : "";
  }, [pathname, t]);

  const onLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300 flex">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-800 p-4 bg-[var(--bg-card)]">
        <div className="mb-6">
          <div className="text-lg font-semibold">{t("app.name")}</div>
          <div className="text-xs opacity-70">{t("app.tagline")}</div>
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-lg text-sm transition ${
                pathname === item.href ? "bg-blue-600 text-white" : "hover:bg-slate-700"
              }`}
            >
              {t(`nav.${item.key}`)}
            </Link>
          ))}
        </nav>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">
        {/* TOPBAR */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[var(--bg-card)]">
          <div className="text-sm opacity-70">{currentLabel}</div>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
            {!loading && user ? (
              <button
                onClick={onLogout}
                className="px-4 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm"
                type="button"
              >
                {t("auth.logout")}
              </button>
            ) : (
              <Link
                href="/login"
                className="px-4 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm"
              >
                {t("auth.login")}
              </Link>
            )}
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}