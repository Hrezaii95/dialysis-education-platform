/**
 * srs.ts — SM-2-style spaced-repetition scheduler (pure TypeScript, no external deps).
 *
 * Grades:
 *   again  — complete blank; resets progress
 *   hard   — remembered with difficulty; small interval growth, ease decreases
 *   good   — solid recall; normal interval growth
 *   easy   — effortless recall; larger interval jump, ease increases
 *
 * `retained` counts only "good" or "easy" reviews, meaning the learner has
 * genuinely retrieved the item across spaced sessions. A card is considered
 * mastered externally when retained >= 2.
 */

export type Grade = "again" | "hard" | "good" | "easy";

export interface Card {
  /** Total review attempts */
  reps: number;
  /** Count of "good" or "easy" responses (confirmed retrievals) */
  retained: number;
  /** Ease factor — starts at 2.5, floors at 1.3 */
  ease: number;
  /** Current interval in days */
  intervalDays: number;
  /** Next review due timestamp (ms since epoch) */
  due: number;
  /** Timestamp of last review (ms since epoch, 0 if never reviewed) */
  lastReview: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const EASE_START = 2.5;
const EASE_FLOOR = 1.3;
const EASE_HARD_PENALTY = -0.15;
const EASE_GOOD_DELTA = 0.0; // neutral on good
const EASE_EASY_BONUS = 0.15;

const INTERVAL_AGAIN = 1; // start over in 1 day
const INTERVAL_HARD_MIN = 1;
const INTERVAL_EASY_FACTOR = 1.3; // extra multiplier on top of ease

const MS_PER_DAY = 86_400_000;

// ── Factory ────────────────────────────────────────────────────────────────────
/**
 * Create a brand-new, never-reviewed card.
 * `now` is the current timestamp in ms (pass Date.now()).
 */
export function newCard(now: number): Card {
  return {
    reps: 0,
    retained: 0,
    ease: EASE_START,
    intervalDays: 1,
    due: now, // immediately due
    lastReview: 0,
  };
}

// ── Scheduler ─────────────────────────────────────────────────────────────────
/**
 * Apply a review grade to a card and return the updated card (immutable).
 *
 * Algorithm (SM-2 variant):
 *  - again  → reset interval to 1 day; ease -0.20; retained unchanged
 *  - hard   → interval stays same (floor 1); ease -0.15; retained unchanged
 *  - good   → interval *= ease; ease +0.00; retained ++
 *  - easy   → interval *= ease * 1.3; ease +0.15; retained ++
 *
 * `due` is always set to `now + intervalDays * 86400000`.
 */
export function review(card: Card, grade: Grade, now: number): Card {
  const next: Card = { ...card, reps: card.reps + 1, lastReview: now };

  switch (grade) {
    case "again":
      next.ease = Math.max(EASE_FLOOR, card.ease - 0.2);
      next.intervalDays = INTERVAL_AGAIN;
      // retained does NOT increase
      break;

    case "hard": {
      next.ease = Math.max(EASE_FLOOR, card.ease + EASE_HARD_PENALTY);
      const hardInterval = Math.max(
        INTERVAL_HARD_MIN,
        Math.round(card.intervalDays * 1.2) // grow slightly so it doesn't stall
      );
      next.intervalDays = hardInterval;
      // retained does NOT increase
      break;
    }

    case "good": {
      next.ease = Math.max(EASE_FLOOR, card.ease + EASE_GOOD_DELTA);
      const goodInterval = Math.max(1, Math.round(card.intervalDays * card.ease));
      next.intervalDays = goodInterval;
      next.retained = card.retained + 1;
      break;
    }

    case "easy": {
      next.ease = Math.max(EASE_FLOOR, card.ease + EASE_EASY_BONUS);
      const easyInterval = Math.max(1, Math.round(card.intervalDays * card.ease * INTERVAL_EASY_FACTOR));
      next.intervalDays = easyInterval;
      next.retained = card.retained + 1;
      break;
    }
  }

  next.due = now + next.intervalDays * MS_PER_DAY;
  return next;
}

// ── Query ──────────────────────────────────────────────────────────────────────
/**
 * Returns true when the card is due for review at time `now`.
 */
export function isDue(card: Card, now: number): boolean {
  return now >= card.due;
}
