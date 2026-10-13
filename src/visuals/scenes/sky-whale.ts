// A girl naps on the back of a giant whale gliding over a sea of clouds: birds rest beside her, the whale blows a
// fountain of sparkles on every bar, and now and then she half-opens one sleepy eye before dozing off again.
import { type Ctx, drawSprite, fillRect, flipped, mixColor, type Palette, type Sprite } from 'mojipx';
import { bayer, ditherGradient, frac, hexToRgb, rand, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { colorKey, driftingClouds, fillDither, memoPixels, type Rgb, setPixel } from './batch-1-helpers.ts';
import { drawGlow, moon, smooth, tileX, wrap } from './batch-2-helpers.ts';
import { paletteOf } from './batch-3-helpers.ts';
import { fillPolygon, type Pt, sunWithHalo } from './batch-4-helpers.ts';
import { isDark, mixHex } from './batch-5-helpers.ts';
import { twinkle } from './batch-6-helpers.ts';
import { blinking, limb, wide } from './batch-7-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sun'
  | 'glow'
  | 'cloud'
  | 'cloudLo'
  | 'cloudFar'
  | 'whale'
  | 'whaleHi'
  | 'whaleLo'
  | 'belly'
  | 'ink'
  | 'skin'
  | 'skinLo'
  | 'blush'
  | 'hair'
  | 'hairHi'
  | 'hairLo'
  | 'sweater'
  | 'sweaterLo'
  | 'pale'
  | 'iris'
  | 'spark';

// ---- layout: the whale's tail end, length, centre line and half-thickness, and where the sea of clouds begins ----

type Lay = { readonly x0: number; readonly len: number; readonly cy: number; readonly th: number; readonly sea: number };

const layOf = (f: Frame): Lay => {
  const bob = Math.round(Math.sin(f.t * 0.7) * 2);
  if (wide(f)) {
    const len = Math.round(f.w * 0.7);
    return {
      x0: Math.round((f.w - len) / 2) - 6,
      len,
      cy: Math.round(f.h * 0.58) + bob,
      th: Math.round(len * 0.12),
      sea: Math.round(f.h * 0.8),
    };
  }
  const len = Math.round(f.w * 1.25);
  return { x0: f.w - len - 4, len, cy: Math.round(f.h * 0.53) + bob, th: Math.round(len * 0.12), sea: Math.round(f.h * 0.66) };
};

// The whale's outline as half-thicknesses above and below its centre line at u (0 tail … 1 nose): a long tapering
// back and a big round head with a deep throat.
const topAt = (u: number): number => (u < 0.55 ? 0.22 + 0.78 * smooth(0, 0.5, u) : Math.sqrt(Math.max(0, 1 - ((u - 0.55) / 0.45) ** 2.5)));
const botAt = (u: number): number =>
  u < 0.55 ? 0.16 + 0.8 * smooth(0.05, 0.55, u) : 0.96 * Math.sqrt(Math.max(0, 1 - ((u - 0.55) / 0.45) ** 2));
const xAt = (l: Lay, u: number): number => l.x0 + 1 + Math.round(u * l.len);
const backY = (l: Lay, u: number): number => l.cy - Math.round(topAt(u) * l.th);

// The mouth runs back from the nose a little below the centre line and curls up at its corner into a smile.
const mouthV = (u: number): number => 0.22 - Math.max(0, 0.66 - u) * 3;

// ---- sky ----

const sunAt = (f: Frame): readonly [number, number] =>
  wide(f) ? [Math.round(f.w * 0.15), Math.round(f.h * 0.2)] : [Math.round(f.w * 0.26), Math.round(f.h * 0.1)];

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layOf(f);
  ctx.drawImage(ditherGradient(f.w, l.sea + 8, [c.sky0, c.sky1, c.sky2]), 0, 0);
  const [sx, sy] = sunAt(f);
  if (!isDark(c.sky0)) {
    sunWithHalo(ctx, sx, sy, 9, c.sun, c.glow, 3.4);
    return;
  }
  stars(ctx, f.w, l.sea, f.t, [c.pale, c.sun, c.spark], Math.round((f.w * l.sea) / 260), 23, 0.85);
  drawGlow(ctx, sx, sy, 30, c.glow, 0.7);
  moon(ctx, sx, sy, 11, c.sun, paletteOf(c, moonPalette).sea as string);
};

const moonPalette = (c: Colors<K>): Palette => ({ sea: mixColor(c.sun, c.cloudFar, 0.3) });

// On clear days a faint rainbow arcs across the sky opposite the sun; only its crown shows, its feet fade into the haze.
const rainbowLayer = (f: Frame, l: Lay, c: Colors<K>): HTMLCanvasElement =>
  memoPixels(`sw-bow:${f.w}x${f.h}:${l.sea}:${colorKey(c)}`, f.w, l.sea, (img) => {
    const bands = [c.sweater, c.whaleHi, mixHex(c.iris, c.pale, 0.35), c.sun, c.spark].map(hexToRgb);
    const cx = f.w * (wide(f) ? 0.98 : 1.05);
    const cy = l.sea + 6;
    const r0 = f.w * (wide(f) ? 0.34 : 0.7);
    for (let y = 0; y < l.sea; y++) {
      for (let x = 0; x < f.w; x++) {
        const r = Math.hypot(x - cx, y - cy);
        const band = bands[Math.floor((r - r0) / 3)];
        if (band && bayer(x, y) < 0.55 * smooth(0.55, 0.85, (cy - y) / r)) setPixel(img, x, y, band);
      }
    }
  });

