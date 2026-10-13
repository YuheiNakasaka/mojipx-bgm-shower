// Looking out of a window on a rainy night: the city behind the glass melts into soft dithered lights,
// rain falls outside, beads cling to the pane and a few drops run down it, lurching on each beat.
import { type Ctx, drawSpriteFoot, fillRect, type Sprite } from 'mojipx';
import { bayer, ditherGradient, frac, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { drawGlow, memoLayer, paletteOf, smooth, wrap } from './batch-2-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'lightA'
  | 'softA'
  | 'lightB'
  | 'softB'
  | 'lightC'
  | 'softC'
  | 'rain'
  | 'drop'
  | 'dropHi'
  | 'mist'
  | 'frame'
  | 'frameHi';

// A soft out-of-focus light: a flat disc of the light's soft tone, a brighter dithered rim and a feathered edge.
const paintBokeh = (ctx: Ctx, cx: number, cy: number, r: number, light: string, soft: string): void => {
  for (let y = Math.floor(cy - r); y <= cy + r; y++) {
    for (let x = Math.floor(cx - r); x <= cx + r; x++) {
      const d = Math.hypot(x - cx, y - cy) / r;
      const checker = (x + y) % 2 === 0;
      if (d > 1 || (d > 0.9 && !checker)) continue;
      fillRect(ctx, d > 0.72 && d <= 0.9 && checker ? light : soft, x, y, 1, 1);
    }
  }
};

// Blurred towers across the street: soft dark blocks with feathered sides.
const paintTowers = (ctx: Ctx, f: Frame, color: string): void => {
  for (let i = 0; i < 9; i++) {
    const x0 = Math.round((i / 9 + rand(i, 64) * 0.06) * f.w);
    const bw = Math.round(f.w * (0.08 + rand(i, 65) * 0.1));
    const top = Math.round(f.h * (0.15 + rand(i, 66) * 0.4));
    for (let x = x0; x < x0 + bw; x++) {
      const edge = x < x0 + 2 || x >= x0 + bw - 2;
      for (let y = top; y < f.h; y += edge ? 2 : 1) fillRect(ctx, color, x, y + (edge ? x & 1 : 0), 1, 1);
    }
  }
};

const bokehLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`rain-bokeh:${c.sky1}:${c.lightA}:${c.lightB}:${c.lightC}:${c.softA}:${c.softB}:${c.softC}`, f.w, f.h, (ctx) => {
    paintTowers(ctx, f, c.sky1);
    const area = f.w * f.h;
    const lights = [
      [c.lightA, c.softA],
      [c.lightB, c.softB],
      [c.lightA, c.softA],
      [c.lightC, c.softC],
    ] as const;
    for (let i = 0; i < Math.round(area / 700); i++) {
      fillRect(ctx, rand(i, 63) < 0.5 ? c.softC : c.softA, rand(i, 61) * f.w, f.h * (0.3 + rand(i, 62) * 0.7), 1, 1);
    }
    for (let i = 0; i < Math.round(area / 1900); i++) {
      const [light, soft] = lights[i % lights.length] as readonly [string, string];
      paintBokeh(ctx, rand(i, 71) * f.w, f.h * (0.2 + rand(i, 72) * 0.78), 3 + rand(i, 73) ** 2 * 11, light, soft);
    }
  });

const outside = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(ditherGradient(f.w, f.h, [c.sky0, c.sky1, c.sky2, c.sky1]), 0, 0);
  ctx.drawImage(bokehLayer(f, c), 0, 0);
};

// Cars far below: headlights drifting one way, tail lights the other.
const traffic = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const road = f.h * 0.86;
  const span = f.w + 40;
  for (let i = 0; i < 7; i++) {
    const right = i % 2 === 0;
    const speed = 10 + rand(i, 81) * 14;
    const x = wrap(rand(i, 82) * span + (right ? 1 : -1) * f.t * speed, span) - 20;
    drawGlow(ctx, x, road + (right ? 4 : 0), 4, right ? c.lightC : c.lightB, 0.9);
  }
};

