// Shared pieces for the famous Japanese sights of batch 18: small visitors drawn to any height, with an umbrella or a
// parasol when the weather asks for one.
import { type Ctx, fillRect } from 'mojipx';
import { disc } from '../kit.ts';

export type Visitor = {
  readonly hair: string;
  /** The lower half of the head: skin when they face us, hair when we see their back. */
  readonly face: string;
  readonly coat: string;
  readonly legs: string;
  /** The canopy of their umbrella and its rim, or null without one. */
  readonly brolly: readonly [string, string] | null;
};

// An umbrella held up over the head: a shallow dome with a darker scalloped rim and a dark shaft down to the hand.
const umbrella = (ctx: Ctx, x: number, crown: number, r: number, tones: readonly [string, string], shaft: string): void => {
  const rise = Math.max(2, Math.round(r * 0.55));
  for (let dy = 0; dy <= rise; dy++) {
    const half = Math.round(r * Math.sqrt(1 - ((rise - dy) / (rise + 0.5)) ** 2));
    fillRect(ctx, dy === rise ? tones[1] : tones[0], x - half, crown + dy, half * 2 + 1, 1);
  }
  for (let k = -r; k <= r; k += 2) fillRect(ctx, tones[1], x + k, crown + rise + 1, 1, 1);
  fillRect(ctx, shaft, x, crown - 1, 1, 1);
  fillRect(ctx, shaft, x, crown + rise + 1, 1, Math.max(2, Math.round(r * 0.8)));
};

// The smallest head: a block of hair over a row of face framed by hair.
const head = (ctx: Ctx, x: number, y: number, v: Visitor): void => {
  fillRect(ctx, v.hair, x - 1, y, 3, 2);
  fillRect(ctx, v.face, x, y + 1, 1, 1);
};

/**
 * A visitor `h` pixels tall standing on `foot`, centred on x. `step` (0 or 1) lifts one foot or the other, so a
 * visitor drawn with an alternating step walks.
 */
export const drawVisitor = (ctx: Ctx, x: number, foot: number, h: number, v: Visitor, step: number): void => {
  const r = Math.max(1, Math.round(h * 0.11));
  const half = Math.max(1, Math.round(h * 0.15));
  const legs = Math.max(2, Math.round(h * 0.36));
  const top = foot - h;
  const neck = top + r * 2 + 1;
  const hip = foot - legs;
  fillRect(ctx, v.legs, x - half + (half > 1 ? 1 : 0), hip, 1, legs - (step === 0 ? 1 : 0));
  fillRect(ctx, v.legs, x + half - (half > 1 ? 1 : 0), hip, 1, legs - (step === 1 ? 1 : 0));
  fillRect(ctx, v.coat, x - half, neck, half * 2 + 1, hip - neck + 1);
  fillRect(ctx, v.coat, x - half - 1, hip - 1, half * 2 + 3, 1);
  if (r > 1) disc(ctx, x, top + r, r, (dy) => (dy < 0 ? v.hair : v.face));
  else head(ctx, x, top + 1, v);
  if (v.brolly) umbrella(ctx, x, top - Math.max(2, Math.round(h * 0.2)), Math.max(3, Math.round(h * 0.42)), v.brolly, v.legs);
};
