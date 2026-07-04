// The C1-C6 competency spine — the backbone of My Path.
// Grounds prd/MY-PATH-CURRICULUM.md: each competency = a knowledge-type mix (declarative/
// procedural/conditional), a demonstrable GATE, a 4-rung level ladder, and a per-audience
// depth target (the "depth dial"). Maps onto the existing routes so progress stays in sync.

import type { SkillProgress, Card } from "@/lib/store";

export type KnowledgeType = "declarative" | "procedural" | "conditional";
export type Audience = "new" | "nurse" | "charge" | "nephrologist" | "biomed";
export type Level = 0 | 1 | 2 | 3 | 4;

export const AUDIENCES: { id: Audience; label: string }[] = [
  { id: "new", label: "New / HCA" },
  { id: "nurse", label: "In-center nurse" },
  { id: "charge", label: "Charge / CNS" },
  { id: "nephrologist", label: "Nephrologist" },
  { id: "biomed", label: "Biomed tech" },
];

export const KNOWLEDGE_LABEL: Record<KnowledgeType, string> = {
  declarative: "How it works",
  procedural: "How to",
  conditional: "What to do",
};

export interface CompetencyLevel {
  level: 1 | 2 | 3 | 4;
  label: string; // Aware / Competent / Proficient / Expert
  can: string; // one-line demonstrable
}

export interface Competency {
  id: string; // c1..c6
  code: string; // "C1"
  title: string;
  blurb: string;
  knowledge: Record<KnowledgeType, number>; // mix, ~sums 100
  primaryType: KnowledgeType;
  href: string; // primary route into the work
  activities: string[];
  gate: string; // the demonstrable that flips it to mastered
  levels: CompetencyLevel[]; // L1-L4 ladder
  audienceTarget: Record<Audience, Level>; // the depth dial
  prerequisites: string[]; // competency ids
  mappedSkills: string[]; // existing SKILL_TREE ids that feed this competency
  icon: string; // lucide icon name
  demoBuild: "real" | "panel" | "stub";
}

const LADDER = ["Aware", "Competent", "Proficient", "Expert"] as const;
const ladder = (cans: [string, string, string, string]): CompetencyLevel[] =>
  cans.map((can, i) => ({ level: (i + 1) as 1 | 2 | 3 | 4, label: LADDER[i], can }));

export const COMPETENCIES: Competency[] = [
  {
    id: "c1",
    code: "C1",
    title: "Understand the therapy",
    blurb: "HD vs HDF — diffusion vs convection, and why convection clears middle molecules.",
    knowledge: { declarative: 80, procedural: 5, conditional: 15 },
    primaryType: "declarative",
    href: "/course/c1",
    activities: ["The C1 course (paginated, multi-format)", "Daily-5: diffusion vs convection"],
    gate: "Predict the clearance change when convection rises",
    levels: ladder([
      "Name HD vs HDF; “HDF adds convection for bigger toxins”",
      "Explain diffusion vs convection; predict the clearance curve",
      "Reason sieving coefficient + pre/post-dilution trade-offs; teach it",
      "Model mass-balance / FF / β2-M kinetics from first principles",
    ]),
    audienceTarget: { new: 1, nurse: 2, charge: 3, nephrologist: 4, biomed: 4 },
    prerequisites: [],
    mappedSkills: ["foundation"],
    icon: "Microscope",
    demoBuild: "real",
  },
  {
    id: "c2",
    code: "C2",
    title: "Vascular access & cannulation",
    blurb: "AVF/graft/catheter, assessment, rope-ladder, achieving the flow HDF demands.",
    knowledge: { declarative: 30, procedural: 55, conditional: 15 },
    primaryType: "procedural",
    href: "/flipbook?page=m4-p1",
    activities: ["Access assessment mini-check", "Daily-5: access cards"],
    gate: "Pass the access-assessment check",
    levels: ladder([
      "Identify AVF/graft/catheter; never cannulate unsupervised",
      "Pre-cannulation look/feel/listen; recognize complications",
      "Rope-ladder to reliable Qb ≥300–330; manage a declining access",
      "Surveillance-program logic + intervention/access-planning thresholds",
    ]),
    audienceTarget: { new: 1, nurse: 3, charge: 4, nephrologist: 2, biomed: 1 },
    prerequisites: ["c1"],
    mappedSkills: [],
    icon: "Activity",
    demoBuild: "stub",
  },
  {
    id: "c3",
    code: "C3",
    title: "Operate the 5008 for online-HDF",
    blurb: "String, prime, verify the substitution line + DIASAFE+, run, and clear alarms.",
    knowledge: { declarative: 15, procedural: 80, conditional: 5 },
    primaryType: "procedural",
    href: "/devices",
    activities: ["3D Device Lab explore", "Drag-to-sequence setup", "Timed alarm scenarios"],
    gate: "Demonstrate setup + alarm response (timed)",
    levels: ladder([
      "Name the parts; know the substitution line + DIASAFE+ matter",
      "String/prime/initiate/monitor/rinse-back a routine session",
      "Verify the online substitution line; clear TMP/conductivity/air alarms under time",
      "Device science/service: fluid-path, disinfection, calibration, fault diagnosis",
    ]),
    audienceTarget: { new: 1, nurse: 3, charge: 3, nephrologist: 1, biomed: 4 },
    prerequisites: ["c2"],
    mappedSkills: ["circuit", "monitor", "devices", "alarms"],
    icon: "Cpu",
    demoBuild: "real",
  },
  {
    id: "c4",
    code: "C4",
    title: "Deliver the HDF prescription + water safety",
    blurb: "Set Qb/Qd/time/FF to hit ≥23 L convection; why online-HDF needs ultrapure water.",
    knowledge: { declarative: 35, procedural: 35, conditional: 30 },
    primaryType: "procedural",
    href: "/simulator?tab=circuit",
    activities: ["Prescription panel (live convection vs ≥23 L)", "Daily-5: water-quality + Rx"],
    gate: "Prescribe to ≥23 L and state the water-quality floor",
    levels: ladder([
      "Know there's a convection target + an ultrapure-water need",
      "Set Qb/Qd/time/FF toward ≥23 L post-dilution; state <0.1 CFU/mL floor",
      "Tune FF to its safe ceiling + UF profiling; act on a water excursion",
      "Prescribe per patient (neph) / own the water chain + validation (biomed)",
    ]),
    audienceTarget: { new: 1, nurse: 2, charge: 3, nephrologist: 4, biomed: 4 },
    prerequisites: ["c1", "c3"],
    mappedSkills: ["circuit"],
    icon: "Droplets",
    demoBuild: "panel",
  },
  {
    id: "c5",
    code: "C5",
    title: "Monitor adequacy & manage complications",
    blurb: "Kt/V & adequacy; the four intradialytic complication families and first-moves.",
    knowledge: { declarative: 15, procedural: 25, conditional: 60 },
    primaryType: "conditional",
    href: "/simulator?tab=cases",
    activities: ["4 branching patient-case sims", "Emergency mini-sims", "Daily-5"],
    gate: "Stabilize the patient (scored decision path)",
    levels: ladder([
      "Read the basic monitor; call for help on a crashing patient",
      "Interpret Kt/V; recognize IDH + the 4 complication families",
      "Run first-moves for IDH/cardiac/hyperK/acidosis; manage emergencies",
      "Differential reasoning on the co-morbid case; set unit protocol",
    ]),
    audienceTarget: { new: 1, nurse: 3, charge: 4, nephrologist: 4, biomed: 1 },
    prerequisites: ["c3"],
    mappedSkills: ["cases", "alarms"],
    icon: "HeartPulse",
    demoBuild: "real",
  },
  {
    id: "c6",
    code: "C6",
    title: "Know the evidence",
    blurb: "Why high-volume HDF: the landmark trials and the convection-dose response.",
    knowledge: { declarative: 10, procedural: 0, conditional: 90 },
    primaryType: "conditional",
    href: "/convince",
    activities: ["Evidence & Outcomes explorer", "Daily-5: trial facts"],
    gate: "Interpret/justify the evidence (Analyze/Evaluate)",
    levels: ladder([
      "Know “HV-HDF may improve survival” exists as a claim",
      "Name CONVINCE 23%↓ / ESHOL HR 0.78 + the ≥23 L dose",
      "Contrast CONTRAST/Turkish null vs ESHOL/CONVINCE; explain dose→outcome",
      "Appraise the IPD meta-analysis + cost-effectiveness + unit applicability",
    ]),
    audienceTarget: { new: 1, nurse: 2, charge: 3, nephrologist: 4, biomed: 2 },
    prerequisites: ["c1"],
    mappedSkills: ["convince"],
    icon: "LineChart",
    demoBuild: "real",
  },
];