const rainbow = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  if (!isDark(c.sky0)) ctx.drawImage(rainbowLayer(f, layOf(f), c), 0, 0);
};

// Far cumulus sit on the horizon and little clouds drift across the sky, both slower than the sea below.
const skyClouds = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layOf(f);
  driftingClouds(ctx, f, c.cloud, c.cloudFar, { count: 3, top: l.sea + 6, span: 6, size: 24, speed: -1.5, seed: 3 });
  driftingClouds(ctx, f, c.pale, c.cloudFar, { count: 3, top: l.sea * 0.12, span: l.sea * 0.3, size: 6, speed: -3, seed: 11 });
};

// A calf follows far off in the haze, its colors washed toward the sky, drifting slowly back; it beats its tail and
// blows a little puff of spray of its own.
// o outline, w body, h back, b belly, e eye; s is its spray.
const CALF: readonly Sprite[] = [
  [
    'ooo....ooo......................',
    'ohhoo.oohho.....................',
    '.owwhoowwo..........oooooo......',
    '..owwwwwo.........oohhhhhhoo....',
    '...owwwo........oohhhwwwwhhhoo..',
    '...owwwooo....oohhwwwwwwwwwwwwo.',
    '....owwwwwooooowwwwwwwwwwwwwwwwo',
    '.....oowwwwwwwwwwwwwwwwwwweowwwo',
    '.......oowwwwwwwwwwwwwwwwwwwwwoo',
    '.........oowwwwwwwwwbbbbbbbbboo.',
    '...........oooowbbbbbbbbbbboo...',
    '...............oooooooooooo.....',
  ],
  [
    '................................',
    'ooo....ooo......................',
    'ohhoo.oohho.........oooooo......',
    '.owwhoowwo........oohhhhhhoo....',
    '..owwwwwo.......oohhhwwwwhhhoo..',
    '...owwwooo....oohhwwwwwwwwwwwwo.',
    '....owwwwwooooowwwwwwwwwwwwwwwwo',
    '.....oowwwwwwwwwwwwwwwwwwweowwwo',
    '.......oowwwwwwwwwwwwwwwwwwwwwoo',
    '.........oowwwwwwwwwbbbbbbbbboo.',
    '...........oooowbbbbbbbbbbboo...',
    '...............oooooooooooo.....',
  ],
];

const calfPalette = (c: Colors<K>): Palette => ({
  o: mixHex(mixHex(c.whaleLo, c.ink, 0.35), c.sky1, 0.45),
  w: mixHex(c.whale, c.sky1, 0.4),
  h: mixHex(c.whaleHi, c.sky1, 0.35),
  b: mixHex(c.belly, c.sky1, 0.35),
  e: mixHex(c.ink, c.sky1, 0.3),
  s: mixHex(c.pale, c.sky1, 0.2),
});

// Every eight beats the calf's spout rises a few pixels and opens into a small fan of droplets.
const calfSpout = (ctx: Ctx, f: Frame, color: string, x: number, y: number): void => {
  const a = f.beat - Math.floor(f.beat / 8) * 8 - 2;
  if (a <= 0 || a >= 1.4) return;
  const h = Math.round(4 * smooth(0, 0.35, a));
  const open = smooth(0, 0.25, a);
  for (let k = 0; k < h; k++) if (bayer(x, y - k) >= smooth(0.45, 0.9, a)) fillRect(ctx, color, x, y - k, 1, 1);
  // Two little arcs: up over the top of the stem, then out and down.
  for (let k = 1; k <= 3; k++) {
    const dy = Math.round(-h + (k * k * 0.45 - 1) * open + a * 1.5);
    if (bayer(x + k, y + dy) < smooth(0.7, 1.3, a)) continue;
    fillRect(ctx, color, x - Math.round(k * open * 1.4), y + dy, 1, 1);
    fillRect(ctx, color, x + Math.round(k * open * 1.4), y + dy, 1, 1);
  }
};

const calf = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layOf(f);
  const sprite = CALF[0] as Sprite;
  const w = sprite[0]?.length ?? 0;
  const x = Math.round(wrap(f.w * 0.62 - f.t * 2.5, f.w + w * 4) - w * 2);
  const y = Math.round(l.sea * (wide(f) ? 0.3 : 0.37) + Math.sin(f.t * 0.6) * 2);
  const palette = paletteOf(c, calfPalette);
  drawSprite(ctx, CALF[Math.floor(f.beat / 2) % 2] as Sprite, palette, x, y);
  calfSpout(ctx, f, palette.s as string, x + 23, y + 1);
};

// ---- the sea of clouds: rows of puffs that repeat every SEA_W pixels and scroll past at their own speeds ----

const SEA_W = 240;

type SeaRow = { readonly seed: number; readonly r: number; readonly light: string; readonly body: string; readonly shade: string };

