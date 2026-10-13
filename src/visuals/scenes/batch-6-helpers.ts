// Shared pieces for the famous places of batch 6: layers cached per size and color set, water that mirrors whatever
// was drawn above it, glints and rain rings on the water, rain, snow, twinkles and strings of festoon bulbs.
import { type Ctx, fillRect } from 'mojipx';
import { bayer, cached, frac, memoLayer, rand } from '../kit.ts';
import type { Frame } from '../scene.ts';
import { colorKey, drawGlow, wrap } from './batch-1-helpers.ts';

export const wideOf = (f: Frame): boolean => f.w > f.h;

/** A static layer the size of the frame, cached per scene part, frame size and color set. */
export const frameLayer = (part: string, f: Frame, c: Readonly<Record<string, string>>, paint: (g: Ctx) => void): HTMLCanvasElement =>
  memoLayer(`b6:${part}:${f.w}x${f.h}:${colorKey(c)}`, f.w, f.h, paint);

// Scratch space for the mirror, fully overwritten every frame: the band above the water is copied once so each
// reflected row can be read from it rather than from the canvas being drawn on.
const scratches = new Map<string, CanvasRenderingContext2D | null>();
const scratchOf = (w: number, h: number): CanvasRenderingContext2D | null =>
  cached(scratches, 6, `${w}x${h}`, () => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    return canvas.getContext('2d');
  });

export type Mirror = {
  /** The water line: rows below it show the rows above it, upside down. */
  readonly axis: number;
  readonly bottom: number;
  /** Source rows per reflected row; above 1 the reflection is squashed and shows more of what stands above. */
  readonly squash: number;
  /** Ripples: the largest sideways shift (reached at the bottom), how tightly rows alternate, and how fast. */
  readonly amp: number;
  readonly freq: number;
  readonly speed: number;
  /** The water's own color, laid over the reflection with this opacity (like the color math of 16-bit consoles). */
  readonly tint: string;
  readonly tintLevel: number;
};

/** Water that reflects everything already drawn above its line, each row shifted sideways by the ripples. */
export const mirrorWater = (ctx: Ctx, f: Frame, m: Mirror): void => {
  const depth = Math.min(f.h, m.bottom) - m.axis;
  const srcH = Math.min(m.axis, Math.ceil(depth * m.squash));
  const s = depth > 0 && srcH > 0 ? scratchOf(f.w, srcH) : null;
  if (!s) return;
  s.clearRect(0, 0, f.w, srcH);
  s.drawImage(ctx.canvas, 0, m.axis - srcH, f.w, srcH, 0, 0, f.w, srcH);
  for (let k = 0; k < depth; k++) {
    const y = m.axis + k;
    const src = Math.max(0, srcH - 1 - Math.floor(k * m.squash));
    const dx = Math.round(Math.sin(y * m.freq + f.t * m.speed) * m.amp * (0.2 + (0.8 * k) / depth));
    ctx.drawImage(s.canvas, 0, src, f.w, 1, dx, y, f.w, 1);
    if (dx !== 0) ctx.drawImage(s.canvas, 0, src, f.w, 1, dx - Math.sign(dx) * f.w, y, f.w, 1);
  }
  ctx.save();
  ctx.globalAlpha = m.tintLevel;
  fillRect(ctx, m.tint, 0, m.axis, f.w, depth);
  ctx.restore();
};

/** Short bright dashes drifting on the water between two rows, flickering in and out; longer toward the viewer. */
export const glints = (ctx: Ctx, f: Frame, top: number, bottom: number, color: string, count: number, seed: number): void => {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    if (frac(f.t * (0.4 + rand(i, seed) * 0.5) + rand(i, seed + 1)) > 0.55) continue;
    const near = rand(i, seed + 2) ** 1.6;
    const len = 1 + Math.round(near * 5 * rand(i, seed + 3));
    const x = wrap(rand(i, seed + 4) * f.w + f.t * (1.5 + near * 4) * (i % 2 === 0 ? 1 : -1), f.w + 8) - 4;
    ctx.fillRect(Math.round(x), Math.round(top + near * (bottom - top)), len, 1);
  }
};

/** An ellipse outline of radius r, flattened vertically by `flat`, as single pixels. */
export const ring = (ctx: Ctx, cx: number, cy: number, r: number, flat: number, color: string): void => {
  const n = Math.max(8, Math.round(r * 5));
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * flat), 1, 1);
  }
};

