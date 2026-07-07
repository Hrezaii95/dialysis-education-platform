"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Stethoscope,
  ArrowRight,
  RotateCcw,
  Quote,
  AlertTriangle,
  Check,
  X,
  Activity,
} from "lucide-react";
import { usePlatformStore } from "@/lib/store";
import { emitStatement } from "@/lib/xapi";
import { useLang } from "@/components/providers/LanguageProvider";
import { CASES, type CaseOption, type Verdict } from "@/lib/cases";
import {
  CasePhaseStepper,
  DecisionCard,
  PatientMonitor,
  type MonitorTone,
  type MonitorVital,
} from "./PatientCaseUI";

// Full 5-step journey for Mr. K (Case 1, IDH) — the only COMPLETE case.
// Sources decision points (DP1–DP3), debrief text, and PMID citations from
// cases.ts (the locked PRD/C5 case set) and renders them through the unified
// journey UI: Assess | Prescribe | Treat | Intervene | Debrief.
// Legacy IDHSimCase.tsx POC is retired from the primary view; this replaces it.

type Phase = "assess" | "prescribe" | "treat" | "intervene" | "debrief";

const PHASE_SEQ: Phase[] = ["assess", "prescribe", "treat", "intervene", "debrief"];

const VERDICT_META: Record<
  Verdict,
  { Icon: React.ComponentType<{ className?: string }>; cls: string; chip: string; labelKey: string; label: string }
> = {
  correct: { Icon: Check, cls: "border-[var(--signal)]/50 bg-[var(--signal)]/10", chip: "text-[var(--signal)]", labelKey: "idh.journey.optimal", label: "Optimal" },
  warning: { Icon: AlertTriangle, cls: "border-gold/50 bg-gold/10", chip: "text-gold", labelKey: "idh.journey.suboptimal", label: "Suboptimal" },
  wrong: { Icon: X, cls: "border-danger/50 bg-danger/10", chip: "text-danger", labelKey: "idh.journey.harmful", label: "Harmful" },
};

// Vitals the monitor shows at each phase, reflecting the learner's choices.
interface VitalsState {
  sbp: number;
  dbp: number;
  hr: number;
  symptom: string;
  tone: MonitorTone;
}

const BASELINE_VS: VitalsState = { sbp: 148, dbp: 82, hr: 78, symptom: "baseline — AM antihypertensive", tone: "normal" };
const CRISIS_VS: VitalsState = { sbp: 98, dbp: 58, hr: 96, symptom: "yawning, left calf cramp", tone: "warn" };

