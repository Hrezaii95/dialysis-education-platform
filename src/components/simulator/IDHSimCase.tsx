"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Stethoscope,
  ArrowRight,
  RotateCcw,
  Quote,
  Activity,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import { usePlatformStore } from "@/lib/store";
import { emitStatement } from "@/lib/xapi";
import { useLang } from "@/components/providers/LanguageProvider";
import { StepNav } from "@/components/flow/StepNav";
import { FlowFooter } from "@/components/flow/FlowFooter";
import { useFlowNavigation } from "@/hooks/useFlowNavigation";
import { IDH_CASE_PHASES, PatientMonitor, type MonitorTone } from "./PatientCaseUI";

type Vitals = {
  sbp: number;
  dbp: number;
  hr: number;
  spo2: number;
  t: number;
  symptom: string;
  tone: MonitorTone;
};
type Verdict = "correct" | "warning" | "wrong";
type IdhStep = (typeof IDH_CASE_PHASES)[number]["id"];

const IDH_STEPS = IDH_CASE_PHASES.map((p) => p.id) as IdhStep[];

const BASELINE: Vitals = {
  sbp: 148,
  dbp: 82,
  hr: 78,
  spo2: 98,
  t: 0,
  symptom: "none — took AM antihypertensive",
  tone: "good",
};
const CRISIS: Vitals = {
  sbp: 98,
  dbp: 58,
  hr: 96,
  spo2: 96,
  t: 90,
  symptom: "yawning, left calf cramp",
  tone: "warn",
};
const RECOVERED: Vitals = {
  sbp: 112,
  dbp: 70,
  hr: 84,
  spo2: 98,
  t: 100,
  symptom: "cramp easing, alert",
  tone: "good",
};
const REBOUND: Vitals = {
  sbp: 132,
  dbp: 80,
  hr: 88,
  spo2: 98,
  t: 100,
  symptom: "transient rise — rebound risk",
  tone: "warn",
};
const CRASH: Vitals = {
  sbp: 78,
  dbp: 44,
  hr: 108,
  spo2: 91,
  t: 95,
  symptom: "diaphoretic, near-syncope",
  tone: "crit",
};

interface Option {
  id: string;
  labelKey: string;
  labelFallback: string;
  verdict: Verdict;
  result: Vitals;
  consequenceKey: string;
  consequenceFallback: string;
  cite: string;
}

const OPTIONS: Option[] = [
  {
    id: "a",
    labelKey: "idh.option.a",
    labelFallback: "Stop/reduce UF + Trendelenburg + small saline bolus",
    verdict: "correct",
    result: RECOVERED,
    consequenceKey: "idh.consequence.a",
    consequenceFallback:
      "SBP recovers to 112/70 by t=100; the cramp eases. Stop/reduce ultrafiltration, lay the patient flat, give a measured saline bolus — but avoid excess fluid replacement (sodium overload).",
    cite: "AREP intradialytic-hypotension",
  },
  {
    id: "b",
    labelKey: "idh.option.b",
    labelFallback: "Large 500 mL+ hypertonic/saline bolus, continue UF",
    verdict: "warning",
    result: REBOUND,
    consequenceKey: "idh.consequence.b",
    consequenceFallback:
      "Transient rise then rebound; the session ends sodium-overloaded and sets up next-session hypertension and thirst. Excess fluid replacement should be avoided.",
    cite: "AREP intradialytic-hypotension",
  },
  {
    id: "c",
    labelKey: "idh.option.c",
    labelFallback: "Do nothing — let it ride",
    verdict: "wrong",
    result: CRASH,
    consequenceKey: "idh.consequence.c",
    consequenceFallback:
      "t=95 SBP 78/44, near-syncope, session aborted. IDH is not benign — it carries myocardial stunning and hypoperfusion risk.",
    cite: "HV-HDF Handbook; Burton 2009 CJASN PMID 19357245",
  },
];

const V: Record<
  Verdict,
  { label: string; cls: string; chip: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  correct: { label: "Optimal", cls: "border-teal/50 bg-teal/10", chip: "text-teal", Icon: Check },
  warning: { label: "Suboptimal", cls: "border-gold/50 bg-gold/10", chip: "text-gold", Icon: AlertTriangle },
  wrong: { label: "Harmful", cls: "border-red-500/50 bg-red-500/10", chip: "text-red-400", Icon: X },
};

