"use client";

import { cn } from "@/lib/utils";
import type { SimOutputs } from "@/lib/sim-engine/physics";
import { useLang } from "@/components/providers/LanguageProvider";

/** XState `caseMachine` state ids — must match `src/lib/case-machine.ts`. */
export const CASE_LAB_PHASES = [
  { id: "assessment", labelKey: "cases.phase.assess", label: "Assess" },
  { id: "prescribing", labelKey: "cases.phase.prescribe", label: "Prescribe" },
  { id: "treatment", labelKey: "cases.phase.treat", label: "Treat" },
  { id: "intervention", labelKey: "cases.phase.intervene", label: "Intervene" },
  { id: "debrief", labelKey: "cases.phase.debrief", label: "Debrief" },
] as const;

export const IDH_CASE_PHASES = [
  { id: "brief", labelKey: "idh.step.brief", label: "Brief" },
  { id: "crisis", labelKey: "idh.step.crisis", label: "Crisis" },
  { id: "outcome", labelKey: "idh.step.outcome", label: "Outcome" },
  { id: "debrief", labelKey: "idh.step.debrief", label: "Debrief" },
] as const;

const PHASES = CASE_LAB_PHASES;

// ---- Unified themed PatientMonitor (Pulse-R tokens) ------------------------
// Single monitor component used across the simulator. Surfaces come from
// --surface-0 (navy dark / white light), borders from --hairline, and signal
// tones use the brand palette: --signal (lime) for positive, --danger for
// alarm, --gold for caution, --flow for info. Responds to html.light toggle.

export type MonitorTone = "good" | "warn" | "crit" | "info" | "normal";

export interface MonitorVital {
  label: string;
  value: string;
  unit?: string;
  tone?: MonitorTone;
}

export interface MonitorBar {
  label: string;
  value: number;
  max: number;
  tone?: "info" | "good" | "danger";
}

const TONE_TEXT: Record<MonitorTone, string> = {
  good: "text-[var(--signal)]",
  warn: "text-gold",
  crit: "text-danger",
  info: "text-flow",
  normal: "text-text",
};

const BAR_TONE: Record<NonNullable<MonitorBar["tone"]>, string> = {
  info: "bg-flow",
  good: "bg-[var(--signal)]",
  danger: "bg-danger",
};

