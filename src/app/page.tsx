"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Box,
  HeartPulse,
  LineChart,
  Languages,
  ShieldCheck,
  Sparkles,
  Activity,
  Cpu,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { emitStatement } from "@/lib/xapi";
import { AUDIENCES } from "@/lib/competencies";
import type { Audience } from "@/lib/competencies";
import { useRole } from "@/components/onboarding/useRole";
import { FirstImpression } from "@/components/onboarding/FirstImpression";

// ── Static data ───────────────────────────────────────────────────────────────

const DIFFERENTIATORS = [
  { icon: Cpu, title: "3D 5008 / HDF setup", desc: "Explore and sequence the machine in 3D — no competitor has a HD/HDF device sim.", color: "text-flow" },
  { icon: HeartPulse, title: "Symptom-driven patient sim", desc: "Branching intradialytic crises with safe-failure feedback and debrief.", color: "text-danger" },
  { icon: LineChart, title: "Evidence outcome sim", desc: "Compare HV-HDF vs conventional HD on real trial effect sizes.", color: "text-gold" },
  { icon: Languages, title: "Farsi-first / RTL", desc: "Every module flips to Persian — absent from every vendor academy today.", color: "text-flow" },
  { icon: ShieldCheck, title: "Vendor-neutral & on-prem", desc: "Self-hostable inside the hospital — sanctions-safe, no cloud lock-in.", color: "text-success" },
];

// ── Hero circuit (unchanged from original) ────────────────────────────────────

function HeroCircuit() {
  return (
    <svg viewBox="0 0 420 280" className="h-auto w-full" role="img" aria-label="Live extracorporeal HDF circuit">
      <defs>
        <linearGradient id="dz" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#1bd3bf" stopOpacity="0.9" />
          <stop offset="1" stopColor="#1f6bff" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      {/* patient */}
      <circle cx="50" cy="150" r="26" fill="#0f1521" stroke="rgba(255,255,255,0.12)" />
      <text x="50" y="195" textAnchor="middle" fontSize="11" fill="#94a2b6">Patient</text>
      <circle cx="50" cy="142" r="8" fill="#1d2840" />
      <rect x="40" y="150" width="20" height="16" rx="6" fill="#1d2840" />
      {/* arterial (blood out) */}
      <path d="M76 140 C130 110 150 100 196 110" stroke="#ef4444" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.5" />
      <path d="M76 140 C130 110 150 100 196 110" stroke="#fb7185" strokeWidth="2.2" fill="none" strokeLinecap="round" className="flow-dash" />
      {/* pump */}
      <circle cx="150" cy="103" r="15" fill="#151d2c" stroke="rgba(255,255,255,0.14)" />
      <circle cx="150" cy="103" r="5" fill="#16c2b0">
        <animateTransform attributeName="transform" type="rotate" from="0 150 103" to="360 150 103" dur="2.4s" repeatCount="indefinite" />
      </circle>
      <text x="150" y="135" textAnchor="middle" fontSize="9" fill="#94a2b6">Blood pump</text>
      {/* dialyzer */}
      <rect x="196" y="86" width="40" height="108" rx="14" fill="url(#dz)" />
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={204 + i * 8} y1="92" x2={204 + i * 8} y2="188" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1" />
      ))}
      <text x="216" y="210" textAnchor="middle" fontSize="10" fill="#9fe9df">Dialyzer</text>
      {/* convection (teal substitution) */}
      <path d="M236 140 C270 140 280 120 300 120" stroke="#16c2b0" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.4" />
      <path d="M236 140 C270 140 280 120 300 120" stroke="#5eead4" strokeWidth="1.8" fill="none" strokeLinecap="round" className="flow-dash" />
      <circle cx="312" cy="120" r="12" fill="#0f1521" stroke="rgba(22,194,176,0.5)" />
      <text x="312" y="150" textAnchor="middle" fontSize="8.5" fill="#94a2b6">AutoSub</text>
      {/* venous (blood return) */}
      <path d="M216 194 C200 240 130 250 76 165" stroke="#ef4444" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.45" />
      <path d="M216 194 C200 240 130 250 76 165" stroke="#fb7185" strokeWidth="2.2" fill="none" strokeLinecap="round" className="flow-dash" />
      <text x="150" y="262" textAnchor="middle" fontSize="9" fill="#94a2b6">Venous return</text>
    </svg>
  );
}

