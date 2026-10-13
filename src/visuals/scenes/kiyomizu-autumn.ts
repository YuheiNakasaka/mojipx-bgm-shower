// Kyoto's hillside temple in autumn: the hall's great cypress-bark roof and its wooden stage on a forest of pillars
// jut out over a valley of maples, a vermilion pagoda stands on the far slope, the city lies below and leaves drift.
import { type Ctx, drawSprite, fillRect, flipped, type Sprite } from 'mojipx';
import { bayer, fillColumns, pixelLine, rand, ridgeNoise } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { drawGlow, driftingClouds, fillDither, flock, paletteBy, wrap } from './batch-1-helpers.ts';
import { moon } from './batch-2-helpers.ts';
import { sunWithHalo } from './batch-4-helpers.ts';
import { BIRD, isDark } from './batch-5-helpers.ts';
import { frameLayer } from './batch-6-helpers.ts';
import {
  flutter,
  type Pagoda,
  type PagodaColors,
  type Plan,
  paintPagoda,
  planOf,
  puff,
  searchBeam,
  skyBase,
  through,
} from './batch-9-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sky3'
  | 'sun'
  | 'cloud'
  | 'hill'
  | 'hillLo'
  | 'city'
  | 'cityLit'
  | 'roof'
  | 'roofLit'
  | 'roofLo'
  | 'wood'
  | 'woodLit'
  | 'woodLo'
  | 'deck'
  | 'ink'
  | 'hallIn'
  | 'verm'
  | 'vermLit'
  | 'white'
  | 'maple0'
  | 'maple1'
  | 'maple2'
  | 'maple3'
  | 'beam'
  | 'glow';

// ---- layout ----

type Spot =
  | 'horizon'
  | 'deck'
  | 'hallL'
  | 'hallR'
  | 'stageR'
  | 'eave'
  | 'ridge'
  | 'dip'
  | 'pagodaX'
  | 'pagodaBase'
  | 'storey'
  | 'sunX'
  | 'sunY';
type Layout = Readonly<Record<Spot, number>>;

const WIDE: Plan<Spot> = {
  horizon: ['h', 0.48],
  deck: ['h', 0.53],
  hallL: ['w', 0.04],
  hallR: ['w', 0.48],
  stageR: ['w', 0.71],
  eave: ['h', 0.4],
  ridge: ['h', 0.11],
  dip: ['h', 0.84],
  pagodaX: ['w', 0.885],
  pagodaBase: ['h', 0.62],
  storey: ['h', 0.042],
  sunX: ['w', 0.565],
  sunY: ['h', 0.445],
};

const TALL: Plan<Spot> = {
  horizon: ['h', 0.355],
  deck: ['h', 0.41],
  hallL: ['w', -0.08],
  hallR: ['w', 0.56],
  stageR: ['w', 0.97],
  eave: ['h', 0.335],
  ridge: ['h', 0.205],
  dip: ['h', 0.73],
  pagodaX: ['w', 0.8],
  pagodaBase: ['h', 0.37],
  storey: ['h', 0.022],
  sunX: ['w', 0.6],
  sunY: ['h', 0.3],
};

const layoutOf = (f: Frame): Layout => planOf(f, WIDE, TALL);

// The colors tell the hour: a dark upper sky is dusk, a dark sky all the way down is the night illumination.
const nightOf = (c: Colors<K>): boolean => isDark(c.sky2);
const duskOf = (c: Colors<K>): boolean => !nightOf(c) && isDark(c.sky0);

// ---- sprites ----

// A maple leaf tumbling: face, turning, edge on, back. a leaf, b its shade, s stem.
const MAPLE: readonly Sprite[] = [
  ['..a..', 'a.a.a', 'aaaaa', '.aba.', '..s..'],
  ['..a..', '..aa.', '.aab.', '..ab.', '..s..'],
  ['.....', '.....', 'aabbb', '.....', '.....'],
  ['..b..', 'b.b.b', 'bbbbb', '.bab.', '..s..'],
];

