// A conveyor-belt sushi bar run by sea otters: the chef sets a fresh plate on the belt on the beat, plates of tuna,
// salmon, egg and roe ride past the customers on their stools, who snatch them up and munch with their eyes shut,
// one stacking empties into a wobbling tower, while tea steams, lanterns sway and fish drift in the tank behind.
import { type Ctx, drawSprite, fillRect, flipped, type Palette, type Sprite } from 'mojipx';
import { cached, disc, ditherGradient, fillColumns, frac, pixelLine, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { type Box, drawGlow, fillDither } from './batch-1-helpers.ts';
import { paletteOf } from './batch-3-helpers.ts';
import { mixHex } from './batch-5-helpers.ts';
import { frameLayer } from './batch-6-helpers.ts';
import { blinking } from './batch-7-helpers.ts';
import { type Plan, planOf } from './batch-9-helpers.ts';
import { outlined, spriteOf } from './batch-12-helpers.ts';
import { drawFigure, eyeAt, type Figure, inOval, type Pose, type Pt, placeOf, taper, whiskers } from './batch-13-helpers.ts';

type K =
  | 'beam'
  | 'wall'
  | 'wallLo'
  | 'wallHi'
  | 'tank0'
  | 'tank1'
  | 'weed'
  | 'fish1'
  | 'fish2'
  | 'bubble'
  | 'door'
  | 'noren'
  | 'norenLo'
  | 'mark'
  | 'lantern'
  | 'lanternLo'
  | 'glow'
  | 'counter'
  | 'counterLo'
  | 'counterHi'
  | 'steel'
  | 'steelHi'
  | 'belt'
  | 'beltLo'
  | 'plate1'
  | 'plate2'
  | 'plate3'
  | 'rice'
  | 'tuna'
  | 'salmon'
  | 'egg'
  | 'roe'
  | 'nori'
  | 'ink'
  | 'fur'
  | 'furLo'
  | 'face'
  | 'faceLo'
  | 'nose'
  | 'blush'
  | 'coat'
  | 'coatLo'
  | 'band'
  | 'tea'
  | 'teaLo'
  | 'steam';

// ---- the otters: o outline, b/B body fur and its light chest, h/H head and its shade, m muzzle puffs, n nose,
// d whisker dots, w/e/g eyes, p blush, r ribbon or scarf, c/C the chef's coat and its collar, k headband. Their arms
// are drawn apart, so they can reach for the belt. ----

type Dress = 'plain' | 'bow' | 'scarf' | 'chef';

const OTTER_EYES = [
  { x: -5.6, y: -32, rx: 1.6, ry: 2 },
  { x: 5.6, y: -32, rx: 1.6, ry: 2 },
] as const;
const HEAD = { x: 0, y: -30.5, rx: 12.8, ry: 9.6 } as const;
const inHead = (x: number, y: number): boolean => inOval(x, y, HEAD.x, HEAD.y, HEAD.rx, HEAD.ry);

const muzzleAt = (x: number, y: number): string | null => {
  if (inOval(x, y, 0, -28.4, 2.6, 1.6) && y > -30) return x < -0.8 && y < -28.8 ? 'g' : 'n';
  if (y > -26 && y < -24.4 && Math.abs(x) < 0.6) return 'n';
  if (!inOval(x, y, -2.9, -25.8, 3.7, 2.8) && !inOval(x, y, 2.9, -25.8, 3.7, 2.8)) return null;
  const dot = (Math.abs(Math.round(x)) === 3 || Math.abs(Math.round(x)) === 5) && Math.round(y) === -25;
  return dot ? 'd' : 'm';
};

const headAt = (x: number, y: number, shut: boolean): string | null => {
  for (const eye of OTTER_EYES) {
    const hit = eyeAt(x, y, eye, shut, true);
    if (hit) return hit;
  }
  const muzzle = muzzleAt(x, y);
  if (muzzle) return muzzle;
  if (inOval(x, y, -8.6, -27.4, 1.8, 1) || inOval(x, y, 8.6, -27.4, 1.8, 1)) return 'p';
  return x > 6 && y > -27 ? 'H' : 'h';
};

// A ribbon on one ear, a knitted scarf, or the chef's headband knotted at the side.
const bowAt = (x: number, y: number): string | null =>
  inOval(x, y, -13.5, -38, 2.4, 1.8) || inOval(x, y, -9, -40.5, 2.4, 1.8) ? 'r' : null;

const scarfAt = (x: number, y: number): string | null =>
  (y > -21.5 && y < -17.5 && Math.abs(x) < 11) || (x > 3 && x < 7 && y >= -17.5 && y < -9) ? 'r' : null;

const knotAt = (x: number, y: number): boolean =>
  inOval(x, y, 13.4, -36.8, 2, 1.6) || (x > 12 && x < 16 && y > -36 && y < -31 && Math.abs(x - 13.4 + (y + 36) * 0.3) < 1);

const bandAt = (x: number, y: number): string | null => {
  if (inHead(x, y) && y > -38 && y < -35.6) return 'k';
  return knotAt(x, y) ? 'r' : null;
};

const DRESSES: Readonly<Record<Dress, (x: number, y: number) => string | null>> = {
  plain: () => null,
  bow: bowAt,
  scarf: scarfAt,
  chef: bandAt,
};

const bodyAt = (dress: Dress, x: number, y: number): string | null => {
  if (!inOval(x, y, 0, dress === 'chef' ? 0 : -6, 13.5, dress === 'chef' ? 21 : 15)) return null;
  if (dress === 'chef') {
    const open = (-10 - y) * 0.55 - Math.abs(x);
    return open > 0.8 ? 'B' : open > -0.6 ? 'C' : 'c';
  }
  return inOval(x, y, 0, -7, 8, 10) ? 'B' : 'b';
};

const otterLook =
  (dress: Dress): Figure['look'] =>
  (x, y, shut) => {
    const worn = DRESSES[dress](x, y);
    if (worn) return worn;
    if (inHead(x, y)) return headAt(x, y, shut);
    if (inOval(x, y, -11, -36.5, 2.2, 2) || inOval(x, y, 11, -36.5, 2.2, 2)) return 'b';
    return bodyAt(dress, x, y);
  };

// The chef stands while the customers sit, so the chef's look is lifted this much above the counter.
const STAND = 8;

const scaled = (dress: Dress, s: number): Figure => {
  const look = otterLook(dress);
  const lift = dress === 'chef' ? STAND : 0;
  return {
    name: `os-${dress}@${s}`,
    look: (x, y, shut) => look(x / s, y / s + lift, shut),
    w: Math.ceil(34 * s),
    h: Math.ceil((46 + lift) * s),
  };
};

// Every otter at one size: the look is drawn for a 46-pixel otter and enlarged by `s`.
type Cast = { readonly s: number; readonly dress: Readonly<Record<Dress, Figure>> };
const castOf = (s: number): Cast => ({
  s,
  dress: { plain: scaled('plain', s), bow: scaled('bow', s), scarf: scaled('scarf', s), chef: scaled('chef', s) },
});
const WIDE_CAST = castOf(1.15);
const TALL_CAST = castOf(1.45);
const castFor = (f: Frame): Cast => (f.w > f.h ? WIDE_CAST : TALL_CAST);

// One coat per otter, each palette bound once per color set.
const coat = (c: Colors<K>, fur: string, ribbon: string): Palette => ({
  o: c.ink,
  b: fur,
  B: mixHex(fur, c.face, 0.4),
  h: c.face,
  H: c.faceLo,
  m: mixHex(c.face, c.coat, 0.65),
  n: c.nose,
  g: c.coat,
  d: c.faceLo,
  w: c.ink,
  e: c.ink,
  p: c.blush,
  r: ribbon,
  c: c.coat,
  C: c.coatLo,
  k: c.band,
});
const COATS: readonly ((c: Colors<K>) => Palette)[] = [
  (c) => coat(c, c.fur, c.blush),
  (c) => coat(c, c.furLo, c.band),
  (c) => coat(c, mixHex(c.fur, c.face, 0.3), c.tuna),
  (c) => coat(c, c.fur, c.tuna),
];
const coatOf = (c: Colors<K>, i: number): Palette => paletteOf(c, COATS[i % COATS.length] as (c: Colors<K>) => Palette);

// ---- layout ----

type Rows = 'beam' | 'tankTop' | 'tankBot' | 'counter' | 'belt' | 'front' | 'loop' | 'ledge';
const WIDE: Plan<Rows> = {
  beam: ['h', 0.045],
  tankTop: ['h', 0.09],
  tankBot: ['h', 0.5],
  counter: ['h', 0.645],
  belt: ['h', 0.7],
  front: ['h', 0.75],
  loop: ['h', 0],
  ledge: ['h', 0.87],
};
const TALL: Plan<Rows> = {
  beam: ['h', 0.03],
  tankTop: ['h', 0.12],
  tankBot: ['h', 0.5],
  counter: ['h', 0.66],
  belt: ['h', 0.695],
  front: ['h', 0.725],
  loop: ['h', 0.79],
  ledge: ['h', 0.9],
};
type R = Readonly<Record<Rows, number>>;
const rowsOf = (f: Frame): R => planOf(f, WIDE, TALL);

type Seat = { readonly at: number; readonly dress: Dress; readonly coat: number; readonly stacker: boolean };
const WIDE_SEATS: readonly Seat[] = [
  { at: 0.12, dress: 'bow', coat: 0, stacker: false },
  { at: 0.31, dress: 'plain', coat: 2, stacker: false },
  { at: 0.69, dress: 'scarf', coat: 1, stacker: false },
  { at: 0.88, dress: 'plain', coat: 3, stacker: true },
];
const TALL_SEATS: readonly Seat[] = [
  { at: 0.17, dress: 'bow', coat: 0, stacker: false },
  { at: 0.83, dress: 'scarf', coat: 1, stacker: true },
];
const seatsOf = (f: Frame): readonly Seat[] => (f.w > f.h ? WIDE_SEATS : TALL_SEATS);
const CHEF_AT = 0.5;

// ---- the room: a beam, plank walls, two fish tanks either side of the kitchen door (one cached layer) ----

const doorOf = (f: Frame, r: R): Box => {
  const half = Math.round(f.w * (f.w > f.h ? 0.085 : 0.15));
  const x = Math.round(f.w * CHEF_AT) - half;
  return { x, y: r.tankTop, w: half * 2, h: r.counter - r.tankTop };
};

const tanksOf = (f: Frame, r: R): readonly Box[] => {
  const door = doorOf(f, r);
  const gap = Math.round(f.w * 0.03);
  const h = r.tankBot - r.tankTop;
  return [
    { x: gap, y: r.tankTop, w: door.x - gap * 2, h },
    { x: door.x + door.w + gap, y: r.tankTop, w: f.w - door.x - door.w - gap * 2, h },
  ];
};

const paintPlanks = (g: Ctx, f: Frame, r: R, c: Colors<K>): void => {
  fillRect(g, c.wall, 0, 0, f.w, r.counter);
  for (let x = 0; x < f.w; x += 12) {
    fillRect(g, c.wallLo, x, r.beam, 1, r.counter - r.beam);
    fillRect(g, c.wallHi, x + 1, r.beam, 1, r.counter - r.beam);
  }
  fillRect(g, c.ink, 0, 0, f.w, r.beam + 1);
  fillRect(g, c.beam, 0, 0, f.w, r.beam);
  fillRect(g, mixHex(c.beam, c.wallHi, 0.25), 0, r.beam - 2, f.w, 1);
};

const paintTank = (g: Ctx, t: Box, c: Colors<K>): void => {
  fillRect(g, c.ink, t.x - 3, t.y - 3, t.w + 6, t.h + 6);
  fillRect(g, c.beam, t.x - 2, t.y - 2, t.w + 4, t.h + 4);
  g.drawImage(ditherGradient(t.w, t.h, [c.tank0, c.tank1]), t.x, t.y);
  const sand = Math.max(3, Math.round(t.h * 0.12));
  fillColumns(g, t.x + t.w, t.y + t.h, c.counterHi, (x) => (x < t.x ? t.y + t.h : t.y + t.h - sand - Math.sin(x * 0.3) * 1.5));
  for (const [k, size] of [
    [0.08, 3],
    [0.14, 2],
    [0.9, 3],
  ] as const) {
    const rx = t.x + Math.round(t.w * k);
    disc(g, rx, t.y + t.h - sand, size, (dy) => (dy < -1 ? c.wallLo : c.beam));
  }
  fillRect(g, mixHex(c.tank0, c.steam, 0.5), t.x, t.y, t.w, 1);
  for (let y = t.y + 2; y < t.y + Math.min(t.h * 0.35, 40); y++)
    fillDither(g, c.steam, 0.18, t.x + 4 + Math.round((y - t.y) * 0.6), y, 3, 1);
};

const paintDoor = (g: Ctx, d: Box, c: Colors<K>): void => {
  fillRect(g, c.ink, d.x - 3, d.y - 3, d.w + 6, d.h + 3);
  fillRect(g, c.beam, d.x - 2, d.y - 2, d.w + 4, d.h + 2);
  g.drawImage(ditherGradient(d.w, d.h, [c.door, mixHex(c.door, c.wallLo, 0.5)]), d.x, d.y);
  const shelf = d.y + Math.round(d.h * 0.62);
  fillRect(g, c.wallLo, d.x, shelf, d.w, 2);
  for (let x = d.x + 3; x < d.x + d.w - 4; x += 7) {
    fillRect(g, c.ink, x, shelf - 5, 5, 5);
    fillRect(g, x % 2 === 0 ? c.plate2 : c.coat, x + 1, shelf - 4, 3, 4);
  }
};

const roomLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('os-room', f, c, (g) => {
    const r = rowsOf(f);
    paintPlanks(g, f, r, c);
    for (const t of tanksOf(f, r)) paintTank(g, t, c);
    paintDoor(g, doorOf(f, r), c);
  });

const room = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(roomLayer(f, c), 0, 0);
};

