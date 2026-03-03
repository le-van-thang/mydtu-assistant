"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="px-3 py-1 rounded-lg border border-slate-600 text-sm hover:bg-slate-700 transition"
    >
      {isDark ? "☀ Sáng" : "🌙 Tối"}
    </button>
  );
}