/** Raindrops landing on water: rings that open and fade at random spots between two rows. */
export const rainRings = (ctx: Ctx, f: Frame, top: number, bottom: number, color: string, count: number, seed: number): void => {
  for (let i = 0; i < count; i++) {
    const phase = f.t * 1.3 + rand(i, seed);
    const drop = Math.floor(phase);
    const age = phase - drop;
    if (age > 0.75) continue;
    const near = rand(i * 37 + drop, seed + 1);
    const y = top + near * (bottom - top);
    ring(ctx, rand(i * 37 + drop, seed + 2) * f.w, y, 0.5 + age * (2 + near * 4), 0.3, color);
  }
};

export type Rain = {
  readonly count: number;
  /** Streak length in pixels and sideways pixels per pixel of fall (negative leans the other way). */
  readonly len: number;
  readonly slant: number;
  readonly speed: number;
  readonly seed: number;
};

/** Slanted rain streaks over the whole frame. */
export const rain = (ctx: Ctx, f: Frame, color: string, r: Rain): void => {
  const span = f.h + r.len;
  ctx.fillStyle = color;
  for (let i = 0; i < r.count; i++) {
    const y = wrap(rand(i, r.seed) * span + f.t * r.speed * (0.8 + 0.4 * rand(i, r.seed + 1)), span) - r.len;
    const x0 = rand(i, r.seed + 2) * (f.w + Math.abs(r.slant) * f.h);
    for (let k = 0; k < r.len; k++) {
      const x = wrap(x0 - (y + k) * r.slant, f.w + 4) - 2;
      ctx.fillRect(Math.round(x), Math.round(y + k), 1, 1);
    }
  }
};

/** Snowflakes drifting down and swaying; one in four is a nearer, bigger flake. */
export const snowfall = (ctx: Ctx, f: Frame, color: string, count: number, seed: number): void => {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const near = i % 4 === 0;
    const y = wrap(rand(i, seed) * (f.h + 4) + f.t * (near ? 14 : 7) * (0.7 + 0.6 * rand(i, seed + 1)), f.h + 4) - 2;
    const x = wrap(rand(i, seed + 2) * f.w + Math.sin(f.t * 0.9 + i * 1.7) * 3 + f.t * 3, f.w);
    ctx.fillRect(Math.round(x), Math.round(y), near ? 2 : 1, near ? 2 : 1);
  }
};

/** A four-pointed twinkle: a dot with arms of length `arm`. */
export const twinkle = (ctx: Ctx, x: number, y: number, color: string, arm: number): void => {
  fillRect(ctx, color, x - arm, y, arm * 2 + 1, 1);
  fillRect(ctx, color, x, y - arm, 1, arm * 2 + 1);
};

export type Festoon = {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
  readonly sag: number;
  /** Pixels between bulbs. */
  readonly gap: number;
};

/** A string of bulbs sagging between two points; a brighter pulse runs along it, one step per beat. */
export const festoon = (ctx: Ctx, f: Frame, s: Festoon, wire: string, bulb: string, glow: string): void => {
  const len = Math.max(1, Math.round(Math.abs(s.x1 - s.x0)));
  const at = (k: number): number => s.y0 + (s.y1 - s.y0) * (k / len) + Math.sin((k / len) * Math.PI) * s.sag;
  const dir = Math.sign(s.x1 - s.x0) || 1;
  ctx.fillStyle = wire;
  for (let k = 0; k <= len; k++) ctx.fillRect(Math.round(s.x0 + dir * k), Math.round(at(k)), 1, 1);
  const step = Math.floor(f.beat);
  for (let k = Math.round(s.gap / 2), i = 0; k < len; k += s.gap, i++) {
    const x = Math.round(s.x0 + dir * k);
    const y = Math.round(at(k)) + 1;
    const lit = (i + step) % 4 === 0;
    drawGlow(ctx, glow, x, y + 1, lit ? 5 : 3, lit ? 4 : 3, lit ? 0.8 : 0.5);
    fillRect(ctx, bulb, x, y, 1, 2);
  }
};

/** A vertical streak of light on water below a lamp: dithered dashes that wobble sideways and thin out. */
export const lightStreak = (ctx: Ctx, f: Frame, x: number, top: number, len: number, color: string): void => {
  for (let k = 0; k < len; k += 2) {
    const share = 1 - k / len;
    const y = top + k;
    const dx = Math.round(Math.sin(y * 0.8 + f.t * 2.4 + x) * (1 + k * 0.08));
    const w = share > 0.5 ? 2 : 1;
    if (bayer(x + k, y) < share * 1.2) fillRect(ctx, color, Math.round(x + dx - w / 2), y, w, 1);
  }
};
