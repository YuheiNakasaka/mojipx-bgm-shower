// Walking down a stone corridor in one-point perspective: arches pass by with a step on every beat,
// torches on the pillars flicker and light the walls around them, and the far end is lost in darkness.
import { type Ctx, fillRect } from 'mojipx';
import { frac, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { drawGlow, memoLayer, smooth } from './batch-2-helpers.ts';

type K = 'void' | 's0' | 's1' | 's2' | 's3' | 's4' | 'mortar' | 'flame0' | 'flame1' | 'flame2' | 'core' | 'glow' | 'iron';

type View = { readonly cx: number; readonly cy: number; readonly F: number; readonly cam: number };

const BAND = 0.5; // depth of one row of stones
const ZNEAR = 0.2;
const ZMAX = 11;
const HC = 1.3; // ceiling height above the eye
const HF = 1; // floor depth below the eye
const PILLAR = 2; // a pillar (with torches) every two units
const COURSES = 6;

const viewOf = (f: Frame): View => {
  const step = smooth(0, 0.45, frac(f.beat));
  return {
    cx: f.w / 2,
    cy: Math.round(f.h * 0.47) - (step > 0 && step < 1 ? 1 : 0),
    F: Math.max(f.w * 0.42, f.h * 0.3),
    cam: (Math.floor(f.beat) + step) * 0.5,
  };
};

const ramp = (c: Colors<K>): readonly string[] => [c.void, c.s0, c.s1, c.s2, c.s3, c.s4];

// How brightly a band at world depth z0 is lit: fading with distance, brighter near a torch.
const levelOf = (zWorld: number, zView: number): number => {
  const d = Math.abs(zWorld - Math.round(zWorld / PILLAR) * PILLAR);
  const boost = d < 0.5 ? 1.8 : d < 1 ? 0.9 : 0;
  return 2.5 - zView * 0.3 + boost;
};

const shade = (c: Colors<K>, level: number): string => ramp(c)[Math.max(0, Math.min(5, Math.round(level)))] as string;

const walls = (ctx: Ctx, f: Frame, v: View, near: number, far: number, color: string): void => {
  const x0 = Math.max(0, Math.ceil(v.cx - v.F / Math.max(near, ZNEAR)));
  const x1 = Math.min(Math.floor(v.cx), Math.floor(v.cx - v.F / far));
  ctx.fillStyle = color;
  for (let x = x0; x < x1; x++) {
    const d = v.cx - x;
    const top = Math.round(v.cy - HC * d);
    const h = Math.round(v.cy + HF * d) - top;
    ctx.fillRect(x, top, 1, h);
    ctx.fillRect(f.w - 1 - x, top, 1, h);
  }
};

const flats = (ctx: Ctx, f: Frame, v: View, near: number, far: number, floor: string, ceiling: string): void => {
  const n = Math.max(near, ZNEAR);
  ctx.fillStyle = floor;
  for (let y = Math.round(v.cy + (HF * v.F) / far); y < Math.min(f.h, Math.round(v.cy + (HF * v.F) / n)); y++) {
    const half = Math.round((y - v.cy) / HF);
    ctx.fillRect(Math.round(v.cx - half), y, half * 2, 1);
  }
  ctx.fillStyle = ceiling;
  for (let y = Math.max(0, Math.round(v.cy - (HC * v.F) / n)); y < Math.round(v.cy - (HC * v.F) / far); y++) {
    const half = Math.round((v.cy - y) / HC);
    ctx.fillRect(Math.round(v.cx - half), y, half * 2, 1);
  }
};

// The joints that move as we walk: stone ends on the walls (staggered by course) and tile edges on the floor.
const joints = (ctx: Ctx, f: Frame, v: View, near: number, band: number, c: Colors<K>): void => {
  if (near < ZNEAR) return;
  const d = Math.round(v.F / near);
  const x = Math.round(v.cx - d);
  ctx.fillStyle = c.mortar;
  if (x >= 0) {
    for (let k = band % 2; k < COURSES; k += 2) {
      const y0 = Math.round(v.cy + (-HC + (k * (HC + HF)) / COURSES) * d);
      const y1 = Math.round(v.cy + (-HC + ((k + 1) * (HC + HF)) / COURSES) * d);
      ctx.fillRect(x, y0, 1, y1 - y0);
      ctx.fillRect(f.w - 1 - x, y0, 1, y1 - y0);
    }
  }
  const fy = Math.round(v.cy + HF * d) - 1;
  if (fy < f.h) ctx.fillRect(Math.round(v.cx - d), fy, d * 2, 1);
  const cyl = Math.round(v.cy - HC * d);
  if (cyl >= 0) ctx.fillRect(Math.round(v.cx - d), cyl, d * 2, 1);
};

const corridor = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const v = viewOf(f);
  fillRect(ctx, c.void, 0, 0, f.w, f.h);
  const first = Math.floor(v.cam / BAND);
  for (let n = first + Math.ceil(ZMAX / BAND); n >= first; n--) {
    const near = n * BAND - v.cam;
    const far = near + BAND;
    if (far <= ZNEAR) continue;
    const level = levelOf(n * BAND + BAND / 2, near + BAND / 2);
    walls(ctx, f, v, near, far, shade(c, level + (n % 2) * 0.3));
    flats(ctx, f, v, near, far, shade(c, level - 0.8 + (n % 2) * 0.4), shade(c, level - 1.5 + (n % 2) * 0.4));
    joints(ctx, f, v, near, n, c);
  }
};

