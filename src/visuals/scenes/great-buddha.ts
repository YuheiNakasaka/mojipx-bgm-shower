// The Great Buddha of Kamakura: the seated bronze Buddha, weathered green-grey, rests in meditation on its stone base
// under the open sky, between the temple's trees, a stone lantern and the incense burner with its smoke. The statue
// never moves; the world around it does: rain on the wet stones and hydrangeas, towering summer clouds and swallows,
// golden ginkgo leaves falling, pigeons pecking on the beat, and a soft light rising behind the head at the phrase.
import { type Ctx, drawSprite, drawSpriteFoot, fillRect, type Sprite } from 'mojipx';
import { bayer, cached, fillColumns, frac, hexToRgb, memoLayer, rand, ridgeNoise } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import {
  cloudCanvas,
  colorKey,
  drawGlow,
  driftingClouds,
  fillDither,
  flock,
  paletteBy,
  type Rgb,
  setPixel,
  smokePlume,
  wrap,
} from './batch-1-helpers.ts';
import { sunWithHalo } from './batch-4-helpers.ts';
import { BIRD, noise2, STONE_LANTERN } from './batch-5-helpers.ts';
import { frameLayer, mirrorWater, rain, rainRings } from './batch-6-helpers.ts';
import { flutter, type Plan, planOf, puff, skyBase } from './batch-9-helpers.ts';
import { drawVisitor, type Visitor } from './batch-18-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sky3'
  | 'sun'
  | 'cloud'
  | 'cloudLo'
  | 'hill'
  | 'tree'
  | 'treeLo'
  | 'treeLit'
  | 'gold'
  | 'goldLo'
  | 'goldLit'
  | 'bark'
  | 'bronzeHi'
  | 'bronze'
  | 'bronzeLo'
  | 'bronzeDeep'
  | 'patina'
  | 'rust'
  | 'ink'
  | 'stone'
  | 'stoneHi'
  | 'stoneLo'
  | 'ground'
  | 'groundLo'
  | 'bloom'
  | 'bloomLit'
  | 'bloomLo'
  | 'bloomAlt'
  | 'rain'
  | 'halo'
  | 'smoke'
  | 'coat0'
  | 'coat1'
  | 'coat2'
  | 'hair';

// ---- layout ----

type Spot = 'cx' | 'ground' | 'ridge' | 'lanternX' | 'lanternY' | 'burnerY';

const WIDE: Plan<Spot> = {
  cx: ['w', 0.5],
  ground: ['h', 0.9],
  ridge: ['h', 0.6],
  lanternX: ['w', 0.2],
  lanternY: ['h', 0.97],
  burnerY: ['h', 0.97],
};

const TALL: Plan<Spot> = {
  cx: ['w', 0.5],
  ground: ['h', 0.8],
  ridge: ['h', 0.62],
  lanternX: ['w', 0.12],
  lanternY: ['h', 0.93],
  burnerY: ['h', 0.88],
};

type Layout = Readonly<Record<Spot, number>> & {
  /** Pixels per unit of the statue, which is 84 units wide and 100 tall; its top and the foot of the figure. */
  readonly s: number;
  readonly top: number;
  readonly foot: number;
};

const layouts = new Map<string, Layout>();

const layoutOf = (f: Frame): Layout =>
  cached(layouts, 8, `${f.w}x${f.h}`, () => {
    const m = planOf(f, WIDE, TALL);
    const s = f.w > f.h ? (f.h * 0.6) / 100 : Math.min((f.w * 0.8) / 84, (f.h * 0.44) / 112);
    const foot = m.ground - Math.round(12 * s);
    return { ...m, s, foot, top: foot - Math.round(100 * s) };
  });

type Season = 'rain' | 'summer' | 'autumn';
// The colors tell the season: rain has a color of its own only in the rainy season, and the ginkgo turns gold in autumn.
const seasonOf = (c: Colors<K>): Season => (c.rain !== c.sky1 ? 'rain' : c.gold !== c.tree ? 'autumn' : 'summer');

// ---- the statue, modelled in units: u runs from -42 to 42 across the knees, v from 0 at the top knot to 100 ----

type V = readonly [number, number];
type Shape =
  | { readonly kind: 'ell'; readonly c: V; readonly r: V }
  | { readonly kind: 'cap'; readonly a: V; readonly b: V; readonly r: number };
type Group = 'torso' | 'neck' | 'lap' | 'arm' | 'hands' | 'ear' | 'head' | 'face';
type Part = { readonly shape: Shape; readonly group: Group; readonly z: number; readonly dim: number };

const ell = (c: V, r: V): Shape => ({ kind: 'ell', c, r });
const cap = (a: V, b: V, r: number): Shape => ({ kind: 'cap', a, b, r });
const pair = (make: (k: number) => Part): readonly Part[] => [make(-1), make(1)];

// Where the curls stop and the brow begins.
const hairline = (u: number): number => 18 + (u / 12) ** 2 * 3.5;

