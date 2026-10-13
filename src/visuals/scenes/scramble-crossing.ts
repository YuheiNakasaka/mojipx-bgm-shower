// A great scramble crossing on a rainy night, seen from a window above: when the lights change, a crowd of umbrellas
// crosses every way at once; then the cars go. Big screens glow with invented shapes and everything shines on wet asphalt.
import { type Ctx, fillRect } from 'mojipx';
import { bayer, ditherGradient, frac, noise1, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { type Box, clamp01, colorKey, drawGlow, wrap } from './batch-1-helpers.ts';
import { memoLayer } from './batch-2-helpers.ts';
import { isWide, noise2, pixelLayer, shine } from './batch-5-helpers.ts';

type K =
  | 'sky'
  | 'glow'
  | 'bldg0'
  | 'bldg1'
  | 'edge'
  | 'win'
  | 'winCool'
  | 'asphalt'
  | 'sheen'
  | 'walk'
  | 'stripe'
  | 'ink'
  | 'neonA'
  | 'neonB'
  | 'neonC'
  | 'neonD'
  | 'umbrella'
  | 'clear'
  | 'rain'
  | 'red'
  | 'green'
  | 'head';

// ---- the ground: a plane seen in perspective, x across and z away from the viewer ----

type Ground = { readonly cx: number; readonly y0: number; readonly h: number; readonly k: number };
const ZN = 1.8;
const ZF = 6.4;

const groundOf = (f: Frame): Ground =>
  isWide(f)
    ? { cx: f.w / 2, y0: Math.round(f.h * 0.38), h: f.h, k: (f.w * 0.55 * ZN) / 5 }
    : { cx: f.w / 2, y0: Math.round(f.h * 0.4), h: f.h, k: (f.w * 0.58 * ZN) / 4 };

const screenY = (g: Ground, z: number): number => g.y0 + ((g.h - g.y0) * (1 / z - 1 / ZF)) / (1 / ZN - 1 / ZF);
const screenX = (g: Ground, x: number, z: number): number => g.cx + (x * g.k) / z;
const depthAt = (g: Ground, y: number): number => 1 / (1 / ZF + ((1 / ZN - 1 / ZF) * (y - g.y0)) / (g.h - g.y0));

// Road A runs across the view, road B away from it; crossings join all four corners, two of them diagonally.
const A0 = 2.8;
const A1 = 4.8;
const B = 1.8;

const zebra = (u: number): boolean => frac(u * 2.6) < 0.5;

const onDiagonal = (x: number, z: number, sign: number): boolean => {
  const ax = -2 * sign;
  const t = ((x - ax) * 4 * sign + (z - 2.6) * 2.4) / (16 + 2.4 * 2.4);
  if (t < 0.06 || t > 0.94) return false;
  const d = Math.hypot(x - (ax + 4 * sign * t), z - (2.6 + 2.4 * t));
  return d < 0.42 && frac(t * 7) < 0.5;
};

const isStripe = (x: number, z: number): boolean => {
  const roadA = z > A0 && z < A1;
  const roadB = Math.abs(x) < B;
  if (roadA && Math.abs(x) > 2.2 && Math.abs(x) < 3.6) return zebra(z);
  if (roadB && ((z > 2 && z < 2.6) || (z > 5 && z < 5.6))) return zebra(x);
  return roadA && roadB && (onDiagonal(x, z, 1) || onDiagonal(x, z, -1));
};

const surfaceAt = (c: Colors<K>, x: number, z: number, px: number, py: number): string => {
  const road = (z > A0 && z < A1) || Math.abs(x) < B;
  if (!road) {
    const kerb = Math.min(Math.abs(z - A0), Math.abs(z - A1), Math.abs(Math.abs(x) - B)) < 0.06;
    return kerb ? c.edge : c.walk;
  }
  if (isStripe(x, z)) return bayer(px, py) < 0.92 ? c.stripe : c.sheen;
  return noise2(x * 1.5, z * 3, 7) > 0.7 && bayer(px, py) < 0.5 ? c.sheen : c.asphalt;
};

const groundLayer = (f: Frame, g: Ground, c: Colors<K>): HTMLCanvasElement =>
  pixelLayer(`scramble-ground:${colorKey(c)}:${g.y0}:${Math.round(g.k)}`, f.w, f.h - g.y0, (px, ly) => {
    const y = ly + g.y0;
    const z = depthAt(g, y + 0.5);
    return surfaceAt(c, ((px + 0.5 - g.cx) * z) / g.k, z, px, y);
  });

// ---- the city behind ----

const screensOf = (f: Frame, g: Ground): readonly Box[] => {
  const top = g.y0;
  return isWide(f)
    ? [
        { x: Math.round(f.w * 0.05), y: Math.round(top * 0.22), w: Math.round(f.w * 0.2), h: Math.round(top * 0.36) },
        { x: Math.round(f.w * 0.68), y: Math.round(top * 0.12), w: Math.round(f.w * 0.25), h: Math.round(top * 0.42) },
        { x: Math.round(f.w * 0.445), y: Math.round(top * 0.08), w: Math.round(f.w * 0.11), h: Math.round(top * 0.26) },
      ]
    : [
        { x: Math.round(f.w * 0.04), y: Math.round(top * 0.3), w: Math.round(f.w * 0.36), h: Math.round(top * 0.26) },
        { x: Math.round(f.w * 0.6), y: Math.round(top * 0.16), w: Math.round(f.w * 0.36), h: Math.round(top * 0.3) },
        { x: Math.round(f.w * 0.4), y: Math.round(top * 0.04), w: Math.round(f.w * 0.2), h: Math.round(top * 0.2) },
      ];
};

type Block = { readonly x0: number; readonly x1: number; readonly top: number; readonly tone: 0 | 1 };

const blocksOf = (f: Frame, g: Ground): readonly Block[] => {
  const gap = (B * g.k) / ZF;
  const left: Block[] = [];
  const right: Block[] = [];
  for (let x = 0, i = 0; x < g.cx - gap; i++) {
    const w = Math.round(f.w * (0.08 + rand(i, 3) * 0.1));
    left.push({ x0: x, x1: Math.min(g.cx - gap, x + w), top: Math.round(g.y0 * (0.05 + rand(i, 4) * 0.35)), tone: (i % 2) as 0 | 1 });
    x += w;
  }
  for (let x = f.w, i = 0; x > g.cx + gap; i++) {
    const w = Math.round(f.w * (0.08 + rand(i, 5) * 0.1));
    right.push({ x0: Math.max(g.cx + gap, x - w), x1: x, top: Math.round(g.y0 * (0.02 + rand(i, 6) * 0.35)), tone: (i % 2) as 0 | 1 });
    x -= w;
  }
  return [...left, ...right];
};

const paintWindows = (ctx: Ctx, c: Colors<K>, b: Block, bottom: number, i: number): void => {
  for (let y = b.top + 3; y < bottom - 3; y += 4)
    for (let x = b.x0 + 2; x < b.x1 - 2; x += 3) {
      const r = rand(x * 13 + y, i + 70);
      if (r < 0.24) fillRect(ctx, r < 0.17 ? c.win : c.winCool, x, y, 1, 2);
    }
};

// The street beyond the crossing runs on between the towers toward a far glow.
const paintAvenue = (ctx: Ctx, g: Ground, c: Colors<K>): void => {
  const gap = (B * g.k) / ZF;
  const vy = Math.round(g.y0 * 0.55);
  for (let y = vy; y <= g.y0; y++) {
    const u = (y - vy) / (g.y0 - vy);
    const half = Math.round(gap * u);
    fillRect(ctx, c.asphalt, Math.round(g.cx - half), y, half * 2, 1);
    if (y % 3 === 0) fillRect(ctx, u > 0.5 ? c.head : c.red, Math.round(g.cx - half * 0.5), y, 1, 1);
    fillRect(ctx, c.bldg0, Math.round(g.cx - gap), y - Math.round((1 - u) * 22), Math.round(gap - half), 1);
    fillRect(ctx, c.bldg0, Math.round(g.cx + half), y - Math.round((1 - u) * 22), Math.round(gap - half), 1);
  }
};

type Shop = { readonly x: number; readonly w: number; readonly color: string };

// Bright shopfronts along the foot of every block; their light spills onto the wet street.
const shopsOf = (f: Frame, g: Ground, c: Colors<K>): readonly Shop[] => {
  const colors = [c.win, c.neonA, c.clear, c.neonB, c.win, c.neonC];
  const shops: Shop[] = [];
  blocksOf(f, g).forEach((b, i) => {
    for (let x = b.x0 + 1, k = 0; x < b.x1 - 3; k++) {
      const w = Math.min(b.x1 - 1 - x, 5 + Math.floor(rand(k, i + 80) * 6));
      shops.push({ x, w, color: colors[Math.floor(rand(k, i + 90) * colors.length)] as string });
      x += w + 1;
    }
  });
  return shops;
};

const SHOP = 5;

const cityLayer = (f: Frame, g: Ground, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`scramble-city:${colorKey(c)}:${g.y0}`, f.w, g.y0 + 1, (ctx) => {
    ctx.drawImage(ditherGradient(f.w, g.y0, [c.sky, c.sky, c.glow]), 0, 0);
    paintAvenue(ctx, g, c);
    blocksOf(f, g).forEach((b, i) => {
      fillRect(ctx, b.tone === 0 ? c.bldg0 : c.bldg1, b.x0, b.top, b.x1 - b.x0, g.y0 - b.top + 1);
      fillRect(ctx, c.edge, b.x0, b.top, b.x1 - b.x0, 1);
      paintWindows(ctx, c, b, g.y0 - SHOP - 2, i);
      fillRect(ctx, c.ink, b.x0, g.y0 - SHOP - 1, b.x1 - b.x0, SHOP + 2);
    });
    for (const shop of shopsOf(f, g, c)) fillRect(ctx, shop.color, shop.x, g.y0 - SHOP, shop.w, SHOP);
    for (const s of screensOf(f, g)) fillRect(ctx, c.ink, s.x - 2, s.y - 2, s.w + 4, s.h + 4);
  });

// Tall blade signs by the avenue, lettered in invented glyphs; one glyph drops out on each beat.
const bladeSigns = (ctx: Ctx, f: Frame, g: Ground, c: Colors<K>): void => {
  const gap = (B * g.k) / ZF;
  const top = Math.round(g.y0 * 0.28);
  const glyphs = Math.floor((g.y0 * 0.42) / 5);
  [
    { x: Math.round(g.cx - gap - 9), color: c.neonA },
    { x: Math.round(g.cx + gap + 4), color: c.neonB },
  ].forEach((sign, s) => {
    fillRect(ctx, sign.color, sign.x, top, 5, glyphs * 5 + 2);
    fillRect(ctx, c.ink, sign.x + 1, top + 1, 3, glyphs * 5);
    const off = Math.floor(f.beat + s * 3) % glyphs;
    for (let k = 0; k < glyphs; k++) {
      if (k === off) continue;
      for (let b = 0; b < 9; b++)
        if (rand(k * 9 + b, s + 60) < 0.55) fillRect(ctx, c.clear, sign.x + 1 + (b % 3), top + 2 + k * 5 + Math.floor(b / 3), 1, 1);
    }
  });
};

// ---- the big screens: invented shows that move with the music ----

const neons = (c: Colors<K>): readonly string[] => [c.neonA, c.neonB, c.neonC, c.neonD];

// Rings spreading from the centre, a new one on every beat.
const showRings = (ctx: Ctx, f: Frame, r: Box, c: Colors<K>): void => {
  const colors = neons(c);
  fillRect(ctx, c.ink, r.x, r.y, r.w, r.h);
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  for (let k = 0; k < 4; k++) {
    const age = frac(f.beat) + k;
    const rad = age * Math.max(r.w, r.h) * 0.22;
    const color = colors[(Math.floor(f.beat) - k + 400) % 4] as string;
    for (let a = 0; a < 40; a++) {
      const x = Math.round(cx + Math.cos((a / 40) * Math.PI * 2) * rad);
      const y = Math.round(cy + Math.sin((a / 40) * Math.PI * 2) * rad * 0.7);
      if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) fillRect(ctx, color, x, y, 1, 1);
    }
  }
};

