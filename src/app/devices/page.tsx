"use client";

import { Suspense, useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { usePlatformStore } from "@/lib/store";
import { emitStatement } from "@/lib/xapi";
import {
  Box,
  Rotate3d,
  Layers,
  Droplets,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  BadgeCheck,
} from "lucide-react";
import { useLang } from "@/components/providers/LanguageProvider";

const Canvas = dynamic(
  () => import("@react-three/fiber").then((m) => m.Canvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-muted">
        Loading 3D…
      </div>
    ),
  }
);

const DeviceScene3D = dynamic(
  () =>
    import("@/components/devices/DeviceScene3D").then((m) => m.DeviceScene3D),
  { ssr: false }
);

// --- locked to two profiles only (hero HDF + comparison HD-only) ---
const SYSTEMS = [
  { id: "4008s", name: "4008S", label: "4008S", color: "#6b7280", hdf: false },
  {
    id: "5008s",
    name: "5008S CorDiax",
    label: "5008S",
    color: "#2b6cff",
    hdf: true,
  },
];

const DIALYZERS = [
  {
    id: "fx_highflux",
    name: "High-flux",
    convective: 60,
    color: "#9ca3af",
    area: "1.8 m²",
  },
  {
    id: "fx_coral",
    name: "FX CorAL",
    convective: 88,
    color: "#e0b23a",
    area: "2.0 m²",
  },
];

const LEGEND = [
  { c: "#fb7185", t: "Arterial / venous lines" },
  { c: "#16c2b0", t: "DIASAFE®plus ultrafilter" },
  { c: "#e0b23a", t: "Hollow-fiber dialyzer" },
  { c: "#22c55e", t: "AutoSub substitution port" },
];

// --- guided step definitions ---
type StepKey = "explore" | "prime" | "prescribe" | "alarms" | "signoff";
const STEP_KEYS: StepKey[] = [
  "explore",
  "prime",
  "prescribe",
  "alarms",
  "signoff",
];
const STEP_LABELS: Record<StepKey, string> = {
  explore: "Explore",
  prime: "Prime",
  prescribe: "Prescribe ≥23 L",
  alarms: "Alarms",
  signoff: "Sign-off",
};

// --- Prime step: checklist items ---
interface PrimeItem {
  id: string;
  label: string;
  correct: boolean;
  explanation: string;
}
const PRIME_ITEMS: PrimeItem[] = [
  {
    id: "diasafe",
    label: "DIASAFE®plus ultrafilter installed on substitution outlet",
    correct: true,
    explanation:
      "The DIASAFE®plus ultrafilter is mandatory for online-HDF — it sterilises substitution fluid to pharmaceutical-grade. Without it, online HDF is contraindicated. (IFU-pending)",
  },
  {
    id: "online_line",
    label: "Online substitution-fluid line connected to AutoSub port",
    correct: true,
    explanation:
      "The substitution line routes ultrapure fluid post-dialyser for post-dilution HDF. Confirming the line is in place is a pre-treatment safety check. (IFU-pending)",
  },
  {
    id: "rinseback",
    label: "Rinseback saline bag connected as substitution source",
    correct: false,
    explanation:
      "Rinseback saline is used for end-of-treatment blood return — not for substitution fluid. Online-HDF substitution must come from the machine's own ultrafiltered water pathway, not an external bag.",
  },
];

// --- Alarms step ---
interface AlarmOption {
  id: string;
  label: string;
  correct: boolean;
  consequence: string;
}
const ALARM_OPTIONS: AlarmOption[] = [
  {
    id: "check_kink",
    label: "Inspect the venous return line for kinks or occlusion and clear",
    correct: true,
    consequence:
      "Correct. A kinked venous line is the most common mechanical cause of acute TMP rise. Clearing the occlusion restores venous outflow, drops TMP, and allows treatment to continue safely.",
  },
  {
    id: "increase_qb",
    label: "Increase blood flow (QB) to overcome the pressure",
    correct: false,
    consequence:
      "Incorrect. Increasing QB against an occlusion raises TMP further and risks clotting the dialyser or rupturing the venous line. The mechanical cause must be resolved first.",
  },
  {
    id: "ignore",
    label: "Silence the alarm and continue — TMP alarms are often transient",
    correct: false,
    consequence:
      "Incorrect. TMP alarms should never be silenced without investigation. An unresolved TMP rise can progress to haemofilter clotting, circuit loss, or (if a membrane rupture is present) patient harm.",
  },
  {
    id: "stop_treatment",
    label: "Stop treatment immediately and call the nephrologist",
    correct: false,
    consequence:
      "Partially correct as an escalation step, but premature without first inspecting for a simple mechanical cause. A brief systematic check (line, clamps, patient arm position) usually resolves the alarm without interrupting treatment.",
  },
];

