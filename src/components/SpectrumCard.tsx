"use client";

import { useId, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { SPECTRUM_STOPS, spectrumLine, spectrumPath } from "@/lib/spectrum";
import { formatKelvin } from "@/lib/daylight";

const PRESETS = [
  { id: "candle", label: "Night", kelvin: 1800 },
  { id: "dawn", label: "Dawn", kelvin: 2400 },
  { id: "noon", label: "Noon", kelvin: 6500 },
  { id: "dusk", label: "Golden hour", kelvin: 3200 },
] as const;

type PresetId = (typeof PRESETS)[number]["id"];

const WIDTH = 800;
const HEIGHT = 260;
const AXIS_LABELS = [380, 480, 580, 680, 780];

/** Spectral power chart that morphs between moments of the day. Curves are Planck's law, not artwork. */
export function SpectrumCard() {
  const [active, setActive] = useState<PresetId>("noon");
  const pathRef = useRef<SVGPathElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const gradientId = useId();
  const fadeId = useId();
  const kelvin = PRESETS.find((p) => p.id === active)?.kelvin ?? 6500;

  useGSAP(
    () => {
      const path = pathRef.current;
      const line = lineRef.current;
      if (!path || !line) return;
      const area = spectrumPath(kelvin, WIDTH, HEIGHT);
      const curve = spectrumLine(kelvin, WIDTH, HEIGHT);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const morph = { duration: reduce ? 0 : 1.1, ease: "expo.out", overwrite: true };
      gsap.to(path, { attr: { d: area }, ...morph });
      gsap.to(line, { attr: { d: curve }, ...morph });
    },
    { dependencies: [kelvin] },
  );

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
      <div className="lg:col-span-4">
        <p className="eyebrow text-mist">Eleven-channel spectral engine</p>
        <h3 className="display mt-4 t-display-sm leading-[1.02]">
          Not a dimmer.
          <br />
          <em>A whole spectrum.</em>
        </h3>
        <p className="mt-5 max-w-[24rem] text-base leading-relaxed text-mist">
          Eleven LED channels blend into the shape of real daylight, from ember to blue-white noon. Colour rendering stays at
          CRI 98 across the whole day, so skin and wood look like themselves.
        </p>
        <div role="group" aria-label="Moment of the day" className="mt-8 grid max-w-[24rem] grid-cols-2 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              aria-pressed={active === preset.id}
              onClick={() => setActive(preset.id)}
              className={`eyebrow min-h-11 rounded-full border px-4 transition-colors duration-300 ${
                active === preset.id
                  ? "border-brass bg-brass text-ink"
                  : "border-line text-mist hover:border-paper/40 hover:text-paper"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <figure className="lg:col-span-8">
        <div className="relative">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="h-auto w-full overflow-visible"
            role="img"
            aria-label={`Spectral power distribution at ${formatKelvin(kelvin)}.`}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
                {SPECTRUM_STOPS.map((stop) => (
                  <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
                ))}
              </linearGradient>
              {/* The spectral wash fades toward the baseline: colour as a hint, the hairline as the data. */}
              <linearGradient id={fadeId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
                <stop offset="1" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
              <mask id={`${fadeId}-mask`}>
                <rect width={WIDTH} height={HEIGHT} fill={`url(#${fadeId})`} />
              </mask>
            </defs>
            {[0.25, 0.5, 0.75].map((y) => (
              <line key={y} x1="0" x2={WIDTH} y1={HEIGHT * y} y2={HEIGHT * y} stroke="rgb(243 237 227 / 0.07)" />
            ))}
            <path
              ref={pathRef}
              d={spectrumPath(6500, WIDTH, HEIGHT)}
              fill={`url(#${gradientId})`}
              mask={`url(#${fadeId}-mask)`}
            />
            <path
              ref={lineRef}
              d={spectrumLine(6500, WIDTH, HEIGHT)}
              fill="none"
              stroke="var(--color-paper)"
              strokeWidth="1.25"
              vectorEffect="non-scaling-stroke"
            />
            <line x1="0" x2={WIDTH} y1={HEIGHT} y2={HEIGHT} stroke="rgb(243 237 227 / 0.3)" />
          </svg>
          <p className="display tabular pointer-events-none absolute top-0 right-0 t-display-sm">
            {formatKelvin(kelvin)}
          </p>
        </div>
        <figcaption className="mt-3 flex justify-between">
          {/* Phones keep the unit on the last label only, so each label stays on one line. */}
          {AXIS_LABELS.map((nm, i) => (
            <span key={nm} className="eyebrow tabular whitespace-nowrap text-mist">
              {nm}
              <span className={i < AXIS_LABELS.length - 1 ? "max-sm:hidden" : undefined}> nm</span>
            </span>
          ))}
        </figcaption>
      </figure>
    </div>
  );
}
