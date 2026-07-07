"use client";

import { cn } from "@/lib/utils";
import type { SimOutputs } from "@/lib/sim-engine/physics";

const PHASES = [
  { id: "assessment", label: "Assess" },
  { id: "prescribing", label: "Prescribe" },
  { id: "treatment", label: "Treat" },
  { id: "intervention", label: "Intervene" },
  { id: "debrief", label: "Debrief" },
] as const;

export function VitalsMonitor({
  physics,
  systolicBp,
  qb,
  convection,
}: {
  physics: SimOutputs;
  systolicBp: number;
  qb: number;
  convection: number;
}) {
  const hr = Math.round(72 + (physics.hypotensionRisk - 40) * 0.3);
  const spo2 = Math.max(92, 98 - Math.floor(physics.hypotensionRisk / 15));

  return (
    <div className="rounded-xl border border-white/10 bg-black p-4 font-mono text-sm shadow-inner">
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
        <span className="text-flow text-xs">PATIENT MONITOR</span>
        <span className={cn("text-xs", physics.alarm ? "text-red-400 alarm-pulse" : "text-green-400")}>
          {physics.alarm ? "ALARM" : "STABLE"}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Vital label="HR" value={String(hr)} unit="bpm" color="text-green-400" />
        <Vital label="BP" value={`${systolicBp}/70`} unit="mmHg" color={systolicBp < 100 ? "text-red-400" : "text-white"} />
        <Vital label="SpO₂" value={String(spo2)} unit="%" color="text-sky-400" />
        <Vital label="TMP" value={physics.tmp.toFixed(0)} unit="mmHg" color={physics.tmp > 400 ? "text-red-400" : "text-amber-300"} />
        <Vital label="Qb" value={String(qb)} unit="mL/min" color="text-white" />
        <Vital label="Qf" value={String(convection)} unit="L" color="text-flow" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
        <Bar label="Clearance" value={physics.clearanceIndex} max={100} color="bg-accent" />
        <Bar label="QoL idx" value={physics.qolIndex} max={100} color="bg-flow" />
        <Bar label="IDH risk" value={physics.hypotensionRisk} max={100} color="bg-red-500" />
      </div>
    </div>
  );
}

function Vital({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <div>
      <div className="text-[9px] text-gray-500">{label}</div>
      <div className={cn("text-lg tabular-nums font-bold", color)}>
        {value}
        <span className="text-[10px] text-gray-500 ml-0.5">{unit}</span>
      </div>
    </div>
  );
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-gray-500 mb-0.5">
        <span>{label}</span>
        <span className="tabular-nums">{value.toFixed(0)}</span>
      </div>
      <div className="h-1 rounded-full bg-gray-800">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  );
}

export function CasePhaseStepper({ current }: { current: string }) {
  const idx = PHASES.findIndex((p) => p.id === current || current === p.id);
  const activeIdx = idx >= 0 ? idx : current === "debrief" ? 4 : 0;

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {PHASES.map((phase, i) => (
        <div key={phase.id} className="flex items-center gap-1 shrink-0">
          <div
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider",
              i <= activeIdx ? "bg-accent/30 text-white" : "bg-surface-2 text-muted",
              i === activeIdx && "ring-1 ring-accent"
            )}
          >
            {phase.label}
          </div>
          {i < PHASES.length - 1 && <div className="h-px w-3 bg-white/10" />}
        </div>
      ))}
    </div>
  );
}

export function DecisionCard({
  title,
  description,
  consequence,
  variant = "default",
  onClick,
  disabled,
}: {
  title: string;
  description: string;
  consequence?: string;
  variant?: "default" | "danger" | "primary";
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border p-4 transition-all disabled:opacity-40",
        variant === "primary" && "border-accent/50 hover:bg-accent/10",
        variant === "danger" && "border-danger/40 hover:bg-danger/10",
        variant === "default" && "border-white/8 hover:bg-surface-2"
      )}
    >
      <div className="font-medium text-sm">{title}</div>
      <p className="mt-1 text-xs text-muted">{description}</p>
      {consequence && (
        <p className="mt-2 text-[10px] text-flow/80 border-l-2 border-flow/40 pl-2">{consequence}</p>
      )}
    </button>
  );
}
