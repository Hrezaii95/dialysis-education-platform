"use client";

// Abstract, scroll-scrubbed landing hero — implements design-preview/design-system/ui_kits/landing/motion-hero.md
// (revised 2026-07-07). Pure SVG/CSS/DOM motion via framer-motion's scroll utilities — there is NO WebGL
// canvas and NO 3D device/dialyzer mesh here.
//
// Why this file replaced the old R3F ScrollHeroCanvas.tsx: the owner flagged the procedural Three.js
// dialyzer sim as looking broken / not prototype-quality on the live landing page. This version keeps the
// same four-beat structure, ~280vh pin, and snappy scrub feel from the locked D5 spec, but renders it as
// layered flat motion graphics — a Pulse-R ring, a flat extracorporeal circuit illustration with a
// membrane-pore dialyzer motif, a DOM monitor card, and an evidence bar — composited with scroll-linked
// opacity/position transforms instead of a 3D scene graph.
//
// Everything here is decorative (aria-hidden from ScrollHero.tsx); the real, keyboard-reachable role
// picker / CTA live unchanged in the sections below in page.tsx.

import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { useLang } from "@/components/providers/LanguageProvider";

// Beat boundaries mirror the original spec (0/25/50/75/100%, ~4% crossfade) so motion-hero.md's
// timeline stays valid.
const B = { s1: 0.23, e1: 0.27, s2: 0.48, e2: 0.52, s3: 0.73, e3: 0.77 };

const MONITOR_FIELDS: [string, string][] = [
  ["Mode", "HDF"],
  ["Qb", "380 mL/min"],
  ["Convection", "23 L"],
  ["TMP", "212 mmHg"],
  ["FF", "24.8%"],
  ["AutoSub", "ACTIVE"],
  ["Venous P.", "142 mmHg"],
  ["Arterial P.", "-218 mmHg"],
  ["UF rate", "8 mL/min"],
];

// ── Beat 2 illustration — flat extracorporeal circuit, membrane-pore dialyzer motif (no 3D mesh) ──
function CircuitIllustration({ draw }: { draw: MotionValue<number> }) {
  const accessIn = useTransform(draw, [0, 0.14], [0, 1]);
  const arterialDraw = useTransform(draw, [0.05, 0.36], [0, 1]);
  const pumpIn = useTransform(draw, [0.26, 0.4], [0, 1]);
  const dialyzerIn = useTransform(draw, [0.36, 0.56], [0, 1]);
  const convectionDraw = useTransform(draw, [0.5, 0.7], [0, 1]);
  const autosubIn = useTransform(draw, [0.6, 0.74], [0, 1]);
  const venousDraw = useTransform(draw, [0.3, 0.66], [0, 1]);
  const returnIn = useTransform(draw, [0.62, 0.84], [0, 1]);

  return (
    <svg
      viewBox="0 0 640 320"
      className="h-auto w-full max-w-2xl"
      role="img"
      aria-label="Extracorporeal HDF circuit assembling: patient access, blood pump, dialyzer, AutoSub, venous return"
    >
      <defs>
        <linearGradient id="hero-dz" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#5D8AD4" stopOpacity="0.92" />
          <stop offset="1" stopColor="#10306B" stopOpacity="0.92" />
        </linearGradient>
      </defs>

      {/* patient access */}
      <motion.g style={{ opacity: accessIn }}>
        <circle cx="70" cy="180" r="26" fill="#112A5E" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" />
        <text x="70" y="224" textAnchor="middle" fontSize="12" fill="#9FB0C8">
          Patient
        </text>
      </motion.g>

      {/* arterial line (blood out) — scroll-drawn */}
      <motion.path
        d="M96 168 C168 130 200 118 268 130"
        stroke="#fb7185"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        style={{ pathLength: arterialDraw }}
      />

      {/* blood pump — pulsing accent is a continuous "living" detail, not scroll-driven */}
      <motion.g style={{ opacity: pumpIn }}>
        <circle cx="212" cy="122" r="20" fill="#16336B" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
        <circle cx="219" cy="122" r="5" fill="#9BC0F2" className="hero-pump-accent" />
        <text x="212" y="160" textAnchor="middle" fontSize="11" fill="#9FB0C8">
          Blood pump
        </text>
      </motion.g>

      {/* dialyzer — flat membrane-pore motif (hollow-fiber cross-section as iconography, not a 3D mesh) */}
      <motion.g style={{ opacity: dialyzerIn }}>
        <rect x="268" y="110" width="64" height="140" rx="18" fill="url(#hero-dz)" />
        {Array.from({ length: 5 }, (_, row) => row).map((row) =>
          Array.from({ length: 3 }, (_, col) => col).map((col) => (
            <circle key={`pore-${row}-${col}`} cx={284 + col * 15} cy={128 + row * 24} r="2.2" fill="#ffffff" fillOpacity="0.45" />
          ))
        )}
        <text x="300" y="270" textAnchor="middle" fontSize="12" fill="#BCD5F2">
          Dialyzer
        </text>
      </motion.g>

      {/* convection line → AutoSub port */}
      <motion.path
        d="M332 168 C378 168 396 148 420 148"
        stroke="#9BC0F2"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        style={{ pathLength: convectionDraw }}
      />
      <motion.g style={{ opacity: autosubIn }}>
        <circle cx="432" cy="148" r="15" fill="#112A5E" stroke="rgba(155,192,242,0.6)" strokeWidth="1.5" />
        <text x="432" y="186" textAnchor="middle" fontSize="10.5" fill="#9FB0C8">
          AutoSub
        </text>
      </motion.g>

      {/* venous return (blood in) — scroll-drawn */}
      <motion.path
        d="M300 250 C266 296 176 306 100 202"
        stroke="#fb7185"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        style={{ pathLength: venousDraw }}
      />
      <motion.g style={{ opacity: returnIn }}>
        <circle cx="70" cy="180" r="8" fill="#DA4A54" />
        <text x="182" y="316" textAnchor="middle" fontSize="11" fill="#9FB0C8">
          Venous return
        </text>
      </motion.g>
    </svg>
  );
}

