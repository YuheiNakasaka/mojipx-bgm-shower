// The pyramids of Giza and the Sphinx under the Milky Way: two camels resting by a small campfire that flares on the
// beat, sparks drifting up and a shooting star now and then; at sunrise the Sphinx watches the sun come up.
import { type Ctx, drawSprite, fillRect, flipped, type Sprite } from 'mojipx';
import { bayer, ditherGradient, frac, pixelLine, rand, ridgeNoise, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { drawGlow, flock, paletteBy, smokePlume } from './batch-1-helpers.ts';
import { fillPolygon, type Pt, sunWithHalo } from './batch-4-helpers.ts';
import { BIRD, isDark } from './batch-5-helpers.ts';
import { frameLayer, wideOf } from './batch-6-helpers.ts';
import { galaxyLayer, shootingStar } from './batch-10-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sky3'
  | 'band'
  | 'core'
  | 'star'
  | 'sun'
  | 'lit'
  | 'stone'
  | 'shade'
  | 'cap'
  | 'sand0'
  | 'sand1'
  | 'sand2'
  | 'ink'
  | 'fire'
  | 'flame'
  | 'ember'
  | 'camel'
  | 'camelHi'
  | 'camelLo'
  | 'smoke'
  | 'warm';

// The Sphinx in profile, facing the sunrise on the left: o outline, l lit stone, s stone, d shade.
const SPHINX: Sprite = [
  '..........oooooooo............................................',
  '.........olllllllloo..........................................',
  '........ollllllllllllo........................................',
  '........oddddddddllllllo......................................',
  '.......olllllllllsssssslo.....................................',
  '......oolldllllllllllllllo....................................',
  '.....olllllllllssssssssslo....................................',
  '......olllllllllllllllllllo...................................',
  '......oodlllllssssssssssslo...................................',
  '.......ollllllllllllllllllo...................................',
  '........oddllllsssssssssssooooooooooooooooooooooooooo.........',
  '.........odlllllllllllllllllllllllllllllllllllllllllllloooo...',
  '.........odsssssssssssssssssssssssssssssssssssssssssssslllloo.',
  '..........odssssssssssssssssssssssssssssssssssssssssssssssllo.',
  '..........odssssssssssssssssssssssssssssssssssssssssssssssssso',
  '..........oddssssssssssssssssssssssssssssssssssssssssssssssso.',
  '...........oddssdssssssssssssssssssssssssssssssssssssssssssso.',
  '..oooooooooddsdsssssssssssssssssssssssssssssssssssssssssssdso.',
  '.ollllllllllldsssssssssssssssssssssssssssssssssssssssssssdsso.',
  'olllllllllllllddddddddddddddddddddddddddddddddddddddddddddddo.',
  'oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo',
];

// A camel resting with its legs folded, facing left: o outline, c coat, h coat lit by the fire, d coat in shadow.
// Its head (the top-left corner) is drawn on its own so it can dip while the camel chews.
const CAMEL: Sprite = [
  '........................oooo..........',
  '.......oo.............oocccco.........',
  '..ooooocco...........occcccccoo.......',
  '.occcccdcco.........occcccccccco......',
  'ohcccccccco........occccccccccccoo....',
  '.oohhcccccco......occcccccccccccccoo..',
  '...ooooohcco.....occcccccccccccccccco.',
  '.......ohcco....occccccccccccccccccco.',
  '.......ohccco..occcccccccccccccccccddo',
  '........ohcccoocccccccccccccccccccccdo',
  '........ohcccccccccccccccccccccccccddo',
  '.........ohccccccccccccccccccccccccddo',
  '........ohhcccccccccccccccccccccccddo.',
  '........ohcccccccccccccccccccccccdddo.',
  '.......oddccddddcccccccccddddddddddo..',
  '......oodddddooddddddddddddddddddoo...',
  '......oooooooooooooooooooooooooooo....',
];
const HEAD_W = 12;
const CAMEL_HEAD: Sprite = CAMEL.slice(1, 6).map((row) => row.slice(0, HEAD_W));
const CAMEL_BODY: Sprite = CAMEL.map((row, y) => (y >= 1 && y < 6 ? '.'.repeat(HEAD_W) + row.slice(HEAD_W) : row));
const CAMEL_SIDES = {
  left: { body: CAMEL_BODY, head: CAMEL_HEAD },
  right: { body: flipped(CAMEL_BODY), head: flipped(CAMEL_HEAD) },
} as const;

const sphinxPalette = paletteBy<K>((c) => ({ o: c.ink, l: c.lit, s: c.stone, d: c.shade }));
const camelPalette = paletteBy<K>((c) => ({ o: c.ink, c: c.camel, h: c.camelHi, d: c.camelLo }));
const birdPalette = paletteBy<K>((c) => ({ o: c.ink }));

// ---- layout ----

type Pyramid = { readonly x: number; readonly base: number; readonly half: number; readonly height: number; readonly cap: boolean };

type Layout = {
  readonly hz: number;
  /** Drawn in this order, farthest first. */
  readonly pyramids: readonly Pyramid[];
  readonly sphinx: Pt;
  readonly fireX: number;
  /** The camp's dune: its crest at the fire, how far it rises there and how wide it spreads. */
  readonly duneTop: number;
  readonly duneSpread: number;
  readonly sunX: number;
};

const pyr = (x: number, base: number, half: number, height: number, cap = false): Pyramid => ({ x, base, half, height, cap });

const wideLayout = (f: Frame): Layout => {
  const hz = Math.round(f.h * 0.64);
  return {
    hz,
    pyramids: [
      pyr(f.w * 0.92, hz + 2, 7, 8),
      pyr(f.w * 0.96, hz + 2, 6, 7),
      pyr(f.w * 0.62, hz, 50, 66, true),
      pyr(f.w * 0.84, hz + 3, 24, 30),
      pyr(f.w * 0.36, hz + 2, 54, 63),
    ],
    sphinx: [Math.round(f.w * 0.05), hz + 32],
    fireX: Math.round(f.w * 0.76),
    duneTop: f.h - 32,
    duneSpread: f.w * 0.36,
    sunX: Math.round(f.w * 0.1),
  };
};

const tallLayout = (f: Frame): Layout => {
  const hz = Math.round(f.h * 0.62);
  return {
    hz,
    pyramids: [pyr(f.w * 0.72, hz, 44, 58, true), pyr(f.w * 1.02, hz + 3, 22, 28), pyr(f.w * 0.32, hz + 2, 48, 56)],
    sphinx: [Math.round(f.w * 0.04), hz + 44],
    fireX: Math.round(f.w * 0.6),
    duneTop: f.h - 84,
    duneSpread: f.w * 0.6,
    sunX: Math.round(f.w * 0.16),
  };
};

const layoutOf = (f: Frame): Layout => (wideOf(f) ? wideLayout(f) : tallLayout(f));

// The camp's dune: a broad swell around the fire, flattening out toward both sides of the frame.
const duneAt = (f: Frame, l: Layout, x: number): number => {
  const k = Math.exp(-(((x - l.fireX) / l.duneSpread) ** 2));
  return f.h + 6 - (f.h + 6 - l.duneTop) * k + (ridgeNoise(x / 60, 9) - 0.5) * 12 * k + (ridgeNoise(x / 25, 8) - 0.5) * 3;
};

const fireOf = (f: Frame, l: Layout): Pt => [l.fireX, Math.round(duneAt(f, l, l.fireX)) + 12];

// ---- the sky ----

const skyLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('pyramid-sky', f, c, (g) => {
    const l = layoutOf(f);
    g.drawImage(ditherGradient(f.w, l.hz, [c.sky0, c.sky1, c.sky2, c.sky3]), 0, 0);
    if (!isDark(c.sky0)) return;
    const wide = wideOf(f);
    const galaxy = {
      x0: f.w * (wide ? 0.12 : 0.1),
      y0: l.hz * 1.05,
      x1: f.w * (wide ? 0.82 : 0.86),
      y1: -l.hz * 0.1,
      half: wide ? 28 : 32,
      seed: 5,
      sprinkle: 0.012,
    };
    g.drawImage(galaxyLayer(f.w, l.hz, galaxy, { glow: c.band, core: c.core, dust: c.band, stars: [c.star, c.core, c.sun] }), 0, 0);
  });

// The rising sun (dawn only): it climbs slowly while the scene is on, behind the land drawn after it.
const sunrise = (ctx: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  const r = 9;
  const y = l.hz - 3 - Math.min(1, f.t / 60) * r * 1.6;
  sunWithHalo(ctx, l.sunX, y, r, c.sun, c.sky3, 4);
};

// Far city lights along the horizon on the left, flickering in the heat.
const cityLights = (ctx: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  for (let i = 0; i < 16; i++) {
    if (Math.sin(f.t * (1.5 + rand(i, 41)) + i * 2.3) < -0.4) continue;
    fillRect(ctx, i % 3 === 0 ? c.sun : c.flame, Math.round(rand(i, 42) * f.w * 0.22), l.hz - 1 - (i % 4 === 0 ? 1 : 0), 1, 1);
  }
};

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  ctx.drawImage(skyLayer(f, c), 0, 0);
  if (!isDark(c.sky0)) {
    sunrise(ctx, f, c, l);
    stars(ctx, f.w, l.hz, f.t, [c.sky1], 14, 61, 0.35);
    flock(ctx, f, [BIRD[0] as Sprite, BIRD[1] as Sprite], birdPalette(c), { count: 4, top: l.hz * 0.35, span: 26, speed: 6, seed: 62 });
    return;
  }
  stars(ctx, f.w, l.hz, f.t, [c.star, c.sun, c.core], 36, 63, 0.9);
  shootingStar(ctx, f, c.star, c.core, { every: 4.5, top: l.hz * 0.05, span: l.hz * 0.35, seed: 64 });
  cityLights(ctx, f, c, l);
};

