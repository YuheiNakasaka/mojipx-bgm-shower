// Three kitten idols in frilly costumes sing and dance on a little stage: they strike a new pose on every beat in
// perfect sync and spin on the bar, spotlights sweep, a heart of lights pulses behind them and confetti bursts at
// each phrase, while a crowd of puppies, bunnies and birds waves penlights in their colors.
import { type Ctx, drawSprite, fillRect, mixColor, type Palette, type Sprite } from 'mojipx';
import { bayer, cached, ditherGradient, frac, memoLayer, rand, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { cloudCanvas, drawGlow, fillDither } from './batch-1-helpers.ts';
import { paletteOf } from './batch-2-helpers.ts';
import { twinkle } from './batch-6-helpers.ts';
import { blinking, catTail, limb } from './batch-7-helpers.ts';
import { beatInBar, both, box, drawSculpt, oval, type Part, phraseOf, type Stance, sculpt, stick, tri } from './batch-14-helpers.ts';

type K =
  | 'bg0'
  | 'bg1'
  | 'bg2'
  | 'far'
  | 'farHi'
  | 'cloud'
  | 'cloudLo'
  | 'truss'
  | 'trussLo'
  | 'beam'
  | 'heart'
  | 'heartHi'
  | 'heartLo'
  | 'panel'
  | 'stage'
  | 'stageHi'
  | 'stageLo'
  | 'ink'
  | 'lace'
  | 'pink'
  | 'blush'
  | 'gold'
  | 'mouth'
  | 'furA'
  | 'furALo'
  | 'cosA'
  | 'cosALo'
  | 'furB'
  | 'furBLo'
  | 'cosB'
  | 'cosBLo'
  | 'furC'
  | 'furCLo'
  | 'cosC'
  | 'cosCLo'
  | 'crowd'
  | 'crowdHi';

type C = Colors<K>;

const colorKey = (c: C, keys: readonly K[]): string => keys.map((k) => c[k]).join('');

/** An open-air variant has clouds (its cloud color differs from its sky's); an indoor one has a curtain. */
const outdoors = (c: C): boolean => c.cloud !== c.bg0;

// ---- layout ----

type Layout = {
  readonly wide: boolean;
  /** How big the kittens are drawn. */
  readonly scale: number;
  /** The truss the lamps hang from, the heart's middle and half-size, and the stage's top and front. */
  readonly truss: number;
  readonly heart: { readonly x: number; readonly y: number; readonly r: number };
  readonly floor: number;
  readonly lip: number;
  /** Where the kittens stand, left to right (the middle of their feet). */
  readonly kittens: readonly number[];
  readonly feet: number;
  /** The rows of the crowd, back to front: the line their heads sit on, and how big they are. */
  readonly rows: readonly { readonly y: number; readonly size: number }[];
};

const wideLayout = (w: number, h: number): Layout => {
  const floor = Math.round(h * 0.7);
  const gap = Math.round(w * 0.19);
  return {
    wide: true,
    scale: 1.15,
    truss: Math.round(h * 0.05),
    heart: { x: w >> 1, y: Math.round(h * 0.36), r: Math.round(h * 0.25) },
    floor,
    lip: floor + 12,
    kittens: [(w >> 1) - gap, w >> 1, (w >> 1) + gap],
    feet: floor + 7,
    rows: [
      { y: floor + 24, size: 0.75 },
      { y: h + 2, size: 1 },
    ],
  };
};

const tallLayout = (w: number, h: number): Layout => {
  const floor = Math.round(h * 0.6);
  const gap = Math.round(w * 0.31);
  return {
    wide: false,
    scale: 1.3,
    truss: Math.round(h * 0.15),
    heart: { x: w >> 1, y: Math.round(h * 0.36), r: Math.round(w * 0.36) },
    floor,
    lip: floor + 14,
    kittens: [(w >> 1) - gap, w >> 1, (w >> 1) + gap],
    feet: floor + 8,
    rows: [
      { y: floor + 34, size: 0.6 },
      { y: floor + 58, size: 0.72 },
      { y: floor + 86, size: 0.86 },
      { y: floor + 116, size: 1 },
      { y: h, size: 1.15 },
    ],
  };
};

const layouts = new Map<string, Layout>();

const layoutOf = (f: Frame): Layout => cached(layouts, 8, `${f.w}x${f.h}`, () => (f.w > f.h ? wideLayout(f.w, f.h) : tallLayout(f.w, f.h)));

// ---- behind the stage: a hall hung with a pleated curtain, or an open sky with clouds over a line of trees ----

const treeLine = (l: Layout): number => l.heart.y + Math.round(l.heart.r * (l.wide ? 0.35 : 0.55));

// The curtain's pleats: lit ridges and shaded hollows, dithered, darkening toward the top.
const hall = (f: Frame, l: Layout, c: C): HTMLCanvasElement =>
  memoLayer(`ki-hall:${f.w}x${f.h}:${colorKey(c, ['far', 'farHi', 'bg0'])}`, f.w, l.floor, (g) => {
    const top = l.truss + 6;
    for (let x = 0; x < f.w; x++) {
      const fold = Math.sin(x * 0.42) * 0.5 + 0.5;
      for (let y = top; y < l.floor; y++) {
        const k = fold * (0.35 + (0.65 * (y - top)) / (l.floor - top));
        g.fillStyle = k > 0.62 && bayer(x, y) < (k - 0.62) * 3 ? c.farHi : k > 0.18 || bayer(x, y) < k * 4 ? c.far : c.bg0;
        g.fillRect(x, y, 1, 1);
      }
    }
  });

const openAir = (f: Frame, l: Layout, c: C): HTMLCanvasElement =>
  memoLayer(`ki-air:${f.w}x${f.h}:${colorKey(c, ['far', 'farHi', 'cloud', 'cloudLo'])}`, f.w, l.floor, (g) => {
    for (let k = 0; k < 4; k++) {
      const cloud = cloudCanvas(k + 3, 9 + rand(k, 2) * 8, c.cloud, c.cloudLo);
      g.drawImage(cloud, Math.round(rand(k, 3) * f.w - 10), Math.round(f.h * 0.03 + rand(k, 4) * l.heart.y * 0.6));
    }
    const top = treeLine(l);
    for (let x = 0; x < f.w; x++) {
      const bump = Math.abs(Math.sin(x * 0.21) * 5 + Math.sin(x * 0.07 + 1) * 4);
      g.fillStyle = c.far;
      g.fillRect(x, Math.round(top - bump), 1, l.floor - top + bump);
      g.fillStyle = c.farHi;
      if (rand(x, 9) > 0.6) g.fillRect(x, Math.round(top - bump) + 1 + Math.floor(rand(x, 8) * 5), 1, 1);
    }
  });

const backdrop = (ctx: Ctx, f: Frame, c: C): void => {
  const l = layoutOf(f);
  ctx.drawImage(ditherGradient(f.w, l.floor, [c.bg0, c.bg1, c.bg2]), 0, 0);
  if (outdoors(c)) {
    ctx.drawImage(openAir(f, l, c), 0, 0);
    return;
  }
  stars(ctx, f.w, l.truss, f.t, [c.farHi, c.lace], Math.round((f.w * l.truss) / 200), 17, 1);
  ctx.drawImage(hall(f, l, c), 0, 0);
};

// ---- the heart of lights ----

/** Each bulb of the heart: where it sits, and how far out from the middle (0) to the rim (1). */
type Bulbs = { readonly x: Int16Array; readonly y: Int16Array; readonly s: Float32Array };

const inHeart = (u: number, v: number): boolean => (u * u + v * v - 1) ** 3 - u * u * v * v * v <= 0;

/** The smallest heart, as a share of the full one, that holds the point. */
const reachOf = (u: number, v: number): number => {
  for (let s = 0.05; s < 1.001; s += 0.05) if (inHeart(u / s, v / s)) return s;
  return 2;
};

const bulbSets = new Map<string, Bulbs>();

const bulbsOf = (f: Frame, l: Layout): Bulbs =>
  cached(bulbSets, 8, `${f.w}x${f.h}`, () => {
    const pts: [number, number, number][] = [];
    const { x: hx, y: hy, r } = l.heart;
    const span = Math.round(r * 1.3);
    for (let y = hy - span; y < hy + span; y += 3)
      for (let x = hx - span; x < hx + span; x += 3) {
        const s = reachOf((x - hx) / (r * 0.9), (hy - y) / (r * 0.9) + 0.12);
        if (s <= 1) pts.push([Math.round(x), Math.round(y), s]);
      }
    return {
      x: Int16Array.from(pts, (p) => p[0]),
      y: Int16Array.from(pts, (p) => p[1]),
      s: Float32Array.from(pts, (p) => p[2]),
    };
  });

const heartBase = (f: Frame, l: Layout, c: C): HTMLCanvasElement =>
  memoLayer(`ki-heart:${f.w}x${f.h}:${colorKey(c, ['heartLo', 'panel', 'ink'])}`, f.w, f.h, (g) => {
    const b = bulbsOf(f, l);
    for (let i = 0; i < b.x.length; i++) {
      g.fillStyle = c.ink;
      g.fillRect((b.x[i] ?? 0) - 1, (b.y[i] ?? 0) - 1, 4, 4);
    }
    for (let i = 0; i < b.x.length; i++) {
      g.fillStyle = c.panel;
      g.fillRect((b.x[i] ?? 0) - 1, (b.y[i] ?? 0) - 1, 3, 3);
      g.fillStyle = c.heartLo;
      g.fillRect(b.x[i] ?? 0, b.y[i] ?? 0, 2, 2);
    }
  });

// On every beat a ring of light swells out from the middle of the heart and leaves it lit behind; the bulbs round the
// rim chase each other, and a strong kick lights the whole heart at once.
const heartColorOf = (f: Frame, c: C, s: number, i: number): string | null => {
  const ring = frac(f.beat) * 1.25;
  if (s > 0.88 && (i + Math.floor(f.beat * 2)) % 3 === 0) return c.lace;
  if (Math.abs(s - ring) < 0.09) return c.heartHi;
  return s < ring || f.kick > 0.7 ? c.heart : null;
};

// Indoors the heart casts a soft glow on the curtain, brighter on the beat.
const heartGlow = (ctx: Ctx, f: Frame, l: Layout, c: C): void => {
  if (outdoors(c)) return;
  const level = frac(f.beat) < 0.3 ? 0.3 : 0.18;
  drawGlow(ctx, c.heart, l.heart.x, l.heart.y, Math.round(l.heart.r * 1.5), Math.round(l.heart.r * 1.4), level);
};

const heart = (ctx: Ctx, f: Frame, c: C): void => {
  const l = layoutOf(f);
  heartGlow(ctx, f, l, c);
  ctx.drawImage(heartBase(f, l, c), 0, 0);
  const b = bulbsOf(f, l);
  b.s.forEach((s, i) => {
    const color = heartColorOf(f, c, s, i);
    if (color) fillRect(ctx, color, b.x[i] ?? 0, b.y[i] ?? 0, 2, 2);
  });
};

// ---- the stage: a lattice truss with lamps, speaker stacks, and a glossy floor ----

const towersX = (f: Frame, l: Layout): readonly [number, number] => {
  const half = Math.round(f.w * (l.wide ? 0.44 : 0.465));
  return [l.heart.x - half, l.heart.x + half];
};

/** A lattice girder from (x, y), `len` long and 6 thick, running across or down. */
const girder = (g: Ctx, c: C, x: number, y: number, len: number, down: boolean): void => {
  const rect = (a: number, b: number, w: number, h: number): void =>
    down ? g.fillRect(x + b, y + a, h, w) : g.fillRect(x + a, y + b, w, h);
  g.fillStyle = c.ink;
  rect(-1, -1, len + 2, 8);
  g.fillStyle = c.trussLo;
  rect(0, 1, len, 4);
  g.fillStyle = c.truss;
  rect(0, 0, len, 1);
  rect(0, 5, len, 1);
  for (let k = 0; k < len; k++) rect(k, 1 + Math.abs((k % 8) - 4), 1, 1);
};

const lampsOf = (f: Frame, l: Layout): readonly number[] => {
  const [x0, x1] = towersX(f, l);
  const n = l.wide ? 5 : 4;
  return Array.from({ length: n }, (_, k) => Math.round(x0 + ((x1 - x0) * (k + 0.5)) / n));
};

const SPEAKER_W = 16;

const paintSpeaker = (g: Ctx, c: C, x: number, bottom: number, h: number): void => {
  g.fillStyle = c.ink;
  g.fillRect(x - 1, bottom - h - 1, SPEAKER_W + 2, h + 1);
  g.fillStyle = c.trussLo;
  g.fillRect(x, bottom - h, SPEAKER_W, h);
  g.fillStyle = c.panel;
  for (let y = bottom - h + 2; y + 10 < bottom; y += 12) g.fillRect(x + 2, y, SPEAKER_W - 4, 10);
};

/** The floor from the back of the stage down to the audience, as [color, top, height] bands painted in order. */
const floorBands = (f: Frame, l: Layout, c: C): readonly (readonly [string, number, number])[] => [
  [c.stage, l.floor, l.lip - l.floor],
  [c.stageHi, l.floor, 1],
  [c.ink, l.lip, 1],
  [c.stageLo, l.lip + 1, 4],
  [c.crowd, l.lip + 5, f.h - l.lip - 5],
];

const paintFloor = (g: Ctx, f: Frame, l: Layout, c: C): void => {
  for (const [color, y, h] of floorBands(f, l, c)) {
    g.fillStyle = color;
    g.fillRect(0, y, f.w, h);
  }
  g.fillStyle = c.stageLo;
  for (let y = l.floor + 3; y < l.lip; y += 3 + ((y - l.floor) >> 2)) g.fillRect(0, y, f.w, 1);
};

const paintRig = (g: Ctx, f: Frame, l: Layout, c: C): void => {
  const [x0, x1] = towersX(f, l);
  girder(g, c, x0 - 3, l.truss, l.floor - l.truss, true);
  girder(g, c, x1 - 3, l.truss, l.floor - l.truss, true);
  girder(g, c, 0, l.truss, f.w, false);
  const sh = Math.round(l.heart.r * (l.wide ? 0.95 : 0.7));
  paintSpeaker(g, c, x0 + 6, l.floor + 2, sh);
  paintSpeaker(g, c, x1 - 6 - SPEAKER_W, l.floor + 2, sh);
  for (const x of lampsOf(f, l)) {
    g.fillStyle = c.ink;
    g.fillRect(x - 3, l.truss + 6, 7, 7);
    g.fillStyle = c.truss;
    g.fillRect(x - 2, l.truss + 7, 5, 4);
  }
};

const stageLayer = (f: Frame, l: Layout, c: C): HTMLCanvasElement =>
  memoLayer(
    `ki-stage:${f.w}x${f.h}:${colorKey(c, ['ink', 'truss', 'trussLo', 'panel', 'stage', 'stageHi', 'stageLo', 'crowd'])}`,
    f.w,
    f.h,
    (g) => {
      paintFloor(g, f, l, c);
      paintRig(g, f, l, c);
    },
  );

// The speaker cones thump on the kick.
const cones = (ctx: Ctx, f: Frame, l: Layout, c: C): void => {
  const [x0, x1] = towersX(f, l);
  const sh = Math.round(l.heart.r * (l.wide ? 0.95 : 0.7));
  const r = f.kick > 0.5 ? 4 : 3;
  for (const x of [x0 + 6, x1 - 6 - SPEAKER_W])
    for (let y = l.floor + 2 - sh + 2; y + 10 < l.floor + 2; y += 12) {
      drawGlow(ctx, c.trussLo, x + 8, y + 5, r, r, 1);
      fillRect(ctx, c.ink, x + 7, y + 4, 2, 2);
    }
};

/** Where a lamp's beam lands: the middle lamp follows the lead, the others sweep across the stage with the beat. */
const landOf = (f: Frame, l: Layout, x: number, k: number, n: number): number =>
  k === n >> 1 && n % 2 === 1 ? (l.kittens[1] ?? x) : x + Math.sin(f.beat * Math.PI * 0.5 + k * 1.7) * l.heart.r * 0.7;

// The beams shine behind the heart, so it stays clear; each leaves a pool of light on the floor (drawn with the stage).
const beams = (ctx: Ctx, f: Frame, l: Layout, c: C): void => {
  const lamps = lampsOf(f, l);
  lamps.forEach((x, k) => {
    const top = l.truss + 13;
    const land = landOf(f, l, x, k, lamps.length);
    const len = l.feet - top;
    for (let j = 0; j < len; j += 1) {
      const cx = x + ((land - x) * j) / len;
      const half = 1 + j * 0.12;
      fillDither(ctx, c.beam, 0.12, cx - half, top + j, half * 2 + 1, 1);
      fillDither(ctx, c.beam, 0.4, cx - half * 0.4, top + j, half * 0.8 + 1, 1);
    }
  });
};

const pools = (ctx: Ctx, f: Frame, l: Layout, c: C): void => {
  const lamps = lampsOf(f, l);
  lamps.forEach((x, k) => {
    drawGlow(ctx, c.beam, landOf(f, l, x, k, lamps.length), l.feet - 1, 14, 4, 0.5);
    fillRect(ctx, c.lace, x - 1, l.truss + 11, 3, 1);
  });
};

const stage = (ctx: Ctx, f: Frame, c: C): void => {
  const l = layoutOf(f);
  ctx.drawImage(stageLayer(f, l, c), 0, 0);
  fillDither(ctx, c.heart, 0.25, l.heart.x - l.heart.r, l.floor + 1, l.heart.r * 2, 2);
  pools(ctx, f, l, c);
  cones(ctx, f, l, c);
};

// By day the sun drowns the beams; only their pools on the floor show.
const lights = (ctx: Ctx, f: Frame, c: C): void => {
  if (!outdoors(c)) beams(ctx, f, layoutOf(f), c);
};

// ---- the kittens: f/F fur, c/C costume, l lace, p pink, b blush, e ink, i iris, w glint, g gold, m mouth ----

/** Which idol: 0 the calico in pink (the lead, in the middle), 1 the ginger tabby in blue, 2 the grey in yellow. */
type Idol = 0 | 1 | 2;
type Face = 'open' | 'blink' | 'wink';

const KIT_W = 30;
const KIT_H = 48;

const mirrored = (parts: readonly Part[]): readonly Part[] => parts.map(([ch, inside]): Part => [ch, (x, y) => inside(-x, y)]);
const pair = (parts: readonly Part[]): readonly Part[] => [...parts, ...mirrored(parts)];

const skirt = (x: number, y: number): boolean =>
  y >= -17 && y < -6 && Math.abs(x) <= 5 + ((y + 17) / 11) * 6.5 && !(y > -6.9 && Math.floor(x + 30) % 3 === 0);
const head = oval(0, -33.5, 11.5, 9.6);

// The costume from the boots up: a tiered skirt with a lace hem and pleats, a bodice with a bow, puffed sleeves.
const DRESS: readonly Part[] = [
  ...pair([
    ['f', box(1, -7, 4, -2)],
    ['l', box(0.5, -3, 4.5, 0)],
  ]),
  ['c', skirt],
  ['C', both(skirt, (x, y) => y < -8.6 && y > -16 && Math.floor(x + 30) % 4 === 0)],
  ['C', both(skirt, (_, y) => y > -11.6 && y < -10.4)],
  ['l', both(skirt, (_, y) => y >= -8.6)],
  ['c', box(-5, -23.5, 5, -16.5)],
  ['C', box(3.5, -23.5, 5, -16.5)],
  ['l', box(-5.5, -17.6, 5.5, -16.4)],
  ...pair([
    ['c', oval(5.8, -21.8, 2.8, 2.4)],
    ['l', both(oval(5.8, -21.8, 2.8, 2.4), (_, y) => y > -20.2)],
  ]),
];

const BOW: readonly Part[] = [
  ['l', tri([-3.8, -23], [-3.8, -19.6], [0, -21.3])],
  ['l', tri([3.8, -23], [3.8, -19.6], [0, -21.3])],
  ['g', oval(0, -21.3, 1, 1)],
];

// The lead is a calico: ginger and dark patches on her crown, under her face so the eyes stay clear.
const PATCHES: readonly (readonly Part[])[] = [
  [
    ['q', both(head, (x, y) => y < -36.2 && x < 1.5)],
    ['r', both(head, (x, y) => y < -35.2 && x > 6)],
  ],
  [],
  [],
];

// Each idol's own touch: a heart clip on the lead's crown, tabby stripes and a star clip, a little tiara.
const TRIMS: readonly (readonly Part[])[] = [
  [
    ['c', oval(6.4, -40.4, 1.4, 1.3)],
    ['c', oval(8.8, -40.4, 1.4, 1.3)],
    ['c', tri([5, -40], [10.2, -40], [7.6, -37])],
    ['l', oval(6.1, -40.9, 0.55, 0.55)],
  ],
  [
    ['F', box(-1, -43.4, 1, -39.6)],
    ['F', box(-4.4, -42.6, -2.8, -40.2)],
    ['F', box(2.8, -42.6, 4.4, -40.2)],
    ['g', tri([-9.5, -40.5], [-6.5, -40.5], [-8, -43.5])],
    ['g', tri([-9.5, -42.5], [-6.5, -42.5], [-8, -39.5])],
  ],
  [
    ['g', box(-4, -44.6, 4, -42.8)],
    ['g', tri([-4, -44], [-2, -44], [-3, -47])],
    ['g', tri([-1.2, -44], [1.2, -44], [0, -48])],
    ['g', tri([2, -44], [4, -44], [3, -47])],
    ['c', oval(0, -45, 0.8, 0.8)],
  ],
];

const EARS: readonly Part[] = pair([
  ['f', tri([11, -36], [3.5, -41.5], [10.5, -46.5])],
  ['p', tri([9.6, -38.5], [5.6, -41.2], [9.6, -44.5])],
]);

// The iris sits inside an ink rim: colour reaching the eye's edge reads as a tear at this size.
const eyeOpen = (side: 1 | -1): readonly Part[] => [
  ['e', oval(4.6 * side, -32, 2.3, 2.9)],
  ['i', both(oval(4.6 * side, -31.5, 1.4, 1.8), (_, y) => y > -32)],
  ['w', box(side > 0 ? 4 : -6.2, -34.6, side > 0 ? 6.2 : -4, -32.6)],
  ['w', box(side > 0 ? 2.8 : -3.8, -30.8, side > 0 ? 3.8 : -2.8, -29.8)],
];

// A shut eye: a line for a blink, a happy arch for a wink.
const eyeShut = (side: 1 | -1, arch: boolean): readonly Part[] =>
  arch
    ? [
        ['e', stick([2.4 * side, -31], [4.6 * side, -33], 0.55)],
        ['e', stick([4.6 * side, -33], [6.8 * side, -31], 0.55)],
      ]
    : [['e', box(Math.min(2.4 * side, 6.8 * side), -31.6, Math.max(2.4 * side, 6.8 * side), -30.6)]];

const faceParts = (face: Face, singing: boolean): readonly Part[] => [
  ...(face === 'blink' ? eyeShut(-1, false) : eyeOpen(-1)),
  ...(face === 'open' ? eyeOpen(1) : eyeShut(1, face === 'wink')),
  ...pair([['b', oval(8.2, -27.8, 1.8, 0.9)]]),
  ['p', box(-1, -28.8, 1, -27.8)],
  ...(singing
    ? ([
        ['e', oval(0, -26.2, 2.2, 1.9)],
        ['m', oval(0, -25.9, 1.3, 1.1)],
      ] as const)
    : ([
        ['e', box(-2.2, -27.2, -0.6, -26.4)],
        ['e', box(0.6, -27.2, 2.2, -26.4)],
      ] as const)),
  ['g', stick([-10.5, -31], [-6.6, -26.4], 0.45)],
  ['e', oval(-6.2, -26.2, 0.9, 0.9)],
];

/** The idol facing us (with her face) or turned away mid-spin (a bow at her back instead). */
const kittenParts = (idol: Idol, face: Face | 'back', singing: boolean): readonly Part[] => [
  ...DRESS,
  ...(face === 'back' ? EARS.filter(([ch]) => ch === 'f') : EARS),
  ['f', head],
  ['f', oval(0, -30.5, 10.5, 6.5)],
  ['F', both(head, (_, y) => y > -25.6)],
  ...(PATCHES[idol] as readonly Part[]),
  ...(face === 'back'
    ? ([
        ['l', tri([-6, -21], [-6, -15], [0, -18])],
        ['l', tri([6, -21], [6, -15], [0, -18])],
      ] as const)
    : [...BOW, ...faceParts(face, singing)]),
  ...(TRIMS[idol] as readonly Part[]),
];

const kittenSprite = (idol: Idol, face: Face | 'back', singing: boolean, stance: Stance): Sprite =>
  sculpt(`ki-kit${idol}:${face}:${singing ? 1 : 0}`, KIT_W, KIT_H, () => kittenParts(idol, face, singing), stance);

const IDOL_KEYS = [
  ['furA', 'furALo', 'cosA', 'cosALo'],
  ['furB', 'furBLo', 'cosB', 'cosBLo'],
  ['furC', 'furCLo', 'cosC', 'cosCLo'],
] as const;

const idolPalette =
  (idol: Idol) =>
  (c: C): Palette => {
    const [fur, furLo, cos, cosLo] = IDOL_KEYS[idol];
    return {
      o: c.ink,
      f: c[fur],
      F: c[furLo],
      c: c[cos],
      C: c[cosLo],
      l: c.lace,
      p: c.pink,
      b: c.blush,
      e: c.ink,
      i: c[cos],
      w: c.lace,
      g: c.gold,
      m: c.mouth,
      q: c.furB,
      r: mixColor(c.ink, c.furCLo, 0.45),
    };
  };

const IDOL_PALETTES = ([0, 1, 2] as const).map(idolPalette);

const paletteFor = (c: C, idol: Idol): Palette => paletteOf(c, `ki-idol${idol}`, IDOL_PALETTES[idol] as (c: C) => Palette);

// ---- the choreography ----

type Pt = readonly [number, number];
/** A pose: each arm's elbow and paw in the idol's own coordinates, and her eyes. */
type Move = { readonly left: readonly [Pt, Pt]; readonly right: readonly [Pt, Pt]; readonly face: Face };

const MOVES = {
  cheer: {
    left: [
      [-9, -26],
      [-12, -32],
    ],
    right: [
      [9, -26],
      [12, -32],
    ],
    face: 'open',
  },
  point: {
    left: [
      [-9, -16],
      [-6, -13.5],
    ],
    right: [
      [10, -27],
      [14, -33],
    ],
    face: 'wink',
  },
  cheek: {
    left: [
      [-10, -19],
      [-8.5, -27],
    ],
    right: [
      [10, -19],
      [8.5, -27],
    ],
    face: 'open',
  },
  heart: {
    left: [
      [-13, -33],
      [-2.5, -46],
    ],
    right: [
      [13, -33],
      [2.5, -46],
    ],
    face: 'open',
  },
  wave: {
    left: [
      [-9, -16],
      [-9, -12],
    ],
    right: [
      [11, -25],
      [12, -34],
    ],
    face: 'open',
  },
  mic: {
    left: [
      [-10, -19],
      [-7, -26.5],
    ],
    right: [
      [10, -21],
      [15, -19],
    ],
    face: 'open',
  },
  spin: {
    left: [
      [-9, -22],
      [-14, -23],
    ],
    right: [
      [9, -22],
      [14, -23],
    ],
    face: 'open',
  },
} as const satisfies Record<string, Move>;

type MoveName = keyof typeof MOVES;

// Two routines in turn, a bar each, both ending in a heart over their heads before the spin into the next bar.
const ROUTINES: readonly (readonly MoveName[])[] = [
  ['cheer', 'point', 'cheek', 'heart'],
  ['cheer', 'wave', 'mic', 'heart'],
];

/** The moment of the dance all three share: the move, how far round the spin is (cos of the turn), hop and squash. */
type Look = { readonly move: Move; readonly turn: number; readonly hop: number; readonly squash: number; readonly singing: boolean };

const SPIN = 0.6;

const lookOf = (f: Frame): Look => {
  const { index, phase } = beatInBar(f);
  const singing = frac(f.beat * 2) < 0.55;
  if (index === 0 && phase < SPIN) {
    const k = phase / SPIN;
    const turn = Math.cos(k * k * (3 - 2 * k) * Math.PI * 2);
    return { move: MOVES.spin, turn, hop: Math.sin(Math.PI * k) * 6, squash: 0, singing };
  }
  const name = (ROUTINES[f.bar % 2] as readonly MoveName[])[index] ?? 'cheer';
  const hop = phase > 0.1 && phase < 0.5 ? Math.sin((Math.PI * (phase - 0.1)) / 0.4) * 3 : 0;
  return { move: MOVES[name], turn: 1, hop, squash: phase < 0.1 ? 1 : 0, singing };
};

// ---- drawing the idols ----

/** Left to right on the stage: the tabby, the lead in the middle, the grey. */
const ORDER: readonly Idol[] = [1, 0, 2];

const arm = (ctx: Ctx, at: (p: Pt) => Pt, from: Pt, [elbow, paw]: readonly [Pt, Pt], fur: string, ink: string): void => {
  const [ax, ay] = at(from);
  const [ex, ey] = at(elbow);
  const [px, py] = at(paw);
  limb(ctx, ax, ay, ex, ey, 2, ink, ink);
  limb(ctx, ex, ey, px, py, 2, ink, ink);
  limb(ctx, ax, ay, ex, ey, 0, fur, fur);
  limb(ctx, ex, ey, px, py, 0, fur, fur);
  fillRect(ctx, ink, px - 2, py - 1, 5, 3);
  fillRect(ctx, ink, px - 1, py - 2, 3, 5);
  fillRect(ctx, fur, px - 1, py - 1, 3, 3);
};

const arms = (ctx: Ctx, at: (p: Pt) => Pt, move: Move, fur: string, ink: string): void => {
  arm(ctx, at, [-7, -20.5], move.left, fur, ink);
  arm(ctx, at, [7, -20.5], move.right, fur, ink);
};

const idol = (ctx: Ctx, f: Frame, c: C, look: Look, slot: number): void => {
  const l = layoutOf(f);
  const who = ORDER[slot] as Idol;
  const dir = slot === 0 ? -1 : 1;
  const s = l.scale;
  const x = l.kittens[slot] ?? 0;
  const foot = l.feet - Math.round(look.hop * s);
  const back = look.turn < 0;
  const pal = paletteFor(c, who);
  const fur = pal.f as string;
  const sx = dir * s * look.turn * (1 + 0.1 * look.squash);
  const sy = s * (1 - 0.1 * look.squash);
  const at = (p: Pt): Pt => [Math.round(x + p[0] * sx), Math.round(foot + p[1] * sy)];
  fillDither(ctx, c.ink, 0.5, x - 9 * s, l.feet - 1, 19 * s, 3);
  const tucked = Math.abs(look.turn) < 0.45;
  if (back && !tucked) arms(ctx, at, look.move, fur, c.ink);
  if (look.turn > 0.95)
    catTail(ctx, x + Math.round(8 * s * dir), foot - Math.round(9 * s), 6, Math.round(5 + 2 * Math.sin(f.beat * Math.PI)), fur, c.ink, dir);
  const face: Face | 'back' = back ? 'back' : look.move.face === 'open' && blinking(f.t, 11 + who) ? 'blink' : look.move.face;
  const stance = { sx: dir * s * Math.max(0.5, Math.abs(look.turn)) * (1 + 0.1 * look.squash), sy };
  drawSculpt(ctx, kittenSprite(who, face, look.singing && !back, stance), pal, x, foot);
  if (!back && !tucked) arms(ctx, at, look.move, fur, c.ink);
};

const idols = (ctx: Ctx, f: Frame, c: C): void => {
  const look = lookOf(f);
  for (let slot = 0; slot < 3; slot++) idol(ctx, f, c, look, slot);
};

// ---- song in the air: a note floats up from one idol after another, and sparkles pop round them on the beat ----

const NOTE: Sprite = ['...oo..', '...oxo.', '...oxxo', '...oxoo', '...oxo.', '.oooxo.', 'oxxxxo.', 'oxxxo..', '.ooo...'];

const notePalettes = (c: C): readonly Palette[] =>
  (['cosB', 'cosA', 'cosC'] as const).map((k) => paletteOf(c, `ki-note-${k}`, (v: C) => ({ o: v.ink, x: v[k] })));

const song = (ctx: Ctx, f: Frame, c: C): void => {
  const l = layoutOf(f);
  const pals = notePalettes(c);
  const now = Math.floor(f.beat);
  for (let b = now - 2; b <= now; b++) {
    const age = f.beat - b;
    const slot = ((b % 3) + 3) % 3;
    const dir = slot === 0 ? -1 : 1;
    const x = (l.kittens[slot] ?? 0) + dir * Math.round(14 * l.scale) + Math.round(Math.sin(age * 4) * 2);
    const y = l.feet - Math.round(44 * l.scale) - Math.round(age * 12);
    if (age < 2.6) drawSprite(ctx, NOTE, pals[slot] as Palette, x - 3, y);
  }
  if (frac(f.beat) > 0.22) return;
  for (let k = 0; k < 4; k++) {
    const x = l.heart.x + Math.round((rand(now, k) - 0.5) * f.w * 0.7);
    const y = l.feet - Math.round((20 + rand(now, k + 9) * 40) * l.scale);
    twinkle(ctx, x, y, c.lace, 2);
  }
};

// ---- the crowd, seen from behind: puppies, bunnies and birds, f fur, F its shade, h where the stage light catches ----

type Kind = 'puppy' | 'bunny' | 'bird';

const FAN_W = 22;
const FAN_H = 28;

const fanHead = oval(0, -9, 6.5, 6);

const KIND_PARTS: Readonly<Record<Kind, readonly Part[]>> = {
  puppy: [
    ['f', both(oval(0, 0, 8, 6), (_, y) => y < 0)],
    ['f', fanHead],
    ['h', both(fanHead, (_, y) => y < -13)],
    ['F', oval(-6.4, -8, 2.2, 4.2)],
    ['F', oval(6.4, -8, 2.2, 4.2)],
  ],
  bunny: [
    ['f', both(oval(0, 0, 8, 6), (_, y) => y < 0)],
    ['f', oval(-2.6, -19, 1.9, 6)],
    ['f', stick([2.6, -14], [6.5, -21], 1.8)],
    ['h', oval(-2.6, -22, 1, 2.6)],
    ['f', fanHead],
    ['h', both(fanHead, (_, y) => y < -13)],
  ],
  bird: [
    ['f', both(oval(0, 0, 8.5, 6), (_, y) => y < 0)],
    ['f', oval(0, -6.5, 7.5, 7)],
    ['h', both(oval(0, -6.5, 7.5, 7), (_, y) => y < -11.5)],
    ['F', tri([-1.5, -12.5], [1.5, -12.5], [-2.5, -17])],
    ['F', tri([0, -12.5], [3, -12.5], [2.5, -16.5])],
    ['F', oval(-7.4, -4, 2, 3)],
  ],
};

// Every fan holds one paw up for the penlight.
const RAISED: readonly Part[] = [
  ['f', stick([4.5, -4], [9, -17], 1.4)],
  ['f', oval(9, -17.6, 1.9, 1.9)],
];

const fanSprite = (kind: Kind, size: number): Sprite =>
  sculpt(`ki-fan:${kind}`, FAN_W, FAN_H, () => [...KIND_PARTS[kind], ...RAISED], { sx: size, sy: size });

const KINDS: readonly Kind[] = ['puppy', 'bunny', 'bird', 'bunny', 'puppy', 'bird', 'puppy'];
const FURS = ['#e4ac6c', '#f4f0ec', '#9a6a48', '#c8c0d0', '#ffe07a', '#8ad0f4'] as const;

// Fans in the back rows sit further from the stage, so they fade into the dark of the hall (or the green outdoors).
const fanPalette = (c: C, fur: number, depth: number): Palette =>
  paletteOf(c, `ki-fan${fur}:${depth}`, (k: C) => {
    const base = FURS[fur] as string;
    const dim = outdoors(k) ? 0.04 + depth * 0.06 : 0.25 + depth * 0.18;
    return { o: k.ink, f: mixColor(base, k.crowd, dim), F: mixColor(base, k.crowd, dim + 0.25), h: mixColor(base, k.lace, 0.4) };
  });

/** How far the penlights lean: they swing together from side to side, one way each beat. */
const leanOf = (f: Frame): number => 0.5 * Math.max(-1, Math.min(1, Math.sin(f.beat * Math.PI) * 3));

const penlight = (ctx: Ctx, f: Frame, c: C, x: number, y: number, size: number, color: string): void => {
  const lean = leanOf(f);
  const len = Math.round(12 * size);
  const tipX = x + Math.round(Math.sin(lean) * len);
  const tipY = y - Math.round(Math.cos(lean) * len);
  const midX = Math.round((x + tipX * 2) / 3);
  const midY = Math.round((y + tipY * 2) / 3);
  drawGlow(ctx, color, midX, midY, Math.round(8 * size), Math.round(8 * size), 0.35);
  limb(ctx, x, y, tipX, tipY, size > 0.8 ? 2 : 1, color, c.ink);
  limb(ctx, midX, midY, tipX, tipY, 0, c.lace, c.lace);
};

const fan = (ctx: Ctx, f: Frame, c: C, x: number, row: { readonly y: number; readonly size: number }, depth: number, i: number): void => {
  const kind = KINDS[i % KINDS.length] as Kind;
  const fur = (i * 5 + depth) % FURS.length;
  const pal = fanPalette(c, fur, depth);
  const bob = frac(f.beat + (i % 2) * 0.5) < 0.25 ? 1 : 0;
  const y = row.y - bob;
  drawSculpt(ctx, fanSprite(kind, row.size), pal, x, y);
  const color = [c.cosA, c.cosB, c.cosC][(i * 7 + depth) % 3] as string;
  penlight(ctx, f, c, x + Math.round(9 * row.size), y - Math.round(19 * row.size), row.size, color);
};

const crowd = (ctx: Ctx, f: Frame, c: C): void => {
  const l = layoutOf(f);
  l.rows.forEach((row, depthFromBack) => {
    const depth = l.rows.length - 1 - depthFromBack;
    const pitch = Math.round(21 * row.size);
    for (let x = (depth % 2) * (pitch >> 1) - 4, i = depth * 13; x < f.w + pitch; x += pitch, i++) fan(ctx, f, c, x, row, depth, i);
  });
};

// ---- confetti: two cannons at the front of the stage fire at every phrase, and a little more drifts down always ----

const PIECES = 72;

const cannonsOf = (f: Frame, l: Layout): readonly [number, number] => {
  const [x0, x1] = towersX(f, l);
  return [x0 + 12, x1 - 12];
};

const confettiColors = (c: C): readonly string[] => [c.cosA, c.cosB, c.cosC, c.gold, c.lace, c.heart];

/** A scrap of paper tumbling as it falls: a dash that turns from flat to edge-on. */
const scrap = (ctx: Ctx, color: string, x: number, y: number, flip: boolean): void =>
  fillRect(ctx, color, x, y, flip ? 1 : 2, flip ? 2 : 1);

// The burst shoots up fast, slows as it spreads, then flutters down past the crowd.
const burst = (ctx: Ctx, f: Frame, l: Layout, c: C, age: number, seed: number): void => {
  const colors = confettiColors(c);
  const [left, right] = cannonsOf(f, l);
  const out = 1 - 0.5 ** (age * 3);
  for (let i = 0; i < PIECES; i++) {
    const dir = i % 2 === 0 ? 1 : -1;
    const x0 = dir > 0 ? left : right;
    const rise = f.h * (0.45 + 0.4 * rand(i, seed)) * out;
    const fall = Math.max(0, age - 0.7) * (10 + 10 * rand(i, seed + 1));
    const y = Math.round(l.floor - rise + fall);
    if (y > f.h) continue;
    const x = Math.round(x0 + dir * f.w * (0.05 + 0.4 * rand(i, seed + 2)) * out + Math.sin(age * 3 + i) * 3);
    scrap(ctx, colors[i % colors.length] as string, x, y, Math.floor(age * 5 + i) % 2 === 0);
  }
};

const cannons = (ctx: Ctx, f: Frame, l: Layout, c: C, age: number): void => {
  cannonsOf(f, l).forEach((x, k) => {
    const lean = k === 0 ? 1 : -1;
    if (age < 0.35) drawGlow(ctx, c.gold, x + lean * 3, l.floor - 12, 9, 9, 0.6);
    for (let j = 0; j < 9; j++) {
      fillRect(ctx, c.ink, x - 3 + Math.round((lean * j) / 3), l.floor - j, 7, 1);
      fillRect(ctx, j > 6 ? c.gold : c.trussLo, x - 2 + Math.round((lean * j) / 3), l.floor - j, 5, 1);
    }
  });
};

const drift = (ctx: Ctx, f: Frame, c: C): void => {
  const colors = confettiColors(c);
  for (let i = 0; i < 14; i++) {
    const y = Math.round(wrapTo(f.t * (8 + rand(i, 41) * 6) + rand(i, 42) * f.h, f.h));
    const x = Math.round(rand(i, 43) * f.w + Math.sin(f.t * 1.5 + i) * 4);
    scrap(ctx, colors[i % colors.length] as string, x, y, Math.floor(f.t * 4 + i) % 2 === 0);
  }
};

const wrapTo = (v: number, m: number): number => ((v % m) + m) % m;

const confetti = (ctx: Ctx, f: Frame, c: C): void => {
  const l = layoutOf(f);
  const { index, age } = phraseOf(f, 4);
  cannons(ctx, f, l, c, age);
  drift(ctx, f, c);
  if (age < 12) burst(ctx, f, l, c, age, index * 7 + 3);
};

// ---- the scene ----

const KITTENS = {
  lace: '#fffaf6',
  pink: '#ff9ab8',
  blush: '#ff7aa8',
  gold: '#ffd25a',
  mouth: '#d8405a',
  furA: '#fbf6f4',
  furALo: '#d8cad8',
  cosA: '#ff6fae',
  cosALo: '#d03e80',
  furB: '#ffb46a',
  furBLo: '#d8803e',
  cosB: '#5ac8ff',
  cosBLo: '#2e88d0',
  furC: '#a8a8bc',
  furCLo: '#74748c',
  cosC: '#ffd84a',
  cosCLo: '#d8a020',
} as const;

export const kittenIdol = defineScene<K>({
  id: 'kitten-idol',
  title: 'Kitten Idols',
  mood: { valence: 0.8, energy: 0.75 },
  styles: ['kawaii-pop', 'idol-disco', 'nineties-pop', 'eurobeat', 'puzzle-pop'],
  variants: [
    {
      mood: { valence: 0.85, energy: 0.75 },
      colors: {
        ...KITTENS,
        bg0: '#1a0a28',
        bg1: '#3a1048',
        bg2: '#6a1c64',
        far: '#2a0c36',
        farHi: '#3e1a4c',
        cloud: '#1a0a28',
        cloudLo: '#1a0a28',
        truss: '#c8c0d8',
        trussLo: '#5a5070',
        beam: '#ffd0ec',
        heart: '#ff5aa8',
        heartHi: '#fff0f8',
        heartLo: '#5a1a48',
        panel: '#240c30',
        stage: '#4a2a5c',
        stageHi: '#a07ab8',
        stageLo: '#2e1a3e',
        ink: '#1a0c20',
        crowd: '#140818',
        crowdHi: '#2a1430',
      },
    },
    {
      mood: { valence: 0.55, energy: 0.85 },
      colors: {
        ...KITTENS,
        bg0: '#04081c',
        bg1: '#0a1840',
        bg2: '#123064',
        far: '#0a1430',
        farHi: '#162448',
        cloud: '#04081c',
        cloudLo: '#04081c',
        truss: '#b8c8e0',
        trussLo: '#3e4c6a',
        beam: '#9ae0ff',
        heart: '#6ab4ff',
        heartHi: '#f0fbff',
        heartLo: '#1a2c5a',
        panel: '#0a1028',
        stage: '#22305a',
        stageHi: '#6a88c0',
        stageLo: '#141e3c',
        ink: '#0a0c1c',
        crowd: '#060a18',
        crowdHi: '#18203a',
      },
    },
    {
      mood: { valence: 0.9, energy: 0.6 },
      colors: {
        ...KITTENS,
        bg0: '#3a8ee0',
        bg1: '#78c4f4',
        bg2: '#c8ecff',
        far: '#2e8a54',
        farHi: '#5ab870',
        cloud: '#ffffff',
        cloudLo: '#cfe4f4',
        truss: '#e8e8f0',
        trussLo: '#6a7088',
        beam: '#fff6c0',
        heart: '#ff5a8a',
        heartHi: '#ffffff',
        heartLo: '#c84a78',
        panel: '#6a3058',
        stage: '#c8905a',
        stageHi: '#f0c088',
        stageLo: '#8a5a38',
        ink: '#2a1a28',
        crowd: '#4a8a40',
        crowdHi: '#6aaa58',
      },
    },
  ],
  layers: [backdrop, lights, heart, stage, idols, song, crowd, confetti],
});