// Back to front: the body, the crossed legs, the arms and the hands resting in the lap, the head with its curls and
// its long ears, and the face. Overlapping parts of different groups get a dark contour where they meet.
const PARTS: readonly Part[] = [
  { shape: ell([0, 60], [27, 21]), group: 'torso', z: 1, dim: 0 },
  { shape: ell([0, 39.5], [8.5, 3.6]), group: 'neck', z: 2, dim: -0.4 },
  { shape: ell([0, 88.5], [41, 11.5]), group: 'lap', z: 2, dim: 0 },
  ...pair((k) => ({ shape: ell([k * 31, 90], [11, 10]), group: 'lap', z: 2, dim: 0 })),
  ...pair((k) => ({ shape: cap([k * 21, 47], [k * 30, 64], 7), group: 'arm', z: 3, dim: 0 })),
  ...pair((k) => ({ shape: cap([k * 30, 66], [k * 11, 77], 6), group: 'arm', z: 4, dim: 0 })),
  { shape: ell([0, 77], [12, 5.2]), group: 'hands', z: 5, dim: 0.05 },
  { shape: ell([0, 18], [14, 12]), group: 'head', z: 3, dim: 0 },
  { shape: ell([0, 7], [8.5, 6.5]), group: 'head', z: 3, dim: 0.05 },
  ...pair((k) => ({ shape: cap([k * 13.6, 19], [k * 14.6, 35], 2.6), group: 'ear', z: 4, dim: -0.1 })),
  { shape: ell([0, 26.5], [12.3, 11]), group: 'face', z: 5, dim: 0.05 },
];

/** The point's offset from the shape's centre (or axis), in shape radii. */
const local = (sh: Shape, u: number, v: number): V => {
  if (sh.kind === 'ell') return [(u - sh.c[0]) / sh.r[0], (v - sh.c[1]) / sh.r[1]];
  const dx = sh.b[0] - sh.a[0];
  const dy = sh.b[1] - sh.a[1];
  const t = Math.max(0, Math.min(1, ((u - sh.a[0]) * dx + (v - sh.a[1]) * dy) / (dx * dx + dy * dy)));
  return [(u - sh.a[0] - t * dx) / sh.r, (v - sh.a[1] - t * dy) / sh.r];
};

const insideOf = (p: Part, u: number, v: number): boolean => {
  const [x, y] = local(p.shape, u, v);
  return x * x + y * y <= 1 && (p.group !== 'face' || v >= hairline(u));
};

const partAt = (u: number, v: number): number => {
  let hit = -1;
  for (let i = 0; i < PARTS.length; i++) if (insideOf(PARTS[i] as Part, u, v)) hit = i;
  return hit;
};

// The snail-shell curls: rows of round bumps, each lit on its upper left and shaded on its lower right, every other
// column of them set a pixel lower.
const CURL = [0.3, 0.15, -0.1, 0.15, 0, -0.25, -0.1, -0.25, -0.4] as const;

const curl = (x: number, y: number): number => CURL[((y + (Math.floor(x / 3) % 2)) % 3) * 3 + (x % 3)] as number;

// The robe over both shoulders opens on the chest; its rolled edge and the folds below follow the neckline.
const neckline = (u: number): number => 56 - (u / 14) ** 2 * 15;

const robe = (u: number, v: number, s: number): number => {
  const d = (v - neckline(u)) * s;
  if (d < 0) return 0.08;
  if (d < 1.5) return 0.3;
  if (d < 2.5) return -0.4;
  const k = frac(d / (5.5 * s));
  return k < 0.6 / (5.5 * s) + 0.06 ? -0.35 : 0;
};

// The sleeves fall in two long folds along each arm.
const sleeve = (p: Part, u: number, v: number, s: number): number => {
  const sh = p.shape;
  if (sh.kind !== 'cap') return 0;
  const [lx, ly] = local(sh, u, v);
  const dx = sh.b[0] - sh.a[0];
  const dy = sh.b[1] - sh.a[1];
  const q = ((dx * ly - dy * lx) / Math.hypot(dx, dy)) * Math.sign(dx);
  return Math.abs(q + 0.3) * sh.r * s < 0.6 || Math.abs(q - 0.4) * sh.r * s < 0.6 ? -0.35 : 0;
};

// Over the legs the robe gathers in arcs around the hands.
const lapFold = (u: number, v: number, s: number): number => {
  const d = Math.hypot(u / 1.7, (v - 76) * 1.1);
  const k = (d % 6) * s;
  return d > 12 && k < 0.9 ? -0.3 : 0;
};

// The hands lie in the lap palm up, the thumbs and forefingers of each joined in a ring.
const mudra = (u: number, v: number, s: number): number => {
  const e = Math.hypot((Math.abs(u) - 4.4) / 2.6, (v - 75.6) / 1.9);
  if (e < 0.55) return -0.7;
  if (e < 1) return 0.25;
  return Math.abs(u) * s < 0.6 && v > 76.5 ? -0.4 : 0;
};

const detail = (p: Part, u: number, v: number, x: number, y: number, s: number): number => {
  switch (p.group) {
    case 'head':
      return curl(x, y);
    case 'torso':
      return robe(u, v, s);
    case 'arm':
      return sleeve(p, u, v, s);
    case 'lap':
      return lapFold(u, v, s);
    case 'hands':
      return mudra(u, v, s);
    default:
      return 0;
  }
};

