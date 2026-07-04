"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, XCircle, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlatformStore } from "@/lib/store";
import { CREDENTIAL_QUIZ, type QuizQuestion } from "@/lib/quiz";
import { COMPETENCIES } from "@/lib/competencies";
import { emitStatement } from "@/lib/xapi";

// ── Curated placement subset: 7 questions sampling C1–C6 ──────────────────────
// q1 → C1 (therapy/convection), q2 → C6 (evidence/CONVINCE),
// q3 → C1 (middle molecules), q4 → C3 (DIASAFE+/device),
// q5 → C3/C4 (AutoSub/convection ops), q6 → C4 (post-dilution Rx),
// q7 → C3 (VAM/device safety).
//
// competencyId tells the scorer which competency a correct answer pre-credits.
const PLACEMENT_QUESTIONS: (QuizQuestion & { competencyId: string })[] = [
  { ...CREDENTIAL_QUIZ[0], competencyId: "c1" }, // q1 — convection mechanism
  { ...CREDENTIAL_QUIZ[2], competencyId: "c1" }, // q3 — middle molecules
  { ...CREDENTIAL_QUIZ[1], competencyId: "c6" }, // q2 — CONVINCE volume
  { ...CREDENTIAL_QUIZ[3], competencyId: "c3" }, // q4 — DIASAFE+
  { ...CREDENTIAL_QUIZ[5], competencyId: "c4" }, // q6 — post-dilution placement
  { ...CREDENTIAL_QUIZ[6], competencyId: "c3" }, // q7 — VAM
  { ...CREDENTIAL_QUIZ[4], competencyId: "c4" }, // q5 — AutoSub/convection ops
];

type Phase = "intro" | "quiz" | "result";

