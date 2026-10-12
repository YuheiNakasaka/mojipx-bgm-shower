// The sun sinking into the sea: a glittering column of reflection, swells rolling toward the beach,
// thin clouds lit from below, gulls gliding across, and a wave washing up the sand every bar.
import { type Ctx, fillRect, type Sprite } from 'mojipx';
import { bayer, ditherGradient, frac, hexToRgb, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { discImage, drawGlow, fillDither, flock, memoLayer, paletteBy, wrap } from './batch-1-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sky3'
  | 'sun'
  | 'sunLow'
  | 'cloud'
  | 'sea0'
  | 'sea1'
  | 'sea2'
  | 'glint'
  | 'foam'
  | 'sand'
  | 'wet'
  | 'gull';

const unitOf = (f: Frame): number => Math.min(f.w, f.h);
const horizonOf = (f: Frame): number => Math.round(f.h * 0.5 - (f.h - unitOf(f)) * 0.05);
const shoreOf = (f: Frame): number => Math.round(f.h - 0.15 * unitOf(f) - (f.h - unitOf(f)) * 0.12);
const sunRadius = (f: Frame): number => Math.round(unitOf(f) * 0.12);

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const hz = horizonOf(f);
  ctx.drawImage(ditherGradient(f.w, hz, [c.sky0, c.sky1, c.sky2, c.sky3]), 0, 0);
};

const sunImage = (r: number, c: Colors<K>): HTMLCanvasElement => {
  const top = hexToRgb(c.sun);
  const low = hexToRgb(c.sunLow);
  return discImage(`os-sun:${c.sun}:${c.sunLow}`, r, (x, y) => ((y / (r * 2) - 0.35) * 2.2 > bayer(x, y) ? low : top));
};

// The sun sits a little into the sea; only the part above the horizon is drawn.
const sun = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const hz = horizonOf(f);
  const r = sunRadius(f);
  const cx = Math.round(f.w / 2);
  const cy = hz - Math.round(r * 0.45);
  const g = Math.round(r * 2.6 + f.kick * 2);
  drawGlow(ctx, c.sun, cx, cy, g * 1.3, g, 0.45);
  const img = sunImage(r, c);
  const shown = hz - (cy - r);
  ctx.drawImage(img, 0, 0, img.width, shown, cx - r, cy - r, img.width, shown);
};

// A thin bank of cloud: a dark lens-shaped body with its underside lit by the low sun.
const cloudStreak = (ctx: Ctx, f: Frame, c: Colors<K>, i: number): void => {
  const hz = horizonOf(f);
  const u = unitOf(f);
  const len = Math.round(u * (0.22 + 0.4 * rand(i, 3)));
  const lane = f.w + len;
  const x = Math.round(wrap(rand(i, 4) * lane + f.t * (1.5 + rand(i, 5) * 2), lane) - len);
  const y = Math.round(hz * (0.18 + 0.66 * rand(i, 6)));
  const rows = 3 + Math.floor(rand(i, 7) * 4);
  const lean = (rand(i, 8) - 0.5) * 0.4;
  for (let j = 0; j < rows; j++) {
    const share = 0.35 + (0.65 * (j + 1)) / rows;
    const rowLen = Math.round(len * share);
    fillRect(ctx, c.cloud, x + Math.round((len - rowLen) * (0.5 + lean)), y - rows + j, rowLen, 1);
  }
  fillRect(ctx, c.sunLow, x + 3, y, len - 6, 1);
};

const clouds = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const count = Math.max(4, Math.round((horizonOf(f) * f.w) / 6000));
  for (let i = 0; i < count; i++) cloudStreak(ctx, f, c, i);
};

const sea = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const hz = horizonOf(f);
  const shore = shoreOf(f);
  ctx.drawImage(ditherGradient(f.w, shore - hz, [c.sea0, c.sea1, c.sea2]), 0, hz);
  fillRect(ctx, c.sunLow, 0, hz, f.w, 1);
};

// One row of the glittering reflection: dashes that flicker in place, gathered toward the middle and
// spreading wider toward the viewer.
const glitterRow = (ctx: Ctx, f: Frame, c: Colors<K>, y: number, d: number): void => {
  const r = sunRadius(f);
  const half = r * (0.5 + 1.3 * d);
  const flick = Math.floor(f.t * 4 + rand(y, 1) * 4);
  const dashes = 1 + Math.round(rand(y, flick + 2) * (1 + d * 2));
  for (let k = 0; k < dashes; k++) {
    const spread = rand(y * 7 + k, flick) + rand(y * 5 + k, flick + 3) - 1;
    const len = 1 + Math.round(rand(y + k, flick + 1) * (1 + (1 - d) * 5) + (d < 0.08 ? r * 0.5 : 0));
    const x = f.w / 2 + spread * half - len / 2;
    fillRect(ctx, d < 0.25 || k === 0 ? c.glint : c.sunLow, Math.round(x), y, len, 1);
  }
};

const glitter = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const hz = horizonOf(f);
  const depth = shoreOf(f) - hz;
  for (let y = hz + 1; y < hz + depth; y += 2) glitterRow(ctx, f, c, y, (y - hz) / depth);
};

