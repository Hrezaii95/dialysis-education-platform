"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { CircuitSim } from "@/components/simulator/CircuitSim";
import { Monitor5008 } from "@/components/simulator/Monitor5008";
import { CaseLab } from "@/components/simulator/CaseLab";
import { IDHSimCase } from "@/components/simulator/IDHSimCase";
import { CourseSim } from "@/components/course/CourseSims";
import type { WidgetKey } from "@/lib/c1-course";
import { Cpu, BellRing, ArrowRight, FlaskConical } from "lucide-react";
import { useLang } from "@/components/providers/LanguageProvider";

const TABS = [
  { id: "circuit", labelKey: "sim.tab.circuit", shortKey: "sim.tab.circuit.short", label: "Fluid Circuit", short: "Circuit" },
  { id: "monitor", labelKey: "sim.tab.monitor", shortKey: "sim.tab.monitor.short", label: "5008 Monitor", short: "Monitor" },
  { id: "cases", labelKey: "sim.tab.cases", shortKey: "sim.tab.cases.short", label: "Patient Cases", short: "Cases" },
  { id: "labs", labelKey: "sim.tab.labs", shortKey: "sim.tab.labs.short", label: "Concept Labs", short: "Labs" },
] as const;

const LABS: { w: WidgetKey; titleKey: string; descKey: string; t: string; d: string }[] = [
  { w: "convection", titleKey: "sim.labs.convection.t", descKey: "sim.labs.convection.d", t: "Convection clearance", d: "Small-solute vs middle-molecule clearance as convective volume rises." },
  { w: "dose", titleKey: "sim.labs.dose.t", descKey: "sim.labs.dose.d", t: "Dose–response", d: "Where the benefit concentrates against the ≥23 L target." },
  { w: "sieving", titleKey: "sim.labs.sieving.t", descKey: "sim.labs.sieving.d", t: "Sieving coefficient", d: "How freely a molecule crosses with the fluid, by size." },
  { w: "dilution", titleKey: "sim.labs.dilution.t", descKey: "sim.labs.dilution.d", t: "Pre / post-dilution", d: "Filtration-fraction ceiling and the volume you can safely reach." },
];

function SimulatorContent() {
  const { t } = useLang();
  const params = useSearchParams();
  const tab = (params.get("tab") as (typeof TABS)[number]["id"]) || "circuit";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("sim.title", "Clinical Simulator")}</h1>
        <p className="mt-1 text-sm text-muted">
          {t(
            "sim.subtitle",
            "The hands-on layer — operate the circuit and monitor, decide under a deteriorating patient, and probe the physics in the concept labs."
          )}
        </p>
      </header>

      {/* the wider simulation suite */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/devices" className="glass-panel flex items-center justify-between gap-3 p-4 transition-colors hover:border-accent/40">
          <span className="flex items-center gap-3">
            <Cpu className="h-5 w-5 text-flow" />
            <span className="text-sm">
              <span className="font-medium">{t("sim.suite.device.title", "Device Lab (3D)")}</span>
              <span className="block text-[11px] text-muted">
                {t("sim.suite.device.desc", "Explore → prime → prescribe ≥23 L → alarms → sign-off")}
              </span>
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted" />
        </Link>
        <Link href="/alarms" className="glass-panel flex items-center justify-between gap-3 p-4 transition-colors hover:border-accent/40">
          <span className="flex items-center gap-3">
            <BellRing className="h-5 w-5 text-gold" />
            <span className="text-sm">
              <span className="font-medium">{t("sim.suite.alarms.title", "Alarm Trainer")}</span>
              <span className="block text-[11px] text-muted">
                {t("sim.suite.alarms.desc", "Timed TMP / conductivity / air-detector response")}
              </span>
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted" />
        </Link>
      </div>

      <nav className="flex gap-1 overflow-x-auto rounded-lg bg-surface-2 p-1 -mx-1 scrollbar-none">
        {TABS.map((tabItem) => (
          <Link
            key={tabItem.id}
            href={`/simulator?tab=${tabItem.id}`}
            className={cn(
              "shrink-0 flex-1 min-w-[88px] rounded-md px-3 sm:px-4 py-2.5 text-center text-xs sm:text-sm font-medium transition-colors",
              // text-canvas (not text-white): --accent flips from a LIGHT blue in dark
              // theme to a dark navy in light theme, so the active-tab label needs the
              // canvas-polarity ink to stay AA in both themes (fixes a real S4 regression
              // — the old teal accent was dark enough for white text; the brand blue isn't).
              tab === tabItem.id ? "bg-accent text-canvas" : "text-muted hover:text-text"
            )}
          >
            <span className="sm:hidden">{t(tabItem.shortKey, tabItem.short)}</span>
            <span className="hidden sm:inline">{t(tabItem.labelKey, tabItem.label)}</span>
          </Link>
        ))}
      </nav>

      {tab === "circuit" && <CircuitSim />}
      {tab === "monitor" && <Monitor5008 />}
      {tab === "cases" && (
        <div className="space-y-8">
          <IDHSimCase />
          <section>
            <h3 className="mb-3 text-sm font-semibold text-muted">
              {t("sim.cases.eyebrow", "More scenarios — modality lab")}
            </h3>
            <CaseLab />
          </section>
        </div>
      )}
      {tab === "labs" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-muted">
            <FlaskConical className="h-4 w-4 text-accent" />{" "}
            {t(
              "sim.labs.eyebrow",
              "Interactive physiology labs — adjust the parameters and read the result. Educational model."
            )}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
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
    </div>
  );
}

function SimulatorFallback() {
  const { t } = useLang();
  return <div className="text-muted">{t("sim.loading", "Loading simulator…")}</div>;
}

export default function SimulatorPage() {
  return (
    <Suspense fallback={<SimulatorFallback />}>
      <SimulatorContent />
    </Suspense>
  );
}
