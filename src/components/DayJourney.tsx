"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { lerp, relativeLuminance } from "@/lib/color";
import {
  BRIGHT_SKY_LUMINANCE,
  formatClock,
  formatKelvin,
  formatNumber,
  PHASES,
  sampleDay,
  sunPosition,
  type PhaseId,
} from "@/lib/daylight";
import { intensityFromLux } from "@/lib/lampScene";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { LampCanvas, type LampHandle } from "./LampCanvas";

const START_HOUR = 4.5;
const END_HOUR = 23.5;
/** Scroll distance of the pinned day, in viewport heights. */
const SCROLL_VIEWPORTS = 5;
const RULER_HOURS = Array.from({ length: 19 }, (_, i) => i + 5);

// Sun arc geometry inside the SVG viewBox (0 0 1000 260). Kept in the upper third, clear of the copy.
const ARC_LEFT = 40;
const ARC_WIDTH = 920;
const ARC_BASE = 236;
const ARC_HEIGHT = 200;

const hourToProgress = (hour: number) => (hour - START_HOUR) / (END_HOUR - START_HOUR);
const INITIAL = sampleDay(START_HOUR);

const INK = { fg: "#0d0b09", muted: "rgb(13 11 9 / 0.86)", line: "rgb(13 11 9 / 0.2)" };
const PAPER = { fg: "#f3ede3", muted: "rgb(243 237 227 / 0.86)", line: "rgb(243 237 227 / 0.22)" };

/** Seconds the scene takes to catch up with the scroll position. */
const SCRUB_SMOOTHING = 0.6;

/**
 * Last value written per element and property. Scroll paints run every frame; skipping
 * unchanged writes avoids style recalculation across the whole pinned stage.
 */
const written = new WeakMap<Element, Map<string, string>>();

function writeVar(el: HTMLElement, name: string, value: string) {
  const cache = written.get(el) ?? new Map<string, string>();
  written.set(el, cache);
  if (cache.get(name) === value) return;
  cache.set(name, value);
  el.style.setProperty(name, value);
}

function writeText(el: HTMLElement | null, value: string) {
  if (el && el.textContent !== value) el.textContent = value;
}

/** Sets --fg{suffix}, --fg{suffix}-muted and --fg{suffix}-line for dark or light text. */
function writeInk(el: HTMLElement, suffix: string, darkText: boolean) {
  const ink = darkText ? INK : PAPER;
  writeVar(el, `--fg${suffix}`, ink.fg);
  writeVar(el, `--fg${suffix}-muted`, ink.muted);
  writeVar(el, `--fg${suffix}-line`, ink.line);
}

