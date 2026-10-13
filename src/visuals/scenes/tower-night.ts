// A red-and-white lattice broadcast tower lit amber over the night city: the bay's suspension bridge strung with
// lights behind it, an elevated expressway in front streaming headlights and tail lights, and red beacons on the beat.
import { type Ctx, fillRect } from 'mojipx';
import { bayer, fillColumns, frac, pixelLine, rand, ridgeNoise } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { colorKey, drawGlow, fillDither, wrap } from './batch-1-helpers.ts';
import { isDark, pixelLayer } from './batch-5-helpers.ts';
import { frameLayer, lightStreak } from './batch-6-helpers.ts';
import { type Plan, planOf, skyBase, through } from './batch-9-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sky3'
  | 'star'
  | 'peak'
  | 'peakSnow'
  | 'cityFar'
  | 'city'
  | 'cityLo'
  | 'win'
  | 'winDim'
  | 'bandA'
  | 'bandB'
  | 'bandLo'
  | 'edge'
  | 'glow'
  | 'cable'
  | 'water'
  | 'road'
  | 'roadLo'
  | 'head'
  | 'tail'
  | 'beacon'
  | 'ink';

// ---- layout ----

type Spot = 'horizon' | 'towerX' | 'towerTop' | 'towerBase' | 'bridgeL' | 'bridgeR' | 'bridgeDeck' | 'pylon' | 'cityTop' | 'road' | 'peakX';
type Layout = Readonly<Record<Spot, number>>;

const WIDE: Plan<Spot> = {
  horizon: ['h', 0.6],
  towerX: ['w', 0.33],
  towerTop: ['h', 0.04],
  towerBase: ['h', 0.8],
  bridgeL: ['w', 0.56],
  bridgeR: ['w', 1.02],
  bridgeDeck: ['h', 0.62],
  pylon: ['h', 0.12],
  cityTop: ['h', 0.62],
  road: ['h', 0.8],
  peakX: ['w', 0.74],
};

const TALL: Plan<Spot> = {
  horizon: ['h', 0.62],
  towerX: ['w', 0.46],
  towerTop: ['h', 0.05],
  towerBase: ['h', 0.7],
  bridgeL: ['w', 0.5],
  bridgeR: ['w', 1.3],
  bridgeDeck: ['h', 0.635],
  pylon: ['h', 0.06],
  cityTop: ['h', 0.62],
  road: ['h', 0.82],
  peakX: ['w', 0.2],
};

const layoutOf = (f: Frame): Layout => planOf(f, WIDE, TALL);

// The colors tell the hour: a light sky near the horizon is dusk, when the mountain shows against the afterglow.
const duskOf = (c: Colors<K>): boolean => !isDark(c.sky2);

// ---- the tower ----

// Half-width as a share of the height, from the antenna tip (0) to the feet (1): a mast, the small upper deck,
// a slender shaft, the broad main deck, then legs spreading in a concave sweep.
const SHAFT: readonly (readonly [number, number])[] = [
  [0, 0.003],
  [0.19, 0.006],
  [0.23, 0.012],
  [0.53, 0.032],
  [0.59, 0.038],
  [0.7, 0.056],
  [0.8, 0.09],
  [0.9, 0.14],
  [1, 0.2],
];

const UPPER_DECK: readonly [number, number] = [0.19, 0.225];
const MAIN_DECK: readonly [number, number] = [0.525, 0.585];

/** The tower's axis, its tip, its height, and the half-width of the box it is painted in. */
type Tower = { readonly cx: number; readonly top: number; readonly h: number; readonly reach: number };

const towerOf = (m: Layout): Tower => {
  const h = m.towerBase - m.towerTop;
  return { cx: m.towerX, top: m.towerTop, h, reach: Math.ceil(h * 0.21) };
};

const within = (u: number, span: readonly [number, number]): boolean => u >= span[0] && u < span[1];

const halfAt = (t: Tower, u: number): number => {
  if (within(u, UPPER_DECK)) return t.h * 0.024;
  if (within(u, MAIN_DECK)) return t.h * 0.07;
  return t.h * through(SHAFT, u);
};

