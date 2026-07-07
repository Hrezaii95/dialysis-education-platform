"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Microscope,
  Activity,
  Cpu,
  Droplets,
  HeartPulse,
  LineChart,
  Lock,
  Check,
  ArrowRight,
  Compass,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlatformStore } from "@/lib/store";
import { useMounted } from "@/lib/use-mounted";
import { useLang } from "@/components/providers/LanguageProvider";
import {
  COMPETENCIES,
  AUDIENCES,
  KNOWLEDGE_LABEL,
  competencyLevel,
  isUnlocked,
  nextCompetency,
  type Audience,
  type Competency,
  type KnowledgeType,
} from "@/lib/competencies";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Microscope,
  Activity,
  Cpu,
  Droplets,
  HeartPulse,
  LineChart,
};

const KT_BG: Record<KnowledgeType, string> = {
  declarative: "bg-accent",
  procedural: "bg-teal",
  conditional: "bg-gold",
};

const STATE_KEYS = [
  "myPath.state.notStarted",
  "myPath.state.started",
  "myPath.state.competent",
  "myPath.state.proficient",
  "myPath.state.mastered",
] as const;
const STATE_FALLBACK = ["Not started", "Started", "Competent", "Proficient", "Mastered"] as const;

const ROLE_LS_KEY = "raouf.role";

