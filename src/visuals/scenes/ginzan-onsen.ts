// A silver-mine hot-spring town on a winter night, seen from a bridge looking up its little river: tall wooden inns
// with lit paper windows and balconies stand on both banks, gas lamps glow along the stone walks, snow settles on
// every roof, steam rises off the water and a couple in yukata and haori cross the arched footbridge under umbrellas.
import { type Ctx, drawSprite, fillRect, flipped, type Sprite } from 'mojipx';
import { bayer, cached, fillColumns, frac, rand, ridgeNoise } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { colorKey, drawGlow, paletteBy } from './batch-1-helpers.ts';
import { isDark, mixHex, pixelLayer } from './batch-5-helpers.ts';
import { frameLayer, lightStreak, snowfall } from './batch-6-helpers.ts';
import { flutter, puff, skyBase } from './batch-9-helpers.ts';
import { both, box, oval, stick } from './batch-14-helpers.ts';
import { drawWagasa, figureAt } from './batch-17-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sky3'
  | 'star'
  | 'hill'
  | 'hillLo'
  | 'hillLit'
  | 'fall'
  | 'wood'
  | 'woodLit'
  | 'woodLo'
  | 'plaster'
  | 'plasterLo'
  | 'roof'
  | 'snow'
  | 'snowLit'
  | 'snowLo'
  | 'win'
  | 'winLo'
  | 'glow'
  | 'lampHi'
  | 'stone'
  | 'stoneLit'
  | 'stoneLo'
  | 'water'
  | 'waterFar'
  | 'steam'
  | 'skin'
  | 'hair'
  | 'yukata'
  | 'yukataLo'
  | 'haori'
  | 'robe'
  | 'brolly'
  | 'brollyLo'
  | 'brolly2'
  | 'white'
  | 'ink'
  | 'flake';

// ---- the world: the river seen from a bridge downstream, in one-point perspective ----

/**
 * Screen: the horizon row, the vanishing column and the focal length in pixels. World, in metres across the river
 * from its middle, up from the water and away from us: the river's half-width and the line of the inns' fronts.
 */
type View = {
  readonly hz: number;
  readonly vx: number;
  readonly F: number;
  readonly half: number;
  readonly front: number;
};

// The eye's height over the water, the stone walks' height over it, one storey of an inn, and where the street ends.
const EYE = 3.4;
const BANK = 1.3;
const STOREY = 2.6;
const FAR = 64;

const viewOf = (f: Frame): View =>
  f.w > f.h
    ? { hz: Math.round(f.h * 0.46), vx: Math.round(f.w / 2), F: f.h * 0.9, half: 2.4, front: 4.8 }
    : { hz: Math.round(f.h * 0.52), vx: Math.round(f.w / 2), F: f.h * 0.48, half: 2.2, front: 4.2 };

/** A world point on screen, with pixels per metre there. */
type Seen = { readonly x: number; readonly y: number; readonly ppm: number };

const project = (v: View, across: number, up: number, z: number): Seen => ({
  x: v.vx + (v.F * across) / z,
  y: v.hz + (v.F * (EYE - up)) / z,
  ppm: v.F / z,
});

// ---- what each pixel looks at ----

/** An inn on one bank: where its front starts and ends up the river, its storeys, and whether its walls are plaster. */
type Inn = { readonly z0: number; readonly z1: number; readonly storeys: number; readonly plaster: boolean; readonly seed: number };

const innsOf = (seed: number): readonly Inn[] => {
  const out: Inn[] = [];
  for (let z = 1, i = 0; z < FAR; i++) {
    const len = 6 + rand(i, seed) * 6;
    out.push({ z0: z, z1: z + len, storeys: rand(i, seed + 1) < 0.6 ? 4 : 3, plaster: rand(i, seed + 2) < 0.3, seed: seed * 100 + i });
    z += len + 0.7 + rand(i, seed + 3) * 0.8;
  }
  return out;
};

// The left bank's inns, then the right bank's.
const BANKS = [innsOf(11), innsOf(17)] as const;

const innAt = (side: number, z: number): Inn | undefined => BANKS[side < 0 ? 0 : 1].find((n) => z >= n.z0 && z < n.z1);

/**
 * The first surface a pixel's ray meets: an inn's front (or the gap beside it), the stone walk in front of the inns,
 * the embankment wall dropping to the river, the water, or nothing before the end of the street. `z` is its distance
 * and `u` its height (on the fronts and the wall) or its distance from the river's middle (on the walk).
 */
