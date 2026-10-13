// A witch girl flies a late-night ramen delivery over a neon city: her crimson twin tails and cape stream in the wind,
// the lacquered carrying box swings from her broom trailing steam, and her little bat helper flaps along with chopsticks.
import { type Ctx, drawSprite, fillRect, flipped, type Palette, type Sprite } from 'mojipx';
import { bayer, ditherGradient, frac, hexToRgb, memoCanvas, memoLayer, pixelLine, rand, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { ditherStyle, driftingClouds, spanDisc } from './batch-1-helpers.ts';
import { drawGlow, moon, tileX, wrap } from './batch-2-helpers.ts';
import { paletteOf, recentBeats } from './batch-3-helpers.ts';
import { glints, rain, twinkle } from './batch-6-helpers.ts';
import { alternate, drawGirl, type Girl, limb, onBeat, wide } from './batch-7-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'moon'
  | 'moonSea'
  | 'haze'
  | 'far'
  | 'near'
  | 'window'
  | 'neonA'
  | 'neonB'
  | 'neonC'
  | 'rain'
  | 'ink'
  | 'skin'
  | 'skinLo'
  | 'blush'
  | 'hair'
  | 'hairHi'
  | 'hairLo'
  | 'teal'
  | 'tealHi'
  | 'tealLo'
  | 'gold'
  | 'white'
  | 'whiteLo'
  | 'plum'
  | 'plumLo'
  | 'navy'
  | 'red'
  | 'wood'
  | 'woodHi';

// ---- the girl: o outline, s/S skin, b blush, h/H/d hair, e/E/i eyes, w glint, m mouth ----

const HEAD: Sprite = [
  '....oooooooooooooooo....',
  '..oohhhhhhhhhhhhhhhhoo..',
  '.ohhhhHHHHhhhhhhhhhhhho.',
  'ohhhHHhhhhhhhhhhHHHhhhho',
  'ohhhhhhhhhhhhhhhhhhhhhho',
  'ohhhhhhdhhhhhhhdhhhhhhho',
  'ohhhhhdShhhhhhdSdhhhhhho',
  'ohhhhdSsShhhhdSsSdhhdhho',
  'ohhhdSsssShhdSsssSddSdho',
  'ohhdSssssssdSssssssSSdho',
  'ohdssoooossssssoooossdho',
  'ohdsssweessssssweesssdho',
  'ohdssseEesssssseEesssdho',
  'ohdsssEiEssssssEiEsssdho',
  'ohdssbbbssssssssbbbssdho',
  'ohdsssssssmssmsssssssdho',
  'ohhoSssssssmmssssssSohho',
  'oho.oSssssssssssssSo.oho',
  '.o...ooSssssssssSoo...o.',
  '.......oooooooooo.......',
];

// t/T/k hat, g band, G glint.
const HAT: Sprite = [
  '....oooooo............................',
  '...okttTTtoo..........................',
  '..oko..okttTTo........................',
  '..oo....okttTTo.......................',
  '.........okkttTTo.....................',
  '.........okkttttTo....................',
  '..........okkttttTTo..................',
  '..........okkkttttTTo.................',
  '...........okkkttttTTTo...............',
  '...........okkkkttttTTTo..............',
  '..........ogggggggggggggGo............',
  '......ooooTTTTTTTTTTTTTTTToooo........',
  '..ootttttttTTTTTTTTTTTTtttttttttoo....',
  'okttttttttttttttttttttttttttttttttko..',
  'okkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkko..',
  '.oooooooooooooooooooooooooooooooooo...',
];

// u/U blouse and petticoat, C cape lining and belt, g brooch and buckle, n pleated skirt.
const BODY: Sprite = [
  '.............oSSo.............',
  '.........oCCuugguuCCo.........',
  '......oouoCuuuuuuuuCouoo......',
  '.....ouuUoCuuuuuuuuCoUuuo.....',
  '.....ouUUoCuUuuuuUuCoUUuo.....',
  '......ooooCuUuuuuUuCoooo......',
  '.........oCuuuuuuuuCo.........',
  '.........oCuUuuuuUuCo.........',
  '.........oCCCCggCCCCo.........',
  '........onnnnnnnnnnnno........',
  '.......onnnonnnnnonnnno.......',
  '......onnnnonnnnnonnnnno......',
  '.....onnnnnonnnnnnonnnnno.....',
  '....onnnnnnonnnnnnonnnnnno....',
  '....ouuuuuuuuuuuuuuuuuuuuo....',
  '....oUuUuUuUuUuUuUuUuUuUuo....',
  '.....oooooooooooooooooooo.....',
];

// Striped stockings (u, z) and boots (f, F); a leg hangs straight or swings forward.
const LEG_DOWN: Sprite = [
  'ouuo......',
  'ozzo......',
  'ouuo......',
  'ozzo......',
  'ouuo......',
  'ozzo......',
  'ouuo......',
  'offfo.....',
  'offffo....',
  'offFFFo...',
  '.ooooo....',
];
const LEG_KICK: Sprite = [
  'ouuo......',
  'ozzo......',
  '.ouuo.....',
  '.ozzo.....',
  '..ouuo....',
  '..ozzo....',
  '...ouuo...',
  '...offfo..',
  '...offffo.',
  '...offFFFo',
  '....ooooo.',
];

const V_HAND: Sprite = ['.o...o.', 'oso.oso', '.os.so.', '.ossso.', '.ossso.', '..ooo..'];
const FIST: Sprite = ['.oo.', 'osso', 'osSo', '.oo.'];
// A paper lantern hung from the tip of the broom: o caps, r red paper ribs, l lit paper, y flame.
const LANTERN: Sprite = ['.ooooo.', 'orrrrro', 'rlllllr', 'rrrrrrr', 'rllylll', 'rrrrrrr', 'rlllllr', 'orrrrro', '.ooooo.'];
const STAR_CHARM: Sprite = ['..g..', '.ggg.', 'ggGgg', '.ggg.', '.g.g.'];

const GIRL: Girl = {
  eyes: [
    { x: 6, y: 10, out: -1 },
    { x: 15, y: 10, out: 1 },
  ],
  seed: 113,
};

// The carrying box hangs from the broom by its arched handle: o outline, k black lacquer, K its glint, r/R red
// lacquer, w glint, and a bowl of noodles (w bowl, g noodles) with chopsticks painted on its side.
const BOX: Sprite = [
  '.....oooooooo.....',
  '....oo......oo....',
  '....o........o....',
  '....o........o....',
  '....o........o....',
  'oooooooooooooooooo',
  'okKKkkkkkkkkkkkkko',
  'okkkkkkkkkkkkkkkko',
  'oooooooooooooooooo',
  'okrrrrrrrrrrrrrRko',
  'okwrrrrrrrrrkkrRko',
  'okwrrrrrrrrkkrrRko',
  'okrrwwwwwwkwwwrRko',
  'okrrwggggggggwrRko',
  'okrrrwwwwwwwwrrRko',
  'okrrrrwwwwwwrrrRko',
  'okrrrrrwwwwrrrrRko',
  'okrrrrrrrrrrrrrRko',
  'oooooooooooooooooo',
  'okKkkkkkkkkkkkkkko',
  'oooooooooooooooooo',
  'okwrrrrrrrrrrrrRko',
  'okrrrrrrrrrrrrrRko',
  'oooooooooooooooooo',
];

// The bat: o outline, b fur, p pink, w white, e eyes; c wing membrane.
const BAT: Sprite = [
  '.o..........o.',
  'obo........obo',
  'opbo......obpo',
  'opbboooooobbpo',
  'obbbbbbbbbbbbo',
  'obbwebbbbwebbo',
  'obbeebbbbeebbo',
  'obpeebbbbeepbo',
  'obbbbboobbbbbo',
  '.obbbwbbwbbbo.',
  '..obbbbbbbbo..',
  '...oooooooo...',
  '....o.o..o.o..',
];
const WING_UP: Sprite = [
  '.......ooo',
  '......occo',
  '.....occco',
  '....occcco',
  '...occccco',
  '..occcccco',
  '.occoccoco',
  'occo.oo.o.',
  'oo........',
];
const WING_DOWN: Sprite = ['oooo......', 'occcoooo..', 'occcccccoo', 'occcccccco', '.occcoccco', '..oco.oco.', '...o...o..'];

const BAT_CAP: Sprite = ['.oooo...', 'ottTTo..', 'oooooooo'];
// The order slip: w paper, b lines, r a red stamp.
const SLIP: Sprite = ['ooooo', 'owwwo', 'obbwo', 'owwwo', 'obbbo', 'owwro', 'ooooo'];
const WINGS_UP: readonly [Sprite, Sprite] = [WING_UP, flipped(WING_UP)];
const WINGS_DOWN: readonly [Sprite, Sprite] = [WING_DOWN, flipped(WING_DOWN)];

// Neon signs on the rooftops, all invented: a steaming bowl, a star and a wave.
const SIGNS: readonly Sprite[] = [
  ['..n.n.n....', '...n.n.n...', 'nnnnnnnnnnn', 'n.........n', '.n.......n.', '..nnnnnnn..', '....nnn....'],
  ['....n....', '...n.n...', 'nnnn.nnnn', '.n.....n.', '..n...n..', '.n..n..n.', 'n.n...n.n'],
  ['.nn....nn....', 'n..n..n..n..n', '....nn....nn.', '.............', '.nn....nn....', 'n..n..n..n..n'],
];

const girlPalette = (c: Colors<K>): Palette => ({
  o: c.ink,
  s: c.skin,
  S: c.skinLo,
  b: c.blush,
  h: c.hair,
  H: c.hairHi,
  d: c.hairLo,
  e: c.ink,
  E: c.teal,
  i: c.tealHi,
  w: c.white,
  m: c.hairLo,
  t: c.teal,
  T: c.tealHi,
  k: c.tealLo,
  g: c.gold,
  G: c.white,
  u: c.white,
  U: c.whiteLo,
  C: c.teal,
  n: c.navy,
  z: c.teal,
  f: c.wood,
  F: c.woodHi,
});
const boxPalette = (c: Colors<K>): Palette => ({
  o: c.ink,
  k: c.near,
  K: c.whiteLo,
  r: c.red,
  R: c.hairLo,
  w: c.white,
  g: c.gold,
});
const batPalette = (c: Colors<K>): Palette => ({
  o: c.ink,
  b: c.whiteLo,
  p: c.blush,
  w: c.white,
  e: c.ink,
  c: c.plum,
  t: c.teal,
  T: c.tealHi,
  r: c.red,
});
const charmPalette = (c: Colors<K>): Palette => ({ g: c.gold, G: c.white });
const lanternPalette = (c: Colors<K>): Palette => ({ o: c.ink, r: c.red, l: c.window, y: c.white });
const NEON_PALETTES: readonly ((c: Colors<K>) => Palette)[] = [(c) => ({ n: c.neonA }), (c) => ({ n: c.neonB }), (c) => ({ n: c.neonC })];
const neonPalette = (c: Colors<K>, i: number): Palette => paletteOf(c, NEON_PALETTES[i % 3] as (c: Colors<K>) => Palette);

const raining = (c: Colors<K>): boolean => c.rain !== c.sky0;

// Glows brighten in one step on a kick: each density is a cached image, so they must not vary smoothly.
const flash = (f: Frame): number => (f.kick > 0.5 ? 1 : 0);

// ---- layout: (x, y) is the top-left of her head; everything on the broom hangs off it ----

type Rig = { readonly x: number; readonly y: number; readonly stick: number };

const rigOf = (f: Frame): Rig => {
  const bob = Math.round(Math.sin(f.t * 1.7) * 3) - onBeat(f.beat, 0.22);
  const cx = Math.round(f.w * (wide(f) ? 0.42 : 0.5));
  const y = Math.round(f.h * (wide(f) ? 0.24 : 0.42)) + bob;
  return { x: cx - 12, y, stick: y + 32 };
};

type City = { readonly far: number; readonly near: number };

const cityOf = (f: Frame): City =>
  wide(f) ? { far: Math.round(f.h * 0.5), near: Math.round(f.h * 0.76) } : { far: Math.round(f.h * 0.56), near: Math.round(f.h * 0.74) };

// ---- sky ----

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(ditherGradient(f.w, f.h, [c.sky0, c.sky1, c.sky2]), 0, 0);
  if (!raining(c)) stars(ctx, f.w, f.h, f.t, [c.moon, c.white, c.whiteLo], Math.round((f.w * f.h) / 700), 29, 0.55);
  const s = Math.min(f.w, f.h);
  const r = Math.round(s * 0.12);
  const mx = Math.round(f.w * (wide(f) ? 0.8 : 0.7));
  const my = Math.round(f.h * (wide(f) ? 0.24 : 0.13));
  drawGlow(ctx, mx, my, Math.round(r * 2.4), c.haze, raining(c) ? 0.9 : 0.7);
  moon(ctx, mx, my, r, c.moon, c.moonSea);
};

