/** Simulation Hub — unified Device Lab + Clinical Simulator flow. */

export type HubStep = "explore" | "prime" | "cases" | "alarms" | "signoff";
export type ExploreView = "operate" | "circuit" | "monitor" | "labs";

export const HUB_STEPS: readonly HubStep[] = [
  "explore",
  "prime",
  "cases",
  "alarms",
  "signoff",
] as const;

export const EXPLORE_VIEWS: readonly ExploreView[] = [
  "operate",
  "circuit",
  "monitor",
  "labs",
] as const;

export const HUB_STEP_LABELS: Record<HubStep, string> = {
  explore: "Explore",
  prime: "Prime",
  cases: "Patient Cases",
  alarms: "Alarms",
  signoff: "Sign-off",
};

export const HUB_STEP_I18N: Record<HubStep, string> = {
  explore: "hub.step.explore",
  prime: "hub.step.prime",
  cases: "hub.step.cases",
  alarms: "hub.step.alarms",
  signoff: "hub.step.signoff",
};

export const EXPLORE_VIEW_LABELS: Record<ExploreView, string> = {
  operate: "Operate the 5008 for online-HDF",
  circuit: "Fluid Circuit",
  monitor: "5008 Monitor",
  labs: "Concept Labs",
};

export const EXPLORE_VIEW_I18N: Record<ExploreView, string> = {
  operate: "hub.explore.operate",
  circuit: "hub.explore.circuit",
  monitor: "hub.explore.monitor",
  labs: "hub.explore.labs",
};

export function parseHubStep(raw: string | null): HubStep {
  if (raw && HUB_STEPS.includes(raw as HubStep)) return raw as HubStep;
  return "explore";
}

export function parseExploreView(raw: string | null): ExploreView {
  if (raw && EXPLORE_VIEWS.includes(raw as ExploreView)) return raw as ExploreView;
  return "operate";
}

/** Map legacy `?tab=` query from the old Clinical Simulator. */
export function resolveLegacyTab(
  tab: string | null
): { step: HubStep; view?: ExploreView } | null {
  switch (tab) {
    case "circuit":
      return { step: "explore", view: "circuit" };
    case "monitor":
      return { step: "explore", view: "monitor" };
    case "cases":
      return { step: "cases" };
    case "labs":
      return { step: "explore", view: "labs" };
    default:
      return null;
  }
}

/** Build a Simulation Hub href (Next.js router handles basePath). */
export function hubHref(
  step: HubStep = "explore",
  view: ExploreView = "operate",
  extra?: Record<string, string>
): string {
  const params = new URLSearchParams();
  if (step !== "explore") params.set("step", step);
  if (step === "explore" && view !== "operate") params.set("view", view);
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => params.set(k, v));
  }
  const q = params.toString();
  return q ? `/simulator?${q}` : "/simulator";
}

export const HUB_FLOW_STEPS = HUB_STEPS.map((id) => ({
  id,
  label: HUB_STEP_LABELS[id],
  labelKey: HUB_STEP_I18N[id],
}));
