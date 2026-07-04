import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Audience } from "@/lib/competencies";
import { newCard, review } from "@/lib/srs";
import type { Card, Grade } from "@/lib/srs";

// Re-export Card so consumers can import from a single place if desired.
export type { Card, Grade };

export interface SkillProgress {
  id: string;
  level: "locked" | "available" | "in_progress" | "mastered";
  score?: number;
}

interface PlatformState {
  // ── existing fields (MUST NOT change or remove) ────────────────────────────
  tourComplete: boolean;
  skills: Record<string, SkillProgress>;
  streak: number;
  lastVisit: string | null;
  caseDecisions: string[];
  setTourComplete: (v: boolean) => void;
  setSkill: (id: string, level: SkillProgress["level"], score?: number) => void;
  addCaseDecision: (decision: string) => void;
  touchStreak: () => void;

  // ── SRS card deck ──────────────────────────────────────────────────────────
  /** One Card per competency id (c1..c6). Keyed by competency id. */
  cards: Record<string, Card>;
  /**
   * Apply a spaced-repetition grade to the card for `compId`.
   * If no card exists yet, creates one first (due immediately).
   */
  reviewCard: (compId: string, grade: Grade) => void;

  // ── Placement assessment ───────────────────────────────────────────────────
  placement: {
    completed: boolean;
    /** Competency ids that were pre-credited based on placement score */
    preCredited: string[];
  };
  /**
   * Call once when the placement quiz finishes.
   * `preCredited` is the list of competency ids the placement score unlocks.
   */
  completePlacement: (preCredited: string[]) => void;

  // ── Audience role ──────────────────────────────────────────────────────────
  role: Audience | null;
  setRole: (role: Audience) => void;
}

export const usePlatformStore = create<PlatformState>()(
  persist(
    (set, get) => ({
      // ── existing state ────────────────────────────────────────────────────
      tourComplete: false,
      skills: {},
      streak: 0,
      lastVisit: null,
      caseDecisions: [],
      setTourComplete: (v) => set({ tourComplete: v }),
      setSkill: (id, level, score) =>
        set((s) => ({
          skills: { ...s.skills, [id]: { id, level, score } },
        })),
      addCaseDecision: (decision) =>
        set((s) => ({ caseDecisions: [...s.caseDecisions, decision] })),
      touchStreak: () => {
        const today = new Date().toISOString().slice(0, 10);
        const last = get().lastVisit;
        set({
          lastVisit: today,
          streak: last === today ? get().streak : last ? get().streak + 1 : 1,
        });
      },

      // ── SRS deck ──────────────────────────────────────────────────────────
      cards: {},
      reviewCard: (compId, grade) => {
        const now = Date.now();
        set((s) => {
          const existing = s.cards[compId] ?? newCard(now);
          const updated = review(existing, grade, now);
          return { cards: { ...s.cards, [compId]: updated } };
        });
      },

      // ── Placement ─────────────────────────────────────────────────────────
      placement: { completed: false, preCredited: [] },
      completePlacement: (preCredited) =>
        set({ placement: { completed: true, preCredited } }),

      // ── Role ──────────────────────────────────────────────────────────────
      role: null,
      setRole: (role) => set({ role }),
    }),
    {
      name: "raouf-tier1-platform",
      skipHydration: true,
    }
  )
);