const leafPalettes = paletteBy<K>((c) => ({ a: c.maple1, b: c.maple0, s: c.maple0 }));
const leafPalettes2 = paletteBy<K>((c) => ({ a: c.maple2, b: c.maple1, s: c.maple1 }));
const leafPalettes3 = paletteBy<K>((c) => ({ a: c.maple3, b: c.maple2, s: c.maple2 }));

// A visitor on the stage, two steps. h hair, s skin, k clothes, l legs.
const VISITOR: readonly Sprite[] = [
  ['.h.', 'hsh', '.s.', 'kkk', 'kkk', 'kkk', 'kkk', '.l.', 'l.l'],
  ['.h.', 'hsh', '.s.', 'kkk', 'kkk', 'kkk', 'kkk', '.l.', '.l.'],
];

const visitorPalettes = [
  paletteBy<K>((c) => ({ h: c.ink, s: c.deck, k: c.verm, l: c.ink })),
  paletteBy<K>((c) => ({ h: c.ink, s: c.deck, k: c.white, l: c.ink })),
  paletteBy<K>((c) => ({ h: c.ink, s: c.deck, k: c.hill, l: c.ink })),
  paletteBy<K>((c) => ({ h: c.ink, s: c.deck, k: c.maple3, l: c.ink })),
] as const;

const birdPalette = paletteBy<K>((c) => ({ o: c.ink }));

// ---- the far view: hills, the city and the pagoda's slope ----

const paintCityBlock = (g: Ctx, c: Colors<K>, night: boolean, x: number, y: number, size: readonly [number, number]): void => {
  const [bw, bh] = size;
  fillRect(g, c.city, x, y, bw, bh + 2);
  if (!night && rand(x, y) < 0.7) fillRect(g, c.cityLit, x, y, bw, 1);
  if (night && rand(x, y + 1) < 0.55) fillRect(g, c.cityLit, x + Math.floor(rand(x, y + 2) * bw), y + 1, 1, 1);
};

const paintCity = (g: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const depth = Math.round((m.dip - m.horizon) * 0.7);
  const night = nightOf(c);
  for (let row = 0; row < depth; row += 2) {
    const scale = 1 + (row / depth) * 2;
    for (let x = 0; x < f.w; ) {
      const bw = 2 + Math.floor(rand(x, row + 11) * 3 * scale);
      const bh = 1 + Math.floor(rand(x, row + 12) * 3 * scale);
      paintCityBlock(g, c, night, x, m.horizon + row + 2 - bh, [bw, bh]);
      x += bw + (rand(x, row + 14) < 0.3 ? 1 : 0);
    }
  }
  if (!night) fillDither(g, c.sky3, 0.25, 0, m.horizon, f.w, Math.round(depth * 0.3));
};

const cityLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('kiyomizu-city', f, c, (g) => {
    const m = layoutOf(f);
    fillColumns(g, f.w, m.horizon + 1, c.hillLo, (x) => m.horizon - 3 - ridgeNoise(x / 46, 21) * 16);
    fillColumns(g, f.w, m.horizon + 1, c.hill, (x) => m.horizon - 1 - Math.max(0, ridgeNoise(x / 25, 22) - 0.4) * 14);
    paintCity(g, f, m, c);
  });

// A maple crown, darker the lower it sits (`depth` 0 near the crown line, 1 far below it).
const crown = (g: Ctx, x: number, y: number, r: number, tones: readonly string[], i: number, depth: number): void => {
  const k = Math.max(0, Math.floor(rand(i, 31) * (tones.length - 2) - depth * 2));
  puff(g, x, y, r, [tones[k] as string, tones[k + 1] as string, tones[k + 2] as string]);
};

