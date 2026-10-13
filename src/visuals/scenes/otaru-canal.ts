// A northern harbour canal on a snowy evening, seen straight down its length: old stone warehouses with arched
// windows line the water, gas lamps and little snow lanterns glow along the walk, candles float, and it snows.
import { type Ctx, fillRect } from 'mojipx';
import { bayer, cached, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { colorKey, drawGlow, wrap } from './batch-1-helpers.ts';
import { isDark, mixHex, pixelLayer } from './batch-5-helpers.ts';
import { lightStreak, snowfall } from './batch-6-helpers.ts';
import { skyBase } from './batch-9-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sky3'
  | 'star'
  | 'stone'
  | 'stoneLit'
  | 'stoneLo'
  | 'roof'
  | 'snow'
  | 'snowLit'
  | 'snowLo'
  | 'win'
  | 'winLo'
  | 'lampHi'
  | 'glow'
  | 'water'
  | 'waterFar'
  | 'ink'
  | 'fog';

// ---- the world: a canal seen from its bank, in one-point perspective ----

/**
 * Screen: the horizon row, the vanishing column and the focal length in pixels. World (in metres-ish): the eye's
 * height over the water, the canal's half-widths to the right wall and to the left walk's edge, and the walk's width.
 */
type World = {
  readonly hz: number;
  readonly vx: number;
  readonly F: number;
  readonly eye: number;
  readonly right: number;
  readonly left: number;
  readonly walk: number;
};

const FAR = 70;

const worldOf = (f: Frame): World =>
  f.w > f.h
    ? { hz: Math.round(f.h * 0.42), vx: Math.round(f.w * 0.44), F: f.h * 0.85, eye: 3, right: 6, left: 5.5, walk: 4 }
    : { hz: Math.round(f.h * 0.42), vx: Math.round(f.w * 0.48), F: f.h * 0.5, eye: 3, right: 3.2, left: 3, walk: 2.6 };

/** A warehouse along one bank: where it starts and ends down the canal, its wall height and a seed for its windows. */
type Store = { readonly z0: number; readonly z1: number; readonly hw: number; readonly seed: number };

const storesOf = (seed: number, low: number): readonly Store[] => {
  const out: Store[] = [];
  for (let z = 2, i = 0; z < FAR; i++) {
    const len = 5 + rand(i, seed) * 5;
    out.push({ z0: z, z1: z + len, hw: low + rand(i, seed + 1) * 1.6, seed: seed * 100 + i });
    z += len + 0.5 + rand(i, seed + 2) * 1.5;
  }
  return out;
};

const RIGHT_STORES = storesOf(3, 5);
const LEFT_STORES = storesOf(7, 4.2);

const storeAt = (stores: readonly Store[], z: number): Store | undefined => stores.find((s) => z >= s.z0 && z < s.z1);

/** What one screen column looks at: the depth of the wall it crosses, that wall's warehouse, and its rows. */
type Column = {
  readonly x: number;
  readonly z: number;
  readonly store: Store | undefined;
  /** The wall's foot (on the water on the right, on the walk on the left), and the walk's water edge. */
  readonly foot: number;
  readonly edge: number;
};

const columnOf = (w: World, x: number): Column => {
  const off = x + 0.5 - w.vx;
  if (off >= 0) {
    const z = (w.F * w.right) / Math.max(0.5, off);
    return { x, z, store: storeAt(RIGHT_STORES, z), foot: w.hz + (off * w.eye) / w.right, edge: w.hz + (off * w.eye) / w.right };
  }
  const z = (w.F * (w.left + w.walk)) / -off;
  return { x, z, store: storeAt(LEFT_STORES, z), foot: w.hz + (-off * w.eye) / (w.left + w.walk), edge: w.hz + (-off * w.eye) / w.left };
};

const columns = new Map<string, readonly Column[]>();
const columnsOf = (f: Frame): readonly Column[] =>
  cached(columns, 8, `${f.w}x${f.h}`, () => Array.from({ length: f.w }, (_, x) => columnOf(worldOf(f), x)));

// ---- the warehouse walls ----

/** The height on the wall plane of a row in a column. */
const heightAt = (w: World, col: Column, y: number): number => w.eye - ((y + 0.5 - w.hz) * col.z) / w.F;

// Arched windows on the upper floor and doors or shop windows below, every couple of metres; most are lit.
const windowAt = (c: Colors<K>, s: Store, z: number, h: number): string | null => {
  const k = Math.floor((z - s.z0 - 0.4) / 1.8);
  const along = z - (s.z0 + 1.3 + k * 1.8);
  if (k < 0 || s.z0 + 1.3 + k * 1.8 > s.z1 - 0.8 || Math.abs(along) > 0.55) return null;
  const upper = h > 2.6;
  const top = (upper ? 3.9 : 2) + 0.25 * (1 - (along / 0.55) ** 2);
  const bottom = upper ? 2.85 : 0.45;
  if (h < bottom || h > top) return null;
  if (Math.abs(along) > 0.42 || h < bottom + 0.12 || h > top - 0.12) return c.stoneLit;
  return rand(s.seed + k, upper ? 1 : 2) < 0.68 ? c.win : c.winLo;
};

// Stone in courses half a metre high, each block a metre long, the joints staggered course by course.
const masonry = (c: Colors<K>, col: Column, z: number, h: number, pixel: number): string => {
  const course = Math.floor(h / 0.5);
  if (col.z < 18 && h - course * 0.5 < pixel) return c.stoneLo;
  const joint = (z + (course % 2) * 0.5) % 1;
  if (col.z < 10 && joint < (col.z * col.z) / 4000 + 0.03) return c.stoneLo;
  return h < 0.35 ? c.stoneLo : c.stone;
};

const roofAt = (c: Colors<K>, s: Store, h: number): string | null => {
  const up = h - s.hw;
  if (up < 0.15) return c.ink;
  if (up < 0.55) return c.roof;
  if (up < 1.1) return up < 0.75 ? c.snowLo : c.snowLit;
  return null;
};

const wallPixel = (c: Colors<K>, w: World, col: Column, y: number): string | null => {
  const s = col.store;
  if (y + 0.5 > col.foot || col.z > FAR) return null;
  const h = heightAt(w, col, y);
  if (!s) return h < 3.6 ? c.stoneLo : null;
  if (h > s.hw) return roofAt(c, s, h);
  const z = col.z;
  const shade = windowAt(c, s, z, h) ?? masonry(c, col, z, h, col.z / w.F);
  return z > 30 && bayer(col.x, y) < (z - 30) / 40 ? c.fog : shade;
};

// ---- the walk, the water and the far end ----

const walkPixel = (c: Colors<K>, w: World, col: Column, y: number): string | null => {
  if (col.x + 0.5 >= w.vx || y + 0.5 <= col.foot || y + 0.5 > col.edge) return null;
  const z = (w.F * w.eye) / (y + 0.5 - w.hz);
  const x = ((col.x + 0.5 - w.vx) * z) / w.F;
  if (x > -w.left - 0.35) return c.stoneLit;
  return rand(col.x * 31 + y, 5) < 0.08 ? c.snowLo : c.snow;
};

const waterPixel = (c: Colors<K>, w: World, col: Column, y: number): string => {
  const mirror = Math.round(2 * col.foot - y - 1);
  const seen = wallPixel(c, w, col, mirror);
  const z = (w.F * w.eye) / Math.max(0.5, y + 0.5 - w.hz);
  const base = (Math.min(1, z / 40) > bayer(col.x, y) ? c.waterFar : c.water) as string;
  return seen ? mixHex(seen, c.water, 0.5) : base;
};

const isWater = (w: World, col: Column, y: number): boolean => y + 0.5 > col.edge && y > w.hz + (w.F * w.eye) / FAR;

const solidLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement => {
  const w = worldOf(f);
  const cols = columnsOf(f);
  return pixelLayer(`otaru-solid:${colorKey(c)}`, f.w, f.h, (x, y) => {
    const col = cols[x] as Column;
    if (isWater(w, col, y)) return null;
    return wallPixel(c, w, col, y) ?? walkPixel(c, w, col, y);
  });
};

const waterLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement => {
  const w = worldOf(f);
  const cols = columnsOf(f);
  return pixelLayer(`otaru-water:${colorKey(c)}`, f.w, f.h, (x, y) => {
    const col = cols[x] as Column;
    return isWater(w, col, y) ? waterPixel(c, w, col, y) : null;
  });
};

// The far end: the next bridge across the canal and the town's lit windows beyond it.
const farEnd = (ctx: Ctx, f: Frame, w: World, c: Colors<K>): void => {
  const deck = Math.round(w.hz + (w.F * (w.eye - 2)) / FAR);
  const base = Math.round(w.hz + (w.F * w.eye) / FAR) + 1;
  for (let i = 0; i < 14; i++) {
    const bx = Math.round(w.vx - 26 + i * 4 + rand(i, 21) * 3);
    const bh = 3 + Math.round(rand(i, 22) * 9);
    fillRect(ctx, c.stoneLo, bx, deck - bh, 4, bh);
    if (rand(i, 23) < 0.7) fillRect(ctx, c.win, bx + 1, deck - bh + 2, 1, 1);
  }
  fillRect(ctx, c.stoneLo, 0, deck, f.w, base - deck);
  fillRect(ctx, c.win, Math.round(w.vx - 12), deck, 24, 1);
};

// ---- lights ----

/** A world point on screen, with the depth it lies at and the pixels per metre there. */
type Seen = { readonly x: number; readonly y: number; readonly z: number; readonly s: number };

// A point on the canal's world (across, height, depth) on screen, with pixels per metre there.
const project = (w: World, across: number, up: number, z: number): Seen => ({
  x: w.vx + (w.F * across) / z,
  y: w.hz + (w.F * (w.eye - up)) / z,
  z,
  s: w.F / z,
});

const gasLamp = (ctx: Ctx, f: Frame, w: World, c: Colors<K>, z: number): void => {
  const base = project(w, -w.left - 0.6, 0, z);
  if (base.x < -20 || base.x > f.w + 20) return;
  const head = project(w, -w.left - 0.6, 3, z);
  const post = Math.max(1, Math.round(base.s * 0.1));
  const box = Math.max(3, Math.round(base.s * 0.4));
  const flick = 0.5 + 0.08 * rand(Math.floor(f.t * 7), Math.round(z)) + f.kick * 0.15;
  drawGlow(ctx, c.glow, head.x, head.y, Math.min(30, Math.round(base.s * 1.6)), Math.min(26, Math.round(base.s * 1.4)), flick);
  fillRect(ctx, c.ink, Math.round(base.x - post / 2), Math.round(head.y), post, Math.round(base.y - head.y));
  fillRect(ctx, c.ink, Math.round(head.x - box / 2) - 1, Math.round(head.y - box) - 1, box + 2, box + 2);
  fillRect(ctx, c.lampHi, Math.round(head.x - box / 2), Math.round(head.y - box), box, box);
  fillRect(ctx, c.ink, Math.round(head.x - box / 2) - 1, Math.round(head.y - box) - 2, box + 2, 1);
  const mirror = project(w, -w.left - 0.6, -3, z);
  lightStreak(ctx, f, Math.round(mirror.x), Math.round(mirror.y), Math.min(40, Math.round(base.s * 2.5)), c.glow);
};

// Little mounds of snow, each hollowed round a candle, all along the water's edge.
const snowLantern = (ctx: Ctx, f: Frame, w: World, c: Colors<K>, z: number, i: number): void => {
  const p = project(w, -w.left - 0.2, 0, z);
  if (p.x < -6 || p.x > f.w + 6) return;
  const half = Math.max(1, Math.round(p.s * 0.2));
  const tall = Math.max(1, Math.round(p.s * 0.32));
  drawGlow(ctx, c.glow, p.x, p.y - tall / 2, Math.min(14, Math.round(p.s * 0.8)), Math.min(10, Math.round(p.s * 0.6)), 0.45);
  fillRect(ctx, c.snowLit, Math.round(p.x - half), Math.round(p.y - tall) + 1, half * 2 + 1, tall - 1);
  fillRect(ctx, c.snowLit, Math.round(p.x - half) + 1, Math.round(p.y - tall), Math.max(1, half * 2 - 1), 1);
  const lit = rand(Math.floor(f.t * 5), i) < 0.85 ? c.win : c.lampHi;
  if (p.s > 8) lightStreak(ctx, f, Math.round(p.x), Math.round(p.y + tall), Math.min(24, Math.round(p.s)), c.glow);
  fillRect(
    ctx,
    lit,
    Math.round(p.x),
    Math.round(p.y - Math.max(1, tall * 0.6)),
    Math.max(1, Math.round(half * 0.7)),
    Math.max(1, Math.round(tall * 0.4)),
  );
};

// Glass floats with candles in them, bobbing on the water and drifting slowly toward us.
const floatingCandle = (ctx: Ctx, f: Frame, w: World, c: Colors<K>, i: number): void => {
  const z = 2.5 + wrap(rand(i, 41) * 34 - f.t * 0.25, 34);
  const p = project(w, -w.left + 0.8 + rand(i, 42) * (w.left + w.right - 1.6), 0, z);
  const y = Math.round(p.y + Math.sin(f.t * 1.5 + i) * 0.6);
  const size = p.s > 12 ? 2 : 1;
  drawGlow(ctx, c.glow, p.x, y, Math.min(10, Math.round(p.s * 0.6) + 2), Math.min(6, Math.round(p.s * 0.3) + 1), 0.5);
  fillRect(ctx, c.lampHi, Math.round(p.x), y - size + 1, size, size);
  fillRect(ctx, c.glow, Math.round(p.x), y + 1, size, size);
};

// ---- layers ----

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const w = worldOf(f);
  skyBase(ctx, f, { bottom: w.hz + 2, stops: [c.sky0, c.sky1, c.sky2, c.sky3], stars: isDark(c.sky1) ? [c.star, c.sky3] : null, seed: 47 });
  farEnd(ctx, f, w, c);
};