const clouds = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const s = Math.min(f.w, f.h);
  const count = raining(c) ? 5 : 3;
  driftingClouds(ctx, f, c.haze, c.sky1, { count, top: f.h * 0.12, span: f.h * 0.3, size: s * 0.07, speed: -9, seed: 4 });
};

// ---- the city scrolling below ----

const TILE = 256;

type Block = { readonly x: number; readonly w: number; readonly top: number; readonly i: number };

const blocks: readonly Block[] = (() => {
  const out: Block[] = [];
  for (let i = 0, x = 0; x < TILE; i++) {
    const w = Math.min(TILE - x, 26 + Math.floor(rand(i, 41) * 24));
    out.push({ x, w, top: 4 + Math.floor(rand(i, 42) * 20), i });
    x += w;
  }
  return out;
})();

// The far towers: their tops as a share of the layer's height, and whether a mast with a beacon stands on them.
type Tower = { readonly x: number; readonly w: number; readonly top: number; readonly mast: boolean; readonly i: number };

const towers: readonly Tower[] = (() => {
  const out: Tower[] = [];
  for (let i = 0, x = 0; x < TILE; i++) {
    const w = 8 + Math.floor(rand(i, 51) * 15);
    out.push({ x, w, top: 0.08 + rand(i, 52) * 0.55, mast: rand(i, 53) < 0.35, i });
    x += w + (rand(i, 55) < 0.3 ? 2 : 0);
  }
  return out;
})();

