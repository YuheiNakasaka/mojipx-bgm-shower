// Himeji's white castle in spring: the great keep with its stacked grey roofs, white plaster and many gables, high on
// its fan-curved stone base between two smaller keeps; cherry trees bloom along the moat, petals gust on every beat,
// herons cross the sky, a boat drifts on the water and, after dark, the keep glows under the lights.
import { type Ctx, drawSprite, fillRect, flipped, type Sprite } from 'mojipx';
import { fillColumns, memoLayer, rand, ridgeNoise } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { colorKey, drawGlow, driftingClouds, fillDither, flock, paletteBy, wrap } from './batch-1-helpers.ts';
import { moon } from './batch-2-helpers.ts';
import { surge } from './batch-3-helpers.ts';
import { sunWithHalo } from './batch-4-helpers.ts';
import { isDark } from './batch-5-helpers.ts';
import { festoon, frameLayer, glints, mirrorWater } from './batch-6-helpers.ts';
import { limb } from './batch-7-helpers.ts';
import { flutter, type Plan, planOf, puff, skyBase, through } from './batch-9-helpers.ts';
import {
  type Eaves,
  type PineTones,
  paintBough,
  paintCanopy,
  paintEaves,
  paintPine,
  px,
  type RoofTones,
  scaleOf,
  type Tones,
} from './batch-16-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sky3'
  | 'sun'
  | 'cloud'
  | 'far'
  | 'farLo'
  | 'wall'
  | 'wallLo'
  | 'window'
  | 'tile'
  | 'tileLo'
  | 'tileLit'
  | 'ink'
  | 'stone'
  | 'stoneLit'
  | 'stoneLo'
  | 'green'
  | 'greenLo'
  | 'greenLit'
  | 'blossom'
  | 'blossomLit'
  | 'blossomLo'
  | 'bark'
  | 'wood'
  | 'water'
  | 'glint'
  | 'lamp'
  | 'glow'
  | 'halo'
  | 'heron'
  | 'heronLo'
  | 'skin';

// ---- layout ----

type Spot = 'keepX' | 'keepTop' | 'hills' | 'bloom' | 'bloomEdge' | 'bank' | 'water' | 'sunX' | 'sunY';
type Layout = Readonly<Record<Spot, number>>;

const WIDE: Plan<Spot> = {
  keepX: ['w', 0.5],
  keepTop: ['h', 0.06],
  hills: ['h', 0.56],
  bloom: ['h', 0.72],
  bloomEdge: ['h', 0.4],
  bank: ['h', 0.8],
  water: ['h', 0.845],
  sunX: ['w', 0.18],
  sunY: ['h', 0.5],
};

const TALL: Plan<Spot> = {
  keepX: ['w', 0.5],
  keepTop: ['h', 0.115],
  hills: ['h', 0.37],
  bloom: ['h', 0.5],
  bloomEdge: ['h', 0.36],
  bank: ['h', 0.64],
  water: ['h', 0.67],
  sunX: ['w', 0.84],
  sunY: ['h', 0.16],
};

const layoutOf = (f: Frame): Layout => planOf(f, WIDE, TALL);

// The colors tell the hour: a dark sky all the way down is night, a dark top over a light horizon is sunset.
const nightOf = (c: Colors<K>): boolean => isDark(c.sky2);
const duskOf = (c: Colors<K>): boolean => !nightOf(c) && isDark(c.sky0);

// ---- the castle, drawn at design size and scaled ----

// A storey: its wall's half-width and height, then its roof's half-span at the eave and its rise.
type Tier = readonly [half: number, wall: number, eave: number, rise: number];
// A gable on the roof of a storey: its offset from the middle, half-width, height, and whether it is curved.
type Gable = readonly [roof: number, dx: number, half: number, height: number, curved: boolean];
type KeepPlan = { readonly dx: number; readonly drop: number; readonly tiers: readonly Tier[]; readonly gables: readonly Gable[] };

