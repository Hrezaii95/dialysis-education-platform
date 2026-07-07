"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/providers/LanguageProvider";

export default function AlarmsPage() {
  const router = useRouter();
  const { t } = useLang();

  useEffect(() => {
    router.replace("/simulator?step=alarms");
  }, [router]);

  return (
    <div className="text-sm text-muted">
      {t("hub.redirect.alarms", "Redirecting to Simulation Hub — Alarms…")}
    </div>
  );
}
