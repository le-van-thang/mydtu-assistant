// path: apps/web/src/components/shell/AppShell.tsx
"use client";

import LanguageToggle from "@/components/common/LanguageToggle";
import ThemeToggle from "@/components/common/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type NavChildItem = {
  key: string;
  href: string;
  plan?: "tentative" | "official";
};

type NavItem =
  | {
      key: string;
      href: string;
    }
  | {
      key: string;
      href: string;
      children: NavChildItem[];
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
      {
        key: "examTentative",
        href: "/exams?plan=tentative",
        plan: "tentative",
      },
      {
        key: "examOfficial",
        href: "/exams?plan=official",
        plan: "official",
      },
    ],
  },
  {
    key: "transcript",
    href: "/transcript",
    children: [
      {
        key: "transcriptOverview",
        href: "/transcript",
      },
      {
        key: "transcriptDetail",
        href: "/transcript/detail",
      },
    ],
  },
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

type TranslateFn = (key: string, fallback?: string) => string;

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

function getShortName(
  name?: string | null,
  email?: string | null,
  fallback?: string,
) {
  if (name?.trim()) return name.trim();
  return email?.split("@")[0] || fallback || "User";
}

function isExamChildActive(
  pathname: string,
  currentPlan: string | null,
  plan?: "tentative" | "official",
) {
  return (
    pathname === "/exams" &&
    ((plan === "tentative" && currentPlan === "tentative") ||
      (plan === "official" && currentPlan === "official"))
  );
}

function isTranscriptChildActive(pathname: string, href: string) {
  return pathname === href;
}

type SidebarNavProps = {
  pathname: string;
  currentPlan: string | null;
  examMenuOpen: boolean;
  setExamMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  transcriptMenuOpen: boolean;
  setTranscriptMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  t: TranslateFn;
  onNavigate?: () => void;
};

