"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export interface FlowStepDef {
  id: string;
  label: string;
  labelKey?: string;
}

function scrollToTop() {
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

export function useFlowNavigation<T extends string>({
  steps,
  initial,
  completeRoute,
}: {
  steps: readonly T[];
  initial: T;
  /** Route after flow completion (e.g. parent competency hub). */
  completeRoute?: string;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState<T>(initial);
  const [completed, setCompleted] = useState<Set<T>>(() => new Set());

  const currentIndex = useMemo(() => steps.indexOf(current), [steps, current]);
  const isFirst = currentIndex <= 0;
  const isLast = currentIndex >= steps.length - 1;

  const markComplete = useCallback((step: T) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.add(step);
      return next;
    });
  }, []);

  const goTo = useCallback((step: T) => {
    setCurrent(step);
    scrollToTop();
  }, []);

  const back = useCallback(() => {
    if (isFirst) return;
    goTo(steps[currentIndex - 1]);
  }, [currentIndex, goTo, isFirst, steps]);

  const advance = useCallback(() => {
    if (isLast) return;
    markComplete(current);
    goTo(steps[currentIndex + 1]);
  }, [current, currentIndex, goTo, isLast, markComplete, steps]);

  const completeAll = useCallback(() => {
    setCompleted(new Set(steps));
    if (completeRoute) {
      router.push(completeRoute);
    }
  }, [completeRoute, router, steps]);

  const reachableThrough = useCallback(
    (step: T) => {
      const idx = steps.indexOf(step);
      if (idx < 0) return false;
      if (idx <= currentIndex) return true;
      return completed.has(steps[idx - 1]);
    },
    [completed, currentIndex, steps]
  );

  return {
    current,
    completed,
    currentIndex,
    isFirst,
    isLast,
    goTo,
    back,
    advance,
    markComplete,
    completeAll,
    reachableThrough,
    setCompleted,
  };
}
