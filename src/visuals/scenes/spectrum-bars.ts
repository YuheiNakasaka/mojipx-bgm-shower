// A retro equalizer: LED bars bounce to a pseudo-spectrum (lows on the kick, mids on the snare, highs on the hats),
// peak markers fall back slowly, and a dithered reflection shimmers on the glossy floor.
import { type Ctx, fillRect } from 'mojipx';
import { bayer, ditherGradient, frac, noise1, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { clamp01, memoLayer, sigOf } from './batch-3-helpers.ts';

type K = 'bg0' | 'bg1' | 'bg2' | 'star' | 'lo' | 'mid' | 'hi' | 'off' | 'peak' | 'rLo' | 'rMid' | 'rHi' | 'floor' | 'glow' | 'flash';

type Layout = {
  readonly y0: number;
  readonly n: number;
  readonly pitch: number;
  readonly bw: number;
  readonly x0: number;
  readonly sp: number;
  readonly segs: number;
};

const layoutOf = (f: Frame): Layout => {
  const y0 = Math.round(f.h * (f.h > f.w ? 0.7 : 0.66));
  const room = y0 - Math.round(f.h * (f.h > f.w ? 0.2 : 0.12));
  const sp = Math.min(7, Math.max(3, Math.round(room / 22)));
  const mx = Math.round(f.w * 0.06);
  const n = Math.min(40, Math.max(12, Math.round((f.w - 2 * mx) / 9)));
  const pitch = Math.floor((f.w - 2 * mx) / n);
  return { y0, n, pitch, bw: Math.max(3, pitch - 2), x0: Math.floor((f.w - n * pitch + 2) / 2), sp, segs: Math.floor(room / sp) };
};

// ---- the pseudo-spectrum: a pure function of the band and the beat, so past values (for the peaks) can be recomputed ----

const kickEnv = (b: number): number => Math.exp(-frac(b) * 5);
const snareEnv = (b: number): number => (Math.floor(b) % 2 === 1 ? Math.exp(-frac(b) * 6) : 0);
const hatEnv = (b: number): number => Math.exp(-frac(b * 2) * 7);

const levelAt = (u: number, i: number, b: number, gain: number): number => {
  const wander = noise1(b * 0.7 + i * 0.37, 7);
  const body = (0.6 - 0.24 * u) * (0.2 + 0.8 * wander * wander) + 0.1 * Math.sin(b * 0.4 + u * 5);
  const flicker = 0.16 * noise1(b * 3.1 + i * 1.3, 13);
  const low = kickEnv(b) * Math.max(0, 1 - u * 2.2) * (0.45 + 0.25 * noise1(b, 3));
  const mid = snareEnv(b) * Math.exp(-((u - 0.6) ** 2) / 0.03) * 0.5;
  const high = hatEnv(b) * Math.max(0, u - 0.5) * 0.6 * noise1(b * 2 + i, 5);
  return clamp01((body + flicker + low + mid + high) * gain);
};

// The highest recent level, falling back under gravity: what a peak-hold marker shows.
const peakAt = (u: number, i: number, b: number, gain: number): number => {
  let best = levelAt(u, i, b, gain);
  for (let k = 1; k <= 12; k++) best = Math.max(best, levelAt(u, i, b - k * 0.1, gain) - 0.8 * (k * 0.1) ** 2);
  return best;
};

// ---- cached LED columns ----

const segColor = (s: number, segs: number, lo: string, mid: string, hi: string): string => {
  const u = s / segs;
  return u < 0.45 ? lo : u < 0.74 ? mid : hi;
};

const ledColumn = (l: Layout, c: Colors<K>, lit: boolean): HTMLCanvasElement =>
  memoLayer(`eq-col:${lit}:${l.bw}:${l.sp}:${l.segs}:${sigOf(c)}`, l.bw, l.segs * l.sp, (ctx) => {
    for (let s = 0; s < l.segs; s++) {
      const y = (l.segs - 1 - s) * l.sp + 1;
      fillRect(ctx, lit ? segColor(s, l.segs, c.lo, c.mid, c.hi) : c.off, 0, y, l.bw, l.sp - 1);
    }
  });

// The reflection: segments mirrored below the floor line, dimmer, and thinning out through the Bayer matrix.
const reflColumn = (l: Layout, c: Colors<K>, fade: number): HTMLCanvasElement =>
  memoLayer(`eq-refl:${l.bw}:${l.sp}:${l.segs}:${fade}:${sigOf(c)}`, l.bw, l.segs * l.sp, (ctx) => {
    const total = l.segs * l.sp;
    for (let y = 0; y < total; y++) {
      if (y % l.sp === l.sp - 1) continue;
      const color = segColor(Math.floor(y / l.sp), l.segs, c.rLo, c.rMid, c.rHi);
      const keep = 0.8 * (1 - y / Math.min(total, fade));
      for (let x = 0; x < l.bw; x++) if (bayer(x, y) < keep) fillRect(ctx, color, x, y, 1, 1);
    }
  });

const halo = (w: number, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`eq-halo:${w}:${c.glow}`, w, 8, (ctx) => {
    for (let y = 0; y < 8; y++) for (let x = 0; x < w; x++) if (bayer(x, y) < 0.06 * (y + 1)) fillRect(ctx, c.glow, x, y, 1, 1);
  });

// ---- layers ----

const backdrop = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  ctx.drawImage(ditherGradient(f.w, l.y0, [c.bg0, c.bg1, c.bg2]), 0, 0);
  stars(ctx, f.w, f.h, f.t, [c.star], Math.round((f.w * f.h) / 1400), 31, 0.5);
  fillRect(ctx, c.floor, 0, l.y0, f.w, f.h - l.y0);
  ctx.drawImage(halo(f.w, c), 0, l.y0 - 8);
};