export function IDHSimCase() {
  const flow = useFlowNavigation<IdhStep>({
    steps: IDH_STEPS,
    initial: "brief",
    completeRoute: "/learn/c5",
  });
  const { current: step, completed, goTo, back, isFirst, markComplete, setCompleted } = flow;

  const [vitals, setVitals] = useState<Vitals>(BASELINE);
  const [picked, setPicked] = useState<Option | null>(null);
  const setSkill = usePlatformStore((s) => s.setSkill);
  const addCaseDecision = usePlatformStore((s) => s.addCaseDecision);
  const { t } = useLang();

  const begin = useCallback(() => {
    setVitals(CRISIS);
    markComplete("brief");
    goTo("crisis");
    emitStatement("experienced", "case-idh", "IDH crisis presented");
  }, [goTo, markComplete]);

  const choose = useCallback(
    (o: Option) => {
      setPicked(o);
      setVitals(o.result);
      markComplete("crisis");
      goTo("outcome");
      addCaseDecision(`IDH DP1 · ${o.verdict}`);
      emitStatement("interacted", "case-idh", `DP1: ${o.verdict}`);
    },
    [addCaseDecision, goTo, markComplete]
  );

  const finish = useCallback(() => {
    setSkill("cases", picked?.verdict === "correct" ? "mastered" : "in_progress");
    setSkill("c5", picked?.verdict === "correct" ? "mastered" : "in_progress");
    emitStatement("completed", "case-idh", "IDH case debrief");
    markComplete("outcome");
    goTo("debrief");
  }, [goTo, markComplete, picked?.verdict, setSkill]);

  const reset = useCallback(() => {
    setVitals(BASELINE);
    setPicked(null);
    setCompleted(new Set());
    goTo("brief");
  }, [goTo, setCompleted]);

  const handleStepSelect = useCallback(
    (id: IdhStep) => {
      if (id === "crisis" && step === "brief") begin();
      else if (id === "outcome" && picked) goTo("outcome");
      else if (id === "debrief" && picked && step !== "brief") {
        if (step === "outcome") finish();
        else goTo("debrief");
      } else goTo(id);
    },
    [begin, finish, goTo, picked, step]
  );

  const statusTone: "good" | "warn" | "crit" =
    vitals.tone === "crit" ? "crit" : vitals.tone === "warn" ? "warn" : "good";

  return (
    <div className="space-y-4">
      <StepNav
        steps={IDH_CASE_PHASES}
        current={step}
        completed={completed}
        onStepSelect={handleStepSelect}
        allowSkipAhead={false}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2 order-2 lg:order-1">
          <div className="glass-panel p-5">
            <div className="flex items-start gap-3">
              <Stethoscope className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{t("idh.caseTitle", "Mr. K, 64 — intradialytic hypotension")}</h2>
                  <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-accent">
                    {t("idh.caseBadge", "Cited case")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {t(
                    "idh.caseSubtitle",
                    "Diabetic, 3×/week in-center HD via AVF. Large interdialytic weight gain (+3.8 kg); UF goal 3.5 L over 4 h. Took his morning antihypertensive. 90 min in he reports lightheadedness, yawning, and a left calf cramp."
                  )}
                </p>
              </div>
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-[11px] text-muted">
              <AlertTriangle className="h-3.5 w-3.5" />
              {t("idh.eduDisclaimer", "Educational model — not clinical decision support. Monitor values IFU-pending.")}
            </div>
          </div>

          {step === "brief" && (
            <button
              type="button"
              onClick={begin}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-canvas"
            >
              {t("idh.startSession", "Start the session")} <ArrowRight className="h-4 w-4" />
            </button>
          )}

          {step === "crisis" && (
            <div className="glass-panel space-y-3 p-5">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{t("idh.decisionLabel", "Decision · t = 90 min")}</span>
                <span className="text-red-400">{t("idh.sbpFalling", "SBP 98 and falling")}</span>
              </div>
              <p className="text-base font-medium">{t("idh.firstAction", "Your first action?")}</p>
              <div className="space-y-2">
                {OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => choose(o)}
                    className="w-full rounded-lg border border-white/10 px-3 py-2.5 text-left text-sm transition-colors hover:border-accent/40 hover:bg-surface-2"
                  >
                    {t(o.labelKey, o.labelFallback)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "outcome" && picked && (
            <div className="space-y-3">
              <div className={cn("rounded-lg border p-4 text-sm", V[picked.verdict].cls)}>
                <div className="flex items-center gap-1.5">
                  {(() => {
                    const I = V[picked.verdict].Icon;
                    return <I className={cn("h-4 w-4", V[picked.verdict].chip)} />;
                  })()}
                  <span className={cn("font-medium", V[picked.verdict].chip)}>{V[picked.verdict].label}.</span>
                </div>
                <p className="mt-1 text-text/90">{t(picked.consequenceKey, picked.consequenceFallback)}</p>
                <p className="mt-1 text-xs text-muted">↳ {picked.cite}</p>
              </div>
              <button
                type="button"
                onClick={finish}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-canvas"
              >
                {t("cases.seeDebrief", "See debrief")} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {step === "debrief" && picked && (
            <div className="space-y-4">
              <div className="glass-panel border border-accent/30 p-5">
                <div className="text-[10px] uppercase tracking-wider text-accent">{t("cases.yourResult", "Your result")}</div>
                <div className="mt-1 text-2xl font-semibold">
                  {picked.verdict === "correct"
                    ? t("idh.result.correct", "Patient stabilized")
                    : picked.verdict === "warning"
                      ? t("idh.result.warning", "Stabilized — at a cost")
                      : t("idh.result.wrong", "Session aborted")}
                </div>
                <div className="mt-1 text-xs text-muted">
                  {t("idh.selfReferenced", "Self-referenced — your growth, not a leaderboard.")}
                </div>
              </div>
              <div className="glass-panel p-5">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold">
                  <Quote className="h-4 w-4 text-accent" />
                  {t("idh.debrief.heading", "Debrief")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed">
                  {t(
                    "idh.debrief.body",
                    "IDH is multifactorial — plasma-refill vs UF rate, autonomic dysfunction, cardiac reserve, thermal balance. The win is the prevention bundle + modality, not heroic rescue. Outcome tie-in: CONVINCE showed lower IDH incidence with high-volume HDF vs high-flux HD — the device story and the patient story are the same story."
                  )}
                </p>
                <div className="mt-3 border-t border-white/8 pt-3 text-xs text-muted">
                  <div className="uppercase tracking-wider">{t("idh.citations.heading", "Citations")}</div>
                  <ul className="mt-1 space-y-0.5">
                    <li>· AREP intradialytic-hypotension.html</li>
                    <li>· Karaboyas 2017 AJKD PMID 28526352</li>
                    <li>· CONVINCE (Blankestijn 2023 NEJM DOI 10.1056/NEJMoa2304820)</li>
                  </ul>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/learn/c5" className="btn btn-primary gap-1.5">
                  {t("flow.footer.continueToHub", "Continue to C5 hub")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm text-muted hover:text-text"
                >
                  <RotateCcw className="h-4 w-4" /> {t("cases.retry", "Retry")}
                </button>
              </div>
            </div>
          )}

          {!isFirst && step !== "debrief" && (
            <FlowFooter onBack={back} showContinue={false} />
          )}
        </div>

        <div className="order-1 lg:order-2">
          <PatientMonitor
            title={`${t("idh.monitor.label", "PATIENT MONITOR")} · t=${vitals.t}min`}
            status={
              vitals.tone === "crit"
                ? t("idh.monitor.hypotension", "HYPOTENSION")
                : vitals.tone === "warn"
                  ? t("idh.monitor.watch", "WATCH")
                  : t("idh.monitor.stable", "STABLE")
            }
            statusTone={statusTone}
            vitals={[
              {
                label: t("idh.monitor.bp", "BP"),
                value: `${vitals.sbp}/${vitals.dbp}`,
                unit: "mmHg",
                tone: vitals.sbp < 90 ? "crit" : vitals.sbp < 110 ? "warn" : "normal",
              },
              {
                label: t("idh.monitor.hr", "HR"),
                value: String(vitals.hr),
                unit: "bpm",
                tone: vitals.hr > 100 ? "warn" : "good",
              },
              {
                label: t("idh.monitor.spo2", "SpO₂"),
                value: String(vitals.spo2),
                unit: "%",
                tone: vitals.spo2 < 94 ? "warn" : "info",
              },
            ]}
            footer={vitals.symptom}
          />
          <div className="glass-panel mt-4 p-4 text-xs">
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