// ---- what moves in the room: fish, bubbles and weed in the tanks, the noren, the lanterns ----

const FISH: Sprite = ['o...ooo..', 'oo.ofFfo.', 'ofoffffeo', 'oo.offfo.', 'o...ooo..'];
const FISH_LEFT = flipped(FISH);
const fishPalette =
  (tone: 'fish1' | 'fish2') =>
  (c: Colors<K>): Palette => ({
    o: c.ink,
    f: c[tone],
    F: mixHex(c[tone], c.steam, 0.5),
    e: c.ink,
  });
const FISH_TONES = [fishPalette('fish1'), fishPalette('fish2')] as const;

// A back-and-forth swim: 0 … 1 … 0, and which way the fish faces.
const swimOf = (t: number, period: number): { readonly u: number; readonly right: boolean } => {
  const p = frac(t / period);
  return { u: p < 0.5 ? p * 2 : 2 - p * 2, right: p < 0.5 };
};

const weed = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, bottom: number, h: number): void => {
  for (let y = 0; y < h; y++) {
    const sway = Math.round(Math.sin(f.t * 1.4 + x * 0.7 - y * 0.25) * Math.min(2, y * 0.15));
    fillRect(ctx, y % 4 < 2 ? c.weed : mixHex(c.weed, c.tank1, 0.4), x + sway, bottom - y, 2, 1);
  }
};