// Light from the upper left on rounded masses.
const lightOf = (p: Part, u: number, v: number): number => {
  const [x, y] = local(p.shape, u, v);
  const nz = Math.sqrt(Math.max(0, 1 - x * x - y * y));
  return -0.45 * x - 0.45 * y + 0.72 * nz + p.dim;
};

const DEEP = 0;
const LO = 1;
const MID = 2;
const HI = 3;
const PATINA = 4;
const RUST = 5;
const INK = 6;

// Verdigris runs down in streaks from where rain sits; brown bronze shows through in patches.
const weathered = (tone: number, u: number, v: number, x: number, y: number): number => {
  if (tone >= MID && noise2(u * 0.45, v * 0.05, 7) > 0.7 && bayer(x, y) < 0.6) return PATINA;
  if (v > 44 && tone === MID && noise2(u * 0.12, v * 0.12, 11) < 0.17 && bayer(x, y) < 0.5) return RUST;
  return tone;
};

type Grid = { readonly w: number; readonly h: number; readonly at: Int8Array };

const zAt = (g: Grid, x: number, y: number): number => {
  if (x < 0 || y < 0 || x >= g.w || y >= g.h) return -1;
  const i = g.at[y * g.w + x] as number;
  return i < 0 ? -1 : (PARTS[i] as Part).z;
};

// A part meets another in front of it (of another group): its edge there is a dark contour.
const behind = (g: Grid, x: number, y: number, p: Part): boolean => {
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const) {
    const j = g.at[(y + dy) * g.w + x + dx];
    if (j === undefined || j < 0 || x + dx < 0 || x + dx >= g.w) continue;
    const q = PARTS[j] as Part;
    if (q.z > p.z && q.group !== p.group) return true;
  }
  return false;
};

const toneAt = (g: Grid, x: number, y: number, s: number): number => {
  const i = g.at[y * g.w + x] as number;
  if (i < 0) return Math.max(zAt(g, x + 1, y), zAt(g, x - 1, y), zAt(g, x, y + 1), zAt(g, x, y - 1)) >= 0 ? INK : -1;
  const p = PARTS[i] as Part;
  if (behind(g, x, y, p)) return DEEP;
  const u = (x + 0.5 - g.w / 2) / s;
  const v = (y - 0.5) / s;
  const l = lightOf(p, u, v) + detail(p, u, v, x, y, s) + (bayer(x, y) - 0.5) * 0.16;
  const tone = l < 0.08 ? DEEP : l < 0.4 ? LO : l < 0.74 ? MID : HI;
  return weathered(tone, u, v, x, y);
};

const gridOf = (w: number, h: number, s: number): Grid => {
  const at = new Int8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) at[y * w + x] = partAt((x + 0.5 - w / 2) / s, (y - 0.5) / s);
  return { w, h, at };
};

const bronzeRgbs = (c: Colors<K>): readonly Rgb[] =>
  [c.bronzeDeep, c.bronzeLo, c.bronze, c.bronzeHi, c.patina, c.rust, c.ink].map(hexToRgb);

// The face and the folds of the neck, drawn over the modelled head as strokes through unit coordinates.
type Stroke = { readonly color: string; readonly at: (t: number) => V };

const faceStrokes = (c: Colors<K>): readonly Stroke[] => [
  ...[-1, 1].flatMap((k) => [
    { color: c.bronzeLo, at: (t: number): V => [k * (1.2 + 9.5 * t), 21.4 - 1.6 * Math.sin(Math.PI * t * 0.9) + t * 0.8] },
    { color: c.bronzeLo, at: (t: number): V => [k * (3 + 6 * t), 24.3 + 0.5 * t * t] },
    { color: c.bronzeDeep, at: (t: number): V => [k * (2.6 + 6.8 * t), 25.6 + 1 * t * t] },
    { color: c.bronzeDeep, at: (t: number): V => [k * 14.1, 21.5 + 10 * t] },
  ]),
  { color: c.bronzeHi, at: (t: number): V => [-0.8, 22 + 8 * t] },
  { color: c.bronzeLo, at: (t: number): V => [1.4, 23 + 7.5 * t] },
  { color: c.bronzeDeep, at: (t: number): V => [-2.8 + 5.6 * t, 31 + 0.5 * Math.sin(Math.PI * t)] },
  { color: c.bronzeDeep, at: (t: number): V => [-3.8 + 7.6 * t, 34 - 0.7 * (2 * t - 1) ** 2] },
  { color: c.bronzeHi, at: (t: number): V => [-2.2 + 4.4 * t, 35.4] },
  { color: c.bronzeHi, at: (): V => [0, 20.8] },
  { color: c.bronzeDeep, at: (t: number): V => [-7 + 14 * t, 38.4 + 0.8 * Math.sin(Math.PI * t)] },
  { color: c.bronzeDeep, at: (t: number): V => [-7.5 + 15 * t, 40.8 + 0.8 * Math.sin(Math.PI * t)] },
];

const drawStrokes = (g: Ctx, strokes: readonly Stroke[], s: number, w: number): void => {
  const steps = Math.ceil(16 * s);
  for (const st of strokes)
    for (let i = 0; i <= steps; i++) {
      const [u, v] = st.at(i / steps);
      fillRect(g, st.color, Math.floor(w / 2 + u * s), Math.floor(v * s + 0.5), 1, 1);
    }
};

