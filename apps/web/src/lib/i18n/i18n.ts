// apps/web/src/lib/i18n/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en/common.json";
import vi from "./locales/vi/common.json";

export const I18N_STORAGE_KEY = "mydtu.language";
export type AppLang = "vi" | "en";

export function getStoredLanguage(): AppLang {
  if (typeof window === "undefined") return "vi";

  try {
    const saved = window.localStorage.getItem(I18N_STORAGE_KEY);
    return saved === "en" ? "en" : "vi";
  } catch {
    return "vi";
  }
}

export function setStoredLanguage(lang: AppLang) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(I18N_STORAGE_KEY, lang);
  } catch {}
}

const resources = {
  vi: { common: vi },
  en: { common: en },
} as const;

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: "vi",
    fallbackLng: "vi",
    ns: ["common"],
    defaultNS: "common",
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    returnNull: false,
    returnEmptyString: false,
  });
}

export default i18n;