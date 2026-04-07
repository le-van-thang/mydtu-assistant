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
  { key: "pathways", href: "/pathways" },
  { key: "cognitive", href: "/cognitive" },
  { key: "transcript", href: "/transcript" },
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

function LogoIcon({ className = "w-8 h-8 shrink-0" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="16" fill="url(#paint0_linear)" />
      <path d="M14 28V18L24 13L34 18V28L24 33L14 28Z" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M24 13V33" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
      <defs>
        <linearGradient id="paint0_linear" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#D946EF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function NavIcon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  switch (name) {
    case "dashboard":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="2" />
          <rect x="14" y="3" width="7" height="5" rx="2" />
          <rect x="14" y="12" width="7" height="9" rx="2" />
          <rect x="3" y="16" width="7" height="5" rx="2" />
        </svg>
      );
    case "planner":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="3" ry="3" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "pathways":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      );
    case "cognitive":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0" />
          <path d="M12 3a9 9 0 0 0-9 9c0 5 4 9 9 9a7 7 0 0 0 7-7c0-5-4-9-7-9z" />
          <path d="M15 8l3-3" />
        </svg>
      );
    case "sandbox":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
        </svg>
      );
    case "study":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      );
    case "timetable":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case "exams":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );
    case "transcript":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 20V10" />
          <path d="M12 20V4" />
          <path d="M6 20v-6" />
        </svg>
      );
    case "rateflow":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case "warnings":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case "reminders":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );
    case "settings":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    default:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

const ZODIACS = [
  { id: 0, name: "Thân", emoji: "🐒" },
  { id: 1, name: "Dậu", emoji: "🐓" },
  { id: 2, name: "Tuất", emoji: "🐕" },
  { id: 3, name: "Hợi", emoji: "🐖" },
  { id: 4, name: "Tý", emoji: "🐀" },
  { id: 5, name: "Sửu", emoji: "🐂" },
  { id: 6, name: "Dần", emoji: "🐅" },
  { id: 7, name: "Mão", emoji: "🐈" },
  { id: 8, name: "Thìn", emoji: "🐉" },
  { id: 9, name: "Tỵ", emoji: "🐍" },
  { id: 10, name: "Ngọ", emoji: "🐎" },
  { id: 11, name: "Mùi", emoji: "🐐" },
];

function ZodiacMascot() {
  const { t } = useTranslation();
  const [year, setYear] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("mydtu:zodiac_year");
    if (saved) setYear(parseInt(saved, 10));
  }, []);

  const handleSelect = (y: number) => {
    setYear(y);
    localStorage.setItem("mydtu:zodiac_year", y.toString());
    setOpen(false);
  };

  const zodiacIndex = year !== null ? year % 12 : null;
  const currentZodiac = zodiacIndex !== null ? ZODIACS[zodiacIndex] : null;

  return (
    <div className="absolute -top-4 right-2 z-20">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
        }}
        className="group flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 shadow-md shadow-orange-500/30 transition-all hover:scale-110 active:scale-95 animate-bounce hover:animate-none"
        title={t("zodiac.title", "Linh Vật Bản Mệnh")}
      >
        {currentZodiac ? (
          <span className="text-xl drop-shadow-sm transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-12">{currentZodiac.emoji}</span>
        ) : (
          <span className="text-white text-[15px] font-bold">✨</span>
        )}
      </button>

      {open && (
        <div 
          className="absolute bottom-12 right-0 w-[260px] rounded-2xl bg-[var(--bg-card-strong)] shadow-[0_10px_40px_rgba(0,0,0,0.4)] p-4 border border-[var(--border-main)] backdrop-blur-3xl animate-in zoom-in-95 duration-200"
          onClick={(e) => e.preventDefault()}
        >
          <div className="text-sm font-bold mb-3 flex items-center justify-between border-b border-[var(--border-main)] pb-2">
            <span className="bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">{t("zodiac.selectYear", "Chọn năm sinh")}</span>
            <button onClick={(e) => { e.stopPropagation(); setOpen(false); }} className="text-[var(--text-muted)] hover:text-rose-500 p-1 bg-[var(--bg-soft)] rounded-full transition-colors">
               <CloseIcon />
            </button>
          </div>
          <p className="text-[11px] font-medium app-text-muted mb-4 leading-relaxed">{t("zodiac.description", "OmniScholar AI sẽ xác định cung mệnh 12 con giáp và tạo Linh Vật Nhún Nhảy đồng hành cùng bạn!")}</p>
          <div className="grid grid-cols-4 gap-2 h-[220px] overflow-y-auto pr-1">
             {Array.from({ length: 48 }).map((_, i) => {
                const y = 2012 - i; // from 2012 down to 1965
                const zIndex = y % 12;
                const emoji = ZODIACS[zIndex].emoji;
                return (
                  <button
                    key={y}
                    onClick={() => handleSelect(y)}
                    className="flex flex-col items-center justify-center rounded-xl bg-[var(--bg-soft)] p-2 hover:bg-orange-500 hover:text-white transition-colors"
                  >
                     <span className="text-2xl mb-1">{emoji}</span>
                     <span className="text-[11px] font-bold">{y}</span>
                  </button>
                )
             })}
          </div>
        </div>
      )}
    </div>
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