// Mortar lines that run along the corridor stay put on screen as we walk, so they are drawn once.
const paintCourses = (ctx: Ctx, f: Frame, v: View, color: string): void => {
  const end = v.F / ZMAX;
  ctx.fillStyle = color;
  for (let k = 1; k < COURSES; k++) {
    const slope = -HC + (k * (HC + HF)) / COURSES;
    let prev = Math.round(v.cy + slope * v.cx);
    for (let x = 0; x < v.cx - end; x++) {
      const y = Math.round(v.cy + slope * (v.cx - x));
      const top = Math.min(prev, y);
      ctx.fillRect(x, top, 1, Math.max(1, Math.abs(prev - y)));
      ctx.fillRect(f.w - 1 - x, top, 1, Math.max(1, Math.abs(prev - y)));
      prev = y;
    }
  }
};

const paintFloorLines = (ctx: Ctx, f: Frame, v: View, color: string): void => {
  const start = Math.round(v.cy + (HF * v.F) / ZMAX);
  ctx.fillStyle = color;
  for (const lane of [-0.6, -0.2, 0.2, 0.6]) {
    let prev = Math.round(v.cx + (lane * (start - v.cy)) / HF);
    for (let y = start; y < f.h; y++) {
      const x = Math.round(v.cx + (lane * (y - v.cy)) / HF);
      ctx.fillRect(Math.min(prev, x), y, Math.max(1, Math.abs(prev - x)), 1);
      prev = x;
    }
  }
};

const paintCeilingLines = (ctx: Ctx, v: View, color: string): void => {
  const start = Math.round(v.cy - (HC * v.F) / ZMAX);
  ctx.fillStyle = color;
  for (const lane of [-0.5, 0, 0.5]) {
    let prev = Math.round(v.cx + (lane * (v.cy - start)) / HC);
    for (let y = start; y >= 0; y--) {
      const x = Math.round(v.cx + (lane * (v.cy - y)) / HC);
      ctx.fillRect(Math.min(prev, x), y, Math.max(1, Math.abs(prev - x)), 1);
      prev = x;
    }
  }
};

const linesLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement => {
  const v = viewOf({ ...f, beat: 0 });
  return memoLayer(`halls-lines:${c.mortar}:${v.cy}`, f.w, f.h, (ctx) => {
    paintCourses(ctx, f, v, c.mortar);
    paintFloorLines(ctx, f, v, c.mortar);
    paintCeilingLines(ctx, v, c.mortar);
  });
};

const lines = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const v = viewOf(f);
  ctx.drawImage(linesLayer(f, c), 0, v.cy - viewOf({ ...f, beat: 0 }).cy);
};

const flame = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, base: number, size: number, id: number): void => {
  const flick = rand(Math.floor(f.t * 11), id);
  const h = Math.max(3, Math.round(size * (0.85 + flick * 0.35 + f.kick * 0.15)));
  const w = Math.max(2, size * 0.42);
  for (let r = 0; r < h; r++) {
    const t = r / h;
    const sway = Math.round(Math.sin(r * 0.7 + f.t * 9 + id) * (1 - t) * size * 0.06);
    const half = (w / 2) * Math.sqrt(t) * (1.15 - t * 0.35);
    const y = base - h + r;
    fillRect(ctx, c.flame0, Math.round(x - half) + sway, y, Math.max(1, Math.round(half * 2)), 1);
    if (t > 0.3) fillRect(ctx, c.flame1, Math.round(x - half * 0.6) + sway, y, Math.max(1, Math.round(half * 1.2)), 1);
    if (t > 0.55) fillRect(ctx, c.flame2, Math.round(x - half * 0.3) + sway, y, Math.max(1, Math.round(half * 0.6)), 1);
  }
  fillRect(ctx, c.core, Math.round(x), base - Math.max(1, Math.round(h * 0.25)), 1, Math.max(1, Math.round(h * 0.2)));
};

