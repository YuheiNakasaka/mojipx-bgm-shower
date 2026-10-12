// Moonlit dunes in layers under a sky full of stars; a caravan of camels and walkers crosses a far ridge,
// stepping with the beat, its lantern swinging and glowing a little brighter on each kick.
import { type Ctx, drawSprite, fillRect, type Sprite } from 'mojipx';
import { bayer, ditherGradient, frac, noise1, rand, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { drawGlow, memoLayer, moon, paletteOf, wrap } from './batch-2-helpers.ts';

type K = 'sky0' | 'sky1' | 'sky2' | 'star' | 'moon' | 'sea' | 'd0' | 'd1' | 'd2' | 'd3' | 'd4' | 'crest' | 'ink' | 'lantern';

type Dune = {
  readonly base: number;
  readonly amp: number;
  readonly period: number;
  readonly seed: number;
  readonly lit: K;
  readonly shade: K;
};

const DUNES: readonly Dune[] = [
  { base: 0.64, amp: 0.1, period: 120, seed: 3, lit: 'd4', shade: 'd3' },
  { base: 0.74, amp: 0.09, period: 150, seed: 7, lit: 'd3', shade: 'd2' },
  { base: 0.86, amp: 0.1, period: 110, seed: 13, lit: 'd2', shade: 'd1' },
  { base: 1.0, amp: 0.12, period: 170, seed: 19, lit: 'd1', shade: 'd0' },
];
const CARAVAN_DUNE = DUNES[1] as Dune;

// A dune profile: a gentle windward rise to a sharp crest, then a steeper slip face.
const duneShape = (p: number): number => (p < 0.64 ? Math.sin(((p / 0.64) * Math.PI) / 2) ** 1.4 : ((1 - p) / 0.36) ** 1.2);

const phaseOf = (d: Dune, x: number): number => x / d.period + noise1(x / (d.period * 1.7), d.seed) * 0.6 + d.seed * 0.37;

const ridgeY = (d: Dune, h: number, x: number): number => {
  const u = phaseOf(d, x);
  const i = Math.floor(u);
  const height = 0.55 + rand(i, d.seed) * 0.45;
  const swell = noise1(x / 260, d.seed + 1) * 0.5;
  return h * (d.base - d.amp * (height * duneShape(u - i) * 0.75 + swell));
};

// How far below the surface the shadow of the slip face reaches: nothing at the crest and in the trough, deepest between.
const shadowDepth = (d: Dune, x: number): number => {
  const p = frac(phaseOf(d, x));
  if (p < 0.64) return 0;
  const k = (p - 0.64) / 0.36;
  return Math.sin(k * Math.PI) ** 0.8 * d.period * 0.22;
};

const paintRipples = (ctx: Ctx, x: number, y: number, color: string): void => {
  for (let k = 1; k < 4; k++) {
    const ry = y + k * 4 + Math.round(Math.sin(x / 9 + k) * 1.5);
    if (bayer(x, ry) < 0.4) fillRect(ctx, color, x, ry, 1, 1);
  }
};

const duneLayer = (f: Frame, c: Colors<K>, d: Dune): HTMLCanvasElement =>
  memoLayer(`dune:${d.seed}:${c[d.lit]}:${c[d.shade]}:${c.crest}`, f.w, f.h, (ctx) => {
    for (let x = 0; x < f.w; x++) {
      const y = Math.round(ridgeY(d, f.h, x));
      const depth = Math.round(shadowDepth(d, x));
      fillRect(ctx, c[d.lit], x, y, 1, f.h - y);
      if (depth > 0) {
        fillRect(ctx, c[d.shade], x, y, 1, depth);
        if (bayer(x, y + depth) < 0.5) fillRect(ctx, c[d.shade], x, y + depth, 1, 2);
      } else {
        fillRect(ctx, c.crest, x, y, 1, 1);
        paintRipples(ctx, x, y, c[d.shade]);
      }
    }
  });

const skyLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`desert-sky:${c.sky0}:${c.sky1}:${c.sky2}:${c.star}`, f.w, f.h, (ctx) => {
    ctx.drawImage(ditherGradient(f.w, f.h, [c.sky0, c.sky0, c.sky1, c.sky2]), 0, 0);
    // A faint band of distant stars across the sky.
    for (let y = 0; y < f.h * 0.7; y++) {
      for (let x = 0; x < f.w; x++) {
        const band = Math.abs(y - (f.h * 0.05 + x * 0.45) + noise1(x / 30, 4) * 12) / (f.h * 0.09);
        if (band < 1 && bayer(x, y) < (1 - band) * 0.32 && rand(x, y) < 0.7) fillRect(ctx, c.sky2, x, y, 1, 1);
        if (rand(x * 7, y * 13) < 0.004) fillRect(ctx, c.sky2, x, y, 1, 1);
      }
    }
  });

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(skyLayer(f, c), 0, 0);
  stars(ctx, f.w, f.h, f.t, [c.star, c.moon], Math.round((f.w * f.h) / 500), 23, 0.62);
  const r = Math.round(Math.min(f.w, f.h) * 0.075);
  const mx = Math.round(f.w * 0.24);
  const my = Math.round(f.h * (f.w > f.h ? 0.22 : 0.18));
  drawGlow(ctx, mx, my, r * 3, c.sky2, 0.8);
  moon(ctx, mx, my, r, c.moon, c.sea);
  shootingStar(ctx, f, c);
};

