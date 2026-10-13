// Shared pieces for the animals of batch 15: critters sculpted from ovals and rods laid over one another and outlined
// in ink, with eyes, noses and mouths dotted in by hand afterwards; and a few soft puffs of steam or mist.
import type { Ctx, Sprite } from 'mojipx';
import type { Frame } from '../scene.ts';
import { clamp01, ditherStyle, spanDisc } from './batch-1-helpers.ts';
import { inEllipse, outlined, spriteOf } from './batch-12-helpers.ts';

/** Whether a point (sprite pixels; pixel centres sit at .5) lies inside a shape. */
export type Inside = (x: number, y: number) => boolean;
/** One coat of a critter: every pixel inside the shape takes the palette letter; later coats cover earlier ones. */
export type Coat = readonly [string, Inside];
/** A pixel set by hand after the outline: x, y and its palette letter. */
export type Mark = readonly [number, number, string];

export const egg =
  (cx: number, cy: number, rx: number, ry: number): Inside =>
  (x, y) =>
    inEllipse(x, y, cx, cy, rx, ry);

// How far (x, y) lies from the segment a–b.
const offSegment = (x: number, y: number, a: readonly [number, number], b: readonly [number, number]): number => {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const k = clamp01(((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1));
  return Math.hypot(x - a[0] - k * dx, y - a[1] - k * dy);
};

/** A rounded rod of radius r between two points: limbs, flippers, stalks. */
export const rod =
  (a: readonly [number, number], b: readonly [number, number], r: number): Inside =>
  (x, y) =>
    offSegment(x, y, a, b) <= r;

/** A shape cut down to the part that also lies inside `keep`. */
export const within =
  (shape: Inside, keep: Inside): Inside =>
  (x, y) =>
    shape(x, y) && keep(x, y);

/**
 * A critter sprite: its coats painted in order, outlined in `o`, then the hand-set marks on top. With `scale` the
 * coats (and the marks' places) are given in design units that many pixels across, so one model can be drawn larger.
 */
export const sculpt = (w: number, h: number, coats: readonly Coat[], marks: readonly Mark[] = [], scale = 1): Sprite => {
  const body = outlined(
    spriteOf(w, h, (x, y) => coats.findLast(([, inside]) => inside((x + 0.5) / scale, (y + 0.5) / scale))?.[0] ?? '.'),
    'o',
  );
  const rows = body.map((row) => [...row]);
  for (const [mx, my, ch] of marks) {
    const [x, y] = [Math.round((mx + 0.5) * scale - 0.5), Math.round((my + 0.5) * scale - 0.5)];
    if (rows[y]?.[x] !== undefined) (rows[y] as string[])[x] = ch;
  }
  return rows.map((row) => row.join(''));
};

/** The rim of an ellipse on one side: its upper edge (`up`) or its lower edge, a design unit thick. */
export const arc = (cx: number, cy: number, rx: number, ry: number, up: boolean): Inside => {
  const outer = egg(cx, cy, rx, ry);
  const inner = egg(cx, cy + (up ? 1 : -1), rx - 0.4, ry);
  return (x, y) => (up ? y < cy : y > cy) && outer(x, y) && !inner(x, y);
};

const levelOf = (a: number): number => (a < 0.4 ? 0.95 : a < 0.65 ? 0.6 : a < 0.85 ? 0.32 : 0.12);

/** A puff of steam or mist: a dithered disc of `color` thinning out with its age a (0 fresh … 1 gone). */
export const puffOf = (ctx: Ctx, color: string, x: number, y: number, r: number, a: number): void => {
  const style = ditherStyle(ctx, color, levelOf(a));
  if (!style || r < 1) return;
  ctx.fillStyle = style;
  spanDisc(ctx, x, y, Math.round(r));
};

/** One puff of a cloud: where it is, how big, and how old (0 fresh … 1 gone). */
export type Puff = { readonly x: number; readonly y: number; readonly r: number; readonly a: number };

/** A billowing cloud: every puff's shaded underside first, then the lit tops over them, thinning out as they age. */
export const cloud = (ctx: Ctx, puffs: readonly Puff[], light: string, shade: string): void => {
  for (const p of puffs) puffOf(ctx, shade, p.x, p.y + 1, p.r, p.a);
  for (const p of puffs) puffOf(ctx, light, p.x - 1, p.y - 1, p.r - 1, p.a);
};

/** A beat-long squash: 1 in the first part of every beat, 0 after it. */
export const squashOf = (f: Frame, share = 0.3, offset = 0): 0 | 1 => ((((f.beat + offset) % 1) + 1) % 1 < share ? 1 : 0);
