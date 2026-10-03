"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, EASE_OUT } from "@/lib/gsap";
import { SpectrumCard } from "./SpectrumCard";

export function Materials() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) => {
          gsap.from(el, {
            y: 60,
            autoAlpha: 0,
            duration: 1.5,
            ease: EASE_OUT,
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          });
        });
        gsap.to(".swatch-drift", {
          yPercent: -10,
          ease: "none",
          scrollTrigger: { trigger: rootRef.current, start: "top bottom", end: "bottom top", scrub: true },
        });
      });
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} id="object" aria-labelledby="object-title" className="bg-ink">
      <div className="mx-auto max-w-[1600px] px-5 py-28 sm:px-8 lg:px-12 lg:py-44">
        <div className="reveal grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow text-mist">03 · The object</p>
            <h2 id="object-title" className="display mt-8 t-section">
              Made slowly,
              <br />
              <em>to be kept.</em>
            </h2>
          </div>
          <p className="max-w-[26rem] text-base leading-relaxed text-mist lg:col-span-4 lg:col-start-9">
            Three materials, each chosen because it ages well. No screen, no app you need to open, no plastic anywhere you can
            touch. It should still be on your table in fifty years.
          </p>
        </div>

        <div className="mt-20 grid gap-4 lg:mt-28 lg:grid-cols-12 lg:grid-rows-2">
          <MaterialCard
            className="lg:col-span-7 lg:row-span-2"
            index="i"
            title="Mouth-blown opal glass"
            body="Each globe is blown by hand and cased in a layer of opal, so the light has no source you can find, only a glowing volume. No two are quite the same."
            spec="Ø 28 or 40 cm · 2.1 mm wall"
            visual={<OpalSwatch />}
            tall
          />
          <MaterialCard
            className="lg:col-span-5"
            index="ii"
            title="Solid brass, brushed by hand"
            body="Unlacquered, so it darkens where you touch it. In ten years the patina will be yours alone."
            spec="CZ121 brass · hand-brushed"
            visual={<BrassSwatch />}
          />
          <MaterialCard
            className="lg:col-span-5"
            index="iii"
            title="Honed travertine"
            body="Roman stone, pores filled and honed to a soft sheen. Heavy enough that the lamp never wobbles."
            spec="3.4 kg base · felt underside"
            visual={<TravertineSwatch />}
          />
        </div>

        <div className="reveal mt-28 border-t border-line pt-16 lg:mt-40 lg:pt-24">
          <SpectrumCard />
        </div>
      </div>
    </section>
  );
}

type MaterialCardProps = {
  readonly index: string;
  readonly title: string;
  readonly body: string;
  readonly spec: string;
  readonly visual: ReactNode;
  readonly className?: string;
  readonly tall?: boolean;
};

function MaterialCard({ index, title, body, spec, visual, className = "", tall = false }: MaterialCardProps) {
  return (
    <article
      className={`reveal group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-line bg-ink-2 transition-colors duration-500 hover:border-paper/25 ${className}`}
    >
      <div className={`relative flex-1 overflow-hidden ${tall ? "min-h-[24rem] lg:min-h-[34rem]" : "min-h-[14rem]"}`}>
        {visual}
      </div>
      <div
        className={`flex flex-col gap-3 p-6 sm:p-8 ${tall ? "lg:flex-row lg:items-end lg:justify-between lg:gap-10" : ""}`}
      >
        <div>
          <p className="eyebrow text-mist">
            <span className="font-display text-sm normal-case italic tracking-normal">{index}.</span> {spec}
          </p>
          <h3 className="display mt-3 t-display-sm leading-[1.05]">{title}</h3>
        </div>
        <p className="max-w-[24rem] text-base leading-relaxed text-mist">{body}</p>
      </div>
    </article>
  );
}

function OpalSwatch() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(70%_70%_at_50%_45%,#2a1d12_0%,#15120e_70%)]">
      <div className="swatch-drift relative aspect-square h-[72%] max-h-[26rem]">
        <div className="absolute inset-[-30%] rounded-full bg-[radial-gradient(circle,rgb(255_190_120/0.32)_0%,transparent_62%)]" />
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_46%,#fffaf0_0%,#ffe4bd_24%,#f1b979_52%,#b97a42_80%,#6d4421_100%)] shadow-[inset_-30px_-40px_80px_rgb(90_50_20/0.45)]" />
        <div className="absolute top-[12%] left-[20%] h-[22%] w-[30%] rotate-[-25deg] rounded-full bg-white/35 blur-xl transition-transform duration-[1500ms] ease-[var(--ease-out-expo)] group-hover:translate-x-6" />
      </div>
    </div>
  );
}

function BrassSwatch() {
  return (
    <div
      className="swatch-drift absolute inset-[-10%] transition-[filter] duration-700 group-hover:brightness-110"
      style={{
        background:
          "repeating-linear-gradient(90deg, rgb(255 255 255 / 0.07) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgb(0 0 0 / 0.08) 0 1px, transparent 1px 7px), linear-gradient(115deg, #6f5127 0%, #c9a46a 28%, #9c7a43 46%, #e6c995 62%, #a7834b 78%, #6a4c24 100%)",
      }}
    />
  );
}

function TravertineSwatch() {
  return (
    <svg className="swatch-drift absolute inset-[-10%] h-[120%] w-[120%]" preserveAspectRatio="none" aria-hidden="true">
      <filter id="travertine-noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.004 0.09" numOctaves="4" seed="7" />
        <feColorMatrix
          values="0 0 0 0 0.85
                  0 0 0 0 0.80
                  0 0 0 0 0.70
                  0 0 0 -0.9 1.05"
        />
      </filter>
      <rect width="100%" height="100%" fill="#cbbb9d" />
      <rect width="100%" height="100%" filter="url(#travertine-noise)" />
    </svg>
  );
}
