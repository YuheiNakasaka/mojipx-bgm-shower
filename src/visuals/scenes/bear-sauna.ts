// A polar bear with a towel on its head sits on the upper bench of a little wooden sauna, a seal pup beside it; every
// few bars it ladles water onto the hot stones and a cloud of steam billows up to the ceiling. The dial thermometer
// climbs, the sand timer flips, and through the small window the northern sky shows over snow and a frozen lake.
import { type Ctx, drawSprite, fillRect, type Sprite } from 'mojipx';
import { bayer, disc, ditherGradient, frac, memoLayer, noise1, pixelLine, rand, ridgeNoise, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { type Box, colorKey, drawGlow, fillDither, paletteBy, wrap } from './batch-1-helpers.ts';
import { frameLayer, snowfall } from './batch-6-helpers.ts';
import { limb } from './batch-7-helpers.ts';
import { type Plan, planOf } from './batch-9-helpers.ts';
import { type Coat, cloud, egg, type Mark, type Puff, puffOf, rod, sculpt, squashOf, within } from './batch-15-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'star'
  | 'aurora'
  | 'aurora2'
  | 'sun'
  | 'flake'
  | 'snow'
  | 'snowLo'
  | 'lake'
  | 'lakeLit'
  | 'pine'
  | 'wall'
  | 'wallLit'
  | 'wallLo'
  | 'ink'
  | 'bench'
  | 'benchLit'
  | 'benchLo'
  | 'iron'
  | 'ironLit'
  | 'stone'
  | 'stoneLit'
  | 'ember'
  | 'glow'
  | 'steam'
  | 'water'
  | 'fur'
  | 'furLit'
  | 'furLo'
  | 'nose'
  | 'blush'
  | 'towel'
  | 'towelLo'
  | 'stripe'
  | 'seal'
  | 'sealLit'
  | 'sealLo'
  | 'brass'
  | 'red'
  | 'face'
  | 'sand'
  | 'leaf'
  | 'leafLo';

// ---- layout ----

type Spot =
  | 'ceil'
  | 'winX'
  | 'winY'
  | 'winW'
  | 'winH'
  | 'seat'
  | 'step'
  | 'floor'
  | 'bearX'
  | 'sealX'
  | 'sealY'
  | 'bucketX'
  | 'stoveX'
  | 'stoveW'
  | 'stoveTop'
  | 'thermoX'
  | 'thermoY'
  | 'timerX'
  | 'timerY'
  | 'lampX'
  | 'lampY'
  | 'whiskX'
  | 'whiskY';
type Layout = Readonly<Record<Spot, number>>;

const WIDE: Plan<Spot> = {
  ...{ ceil: ['h', 0.05], winX: ['w', 0.04], winY: ['h', 0.13], winW: ['w', 0.27], winH: ['h', 0.32] },
  ...{ seat: ['h', 0.72], step: ['h', 0.86], floor: ['h', 0.94], bearX: ['w', 0.5], sealX: ['w', 0.32], sealY: ['h', 0.72] },
  ...{ bucketX: ['w', 0.6], stoveX: ['w', 0.68], stoveW: ['w', 0.17], stoveTop: ['h', 0.58] },
  ...{ thermoX: ['w', 0.61], thermoY: ['h', 0.22], timerX: ['w', 0.38], timerY: ['h', 0.16] },
  ...{ lampX: ['w', 0.95], lampY: ['h', 0.3], whiskX: ['w', 0.46], whiskY: ['h', 0.08] },
};

const TALL: Plan<Spot> = {
  ...{ ceil: ['h', 0.03], winX: ['w', 0.1], winY: ['h', 0.07], winW: ['w', 0.8], winH: ['h', 0.25] },
  ...{ seat: ['h', 0.66], step: ['h', 0.8], floor: ['h', 0.9], bearX: ['w', 0.4], sealX: ['w', 0.3], sealY: ['h', 0.8] },
  ...{ bucketX: ['w', 0.6], stoveX: ['w', 0.68], stoveW: ['w', 0.27], stoveTop: ['h', 0.595] },
  ...{ thermoX: ['w', 0.6], thermoY: ['h', 0.43], timerX: ['w', 0.14], timerY: ['h', 0.42] },
  ...{ lampX: ['w', 0.86], lampY: ['h', 0.42], whiskX: ['w', 0.36], whiskY: ['h', 0.37] },
};

const layoutOf = (f: Frame): Layout => planOf(f, WIDE, TALL);

// A color equal to the top of the sky switches its part of the view off (no aurora by day, no snow on a clear night).
const shows = (c: Colors<K>, key: K): boolean => c[key] !== c.sky0;

// ---- the room: plank walls, the window frame, two benches, the duckboard floor ----

const PLANK = 7;

const paintPlanks = (g: Ctx, f: Frame, c: Colors<K>, m: Layout): void => {
  for (let y = m.ceil, row = 0; y < m.floor; y += PLANK, row++) {
    fillRect(g, c.wall, 0, y, f.w, PLANK);
    fillRect(g, c.wallLit, 0, y, f.w, 1);
    fillRect(g, c.wallLo, 0, y + PLANK - 1, f.w, 1);
    for (let x = Math.floor(rand(row, 3) * 70); x < f.w; x += 46 + Math.floor(rand(row, x) * 50)) fillRect(g, c.wallLo, x, y, 1, PLANK);
    for (let k = 0; k < f.w / 22; k++) {
      const gx = Math.floor(rand(row * 31 + k, 5) * f.w);
      const gy = y + 2 + Math.floor(rand(row * 31 + k, 6) * (PLANK - 3));
      fillRect(g, rand(k, row) < 0.2 ? c.wallLit : c.wallLo, gx, gy, 2 + Math.floor(rand(row * 31 + k, 7) * 7), 1);
    }
  }
  fillRect(g, c.wallLo, 0, 0, f.w, m.ceil);
  fillRect(g, c.ink, 0, m.ceil - 1, f.w, 1);
  for (let x = 0; x < f.w; x += 9) fillRect(g, c.ink, x, 0, 1, m.ceil - 1);
};

// A deep wooden frame round the glass with a sill below; the glass itself is cut out so the view shows through.
const paintWindow = (g: Ctx, c: Colors<K>, m: Layout): void => {
  const { winX: x, winY: y, winW: w, winH: h } = m;
  fillRect(g, c.ink, x - 5, y - 5, w + 10, h + 10);
  fillRect(g, c.bench, x - 4, y - 4, w + 8, h + 8);
  fillRect(g, c.benchLit, x - 4, y - 4, w + 8, 1);
  fillRect(g, c.benchLit, x - 4, y - 4, 1, h + 8);
  fillRect(g, c.benchLo, x - 1, y - 1, w + 2, h + 2);
  fillRect(g, c.ink, x - 7, y + h + 4, w + 14, 5);
  fillRect(g, c.benchLit, x - 6, y + h + 4, w + 12, 2);
  fillRect(g, c.bench, x - 6, y + h + 6, w + 12, 2);
  g.clearRect(x, y, w, h);
};

// A bench of two slats seen a little from above, with a two-board front.
const paintBench = (g: Ctx, c: Colors<K>, x1: number, top: number): void => {
  fillRect(g, c.ink, 0, top - 6, x1 + 1, 15);
  fillRect(g, c.benchLit, 0, top - 5, x1, 5);
  fillRect(g, c.bench, 0, top - 3, x1, 1);
  fillRect(g, c.bench, 0, top + 1, x1, 7);
  fillRect(g, c.benchLit, 0, top + 1, x1, 1);
  fillRect(g, c.benchLo, 0, top + 4, x1, 1);
  for (let x = 30; x < x1 - 4; x += 61) fillRect(g, c.benchLo, x, top + 1, 1, 7);
};

const paintPosts = (g: Ctx, c: Colors<K>, x1: number, top: number, bottom: number): void => {
  fillRect(g, c.wallLo, 0, top, x1, bottom - top);
  fillDither(g, c.ink, 0.5, 0, top, x1, bottom - top);
  for (let x = 12; x < x1 - 6; x += 52) {
    fillRect(g, c.ink, x - 1, top, 6, bottom - top);
    fillRect(g, c.benchLo, x, top, 4, bottom - top);
  }
};

const paintFloor = (g: Ctx, f: Frame, c: Colors<K>, m: Layout): void => {
  fillRect(g, c.ink, 0, m.floor, f.w, f.h - m.floor);
  for (let y = m.floor + 1, row = 0; y < f.h; y += 4, row++) {
    fillRect(g, row % 2 === 0 ? c.bench : c.benchLo, 0, y, f.w, 3);
    for (let x = Math.floor(rand(row, 9) * 40); x < f.w; x += 40) fillRect(g, c.ink, x, y, 1, 3);
  }
};

// ---- the stove: an iron box on short legs with a fire door, and a cage heaped with stones ----

const stoneBody = (m: Layout): number => m.stoveTop + 14;

// The glass of the fire door, low on the stove's front.
const doorOf = (m: Layout): Box => {
  const top = stoneBody(m);
  const [w, h] = [Math.round(m.stoveW * 0.5), Math.round((m.floor - top) * 0.4)];
  return { x: m.stoveX + Math.round((m.stoveW - w) / 2), y: m.floor - 9 - h, w, h };
};

const paintStoveBody = (g: Ctx, c: Colors<K>, m: Layout): void => {
  const { stoveX: x, stoveW: w, floor } = m;
  const top = stoneBody(m);
  fillRect(g, c.ink, x + 3, floor - 3, 5, 5);
  fillRect(g, c.ink, x + w - 8, floor - 3, 5, 5);
  fillRect(g, c.ink, x, top, w, floor - top - 2);
  fillRect(g, c.iron, x + 1, top + 1, w - 2, floor - top - 4);
  fillRect(g, c.ironLit, x + 1, top + 1, w - 2, 1);
  for (let k = 0; k < 3; k++) {
    fillRect(g, c.ironLit, x + 2 + k * 2, top + 5, 1, floor - top - 10);
    fillRect(g, c.ink, x + w - 3 - k * 2, top + 5, 1, floor - top - 10);
  }
  const d = doorOf(m);
  fillRect(g, c.ink, d.x - 3, d.y - 3, d.w + 6, d.h + 6);
  fillRect(g, c.ironLit, d.x - 2, d.y - 2, d.w + 4, d.h + 4);
  fillRect(g, c.ink, d.x - 1, d.y - 1, d.w + 2, d.h + 2);
  fillRect(g, c.ink, d.x + d.w + 2, d.y + (d.h >> 1) - 1, 4, 3);
  fillRect(g, c.brass, d.x + d.w + 3, d.y + (d.h >> 1), 3, 1);
};

// Flames licking up behind the door's glass over two glowing logs, and their light spilling onto the floor.
const fire = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  const d = doorOf(m);
  const tick = Math.floor(f.t * 9);
  drawGlow(ctx, c.glow, d.x + d.w / 2, m.floor + 2, d.w, 5, 0.35 + 0.1 * rand(tick, 3));
  fillRect(ctx, c.ink, d.x, d.y, d.w, d.h);
  for (let x = 0; x < d.w; x++) {
    const lick = 0.45 + 0.55 * Math.abs(Math.sin(x * 0.9 + f.t * 5)) * (0.6 + 0.4 * rand(tick, x));
    const h = Math.round((d.h - 3) * lick);
    fillRect(ctx, c.red, d.x + x, d.y + d.h - 3 - h, 1, h);
    fillRect(ctx, c.ember, d.x + x, d.y + d.h - 3 - Math.round(h * 0.7), 1, Math.round(h * 0.7));
    fillRect(ctx, c.glow, d.x + x, d.y + d.h - 3 - Math.round(h * 0.35), 1, Math.round(h * 0.35));
  }
  fillRect(ctx, c.benchLo, d.x, d.y + d.h - 3, d.w, 3);
  fillRect(ctx, c.ember, d.x + 1, d.y + d.h - 2, d.w - 2, 1);
  fillRect(ctx, c.face, d.x + 1, d.y + 1, 1, 3);
};

