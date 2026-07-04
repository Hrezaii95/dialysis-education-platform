"use client";

import { useEffect, useMemo, useState } from "react";
import { useMachine } from "@xstate/react";
import { caseMachine } from "@/lib/case-machine";
import { computePhysics } from "@/lib/sim-engine/physics";
import { usePlatformStore } from "@/lib/store";
import { emitStatement } from "@/lib/xapi";
import { CASES } from "@/lib/cases";
import { DebriefPanel } from "./DebriefPanel";
import { CasePhaseStepper, DecisionCard, VitalsMonitor } from "./PatientCaseUI";
import { cn } from "@/lib/utils";
import { withBasePath } from "@/lib/asset";
import { FileText, Stethoscope, Lock } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  age: number;
  avatar: string;
  access: string;
  story: string;
  vitals: Record<string, string>;
  learning_objectives: string[];
  build?: "real" | "stub";
}

// Map the 4 locked cases.ts entries into the Patient shape that CaseLab needs.
// patients.json is the authoritative source for vitals/story; cases.ts owns the
// clinical content (title, presentation, decision points, debrief, citations).
// We merge them at load time so CaseLab always shows the locked case set.
function mergeCasesWithPatients(jsonPatients: Patient[]): Patient[] {
  return CASES.map((c) => {
    const json = jsonPatients.find((p) => p.id === c.id);
    return {
      id: c.id,
      name: json?.name ?? c.title,
      age: json?.age ?? 0,
      avatar: json?.avatar ?? c.code,
      access: json?.access ?? "",
      // Prefer the cases.ts canonical presentation (richer clinical detail)
      story: c.presentation,
      vitals: json?.vitals ?? {},
      learning_objectives: json?.learning_objectives ?? [],
      build: c.build,
    };
  });
}

