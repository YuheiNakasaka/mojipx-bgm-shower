// Shared pieces for the famous sights of Japan in batch 16: the landmark's scale for the frame, Japanese roofs whose
// eaves turn up at the tips (tiled or shingled, bare or under snow), clipped garden pines, rows of tree crowns and a
// bough reaching in from the top corner.
import { type Ctx, fillRect } from 'mojipx';
import { pixelLine, rand } from '../kit.ts';
import type { Frame } from '../scene.ts';
import { limb } from './batch-7-helpers.ts';
import { puff } from './batch-9-helpers.ts';

/** How much larger than its design size the landmark is drawn: a phone held upright has the room for a bigger one. */
export const scaleOf = (f: Frame): number => (f.h >= f.w * 1.6 ? 1.25 : 1);

/** A length of the design at scale s, in whole pixels and never less than one. */
export const px = (n: number, s: number): number => Math.max(1, Math.round(n * s));

// ---- roofs ----

export type Eaves = {
  readonly cx: number;
  /** The row of the eave's lower edge in the middle. */
  readonly eave: number;
  /** Half-span at the eave, and half-width where the slope meets the storey above (or the ridge). */
  readonly half: number;
  readonly top: number;
  /** Rows from the eave up to that line, how far the tips turn up, and how thick the eave's front edge is. */
  readonly rise: number;
  readonly lift: number;
  readonly edge: number;
};

export type RoofTones = {
  readonly body: string;
  /** The channels between rows of tiles (equal to body on a shingled roof). */
  readonly seam: string;
  /** The hip lines along the top of the slope. */
  readonly hip: string;
  readonly edge: string;
  readonly under: string;
  /** Snow lying on the slope (equal to body when the roof is bare). */
  readonly snow: string;
};

// One column of a roof: the slope sags from the hip down to the eave, whose tips turn up.
const eaveColumn = (g: Ctx, e: Eaves, t: RoofTones, x: number): void => {
  const k = Math.max(0, (Math.abs(x - e.cx) - e.top) / Math.max(1, e.half - e.top));
  const bottom = e.eave - Math.round(e.lift * k ** 3);
  const top = Math.min(bottom - e.edge - 1, e.eave - e.rise + Math.round((e.rise - e.edge - 1) * (1 - (1 - k) ** 2)));
  const face = bottom - e.edge + 1 - top;
  fillRect(g, t.body, x, top, 1, face);
  if ((x - e.cx) % 2 === 0) fillRect(g, t.seam, x, top + 1, 1, face - 1);
  if (t.snow !== t.body) fillRect(g, t.snow, x, top, 1, Math.max(1, face - 1));
  fillRect(g, t.hip, x, top, 1, 1);
  fillRect(g, t.edge, x, bottom - e.edge + 1, 1, e.edge);
  fillRect(g, t.under, x, bottom + 1, 1, 1);
};

/** A roof seen from the front, from eave to eave. */
export const paintEaves = (g: Ctx, e: Eaves, t: RoofTones): void => {
  for (let x = e.cx - e.half; x <= e.cx + e.half; x++) eaveColumn(g, e, t, x);
};

// ---- trees ----

export type Tones = readonly [string, string, string];

export type Canopy = {
  readonly w: number;
  readonly bottom: number;
  /** The crowns' radius, and the seed that scatters them. */
  readonly r: number;
  readonly seed: number;
};

/** Crowns of trees in rows, filling everything from `top(x)` down to the bottom; each crown takes one of `kinds`. */
export const paintCanopy = (g: Ctx, c: Canopy, top: (x: number) => number, kinds: readonly Tones[]): void => {
  const step = Math.max(2, Math.round(c.r * 1.25));
  for (let row = 0, i = 0; row <= c.bottom; row += step) {
    for (let x = -c.r; x < c.w + c.r; x += step, i++) {
      const cx = x + Math.round((rand(i, c.seed) - 0.5) * step);
      const cy = top(cx) + row + Math.round(rand(i, c.seed + 1) * c.r * 0.5);
      const kind = kinds[Math.floor(rand(i, c.seed + 2) * kinds.length)] as Tones;
      if (cy - c.r < c.bottom) puff(g, cx, cy, Math.max(2, Math.round(c.r * (0.7 + 0.5 * rand(i, c.seed + 3)))), kind);
    }
  }
};

