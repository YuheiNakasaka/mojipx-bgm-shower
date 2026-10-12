// Dawn over layered mountain ridges: the sun climbs out from behind the far peaks, mist lies in the valleys,
// long clouds slide across the sky and a flock of birds flaps by, beating its wings in time.
import { type Ctx, drawSprite, fillRect, type Sprite } from 'mojipx';
import { bayer, disc, ditherGradient, frac, noise1, rand, ridgeNoise } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { drawGlow, memoLayer, paletteOf, wrap } from './batch-2-helpers.ts';

type K = 'sky0' | 'sky1' | 'sky2' | 'sky3' | 'sun' | 'glow' | 'cloud' | 'cloudLit' | 'r0' | 'r1' | 'r2' | 'r3' | 'r4' | 'rim' | 'bird';

type Ridge = {
  readonly base: number;
  readonly amp: number;
  readonly scale: number;
  readonly seed: number;
  readonly color: K;
  readonly rim: boolean;
};

const RIDGES: readonly Ridge[] = [
  { base: 0.64, amp: 0.2, scale: 64, seed: 2, color: 'r0', rim: true },
  { base: 0.72, amp: 0.18, scale: 52, seed: 5, color: 'r1', rim: true },
  { base: 0.81, amp: 0.17, scale: 44, seed: 9, color: 'r2', rim: true },
  { base: 0.91, amp: 0.16, scale: 38, seed: 14, color: 'r3', rim: false },
  { base: 1.02, amp: 0.17, scale: 34, seed: 21, color: 'r4', rim: false },
];

// Peaks: folded noise gives sharp summits and rounded valleys.
const ridgeY = (r: Ridge, h: number, x: number): number => {
  const n = ridgeNoise(x / r.scale, r.seed);
  const peak = 1 - Math.abs(n * 2 - 1);
  return h * (r.base - r.amp * (0.25 + peak * 0.6 + noise1(x / (r.scale * 4), r.seed + 3) * 0.35));
};

const sunXOf = (f: Frame): number => Math.round(f.w * (f.w > f.h ? 0.62 : 0.55));

const paintMist = (ctx: Ctx, f: Frame, r: Ridge, color: string): void => {
  const bottom = Math.round(f.h * r.base);
  const depth = Math.round(f.h * 0.1);
  ctx.fillStyle = color;
  for (let y = bottom - depth; y < Math.min(f.h, bottom); y++) {
    const density = ((y - (bottom - depth)) / depth) * 0.45;
    for (let x = 0; x < f.w; x++) if (bayer(x, y) < density && y > ridgeY(r, f.h, x)) ctx.fillRect(x, y, 1, 1);
  }
};

const paintRidge = (ctx: Ctx, f: Frame, c: Colors<K>, r: Ridge): void => {
  const sx = sunXOf(f);
  for (let x = 0; x < f.w; x++) {
    const y = Math.round(ridgeY(r, f.h, x));
    fillRect(ctx, c[r.color], x, y, 1, f.h - y);
    // Backlit rims, brightest close to the sun.
    const near = 1 - Math.abs(x - sx) / (f.w * 0.6);
    if (r.rim && bayer(x, y) < near) fillRect(ctx, c.rim, x, y, 1, 1);
  }
};

const ridgesLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`dawn-ridges:${[c.r0, c.r1, c.r2, c.r3, c.r4, c.rim, c.sky3].join(',')}:${sunXOf(f)}`, f.w, f.h, (ctx) => {
    RIDGES.forEach((r, i) => {
      paintRidge(ctx, f, c, r);
      if (i < RIDGES.length - 1) paintMist(ctx, f, r, c.sky3);
    });
  });

// The sun rises from behind the far ridge over the first half minute, then keeps creeping up.
const sunOf = (f: Frame): { readonly x: number; readonly y: number; readonly r: number } => {
  const r = Math.round(Math.min(f.w, f.h) * 0.1);
  const start = Math.min(f.h * (RIDGES[0] as Ridge).base - r * 1.1, ridgeY(RIDGES[0] as Ridge, f.h, sunXOf(f)) + r * 0.3);
  const end = f.h * (f.w > f.h ? 0.3 : 0.34);
  const rise = 1 - Math.exp(-f.t / 12);
  return { x: sunXOf(f), y: Math.round(start - (start - end) * rise - f.t * 0.05), r };
};

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(ditherGradient(f.w, Math.round(f.h * 0.8), [c.sky0, c.sky1, c.sky2, c.sky3, c.glow]), 0, 0);
  fillRect(ctx, c.glow, 0, Math.round(f.h * 0.8), f.w, f.h);
  const s = sunOf(f);
  drawGlow(ctx, s.x, s.y, Math.round(s.r * 2.8), c.sky3, 0.5);
  drawGlow(ctx, s.x, s.y, Math.round(s.r * 1.6) + (f.kick > 0.5 ? 2 : 0), c.glow, 1);
  disc(ctx, s.x, s.y, s.r, () => c.sun);
};

