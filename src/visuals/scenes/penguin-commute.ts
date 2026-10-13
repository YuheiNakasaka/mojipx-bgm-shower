// A packed morning train run by nobody but penguins: in caps and tiny ties they hold the straps and sway together on
// the beat, one reads a folded paper, one nods off onto its neighbour, and a chick rides on its parent's feet, while
// the city slides past the windows and window light sweeps down the car.
import { type Ctx, drawSprite, fillRect, type Palette, type Sprite } from 'mojipx';
import { disc, ditherGradient, frac, memoLayer, pixelLine, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { colorKey, drawGlow, fillDither, wrap } from './batch-1-helpers.ts';
import { smooth, tileX } from './batch-2-helpers.ts';
import { paletteOf } from './batch-3-helpers.ts';
import { isDark, mixHex } from './batch-5-helpers.ts';
import { frameLayer, rain } from './batch-6-helpers.ts';
import { blinking } from './batch-7-helpers.ts';
import { type Plan, planOf } from './batch-9-helpers.ts';
import { drawFigure, eyeAt, type Figure, inOval, type Pose, type Pt, placeOf, taper } from './batch-13-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sun'
  | 'far'
  | 'farLit'
  | 'mid'
  | 'midLit'
  | 'near'
  | 'glass'
  | 'drop'
  | 'wall'
  | 'wallLo'
  | 'wallHi'
  | 'ceil'
  | 'lamp'
  | 'seat'
  | 'seatLo'
  | 'floor'
  | 'floorLo'
  | 'steel'
  | 'steelHi'
  | 'strap'
  | 'ad1'
  | 'ad2'
  | 'light'
  | 'ink'
  | 'back'
  | 'backHi'
  | 'belly'
  | 'bellyLo'
  | 'beak'
  | 'blush'
  | 'tie1'
  | 'tie2'
  | 'tie3'
  | 'cap1'
  | 'cap2'
  | 'cap3'
  | 'paper'
  | 'paperLo'
  | 'chick'
  | 'chickLo';

// ---- the penguins: o outline, k/K back and its rim light, u/U belly and its shade, w/e/g eyes, y/Y beak,
// f feet, p blush, t/T tie and knot, h/H/B cap, its highlight and band. Flippers are drawn apart, as limbs. ----

type Hat = 'cap' | 'bowler' | 'beanie' | 'none';

const BODY_RX = 13;

// An egg: narrower toward the crown, widest low down.
const inBody = (x: number, y: number): boolean => {
  const rx = y < -20 ? BODY_RX - 2 + (y + 44) / 12 : BODY_RX;
  return inOval(x, y, 0, -21.5, rx, 22);
};

// The white front: a heart-shaped face over a round belly.
const inFront = (x: number, y: number): boolean =>
  inOval(x, y, -4.2, -31, 5.6, 6) || inOval(x, y, 4.2, -31, 5.6, 6) || inOval(x, y, 0, -15, 10, 14.5);

const EYES = [
  { x: -4.6, y: -31.8, rx: 2.1, ry: 2.7 },
  { x: 4.6, y: -31.8, rx: 2.1, ry: 2.7 },
] as const;

const faceAt = (x: number, y: number, shut: boolean): string | null => {
  for (const eye of EYES) {
    const hit = eyeAt(x, y, eye, shut);
    if (hit) return hit;
  }
  if (y > -29.5 && y < -26 && Math.abs(x) < 2.6 - (y + 29.5) * 0.7) return y > -27.5 ? 'Y' : 'y';
  if (inOval(x, y, -7.5, -27.5, 1.6, 0.9) || inOval(x, y, 7.5, -27.5, 1.6, 0.9)) return 'p';
  return null;
};

const tieAt = (x: number, y: number): string | null => {
  if (y > -23 && y < -20.5 && Math.abs(x) < 1.4) return 'T';
  if (y >= -20.5 && y < -12.5 && Math.abs(x) < 1.2 + (y + 20.5) * 0.18 - Math.max(0, y + 15) * 1.1) return 't';
  return null;
};

const frontAt = (x: number, y: number): string => (y > -6 || x > 7.5 ? 'U' : 'u');
const backAt = (x: number, y: number): string => (!inBody(x - 1.2, y - 1.2) && x < 2 ? 'K' : 'k');

const capAt = (x: number, y: number): string | null => {
  if (y > -41 && y <= -38.8 && Math.abs(x) < 9.8) return 'B';
  return inOval(x, y, 0.6, -41.5, 9.6, 5.5) && y <= -41 ? (x < -3 && y < -44 ? 'H' : 'h') : null;
};

const bowlerAt = (x: number, y: number): string | null => {
  if (y > -41 && y <= -39 && Math.abs(x) < 11) return 'h';
  if (y > -43 && y <= -41 && Math.abs(x) < 7) return 'B';
  return inOval(x, y, 0, -44, 6.6, 6) && y <= -43 ? (x < -2 && y < -47 ? 'H' : 'h') : null;
};

const beanieAt = (x: number, y: number): string | null => {
  if (inOval(x, y, 0, -50.5, 2.3, 2.3)) return 'H';
  if (y > -41 && y <= -38.5 && Math.abs(x) < 10.2) return 'B';
  if (!inOval(x, y, 0, -41, 10, 8.4) || y > -41) return null;
  return y > -45.5 && y < -44 ? 'H' : 'h';
};

const HATS: Readonly<Record<Hat, (x: number, y: number) => string | null>> = {
  cap: capAt,
  bowler: bowlerAt,
  beanie: beanieAt,
  none: () => null,
};

const penguinLook =
  (hat: Hat): Figure['look'] =>
  (x, y, shut) => {
    const top = HATS[hat](x, y);
    if (top) return top;
    if (y > -2.8 && y < -0.2 && (inOval(x, y, -5, -1.4, 4, 1.4) || inOval(x, y, 5, -1.4, 4, 1.4))) return 'f';
    if (!inBody(x, y)) return null;
    if (!inFront(x, y)) return backAt(x, y);
    return faceAt(x, y, shut) ?? tieAt(x, y) ?? frontAt(x, y);
  };

// The chick: c/C fluff and its shade, l its pale face, a yellow school hat (h/B), and the penguin's eyes, beak and feet.
const CHICK_EYES = [
  { x: -2.3, y: -7.6, rx: 1.2, ry: 1.5 },
  { x: 2.3, y: -7.6, rx: 1.2, ry: 1.5 },
] as const;

const chickHatAt = (x: number, y: number): string | null => {
  if (inOval(x, y, 0, -13.2, 5.4, 3.6) && y < -13) return x < -2 && y < -15 ? 'H' : 'h';
  return y >= -13 && y < -11.6 && Math.abs(x) < 7.2 ? 'B' : null;
};

const chickFaceAt = (x: number, y: number, shut: boolean): string | null => {
  for (const eye of CHICK_EYES) {
    const hit = eyeAt(x, y, eye, shut);
    if (hit) return hit;
  }
  if (y > -6 && y < -4.6 && Math.abs(x) < 1.2) return 'y';
  if (inOval(x, y, -4.2, -5, 1, 0.6) || inOval(x, y, 4.2, -5, 1, 0.6)) return 'p';
  return inOval(x, y, 0, -6.4, 4.6, 4) ? 'l' : null;
};

const chickLook: Figure['look'] = (x, y, shut) => {
  const hat = chickHatAt(x, y);
  if (hat) return hat;
  if (y > -1.6 && y < -0.2 && (inOval(x, y, -2.4, -0.9, 2, 0.9) || inOval(x, y, 2.4, -0.9, 2, 0.9))) return 'f';
  const fluff = 6.6 + 0.6 * Math.sin(Math.atan2(y + 6.5, x) * 9);
  if (!inOval(x, y, 0, -6.5, fluff, 6.6)) return null;
  return chickFaceAt(x, y, shut) ?? (y > -3 || x > 4 ? 'C' : 'c');
};

const scaledFigure = (name: string, look: Figure['look'], w: number, h: number, s: number): Figure => ({
  name: `${name}@${s}`,
  look: (x, y, shut) => look(x / s, y / s, shut),
  w: Math.ceil(w * s),
  h: Math.ceil(h * s),
});

// Every figure at one size: the look is drawn for a 44-pixel penguin and enlarged by `s`, so parts stay in proportion.
type Cast = { readonly s: number; readonly hats: Readonly<Record<Hat, Figure>>; readonly chick: Figure };
const castOf = (s: number): Cast => ({
  s,
  hats: {
    cap: scaledFigure('pc-cap', penguinLook('cap'), 26, 58, s),
    bowler: scaledFigure('pc-bowler', penguinLook('bowler'), 26, 58, s),
    beanie: scaledFigure('pc-beanie', penguinLook('beanie'), 26, 58, s),
    none: scaledFigure('pc-none', penguinLook('none'), 26, 58, s),
  },
  chick: scaledFigure('pc-chick', chickLook, 16, 20, s),
});
const WIDE_CAST = castOf(1.2);
const TALL_CAST = castOf(1.5);
const castFor = (f: Frame): Cast => (f.w > f.h ? WIDE_CAST : TALL_CAST);

// Three coats of tie and hat, each palette bound once per color set.
const coat = (c: Colors<K>, tie: string, hat: string): Palette => ({
  o: c.ink,
  k: c.back,
  K: c.backHi,
  u: c.belly,
  U: c.bellyLo,
  w: c.ink,
  e: c.ink,
  g: c.belly,
  y: c.beak,
  Y: c.blush,
  f: c.beak,
  p: c.blush,
  t: tie,
  T: mixHex(tie, c.ink, 0.35),
  h: hat,
  H: c.wallHi,
  B: c.ink,
});
const COATS: readonly ((c: Colors<K>) => Palette)[] = [
  (c) => coat(c, c.tie1, c.cap1),
  (c) => coat(c, c.tie2, c.cap2),
  (c) => coat(c, c.tie3, c.cap3),
];
const coatOf = (c: Colors<K>, i: number): Palette => paletteOf(c, COATS[i % COATS.length] as (c: Colors<K>) => Palette);
const chickPalette = (c: Colors<K>): Palette => ({
  o: c.ink,
  c: c.chick,
  C: c.chickLo,
  l: c.belly,
  w: c.ink,
  e: c.ink,
  g: c.belly,
  y: c.beak,
  f: c.beak,
  p: c.blush,
  h: c.tie3,
  H: c.wallHi,
  B: mixHex(c.tie3, c.ink, 0.3),
});

// ---- layout: rows of the car, and who stands where ----

type Rows = 'ceil' | 'rack' | 'winTop' | 'winBot' | 'seat' | 'floor' | 'feet' | 'bar';
const WIDE: Plan<Rows> = {
  ceil: ['h', 0.07],
  rack: ['h', 0.15],
  winTop: ['h', 0.2],
  winBot: ['h', 0.56],
  seat: ['h', 0.63],
  floor: ['h', 0.79],
  feet: ['h', 0.955],
  bar: ['h', 0.3],
};
const TALL: Plan<Rows> = {
  ceil: ['h', 0.035],
  rack: ['h', 0.15],
  winTop: ['h', 0.18],
  winBot: ['h', 0.6],
  seat: ['h', 0.68],
  floor: ['h', 0.83],
  feet: ['h', 0.965],
  bar: ['h', 0.715],
};
const rowsOf = (f: Frame): Readonly<Record<Rows, number>> => planOf(f, WIDE, TALL);

type Role = 'bopper' | 'reader' | 'dozer' | 'nudged' | 'parent';
type Rider = { readonly at: number; readonly hat: Hat; readonly coat: number; readonly role: Role; readonly hand: 1 | -1 };

const WIDE_RIDERS: readonly Rider[] = [
  { at: 0.09, hat: 'cap', coat: 0, role: 'bopper', hand: 1 },
  { at: 0.255, hat: 'bowler', coat: 1, role: 'reader', hand: -1 },
  { at: 0.42, hat: 'beanie', coat: 2, role: 'dozer', hand: -1 },
  { at: 0.585, hat: 'cap', coat: 1, role: 'nudged', hand: 1 },
  { at: 0.75, hat: 'none', coat: 0, role: 'parent', hand: -1 },
  { at: 0.915, hat: 'bowler', coat: 2, role: 'bopper', hand: 1 },
];
const TALL_RIDERS: readonly Rider[] = [
  { at: 0.14, hat: 'bowler', coat: 1, role: 'reader', hand: -1 },
  { at: 0.38, hat: 'beanie', coat: 2, role: 'dozer', hand: -1 },
  { at: 0.62, hat: 'cap', coat: 0, role: 'nudged', hand: -1 },
  { at: 0.86, hat: 'none', coat: 1, role: 'parent', hand: -1 },
];
const ridersOf = (f: Frame): readonly Rider[] => (f.w > f.h ? WIDE_RIDERS : TALL_RIDERS);

// ---- the view: sky, far towers, near blocks and line poles, each sliding past at its own speed ----

// The sun low over the city, or after dark a small moon with a faint halo; neither shows behind rain clouds.
const paintSun = (g: Ctx, x: number, y: number, span: readonly [number, number], c: Colors<K>): void => {
  if (c.sun === c.sky1) return;
  const night = isDark(c.sky0);
  const reach = night ? 0.4 : 1;
  drawGlow(g, c.sun, x, y, Math.round(span[0] * 0.22 * reach), Math.round(span[1] * 0.5 * reach), night ? 0.5 : 0.8, 4);
  disc(g, x, y, night ? 5 : 7, () => c.sun);
};

const skyLayer = (f: Frame, r: Readonly<Record<Rows, number>>, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('pc-sky', f, c, (g) => {
    const span = r.winBot - r.winTop;
    g.drawImage(ditherGradient(f.w, r.winBot, [c.sky0, c.sky1, c.sky2]), 0, 0);
    paintSun(g, Math.round(f.w * 0.72), Math.round(r.winTop + span * 0.3), [f.w, span], c);
  });

type Blocks = { readonly w: number; readonly h: number; readonly seed: number; readonly min: number; readonly max: number };

// A sign panel on a near building: blank but for light stripes, haloed after dark.
const paintSign = (g: Ctx, x: number, bw: number, top: number, sign: string, c: Colors<K>): void => {
  const sw = Math.min(bw - 2, 5);
  if (isDark(c.sky0)) drawGlow(g, sign, x + 2 + Math.floor(sw / 2), top + 12, sw + 6, 14, 0.4, 3);
  const stripe = mixHex(sign, c.lamp, 0.5);
  const parts: readonly (readonly [string, number, number, number, number])[] = [
    [c.near, 1, 4, sw + 2, 16],
    [sign, 2, 5, sw, 14],
    [stripe, 3, 7, sw - 2, 1],
    [stripe, 3, 11, sw - 2, 1],
    [stripe, 3, 15, sw - 2, 1],
  ];
  for (const [color, dx, dy, w, h] of parts) fillRect(g, color, x + dx, top + dy, Math.max(1, w), h);
};

type Lit = {
  readonly x: number;
  readonly w: number;
  readonly top: number;
  readonly bottom: number;
  readonly step: number;
  readonly share: number;
  readonly seed: number;
};

// A grid of windows, some of them lit.
const paintLit = (g: Ctx, l: Lit, color: string): void => {
  for (let y = l.top + 2; y < l.bottom; y += l.step)
    for (let k = l.x + 1; k < l.x + l.w - 1; k += l.step) if (rand(k * 7 + y, l.seed) < l.share) fillRect(g, color, k, y, 1, 1);
};

// One building of a tile: its body, a lit window every few pixels, and now and then a sign or a roof tank.
const paintBlock = (g: Ctx, x: number, bw: number, top: number, b: Blocks, i: number, c: Colors<K>, near: boolean): void => {
  const body = near ? c.mid : c.far;
  const lit = near ? c.midLit : c.farLit;
  fillRect(g, body, x, top, bw, b.h - top);
  paintLit(g, { x, w: bw, top, bottom: b.h - 1, step: near ? 3 : 2, share: near ? 0.45 : 0.3, seed: b.seed + i }, lit);
  if (near && rand(i, b.seed + 5) < 0.5) paintSign(g, x, bw, top, rand(i, b.seed + 6) < 0.5 ? c.ad1 : c.ad2, c);
  if (!near && rand(i, b.seed + 7) < 0.3) fillRect(g, body, x + 2, top - 3, 3, 3);
};

const blocksLayer = (b: Blocks, c: Colors<K>, near: boolean): HTMLCanvasElement =>
  memoLayer(`pc-blocks:${b.w}x${b.h}:${b.seed}:${near}:${colorKey(c)}`, b.w, b.h, (g) => {
    for (let x = 0, i = 0; x < b.w; i++) {
      const bw = Math.min(b.w - x, Math.round(b.min + rand(i, b.seed) * (b.max - b.min)));
      const top = Math.round(b.h * (0.15 + rand(i, b.seed + 1) * 0.75));
      paintBlock(g, x, bw, top, b, i, c, near);
      x += bw + (near ? 2 + Math.floor(rand(i, b.seed + 3) * 6) : 0);
    }
  });

const POLE_PITCH = 170;

const view = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const r = rowsOf(f);
  ctx.drawImage(skyLayer(f, r, c), 0, 0);
  const span = r.winBot - r.winTop;
  const farH = Math.round(span * 0.55);
  const midH = Math.round(span * 0.8);
  tileX(ctx, blocksLayer({ w: 200, h: farH, seed: 11, min: 6, max: 16 }, c, false), f.t * 6, r.winBot - farH, f.w);
  tileX(ctx, blocksLayer({ w: 240, h: midH, seed: 23, min: 12, max: 26 }, c, true), f.t * 28, r.winBot - midH + 6, f.w);
  for (let x = -wrap(f.t * 150, POLE_PITCH); x < f.w; x += POLE_PITCH) {
    fillRect(ctx, c.near, Math.round(x), r.winTop, 4, span);
    fillRect(ctx, c.near, Math.round(x) - 6, r.winTop + 6, 16, 2);
  }
  for (const y of [r.winTop + 3, r.winTop + 9]) fillRect(ctx, c.near, 0, y, f.w, 1);
};

// ---- the car: one cached layer with the windows cut out of it ----

type R = Readonly<Record<Rows, number>>;
const WINDOW_W = 72;
const PILLAR_W = 14;
const windowXs = (w: number): readonly number[] => {
  const pitch = WINDOW_W + PILLAR_W;
  const first = Math.round(((w - pitch) / 2) % pitch) - pitch;
  return Array.from({ length: Math.ceil(w / pitch) + 2 }, (_, i) => first + i * pitch);
};

const paintCeiling = (g: Ctx, f: Frame, r: R, c: Colors<K>): void => {
  fillRect(g, c.ceil, 0, 0, f.w, r.ceil);
  fillRect(g, c.wallLo, 0, r.ceil, f.w, 1);
  for (let x = 8; x < f.w; x += 96) {
    fillRect(g, c.wallLo, x - 1, r.ceil - 6, 50, 5);
    fillRect(g, c.lamp, x, r.ceil - 5, 48, 3);
  }
};

// Hanging cards, blank but for a bright picture: a sun over a sea, or a fish.
const paintCards = (g: Ctx, f: Frame, r: R, c: Colors<K>): void => {
  const ch = Math.min(28, r.rack - r.ceil - 6);
  if (ch < 8) return;
  const cw = Math.round(ch * 1.5);
  for (let i = 0, x = 22; x + cw < f.w; i++, x += cw + 30) {
    const y = r.ceil + 3;
    fillRect(g, c.steel, x + 3, r.ceil, 1, 3);
    fillRect(g, c.steel, x + cw - 4, r.ceil, 1, 3);
    fillRect(g, c.ink, x, y, cw, ch);
    fillRect(g, c.wallHi, x + 1, y + 1, cw - 2, ch - 2);
    const tone = i % 2 === 0 ? c.ad1 : c.ad2;
    fillRect(g, tone, x + 2, y + 2, cw - 4, Math.round(ch * 0.55));
    disc(g, x + Math.round(cw * 0.65), y + Math.round(ch * 0.32), Math.max(1, Math.round(ch / 7)), () => c.lamp);
    for (let k = 0; k < 3; k++) fillRect(g, c.wallLo, x + 3, y + Math.round(ch * 0.68) + k * 2, cw - 8 - k * 5, 1);
  }
};

// The luggage rack, with a briefcase, a bundle and a shopping bag with a fish tail poking out of it.
const paintRack = (g: Ctx, f: Frame, r: R, c: Colors<K>): void => {
  const brown = mixHex(c.cap1, c.ink, 0.2);
  for (let x = 30; x < f.w - 30; x += 120) {
    fillRect(g, c.ink, x, r.rack - 7, 16, 7);
    fillRect(g, brown, x + 1, r.rack - 6, 14, 6);
    fillRect(g, c.ink, x + 5, r.rack - 9, 6, 2);
    fillRect(g, c.ink, x + 50, r.rack - 8, 12, 8);
    fillRect(g, c.ad1, x + 51, r.rack - 7, 10, 7);
    fillRect(g, c.lamp, x + 54, r.rack - 9, 4, 2);
    fillRect(g, c.ink, x + 84, r.rack - 9, 11, 9);
    fillRect(g, c.wallHi, x + 85, r.rack - 8, 9, 8);
    fillRect(g, c.steel, x + 88, r.rack - 12, 2, 4);
    fillRect(g, c.steel, x + 86, r.rack - 13, 6, 1);
  }
  fillRect(g, c.ink, 0, r.rack, f.w, 3);
  for (let x = 0; x < f.w; x += 2) fillRect(g, c.steelHi, x, r.rack + 1, 1, 1);
  fillRect(g, c.steel, 0, r.rack + 3, f.w, 1);
};

const paintWindows = (g: Ctx, f: Frame, r: R, c: Colors<K>): void => {
  const h = r.winBot - r.winTop;
  const sash = r.winTop + Math.round(h * 0.3);
  for (const x of windowXs(f.w)) {
    fillRect(g, c.wallLo, x - 2, r.winTop - 2, WINDOW_W + 4, h + 4);
    fillRect(g, c.wallHi, x - 2, r.winBot + 2, WINDOW_W + 4, 1);
    g.clearRect(x, r.winTop, WINDOW_W, h);
    fillRect(g, c.wallLo, x, sash, WINDOW_W, 2);
    fillRect(g, c.wallHi, x, sash, WINDOW_W, 1);
    for (let y = r.winTop; y < r.winBot; y++) {
      const off = Math.round((y - r.winTop) * 0.6);
      fillDither(g, c.glass, 0.2, x + wrap(44 - off, WINDOW_W - 6), y, 6, 1);
    }
  }
};

const paintBench = (g: Ctx, f: Frame, r: R, c: Colors<K>): void => {
  const back = r.seat - 12;
  fillRect(g, c.ink, 0, back - 1, f.w, 1);
  fillRect(g, c.seatLo, 0, back, f.w, r.seat - back);
  fillRect(g, c.seat, 0, back + 1, f.w, r.seat - back - 3);
  for (let x = 6; x < f.w; x += 18) fillRect(g, c.seatLo, x, back + 2, 1, r.seat - back - 5);
  fillRect(g, c.ink, 0, r.seat, f.w, 1);
  fillRect(g, c.seat, 0, r.seat + 1, f.w, 6);
  fillRect(g, mixHex(c.seat, c.lamp, 0.3), 0, r.seat + 1, f.w, 1);
  fillRect(g, c.seatLo, 0, r.seat + 6, f.w, 2);
  fillRect(g, c.wallLo, 0, r.seat + 8, f.w, r.floor - r.seat - 8);
  for (let x = 4; x < f.w; x += 6) fillRect(g, mixHex(c.wallLo, c.ink, 0.3), x, r.seat + 12, 3, r.floor - r.seat - 16);
};

const paintFloor = (g: Ctx, f: Frame, r: R, c: Colors<K>): void => {
  fillRect(g, c.ink, 0, r.floor, f.w, 1);
  fillRect(g, c.floor, 0, r.floor + 1, f.w, f.h - r.floor);
  for (let k = 1, y = r.floor + 3; y < f.h; k++, y += 2 + k * 2) fillRect(g, c.floorLo, 0, y, f.w, 1);
};

const carLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('pc-car', f, c, (g) => {
    const r = rowsOf(f);
    fillRect(g, c.wall, 0, 0, f.w, f.h);
    paintCeiling(g, f, r, c);
    paintCards(g, f, r, c);
    paintRack(g, f, r, c);
    paintWindows(g, f, r, c);
    paintBench(g, f, r, c);
    paintFloor(g, f, r, c);
  });

const car = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(carLayer(f, c), 0, 0);
};

