// A girl in a summer yukata rides a giant goldfish through the night sky over a sleeping old town, the little fish
// she won at the fair swinging in a water bag from her hand, while paper lanterns drift up and bubbles trail behind.
import { type Ctx, drawSprite, fillRect, type Palette, type Sprite } from 'mojipx';
import { bayer, disc, ditherGradient, noise1, pixelLine, rand, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { driftingClouds, fillDither } from './batch-1-helpers.ts';
import { drawGlow, memoLayer, moon, tileX, wrap } from './batch-2-helpers.ts';
import { paletteOf, recentBeats, sigOf } from './batch-3-helpers.ts';
import { alternate, drawGirl, type Girl, sway, wide } from './batch-7-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'star'
  | 'moon'
  | 'moonSea'
  | 'haze'
  | 'far'
  | 'roof'
  | 'roofHi'
  | 'wall'
  | 'window'
  | 'flame'
  | 'ink'
  | 'pale'
  | 'paleLo'
  | 'skin'
  | 'skinLo'
  | 'blush'
  | 'hair'
  | 'hairHi'
  | 'hairLo'
  | 'iris'
  | 'fish'
  | 'fishHi'
  | 'fishLo'
  | 'fishDeep'
  | 'fin'
  | 'water';

// ---- the girl: o outline, s/S skin, b blush, h/H/d hair, e/E eyes, w glint, y/Y yukata, l collar, p print,
// r/R obi, g cord, k/K hairpin flower, f sandals ----

const HEAD: Sprite = [
  '.....oooo...................',
  '....ohHHho..................',
  '...ohHhhhdo.................',
  '...ohhhhhdo.................',
  '...ohhhhddoooooooo..........',
  '....odddoohhhhhhhhoo........',
  '.....ooohhhhhhhhhhhho..oko..',
  '......ohhHHHhhhhHHHhhookKko.',
  '.....ohHHhhhhhhhhhhHHhkKgKk.',
  '....ohhhhhhhhhhhhhhhhhokKko.',
  '....ohhhhhhhhhhhhhhhhhhoko..',
  '...ohhhhhhhhhhhhhhhhhhhho...',
  '...ohhhhhhhhdhhdhhhhhhhho...',
  '...ohhhhdhhdShhSdhhdhhhho...',
  '...ohhddSddSsddsSddSddhho...',
  '...ohdSoooossSSssooooSdho...',
  '...ohdssweessssssweessdho...',
  '...ohdsseEesssssseEessdho...',
  '...ohdssEEEssssssEEEssdho...',
  '...ohdsbbbssssssssbbbsdho...',
  '...ohdsssssssmmsssssssdho...',
  '...ohhoSssssssssssssSohho...',
  '...oho.oSssssssssssSo.oho...',
  '....o...ooSssssssSoo...o....',
  '..........oooooooo..........',
];

const TORSO: Sprite = [
  '...........oSSSSo...........',
  '........oyylsssslyyo........',
  '......oYyyyylsslyyyyYo......',
  '.....oYyyyyyyllyyyyyyYo.....',
  '....oYyyYyypyylyyyyYyyYo....',
  '...oYyyyYyyyyylypyyYyyyYo...',
  '...oYypyYrrrrrrrrrrYyyyYo...',
  '...oYyyyYrrrrrrrrrrYyypYo...',
  '...oYyyyYggggggggggYyyyYo...',
  '...oYyyyYrrrrrrrrrrYyyyYo...',
  '...oYypyYRRRRRRRRRRYyyyYo...',
  '...oYyyossyyyyyyyyssoyyYo...',
  '...oYyyosSyyypyyyySsoyyYo...',
  '....oYYooooyyyyyyooooYYo....',
  '.....oo.oyyyyyyyyyyo.oo.....',
  '........oyyyyYYyyyyo........',
  '........oYyyYooYyyYo........',
  '.........oYYo..oYYo.........',
];

// The feet swing in turn: one sandal lifts while the other hangs.
const LEGS_A: Sprite = [
  '.........osSo..osSo.........',
  '.........oSso..oSso.........',
  '.........osSo..osSo.........',
  '........orrrro.oSso.........',
  '........offffo.osSo.........',
  '.........oooo.orrrro........',
  '..............offffo........',
  '...............oooo.........',
];

const LEGS_B: Sprite = [
  '.........osSo..osSo.........',
  '.........oSso..oSso.........',
  '.........osSo.orrrro........',
  '.........oSso.offffo........',
  '........orrrro.oooo.........',
  '........offffo..............',
  '.........oooo...............',
];

const POSES: readonly Sprite[] = [
  [...HEAD, ...TORSO, ...LEGS_A],
  [...HEAD, ...TORSO, ...LEGS_B],
];
const GIRL: Girl = {
  eyes: [
    { x: 8, y: 15, out: -1 },
    { x: 17, y: 15, out: 1 },
  ],
  seed: 71,
};
const GIRL_W = 28;
const SEAT = 39; // the row she sits on
const HAND = { x: 19, y: 37 } as const;

// The fair's water bag: k string, o rim, w water, W glint.
const BAG: Sprite = ['..kk...', '...k...', '..oko..', '.owwwo.', 'owWwwwo', 'owwwwwo', 'owwwwwo', '.owwwo.', '..ooo..'];

// Sky lanterns: p paper, P lit paper, F flame, o frame.
const LANTERN: Sprite = ['.pppp.', 'pPPPPp', 'pPPPPp', 'pPPPPp', 'pPFFPp', '.pPPp.', '..oo..'];
const LANTERN_SMALL: Sprite = ['ppp', 'pPp', 'pFp', '.p.'];

const girlPalette = (c: Colors<K>): Palette => ({
  o: c.ink,
  s: c.skin,
  S: c.skinLo,
  b: c.blush,
  h: c.hair,
  H: c.hairHi,
  d: c.hairLo,
  e: c.ink,
  E: c.iris,
  w: c.pale,
  m: c.fishLo,
  y: c.pale,
  Y: c.paleLo,
  l: c.hairHi,
  p: c.blush,
  r: c.fishLo,
  R: c.fishDeep,
  g: c.flame,
  k: c.blush,
  K: c.pale,
  f: c.roofHi,
});
const bagPalette = (c: Colors<K>): Palette => ({ k: c.fishLo, o: c.paleLo, w: c.water, W: c.pale });
const lanternPalette = (c: Colors<K>): Palette => ({ p: c.window, P: c.flame, F: c.pale, o: c.ink });

// ---- layout ----

type Fish = { readonly cx: number; readonly cy: number; readonly rx: number; readonly ry: number };

const fishOf = (f: Frame): Fish => {
  const s = Math.min(f.w, f.h);
  const bob = sway(f.t, 1.1, 3);
  const rx = Math.round(s * 0.2);
  const ry = Math.round(s * 0.105);
  if (wide(f)) return { cx: Math.round(f.w * 0.53), cy: Math.round(f.h * 0.6) + bob, rx, ry };
  return { cx: Math.round(f.w * 0.58), cy: Math.round(f.h * 0.53) + bob, rx, ry };
};

const townTopOf = (f: Frame): number => Math.round(f.h * (wide(f) ? 0.78 : 0.8));

// ---- sky ----

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(ditherGradient(f.w, f.h, [c.sky0, c.sky1, c.sky1, c.sky2]), 0, 0);
  stars(ctx, f.w, f.h, f.t, [c.star, c.pale, c.paleLo], Math.round((f.w * f.h) / 500), 37, 0.75);
  const s = Math.min(f.w, f.h);
  const r = Math.round(s * 0.085);
  const mx = Math.round(f.w * (wide(f) ? 0.82 : 0.74));
  const my = Math.round(f.h * (wide(f) ? 0.2 : 0.11));
  drawGlow(ctx, mx, my, Math.round(r * 2.8), c.haze, 0.8);
  moon(ctx, mx, my, r, c.moon, c.moonSea);
};

