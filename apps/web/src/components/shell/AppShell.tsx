"use client";

import LanguageToggle from "@/components/common/LanguageToggle";
import ThemeToggle from "@/components/common/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
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

type MeUser = {
  id: string;
  email: string;
  name: string | null;
  role: "user" | "admin";
  avatarDataUrl: string | null;
  schoolType?: string | null;
};

function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "U";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }

  return source.slice(0, 1).toUpperCase();
}

function getShortName(name?: string | null, email?: string | null, fallback?: string) {
  if (name?.trim()) return name.trim();
  return email?.split("@")[0] || fallback || "User";
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { user, logout, loading } = useAuth();

  const [me, setMe] = useState<MeUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  const currentLabel = useMemo(() => {
    const found = navItems.find((n) => n.href === pathname);
    return found ? t(`nav.${found.key}`) : "";
  }, [pathname, t]);

  useEffect(() => {
    let alive = true;

    async function loadMe() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const json = await res.json().catch(() => null);

        if (!alive) return;
        setMe(json?.user ?? null);
      } catch {
        if (!alive) return;
        setMe(null);
      }
    }

    loadMe();

    function onSettingsUpdated(event: Event) {
      const custom = event as CustomEvent;
      const nextUser = custom.detail?.user;

      if (nextUser) {
        setMe(nextUser);
      }
    }

    function onDocClick(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function onEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    window.addEventListener("mydtu:settings-updated", onSettingsUpdated);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);

    return () => {
      alive = false;
      window.removeEventListener("mydtu:settings-updated", onSettingsUpdated);
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const onLogout = async () => {
    setMenuOpen(false);
    await logout();
    router.push("/login");
  };

  const displayName = getShortName(
    me?.name || user?.name,
    me?.email || user?.email,
    t("settings.profileCard.defaultName")
  );
  const fullName = me?.name || user?.name || t("settings.profileCard.defaultName");
  const displayEmail = me?.email || user?.email || "";
  const displayAvatar = me?.avatarDataUrl ?? null;
  const initials = getInitials(fullName, displayEmail);
  const displayRole =
    me?.role || (user?.role as "user" | "admin" | undefined) || "user";

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col border-r border-[var(--border-main)] bg-[var(--bg-card)] px-4 py-5 backdrop-blur-xl md:flex">
          <div className="mb-6">
            <div className="text-2xl font-bold tracking-tight">
              {t("app.name")}
            </div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">
              {t("app.tagline")}
            </div>
          </div>

          <nav className="flex flex-col gap-2" aria-label={t("nav.title")}>
            {navItems.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-[var(--accent)] text-white shadow-lg"
                      : "text-[var(--text-main)] hover:bg-[var(--bg-soft)]"
                  }`}
                >
                  {t(`nav.${item.key}`)}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6">
            <Link
              href="/profile"
              className="app-card block rounded-3xl p-3 transition hover:border-[var(--accent)]/20"
            >
              <div className="flex items-center gap-3">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt={t("settings.profileCard.previewAvatar")}
                    className="h-11 w-11 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] font-semibold text-[var(--accent)]">
                    {initials}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">
                    {displayName}
                  </div>
                  <div className="truncate text-xs app-text-muted">
                    {displayEmail || t("settings.profileCard.noEmail")}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[var(--border-main)] bg-[var(--bg-card)]/90 px-4 py-4 backdrop-blur-xl md:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-[var(--text-soft)]">
                {currentLabel}
              </div>

              <div className="flex items-center gap-2">
                <LanguageToggle />
                <ThemeToggle />

                {!loading && user ? (
                  <div className="relative" ref={menuRef}>
                    <button
                      ref={menuButtonRef}
                      type="button"
                      onClick={() => setMenuOpen((prev) => !prev)}
                      aria-label={t("profileMenu.myProfile")}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)] px-2.5 pr-3 transition hover:bg-[var(--bg-card-strong)]"
                    >
                      {displayAvatar ? (
                        <img
                          src={displayAvatar}
                          alt={t("settings.profileCard.previewAvatar")}
                          className="h-8 w-8 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent)]">
                          {initials}
                        </div>
                      )}

                      <span className="hidden max-w-[110px] truncate text-sm font-semibold md:block">
                        {displayName}
                      </span>

                      <span aria-hidden="true" className="text-xs app-text-muted">
                        ▾
                      </span>
                    </button>

                    {menuOpen ? (
                      <div className="absolute right-0 mt-2 w-[290px] rounded-3xl border border-[var(--border-main)] bg-[var(--bg-card-strong)] p-2 shadow-2xl">
                        <div className="rounded-2xl px-3 py-3">
                          <div className="flex items-center gap-3">
                            {displayAvatar ? (
                              <img
                                src={displayAvatar}
                                alt={t("settings.profileCard.previewAvatar")}
                                className="h-12 w-12 rounded-2xl object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] font-semibold text-[var(--accent)]">
                                {initials}
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold">
                                {fullName}
                              </div>
                              <div className="truncate text-xs app-text-muted">
                                {displayEmail || t("settings.profileCard.noEmail")}
                              </div>
                              <div className="mt-1 inline-flex rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-medium capitalize text-[var(--accent)]">
                                {displayRole}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="my-1 h-px bg-[var(--border-main)]" />

                        <Link
                          href="/profile"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center rounded-2xl px-3 py-2.5 text-sm transition hover:bg-[var(--bg-soft)]"
                        >
                          {t("profileMenu.myProfile")}
                        </Link>

                        <Link
                          href="/settings"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center rounded-2xl px-3 py-2.5 text-sm transition hover:bg-[var(--bg-soft)]"
                        >
                          {t("profileMenu.settings")}
                        </Link>

                        <div className="my-2 h-px bg-[var(--border-main)]" />

                        <button
                          type="button"
                          onClick={onLogout}
                          className="flex w-full items-center rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-[var(--danger)] transition hover:bg-[var(--danger-soft)]"
                        >
                          {t("profileMenu.logout")}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="app-btn-primary rounded-xl px-4 py-2 text-sm font-medium"
                  >
                    {t("auth.login")}
                  </Link>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}