// The boss of a vertical shooter that never existed: a crystal moth-ship fills the top of the screen and fans out
// symmetric curtains of bullets on the beat while a tiny fighter weaves below, firing; every eight bars a bomb clears the air.
import { type Ctx, drawSprite, fillRect, type Palette, type Sprite } from 'mojipx';
import { bayer, disc, ditherGradient, frac, hexToRgb, memoCanvas, pixelLine, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { drawGlow, fillDither, wrap } from './batch-1-helpers.ts';
import { memoLayer, paletteOf, sigOf } from './batch-3-helpers.ts';
import { drawText, fillPolygon, fractal2, type Pt, textWidth } from './batch-4-helpers.ts';
import { drawGirl, type Girl } from './batch-7-helpers.ts';
import { digits, gauge, tileDown } from './batch-8-helpers.ts';

type K =
  | 'space0'
  | 'space1'
  | 'space2'
  | 'cloud'
  | 'cloudHi'
  | 'star'
  | 'panel'
  | 'panelHi'
  | 'panelLo'
  | 'label'
  | 'text'
  | 'ink'
  | 'hull'
  | 'hullHi'
  | 'hullLo'
  | 'wing'
  | 'wingHi'
  | 'core'
  | 'coreHi'
  | 'ship'
  | 'canopy'
  | 'stripe'
  | 'flame'
  | 'bulletA'
  | 'bulletB'
  | 'white';

// ---- sprites ----

// The player's fighter: o outline, h hull, W highlight, c canopy, r stripe.
const SHIP: Sprite = [
  '.....o.....',
  '....oWo....',
  '....oco....',
  '...oWcWo...',
  '...ohhho...',
  '.o.ohrho.o.',
  'oWoohhhooWo',
  'ohhhhhhhhho',
  'ohrhhhhhrho',
  '.oohhohhoo.',
  '..oo.o.oo..',
];

// Bullets: a dark rim, a bright body and a white heart.
const ORB: Sprite = ['..aaa..', '.abbba.', 'abbwbba', 'abwwwba', 'abbwbba', '.abbba.', '..aaa..'];
const ORB_BIG: Sprite = [
  '...aaa...',
  '..abbba..',
  '.abbbbba.',
  'abbwwwbba',
  'abbwwwbba',
  'abbwwwbba',
  '.abbbbba.',
  '..abbba..',
  '...aaa...',
];
const NEEDLE: Sprite = ['.a.', 'aba', 'awa', 'awa', 'aba', '.a.'];
const STAR_ICON: Sprite = ['..a..', '.aba.', 'abwba', '.aba.', '..a..'];

// The pilot in the side panel: o outline, h/H/d hair, q/g/G/Q goggles, s/S skin, b blush, e/i/I/w eyes, m mouth,
// u/U flight suit, c collar, y patch. She keeps her own colors whatever the sky.
const PILOT: Sprite = [
  '.............oooo.............',
  '...........ooHHHHoo..oo.......',
  '.........ooHHhhhhhhooHo.......',
  '........oHHqqqhhhhqqqho.......',
  '.......oHhqgGgqhhqgGgqhoo.....',
  '......oQQQqgggqQQqgggqQQQo....',
  '.....ohhhhhqqqhhhhqqqhhhhho...',
  '....ohhhhhhhhhhhhhhhhhhhhhho..',
  '....ohhhhhhhhhhhhhhhhhhhhhho..',
  '...ohhhhhhdhhhhhhhhdhhhhhhhho.',
  '...ohhhhhdsdhhhhhhdsdhhhhhhho.',
  '...ohhhhdsssdhhhhdsssdhhhhhho.',
  '...ohhhdssssssdhdsssssdhhhhho.',
  '...ohhdseeeesssssseeeesdhhhho.',
  '...ohhseewiessssseiweesdhhho..',
  '...ohhsseiiesssssseiiessdhho..',
  '...ohhsseIIesssssseIIessdhho..',
  '...ohhsssseessssssseessssdhho.',
  '...ohdsbbbsssssssssbbbssdhho..',
  '...ohdsssssssmmssssssssdhhho..',
  '...ohdSsssssssssssssssSdhho...',
  '...ohhdSSsssssssssssSSdhhho...',
  '....ohhdoSSSSsssSSSSodhhho....',
  '....ohho..ooSssssSoo.ohho.....',
  '.....oo.....oSsssSo...oo......',
  '..........ooocSSScooo.........',
  '........oouuuccccccuuuoo......',
  '......oouuuuuucccuuuuuuuoo....',
  '.....ouuuuuuuuucuuuuuuuuuuo...',
  '....ouuuuuuuuuuuuuuuuuuyyyuo..',
  '....oUuuuuuuuuuuuuuuuuuyyyUo..',
  '...oUuuuuuuuuuuuuuuuuuuuuuUUo.',
  '...oUUuuuuuuuuuuuuuuuuuuuUUUo.',
  '...oooooooooooooooooooooooooo.',
];

// When the bomb goes off she shouts.
const PILOT_SHOUT: Sprite = PILOT.map((row, y) => (y === 20 ? `${row.slice(0, 13)}mm${row.slice(15)}` : row));

const PILOT_PALETTE: Palette = {
  o: '#1a1028',
  h: '#e8763a',
  H: '#ffb070',
  d: '#a84a2a',
  q: '#f0f0f8',
  Q: '#7a7a9a',
  g: '#5ad8ff',
  G: '#ffffff',
  s: '#ffe2cc',
  S: '#f0b8a0',
  b: '#ff9a9a',
  e: '#2a1840',
  i: '#3ab88a',
  I: '#8af0c0',
  w: '#ffffff',
  m: '#c04a5a',
  u: '#2c3c8c',
  U: '#1a2458',
  c: '#f0f0f8',
  y: '#ffd04a',
};

const PILOT_GIRL: Girl = {
  eyes: [
    { x: 7, y: 13, out: -1, w: 5, h: 5 },
    { x: 17, y: 13, out: 1, w: 5, h: 5 },
  ],
  seed: 81,
};

const shipPalette = (c: Colors<K>): Palette => ({ o: c.ink, h: c.ship, W: c.white, c: c.canopy, r: c.stripe });
const bulletAPalette = (c: Colors<K>): Palette => ({ a: c.ink, b: c.bulletA, w: c.white });
const bulletBPalette = (c: Colors<K>): Palette => ({ a: c.ink, b: c.bulletB, w: c.white });

// ---- layout: a 3:4 playfield between side panels on wide screens, the whole screen with a HUD strip on tall ones ----

type Field = {
  readonly x: number;
  readonly w: number;
  readonly h: number;
  readonly panels: boolean;
  /** Height of the HUD strip across the top of the field (none when the panels carry it). */
  readonly hud: number;
};

const fieldOf = (f: Frame): Field => {
  const w = Math.round(f.h * 0.78);
  if (f.w - w >= 110) return { x: Math.round((f.w - w) / 2), w, h: f.h, panels: true, hud: 0 };
  return { x: 0, w: f.w, h: f.h, panels: false, hud: 11 };
};

/** Bullet speed in pixels per beat: a curtain takes about the same number of beats to fall on any screen. */
const speedOf = (fl: Field): number => fl.h * 0.1;

// The boss and the fighter move as functions of the beat, so every bullet and shot can be traced back to where it left.
const bossAt = (fl: Field, beat: number): Pt => [
  Math.round(fl.x + fl.w / 2 + Math.sin((beat * Math.PI) / 16) * fl.w * 0.05),
  Math.round(fl.hud + 22 + Math.sin((beat * Math.PI) / 4) * 2),
];
const coreOf = (fl: Field, beat: number): Pt => {
  const [x, y] = bossAt(fl, beat);
  return [x, y + 22];
};
const shipAt = (fl: Field, beat: number): Pt => [
  Math.round(fl.x + fl.w / 2 + Math.sin((beat * Math.PI) / 6) * fl.w * 0.27 + Math.sin(beat * 1.3) * fl.w * 0.05),
  Math.round(fl.h - (fl.panels ? 26 : 40) + Math.sin((beat * Math.PI) / 10) * 8),
];

// ---- the backdrop: a fixed gradient, two cloud (or nebula) layers and stars scrolling down at different speeds ----

const TILE_H = 160;

const cloudTile = (fl: Field, c: Colors<K>, seed: number, cover: number): HTMLCanvasElement =>
  memoCanvas(`curtain-cloud:${fl.w}:${seed}:${cover}:${c.cloud}${c.cloudHi}`, fl.w, TILE_H, (img) => {
    const lo = hexToRgb(c.cloud);
    const hi = hexToRgb(c.cloudHi);
    for (let y = 0; y < TILE_H; y++)
      for (let x = 0; x < fl.w; x++) {
        // Noise sampled with y first, because fractal2 wraps along its first axis: the tile repeats seamlessly downward.
        const v = fractal2(y / 20, x / 26, seed, TILE_H / 20) - cover;
        if (v < bayer(x, y) * 0.08) continue;
        const rgb = v > 0.12 + bayer(x, y) * 0.06 ? hi : lo;
        const o = (y * img.width + x) * 4;
        img.data.set([rgb[0], rgb[1], rgb[2], 255], o);
      }
  });

const scrollStars = (ctx: Ctx, f: Frame, fl: Field, c: Colors<K>): void => {
  for (let i = 0; i < 40; i++) {
    const near = i % 3 === 0;
    const y = Math.round(wrap(rand(i, 41) * fl.h + f.t * (near ? 46 : 18), fl.h));
    const x = fl.x + Math.floor(rand(i, 42) * fl.w);
    fillRect(ctx, near ? c.star : c.cloudHi, x, y, 1, near ? 2 : 1);
  }
};

const backdrop = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const fl = fieldOf(f);
  ctx.drawImage(ditherGradient(fl.w, fl.h, [c.space0, c.space1, c.space2]), fl.x, 0);
  tileDown(ctx, cloudTile(fl, c, 3, 0.54), f.t * 12, fl.x, 0, fl.h);
  scrollStars(ctx, f, fl, c);
  tileDown(ctx, cloudTile(fl, c, 9, 0.62), f.t * 34, fl.x, 0, fl.h);
};

