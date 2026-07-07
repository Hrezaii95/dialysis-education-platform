"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/providers/LanguageProvider";

export default function CasesPage() {
  const router = useRouter();
  const { t } = useLang();

  useEffect(() => {
    router.replace("/simulator?step=cases");
  }, [router]);

  return (
    <div className="text-sm text-muted">
      {t("hub.redirect.cases", "Redirecting to Simulation Hub — Patient Cases…")}
    </div>
  );
}