const bars = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const gain = 0.85 + 0.35 * f.energy;
  const lit = ledColumn(l, c, true);
  const off = ledColumn(l, c, false);
  const full = l.segs * l.sp;
  const floorRoom = f.h - l.y0 - 2;
  const refl = reflColumn(l, c, Math.round(Math.min(110, Math.max(30, floorRoom * 0.8))));
  for (let i = 0; i < l.n; i++) {
    const u = i / (l.n - 1);
    const x = l.x0 + i * l.pitch;
    const tall = Math.max(1, Math.round(levelAt(u, i, f.beat, gain) * l.segs)) * l.sp;
    ctx.drawImage(off, x, l.y0 - full);
    ctx.drawImage(lit, 0, full - tall, l.bw, tall, x, l.y0 - tall, l.bw, tall);
    const rh = Math.min(tall, floorRoom);
    if (rh > 0) ctx.drawImage(refl, 0, 0, l.bw, rh, x, l.y0 + 2, l.bw, rh);
    const peak = Math.max(tall / l.sp, Math.round(peakAt(u, i, f.beat, gain) * l.segs));
    fillRect(ctx, c.peak, x, l.y0 - peak * l.sp - 2, l.bw, Math.max(1, l.sp - 2));
  }
};

const floorLine = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const { y0 } = layoutOf(f);
  fillRect(ctx, f.kick > 0.45 ? c.flash : c.glow, 0, y0, f.w, 1);
  if (f.kick > 0.2) fillRect(ctx, c.glow, 0, y0 - 1, f.w, 1);
};

export const spectrumBars = defineScene<K>({
  id: 'spectrum-bars',
  title: 'Spectrum Bars',
  mood: { valence: 0.4, energy: 0.7 },
  styles: ['neon-rush', 'nineties-pop', 'puzzle-pop'],
  variants: [
    {
      mood: { valence: 0.6, energy: 0.75 },
      colors: {
        bg0: '#07031a',
        bg1: '#170a3d',
        bg2: '#35125e',
        star: '#b9a6ff',
        lo: '#26d9f0',
        mid: '#b65cff',
        hi: '#ff5fb4',
        off: '#1d1145',
        peak: '#ffffff',
        rLo: '#0f5a73',
        rMid: '#4c2680',
        rHi: '#70295f',
        floor: '#05021a',
        glow: '#f3a6ff',
        flash: '#ffffff',
      },
    },
    {
      mood: { valence: 0.1, energy: 0.55 },
      colors: {
        bg0: '#010604',
        bg1: '#03130d',
        bg2: '#082a1c',
        star: '#5fc98d',
        lo: '#3ee07f',
        mid: '#f2e04a',
        hi: '#ff5536',
        off: '#0b2216',
        peak: '#eafff1',
        rLo: '#145c33',
        rMid: '#5c5520',
        rHi: '#6a2418',
        floor: '#010403',
        glow: '#8dffbe',
        flash: '#eafff1',
      },
    },
    {
      mood: { valence: -0.3, energy: 0.75 },
      colors: {
        bg0: '#020616',
        bg1: '#06183a',
        bg2: '#0b2f5e',
        star: '#9fd8ff',
        lo: '#3d8bff',
        mid: '#5ff0ff',
        hi: '#eaffff',
        off: '#0a1a3a',
        peak: '#ffe066',
        rLo: '#173a75',
        rMid: '#1f6a80',
        rHi: '#5f7f8f',
        floor: '#01030c',
        glow: '#7fe8ff',
        flash: '#ffffff',
      },
    },
  ],
  layers: [backdrop, bars, floorLine],
});
