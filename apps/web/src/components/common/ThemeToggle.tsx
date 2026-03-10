"use client";

import {
  normalizeSettingsPrefs,
  readSettingsPrefs,
  writeSettingsPrefs,
  type SettingsPrefs,
} from "@/lib/settings/prefs";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type ThemeMode = "light" | "dark" | "system";

async function persistThemeToServer(nextPrefs: SettingsPrefs) {
  try {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(nextPrefs),
    });
  } catch {
    // local vẫn chạy bình thường
  }
}

function applyPrefsToDom(prefs: SettingsPrefs) {
  document.documentElement.dataset.density = prefs.density;

  try {
    window.localStorage.setItem("mydtu.language", prefs.language);
  } catch {}
}

export default function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const effectiveTheme = useMemo(() => {
    if (!mounted) return "light";
    return theme === "system" ? resolvedTheme || "light" : theme;
  }, [mounted, theme, resolvedTheme]);

  const label =
    effectiveTheme === "dark"
      ? t("settings.appearance.dark")
      : t("settings.appearance.light");

  const icon = effectiveTheme === "dark" ? "🌙" : "☀️";

  async function applyThemeEverywhere(nextTheme: ThemeMode) {
    setBusy(true);

    try {
      setTheme(nextTheme);

      const nextPrefs = normalizeSettingsPrefs(readSettingsPrefs());
      nextPrefs.theme = nextTheme;
      writeSettingsPrefs(nextPrefs);
      applyPrefsToDom(nextPrefs);

      window.dispatchEvent(
        new CustomEvent("mydtu:settings-updated", {
          detail: {
            settings: nextPrefs,
            source: "theme-toggle",
          },
        })
      );

      await persistThemeToServer(nextPrefs);
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle() {
    if (!mounted || busy) return;

    const nextTheme: ThemeMode =
      effectiveTheme === "dark" ? "light" : "dark";

    await applyThemeEverywhere(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={!mounted || busy}
      aria-label={t("settings.appearance.theme")}
      title={t("settings.appearance.theme")}
      className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-main)] bg-[var(--bg-soft)] px-3 py-2 text-sm font-medium text-[var(--text-main)] transition hover:bg-[var(--bg-card-strong)] disabled:opacity-60"
    >
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </button>
  );
}