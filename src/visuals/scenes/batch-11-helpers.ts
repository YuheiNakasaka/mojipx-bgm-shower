// Shared pieces for the girls of batch 11 and their odd companions: a cat's head that peeks out of windows and
// helmets, and a small jellyfish whose bell pulses while its tentacles trail behind it.
import { type Ctx, drawSprite, fillRect, type Palette, type Sprite } from 'mojipx';
import { bayer } from '../kit.ts';
import { fillDither } from './batch-1-helpers.ts';
import { blinking } from './batch-7-helpers.ts';

/** A cat's head, 12×10: o outline, f fur, l light fur, p pink (ears, nose), e eye, w glint. */
export const CAT_HEAD: Sprite = [
  '.o........o.',
  'ofo......ofo',
  'opfo....ofpo',
  'offfoooofffo',
  'offffffffffo',
  'ofweffffwefo',
  'ofeeffffeefo',
  'offllppllffo',
  '.ofllllllfo.',
  '..oooooooo..',
];

export type CatColors = {
  readonly ink: string;
  readonly fur: string;
  readonly light: string;
  readonly pink: string;
  readonly eye: string;
  readonly glint: string;
};

export const catPalette = (k: CatColors): Palette => ({ o: k.ink, f: k.fur, l: k.light, p: k.pink, e: k.eye, w: k.glint });

/** Draws a cat's head with its top-left at (x, y); it blinks on its own clock, picked by `seed`. */
export const drawCatHead = (ctx: Ctx, t: number, x: number, y: number, palette: Palette, seed: number): void => {
  drawSprite(ctx, CAT_HEAD, palette, x, y);
  if (!blinking(t, seed)) return;
  const fur = palette.f ?? '#888888';
  const ink = palette.o ?? '#000000';
  for (const ex of [2, 8]) {
    fillRect(ctx, fur, x + ex, y + 5, 2, 2);
    fillRect(ctx, ink, x + ex, y + 6, 2, 1);
  }
};

export type JellyColors = { readonly rim: string; readonly bell: string; readonly hi: string; readonly trail: string };

/**
 * A jellyfish with its bell's top at (cx, top) and radius r: the bell squeezes narrow and tall as `pulse` goes 0 → 1
 * (a swim stroke); it glows brighter toward its crown, and frilled arms and thin tentacles wave below it.
 */
export const drawJelly = (ctx: Ctx, t: number, cx: number, top: number, r: number, k: JellyColors, pulse: number): void => {
  const rx = Math.max(2, Math.round(r * (1 - 0.18 * pulse)));
  const ry = Math.max(2, Math.round(r * (0.8 + 0.2 * pulse)));
  const x0 = Math.round(cx);
  const y0 = Math.round(top);
  jellyTentacles(ctx, t, x0, y0 + ry + 1, rx, r, k);
  for (let dy = 0; dy <= ry; dy++) {
    const half = Math.round(rx * Math.sqrt(1 - ((ry - dy) / ry) ** 2));
    const y = y0 + dy;
    fillRect(ctx, k.rim, x0 - half - 1, y - (dy === 0 ? 1 : 0), half * 2 + 3, dy === 0 ? 2 : 1);
    fillRect(ctx, k.bell, x0 - half, y, half * 2 + 1, 1);
    fillDither(ctx, k.hi, 1 - dy / ry, x0 - half, y, half * 2 + 1, 1);
    if (dy > ry * 0.2 && dy < ry * 0.65) fillRect(ctx, k.hi, x0 - Math.round(half * 0.6), y, 2, 1);
  }
  // The rim is scalloped: every third pixel hangs one lower.
  for (let x = -rx - 1; x <= rx + 1; x++) fillRect(ctx, k.rim, x0 + x, y0 + ry + 1 + ((x + rx) % 3 === 0 ? 1 : 0), 1, 1);
};

type Strand = { readonly x: number; readonly y: number; readonly len: number; readonly width: number; readonly amp: number };

// One tentacle swaying in a wave that runs down it, thinning out into dither past halfway.
const strand = (ctx: Ctx, t: number, s: Strand, phase: number, color: string): void => {
  for (let j = 0; j < s.len; j++) {
    const x = s.x + Math.round(Math.sin(t * 2.2 - j * 0.45 + phase) * (j / s.len) * s.amp);
    if (j > s.len * 0.5 && bayer(x, s.y + j) < (j / s.len) * 0.9) continue;
    fillRect(ctx, color, x, s.y + j, s.width, 1);
  }
};

// Four thin tentacles hang from the rim and two frilled arms from the middle.
const jellyTentacles = (ctx: Ctx, t: number, x0: number, y0: number, rx: number, r: number, k: JellyColors): void => {
  const len = Math.round(r * 1.8);
  for (let i = 0; i < 4; i++) {
    const x = x0 + Math.round(((i - 1.5) / 1.5) * rx * 0.85);
    strand(ctx, t, { x, y: y0, len, width: 1, amp: 2.5 }, i * 1.7, k.trail);
  }
  for (const side of [-1, 1]) strand(ctx, t, { x: x0 + side, y: y0, len: Math.round(len * 0.7), width: 2, amp: 1.5 }, side, k.bell);
};
