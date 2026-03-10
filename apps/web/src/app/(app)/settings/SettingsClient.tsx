// path: apps/web/src/app/(app)/settings/SettingsClient.tsx
"use client";

import {
    clearSettingsPrefs,
    defaultSettingsPrefs,
    downloadJsonFile,
    formatDateTime,
    normalizeSettingsPrefs,
    readSettingsPrefs,
    SettingsPrefs,
    writeSettingsPrefs,
} from "@/lib/settings/prefs";
import { useTheme } from "next-themes";
import React from "react";
import { useTranslation } from "react-i18next";

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

type SettingsUser = {
  id: string;
  email: string;
  name: string | null;
  role: "user" | "admin";
  avatarDataUrl: string | null;
};

function clonePrefs(value: SettingsPrefs): SettingsPrefs {
  return JSON.parse(JSON.stringify(value)) as SettingsPrefs;
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "U";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 1).toUpperCase();
}

function applyPrefsToDom(
  prefs: SettingsPrefs,
  setTheme: (theme: string) => void
) {
  setTheme(prefs.theme);
  document.documentElement.dataset.density = prefs.density;

  try {
    window.localStorage.setItem("mydtu.language", prefs.language);
  } catch {}
}

async function readFileAsDataUrl(file: File, errorMessage: string) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(errorMessage));
    reader.readAsDataURL(file);
  });
}

async function loadImageFromDataUrl(dataUrl: string, errorMessage: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(errorMessage));
    img.src = dataUrl;
  });
}