// ---- the plateau: pyramids, the Sphinx and the camp's dune ----

const edgeX = (a: Pt, b: Pt, y: number): number => a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]);

type Corners = { readonly apex: Pt; readonly left: Pt; readonly front: Pt; readonly right: Pt };

// Seen a little from one side: the front corner sits right of the middle and a little nearer.
const cornersOf = (p: Pyramid): Corners => ({
  apex: [Math.round(p.x), p.base - p.height],
  left: [Math.round(p.x - p.half), p.base],
  front: [Math.round(p.x + p.half * 0.24), p.base + Math.max(1, Math.round(p.half * 0.1))],
  right: [Math.round(p.x + p.half), p.base],
});

// Courses of stone: dithered lines every few rows across each face.
const paintCourses = (g: Ctx, c: Colors<K>, k: Corners): void => {
  for (let y = k.apex[1] + 3; y < k.left[1]; y += 3) {
    const a = Math.round(edgeX(k.apex, k.left, y));
    const m = Math.round(edgeX(k.apex, k.front, y));
    const b = Math.round(edgeX(k.apex, k.right, y));
    for (let x = a + 1; x < b; x++) {
      const low = (y - k.apex[1]) / (k.left[1] - k.apex[1]);
      if (bayer(x, y) >= (x < m ? 0.35 + low * 0.4 : 0.2 + low * 0.3)) continue;
      fillRect(g, x < m ? c.stone : c.ink, x, y, 1, 1);
    }
  }
};