/** Rows of maple crowns filling everything below `top(x)`; `r` is the crown size. */
const paintMaples = (g: Ctx, f: Frame, top: (x: number) => number, r: number, tones: readonly string[], seed: number): void => {
  const step = Math.max(3, Math.round(r * 1.2));
  for (let row = 0, i = 0; row < f.h; row += step) {
    for (let x = -r; x < f.w + r; x += step, i++) {
      const jx = x + Math.round((rand(i, seed) - 0.5) * step);
      const y = top(jx) + row + Math.round(rand(i, seed + 1) * r * 0.6);
      const size = Math.max(2, Math.round(r * (0.6 + 0.6 * rand(i, seed + 2))));
      if (y - r < f.h) crown(g, jx, y, size, tones, i + seed, Math.min(1, row / (r * 9)));
    }
  }
};

// The slope across the valley rises toward the pagoda.
const slopeAt = (f: Frame, m: Layout, x: number): number =>
  m.pagodaBase - 1 - 10 * Math.max(0, 1 - ((x - m.pagodaX) / (f.w * 0.3)) ** 2) + ridgeNoise(x / 6, 23) * 3;

const pagodaOf = (m: Layout): Pagoda => ({
  cx: m.pagodaX,
  base: m.pagodaBase,
  tiers: 3,
  storey: m.storey,
  width: Math.round(m.storey * 2),
  span: Math.round(m.storey * 2.5),
});

const pagodaTones = (c: Colors<K>): PagodaColors => ({
  ...{ roof: c.roofLo, roofLit: c.roofLit, under: c.ink, body: c.verm },
  ...{ bodyLit: c.vermLit, panel: c.white, spire: c.ink, spireLit: c.roofLit },
});

const farHillLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('kiyomizu-far-hill', f, c, (g) => {
    const m = layoutOf(f);
    paintMaples(g, f, (x) => slopeAt(f, m, x), 4, [c.hillLo, c.hill, c.maple0, c.maple1, c.maple2], 24);
    paintPagoda(g, pagodaOf(m), pagodaTones(c));
    paintMaples(g, f, (x) => m.pagodaBase + 2 + ridgeNoise(x / 5, 25) * 3, 3, [c.hill, c.maple0, c.maple1, c.maple2, c.maple3], 26);
  });

// ---- the hall and its stage ----

type Roof = { readonly l: number; readonly r: number; readonly eave: number; readonly ridge: number };

// One column of a temple roof: a concave slope from the ridge sweeping out to an eave whose tips turn up.
const roofColumn = (g: Ctx, c: Colors<K>, rf: Roof, x: number): void => {
  const run = Math.min((rf.eave - rf.ridge) * 1.15, (rf.r - rf.l) * 0.34);
  const fromEnd = Math.min(x - rf.l, rf.r - x);
  const tip = Math.max(0, 1 - fromEnd / 12);
  const bottom = rf.eave - Math.round(4 * tip * tip);
  const s = Math.max(0, 1 - fromEnd / run);
  const top = Math.min(bottom - 4, rf.ridge + Math.round((rf.eave - rf.ridge) * s ** 0.6));
  fillRect(g, c.roof, x, top, 1, bottom - top);
  for (let y = top + 1; y < bottom - 2; y++) {
    if ((y + (x >> 2)) % 3 === 0 && bayer(x, y) < 0.5) fillRect(g, c.roofLo, x, y, 1, 1);
    else if (y - top < 4 && bayer(x, y) < 0.3) fillRect(g, c.roofLit, x, y, 1, 1);
  }
  fillRect(g, c.roofLit, x, top, 1, 1);
  fillRect(g, c.roofLit, x, bottom - 2, 1, 2);
  fillRect(g, c.roofLo, x, bottom, 1, 1);
  fillRect(g, c.ink, x, bottom + 1, 1, 2);
};

// The ridge: a dark beam with a curled ornament at each end.
const ONI: Sprite = ['l..', 'oo.', 'ooo', 'ooo'];
const oniPalette = paletteBy<K>((c) => ({ o: c.ink, l: c.roofLit }));

