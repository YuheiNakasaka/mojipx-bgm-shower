// A tiny country station at dusk: the conductor girl swings her lantern on the beat beside a stopped two-car train
// with a cat at every window, the cats popping up in turn, while fireflies rise from rice paddies that mirror it all.
import { type Ctx, drawSprite, fillRect, flipped, type Palette, type Sprite, sizeOf } from 'mojipx';
import { ditherGradient, fillColumns, frac, hexToRgb, memoLayer, rand, ridgeNoise, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { colorKey, drawGlow, driftingClouds, fillDither, flock, wrap } from './batch-1-helpers.ts';
import { smooth } from './batch-2-helpers.ts';
import { paletteOf } from './batch-3-helpers.ts';
import { BIRD, mixHex } from './batch-5-helpers.ts';
import { frameLayer, glints, mirrorWater } from './batch-6-helpers.ts';
import { catTail, drawGirl, type Girl, limb, onBeat } from './batch-7-helpers.ts';
import { CAT_HEAD, type CatColors, catPalette, drawCatHead } from './batch-11-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sun'
  | 'star'
  | 'cloud'
  | 'cloudLo'
  | 'far'
  | 'farHi'
  | 'paddy'
  | 'leaf'
  | 'leafHi'
  | 'cream'
  | 'creamLo'
  | 'band'
  | 'roof'
  | 'window'
  | 'glow'
  | 'plank'
  | 'plankLo'
  | 'plankHi'
  | 'wall'
  | 'ink'
  | 'skin'
  | 'skinLo'
  | 'blush'
  | 'hair'
  | 'hairHi'
  | 'hairLo'
  | 'iris'
  | 'navy'
  | 'navyLo'
  | 'gold'
  | 'red'
  | 'white'
  | 'ginger'
  | 'firefly';

// ---- the conductor: o outline, c/C cap, g/G gold, v/V visor and band, h/H/d hair, s/S skin, b blush, m mouth,
// e/E/I eyes, w glint, x shirt and socks, r tie and armband, n/N uniform, k belt, W glove, f/F shoes.
// Her left arm (on the right of the picture) is drawn on its own so it can swing the lantern. ----

const GIRL: Sprite = [
  '........oooooooooooooooooo........',
  '......oocCCCccccccccccccccoo......',
  '.....ocCCccgggccggccgggccccco.....',
  '.....ocCcccccgGgvvgGgccccccco.....',
  '......occcccccccggccccccccco......',
  '......oggggggggggggggggggggo......',
  '......ovvvvvvvvvvvvvvvvvvvvo......',
  '.....ovVVVvvvvvvvvvvvvvvvvvvo.....',
  '....oddddddddddddddddddddddddo....',
  '...ohhhhhhhhhhhhhhhhhhhhhhhhhho...',
  '...ohhhhHHHhhhhhhhhhhhhHHHhhhho...',
  '..ohhhhHHhhhhhhhhhhhhhhhhHHhhhho..',
  '..ohhhhhhhhhhdhhhhhhdhhhhhhhhhho..',
  '..ohhhhhhhhdhsdhhhhdshdhhhhhhhho..',
  '..ohhhhhhhdssssdhhdssssdhhhhhhho..',
  '..ohhhhssooooossssssooooosshhhho..',
  '..ohhhhssswweesssssseewwssshhhho..',
  '..ohhhhsssweEesssssseEewssshhhho..',
  '..ohhhhssseEEesssssseEEessshhhho..',
  '..ohhhhsssEIIEssssssEIIEssshhhho..',
  '..ohhhhsbbbssssssssssssbbbshhhho..',
  '..ohhhhSssssssssmmssssssssShhhho..',
  '..ohhhhoSssssssssssssssssSohhhho..',
  '...ohhhdooSssssssssssssSoodhhho...',
  '...ohhd...ooSssssssssSoo...dhho...',
  '....ohd.....oooooooooo.....dho....',
  '.....oo.......oSSSSo.......oo.....',
  '.........oonnnxSSSSxnnnoo.........',
  '.......oonnnnnxxSSxxnnnnnoo.......',
  '......onnnnnnnxxrrxxnnnnnnno......',
  '....onnnnnnnnnnxrrxnnnnnnnnno.....',
  '...onnnNnnnnnnnxrrxnnnnnnnNo......',
  '...orrrNnnnnnnnnrrnnnnnnnnNo......',
  '...orrrNnnnnngnnrrnngnnnnnNo......',
  '...onnnNnnnnnnnnNNnnnnnnnnNo......',
  '...onnnNnnnnngnnNNnngnnnnnNo......',
  '...onnnNkkkkkkkkggkkkkkkkkNo......',
  '...ogggNnnnnnnnnNNnnnnnnnnNo......',
  '...oWWWonnNnnnNnnnnNnnnNnnno......',
  '...oWWWonnNnnnNnnnnnNnnnNnnno.....',
  '...oWWWonnNnnnnNnnnnnNnnnNnnno....',
  '...oooonnNnnnnNnnnnnnNnnnnNnno....',
  '...onnnnNnnnnNnnnnnnNnnnnNnnnno...',
  '...onnnNnnnnnNnnnnnnNnnnnnNnnno...',
  '...oooooooooooooooooooooooooooo...',
  '...........osso....osso...........',
  '...........osso....osso...........',
  '...........osso....osso...........',
  '...........osso....osso...........',
  '...........osso....osso...........',
  '...........oSso....osSo...........',
  '...........oxxo....oxxo...........',
  '...........oxxo....oxxo...........',
  '...........oxxo....oxxo...........',
  '...........oxxo....oxxo...........',
  '...........oxxo....oxxo...........',
  '..........offfo....offfo..........',
  '.........offFfo....offFfo.........',
  '.........oooooo....oooooo.........',
];

const GIRL_EYES: Girl = {
  eyes: [
    { x: 10, y: 15, out: -1, w: 4, h: 5 },
    { x: 20, y: 15, out: 1, w: 4, h: 5 },
  ],
  seed: 83,
};
const GIRL_W = 34;

// A braid hangs from behind each ear in lobes of three rows, leaning in over the shoulders and ending in a red tie.
const BRAID: Sprite = ['.ohho', 'ohHho', 'ohhdo'];
const BRAID_END: Sprite = ['.oroo', '.ohho', '..oo.'];
const BRAID_LEAN = [0, 1, 2, 3, 4, 4, 4] as const;

// The hurricane lantern hanging from her fist by its wire bail (k): o frame, K dark cap, G lit glass, F flame,
// w its white core, y brass base. The fist is gloved (W), lit from below (L).
const LANTERN: Sprite = [
  '..k.k..',
  '.k...k.',
  '.oKkKo.',
  'oKKKKKo',
  '.oGGGo.',
  'oGGFGGo',
  'oGFwFGo',
  'oGFwFGo',
  '.oGGGo.',
  'oyyyyyo',
  '.ooooo.',
];
const FIST: Sprite = ['ooooo', 'oWWWo', 'oWWWo', 'oLLLo', 'ooooo'];
// The glass sits this far below the hand.
const GLASS_DROP = 9;

// The head is drawn apart from the body so it can lean toward the raised lantern.
const HEAD_ROWS = 27;
const GIRL_HEAD = GIRL.slice(0, HEAD_ROWS);
const GIRL_BODY = GIRL.slice(HEAD_ROWS);

// A cat sitting up, below its head: o outline, f fur, l light fur, w paws.
const CAT_BODY: Sprite = ['..offffffo..', '.offllllffo.', '.offllllffo.', 'offlllllfffo', 'offlllllfffo', 'offolllofffo', '.oowooowooo.'];

const girlPalette = (c: Colors<K>): Palette => ({
  o: c.ink,
  c: c.navy,
  C: mixHex(c.navy, c.white, 0.22),
  g: c.gold,
  G: mixHex(c.gold, c.white, 0.55),
  v: c.navyLo,
  V: mixHex(c.navyLo, c.white, 0.2),
  h: c.hair,
  H: c.hairHi,
  d: c.hairLo,
  s: c.skin,
  S: c.skinLo,
  b: c.blush,
  m: mixHex(c.skinLo, c.red, 0.55),
  e: c.ink,
  E: c.iris,
  I: mixHex(c.iris, c.white, 0.5),
  w: c.white,
  x: c.white,
  r: c.red,
  n: c.navy,
  N: c.navyLo,
  k: c.ink,
  W: c.white,
  f: mixHex(c.ink, c.navyLo, 0.4),
  F: mixHex(c.navyLo, c.white, 0.25),
});
// The lantern's light: a little warmer than the station lamp, so it is the warmest point of the frame.
const warmOf = (c: Colors<K>): string => mixHex(c.glow, c.ginger, 0.35);
const lanternPalette = (c: Colors<K>): Palette => ({
  o: c.ink,
  K: mixHex(c.ink, c.gold, 0.3),
  k: mixHex(c.ink, c.gold, 0.65),
  G: mixHex(warmOf(c), c.gold, 0.2),
  F: mixHex(c.glow, c.white, 0.6),
  w: c.white,
  y: c.gold,
  W: c.white,
  L: mixHex(c.white, warmOf(c), 0.6),
});
// Where the raised lantern lights her: the edge of her hair, her cheek, and her open smile.
const litPalette = (c: Colors<K>): Palette => ({
  h: mixHex(c.hairHi, warmOf(c), 0.45),
  s: mixHex(c.skin, warmOf(c), 0.35),
  m: mixHex(c.ink, c.red, 0.45),
  t: c.blush,
});

// Five coats for the passengers, each bound once per color set.
const coat = (c: Colors<K>, fur: string, light: string, eye: string): Palette =>
  catPalette({ ink: c.ink, fur, light, pink: c.blush, eye, glint: c.white } satisfies CatColors);
const COATS: readonly ((c: Colors<K>) => Palette)[] = [
  (c) => coat(c, c.ginger, c.white, c.ink),
  (c) => coat(c, mixHex(c.ink, c.navyLo, 0.5), mixHex(c.ink, c.white, 0.35), c.gold),
  (c) => coat(c, mixHex(c.white, c.creamLo, 0.2), c.white, c.navy),
  (c) => coat(c, mixHex(c.wall, c.white, 0.35), c.white, c.ink),
  (c) => coat(c, mixHex(c.ginger, c.ink, 0.45), c.cream, c.ink),
];
const coatOf = (c: Colors<K>, i: number): Palette => paletteOf(c, COATS[i % COATS.length] as (c: Colors<K>) => Palette);

// ---- layout ----

const CAR = 132;
const GAP = 4;
const TRAIN_W = CAR * 2 + GAP;
const TRAIN_ROWS = 44;
// Rows of the train that show above the platform's far edge.
const TRAIN_SHOWN = 40;
const SILL = 28;

type Layout = {
  readonly wide: boolean;
  readonly horizon: number;
  readonly trainX: number;
  readonly trainTop: number;
  readonly platTop: number;
  readonly platEdge: number;
  readonly water: number;
  readonly girlX: number;
  readonly girlY: number;
  readonly eave: number;
  readonly shelterX: number;
  readonly lampX: number;
};

const layoutOf = (f: Frame): Layout => {
  const wide = f.w > f.h;
  const water = Math.round(f.h * (wide ? 0.79 : 0.64));
  const platEdge = water - 8;
  const platTop = platEdge - (wide ? 18 : 24);
  const trainTop = platTop - TRAIN_SHOWN;
  const shelterX = wide ? Math.round(f.w * 0.82) : f.w;
  const trainX = wide ? shelterX - TRAIN_W + 26 : 6;
  return {
    wide,
    horizon: trainTop + 2,
    trainX,
    trainTop,
    platTop,
    platEdge,
    water,
    girlX: trainX + CAR + GAP / 2 - GIRL_W / 2,
    girlY: platEdge - 2 - GIRL.length,
    eave: Math.round(f.h * (wide ? 0.14 : 0.07)),
    shelterX,
    lampX: wide ? shelterX - 6 : Math.round(f.w * 0.24),
  };
};

// Lamps glow hard after dark and only faintly by day.
const glowOf = (c: Colors<K>): number => {
  const [r, g, b] = hexToRgb(c.sky0);
  return r * 0.3 + g * 0.59 + b * 0.11 < 90 ? 1 : 0.5;
};

// ---- sky, mountains, far fields and telegraph poles (one cached layer) ----

const paintHills = (g: Ctx, f: Frame, l: Layout, c: Colors<K>): void => {
  const peak = f.w * (l.wide ? 0.3 : 0.38);
  const height = f.h * (l.wide ? 0.27 : 0.15);
  const span = f.w * (l.wide ? 0.34 : 0.8);
  fillColumns(g, f.w, l.horizon, c.farHi, (x) => l.horizon - height * 0.28 - ridgeNoise(x / 15, 3) * height * 0.3);
  const top = (x: number): number =>
    l.horizon - height * Math.max(0.12, 1 - (Math.abs(x - peak) / span) ** 1.25) - (ridgeNoise(x / 6, 8) - 0.5) * 3;
  fillColumns(g, f.w, l.horizon, c.far, top);
  // The sunward slope catches the last light along its crest.
  for (let x = 0; x < peak; x++) fillRect(g, c.farHi, x, Math.round(top(x)), 1, 1);
};

const paintFields = (g: Ctx, f: Frame, l: Layout, c: Colors<K>): void => {
  fillRect(g, mixHex(c.sky2, c.paddy, 0.5), 0, l.horizon, f.w, l.platTop - l.horizon);
  for (let k = 0, y = l.horizon + 1; y < l.platTop; k++, y += 2 + k) fillRect(g, c.leaf, 0, y, f.w, 1 + (k >> 2));
};

const POLE_PITCH = 92;

const paintPoles = (g: Ctx, f: Frame, l: Layout, c: Colors<K>): void => {
  const top = l.trainTop - Math.round(f.h * (l.wide ? 0.2 : 0.09));
  const first = wrap(l.trainX + 40, POLE_PITCH) - POLE_PITCH;
  for (let x = first; x < f.w + POLE_PITCH; x += POLE_PITCH) {
    for (let k = 0; k < POLE_PITCH; k++) {
      const sag = Math.round(Math.sin((k / POLE_PITCH) * Math.PI) * 7);
      fillRect(g, c.far, x + k, top + 2 + sag, 1, 1);
      fillRect(g, c.far, x + k, top + 6 + sag, 1, 1);
    }
    fillRect(g, c.far, x - 1, top, 2, l.platTop - top);
    fillRect(g, c.far, x - 5, top + 2, 10, 1);
    fillRect(g, c.far, x - 4, top + 6, 8, 1);
  }
};

const skyLayer = (f: Frame, l: Layout, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('ct-sky', f, c, (g) => {
    g.drawImage(ditherGradient(f.w, l.horizon, [c.sky0, c.sky1, c.sky2]), 0, 0);
    const sunX = Math.round(f.w * (l.wide ? 0.62 : 0.7));
    drawGlow(g, c.sun, sunX, l.horizon, Math.round(f.w * 0.3), Math.round(f.h * 0.12), 0.85, 5);
    paintHills(g, f, l, c);
    paintFields(g, f, l, c);
    paintPoles(g, f, l, c);
  });

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  ctx.drawImage(skyLayer(f, l, c), 0, 0);
  if (c.star !== c.sky0) stars(ctx, f.w, l.horizon, f.t, [c.star, c.white], Math.round(f.w / 6), 23, 0.5);
};

const weather = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const top = l.wide ? f.h * 0.1 : l.eave + f.h * 0.05;
  driftingClouds(ctx, f, c.cloud, c.cloudLo, { count: 4, top: top + 10, span: f.h * 0.18, size: 15, speed: 2.2, seed: 17 });
  const birds = paletteOf(c, (k) => ({ o: k.far }));
  flock(ctx, f, BIRD, birds, { count: 5, top: top + 6, span: f.h * 0.08, speed: -8, seed: 31 });
};