// ---- the boss: hull and wings from mirrored polygons, cached; the core and the wing eyes glow live ----

const UPPER_WING: readonly Pt[] = [
  [4, 8],
  [26, 0],
  [44, -2],
  [48, 4],
  [44, 14],
  [32, 22],
  [16, 24],
  [4, 20],
];
const LOWER_WING: readonly Pt[] = [
  [4, 24],
  [20, 26],
  [33, 32],
  [36, 41],
  [28, 46],
  [15, 40],
  [4, 34],
];
const HULL: readonly Pt[] = [
  [0, -4],
  [6, 2],
  [8, 16],
  [7, 34],
  [3, 46],
  [0, 50],
  [-3, 46],
  [-7, 34],
  [-8, 16],
  [-6, 2],
];

// The boss layer's size and where the boss's own origin (the top of its hull) sits in it.
const BOSS_W = 101;
const BOSS_H = 64;
const OX = 50;
const OY = 12;

const placed = (poly: readonly Pt[], side: 1 | -1, dx = 0, dy = 0): Pt[] => poly.map(([x, y]) => [OX + side * x + dx, OY + y + dy]);

const AROUND: readonly Pt[] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

const paintOutline = (g: Ctx, c: Colors<K>): void => {
  for (const [dx, dy] of AROUND)
    for (const side of [1, -1] as const) {
      fillPolygon(g, placed(UPPER_WING, side, dx, dy), c.ink);
      fillPolygon(g, placed(LOWER_WING, side, dx, dy), c.ink);
      fillPolygon(g, placed(HULL, side, dx, dy), c.ink);
    }
};