const MAIN: KeepPlan = {
  dx: 0,
  drop: 0,
  tiers: [
    [26, 10, 31, 5],
    [22, 9, 27, 5],
    [18, 8, 23, 5],
    [14, 7, 19, 5],
    [11, 7, 16, 8],
  ],
  gables: [
    [0, -14, 6, 8, false],
    [0, 14, 6, 8, false],
    [1, 0, 9, 7, true],
    [2, -6, 6, 8, false],
    [2, 6, 6, 8, false],
    [3, 0, 9, 9, false],
    [4, 0, 7, 7, false],
  ],
};

const WEST: KeepPlan = {
  dx: -47,
  drop: 5,
  tiers: [
    [11, 7, 14, 4],
    [9, 6, 12, 4],
    [7, 6, 10, 7],
  ],
  gables: [
    [0, 0, 5, 6, false],
    [1, 0, 6, 5, true],
  ],
};

const EAST: KeepPlan = {
  dx: 45,
  drop: 7,
  tiers: [
    [10, 6, 13, 4],
    [8, 6, 11, 4],
    [6, 5, 9, 6],
  ],
  gables: [[0, 0, 5, 6, true]],
};

const TURRET: KeepPlan = {
  dx: 0,
  drop: 0,
  tiers: [
    [12, 7, 15, 4],
    [8, 6, 11, 6],
  ],
  gables: [[0, 0, 5, 6, false]],
};

/** Design rows above the main keep's stone base, the base's height, and the castle picture's size. */
const ABOVE = 70;
const BASE = 25;
const PICTURE = [140, ABOVE + BASE + 10] as const;

type Storey = { readonly bottom: number; readonly half: number; readonly wall: number; readonly roof: Eaves };

const storeysOf = (k: KeepPlan, cx: number, base: number, s: number): readonly Storey[] => {
  let bottom = base;
  return k.tiers.map(([half, wall, eave, rise], i) => {
    const next = k.tiers[i + 1];
    const eaveRow = bottom - px(wall, s) + 1;
    const top = next ? px(next[0], s) : px(half * 0.55, s);
    const roof: Eaves = { cx, eave: eaveRow, half: px(eave, s), top, rise: px(rise, s), lift: px(2, s), edge: 1 };
    const storey = { bottom, half: px(half, s), wall: px(wall, s), roof };
    bottom = eaveRow - roof.rise;
    return storey;
  });
};

const roofTones = (c: Colors<K>): RoofTones => ({
  body: c.tile,
  seam: c.tileLo,
  hip: c.tileLit,
  edge: c.tileLit,
  under: c.tileLo,
  snow: c.tile,
});

// White plaster, shaded at its right end, with a row of small dark windows.
const paintWall = (g: Ctx, cx: number, st: Storey, c: Colors<K>, s: number): void => {
  const top = st.bottom - st.wall;
  fillRect(g, c.wall, cx - st.half, top, st.half * 2 + 1, st.wall);
  fillRect(g, c.wallLo, cx + st.half - 1, top, 2, st.wall);
  const step = px(6, s);
  const size = px(2, s);
  const n = Math.floor((st.half * 2 - px(8, s)) / step) + 1;
  const y = top + Math.max(3, Math.round(st.wall / 2));
  for (let i = 0; i < n; i++) fillRect(g, c.window, cx + Math.round((i - (n - 1) / 2) * step) - (size >> 1), y, size, size);
};

type GablePx = { readonly cx: number; readonly base: number; readonly half: number; readonly height: number; readonly curved: boolean };

