"use client";

import { useState } from "react";
import Link from "next/link";
import { CREDENTIAL_QUIZ, buildGapTargetedPool, shuffleArray, type QuizQuestion } from "@/lib/quiz";
import { COMPETENCIES, KNOWLEDGE_LABEL } from "@/lib/competencies";
import type { KnowledgeType } from "@/lib/competencies";
import { emitStatement } from "@/lib/xapi";
import { usePlatformStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Award, Check, X, BookOpen } from "lucide-react";

// ── types ──────────────────────────────────────────────────────────────────

interface CompetencyResult {
  id: string;
  code: string;
  title: string;
  href: string;
  total: number;
  correct: number;
  pct: number;
  weakestKt: KnowledgeType | null;
}

// ── helpers ────────────────────────────────────────────────────────────────

const KT_ORDER: KnowledgeType[] = ["declarative", "procedural", "conditional"];

function computeResults(
  pool: QuizQuestion[],
  answers: (number | null)[]
): { byCompetency: CompetencyResult[]; byKt: Record<KnowledgeType, { total: number; correct: number }> } {
  // per-competency
  const compMap: Record<string, { total: number; correctCount: number; byKt: Record<KnowledgeType, { t: number; c: number }> }> = {};

  pool.forEach((q, i) => {
    if (!compMap[q.competencyId]) {
      compMap[q.competencyId] = {
        total: 0,
        correctCount: 0,
        byKt: { declarative: { t: 0, c: 0 }, procedural: { t: 0, c: 0 }, conditional: { t: 0, c: 0 } },
      };
    }
    const entry = compMap[q.competencyId];
    entry.total += 1;
    const kt = q.knowledgeType;
    entry.byKt[kt].t += 1;
    if (answers[i] === q.correct) {
      entry.correctCount += 1;
      entry.byKt[kt].c += 1;
    }
  });

  // per-KT global
  const byKt: Record<KnowledgeType, { total: number; correct: number }> = {
    declarative: { total: 0, correct: 0 },
    procedural: { total: 0, correct: 0 },
    conditional: { total: 0, correct: 0 },
  };
  pool.forEach((q, i) => {
    byKt[q.knowledgeType].total += 1;
    if (answers[i] === q.correct) byKt[q.knowledgeType].correct += 1;
  });

  const byCompetency: CompetencyResult[] = COMPETENCIES.filter((c) => compMap[c.id]).map((c) => {
    const entry = compMap[c.id];
    const pct = entry.total > 0 ? Math.round((entry.correctCount / entry.total) * 100) : 0;
    // find weakest KT for this competency
    let weakestKt: KnowledgeType | null = null;
    let weakestPct = 101;
    for (const kt of KT_ORDER) {
      const { t, c: cor } = entry.byKt[kt];
      if (t > 0) {
        const ktPct = Math.round((cor / t) * 100);
        if (ktPct < weakestPct) {
          weakestPct = ktPct;
          weakestKt = kt;
        }
      }
    }
    return { id: c.id, code: c.code, title: c.title, href: c.href, total: entry.total, correct: entry.correctCount, pct, weakestKt };
  });

  return { byCompetency, byKt };
}

// ── component ──────────────────────────────────────────────────────────────