// ---- the train ----

// Window slots along a car from its front end: the driver's window, doors, and four bays of seats.
type Slot = { readonly x: number; readonly w: number; readonly kind: 'cab' | 'door' | 'seat' };
const SLOTS: readonly Slot[] = [
  { x: 4, w: 13, kind: 'cab' },
  { x: 21, w: 10, kind: 'door' },
  { x: 36, w: 16, kind: 'seat' },
  { x: 56, w: 16, kind: 'seat' },
  { x: 76, w: 16, kind: 'seat' },
  { x: 96, w: 16, kind: 'seat' },
  { x: 117, w: 10, kind: 'door' },
];
// The second car runs reversed, so its cab is at the far end of the train.
const slotX = (car: number, s: Slot): number => (car === 0 ? s.x : CAR + GAP + CAR - s.x - s.w);

const paintShell = (g: Ctx, x0: number, c: Colors<K>): void => {
  const roofHi = mixHex(c.roof, c.white, 0.25);
  for (const vx of [26, 62, 98]) {
    fillRect(g, c.ink, x0 + vx, 0, 12, 4);
    fillRect(g, c.roof, x0 + vx + 1, 1, 10, 3);
    fillRect(g, roofHi, x0 + vx + 1, 1, 10, 1);
  }
  fillRect(g, c.ink, x0 + 3, 3, CAR - 6, 1);
  fillRect(g, c.ink, x0 + 1, 4, CAR - 2, 5);
  fillRect(g, c.roof, x0 + 2, 4, CAR - 4, 5);
  fillRect(g, roofHi, x0 + 3, 4, CAR - 6, 1);
  fillRect(g, c.ink, x0, 9, CAR, TRAIN_ROWS - 9);
  fillRect(g, c.cream, x0 + 1, 10, CAR - 2, TRAIN_ROWS - 10);
  fillRect(g, c.band, x0 + 1, 11, CAR - 2, 1);
  fillRect(g, c.band, x0 + 1, 30, CAR - 2, 5);
  fillRect(g, mixHex(c.band, c.white, 0.3), x0 + 1, 30, CAR - 2, 1);
  fillRect(g, c.creamLo, x0 + 1, 37, CAR - 2, 1);
};

