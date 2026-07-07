"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Box, ShieldAlert, BadgeCheck, ChevronRight } from "lucide-react";
import { useLang } from "@/components/providers/LanguageProvider";
import { StepNav } from "@/components/flow/StepNav";
import { FlowFooter } from "@/components/flow/FlowFooter";
import { usePlatformStore } from "@/lib/store";
import { emitStatement } from "@/lib/xapi";
import {
  HUB_FLOW_STEPS,
  HUB_STEPS,
  parseExploreView,
  parseHubStep,
  resolveLegacyTab,
  type ExploreView,
  type HubStep,
} from "@/lib/simulation-hub";
import { CircuitSim } from "@/components/simulator/CircuitSim";
import { Monitor5008 } from "@/components/simulator/Monitor5008";
import { CaseLab } from "@/components/simulator/CaseLab";
import { CourseSim } from "@/components/course/CourseSims";
import type { WidgetKey } from "@/lib/c1-course";
import { FlaskConical } from "lucide-react";
import { ExploreOperate, DIALYZERS, SYSTEMS } from "./hub/ExploreOperate";
import { ExploreSubNav } from "./hub/ExploreSubNav";
import { PrimeStep } from "./hub/PrimeStep";
import { MergedAlarmsStep } from "./hub/MergedAlarmsStep";
import { SignoffStep } from "./hub/SignoffStep";

const LABS: { w: WidgetKey; titleKey: string; descKey: string; t: string; d: string }[] = [
  { w: "convection", titleKey: "sim.labs.convection.t", descKey: "sim.labs.convection.d", t: "Convection clearance", d: "Small-solute vs middle-molecule clearance as convective volume rises." },
  { w: "dose", titleKey: "sim.labs.dose.t", descKey: "sim.labs.dose.d", t: "Dose–response", d: "Where the benefit concentrates against the ≥23 L target." },
  { w: "sieving", titleKey: "sim.labs.sieving.t", descKey: "sim.labs.sieving.d", t: "Sieving coefficient", d: "How freely a molecule crosses with the fluid, by size." },
  { w: "dilution", titleKey: "sim.labs.dilution.t", descKey: "sim.labs.dilution.d", t: "Pre / post-dilution", d: "Filtration-fraction ceiling and the volume you can safely reach." },
];

