// The great wall snaking over ridge after ridge of autumn mountains: mist pooled in the valleys between them, the sun
// coming up behind the farthest range, a flag snapping on the nearest watchtower and leaves (or snow) drifting down.
import { type Ctx, fillRect } from 'mojipx';
import { bayer, ditherGradient, rand, ridgeNoise } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { colorKey, flock, paletteBy, wrap } from './batch-1-helpers.ts';
import { sunWithHalo } from './batch-4-helpers.ts';
import { BIRD, noise2, pixelLayer } from './batch-5-helpers.ts';
import { frameLayer, wideOf } from './batch-6-helpers.ts';
import { drawMist } from './batch-10-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sun'
  | 'haze0'
  | 'haze1'
  | 'haze2'
  | 'leaf0'
  | 'leaf1'
  | 'leaf2'
  | 'leafDk'
  | 'wall'
  | 'wallHi'
  | 'wallLo'
  | 'ink'
  | 'mist'
  | 'mistLo'
  | 'flag'
  | 'fall';

const birdPalette = paletteBy<K>((c) => ({ o: c.ink }));

// ---- ridges ----

/** A summit: where it stands (share of the width) and how high it rises above the ridge's base (share of the height). */
type Summit = readonly [number, number];

type Ridge = {
  readonly base: number;
  readonly summits: readonly Summit[];
  /** The stretch of the ridge the wall runs along (shares of the width), and how thick the wall is there. */
  readonly wall: readonly [number, number] | null;
  readonly thick: number;
};

type Layout = { readonly ridges: readonly Ridge[]; readonly spread: number; readonly sun: readonly [number, number] };

const WIDE: Layout = {
  spread: 0.13,
  sun: [0.68, 0.4],
  ridges: [
    {
      base: 0.62,
      thick: 0,
      wall: null,
      summits: [
        [0.12, 0.2],
        [0.42, 0.26],
        [0.75, 0.22],
        [0.98, 0.18],
      ],
    },
    {
      base: 0.7,
      thick: 2,
      wall: [0.3, 1.05],
      summits: [
        [0.05, 0.2],
        [0.3, 0.24],
        [0.56, 0.18],
        [0.82, 0.25],
      ],
    },
    {
      base: 0.82,
      thick: 3,
      wall: [-0.05, 0.81],
      summits: [
        [0.15, 0.22],
        [0.48, 0.27],
        [0.8, 0.2],
      ],
    },
    {
      base: 1.05,
      thick: 8,
      wall: [-0.05, 0.6],
      summits: [
        [-0.08, 0.44],
        [0.3, 0.37],
        [0.95, 0.22],
      ],
    },
  ],
};

const TALL: Layout = {
  spread: 0.2,
  sun: [0.62, 0.36],
  ridges: [
    {
      base: 0.5,
      thick: 0,
      wall: null,
      summits: [
        [0.2, 0.12],
        [0.72, 0.15],
      ],
    },
    {
      base: 0.58,
      thick: 2,
      wall: [0.0, 1.05],
      summits: [
        [0.0, 0.1],
        [0.46, 0.13],
        [0.92, 0.11],
      ],
    },
    {
      base: 0.71,
      thick: 3,
      wall: [-0.05, 1.05],
      summits: [
        [0.25, 0.14],
        [0.85, 0.12],
      ],
    },
    {
      base: 0.97,
      thick: 8,
      wall: [-0.05, 1.05],
      summits: [
        [0.12, 0.21],
        [0.64, 0.17],
      ],
    },
  ],
};

const layoutOf = (f: Frame): Layout => (wideOf(f) ? WIDE : TALL);

// The ridge's crest: the highest of its rounded summits, roughened a little.
const crestAt = (f: Frame, l: Layout, r: Ridge, x: number): number => {
  let rise = 0;
  for (const [sx, sh] of r.summits) rise = Math.max(rise, sh * Math.exp(-(((x / f.w - sx) / l.spread) ** 2)));
  return Math.round(f.h * (r.base - rise) + (ridgeNoise(x / 9, r.base * 100) - 0.5) * 6);
};

// The colours of a ridge, far ranges hazy and flat, near ones in their autumn leaves.
const foliage = (c: Colors<K>, depth: number, x: number, y: number, below: number): string => {
  if (depth === 0) return below < 2 ? c.haze1 : c.haze0;
  const shade = Math.min(1, below / 70) * 0.55 + (bayer(x, y) - 0.5) * 0.22;
  if (depth === 1) return shade > 0.2 ? c.haze2 : c.haze1;
  if (below < 2) return c.leaf0;
  const scale = depth === 3 ? 1 : 0.6;
  const n = noise2(x / (7 * scale), y / (5 * scale), depth * 7) * 0.55 + noise2(x / 2.2, y / 2, depth * 7 + 1) * 0.25 + shade;
  if (n < 0.42) return c.leaf0;
  if (n < 0.6) return c.leaf1;
  return n < 0.8 ? c.leaf2 : c.leafDk;
};