export default function PlacementPage() {
  const router = useRouter();
  const { setSkill, completePlacement } = usePlatformStore();

  const [phase, setPhase] = useState<Phase>("intro");
  const [current, setCurrent] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  // Map competencyId → number of correct answers for that competency
  const correctByComp = useRef<Record<string, number>>({});
  const [creditedIds, setCreditedIds] = useState<string[]>([]);

  const startTime = useRef<number>(0);
  const q = PLACEMENT_QUESTIONS[current];
  const total = PLACEMENT_QUESTIONS.length;

  function handleStart() {
    startTime.current = Date.now();
    setPhase("quiz");
  }

  function handleChoose(idx: number) {
    if (revealed) return;
    setChosen(idx);
    setRevealed(true);
    if (idx === q.correct) {
      const compId = q.competencyId;
      correctByComp.current[compId] = (correctByComp.current[compId] ?? 0) + 1;
    }
  }

  function handleNext() {
    if (current + 1 < total) {
      setCurrent((c) => c + 1);
      setChosen(null);
      setRevealed(false);
    } else {
      finishPlacement();
    }
  }

  function finishPlacement() {
    // Pre-credit any competency where the learner got ≥1 question right.
    // We use setSkill(id, "in_progress") = entry credit, NOT mastery.
    const credited: string[] = [];
    for (const [compId, count] of Object.entries(correctByComp.current)) {
      if (count >= 1) {
        // Validate competency exists
        if (COMPETENCIES.find((c) => c.id === compId)) {
          setSkill(compId, "in_progress");
          credited.push(compId);
        }
      }
    }

    completePlacement(credited);
    setCreditedIds(credited);

    const durationMs = Date.now() - startTime.current;
    emitStatement(
      "placement_completed",
      "raouf/placement/diagnostic",
      "Placement Calibration",
      {
        score: Math.round((Object.values(correctByComp.current).reduce((s, n) => s + n, 0) / total) * 100),
        success: true,
        durationMs,
        extensions: { creditedIds: credited },
      }
    );

    setPhase("result");
  }

  if (phase === "intro") {
    return <IntroScreen onStart={handleStart} />;
  }

  if (phase === "result") {
    return (
      <ResultScreen
        creditedIds={creditedIds}
        total={total}
        correctCount={Object.values(correctByComp.current).reduce((s, n) => s + n, 0)}
        onContinue={() => router.push("/my-path")}
      />
    );
  }

  // ── Quiz phase ────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-accent" />
            Placement Calibration
          </span>
          <span className="tabular-nums">
            {current + 1} / {total}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
          <motion.div
            className="h-full rounded-full bg-accent"
            animate={{ width: `${((current + (revealed ? 1 : 0)) / total) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="glass-panel space-y-5 p-6"
        >
          {/* Competency badge */}
          <div className="text-[10px] font-semibold uppercase tracking-widest text-accent">
            {COMPETENCIES.find((c) => c.id === q.competencyId)?.code ?? ""} ·{" "}
            {COMPETENCIES.find((c) => c.id === q.competencyId)?.title ?? ""}
          </div>

          <p className="text-lg font-medium leading-snug">{q.q}</p>

          <div className="space-y-2.5">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleChoose(idx)}
                disabled={revealed}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                  !revealed && "border-border hover:border-accent/50 hover:bg-surface-2",
                  revealed && idx === q.correct && "border-teal/50 bg-teal/10 text-text",
                  revealed && idx === chosen && idx !== q.correct && "border-red-500/40 bg-red-500/10",
                  revealed && idx !== chosen && idx !== q.correct && "border-border opacity-50"
                )}
              >
                <span
                  className={cn(
                    "grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold",
                    !revealed && "bg-surface-2 text-muted",
                    revealed && idx === q.correct && "bg-teal/20 text-teal",
                    revealed && idx === chosen && idx !== q.correct && "bg-red-500/20 text-red-400"
                  )}
                >
                  {revealed && idx === q.correct ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : revealed && idx === chosen && idx !== q.correct ? (
                    <XCircle className="h-4 w-4" />
                  ) : (
                    String.fromCharCode(65 + idx)
                  )}
                </span>
                {opt}
              </button>
            ))}
          </div>

          {/* Explanation */}
          <AnimatePresence>
            {revealed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-lg bg-surface-2 px-4 py-3 text-sm text-muted">
                  <span className="font-medium text-text">Why: </span>
                  {q.explain}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {revealed && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                {current + 1 < total ? "Next question" : "See results"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Honest framing — always visible */}
      <p className="text-center text-xs text-muted">
        This sets where you <span className="font-medium text-text">start</span> — not what
        you&apos;ve mastered. You advance by demonstrating, not by answering questions here.
      </p>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="mx-auto max-w-xl space-y-8 py-16">
      <div className="space-y-3 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
          <Compass className="h-7 w-7 text-accent" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Placement Calibration</h1>
        <p className="mx-auto max-w-sm text-sm text-muted">
          7 quick questions across the six competency areas. Takes about 4 minutes.
        </p>
      </div>

      <div className="glass-panel space-y-3 p-5">
        <h2 className="text-sm font-semibold">What this does</h2>
        <ul className="space-y-2 text-sm text-muted">
          <li className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
            Sets where you <span className="font-medium text-text">start</span> on each competency
          </li>
          <li className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
            Pre-credits competencies you already know — skipping basics you&apos;ve mastered
          </li>
          <li className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
            Does <span className="font-medium text-text">not</span> substitute for demonstration gates
          </li>
        </ul>
        <p className="border-t border-border pt-3 text-xs text-muted">
          Honest framing: getting a question right here is entry credit — it unlocks a starting
          point, not a mastery badge. You still have to demonstrate competency through the platform
          activities.
        </p>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onStart}
          className="flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-medium text-white transition-opacity hover:opacity-90"
        >
          Start calibration <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ResultScreen({
  creditedIds,
  total,
  correctCount,
  onContinue,
}: {
  creditedIds: string[];
  total: number;
  correctCount: number;
  onContinue: () => void;
}) {
  const creditedComps = COMPETENCIES.filter((c) => creditedIds.includes(c.id));

  return (
    <div className="mx-auto max-w-xl space-y-8 py-16">
      <div className="space-y-2 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/10">
          <CheckCircle2 className="h-7 w-7 text-teal" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Calibration complete</h1>
        <p className="text-sm text-muted">
          {correctCount} of {total} correct ·{" "}
          {creditedComps.length > 0
            ? `${creditedComps.length} competency area${creditedComps.length > 1 ? "s" : ""} pre-credited`
            : "starting from the beginning"}
        </p>
      </div>

      {creditedComps.length > 0 && (
        <div className="glass-panel space-y-3 p-5">
          <h2 className="text-sm font-semibold">Starting points set</h2>
          <p className="text-xs text-muted">
            These areas are marked <span className="font-medium text-text">In Progress</span> — entry
            credit only. You still need to demonstrate mastery through the platform activities.
          </p>
          <div className="space-y-2 pt-1">
            {creditedComps.map((c) => (
              <div key={c.id} className="flex items-center gap-2.5 text-sm">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-accent/10 text-xs font-bold text-accent">
                  {c.code}
                </div>
                <span className="font-medium">{c.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {creditedComps.length === 0 && (
        <div className="glass-panel p-5">
          <p className="text-sm text-muted">
            No areas pre-credited — your path starts at the foundation. That&apos;s completely
            normal; the platform is designed to build from here.
          </p>
        </div>
      )}

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onContinue}
          className="flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-medium text-white transition-opacity hover:opacity-90"
        >
          Go to My Path <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
