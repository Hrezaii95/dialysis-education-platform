"use client";

import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProductTour } from "@/components/layout/ProductTour";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { usePlatformStore } from "@/lib/store";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const touchStreak = usePlatformStore((s) => s.touchStreak);

  useEffect(() => {
    void usePlatformStore.persist.rehydrate();
    touchStreak();
  }, [touchStreak]);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppShell>
          {children}
          <ProductTour />
        </AppShell>
      </LanguageProvider>
    </ThemeProvider>
  );
}
