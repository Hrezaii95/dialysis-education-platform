"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SKILL_TREE } from "@/lib/skills";
import { usePlatformStore } from "@/lib/store";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";
import { Check, Lock, Play } from "lucide-react";

function skillStatus(
  id: string,
  skills: Record<string, { level: string }>
): "locked" | "available" | "in_progress" | "mastered" {
  const node = SKILL_TREE.find((s) => s.id === id);
  if (!node) return "locked";
  const stored = skills[id]?.level;
  if (stored === "mastered") return "mastered";
  if (stored === "in_progress") return "in_progress";
  const prereqsMet = node.prerequisites.every(
    (p) => skills[p]?.level === "mastered"
  );
  if (node.prerequisites.length === 0 || prereqsMet) return "available";
  return "locked";
}

export function SkillTree() {
  const mounted = useMounted();
  const skills = usePlatformStore((s) => s.skills);
  const displaySkills = mounted ? skills : {};

  return (
    <div id="skills" className="glass-panel p-6">
      <h2 className="text-lg font-semibold tracking-tight">HDF Competency Tree</h2>
      <p className="mt-1 text-sm text-muted">
        Khan-style mastery path — unlock modules as you demonstrate competence
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {SKILL_TREE.map((node, i) => {
          const status = skillStatus(node.id, displaySkills);
          return (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={status === "locked" ? "#" : node.href}
                className={cn(
                  "group flex items-start gap-3 rounded-xl border p-4 transition-all",
                  status === "locked"
                    ? "cursor-not-allowed border-white/5 opacity-50"
                    : "border-white/8 hover:border-accent/40 hover:bg-surface-2/50"
                )}
                onClick={(e) => status === "locked" && e.preventDefault()}
              >
                <span className="text-2xl">{node.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{node.title}</span>
                    {status === "mastered" && (
                      <Check className="h-4 w-4 text-success shrink-0" />
                    )}
                    {status === "locked" && (
                      <Lock className="h-3.5 w-3.5 text-muted shrink-0" />
                    )}
                    {status === "available" && (
                      <Play className="h-3.5 w-3.5 text-accent shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted line-clamp-2">{node.description}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