type Hit = { readonly on: 'front' | 'walk' | 'wall' | 'water' | 'open'; readonly z: number; readonly u: number; readonly side: number };

const OPEN: Hit = { on: 'open', z: FAR, u: 0, side: 1 };

const hitOf = (v: View, x: number, y: number): Hit => {
  const off = x + 0.5 - v.vx;
  const a = Math.max(0.25, Math.abs(off));
  const dy = y + 0.5 - v.hz;
  const side = off < 0 ? -1 : 1;
  const zf = (v.F * v.front) / a;
  const up = EYE - (dy * zf) / v.F;
  const ahead = (on: Hit['on'], z: number, u: number): Hit => (z < FAR ? { on, z, u, side } : OPEN);
  if (up >= BANK) return ahead('front', zf, up);
  const zw = (v.F * (EYE - BANK)) / dy;
  if ((a * zw) / v.F >= v.half) return ahead('walk', zw, (a * zw) / v.F);
  const ze = (v.F * v.half) / a;
  const wall = EYE - (dy * ze) / v.F;
  return wall >= 0 ? ahead('wall', ze, wall) : ahead('water', (v.F * EYE) / dy, 0);
};

// ---- the inns' fronts, band by band ----

/**
 * Where on a front a pixel falls: metres along the inn, the storey (0 at the street) and height within it, how many
 * metres along one pixel spans (detail finer than that is dithered instead), and the pixel itself.
 */
type Spot = {
  readonly along: number;
  readonly floor: number;
  readonly v: number;
  readonly dz: number;
  readonly px: number;
  readonly py: number;
};

const BAY = 1.8;

const bayOf = (s: Spot): number => Math.floor(s.along / BAY) + s.floor * 17;

const postAt = (s: Spot): boolean => s.dz < 0.5 && frac(s.along / BAY) < Math.max(0.07, s.dz / BAY);

/** Slats `period` metres apart over a lit gap: drawn where a pixel can show them, dithered where it cannot. */
const slatsAt = (s: Spot, period: number, slat: string, gap: string): string =>
  s.dz < period / 3 ? (frac(s.along / period) < 0.35 ? slat : gap) : bayer(s.px, s.py) < 0.4 ? slat : gap;

// Snow piled on the roof's slope above the eaves, ridged where the tiles run under it.
const roofAt = (c: Colors<K>, s: Spot, up: number): string | null => {
  if (up < 0.22) return c.woodLo;
  if (up < 0.36) return c.snowLit;
  if (up > 1.5) return null;
  return s.dz < 0.12 && frac(s.along / 0.32) < 0.25 ? c.snowLo : up > 1.1 ? c.snowLo : c.snow;
};

// The ground floor: a stone footing, slatted lattice fronts with the light coming through, noren in some doorways.
const groundAt = (c: Colors<K>, inn: Inn, s: Spot): string => {
  if (s.v < 0.22) return c.stoneLo;
  if (s.v > 2.05) return inn.plaster ? c.plaster : c.woodLo;
  if (postAt(s)) return c.woodLo;
  if (rand(bayOf(s), inn.seed) < 0.3 && s.v > 1.25) return s.dz < 0.1 && frac(s.along / 0.6) < 0.1 ? c.woodLo : c.haori;
  return slatsAt(s, 0.16, c.wood, c.winLo);
};

// The balcony in front of an upper floor: a snow-capped rail on balusters, with lit sliding doors behind it in some
// bays and dark boarding in the rest.
const railAt = (c: Colors<K>, inn: Inn, s: Spot): string => {
  if (s.v > 1.3) return c.snowLit;
  if (s.v > 1.18) return c.woodLit;
  const lit = rand(bayOf(s), inn.seed + 2) < 0.5;
  return lit ? slatsAt(s, 0.24, c.woodLo, c.win) : slatsAt(s, 0.24, c.woodLit, c.woodLo);
};

// Above the rail: tall paper doors in the lit bays, a small window in the wall of the others; a few stay dark.
const paneAt = (c: Colors<K>, inn: Inn, s: Spot): string => {
  const wall = inn.plaster ? c.plaster : c.wood;
  const tall = !inn.plaster && rand(bayOf(s), inn.seed + 2) < 0.5;
  const inBay = frac(s.along / BAY);
  const open = tall ? s.v < 2.2 : s.v > 1.6 && s.v < 2.15 && inBay > 0.3 && inBay < 0.7;
  if (!open) return wall;
  if (rand(bayOf(s), inn.seed + 1) < 0.12) return c.woodLo;
  const grid = s.dz < 0.1 && (frac(s.along / 0.45) < 0.15 || frac((s.v - 1.45) / 0.3) < 0.18);
  return grid ? c.winLo : c.win;
};

