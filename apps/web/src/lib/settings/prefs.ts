// path: apps/web/src/lib/settings/prefs.ts
export type AppTheme = "light" | "dark" | "system";
export type AppLanguage = "vi" | "en";
export type AppDensity = "comfortable" | "compact";

export type SettingsPrefs = {
  theme: AppTheme;
  language: AppLanguage;
  density: AppDensity;
  notifications: {
    emailAlerts: boolean;
    webPush: boolean;
    timetableReminders: boolean;
    deadlineReminders: boolean;
    gradeAlerts: boolean;
    weeklySummary: boolean;
  };
  privacy: {
    rememberDevice: boolean;
    analyticsOptIn: boolean;
  };
  data: {
    onboardingDismissed: boolean;
    lastManualSyncAt: string | null;
    lastExportAt: string | null;
  };
};

const STORAGE_KEY = "mydtu.settings.v1";
export const SETTINGS_EVENT = "mydtu:settings-updated";

export const defaultSettingsPrefs: SettingsPrefs = {
  theme: "system",
  language: "vi",
  density: "comfortable",
  notifications: {
    emailAlerts: true,
    webPush: false,
    timetableReminders: true,
    deadlineReminders: true,
    gradeAlerts: true,
    weeklySummary: false,
  },
  privacy: {
    rememberDevice: true,
    analyticsOptIn: false,
  },
  data: {
    onboardingDismissed: false,
    lastManualSyncAt: null,
    lastExportAt: null,
  },
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function clonePrefs<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function mergePrefs(input: unknown): SettingsPrefs {
  const base = clonePrefs(defaultSettingsPrefs);

  if (!isObject(input)) return base;

  if (input.theme === "light" || input.theme === "dark" || input.theme === "system") {
    base.theme = input.theme;
  }

  if (input.language === "vi" || input.language === "en") {
    base.language = input.language;
  }

  if (input.density === "comfortable" || input.density === "compact") {
    base.density = input.density;
  }

  if (isObject(input.notifications)) {
    base.notifications.emailAlerts =
      typeof input.notifications.emailAlerts === "boolean"
        ? input.notifications.emailAlerts
        : base.notifications.emailAlerts;

    base.notifications.webPush =
      typeof input.notifications.webPush === "boolean"
        ? input.notifications.webPush
        : base.notifications.webPush;

    base.notifications.timetableReminders =
      typeof input.notifications.timetableReminders === "boolean"
        ? input.notifications.timetableReminders
        : base.notifications.timetableReminders;

    base.notifications.deadlineReminders =
      typeof input.notifications.deadlineReminders === "boolean"
        ? input.notifications.deadlineReminders
        : base.notifications.deadlineReminders;

    base.notifications.gradeAlerts =
      typeof input.notifications.gradeAlerts === "boolean"
        ? input.notifications.gradeAlerts
        : base.notifications.gradeAlerts;

    base.notifications.weeklySummary =
      typeof input.notifications.weeklySummary === "boolean"
        ? input.notifications.weeklySummary
        : base.notifications.weeklySummary;
  }

  if (isObject(input.privacy)) {
    base.privacy.rememberDevice =
      typeof input.privacy.rememberDevice === "boolean"
        ? input.privacy.rememberDevice
        : base.privacy.rememberDevice;

    base.privacy.analyticsOptIn =
      typeof input.privacy.analyticsOptIn === "boolean"
        ? input.privacy.analyticsOptIn
        : base.privacy.analyticsOptIn;
  }

  if (isObject(input.data)) {
    base.data.onboardingDismissed =
      typeof input.data.onboardingDismissed === "boolean"
        ? input.data.onboardingDismissed
        : base.data.onboardingDismissed;

    base.data.lastManualSyncAt =
      typeof input.data.lastManualSyncAt === "string" || input.data.lastManualSyncAt === null
        ? input.data.lastManualSyncAt
        : base.data.lastManualSyncAt;

    base.data.lastExportAt =
      typeof input.data.lastExportAt === "string" || input.data.lastExportAt === null
        ? input.data.lastExportAt
        : base.data.lastExportAt;
  }

  return base;
}

export function normalizeSettingsPrefs(input: unknown): SettingsPrefs {
  return mergePrefs(input);
}

export function readSettingsPrefs(): SettingsPrefs {
  if (typeof window === "undefined") return clonePrefs(defaultSettingsPrefs);

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return clonePrefs(defaultSettingsPrefs);
    return mergePrefs(JSON.parse(raw));
  } catch {
    return clonePrefs(defaultSettingsPrefs);
  }
}

export function writeSettingsPrefs(prefs: SettingsPrefs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function clearSettingsPrefs() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function applyPrefsToDom(
  prefs: SettingsPrefs,
  setTheme?: (theme: AppTheme) => void
) {
  if (typeof window === "undefined") return;

  if (setTheme) {
    setTheme(prefs.theme);
  }

  document.documentElement.dataset.density = prefs.density;

  try {
    window.localStorage.setItem("mydtu.language", prefs.language);
  } catch {}
}

export function broadcastSettingsUpdated(detail: {
  settings: SettingsPrefs;
  user?: unknown;
  source?: string;
}) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(SETTINGS_EVENT, {
      detail,
    })
  );
}

export function updateSettingsPrefsClient(
  updater: (prev: SettingsPrefs) => SettingsPrefs,
  options?: {
    setTheme?: (theme: AppTheme) => void;
    source?: string;
    user?: unknown;
  }
) {
  const prev = readSettingsPrefs();
  const next = normalizeSettingsPrefs(updater(clonePrefs(prev)));

  writeSettingsPrefs(next);
  applyPrefsToDom(next, options?.setTheme);

  broadcastSettingsUpdated({
    settings: next,
    user: options?.user,
    source: options?.source ?? "client-update",
  });

  return next;
}

export async function persistSettingsPatchToServer(
  patch: Partial<SettingsPrefs>
) {
  try {
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(patch),
    });
  } catch {
    // im lặng, UI local vẫn chạy bình thường
  }
}

export function downloadJsonFile(filename: string, data: unknown) {
  if (typeof window === "undefined") return;

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function formatDateTime(
  value?: string | null,
  locale: string = "vi-VN",
  fallback = "Chưa có"
) {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function formatDate(
  value?: string | null,
  locale: string = "vi-VN",
  fallback = "Chưa có"
) {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(date);
}