// Moonlit clouds slide back past the fish (the town scrolls too), so it seems to fly.
const clouds = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const s = Math.min(f.w, f.h);
  const low = townTopOf(f) - Math.round(s * 0.04);
  driftingClouds(ctx, f, c.roofHi, c.haze, { count: 2, top: f.h * 0.16, span: f.h * 0.2, size: s * 0.08, speed: -3, seed: 5 });
  driftingClouds(ctx, f, c.roofHi, c.haze, { count: 3, top: low, span: s * 0.08, size: s * 0.11, speed: -8, seed: 9 });
};

// ---- the sleeping town ----

const TOWN = 256;

// Hills with a pagoda, periodic over the tile so the scroll never shows a seam.
const paintFar = (g: Ctx, h: number, c: Colors<K>): void => {
  for (let x = 0; x < TOWN; x++) {
    const a = (x / TOWN) * Math.PI * 2;
    const y = Math.round(h * 0.42 + Math.sin(a) * h * 0.12 + Math.sin(a * 3 + 1) * h * 0.07);
    fillRect(g, c.far, x, y, 1, h - y);
    if (rand(x, 81) < 0.05) fillRect(g, c.window, x, y + 3 + Math.floor(rand(x, 82) * (h - y - 4)), 1, 1);
  }
  const px = 170;
  const base = Math.round(h * 0.45);
  for (let k = 0; k < 5; k++) {
    const w = 16 - k * 2;
    const y = base - k * 5;
    fillRect(g, c.far, px - (w >> 1), y - 4, w, 5);
    fillRect(g, c.far, px - (w >> 1) - 2, y - 1, w + 4, 1);
    fillRect(g, c.far, px - (w >> 1) - 3, y - 2, 1, 1);
    fillRect(g, c.far, px + (w >> 1) + 2, y - 2, 1, 1);
  }
  fillRect(g, c.far, px, base - 33, 1, 8);
};