// Rows of wave crests coming toward the beach, spaced by perspective; one row arrives per two beats.
const swellRow = (ctx: Ctx, f: Frame, c: Colors<K>, y: number, d: number, k: number): void => {
  const gap = 7 + d * 22;
  const drift = f.t * (2 + d * 6) * (k % 2 === 0 ? 1 : -1) + k * 13;
  const color = d > 0.6 ? c.foam : c.sunLow;
  for (let j = Math.floor(-drift / gap) - 1; j * gap + drift < f.w + gap; j++) {
    if (rand(j, k + 30) < 0.35) continue;
    const len = 1 + Math.round((1 + d * 7) * (0.4 + rand(j, k + 31)));
    const px = Math.round(j * gap + drift + (rand(j, k + 32) - 0.5) * gap * 0.7);
    fillRect(ctx, c.sea2, px - 1, y + 1, len + 2, 1);
    fillRect(ctx, color, px, y, len, 1);
  }
};

const swells = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const hz = horizonOf(f);
  const depth = shoreOf(f) - hz;
  const phase = frac(f.beat / 2);
  for (let k = 0; k < 12; k++) {
    const z = k + 1 - phase;
    const y = hz + Math.round((depth * 1.15) / (z + 0.15));
    const d = (y - hz) / depth;
    if (d < 0.22 || y >= hz + depth - 2) continue;
    swellRow(ctx, f, c, y, d, k + Math.floor(f.beat / 2));
  }
};

const pebbles = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`os-sand:${f.w}x${f.h}:${c.sand}:${c.wet}`, f.w, f.h - shoreOf(f), (g) => {
    g.drawImage(ditherGradient(f.w, f.h - shoreOf(f), [c.wet, c.sand, c.sand]), 0, 0);
    for (let i = 0; i < (f.w * (f.h - shoreOf(f))) / 90; i++) {
      const x = Math.floor(rand(i, 90) * f.w);
      const y = Math.floor((0.25 + 0.75 * rand(i, 91)) * (f.h - shoreOf(f)));
      fillRect(g, i % 3 === 0 ? c.foam : c.wet, x, y, 1 + (i % 2), 1);
    }
  });

// The beach: wet sand at the water line and a thin sheet of water sliding up and back once a bar.
const beach = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const shore = shoreOf(f);
  const sandH = f.h - shore;
  ctx.drawImage(pebbles(f, c), 0, shore);
  const p = frac(f.beat / 4);
  const reach = Math.sin(Math.min(1, p * 1.6) * Math.PI) * sandH * (0.35 + 0.15 * f.energy);
  fillDither(ctx, c.sea0, 0.5, 0, shore, f.w, Math.round(reach * 0.7));
  fillDither(ctx, c.foam, 0.25, 0, shore + Math.round(reach * 0.7), f.w, Math.round(reach * 0.3));
  for (let x = 0; x < f.w; x += 2) {
    const y = shore + reach + Math.sin(x * 0.09 + f.beat) * 2 + Math.sin(x * 0.23) * 1.5;
    fillRect(ctx, c.foam, x, Math.round(y), 2, 1);
  }
  for (let x = 0; x < f.w; x += 3) fillRect(ctx, c.foam, x + (Math.floor(f.t * 3) % 3), shore - 1 + (x % 2), 2, 1);
};

const GULL: readonly Sprite[] = [
  ['k.......k', '.kk...kk.', '...kkk...'],
  ['.........', 'kkk...kkk', '...kkk...'],
  ['.........', '...kkk...', 'kkk...kkk'],
  ['.........', 'kkk...kkk', '...kkk...'],
];

const gullPalette = paletteBy<K>((c) => ({ k: c.gull }));

const gulls = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const hz = horizonOf(f);
  flock(ctx, f, GULL, gullPalette(c), { count: 3 + Math.round(f.energy * 2), top: hz * 0.25, span: hz * 0.4, speed: -7, seed: 77 });
};

export const oceanSunset = defineScene<K>({
  id: 'ocean-sunset',
  title: 'Ocean Sunset',
  mood: { valence: 0.1, energy: -0.2 },
  styles: ['city-lights', 'credits-roll', 'lofi-loop'],
  variants: [
    {
      mood: { valence: 0.35, energy: -0.1 },
      colors: {
        sky0: '#2c2a6c',
        sky1: '#8c3a7c',
        sky2: '#f06a5c',
        sky3: '#ffb75c',
        sun: '#fff4b8',
        sunLow: '#ff9a48',
        cloud: '#6a2a5c',
        sea0: '#c8606c',
        sea1: '#6a3a7c',
        sea2: '#2a2052',
        glint: '#fff6c8',
        foam: '#ffe8d4',
        sand: '#e2a272',
        wet: '#a26062',
        gull: '#2a1830',
      },
    },
    {
      mood: { valence: -0.2, energy: -0.35 },
      colors: {
        sky0: '#14143c',
        sky1: '#3a2a6c',
        sky2: '#8a4a8c',
        sky3: '#e28aa2',
        sun: '#ffe4e2',
        sunLow: '#ff98aa',
        cloud: '#2a1e4c',
        sea0: '#8a5a94',
        sea1: '#3a2e6c',
        sea2: '#141638',
        glint: '#fff0f6',
        foam: '#e8dcf6',
        sand: '#9c7c9c',
        wet: '#5a4a76',
        gull: '#120c24',
      },
    },
  ],
  layers: [sky, sun, clouds, gulls, sea, glitter, swells, beach],
});