const paintSlot = (g: Ctx, x: number, s: Slot, c: Colors<K>): void => {
  const bottom = s.kind === 'door' ? 26 : SILL;
  if (s.kind === 'door') {
    fillRect(g, mixHex(c.creamLo, c.ink, 0.3), x - 2, 12, s.w + 4, TRAIN_ROWS - 12);
    fillRect(g, c.cream, x - 1, 13, s.w + 2, TRAIN_ROWS - 13);
    fillRect(g, c.band, x - 1, 30, s.w + 2, 5);
  }
  fillRect(g, c.creamLo, x - 1, 13, s.w + 2, bottom - 12);
  fillRect(g, c.window, x, 14, s.w, bottom - 14);
  fillRect(g, mixHex(c.window, c.white, 0.45), x, 14, s.w, 1);
  if (s.kind === 'seat') fillRect(g, mixHex(c.window, c.band, 0.35), x, bottom - 5, s.w, 5);
};

// The lamps: a headlight at the front of the first car and a red tail lamp at the back of the second.
const paintEnds = (g: Ctx, c: Colors<K>): void => {
  fillRect(g, c.creamLo, 1, 10, 2, TRAIN_ROWS - 10);
  fillRect(g, c.ink, 0, 30, 4, 5);
  fillRect(g, c.glow, 0, 31, 3, 3);
  fillRect(g, c.white, 1, 32, 1, 1);
  fillRect(g, c.creamLo, TRAIN_W - 3, 10, 2, TRAIN_ROWS - 10);
  fillRect(g, c.ink, TRAIN_W - 4, 30, 4, 5);
  fillRect(g, c.red, TRAIN_W - 3, 31, 3, 3);
  fillRect(g, c.ink, CAR, 5, GAP, TRAIN_ROWS - 5);
  for (let y = 6; y < TRAIN_ROWS; y += 2) fillRect(g, c.roof, CAR + 1, y, GAP - 2, 1);
};