// ---- motion: the car sways a full bar each way and settles on every beat; the sleeper nods off over two bars ----

const leanOf = (beat: number): number => 0.06 * Math.sin((Math.PI * beat) / 2);
const squashOf = (beat: number): number => {
  const p = frac(beat);
  return p < 0.12 ? 2 : p < 0.3 ? 1 : 0;
};
const NOD = 8;
// 0 awake … 1 slumped on the neighbour; the sleeper jolts awake just before every second bar.
const dozeOf = (beat: number): number => {
  const q = wrap(beat, NOD) / NOD;
  return q > 0.94 ? 0 : smooth(0.1, 0.86, q);
};
const wokenOf = (beat: number): boolean => {
  const q = wrap(beat, NOD);
  return q > NOD - 0.45 || q < 0.7;
};

const DOZE_TILT = { wide: 0.46, tall: 0.26 } as const;

const poseOf = (rd: Rider, f: Frame, i: number): Pose => {
  const lean = leanOf(f.beat);
  const squash = squashOf(f.beat);
  const blink = blinking(f.t, 41 + i * 13);
  const slump = dozeOf(f.beat) * (f.w > f.h ? DOZE_TILT.wide : DOZE_TILT.tall);
  if (rd.role === 'dozer') {
    const woken = wokenOf(f.beat);
    return { squash: woken ? squash : 0, tilt: lean + slump, shut: !woken };
  }
  if (rd.role === 'nudged') return { squash, tilt: lean + slump * 0.3, shut: blink };
  if (rd.role === 'bopper') return { squash, tilt: lean * 1.6, shut: blink };
  return { squash, tilt: lean, shut: blink };
};