// Stones in rows filling a dome over the stove, embers glowing in the gaps between them.
const paintStones = (g: Ctx, c: Colors<K>, m: Layout): void => {
  const { stoveX: x, stoveW: w, stoveTop: top } = m;
  const base = stoneBody(m);
  const dome = (sx: number): number => base - (base - top) * Math.max(0, 1 - ((sx - x - w / 2) / (w / 2)) ** 2);
  for (let sx = x + 1; sx < x + w - 1; sx++) fillRect(g, c.ink, sx, Math.round(dome(sx)) - 1, 1, base - Math.round(dome(sx)) + 2);
  for (let row = 0; row < 4; row++)
    for (let sx = x + 4 + (row % 2) * 3; sx < x + w - 3; sx += 7) {
      const sy = base - 3 - row * 4;
      if (sy < dome(sx) + 1) continue;
      const r = 3 + Math.floor(rand(sx, row) * 2);
      disc(g, sx, sy, r + 1, () => c.ink);
      disc(g, sx, sy, r, () => c.stone);
      disc(g, sx - 1, sy - 1, r - 2, () => c.stoneLit);
    }
  for (let k = 0; k < w / 3; k++)
    fillRect(g, c.ember, x + 2 + Math.floor(rand(k, 41) * (w - 4)), base - 1 - Math.floor(rand(k, 42) * 6), 1, 1);
  fillRect(g, c.ink, x - 1, base, w + 2, 3);
  fillRect(g, c.ironLit, x, base + 1, w, 1);
  for (let k = 0; k <= 4; k++) fillRect(g, c.ink, x + Math.round(((w - 1) * k) / 4), base - 6, 1, 6);
};