const trainLayer = (c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`ct-train:${colorKey(c)}`, TRAIN_W, TRAIN_ROWS, (g) => {
    for (const car of [0, 1]) {
      paintShell(g, car * (CAR + GAP), c);
      for (const s of SLOTS) paintSlot(g, slotX(car, s), s, c);
    }
    paintEnds(g, c);
  });

const train = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  ctx.drawImage(trainLayer(c), l.trainX, l.trainTop);
};

// ---- the passengers ----

type Seat = { readonly x: number; readonly w: number; readonly cab: boolean };
// Every window that holds a cat, in order along the train from the front.
const SEATS: readonly Seat[] = [0, 1].flatMap((car) =>
  SLOTS.filter((s) => s.kind !== 'door')
    .map((s) => ({ x: slotX(car, s), w: s.w, cab: s.kind === 'cab' }))
    .sort((a, b) => a.x - b.x),
);

// How far a cat has popped up: the next cat along the train jumps on each beat and settles before the next.
const popOf = (beat: number, i: number): number => {
  const n = Math.floor(beat);
  if (((n % SEATS.length) + SEATS.length) % SEATS.length !== i) return 0;
  return Math.round(3 * (1 - smooth(0.3, 1, frac(beat))));
};

const passenger = (ctx: Ctx, f: Frame, c: Colors<K>, i: number, x: number, sill: number): void => {
  const seat = SEATS[i] as Seat;
  const palette = coatOf(c, i * 3);
  const hx = x + Math.floor((seat.w - sizeOf(CAT_HEAD).w) / 2);
  const hy = sill - 8 - popOf(f.beat, i);
  drawCatHead(ctx, f.t, hx, hy, palette, 40 + i);
  // The driver wears a little cap.
  if (seat.cab && i === 0) {
    fillRect(ctx, c.ink, hx + 3, hy + 1, 6, 3);
    fillRect(ctx, c.navy, hx + 4, hy + 2, 4, 1);
    fillRect(ctx, c.gold, hx + 5, hy + 1, 2, 1);
  }
  fillRect(ctx, c.creamLo, x - 1, sill, seat.w + 2, 2);
  fillRect(ctx, c.cream, x - 1, sill, seat.w + 2, 1);
  for (const px of [hx + 1, hx + 7]) {
    fillRect(ctx, c.ink, px, sill - 1, 4, 2);
    fillRect(ctx, palette.f ?? c.white, px + 1, sill - 1, 2, 1);
  }
};