const statueCanvas = (s: number, c: Colors<K>): HTMLCanvasElement => {
  const w = Math.ceil(84 * s) + 4;
  const h = Math.ceil(100 * s) + 2;
  return memoLayer(`buddha:${s}:${colorKey(c)}`, w, h, (g) => {
    const grid = gridOf(w, h, s);
    const img = g.createImageData(w, h);
    const rgbs = bronzeRgbs(c);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const tone = toneAt(grid, x, y, s);
        if (tone >= 0) setPixel(img, x, y, rgbs[tone] as Rgb);
      }
    g.putImageData(img, 0, 0);
    drawStrokes(g, faceStrokes(c), s, w);
  });
};

// ---- the stone base: three tiers of granite blocks, each lit along its top ----

const paintBase = (g: Ctx, m: Layout, c: Colors<K>): void => {
  const tiers = [
    [44, 4],
    [50, 5],
    [56, 3],
  ] as const;
  let y = m.foot;
  for (const [half, rise] of tiers) {
    const x0 = Math.round(m.cx - half * m.s);
    const w = Math.round(half * 2 * m.s);
    const h = Math.max(2, Math.round(rise * m.s));
    fillRect(g, c.stone, x0, y, w, h);
    fillRect(g, c.stoneHi, x0, y, w, 1);
    fillRect(g, c.stoneLo, x0, y + h - 1, w, 1);
    fillRect(g, c.stoneLo, x0 + w - 1, y, 1, h);
    for (let x = x0 + Math.round(7 * m.s); x < x0 + w - 2; x += Math.round(9 * m.s)) fillRect(g, c.stoneLo, x, y + 1, 1, h - 1);
    fillRect(g, c.ink, x0 - 1, y, 1, h);
    fillRect(g, c.ink, x0 + w, y, 1, h);
    y += h;
  }
};

// ---- the temple's woods ----

const canopy = (g: Ctx, f: Frame, top: (x: number) => number, r: number, tones: readonly [string, string, string], seed: number): void => {
  const step = Math.max(3, Math.round(r * 1.3));
  for (let row = 0, i = 0; row < f.h; row += step)
    for (let x = -r; x < f.w + r; x += step, i++) {
      const jx = x + Math.round((rand(i, seed) - 0.5) * step);
      const y = top(jx) + row + Math.round(rand(i, seed + 1) * r * 0.5);
      if (y - r < f.h) puff(g, jx, y, Math.max(2, Math.round(r * (0.7 + 0.5 * rand(i, seed + 2)))), tones);
    }
};

const ridgeAt = (f: Frame, m: Layout, x: number): number => m.ridge - ridgeNoise(x / 30, 5) * f.h * 0.08;

// Tall trees stand either side of the statue, leaving the sky open behind its head; in autumn every other one is a
// ginkgo gone gold. Each is given as shares of the frame: trunk x, crown centre y, crown radii, and whether it is a ginkgo.
type Tree = { readonly x: number; readonly cy: number; readonly rx: number; readonly ry: number; readonly ginkgo: boolean };
type TreeSpec = readonly [number, number, number, number, boolean];

const WIDE_TREES: readonly TreeSpec[] = [
  [0.28, 0.55, 0.075, 0.14, true],
  [0.17, 0.44, 0.09, 0.2, false],
  [0.04, 0.3, 0.11, 0.3, true],
];
const TALL_TREES: readonly TreeSpec[] = [
  [0.14, 0.5, 0.15, 0.09, false],
  [0.02, 0.37, 0.2, 0.14, true],
];

const treesOf = (f: Frame): readonly Tree[] =>
  (f.w > f.h ? WIDE_TREES : TALL_TREES).flatMap(([x, cy, rx, ry, ginkgo]) =>
    [x, 1 - x].map((k, side) => ({
      x: Math.round(f.w * k),
      cy: Math.round(f.h * cy),
      rx: Math.round(f.w * rx),
      ry: Math.round(f.h * ry),
      ginkgo: side === 0 ? ginkgo : !ginkgo,
    })),
  );

// A crown of leafy puffs laid ring by ring from its rim inward, so the middle stays in front and lit.
const paintCrown = (g: Ctx, t: Tree, tones: readonly [string, string, string], seed: number): void => {
  const r = Math.max(3, Math.round(Math.min(t.rx, t.ry) * 0.3));
  for (let ring = 3; ring >= 0; ring--) {
    const n = Math.max(1, ring * 4);
    for (let k = 0; k < n; k++) {
      const a = ((k + rand(k, seed + ring) * 0.7) / n) * Math.PI * 2;
      const d = (ring / 3) * (0.85 + 0.15 * rand(k, seed + 9));
      puff(g, Math.round(t.x + Math.cos(a) * d * t.rx), Math.round(t.cy + Math.sin(a) * d * t.ry), r, tones);
    }
  }
};