// Slanted bands sliding past a disc that swells on the kick.
const showBands = (ctx: Ctx, f: Frame, r: Box, c: Colors<K>): void => {
  const colors = neons(c);
  for (let y = 0; y < r.h; y++) {
    const band = Math.floor((y + f.t * 9) / 4);
    fillRect(ctx, colors[wrap(band, 4)] as string, r.x, r.y + y, r.w, 1);
  }
  const rad = Math.round(Math.min(r.w, r.h) * (0.25 + f.kick * 0.1));
  const cx = r.x + Math.round(r.w * 0.5);
  const cy = r.y + Math.round(r.h * 0.5);
  for (let dy = -rad; dy <= rad; dy++) {
    const half = Math.round(Math.sqrt(rad * rad - dy * dy) * 1.2);
    fillRect(ctx, dy < 0 ? c.clear : c.neonC, cx - half, cy + dy, half * 2 + 1, 1);
  }
};

// Bars that leap on the beat.
const showBars = (ctx: Ctx, f: Frame, r: Box, c: Colors<K>): void => {
  const colors = neons(c);
  fillRect(ctx, c.ink, r.x, r.y, r.w, r.h);
  const bars = Math.max(3, Math.floor(r.w / 3));
  for (let i = 0; i < bars; i++) {
    const level = noise1(i * 0.7 + f.beat * 1.3, 9) * (1 - frac(f.beat) * 0.5);
    const hh = Math.max(1, Math.round(level * r.h));
    fillRect(ctx, colors[(i + Math.floor(f.bar)) % 4] as string, r.x + i * 3, r.y + r.h - hh, 2, hh);
  }
};

