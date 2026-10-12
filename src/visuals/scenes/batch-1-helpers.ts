// Shared pieces for the nature scenes of batch 1: cached layers, sprite palettes, dithered fills and glows,
// clouds, chimney smoke and flocks of birds. Everything still lands on whole pixels.
import { type Ctx, drawSprite, type Palette, type Sprite } from 'mojipx';
import { bayer, frac, hexToRgb, noise1, rand } from '../kit.ts';
import type { Colors, Frame } from '../scene.ts';

const layers = new Map<string, HTMLCanvasElement>();
const LAYER_LIMIT = 96;

/** A layer painted once with canvas calls and reused while its key (size + colors) stays the same. */
export const memoLayer = (key: string, w: number, h: number, paint: (ctx: Ctx) => void): HTMLCanvasElement => {
  const hit = layers.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(w));
  canvas.height = Math.max(1, Math.ceil(h));
  const ctx = canvas.getContext('2d');
  if (ctx) paint(ctx);
  if (layers.size >= LAYER_LIMIT) layers.delete(layers.keys().next().value as string);
  layers.set(key, canvas);
  return canvas;
};

/** A layer painted pixel by pixel; pixels left untouched stay transparent. */
export const memoPixels = (key: string, w: number, h: number, paint: (img: ImageData) => void): HTMLCanvasElement =>
  memoLayer(key, w, h, (ctx) => {
    const img = ctx.createImageData(Math.max(1, Math.ceil(w)), Math.max(1, Math.ceil(h)));
    paint(img);
    ctx.putImageData(img, 0, 0);
  });

export const setPixel = (img: ImageData, x: number, y: number, rgb: readonly [number, number, number]): void => {
  const o = (y * img.width + x) * 4;
  img.data[o] = rgb[0];
  img.data[o + 1] = rgb[1];
  img.data[o + 2] = rgb[2];
  img.data[o + 3] = 255;
};

export type Rgb = readonly [number, number, number];

/** A rectangle on the canvas, in pixels. */
export type Box = { readonly x: number; readonly y: number; readonly w: number; readonly h: number };

/** A disc of radius r painted pixel by pixel; `pick` colors each pixel inside it (null leaves it clear). */
export const discImage = (key: string, r: number, pick: (x: number, y: number) => Rgb | null): HTMLCanvasElement =>
  memoPixels(`disc:${key}:${r}`, r * 2 + 1, r * 2 + 1, (img) => {
    for (let y = 0; y <= r * 2; y++)
      for (let x = 0; x <= r * 2; x++) {
        const rgb = Math.hypot(x - r, y - r) <= r + 0.4 ? pick(x, y) : null;
        if (rgb) setPixel(img, x, y, rgb);
      }
  });

const colorKeys = new WeakMap<object, string>();

/** A short cache key for a color set (computed once per set). */
export const colorKey = (c: Colors<string>): string => {
  const hit = colorKeys.get(c);
  if (hit) return hit;
  const key = Object.values(c).join('');
  colorKeys.set(c, key);
  return key;
};

/** A sprite palette derived once per color set: sprite canvases are cached by palette identity. */
export const paletteBy = <K extends string>(build: (c: Colors<K>) => Palette): ((c: Colors<K>) => Palette) => {
  const memo = new WeakMap<Colors<K>, Palette>();
  return (c) => {
    const hit = memo.get(c);
    if (hit) return hit;
    const p = build(c);
    memo.set(c, p);
    return p;
  };
};

/** x wrapped into [0, m). */
export const wrap = (x: number, m: number): number => ((x % m) + m) % m;

export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

const tiles = new Map<string, CanvasPattern | null>();

// A 4×4 tile showing `color` on n of 16 pixels in ordered-dither order, as a repeating pattern.
const ditherPattern = (ctx: Ctx, color: string, n: number): CanvasPattern | null => {
  const key = `${color}:${n}`;
  if (tiles.has(key)) return tiles.get(key) ?? null;
  const tile = memoPixels(`tile:${key}`, 4, 4, (img) => {
    const rgb = hexToRgb(color);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (bayer(x, y) < n / 16) setPixel(img, x, y, rgb);
  });
  const pattern = ctx.createPattern(tile, 'repeat');
  tiles.set(key, pattern);
  return pattern;
};

/** The fill style for `color` covering the share `level` (0–1) of pixels, or null when nothing would show. */
export const ditherStyle = (ctx: Ctx, color: string, level: number): string | CanvasPattern | null => {
  const n = Math.round(clamp01(level) * 16);
  if (n <= 0) return null;
  return n >= 16 ? color : ditherPattern(ctx, color, n);
};

/** A rectangle of `color` dithered over what is below it. */
export const fillDither = (ctx: Ctx, color: string, level: number, x: number, y: number, w: number, h: number): void => {
  const style = ditherStyle(ctx, color, level);
  if (!style || w <= 0 || h <= 0) return;
  ctx.fillStyle = style;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

/** A filled disc in the current fill style, as horizontal spans. */
export const spanDisc = (ctx: Ctx, cx: number, cy: number, r: number): void => {
  const x0 = Math.round(cx);
  const y0 = Math.round(cy);
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.floor(Math.sqrt(r * r - dy * dy) + 0.3);
    ctx.fillRect(x0 - half, y0 + dy, half * 2 + 1, 1);
  }
};