const seaTop = (x: number, row: SeaRow): number => {
  let top = row.r * 1.6;
  const puffs = Math.round(SEA_W / (row.r * 1.3));
  for (let i = 0; i < puffs; i++) {
    const px = (i + rand(i, row.seed) * 0.6) * (SEA_W / puffs);
    const pr = row.r * (0.7 + 0.5 * rand(i, row.seed + 1));
    const d = Math.min(Math.abs(x - px), SEA_W - Math.abs(x - px));
    if (d < pr) top = Math.min(top, row.r * 1.6 - Math.sqrt(pr * pr - d * d) * 0.8);
  }
  return Math.round(top);
};

const seaRowLayer = (row: SeaRow, h: number): HTMLCanvasElement =>
  memoPixels(`sw-sea:${row.seed}:${row.r}:${h}:${row.light}${row.body}${row.shade}`, SEA_W, h, (img) => {
    const [light, body, shade] = [row.light, row.body, row.shade].map(hexToRgb) as [Rgb, Rgb, Rgb];
    for (let x = 0; x < SEA_W; x++) {
      const top = seaTop(x, row);
      for (let y = Math.max(0, top); y < h; y++) {
        const d = (y - top) / (row.r * 1.4);
        setPixel(img, x, y, y - top < 2 ? light : d > 0.55 + bayer(x, y) * 0.5 ? shade : body);
      }
    }
  });

// Rows of the sea from the horizon forward: each lower, bigger and faster than the one behind it.
const SEA_ROWS = [
  { seed: 31, r: 8, speed: 3, at: 0 },
  { seed: 37, r: 12, speed: 6, at: 8 },
  { seed: 41, r: 16, speed: 10, at: 20 },
  { seed: 43, r: 22, speed: 15, at: 38 },
  { seed: 47, r: 28, speed: 21, at: 64 },
  { seed: 53, r: 34, speed: 28, at: 98 },
] as const;

const seaRow = (ctx: Ctx, f: Frame, c: Colors<K>, k: number): void => {
  const def = SEA_ROWS[k];
  const top = layOf(f).sea + (def?.at ?? f.h);
  if (!def || top > f.h) return;
  const y = top - Math.round(def.r * 0.6);
  const row = { seed: def.seed, r: def.r, light: k < 2 ? c.cloud : c.pale, body: k < 2 ? c.cloudFar : c.cloud, shade: c.cloudLo };
  tileX(ctx, seaRowLayer(row, f.h - y + 1), f.t * def.speed, y, f.w);
};

const seaBack = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  for (let k = 0; k < 2; k++) seaRow(ctx, f, c, k);
};
const seaFront = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  for (let k = 2; k < SEA_ROWS.length; k++) seaRow(ctx, f, c, k);
};

// ---- the whale ----

type Tone = 'ink' | 'whaleHi' | 'whale' | 'whaleLo' | 'belly' | 'groove' | 'pale';

const isBelly = (u: number, v: number): boolean => v > (u >= 0.6 ? mouthV(u) : mouthV(0.6) + (0.6 - u) * 2.2);

// Light comes from above: a bright band along the back, shade low on the flank, and a pale grooved throat.
const toneAt = (u: number, v: number, vs: number, x: number, y: number): Tone => {
  if (isBelly(u, v)) return y % 2 === 0 && u > 0.35 ? 'groove' : 'belly';
  if (vs < -0.72 || (vs < -0.5 && bayer(x, y) < 0.5)) return 'whaleHi';
  if (vs > 0.55 || (vs > 0.3 && bayer(x, y) < 0.5)) return 'whaleLo';
  return 'whale';
};

const SPOTS = [
  [0.74, -0.55],
  [0.79, -0.7],
  [0.83, -0.5],
  [0.88, -0.66],
  [0.92, -0.45],
] as const;

const toneRgb = (c: Colors<K>): Readonly<Record<Tone, Rgb>> => ({
  ink: hexToRgb(c.ink),
  whaleHi: hexToRgb(c.whaleHi),
  whale: hexToRgb(c.whale),
  whaleLo: hexToRgb(c.whaleLo),
  belly: hexToRgb(c.belly),
  groove: hexToRgb(c.whaleHi),
  pale: hexToRgb(c.pale),
});

// One column of the body, its outline, and the outline down the step from the column before when the edge is steep.
const whaleColumn = (img: ImageData, x: number, l: Lay, oy: number, rgb: Readonly<Record<Tone, Rgb>>): void => {
  const u = x / l.len;
  const up = Math.max(0.5, topAt(u) * l.th);
  const down = Math.max(0.5, botAt(u) * l.th);
  const y0 = oy - Math.round(up);
  const y1 = oy + Math.round(down);
  for (let y = y0; y <= y1; y++) {
    const vs = y < oy ? (y - oy) / up : (y - oy) / down;
    setPixel(img, x + 1, y, rgb[toneAt(u, (y - oy) / l.th, vs, x, y)]);
  }
  const prevU = Math.max(0, (x - 1) / l.len);
  const p0 = oy - Math.round(Math.max(0.5, topAt(prevU) * l.th));
  const p1 = oy + Math.round(Math.max(0.5, botAt(prevU) * l.th));
  for (let y = Math.min(y0, p0); y <= Math.max(y0, p0); y++) setPixel(img, y0 < p0 ? x + 1 : x, y, rgb.ink);
  for (let y = Math.min(y1, p1); y <= Math.max(y1, p1); y++) setPixel(img, y1 > p1 ? x + 1 : x, y, rgb.ink);
  if (x === 0 || x === l.len) for (let y = y0; y <= y1; y++) setPixel(img, x + 1, y, rgb.ink);
};