// Veins fan out from the wing root to the rim, and the leading edge catches the light.
const paintWing = (g: Ctx, side: 1 | -1, c: Colors<K>): void => {
  fillPolygon(g, placed(UPPER_WING, side), c.wing);
  fillPolygon(g, placed(LOWER_WING, side), c.wing);
  const x = (u: number): number => OX + side * u;
  for (const [tx, ty] of [
    [44, 2],
    [44, 12],
    [30, 21],
  ] as const)
    pixelLine(g, x(6), OY + 12, x(tx), OY + ty, c.wingHi);
  for (const [tx, ty] of [
    [32, 36],
    [24, 43],
  ] as const)
    pixelLine(g, x(6), OY + 28, x(tx), OY + ty, c.wingHi);
  pixelLine(g, x(5), OY + 7, x(26), OY + 0, c.white);
  pixelLine(g, x(26), OY + 0, x(44), OY - 2, c.wingHi);
};

const paintHull = (g: Ctx, c: Colors<K>): void => {
  fillPolygon(g, placed(HULL, 1), c.hullLo);
  fillPolygon(
    g,
    HULL.map(([x, y]) => [OX + x * 0.7 - 2, OY + y] as Pt),
    c.hull,
  );
  fillRect(g, c.hullHi, OX - 2, OY + 2, 1, 40);
  for (let y = 8; y < 46; y += 7) fillRect(g, c.hullLo, OX - 6, OY + y, 13, 1);
  disc(g, OX, OY + 22, 7, () => c.ink);
};

