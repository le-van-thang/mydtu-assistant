// apps/web/src/components/shell/navItems.ts
export type NavItem = {
  href: string;
  key:
    | "dashboard"
    | "planner"
    | "pathways"
    | "cognitive"
    | "sandbox"
    | "study"
    | "timetable"
    | "transcript"
    | "warnings"
    | "reminders"
    | "settings";
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", key: "dashboard" },
  { href: "/planner", key: "planner" },
  { href: "/pathways", key: "pathways" },
  { href: "/cognitive", key: "cognitive" },
  { href: "/sandbox", key: "sandbox" },
  { href: "/study", key: "study" },
  { href: "/timetable", key: "timetable" },
  { href: "/transcript", key: "transcript" },
  { href: "/warnings", key: "warnings" },
  { href: "/reminders", key: "reminders" },
  { href: "/settings", key: "settings" },
];