/**
 * A soft elliptical glow: dithered pixels whose density falls from `peak` at the centre to nothing at the rim.
 * With `bands`, the density steps in that many even rings, each an even dither pattern.
 */
export const glowCanvas = (color: string, rx: number, ry: number, peak: number, bands = 0): HTMLCanvasElement =>
  memoPixels(`glow:${color}:${rx}:${ry}:${peak}:${bands}`, rx * 2 + 1, ry * 2 + 1, (img) => {
    const rgb = hexToRgb(color);
    for (let y = 0; y <= ry * 2; y++)
      for (let x = 0; x <= rx * 2; x++) {
        const d = Math.hypot((x - rx) / Math.max(1, rx), (y - ry) / Math.max(1, ry));
        const smooth = d < 1 ? peak * (1 - d) ** 1.4 : 0;
        const level = bands > 0 ? (Math.ceil((1 - d) * bands) / bands) * peak : smooth;
        if (d < 1 && level > bayer(x, y)) setPixel(img, x, y, rgb);
      }
  });

export const drawGlow = (ctx: Ctx, color: string, cx: number, cy: number, rx: number, ry: number, peak: number, bands = 0): void => {
  const r = Math.max(1, Math.round(rx));
  const q = Math.max(1, Math.round(ry));
  ctx.drawImage(glowCanvas(color, r, q, peak, bands), Math.round(cx) - r, Math.round(cy) - q);
};

/** A puffy cloud: overlapping discs on a flat base, light on top and shaded underneath; cached per shape and colors. */
export const cloudCanvas = (seed: number, size: number, light: string, shade: string): HTMLCanvasElement => {
  const s = Math.max(4, Math.round(size));
  const w = s * 3;
  const h = s + 2;
  return memoPixels(`cloud:${seed}:${s}:${light}:${shade}`, w, h, (img) => {
    const lit = hexToRgb(light);
    const dark = hexToRgb(shade);
    const puffs = [0, 1, 2, 3].map((k) => {
      const r = s * (0.32 + 0.3 * rand(k, seed)) * (k === 1 || k === 2 ? 1.25 : 0.8);
      return { x: s * (0.45 + k * 0.7), y: h - 1 - r * 0.7, r };
    });
    const band = Math.max(2, s * 0.32);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (!puffs.some((p) => Math.hypot(x - p.x, y - p.y) <= p.r)) continue;
        setPixel(img, x, y, (y - (h - 1 - band)) / band > bayer(x, y) ? dark : lit);
      }
  });
};

/** Clouds drifting sideways and wrapping around, spread over the band [top, top + span) of the sky. */
export const driftingClouds = (
  ctx: Ctx,
  f: Frame,
  light: string,
  shade: string,
  opts: {
    readonly count: number;
    readonly top: number;
    readonly span: number;
    readonly size: number;
    readonly speed: number;
    readonly seed: number;
  },
): void => {
  for (let i = 0; i < opts.count; i++) {
    const size = opts.size * (0.6 + 0.6 * rand(i, opts.seed));
    const cloud = cloudCanvas(i % 3, size, light, shade);
    const lane = f.w + cloud.width;
    const x = wrap(rand(i, opts.seed + 1) * lane + f.t * opts.speed * (0.6 + 0.5 * rand(i, opts.seed + 2)), lane) - cloud.width;
    const y = opts.top + rand(i, opts.seed + 3) * opts.span - cloud.height;
    ctx.drawImage(cloud, Math.round(x), Math.round(y));
  }
};

/** A puff of smoke at age a (0 just out of the chimney … 1 gone): it rises, grows, leans with the wind and thins out. */
const smokePuff = (ctx: Ctx, f: Frame, x: number, y: number, color: string, a: number, k: number, rise: number): void => {
  const style = ditherStyle(ctx, color, a < 0.6 ? 1 : a < 0.82 ? 0.5 : 0.25);
  if (!style) return;
  ctx.fillStyle = style;
  const px = x + a * a * rise * 0.6 + Math.sin(f.t * 1.2 + k * 2.1) * a * 1.5;
  spanDisc(ctx, px, y - a * rise, Math.round(1.2 + a * 3.8));
};

/** A plume of smoke rising from a chimney top at (x, y). */
export const smokePlume = (ctx: Ctx, f: Frame, x: number, y: number, color: string, seed: number, rise = 34): void => {
  const puffs = 5;
  const lift = f.t * 0.22 + rand(seed, 91);
  for (let k = 0; k < puffs; k++) smokePuff(ctx, f, x, y, color, frac(lift + k / puffs), k, rise);
};