const paintFittings = (g: Ctx, side: 1 | -1, c: Colors<K>): void => {
  const x = (u: number): number => OX + side * u;
  pixelLine(g, x(3), OY - 2, x(9), OY - 10, c.hullHi);
  fillRect(g, c.coreHi, x(9), OY - 11, 1, 1);
  fillRect(g, c.ink, x(46) - 1, OY + 3, 3, 8);
  fillRect(g, c.hullLo, x(46) - 1, OY + 3, 3, 6);
  fillRect(g, c.ink, x(32) - 1, OY + 42, 3, 7);
  fillRect(g, c.hullLo, x(32) - 1, OY + 42, 3, 5);
  disc(g, x(26), OY + 9, 5, () => c.ink);
  disc(g, x(26), OY + 9, 4, () => c.hullLo);
  fillRect(g, c.coreHi, x(2), OY + 4, 1, 1);
};

const bossLayer = (c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`curtain-boss:${sigOf(c)}`, BOSS_W, BOSS_H, (g) => {
    paintOutline(g, c);
    for (const side of [1, -1] as const) paintWing(g, side, c);
    paintHull(g, c);
    for (const side of [1, -1] as const) paintFittings(g, side, c);
  });

const boss = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const fl = fieldOf(f);
  const [bx, by] = bossAt(fl, f.beat);
  const pulse = 0.5 + 0.5 * Math.max(f.kick, 1 - frac(f.beat) * 2);
  // Three glow sizes only: each size is a cached canvas, and a new one every frame would churn the shared cache.
  const swell = Math.round(pulse * 2);
  drawGlow(ctx, c.core, bx, by + 22, 16 + swell * 3, 12 + swell * 2, 0.65, 4);
  ctx.drawImage(bossLayer(c), bx - OX, by - OY);
  for (const side of [1, -1]) {
    disc(ctx, bx + side * 26, by + 9, 3, (dy) => (dy < 0 ? c.core : c.wingHi));
    fillRect(ctx, c.white, bx + side * 26 - 1, by + 8, 2, 1);
  }
  disc(ctx, bx, by + 22, 5 + Math.round(pulse), () => c.core);
  disc(ctx, bx, by + 22, 3, () => c.coreHi);
  fillRect(ctx, c.white, bx - 2, by + 20, 2, 2);
};

// ---- bullet curtains: a ring of bullets leaves the core four times a beat; its shape follows the 2-bar pattern ----

const RATE = 4;
const BOMB_EVERY = 32;
const BOMB_AT = 16;
const BOMB_SPEED = 220;

/** The latest bomb at or before this beat. */
const lastBomb = (beat: number): number => Math.floor((beat - BOMB_AT) / BOMB_EVERY) * BOMB_EVERY + BOMB_AT;

type Kind = 0 | 1 | 2 | 3;
/** How bullets are drawn: by kind (0 and 1 the two colors, 2 a big orb, 3 a needle), or as a sparkle once a bomb clears them. */
type Ink = { readonly draw: (x: number, y: number, kind: Kind) => void; readonly sparkle: (x: number, y: number) => void };

// A twin spiral (two counter-rotating arms), a five-petal bloom on the whole beats, and a pinwheel whose arms curl.
const spiral = (j: number, age: number, v: number, each: (a: number, r: number, kind: Kind) => void): void => {
  if (j % 2 !== 0) return;
  for (let i = 0; i < 16; i++) {
    const arm = i % 2 === 0 ? 1 : -1;
    each((Math.PI * 2 * Math.floor(i / 2)) / 8 + arm * j * 0.11, v * age, arm > 0 ? 0 : 1);
  }
};
const bloom = (j: number, age: number, v: number, each: (a: number, r: number, kind: Kind) => void): void => {
  if (j % RATE !== 0) return;
  for (let i = 0; i < 30; i++) {
    const a = (Math.PI * 2 * i) / 30;
    each(a + j * 0.02, v * age * (0.8 + 0.24 * Math.cos(a * 5)), i % 3 === 0 ? 2 : 1);
  }
};
const pinwheel = (j: number, age: number, v: number, each: (a: number, r: number, kind: Kind) => void): void => {
  if (j % 2 !== 0) return;
  const turn = j % 4 === 0 ? 1 : -1;
  for (let i = 0; i < 8; i++) each((Math.PI * 2 * i) / 8 + (j % 4) * 0.2 + turn * age * 0.18, v * age * 1.05, turn > 0 ? 0 : 1);
};
const PATTERNS = [spiral, bloom, pinwheel] as const;