// ---- the wall ----

// A watchtower astride the wall: a block with an arched window and a crenellated roofline.
const paintTower = (g: Ctx, c: Colors<K>, x: number, foot: number, t: number): void => {
  const w = t * 4 + 1;
  const h = t * 3;
  const left = x - Math.floor(w / 2);
  const top = foot - h;
  fillRect(g, c.wall, left, top, w, h);
  fillRect(g, c.wallLo, left + w - Math.max(1, Math.floor(t / 2)), top, Math.max(1, Math.floor(t / 2)), h);
  fillRect(g, c.wallHi, left, top, w, 1);
  for (let k = 0; k < w; k += 3) fillRect(g, c.wall, left + k, top - Math.max(1, t / 3), 2, Math.max(1, t / 3));
  const win = Math.max(1, Math.floor(t / 2));
  for (const wx of t > 3 ? [left + t, left + w - t - win] : [x])
    fillRect(g, c.ink, wx, top + Math.ceil(h * 0.35), win, Math.ceil(h * 0.35));
};

// The wall on a ridge: a band of stone along the crest, its walkway catching the light, battlements on top, and a
// watchtower on every summit it crosses.
const paintWall = (g: Ctx, f: Frame, l: Layout, c: Colors<K>, r: Ridge): void => {
  if (!r.wall) return;
  const [a, b] = [Math.round(r.wall[0] * f.w), Math.round(r.wall[1] * f.w)];
  const merlon = Math.max(1, Math.round(r.thick / 3));
  for (let x = Math.max(0, a); x < Math.min(f.w, b); x++) {
    const crest = crestAt(f, l, r, x) + 1;
    const face = Math.ceil(r.thick / 2);
    fillRect(g, c.wall, x, crest - r.thick, 1, r.thick);
    fillRect(g, c.wallHi, x, crest - r.thick, 1, Math.max(1, Math.floor(r.thick / 3)));
    fillRect(g, c.wallLo, x, crest, 1, face);
    if (r.thick > 3 && x % 4 === 0) fillRect(g, c.wallLo, x, crest - r.thick + Math.floor(r.thick / 3), 1, 1);
    if (x % 3 !== 2) fillRect(g, c.wall, x, crest - r.thick - merlon, 1, merlon);
  }
  for (const [sx] of r.summits) {
    const x = Math.round(sx * f.w);
    if (x >= a && x < b && x >= 0 && x < f.w) paintTower(g, c, x, crestAt(f, l, r, x) + 1, r.thick);
  }
};

// The ridge's slopes, below its crest, painted pixel by pixel.
const foliageLayer = (f: Frame, c: Colors<K>, r: Ridge, depth: number): HTMLCanvasElement => {
  const l = layoutOf(f);
  const crests = Array.from({ length: f.w }, (_, x) => crestAt(f, l, r, x));
  return pixelLayer(`wall-foliage-${depth}:${colorKey(c)}`, f.w, f.h, (x, y) => {
    const below = y - (crests[x] ?? f.h);
    return below >= 0 ? foliage(c, depth, x, y, below) : null;
  });
};

const ridgeLayer = (f: Frame, c: Colors<K>, depth: number): HTMLCanvasElement =>
  frameLayer(`wall-ridge-${depth}`, f, c, (g) => {
    const l = layoutOf(f);
    const r = l.ridges[depth] as Ridge;
    g.drawImage(foliageLayer(f, c, r, depth), 0, 0);
    paintWall(g, f, l, c, r);
  });

// ---- the sky ----

const skyLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('wall-sky', f, c, (g) => {
    g.drawImage(ditherGradient(f.w, f.h, [c.sky0, c.sky1, c.sky2, c.sky2]), 0, 0);
  });

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  ctx.drawImage(skyLayer(f, c), 0, 0);
  const rise = Math.min(1, f.t / 60) * 10;
  sunWithHalo(ctx, f.w * l.sun[0], f.h * l.sun[1] - rise, 10, c.sun, c.sky2, 5);
  flock(ctx, f, BIRD, birdPalette(c), { count: 4, top: f.h * l.sun[1] * 0.4, span: 30, speed: -7, seed: 61 });
};

// ---- the mountains, back to front, with mist between them ----