const paintTowers = (g: Ctx, h: number, c: Colors<K>): void => {
  for (const t of towers) {
    const top = Math.round(h * t.top);
    fillRect(g, c.far, t.x, top, t.w, h - top);
    if (t.mast) fillRect(g, c.far, t.x + (t.w >> 1), top - 6, 1, 6);
    for (let y = top + 3; y < h - 2; y += 4) {
      for (let k = t.x + 2; k < t.x + t.w - 1; k += 3) if (rand(k * 7 + y, 54) < 0.22) fillRect(g, c.window, k, y, 1, 2);
    }
  }
};

// Calls `each` with the left edge of every copy of a city tile scrolled by `scroll` that shows on screen.
const eachTile = (w: number, scroll: number, each: (x: number) => void): void => {
  for (let x = -Math.round(wrap(scroll, TILE)); x < w; x += TILE) each(x);
};

// Beacons on the masts blink in turn, two beats on and two off.
const beacons = (ctx: Ctx, f: Frame, c: Colors<K>, farH: number, top: number): void => {
  const on = towers.filter((t) => t.mast && (Math.floor(f.beat / 2) + t.i) % 2 === 1);
  eachTile(f.w, f.t * FAR_SPEED, (x) => {
    for (const t of on) fillRect(ctx, c.red, x + t.x + (t.w >> 1), top + Math.round(farH * t.top) - 7, 1, 1);
  });
};