// A white cat sits on the roof of the first car, flicking its tail on the beat.
const roofCat = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, roof: number): void => {
  const palette = coatOf(c, 2);
  const lift = 2 + Math.round(4 * (1 - smooth(0, 0.5, frac(f.beat))));
  catTail(ctx, x + 11, roof - 3, 8, lift, palette.f ?? c.ink, c.ink, 1);
  drawSprite(ctx, CAT_BODY, palette, x, roof - CAT_BODY.length);
  drawCatHead(ctx, f.t, x, roof - CAT_BODY.length - 9, palette, 7);
};

const cats = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  SEATS.forEach((seat, i) => {
    passenger(ctx, f, c, i, l.trainX + seat.x, l.trainTop + SILL);
  });
  roofCat(ctx, f, c, l.trainX + 46, l.trainTop + 3);
};

// ---- the platform: worn boards on a stone wall, with pots of flowers along the edge ----

const paintBoards = (g: Ctx, f: Frame, l: Layout, c: Colors<K>): void => {
  fillRect(g, c.plank, 0, l.platTop, f.w, l.platEdge - l.platTop);
  fillRect(g, c.plankHi, 0, l.platTop, f.w, 2);
  fillRect(g, c.plankLo, 0, l.platTop + 2, f.w, 1);
  // Board seams open up toward the viewer; each board has its own butt joints.
  for (let k = 0, y = l.platTop + 5; y < l.platEdge - 2; k++, y += 3 + k) {
    fillRect(g, c.plankLo, 0, y, f.w, 1);
    for (let x = Math.floor(rand(k, 5) * 40); x < f.w; x += 30 + Math.floor(rand(x, k) * 30))
      fillRect(g, c.plankLo, x, y - 2 - k, 1, 2 + k);
  }
  for (let i = 0; i < f.w / 3; i++) {
    const y = l.platTop + 4 + Math.floor(rand(i, 7) * (l.platEdge - l.platTop - 6));
    fillRect(g, c.plankHi, Math.floor(rand(i, 8) * f.w), y, 2 + Math.floor(rand(i, 9) * 5), 1);
  }
  fillRect(g, c.plankHi, 0, l.platEdge - 2, f.w, 1);
  fillRect(g, c.plankLo, 0, l.platEdge - 1, f.w, 1);
};

const paintWall = (g: Ctx, f: Frame, l: Layout, c: Colors<K>): void => {
  const face = mixHex(c.wall, c.ink, 0.3);
  const mortar = mixHex(c.wall, c.ink, 0.6);
  fillRect(g, face, 0, l.platEdge, f.w, l.water - l.platEdge);
  fillRect(g, c.wall, 0, l.platEdge, f.w, 1);
  for (let row = 0; row < 2; row++) {
    const y = l.platEdge + 1 + row * 4;
    fillRect(g, mortar, 0, y + 3, f.w, 1);
    for (let x = row * 7; x < f.w; x += 14) fillRect(g, mortar, x, y, 1, 3);
  }
  // Weeds grow where the wall meets the water.
  for (let x = 0; x < f.w; x += 2 + Math.floor(rand(x, 13) * 5)) {
    const tall = 1 + Math.floor(rand(x, 14) * 4);
    fillRect(g, rand(x, 15) < 0.5 ? c.leaf : c.leafHi, x, l.water - tall, 1, tall);
  }
};

const paintPot = (g: Ctx, x: number, y: number, c: Colors<K>, seed: number): void => {
  const pot = mixHex(c.ginger, c.ink, 0.25);
  fillRect(g, c.ink, x - 4, y - 7, 9, 8);
  fillRect(g, pot, x - 3, y - 6, 7, 6);
  fillRect(g, mixHex(pot, c.white, 0.3), x - 3, y - 6, 7, 1);
  const blooms = [c.red, c.white, c.gold];
  for (let k = 0; k < 7; k++) {
    const fx = x - 4 + Math.floor(rand(k, seed) * 9);
    const fy = y - 9 - Math.floor(rand(k, seed + 1) * 5);
    fillRect(g, c.leaf, fx, fy, 2, y - 6 - fy);
    fillRect(g, c.leafHi, fx, fy + 1, 1, 1);
    fillRect(g, blooms[k % 3] as string, fx, fy - 1, 2, 2);
  }
};

// After dark the lit windows lay pale squares of light on the boards in front of them.
const paintSpill = (g: Ctx, l: Layout, c: Colors<K>): void => {
  if (glowOf(c) < 1) return;
  const lit = mixHex(c.plank, c.window, 0.4);
  for (const seat of SEATS) {
    fillRect(g, lit, l.trainX + seat.x, l.platTop + 3, seat.w + 2, 1);
    fillDither(g, lit, 0.5, l.trainX + seat.x + 1, l.platTop + 4, seat.w + 2, 3);
  }
};

const platformLayer = (f: Frame, l: Layout, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('ct-platform', f, c, (g) => {
    paintBoards(g, f, l, c);
    paintSpill(g, l, c);
    paintWall(g, f, l, c);
    const pots = l.wide ? [l.trainX + 12, l.shelterX - 10] : [16, 46];
    pots.forEach((x, i) => {
      paintPot(g, x, l.platEdge - 3, c, 60 + i * 5);
    });
  });

const platform = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  ctx.drawImage(platformLayer(f, l, c), 0, 0);
};

// ---- the shelter: a wooden roof on posts, a bench and the station's (blank) name board ----

