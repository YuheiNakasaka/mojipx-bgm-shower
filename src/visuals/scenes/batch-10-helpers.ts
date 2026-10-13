// Shared pieces for the world landmarks of batch 10: a cached Milky Way (a glowing band, its dark rift and the dense
// stars inside it), shooting stars on their own clock, and strips of mist that drift and wrap around.
import { type Ctx, fillRect } from 'mojipx';
import { bayer, frac, hexToRgb, memoCanvas, rand } from '../kit.ts';
import type { Frame } from '../scene.ts';
import { type Rgb, setPixel } from './batch-1-helpers.ts';
import { tileX } from './batch-2-helpers.ts';
import { noise2 } from './batch-4-helpers.ts';

export type Galaxy = {
  /** The band's centre line from (x0, y0) to (x1, y1), in pixels of the layer. */
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
  /** Half the band's width in pixels; it swells and narrows along the band. */
  readonly half: number;
  readonly seed: number;
  /** Stars per pixel away from the band; the band holds several times more. */
  readonly sprinkle: number;
};

export type GalaxyColors = {
  readonly glow: string;
  readonly core: string;
  readonly dust: string;
  readonly stars: readonly string[];
};

type BandPoint = { readonly along: number; readonly across: number };

// Where a pixel sits relative to the band: how far along it (0 … 1) and how far from its centre (in half-widths).
const bandPoint = (g: Galaxy, x: number, y: number): BandPoint => {
  const dx = g.x1 - g.x0;
  const dy = g.y1 - g.y0;
  const len = Math.max(1, Math.hypot(dx, dy));
  const along = ((x - g.x0) * dx + (y - g.y0) * dy) / (len * len);
  const side = ((x - g.x0) * -dy + (y - g.y0) * dx) / len;
  const wobble = (noise2(along * 3, 1, g.seed) - 0.5) * g.half * 0.9;
  const half = g.half * (0.7 + 0.6 * noise2(along * 4, 0, g.seed));
  return { along, across: (side - wobble) / half };
};

// The band's brightness at a pixel: strongest on its centre line, clumpy, fading out toward both ends.
const bandLevel = (g: Galaxy, p: BandPoint, x: number, y: number): number => {
  const k = 1 - Math.abs(p.across);
  if (k <= 0) return 0;
  const clumps = noise2(x / 9, y / 9, g.seed + 1) * 0.6 + noise2(x / 3.5, y / 3.5, g.seed + 2) * 0.4;
  const ends = Math.min(1, Math.max(0, Math.min(p.along + 0.15, 1.15 - p.along) * 3));
  return k ** 1.3 * (0.25 + 0.95 * clumps) * ends;
};

// The dark lane of dust that splits the band along one side of its centre, broken into patches.
const inRift = (g: Galaxy, p: BandPoint): boolean => {
  const centre = 0.1 + (noise2(p.along * 6, 2, g.seed) - 0.5) * 0.4;
  const width = 0.2 * noise2(p.along * 5, 3, g.seed) * Math.max(0, noise2(p.along * 14, 4, g.seed) * 2 - 0.6);
  return p.along > 0.08 && p.along < 0.95 && Math.abs(p.across - centre) < width;
};

const starAt = (g: Galaxy, rgbs: readonly Rgb[], x: number, y: number, level: number): Rgb | null => {
  const r = rand(x + y * 4099, g.seed + 7);
  if (r >= g.sprinkle * (1 + level * 9)) return null;
  return rgbs[Math.floor(rand(x * 3 + y, g.seed + 8) * rgbs.length)] ?? null;
};

type BandRgb = { readonly glow: Rgb; readonly core: Rgb; readonly dust: Rgb };

// The band's own color at a pixel (stars aside): the dark rift, the bright core, the glow around it, or nothing.
const galaxyPixel = (rgb: BandRgb, level: number, rift: boolean, x: number, y: number): Rgb | null => {
  if (level <= 0) return null;
  if (rift) return level > 0.3 && bayer(x, y) < 0.3 ? rgb.dust : null;
  if (level > 0.55 + bayer(x, y) * 0.4) return rgb.core;
  return level > bayer(x, y) * 0.85 + 0.04 ? rgb.glow : null;
};