const paintTank = (g: Ctx, x: number, top: number, c: Colors<K>): void => {
  fillRect(g, c.near, x + 1, top - 3, 1, 3);
  fillRect(g, c.near, x + 7, top - 3, 1, 3);
  fillRect(g, c.near, x, top - 11, 9, 8);
  fillRect(g, c.near, x + 1, top - 13, 7, 2);
  fillRect(g, c.far, x + 1, top - 10, 1, 6);
  fillRect(g, c.far, x + 2, top - 13, 5, 1);
};

// Most lit windows are warm; a few glow in the colors of the neon.
const windowColor = (c: Colors<K>, lit: number): string | null => {
  if (lit >= 0.2) return null;
  if (lit < 0.14) return c.window;
  return lit < 0.17 ? c.neonB : c.neonA;
};

const paintBlock = (g: Ctx, h: number, b: Block, c: Colors<K>): void => {
  fillRect(g, c.near, b.x, b.top, b.w, h - b.top);
  fillRect(g, c.far, b.x, b.top, b.w - 1, 1);
  fillRect(g, c.sky0, b.x + b.w - 1, b.top, 1, h - b.top);
  if (b.i % 3 === 1) paintTank(g, b.x + 4, b.top, c);
  if (b.i % 3 === 2) fillRect(g, c.far, b.x + b.w - 9, b.top - 3, 5, 3);
  for (let y = b.top + 5; y < h - 1; y += 5) {
    for (let x = b.x + 3; x < b.x + b.w - 3; x += 4) {
      const color = windowColor(c, rand(x * 13 + y, 61));
      if (color) fillRect(g, color, x, y, 2, 2);
    }
  }
};

const farLayer = (h: number, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`rw-far:${TILE}x${h}:${c.far}:${c.window}`, TILE, h, (g) => paintTowers(g, h, c));

const nearLayer = (h: number, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`rw-near:${TILE}x${h}:${[c.near, c.far, c.window, c.sky0, c.neonA, c.neonB].join(',')}`, TILE, h, (g) => {
    for (const b of blocks) paintBlock(g, h, b, c);
  });

// Light hanging in the air, ordered-dithered: densest at the bottom and thinning upward.
const hazeLayer = (w: number, h: number, color: string, peak: number): HTMLCanvasElement =>
  memoCanvas(`rw-haze:${w}x${h}:${color}:${peak}`, w, h, (img) => {
    const [r, g, b] = hexToRgb(color);
    for (let y = 0; y < h; y++) {
      const level = (y / h) ** 1.6 * peak;
      for (let x = 0; x < w; x++) {
        if (level <= bayer(x, y)) continue;
        const o = (y * w + x) * 4;
        img.data[o] = r;
        img.data[o + 1] = g;
        img.data[o + 2] = b;
        img.data[o + 3] = 255;
      }
    }
  });

const NEAR_SPEED = 42;
const FAR_SPEED = 9;

const city = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const at = cityOf(f);
  const farH = at.near + 20 - at.far;
  tileX(ctx, farLayer(farH, c), f.t * FAR_SPEED, at.far, f.w);
  beacons(ctx, f, c, farH, at.far);
  const band = Math.round((at.near - at.far) * 0.7);
  ctx.drawImage(hazeLayer(f.w, band, c.haze, 0.3), 0, at.near + 8 - band);
  tileX(ctx, nearLayer(f.h - at.near, c), f.t * NEAR_SPEED, at.near, f.w);
  const street = Math.round((f.h - at.near) * 0.45);
  ctx.drawImage(hazeLayer(f.w, street, c.neonA, 0.22), 0, f.h - street);
};

