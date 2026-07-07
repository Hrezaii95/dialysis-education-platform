"use client";

import { useMemo } from "react";
import { useLang } from "@/components/providers/LanguageProvider";
import { SYNTHETIC_DEMO_COHORT } from "@/lib/analytics/mock-trainee-cohort";
import {
  byProfession,
  byLocation,
  retentionDistribution,
  type CountRow,
} from "@/lib/analytics/aggregations";

/**
 * Cohort summary — new enrichment tile for the supervisor dashboard.
 * Surfaces the synthetic cohort's profession + location mix and retention
 * shape so the supervisor sees the same data layer the executive view draws on.
 * Clearly labeled synthetic demo data.
 */
export function CohortSummary() {
  const { t } = useLang();
  const cohort = SYNTHETIC_DEMO_COHORT;
  const prof = useMemo(() => byProfession(cohort).slice(0, 3), [cohort]);
  const loc = useMemo(() => byLocation(cohort).slice(0, 3), [cohort]);
  const ret = useMemo(() => retentionDistribution(cohort), [cohort]);
  const maxRet = Math.max(...ret.map((b) => b.count), 1);

  return (
    <section className="glass-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="font-semibold">
          {t("admin.cohortSummary", "Cohort summary — aligned with executive view")}
        </h3>
        <span className="text-[10px] uppercase tracking-wide text-gold">
          {t("admin.syntheticDemo", "Synthetic demo")} · n={cohort.length} · {t("admin.noPii", "no PHI")}
        </span>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <MiniBars title={t("admin.byProfession", "By profession — top 3")} rows={prof} />
        <MiniBars title={t("admin.byLocation", "By location — top 3")} rows={loc} />
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted mb-2">
            {t("admin.retention7d", "Retention — Daily-5 streak")}
          </div>
          <div className="space-y-1.5">
            {ret.map((b) => (
              <div key={b.label} className="grid grid-cols-[44px_1fr_24px] items-center gap-2 text-[11px]">
                <span className="text-muted tabular-nums">{b.label}</span>
                <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                  <div className="h-full rounded-full bg-flow" style={{ width: `${(b.count / maxRet) * 100}%` }} />
                </div>
                <span className="text-text font-bold text-right tabular-nums">{b.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-3 text-[10px] text-muted">
        {t("admin.cohortSummaryNote", "Same synthetic cohort as the executive view — switch via the toggle above to see all dimensions.")}
      </p>
    </section>
  );
}

function MiniBars({ title, rows }: { title: string; rows: CountRow<string>[] }) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted mb-2">{title}</div>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.key} className="grid grid-cols-[110px_1fr_24px] items-center gap-2 text-[11px]">
            <span className="text-text/90 truncate">{r.label}</span>
            <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
              <div className="h-full rounded-full bg-flow" style={{ width: `${(r.count / max) * 100}%` }} />
            </div>
            <span className="text-text font-bold text-right tabular-nums">{r.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
