// Colorful blocks rain down on the sixteenth notes and stack up; every two bars the full bottom row lights up from
// left to right, bursts on the downbeat, and the stack drops by one.
//
// No state: each cycle drops exactly one block into every column (in a shuffled order) and clears exactly one row, so
// the stack's profile is the same at the start of every cycle and any moment can be rebuilt from the beat.
import { type Ctx, fillRect, mixColor } from 'mojipx';
import { cached, ditherGradient, frac, noise1, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { clamp01, memoLayer } from './batch-3-helpers.ts';

type K = 'bg0' | 'bg1' | 'bg2' | 'grid' | 'gridHot' | 'outline' | 'flash' | 'h0' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5';

const HUES = ['h0', 'h1', 'h2', 'h3', 'h4', 'h5'] as const;
const CELL = 10;
const DROP = 0.35;
const FLASH = 0.6;

type Well = { readonly cols: number; readonly left: number; readonly cycle: number; readonly peak: number };

const wellOf = (f: Frame): Well => {
  const cols = Math.max(1, Math.floor(f.w / CELL));
  const peak = Math.max(4, Math.round((f.h / CELL) * 0.28));
  return { cols, left: Math.floor((f.w - cols * CELL) / 2), cycle: 8 * Math.max(1, Math.ceil(cols / 30)), peak };
};

// The resting height above the clearing row: from one block up to the well's peak, smooth across neighbouring columns.
const profileOf = (w: Well, c: number): number => 1 + Math.floor((w.peak - 0.01) * noise1(c * 0.45, 9) ** 1.3);

// Slot of every column in cycle k: the columns sorted by a hash, spread over the cycle's sixteenth notes.
const orders = new Map<string, Int16Array>();
const slotsOf = (w: Well, k: number): Int16Array =>
  cached(orders, 16, `${w.cols}:${k}`, () => {
    const ranked = Array.from({ length: w.cols }, (_, c) => c).sort((a, b) => rand(k, a + 500) - rand(k, b + 500));
    const slots = new Int16Array(w.cols);
    const sixteenths = w.cycle * 4 - 3;
    ranked.forEach((c, j) => {
      slots[c] = Math.floor((j * sixteenths) / w.cols);
    });
    return slots;
  });

/** The beat at which column c's block of cycle k lands. */
const landingOf = (w: Well, k: number, c: number): number => k * w.cycle + 0.5 + (slotsOf(w, k)[c] ?? 0) * 0.25;

const hueOf = (cycle: number, c: number): (typeof HUES)[number] => HUES[Math.floor(rand(cycle + 1000, c) * HUES.length)] ?? 'h0';

// ---- block tiles ----

const tileOf = (color: string, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`blocks-tile:${color}:${c.outline}`, CELL, CELL, (g) => {
    fillRect(g, mixColor(color, c.outline, 0.45), 0, 0, CELL, CELL);
    fillRect(g, color, 1, 1, CELL - 2, CELL - 2);
    fillRect(g, mixColor(color, '#ffffff', 0.45), 1, 1, CELL - 2, 1);
    fillRect(g, mixColor(color, '#ffffff', 0.45), 1, 1, 1, CELL - 2);
    fillRect(g, mixColor(color, c.outline, 0.25), 2, CELL - 2, CELL - 3, 1);
    fillRect(g, mixColor(color, c.outline, 0.25), CELL - 2, 2, 1, CELL - 3);
    fillRect(g, '#ffffff', 2, 2, 2, 1);
    fillRect(g, '#ffffff', 2, 3, 1, 1);
  });

const block = (ctx: Ctx, img: HTMLCanvasElement, x: number, y: number, squash: boolean): void => {
  if (squash) ctx.drawImage(img, x - 1, y + 2, CELL + 2, CELL - 2);
  else ctx.drawImage(img, x, y);
};

// ---- layers ----

const gridImage = (f: Frame, w: Well, color: string): HTMLCanvasElement =>
  memoLayer(`blocks-grid:${f.w}x${f.h}:${color}`, f.w, f.h, (g) => {
    for (let x = w.left; x <= f.w; x += CELL) for (let y = f.h; y >= 0; y -= CELL) fillRect(g, color, x - 1, y - 1, 1, 1);
  });

const miniTile = (color: string, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`blocks-mini:${color}:${c.bg1}`, 4, 4, (g) => {
    fillRect(g, mixColor(color, c.bg1, 0.55), 0, 0, 4, 4);
    fillRect(g, mixColor(color, c.bg1, 0.3), 0, 0, 3, 1);
  });

// Far-off blocks drifting down behind the well, for depth.
const drizzle = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const n = Math.round((f.w * f.h) / 1800);
  for (let i = 0; i < n; i++) {
    const x = Math.floor(rand(i, 71) * f.w);
    const y = Math.floor(frac(rand(i, 72) + (f.beat * (0.05 + 0.04 * rand(i, 73)) * 180) / f.h) * (f.h + 4)) - 4;
    ctx.drawImage(miniTile(c[HUES[i % HUES.length] ?? 'h0'], c), x, y);
  }
};