const paintTree = (g: Ctx, t: Tree, ground: number, c: Colors<K>, seed: number): void => {
  const half = Math.max(1, Math.round(t.rx * 0.09));
  fillRect(g, c.ink, t.x - half - 1, t.cy, half * 2 + 3, ground - t.cy);
  fillRect(g, c.bark, t.x - half, t.cy, half * 2 + 1, ground - t.cy);
  fillRect(g, c.stoneLo, t.x - half, t.cy, 1, ground - t.cy);
  paintCrown(g, t, t.ginkgo ? [c.goldLo, c.gold, c.goldLit] : [c.treeLo, c.tree, c.treeLit], seed);
};

const backdropLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('buddha-woods', f, c, (g) => {
    const m = layoutOf(f);
    const r = f.w > f.h ? 4 : 5;
    fillColumns(g, f.w, f.h, c.hill, (x) => ridgeAt(f, m, x) - 4);
    canopy(g, f, (x) => ridgeAt(f, m, x), r, [c.hill, c.treeLo, c.tree], 21);
    for (const [i, t] of treesOf(f).entries()) paintTree(g, t, m.ground, c, i * 7);
    canopy(g, f, () => m.ground - Math.round(f.h * 0.05), r, [c.treeLo, c.tree, c.treeLit], 23);
  });

// ---- the ground, the base and the statue ----

const paintGround = (g: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  fillRect(g, c.ground, 0, m.ground, f.w, f.h - m.ground);
  for (let y = m.ground; y < f.h; y++) {
    const u = (y - m.ground) / Math.max(1, f.h - m.ground);
    const half = Math.round(f.w * (0.16 + u * 0.14));
    fillRect(g, c.stone, m.cx - half, y, half * 2, 1);
    if ((y - m.ground) % Math.max(3, Math.round(3 + u * 6)) === 0) fillRect(g, c.stoneLo, m.cx - half, y, half * 2, 1);
  }
  for (let i = 0; i < f.w * 2; i++) {
    const x = Math.floor(rand(i, 41) * f.w);
    const y = m.ground + Math.floor(rand(i, 42) * (f.h - m.ground));
    fillRect(g, i % 3 === 0 ? c.groundLo : c.stoneHi, x, y, 1, 1);
  }
  // Fallen leaves: a thick gold carpet in autumn, a few green ones otherwise.
  const leaves = seasonOf(c) === 'autumn' ? f.w * 3 : f.w / 3;
  for (let i = 0; i < leaves; i++) {
    const x = Math.floor(rand(i, 43) * f.w);
    const y = m.ground + 2 + Math.floor(rand(i, 44) * (f.h - m.ground));
    fillRect(g, i % 3 === 0 ? c.goldLit : c.gold, x, y, 2, 1);
  }
  fillDither(g, c.groundLo, 0.5, 0, m.ground, f.w, 2);
};

const statueLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('buddha-statue', f, c, (g) => {
    const m = layoutOf(f);
    paintGround(g, f, m, c);
    paintBase(g, m, c);
    const statue = statueCanvas(m.s, c);
    g.drawImage(statue, Math.round(m.cx - statue.width / 2), m.top);
  });

// ---- in front: the stone lantern, the incense burner and the hydrangea bushes ----

const lanternPalette = paletteBy<K>((c) => ({ o: c.ink, h: c.stoneHi, s: c.stone, d: c.stoneLo, L: c.stoneLo }));

type Burner = { readonly x: number; readonly foot: number; readonly half: number };

const burnerOf = (f: Frame, m: Layout): Burner => ({ x: m.cx, foot: m.burnerY, half: f.w > f.h ? 9 : 13 });

// A wide bronze bowl with two loop handles on a stone stand; sticks of incense stand in its ash.
const paintBurner = (g: Ctx, b: Burner, c: Colors<K>): void => {
  const stand = Math.max(3, Math.round(b.half * 0.4));
  fillRect(g, c.stoneLo, b.x - b.half - 3, b.foot - stand, b.half * 2 + 7, stand);
  fillRect(g, c.stone, b.x - b.half - 3, b.foot - stand, b.half * 2 + 6, stand - 1);
  fillRect(g, c.stoneHi, b.x - b.half - 3, b.foot - stand, b.half * 2 + 6, 1);
  const bowl = Math.round(b.half * 0.8);
  const base = b.foot - stand;
  for (let k = 0; k < bowl; k++) {
    const half = Math.round(b.half * (0.55 + 0.45 * Math.sqrt(k / bowl)));
    const y = base - 1 - k;
    fillRect(g, c.ink, b.x - half - 1, y, half * 2 + 3, 1);
    fillRect(g, c.bronzeLo, b.x - half, y, half * 2 + 1, 1);
    fillRect(g, c.bronze, b.x - half, y, half + 1, 1);
    fillRect(g, c.bronzeHi, b.x - half + 1, y, 1, 1);
  }
  const rim = base - bowl - 1;
  fillRect(g, c.ink, b.x - b.half - 2, rim - 1, b.half * 2 + 5, 3);
  fillRect(g, c.bronzeHi, b.x - b.half - 1, rim, b.half * 2 + 3, 1);
  for (const k of [-1, 1]) {
    fillRect(g, c.ink, b.x + k * (b.half + 1) - 1, rim - 4, 3, 4);
    fillRect(g, c.bronze, b.x + k * (b.half + 1), rim - 3, 1, 2);
  }
  for (const dx of [-2, 0, 2]) fillRect(g, c.rust, b.x + dx, rim - 4 + Math.abs(dx) / 2, 1, 4);
};