const SHOWS = [showRings, showBands, showBars] as const;

const city = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const g = groundOf(f);
  ctx.drawImage(cityLayer(f, g, c), 0, 0);
  bladeSigns(ctx, f, g, c);
  screensOf(f, g).forEach((s, i) => {
    // Every four bars the screens swap their shows.
    const show = SHOWS[(i + Math.floor(f.bar / 4)) % SHOWS.length];
    if (show) show(ctx, f, s, c);
  });
};

// ---- the wet street ----

const street = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const g = groundOf(f);
  ctx.drawImage(groundLayer(f, g, c), 0, g.y0);
  for (const shop of shopsOf(f, g, c))
    shine(ctx, f, shop.x + 1, Math.max(1, shop.w - 2), g.y0 + 1, Math.round((g.h - g.y0) * 0.16), shop.color);
  const colors = neons(c);
  screensOf(f, g).forEach((s, i) => {
    shine(ctx, f, s.x + 2, s.w - 4, g.y0 + 1, Math.round((g.h - g.y0) * 0.35), colors[(i + Math.floor(f.bar / 4)) % 4] as string);
  });
};

// ---- traffic: an eight-bar cycle, pedestrians on beats 0–19 (the light blinks from 16), cars on 20–31 ----

const CYCLE = 32;
const WALK = 20;