// The water ripples sideways row by row, more toward us; the banks are drawn over its edges.
const canal = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const w = worldOf(f);
  const layer = waterLayer(f, c);
  fillRect(ctx, c.water, 0, w.hz, f.w, f.h - w.hz);
  for (let y = w.hz; y < f.h; y++) {
    const dx = Math.round(Math.sin(y * 0.9 + f.t * 2.2) * (0.3 + (1.2 * (y - w.hz)) / (f.h - w.hz)));
    ctx.drawImage(layer, 0, y, f.w, 1, dx, y, f.w, 1);
  }
  for (let i = 0; i < 22; i++) floatingCandle(ctx, f, w, c, i);
};

const banks = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const w = worldOf(f);
  ctx.drawImage(solidLayer(f, c), 0, 0);
  for (let k = 26; k >= 0; k--) snowLantern(ctx, f, w, c, 2.5 + k * 1.5, k);
  for (let z = 50; z >= 3; z -= 6) gasLamp(ctx, f, w, c, z);
};

const weather = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  snowfall(ctx, f, c.snowLit, Math.round((f.w * f.h) / 240), 59);
};

export const otaruCanal = defineScene<K>({
  id: 'otaru-canal',
  title: 'Lantern Canal',
  mood: { valence: -0.2, energy: -0.6 },
  styles: ['snowfall', 'lofi-loop', 'town-waltz', 'starlit-dream', 'showa-ballad', 'bossa-cafe'],
  variants: [
    {
      // Blue hour in deep winter: the lamps just lit, the snow lanterns glowing along the edge.
      mood: { valence: -0.15, energy: -0.6 },
      colors: {
        sky0: '#121a44',
        sky1: '#24306e',
        sky2: '#46559a',
        sky3: '#7a7cb4',
        star: '#e4e8ff',
        stone: '#5a5e7e',
        stoneLit: '#8a8aa8',
        stoneLo: '#383a5a',
        roof: '#2a2a44',
        snow: '#a4b0d8',
        snowLit: '#e2e8ff',
        snowLo: '#6c78a8',
        win: '#ffc46a',
        winLo: '#2a2238',
        lampHi: '#fff4d0',
        glow: '#ffae52',
        water: '#141a3c',
        waterFar: '#3a4478',
        ink: '#0e0e1e',
        fog: '#4a5288',
      },
    },
    {
      // Dusk: a rose sky over the warehouses and the first lights coming on.
      mood: { valence: 0.15, energy: -0.45 },
      colors: {
        sky0: '#3a3a78',
        sky1: '#7a5a96',
        sky2: '#d07e96',
        sky3: '#f6b49a',
        star: '#ffe8d8',
        stone: '#7a6a7e',
        stoneLit: '#ac94a0',
        stoneLo: '#4a3e56',
        roof: '#3a2e46',
        snow: '#d4c4dc',
        snowLit: '#fff0f0',
        snowLo: '#a08eb4',
        win: '#ffcc78',
        winLo: '#3a2a3e',
        lampHi: '#fff6dc',
        glow: '#ffb466',
        water: '#2e2852',
        waterFar: '#8a6a96',
        ink: '#1a1222',
        fog: '#a07a9e',
      },
    },
    {
      // The night of the snow-light festival: black sky, stars, every lantern burning.
      mood: { valence: -0.5, energy: -0.25 },
      colors: {
        sky0: '#03050f',
        sky1: '#080e26',
        sky2: '#121a3c',
        sky3: '#22284e',
        star: '#f4f0e0',
        stone: '#3e3e56',
        stoneLit: '#6e6a80',
        stoneLo: '#24243a',
        roof: '#16162a',
        snow: '#6a74a0',
        snowLit: '#c8d0f0',
        snowLo: '#444c7a',
        win: '#ffb850',
        winLo: '#1a1426',
        lampHi: '#fff0c0',
        glow: '#ff9e3e',
        water: '#05081a',
        waterFar: '#1a2048',
        ink: '#05050c',
        fog: '#262c52',
      },
    },
  ],
  layers: [sky, canal, banks, weather],
});
