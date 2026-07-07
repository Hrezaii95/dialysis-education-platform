"use client";

// Wrapper for the scroll-scrubbed landing hero (motion-hero.md). Reduced-motion / low-spec
// visitors get NO 3D canvas at all — page.tsx's existing static HeroCircuit + copy underneath
// renders unchanged, so the onboarding IA never depends on this component mounting.

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ScrollHeroCanvas = dynamic(() => import("./ScrollHeroCanvas"), {
  ssr: false,
  loading: () => null,
});

export function ScrollHero() {
  const [canAnimate, setCanAnimate] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowSpec = document.documentElement.dataset.enhLowspec === "off";
    setCanAnimate(!reduceMotion && !lowSpec);
  }, []);

  if (!canAnimate) return null;

  return (
    <div className="relative hidden h-[100vh] w-full overflow-hidden rounded-2xl sm:block" aria-hidden="true">
      <ScrollHeroCanvas />
    </div>
  );
}