// A gable face: white plaster under bargeboards that run straight to a peak, or swell into a bell-shaped curve.
const gableColumn = (g: Ctx, c: Colors<K>, gb: GablePx, x: number): void => {
  const u = Math.min(1, Math.abs(x - gb.cx) / gb.half);
  const lift = gb.curved ? Math.cos((u * Math.PI) / 2) ** 2 : 1 - u;
  const top = gb.base - Math.round(gb.height * lift);
  fillRect(g, c.wall, x, top + 2, 1, gb.base - top - 1);
  fillRect(g, c.wallLo, x, top + 2, 1, 1);
  fillRect(g, c.tile, x, top + 1, 1, 1);
  fillRect(g, c.tileLit, x, top, 1, 1);
};

const paintGable = (g: Ctx, c: Colors<K>, gb: GablePx): void => {
  for (let x = gb.cx - gb.half - 1; x <= gb.cx + gb.half + 1; x++) gableColumn(g, c, gb, x);
  fillRect(g, c.window, gb.cx, gb.base - gb.height + 3, 1, 2);
};

// The top ridge, with a curled roof-fish at each end.
const SHACHI: Sprite = ['o.', 'oo'];
const SHACHI_R = flipped(SHACHI);
const shachiPalette = paletteBy<K>((c) => ({ o: c.tileLo }));

const paintRidge = (g: Ctx, c: Colors<K>, roof: Eaves): void => {
  const y = roof.eave - roof.rise - 1;
  fillRect(g, c.tileLo, roof.cx - roof.top, y, roof.top * 2 + 1, 1);
  drawSprite(g, SHACHI, shachiPalette(c), roof.cx - roof.top - 1, y - 2);
  drawSprite(g, SHACHI_R, shachiPalette(c), roof.cx + roof.top, y - 2);
};

const paintKeep = (g: Ctx, k: KeepPlan, at: { readonly cx: number; readonly base: number; readonly s: number }, c: Colors<K>): void => {
  const storeys = storeysOf(k, at.cx, at.base, at.s);
  for (const st of storeys) {
    paintWall(g, at.cx, st, c, at.s);
    paintEaves(g, st.roof, roofTones(c));
  }
  for (const [roof, dx, half, height, curved] of k.gables) {
    const st = storeys[roof];
    const gb = { cx: at.cx + Math.round(dx * at.s), half: px(half, at.s), height: px(height, at.s), curved };
    if (st) paintGable(g, c, { ...gb, base: st.roof.eave - 1 });
  }
  const top = storeys[storeys.length - 1];
  if (top) paintRidge(g, c, top.roof);
};

// ---- stone ----

// Stone laid in courses of uneven blocks: mortar between them, the joints staggered, a few faces catching the light.
const stoneAt = (c: Colors<K>, x: number, y: number): string => {
  const course = Math.floor(y / 3);
  const len = 4 + Math.floor(rand(course, 5) * 5);
  const run = x + Math.floor(rand(course, 6) * len);
  if (y % 3 === 2 || run % len === 0) return c.stoneLo;
  const face = rand(Math.floor(run / len), course);
  return face < 0.3 ? c.stoneLit : face > 0.85 && (x + y) % 2 === 0 ? c.stoneLo : c.stone;
};

const stoneRow = (g: Ctx, c: Colors<K>, x0: number, x1: number, y: number): void => {
  for (let x = x0; x <= x1; x++) fillRect(g, stoneAt(c, x, y), x, y, 1, 1);
};

// The keep's base: steep at the top and flaring out toward the ground, lit on the left.
const paintBase = (g: Ctx, c: Colors<K>, cx: number, top: number, s: number): void => {
  const h = px(BASE, s);
  const half0 = px(28, s);
  for (let r = 0; r < h; r++) {
    const half = half0 + Math.round(px(12, s) * (r / h) ** 2.4);
    stoneRow(g, c, cx - half, cx + half, top + r);
    fillRect(g, c.stoneLit, cx - half, top + r, 2, 1);
    fillRect(g, c.stoneLo, cx + half - 1, top + r, 2, 1);
  }
  fillRect(g, c.stoneLit, cx - half0, top, half0 * 2 + 1, 1);
};

