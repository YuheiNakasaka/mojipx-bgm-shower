// A neon horizon: a striped sun sinking behind ridges, and a grid floor rushing toward the viewer on the beat.
import { type Ctx, fillRect } from 'mojipx';
import { disc, ditherGradient, fillColumns, frac, memoLayer, pixelLine, ridgeNoise, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sky3'
  | 'star'
  | 'sunTop'
  | 'sunMid'
  | 'sunLow'
  | 'ridgeFar'
  | 'ridgeNear'
  | 'glow'
  | 'floor'
  | 'grid'
  | 'gridFar'
  | 'gridHot';

const horizonOf = (f: Frame): number => Math.round(f.h * 0.58);

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(ditherGradient(f.w, horizonOf(f), [c.sky0, c.sky1, c.sky2, c.sky3]), 0, 0);
  stars(ctx, f.w, f.h, f.t, [c.star], Math.round((f.w * f.h) / 900), 7, 0.4);
};

const sun = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const horizon = horizonOf(f);
  const r = Math.round(Math.min(f.w, f.h) * 0.22);
  const cy = horizon - Math.round(r * 0.45);
  const scroll = f.t * 6;
  disc(ctx, f.w / 2, cy, r, (dy) => {
    if (cy + dy >= horizon) return null;
    const lower = dy / r;
    // Gaps widen toward the bottom and drift downward.
    if (lower > -0.1 && frac((dy + scroll) / 7) < 0.15 + lower * 0.35) return null;
    return lower < -0.35 ? c.sunTop : lower < 0.2 ? c.sunMid : c.sunLow;
  });
};

const ridges = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const horizon = horizonOf(f);
  const far = f.h * 0.12;
  fillColumns(ctx, f.w, horizon, c.ridgeFar, (x) => horizon - far * ridgeNoise((x + f.t * 2) / 38, 3));
  fillColumns(ctx, f.w, horizon, c.ridgeNear, (x) => horizon - far * 0.55 * ridgeNoise((x + f.t * 5) / 22, 9));
  fillRect(ctx, c.glow, 0, horizon - 1, f.w, 1);
};

const floor = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const horizon = horizonOf(f);
  const depth = f.h - horizon;
  fillRect(ctx, c.floor, 0, horizon, f.w, depth);
  const lit = f.kick > 0.5 ? c.gridHot : c.grid;
  // Horizontal lines: one row passes per beat, spaced by perspective; the farthest few are dimmer.
  const phase = frac(f.beat);
  for (let k = 0; k < 8; k++) {
    const z = k + 1 - phase;
    const y = horizon + Math.round((depth * 1.1) / z);
    if (y > horizon + 1 && y < f.h) fillRect(ctx, z > 5 ? c.gridFar : lit, 0, y, f.w, 1);
  }
  // Rays from the vanishing point never move, so they are drawn once per size; the centre ray lights up on the kick.
  const cx = f.w / 2;
  const spread = f.w * 1.6;
  const rays = memoLayer(`sunset-rays:${f.w}x${f.h}:${horizon}:${c.grid}`, f.w, f.h, (layer) => {
    for (let i = -10; i <= 10; i++) pixelLine(layer, cx + i * 3, horizon, cx + (i / 10) * spread, f.h + 2, c.grid);
  });
  ctx.drawImage(rays, 0, 0);
  pixelLine(ctx, cx, horizon, cx, f.h + 2, lit);
  fillRect(ctx, c.glow, 0, horizon, f.w, 1);
};

export const sunsetGrid = defineScene<K>({
  id: 'sunset-grid',
  title: 'Sunset Grid',
  mood: { valence: 0.3, energy: 0.7 },
  styles: ['neon-rush', 'nineties-pop', 'city-lights', 'star-fighter'],
  variants: [
    {
      mood: { valence: 0.6, energy: 0.6 },
      colors: {
        sky0: '#1b0b3a',
        sky1: '#4a1460',
        sky2: '#a3206e',
        sky3: '#f2665a',
        star: '#ffd9f2',
        sunTop: '#ffe066',
        sunMid: '#ffa23a',
        sunLow: '#ff4f7b',
        ridgeFar: '#3a0f4f',
        ridgeNear: '#240838',
        glow: '#ff9bd8',
        floor: '#12052a',
        grid: '#c23be0',
        gridFar: '#5e1d82',
        gridHot: '#ffffff',
      },
    },
    {
      mood: { valence: -0.3, energy: 0.6 },
      colors: {
        sky0: '#020414',
        sky1: '#06123a',
        sky2: '#0b3a6e',
        sky3: '#1c8ab0',
        star: '#bff6ff',
        sunTop: '#e8ffff',
        sunMid: '#58e6ff',
        sunLow: '#2b7cff',
        ridgeFar: '#071c3d',
        ridgeNear: '#030d24',
        glow: '#7ff9ff',
        floor: '#01020e',
        grid: '#18b8ff',
        gridFar: '#0b3f78',
        gridHot: '#eaffff',
      },
    },
  ],
  layers: [sky, sun, ridges, floor],
});
