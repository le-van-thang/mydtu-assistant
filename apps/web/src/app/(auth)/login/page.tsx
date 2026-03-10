"use client";

import { apiLogin } from "@/lib/api/authClient";
import {
  allowedDomainHint,
  isAllowedEmailDomain,
  isValidEmailFormat,
} from "@/lib/auth/emailRules";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type ToastType = "success" | "error" | "info";

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
        <path
          d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10.6 5.2A12.7 12.7 0 0 1 12 5c6.5 0 10 7 10 7a18.1 18.1 0 0 1-4 4.8M6.7 6.8C4.1 8.5 2 12 2 12s3.5 7 10 7c1.6 0 3-.3 4.3-.9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9.9 9.9A3 3 0 0 0 14.1 14.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Toast({
  show,
  type,
  message,
}: {
  show: boolean;
  type: ToastType;
  message: string;
}) {
  if (!show) return null;

  return (
    <div
      className={`auth-toast ${
        type === "success"
          ? "auth-toast-success"
          : type === "error"
          ? "auth-toast-error"
          : "auth-toast-info"
      }`}
      role="status"
      aria-live="polite"
    >
      <span className="auth-toast-icon">
        {type === "success" ? "✓" : type === "error" ? "!" : "i"}
      </span>
      <span>{message}</span>
    </div>
  );
}

export default function LoginPage() {
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailHint, setEmailHint] = useState<string | null>(null);
  const [pwdHint, setPwdHint] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastType, setToastType] = useState<ToastType>("info");
  const [toastMessage, setToastMessage] = useState("");

  const toastTimerRef = useRef<number | null>(null);

  const emailTrim = useMemo(() => email.trim().toLowerCase(), [email]);

  function openToast(type: ToastType, message: string) {
    setToastType(type);
    setToastMessage(message);
    setToastOpen(true);

    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = window.setTimeout(() => {
      setToastOpen(false);
    }, 1800);
  }

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

    if (!password.trim()) {
      setPwdHint(t("auth.errors.passwordRequired"));
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
    setSubmitError(null);

    try {
      await apiLogin({ email: emailTrim, password });

      openToast(
        "success",
        t("auth.loginSuccess", { defaultValue: "Đăng nhập thành công." })
      );

      window.setTimeout(() => {
        window.location.href = "/dashboard";
      }, 900);
    } catch (e: any) {
      const msg =
        e?.message ||
        t("auth.errors.loginFailed", { defaultValue: "Đăng nhập thất bại." });

      setSubmitError(msg);
      openToast("error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <Toast show={toastOpen} type={toastType} message={toastMessage} />

      <div className="auth-layout">
        <div className="auth-panel auth-floating auth-fade-in auth-panel-login">
          <div className="auth-panel-inner">
            <h1 className="auth-title">{t("auth.loginTitle")}</h1>
            <p className="auth-subtitle">{t("auth.loginSubtitle")}</p>

            <div className="auth-form">
              <div className="auth-field">
                <label htmlFor="email" className="auth-label">
                  {t("auth.email")}
                </label>
                <input
                  id="email"
                  name="username"
                  className="app-input"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailHint(null);
                    setSubmitError(null);
                  }}
                  autoComplete="username"
                  inputMode="email"
                  placeholder="name@example.com"
                />
                {emailHint ? (
                  <div className="mt-2 text-xs text-red-300">{emailHint}</div>
                ) : (
                  <div className="mt-2 text-[11px] auth-hint break-words">
                    {t("auth.emailAllowedSuffix")} {allowedDomainHint()}
                  </div>
                )}
              </div>

              <div className="auth-field">
                <label htmlFor="password" className="auth-label">
                  {t("auth.password")}
                </label>

                <div className="auth-password-wrap">
                  <input
                    id="password"
                    name="current-password"
                    className="app-input auth-password-input"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPwdHint(null);
                      setSubmitError(null);
                    }}
                    autoComplete="current-password"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    aria-label={
                      showPassword
                        ? t("auth.hidePassword", { defaultValue: "Ẩn mật khẩu" })
                        : t("auth.showPassword", { defaultValue: "Hiện mật khẩu" })
                    }
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>

                {pwdHint ? (
                  <div className="mt-2 text-xs text-red-300">{pwdHint}</div>
                ) : null}
              </div>

              {submitError ? (
                <div className="auth-error rounded-2xl px-3 py-2.5 text-sm">
                  {submitError}
                </div>
              ) : null}

              <button
                className="app-btn-primary auth-submit-btn"
                disabled={submitting}
                onClick={onSubmit}
                type="button"
              >
                {submitting ? t("auth.loading") : t("auth.login")}
              </button>

              <div className="auth-footer">
                {t("auth.noAccount")}{" "}
                <Link className="auth-link font-medium" href="/register">
                  {t("auth.register")}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <Link href="/dashboard" className="auth-back-link text-sm">
          ← {t("common.backToApp")}
        </Link>
      </div>
    </div>
  );
}