// ---- the overhead rail and its straps; the held ones end where a flipper grips them ----

const RING: Sprite = ['.ooooo.', 'oorrroo', 'or...ro', 'or...ro', 'oorrroo', '.ooooo.'];
const ringPalette = (c: Colors<K>): Palette => ({ o: c.ink, r: c.strap });

// Where the strap above a rider ends: its ring hangs level with the hat, swinging a beat behind the car.
const gripOf = (f: Frame, r: R, cast: Cast, x: number, hand: number): Pt => {
  const y = r.feet - Math.round(47 * cast.s);
  const swing = Math.round((y - r.bar) * leanOf(f.beat - 0.4) * 0.9);
  return [Math.round(x + hand * 15 * cast.s) + swing, y];
};

const strap = (ctx: Ctx, c: Colors<K>, top: number, [gx, gy]: Pt, from: number): void => {
  pixelLine(ctx, from, top, gx, gy - 6, c.ink);
  pixelLine(ctx, from + 1, top, gx + 1, gy - 6, c.strap);
  fillRect(ctx, c.ink, gx - 1, gy - 7, 4, 2);
  drawSprite(ctx, RING, paletteOf(c, ringPalette), gx - 3, gy - 5);
};

const rail = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const r = rowsOf(f);
  const cast = castFor(f);
  const riders = ridersOf(f);
  if (f.w > f.h) for (let x = 40; x < f.w; x += 110) fillRect(ctx, c.steel, x, r.rack + 4, 2, r.bar - r.rack - 4);
  fillRect(ctx, c.ink, 0, r.bar - 1, f.w, 4);
  fillRect(ctx, c.steel, 0, r.bar, f.w, 2);
  fillRect(ctx, c.steelHi, 0, r.bar, f.w, 1);
  const spareY = r.feet - Math.round(51 * cast.s);
  const ends = riders.map((rd) => Math.round(f.w * rd.at + rd.hand * 15 * cast.s));
  riders.forEach((rd, i) => {
    const x = Math.round(f.w * rd.at);
    const g = gripOf(f, r, cast, x, rd.hand);
    strap(ctx, c, r.bar + 2, g, ends[i] ?? x);
    // A spare strap hangs free wherever two held ones are far apart.
    const gap = (ends[i + 1] ?? f.w + 40) - (ends[i] ?? 0);
    const half = Math.round(gap / 2);
    if (gap > 26) strap(ctx, c, r.bar + 2, [g[0] + half, spareY], (ends[i] ?? x) + half);
  });
};