// An upper floor: the beam and pent roof at its foot, the balcony, the windows and a dark beam under the next floor.
const upperAt = (c: Colors<K>, inn: Inn, s: Spot): string => {
  if (s.v < 0.12) return c.woodLo;
  if (s.v < 0.3) return c.roof;
  if (s.v < 0.42) return c.snowLit;
  if (s.v > 2.3) return inn.plaster ? c.plasterLo : c.woodLo;
  if (postAt(s)) return c.woodLo;
  if (s.v < 1.4 && !inn.plaster) return railAt(c, inn, s);
  return paneAt(c, inn, s);
};

const frontAt = (c: Colors<K>, v: View, hit: Hit, px: number, py: number): string | null => {
  const inn = innAt(hit.side, hit.z);
  if (!inn) return hit.u < BANK + 2.4 ? c.woodLo : null;
  const height = hit.u - BANK;
  const floor = Math.floor(height / STOREY);
  const dz = (hit.z * hit.z) / (v.F * v.front);
  const s: Spot = { along: hit.z - inn.z0, floor, v: height - floor * STOREY, dz, px, py };
  if (floor >= inn.storeys) return roofAt(c, s, height - inn.storeys * STOREY);
  return floor === 0 ? groundAt(c, inn, s) : upperAt(c, inn, s);
};

// ---- the stone walks, the embankment and the river ----

const snowyOf = (c: Colors<K>): boolean => c.snow !== c.roof;

// Square setts, a drift of snow along the river's edge and another banked against the inns.
const walkAt = (c: Colors<K>, v: View, hit: Hit, x: number, y: number): string => {
  const across = hit.u;
  if (across < v.half + 0.12) return snowyOf(c) ? c.snow : c.stoneLit;
  if (across > v.front - 0.45) return snowyOf(c) ? c.snow : c.stoneLo;
  if (hit.z < 14 && (frac(hit.z / 0.6) < 0.1 || frac(across / 0.5) < 0.1)) return c.stoneLo;
  return snowyOf(c) && bayer(x, y) < 0.3 ? c.snowLo : c.stone;
};

// Coursed stone dropping to the water, with a capping course along the top and a wet, dark foot.
const wallAt = (c: Colors<K>, hit: Hit): string => {
  if (hit.u > BANK - 0.16) return snowyOf(c) ? c.snowLit : c.stoneLit;
  if (hit.u < 0.18) return c.stoneLo;
  const course = Math.floor(hit.u / 0.34);
  if (hit.z < 26 && frac(hit.u / 0.34) < 0.16) return c.stoneLo;
  return hit.z < 14 && frac((hit.z + course * 0.37) / 0.74) < 0.08 ? c.stoneLo : c.stone;
};

// The river mirrors what stands over it: a ray bounced off the water meets the embankment, the walk's edge or an
// inn's front at the height it would have reached under the water, and the water's own color tints it.
const mirrorAt = (c: Colors<K>, v: View, x: number, y: number): string => {
  const off = x + 0.5 - v.vx;
  const a = Math.max(0.25, Math.abs(off));
  const dy = y + 0.5 - v.hz;
  const depth = (v.F * EYE) / dy;
  const base = Math.min(1, depth / 28) > bayer(x, y) ? c.waterFar : c.water;
  const wall = (dy * v.half) / a - EYE;
  if (wall < BANK) return mixHex(wall > BANK - 0.16 ? c.stoneLit : c.stoneLo, base, 0.6);
  const zf = (v.F * v.front) / a;
  const up = (dy * zf) / v.F - EYE;
  const seen = up < BANK ? c.stoneLo : zf < FAR ? frontAt(c, v, { on: 'front', z: zf, u: up, side: off < 0 ? -1 : 1 }, x, y) : null;
  return mixHex(seen ?? c.sky2, base, seen ? 0.5 : 0.65);
};

const solidLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement => {
  const v = viewOf(f);
  return pixelLayer(`ginzan-solid:${colorKey(c)}`, f.w, f.h, (x, y) => {
    const hit = hitOf(v, x, y);
    if (hit.on === 'front') return frontAt(c, v, hit, x, y);
    if (hit.on === 'walk') return walkAt(c, v, hit, x, y);
    return hit.on === 'wall' ? wallAt(c, hit) : null;
  });
};

const waterLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement => {
  const v = viewOf(f);
  return pixelLayer(`ginzan-water:${colorKey(c)}`, f.w, f.h, (x, y) => (hitOf(v, x, y).on === 'water' ? mirrorAt(c, v, x, y) : null));
};

// ---- the head of the valley ----

const slopeAt = (v: View, x: number): number => v.hz - 6 - Math.abs(x - v.vx) * 0.7 - ridgeNoise(x / 8, 23) * 9;

// Steep wooded slopes closing the valley, every crown capped with snow (or blazing with maples in autumn), and the
// river running out of the gap between them.
const valleyLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('ginzan-valley', f, c, (g) => {
    const v = viewOf(f);
    fillRect(g, c.waterFar, 0, v.hz, f.w, Math.round((v.F * EYE) / FAR) + 2);
    fillColumns(g, f.w, v.hz + 1, c.hillLo, (x) => slopeAt(v, x));
    for (let i = 0; i < f.w / 2; i++) {
      const x = Math.round(rand(i, 25) * f.w);
      const y = Math.round(slopeAt(v, x) + 3 + rand(i, 26) * Math.max(2, v.hz - slopeAt(v, x) - 4));
      puff(g, x, y, 2 + Math.round(rand(i, 27) * 2), [c.hillLo, c.hill, c.hillLit]);
    }
  });

// The falls at the head of the valley: white water sliding down the gap in dashes, spray at its foot.
const waterfall = (ctx: Ctx, f: Frame, v: View, c: Colors<K>): void => {
  const top = Math.round(slopeAt(v, v.vx)) + 2;
  for (let y = top; y < v.hz + 1; y++) {
    const on = frac((y - f.t * 14) / 5) < 0.65;
    fillRect(ctx, on ? c.fall : c.hillLit, v.vx - 1, y, 2, 1);
    if (frac((y - f.t * 11) / 7) < 0.4) fillRect(ctx, c.fall, v.vx + 1, y, 1, 1);
  }
  drawGlow(ctx, c.steam, v.vx, v.hz, 6, 3, 0.5);
};

// ---- gas lamps ----

// The lamps stand at the river's edge of the walks, every seven metres on each bank, staggered across the river.
const LAMPS = Array.from({ length: 14 }, (_, i) => ({ side: i % 2 === 0 ? -1 : 1, z: 4.2 + i * 3.6 }));

// One step of a glow's size: glows are cached by size, so the sizes are kept to a handful.
const step4 = (n: number): number => Math.max(4, Math.min(20, Math.round(n / 4) * 4));

// The lantern on top of a post: glass panes widening toward the top round a central bar, the flame's amber low in
// them, a tray underneath and a hipped cap with a finial (snow on it in winter).
const lantern = (ctx: Ctx, cx: number, y: number, box: number, tall: number, c: Colors<K>, flare: boolean): void => {
  const half = Math.max(1, Math.floor(box / 2));
  for (let r = 0; r < tall; r++) {
    const w = half - (r > tall * 0.6 && half > 2 ? 1 : 0);
    fillRect(ctx, c.ink, cx - w - 1, y + r, w * 2 + 3, 1);
    fillRect(ctx, r > tall * 0.55 || flare ? c.win : c.lampHi, cx - w, y + r, w * 2 + 1, 1);
  }
  if (half > 2) fillRect(ctx, c.ink, cx, y, 1, tall);
  fillRect(ctx, c.ink, cx - half - 1, y + tall, half * 2 + 3, 1);
  const cap = Math.max(1, Math.round(tall / 3));
  for (let k = 0; k <= cap; k++)
    fillRect(ctx, k === cap - 1 && snowyOf(c) ? c.snowLit : c.ink, cx - half - 2 + k, y - 1 - k, half * 2 + 5 - k * 2, 1);
  fillRect(ctx, c.ink, cx, y - cap - 3, 1, 2);
};