const paintRoof = (g: Ctx, x0: number, x1: number, eave: number, c: Colors<K>): void => {
  fillRect(g, c.plankLo, x0, 0, x1 - x0, eave);
  for (let x = x0 + 3; x < x1; x += 7) fillRect(g, mixHex(c.plankLo, c.ink, 0.4), x, 0, 2, eave - 5);
  fillRect(g, c.ink, x0, eave - 6, x1 - x0, 1);
  fillRect(g, c.plank, x0, eave - 5, x1 - x0, 4);
  fillRect(g, c.plankHi, x0, eave - 5, x1 - x0, 1);
  fillRect(g, c.ink, x0, eave - 1, x1 - x0, 1);
};

const paintPost = (g: Ctx, x: number, top: number, bottom: number, c: Colors<K>): void => {
  fillRect(g, c.ink, x - 1, top, 5, bottom - top);
  fillRect(g, c.plank, x, top, 3, bottom - top);
  fillRect(g, c.plankHi, x, top, 1, bottom - top);
};

const paintBoard = (g: Ctx, x: number, y: number, w: number, c: Colors<K>): void => {
  fillRect(g, c.ink, x + 4, y - 4, 1, 4);
  fillRect(g, c.ink, x + w - 5, y - 4, 1, 4);
  fillRect(g, c.ink, x, y, w, 10);
  fillRect(g, c.white, x + 1, y + 1, w - 2, 8);
  fillRect(g, mixHex(c.white, c.navy, 0.15), x + 1, y + 7, w - 2, 2);
  fillRect(g, mixHex(c.white, c.navy, 0.35), x + 4, y + 4, w - 8, 1);
};

// A bench under the wide shelter's roof.
const paintBench = (g: Ctx, f: Frame, l: Layout, c: Colors<K>): void => {
  const x0 = l.shelterX;
  const seat = l.platTop + 6;
  const w = f.w - x0 - 8;
  fillRect(g, c.ink, x0 + 6, seat - 9, w, 7);
  fillRect(g, c.plank, x0 + 7, seat - 8, w - 2, 2);
  fillRect(g, c.plank, x0 + 7, seat - 5, w - 2, 2);
  fillRect(g, c.ink, x0 + 6, seat - 1, w, 4);
  fillRect(g, c.plankHi, x0 + 7, seat, w - 2, 2);
  for (const lx of [x0 + 9, f.w - 7]) fillRect(g, c.ink, lx, seat + 3, 2, 7);
};

const shelterLayer = (f: Frame, l: Layout, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('ct-shelter', f, c, (g) => {
    const x0 = l.wide ? l.shelterX - 12 : 0;
    if (l.wide) paintBench(g, f, l, c);
    paintRoof(g, x0, f.w, l.eave, c);
    paintPost(g, l.wide ? l.shelterX + 2 : 3, l.eave, l.platEdge - 2, c);
    paintPost(g, f.w - 6, l.eave, l.platEdge - 2, c);
    paintBoard(g, l.wide ? l.shelterX + 14 : f.w - 50, l.eave + 4, 36, c);
  });

const shelter = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  ctx.drawImage(shelterLayer(f, l, c), 0, 0);
};

// ---- lights ----

const lampYOf = (l: Layout): number => l.eave + (l.wide ? 12 : 22);

const lights = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const k = glowOf(c);
  const swell = f.kick > 0.5 ? 0.1 : 0;
  drawGlow(ctx, c.glow, l.lampX, lampYOf(l) + 4, Math.round(17 * k), Math.round(15 * k), 0.55 * k + swell);
  drawGlow(ctx, c.glow, l.trainX - 2, l.trainTop + 32, Math.round(16 * k), Math.round(8 * k), 0.6 * k + swell, 3);
};

// The station lamp under the eave, with moths circling it.
const lamp = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const x = l.lampX;
  const y = lampYOf(l);
  fillRect(ctx, c.ink, x, l.eave, 1, y - l.eave);
  fillRect(ctx, c.ink, x - 4, y, 9, 3);
  fillRect(ctx, c.navyLo, x - 3, y, 7, 2);
  fillRect(ctx, mixHex(c.navyLo, c.white, 0.3), x - 2, y, 3, 1);
  fillRect(ctx, c.glow, x - 2, y + 3, 5, 2);
  fillRect(ctx, c.white, x - 1, y + 3, 3, 1);
  for (let i = 0; i < 3; i++) {
    const mx = x + Math.round(Math.cos(f.t * (2.6 + i * 0.7) + i * 2.1) * (5 + i * 2));
    const my = y + 5 + Math.round(Math.sin(f.t * (3.9 + i) + i * 1.3) * (3 + i));
    fillRect(ctx, c.cream, mx, my, 1, 1);
  }
};

// ---- the conductor ----

type Pose = { readonly elbow: readonly [number, number]; readonly hand: readonly [number, number] };
// The lantern swings between held high and held out, changing on every beat.
const POSES: readonly [Pose, Pose] = [
  { elbow: [4, -9], hand: [12, -16] },
  { elbow: [7, -2], hand: [14, -6] },
];
const SHOULDER = [26, 30] as const;

type Arm = { readonly ex: number; readonly ey: number; readonly hx: number; readonly hy: number };

const armOf = (beat: number): Arm => {
  const n = Math.floor(beat);
  const to = POSES[n % 2 === 0 ? 0 : 1];
  const from = POSES[n % 2 === 0 ? 1 : 0];
  const e = smooth(0, 0.3, frac(beat));
  const at = (a: number, b: number): number => Math.round(a + (b - a) * e);
  return {
    ex: at(from.elbow[0], to.elbow[0]),
    ey: at(from.elbow[1], to.elbow[1]),
    hx: at(from.hand[0], to.hand[0]),
    hy: at(from.hand[1], to.hand[1]),
  };
};

const BRAID_RIGHT = flipped(BRAID);
const BRAID_END_RIGHT = flipped(BRAID_END);

