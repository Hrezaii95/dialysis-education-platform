"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Text,
  RoundedBox,
  Tube,
  Html,
} from "@react-three/drei";
import * as THREE from "three";

function BloodLine({
  points,
  color = "#dc2626",
}: {
  points: THREE.Vector3[];
  color?: string;
}) {
  const curve = new THREE.CatmullRomCurve3(points);
  return (
    <Tube args={[curve, 64, 0.04, 8, false]}>
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
    </Tube>
  );
}

function HollowFiberDialyzer({ color, convective }: { color: string; convective: number }) {
  const fibers = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    return [Math.cos(angle) * 0.12, Math.sin(angle) * 0.12] as [number, number];
  });

  return (
    <group position={[1.35, 0.15, 0]}>
      {/* Housing */}
      <mesh>
        <cylinderGeometry args={[0.32, 0.32, 1.0, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.25} transparent opacity={0.35} />
      </mesh>
      {/* End caps */}
      <mesh position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.06, 32]} />
        <meshStandardMaterial color="#444" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.52, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.06, 32]} />
        <meshStandardMaterial color="#444" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Hollow fibers */}
      {fibers.map(([x, z], i) => (
        <mesh key={i} position={[x, 0, z]}>
          <cylinderGeometry args={[0.018, 0.018, 0.95, 8]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={convective > 80 ? 0.15 : 0.05}
            metalness={0.3}
            roughness={0.5}
          />
        </mesh>
      ))}
      <Html position={[0, -0.85, 0]} center>
        <span className="rounded px-2 py-0.5 text-[10px] text-text whitespace-nowrap" style={{ background: "var(--surface-elevated)" }}>
          Dialyzer cartridge
        </span>
      </Html>
    </group>
  );
}

function Machine5008({
  color,
  autoSub,
  systemLabel,
}: {
  color: string;
  autoSub: boolean;
  systemLabel: string;
}) {
  const rollerRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (rollerRef.current) rollerRef.current.rotation.y += delta * 1.2;
  });

  return (
    <group position={[-0.55, 0, 0]}>
      {/* Main cabinet */}
      <RoundedBox args={[1.1, 2.1, 0.72]} radius={0.06} position={[0, 0, 0]}>
        <meshStandardMaterial color={color} metalness={0.55} roughness={0.35} />
      </RoundedBox>

      {/* Touchscreen */}
      <mesh position={[0, 0.55, 0.38]}>
        <boxGeometry args={[0.75, 0.55, 0.04]} />
        <meshStandardMaterial color="#0a0a0a" emissive="#1d3a88" emissiveIntensity={0.25} />
      </mesh>
      <Text position={[0, 0.55, 0.42]} fontSize={0.07} color="#5eead4" anchorX="center">
        {systemLabel}
      </Text>

      {/* Blood pump housing */}
      <group ref={rollerRef} position={[0.42, -0.15, 0.38]}>
        <mesh>
          <cylinderGeometry args={[0.14, 0.14, 0.12, 24]} />
          <meshStandardMaterial color="#333" metalness={0.6} roughness={0.3} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]} position={[0.1, 0, 0]}>
            <boxGeometry args={[0.06, 0.04, 0.04]} />
            <meshStandardMaterial color="#888" metalness={0.7} />
          </mesh>
        ))}
      </group>

      {/* DIASAFE module */}
      <mesh position={[-0.35, -0.55, 0.35]}>
        <boxGeometry args={[0.28, 0.35, 0.18]} />
        <meshStandardMaterial color="#0d9488" metalness={0.4} roughness={0.4} />
      </mesh>
      <Html position={[-0.35, -0.85, 0.35]} center>
        {/* HTML overlay label (not a 3D material) — brand blue, retiring the legacy teal chip to match the DIASAFE legend swatch in app/devices/page.tsx */}
        <span className="rounded bg-blue-900/90 px-1.5 py-0.5 text-[9px] text-blue-100">DIASAFE®plus</span>
      </Html>

      {/* Substitution ONLINE port */}
      <mesh position={[0.2, -0.7, 0.35]}>
        <cylinderGeometry args={[0.05, 0.05, 0.12, 16]} />
        <meshStandardMaterial color={autoSub ? "#22c55e" : "#555"} emissive={autoSub ? "#22c55e" : "#000"} emissiveIntensity={autoSub ? 0.4 : 0} />
      </mesh>

      {/* Fluid ports */}
      {[-0.15, 0.15].map((y, i) => (
        <mesh key={i} position={[0.52, y, 0.2]}>
          <cylinderGeometry args={[0.04, 0.04, 0.1, 12]} />
          <meshStandardMaterial color="#c9a227" metalness={0.8} />
        </mesh>
      ))}

      {/* Base / wheels */}
      {[-0.35, 0.35].map((x, i) => (
        <mesh key={i} position={[x, -1.12, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.06, 16]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      ))}

      {autoSub && (
        <Html position={[0.2, -0.95, 0.5]} center>
          <span className="rounded-full bg-green-600/90 px-2 py-0.5 text-[9px] text-white animate-pulse">
            AutoSub plus ACTIVE
          </span>
        </Html>
      )}
    </group>
  );
}

