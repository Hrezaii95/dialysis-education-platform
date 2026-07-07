"use client";

// Wrapper for the scroll-scrubbed landing hero (design-preview/design-system/ui_kits/landing/motion-hero.md).
// Reduced-motion / low-spec visitors get NO 3D canvas at all — page.tsx's existing static HeroCircuit +
// copy underneath renders unchanged, so the onboarding IA never depends on this component mounting.

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ScrollHeroCanvas = dynamic(() => import("./ScrollHeroCanvas"), {
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

  return (
    <div className="relative hidden h-[100vh] w-full overflow-hidden rounded-2xl sm:block" aria-hidden="true">
      <ScrollHeroCanvas isReturning={isReturning} />
    </div>
  );
}