const bushesOf = (f: Frame, m: Layout): readonly V[] => {
  const n = f.w > f.h ? 7 : 6;
  return Array.from({ length: n * 2 }, (_, i) => {
    const side = i % 2 === 0 ? 0 : 1;
    const k = Math.floor(i / 2) / n;
    const x = side === 0 ? k * f.w * 0.26 : f.w - k * f.w * 0.26;
    return [Math.round(x), Math.round(m.ground + (f.h - m.ground) * (0.35 + 0.65 * rand(i, 71)))] as const;
  });
};

const frontLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('buddha-front', f, c, (g) => {
    const m = layoutOf(f);
    drawSpriteFoot(g, STONE_LANTERN, lanternPalette(c), m.lanternX, m.lanternY);
    if (f.w > f.h) drawSpriteFoot(g, STONE_LANTERN, lanternPalette(c), f.w - m.lanternX, m.lanternY);
    const b = burnerOf(f, m);
    paintBurner(g, b, c);
    if (seasonOf(c) === 'rain') for (const [x, y] of bushesOf(f, m)) puff(g, x, y, f.w > f.h ? 9 : 11, [c.treeLo, c.tree, c.treeLit]);
  });

// ---- per-frame layers ----

// Summer's clouds pile up into towers behind the woods; they billow upward very slowly.
const towers = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  for (let i = 0; i < 3; i++) {
    const size = Math.round(f.h * (f.w > f.h ? 0.13 : 0.06)) + i * 3;
    const span = f.w + size * 3;
    const x = wrap(rand(i, 31) * span + f.t * 0.6, span) - size * 3;
    const base = (f.w > f.h ? m.ridge - Math.round(f.h * 0.02) : Math.round(f.h * 0.42)) - i * 2;
    for (let k = 0; k < 4; k++) {
      const cloud = cloudCanvas(i + k, Math.round(size * (1 - k * 0.18)), c.cloud, c.cloudLo);
      const lift = Math.round(k * size * 0.75 + Math.sin(f.t * 0.2 + i + k) * 1.2);
      ctx.drawImage(cloud, Math.round(x + k * size * 0.25), base - cloud.height - lift);
    }
  }
};

const heavens = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const season = seasonOf(c);
  if (season === 'summer') {
    sunWithHalo(ctx, Math.round(f.w * 0.16), Math.round(f.h * 0.1), 6, c.sun, c.halo, 3);
    towers(ctx, f, m, c);
    return;
  }
  if (season === 'autumn') drawGlow(ctx, c.sun, Math.round(f.w * 0.8), m.ridge, Math.round(f.w * 0.4), Math.round(f.h * 0.3), 0.5, 5);
  const low = season === 'rain';
  driftingClouds(ctx, f, c.cloud, c.cloudLo, {
    count: low ? 7 : 4,
    top: f.h * 0.04,
    span: m.top + m.s * 30,
    size: low ? 16 : 10,
    speed: low ? 4 : 2,
    seed: 13,
  });
};

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  skyBase(ctx, f, { bottom: m.ground, stops: [c.sky0, c.sky1, c.sky2, c.sky3], stars: null, seed: 3 });
  heavens(ctx, f, m, c);
};

// A soft light gathers behind the head when the scene appears and again every eight bars, then fades.
const glowOf = (f: Frame): number => {
  const meter = f.bar > 0 && f.beat / f.bar < 3.5 ? 3 : 4;
  const since = f.beat - (f.bar - (f.bar % 8)) * meter;
  return Math.max(Math.exp(-f.t / 3), Math.exp(-Math.max(0, since) / 6));
};

const halo = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  const glow = glowOf(f);
  const r = Math.round(m.s * 30);
  drawGlow(ctx, c.halo, m.cx, m.top + Math.round(m.s * 20), r, r, 0.12 + glow * 0.38);
};

const temple = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(backdropLayer(f, c), 0, 0);
  ctx.drawImage(statueLayer(f, c), 0, 0);
  const m = layoutOf(f);
  if (seasonOf(c) === 'rain')
    mirrorWater(ctx, f, { axis: m.ground, bottom: f.h, squash: 2, amp: 0.6, freq: 0.9, speed: 2, tint: c.groundLo, tintLevel: 0.55 });
};

// Incense smoke curls up from the burner and leans away on the breeze.
const incense = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const b = burnerOf(f, m);
  const tip = b.foot - Math.max(3, Math.round(b.half * 0.4)) - Math.round(b.half * 0.8) - 5;
  for (const [k, dx] of [-2, 0, 2].entries()) {
    fillRect(ctx, c.halo, b.x + dx, tip + Math.abs(dx) / 2, 1, 1);
    smokePlume(ctx, f, b.x + dx, tip - 1, c.smoke, k + 5, Math.round(m.s * 14));
  }
};