const paintWhale = (img: ImageData, l: Lay, oy: number, c: Colors<K>): void => {
  const rgb = toneRgb(c);
  for (let x = 0; x <= l.len; x++) whaleColumn(img, x, l, oy, rgb);
  for (let x = Math.round(l.len * 0.6); x < l.len - 1; x++) setPixel(img, x + 1, oy + Math.round(mouthV(x / l.len) * l.th), rgb.ink);
  for (const [u, v] of SPOTS) {
    const x = Math.round(u * l.len) + 1;
    const y = oy + Math.round(v * l.th);
    setPixel(img, x, y, rgb.pale);
    setPixel(img, x + 1, y, rgb.whaleHi);
  }
};

const whaleLayer = (l: Lay, c: Colors<K>): HTMLCanvasElement =>
  memoPixels(`sw-whale:${l.len}:${l.th}:${colorKey(c)}`, l.len + 3, l.th * 2 + 6, (img) => paintWhale(img, l, l.th + 2, c));

// A fin as a polygon in units of the whale's thickness, turned by `a` about its root, with a dark rim and a pale edge.
const fin = (ctx: Ctx, pts: readonly Pt[], x: number, y: number, s: number, a: number, fill: string, edge: string, ink: string): void => {
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const at = (dx: number, dy: number): readonly Pt[] =>
    pts.map(([px, py]) => [x + dx + (px * cos - py * sin) * s, y + dy + (px * sin + py * cos) * s] as const);
  for (const [dx, dy] of [
    [-1, 0],
    [1, 0],
    [0, 1],
    [0, -2],
    [-1, -1],
    [1, -1],
  ] as const)
    fillPolygon(ctx, at(dx, dy), ink);
  fillPolygon(ctx, at(0, 0), edge);
  fillPolygon(ctx, at(0, -1), fill);
};

// The tail turns up at its end into two rounded flukes with a notch between them, like a cartoon whale's.
const FLUKE: readonly Pt[] = [
  [0.15, -0.12],
  [0.05, -0.45],
  [0.18, -0.58],
  [0.42, -0.72],
  [0.62, -0.94],
  [0.38, -0.97],
  [0.14, -0.9],
  [-0.02, -0.8],
  [-0.16, -0.88],
  [-0.42, -1],
  [-0.68, -0.95],
  [-0.5, -0.76],
  [-0.3, -0.6],
  [-0.22, -0.4],
  [-0.12, -0.1],
  [0, 0.15],
];

const FLIPPER: readonly Pt[] = [
  [0.12, -0.1],
  [-0.1, -0.14],
  [-0.46, 0.3],
  [-0.66, 0.62],
  [-0.52, 0.62],
  [-0.2, 0.36],
  [0.14, 0.12],
];

const whale = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layOf(f);
  // The flukes stroke slowly up and down behind the body.
  fin(ctx, FLUKE, l.x0 + 3, l.cy - 1, l.th * 1.1, Math.sin(f.t * 0.9) * 0.22, c.whale, c.whaleLo, c.ink);
  ctx.drawImage(whaleLayer(l, c), l.x0, l.cy - l.th - 2);
  whaleEye(ctx, f, l, c);
  const fx = xAt(l, 0.53);
  fin(ctx, FLIPPER, fx, l.cy + Math.round(l.th * 0.45), l.th * 1.3, Math.sin(f.t * 0.8 + 1) * 0.14, c.whale, c.belly, c.ink);
};

// A small kind eye above the corner of the smile, with a blush below it; it blinks now and then.
const whaleEye = (ctx: Ctx, f: Frame, l: Lay, c: Colors<K>): void => {
  const ex = xAt(l, 0.7);
  const ey = l.cy + Math.round(mouthV(0.7) * l.th) - 8;
  fillDither(ctx, c.blush, 0.5, ex - 1, ey + 5, 6, 2);
  if (blinking(f.t, 41)) {
    fillRect(ctx, c.ink, ex, ey + 3, 4, 1);
    fillRect(ctx, c.ink, ex - 1, ey + 2, 1, 1);
    fillRect(ctx, c.ink, ex + 4, ey + 2, 1, 1);
    return;
  }
  fillRect(ctx, c.ink, ex + 1, ey, 2, 4);
  fillRect(ctx, c.ink, ex, ey + 1, 4, 2);
  fillRect(ctx, c.pale, ex + 1, ey + 1, 1, 1);
};

// ---- the fountain: on every bar a spout shoots up from the blowhole and bursts into sparkles that rain down ----

const blowhole = (l: Lay): readonly [number, number] => [xAt(l, 0.8), backY(l, 0.8)];

// One arc of spray curling out and down from the top of the jet, like a palm leaf; it breaks up as it falls.
const frond = (ctx: Ctx, c: Colors<K>, x: number, top: number, side: number, j: number, open: number, thin: number): void => {
  const reach = (5 + j * 7) * open;
  for (let k = 0; k <= 12; k++) {
    const s = k / 12;
    if (s > 0.6 && k % 2 === 1) continue;
    const px = Math.round(x + side * reach * s);
    const py = Math.round(top - (4 - j) * 2.6 * Math.sin(Math.PI * s * 0.75) * open + s * s * (3 + j * 4) * open);
    if (bayer(px, py) < thin) continue;
    const size = s < 0.5 ? 2 : 1;
    fillRect(ctx, c.whaleHi, px, py + 1, size, size);
    fillRect(ctx, c.pale, px, py, size, size);
  }
};

