"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/components/providers/LanguageProvider";
import type { FlowStepDef } from "@/hooks/useFlowNavigation";

export function StepNav<T extends string>({
  steps,
  current,
  completed,
  onStepSelect,
  allowSkipAhead = true,
  className,
}: {
  steps: readonly FlowStepDef[];
  current: T;
  completed: Set<T>;
  onStepSelect: (id: T) => void;
  /** When false, only current + completed steps are clickable. */
  allowSkipAhead?: boolean;
  className?: string;
}) {
  const { t } = useLang();
  const currentIdx = steps.findIndex((s) => s.id === current);

  return (
    <nav aria-label={t("flow.stepNav.label", "Guided steps")} className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {steps.map((step, i) => {
        const isActive = step.id === current;
        const isDone = completed.has(step.id as T);
        const isReachable = allowSkipAhead || i <= currentIdx || isDone;
        const label = step.labelKey ? t(step.labelKey, step.label) : step.label;

        return (
          <span key={step.id} className="flex items-center gap-1.5">
            <button
              type="button"
              aria-current={isActive ? "step" : undefined}
              disabled={!isReachable}
              onClick={() => isReachable && onStepSelect(step.id as T)}
              className={cn(
                "inline-flex min-h-[36px] items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flow/60",
                "disabled:cursor-not-allowed disabled:opacity-50",
                isActive
                  ? "bg-flow/20 text-flow ring-1 ring-flow/40"
                  : isDone
                    ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                    : isReachable
                      ? "bg-surface-2 text-muted hover:bg-surface-2/80 hover:text-foreground"
                      : "bg-surface-2 text-muted"
              )}
            >
              {isDone && !isActive && <CheckCircle2 className="h-3 w-3 text-emerald-400" aria-hidden />}
              {i + 1}. {label}
            </button>
            {i < steps.length - 1 && <ArrowRight className="h-3 w-3 shrink-0 text-muted" aria-hidden />}
          </span>
        );
      })}
    </nav>
  );
}