// The decks: rows of lit windows between dark bands.
const deckTone = (c: Colors<K>, x: number, y: number, top: number): string => {
  const row = y - top;
  if (row % 4 === 0) return c.bandLo;
  return x % 2 === 0 ? c.win : c.edge;
};

// The lattice: bright edges and crossed braces in alternating red and white bands, the sky glimpsed between them.
const latticeTone = (c: Colors<K>, t: Tower, x: number, y: number, u: number): string | null => {
  const dx = x - t.cx;
  const hw = halfAt(t, u);
  if (Math.abs(dx) > hw + 0.5) return null;
  const band = Math.floor(u * 22) % 2 === 0 ? c.bandA : c.bandB;
  if (u < UPPER_DECK[0]) return Math.floor(y / 3) % 2 === 0 ? c.bandA : c.bandB;
  if (u > 0.8 && Math.abs(dx) < hw * 0.6 * Math.sqrt((u - 0.8) / 0.2)) return null;
  if (Math.abs(dx) > hw - 1) return dx < 0 ? c.edge : band;
  if ((dx + y + 400) % 5 === 0 || (dx - y + 400) % 5 === 0) return band;
  return bayer(x, y) < 0.3 ? c.bandLo : null;
};

const towerPixel = (c: Colors<K>, t: Tower, x: number, y: number): string | null => {
  const u = (y - t.top) / t.h;
  if (within(u, UPPER_DECK) || within(u, MAIN_DECK)) {
    if (Math.abs(x - t.cx) > halfAt(t, u)) return null;
    return deckTone(c, x, y, Math.round(t.top + (within(u, MAIN_DECK) ? MAIN_DECK[0] : UPPER_DECK[0]) * t.h));
  }
  return latticeTone(c, t, x, y, u);
};

const towerLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement => {
  const t = towerOf(layoutOf(f));
  const reach = Math.ceil(t.h * 0.21);
  return pixelLayer(`tower:${t.cx}:${t.top}:${t.h}:${colorKey(c)}`, reach * 2 + 1, t.h, (x, y) =>
    towerPixel(c, t, x + t.cx - reach, y + t.top),
  );
};

// ---- the far view: a mountain at dusk, the bay and its suspension bridge ----

const paintPeak = (g: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const half = f.w * (f.w > f.h ? 0.16 : 0.3);
  const tall = half * 0.42;
  fillColumns(g, f.w, m.horizon + 1, c.peak, (x) => {
    const u = Math.abs(x - m.peakX) / half;
    return u > 1 ? m.horizon + 1 : m.horizon - tall * (1 - u) ** 1.3 - (u < 0.12 ? -1 : 0);
  });
  fillColumns(g, f.w, m.horizon + 1, c.peakSnow, (x) => {
    const u = Math.abs(x - m.peakX) / half;
    return u > 0.28 ? m.horizon + 1 : m.horizon - tall * (1 - u) ** 1.3;
  });
  fillColumns(g, f.w, m.horizon + 1, c.peak, (x) => {
    const u = Math.abs(x - m.peakX) / half;
    return u > 0.28 ? m.horizon + 1 : m.horizon - tall * (1 - 0.28) ** 1.3 - ridgeNoise(x / 2, 3) * 3 + 1;
  });
};