// Now and then a shooting star crosses the upper sky.
const shootingStar = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const cycle = Math.floor(f.beat / 24);
  const p = frac(f.beat / 24) * 12;
  if (p > 1) return;
  const x0 = f.w * (0.4 + rand(cycle, 51) * 0.5);
  const y0 = f.h * (0.06 + rand(cycle, 52) * 0.2);
  for (let k = 0; k < 7; k++) {
    const q = p - k * 0.03;
    if (q < 0) continue;
    fillRect(ctx, k < 2 ? c.moon : c.sky2, Math.round(x0 - q * 60), Math.round(y0 + q * 24), 1, 1);
  }
};

const dunes = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(duneLayer(f, c, DUNES[0] as Dune), 0, 0);
  ctx.drawImage(duneLayer(f, c, CARAVAN_DUNE), 0, 0);
};

const nearDunes = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(duneLayer(f, c, DUNES[2] as Dune), 0, 0);
  drift(ctx, f, c);
  ctx.drawImage(duneLayer(f, c, DUNES[3] as Dune), 0, 0);
};

// Sand blown off the crest of the near dune.
const drift = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const d = DUNES[3] as Dune;
  for (let i = 0; i < 18; i++) {
    const life = frac(f.t * 0.5 + rand(i, 61));
    const x0 = rand(i, 62) * f.w;
    const x = wrap(x0 + life * 30, f.w);
    const y = ridgeY(d, f.h, x0) - 1 - life * 6 + Math.sin(life * 9 + i) * 1.5;
    if (life < 0.8) fillRect(ctx, c.crest, Math.round(x), Math.round(y), 1, 1);
  }
};

// k body; the camels carry a rider. Two leg positions each, swapped on every beat.
const CAMEL_BODY: Sprite = [
  '.........k............',
  '........kkk...........',
  '........kkk...........',
  '.......kkkkk..........',
  '.......kkkkk.......kk.',
  '.....kkkkkkkkk....kkkk',
  '....kkkkkkkkkkk..kkk..',
  '...kkkkkkkkkkkkkkkk...',
  '..kkkkkkkkkkkkkkkk....',
  '..kkkkkkkkkkkkkkk.....',
  '.kkkkkkkkkkkkkkk......',
  '.k.kkkkkkkkkkkk.......',
];
const CAMEL_A: Sprite = [
  ...CAMEL_BODY,
  '...kk.k.....kk.k......',
  '...k..k.....k..k......',
  '..k...k....k...k......',
  '..k....k...k....k.....',
];
const CAMEL_B: Sprite = [
  ...CAMEL_BODY,
  '....kkk......kkk......',
  '....k.k......k.k......',
  '....k.k......k.k......',
  '....k.k......k.k......',
];
const WALKER_A: Sprite = ['.k....', 'kkk..k', 'kkk..k', 'kkkkkk', 'kkk..k', 'kkk..k', 'kkk..k', 'k.k..k', 'k.k..k', 'k..k.k'];
const WALKER_B: Sprite = ['.k....', 'kkk..k', 'kkk..k', 'kkkkkk', 'kkk..k', 'kkk..k', 'kkk..k', '.kk..k', '.kk..k', '.kk..k'];