// After a bomb goes off, older bullets vanish as its ring sweeps over them, leaving a brief sparkle.
const clearedAge = (fl: Field, beat: number, e: number, x: number, y: number): number => {
  const b = lastBomb(beat);
  if (e >= b) return Number.NEGATIVE_INFINITY;
  const [sx, sy] = shipAt(fl, b);
  return beat - (b + Math.hypot(x - sx, y - sy) / BOMB_SPEED);
};

// A bullet fired at beat e, now at (x, y): drawn while on the field, unless a bomb has swept it away.
const place = (fl: Field, beat: number, e: number, x: number, y: number, kind: Kind, ink: Ink): void => {
  if (x < fl.x - 4 || x > fl.x + fl.w + 4 || y < -4 || y > fl.h + 4) return;
  const cleared = clearedAge(fl, beat, e, x, y);
  if (cleared < 0) ink.draw(Math.round(x), Math.round(y), kind);
  else if (cleared < 0.3) ink.sparkle(Math.round(x), Math.round(y));
};

const ring = (fl: Field, beat: number, j: number, ink: Ink): void => {
  const e = j / RATE;
  if (e - lastBomb(e) < 2) return;
  const [ox, oy] = coreOf(fl, e);
  const pattern = PATTERNS[Math.floor(e / 8) % PATTERNS.length] ?? spiral;
  pattern(j, beat - e, speedOf(fl), (a, r, kind) => place(fl, beat, e, ox + Math.cos(a) * r, oy + Math.sin(a) * r, kind, ink));
};

// Every other bar the wing cannons also fire needles at where the fighter was, which it has always just left.
const needles = (fl: Field, beat: number, j: number, ink: Ink): void => {
  const e = j / RATE;
  if (Math.floor(e / 4) % 2 === 1 || e - lastBomb(e) < 2) return;
  const [bx, by] = bossAt(fl, e);
  const [sx, sy] = shipAt(fl, e);
  const r = speedOf(fl) * 1.7 * (beat - e);
  for (const side of [-1, 1]) {
    const ox = bx + side * 46;
    const oy = by + 12;
    const a = Math.atan2(sy - oy, sx - ox);
    place(fl, beat, e, ox + Math.cos(a) * r, oy + Math.sin(a) * r, 3, ink);
  }
};

const bullets = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const fl = fieldOf(f);
  const life = Math.ceil((Math.hypot(fl.w, fl.h) / speedOf(fl)) * RATE) + 1;
  const now = Math.floor(f.beat * RATE);
  const a = paletteOf(c, bulletAPalette);
  const b = paletteOf(c, bulletBPalette);
  const ink: Ink = {
    draw: (x, y, kind) => {
      if (kind === 3) drawSprite(ctx, NEEDLE, a, x - 1, y - 3);
      else if (kind === 2) drawSprite(ctx, ORB_BIG, b, x - 4, y - 4);
      else drawSprite(ctx, ORB, kind === 0 ? a : b, x - 3, y - 3);
    },
    sparkle: (x, y) => {
      fillRect(ctx, c.white, x - 1, y, 3, 1);
      fillRect(ctx, c.white, x, y - 1, 1, 3);
    },
  };
  for (let k = 0; k <= life; k++) {
    ring(fl, f.beat, now - k, ink);
    needles(fl, f.beat, now - k, ink);
  }
};

// ---- the fighter: a stream of twin shots up into the boss, engine flicker, sparks where the shots land ----

const shots = (ctx: Ctx, f: Frame, fl: Field, c: Colors<K>): void => {
  const [bx, by] = bossAt(fl, f.beat);
  const now = Math.floor(f.beat * 8);
  for (let k = 0; k < 10; k++) {
    const e = (now - k) / 8;
    const [sx, sy] = shipAt(fl, e);
    const y = sy - 8 - (f.beat - e) * 260;
    const stop = Math.abs(sx - bx) < 34 ? by + 40 : -10;
    if (y < stop) continue;
    for (const dx of [-4, 3]) {
      fillRect(ctx, c.flame, sx + dx, y, 2, 7);
      fillRect(ctx, c.white, sx + dx, y + 1, 2, 4);
    }
  }
};