export type PineTones = {
  readonly ink: string;
  readonly bark: string;
  /** Needles in shade, in the body and lit, and snow on the pads (equal to `lit` when there is none). */
  readonly dark: string;
  readonly mid: string;
  readonly lit: string;
  readonly snow: string;
};

/** One flat pad of pine needles: dark underneath, lit along the top, with a ragged rim. */
export const needlePad = (g: Ctx, cx: number, cy: number, half: number, t: PineTones, seed: number): void => {
  const rows = Math.max(2, Math.round(half * 0.45));
  for (let dy = -rows; dy <= rows; dy++) {
    const span = Math.round(half * Math.sqrt(1 - (dy / (rows + 0.5)) ** 2) + (rand(dy, seed) - 0.5) * 2);
    const color = dy < -rows / 2 ? t.lit : dy > rows / 3 ? t.dark : t.mid;
    fillRect(g, dy === -rows ? t.snow : color, cx - span, cy + dy, span * 2 + 1, 1);
  }
  fillRect(g, t.snow, cx - Math.round(half * 0.6), cy - rows + 1, Math.round(half * 1.2) + 1, 1);
};

/** A clipped garden pine `size` pixels tall: a leaning trunk carrying flat pads of needles that narrow toward the top. */
export const paintPine = (g: Ctx, x: number, base: number, size: number, t: PineTones, seed: number): void => {
  const lean = Math.round((rand(seed, 1) - 0.5) * size * 0.7);
  const crown = [x + lean, base - Math.round(size * 0.8)] as const;
  limb(g, x, base, crown[0], crown[1], size > 14 ? 2 : 1, t.bark, t.ink);
  const pads = size > 14 ? 4 : 3;
  for (let i = 0; i < pads; i++) {
    const u = i / (pads - 1);
    const padX = crown[0] + Math.round((rand(i, seed + 2) - 0.5) * size * 0.8 * (1 - u));
    const padY = Math.round(base - size * (0.42 + 0.5 * u));
    pixelLine(g, crown[0], crown[1] + 2, padX, padY, t.ink);
    needlePad(g, padX, padY, Math.max(3, Math.round(size * (0.42 - u * 0.2))), t, seed + i);
  }
};

// ---- a bough in the foreground ----

/** A bough reaching in from the top-left corner, `len` pixels long and drooping at the end: twigs fork off it and
 * `clump` dresses each twig's tip (and every other fork). */
export const paintBough = (g: Ctx, len: number, ink: string, bark: string, clump: (x: number, y: number, k: number) => void): void => {
  const knee = [Math.round(len * 0.5), Math.round(len * 0.08)] as const;
  const end = [len, Math.round(len * 0.26)] as const;
  limb(g, -3, -1, knee[0], knee[1], 3, bark, ink);
  limb(g, knee[0], knee[1], end[0], end[1], 1, bark, ink);
  for (let k = 0; k < 7; k++) {
    const u = 0.22 + k * 0.13;
    const x = Math.round(end[0] * u);
    const y = Math.round(u < 0.5 ? knee[1] * (u / 0.5) : knee[1] + (end[1] - knee[1]) * ((u - 0.5) / 0.5));
    const tip = [x + Math.round((rand(k, 7) - 0.4) * 12), y + 5 + Math.round(rand(k, 8) * len * 0.15)] as const;
    pixelLine(g, x, y, tip[0], tip[1], ink);
    if (k % 2 === 1) clump(x, y + 1, k + 10);
    clump(tip[0], tip[1], k);
  }
};
