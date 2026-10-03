"use client";

import { useRef } from "react";
import { gsap, useGSAP, EASE_OUT } from "@/lib/gsap";
import { KEYFRAMES } from "@/lib/daylight";
import { ArrowRight, Plus } from "./Icons";

const SPEC_GROUPS = [
  {
    title: "Light",
    rows: [
      ["Colour temperature", "1,800 – 6,500 K"],
      ["Illuminance", "Up to 1,200 lx at 50 cm"],
      ["Colour rendering", "CRI 98 · TM-30 Rf 96"],
      ["Spectral engine", "11 LED channels"],
      ["Flicker", "None, at any level"],
    ],
  },
  {
    title: "Intelligence",
    rows: [
      ["Sun model", "Calculated on the lamp from your coordinates"],
      ["Accounts", "None. No cloud, no app required"],
      ["Control", "Knurled brass dial · Matter over Thread"],
      ["Wake", "30-minute dawn, set from the dial"],
      ["Updates", "Signed, local, optional"],
    ],
  },
  {
    title: "Object",
    rows: [
      ["Petite", "Ø 28 cm globe · H 46 cm · 5.2 kg"],
      ["Grand", "Ø 40 cm globe · H 64 cm · 8.9 kg"],
      ["Power", "24 W max · 0.3 W standby"],
      ["Cable", "2.5 m braided linen"],
      ["Warranty", "10 years · repairable for life"],
    ],
  },
] as const;

const FAQ = [
  {
    q: "How does it know what the sky is doing?",
    a: "On setup you give it a postcode, once. From then on it calculates the sun's position for your exact location every minute, on the lamp itself, and follows the curve of a clear day. Nothing is sent anywhere.",
  },
  {
    q: "What if I want reading light at midnight?",
    a: "Turn the dial. Aubade gives you as much light as you ask for. It just keeps the colour honest, warm at night, so reading late doesn't tell your body it's noon.",
  },
  {
    q: "Will it replace my alarm?",
    a: "It's designed to. Thirty minutes before you wake, the globe brightens from a 1 lux ember to morning light, so the room tells you it's time before the alarm has to.",
  },
  {
    q: "Is the reservation binding?",
    a: "No. The deposit holds your edition number and is refunded in full, on request, any time before your lamp ships.",
  },
  {
    q: "Where is it made?",
    a: "Globes are mouth-blown in a small Central European glassworks; brass is turned and brushed in Birmingham; final assembly, testing and numbering happen by hand in the studio.",
  },
] as const;

const sunset = KEYFRAMES.find((k) => k.phase === "sunset");
const DUSK_BACKGROUND = sunset
  ? `radial-gradient(40% 30% at 50% 108%, ${sunset.lamp}cc 0%, transparent 70%), linear-gradient(to bottom, #0b0d1f 0%, ${sunset.sky[0]} 40%, ${sunset.sky[1]} 82%, ${sunset.sky[2]} 100%)`
  : "linear-gradient(#2a3366, #f2884a)";