// Two towers, a main cable sagging between them and running down to the anchorages, the deck with its lamps.
const paintBridge = (g: Ctx, m: Layout, c: Colors<K>): void => {
  const span = m.bridgeR - m.bridgeL;
  const p1 = Math.round(m.bridgeL + span * 0.28);
  const p2 = Math.round(m.bridgeL + span * 0.72);
  const top = m.bridgeDeck - m.pylon;
  const sag = (x: number): number => top + 1 + (m.pylon - 3) * (1 - (((x - p1) / (p2 - p1)) * 2 - 1) ** 2);
  for (let x = p1; x <= p2; x++) fillRect(g, c.cable, x, Math.round(sag(x)), 1, 1);
  pixelLine(g, p1, top + 1, m.bridgeL, m.bridgeDeck - 1, c.cable);
  pixelLine(g, p2, top + 1, m.bridgeR, m.bridgeDeck - 1, c.cable);
  for (let x = p1 + 3; x < p2 - 2; x += 3) fillRect(g, c.cable, x, Math.round(sag(x)), 1, Math.max(0, m.bridgeDeck - Math.round(sag(x))));
  for (const p of [p1, p2]) {
    fillRect(g, c.edge, p - 2, top, 1, m.bridgeDeck - top + 4);
    fillRect(g, c.edge, p + 1, top, 1, m.bridgeDeck - top + 4);
    for (let y = top; y < m.bridgeDeck; y += 4) fillRect(g, c.edge, p - 2, y, 4, 1);
  }
  fillRect(g, c.road, m.bridgeL, m.bridgeDeck, span, 2);
  for (let x = m.bridgeL; x < m.bridgeR; x += 3) fillRect(g, c.win, x, m.bridgeDeck, 1, 1);
};

const farLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('tower-far', f, c, (g) => {
    const m = layoutOf(f);
    if (duskOf(c)) paintPeak(g, f, m, c);
    fillRect(g, c.water, 0, m.horizon, f.w, f.h - m.horizon);
    for (let y = m.horizon + 2; y < m.road; y += 3) fillDither(g, c.sky3, 0.25, 0, y, f.w, 1);
    paintBridge(g, m, c);
  });

// ---- the city ----

const paintBuilding = (g: Ctx, c: Colors<K>, x: number, w: number, top: number, bottom: number, near: boolean): void => {
  fillRect(g, near ? c.city : c.cityFar, x, top, w, bottom - top);
  fillRect(g, c.cityLo, x + w - 1, top, 1, bottom - top);
  const step = near ? 3 : 2;
  for (let y = top + 2; y < bottom - 1; y += step)
    for (let wx = x + 1; wx < x + w - 1; wx += 2) {
      const r = rand(wx * 31 + y, near ? 5 : 6);
      if (r < 0.45) fillRect(g, r < 0.12 ? c.win : c.winDim, wx, y, 1, 1);
    }
};

/** A row of buildings standing on `bottom`, the tallest reaching `top`. */
const paintRow = (g: Ctx, f: Frame, c: Colors<K>, span: readonly [number, number], near: boolean, seed: number): void => {
  const [top, bottom] = span;
  for (let x = -2, i = 0; x < f.w; i++) {
    const w = (near ? 9 : 5) + Math.floor(rand(i, seed) * (near ? 14 : 8));
    const h = (bottom - top) * (0.25 + 0.75 * rand(i, seed + 1) ** 1.6);
    paintBuilding(g, c, x, w, Math.round(bottom - h), bottom, near);
    x += w + (rand(i, seed + 2) < 0.25 ? 2 : 0);
  }
};

const cityLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('tower-city', f, c, (g) => {
    const m = layoutOf(f);
    paintRow(g, f, c, [m.cityTop, m.road + 2], false, 11);
  });

const nearCityLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('tower-near-city', f, c, (g) => {
    const m = layoutOf(f);
    paintRow(g, f, c, [Math.round(m.road - (m.road - m.cityTop) * 0.55), m.road + 4], true, 13);
  });

// ---- the expressway ----

// The expressway seen a little from above: its four-lane deck between barrier walls, the side of the deck, and
// T-shaped piers down to the dark street.
const paintExpressway = (g: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const deck = m.road;
  fillRect(g, c.ink, 0, deck + 14, f.w, f.h - deck - 14);
  for (let x = 12; x < f.w; x += 46) {
    fillRect(g, c.roadLo, x, deck + 14, 8, f.h - deck - 14);
    fillRect(g, c.road, x, deck + 14, 2, f.h - deck - 14);
    fillRect(g, c.roadLo, x - 5, deck + 13, 18, 3);
  }
  fillRect(g, c.road, 0, deck - 2, f.w, 2);
  fillRect(g, c.roadLo, 0, deck, f.w, 10);
  fillRect(g, c.cityLo, 0, deck + 5, f.w, 1);
  fillRect(g, c.road, 0, deck + 10, f.w, 2);
  fillRect(g, c.roadLo, 0, deck + 12, f.w, 2);
  fillRect(g, c.ink, 0, deck + 14, f.w, 1);
};

const roadLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('tower-road', f, c, (g) => paintExpressway(g, f, layoutOf(f), c));

type Lane = { readonly y: number; readonly dir: 1 | -1; readonly color: string; readonly seed: number };

// Light trails: a faint continuous line for the long exposure, and the bright cars themselves streaking along.
const lane = (ctx: Ctx, f: Frame, l: Lane, speed: number): void => {
  fillDither(ctx, l.color, 0.25, 0, l.y, f.w, 1);
  const span = f.w + 60;
  for (let i = 0; i < Math.round(f.w / 18); i++) {
    const len = 10 + Math.floor(rand(i, l.seed) * 18);
    const x = wrap(rand(i, l.seed + 1) * span + f.t * speed * (0.8 + 0.4 * rand(i, l.seed + 2)), span) - 30;
    const sx = Math.round(l.dir > 0 ? x : f.w - x);
    const tailX = l.dir > 0 ? sx - len : sx;
    fillDither(ctx, l.color, 0.5, tailX, l.y, len, 1);
    fillRect(ctx, l.color, l.dir > 0 ? sx - Math.round(len / 3) : sx, l.y, Math.round(len / 3), 1);
    fillRect(ctx, l.color, l.dir > 0 ? sx - 2 : sx, l.y - 1, 2, 1);
  }
};

// ---- per-frame layers ----

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  skyBase(ctx, f, { bottom: m.horizon + 1, stops: [c.sky0, c.sky1, c.sky2, c.sky3], stars: duskOf(c) ? null : [c.star, c.sky3], seed: 79 });
  ctx.drawImage(farLayer(f, c), 0, 0);
  for (let x = Math.round(f.w * 0.6); x < f.w; x += 14)
    lightStreak(ctx, f, x, m.bridgeDeck + 3, Math.round((m.road - m.bridgeDeck) * 0.5), c.win);
};

// The tower glows on the kick; the beacons on its tip and its decks blink on the beat.
const tower = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  const t = towerOf(m);
  drawGlow(ctx, c.glow, t.cx, t.top + t.h * 0.66, Math.round(t.h * 0.2), Math.round(t.h * 0.36), 0.14 + f.kick * 0.14, 4);
  ctx.drawImage(cityLayer(f, c), 0, 0);
  ctx.drawImage(towerLayer(f, c), t.cx - t.reach, t.top);
  if (frac(f.beat) < 0.4) {
    fillRect(ctx, c.beacon, t.cx, t.top - 1, 1, 2);
    for (const u of [UPPER_DECK[0], MAIN_DECK[0]]) {
      const y = Math.round(t.top + u * t.h) - 1;
      const hw = Math.round(halfAt(t, u + 0.001));
      fillRect(ctx, c.beacon, t.cx - hw, y, 1, 1);
      fillRect(ctx, c.beacon, t.cx + hw, y, 1, 1);
    }
  }
};

const city = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  ctx.drawImage(nearCityLayer(f, c), 0, 0);
  for (let i = 0; i < 6; i++) {
    if ((Math.floor(f.beat) + i) % 2 === 1) continue;
    const x = Math.round(rand(i, 91) * f.w);
    fillRect(ctx, c.beacon, x, Math.round(m.cityTop + (m.road - m.cityTop) * (0.2 + rand(i, 92) * 0.4)), 1, 1);
  }
};

