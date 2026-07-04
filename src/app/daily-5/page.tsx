"use client";

import { useState, useEffect, useReducer } from "react";
import { Brain, ChevronRight, RotateCcw, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlatformStore } from "@/lib/store";
import { useMounted } from "@/lib/use-mounted";
import { emitStatement } from "@/lib/xapi";
import { DAILY5_DECK, todaysFive } from "@/lib/daily5";
import type { DeckCard } from "@/lib/daily5";
import type { Grade } from "@/lib/srs";

// ── Grade button config ──────────────────────────────────────────────────────

const GRADE_CONFIG: {
  grade: Grade;
  label: string;
  hint: string;
  cls: string;
}[] = [
  {
    grade: "again",
    label: "Again",
    hint: "Blank — couldn't recall",
    cls: "bg-red-900/30 text-red-400 border-red-800/50 hover:bg-red-900/60",
  },
  {
    grade: "hard",
    label: "Hard",
    hint: "Recalled with difficulty",
    cls: "bg-amber-900/30 text-amber-400 border-amber-800/50 hover:bg-amber-900/60",
  },
  {
    grade: "good",
    label: "Good",
    hint: "Solid recall",
    cls: "bg-teal-900/30 text-teal-400 border-teal-800/50 hover:bg-teal-900/60",
  },
  {
    grade: "easy",
    label: "Easy",
    hint: "Effortless",
    cls: "bg-accent/10 text-accent border-accent/30 hover:bg-accent/25",
  },
];

// ── Competency display labels ────────────────────────────────────────────────

const COMP_LABEL: Record<string, string> = {
  c1: "C1 · Understand the therapy",
  c2: "C2 · Vascular access",
  c3: "C3 · Operate the 5008",
  c4: "C4 · HDF prescription + water safety",
  c5: "C5 · Monitor adequacy & complications",
  c6: "C6 · Know the evidence",
};

// ── Session state ────────────────────────────────────────────────────────────

type SessionState =
  | { phase: "loading" }
  | { phase: "front"; deck: DeckCard[]; index: number; reviewed: number }
  | { phase: "back"; deck: DeckCard[]; index: number; reviewed: number }
  | { phase: "done"; total: number };

type SessionAction =
  | { type: "START"; deck: DeckCard[] }
  | { type: "SHOW_BACK" }
  | { type: "GRADE" }
  | { type: "RESET" };

function reducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "START":
      if (action.deck.length === 0) return { phase: "done", total: 0 };
      return { phase: "front", deck: action.deck, index: 0, reviewed: 0 };
    case "SHOW_BACK":
      if (state.phase !== "front") return state;
      return { ...state, phase: "back" };
    case "GRADE": {
      if (state.phase !== "back") return state;
      const nextIndex = state.index + 1;
      const nextReviewed = state.reviewed + 1;
      if (nextIndex >= state.deck.length) {
        return { phase: "done", total: nextReviewed };
      }
      return {
        phase: "front",
        deck: state.deck,
        index: nextIndex,
        reviewed: nextReviewed,
      };
    }
    case "RESET":
      return { phase: "loading" };
    default:
      return state;
  }
}

// ── Page component ───────────────────────────────────────────────────────────