// A sign on a dark board raised on two posts; it glows on every kick and one in a while flickers out for a beat.
const sign = (ctx: Ctx, f: Frame, c: Colors<K>, b: Block, x: number, y: number): void => {
  const art = SIGNS[(b.i / 3) % SIGNS.length] as Sprite;
  const w = (art[0] ?? '').length;
  const bx = x + b.x + Math.floor((b.w - w) / 2);
  const by = y + b.top - art.length - 8;
  const palette = neonPalette(c, b.i / 3);
  fillRect(ctx, c.near, bx + 2, by + art.length + 3, 1, 6);
  fillRect(ctx, c.near, bx + w - 3, by + art.length + 3, 1, 6);
  fillRect(ctx, c.ink, bx - 2, by - 2, w + 4, art.length + 5);
  if (rand(Math.floor(f.beat), b.i) < 0.08) return;
  drawGlow(ctx, bx + (w >> 1), by + (art.length >> 1), w, palette.n ?? c.neonA, 0.45 + flash(f) * 0.3);
  drawSprite(ctx, art, palette, bx, by);
};

// A tall blade sign down the face of a building, its lit segment climbing one step per beat.
const blade = (ctx: Ctx, f: Frame, c: Colors<K>, b: Block, x: number, y: number): void => {
  const bx = x + b.x + 3;
  const by = y + b.top + 5;
  const segs = 5;
  const color = b.i % 2 === 0 ? c.neonC : c.neonA;
  drawGlow(ctx, bx + 2, by + segs * 2, segs * 2 + 3, color, 0.3 + flash(f) * 0.25);
  fillRect(ctx, c.ink, bx, by, 5, segs * 4 + 1);
  const lit = Math.floor(f.beat) % segs;
  for (let s = 0; s < segs; s++) fillRect(ctx, s === lit ? c.white : color, bx + 1, by + 1 + s * 4, 3, 3);
};

const boards = blocks.filter((b) => b.i % 3 === 0 && b.w > 30);
const blades = blocks.filter((b) => b.i % 3 === 2);

const signs = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const at = cityOf(f);
  eachTile(f.w, f.t * NEAR_SPEED, (x) => {
    for (const b of boards) sign(ctx, f, c, b, x, at.near);
    for (const b of blades) blade(ctx, f, c, b, x, at.near);
  });
  if (raining(c)) glints(ctx, f, at.near + 4, f.h, c.neonB, Math.round(f.w / 8), 17);
};

// ---- wind ----

const streaks = (ctx: Ctx, f: Frame, color: string, count: number, seed: number): void => {
  const span = f.w + 60;
  for (let i = 0; i < count; i++) {
    const x = wrap(rand(i, seed) * span - f.t * (150 + rand(i, seed + 1) * 120), span) - 30;
    const y = Math.floor(rand(i, seed + 2) * f.h * 0.9);
    fillRect(ctx, color, Math.round(x), y, 6 + Math.floor(rand(i, seed + 3) * 16), 1);
  }
};

const backWind = (ctx: Ctx, f: Frame, c: Colors<K>): void => streaks(ctx, f, c.haze, 9, 71);

// ---- hair and cape streaming back ----

type Tail = {
  readonly x: number;
  readonly y: number;
  readonly len: number;
  readonly lean: number;
  readonly phase: number;
  readonly back: boolean;
};

// Half the thickness of a twin tail at u (0 root … 1 tip): a full bundle that tapers to points.
const tailHalf = (u: number): number => {
  if (u < 0.12) return 2.5 + u * 16;
  if (u < 0.55) return 4.4 - (u - 0.12) * 1.5;
  return Math.max(0.6, ((0.84 - u) / 0.29) * 3.8);
};

const tailColumn = (ctx: Ctx, c: Colors<K>, x: number, yc: number, half: number, back: boolean): void => {
  const top = Math.round(yc - half);
  const bottom = Math.round(yc + half);
  fillRect(ctx, c.ink, x, top - 1, 1, bottom - top + 3);
  fillRect(ctx, back ? c.hairLo : c.hair, x, top, 1, bottom - top + 1);
  if (bottom - top < 3) return;
  fillRect(ctx, back ? c.hair : c.hairHi, x, top + 1, 1, 1);
  fillRect(ctx, c.hairLo, x, Math.round(yc + half * 0.4), 1, 1);
};

// The tail ripples in a wave running back along it; past the taper it splits into two pointed locks.
const twinTail = (ctx: Ctx, f: Frame, c: Colors<K>, tl: Tail): void => {
  for (let k = 0; k < tl.len; k++) {
    const u = k / tl.len;
    const yc = tl.y + k * tl.lean + Math.sin(f.t * 7 + tl.phase - k * 0.22) * u * 5;
    if (u < 0.84) {
      tailColumn(ctx, c, tl.x - k, yc, tailHalf(u), tl.back);
      continue;
    }
    const split = (u - 0.84) * 14;
    tailColumn(ctx, c, tl.x - k, yc - split, 0.5, tl.back);
    tailColumn(ctx, c, tl.x - k, yc + split * 0.6, 0.5, tl.back);
  }
};

