"use client";

import { useMemo, useState } from "react";
import { computePhysics, type SimInputs } from "@/lib/sim-engine/physics";
import { cn } from "@/lib/utils";

const MONITOR_DEFAULT: SimInputs = {
  qb: 380,
  convectionL: 23,
  modality: "hdf",
  accessFlow: 420,
  accessType: "avf",
  dialyzerConvective: 80,
  systolicBp: 125,
  autoSubEnabled: true,
};

export function Monitor5008() {
  const [input, setInput] = useState<SimInputs>(MONITOR_DEFAULT);
  const out = useMemo(() => computePhysics(input), [input]);

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div className="rounded-2xl border-4 border-gray-700 bg-gray-900 p-1 shadow-2xl">
          <div className="rounded-xl bg-black p-4 min-h-[320px] font-mono text-sm">
            <div className="flex justify-between border-b border-gray-700 pb-2 mb-4">
              <span className="text-flow">5008 CorDiax</span>
              <span className={cn(out.alarm ? "text-red-500 alarm-pulse" : "text-green-400")}>
                {out.alarm ? `⚠ ${out.alarm}` : "● TREATMENT"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <ScreenField label="Mode" value={input.modality.toUpperCase()} />
              <ScreenField label="Qb" value={`${input.qb} mL/min`} />
              <ScreenField label="Convection" value={`${input.convectionL} L`} />
              <ScreenField label="TMP" value={`${out.tmp.toFixed(0)} mmHg`} alert={out.tmp > 400} />
              <ScreenField label="FF" value={`${out.filtrationFraction.toFixed(1)}%`} alert={out.filtrationFraction > 33} />
              <ScreenField label="AutoSub" value={input.autoSubEnabled ? "ACTIVE" : "OFF"} />
              <ScreenField label="Venous P." value="142 mmHg" />
              <ScreenField label="Arterial P." value="-218 mmHg" />
              <ScreenField label="UF rate" value="8 mL/min" />
            </div>

            <div className="mt-6 h-24 rounded bg-gray-800/50 p-2 relative overflow-hidden">
              <div className="text-[10px] text-gray-500 mb-1">TMP trend (educational)</div>
              <svg viewBox="0 0 300 60" className="w-full h-16">
                <polyline
                  fill="none"
                  stroke="#5e6ad2"
                  strokeWidth="2"
                  points={Array.from({ length: 20 }, (_, i) => {
                    const x = i * 15;
                    const y = 50 - (out.tmp / 520) * 40 + Math.sin(i * 0.5) * 3;
                    return `${x},${y}`;
                  }).join(" ")}
                />
              </svg>
            </div>

            {out.alarm && (
              <div className="mt-4 rounded bg-red-900/80 border border-red-500 p-3 text-red-200 text-center font-bold">
                ALARM — {out.alarm.replace(/_/g, " ")}
              </div>
            )}
          </div>
        </div>
        <p className="mt-2 text-xs text-muted text-center">
          Educational 5008 treatment screen — not pixel-perfect IFU replica
        </p>
      </div>

      <div className="lg:col-span-2 glass-panel p-5 space-y-4">
        <h3 className="font-semibold">Monitor Controls</h3>
        <label className="block text-sm">
          Convection target (L)
          <input
            type="range"
            min={0}
            max={28}
            value={input.convectionL}
            onChange={(e) =>
              setInput((s) => ({
                ...s,
                convectionL: Number(e.target.value),
                modality: Number(e.target.value) > 0 ? "hdf" : "hd",
              }))
            }
            className="mt-1 w-full accent-teal"
          />
          <span className="tabular-nums text-teal">{input.convectionL} L</span>
        </label>
        <label className="block text-sm">
          Blood flow Qb
          <input
            type="range"
            min={250}
            max={450}
            value={input.qb}
            onChange={(e) => setInput((s) => ({ ...s, qb: Number(e.target.value) }))}
            className="mt-1 w-full accent-teal"
          />
        </label>
        <button
          type="button"
          className="btn btn-primary w-full"
          onClick={() => setInput((s) => ({ ...s, autoSubEnabled: !s.autoSubEnabled }))}
        >
          Toggle AutoSub plus
        </button>
        <p className="text-xs text-muted border-l-2 border-teal/50 pl-2">{out.mechanism}</p>
      </div>
    </div>
  );
}

function ScreenField({
  label,
  value,
  alert,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div className={cn("rounded bg-gray-800/60 p-2", alert && "ring-1 ring-red-500")}>
      <div className="text-[9px] text-gray-500 uppercase">{label}</div>
      <div className={cn("tabular-nums", alert ? "text-red-400" : "text-gray-100")}>{value}</div>
    </div>
  );
}