// An iron post with its lantern; the light pools round it and runs down the river in a broken streak. The flame
// flickers now and then and flares on a strong kick.
const gasLamp = (ctx: Ctx, f: Frame, v: View, c: Colors<K>, i: number): void => {
  const lamp = LAMPS[i] ?? { side: 1, z: FAR };
  const across = lamp.side * (v.half + 0.35);
  const foot = project(v, across, BANK, lamp.z);
  if (foot.x < -24 || foot.x > f.w + 24) return;
  const head = project(v, across, BANK + 3, lamp.z);
  const tall = Math.max(3, Math.round(foot.ppm * 0.4));
  const cx = Math.round(head.x);
  const y = Math.round(head.y);
  drawGlow(ctx, c.glow, cx, y + tall / 2, step4(foot.ppm * 0.9), step4(foot.ppm * 0.8), f.kick > 0.7 ? 0.5 : 0.375, 2);
  const mirror = project(v, across, -BANK - 3, lamp.z);
  lightStreak(ctx, f, cx, Math.round(mirror.y), Math.min(48, Math.round(foot.ppm * 3)), c.glow);
  const post = Math.max(1, Math.round(foot.ppm * 0.07));
  fillRect(ctx, c.ink, cx - Math.floor(post / 2), y + tall, post, Math.round(foot.y) - y - tall);
  if (foot.ppm > 14) fillRect(ctx, c.ink, cx - 2, y + tall + Math.round(foot.ppm * 0.3), 5, 1);
  lantern(ctx, cx, y, Math.max(2, Math.round(foot.ppm * 0.32)), tall, c, rand(Math.floor(f.t * 6), i) < 0.12);
};

// ---- the arched footbridge ----

// Where the footbridge crosses, its arch's rise in the middle, and its rail's height over the deck.
const BRIDGE = 9;
const RISE = 0.55;
const RAIL = 0.9;

/** The deck's height at a point across the river: level over the walks, arching over the water. */
const deckAt = (v: View, across: number): number => (Math.abs(across) >= v.half ? BANK : BANK + RISE * (1 - (across / v.half) ** 2));

// Columns of the bridge's front, from the near side's rail down through the deck to the beam under it.
const bridgeColumn = (g: Ctx, v: View, c: Colors<K>, x: number, z: number): void => {
  const across = ((x + 0.5 - v.vx) * z) / v.F;
  const top = project(v, across, deckAt(v, across), z);
  const deck = Math.max(2, Math.round(top.ppm * 0.3));
  fillRect(g, c.wood, x, Math.round(top.y), 1, deck);
  fillRect(g, snowyOf(c) ? c.snowLit : c.woodLit, x, Math.round(top.y), 1, 1);
  fillRect(g, c.woodLo, x, Math.round(top.y) + deck, 1, 1);
};

// A rail along the arch at depth z: a top rail capped with snow, a mid rail, and posts every metre or so.
const paintRail = (g: Ctx, v: View, c: Colors<K>, z: number): void => {
  const span = v.half + 0.6;
  const x0 = Math.round(project(v, -span, 0, z).x);
  const x1 = Math.round(project(v, span, 0, z).x);
  for (let x = x0; x <= x1; x++) {
    const across = ((x + 0.5 - v.vx) * z) / v.F;
    const deck = deckAt(v, across);
    fillRect(g, c.woodLit, x, Math.round(project(v, across, deck + RAIL, z).y), 1, 1);
    fillRect(g, snowyOf(c) ? c.snowLit : c.woodLit, x, Math.round(project(v, across, deck + RAIL, z).y) - 1, 1, 1);
    fillRect(g, c.wood, x, Math.round(project(v, across, deck + RAIL * 0.45, z).y), 1, 1);
  }
  for (let k = 0; k <= 8; k++) {
    const across = -span + (k * span * 2) / 8;
    const top = project(v, across, deckAt(v, across) + RAIL, z);
    const foot = project(v, across, deckAt(v, across), z);
    fillRect(g, c.woodLo, Math.round(top.x), Math.round(top.y), Math.max(1, Math.round(top.ppm * 0.1)), Math.round(foot.y - top.y));
  }
};

const bridgeBackLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('ginzan-bridge-back', f, c, (g) => {
    const v = viewOf(f);
    paintRail(g, v, c, BRIDGE + 1.2);
    const span = v.half + 0.6;
    const x0 = Math.round(project(v, -span, 0, BRIDGE).x);
    const x1 = Math.round(project(v, span, 0, BRIDGE).x);
    for (let x = x0; x <= x1; x++) bridgeColumn(g, v, c, x, BRIDGE);
  });

const bridgeFrontLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('ginzan-bridge-front', f, c, (g) => paintRail(g, viewOf(f), c, BRIDGE));

// ---- the couple ----