// The walled terrace behind, carrying the smaller keeps and the corridors between them.
const paintTerrace = (g: Ctx, c: Colors<K>, cx: number, top: number, s: number): void => {
  const half = px(62, s);
  for (let y = top; y < g.canvas.height; y++) stoneRow(g, c, cx - half, cx + half, y);
  fillDither(g, c.stoneLo, 0.75, cx - half, top, half * 2 + 1, g.canvas.height - top);
  fillRect(g, c.stoneLit, cx - half, top, half * 2 + 1, 1);
};

// A two-storey corridor from a smaller keep to the main one.
const paintCorridor = (g: Ctx, c: Colors<K>, cx: number, dx: number, base: number, s: number): void => {
  const half = Math.round(Math.abs(dx) / 2);
  const mid = cx + Math.round(dx / 2);
  const st: Storey = {
    bottom: base,
    half,
    wall: px(9, s),
    roof: { cx: mid, eave: base - px(9, s) + 1, half: half + px(3, s), top: half - px(2, s), rise: px(4, s), lift: 1, edge: 1 },
  };
  paintWall(g, mid, st, c, s);
  paintEaves(g, st.roof, roofTones(c));
};

const castleImage = (s: number, c: Colors<K>): HTMLCanvasElement => {
  const w = px(PICTURE[0], s);
  return memoLayer(`himeji-castle:${s}:${colorKey(c)}`, w, px(PICTURE[1], s), (g) => {
    const cx = Math.floor(w / 2);
    const base = px(ABOVE, s);
    paintTerrace(g, c, cx, base + px(5, s), s);
    for (const k of [WEST, EAST]) paintCorridor(g, c, cx, Math.round(k.dx * s), base + px(5, s), s);
    for (const k of [WEST, EAST]) paintKeep(g, k, { cx: cx + Math.round(k.dx * s), base: base + px(k.drop, s), s }, c);
    paintBase(g, c, cx, base, s);
    paintKeep(g, MAIN, { cx, base, s }, c);
  });
};

/** The row where the main keep's stone base meets the ground. */
const footOf = (m: Layout, s: number): number => m.keepTop + px(ABOVE + BASE, s);

// ---- the grounds: wooded slopes, a walled terrace with turrets, cherry trees and the moat's stone bank ----

const greens = (c: Colors<K>): readonly Tones[] => [
  [c.greenLo, c.green, c.greenLit],
  [c.greenLo, c.greenLo, c.green],
];

const blossoms = (c: Colors<K>): readonly Tones[] => [
  [c.blossomLo, c.blossom, c.blossomLit],
  [c.blossom, c.blossomLit, c.blossomLit],
  [c.blossomLo, c.blossomLo, c.blossom],
];

const pineTones = (c: Colors<K>): PineTones => ({
  ink: c.ink,
  bark: c.bark,
  dark: c.greenLo,
  mid: c.green,
  lit: c.greenLit,
  snow: c.greenLit,
});

const woodsTop = (f: Frame, m: Layout, s: number, x: number): number => {
  const foot = footOf(m, s);
  const span = (k: number): number => m.keepX + Math.round(k * s);
  const line = through(
    [
      [span(-90), foot - 9],
      [span(-40), foot - 2],
      [span(40), foot - 2],
      [span(90), foot - 9],
    ],
    x,
  );
  return line - ridgeNoise(x / 8, 61) * 5 + (f.w > f.h ? 0 : 2);
};

// A low white wall capped with tiles, pierced by small loopholes.
const paintRampart = (g: Ctx, c: Colors<K>, x0: number, x1: number, y: number): void => {
  fillRect(g, c.tileLit, x0, y, x1 - x0, 1);
  fillRect(g, c.tile, x0, y + 1, x1 - x0, 1);
  fillRect(g, c.wall, x0, y + 2, x1 - x0, 3);
  for (let x = x0 + 2; x < x1 - 1; x += 5) fillRect(g, c.window, x, y + 3, 1, 1);
  for (let x = x0; x < x1; x++) fillRect(g, stoneAt(c, x, y + 5), x, y + 5, 1, 2);
};