// ---- wall things: the dial thermometer, a birch whisk on its peg, a slatted lamp, the water bucket ----

const DIAL_R = 8;
const dialAngle = (heat: number): number => Math.PI * (0.75 + heat * 1.5);

const paintDial = (g: Ctx, c: Colors<K>, m: Layout): void => {
  const { thermoX: x, thermoY: y } = m;
  fillRect(g, c.ink, x - 1, y - DIAL_R - 4, 3, 4);
  disc(g, x, y, DIAL_R + 1, () => c.ink);
  disc(g, x, y, DIAL_R, (dy) => (dy < -3 ? c.benchLit : c.bench));
  disc(g, x, y, DIAL_R - 2, () => c.face);
  for (let k = 0; k <= 6; k++) {
    const a = dialAngle(k / 6);
    fillRect(g, k >= 5 ? c.red : c.ink, Math.round(x + Math.cos(a) * 5), Math.round(y + Math.sin(a) * 5), 1, 1);
  }
};

// A birch whisk hung on its peg: a tied bundle of twigs whose leaves fan out below the tie.
const paintWhisk = (g: Ctx, c: Colors<K>, m: Layout): void => {
  const { whiskX: x, whiskY: y } = m;
  fillRect(g, c.ink, x - 2, y - 2, 5, 12);
  fillRect(g, c.benchLo, x - 1, y - 1, 3, 10);
  fillRect(g, c.red, x - 2, y + 5, 5, 2);
  for (let k = 0; k < 20; k++) {
    const half = Math.round(6.5 * Math.sin((Math.PI * (k + 2)) / 23) ** 0.8);
    fillRect(g, c.ink, x - half - 1, y + 9 + k, half * 2 + 3, 1);
    fillRect(g, c.leafLo, x - half, y + 9 + k, half * 2 + 1, 1);
  }
  fillRect(g, c.ink, x - 1, y + 29, 3, 1);
  for (let k = 0; k < 34; k++) {
    const ly = y + 10 + Math.floor(rand(k, 52) * 17);
    const half = 5 * Math.sin((Math.PI * (ly - y - 7)) / 23);
    fillRect(g, k % 5 === 0 ? c.benchLo : c.leaf, Math.round(x + (rand(k, 51) * 2 - 1) * half), ly, k % 2 === 0 ? 2 : 1, 1);
  }
};

const paintLamp = (g: Ctx, c: Colors<K>, m: Layout): void => {
  const { lampX: x, lampY: y } = m;
  drawGlow(g, c.wallLit, x, y, 36, 28, 0.55);
  drawGlow(g, c.glow, x, y, 16, 14, 0.4);
  fillRect(g, c.ink, x - 6, y - 8, 13, 17);
  fillRect(g, c.glow, x - 5, y - 7, 11, 15);
  for (let k = 0; k < 5; k++) fillRect(g, k === 0 ? c.benchLit : c.bench, x - 5, y - 7 + k * 3, 11, 2);
};

const BUCKET_W = 15;
const BUCKET_H = 12;

const paintBucket = (g: Ctx, c: Colors<K>, m: Layout): void => {
  const x = m.bucketX - (BUCKET_W >> 1);
  const top = m.seat - 2 - BUCKET_H;
  for (let k = 0; k < BUCKET_H; k++) {
    const inset = Math.floor((k * 2) / BUCKET_H);
    fillRect(g, c.ink, x + inset - 1, top + k, BUCKET_W - inset * 2 + 2, 1);
    fillRect(g, k === 3 || k === 9 ? c.brass : c.bench, x + inset, top + k, BUCKET_W - inset * 2, 1);
  }
  for (let sx = x + 3; sx < x + BUCKET_W - 1; sx += 4) fillRect(g, c.benchLo, sx, top + 1, 1, BUCKET_H - 1);
  fillRect(g, c.benchLit, x + 1, top + 1, 1, BUCKET_H - 2);
  fillRect(g, c.ink, x - 1, top - 1, BUCKET_W + 2, 2);
  fillRect(g, c.water, x + 1, top, BUCKET_W - 2, 1);
  fillRect(g, c.ink, x - 1, m.seat - 2, BUCKET_W + 2, 1);
};

// ---- the view through the window: hills, a dark line of spruce, the frozen lake and the snowy bank ----

const horizonOf = (h: number): number => Math.round(h * 0.6);
const shoreOf = (h: number): number => Math.round(h * 0.82);

