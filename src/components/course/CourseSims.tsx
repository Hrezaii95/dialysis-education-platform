"use client";

import Link from "next/link";
import { useState } from "react";
import type { WidgetKey } from "@/lib/c1-course";
import { Cpu, HeartPulse, ArrowRight } from "lucide-react";

const EDU = "Educational model — not a clinical prescription.";

function Bar({ label, value, max, color, unit }: { label: string; value: number; max: number; color: string; unit: string }) {
  const pct = Math.max(2, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="tabular-nums font-medium">{Math.round(value)} {unit}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full rounded-full ${color} transition-all duration-300`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, suffix }: { label: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void; suffix: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="tabular-nums font-medium text-accent">{value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-accent" />
    </div>
  );
}

function Convection() {
  const [vol, setVol] = useState(20);
  const small = 250; // urea, ~flat
  const middle = 18 + vol * 5.4; // rises with convective volume
  return (
    <div className="space-y-4">
      <Slider label="Convective volume" value={vol} min={0} max={30} step={1} onChange={setVol} suffix=" L" />
      <div className="space-y-3 rounded-xl border border-white/8 p-4">
        <Bar label="Small solute (urea)" value={small} max={300} color="bg-accent" unit="mL/min" />
        <Bar label="Middle molecule (β2-M)" value={middle} max={300} color="bg-teal" unit="mL/min" />
      </div>
      <p className="text-xs text-muted">Small-solute clearance is diffusion-dominated and barely moves; middle-molecule clearance climbs with convective volume. {EDU}</p>
    </div>
  );
}

function Dose() {
  const [vol, setVol] = useState(23);
  // saturating benefit index with a knee near ~23 L
  const benefit = Math.round(Math.max(0, Math.min(100, ((vol - 8) / 18) * 100)));
  const pts = Array.from({ length: 31 }, (_, x) => ({ x, y: Math.max(0, Math.min(100, ((x - 8) / 18) * 100)) }));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${(p.x / 30) * 280 + 10} ${110 - (p.y / 100) * 90}`).join(" ");
  const cx = (vol / 30) * 280 + 10;
  const cy = 110 - (benefit / 100) * 90;
  return (
    <div className="space-y-4">
      <Slider label="Convective volume" value={vol} min={0} max={30} step={1} onChange={setVol} suffix=" L" />
      <div className="rounded-xl border border-white/8 p-3">
        <svg viewBox="0 0 300 120" className="w-full" role="img" aria-label="Dose–response: benefit vs convective volume">
          <line x1="10" y1="110" x2="290" y2="110" stroke="rgba(255,255,255,0.15)" />
          {/* ≥23 L marker */}
          <line x1={(23 / 30) * 280 + 10} y1="15" x2={(23 / 30) * 280 + 10} y2="110" stroke="#e0b23a" strokeDasharray="3 3" strokeWidth="1" />
          <text x={(23 / 30) * 280 + 13} y="24" fontSize="9" fill="#e0b23a">≥23 L</text>
          <path d={path} fill="none" stroke="#16c2b0" strokeWidth="2.5" />
          <circle cx={cx} cy={cy} r="5" fill="#16c2b0" />
        </svg>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">Relative middle-molecule benefit</span>
        <span className="tabular-nums font-semibold text-teal">{benefit}%</span>
      </div>
      <p className="text-xs text-muted">The benefit concentrates above ~23 L — the convective dose target. {EDU}</p>
    </div>
  );
}