type Spot = { readonly x: number; readonly z: number };
const CORNERS: readonly Spot[] = [
  { x: -3, z: 2.2 },
  { x: 3, z: 2.2 },
  { x: -3, z: 5.3 },
  { x: 3, z: 5.3 },
];

// Where pedestrian i stands between crossings n - 1 and n.
const standAt = (i: number, n: number): Spot => {
  const stays = rand(i, 11) < 0.2;
  const corner = CORNERS[Math.floor(rand(i, stays ? 12 : n * 7 + 13) * 4)] as Spot;
  return { x: corner.x + (rand(i, n * 3 + 14) - 0.5) * 1.8, z: corner.z + (rand(i, n * 3 + 15) - 0.5) * 0.6 };
};

type Walker = { readonly x: number; readonly z: number; readonly moving: boolean; readonly i: number };

const walkerAt = (i: number, beat: number): Walker => {
  const n = Math.floor(beat / CYCLE);
  const local = beat - n * CYCLE;
  const from = standAt(i, n);
  const to = standAt(i, n + 1);
  const p = clamp01((local - rand(i, 16) * 3) / (9 + rand(i, 17) * 7));
  const e = p * p * (3 - 2 * p);
  return { x: from.x + (to.x - from.x) * e, z: from.z + (to.z - from.z) * e, moving: p > 0 && p < 1, i };
};

const umbrellaColor = (c: Colors<K>, i: number): string => {
  const colors = [c.clear, c.clear, c.ink, c.umbrella, c.neonA, c.neonB, c.neonC, c.ink];
  return colors[Math.floor(rand(i, 18) * colors.length)] as string;
};