const GLOWS = [4, 6, 9, 13, 18, 24];

const torch = (ctx: Ctx, f: Frame, c: Colors<K>, v: View, z: number, side: number, id: number): void => {
  const s = v.F / z;
  const x = v.cx + side * 0.9 * s;
  const y = v.cy - 0.28 * s;
  const size = s * 0.2;
  const bucket = Math.min(GLOWS.length - 1, Math.floor(Math.sqrt(s) / 2.4) + (f.kick > 0.5 ? 1 : 0));
  drawGlow(ctx, x, y - size * 0.6, GLOWS[bucket] as number, c.glow, 0.6);
  fillRect(ctx, c.iron, Math.round(x - s * 0.03), Math.round(y), Math.max(1, Math.round(s * 0.06)), Math.max(2, Math.round(s * 0.16)));
  fillRect(ctx, c.iron, Math.round(x - s * 0.06), Math.round(y), Math.max(2, Math.round(s * 0.12)), Math.max(1, Math.round(s * 0.03)));
  flame(ctx, f, c, x, Math.round(y), size, id);
};

// An arch every two units: two pillar faces and a beam across the ceiling, each carrying a torch.
const arch = (ctx: Ctx, f: Frame, c: Colors<K>, v: View, m: number): void => {
  const z = m * PILLAR - 0.12 - v.cam;
  if (z < ZNEAR || z > ZMAX) return;
  const s = v.F / z;
  const level = levelOf(m * PILLAR, z) + 0.6;
  const top = Math.round(v.cy - HC * s);
  const bottom = Math.round(v.cy + HF * s);
  const inner = Math.round(0.84 * s);
  const outer = Math.round(s);
  const face = shade(c, level);
  fillRect(ctx, face, Math.round(v.cx - outer), top, outer - inner, bottom - top);
  fillRect(ctx, face, Math.round(v.cx + inner), top, outer - inner, bottom - top);
  fillRect(ctx, face, Math.round(v.cx - inner), top, inner * 2, Math.round(0.16 * s));
  const edge = shade(c, level + 1);
  fillRect(ctx, edge, Math.round(v.cx - inner) - 1, top, 1, bottom - top);
  fillRect(ctx, edge, Math.round(v.cx + inner), top, 1, bottom - top);
  fillRect(ctx, c.mortar, Math.round(v.cx - inner), top + Math.round(0.16 * s), inner * 2, 1);
  torch(ctx, f, c, v, z, -1, m * 2);
  torch(ctx, f, c, v, z, 1, m * 2 + 1);
};

const arches = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const v = viewOf(f);
  const first = Math.floor(v.cam / PILLAR);
  for (let m = first + Math.ceil(ZMAX / PILLAR) + 1; m >= first; m--) arch(ctx, f, c, v, m);
};

export const torchlitHalls = defineScene<K>({
  id: 'torchlit-halls',
  title: 'Torchlit Halls',
  mood: { valence: -0.6, energy: 0.1 },
  styles: ['deep-dungeon', 'boss-rush'],
  variants: [
    {
      mood: { valence: -0.5, energy: 0 },
      colors: {
        void: '#050308',
        s0: '#141016',
        s1: '#2a1f25',
        s2: '#4a352e',
        s3: '#76523e',
        s4: '#a87650',
        mortar: '#0b0709',
        flame0: '#c4321c',
        flame1: '#ff7c1e',
        flame2: '#ffd24a',
        core: '#fff6d2',
        glow: '#ff9a3a',
        iron: '#181214',
      },
    },
    {
      mood: { valence: -0.7, energy: 0.5 },
      colors: {
        void: '#020407',
        s0: '#0a1016',
        s1: '#16242e',
        s2: '#243f48',
        s3: '#3a6266',
        s4: '#5a9288',
        mortar: '#04080a',
        flame0: '#1c4aa2',
        flame1: '#3aa2ff',
        flame2: '#9ae8ff',
        core: '#f0ffff',
        glow: '#3a9cff',
        iron: '#0b0f13',
      },
    },
  ],
  layers: [corridor, lines, arches],
});