const fishes = (ctx: Ctx, f: Frame, c: Colors<K>, t: Box, i: number): void => {
  for (let k = 0; k < 3; k++) {
    const swim = swimOf(f.t + rand(k, i) * 20, 9 + k * 3);
    const x = t.x + 2 + Math.round(swim.u * (t.w - 13));
    const y = t.y + Math.round(t.h * (0.2 + 0.2 * k)) + Math.round(Math.sin(f.t * 1.7 + k) * 2);
    drawSprite(ctx, swim.right ? FISH : FISH_LEFT, paletteOf(c, FISH_TONES[(k + i) % 2] as (c: Colors<K>) => Palette), x, y);
  }
};

// Bubbles rise from the sand, wobbling, the bigger ones every other column.
const bubbles = (ctx: Ctx, f: Frame, c: Colors<K>, t: Box, sand: number, i: number): void => {
  for (let k = 0; k < 4; k++) {
    const rise = frac(f.t * 0.25 + rand(k, i + 7));
    const size = 1 + (k % 2);
    const x = t.x + Math.round(t.w * (0.1 + 0.25 * k) + Math.sin(f.t * 3 + k));
    fillRect(ctx, c.bubble, x, Math.round(sand - rise * (sand - t.y - 2)), size, size);
  }
};

const tankLife = (ctx: Ctx, f: Frame, c: Colors<K>, t: Box, i: number): void => {
  const sand = t.y + t.h - Math.max(3, Math.round(t.h * 0.12));
  weed(ctx, f, c, t.x + Math.round(t.w * 0.25), sand, Math.round(t.h * 0.45));
  weed(ctx, f, c, t.x + Math.round(t.w * 0.75), sand, Math.round(t.h * 0.3));
  fishes(ctx, f, c, t, i);
  bubbles(ctx, f, c, t, sand, i);
};

// The noren over the kitchen door: three indigo panels with a pale fish across them, their hems swaying.
const noren = (ctx: Ctx, f: Frame, c: Colors<K>, d: Box): void => {
  const h = Math.round(d.h * 0.36);
  const pw = Math.floor((d.w + 2) / 3);
  fillRect(ctx, c.ink, d.x - 4, d.y - 2, d.w + 8, 3);
  for (let i = 0; i < 3; i++) {
    const x0 = d.x + i * pw;
    const sway = Math.sin(f.t * 1.2 + i * 1.3) * 1.6;
    for (let y = 0; y < h; y++) {
      const dx = Math.round((sway * y) / h);
      const hem = y > h - 4;
      fillRect(ctx, c.ink, x0 + dx, d.y + 1 + y, pw - 1, 1);
      fillRect(ctx, hem ? c.norenLo : c.noren, x0 + dx + 1, d.y + 1 + y, pw - 3, 1);
    }
  }
  emblem(ctx, c, d.x + Math.round(d.w / 2), d.y + Math.round(h * 0.48), Math.max(4, Math.round(h * 0.22)));
};