export default function Daily5Page() {
  const mounted = useMounted();
  const storeCards = usePlatformStore((s) => s.cards);
  const reviewCard = usePlatformStore((s) => s.reviewCard);
  const streak = usePlatformStore((s) => s.streak);

  const [session, dispatch] = useReducer(reducer, { phase: "loading" });

  // Initialise deck once mounted so SSR/hydration is safe
  useEffect(() => {
    if (!mounted) return;
    const deck = todaysFive(storeCards, Date.now());
    dispatch({ type: "START", deck });
  }, [mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleGrade = (card: DeckCard, grade: Grade) => {
    reviewCard(card.competencyId, grade);
    emitStatement("daily5_reviewed", card.id, card.front, {
      extensions: {
        competencyId: card.competencyId,
        knowledgeType: card.knowledgeType,
      },
    });
    dispatch({ type: "GRADE" });
  };

  const handleRestart = () => {
    dispatch({ type: "RESET" });
    // Re-seed from current store state
    const deck = todaysFive(storeCards, Date.now());
    dispatch({ type: "START", deck });
  };

  // ── Render guards ──────────────────────────────────────────────────────────

  if (!mounted || session.phase === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-muted animate-pulse">Loading your Daily-5…</p>
      </div>
    );
  }

  if (session.phase === "done") {
    return <CompletionSummary total={session.total} streak={streak} onRestart={handleRestart} />;
  }

  const card = session.deck[session.index];
  const progress = session.index + 1;
  const total = session.deck.length;
  const isBack = session.phase === "back";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <header>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted">
          <Brain className="h-4 w-4 text-accent" />
          Daily-5 · Spaced retrieval
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Today&apos;s 5 cards
        </h1>
        <p className="mt-1 text-sm text-muted">
          Retrieve, then grade your recall honestly. The scheduler adjusts the next review.
        </p>
      </header>

      {/* Progress bar */}
      <div>
        <div className="mb-1 flex justify-between text-xs text-muted">
          <span>Card {progress} of {total}</span>
          <span>{COMP_LABEL[card.competencyId] ?? card.competencyId}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-teal transition-all duration-300"
            style={{ width: `${((progress - 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Card face */}
      <div
        className={cn(
          "glass-panel min-h-[240px] p-6 transition-all duration-200",
          "border border-surface-2"
        )}
      >
        {/* Knowledge-type chip */}
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-[10px] uppercase tracking-wider text-muted">
          {card.knowledgeType === "declarative" && "How it works"}
          {card.knowledgeType === "procedural" && "How to"}
          {card.knowledgeType === "conditional" && "What to do"}
        </div>

        {/* Front — always visible */}
        <p className="text-base font-medium leading-snug">{card.front}</p>

        {/* Back — revealed after "Show answer" */}
        {isBack && (
          <div className="mt-6 border-t border-surface-2 pt-5">
            <p className="text-sm text-text/90 leading-relaxed whitespace-pre-line">{card.back}</p>
            <p className="mt-3 text-[11px] text-muted">
              <span className="font-semibold">Source:</span> {card.source}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {!isBack ? (
        <button
          type="button"
          onClick={() => dispatch({ type: "SHOW_BACK" })}
          className="w-full rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Show answer <ChevronRight className="inline h-4 w-4" />
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-center text-xs text-muted">How well did you recall this?</p>
          <div className="grid grid-cols-4 gap-2">
            {GRADE_CONFIG.map(({ grade, label, hint, cls }) => (
              <button
                key={grade}
                type="button"
                title={hint}
                onClick={() => handleGrade(card, grade)}
                className={cn(
                  "rounded-xl border px-2 py-3 text-xs font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  cls
                )}
              >
                {label}
                <span className="mt-0.5 block text-[10px] font-normal opacity-70">{hint}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Completion summary ────────────────────────────────────────────────────────

function CompletionSummary({
  total,
  streak,
  onRestart,
}: {
  total: number;
  streak: number;
  onRestart: () => void;
}) {
  const allCards = DAILY5_DECK.length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted">
          <Brain className="h-4 w-4 text-accent" /> Daily-5 · Complete
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Session done</h1>
      </header>

      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent/10 text-accent">
            <Brain className="h-8 w-8" />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums">
              {total} <span className="text-base font-normal text-muted">card{total !== 1 ? "s" : ""} reviewed</span>
            </p>
            {total === 0 && (
              <p className="text-sm text-muted mt-0.5">No cards were due. Well done — check back tomorrow.</p>
            )}
            {total > 0 && (
              <p className="text-sm text-muted mt-0.5">
                Spaced-repetition scheduled your next reviews automatically.
              </p>
            )}
          </div>
        </div>

        {/* Streak nudge */}
        <div className="flex items-center gap-2 rounded-lg bg-surface-2 px-4 py-3 text-sm">
          <Flame className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            {streak > 1 ? (
              <>
                <strong className="text-text">{streak}-day streak</strong>
                <span className="text-muted"> — keep coming back daily to retain what you&apos;ve learned.</span>
              </>
            ) : (
              <span className="text-muted">
                Come back tomorrow to keep the streak going — spaced repetition works best at daily intervals.
              </span>
            )}
          </span>
        </div>

        {/* Deck breadth nudge */}
        <p className="text-xs text-muted">
          Deck: {allCards} cards across 6 competencies (C1–C6) · Daily-5 selects the 5 most due each session.
        </p>
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-surface-2 bg-surface-2 px-5 py-3 text-sm font-medium text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <RotateCcw className="h-4 w-4" /> Review again
      </button>
    </div>
  );
}