const cloudOf = (i: number, c: Colors<K>): HTMLCanvasElement => {
  const w = 44 + Math.floor(rand(i, 1) * 36);
  const h = 12;
  return memoLayer(`dawn-cloud:${i}:${c.cloud}:${c.cloudLit}`, w, h, (ctx) => {
    for (let x = 0; x < w; x++) {
      const u = x / (w - 1);
      const body = Math.sin(u * Math.PI) ** 0.7 * (4 + ridgeNoise(x / 7, i + 30) * 7);
      const top = Math.round(h - 3 - body);
      if (body < 1) continue;
      fillRect(ctx, c.cloud, x, top, 1, h - 1 - top);
      fillRect(ctx, c.cloudLit, x, h - 3, 1, 2);
      if (bayer(x, h - 4) < 0.5) fillRect(ctx, c.cloudLit, x, h - 4, 1, 1);
    }
  });
};

const clouds = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  for (let i = 0; i < 4; i++) {
    const cloud = cloudOf(i, c);
    const span = f.w + cloud.width + 20;
    const x = wrap(rand(i, 2) * span + f.t * (2 + i * 1.5) * (0.8 + f.energy * 0.4), span) - cloud.width;
    const y = Math.round(f.h * (0.08 + rand(i, 3) * 0.32));
    ctx.drawImage(cloud, Math.round(x), y);
  }
};

const ridges = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(ridgesLayer(f, c), 0, 0);
};

const WING_UP: Sprite = ['b...b', '.b.b.', '..b..'];
const WING_DOWN: Sprite = ['..b..', '.b.b.', 'b...b'];

// A loose V of birds; each flaps twice a beat, slightly out of step with its neighbours.
const birds = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const palette = paletteOf(c, 'bird', (k) => ({ b: k.bird }));
  const span = f.w + 120;
  const lead = wrap(f.t * (9 + f.energy * 6) + f.w * 0.3, span) - 40;
  const y0 = f.h * 0.22 + Math.sin(f.t * 0.4) * 5;
  for (let i = 0; i < 7; i++) {
    const rank = Math.ceil(i / 2);
    const side = i % 2 === 0 ? 1 : -1;
    const x = lead - rank * 9 + Math.sin(f.t * 1.3 + i) * 1.5;
    const y = y0 + side * rank * 5 + Math.sin(f.t * 2 + i * 1.7) * 1.2;
    const up = frac(f.beat * 2 + i * 0.15) < 0.5;
    drawSprite(ctx, up ? WING_UP : WING_DOWN, palette, Math.round(x), Math.round(y));
  }
};

export const mountainDawn = defineScene<K>({
  id: 'mountain-dawn',
  title: 'Mountain Dawn',
  mood: { valence: 0.2, energy: 0.4 },
  styles: ['grand-field', 'pixel-quest', 'credits-roll'],
  variants: [
    {
      mood: { valence: 0.4, energy: 0.4 },
      colors: {
        sky0: '#1d2a5e',
        sky1: '#5a3f86',
        sky2: '#c25d8a',
        sky3: '#f49a86',
        sun: '#fff4c8',
        glow: '#ffd08a',
        cloud: '#a7568a',
        cloudLit: '#ffb48c',
        r0: '#b5698a',
        r1: '#8a4e7c',
        r2: '#633a6a',
        r3: '#432a55',
        r4: '#261a3a',
        rim: '#ffd6a0',
        bird: '#1c1230',
      },
    },
    {
      mood: { valence: 0, energy: 0.3 },
      colors: {
        sky0: '#14284a',
        sky1: '#2d5a86',
        sky2: '#6aa2c4',
        sky3: '#c4e2ea',
        sun: '#fffbe8',
        glow: '#f4f0c8',
        cloud: '#8eb4cc',
        cloudLit: '#f6f2dc',
        r0: '#86a8c0',
        r1: '#5f86a4',
        r2: '#41658a',
        r3: '#2b4a6c',
        r4: '#16304a',
        rim: '#fff6d8',
        bird: '#0f1e30',
      },
    },
  ],
  layers: [sky, clouds, ridges, birds],
});
