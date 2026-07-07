"use client";

// Scroll-scrubbed R3F landing hero — implements design-preview/design-system/ui_kits/landing/motion-hero.md
// (4 beats, ~280vh pin, scrub/damping 0.5). Only ever loaded client-side (dynamic ssr:false from
// ScrollHero.tsx) — safe to top-level import three/fiber/drei here, matching the DeviceScene3D.tsx
// convention already used by /devices. No GLB/texture fetch — procedural geometry only (on-prem).

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ScrollControls, useScroll, Html, Tube } from "@react-three/drei";
import * as THREE from "three";

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// ── Beat 1 — Pulse-R ring assembles ────────────────────────────────────────
function PulseRing({ opacityRef }: { opacityRef: React.MutableRefObject<number> }) {
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const pulseMat = useRef<THREE.MeshBasicMaterial>(null);
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    const o = opacityRef.current;
    if (ringMat.current) ringMat.current.opacity = o * 0.9;
    if (pulseMat.current) pulseMat.current.opacity = o;
    if (group.current) group.current.scale.setScalar(THREE.MathUtils.lerp(0.7, 1, Math.min(1, o * 1.6)));
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
    </group>
  );
}

// ── Beat 2 — extracorporeal circuit reveal ─────────────────────────────────
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
    </group>
  );
}

// ── Beat 3 — differentiator callouts (Html anchors) ────────────────────────
function Differentiators({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const refs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];

  useFrame(() => {
    const p = progressRef.current;
    const stagger = [0, 0.12, 0.24];
    refs.forEach((r, i) => {
      if (!r.current) return;
      const local = smoothstep(stagger[i], stagger[i] + 0.35, p);
      r.current.style.opacity = String(local);
      r.current.style.transform = `translateY(${(1 - local) * 10}px)`;
    });
  });

  const items = [
    { pos: [-0.4, 0.5, 0] as [number, number, number], label: "3D 5008 / HDF setup" },
    { pos: [0.7, 0.55, 0] as [number, number, number], label: "Evidence-cited outcomes" },
    { pos: [-2.2, 0.2, 0] as [number, number, number], label: "Symptom-driven patient sim" },
  ];

  return (
    <>
      {items.map((item, i) => (
        <Html key={item.label} position={item.pos} center distanceFactor={6}>
          <div
            ref={refs[i]}
            className="glass-panel whitespace-nowrap px-3 py-1.5 text-[11px] font-medium text-text"
            style={{ opacity: 0, transition: "none" }}
          >
            {item.label}
          </div>
        </Html>
      ))}
    </>
  );
}

// ── Beat 4 — resolve into CTA ───────────────────────────────────────────────
// Decorative only (this whole canvas sits behind aria-hidden — see ScrollHero.tsx) so the
// CTA below is a non-focusable span, never a real link/button. The real, keyboard-reachable
// CTA lives in the unchanged ReturningUser/RolePicker content this hero scrolls into.
function ResolveCTA({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const ref = useRef<HTMLDivElement>(null);
  useFrame(() => {
    const p = progressRef.current;
    if (ref.current) {
      ref.current.style.opacity = String(p);
      ref.current.style.transform = `translateY(${(1 - p) * 14}px)`;
    }
  });
  return (
    <Html center position={[0, 0.1, 0.4]}>
      <div ref={ref} className="flex flex-col items-center gap-3 text-center" style={{ opacity: 0 }}>
        <span className="badge badge-flow">Your dialysis unit, simulated</span>
        <h1 className="max-w-md font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          The first interactive <span className="grad-text">HDF training</span> built for your unit
        </h1>
        <span className="btn btn-primary">Start your path</span>
      </div>
    </Html>
  );
}

// ── Scene root — maps scroll offset (0..1) to the 4 beat windows ──────────
function Scene() {
  const scroll = useScroll();
  const beat1 = useRef(0);
  const beat2 = useRef(0);
  const beat3 = useRef(0);
  const beat4 = useRef(0);

  useFrame(() => {
    const o = scroll.offset;
    beat1.current = 1 - smoothstep(0.18, 0.28, o); // fades out as beat 2 begins
    beat2.current = smoothstep(0.2, 0.32, o) * (1 - smoothstep(0.72, 0.8, o));
    beat3.current = smoothstep(0.5, 0.58, o) * (1 - smoothstep(0.9, 1, o));
    beat4.current = smoothstep(0.78, 0.92, o);
  });

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 4, 4]} intensity={1} />
      <PulseRing opacityRef={beat1} />
      <CircuitReveal opacityRef={beat2} />
      <Differentiators progressRef={beat3} />
      <ResolveCTA progressRef={beat4} />
    </>
  );
}

export default function ScrollHeroCanvas() {
  return (
    <Canvas camera={{ position: [0, 0.3, 3.4], fov: 42 }} dpr={[1, 1.75]}>
      {/* pages≈2.8 → ~280vh pin; damping=0.5 → decision D5 scrub value */}
      <ScrollControls pages={2.8} damping={0.5}>
        <Scene />
      </ScrollControls>
    </Canvas>
  );
}
