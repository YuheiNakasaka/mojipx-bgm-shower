// Three in the morning at a corner store: the girl on the night shift has set DJ decks on the counter and nods along
// under the fluorescent lights, while rain falls on the neon street behind the glass and a black cat waits its turn.
import { type Ctx, drawSprite, drawSpriteFoot, fillRect, type Palette, type Sprite } from 'mojipx';
import { ditherGradient, frac, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { type Box, fillDither } from './batch-1-helpers.ts';
import { drawGlow, memoLayer, wrap } from './batch-2-helpers.ts';
import { paletteOf, sigOf } from './batch-3-helpers.ts';
import { catTail, drawGirl, type Girl, onBeat, wide } from './batch-7-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'bldg'
  | 'haze'
  | 'neonA'
  | 'neonB'
  | 'neonC'
  | 'road'
  | 'rain'
  | 'wall'
  | 'wallLo'
  | 'light'
  | 'metal'
  | 'fridge'
  | 'fridgeLo'
  | 'counter'
  | 'floor'
  | 'deck'
  | 'ink'
  | 'skin'
  | 'skinLo'
  | 'blush'
  | 'hair'
  | 'hairHi'
  | 'hairLo'
  | 'iris'
  | 'white'
  | 'hoodie'
  | 'hoodieLo'
  | 'vest'
  | 'warm';

// ---- the girl: o outline, s/S skin, b blush, h/H/d hair, c dyed tips, e/E eyes, w glint, m mouth,
// q/Q headphones, P ear cups, u/U hoodie, v vest, k cords, C cuffs, n name badge ----

const HEAD: Sprite = [
  '.............oooooooooo.............',
  '...........ooqqqqqqqqqqoo...........',
  '..........oqqQQQQQQQQQQqqo..........',
  '.........oqQhhhhhhhhhhhhQqo.........',
  '........oqQhhhhhhhhhhhhhhQqo........',
  '.......oqQhhHHHHhhhhHHHHhhQqo.......',
  '......oqQhHHhhhhhhhhhhhhHHhQqo......',
  '......oqQhhhhhhhhhhhhhhhhhhQqo......',
  '.....oqQhhhhhhhhhhhhhhhhhhhhQqo.....',
  '.....oqQhhhhhhhhhhhhhhhhhhhhQqo.....',
  '.....oqQhhhhhhhhhhhhhhhhhhhhQqo.....',
  '.....oqQhhhhhhdhhhhhhdhhhhhhQqo.....',
  '.oooooqhdddddSddddddddSdddddhqooooo.',
  'oqqqoohdSSoooooSssssSoooooSSdhooqqqo',
  'oqPPoohdssswweesssssseewwsssdhooPPqo',
  'oqPPoohdsssweeesssssseeewsssdhooPPqo',
  'oqPPoohdsssEEEesssssseEEEsssdhooPPqo',
  'oqPPoohdsssEEEEssssssEEEEsssdhooPPqo',
  'oqPPoohdsbbbbssssssssssbbbbsdhooPPqo',
  'oqPPoohdsssssssssmmsssssssssdhooPPqo',
  'oqqqoohdsssssssssMMsssssssssdhooqqqo',
  '.ooooohdoSssssssssssssssssSodhooooo.',
  '.....occhoSssssssssssssssSohcco.....',
  '.....occo.ooSssssssssssSoo.occo.....',
  '.......oo....oooooooooo....oo.......',
];

const BODY: Sprite = [
  '...............oSSSSo...............',
  '............ooUUSSSSUUoo............',
  '..........oouuUUUUUUUUuuoo..........',
  '........oouuuuvvuuuuvvuuuuoo........',
  '.......ouuuuuuvvuuuuvvuuuuuuo.......',
  '......ouuuuuuuvvkuukvvuuuuuuuo......',
  '.....oUuuuuuuuvvkuukvvuuuuuuuUo.....',
  '.....oUuuuuUvvvvkvvkvvvvUuuuuUo.....',
  '....oUuuuuuUvvvvkvvkvvvvUuuuuuUo....',
  '....oUuuuuuUnnnnvvvvvvvvUuuuuuUo....',
  '....oUuuuuuUoonnvvvvvvvvUuuuuuUo....',
  '....oUuuuuuUvvvvvvvvvvvvUuuuuuUo....',
  '....oUuuuuuUvvvvvvvvvvvvUuuuuuUo....',
  '....oUuuuuuuUvvvvvvvvvvUuuuuuuUo....',
  '.....oUuuuuuuUvvvvvvvvUuuuuuuUo.....',
  '......oUuuuuuuUvvvvvvUuuuuuuUo......',
  '.......oCCCCCCoUvvvvUoCCCCCCo.......',
  '........oooooooUvvvvUooooooo........',
];

const HAND: Sprite = ['.ooo.', 'ossso', 'osSSo', '.ooo.'];

const GIRL: Girl = {
  eyes: [
    { x: 11, y: 13, out: -1, w: 4, h: 5 },
    { x: 21, y: 13, out: 1, w: 4, h: 5 },
  ],
  seed: 23,
};

// A black cat seen from the side, looking up at the counter: k fur, K rim light, y eyes, w white bib and paws.
const CAT: Sprite = [
  '..........o...o...',
  '.........oKo.oko..',
  '.........oKkokkko.',
  '........oKkkkkkkko',
  '........okkkkykkyo',
  '........okkkkkkkwo',
  '.........okkkkkko.',
  '..........okkkko..',
  '.......ooKkkkkkwo.',
  '......oKkkkkkkkwo.',
  '.....oKkkkkkkkkwwo',
  '.....oKkkkkkkkkkwo',
  '....oKkkkkkkkkkkwo',
  '....oKkkkkkkkkkkko',
  '....oKkkkkkkokkwwo',
  '.....oooooooooooo.',
];

// Neon signs across the street, as tubes: a cat's head, a steaming bowl.
const NEON_CAT: Sprite = [
  '.n.......n.',
  '.nn.....nn.',
  '.n.nnnnn.n.',
  'n.........n',
  'n..N...N..n',
  'n.........n',
  'n....n....n',
  '.n..n.n..n.',
  '..nnnnnnn..',
];
const NEON_BOWL: Sprite = [
  '..n..n..n..',
  '...n..n..n.',
  '..n..n..n..',
  '...........',
  'nnnnnnnnnnn',
  '.nNNNNNNNn.',
  '..nNNNNNn..',
  '...nnnnn...',
];

const girlPalette = (c: Colors<K>): Palette => ({
  o: c.ink,
  s: c.skin,
  S: c.skinLo,
  b: c.blush,
  h: c.hair,
  H: c.hairHi,
  d: c.hairLo,
  c: c.neonB,
  e: c.ink,
  E: c.iris,
  w: c.white,
  m: c.hairLo,
  q: c.white,
  Q: c.metal,
  P: c.neonA,
  u: c.hoodie,
  U: c.hoodieLo,
  v: c.vest,
  k: c.white,
  C: c.white,
  n: c.white,
});
const catPalette = (c: Colors<K>): Palette => ({ o: c.ink, k: c.deck, K: c.neonB, y: c.neonC, w: c.white });
const neonAPalette = (c: Colors<K>): Palette => ({ n: c.neonA, N: c.white });
const neonCPalette = (c: Colors<K>): Palette => ({ n: c.neonC, N: c.warm });
const dimPalette = (c: Colors<K>): Palette => ({ n: c.bldg, N: c.bldg });

// ---- layout ----

type Shop = {
  readonly win: Box;
  readonly top: number;
  readonly floor: number;
  readonly fridge: number;
  readonly right: number;
  readonly girl: number;
  readonly warmer: number;
  /** The top of the shelf in the foreground (the bottom edge when there is none) and where the cat sits. */
  readonly shelf: number;
  readonly cat: { readonly x: number; readonly base: number };
};

const shopOf = (f: Frame): Shop => {
  const at = (u: number): number => Math.round(f.w * u);
  const down = (u: number): number => Math.round(f.h * u);
  if (wide(f)) {
    const top = down(0.7);
    const y = down(0.08);
    return {
      win: { x: 0, y, w: at(0.74), h: top - y },
      top,
      floor: down(0.86),
      fridge: at(0.76),
      right: at(0.74),
      girl: at(0.4),
      warmer: at(0.6),
      shelf: f.h,
      cat: { x: at(0.14), base: f.h - 3 },
    };
  }
  const top = down(0.58);
  const y = down(0.04);
  return {
    win: { x: 0, y, w: f.w, h: top - y },
    top,
    floor: down(0.69),
    fridge: f.w,
    right: f.w,
    girl: at(0.42),
    warmer: at(0.68),
    shelf: down(0.8),
    cat: { x: at(0.78), base: down(0.8) },
  };
};

const roadOf = (win: Box): number => win.y + Math.round(win.h * 0.8);

// ---- the street outside ----

// Towers far back in the haze, then nearer blocks whose lit windows come in bands, a floor at a time.
const paintBlock = (g: Ctx, x: number, bw: number, top: number, h: number, i: number, c: Colors<K>): void => {
  fillRect(g, c.bldg, x, top, bw, h - top);
  fillRect(g, c.road, x + bw - 1, top, 1, h - top);
  const share = 0.15 + rand(i, 13) * 0.5;
  for (let wy = top + 4, row = 0; wy < h * 0.76; wy += 6, row++) {
    if (rand(row, i + 14) > share) continue;
    const color = rand(row, i + 15) < 0.2 ? c.neonB : c.warm;
    for (let wx = x + 3; wx < x + bw - 3; wx += 5) if (rand(wx, wy) < 0.7) fillRect(g, color, wx, wy, 2, 3);
  }
};

const paintBuildings = (g: Ctx, w: number, h: number, c: Colors<K>): void => {
  for (let x = -6, i = 0; x < w; i++) {
    const bw = 16 + Math.floor(rand(i, 16) * 20);
    const top = Math.round(h * (0.02 + rand(i, 17) * 0.2));
    fillRect(g, c.haze, x, top, bw, h - top);
    if (rand(i, 18) < 0.5) fillRect(g, c.neonA, x + (bw >> 1), top - 2, 1, 2);
    x += bw + 1;
  }
  for (let x = -4, i = 0; x < w; i++) {
    const bw = 24 + Math.floor(rand(i, 11) * 24);
    paintBlock(g, x, bw, Math.round(h * (0.16 + rand(i, 12) * 0.3)), h, i, c);
    x += bw + 3;
  }
};

const outsideLayer = (win: Box, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`kj-out:${sigOf(c)}`, win.w, win.h, (g) => {
    g.drawImage(ditherGradient(win.w, win.h, [c.sky0, c.sky1, c.sky1]), 0, 0);
    paintBuildings(g, win.w, win.h, c);
    const road = Math.round(win.h * 0.8);
    fillRect(g, c.road, 0, road, win.w, win.h - road);
    fillRect(g, c.metal, 0, road, win.w, 1);
    fillDither(g, c.bldg, 0.5, 0, road + 1, win.w, 2);
  });

type Sign = { readonly x: number; readonly y: number; readonly sprite: Sprite; readonly palette: (c: Colors<K>) => Palette };

const signsOf = (win: Box): readonly Sign[] => [
  { x: win.x + Math.round(win.w * 0.1), y: win.y + Math.round(win.h * 0.3), sprite: NEON_CAT, palette: neonAPalette },
  { x: win.x + Math.round(win.w * 0.8), y: win.y + Math.round(win.h * 0.42), sprite: NEON_BOWL, palette: neonCPalette },
];

const tallSignX = (win: Box): number => win.x + Math.round(win.w * 0.64);

// The tall sign lights its panels in turn on the beat; the others hum, with a flicker now and then.
const tallSign = (ctx: Ctx, f: Frame, win: Box, c: Colors<K>): void => {
  const x = tallSignX(win);
  const y = win.y + Math.round(win.h * 0.1);
  drawGlow(ctx, x + 4, y + 14, 14, c.neonB, f.kick > 0.5 ? 0.45 : 0.3);
  fillRect(ctx, c.neonB, x, y, 9, 28);
  fillRect(ctx, c.bldg, x + 1, y + 1, 7, 26);
  const lit = Math.floor(f.beat) % 4;
  for (let k = 0; k < 4; k++) {
    const color = k === lit ? c.white : c.neonB;
    fillRect(ctx, color, x + 2 + Math.floor(rand(k, 31) * 2), y + 3 + k * 6, 3, 1);
    fillRect(ctx, color, x + 3, y + 2 + k * 6, 1, 4);
    if (rand(k, 32) < 0.6) fillRect(ctx, color, x + 5, y + 4 + k * 6, 1, 2);
  }
};

const signs = (ctx: Ctx, f: Frame, win: Box, c: Colors<K>): void => {
  signsOf(win).forEach((s, i) => {
    const off = rand(Math.floor(f.t * 6), i + 40) < 0.04;
    const w = s.sprite[0]?.length ?? 0;
    const tube = paletteOf(c, s.palette).n ?? c.neonA;
    if (!off) drawGlow(ctx, s.x + (w >> 1), s.y + (s.sprite.length >> 1), 11, tube, f.kick > 0.5 ? 0.45 : 0.3);
    drawSprite(ctx, s.sprite, paletteOf(c, off ? dimPalette : s.palette), s.x, s.y);
  });
  tallSign(ctx, f, win, c);
};

// Neon smeared down the wet road, trembling.
const reflections = (ctx: Ctx, f: Frame, win: Box, c: Colors<K>): void => {
  const road = roadOf(win);
  const lanes = [
    { x: win.x + Math.round(win.w * 0.1), w: 11, color: c.neonA },
    { x: tallSignX(win), w: 9, color: c.neonB },
    { x: win.x + Math.round(win.w * 0.8), w: 11, color: c.neonC },
  ];
  for (const lane of lanes) {
    for (let y = road + 2; y < win.y + win.h; y++) {
      const dx = Math.round(Math.sin(y * 0.9 + f.t * 3) * 1.5);
      const k = (y - road) / (win.y + win.h - road);
      fillDither(ctx, lane.color, 0.45 - k * 0.3, lane.x + dx + Math.round(k * 2), y, lane.w - Math.round(k * 4), 1);
    }
  }
};

// Now and then a car hisses past, lights first.
const car = (ctx: Ctx, f: Frame, win: Box, c: Colors<K>): void => {
  const span = win.w + 160;
  const x = win.x + wrap(f.t * 46 + 40, span * 1.6) - 60;
  if (x > win.x + win.w + 20) return;
  const y = roadOf(win) + 1;
  fillRect(ctx, c.neonC, x, y - 9, 36, 6);
  fillRect(ctx, c.neonC, x + 7, y - 14, 20, 5);
  fillRect(ctx, c.sky0, x + 9, y - 13, 7, 4);
  fillRect(ctx, c.sky0, x + 18, y - 13, 7, 4);
  fillRect(ctx, c.white, x + 15, y - 16, 4, 2);
  fillRect(ctx, c.ink, x + 4, y - 3, 6, 3);
  fillRect(ctx, c.ink, x + 25, y - 3, 6, 3);
  fillRect(ctx, c.white, x + 34, y - 8, 2, 2);
  fillRect(ctx, c.neonA, x, y - 8, 1, 2);
  drawGlow(ctx, x + 44, y - 6, 12, c.white, 0.4);
  fillDither(ctx, c.neonC, 0.3, x, y + 2, 36, 3);
};

const rain = (ctx: Ctx, f: Frame, win: Box, c: Colors<K>): void => {
  const count = Math.round((win.w * win.h) / 240);
  for (let i = 0; i < count; i++) {
    const x = Math.round(win.x + wrap(rand(i, 21) * win.w + f.t * 14, win.w));
    const y = Math.round(win.y + wrap(rand(i, 22) * win.h + f.t * (120 + rand(i, 23) * 70), win.h));
    fillRect(ctx, c.rain, x, y, 1, 3);
  }
  const road = roadOf(win);
  for (let i = 0; i < Math.round(win.w / 9); i++) {
    if (frac(f.t * 2 + rand(i, 24)) > 0.25) continue;
    fillRect(ctx, c.rain, win.x + Math.floor(rand(i, 25) * win.w), road + 2 + Math.floor(rand(i, 26) * (win.y + win.h - road - 3)), 2, 1);
  }
};

// Drops run down the glass at their own pace, and the glass catches a faint sheen of the shop's light.
const glass = (ctx: Ctx, f: Frame, win: Box, c: Colors<K>): void => {
  for (let i = 0; i < 14; i++) {
    const x = win.x + 3 + Math.floor(rand(i, 27) * (win.w - 6));
    const y = Math.round(win.y + wrap(rand(i, 28) * win.h + f.t * (3 + rand(i, 29) * 8), win.h));
    fillRect(ctx, c.rain, x, y - 4, 1, 4);
    fillRect(ctx, c.white, x, y, 2, 2);
    fillRect(ctx, c.rain, x + 1, y + 1, 1, 1);
  }
  for (let y = win.y; y < win.y + win.h; y += 2) {
    const x = win.x + Math.round(win.w * 0.18) + Math.round((win.y + win.h - y) * 0.6);
    fillDither(ctx, c.white, 0.07, x, y, 12, 2);
  }
};

const street = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const { win } = shopOf(f);
  ctx.save();
  ctx.beginPath();
  ctx.rect(win.x, win.y, win.w, win.h);
  ctx.clip();
  ctx.drawImage(outsideLayer(win, c), win.x, win.y);
  signs(ctx, f, win, c);
  reflections(ctx, f, win, c);
  car(ctx, f, win, c);
  rain(ctx, f, win, c);
  glass(ctx, f, win, c);
  ctx.restore();
};

