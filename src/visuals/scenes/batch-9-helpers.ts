// Shared pieces for the famous Japanese places of batch 9: layouts given as shares of the frame, a sky base, a
// pagoda, leaves and petals fluttering down, and a searchlight cone.
import { type Ctx, drawSprite, fillRect, type Palette, type Sprite } from 'mojipx';
import { ditherGradient, rand, stars } from '../kit.ts';
import type { Frame } from '../scene.ts';
import { fillDither, spanDisc, wrap } from './batch-1-helpers.ts';

// ---- layout ----

/** A share of the frame's width or height. */
export type Share = readonly ['w' | 'h', number];
export type Plan<T extends string> = Readonly<Record<T, Share>>;

const plans = new WeakMap<object, Map<string, Readonly<Record<string, number>>>>();

/** The plan for the frame's shape (wide or tall) in whole pixels; computed once per plan and frame size. */
export const planOf = <T extends string>(f: Frame, wide: Plan<T>, tall: Plan<T>): Readonly<Record<T, number>> => {
  const plan = f.w > f.h ? wide : tall;
  let bySize = plans.get(plan);
  if (!bySize) {
    bySize = new Map();
    plans.set(plan, bySize);
  }
  const key = `${f.w}x${f.h}`;
  const hit = bySize.get(key);
  if (hit) return hit as Readonly<Record<T, number>>;
  const made = Object.fromEntries(Object.entries<Share>(plan).map(([k, [axis, v]]) => [k, Math.round(f[axis] * v)]));
  bySize.set(key, made);
  return made as Readonly<Record<T, number>>;
};

/** The height at x of a line through points sorted by x, flat beyond the first and the last. */
export const through = (pts: readonly (readonly [number, number])[], x: number): number => {
  const first = pts[0] ?? [0, 0];
  if (x <= first[0]) return first[1];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1] as readonly [number, number];
    const [x1, y1] = pts[i] as readonly [number, number];
    if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / Math.max(1, x1 - x0);
  }
  return (pts[pts.length - 1] ?? first)[1];
};

// ---- sky ----

export type SkySpec = {
  readonly bottom: number;
  readonly stops: readonly string[];
  /** Star colors, or null while the sky is too light for stars. */
  readonly stars: readonly string[] | null;
  readonly seed: number;
};

/** A dithered sky down to `bottom`, with twinkling stars over its upper part at night. */
export const skyBase = (ctx: Ctx, f: Frame, s: SkySpec): void => {
  ctx.drawImage(ditherGradient(f.w, s.bottom, s.stops), 0, 0);
  if (s.stars) stars(ctx, f.w, s.bottom, f.t, s.stars, Math.round((f.w * s.bottom) / 380), s.seed, 0.8);
};

// ---- pagoda ----

export type PagodaColors = {
  readonly roof: string;
  readonly roofLit: string;
  readonly under: string;
  readonly body: string;
  readonly bodyLit: string;
  readonly panel: string;
  readonly spire: string;
  readonly spireLit: string;
};

export type Pagoda = {
  readonly cx: number;
  /** The ground line under the podium. */
  readonly base: number;
  readonly tiers: number;
  /** Height of a storey's wall, the bottom storey's width and the bottom roof's half-span. */
  readonly storey: number;
  readonly width: number;
  readonly span: number;
};

// One roof seen from the side: a thick eave whose tips curl up, sloping in toward the storey above, with the dark
// underside of the eave showing beneath the lit edge.
const pagodaRoof = (g: Ctx, cx: number, eave: number, half: number, inner: number, rise: number, p: PagodaColors): void => {
  const lift = Math.max(2, Math.round(rise * 0.7));
  for (let dx = -half; dx <= half; dx++) {
    const out = Math.abs(dx);
    const bottom = eave - Math.round(lift * (out / half) ** 3);
    const slope = out <= inner ? 0 : ((out - inner) / Math.max(1, half - inner)) ** 0.6;
    const top = Math.min(bottom - 2, eave - rise + Math.round((rise - 2) * slope));
    fillRect(g, p.roof, cx + dx, top, 1, bottom - top + 1);
    fillRect(g, p.roofLit, cx + dx, top, 1, 1);
    fillRect(g, p.roofLit, cx + dx, bottom - 1, 1, 1);
    fillRect(g, p.under, cx + dx, bottom + 1, 1, 1);
  }
};

// One storey's wall: painted posts and boards, a dark door in the middle bay, a white band of plaster under the
// brackets, and the brackets' shadow under the roof.
const pagodaStorey = (g: Ctx, cx: number, bottom: number, half: number, h: number, p: PagodaColors): void => {
  const top = bottom - h;
  const door = Math.max(1, Math.round(half / 3));
  fillRect(g, p.body, cx - half, top, half * 2 + 1, h);
  fillRect(g, p.bodyLit, cx - half, top, 1, h);
  fillRect(g, p.panel, cx - half + 1, top + 2, half * 2 - 1, 1);
  fillRect(g, p.under, cx - door, top + 4, door * 2 + 1, h - 4);
  fillRect(g, p.under, cx - half - 1, top, half * 2 + 3, 2);
};

