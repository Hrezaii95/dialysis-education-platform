"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2, BookMarked, CheckCircle2, XCircle } from "lucide-react";
import { emitStatement } from "@/lib/xapi";
import { usePlatformStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { withBasePath } from "@/lib/asset";

// C1 prediction gate — awarded only on a correct answer, never on page-reach
const C1_GATE = {
  question:
    "If convective volume rises from 15 → 25 L in post-dilution HDF, β2-microglobulin clearance:",
  options: [
    {
      id: "a",
      label: "Increases substantially",
      correct: true,
      explanation:
        "Correct. β2-microglobulin (MW 11,800 Da) is a middle molecule cleared almost exclusively by convection. Raising convective volume from 15 → 25 L directly scales convective transport (J_c = Q_f × C_b), producing a substantial rise in clearance — consistent with CONTRAST and ESHOL trial data (doi:10.1093/ndt/gfr218; doi:10.1056/NEJMoa1208718).",
    },
    {
      id: "b",
      label: "Is unchanged",
      correct: false,
      explanation:
        "Incorrect. Diffusion contributes minimally to β2-microglobulin removal due to its size. Convective volume is the primary driver — leaving it unchanged would only hold clearance constant if convection itself were unchanged.",
    },
    {
      id: "c",
      label: "Decreases",
      correct: false,
      explanation:
        "Incorrect. Higher convective volume increases solute drag across the membrane. Clearance cannot fall when convective flux rises, assuming haemoconcentration (filtration fraction) stays within safe limits.",
    },
  ],
} as const;

interface PageMeta {
  id: string;
  title: string;
  objective?: string;
  moduleId: string;
  moduleTitle: string;
  moduleDescription: string;
  indexInModule: number;
  modulePageCount: number;
}

interface ModuleMeta {
  id: string;
  title: string;
  description: string;
  startIndex: number;
  pageCount: number;
}

const LEARNING_PATH = [
  { moduleId: "m1", concepts: ["HDF vs HD mechanisms", "Middle molecules", "CONVINCE evidence"] },
  { moduleId: "m2", concepts: ["Blood circuit", "Membrane science", "DIASAFE®plus", "Substitution fluid"] },
  { moduleId: "m3", concepts: ["5008S automation", "AutoSub plus", "VAM safety"] },
  { moduleId: "m4", concepts: ["Prescribing HDF", "Filtration fraction", "Access requirements"] },
  { moduleId: "m5", concepts: ["QoL outcomes", "Patient selection"] },
  { moduleId: "m6", concepts: ["5008X US pathway", "FX CorAL", "Clinical implementation"] },
];

export default function FlipbookPage() {
  const [pages, setPages] = useState<PageMeta[]>([]);
  const [modules, setModules] = useState<ModuleMeta[]>([]);
  const [page, setPage] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const setSkill = usePlatformStore((s) => s.setSkill);

  // C1 prediction gate state
  const [gateAnswer, setGateAnswer] = useState<string | null>(null);
  const [gateRevealed, setGateRevealed] = useState(false);

  useEffect(() => {
    fetch(withBasePath("/data/book-outline.json"))
      .then((r) => r.json())
      .then((outline) => {
        const flat: PageMeta[] = [];
        const mods: ModuleMeta[] = [];
        let globalIdx = 0;
        for (const mod of outline.modules ?? []) {
          const startIndex = globalIdx;
          const modPages = mod.pages ?? [];
          mods.push({
            id: mod.id,
            title: mod.title,
            description: mod.description,
            startIndex,
            pageCount: modPages.length,
          });
          modPages.forEach((p: { id: string; title: string; objective?: string }, i: number) => {
            flat.push({
              id: p.id,
              title: p.title,
              objective: p.objective,
              moduleId: mod.id,
              moduleTitle: mod.title,
              moduleDescription: mod.description,
              indexInModule: i,
              modulePageCount: modPages.length,
            });
            globalIdx++;
          });
        }
        setPages(flat);
        setModules(mods);
      });
    emitStatement("initialized", "flipbook", "HDF Curated Flipbook");
  }, []);

  const total = pages.length || 37;
  const current = pages[page];
  const imageId = current?.id ?? "m1-p1";

  const pathConcepts = useMemo(
    () => LEARNING_PATH.find((p) => p.moduleId === current?.moduleId)?.concepts ?? [],
    [current?.moduleId]
  );

  const go = useCallback(
    (p: number) => {
      const next = Math.max(0, Math.min(total - 1, p));
      setPage(next);
      const meta = pages[next];
      if (meta) setVisited((v) => new Set(v).add(meta.id));
      emitStatement("experienced", meta?.id ?? `flipbook-p${next}`, meta?.title ?? `Page ${next + 1}`);
      if (next >= 4) setSkill("foundation", "in_progress");
    },
    [setSkill, total, pages]
  );

  const goToModule = (mod: ModuleMeta) => go(mod.startIndex);

  const handleGateSubmit = useCallback(() => {
    if (!gateAnswer) return;
    setGateRevealed(true);
    const chosen = C1_GATE.options.find((o) => o.id === gateAnswer);
    if (chosen?.correct) {
      setSkill("foundation", "mastered", 90);
      emitStatement("mastered", "c1-prediction-gate", "C1 Convection Prediction Gate", { success: true, score: 100 });
    } else {
      emitStatement("answered", "c1-prediction-gate", "C1 Convection Prediction Gate", { success: false });
    }
  }, [gateAnswer, setSkill]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(page + 1);
      if (e.key === "ArrowLeft") go(page - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [page, go]);

  const moduleProgress = current
    ? `${current.indexInModule + 1} / ${current.modulePageCount}`
    : "";

  const isLastPage = pages.length > 0 && page >= pages.length - 1;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">HDF Learning Path</h1>
        <p className="mt-1 text-sm text-muted">
          Structured curriculum — Foundation → Technology → Prescribing → Outcomes → Implementation
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Module navigator — horizontal scroll on mobile */}
        <aside className="space-y-2 lg:col-span-1 order-2 lg:order-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-2">
            <BookMarked className="h-3.5 w-3.5" /> Modules
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0 scrollbar-none">
          {modules.map((mod) => {
            const isActive = current?.moduleId === mod.id;
            const modVisited = pages
              .slice(mod.startIndex, mod.startIndex + mod.pageCount)
              .filter((p) => visited.has(p.id)).length;
            const pct = mod.pageCount ? Math.round((modVisited / mod.pageCount) * 100) : 0;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => goToModule(mod)}
                className={cn(
                  "shrink-0 w-[min(85vw,280px)] lg:w-full text-left rounded-xl border p-3 transition-all text-sm",
                  isActive ? "border-accent bg-accent/10" : "border-white/8 hover:bg-surface-2"
                )}
              >
                <div className="font-medium">{mod.title}</div>
                <p className="text-[10px] text-muted mt-0.5 line-clamp-2">{mod.description}</p>
                <div className="mt-2 h-1 rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-teal-500" style={{ width: `${pct}%` }} />
                </div>
              </button>
            );
          })}
          </div>
        </aside>

        {/* Main viewer */}
        <div className={cn("lg:col-span-2 order-1 lg:order-2", fullscreen && "fixed inset-4 z-50")}>
          <div className="glass-panel overflow-hidden relative">
            <AnimatePresence mode="wait">
              <motion.img
                key={imageId}
                src={withBasePath(`/assets/pages/${imageId}.jpg`)}
                alt={current?.title ?? "HDF module"}
                className="w-full h-auto max-h-[55vh] object-contain bg-black"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = withBasePath(`/assets/pages/m1-p1.jpg`);
                }}
              />
            </AnimatePresence>

            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-4">
              <div className="text-[10px] uppercase text-teal-400 mb-1">{current?.moduleTitle}</div>
              <div className="font-medium text-sm">{current?.title}</div>
              <div className="flex items-center justify-between mt-3">
                <button type="button" className="btn btn-ghost p-2" onClick={() => go(page - 1)} disabled={page <= 0}>
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-xs text-muted tabular-nums">
                  Page {page + 1}/{total} · Module {moduleProgress}
                </span>
                <button type="button" className="btn btn-ghost p-2" onClick={() => go(page + 1)} disabled={page >= total - 1}>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button type="button" className="btn btn-ghost text-xs" onClick={() => setFullscreen(!fullscreen)}>
              <Maximize2 className="h-3.5 w-3.5" /> {fullscreen ? "Exit" : "Fullscreen"}
            </button>
            <input
              type="range"
              min={0}
              max={Math.max(0, total - 1)}
              value={page}
              onChange={(e) => go(Number(e.target.value))}
              className="flex-1 accent-accent"
            />
          </div>
        </div>

        {/* Concept panel */}
        <aside className="lg:col-span-1 space-y-4 order-3">
          <div className="glass-panel p-4">
            <h3 className="text-xs font-semibold uppercase text-muted mb-2">Learning objective</h3>
            <p className="text-sm">{current?.objective ?? "Review HDF clinical concepts in sequence."}</p>
          </div>

          <div className="glass-panel p-4">
            <h3 className="text-xs font-semibold uppercase text-muted mb-2">Key concepts (this module)</h3>
            <ul className="space-y-2">
              {pathConcepts.map((c) => (
                <li key={c} className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-500 shrink-0 mt-0.5" />
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-panel p-4">
            <h3 className="text-xs font-semibold uppercase text-muted mb-2">Suggested next</h3>
            {!isLastPage ? (
              <button type="button" className="btn btn-primary w-full text-xs" onClick={() => go(page + 1)}>
                {pages[page + 1]?.title ?? "Next page"} →
              </button>
            ) : (
              /* C1 Prediction Gate — mastery only on correct answer */
              <div className="space-y-3">
                <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
                  C1 Mastery Gate
                </p>
                <p className="text-xs leading-relaxed">{C1_GATE.question}</p>

                <div className="space-y-2">
                  {C1_GATE.options.map((opt) => {
                    const isChosen = gateAnswer === opt.id;
                    const showResult = gateRevealed && isChosen;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={gateRevealed}
                        onClick={() => !gateRevealed && setGateAnswer(opt.id)}
                        className={cn(
                          "w-full text-left rounded-lg border px-3 py-2 text-xs transition-all",
                          gateRevealed
                            ? "cursor-default"
                            : isChosen
                            ? "border-accent bg-accent/15"
                            : "border-white/8 hover:bg-surface-2",
                          showResult && opt.correct && "border-green-500 bg-green-500/10",
                          showResult && !opt.correct && "border-red-500 bg-red-500/10"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          {showResult && opt.correct && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
                          )}
                          {showResult && !opt.correct && (
                            <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                          )}
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {!gateRevealed ? (
                  <button
                    type="button"
                    disabled={!gateAnswer}
                    onClick={handleGateSubmit}
                    className="btn btn-primary w-full text-xs disabled:opacity-40"
                  >
                    Submit answer
                  </button>
                ) : (
                  <AnimatePresence>
                    <motion.div
                      key="gate-feedback"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className={cn(
                        "rounded-lg border p-3 text-xs leading-relaxed",
                        C1_GATE.options.find((o) => o.id === gateAnswer)?.correct
                          ? "border-green-500/40 bg-green-500/8 text-green-300"
                          : "border-red-500/40 bg-red-500/8 text-red-300"
                      )}
                    >
                      {C1_GATE.options.find((o) => o.id === gateAnswer)?.explanation}
                      {!C1_GATE.options.find((o) => o.id === gateAnswer)?.correct && (
                        <button
                          type="button"
                          className="mt-2 block underline text-xs opacity-80 hover:opacity-100"
                          onClick={() => {
                            setGateAnswer(null);
                            setGateRevealed(false);
                          }}
                        >
                          Try again
                        </button>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