// ── Onboarding: role picker ───────────────────────────────────────────────────

function RolePicker({ onPick }: { onPick: (r: Audience) => void }) {
  const [hovered, setHovered] = useState<Audience | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="max-w-lg mx-auto space-y-6"
    >
      <div className="text-center space-y-2">
        <span className="badge badge-flow">
          <Sparkles className="h-3.5 w-3.5" /> 60-second setup
        </span>
        <h2 className="font-display text-2xl sm:text-3xl tracking-tight">
          Who are you here as?
        </h2>
        <p className="text-sm text-muted">
          Your path, depth targets, and first exercises adapt to your role.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {AUDIENCES.map((a) => (
          <button
            key={a.id}
            onClick={() => onPick(a.id)}
            onMouseEnter={() => setHovered(a.id)}
            onMouseLeave={() => setHovered(null)}
            className={
              "glass-panel card-hover p-4 text-left transition-all rounded-xl border " +
              (hovered === a.id
                ? "border-[var(--color-flow)]/60 bg-[var(--color-flow)]/8"
                : "border-white/8")
            }
          >
            <p className="text-sm font-semibold">{a.label}</p>
          </button>
        ))}
      </div>

      <p className="text-center text-[11px] text-muted">
        Language switch is in the header — you can change role anytime.
      </p>
    </motion.div>
  );
}

// ── Returning user CTA ────────────────────────────────────────────────────────

