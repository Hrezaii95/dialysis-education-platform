"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  getCourse,
  flatten,
  courseMinutes,
  type FlatLesson,
  type LessonType,
  type Lesson,
} from "@/lib/c1-course";
import { CourseSim } from "@/components/course/CourseSims";
import { usePlatformStore } from "@/lib/store";
import { emitStatement } from "@/lib/xapi";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Target,
  BookText,
  Image as ImageIcon,
  Presentation,
  PlayCircle,
  Headphones,
  FileText,
  MousePointerClick,
  HelpCircle,
  Layers,
  FlaskConical,
  PanelLeftClose,
  PanelLeftOpen,
  List,
  Download,
} from "lucide-react";

const TYPE_META: Record<LessonType, { label: string; Icon: React.ComponentType<{ className?: string }> }> = {
  reading: { label: "Reading", Icon: BookText },
  infographic: { label: "Infographic", Icon: ImageIcon },
  slides: { label: "Slides", Icon: Presentation },
  video: { label: "Video", Icon: PlayCircle },
  audio: { label: "Audio", Icon: Headphones },
  pdf: { label: "Document", Icon: FileText },
  interactive: { label: "Interactive", Icon: MousePointerClick },
  quiz: { label: "Quiz", Icon: HelpCircle },
  flashcards: { label: "Daily-5", Icon: Layers },
  gate: { label: "Demonstrate", Icon: Target },
  sim: { label: "Simulation", Icon: FlaskConical },
};

export default function CoursePageClient() {
  const params = useParams();
  const id = String(params.id);
  const course = getCourse(id);
  const setSkill = usePlatformStore((s) => s.setSkill);

  const lessons = useMemo(() => (course ? flatten(course) : []), [course]);
  const totalMin = useMemo(() => (course ? courseMinutes(course) : 0), [course]);
  const total = lessons.length;

  const [idx, setIdx] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [gateOk, setGateOk] = useState(false);

  if (!course) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <Link href={`/learn/${id}`} className="flex items-center gap-1 text-xs text-muted hover:text-text">
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <div className="glass-panel p-6 text-center">
          <h1 className="text-lg font-semibold">Course in the production build</h1>
          <p className="mt-2 text-sm text-muted">This competency&apos;s full curriculum is authored in the production build. C1 is the worked example in the demo.</p>
          <Link href="/learn/c1" className="btn btn-primary mt-4 inline-flex">Open the C1 course <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    );
  }

  const cur = lessons[idx];
  const isGate = cur.type === "gate";
  const canAdvance = !isGate || gateOk;
  const pct = Math.round(((maxReached + 1) / total) * 100);

  const goTo = (n: number) => {
    const clamped = Math.max(0, Math.min(total - 1, n));
    setIdx(clamped);
    setMaxReached((m) => Math.max(m, clamped));
    setDrawer(false);
  };

  const onGate = () => {
    setGateOk(true);
    setSkill("c1", "mastered", 100);
    setSkill("foundation", "mastered", 100);
    emitStatement("mastered", "c1-understand-therapy", "C1 — predicted the convection→clearance response", { score: 100, success: true });
  };

  const toc = (
    <TocList lessons={lessons} idx={idx} maxReached={maxReached} onPick={goTo} />
  );

  return (
    <div className="space-y-3">
      {/* top bar */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => (window.innerWidth >= 1024 ? setCollapsed((c) => !c) : setDrawer(true))} className="btn btn-ghost p-2" aria-label="Toggle outline">
          <List className="h-4 w-4" />
        </button>
        <Link href={`/learn/${id}`} className="flex items-center gap-1 text-xs text-muted hover:text-text">
          <ChevronLeft className="h-3.5 w-3.5" /> {course.code}
        </Link>
        <div className="ml-auto text-[11px] tabular-nums text-muted">
          Lesson {idx + 1}/{total} · ~{Math.round(totalMin / 60 * 10) / 10} h
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-gradient-to-r from-accent to-teal transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>

      <div className="flex gap-4">
        {/* desktop outline */}
        {collapsed ? (
          <aside className="hidden lg:block">
            <button type="button" onClick={() => setCollapsed(false)} className="btn btn-ghost p-2" aria-label="Expand outline">
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </aside>
        ) : (
          <aside className="hidden w-72 shrink-0 lg:block">
            <div className="glass-panel sticky top-20 max-h-[80vh] overflow-y-auto p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-semibold">Course outline</div>
                <button type="button" onClick={() => setCollapsed(true)} className="text-muted hover:text-text" aria-label="Collapse outline">
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </div>
              {toc}
            </div>
          </aside>
        )}

        {/* content */}
        <div className="min-w-0 flex-1">
          <div className="glass-panel min-h-[60dvh] p-4 sm:p-6">
            <div className="mx-auto max-w-2xl">
              <LessonHeader lesson={cur} />
              <LessonBody key={cur.id} lesson={cur} gateOk={gateOk} onGate={onGate} />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button type="button" onClick={() => goTo(idx - 1)} disabled={idx === 0} className="btn btn-ghost flex-1 justify-center py-3 disabled:opacity-40">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            {idx < total - 1 ? (
              <button type="button" onClick={() => goTo(idx + 1)} disabled={!canAdvance} className="btn btn-primary flex-[1.4] justify-center py-3 disabled:opacity-40">
                {isGate && !gateOk ? "Answer to continue" : "Next"} <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <Link href="/simulator" className="btn btn-primary flex-[1.4] justify-center py-3">
                Continue to practice <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawer(false)} aria-hidden />
          <div className="absolute left-0 top-0 h-full w-[82%] max-w-xs overflow-y-auto border-r border-white/10 bg-surface-1 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold">Course outline</div>
              <button type="button" onClick={() => setDrawer(false)} className="text-muted" aria-label="Close outline"><X className="h-5 w-5" /></button>
            </div>
            {toc}
          </div>
        </div>
      )}
    </div>
  );
}