const road = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  ctx.drawImage(roadLayer(f, c), 0, 0);
  const speed = 40 + f.energy * 50;
  lane(ctx, f, { y: m.road + 2, dir: -1, color: c.head, seed: 101 }, speed);
  lane(ctx, f, { y: m.road + 4, dir: -1, color: c.head, seed: 102 }, speed * 1.15);
  lane(ctx, f, { y: m.road + 7, dir: 1, color: c.tail, seed: 103 }, speed * 0.9);
  lane(ctx, f, { y: m.road + 9, dir: 1, color: c.tail, seed: 104 }, speed);
  lane(ctx, f, { y: f.h - 5, dir: 1, color: c.winDim, seed: 105 }, speed * 0.4);
  for (let x = 6; x < f.w; x += 23) {
    drawGlow(ctx, c.glow, x, m.road - 6, 6, 5, 0.45);
    fillRect(ctx, c.edge, x, m.road - 9, 2, 1);
    fillRect(ctx, c.roadLo, x, m.road - 8, 1, 6);
  }
};

export const towerNight = defineScene<K>({
  id: 'tower-night',
  title: 'Tower Lights',
  mood: { valence: 0.1, energy: 0.3 },
  styles: ['city-lights', 'neon-rush', 'nineties-pop', 'lofi-loop', 'city-groove', 'jungle-run', 'vocal-rock'],
  variants: [
    {
      // A winter night: the tower glowing amber, the bridge strung with white lights.
      mood: { valence: 0.15, energy: 0.45 },
      colors: {
        sky0: '#060a22',
        sky1: '#101a44',
        sky2: '#262a5e',
        sky3: '#4a3466',
        star: '#e8ecff',
        peak: '#1a1e44',
        peakSnow: '#2a2e58',
        cityFar: '#141a3a',
        city: '#0e1230',
        cityLo: '#080a1e',
        win: '#ffe6a0',
        winDim: '#4a4870',
        bandA: '#ff8a2a',
        bandB: '#ffc860',
        bandLo: '#8a3418',
        edge: '#fff0c0',
        glow: '#ff9a3a',
        cable: '#e8ecff',
        water: '#0a0e2a',
        road: '#4a4e6e',
        roadLo: '#262a46',
        head: '#fff4d0',
        tail: '#ff3a3a',
        beacon: '#ff2a2a',
        ink: '#04050e',
      },
    },
    {
      // Winter dusk: the mountain dark against the afterglow, the city's lights coming on.
      mood: { valence: 0.35, energy: -0.05 },
      colors: {
        sky0: '#2a3a7a',
        sky1: '#6a5a9a',
        sky2: '#e08a7a',
        sky3: '#ffc890',
        star: '#ffffff',
        peak: '#3a3060',
        peakSnow: '#8a7aa8',
        cityFar: '#4a3e6a',
        city: '#2e2850',
        cityLo: '#1e1a3a',
        win: '#ffe0a0',
        winDim: '#6a5a80',
        bandA: '#e8502e',
        bandB: '#f4e6d8',
        bandLo: '#7a2a2e',
        edge: '#ffd8a8',
        glow: '#ff9a5a',
        cable: '#f4e6f0',
        water: '#4a3a6a',
        road: '#6a5a7e',
        roadLo: '#3a3256',
        head: '#fff4d8',
        tail: '#ff4a4a',
        beacon: '#ff3a3a',
        ink: '#140e22',
      },
    },
    {
      // Past midnight in summer: the tower lit pale and cool, fewer windows, a violet haze over the bay.
      mood: { valence: -0.35, energy: 0.35 },
      colors: {
        sky0: '#05030f',
        sky1: '#100a28',
        sky2: '#22143e',
        sky3: '#3a1e52',
        star: '#f0e8ff',
        peak: '#1a1030',
        peakSnow: '#2a1e44',
        cityFar: '#140e28',
        city: '#0c0a1c',
        cityLo: '#060410',
        win: '#c8e0ff',
        winDim: '#3a3058',
        bandA: '#e8eeff',
        bandB: '#9ab8f0',
        bandLo: '#3a3a78',
        edge: '#ffffff',
        glow: '#7a8aff',
        cable: '#c8d8ff',
        water: '#0a0618',
        road: '#3a3456',
        roadLo: '#1e1a34',
        head: '#e8f0ff',
        tail: '#ff2a5a',
        beacon: '#ff2a4a',
        ink: '#030208',
      },
    },
  ],
  layers: [sky, tower, city, road],
});
