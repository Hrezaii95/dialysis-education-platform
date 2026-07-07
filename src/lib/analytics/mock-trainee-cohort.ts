// Admin / Executive BI Dashboard — synthetic demo trainee cohort.
// 32 realistic synthetic trainees, vendor-neutral, no real PHI.
// Geographic spread across Iranian provinces; profession mix matching real-world
// dialysis HCP distribution. Clearly labeled SYNTHETIC_DEMO_COHORT.

import type {
  Trainee,
  CompetencyProgressEntry,
  Profession,
  Workplace,
  Province,
  AgeBand,
  Gender,
  ExperienceBand,
} from "./trainee-schema";
import { SYNTHETIC_DEMO_DISCLAIMER } from "./trainee-schema";

export { SYNTHETIC_DEMO_DISCLAIMER };

// ── helpers ──────────────────────────────────────────────────────────────
const CIDS: CompetencyProgressEntry["competencyId"][] = ["c1", "c2", "c3", "c4", "c5", "c6"];

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}
const rng = seeded(20260707);

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}
function randInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}
function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// ── demographic distributions (tuned to real-world dialysis HCP mix) ─────
const PROFESSION_WEIGHTS: Array<[Profession, number]> = [
  ["Hemodialysis nurse", 0.55],
  ["Charge / CNS nurse", 0.15],
  ["Nephrology fellow", 0.10],
  ["Renal technician", 0.12],
  ["Biomedical technician", 0.08],
];
const WORKPLACE_WEIGHTS: Array<[Workplace, number]> = [
  ["Hospital renal unit", 0.50],
  ["Satellite dialysis clinic", 0.30],
  ["Home-dialysis program", 0.10],
  ["Academic / teaching center", 0.10],
];
const PROVINCE_WEIGHTS: Array<[Province, number]> = [
  ["Tehran", 0.40],
  ["Esfahan", 0.12],
  ["Fars", 0.10],
  ["Khorasan-e Razavi", 0.10],
  ["East Azerbaijan", 0.08],
  ["Khuzestan", 0.08],
  ["Gilan", 0.06],
  ["Mazandaran", 0.06],
];
const AGE_BANDS: AgeBand[] = ["20-29", "30-39", "40-49", "50+"];
const AGE_WEIGHTS = [0.25, 0.40, 0.25, 0.10];
const GENDERS: Gender[] = ["female", "male", "undisclosed"];
const GENDER_WEIGHTS = [0.62, 0.35, 0.03];
const EXPERIENCE_BANDS: ExperienceBand[] = ["0-2", "3-5", "6-10", "11+"];
const EXPERIENCE_WEIGHTS = [0.30, 0.35, 0.25, 0.10];

function weighted<T>(pairs: Array<[T, number]>): T {
  const total = pairs.reduce((a, [, w]) => a + w, 0);
  let r = rng() * total;
  for (const [v, w] of pairs) {
    r -= w;
    if (r <= 0) return v;
  }
  return pairs[pairs.length - 1][0];
}

const CITY_BY_PROVINCE: Record<Province, string[]> = {
  Tehran: ["Tehran", "Eslamshahr", "Shahriar"],
  Esfahan: ["Esfahan", "Kashan", "Najafabad"],
  Fars: ["Shiraz", "Marvdasht", "Kazerun"],
  "Khorasan-e Razavi": ["Mashhad", "Neyshabur", "Sabzevar"],
  "East Azerbaijan": ["Tabriz", "Maragheh", "Ahar"],
  Khuzestan: ["Ahvaz", "Abadan", "Dezful"],
  Gilan: ["Rasht", "Bandar-e Anzali", "Lahijan"],
  Mazandaran: ["Sari", "Babol", "Amol"],
};

// ── competency progression model ─────────────────────────────────────────
// Progress declines along the spine (C1 high, C6 lowest) — matches the
// prerequisite-gated structure: most trainees are early in the journey.
function spinePct(index: number): number {
  // C1 base 70-95, declining ~10pp per step with noise.
  const base = 88 - index * 11;
  return clamp(base + randInt(-12, 8), 0, 100);
}
function pctToMastery(pct: number): CompetencyProgressEntry["mastery"] {
  if (pct >= 80) return "mastered";
  if (pct >= 35) return "in_progress";
  if (pct >= 10) return "available";
  return "locked";
}

