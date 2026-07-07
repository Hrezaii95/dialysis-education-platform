"use client";

import { useMemo } from "react";
import { useLang } from "@/components/providers/LanguageProvider";
import type { Trainee } from "@/lib/analytics/trainee-schema";
import { gateFunnel } from "@/lib/analytics/aggregations";

interface Props {
  cohort: Trainee[];
}

export function GateFunnel({ cohort }: Props) {
  const { t } = useLang();
  const stages = useMemo(() => gateFunnel(cohort), [cohort]);

  // Last non-zero stage = "now" (navy); passed final = lime; others = pending circle.
  const passedIdx = stages.findIndex((s) => s.stage === "credential_passed");
  const lastNonZeroIdx = (() => {
    for (let i = stages.length - 1; i >= 0; i--) {
      if (stages[i].count > 0) return i;
    }
    return 0;
  })();

  return (
    <section className="glass-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="font-semibold">{t("admin.gateFunnel", "Gate funnel")}</h3>
        <span className="text-[10px] uppercase tracking-wide text-muted">
          {t("admin.placementToCredential", "placement → credential")}
        </span>
      </div>
      <div className="flex items-center gap-0 overflow-x-auto pb-1">
        {stages.map((s, i) => {
          const isPassed = i === passedIdx && s.count > 0;
          const isNow = !isPassed && i === lastNonZeroIdx && s.count > 0;
          const isGate = s.stage === "credential_attempted";
          const glyphStyle: React.CSSProperties = isPassed
            ? { background: "var(--lime-500, #6CCB3E)", color: "var(--navy-900, #0B1E45)" }
            : isNow
            ? { background: "var(--navy-700, #10306B)", color: "#FFFFFF" }
            : { background: "var(--surface-2, #16336B)", color: "var(--text-muted, #9FB0C8)", border: "1px solid rgba(255,255,255,0.10)" };
          const shape = isGate ? "rotate-45" : "rounded-full";
          return (
            <div key={s.stage} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5 min-w-[78px]">
                <div
                  className={`w-9 h-9 grid place-items-center text-[11px] font-bold tabular-nums ${shape}`}
                  style={glyphStyle}
                >
                  <span className={isGate ? "-rotate-45" : ""}>{s.count}</span>
                </div>
                <div className="text-[10px] text-muted text-center leading-tight max-w-[88px]">
                  {s.label}
                </div>
              </div>
              {i < stages.length - 1 && (
                <span className="text-muted text-sm px-0.5">→</span>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-muted">
        {t("admin.gateFunnelLegend", "Lime = passed · navy = current · gate = decision point · circle = pending.")}
      </p>
    </section>
  );
}
