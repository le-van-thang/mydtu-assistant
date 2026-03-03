// file: apps/web/src/lib/i18n/index.ts
"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import vi from "./locales/vi/common.json";
import en from "./locales/en/common.json";

export const STORAGE_KEY = "ui_lang";

export type Lang = "vi" | "en";

export function getInitialLang(): Lang {
  if (typeof window === "undefined") return "vi";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === "en" ? "en" : "vi";
}

export function setLang(lang: Lang) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, lang);
  }
  i18n.changeLanguage(lang);
}

// Init đúng 1 lần
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      vi: { common: vi },
      en: { common: en },
    },
    lng: typeof window === "undefined" ? "vi" : getInitialLang(),
    fallbackLng: "vi",
    ns: ["common"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export default i18n;