// The jet is a V-shaped blow: a bright core one pixel wide at the blowhole that widens as it climbs, inside a wider
// haze of dithered spray. As it falls away it breaks up into droplets instead of hanging in the air as a column.
const jet = (ctx: Ctx, c: Colors<K>, x: number, y: number, span: readonly [number, number], reach: number, thin: number): void => {
  const [top, bottom] = span;
  for (let py = top; py < bottom; py++) {
    const up = (y - py) / reach;
    const core = Math.round(up * 2.5);
    const haze = core + 1 + Math.round(up * 2.5);
    fillDither(ctx, c.pale, 0.5 * (1 - thin), x - haze, py, haze * 2 + 1, 1);
    fillDither(ctx, c.pale, 1 - thin * 0.8, x - core, py, core * 2 + 1, 1);
  }
};

// Droplets stream up beside the jet, drifting outward as they climb, so the rising spout reads as spray.
const droplets = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, y: number, span: readonly [number, number], reach: number): void => {
  for (let k = 0; k < 14; k++) {
    const py = Math.round(y - frac(f.t * 1.4 + k * 0.37) * reach);
    if (py < span[0] || py >= span[1]) continue;
    const up = (y - py) / reach;
    const side = k % 2 === 0 ? -1 : 1;
    const out = 2 + Math.round(up * 6) + (k % 3);
    const size = up > 0.6 && k % 3 === 0 ? 2 : 1;
    fillRect(ctx, c.pale, x + side * out, py, size, size);
  }
};

// The spout: a jet that shoots up, opens at the top into fronds of spray, then falls away from below and breaks up.
const spout = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, y: number, a: number): number => {
  const reach = Math.round(34 + 8 * f.energy);
  const top = Math.round(y - reach * smooth(0, 0.4, a));
  const bottom = Math.round(y - reach * smooth(0.6, 1.4, a));
  const thin = smooth(1.0, 1.8, a);
  if (bottom > top + 1 && thin < 1) {
    jet(ctx, c, x, y, [top, bottom], reach, thin);
    if (a < 1.2) droplets(ctx, f, c, x, y, [top, bottom], reach);
  }
  const open = smooth(0.08, 0.6, a);
  if (open > 0 && thin < 1) for (const side of [-1, 1]) for (let j = 1; j <= 2; j++) frond(ctx, c, x, top, side, j, open, thin);
  return y - reach;
};

// One sparkle of the burst: flung out from the crown, it arcs over and drifts down, twinkling, then winks out.
const sparkle = (ctx: Ctx, f: Frame, color: string, i: number, at: readonly [number, number], age: number, cycle: number): void => {
  const life = 2.6 + rand(i, cycle) * 0.9;
  if (age > life || (age > life - 0.8 && bayer(i, Math.floor(f.t * 12)) < 0.5)) return;
  const vx = (rand(i, cycle + 7) - 0.5) * 40;
  const vy = -6 - rand(i, cycle + 9) * 12;
  const px = Math.round(at[0] + vx * age * (1 - 0.12 * age));
  const py = Math.round(at[1] + vy * age + 6 * age * age);
  if (i % 3 === 0 && Math.sin(f.t * 10 + i) > -0.3) twinkle(ctx, px, py, color, 1 + (i % 2));
  else fillRect(ctx, color, px, py, age < 1 ? 2 : 1, age < 1 ? 2 : 1);
};

const sparkles = (ctx: Ctx, f: Frame, c: Colors<K>, at: readonly [number, number], a: number, cycle: number): void => {
  const colors = [c.sun, c.pale, c.spark];
  if (a < 0.35) return;
  for (let i = 0; i < 40; i++) sparkle(ctx, f, colors[i % 3] as string, i, at, a - 0.35, cycle);
};

const fountain = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const [x, y] = blowhole(layOf(f));
  const cycle = Math.floor(f.beat / 4);
  const a = f.beat - cycle * 4;
  // The last burst is still raining down while the next one rises.
  sparkles(ctx, f, c, [x, y - 30], a + 4, cycle - 1);
  const crown = spout(ctx, f, c, x, y, a);
  sparkles(ctx, f, c, [x, crown], a, cycle);
};

// ---- the girl, lying on her front with her chin on her folded sleeves ----

// o outline, h/H/d hair, s/S skin, b blush, m mouth.
const HEAD: Sprite = [
  '..........oooooooo..........',
  '.......oooHHHhhhhhooo.......',
  '.....oohHHHHhhhhhhhhhoo.....',
  '....ohHHhhhhhhHHHHhhhhdo....',
  '...ohhhhhhhhhhhhhhhhhhhdo...',
  '..ohhhhhhhhhhhhhhhhhhhhhdo..',
  '.ohhhhhhhhhhhhhhhhhhhhhhhdo.',
  '.ohhhhhhhdhhhhhhhhdhhhhhhdo.',
  'ohhhhhhhdShhhhhhhdSShhhhhddo',
  'ohhhhhhdSsdhhhhhdSssShhhhddo',
  'ohhhhhdSsssShhhdSsssssShhddo',
  'ohhhhSsssssssssssssssssShddo',
  '.ohhSssssssssssssssssssShdo.',
  '.ohhsssssssssssssssssssshdo.',
  '.ohhsssssssssssssssssssshdo.',
  '.ohdssbbbbssssssssbbbbsshdo.',
  'ohhdsssssssssmmssssssssshddo',
  'ohhhSssssssssmmsssssssShhddo',
  '.ohdoSSssssssssssssssSSohdo.',
  '..oo..ooSSssssssssSSoo..oo..',
  '........oooooooooooo........',
];

