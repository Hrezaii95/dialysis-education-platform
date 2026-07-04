"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { COMPETENCIES } from "@/lib/competencies";
import { getCourse, flatten, courseMinutes } from "@/lib/c1-course";
import { useLang } from "@/components/providers/LanguageProvider";
import {
  ArrowRight,
  ArrowDown,
  ChevronLeft,
  LineChart,
  GraduationCap,
  BookText,
  Image as ImageIcon,
  PlayCircle,
  RotateCcw,
  Target,
  FileText,
  FlaskConical,
} from "lucide-react";

function surfaceLabel(href: string): string {
  if (href.startsWith("/devices")) return "Device Lab";
  if (href.startsWith("/simulator")) return "Clinical Simulator";
  if (href.startsWith("/convince")) return "Evidence & Outcomes";
  if (href.startsWith("/flipbook")) return "Flipbook";
  return "Practice";
}

const C3_FLOW = ["Explore", "Prime", "Prescribe ≥23 L", "Alarms", "Sign-off"];

function Stage({
  n,
  title,
  badge,
  children,
  last,
}: {
  n: number;
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div>
      <section className="glass-panel p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2.5 text-sm font-semibold">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/20 text-xs font-semibold text-accent">
              {n}
            </span>
            {title}
          </h2>
          {badge}
        </div>
        <div className="mt-3">{children}</div>
      </section>
      {!last && (
        <div className="flex justify-center py-1.5 text-muted">
          <ArrowDown className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

export default function CompetencyDetailClient() {
  const params = useParams();
  const id = String(params.id);
  const simHref =
    id === "c3" ? "/devices" : id === "c5" ? "/simulator?tab=cases" : id === "c4" ? "/simulator?tab=circuit" : "/simulator";
  const c = COMPETENCIES.find((x) => x.id === id);
  const { t } = useLang();
  const course = getCourse(id);

  if (!c) {
    return (
      <div className="text-muted">
        Competency not found.{" "}
        <Link href="/my-path" className="text-accent hover:underline">
          Back to My Path
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <Link href="/my-path" className="flex items-center gap-1 text-xs text-muted hover:text-text">
        <ChevronLeft className="h-3.5 w-3.5" /> {t("nav.myPath", "My Path")}
      </Link>

      <header>
        <div className="text-xs font-semibold text-muted">{c.code}</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{t(`comp.${c.id}.title`, c.title)}</h1>
        <p className="mt-1 text-sm text-muted">{t(`comp.${c.id}.blurb`, c.blurb)}</p>
        <div className="mt-2 inline-flex items-center gap-2 rounded-md bg-surface-2 px-2.5 py-1 text-[11px] text-muted">
          {t("learn.journeyLabel", "Your journey")}: {t("learn.journeySteps", "learn → practice → prove")}
        </div>
      </header>

      {/* ① CURRICULUM */}
      <Stage
        n={1}
        title={t("learn.stageCurriculum", "Curriculum — the academy")}
        badge={
          course ? (
            <span className="rounded-full bg-teal/20 px-2.5 py-0.5 text-[10px] font-medium text-teal">
              {t("learn.builtForDemo", "Built for demo")}
            </span>
          ) : (
            <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[10px] font-medium text-muted">
              {t("learn.preview", "Preview")}
            </span>
          )
        }
      >
        {course ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              {t(
                "learn.curriculumDesc",
                "A full multi-module course — every format the AREP academy published, re-authored into one organized path that ends in a prediction you have to get right, then interactive sims."
              )}
            </p>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-muted"><BookText className="h-3.5 w-3.5 text-accent" /> Reading + slides</span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-muted"><ImageIcon className="h-3.5 w-3.5 text-accent" /> AREP infographics</span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-muted"><PlayCircle className="h-3.5 w-3.5 text-accent" /> Webinar + audio</span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-muted"><FileText className="h-3.5 w-3.5 text-accent" /> Handbook PDF</span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-muted"><FlaskConical className="h-3.5 w-3.5 text-accent" /> Interactive sims</span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-muted"><RotateCcw className="h-3.5 w-3.5 text-accent" /> Quizzes + Daily-5</span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-muted"><Target className="h-3.5 w-3.5 text-gold" /> Mastery gate</span>
            </div>
            <Link
              href={`/course/${id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent/5 p-3.5 transition-colors hover:border-accent/60"
            >
              <div>
                <div className="text-sm font-medium">{t("learn.startCourse", "Start the course")}</div>
                <div className="mt-0.5 text-[11px] text-muted">
                  {flatten(course).length} {t("learn.lessons", "lessons")} · {course.modules.length} {t("learn.modules", "modules")} · ~{Math.round((courseMinutes(course) / 60) * 10) / 10} {t("learn.hours", "h")}
                </div>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white">
                {t("learn.start", "Start")} <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <p className="text-[11px] text-muted">
              {t(
                "learn.attribution",
                "Resources are AREP/Fresenius educational materials, re-authored into the learning path. Authorization-ready; not rehosted as ours without permission."
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted">
              {t("learn.comingSoon", "Curriculum resources for this competency are in the production build.")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {c.activities.map((a) => (
                <span key={a} className="rounded-md bg-surface-2 px-2 py-1 text-[11px] text-muted">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}
      </Stage>

      {/* ② SIMULATE / PRACTICE */}
      <Stage n={2} title={t("learn.stageSimulate", "Simulate — practice what you learned")}>
        {id === "c3" && (
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            {C3_FLOW.map((s, i) => (
              <span key={s} className="flex items-center gap-1.5">
                <span
                  className={`rounded-md px-2 py-1 text-[11px] ${
                    i === C3_FLOW.length - 1 ? "bg-accent/20 text-accent" : "bg-surface-2 text-muted"
                  }`}
                >
                  {i + 1}. {s}
                </span>
                {i < C3_FLOW.length - 1 && <ArrowRight className="h-3 w-3 text-muted" />}
              </span>
            ))}
          </div>
        )}
        <Link
          href={simHref}
          className="flex items-center justify-between gap-3 rounded-xl border border-accent/30 p-3.5 transition-colors hover:border-accent/60"
        >
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-accent">{surfaceLabel(simHref)}</div>
            <div className="mt-0.5 truncate text-sm font-medium">
              {t("learn.practiceDesc", "Do the activity → demonstrate the gate")}
            </div>
            <div className="mt-1 text-[11px] text-muted">
              <span className="text-text/70">{t("myPath.gate", "Gate")}:</span> {t(`comp.${c.id}.gate`, c.gate)}
            </div>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white">
            {t("learn.practice", "Practice")} <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </Stage>

      {/* ③ EVIDENCE & OUTCOMES */}
      <Stage n={3} title={t("evidence.eyebrow", "Evidence & Outcomes")}>
        <Link
          href="/convince"
          className="flex items-center justify-between gap-3 rounded-xl border border-white/8 p-3.5 transition-colors hover:border-accent/40"
        >
          <div className="flex items-center gap-3">
            <LineChart className="h-5 w-5 text-gold" />
            <div className="text-sm">
              {t("learn.evidenceDesc", "Why high-volume HDF — the honest trial arc, null and positive.")}
            </div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted" />
        </Link>
      </Stage>

      {/* ④ ASSESS & CERTIFY */}
      <Stage n={4} last title={t("nav.assess", "Assess & Certify")}>
        <Link
          href="/assessment"
          className="flex items-center justify-between gap-3 rounded-xl border border-white/8 p-3.5 transition-colors hover:border-accent/40"
        >
          <div className="flex items-center gap-3">
            <GraduationCap className="h-5 w-5 text-accent" />
            <div className="text-sm">
              {t("learn.assessDesc", "Demonstrate the gate → earn the credential. Mastery is demonstrated, not pages viewed.")}
            </div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted" />
        </Link>
      </Stage>
    </div>
  );
}