// A sign across the street whose lights alternate with the beat and swell on a kick.
const sign = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const x = Math.round(f.w * 0.3);
  const y = Math.round(f.h * 0.42);
  const on = Math.floor(f.beat) % 2;
  drawGlow(ctx, x, y, f.kick > 0.5 ? 8 : 6, on ? c.lightB : c.lightA, 0.8);
  drawGlow(ctx, x + 12, y + 1, 5, on ? c.lightA : c.lightB, 0.7);
};

const rainfall = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const count = Math.round((f.w * f.h) / (760 - f.energy * 260));
  ctx.fillStyle = c.rain;
  for (let i = 0; i < count; i++) {
    const len = 3 + Math.floor(rand(i, 91) * 5);
    const speed = 170 + rand(i, 92) * 120;
    const y = wrap(rand(i, 93) * f.h + f.t * speed, f.h + len) - len;
    const x = wrap(rand(i, 94) * f.w - y * 0.18, f.w);
    ctx.fillRect(Math.round(x), Math.round(y), 1, len);
  }
};

// Mist gathering at the bottom of the pane and two faint diagonal reflections.
const glassLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`rain-glass:${c.mist}`, f.w, f.h, (ctx) => {
    ctx.fillStyle = c.mist;
    for (let y = 0; y < f.h; y++) {
      const mist = smooth(0.62, 1, y / f.h) * 0.75;
      for (let x = 0; x < f.w; x++) {
        const band = (x + y * 0.8) / Math.max(f.w, f.h);
        const shine = Math.abs(band - 0.55) < 0.05 || Math.abs(band - 0.68) < 0.015 ? 0.14 : 0;
        if (bayer(x, y) < mist + shine) ctx.fillRect(x, y, 1, 1);
      }
    }
  });

const paintBead = (ctx: Ctx, x: number, y: number, size: number, c: Colors<K>): void => {
  if (size === 0) {
    fillRect(ctx, c.drop, x, y, 1, 1);
    return;
  }
  fillRect(ctx, c.drop, x, y, size + 1, size + 1);
  fillRect(ctx, c.mist, x + 1, y + size, size, 1);
  fillRect(ctx, c.dropHi, x, y, 1, 1);
};

const beadLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`rain-beads:${c.drop}:${c.dropHi}:${c.mist}`, f.w, f.h, (ctx) => {
    for (let i = 0; i < Math.round((f.w * f.h) / 520); i++) {
      const size = Math.floor(rand(i, 101) ** 3 * 3);
      paintBead(ctx, Math.floor(rand(i, 102) * f.w), Math.floor(rand(i, 103) * f.h), size, c);
    }
  });

// A drop runs down the pane in lurches (one per beat), leaving a dotted trail, then a new one starts elsewhere.
const runner = (ctx: Ctx, f: Frame, c: Colors<K>, lane: number): void => {
  const beats = 10 + Math.floor(rand(lane, 111) * 10);
  const p = (f.beat + rand(lane, 112) * beats) / beats;
  const round = Math.floor(p);
  const q = frac(p) * beats;
  const fall = (Math.floor(q) + smooth(0, 0.4, frac(q))) / beats;
  const x = Math.floor(rand(lane, round * 7 + 113) * (f.w - 4)) + 2;
  const top = Math.floor(rand(lane, round * 7 + 114) * f.h * 0.4);
  const y = Math.round(top + fall * (f.h + 10 - top));
  ctx.fillStyle = c.drop;
  for (let ty = y - 4; ty > Math.max(top, y - 60); ty -= 3) ctx.fillRect(x + ((ty >> 3) & 1), ty, 1, 1);
  fillRect(ctx, c.drop, x - 1, y, 3, 3);
  fillRect(ctx, c.drop, x, y - 1, 1, 1);
  fillRect(ctx, c.dropHi, x - 1, y, 1, 1);
  fillRect(ctx, c.mist, x, y + 3, 2, 1);
};

