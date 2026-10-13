// A girl in a glass helmet sits at a kotatsu floating in orbit, peeling a mandarin while the peel drifts off in zero-g;
// her cat wears a helmet too, the unplugged cord waves behind them, and the Earth turns slowly far below.
import { type Ctx, drawSprite, fillRect, mixColor, type Palette, type Point, type Sprite } from 'mojipx';
import { bayer, cached, ditherGradient, frac, hexToRgb, memoCanvas, noise1, rand, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { clamp01, drawGlow, fillDither, setPixel } from './batch-1-helpers.ts';
import { moon, paletteOf, wrap } from './batch-2-helpers.ts';
import { catTail, drawGirl, type Girl, limb, onBeat, wide } from './batch-7-helpers.ts';
import { CAT_HEAD, catPalette, drawCatHead } from './batch-11-helpers.ts';

type K =
  | 'space0'
  | 'space1'
  | 'ocean'
  | 'oceanLo'
  | 'land'
  | 'landLo'
  | 'cloud'
  | 'atmo'
  | 'aurora'
  | 'ink'
  | 'glass'
  | 'suit'
  | 'suitLo'
  | 'orange'
  | 'orangeLo'
  | 'gold'
  | 'skin'
  | 'skinLo'
  | 'blush'
  | 'hair'
  | 'hairHi'
  | 'hairLo'
  | 'wood'
  | 'woodHi'
  | 'quilt'
  | 'quiltLo';

const TAU = Math.PI * 2;

type Rgb = readonly [number, number, number];

// ---- the girl: o outline, h/H/d hair, s/S skin, b blush, e/E/c eyes, w glint, m mouth,
// r/R/c collar ring, u/U suit, p/g/c the lights on her chest panel ----

const side = (mid: string, left = 'hhhd', right = 'dhhh'): string => `.o${left}${mid}${right}o.`;
const eyes = (row: string): string => side(`ss${row}ssssss${row}ss`);

const HEAD: Sprite = [
  '...........oooooooo...........',
  '........ooohhhhhhhhooo........',
  '......oohhhhhhhhhhhhhhoo......',
  '....oohhhhhhhhhhhhhhhhhhoo....',
  '...ohhhhhhhhhhhhhhhhhhhhhho...',
  '..ohhhhhHHHHHHHHHHHHHHhhhho...',
  '.ohhHHHHhhhhhhhhhhhhhhHHHHhho.',
  side('hhhhhhhhhhhhhhhhhh', 'hhhh', 'hhhh'),
  side('hhhhhhhhhhhhhhhhhh'),
  side('hhhhhhhhhhhhhhhhhh'),
  side('hhhhdhhhhhhhhdhhhh'),
  side('dhhhdhhhddhhhdhhhd'),
  side('shhhshhhsshhhshhhs'),
  side('sooooossssssooooos'),
  eyes('weee'),
  eyes('wEEe'),
  eyes('eEEe'),
  eyes('EccE'),
  side('sbbbssssssssssbbbs'),
  side('ssssssssmmssssssss'),
  side('SssssssssssssssssS'),
  side('oSssssssssssssssSo'),
  side('.ooSssssssssssSoo.'),
  side('....oooooooooo....'),
  side('..................', 'dhhd', 'dhhd'),
  '..oooo..................oooo..',
];

// The suit from the collar ring down to the table: puffy sleeves hang at the sides, ending at the elbows.
const BODY: Sprite = [
  '........oooooooooooooo........',
  '.......orrrrrcrrrrrrrro.......',
  '.....ooRRRRRRRRRRRRRRRRoo.....',
  '...oouuuuuuuuuuuuuuuuuuuuoo...',
  '..ouuuuuuuuuuuuuuuuuuuuuuuuo..',
  '.orrrruuuuuuuuuuuuuuuuuurrrro.',
  'orrrrrouuuuuuuuuuuuuuuuorrrrro',
  'oRrrrRouuuoooooooooouuuoRrrrRo',
  'ouRRRuouuuoUUUUUUUUouuuouRRRuo',
  'ouuuuuouuuoUcUpUgUUouuuouuuuuo',
  'ouuuuuouuuoUUUUUUUUouuuouuuuuo',
  'ouuuuuouuuoooooooooouuuouuuuuo',
  'ouuuuuouuuuuuuuuuuuuuuuouuuuuo',
  'oUuuuuouuuuuuuuuuuuuuuuouuuuUo',
  'oUuuuuoUuuuuuuuuuuuuuuUouuuuUo',
  'oUUuuuoUuuuuuuuuuuuuuuUouuuUUo',
  '.oUUuuoUuuuuuuuuuuuuuuUouuUUo.',
  '..oooooUuuuuuuuuuuuuuuUooooo..',
  '......oUuuuuuuuuuuuuuuUo......',
  '......oUUuuuuuuuuuuuuUUo......',
  '......oUUUuuuuuuuuuuUUUo......',
  '......oUUUUUUUUUUUUUUUUo......',
];

const GIRL_SPRITE: Sprite = [...HEAD, ...BODY];
const GIRL_W = 30;
const NECK = HEAD.length; // the row of the collar ring, where the helmet seals
const ELBOW = NECK + 16;
const GIRL: Girl = {
  eyes: [
    { x: 8, y: 13, out: -1, w: 4, h: 5 },
    { x: 18, y: 13, out: 1, w: 4, h: 5 },
  ],
  seed: 113,
};

const MITTEN: Sprite = ['.oooo.', 'ouuuuo', 'ouuuuo', 'oUuuUo', 'orrrro', '.oooo.'];

// r/R/g mandarin rind, l leaf.
const MANDARIN: Sprite = ['...oll..', '.oooloo.', 'ogrrrrro', 'orrrrrRo', 'orrrrRRo', 'oRrrRRRo', '.oooooo.'];

// A strip of peel, rind on one side and pale pith on the other, in four turns as it tumbles.
const PEEL: readonly Sprite[] = [
  ['....oo.', '...orRo', '..orruo', '.orruo.', 'oruuo..', '.oo....'],
  ['.ooooo.', 'orrrrRo', 'ouuuuuo', '.ooooo.'],
  ['.oo....', 'ouro...', '.ouro..', '..ouro.', '...ouRo', '....oo.'],
  ['.oo.', 'oRuo', 'oruo', 'oruo', 'oruo', '.oo.'],
];
// A segment the cat plays with, in three turns.
const SEGMENT: readonly Sprite[] = [
  ['.ooo.', 'occco', 'ocgco', '.ouo.'],
  ['.oo..', 'occo.', 'occuo', '.ooo.'],
  ['.ouo.', 'ocgco', 'occco', '.ooo.'],
];

// A woven bowl for the mandarins heaped in it: o outline, w/W wood.
const BOWL: Sprite = [
  'oWWWWWWWWWWWWWWWWWWWWo',
  'owWwWwWwWwWwWwWwWwWwwo',
  'oWwWwWwWwWwWwWwWwWwWwo',
  '.owwwwwwwwwwwwwwwwwwo.',
  '..oooooooooooooooooo..',
];
const HEAP = [
  [1, -5],
  [13, -5],
  [7, -6],
  [4, -10],
  [10, -11],
] as const;

// A sitting cat's body below its head: o outline, f fur, l light fur, r the collar where its helmet seals.
const CAT_BODY: Sprite = [
  '..orrrrrro..',
  '.offllllffo.',
  '.ofllllllfo.',
  'offllllllffo',
  'offllllllffo',
  'offllllllffo',
  'ofllollollfo',
  '.oooooooooo.',
];
const PAW: Sprite = ['.oo.', 'ollo', 'ollo', 'offo'];

const PLUG: Sprite = ['oooo..', 'oUUUgg', 'ouuUo.', 'oUUUgg', 'oooo..'];

// A little satellite: p/P panels, g foil, o frame.
const SATELLITE: Sprite = ['.....o.....', 'ppp.ogo.ppp', 'PPPoogooPPP', 'ppp.ogo.ppp', '.....o.....'];

const girlPalette = (c: Colors<K>): Palette => ({
  o: c.ink,
  h: c.hair,
  H: c.hairHi,
  d: c.hairLo,
  s: c.skin,
  S: c.skinLo,
  b: c.blush,
  e: c.ink,
  E: c.orangeLo,
  c: c.gold,
  w: c.glass,
  m: c.blush,
  r: c.orange,
  R: c.orangeLo,
  u: c.suit,
  U: c.suitLo,
  p: c.blush,
  g: c.atmo,
});
const fruitPalette = (c: Colors<K>): Palette => ({
  o: c.ink,
  r: c.orange,
  R: c.orangeLo,
  g: c.gold,
  c: c.gold,
  u: c.suit,
  U: c.suitLo,
  l: c.hairLo,
  w: c.wood,
  W: c.woodHi,
});
const catColors = (c: Colors<K>): Palette => ({
  ...catPalette({ ink: c.ink, fur: c.suitLo, light: c.suit, pink: c.blush, eye: c.ink, glint: c.glass }),
  r: c.orange,
});
const gearPalette = (c: Colors<K>): Palette => ({ o: c.ink, u: c.suit, U: c.suitLo, g: c.gold, p: c.oceanLo, P: c.ocean });

// ---- layout ----

/** The kotatsu's anchor: the middle of the front edge of its top board. */
type Spot = Point;

const spotOf = (f: Frame): Spot => {
  const bobX = Math.round(Math.sin(f.t * 0.29 + 1) * 2);
  const bobY = Math.round(Math.sin(f.t * 0.7) * 2.4);
  if (wide(f)) return { x: Math.round(f.w * 0.44) + bobX, y: Math.round(f.h * 0.53) + bobY };
  return { x: Math.round(f.w * 0.52) + bobX, y: Math.round(f.h * 0.48) + bobY };
};

type Globe = { readonly cx: number; readonly cy: number; readonly r: number; readonly sun: readonly [number, number, number] };

// The sun lights the Earth from the left, a little in front: night falls toward the right, where the cities shine.
const globeOf = (f: Frame): Globe => {
  if (wide(f)) {
    const r = Math.round(f.w * 0.82);
    return { cx: Math.round(f.w * 0.5), cy: Math.round(f.h * 0.76) + r, r, sun: [-0.84, -0.12, 0.53] };
  }
  const r = Math.round(f.w * 0.95);
  return { cx: Math.round(f.w * 0.5), cy: Math.round(f.h * 0.69) + r, r, sun: [-0.9, -0.1, 0.42] };
};

// ---- space ----

// The Milky Way: a faint band of dust slanting across the sky, a shade lighter than space, crowded with small stars.
const milkyWay = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  memoCanvas(`ko-milky:${f.w}x${f.h}:${c.space0}:${c.suitLo}:${c.glass}`, f.w, f.h, (img) => {
    const [r0, g0, b0] = hexToRgb(c.space0);
    const [r1, g1, b1] = hexToRgb(c.suitLo);
    const dust = (k: number): Rgb => [r0 + (r1 - r0) * k, g0 + (g1 - g0) * k, b0 + (b1 - b0) * k];
    const [faint, core, star] = [dust(0.1), dust(0.2), hexToRgb(c.glass)];
    const slope = wide(f) ? 0.32 : 1.2;
    const width = Math.min(f.w, f.h) * 0.15;
    for (let y = 0; y < f.h; y++) {
      for (let x = 0; x < f.w; x++) {
        const off = (y - f.h * 0.42 - (x - f.w * 0.5) * slope) / Math.hypot(1, slope);
        const band = Math.max(0, 1 - Math.abs(off + (noise1(x * 0.04 + y * 0.03, 4) - 0.5) * width * 0.7) / width);
        if (rand(x * 7, y * 3) < band * 0.03) setPixel(img, x, y, star);
        else if (band * 1.5 - 0.7 > bayer(x, y)) setPixel(img, x, y, core);
        else if (band * 1.2 - 0.1 > bayer(x, y)) setPixel(img, x, y, faint);
      }
    }
  });

const space = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(ditherGradient(f.w, f.h, [c.space0, c.space0, c.space0, c.space0, c.space1]), 0, 0);
  ctx.drawImage(milkyWay(f, c), 0, 0);
  stars(ctx, f.w, f.h, f.t, [c.glass, c.cloud, c.suitLo], Math.round((f.w * f.h) / 420), 113, 0.85);
  const r = wide(f) ? 9 : 10;
  const mx = Math.round(f.w * (wide(f) ? 0.86 : 0.8));
  const my = Math.round(f.h * (wide(f) ? 0.17 : 0.09));
  drawGlow(ctx, c.cloud, mx, my, r * 2, r * 2, 0.35);
  moon(ctx, mx, my, r, c.glass, c.suitLo);
};

