"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CasesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/simulator?tab=cases");
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
      Redirecting to Clinical Simulator…
    </div>
  );
}