// The smooth casing that still covers the top of the middle pyramid.
const paintCap = (g: Ctx, c: Colors<K>, k: Corners, p: Pyramid): void => {
  const y = k.apex[1] + Math.round(p.height * 0.17);
  const atLeft: Pt = [edgeX(k.apex, k.left, y), y];
  const atFront: Pt = [edgeX(k.apex, k.front, y), y];
  const atRight: Pt = [edgeX(k.apex, k.right, y), y];
  fillPolygon(g, [k.apex, atLeft, atFront], c.cap);
  fillPolygon(g, [k.apex, atFront, atRight], c.lit);
  for (let x = Math.round(atLeft[0]); x < atRight[0]; x++) if (bayer(x, y) < 0.5) fillRect(g, x < atFront[0] ? c.cap : c.lit, x, y, 1, 1);
};

const paintPyramid = (g: Ctx, c: Colors<K>, p: Pyramid): void => {
  const k = cornersOf(p);
  fillPolygon(g, [k.apex, k.left, k.front], c.lit);
  fillPolygon(g, [k.apex, k.front, k.right], c.shade);
  paintCourses(g, c, k);
  if (p.cap) paintCap(g, c, k, p);
  pixelLine(g, k.apex[0], k.apex[1], k.front[0], k.front[1], c.cap);
};

