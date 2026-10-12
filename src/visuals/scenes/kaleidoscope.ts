// A kaleidoscope: a flowing pattern folded into one wedge and mirrored eight ways, turning slowly, posterized like
// stained glass with dithered seams, and a few glints that sparkle in all eight mirrors at once.
import { type Ctx, fillRect } from 'mojipx';
import { bayer, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { ditherField, fastSin, memoLayer } from './batch-3-helpers.ts';

type K = 'p0' | 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | 'p7' | 'p8' | 'glint';

const rampOf = (c: Colors<K>): readonly string[] => [c.p0, c.p1, c.p2, c.p3, c.p4, c.p5, c.p6, c.p7, c.p8];

type View = {
  readonly cx: number;
  readonly cy: number;
  /** Pattern units per pixel (the zoom breathes with the bar). */
  readonly k: number;
  readonly cos: number;
  readonly sin: number;
  readonly t: number;
  readonly cycle: number;
};

const viewOf = (f: Frame): View => {
  const angle = f.t * 0.07;
  return {
    cx: f.w / 2,
    cy: f.h / 2,
    k: (11 / Math.min(f.w, f.h)) * (1 + 0.05 * Math.sin(f.beat * (Math.PI / 4))),
    cos: Math.cos(angle),
    sin: Math.sin(angle),
    t: f.t * 0.45,
    cycle: f.t * 0.25 + f.kick * 0.12,
  };
};

// Flat bands with a short dithered seam between them: the stained-glass look.
const posterize = (v: number): number => {
  const base = Math.floor(v);
  return base + Math.min(1, Math.max(0, (v - base - 0.62) / 0.38));
};

// A triangle wave in [-1, 1] with period 1.
const tri = (x: number): number => Math.abs(x - Math.floor(x) - 0.5) * 4 - 1;

const patternAt = (x: number, y: number, v: View): number => {
  const dx = (x - v.cx) * v.k;
  const dy = (y - v.cy) * v.k;
  const ax = Math.abs(dx * v.cos - dy * v.sin);
  const ay = Math.abs(dx * v.sin + dy * v.cos);
  // Fold into the wedge 0 <= lo <= hi: the eight-way mirror.
  const hi = Math.max(ax, ay);
  const lo = Math.min(ax, ay);
  const r = Math.sqrt(hi * hi + lo * lo);
  // Triangle waves along straight directions give the crisp shards; a ring and a soft sine keep it flowing.
  const shards = tri(hi * 0.3 - v.t * 0.3) * 1.1 + tri(lo * 0.52 + hi * 0.15 + v.t * 0.2);
  const ring = tri(r * 0.2 - v.t * 0.4) * 0.9;
  const soft = fastSin(lo * 0.9 - v.t * 0.4) * 0.4;
  return posterize((shards + ring + soft) * 1.05 + v.cycle);
};

const glass = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const v = viewOf(f);
  ditherField(ctx, f, 2, rampOf(c), true, (x, y) => patternAt(x, y, v));
};

const MIRRORS = [
  [1, 1, false],
  [1, 1, true],
  [-1, 1, false],
  [-1, 1, true],
  [1, -1, false],
  [1, -1, true],
  [-1, -1, false],
  [-1, -1, true],
] as const;

// One glint in the wedge, drawn in all eight mirrors (rotated back into screen space).
const glint = (ctx: Ctx, v: View, a: number, b: number, color: string, big: boolean): void => {
  for (const [sx, sy, swap] of MIRRORS) {
    const px = (swap ? b : a) * sx;
    const py = (swap ? a : b) * sy;
    const x = Math.round(v.cx + (px * v.cos + py * v.sin) / v.k);
    const y = Math.round(v.cy + (-px * v.sin + py * v.cos) / v.k);
    fillRect(ctx, color, x, y, 1, 1);
    if (big) {
      fillRect(ctx, color, x - 1, y, 3, 1);
      fillRect(ctx, color, x, y - 1, 1, 3);
    }
  }
};

const glints = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const v = viewOf(f);
  const reach = (Math.max(f.w, f.h) / 2) * v.k;
  for (let i = 0; i < 6; i++) {
    const tw = Math.sin(f.t * (0.9 + rand(i, 41) * 1.3) + i * 2.1);
    if (tw < 0.55) continue;
    const r = (0.15 + 0.8 * rand(i, 42)) * reach;
    const th = rand(i, 43) * (Math.PI / 4);
    glint(ctx, v, r * Math.cos(th), r * Math.sin(th), c.glint, tw > 0.9);
  }
};

// The dark rim of the tube, dithered in toward the corners.
const vignette = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const rim = memoLayer(`kaleido-rim:${f.w}x${f.h}:${c.p0}`, f.w, f.h, (g) => {
    g.fillStyle = c.p0;
    for (let y = 0; y < f.h; y++)
      for (let x = 0; x < f.w; x++) {
        const d = Math.hypot((x - f.w / 2) / (f.w / 2), (y - f.h / 2) / (f.h / 2));
        if (bayer(x, y) < (d - 0.92) * 2.2) g.fillRect(x, y, 1, 1);
      }
  });
  ctx.drawImage(rim, 0, 0);
};

export const kaleidoscope = defineScene<K>({
  id: 'kaleidoscope',
  title: 'Kaleidoscope',
  mood: { valence: 0.3, energy: -0.2 },
  styles: ['starlit-dream', 'lofi-loop'],
  variants: [
    {
      mood: { valence: 0.4, energy: -0.1 },
      colors: {
        p0: '#0b1030',
        p1: '#1b2a6b',
        p2: '#2f5fa8',
        p3: '#3fb0a8',
        p4: '#a8e0a0',
        p5: '#ffe08a',
        p6: '#f0907a',
        p7: '#b0407a',
        p8: '#5a1f6a',
        glint: '#ffffff',
      },
    },
    {
      mood: { valence: -0.1, energy: -0.4 },
      colors: {
        p0: '#140a26',
        p1: '#2a1450',
        p2: '#4a2a80',
        p3: '#7a4ab0',
        p4: '#c07ac8',
        p5: '#f0b0c0',
        p6: '#ffe0c0',
        p7: '#d08890',
        p8: '#7a3a6a',
        glint: '#fff4e0',
      },
    },
    {
      mood: { valence: 0.7, energy: -0.3 },
      colors: {
        p0: '#2a1e5c',
        p1: '#5a4aa0',
        p2: '#8a7ad0',
        p3: '#b8b0f0',
        p4: '#f0e8ff',
        p5: '#ffd0e8',
        p6: '#ffb0c8',
        p7: '#e088b8',
        p8: '#a060a8',
        glint: '#ffffff',
      },
    },
  ],
  layers: [glass, glints, vignette],
});
