"use client";

// Scroll-scrubbed R3F landing hero — implements design-preview/design-system/ui_kits/landing/motion-hero.md
// (4 beats over ~280vh pin, scrub/damping 0.5). Only ever loaded client-side (dynamic ssr:false from
// ScrollHero.tsx) — safe to top-level import three/fiber/drei here, matching the DeviceScene3D.tsx
// convention already used by /devices. No GLB/texture fetch — procedural geometry only (on-prem).
//
// The whole canvas sits behind aria-hidden (ScrollHero.tsx) and every beat below is DECORATIVE ONLY —
// no focusable controls, no real navigation. The keyboard-reachable role picker / "Start your path" CTA
// live in the unchanged page.tsx sections this hero scrolls into (D5/D6: motion clarifies, never gates).

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ScrollControls, useScroll, Html, Tube } from "@react-three/drei";
import * as THREE from "three";

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// ── Camera rig — lerps position/FOV across the 4 beat windows (motion-hero.md §Camera keyframes) ──
const CAMERA_KEYS: { at: number; pos: [number, number, number]; fov: number }[] = [
  { at: 0.0, pos: [0, 0.15, 2.8], fov: 40 },
  { at: 0.25, pos: [0, 0.15, 2.8], fov: 40 },
  { at: 0.5, pos: [0.2, 0.25, 3.6], fov: 46 },
  { at: 0.75, pos: [0, 0.1, 2.4], fov: 40 },
  { at: 1.0, pos: [0, 0.2, 3.2], fov: 44 },
];

function CameraRig() {
  const { camera } = useThree();
  const scroll = useScroll();
  const pos = useRef(new THREE.Vector3(...CAMERA_KEYS[0].pos));

  useFrame(() => {
    const o = scroll.offset;
    let i = 0;
    while (i < CAMERA_KEYS.length - 2 && o > CAMERA_KEYS[i + 1].at) i++;
    const a = CAMERA_KEYS[i];
    const b = CAMERA_KEYS[i + 1];
    const local = smoothstep(a.at, b.at, o);
    pos.current.set(
      THREE.MathUtils.lerp(a.pos[0], b.pos[0], local),
      THREE.MathUtils.lerp(a.pos[1], b.pos[1], local),
      THREE.MathUtils.lerp(a.pos[2], b.pos[2], local)
    );
    camera.position.copy(pos.current);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.lerp(a.fov, b.fov, local);
      camera.updateProjectionMatrix();
    }
    camera.lookAt(0, 0.12, 0);
  });

  return null;
}

// ── Beat 1 — Pulse-R ring assembles + role hint (0 → 25%) ─────────────────
function PulseRing({ opacityRef }: { opacityRef: React.MutableRefObject<number> }) {
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const pulseMat = useRef<THREE.MeshBasicMaterial>(null);
  const group = useRef<THREE.Group>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  useFrame(() => {
    const o = opacityRef.current;
    if (ringMat.current) ringMat.current.opacity = o * 0.9;
    if (pulseMat.current) pulseMat.current.opacity = o;
    if (group.current) group.current.scale.setScalar(THREE.MathUtils.lerp(0.7, 1, Math.min(1, o * 1.6)));
    if (hintRef.current) {
      hintRef.current.style.opacity = String(o);
      hintRef.current.style.transform = `translateY(${(1 - o) * 8}px)`;
    }
  });

  return (
    <group ref={group} position={[0, 0.15, -1]}>
      <mesh>
        <ringGeometry args={[0.62, 0.7, 64]} />
        <meshBasicMaterial ref={ringMat} color="#9BC0F2" transparent opacity={0} />
      </mesh>
      {/* heartbeat crossbar — the mark's only signal color */}
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[0.5, 0.06, 0.01]} />
        <meshBasicMaterial ref={pulseMat} color="#35C98E" transparent opacity={0} />
      </mesh>
      {/* role hint — eyebrow only; full RolePicker stays below the pin (motion-hero.md §Beat 1) */}
      <Html position={[0, -0.55, 0.01]} center distanceFactor={5}>
        <div ref={hintRef} className="flex flex-col items-center gap-1.5 text-center" style={{ opacity: 0 }}>
          <span className="badge badge-flow">Who are you here as?</span>
          <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-[10px] text-muted whitespace-nowrap">
            e.g. In-center nurse
          </span>
        </div>
      </Html>
    </group>
  );
}

