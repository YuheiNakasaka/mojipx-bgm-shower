// A white marble mausoleum at dawn, mirrored in the long pool before it: cypresses lining the water in perspective,
// fountains leaping on the beat, mist on the gardens and birds crossing; by night it glows under the moon.
import { type Ctx, fillRect } from 'mojipx';
import { bayer, ditherGradient, frac, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { drawGlow, flock, memoLayer, paletteBy } from './batch-1-helpers.ts';
import { moon } from './batch-2-helpers.ts';
import { BIRD, isDark } from './batch-5-helpers.ts';
import { frameLayer, wideOf } from './batch-6-helpers.ts';
import { drawMist } from './batch-10-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sky3'
  | 'sun'
  | 'marble'
  | 'marbleLo'
  | 'marbleDk'
  | 'gold'
  | 'sand'
  | 'sandLo'
  | 'lawn'
  | 'lawnLo'
  | 'tree'
  | 'treeLo'
  | 'water'
  | 'glint'
  | 'mist'
  | 'mistLo'
  | 'ink';

const birdPalette = paletteBy<K>((c) => ({ o: c.ink }));

// ---- the mausoleum, painted as its right half and mirrored ----

const HALF = 64;
const TAJ_H = 84;
const BASE = TAJ_H - 1;
const PLINTH = BASE - 6;
const BODY_TOP = PLINTH - 34;
const DRUM_TOP = BODY_TOP - 6;

/** A domed kiosk standing on row `y` around column `x`: pillars, a small dome and a gilded finial. */
const paintKiosk = (g: Ctx, c: Colors<K>, x: number, y: number, r: number): void => {
  fillRect(g, c.marbleLo, x - r, y - 5, r * 2 + 1, 5);
  for (let k = -r + 1; k < r; k += 2) fillRect(g, c.marbleDk, x + k, y - 4, 1, 3);
  fillRect(g, c.marble, x - r - 1, y - 6, r * 2 + 3, 1);
  for (let dy = 0; dy < r + 1; dy++) {
    const half = Math.round(r * Math.sqrt(1 - (dy / (r + 1)) ** 2));
    fillRect(g, c.marble, x - half, y - 7 - dy, half * 2 + 1, 1);
  }
  fillRect(g, c.gold, x, y - 10 - r, 1, 3);
};

// A pointed arch recess: straight sides rising to a point, `w` wide and `h` tall, its foot at row `y`.
const paintArch = (g: Ctx, color: string, x: number, y: number, w: number, h: number): void => {
  const spring = Math.round(h * 0.7);
  for (let r = 0; r < h; r++) {
    const inset = r < spring ? 0 : Math.round(((r - spring) / (h - spring)) ** 1.6 * (w / 2));
    if (w - inset * 2 > 0) fillRect(g, color, x + inset, y - r, w - inset * 2, 1);
  }
};

const paintBody = (g: Ctx, c: Colors<K>): void => {
  fillRect(g, c.marble, 0, BODY_TOP, 32, PLINTH - BODY_TOP);
  fillRect(g, c.marbleLo, 26, BODY_TOP, 6, PLINTH - BODY_TOP);
  // The great portal: a frame rising above the parapet around a deep pointed arch and its door.
  fillRect(g, c.marble, 0, BODY_TOP - 4, 12, 4);
  fillRect(g, c.marbleLo, 11, BODY_TOP - 4, 1, PLINTH - BODY_TOP + 4);
  paintArch(g, c.marbleDk, -8, PLINTH, 16, 27);
  fillRect(g, c.ink, 0, PLINTH - 9, 3, 9);
  // Two tiers of smaller arches on the front and on the chamfered corner.
  for (const y of [PLINTH, PLINTH - 17]) {
    paintArch(g, c.marbleLo, 14, y, 9, 14);
    paintArch(g, c.marbleDk, 15, y, 7, 12);
    paintArch(g, c.marbleDk, 27, y, 4, 12);
  }
  fillRect(g, c.gold, 0, BODY_TOP - 5, 12, 1);
  fillRect(g, c.marbleLo, 0, BODY_TOP, 32, 1);
};

// The onion dome on its drum: swelling out above the drum, then drawing in to a point under the gilded finial.
const paintDome = (g: Ctx, c: Colors<K>): void => {
  fillRect(g, c.marble, 0, DRUM_TOP, 15, 6);
  fillRect(g, c.marbleLo, 0, DRUM_TOP + 2, 15, 1);
  fillRect(g, c.marbleLo, 14, DRUM_TOP, 1, 6);
  const tall = 27;
  for (let yy = 0; yy < tall; yy++) {
    const r = yy < 6 ? 15 + (yy / 6) * 2.5 : 17.5 * (1 - ((yy - 6) / (tall - 6)) ** 2) ** 0.75;
    const half = Math.round(r);
    const y = DRUM_TOP - 1 - yy;
    fillRect(g, c.marble, 0, y, half + 1, 1);
    if (half > 2) fillRect(g, c.marbleLo, half - 1, y, 2, 1);
  }
  fillRect(g, c.gold, 0, DRUM_TOP - tall - 9, 1, 9);
  fillRect(g, c.gold, 0, DRUM_TOP - tall - 5, 2, 1);
};

// A minaret: a slender banded shaft with two balconies, crowned by a kiosk.
const paintMinaret = (g: Ctx, c: Colors<K>, x: number): void => {
  const top = PLINTH - 50;
  for (let y = top; y < PLINTH; y++) {
    const half = y < top + 20 ? 2 : 3;
    fillRect(g, c.marble, x - half, y, half * 2 + 1, 1);
    fillRect(g, c.marbleLo, x + half, y, 1, 1);
    if ((y - top) % 6 === 0) fillRect(g, c.marbleLo, x - half, y, half * 2 + 1, 1);
  }
  for (const y of [top + 16, top + 33]) {
    fillRect(g, c.marble, x - 5, y, 11, 2);
    fillRect(g, c.marbleDk, x - 4, y + 2, 9, 1);
  }
  paintKiosk(g, c, x, top, 3);
};

const paintPlinth = (g: Ctx, c: Colors<K>): void => {
  fillRect(g, c.marbleLo, 0, PLINTH, HALF, BASE - PLINTH + 1);
  fillRect(g, c.marble, 0, PLINTH, HALF, 1);
  for (let x = 3; x < HALF - 2; x += 6) paintArch(g, c.marbleDk, x, BASE - 1, 3, 4);
};

const tajHalf = (c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`taj-half:${c.marble}${c.marbleLo}${c.marbleDk}${c.gold}${c.ink}`, HALF + 1, TAJ_H, (g) => {
    paintPlinth(g, c);
    paintMinaret(g, c, HALF - 5);
    paintBody(g, c);
    paintKiosk(g, c, 22, BODY_TOP, 4);
    paintDome(g, c);
  });

/** The whole mausoleum, its centre column at x, its plinth's foot at row y: the right half, then its mirror image. */
const drawTaj = (ctx: Ctx, c: Colors<K>, x: number, y: number): void => {
  const half = tajHalf(c);
  ctx.drawImage(half, x, y - TAJ_H + 1);
  ctx.save();
  ctx.translate(x + 1, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(half, 0, y - TAJ_H + 1);
  ctx.restore();
};

// ---- the garden ----

type Layout = {
  readonly cx: number;
  /** The row the mausoleum stands on, which is also the far end of the pool. */
  readonly ground: number;
  /** The pool's half-width at its far end and at the bottom of the frame. */
  readonly far: number;
  readonly near: number;
  readonly moonX: number;
  readonly moonY: number;
};

const layoutOf = (f: Frame): Layout => {
  const wide = wideOf(f);
  const ground = Math.round(f.h * (wide ? 0.55 : 0.5));
  return {
    cx: Math.floor(f.w / 2),
    ground,
    far: 6,
    near: wide ? 46 : 40,
    moonX: Math.round(f.w * (wide ? 0.8 : 0.78)),
    moonY: Math.round(ground * (wide ? 0.3 : 0.32)),
  };
};

// How far toward the viewer a row is (0 at the pool's far end, 1 at the bottom), and the pool's half-width there.
const depthOf = (f: Frame, l: Layout, y: number): number => Math.max(0, (y - l.ground) / (f.h - l.ground));
const poolHalf = (f: Frame, l: Layout, y: number): number => Math.round(l.far + (l.near - l.far) * depthOf(f, l, y));

// The red sandstone halls either side, each with three white domes, half lost in the trees.
const paintHall = (g: Ctx, c: Colors<K>, x: number, ground: number): void => {
  fillRect(g, c.sandLo, x - 16, ground - 12, 33, 12);
  fillRect(g, c.sand, x - 16, ground - 12, 33, 1);
  for (const dx of [-10, 0, 10]) {
    for (let dy = 0; dy < 4; dy++) fillRect(g, c.marbleLo, x + dx - 3 + dy, ground - 13 - dy, 7 - dy * 2, 1);
    fillRect(g, c.marbleDk, x + dx - 1, ground - 7, 3, 7);
  }
};

// Mown stripes fanning out from the far end of the pool, and a cross walk halfway along it.
const paintLawn = (g: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  g.drawImage(ditherGradient(f.w, f.h - l.ground, [c.lawnLo, c.lawn]), 0, l.ground);
  for (let y = l.ground + 1; y < f.h; y++) {
    const spread = (y - l.ground) * 0.5 + 2;
    for (let x = 0; x < f.w; x++) if (Math.floor((x - l.cx) / spread) % 2 === 0 && bayer(x, y) < 0.5) fillRect(g, c.lawnLo, x, y, 1, 1);
  }
  const walk = Math.round(l.ground + (f.h - l.ground) * 0.3);
  fillRect(g, c.sand, 0, walk, f.w, 2 + Math.round((walk - l.ground) / 12));
};

const paintGarden = (g: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  paintLawn(g, f, c, l);
  for (let y = l.ground; y < f.h; y++) {
    const half = poolHalf(f, l, y);
    const path = Math.round(3 + depthOf(f, l, y) * 14);
    fillRect(g, c.sand, l.cx - half - path, y, path, 1);
    fillRect(g, c.sand, l.cx + half + 1, y, path, 1);
    fillRect(g, c.sandLo, l.cx - half - 1, y, 1, 1);
    fillRect(g, c.sandLo, l.cx + half + 1, y, 1, 1);
  }
};

// The light behind it all, painted under the mausoleum: the moon at night, the low sun's glow by day.
const paintLight = (g: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  if (!isDark(c.sky0)) {
    drawGlow(g, c.sun, l.cx, l.ground - 4, Math.round(f.w * 0.45), 34, 0.45, 5);
    return;
  }
  drawGlow(g, c.sky3, l.moonX, l.moonY, 26, 26, 0.6);
  moon(g, l.moonX, l.moonY, 7, c.sun, c.mistLo);
};

const skyLife = (ctx: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  if (isDark(c.sky0)) stars(ctx, f.w, l.ground, f.t, [c.mist, c.glint], 40, 51, 0.7);
  else flock(ctx, f, BIRD, birdPalette(c), { count: 5, top: l.ground * 0.25, span: l.ground * 0.3, speed: 9, seed: 52 });
};

const gardenLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('taj-garden', f, c, (g) => {
    const l = layoutOf(f);
    g.drawImage(ditherGradient(f.w, l.ground, [c.sky0, c.sky1, c.sky2, c.sky3]), 0, 0);
    paintLight(g, f, c, l);
    for (const side of [-1, 1]) paintHall(g, c, l.cx + side * Math.round(f.w * 0.42), l.ground);
    g.fillStyle = c.treeLo;
    for (let x = 0; x < f.w; x++) {
      const edge = Math.abs(x - l.cx) / (f.w / 2);
      if (edge > 0.55) g.fillRect(x, l.ground - Math.round(3 + 3 * Math.sin(x * 0.7) ** 2), 1, 6);
    }
    drawTaj(g, c, l.cx, l.ground);
    paintGarden(g, f, c, l);
  });

// ---- the pool ----

// The pool mirrors the mausoleum: each row copies a row above the ground line, rippling, trimmed to the pool's width.
const pool = (ctx: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  const axis = l.ground;
  ctx.save();
  for (let y = axis + 1; y < f.h; y++) {
    const half = poolHalf(f, l, y);
    const src = axis - (y - axis) * 0.95;
    if (src < 0) break;
    const dx = Math.round(Math.sin(y * 0.9 + f.t * 2) * depthOf(f, l, y) * 1.5);
    ctx.drawImage(ctx.canvas, l.cx - half - dx, Math.floor(src), half * 2 + 1, 1, l.cx - half, y, half * 2 + 1, 1);
  }
  ctx.globalAlpha = 0.35;
  for (let y = axis + 1; y < f.h; y++) {
    const half = poolHalf(f, l, y);
    fillRect(ctx, c.water, l.cx - half, y, half * 2 + 1, 1);
  }
  ctx.restore();
};

// Fountains down the middle of the pool leap on every beat and fall back.
const fountains = (ctx: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  const spurt = (1 - frac(f.beat)) ** 0.6 * (0.6 + f.energy * 0.4);
  for (let k = 1; k <= 6; k++) {
    const d = (k / 6.5) ** 1.5;
    const y = Math.round(l.ground + d * (f.h - l.ground));
    const tall = Math.round((2 + d * 12) * spurt);
    for (let r = 0; r < tall; r++) if (bayer(l.cx, y - r) < 0.75) fillRect(ctx, c.mist, l.cx, y - r, 1, 1);
    fillRect(ctx, c.glint, l.cx - 1, y - tall, 3, 1);
  }
};

// ---- cypresses ----

// A cypress: a narrow flame of dark green, lit on one side, with its foot at (x, y).
const cypress = (ctx: Ctx, c: Colors<K>, x: number, y: number, tall: number, side: number): void => {
  const width = Math.max(1, tall * 0.16);
  for (let r = 0; r < tall; r++) {
    const share = r / tall;
    const half = Math.round(width * Math.sin(Math.min(1, (1 - share) * 1.25) * Math.PI * 0.5) * (share < 0.12 ? share / 0.12 : 1));
    fillRect(ctx, c.tree, x - half, y - r, half * 2 + 1, 1);
    if (half > 0) fillRect(ctx, c.treeLo, side > 0 ? x + half : x - half, y - r, 1, 1);
  }
};

const avenue = (ctx: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  for (let k = 0; k < 9; k++) {
    const d = ((k + 1) / 9) ** 1.7;
    const y = Math.round(l.ground + d * (f.h - l.ground));
    const half = poolHalf(f, l, y);
    const gap = Math.round(5 + d * 22);
    const tall = Math.round(6 + d * 52);
    for (const side of [-1, 1]) cypress(ctx, c, l.cx + side * (half + gap), y, tall, side);
  }
};

// ---- sky ----

const scene = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  ctx.drawImage(gardenLayer(f, c), 0, 0);
  skyLife(ctx, f, c, l);
  pool(ctx, f, c, l);
  fountains(ctx, f, c, l);
  drawMist(ctx, f, c.mist, c.mistLo, { y: l.ground - 8, h: 14, speed: 2, density: 0.45, seed: 54 });
  avenue(ctx, f, c, l);
  drawMist(ctx, f, c.mist, c.mistLo, { y: f.h - 18, h: 18, speed: -3, density: 0.4, seed: 55 });
};

export const tajReflection = defineScene<K>({
  id: 'taj-reflection',
  title: 'Marble Reflection',
  mood: { valence: 0.3, energy: -0.5 },
  styles: ['starlit-dream', 'credits-roll', 'town-waltz', 'lofi-loop', 'showa-ballad'],
  variants: [
    {
      // Dawn: pink light on the marble, mist lying on the gardens.
      mood: { valence: 0.3, energy: -0.5 },
      colors: {
        sky0: '#6a6cac',
        sky1: '#b28ab8',
        sky2: '#eeaab4',
        sky3: '#ffd6b4',
        sun: '#ffe8c4',
        marble: '#fff2ee',
        marbleLo: '#dcbcca',
        marbleDk: '#9c7a9e',
        gold: '#e8b860',
        sand: '#d8a88e',
        sandLo: '#a8706e',
        lawn: '#5c7c5a',
        lawnLo: '#466450',
        tree: '#2c4c3c',
        treeLo: '#1a3028',
        water: '#7a86c0',
        glint: '#fff6e8',
        mist: '#ffeaf0',
        mistLo: '#d8bcd4',
        ink: '#4a3a5a',
      },
    },
    {
      // Moonlight: the marble glowing blue-white against a night of stars.
      mood: { valence: -0.4, energy: -0.6 },
      colors: {
        sky0: '#060a20',
        sky1: '#101a40',
        sky2: '#22305e',
        sky3: '#3a4a7a',
        sun: '#f2f0dc',
        marble: '#dfe8ff',
        marbleLo: '#8e9cca',
        marbleDk: '#46548a',
        gold: '#c8b070',
        sand: '#5a5a7a',
        sandLo: '#3a3a5a',
        lawn: '#1e3036',
        lawnLo: '#16242e',
        tree: '#0e1a20',
        treeLo: '#060c14',
        water: '#1a2650',
        glint: '#e8f0ff',
        mist: '#8a9ac0',
        mistLo: '#4a5a84',
        ink: '#060a16',
      },
    },
    {
      // A golden afternoon: warm stone, a blue pool, parakeets wheeling over the gardens.
      mood: { valence: 0.65, energy: 0.2 },
      colors: {
        sky0: '#4a86d0',
        sky1: '#8ab8e4',
        sky2: '#f0d4a4',
        sky3: '#ffe2a8',
        sun: '#fff4d0',
        marble: '#fff6e4',
        marbleLo: '#e6c69c',
        marbleDk: '#a8805e',
        gold: '#f0c050',
        sand: '#e09a6a',
        sandLo: '#a8604a',
        lawn: '#6a9a4a',
        lawnLo: '#4e7a40',
        tree: '#2e5a34',
        treeLo: '#1a3a24',
        water: '#3a78c0',
        glint: '#ffffff',
        mist: '#fff4e0',
        mistLo: '#e8d0b0',
        ink: '#2a3a2a',
      },
    },
  ],
  layers: [scene],
});
