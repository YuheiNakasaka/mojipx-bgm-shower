// A forest at night: layered tree silhouettes drifting slowly past with mist between them, a full moon,
// and fireflies wandering among the trunks, a quarter of them lighting up on every beat.
import { type Ctx, fillRect } from 'mojipx';
import { bayer, ditherGradient, frac, hexToRgb, rand, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { colorKey, discImage, drawGlow, fillDither, memoLayer, pine, spanDisc, wrap } from './batch-1-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'star'
  | 'moon'
  | 'moonShade'
  | 'moonGlow'
  | 'tree0'
  | 'tree1'
  | 'tree2'
  | 'tree3'
  | 'mist'
  | 'fly'
  | 'flyGlow';

const LAYERS = 4;
const TREE_KEYS = ['tree0', 'tree1', 'tree2', 'tree3'] as const;

const unitOf = (f: Frame): number => Math.min(f.w, f.h);
// Trees grow taller on a tall screen, so a phone held upright still shows a forest rather than a strip of one.
const tallOf = (f: Frame): number => unitOf(f) * 0.4 + f.h * 0.6;
const baseOf = (f: Frame, k: number): number => {
  const u = unitOf(f);
  const far = f.h - 0.34 * u - 0.15 * (f.h - u);
  return Math.round(far + ((f.h - 0.04 * u - far) * k) / (LAYERS - 1));
};
const periodOf = (f: Frame): number => Math.max(160, f.w);

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(ditherGradient(f.w, f.h, [c.sky0, c.sky1, c.sky2, c.sky2]), 0, 0);
  stars(ctx, f.w, f.h, f.t, [c.star, c.moonShade], Math.round((f.w * f.h) / 650), 31, 0.55);
};

const moonImage = (r: number, c: Colors<K>): HTMLCanvasElement => {
  const lit = hexToRgb(c.moon);
  const shade = hexToRgb(c.moonShade);
  const craters = [0, 1, 2, 3, 4].map((k) => ({ x: r * (0.5 + rand(k, 5)), y: r * (0.5 + rand(k, 6)), r: r * (0.12 + 0.14 * rand(k, 7)) }));
  return discImage(`ff-moon:${c.moon}:${c.moonShade}`, r, (x, y) => {
    const rim = (x - r + (y - r) * 0.4) / r > 0.55 + bayer(x, y) * 0.5;
    return rim || craters.some((p) => Math.hypot(x - p.x, y - p.y) < p.r) ? shade : lit;
  });
};

const moon = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const r = Math.round(unitOf(f) * 0.075);
  const cx = Math.round(f.w * 0.68);
  const cy = Math.round(Math.min(f.h * 0.2, unitOf(f) * 0.3));
  drawGlow(ctx, c.moonGlow, cx, cy, r * 3.2, r * 3.2, 0.7);
  ctx.drawImage(moonImage(r, c), cx - r, cy - r);
};

// One row of trees, drawn once into a canvas that tiles horizontally with period P.
const paintTrees = (ctx: Ctx, f: Frame, k: number, color: string): void => {
  const p = periodOf(f);
  const base = baseOf(f, k);
  const height = (0.2 + 0.13 * k) * tallOf(f);
  const step = Math.max(4, height * (k === LAYERS - 1 ? 0.75 : 0.22 + 0.1 * k));
  for (let i = 0, x = rand(k, 1) * step; x < p; i++, x += step * (0.6 + 0.8 * rand(i, k + 2))) {
    const hgt = height * (0.7 + 0.45 * rand(i, k + 3));
    for (const dx of [-p, 0, p]) pine(ctx, x + dx, base + 1, hgt, color);
  }
  fillRect(ctx, color, 0, base, p, f.h - base);
};

const paintUndergrowth = (ctx: Ctx, f: Frame, color: string): void => {
  const p = periodOf(f);
  const base = baseOf(f, LAYERS - 1);
  ctx.fillStyle = color;
  for (let x = 0; x < p; x += 2 + Math.floor(rand(x, 9) * 4)) {
    const hgt = 2 + Math.floor(rand(x, 10) * (5 + unitOf(f) * 0.03));
    ctx.fillRect(x, base - hgt, 1, hgt);
    if (rand(x, 11) < 0.3) spanDisc(ctx, x, base - 1, 2 + Math.floor(rand(x, 12) * 3));
  }
};

const forestLayer = (ctx: Ctx, f: Frame, c: Colors<K>, k: number): void => {
  const p = periodOf(f);
  const color = c[TREE_KEYS[k] as K];
  const layer = memoLayer(`ff-trees:${k}:${f.w}x${f.h}:${colorKey(c)}`, p, f.h, (g) => {
    paintTrees(g, f, k, color);
    if (k === LAYERS - 1) paintUndergrowth(g, f, color);
  });
  const offset = -Math.round(wrap(f.t * (0.5 + 0.7 * k + 0.3 * k * k), p));
  ctx.drawImage(layer, offset, 0);
  ctx.drawImage(layer, offset + p, 0);
};