type Row = { readonly seed: number; readonly top: number; readonly spread: number; readonly front: boolean };

const paintRoof = (g: Ctx, x: number, w: number, top: number, rh: number, c: Colors<K>, dark: string): void => {
  for (let r = 0; r < rh; r++) {
    const inset = Math.round((rh - 1 - r) * 0.9);
    fillRect(g, dark, x - 2 + inset, top + r, w + 4 - inset * 2, 1);
    for (let k = x - 1 + inset; k < x + w + 2 - inset; k += 2) fillRect(g, c.ink, k, top + r, 1, 1);
  }
  const ridge = Math.round((rh - 1) * 0.9);
  fillRect(g, c.roofHi, x - 2 + ridge, top, w + 4 - ridge * 2, 1);
  fillRect(g, c.roofHi, x - 3 + ridge, top - 1, 1, 1);
  fillRect(g, c.roofHi, x + w + 2 - ridge, top - 1, 1, 1);
  fillRect(g, c.roofHi, x - 2, top + rh - 1, w + 4, 1);
};

const paintWindow = (g: Ctx, x: number, y: number, lit: boolean, c: Colors<K>): void => {
  fillRect(g, lit ? c.window : c.ink, x, y, 5, 4);
  if (!lit) return;
  fillRect(g, c.flame, x + 1, y + 1, 1, 2);
  fillRect(g, c.roof, x + 2, y, 1, 4);
  fillRect(g, c.roof, x, y + 2, 5, 1);
};

// A wooden front with a lattice below, or (on a storehouse) moonlit plaster over a dark plinth.
const paintFacade = (g: Ctx, x: number, w: number, wallTop: number, h: number, store: boolean, c: Colors<K>): void => {
  const plinth = wallTop + Math.round((h - wallTop) * (store ? 0.6 : 0.4));
  fillRect(g, store ? c.wall : c.far, x, wallTop, w, plinth - wallTop);
  fillRect(g, c.far, x, plinth, w, h - plinth);
  for (let k = x + 1; k < x + w; k += 2) fillRect(g, c.ink, k, plinth + 1, 1, h - plinth - 1);
  fillRect(g, c.roofHi, x, plinth, w, 1);
  fillRect(g, c.ink, x, wallTop, w, 1);
};

const paintHouse = (g: Ctx, x: number, w: number, top: number, h: number, i: number, row: Row, c: Colors<K>): void => {
  const rh = 5 + Math.floor(rand(i, row.seed + 1) * 4);
  const wallTop = top + rh;
  if (row.front) paintFacade(g, x, w, wallTop, h, rand(i, row.seed + 5) < 0.3, c);
  else fillRect(g, c.roof, x, wallTop, w, h - wallTop);
  paintRoof(g, x, w, top, rh, c, row.front ? c.far : c.roof);
  if (w > 12) paintWindow(g, x + 3 + Math.floor(rand(i, row.seed + 2) * (w - 9)), wallTop + 3, rand(i, row.seed + 3) < 0.3, c);
};