const VISITORS: readonly ((c: Colors<K>, wet: boolean) => Visitor)[] = [
  (c, wet) => ({ hair: c.hair, face: c.hair, coat: c.coat0, legs: c.ink, brolly: wet ? [c.coat0, c.ink] : null }),
  (c, wet) => ({ hair: c.hair, face: c.hair, coat: c.coat1, legs: c.ink, brolly: wet ? [c.bloomAlt, c.bloomLo] : null }),
  (c, wet) => ({ hair: c.hair, face: c.hair, coat: c.coat2, legs: c.ink, brolly: wet ? [c.coat2, c.ink] : null }),
];

// Two visitors stand gazing up at the Buddha; a third strolls slowly across the forecourt.
const visitors = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const wet = seasonOf(c) === 'rain';
  const h = Math.round(m.s * 9.5);
  const foot = Math.round(m.ground + (f.h - m.ground) * 0.3);
  const make = VISITORS.map((v) => v(c, wet));
  drawVisitor(ctx, Math.round(m.cx - m.s * 30), foot, h, make[0] as Visitor, 2);
  drawVisitor(ctx, Math.round(m.cx + m.s * 34), foot + 2, h - 1, make[1] as Visitor, 2);
  const span = f.w + 40;
  const x = Math.round(wrap(f.t * 4 + f.w * 0.3, span) - 20);
  drawVisitor(ctx, x, Math.round(m.ground + (f.h - m.ground) * 0.75), h + 1, make[2] as Visitor, Math.floor(f.beat) % 2);
};

// A pigeon pottering about: b body, w wing bars, h head and neck, k beak, l legs. Head up, and pecking.
const PIGEON: readonly Sprite[] = [
  ['.....hh.', '....hhhk', '.bbbbhh.', 'bbwbbbb.', '.bbbbbb.', '...l.l..'],
  ['........', 'bb......', 'bwbbbb..', '.bbbbbhh', '..bbbbhh', '...l.l.k'],
];
const pigeonPalette = paletteBy<K>((c) => ({ b: c.stoneHi, w: c.stoneLo, h: c.bronzeLo, k: c.stone, l: c.rust }));

const pigeons = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  if (seasonOf(c) === 'rain') return;
  const y = Math.round(m.ground + (f.h - m.ground) * 0.55);
  for (let i = 0; i < 3; i++) {
    const peck = frac(f.beat + i * 0.33) < 0.3 ? 1 : 0;
    const x = Math.round(m.cx + (i - 1) * m.s * 12 + m.s * 40 * (i === 1 ? -1.6 : 1));
    drawSprite(ctx, PIGEON[peck] as Sprite, pigeonPalette(c), x, y + (i % 2) * 3);
  }
};

// The hydrangea heads nod as the rain hits them, each on its own beat.
const hydrangeas = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const tones: readonly (readonly [string, string, string])[] = [
    [c.bloomLo, c.bloom, c.bloomLit],
    [c.bloomLo, c.bloomAlt, c.bloomLit],
    [c.bloom, c.bloomLit, c.halo],
  ];
  const r = f.w > f.h ? 3 : 4;
  for (const [i, [x, y]] of bushesOf(f, m).entries())
    for (let k = 0; k < 3; k++) {
      const nod = frac(f.beat + rand(i, k + 81)) < 0.18 ? 1 : 0;
      const hx = x + Math.round((rand(i, k + 82) - 0.5) * r * 5);
      const hy = y - r * 2 + Math.round(rand(i, k + 83) * r * 2) + nod;
      puff(ctx, hx, hy, r, tones[(i + k) % tones.length] ?? [c.bloomLo, c.bloom, c.bloomLit]);
    }
};

const forecourt = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  ctx.drawImage(frontLayer(f, c), 0, 0);
  incense(ctx, f, m, c);
  pigeons(ctx, f, m, c);
  visitors(ctx, f, m, c);
  if (seasonOf(c) === 'rain') hydrangeas(ctx, f, m, c);
};

// A ginkgo leaf tumbling: fan, turning, edge on, back. a leaf, b its shade, s stem.
const GINKGO: readonly Sprite[] = [
  ['a.a.a', 'aaaaa', '.aba.', '..s..'],
  ['..aa.', '.aab.', '..s..'],
  ['aabbb'],
  ['b.b.b', 'bbbbb', '.bab.', '..s..'],
];
const ginkgoPalettes = [
  paletteBy<K>((c) => ({ a: c.gold, b: c.goldLo, s: c.goldLo })),
  paletteBy<K>((c) => ({ a: c.goldLit, b: c.gold, s: c.goldLo })),
] as const;
const birdPalette = paletteBy<K>((c) => ({ o: c.ink }));

const weather = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  const season = seasonOf(c);
  if (season === 'rain') {
    rainRings(ctx, f, m.ground + 2, f.h, c.rain, Math.round(f.w / 10), 51);
    rain(ctx, f, c.rain, { count: Math.round((f.w * f.h) / 700), len: 5, slant: 0.18, speed: 150, seed: 52 });
    return;
  }
  flock(ctx, f, BIRD, birdPalette(c), { count: 3, top: f.h * 0.06, span: f.h * 0.14, speed: season === 'summer' ? 16 : -8, seed: 53 });
  if (season === 'autumn')
    flutter(ctx, f, GINKGO, [ginkgoPalettes[0](c), ginkgoPalettes[1](c)], {
      count: Math.round((f.w * f.h) / 1800),
      seed: 54,
      fall: 9,
      drift: 5,
      sway: 5,
      spin: 2.5,
      top: 0,
      bottom: f.h,
    });
};