// ---- the shop ----

const ITEMS = (c: Colors<K>): readonly string[] => [c.neonA, c.neonC, c.neonB, c.vest, c.hoodie, c.white, c.warm];

const paintFridges = (g: Ctx, s: Shop, w: number, c: Colors<K>): void => {
  const top = s.win.y;
  if (s.fridge >= w) return;
  fillRect(g, c.metal, s.fridge, top, w - s.fridge, s.floor - top);
  const items = ITEMS(c);
  for (let x = s.fridge + 2; x < w - 4; x += 27) {
    const dw = Math.min(24, w - x - 2);
    g.drawImage(ditherGradient(dw, s.floor - top - 4, [c.fridge, c.fridgeLo, c.fridgeLo]), x, top + 2);
    for (let y = top + 14; y < s.floor - 6; y += 14) {
      fillRect(g, c.metal, x, y, dw, 1);
      for (let bx = x + 2; bx < x + dw - 2; bx += 4) {
        fillRect(g, items[Math.floor(rand(bx, y) * items.length)] as string, bx, y - 8, 3, 8);
        fillRect(g, c.white, bx, y - 7, 1, 4);
        fillRect(g, c.ink, bx + 1, y - 10, 1, 2);
      }
    }
    fillRect(g, c.white, x + dw - 3, top + 6, 1, s.floor - top - 12);
  }
};