const paintDune = (g: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  for (let x = 0; x < f.w; x++) {
    const top = Math.round(duneAt(f, l, x));
    if (top >= f.h) continue;
    fillRect(g, c.sand1, x, top, 1, f.h - top);
    fillRect(g, c.sand0, x, top, 1, 1);
    if (x < l.fireX && bayer(x, top + 1) < 0.5) fillRect(g, c.sand0, x, top + 1, 1, 1);
  }
  // Wind ripples: wavy dithered lines across the dune's face.
  for (let y = l.duneTop + 5; y < f.h; y += 5)
    for (let x = 0; x < f.w; x++) {
      const ry = Math.round(y + Math.sin(x / 9 + y) * 1.5);
      if (ry > duneAt(f, l, x) + 2 && bayer(x, ry) < 0.45) fillRect(g, c.sand2, x, ry, 1, 1);
    }
};

const landLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('pyramid-land', f, c, (g) => {
    const l = layoutOf(f);
    g.drawImage(ditherGradient(f.w, f.h - l.hz, [c.sand2, c.sand1, c.sand2]), 0, l.hz);
    g.fillStyle = c.sand2;
    for (let x = 0; x < f.w; x++) {
      const rise = Math.round(ridgeNoise(x / 26, 3) * 4);
      g.fillRect(x, l.hz - rise, 1, rise + 1);
    }
    for (const p of l.pyramids) paintPyramid(g, c, p);
    drawSprite(g, SPHINX, sphinxPalette(c), l.sphinx[0], l.sphinx[1] - SPHINX.length);
    fillRect(g, c.ink, l.sphinx[0] + 4, l.sphinx[1], SPHINX[0]?.length ?? 0, 1);
    paintDune(g, f, c, l);
  });

const land = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(landLayer(f, c), 0, 0);
};

// ---- the camp ----

const flame = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, y: number): void => {
  const tall = 8 + Math.round(f.kick * 3 + f.energy * 2);
  for (let r = 0; r < tall; r++) {
    const share = r / tall;
    const half = Math.round(3.6 * (1 - share) ** 0.8);
    const sway = Math.round(Math.sin(f.t * 9 + r * 0.7) * share * 1.6);
    const cx = x + sway;
    fillRect(ctx, c.ember, cx - half - 1, y - r, half * 2 + 3, 1);
    if (half > 0) fillRect(ctx, c.flame, cx - half, y - r, half * 2 + 1, 1);
    if (share < 0.45) fillRect(ctx, c.fire, cx - Math.max(0, half - 2), y - r, Math.max(1, half * 2 - 3), 1);
  }
};

// Sparks lifting off the fire, more of them and faster when the music is busy.
const sparks = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, y: number): void => {
  for (let i = 0; i < 7; i++) {
    const u = f.t * (0.45 + f.energy * 0.4 + rand(i, 71) * 0.3) + rand(i, 72);
    const age = frac(u);
    if (age > 0.85) continue;
    const sx = x + (rand(Math.floor(u), i) - 0.5) * 8 + Math.sin(age * 7 + i) * 3;
    fillRect(ctx, age < 0.4 ? c.fire : c.flame, Math.round(sx), Math.round(y - 8 - age * 34), 1, 1);
  }
};

// A camel with its feet at row `base`, its left edge at x; the head dips a pixel while it chews.
const camel = (ctx: Ctx, c: Colors<K>, side: keyof typeof CAMEL_SIDES, x: number, base: number, chew: number): void => {
  const s = CAMEL_SIDES[side];
  const top = base - s.body.length;
  const headX = side === 'left' ? x : x + (s.body[0]?.length ?? 0) - (s.head[0]?.length ?? 0);
  drawSprite(ctx, s.body, camelPalette(c), x, top);
  drawSprite(ctx, s.head, camelPalette(c), headX, top + 1 + chew);
};

