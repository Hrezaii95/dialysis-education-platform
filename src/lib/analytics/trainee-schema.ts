// Admin / Executive BI Dashboard — trainee schema
// Types for HCPs under training: location, profession, workplace, age, gender,
// field experience, competency progress, gate status, retention, alarm response.
//
// Vendor-neutral. No PHI. Synthetic demo data only — see mock-trainee-cohort.ts.

export type TraineeID = string;

/** Iranian province (demo geographic dimension — vendor-neutral, no real site IDs). */
export type Province =
  | "Tehran"
  | "Esfahan"
  | "Fars"
  | "Khorasan-e Razavi"
  | "East Azerbaijan"
  | "Khuzestan"
  | "Gilan"
  | "Mazandaran";

export interface Location {
  province: Province;
  city: string;
}

export type Profession =
  | "Hemodialysis nurse"
  | "Charge / CNS nurse"
  | "Nephrology fellow"
  | "Renal technician"
  | "Biomedical technician";

export type Workplace =
  | "Hospital renal unit"
  | "Satellite dialysis clinic"
  | "Home-dialysis program"
  | "Academic / teaching center";

export type AgeBand = "20-29" | "30-39" | "40-49" | "50+";

export type Gender = "female" | "male" | "undisclosed";

export type ExperienceBand = "0-2" | "3-5" | "6-10" | "11+";

/** Per-competency progress 0-100 + mastery level. */
export interface CompetencyProgressEntry {
  competencyId: "c1" | "c2" | "c3" | "c4" | "c5" | "c6";
  pct: number; // 0-100
  mastery: "locked" | "available" | "in_progress" | "mastered";
}

export type GateStage =
  | "not_started"
  | "placement_taken"
  | "credential_attempted"
  | "credential_passed";

export interface GateStatus {
  placementScore: number | null; // 0-100, null if not taken
  credentialAttempts: number;
  credentialPassed: boolean;
  credentialScore: number | null; // 0-100, null if not attempted
  stage: GateStage;
}

export interface RetentionSignal {
  daily5StreakDays: number;
  /** SM-2 stability — cards with interval >= 14 days (consolidated). */
  consolidatedCards: number;
  /** Total reviews in last 7 days. */
  reviews7d: number;
}

export interface AlarmResponseSignal {
  /** Median first-response latency in ms across alarm trainer trials. */
  medianLatencyMs: number;
  trials: number;
}

export interface CaseDecisionSignal {
  total: number;
  correct: number;
}

/** One synthetic trainee. No real PHI — names are pseudonymous initials. */
export interface Trainee {
  id: TraineeID;
  pseudonym: string; // e.g. "N. — Tehran"
  location: Location;
  profession: Profession;
  workplace: Workplace;
  ageBand: AgeBand;
  gender: Gender;
  experience: ExperienceBand;
  competencyProgress: CompetencyProgressEntry[];
  gate: GateStatus;
  retention: RetentionSignal;
  alarm: AlarmResponseSignal;
  cases: CaseDecisionSignal;
  /** Days since first activity (cohort tenure). */
  tenureDays: number;
  /** ISO date string for first activity. */
  firstActiveISO: string;
}

export const SYNTHETIC_DEMO_DISCLAIMER =
  "Synthetic demo cohort — no PHI. Educational simulation only, not for clinical prescription or regulatory-cleared decision support.";

export const PROFESSION_LABEL: Record<Profession, string> = {
  "Hemodialysis nurse": "Hemodialysis nurse",
  "Charge / CNS nurse": "Charge / CNS",
  "Nephrology fellow": "Nephrology fellow",
  "Renal technician": "Renal technician",
  "Biomedical technician": "Biomedical technician",
};

export const WORKPLACE_LABEL: Record<Workplace, string> = {
  "Hospital renal unit": "Hospital renal unit",
  "Satellite dialysis clinic": "Satellite clinic",
  "Home-dialysis program": "Home-dialysis program",
  "Academic / teaching center": "Academic center",
};

export const AGE_BANDS: AgeBand[] = ["20-29", "30-39", "40-49", "50+"];
export const EXPERIENCE_BANDS: ExperienceBand[] = ["0-2", "3-5", "6-10", "11+"];
export const GENDERS: Gender[] = ["female", "male", "undisclosed"];
export const PROFESSIONS: Profession[] = [
  "Hemodialysis nurse",
  "Charge / CNS nurse",
  "Nephrology fellow",
  "Renal technician",
  "Biomedical technician",
];
export const WORKPLACES: Workplace[] = [
  "Hospital renal unit",
  "Satellite dialysis clinic",
  "Home-dialysis program",
  "Academic / teaching center",
];
export const PROVINCES: Province[] = [
  "Tehran",
  "Esfahan",
  "Fars",
  "Khorasan-e Razavi",
  "East Azerbaijan",
  "Khuzestan",
  "Gilan",
  "Mazandaran",
];