// A turret on its short stone footing.
const paintTurret = (g: Ctx, c: Colors<K>, cx: number, base: number, s: number): void => {
  for (let y = base; y < base + px(7, s); y++) stoneRow(g, c, cx - px(14, s), cx + px(14, s), y);
  paintKeep(g, TURRET, { cx, base, s }, c);
};

// The lower terrace below the keep: a wall on each side and a turret guarding each corner.
const paintLowerTerrace = (g: Ctx, f: Frame, m: Layout, c: Colors<K>, s: number): void => {
  const foot = footOf(m, s);
  const reach = Math.min(Math.round(92 * s), Math.round(f.w * 0.42));
  paintRampart(g, c, 0, m.keepX - px(34, s), foot + px(9, s));
  paintRampart(g, c, m.keepX + px(34, s), f.w, foot + px(11, s));
  paintTurret(g, c, m.keepX - reach, foot + px(4, s), s);
  paintTurret(g, c, m.keepX + reach, foot + px(7, s), s);
};

// The blossom dips in the middle, never above the foot of the keep's base, and rises toward the sides.
const bloomTop = (f: Frame, m: Layout, s: number, x: number): number => {
  const middle = Math.max(m.bloom, footOf(m, s) + px(10, s));
  const u = Math.abs(x - m.keepX) / (f.w / 2);
  return middle - (middle - m.bloomEdge) * u ** 2 - ridgeNoise(x / 7, 71) * 6;
};

// Grass under the cherry trees and their dark trunks, then the stone bank dropping to the water.
const paintBank = (g: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  fillRect(g, c.greenLo, 0, m.bank - 5, f.w, 5);
  for (let x = 6, i = 0; x < f.w; x += 22 + Math.round(rand(i, 81) * 12), i++)
    limb(g, x, m.bank - 1, x + Math.round((rand(i, 82) - 0.5) * 6), m.bank - 16, 2, c.bark, c.ink);
  for (let y = m.bank; y <= m.water; y++) stoneRow(g, c, 0, f.w, y);
  fillRect(g, c.greenLit, 0, m.bank, f.w, 1);
};

// Wooded slopes under the keep with a pine on either side.
const paintWoods = (g: Ctx, f: Frame, m: Layout, c: Colors<K>, s: number): void => {
  paintCanopy(g, { w: f.w, bottom: m.bank, r: 5, seed: 31 }, (x) => woodsTop(f, m, s, x), greens(c));
  paintLowerTerrace(g, f, m, c, s);
  for (const dx of [-58, 60]) paintPine(g, m.keepX + Math.round(dx * s), footOf(m, s) + px(20, s), px(20, s), pineTones(c), dx);
};

const groundsLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('himeji-grounds', f, c, (g) => {
    const m = layoutOf(f);
    paintWoods(g, f, m, c, scaleOf(f));
    paintBank(g, f, m, c);
    paintCanopy(g, { w: f.w, bottom: m.bank - 12, r: f.w > f.h ? 6 : 7, seed: 41 }, (x) => bloomTop(f, m, scaleOf(f), x), blossoms(c));
  });

// ---- the far hills ----

const hillsLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('himeji-hills', f, c, (g) => {
    const m = layoutOf(f);
    fillColumns(g, f.w, m.water + 1, c.farLo, (x) => m.hills - 9 - ridgeNoise(x / 46, 51) * 14);
    fillColumns(g, f.w, m.water + 1, c.far, (x) => m.hills - 1 - Math.max(0, ridgeNoise(x / 26, 52) - 0.4) * 16);
  });

// ---- a cherry bough hanging into the top-left corner ----