const hitSparks = (ctx: Ctx, f: Frame, fl: Field, c: Colors<K>): void => {
  const [bx, by] = bossAt(fl, f.beat);
  const [sx] = shipAt(fl, f.beat);
  if (Math.abs(sx - bx) >= 34) return;
  const step = Math.floor(f.t * 20);
  for (let i = 0; i < 3; i++) {
    const x = sx + Math.round((rand(step, i) - 0.5) * 10);
    const y = by + 38 + Math.round(rand(step, i + 9) * 6);
    fillRect(ctx, i === 0 ? c.white : c.flame, x - 1, y, 3, 1);
    fillRect(ctx, i === 0 ? c.white : c.flame, x, y - 1, 1, 3);
  }
};

const fighter = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const fl = fieldOf(f);
  shots(ctx, f, fl, c);
  hitSparks(ctx, f, fl, c);
  const [sx, sy] = shipAt(fl, f.beat);
  const flick = Math.floor(f.t * 24) % 2;
  fillRect(ctx, c.flame, sx - 3, sy + 5, 1, 2 + flick);
  fillRect(ctx, c.flame, sx + 3, sy + 5, 1, 3 - flick);
  fillRect(ctx, c.white, sx, sy + 5, 1, 2 + flick);
  drawSprite(ctx, SHIP, paletteOf(c, shipPalette), sx - 5, sy - 5);
  // The hitbox: the genre's tiny glowing dot at the heart of the ship.
  fillRect(ctx, f.t % 0.5 < 0.25 ? c.white : c.bulletA, sx, sy + 1, 1, 1);
};

// ---- the bomb: a white flash and a ring sweeping out from the fighter, sized by the kick that lands with it ----

const ringSpans = (ctx: Ctx, fl: Field, cx: number, cy: number, r: number, color: string): void => {
  ctx.fillStyle = color;
  const inner = Math.max(0, r - 3);
  for (let y = Math.max(0, Math.round(cy - r)); y <= Math.min(fl.h, Math.round(cy + r)); y++) {
    const dy = y - cy;
    const outer = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)));
    const hole = Math.abs(dy) < inner ? Math.floor(Math.sqrt(inner * inner - dy * dy)) : 0;
    ctx.fillRect(Math.round(cx - outer), y, outer - hole, 1);
    ctx.fillRect(Math.round(cx + hole), y, outer - hole, 1);
  }
};

const bomb = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const fl = fieldOf(f);
  const b = lastBomb(f.beat);
  const age = f.beat - b;
  if (age < 0 || age > 1.6) return;
  const [sx, sy] = shipAt(fl, b);
  const r = Math.round(age * BOMB_SPEED);
  if (r < fl.h * 1.6) ringSpans(ctx, fl, sx, sy, r, c.white);
  fillDither(ctx, c.white, Math.max(0, 0.8 - age * 1.6) * (0.6 + 0.4 * f.kick), fl.x, 0, fl.w, fl.h);
};

// ---- the HUD ----

const scoreOf = (beat: number): number => 1_200_000 + Math.floor(Math.max(0, beat) * 1370) * 10;
const hiOf = (beat: number): number => Math.max(5_000_000, scoreOf(beat));

const icons = (ctx: Ctx, sprite: Sprite, palette: Palette, x: number, y: number, n: number, step: number): void => {
  for (let i = 0; i < n; i++) drawSprite(ctx, sprite, palette, x + i * step, y);
};

const bossGauge = (ctx: Ctx, f: Frame, fl: Field, c: Colors<K>): void => {
  const y = fl.hud + 3;
  fillDither(ctx, c.panelLo, 0.75, fl.x, fl.hud, fl.w, 10);
  drawText(ctx, 'BOSS', fl.x + 3, y - 1, c.label);
  const level = 1 - frac((f.beat - BOMB_AT) / BOMB_EVERY) * 0.92;
  gauge(ctx, fl.x + 29, y + 1, fl.w - 33, 3, level, { frame: c.ink, back: c.panelLo, fill: c.core, hi: c.coreHi, lost: c.panelHi });
};