const paintRow = (g: Ctx, h: number, row: Row, c: Colors<K>): void => {
  let x = 3;
  for (let i = 0; x < TOWN - 11; i++) {
    const rest = TOWN - 3 - x;
    const w = rest < 34 ? rest : 14 + Math.floor(rand(i, row.seed) * 16);
    const top = Math.round(row.top + rand(i, row.seed + 4) * row.spread);
    paintHouse(g, x, w, top, h, i, row, c);
    x += w + 1 + Math.floor(rand(i, row.seed + 6) * 3);
  }
};

// A fire-watch tower: a ladder of posts with a little roofed lookout and its bell.
const paintTower = (g: Ctx, x: number, top: number, h: number, c: Colors<K>): void => {
  fillRect(g, c.far, x, top + 6, 1, h - top - 6);
  fillRect(g, c.far, x + 6, top + 6, 1, h - top - 6);
  for (let y = top + 9; y < h; y += 4) fillRect(g, c.far, x, y, 7, 1);
  fillRect(g, c.far, x - 1, top + 5, 9, 2);
  fillRect(g, c.far, x + 1, top + 2, 5, 3);
  fillRect(g, c.roofHi, x - 1, top + 1, 9, 1);
  fillRect(g, c.roofHi, x + 3, top, 1, 1);
  fillRect(g, c.window, x + 3, top + 3, 1, 1);
};

const farLayer = (h: number, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`gf-far:${[c.far, c.window].join(',')}`, TOWN, h, (g) => paintFar(g, h, c));

const nearLayer = (h: number, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`gf-near:${[c.far, c.roof, c.roofHi, c.wall, c.window, c.flame, c.ink].join(',')}`, TOWN, h, (g) => {
    fillRect(g, c.roof, 0, Math.round(h * 0.3), TOWN, h);
    paintTower(g, 96, 0, h, c);
    paintRow(g, h, { seed: 91, top: 8, spread: h * 0.12, front: false }, c);
    paintRow(g, h, { seed: 95, top: Math.round(h * 0.38), spread: h * 0.1, front: true }, c);
  });

const town = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const top = townTopOf(f);
  const farH = Math.round(Math.min(f.w, f.h) * 0.26);
  tileX(ctx, farLayer(farH, c), f.t * 2, top - Math.round(farH * 0.8), f.w);
  tileX(ctx, nearLayer(f.h - top + 6, c), f.t * 6 + 60, top - 6, f.w);
};

// ---- sky lanterns ----

type Lantern = { readonly x: number; readonly y: number; readonly z: number };

const lanternAt = (f: Frame, i: number): Lantern => {
  const z = rand(i, 61);
  const spanY = f.h + 40;
  const spanX = f.w + 30;
  const y = f.h + 10 - wrap(rand(i, 62) * spanY + f.t * (2 + z * 5), spanY);
  const x = wrap(rand(i, 63) * spanX - f.t * (1.5 + z * 3) + Math.sin(f.t * 0.7 + i) * 3, spanX) - 15;
  return { x: Math.round(x), y: Math.round(y), z };
};

const lantern = (ctx: Ctx, f: Frame, c: Colors<K>, l: Lantern): void => {
  const bright = f.kick > 0.5 ? 0.25 : 0;
  if (l.z < 0.4) {
    drawGlow(ctx, l.x, l.y, 3, c.window, 0.5 + bright);
    fillRect(ctx, c.window, l.x, l.y, 2, 2);
    fillRect(ctx, c.flame, l.x, l.y + 1, 1, 1);
    return;
  }
  const near = l.z > 0.78;
  drawGlow(ctx, l.x + (near ? 3 : 1), l.y + (near ? 4 : 2), near ? 9 : 5, c.window, 0.6 + bright);
  drawSprite(ctx, near ? LANTERN : LANTERN_SMALL, paletteOf(c, lanternPalette), l.x, l.y);
};