const blossomClump = (g: Ctx, c: Colors<K>, x: number, y: number, k: number): void => {
  const kinds = blossoms(c);
  for (let j = 0; j < 6; j++) {
    const a = rand(j, k + 90) * Math.PI * 2;
    const d = Math.sqrt(rand(j, k + 91)) * 7;
    puff(
      g,
      Math.round(x + Math.cos(a) * d),
      Math.round(y + Math.sin(a) * d * 0.7),
      3 + Math.round(rand(j, k + 92) * 2),
      kinds[j % 3] as Tones,
    );
  }
};

const boughLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('himeji-bough', f, c, (g) =>
    paintBough(g, Math.round(f.w * (f.w > f.h ? 0.28 : 0.36)), c.ink, c.bark, (x, y, k) => blossomClump(g, c, x, y, k)),
  );

// ---- sprites ----

// A white heron flying left, wings up and wings down. w plumage, s its shade, b beak, k legs.
const HERON: readonly Sprite[] = [
  [
    '.......ss......',
    '......sww......',
    '.....swww......',
    '....swwws......',
    '..ww.swws......',
    'bbwwwwwwwwwwkkk',
    '...wwwwwwwws...',
    '.....ssss......',
    '...............',
    '...............',
  ],
  [
    '...............',
    '...............',
    '...............',
    '...............',
    '..ww...........',
    'bbwwwwwwwwwwkkk',
    '...wwwwwwwwws..',
    '.....swwwws....',
    '......swws.....',
    '.......ss......',
  ],
];

const heronPalette = paletteBy<K>((c) => ({ w: c.heron, s: c.heronLo, b: c.glow, k: c.ink }));

// A pleasure boat on the moat: the boatman with his pole at the stern, two passengers. h hat, s skin, k coat,
// p pole, a and b the passengers, w gunwale, d hull.
const BOAT: Sprite = [
  '...hhh...............',
  '..hhhhh..............',
  '....s................',
  '...kkk...............',
  '..pkkkk.....a....b...',
  '..p.kk.....aaa..bbb..',
  '.p..kk.....aaa..bbb..',
  '.p.wwwwwwwwwwwwwwwwww',
  'p...dddddddddddddddd.',
  'p.....ddddddddddddd..',
];

const boatPalette = paletteBy<K>((c) => ({
  ...{ h: c.stoneLit, s: c.skin, k: c.ink, p: c.wood },
  ...{ a: c.blossomLo, b: c.tileLit, w: c.wood, d: c.bark },
}));

// A petal tumbling: face on, turning, edge on.
const PETAL: readonly Sprite[] = [['ab', 'b.'], ['a.', '.b'], ['ab'], ['.a', 'ba']];

const petalPalettes = [
  paletteBy<K>((c) => ({ a: c.blossomLit, b: c.blossom })),
  paletteBy<K>((c) => ({ a: c.blossom, b: c.blossomLo })),
  paletteBy<K>((c) => ({ a: c.wall, b: c.blossomLit })),
] as const;

// ---- per-frame layers ----

const heavens = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  if (nightOf(c)) {
    moon(ctx, Math.round(f.w * 0.82), Math.round(m.hills * 0.2), 6, c.sun, c.sky3);
    return;
  }
  if (duskOf(c)) sunWithHalo(ctx, m.sunX, m.sunY, 9, c.sun, c.glow, 3);
  driftingClouds(ctx, f, c.cloud, c.sky2, { count: 4, top: m.hills * 0.15, span: m.hills * 0.5, size: 9, speed: 2, seed: 29 });
};

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  skyBase(ctx, f, { bottom: m.hills + 2, stops: [c.sky0, c.sky1, c.sky2, c.sky3], stars: nightOf(c) ? [c.wall, c.sky3] : null, seed: 23 });
  heavens(ctx, f, m, c);
  ctx.drawImage(hillsLayer(f, c), 0, 0);
};