// A satellite crosses the sky now and then, its light blinking on the beat.
const satellite = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const x = Math.round(wrap(f.t * 5 + 40, f.w + 260) - 20);
  if (x > f.w + 5) return;
  const y = Math.round(f.h * (wide(f) ? 0.1 : 0.2) + x * 0.06);
  drawSprite(ctx, SATELLITE, paletteOf(c, 'ko-gear', gearPalette), x, y);
  if (onBeat(f.beat, 0.2)) fillRect(ctx, c.blush, x + 5, y - 1, 1, 1);
};

// ---- the Earth ----

/** Value noise on a lattice wrapped around the globe: `cols` cells round the equator, `rows` from pole to pole. */
type Lattice = { readonly cols: number; readonly rows: number; readonly v: Float32Array };

const lattice = (cols: number, rows: number, seed: number): Lattice => ({
  cols,
  rows,
  v: Float32Array.from({ length: cols * rows }, (_, i) => rand(i, seed)),
});

const ease = (k: number): number => k * k * (3 - 2 * k);

/** The noise at u turns round the globe and v from the south pole (0) to the north (1). */
const sample = (l: Lattice, u: number, v: number): number => {
  const x = u * l.cols;
  const y = Math.min(l.rows - 1.001, Math.max(0, v * (l.rows - 1)));
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const sx = ease(x - ix);
  const sy = ease(y - iy);
  const i0 = ((ix % l.cols) + l.cols) % l.cols;
  const i1 = (i0 + 1) % l.cols;
  const at = (i: number, j: number): number => l.v[j * l.cols + i] ?? 0;
  const top = at(i0, iy) * (1 - sx) + at(i1, iy) * sx;
  const bottom = at(i0, iy + 1) * (1 - sx) + at(i1, iy + 1) * sx;
  return top * (1 - sy) + bottom * sy;
};