// The spire: a box on the top roof, a pole ringed nine times and a flame-shaped finial.
const pagodaSpire = (g: Ctx, cx: number, bottom: number, h: number, p: PagodaColors): void => {
  fillRect(g, p.spire, cx - 2, bottom - 2, 5, 2);
  fillRect(g, p.spire, cx, bottom - h, 1, h);
  const rings = Math.min(9, Math.floor((h - 6) / 2));
  for (let k = 0; k < rings; k++) fillRect(g, k % 2 === 0 ? p.spireLit : p.spire, cx - 1, bottom - 5 - k * 2, 3, 1);
  fillRect(g, p.spireLit, cx - 1, bottom - h - 1, 3, 2);
  fillRect(g, p.spireLit, cx, bottom - h - 3, 1, 2);
};

/** A pagoda of `tiers` storeys, each a little narrower than the one below, lit from the left. */
export const paintPagoda = (g: Ctx, pg: Pagoda, p: PagodaColors): void => {
  const taper = 0.32 / pg.tiers;
  const rise = Math.max(3, Math.round(pg.storey * 0.6));
  const halfOf = (i: number, full: number): number => Math.round((full / 2) * (1 - taper * i));
  fillRect(g, p.roof, pg.cx - halfOf(0, pg.width) - 3, pg.base - 3, halfOf(0, pg.width) * 2 + 7, 3);
  fillRect(g, p.roofLit, pg.cx - halfOf(0, pg.width) - 3, pg.base - 3, halfOf(0, pg.width) * 2 + 7, 1);
  let bottom = pg.base - 3;
  for (let i = 0; i < pg.tiers; i++) {
    const half = halfOf(i, pg.width);
    pagodaStorey(g, pg.cx, bottom, half, pg.storey, p);
    const eave = bottom - pg.storey;
    const inner = i + 1 < pg.tiers ? halfOf(i + 1, pg.width) : 2;
    pagodaRoof(g, pg.cx, eave, halfOf(i, pg.span * 2), inner, rise, p);
    bottom = eave - rise + 1;
  }
  pagodaSpire(g, pg.cx, bottom, Math.round(pg.storey * 1.7), p);
};

// ---- foliage ----

/** A round puff of leaves or blossom: a dark disc, a lighter one up and to the left, and a dappled sunlit top. */
export const puff = (g: Ctx, x: number, y: number, r: number, tones: readonly [string, string, string]): void => {
  g.fillStyle = tones[0];
  spanDisc(g, x, y, r);
  g.fillStyle = tones[1];
  spanDisc(g, x - 1, y - 1, Math.max(1, r - 2));
  const lit = Math.max(1, Math.floor(r * 0.55));
  fillDither(g, tones[2], 0.5, x - lit - 1, y - lit - 1, lit + 1, lit);
  fillRect(g, tones[2], x - Math.ceil(r / 2), y - r + 1, 2, 1);
};

// ---- leaves and petals ----

export type Flutter = {
  readonly count: number;
  readonly seed: number;
  /** Fall speed and sideways drift in pixels a second, sway in pixels, and frame changes a second. */
  readonly fall: number;
  readonly drift: number;
  readonly sway: number;
  readonly spin: number;
  /** The band they fall through. */
  readonly top: number;
  readonly bottom: number;
};

/** Leaves or petals fluttering down through a band: each tumbles through the frames, sways and drifts with the wind. */
export const flutter = (ctx: Ctx, f: Frame, frames: readonly Sprite[], palettes: readonly Palette[], o: Flutter): void => {
  const span = o.bottom - o.top + 12;
  for (let i = 0; i < o.count; i++) {
    const near = 0.6 + 0.8 * rand(i, o.seed);
    const y = o.top - 6 + wrap(rand(i, o.seed + 1) * span + f.t * o.fall * near, span);
    const x = wrap(rand(i, o.seed + 2) * (f.w + 20) + f.t * o.drift * near + Math.sin(f.t * (0.7 + near) + i * 2.3) * o.sway, f.w + 20);
    const frame = frames[Math.floor(f.t * o.spin * near + rand(i, o.seed + 3) * frames.length) % frames.length] as Sprite;
    drawSprite(ctx, frame, palettes[i % palettes.length] as Palette, Math.round(x - 10), Math.round(y));
  }
};

// ---- searchlight ----

export type Beam = {
  readonly x: number;
  readonly y: number;
  /** Rows it climbs, sideways pixels per row, and how fast it widens. */
  readonly len: number;
  readonly lean: number;
  readonly spread: number;
  readonly peak: number;
};

/** A searchlight cone rising from (x, y): a dense core inside a thin haze, both fading with height. */
export const searchBeam = (ctx: Ctx, b: Beam, color: string): void => {
  for (let k = 2; k < b.len; k++) {
    const level = b.peak * (1 - k / b.len) ** 0.6;
    const half = 1 + k * b.spread * Math.hypot(1, b.lean);
    const cx = b.x + k * b.lean;
    fillDither(ctx, color, level * 0.4, cx - half, b.y - k, half * 2 + 1, 1);
    fillDither(ctx, color, level, cx - half * 0.4 - 0.5, b.y - k, half * 0.8 + 1, 1);
  }
};
