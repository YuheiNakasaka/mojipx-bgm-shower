// A street parade of round blob folk: the front row hops forward on every beat, the back row on the off-beats,
// squashing as they land. Bunting sways overhead, balloons drift up, and confetti cannons fire every four beats.
import { type Ctx, drawSpriteFoot, fillRect, mixColor, type Palette, type Sprite } from 'mojipx';
import { disc, ditherGradient, frac, pixelLine, rand, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { memoLayer, paletteOf, sigOf } from './batch-3-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'star'
  | 'town'
  | 'townAlt'
  | 'roof'
  | 'townLight'
  | 'street'
  | 'streetLight'
  | 'shadow'
  | 'string'
  | 'outline'
  | 'eye'
  | 'blush'
  | 'body0'
  | 'body1'
  | 'body2'
  | 'body3'
  | 'body4'
  | 'haze';

const BODIES = ['body0', 'body1', 'body2', 'body3', 'body4'] as const;

// ---- blob sprites: 'b' body, 'B' light, 'd' shade, 'o' outline, 'e' eye, 'p' blush ----

const STAND: Sprite = [
  '....oooo....',
  '..oobbbboo..',
  '.oBBbbbbbbo.',
  '.oBbbbbbbbo.',
  'obbbbebbebbo',
  'obbbbebbebbo',
  'obbpbbbbbbpo',
  'obbbbbbeebbo',
  'odbbbbbbbbdo',
  '.oddbbbbddo.',
  '..oooooooo..',
];

const SQUASH: Sprite = [
  '.....oooo.....',
  '...oobbbboo...',
  '.ooBBbbbbbbbo.',
  'oBbbbbebbebbbo',
  'obbbbbebbebbbo',
  'obbbpbbbbbbpbo',
  'oddbbbbbeebbdo',
  '.oddddbbbbddo.',
  '..oooooooooo..',
];

const STRETCH: Sprite = [
  '...oooo...',
  '..obbbbo..',
  '.oBBbbbbo.',
  '.oBbbbbbo.',
  'obbbebbebo',
  'obbbebbebo',
  'obbpbbbbpo',
  'obbbbbeebo',
  'obbbbbbbbo',
  '.odbbbbdo.',
  '.oddbbddo.',
  '..oooooo..',
];

const BIG_STAND: Sprite = [
  '......oooo......',
  '....oobbbboo....',
  '...obBBbbbbbo...',
  '..obBBbbbbbbbo..',
  '.obBbbbbbbbbbbo.',
  '.obbbbbbbbbbbbo.',
  'obbbbbwebbwebbbo',
  'obbbbbeebbeebbbo',
  'obbppbbbbbbbppbo',
  'obbbbbbmbbmbbbbo',
  'odbbbbbbmmbbbbdo',
  '.oddbbbbbbbbddo.',
  '..ooddddddddoo..',
  '....oooooooo....',
];

const BIG_SQUASH: Sprite = [
  '.......oooo.......',
  '....ooobbbbooo....',
  '..oobBBbbbbbbboo..',
  '.obBBbbbbbbbbbbbo.',
  'obBbbbbwebbwebbbbo',
  'obbbbbbeebbeebbbbo',
  'obbbppbbbbbbbbppbo',
  'obbbbbbmbbmbbbbbbo',
  'odbbbbbbmmbbbbbbdo',
  '.oddbbbbbbbbbbddo.',
  '..oooddddddddooo..',
  '.....oooooooo.....',
];

const BIG_STRETCH: Sprite = [
  '.....oooo.....',
  '....obbbbo....',
  '...obBBbbbo...',
  '..obBBbbbbbo..',
  '..obBbbbbbbo..',
  '.obbbbbbbbbbo.',
  '.obbbwebbwebo.',
  '.obbbeebbeebo.',
  '.obpbbbbbbpbo.',
  '.obbbbmbbmbbo.',
  '.obbbbbmmbbbo.',
  '.obbbbbbbbbbo.',
  '.odbbbbbbbbdo.',
  '..oddbbbbddo..',
  '...oddddddo...',
  '....oooooo....',
];

const CONE: Sprite = ['..w..', '..h..', '.hHh.', '.hhh.', 'hHhhh'];
const SPROUT: Sprite = ['gg.gg', '.ggg.', '..g..', '..g..'];
const BOW: Sprite = ['hh.hh', 'hhwhh', 'hh.hh'];
const HATS = [CONE, SPROUT, BOW, null] as const;

// One palette builder per body color (and per row), so every palette is built once and keeps its identity.
const bodyBuilder =
  (key: (typeof BODIES)[number], haze: number) =>
  (c: Colors<K>): Palette => {
    const tone = (hex: string): string => (haze > 0 ? mixColor(hex, c.haze, haze) : hex);
    return {
      o: tone(c.outline),
      b: tone(c[key]),
      B: tone(mixColor(c[key], '#ffffff', 0.45)),
      d: tone(mixColor(c[key], c.outline, 0.3)),
      e: tone(c.eye),
      p: tone(c.blush),
      w: tone('#ffffff'),
    };
  };
// Palette builders by distance: index 0 is the front row, then farther rows fade into the haze.
const HAZES = [0, 0.2, 0.4] as const;
const BODY_PALETTES = HAZES.map((haze) => BODIES.map((b) => bodyBuilder(b, haze)));

const hatBuilder =
  (key: (typeof BODIES)[number], haze: number) =>
  (c: Colors<K>): Palette => {
    const tone = (hex: string): string => (haze > 0 ? mixColor(hex, c.haze, haze) : hex);
    return { h: tone(c[key]), H: tone(mixColor(c[key], '#ffffff', 0.5)), w: tone('#ffffff'), g: tone(c.body2) };
  };
const HAT_PALETTES = HAZES.map((haze) => BODIES.map((b) => hatBuilder(b, haze)));

// ---- the march ----

type Row = {
  readonly base: number;
  readonly spacing: number;
  readonly step: number;
  readonly offbeat: number;
  readonly hop: number;
  readonly seed: number;
  /** 0 for the front row (big sprites), 1–2 for rows farther back. */
  readonly depth: 0 | 1 | 2;
};

// Landscape shows a back and a front row; portrait, with room to spare, adds a middle row.
const rowsOf = (f: Frame): readonly Row[] => {
  const front: Row = {
    base: Math.round(f.h * 0.88),
    spacing: 30,
    step: 6,
    offbeat: 0,
    hop: 6 + Math.round(4 * f.energy),
    seed: 3,
    depth: 0,
  };
  if (f.h <= f.w) return [{ base: Math.round(f.h * 0.64), spacing: 22, step: 4, offbeat: 0.5, hop: 4, seed: 7, depth: 2 }, front];
  return [
    { base: Math.round(f.h * 0.56), spacing: 22, step: 4, offbeat: 0.5, hop: 4, seed: 7, depth: 2 },
    { base: Math.round(f.h * 0.71), spacing: 24, step: 5, offbeat: 0, hop: 5, seed: 5, depth: 1 },
    front,
  ];
};

const blobSprite = (p: number, big: boolean): Sprite => {
  if (p < 0.1 || p > 0.94) return big ? BIG_SQUASH : SQUASH;
  return p < 0.45 ? (big ? BIG_STRETCH : STRETCH) : big ? BIG_STAND : STAND;
};

const shadow = (ctx: Ctx, c: Colors<K>, x: number, base: number, lift: number, big: boolean): void => {
  const half = (big ? 6 : 4) - Math.min(2, Math.floor(lift / 3));
  fillRect(ctx, c.shadow, x - half, base, half * 2, 1);
};

const blob = (ctx: Ctx, f: Frame, c: Colors<K>, row: Row, i: number, x: number): void => {
  const p = frac(f.beat - row.offbeat);
  const lift = Math.round(Math.sin(Math.PI * Math.min(1, p / 0.9)) * row.hop);
  const kind = Math.floor(rand(i, row.seed) * BODIES.length);
  const big = row.depth === 0;
  const sprite = blobSprite(p, big);
  const y = row.base - lift;
  shadow(ctx, c, x, row.base, lift, big);
  drawSpriteFoot(ctx, sprite, paletteOf(c, BODY_PALETTES[row.depth]?.[kind] ?? bodyBuilder('body0', 0)), x, y);
  const hat = HATS[Math.floor(rand(i, row.seed + 1) * HATS.length)];
  const hatPalette = HAT_PALETTES[row.depth]?.[(kind + 2) % BODIES.length] ?? hatBuilder('body0', 0);
  if (hat) drawSpriteFoot(ctx, hat, paletteOf(c, hatPalette), x, y - sprite.length + 1);
  if (big && rand(i, 9) < 0.3) flag(ctx, f, c, x + 8, y - 6, kind);
};

const flag = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, y: number, kind: number): void => {
  pixelLine(ctx, x, y, x, y - 13, c.outline);
  const color = c[BODIES[(kind + 3) % BODIES.length] ?? 'body0'];
  const wave = Math.floor(f.beat * 2) % 2;
  fillRect(ctx, color, x + 1, y - 13, 5, 2);
  fillRect(ctx, color, x + 1, y - 11 + wave, 4, 1);
  fillRect(ctx, color, x + 1, y - 10 + wave, 2, 1);
};

