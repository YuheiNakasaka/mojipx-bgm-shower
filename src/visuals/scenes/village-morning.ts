// A hillside village: cottages in terraced rows with smoking chimneys, round trees that sway on the beat,
// clouds drifting over rolling hills and a few birds crossing the sky.
import { type Ctx, fillRect, type Sprite } from 'mojipx';
import { bayer, ditherGradient, fillColumns, hexToRgb, noise1, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import {
  type Box,
  colorKey,
  discImage,
  drawGlow,
  driftingClouds,
  fillDither,
  flock,
  memoLayer,
  paletteBy,
  smokePlume,
  spanDisc,
} from './batch-1-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sun'
  | 'sunGlow'
  | 'cloud'
  | 'cloudShade'
  | 'hillFar'
  | 'hillNear'
  | 'grass'
  | 'grassDark'
  | 'leaf'
  | 'wall'
  | 'wallShade'
  | 'roof'
  | 'roofShade'
  | 'roofAlt'
  | 'window'
  | 'smoke'
  | 'dark';

// A cottage or a tree: where it stands, its scale and a seed for its variations.
type Spot = { readonly x: number; readonly s: number; readonly seed: number };
type House = Spot;
type Tree = Spot;
type Row = { readonly base: number; readonly s: number; readonly houses: readonly House[]; readonly trees: readonly Tree[] };
type Layout = { readonly hz: number; readonly rows: readonly Row[] };

const unitOf = (f: Frame): number => Math.min(f.w, f.h);

const slotsOf = (w: number, s: number, row: number, front: boolean): { houses: House[]; trees: Tree[] } => {
  const spacing = Math.max(8, Math.round(46 * s));
  const shift = row % 2 === 0 ? 0 : 0.5;
  const reach = Math.ceil(w / 2 / spacing) + 1;
  const houses: House[] = [];
  const trees: Tree[] = [];
  for (let k = -reach; k <= reach; k++) {
    const x = Math.round(w / 2 + (k + shift) * spacing + (rand(k, row + 40) - 0.5) * spacing * 0.3);
    const isHouse = (front && k === 0) || rand(k, row + 50) < 0.6;
    if (isHouse) houses.push({ x, s, seed: k * 7 + row });
    trees.push({ x: x + Math.round((isHouse ? 0.62 : 0.05) * spacing), s: s * (0.8 + 0.4 * rand(k, row + 60)), seed: k * 5 + row });
  }
  return { houses, trees };
};

const layouts = new Map<string, Layout>();

// Rows of cottages from the back of the valley to the front; a taller screen gets more rows.
const layoutOf = (f: Frame): Layout => {
  const key = `${f.w}x${f.h}`;
  const hit = layouts.get(key);
  if (hit) return hit;
  const u = unitOf(f);
  const hz = Math.round(f.h - 0.42 * u - 0.22 * (f.h - u));
  const back = hz + 0.08 * u;
  const front = f.h - 0.06 * u;
  const count = Math.max(3, Math.round((front - back) / (0.16 * u)) + 1);
  const rows = Array.from({ length: count }, (_, r) => {
    const s = (0.5 + (0.75 * r) / (count - 1)) * (u / 180);
    return { base: Math.round(back + ((front - back) * r) / (count - 1)), s, ...slotsOf(f.w, s, r, r === count - 1) };
  });
  const layout = { hz, rows };
  layouts.set(key, layout);
  return layout;
};

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const { hz } = layoutOf(f);
  ctx.drawImage(ditherGradient(f.w, hz, [c.sky0, c.sky1, c.sky2]), 0, 0);
  const u = unitOf(f);
  const r = Math.round(u * 0.07);
  const cx = f.w * 0.72;
  const cy = hz - u * 0.36;
  drawGlow(ctx, c.sunGlow, cx, cy, r * 2.4 + f.kick * 2, r * 2.4 + f.kick * 2, 0.75);
  ctx.fillStyle = c.sunGlow;
  spanDisc(ctx, cx, cy, r + 1);
  ctx.fillStyle = c.sun;
  spanDisc(ctx, cx, cy, r);
};

const clouds = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const { hz } = layoutOf(f);
  const u = unitOf(f);
  const opts = { top: hz * 0.16, span: hz * 0.6, size: u * 0.085, speed: 2.5 + f.energy * 2 };
  driftingClouds(ctx, f, c.cloud, c.cloudShade, { ...opts, count: Math.max(3, Math.round((f.w * hz) / 9000)), seed: 11 });
};