const paintFrame = (g: Ctx, s: Shop, c: Colors<K>): void => {
  const { win } = s;
  fillRect(g, c.metal, win.x, win.y - 3, win.w + 3, 3);
  fillRect(g, c.metal, win.x + win.w, win.y - 3, 3, win.h + 3);
  const panes = Math.max(2, Math.round(win.w / 80));
  for (let i = 1; i < panes; i++) fillRect(g, c.metal, win.x + Math.round((win.w * i) / panes) - 1, win.y, 3, win.h);
  fillRect(g, c.metal, win.x, win.y + Math.round(win.h * 0.12), win.w, 2);
};

// A row of sweets on the counter's front ledge, under the shop's stripe.
const paintCounter = (g: Ctx, s: Shop, c: Colors<K>): void => {
  const w = s.right;
  fillRect(g, c.metal, 0, s.top, w, 3);
  fillRect(g, c.white, 0, s.top, w, 1);
  fillRect(g, c.counter, 0, s.top + 3, w, s.floor - s.top - 3);
  fillRect(g, c.vest, 0, s.top + 4, w, 2);
  const items = ITEMS(c);
  for (let x = 3; x < w - 3; x += 4) {
    const ih = 4 + Math.floor(rand(x, 51) * 3);
    fillRect(g, items[Math.floor(rand(x, 52) * items.length)] as string, x, s.top + 13 - ih, 3, ih);
    fillRect(g, c.white, x, s.top + 13 - ih, 1, 1);
  }
  fillRect(g, c.metal, 0, s.top + 13, w, 2);
  fillRect(g, c.wallLo, 0, s.top + 15, w, 1);
  for (let x = 30; x < w - 4; x += 60) fillRect(g, c.floor, x, s.top + 16, 1, s.floor - s.top - 19);
  fillDither(g, c.floor, 0.5, 0, s.floor - 8, w, 5);
  fillRect(g, c.wallLo, 0, s.floor - 3, w, 3);
  fillRect(g, c.wallLo, w - 1, s.top, 1, s.floor - s.top);
};