// ---- weather on the glass, and light sweeping down the car ----

// Rain streaks the glass, blown back by the speed of the train; only the windows show it.
const weather = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  if (c.drop === c.sky0) return;
  rain(ctx, f, c.drop, { count: Math.round(f.w * 0.5), len: 4, slant: 1.6, speed: 70, seed: 5 });
  const r = rowsOf(f);
  for (let i = 0; i < f.w / 3; i++) {
    const x = Math.floor(rand(i, 61) * f.w);
    const y = r.winTop + Math.floor(rand(i, 62) * (r.winBot - r.winTop));
    fillRect(ctx, c.drop, x, y, 1, 2);
    fillRect(ctx, c.glass, x, y, 1, 1);
  }
};

const SWEEP = 8;

// Every two bars a band of light from a gap between buildings runs back along the car, over riders and all.
const sweep = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const r = rowsOf(f);
  const q = wrap(f.beat, SWEEP) / SWEEP;
  const lean = 0.55;
  const x0 = f.w + 20 - q * (f.w + f.h * lean + 80);
  for (let y = r.rack + 4; y < f.h; y += 2) {
    const x = Math.round(x0 + (y - r.rack) * lean);
    fillDither(ctx, c.light, 0.32, x, y, 30, 2);
    fillDither(ctx, c.light, 0.16, x + 36, y, 10, 2);
  }
};