// ── Beat 3 — monitor vitals card (DOM overlay, matches Monitor5008 field layout) ────────────────
function MonitorCard() {
  const { t } = useLang();
  return (
    <div className="rounded-xl border-2 border-gray-700 bg-gray-900 p-1 shadow-2xl">
      <div className="w-[280px] rounded-lg bg-black px-3.5 py-3 font-mono text-[10px]">
        <div className="mb-2 flex items-center justify-between border-b border-gray-700 pb-1.5">
          <span className="text-flow">{t("heroScene.monitor.5008", "5008 CorDiax")}</span>
          <span className="calm-pulse text-green-400">{t("heroScene.monitor.treatment", "● TREATMENT")}</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {MONITOR_FIELDS.map(([label, value]) => (
            <div key={label} className="rounded bg-gray-800/60 px-1.5 py-1">
              <div className="text-[7px] uppercase text-gray-500">{label}</div>
              <div className={label === "TMP" ? "calm-pulse tabular-nums text-gray-100" : "tabular-nums text-gray-100"}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ScrollHeroScene({ isReturning = false }: { isReturning?: boolean }) {
  const { t } = useLang();
  const containerRef = useRef<HTMLDivElement>(null);
  // pin ≈ 280vh over ["start start", "end end"] — matches D5's ScrollControls pages={2.8}
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  // Light, critically-damped spring keeps the scrub snappy (D5 "damping 0.5" intent: tracks the
  // scrollbar within ~1 frame, no rubber-band lag) while smoothing sub-pixel scroll jitter.
  const p = useSpring(scrollYProgress, { stiffness: 300, damping: 30, mass: 0.1, restDelta: 0.001 });

  const beat1 = useTransform(p, [0, B.s1, B.e1], [1, 1, 0]);
  const beat2 = useTransform(p, [B.s1, B.e1, B.s2, B.e2], [0, 1, 1, 0]);
  const beat3 = useTransform(p, [B.s2, B.e2, B.s3, B.e3], [0, 1, 1, 0]);
  const beat4 = useTransform(p, [B.s3, B.e3, 1], [0, 1, 1]);

  // Ambient convection wash — parallax depth (Cinematic-2.5D), no 3D geometry.
  const bgFar = useTransform(p, [0, 1], ["0%", "-6%"]);
  const bgNear = useTransform(p, [0, 1], ["0%", "9%"]);

  const ringPathLength = useTransform(p, [0, 0.18], [0, 1]);
  const ringScale = useTransform(p, [0, B.s1], [0.72, 1]);
  const headlineY = useTransform(p, [0, B.s1], [10, 0]);

  const circuitDraw = useTransform(p, [B.s1, B.s2], [0, 1]);
  const circuitScale = useTransform(p, [B.s1, B.e1], [0.95, 1]);

  const monitorScale = useTransform(p, [B.s2, B.e2], [0.94, 1]);
  const evidenceY = useTransform(p, [B.s3, B.e3], [16, 0]);

  return (
    <div ref={containerRef} className="relative h-[280vh] w-full">
      <div className="sticky top-0 h-screen w-full overflow-hidden rounded-2xl">
        {/* convection gradient wash — depth layers, no 3D geometry */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            y: bgFar,
            background:
              "radial-gradient(46% 40% at 20% 18%, rgba(91,138,212,0.22), transparent 70%), radial-gradient(40% 34% at 82% 84%, rgba(143,224,90,0.10), transparent 70%)",
          }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            y: bgNear,
            background: "radial-gradient(34% 30% at 80% 22%, rgba(28,117,188,0.18), transparent 72%)",
          }}
        />

        {/* Beat 1 — Pulse-R ring + headline + role hint (0 → 25%) */}
        <motion.div
          style={{ opacity: beat1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center"
        >
          <motion.svg viewBox="0 0 200 200" style={{ scale: ringScale }} className="h-40 w-40 sm:h-48 sm:w-48" aria-hidden>
            <circle cx="100" cy="100" r="70" fill="none" stroke="#9BC0F2" strokeOpacity="0.3" strokeWidth="3" />
            <motion.circle
              cx="100"
              cy="100"
              r="70"
              fill="none"
              stroke="#1C75BC"
              strokeWidth="4"
              strokeLinecap="round"
              style={{ pathLength: ringPathLength, rotate: -90 }}
            />
            {/* heartbeat crossbar — the mark's only green accent */}
            <rect x="72" y="94" width="56" height="12" rx="6" fill="#35C98E" />
          </motion.svg>
          <motion.div style={{ y: headlineY }} className="max-w-sm space-y-2">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {(() => {
                const full = t("heroScene.beat1.title", "Your dialysis unit, simulated.");
                const parts = full.split("simulated");
                if (parts.length === 2) {
                  return (
                    <>
                      {parts[0]}
                      <span className="grad-text">simulated</span>
                      {parts[1]}
                    </>
                  );
                }
                return full;
              })()}
            </h2>
            <div className="flex flex-col items-center gap-1.5">
              <span className="badge badge-flow">{t("heroScene.beat1.hint", "Who are you here as?")}</span>
              <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-[10px] text-muted whitespace-nowrap">
                {t("heroScene.beat1.example", "e.g. In-center nurse")}
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Beat 2 — extracorporeal circuit reveal, flat illustration (25 → 50%) */}
        <motion.div
          style={{ opacity: beat2, scale: circuitScale }}
          className="absolute inset-0 flex items-center justify-center px-6"
        >
          <CircuitIllustration draw={circuitDraw} />
        </motion.div>

        {/* Beat 3 — monitor vitals pulse (50 → 75%) */}
        <motion.div
          style={{ opacity: beat3, scale: monitorScale }}
          className="absolute inset-0 flex items-center justify-center px-6"
        >
          <MonitorCard />
        </motion.div>

        {/* Beat 4 — evidence bar + CTA → My Path (75 → 100%) */}
        <motion.div
          style={{ opacity: beat4, y: evidenceY }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center"
        >
          <div className="flex items-center gap-1.5">
            {["CONTRAST", "ESHOL", "CONVINCE"].map((name) => (
              <span key={name} className="rounded-full border border-white/15 bg-black/30 px-2 py-0.5 text-[9px] font-medium text-muted">
                {name}
              </span>
            ))}
          </div>
          <div className="relative h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
            <div className="absolute inset-y-0 left-0 rounded-full bg-[var(--color-flow)]" style={{ width: "82%" }} />
            <span className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[#8FE05A]" style={{ left: "82%" }} />
          </div>
          <span className="text-[10px] text-muted">{t("heroScene.evidence.conv", "≥ 23 L convection · CONVINCE, PMID 37326323")}</span>
          <h1 className="max-w-md font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {(() => {
              const full = t("home.return.h1", "The first interactive HDF training built for your dialysis unit");
              const parts = full.split("HDF training");
              if (parts.length === 2) {
                return (
                  <>
                    {parts[0]}
                    <span className="grad-text">HDF training</span>
                    {parts[1]}
                  </>
                );
              }
              return full;
            })()}
          </h1>
          <span className="btn btn-primary">{t("home.return.cta.start", "Start your path")}</span>
          {isReturning && (
            <span className="text-[10px] text-muted">
              {t("heroScene.beat4.replay", "Replay first impression anytime below")}
            </span>
          )}
        </motion.div>
      </div>
    </div>
  );
}
