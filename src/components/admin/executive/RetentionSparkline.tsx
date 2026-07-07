"use client";

import { useMemo } from "react";
import { useLang } from "@/components/providers/LanguageProvider";
import type { Trainee } from "@/lib/analytics/trainee-schema";
import { retentionDistribution } from "@/lib/analytics/aggregations";

interface Props {
  cohort: Trainee[];
}

export function RetentionSparkline({ cohort }: Props) {
  const { t } = useLang();
  const buckets = useMemo(() => retentionDistribution(cohort), [cohort]);
  const max = Math.max(...buckets.map((b) => b.count), 1);
  const peakIdx = buckets.reduce((best, b, i) => (b.count > buckets[best].count ? i : best), 0);

  // SVG sparkline: 5 buckets mapped across 280px width, 64px height.
  const W = 280, H = 64, pad = 16;
  const step = (W - pad * 2) / (buckets.length - 1);
  const pts = buckets.map((b, i) => {
    const x = pad + i * step;
    const y = H - 12 - (b.count / max) * (H - 24);
    return { x, y, b };
  });
  const polyPoints = pts.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <section className="glass-panel p-5">
      <h3 className="font-semibold mb-3">
        {t("admin.retentionSparkline", "Retention — Daily-5 streak distribution")}
      </h3>
      <svg className="w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        <line stroke="rgba(255,255,255,0.08)" strokeWidth="1" x1="0" y1="16" x2={W} y2="16" />
        <line stroke="rgba(255,255,255,0.08)" strokeWidth="1" x1="0" y1="32" x2={W} y2="32" />
        <line stroke="rgba(255,255,255,0.08)" strokeWidth="1" x1="0" y1="48" x2={W} y2="48" />
        <polyline
          fill="none"
          stroke="var(--flow, #9BC0F2)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polyPoints}
        />
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === peakIdx ? 4 : 3}
            fill={i === peakIdx ? "var(--lime-500, #6CCB3E)" : "var(--flow, #9BC0F2)"}
          />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-muted tabular-nums mt-1">
        {buckets.map((b) => (
          <span key={b.label}>{b.label}</span>
        ))}
      </div>
      <p className="mt-2.5 text-[11px] text-muted">
        {t("admin.retentionPeak", "Peak at")} {buckets[peakIdx].label} ({buckets[peakIdx].count}{" "}
        {t("admin.trainees", "trainees")}) — {t("admin.onTrackBand", "on-track retention band.")}
      </p>
    </section>
  );
}
