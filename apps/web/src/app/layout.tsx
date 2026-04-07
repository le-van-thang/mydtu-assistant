
// apps/web/src/app/layout.tsx
import "@/styles/globals.css";
import type { ReactNode } from "react";
import I18nProvider from "@/lib/i18n/I18nProvider";
import ThemeProvider from "@/components/common/ThemeProvider";

export const metadata = {
  title: "OmniScholar AI",
  description: "Nền tảng EdTech hỗ trợ học tập thông minh đa trường",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <I18nProvider>{children}</I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}