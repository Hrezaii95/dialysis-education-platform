"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { computePhysics, type SimInputs } from "@/lib/sim-engine/physics";
import { emitStatement } from "@/lib/xapi";
import { cn } from "@/lib/utils";

const DEFAULT: SimInputs = {
  qb: 350,
  convectionL: 15,
  modality: "hdf",
  accessFlow: 420,
  accessType: "avf",
  dialyzerConvective: 75,
  systolicBp: 130,
  autoSubEnabled: true,
};

export function CircuitSim() {
  const [input, setInput] = useState<SimInputs>(DEFAULT);
  const out = useMemo(() => computePhysics(input), [input]);

  const update = (patch: Partial<SimInputs>, label: string) => {
    setInput((s) => ({ ...s, ...patch }));
    emitStatement("interacted", "circuit-sim", label, {
      extensions: patch as Record<string, unknown>,
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="glass-panel p-6">
        <h3 className="font-semibold">Fluid Circuit — PhET Mode</h3>
        <p className="mt-1 text-sm text-muted">
          Drag controls — watch TMP, FF, and alarms respond
        </p>

        <div className="mt-6 space-y-5">
          <SliderControl
            label="Blood flow (Qb)"
            value={input.qb}
            min={200}
            max={500}
            unit="mL/min"
            onChange={(v) => update({ qb: v }, `Qb ${v}`)}
          />
          <SliderControl
            label="Convection volume"
            value={input.convectionL}
            min={0}
            max={30}
            unit="L/session"
            onChange={(v) =>
              update(
                { convectionL: v, modality: v > 0 ? "hdf" : "hd" },
                `Convection ${v}L`
              )
            }
          />
          <SliderControl
            label="Access flow"
            value={input.accessFlow}
            min={180}
            max={500}
            unit="mL/min"
            onChange={(v) => update({ accessFlow: v }, `Access ${v}`)}
          />
          <SliderControl
            label="Systolic BP"
            value={input.systolicBp}
            min={85}
            max={180}
            unit="mmHg"
            onChange={(v) => update({ systolicBp: v }, `BP ${v}`)}
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={cn("btn text-xs", input.modality === "hd" ? "btn-primary" : "btn-ghost")}
              onClick={() => update({ modality: "hd", convectionL: 0 }, "Mode HD")}
            >
              HD
            </button>
            <button
              type="button"
              className={cn("btn text-xs", input.modality === "hdf" ? "btn-primary" : "btn-ghost")}
              onClick={() => update({ modality: "hdf", convectionL: Math.max(15, input.convectionL) }, "Mode HDF")}
            >
              HDF
            </button>
            <button
              type="button"
              className={cn("btn text-xs", input.autoSubEnabled ? "btn-primary" : "btn-ghost")}
              onClick={() => update({ autoSubEnabled: !input.autoSubEnabled }, "Toggle AutoSub")}
            >
              AutoSub plus {input.autoSubEnabled ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <CircuitDiagram active={input.modality === "hdf"} qb={input.qb} alarm={out.alarm} />

        <div className="glass-panel p-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric label="TMP" value={out.tmp.toFixed(0)} unit="mmHg" warn={out.tmp > 400} />
          <Metric label="FF" value={out.filtrationFraction.toFixed(1)} unit="%" warn={out.filtrationFraction > 33} />
          <Metric label="Clearance" value={out.clearanceIndex.toFixed(0)} unit="idx" />
          <Metric label="QoL index" value={out.qolIndex.toFixed(0)} unit="" />
          <Metric label="IDH risk" value={out.hypotensionRisk.toFixed(0)} unit="%" warn={out.hypotensionRisk > 70} />
          <Metric label="Clot risk" value={out.clotRisk.toFixed(0)} unit="%" warn={out.clotRisk > 50} />
        </div>

        {out.alarm && (
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="alarm-pulse rounded-xl border border-danger/50 bg-danger/10 p-4"
          >
            <div className="font-semibold text-danger">⚠ Alarm: {out.alarm}</div>
          </motion.div>
        )}

        <p className="text-sm text-muted border-l-2 border-accent/50 pl-3">{out.mechanism}</p>
      </div>
    </div>
  );
}

function SliderControl({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="tabular-nums text-accent font-medium">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-accent"
      />
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
  warn,
}: {
  label: string;
  value: string;
  unit: string;
  warn?: boolean;
}) {
  return (
    <div className={cn("rounded-lg bg-surface-2 p-3", warn && "ring-1 ring-danger/50")}>
      <div className="text-[10px] uppercase text-muted">{label}</div>
      <div className={cn("text-xl font-semibold tabular-nums", warn && "text-danger")}>
        {value}
        <span className="text-xs text-muted ml-1">{unit}</span>
      </div>
    </div>
  );
}

function CircuitDiagram({
  active,
  qb,
  alarm,
}: {
  active: boolean;
  qb: number;
  alarm: string | null;
}) {
  const speed = qb / 500;
  return (
    <div className="glass-panel p-6 relative overflow-hidden min-h-[200px]">
      <svg viewBox="0 0 400 180" className="w-full h-auto">
        <defs>
          <linearGradient id="blood" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>
        <rect x="20" y="70" width="80" height="40" rx="6" fill="#1f2124" stroke="#5e6ad2" strokeWidth="2" />
        <text x="60" y="95" textAnchor="middle" fill="#9b9ba6" fontSize="10">Patient</text>
        <path d="M100 90 H140" stroke="url(#blood)" strokeWidth="4" fill="none" />
        <motion.circle
          r="5"
          fill="#ef4444"
          animate={{ cx: [105, 135], cy: 90 }}
          transition={{ duration: Math.max(2.5, 4 / speed), repeat: Infinity, ease: "linear" }}
        />
        <rect
          x="140"
          y="55"
          width="50"
          height="70"
          rx="4"
          fill={active ? "#0d9488" : "#374151"}
          stroke={alarm ? "#ef4444" : "#5e6ad2"}
          strokeWidth="2"
        />
        <text x="165" y="95" textAnchor="middle" fill="white" fontSize="9">Dialyzer</text>
        <path d="M190 90 H240" stroke="url(#blood)" strokeWidth="4" />
        <rect x="240" y="65" width="60" height="50" rx="4" fill="#141516" stroke="#c9a227" strokeWidth="2" />
        <text x="270" y="95" textAnchor="middle" fill="#c9a227" fontSize="9">5008</text>
        <path d="M300 90 H360" stroke="url(#blood)" strokeWidth="4" />
        {active && (
          <path d="M165 125 Q200 150 235 125" stroke="#0d9488" strokeWidth="2" fill="none" strokeDasharray="4 2" />
        )}
      </svg>
      <p className="text-center text-xs text-muted mt-2">
        {active ? "Post-dilution HDF — substitution fluid path active" : "Diffusive HD mode"}
      </p>
    </div>
  );
}