// One of the pair, facing right in a yukata under a short haori, hair dark, on wooden clogs; `bun` puts her hair up.
// Designed 21 pixels tall (1.6 m) and modelled at the bridge's scale. o ink, h hair, s skin, y yukata, Y its shade,
// w its white pattern, r haori, k clogs.
const strollerOf = (scale: number, bun: boolean, stride: number): Sprite =>
  figureAt(
    scale,
    11,
    21,
    [
      ['k', box(2.6 - stride, 19.6, 4.6 - stride, 21)],
      ['k', box(5.4 + stride, 19.6, 7.4 + stride, 21)],
      ['y', box(2.8, 6.5, 7.6, 19.8)],
      ['Y', box(2.8, 15, 7.6, 19.8)],
      ['w', (x, y) => y > 13 && y < 19 && (Math.floor(x) + Math.floor(y)) % 3 === 0 && x > 3 && x < 7.4],
      ['r', box(2.4, 6.4, 8, 12.6)],
      ['r', box(1.6, 7.4, 3.2, 12)],
      ['r', stick([7, 8], [8.6, 10], 0.9)],
      ['s', oval(8.8, 10, 0.9, 0.9)],
      ['h', oval(5, 3.4, 2.7, 2.8)],
      ['h', bun ? oval(2.8, 1.6, 1.5, 1.3) : box(0, 0, 0, 0)],
      ['s', both(oval(5.4, 3.9, 2.3, 2.3), (x, y) => x > 5.2 && y > 2.6)],
    ],
    [[7, 3, 'o']],
  );

/** Both of them in both steps, facing right and facing left. */
type Pair = { readonly her: readonly Sprite[]; readonly him: readonly Sprite[] };
type Strollers = { readonly right: Pair; readonly left: Pair };

const strollers = new Map<string, Strollers>();
const strollersAt = (scale: number): Strollers =>
  cached(strollers, 4, scale.toFixed(2), () => {
    const right = {
      her: [strollerOf(scale, true, 0.6), strollerOf(scale, true, -0.4)],
      him: [strollerOf(scale, false, -0.4), strollerOf(scale, false, 0.6)],
    };
    return { right, left: { her: right.her.map(flipped), him: right.him.map(flipped) } };
  });

const herPalette = paletteBy<K>((c) => ({
  o: c.ink,
  h: c.hair,
  s: c.skin,
  y: c.yukata,
  Y: c.yukataLo,
  w: c.white,
  r: c.haori,
  k: c.woodLo,
}));
const himPalette = paletteBy<K>((c) => ({
  o: c.ink,
  h: c.hair,
  s: c.skin,
  y: c.yukataLo,
  Y: c.yukataLo,
  w: c.yukata,
  r: c.robe,
  k: c.woodLo,
}));

/** Where the couple are across the bridge, and which way they face: they stroll over and back, very slowly. */
const strollOf = (f: Frame, v: View): { readonly across: number; readonly dir: 1 | -1 } => {
  const phase = frac(0.2 + f.t / 90);
  const there = phase < 0.5 ? phase * 2 : 2 - phase * 2;
  return { across: -v.half * 0.7 + there * v.half * 1.4, dir: phase < 0.5 ? 1 : -1 };
};

// The pair crossing the footbridge, she a step ahead, each under a paper umbrella; they step once a beat and their
// umbrellas lift a little on the first beat of the bar.
const couple = (ctx: Ctx, f: Frame, v: View, c: Colors<K>): void => {
  const { across, dir } = strollOf(f, v);
  const scale = Math.round((v.F / (BRIDGE + 0.5)) * 1.6 * 4) / (21 * 4);
  const pair = strollersAt(scale)[dir > 0 ? 'right' : 'left'];
  const at = (n: number): number => Math.round(n * scale);
  const step = Math.floor(f.beat) % 2;
  const lift = frac(f.beat / 4) < 0.2 ? 1 : 0;
  const walkers = [
    { at: across - dir * 0.6, sprite: pair.him[step] as Sprite, palette: himPalette(c), paper: c.brolly2, shade: c.yukataLo },
    { at: across, sprite: pair.her[1 - step] as Sprite, palette: herPalette(c), paper: c.brolly, shade: c.brollyLo },
  ];
  for (const one of walkers) {
    const foot = project(v, one.at, deckAt(v, one.at), BRIDGE + 0.5);
    const x = Math.round(foot.x);
    const y = Math.round(foot.y);
    drawSprite(ctx, one.sprite, one.palette, x - Math.floor((one.sprite[0]?.length ?? 0) / 2), y - one.sprite.length);
    const tones = { paper: one.paper, shade: one.shade, ring: c.white, ink: c.ink };
    drawWagasa(ctx, x + dir * at(1), y - at(28) - lift, at(7), tones, x + dir * at(3), y - at(11));
  }
};

