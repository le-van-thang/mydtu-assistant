// apps/web/src/components/shell/navItems.ts
export type NavItem = {
  href: string;
  key:
    | "dashboard"
    | "planner"
    | "reminders"
    | "study"
    | "timetable"
    | "transcript"
    | "warnings"
    | "settings";
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", key: "dashboard" },
  { href: "/planner", key: "planner" },
  { href: "/reminders", key: "reminders" },
  { href: "/study", key: "study" },
  { href: "/timetable", key: "timetable" },
  { href: "/transcript", key: "transcript" },
  { href: "/warnings", key: "warnings" },
  { href: "/settings", key: "settings" },
];