// A fish leaping in a ring, in pale dye.
const emblem = (ctx: Ctx, c: Colors<K>, cx: number, cy: number, r: number): void => {
  disc(ctx, cx, cy, r, () => c.mark);
  disc(ctx, cx, cy, r - 1, () => c.noren);
  for (let dx = -r + 2; dx <= r - 3; dx++) {
    const half = Math.round(Math.sqrt(Math.max(0, 1 - (dx / (r - 2)) ** 2)) * (r * 0.32));
    fillRect(ctx, c.mark, cx + dx, cy - half, 1, half * 2 + 1);
  }
  fillRect(ctx, c.mark, cx - r + 1, cy - 2, 1, 5);
  fillRect(ctx, c.mark, cx - r + 2, cy - 1, 1, 3);
  fillRect(ctx, c.noren, cx + Math.round(r * 0.4), cy - 1, 1, 1);
};

const lanternsOf = (f: Frame): readonly number[] => (f.w > f.h ? [0.215, 0.785] : [0.14, 0.86]);

// Paper lanterns on cords from the beam, swinging gently; after dark they glow and warm the planks around them.
const lantern = (ctx: Ctx, f: Frame, c: Colors<K>, cx: number, i: number): void => {
  const r = rowsOf(f);
  const s = castFor(f).s;
  const cord = Math.round(10 * s);
  const swing = Math.round(Math.sin(f.t * 1.3 + i * 2) * 2);
  const w = Math.round(13 * s);
  const h = Math.round(16 * s);
  const x = cx + swing - Math.floor(w / 2);
  const y = r.beam + cord;
  if (c.glow !== c.wallHi) drawGlow(ctx, c.glow, cx + swing, y + h / 2, w * 1.7, h * 1.2, 0.28 + f.kick * 0.12, 3);
  pixelLine(ctx, cx, r.beam, cx + swing, y, c.ink);
  const ox = x + w / 2;
  const ry = h / 2;
  for (let k = 0; k < h; k++) {
    const dy = (k + 0.5 - ry) / ry;
    const half = Math.round((w / 2) * Math.sqrt(Math.max(0, 1 - dy * dy * 0.75)));
    const rib = k % 3 === 1 && k > 1 && k < h - 2;
    fillRect(ctx, c.ink, Math.round(ox - half - 1), y + k, half * 2 + 2, 1);
    fillRect(ctx, rib ? c.lanternLo : c.lantern, Math.round(ox - half), y + k, half * 2, 1);
    if (!rib) fillRect(ctx, mixHex(c.lantern, c.steam, 0.45), Math.round(ox - half * 0.5), y + k, 1, 1);
  }
  fillRect(ctx, c.ink, Math.round(ox - w * 0.3), y - 2, Math.round(w * 0.6), 3);
  fillRect(ctx, c.ink, Math.round(ox - w * 0.3), y + h - 1, Math.round(w * 0.6), 3);
};

const decor = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const r = rowsOf(f);
  for (const [i, t] of tanksOf(f, r).entries()) tankLife(ctx, f, c, t, i);
  noren(ctx, f, c, doorOf(f, r));
  for (const [i, at] of lanternsOf(f).entries()) lantern(ctx, f, c, Math.round(f.w * at), i);
};

// ---- the sushi: a plate seen from just above with two pieces on it. o outline, P/Q/p plate, its well and its
// shadowed rim, i/I rice, t/T tuna, s/S salmon and its fat lines, y/Y egg, n/N nori, r/R roe. ----

type Kind = 'tuna' | 'salmon' | 'egg' | 'roe' | 'empty';
const KINDS: readonly Kind[] = ['tuna', 'salmon', 'egg', 'roe'];

const plateAt = (x: number, y: number): string | null => {
  if (!inOval(x, y, 0, -2.4, 7.6, 2.4)) return null;
  if (inOval(x, y, 0, -2.8, 5, 1.3)) return 'Q';
  return y > -1.4 ? 'p' : 'P';
};

const toppingAt = (kind: Kind, x: number, y: number, cx: number): string => {
  if (kind === 'tuna') return y < -6.6 ? 'T' : 't';
  if (kind === 'salmon') return frac((x - cx) * 0.45 - y * 0.35) < 0.28 ? 'S' : 's';
  return Math.abs(x - cx) < 0.8 ? 'n' : y < -6.6 ? 'Y' : 'y';
};

// A nori-wrapped boat heaped with roe.
const boatAt = (x: number, y: number, cx: number): string | null => {
  if (inOval(x, y, cx, -6.9, 2.6, 1.1)) return (Math.round(x) + Math.round(y)) % 2 === 0 ? 'R' : 'r';
  if (Math.abs(x - cx) < 2.7 && y > -6.9 && y < -3) return x - cx < -1.4 ? 'N' : 'n';
  return null;
};

// One piece at cx: nigiri (rice under a slab) or a roe boat.
const pieceAt = (kind: Kind, x: number, y: number, cx: number): string | null => {
  if (kind === 'roe') return boatAt(x, y, cx);
  if (inOval(x, y, cx, -6, 3.1, 1.6) && y < -5) return toppingAt(kind, x, y, cx);
  if (inOval(x, y, cx, -4.6, 2.7, 1.8)) return y > -3.8 ? 'I' : 'i';
  return null;
};

const sushiLook = (kind: Kind, x: number, y: number): string | null => {
  if (kind !== 'empty') {
    for (const cx of [-3.2, 3.2]) {
      const hit = pieceAt(kind, x, y, cx);
      if (hit) return hit;
    }
  }
  return plateAt(x, y);
};

const plates = new Map<string, Sprite>();
const plateSprite = (kind: Kind, s: number): Sprite =>
  cached(plates, 16, `${kind}@${s}`, () => {
    const w = Math.ceil(17 * s);
    const h = Math.ceil(10 * s);
    const body = spriteOf(w, h, (col, row) => sushiLook(kind, (col + 0.5 - w / 2) / s, (row + 0.5 - h) / s) ?? '.');
    return outlined(body, 'o');
  });