const board = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(ditherGradient(f.w, f.h, [c.bg0, c.bg1, c.bg2]), 0, 0);
  drizzle(ctx, f, c);
  ctx.drawImage(gridImage(f, wellOf(f), f.kick > 0.5 ? c.gridHot : c.grid), 0, 0);
};

type Moment = { readonly t: number; readonly n: number; readonly raise: number; readonly sweep: number };

const momentOf = (f: Frame, w: Well): Moment => {
  const t = Math.max(0, f.beat);
  const n = Math.floor(t / w.cycle);
  const since = t - n * w.cycle;
  const raise = n > 0 ? (1 - clamp01(since / DROP)) ** 2 : 0;
  const sweep = clamp01((since - (w.cycle - FLASH)) / FLASH);
  return { t, n, raise, sweep };
};

const stackColumn = (ctx: Ctx, f: Frame, c: Colors<K>, w: Well, m: Moment, col: number): void => {
  const x = w.left + col * CELL;
  const landed = landingOf(w, m.n, col) <= m.t;
  const height = profileOf(w, col) + (landed ? 1 : 0);
  const lit = m.sweep > 0 && col / w.cols < m.sweep * 1.15;
  for (let level = 0; level < height; level++) {
    const y = Math.round(f.h - (level + 1 + m.raise) * CELL);
    const cycle = m.n + level - profileOf(w, col);
    const top = level === height - 1;
    const squash = top && landed && m.t - landingOf(w, m.n, col) < 0.12;
    const color = level === 0 && lit ? c.flash : c[hueOf(cycle, col)];
    block(ctx, tileOf(color, c), x, y, squash);
  }
};

const stack = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const w = wellOf(f);
  const m = momentOf(f, w);
  for (let col = 0; col < w.cols; col++) stackColumn(ctx, f, c, w, m, col);
};

// Blocks still in the air: this cycle's that have not landed yet and the next cycle's that have set off.
const falling = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const w = wellOf(f);
  const m = momentOf(f, w);
  const g = f.h / 7;
  for (let k = m.n; k <= m.n + 1; k++)
    for (let col = 0; col < w.cols; col++) {
      const land = landingOf(w, k, col);
      if (land <= m.t) continue;
      const level = profileOf(w, col) + k - m.n + m.raise;
      const y = f.h - (level + 1) * CELL - g * (land - m.t) ** 2;
      if (y > -CELL) block(ctx, tileOf(c[hueOf(k, col)], c), w.left + col * CELL, Math.round(y), false);
    }
};

const spark = (ctx: Ctx, color: string, x: number, y: number, age: number, i: number, n: number): void => {
  const vx = (rand(i, n) - 0.5) * 40;
  const vy = 40 + 50 * rand(i, n + 7);
  const size = age < 0.6 ? 2 : 1;
  fillRect(ctx, color, Math.round(x + vx * age), Math.round(y - vy * age + 70 * age * age), size, size);
};

// The cleared row: a glare line, then its blocks burst into sparks that arc and fall.
const burst = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const w = wellOf(f);
  const m = momentOf(f, w);
  const age = m.t - m.n * w.cycle;
  if (m.n === 0 || age > 1.2) return;
  const y0 = f.h - CELL / 2;
  const fresh = age < 0.12;
  if (age < 0.25) fillRect(ctx, c.flash, 0, y0 - (fresh ? 2 : 1), f.w, fresh ? 4 : 2);
  for (let col = 0; col < w.cols; col++) {
    const color = age < 0.15 ? c.flash : c[hueOf(m.n - 1 - profileOf(w, col), col)];
    const x = w.left + col * CELL + CELL / 2;
    spark(ctx, color, x, y0, age, col * 2, m.n);
    spark(ctx, color, x, y0, age, col * 2 + 1, m.n);
  }
};

export const blockRain = defineScene<K>({
  id: 'block-rain',
  title: 'Block Rain',
  mood: { valence: 0.6, energy: 0.3 },
  styles: ['puzzle-pop'],
  variants: [
    {
      mood: { valence: 0.7, energy: 0.35 },
      colors: {
        bg0: '#d9e4ff',
        bg1: '#f2e2ff',
        bg2: '#ffe6ef',
        grid: '#bfc8f0',
        gridHot: '#ffffff',
        outline: '#3a2a5a',
        flash: '#ffffff',
        h0: '#ff5f8f',
        h1: '#ffa53b',
        h2: '#ffd94a',
        h3: '#4fd18b',
        h4: '#4faeff',
        h5: '#a77bff',
      },
    },
    {
      mood: { valence: 0.3, energy: 0.1 },
      colors: {
        bg0: '#06061a',
        bg1: '#100c30',
        bg2: '#1c1446',
        grid: '#2c2462',
        gridHot: '#5a4aa0',
        outline: '#04030f',
        flash: '#fffbe8',
        h0: '#ff4f7b',
        h1: '#ff9a3a',
        h2: '#ffd84a',
        h3: '#3ee08f',
        h4: '#3aa8ff',
        h5: '#9a6bff',
      },
    },
  ],
  layers: [board, stack, falling, burst],
});