export function IDHCaseJourney() {
  const { t } = useLang();
  const setSkill = usePlatformStore((s) => s.setSkill);
  const addCaseDecision = usePlatformStore((s) => s.addCaseDecision);

  const idhCase = CASES.find((c) => c.id === "idh")!;
  // DP1 → Prescribe, DP2 → Treat, DP3 → Intervene
  const dpMap: Record<Exclude<Phase, "assess" | "debrief">, CaseOption[]> = useMemo(
    () => ({
      prescribe: idhCase.decisionPoints[0]?.options ?? [],
      treat: idhCase.decisionPoints[1]?.options ?? [],
      intervene: idhCase.decisionPoints[2]?.options ?? [],
    }),
    [idhCase]
  );
  const dpMeta: Record<Exclude<Phase, "assess" | "debrief">, { at: string; prompt: string }> = useMemo(
    () => ({
      prescribe: { at: idhCase.decisionPoints[0]?.at ?? "", prompt: idhCase.decisionPoints[0]?.prompt ?? "" },
      treat: { at: idhCase.decisionPoints[1]?.at ?? "", prompt: idhCase.decisionPoints[1]?.prompt ?? "" },
      intervene: { at: idhCase.decisionPoints[2]?.at ?? "", prompt: idhCase.decisionPoints[2]?.prompt ?? "" },
    }),
    [idhCase]
  );

  const [phase, setPhase] = useState<Phase>("assess");
  const [choices, setChoices] = useState<Partial<Record<Exclude<Phase, "assess" | "debrief">, CaseOption>>>({});

  const allCorrect = Object.values(choices).every((c) => c?.verdict === "correct");
  const anyWrong = Object.values(choices).some((c) => c?.verdict === "wrong");

  // Live vitals derived from choices so far.
  const vitals: VitalsState = useMemo(() => {
    if (phase === "assess") return BASELINE_VS;
    const dp1 = choices.prescribe;
    if (!dp1) return CRISIS_VS;
    if (dp1.verdict === "correct") return { sbp: 112, dbp: 70, hr: 84, symptom: "cramp easing, alert", tone: "good" };
    if (dp1.verdict === "warning") return { sbp: 132, dbp: 80, hr: 88, symptom: "transient rise — rebound risk", tone: "warn" };
    return { sbp: 78, dbp: 44, hr: 108, symptom: "diaphoretic, near-syncope", tone: "crit" };
  }, [phase, choices]);

  function choose(p: Phase, opt: CaseOption) {
    if (p === "assess" || p === "debrief") return;
    setChoices((prev) => ({ ...prev, [p]: opt }));
    addCaseDecision(`IDH ${p.toUpperCase()} · ${opt.verdict}`);
    emitStatement("interacted", "case-idh", `${p}: ${opt.verdict}`);
    const idx = PHASE_SEQ.indexOf(p);
    const next = PHASE_SEQ[idx + 1];
    if (next) setPhase(next);
  }

  function goTo(p: Phase) {
    setPhase(p);
    if (p === "debrief") {
      setSkill("cases", allCorrect ? "mastered" : "in_progress");
      setSkill("c5", allCorrect ? "mastered" : "in_progress");
      emitStatement("completed", "case-idh", "IDH case debrief");
    }
  }

  function reset() {
    setChoices({});
    setPhase("assess");
  }

  // Build the phases list for the stepper — only the completed/current are clickable.
  const reachedIdx = PHASE_SEQ.indexOf(phase);
  const stepperPhases = PHASE_SEQ.map((id) => ({
    id,
    labelKey: `idh.journey.${id}`,
    label: id.charAt(0).toUpperCase() + id.slice(1),
  }));

  const monitorVitals: MonitorVital[] = [
    { label: t("idh.monitor.bp", "BP"), value: `${vitals.sbp}/${vitals.dbp}`, unit: "mmHg", tone: vitals.sbp < 90 ? "crit" : vitals.sbp < 110 ? "warn" : "normal" },
    { label: t("idh.monitor.hr", "HR"), value: String(vitals.hr), unit: "bpm", tone: vitals.hr > 100 ? "warn" : "good" },
    { label: t("idh.monitor.spo2", "SpO₂"), value: String(vitals.sbp < 90 ? 91 : 96), unit: "%", tone: vitals.sbp < 90 ? "warn" : "info" },
  ];

  const monitorStatusTone: "good" | "warn" | "crit" =
    vitals.tone === "crit" ? "crit" : vitals.tone === "warn" ? "warn" : "good";
  const monitorStatus =
    monitorStatusTone === "crit"
      ? t("idh.monitor.hypotension", "HYPOTENSION")
      : monitorStatusTone === "warn"
        ? t("idh.monitor.watch", "WATCH")
        : t("idh.monitor.stable", "STABLE");

  const dpPhase: Exclude<Phase, "assess" | "debrief"> | null =
    phase === "prescribe" || phase === "treat" || phase === "intervene" ? phase : null;
  const dpForPhase = dpPhase ? dpMap[dpPhase] : null;
  const dpInfo = dpPhase ? dpMeta[dpPhase] : null;
  const chosenForPhase = dpPhase ? choices[dpPhase] : null;

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4 sm:p-5">
        <div className="flex flex-wrap items-start gap-3">
          <Stethoscope className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{t("idh.caseTitle", "Mr. K, 64 — intradialytic hypotension")}</h2>
              <span className="rounded bg-[var(--signal)]/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--signal)]">
                {t("cases.fullCase", "Full case")}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">{t("idh.caseSubtitle", idhCase.presentation)}</p>
          </div>
        </div>
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-[11px] text-muted">
          <AlertTriangle className="h-3.5 w-3.5" />
          {t("idh.eduDisclaimer", "Educational model — not clinical decision support. Monitor values IFU-pending.")}
        </div>
      </div>

      <CasePhaseStepper
        current={phase}
        phases={stepperPhases}
        onPhaseClick={(id) => {
          const targetIdx = PHASE_SEQ.indexOf(id as Phase);
          // Allow navigation back to reached phases; forward only if choices exist.
          if (targetIdx <= reachedIdx) goTo(id as Phase);
        }}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: journey content */}
        <div className="order-2 space-y-4 lg:order-1 lg:col-span-2">
          {phase === "assess" && (
            <div className="glass-panel space-y-3 p-4 sm:p-5">
              <div className="text-[10px] uppercase tracking-wider text-accent">{t("idh.journey.assess", "Assess")}</div>
              <p className="text-sm text-muted">{t("idh.journey.assessIntro", "Review the presentation and baseline vitals, then begin the journey.")}</p>
              <div className="overflow-x-auto rounded-lg border border-[var(--hairline)]">
                <table className="w-full text-xs">
                  <thead className="bg-surface-2 text-muted">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">{t("cases.tMin", "t (min)")}</th>
                      {idhCase.vitalsCols.map((c) => (
                        <th key={c} className="px-3 py-2 text-left font-medium">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {idhCase.vitals.map((row) => (
                      <tr key={row.t} className={cn("border-t border-[var(--hairline)]", row.flag && "bg-danger/5")}>
                        <td className="px-3 py-2 tabular-nums text-muted">{row.t}</td>
                        {row.cells.map((cell, i) => (
                          <td key={i} className={cn("px-3 py-2", row.flag && i === 0 && "text-danger font-medium")}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={() => goTo("prescribe")}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-canvas"
              >
                {t("idh.journey.begin", "Begin journey")} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {dpPhase && dpForPhase && dpInfo && !chosenForPhase && (
            <div className="glass-panel space-y-3 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                <span>{dpInfo.at}</span>
                {dpPhase === "prescribe" && <span className="text-danger">{t("idh.sbpFalling", "SBP 98 and falling")}</span>}
              </div>
              <p className="text-base font-medium">{dpInfo.prompt}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {dpForPhase.map((o) => (
                  <DecisionCard
                    key={o.id}
                    title={o.label}
                    description={o.consequence}
                    consequence={o.citation ? `↳ ${o.citation}` : undefined}
                    variant={o.verdict === "correct" ? "primary" : "default"}
                    onClick={() => choose(dpPhase, o)}
                  />
                ))}
              </div>
            </div>
          )}

          {chosenForPhase && (
            <div className="space-y-3">
              <div className={cn("rounded-lg border p-4 text-sm", VERDICT_META[chosenForPhase.verdict].cls)}>
                <div className="flex items-center gap-1.5">
                  {(() => { const I = VERDICT_META[chosenForPhase.verdict].Icon; return <I className={cn("h-4 w-4", VERDICT_META[chosenForPhase.verdict].chip)} />; })()}
                  <span className={cn("font-medium", VERDICT_META[chosenForPhase.verdict].chip)}>
                    {t(VERDICT_META[chosenForPhase.verdict].labelKey, VERDICT_META[chosenForPhase.verdict].label)}.
                  </span>
                </div>
                <p className="mt-1 text-text/90">{chosenForPhase.consequence}</p>
                {chosenForPhase.citation && <p className="mt-1 text-xs text-muted">↳ {chosenForPhase.citation}</p>}
              </div>
              {phase !== "debrief" && (
                <button
                  type="button"
                  onClick={() => {
                    const idx = PHASE_SEQ.indexOf(phase);
                    const next = PHASE_SEQ[idx + 1];
                    if (next) goTo(next);
                  }}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-canvas"
                >
                  {t("idh.journey.continue", "Continue")} <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {phase === "debrief" && (
            <div className="space-y-4">
              <div className="glass-panel border border-accent/30 p-4 sm:p-5">
                <div className="text-[10px] uppercase tracking-wider text-accent">{t("idh.journey.caseComplete", "Case complete")}</div>
                <div className="mt-1 text-2xl font-semibold">
                  {anyWrong
                    ? t("idh.result.wrong", "Session aborted")
                    : allCorrect
                      ? t("idh.result.correct", "Patient stabilized")
                      : t("idh.result.warning", "Stabilized — at a cost")}
                </div>
                <div className="mt-1 text-xs text-muted">{t("idh.selfReferenced", "Self-referenced — your growth, not a leaderboard.")}</div>
              </div>

              <div className="glass-panel p-4 sm:p-5">
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">{t("idh.journey.yourChoices", "Your decisions")}</h3>
                <ol className="space-y-1.5 text-sm">
                  {(["prescribe", "treat", "intervene"] as const).map((p, i) => {
                    const c = choices[p];
                    if (!c) return null;
                    const meta = VERDICT_META[c.verdict];
                    const I = meta.Icon;
                    return (
                      <li key={p} className="flex items-start gap-2">
                        <span className="tabular-nums text-accent">{i + 1}.</span>
                        <span className="flex-1">
                          <span className="text-text">{c.label}</span>
                          <span className={cn("ml-2 inline-flex items-center gap-0.5 text-[11px]", meta.chip)}>
                            <I className="h-3 w-3" /> {t(meta.labelKey, meta.label)}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="glass-panel p-4 sm:p-5">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold">
                  <Quote className="h-4 w-4 text-accent" />
                  {t("idh.debrief.heading", "Debrief")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed">{t("idh.debrief.body", idhCase.debrief)}</p>
                <div className="mt-3 border-t border-[var(--hairline)] pt-3 text-xs text-muted">
                  <div className="uppercase tracking-wider">{t("idh.citations.heading", "Citations")}</div>
                  <ul className="mt-1 space-y-0.5">
                    {idhCase.citations.map((c) => (
                      <li key={c}>· {c}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                type="button"
                onClick={reset}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[var(--hairline)] px-3 py-2 text-sm text-muted hover:text-text"
              >
                <RotateCcw className="h-4 w-4" /> {t("idh.journey.restart", "Restart case")}
              </button>
            </div>
          )}

        </div>

        {/* Right: live themed monitor + trajectory */}
        <div className="order-1 space-y-4 lg:order-2">
          <PatientMonitor
            title={`${t("idh.monitor.label", "PATIENT MONITOR")} · ${phase}`}
            status={monitorStatus}
            statusTone={monitorStatusTone}
            vitals={monitorVitals}
            footer={vitals.symptom}
          />
          <div className="glass-panel p-4 text-xs">
            <div className="mb-2 flex items-center gap-1.5 uppercase tracking-wider text-muted">
              <Activity className="h-3.5 w-3.5" />
              {t("idh.trajectory.heading", "Trajectory")}
            </div>
            <ul className="space-y-1 text-muted">
              <li>{t("idh.trajectory.t0", "t=0 · 148/82 · baseline (AM antihypertensive)")}</li>
              <li>{t("idh.trajectory.t60", "t=60 · 126/74 · refill marginal")}</li>
              <li className="text-text">{t("idh.trajectory.t90", "t=90 · 98/58 · symptomatic — decision point")}</li>
              <li>{t("idh.trajectory.t95", "t=95+ · depends on your action")}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