const lanterns = (ctx: Ctx, f: Frame, c: Colors<K>, front: boolean): void => {
  const count = Math.round((f.w * f.h) / 2600);
  for (let i = 0; i < count; i++) {
    const l = lanternAt(f, i);
    if (l.z > 0.86 === front) lantern(ctx, f, c, l);
  }
};

const backLanterns = (ctx: Ctx, f: Frame, c: Colors<K>): void => lanterns(ctx, f, c, false);
const frontLanterns = (ctx: Ctx, f: Frame, c: Colors<K>): void => lanterns(ctx, f, c, true);

// ---- the goldfish ----

// Half-heights above and below the centre line at u (−1 tail … +1 nose), in units of ry: a high back, a round belly.
const bodyAt = (u: number): readonly [number, number] => {
  const round = Math.sqrt(Math.max(0, 1 - Math.abs(u) ** 2.3));
  const s = u < 0 ? 0.26 + 0.74 * round : round;
  return [s * 1.1, s * 0.92];
};

// White patches over the red-gold, like a two-tone fair goldfish: blobs at set places with ragged rims.
const PATCHES = [
  { u: 0.5, v: -0.95, a: 0.2, b: 0.35 },
  { u: -0.32, v: -0.25, a: 0.2, b: 0.55 },
  { u: 0.1, v: 0.5, a: 0.12, b: 0.3 },
] as const;
const patch = (u: number, v: number, x: number, y: number): boolean => {
  const rim = 0.75 + noise1(x / 2.5 + y / 3, 7) * 0.5;
  return PATCHES.some((p) => ((u - p.u) / p.a) ** 2 + ((v - p.v) / p.b) ** 2 < rim);
};

const scaleGlint = (x: number, y: number): boolean => y % 3 === 0 && (x + (Math.floor(y / 3) & 1) * 2) % 4 === 0;

const bodyColor = (x: number, dy: number, u: number, v: number, c: Colors<K>): string => {
  if (v < -0.82) return c.fishHi;
  if (patch(u, v, x, dy)) return v > 0.3 ? c.paleLo : c.pale;
  if (v < -0.42) return v < -0.6 || bayer(x, dy) < 0.5 ? c.fishLo : c.fish;
  if (v > 0.68) return bayer(x, dy) < 0.5 ? c.pale : c.fishHi;
  if (v > 0.36) return c.fishHi;
  return scaleGlint(x + 64, dy + 64) ? c.fishHi : c.fish;
};

// The gill line, the mouth and a big round eye with a glint.
const paintFace = (g: Ctx, ox: number, oy: number, rx: number, ry: number, c: Colors<K>): void => {
  for (let dy = -Math.round(ry * 0.7); dy <= Math.round(ry * 0.7); dy++) {
    const gx = Math.round(rx * (0.42 + 0.12 * (dy / ry) ** 2));
    fillRect(g, c.fishDeep, ox + gx, oy + dy, 1, 1);
  }
  const my = oy + Math.round(ry * 0.15);
  fillRect(g, c.fishDeep, ox + rx - 2, my, 3, 1);
  fillRect(g, c.fishHi, ox + rx - 1, my - 1, 2, 1);
  const er = Math.round(ry * 0.17);
  const ex = ox + Math.round(rx * 0.68);
  const ey = oy - Math.round(ry * 0.2);
  disc(g, ex, ey, er, () => c.fishHi);
  disc(g, ex, ey, Math.max(0, er - 1), () => c.ink);
  if (er < 3) return;
  fillRect(g, c.pale, ex - 1, ey - 1, 2, 2);
  fillRect(g, c.pale, ex + 1, ey + 1, 1, 1);
};

