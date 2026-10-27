import { clamp, lerp, mixHex, relativeLuminance } from "./color";

/**
 * The day model behind Aubade: what the sky looks like and what the lamp does
 * at each hour. Keyframes are interpolated perceptually (OKLab) so scrubbing
 * through the day never steps.
 */

export type PhaseId =
  | "night"
  | "blue-hour"
  | "dawn"
  | "sunrise"
  | "morning"
  | "zenith"
  | "afternoon"
  | "golden-hour"
  | "sunset"
  | "dusk"
  | "evening";

type Keyframe = {
  readonly hour: number;
  readonly phase: PhaseId;
  /** Sky gradient: top of frame, middle, horizon. */
  readonly sky: readonly [string, string, string];
  /** Colour of the light Aubade emits. */
  readonly lamp: string;
  readonly kelvin: number;
  readonly lux: number;
};

export const PHASES: Readonly<Record<PhaseId, { label: string; caption: string }>> = {
  night: {
    label: "Night",
    caption:
      "Under five lux and almost free of blue. Enough light to find a glass of water, too little to tell your body it's morning.",
  },
  "blue-hour": {
    label: "Blue hour",
    caption:
      "Thirty minutes before your alarm, an ember wakes inside the glass and rises the way the sky does, slowly.",
  },
  dawn: {
    label: "Dawn",
    caption: "Ember turns to amber. You wake with the light, before the alarm gets the chance.",
  },
  sunrise: {
    label: "Sunrise",
    caption: "The globe follows the sun over the horizon, warm gold brightening to clear white.",
  },
  morning: {
    label: "Morning",
    caption: "Bright, cool and generous. Your body has read this light as 'begin' for three hundred thousand years.",
  },
  zenith: {
    label: "Zenith",
    caption: "Full-spectrum 6,500 K at your desk, matched minute by minute to the sky above your roof.",
  },
  afternoon: {
    label: "Afternoon",
    caption: "The light softens as the sun leans west, a few degrees warmer every hour.",
  },
  "golden-hour": {
    label: "Golden hour",
    caption: "Blue drains from the room as the sun drops. The evening has already started.",
  },
  sunset: {
    label: "Sunset",
    caption: "Copper and rose. The globe dims with the horizon, never ahead of it.",
  },
  dusk: {
    label: "Dusk",
    caption: "Melanopic light falls to a fraction of noon. The room stays readable and warm.",
  },
  evening: {
    label: "Evening",
    caption: "Firelight, more or less. The kind of evening your grandparents' grandparents knew.",
  },
};

export const KEYFRAMES: readonly Keyframe[] = [
  { hour: 0, phase: "night", sky: ["#040509", "#080a14", "#10121f"], lamp: "#ff6a1f", kelvin: 1800, lux: 3 },
  { hour: 4.75, phase: "night", sky: ["#05070e", "#0b0f1d", "#171a2c"], lamp: "#ff6a1f", kelvin: 1800, lux: 3 },
  { hour: 5.5, phase: "blue-hour", sky: ["#0b1230", "#25305e", "#5d5478"], lamp: "#ff7d33", kelvin: 2000, lux: 12 },
  { hour: 6.25, phase: "dawn", sky: ["#26366a", "#8f6481", "#f09c63"], lamp: "#ff9a4d", kelvin: 2400, lux: 110 },
  { hour: 7, phase: "sunrise", sky: ["#5d82bd", "#e0aa8c", "#ffd29a"], lamp: "#ffba78", kelvin: 3000, lux: 380 },
  { hour: 9, phase: "morning", sky: ["#4f8fda", "#9fc6ef", "#efe7d8"], lamp: "#ffe2c0", kelvin: 4500, lux: 780 },
  { hour: 12.5, phase: "zenith", sky: ["#2f78d6", "#80b6ee", "#e3eefa"], lamp: "#f3f5ff", kelvin: 6500, lux: 1000 },
  { hour: 15.5, phase: "afternoon", sky: ["#3f83d2", "#9cc0e8", "#f2e3c7"], lamp: "#ffead0", kelvin: 5000, lux: 820 },
  { hour: 17.75, phase: "golden-hour", sky: ["#476aa6", "#dc9f6e", "#ffc278"], lamp: "#ffb46a", kelvin: 3200, lux: 420 },
  { hour: 18.75, phase: "sunset", sky: ["#2a3366", "#ad5668", "#f2884a"], lamp: "#ff9348", kelvin: 2600, lux: 200 },
  { hour: 19.5, phase: "dusk", sky: ["#12183a", "#382c55", "#76485b"], lamp: "#ff8238", kelvin: 2200, lux: 60 },
  { hour: 21, phase: "evening", sky: ["#080a1a", "#121328", "#271d2c"], lamp: "#ff7228", kelvin: 1900, lux: 22 },
  { hour: 24, phase: "night", sky: ["#040509", "#080a14", "#10121f"], lamp: "#ff6a1f", kelvin: 1800, lux: 3 },
];