export function DayJourney() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const kelvinRef = useRef<HTMLSpanElement>(null);
  const luxRef = useRef<HTMLSpanElement>(null);
  const melanopicRef = useRef<HTMLSpanElement>(null);
  const sunRef = useRef<SVGGElement>(null);
  const markerRef = useRef<HTMLSpanElement>(null);
  const lampRef = useRef<LampHandle>(null);
  const phaseRef = useRef<PhaseId>(INITIAL.phase);

  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<PhaseId>(INITIAL.phase);
  const [manualHour, setManualHour] = useState(7);

  /** Paints one moment of the day straight to the DOM: called on every scroll frame, so no React renders. */
  const paint = useCallback((hour: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const s = sampleDay(hour);
    const darkness = Math.max(0, 1 - relativeLuminance(s.sky[1]) * 9);
    const write = (name: string, value: string) => writeVar(stage, name, value);

    write("--sky-top", s.sky[0]);
    write("--sky-mid", s.sky[1]);
    write("--sky-horizon", s.sky[2]);
    writeInk(stage, "", s.isBright);
    // The readouts sit over the horizon, which is often brighter than mid-sky: they get their own ink.
    writeInk(stage, "-low", relativeLuminance(s.sky[2]) > BRIGHT_SKY_LUMINANCE);
    write("--stars", darkness.toFixed(2));
    write("--lamp", s.lamp);

    writeText(clockRef.current, formatClock(hour));
    writeText(kelvinRef.current, formatKelvin(s.kelvin));
    writeText(luxRef.current, `${formatNumber(s.lux)} lx`);
    writeText(melanopicRef.current, s.melanopic.toFixed(2));

    const sun = sunPosition(hour);
    if (sunRef.current) {
      const x = sun ? sun.x : hour < 12 ? 0 : 1;
      const arcY = Math.sqrt(Math.max(0, 1 - (2 * x - 1) ** 2));
      sunRef.current.setAttribute("transform", `translate(${ARC_LEFT + ARC_WIDTH * x} ${ARC_BASE - ARC_HEIGHT * arcY})`);
      sunRef.current.style.opacity = sun ? "1" : "0";
    }
    if (markerRef.current) {
      // Transform, not `left`: moving it never triggers layout.
      const progress = Math.min(100, Math.max(0, hourToProgress(hour) * 100));
      markerRef.current.style.transform = `translate3d(${progress.toFixed(2)}%, 0, 0)`;
    }

    lampRef.current?.setLight(s.lamp, intensityFromLux(s.lux));
    if (s.phase !== phaseRef.current) {
      phaseRef.current = s.phase;
      setPhase(s.phase);
    }
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const proxy = { hour: START_HOUR };
        paint(START_HOUR);
        // One linear tween scrubbed by scroll. The numeric scrub adds a short catch-up so the
        // clock glides between wheel notches instead of stepping.
        gsap.to(proxy, {
          hour: END_HOUR,
          ease: "none",
          onUpdate: () => paint(proxy.hour),
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top top",
            end: () => `+=${window.innerHeight * SCROLL_VIEWPORTS}`,
            pin: stageRef.current,
            scrub: SCRUB_SMOOTHING,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            // Landing mid-section (reload, anchor link) must paint the right hour straight away.
            onRefresh: (self) => paint(lerp(START_HOUR, END_HOUR, self.progress)),
          },
        });
      });
    },
    { scope: rootRef },
  );

  // Reduced motion: no pinning; a slider walks through the day instead.
  useEffect(() => {
    if (reducedMotion) paint(manualHour);
  }, [reducedMotion, manualHour, paint]);

  const stageStyle = {
    "--sky-top": INITIAL.sky[0],
    "--sky-mid": INITIAL.sky[1],
    "--sky-horizon": INITIAL.sky[2],
    "--fg": PAPER.fg,
    "--fg-muted": PAPER.muted,
    "--fg-line": PAPER.line,
    "--fg-low": PAPER.fg,
    "--fg-low-muted": PAPER.muted,
    "--fg-low-line": PAPER.line,
    "--stars": 1,
    "--lamp": INITIAL.lamp,
    background: "linear-gradient(to bottom, var(--sky-top), var(--sky-mid) 58%, var(--sky-horizon))",
  } as CSSProperties;

  return (
    <section ref={rootRef} id="day" aria-labelledby="day-title" className="relative">
      <div ref={stageRef} className="relative h-[100svh] overflow-hidden text-[var(--fg)]" style={stageStyle}>
        <div aria-hidden="true" className="stars absolute inset-0 opacity-[var(--stars)]" />

        <svg
          aria-hidden="true"
          viewBox="0 0 1000 260"
          preserveAspectRatio="xMidYMin meet"
          className="absolute inset-x-0 top-[13svh] mx-auto h-[23svh] w-auto max-w-[92%] lg:right-auto lg:left-[3%] lg:mx-0 lg:max-w-[58%]"
        >
          <path
            d={`M${ARC_LEFT} ${ARC_BASE} A ${ARC_WIDTH / 2} ${ARC_HEIGHT} 0 0 1 ${ARC_LEFT + ARC_WIDTH} ${ARC_BASE}`}
            fill="none"
            stroke="var(--fg-line)"
            strokeDasharray="2 7"
          />
          <g ref={sunRef} style={{ opacity: 0, transition: "opacity 600ms" }}>
            <circle r="22" fill="#fff4dc" opacity="0.16" />
            <circle r="12" fill="#fff4dc" opacity="0.32" />
            <circle r="6" fill="#fffaf0" />
          </g>
        </svg>

        <div className="relative mx-auto grid h-full max-w-[1600px] grid-cols-1 grid-rows-[1fr_auto] px-5 pt-24 pb-6 sm:px-8 lg:grid-cols-12 lg:px-12 lg:pb-10">
          <div className="z-10 flex flex-col justify-end lg:col-span-7 lg:pb-6">
            <p className="eyebrow text-[var(--fg-muted)]">02 · A day, in light</p>
            <h2 id="day-title" className="sr-only">
              How Aubade follows a day, from blue hour to night
            </h2>
            <p aria-live="polite" className="display mt-5 t-display-sm italic">
              {PHASES[phase].label}
            </p>
            <p className="display tabular -ml-[0.04em] text-[clamp(5.5rem,17vw,17.5rem)] leading-[0.82]" aria-hidden="true">
              <span ref={clockRef}>{formatClock(START_HOUR)}</span>
            </p>
            <p key={phase} className="caption-in mt-6 max-w-[27rem] text-base leading-relaxed text-[var(--fg-muted)]">
              {PHASES[phase].caption}
            </p>
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-[9%] bottom-[44%] lg:static lg:col-span-5 lg:pt-10 lg:pb-6">
            <LampCanvas
              ref={lampRef}
              label="The lamp, its globe changing colour and brightness with the time of day."
              light={INITIAL.lamp}
              intensity={intensityFromLux(INITIAL.lux)}
              framing={1.3}
            />
          </div>

          <div className="z-10 text-[var(--fg-low)] lg:col-span-12">
            <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-[var(--fg-low-line)] pt-4 sm:gap-8 lg:mt-0">
              <Readout label="Colour temperature" short="Colour" valueRef={kelvinRef} initial={formatKelvin(INITIAL.kelvin)} />
              <Readout label="Illuminance" short="Light" valueRef={luxRef} initial={`${formatNumber(INITIAL.lux)} lx`} />
              <Readout label="Melanopic ratio" short="Melanopic" valueRef={melanopicRef} initial={INITIAL.melanopic.toFixed(2)} />
            </dl>

            <div className="relative mt-5 hidden h-8 sm:block" aria-hidden="true">
              {RULER_HOURS.map((h) => (
                <span
                  key={h}
                  className="absolute top-0 flex -translate-x-1/2 flex-col items-center gap-1.5"
                  style={{ left: `${hourToProgress(h) * 100}%` }}
                >
                  <span className={`w-px bg-[var(--fg-low-line)] ${h % 3 === 0 ? "h-3" : "h-1.5"}`} />
                  {h % 3 === 0 && (
                    <span className="eyebrow text-[var(--fg-low-muted)]">{String(h).padStart(2, "0")}</span>
                  )}
                </span>
              ))}
              <span ref={markerRef} className="absolute inset-x-0 top-0 block will-change-transform">
                <span className="absolute -top-0.5 left-0 h-4 w-1 -translate-x-1/2 rounded-full bg-[var(--lamp)] shadow-[0_0_0_1px_var(--fg-low-line),0_0_12px_var(--lamp)]" />
              </span>
            </div>

            {reducedMotion && (
              <label className="mt-5 flex items-center gap-4">
                <span className="eyebrow shrink-0 text-[var(--fg-low-muted)]">Time of day</span>
                <input
                  type="range"
                  min={START_HOUR}
                  max={END_HOUR}
                  step={0.25}
                  value={manualHour}
                  onChange={(event) => setManualHour(Number(event.target.value))}
                  aria-valuetext={formatClock(manualHour)}
                  className="h-11 w-full accent-[var(--color-brass)]"
                />
              </label>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

type ReadoutProps = {
  label: string;
  /** Single-word label for phones, so the three values stay on one baseline. */
  short: string;
  valueRef: RefObject<HTMLSpanElement | null>;
  initial: string;
};

function Readout({ label, short, valueRef, initial }: ReadoutProps) {
  return (
    <div>
      <dt className="eyebrow text-[var(--fg-low-muted)]">
        <span className="sm:hidden" aria-hidden="true">
          {short}
        </span>
        <span className="max-sm:sr-only">{label}</span>
      </dt>
      <dd className="display tabular mt-1.5 t-display-sm">
        <span ref={valueRef}>{initial}</span>
      </dd>
    </div>
  );
}