export function PatientMonitor({
  title,
  status,
  statusTone,
  vitals,
  bars,
  footer,
  className,
}: {
  title: string;
  status: string;
  statusTone: "good" | "warn" | "crit";
  vitals: MonitorVital[];
  bars?: MonitorBar[];
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--hairline)] bg-surface-0 p-4 font-mono text-sm shadow-inner",
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between border-b border-[var(--hairline)] pb-2">
        <span className="text-xs text-flow">{title}</span>
        <span
          className={cn(
            "text-xs",
            statusTone === "crit" && "text-danger alarm-pulse",
            statusTone === "warn" && "text-gold",
            statusTone === "good" && "text-[var(--signal)]"
          )}
        >
          {status}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {vitals.map((v) => (
          <MonitorVitalCell key={v.label} vital={v} />
        ))}
      </div>
      {bars && bars.length > 0 && (
        <div className="mt-3 grid gap-2 text-[10px]" style={{ gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))` }}>
          {bars.map((b) => (
            <MonitorBarCell key={b.label} bar={b} />
          ))}
        </div>
      )}
      {footer && (
        <div className="mt-3 border-t border-[var(--hairline)] pt-2 text-[11px] text-muted">{footer}</div>
      )}
    </div>
  );
}

function MonitorVitalCell({ vital }: { vital: MonitorVital }) {
  const tone = vital.tone ?? "normal";
  return (
    <div>
      <div className="text-[9px] text-muted">{vital.label}</div>
      <div className={cn("text-lg font-bold tabular-nums leading-tight", TONE_TEXT[tone])}>
        {vital.value}
        {vital.unit && <span className="ml-0.5 text-[10px] text-muted">{vital.unit}</span>}
      </div>
    </div>
  );
}

function MonitorBarCell({ bar }: { bar: MonitorBar }) {
  const tone = bar.tone ?? "info";
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-muted">
        <span>{bar.label}</span>
        <span className="tabular-nums">{bar.value.toFixed(0)}</span>
      </div>
      <div className="h-1 rounded-full bg-surface-2">
        <div
          className={cn("h-full rounded-full", BAR_TONE[tone])}
          style={{ width: `${Math.min(100, (bar.value / bar.max) * 100)}%` }}
        />
      </div>
    </div>
  );
}

// ---- Physics-backed monitor (CaseLab machine path) -------------------------

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
  const { t } = useLang();
  const hr = Math.round(72 + (physics.hypotensionRisk - 40) * 0.3);
  const spo2 = Math.max(92, 98 - Math.floor(physics.hypotensionRisk / 15));
  const statusTone: "good" | "warn" | "crit" = physics.alarm ? "crit" : "warn";
  const status = physics.alarm ? "ALARM" : "STABLE";

  return (
    <PatientMonitor
      title={t("idh.monitor.label", "PATIENT MONITOR")}
      status={status}
      statusTone={statusTone}
      vitals={[
        { label: "HR", value: String(hr), unit: "bpm", tone: "good" },
        { label: "BP", value: `${systolicBp}/70`, unit: "mmHg", tone: systolicBp < 100 ? "crit" : "normal" },
        { label: "SpO₂", value: String(spo2), unit: "%", tone: "info" },
        { label: "TMP", value: physics.tmp.toFixed(0), unit: "mmHg", tone: physics.tmp > 400 ? "crit" : "warn" },
        { label: "Qb", value: String(qb), unit: "mL/min", tone: "normal" },
        { label: "Qf", value: String(convection), unit: "L", tone: "info" },
      ]}
      bars={[
        { label: "Clearance", value: physics.clearanceIndex, max: 100, tone: "info" },
        { label: "QoL idx", value: physics.qolIndex, max: 100, tone: "good" },
        { label: "IDH risk", value: physics.hypotensionRisk, max: 100, tone: "danger" },
      ]}
    />
  );
}

// ---- Phase stepper (responsive, 44px tap targets, scroll/wrap on mobile) ---

export function CasePhaseStepper({
  current,
  phases,
  onPhaseClick,
}: {
  current: string;
  phases?: { id: string; labelKey?: string; label: string }[];
  onPhaseClick?: (id: string) => void;
}) {
  const { t } = useLang();
  const list = phases ?? PHASES;
  const activeIdx = Math.max(0, list.findIndex((p) => p.id === current || current === p.id));
  const reachableIds = new Set(list.slice(0, activeIdx + 1).map((p) => p.id));

  return (
    <div className="-mx-1 overflow-x-auto pb-1 scrollbar-none">
      <ol className="flex w-max items-center gap-1 px-1 sm:w-auto sm:flex-wrap">
        {list.map((phase, i) => {
          const isActive = i === activeIdx;
          const isReachable = reachableIds.has(phase.id);
          const clickable = !!onPhaseClick && isReachable;
          const label = phase.labelKey ? t(phase.labelKey, phase.label) : phase.label;
          const Comp = clickable ? "button" : "div";
          return (
            <li key={phase.id} className="flex items-center gap-1 shrink-0">
              <Comp
                {...(clickable ? { type: "button" as const, onClick: () => onPhaseClick?.(phase.id) } : {})}
                className={cn(
                  "inline-flex min-h-[36px] items-center rounded-full px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider transition-colors",
                  clickable && "cursor-pointer",
                  isActive
                    ? "bg-accent/25 text-text ring-1 ring-accent"
                    : isReachable
                      ? "bg-surface-2 text-text hover:bg-surface-3"
                      : "bg-surface-2 text-muted",
                  "sm:min-h-[40px] sm:px-3.5"
                )}
              >
                <span className="tabular-nums text-muted/70 mr-1">{i + 1}</span>
                {label}
              </Comp>
              {i < list.length - 1 && <div className="h-px w-3 bg-[var(--hairline-strong)]" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ---- Decision card (44px tap target, theme tokens) -------------------------

export function DecisionCard({
  title,
  description,
  consequence,
  variant = "default",
  onClick,
  disabled,
  selected,
}: {
  title: string;
  description: string;
  consequence?: string;
  variant?: "default" | "danger" | "primary";
  onClick: () => void;
  disabled?: boolean;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full min-h-[44px] text-left rounded-xl border p-4 transition-all disabled:opacity-40 disabled:cursor-not-allowed",
        variant === "primary" && "border-accent/50 hover:bg-accent/10",
        variant === "danger" && "border-danger/40 hover:bg-danger/10",
        variant === "default" && "border-[var(--hairline)] hover:bg-surface-2",
        selected && "ring-1 ring-accent bg-accent/10"
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