async function compressAvatar(
  file: File,
  messages: {
    readError: string;
    loadError: string;
    canvasError: string;
    tooLargeError: string;
  }
) {
  const dataUrl = await readFileAsDataUrl(file, messages.readError);
  const image = await loadImageFromDataUrl(dataUrl, messages.loadError);

  const maxSize = 512;
  let width = image.width;
  let height = image.height;

  if (width > maxSize || height > maxSize) {
    const ratio = Math.min(maxSize / width, maxSize / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error(messages.canvasError);

  ctx.drawImage(image, 0, 0, width, height);

  const output = canvas.toDataURL("image/jpeg", 0.86);

  if (output.length > 2_000_000) {
    throw new Error(messages.tooLargeError);
  }

  return output;
}

export default function SettingsClient() {
  const { t, i18n } = useTranslation();
  const { setTheme, resolvedTheme } = useTheme();

  const [prefs, setPrefs] = React.useState<SettingsPrefs>(defaultSettingsPrefs);
  const [initialPrefs, setInitialPrefs] =
    React.useState<SettingsPrefs>(defaultSettingsPrefs);
  const [user, setUser] = React.useState<SettingsUser | null>(null);

  const [loading, setLoading] = React.useState(true);
  const [saveState, setSaveState] = React.useState<SaveState>("idle");
  const [message, setMessage] = React.useState("");
  const [avatarBusy, setAvatarBusy] = React.useState(false);
  const [avatarPreviewOpen, setAvatarPreviewOpen] = React.useState(false);

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState("");
  const [deletePassword, setDeletePassword] = React.useState("");
  const [deleteBusy, setDeleteBusy] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState("");
  const [logoutBusy, setLogoutBusy] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    let alive = true;

    async function bootstrap() {
      try {
        const local = readSettingsPrefs();
        if (!alive) return;

        setPrefs(local);
        setInitialPrefs(local);
        applyPrefsToDom(local, setTheme);

        if (i18n.language !== local.language) {
          await i18n.changeLanguage(local.language);
        }

        const res = await fetch("/api/settings", { cache: "no-store" });
        const json = await res.json().catch(() => null);

        if (!alive) return;

        if (res.ok && json?.ok) {
          const normalized = normalizeSettingsPrefs(json.settings);
          setPrefs(normalized);
          setInitialPrefs(normalized);
          setUser(json.user ?? null);
          writeSettingsPrefs(normalized);
          applyPrefsToDom(normalized, setTheme);

          if (i18n.language !== normalized.language) {
            await i18n.changeLanguage(normalized.language);
          }
        }
      } catch (error) {
        if (!alive) return;
        setMessage(String((error as Error)?.message || error));
      } finally {
        if (alive) setLoading(false);
      }
    }

    bootstrap();

    return () => {
      alive = false;
    };
  }, [i18n, setTheme]);

  React.useEffect(() => {
    const a = JSON.stringify(prefs);
    const b = JSON.stringify(initialPrefs);

    if (a !== b) {
      setSaveState((prev) => (prev === "saving" ? prev : "dirty"));
    } else {
      setSaveState((prev) => (prev === "saving" ? prev : "idle"));
    }
  }, [prefs, initialPrefs]);

  const saveMeta = React.useMemo(() => {
    switch (saveState) {
      case "dirty":
        return {
          label: t("settings.saveState.dirty"),
          containerClass:
            "bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning)]/15",
        };
      case "saving":
        return {
          label: t("settings.saveState.saving"),
          containerClass:
            "bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/15",
        };
      case "saved":
        return {
          label: t("settings.saveState.saved"),
          containerClass:
            "bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)]/15",
        };
      case "error":
        return {
          label: t("settings.saveState.error"),
          containerClass:
            "bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/15",
        };
      default:
        return {
          label: t("settings.saveState.stable"),
          containerClass:
            "bg-[var(--bg-soft)] app-text-soft border border-[var(--border-main)]",
        };
    }
  }, [saveState, t]);

  const initials = getInitials(user?.name, user?.email);

  function updatePrefs(updater: (prev: SettingsPrefs) => SettingsPrefs) {
    setPrefs((prev) => updater(clonePrefs(prev)));
  }

  async function handleSave() {
    try {
      setSaveState("saving");
      setMessage("");

      writeSettingsPrefs(prefs);
      applyPrefsToDom(prefs, setTheme);

      if (i18n.language !== prefs.language) {
        await i18n.changeLanguage(prefs.language);
      }

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          ...prefs,
          avatarDataUrl: user?.avatarDataUrl ?? null,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(
          json?.message || json?.error || t("settings.messages.saveFailed")
        );
      }

      const normalized = normalizeSettingsPrefs(json.settings);
      setPrefs(normalized);
      setInitialPrefs(normalized);
      setUser(json.user ?? null);

      writeSettingsPrefs(normalized);
      applyPrefsToDom(normalized, setTheme);

      if (i18n.language !== normalized.language) {
        await i18n.changeLanguage(normalized.language);
      }

      window.dispatchEvent(
        new CustomEvent("mydtu:settings-updated", {
          detail: {
            user: json.user,
            settings: normalized,
          },
        })
      );

      setSaveState("saved");
      setMessage(t("settings.messages.saveSuccess"));
    } catch (error) {
      setSaveState("error");
      setMessage(String((error as Error)?.message || error));
    }
  }

  function handleRestoreDefaults() {
    const next = clonePrefs(defaultSettingsPrefs);
    setPrefs(next);
    setMessage(t("settings.messages.restoreDefaults"));
    setSaveState("dirty");
  }

  function handleExportJson() {
    const next = clonePrefs(prefs);
    next.data.lastExportAt = new Date().toISOString();

    setPrefs(next);
    setMessage(t("settings.messages.exportedJson"));
    setSaveState("dirty");

    downloadJsonFile("mydtu-settings.json", {
      exportedAt: new Date().toISOString(),
      app: "MYDTU Assistant",
      version: "settings.v2",
      user: user
        ? {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        : null,
      prefs: next,
    });
  }

  function handleClearUiCache() {
    try {
      window.localStorage.removeItem("mydtu.settings.v1");
      window.localStorage.removeItem("mydtu.language");
      window.localStorage.removeItem("mydtu.onboarding.dismissed");
      window.localStorage.removeItem("mydtu.ui.cache");
    } catch {}

    const next = clonePrefs(defaultSettingsPrefs);
    setPrefs(next);
    setInitialPrefs(next);
    applyPrefsToDom(next, setTheme);

    setMessage(t("settings.messages.cacheCleared"));
    setSaveState("saved");
  }

  function handleQuickSync() {
    updatePrefs((prev) => {
      prev.data.lastManualSyncAt = new Date().toISOString();
      return prev;
    });

    setMessage(t("settings.messages.quickSyncSuccess"));
    setSaveState("dirty");
  }

  function handleResetOnboarding() {
    try {
      window.localStorage.removeItem("mydtu.onboarding.dismissed");
    } catch {}

    updatePrefs((prev) => {
      prev.data.onboardingDismissed = false;
      return prev;
    });

    setMessage(t("settings.messages.onboardingReset"));
    setSaveState("dirty");
  }

  async function handleLogout() {
    try {
      setLogoutBusy(true);
      setMessage("");

      const res = await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(t("settings.messages.logoutFailed"));
      }

      window.location.href = "/login";
    } catch (error) {
      setMessage(String((error as Error)?.message || error));
    } finally {
      setLogoutBusy(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE") {
      setDeleteError(t("settings.messages.deleteKeywordRequired"));
      return;
    }

    if (!deletePassword.trim()) {
      setDeleteError(t("settings.deleteModal.passwordPlaceholder"));
      return;
    }

    setDeleteBusy(true);
    setDeleteError("");
    setMessage("");

    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          confirmText: deleteConfirmText,
          password: deletePassword,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(
          json?.message ||
            json?.error ||
            t("settings.messages.deleteAccountFailed")
        );
      }

      clearSettingsPrefs();
      window.location.href = "/login";
    } catch (error) {
      setDeleteError(String((error as Error)?.message || error));
    } finally {
      setDeleteBusy(false);
    }
  }

  async function handlePickAvatar(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setAvatarBusy(true);
      setMessage("");

      if (!file.type.startsWith("image/")) {
        throw new Error(t("settings.messages.invalidImage"));
      }

      const avatarDataUrl = await compressAvatar(file, {
        readError: t("settings.messages.invalidImage"),
        loadError: t("settings.messages.invalidImage"),
        canvasError: t("settings.messages.invalidImage"),
        tooLargeError: t("settings.messages.imageTooLarge"),
      });

      setUser((prev) =>
        prev
          ? {
              ...prev,
              avatarDataUrl,
            }
          : null
      );

      setSaveState("dirty");
      setMessage(t("settings.messages.avatarSelected"));
    } catch (error) {
      setMessage(String((error as Error)?.message || error));
    } finally {
      setAvatarBusy(false);
      if (event.target) event.target.value = "";
    }
  }

  function handleRemoveAvatar() {
    setUser((prev) => (prev ? { ...prev, avatarDataUrl: null } : prev));
    setSaveState("dirty");
    setMessage(t("settings.messages.avatarRemoved"));
  }

  function handleAvatarPrimaryClick() {
    if (avatarBusy) return;

    if (user?.avatarDataUrl) {
      setAvatarPreviewOpen(true);
      return;
    }

    fileInputRef.current?.click();
  }

  function openDeleteModal() {
    setDeleteError("");
    setDeleteConfirmText("");
    setDeletePassword("");
    setDeleteOpen(true);
  }

  function closeDeleteModal() {
    if (deleteBusy) return;
    setDeleteOpen(false);
    setDeleteError("");
    setDeleteConfirmText("");
    setDeletePassword("");
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <div className="app-card rounded-3xl p-8">
          <div className="text-sm app-text-muted">{t("common.loading")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 2xl:max-w-[1180px]">
      <header className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-[2rem] font-bold tracking-tight">
            {t("settings.title")}
          </h1>
          <p className="mt-1 text-sm app-text-muted">{t("settings.subtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className={classNames(
              "rounded-2xl px-3 py-1.5 text-sm font-medium",
              saveMeta.containerClass
            )}
          >
            {t("common.status")}: {saveMeta.label}
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="app-btn-primary rounded-2xl px-4 py-1.5 text-sm font-semibold"
          >
            {t("settings.saveButton")}
          </button>
        </div>
      </header>

      {message ? (
        <div className="rounded-2xl border border-[var(--accent)]/15 bg-[var(--accent-soft)] px-4 py-2.5 text-sm text-[var(--accent)]">
          {message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <SectionCard>
           <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3.5">
                <div className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAvatarPrimaryClick}
                    disabled={avatarBusy}
                    className="group relative block rounded-[28px] transition focus-visible:outline-none"
                    title={
                      user?.avatarDataUrl
                        ? t("settings.profileCard.previewAvatar")
                        : t("settings.profileCard.chooseAvatarFromDevice")
                    }
                  >
                    {user?.avatarDataUrl ? (
                      <>
                        <img
                          src={user.avatarDataUrl}
                          alt={t("settings.profileCard.previewAvatar")}
                          className="h-20 w-20 rounded-[24px] border border-[var(--border-main)] object-cover shadow-sm transition duration-200 group-hover:scale-[1.02] group-hover:border-[var(--accent)]/40"
                        />
                        <span className="pointer-events-none absolute inset-x-0 bottom-2 mx-auto w-fit rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                          {t("settings.profileCard.previewAvatar")}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="flex h-20 w-20 items-center justify-center rounded-[24px] border border-[var(--border-main)] bg-[var(--accent-soft)] text-2xl font-bold text-[var(--accent)] shadow-sm transition duration-200 group-hover:scale-[1.02] group-hover:border-[var(--accent)]/40">
                          {initials}
                        </div>
                        <span className="pointer-events-none absolute inset-x-0 bottom-2 mx-auto w-fit rounded-full bg-[var(--accent)] px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                          {t("settings.profileCard.chooseAvatarFromDevice")}
                        </span>
                      </>
                    )}

                    <span className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[var(--bg-card-strong)] text-xs shadow-lg">
                      📷
                    </span>
                  </button>

                  <div className="max-w-[96px] text-center text-[11px] leading-4 app-text-muted">
                    {user?.avatarDataUrl
                      ? t("settings.profileCard.previewAvatar")
                      : t("settings.profileCard.chooseAvatarFromDevice")}
                  </div>

                  <input
                    id="settings-avatar-upload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    aria-label={t("settings.profileCard.chooseAvatarFromDevice")}
                    className="hidden"
                    onChange={handlePickAvatar}
                  />
                </div>

                <div>
                  <div className="text-lg font-semibold">
                    {user?.name || t("settings.profileCard.defaultName")}
                  </div>
                  <div className="mt-1 text-sm app-text-muted">
                    {user?.email || t("settings.profileCard.noEmail")}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full bg-[var(--success-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--success)]">
                      {t("settings.profileCard.activeSession")}
                    </span>
                    <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-semibold capitalize text-[var(--accent)]">
                      {user?.role || "user"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarBusy}
                  className="app-btn rounded-2xl px-4 py-2 text-sm font-semibold"
                >
                  {avatarBusy
                    ? t("common.loading")
                    : t("settings.profileCard.chooseAvatarFromDevice")}
                </button>

                {user?.avatarDataUrl ? (
                  <button
                    type="button"
                    onClick={() => setAvatarPreviewOpen(true)}
                    className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)] px-4 py-2 text-sm font-semibold"
                  >
                    {t("settings.profileCard.previewAvatar")}
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)] px-4 py-2 text-sm font-semibold"
                >
                  {t("settings.profileCard.removeAvatar")}
                </button>
              </div>
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <SectionCard
              title={t("settings.appearance.title")}
              subtitle={t("settings.appearance.subtitle")}
            >
              <div className="space-y-4">
                <FieldRow
                  label={t("settings.appearance.theme")}
                  description={t("settings.appearance.themeDescription")}
                >
                  <div className="grid grid-cols-3 gap-2">
                    <ChoiceButton
                      active={prefs.theme === "light"}
                      onClick={() =>
                        updatePrefs((prev) => {
                          prev.theme = "light";
                          return prev;
                        })
                      }
                    >
                      {t("settings.appearance.light")}
                    </ChoiceButton>
                    <ChoiceButton
                      active={prefs.theme === "dark"}
                      onClick={() =>
                        updatePrefs((prev) => {
                          prev.theme = "dark";
                          return prev;
                        })
                      }
                    >
                      {t("settings.appearance.dark")}
                    </ChoiceButton>
                    <ChoiceButton
                      active={prefs.theme === "system"}
                      onClick={() =>
                        updatePrefs((prev) => {
                          prev.theme = "system";
                          return prev;
                        })
                      }
                    >
                      {t("settings.appearance.system")}
                    </ChoiceButton>
                  </div>
                </FieldRow>

                <FieldRow
                  htmlFor="settings-language"
                  label={t("settings.appearance.language")}
                  description={t("settings.appearance.languageDescription")}
                >
                  <select
                    id="settings-language"
                    aria-label={t("settings.appearance.language")}
                    value={prefs.language}
                    onChange={(e) =>
                      updatePrefs((prev) => {
                        prev.language = e.target.value as "vi" | "en";
                        return prev;
                      })
                    }
                    className="app-input w-full rounded-2xl px-3 py-2 text-sm outline-none"
                  >
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                  </select>
                </FieldRow>

                <FieldRow
                  label={t("settings.appearance.density")}
                  description={t("settings.appearance.densityDescription")}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <ChoiceButton
                      active={prefs.density === "comfortable"}
                      onClick={() =>
                        updatePrefs((prev) => {
                          prev.density = "comfortable";
                          return prev;
                        })
                      }
                    >
                      {t("settings.appearance.comfortable")}
                    </ChoiceButton>
                    <ChoiceButton
                      active={prefs.density === "compact"}
                      onClick={() =>
                        updatePrefs((prev) => {
                          prev.density = "compact";
                          return prev;
                        })
                      }
                    >
                      {t("settings.appearance.compact")}
                    </ChoiceButton>
                  </div>
                </FieldRow>
              </div>
            </SectionCard>

            <SectionCard
              title={t("settings.notifications.title")}
              subtitle={t("settings.notifications.subtitle")}
            >
              <div className="space-y-3">
                <ToggleRow
                  label={t("settings.notifications.emailAlerts")}
                  description={t("settings.notifications.emailAlertsDesc")}
                  checked={prefs.notifications.emailAlerts}
                  onChange={(checked) =>
                    updatePrefs((prev) => {
                      prev.notifications.emailAlerts = checked;
                      return prev;
                    })
                  }
                />
                <ToggleRow
                  label={t("settings.notifications.webPush")}
                  description={t("settings.notifications.webPushDesc")}
                  checked={prefs.notifications.webPush}
                  onChange={(checked) =>
                    updatePrefs((prev) => {
                      prev.notifications.webPush = checked;
                      return prev;
                    })
                  }
                />
                <ToggleRow
                  label={t("settings.notifications.timetableReminders")}
                  description={t("settings.notifications.timetableRemindersDesc")}
                  checked={prefs.notifications.timetableReminders}
                  onChange={(checked) =>
                    updatePrefs((prev) => {
                      prev.notifications.timetableReminders = checked;
                      return prev;
                    })
                  }
                />
                <ToggleRow
                  label={t("settings.notifications.deadlineReminders")}
                  description={t("settings.notifications.deadlineRemindersDesc")}
                  checked={prefs.notifications.deadlineReminders}
                  onChange={(checked) =>
                    updatePrefs((prev) => {
                      prev.notifications.deadlineReminders = checked;
                      return prev;
                    })
                  }
                />
                <ToggleRow
                  label={t("settings.notifications.gradeAlerts")}
                  description={t("settings.notifications.gradeAlertsDesc")}
                  checked={prefs.notifications.gradeAlerts}
                  onChange={(checked) =>
                    updatePrefs((prev) => {
                      prev.notifications.gradeAlerts = checked;
                      return prev;
                    })
                  }
                />
                <ToggleRow
                  label={t("settings.notifications.weeklySummary")}
                  description={t("settings.notifications.weeklySummaryDesc")}
                  checked={prefs.notifications.weeklySummary}
                  onChange={(checked) =>
                    updatePrefs((prev) => {
                      prev.notifications.weeklySummary = checked;
                      return prev;
                    })
                  }
                />
              </div>
            </SectionCard>
          </div>

          <SectionCard
            title={t("settings.dataSync.title")}
            subtitle={t("settings.dataSync.subtitle")}
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <InfoBox
                title={t("settings.dataSync.lastManualSync")}
                value={formatDateTime(prefs.data.lastManualSyncAt)}
              />
              <InfoBox
                title={t("settings.dataSync.lastExportJson")}
                value={formatDateTime(prefs.data.lastExportAt)}
              />
              <InfoBox
                title={t("settings.dataSync.onboarding")}
                value={
                  prefs.data.onboardingDismissed
                    ? t("settings.dataSync.onboardingDisabled")
                    : t("settings.dataSync.onboardingEnabled")
                }
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <ActionButton primary onClick={handleQuickSync}>
                {t("settings.dataSync.syncNow")}
              </ActionButton>

              <ActionButton onClick={handleExportJson}>
                {t("settings.dataSync.exportJson")}
              </ActionButton>

              <ActionButton dangerSoft onClick={handleClearUiCache}>
                {t("settings.dataSync.clearLocalCache")}
              </ActionButton>

              <ActionButton onClick={handleResetOnboarding}>
                {t("settings.dataSync.resetOnboarding")}
              </ActionButton>

              <ActionButton onClick={handleRestoreDefaults}>
                {t("settings.dataSync.restoreDefaults")}
              </ActionButton>
            </div>

            <p className="mt-4 text-sm app-text-muted">
              {t("settings.dataSync.hint")}
            </p>
          </SectionCard>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <SectionCard
              title={t("settings.privacy.title")}
              subtitle={t("settings.privacy.subtitle")}
            >
              <div className="space-y-3">
                <ToggleRow
                  label={t("settings.privacy.rememberDevice")}
                  description={t("settings.privacy.rememberDeviceDesc")}
                  checked={prefs.privacy.rememberDevice}
                  onChange={(checked) =>
                    updatePrefs((prev) => {
                      prev.privacy.rememberDevice = checked;
                      return prev;
                    })
                  }
                />
                <ToggleRow
                  label={t("settings.privacy.analyticsOptIn")}
                  description={t("settings.privacy.analyticsOptInDesc")}
                  checked={prefs.privacy.analyticsOptIn}
                  onChange={(checked) =>
                    updatePrefs((prev) => {
                      prev.privacy.analyticsOptIn = checked;
                      return prev;
                    })
                  }
                />
              </div>

              <div className="mt-4 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)] p-4 text-sm app-text-muted">
                {t("settings.privacy.avatarStorageHint")}
              </div>
            </SectionCard>

            <SectionCard
              title={t("settings.appInfo.title")}
              subtitle={t("settings.appInfo.subtitle")}
            >
              <div className="grid grid-cols-1 gap-3">
                <InfoLine
                  label={t("settings.appInfo.dataSource")}
                  value={t("settings.appInfo.dataSourceValue")}
                />
                <InfoLine
                  label={t("settings.appInfo.uiEngine")}
                  value={t("settings.appInfo.uiEngineValue")}
                />
                <InfoLine
                  label={t("settings.appInfo.renderedTheme")}
                  value={resolvedTheme || "dark"}
                />
                <InfoLine
                  label={t("settings.appInfo.settingsVersion")}
                  value="v2.0"
                />
              </div>

              <div className="mt-4 rounded-2xl border border-[var(--accent)]/15 bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent)]">
                {t("settings.appInfo.dataProvenance")}
              </div>
            </SectionCard>
          </div>

          <SectionCard
            title={t("settings.dangerZone.title")}
            subtitle={t("settings.dangerZone.subtitle")}
          >
            <div className="rounded-2xl border border-red-500/15 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
              Bạn đang ở khu vực thao tác nhạy cảm. Đăng xuất sẽ kết thúc phiên hiện tại, còn xóa tài khoản sẽ xóa toàn bộ dữ liệu liên quan và không thể hoàn tác.
            </div>

            <div className="mt-4 flex flex-col gap-3 lg:flex-row">
              <button
                type="button"
                onClick={handleLogout}
                disabled={logoutBusy}
                className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-semibold transition hover:opacity-90 disabled:opacity-60"
              >
                {logoutBusy
                  ? t("common.loading")
                  : t("settings.dangerZone.logout")}
              </button>

              <button
                type="button"
                onClick={openDeleteModal}
                className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                {t("settings.dangerZone.deleteAccount")}
              </button>
            </div>

            <p className="mt-4 text-sm app-text-muted">
              {t("settings.dangerZone.hint")}
            </p>
          </SectionCard>
        </div>

        <div className="space-y-5">
          <SectionCard title={t("settings.quickOverview.title")}>
            <div className="grid grid-cols-1 gap-3">
              <QuickInfoCard
                label={t("settings.quickOverview.theme")}
                value={
                  prefs.theme === "dark"
                    ? t("settings.appearance.dark")
                    : prefs.theme === "light"
                    ? t("settings.appearance.light")
                    : t("settings.appearance.system")
                }
              />
              <QuickInfoCard
                label={t("settings.quickOverview.language")}
                value={prefs.language === "vi" ? "Tiếng Việt" : "English"}
              />
              <QuickInfoCard
                label={t("settings.quickOverview.density")}
                value={
                  prefs.density === "comfortable"
                    ? t("settings.appearance.comfortable")
                    : t("settings.appearance.compact")
                }
              />
              <QuickInfoCard
                label={t("settings.quickOverview.emailAlerts")}
                value={
                  prefs.notifications.emailAlerts
                    ? t("common.on")
                    : t("common.off")
                }
              />
              <QuickInfoCard
                label={t("settings.quickOverview.webPush")}
                value={
                  prefs.notifications.webPush
                    ? t("common.on")
                    : t("common.off")
                }
              />
            </div>
          </SectionCard>

          <SectionCard title={t("settings.checklist.title")}>
            <div className="space-y-3 text-sm">
              <ChecklistItem done>
                {t("settings.checklist.themeModes")}
              </ChecklistItem>
              <ChecklistItem done>
                {t("settings.checklist.localFallback")}
              </ChecklistItem>
              <ChecklistItem done>
                {t("settings.checklist.dbLoadSave")}
              </ChecklistItem>
              <ChecklistItem done>
                {t("settings.checklist.avatarFromDevice")}
              </ChecklistItem>
              <ChecklistItem done>
                {t("settings.checklist.avatarPreview")}
              </ChecklistItem>
              <ChecklistItem done>
                {t("settings.checklist.dangerZone")}
              </ChecklistItem>
              <ChecklistItem>
                {t("settings.checklist.webPushPermission")}
              </ChecklistItem>
              <ChecklistItem>
                {t("settings.checklist.reAuthDelete")}
              </ChecklistItem>
            </div>
          </SectionCard>
        </div>
      </div>

      {avatarPreviewOpen && user?.avatarDataUrl ? (
        <ImagePreviewModal
          src={user.avatarDataUrl}
          title={t("settings.profileCard.previewAvatar")}
          closeText={t("common.close")}
          onClose={() => setAvatarPreviewOpen(false)}
        />
      ) : null}

      {deleteOpen ? (
        <ConfirmDeleteModal
          title={t("settings.deleteModal.title")}
          description={t("settings.deleteModal.description")}
          confirmNotice={t("settings.deleteModal.typeDeleteToConfirm")}
          confirmText={deleteConfirmText}
          password={deletePassword}
          error={deleteError}
          busy={deleteBusy}
          onChangeConfirmText={(value) => {
            setDeleteConfirmText(value);
            if (deleteError) setDeleteError("");
          }}
          onChangePassword={(value) => {
            setDeletePassword(value);
            if (deleteError) setDeleteError("");
          }}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteAccount}
          confirmFieldLabel={t("settings.deleteModal.typeDeleteToConfirm")}
          confirmPlaceholder={t("settings.deleteModal.confirmPlaceholder")}
          passwordLabel={t("settings.deleteModal.passwordLabel")}
          passwordPlaceholder={t("settings.deleteModal.passwordPlaceholder")}
          cancelText={t("settings.deleteModal.cancel")}
          confirmButtonText={t("settings.deleteModal.confirmDelete")}
          processingText={t("settings.deleteModal.processing")}
        />
      ) : null}
    </div>
  );
}