// A band of mist lying just above where a row of trees meets the ground.
const mist = (ctx: Ctx, f: Frame, c: Colors<K>, k: number): void => {
  const base = baseOf(f, k);
  const u = unitOf(f);
  const band = Math.max(2, Math.round(u * 0.035));
  [0.25, 0.1875, 0.125, 0.0625].forEach((level, i) => {
    fillDither(ctx, c.mist, level, 0, base - band * (i + 1), f.w, band);
  });
};

type Fly = { readonly x: number; readonly y: number; readonly glow: number };

// Where firefly i is now and how bright: it wanders around a home spot and lights up on its own beat of four.
const flyOf = (f: Frame, i: number): Fly => {
  const top = baseOf(f, 0) - unitOf(f) * 0.12;
  const hx = rand(i, 40) * f.w;
  const hy = top + rand(i, 41) * (f.h - top - 4);
  const x = hx + Math.sin(f.t * (0.3 + 0.4 * rand(i, 42)) + i) * 10 + Math.sin(f.t * 1.7 + i * 3) * 1.5;
  const y = hy + Math.cos(f.t * (0.25 + 0.35 * rand(i, 43)) + i * 2) * 6;
  const p = frac((f.beat + Math.floor(rand(i, 44) * 4)) / 4);
  const glow = p < 0.06 ? p / 0.06 : Math.max(0, 1 - (p - 0.06) / 0.45);
  return { x: Math.round(x), y: Math.round(y), glow };
};

const firefly = (ctx: Ctx, fly: Fly, c: Colors<K>, near: boolean): void => {
  if (fly.glow > 0.6) {
    drawGlow(ctx, c.flyGlow, fly.x, fly.y, near ? 6 : 4, near ? 6 : 4, 0.5);
    fillRect(ctx, c.flyGlow, fly.x - 1, fly.y, 3, 1);
    fillRect(ctx, c.flyGlow, fly.x, fly.y - 1, 1, 3);
    fillRect(ctx, c.fly, fly.x, fly.y, 1, 1);
  } else if (fly.glow > 0.25) {
    drawGlow(ctx, c.flyGlow, fly.x, fly.y, near ? 4 : 3, near ? 4 : 3, 0.4);
    fillRect(ctx, c.fly, fly.x, fly.y, 1, 1);
  } else if (fly.glow > 0.05) fillRect(ctx, c.flyGlow, fly.x, fly.y, 1, 1);
};

const fireflies = (ctx: Ctx, f: Frame, c: Colors<K>, near: boolean): void => {
  const count = Math.round((f.w * f.h) / 1100 + f.energy * 16);
  for (let i = near ? 1 : 0; i < count; i += near ? 1 : 3) {
    if (near && i % 3 === 0) continue;
    firefly(ctx, flyOf(f, i), c, near);
  }
};

const forest = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  for (let k = 0; k < LAYERS; k++) {
    forestLayer(ctx, f, c, k);
    if (k < LAYERS - 1) mist(ctx, f, c, k);
    if (k === 1) fireflies(ctx, f, c, false);
  }
  fireflies(ctx, f, c, true);
};

export const fireflyForest = defineScene<K>({
  id: 'firefly-forest',
  title: 'Firefly Forest',
  mood: { valence: 0.4, energy: -0.7 },
  styles: ['starlit-dream', 'lofi-loop', 'cozy-village'],
  variants: [
    {
      mood: { valence: 0.55, energy: -0.6 },
      colors: {
        sky0: '#08102c',
        sky1: '#122a4c',
        sky2: '#21506a',
        star: '#d4ecff',
        moon: '#f6f2d4',
        moonShade: '#c4c4a8',
        moonGlow: '#3a6a80',
        tree0: '#1c4256',
        tree1: '#132e40',
        tree2: '#0b1e2c',
        tree3: '#050d17',
        mist: '#5a8e96',
        fly: '#f6ffc4',
        flyGlow: '#a6e65e',
      },
    },
    {
      mood: { valence: 0.2, energy: -0.8 },
      colors: {
        sky0: '#110a28',
        sky1: '#2a1748',
        sky2: '#4c2c62',
        star: '#ffe8f6',
        moon: '#ffeccc',
        moonShade: '#d4b49e',
        moonGlow: '#6a4278',
        tree0: '#3c2854',
        tree1: '#2b1c40',
        tree2: '#1b112c',
        tree3: '#0b0616',
        mist: '#86659a',
        fly: '#fff4c8',
        flyGlow: '#ffae4e',
      },
    },
  ],
  layers: [sky, moon, forest],
});
