"use client";

import { useRef } from "react";
import { gsap, useGSAP, EASE_OUT } from "@/lib/gsap";

const STATEMENT = "For three hundred thousand years we lived by one light. Then we moved indoors,";
const STATEMENT_ITALIC = "and stopped the clock at noon.";

const STATS = [
  { value: 90, suffix: "%", label: "of our lives are now spent indoors, away from the sky that sets our body clock." },
  { value: 20, suffix: "×", label: "brighter: an overcast morning outside, against the light of a typical office." },
  { value: 4000, suffix: "\u2009K", label: "the colour most offices hold from nine to five, whatever the sky outside is doing." },
] as const;

const words = (text: string) => text.split(" ");

export function Manifesto() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Unlit words still clear 3:1 on paper, so a paused or half-scrolled frame reads as text, not a ghost.
        gsap.fromTo(
          ".manifesto-word",
          { opacity: 0.45 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.05,
            scrollTrigger: { trigger: ".manifesto-statement", start: "top 88%", end: "bottom 70%", scrub: true },
          },
        );

        gsap.utils.toArray<HTMLElement>(".stat-value").forEach((el) => {
          const target = Number(el.dataset.value);
          const counter = { v: 0 };
          gsap.to(counter, {
            v: target,
            duration: 2.2,
            ease: EASE_OUT,
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
            onUpdate: () => {
              el.textContent = Math.round(counter.v).toLocaleString("en-US");
            },
          });
        });

        gsap.from(".stat", {
          y: 40,
          autoAlpha: 0,
          duration: 1.4,
          ease: EASE_OUT,
          stagger: 0.12,
          scrollTrigger: { trigger: ".stats", start: "top 88%", once: true },
        });
      });
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} aria-labelledby="manifesto-title" className="relative bg-paper text-ink">
      <div className="mx-auto max-w-[1600px] px-5 py-20 sm:px-8 sm:py-28 short-land:py-16 lg:px-12 lg:py-44">
        <p className="eyebrow text-stone">01 · Why</p>
        <h2 id="manifesto-title" className="manifesto-statement display mt-8 max-w-[22ch] t-section leading-[1.02]">
          {words(STATEMENT).map((word, i) => (
            <span key={`a${i}`} className="manifesto-word">
              {word}{" "}
            </span>
          ))}
          <em>
            {words(STATEMENT_ITALIC).map((word, i) => (
              <span key={`b${i}`} className="manifesto-word">
                {word}{" "}
              </span>
            ))}
          </em>
        </h2>

        <dl className="stats mt-16 grid grid-cols-1 gap-x-10 gap-y-12 sm:mt-24 sm:grid-cols-3 sm:gap-x-6 lg:mt-36 lg:gap-x-10">
          {STATS.map((stat) => (
            <div key={stat.label} className="stat @container min-w-0 border-t border-line-dark pt-6">
              <dt className="sr-only">
                {stat.value}
                {stat.suffix}
              </dt>
              <dd aria-hidden="true" className="display tabular t-stat whitespace-nowrap">
                <span className="stat-value" data-value={stat.value}>
                  {stat.value.toLocaleString("en-US")}
                </span>
                <span className="text-stone">{stat.suffix}</span>
              </dd>
              <dd className="mt-4 max-w-[19rem] text-base leading-relaxed text-stone">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