const paintRoof = (g: Ctx, c: Colors<K>, rf: Roof): void => {
  for (let x = rf.l; x <= rf.r; x++) roofColumn(g, c, rf, x);
  const run = Math.round(Math.min((rf.eave - rf.ridge) * 1.15, (rf.r - rf.l) * 0.34));
  fillRect(g, c.ink, rf.l + run - 1, rf.ridge - 1, rf.r - rf.l - run * 2 + 3, 2);
  drawSprite(g, ONI, oniPalette(c), rf.l + run - 3, rf.ridge - 4);
  drawSprite(g, flipped(ONI), oniPalette(c), rf.r - run, rf.ridge - 4);
};

const shoji = (g: Ctx, c: Colors<K>, x: number, y: number, w: number, h: number): void => {
  fillRect(g, c.woodLo, x, y, w, h);
  for (let k = y; k < y + h; k += 2) fillRect(g, c.wood, x, k, w, 1);
  for (let k = x; k < x + w; k += 2) fillRect(g, c.wood, k, y, 1, h);
};

const paintHall = (g: Ctx, m: Layout, c: Colors<K>): void => {
  const top = m.eave + 3;
  const h = m.deck - top;
  fillRect(g, c.woodLo, m.hallL, top, m.hallR - m.hallL, h);
  for (let x = m.hallL + 2, i = 0; x < m.hallR - 2; x += 10, i++) {
    if (i % 3 === 1) fillRect(g, c.hallIn, x + 2, top + 3, 8, h - 3);
    else shoji(g, c, x + 2, top + 3, 8, h - 4);
    fillRect(g, c.wood, x, top, 2, h);
    fillRect(g, c.woodLit, x, top, 1, h);
  }
  fillRect(g, c.wood, m.hallL, top, m.hallR - m.hallL, 2);
  fillRect(g, c.woodLit, m.hallL, top, m.hallR - m.hallL, 1);
};

const paintDeck = (g: Ctx, m: Layout, c: Colors<K>): void => {
  const w = m.stageR - m.hallL + 1;
  fillRect(g, c.deck, m.hallL, m.deck, w, 2);
  fillRect(g, c.woodLo, m.hallL, m.deck + 2, w, 1);
  fillRect(g, c.wood, m.hallL, m.deck + 3, w, 3);
  for (let x = m.stageR - 1; x > m.hallL; x -= 5) fillRect(g, c.deck, x, m.deck + 4, 1, 1);
  fillRect(g, c.ink, m.hallL, m.deck + 6, w, 1);
};

// The forest of pillars tied by beams that carries the stage over the slope; it darkens toward the valley floor.
const paintScaffold = (g: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const top = m.deck + 7;
  const pitch = f.w > f.h ? 8 : 7;
  const w = m.stageR - m.hallL;
  for (let x = m.stageR - 2 - pitch / 2; x > m.hallL; x -= pitch) fillRect(g, c.woodLo, Math.round(x), top, 1, f.h - top);
  for (let y = top + 8; y < f.h; y += 11) fillRect(g, c.woodLo, m.hallL, y - 3, w, 1);
  for (let x = m.stageR - 2; x > m.hallL; x -= pitch) {
    fillRect(g, c.wood, x, top, 2, f.h - top);
    fillRect(g, c.woodLit, x, top, 1, f.h - top);
  }
  for (let y = top + 8; y < f.h; y += 11) {
    fillRect(g, c.wood, m.hallL, y, w + 1, 2);
    fillRect(g, c.woodLit, m.hallL, y, w + 1, 1);
  }
  fillDither(g, c.ink, 0.25, m.hallL, top + 28, w + 2, f.h);
  fillDither(g, c.ink, 0.25, m.hallL, top + 56, w + 2, f.h);
};

// The roofed wing at the stage's outer end, on two posts.
const paintWing = (g: Ctx, m: Layout, c: Colors<K>): void => {
  const eave = m.deck - 14;
  for (const x of [m.stageR - 25, m.stageR - 3]) {
    fillRect(g, c.wood, x, eave, 2, m.deck - eave);
    fillRect(g, c.woodLit, x, eave, 1, m.deck - eave);
  }
  paintRoof(g, c, { l: m.stageR - 32, r: m.stageR + 5, eave, ridge: eave - 9 });
};

const hallLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('kiyomizu-hall', f, c, (g) => {
    const m = layoutOf(f);
    paintScaffold(g, f, m, c);
    paintHall(g, m, c);
    paintDeck(g, m, c);
    const over = Math.round((m.hallR - m.hallL) * 0.06) + 3;
    paintRoof(g, c, { l: m.hallL - over, r: m.hallR + over, eave: m.eave, ridge: m.ridge });
    paintWing(g, m, c);
  });

// ---- the near maples and a branch hanging into the top corner ----

const crownLine = (f: Frame, m: Layout, x: number): number =>
  through(
    [
      [m.hallL, m.deck + 10],
      [m.hallL + (m.hallR - m.hallL) * 0.45, m.deck + 22],
      [m.hallR - 6, m.deck + (m.dip - m.deck) * 0.6],
      [(m.hallR + m.stageR) / 2, m.dip],
      [m.stageR + 14, m.dip - 6],
      [f.w, m.pagodaBase + 10],
    ],
    x,
  ) -
  ridgeNoise(x / 9, 41) * 10;

const nearLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('kiyomizu-near', f, c, (g) => {
    const m = layoutOf(f);
    const r = f.w > f.h ? 6 : 7;
    fillColumns(g, f.w, f.h, c.maple0, (x) => crownLine(f, m, x) + r * 2);
    paintMaples(g, f, (x) => crownLine(f, m, x), r, [c.maple0, c.maple1, c.maple2, c.maple3, c.maple3], 42);
  });

const branchSize = (f: Frame): readonly [number, number] => [
  Math.round(f.w * (f.w > f.h ? 0.36 : 0.62)),
  Math.round(f.h * (f.w > f.h ? 0.24 : 0.13)),
];

// A big maple leaf for the branch in front of the view. a leaf, b vein, s stem.
const BIG_LEAF: Sprite = ['...a...', '.a.a.a.', '..aaa..', 'aaaaaaa', '.aabaa.', 'a..b..a', '...s...'];

// A clump of leaves hanging from a twig tip: the darker ones behind, the brightest in front.
const leafClump = (g: Ctx, c: Colors<K>, x: number, y: number, k: number): void => {
  const palettes = [leafPalettes(c), leafPalettes(c), leafPalettes2(c), leafPalettes2(c), leafPalettes3(c)];
  for (let j = 0; j < 14; j++) {
    const a = rand(j, k + 60) * Math.PI * 2;
    const d = Math.sqrt(rand(j, k + 61));
    const palette = palettes[Math.floor((j / 14) * palettes.length)] ?? leafPalettes(c);
    drawSprite(g, BIG_LEAF, palette, Math.round(x - 3 + Math.cos(a) * d * 10), Math.round(y - 3 + Math.sin(a) * d * 6));
  }
};

const branchLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement => {
  const [bw, bh] = branchSize(f);
  return frameLayer('kiyomizu-branch', f, c, (g) => {
    const end = [Math.round(bw * 0.06), Math.round(bh * 0.5)] as const;
    for (let k = 0; k < 3; k++) pixelLine(g, bw, k, end[0], end[1] + k * 0.5, k === 0 ? c.woodLo : c.ink);
    for (let k = 0; k < 6; k++) {
      const u = (k + 0.6) / 6;
      const x = Math.round(bw + (end[0] - bw) * u);
      const y = Math.round(end[1] * u + 1);
      const tip = [x - 4 + Math.round(rand(k, 52) * 8), y + 5 + Math.round(rand(k, 51) * bh * 0.3)] as const;
      pixelLine(g, x, y, tip[0], tip[1], c.ink);
      leafClump(g, c, tip[0], tip[1], k);
    }
  });
};

// ---- per-frame layers ----