function TocList({ lessons, idx, maxReached, onPick }: { lessons: FlatLesson[]; idx: number; maxReached: number; onPick: (n: number) => void }) {
  const groups: { id: string; title: string; items: FlatLesson[] }[] = [];
  lessons.forEach((l) => {
    const g = groups.find((x) => x.id === l.moduleId);
    if (g) g.items.push(l);
    else groups.push({ id: l.moduleId, title: l.moduleTitle, items: [l] });
  });
  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <div key={g.id}>
          <div className="px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">{g.title}</div>
          <div className="space-y-0.5">
            {g.items.map((l) => {
              const { Icon } = TYPE_META[l.type];
              const active = l.index === idx;
              const visited = l.index <= maxReached;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => onPick(l.index)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${active ? "bg-accent/20 text-white" : "text-muted hover:bg-surface-2"}`}
                >
                  <span className="grid h-4 w-4 shrink-0 place-items-center">
                    {visited && !active ? <Check className="h-3.5 w-3.5 text-teal" /> : <Icon className="h-3.5 w-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{l.title}</span>
                  <span className="shrink-0 tabular-nums text-[10px] text-muted">{l.minutes}m</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function LessonHeader({ lesson }: { lesson: Lesson }) {
  const { label, Icon } = TYPE_META[lesson.type];
  return (
    <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-accent">
      <Icon className="h-4 w-4" /> {label} · {lesson.minutes} min
    </div>
  );
}

function LessonBody({ lesson, gateOk, onGate }: { lesson: Lesson; gateOk: boolean; onGate: () => void }) {
  const l = lesson;

  const Takeaway = l.takeaway ? (
    <div className="mt-4 rounded-lg border-l-2 border-teal bg-teal/5 px-3 py-2 text-sm">
      <span className="font-medium text-teal">Takeaway · </span>
      <span className="text-text/90">{l.takeaway}</span>
    </div>
  ) : null;
  const Source = l.source ? <p className="mt-3 text-[11px] text-muted">{l.source}</p> : null;

  if (l.type === "reading") {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{l.title}</h1>
        <div className="mt-3 space-y-3">
          {(l.paras ?? []).map((p, i) => <p key={i} className="text-[15px] leading-relaxed text-text/90">{p}</p>)}
        </div>
        {Takeaway}{Source}
      </div>
    );
  }

  if (l.type === "infographic" && l.img) {
    return (
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{l.title}</h1>
        <figure className="mt-3 overflow-hidden rounded-xl border border-white/8">
          <img src={l.img.src} alt={l.img.alt} className="max-h-[44dvh] w-full bg-white object-contain" />
          <figcaption className="px-3 py-2 text-[11px] text-muted">{l.img.caption ?? ""} {l.img.caption ? "· " : ""}{l.img.source}</figcaption>
        </figure>
        {Takeaway}
      </div>
    );
  }

  if (l.type === "slides" && l.slides) return <SlidesView title={l.title} slides={l.slides} footer={<>{Takeaway}{Source}</>} />;

  if (l.type === "video" && l.video) {
    return (
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{l.title}</h1>
        <div className="mt-3 overflow-hidden rounded-xl border border-white/8">
          <video controls preload="metadata" className="w-full bg-black">
            <source src={l.video.src} type="video/mp4" />
            {l.video.track && <track kind="subtitles" src={l.video.track} srcLang="en" label="English" default />}
          </video>
        </div>
        <p className="mt-2 text-[11px] text-muted">{l.video.source}{l.video.note ? ` · ${l.video.note}` : ""}</p>
        {Takeaway}
      </div>
    );
  }

  if (l.type === "audio" && l.audio) {
    return (
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{l.title}</h1>
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/8 p-4">
          <Headphones className="h-8 w-8 shrink-0 text-accent" />
          <audio controls preload="none" className="w-full">
            <source src={l.audio.src} type="video/mp4" />
          </audio>
        </div>
        <p className="mt-2 text-[11px] text-muted">{l.audio.note ?? ""} {l.audio.source}</p>
        {Takeaway}
      </div>
    );
  }

  if (l.type === "pdf" && l.pdf) {
    return (
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{l.title}</h1>
        <p className="mt-1 text-xs text-muted">{l.pdf.title}{l.pdf.pages ? ` · ${l.pdf.pages}` : ""}</p>
        <object data={l.pdf.src} type="application/pdf" className="mt-3 h-[60dvh] w-full rounded-xl border border-white/8 bg-white">
          <div className="p-4 text-sm text-muted">
            Your browser can&apos;t embed the PDF here.{" "}
            <a href={l.pdf.src} target="_blank" rel="noreferrer" className="text-accent hover:underline">Open it in a new tab</a>.
          </div>
        </object>
        <a href={l.pdf.src} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs text-accent hover:underline">
          <Download className="h-3.5 w-3.5" /> Open / download the full handbook
        </a>
        <p className="mt-2 text-[11px] text-muted">{l.pdf.source}</p>
      </div>
    );
  }

  if ((l.type === "interactive" || l.type === "sim") && l.widget) {
    return (
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{l.title}</h1>
        <div className="mt-4"><CourseSim widget={l.widget} /></div>
        {Takeaway}
      </div>
    );
  }

  if (l.type === "quiz" && l.quiz) return <QuizView title={l.title} items={l.quiz} />;

  if (l.type === "flashcards" && l.cards) return <FlashcardsView title={l.title} cards={l.cards} />;

  if (l.type === "gate" && l.gate) return <GateView gate={l.gate} gateOk={gateOk} onGate={onGate} />;

  return <div className="text-sm text-muted">Lesson.</div>;
}

function SlidesView({ title, slides, footer }: { title: string; slides: { title: string; bullets: string[] }[]; footer: React.ReactNode }) {
  const [i, setI] = useState(0);
  const s = slides[i];
  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <div className="mt-3 rounded-xl border border-white/8 p-5">
        <div className="text-[10px] uppercase tracking-wider text-muted">Slide {i + 1} / {slides.length}</div>
        <h2 className="mt-1 text-lg font-semibold">{s.title}</h2>
        <ul className="mt-3 space-y-2">
          {s.bullets.map((b, k) => <li key={k} className="flex items-start gap-2 text-sm"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" /><span>{b}</span></li>)}
        </ul>
        <div className="mt-4 flex items-center justify-between">
          <button type="button" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0} className="btn btn-ghost px-3 py-1.5 text-xs disabled:opacity-40"><ChevronLeft className="h-3.5 w-3.5" /> Prev</button>
          <div className="flex gap-1">{slides.map((_, k) => <span key={k} className={`h-1.5 w-1.5 rounded-full ${k === i ? "bg-accent" : "bg-surface-2"}`} />)}</div>
          <button type="button" onClick={() => setI((x) => Math.min(slides.length - 1, x + 1))} disabled={i === slides.length - 1} className="btn btn-ghost px-3 py-1.5 text-xs disabled:opacity-40">Next <ChevronRight className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      {footer}
    </div>
  );
}

function QuizView({ title, items }: { title: string; items: { q: string; options: string[]; correct: number; explain: string }[] }) {
  const [picks, setPicks] = useState<Record<number, number>>({});
  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <div className="mt-4 space-y-5">
        {items.map((it, qi) => {
          const picked = picks[qi];
          const answered = picked !== undefined;
          return (
            <div key={qi}>
              <div className="text-sm font-medium">{qi + 1}. {it.q}</div>
              <div className="mt-2 space-y-2">
                {it.options.map((opt, oi) => {
                  const isPicked = picked === oi;
                  const isCorrect = oi === it.correct;
                  return (
                    <button
                      key={oi}
                      type="button"
                      onClick={() => !answered && setPicks((p) => ({ ...p, [qi]: oi }))}
                      disabled={answered}
                      className={[
                        "flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                        !answered && "border-white/10 hover:border-accent/50 hover:bg-surface-2",
                        answered && isCorrect && "border-teal bg-teal/10",
                        answered && isPicked && !isCorrect && "border-danger bg-danger/10",
                        answered && !isPicked && !isCorrect && "border-white/8 opacity-60",
                      ].filter(Boolean).join(" ")}
                    >
                      {answered && isCorrect && <Check className="h-4 w-4 shrink-0 text-teal" />}
                      {answered && isPicked && !isCorrect && <X className="h-4 w-4 shrink-0 text-danger" />}
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
              {answered && <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-xs text-text/85">{it.explain}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FlashcardsView({ title, cards }: { title: string; cards: { front: string; back: string }[] }) {
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-xs text-muted">Tap each card to check yourself. These return on a spaced schedule.</p>
      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {cards.map((c, i) => {
          const f = !!flipped[i];
          return (
            <button key={i} type="button" onClick={() => setFlipped((p) => ({ ...p, [i]: !f }))} className="min-h-[92px] rounded-xl border border-white/8 p-3 text-left text-sm transition-colors hover:border-accent/40">
              <div className="text-[10px] uppercase tracking-wider text-muted">{f ? "Answer" : "Tap to reveal"}</div>
              <div className={`mt-1 ${f ? "text-teal" : "font-medium"}`}>{f ? c.back : c.front}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GateView({ gate, gateOk, onGate }: { gate: NonNullable<Lesson["gate"]>; gateOk: boolean; onGate: () => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const answer = (i: number) => {
    setPicked(i);
    if (i === gate.correct) onGate();
  };
  const answered = picked !== null;
  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gold"><Target className="h-4 w-4" /> Demonstrate</div>
      <p className="mt-2 text-xs text-muted">{gate.lead}</p>
      <h1 className="mt-2 text-lg font-semibold leading-snug">{gate.question}</h1>
      <div className="mt-4 space-y-2.5">
        {gate.options.map((opt, i) => {
          const isPicked = picked === i;
          const isCorrect = i === gate.correct;
          const show = answered && (isPicked || (gateOk && isCorrect));
          return (
            <button
              key={i}
              type="button"
              onClick={() => answer(i)}
              disabled={gateOk}
              className={[
                "flex w-full items-center gap-2.5 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                !answered && "border-white/10 hover:border-accent/50 hover:bg-surface-2",
                show && isCorrect && "border-teal bg-teal/10",
                isPicked && !isCorrect && "border-danger bg-danger/10",
                answered && !isPicked && !isCorrect && "border-white/8 opacity-60",
              ].filter(Boolean).join(" ")}
            >
              {show && isCorrect && <Check className="h-4 w-4 shrink-0 text-teal" />}
              {isPicked && !isCorrect && <X className="h-4 w-4 shrink-0 text-danger" />}
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={`mt-3 rounded-xl border p-3 text-sm ${gateOk ? "border-teal/40 bg-teal/5" : "border-danger/40 bg-danger/5"}`}>
          <div className="mb-1 font-medium">{gateOk ? "Correct — C1 mastered." : "Not quite — try again."}</div>
          {gateOk && <p className="text-text/85">{gate.explain}</p>}
        </div>
      )}
    </div>
  );
}