function SidebarNav({
  pathname,
  currentPlan,
  examMenuOpen,
  setExamMenuOpen,
  transcriptMenuOpen,
  setTranscriptMenuOpen,
  t,
  onNavigate,
}: SidebarNavProps) {
  return (
    <nav
      className="flex flex-col gap-2"
      aria-label={t("nav.title", "Điều hướng")}
    >
      {navItems.map((item) => {
        const hasChildren = "children" in item;
        const isExamParent = item.key === "exams";
        const isTranscriptParent = item.key === "transcript";

        const active =
          pathname === item.href ||
          (isExamParent && pathname === "/exams") ||
          (isTranscriptParent &&
            (pathname === "/transcript" || pathname === "/transcript/detail"));

        if (hasChildren) {
          const isOpen = isExamParent ? examMenuOpen : transcriptMenuOpen;
          const toggleOpen = isExamParent
            ? setExamMenuOpen
            : setTranscriptMenuOpen;
          const submenuId = `sidebar-${item.key}-submenu`;

          return (
            <div key={item.href} className="space-y-2">
              <button
                type="button"
                onClick={() => toggleOpen((prev) => !prev)}
                aria-controls={submenuId}
                title={t(`nav.${item.key}`, item.key)}
                className={[
                  "flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition",
                  active
                    ? "bg-[var(--accent)] text-white shadow-lg"
                    : "text-[var(--text-main)] hover:bg-[var(--bg-soft)]",
                ].join(" ")}
              >
                <span>{t(`nav.${item.key}`, item.key)}</span>

                <span
                  className={[
                    "ml-3 flex items-center justify-center rounded-full p-1",
                    active ? "bg-white/10" : "bg-[var(--bg-soft)]/70",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  <ChevronIcon open={isOpen} className="h-5 w-5" />
                </span>
              </button>

              {isOpen ? (
                <div
                  id={submenuId}
                  className="ml-3 flex flex-col gap-1 border-l border-[var(--border-main)] pl-3"
                >
                  {item.children.map((child) => {
                    const childActive = isExamParent
                      ? isExamChildActive(pathname, currentPlan, child.plan)
                      : isTranscriptChildActive(pathname, child.href);

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onNavigate}
                        aria-current={childActive ? "page" : undefined}
                        className={[
                          "rounded-xl px-3 py-2 text-sm transition",
                          childActive
                            ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                            : "text-[var(--text-main)] hover:bg-[var(--bg-soft)]",
                        ].join(" ")}
                      >
                        {t(`nav.${child.key}`, child.key)}
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
            className={[
              "rounded-2xl px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-[var(--accent)] text-white shadow-lg"
                : "text-[var(--text-main)] hover:bg-[var(--bg-soft)]",
            ].join(" ")}
          >
            {t(`nav.${item.key}`, item.key)}
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

  const tSafe: TranslateFn = (key, fallback) => {
    const result = t(key, { defaultValue: fallback ?? key });
    return typeof result === "string" ? result : String(result);
  };

  const currentPlan = searchParams.get("plan");

  const [me, setMe] = useState<MeUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [examMenuOpen, setExamMenuOpen] = useState(pathname === "/exams");
  const [transcriptMenuOpen, setTranscriptMenuOpen] = useState(
    pathname === "/transcript" || pathname === "/transcript/detail",
  );

  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  const currentLabel = useMemo(() => {
    if (pathname === "/exams") {
      if (currentPlan === "tentative") {
        return tSafe("nav.examTentative", "Lịch thi dự kiến");
      }

      if (currentPlan === "official") {
        return tSafe("nav.examOfficial", "Lịch thi chính thức");
      }

      return tSafe("nav.exams", "Danh sách thi");
    }

    if (pathname === "/transcript") {
      return tSafe("nav.transcriptOverview", "Bảng điểm tổng quát");
    }

    if (pathname === "/transcript/detail") {
      return tSafe("nav.transcriptDetail", "Bảng điểm chi tiết");
    }

    const found = navItems.find((n) => n.href === pathname);
    return found ? tSafe(`nav.${found.key}`, found.key) : "";
  }, [pathname, currentPlan, t, tSafe]);

  useEffect(() => {
    if (pathname === "/exams") {
      setExamMenuOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (pathname === "/transcript" || pathname === "/transcript/detail") {
      setTranscriptMenuOpen(true);
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

    void loadMe();

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
    tSafe("settings.profileCard.defaultName", "Người dùng"),
  );

  const fullName =
    me?.name ||
    user?.name ||
    tSafe("settings.profileCard.defaultName", "Người dùng");

  const displayEmail = me?.email || user?.email || "";
  const displayAvatar = me?.avatarDataUrl ?? null;
  const initials = getInitials(fullName, displayEmail);
  const displayRole =
    me?.role || (user?.role as "user" | "admin" | undefined) || "user";

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-[var(--border-main)] bg-[var(--bg-card)] backdrop-blur-xl md:block">
          <div className="flex h-full flex-col overflow-hidden">
            <div className="border-b border-[var(--border-main)] px-4 py-5">
              <div className="text-2xl font-bold tracking-tight">
                {tSafe("app.name", "MYDTU Assistant")}
              </div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">
                {tSafe("app.tagline", "Hệ thống trợ lý học tập DTU")}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5">
              <SidebarNav
                pathname={pathname}
                currentPlan={currentPlan}
                examMenuOpen={examMenuOpen}
                setExamMenuOpen={setExamMenuOpen}
                transcriptMenuOpen={transcriptMenuOpen}
                setTranscriptMenuOpen={setTranscriptMenuOpen}
                t={tSafe}
              />

              <div className="mt-4 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)] p-3">
                <div className="text-xs font-semibold uppercase tracking-wide app-text-muted">
                  {tSafe("common.quickHintTitle", "Gợi ý dùng nhanh")}
                </div>
                <div className="mt-2 text-sm app-text-muted">
                  {tSafe("common.quickHintPrefix", "Vào")}{" "}
                  <span className="font-semibold text-[var(--text-main)]">
                    {tSafe("nav.exams", "Danh sách thi")}
                  </span>{" "}
                  {tSafe(
                    "common.quickHintExamSearch",
                    "để tìm theo mã môn, mã sinh viên, tên sinh viên hoặc lớp chỉ trong một ô tìm kiếm.",
                  )}
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
                      alt={tSafe(
                        "settings.profileCard.previewAvatar",
                        "Ảnh đại diện",
                      )}
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
                      {displayEmail ||
                        tSafe("settings.profileCard.noEmail", "Chưa có email")}
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
              aria-label={tSafe("common.closeMobileSidebar", "Đóng menu")}
              title={tSafe("common.closeMobileSidebar", "Đóng menu")}
              className="absolute inset-0 bg-black/55"
              onClick={() => setMobileSidebarOpen(false)}
            >
              <span className="sr-only">
                {tSafe("common.closeMobileSidebar", "Đóng menu")}
              </span>
            </button>

            <div className="absolute inset-y-0 left-0 flex w-[86vw] max-w-[340px] flex-col border-r border-[var(--border-main)] bg-[var(--bg-card-strong)] shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-[var(--border-main)] px-4 py-4">
                <div>
                  <div className="text-xl font-bold tracking-tight">
                    {tSafe("app.name", "MYDTU Assistant")}
                  </div>
                  <div className="mt-1 text-xs text-[var(--text-muted)]">
                    {tSafe("app.tagline", "Hệ thống trợ lý học tập DTU")}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  aria-label={tSafe(
                    "common.closeNavigationMenu",
                    "Đóng menu điều hướng",
                  )}
                  title={tSafe(
                    "common.closeNavigationMenu",
                    "Đóng menu điều hướng",
                  )}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)] transition hover:bg-[var(--bg-card-strong)]"
                >
                  <CloseIcon />
                  <span className="sr-only">
                    {tSafe(
                      "common.closeNavigationMenu",
                      "Đóng menu điều hướng",
                    )}
                  </span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                <SidebarNav
                  pathname={pathname}
                  currentPlan={currentPlan}
                  examMenuOpen={examMenuOpen}
                  setExamMenuOpen={setExamMenuOpen}
                  transcriptMenuOpen={transcriptMenuOpen}
                  setTranscriptMenuOpen={setTranscriptMenuOpen}
                  t={tSafe}
                  onNavigate={() => setMobileSidebarOpen(false)}
                />

                <div className="mt-4 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)] p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide app-text-muted">
                    {tSafe("common.quickHintTitle", "Gợi ý dùng nhanh")}
                  </div>
                  <div className="mt-2 text-sm app-text-muted">
                    {tSafe("common.quickHintPrefix", "Vào")}{" "}
                    <span className="font-semibold text-[var(--text-main)]">
                      {tSafe("nav.exams", "Danh sách thi")}
                    </span>{" "}
                    {tSafe(
                      "common.quickHintExamSearchMobile",
                      "để tra cứu nhanh theo môn, mã sinh viên, lớp và ngày thi.",
                    )}
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
                        alt={tSafe(
                          "settings.profileCard.previewAvatar",
                          "Ảnh đại diện",
                        )}
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
                        {displayEmail ||
                          tSafe(
                            "settings.profileCard.noEmail",
                            "Chưa có email",
                          )}
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
                  aria-label={tSafe(
                    "common.openNavigationMenu",
                    "Mở menu điều hướng",
                  )}
                  title={tSafe(
                    "common.openNavigationMenu",
                    "Mở menu điều hướng",
                  )}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)] transition hover:bg-[var(--bg-card-strong)] md:hidden"
                >
                  <MenuIcon />
                  <span className="sr-only">
                    {tSafe("common.openNavigationMenu", "Mở menu điều hướng")}
                  </span>
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
                      aria-label={tSafe(
                        "profileMenu.myProfile",
                        "Hồ sơ của tôi",
                      )}
                      title={tSafe("profileMenu.myProfile", "Hồ sơ của tôi")}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)] px-2.5 pr-3 transition hover:bg-[var(--bg-card-strong)]"
                    >
                      {displayAvatar ? (
                        <img
                          src={displayAvatar}
                          alt={tSafe(
                            "settings.profileCard.previewAvatar",
                            "Ảnh đại diện",
                          )}
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

                      <ChevronIcon
                        open={menuOpen}
                        className="h-4 w-4 text-[var(--text-muted)]"
                      />
                    </button>

                    {menuOpen ? (
                      <div className="absolute right-0 mt-2 w-[290px] rounded-3xl border border-[var(--border-main)] bg-[var(--bg-card-strong)] p-2 shadow-2xl">
                        <div className="rounded-2xl px-3 py-3">
                          <div className="flex items-center gap-3">
                            {displayAvatar ? (
                              <img
                                src={displayAvatar}
                                alt={tSafe(
                                  "settings.profileCard.previewAvatar",
                                  "Ảnh đại diện",
                                )}
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
                                {displayEmail ||
                                  tSafe(
                                    "settings.profileCard.noEmail",
                                    "Chưa có email",
                                  )}
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
                          {tSafe("profileMenu.myProfile", "Hồ sơ của tôi")}
                        </Link>

                        <Link
                          href="/settings"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center rounded-2xl px-3 py-2.5 text-sm transition hover:bg-[var(--bg-soft)]"
                        >
                          {tSafe("profileMenu.settings", "Cài đặt")}
                        </Link>

                        <div className="my-2 h-px bg-[var(--border-main)]" />

                        <button
                          type="button"
                          onClick={onLogout}
                          className="flex w-full items-center rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-[var(--danger)] transition hover:bg-[var(--danger-soft)]"
                        >
                          {tSafe("profileMenu.logout", "Đăng xuất")}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="app-btn-primary rounded-xl px-4 py-2 text-sm font-medium"
                  >
                    {tSafe("auth.login", "Đăng nhập")}
                  </Link>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