const heavens = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  if (nightOf(c)) {
    moon(ctx, Math.round(f.w * 0.84), Math.round(m.horizon * 0.2), 6, c.sun, c.sky3);
    const x = Math.round(m.hallR - (m.hallR - m.hallL) * 0.3);
    const y = Math.round((m.ridge + m.eave) / 2);
    searchBeam(ctx, { x, y, len: y, lean: 1.1 + Math.sin(f.t * 0.25) * 0.9, spread: 0.1, peak: 1 }, c.beam);
    return;
  }
  if (duskOf(c)) sunWithHalo(ctx, m.sunX, m.sunY, 8, c.sun, c.glow, 3);
  driftingClouds(ctx, f, c.cloud, c.sky2, { count: 4, top: m.horizon * 0.15, span: m.horizon * 0.45, size: 9, speed: 2.5, seed: 7 });
};

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  skyBase(ctx, f, {
    bottom: m.horizon + 2,
    stops: [c.sky0, c.sky1, c.sky2, c.sky3],
    stars: nightOf(c) ? [c.white, c.sky3] : null,
    seed: 9,
  });
  heavens(ctx, f, m, c);
};

const cityLights = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const depth = Math.round((m.dip - m.horizon) * 0.5);
  for (let i = 0; i < 40; i++) {
    if ((f.t * (0.3 + rand(i, 54)) + rand(i, 53)) % 1 > 0.5) continue;
    fillRect(ctx, c.cityLit, Math.floor(rand(i, 51) * f.w), m.horizon + 2 + Math.floor(rand(i, 52) * depth), 1, 1);
  }
};

const far = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(cityLayer(f, c), 0, 0);
  if (nightOf(c)) cityLights(ctx, f, layoutOf(f), c);
  ctx.drawImage(farHillLayer(f, c), 0, 0);
};

// Lanterns hang under the eave; after dark they glow and swell a little on the kick.
const lanterns = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const night = nightOf(c);
  for (let x = m.hallL + 8; x < m.hallR - 4; x += 20) {
    if (night) drawGlow(ctx, c.glow, x, m.eave + 7, 8, 7, 0.45 + f.kick * 0.3);
    fillRect(ctx, c.ink, x, m.eave + 3, 1, 2);
    fillRect(ctx, night ? c.deck : c.verm, x - 1, m.eave + 5, 3, 4);
  }
};

const hall = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(hallLayer(f, c), 0, 0);
  lanterns(ctx, f, layoutOf(f), c);
};

const visitors = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const lo = Math.max(2, m.hallL + 4);
  const span = m.stageR - 6 - lo;
  const count = Math.max(4, Math.round(span / 22));
  for (let i = 0; i < count; i++) {
    const dir = i % 2 === 0 ? 1 : -1;
    const x = lo + wrap(rand(i, 71) * span + f.t * dir * (2 + rand(i, 72) * 3), span);
    const step = Math.floor(f.beat * 2 + i) % 2;
    const palette = visitorPalettes[i % visitorPalettes.length] ?? visitorPalettes[0];
    drawSprite(ctx, VISITOR[step] as Sprite, palette(c), Math.round(x), m.deck - 9);
  }
};

const railing = (ctx: Ctx, m: Layout, c: Colors<K>): void => {
  const w = m.stageR - m.hallL;
  fillRect(ctx, c.woodLit, m.hallL, m.deck - 5, w, 1);
  fillRect(ctx, c.wood, m.hallL, m.deck - 4, w, 1);
  for (let x = m.stageR - 1; x > m.hallL; x -= 6) fillRect(ctx, c.wood, x, m.deck - 4, 1, 4);
};

const stage = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  visitors(ctx, f, m, c);
  railing(ctx, m, c);
};

const near = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(nearLayer(f, c), 0, 0);
  const [bw] = branchSize(f);
  const sway = Math.round(Math.sin(f.t * 0.9) * 0.6 - 0.4);
  ctx.drawImage(branchLayer(f, c), 0, 0, bw + 1, f.h, f.w - bw + sway, 0, bw + 1, f.h);
};

const air = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const palettes = [leafPalettes(c), leafPalettes2(c), leafPalettes3(c)];
  flutter(ctx, f, MAPLE, palettes, {
    count: Math.round((f.w * f.h) / 2600),
    seed: 81,
    fall: 10,
    drift: -7,
    sway: 4,
    spin: 3,
    top: 0,
    bottom: f.h,
  });
  if (!nightOf(c)) flock(ctx, f, BIRD, birdPalette(c), { count: 4, top: f.h * 0.08, span: f.h * 0.12, speed: -9, seed: 83 });
};