const bodyLayer = (fish: Fish, c: Colors<K>): HTMLCanvasElement => {
  const { rx, ry } = fish;
  const oy = Math.ceil(ry * 1.1) + 2;
  const h = oy + Math.ceil(ry * 0.92) + 3;
  return memoLayer(`gf-body:${rx}:${ry}:${sigOf(c)}`, rx * 2 + 4, h, (g) => {
    for (let x = -rx; x <= rx; x++) {
      const [up, down] = bodyAt(x / rx);
      const y0 = Math.round(oy - up * ry);
      const y1 = Math.round(oy + down * ry);
      fillRect(g, c.fishDeep, x + rx + 1, y0 - 1, 1, y1 - y0 + 3);
      for (let y = y0; y <= y1; y++) {
        const v = y < oy ? (y - oy) / Math.max(1, up * ry) : (y - oy) / Math.max(1, down * ry);
        fillRect(g, bodyColor(x, y - oy, x / rx, v, c), x + rx + 1, y, 1, 1);
      }
    }
    paintFace(g, rx + 1, oy, rx, ry, c);
  });
};

// A fin column: a dithered sheet from y0 to y1 (thinning toward the tips) with a darker rim.
const finColumn = (ctx: Ctx, c: Colors<K>, x: number, y0: number, y1: number, level: number): void => {
  const top = Math.round(Math.min(y0, y1));
  const bottom = Math.round(Math.max(y0, y1));
  fillDither(ctx, c.fin, level, x, top, 1, bottom - top + 1);
  fillDither(ctx, c.fishLo, Math.min(1, level + 0.2), x, Math.round(y0), 1, 1);
};

// The double tail streams back in a travelling wave, split into two lobes that flutter at their edges.
const tail = (ctx: Ctx, f: Frame, fish: Fish, c: Colors<K>): void => {
  const len = Math.round(fish.rx * 1.2);
  for (let k = 0; k <= len; k++) {
    const u = k / len;
    const x = fish.cx - fish.rx - k + 1;
    const yc = fish.cy + Math.sin(f.t * 2.4 - k * 0.12) * k * 0.15 + k * 0.12;
    const half = fish.ry * 0.26 + k * 0.62 + Math.sin(k * 0.45 - f.t * 4.5) * 1.5 * u;
    const gap = u > 0.4 ? (u - 0.4) * half * 0.7 : 0;
    const level = u < 0.5 ? 1 : 1 - (u - 0.5) * 1.2;
    finColumn(ctx, c, x, yc - half, yc - gap, level);
    finColumn(ctx, c, x, yc + half, yc + gap, level);
    if (k % 2 === 0) continue;
    fillRect(ctx, c.fishLo, x, Math.round(yc - gap - (half - gap) * 0.5), 1, 1);
    fillRect(ctx, c.fishLo, x, Math.round(yc + gap + (half - gap) * 0.5), 1, 1);
  }
};

// The dorsal fin rises behind the girl and ripples back toward the tail.
const dorsal = (ctx: Ctx, f: Frame, fish: Fish, c: Colors<K>): void => {
  const x0 = Math.round(fish.cx - fish.rx * 0.62);
  const len = Math.round(fish.rx * 0.6);
  for (let j = 0; j <= len; j++) {
    const x = x0 + j;
    const base = fish.cy - bodyAt((x - fish.cx) / fish.rx)[0] * fish.ry + 2;
    const rise = fish.ry * 0.7 * Math.sin((Math.PI * j) / len) ** 0.6;
    const top = base - rise + Math.sin(j * 0.4 - f.t * 4) * 1.2;
    finColumn(ctx, c, x, top, base, 0.85);
  }
};

// Belly fins trail underneath like ribbons.
const ribbonFin = (ctx: Ctx, f: Frame, c: Colors<K>, x0: number, y0: number, len: number): void => {
  for (let j = 0; j < len; j++) {
    const y = y0 + j * 0.45 + Math.sin(f.t * 3.2 - j * 0.35) * j * 0.18;
    finColumn(ctx, c, x0 - j, y + 3 - j * 0.1, y, 1 - j / (len * 1.6));
  }
};

const pectoral = (ctx: Ctx, f: Frame, fish: Fish, c: Colors<K>): void => {
  const open = 0.6 + 0.4 * Math.sin(f.t * 5);
  const px = Math.round(fish.cx + fish.rx * 0.32);
  const py = Math.round(fish.cy + fish.ry * 0.5);
  const len = Math.round(fish.rx * 0.3);
  for (let j = 0; j < len; j++) finColumn(ctx, c, px - j, py + j * 0.4 + j * 0.45 * open, py + j * 0.2 - 1, 0.9 - j * 0.05);
};