// ---- the riders ----

type Spot = { readonly x: number; readonly feet: number; readonly pose: Pose; readonly cast: Cast };

// A point of the penguin (in its own unscaled coordinates) on the canvas.
const at = (sp: Spot, x: number, y: number): Pt => {
  const [px, py] = placeOf(sp.pose, x * sp.cast.s, y * sp.cast.s);
  return [sp.x + px, sp.feet + py];
};

// A flipper: a paddle tapering from the shoulder to a round tip.
const flipper = (ctx: Ctx, c: Colors<K>, sp: Spot, from: Pt, to: Pt): void =>
  taper(ctx, from, to, 2.3 * sp.cast.s, 1.2 * sp.cast.s, c.back, c.ink);

// The folded paper, held up at the chest: columns of grey dashes that never quite become words.
const paper = (ctx: Ctx, c: Colors<K>, sp: Spot, hand: number, f: Frame): void => {
  const w = Math.round(15 * sp.cast.s);
  const h = Math.round(12 * sp.cast.s);
  const [cx, cy] = at(sp, -hand * 3, -20);
  const x = Math.round(cx - w / 2);
  const y = Math.round(cy - h / 2) + (frac(f.beat / 4) < 0.1 ? 1 : 0);
  fillRect(ctx, c.ink, x - 1, y - 1, w + 2, h + 2);
  fillRect(ctx, c.paper, x, y, w, h);
  fillRect(ctx, c.paperLo, x + Math.floor(w / 2), y, 1, h);
  for (let k = 0; k < h - 3; k += 2)
    for (const col of [x + 2, x + Math.floor(w / 2) + 2])
      fillRect(ctx, c.paperLo, col, y + 2 + k, Math.max(2, Math.floor(w / 2) - 4 - ((k * 3 + col) % 3)), 1);
  flipper(ctx, c, sp, at(sp, -hand * 11, -27), [x + (hand < 0 ? w : 0), y + Math.round(h / 2)]);
};