const capeColumn = (ctx: Ctx, c: Colors<K>, x: number, top: number, bottom: number, curl: number): void => {
  fillRect(ctx, c.ink, x, top - 1, 1, bottom - top + 3);
  fillRect(ctx, c.plum, x, top, 1, bottom - top + 1);
  if (curl > 0.55) fillRect(ctx, c.plumLo, x, top + 2, 1, Math.max(1, bottom - top - 4));
  fillRect(ctx, curl < -0.1 ? c.teal : c.plumLo, x, bottom - 1, 1, 2);
};

const cape = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, y: number): void => {
  const len = 30;
  for (let k = 0; k < len; k++) {
    const u = k / len;
    const phase = f.t * 8 + 1 - k * 0.3;
    const wave = Math.sin(phase) * u * 3.5;
    const tip = u > 0.72 ? (u - 0.72) * 30 : 0;
    const top = Math.round(y + k * 0.12 + wave * 0.6 + tip * 0.5);
    const bottom = Math.round(y + 11 + k * 0.3 + wave - tip);
    capeColumn(ctx, c, x - k, top, Math.max(top + 1, bottom), Math.cos(phase));
  }
};

// ---- the broom, the box and the steam ----

const bristles = (ctx: Ctx, f: Frame, c: Colors<K>, x0: number, y0: number): void => {
  for (let row = -7; row <= 7; row++) {
    const reach = 21 + Math.round(Math.sin(f.t * 11 + row * 1.3) * 1.5);
    const start = Math.max(0, Math.round((Math.abs(row) - 1.5) / 0.38));
    const edge = Math.abs(row) === 7;
    fillRect(ctx, edge ? c.ink : (row & 3) === 0 ? c.wood : c.gold, x0 - reach, y0 + row, reach - start, 1);
    fillRect(ctx, c.ink, x0 - reach - 1, y0 + row, 1, 1);
  }
  fillRect(ctx, c.ink, x0 - 2, y0 - 4, 6, 9);
  fillRect(ctx, c.teal, x0 - 1, y0 - 3, 4, 7);
  fillRect(ctx, c.tealHi, x0 - 1, y0 - 3, 1, 7);
  fillRect(ctx, c.gold, x0 - 1, y0, 4, 1);
};

const broom = (ctx: Ctx, f: Frame, c: Colors<K>, r: Rig): void => {
  const x0 = r.x - 36;
  fillRect(ctx, c.ink, x0, r.stick - 1, 74, 4);
  fillRect(ctx, c.wood, x0, r.stick, 74, 2);
  fillRect(ctx, c.woodHi, x0, r.stick, 72, 1);
  fillRect(ctx, c.ink, x0 + 74, r.stick, 1, 2);
  bristles(ctx, f, c, x0, r.stick);
};

// The lantern at the broom's tip lights her way; it swings back in the wind and brightens on the kick.
const lantern = (ctx: Ctx, f: Frame, c: Colors<K>, r: Rig): void => {
  const x = r.x + 34;
  const swing = Math.round(Math.sin(f.t * 3.3 + 0.6) * 1.2) - 1;
  drawGlow(ctx, x + swing, r.stick + 9, 15, c.window, 0.45 + flash(f) * 0.3);
  pixelLine(ctx, x, r.stick + 2, x + swing, r.stick + 4, c.ink);
  drawSprite(ctx, LANTERN, paletteOf(c, lanternPalette), x + swing - 3, r.stick + 5);
};

// Steam rises from the lid and is swept straight back by the wind, thinning out; it shows once it clears her hair.
const steam = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, y: number): void => {
  for (let j = 0; j < 16; j++) {
    const a = frac(f.t * 0.7 + j / 16);
    const lane = (j % 2) * 3;
    const px = x + lane - a * 64 + Math.sin(f.t * 2.4 + j * 1.9) * (1 + a * 3);
    const style = ditherStyle(ctx, a < 0.45 ? c.white : c.whiteLo, a < 0.45 ? 0.55 : 1 - a);
    if (px > x - 14 || !style) continue;
    ctx.fillStyle = style;
    spanDisc(ctx, px, y - Math.sqrt(a) * 14 + a * 4 - lane, Math.round(1 + a * 4));
  }
};

const boxLeft = (f: Frame, r: Rig): number => r.x - 29 + Math.round(Math.sin(f.t * 2.6) * 1.6);

const box = (ctx: Ctx, f: Frame, c: Colors<K>, r: Rig): void => {
  drawSprite(ctx, BOX, paletteOf(c, boxPalette), boxLeft(f, r), r.stick - 3);
};

