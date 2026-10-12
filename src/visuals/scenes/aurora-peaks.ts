// Aurora over snowy mountains: two curtains of light rippling across the stars, their folds drifting,
// mirrored with the peaks in a frozen lake, and a snowbank with small pines in front.
import { type Ctx, fillRect } from 'mojipx';
import { ditherGradient, noise1, rand, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { colorKey, ditherStyle, fillDither, memoLayer, paintRange, pine } from './batch-1-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'star'
  | 'aurora0'
  | 'aurora1'
  | 'aurora2'
  | 'rock'
  | 'snow'
  | 'snowShade'
  | 'ice'
  | 'iceShade'
  | 'pine';

const unitOf = (f: Frame): number => Math.min(f.w, f.h);
const shoreOf = (f: Frame): number => Math.round(f.h * 0.62 - (f.h - unitOf(f)) * 0.06);
const bankOf = (f: Frame): number => Math.round(f.h - 0.08 * unitOf(f));

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const hz = shoreOf(f);
  ctx.drawImage(ditherGradient(f.w, hz, [c.sky0, c.sky1, c.sky2]), 0, 0);
  stars(ctx, f.w, hz, f.t, [c.star, c.snowShade], Math.round((f.w * hz) / 300), 401, 0.85);
};

type Curtain = { readonly seed: number; readonly base: number; readonly height: number; readonly speed: number };

type Band = { readonly style: string | CanvasPattern; readonly share: number };

// The bands of a curtain from the hem upward: a thin solid glow, then light thinning into a tinted fringe.
const bandsOf = (ctx: Ctx, c: Colors<K>): readonly Band[] =>
  (
    [
      [c.aurora1, 1, 0.06],
      [c.aurora1, 0.5, 0.2],
      [c.aurora1, 0.25, 0.28],
      [c.aurora2, 0.25, 0.22],
      [c.aurora2, 0.125, 0.24],
    ] as const
  ).flatMap(([color, level, share]) => {
    const style = ditherStyle(ctx, color, level);
    return style ? [{ style, share }] : [];
  });

// One fold of a curtain, two pixels wide, hanging up from a bright hem.
const fold = (ctx: Ctx, c: Colors<K>, bands: readonly Band[], x: number, hem: number, height: number, lift: number): void => {
  fillRect(ctx, c.aurora0, x, hem - 1, 2, 1);
  let y = hem - 1;
  bands.forEach((band, i) => {
    const rows = Math.round(band.share * height + (i === 0 ? lift : 0));
    y -= rows;
    if (rows <= 0) return;
    ctx.fillStyle = band.style;
    ctx.fillRect(x, y, 2, rows);
  });
};

const curtain = (ctx: Ctx, f: Frame, c: Colors<K>, cur: Curtain): void => {
  const u = unitOf(f);
  const bands = bandsOf(ctx, c);
  for (let x = 0; x < f.w; x += 2) {
    const ray = noise1(x * 0.11 + f.t * cur.speed, cur.seed + 2);
    if (ray < 0.12) continue;
    const wave = Math.sin(x * 0.02 + f.t * 0.3 + cur.seed) * u * 0.05 + (noise1(x * 0.01 - f.t * 0.1, cur.seed) - 0.5) * u * 0.2;
    const height = cur.height * (0.35 + 0.65 * noise1(x * 0.018 - f.t * 0.15, cur.seed + 1)) * (0.4 + 0.6 * ray);
    fold(ctx, c, bands, x, Math.round(cur.base + wave), height, f.kick * 2);
  }
};

const aurora = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const hz = shoreOf(f);
  const u = unitOf(f);
  const tall = u * 0.42 + (f.h - u) * 0.12;
  curtain(ctx, f, c, { seed: 420, base: hz * 0.72, height: tall * 0.65, speed: -0.25 });
  curtain(ctx, f, c, { seed: 410, base: hz * 0.5, height: tall * (0.85 + 0.2 * f.energy), speed: 0.35 });
};