function buildCompetencyProgress(): CompetencyProgressEntry[] {
  return CIDS.map((id, i) => {
    const pct = spinePct(i);
    return { competencyId: id, pct, mastery: pctToMastery(pct) };
  });
}

function buildGate(progress: CompetencyProgressEntry[]): Trainee["gate"] {
  const c1Pct = progress[0].pct;
  const placementTaken = c1Pct > 15;
  const placementScore = placementTaken ? clamp(c1Pct + randInt(-10, 10), 0, 100) : null;
  const credentialAttempts = placementTaken ? (rng() < 0.55 ? randInt(1, 2) : 0) : 0;
  const credentialPassed = credentialAttempts > 0 && rng() < 0.7;
  const credentialScore = credentialAttempts > 0 ? clamp(randInt(credentialPassed ? 80 : 55, credentialPassed ? 100 : 79), 0, 100) : null;
  const stage: Trainee["gate"]["stage"] = credentialPassed
    ? "credential_passed"
    : credentialAttempts > 0
    ? "credential_attempted"
    : placementTaken
    ? "placement_taken"
    : "not_started";
  return { placementScore, credentialAttempts, credentialPassed, credentialScore, stage };
}

function buildRetention(tenureDays: number): Trainee["retention"] {
  const daily5StreakDays = clamp(randInt(0, Math.min(28, tenureDays)), 0, 28);
  const consolidatedCards = clamp(randInt(0, Math.floor(tenureDays / 2)), 0, 30);
  const reviews7d = clamp(randInt(0, Math.min(20, tenureDays)), 0, 20);
  return { daily5StreakDays, consolidatedCards, reviews7d };
}

function buildAlarm(): Trainee["alarm"] {
  const trials = randInt(0, 16);
  // Median latency 2.8s–8.5s — realistic first-response range for alarm trainer.
  const medianLatencyMs = trials > 0 ? randInt(2800, 8500) : 0;
  return { medianLatencyMs, trials };
}

function buildCases(): Trainee["cases"] {
  const total = randInt(0, 12);
  const correct = total > 0 ? randInt(0, total) : 0;
  return { total, correct };
}

function pseudonymFor(profession: Profession, city: string): string {
  const initials = ["A.K.", "M.R.", "S.H.", "N.Z.", "F.B.", "H.D.", "Y.M.", "L.T.", "P.J.", "E.N.", "G.A.", "R.S."];
  return `${pick(initials)} — ${city}`;
}

// ── cohort generation ────────────────────────────────────────────────────
function generateCohort(n: number): Trainee[] {
  const out: Trainee[] = [];
  for (let i = 0; i < n; i++) {
    const province = weighted(PROVINCE_WEIGHTS);
    const city = pick(CITY_BY_PROVINCE[province]);
    const profession = weighted(PROFESSION_WEIGHTS);
    const workplace = weighted(WORKPLACE_WEIGHTS);
    const ageBand = weighted(AGE_BANDS.map((b, i) => [b, AGE_WEIGHTS[i]] as [AgeBand, number]));
    const gender = weighted(GENDERS.map((g, i) => [g, GENDER_WEIGHTS[i]] as [Gender, number]));
    const experience = weighted(EXPERIENCE_BANDS.map((b, i) => [b, EXPERIENCE_WEIGHTS[i]] as [ExperienceBand, number]));
    const tenureDays = randInt(3, 120);
    const firstActive = new Date(Date.now() - tenureDays * 86400000).toISOString();
    const competencyProgress = buildCompetencyProgress();
    out.push({
      id: `tr-${String(i + 1).padStart(2, "0")}`,
      pseudonym: pseudonymFor(profession, city),
      location: { province, city },
      profession,
      workplace,
      ageBand,
      gender,
      experience,
      competencyProgress,
      gate: buildGate(competencyProgress),
      retention: buildRetention(tenureDays),
      alarm: buildAlarm(),
      cases: buildCases(),
      tenureDays,
      firstActiveISO: firstActive,
    });
  }
  return out;
}

export const SYNTHETIC_DEMO_COHORT: Trainee[] = generateCohort(32);

export const COHORT_SIZE = SYNTHETIC_DEMO_COHORT.length;