const paintHills = (g: Ctx, w: number, h: number, c: Colors<K>): void => {
  const hz = horizonOf(h);
  for (let x = 0; x < w; x++) {
    const top = Math.round(hz - 3 - ridgeNoise(x / 16, 7) * h * 0.16);
    fillRect(g, c.snowLo, x, top, 1, hz - top);
    fillRect(g, c.snow, x, top, 1, 1);
  }
  fillRect(g, c.pine, 0, hz - 1, w, 2);
  for (let x = 1; x < w; x += 2 + Math.floor(rand(x, 8) * 4)) {
    const tall = 3 + Math.floor(rand(x, 9) * h * 0.08);
    for (let k = 0; k < tall; k++) fillRect(g, c.pine, x - (k >> 1), hz - tall + k, (k >> 1) * 2 + 1, 1);
  }
};

const paintIce = (g: Ctx, w: number, h: number, c: Colors<K>): void => {
  const [hz, shore] = [horizonOf(h), shoreOf(h)];
  fillRect(g, c.lake, 0, hz + 1, w, shore - hz - 1);
  for (let k = 0; k < (w * (shore - hz)) / 40; k++) {
    const y = hz + 2 + Math.floor(rand(k, 21) * (shore - hz - 2));
    fillRect(g, c.lakeLit, Math.floor(rand(k, 22) * w), y, 2 + Math.floor(rand(k, 23) * ((y - hz) * 0.8)), 1);
  }
  for (let x = 0; x < w; x++) {
    const top = shore - Math.round(noise1(x / 9, 31) * 3);
    fillRect(g, c.snow, x, top, 1, h - top);
    if (rand(x, 32) < 0.3) fillRect(g, c.snowLo, x, top + 2 + Math.floor(rand(x, 33) * (h - top)), 2, 1);
  }
};

const viewLayer = (c: Colors<K>, w: number, h: number): HTMLCanvasElement =>
  memoLayer(`bear-sauna-view:${w}x${h}:${colorKey(c)}`, w, h, (g) => {
    g.drawImage(ditherGradient(w, horizonOf(h) + 1, [c.sky0, c.sky1, c.sky2]), 0, 0);
    if (shows(c, 'sun')) paintSun(g, w, h, c);
    paintHills(g, w, h, c);
    paintIce(g, w, h, c);
  });

// One ray of the aurora: brightest at its hem, thinning out upward and turning violet toward the top.
const ray = (ctx: Ctx, c: Colors<K>, x: number, hem: number, len: number, glow: number): void => {
  for (let k = 0; k < len; k++) {
    const u = k / len;
    if (bayer(x, hem - k) >= glow * (1.25 - u)) continue;
    fillRect(ctx, u > 0.5 ? c.aurora2 : c.aurora, x, hem - k, 1, 1);
  }
  if (glow > 0.7) fillRect(ctx, c.stripe, x, hem, 1, 1);
};

// A ribbon of aurora across the sky: a wavy hem with rays standing on it, swelling and fading as it drifts, and
// mirrored faintly on the ice.
const aurora = (ctx: Ctx, f: Frame, c: Colors<K>, w: number, h: number): void => {
  const hz = horizonOf(h);
  for (let x = 0; x < w; x++) {
    const glow = Math.min(1, noise1(x / 14 - f.t * 0.3, 62) * 1.3);
    const hem = Math.round(h * 0.4 + Math.sin(x * 0.05 + f.t * 0.3) * h * 0.1 + noise1(x / 9 + f.t * 0.15, 61) * h * 0.06);
    const len = Math.round(h * (0.14 + 0.22 * noise1(x / 2.2 + f.t * 0.6, 63)) * (0.5 + glow * 0.5));
    ray(ctx, c, x, hem, len, glow);
    if (glow > 0.55 && bayer(x, hz) < glow - 0.4) fillRect(ctx, c.aurora, x, hz + 2 + (x % 3), 1, 1);
  }
};

// The low sun of the midnight sun rests on the hills; its road of light shimmers across the ice.
const sunOf = (w: number, h: number): readonly [number, number, number] => [
  Math.round(w * 0.68),
  horizonOf(h) - Math.round(h * 0.13),
  Math.max(5, Math.round(h * 0.08)),
];

const paintSun = (g: Ctx, w: number, h: number, c: Colors<K>): void => {
  const [x, y, r] = sunOf(w, h);
  drawGlow(g, c.sun, x, y, r * 4, r * 3, 0.35);
  disc(g, x, y, r + 1, () => c.sky2);
  disc(g, x, y, r, () => c.sun);
};

const sunRoad = (ctx: Ctx, f: Frame, c: Colors<K>, w: number, h: number): void => {
  const hz = horizonOf(h);
  const [x, , r] = sunOf(w, h);
  for (let k = 2; k < shoreOf(h) - hz; k += 2) {
    const half = Math.round(r * 0.3 + k * 0.25 + Math.sin(f.t * 2 + k) * 1.2);
    fillRect(ctx, c.sun, x - half, hz + k, half * 2 + 1, 1);
  }
};

const outside = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  const [w, h] = [m.winW, m.winH];
  ctx.save();
  ctx.beginPath();
  ctx.rect(m.winX, m.winY, w, h);
  ctx.clip();
  ctx.translate(m.winX, m.winY);
  ctx.drawImage(viewLayer(c, w, h), 0, 0);
  if (shows(c, 'star')) stars(ctx, w, horizonOf(h), f.t, [c.star, c.aurora], Math.round((w * h) / 90), 17, 0.85);
  if (shows(c, 'aurora')) aurora(ctx, f, c, w, h);
  if (shows(c, 'sun')) sunRoad(ctx, f, c, w, h);
  if (shows(c, 'flake')) snowfall(ctx, { ...f, w, h }, c.flake, Math.round((w * h) / 70), 23);
  ctx.restore();
};

type Painter = (g: Ctx, f: Frame, c: Colors<K>, m: Layout) => void;

// The room's static parts, back to front.
const ROOM: readonly Painter[] = [
  paintPlanks,
  (g, _f, c, m) => paintLamp(g, c, m),
  (g, _f, c, m) => paintWindow(g, c, m),
  (g, _f, c, m) => paintDial(g, c, m),
  (g, _f, c, m) => paintWhisk(g, c, m),
  (g, _f, c, m) => paintPosts(g, c, m.stoveX - 2, m.seat + 9, m.step - 6),
  (g, _f, c, m) => paintPosts(g, c, m.stoveX - 2, m.step + 9, m.floor),
  (g, _f, c, m) => paintBench(g, c, m.stoveX - 2, m.seat),
  (g, _f, c, m) => paintBench(g, c, m.stoveX - 2, m.step),
  paintFloor,
  (g, _f, c, m) => paintStoveBody(g, c, m),
  (g, _f, c, m) => paintStones(g, c, m),
  (g, _f, c, m) => paintBucket(g, c, m),
];

const roomLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('bear-sauna-room', f, c, (g) => {
    for (const paint of ROOM) paint(g, f, c, layoutOf(f));
  });

const room = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(roomLayer(f, c), 0, 0);
};

// ---- the polar bear: o ink, b fur, d its shade, l its light, n nose and pads, p blush, t/T/s towel, w glint ----

const BEAR_W = 46;
const BEAR_H = 56;
const SHOULDER = [37, 31] as const;

// Paws held out toward us: a rim of ink round each sole, a big pad and three toe beans.
const bearFeet = (): Coat[] =>
  [13, 33].flatMap((x): Coat[] => [
    ['o', egg(x, 50, 7.5, 6.5)],
    ['b', egg(x, 50, 6.5, 5.5)],
    ['n', egg(x, 52.2, 3, 2)],
  ]);

const TOES = [
  [-4, 49],
  [-1, 48],
  [2, 49],
] as const;

const toesOf = (): Mark[] =>
  [13, 33].flatMap((x) =>
    TOES.flatMap(([dx, y]): Mark[] => [
      [x + dx, y, 'n'],
      [x + dx + 1, y, 'n'],
    ]),
  );

const bearHead = (y: number): Coat[] => [
  ['b', egg(8.5, y - 8, 3.8, 3.8)],
  ['b', egg(37.5, y - 8, 3.8, 3.8)],
  ['d', egg(8.5, y - 7.5, 1.8, 1.8)],
  ['d', egg(37.5, y - 7.5, 1.8, 1.8)],
  ['o', egg(23, y, 15, 12.5)],
  ['b', egg(23, y, 14, 11.5)],
  ['l', egg(17, y - 5, 5, 3)],
  ['l', egg(23, y + 4, 6.5, 4.5)],
  ['n', egg(23, y + 1.6, 2.6, 1.7)],
  ['p', egg(13.5, y + 4, 2.6, 1.4)],
  ['p', egg(32.5, y + 4, 2.6, 1.4)],
];

// A towel folded flat on the crown, its underside in shade and its woven borders striped.
const bearTowel = (y: number): Coat[] => {
  const slab = egg(23, y - 12, 15.5, 3.8);
  return [
    ['t', slab],
    ['T', within(slab, (_x, yy) => yy > y - 10)],
    ['s', within(slab, (x) => Math.floor(x) === 12 || Math.floor(x) === 33)],
    ['T', within(slab, (x) => Math.floor(x) === 13 || Math.floor(x) === 34)],
  ];
};

const eyesOf = (y: number, open: boolean): Mark[] =>
  [16, 29].flatMap((x): Mark[] =>
    open
      ? [
          [x, y - 2, 'w'],
          [x + 1, y - 2, 'n'],
          [x, y - 1, 'n'],
          [x + 1, y - 1, 'n'],
        ]
      : [
          [x - 1, y - 1, 'n'],
          [x, y - 2, 'n'],
          [x + 1, y - 2, 'n'],
          [x + 2, y - 1, 'n'],
        ],
  );

const mouthOf = (y: number): Mark[] => [
  [22, y + 1, 'w'],
  [23, y + 4, 'n'],
  [21, y + 4, 'n'],
  [22, y + 5, 'n'],
  [24, y + 5, 'n'],
  [25, y + 4, 'n'],
];

// The bear's sprite: `sq` presses it down a pixel on the beat (wider body, lower head); `open` eyes while ladling.
const bearOf = (sq: number, open: boolean): Sprite => {
  const hy = 18 + sq;
  const body = egg(23, 40 + sq * 0.5, 17 + sq, 15 - sq * 0.5);
  return sculpt(
    BEAR_W,
    BEAR_H,
    [
      ['d', body],
      ['b', egg(21.5, 38.5 + sq * 0.5, 16 + sq, 14 - sq * 0.5)],
      ['l', egg(15, 32 + sq, 5, 3.5)],
      ['o', rod([9, 31 + sq], [12.5, 43], 4.4)],
      ['b', rod([9, 31 + sq], [12.5, 43], 3.4)],
      ...bearFeet(),
      ...bearHead(hy),
      ...bearTowel(hy),
    ],
    [...eyesOf(hy, open), ...mouthOf(hy), ...toesOf()],
  );
};

const BEAR = [
  [bearOf(0, false), bearOf(0, true)],
  [bearOf(1, false), bearOf(1, true)],
] as const;

// ---- the seal pup lying on the bench, head up toward the bear: g/G/L coat, n eyes and nose, t/s its own towel ----

const SEAL_W = 40;
const SEAL_H = 26;

const sealFace = (y: number): Mark[] => [
  ...([24, 29] as const).flatMap((x): Mark[] => [
    [x, y - 2, 'w'],
    [x + 1, y - 2, 'n'],
    [x, y - 1, 'n'],
    [x + 1, y - 1, 'n'],
    [x, y, 'n'],
    [x + 1, y, 'n'],
  ]),
  [33, y + 1, 'n'],
  [34, y + 1, 'n'],
  [33, y + 4, 'n'],
  [37, y + 2, 'L'],
  [38, y + 1, 'L'],
  [37, y + 4, 'L'],
  [38, y + 5, 'L'],
];

const SEAL_BACK = egg(15, 19.5, 12.5, 6);