export const greatBuddha = defineScene<K>({
  id: 'great-buddha',
  title: 'Great Buddha',
  mood: { valence: 0.1, energy: -0.5 },
  styles: ['starlit-dream', 'showa-ballad', 'lofi-loop', 'credits-roll', 'grand-field'],
  variants: [
    {
      // The rainy season: soft grey light, the bronze dark and wet, hydrangeas in bloom along the forecourt.
      mood: { valence: -0.15, energy: -0.6 },
      colors: {
        sky0: '#56647a',
        sky1: '#76869a',
        sky2: '#98a6b2',
        sky3: '#b6c0c4',
        sun: '#e8eef0',
        cloud: '#a6b0ba',
        cloudLo: '#808c9a',
        hill: '#46604e',
        tree: '#2e5a44',
        treeLo: '#1c3a30',
        treeLit: '#4e7a56',
        gold: '#2e5a44',
        goldLo: '#1c3a30',
        goldLit: '#4e7a56',
        bark: '#3a3430',
        bronzeHi: '#8eaaa4',
        bronze: '#66847e',
        bronzeLo: '#46605c',
        bronzeDeep: '#2a3a3a',
        patina: '#86b2a2',
        rust: '#5e5848',
        ink: '#121a1c',
        stone: '#7e868a',
        stoneHi: '#9ea6a8',
        stoneLo: '#565e64',
        ground: '#5a6268',
        groundLo: '#3e464e',
        bloom: '#5a7ae0',
        bloomLit: '#a8c0f6',
        bloomLo: '#5a48a8',
        bloomAlt: '#c87ac4',
        rain: '#c8d4dc',
        halo: '#bcc8ce',
        smoke: '#c4cace',
        coat0: '#d84a5a',
        coat1: '#3a6aa0',
        coat2: '#e8c050',
        hair: '#2a2024',
      },
    },
    {
      // High summer: a deep blue sky, clouds towering behind the woods, the bronze bright where the sun strikes it.
      mood: { valence: 0.35, energy: -0.3 },
      colors: {
        sky0: '#2a6ad8',
        sky1: '#4a8ee8',
        sky2: '#86bcf0',
        sky3: '#cce6f6',
        sun: '#fffbe0',
        cloud: '#ffffff',
        cloudLo: '#c0d2e6',
        hill: '#4a8a5c',
        tree: '#2e7a3e',
        treeLo: '#1a4e30',
        treeLit: '#6ab04e',
        gold: '#2e7a3e',
        goldLo: '#1a4e30',
        goldLit: '#6ab04e',
        bark: '#5a4a3e',
        bronzeHi: '#a6c4b2',
        bronze: '#6c8c80',
        bronzeLo: '#46605a',
        bronzeDeep: '#26363a',
        patina: '#9ccab2',
        rust: '#7a6448',
        ink: '#121a1c',
        stone: '#b4b0a4',
        stoneHi: '#d8d4c6',
        stoneLo: '#7a766e',
        ground: '#d2cab2',
        groundLo: '#a8a088',
        bloom: '#2e7a3e',
        bloomLit: '#6ab04e',
        bloomLo: '#1a4e30',
        bloomAlt: '#f0f0f0',
        rain: '#4a8ee8',
        halo: '#eef6fa',
        smoke: '#e8ecee',
        coat0: '#f4f4ee',
        coat1: '#4a8ad0',
        coat2: '#e86a5a',
        hair: '#2a2024',
      },
    },
    {
      // A late autumn afternoon: the ginkgos gold, warm low light, leaves drifting down past the statue.
      mood: { valence: 0.15, energy: -0.65 },
      colors: {
        sky0: '#5a78c4',
        sky1: '#8ea6d6',
        sky2: '#cec4cc',
        sky3: '#f4d8a8',
        sun: '#ffd890',
        cloud: '#fff0dc',
        cloudLo: '#d8aaa0',
        hill: '#6a6a4c',
        tree: '#4a5a3a',
        treeLo: '#2e3a2a',
        treeLit: '#7a8a4a',
        gold: '#eab424',
        goldLo: '#b87a18',
        goldLit: '#ffe070',
        bark: '#5a4636',
        bronzeHi: '#b0bc9c',
        bronze: '#728676',
        bronzeLo: '#4c5c56',
        bronzeDeep: '#2a3434',
        patina: '#96baa2',
        rust: '#8a6040',
        ink: '#161818',
        stone: '#b0a494',
        stoneHi: '#d4c8b4',
        stoneLo: '#7a6e64',
        ground: '#c8b07a',
        groundLo: '#98804e',
        bloom: '#4a5a3a',
        bloomLit: '#7a8a4a',
        bloomLo: '#2e3a2a',
        bloomAlt: '#f0f0f0',
        rain: '#8ea6d6',
        halo: '#ffe6c0',
        smoke: '#ece4d8',
        coat0: '#8a3a3a',
        coat1: '#3a4a6a',
        coat2: '#d8a040',
        hair: '#2a2024',
      },
    },
  ],
  layers: [sky, halo, temple, forecourt, weather],
});