function SectionCard({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="app-card rounded-3xl p-5">
      {title ? (
        <div className="mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm app-text-muted">{subtitle}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function FieldRow({
  label,
  description,
  htmlFor,
  children,
}: {
  label: string;
  description?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        {htmlFor ? (
          <label htmlFor={htmlFor} className="text-sm font-semibold">
            {label}
          </label>
        ) : (
          <div className="text-sm font-semibold">{label}</div>
        )}
        {description ? (
          <div className="text-sm app-text-muted">{description}</div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function ChoiceButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        "rounded-2xl border px-3 py-2 text-sm font-medium transition",
        active
          ? "border-[var(--accent)] bg-[var(--accent)] text-white"
          : "border-[var(--border-main)] bg-[var(--bg-soft)] app-text-soft"
      )}
    >
      {children}
    </button>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const switchId = React.useId();

  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)] px-4 py-3">
      <div className="min-w-0 flex-1">
        <label htmlFor={switchId} className="cursor-pointer text-sm font-semibold">
          {label}
        </label>
        {description ? (
          <div className="mt-1 text-sm app-text-muted">{description}</div>
        ) : null}
      </div>

      <label
        htmlFor={switchId}
        className="relative mt-0.5 inline-flex cursor-pointer items-center"
      >
        <input
          id={switchId}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
          aria-label={label}
        />
        <span className="block h-7 w-12 rounded-full bg-slate-400/35 transition peer-checked:bg-[var(--accent)]" />
        <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:left-6" />
      </label>
    </div>
  );
}

function InfoBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)] p-4">
      <div className="text-xs uppercase tracking-wide app-text-muted">
        {title}
      </div>
      <div className="mt-2 text-sm font-semibold">{value}</div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  primary,
  dangerSoft,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  dangerSoft?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        "rounded-2xl px-4 py-2.5 text-sm font-semibold transition hover:opacity-90",
        primary
          ? "bg-[var(--accent)] text-white"
          : dangerSoft
          ? "border border-red-500/15 bg-[var(--danger-soft)] text-[var(--danger)]"
          : "border border-[var(--border-main)] bg-[var(--bg-soft)] text-[var(--text-main)]"
      )}
    >
      {children}
    </button>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)] px-4 py-3">
      <div className="text-sm app-text-muted">{label}</div>
      <div className="text-right text-sm font-semibold">{value}</div>
    </div>
  );
}

function QuickInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-card-strong rounded-2xl p-3">
      <div className="text-xs uppercase tracking-wide app-text-muted">
        {label}
      </div>
      <div className="mt-1 text-base font-semibold">{value}</div>
    </div>
  );
}

function ChecklistItem({
  children,
  done,
}: {
  children: React.ReactNode;
  done?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)] px-4 py-3">
      <div
        className={classNames(
          "mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold",
          done
            ? "bg-[var(--success-soft)] text-[var(--success)]"
            : "bg-[var(--warning-soft)] text-[var(--warning)]"
        )}
      >
        {done ? "✓" : "!"}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function ImagePreviewModal({
  src,
  title,
  closeText,
  onClose,
}: {
  src: string;
  title: string;
  closeText: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-3 py-2 text-sm font-semibold text-white"
        >
          {closeText}
        </button>
        <img
          src={src}
          alt={title}
          className="max-h-[90vh] max-w-[90vw] rounded-3xl object-contain shadow-2xl"
        />
      </div>
    </div>
  );
}

function ConfirmDeleteModal({
  title,
  description,
  confirmNotice,
  confirmText,
  password,
  error,
  busy,
  onChangeConfirmText,
  onChangePassword,
  onClose,
  onConfirm,
  confirmFieldLabel,
  confirmPlaceholder,
  passwordLabel,
  passwordPlaceholder,
  cancelText,
  confirmButtonText,
  processingText,
}: {
  title: string;
  description: string;
  confirmNotice: string;
  confirmText: string;
  password: string;
  error?: string;
  busy: boolean;
  onChangeConfirmText: (value: string) => void;
  onChangePassword: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  confirmFieldLabel: string;
  confirmPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  cancelText: string;
  confirmButtonText: string;
  processingText: string;
}) {
  const keywordValid = confirmText.trim().toUpperCase() === "DELETE";
  const passwordValid = Boolean(password.trim());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
      aria-describedby="delete-account-description"
    >
      <div className="w-full max-w-lg rounded-[28px] border border-[var(--border-main)] bg-[var(--bg-card-strong)] p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--danger-soft)] text-xl text-[var(--danger)]">
            !
          </div>
          <div className="flex-1">
            <h3 id="delete-account-title" className="text-xl font-semibold">
              {title}
            </h3>
            <p
              id="delete-account-description"
              className="mt-1 text-sm app-text-muted"
            >
              {description}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-red-500/15 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
          <div className="font-semibold">
            Bạn có chắc chắn muốn xóa tài khoản này?
          </div>
          <div className="mt-1">
            Hành động này sẽ xóa dữ liệu gắn với tài khoản hiện tại và không thể hoàn tác.
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)] px-4 py-3 text-sm app-text-soft">
          {confirmNotice}
        </div>

        <form
          className="mt-4 space-y-3"
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy && keywordValid && passwordValid) {
              onConfirm();
            }
          }}
        >
          <input
            type="text"
            name="username"
            autoComplete="username"
            tabIndex={-1}
            className="hidden"
            aria-hidden="true"
          />
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            tabIndex={-1}
            className="hidden"
            aria-hidden="true"
          />

          <div>
            <label
              htmlFor="delete-account-confirm"
              className="mb-1 block text-sm font-medium"
            >
              {confirmFieldLabel}
            </label>
            <input
              id="delete-account-confirm"
              name="delete_account_confirm_text"
              type="text"
              inputMode="text"
              value={confirmText}
              onChange={(e) => onChangeConfirmText(e.target.value)}
              placeholder={confirmPlaceholder}
              autoComplete="one-time-code"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              className={classNames(
                "app-input w-full rounded-2xl px-3 py-3 text-sm outline-none",
                confirmText && !keywordValid && "app-input-error"
              )}
            />
            {confirmText && !keywordValid ? (
              <p className="mt-2 text-sm text-[var(--danger)]">
                Bạn phải nhập chính xác từ DELETE để tiếp tục.
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="delete-account-password"
              className="mb-1 block text-sm font-medium"
            >
              {passwordLabel}
            </label>
            <input
              id="delete-account-password"
              name="delete_account_password"
              type="password"
              value={password}
              onChange={(e) => onChangePassword(e.target.value)}
              placeholder={passwordPlaceholder}
              autoComplete="current-password"
              data-lpignore="true"
              data-form-type="other"
              className={classNames(
                "app-input w-full rounded-2xl px-3 py-3 text-sm outline-none",
                error && "app-input-error"
              )}
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-500/20 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
              {error}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-semibold disabled:opacity-60"
            >
              {cancelText}
            </button>

            <button
              type="submit"
              disabled={busy || !keywordValid || !passwordValid}
              className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? processingText : confirmButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}