// The red flag on the nearest tower, flapping in two shapes that swap on the beat.
const flagOn = (ctx: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  const r = l.ridges[3] as Ridge;
  const [sx] = r.summits[1] as Summit;
  const x = Math.round(sx * f.w);
  const top = crestAt(f, l, r, x) + 1 - r.thick * 3 - 2;
  fillRect(ctx, c.ink, x, top - 12, 1, 12);
  const flap = Math.floor(f.beat) % 2;
  for (let k = 0; k < 7; k++) {
    const dy = Math.round(Math.sin(k * 0.9 + flap * Math.PI) * 1.2);
    fillRect(ctx, c.flag, x + 1 + k, top - 12 + dy, 1, 4 - Math.floor(k / 3));
  }
};

// Leaves (or snowflakes) tumbling down through the foreground.
const falling = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  for (let i = 0; i < 24; i++) {
    const y = wrap(rand(i, 71) * f.h + f.t * (10 + rand(i, 72) * 8), f.h + 8) - 4;
    const x = wrap(rand(i, 73) * f.w + Math.sin(f.t * 1.4 + i * 2.1) * 6 - f.t * 5, f.w);
    const flip = Math.sin(f.t * 4 + i) > 0;
    fillRect(ctx, c.fall, Math.round(x), Math.round(y), flip ? 2 : 1, 1);
  }
};

const mountains = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  for (let depth = 0; depth < l.ridges.length; depth++) {
    ctx.drawImage(ridgeLayer(f, c, depth), 0, 0);
    const next = l.ridges[depth + 1];
    if (!next) continue;
    const valley = Math.round(f.h * (next.base - 0.12));
    const speed = (depth % 2 === 0 ? 2 : -2.5) * (1 + depth * 0.3);
    drawMist(ctx, f, c.mist, c.mistLo, { y: valley - 10, h: 22 + depth * 4, speed, density: 0.85, seed: 62 + depth });
  }
  flagOn(ctx, f, c, l);
  falling(ctx, f, c);
};

export const greatWall = defineScene<K>({
  id: 'great-wall',
  title: 'Endless Wall',
  mood: { valence: 0.0, energy: 0.3 },
  styles: ['grand-field', 'pixel-quest', 'credits-roll', 'snowfall', 'celtic-isle', 'band-rock'],
  variants: [
    {
      // An autumn sunrise: blue ranges fading into gold, the near hills red and amber.
      mood: { valence: 0.0, energy: 0.3 },
      colors: {
        sky0: '#38407e',
        sky1: '#b4708a',
        sky2: '#ffc480',
        sun: '#fff4c8',
        haze0: '#8a7aa6',
        haze1: '#a88aa8',
        haze2: '#6e5a86',
        leaf0: '#f2a640',
        leaf1: '#d8582e',
        leaf2: '#9c3a32',
        leafDk: '#5a2a34',
        wall: '#c4a88e',
        wallHi: '#f2d8b4',
        wallLo: '#7a5e5a',
        ink: '#2a1a26',
        mist: '#ffe6d0',
        mistLo: '#d8a8b4',
        flag: '#e02a2a',
        fall: '#f6a43c',
      },
    },
    {
      // Snow: a grey-blue morning, the ridges white and the wall's walkway drifted over.
      mood: { valence: -0.3, energy: -0.4 },
      colors: {
        sky0: '#5a6a8a',
        sky1: '#9aa8c0',
        sky2: '#d8dce8',
        sun: '#f4f6ff',
        haze0: '#a8b4cc',
        haze1: '#c8d0e0',
        haze2: '#8a98b4',
        leaf0: '#f4f8ff',
        leaf1: '#d0d8e8',
        leaf2: '#8a98b0',
        leafDk: '#3e4a5e',
        wall: '#8a8a96',
        wallHi: '#ffffff',
        wallLo: '#4e5262',
        ink: '#1e2230',
        mist: '#f0f4fc',
        mistLo: '#b8c2d6',
        flag: '#c8303a',
        fall: '#ffffff',
      },
    },
    {
      // High summer: a deep blue sky, every ridge green, the stone pale in the sun.
      mood: { valence: 0.6, energy: 0.55 },
      colors: {
        sky0: '#2a6ad0',
        sky1: '#6aaaf0',
        sky2: '#d8f0ff',
        sun: '#ffffff',
        haze0: '#7aa0c8',
        haze1: '#94b8d8',
        haze2: '#5a86a8',
        leaf0: '#9ad050',
        leaf1: '#5aa040',
        leaf2: '#2e7a3a',
        leafDk: '#1e4a2e',
        wall: '#d0c4a8',
        wallHi: '#fff4d8',
        wallLo: '#8a7a68',
        ink: '#1e2a26',
        mist: '#ffffff',
        mistLo: '#cfe2f2',
        flag: '#e83a2a',
        fall: '#ffffff',
      },
    },
  ],
  layers: [sky, mountains],
});
