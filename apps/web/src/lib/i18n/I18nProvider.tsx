// apps/web/src/lib/i18n/I18nProvider.tsx
"use client";

import { ReactNode, useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";

const LANG_KEY = "lang";
const DEFAULT_LANG = "vi";
const SUPPORTED = new Set(["vi", "en"]);

function safeGetSavedLang(): "vi" | "en" | null {
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (v && SUPPORTED.has(v)) return v as "vi" | "en";
    return null;
  } catch {
    return null;
  }
}

export default function I18nProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const saved = safeGetSavedLang() ?? DEFAULT_LANG;

    // Chỉ change khi cần để tránh rerender thừa
    if (i18n.language !== saved) {
      i18n.changeLanguage(saved);
    }
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}