/** The Milky Way over a transparent layer: a clumpy glowing band with a dark rift, and stars thickest inside it. */
export const galaxyLayer = (w: number, h: number, g: Galaxy, gc: GalaxyColors): HTMLCanvasElement =>
  memoCanvas(`b10galaxy:${w}x${h}:${Object.values(g).join(',')}:${gc.glow}${gc.core}${gc.dust}${gc.stars.join('')}`, w, h, (img) => {
    const rgb = { glow: hexToRgb(gc.glow), core: hexToRgb(gc.core), dust: hexToRgb(gc.dust) };
    const starRgbs = gc.stars.map(hexToRgb);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const p = bandPoint(g, x, y);
        const level = bandLevel(g, p, x, y);
        const rift = inRift(g, p);
        const color = starAt(g, starRgbs, x, y, rift ? 0 : level) ?? galaxyPixel(rgb, level, rift, x, y);
        if (color) setPixel(img, x, y, color);
      }
  });

export type Meteor = {
  /** Seconds between shooting stars, and the band of rows they start in. */
  readonly every: number;
  readonly top: number;
  readonly span: number;
  readonly seed: number;
};

/** A shooting star now and then: a bright head racing down at a slant, its tail thinning out behind it. */
export const shootingStar = (ctx: Ctx, f: Frame, head: string, tail: string, m: Meteor): void => {
  const u = f.t / m.every + rand(m.seed, 1);
  const i = Math.floor(u);
  const age = frac(u) * m.every;
  const life = 0.8;
  if (age > life) return;
  const dir = rand(i, m.seed + 2) < 0.5 ? -1 : 1;
  const travel = age * (130 + rand(i, m.seed + 3) * 90);
  const hx = f.w * (0.15 + 0.7 * rand(i, m.seed + 4)) + dir * travel;
  const hy = m.top + m.span * rand(i, m.seed + 5) + travel * 0.42;
  const len = Math.min(travel, 22) * (1 - age / life) + 2;
  for (let k = 0; k < len; k++) {
    const x = Math.round(hx - dir * k);
    const y = Math.round(hy - k * 0.42);
    if (k > 2 && bayer(x, y) < k / len) continue;
    fillRect(ctx, k < 2 ? head : tail, x, y, 1, 1);
  }
};

export type Mist = {
  /** The strip's top row and height on screen, how fast it drifts (pixels a second) and how thick it is (0–1). */
  readonly y: number;
  readonly h: number;
  readonly speed: number;
  readonly density: number;
  readonly seed: number;
};

const MIST_W = 256;
const MIST_CELLS = 8;

// How high the cloud's billowing top reaches in a column (0 low … 1 high); it repeats every MIST_W pixels.
const billowAt = (x: number, seed: number): number =>
  noise2((x / MIST_W) * MIST_CELLS, 0.5, seed, MIST_CELLS) * 0.65 +
  noise2((x / MIST_W) * MIST_CELLS * 3, 1.5, seed + 1, MIST_CELLS * 3) * 0.35;

// A horizontally repeating bank of cloud: a billowing lit top over a shaded underside that thins out toward the bottom.
// Thin banks (low density) are dithered veils with the same outline.
const mistStrip = (light: string, shade: string, h: number, density: number, seed: number): HTMLCanvasElement =>
  memoCanvas(`b10mist:${light}:${shade}:${h}:${density}:${seed}`, MIST_W, h, (img) => {
    const lit = hexToRgb(light);
    const dim = hexToRgb(shade);
    for (let x = 0; x < MIST_W; x++) {
      const billow = billowAt(x, seed);
      const edge = h * (0.6 - 0.55 * billow);
      for (let y = Math.max(0, Math.ceil(edge)); y < h; y++) {
        const depth = (y - edge) / Math.max(1, h - edge);
        if (density * (1.25 - depth * 1.15) <= bayer(x, y)) continue;
        setPixel(img, x, y, depth < 0.3 + billow * 0.25 ? lit : dim);
      }
    }
  });

/** A bank of cloud or mist drifting sideways across the whole width (negative speed drifts left). */
export const drawMist = (ctx: Ctx, f: Frame, light: string, shade: string, m: Mist): void => {
  const h = Math.max(2, Math.round(m.h));
  tileX(ctx, mistStrip(light, shade, h, m.density, m.seed), -f.t * m.speed + m.seed * 37, Math.round(m.y), f.w);
};