export const BRIGHT_SKY_LUMINANCE = 0.18;

export const SUNRISE_HOUR = 6.6;
export const SUNSET_HOUR = 19.1;

export type DaySample = {
  readonly hour: number;
  readonly phase: PhaseId;
  readonly sky: readonly [string, string, string];
  readonly lamp: string;
  readonly kelvin: number;
  readonly lux: number;
  /** Melanopic daylight efficacy ratio, 0..1: how strongly the light reads as "day" to the body. */
  readonly melanopic: number;
  /** True when dark text should sit on the sky. */
  readonly isBright: boolean;
};

export const wrapHour = (hour: number) => ((hour % 24) + 24) % 24;

/** Smoothstep, so each keyframe is an ease rather than a corner. */
const smooth = (t: number) => t * t * (3 - 2 * t);

function bracket(hour: number): [Keyframe, Keyframe, number] {
  const nextIndex = KEYFRAMES.findIndex((k) => k.hour > hour);
  const to = KEYFRAMES[nextIndex === -1 ? KEYFRAMES.length - 1 : nextIndex];
  const from = KEYFRAMES[nextIndex <= 0 ? 0 : nextIndex - 1];
  const span = to.hour - from.hour;
  const t = span === 0 ? 0 : (hour - from.hour) / span;
  return [from, to, smooth(t)];
}

export function melanopicRatio(kelvin: number): number {
  return clamp(0.12 + ((kelvin - 1800) / (6500 - 1800)) * 0.88);
}

export function sampleDay(rawHour: number): DaySample {
  const hour = wrapHour(rawHour);
  const [from, to, t] = bracket(hour);
  const kelvin = lerp(from.kelvin, to.kelvin, t);
  // Brightness is perceived logarithmically, so interpolate lux geometrically.
  const lux = Math.exp(lerp(Math.log(from.lux), Math.log(to.lux), t));
  const sky: DaySample["sky"] = [
    mixHex(from.sky[0], to.sky[0], t),
    mixHex(from.sky[1], to.sky[1], t),
    mixHex(from.sky[2], to.sky[2], t),
  ];
  return {
    hour,
    phase: t < 0.5 ? from.phase : to.phase,
    sky,
    lamp: mixHex(from.lamp, to.lamp, t),
    kelvin,
    lux,
    melanopic: melanopicRatio(kelvin),
    // 0.18 is where ink and paper text have equal contrast against the sky.
    isBright: relativeLuminance(sky[1]) > BRIGHT_SKY_LUMINANCE,
  };
}

/** "06:42" from a fractional hour. */
export function formatClock(rawHour: number): string {
  // Epsilon absorbs float error (6.7 * 60 = 401.999…).
  const totalMinutes = Math.floor(wrapHour(rawHour) * 60 + 1e-6);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Position of the sun on a unit arc: x 0..1 across daylight, y 0..1 height. Null below the horizon. */
export function sunPosition(rawHour: number): { x: number; y: number } | null {
  const hour = wrapHour(rawHour);
  if (hour < SUNRISE_HOUR || hour > SUNSET_HOUR) return null;
  const x = (hour - SUNRISE_HOUR) / (SUNSET_HOUR - SUNRISE_HOUR);
  return { x, y: Math.sin(Math.PI * x) };
}

export function hourFromDate(date: Date): number {
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
}

/** A little past the boundary, so a timer that fires early by a few ms still lands in the new minute. */
const MINUTE_MARGIN_MS = 50;

/** Milliseconds from `nowMs` until just after the next local minute boundary. */
export function msUntilNextMinute(nowMs: number): number {
  const now = new Date(nowMs);
  return 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + MINUTE_MARGIN_MS;
}

export const formatNumber = (value: number) => Math.round(value).toLocaleString("en-US");

/** Kelvin rounded to the nearest 50, the way a spec sheet prints it. */
export const formatKelvin = (kelvin: number) => `${formatNumber(Math.round(kelvin / 50) * 50)} K`;
