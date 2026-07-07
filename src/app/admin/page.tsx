"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLang } from "@/components/providers/LanguageProvider";
import { SupervisorView } from "@/components/admin/supervisor/SupervisorView";
import { ExecutiveOverview } from "@/components/admin/executive/ExecutiveOverview";

type View = "supervisor" | "executive";

function AdminShell() {
  const params = useSearchParams();
  const raw = params?.get("view");
  const view: View = raw === "executive" ? "executive" : "supervisor";
  const { t } = useLang();

  const activeStyle: React.CSSProperties = { background: "var(--navy-700, #10306B)", color: "#FFFFFF" };

  return (
    <div className="space-y-5">
      {/* View toggle — brand pill group, keyboard-accessible, persists in URL via ?view= */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex bg-surface-2 rounded-full p-1 gap-0.5" role="group" aria-label={t("admin.viewToggle", "View")}>
          <a
            href="?view=supervisor"
            aria-pressed={view === "supervisor"}
            style={view === "supervisor" ? activeStyle : undefined}
            className={`rounded-full px-3.5 py-1.5 text-[11.5px] font-bold tracking-wide transition-colors ${
              view === "supervisor" ? "" : "text-muted hover:text-text"
            }`}
          >
            {t("admin.supervisor", "Supervisor")}
          </a>
          <a
            href="?view=executive"
            aria-pressed={view === "executive"}
            style={view === "executive" ? activeStyle : undefined}
            className={`rounded-full px-3.5 py-1.5 text-[11.5px] font-bold tracking-wide transition-colors ${
              view === "executive" ? "" : "text-muted hover:text-text"
            }`}
          >
            {t("admin.executive", "Executive")}
          </a>
        </div>
        <span className="text-[10px] uppercase tracking-wide text-muted">
          {t("admin.demoDisclaimer", "Educational simulation · synthetic demo data · no PHI")}
        </span>
      </div>

      {view === "executive" ? <ExecutiveOverview /> : <SupervisorView />}
    </div>
  );
}

function AdminFallback() {
  const { t } = useLang();
  return <div className="glass-panel p-5 text-muted text-sm">{t("admin.loading", "Loading dashboard…")}</div>;
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <AdminShell />
    </Suspense>
  );
}