const paintFloor = (g: Ctx, s: Shop, w: number, h: number, c: Colors<K>): void => {
  fillRect(g, c.floor, 0, s.floor, w, h - s.floor);
  for (let y = s.floor + 4; y < h; y += 7 + Math.floor((y - s.floor) / 10)) fillRect(g, c.wallLo, 0, y, w, 1);
  for (let x = 4; x < w; x += 16) fillRect(g, c.wallLo, x, s.floor, 1, h - s.floor);
};

const paintCeiling = (g: Ctx, s: Shop, w: number, c: Colors<K>): void => {
  fillRect(g, c.wallLo, 0, 0, w, s.win.y - 3);
  for (let x = 6; x < w; x += 40) {
    fillRect(g, c.metal, x - 1, 1, 26, 4);
    fillRect(g, c.light, x, 2, 24, 2);
  }
};

// Snack shelves in the near aisle: boards of boxes, bags and bottles.
const paintShelf = (g: Ctx, top: number, w: number, h: number, c: Colors<K>): void => {
  fillRect(g, c.metal, 0, top, w, h - top);
  const items = ITEMS(c);
  for (let y = top + 18, row = 0; y < h + 6; y += 18, row++) {
    fillRect(g, c.fridgeLo, 0, y - 16, w, 15);
    for (let x = 2; x < w - 2; ) {
      const iw = 5 + Math.floor(rand(x, row) * 5);
      const ih = 8 + Math.floor(rand(x, row + 9) * 6);
      fillRect(g, items[Math.floor(rand(x, row + 19) * items.length)] as string, x, y - ih, iw - 1, ih);
      fillRect(g, c.white, x + 1, y - ih + 2, iw - 3, 1);
      fillRect(g, c.ink, x + iw - 2, y - ih, 1, ih);
      x += iw;
    }
    fillRect(g, c.white, 0, y, w, 1);
    fillRect(g, c.wallLo, 0, y + 1, w, 2);
  }
  fillRect(g, c.white, 0, top, w, 1);
};

const shopLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`kj-shop:${sigOf(c)}`, f.w, f.h, (g) => {
    const s = shopOf(f);
    fillRect(g, c.wall, 0, 0, f.w, f.h);
    paintCeiling(g, s, f.w, c);
    paintFridges(g, s, f.w, c);
    paintFloor(g, s, f.w, f.h, c);
  });

const frameLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`kj-frame:${sigOf(c)}`, f.w, f.h, (g) => paintFrame(g, shopOf(f), c));

const counterLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`kj-counter:${sigOf(c)}`, f.w, f.h, (g) => paintCounter(g, shopOf(f), c));

const shelfLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`kj-shelf:${sigOf(c)}`, f.w, f.h, (g) => paintShelf(g, shopOf(f).shelf, f.w, f.h, c));

const room = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(shopLayer(f, c), 0, 0);
};

const frame = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(frameLayer(f, c), 0, 0);
};

const front = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(counterLayer(f, c), 0, 0);
};

const aisle = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  if (shopOf(f).shelf < f.h) ctx.drawImage(shelfLayer(f, c), 0, 0);
};

// The tubes overhead brighten a touch on the kick.
const lights = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  if (f.kick < 0.5) return;
  for (let x = 6; x < f.w; x += 40) drawGlow(ctx, x + 12, 3, 9, c.light, 0.5);
};