// `nod` lowers the head a pixel on the beat; `clap` lifts the front flipper to its chest.
const sealOf = (nod: number, clap: boolean): Sprite => {
  const hy = 9 + nod;
  const towel = within(egg(15, 19.5, 13.5, 7), (x, y) => x > 7 && x < 19 && y < 21);
  return sculpt(
    SEAL_W,
    SEAL_H,
    [
      ['G', rod([6, 20], [1, 15], 2.4)],
      ['G', rod([6, 21], [1, 24], 2.2)],
      ['g', SEAL_BACK],
      ['L', within(SEAL_BACK, (_x, y) => y > 22)],
      ['g', rod([19, 19], [25, hy + 3], 6)],
      ['L', egg(24, 20.5, 4, 4)],
      ['g', egg(27.5, hy, 8, 7)],
      ['L', egg(33, hy + 3, 3.4, 2.5)],
      ['p', egg(22.5, hy + 3, 1.6, 1)],
      ['G', clap ? rod([23, 19], [29, 15], 1.8) : rod([22, 21], [27, 24], 1.8)],
      ['t', towel],
      ['s', within(towel, (x) => Math.floor(x) === 9 || Math.floor(x) === 17)],
    ],
    [...sealFace(hy), [10, 23, 'G'], [14, 24, 'G'], [21, 23, 'G']],
  );
};

const SEAL = [
  [sealOf(0, false), sealOf(0, true)],
  [sealOf(1, false), sealOf(1, true)],
] as const;

const sealPalette = paletteBy<K>((c) => ({
  ...{ o: c.ink, g: c.seal, G: c.sealLo, L: c.sealLit, n: c.nose, p: c.blush },
  ...{ t: c.towel, s: c.stripe, w: c.furLit },
}));

const bearPalette = paletteBy<K>((c) => ({
  ...{ o: c.ink, b: c.fur, d: c.furLo, l: c.furLit, n: c.nose, p: c.blush },
  ...{ t: c.towel, T: c.towelLo, s: c.stripe, w: c.furLit },
}));

// ---- the ritual: once every four bars the bear lifts the ladle from the bucket and pours it over the stones ----

const CYCLE = 16;
type P = readonly [number, number];

/** Beats since the latest pour began. */
const ritualOf = (f: Frame): number => wrap(f.beat, CYCLE);

const ease = (k: number): number => k * k * (3 - 2 * k);
const lerp = (a: P, b: P, k: number): P => [Math.round(a[0] + (b[0] - a[0]) * k), Math.round(a[1] + (b[1] - a[1]) * k)];

/** How far the ladle is out of the bucket: up over a beat, held for the pour, back down over the next. */
const reachOf = (p: number): number => (p < 1 ? ease(p) : p < 2 ? 1 : p < 3 ? 1 - ease(p - 2) : 0);

/** The age of the steam cloud, 0 when the water hits the stones … 1 when the last of it has gone. */
const steamAgeOf = (p: number): number => (p - 1.3) / 11;

const bearTop = (m: Layout): P => [m.bearX - (BEAR_W >> 1), m.seat - BEAR_H];
const rimOf = (m: Layout): number => m.seat - 2 - BUCKET_H;

type Ladle = { readonly paw: P; readonly scoop: P; readonly k: number; readonly tip: boolean };

const ladleOf = (f: Frame, m: Layout): Ladle => {
  const p = ritualOf(f);
  const k = reachOf(p);
  const paw = lerp([m.bucketX - 7, rimOf(m) - 8], [m.bucketX + 2, m.stoveTop - 16], k);
  const scoop = lerp([m.bucketX + 1, rimOf(m) + 4], [m.stoveX + 10, m.stoveTop - 7], k);
  return { paw, scoop: [scoop[0], scoop[1] - Math.round(Math.sin(k * Math.PI) * 6)], k, tip: p >= 1 && p < 2 };
};

const SCOOP: Sprite = ['o....o', 'owwwwo', 'oBBBBo', '.oooo.'];
const SCOOP_TIPPED: Sprite = ['.ooo.', 'oBBo.', 'oBBww', 'oBBo.', '.ooo.'];
const scoopPalette = paletteBy<K>((c) => ({ o: c.ink, w: c.water, B: c.brass }));

// The handle runs from the paw to the scoop; while the scoop is under water only the part above the rim shows.
const ladle = (ctx: Ctx, c: Colors<K>, m: Layout, l: Ladle): void => {
  const out = l.k > 0.3;
  const end: P = out ? l.scoop : [m.bucketX, rimOf(m) - 1];
  limb(ctx, l.paw[0], l.paw[1], end[0], end[1], 1, c.benchLit, c.ink);
  if (out) drawSprite(ctx, l.tip ? SCOOP_TIPPED : SCOOP, scoopPalette(c), l.scoop[0] - 2, l.scoop[1] - 2);
};

// Water falling from the tipped scoop in a short string of drops, hissing where it lands on the stones.
const pour = (ctx: Ctx, f: Frame, c: Colors<K>, l: Ladle): void => {
  const p = ritualOf(f);
  if (!l.tip) return;
  const [x, y] = [l.scoop[0] + 3, l.scoop[1] + 1];
  for (let i = 0; i < 4; i++) {
    const q = frac((p - 1) * 3 + i / 4);
    fillRect(ctx, c.water, x + Math.round(q * 2), y + Math.round(q * 12), 1, 2);
  }
  if (p > 1.2)
    for (let i = 0; i < 5; i++) fillRect(ctx, c.steam, x - 4 + Math.floor(rand(Math.floor(f.t * 12), i) * 10), y + 9 - (i % 3), 1, 1);
};

// The right arm: from the shoulder to the paw that holds the ladle.
const arm = (ctx: Ctx, c: Colors<K>, m: Layout, l: Ladle, sq: number): void => {
  const [bx, by] = bearTop(m);
  const [sx, sy] = [bx + SHOULDER[0], by + SHOULDER[1] + sq];
  limb(ctx, sx, sy, l.paw[0], l.paw[1], 5, c.fur, c.ink);
  limb(ctx, sx - 1, sy + 1, l.paw[0] - 1, l.paw[1] + 1, 2, c.fur, c.fur);
  disc(ctx, l.paw[0], l.paw[1], 4, () => c.ink);
  disc(ctx, l.paw[0], l.paw[1], 3, (dy) => (dy > 1 ? c.furLo : c.fur));
};