const LAND = [lattice(9, 6, 11), lattice(22, 12, 12), lattice(60, 32, 13), lattice(150, 76, 14)] as const;
const CLOUDS = [lattice(30, 30, 21), lattice(80, 76, 22)] as const;

const landAt = (u: number, v: number): number =>
  sample(LAND[0], u, v) * 0.5 + sample(LAND[1], u, v) * 0.28 + sample(LAND[2], u, v) * 0.14 + sample(LAND[3], u, v) * 0.08;
const cloudAt = (u: number, v: number): number => sample(CLOUDS[0], u, v) * 0.65 + sample(CLOUDS[1], u, v) * 0.35;

const SHORE = 0.53;

/** Each pixel of the disc on screen: where it is, its longitude and latitude before the spin, and how lit it is. */
type Geo = {
  readonly top: number;
  readonly rows: number;
  readonly at: Int32Array;
  readonly lon: Float32Array;
  readonly lat: Float32Array;
  readonly lit: Float32Array;
};

// The globe leans toward us so the horizon is at mid-northern latitudes and the near side near the equator.
const TILT_COS = Math.cos(-1.05);
const TILT_SIN = Math.sin(-1.05);

type Pixel = { readonly lon: number; readonly lat: number; readonly lit: number };

const pixelOf = (g: Globe, x: number, y: number): Pixel | null => {
  const nx = (x + 0.5 - g.cx) / g.r;
  const ny = (y + 0.5 - g.cy) / g.r;
  const d2 = nx * nx + ny * ny;
  if (d2 >= 1) return null;
  const nz = Math.sqrt(1 - d2);
  const ty = ny * TILT_COS - nz * TILT_SIN;
  const tz = ny * TILT_SIN + nz * TILT_COS;
  const lit = nx * g.sun[0] + ny * g.sun[1] + nz * g.sun[2];
  return { lon: Math.atan2(nx, tz), lat: Math.asin(Math.max(-1, Math.min(1, -ty))), lit };
};