/** One bird of a flock: it crosses the screen, bobs, and flaps once per beat (each bird slightly out of step). */
const flyer = (ctx: Ctx, f: Frame, frames: readonly Sprite[], palette: Palette, i: number, lane: FlockLane): void => {
  const span = f.w + 40;
  const speed = Math.abs(lane.speed) * (0.85 + 0.3 * rand(i, lane.seed));
  const x = wrap(rand(i, lane.seed + 1) * span + f.t * speed, span) - 20;
  const y = lane.top + rand(i, lane.seed + 2) * lane.span + Math.sin(f.t * 1.3 + i * 1.9) * 2;
  const phase = frac(f.beat + rand(i, lane.seed + 3) * 0.5);
  const sprite = frames[Math.min(frames.length - 1, Math.floor(phase * frames.length))] as Sprite;
  drawSprite(ctx, sprite, palette, Math.round(lane.speed < 0 ? f.w - x : x), Math.round(y));
};

export type FlockLane = {
  readonly count: number;
  readonly top: number;
  readonly span: number;
  readonly speed: number;
  readonly seed: number;
};

/** A loose flock crossing the sky (negative speed flies right to left). */
export const flock = (ctx: Ctx, f: Frame, frames: readonly Sprite[], palette: Palette, lane: FlockLane): void => {
  for (let i = 0; i < lane.count; i++) flyer(ctx, f, frames, palette, i, lane);
};

/** A conifer silhouette: stacked tiers that widen toward the base, with an optional rim of snow on each tier. */
export const pine = (ctx: Ctx, cx: number, base: number, height: number, color: string, snow?: string): void => {
  const tiers = Math.min(7, Math.max(2, Math.round(height / 9)));
  const tierH = height / tiers;
  const halfMax = Math.max(2, height * 0.3);
  const x0 = Math.round(cx);
  ctx.fillStyle = color;
  ctx.fillRect(x0, Math.round(base - height * 0.15), 1, Math.ceil(height * 0.15));
  for (let k = 0; k < tiers; k++) {
    const top = base - height * 0.12 - (tiers - k) * tierH * 0.85;
    const bottomHalf = halfMax * (0.45 + (0.55 * (k + 1)) / tiers);
    pineTier(ctx, x0, Math.round(top), Math.round(tierH * 1.25), bottomHalf, color, k === 0 ? snow : undefined);
    if (snow) {
      ctx.fillStyle = snow;
      ctx.fillRect(x0 - Math.round(bottomHalf), Math.round(top + tierH * 1.25) - 1, Math.round(bottomHalf * 1.3), 1);
    }
  }
};

// One tier of a pine; `cap` puts snow on its top rows.
const pineTier = (ctx: Ctx, x0: number, top: number, rows: number, bottomHalf: number, color: string, cap?: string): void => {
  for (let r = 0; r < rows; r++) {
    const half = Math.round(((r + 1) / rows) * bottomHalf);
    ctx.fillStyle = cap && r < 2 ? cap : color;
    ctx.fillRect(x0 - half, top + r, half * 2 + 1, 1);
  }
};

export type RangeColors = { readonly rock: string; readonly lit: string; readonly shade: string };

type Peak = { readonly x: number; readonly top: number; readonly slope: number };

// Peaks spaced along the range, each a summit with straight flanks; the range is the highest flank at each column.
const peaksOf = (w: number, height: number, seed: number): readonly Peak[] => {
  const peaks: Peak[] = [];
  for (let i = 0, x = -height * 0.5; x < w + height; i++, x += height * (0.7 + 0.9 * rand(i, seed))) {
    peaks.push({ x, top: height * (0.45 + 0.55 * rand(i, seed + 1)), slope: 0.55 + 0.45 * rand(i, seed + 2) });
  }
  return peaks;
};

const summitAt = (peaks: readonly Peak[], x: number): { readonly peak: Peak; readonly rise: number } => {
  let best = { peak: peaks[0] as Peak, rise: Number.NEGATIVE_INFINITY };
  for (const peak of peaks) {
    const rise = peak.top - Math.abs(x - peak.x) * peak.slope;
    if (rise > best.rise) best = { peak, rise };
  }
  return best;
};

/**
 * A mountain range lit from the left (paint it into a cached layer): summits with straight flanks and a little crag,
 * snow covering the share `snow` of each summit from its top down, with a ragged lower edge.
 */
export const paintRange = (g: Ctx, w: number, bottom: number, height: number, seed: number, colors: RangeColors, snow: number): void => {
  const peaks = peaksOf(w, height, seed);
  for (let x = 0; x < w; x++) {
    const { peak, rise } = summitAt(peaks, x);
    const y = Math.round(bottom - Math.max(1, rise) - (noise1(x / 3, seed + 9) - 0.5) * 2);
    const snowBottom = bottom - peak.top * (1 - snow) + (noise1(x / 4, seed + 5) - 0.5) * height * 0.12;
    g.fillStyle = colors.rock;
    g.fillRect(x, y, 1, bottom - y);
    if (snowBottom <= y) continue;
    g.fillStyle = x < peak.x ? colors.lit : colors.shade;
    g.fillRect(x, y, 1, Math.round(Math.min(snowBottom, bottom) - y));
  }
};