function Sieving() {
  const [mw, setMw] = useState(11800);
  const sc = 1 / (1 + Math.pow(mw / 30000, 3));
  const cleared = sc > 0.4;
  return (
    <div className="space-y-4">
      <Slider label="Molecular weight" value={mw} min={60} max={66000} step={20} onChange={setMw} suffix=" Da" />
      <div className="flex flex-wrap gap-1.5 text-[10px]">
        {[["Urea", 60], ["β2-M", 11800], ["Albumin", 66000]].map(([n, v]) => (
          <button key={n as string} type="button" onClick={() => setMw(v as number)} className="rounded-md bg-surface-2 px-2 py-1 text-muted hover:text-text">{n} ({v} Da)</button>
        ))}
      </div>
      <div className="rounded-xl border border-white/8 p-4 text-center">
        <div className="text-[11px] uppercase tracking-wider text-muted">Sieving coefficient</div>
        <div className="mt-1 text-3xl font-semibold tabular-nums text-teal">{sc.toFixed(2)}</div>
        <div className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs ${cleared ? "bg-teal/15 text-teal" : "bg-danger/15 text-danger"}`}>
          {cleared ? "Crosses with the fluid — cleared by convection" : "Held back — stays in the blood"}
        </div>
      </div>
      <p className="text-xs text-muted">Near 1, the solute rides the fluid out freely; near 0, the membrane holds it back (albumin should stay in). {EDU}</p>
    </div>
  );
}

function Dilution() {
  const [qb, setQb] = useState(380);
  const [mode, setMode] = useState<"post" | "pre">("post");
  const plasmaFlow = qb * 0.68; // mL/min, rough plasma-water flow
  const ffCeil = mode === "post" ? 0.33 : 0.5;
  const maxUf = ffCeil * plasmaFlow; // mL/min
  const maxVol = (maxUf * 240) / 1000; // L over a 240-min session
  const reaches = maxVol >= 23;
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["post", "pre"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${mode === m ? "bg-accent text-white" : "bg-surface-2 text-muted"}`}>
            {m === "post" ? "Post-dilution" : "Pre-dilution"}
          </button>
        ))}
      </div>
      <Slider label="Blood flow (Qb)" value={qb} min={200} max={450} step={10} onChange={setQb} suffix=" mL/min" />
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/8 p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted">FF ceiling</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{Math.round(ffCeil * 100)}%</div>
        </div>
        <div className="rounded-xl border border-white/8 p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted">Max convective vol.</div>
          <div className={`mt-1 text-2xl font-semibold tabular-nums ${reaches ? "text-teal" : "text-gold"}`}>{maxVol.toFixed(1)} L</div>
        </div>
      </div>
      <div className={`rounded-lg px-3 py-2 text-xs ${reaches ? "bg-teal/10 text-teal" : "bg-gold/10 text-gold"}`}>
        {reaches ? "Reaches the ≥23 L target safely." : "Below ≥23 L — raise Qb, extend time, or switch to pre-dilution."}
      </div>
      <p className="text-xs text-muted">Post-dilution is FF-capped; pre-dilution reaches higher volumes at lower blood flow (less efficient per litre). 240-min session. {EDU}</p>
    </div>
  );
}

function Lab() {
  const [vol, setVol] = useState(23);
  const [flux, setFlux] = useState<"high" | "low">("high");
  const fluxFactor = flux === "high" ? 1 : 0.25;
  const removal = Math.round(Math.max(0, Math.min(85, (20 + vol * 1.9) * fluxFactor)));
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["high", "low"] as const).map((f) => (
          <button key={f} type="button" onClick={() => setFlux(f)} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${flux === f ? "bg-accent text-white" : "bg-surface-2 text-muted"}`}>
            {f === "high" ? "High-flux membrane" : "Low-flux membrane"}
          </button>
        ))}
      </div>
      <Slider label="Convective volume" value={vol} min={0} max={30} step={1} onChange={setVol} suffix=" L" />
      <div className="rounded-xl border border-white/8 p-4 text-center">
        <div className="text-[11px] uppercase tracking-wider text-muted">β2-microglobulin removed this session</div>
        <div className="mt-1 text-4xl font-semibold tabular-nums text-teal">{removal}%</div>
      </div>
      <p className="text-xs text-muted">{flux === "low" ? "Low-flux: convection can't pass middle molecules — removal stays low whatever the volume." : "High-flux + convective volume drives β2-microglobulin removal."} {EDU}</p>
    </div>
  );
}

function Apply() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">You understand the therapy. Now take it into the rest of the journey:</p>
      <Link href="/simulator" className="flex items-center justify-between gap-3 rounded-xl border border-accent/30 p-3.5 transition-colors hover:border-accent/60">
        <span className="flex items-center gap-3"><Cpu className="h-5 w-5 text-accent" /><span className="text-sm"><span className="font-medium">Simulation Hub</span> — explore, prime, cases, alarms, sign-off</span></span>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted" />
      </Link>
      <Link href="/simulator?step=cases" className="flex items-center justify-between gap-3 rounded-xl border border-accent/30 p-3.5 transition-colors hover:border-accent/60">
        <span className="flex items-center gap-3"><HeartPulse className="h-5 w-5 text-accent" /><span className="text-sm"><span className="font-medium">Patient Cases</span> — decide under a deteriorating patient</span></span>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted" />
      </Link>
    </div>
  );
}

export function CourseSim({ widget }: { widget: WidgetKey }) {
  switch (widget) {
    case "convection": return <Convection />;
    case "dose": return <Dose />;
    case "sieving": return <Sieving />;
    case "dilution": return <Dilution />;
    case "lab": return <Lab />;
    case "apply": return <Apply />;
    default: return null;
  }
}