const geos = new Map<string, Geo>();

const geoOf = (f: Frame, g: Globe): Geo =>
  cached(geos, 4, `${f.w}x${f.h}`, () => {
    const top = Math.max(0, g.cy - g.r);
    const pixels: (Pixel & { readonly at: number })[] = [];
    for (let y = top; y < f.h; y++) {
      for (let x = 0; x < f.w; x++) {
        const p = pixelOf(g, x, y);
        if (p) pixels.push({ ...p, at: (y - top) * f.w + x });
      }
    }
    return {
      top,
      rows: f.h - top,
      at: Int32Array.from(pixels, (p) => p.at),
      lon: Float32Array.from(pixels, (p) => p.lon),
      lat: Float32Array.from(pixels, (p) => p.lat),
      lit: Float32Array.from(pixels, (p) => p.lit),
    };
  });

// Tones of the surface, in the order of `toneColors`.
const OCEAN = 0;
const OCEAN_NIGHT = 1;
const LANDS = 2;
const LAND_NIGHT = 3;
const CLOUD = 4;
const CITY = 5;

const toneColors = (c: Colors<K>): readonly (readonly [number, number, number])[] =>
  [c.ocean, c.oceanLo, c.land, c.landLo, c.cloud, c.gold].map(hexToRgb);

// The night side shows the cities' lights, strung along the coasts and gathered in clusters inland.
const nightTone = (land: number, u: number, v: number, deep: boolean): number => {
  if (land < SHORE) return OCEAN_NIGHT;
  if (!deep) return LAND_NIGHT;
  const town = sample(LAND[3], u + 0.5, v) > 0.62 ? 0.3 : 0.02;
  const odds = land < SHORE + 0.03 ? 0.45 : town;
  return rand(Math.floor(u * 1100), Math.floor(v * 520)) < odds ? CITY : LAND_NIGHT;
};

const dayTone = (land: number, lat: number): number => {
  if (Math.abs(lat) > 1.1 + (land - 0.5) * 0.4) return CLOUD;
  return land < SHORE ? OCEAN : LANDS;
};

// The sunlit side shades off into night through a narrow dithered dusk; clouds only show where the sun is on them.
const toneAt = (geo: Geo, i: number, spin: number, x: number, y: number): number => {
  const u = ((geo.lon[i] ?? 0) + spin) / TAU;
  const lat = geo.lat[i] ?? 0;
  const lit = geo.lit[i] ?? 0;
  const v = lat / Math.PI + 0.5;
  const land = landAt(u, v);
  if (clamp01(lit / 0.16 + 0.15) <= bayer(x, y)) return nightTone(land, u, v, lit < -0.06);
  const cloud = cloudAt(u + spin * 0.03, v);
  if (cloud > 0.7 || (cloud > 0.665 && bayer(x, y) < 0.5)) return CLOUD;
  return dayTone(land, lat);
};

const earths = new Map<string, HTMLCanvasElement>();

// The surface turns about a pixel at a time, so it is repainted only when it has moved.
const earthCanvas = (f: Frame, g: Globe, c: Colors<K>, step: number): HTMLCanvasElement =>
  cached(earths, 3, `${f.w}x${f.h}:${step}:${c.ocean}${c.oceanLo}${c.land}${c.landLo}${c.cloud}${c.gold}`, () => {
    const geo = geoOf(f, g);
    const canvas = document.createElement('canvas');
    canvas.width = f.w;
    canvas.height = Math.max(1, geo.rows);
    const g2 = canvas.getContext('2d');
    if (!g2) return canvas;
    const img = g2.createImageData(canvas.width, canvas.height);
    const tones = toneColors(c);
    const spin = step / g.r;
    for (let i = 0; i < geo.at.length; i++) {
      const at = geo.at[i] ?? 0;
      const x = at % f.w;
      const y = Math.floor(at / f.w);
      setPixel(img, x, y, tones[toneAt(geo, i, spin, x, y + geo.top)] ?? [0, 0, 0]);
    }
    g2.putImageData(img, 0, 0);
    return canvas;
  });

