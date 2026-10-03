"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP, INTRO_SECONDS, EASE_OUT } from "@/lib/gsap";
import { formatClock, formatKelvin, PHASES } from "@/lib/daylight";
import { intensityFromLux } from "@/lib/lampScene";
import { useDaylightNow } from "@/hooks/useDaylightNow";
import { LampCanvas } from "./LampCanvas";
import { ArrowDown, ArrowRight } from "./Icons";

const FALLBACK_LIGHT = "#ffb46a";
const UNLIT_INTENSITY = 0.02;

export function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const now = useDaylightNow();
  const [lit, setLit] = useState(false);

  const light = now?.sample.lamp ?? FALLBACK_LIGHT;
  const intensity = lit ? intensityFromLux(now?.sample.lux ?? 300) : UNLIT_INTENSITY;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: reduce)", () => setLit(true));
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ delay: INTRO_SECONDS - 0.2 });
        tl.from(".hero-line", { yPercent: 115, duration: 1.6, ease: EASE_OUT, stagger: 0.11 })
          .from(".hero-fade", { autoAlpha: 0, y: 18, duration: 1.2, ease: EASE_OUT, stagger: 0.08 }, 0.5)
          .from(".hero-lamp", { autoAlpha: 0, yPercent: 4, duration: 2, ease: EASE_OUT }, 0.1)
          .call(() => setLit(true), [], 0.45);

        // As the hero leaves, the type drifts up faster than the lamp: a quiet depth cue.
        gsap.to(".hero-copy", {
          yPercent: -18,
          ease: "none",
          scrollTrigger: { trigger: rootRef.current, start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to(".hero-lamp-drift", {
          yPercent: 8,
          ease: "none",
          scrollTrigger: { trigger: rootRef.current, start: "top top", end: "bottom top", scrub: true },
        });
      });
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} id="top" aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      {/* Gradients can't transition, so the warm wash fades in by opacity instead. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 transition-opacity duration-[2400ms] ease-[var(--ease-out-expo)]"
        style={{
          opacity: lit ? 1 : 0,
          background: `radial-gradient(55% 60% at 72% 40%, ${light}30 0%, transparent 70%)`,
        }}
      />

      <div className="mx-auto grid min-h-[100svh] max-w-[1600px] grid-cols-1 px-5 sm:px-8 lg:grid-cols-12 lg:px-12">
        <div className="hero-copy pointer-events-none relative z-10 order-2 flex flex-col justify-end pb-12 lg:order-1 lg:col-span-12 lg:pt-36 lg:pb-16 [&_a]:pointer-events-auto">
          <p className="hero-fade eyebrow text-mist">The circadian lamp · Edition One of 500</p>

          <h1 id="hero-title" className="display mt-6 t-hero">
            {["Light that", "keeps time", "with the sun."].map((line) => (
              <span key={line} className="block overflow-hidden pb-[0.06em]">
                <span className="hero-line block">
                  {line === "keeps time" ? (
                    <>
                      keeps{" "}
                      <em className="italic transition-colors duration-[2000ms]" style={{ color: lit ? light : undefined }}>
                        time
                      </em>
                    </>
                  ) : (
                    line
                  )}
                </span>
              </span>
            ))}
          </h1>

          <div className="mt-10 flex max-w-[27rem] flex-col gap-8 lg:mt-12">
            <p className="hero-fade max-w-[25rem] text-base leading-relaxed text-mist">
              Aubade reproduces the colour and intensity of the daylight outside your window, minute by minute, so the
              room you live in keeps the same time your body does.
            </p>
            <div className="hero-fade flex flex-wrap items-center gap-x-7 gap-y-2">
              <a href="#configure" className="btn-brass">
                Reserve yours <ArrowRight />
              </a>
              <a href="#day" className="link-quiet text-paper">
                Watch a day pass <ArrowDown />
              </a>
            </div>
          </div>
        </div>

        {/* On desktop the lamp is its own plane behind the headline, so the type crosses its stem. */}
        <div className="hero-lamp relative order-1 flex h-[58svh] flex-col pt-20 lg:absolute lg:top-0 lg:right-[3%] lg:bottom-0 lg:h-auto lg:w-[44%] lg:pt-24 lg:pb-16">
          <div className="hero-lamp-drift min-h-0 flex-1">
            <LampCanvas
              label="The Aubade lamp: an opal glass globe on a slender brass stem and a travertine base, glowing with the colour of the current daylight."
              light={light}
              intensity={intensity}
              framing={1.3}
            />
          </div>
          <dl className="hero-fade mt-6 hidden grid-cols-2 gap-6 border-t border-line pt-5 lg:grid">
            <div>
              <dt className="eyebrow text-mist">Now in {now?.city ?? "your city"}</dt>
              <dd className="display tabular mt-2 t-display-sm">{now ? formatClock(now.sample.hour) : "--:--"}</dd>
            </div>
            <div>
              <dt className="eyebrow text-mist">{now ? PHASES[now.sample.phase].label : "Outside"}</dt>
              <dd className="display tabular mt-2 t-display-sm">{now ? formatKelvin(now.sample.kelvin) : "-"}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