const paintHills = (ctx: Ctx, w: number, hz: number, u: number, c: Colors<K>): void => {
  fillColumns(ctx, w, hz, c.hillFar, (x) => hz - u * (0.05 + 0.13 * noise1(x / 70, 3)));
  fillColumns(ctx, w, hz, c.hillNear, (x) => hz - u * (0.02 + 0.06 * noise1(x / 45, 8)));
  // Little round trees along the near ridge.
  for (let x = 4; x < w; x += 7 + Math.floor(rand(x, 4) * 9)) {
    const top = hz - u * (0.02 + 0.06 * noise1(x / 45, 8));
    ctx.fillStyle = c.grassDark;
    spanDisc(ctx, x, top - 1, 2 + Math.floor(rand(x, 5) * 2));
  }
};

// Crop fields between the rows: patches of dithered furrows.
const paintFields = (ctx: Ctx, w: number, rows: readonly Row[], c: Colors<K>): void => {
  rows.slice(1).forEach((row, r) => {
    const top = (rows[r] as Row).base + 4;
    const rowsH = row.base - top - Math.round(10 * row.s);
    for (let x = Math.floor(rand(r, 70) * -40); x < w; x += 30 + Math.floor(rand(x, r + 71) * 40)) {
      const fw = 18 + Math.floor(rand(x, r + 72) * 30);
      if (rand(x, r + 73) < 0.4 || rowsH < 4) continue;
      for (let y = 0; y < rowsH; y += 2) fillDither(ctx, y % 4 === 0 ? c.grassDark : c.leaf, 0.5, x + (y >> 1), top + y, fw, 1);
    }
  });
};

// A dirt lane winding down from the far hills to the front of the village.
const paintLane = (ctx: Ctx, w: number, hz: number, h: number, c: Colors<K>): void => {
  for (let y = hz; y < h; y++) {
    const d = (y - hz) / (h - hz);
    const x = w / 2 + Math.sin(y / 17) * w * 0.12 * d;
    const half = 0.5 + d * 4;
    fillRect(ctx, c.wallShade, Math.round(x - half), y, Math.round(half * 2) + 1, 1);
  }
};

const paintFlowers = (ctx: Ctx, w: number, from: number, h: number, c: Colors<K>): void => {
  const colors = [c.wall, c.window, c.roof];
  for (let i = 0; i < (w * (h - from)) / 60; i++) {
    fillRect(ctx, colors[i % 3] as string, Math.floor(rand(i, 80) * w), from + Math.floor(rand(i, 81) * (h - from)), 1, 1);
  }
};

const paintGround = (ctx: Ctx, f: Frame, layout: Layout, c: Colors<K>): void => {
  ctx.drawImage(ditherGradient(f.w, f.h - layout.hz, [c.hillNear, c.grass, c.grass, c.grassDark]), 0, layout.hz);
  paintFields(ctx, f.w, layout.rows, c);
  paintLane(ctx, f.w, layout.hz, f.h, c);
  const front = layout.rows[layout.rows.length - 1] as Row;
  paintFlowers(ctx, f.w, front.base + 3, f.h, c);
};

const hills = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const layout = layoutOf(f);
  const layer = memoLayer(`vm-hills:${f.w}x${f.h}:${colorKey(c)}`, f.w, f.h, (g) => {
    paintHills(g, f.w, layout.hz, unitOf(f), c);
    paintGround(g, f, layout, c);
  });
  ctx.drawImage(layer, 0, 0);
};

type Geom = { readonly x: number; readonly w: number; readonly wallH: number; readonly roofH: number; readonly depth: number };

const geomOf = (house: House): Geom => {
  const w = Math.max(8, Math.round(20 * house.s * (0.85 + 0.4 * rand(house.seed, 1))));
  const depth = Math.round(w * (0.6 + 0.35 * rand(house.seed, 2)));
  return { x: house.x - Math.round((w + depth) / 2), w, wallH: Math.round(w * 0.6), roofH: Math.round(w * 0.55), depth };
};

const chimneyOf = (g: Geom, base: number): Box => ({
  x: g.x + g.w + Math.round(g.depth * 0.55),
  y: base - g.wallH - g.roofH - 1,
  w: Math.max(2, Math.round(g.w * 0.16)),
  h: Math.round(g.roofH * 0.7),
});