// The thin air on the limb: a glow outside the rim and a haze just inside it, brighter on the sunlit side.
const atmoPixel = (g: Globe, x: number, y: number): 'rim' | number => {
  const nx = (x + 0.5 - g.cx) / g.r;
  const ny = (y + 0.5 - g.cy) / g.r;
  const e = (Math.hypot(nx, ny) - 1) * g.r;
  const sunny = clamp01((nx * g.sun[0] + ny * g.sun[1]) * 1.4 + 0.55);
  if (e > -1.2 && e <= 0 && sunny > 0.5) return 'rim';
  if (e > 0) return e < 12 ? (1 - e / 12) ** 1.7 * 0.9 * (0.35 + 0.65 * sunny) : 0;
  return e > -10 ? (1 + e / 10) ** 1.6 * 0.6 * (0.25 + 0.75 * sunny) : 0;
};

const atmosphereLayer = (f: Frame, g: Globe, c: Colors<K>): HTMLCanvasElement => {
  const top = Math.max(0, g.cy - g.r - 14);
  return memoCanvas(`ko-atmo:${f.w}x${f.h}:${c.atmo}:${c.glass}`, f.w, f.h - top, (img) => {
    const atmo = hexToRgb(c.atmo);
    const rim = hexToRgb(c.glass);
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        const a = atmoPixel(g, x, y + top);
        if (a === 'rim') setPixel(img, x, y, rim);
        else if (a > bayer(x, y + top)) setPixel(img, x, y, atmo);
      }
    }
  });
};

const auroraPalette = (c: Colors<K>): Palette => ({
  a: c.aurora,
  m: mixColor(c.aurora, c.space0, 0.45),
  d: mixColor(c.aurora, c.space0, 0.75),
});

// By night a ribbon of aurora waves along above the horizon in drifting patches, glowing upward and shot with
// faint rays. A variant whose aurora is the color of space has none.
const aurora = (ctx: Ctx, f: Frame, g: Globe, c: Colors<K>): void => {
  if (c.aurora === c.space0) return;
  const tones = paletteOf(c, 'ko-aurora', auroraPalette);
  for (let x = 0; x < f.w; x++) {
    const dx = x - g.cx;
    const n = noise1(x * 0.02 + f.t * 0.05, 7);
    if (Math.abs(dx) >= g.r || n < 0.4) continue;
    const k = Math.min(1, (n - 0.4) / 0.3);
    const hem = Math.round(g.cy - Math.sqrt(g.r * g.r - dx * dx) - 4 - 6 * noise1(x * 0.06 + f.t * 0.2, 3));
    fillRect(ctx, k > 0.5 ? (tones.a as string) : (tones.m as string), x, hem, 1, 1);
    fillRect(ctx, tones.m as string, x, hem - 2, 1, 2);
    fillDither(ctx, c.aurora, 0.4 * k, x, hem - 6, 1, 4);
    const ray = noise1(x * 0.5 - f.t * 0.4, 9);
    if (ray > 0.66) fillDither(ctx, c.aurora, (ray - 0.5) * k, x, hem - 6 - Math.round(ray * 14), 1, Math.round(ray * 14));
  }
};

const earth = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const g = globeOf(f);
  aurora(ctx, f, g, c);
  ctx.drawImage(earthCanvas(f, g, c, Math.floor(f.t * 2.2)), 0, Math.max(0, g.cy - g.r));
  ctx.drawImage(atmosphereLayer(f, g, c), 0, Math.max(0, g.cy - g.r - 14));
};

// ---- the kotatsu ----

const BOARD_HALF = 40;
const QUILT_HALF = 45;
const QUILT_DROP = 22;

type QuiltInks = { readonly base: Rgb; readonly lo: Rgb; readonly gold: Rgb; readonly petal: Rgb; readonly ink: Rgb };

// A gingham check with a little flower in every plain square; folds fall from under the board.
const quiltRgb = (x: number, y: number, dx: number, half: number, q: QuiltInks): Rgb => {
  const fx = wrap(x - QUILT_HALF + 5, 12) - 5;
  const fy = wrap(y + 1, 10) - 5;
  if (fx === 0 && fy === 0) return q.gold;
  if (Math.abs(fx) + Math.abs(fy) === 1) return q.petal;
  const vertical = wrap(x - QUILT_HALF, 12) < 3;
  const across = wrap(y - 4, 10) < 3;
  const fold = Math.abs(Math.abs(dx) - half * 0.55) < 0.8 && y > 2;
  if ((vertical && across) || fold || y < 2) return q.lo;
  if ((vertical || across) && bayer(x, y) < 0.5) return q.lo;
  return y > QUILT_DROP - 2 && bayer(x, y) < 0.5 ? q.lo : q.base;
};