// ---- the girl ----

const armUp = (beat: number): boolean => Math.floor(beat) % 4 >= 2;

const legs = (ctx: Ctx, f: Frame, palette: Palette, x: number, y: number): void => {
  const swap = alternate(f.beat) === 1;
  drawSprite(ctx, swap ? LEG_KICK : LEG_DOWN, palette, x + 11, y);
  drawSprite(ctx, swap ? LEG_DOWN : LEG_KICK, palette, x + 15, y);
};

const grin = (ctx: Ctx, c: Colors<K>, x: number, y: number): void => {
  fillRect(ctx, c.ink, x + 10, y + 15, 4, 2);
  fillRect(ctx, c.red, x + 11, y + 16, 2, 1);
  fillRect(ctx, c.ink, x + 11, y + 17, 2, 1);
};

const charm = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, y: number): void => {
  const swing = Math.round(Math.sin(f.t * 5) * 1.5);
  pixelLine(ctx, x, y, x + swing, y + 3, c.gold);
  drawSprite(ctx, STAR_CHARM, paletteOf(c, charmPalette), x + swing - 2, y + 4);
};

const hairTie = (ctx: Ctx, c: Colors<K>, x: number, y: number): void => {
  fillRect(ctx, c.ink, x - 1, y - 3, 4, 7);
  fillRect(ctx, c.teal, x, y - 2, 2, 5);
  fillRect(ctx, c.tealHi, x, y - 2, 1, 2);
};

// Her free hand rests on the broom, then rises in a V beside her face for the second half of every bar.
const freeArm = (ctx: Ctx, f: Frame, c: Colors<K>, palette: Palette, r: Rig): void => {
  if (!armUp(f.beat)) {
    limb(ctx, r.x + 4, r.y + 25, r.x + 2, r.stick - 2, 2, c.skin, c.ink);
    drawSprite(ctx, FIST, palette, r.x, r.stick - 2);
    return;
  }
  limb(ctx, r.x + 4, r.y + 25, r.x - 2, r.y + 15, 2, c.skin, c.ink);
  drawSprite(ctx, V_HAND, palette, r.x - 6, r.y + 9);
};

const backHair = (ctx: Ctx, f: Frame, c: Colors<K>, r: Rig): void => {
  twinTail(ctx, f, c, { x: r.x + 3, y: r.y + 10, len: 30, lean: 0.04, phase: 1.3, back: true });
  cape(ctx, f, c, r.x + 7, r.y + 21);
  twinTail(ctx, f, c, { x: r.x + 1, y: r.y + 13, len: 34, lean: 0.24, phase: 0, back: false });
};

const girl = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const r = rigOf(f);
  const palette = paletteOf(c, girlPalette);
  steam(ctx, f, c, boxLeft(f, r) + 9, r.stick - 4);
  backHair(ctx, f, c, r);
  broom(ctx, f, c, r);
  lantern(ctx, f, c, r);
  box(ctx, f, c, r);
  limb(ctx, r.x + 19, r.y + 25, r.x + 24, r.stick - 1, 2, c.skin, c.ink);
  drawSprite(ctx, BODY, palette, r.x - 3, r.y + 20);
  legs(ctx, f, palette, r.x - 3, r.y + 37);
  drawSprite(ctx, FIST, palette, r.x + 23, r.stick - 2);
  drawGirl(ctx, f, HEAD, palette, r.x, r.y, GIRL);
  if (armUp(f.beat)) grin(ctx, c, r.x, r.y);
  drawSprite(ctx, HAT, palette, r.x - 6, r.y - 11);
  charm(ctx, f, c, r.x - 4, r.y - 7);
  hairTie(ctx, c, r.x + 2, r.y + 10);
  hairTie(ctx, c, r.x, r.y + 13);
  freeArm(ctx, f, c, palette, r);
};

// ---- sparkles off the bristles, and the bat ----

const sparkles = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const r = rigOf(f);
  recentBeats(f.beat * 2, 8, (b, age) => {
    for (let j = 0; j < 2; j++) {
      const x = Math.round(r.x - 58 - age * (10 + rand(b, j) * 8));
      const y = Math.round(r.stick - 4 + rand(b, j + 4) * 8 + age * age * 2);
      const color = j === 0 ? c.gold : c.white;
      if (age < 1.2) twinkle(ctx, x, y, color, 1);
      else if ((b + j + Math.floor(f.t * 10)) % 3 !== 0) fillRect(ctx, color, x, y, 1, 1);
    }
  });
};

