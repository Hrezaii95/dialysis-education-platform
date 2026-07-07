// Admin / Executive BI Dashboard — rollup / aggregation functions.
// Pure functions, typed returns, no side effects. Operate on Trainee[].

import type { Trainee, Province, Profession, Workplace, AgeBand, Gender, ExperienceBand, GateStage } from "./trainee-schema";
import {
  PROVINCES,
  PROFESSIONS,
  WORKPLACES,
  AGE_BANDS,
  GENDERS,
  EXPERIENCE_BANDS,
} from "./trainee-schema";

export interface CountRow<K extends string> {
  key: K;
  label: string;
  count: number;
  pct: number; // share of cohort, 0-100
}

export interface CompetencyHeatmapCell {
  competencyId: "c1" | "c2" | "c3" | "c4" | "c5" | "c6";
  avgPct: number;
  masteredCount: number;
  inProgressCount: number;
  availableCount: number;
  lockedCount: number;
}

export interface GateFunnelStage {
  stage: GateStage;
  label: string;
  count: number;
  pct: number; // of total cohort
}

export interface HistogramBucket {
  label: string;
  count: number;
}

// ── dimension rollups ────────────────────────────────────────────────────
export function byLocation(cohort: Trainee[]): CountRow<Province>[] {
  return PROVINCES.map((p) => {
    const count = cohort.filter((t) => t.location.province === p).length;
    return { key: p, label: p, count, pct: pct(count, cohort.length) };
  }).filter((r) => r.count > 0);
}

export function byProfession(cohort: Trainee[]): CountRow<Profession>[] {
  return PROFESSIONS.map((p) => {
    const count = cohort.filter((t) => t.profession === p).length;
    return { key: p, label: p, count, pct: pct(count, cohort.length) };
  }).filter((r) => r.count > 0);
}

export function byWorkplace(cohort: Trainee[]): CountRow<Workplace>[] {
  return WORKPLACES.map((w) => {
    const count = cohort.filter((t) => t.workplace === w).length;
    return { key: w, label: w, count, pct: pct(count, cohort.length) };
  }).filter((r) => r.count > 0);
}

export function byAgeBand(cohort: Trainee[]): CountRow<AgeBand>[] {
  return AGE_BANDS.map((b) => {
    const count = cohort.filter((t) => t.ageBand === b).length;
    return { key: b, label: b, count, pct: pct(count, cohort.length) };
  });
}

export function byGender(cohort: Trainee[]): CountRow<Gender>[] {
  return GENDERS.map((g) => {
    const count = cohort.filter((t) => t.gender === g).length;
    return { key: g, label: g, count, pct: pct(count, cohort.length) };
  }).filter((r) => r.count > 0);
}

export function byExperience(cohort: Trainee[]): CountRow<ExperienceBand>[] {
  return EXPERIENCE_BANDS.map((b) => {
    const count = cohort.filter((t) => t.experience === b).length;
    return { key: b, label: `${b} yrs`, count, pct: pct(count, cohort.length) };
  });
}

// ── competency heatmap (cohort-level) ────────────────────────────────────
export function cohortCompetencyHeatmap(cohort: Trainee[]): CompetencyHeatmapCell[] {
  const cids = ["c1", "c2", "c3", "c4", "c5", "c6"] as const;
  return cids.map((cid) => {
    const entries = cohort.map((t) => t.competencyProgress.find((c) => c.competencyId === cid)!).filter(Boolean);
    const avgPct = entries.length > 0 ? Math.round(entries.reduce((a, e) => a + e.pct, 0) / entries.length) : 0;
    return {
      competencyId: cid,
      avgPct,
      masteredCount: entries.filter((e) => e.mastery === "mastered").length,
      inProgressCount: entries.filter((e) => e.mastery === "in_progress").length,
      availableCount: entries.filter((e) => e.mastery === "available").length,
      lockedCount: entries.filter((e) => e.mastery === "locked").length,
    };
  });
}

