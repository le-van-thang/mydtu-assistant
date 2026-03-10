// apps/web/src/lib/i18n/I18nProvider.tsx
"use client";

import { ReactNode, useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { getStoredLanguage } from "./i18n";

export default function I18nProvider({
  children,
}: {
  children: ReactNode;
}) {
  useEffect(() => {
    const lang = getStoredLanguage();

    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}