// ---- the decks, the girl and her hands ----

const platter = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, y: number): void => {
  fillRect(ctx, c.ink, x + 2, y, 12, 4);
  fillRect(ctx, c.ink, x + 1, y + 1, 14, 2);
  fillRect(ctx, c.neonA, x + 7, y + 1, 2, 2);
  const a = f.t * Math.PI * 2 * 0.55;
  fillRect(ctx, c.white, Math.round(x + 7.5 + Math.cos(a) * 5), Math.round(y + 1.5 + Math.sin(a) * 1.5), 1, 1);
};

const mixer = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, y: number): void => {
  fillRect(ctx, c.ink, x + 1, y, 10, 4);
  const meters = [c.neonB, c.neonC, c.neonA];
  for (let k = 0; k < 2; k++) {
    const level = Math.min(4, Math.round((f.kick * 0.7 + f.energy * 0.3 + rand(Math.floor(f.t * 12), k) * 0.3) * 4));
    for (let j = 0; j < level; j++) fillRect(ctx, meters[Math.min(2, j >> 1)] as string, x + 3 + k * 5, y + 3 - j, 1, 1);
  }
  fillRect(ctx, c.metal, x + 4, y + 4, 4, 1);
};

const decks = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const s = shopOf(f);
  const cx = s.girl;
  const y = s.top - 6;
  for (const [x, w] of [
    [cx - 22, 16],
    [cx - 6, 12],
    [cx + 6, 16],
  ] as const) {
    fillRect(ctx, c.deck, x, y, w, 6);
    fillRect(ctx, c.metal, x, y, w, 1);
    fillRect(ctx, c.ink, x, y + 5, w, 1);
  }
  platter(ctx, f, c, cx - 22, y + 1);
  platter(ctx, f, c, cx + 6, y + 1);
  mixer(ctx, f, c, cx - 6, y + 1);
};

