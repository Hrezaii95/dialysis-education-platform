"use client";

import { useState } from "react";
import type { SimOutputs } from "@/lib/sim-engine/physics";
import { usePlatformStore } from "@/lib/store";

interface Props {
  patientName: string;
  decisions: string[];
  physics: SimOutputs;
  objectives: string[];
}

export function DebriefPanel({ patientName, decisions, physics, objectives }: Props) {
  const [debrief, setDebrief] = useState<string | null>(null);
  const setSkill = usePlatformStore((s) => s.setSkill);

  const buildDebrief = () =>
    `Case debrief for ${patientName}:\n\nYour decisions: ${decisions.join(" → ")}\n\nEducational outcomes — clearance index ${physics.clearanceIndex.toFixed(0)}, QoL index ${physics.qolIndex.toFixed(0)}. ${physics.mechanism}\n\nLearning objectives addressed: ${objectives.join("; ")}.\n\nEducational model only — not clinical advice.`;

  const handleViewDebrief = () => {
    setDebrief(buildDebrief());
    setSkill("cases", "mastered", 85);
  };

  return (
    <div className="glass-panel p-6 space-y-4">
      <h3 className="text-lg font-semibold">Debrief Studio</h3>
      <p className="text-sm text-muted">Educator feedback — council-vetted, KB-grounded</p>

      <div className="rounded-lg bg-surface-2 p-4 text-sm">
        <div className="font-medium mb-2">Decision log</div>
        <ol className="list-decimal list-inside space-y-1 text-muted">
          {decisions.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ol>
      </div>

      {!debrief ? (
        <button type="button" className="btn btn-primary" onClick={handleViewDebrief}>
          See educator feedback
        </button>
      ) : (
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 text-sm whitespace-pre-wrap leading-relaxed">
          {debrief}
        </div>
      )}
    </div>
  );
}