const braid = (ctx: Ctx, f: Frame, palette: Palette, x: number, y: number, dir: 1 | -1): void => {
  let last = x;
  BRAID_LEAN.forEach((lean, k) => {
    const sway = Math.round(Math.sin(f.t * 1.7 + dir - k * 0.45) * (k / 6) ** 1.4 * 1.6);
    last = x + dir * lean + sway;
    drawSprite(ctx, dir > 0 ? BRAID : BRAID_RIGHT, palette, last, y + k * 3);
  });
  drawSprite(ctx, dir > 0 ? BRAID_END : BRAID_END_RIGHT, palette, last, y + BRAID_LEAN.length * 3);
};

const lanternArm = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, y: number): void => {
  const arm = armOf(f.beat);
  const sx = x + SHOULDER[0];
  const sy = y + SHOULDER[1];
  const hx = sx + arm.hx;
  const hy = sy + arm.hy;
  limb(ctx, sx + arm.ex, sy + arm.ey, hx, hy, 3, c.navy, c.ink);
  limb(ctx, sx, sy, sx + arm.ex, sy + arm.ey, 3, c.navy, c.ink);
  const palette = paletteOf(c, lanternPalette);
  const swing = Math.round(Math.sin(f.t * 3.3) * 0.8);
  drawSprite(ctx, LANTERN, palette, hx - 3 + swing, hy + 3);
  drawSprite(ctx, FIST, palette, hx - 2, hy - 2);
};

// The lantern's glow, behind her: wide and strong after dark, smaller by day, swelling on the kick.
// After dark it also lays a pool of light on the boards beneath it.
const lanternGlow = (ctx: Ctx, f: Frame, c: Colors<K>, l: Layout, x: number, y: number): void => {
  const arm = armOf(f.beat);
  const night = glowOf(c) === 1;
  const kick = f.kick > 0.5 ? 1 : 0;
  const r = (night ? 14 : 11) + kick * 2;
  const peak = (night ? 0.9 : 0.65) + kick * 0.1;
  const lx = x + SHOULDER[0] + arm.hx;
  drawGlow(ctx, warmOf(c), lx, y + SHOULDER[1] + arm.hy + GLASS_DROP, r, r, peak);
  if (night) drawGlow(ctx, warmOf(c), lx, l.platEdge - 4, 18 + kick * 2, 4, 0.5);
};

// Whether the lantern is up beside her face rather than held out.
const raised = (arm: Arm): boolean => arm.hy < (POSES[0].hand[1] + POSES[1].hand[1]) / 2;

// With the lantern raised she leans toward it, its light on her hair and cheek, and smiles open-mouthed.
const litFace = (ctx: Ctx, c: Colors<K>, x: number, y: number): void => {
  const lit = paletteOf(c, litPalette);
  fillRect(ctx, lit.h ?? c.hair, x + 30, y + 12, 1, 11);
  fillRect(ctx, lit.s ?? c.skin, x + 26, y + 16, 1, 5);
  fillRect(ctx, lit.m ?? c.ink, x + 15, y + 21, 4, 1);
  fillRect(ctx, lit.t ?? c.blush, x + 16, y + 22, 2, 1);
};

const conductor = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const x = l.girlX;
  const y = l.girlY + onBeat(f.beat, 0.18);
  const palette = paletteOf(c, girlPalette);
  const up = raised(armOf(f.beat));
  const hx = x + (up ? 1 : 0);
  fillDither(ctx, c.plankLo, 0.6, x + 8, l.girlY + GIRL.length - 1, 18, 3);
  lanternGlow(ctx, f, c, l, x, y);
  drawSprite(ctx, GIRL_BODY, palette, x, y + HEAD_ROWS);
  drawGirl(ctx, f, GIRL_HEAD, palette, hx, y, GIRL_EYES);
  if (up) litFace(ctx, c, hx, y);
  braid(ctx, f, palette, hx + 3, y + 21, 1);
  braid(ctx, f, palette, hx + 26, y + 21, -1);
  lanternArm(ctx, f, c, x, y);
};

// ---- the flooded paddy in front: it mirrors the station, rows of young rice stand in it ----

const paintRice = (g: Ctx, f: Frame, l: Layout, c: Colors<K>): void => {
  for (let k = 0, y = l.water + 3; y < f.h + 4; k++, y += 2 + Math.round(k * 0.8)) {
    const size = 1 + Math.floor(k / 3);
    const pitch = 4 + size * 3;
    for (let x = Math.round(k * 2.7) % pitch; x < f.w; x += pitch) {
      fillRect(g, c.leaf, x, y - size, 1, size + 1);
      if (size < 2) continue;
      fillRect(g, c.leafHi, x - 1, y - size + 1, 1, size - 1);
      fillRect(g, c.leaf, x + 1, y - size + 2, 1, size - 1);
      fillRect(g, mixHex(c.leaf, c.paddy, 0.5), x, y + 1, 1, Math.max(1, size - 1));
    }
  }
};

const paddy = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  mirrorWater(ctx, f, { axis: l.water, bottom: f.h, squash: 1, amp: 1.2, freq: 0.8, speed: 1.6, tint: c.paddy, tintLevel: 0.45 });
  ctx.drawImage(
    frameLayer('ct-rice', f, c, (g) => paintRice(g, f, l, c)),
    0,
    0,
  );
  glints(ctx, f, l.water + 2, f.h, c.sky2, Math.round(f.w / 14), 47);
};

// ---- fireflies (or, by day, drifting seed fluff) rising from the fields ----

// Fireflies that would cross the girl are left out, so none ever lands on her face.
const overGirl = (l: Layout, x: number, y: number): boolean =>
  x > l.girlX - 3 && x < l.girlX + GIRL_W + 3 && y > l.girlY - 3 && y < l.girlY + GIRL.length;