export default function MyPathPage() {
  const mounted = useMounted();
  const { t } = useLang();
  const skillsRaw = usePlatformStore((s) => s.skills);
  const skills = mounted ? skillsRaw : {};

  // Role: initialise from store → localStorage fallback → "nurse"
  const storedRole = usePlatformStore((s) => s.role);
  const { setRole, placement } = usePlatformStore();

  const [audience, setAudience] = useState<Audience>("nurse");

  // Hydrate audience from persisted role once mounted
  useEffect(() => {
    if (!mounted) return;
    if (storedRole) {
      setAudience(storedRole);
      return;
    }
    try {
      const ls = localStorage.getItem(ROLE_LS_KEY) as Audience | null;
      if (ls && ["new", "nurse", "charge", "nephrologist", "biomed"].includes(ls)) {
        setAudience(ls);
        setRole(ls); // back-fill into store
      }
    } catch {
      // localStorage unavailable — stay with default
    }
  }, [mounted, storedRole, setRole]);

  function handleAudienceChange(a: Audience) {
    setAudience(a);
    setRole(a);
    try {
      localStorage.setItem(ROLE_LS_KEY, a);
    } catch {
      // ignore
    }
  }

  const placementDone = mounted ? placement.completed : false;

  const next = nextCompetency(skills, audience);
  const masteredCount = COMPETENCIES.filter((c) => competencyLevel(c, skills) >= 4).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted">
            <Compass className="h-4 w-4 text-accent" /> {t("myPath.eyebrow", "My Path")}
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("myPath.title", "Your competency journey")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            {t("myPath.subtitle", "Six competencies, gated by doing — not reading. You advance by demonstrating, and the depth dials to your role.")}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-md bg-surface-2 px-2 py-1 text-muted">{t("myPath.programScope", "~23-hour program")}</span>
            <span className="rounded-md bg-teal/15 px-2 py-1 text-teal">{t("myPath.c1Built", "C1 fully built · ~5 h")}</span>
            <span className="rounded-md bg-surface-2 px-2 py-1 text-muted">{t("myPath.restStructured", "C2–C6 structured")}</span>
          </div>
        </div>
        {/* Role / depth-dial selector */}
        <div className="shrink-0 space-y-2">
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wider text-muted">{t("myPath.tuneDepth", "Tune depth to your role")}</div>
            <div className="flex flex-wrap gap-1">
              {AUDIENCES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => handleAudienceChange(a.id)}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                    audience === a.id
                      ? "bg-accent/20 text-white"
                      : "bg-surface-2 text-muted hover:text-text"
                  )}
                >
                  {t(`audience.${a.id}`, a.label)}
                </button>
              ))}
            </div>
          </div>

          {/* Placement CTA */}
          {placementDone ? (
            <div className="flex items-center gap-1.5 text-[10px] text-muted">
              <MapPin className="h-3 w-3 text-teal" />
              {t("myPath.placement.done", "Placement done — starting points set")}
            </div>
          ) : (
            <Link
              href="/placement"
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
            >
              <Compass className="h-3.5 w-3.5" />
              {t("myPath.placement.cta", "Take the 4-min placement → start at your level")}
            </Link>
          )}
        </div>
      </header>

      {/* Continue hero */}
      {next && (
        <Link href={next.href} className="block">
          <motion.div
            whileHover={{ y: -2 }}
            className="glass-panel flex items-center justify-between gap-4 border border-accent/30 p-5"
          >
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-accent">{t("myPath.continueLabel", "Continue where you left off")}</div>
              <div className="mt-1 truncate text-lg font-semibold">
                {next.code} · {t(`comp.${next.id}.title`, next.title)}
              </div>
              <div className="mt-0.5 truncate text-sm text-muted">
                {t("myPath.nextGate", "Next gate")}: {t(`comp.${next.id}.gate`, next.gate)}
              </div>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white">
              {t("common.resume", "Resume")} <ArrowRight className="h-4 w-4" />
            </span>
          </motion.div>
        </Link>
      )}

      {/* The C1-C6 spine */}
      <div className="space-y-3">
        {COMPETENCIES.map((c, i) => (
          <CompetencyRow key={c.id} c={c} skills={skills} audience={audience} index={i} />
        ))}
      </div>

      {/* Mastery ladder */}
      <section className="glass-panel p-5">
        <h2 className="text-sm font-semibold">{t("myPath.canDoTitle", "What you can now do")}</h2>
        <p className="mt-0.5 text-xs text-muted">{t("myPath.canDoSubtitle", "Mastery = demonstrated + retained, not pages viewed.")}</p>
        <div className="mt-3 space-y-2">
          {COMPETENCIES.filter((c) => competencyLevel(c, skills) >= 2).length === 0 && (
            <p className="text-sm text-muted">
              {t("myPath.canDoEmpty", "Nothing demonstrated yet — start with the first competency above.")}
            </p>
          )}
          {COMPETENCIES.map((c) => {
            const lv = competencyLevel(c, skills);
            if (lv < 2) return null;
            const rung = c.levels[Math.min(lv, 4) - 1];
            return (
              <div key={c.id} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                <span>
                  <span className="font-medium">{c.code}</span> — {rung.can}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 text-xs text-muted">
          {masteredCount}/{COMPETENCIES.length} {t("myPath.mastered", "competencies mastered")} ·{" "}
          <Link href="/assessment" className="text-accent hover:underline">
            {t("nav.assess", "Assess & Certify")} →
          </Link>
        </div>
      </section>
    </div>
  );
}

function CompetencyRow({
  c,
  skills,
  audience,
  index,
}: {
  c: Competency;
  skills: Record<string, import("@/lib/store").SkillProgress>;
  audience: Audience;
  index: number;
}) {
  const Icon = ICONS[c.icon] ?? Microscope;
  const { t } = useLang();
  const lv = competencyLevel(c, skills);
  const target = c.audienceTarget[audience];
  const unlocked = isUnlocked(c, skills);
  const targetRung = target >= 1 ? c.levels[target - 1] : null;
  const pct = Math.round((Math.min(lv, target || 4) / (target || 4)) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
    >
      <Link href={`/learn/${c.id}`} className="group block">
        <div
          className={cn(
            "glass-panel relative flex flex-col gap-3 p-4 transition-colors sm:flex-row sm:items-center sm:gap-5",
            !unlocked && "opacity-70"
          )}
        >
          {/* Icon + code */}
          <div className="flex items-center gap-3 sm:w-48 sm:shrink-0">
            <div
              className={cn(
                "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
                lv >= 4 ? "bg-teal/20 text-teal" : "bg-surface-2 text-accent"
              )}
            >
              {lv >= 4 ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                {c.code}
                {!unlocked && <Lock className="h-3 w-3" />}
              </div>
              <div className="truncate font-medium leading-tight">{t(`comp.${c.id}.title`, c.title)}</div>
            </div>
          </div>

          {/* Middle: blurb + knowledge mix + gate */}
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted">{t(`comp.${c.id}.blurb`, c.blurb)}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              {/* knowledge-type mix */}
              <div className="flex h-1.5 w-28 overflow-hidden rounded-full bg-surface-2">
                {(Object.keys(c.knowledge) as KnowledgeType[]).map((kt) => (
                  <div
                    key={kt}
                    className={KT_BG[kt]}
                    style={{ width: `${c.knowledge[kt]}%` }}
                    title={`${KNOWLEDGE_LABEL[kt]} ${c.knowledge[kt]}%`}
                  />
                ))}
              </div>
              <span className="text-[11px] text-muted">
                {KNOWLEDGE_LABEL[c.primaryType]}-led
              </span>
              {c.demoBuild !== "real" && (
                <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                  {t(
                    c.demoBuild === "panel" ? "myPath.badge.panel" : "myPath.badge.preview",
                    c.demoBuild === "panel" ? "panel" : "preview"
                  )}
                </span>
              )}
            </div>
            <div className="mt-1.5 text-[11px] text-muted">
              <span className="text-text/70">{t("myPath.gate", "Gate")}:</span> {t(`comp.${c.id}.gate`, c.gate)}
            </div>
          </div>

          {/* Right: level vs target */}
          <div className="sm:w-44 sm:shrink-0">
            <div className="flex items-center justify-between text-[11px] text-muted">
              <span>{t(STATE_KEYS[lv], STATE_FALLBACK[lv])}</span>
              <span className="tabular-nums">
                L{lv}/{target}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-teal transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            {targetRung && (
              <div className="mt-1 line-clamp-2 text-[10px] text-muted">
                {t("myPath.target", "Target")} (L{target}): {targetRung.can}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