const drawFish = (ctx: Ctx, f: Frame, fish: Fish, c: Colors<K>): void => {
  tail(ctx, f, fish, c);
  dorsal(ctx, f, fish, c);
  ribbonFin(ctx, f, c, Math.round(fish.cx - fish.rx * 0.05), Math.round(fish.cy + fish.ry * 0.8), Math.round(fish.rx * 0.42));
  ribbonFin(ctx, f, c, Math.round(fish.cx - fish.rx * 0.55), Math.round(fish.cy + fish.ry * 0.5), Math.round(fish.rx * 0.33));
  ctx.drawImage(bodyLayer(fish, c), fish.cx - fish.rx - 1, fish.cy - Math.ceil(fish.ry * 1.1) - 2);
  pectoral(ctx, f, fish, c);
};

const goldfish = (ctx: Ctx, f: Frame, c: Colors<K>): void => drawFish(ctx, f, fishOf(f), c);

// A smaller goldfish keeps them company far off, crossing the sky now and then.
const companion = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const s = Math.min(f.w, f.h);
  const rx = Math.round(s * 0.05);
  const lane = f.w + rx * 6;
  const cx = Math.round(wrap(f.t * 6 + f.w * 0.25, lane) - rx * 2);
  const cy = Math.round(f.h * (wide(f) ? 0.24 : 0.26) + Math.sin(f.t * 0.9) * 3);
  drawFish(ctx, f, { cx, cy, rx, ry: Math.round(s * 0.028) }, c);
};

// ---- bubbles, one breathed out on most beats ----

const bubble = (ctx: Ctx, c: Colors<K>, x: number, y: number, r: number): void => {
  if (r <= 1) {
    fillRect(ctx, c.water, x, y, 2, 2);
    fillRect(ctx, c.pale, x, y, 1, 1);
    return;
  }
  fillRect(ctx, c.water, x - r + 1, y - r, r * 2 - 1, 1);
  fillRect(ctx, c.water, x - r + 1, y + r, r * 2 - 1, 1);
  fillRect(ctx, c.water, x - r, y - r + 1, 1, r * 2 - 1);
  fillRect(ctx, c.water, x + r, y - r + 1, 1, r * 2 - 1);
  fillRect(ctx, c.pale, x - r + 1, y - r + 1, 1, 1);
};

const bubbles = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const fish = fishOf(f);
  const mx = fish.cx + fish.rx + 2;
  const my = fish.cy + Math.round(fish.ry * 0.1);
  recentBeats(f.beat, 7, (b, age) => {
    if (b < 0 || rand(b, 51) < 0.3) return;
    const x = mx + 2 - age * 6 + Math.sin(age * 3 + b) * 2;
    const y = my - 4 - age * 9;
    bubble(ctx, c, Math.round(x), Math.round(y), age < 1 ? 1 : Math.min(3, 1 + Math.floor(age / 1.5)));
  });
};

// ---- the girl, her hairpin and the bag ----

const dangle = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, y: number): void => {
  const swing = sway(f.t, 2.3, 1);
  fillRect(ctx, c.flame, x, y, 1, 2);
  fillRect(ctx, c.flame, x + (swing > 0 ? 1 : 0), y + 2, 1, 1);
  fillRect(ctx, c.blush, x + swing, y + 3, 1, 2);
};

const bag = (ctx: Ctx, f: Frame, c: Colors<K>, hx: number, hy: number): void => {
  const swing = Math.sin(f.t * 2.1) * 2.5;
  const bx = Math.round(hx - 3 + swing);
  const by = hy + 4;
  pixelLine(ctx, hx, hy, bx + 3, by, c.fishLo);
  drawSprite(ctx, BAG, paletteOf(c, bagPalette), bx, by);
  const fx = bx + 2 + sway(f.t, 1.4, 1);
  fillRect(ctx, c.fish, fx, by + 5, 2, 1);
  fillRect(ctx, c.fishLo, fx + (Math.sin(f.t * 1.4) > 0 ? -1 : 2), by + 5, 1, 1);
};