// v/V/u sweater, the sleeves folded into a pillow.
const ARMS: Sprite = [
  '..oooooooooooooooooooooooooo..',
  '.oVVVvvvvvvvvvoVVVvvvvvvvvvuo.',
  'oVvvvvvvvvvvvvovvvvvvvvvvvvvuo',
  'ovvvvvvvvvvvvvovvvvvvvvvvvvuuo',
  'ouvvvvvvvvvvvuouvvvvvvvvvvuuuo',
  '.ouuuuuuuuuuuooouuuuuuuuuuuuo.',
  '..oooooooooooo..oooooooooooo..',
];

// The body seen from the side: k/K sock, s/S leg, q/Q shorts, v/V/u the oversized sweater.
const BODY: Sprite = [
  '.................................................ooooooo',
  '..............................................ooooVVVVVV',
  '..........................oooooo..........oooooVVvvvvvvv',
  '........................oooVVVVooo.....ooooVVVvvvvvvvvvv',
  '......................oooVvvvvvvVoooooooVVvvvvvvvvvvvvvv',
  '..................ooooouvvvvvvvvvvVVVVVvvvvvvvvvvvvvvvvv',
  '............oooooooqqqovvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv',
  '....ooooooooosssssqqqqouvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv',
  'ooooosssssssssssssqqqqovvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv',
  'okkkosssssssssssssqqqqouuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu',
  'oKKKoSSSSSSSSSSSSSQQQQovuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu',
  'oooooooooooooooooooooooooooooooooooooooooooooooooooooooo',
];

const girlPalette = (c: Colors<K>): Palette => ({
  o: c.ink,
  h: c.hair,
  H: c.hairHi,
  d: c.hairLo,
  s: c.skin,
  S: c.skinLo,
  b: c.blush,
  m: mixColor(c.blush, c.ink, 0.4),
  v: c.sweater,
  V: mixColor(c.sweater, c.pale, 0.45),
  u: c.sweaterLo,
  q: c.belly,
  Q: mixColor(c.belly, c.sweaterLo, 0.35),
  k: c.pale,
  K: mixColor(c.pale, c.sweaterLo, 0.3),
});

type Girl = { readonly x: number; readonly y: number; readonly peek: boolean };

// She lies over the middle of the back, her head toward the whale's; every four bars, just after the spout, she
// lifts her head and peeks with one eye, then dozes off again.
const girlOf = (f: Frame): Girl => {
  const l = layOf(f);
  const p = f.beat - Math.floor(f.beat / 16) * 16;
  return { x: xAt(l, 0.37), y: backY(l, 0.55) + 2, peek: p > 0.6 && p < 2.4 };
};

const closedEye = (ctx: Ctx, x: number, y: number, out: 1 | -1, ink: string): void => {
  fillRect(ctx, ink, x, y, 1, 1);
  fillRect(ctx, ink, x + 3, y, 1, 1);
  fillRect(ctx, ink, x + 1, y + 1, 2, 1);
  fillRect(ctx, ink, out < 0 ? x - 1 : x + 4, y, 1, 1);
};

const peekEye = (ctx: Ctx, x: number, y: number, c: Colors<K>): void => {
  fillRect(ctx, c.ink, x, y, 4, 1);
  fillRect(ctx, c.ink, x + 4, y - 1, 1, 1);
  fillRect(ctx, c.iris, x, y + 1, 4, 2);
  fillRect(ctx, c.ink, x + 1, y + 1, 2, 1);
  fillRect(ctx, c.pale, x + 1, y + 1, 1, 1);
  fillRect(ctx, c.ink, x, y + 3, 4, 1);
};

// Her sock has slipped half off and dangles from her toes, swinging a little.
const sock = (ctx: Ctx, f: Frame, c: Colors<K>, g: Girl): void => {
  const swing = Math.round(Math.sin(f.t * 1.8) * 1.2);
  fillRect(ctx, c.ink, g.x - 3, g.y - 3 + swing, 4, 4);
  fillRect(ctx, c.pale, g.x - 2, g.y - 2 + swing, 3, 2);
};

// How far below the shoulders the back line sits at each column of BODY (the sweater dips at the waist).
const BACK_DIP: readonly number[] = BODY[0] ? [...BODY[0]].map((_, x) => BODY.findIndex((row) => row[x] === 'o')) : [];