// ── Beat 2 — extracorporeal circuit reveal (25 → 50%) ──────────────────────
// Patient access → blood pump → dialyzer → AutoSub port → venous return — same sequence as the
// HeroCircuit SVG (page.tsx) and the /devices guided lab (DeviceScene3D.tsx patterns, simplified).
function CircuitReveal({ opacityRef }: { opacityRef: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const pumpRef = useRef<THREE.Mesh>(null);
  const materials = useRef<THREE.Material[]>([]);

  const arterial = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2.6, -0.1, 0),
        new THREE.Vector3(-1.4, 0.15, 0.1),
        new THREE.Vector3(-0.3, 0.2, 0),
        new THREE.Vector3(0.6, 0.05, 0),
      ]),
    []
  );
  const venous = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(2.6, 0.25, 0),
        new THREE.Vector3(1.4, 0.45, 0.1),
        new THREE.Vector3(0.5, 0.5, 0),
        new THREE.Vector3(-0.2, 0.45, 0),
      ]),
    []
  );
  const convection = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(1.0, 0.05, 0),
        new THREE.Vector3(1.6, 0.02, 0.15),
        new THREE.Vector3(2.1, 0.15, 0),
      ]),
    []
  );

  useFrame((_, delta) => {
    const o = opacityRef.current;
    materials.current.forEach((m) => {
      if ("opacity" in m) (m as THREE.MeshStandardMaterial).opacity = o * 0.95;
    });
    if (group.current) group.current.position.z = THREE.MathUtils.lerp(-0.6, 0, Math.min(1, o * 1.4));
    if (pumpRef.current) pumpRef.current.rotation.y += delta * 1.4; // living detail — not scroll-driven
  });

  const registerMat = (m: THREE.Material | null) => {
    if (m && !materials.current.includes(m)) materials.current.push(m);
  };

  return (
    <group ref={group} position={[0, 0, -0.6]}>
      {/* patient access */}
      <mesh position={[-2.7, -0.15, 0]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial ref={registerMat} color="#DA4A54" transparent opacity={0} />
      </mesh>
      <Tube args={[arterial, 48, 0.035, 8, false]}>
        <meshStandardMaterial ref={registerMat} color="#fb7185" transparent opacity={0} />
      </Tube>
      <Tube args={[venous, 48, 0.035, 8, false]}>
        <meshStandardMaterial ref={registerMat} color="#fb7185" transparent opacity={0} />
      </Tube>
      <Tube args={[convection, 32, 0.022, 8, false]}>
        <meshStandardMaterial ref={registerMat} color="#9BC0F2" transparent opacity={0} />
      </Tube>
      {/* blood pump */}
      <mesh ref={pumpRef} position={[-0.4, 0.12, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.14, 24]} />
        <meshStandardMaterial ref={registerMat} color="#16336B" transparent opacity={0} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* dialyzer */}
      <mesh position={[0.7, 0.1, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.7, 24]} />
        <meshStandardMaterial ref={registerMat} color="#10306B" transparent opacity={0} metalness={0.4} roughness={0.35} />
      </mesh>
      {/* AutoSub convection port */}
      <mesh position={[2.15, 0.16, 0]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial ref={registerMat} color="#9BC0F2" transparent opacity={0} emissive="#5D8AD4" emissiveIntensity={0.3} />
      </mesh>
      {/* venous return */}
      <mesh position={[2.65, 0.25, 0]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial ref={registerMat} color="#DA4A54" transparent opacity={0} />
      </mesh>
    </group>
  );
}

// ── Beat 3 — Monitor vitals pulse (50 → 75%) — fields mirror Monitor5008.tsx ───────────────────
function MonitorPulse({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useFrame(() => {
    const p = progressRef.current;
    if (wrapRef.current) {
      wrapRef.current.style.opacity = String(p);
      wrapRef.current.style.transform = `scale(${THREE.MathUtils.lerp(0.94, 1, p)})`;
    }
  });

  const fields: [string, string][] = [
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

  return (
    <Html position={[0, 0.08, 0.5]} center distanceFactor={6}>
      <div ref={wrapRef} style={{ opacity: 0 }} className="rounded-xl border-2 border-gray-700 bg-gray-900 p-1 shadow-2xl">
        <div className="rounded-lg bg-black px-3.5 py-3 font-mono text-[10px] w-[280px]">
          <div className="mb-2 flex items-center justify-between border-b border-gray-700 pb-1.5">
            <span className="text-flow">5008 CorDiax</span>
            <span className="calm-pulse text-green-400">● TREATMENT</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {fields.map(([label, value]) => (
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
    </Html>
  );
}

// ── Beat 4 — evidence bar + CTA → My Path (75 → 100%) ──────────────────────
function EvidenceBar({ progressRef, isReturning }: { progressRef: React.MutableRefObject<number>; isReturning: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useFrame(() => {
    const p = progressRef.current;
    if (ref.current) {
      ref.current.style.opacity = String(p);
      ref.current.style.transform = `translateY(${(1 - p) * 14}px)`;
    }
  });

  const trials = ["CONTRAST", "ESHOL", "CONVINCE"];

  return (
    <Html center position={[0, 0.05, 0.6]}>
      <div ref={ref} className="flex flex-col items-center gap-3 text-center" style={{ opacity: 0 }}>
        <div className="flex items-center gap-1.5">
          {trials.map((name) => (
            <span key={name} className="rounded-full border border-white/15 bg-black/30 px-2 py-0.5 text-[9px] font-medium text-muted">
              {name}
            </span>
          ))}
        </div>
        <div className="relative h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
          <div className="absolute inset-y-0 left-0 rounded-full bg-[var(--color-flow)]" style={{ width: "82%" }} />
          <span className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[#8FE05A]" style={{ left: "82%" }} />
        </div>
        <span className="text-[10px] text-muted">≥ 23 L convection · CONVINCE, PMID 37326323</span>
        <h1 className="max-w-md font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          The first interactive <span className="grad-text">HDF training</span> built for your unit
        </h1>
        <span className="btn btn-primary">Start your path</span>
        {isReturning && <span className="text-[10px] text-muted">Replay first impression anytime below</span>}
      </div>
    </Html>
  );
}

// ── Scene root — maps scroll offset (0..1) to the 4 beat windows ──────────
function Scene({ isReturning }: { isReturning: boolean }) {
  const scroll = useScroll();
  const beat1 = useRef(0);
  const beat2 = useRef(0);
  const beat3 = useRef(0);
  const beat4 = useRef(0);

  useFrame(() => {
    const o = scroll.offset;
    // Quarter boundaries (0/25/50/75/100%) with a ~4% crossfade at each seam.
    beat1.current = 1 - smoothstep(0.23, 0.27, o);
    beat2.current = smoothstep(0.23, 0.27, o) * (1 - smoothstep(0.48, 0.52, o));
    beat3.current = smoothstep(0.48, 0.52, o) * (1 - smoothstep(0.73, 0.77, o));
    beat4.current = smoothstep(0.73, 0.77, o);
  });

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 4, 4]} intensity={1} />
      <CameraRig />
      <PulseRing opacityRef={beat1} />
      <CircuitReveal opacityRef={beat2} />
      <MonitorPulse progressRef={beat3} />
      <EvidenceBar progressRef={beat4} isReturning={isReturning} />
    </>
  );
}

export default function ScrollHeroCanvas({ isReturning = false }: { isReturning?: boolean }) {
  return (
    <Canvas camera={{ position: [0, 0.3, 3.4], fov: 42 }} dpr={[1, 1.75]}>
      {/* pages≈2.8 → ~280vh pin; damping=0.5 → decision D5 scrub value */}
      <ScrollControls pages={2.8} damping={0.5}>
        <Scene isReturning={isReturning} />
      </ScrollControls>
    </Canvas>
  );
}
