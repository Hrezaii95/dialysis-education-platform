"use client";

import { useEffect, useMemo, useState } from "react";
import { getStatements, type XapiStatement } from "@/lib/xapi";
import { SKILL_TREE } from "@/lib/skills";
import { usePlatformStore } from "@/lib/store";
import { COMPETENCIES, KNOWLEDGE_LABEL, type KnowledgeType } from "@/lib/competencies";
import { useLang } from "@/components/providers/LanguageProvider";
import { Users, Clock, AlertTriangle, Award } from "lucide-react";
import { CohortSummary } from "./CohortSummary";

const KT: KnowledgeType[] = ["declarative", "procedural", "conditional"];

// ── synthetic fallback (shown ONLY when there is no real learner activity) ──
const SYNTHETIC_COHORT = {
  size: 24,
  cells: {
    c1: { declarative: 82, procedural: 70, conditional: 64 },
    c2: { declarative: 68, procedural: 74, conditional: 58 },
    c3: { declarative: 61, procedural: 81, conditional: 55 },
    c4: { declarative: 66, procedural: 63, conditional: 48 },
    c5: { declarative: 58, procedural: 62, conditional: 41 },
    c6: { declarative: 52, procedural: 45, conditional: 38 },
  } as Record<string, Record<KnowledgeType, number>>,
};

function levelToPct(level: string): number {
  switch (level) {
    case "mastered":    return 100;
    case "in_progress": return 50;
    case "available":   return 10;
    default:            return 0;
  }
}

function deriveHeatmapCells(
  skills: ReturnType<typeof usePlatformStore.getState>["skills"],
  cards: ReturnType<typeof usePlatformStore.getState>["cards"],
  caseDecisions: string[],
  stmts: XapiStatement[]
): { cells: Record<string, Record<KnowledgeType, number>>; isSynthetic: false } | null {
  const hasActivity =
    Object.keys(skills).length > 0 ||
    Object.keys(cards).length > 0 ||
    caseDecisions.length > 0 ||
    stmts.length > 0;

  if (!hasActivity) return null;

  const cells: Record<string, Record<KnowledgeType, number>> = {};

  for (const comp of COMPETENCIES) {
    const ownLevel = skills[comp.id]?.level ?? "locked";
    const mappedLevels = comp.mappedSkills.map((sid) => skills[sid]?.level ?? "locked");
    const allLevels = [ownLevel, ...mappedLevels];
    const bestPct = Math.max(...allLevels.map(levelToPct));

    const card = cards[comp.id];
    const retentionBoost = card ? Math.min(card.retained * 5, 20) : 0;

    const compStmts = stmts.filter(
      (s) => s.result?.extensions?.competencyId === comp.id
    );
    const masteredBonus = compStmts.filter((s) => s.verb === "mastered").length > 0 ? 15 : 0;
    const answeredStmts = compStmts.filter((s) => s.verb === "answered");
    const answeredBonus =
      answeredStmts.length > 0
        ? Math.round(
            (answeredStmts.filter((s) => s.result?.success).length / answeredStmts.length) * 20
          )
        : 0;

    const caseBonus = caseDecisions.length > 0 ? Math.min(caseDecisions.length * 3, 15) : 0;

    const base = Math.min(bestPct + retentionBoost + masteredBonus + answeredBonus, 100);

    const declarativeWeight = comp.knowledge.declarative / 100;
    const proceduralWeight = comp.knowledge.procedural / 100;
    const conditionalWeight = comp.knowledge.conditional / 100;

    const declarativePct = declarativeWeight > 0 ? Math.min(Math.round(base * (0.5 + declarativeWeight * 0.5)), 100) : 0;
    const proceduralPct  = proceduralWeight  > 0 ? Math.min(Math.round(base * (0.5 + proceduralWeight  * 0.5)), 100) : 0;
    const conditionalPct = conditionalWeight > 0 ? Math.min(Math.round(base * (0.5 + conditionalWeight * 0.5) + caseBonus), 100) : 0;

    cells[comp.id] = {
      declarative: declarativePct,
      procedural:  proceduralPct,
      conditional: conditionalPct,
    };
  }

  return { cells, isSynthetic: false };
}