export default function AssessmentPage() {
  const [pool, setPool] = useState(() => shuffleArray(CREDENTIAL_QUIZ));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  // track all answers in order for post-completion analysis
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const setSkill = usePlatformStore((s) => s.setSkill);

  const q = pool[index];
  const pct = Math.round((score / pool.length) * 100);
  const passed = pct >= 80;

  const answer = (opt: number) => {
    if (selected !== null) return;
    setSelected(opt);
    const correct = opt === q.correct;
    if (correct) setScore((s) => s + 1);
    emitStatement("answered", q.id, q.q, {
      success: correct,
      score: correct ? 100 : 0,
      extensions: { competencyId: q.competencyId, knowledgeType: q.knowledgeType },
    });
    setShowExplain(true);
  };

  const next = () => {
    // record the answer for this question
    const updatedAnswers = [...answers, selected];

    if (index < pool.length - 1) {
      setAnswers(updatedAnswers);
      setIndex(index + 1);
      setSelected(null);
      setShowExplain(false);
    } else {
      // final question — compute results and finish.
      // Derive score from updatedAnswers to avoid the stale-closure issue with
      // the score state variable (setScore is async so score may not yet reflect
      // the last answer when next() closes over it).
      const finalScore = updatedAnswers.filter((ans, i) => ans === pool[i].correct).length;
      const finalPct = Math.round((finalScore / pool.length) * 100);
      const didPass = finalPct >= 80;

      setAnswers(updatedAnswers);
      setDone(true);

      emitStatement("completed", "credential-assessment", "HDF Clinical Credential", {
        score: finalPct,
        success: didPass,
      });

      if (didPass) {
        setSkill("credential", "mastered", finalPct);
        emitStatement("mastered", "hdf-credential", "Raouf HDF Clinical Credential", { score: finalPct });
      } else {
        // emit path_rewritten with weak competency analysis
        const { byCompetency } = computeResults(pool, updatedAnswers);
        const weakComps = byCompetency.filter((c) => c.pct < 80);
        if (weakComps.length > 0) {
          emitStatement("path_rewritten", "assessment", "HDF Clinical Credential", {
            extensions: {
              weakCompetencies: weakComps.map((c) => ({
                id: c.id,
                code: c.code,
                pct: c.pct,
                weakestKt: c.weakestKt,
              })),
            },
          });
        }
      }
    }
  };

  // ── results screen ───────────────────────────────────────────────────────

  if (done) {
    const finalScore = answers.filter((ans, i) => ans === pool[i].correct).length;
    const finalPct = Math.round((finalScore / pool.length) * 100);
    const didPass = finalPct >= 80;
    const { byCompetency, byKt } = computeResults(pool, answers);
    const weakComps = byCompetency.filter((c) => c.pct < 80).sort((a, b) => a.pct - b.pct);
    const weakestComp = weakComps[0] ?? null;

    const handleRetake = () => {
      const weakIds = weakComps.map((c) => c.id);
      setPool(buildGapTargetedPool(CREDENTIAL_QUIZ, weakIds));
      setIndex(0);
      setScore(0);
      setAnswers([]);
      setDone(false);
      setSelected(null);
      setShowExplain(false);
    };

    return (
      <div className="mx-auto max-w-lg space-y-6">
        {/* score badge */}
        <div className="text-center space-y-4">
          <div
            className={cn(
              "mx-auto flex h-24 w-24 items-center justify-center rounded-full",
              didPass ? "bg-success/20 text-success" : "bg-danger/20 text-danger"
            )}
          >
            <Award className="h-12 w-12" />
          </div>
          <h1 className="text-2xl font-semibold">
            {didPass ? "Credential Earned" : "Assessment Incomplete"}
          </h1>
          <p className="text-muted">
            Score: {finalScore}/{pool.length} ({finalPct}%) —{" "}
            {didPass ? "≥80% required ✓" : "Retake to earn credential"}
          </p>
        </div>

        {/* certificate panel (pass only) */}
        {didPass && (
          <div className="glass-panel p-6 text-left text-sm space-y-2">
            <div className="font-semibold">Certified: Competent — In-center HDF Nurse</div>
            <p className="text-xs text-muted">
              Certified to a stated level (per the My Path depth dial) — not a participation pass.
            </p>
            <div className="mt-2 border-t border-white/8 pt-2 font-semibold">xAPI Record Issued</div>
            <p className="text-muted">
              Verb: mastered · Object: Raouf HDF Clinical Credential · Timestamp:{" "}
              {new Date().toISOString()}
            </p>
            <p className="text-xs text-muted">
              xAPI-compatible · integrates with compliant LMS environments
            </p>
          </div>
        )}

        {/* fail: competency analysis + remediation */}
        {!didPass && (
          <>
            {/* per-competency breakdown */}
            <div className="glass-panel p-5 space-y-3">
              <h2 className="font-semibold text-sm">Competency analysis</h2>
              {weakestComp && (
                <p className="text-xs text-danger">
                  Weakest: {weakestComp.code} —{" "}
                  {weakestComp.weakestKt ? KNOWLEDGE_LABEL[weakestComp.weakestKt] : ""} (
                  {weakestComp.pct}%)
                </p>
              )}
              <div className="space-y-2">
                {byCompetency.map((c) => (
                  <div key={c.id}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className={c.pct < 80 ? "text-danger" : "text-success"}>
                        {c.code} {c.title}
                      </span>
                      <span className="tabular-nums text-muted">
                        {c.correct}/{c.total} ({c.pct}%)
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-surface-2">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          c.pct >= 80 ? "bg-success" : c.pct >= 50 ? "bg-gold" : "bg-danger"
                        )}
                        style={{ width: `${c.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* knowledge-type summary */}
              <div className="pt-2 border-t border-white/8">
                <p className="text-xs text-muted mb-1">Knowledge-type breakdown</p>
                <div className="flex gap-3 flex-wrap">
                  {KT_ORDER.map((kt) => {
                    const { total, correct } = byKt[kt];
                    if (total === 0) return null;
                    const ktPct = Math.round((correct / total) * 100);
                    return (
                      <span key={kt} className="text-xs tabular-nums">
                        <span className="text-muted">{KNOWLEDGE_LABEL[kt]}:</span>{" "}
                        <span className={ktPct < 80 ? "text-danger" : "text-success"}>
                          {ktPct}%
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* gap-remediation links */}
            {weakComps.length > 0 && (
              <div className="glass-panel p-5 space-y-3">
                <h2 className="font-semibold text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-accent" />
                  Recommended review
                </h2>
                <ul className="space-y-2">
                  {weakComps.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={c.href}
                        className="flex items-center justify-between rounded-lg border border-white/8 px-3 py-2 text-sm hover:border-accent/50 hover:bg-surface-2 transition-all"
                      >
                        <span>
                          <span className="text-accent font-medium">{c.code}</span>{" "}
                          {c.title}
                          {c.weakestKt && (
                            <span className="ml-2 text-xs text-muted">
                              · focus: {KNOWLEDGE_LABEL[c.weakestKt]}
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-muted">{c.pct}% →</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button type="button" className="btn btn-primary w-full" onClick={handleRetake}>
              Retake assessment (gap-targeted)
            </button>
          </>
        )}
      </div>
    );
  }

  // ── quiz screen ──────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Clinical Credential Assessment</h1>
        <p className="mt-1 text-sm text-muted">
          Question {index + 1} of {pool.length} · Proctored mastery gate
        </p>
        <div className="mt-3 h-1.5 rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${((index + 1) / pool.length) * 100}%` }}
          />
        </div>
      </header>

      <div className="glass-panel p-6">
        <h2 className="text-lg font-medium">{q.q}</h2>
        <div className="mt-6 space-y-3">
          {q.options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = i === q.correct;
            return (
              <button
                key={i}
                type="button"
                disabled={selected !== null}
                onClick={() => answer(i)}
                className={cn(
                  "w-full text-left rounded-lg border px-4 py-3 text-sm transition-all",
                  selected === null && "hover:border-accent/50 hover:bg-surface-2",
                  isSelected && isCorrect && "border-success bg-success/10",
                  isSelected && !isCorrect && "border-danger bg-danger/10",
                  selected !== null && !isSelected && isCorrect && "border-success/50"
                )}
              >
                <span className="flex items-center gap-2">
                  {selected !== null && isCorrect && <Check className="h-4 w-4 text-success" />}
                  {isSelected && !isCorrect && <X className="h-4 w-4 text-danger" />}
                  {opt}
                </span>
              </button>
            );
          })}
        </div>

        {showExplain && (
          <div className="mt-6 rounded-lg bg-surface-2 p-4 text-sm">
            <p>{q.explain}</p>
            <button type="button" className="btn btn-primary mt-4 text-sm" onClick={next}>
              {index < pool.length - 1 ? "Next question →" : "View results"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
