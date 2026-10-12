// A city at night seen while slowly panning: three layers of towers with lit windows that switch on and off
// with the beat, a moon behind drifting cloud, and an elevated train crossing now and then.
import { type Ctx, fillRect } from 'mojipx';
import { ditherGradient, frac, rand, ridgeNoise, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { drawGlow, memoLayer, moon, tileX, wrap } from './batch-2-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'star'
  | 'moon'
  | 'sea'
  | 'far'
  | 'farWin'
  | 'mid'
  | 'edge'
  | 'win'
  | 'winCool'
  | 'near'
  | 'beacon'
  | 'trainWin';

type Spec = {
  readonly seed: number;
  readonly count: number;
  readonly minW: number;
  readonly maxW: number;
  /** Tops as fractions of the height, from the highest to the lowest. */
  readonly high: number;
  readonly low: number;
  readonly maxGap: number;
  readonly pitchX: number;
  readonly pitchY: number;
  readonly winW: number;
  readonly winH: number;
  readonly lit: number;
  /** Pixels per second the layer drifts left. */
  readonly speed: number;
};

type Tower = { readonly x: number; readonly w: number; readonly top: number; readonly crown: number; readonly antenna: number };

const FAR: Spec = {
  seed: 11,
  count: 16,
  minW: 12,
  maxW: 26,
  high: 0.36,
  low: 0.6,
  maxGap: 3,
  pitchX: 3,
  pitchY: 3,
  winW: 1,
  winH: 1,
  lit: 0.22,
  speed: 1.5,
};
const MID: Spec = {
  seed: 23,
  count: 13,
  minW: 16,
  maxW: 32,
  high: 0.3,
  low: 0.66,
  maxGap: 9,
  pitchX: 4,
  pitchY: 4,
  winW: 2,
  winH: 2,
  lit: 0.3,
  speed: 4,
};
const NEAR: Spec = {
  seed: 41,
  count: 11,
  minW: 22,
  maxW: 44,
  high: 0.84,
  low: 0.93,
  maxGap: 6,
  pitchX: 6,
  pitchY: 5,
  winW: 3,
  winH: 2,
  lit: 0.3,
  speed: 13,
};
const DECK_SPEED = 8;
const PILLAR_GAP = 34;
const CAR = 30;
const CARS = 4;
const TRAIN_LEN = CARS * (CAR + 2);

const deckOf = (f: Frame): number => Math.round(f.h * 0.78);

const towersOf = (s: Spec, h: number): { readonly towers: readonly Tower[]; readonly period: number } => {
  const towers: Tower[] = [];
  let x = 0;
  for (let i = 0; i < s.count; i++) {
    const w = Math.round(s.minW + rand(i, s.seed) * (s.maxW - s.minW));
    const top = Math.round(h * (s.high + rand(i, s.seed + 1) * (s.low - s.high)));
    const crown = rand(i, s.seed + 2) < 0.35 ? 2 + Math.floor(rand(i, s.seed + 3) * 5) : 0;
    const antenna = rand(i, s.seed + 4) < 0.4 ? 3 + Math.floor(rand(i, s.seed + 5) * 7) : 0;
    towers.push({ x, w, top, crown, antenna });
    x += w + Math.floor(rand(i, s.seed + 6) * (s.maxGap + 1));
  }
  return { towers, period: x };
};

const isLit = (s: Spec, i: number, col: number, row: number): boolean => rand(col * 131 + row, s.seed * 1000 + i) < s.lit;

const paintWindows = (ctx: Ctx, s: Spec, t: Tower, i: number, h: number, colors: readonly string[]): void => {
  const cols = Math.floor((t.w - 3) / s.pitchX);
  const rows = Math.floor((h - t.top - 4) / s.pitchY);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!isLit(s, i, col, row)) continue;
      const color = colors[Math.floor(rand(col + row * 7, i + s.seed) * colors.length)] as string;
      fillRect(ctx, color, t.x + 2 + col * s.pitchX, t.top + 3 + row * s.pitchY, s.winW, s.winH);
    }
  }
};

