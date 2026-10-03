import * as THREE from "three";
import type { BaseId } from "./catalog";

/**
 * Procedural textures, drawn on canvas at runtime: no image assets to ship,
 * and every base material is reproducible from a seed.
 */

/** Drawing coordinates. The canvas itself is RESOLUTION times larger, like a retina backing store. */
const TEXTURE_WIDTH = 1024;
const TEXTURE_HEIGHT = 256;
const RESOLUTION = 2;

/** Small deterministic PRNG (mulberry32) so textures look the same on every load. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(width = TEXTURE_WIDTH, height = TEXTURE_HEIGHT) {
  const canvas = document.createElement("canvas");
  canvas.width = width * RESOLUTION;
  canvas.height = height * RESOLUTION;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas is unavailable");
  context.scale(RESOLUTION, RESOLUTION);
  return { canvas, context };
}

function drawTravertine(ctx: CanvasRenderingContext2D, random: () => number) {
  ctx.fillStyle = "#d9ccb4";
  ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  // Sedimentary bands.
  for (let i = 0; i < 70; i++) {
    const y = random() * TEXTURE_HEIGHT;
    ctx.fillStyle = random() > 0.5 ? `rgba(160,140,110,${random() * 0.18})` : `rgba(245,238,225,${random() * 0.25})`;
    ctx.fillRect(0, y, TEXTURE_WIDTH, 1 + random() * 6);
  }
  // Filled pores.
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = `rgba(150,128,96,${0.15 + random() * 0.25})`;
    ctx.beginPath();
    ctx.ellipse(random() * TEXTURE_WIDTH, random() * TEXTURE_HEIGHT, 1 + random() * 5, 0.6 + random() * 1.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMarble(ctx: CanvasRenderingContext2D, random: () => number) {
  ctx.fillStyle = "#141313";
  ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Veins drift gently across the slab as smooth curves: a soft wide bloom, then a fine bright line.
  const vein = (width: number, alpha: number, points: readonly [number, number][]) => {
    ctx.strokeStyle = `rgba(232,228,220,${alpha})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let p = 1; p < points.length - 1; p++) {
      const midX = (points[p][0] + points[p + 1][0]) / 2;
      const midY = (points[p][1] + points[p + 1][1]) / 2;
      ctx.quadraticCurveTo(points[p][0], points[p][1], midX, midY);
    }
    ctx.stroke();
  };

  for (let v = 0; v < 6; v++) {
    let x = -40 + random() * 80;
    let y = random() * TEXTURE_HEIGHT;
    let drift = (random() - 0.5) * 0.35;
    const points: [number, number][] = [[x, y]];
    while (x < TEXTURE_WIDTH + 40) {
      x += 40 + random() * 70;
      drift += (random() - 0.5) * 0.25;
      y += drift * 60;
      points.push([x, y]);
    }
    vein(4 + random() * 4, 0.05, points);
    vein(0.6 + random() * 0.9, 0.35 + random() * 0.35, points);
  }
}

function drawOak(ctx: CanvasRenderingContext2D, random: () => number) {
  ctx.fillStyle = "#47331f";
  ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  for (let i = 0; i < 140; i++) {
    const y = random() * TEXTURE_HEIGHT;
    const amplitude = 2 + random() * 6;
    ctx.strokeStyle = random() > 0.5 ? `rgba(20,12,6,${0.2 + random() * 0.3})` : `rgba(120,92,62,${0.15 + random() * 0.2})`;
    ctx.lineWidth = 0.5 + random() * 1.5;
    ctx.beginPath();
    for (let x = 0; x <= TEXTURE_WIDTH; x += 16) {
      const wave = Math.sin(x * 0.01 + i) * amplitude;
      if (x === 0) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }
}

const DRAWERS: Record<BaseId, (ctx: CanvasRenderingContext2D, random: () => number) => void> = {
  travertine: drawTravertine,
  marble: drawMarble,
  oak: drawOak,
};

export function makeBaseTexture(base: BaseId): THREE.CanvasTexture {
  const { canvas, context } = makeCanvas();
  DRAWERS[base](context, seeded(base.length * 7919));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = 16; // clamped to the GPU's maximum by three.js
  return texture;
}

type GlowStop = readonly [offset: number, alpha: number];

/** Tight falloff for the halo and the pool of light on the floor. */
const HALO_STOPS: readonly GlowStop[] = [
  [0, 1],
  [0.18, 0.55],
  [0.45, 0.14],
  [1, 0],
];

/** Broad, soft falloff for the light seen through the opal glass: a lit volume, not a bulb. */
export const VOLUME_STOPS: readonly GlowStop[] = [
  [0, 0.9],
  [0.3, 0.62],
  [0.62, 0.22],
  [0.9, 0.04],
  [1, 0],
];

/** Radial white-to-transparent texture, tinted by the material colour. */
export function makeGlowTexture(stops: readonly GlowStop[] = HALO_STOPS): THREE.CanvasTexture {
  const size = 256;
  const { canvas, context } = makeCanvas(size, size);
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([offset, alpha]) => gradient.addColorStop(offset, `rgba(255,255,255,${alpha})`));
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