// One firefly, drifting up through the band from `top` down `depth` rows, its light pulsing.
const firefly = (ctx: Ctx, f: Frame, c: Colors<K>, l: Layout, i: number, top: number, depth: number): void => {
  const pulse = Math.sin(f.t * (1.1 + rand(i, 71)) + i * 2.3);
  if (pulse < -0.2) return;
  const x = Math.round(wrap(rand(i, 73) * (f.w + 20) + f.t * (1 + rand(i, 74) * 2) + Math.sin(f.t * 0.7 + i) * 6, f.w + 20) - 10);
  const y = Math.round(top + wrap(rand(i, 75) * depth - f.t * (1.5 + rand(i, 76) * 2.5), depth));
  if (overGirl(l, x, y)) return;
  const size = rand(i, 72) < 0.3 ? 2 : 1;
  drawGlow(ctx, c.firefly, x, y, size + 2, size + 2, pulse > 0.4 ? 0.6 : 0.35);
  fillRect(ctx, c.firefly, x, y, size, size);
};

const fireflies = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const top = l.trainTop - 20;
  const depth = f.h - top;
  const count = Math.round((f.w * depth) / 1400);
  for (let i = 0; i < count; i++) firefly(ctx, f, c, l, i, top, depth);
};

export const catTrain = defineScene<K>({
  id: 'cat-train',
  title: 'Cat Conductor',
  mood: { valence: 0.4, energy: -0.3 },
  styles: ['cozy-village', 'town-waltz', 'lofi-loop', 'nineties-pop', 'showa-ballad', 'band-rock'],
  variants: [
    {
      mood: { valence: 0.4, energy: -0.3 },
      colors: {
        sky0: '#3b3f86',
        sky1: '#c7668a',
        sky2: '#ffb067',
        sun: '#ffe9a8',
        star: '#ffe6d0',
        cloud: '#ffc29a',
        cloudLo: '#c56a86',
        far: '#5b4a86',
        farHi: '#8e6a9a',
        paddy: '#d98a8a',
        leaf: '#3f6b3e',
        leafHi: '#86b24e',
        cream: '#f6e8c9',
        creamLo: '#c7b391',
        band: '#8e3640',
        roof: '#4d4659',
        window: '#ffdc8e',
        glow: '#ffc862',
        plank: '#8f6a4c',
        plankLo: '#634632',
        plankHi: '#c09468',
        wall: '#7a6a7c',
        ink: '#26182c',
        skin: '#ffe3d0',
        skinLo: '#f2ae98',
        blush: '#ff7b8e',
        hair: '#2f6450',
        hairHi: '#66aa82',
        hairLo: '#1b3b30',
        iris: '#d9822e',
        navy: '#2f3b78',
        navyLo: '#1d2450',
        gold: '#f2b944',
        red: '#dc434e',
        white: '#fdf7ee',
        ginger: '#ea8b3a',
        firefly: '#efff8a',
      },
    },
    {
      mood: { valence: 0.1, energy: -0.5 },
      colors: {
        sky0: '#101634',
        sky1: '#283a7c',
        sky2: '#8a76b4',
        sun: '#d6a6c8',
        star: '#e8ecff',
        cloud: '#5a5a9a',
        cloudLo: '#33346c',
        far: '#1e2148',
        farHi: '#3a3d70',
        paddy: '#4a5aa0',
        leaf: '#1f3d36',
        leafHi: '#3f7454',
        cream: '#d9d2c8',
        creamLo: '#9a92a2',
        band: '#7a2d42',
        roof: '#2c2a40',
        window: '#ffd27a',
        glow: '#ffbf5e',
        plank: '#55465a',
        plankLo: '#362b3c',
        plankHi: '#7e6a78',
        wall: '#43435e',
        ink: '#0f0b1c',
        skin: '#f6dccf',
        skinLo: '#d8a6a2',
        blush: '#f27a92',
        hair: '#22503f',
        hairHi: '#4a8a70',
        hairLo: '#122a22',
        iris: '#e6953e',
        navy: '#283270',
        navyLo: '#171c44',
        gold: '#eab448',
        red: '#cc3a46',
        white: '#eeeaf2',
        ginger: '#dc8238',
        firefly: '#dcff6e',
      },
    },
    {
      mood: { valence: 0.6, energy: 0 },
      colors: {
        sky0: '#3a86dc',
        sky1: '#7cc2f2',
        sky2: '#e6f6f0',
        sun: '#fff8d8',
        star: '#3a86dc',
        cloud: '#ffffff',
        cloudLo: '#c2d8ee',
        far: '#5f8fb0',
        farHi: '#93bcd2',
        paddy: '#8cc8e8',
        leaf: '#4c9a3c',
        leafHi: '#a0d452',
        cream: '#fcf3dc',
        creamLo: '#d6c8a8',
        band: '#a33c3c',
        roof: '#5e5c6c',
        window: '#4f6f8f',
        glow: '#fff2b8',
        plank: '#ab8159',
        plankLo: '#7d5c40',
        plankHi: '#d8b07e',
        wall: '#8e8c96',
        ink: '#2a1e2c',
        skin: '#ffe6d4',
        skinLo: '#f4b6a0',
        blush: '#ff8a9a',
        hair: '#2f6c50',
        hairHi: '#6cb48a',
        hairLo: '#1c4434',
        iris: '#c97026',
        navy: '#2f3e7e',
        navyLo: '#1f2a58',
        gold: '#f6c24a',
        red: '#e2474f',
        white: '#ffffff',
        ginger: '#f0943e',
        firefly: '#fffbe6',
      },
    },
  ],
  layers: [sky, weather, train, cats, platform, shelter, lights, conductor, lamp, paddy, fireflies],
});