const quiltBody = (c: Colors<K>): HTMLCanvasElement =>
  memoCanvas(`ko-quilt:${c.quilt}:${c.quiltLo}:${c.gold}:${c.orange}:${c.ink}`, QUILT_HALF * 2 + 1, QUILT_DROP + 2, (img) => {
    const q: QuiltInks = {
      base: hexToRgb(c.quilt),
      lo: hexToRgb(c.quiltLo),
      gold: hexToRgb(c.gold),
      petal: hexToRgb(c.orange),
      ink: hexToRgb(c.ink),
    };
    for (let y = 0; y < img.height; y++) {
      const half = BOARD_HALF + 1 + (QUILT_HALF - BOARD_HALF - 1) * Math.sqrt(y / (img.height - 1));
      for (let x = 0; x < img.width; x++) {
        const dx = x - QUILT_HALF;
        if (Math.abs(dx) > half + 0.5) continue;
        const edge = Math.abs(dx) > half - 0.5 || y === img.height - 1;
        setPixel(img, x, y, edge ? q.ink : quiltRgb(x, y, dx, half, q));
      }
    }
  });

// The quilt's lower edge billows in the weightless air, its corners most of all.
const quilt = (ctx: Ctx, f: Frame, c: Colors<K>, s: Spot): void => {
  const body = quiltBody(c);
  const left = s.x - QUILT_HALF;
  const top = s.y + 3;
  const keep = 10;
  ctx.drawImage(body, 0, 0, body.width, keep, left, top, body.width, keep);
  for (let x = 0; x < body.width; x += 2) {
    const edge = Math.abs(x - QUILT_HALF + 1) / QUILT_HALF;
    const lift = Math.sin(f.t * 1.3 + x * 0.21) * (0.6 + edge * edge * 1.8) + edge * edge * 2.2;
    // Slices start well inside the still part, so lifting them never opens a gap.
    const dy = Math.min(5, Math.max(0, Math.round(lift)));
    const from = keep - 6;
    const h = body.height - from;
    ctx.drawImage(body, x, from, 2, h, left + x, top + from + dy, 2, h);
  }
};

// The top board, seen a little from above: a light top with grain and a dark front edge.
const board = (ctx: Ctx, c: Colors<K>, s: Spot): void => {
  for (let k = 0; k < 7; k++) {
    const inset = Math.round((6 - k) * 0.6);
    const x = s.x - BOARD_HALF + inset;
    const w = BOARD_HALF * 2 - inset * 2;
    fillRect(ctx, k === 0 ? c.ink : c.woodHi, x, s.y - 7 + k, w, 1);
    fillRect(ctx, c.ink, x - 1, s.y - 7 + k, 1, 1);
    fillRect(ctx, c.ink, x + w, s.y - 7 + k, 1, 1);
    if (k === 2 || k === 5) fillRect(ctx, c.wood, x + 8 + k * 4, s.y - 7 + k, w - 30 - k * 4, 1);
  }
  fillRect(ctx, c.wood, s.x - BOARD_HALF - 1, s.y, BOARD_HALF * 2 + 2, 3);
  fillRect(ctx, c.ink, s.x - BOARD_HALF - 1, s.y + 3, BOARD_HALF * 2 + 2, 1);
};

// The heater's warm light leaks out under the quilt and swells on the kick.
const warmth = (ctx: Ctx, f: Frame, c: Colors<K>, s: Spot): void => {
  drawGlow(ctx, c.orange, s.x, s.y + QUILT_DROP + 4, 50, 14, 0.35 + 0.25 * f.kick);
  drawGlow(ctx, c.gold, s.x, s.y + QUILT_DROP + 3, 42, 8, 0.45 + 0.25 * f.kick);
};

// The cord trails off in a slow wave and ends in a plug with nowhere to go.
const cord = (ctx: Ctx, f: Frame, c: Colors<K>, s: Spot): void => {
  const len = wide(f) ? 70 : 40;
  const x0 = s.x + QUILT_HALF;
  const y0 = s.y + QUILT_DROP;
  let end = { x: x0, y: y0 };
  for (let k = 0; k <= len; k++) {
    const u = k / len;
    const y = Math.round(y0 + u * 9 + Math.sin(u * 7 - f.t * 1.1) * 5 * u);
    fillRect(ctx, c.ink, x0 + k, y, 1, 2);
    fillRect(ctx, c.suitLo, x0 + k, y, 1, 1);
    end = { x: x0 + k, y };
  }
  drawSprite(ctx, PLUG, paletteOf(c, 'ko-gear', gearPalette), end.x + 1, end.y - 2);
};

const basket = (ctx: Ctx, c: Colors<K>, s: Spot): void => {
  const fruit = paletteOf(c, 'ko-fruit', fruitPalette);
  const x = s.x + BOARD_HALF - 25;
  const y = s.y - 2 - BOWL.length;
  for (const [dx, dy] of HEAP) drawSprite(ctx, MANDARIN, fruit, x + dx, y + dy);
  drawSprite(ctx, BOWL, fruit, x, y);
};

// ---- the girl ----

const girlX = (s: Spot): number => s.x - 2 - (GIRL_W >> 1);
const girlY = (s: Spot): number => s.y - 7 - GIRL_SPRITE.length + 1;

// A glass bubble: only its rim and two glints, so the face inside stays clear. It narrows again down to `bottom`.
const helmet = (ctx: Ctx, color: string, cx: number, cy: number, rx: number, ry: number, bottom: number): void => {
  let prev = -1;
  for (let dy = -ry; cy + dy <= bottom; dy++) {
    const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy / (ry + 0.5)) ** 2)));
    if (prev < 0) fillRect(ctx, color, cx - half, cy + dy, half * 2 + 1, 1);
    else rimRow(ctx, color, cx, cy + dy, half, prev);
    prev = half;
  }
  fillRect(ctx, color, cx - Math.round(rx * 0.6), cy - Math.round(ry * 0.66), 3, 1);
  fillRect(ctx, color, cx - Math.round(rx * 0.76), cy - Math.round(ry * 0.5), 1, 2);
};