// The sleeper's bubble swells and shrinks with each breath, and pops when it jolts awake.
const bubble = (ctx: Ctx, c: Colors<K>, sp: Spot, f: Frame): void => {
  if (!sp.pose.shut) return;
  const [bx, by] = at(sp, 3, -28);
  const r = Math.round(1 + sp.cast.s * (1.4 + 1.4 * Math.sin(f.t * 2.4)));
  disc(ctx, bx + r, by, r + 1, () => c.ink);
  disc(ctx, bx + r, by, r, () => c.ad2);
  fillRect(ctx, c.lamp, bx + r - 1, by - Math.max(0, r - 2), 1, 1);
};

// The neighbour's sweat drop as the sleeper leans in.
const DROP: Sprite = ['..o..', '.oso.', 'osSso', 'ossso', '.ooo.'];
const dropPalette = (c: Colors<K>): Palette => ({ o: c.ink, s: c.ad2, S: c.lamp });

const sweat = (ctx: Ctx, c: Colors<K>, sp: Spot, f: Frame): void => {
  if (dozeOf(f.beat) < 0.5) return;
  const [x, y] = at(sp, 8.5, -38);
  drawSprite(ctx, DROP, paletteOf(c, dropPalette), x - 2, y - 2);
};

// The chick rides on its parent's feet, hopping a little after each beat.
const chick = (ctx: Ctx, c: Colors<K>, sp: Spot, f: Frame): void => {
  const hop = frac(f.beat + 0.5) < 0.2 ? 1 : 0;
  const pose = { squash: squashOf(f.beat + 0.5), tilt: -leanOf(f.beat) * 0.5, shut: blinking(f.t, 77) };
  drawFigure(
    ctx,
    sp.cast.chick,
    paletteOf(c, chickPalette),
    pose,
    sp.x + Math.round(3 * sp.cast.s),
    sp.feet - Math.round(2 * sp.cast.s) - hop,
  );
};

