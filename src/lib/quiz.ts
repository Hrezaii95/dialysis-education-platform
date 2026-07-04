import type { KnowledgeType } from "@/lib/competencies";

export interface QuizQuestion {
  id: string;
  q: string;
  options: string[];
  correct: number;
  explain: string;
  /** C1-C6 competency this question assesses */
  competencyId: string;
  /** Bloom-layer knowledge type */
  knowledgeType: KnowledgeType;
}

export const CREDENTIAL_QUIZ: QuizQuestion[] = [
  {
    id: "q1",
    q: "What is the primary clearance mechanism added in post-dilution HDF versus high-flux HD?",
    options: ["Convection (ultrafiltration-driven)", "Osmosis only", "Adsorption", "Electrodialysis"],
    correct: 0,
    explain: "HDF adds controlled convection with replacement fluid; HD relies primarily on diffusion.",
    competencyId: "c1",
    knowledgeType: "declarative",
  },
  {
    id: "q2",
    q: "CONVINCE trial mean achieved convection volume in the HDF arm was approximately:",
    options: ["15 L/session", "20 L/session", "25.3 L/session", "35 L/session"],
    correct: 2,
    explain: "Mean 25.3 L/session; enrollment required capacity for ≥23 L.",
    competencyId: "c6",
    knowledgeType: "declarative",
  },
  {
    id: "q3",
    q: "Which molecule class is most improved with HDF in training summaries?",
    options: ["Urea only", "Oxygen", "Sodium", "Middle molecules (e.g. β2M)"],
    correct: 3,
    explain: "Middle molecules like β2-microglobulin show better reduction ratios with HDF.",
    competencyId: "c1",
    knowledgeType: "declarative",
  },
  {
    id: "q4",
    q: "DIASAFE®plus primarily ensures:",
    options: ["Higher blood flow", "Faster priming", "Ultrapure substitution fluid", "Kt/V calculation"],
    correct: 2,
    explain: "Dual endotoxin-retentive filters produce ultrapure fluid for online substitution (IFU-pending).",
    competencyId: "c3",
    knowledgeType: "declarative",
  },
  {
    id: "q5",
    q: "AutoSub plus optimizes:",
    options: ["TMP pulses for convection volume", "Venous pressure alarms", "Dialysate temperature", "Heparin dosing"],
    correct: 0,
    explain: "Pressure-pulse TMP optimization maximizes convection within safety limits (IFU-pending).",
    competencyId: "c4",
    knowledgeType: "procedural",
  },
  {
    id: "q6",
    q: "Post-dilution HDF replacement fluid is delivered:",
    options: ["Before the dialyzer", "Into dialysate compartment", "Orally", "After the dialyzer in venous line"],
    correct: 3,
    explain: "Post-dilution substitution enters after the membrane in the venous blood path (IFU-pending).",
    competencyId: "c3",
    knowledgeType: "procedural",
  },
  {
    id: "q7",
    q: "VAM (Venous Access Monitor) helps detect:",
    options: ["Dialysate leaks", "Air in dialysate", "Needle dislodgement", "Low Kt/V"],
    correct: 2,
    explain: "VAM provides early warning of venous needle dislodgement (IFU-pending).",
    competencyId: "c5",
    knowledgeType: "conditional",
  },
  {
    id: "q8",
    q: "Educational simulations in Raouf Academy should be interpreted as:",
    options: ["Clinical decision support", "Educational models only", "FDA-cleared calculators", "Billing tools"],
    correct: 1,
    explain: "Simulations teach mechanisms — not individualized medical prescriptions.",
    competencyId: "c5",
    knowledgeType: "conditional",
  },
];

// ── helpers ────────────────────────────────────────────────────────────────

/**
 * Returns questions from the pool biased toward the given competency ids.
 * All questions from the weak competencies come first (shuffled among
 * themselves), followed by the remaining questions (also shuffled).
 * Result length === pool length so the quiz always presents all 8 questions.
 */
export function buildGapTargetedPool(
  pool: QuizQuestion[],
  weakCompetencyIds: string[]
): QuizQuestion[] {
  if (weakCompetencyIds.length === 0) return shuffleArray(pool);
  const weak = shuffleArray(pool.filter((q) => weakCompetencyIds.includes(q.competencyId)));
  const rest = shuffleArray(pool.filter((q) => !weakCompetencyIds.includes(q.competencyId)));
  return [...weak, ...rest];
}

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