// One row of a rim on both sides, stepping out (or in) from the row above without gaps.
const rimRow = (ctx: Ctx, color: string, cx: number, y: number, half: number, prev: number): void => {
  const w = Math.max(1, Math.abs(half - prev));
  const out = half >= prev;
  fillRect(ctx, color, out ? cx - half : cx - prev + 1, y, w, 1);
  fillRect(ctx, color, out ? cx + half - w + 1 : cx + half, y, w, 1);
};

// A single strand on her crown that springs up on every beat.
const AHOGE: readonly Sprite[] = [
  ['..ooo', '.ohho', '.oho.', 'oho..', 'oho..'],
  ['...ooo', '..ohho', '.ohoo.', '.oho..', 'oho...', 'oho...'],
];

const ahoge = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, y: number): void => {
  const sprite = AHOGE[onBeat(f.beat, 0.3)] as Sprite;
  drawSprite(ctx, sprite, paletteOf(c, 'ko-girl', girlPalette), x, y - sprite.length + 2);
};

const STAR_CLIP: Sprite = ['..c..', 'ccccc', '.ccc.', '.c.c.'];

const girl = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const s = spotOf(f);
  const x = girlX(s);
  const y = girlY(s);
  drawGirl(ctx, f, GIRL_SPRITE, paletteOf(c, 'ko-girl', girlPalette), x, y, GIRL);
  ahoge(ctx, f, c, x + 14, y);
  drawSprite(ctx, STAR_CLIP, paletteOf(c, 'ko-girl', girlPalette), x + 21, y + 7);
  helmet(ctx, c.glass, x + 15, y + 11, 19, 18, y + NECK);
};

type Pose = { readonly fruit: Spot; readonly peel: number };

/** The fruit's top-left corner: resting on the board at `lift` 0, held up to her chest at 1. */
const fruitAt = (s: Spot, lift: number): Spot => ({ x: s.x - 6, y: Math.round(s.y - 9 - 12 * lift) });

// One bar of peeling: the mandarin rests on the board, then she lifts it to her chest in both mittens and a strip of
// peel curls up off it, which springs free at 0.85 of the bar (when `drift` takes it over) before she lowers it.
const poseOf = (f: Frame, s: Spot): Pose => {
  const p = frac(f.beat / 4);
  const lift = p < 0.5 ? 0 : p < 0.6 ? ((p - 0.5) / 0.1) ** 0.5 : p < 0.92 ? 1 : (1 - p) / 0.08;
  return { fruit: fruitAt(s, lift), peel: p >= 0.6 && p < 0.85 ? (p - 0.6) / 0.25 : -1 };
};

const arms = (ctx: Ctx, f: Frame, c: Colors<K>, s: Spot): void => {
  const x = girlX(s);
  const elbow = girlY(s) + ELBOW;
  const { fruit, peel } = poseOf(f, s);
  const fruitPal = paletteOf(c, 'ko-fruit', fruitPalette);
  const hy = fruit.y + 4;
  limb(ctx, x + 3, elbow, fruit.x - 3, hy, 3, c.suit, c.ink);
  limb(ctx, x + GIRL_W - 4, elbow, fruit.x + 10, hy, 3, c.suit, c.ink);
  drawSprite(ctx, MANDARIN, fruitPal, fruit.x, fruit.y);
  // The strip stands up off the fruit's shoulder, then leans out before it lets go.
  if (peel >= 0) drawSprite(ctx, (peel < 0.5 ? PEEL[3] : PEEL[0]) as Sprite, fruitPal, fruit.x + 5, fruit.y - 5);
  const mitten = paletteOf(c, 'ko-girl', girlPalette);
  drawSprite(ctx, MITTEN, mitten, fruit.x - 6, hy - 3);
  drawSprite(ctx, MITTEN, mitten, fruit.x + 8, hy - 3);
};

// ---- the cat ----

// The cat sits on the board in its own little helmet and paws at a segment hovering above it on every beat.
const cat = (ctx: Ctx, f: Frame, c: Colors<K>, s: Spot): void => {
  const x = s.x - BOARD_HALF + 3;
  const base = s.y - 3;
  const palette = paletteOf(c, 'ko-cat', catColors);
  catTail(ctx, x + 11, base - 2, 9, Math.round(3 + 3 * Math.sin(f.t * 1.6)), c.suitLo, c.ink, 1);
  drawSprite(ctx, CAT_BODY, palette, x, base - CAT_BODY.length);
  const hy = base - CAT_BODY.length - CAT_HEAD.length + 1;
  drawCatHead(ctx, f.t, x, hy, palette, 7);
  helmet(ctx, c.glass, x + 6, hy + 5, 9, 9, base - CAT_BODY.length);
  const bat = onBeat(f.beat, 0.3);
  const toyY = hy - 13 - Math.round(5 * (1 - frac(f.beat)) ** 2);
  drawSprite(ctx, SEGMENT[wrap(Math.floor(f.beat), 3)] as Sprite, paletteOf(c, 'ko-fruit', fruitPalette), x - 6, toyY);
  drawSprite(ctx, PAW, palette, x - 3, base - 8 - bat * 6);
};

