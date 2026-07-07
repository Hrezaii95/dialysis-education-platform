"use client";

import { useMemo } from "react";
import { useLang } from "@/components/providers/LanguageProvider";
import type { Trainee } from "@/lib/analytics/trainee-schema";
import { alarmLatencyDistribution } from "@/lib/analytics/aggregations";

interface Props {
  cohort: Trainee[];
}

export function AlarmLatencyArc({ cohort }: Props) {
  const { t } = useLang();
  const buckets = useMemo(() => alarmLatencyDistribution(cohort), [cohort]);
  const max = Math.max(...buckets.map((b) => b.count), 1);

  // Hero median across trainees with trials.
  const withTrials = cohort.filter((c) => c.alarm.trials > 0);
  const medianMs = useMemo(() => {
    if (withTrials.length === 0) return 0;
    const xs = withTrials.map((c) => c.alarm.medianLatencyMs).sort((a, b) => a - b);
    const mid = Math.floor(xs.length / 2);
    return xs.length % 2 === 0 ? Math.round((xs[mid - 1] + xs[mid]) / 2) : xs[mid];
  }, [withTrials]);
  const medianS = medianMs / 1000;
  const arcPct = Math.min(medianS / 10, 1); // 0-10s scale
  const circumference = 2 * Math.PI * 50;
  const arcLen = arcPct * circumference;

  return (
    <section className="glass-panel p-5">
      <h3 className="font-semibold mb-3">
        {t("admin.alarmLatency", "Alarm response — median latency")}
      </h3>
      <div className="flex gap-4 items-stretch flex-wrap">
        <div className="flex-none w-[180px]">
          <svg viewBox="0 0 120 120" aria-hidden="true" className="w-full">
            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="var(--flow, #9BC0F2)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${arcLen} ${circumference}`}
              transform="rotate(-90 60 60)"
            />
            <text
              x="60"
              y="58"
              textAnchor="middle"
              fill="var(--color-text, #EAF0F8)"
              fontSize="22"
              fontWeight="700"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {medianS.toFixed(1)}s
            </text>
            <text x="60" y="76" textAnchor="middle" fill="var(--color-muted, #9FB0C8)" fontSize="9">
              {t("admin.medianScale", "median · 0–10s scale")}
            </text>
          </svg>
        </div>
        <div className="flex-1 min-w-[180px] space-y-2">
          {buckets.map((b) => {
            const isTarget = b.label === "<3s" || b.label === "3-4s";
            const argued = b.label === "4-5s";
            const fillStyle: React.CSSProperties =
              isTarget ? { background: "var(--lime-500, #6CCB3E)" } :
              argued ? { background: "var(--navy-700, #10306B)" } : {};
            return (
              <div key={b.label} className="grid grid-cols-[48px_1fr_36px] items-center gap-2 text-[11px]">
                <span className="text-muted tabular-nums">{b.label}</span>
                <div className="h-2.5 rounded-full bg-surface-2 overflow-hidden">
                  <div className="h-full rounded-full bg-flow" style={{ width: `${(b.count / max) * 100}%`, ...fillStyle }} />
                </div>
                <span className="text-text font-bold text-right tabular-nums">{b.count}</span>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-2.5 text-[11px] text-muted">
        {t("admin.lowerIsBetter", "Lower is better.")}{" "}
        {buckets.slice(0, 2).reduce((a, b) => a + b.count, 0)} {t("admin.underTarget", "under 4s — target band.")}
      </p>
    </section>
  );
}