const camp = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const [fx, fy] = fireOf(f, l);
  const night = isDark(c.sky0);
  const flare = f.kick > 0.6 ? 1 : 0;
  drawGlow(ctx, c.warm, fx, fy - 2, 40 + flare * 4, 14 + flare * 2, night ? 0.85 : 0.22, 4);
  if (night) drawGlow(ctx, c.ember, fx, fy - 3, 14, 6, 0.6, 3);
  const chew = Math.floor(f.beat) % 2;
  camel(ctx, c, 'left', fx + 8, fy - 1, chew);
  smokePlume(ctx, f, fx, fy - 10, c.smoke, 3, 40);
  fillRect(ctx, c.ink, fx - 6, fy - 1, 13, 2);
  fillRect(ctx, c.camelLo, fx - 5, fy - 2, 4, 1);
  fillRect(ctx, c.camelLo, fx + 2, fy - 2, 4, 1);
  flame(ctx, f, c, fx, fy - 2);
  sparks(ctx, f, c, fx, fy);
  camel(ctx, c, 'right', fx - 41, fy + 5, 1 - chew);
};

export const pyramidStars = defineScene<K>({
  id: 'pyramid-stars',
  title: 'Pyramid Night',
  mood: { valence: -0.3, energy: -0.4 },
  styles: ['starlit-dream', 'lofi-loop', 'credits-roll', 'deep-dungeon', 'trance-pop'],
  variants: [
    {
      // A moonless night: the Milky Way arching over the plateau, the city glowing faintly on the horizon.
      mood: { valence: -0.3, energy: -0.4 },
      colors: {
        sky0: '#04061a',
        sky1: '#0c1238',
        sky2: '#262b5e',
        sky3: '#74476a',
        band: '#2c3870',
        core: '#9a9ccc',
        star: '#eef0ff',
        sun: '#ffd89a',
        lit: '#3c4270',
        stone: '#2e3258',
        shade: '#1a1b3a',
        cap: '#8a90bc',
        sand0: '#4e4870',
        sand1: '#24223e',
        sand2: '#17162e',
        ink: '#08070f',
        fire: '#fff2a8',
        flame: '#ffa040',
        ember: '#d0502e',
        camel: '#3e2c40',
        camelHi: '#e88a50',
        camelLo: '#20182a',
        smoke: '#3e3c5a',
        warm: '#5e3442',
      },
    },
    {
      // Dawn: the sun rising where the Sphinx is looking, the stone blushing gold.
      mood: { valence: 0.45, energy: 0.15 },
      colors: {
        sky0: '#3e4e98',
        sky1: '#8e6eaa',
        sky2: '#f0907a',
        sky3: '#ffcf86',
        band: '#8e6eaa',
        core: '#f0907a',
        star: '#fff8e0',
        sun: '#fff8d0',
        lit: '#f4b07a',
        stone: '#c47c5e',
        shade: '#7a4a62',
        cap: '#ffe6b8',
        sand0: '#fcd29a',
        sand1: '#d8946e',
        sand2: '#9a6066',
        ink: '#3a2234',
        fire: '#fff2a8',
        flame: '#ffa040',
        ember: '#e0603a',
        camel: '#b06e4e',
        camelHi: '#f6be86',
        camelLo: '#6e3e46',
        smoke: '#d8b0b0',
        warm: '#ffd8a0',
      },
    },
    {
      // Last light: a crimson afterglow behind the pyramids and the first stars out.
      mood: { valence: -0.6, energy: 0.3 },
      colors: {
        sky0: '#0a0a24',
        sky1: '#28184a',
        sky2: '#6a2858',
        sky3: '#d0563c',
        band: '#2a1c4c',
        core: '#6a4a7e',
        star: '#ffe8f0',
        sun: '#ffb070',
        lit: '#8a4a5a',
        stone: '#5e3048',
        shade: '#2a1630',
        cap: '#e08a6a',
        sand0: '#8a4a52',
        sand1: '#3e2238',
        sand2: '#24142a',
        ink: '#0e0812',
        fire: '#fff0a0',
        flame: '#ff9038',
        ember: '#c83a2a',
        camel: '#4a2a3a',
        camelHi: '#f08a50',
        camelLo: '#24121e',
        smoke: '#5a3a54',
        warm: '#5a2a3a',
      },
    },
  ],
  layers: [sky, land, camp],
});
