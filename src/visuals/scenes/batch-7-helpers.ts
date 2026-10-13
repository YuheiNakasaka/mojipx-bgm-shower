// Shared pieces for the girls of batch 7: drawing a girl sprite with eyes that blink on their own clock,
// small beat-driven motions, limbs, a cat's tail and the rhythm of a sip.
import { type Ctx, drawSprite, fillRect, type Palette, type Sprite } from 'mojipx';
import { frac, rand } from '../kit.ts';
import type { Frame } from '../scene.ts';

export const wide = (f: Frame): boolean => f.w > f.h;

/** One eye of a sprite: the top-left of its box (lash row first, 3×4 unless given) and which way its outer corner points. */
export type Eye = { readonly x: number; readonly y: number; readonly out: 1 | -1; readonly w?: number; readonly h?: number };

/** A girl: the eyes to close when she blinks and a seed so each girl blinks on her own rhythm. */
export type Girl = { readonly eyes: readonly Eye[]; readonly seed: number };

/** Whether the eyes are shut at time t: a short blink every three to four seconds, sometimes a double one. */
export const blinking = (t: number, seed: number): boolean => {
  const period = 3.2 + rand(seed, 7) * 1.3;
  const u = t / period + rand(seed, 8);
  const p = frac(u);
  const twice = rand(Math.floor(u), seed) < 0.3;
  return p < 0.04 || (twice && p > 0.08 && p < 0.115);
};

// A closed eye is skin over the box (and the lash flick beside it) with the lash as a line lifting at the outer corner.
const shutEye = (ctx: Ctx, x: number, y: number, eye: Eye, skin: string, lash: string): void => {
  const w = eye.w ?? 3;
  const h = eye.h ?? 4;
  const ex = x + eye.x;
  const ey = y + eye.y;
  const outer = eye.out > 0 ? ex + w : ex - 1;
  fillRect(ctx, skin, Math.min(ex, outer), ey, w + 1, h);
  fillRect(ctx, lash, ex, ey + h - 2, w, 1);
  fillRect(ctx, lash, outer, ey + h - 3, 1, 1);
};

/** Draws the girl's sprite with its top-left at (x, y), closing her eyes while she blinks (or whenever `shut`). */
export const drawGirl = (ctx: Ctx, f: Frame, sprite: Sprite, palette: Palette, x: number, y: number, girl: Girl, shut = false): void => {
  drawSprite(ctx, sprite, palette, x, y);
  if (!shut && !blinking(f.t, girl.seed)) return;
  const skin = palette.s ?? '#ffe0cc';
  const lash = palette.o ?? '#000000';
  for (const eye of girl.eyes) shutEye(ctx, x, y, eye, skin, lash);
};

/** 1 for the first part of every beat and 0 after it: a nod or a hop on the beat. */
export const onBeat = (beat: number, share = 0.35): number => (frac(beat) < share ? 1 : 0);

/** Which of two frames to show: they alternate every `beats` beats. */
export const alternate = (beat: number, beats = 1): 0 | 1 => (Math.floor(beat / beats) % 2 === 0 ? 0 : 1);

/** A pendulum swing in pixels, rounded to whole pixels. */
export const sway = (t: number, speed: number, amount: number, phase = 0): number => Math.round(Math.sin(t * speed + phase) * amount);

/** A limb or a pole: a line `width` pixels thick inside a one-pixel outline, from (x0, y0) to (x1, y1). */
export const limb = (ctx: Ctx, x0: number, y0: number, x1: number, y1: number, width: number, fill: string, outline: string): void => {
  const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  for (const [color, size] of [
    [outline, width + 2],
    [fill, width],
  ] as const) {
    const half = Math.floor(size / 2);
    for (let k = 0; k <= steps; k++) {
      const x = Math.round(x0 + ((x1 - x0) * k) / steps);
      const y = Math.round(y0 + ((y1 - y0) * k) / steps);
      fillRect(ctx, color, x - half, y - half, size, size);
    }
  }
};

/** A cat's tail: `len` pixels curving from (x, y) toward `dir` (−1 left, 1 right), the tip lifted by `lift`. */
export const catTail = (ctx: Ctx, x: number, y: number, len: number, lift: number, fur: string, ink: string, dir: 1 | -1): void => {
  for (let k = 0; k < len; k++) {
    const ty = y - Math.round((k / Math.max(1, len - 1)) ** 2 * lift);
    fillRect(ctx, ink, x + dir * k, ty - 1, 1, 3);
    fillRect(ctx, fur, x + dir * k, ty, 1, 1);
  }
};

/** 0 at rest, easing to 1 for a sip (a lick, a drink) taken in the third beat of every four, then back down. */
export const sipOf = (beat: number): number => {
  const b = ((beat % 4) + 4) % 4;
  return Math.min(1, Math.max(0, Math.min((b - 2) / 0.4, (3.5 - b) / 0.4)));
};
