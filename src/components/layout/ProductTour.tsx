"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { usePlatformStore } from "@/lib/store";
import { useMounted } from "@/lib/use-mounted";

const STEPS = [
  {
    title: "Welcome to Raouf Clinical Simulator",
    body: "Tier-1 HDF training — manipulate circuits, respond to alarms, master the 5008.",
    target: null,
  },
  {
    title: "Command palette",
    body: "Press ⌘K anytime to jump to modules, cases, or IFU topics.",
    target: "cmd",
  },
  {
    title: "Skill tree",
    body: "Follow the mastery path from foundation → circuit → monitor → cases → credential.",
    target: "skills",
  },
  {
    title: "Pump the circuit",
    body: "Start with the PhET-style fluid sim — drag controls and watch TMP respond.",
    target: "circuit-cta",
  },
];

export function ProductTour() {
  const [step, setStep] = useState(0);
  const mounted = useMounted();
  const tourComplete = usePlatformStore((s) => s.tourComplete);
  const setTourComplete = usePlatformStore((s) => s.setTourComplete);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (mounted && !tourComplete) setVisible(true);
  }, [mounted, tourComplete]);

  const finish = () => {
    setTourComplete(true);
    setVisible(false);
  };

  if (!mounted || !visible || tourComplete) return null;

  const current = STEPS[step];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-panel max-w-md p-6"
        >
          <div className="mb-4 flex items-start justify-between">
            <span className="text-xs text-muted">
              Step {step + 1} / {STEPS.length}
            </span>
            <button type="button" onClick={finish} aria-label="Skip tour">
              <X className="h-4 w-4 text-muted" />
            </button>
          </div>
          <h2 className="text-lg font-semibold">{current.title}</h2>
          <p className="mt-2 text-sm text-muted">{current.body}</p>
          <div className="mt-6 flex justify-between">
            <button
              type="button"
              className="btn btn-ghost text-sm"
              onClick={finish}
            >
              Skip
            </button>
            <button
              type="button"
              className="btn btn-primary text-sm"
              onClick={() => {
                if (step < STEPS.length - 1) setStep(step + 1);
                else finish();
              }}
            >
              {step < STEPS.length - 1 ? "Next →" : "Start learning"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