function SimulationHubInner() {
  const params = useSearchParams();
  const router = useRouter();
  const setSkill = usePlatformStore((s) => s.setSkill);
  const { t } = useLang();

  const legacyTab = params.get("tab");
  const currentStep = parseHubStep(params.get("step"));
  const exploreView = parseExploreView(params.get("view"));
  const currentIdx = HUB_STEPS.indexOf(currentStep);
  const isFirst = currentIdx <= 0;

  const [completedSteps, setCompletedSteps] = useState<Set<HubStep>>(() => new Set());
  const [mastered, setMastered] = useState(false);

  // Legacy `?tab=` → canonical hub params (one-time replace)
  useEffect(() => {
    const mapped = resolveLegacyTab(legacyTab);
    if (!mapped) return;
    const next = new URLSearchParams(params.toString());
    next.delete("tab");
    next.set("step", mapped.step);
    if (mapped.view) next.set("view", mapped.view);
    router.replace(`/simulator?${next.toString()}`, { scroll: false });
  }, [legacyTab, params, router]);

  const updateHubUrl = useCallback(
    (patch: { step?: HubStep; view?: ExploreView; extra?: Record<string, string> }) => {
      const next = new URLSearchParams(params.toString());
      next.delete("tab");
      if (patch.step) {
        if (patch.step === "explore") next.delete("step");
        else next.set("step", patch.step);
      }
      if (patch.view) {
        if (patch.view === "operate") next.delete("view");
        else next.set("view", patch.view);
      }
      if (patch.extra) {
        Object.entries(patch.extra).forEach(([k, v]) => next.set(k, v));
      }
      const q = next.toString();
      router.replace(q ? `/simulator?${q}` : "/simulator", { scroll: false });
    },
    [params, router]
  );

  const advanceTo = useCallback(
    (next: HubStep) => {
      setCompletedSteps((prev) => {
        const s = new Set(prev);
        const idx = HUB_STEPS.indexOf(next);
        if (idx > 0) s.add(HUB_STEPS[idx - 1]);
        return s;
      });
      updateHubUrl({ step: next });
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [updateHubUrl]
  );

  const handleStepSelect = useCallback(
    (step: HubStep) => {
      updateHubUrl({ step });
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [updateHubUrl]
  );

  const handleExploreView = useCallback(
    (view: ExploreView) => {
      updateHubUrl({ step: "explore", view });
    },
    [updateHubUrl]
  );

  const flowBack = useCallback(() => {
    if (isFirst) return;
    updateHubUrl({ step: HUB_STEPS[currentIdx - 1] });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentIdx, isFirst, updateHubUrl]);

  const handleComplete = useCallback(() => {
    setCompletedSteps(new Set(HUB_STEPS));
    setMastered(true);
    setSkill("devices", "mastered", 100);
    setSkill("alarms", "mastered", 90);
    emitStatement("completed", "simulation-hub", "C3 gate — Simulation Hub mastered");
    router.push("/learn/c3");
  }, [router, setCompletedSteps, setSkill]);

  // Operate view config (system / dialyzer)
  const systemId = params.get("system") || "5008s";
  const dialyzerId = params.get("dialyzer") || "fx_coral";
  const autoSub = params.get("autosub") !== "false";
  const system = SYSTEMS.find((s) => s.id === systemId) ?? SYSTEMS[1];
  const dialyzer = DIALYZERS.find((d) => d.id === dialyzerId) ?? DIALYZERS[1];

  const updateDeviceUrl = useCallback(
    (patch: Record<string, string>) => {
      updateHubUrl({ step: "explore", view: "operate", extra: patch });
      emitStatement("interacted", "device-config", `Config ${JSON.stringify(patch)}`);
    },
    [updateHubUrl]
  );

  const convIndex = useMemo(() => {
    const base = (dialyzer.convective - 55) / 40;
    return Math.max(0.08, Math.min(1, base + (autoSub && system.hdf ? 0.25 : 0)));
  }, [dialyzer.convective, autoSub, system.hdf]);

  const features = useMemo(() => {
    const list = ["HD (diffusion)"];
    if (system.hdf) list.push("HDF post-dilution", "ONLINE substitution");
    if (systemId === "5008s") list.push("AutoSub plus", "VAM monitoring");
    return list;
  }, [systemId, system.hdf]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <header>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted">
          <Box className="h-4 w-4 text-flow" />
          {t("hub.eyebrow", "Simulation Hub")}
        </div>
        <h1 className="mt-1 font-display text-2xl tracking-tight sm:text-3xl lg:text-4xl">
          {t("hub.title", "Simulation Hub")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          {t(
            "hub.subtitle",
            "One hands-on path — explore the 5008 and circuit, prime, decide under a patient, respond to alarms, and sign off."
          )}
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-[11px] text-muted">
          <ShieldAlert className="h-3.5 w-3.5" />
          {t("common.eduModel", "Educational model — not clinical decision support. Device values IFU-pending.")}
        </div>

        <div className="mt-4 -mx-1 overflow-x-auto scrollbar-none">
          <StepNav
            steps={HUB_FLOW_STEPS}
            current={currentStep}
            completed={completedSteps}
            onStepSelect={handleStepSelect}
            allowSkipAhead
            className="min-w-max flex-nowrap px-1"
          />
        </div>
      </header>

      {mastered && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300">
          <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-400" />
          {t(
            "hub.mastered.banner",
            "Simulation Hub mastered — C3 gate recorded. Revisit any step using the rail above."
          )}
        </div>
      )}

      {currentStep === "explore" && (
        <div className="space-y-4">
          <ExploreSubNav view={exploreView} onViewChange={handleExploreView} />
          {exploreView === "operate" && (
            <ExploreOperate
              system={system}
              dialyzer={dialyzer}
              autoSub={autoSub}
              systemId={systemId}
              dialyzerId={dialyzerId}
              convIndex={convIndex}
              features={features}
              updateUrl={updateDeviceUrl}
              setSkillInProgress={() => setSkill("devices", "in_progress")}
            />
          )}
          {exploreView === "circuit" && <CircuitSim />}
          {exploreView === "monitor" && <Monitor5008 />}
          {exploreView === "labs" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-muted">
                <FlaskConical className="h-4 w-4 text-accent" />
                {t(
                  "sim.labs.eyebrow",
                  "Interactive physiology labs — adjust the parameters and read the result. Educational model."
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {LABS.map((lab) => (
                  <div key={lab.w} className="glass-panel p-4 sm:p-5">
                    <h3 className="text-sm font-semibold">{t(lab.titleKey, lab.t)}</h3>
                    <p className="mb-3 mt-0.5 text-[11px] text-muted">{t(lab.descKey, lab.d)}</p>
                    <CourseSim widget={lab.w} />
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              className="btn btn-primary gap-1.5"
              onClick={() => advanceTo("prime")}
            >
              {t("deviceLab.explore.continue", "Continue to Prime")} <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {currentStep === "prime" && <PrimeStep onNext={() => advanceTo("cases")} />}
      {currentStep === "cases" && (
        <div className="space-y-4">
          <CaseLab />
          <div className="flex justify-end">
            <button type="button" className="btn btn-primary gap-1.5" onClick={() => advanceTo("alarms")}>
              {t("hub.cases.continue", "Continue to Alarms")} <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {currentStep === "alarms" && <MergedAlarmsStep onNext={() => advanceTo("signoff")} />}
      {currentStep === "signoff" && <SignoffStep onComplete={handleComplete} />}

      {!isFirst && currentStep !== "signoff" && (
        <FlowFooter onBack={flowBack} showContinue={false} />
      )}
    </div>
  );
}

function HubLoading() {
  const { t } = useLang();
  return <div className="text-muted">{t("sim.loading", "Loading simulator…")}</div>;
}

export function SimulationHub() {
  return (
    <Suspense fallback={<HubLoading />}>
      <SimulationHubInner />
    </Suspense>
  );
}