// Three plate colors, each palette bound once per color set.
const dish = (c: Colors<K>, plate: string): Palette => ({
  o: c.ink,
  P: plate,
  Q: mixHex(plate, c.steam, 0.55),
  p: mixHex(plate, c.ink, 0.25),
  i: c.rice,
  I: mixHex(c.rice, c.beltLo, 0.5),
  t: c.tuna,
  T: mixHex(c.tuna, c.steam, 0.35),
  s: c.salmon,
  S: mixHex(c.salmon, c.steam, 0.6),
  y: c.egg,
  Y: mixHex(c.egg, c.steam, 0.5),
  n: c.nori,
  N: mixHex(c.nori, c.weed, 0.5),
  r: c.roe,
  R: mixHex(c.roe, c.steam, 0.5),
});
const DISHES: readonly ((c: Colors<K>) => Palette)[] = [(c) => dish(c, c.plate1), (c) => dish(c, c.plate2), (c) => dish(c, c.plate3)];
const dishOf = (c: Colors<K>, n: number): Palette => paletteOf(c, DISHES[Math.floor(rand(n, 3) * 3)] as (c: Colors<K>) => Palette);
const kindOf = (n: number): Kind => KINDS[Math.floor(rand(n, 4) * KINDS.length)] as Kind;

// Draws a plate with its bottom centre at (x, y).
const drawPlate = (ctx: Ctx, c: Colors<K>, s: number, kind: Kind, n: number, x: number, y: number): void => {
  const sprite = plateSprite(kind, s);
  drawSprite(ctx, sprite, dishOf(c, n), Math.round(x - (sprite[0] ?? '').length / 2), Math.round(y - sprite.length + 1));
};

// ---- the belt: a slot passes the chef every two beats, carrying its plate left to right ----

const SLOT = 2;
const pitchOf = (f: Frame): number => (f.w > f.h ? 30 : 36);

// The chef (seat -1) and the customers, in the order the belt passes them.
type Station = { readonly x: number; readonly seat: number };
const stationsOf = (f: Frame): readonly Station[] =>
  [{ x: Math.round(f.w * CHEF_AT), seat: -1 }, ...seatsOf(f).map((st, i) => ({ x: Math.round(f.w * st.at), seat: i }))].sort(
    (a, b) => a.x - b.x,
  );

// Some plates come round from the far end; the rest of the slots arrive empty for the chef to fill.
const circulating = (n: number): boolean => rand(n, 5) < 0.4;
const picks = (n: number, seat: number): boolean => rand(n, 40 + seat) < 0.42;

/** Whether slot n still carries a plate at belt position x: the chef fills it, and any customer it passes may take it. */
const heldAt = (f: Frame, n: number, x: number): boolean => {
  let full = circulating(n);
  for (const st of stationsOf(f)) if (st.x <= x) full = st.seat < 0 || (full && !picks(n, st.seat));
  return full;
};

const slotX = (f: Frame, n: number): number => Math.round(f.w * CHEF_AT + (f.beat / SLOT - n) * pitchOf(f));
/** The slot at (or just past) belt position x now, as a fraction: its whole part is the slot's number. */
const slotAt = (f: Frame, x: number): number => f.beat / SLOT - (x - f.w * CHEF_AT) / pitchOf(f);

// At every seat on the near ledge: a hot-water tap, a box of chopsticks, a soy bottle and a box of ginger.
const paintAmenities = (g: Ctx, x: number, y: number, s: number, c: Colors<K>): void => {
  const u = (n: number): number => Math.round(n * s);
  fillRect(g, c.ink, x - u(14), y - u(7), u(5) + 2, u(3) + 2);
  fillRect(g, c.steel, x - u(14) + 1, y - u(7) + 1, u(5), u(3));
  fillRect(g, c.ink, x - u(14) + 1, y - u(4) + 1, u(2) + 2, u(3));
  fillRect(g, c.steelHi, x - u(14) + 2, y - u(7) + 1, u(4), 1);
  fillRect(g, c.ink, x - u(6) - 1, y - u(5) - 1, u(6) + 2, u(5) + 1);
  fillRect(g, c.beam, x - u(6), y - u(5), u(6), u(5));
  for (const k of [1, 3]) fillRect(g, c.counterHi, x - u(6) + u(k), y - u(8), 1, u(3));
  fillRect(g, c.ink, x + u(3) - 1, y - u(8) - 1, u(4) + 2, u(8) + 1);
  fillRect(g, mixHex(c.beam, c.ink, 0.3), x + u(3), y - u(6), u(4), u(6));
  fillRect(g, c.lantern, x + u(3), y - u(8), u(4), u(2));
  fillRect(g, c.steam, x + u(3) + 1, y - u(5), 1, u(3));
  fillRect(g, c.ink, x + u(9) - 1, y - u(5) - 1, u(8) + 2, u(5) + 1);
  fillRect(g, c.counterHi, x + u(9), y - u(5), u(8), u(5));
  fillRect(g, c.counterLo, x + u(9), y - u(4), u(8), 1);
  fillRect(g, mixHex(c.plate1, c.steam, 0.3), x + u(10), y - u(5), u(3), 1);
};

const paintFront = (g: Ctx, f: Frame, r: R, c: Colors<K>): void => {
  fillRect(g, c.ink, 0, r.front, f.w, 1);
  fillRect(g, c.counterLo, 0, r.front + 1, f.w, f.h - r.front);
  fillRect(g, c.counter, 0, r.front + 1, f.w, 2);
  for (let x = 5; x < f.w; x += 9) fillRect(g, mixHex(c.counterLo, c.beam, 0.3), x, r.front + 4, 1, r.ledge - r.front - 6);
  fillRect(g, c.ink, 0, r.ledge - 1, f.w, 1);
  fillRect(g, c.counter, 0, r.ledge, f.w, 4);
  fillRect(g, c.counterHi, 0, r.ledge, f.w, 1);
  fillRect(g, c.ink, 0, r.ledge + 4, f.w, 1);
  fillRect(g, mixHex(c.counterLo, c.beam, 0.5), 0, r.ledge + 5, f.w, f.h - r.ledge - 5);
  const s = castFor(f).s;
  for (const st of seatsOf(f)) paintAmenities(g, Math.round(f.w * st.at), r.ledge, s, c);
};

