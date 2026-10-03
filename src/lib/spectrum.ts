/**
 * Spectral power distribution of an ideal black body (Planck's law), sampled
 * across the visible band. Aubade's spectral engine approximates these curves,
 * so the chart on the page is drawn from the physics rather than a picture.
 */

const PLANCK = 6.62607015e-34;
const LIGHT_SPEED = 2.99792458e8;
const BOLTZMANN = 1.380649e-23;

export const VISIBLE_MIN_NM = 380;
export const VISIBLE_MAX_NM = 780;

/** Relative spectral radiance at a wavelength (nm) for a temperature (K). */
export function planck(wavelengthNm: number, kelvin: number): number {
  const lambda = wavelengthNm * 1e-9;
  const numerator = 2 * PLANCK * LIGHT_SPEED ** 2;
  const exponent = (PLANCK * LIGHT_SPEED) / (lambda * BOLTZMANN * kelvin);
  return numerator / (lambda ** 5 * (Math.exp(exponent) - 1));
}

/** Samples normalised so the curve's peak inside the visible band is 1. */
export function normalisedSpectrum(kelvin: number, samples = 81): number[] {
  const step = (VISIBLE_MAX_NM - VISIBLE_MIN_NM) / (samples - 1);
  const values = Array.from({ length: samples }, (_, i) => planck(VISIBLE_MIN_NM + i * step, kelvin));
  const peak = Math.max(...values);
  return values.map((v) => v / peak);
}

function curvePoints(kelvin: number, width: number, height: number, samples: number): string[] {
  return normalisedSpectrum(kelvin, samples).map((v, i) => {
    const x = (i / (samples - 1)) * width;
    const y = height - v * height;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
}

/** Closed SVG area path for the spectrum inside a width × height box (y grows downward). */
export function spectrumPath(kelvin: number, width: number, height: number, samples = 81): string {
  return `M0,${height} L${curvePoints(kelvin, width, height, samples).join(" L")} L${width},${height} Z`;
}

/** Open SVG path tracing only the top of the curve, for a hairline stroke. */
export function spectrumLine(kelvin: number, width: number, height: number, samples = 81): string {
  const [first, ...rest] = curvePoints(kelvin, width, height, samples);
  return `M${first} L${rest.join(" L")}`;
}

/** Visible spectrum stops for the gradient fill under the curve (approximate sRGB). */
export const SPECTRUM_STOPS: readonly { offset: number; color: string }[] = [
  { offset: 0, color: "#4b1e8c" },
  { offset: 0.12, color: "#3d3bd6" },
  { offset: 0.25, color: "#1f8fe0" },
  { offset: 0.33, color: "#18b8a8" },
  { offset: 0.43, color: "#5fcf4a" },
  { offset: 0.52, color: "#d9e33a" },
  { offset: 0.6, color: "#ffc13a" },
  { offset: 0.7, color: "#ff7b2a" },
  { offset: 0.82, color: "#e8331f" },
  { offset: 1, color: "#6e0f12" },
];
