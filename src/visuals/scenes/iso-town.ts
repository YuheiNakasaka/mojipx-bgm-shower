// An isometric town-building game: a little island town where a cursor rebuilds one lot every bar, buildings rise
// tile by tile, cars run the roads, and day turns to night with the windows lighting up one by one.
import { type Ctx, drawSprite, fillRect, type Palette, type Sprite } from 'mojipx';
import { cached, disc, frac, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { cloudCanvas, drawGlow, fillDither, wrap } from './batch-1-helpers.ts';
import { paletteOf, sigOf } from './batch-3-helpers.ts';
import { drawText, noise2, textWidth } from './batch-4-helpers.ts';
import { digits } from './batch-8-helpers.ts';
import { memoLayer, shiftColors } from './batch-12-helpers.ts';

type K =
  | 'sea'
  | 'seaHi'
  | 'sand'
  | 'grass'
  | 'grassLo'
  | 'road'
  | 'mark'
  | 'wallL'
  | 'wallR'
  | 'roofA'
  | 'roofB'
  | 'roofC'
  | 'glass'
  | 'leaf'
  | 'leafLo'
  | 'cloud'
  | 'hud'
  | 'hudLo'
  | 'text'
  | 'cursor'
  | 'lamp'
  | 'night'
  | 'ink';

const TW = 24;
const TH = 12;

// ---- the map: an island shaped to the screen, cut into blocks by a grid of streets ----

type Isle = {
  readonly key: string;
  readonly n: number;
  readonly mid: number;
  readonly ox: number;
  readonly oy: number;
  readonly wide: boolean;
  /** How far a tile lies from the island's middle: 0 at the centre, 1 at the shore. */
  readonly reach: (i: number, j: number) => number;
};

/** Screen position of a tile's top corner. */
const tileXY = (v: Isle, i: number, j: number): readonly [number, number] => [v.ox + (i - j) * (TW / 2), v.oy + (i + j) * (TH / 2)];

const isleOf = (f: Frame): Isle => {
  const wide = f.w > f.h;
  const mid = Math.ceil((f.w / TW + f.h / TH) / 2) + 2;
  const cx = Math.round(f.w / 2);
  const cy = Math.round(f.h / 2 + (wide ? 8 : 0));
  const rx = f.w * (wide ? 0.4 : 0.44);
  const ry = f.h * (wide ? 0.36 : 0.37);
  const ox = cx;
  const oy = cy - mid * TH - TH / 2;
  const reach = (i: number, j: number): number => {
    const x = ox + (i - j) * (TW / 2);
    const y = oy + (i + j) * (TH / 2) + TH / 2;
    return Math.hypot((x - cx) / rx, (y - cy) / ry) - (noise2(i * 0.35, j * 0.35, 3) - 0.5) * 0.5;
  };
  return { key: `${f.w}x${f.h}`, n: mid * 2 + 1, mid, ox, oy, wide, reach };
};

const isles = new Map<string, Isle>();
const viewOf = (f: Frame): Isle => cached(isles, 4, `${f.w}x${f.h}`, () => isleOf(f));

const land = (v: Isle, i: number, j: number): boolean => v.reach(i, j) < 1;
const streetI = (v: Isle, i: number): boolean => (((i - v.mid) % 5) + 5) % 5 === 0;
const streetJ = (v: Isle, j: number): boolean => (((j - v.mid + 2) % 5) + 5) % 5 === 0;
const road = (v: Isle, i: number, j: number): boolean => land(v, i, j) && v.reach(i, j) < 0.9 && (streetI(v, i) || streetJ(v, j));

// ---- the clock: a day is 128 beats; the colors shift toward the evening and the night ----

const DAY_BEATS = 128;
const hourOf = (beat: number): number => frac(Math.max(0, beat) / DAY_BEATS + 0.3) * 24;
const nightLevel = (beat: number): number => {
  const h = hourOf(beat);
  if (h >= 6 && h < 16) return 0;
  if (h >= 16 && h < 18) return 1;
  if (h >= 4 && h < 6) return 1;
  return h >= 18 && h < 19.5 ? 2 : 3;
};
const atHour = (c: Colors<K>, beat: number): Colors<K> => {
  const level = nightLevel(beat);
  return level === 0 ? c : shiftColors(c, level === 1 ? c.lamp : c.night, level === 1 ? 0.12 : level === 2 ? 0.3 : 0.5);
};
const lit = (beat: number): boolean => nightLevel(beat) >= 2;

// ---- the ground (one cached layer per hour) ----

const diamond = (g: Ctx, x: number, y: number, color: string): void => {
  g.fillStyle = color;
  for (let r = 0; r < TH; r++) {
    const half = r < TH / 2 ? (r + 1) * 2 : (TH - r) * 2;
    g.fillRect(x - half, y + r, half * 2, 1);
  }
};

const roadMarks = (g: Ctx, v: Isle, i: number, j: number, c: Colors<K>): void => {
  const [x, y] = tileXY(v, i, j);
  if (streetI(v, i) && streetJ(v, j)) return;
  const alongI = streetJ(v, j);
  for (let k = -2; k <= 2; k += 4) fillRect(g, c.mark, x + (alongI ? k : -k), y + 5 + Math.round(k / 2), 2, 1);
};

const eachTile = (n: number, pad: number, each: (i: number, j: number) => void): void => {
  for (let i = -pad; i < n + pad; i++) for (let j = -pad; j < n + pad; j++) each(i, j);
};

const shallows = (g: Ctx, v: Isle, c: Colors<K>): void => {
  eachTile(v.n, 1, (i, j) => {
    const r = v.reach(i, j);
    if (r >= 1 && r < 1.12) diamond(g, ...tileXY(v, i, j), c.seaHi);
  });
};

const landTile = (g: Ctx, v: Isle, i: number, j: number, c: Colors<K>): void => {
  const [x, y] = tileXY(v, i, j);
  const street = road(v, i, j);
  fillRect(g, c.sand, x - 12, y + 6, 24, 9);
  diamond(g, x, y, street ? c.road : v.reach(i, j) > 0.93 ? c.sand : (i + j) % 2 === 0 ? c.grass : c.grassLo);
  if (street) roadMarks(g, v, i, j, c);
};

const swell = (g: Ctx, f: Frame, c: Colors<K>): void => {
  for (let k = 0; k < 70; k++) {
    const x = Math.round(rand(k, 51) * f.w);
    const y = Math.round(rand(k, 52) * f.h);
    fillRect(g, c.seaHi, x, y, 3 + Math.round(rand(k, 53) * 5), 1);
    fillRect(g, c.seaHi, x + 2, y - 1, 2, 1);
  }
};

const ground = (f: Frame, v: Isle, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`town-ground:${sigOf(c)}`, f.w, f.h, (g) => {
    fillRect(g, c.sea, 0, 0, f.w, f.h);
    swell(g, f, c);
    shallows(g, v, c);
    eachTile(v.n, 0, (i, j) => {
      if (land(v, i, j)) landTile(g, v, i, j, c);
    });
  });

const background = (ctx: Ctx, f: Frame, base: Colors<K>): void => {
  const c = atHour(base, f.beat);
  ctx.drawImage(ground(f, viewOf(f), c), 0, 0);
};

// Waves glinting on the sea around the island.
const waves = (ctx: Ctx, f: Frame, base: Colors<K>): void => {
  const c = atHour(base, f.beat);
  for (let i = 0; i < 40; i++) {
    const x = Math.round(wrap(rand(i, 7) * f.w + f.t * (2 + rand(i, 8) * 3), f.w));
    const y = Math.round(rand(i, 9) * f.h);
    if (frac(f.t * 0.5 + rand(i, 10)) > 0.5) continue;
    fillRect(ctx, c.seaHi, x, y, 2 + (i % 3), 1);
  }
};

// ---- lots and buildings ----

// A lot is a land tile off the road; `order` is its turn in the rebuilding round, `reach` how far out it lies.
type Lot = { readonly i: number; readonly j: number; readonly k: number; readonly order: number; readonly reach: number };

const lotsOf = (v: Isle): readonly Lot[] => {
  const tiles: { readonly i: number; readonly j: number; readonly reach: number }[] = [];
  eachTile(v.n, 0, (i, j) => {
    if (land(v, i, j) && !road(v, i, j)) tiles.push({ i, j, reach: v.reach(i, j) });
  });
  const turns = tiles.map((_, k) => k).sort((a, z) => rand(a, 21) - rand(z, 21));
  const orderOf = new Map(turns.map((k, order) => [k, order]));
  return tiles.sort((a, z) => a.i + a.j - (z.i + z.j)).map((t, k) => ({ ...t, k, order: orderOf.get(k) ?? 0 }));
};

const lotCache = new Map<string, readonly Lot[]>();
const lotsFor = (v: Isle): readonly Lot[] => cached(lotCache, 4, v.key, () => lotsOf(v));

/** Kinds of building: walls height in pixels, roof style and color. */
type Kind = {
  readonly h: number;
  readonly roof: 'gable' | 'flat' | 'tree' | 'none';
  readonly tone: 'roofA' | 'roofB' | 'roofC';
  readonly floors: number;
};
const EMPTY: Kind = { h: 0, roof: 'none', tone: 'roofA', floors: 0 };
const KINDS: readonly Kind[] = [
  { h: 0, roof: 'tree', tone: 'roofA', floors: 0 },
  { h: 7, roof: 'gable', tone: 'roofA', floors: 1 },
  { h: 7, roof: 'gable', tone: 'roofB', floors: 1 },
  { h: 10, roof: 'flat', tone: 'roofC', floors: 2 },
  { h: 18, roof: 'flat', tone: 'roofB', floors: 4 },
  { h: 28, roof: 'flat', tone: 'roofC', floors: 6 },
];

// Every bar the cursor rebuilds one lot; each lot comes round again after all the others. Lots near the middle
// grow taller buildings, lots near the shore stay houses and trees.
const BAR = 4;

const kindOf = (lot: Lot, generation: number): Kind => {
  const d = lot.reach;
  if (d > 0.9) return EMPTY;
  if (rand(lot.k, generation + 77) < 0.14) return KINDS[0] as Kind;
  const roll = rand(lot.k * 31 + generation, 23) * 3 + (1 - d) * 3.4 - 0.8;
  return roll < 0 ? EMPTY : (KINDS[Math.min(KINDS.length - 1, Math.floor(roll))] as Kind);
};

type Built = { readonly lot: Lot; readonly kind: Kind; readonly grow: number };

const builtOf = (lot: Lot, count: number, beat: number): Built => {
  const bars = Math.max(0, beat) / BAR;
  const generation = Math.floor((bars - lot.order) / count);
  const since = (bars - lot.order - generation * count) * BAR;
  const grow = generation < 0 ? 1 : Math.min(1, since / 2.5);
  return { lot, kind: kindOf(lot, generation), grow };
};

// One wall of a box: columns from the tile's bottom corner out to its side corner, each `h` pixels tall.
const bottomAt = (top: number, k: number): number => top + TH - 1 - Math.floor(k / 2);

const face = (g: Ctx, x: number, top: number, h: number, dir: 1 | -1, wall: string, ink: string): void => {
  for (let k = 0; k < TW / 2; k++) {
    const cx = x + dir * k - (dir > 0 ? 0 : 1);
    const y = bottomAt(top, k);
    fillRect(g, k === TW / 2 - 1 || k === 0 ? ink : wall, cx, y - h, 1, h + 1);
  }
};

const windowsOn = (g: Ctx, x: number, top: number, kind: Kind, glass: string, night: boolean, seed: number): void => {
  for (let fl = 0; fl < kind.floors; fl++)
    for (const dir of [-1, 1] as const)
      for (let k = 3; k < TW / 2 - 2; k += 3) {
        if (night && rand(seed * 7 + fl * 5 + k, dir + 3) < 0.35) continue;
        const y = bottomAt(top, k) - kind.h + 2 + fl * 4;
        fillRect(g, glass, x + dir * k - (dir > 0 ? 0 : 1), y, 1, 2);
      }
};

const roofOf = (g: Ctx, x: number, top: number, kind: Kind, c: Colors<K>): void => {
  const color = c[kind.tone];
  if (kind.roof === 'flat') {
    diamond(g, x, top - kind.h, color);
    fillRect(g, c.ink, x - 1, top - kind.h - 3, 1, 4);
    return;
  }
  for (let r = 0; r < 9; r++) {
    const half = Math.round(4 + r * 1);
    fillRect(g, c.ink, x - half - 1, top - kind.h - 3 + r, half * 2 + 2, 1);
    fillRect(g, r < 2 ? c.mark : color, x - half, top - kind.h - 3 + r, half * 2, 1);
  }
};

const treeOf = (g: Ctx, x: number, top: number, c: Colors<K>): void => {
  for (const [dx, dy, r] of [
    [-5, 4, 4],
    [4, 6, 4],
    [0, 1, 5],
  ] as const) {
    fillRect(g, c.ink, x + dx, top + dy + 1, 1, 4);
    for (let y = -r; y <= r; y++) {
      const half = Math.round(Math.sqrt(r * r - y * y));
      fillRect(g, y > 1 ? c.leafLo : c.leaf, x + dx - half, top + dy - r + y, half * 2 + 1, 1);
    }
  }
};

const BOX_H = 44;

const buildingCanvas = (kind: Kind, c: Colors<K>, night: boolean, glass: string, seed: number): HTMLCanvasElement =>
  memoLayer(`town-b:${KINDS.indexOf(kind)}:${night}:${seed % 2}:${glass}:${sigOf(c)}`, TW + 2, BOX_H + TH, (g) => {
    const x = TW / 2 + 1;
    const top = BOX_H;
    if (kind.roof === 'tree') {
      treeOf(g, x, top, c);
      return;
    }
    face(g, x, top, kind.h, -1, c.wallL, c.ink);
    face(g, x, top, kind.h, 1, c.wallR, c.ink);
    windowsOn(g, x, top, kind, glass, night, seed % 2);
    roofOf(g, x, top, kind, c);
  });

const drawBuilt = (ctx: Ctx, v: Isle, b: Built, c: Colors<K>, base: Colors<K>, night: boolean): void => {
  if (b.kind === EMPTY) return;
  const [x, y] = tileXY(v, b.lot.i, b.lot.j);
  const canvas = buildingCanvas(b.kind, c, night, night ? base.lamp : c.glass, b.lot.k);
  const h = canvas.height;
  const show = Math.max(1, Math.round(h * b.grow));
  ctx.drawImage(canvas, 0, h - show, canvas.width, show, x - TW / 2 - 1, y + TH - show, canvas.width, show);
  if (b.grow < 1) scaffold(ctx, x, y, b.grow, c);
};

const scaffold = (ctx: Ctx, x: number, y: number, grow: number, c: Colors<K>): void => {
  const top = y + TH / 2 - Math.round(grow * 24) - 4;
  fillRect(ctx, c.cursor, x - 9, top, 1, y + TH - top);
  fillRect(ctx, c.cursor, x + 8, top, 1, y + TH - top);
  for (let r = top; r < y + TH; r += 4) fillRect(ctx, c.cursor, x - 9, r, 18, 1);
  for (let k = 0; k < 4; k++) fillDither(ctx, c.cloud, 0.5, x - 12 + k * 6 + Math.sin(grow * 9 + k) * 2, y + 6 - grow * 6, 5, 3);
};

const buildings = (ctx: Ctx, f: Frame, base: Colors<K>): void => {
  const c = atHour(base, f.beat);
  const v = viewOf(f);
  const lots = lotsFor(v);
  const night = lit(f.beat);
  for (const lot of lots) drawBuilt(ctx, v, builtOf(lot, lots.length, f.beat), c, base, night);
};

// ---- cars ----

const CARS: readonly Sprite[] = [
  ['.oo...', 'occoo.', 'ocwcco', '.ooocc', '...oo.'],
  ['...oo.', '.oocco', 'occwco', 'occoo.', '.oo...'],
];
const CAR_PALETTES = ['#ff5a4a', '#4a8aff', '#ffd23a', '#ffffff'].map(
  (paint) =>
    (c: Colors<K>): Palette => ({ o: c.ink, c: paint, w: c.glass }),
);

// Cars run the streets one way each: half along the i streets (down-left on screen), half along the j streets.
type Car = { readonly i: number; readonly j: number; readonly main: boolean; readonly onRoad: boolean };

const carAt = (v: Isle, k: number, t: number): Car => {
  const main = k % 2 === 0;
  const street = v.mid + (main ? 0 : -2) + ((k % 3) - 1) * 5;
  const u = frac(t * (0.02 + (k % 4) * 0.004) + k * 0.31);
  const pos = v.mid + (u * 2 - 1) * v.mid * (k % 4 < 2 ? 1 : -1);
  const i = main ? street + 0.3 : pos;
  const j = main ? pos : street + 0.3;
  return { i, j, main, onRoad: road(v, Math.round(main ? street : pos), Math.round(main ? pos : street)) };
};

const cars = (ctx: Ctx, f: Frame, base: Colors<K>): void => {
  const c = atHour(base, f.beat);
  const v = viewOf(f);
  for (let k = 0; k < 8; k++) {
    const car = carAt(v, k, f.t);
    if (!car.onRoad) continue;
    const [x, y] = tileXY(v, car.i, car.j);
    drawSprite(
      ctx,
      CARS[car.main ? 1 : 0] as Sprite,
      paletteOf(c, CAR_PALETTES[k % 4] as (c: Colors<K>) => Palette),
      Math.round(x) - 3,
      Math.round(y) + 3,
    );
    if (lit(f.beat)) drawGlow(ctx, base.lamp, Math.round(x) + (car.main ? -3 : 3), Math.round(y) + 7, 4, 2, 0.6);
  }
};

// ---- the cursor and the build ----

// The cursor clicks the lot being rebuilt on the bar's first beat, then glides on to the next one.
const cursor = (ctx: Ctx, f: Frame, base: Colors<K>): void => {
  const v = viewOf(f);
  const lots = lotsFor(v);
  const bars = Math.max(0, f.beat) / BAR;
  const bar = Math.floor(bars);
  const now = lots.find((lot) => lot.order === bar % lots.length);
  const next = lots.find((lot) => lot.order === (bar + 1) % lots.length);
  if (!now || !next) return;
  const glide = Math.min(1, Math.max(0, (bars - bar - 0.5) * 2));
  const [x0, y0] = tileXY(v, now.i, now.j);
  const [x1, y1] = tileXY(v, next.i, next.j);
  const x = Math.round(x0 + (x1 - x0) * glide);
  const y = Math.round(y0 + (y1 - y0) * glide);
  const press = glide === 0 && frac(f.beat) < 0.3 ? 2 : 0;
  outline(ctx, x, y, base.cursor, glide === 0 || frac(f.beat * 2) < 0.5);
  drawSprite(ctx, HAND, paletteOf(base, handColors), x + 2, y - 10 + press);
};

const outline = (ctx: Ctx, x: number, y: number, color: string, on: boolean): void => {
  if (!on) return;
  for (let r = 0; r < TH; r++) {
    const half = r < TH / 2 ? (r + 1) * 2 : (TH - r) * 2;
    fillRect(ctx, color, x - half, y + r, 2, 1);
    fillRect(ctx, color, x + half - 2, y + r, 2, 1);
  }
};

const handColors = (c: Colors<K>): Palette => ({ o: c.ink, w: '#ffffff' });

const HAND: Sprite = ['..oo.....', '.owwo....', '.owwo....', '.owwoooo.', 'oowwwwwwo', 'owwwwwwwo', 'owwwwwwwo', '.owwwwwo.', '..ooooo..'];

// ---- weather: cloud shadows over the town, and clouds passing above ----

const clouds = (ctx: Ctx, f: Frame, base: Colors<K>): void => {
  const c = atHour(base, f.beat);
  for (let i = 0; i < 3; i++) {
    const cloud = cloudCanvas(i, 12 + i * 3, c.cloud, c.mark);
    const lane = f.w + cloud.width * 2;
    const x = wrap(rand(i, 41) * lane + f.t * (3 + i), lane) - cloud.width;
    const y = f.h * (0.18 + i * 0.3);
    drawGlow(ctx, c.ink, x + 16 + cloud.width / 2, y + 40, cloud.width / 2, cloud.height / 2, 0.3);
    ctx.drawImage(cloud, Math.round(x), Math.round(y));
  }
};

// Street lamps at the crossings.
const nightGlow = (ctx: Ctx, f: Frame, base: Colors<K>): void => {
  if (!lit(f.beat)) return;
  const v = viewOf(f);
  for (let a = -3; a <= 3; a++)
    for (let b = -3; b <= 3; b++) {
      const i = v.mid + a * 5;
      const j = v.mid - 2 + b * 5;
      if (!road(v, i, j)) continue;
      const [x, y] = tileXY(v, i, j);
      drawGlow(ctx, base.lamp, x, y + TH / 2, 9, 5, 0.35 + f.kick * 0.1);
    }
};

// ---- the HUD ----

const hud = (ctx: Ctx, f: Frame, base: Colors<K>): void => {
  const v = viewOf(f);
  const lots = lotsFor(v);
  const pop =
    lots.reduce((sum, lot) => sum + builtOf(lot, lots.length, f.beat).kind.floors * 12, 0) + Math.floor(Math.max(0, f.beat) / BAR) * 3;
  const h = Math.floor(hourOf(f.beat));
  fillRect(ctx, base.ink, 0, 0, f.w, 14);
  fillRect(ctx, base.hudLo, 0, 13, f.w, 1);
  fillRect(ctx, base.hud, 0, 0, f.w, 13);
  drawText(ctx, `POP ${digits(pop, 4)}`, 4, 3, base.text);
  const clock = `${digits(h, 2)}:00`;
  drawText(ctx, clock, f.w - textWidth(clock) - 4, 3, base.text);
  if (v.wide) {
    disc(ctx, Math.round(f.w / 2 - 28), 6, 3, () => base.cursor);
    drawText(ctx, digits(48000 + pop * 7, 6), Math.round(f.w / 2 - 22), 3, base.text);
  }
  toolbar(ctx, f, v, base);
};

const TOOLS: readonly Sprite[] = [
  ['..o..', '.ooo.', 'ooooo', '.o.o.', '.ooo.'],
  ['ooooo', 'o.o.o', 'ooooo', 'o...o', 'ooooo'],
  ['.ooo.', 'ooooo', '.ooo.', '..o..', '..o..'],
  ['o...o', '.o.o.', '..o..', '.o.o.', 'o...o'],
];

const toolbar = (ctx: Ctx, f: Frame, v: Isle, base: Colors<K>): void => {
  const pick = Math.floor(Math.max(0, f.beat) / (BAR * 2)) % TOOLS.length;
  TOOLS.forEach((tool, i) => {
    const x = v.wide ? 4 : Math.round(f.w / 2 - 38 + i * 20);
    const y = v.wide ? 22 + i * 16 : f.h - 22;
    fillRect(ctx, base.ink, x - 1, y - 1, 15, 15);
    fillRect(ctx, i === pick ? base.cursor : base.hud, x, y, 13, 13);
    drawSprite(ctx, tool, { o: base.text }, x + 4, y + 4);
  });
};

export const isoTown = defineScene<K>({
  id: 'iso-town',
  title: 'Tiny Town',
  mood: { valence: 0.4, energy: 0.1 },
  styles: ['town-waltz', 'cozy-village', 'puzzle-pop', 'bossa-cafe', 'technopop'],
  variants: [
    {
      mood: { valence: 0.4, energy: 0.1 },
      colors: {
        sea: '#2a7ac8',
        seaHi: '#5aa8e8',
        sand: '#e8d090',
        grass: '#6ac24a',
        grassLo: '#58ae40',
        road: '#5a5a6a',
        mark: '#f0f0e0',
        wallL: '#d8c8b0',
        wallR: '#f4ead8',
        roofA: '#e05a4a',
        roofB: '#4a8ad8',
        roofC: '#8a8aa0',
        glass: '#8ad0f0',
        leaf: '#3aa040',
        leafLo: '#2a7834',
        cloud: '#ffffff',
        hud: '#f4e4c0',
        hudLo: '#a8805a',
        text: '#3a2a1a',
        cursor: '#ffd23a',
        lamp: '#ffd870',
        night: '#1a1a5a',
        ink: '#1e1a2a',
      },
    },
    {
      mood: { valence: 0.7, energy: 0.5 },
      colors: {
        sea: '#22a0d8',
        seaHi: '#7ad8f8',
        sand: '#fff0b0',
        grass: '#7ad85a',
        grassLo: '#62c24a',
        road: '#6a6a7e',
        mark: '#ffffff',
        wallL: '#ffd8c0',
        wallR: '#fff4ea',
        roofA: '#ff6a8a',
        roofB: '#ffb43a',
        roofC: '#6ac0e0',
        glass: '#a8e8ff',
        leaf: '#4ac850',
        leafLo: '#2e9a40',
        cloud: '#ffffff',
        hud: '#fff0f4',
        hudLo: '#d08aa0',
        text: '#4a2a3a',
        cursor: '#ff5a8a',
        lamp: '#ffe080',
        night: '#2a1a6a',
        ink: '#221a2a',
      },
    },
    {
      mood: { valence: -0.1, energy: -0.4 },
      colors: {
        sea: '#3a5a8a',
        seaHi: '#6a8ab0',
        sand: '#c8b490',
        grass: '#6a9a5a',
        grassLo: '#5a8a4e',
        road: '#4a4a58',
        mark: '#d8d8cc',
        wallL: '#b0a8a0',
        wallR: '#d0c8be',
        roofA: '#a84a4a',
        roofB: '#4a6a9a',
        roofC: '#6a6a7a',
        glass: '#7aa8c0',
        leaf: '#3a7a44',
        leafLo: '#2a5a36',
        cloud: '#d8dce8',
        hud: '#d8d4cc',
        hudLo: '#7a7468',
        text: '#2a2a2a',
        cursor: '#ffc84a',
        lamp: '#ffc860',
        night: '#10123a',
        ink: '#14141e',
      },
    },
  ],
  layers: [background, waves, nightGlow, buildings, cars, cursor, clouds, hud],
});