// The near counter's bands from its back edge to the belt's front rail: [color, top, height].
const bandsOf = (r: R, c: Colors<K>): readonly (readonly [string, number, number])[] => [
  [c.ink, r.counter - 1, 1],
  [c.counter, r.counter, r.belt - r.counter],
  [c.counterHi, r.counter, 1],
  [c.steel, r.belt - 2, 2],
  [c.steelHi, r.belt - 2, 1],
  [c.ink, r.front - 4, 1],
  [c.steel, r.front - 3, 3],
  [c.steelHi, r.front - 3, 1],
];

const counterLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('os-counter', f, c, (g) => {
    const r = rowsOf(f);
    for (const [color, y, h] of bandsOf(r, c)) fillRect(g, color, 0, y, f.w, h);
    paintFront(g, f, r, c);
  });

const counter = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(counterLayer(f, c), 0, 0);
};

// The belt's slats creep along with the plates; on it ride whatever plates are still aboard.
const belt = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const r = rowsOf(f);
  const s = castFor(f).s;
  const pitch = pitchOf(f);
  const top = r.belt;
  const bh = r.front - 4 - top;
  fillRect(ctx, c.belt, 0, top, f.w, bh);
  const shift = Math.round((f.beat / SLOT) * pitch);
  for (let x = (shift % 6) - 6; x < f.w; x += 6) fillRect(ctx, c.beltLo, x, top, 1, bh);
  const first = Math.floor(slotAt(f, f.w + pitch));
  for (let n = first; n <= Math.ceil(slotAt(f, -pitch)); n++) {
    const x = slotX(f, n);
    if (heldAt(f, n, x)) drawPlate(ctx, c, s, kindOf(n), n, x, top + bh - 1);
  }
};

// ---- the customers: each takes some of the plates passing it, munches with its eyes shut and stacks the empties ----

/** Whether the customer at seat `seat` (at x) takes slot n: it must still carry a plate when it gets there. */
const takes = (f: Frame, n: number, seat: number, x: number): boolean => picks(n, seat) && heldAt(f, n, x - 1);

type Act = { readonly does: 'idle' } | { readonly does: 'reach'; readonly to: number } | { readonly does: 'eat'; readonly n: number };

const REACH = 0.6;
const MUNCH = 1.7;

const actOf = (f: Frame, seat: number, x: number): Act => {
  const u = slotAt(f, x);
  const n0 = Math.floor(u);
  if ((u - n0) * SLOT < MUNCH && takes(f, n0, seat, x)) return { does: 'eat', n: n0 };
  if ((n0 + 1 - u) * SLOT < REACH && takes(f, n0 + 1, seat, x)) return { does: 'reach', to: slotX(f, n0 + 1) };
  return { does: 'idle' };
};

const CYCLE = 64;

// Plates eaten since the table was last cleared (every sixteen bars); the stacker never stops.
const eatenOf = (f: Frame, seat: number, x: number): number => {
  const now = Math.floor(slotAt(f, x) - MUNCH / SLOT);
  const start = Math.floor(f.beat / CYCLE) * CYCLE;
  const from = Math.floor(start / SLOT - (x - f.w * CHEF_AT) / pitchOf(f));
  let count = 0;
  for (let n = from + 1; n <= now; n++) if (takes(f, n, seat, x)) count++;
  return count;
};

type Spot = { readonly x: number; readonly base: number; readonly pose: Pose; readonly s: number; readonly lift: number };

// A point of the otter (in its own unscaled coordinates) on the canvas.
const at = (sp: Spot, x: number, y: number): Pt => {
  const [px, py] = placeOf(sp.pose, x * sp.s, (y - sp.lift) * sp.s);
  return [sp.x + px, sp.base + py];
};

const arm = (ctx: Ctx, c: Colors<K>, sp: Spot, fur: string, from: Pt, to: Pt, paw = fur): void => {
  taper(ctx, from, to, 2.4 * sp.s, 2 * sp.s, fur, c.ink);
  disc(ctx, to[0], to[1], Math.max(1, Math.round(sp.s)), () => mixHex(paw, c.ink, 0.35));
};

// A single piece held up to the mouth, nibbled smaller as the munching goes on.
const bite = (ctx: Ctx, c: Colors<K>, kind: Kind, x: number, y: number, left: number): void => {
  const w = Math.max(2, Math.round(6 * left));
  const top = kind === 'tuna' ? c.tuna : kind === 'salmon' ? c.salmon : kind === 'egg' ? c.egg : c.roe;
  fillRect(ctx, c.ink, x - 1, y - 1, w + 2, 6);
  fillRect(ctx, kind === 'roe' ? c.nori : c.rice, x, y + 2, w, 3);
  fillRect(ctx, top, x, y, w, 2);
};

const paws = (ctx: Ctx, c: Colors<K>, sp: Spot, act: Act, f: Frame, fur: string): void => {
  const r = rowsOf(f);
  const rest: Pt = [sp.x + Math.round(7 * sp.s), r.counter + 2];
  if (act.does === 'eat') {
    const age = (slotAt(f, sp.x) - act.n) * SLOT;
    const [mx, my] = at(sp, 0, -21);
    bite(ctx, c, kindOf(act.n), mx - 3, my - 2, 1 - age / MUNCH);
    arm(ctx, c, sp, fur, at(sp, -9, -14), [mx - 4, my + 2]);
    arm(ctx, c, sp, fur, at(sp, 9, -14), [mx + 4, my + 2]);
    return;
  }
  arm(ctx, c, sp, fur, at(sp, 9, -14), rest);
  const reach: Pt = act.does === 'reach' ? [act.to, r.belt + 2] : [sp.x - Math.round(7 * sp.s), r.counter + 2];
  arm(ctx, c, sp, fur, at(sp, -9, -14), reach);
};

const PLATE_TONES: readonly ('plate1' | 'plate2' | 'plate3')[] = ['plate1', 'plate2', 'plate3'];

