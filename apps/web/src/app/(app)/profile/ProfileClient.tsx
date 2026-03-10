// path: apps/web/src/app/(app)/profile/ProfileClient.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type ProfileUser = {
  id: string;
  email: string;
  name: string | null;
  role: "user" | "admin";
  schoolType?: string | null;
  birthDate?: string | null;
  placeOfBirth?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  avatarDataUrl?: string | null;
};

type EditableField =
  | "name"
  | "birthDate"
  | "placeOfBirth"
  | "schoolType"
  | null;

function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "U";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 1).toUpperCase();
}

function formatDate(value?: string | null, locale = "vi-VN") {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(d);
}

function formatDateTime(value?: string | null, locale = "vi-VN") {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

function humanizeSchoolType(
  value?: string | null,
  t?: (key: string) => string
) {
  switch (value) {
    case "university":
      return t ? t("auth.schoolType.university") : "University";
    case "college":
      return t ? t("auth.schoolType.college") : "College";
    case "highschool":
      return t ? t("auth.schoolType.highschool") : "High school";
    case "other":
      return t ? t("auth.schoolType.other") : "Other";
    default:
      return "-";
  }
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

export default function ProfileClient() {
  const { t, i18n } = useTranslation();

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [editingField, setEditingField] = useState<EditableField>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (!alive) return;
        setUser(json?.user ?? null);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, []);

  const initials = useMemo(
    () => getInitials(user?.name, user?.email),
    [user?.name, user?.email]
  );

  function startEdit(field: EditableField, value?: string | null) {
    if (!field) return;
    setEditingField(field);
    setDraft((prev) => ({
      ...prev,
      [field]: value ?? "",
    }));
    setError("");
    setMessage("");
  }

  function cancelEdit() {
    setEditingField(null);
    setError("");
  }

  async function saveField(field: EditableField) {
    if (!field) return;
    setError("");
    setMessage("");

    try {
      const payload: Record<string, unknown> = {
        [field]: draft[field] ?? "",
      };

      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.message || t("profile.messages.saveFailed"));
      }

      setUser(json.user ?? null);
      setEditingField(null);
      setMessage(t("profile.messages.saveSuccess"));
    } catch (err) {
      setError(String((err as Error)?.message || err));
    }
  }

  async function handlePickAvatar(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setAvatarBusy(true);
      setError("");
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

      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          avatarDataUrl,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(
          json?.message || t("profile.messages.avatarSaveFailed")
        );
      }

      setUser(json.user ?? null);
      setMessage(t("profile.messages.avatarSaved"));
    } catch (err) {
      setError(String((err as Error)?.message || err));
    } finally {
      setAvatarBusy(false);
      if (event.target) event.target.value = "";
    }
  }

  async function handleRemoveAvatar() {
    try {
      setAvatarBusy(true);
      setError("");
      setMessage("");

      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          avatarDataUrl: null,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(
          json?.message || t("profile.messages.avatarRemoveFailed")
        );
      }

      setUser(json.user ?? null);
      setMessage(t("profile.messages.avatarRemoved"));
    } catch (err) {
      setError(String((err as Error)?.message || err));
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleChangePassword() {
    setPasswordError("");
    setMessage("");

    if (!passwordForm.currentPassword.trim()) {
      setPasswordError(t("profile.messages.currentPasswordRequired"));
      return;
    }

    if (
      !passwordForm.newPassword.trim() ||
      passwordForm.newPassword.length < 6
    ) {
      setPasswordError(t("auth.errors.passwordMin"));
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t("auth.errors.passwordConfirmMismatch"));
      return;
    }

    try {
      setPasswordBusy(true);

      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(
          json?.message || t("profile.messages.passwordChangeFailed")
        );
      }

      setPasswordOpen(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setMessage(t("profile.messages.passwordChanged"));
    } catch (err) {
      setPasswordError(String((err as Error)?.message || err));
    } finally {
      setPasswordBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="app-card rounded-3xl p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-40 rounded bg-white/10" />
            <div className="h-24 w-full rounded-2xl bg-white/10" />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="h-64 rounded-3xl bg-white/10" />
              <div className="h-64 rounded-3xl bg-white/10" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="app-card rounded-3xl p-6">
          <div className="text-lg font-semibold">
            {t("profile.messages.loadFailedTitle")}
          </div>
          <p className="mt-2 text-sm app-text-muted">
            {t("profile.messages.loadFailedSubtitle")}
          </p>
        </div>
      </div>
    );
  }

  const locale = i18n.language === "en" ? "en-US" : "vi-VN";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4" style={{ maxWidth: 1180 }}>
      {message ? (
        <div className="rounded-2xl border border-[var(--success)]/15 bg-[var(--success-soft)] px-4 py-3 text-sm text-[var(--success)]">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-[var(--danger)]/15 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      ) : null}

      <section className="app-card rounded-3xl p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  user.avatarDataUrl
                    ? setAvatarPreviewOpen(true)
                    : fileInputRef.current?.click()
                }
                disabled={avatarBusy}
                className="group relative rounded-[24px]"
                aria-label={
                  user.avatarDataUrl
                    ? t("settings.profileCard.previewAvatar")
                    : t("profile.changeAvatar")
                }
                title={
                  user.avatarDataUrl
                    ? t("settings.profileCard.previewAvatar")
                    : t("profile.changeAvatar")
                }
              >
                {user.avatarDataUrl ? (
                  <img
                    src={user.avatarDataUrl}
                    alt={t("settings.profileCard.previewAvatar")}
                    className="h-20 w-20 rounded-[24px] border border-[var(--border-main)] object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-[24px] border border-[var(--border-main)] bg-[var(--accent-soft)] text-2xl font-bold text-[var(--accent)]">
                    {initials}
                  </div>
                )}

                <span className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[var(--bg-card-strong)] text-xs shadow-lg">
                  📷
                </span>
              </button>

              <div className="max-w-[110px] text-center text-[11px] leading-4 app-text-muted">
                {t("profile.avatarHint")}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePickAvatar}
                aria-label={t("profile.changeAvatar")}
                title={t("profile.changeAvatar")}
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {user.name || t("settings.profileCard.defaultName")}
              </h1>
              <p className="mt-1 text-sm app-text-muted">{user.email}</p>

              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold capitalize text-[var(--accent)]">
                  {user.role}
                </span>
                <span className="inline-flex rounded-full bg-[var(--success-soft)] px-3 py-1 text-xs font-semibold text-[var(--success)]">
                  {t("profile.active")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarBusy}
              className="app-btn rounded-2xl px-4 py-2 text-sm font-semibold"
            >
              {avatarBusy ? t("common.loading") : t("profile.changeAvatar")}
            </button>

            {user.avatarDataUrl ? (
              <>
                <button
                  type="button"
                  onClick={() => setAvatarPreviewOpen(true)}
                  className="app-btn rounded-2xl px-4 py-2 text-sm font-semibold"
                >
                  {t("common.preview")}
                </button>
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={avatarBusy}
                  className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)] px-4 py-2 text-sm font-semibold"
                >
                  {t("common.remove")}
                </button>
              </>
            ) : null}

            <button
              type="button"
              onClick={() => {
                setPasswordError("");
                setPasswordOpen(true);
              }}
              className="app-btn-primary rounded-2xl px-4 py-2 text-sm font-semibold"
            >
              {t("profile.changePassword")}
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="app-card rounded-3xl p-5">
          <h2 className="text-[1.05rem] font-semibold">
            {t("profile.basicInfo")}
          </h2>

          <div className="mt-4 space-y-3">
            <EditableInfoRow
              label={t("profile.fullName")}
              value={user.name || ""}
              displayValue={user.name || "-"}
              field="name"
              editingField={editingField}
              startEdit={startEdit}
              cancelEdit={cancelEdit}
              saveField={saveField}
              draftValue={draft.name ?? ""}
              onDraftChange={(value) =>
                setDraft((prev) => ({ ...prev, name: value }))
              }
            />

            <StaticInfoRow label={t("profile.email")} value={user.email} />

            <EditableSelectRow
              label={t("profile.schoolType")}
              field="schoolType"
              editingField={editingField}
              startEdit={startEdit}
              cancelEdit={cancelEdit}
              saveField={saveField}
              value={user.schoolType || ""}
              displayValue={humanizeSchoolType(user.schoolType, t)}
              draftValue={draft.schoolType ?? user.schoolType ?? ""}
              onDraftChange={(value) =>
                setDraft((prev) => ({ ...prev, schoolType: value }))
              }
              options={[
                { value: "university", label: t("auth.schoolType.university") },
                { value: "college", label: t("auth.schoolType.college") },
                { value: "highschool", label: t("auth.schoolType.highschool") },
                { value: "other", label: t("auth.schoolType.other") },
              ]}
            />

            <EditableInfoRow
              label={t("profile.birthDate")}
              value={user.birthDate || ""}
              displayValue={formatDate(user.birthDate, locale)}
              field="birthDate"
              type="date"
              editingField={editingField}
              startEdit={startEdit}
              cancelEdit={cancelEdit}
              saveField={saveField}
              draftValue={
                draft.birthDate ??
                (user.birthDate ? user.birthDate.slice(0, 10) : "")
              }
              onDraftChange={(value) =>
                setDraft((prev) => ({ ...prev, birthDate: value }))
              }
            />

            <EditableInfoRow
              label={t("profile.placeOfBirth")}
              value={user.placeOfBirth || ""}
              displayValue={user.placeOfBirth || "-"}
              field="placeOfBirth"
              editingField={editingField}
              startEdit={startEdit}
              cancelEdit={cancelEdit}
              saveField={saveField}
              draftValue={draft.placeOfBirth ?? ""}
              onDraftChange={(value) =>
                setDraft((prev) => ({ ...prev, placeOfBirth: value }))
              }
            />
          </div>
        </section>

        <section className="app-card rounded-3xl p-5">
          <h2 className="text-[1.05rem] font-semibold">
            {t("profile.accountInfo")}
          </h2>

          <div className="mt-4 space-y-3">
            <StaticInfoRow label={t("profile.role")} value={user.role} />
            <StaticInfoRow
              label={t("profile.joinedAt")}
              value={formatDateTime(user.createdAt, locale)}
            />
            <StaticInfoRow
              label={t("profile.lastUpdated")}
              value={formatDateTime(user.updatedAt, locale)}
            />
            <StaticInfoRow label="User ID" value={user.id} />
          </div>
        </section>
      </div>

      {avatarPreviewOpen && user.avatarDataUrl ? (
        <ImagePreviewModal
          src={user.avatarDataUrl}
          title={t("settings.profileCard.previewAvatar")}
          closeText={t("common.close")}
          onClose={() => setAvatarPreviewOpen(false)}
        />
      ) : null}

      {passwordOpen ? (
        <PasswordModal
          title={t("profile.changePassword")}
          currentPasswordLabel={t("profile.currentPassword")}
          newPasswordLabel={t("profile.newPassword")}
          confirmPasswordLabel={t("profile.confirmNewPassword")}
          currentPasswordPlaceholder={t("profile.currentPasswordPlaceholder")}
          newPasswordPlaceholder={t("profile.newPasswordPlaceholder")}
          confirmPasswordPlaceholder={t(
            "profile.confirmNewPasswordPlaceholder"
          )}
          cancelText={t("common.cancel")}
          saveText={t("common.save")}
          busy={passwordBusy}
          error={passwordError}
          values={passwordForm}
          onChange={(next) => setPasswordForm(next)}
          onClose={() => {
            if (!passwordBusy) {
              setPasswordOpen(false);
              setPasswordError("");
              setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
              });
            }
          }}
          onSave={handleChangePassword}
        />
      ) : null}
    </div>
  );
}

function StaticInfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)] px-4 py-3">
      <div className="text-sm app-text-muted">{label}</div>
      <div className="max-w-[60%] text-right text-sm font-semibold">
        {value}
      </div>
    </div>
  );
}

function EditableInfoRow({
  label,
  field,
  value,
  displayValue,
  draftValue,
  onDraftChange,
  editingField,
  startEdit,
  cancelEdit,
  saveField,
  type = "text",
}: {
  label: string;
  field: EditableField;
  value: string;
  displayValue: string;
  draftValue: string;
  onDraftChange: (value: string) => void;
  editingField: EditableField;
  startEdit: (field: EditableField, value?: string | null) => void;
  cancelEdit: () => void;
  saveField: (field: EditableField) => void;
  type?: string;
}) {
  const isEditing = editingField === field;
  const inputId = field ? `profile-field-${field}` : undefined;

  return (
    <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)] px-4 py-3">
      {!isEditing ? (
        <div className="flex items-start justify-between gap-3">
          <div className="text-sm app-text-muted">{label}</div>
          <div className="flex items-center gap-3">
            <div className="max-w-[260px] text-right text-sm font-semibold">
              {displayValue}
            </div>
            <button
              type="button"
              onClick={() => startEdit(field, value)}
              className="rounded-full border border-[var(--border-main)] bg-[var(--bg-card)] px-2.5 py-1 text-xs font-semibold transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
              aria-label={`Edit ${label}`}
              title={`Edit ${label}`}
            >
              →
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <label htmlFor={inputId} className="block text-sm font-semibold">
            {label}
          </label>

          <input
            id={inputId}
            type={type}
            value={draftValue}
            onChange={(e) => onDraftChange(e.target.value)}
            aria-label={label}
            className="app-input w-full rounded-2xl px-3 py-2.5 text-sm outline-none"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={cancelEdit}
              className="app-btn rounded-2xl px-4 py-2 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => saveField(field)}
              className="app-btn-primary rounded-2xl px-4 py-2 text-sm font-semibold"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EditableSelectRow({
  label,
  field,
  value,
  displayValue,
  draftValue,
  onDraftChange,
  editingField,
  startEdit,
  cancelEdit,
  saveField,
  options,
}: {
  label: string;
  field: EditableField;
  value: string;
  displayValue: string;
  draftValue: string;
  onDraftChange: (value: string) => void;
  editingField: EditableField;
  startEdit: (field: EditableField, value?: string | null) => void;
  cancelEdit: () => void;
  saveField: (field: EditableField) => void;
  options: Array<{ value: string; label: string }>;
}) {
  const isEditing = editingField === field;
  const selectId = field ? `profile-select-${field}` : undefined;

  return (
    <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)] px-4 py-3">
      {!isEditing ? (
        <div className="flex items-start justify-between gap-3">
          <div className="text-sm app-text-muted">{label}</div>
          <div className="flex items-center gap-3">
            <div className="max-w-[260px] text-right text-sm font-semibold">
              {displayValue}
            </div>
            <button
              type="button"
              onClick={() => startEdit(field, value)}
              className="rounded-full border border-[var(--border-main)] bg-[var(--bg-card)] px-2.5 py-1 text-xs font-semibold transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
              aria-label={`Edit ${label}`}
              title={`Edit ${label}`}
            >
              →
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <label htmlFor={selectId} className="block text-sm font-semibold">
            {label}
          </label>

          <select
            id={selectId}
            value={draftValue}
            onChange={(e) => onDraftChange(e.target.value)}
            aria-label={label}
            className="app-input w-full rounded-2xl px-3 py-2.5 text-sm outline-none"
          >
            {options.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={cancelEdit}
              className="app-btn rounded-2xl px-4 py-2 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => saveField(field)}
              className="app-btn-primary rounded-2xl px-4 py-2 text-sm font-semibold"
            >
              Save
            </button>
          </div>
        </div>
      )}
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

function PasswordModal({
  title,
  currentPasswordLabel,
  newPasswordLabel,
  confirmPasswordLabel,
  currentPasswordPlaceholder,
  newPasswordPlaceholder,
  confirmPasswordPlaceholder,
  cancelText,
  saveText,
  busy,
  error,
  values,
  onChange,
  onClose,
  onSave,
}: {
  title: string;
  currentPasswordLabel: string;
  newPasswordLabel: string;
  confirmPasswordLabel: string;
  currentPasswordPlaceholder: string;
  newPasswordPlaceholder: string;
  confirmPasswordPlaceholder: string;
  cancelText: string;
  saveText: string;
  busy: boolean;
  error: string;
  values: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  onChange: (next: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const currentPasswordId = "profile-current-password";
  const newPasswordId = "profile-new-password";
  const confirmPasswordId = "profile-confirm-password";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4">
      <div className="w-full max-w-lg rounded-[28px] border border-[var(--border-main)] bg-[var(--bg-card-strong)] p-5 shadow-2xl">
        <h3 className="text-xl font-semibold">{title}</h3>

        <div className="mt-4 space-y-3">
          <div>
            <label
              htmlFor={currentPasswordId}
              className="mb-1 block text-sm font-medium"
            >
              {currentPasswordLabel}
            </label>
            <input
              id={currentPasswordId}
              type="password"
              value={values.currentPassword}
              onChange={(e) =>
                onChange({ ...values, currentPassword: e.target.value })
              }
              placeholder={currentPasswordPlaceholder}
              aria-label={currentPasswordLabel}
              className="app-input w-full rounded-2xl px-3 py-3 text-sm outline-none"
            />
          </div>

          <div>
            <label
              htmlFor={newPasswordId}
              className="mb-1 block text-sm font-medium"
            >
              {newPasswordLabel}
            </label>
            <input
              id={newPasswordId}
              type="password"
              value={values.newPassword}
              onChange={(e) =>
                onChange({ ...values, newPassword: e.target.value })
              }
              placeholder={newPasswordPlaceholder}
              aria-label={newPasswordLabel}
              className="app-input w-full rounded-2xl px-3 py-3 text-sm outline-none"
            />
          </div>

          <div>
            <label
              htmlFor={confirmPasswordId}
              className="mb-1 block text-sm font-medium"
            >
              {confirmPasswordLabel}
            </label>
            <input
              id={confirmPasswordId}
              type="password"
              value={values.confirmPassword}
              onChange={(e) =>
                onChange({ ...values, confirmPassword: e.target.value })
              }
              placeholder={confirmPasswordPlaceholder}
              aria-label={confirmPasswordLabel}
              className="app-input w-full rounded-2xl px-3 py-3 text-sm outline-none"
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-500/20 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="app-btn rounded-2xl px-4 py-2 text-sm font-semibold"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={busy}
              className="app-btn-primary rounded-2xl px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {busy ? "..." : saveText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}