// Under the night lights the keep glows, a little brighter on the kick.
const castle = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  const s = scaleOf(f);
  if (nightOf(c)) drawGlow(ctx, c.halo, m.keepX, m.keepTop + px(50, s), px(66, s), px(54, s), f.kick > 0.5 ? 0.65 : 0.55);
  const picture = castleImage(s, c);
  ctx.drawImage(picture, m.keepX - Math.floor(picture.width / 2), m.keepTop);
  ctx.drawImage(groundsLayer(f, c), 0, 0);
};

// After sunset strings of lanterns light up along the moat, a brighter pulse running along them on the beat.
const lanterns = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  if (!nightOf(c) && !duskOf(c)) return;
  const m = layoutOf(f);
  const mid = Math.round(f.w / 2);
  festoon(ctx, f, { x0: -4, y0: m.bank - 11, x1: mid, y1: m.bank - 9, sag: 5, gap: 12 }, c.ink, c.lamp, c.glow);
  festoon(ctx, f, { x0: mid, y0: m.bank - 9, x1: f.w + 4, y1: m.bank - 11, sag: 5, gap: 12 }, c.ink, c.lamp, c.glow);
};

// Fallen petals gather into drifting rafts on the water.
const petalRafts = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const deep = f.h - m.water;
  for (let i = 0; i < Math.round(f.w / 10); i++) {
    const near = rand(i, 63);
    const x = Math.round(wrap(rand(i, 64) * (f.w + 20) + f.t * (1 + near * 2), f.w + 20) - 10);
    const y = m.water + 2 + Math.round(near * near * (deep - 4));
    const len = 2 + Math.round(near * 6 * rand(i, 65));
    fillDither(ctx, i % 3 === 0 ? c.blossom : c.blossomLit, 0.75, x, y, len, 1);
    fillRect(ctx, c.blossomLit, x + (len >> 1), y, 1, 1);
  }
};

// The boat glides along the moat and rocks on the beat.
const boat = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const x = Math.round(wrap(f.t * 4 + f.w * 0.3, f.w + 50) - 25);
  const y = m.water + Math.round((f.h - m.water) * 0.35) - BOAT.length + (f.beat % 2 < 1 ? 0 : 1);
  drawSprite(ctx, BOAT, boatPalette(c), x, y);
  fillDither(ctx, c.ink, 0.5, x + 3, y + BOAT.length, 18, 1);
};

const moat = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  mirrorWater(ctx, f, { axis: m.water, bottom: f.h, squash: 1.7, amp: 1, freq: 0.9, speed: 1.8, tint: c.water, tintLevel: 0.4 });
  glints(ctx, f, m.water + 2, f.h, c.glint, Math.round(f.w / 14), 37);
  petalRafts(ctx, f, m, c);
  boat(ctx, f, m, c);
};

const herons = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  flock(ctx, f, HERON, heronPalette(c), { count: 2, top: m.keepTop + 6, span: px(30, scaleOf(f)), speed: -9, seed: 13 });
};

// The bough sways, and petals blow across the frame in a gust on every beat.
const near = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(boughLayer(f, c), Math.round(Math.sin(f.t * 0.8) * 0.7), 0);
  const gust = { ...f, t: f.t * 0.6 + surge(f.beat) * 0.55 };
  flutter(
    ctx,
    gust,
    PETAL,
    petalPalettes.map((p) => p(c)),
    { count: Math.round((f.w * f.h) / 1300), seed: 47, fall: 9, drift: 14, sway: 4, spin: 3, top: 0, bottom: f.h },
  );
};

