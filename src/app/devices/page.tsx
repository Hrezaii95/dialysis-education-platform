"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLang } from "@/components/providers/LanguageProvider";

function DevicesRedirectInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useLang();

  useEffect(() => {
    const next = new URLSearchParams(params.toString());
    next.set("step", "explore");
    if (!next.has("view")) next.set("view", "operate");
    router.replace(`/simulator?${next.toString()}`);
  }, [params, router]);

  return (
    <div className="text-sm text-muted">
      {t("hub.redirect.devices", "Redirecting to Simulation Hub…")}
    </div>
  );
}

export default function DevicesPage() {
  return (
    <Suspense fallback={<div className="text-muted">…</div>}>
      <DevicesRedirectInner />
    </Suspense>
  );
}