// A cottage seen from three-quarters: gable front, side wall and the sloping roof over it.
const cottageGable = (ctx: Ctx, g: Geom, base: number, c: Colors<K>): void => {
  fillRect(ctx, c.wall, g.x, base - g.wallH, g.w, g.wallH);
  const cx = g.x + g.w / 2;
  for (let r = 0; r < g.roofH; r++) {
    const half = Math.round(((r + 1) / g.roofH) * (g.w / 2 + 1));
    fillRect(ctx, c.wall, cx - half, base - g.wallH - g.roofH + r, half * 2, 1);
    fillRect(ctx, c.roofShade, cx - half - 1, base - g.wallH - g.roofH + r, 1, 1);
  }
};

const cottageSide = (ctx: Ctx, g: Geom, base: number, roof: string, c: Colors<K>): void => {
  const cx = g.x + g.w / 2;
  fillRect(ctx, c.wallShade, g.x + g.w, base - g.wallH, g.depth, g.wallH);
  for (let r = 0; r < g.roofH + 1; r++) {
    const half = Math.round(((r + 1) / g.roofH) * (g.w / 2 + 1));
    fillRect(ctx, r % 3 === 2 ? c.roofShade : roof, cx + half - 1, base - g.wallH - g.roofH + r, g.depth + 1, 1);
  }
  fillRect(ctx, c.roofShade, g.x + g.w, base - g.wallH + 1, g.depth, 1);
};

const cottageDetails = (ctx: Ctx, g: Geom, base: number, c: Colors<K>, seed: number): void => {
  const doorW = Math.max(2, Math.round(g.w * 0.28));
  const doorH = Math.max(3, Math.round(g.wallH * 0.62));
  fillRect(ctx, c.dark, g.x + Math.round((g.w - doorW) / 2), base - doorH, doorW, doorH);
  const win = Math.max(2, Math.round(g.w * 0.2));
  const winY = base - Math.round(g.wallH * 0.72);
  const panes = g.depth > g.w * 0.75 ? 2 : 1;
  for (let k = 0; k < panes; k++) {
    const wx = g.x + g.w + Math.round(g.depth * (panes === 1 ? 0.35 : 0.18 + 0.45 * k));
    fillRect(ctx, c.dark, wx - 1, winY - 1, win + 2, win + 2);
    fillRect(ctx, c.window, wx, winY, win, win);
  }
  if (rand(seed, 3) < 0.6) fillRect(ctx, c.window, g.x + Math.round(g.w / 2) - 1, base - g.wallH - Math.round(g.w * 0.3), 2, 2);
};

const cottage = (ctx: Ctx, house: House, base: number, c: Colors<K>): void => {
  const g = geomOf(house);
  const ch = chimneyOf(g, base);
  fillRect(ctx, c.roofShade, ch.x, ch.y, ch.w, ch.h + 3);
  fillRect(ctx, c.dark, ch.x, ch.y, ch.w, 1);
  cottageSide(ctx, g, base, rand(house.seed, 4) < 0.35 ? c.roofAlt : c.roof, c);
  cottageGable(ctx, g, base, c);
  cottageDetails(ctx, g, base, c, house.seed);
};

const paintRow = (ctx: Ctx, row: Row, c: Colors<K>): void => {
  for (const house of row.houses) cottage(ctx, house, row.base, c);
  // A hedge of bushes along the front of the row.
  ctx.fillStyle = c.grassDark;
  for (let x = 0; x < ctx.canvas.width; x += 3 + Math.floor(rand(x, row.base) * 4))
    spanDisc(ctx, x, row.base + 1, 1 + Math.round(row.s * 1.5));
};

// A round tree canopy, shaded toward the lower right, cached per size.
const canopy = (r: number, c: Colors<K>): HTMLCanvasElement => {
  const tones = [hexToRgb(c.grass), hexToRgb(c.leaf), hexToRgb(c.grassDark)] as const;
  return discImage(`vm-canopy:${c.leaf}:${c.grassDark}:${c.grass}`, r, (x, y) => {
    const shade = (x - r + (y - r) * 1.3) / (r * 1.6);
    if (shade > 0.35 + bayer(x, y) * 0.5) return tones[2];
    return shade < -0.55 + bayer(x, y) * 0.3 ? tones[0] : tones[1];
  });
};

