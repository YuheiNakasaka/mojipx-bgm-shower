// Shared pieces for the animals of batch 14: creatures modelled from simple shapes (ovals, boxes, triangles and
// sticks) laid over one another, rasterised in a stance (squashed on the beat, turned in a spin, mirrored) and
// outlined in ink, and where the music stands within its bar.
import { type Ctx, drawSprite, type Palette, type Sprite } from 'mojipx';
import { cached, frac } from '../kit.ts';
import type { Frame } from '../scene.ts';
import { inEllipse, outlined, spriteOf } from './batch-12-helpers.ts';

// ---- shapes, in a creature's own coordinates: x runs right from its middle, y runs down to its feet at 0 ----

/** Whether a point lies inside a shape. */
export type Inside = (x: number, y: number) => boolean;
export type V = readonly [number, number];

export const oval =
  (cx: number, cy: number, rx: number, ry: number): Inside =>
  (x, y) =>
    inEllipse(x, y, cx, cy, rx, ry);

/** The points from (x0, y0) up to, not including, (x1, y1). */
export const box =
  (x0: number, y0: number, x1: number, y1: number): Inside =>
  (x, y) =>
    x >= x0 && x < x1 && y >= y0 && y < y1;

const cross = (o: V, a: V, x: number, y: number): number => (a[0] - o[0]) * (y - o[1]) - (a[1] - o[1]) * (x - o[0]);

export const tri =
  (a: V, b: V, c: V): Inside =>
  (x, y) => {
    const d1 = cross(a, b, x, y);
    const d2 = cross(b, c, x, y);
    const d3 = cross(c, a, x, y);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  };

/** A rounded stick of radius r from a to b: limbs, tails and handles. */
export const stick =
  (a: V, b: V, r: number): Inside =>
  (x, y) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy) <= r;
  };

export const both =
  (a: Inside, b: Inside): Inside =>
  (x, y) =>
    a(x, y) && b(x, y);

/** One layer of a creature: every point inside the shape takes the palette letter; later parts cover earlier ones. */
export type Part = readonly [string, Inside];

const letterAt = (parts: readonly Part[], x: number, y: number): string => {
  for (let i = parts.length - 1; i >= 0; i--) {
    const [ch, inside] = parts[i] as Part;
    if (inside(x, y)) return ch;
  }
  return '.';
};

/** A pixel set by hand: x, y and its palette letter. */
export type Dot = readonly [number, number, string];

const withDots = (sprite: Sprite, dots: readonly Dot[]): Sprite => {
  if (dots.length === 0) return sprite;
  const rows = sprite.map((row) => [...row]);
  for (const [x, y, ch] of dots) {
    const row = rows[y];
    if (row && x >= 0 && x < row.length) row[x] = ch;
  }
  return rows.map((row) => row.join(''));
};

/**
 * A sprite modelled from parts in sprite pixels (pixel centres at .5), with `dots` set by hand, then outlined in `o`
 * all round; `marks` (whiskers, lines that should not be outlined) are set after the outline.
 */
export const figure = (w: number, h: number, parts: readonly Part[], dots: readonly Dot[] = [], marks: readonly Dot[] = []): Sprite =>
  withDots(
    outlined(
      withDots(
        spriteOf(w, h, (x, y) => letterAt(parts, x + 0.5, y + 0.5)),
        dots,
      ),
      'o',
    ),
    marks,
  );

// ---- stances ----

/** How a creature is drawn: its width and height scaled (a negative width mirrors it, a small one is mid-turn). */
export type Stance = { readonly sx: number; readonly sy: number };

const sculpts = new Map<string, Sprite>();

const rasterise = (w: number, h: number, parts: readonly Part[], sx: number, sy: number): Sprite => {
  const cols = Math.ceil(w * Math.abs(sx)) + 2;
  const rows = Math.ceil(h * sy) + 2;
  return outlined(
    spriteOf(cols, rows, (col, row) => letterAt(parts, (col + 0.5 - cols / 2) / sx, (row + 0.5 - (rows - 1)) / sy)),
    'o',
  );
};

/**
 * The creature modelled from `parts` (in a box w wide and h tall standing on y = 0) in a stance, outlined in `o`.
 * Each stance is rasterised once and kept under `key`, which must name the parts, so the same sprite comes back.
 */
export const sculpt = (key: string, w: number, h: number, parts: () => readonly Part[], stance: Stance = { sx: 1, sy: 1 }): Sprite => {
  const sx = Math.round(stance.sx * 8) / 8 || 0.125;
  const sy = Math.round(stance.sy * 25) / 25;
  return cached(sculpts, 600, `${key}:${sx}:${sy}`, () => rasterise(w, h, parts(), sx, sy));
};

/** Draws a sculpted sprite with its feet's middle at (x, foot); the outline under the feet lies on row `foot`. */
export const drawSculpt = (ctx: Ctx, sprite: Sprite, palette: Palette, x: number, foot: number): void => {
  const cols = (sprite[0] ?? '').length;
  drawSprite(ctx, sprite, palette, Math.round(x) - (cols >> 1), Math.round(foot) - sprite.length + 1);
};

// ---- the music ----

/**
 * Beats per bar. A bar is floor(beat / meter); the two meters only agree in a track's first nine beats, where 4 is
 * assumed.
 */
export const meterOf = (f: Frame): 3 | 4 => (Math.floor(f.beat / 4) === f.bar ? 4 : 3);

/** Which beat of its bar the music is on (0 first), and how far through that beat. */
export const beatInBar = (f: Frame): { readonly index: number; readonly phase: number } => {
  const meter = meterOf(f);
  const within = Math.max(0, f.beat - f.bar * meter);
  return { index: Math.min(meter - 1, Math.floor(within)), phase: frac(within) };
};

/** Beats since the latest phrase of `bars` bars began, and which phrase that is. */
export const phraseOf = (f: Frame, bars: number): { readonly index: number; readonly age: number } => {
  const index = Math.floor(f.bar / bars);
  return { index, age: Math.max(0, f.beat - index * bars * meterOf(f)) };
};