const paintTower = (ctx: Ctx, t: Tower, h: number, body: string, edge: string | null): void => {
  fillRect(ctx, body, t.x, t.top, t.w, h - t.top);
  if (t.crown > 0) fillRect(ctx, body, t.x + 3, t.top - t.crown, t.w - 6, t.crown);
  if (t.antenna > 0) fillRect(ctx, body, t.x + (t.w >> 1), t.top - t.crown - t.antenna, 1, t.antenna);
  if (edge) fillRect(ctx, edge, t.x + t.w - 1, t.top, 1, h - t.top);
};

const layerOf = (s: Spec, h: number, body: string, edge: string | null, wins: readonly string[]): HTMLCanvasElement => {
  const { towers, period } = towersOf(s, h);
  return memoLayer(`skyline:${s.seed}:${body}:${edge}:${wins.join(',')}`, period, h, (ctx) => {
    towers.forEach((t, i) => {
      paintTower(ctx, t, h, body, edge);
      paintWindows(ctx, s, t, i, h, wins);
    });
  });
};

// Every beat a few windows change: lit ones go dark and dark ones light up.
const flicker = (ctx: Ctx, f: Frame, s: Spec, body: string, win: string, count: number): void => {
  const { towers, period } = towersOf(s, f.h);
  const scroll = wrap(f.t * s.speed, period);
  const b = Math.floor(f.beat);
  for (let k = 0; k < count; k++) {
    const i = Math.floor(rand(b, k * 3 + s.seed) * towers.length);
    const t = towers[i] as Tower;
    const col = Math.floor(rand(b, k * 3 + s.seed + 1) * Math.max(1, Math.floor((t.w - 3) / s.pitchX)));
    const row = Math.floor(rand(b, k * 3 + s.seed + 2) * 24);
    const y = t.top + 3 + row * s.pitchY;
    let x = t.x + 2 + col * s.pitchX - scroll;
    if (x < -s.winW) x += period;
    if (x < f.w && y < f.h) fillRect(ctx, isLit(s, i, col, row) ? body : win, x, y, s.winW, s.winH);
  }
};

const beacons = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const { towers, period } = towersOf(MID, f.h);
  const scroll = wrap(f.t * MID.speed, period);
  towers.forEach((t, i) => {
    if (t.antenna === 0 || frac(f.beat / 2 + i * 0.37) > 0.45) return;
    let x = t.x + (t.w >> 1) - scroll;
    if (x < 0) x += period;
    fillRect(ctx, c.beacon, x, t.top - t.crown - t.antenna - 1, 1, 1);
  });
};

const cloudBand = (w: number, color: string): HTMLCanvasElement =>
  memoLayer(`skyline-cloud:${color}`, w, 20, (ctx) => {
    for (let x = 0; x < w; x++) {
      const thick = (ridgeNoise(x / 22, 5) - 0.42) * 26;
      if (thick <= 0) continue;
      for (let y = 0; y < 20; y++) {
        const d = Math.abs(y - 12 + thick * 0.35) / (thick / 2);
        if (d < 1 && (d < 0.55 || (x + y) % 2 === 0)) fillRect(ctx, color, x, y, 1, 1);
      }
    }
  });

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(ditherGradient(f.w, f.h, [c.sky0, c.sky1, c.sky2, c.far]), 0, 0);
  stars(ctx, f.w, f.h, f.t, [c.star, c.winCool], Math.round((f.w * f.h) / 700), 31, 0.5);
  const r = Math.round(Math.min(f.w, f.h) * 0.085);
  const mx = Math.round(f.w * 0.76);
  const my = Math.round(f.h * 0.2);
  drawGlow(ctx, mx, my, Math.round(r * 2.4), c.sky2, 0.9);
  moon(ctx, mx, my, r, c.moon, c.sea);
  tileX(ctx, cloudBand(360, c.sky2), f.t * 3, my + r + 2, f.w);
  tileX(ctx, cloudBand(360, c.sky1), f.t * 5 + 140, my - r * 2.2, f.w);
};