// ---- the kotatsu group ----

const kotatsuBack = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const s = spotOf(f);
  warmth(ctx, f, c, s);
  cord(ctx, f, c, s);
};

const kotatsuFront = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const s = spotOf(f);
  quilt(ctx, f, c, s);
  board(ctx, c, s);
  basket(ctx, c, s);
  cat(ctx, f, c, s);
  arms(ctx, f, c, s);
};

// ---- peel adrift ----

// Every bar a strip of peel springs off the fruit in her hands and floats away, tumbling as it goes.
const drift = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const s = spotOf(f);
  const bar = Math.floor(f.beat / 4);
  const fruit = paletteOf(c, 'ko-fruit', fruitPalette);
  for (let b = bar - 4; b <= bar; b++) {
    const age = f.beat - (b * 4 + 3.4);
    if (age < 0) continue;
    const a = -Math.PI * (0.05 + 0.35 * rand(b, 31));
    const speed = 2 + rand(b, 32) * 1.5;
    const from = fruitAt(s, 1);
    // It springs off quickly, then drifts on at an even pace.
    const d = speed * age + 6 * (1 - 0.5 ** (age * 4));
    const x = Math.round(from.x + 6 + Math.cos(a) * d);
    const y = Math.round(from.y - 6 + Math.sin(a) * d * 0.7);
    drawSprite(ctx, PEEL[wrap(Math.floor(age * 1.6), PEEL.length)] as Sprite, fruit, x, y);
  }
};

export const kotatsuOrbit = defineScene<K>({
  id: 'kotatsu-orbit',
  title: 'Orbit Kotatsu',
  mood: { valence: 0.2, energy: -0.5 },
  styles: ['lofi-loop', 'starlit-dream', 'snowfall', 'cozy-village', 'trance-pop'],
  variants: [
    {
      mood: { valence: 0.4, energy: -0.5 },
      colors: {
        space0: '#050818',
        space1: '#13204a',
        ocean: '#2f6fd0',
        oceanLo: '#0d1838',
        land: '#58a05a',
        landLo: '#16222a',
        cloud: '#f2f6ff',
        atmo: '#7cc8ff',
        aurora: '#050818',
        ink: '#1a1630',
        glass: '#e8fbff',
        suit: '#f6f1e8',
        suitLo: '#c4bdd6',
        orange: '#ff8a2a',
        orangeLo: '#d2582a',
        gold: '#ffd24a',
        skin: '#ffe4d4',
        skinLo: '#f0b4a0',
        blush: '#ff8aa0',
        hair: '#8fe0c0',
        hairHi: '#d8fff0',
        hairLo: '#3f9a84',
        wood: '#8a5232',
        woodHi: '#d6a066',
        quilt: '#d84a3a',
        quiltLo: '#9c2c34',
      },
    },
    {
      mood: { valence: 0, energy: -0.6 },
      colors: {
        space0: '#02030a',
        space1: '#0a1430',
        ocean: '#1c3460',
        oceanLo: '#060a1c',
        land: '#2a4650',
        landLo: '#0b1218',
        cloud: '#7c8cb4',
        atmo: '#3ce0a0',
        aurora: '#46f0a8',
        ink: '#120e22',
        glass: '#d8f4ff',
        suit: '#e8e4ee',
        suitLo: '#a8a4c4',
        orange: '#ff8030',
        orangeLo: '#c8502c',
        gold: '#ffc850',
        skin: '#fbdccc',
        skinLo: '#e2a69a',
        blush: '#ff7c98',
        hair: '#80d4b8',
        hairHi: '#c8f8e8',
        hairLo: '#358a78',
        wood: '#6e4030',
        woodHi: '#b8865a',
        quilt: '#c43c3c',
        quiltLo: '#82242e',
      },
    },
    {
      mood: { valence: 0.3, energy: -0.3 },
      colors: {
        space0: '#0a0820',
        space1: '#3a2050',
        ocean: '#45689e',
        oceanLo: '#141a3c',
        land: '#8e9656',
        landLo: '#1c1e30',
        cloud: '#ffdcb8',
        atmo: '#ffa04a',
        aurora: '#0a0820',
        ink: '#1c1228',
        glass: '#fff2d8',
        suit: '#fff4e6',
        suitLo: '#d0b8c8',
        orange: '#ff8a2a',
        orangeLo: '#d2582a',
        gold: '#ffd25a',
        skin: '#ffe2cc',
        skinLo: '#f2ac98',
        blush: '#ff8098',
        hair: '#92e2c0',
        hairHi: '#e0fff0',
        hairLo: '#40987e',
        wood: '#8a4e30',
        woodHi: '#dca068',
        quilt: '#dc4a3e',
        quiltLo: '#9a2a36',
      },
    },
  ],
  layers: [space, satellite, earth, kotatsuBack, girl, kotatsuFront, drift],
});