const stripHud = (ctx: Ctx, f: Frame, fl: Field, c: Colors<K>): void => {
  fillRect(ctx, c.panelLo, 0, 0, fl.w, fl.hud);
  fillRect(ctx, c.panelHi, 0, fl.hud, fl.w, 1);
  drawText(ctx, '1P', 3, 2, c.label);
  drawText(ctx, digits(scoreOf(f.beat), 9), 17, 2, c.text);
  const hi = digits(hiOf(f.beat), 9);
  drawText(ctx, hi, fl.w - 3 - textWidth(hi), 2, c.text);
  icons(ctx, SHIP, paletteOf(c, shipPalette), 3, fl.h - 14, 2, 13);
  icons(ctx, STAR_ICON, paletteOf(c, bulletAPalette), fl.w - 25, fl.h - 9, 3, 7);
};

const panelLayer = (f: Frame, fl: Field, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`curtain-panel:${f.w}x${f.h}:${sigOf(c)}`, f.w, f.h, (g) => {
    const right = fl.x + fl.w;
    g.drawImage(ditherGradient(fl.x, f.h, [c.panel, c.panelLo]), 0, 0);
    g.drawImage(ditherGradient(f.w - right, f.h, [c.panel, c.panelLo]), right, 0);
    for (const x of [fl.x - 3, right + 2]) fillRect(g, c.panelHi, x, 0, 1, f.h);
    for (const x of [fl.x - 2, right]) fillRect(g, c.ink, x, 0, 2, f.h);
    for (let y = 6; y < f.h; y += 12) {
      fillRect(g, c.panelHi, fl.x - 7, y, 2, 2);
      fillRect(g, c.panelHi, right + 5, y, 2, 2);
    }
  });

const labelled = (ctx: Ctx, cx: number, y: number, label: string, value: string, c: Colors<K>): void => {
  drawText(ctx, label, Math.round(cx - textWidth(label) / 2), y, c.label);
  drawText(ctx, value, Math.round(cx - textWidth(value) / 2), y + 10, c.text);
};

// The pilot's portrait in a little window, shouting while her bomb goes off.
const portrait = (ctx: Ctx, f: Frame, cx: number, y: number, c: Colors<K>): void => {
  const x = Math.round(cx - 17);
  fillRect(ctx, c.panelHi, x - 1, y - 1, 36, 38);
  fillRect(ctx, c.ink, x, y, 34, 36);
  ctx.drawImage(ditherGradient(32, 34, [c.panelLo, c.panel]), x + 1, y + 1);
  const shout = f.beat - lastBomb(f.beat) < 1.5;
  const bob = !shout && frac(f.beat) < 0.2 ? 1 : 0;
  drawGirl(ctx, f, shout ? PILOT_SHOUT : PILOT, PILOT_PALETTE, x + 2, y + 2 + bob, PILOT_GIRL);
  fillRect(ctx, c.ink, x, y + 35, 34, 1);
  const name = shout ? 'BOMB!' : 'LARK';
  drawText(ctx, name, Math.round(cx - textWidth(name) / 2), y + 40, shout ? c.label : c.text);
};

// Eight cells of shot power, the last one blinking when full.
const powerMeter = (ctx: Ctx, f: Frame, cx: number, y: number, c: Colors<K>): void => {
  drawText(ctx, 'POWER', Math.round(cx - 14), y, c.label);
  const lit = 5 + Math.floor(frac(f.beat / 64) * 4);
  for (let i = 0; i < 8; i++) {
    const on = i < lit && (i < 7 || frac(f.t * 2) < 0.6);
    fillRect(ctx, c.ink, Math.round(cx - 24) + i * 6, y + 10, 5, 7);
    fillRect(ctx, on ? c.flame : c.panelLo, Math.round(cx - 23) + i * 6, y + 11, 3, 5);
  }
};