const girl = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const s = shopOf(f);
  const x = s.girl - 18;
  const y = s.top - 46;
  const palette = paletteOf(c, girlPalette);
  drawSprite(ctx, BODY, palette, x, y + 25);
  drawGirl(ctx, f, HEAD, palette, x, y + onBeat(f.beat), GIRL);
};

// Her left hand rides the mixer; her right hand scratches the record back and forth with the beat.
const hands = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const s = shopOf(f);
  const palette = paletteOf(c, girlPalette);
  const scratch = Math.round(Math.sin(f.beat * Math.PI * 2) * 2);
  drawSprite(ctx, HAND, palette, s.girl - 10, s.top - 9 + onBeat(f.beat + 0.5));
  drawSprite(ctx, HAND, palette, s.girl + 5 + scratch, s.top - 9);
};

// Her paper cup of coffee, still steaming.
const coffee = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const s = shopOf(f);
  const x = s.girl - 32;
  const y = s.top - 7;
  fillRect(ctx, c.ink, x - 1, y - 1, 7, 8);
  fillRect(ctx, c.white, x, y, 5, 7);
  fillRect(ctx, c.vest, x, y + 3, 5, 2);
  fillRect(ctx, c.metal, x - 1, y - 2, 7, 2);
  for (let k = 0; k < 6; k++) {
    const age = frac(f.t * 0.45 + k / 6);
    if (age > 0.8 && k % 2 === 0) continue;
    fillRect(ctx, c.white, Math.round(x + 2 + Math.sin(age * 6 + f.t + k) * 1.5), Math.round(y - 4 - age * 14), 1, 1);
  }
};

// A glass case of warm snacks at the end of the counter.
const warmer = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const s = shopOf(f);
  const x = s.warmer;
  const y = s.top - 15;
  drawGlow(ctx, x + 11, y + 8, 14, c.warm, 0.25);
  fillRect(ctx, c.metal, x, y, 22, 15);
  fillRect(ctx, c.warm, x + 1, y + 2, 20, 12);
  fillRect(ctx, c.white, x + 1, y + 2, 20, 1);
  fillRect(ctx, c.metal, x + 1, y + 8, 20, 1);
  for (let k = 0; k < 4; k++) {
    fillRect(ctx, c.counter, x + 2 + k * 5, y + 4, 4, 3);
    fillRect(ctx, c.vest, x + 3 + k * 5, y + 10, 2, 3);
  }
  fillRect(ctx, c.white, x + 2, y + 3, 1, 10);
};

// ---- the cat ----