const girl = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const fish = fishOf(f);
  const x = Math.round(fish.cx + fish.rx * 0.08) - (GIRL_W >> 1);
  const y = Math.round(fish.cy - fish.ry * 1.1) + 3 - SEAT;
  fillDither(ctx, c.fishDeep, 0.3, x + 7, y + SEAT, 14, 10);
  drawGirl(ctx, f, POSES[alternate(f.beat)] as Sprite, paletteOf(c, girlPalette), x, y, GIRL);
  dangle(ctx, f, c, x + 25, y + 11);
  bag(ctx, f, c, x + HAND.x, y + HAND.y);
};

export const goldfishRide = defineScene<K>({
  id: 'goldfish-ride',
  title: 'Goldfish Flight',
  mood: { valence: 0.4, energy: -0.2 },
  styles: ['summer-festival', 'starlit-dream', 'nineties-pop', 'lofi-loop', 'showa-ballad', 'kawaii-pop'],
  variants: [
    {
      mood: { valence: 0.5, energy: 0.1 },
      colors: {
        sky0: '#0b0a2a',
        sky1: '#25206a',
        sky2: '#6a3f8e',
        star: '#d4d8ff',
        moon: '#fff3c8',
        moonSea: '#ead39a',
        haze: '#463c8c',
        far: '#1c1846',
        roof: '#2a2456',
        roofHi: '#6b6cb4',
        wall: '#4a4680',
        window: '#ffad48',
        flame: '#fff0a6',
        ink: '#120c24',
        pale: '#f7f3ff',
        paleLo: '#bcb8e8',
        skin: '#ffe2cf',
        skinLo: '#efb29c',
        blush: '#ff7c98',
        hair: '#262a56',
        hairHi: '#6378d0',
        hairLo: '#151634',
        iris: '#e03c5c',
        fish: '#ff7a2a',
        fishHi: '#ffc45c',
        fishLo: '#e2402e',
        fishDeep: '#8c1a2c',
        fin: '#ff9c72',
        water: '#a4dcff',
      },
    },
    {
      mood: { valence: 0.4, energy: -0.5 },
      colors: {
        sky0: '#1a2766',
        sky1: '#4656a4',
        sky2: '#f0a080',
        star: '#eceeff',
        moon: '#fffbea',
        moonSea: '#dcd6c2',
        haze: '#7d88cc',
        far: '#3a3a78',
        roof: '#2e2c5e',
        roofHi: '#8c8cd2',
        wall: '#5c5a98',
        window: '#ffc46a',
        flame: '#fff4c2',
        ink: '#171433',
        pale: '#fbf8ff',
        paleLo: '#c4c4ea',
        skin: '#ffe6d6',
        skinLo: '#f0b6a2',
        blush: '#ff88a0',
        hair: '#2a2d60',
        hairHi: '#7088da',
        hairLo: '#181a40',
        iris: '#e04a66',
        fish: '#ff8a3a',
        fishHi: '#ffd47c',
        fishLo: '#ea4a36',
        fishDeep: '#962032',
        fin: '#ffac80',
        water: '#b8e6ff',
      },
    },
    {
      mood: { valence: 0, energy: -0.2 },
      colors: {
        sky0: '#04121f',
        sky1: '#0c3048',
        sky2: '#22606e',
        star: '#c8fff4',
        moon: '#ecfff8',
        moonSea: '#b8e0d8',
        haze: '#1d5064',
        far: '#082232',
        roof: '#0e2c3e',
        roofHi: '#3e7c8c',
        wall: '#1c4458',
        window: '#ffcc66',
        flame: '#fff6c8',
        ink: '#03101a',
        pale: '#effffb',
        paleLo: '#a6d6d4',
        skin: '#ffe4d2',
        skinLo: '#e8ae9a',
        blush: '#ff7e90',
        hair: '#162a42',
        hairHi: '#4e8eac',
        hairLo: '#0a1628',
        iris: '#e0485e',
        fish: '#ff702e',
        fishHi: '#ffc262',
        fishLo: '#da3a2c',
        fishDeep: '#7a1828',
        fin: '#ff9468',
        water: '#aaf0ff',
      },
    },
  ],
  layers: [sky, clouds, companion, backLanterns, town, goldfish, girl, bubbles, frontLanterns],
});