// Earbuds with a grey cable running down to a pocket (a coloured one reads as a cut): these two share the track.
const earbuds = (ctx: Ctx, c: Colors<K>, sp: Spot, hand: number): void => {
  const [ex, ey] = at(sp, -hand * 11, -33);
  const [px, py] = at(sp, -hand * 6, -14);
  pixelLine(ctx, ex, ey + 2, px, py, c.steel);
  fillRect(ctx, c.ink, ex - 1, ey - 1, 3, 3);
  fillRect(ctx, c.lamp, ex, ey, 1, 1);
};

const extras = (ctx: Ctx, c: Colors<K>, sp: Spot, rd: Rider, f: Frame): void => {
  if (rd.role === 'bopper') earbuds(ctx, c, sp, rd.hand);
  if (rd.role === 'reader') paper(ctx, c, sp, rd.hand, f);
  else flipper(ctx, c, sp, at(sp, -rd.hand * 11, -27), at(sp, -rd.hand * 14.5, -17));
  if (rd.role === 'dozer') bubble(ctx, c, sp, f);
  if (rd.role === 'nudged') sweat(ctx, c, sp, f);
  if (rd.role === 'parent') chick(ctx, c, sp, f);
};

const drawRider = (ctx: Ctx, f: Frame, c: Colors<K>, rd: Rider, i: number): void => {
  const r = rowsOf(f);
  const cast = castFor(f);
  const sp: Spot = { x: Math.round(f.w * rd.at), feet: r.feet, pose: poseOf(rd, f, i), cast };
  fillDither(ctx, c.floorLo, 0.75, sp.x - Math.round(13 * cast.s), sp.feet - 1, Math.round(26 * cast.s), 3);
  drawFigure(ctx, cast.hats[rd.hat], coatOf(c, rd.coat), sp.pose, sp.x, sp.feet);
  const grip = gripOf(f, r, cast, sp.x, rd.hand);
  flipper(ctx, c, sp, at(sp, rd.hand * 10, -27), [grip[0], grip[1] + 1]);
  extras(ctx, c, sp, rd, f);
};

// On a tall screen the bench behind shows too, with three smaller riders seated on it: one nods along with its eyes
// shut, one taps at a glowing phone, one just sways.
type Sitter = { readonly at: number; readonly hat: Hat; readonly coat: number; readonly kind: 'nod' | 'phone' | 'sway' };
const SITTERS: readonly Sitter[] = [
  { at: 0.26, hat: 'cap', coat: 2, kind: 'phone' },
  { at: 0.5, hat: 'none', coat: 1, kind: 'nod' },
  { at: 0.74, hat: 'beanie', coat: 0, kind: 'sway' },
];

const phone = (ctx: Ctx, c: Colors<K>, sp: Spot, f: Frame): void => {
  const [x, y] = at(sp, 0, -17);
  flipper(ctx, c, sp, at(sp, -11, -26), [x - 2, y + 2]);
  fillRect(ctx, c.ink, x - 3, y - 4, 7, 9);
  fillRect(ctx, frac(f.beat / 2) < 0.5 ? c.ad2 : c.glass, x - 2, y - 3, 5, 7);
  flipper(ctx, c, sp, at(sp, 11, -26), [x + 3, y + 2]);
};

const seated = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  if (f.w > f.h) return;
  const r = rowsOf(f);
  for (const [i, st] of SITTERS.entries()) {
    const nod = st.kind === 'nod' ? (frac(f.beat) < 0.3 ? 0.08 : 0) : 0;
    const pose = { squash: 0, tilt: leanOf(f.beat) * 0.7 + nod, shut: st.kind === 'nod' || blinking(f.t, 90 + i) };
    const sp: Spot = { x: Math.round(f.w * st.at), feet: r.seat + 4, pose, cast: WIDE_CAST };
    drawFigure(ctx, WIDE_CAST.hats[st.hat], coatOf(c, st.coat), pose, sp.x, sp.feet);
    if (st.kind === 'phone') phone(ctx, c, sp, f);
  }
};

