"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/** Lower lerp = longer, silkier glide. 0.07 keeps it responsive without feeling floaty. */
const LERP = 0.07;
const WHEEL_MULTIPLIER = 0.85;
const TOUCH_MULTIPLIER = 1.4;

const LenisContext = createContext<Lenis | null>(null);

/** The active Lenis instance, or null when the visitor prefers reduced motion (native scroll). */
export const useLenis = () => useContext(LenisContext);

/**
 * Lenis smooth scroll driven by GSAP's ticker, so ScrollTrigger scenes and
 * scrolling share one animation frame (no pinned-section jitter).
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (reducedMotion) return;
    const instance = new Lenis({
      autoRaf: false,
      anchors: true,
      lerp: LERP,
      wheelMultiplier: WHEEL_MULTIPLIER,
      touchMultiplier: TOUCH_MULTIPLIER,
    });
    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    // Publishing the instance is the point of this effect: consumers need it to stop/start scrolling.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLenis(instance);
    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      setLenis(null);
    };
  }, [reducedMotion]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
