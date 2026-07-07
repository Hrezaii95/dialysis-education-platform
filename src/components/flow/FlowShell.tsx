"use client";

import type { ReactNode } from "react";
import { StepNav } from "./StepNav";
import { FlowFooter } from "./FlowFooter";
import type { FlowStepDef } from "@/hooks/useFlowNavigation";

export function FlowShell<T extends string>({
  steps,
  current,
  completed,
  onStepSelect,
  allowSkipAhead,
  children,
  footer,
}: {
  steps: readonly FlowStepDef[];
  current: T;
  completed: Set<T>;
  onStepSelect: (id: T) => void;
  allowSkipAhead?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <StepNav
        steps={steps}
        current={current}
        completed={completed}
        onStepSelect={onStepSelect}
        allowSkipAhead={allowSkipAhead}
      />
      {children}
      {footer}
    </div>
  );
}

export { StepNav, FlowFooter };