// One column of her long hair, `q` of the way from the back of her head (0) to the tips (1): it settles onto her
// back, thins out, splits into two locks and lifts in the wind toward the ends.
const hairColumn = (ctx: Ctx, f: Frame, c: Colors<K>, g: Girl, x: number, q: number): void => {
  const back = g.y - 12 + (BACK_DIP[x - g.x] ?? 0);
  const lift = q * q * (Math.sin(f.t * 2.6 - q * 5) * 2 - 3);
  const yc = g.y - 15 + (back - g.y + 15) * smooth(0, 0.4, q) + lift + Math.sin(x * 0.55) * 0.6;
  const ht = 1.5 + 5.5 * (1 - q) ** 0.8;
  const top = Math.round(yc - ht);
  const bottom = Math.round(yc + ht + Math.sin(x * 0.5 + 1) * 0.8);
  fillRect(ctx, c.ink, x, top - 1, 1, bottom - top + 3);
  fillRect(ctx, c.hair, x, top, 1, bottom - top + 1);
  fillRect(ctx, c.hairLo, x, bottom, 1, 1);
  if (Math.sin(x * 0.5) > -0.3) fillRect(ctx, c.hairHi, x, top + 1, 1, 1);
  if (x % 7 !== 0) fillRect(ctx, c.hairLo, x, top + Math.round((bottom - top) * 0.62), 1, 1);
  if (q > 0.72) fillRect(ctx, c.ink, x, Math.round(yc), 1, 1);
};

const hairMass = (ctx: Ctx, f: Frame, c: Colors<K>, g: Girl): void => {
  const root = g.x + 50;
  const tip = g.x + 15;
  for (let x = tip; x <= root; x++) hairColumn(ctx, f, c, g, x, (root - x) / (root - tip));
};

const AHOGE: readonly Sprite[] = [
  ['...oo', '..oho', '.oho.', 'oho..'],
  ['.oo..', 'oho..', 'oho..', '.oho.', '..oho', '..oho'],
];

// When she stirs, one arm leaves the pillow and she rubs her eye with the end of her sleeve.
const ARM_R: Sprite = ARMS.map((row) => row.slice(14));
const PAW: Sprite = ['.ooo.', 'oVVvo', 'ovvvo', 'ouvuo', '.ooo.'];

const rub = (ctx: Ctx, f: Frame, c: Colors<K>, palette: Palette, hx: number, hy: number, base: number): void => {
  const px = hx + 9 + (Math.floor(f.beat * 4) % 2);
  const py = hy + 14;
  limb(ctx, hx + 2, base - 3, px, py + 2, 4, c.sweater, c.ink);
  drawSprite(ctx, PAW, palette, px - 2, py - 2);
};

const face = (ctx: Ctx, c: Colors<K>, hx: number, hy: number, peek: boolean): void => {
  closedEye(ctx, hx + 7, hy + 13, -1, c.ink);
  if (peek) peekEye(ctx, hx + 17, hy + 12, c);
  else closedEye(ctx, hx + 17, hy + 13, 1, c.ink);
};

const girl = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const g = girlOf(f);
  const palette = paletteOf(c, girlPalette);
  sock(ctx, f, c, g);
  drawSprite(ctx, BODY, palette, g.x, g.y - BODY.length + 1);
  hairMass(ctx, f, c, g);
  const hx = g.x + 44;
  // She breathes slowly in her sleep, her head rising a pixel on each breath in; when she stirs she lifts it.
  const hy = g.y - 25 - (g.peek ? 2 : Math.floor(frac(f.beat / 8) * 2));
  const tuft = AHOGE[g.peek ? 1 : 0] as Sprite;
  drawSprite(ctx, tuft, palette, hx + 13, hy - tuft.length + 1);
  drawSprite(ctx, HEAD, palette, hx, hy);
  face(ctx, c, hx, hy, g.peek);
  if (!g.peek) {
    drawSprite(ctx, ARMS, palette, hx - 1, g.y - 6);
    return;
  }
  drawSprite(ctx, ARM_R, palette, hx + 13, g.y - 6);
  rub(ctx, f, c, palette, hx, hy, g.y);
};

// "z"s float up from her while she sleeps, one every two beats, swaying and fading.
const Z_SMALL: Sprite = ['zzzz', '..z.', '.z..', 'zzzz'];
const Z_BIG: Sprite = ['zzzzz', '...z.', '..z..', '.z...', 'zzzzz'];

const snores = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const g = girlOf(f);
  const shadow = { z: c.sweaterLo };
  const palette = { z: c.pale };
  const now = Math.floor(f.beat / 2);
  for (let k = 0; k < 3; k++) {
    const age = (f.beat - (now - k) * 2) / 6;
    const x = g.x + 52 + Math.round(age * 14 + Math.sin(age * 6 + now - k) * 2);
    const y = g.y - 34 - Math.round(age * 22);
    if (g.peek || age > 0.9 || (age > 0.7 && bayer(x, y) < 0.5)) continue;
    const z = age < 0.3 ? Z_SMALL : Z_BIG;
    drawSprite(ctx, z, shadow, x + 1, y + 1);
    drawSprite(ctx, z, palette, x, y);
  }
};

// ---- birds resting on the back; one takes off every eight bars, flutters around and comes back ----

// o outline, w feathers, b breast, k beak.
const BIRD_SIT: Sprite = ['...ooo..', 'o.owwwo.', 'oowwwowk', '.owwbbo.', '..o..o..'];
const BIRD_FLY: readonly Sprite[] = [
  ['.oo.....', '.owo....', '..owoo..', '.oowwwok', '..owbo..', '...oo...'],
  ['........', '...ooo..', '.oowwwok', 'owwwbbo.', 'oooooo..', '........'],
];

const birdPalette = (c: Colors<K>): Palette => ({ o: c.ink, w: c.pale, b: c.blush, k: c.sun });