// An umbrella seen from above, with its owner's legs below and its colour shining on the wet ground.
const pedestrian = (ctx: Ctx, f: Frame, g: Ground, c: Colors<K>, p: Walker): void => {
  const x = Math.round(screenX(g, p.x, p.z));
  const y = Math.round(screenY(g, p.z));
  const size = Math.max(3, Math.min(9, Math.round((0.32 * g.k) / p.z)));
  const color = umbrellaColor(c, p.i);
  const step = p.moving && Math.floor(f.t * 7 + p.i) % 2 === 0 ? 1 : 0;
  fillRect(ctx, c.ink, x - 1 + step, y - 1, 1, 2);
  fillRect(ctx, c.ink, x + 1 - step, y - 1, 1, 2);
  fillRect(ctx, color, x, y + 1, 1, 2);
  const top = y - Math.round(size * 0.9);
  fillRect(ctx, color, x - Math.floor(size / 2) + 1, top, size - 2, 1);
  fillRect(ctx, color, x - Math.floor(size / 2), top + 1, size, Math.max(1, Math.round(size * 0.35)));
  fillRect(ctx, c.ink, x - Math.floor(size / 2), top + 1 + Math.max(1, Math.round(size * 0.35)), size, 1);
  fillRect(ctx, c.rain, x - Math.floor(size / 2) + 1, top, 1, 1);
};

const PEOPLE = 72;

const crowd = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const g = groundOf(f);
  const people = Array.from({ length: PEOPLE }, (_, i) => walkerAt(i, f.beat)).sort((a, b) => b.z - a.z);
  for (const p of people) pedestrian(ctx, f, g, c, p);
};

// Cars wait at the stop lines with their lights on while people cross, then pull away.
// A car seen from above and to the side: its body, a glassy cabin, lamps at either end and their shine on the road.
const car = (ctx: Ctx, f: Frame, g: Ground, c: Colors<K>, at: { x: number; z: number; dir: number; body: string }): void => {
  const len = Math.round((1.5 * g.k) / at.z);
  const left = Math.round(screenX(g, at.x, at.z) - len / 2);
  const y = Math.round(screenY(g, at.z));
  const tall = Math.max(4, Math.round((0.62 * g.k) / at.z));
  const low = Math.ceil(tall * 0.5);
  fillRect(ctx, at.body, left, y - low, len, low);
  fillRect(ctx, c.ink, left, y - 1, len, 1);
  fillRect(ctx, c.ink, left + 2, y - 1, 2, 1);
  const cabin = Math.round(len * 0.2);
  fillRect(ctx, at.body, left + cabin, y - tall, len - cabin * 2, tall - low);
  fillRect(ctx, c.sheen, left + cabin + 1, y - tall + 1, len - cabin * 2 - 2, tall - low - 1);
  fillRect(ctx, at.body, left + Math.round(len / 2), y - tall + 1, 1, tall - low - 1);
  const front = at.dir > 0 ? left + len - 1 : left;
  const back = at.dir > 0 ? left : left + len - 1;
  drawGlow(ctx, c.head, front + at.dir * 5, y - 1, 6, 3, 0.4);
  fillRect(ctx, c.head, front, y - low, 1, 2);
  fillRect(ctx, c.red, back, y - low, 1, 2);
  shine(ctx, f, front, 1, y + 1, Math.round(tall * 3), c.head);
  shine(ctx, f, back, 1, y + 1, Math.round(tall * 2), c.red);
};

const traffic = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const g = groundOf(f);
  const local = wrap(f.beat, CYCLE);
  const go = local < WALK ? 0 : ((local - WALK) / (CYCLE - WALK)) ** 1.4;
  const bodies = [c.clear, c.edge, c.umbrella, c.neonC, c.walk];
  for (let k = 0; k < 3; k++) {
    car(ctx, f, g, c, { x: -4.6 - k * 2.2 + go * 13, z: 4.3, dir: 1, body: bodies[k] as string });
    car(ctx, f, g, c, { x: 4.6 + k * 2.2 - go * 13, z: 3.3, dir: -1, body: bodies[k + 2] as string });
  }
};

// Walk signals on the four corners: green while people may cross, blinking at the end, red for the cars.
const signals = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const g = groundOf(f);
  const local = wrap(f.beat, CYCLE);
  const walk = local < WALK && (local < WALK - 4 || frac(f.beat) < 0.5);
  for (const corner of CORNERS) {
    const x = Math.round(screenX(g, corner.x * 0.75, corner.z > 4 ? A1 + 0.15 : A0 - 0.15));
    const y = Math.round(screenY(g, corner.z > 4 ? A1 + 0.15 : A0 - 0.15));
    const tall = Math.round((0.9 * g.k) / corner.z);
    fillRect(ctx, c.ink, x, y - tall, 1, tall);
    fillRect(ctx, c.ink, x - 1, y - tall - 4, 3, 5);
    fillRect(ctx, walk ? c.green : c.red, x, y - tall - (walk ? 1 : 3), 1, 1);
    drawGlow(ctx, walk ? c.green : c.red, x, y - tall - 2, 4, 4, 0.5);
  }
};