function getIconColorClass(name: string) {
  switch (name) {
    case "dashboard": return "text-indigo-500 group-hover:text-indigo-600 dark:text-indigo-400 dark:group-hover:text-indigo-300";
    case "planner": return "text-emerald-500 group-hover:text-emerald-600 dark:text-emerald-400 dark:group-hover:text-emerald-300";
    case "study": return "text-amber-500 group-hover:text-amber-600 dark:text-amber-400 dark:group-hover:text-amber-300";
    case "timetable": return "text-fuchsia-500 group-hover:text-fuchsia-600 dark:text-fuchsia-400 dark:group-hover:text-fuchsia-300";
    case "exams": return "text-violet-500 group-hover:text-violet-600 dark:text-violet-400 dark:group-hover:text-violet-300";
    case "transcript": return "text-blue-500 group-hover:text-blue-600 dark:text-blue-400 dark:group-hover:text-blue-300";
    case "warnings": return "text-rose-500 group-hover:text-rose-600 dark:text-rose-400 dark:group-hover:text-rose-300";
    case "reminders": return "text-teal-500 group-hover:text-teal-600 dark:text-teal-400 dark:group-hover:text-teal-300";
    case "pathways": return "text-orange-500 dark:text-orange-400";
    case "cognitive": return "text-violet-500 dark:text-violet-400";
    case "sandbox": return "text-cyan-500 dark:text-cyan-400";
    case "settings": return "text-slate-500 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-300";
    default: return "text-[var(--text-muted)] group-hover:text-[var(--accent)]";
  }
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
                  "group flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-[14px] font-bold transition-all duration-300",
                  active
                    ? "bg-gradient-to-r from-[var(--accent)] to-blue-500 text-white shadow-lg shadow-blue-500/20 translate-x-1"
                    : "text-[var(--text-main)] hover:bg-[var(--bg-soft)] hover:translate-x-1",
                ].join(" ")}
              >
                <div className="flex items-center gap-3">
                  {item.key !== "rateflow" && (
                    <span className={active ? "text-white" : `${getIconColorClass(item.key)} transition-colors duration-300`}>
                      <NavIcon name={item.key} />
                    </span>
                  )}
                  <span>{t(`nav.${item.key}`, item.key)}</span>
                </div>

                <span
                  className={[
                    "ml-3 flex items-center justify-center rounded-full p-1 transition-colors",
                    active ? "bg-white/20" : "bg-[var(--bg-soft)] text-[var(--text-muted)] group-hover:text-[var(--accent)] group-hover:bg-[var(--accent)]/10",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  <ChevronIcon open={isOpen} className="h-4 w-4" />
                </span>
              </button>

              {isOpen ? (
                <div
                  id={submenuId}
                  className="ml-5 mt-2 flex flex-col gap-1 border-l-2 border-[var(--border-main)] pl-3"
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
                          "group flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-bold transition-all duration-200",
                          childActive
                            ? "bg-[var(--accent-soft)] text-[var(--accent)] translate-x-1"
                            : "text-[var(--text-muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--text-main)] hover:translate-x-1",
                        ].join(" ")}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${childActive ? "bg-[var(--accent)] scale-125" : "bg-[var(--border-main)] group-hover:bg-[var(--text-muted)]"} transition-all`} />
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
              "group flex items-center gap-3 rounded-xl px-3 py-3 text-[14px] font-bold transition-all duration-300",
              active
                ? "bg-gradient-to-r from-[var(--accent)] to-blue-500 text-white shadow-lg shadow-blue-500/20 translate-x-1"
                : "text-[var(--text-main)] hover:bg-[var(--bg-soft)] hover:translate-x-1",
            ].join(" ")}
          >
            {item.key !== "rateflow" && (
              <span className={active ? "text-white" : `${getIconColorClass(item.key)} transition-colors duration-300`}>
                <NavIcon name={item.key} />
              </span>
            )}
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
        <aside className="sticky top-0 z-50 hidden h-screen w-72 shrink-0 border-r border-[var(--border-main)] bg-[var(--bg-card)] backdrop-blur-xl md:block">
          <div className="flex h-full flex-col">
            <div className="border-b border-[var(--border-main)] px-5 py-6">
              <div className="flex items-center gap-3">
                <LogoIcon />
                <div>
                  <div className="text-[22px] font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 leading-none">
                    OmniScholar AI
                  </div>
                  <div className="text-[11px] font-bold tracking-widest text-[var(--text-muted)] uppercase mt-1">
                    OMNISCHOLAR PLATFORM
                  </div>
                </div>
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

            <div className="border-t border-[var(--border-main)] px-4 py-4 relative">
              <ZodiacMascot />
              <Link
                href="/profile"
                className="group app-card block rounded-3xl p-3 transition-all hover:bg-[var(--bg-soft)] hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {displayAvatar ? (
                      <img
                        src={displayAvatar}
                        alt={tSafe(
                          "settings.profileCard.previewAvatar",
                          "Ảnh đại diện",
                        )}
                        className="h-11 w-11 rounded-2xl object-cover transition-transform group-hover:scale-105 shadow-sm"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 font-bold text-blue-600 dark:text-blue-400 transition-transform group-hover:scale-105 shadow-sm">
                        {initials}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-extrabold group-hover:text-[var(--accent)] transition-colors">
                      {displayName}
                    </div>
                    <div className="truncate text-[11px] font-bold app-text-muted mt-0.5 group-hover:text-[var(--text-main)] transition-colors">
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
              <div className="flex items-center justify-between border-b border-[var(--border-main)] px-5 py-5 bg-[var(--bg-card)]">
                <div className="flex items-center gap-3">
                  <LogoIcon className="w-8 h-8 shrink-0" />
                  <div>
                    <div className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 leading-none">
                      OmniScholar AI
                    </div>
                    <div className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase mt-1">
                      OMNISCHOLAR PLATFORM
                    </div>
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
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-main)] bg-[var(--bg-soft)] transition hover:bg-[var(--bg-card-strong)] active:scale-95"
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