// Empties seen from the side, two pixels each; the stacker's tower sways more the taller it grows.
const stack = (ctx: Ctx, f: Frame, c: Colors<K>, sp: Spot, st: Seat, seat: number): void => {
  const r = rowsOf(f);
  const count = st.stacker ? 5 + Math.min(14, eatenOf(f, seat, sp.x)) : Math.min(3, eatenOf(f, seat, sp.x));
  const x = sp.x + Math.round((sp.x < f.w * CHEF_AT ? 1 : -1) * 16 * sp.s);
  const w = Math.round(13 * sp.s);
  for (let k = 0; k < count; k++) {
    const sway = Math.round(Math.sin(f.t * 2.4 - k * 0.35) * k * 0.14 * (count / 8) * (1 + f.kick * 0.6));
    const y = r.belt - 3 - k * 2;
    const tone = c[PLATE_TONES[(k * 2 + seat) % 3] as 'plate1'];
    const left = x + sway - Math.floor(w / 2);
    fillRect(ctx, c.ink, left - 1, y - 1, w + 2, 1);
    fillRect(ctx, c.ink, left + 1, y, w - 2, 1);
    fillRect(ctx, tone, left, y - 1, w, 1);
    fillRect(ctx, mixHex(tone, c.ink, 0.35), left + 2, y, w - 4, 1);
    if (k === 0) fillRect(ctx, c.ink, left + 1, y + 1, w - 2, 1);
    if (k === count - 1) {
      fillRect(ctx, c.ink, left, y - 2, w, 1);
      fillRect(ctx, mixHex(tone, c.steam, 0.5), left + 3, y - 2, w - 6, 1);
    }
  }
};

// A tea cup on the counter by each customer, steam curling up from it.
const tea = (ctx: Ctx, f: Frame, c: Colors<K>, sp: Spot, seat: number): void => {
  const r = rowsOf(f);
  const x = sp.x + Math.round((sp.x < f.w * CHEF_AT ? -1 : 1) * 16 * sp.s);
  const w = Math.round(5 * sp.s);
  const h = Math.round(6 * sp.s);
  const y = r.belt - 3 - h;
  fillRect(ctx, c.ink, x - 1, y - 1, w + 2, h + 2);
  fillRect(ctx, c.tea, x, y, w, h);
  fillRect(ctx, c.teaLo, x, y + h - 2, w, 2);
  fillRect(ctx, c.weed, x, y, w, 1);
  fillRect(ctx, mixHex(c.tea, c.steam, 0.4), x + 1, y + 1, 1, h - 3);
  for (let k = 0; k < 10; k++) {
    const rise = frac(f.t * 0.35 + k / 10 + seat * 0.3);
    const sx = x + Math.floor(w / 2) + Math.round(Math.sin(rise * 7 + f.t * 2 + seat) * 2 * rise);
    if (rise < 0.8 && (k + seat) % 3 !== 0) fillRect(ctx, c.steam, sx, Math.round(y - 2 - rise * 16 * sp.s), 1, 2);
  }
};

const FUR: readonly ((c: Colors<K>) => string)[] = [(c) => c.fur, (c) => c.furLo, (c) => mixHex(c.fur, c.face, 0.3), (c) => c.fur];

type Guest = { readonly sp: Spot; readonly act: Act; readonly st: Seat; readonly seat: number };

const guestsOf = (f: Frame): readonly Guest[] => {
  const r = rowsOf(f);
  const s = castFor(f).s;
  return seatsOf(f).map((st, seat) => {
    const x = Math.round(f.w * st.at);
    const act = actOf(f, seat, x);
    const chew = act.does === 'eat' && frac(f.beat * 2) < 0.3 ? 1 : 0;
    const lean = act.does === 'reach' ? -0.08 : Math.sin((f.beat * Math.PI) / 4 + seat) * 0.03;
    const shut = act.does === 'eat' || blinking(f.t, 60 + seat);
    const pose: Pose = { squash: chew || (frac(f.beat) < 0.15 ? 1 : 0), tilt: lean, shut };
    return { sp: { x, base: r.counter + 3, pose, s, lift: 0 }, act, st, seat };
  });
};

const customers = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const cast = castFor(f);
  for (const g of guestsOf(f)) {
    drawFigure(ctx, cast.dress[g.st.dress], coatOf(c, g.st.coat), g.sp.pose, g.sp.x, g.sp.base);
    const [mx, my] = at(g.sp, 0, -26);
    whiskers(ctx, mx, my, Math.round(7 * cast.s), Math.round(8 * cast.s), mixHex(c.ink, c.face, 0.35));
  }
};

const tables = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  for (const g of guestsOf(f)) {
    stack(ctx, f, c, g.sp, g.st, g.seat);
    tea(ctx, f, c, g.sp, g.seat);
  }
};

const hands = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  for (const g of guestsOf(f)) paws(ctx, c, g.sp, g.act, f, (FUR[g.st.coat] as (c: Colors<K>) => string)(c));
};

// ---- the chef: whenever an empty slot comes by, a fresh plate goes down onto it on the beat; in between, rice is
// pressed into shape with a bob on every beat ----

const SET = 0.8;

type Chef = { readonly sp: Spot; readonly carry: number | null; readonly drop: number };

const chefOf = (f: Frame): Chef => {
  const r = rowsOf(f);
  const s = castFor(f).s;
  const u = f.beat / SLOT;
  const next = Math.floor(u) + 1;
  const wait = (next - u) * SLOT;
  const carry = !circulating(next) && wait < SET ? next : null;
  const placed = !circulating(next - 1) && (u - next + 1) * SLOT < 0.5;
  const pose: Pose = { squash: placed ? 2 : frac(f.beat) < 0.15 ? 1 : 0, tilt: 0, shut: placed };
  return { sp: { x: Math.round(f.w * CHEF_AT), base: r.counter + 3, pose, s, lift: STAND }, carry, drop: 1 - wait / SET };
};

const chef = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const { sp } = chefOf(f);
  drawFigure(ctx, castFor(f).dress.chef, coatOf(c, 3), sp.pose, sp.x, sp.base);
  const [mx, my] = at(sp, 0, -26);
  whiskers(ctx, mx, my, Math.round(7 * sp.s), Math.round(8 * sp.s), mixHex(c.ink, c.face, 0.35));
};

const sleeve = (c: Colors<K>): string => mixHex(c.coat, c.coatLo, 0.45);

