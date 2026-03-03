// apps/web/src/components/common/LanguageToggle.tsx
"use client";

import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const { language, setLanguage } = useLanguage();

  const toggle = () => {
    const next = language === "vi" ? "en" : "vi";
    // Đổi i18n trước/ sau đều được
    i18n.changeLanguage(next);
    setLanguage(next);
  };

  return (
    <button
      onClick={toggle}
      className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 hover:bg-slate-900"
      type="button"
    >
      {language === "vi" ? "VI" : "EN"}
    </button>
  );
}