type Member = { readonly offset: number; readonly camel: boolean };
const CARAVAN: readonly Member[] = [
  { offset: 0, camel: false },
  { offset: 26, camel: true },
  { offset: 52, camel: true },
  { offset: 80, camel: false },
  { offset: 92, camel: true },
];
const SPEED = 5;

const member = (ctx: Ctx, f: Frame, c: Colors<K>, m: Member, lead: number, i: number): void => {
  const x = lead - m.offset;
  if (x < -24 || x > f.w + 24) return;
  const step = (Math.floor(f.beat) + i) % 2 === 0;
  const sprite = m.camel ? (step ? CAMEL_A : CAMEL_B) : step ? WALKER_A : WALKER_B;
  const width = (sprite[0] as string).length;
  const foot = Math.round(ridgeY(CARAVAN_DUNE, f.h, x + width / 2)) + 1;
  const top = foot - sprite.length - (step ? 0 : 1) * (m.camel ? 0 : 1);
  const rim = paletteOf(c, 'rim', (k) => ({ k: k.crest }));
  const ink = paletteOf(c, 'ink', (k) => ({ k: k.ink }));
  drawSprite(ctx, sprite, rim, Math.round(x) - 1, top);
  drawSprite(ctx, sprite, ink, Math.round(x), top);
};

const caravan = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const cycle = f.w + 220;
  const lead = wrap(f.t * SPEED + f.w * 0.62, cycle) - 20;
  CARAVAN.forEach((m, i) => {
    member(ctx, f, c, m, lead, i);
  });
  // The leader's lantern swings on its staff.
  const lx = Math.round(lead + 5);
  if (lx < -4 || lx > f.w + 4) return;
  const ly = Math.round(ridgeY(CARAVAN_DUNE, f.h, lead + 3)) - 9 + (Math.floor(f.beat) % 2);
  drawGlow(ctx, lx, ly, f.kick > 0.5 ? 6 : 4, c.lantern, 0.9);
  fillRect(ctx, c.moon, lx, ly, 1, 1);
};

export const desertCaravan = defineScene<K>({
  id: 'desert-caravan',
  title: 'Desert Caravan',
  mood: { valence: -0.2, energy: 0 },
  styles: ['deep-dungeon', 'credits-roll'],
  variants: [
    {
      mood: { valence: -0.2, energy: -0.1 },
      colors: {
        sky0: '#050a1c',
        sky1: '#0e1e40',
        sky2: '#26406a',
        star: '#dce6ff',
        moon: '#f4f2e4',
        sea: '#cfcbb4',
        d0: '#121428',
        d1: '#22243e',
        d2: '#36385a',
        d3: '#4e5478',
        d4: '#6a7496',
        crest: '#9aa8c8',
        ink: '#05060e',
        lantern: '#ffc45a',
      },
    },
    {
      mood: { valence: 0.2, energy: 0.2 },
      colors: {
        sky0: '#140a26',
        sky1: '#3a1a44',
        sky2: '#7a3a5a',
        star: '#ffe6d2',
        moon: '#fff2d6',
        sea: '#f0d2b0',
        d0: '#2a1420',
        d1: '#4a2430',
        d2: '#743a3e',
        d3: '#a25a4a',
        d4: '#c8805a',
        crest: '#f2b47a',
        ink: '#12060c',
        lantern: '#ffe08a',
      },
    },
  ],
  layers: [sky, dunes, caravan, nearDunes],
});
