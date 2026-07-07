"use client";

// Wrapper for the scroll-scrubbed landing hero (design-preview/design-system/ui_kits/landing/motion-hero.md).
// Reduced-motion / low-spec visitors get NO scroll-scrubbed hero at all — page.tsx's existing static
// HeroCircuit + copy underneath renders unchanged, so the onboarding IA never depends on this component
// mounting. Revised 2026-07-07: dropped the WebGL/R3F device-sim scene (owner: "looks broken") in favor
// of a pure SVG/CSS/DOM motion scene — see ScrollHeroScene.tsx.

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ScrollHeroScene = dynamic(() => import("./ScrollHeroScene"), {
  ssr: false,
  loading: () => null,
});

export function ScrollHero() {
  const [canAnimate, setCanAnimate] = useState(false);
  const [isReturning, setIsReturning] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowSpec = document.documentElement.dataset.enhLowspec === "off";
    setCanAnimate(!reduceMotion && !lowSpec);
    setIsReturning(window.localStorage.getItem("raouf.impression_seen") === "1");
  }, []);

  if (!canAnimate) return null;

  // No fixed height / overflow here — ScrollHeroScene owns its own ~280vh pin + sticky viewport
  // internally. Wrapping it in overflow-hidden here would break position:sticky.
  return (
    <div className="hidden sm:block" aria-hidden="true">
      <ScrollHeroScene isReturning={isReturning} />
    </div>
  );
}
