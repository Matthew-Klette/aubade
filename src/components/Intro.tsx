"use client";

import { useRef } from "react";
import { gsap, useGSAP, INTRO_SECONDS } from "@/lib/gsap";

const KELVIN_FROM = 1000;
const KELVIN_TO = 6500;

/**
 * Opening curtain: a colour-temperature counter warms from candle to daylight,
 * then the curtain lifts. If scripts never run, a CSS fallback clears it.
 */
export function Intro() {
  const rootRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      const counter = counterRef.current;
      if (!root || !counter) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(root, { autoAlpha: 0, display: "none" });
      });
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const value = { k: KELVIN_FROM };
        const tl = gsap.timeline();
        tl.to(value, {
          k: KELVIN_TO,
          duration: INTRO_SECONDS - 0.5,
          ease: "power2.inOut",
          onUpdate: () => {
            counter.textContent = Math.round(value.k / 50) * 50 + "";
          },
        })
          .to(".intro-line", { scaleX: 1, duration: INTRO_SECONDS - 0.5, ease: "power2.inOut" }, 0)
          .to(".intro-content", { autoAlpha: 0, y: -24, duration: 0.5, ease: "power2.in" })
          .to(root, { clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "expo.inOut" }, "-=0.25")
          .set(root, { display: "none" });
      });
    },
    { scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="intro-fallback fixed inset-0 z-[65] grid place-items-center bg-ink"
      style={{ clipPath: "inset(0 0 0% 0)" }}
    >
      <div className="intro-content flex w-[min(22rem,80vw)] flex-col items-center gap-6">
        <p className="eyebrow text-mist">Aubade · Edition One</p>
        <p className="display tabular text-[clamp(4rem,12vw,7rem)] text-paper">
          <span ref={counterRef}>{KELVIN_FROM}</span>
          <span className="ml-3 align-top font-sans text-sm tracking-[0.2em] text-mist">K</span>
        </p>
        <span className="intro-line block h-px w-full origin-left scale-x-0 bg-gradient-to-r from-[#ff6a1f] via-[#ffd29a] to-[#f3f5ff]" />
      </div>
    </div>
  );
}
