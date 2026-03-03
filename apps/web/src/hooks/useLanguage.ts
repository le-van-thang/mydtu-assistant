// apps/web/src/hooks/useLanguage.ts
"use client";

import { useEffect, useState } from "react";

const LANG_KEY = "lang";
const DEFAULT_LANG = "vi";
type Lang = "vi" | "en";

function readSavedLang(): Lang {
  try {
    const v = localStorage.getItem(LANG_KEY);
    return v === "en" || v === "vi" ? v : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

export function useLanguage() {
  // init state ổn định để SSR/client không lệch (client render lần đầu vẫn vi)
  const [language, setLanguageState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    // sau mount mới đọc localStorage
    setLanguageState(readSavedLang());
  }, []);

  const setLanguage = (next: Lang) => {
    setLanguageState(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      // ignore
    }
  };

  return { language, setLanguage };
}