export const kiyomizuAutumn = defineScene<K>({
  id: 'kiyomizu-autumn',
  title: 'Maple Temple',
  mood: { valence: 0.1, energy: -0.3 },
  styles: ['town-waltz', 'lofi-loop', 'credits-roll', 'grand-field', 'showa-ballad'],
  variants: [
    {
      // A clear autumn afternoon: the valley ablaze under a pale sky, the city hazy far below.
      mood: { valence: 0.5, energy: -0.2 },
      colors: {
        sky0: '#5f8fd0',
        sky1: '#8fb6e2',
        sky2: '#c4d8ea',
        sky3: '#f2e6cf',
        sun: '#fff6dc',
        cloud: '#ffffff',
        hill: '#7d93b4',
        hillLo: '#9aaec6',
        city: '#8a96ae',
        cityLit: '#c8d0de',
        roof: '#5a3a2e',
        roofLit: '#8a5a40',
        roofLo: '#3a2420',
        wood: '#8a6040',
        woodLit: '#b88a5a',
        woodLo: '#4e3426',
        deck: '#e0c08a',
        ink: '#24160f',
        hallIn: '#2e1c14',
        verm: '#e0482e',
        vermLit: '#ff7a4a',
        white: '#f4ead8',
        maple0: '#7a1a1e',
        maple1: '#c42a22',
        maple2: '#ec5a26',
        maple3: '#f6a03a',
        beam: '#8fb6e2',
        glow: '#ffcf7a',
      },
    },
    {
      // Sunset over the western hills: crows fly home and the hall's lanterns warm up.
      mood: { valence: 0, energy: -0.5 },
      colors: {
        sky0: '#2c2a5e',
        sky1: '#7a4a7e',
        sky2: '#e0766a',
        sky3: '#ffc07a',
        sun: '#fff0b8',
        cloud: '#f39a7a',
        hill: '#4a3a6a',
        hillLo: '#6a4a72',
        city: '#5a4466',
        cityLit: '#ffcf8a',
        roof: '#3e2630',
        roofLit: '#a0604a',
        roofLo: '#26161c',
        wood: '#6e4434',
        woodLit: '#c07a50',
        woodLo: '#3a2228',
        deck: '#e8a870',
        ink: '#1a0e14',
        hallIn: '#c8743c',
        verm: '#d8402e',
        vermLit: '#ff8a56',
        white: '#f0cdb0',
        maple0: '#5a1020',
        maple1: '#a01c24',
        maple2: '#dc4a2a',
        maple3: '#f89a40',
        beam: '#7a4a7e',
        glow: '#ffb060',
      },
    },
    {
      // The autumn illumination: maples blazing against the dark, and a blue beam sweeping the sky.
      mood: { valence: -0.2, energy: 0.35 },
      colors: {
        sky0: '#05081a',
        sky1: '#0c1430',
        sky2: '#18244a',
        sky3: '#2a3058',
        sun: '#f4f0d8',
        cloud: '#2a3460',
        hill: '#0e1428',
        hillLo: '#141c36',
        city: '#0a1020',
        cityLit: '#ffd27a',
        roof: '#22161a',
        roofLit: '#8a5a3e',
        roofLo: '#120a0e',
        wood: '#7a4a2e',
        woodLit: '#e09a5a',
        woodLo: '#2a1a16',
        deck: '#f0b870',
        ink: '#0a0608',
        hallIn: '#ffb85a',
        verm: '#e8402a',
        vermLit: '#ff8a50',
        white: '#ffe2b8',
        maple0: '#3a0814',
        maple1: '#b8141e',
        maple2: '#ff4a1e',
        maple3: '#ffb03a',
        beam: '#5aa0ff',
        glow: '#ffa040',
      },
    },
  ],
  layers: [sky, far, hall, stage, near, air],
});
