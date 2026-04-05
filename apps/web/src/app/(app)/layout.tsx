import type { ReactNode } from "react";
import AppShell from "@/components/shell/AppShell";
import FloatingAIChat from "@/components/FloatingAIChat";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <FloatingAIChat />
    </>
  );
}