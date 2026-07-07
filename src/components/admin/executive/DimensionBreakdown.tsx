"use client";

import { useMemo } from "react";
import { useLang } from "@/components/providers/LanguageProvider";
import type { Trainee } from "@/lib/analytics/trainee-schema";
import {
  byLocation,
  byProfession,
  byWorkplace,
  byAgeBand,
  byGender,
  byExperience,
  retentionDistribution,
  type CountRow,
} from "@/lib/analytics/aggregations";

interface Props {
  cohort: Trainee[];
}

function Bars({ rows, arguedKey }: { rows: CountRow<string>[]; arguedKey?: string }) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className="space-y-2.5">
      {rows.map((r) => {
        const pct = (r.count / max) * 100;
        const argued = r.key === arguedKey;
        return (
          <div key={r.key} className="grid grid-cols-[120px_1fr_42px] items-center gap-2.5">
            <span className="text-[11.5px] text-text/90 truncate">{r.label}</span>
            <div className="h-2.5 rounded-full bg-surface-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-flow"
                style={{ width: `${pct}%`, background: argued ? "var(--navy-700, #10306B)" : undefined }}
              />
            </div>
            <span className="text-xs font-bold text-text text-right tabular-nums">{r.count}</span>
          </div>
        );
      })}
    </div>
  );
}

export function DimensionBreakdown({ cohort }: Props) {
  const { t } = useLang();
  const loc = useMemo(() => byLocation(cohort), [cohort]);
  const prof = useMemo(() => byProfession(cohort), [cohort]);
  const work = useMemo(() => byWorkplace(cohort), [cohort]);
  const age = useMemo(() => byAgeBand(cohort), [cohort]);
  const exp = useMemo(() => byExperience(cohort), [cohort]);
  const gender = useMemo(() => byGender(cohort), [cohort]);

  // Icon array for gender: 32 cells, lime for female, flow for male, muted for undisclosed.
  const female = gender.find((g) => g.key === "female")?.count ?? 0;
  const male = gender.find((g) => g.key === "male")?.count ?? 0;
  const undisclosed = gender.find((g) => g.key === "undisclosed")?.count ?? 0;
  const total = female + male + undisclosed;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass-panel p-5">
          <h3 className="font-semibold mb-3">{t("admin.byLocation", "By location — trainees per province")}</h3>
          <Bars rows={loc} arguedKey={loc[0]?.key} />
        </section>
        <section className="glass-panel p-5">
          <h3 className="font-semibold mb-3">{t("admin.byProfession", "By profession")}</h3>
          <Bars rows={prof} arguedKey={prof[0]?.key} />
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="glass-panel p-5">
          <h3 className="font-semibold mb-3">{t("admin.byWorkplace", "By workplace")}</h3>
          <Bars rows={work} arguedKey={work[0]?.key} />
        </section>
        <section className="glass-panel p-5">
          <h3 className="font-semibold mb-3">{t("admin.byAgeBand", "By age band")}</h3>
          <Bars rows={age} arguedKey={age[1]?.key} />
        </section>
        <section className="glass-panel p-5">
          <h3 className="font-semibold mb-3">{t("admin.byExperience", "By field experience")}</h3>
          <Bars rows={exp} arguedKey={exp[1]?.key} />
        </section>
      </div>

      <section className="glass-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="font-semibold">{t("admin.byGender", "By gender")}</h3>
          <span className="text-[10px] uppercase tracking-wide text-muted">n={total}</span>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <div className="grid grid-cols-10 gap-1" style={{ maxWidth: 280 }}>
            {Array.from({ length: total }).map((_, i) => {
              let bg: string | undefined;
              if (i < female) bg = "var(--lime-500, #6CCB3E)";
              else if (i < female + male) bg = undefined; // bg-flow class applies
              return (
                <div
                  key={i}
                  className={`aspect-square rounded-[3px] ${i < female ? "" : i < female + male ? "bg-flow" : "bg-surface-2"}`}
                  style={bg ? { background: bg } : undefined}
                />
              );
            })}
          </div>
          <div className="text-[11px] text-muted space-y-1">
            <div><b className="text-text tabular-nums">{female}</b> {t("admin.female", "female")} ({Math.round((female / total) * 100)}%)</div>
            <div><b className="text-text tabular-nums">{male}</b> {t("admin.male", "male")} ({Math.round((male / total) * 100)}%)</div>
            <div><b className="text-text tabular-nums">{undisclosed}</b> {t("admin.undisclosed", "undisclosed")} ({Math.round((undisclosed / total) * 100)}%)</div>
          </div>
        </div>
      </section>
    </div>
  );
}