const BIRD_SIT_BACK = flipped(BIRD_SIT);
const BIRD_FLY_BACK = BIRD_FLY.map(flipped);

const restingBirds = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layOf(f);
  const palette = paletteOf(c, birdPalette);
  drawSprite(ctx, BIRD_SIT, palette, xAt(l, 0.17) - 4, backY(l, 0.17) - 4);
  const turned = Math.floor(f.beat / 4) % 2 === 0;
  drawSprite(ctx, turned ? BIRD_SIT_BACK : BIRD_SIT, palette, xAt(l, 0.23) - 4, backY(l, 0.23) - 4);
};

// One bird has perched on her back and hops on the beat.
const perchedBird = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const g = girlOf(f);
  const hop = frac(f.beat) < 0.2 ? 2 : 0;
  const facing = Math.floor(f.beat / 8) % 2 === 0 ? BIRD_SIT : BIRD_SIT_BACK;
  drawSprite(ctx, facing, paletteOf(c, birdPalette), g.x + 24, g.y - 21 - hop);
};

const flyingBird = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layOf(f);
  const palette = paletteOf(c, birdPalette);
  const home: readonly [number, number] = [xAt(l, 0.29) - 4, backY(l, 0.29) - 4];
  const p = frac(f.beat / 32);
  if (p < 0.3) {
    drawSprite(ctx, BIRD_SIT, palette, home[0], home[1]);
    return;
  }
  const q = (p - 0.3) / 0.7;
  const x = home[0] + Math.round(Math.sin(q * Math.PI * 2) * l.len * 0.35);
  const y = home[1] - Math.round(Math.sin(q * Math.PI) * l.th * 2.4);
  const frame = Math.floor(f.beat * 2) % 2;
  const sprite = BIRD_FLY[frame] as Sprite;
  drawSprite(ctx, Math.cos(q * Math.PI * 2) >= 0 ? sprite : (BIRD_FLY_BACK[frame] as Sprite), palette, x, y);
};

export const skyWhale = defineScene<K>({
  id: 'sky-whale',
  title: 'Whale Nap',
  mood: { valence: 0.6, energy: -0.7 },
  styles: ['starlit-dream', 'lofi-loop', 'cozy-village', 'grand-field', 'island-breeze', 'celtic-isle'],
  variants: [
    {
      mood: { valence: 0.6, energy: -0.7 },
      colors: {
        sky0: '#8fb4ea',
        sky1: '#c4d6f6',
        sky2: '#f8d2e2',
        sun: '#fff8e0',
        glow: '#ffe4ee',
        cloud: '#ffffff',
        cloudLo: '#dccdee',
        cloudFar: '#efe2f4',
        whale: '#8ea4d8',
        whaleHi: '#b9cbf0',
        whaleLo: '#687cb8',
        belly: '#f6eef2',
        ink: '#3a3868',
        skin: '#ffe6d8',
        skinLo: '#f2baa8',
        blush: '#ff92ac',
        hair: '#ffd25c',
        hairHi: '#fff3a8',
        hairLo: '#e29a3a',
        sweater: '#c8b0ee',
        sweaterLo: '#9a82d0',
        pale: '#ffffff',
        iris: '#38b2ae',
        spark: '#ffc8ec',
      },
    },
    {
      mood: { valence: 0.3, energy: -0.5 },
      colors: {
        sky0: '#6c74c4',
        sky1: '#ee9eaa',
        sky2: '#ffd598',
        sun: '#fff2c4',
        glow: '#ffc890',
        cloud: '#ffe8d4',
        cloudLo: '#e098b0',
        cloudFar: '#f6bcb4',
        whale: '#8a8ec8',
        whaleHi: '#b8b2e2',
        whaleLo: '#5c5c9c',
        belly: '#ffe6d8',
        ink: '#38284e',
        skin: '#ffe0cc',
        skinLo: '#efaa92',
        blush: '#ff8898',
        hair: '#ffc64e',
        hairHi: '#fff0a0',
        hairLo: '#d6862e',
        sweater: '#c4a6e8',
        sweaterLo: '#9274c6',
        pale: '#fff8f0',
        iris: '#34a6a6',
        spark: '#ffe488',
      },
    },
    {
      mood: { valence: 0.1, energy: -0.7 },
      colors: {
        sky0: '#1a1e4e',
        sky1: '#3a3c84',
        sky2: '#7a68a8',
        sun: '#fff6d6',
        glow: '#5c60aa',
        cloud: '#b6b6e4',
        cloudLo: '#6868a6',
        cloudFar: '#8884be',
        whale: '#6676b0',
        whaleHi: '#92a2d8',
        whaleLo: '#445086',
        belly: '#d6daf2',
        ink: '#141434',
        skin: '#f6dcd6',
        skinLo: '#d0a4ac',
        blush: '#f0829c',
        hair: '#f0ca64',
        hairHi: '#fff0b0',
        hairLo: '#be883a',
        sweater: '#b29ce0',
        sweaterLo: '#7c6ab2',
        pale: '#f4f4ff',
        iris: '#44beba',
        spark: '#ffe89e',
      },
    },
  ],
  layers: [sky, rainbow, skyClouds, calf, seaBack, whale, restingBirds, girl, perchedBird, snores, fountain, flyingBird, seaFront],
});