const paintPeaks = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const hz = shoreOf(f);
  const u = unitOf(f);
  paintRange(g, f.w, hz, u * 0.32 + (f.h - u) * 0.1, 430, { rock: c.sky2, lit: c.snowShade, shade: c.rock }, 0.5);
  paintRange(g, f.w, hz, u * 0.2 + (f.h - u) * 0.05, 440, { rock: c.rock, lit: c.snow, shade: c.snowShade }, 0.45);
};

const peaks = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(
    memoLayer(`ap-peaks:${f.w}x${f.h}:${colorKey(c)}`, f.w, f.h, (g) => paintPeaks(g, f, c)),
    0,
    0,
  );
};

// The lake mirrors everything above the shore line, then a sheet of ice dims the reflection.
const lake = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const hz = shoreOf(f);
  const depth = Math.min(hz, bankOf(f) - hz + 2);
  ctx.save();
  ctx.translate(0, hz * 2);
  ctx.scale(1, -1);
  ctx.drawImage(ctx.canvas, 0, hz - depth, f.w, depth, 0, hz - depth, f.w, depth);
  ctx.restore();
  fillDither(ctx, c.ice, 0.5, 0, hz, f.w, depth);
  ctx.drawImage(
    memoLayer(`ap-ice:${f.w}x${f.h}:${colorKey(c)}`, f.w, f.h, (g) => paintIce(g, f, c)),
    0,
    0,
  );
};

// Streaks and cracks on the ice, longer toward the viewer.
const paintIce = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const hz = shoreOf(f);
  const depth = bankOf(f) - hz;
  fillRect(g, c.snowShade, 0, hz, f.w, 1);
  for (let i = 0; i < f.w / 6; i++) {
    const d = rand(i, 450) ** 1.5;
    const y = Math.round(hz + 2 + d * depth);
    const len = Math.round(3 + d * 24 * rand(i, 451));
    fillRect(g, c.iceShade, Math.round(rand(i, 452) * f.w), y, len, 1);
  }
};

const paintBank = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const bank = bankOf(f);
  const u = unitOf(f);
  g.fillStyle = c.snow;
  for (let x = 0; x < f.w; x++) {
    const top = Math.round(bank - 2 - noise1(x / 14, 460) * u * 0.05);
    g.fillRect(x, top, 1, f.h - top);
  }
  fillDither(g, c.snowShade, 0.5, 0, f.h - Math.round(u * 0.03), f.w, Math.round(u * 0.03));
  for (let i = 0, x = rand(0, 461) * 20; x < f.w; i++, x += 14 + rand(i, 462) * 40) {
    pine(g, x, bank + 2, u * (0.08 + 0.1 * rand(i, 463)), c.pine, c.snowShade);
  }
};

const bank = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(
    memoLayer(`ap-bank:${f.w}x${f.h}:${colorKey(c)}`, f.w, f.h, (g) => paintBank(g, f, c)),
    0,
    0,
  );
};

export const auroraPeaks = defineScene<K>({
  id: 'aurora-peaks',
  title: 'Aurora Peaks',
  mood: { valence: -0.2, energy: -0.7 },
  styles: ['starlit-dream', 'snowfall'],
  variants: [
    {
      mood: { valence: -0.05, energy: -0.6 },
      colors: {
        sky0: '#02040e',
        sky1: '#071430',
        sky2: '#14294c',
        star: '#e0f0ff',
        aurora0: '#d0ffe0',
        aurora1: '#3ee08c',
        aurora2: '#8c5cdc',
        rock: '#1a2236',
        snow: '#dce8f6',
        snowShade: '#7a8cb0',
        ice: '#162c48',
        iceShade: '#5c86ac',
        pine: '#0a1422',
      },
    },
    {
      mood: { valence: -0.4, energy: -0.8 },
      colors: {
        sky0: '#05020e',
        sky1: '#140a30',
        sky2: '#28184c',
        star: '#f6e8ff',
        aurora0: '#ffd8f4',
        aurora1: '#d24cd2',
        aurora2: '#4c7ce2',
        rock: '#1e1630',
        snow: '#e8e0f6',
        snowShade: '#8a7cb0',
        ice: '#1e1640',
        iceShade: '#7a6aaa',
        pine: '#0c0a1c',
      },
    },
  ],
  layers: [sky, aurora, peaks, lake, bank],
});