const city = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  tileX(ctx, layerOf(FAR, f.h, c.far, null, [c.farWin]), f.t * FAR.speed, 0, f.w);
  flicker(ctx, f, FAR, c.far, c.farWin, 4);
  tileX(ctx, layerOf(MID, f.h, c.mid, c.edge, [c.win, c.win, c.winCool]), f.t * MID.speed, 0, f.w);
  flicker(ctx, f, MID, c.mid, c.win, 6 + Math.round(f.energy * 6));
  beacons(ctx, f, c);
};

const train = (ctx: Ctx, f: Frame, c: Colors<K>, deck: number): void => {
  const x0 = wrap(f.t * 58 + 150, 1300) - TRAIN_LEN;
  if (x0 > f.w || x0 + TRAIN_LEN < 0) return;
  for (let i = 0; i < CARS; i++) {
    const x = Math.round(x0 + i * (CAR + 2));
    fillRect(ctx, c.edge, x, deck - 8, CAR, 7);
    fillRect(ctx, c.mid, x, deck - 2, CAR, 1);
    for (let j = 0; j < 5; j++) fillRect(ctx, c.trainWin, x + 3 + j * 6, deck - 6, 3, 2);
  }
  const nose = Math.round(x0 + TRAIN_LEN - 2);
  fillRect(ctx, c.moon, nose - 1, deck - 4, 2, 1);
  drawGlow(ctx, nose + 6, deck - 4, 8, c.trainWin, 0.6);
};

const viaduct = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const deck = deckOf(f);
  const offset = wrap(f.t * DECK_SPEED, PILLAR_GAP);
  for (let x = -offset; x < f.w; x += PILLAR_GAP) fillRect(ctx, c.near, Math.round(x), deck + 3, 4, f.h - deck);
  train(ctx, f, c, deck);
  fillRect(ctx, c.edge, 0, deck - 1, f.w, 1);
  fillRect(ctx, c.near, 0, deck, f.w, 4);
};

const street = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  tileX(ctx, layerOf(NEAR, f.h, c.near, null, [c.win, c.farWin]), f.t * NEAR.speed, 0, f.w);
  flicker(ctx, f, NEAR, c.near, c.win, 2);
};

export const midnightSkyline = defineScene<K>({
  id: 'midnight-skyline',
  title: 'Midnight Skyline',
  mood: { valence: 0, energy: -0.3 },
  styles: ['city-lights', 'lofi-loop', 'nineties-pop'],
  variants: [
    {
      mood: { valence: -0.1, energy: -0.4 },
      colors: {
        sky0: '#060a1c',
        sky1: '#0e1736',
        sky2: '#1c2a58',
        star: '#cfd8ff',
        moon: '#f6f0dc',
        sea: '#cfc6a8',
        far: '#232f5e',
        farWin: '#4d64a0',
        mid: '#0d1430',
        edge: '#2c3a6c',
        win: '#ffcf70',
        winCool: '#a8dcff',
        near: '#05070f',
        beacon: '#ff4b5c',
        trainWin: '#fff2bd',
      },
    },
    {
      mood: { valence: 0.4, energy: 0.1 },
      colors: {
        sky0: '#12062a',
        sky1: '#2c0f4a',
        sky2: '#5a1f6e',
        star: '#ffd6f4',
        moon: '#fff0f6',
        sea: '#f0c4dc',
        far: '#7a2d78',
        farWin: '#c45ea8',
        mid: '#22103c',
        edge: '#55307a',
        win: '#6ff2ff',
        winCool: '#ff9ad6',
        near: '#0b0518',
        beacon: '#ffe14d',
        trainWin: '#c8fbff',
      },
    },
  ],
  layers: [sky, city, viaduct, street],
});