// The chef's paws: lowering the plate onto the belt, or pressing a ball of rice at the chest.
const chefHands = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const r = rowsOf(f);
  const { sp, carry, drop } = chefOf(f);
  const w = Math.round(8 * sp.s);
  if (carry !== null) {
    const y = Math.round(r.counter - 4 * sp.s + drop * (r.front - 4 - r.counter + 4 * sp.s));
    drawPlate(ctx, c, sp.s, kindOf(carry), carry, sp.x, y);
    arm(ctx, c, sp, sleeve(c), at(sp, -10, -12), [sp.x - w, y - 2], c.fur);
    arm(ctx, c, sp, sleeve(c), at(sp, 10, -12), [sp.x + w, y - 2], c.fur);
    return;
  }
  const press = frac(f.beat) < 0.2 ? 1 : 0;
  const y = r.counter - Math.round(6 * sp.s) + press;
  disc(ctx, sp.x, y, Math.round(2 * sp.s), () => c.ink);
  disc(ctx, sp.x, y, Math.round(2 * sp.s) - 1, () => c.rice);
  arm(ctx, c, sp, sleeve(c), at(sp, -10, -12), [sp.x - 3 - press, y], c.fur);
  arm(ctx, c, sp, sleeve(c), at(sp, 10, -12), [sp.x + 3 + press, y], c.fur);
};

// On a tall screen the near side of the loop shows too: plates coming back the other way, a little larger.
const loopBack = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  if (f.w > f.h) return;
  const r = rowsOf(f);
  const s = castFor(f).s * 1.15;
  const pitch = Math.round(pitchOf(f) * 1.15);
  const bh = Math.round(9 * s);
  fillRect(ctx, c.ink, 0, r.loop - 4, f.w, bh + 8);
  fillRect(ctx, c.steel, 0, r.loop - 3, f.w, 2);
  fillRect(ctx, c.steelHi, 0, r.loop - 3, f.w, 1);
  fillRect(ctx, c.belt, 0, r.loop, f.w, bh);
  fillRect(ctx, c.steel, 0, r.loop + bh + 1, f.w, 2);
  fillRect(ctx, c.steelHi, 0, r.loop + bh + 1, f.w, 1);
  const u = f.beat / SLOT;
  for (let x = 5 - Math.round(frac((u * pitch) / 6) * 6); x < f.w; x += 6) fillRect(ctx, c.beltLo, x, r.loop, 1, bh);
  for (let m = Math.floor(u) - 1; m <= Math.ceil(u + f.w / pitch) + 1; m++) {
    if (rand(m, 9) >= 0.55) continue;
    const x = Math.round((m - u) * pitch);
    drawPlate(ctx, c, s, kindOf(m + 777), m + 777, x, r.loop + bh - 1);
  }
};

export const otterSushi = defineScene<K>({
  id: 'otter-sushi',
  title: 'Otter Sushi',
  mood: { valence: 0.65, energy: 0.2 },
  styles: ['summer-festival', 'kawaii-pop', 'puzzle-pop', 'island-breeze', 'cozy-village'],
  variants: [
    {
      mood: { valence: 0.75, energy: 0.35 },
      colors: {
        beam: '#5a3a2a',
        wall: '#dcbd8e',
        wallLo: '#b08d64',
        wallHi: '#f2dcb0',
        tank0: '#86dcec',
        tank1: '#2f8fbc',
        weed: '#3aa070',
        fish1: '#ff8a4a',
        fish2: '#ffd84a',
        bubble: '#eafcff',
        door: '#fff4d8',
        noren: '#2f4a8a',
        norenLo: '#22356a',
        mark: '#f4efe4',
        lantern: '#e8483e',
        lanternLo: '#a8302c',
        glow: '#f2dcb0',
        counter: '#ecd2a0',
        counterLo: '#c4a271',
        counterHi: '#fcecc8',
        steel: '#a8b4bc',
        steelHi: '#eef4f8',
        belt: '#ece6d8',
        beltLo: '#b8b0a0',
        plate1: '#ff8fa8',
        plate2: '#7cc8f0',
        plate3: '#ffd060',
        rice: '#fcfbf5',
        tuna: '#e0384a',
        salmon: '#ff8a52',
        egg: '#ffd84a',
        roe: '#ff6a2a',
        nori: '#1e2a26',
        ink: '#2a1a1a',
        fur: '#7a4a32',
        furLo: '#5a3424',
        face: '#f0dec2',
        faceLo: '#cbb08e',
        nose: '#2a1a1a',
        blush: '#ff8a8a',
        coat: '#fcfbf6',
        coatLo: '#c8ccd4',
        band: '#3a5aa8',
        tea: '#c8a07a',
        teaLo: '#9a7656',
        steam: '#ffffff',
      },
    },
    {
      mood: { valence: 0.55, energy: -0.05 },
      colors: {
        beam: '#2e1c18',
        wall: '#8a6448',
        wallLo: '#6a4a36',
        wallHi: '#a87e5a',
        tank0: '#2c7cb2',
        tank1: '#123a6a',
        weed: '#2a7a5a',
        fish1: '#ff7a4a',
        fish2: '#ffd04a',
        bubble: '#9ad8ff',
        door: '#ffcf7a',
        noren: '#2a2e6a',
        norenLo: '#1c1f4a',
        mark: '#f0e2c8',
        lantern: '#ff5a3a',
        lanternLo: '#c0362a',
        glow: '#ffb060',
        counter: '#d8ae74',
        counterLo: '#a07a4e',
        counterHi: '#f0cc90',
        steel: '#8a8c98',
        steelHi: '#e0d8c8',
        belt: '#d8ccb4',
        beltLo: '#a0927a',
        plate1: '#ff7a9a',
        plate2: '#6ab4e8',
        plate3: '#ffc04a',
        rice: '#fff6e6',
        tuna: '#e8304a',
        salmon: '#ff8048',
        egg: '#ffd040',
        roe: '#ff5a20',
        nori: '#1a2420',
        ink: '#1e1210',
        fur: '#6e4028',
        furLo: '#4e2c1c',
        face: '#ecd2b0',
        faceLo: '#c09a74',
        nose: '#1e1210',
        blush: '#ff7a7a',
        coat: '#fff4e4',
        coatLo: '#c8b8a8',
        band: '#3a4a9a',
        tea: '#b88a62',
        teaLo: '#8a6444',
        steam: '#fff4e0',
      },
    },
  ],
  layers: [room, decor, customers, chef, counter, tables, belt, loopBack, hands, chefHands],
});