// --- convective volume simulation ---
// Each "bolus" click adds 4 L (educational approximation; not a clinical dose)
const VOLUME_STEP = 4; // L per bolus
const VOLUME_TARGET = 23; // ≥23 L to pass

// ─── Step rail component ───────────────────────────────────────────────────
function StepRail({
  current,
  completed,
}: {
  current: StepKey;
  completed: Set<StepKey>;
}) {
  return (
    <nav
      aria-label="Guided steps"
      className="flex flex-wrap items-center gap-1.5"
    >
      {STEP_KEYS.map((key, i) => {
        const isDone = completed.has(key);
        const isActive = key === current;
        return (
          <span key={key} className="flex items-center gap-1.5">
            <span
              className={[
                "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                isActive
                  ? "bg-flow/20 text-flow ring-1 ring-flow/40"
                  : isDone
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-surface-2 text-muted",
              ].join(" ")}
            >
              {isDone && !isActive && (
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              )}
              {i + 1}. {STEP_LABELS[key]}
            </span>
            {i < STEP_KEYS.length - 1 && (
              <ArrowRight className="h-3 w-3 shrink-0 text-muted" />
            )}
          </span>
        );
      })}
    </nav>
  );
}

// ─── Explore step ─────────────────────────────────────────────────────────
function ExploreStep({
  system,
  dialyzer,
  autoSub,
  systemId,
  dialyzerId,
  convIndex,
  features,
  onNext,
  updateUrl,
  setSkillInProgress,
}: {
  system: (typeof SYSTEMS)[0];
  dialyzer: (typeof DIALYZERS)[0];
  autoSub: boolean;
  systemId: string;
  dialyzerId: string;
  convIndex: number;
  features: string[];
  onNext: () => void;
  updateUrl: (p: Record<string, string>) => void;
  setSkillInProgress: () => void;
}) {
  const { t } = useLang();
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-5">
        {/* 3D stage */}
        <div className="relative lg:col-span-3">
          <div className="glass-panel h-[min(360px,50dvh)] overflow-hidden rounded-2xl sm:h-[min(440px,56dvh)] lg:h-[min(540px,70vh)]">
            <Canvas camera={{ position: [3.2, 1.4, 3.8], fov: 42 }} shadows>
              <DeviceScene3D
                systemColor={system.color}
                dialyzerColor={dialyzer.color}
                autoSub={autoSub}
                systemLabel={system.label}
                convective={dialyzer.convective}
              />
            </Canvas>
          </div>
          {/* on-canvas legend */}
          <div className="pointer-events-none absolute left-4 top-4 hidden rounded-xl border border-white/10 bg-black/40 p-3 backdrop-blur-md sm:block">
            <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted">
              <Rotate3d className="h-3 w-3" /> Drag to rotate
            </div>
            <ul className="space-y-1">
              {LEGEND.map((l) => (
                <li
                  key={l.t}
                  className="flex items-center gap-2 text-[11px] text-muted"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: l.c }}
                  />{" "}
                  {l.t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* controls */}
        <div className="space-y-4 lg:col-span-2">
          <div className="glass-panel p-5">
            <h3 className="mb-1 flex items-center gap-2 font-semibold">
              <Layers className="h-4 w-4 text-flow" /> System
            </h3>
            <p className="mb-3 text-xs text-muted">
              Switch generation — note which supports online-HDF.
            </p>
            <div className="flex flex-wrap gap-2">
              {SYSTEMS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`btn text-xs ${
                    systemId === s.id ? "btn-primary" : "btn-ghost"
                  }`}
                  onClick={() => {
                    updateUrl({ system: s.id });
                    setSkillInProgress();
                  }}
                >
                  {s.name}
                  {!s.hdf && (
                    <span className="ml-1 opacity-60">· HD only</span>
                  )}
                </button>
              ))}
            </div>
            {!system.hdf && (
              <p className="mt-3 rounded-md bg-gold/10 px-2.5 py-2 text-[11px] leading-relaxed text-gold">
                {t(
                  "deviceLab.legacyNote",
                  "High-flux HD only. Online-HDF needs a 5008S/6008-class platform — a 4008S cannot deliver it. (All specs IFU-pending.)"
                )}
              </p>
            )}
          </div>

          <div className="glass-panel p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <Droplets className="h-4 w-4 text-gold" /> Dialyzer
            </h3>
            <div className="flex flex-wrap gap-2">
              {DIALYZERS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={`btn text-xs ${
                    dialyzerId === d.id ? "btn-primary" : "btn-ghost"
                  }`}
                  onClick={() => updateUrl({ dialyzer: d.id })}
                >
                  {d.name} · {d.area}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={`btn mt-3 w-full text-xs ${
                autoSub ? "btn-primary" : "btn-ghost"
              }`}
              onClick={() =>
                updateUrl({ autosub: autoSub ? "false" : "true" })
              }
              disabled={!system.hdf}
            >
              AutoSub plus substitution:{" "}
              {system.hdf ? (autoSub ? "ON" : "OFF") : "n/a (HD only)"}
            </button>
          </div>

          {/* convection teaching layer */}
          <div className="glass-panel p-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">Convective clearance</h3>
              <span className="text-[11px] text-muted">educational</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-flow to-raouf-blue transition-all duration-500 motion-reduce:transition-none"
                style={{ width: `${Math.round(convIndex * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted">
              {system.hdf
                ? "Online-HDF adds convection to remove middle molecules diffusion alone misses."
                : "HD only — diffusive clearance, no convective component."}
            </p>
            <Link
              href="/convince"
              className="mt-3 inline-flex items-center gap-1 text-xs text-gold transition-all hover:gap-2"
            >
              <Sparkles className="h-3.5 w-3.5" /> Evidence: high-volume HDF &
              CONVINCE <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="glass-panel p-5 text-sm">
            <h3 className="mb-2 font-semibold">This configuration</h3>
            <ul className="space-y-1 text-xs text-muted">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-1.5">
                  <span className="text-flow">✓</span> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button type="button" className="btn btn-primary gap-1.5" onClick={onNext}>
          Continue to Prime <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}

// ─── Prime step ───────────────────────────────────────────────────────────
function PrimeStep({ onNext }: { onNext: () => void }) {
  const [selections, setSelections] = useState<Record<string, boolean | null>>(
    {}
  );
  const [submitted, setSubmitted] = useState(false);

  const toggle = (id: string, value: boolean) => {
    if (submitted) return;
    setSelections((prev) => ({ ...prev, [id]: value }));
  };

  const allAnswered = PRIME_ITEMS.every((item) => selections[item.id] !== undefined);
  const allCorrect = PRIME_ITEMS.every((item) => {
    const answer = selections[item.id];
    return answer === item.correct;
  });

  const handleSubmit = () => {
    if (!allAnswered) return;
    setSubmitted(true);
  };

  return (
    <div className="space-y-5">
      <div className="glass-panel p-5">
        <h2 className="mb-1 font-semibold text-lg">Pre-treatment Prime Check</h2>
        <p className="text-xs text-muted mb-4">
          Before starting an online-HDF session on the 5008S, confirm which of
          the following items must be verified. Select <strong>Yes</strong> or{" "}
          <strong>No</strong> for each.
        </p>
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-[11px] text-muted">
          <ShieldAlert className="h-3.5 w-3.5" /> Educational model — not
          clinical decision support. Device values IFU-pending.
        </div>

        <ul className="mt-4 space-y-3">
          {PRIME_ITEMS.map((item) => {
            const answer = selections[item.id];
            const isAnswered = answer !== undefined;
            const isCorrect = answer === item.correct;

            return (
              <li
                key={item.id}
                className={[
                  "rounded-xl border p-4 transition-colors",
                  !submitted
                    ? "border-white/10 bg-surface-2/50"
                    : isCorrect
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : "border-red-400/40 bg-red-400/10",
                ].join(" ")}
              >
                <p className="text-sm font-medium leading-snug">{item.label}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={submitted}
                    className={[
                      "btn text-xs",
                      isAnswered && answer === true
                        ? submitted
                          ? item.correct
                            ? "btn-primary"
                            : "bg-red-500/20 text-red-400 border-red-400/40"
                          : "btn-primary"
                        : "btn-ghost",
                    ].join(" ")}
                    onClick={() => toggle(item.id, true)}
                  >
                    Yes — required
                  </button>
                  <button
                    type="button"
                    disabled={submitted}
                    className={[
                      "btn text-xs",
                      isAnswered && answer === false
                        ? submitted
                          ? !item.correct
                            ? "btn-primary"
                            : "bg-red-500/20 text-red-400 border-red-400/40"
                          : "btn-primary"
                        : "btn-ghost",
                    ].join(" ")}
                    onClick={() => toggle(item.id, false)}
                  >
                    No — not required
                  </button>
                </div>
                {submitted && (
                  <div
                    className={[
                      "mt-3 flex gap-2 rounded-md px-3 py-2 text-[11px] leading-relaxed",
                      isCorrect
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "bg-red-400/10 text-red-300",
                    ].join(" ")}
                  >
                    {isCorrect ? (
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    ) : (
                      <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                    )}
                    <span>{item.explanation}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-6 flex items-center justify-between gap-4">
          {!submitted ? (
            <button
              type="button"
              className="btn btn-primary gap-1.5 disabled:opacity-40"
              disabled={!allAnswered}
              onClick={handleSubmit}
            >
              Check answers
            </button>
          ) : (
            <div className="flex items-center gap-3">
              {allCorrect ? (
                <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" /> All checks correct
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-400 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4" /> Review the explanations above
                </span>
              )}
              <button
                type="button"
                className="btn btn-primary gap-1.5"
                onClick={onNext}
              >
                Continue to Prescribe <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Prescribe step ───────────────────────────────────────────────────────
function PrescribeStep({ onNext }: { onNext: () => void }) {
  const [volume, setVolume] = useState(0);
  const passed = volume >= VOLUME_TARGET;
  const pct = Math.min(100, Math.round((volume / VOLUME_TARGET) * 100));

  return (
    <div className="space-y-5">
      <div className="glass-panel p-5">
        <h2 className="mb-1 font-semibold text-lg">Prescribe Convective Volume</h2>
        <p className="text-xs text-muted mb-1">
          High-volume HDF requires ≥23 L convective volume per session to deliver
          the outcome benefit seen in the CONVINCE trial. Use the controls below
          to build the prescription. (Educational approximation — values IFU-pending.)
        </p>
        <div className="mt-2 mb-5 inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-[11px] text-muted">
          <ShieldAlert className="h-3.5 w-3.5" /> Educational model — not
          clinical decision support.
        </div>

        {/* Target vs actual display */}
        <div className="mb-2 flex items-end justify-between text-sm">
          <span className="font-medium">Convective volume</span>
          <span
            className={[
              "font-mono text-lg font-bold tabular-nums transition-colors",
              passed ? "text-emerald-400" : "text-flow",
            ].join(" ")}
          >
            {volume} L
            <span className="ml-1 text-xs font-normal text-muted">
              / ≥{VOLUME_TARGET} L target
            </span>
          </span>
        </div>

        <div className="relative h-4 w-full overflow-hidden rounded-full bg-surface-2">
          {/* target marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/30"
            style={{ left: "100%" }}
            aria-hidden="true"
          />
          <div
            className={[
              "h-full rounded-full transition-all duration-500 motion-reduce:transition-none",
              passed
                ? "bg-emerald-500"
                : "bg-gradient-to-r from-flow to-raouf-blue",
            ].join(" ")}
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={volume}
            aria-valuemin={0}
            aria-valuemax={VOLUME_TARGET}
            aria-label={`Convective volume: ${volume} of ${VOLUME_TARGET} litres`}
          />
        </div>

        {passed && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-emerald-400 font-medium">
            <CheckCircle2 className="h-4 w-4" /> ≥23 L reached — high-volume
            HDF prescription gate passed.
          </p>
        )}
        {!passed && (
          <p className="mt-3 text-xs text-muted">
            {VOLUME_TARGET - volume} L still needed to reach the ≥23 L
            high-volume threshold.
          </p>
        )}

        {/* Convection controls */}
        <div className="mt-5 space-y-3">
          <p className="text-xs text-muted font-medium uppercase tracking-wide">
            Adjust prescription
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary text-xs"
              onClick={() => setVolume((v) => v + VOLUME_STEP)}
            >
              +{VOLUME_STEP} L bolus
            </button>
            <button
              type="button"
              className="btn btn-ghost text-xs"
              onClick={() => setVolume((v) => Math.max(0, v - VOLUME_STEP))}
              disabled={volume === 0}
            >
              −{VOLUME_STEP} L
            </button>
            <button
              type="button"
              className="btn btn-ghost text-xs"
              onClick={() => setVolume(0)}
              disabled={volume === 0}
            >
              Reset
            </button>
          </div>
          <p className="text-[11px] text-muted">
            Each step represents one substitution bolus increment (educational
            approximation; not a clinical dose calculator).
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="btn btn-primary gap-1.5 disabled:opacity-40"
            disabled={!passed}
            onClick={onNext}
          >
            Continue to Alarms <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Alarms step ─────────────────────────────────────────────────────────
function AlarmsStep({ onNext }: { onNext: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const chosen = selected ? ALARM_OPTIONS.find((o) => o.id === selected) : null;

  return (
    <div className="space-y-5">
      <div className="glass-panel p-5">
        <div className="mb-1 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          <h2 className="font-semibold text-lg">TMP Alarm Scenario</h2>
        </div>
        <p className="text-xs text-muted mb-4 leading-relaxed">
          During an online-HDF session on the 5008S, a{" "}
          <strong className="text-amber-300">
            Transmembrane Pressure (TMP) High alarm
          </strong>{" "}
          sounds. The alarm is audible and the TMP reading has climbed above the
          set limit within the last 2 minutes. The patient is stable. What is
          your first response?
        </p>
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-[11px] text-muted">
          <ShieldAlert className="h-3.5 w-3.5" /> Educational scenario —
          clinical protocols may vary by site. IFU-pending.
        </div>

        <ul className="space-y-2">
          {ALARM_OPTIONS.map((opt) => {
            const isSelected = selected === opt.id;
            const revealed = selected !== null;
            const isCorrect = opt.correct;

            return (
              <li key={opt.id}>
                <button
                  type="button"
                  disabled={selected !== null}
                  className={[
                    "btn w-full justify-start text-left text-xs leading-snug",
                    isSelected
                      ? isCorrect
                        ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                        : "border-red-400/50 bg-red-400/15 text-red-300"
                      : revealed && isCorrect
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400/70"
                      : "btn-ghost",
                  ].join(" ")}
                  onClick={() => setSelected(opt.id)}
                >
                  <span className="mr-2 shrink-0 font-mono opacity-50">
                    {ALARM_OPTIONS.indexOf(opt) + 1}.
                  </span>
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>

        {chosen && (
          <div
            className={[
              "mt-5 rounded-xl border p-4 text-sm leading-relaxed",
              chosen.correct
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-red-400/40 bg-red-400/10 text-red-300",
            ].join(" ")}
          >
            <div className="mb-1 flex items-center gap-2 font-semibold">
              {chosen.correct ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Correct
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-400" /> Incorrect
                </>
              )}
            </div>
            <p className="text-[12px]">{chosen.consequence}</p>
          </div>
        )}

        {selected && (
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              className="btn btn-primary gap-1.5"
              onClick={onNext}
            >
              Continue to Sign-off <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sign-off step ────────────────────────────────────────────────────────
function SignoffStep({ onComplete }: { onComplete: () => void }) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="space-y-5">
      <div className="glass-panel p-5">
        <div className="mb-1 flex items-center gap-2">
          <BadgeCheck className="h-5 w-5 text-flow" />
          <h2 className="font-semibold text-lg">Device Lab Sign-off</h2>
        </div>
        <p className="text-sm text-muted mb-6 leading-relaxed">
          You have completed the guided Device Lab sequence:
        </p>
        <ul className="mb-6 space-y-2 text-sm">
          {[
            "Explored the 5008S CorDiax 3D model and compared it to the legacy 4008S",
            "Confirmed the DIASAFE®plus ultrafilter and online substitution-fluid line requirements",
            "Reached the ≥23 L convective volume prescription threshold",
            "Responded correctly to a TMP High alarm scenario",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-muted">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mb-4 inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-[11px] text-muted">
          <ShieldAlert className="h-3.5 w-3.5" /> Educational model — not
          clinical decision support. Values IFU-pending.
        </div>

        {!confirmed ? (
          <div className="mt-4">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-surface-2/40 p-4 hover:bg-surface-2 transition-colors">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-flow)]"
                onChange={(e) => {
                  if (e.target.checked) setConfirmed(true);
                }}
              />
              <span className="text-sm">
                I confirm that I have reviewed this educational module as an HCP
                in a learning context. I understand this is not clinical guidance
                and all device values are IFU-pending.
              </span>
            </label>
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 font-medium">
              <BadgeCheck className="h-5 w-5 text-emerald-400" />
              Device Lab mastered — C3 gate complete
            </div>
            <button
              type="button"
              className="btn btn-primary gap-1.5"
              onClick={onComplete}
            >
              Record completion <CheckCircle2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main inner component ─────────────────────────────────────────────────
function DeviceConfiguratorInner() {
  const params = useSearchParams();
  const router = useRouter();
  const setSkill = usePlatformStore((s) => s.setSkill);
  const { t } = useLang();

  // guided step state
  const [currentStep, setCurrentStep] = useState<StepKey>("explore");
  const [completedSteps, setCompletedSteps] = useState<Set<StepKey>>(new Set());
  const [mastered, setMastered] = useState(false);

  const advanceTo = useCallback((next: StepKey) => {
    setCompletedSteps((prev) => {
      const s = new Set(prev);
      // mark the step being left as complete
      const idx = STEP_KEYS.indexOf(next);
      if (idx > 0) s.add(STEP_KEYS[idx - 1]);
      return s;
    });
    setCurrentStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleComplete = useCallback(() => {
    setCompletedSteps(new Set(STEP_KEYS));
    setMastered(true);
    setSkill("devices", "mastered", 100);
    emitStatement("completed", "device-lab", "C3 gate — devices mastered");
  }, [setSkill]);

  // URL-driven config (for Explore step)
  const systemId = params.get("system") || "5008s";
  const dialyzerId = params.get("dialyzer") || "fx_coral";
  const autoSub = params.get("autosub") !== "false";

  const system = SYSTEMS.find((s) => s.id === systemId) ?? SYSTEMS[1];
  const dialyzer = DIALYZERS.find((d) => d.id === dialyzerId) ?? DIALYZERS[1];

  const updateUrl = useCallback(
    (patch: Record<string, string>) => {
      const next = new URLSearchParams(params.toString());
      Object.entries(patch).forEach(([k, v]) => next.set(k, v));
      router.replace(`/devices?${next.toString()}`, { scroll: false });
      emitStatement("interacted", "device-config", `Config ${JSON.stringify(patch)}`);
    },
    [params, router]
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
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted">
          <Box className="h-4 w-4 text-flow" />{" "}
          {t("deviceLab.eyebrow", "Device Lab")}
        </div>
        <h1 className="mt-1 font-display text-3xl tracking-tight sm:text-4xl">
          {t("deviceLab.title", "Operate the 5008 for online-HDF")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          {t(
            "deviceLab.subtitle",
            "Rotate and inspect the machine, dialyzer, and substitution path — and see what the 5008 platform delivers that a legacy 4008S cannot."
          )}
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-[11px] text-muted">
          <ShieldAlert className="h-3.5 w-3.5" />{" "}
          {t(
            "common.eduModel",
            "Educational model — not clinical decision support. Device values IFU-pending."
          )}
        </div>

        {/* Step rail */}
        <div className="mt-4">
          <StepRail current={currentStep} completed={completedSteps} />
        </div>
      </header>

      {/* Mastered banner */}
      {mastered && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 font-medium">
          <BadgeCheck className="h-5 w-5 text-emerald-400 shrink-0" />
          Device Lab mastered — C3 gate recorded. You can revisit any section
          using the controls above.
        </div>
      )}

      {/* Step content */}
      {currentStep === "explore" && (
        <ExploreStep
          system={system}
          dialyzer={dialyzer}
          autoSub={autoSub}
          systemId={systemId}
          dialyzerId={dialyzerId}
          convIndex={convIndex}
          features={features}
          onNext={() => advanceTo("prime")}
          updateUrl={updateUrl}
          setSkillInProgress={() => setSkill("devices", "in_progress")}
        />
      )}
      {currentStep === "prime" && (
        <PrimeStep onNext={() => advanceTo("prescribe")} />
      )}
      {currentStep === "prescribe" && (
        <PrescribeStep onNext={() => advanceTo("alarms")} />
      )}
      {currentStep === "alarms" && (
        <AlarmsStep onNext={() => advanceTo("signoff")} />
      )}
      {currentStep === "signoff" && (
        <SignoffStep onComplete={handleComplete} />
      )}
    </div>
  );
}

export default function DevicesPage() {
  return (
    <Suspense fallback={<div className="text-muted">Loading configurator…</div>}>
      <DeviceConfiguratorInner />
    </Suspense>
  );
}