// The bat, in a little cap of the shop's teal, beats its wings down on every beat and carries the order slip.
const bat = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const r = rigOf(f);
  const x = r.x + 54;
  const y = r.y + 2 + Math.round(Math.sin(f.t * 2.3 + 1) * 4);
  const palette = paletteOf(c, batPalette);
  const swing = Math.round(Math.sin(f.t * 3.1) * 1.5);
  pixelLine(ctx, x + 7, y + 12, x + 7 + swing, y + 15, c.ink);
  drawSprite(ctx, SLIP, palette, x + 5 + swing, y + 15);
  const down = frac(f.beat) < 0.3;
  const [right, left] = down ? WINGS_DOWN : WINGS_UP;
  drawSprite(ctx, right, palette, x + 13, y + (down ? 4 : -1));
  drawSprite(ctx, left, palette, x - 9, y + (down ? 4 : -1));
  drawSprite(ctx, BAT, palette, x, y);
  drawSprite(ctx, BAT_CAP, palette, x + 3, y + 1);
};

const weather = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  if (raining(c)) rain(ctx, f, c.rain, { count: Math.round((f.w * f.h) / 300), len: 7, slant: 0.45, speed: 230, seed: 9 });
  streaks(ctx, f, c.haze, 3, 83);
};

export const ramenWitch = defineScene<K>({
  id: 'ramen-witch',
  title: 'Ramen Express',
  mood: { valence: 0.5, energy: 0.5 },
  styles: ['neon-rush', 'city-lights', 'nineties-pop', 'puzzle-pop', 'city-groove', 'eurobeat', 'technopop'],
  variants: [
    {
      mood: { valence: 0.5, energy: 0.5 },
      colors: {
        sky0: '#120c38',
        sky1: '#2b1f6e',
        sky2: '#7a3a8e',
        moon: '#fff1c4',
        moonSea: '#ead49a',
        haze: '#5a3c9c',
        far: '#3a2c78',
        near: '#1a1438',
        window: '#ffcf6a',
        neonA: '#ff4fa8',
        neonB: '#3ff0e8',
        neonC: '#ffe14a',
        rain: '#120c38',
        ink: '#170c26',
        skin: '#ffe3d0',
        skinLo: '#f0ad98',
        blush: '#ff7aa0',
        hair: '#e0283e',
        hairHi: '#ff7a72',
        hairLo: '#8e1030',
        teal: '#1aa39a',
        tealHi: '#6ee8d4',
        tealLo: '#0b5a62',
        gold: '#ffc63a',
        white: '#fff8ee',
        whiteLo: '#c6bce6',
        plum: '#b0307c',
        plumLo: '#6a1a5a',
        navy: '#28306e',
        red: '#f0402a',
        wood: '#7a4628',
        woodHi: '#c08048',
      },
    },
    {
      mood: { valence: 0.6, energy: 0.2 },
      colors: {
        sky0: '#3a2a78',
        sky1: '#c04a8a',
        sky2: '#ff9a5a',
        moon: '#fff6e0',
        moonSea: '#f0d8c0',
        haze: '#e2709a',
        far: '#7a4a8e',
        near: '#3a2456',
        window: '#ffd88a',
        neonA: '#ff6ab8',
        neonB: '#5af0e0',
        neonC: '#fff07a',
        rain: '#3a2a78',
        ink: '#2a1030',
        skin: '#ffe6d2',
        skinLo: '#f2b09a',
        blush: '#ff7a9a',
        hair: '#e8303e',
        hairHi: '#ff8a70',
        hairLo: '#962038',
        teal: '#1fa39a',
        tealHi: '#74ead6',
        tealLo: '#0e5c64',
        gold: '#ffcc4a',
        white: '#fff6ea',
        whiteLo: '#d8c0dc',
        plum: '#b83a80',
        plumLo: '#702060',
        navy: '#2e3270',
        red: '#f4482e',
        wood: '#7e4a2a',
        woodHi: '#c88a50',
      },
    },
    {
      mood: { valence: 0.1, energy: 0.6 },
      colors: {
        sky0: '#0a1424',
        sky1: '#14304a',
        sky2: '#2a5468',
        moon: '#9ab8c8',
        moonSea: '#7a98aa',
        haze: '#2c5a72',
        far: '#1e3a52',
        near: '#0c1a2a',
        window: '#ffc860',
        neonA: '#ff3a8c',
        neonB: '#2af2ff',
        neonC: '#d8ff4a',
        rain: '#7ab8d8',
        ink: '#081018',
        skin: '#ffe0cc',
        skinLo: '#e0a490',
        blush: '#ff6e96',
        hair: '#d8203a',
        hairHi: '#ff6a6a',
        hairLo: '#7e0e2a',
        teal: '#18a0a0',
        tealHi: '#66e6dc',
        tealLo: '#0a4e5a',
        gold: '#f8c040',
        white: '#f2f6ff',
        whiteLo: '#a8b8d0',
        plum: '#a82a78',
        plumLo: '#5e1650',
        navy: '#22305e',
        red: '#e83a2a',
        wood: '#6a4028',
        woodHi: '#b07848',
      },
    },
  ],
  layers: [sky, clouds, city, signs, backWind, girl, sparkles, bat, weather],
});