export function Closing() {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>(".closing-reveal").forEach((el) => {
          gsap.from(el, {
            y: 50,
            autoAlpha: 0,
            duration: 1.4,
            ease: EASE_OUT,
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          });
        });
        gsap.to(".setting-sun", {
          yPercent: 28,
          ease: "none",
          scrollTrigger: { trigger: ".cta", start: "top bottom", end: "bottom top", scrub: true },
        });
      });
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef}>
      <section id="specifications" aria-labelledby="specs-title" className="bg-ink">
        <div className="mx-auto max-w-[1600px] px-5 py-28 sm:px-8 lg:px-12 lg:py-40">
          <div className="closing-reveal">
            <p className="eyebrow text-mist">05 · Specifications</p>
            <h2 id="specs-title" className="display mt-8 t-section">
              The <em>details.</em>
            </h2>
          </div>

          <div className="mt-16 grid gap-14 lg:mt-24 lg:grid-cols-3 lg:gap-10">
            {SPEC_GROUPS.map((group) => (
              <div key={group.title} className="closing-reveal">
                <h3 className="eyebrow text-paper">{group.title}</h3>
                <dl className="mt-6">
                  {group.rows.map(([term, detail]) => (
                    <div key={term} className="flex justify-between gap-6 border-t border-line py-4">
                      <dt className="text-sm text-mist">{term}</dt>
                      <dd className="text-right text-sm">{detail}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>

          <div className="mt-28 grid gap-10 lg:mt-40 lg:grid-cols-12">
            <div className="closing-reveal lg:col-span-4">
              <h2 className="display t-display-sm leading-[1.02]">
                Questions, <em>answered.</em>
              </h2>
            </div>
            <div className="closing-reveal lg:col-span-7 lg:col-start-6">
              {FAQ.map((item) => (
                <details key={item.q} className="group border-t border-line last:border-b">
                  <summary className="flex min-h-16 list-none items-center justify-between gap-6 py-5 text-base transition-colors hover:text-brass-light [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <Plus className="shrink-0 text-mist transition-transform duration-500 ease-[var(--ease-out-expo)] group-open:rotate-45" />
                  </summary>
                  <p className="caption-in max-w-[36rem] pb-7 text-base leading-relaxed text-mist">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="cta-title" className="cta relative overflow-hidden" style={{ background: DUSK_BACKGROUND }}>
        {/* The sun, half below the horizon. It sets as you scroll to the end of the page. */}
        <div
          aria-hidden="true"
          className="setting-sun pointer-events-none absolute right-[10%] -bottom-[22vw] aspect-square w-[44vw] rounded-full"
          style={{
            background: "radial-gradient(circle at 50% 40%, #fff1d6 0%, #ffd29a 30%, #f6a25f 62%, #e8794a 100%)",
            boxShadow: "0 0 120px 40px rgb(246 162 95 / 0.35), 0 0 320px 120px rgb(242 136 74 / 0.18)",
          }}
        />
        <div className="relative mx-auto flex min-h-[100svh] max-w-[1600px] flex-col items-start px-5 pt-36 pb-24 sm:px-8 lg:px-12 lg:pt-44">
          <p className="closing-reveal eyebrow text-paper/85">Edition One · 500 numbered pieces</p>
          <h2 id="cta-title" className="closing-reveal display mt-8 max-w-[14ch] t-hero">
            Let the evening <em>arrive slowly.</em>
          </h2>
          <div className="closing-reveal mt-12 flex flex-wrap items-center gap-x-8 gap-y-3">
            <a href="#configure" className="btn-brass">
              Reserve yours <ArrowRight />
            </a>
            <p className="text-sm text-paper">From $2,400 · Ships spring 2027</p>
          </div>
        </div>
      </section>

      <footer className="overflow-hidden bg-ink">
        <div className="mx-auto max-w-[1600px] px-5 pt-20 sm:px-8 lg:px-12">
          <div className="grid gap-10 border-b border-line pb-14 md:grid-cols-3">
            <p className="max-w-[22rem] text-sm leading-relaxed text-mist">
              Aubade is a concept product, designed and built by Matt Klette as a frontend portfolio piece. Nothing here is for
              sale.
            </p>
            <nav aria-label="Footer">
              <ul className="flex flex-col gap-1">
                {[
                  ["#day", "A day, in light"],
                  ["#object", "The object"],
                  ["#configure", "Configure"],
                  ["#top", "Back to the top"],
                ].map(([href, label]) => (
                  <li key={href}>
                    <a href={href} className="link-quiet !min-h-10 text-paper">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <p className="eyebrow text-mist md:text-right">
              Built with Next.js, three.js, GSAP and Lenis
              <br />
              <span className="mt-2 inline-block">© 2026</span>
            </p>
          </div>
        </div>
        <p
          aria-hidden="true"
          className="pointer-events-none pb-[1.5vw] display text-center text-[24vw] leading-[1.05] tracking-[-0.03em] italic text-paper/[0.06] select-none"
        >
          Aubade
        </p>
      </footer>
    </div>
  );
}
