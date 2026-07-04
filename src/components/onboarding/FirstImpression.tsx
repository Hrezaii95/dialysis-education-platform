"use client";

/**
 * FirstImpression — the locked ≤2-min onboarding sequence.
 *
 * Step A: Device Lab micro-task — set convection to ≥23 L
 * Step B: Patient Case 1 (IDH) DP1 — first decision with consequence feedback
 * End:    "Continue to your path →" → /my-path
 *
 * Constraints:
 * - Uses real data from @/lib/cases.ts (IDH case, DP1)
 * - Reduced-motion safe (no animation that requires framer-motion)
 * - No heavy 3D — lightweight inline control
 * - Does not edit store.ts
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, XCircle, AlertTriangle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CASES } from "@/lib/cases";
import type { Verdict, CaseOption } from "@/lib/cases";

// ── Data ─────────────────────────────────────────────────────────────────────

const idhCase = CASES.find((c) => c.id === "idh")!;
const dp1 = idhCase.decisionPoints[0];

// ── Sub-components ────────────────────────────────────────────────────────────

/** Step indicator dots */
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`Step ${current + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-2 w-2 rounded-full transition-colors",
            i === current ? "bg-[var(--color-flow)]" : i < current ? "bg-[var(--color-flow)]/40" : "bg-white/10"
          )}
        />
      ))}
    </div>
  );
}

/** Verdict icon */
function VerdictIcon({ v }: { v: Verdict }) {
  if (v === "correct") return <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />;
  if (v === "warning") return <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />;
  return <XCircle className="h-5 w-5 text-red-400 shrink-0" />;
}

const VERDICT_RING: Record<Verdict, string> = {
  correct: "border-green-400/60 bg-green-400/8",
  warning: "border-amber-400/60 bg-amber-400/8",
  wrong: "border-red-400/60 bg-red-400/8",
};

// ── Step A: Convection Micro-Task ─────────────────────────────────────────────

const TARGET_L = 23;

function ConvectionMicrotask({ onComplete }: { onComplete: () => void }) {
  const [value, setValue] = useState(18);
  const [confirmed, setConfirmed] = useState(false);

  const hitTarget = value >= TARGET_L;

  const confirm = useCallback(() => {
    if (!hitTarget) return;
    setConfirmed(true);
  }, [hitTarget]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-flow)]">
          Step 1 of 2 · Device Lab
        </p>
        <h3 className="mt-1 font-display text-xl font-normal tracking-tight">
          Set the convection volume to meet the HDF target
        </h3>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          High-volume HDF requires ≥23 L substitution per session. Adjust the slider to reach the target.
        </p>
      </div>

      {/* Machine panel — lightweight, no 3D */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
          <span className="font-mono uppercase tracking-widest">5008S · Online-HDF</span>
          <span
            className={cn(
              "rounded px-2 py-0.5 font-mono text-[11px] transition-colors",
              hitTarget ? "bg-green-400/15 text-green-400" : "bg-white/5 text-[var(--color-muted)]"
            )}
          >
            {hitTarget ? "TARGET MET" : "BELOW TARGET"}
          </span>
        </div>

        {/* Convection readout */}
        <div className="flex items-end gap-3">
          <div>
            <div className="text-[10px] text-[var(--color-muted)] mb-0.5">Convection vol</div>
            <div
              className={cn(
                "font-mono text-4xl font-bold tabular-nums transition-colors",
                hitTarget ? "text-green-400" : "text-white"
              )}
            >
              {value}
              <span className="ml-1 text-base font-normal text-[var(--color-muted)]">L</span>
            </div>
          </div>
          <div className="flex-1 pb-1">
            <div className="relative h-2 rounded-full bg-white/10">
              {/* target marker */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[var(--color-flow)] rounded opacity-60"
                style={{ left: `${((TARGET_L - 12) / (40 - 12)) * 100}%` }}
              />
              {/* fill bar */}
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  hitTarget ? "bg-green-400" : "bg-[var(--color-flow)]"
                )}
                style={{ width: `${((value - 12) / (40 - 12)) * 100}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[9px] text-[var(--color-muted)]">
              <span>12 L</span>
              <span className="text-[var(--color-flow)]">≥23 L target</span>
              <span>40 L</span>
            </div>
          </div>
        </div>

        {/* Slider */}
        <div>
          <label htmlFor="conv-slider" className="sr-only">
            Convection volume in litres
          </label>
          <input
            id="conv-slider"
            type="range"
            min={12}
            max={40}
            step={1}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full accent-[var(--color-flow)]"
            aria-valuenow={value}
            aria-valuemin={12}
            aria-valuemax={40}
          />
        </div>

        {/* +/- buttons for motor-safe increment */}
        <div className="flex gap-2">
          <button
            onClick={() => setValue((v) => Math.max(12, v - 1))}
            className="btn btn-ghost flex-1 text-sm"
            aria-label="Decrease by 1 L"
          >
            −1 L
          </button>
          <button
            onClick={() => setValue((v) => Math.min(40, v + 1))}
            className="btn btn-ghost flex-1 text-sm"
            aria-label="Increase by 1 L"
          >
            +1 L
          </button>
        </div>

        {/* Inline feedback */}
        {hitTarget && !confirmed && (
          <div className="rounded-lg border border-green-400/30 bg-green-400/8 p-3 text-sm text-green-300">
            <strong>Target reached.</strong> At {value} L substitution, convective clearance of
            middle molecules (β₂-microglobulin, inflammatory cytokines) is optimised — this is
            what distinguishes high-volume HDF from standard HD.
          </div>
        )}
        {!hitTarget && value > 12 && (
          <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-300">
            {TARGET_L - value} L below the ≥23 L target. Keep adjusting.
          </div>
        )}
      </div>

      {!confirmed ? (
        <button
          onClick={confirm}
          disabled={!hitTarget}
          className={cn("btn btn-primary w-full", !hitTarget && "opacity-40 cursor-not-allowed")}
        >
          Confirm {value} L and continue <ChevronRight className="h-4 w-4" />
        </button>
      ) : (
        <button onClick={onComplete} className="btn btn-primary w-full">
          Next: Patient case <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ── Step B: IDH Case DP1 ──────────────────────────────────────────────────────

function IDHDecisionPoint({ onComplete }: { onComplete: () => void }) {
  const [chosen, setChosen] = useState<CaseOption | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-red-400">
          Step 2 of 2 · Patient Case 1 — IDH
        </p>
        <h3 className="mt-1 font-display text-xl font-normal tracking-tight">
          {idhCase.title}
        </h3>
      </div>

      {/* Presentation */}
      <div className="glass-panel p-4 text-sm text-[var(--color-muted)] leading-relaxed">
        <p className="text-[10px] uppercase tracking-widest text-[var(--color-muted)] mb-2">Presentation</p>
        {idhCase.presentation}
      </div>

      {/* Vitals snapshot — only the flagged row for brevity */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        {idhCase.vitalsCols.map((col) => (
          <div key={col} className="text-[9px] uppercase tracking-wider text-[var(--color-muted)]">
            {col}
          </div>
        ))}
        {(() => {
          const flagRow = idhCase.vitals.find((r) => r.flag);
          return flagRow ? (
            <>
              {flagRow.cells.map((cell, i) => (
                <div
                  key={i}
                  className="font-mono text-[11px] font-semibold text-amber-300 truncate"
                  title={cell}
                >
                  {cell}
                </div>
              ))}
            </>
          ) : null;
        })()}
      </div>

      {/* Decision */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[var(--color-muted)] mb-1">
          {dp1.at}
        </p>
        <p className="mb-3 text-sm font-medium">{dp1.prompt}</p>
        <div className="space-y-2">
          {dp1.options.map((opt) => {
            const isChosen = chosen?.id === opt.id;
            return (
              <button
                key={opt.id}
                disabled={!!chosen}
                onClick={() => setChosen(opt)}
                className={cn(
                  "w-full rounded-lg border p-3 text-left text-sm transition-all",
                  !chosen
                    ? "border-white/10 bg-white/4 hover:border-[var(--color-flow)]/40 hover:bg-white/8"
                    : isChosen
                    ? cn("border", VERDICT_RING[opt.verdict])
                    : "border-white/5 bg-white/2 opacity-50"
                )}
                aria-pressed={isChosen}
              >
                <span className="flex items-start gap-2">
                  {isChosen && <VerdictIcon v={opt.verdict} />}
                  <span>{opt.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Consequence feedback */}
      {chosen && (
        <div
          className={cn(
            "rounded-lg border p-4 text-sm leading-relaxed",
            VERDICT_RING[chosen.verdict]
          )}
        >
          <div className="flex items-start gap-2">
            <VerdictIcon v={chosen.verdict} />
            <div>
              <p className="font-medium mb-1">
                {chosen.verdict === "correct"
                  ? "Correct first move"
                  : chosen.verdict === "warning"
                  ? "Partially correct — caution needed"
                  : "Incorrect — this harms the patient"}
              </p>
              <p className="text-[var(--color-muted)]">{chosen.consequence}</p>
              {chosen.citation && (
                <p className="mt-1.5 text-[10px] text-[var(--color-muted)] opacity-60">
                  Source: {chosen.citation}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {chosen && (
        <button onClick={onComplete} className="btn btn-primary w-full">
          Continue to your path <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

type Phase = "convection" | "case" | "done";

export function FirstImpression({ onFinish }: { onFinish?: () => void }) {
  const [phase, setPhase] = useState<Phase>("convection");
  const router = useRouter();

  const finish = useCallback(() => {
    if (onFinish) onFinish();
    router.push("/my-path");
  }, [onFinish, router]);

  const stepIndex = phase === "convection" ? 0 : phase === "case" ? 1 : 2;

  return (
    <div className="glass-panel p-6 sm:p-8 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
          2-minute first impression
        </span>
        <StepDots current={stepIndex} total={2} />
      </div>

      {/* Step content */}
      {phase === "convection" && (
        <ConvectionMicrotask onComplete={() => setPhase("case")} />
      )}
      {phase === "case" && (
        <IDHDecisionPoint onComplete={finish} />
      )}
    </div>
  );
}