function FluidBag({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.35, 0.55, 0.12]} />
        <meshStandardMaterial color="#e0f2fe" transparent opacity={0.85} roughness={0.2} />
      </mesh>
      <Tube
        args={[
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0.3, 0),
            new THREE.Vector3(0.4, 0.5, 0.2),
            new THREE.Vector3(0.9, 0.3, 0.3),
          ]),
          32,
          0.025,
          8,
          false,
        ]}
      >
        <meshStandardMaterial color="#38bdf8" />
      </Tube>
      <Html position={[0, -0.45, 0]} center>
        <span className="rounded bg-sky-900/80 px-1.5 py-0.5 text-[9px] text-sky-100">Substitution fluid</span>
      </Html>
    </group>
  );
}

export function DeviceScene3D({
  systemColor,
  dialyzerColor,
  autoSub,
  systemLabel,
  convective,
}: {
  systemColor: string;
  dialyzerColor: string;
  autoSub: boolean;
  systemLabel: string;
  convective: number;
}) {
  const arterial = [
    new THREE.Vector3(-1.8, -0.3, 0.3),
    new THREE.Vector3(-1.1, -0.1, 0.35),
    new THREE.Vector3(-0.2, 0.0, 0.25),
    new THREE.Vector3(0.9, 0.15, 0),
  ];
  const venous = [
    new THREE.Vector3(1.8, 0.15, 0),
    new THREE.Vector3(1.1, 0.35, 0.2),
    new THREE.Vector3(0.2, 0.55, 0.3),
    new THREE.Vector3(-0.2, 0.55, 0.38),
  ];

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-3, 2, -2]} intensity={0.4} />
      <Environment preset="warehouse" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.15, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
      </mesh>

      <Machine5008 color={systemColor} autoSub={autoSub} systemLabel={systemLabel} />
      <HollowFiberDialyzer color={dialyzerColor} convective={convective} />
      <FluidBag position={[1.9, -0.2, 0.5]} />

      <BloodLine points={arterial} />
      <BloodLine points={venous} color="#b91c1c" />

      {/* Patient connection stub */}
      <Html position={[-1.9, -0.3, 0.3]} center>
        <span className="rounded bg-red-900/80 px-1.5 py-0.5 text-[9px] text-red-100">Arterial access</span>
      </Html>
      <Html position={[1.9, 0.35, 0.2]} center>
        <span className="rounded bg-red-900/80 px-1.5 py-0.5 text-[9px] text-red-100">Venous return</span>
      </Html>

      <OrbitControls
        enablePan={false}
        minDistance={2.8}
        maxDistance={7}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.1}
        target={[0.4, 0, 0]}
      />
    </>
  );
}