function cellColor(pct: number) {
  if (pct < 50) return "bg-red-500/20 text-red-300";
  if (pct < 65) return "bg-gold/20 text-gold";
  if (pct < 80) return "bg-flow/15 text-flow";
  return "bg-flow/30 text-flow";
}

export function SupervisorView() {
  const [stmts, setStmts] = useState<XapiStatement[]>([]);
  const skills        = usePlatformStore((s) => s.skills);
  const cards         = usePlatformStore((s) => s.cards);
  const caseDecisions = usePlatformStore((s) => s.caseDecisions);
  const { t } = useLang();

  useEffect(() => {
    setStmts(getStatements());
    const interval = setInterval(() => setStmts(getStatements()), 3000);
    return () => clearInterval(interval);
  }, []);

  const heatmap = useMemo(() => {
    const live = deriveHeatmapCells(skills, cards, caseDecisions, stmts);
    if (live) return { cells: live.cells, isSynthetic: false, size: 1 };
    return { cells: SYNTHETIC_COHORT.cells, isSynthetic: true, size: SYNTHETIC_COHORT.size };
  }, [skills, cards, caseDecisions, stmts]);

  const weakest = useMemo(() => {
    let best = { label: "", pct: 101 };
    for (const c of COMPETENCIES) {
      for (const kt of KT) {
        if (c.knowledge[kt] > 0) {
          const pct = heatmap.cells[c.id]?.[kt] ?? 100;
          if (pct < best.pct) best = { label: `${c.code} · ${KNOWLEDGE_LABEL[kt]}`, pct };
        }
      }
    }
    return best;
  }, [heatmap.cells]);

  const metrics = useMemo(() => {
    const alarmResponses = stmts.filter(
      (s) => s.objectId.startsWith("alarm-") && s.result?.extensions?.latencyMs
    );
    const avgLatency =
      alarmResponses.length > 0
        ? alarmResponses.reduce(
            (a, s) => a + (Number(s.result?.extensions?.latencyMs) || 0),
            0
          ) / alarmResponses.length
        : 0;
    const mastered = SKILL_TREE.filter((n) => skills[n.id]?.level === "mastered").length;
    const interactions = stmts.filter((s) => s.verb === "interacted").length;
    const credentials = stmts.filter((s) => s.verb === "mastered").length;

    return { avgLatency, mastered, interactions, credentials, totalSkills: SKILL_TREE.length };
  }, [stmts, skills]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{t("admin.title", "Supervisor dashboard")}</h1>
        <p className="mt-1 text-sm text-muted">
          {t(
            "admin.subtitle",
            heatmap.isSynthetic
              ? "Cohort competency analytics — no learner activity yet."
              : "Cohort competency analytics — derived from real learner activity."
          )}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Users}         label={t("admin.skillsMastered", "Skills mastered")}    value={`${metrics.mastered}/${metrics.totalSkills}`} />
        <MetricCard icon={Clock}         label={t("admin.avgAlarm", "Avg alarm response")} value={`${(metrics.avgLatency / 1000).toFixed(1)}s`} />
        <MetricCard icon={AlertTriangle} label={t("admin.simInteractions", "Sim interactions")}   value={String(metrics.interactions)} />
        <MetricCard icon={Award}         label={t("admin.credentials", "Credentials issued")} value={String(metrics.credentials)} />
      </div>

      {/* NEW: cohort summary aligned with the executive view */}
      <CohortSummary />

      {/* Signature view: 2-axis heatmap — live or synthetic fallback */}
      <section className="glass-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">
            {t("admin.heatmapTitle", "Where the unit is weak — competency × knowledge-type")}
          </h3>
          <span className="text-[10px] uppercase tracking-wide text-muted">
            {heatmap.isSynthetic ? (
              <span className="text-gold">{t("admin.syntheticCohort", "synthetic cohort (demo)")}</span>
            ) : (
              <span className="text-flow">{t("admin.liveData", "live learner data")}</span>
            )}
            {" · "}
            {heatmap.isSynthetic
              ? `n=${heatmap.size} · ${t("admin.noPii", "no PII")}`
              : `n=1 ${t("admin.learner", "learner")} · ${t("admin.noPii", "no PII")}`}
          </span>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[440px] text-xs">
            <thead>
              <tr className="text-muted">
                <th className="px-2 py-1 text-left font-medium">
                  {t("admin.competency", "Competency")}
                </th>
                {KT.map((kt) => (
                  <th key={kt} className="px-2 py-1 text-center font-medium">
                    {KNOWLEDGE_LABEL[kt]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPETENCIES.map((c) => (
                <tr key={c.id} className="border-t border-white/5">
                  <td className="px-2 py-1.5 text-text/90">
                    <span className="text-muted">{c.code}</span> {c.title}
                  </td>
                  {KT.map((kt) => {
                    const has = c.knowledge[kt] > 0;
                    const pct = has ? heatmap.cells[c.id]?.[kt] ?? null : null;
                    return (
                      <td key={kt} className="px-1.5 py-1.5 text-center">
                        {pct === null ? (
                          <span className="text-muted/40">—</span>
                        ) : (
                          <span
                            className={`inline-block w-12 rounded py-1 tabular-nums ${cellColor(pct)}`}
                          >
                            {pct}%
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 rounded-md bg-red-500/10 px-2.5 py-2 text-xs text-red-300">
          {t("admin.weakest", "Weakest:")} {weakest.label} ({weakest.pct}%) —{" "}
          {t("admin.weakestAction", "target remediation here; this is the cohort's gap.")}
        </p>
        {heatmap.isSynthetic && (
          <p className="mt-2 text-[10px] text-muted">
            {t("admin.syntheticNote", "Showing synthetic demo data — heatmap updates automatically once a learner completes activities (skills, cases, cards, or the credential assessment).")}
          </p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-panel p-5">
          <h3 className="font-semibold mb-4">{t("admin.competencyBySkill", "Competency by skill")}</h3>
          <div className="space-y-3">
            {SKILL_TREE.map((node) => {
              const level = skills[node.id]?.level ?? "locked";
              const pct =
                level === "mastered" ? 100 : level === "in_progress" ? 50 : level === "available" ? 10 : 0;
              return (
                <div key={node.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{node.icon} {node.title}</span>
                    <span className="text-muted capitalize">{level.replace("_", " ")}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-panel p-5">
          <h3 className="font-semibold mb-4">{t("admin.recentXapi", "Recent xAPI events")}</h3>
          <div className="max-h-80 overflow-y-auto space-y-2 text-xs font-mono">
            {stmts.length === 0 && (
              <p className="text-muted">{t("admin.noEvents", "No events yet — complete simulator activities")}</p>
            )}
            {[...stmts].reverse().slice(0, 20).map((s) => (
              <div key={s.id} className="rounded bg-surface-2 p-2">
                <span className="text-accent">{s.verb}</span> · {s.objectName}
                <div className="text-muted">{new Date(s.timestamp).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel p-5">
        <h3 className="font-semibold mb-2">{t("admin.caseLog", "Case decision log (learner)")}</h3>
        <ol className="list-decimal list-inside text-sm text-muted space-y-1">
          {caseDecisions.length === 0 && <li>{t("admin.noCaseDecisions", "No case decisions recorded")}</li>}
          {caseDecisions.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ol>
      </div>

      <p className="text-xs text-muted text-center">
        {t("admin.multiTenantNote", "Multi-tenant hospital branding and LMS grade passback available on request")}
      </p>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="glass-panel p-4">
      <Icon className="h-5 w-5 text-accent mb-2" />
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className="text-2xl font-semibold tabular-nums mt-1">{value}</div>
    </div>
  );
}
