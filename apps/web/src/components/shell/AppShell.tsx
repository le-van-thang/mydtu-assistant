"use client";

import LanguageToggle from "@/components/common/LanguageToggle";
import ThemeToggle from "@/components/common/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type NavItem =
  | { key: string; href: string }
  | {
      key: string;
      href: string;
      children: Array<{ key: string; href: string; plan?: "tentative" | "official" }>;
    };

const navItems: NavItem[] = [
  { key: "dashboard", href: "/dashboard" },
  { key: "planner", href: "/planner" },
  { key: "study", href: "/study" },
  { key: "timetable", href: "/timetable" },
  {
    key: "exams",
    href: "/exams",
    children: [
      { key: "examTentative", href: "/exams?plan=tentative", plan: "tentative" },
      { key: "examOfficial", href: "/exams?plan=official", plan: "official" },
    ],
  },
  { key: "transcript", href: "/transcript" },
  { key: "warnings", href: "/warnings" },
  { key: "reminders", href: "/reminders" },
  { key: "settings", href: "/settings" },
];

type MeUser = {
  id: string;
  email: string;
  name: string | null;
  role: "user" | "admin";
  avatarDataUrl: string | null;
  schoolType?: string | null;
};

function ChevronIcon({
  open,
  className = "h-5 w-5",
}: {
  open: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={`${className} shrink-0 transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 8l5 5 5-5" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6l-12 12" />
    </svg>
  );
}

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

function isChildActive(
  pathname: string,
  currentPlan: string | null,
  plan?: "tentative" | "official"
) {
  return (
    pathname === "/exams" &&
    ((plan === "tentative" && currentPlan === "tentative") ||
      (plan === "official" && currentPlan === "official"))
  );
}

type SidebarNavProps = {
  pathname: string;
  currentPlan: string | null;
  examMenuOpen: boolean;
  setExamMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  t: (key: string) => string;
  onNavigate?: () => void;
};

function SidebarNav({
  pathname,
  currentPlan,
  examMenuOpen,
  setExamMenuOpen,
  t,
  onNavigate,
}: SidebarNavProps) {
  return (
    <nav className="flex flex-col gap-2" aria-label={t("nav.title")}>
      {navItems.map((item) => {
        const hasChildren = "children" in item && Array.isArray(item.children);
        const active = pathname === item.href || (hasChildren && pathname === "/exams");

        if (hasChildren) {
          const submenuId = "sidebar-exams-submenu";

          return (
            <div key={item.href} className="space-y-2">
              <button
                type="button"
                onClick={() => setExamMenuOpen((prev) => !prev)}
                aria-controls={submenuId}
                aria-label={t(`nav.${item.key}`)}
                title={t(`nav.${item.key}`)}
                className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  active
                    ? "bg-[var(--accent)] text-white shadow-lg"
                    : "text-[var(--text-main)] hover:bg-[var(--bg-soft)]"
                }`}
              >
                <span>{t(`nav.${item.key}`)}</span>

                <span
                  className={`ml-3 flex items-center justify-center rounded-full ${
                    active ? "bg-white/10" : "bg-[var(--bg-soft)]/70"
                  } p-1`}
                  aria-hidden="true"
                >
                  <ChevronIcon open={examMenuOpen} className="h-5 w-5" />
                </span>
              </button>

              {examMenuOpen ? (
                <div
                  id={submenuId}
                  className="ml-3 flex flex-col gap-1 border-l border-[var(--border-main)] pl-3"
                >
                  {item.children.map((child) => {
                    const childActive = isChildActive(pathname, currentPlan, child.plan);

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onNavigate}
                        aria-current={childActive ? "page" : undefined}
                        className={`rounded-xl px-3 py-2 text-sm transition ${
                          childActive
                            ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                            : "text-[var(--text-main)] hover:bg-[var(--bg-soft)]"
                        }`}
                      >
                        {t(`nav.${child.key}`)}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
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
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { user, logout, loading } = useAuth();

  const currentPlan = searchParams.get("plan");

  const [me, setMe] = useState<MeUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [examMenuOpen, setExamMenuOpen] = useState(pathname === "/exams");

  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  const currentLabel = useMemo(() => {
    if (pathname === "/exams") {
      if (currentPlan === "tentative") return t("nav.examTentative");
      if (currentPlan === "official") return t("nav.examOfficial");
      return t("nav.exams");
    }

    const found = navItems.find((n) => n.href === pathname);
    return found ? t(`nav.${found.key}`) : "";
  }, [pathname, currentPlan, t]);

  useEffect(() => {
    if (pathname === "/exams") {
      setExamMenuOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname, currentPlan]);

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
        setMobileSidebarOpen(false);
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

  useEffect(() => {
    if (!mobileSidebarOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileSidebarOpen]);

  const onLogout = async () => {
    setMenuOpen(false);
    setMobileSidebarOpen(false);
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
  const displayRole = me?.role || (user?.role as "user" | "admin" | undefined) || "user";

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-[var(--border-main)] bg-[var(--bg-card)] backdrop-blur-xl md:block">
          <div className="flex h-full flex-col overflow-hidden">
            <div className="border-b border-[var(--border-main)] px-4 py-5">
              <div className="text-2xl font-bold tracking-tight">{t("app.name")}</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">{t("app.tagline")}</div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5">
              <SidebarNav
                pathname={pathname}
                currentPlan={currentPlan}
                examMenuOpen={examMenuOpen}
                setExamMenuOpen={setExamMenuOpen}
                t={t}
              />

              <div className="mt-4 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)] p-3">
                <div className="text-xs font-semibold uppercase tracking-wide app-text-muted">
                  Gợi ý dùng nhanh
                </div>
                <div className="mt-2 text-sm app-text-muted">
                  Vào <span className="font-semibold text-[var(--text-main)]">Danh sách thi</span>{" "}
                  để tìm theo mã môn, mã sinh viên, tên sinh viên hoặc lớp chỉ trong một ô tìm
                  kiếm.
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border-main)] px-4 py-4">
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
                    <div className="truncate text-sm font-semibold">{displayName}</div>
                    <div className="truncate text-xs app-text-muted">
                      {displayEmail || t("settings.profileCard.noEmail")}
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </aside>

        {mobileSidebarOpen ? (
          <div className="fixed inset-0 z-40 md:hidden">
            <button
              type="button"
              aria-label="Close mobile sidebar"
              title="Close mobile sidebar"
              className="absolute inset-0 bg-black/55"
              onClick={() => setMobileSidebarOpen(false)}
            >
              <span className="sr-only">Close mobile sidebar</span>
            </button>

            <div className="absolute inset-y-0 left-0 flex w-[86vw] max-w-[340px] flex-col border-r border-[var(--border-main)] bg-[var(--bg-card-strong)] shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-[var(--border-main)] px-4 py-4">
                <div>
                  <div className="text-xl font-bold tracking-tight">{t("app.name")}</div>
                  <div className="mt-1 text-xs text-[var(--text-muted)]">{t("app.tagline")}</div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  aria-label="Close navigation menu"
                  title="Close navigation menu"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)] transition hover:bg-[var(--bg-card-strong)]"
                >
                  <CloseIcon />
                  <span className="sr-only">Close navigation menu</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                <SidebarNav
                  pathname={pathname}
                  currentPlan={currentPlan}
                  examMenuOpen={examMenuOpen}
                  setExamMenuOpen={setExamMenuOpen}
                  t={t}
                  onNavigate={() => setMobileSidebarOpen(false)}
                />

                <div className="mt-4 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)] p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide app-text-muted">
                    Gợi ý dùng nhanh
                  </div>
                  <div className="mt-2 text-sm app-text-muted">
                    Vào <span className="font-semibold text-[var(--text-main)]">Danh sách thi</span>{" "}
                    để tra cứu nhanh theo môn, mã sinh viên, lớp và ngày thi.
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--border-main)] px-4 py-4">
                <Link
                  href="/profile"
                  onClick={() => setMobileSidebarOpen(false)}
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
                      <div className="truncate text-sm font-semibold">{displayName}</div>
                      <div className="truncate text-xs app-text-muted">
                        {displayEmail || t("settings.profileCard.noEmail")}
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-[var(--border-main)] bg-[var(--bg-card)]/90 px-4 py-4 backdrop-blur-xl md:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(true)}
                  aria-label="Open navigation menu"
                  title="Open navigation menu"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)] transition hover:bg-[var(--bg-card-strong)] md:hidden"
                >
                  <MenuIcon />
                  <span className="sr-only">Open navigation menu</span>
                </button>

                <div className="truncate text-sm font-medium text-[var(--text-soft)]">
                  {currentLabel}
                </div>
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
                      title={t("profileMenu.myProfile")}
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

                      <ChevronIcon open={menuOpen} className="h-4 w-4 text-[var(--text-muted)]" />
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
                              <div className="truncate text-sm font-semibold">{fullName}</div>
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

          <main className="flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}