export const himejiCastle = defineScene<K>({
  id: 'himeji-castle',
  title: 'Heron Castle',
  mood: { valence: 0.45, energy: 0.25 },
  styles: ['grand-field', 'showa-ballad', 'pixel-quest', 'credits-roll', 'idol-disco'],
  variants: [
    {
      // A clear spring day: the keep dazzling white over a moat lined with blossom.
      mood: { valence: 0.65, energy: 0.35 },
      colors: {
        sky0: '#5a9ee6',
        sky1: '#86bdf0',
        sky2: '#b6d8f4',
        sky3: '#e2eef4',
        sun: '#fffbe8',
        cloud: '#ffffff',
        far: '#8eaac4',
        farLo: '#b0c4d6',
        wall: '#f8f8f4',
        wallLo: '#c4c8d2',
        window: '#3a3e4a',
        tile: '#7c8494',
        tileLo: '#5a6272',
        tileLit: '#e4e8ee',
        ink: '#262a34',
        stone: '#a8a294',
        stoneLit: '#d0c9b6',
        stoneLo: '#6e6a60',
        green: '#4e8a4a',
        greenLo: '#2e5a3a',
        greenLit: '#7cb05a',
        blossom: '#f4b4c8',
        blossomLit: '#ffe2ec',
        blossomLo: '#d8809e',
        bark: '#4a3030',
        wood: '#b08458',
        water: '#3a6a8a',
        glint: '#ffffff',
        lamp: '#fff0d0',
        glow: '#ffc870',
        halo: '#ffffff',
        heron: '#ffffff',
        heronLo: '#a8b4c4',
        skin: '#f0c8a8',
      },
    },
    {
      // Sunset: the white walls blush, the lanterns along the moat come on.
      mood: { valence: 0.3, energy: -0.15 },
      colors: {
        sky0: '#3a2e6a',
        sky1: '#8a4a7a',
        sky2: '#e8806a',
        sky3: '#ffc88a',
        sun: '#fff2c0',
        cloud: '#f8a080',
        far: '#6a4a7a',
        farLo: '#8a5a7e',
        wall: '#fbe6d6',
        wallLo: '#c89a98',
        window: '#3a2a3a',
        tile: '#7a6478',
        tileLo: '#54465a',
        tileLit: '#f8d2c0',
        ink: '#221822',
        stone: '#a8887e',
        stoneLit: '#d8b09a',
        stoneLo: '#6a525a',
        green: '#4a5a44',
        greenLo: '#2a3432',
        greenLit: '#7a7a4a',
        blossom: '#f4a0a8',
        blossomLit: '#ffd8c8',
        blossomLo: '#c06a84',
        bark: '#3a2228',
        wood: '#a86a4a',
        water: '#5a3a6a',
        glint: '#ffe0a0',
        lamp: '#ffe8b0',
        glow: '#ffb060',
        halo: '#ffd0a0',
        heron: '#fff0e0',
        heronLo: '#c08a90',
        skin: '#f0b898',
      },
    },
    {
      // The night illumination: the keep blazing white against the dark, blossom lit from below, lanterns aglow.
      mood: { valence: 0.15, energy: 0.55 },
      colors: {
        sky0: '#04061a',
        sky1: '#0a1030',
        sky2: '#141c46',
        sky3: '#22285a',
        sun: '#f4f0d8',
        cloud: '#1e2650',
        far: '#0c1230',
        farLo: '#121a3c',
        wall: '#eef4ff',
        wallLo: '#9aa8c8',
        window: '#1a2038',
        tile: '#50607e',
        tileLo: '#323e5a',
        tileLit: '#c8d4ee',
        ink: '#0a0c18',
        stone: '#8a8c98',
        stoneLit: '#b8bac4',
        stoneLo: '#4a4c5a',
        green: '#1e3a3a',
        greenLo: '#0e2024',
        greenLit: '#2e5a4a',
        blossom: '#f0a8c8',
        blossomLit: '#ffe0f0',
        blossomLo: '#a05a8a',
        bark: '#2a1a24',
        wood: '#8a5a3a',
        water: '#0e1a3a',
        glint: '#ffe0a0',
        lamp: '#ffe6a8',
        glow: '#ffa848',
        halo: '#2a3570',
        heron: '#e8eeff',
        heronLo: '#7a88b0',
        skin: '#e0b8a0',
      },
    },
  ],
  layers: [sky, castle, lanterns, moat, herons, near],
});