// ---- steam ----

// Wisps of steam rising off the warm river, swelling and thinning as they climb and lean with the air.
const steam = (ctx: Ctx, f: Frame, v: View, c: Colors<K>, near: number, far: number): void => {
  for (let i = 0; i < 14; i++) {
    const z = 5 + rand(i, 61) * 30;
    if (z < near || z >= far) continue;
    const age = frac(f.t * 0.07 + rand(i, 62));
    const p = project(v, (rand(i, 63) * 2 - 1) * v.half * 0.8 + age * 0.8, age * 3, z);
    const r = step4(p.ppm * (0.6 + age * 1.4));
    drawGlow(ctx, c.steam, p.x, p.y, r, Math.max(2, Math.round(r * 0.6)), age < 0.6 ? 0.25 : 0.125);
  }
};

// ---- per-frame layers ----

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const v = viewOf(f);
  skyBase(ctx, f, { bottom: v.hz + 2, stops: [c.sky0, c.sky1, c.sky2, c.sky3], stars: isDark(c.sky1) ? [c.star, c.sky3] : null, seed: 37 });
  ctx.drawImage(valleyLayer(f, c), 0, 0);
  waterfall(ctx, f, v, c);
};

// The river ripples sideways row by row, more toward us, under the banks and the inns.
const street = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const v = viewOf(f);
  const water = waterLayer(f, c);
  const far = Math.round((v.F * EYE) / FAR) + 2;
  fillRect(ctx, c.waterFar, 0, v.hz + 2, f.w, far);
  fillRect(ctx, c.water, 0, v.hz + 2 + far, f.w, f.h - v.hz - 2 - far);
  for (let y = v.hz + 2; y < f.h; y++) {
    const dx = Math.round(Math.sin(y * 0.7 + f.t * 1.8) * (0.3 + (1.4 * (y - v.hz)) / (f.h - v.hz)));
    ctx.drawImage(water, 0, y, f.w, 1, dx, y, f.w, 1);
  }
  ctx.drawImage(solidLayer(f, c), 0, 0);
};

// Back to front: the lamps and steam beyond the footbridge, the bridge with the couple on it, then the nearer ones.
const life = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const v = viewOf(f);
  for (let i = LAMPS.length - 1; i >= 0; i--) if ((LAMPS[i]?.z ?? 0) > BRIDGE) gasLamp(ctx, f, v, c, i);
  steam(ctx, f, v, c, BRIDGE, FAR);
  ctx.drawImage(bridgeBackLayer(f, c), 0, 0);
  couple(ctx, f, v, c);
  ctx.drawImage(bridgeFrontLayer(f, c), 0, 0);
  steam(ctx, f, v, c, 0, BRIDGE);
  for (let i = LAMPS.length - 1; i >= 0; i--) if ((LAMPS[i]?.z ?? FAR) <= BRIDGE) gasLamp(ctx, f, v, c, i);
};

// A maple leaf tumbling down: open, edge-on and turning.
const MAPLE: readonly Sprite[] = [['.a.', 'aba', '.a.'], ['a.a', '.b.', 'a.a'], ['ab', 'ba'], ['aab']];
const maplePalettes = [
  paletteBy<K>((c) => ({ a: c.flake, b: c.hillLit })),
  paletteBy<K>((c) => ({ a: c.hillLit, b: c.brollyLo })),
] as const;

// Snow keeps falling in winter; in autumn maple leaves drift down instead.
const weather = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  if (snowyOf(c)) {
    snowfall(ctx, f, c.flake, Math.round((f.w * f.h) / 220), 59);
    return;
  }
  const palettes = maplePalettes.map((p) => p(c));
  flutter(ctx, f, MAPLE, palettes, {
    count: Math.round((f.w * f.h) / 2000),
    seed: 63,
    fall: 9,
    drift: 5,
    sway: 5,
    spin: 2,
    top: 0,
    bottom: f.h,
  });
};