const cat = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const { x, base } = shopOf(f).cat;
  catTail(ctx, x - 5, base - 2, 9, 2 + Math.sin(f.beat * Math.PI) * 3, c.deck, c.ink, -1);
  drawSpriteFoot(ctx, CAT, paletteOf(c, catPalette), x, base);
};

export const konbiniDj = defineScene<K>({
  id: 'konbini-dj',
  title: '3AM Shift',
  mood: { valence: 0.3, energy: 0.6 },
  styles: ['city-lights', 'neon-rush', 'lofi-loop', 'nineties-pop', 'city-groove', 'technopop', 'eurobeat'],
  variants: [
    {
      mood: { valence: 0.3, energy: 0.6 },
      colors: {
        sky0: '#0a0820',
        sky1: '#2a1450',
        bldg: '#140f2e',
        haze: '#2c1f52',
        neonA: '#ff4fa0',
        neonB: '#3ff0ff',
        neonC: '#ffe04a',
        road: '#1a1430',
        rain: '#7a82c8',
        wall: '#e6e2f0',
        wallLo: '#b6aed0',
        light: '#ffffff',
        metal: '#8c88a8',
        fridge: '#e8fbff',
        fridgeLo: '#9cc8da',
        counter: '#f4f0fa',
        floor: '#d2cde4',
        deck: '#2a2838',
        ink: '#1a1424',
        skin: '#ffe0cc',
        skinLo: '#f0b29a',
        blush: '#ff8aa8',
        hair: '#ff8fc4',
        hairHi: '#ffd2ea',
        hairLo: '#d24f8e',
        iris: '#3f6ff0',
        white: '#fbfaff',
        hoodie: '#84e8c4',
        hoodieLo: '#3eae94',
        vest: '#b49cf0',
        warm: '#ffb04a',
      },
    },
    {
      mood: { valence: 0, energy: -0.1 },
      colors: {
        sky0: '#06141c',
        sky1: '#123444',
        bldg: '#0a1a24',
        haze: '#173848',
        neonA: '#ff6a7a',
        neonB: '#4adfc0',
        neonC: '#ffcf6a',
        road: '#0e1e26',
        rain: '#5e9aa8',
        wall: '#bdb4aa',
        wallLo: '#8e857e',
        light: '#fff4dc',
        metal: '#6c6a70',
        fridge: '#d8f4ec',
        fridgeLo: '#7aa8a0',
        counter: '#dad2c6',
        floor: '#aaa29a',
        deck: '#262428',
        ink: '#161214',
        skin: '#ffdcc6',
        skinLo: '#e8a890',
        blush: '#ff8890',
        hair: '#f48ab4',
        hairHi: '#ffc8dc',
        hairLo: '#c04c7c',
        iris: '#2f8a9c',
        white: '#f4f0ea',
        hoodie: '#8ad8bc',
        hoodieLo: '#4a9c86',
        vest: '#a894d8',
        warm: '#ffa040',
      },
    },
    {
      mood: { valence: 0.6, energy: 0.8 },
      colors: {
        sky0: '#12002a',
        sky1: '#4a0a5a',
        bldg: '#1c0630',
        haze: '#3a1450',
        neonA: '#ff3ad0',
        neonB: '#40ffd8',
        neonC: '#fff04a',
        road: '#220a34',
        rain: '#9a7ad0',
        wall: '#f2ecff',
        wallLo: '#c4b4e8',
        light: '#ffffff',
        metal: '#9a8ab8',
        fridge: '#f0fdff',
        fridgeLo: '#a8d4f0',
        counter: '#fbf6ff',
        floor: '#ddd2f2',
        deck: '#2c2040',
        ink: '#1c1028',
        skin: '#ffe2cf',
        skinLo: '#f2b09a',
        blush: '#ff7eb0',
        hair: '#ff86d0',
        hairHi: '#ffd6f2',
        hairLo: '#d0409a',
        iris: '#5a5af8',
        white: '#ffffff',
        hoodie: '#7cf0d0',
        hoodieLo: '#36b8a0',
        vest: '#c09cff',
        warm: '#ffb84a',
      },
    },
  ],
  layers: [room, street, frame, lights, girl, front, decks, hands, coffee, warmer, aisle, cat],
});