// A bead of sweat runs down the bear's cheek every other bar.
const sweat = (ctx: Ctx, f: Frame, c: Colors<K>, m: Layout, sq: number): void => {
  const q = frac(f.beat / 8);
  if (q > 0.5) return;
  const [bx, by] = bearTop(m);
  const [x, y] = [bx + 37, by + 14 + sq + Math.round(q * 14)];
  fillRect(ctx, c.ink, x - 1, y - 1, 3, 4);
  fillRect(ctx, c.water, x, y, 1, 2);
  fillRect(ctx, c.furLit, x, y, 1, 1);
};

const bear = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  const p = ritualOf(f);
  const sq = squashOf(f, 0.3);
  const l = ladleOf(f, m);
  const [bx, by] = bearTop(m);
  drawSprite(ctx, BEAR[sq][p < 3.4 ? 1 : 0], bearPalette(c), bx, by);
  ladle(ctx, c, m, l);
  arm(ctx, c, m, l, sq);
  pour(ctx, f, c, l);
  sweat(ctx, f, c, m, sq);
};

// The seal nods off the beat, and claps its flippers when the steam bursts up.
const seal = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  const age = steamAgeOf(ritualOf(f));
  const clap = age > 0.02 && age < 0.3 && frac(f.beat * 2) < 0.5;
  const sprite = SEAL[squashOf(f, 0.3, 0.5)][clap ? 1 : 0];
  drawSprite(ctx, sprite, sealPalette(c), m.sealX - (SEAL_W >> 1), m.sealY - 1 - SEAL_H);
};

// ---- the thermometer's needle and the sand timer ----

// The needle climbs after every pour and sinks back while the room settles.
const heatOf = (f: Frame): number => {
  const age = steamAgeOf(ritualOf(f));
  const rise = age < 0 || age >= 1 ? 0 : Math.min(1, age * 6) * (1 - age);
  return 0.5 + 0.35 * rise + 0.015 * Math.sin(f.beat * Math.PI);
};

const needle = (ctx: Ctx, f: Frame, c: Colors<K>, m: Layout): void => {
  const a = dialAngle(heatOf(f));
  pixelLine(ctx, m.thermoX, m.thermoY, m.thermoX + Math.cos(a) * 5, m.thermoY + Math.sin(a) * 5, c.red);
  fillRect(ctx, c.ink, m.thermoX, m.thermoY, 1, 1);
};

const TIMER = 32;
// Half-widths of the glass by rows from its neck.
const BULB = [0, 1, 2, 3, 3, 3] as const;

type Put = (dx: number, dy: number, w: number, h: number, color: string) => void;

// The timer in its own frame of reference, upright; `level` is the share of sand already run through. Lying on its
// side halfway through a flip, the sand has slid to the lower half of both bulbs.
const hourglass = (put: Put, c: Colors<K>, level: number, flat: boolean): void => {
  const [top, pile] = [Math.round((1 - level) * 4), Math.round(level * 4)];
  for (const dx of [-7, 5]) {
    put(dx, -6, 3, 13, c.ink);
    put(dx + 1, -6, 1, 13, c.bench);
  }
  for (let k = -5; k <= 5; k++) {
    const hw = BULB[Math.abs(k)] ?? 3;
    put(-hw - 1, k, hw * 2 + 3, 1, c.ink);
    put(-hw, k, hw * 2 + 1, 1, c.steam);
    if (flat) put(0, k, hw + 1, 1, c.sand);
    else if ((k < 0 && -k <= top) || k > 5 - pile) put(-hw, k, hw * 2 + 1, 1, c.sand);
  }
  if (!flat && level < 1) put(0, 0, 1, 6 - pile, c.sand);
  for (const dy of [-8, 6]) {
    put(-7, dy, 15, 3, c.ink);
    put(-6, dy + 1, 13, 1, dy < 0 ? c.benchLit : c.bench);
  }
};

// Every eight bars the timer runs out and turns over on its pivot.
const timer = (ctx: Ctx, f: Frame, c: Colors<K>, m: Layout): void => {
  const { timerX: x, timerY: y } = m;
  const q = wrap(f.beat, TIMER);
  const flat = q > TIMER - 0.5;
  disc(ctx, x, y, 10, () => c.ink);
  disc(ctx, x, y, 9, (dy) => (dy < -6 ? c.benchLit : c.bench));
  const put: Put = flat
    ? (dx, dy, w, h, color) => fillRect(ctx, color, x + dy, y + dx, h, w)
    : (dx, dy, w, h, color) => fillRect(ctx, color, x + dx, y + dy, w, h);
  hourglass(put, c, Math.min(1, q / (TIMER - 1)), flat);
  fillRect(ctx, c.brass, x, y, 1, 1);
};

const gauges = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  needle(ctx, f, c, m);
  timer(ctx, f, c, m);
};

// ---- steam ----

// Between pours a little heat shimmers up off the stones.
const wisps = (ctx: Ctx, f: Frame, c: Colors<K>, m: Layout): void => {
  for (let i = 0; i < 3; i++) {
    const a = frac(f.t * 0.25 + i / 3);
    const x = m.stoveX + m.stoveW * (0.3 + 0.2 * i) + Math.sin(f.t * 2 + i * 2) * 2 * a;
    puffOf(ctx, c.steam, x, m.stoveTop - 4 - a * 26, 1 + a * 2, 0.55 + a * 0.45);
  }
};

// One puff of the cloud: it shoots up off the stones, then rolls along under the ceiling, mostly toward the bench.
const billow = (f: Frame, m: Layout, j: number, a: number): Puff => {
  const [cx, cy] = [m.stoveX + 12, m.stoveTop - 4];
  const rise = ease(Math.min(1, a / 0.4));
  const spread = Math.max(0, a - 0.2) / 0.8;
  const dir = j % 4 === 0 ? 0.35 : -1;
  return {
    x: cx + (rand(j, 71) - 0.5) * 16 + dir * spread * m.stoveX * 0.75 * (0.3 + rand(j, 72)),
    y: cy - rise * (cy - m.ceil - 10 - rand(j, 74) * 12) + Math.sin(f.t * 1.3 + j) * 2,
    r: 5 + a * 13 * (0.7 + 0.6 * rand(j, 73)),
    a,
  };
};

