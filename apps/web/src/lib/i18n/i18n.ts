// apps/web/src/lib/i18n/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import vi from "./locales/vi/common.json";
import en from "./locales/en/common.json";

const resources = {
  vi: { common: vi },
  en: { common: en },
} as const;

// IMPORTANT:
// Không đọc localStorage ở đây để tránh SSR/client render khác nhau.
// Luôn init 1 ngôn ngữ cố định (vi). Sau đó Provider sẽ đổi theo localStorage khi mount.
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: "vi",
    fallbackLng: "vi",
    ns: ["common"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    react: {
      useSuspense: false,
    },
  });
}

export default i18n;