// apps/web/src/app/(auth)/register/page.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiCheckEmail, apiRegister } from "@/lib/api/authClient";
import { allowedDomainHint, isAllowedEmailDomain, isValidEmailFormat } from "@/lib/auth/emailRules";

type SchoolType = "university" | "college" | "highschool" | "other";

export default function RegisterPage() {
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [schoolType, setSchoolType] = useState<SchoolType>("university");
  const [birthDate, setBirthDate] = useState("");
  const [placeOfBirth, setPlaceOfBirth] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailHint, setEmailHint] = useState<string | null>(null);
  const [pwdHint, setPwdHint] = useState<string | null>(null);
  const [confirmHint, setConfirmHint] = useState<string | null>(null);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emailTrim = email.trim().toLowerCase();

  const passwordOk = useMemo(() => password.length >= 6, [password]);
  const confirmOk = useMemo(
    () => confirmPassword === password && confirmPassword.length > 0,
    [confirmPassword, password]
  );

  const emailLocalValidate = () => {
    if (!emailTrim) return t("auth.errors.emailRequired");
    if (!isValidEmailFormat(emailTrim)) return t("auth.errors.emailInvalid");
    if (!isAllowedEmailDomain(emailTrim)) return t("auth.errors.emailDomainNotAllowed");
    return null;
  };

  const onBlurEmail = async () => {
    setSubmitError(null);

    const localErr = emailLocalValidate();
    if (localErr) {
      setEmailHint(localErr);
      return;
    }

    const r = await apiCheckEmail(emailTrim);
    if (r.ok && !r.available) {
      if (r.reason === "domain_not_allowed") setEmailHint(t("auth.errors.emailDomainNotAllowed"));
      else if (r.reason === "invalid_email") setEmailHint(t("auth.errors.emailInvalid"));
      else setEmailHint(t("auth.errors.emailExists"));
      return;
    }

    setEmailHint(null);
  };

  const onChangePassword = (v: string) => {
    setPassword(v);
    setSubmitError(null);

    if (v.length > 0 && v.length < 6) setPwdHint(t("auth.errors.passwordMin"));
    else setPwdHint(null);

    if (confirmPassword.length > 0 && confirmPassword !== v) {
      setConfirmHint(t("auth.errors.passwordConfirmMismatch"));
    } else {
      setConfirmHint(null);
    }
  };

  const onChangeConfirm = (v: string) => {
    setConfirmPassword(v);
    setSubmitError(null);

    if (v.length > 0 && v !== password) setConfirmHint(t("auth.errors.passwordConfirmMismatch"));
    else setConfirmHint(null);
  };

  const canSubmit =
    name.trim().length > 0 &&
    emailTrim.length > 0 &&
    birthDate.length > 0 &&
    passwordOk &&
    confirmOk &&
    !submitting;

  const onSubmit = async () => {
    setSubmitError(null);

    if (!name.trim()) return setSubmitError(t("auth.errors.nameRequired"));

    const localEmailErr = emailLocalValidate();
    if (localEmailErr) {
      setEmailHint(localEmailErr);
      return setSubmitError(localEmailErr);
    }

    if (!birthDate) return setSubmitError(t("auth.errors.birthDateRequired"));
    if (!passwordOk) return setSubmitError(t("auth.errors.passwordMin"));
    if (!confirmOk) return setSubmitError(t("auth.errors.passwordConfirmMismatch"));

    setSubmitting(true);
    try {
      const r = await apiCheckEmail(emailTrim);
      if (r.ok && !r.available) {
        setEmailHint(
          r.reason === "domain_not_allowed"
            ? t("auth.errors.emailDomainNotAllowed")
            : r.reason === "invalid_email"
              ? t("auth.errors.emailInvalid")
              : t("auth.errors.emailExists")
        );
        setSubmitting(false);
        return;
      }

      await apiRegister({
        name: name.trim(),
        email: emailTrim,
        password,
        schoolType,
        birthDate,
        placeOfBirth: placeOfBirth.trim() || undefined,
      });

      window.location.href = "/login";
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg.toLowerCase().includes("exists")) {
        setEmailHint(t("auth.errors.emailExists"));
        setSubmitError(t("auth.errors.emailExists"));
      } else {
        setSubmitError(e?.message || "Request failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const emailHintId = "email-hint";
  const pwdHintId = "pwd-hint";
  const confirmHintId = "confirm-hint";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <h1 className="text-xl font-semibold">{t("auth.registerTitle")}</h1>
          <p className="mt-1 text-sm text-slate-400">{t("auth.registerSubtitle")}</p>

          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor="fullName" className="mb-1 block text-xs text-slate-400">
                {t("auth.fullName")}
              </label>
              <input
                id="fullName"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-xs text-slate-400">
                {t("auth.email")}
              </label>
              <input
                id="email"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailHint(null);
                  setSubmitError(null);
                }}
                onBlur={onBlurEmail}
                autoComplete="email"
                aria-describedby={emailHint ? emailHintId : undefined}
              />
              {emailHint ? (
                <div id={emailHintId} className="mt-1 text-xs text-red-300">
                  {emailHint}
                </div>
              ) : (
                <div className="mt-1 text-[11px] text-slate-500">
                  {t("auth.emailAllowedSuffix")}: {allowedDomainHint()}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="schoolType" className="mb-1 block text-xs text-slate-400">
                {t("auth.schoolType.label")}
              </label>
              <select
                id="schoolType"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none"
                value={schoolType}
                onChange={(e) => setSchoolType(e.target.value as SchoolType)}
              >
                <option value="university">{t("auth.schoolType.university")}</option>
                <option value="college">{t("auth.schoolType.college")}</option>
                <option value="highschool">{t("auth.schoolType.highschool")}</option>
                <option value="other">{t("auth.schoolType.other")}</option>
              </select>
            </div>

            <div>
              <label htmlFor="birthDate" className="mb-1 block text-xs text-slate-400">
                {t("auth.birthDate")}
              </label>
              <input
                id="birthDate"
                type="date"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none"
                value={birthDate}
                onChange={(e) => {
                  setBirthDate(e.target.value);
                  setSubmitError(null);
                }}
              />
            </div>

            <div>
              <label htmlFor="placeOfBirth" className="mb-1 block text-xs text-slate-400">
                {t("auth.placeOfBirthOptional")}
              </label>
              <input
                id="placeOfBirth"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none"
                value={placeOfBirth}
                onChange={(e) => setPlaceOfBirth(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-xs text-slate-400">
                {t("auth.password")}
              </label>
              <input
                id="password"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none"
                type="password"
                value={password}
                onChange={(e) => onChangePassword(e.target.value)}
                autoComplete="new-password"
                aria-describedby={pwdHint ? pwdHintId : undefined}
              />
              {pwdHint ? (
                <div id={pwdHintId} className="mt-1 text-xs text-red-300">
                  {pwdHint}
                </div>
              ) : (
                <div className="mt-1 text-[11px] text-slate-500">
                  {t("auth.passwordRule")}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-xs text-slate-400">
                {t("auth.confirmPassword")}
              </label>
              <input
                id="confirmPassword"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none"
                type="password"
                value={confirmPassword}
                onChange={(e) => onChangeConfirm(e.target.value)}
                autoComplete="new-password"
                aria-describedby={confirmHint ? confirmHintId : undefined}
              />
              {confirmHint ? (
                <div id={confirmHintId} className="mt-1 text-xs text-red-300">
                  {confirmHint}
                </div>
              ) : null}
            </div>

            {submitError ? (
              <div className="rounded-xl border border-red-900/40 bg-red-950/30 px-3 py-2 text-sm text-red-200">
                {submitError}
              </div>
            ) : null}

            <button
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm hover:bg-slate-900 disabled:opacity-50"
              disabled={!canSubmit}
              onClick={onSubmit}
              type="button"
            >
              {submitting ? t("auth.loading") : t("auth.register")}
            </button>

            <div className="text-sm text-slate-400">
              {t("auth.haveAccount")}{" "}
              <Link className="text-cyan-300 hover:underline" href="/login">
                {t("auth.login")}
              </Link>
            </div>
          </div>
        </div>

        <Link href="/dashboard" className="mt-4 text-center text-sm text-slate-400 hover:underline">
          ← {t("common.backToApp")}
        </Link>
      </div>
    </div>
  );
}