const pane = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(glassLayer(f, c), 0, 0);
  ctx.drawImage(beadLayer(f, c), 0, 0);
  const lanes = Math.max(5, Math.round(f.w / 26));
  for (let lane = 0; lane < lanes; lane++) runner(ctx, f, c, lane);
};

const bar = (ctx: Ctx, c: Colors<K>, x: number, y: number, w: number, h: number): void => {
  fillRect(ctx, c.frame, x, y, w, h);
  fillRect(ctx, c.frameHi, x, y, w, 1);
  fillRect(ctx, c.frameHi, x, y, 1, h);
  fillRect(ctx, c.sky0, x, y + h - 1, w, 1);
  fillRect(ctx, c.sky0, x + w - 1, y, 1, h);
};

// A small potted plant on the sill, a silhouette rimmed by the light from outside.
const PLANT: Sprite = [
  '.......h........',
  '......hdh.......',
  '..h...hdd...h...',
  '..dh..ddd..hd...',
  '...dh.ddd.hd....',
  'h...ddhddhd...h.',
  'dh...dddddd..hd.',
  '.ddh.ddddd.hdd..',
  '..dddddddddd....',
  '....dddddd......',
  '...hpppppppp....',
  '...hpppppppp....',
  '....hppppppp....',
  '....hpppppp.....',
  '.....pppppp.....',
];

const frame = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const side = Math.max(5, Math.round(Math.min(f.w, f.h) * 0.04));
  const sill = Math.round(f.h * 0.07);
  bar(ctx, c, -1, -1, f.w + 2, side + 1);
  bar(ctx, c, -1, 0, side + 1, f.h);
  bar(ctx, c, f.w - side, 0, side + 1, f.h);
  if (f.w > f.h) bar(ctx, c, Math.round(f.w / 2 - side / 2), 0, side, f.h);
  else bar(ctx, c, 0, Math.round(f.h * 0.4), f.w, side);
  bar(ctx, c, -1, f.h - sill, f.w + 2, sill + 1);
  fillRect(ctx, c.frameHi, 0, f.h - sill + 2, f.w, 1);
  const palette = paletteOf(c, 'plant', (k) => ({ d: k.sky0, h: k.frameHi, p: k.frame }));
  drawSpriteFoot(ctx, PLANT, palette, f.w - side - 14, f.h - sill + 1);
};

export const rainyWindow = defineScene<K>({
  id: 'rainy-window',
  title: 'Rainy Window',
  mood: { valence: -0.6, energy: -0.6 },
  styles: ['lofi-loop', 'credits-roll', 'showa-ballad', 'bossa-cafe'],
  variants: [
    {
      mood: { valence: -0.6, energy: -0.6 },
      colors: {
        sky0: '#070b16',
        sky1: '#111a2e',
        sky2: '#1f2d48',
        lightA: '#ffc266',
        softA: '#8a6448',
        lightB: '#ff6f7c',
        softB: '#7a3c52',
        lightC: '#8ae6e0',
        softC: '#2f5a70',
        rain: '#6d84a6',
        drop: '#9db4d2',
        dropHi: '#eaf4ff',
        mist: '#2d3c5a',
        frame: '#0b0c12',
        frameHi: '#2c2e3c',
      },
    },
    {
      mood: { valence: -0.1, energy: -0.5 },
      colors: {
        sky0: '#160c1e',
        sky1: '#2e1832',
        sky2: '#553044',
        lightA: '#ffd88a',
        softA: '#9a6a52',
        lightB: '#ff8a98',
        softB: '#8a4458',
        lightC: '#b0d8ff',
        softC: '#5a5078',
        rain: '#9a7c96',
        drop: '#c8a8bc',
        dropHi: '#fff0f4',
        mist: '#4a2c42',
        frame: '#1c110c',
        frameHi: '#4a3020',
      },
    },
  ],
  layers: [outside, traffic, sign, rainfall, pane, frame],
});