// ---- rain ----

const rain = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const count = Math.round((f.w * f.h) / 700);
  ctx.fillStyle = c.rain;
  for (let i = 0; i < count; i++) {
    const speed = 150 + rand(i, 21) * 90;
    const x = Math.round(wrap(rand(i, 22) * f.w * 1.2 - f.t * speed * 0.18, f.w * 1.2));
    const y = Math.round(wrap(rand(i, 23) * f.h + f.t * speed, f.h + 10)) - 5;
    const len = 3 + Math.floor(rand(i, 24) * 3);
    for (let k = 0; k < len; k++) ctx.fillRect(x - Math.floor(k * 0.25), y + k, 1, 1);
  }
  const g = groundOf(f);
  const tick = Math.floor(f.t * 10);
  for (let i = 0; i < 24; i++) {
    const y = Math.round(g.y0 + rand(i, tick) ** 0.7 * (g.h - g.y0));
    const x = Math.round(rand(i, tick + 500) * f.w);
    fillRect(ctx, c.rain, x - 1, y, 1, 1);
    fillRect(ctx, c.rain, x + 1, y, 1, 1);
    fillRect(ctx, c.rain, x, y - 1, 1, 1);
  }
};

export const scrambleCrossing = defineScene<K>({
  id: 'scramble-crossing',
  title: 'Scramble Crossing',
  mood: { valence: -0.1, energy: 0.5 },
  styles: ['city-lights', 'neon-rush', 'nineties-pop', 'city-groove', 'jungle-run', 'eurobeat', 'idol-disco', 'vocal-rock'],
  variants: [
    {
      mood: { valence: -0.1, energy: 0.5 },
      colors: {
        sky: '#070a18',
        glow: '#2a1c4a',
        bldg0: '#0e1124',
        bldg1: '#161a32',
        edge: '#3a4068',
        win: '#ffcf78',
        winCool: '#8ad8ff',
        asphalt: '#101426',
        sheen: '#283058',
        walk: '#1c2036',
        stripe: '#8a90b0',
        ink: '#06060e',
        neonA: '#ff3c9a',
        neonB: '#3ce6ff',
        neonC: '#ffe14a',
        neonD: '#8aff6a',
        umbrella: '#ff5a4a',
        clear: '#d8e2f4',
        rain: '#8a98c8',
        red: '#ff3a3a',
        green: '#4aff9a',
        head: '#fff4cc',
      },
    },
    {
      mood: { valence: -0.55, energy: 0.05 },
      colors: {
        sky: '#141c34',
        glow: '#3c4a6e',
        bldg0: '#1c2440',
        bldg1: '#262f50',
        edge: '#4a5680',
        win: '#e8c68a',
        winCool: '#9ab8e0',
        asphalt: '#1e2440',
        sheen: '#3a4670',
        walk: '#2c3454',
        stripe: '#a4acc8',
        ink: '#0a0e1c',
        neonA: '#c45ac8',
        neonB: '#4ab8e8',
        neonC: '#e8d06a',
        neonD: '#6ad8a8',
        umbrella: '#d85a5a',
        clear: '#c8d4ea',
        rain: '#9aa8d0',
        red: '#ff4a4a',
        green: '#5ae8a0',
        head: '#f0ecd8',
      },
    },
    {
      mood: { valence: 0.45, energy: 0.8 },
      colors: {
        sky: '#1a0628',
        glow: '#6a1a5a',
        bldg0: '#200c34',
        bldg1: '#2e1248',
        edge: '#6a2e8a',
        win: '#ffd86a',
        winCool: '#ff9ae0',
        asphalt: '#1c0c2c',
        sheen: '#4a1e5e',
        walk: '#2e1840',
        stripe: '#c4a0d8',
        ink: '#0c0414',
        neonA: '#ff2e8a',
        neonB: '#2effe0',
        neonC: '#fff04a',
        neonD: '#ff8a2e',
        umbrella: '#ff4a6a',
        clear: '#f0dcff',
        rain: '#b08ad8',
        red: '#ff3a5a',
        green: '#3affb0',
        head: '#fff0d0',
      },
    },
  ],
  layers: [city, street, traffic, crowd, signals, rain],
});