const march = (ctx: Ctx, f: Frame, c: Colors<K>, row: Row): void => {
  const count = Math.ceil(f.w / row.spacing) + 2;
  const loop = count * row.spacing;
  const beat = f.beat - row.offbeat;
  const p = frac(beat);
  const travel = (Math.floor(beat) + Math.min(1, p / 0.9)) * row.step;
  for (let i = 0; i < count; i++) {
    const x = ((((i * row.spacing + travel) % loop) + loop) % loop) - row.spacing;
    blob(ctx, f, c, row, i, Math.round(x));
  }
};

// ---- scenery ----

// Gabled houses of two wall colors with lit windows, on a tile that repeats every 120 pixels.
const house = (g: Ctx, c: Colors<K>, i: number, x: number, h: number): number => {
  const bw = 14 + 2 * Math.round(rand(i, 21) * 6);
  const bh = Math.round(h * (0.4 + 0.4 * rand(i, 22)));
  const top = h - bh;
  const wall = i % 2 === 0 ? c.town : c.townAlt;
  fillRect(g, wall, x, top, bw, bh);
  for (let r = 0; r < bw / 2; r++) fillRect(g, c.roof, x + r, top - 1 - r, bw - 2 * r, 1);
  for (let wy = top + 3; wy < h - 5; wy += 7)
    for (let wx = x + 3; wx < x + bw - 3; wx += 5) if (rand(wx, wy) < 0.7) fillRect(g, c.townLight, wx, wy, 2, 3);
  return bw + 2;
};

