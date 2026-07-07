"use client";

import { useMemo } from "react";
import { useLang } from "@/components/providers/LanguageProvider";
import { SYNTHETIC_DEMO_COHORT, SYNTHETIC_DEMO_DISCLAIMER } from "@/lib/analytics/mock-trainee-cohort";
import {
  execHeroMetrics,
  cohortCompetencyHeatmap,
  type ExecHeroMetrics,
  type CompetencyHeatmapCell,
} from "@/lib/analytics/aggregations";
import { COMPETENCIES, KNOWLEDGE_LABEL, type KnowledgeType } from "@/lib/competencies";
import { DimensionBreakdown } from "./DimensionBreakdown";
import { GateFunnel } from "./GateFunnel";
import { RetentionSparkline } from "./RetentionSparkline";
import { AlarmLatencyArc } from "./AlarmLatencyArc";

const KT: KnowledgeType[] = ["declarative", "procedural", "conditional"];

function cellClass(pct: number): string {
  if (pct < 50) return "bg-red-500/25 text-red-200";
  if (pct < 65) return "bg-gold/20 text-gold";
  if (pct < 80) return "bg-flow/15 text-flow";
  return "bg-flow/30 text-flow";
}

function StatTile({
  overline,
  value,
  context,
  accent,
}: {
  overline: string;
  value: string;
  context: string;
  accent?: boolean;
}) {
  return (
    <div className="glass-panel p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted">{overline}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${accent ? "text-flow" : "text-text"}`}>
        {value}
      </div>
      <div className="mt-1 text-[11px] text-muted leading-snug">{context}</div>
    </div>
  );
}

export function ExecutiveOverview() {
  const { t } = useLang();
  const cohort = SYNTHETIC_DEMO_COHORT;
  const hero: ExecHeroMetrics = useMemo(() => execHeroMetrics(cohort), [cohort]);
  const heat: CompetencyHeatmapCell[] = useMemo(() => cohortCompetencyHeatmap(cohort), [cohort]);

  // Weakest cell across the heatmap
  const weakest = useMemo(() => {
    let best = { label: "", pct: 101 };
    for (const cell of heat) {
      const comp = COMPETENCIES.find((c) => c.id === cell.competencyId);
      if (!comp) continue;
      for (const kt of KT) {
        if (comp.knowledge[kt] > 0) {
          // Approximate per-KT by scaling avgPct with the knowledge weight (cohort-level proxy).
          const proxy = Math.round(cell.avgPct * (0.5 + (comp.knowledge[kt] / 100) * 0.5));
          if (proxy < best.pct) best = { label: `${comp.code} · ${KNOWLEDGE_LABEL[kt]}`, pct: proxy };
        }
      }
    }
    return best;
  }, [heat]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{t("admin.execTitle", "Executive BI — HCPs under training")}</h1>
        <p className="mt-1 text-sm text-muted">
          {t(
            "admin.execSubtitle",
            "Cohort analytics across location, profession, workplace, age, gender, and field experience."
          )}
        </p>
        <p className="mt-2 text-[10px] uppercase tracking-wide text-gold">
          {t("admin.syntheticDemo", "Synthetic demo data — no PHI")} · n={cohort.length}
        </p>
      </header>

      {/* Hero stat row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile overline={t("admin.activeTrainees", "Active trainees")} value={String(hero.activeTrainees)} context={t("admin.acrossProvinces", "across 8 provinces · 4 workplace types")} />
        <StatTile overline={t("admin.avgCompetency", "Avg competency")} value={`${hero.avgCompetencyPct}%`} context={t("admin.cohortMean", "cohort mean across C1–C6")} accent />
        <StatTile overline={t("admin.credentialPass", "Credential pass rate")} value={`${hero.credentialPassRate}%`} context={`${hero.credentialPassed} / ${cohort.length} ${t("admin.passed", "passed")}`} />
        <StatTile overline={t("admin.retention7d", "Retention 7d")} value={String(hero.retention7d)} context={t("admin.reviewingLast7d", "trainees reviewing in last 7 days")} accent />
        <StatTile overline={t("admin.medianAlarm", "Median alarm response")} value={`${(hero.medianAlarmLatencyMs / 1000).toFixed(1)}s`} context={t("admin.acrossTrials", "across trainees with trials")} />
      </div>

      {/* Heatmap + gate funnel */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <section className="glass-panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="font-semibold">
              {t("admin.heatmapTitle", "Where the cohort is weak — competency × knowledge-type")}
            </h3>
            <span className="text-[10px] uppercase tracking-wide text-muted">
              {t("admin.cohortAvg", "cohort avg")} · n={cohort.length} · {t("admin.noPii", "no PHI")}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[440px] text-xs">
              <thead>
                <tr className="text-muted">
                  <th className="px-2 py-1 text-left font-medium">{t("admin.competency", "Competency")}</th>
                  {KT.map((kt) => (
                    <th key={kt} className="px-2 py-1 text-center font-medium">
                      {KNOWLEDGE_LABEL[kt]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heat.map((cell) => {
                  const comp = COMPETENCIES.find((c) => c.id === cell.competencyId)!;
                  return (
                    <tr key={cell.competencyId} className="border-t border-white/5">
                      <td className="px-2 py-1.5 text-text/90">
                        <span className="text-muted">{comp.code}</span> {comp.title}
                      </td>
                      {KT.map((kt) => {
                        const has = comp.knowledge[kt] > 0;
                        const proxy = has
                          ? Math.round(cell.avgPct * (0.5 + (comp.knowledge[kt] / 100) * 0.5))
                          : null;
                        return (
                          <td key={kt} className="px-1.5 py-1.5 text-center">
                            {proxy === null ? (
                              <span className="text-muted/40">—</span>
                            ) : (
                              <span className={`inline-block w-12 rounded py-1 tabular-nums ${cellClass(proxy)}`}>
                                {proxy}%
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 rounded-md bg-red-500/10 px-2.5 py-2 text-xs text-red-300">
            {t("admin.weakest", "Weakest:")} {weakest.label} ({weakest.pct}%) —{" "}
            {t("admin.weakestAction", "target remediation here; this is the cohort's gap.")}
          </p>
        </section>

        <GateFunnel cohort={cohort} />
      </div>

      {/* Dimension breakdowns */}
      <DimensionBreakdown cohort={cohort} />

      {/* Retention + alarm latency */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RetentionSparkline cohort={cohort} />
        <AlarmLatencyArc cohort={cohort} />
      </div>

      <p className="text-[11px] text-muted text-center leading-relaxed">
        {SYNTHETIC_DEMO_DISCLAIMER}
      </p>
    </div>
  );
}