// Window fog: the lower glass mists over after a pour, thickest at the sill.
const fog = (ctx: Ctx, c: Colors<K>, m: Layout, level: number): void => {
  const band = Math.ceil(m.winH / 8);
  for (let k = 0; k < 4; k++) fillDither(ctx, c.steam, level * (k + 1) * 0.15, m.winX, m.winY + m.winH - band * (4 - k), m.winW, band);
};

const steam = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  wisps(ctx, f, c, m);
  const age = steamAgeOf(ritualOf(f));
  if (age < 0 || age >= 1) return;
  // Enough puffs, released closely enough, that the column stays unbroken all the way up to the ceiling.
  const count = Math.round((m.stoveTop - m.ceil) / 5);
  const puffs: Puff[] = [];
  for (let j = 0; j < count; j++) {
    const a = age * 1.6 - (j * 0.5) / count;
    if (a >= 0 && a < 1) puffs.push(billow(f, m, j, a));
  }
  cloud(ctx, puffs, c.steam, c.furLo);
  fog(ctx, c, m, Math.min(1, age * 4) * (1 - age));
};

export const bearSauna = defineScene<K>({
  id: 'bear-sauna',
  title: 'Polar Sauna',
  mood: { valence: 0.2, energy: -0.6 },
  styles: ['snowfall', 'lofi-loop', 'starlit-dream', 'celtic-isle', 'bossa-cafe'],
  variants: [
    {
      // An aurora night: green curtains ripple over the moonlit snow and the frozen lake.
      mood: { valence: 0.15, energy: -0.6 },
      colors: {
        ...{ sky0: '#060a1e', sky1: '#0e1a3a', sky2: '#1e3256', star: '#e8f0ff', aurora: '#5cf0a8', aurora2: '#8a62e0' },
        ...{ sun: '#060a1e', flake: '#060a1e', snow: '#c4d4f0', snowLo: '#7088b4', lake: '#34507c', lakeLit: '#86acd8' },
        ...{ pine: '#0a1428', wall: '#b47448', wallLit: '#d69862', wallLo: '#844e30', ink: '#2a140c' },
        ...{ bench: '#cc9058', benchLit: '#ecb878', benchLo: '#965c36', iron: '#363240', ironLit: '#58525e' },
        ...{ stone: '#6a6470', stoneLit: '#9a92a0', ember: '#ff7a3a', glow: '#ffb060', steam: '#f4ece4', water: '#9ad0f0' },
        ...{ fur: '#f2eee6', furLit: '#ffffff', furLo: '#c4bcc6', nose: '#2a2028', blush: '#ff9c9c' },
        ...{ towel: '#5cbcc8', towelLo: '#348696', stripe: '#f8f4e8', seal: '#9aa0ae', sealLit: '#c6cad4', sealLo: '#666c7e' },
        ...{ brass: '#d8a850', red: '#e0403c', face: '#f8f0dc', sand: '#f0d080', leaf: '#5a9a4a', leafLo: '#3a6a3a' },
      },
    },
    {
      // Blue hour in a snowfall: the last light is lavender on the hills and big flakes drift past the glass.
      mood: { valence: -0.15, energy: -0.75 },
      colors: {
        ...{ sky0: '#2a3a6c', sky1: '#4c5e96', sky2: '#8e96c6', star: '#2a3a6c', aurora: '#2a3a6c', aurora2: '#2a3a6c' },
        ...{ sun: '#2a3a6c', flake: '#f2f4ff', snow: '#b8c4e8', snowLo: '#7a86b8', lake: '#6a78a8', lakeLit: '#aab6e2' },
        ...{ pine: '#1e2848', wall: '#a86e48', wallLit: '#c88c5e', wallLo: '#784830', ink: '#24120e' },
        ...{ bench: '#c08654', benchLit: '#e0aa72', benchLo: '#8c5634', iron: '#34303e', ironLit: '#56505e' },
        ...{ stone: '#686272', stoneLit: '#9890a2', ember: '#ff7038', glow: '#ffa858', steam: '#eeeaf0', water: '#a8d0f4' },
        ...{ fur: '#f0ecea', furLit: '#ffffff', furLo: '#bcb8cc', nose: '#28202a', blush: '#ff9aa4' },
        ...{ towel: '#f0c040', towelLo: '#c08a24', stripe: '#fff6dc', seal: '#9a9eb0', sealLit: '#c8cad8', sealLo: '#646a80' },
        ...{ brass: '#d4a24c', red: '#dc3c40', face: '#f6eedc', sand: '#f0cc78', leaf: '#56904a', leafLo: '#36623a' },
      },
    },
    {
      // The midnight sun: the low sun rolls along the hills and the snow and the ice glow peach and gold.
      mood: { valence: 0.45, energy: -0.4 },
      colors: {
        ...{ sky0: '#6a7cc4', sky1: '#e6a2a6', sky2: '#ffd48c', star: '#6a7cc4', aurora: '#6a7cc4', aurora2: '#6a7cc4' },
        ...{ sun: '#fffae6', flake: '#6a7cc4', snow: '#ffe6d6', snowLo: '#d4a2aa', lake: '#e4b4bc', lakeLit: '#fff4d8' },
        ...{ pine: '#4a2e4e', wall: '#c08050', wallLit: '#e6a868', wallLo: '#8e5634', ink: '#2e160e' },
        ...{ bench: '#d49a5e', benchLit: '#f2c282', benchLo: '#a0643a', iron: '#3a3440', ironLit: '#5e5660' },
        ...{ stone: '#706670', stoneLit: '#a0949c', ember: '#ff8040', glow: '#ffbc68', steam: '#fff2e8', water: '#a8dcf0' },
        ...{ fur: '#f6f0e6', furLit: '#ffffff', furLo: '#d0c0c0', nose: '#2e2028', blush: '#ff9488' },
        ...{ towel: '#f07884', towelLo: '#c04c60', stripe: '#fff4e4', seal: '#a6a0aa', sealLit: '#d2ccd2', sealLo: '#706a7a' },
        ...{ brass: '#e0b058', red: '#e04438', face: '#fff6e4', sand: '#f6d488', leaf: '#7aa850', leafLo: '#4e7a3e' },
      },
    },
  ],
  layers: [outside, room, fire, gauges, seal, bear, steam],
});