// The iconic night: deep blue sky, snow on everything, every window and lamp burning amber.
const NIGHT: Colors<K> = {
  ...{ sky0: '#05081a', sky1: '#0b1230', sky2: '#162048', sky3: '#26305e', star: '#e8ecff', hill: '#121a34' },
  ...{ hillLo: '#0a1026', hillLit: '#56669a', fall: '#c4d4ff', wood: '#4a2e2a', woodLit: '#7c5238', woodLo: '#22141a' },
  ...{ plaster: '#bcbacc', plasterLo: '#7c7a96', roof: '#262636', snow: '#a6b2d8', snowLit: '#eef2ff', snowLo: '#66729e' },
  ...{ win: '#ffd27a', winLo: '#c8863c', glow: '#ffae4e', lampHi: '#fff4d0', stone: '#464a62', stoneLit: '#6c6e88' },
  ...{ stoneLo: '#282a40', water: '#0a1126', waterFar: '#1c2650', steam: '#c4cce4', skin: '#f4d0b4', hair: '#1a1418' },
  ...{ yukata: '#2c3c7c', yukataLo: '#1a2452', haori: '#8a2a3a', robe: '#2c2a3a', brolly: '#cc3a3a', brollyLo: '#8a2228' },
  ...{ brolly2: '#3a4c80', white: '#f2f2fa', ink: '#08060e', flake: '#eef2ff' },
};

// Blue hour: the last light still in the sky, the snow gone blue, the lamps just lit.
const BLUE: Colors<K> = {
  ...{ sky0: '#18286a', sky1: '#2c428e', sky2: '#566cb4', sky3: '#9ca6d8', star: '#e8ecff', hill: '#22305e' },
  ...{ hillLo: '#18224c', hillLit: '#8e9cd0', fall: '#dce6ff', wood: '#563a36', woodLit: '#8a6048', woodLo: '#2c1e26' },
  ...{ plaster: '#ccccdc', plasterLo: '#8c8eae', roof: '#30324a', snow: '#b4c2ec', snowLit: '#f2f6ff', snowLo: '#7a88c0' },
  ...{ win: '#ffd884', winLo: '#c8904a', glow: '#ffb85a', lampHi: '#fff6d8', stone: '#5a6082', stoneLit: '#8086a6' },
  ...{ stoneLo: '#363c5e', water: '#18265a', waterFar: '#3c4c8c', steam: '#d4dcf2', skin: '#f4d0b4', hair: '#1e181c' },
  ...{ yukata: '#30428a', yukataLo: '#1e2a5a', haori: '#963040', robe: '#30304a', brolly: '#d23e3e', brollyLo: '#902630' },
  ...{ brolly2: '#e2c45a', white: '#f4f4fc', ink: '#0c0a16', flake: '#f2f6ff' },
};

// Autumn dusk: no snow (it shares the roof's color), maples blazing on the slope and leaves drifting down instead.
const AUTUMN: Colors<K> = {
  ...{ sky0: '#3a2c5c', sky1: '#86486a', sky2: '#de7e5a', sky3: '#f6c27e', star: '#ffe8d0', hill: '#4a2a2e' },
  ...{ hillLo: '#2c1a24', hillLit: '#d8623a', fall: '#f4e2d0', wood: '#5a3428', woodLit: '#8e5a3a', woodLo: '#2e1a1e' },
  ...{ plaster: '#dccab2', plasterLo: '#a08a7e', roof: '#3a3036', snow: '#3a3036', snowLit: '#5c4a4c', snowLo: '#2a2028' },
  ...{ win: '#ffd07a', winLo: '#c88442', glow: '#ffb258', lampHi: '#fff2d0', stone: '#5e5058', stoneLit: '#8a7478' },
  ...{ stoneLo: '#3a2e38', water: '#2a2040', waterFar: '#8a5468', steam: '#ecd0c8', skin: '#f6d2b2', hair: '#221818' },
  ...{ yukata: '#2e3e78', yukataLo: '#1c2650', haori: '#6a3a2a', robe: '#3a2e2e', brolly: '#d8463a', brollyLo: '#902a26' },
  ...{ brolly2: '#2e4a5a', white: '#fff4ea', ink: '#140c12', flake: '#e8582a' },
};

export const ginzanOnsen = defineScene<K>({
  id: 'ginzan-onsen',
  title: 'Gaslit Onsen',
  mood: { valence: 0, energy: -0.55 },
  styles: ['snowfall', 'showa-ballad', 'lofi-loop', 'town-waltz', 'city-lights'],
  variants: [
    { mood: { valence: -0.15, energy: -0.65 }, colors: NIGHT },
    { mood: { valence: 0.1, energy: -0.45 }, colors: BLUE },
    { mood: { valence: 0.35, energy: -0.5 }, colors: AUTUMN },
  ],
  layers: [sky, street, life, weather],
});
