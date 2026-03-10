// apps/web/src/app/(auth)/register/page.tsx
"use client";

import { apiCheckEmail, apiRegister } from "@/lib/api/authClient";
import {
  allowedDomainHint,
  isAllowedEmailDomain,
  isValidEmailFormat,
} from "@/lib/auth/emailRules";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type SchoolType = "university" | "college" | "highschool" | "other";
type ToastType = "success" | "error" | "info";

type FieldKey =
  | "name"
  | "email"
  | "birthDate"
  | "password"
  | "confirmPassword";

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
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

export default function RegisterPage() {
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [schoolType, setSchoolType] = useState<SchoolType>("university");
  const [birthDate, setBirthDate] = useState("");
  const [placeOfBirth, setPlaceOfBirth] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [nameHint, setNameHint] = useState<string | null>(null);
  const [emailHint, setEmailHint] = useState<string | null>(null);
  const [birthDateHint, setBirthDateHint] = useState<string | null>(null);
  const [pwdHint, setPwdHint] = useState<string | null>(null);
  const [confirmHint, setConfirmHint] = useState<string | null>(null);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastType, setToastType] = useState<ToastType>("info");
  const [toastMessage, setToastMessage] = useState("");

  const toastTimerRef = useRef<number | null>(null);

  const nameRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const birthDateRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const confirmPasswordRef = useRef<HTMLInputElement | null>(null);

  const emailTrim = email.trim().toLowerCase();

  const passwordOk = useMemo(() => password.length >= 6, [password]);
  const confirmOk = useMemo(
    () => confirmPassword === password && confirmPassword.length > 0,
    [confirmPassword, password]
  );

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

  function focusField(field: FieldKey) {
    const map: Record<FieldKey, HTMLInputElement | null> = {
      name: nameRef.current,
      email: emailRef.current,
      birthDate: birthDateRef.current,
      password: passwordRef.current,
      confirmPassword: confirmPasswordRef.current,
    };

    const el = map[field];
    if (!el) return;

    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => el.focus(), 180);
    });
  }

  function resetInlineErrors() {
    setNameHint(null);
    setEmailHint(null);
    setBirthDateHint(null);
    setPwdHint(null);
    setConfirmHint(null);
    setSubmitError(null);
  }

  const emailLocalValidate = () => {
    if (!emailTrim) return t("auth.errors.emailRequired");
    if (!isValidEmailFormat(emailTrim)) return t("auth.errors.emailInvalid");
    if (!isAllowedEmailDomain(emailTrim)) {
      return t("auth.errors.emailDomainNotAllowed");
    }
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
      if (r.reason === "domain_not_allowed") {
        setEmailHint(t("auth.errors.emailDomainNotAllowed"));
      } else if (r.reason === "invalid_email") {
        setEmailHint(t("auth.errors.emailInvalid"));
      } else {
        setEmailHint(t("auth.errors.emailExists"));
      }
      return;
    }

    setEmailHint(null);
  };

  const onChangePassword = (v: string) => {
    setPassword(v);
    setSubmitError(null);

    if (!v.trim()) {
      setPwdHint(null);
    } else if (v.length < 6) {
      setPwdHint(t("auth.errors.passwordMin"));
    } else {
      setPwdHint(null);
    }

    if (confirmPassword.length > 0 && confirmPassword !== v) {
      setConfirmHint(t("auth.errors.passwordConfirmMismatch"));
    } else {
      setConfirmHint(null);
    }
  };

  const onChangeConfirm = (v: string) => {
    setConfirmPassword(v);
    setSubmitError(null);

    if (!v.trim()) {
      setConfirmHint(null);
    } else if (v !== password) {
      setConfirmHint(t("auth.errors.passwordConfirmMismatch"));
    } else {
      setConfirmHint(null);
    }
  };

  const canSubmit =
    name.trim().length > 0 &&
    emailTrim.length > 0 &&
    birthDate.length > 0 &&
    passwordOk &&
    confirmOk &&
    !submitting;

  const onSubmit = async () => {
    resetInlineErrors();

    if (!name.trim()) {
      const err = t("auth.errors.nameRequired");
      setNameHint(err);
      setSubmitError(err);
      openToast("error", err);
      focusField("name");
      return;
    }

    const localEmailErr = emailLocalValidate();
    if (localEmailErr) {
      setEmailHint(localEmailErr);
      setSubmitError(localEmailErr);
      openToast("error", localEmailErr);
      focusField("email");
      return;
    }

    if (!birthDate) {
      const err = t("auth.errors.birthDateRequired");
      setBirthDateHint(err);
      setSubmitError(err);
      openToast("error", err);
      focusField("birthDate");
      return;
    }

    if (!password.trim()) {
      const err = t("auth.errors.passwordRequired");
      setPwdHint(err);
      setSubmitError(err);
      openToast("error", err);
      focusField("password");
      return;
    }

    if (!passwordOk) {
      const err = t("auth.errors.passwordMin");
      setPwdHint(err);
      setSubmitError(err);
      openToast("error", err);
      focusField("password");
      return;
    }

    if (!confirmPassword.trim()) {
      const err = t("auth.errors.passwordConfirmMismatch");
      setConfirmHint(err);
      setSubmitError(err);
      openToast("error", err);
      focusField("confirmPassword");
      return;
    }

    if (!confirmOk) {
      const err = t("auth.errors.passwordConfirmMismatch");
      setConfirmHint(err);
      setSubmitError(err);
      openToast("error", err);
      focusField("confirmPassword");
      return;
    }

    setSubmitting(true);

    try {
      const r = await apiCheckEmail(emailTrim);
      if (r.ok && !r.available) {
        const err =
          r.reason === "domain_not_allowed"
            ? t("auth.errors.emailDomainNotAllowed")
            : r.reason === "invalid_email"
            ? t("auth.errors.emailInvalid")
            : t("auth.errors.emailExists");

        setEmailHint(err);
        setSubmitError(err);
        openToast("error", err);
        focusField("email");
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

      openToast(
        "success",
        t("auth.registerSuccess", { defaultValue: "Đăng ký thành công." })
      );

      window.setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg.toLowerCase().includes("exists")) {
        const err = t("auth.errors.emailExists");
        setEmailHint(err);
        setSubmitError(err);
        openToast("error", err);
        focusField("email");
      } else {
        const err =
          e?.message ||
          t("auth.errors.registerFailed", { defaultValue: "Đăng ký thất bại." });
        setSubmitError(err);
        openToast("error", err);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const nameHintId = "name-hint";
  const emailHintId = "email-hint";
  const birthDateHintId = "birthdate-hint";
  const pwdHintId = "pwd-hint";
  const confirmHintId = "confirm-hint";

  return (
    <div className="auth-shell">
      <Toast show={toastOpen} type={toastType} message={toastMessage} />

      <div className="auth-layout">
        <div className="auth-panel auth-fade-in auth-panel-register">
          <div className="auth-panel-inner">
            <h1 className="auth-title">{t("auth.registerTitle")}</h1>
            <p className="auth-subtitle">{t("auth.registerSubtitle")}</p>

            <div className="auth-form">
              <div className="auth-grid-2">
                <div className="auth-field">
                  <label htmlFor="fullName" className="auth-label">
                    {t("auth.fullName")}
                  </label>
                  <input
                    ref={nameRef}
                    id="fullName"
                    name="name"
                    className={`app-input ${nameHint ? "app-input-error" : ""}`}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setNameHint(null);
                      setSubmitError(null);
                    }}
                    autoComplete="name"
                    aria-describedby={nameHint ? nameHintId : undefined}
                    placeholder={t("auth.fullName")}
                  />
                  {nameHint ? (
                    <div id={nameHintId} className="auth-inline-error">
                      {nameHint}
                    </div>
                  ) : (
                    <div className="auth-hint text-[11px]">&nbsp;</div>
                  )}
                </div>

                <div className="auth-field">
                  <label htmlFor="email" className="auth-label">
                    {t("auth.email")}
                  </label>
                  <input
                    ref={emailRef}
                    id="email"
                    name="email"
                    className={`app-input ${emailHint ? "app-input-error" : ""}`}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailHint(null);
                      setSubmitError(null);
                    }}
                    onBlur={onBlurEmail}
                    autoComplete="email"
                    aria-describedby={emailHint ? emailHintId : undefined}
                    inputMode="email"
                    placeholder="name@example.com"
                  />
                  {emailHint ? (
                    <div id={emailHintId} className="auth-inline-error">
                      {emailHint}
                    </div>
                  ) : (
                    <div className="auth-hint text-[11px] break-words">
                      {t("auth.emailAllowedSuffix")} {allowedDomainHint()}
                    </div>
                  )}
                </div>
              </div>

              <div className="auth-grid-2">
                <div className="auth-field">
                  <label htmlFor="schoolType" className="auth-label">
                    {t("auth.schoolType.label")}
                  </label>
                  <select
                    id="schoolType"
                    className="app-input"
                    value={schoolType}
                    onChange={(e) => setSchoolType(e.target.value as SchoolType)}
                  >
                    <option value="university">{t("auth.schoolType.university")}</option>
                    <option value="college">{t("auth.schoolType.college")}</option>
                    <option value="highschool">{t("auth.schoolType.highschool")}</option>
                    <option value="other">{t("auth.schoolType.other")}</option>
                  </select>
                  <div className="auth-hint text-[11px]">&nbsp;</div>
                </div>

                <div className="auth-field">
                  <label htmlFor="birthDate" className="auth-label">
                    {t("auth.birthDate")}
                  </label>
                  <input
                    ref={birthDateRef}
                    id="birthDate"
                    type="date"
                    className={`app-input ${birthDateHint ? "app-input-error" : ""}`}
                    value={birthDate}
                    onChange={(e) => {
                      setBirthDate(e.target.value);
                      setBirthDateHint(null);
                      setSubmitError(null);
                    }}
                    autoComplete="bday"
                    aria-describedby={birthDateHint ? birthDateHintId : undefined}
                  />
                  {birthDateHint ? (
                    <div id={birthDateHintId} className="auth-inline-error">
                      {birthDateHint}
                    </div>
                  ) : (
                    <div className="auth-hint text-[11px]">&nbsp;</div>
                  )}
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="placeOfBirth" className="auth-label">
                  {t("auth.placeOfBirthOptional")}
                </label>
                <input
                  id="placeOfBirth"
                  className="app-input"
                  value={placeOfBirth}
                  onChange={(e) => setPlaceOfBirth(e.target.value)}
                  placeholder={t("auth.placeOfBirthOptional")}
                />
              </div>

              <div className="auth-grid-2">
                <div className="auth-field">
                  <label htmlFor="password" className="auth-label">
                    {t("auth.password")}
                  </label>
                  <div className="auth-password-wrap">
                    <input
                      ref={passwordRef}
                      id="password"
                      name="new-password"
                      className={`app-input auth-password-input ${pwdHint ? "app-input-error" : ""}`}
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => onChangePassword(e.target.value)}
                      autoComplete="new-password"
                      aria-describedby={pwdHint ? pwdHintId : undefined}
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
                    <div id={pwdHintId} className="auth-inline-error">
                      {pwdHint}
                    </div>
                  ) : (
                    <div className="auth-hint text-[11px]">{t("auth.passwordRule")}</div>
                  )}
                </div>

                <div className="auth-field">
                  <label htmlFor="confirmPassword" className="auth-label">
                    {t("auth.confirmPassword")}
                  </label>
                  <div className="auth-password-wrap">
                    <input
                      ref={confirmPasswordRef}
                      id="confirmPassword"
                      name="confirm-password"
                      className={`app-input auth-password-input ${
                        confirmHint ? "app-input-error" : ""
                      }`}
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => onChangeConfirm(e.target.value)}
                      autoComplete="new-password"
                      aria-describedby={confirmHint ? confirmHintId : undefined}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      aria-label={
                        showConfirmPassword
                          ? t("auth.hidePassword", { defaultValue: "Ẩn mật khẩu" })
                          : t("auth.showPassword", { defaultValue: "Hiện mật khẩu" })
                      }
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      <EyeIcon open={showConfirmPassword} />
                    </button>
                  </div>

                  {confirmHint ? (
                    <div id={confirmHintId} className="auth-inline-error">
                      {confirmHint}
                    </div>
                  ) : (
                    <div className="auth-hint text-[11px]">&nbsp;</div>
                  )}
                </div>
              </div>

              {submitError ? (
                <div className="auth-error rounded-2xl px-3 py-2.5 text-sm">
                  {submitError}
                </div>
              ) : null}

              <button
                className="app-btn-primary auth-submit-btn"
                disabled={!canSubmit}
                onClick={onSubmit}
                type="button"
              >
                {submitting ? t("auth.loading") : t("auth.register")}
              </button>

              <div className="auth-footer">
                {t("auth.haveAccount")}{" "}
                <Link className="auth-link font-medium" href="/login">
                  {t("auth.login")}
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