const sidePanels = (ctx: Ctx, f: Frame, fl: Field, c: Colors<K>): void => {
  ctx.drawImage(panelLayer(f, fl, c), 0, 0);
  const left = (fl.x - 8) / 2;
  const right = fl.x + fl.w + (f.w - fl.x - fl.w + 8) / 2;
  labelled(ctx, left, 12, 'HI-SCORE', digits(hiOf(f.beat), 9), c);
  labelled(ctx, left, 40, '1P SCORE', digits(scoreOf(f.beat), 9), c);
  drawText(ctx, 'PLAYER', Math.round(left - 17), 72, c.label);
  icons(ctx, SHIP, paletteOf(c, shipPalette), Math.round(left - 12), 83, 2, 13);
  drawText(ctx, 'BOMB', Math.round(left - 11), 104, c.label);
  icons(ctx, STAR_ICON, paletteOf(c, bulletAPalette), Math.round(left - 10), 114, 3, 7);
  powerMeter(ctx, f, left, 134, c);
  labelled(ctx, right, 12, 'STAGE', '5', c);
  labelled(ctx, right, 40, 'GRAZE', digits(Math.max(0, f.beat) * 7, 5), c);
  portrait(ctx, f, right, 72, c);
  if (frac(f.t * 0.8) < 0.6) drawText(ctx, 'CREDIT 3', Math.round(right - 23), f.h - 14, c.label);
};

const hud = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const fl = fieldOf(f);
  bossGauge(ctx, f, fl, c);
  if (fl.panels) sidePanels(ctx, f, fl, c);
  else stripHud(ctx, f, fl, c);
};

export const bulletCurtain = defineScene<K>({
  id: 'bullet-curtain',
  title: 'Bullet Curtain',
  mood: { valence: 0, energy: 0.85 },
  styles: ['star-fighter', 'boss-rush', 'neon-rush', 'trance-pop'],
  variants: [
    {
      mood: { valence: 0, energy: 0.85 },
      colors: {
        space0: '#06061a',
        space1: '#161040',
        space2: '#2c1450',
        cloud: '#2a1c5a',
        cloudHi: '#4a2c78',
        star: '#ffffff',
        panel: '#1c1c3a',
        panelHi: '#5a5a9a',
        panelLo: '#08081a',
        label: '#ffd04a',
        text: '#ffffff',
        ink: '#0a0614',
        hull: '#6a6a92',
        hullHi: '#c8c8f0',
        hullLo: '#34345a',
        wing: '#3a6aa8',
        wingHi: '#8ad0ff',
        core: '#ff3a6a',
        coreHi: '#ffd0dc',
        ship: '#e8ecff',
        canopy: '#3ad0ff',
        stripe: '#ff4a5a',
        flame: '#ffb03a',
        bulletA: '#ff4aa0',
        bulletB: '#3ad8ff',
        white: '#ffffff',
      },
    },
    {
      mood: { valence: 0.6, energy: 0.6 },
      colors: {
        space0: '#3a3a8a',
        space1: '#b05a8a',
        space2: '#ffb070',
        cloud: '#d47a92',
        cloudHi: '#f2a8a0',
        star: '#fff4d8',
        panel: '#2a2a5a',
        panelHi: '#8a7ac8',
        panelLo: '#141432',
        label: '#ffe07a',
        text: '#ffffff',
        ink: '#1a1030',
        hull: '#7a7aa0',
        hullHi: '#e0e0ff',
        hullLo: '#42426a',
        wing: '#4a8ac0',
        wingHi: '#b0eaff',
        core: '#ff4a7a',
        coreHi: '#ffe0e8',
        ship: '#ffffff',
        canopy: '#4ac0ff',
        stripe: '#ff5a4a',
        flame: '#ffd04a',
        bulletA: '#7a4aff',
        bulletB: '#2a7aff',
        white: '#ffffff',
      },
    },
    {
      mood: { valence: -0.6, energy: 0.9 },
      colors: {
        space0: '#0a0206',
        space1: '#24060e',
        space2: '#4a0c14',
        cloud: '#3a0a12',
        cloudHi: '#6a1a1a',
        star: '#ffd0a0',
        panel: '#2a0a10',
        panelHi: '#8a3a2a',
        panelLo: '#0e0206',
        label: '#ffb03a',
        text: '#fff0e0',
        ink: '#0a0204',
        hull: '#5a4a4a',
        hullHi: '#b8a090',
        hullLo: '#2a1a1e',
        wing: '#6a1a3a',
        wingHi: '#d04a6a',
        core: '#ffd02a',
        coreHi: '#fff8c0',
        ship: '#e0e8ff',
        canopy: '#4affb0',
        stripe: '#3a8aff',
        flame: '#ff8a2a',
        bulletA: '#ffd82a',
        bulletB: '#4aff9a',
        white: '#ffffff',
      },
    },
  ],
  layers: [backdrop, bullets, boss, fighter, bomb, hud],
});