function ReturningUser({
  role,
  onReplay,
}: {
  role: Audience;
  onReplay: () => void;
}) {
  const label = AUDIENCES.find((a) => a.id === role)?.label ?? role;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-start gap-5"
    >
      <div>
        <span className="badge badge-flow">
          <Activity className="h-3.5 w-3.5" /> Continuing as {label}
        </span>
        <h1 className="mt-3 font-display text-4xl font-normal leading-[1.05] tracking-tight sm:text-5xl">
          The first interactive{" "}
          <span className="grad-text">HDF training</span>{" "}
          built for your dialysis unit
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
          Hands-on machine setup, branching patient crises, and cited HV-HDF evidence — in Persian and English.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link href="/my-path" className="btn btn-primary">
          Start your path <ArrowRight className="h-4 w-4" />
        </Link>
        <button onClick={onReplay} className="btn btn-ghost text-sm">
          <RefreshCw className="h-3.5 w-3.5" /> Replay first impression
        </button>
      </div>

      <div className="flex flex-wrap gap-x-7 gap-y-2 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5"><Box className="h-3.5 w-3.5 text-flow" /> 5008 / HDF in 3D</span>
        <span className="inline-flex items-center gap-1.5"><Languages className="h-3.5 w-3.5 text-flow" /> Persian + English</span>
        <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-flow" /> Runs inside the hospital</span>
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type PagePhase =
  | "loading"       // waiting for localStorage read
  | "role-pick"     // first-run: no role stored
  | "first-impression" // after role pick (or replay)
  | "returning";    // role exists + impression already seen

export default function Home() {
  const [role, setRole] = useRole();
  // null = still reading localStorage; loaded once effect fires
  const [phase, setPhase] = useState<PagePhase>("loading");

  useEffect(() => {
    emitStatement("initialized", "home", "Raouf Renal Academy");
  }, []);

  // Determine phase once role is resolved from localStorage
  useEffect(() => {
    if (role === null) {
      // still loading — wait for next tick (useRole sets state in effect)
      // We'll check again once role is set
      return;
    }
    // role is set — check if first impression was already seen
    const seen = typeof window !== "undefined"
      ? window.localStorage.getItem("raouf.impression_seen") === "1"
      : false;
    setPhase(seen ? "returning" : "first-impression");
  }, [role]);

  // On mount — if role is null after a tick, we're truly a new user
  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase((prev) => {
        if (prev !== "loading") return prev;
        // role is still null — new user
        return "role-pick";
      });
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleRolePick = (r: Audience) => {
    setRole(r);
    setPhase("first-impression");
  };

  const handleImpressionFinish = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("raouf.impression_seen", "1");
    }
    // navigation handled by FirstImpression itself (router.push /my-path)
  };

  const handleReplay = () => {
    setPhase("first-impression");
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-16">

      {/* HERO — always visible (reduced when onboarding) */}
      {phase !== "first-impression" && phase !== "role-pick" && (
        <section className="grid items-center gap-8 pt-1 lg:grid-cols-[1.05fr_0.95fr]">
          {phase === "loading" && (
            <div className="h-40 animate-pulse rounded-xl bg-white/5" />
          )}
          {phase === "returning" && role && (
            <ReturningUser role={role} onReplay={handleReplay} />
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-panel relative overflow-hidden p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="badge"><Activity className="h-3 w-3 text-flow" /> Live circuit</span>
              <span className="text-[10px] uppercase tracking-widest text-muted">HV-HDF · online</span>
            </div>
            <HeroCircuit />
          </motion.div>
        </section>
      )}

      {/* ROLE PICKER */}
      {phase === "role-pick" && (
        <section className="pt-4">
          <RolePicker onPick={handleRolePick} />
        </section>
      )}

      {/* FIRST IMPRESSION SEQUENCE */}
      {phase === "first-impression" && (
        <section className="pt-2">
          {/* Compact hero headline above the sequence */}
          <div className="mb-6 text-center space-y-2">
            <span className="badge badge-flow">
              <Sparkles className="h-3.5 w-3.5" /> Vendor-neutral · Farsi-first · on-prem
            </span>
            <h1 className="font-display text-3xl font-normal tracking-tight sm:text-4xl">
              The first interactive{" "}
              <span className="grad-text">HDF training</span>{" "}
              built for your dialysis unit
            </h1>
            <p className="text-sm text-muted max-w-xl mx-auto">
              Two quick steps — then your personalised path is ready.
            </p>
          </div>
          <FirstImpression onFinish={handleImpressionFinish} />
        </section>
      )}

      {/* DIFFERENTIATORS — visible to returning users (gives context, not navigation) */}
      {(phase === "returning" || phase === "loading") && (
        <section>
          <div className="mb-6">
            <h2 className="font-display text-2xl tracking-tight sm:text-3xl">What no one else has</h2>
            <p className="mt-1 text-sm text-muted">Every box below is a documented gap in today&apos;s renal academies.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DIFFERENTIATORS.map((d, i) => (
              <motion.div
                key={d.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="glass-panel card-hover p-5"
              >
                <d.icon className={`h-6 w-6 ${d.color}`} />
                <h3 className="mt-3 text-[15px] font-semibold">{d.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{d.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* COMPETITIVE GAP — returning users only */}
      {phase === "returning" && (
        <section className="glass-panel overflow-hidden">
          <div className="grid sm:grid-cols-2">
            <div className="border-b border-white/8 p-6 sm:border-b-0 sm:border-r">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted">Today&apos;s vendor academies</span>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li>— Slides, video, webinars</li>
                <li>— English only (zero Farsi)</li>
                <li>— Watch, don&apos;t practice</li>
                <li>— Device-captive marketing</li>
              </ul>
            </div>
            <div className="p-6">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-flow">Raouf Renal Academy</span>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="text-text">+ Interactive 3D &amp; branching sims</li>
                <li className="text-text">+ Persian + English, RTL-native</li>
                <li className="text-text">+ Practice with safe-failure feedback</li>
                <li className="text-text">+ Vendor-neutral, evidence-cited</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      <p className="text-center text-xs text-muted">
        Educational simulation only — not for clinical prescription or FDA-cleared decision support.
      </p>
    </div>
  );
}