const townTile = (h: number, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`parade-town:${h}:${sigOf(c)}`, 120, h, (g) => {
    for (let i = 0, x = 0; x < 120; i++) x += house(g, c, i, x, h);
  });

// Cobbles: rows of bricks, each row offset by half a brick.
const streetImage = (w: number, h: number, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`parade-street:${w}x${h}:${sigOf(c)}`, w, h, (g) => {
    fillRect(g, c.street, 0, 0, w, h);
    for (let y = 0; y < h; y += 8) {
      fillRect(g, c.streetLight, 0, y, w, 1);
      for (let x = (y / 8) % 2 === 0 ? 0 : 8; x < w; x += 16) fillRect(g, c.streetLight, x, y, 1, 8);
    }
  });

const garland = (w: number, top: number, sag: number, c: Colors<K>, seed: number): HTMLCanvasElement =>
  memoLayer(`parade-garland:${w}:${top}:${sag}:${seed}:${sigOf(c)}`, w, top + sag + 8, (g) => {
    const swag = Math.max(90, Math.round(w / Math.max(1, Math.round(w / 140))));
    const yAt = (x: number): number => top + Math.round(sag * 4 * frac(x / swag) * (1 - frac(x / swag)));
    for (let x = 0; x < w; x++) fillRect(g, c.string, x, yAt(x), 1, 1);
    for (let x = 3; x < w; x += 8) {
      const color = c[BODIES[Math.floor(rand(x, seed) * BODIES.length)] ?? 'body0'];
      const y = yAt(x) + 1;
      for (let r = 0; r < 5; r++) fillRect(g, color, x - 2 + Math.floor(r / 2), y + r, 5 - Math.floor(r / 2) * 2, 1);
    }
  });

const backdrop = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const rows = rowsOf(f);
  const back = rows[0] as Row;
  ctx.drawImage(ditherGradient(f.w, back.base, [c.sky0, c.sky1, c.sky2]), 0, 0);
  // A daytime variant hides the stars by giving them the sky's own color.
  if (c.star !== c.sky0) stars(ctx, f.w, f.h, f.t, [c.star], Math.round((f.w * f.h) / 1500), 5, 0.45);
  const townH = Math.round(Math.min(f.w, f.h) * 0.28);
  const tile = townTile(townH, c);
  const drift = Math.round(f.t * 2) % tile.width;
  for (let x = -drift; x < f.w; x += tile.width) ctx.drawImage(tile, x, back.base - townH - 4);
  ctx.drawImage(streetImage(f.w, f.h - back.base + 6, c), 0, back.base - 6);
  fillRect(ctx, c.roof, 0, back.base - 6, f.w, 1);
};

const bunting = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const sway = Math.round(Math.sin(f.beat * Math.PI) * 0.7);
  ctx.drawImage(garland(f.w, Math.round(f.h * 0.05), 8, c, 1), 0, sway);
  ctx.drawImage(garland(f.w + 40, Math.round(f.h * 0.15), 10, c, 2), -20, -sway);
};