const LEVEL_RANK: Record<SkillProgress["level"], Level> = {
  locked: 0,
  available: 0,
  // FIX: "in_progress" now ranks 1 (not 2) so it cannot satisfy the mastery
  // gate required to unlock a dependent competency. Only "mastered" (rank 4)
  // passes the >= 4 check in isUnlocked.
  in_progress: 1,
  mastered: 4,
};

// A competency's achieved level = best of its own c-key and any mapped existing skills.
export function competencyLevel(c: Competency, skills: Record<string, SkillProgress>): Level {
  const own = skills[c.id]?.level ? LEVEL_RANK[skills[c.id].level] : 0;
  const mapped = c.mappedSkills.reduce<Level>((max, sid) => {
    const lv = skills[sid]?.level ? LEVEL_RANK[skills[sid].level] : 0;
    return (Math.max(max, lv) as Level);
  }, 0);
  return Math.max(own, mapped) as Level;
}

/**
 * A prerequisite competency is satisfied only when it has been MASTERED
 * (LEVEL_RANK "mastered" == 4). "in_progress" (rank 1) is explicitly not
 * enough — one click / first flipbook page cannot unlock the next competency.
 */
export function isUnlocked(c: Competency, skills: Record<string, SkillProgress>): boolean {
  return c.prerequisites.every((p) => {
    const pc = COMPETENCIES.find((x) => x.id === p);
    return pc ? competencyLevel(pc, skills) >= 4 : true;
  });
}

/**
 * True when:
 *   1. The competency has reached its maximum display level (4 / Expert), AND
 *   2. The learner's SRS card for this competency has retained >= 2
 *      (i.e., they have correctly retrieved the material in at least two
 *      spaced sessions — not just a single quiz pass).
 *
 * Use this for hard mastery gates (e.g. unlocking downstream competencies,
 * issuing certificates). `competencyLevel` remains available for display.
 */
export function isMastered(
  c: Competency,
  skills: Record<string, SkillProgress>,
  cards: Record<string, Card>
): boolean {
  const atTopLevel = competencyLevel(c, skills) >= 4;
  const card = cards[c.id];
  const sufficientRetention = card !== undefined && card.retained >= 2;
  return atTopLevel && sufficientRetention;
}

// The next competency to work on: first unlocked one not yet at its audience target.
export function nextCompetency(
  skills: Record<string, SkillProgress>,
  audience: Audience
): Competency | null {
  for (const c of COMPETENCIES) {
    if (isUnlocked(c, skills) && competencyLevel(c, skills) < c.audienceTarget[audience]) return c;
  }
  return null;
}