// ── gate funnel (placement → credential) ─────────────────────────────────
export function gateFunnel(cohort: Trainee[]): GateFunnelStage[] {
  const stages: GateStage[] = ["not_started", "placement_taken", "credential_attempted", "credential_passed"];
  const labels: Record<GateStage, string> = {
    not_started: "Not started",
    placement_taken: "Placement taken",
    credential_attempted: "Credential attempted",
    credential_passed: "Credential passed",
  };
  return stages.map((s) => {
    const count = cohort.filter((t) => t.gate.stage === s).length;
    return { stage: s, label: labels[s], count, pct: pct(count, cohort.length) };
  });
}

// ── retention distribution ───────────────────────────────────────────────
export function retentionDistribution(cohort: Trainee[]): HistogramBucket[] {
  const buckets = ["0", "1-3", "4-7", "8-14", "15+"];
  const counts = [0, 0, 0, 0, 0];
  for (const t of cohort) {
    const s = t.retention.daily5StreakDays;
    if (s === 0) counts[0]++;
    else if (s <= 3) counts[1]++;
    else if (s <= 7) counts[2]++;
    else if (s <= 14) counts[3]++;
    else counts[4]++;
  }
  return buckets.map((label, i) => ({ label, count: counts[i] }));
}

// ── alarm latency distribution ───────────────────────────────────────────
export function alarmLatencyDistribution(cohort: Trainee[]): HistogramBucket[] {
  // 1s buckets from 2-9s; trainees with 0 trials excluded from buckets.
  const buckets = ["<3s", "3-4s", "4-5s", "5-6s", "6-7s", "7s+"];
  const counts = [0, 0, 0, 0, 0, 0];
  for (const t of cohort) {
    if (t.alarm.trials === 0) continue;
    const s = t.alarm.medianLatencyMs / 1000;
    if (s < 3) counts[0]++;
    else if (s < 4) counts[1]++;
    else if (s < 5) counts[2]++;
    else if (s < 6) counts[3]++;
    else if (s < 7) counts[4]++;
    else counts[5]++;
  }
  return buckets.map((label, i) => ({ label, count: counts[i] }));
}

// ── hero metrics (executive stat row) ────────────────────────────────────
export interface ExecHeroMetrics {
  activeTrainees: number;
  avgCompetencyPct: number;
  credentialPassRate: number; // pct of credential attempts that passed
  retention7d: number; // trainees with reviews7d > 0
  medianAlarmLatencyMs: number;
  placementTaken: number;
  credentialPassed: number;
}

export function execHeroMetrics(cohort: Trainee[]): ExecHeroMetrics {
  const activeTrainees = cohort.length;
  const heat = cohortCompetencyHeatmap(cohort);
  const avgCompetencyPct = Math.round(heat.reduce((a, c) => a + c.avgPct, 0) / heat.length);
  const attempts = cohort.filter((t) => t.gate.credentialAttempts > 0);
  const passed = cohort.filter((t) => t.gate.credentialPassed);
  const credentialPassRate = attempts.length > 0 ? Math.round((passed.length / attempts.length) * 100) : 0;
  const retention7d = cohort.filter((t) => t.retention.reviews7d > 0).length;
  const latencies = cohort.filter((t) => t.alarm.trials > 0).map((t) => t.alarm.medianLatencyMs);
  const medianAlarmLatencyMs = latencies.length > 0 ? median(latencies) : 0;
  return {
    activeTrainees,
    avgCompetencyPct,
    credentialPassRate,
    retention7d,
    medianAlarmLatencyMs,
    placementTaken: cohort.filter((t) => t.gate.placementScore !== null).length,
    credentialPassed: passed.length,
  };
}

// ── utils ────────────────────────────────────────────────────────────────
function pct(n: number, total: number): number {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}
function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
}

// ── smoke test (self-contained, runs on import in dev only if invoked) ───
export function _smoke(): boolean {
  // Re-import-free shape check — confirms rollups return arrays of the right length.
  const fake: Trainee[] = [];
  // empty cohort edge case
  if (byLocation(fake).length !== 0) return false;
  if (cohortCompetencyHeatmap(fake).length !== 6) return false; // 6 competencies always
  if (gateFunnel(fake).length !== 4) return false; // 4 stages always
  return true;
}