export function CaseLab() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedId, setSelectedId] = useState("idh");

  useEffect(() => {
    fetch(withBasePath("/data/patients.json"))
      .then((r) => r.json())
      .then((d) => setPatients(mergeCasesWithPatients(d.cases)));
  }, []);

  const selectPatient = (id: string) => {
    setSelectedId(id);
    emitStatement("experienced", `case-${id}`, `Opened patient case ${id}`);
  };

  if (!patients.length) {
    return <div className="text-muted">Loading cases…</div>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Four intradialytic-complication cases (competency C5). Case 1 is fully interactive;
        Cases 2–4 show the clinical presentation and first decision point — full branching in the production build.
      </p>
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="space-y-2 lg:col-span-1">
          <h3 className="font-semibold text-xs text-muted uppercase tracking-wider">Case panel</h3>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible scrollbar-none">
          {patients.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => selectPatient(p.id)}
              className={cn(
                "shrink-0 w-[min(75vw,240px)] lg:w-full text-left rounded-xl border p-3 transition-all",
                selectedId === p.id ? "border-accent bg-accent/10" : "border-white/8 hover:bg-surface-2"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-xs font-bold">
                  {p.avatar}
                </span>
                <div>
                  <div className="font-medium text-sm flex items-center gap-1">
                    {p.name}
                    {p.build === "stub" && (
                      <Lock className="h-3 w-3 text-muted" aria-label="Preview stub" />
                    )}
                  </div>
                  <div className="text-[10px] text-muted">
                    {p.build === "stub" ? "preview" : "interactive"}
                  </div>
                </div>
              </div>
            </button>
          ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          <CaseLabSession key={selectedId} patientId={selectedId} patients={patients} />
        </div>
      </div>
    </div>
  );
}

function CaseLabSession({ patientId, patients }: { patientId: string; patients: Patient[] }) {
  const addCaseDecision = usePlatformStore((s) => s.addCaseDecision);
  const [state, send] = useMachine(caseMachine, { input: { patientId } });
  const patient = patients.find((p) => p.id === patientId)!;
  const physics = useMemo(() => computePhysics(state.context.sim), [state.context.sim]);
  const phase = String(state.value);

  const logDecision = (d: string) => {
    addCaseDecision(d);
    emitStatement("interacted", `case-${patientId}`, d);
  };

  const isDebrief = state.matches("debrief");
  const isStub = patient?.build === "stub";

  // Stub cases: show presentation + first decision point label + honest preview notice.
  if (isStub) {
    const locked = CASES.find((c) => c.id === patientId)!;
    const dp1 = locked.decisionPoints[0];
    return (
      <div className="space-y-4">
        <div className="glass-panel p-5 space-y-3">
          <div className="flex items-start gap-3">
            <Stethoscope className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold">{locked.code}: {locked.title}</h2>
              <p className="mt-1 text-sm text-muted">{locked.presentation}</p>
            </div>
          </div>
          {dp1 && (
            <div className="border-t border-white/8 pt-3 space-y-2">
              <div className="text-xs font-medium uppercase text-muted">Decision point 1 — {dp1.at}</div>
              <p className="text-sm font-medium">{dp1.prompt}</p>
              <ul className="text-sm text-muted space-y-1 list-disc list-inside">
                {dp1.options.map((o) => (
                  <li key={o.id}>{o.label}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 text-xs text-muted">
            <Lock className="inline h-3 w-3 mr-1 text-accent" />
            <strong className="text-foreground">Preview — full interactive case in the production build.</strong>{" "}
            Full branching (decisions {locked.decisionPoints.length > 1 ? `DP1–DP${locked.decisionPoints.length}` : "DP1"}, vitals timeline, debrief + score) is implemented but locked to this stub.
          </div>
          {locked.debrief && (
            <div className="text-xs text-muted italic border-t border-white/8 pt-3">
              <span className="font-medium text-foreground not-italic">Debrief preview: </span>{locked.debrief}
            </div>
          )}
        </div>

        <div className="glass-panel p-4">
          <div className="text-xs font-medium uppercase text-muted mb-2">Learning objectives</div>
          <ul className="text-xs text-muted space-y-1 list-disc list-inside">
            {patient.learning_objectives.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CasePhaseStepper current={phase} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 order-2 lg:order-1">
          <div className="glass-panel p-5">
            <div className="flex items-start gap-3">
              <Stethoscope className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold">{patient.name}, {patient.age}y</h2>
                <p className="mt-1 text-sm text-muted">{patient.story}</p>
              </div>
            </div>
          </div>

          {!isDebrief ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {state.matches("assessment") && (
                  <>
                    <DecisionCard
                      title="Continue high-flux HD"
                      description="Maintain current diffusive prescription"
                      consequence="Middle-molecule clearance remains limited; fatigue may persist"
                      onClick={() => {
                        send({ type: "SELECT_MODALITY", modality: "hd" });
                        logDecision("Continued HD");
                      }}
                    />
                    <DecisionCard
                      title="Evaluate HDF candidacy"
                      description="Order access flow check; discuss ≥23 L convection per CONVINCE"
                      consequence="Opens convection pathway — monitor TMP and IDH risk"
                      variant="primary"
                      onClick={() => {
                        send({ type: "SELECT_MODALITY", modality: "hdf" });
                        logDecision("Initiated HDF evaluation");
                      }}
                    />
                  </>
                )}

                {(state.matches("prescribing") || state.matches("treatment")) && (
                  <>
                    <DecisionCard
                      title="Target 23 L convection"
                      description="CONVINCE-equivalent dosing band"
                      consequence={`FF rises — clearance index ↑, IDH risk ${physics.hypotensionRisk.toFixed(0)}% (HDF ≤ HD per CONVINCE)`}
                      variant="primary"
                      onClick={() => {
                        send({ type: "SET_CONVECTION", liters: 23 });
                        logDecision("Target 23L convection");
                      }}
                    />
                    <DecisionCard
                      title="Increase blood flow +30"
                      description={`Current Qb ${state.context.sim.qb} mL/min`}
                      consequence="Improves clearance; watch access flow limits"
                      onClick={() => {
                        send({ type: "SET_QB", qb: state.context.sim.qb + 30 });
                        logDecision("Increased Qb");
                      }}
                    />
                    <DecisionCard
                      title="Enable AutoSub plus"
                      description="TMP pulse optimization for convection volume"
                      consequence="TMP reduced ~12% in educational model"
                      onClick={() => {
                        send({ type: "TOGGLE_AUTOSUB" });
                        logDecision("Toggled AutoSub");
                      }}
                    />
                    <DecisionCard
                      title="Conservative 15 L convection"
                      description="Lower convection for fragile hemodynamics"
                      consequence="Reduced clearance; lower alarm risk"
                      onClick={() => {
                        send({ type: "SET_CONVECTION", liters: 15 });
                        logDecision("Conservative 15L");
                      }}
                    />
                  </>
                )}

                {physics.alarm && (
                  <DecisionCard
                    title={`Acknowledge ${physics.alarm}`}
                    description="First-response per unit protocol"
                    consequence="Opens intervention branch — reduce FF or Qf"
                    variant="danger"
                    onClick={() => {
                      send({ type: "ACK_ALARM" });
                      logDecision(`Ack alarm ${physics.alarm}`);
                    }}
                  />
                )}

                {state.matches("intervention") && (
                  <DecisionCard
                    title="Reduce convection to 15 L"
                    description="TMP crisis intervention"
                    consequence="Clot risk decreases; clearance trade-off"
                    variant="danger"
                    onClick={() => {
                      send({ type: "SET_CONVECTION", liters: 15 });
                      logDecision("Reduced convection post-alarm");
                    }}
                  />
                )}

                {!physics.alarm && state.matches("treatment") && state.context.decisions.length >= 2 && (
                  <DecisionCard
                    title="Complete treatment session"
                    description="Stable parameters — proceed to debrief"
                    consequence="Triggers AI educator debrief with decision log"
                    variant="primary"
                    onClick={() => {
                      send({ type: "COMPLETE" });
                      logDecision("Completed treatment");
                      emitStatement("completed", `case-${patientId}`, patient.name);
                    }}
                  />
                )}
              </div>

              {physics.alarm && (
                <div className="rounded-xl border border-danger/50 bg-danger/10 p-4 text-sm">
                  <strong className="text-danger">Physiology alert:</strong> {physics.mechanism}
                </div>
              )}
            </>
          ) : (
            <DebriefPanel
              patientName={patient.name}
              decisions={state.context.decisions}
              physics={physics}
              objectives={patient.learning_objectives}
            />
          )}
        </div>

        <div className="space-y-4 order-1 lg:order-2">
          <VitalsMonitor
            physics={physics}
            systolicBp={state.context.sim.systolicBp}
            qb={state.context.sim.qb}
            convection={state.context.sim.convectionL}
          />

          <div className="glass-panel p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted mb-2">
              <FileText className="h-3.5 w-3.5" /> Chart
            </div>
            <dl className="space-y-2 text-xs">
              {Object.entries(patient.vitals).map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-white/5 pb-1">
                  <dt className="text-muted capitalize">{k.replace("_", " ")}</dt>
                  <dd className="tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="glass-panel p-4">
            <div className="text-xs font-medium uppercase text-muted mb-2">Learning objectives</div>
            <ul className="text-xs text-muted space-y-1 list-disc list-inside">
              {patient.learning_objectives.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>

          <div className="glass-panel p-4">
            <div className="text-xs font-medium uppercase text-muted mb-2">Decision timeline</div>
            <ol className="text-xs space-y-1">
              {state.context.decisions.length === 0 && <li className="text-muted">No decisions yet</li>}
              {state.context.decisions.map((d, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-accent tabular-nums">{i + 1}.</span>
                  <span>{d}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