const balloons = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const back = rowsOf(f)[0] as Row;
  const count = Math.max(3, Math.round(f.h / 65));
  for (let i = 0; i < count; i++) {
    const rise = frac(rand(i, 31) + f.t / (14 + 8 * rand(i, 32)));
    const y = Math.round(back.base - rise * (back.base + 20));
    const x = Math.round(rand(i, 33) * f.w + Math.sin(f.t * 0.8 + i * 2) * 4);
    const color = c[BODIES[i % BODIES.length] ?? 'body0'];
    for (let k = 1; k < 10; k++) fillRect(ctx, c.string, x + Math.round(Math.sin(f.t * 3 + k * 0.7) * 0.8), y + 4 + k, 1, 1);
    disc(ctx, x, y, 4, (dy) => (dy < -1 ? mixColor(color, '#ffffff', 0.35) : color));
    fillRect(ctx, '#ffffff', x - 2, y - 2, 1, 1);
  }
};

const CONFETTI_SHAPES = [
  [2, 1],
  [1, 1],
  [1, 2],
] as const;

const piece = (ctx: Ctx, f: Frame, c: Colors<K>, i: number, x: number, y: number): void => {
  const [pw, ph] = CONFETTI_SHAPES[(Math.floor(f.t * 7) + i) % 3] ?? [1, 1];
  fillRect(ctx, c[BODIES[i % BODIES.length] ?? 'body0'], Math.round(x), Math.round(y), pw, ph);
};

const confetti = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const n = Math.min(130, Math.round((f.w * f.h) / 700));
  for (let i = 0; i < n; i++) {
    const x = rand(i, 11) * f.w + Math.sin(f.t * (1 + rand(i, 12) * 2) + i) * 5;
    const y = frac(rand(i, 13) + (f.t * (18 + 18 * rand(i, 14))) / f.h) * (f.h + 4) - 2;
    piece(ctx, f, c, i, x, y);
  }
};

// Two cannons at the street corners fire on every bar; pieces slow in the air and flutter down.
const cannons = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  // Every four beats rather than every bar, so a track in three still gets its bursts.
  const volley = Math.floor(f.beat / 4);
  const a = f.beat - volley * 4;
  if (a < 0 || a > 3.8) return;
  const base = f.h * 0.92;
  const drag = (1 - Math.exp(-2.5 * a)) / 2.5;
  for (let i = 0; i < 40; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const vx = f.w * (0.5 + 0.9 * rand(i, volley));
    const vy = f.h * (1.4 + 1.1 * rand(i, volley + 1));
    const x = (side > 0 ? 0 : f.w) + side * vx * drag + Math.sin(a * 4 + i) * 2;
    const y = base - vy * drag + f.h * 0.1 * a;
    if (y < f.h) piece(ctx, f, c, i, x, y);
  }
};

const parade = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const rows = rowsOf(f);
  rows.forEach((row, i) => {
    march(ctx, f, c, row);
    if (i === 0) balloons(ctx, f, c);
  });
};

export const pixelParade = defineScene<K>({
  id: 'pixel-parade',
  title: 'Pixel Parade',
  mood: { valence: 0.75, energy: 0.6 },
  styles: ['puzzle-pop', 'nineties-pop', 'summer-festival', 'fm-funk'],
  variants: [
    {
      mood: { valence: 0.85, energy: 0.6 },
      colors: {
        sky0: '#3cb0ff',
        sky1: '#7ccfff',
        sky2: '#c8eeff',
        star: '#3cb0ff',
        town: '#fff1d6',
        townAlt: '#ffd9c2',
        roof: '#e8706a',
        townLight: '#8fc4e8',
        street: '#f2cfa0',
        streetLight: '#e6bb8a',
        shadow: '#d4a271',
        string: '#6a4a5a',
        outline: '#3b2a4a',
        eye: '#2a1d33',
        blush: '#ff8fb0',
        body0: '#ff7eb6',
        body1: '#ffd84d',
        body2: '#5fe3a8',
        body3: '#6cb6ff',
        body4: '#c49bff',
        haze: '#d8eefc',
      },
    },
    {
      mood: { valence: 0.5, energy: 0.4 },
      colors: {
        sky0: '#120c34',
        sky1: '#2c1a5c',
        sky2: '#5a2c78',
        star: '#ffe6a8',
        town: '#2c1f58',
        townAlt: '#352466',
        roof: '#1c1240',
        townLight: '#ffcf6a',
        street: '#3a2c5c',
        streetLight: '#33275a',
        shadow: '#251a46',
        string: '#c8a8d8',
        outline: '#1a1030',
        eye: '#1a1030',
        blush: '#ff7aa8',
        body0: '#ff6aa8',
        body1: '#ffd24a',
        body2: '#4ae0b0',
        body3: '#5ab0ff',
        body4: '#c088ff',
        haze: '#3a2a66',
      },
    },
  ],
  layers: [backdrop, bunting, parade, confetti, cannons],
});