const tree = (ctx: Ctx, f: Frame, t: Tree, base: number, c: Colors<K>): void => {
  const r = Math.max(3, Math.round(7 * t.s));
  const trunk = Math.max(2, Math.round(4 * t.s));
  fillRect(ctx, c.dark, t.x, base - trunk, Math.max(1, Math.round(t.s * 1.5)), trunk);
  const img = canopy(r, c);
  const sway = Math.sin(f.beat * Math.PI + t.seed * 0.3) * (0.8 + f.energy * 1.4);
  const top = base - trunk - r * 2;
  const third = Math.ceil(img.height / 3);
  for (let k = 0; k < 3; k++) {
    const dx = Math.round(sway * (1 - k / 2));
    ctx.drawImage(img, 0, k * third, img.width, third, t.x - r + dx, top + k * third, img.width, third);
  }
};

const village = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const { rows } = layoutOf(f);
  rows.forEach((row, r) => {
    const layer = memoLayer(`vm-row:${f.w}x${f.h}:${r}:${colorKey(c)}`, f.w, f.h, (g) => paintRow(g, row, c));
    ctx.drawImage(layer, 0, 0);
    for (const house of row.houses) {
      if (rand(house.seed, 5) > 0.65) continue;
      const ch = chimneyOf(geomOf(house), row.base);
      smokePlume(ctx, f, ch.x + ch.w / 2, ch.y - 2, c.smoke, house.seed, 14 + 16 * row.s);
    }
    for (const t of row.trees) tree(ctx, f, t, row.base + 1, c);
  });
};

const BIRD: readonly Sprite[] = [
  ['k.....k', '.k...k.', '..k.k..', '...k...'],
  ['.......', 'kk...kk', '..kkk..', '...k...'],
  ['.......', '.......', 'kkkkkkk', '...k...'],
  ['.......', '..kkk..', '.k.k.k.', 'k..k..k'],
];

const birdPalette = paletteBy<K>((c) => ({ k: c.dark }));

const birds = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const { hz } = layoutOf(f);
  flock(ctx, f, BIRD, birdPalette(c), { count: 3 + Math.round(f.energy * 2), top: hz * 0.2, span: hz * 0.3, speed: 9, seed: 23 });
};

export const villageMorning = defineScene<K>({
  id: 'village-morning',
  title: 'Village Morning',
  mood: { valence: 0.65, energy: -0.3 },
  styles: ['cozy-village', 'town-waltz', 'pixel-quest', 'celtic-isle'],
  variants: [
    {
      mood: { valence: 0.75, energy: -0.15 },
      colors: {
        sky0: '#6fb8e6',
        sky1: '#a4d8f0',
        sky2: '#e8f6e4',
        sun: '#fffbe0',
        sunGlow: '#fff0a8',
        cloud: '#ffffff',
        cloudShade: '#cde2f2',
        hillFar: '#9ccbbc',
        hillNear: '#76b67e',
        grass: '#93c95e',
        grassDark: '#4f9150',
        leaf: '#69ab52',
        wall: '#f6e7c8',
        wallShade: '#cdae8a',
        roof: '#d4644a',
        roofShade: '#8e3d3c',
        roofAlt: '#6a8fb0',
        window: '#a9dcf2',
        smoke: '#f4f6f8',
        dark: '#4a3340',
      },
    },
    {
      mood: { valence: 0.45, energy: -0.5 },
      colors: {
        sky0: '#3a3c7c',
        sky1: '#c3607c',
        sky2: '#f8b868',
        sun: '#fff1b8',
        sunGlow: '#ffc874',
        cloud: '#ffd6a6',
        cloudShade: '#c67a8e',
        hillFar: '#9a6c8c',
        hillNear: '#6e5f70',
        grass: '#a99d55',
        grassDark: '#5c5c45',
        leaf: '#7f7c48',
        wall: '#f2cc9c',
        wallShade: '#a9766c',
        roof: '#aa454c',
        roofShade: '#5d2b40',
        roofAlt: '#7a5a7e',
        window: '#ffd66c',
        smoke: '#e8c6b0',
        dark: '#38213a',
      },
    },
  ],
  layers: [sky, clouds, hills, birds, village],
});
