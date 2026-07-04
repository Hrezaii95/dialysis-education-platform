"use client";

import { useMemo } from "react";
import { getStatements } from "@/lib/xapi";
import { SKILL_TREE } from "@/lib/skills";
import { usePlatformStore } from "@/lib/store";
import { useMounted } from "@/lib/use-mounted";

export function MasteryHeatmap() {
  const mounted = useMounted();
  const skills = usePlatformStore((s) => s.skills);
  const caseDecisions = usePlatformStore((s) => s.caseDecisions);

  const stats = useMemo(() => {
    const stmts = mounted ? getStatements() : [];
    const skillMap = mounted ? skills : {};
    const decisions = mounted ? caseDecisions : [];
    const mastered = SKILL_TREE.filter((n) => skillMap[n.id]?.level === "mastered").length;
    const interactions = stmts.filter((s) => s.verb === "interacted").length;
    const completed = stmts.filter((s) => s.verb === "completed").length;
    return { mastered, total: SKILL_TREE.length, interactions, completed, decisions: decisions.length };
  }, [mounted, skills, caseDecisions]);

  const pct = Math.round((stats.mastered / stats.total) * 100);

  return (
    <div className="glass-panel p-6">
      <h2 className="text-lg font-semibold tracking-tight">Learning Analytics</h2>
      <p className="mt-1 text-sm text-muted">xAPI-captured progress — educational model only</p>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Mastery", value: `${pct}%`, sub: `${stats.mastered}/${stats.total} skills` },
          { label: "Interactions", value: stats.interactions, sub: "sim manipulations" },
          { label: "Completed", value: stats.completed, sub: "modules finished" },
          { label: "Decisions", value: stats.decisions, sub: "case branches" },
        ].map((item) => (
          <div key={item.label} className="rounded-lg bg-surface-2/80 p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted">{item.label}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{item.value}</div>
            <div className="text-xs text-muted">{item.sub}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-teal transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