// The sleeper is drawn after its neighbour, so its head lands on the neighbour's shoulder.
const riders = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const list = ridersOf(f);
  const order = [...list.keys()].sort((a, b) => Number(list[a]?.role === 'dozer') - Number(list[b]?.role === 'dozer'));
  for (const i of order) drawRider(ctx, f, c, list[i] as Rider, i);
};

export const penguinCommute = defineScene<K>({
  id: 'penguin-commute',
  title: 'Penguin Commute',
  mood: { valence: 0.3, energy: 0.1 },
  styles: ['technopop', 'city-groove', 'nineties-pop', 'vocal-electro', 'lofi-loop'],
  variants: [
    {
      mood: { valence: 0.45, energy: 0.1 },
      colors: {
        sky0: '#8fc6ea',
        sky1: '#f6dca6',
        sky2: '#ffb46a',
        sun: '#fff6cc',
        far: '#c99c92',
        farLit: '#ffe4b4',
        mid: '#86708e',
        midLit: '#ffd27a',
        near: '#4c3c56',
        glass: '#fff8e4',
        drop: '#8fc6ea',
        wall: '#ece4cf',
        wallLo: '#c7b9a0',
        wallHi: '#fffaf0',
        ceil: '#f4eedf',
        lamp: '#ffffff',
        seat: '#4b70b2',
        seatLo: '#324f88',
        floor: '#a68a6e',
        floorLo: '#7f6750',
        steel: '#9ca6b2',
        steelHi: '#eef4fa',
        strap: '#e9e3d4',
        ad1: '#ff9eaa',
        ad2: '#96d0f0',
        light: '#fff1bc',
        ink: '#261c2a',
        back: '#2d3550',
        backHi: '#58668e',
        belly: '#fdfaf2',
        bellyLo: '#d6d0c8',
        beak: '#ffa63a',
        blush: '#ff8a96',
        tie1: '#d8404a',
        tie2: '#3a6ad0',
        tie3: '#e8b030',
        cap1: '#7a5a3e',
        cap2: '#3c3c50',
        cap3: '#c84a5a',
        paper: '#ece6d6',
        paperLo: '#a8a294',
        chick: '#bcbcc8',
        chickLo: '#8a8a9c',
      },
    },
    {
      mood: { valence: -0.05, energy: -0.3 },
      colors: {
        sky0: '#353a58',
        sky1: '#5a6182',
        sky2: '#8c88a2',
        sun: '#5a6182',
        far: '#4a4c68',
        farLit: '#b8a46c',
        mid: '#2c2e46',
        midLit: '#ffcc6a',
        near: '#1a1a2a',
        glass: '#aebcd4',
        drop: '#cad6ec',
        wall: '#d6cebf',
        wallLo: '#a49a8c',
        wallHi: '#f2ecdf',
        ceil: '#e2dacb',
        lamp: '#fffbe6',
        seat: '#3d5c9a',
        seatLo: '#293f74',
        floor: '#7a6756',
        floorLo: '#5a4a3c',
        steel: '#8a92a2',
        steelHi: '#dde4ee',
        strap: '#e0dace',
        ad1: '#ee8a9a',
        ad2: '#78b6de',
        light: '#ffe2a6',
        ink: '#1d1726',
        back: '#272d46',
        backHi: '#4d5a7c',
        belly: '#f6f2ea',
        bellyLo: '#c8c2bc',
        beak: '#f29a36',
        blush: '#f07a8c',
        tie1: '#c83a4a',
        tie2: '#4a72c8',
        tie3: '#e2aa2e',
        cap1: '#6e5440',
        cap2: '#3a3a4c',
        cap3: '#3e7a6a',
        paper: '#e6e0d0',
        paperLo: '#9e988a',
        chick: '#b6b6c4',
        chickLo: '#86869a',
      },
    },
    {
      mood: { valence: 0.35, energy: 0.6 },
      colors: {
        sky0: '#0b0a22',
        sky1: '#211546',
        sky2: '#4a2366',
        sun: '#eee6ff',
        far: '#1e1a44',
        farLit: '#6c5cba',
        mid: '#151030',
        midLit: '#ffd25e',
        near: '#07061a',
        glass: '#9a88f0',
        drop: '#0b0a22',
        wall: '#c9cbdc',
        wallLo: '#9192ac',
        wallHi: '#eceefa',
        ceil: '#d8d9e8',
        lamp: '#ffffff',
        seat: '#7a3c8c',
        seatLo: '#542a66',
        floor: '#5e5672',
        floorLo: '#443e58',
        steel: '#8a90a8',
        steelHi: '#e6ecff',
        strap: '#e4e2f0',
        ad1: '#ff4fa8',
        ad2: '#3ef0ff',
        light: '#ff7ad6',
        ink: '#140f22',
        back: '#242a48',
        backHi: '#5a5c9a',
        belly: '#f8f6ff',
        bellyLo: '#c6c4dc',
        beak: '#ffa23a',
        blush: '#ff7aa6',
        tie1: '#ff4f7a',
        tie2: '#3ac6e8',
        tie3: '#f2c23a',
        cap1: '#5c4a6a',
        cap2: '#30304a',
        cap3: '#d0447a',
        paper: '#e8e6f2',
        paperLo: '#a09eb4',
        chick: '#bab8cc',
        chickLo: '#8886a2',
      },
    },
  ],
  layers: [view, weather, car, sweep, seated, rail, riders],
});
