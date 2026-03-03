"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { apiLogin } from "@/lib/api/authClient";
import { allowedDomainHint, isAllowedEmailDomain, isValidEmailFormat } from "@/lib/auth/emailRules";

export default function LoginPage() {
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailHint, setEmailHint] = useState<string | null>(null);
  const [pwdHint, setPwdHint] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emailTrim = email.trim().toLowerCase();

  const validate = () => {
    setEmailHint(null);
    setPwdHint(null);
    setSubmitError(null);

    if (!emailTrim) {
      setEmailHint(t("auth.errors.emailRequired"));
      return false;
    }
    if (!isValidEmailFormat(emailTrim)) {
      setEmailHint(t("auth.errors.emailInvalid"));
      return false;
    }
    if (!isAllowedEmailDomain(emailTrim)) {
      setEmailHint(t("auth.errors.emailDomainNotAllowed"));
      return false;
    }
    if (password.length < 6) {
      setPwdHint(t("auth.errors.passwordMin"));
      return false;
    }
    return true;
  };

  const onSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      await apiLogin({ email: emailTrim, password });
      window.location.href = "/dashboard";
    } catch (e: any) {
      setSubmitError(e?.message || "Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <h1 className="text-xl font-semibold">{t("auth.loginTitle")}</h1>
          <p className="mt-1 text-sm text-slate-400">{t("auth.loginSubtitle")}</p>

          <div className="mt-4 space-y-3">
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
                autoComplete="email"
              />
              {emailHint ? (
                <div className="mt-1 text-xs text-red-300">{emailHint}</div>
              ) : (
                <div className="mt-1 text-[11px] text-slate-500">
                  {t("auth.emailAllowedSuffix")}: {allowedDomainHint()}
                </div>
              )}
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPwdHint(null);
                  setSubmitError(null);
                }}
                autoComplete="current-password"
              />
              {pwdHint ? <div className="mt-1 text-xs text-red-300">{pwdHint}</div> : null}
            </div>

            {submitError ? (
              <div className="rounded-xl border border-red-900/40 bg-red-950/30 px-3 py-2 text-sm text-red-200">
                {submitError}
              </div>
            ) : null}

            <button
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm hover:bg-slate-900 disabled:opacity-50"
              disabled={submitting}
              onClick={onSubmit}
              type="button"
            >
              {submitting ? t("auth.loading") : t("auth.login")}
            </button>

            <div className="text-sm text-slate-400">
              {t("auth.noAccount")}{" "}
              <Link className="text-cyan-300 hover:underline" href="/register">
                {t("auth.register")}
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