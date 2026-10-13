// The city's power plant, cut away like a doll's house: on every floor a hamster runs in a wheel that spins with the
// tempo and sprints on the kick, while cables carry glowing pulses to the skyline, whose windows light up in waves on
// the beat. A supervisor in a hard hat checks her clipboard beside the sacks of sunflower seeds that fuel it all.
import { type Ctx, drawSprite, fillRect, type Palette, type Sprite } from 'mojipx';
import { cached, ditherGradient, frac, memoLayer, pixelLine, rand, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { type Box, drawGlow, fillDither } from './batch-1-helpers.ts';
import { paletteOf } from './batch-2-helpers.ts';
import { blinking } from './batch-7-helpers.ts';
import { beatInBar, both, box, drawSculpt, meterOf, oval, type Part, type Stance, sculpt, stick, tri } from './batch-14-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'star'
  | 'orb'
  | 'far'
  | 'city'
  | 'cityHi'
  | 'window'
  | 'windowLo'
  | 'windowOff'
  | 'neon'
  | 'wall'
  | 'wallHi'
  | 'wallLo'
  | 'room'
  | 'roomLo'
  | 'lamp'
  | 'steel'
  | 'steelLo'
  | 'cable'
  | 'pulse'
  | 'ink'
  | 'fur'
  | 'furLo'
  | 'grey'
  | 'greyLo'
  | 'cream'
  | 'pink'
  | 'hat'
  | 'hatLo'
  | 'board'
  | 'paper'
  | 'seed'
  | 'seedHi'
  | 'sack'
  | 'sackLo'
  | 'alarm'
  | 'street'
  | 'streetHi';

type C = Colors<K>;

// ---- layout ----

type Layout = {
  readonly wide: boolean;
  /** The top of the street. */
  readonly ground: number;
  readonly horizon: number;
  /** The plant's outer walls, and its rooms in columns and floors. */
  readonly plant: Box;
  readonly cols: number;
  readonly floors: number;
  /** The near city: the span of its towers and the range of their tops. */
  readonly city: { readonly x0: number; readonly x1: number; readonly top: number; readonly low: number };
  /** Where the supervisor stands (the middle of her feet) and how big she is. */
  readonly boss: { readonly x: number; readonly y: number };
};

const WALL = 6;
const SLAB = 5;
const ROOF = 7;

const wideLayout = (w: number, h: number): Layout => {
  const ground = Math.round(h * 0.86);
  const top = Math.round(h * 0.25);
  return {
    wide: true,
    ground,
    horizon: Math.round(h * 0.62),
    plant: { x: Math.round(w * 0.04), y: top, w: Math.round(w * 0.55), h: ground - top },
    cols: 3,
    floors: 2,
    city: { x0: Math.round(w * 0.7), x1: w, top: Math.round(h * 0.12), low: Math.round(h * 0.42) },
    boss: { x: Math.round(w * 0.665), y: ground + Math.round((h - ground) * 0.6) },
  };
};

const tallLayout = (w: number, h: number): Layout => {
  const ground = Math.round(h * 0.84);
  const top = Math.round(h * 0.33);
  return {
    wide: false,
    ground,
    horizon: Math.round(h * 0.3),
    plant: { x: 4, y: top, w: w - 8, h: ground - top },
    cols: 2,
    floors: 3,
    city: { x0: 0, x1: w, top: Math.round(h * 0.08), low: Math.round(h * 0.22) },
    boss: { x: Math.round(w * 0.76), y: ground + Math.round((h - ground) * 0.72) },
  };
};

const layouts = new Map<string, Layout>();

const layoutOf = (f: Frame): Layout => cached(layouts, 8, `${f.w}x${f.h}`, () => (f.w > f.h ? wideLayout(f.w, f.h) : tallLayout(f.w, f.h)));

/** The room at a column and floor (0 the top floor): its inside, between the walls and slabs. */
const roomOf = (l: Layout, col: number, floor: number): Box => {
  const inW = l.plant.w - WALL * 2;
  const inH = l.plant.h - ROOF - SLAB * l.floors;
  const x0 = l.plant.x + WALL + Math.round((inW * col) / l.cols);
  const x1 = l.plant.x + WALL + Math.round((inW * (col + 1)) / l.cols);
  const y0 = l.plant.y + ROOF + Math.round((inH * floor) / l.floors) + SLAB * floor;
  const y1 = l.plant.y + ROOF + Math.round((inH * (floor + 1)) / l.floors) + SLAB * floor;
  const gap = col < l.cols - 1 ? 3 : 0;
  return { x: x0, y: y0, w: x1 - x0 - gap, h: y1 - y0 };
};

const colorKey = (c: C, keys: readonly K[]): string => keys.map((k) => c[k]).join('');

// ---- the sky and the city ----

// A sunset variant has no stars (its star color is its sky's), and its sun sits low and large behind the towers.
const sky = (ctx: Ctx, f: Frame, c: C): void => {
  const l = layoutOf(f);
  const dusk = c.star === c.sky0;
  ctx.drawImage(ditherGradient(f.w, l.ground, dusk ? [c.sky0, c.sky1, c.sky2, c.sky2] : [c.sky0, c.sky0, c.sky1, c.sky2]), 0, 0);
  if (!dusk) stars(ctx, f.w, l.horizon, f.t, [c.star, c.windowLo], Math.round((f.w * l.horizon) / 300), 41, 0.9);
  const r = dusk ? 14 : 8;
  const x = Math.round(f.w * (l.wide ? (dusk ? 0.645 : 0.9) : 0.74));
  const y = Math.round(f.h * (l.wide ? (dusk ? 0.36 : 0.13) : 0.06));
  drawGlow(ctx, c.orb, x, y, Math.round(r * 2.4), Math.round(r * 2.4), 0.2, 3);
  ctx.fillStyle = c.orb;
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.floor(Math.sqrt(r * r - dy * dy));
    if (!dusk || dy < r * 0.3 || (dy & 3) !== 0) ctx.fillRect(x - half, y + dy, half * 2 + 1, 1);
  }
};

// The far city: a low silhouette of blocks right across the view, with a few lit windows.
const farCity = (f: Frame, l: Layout, c: C): HTMLCanvasElement =>
  memoLayer(`hp-far:${f.w}x${f.h}:${colorKey(c, ['far', 'windowLo'])}`, f.w, l.ground, (g) => {
    const reach = l.wide ? f.h * 0.2 : f.h * 0.09;
    for (let x = 0, i = 0; x < f.w; i++) {
      const w = 5 + Math.floor(rand(i, 3) * 11);
      const top = Math.round(l.horizon - reach * (0.25 + 0.75 * rand(i, 4) ** 1.5));
      g.fillStyle = c.far;
      g.fillRect(x, top, w, l.ground - top);
      if (rand(i, 5) > 0.7) g.fillRect(x + (w >> 1), top - 4, 1, 4);
      g.fillStyle = c.windowLo;
      for (let y = top + 2; y < l.ground; y += 3) for (let k = x + 1; k < x + w - 1; k += 2) if (rand(k, y) > 0.9) g.fillRect(k, y, 1, 1);
      x += w + (rand(i, 6) > 0.6 ? 1 : 0);
    }
  });

type Tower = { readonly x: number; readonly w: number; readonly top: number; readonly seed: number };

const towers = new Map<string, readonly Tower[]>();

const towersOf = (f: Frame, l: Layout): readonly Tower[] =>
  cached(towers, 8, `${f.w}x${f.h}`, () => {
    const out: Tower[] = [];
    for (let x = l.city.x0 + 2, i = 0; x < l.city.x1; i++) {
      const w = 14 + Math.floor(rand(i, 11) * 14);
      const top = Math.round(l.city.top + (l.city.low - l.city.top) * rand(i, 12));
      out.push({ x, w, top, seed: i });
      x += w + 2 + Math.floor(rand(i, 13) * 4);
    }
    return out;
  });

/** Every window of the near city, as x, y and its distance from the plant (which sends out the light). */
type Windows = { readonly x: Int16Array; readonly y: Int16Array; readonly d: Float32Array };

const windowSets = new Map<string, Windows>();

const windowsOf = (f: Frame, l: Layout): Windows =>
  cached(windowSets, 8, `${f.w}x${f.h}`, () => {
    const pts: [number, number][] = [];
    for (const t of towersOf(f, l))
      for (let y = t.top + 5; y < l.ground - 4; y += 4) for (let x = t.x + 3; x < t.x + t.w - 3; x += 4) pts.push([x, y]);
    const hx = l.plant.x + l.plant.w;
    const hy = l.plant.y;
    return {
      x: Int16Array.from(pts, (p) => p[0]),
      y: Int16Array.from(pts, (p) => p[1]),
      d: Float32Array.from(pts, (p) => Math.hypot(p[0] - hx, (p[1] - hy) * 0.6)),
    };
  });

// A tower: a lit edge, a crown (a step, an antenna or a water tank) and a neon strip on some roofs; all windows dark.
const paintTower = (g: Ctx, t: Tower, l: Layout, c: C): void => {
  const kind = Math.floor(rand(t.seed, 14) * 4);
  g.fillStyle = c.ink;
  g.fillRect(t.x - 1, t.top - 1, t.w + 2, l.ground - t.top + 1);
  g.fillStyle = c.city;
  g.fillRect(t.x, t.top, t.w, l.ground - t.top);
  g.fillStyle = c.cityHi;
  g.fillRect(t.x, t.top, 2, l.ground - t.top);
  g.fillRect(t.x, t.top, t.w, 1);
  if (kind === 0) g.fillRect(t.x + (t.w >> 1), t.top - 9, 1, 9);
  if (kind === 1) {
    g.fillStyle = c.ink;
    g.fillRect(t.x + 3, t.top - 4, t.w - 6, 4);
    g.fillStyle = c.city;
    g.fillRect(t.x + 4, t.top - 3, t.w - 8, 3);
  }
  if (kind === 2) {
    g.fillStyle = c.neon;
    g.fillRect(t.x + 1, t.top + 2, t.w - 2, 1);
  }
  g.fillStyle = c.windowOff;
  for (let y = t.top + 5; y < l.ground - 4; y += 4) for (let x = t.x + 3; x < t.x + t.w - 3; x += 4) g.fillRect(x, y, 2, 2);
};

const nearCity = (f: Frame, l: Layout, c: C): HTMLCanvasElement =>
  memoLayer(`hp-near:${f.w}x${f.h}:${colorKey(c, ['ink', 'city', 'cityHi', 'neon', 'windowOff'])}`, f.w, l.ground, (g) => {
    for (const t of towersOf(f, l)) paintTower(g, t, l, c);
  });

// On every beat a wave of light rolls out from the plant across the city: windows flare as it passes and stay warm
// a little after; a few windows are always lit.
const cityLights = (ctx: Ctx, f: Frame, l: Layout, c: C): void => {
  const win = windowsOf(f, l);
  const span = l.wide ? 150 : 260;
  for (let i = 0; i < win.x.length; i++) {
    const k = frac(f.beat - (win.d[i] ?? 0) / span);
    const still = rand(i, 21) > 0.82;
    const color = k < 0.16 ? c.window : k < 0.5 || still ? c.windowLo : null;
    if (color) fillRect(ctx, color, win.x[i] ?? 0, win.y[i] ?? 0, 2, 2);
  }
};

const city = (ctx: Ctx, f: Frame, c: C): void => {
  const l = layoutOf(f);
  ctx.drawImage(farCity(f, l, c), 0, 0);
  ctx.drawImage(nearCity(f, l, c), 0, 0);
  cityLights(ctx, f, l, c);
};

// ---- the plant ----

/** A cut face of concrete: hatched like a drawing's section, lit along its top, outlined in ink. */
const cutFace = (g: Ctx, c: C, x: number, y: number, w: number, h: number): void => {
  g.fillStyle = c.ink;
  g.fillRect(x - 1, y - 1, w + 2, h + 2);
  g.fillStyle = c.wall;
  g.fillRect(x, y, w, h);
  g.fillStyle = c.wallLo;
  for (let yy = y + 1; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if ((xx + yy) % 5 === 0) g.fillRect(xx, yy, 1, 1);
  g.fillStyle = c.wallHi;
  g.fillRect(x, y, w, 1);
};

/** Paints the pixels round (cx, cy) out to `reach`, each in the color `pick` gives for its offset, or none. */
const paintRound = (g: Ctx, cx: number, cy: number, reach: number, pick: (d: number, dx: number, dy: number) => string | null): void => {
  for (let dy = -reach; dy <= reach; dy++)
    for (let dx = -reach; dx <= reach; dx++) {
      const color = pick(Math.hypot(dx, dy), dx, dy);
      if (!color) continue;
      g.fillStyle = color;
      g.fillRect(cx + dx, cy + dy, 1, 1);
    }
};

const paintTiles = (g: Ctx, c: C, r: Box): void => {
  g.fillStyle = c.room;
  g.fillRect(r.x, r.y, r.w, r.h);
  g.fillStyle = c.roomLo;
  for (let y = r.y + 5; y < r.y + r.h; y += 6) g.fillRect(r.x, y, r.w, 1);
  for (let y = r.y; y < r.y + r.h; y += 6) for (let x = r.x + ((y / 6) % 2 === 0 ? 4 : 10); x < r.x + r.w; x += 12) g.fillRect(x, y, 1, 5);
  g.fillRect(r.x, r.y + r.h - 9, r.w, 9);
};

// A room's back wall: tiles above a darker dado, a strip light on the ceiling, a dial and a conduit up the wall.
const paintRoom = (g: Ctx, c: C, r: Box): void => {
  paintTiles(g, c, r);
  g.fillStyle = c.ink;
  g.fillRect(r.x, r.y + r.h - 10, r.w, 1);
  g.fillRect(r.x, r.y, r.w, 1);
  const lx = r.x + r.w - 15;
  g.fillRect(lx - 1, r.y + 1, 12, 3);
  g.fillStyle = c.lamp;
  g.fillRect(lx, r.y + 2, 10, 1);
  const gx = r.x + r.w - 9;
  const gy = r.y + 13;
  g.fillStyle = c.steelLo;
  g.fillRect(gx, gy + 4, 1, r.h - 27);
  paintRound(g, gx, gy, 5, (d, dx, dy) => (d > 4.6 ? null : d > 3.6 ? c.ink : dy < -1 && dx > 1 ? c.neon : c.paper));
};

// The roof: a parapet and a hopper of sunflower seeds behind a window.
const paintRoof = (g: Ctx, c: C, l: Layout): void => {
  const p = l.plant;
  const hx = p.x + Math.round(p.w * 0.16);
  const hw = Math.max(26, Math.round(p.w * 0.17));
  const top = p.y - 26;
  g.fillStyle = c.ink;
  g.fillRect(hx - 1, top - 1, hw + 2, 27);
  g.fillRect(hx + 4, top - 4, hw - 8, 4);
  g.fillStyle = c.steelLo;
  g.fillRect(hx, top, hw, 26);
  g.fillStyle = c.steel;
  g.fillRect(hx, top, 2, 26);
  g.fillRect(hx + 5, top - 3, hw - 10, 2);
  g.fillStyle = c.ink;
  g.fillRect(hx + 4, top + 4, hw - 8, 14);
  g.fillStyle = c.roomLo;
  g.fillRect(hx + 5, top + 5, hw - 10, 12);
  for (let y = top + 9; y < top + 17; y += 2)
    for (let x = hx + 5 + (y % 4 === 0 ? 0 : 1); x < hx + hw - 6; x += 3) {
      g.fillStyle = c.seed;
      g.fillRect(x, y, 2, 2);
      g.fillStyle = c.seedHi;
      g.fillRect(x, y, 1, 1);
    }
  g.fillStyle = c.ink;
  g.fillRect(p.x - 2, p.y - 3, p.w + 4, 4);
  g.fillStyle = c.wallHi;
  g.fillRect(p.x - 1, p.y - 2, p.w + 2, 1);
};

// The street in front: a kerb, a pavement and the road with its dashed lane line.
const paintStreet = (g: Ctx, f: Frame, l: Layout, c: C): void => {
  const lane = l.ground + 1 + Math.round((f.h - l.ground) * 0.6);
  for (const [color, y, h] of [
    [c.ink, l.ground, 1],
    [c.streetHi, l.ground + 1, 3],
    [c.street, l.ground + 4, f.h - l.ground - 4],
  ] as const) {
    g.fillStyle = color;
    g.fillRect(0, y, f.w, h);
  }
  g.fillStyle = c.streetHi;
  for (let x = 4; x < f.w; x += 16) g.fillRect(x, lane, 8, 1);
};

const plantLayer = (f: Frame, l: Layout, c: C): HTMLCanvasElement =>
  memoLayer(
    `hp-plant:${f.w}x${f.h}:${colorKey(c, ['ink', 'wall', 'wallHi', 'wallLo', 'room', 'roomLo', 'lamp', 'paper', 'neon', 'steel', 'steelLo', 'seed', 'seedHi', 'street', 'streetHi'])}`,
    f.w,
    f.h,
    (g) => {
      const p = l.plant;
      paintStreet(g, f, l, c);
      paintRoof(g, c, l);
      cutFace(g, c, p.x, p.y, p.w, p.h);
      for (let floor = 0; floor < l.floors; floor++) for (let col = 0; col < l.cols; col++) paintRoom(g, c, roomOf(l, col, floor));
    },
  );

const plant = (ctx: Ctx, f: Frame, c: C): void => {
  const l = layoutOf(f);
  ctx.drawImage(plantLayer(f, l, c), 0, 0);
};

// ---- the hamsters: f/F fur, c cream, p pink, e eye, w glint ----

/** Where a runner's near and far paws touch down in each of the four frames of its stride. */
const STRIDE: readonly (readonly [number, number, number, number])[] = [
  [7, 0, -6, -1.5],
  [5, -1.5, -3, 0],
  [2, 0, -1, -1.2],
  [4, -1.2, -5, 0],
];

const headParts = (dx: number, earBack: number): readonly Part[] => [
  ['f', oval(2 + dx - earBack, -11.4, 2.2, 2)],
  ['p', oval(2 + dx - earBack, -11.2, 1, 1)],
  ['c', oval(5.6 + dx, -4.6, 3.6, 3)],
  ['p', oval(6.4 + dx, -5, 1.4, 0.8)],
  ['e', oval(5.2 + dx, -8, 1.3, 1.6)],
  ['w', box(5.2 + dx, -9.4, 6.2 + dx, -8.4)],
  ['p', box(8.8 + dx, -7.6, 10 + dx, -6.4)],
];

// Running: a round body bobbing on its stride, little pink paws scrabbling at the rungs.
const runParts = (k: number): readonly Part[] => {
  const [fx, fy, bx, by] = STRIDE[k] as readonly [number, number, number, number];
  const bob = k % 2 === 0 ? 0 : -0.8;
  return [
    ['F', stick([-4, -3], [bx - 1, by], 1)],
    ['F', stick([4, -3], [fx - 1, fy], 1)],
    ['p', stick([-3, -3], [bx, by], 1)],
    ['p', stick([5, -3], [fx, fy], 1)],
    ['F', oval(-9, -5.5 + bob, 1.4, 1.2)],
    ['f', oval(0, -7 + bob, 9, 5.6)],
    ['F', oval(-2.5, -10.5 + bob, 6, 2)],
    ['c', oval(1.5, -4.2 + bob, 6, 2.8)],
    ...headParts(0, 0).map(([ch, inside]): Part => [ch, (x, y) => inside(x, y - bob)]),
  ];
};

// Sprinting on the kick: stretched long and low, ears laid back, paws flung fore and aft.
const dashParts = (k: number): readonly Part[] => [
  ['p', stick([-5, -3], [-10 - (k % 2), -0.5], 1)],
  ['p', stick([5, -3], [10 + (k % 2), -1], 1)],
  ['F', oval(-10.5, -6, 1.4, 1)],
  ['f', oval(0.5, -6.4, 10, 5)],
  ['F', oval(-2, -9.6, 7, 1.6)],
  ['c', oval(2, -3.8, 7, 2.4)],
  ...headParts(1.5, 2.5),
];

const RUN_W = 24;
const RUN_H = 14;

const runner = (k: number, dash: boolean, stance: Stance): Sprite =>
  sculpt(`hp-ham:${dash ? 'dash' : 'run'}:${k}`, RUN_W, RUN_H, () => (dash ? dashParts(k) : runParts(k)), stance);

type Coat = 'golden' | 'grey' | 'snow';

const COATS: readonly Coat[] = ['golden', 'grey', 'snow'];

const coatPalette =
  (coat: Coat) =>
  (c: C): Palette => ({
    o: c.ink,
    f: coat === 'golden' ? c.fur : coat === 'grey' ? c.grey : c.cream,
    F: coat === 'golden' ? c.furLo : coat === 'grey' ? c.greyLo : c.sack,
    c: coat === 'grey' ? c.paper : c.cream,
    p: c.pink,
    e: c.ink,
    w: c.paper,
  });

const COAT_PALETTES = COATS.map(coatPalette);

const hamsterPalette = (c: C, i: number): Palette =>
  paletteOf(c, `hp-coat${i % COATS.length}`, COAT_PALETTES[i % COATS.length] as (c: C) => Palette);

// ---- the wheels ----

type Wheel = { readonly cx: number; readonly cy: number; readonly r: number; readonly floor: number; readonly room: Box };

const wheelOf = (l: Layout, col: number, floor: number): Wheel => {
  const room = roomOf(l, col, floor);
  const r = Math.floor(Math.min(room.w * 0.36, room.h * 0.4));
  const bottom = room.y + room.h - 3;
  return { cx: room.x + Math.round(room.w * 0.4), cy: bottom - r - 3, r, floor: bottom, room };
};

const eachWheel = (l: Layout, draw: (w: Wheel, i: number) => void): void => {
  for (let floor = 0; floor < l.floors; floor++) for (let col = 0; col < l.cols; col++) draw(wheelOf(l, col, floor), floor * l.cols + col);
};

const paintStand = (g: Ctx, c: C, w: Wheel): void => {
  const leg = Math.round(w.r * 0.55);
  for (const [color, width] of [
    [c.ink, 4],
    [c.steelLo, 2],
  ] as const) {
    g.fillStyle = color;
    for (let k = 0; k <= w.floor - w.cy; k++) {
      const s = Math.round((leg * k) / (w.floor - w.cy));
      g.fillRect(w.cx - s - (width >> 1), w.cy + k, width, 1);
      g.fillRect(w.cx + s - (width >> 1), w.cy + k, width, 1);
    }
  }
};

/** The rim's color at a distance from the hub: a steel band, shaded on its lower half, between two rings of ink. */
const rimColor = (c: C, r: number, d: number, dy: number): string | null => {
  if (d < r - 2.5 || d >= r + 1.5) return null;
  if (d < r - 1.5 || d >= r + 0.5) return c.ink;
  return dy > 0 && d >= r - 0.5 ? c.steelLo : c.steel;
};

const paintBowl = (g: Ctx, c: C, w: Wheel): void => {
  const bx = w.room.x + w.room.w - 12;
  g.fillStyle = c.ink;
  g.fillRect(bx - 1, w.floor - 5, 11, 5);
  g.fillStyle = c.steel;
  g.fillRect(bx, w.floor - 4, 9, 3);
  for (let k = 0; k < 4; k++) {
    g.fillStyle = c.seed;
    g.fillRect(bx + 1 + k * 2, w.floor - 7 + (k % 2), 2, 2);
    g.fillStyle = c.seedHi;
    g.fillRect(bx + 1 + k * 2, w.floor - 7 + (k % 2), 1, 1);
  }
};

// The still parts of a wheel: an A-frame stand, the rim (a steel band in ink), and a bowl of seeds beside it.
const paintWheel = (g: Ctx, c: C, w: Wheel): void => {
  paintStand(g, c, w);
  paintRound(g, w.cx, w.cy, w.r + 2, (d, _, dy) => rimColor(c, w.r, d, dy));
  paintBowl(g, c, w);
};

const wheelsLayer = (f: Frame, l: Layout, c: C): HTMLCanvasElement =>
  memoLayer(`hp-wheels:${f.w}x${f.h}:${colorKey(c, ['ink', 'steel', 'steelLo', 'seed', 'seedHi'])}`, f.w, f.h, (g) => {
    eachWheel(l, (w) => paintWheel(g, c, w));
  });

/** How far the wheels have turned, in turns: a quarter turn a beat, surging just after each beat. */
const spinOf = (f: Frame): number => (Math.floor(f.beat) + 1 - (1 - frac(f.beat)) ** 2) * 0.25;

// Spokes and rungs turn; the runner keeps pace with them, and on a strong kick sprints with speed lines streaming.
const turning = (ctx: Ctx, f: Frame, c: C, w: Wheel, i: number): void => {
  const a = (spinOf(f) + i * 0.13) * Math.PI * 2;
  for (let k = 0; k < 6; k++) {
    const s = a + (k * Math.PI) / 3;
    const ex = Math.round(w.cx + Math.cos(s) * (w.r - 2));
    const ey = Math.round(w.cy + Math.sin(s) * (w.r - 2));
    pixelLine(ctx, w.cx, w.cy, ex, ey, c.steelLo);
  }
  const rungs = Math.round(w.r * 0.9);
  for (let k = 0; k < rungs; k++) {
    const s = a + (k * Math.PI * 2) / rungs;
    fillRect(ctx, c.ink, Math.round(w.cx + Math.cos(s) * w.r), Math.round(w.cy + Math.sin(s) * w.r), 1, 1);
  }
  fillRect(ctx, c.ink, w.cx - 2, w.cy - 2, 5, 5);
  fillRect(ctx, c.steel, w.cx - 1, w.cy - 1, 3, 3);
};

const runnerOf = (f: Frame, w: Wheel, i: number): { readonly sprite: Sprite; readonly dash: boolean } => {
  const dash = f.kick > 0.55 && (i + Math.floor(f.beat)) % 2 === 0;
  const k = Math.floor((spinOf(f) + i * 0.13) * w.r * 2.2) % 4;
  const size = w.r / 18;
  const land = frac(f.beat) < 0.14 ? 1 : 0;
  return { sprite: runner(k, dash, { sx: size * (1 + 0.1 * land), sy: size * (1 - 0.1 * land) }), dash };
};

const hamster = (ctx: Ctx, f: Frame, c: C, w: Wheel, i: number): void => {
  const { sprite, dash } = runnerOf(f, w, i);
  const size = w.r / 18;
  const x = w.cx + Math.round((dash ? 3 : 1) * size);
  const foot = w.cy + Math.round(Math.sqrt((w.r - 1.5) ** 2 - (x - w.cx) ** 2)) + 1;
  drawSculpt(ctx, sprite, hamsterPalette(c, i + Math.floor(i / 3)), x, foot);
  if (!dash) return;
  const back = x - Math.round(13 * size);
  for (let k = 0; k < 3; k++) fillRect(ctx, c.paper, back - k * 2 - 4, foot - Math.round((9 - k * 3) * size), 4 + (k % 2) * 2, 1);
  const top = foot - Math.round(15 * size);
  fillRect(ctx, c.pulse, x + 7, top, 1, 1);
  fillRect(ctx, c.pulse, x + 6, top + 1, 3, 2);
};

// Each room's strip light flares on the beat; its dial's needle swings up with the kick.
const roomLight = (ctx: Ctx, f: Frame, c: C, w: Wheel): void => {
  const r = w.room;
  const lx = r.x + r.w - 15;
  if (frac(f.beat) < 0.25) {
    fillRect(ctx, c.paper, lx, r.y + 2, 10, 1);
    fillDither(ctx, c.lamp, 0.5, lx - 1, r.y + 4, 12, 1);
  }
  const gx = r.x + r.w - 9;
  const gy = r.y + 13;
  const s = -Math.PI * 0.9 + f.kick * 0.9 + Math.sin(f.t * 9 + w.cx) * 0.08;
  pixelLine(ctx, gx, gy, Math.round(gx + Math.cos(s) * 3), Math.round(gy + Math.sin(s) * 3), c.ink);
};

const wheels = (ctx: Ctx, f: Frame, c: C): void => {
  const l = layoutOf(f);
  eachWheel(l, (w) => roomLight(ctx, f, c, w));
  ctx.drawImage(wheelsLayer(f, l, c), 0, 0);
  eachWheel(l, (w, i) => {
    turning(ctx, f, c, w, i);
    hamster(ctx, f, c, w, i);
  });
};

// ---- the roof: a transformer whose cables carry the power to the city, a warning beacon and a lightning sign ----

type Pt = readonly [number, number];

const transformerOf = (l: Layout): Pt => [l.plant.x + Math.round(l.plant.w * (l.wide ? 0.8 : 0.74)), l.plant.y - 4];

/** The cables' ends: an insulator on the transformer, and a tower's side in the city. */
const cablesOf = (f: Frame, l: Layout): readonly (readonly [Pt, Pt])[] => {
  const [tx, ty] = transformerOf(l);
  const ts = towersOf(f, l);
  const picks = l.wide ? [0, 1, 3] : [1, 3, 5];
  return picks.map((n, k) => {
    const t = ts[Math.min(n, ts.length - 1)] as Tower;
    const end: Pt = l.wide ? [t.x, t.top + 14 + k * 4] : [t.x + (t.w >> 1), Math.min(l.plant.y - 12, t.top + 24)];
    return [[tx - 5 + k * 5, ty - 15 + (k === 1 ? -2 : 0)], end] as const;
  });
};

/** A point along a sagging cable, u from 0 at the plant to 1 in the city. */
const alongCable = (a: Pt, b: Pt, u: number): Pt => {
  const sag = Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.14;
  return [Math.round(a[0] + (b[0] - a[0]) * u), Math.round(a[1] + (b[1] - a[1]) * u + sag * 4 * u * (1 - u))];
};

const paintTransformer = (g: Ctx, c: C, l: Layout): void => {
  const [tx, ty] = transformerOf(l);
  g.fillStyle = c.ink;
  g.fillRect(tx - 9, ty - 11, 19, 12);
  g.fillStyle = c.steelLo;
  g.fillRect(tx - 8, ty - 10, 17, 10);
  g.fillStyle = c.steel;
  for (let x = tx - 7; x < tx + 9; x += 3) g.fillRect(x, ty - 9, 1, 8);
  for (let k = 0; k < 3; k++) {
    const x = tx - 5 + k * 5;
    const top = ty - 15 + (k === 1 ? -2 : 0);
    g.fillStyle = c.ink;
    g.fillRect(x - 2, top, 5, ty - 10 - top);
    g.fillStyle = c.paper;
    for (let y = top + 1; y < ty - 11; y += 2) g.fillRect(x - 1, y, 3, 1);
  }
};

const gearLayer = (f: Frame, l: Layout, c: C): HTMLCanvasElement =>
  memoLayer(`hp-gear:${f.w}x${f.h}:${colorKey(c, ['ink', 'steel', 'steelLo', 'paper', 'cable'])}`, f.w, f.h, (g) => {
    paintTransformer(g, c, l);
    g.fillStyle = c.cable;
    for (const [a, b] of cablesOf(f, l)) {
      const n = Math.ceil(Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]));
      for (let k = 0; k <= n; k++) {
        const [x, y] = alongCable(a, b, k / n);
        g.fillRect(x, y, 1, 2);
      }
    }
  });

// On each beat a pulse of light runs down every cable to the city, a short tail glowing behind it.
const pulses = (ctx: Ctx, f: Frame, l: Layout, c: C): void => {
  cablesOf(f, l).forEach(([a, b], k) => {
    const u = frac(f.beat - k * 0.08);
    for (let j = 3; j >= 0; j--) {
      const [x, y] = alongCable(a, b, Math.max(0, u - j * 0.035));
      fillRect(ctx, j === 0 ? c.paper : c.pulse, x - (j === 0 ? 1 : 0), y - (j === 0 ? 1 : 0), j === 0 ? 3 : 2, j === 0 ? 3 : 2);
    }
    const [x, y] = alongCable(a, b, u);
    drawGlow(ctx, c.pulse, x, y, 5, 5, 0.5);
  });
};

// A lightning bolt sign on the parapet, lit on the beat; on the bar it flashes the other way round.
const BOLT: Sprite = ['....ooo', '...oyyo', '..oyyo.', '.oyyooo', 'oyyyyyo', 'ooooyyo', '...oyo.', '..oyo..', '..oo...'];

const boltPalettes = (c: C): readonly Palette[] => [
  paletteOf(c, 'hp-bolt-on', (k: C) => ({ o: k.ink, y: k.hat })),
  paletteOf(c, 'hp-bolt-off', (k: C) => ({ o: k.ink, y: k.hatLo })),
];

const sign = (ctx: Ctx, f: Frame, l: Layout, c: C): void => {
  const x = l.plant.x + Math.round(l.plant.w * (l.wide ? 0.52 : 0.5));
  const y = l.plant.y - 14;
  const lit = frac(f.beat) < 0.5;
  if (lit) drawGlow(ctx, c.hat, x + 4, y + 5, 16, 12, 0.3);
  fillRect(ctx, c.ink, x - 6, y - 2, 20, 14);
  fillRect(ctx, c.roomLo, x - 5, y - 1, 18, 12);
  fillRect(ctx, c.ink, x - 3, y + 12, 2, 3);
  fillRect(ctx, c.ink, x + 9, y + 12, 2, 3);
  drawSprite(ctx, BOLT, boltPalettes(c)[lit ? 0 : 1] as Palette, x + 1, y);
};

// A warning beacon on the hopper turns, throwing its beam left and right; in an emergency (when the alarm is the
// color of the city's neon) the beam reaches far.
const beacon = (ctx: Ctx, f: Frame, l: Layout, c: C): void => {
  const x = l.plant.x + Math.round(l.plant.w * 0.16) + Math.max(13, Math.round(l.plant.w * 0.085));
  const y = l.plant.y - 33;
  const turn = Math.sin(f.beat * Math.PI);
  const reach = c.alarm === c.neon ? 40 : 20;
  if (Math.abs(turn) > 0.3)
    for (let k = 3; k < reach; k++) {
      const half = 1 + Math.round(k * 0.3);
      fillDither(ctx, c.alarm, 0.25 * (1 - k / reach), x + Math.sign(turn) * k, y - half, 1, half * 2 + 1);
      fillDither(ctx, c.alarm, 0.8 * (1 - k / reach), x + Math.sign(turn) * k, y - (half >> 1), 1, (half >> 1) * 2 + 1);
    }
  fillRect(ctx, c.ink, x - 3, y - 3, 7, 6);
  fillRect(ctx, c.alarm, x - 2, y - 2, 5, 4);
  fillRect(ctx, c.paper, x - 1 + Math.round(turn), y - 2, 1, 1);
  if (frac(f.beat) < 0.2) drawGlow(ctx, c.alarm, x, y, 8, 8, 0.5);
};

const roof = (ctx: Ctx, f: Frame, c: C): void => {
  const l = layoutOf(f);
  ctx.drawImage(gearLayer(f, l, c), 0, 0);
  pulses(ctx, f, l, c);
  sign(ctx, f, l, c);
  beacon(ctx, f, l, c);
};

// ---- the supervisor: f fur, c cream, p pink, e eye and ink, w glint, h/H hard hat, b board, P paper, s clip ----

type BossPose = 'write' | 'point';

const BOSS_W = 26;
const BOSS_H = 32;

const bossFace = (shut: boolean): readonly Part[] => [
  ['f', oval(-6.6, -24.4, 2.4, 2.2)],
  ['f', oval(6.6, -24.4, 2.4, 2.2)],
  ['p', oval(-6.6, -24.2, 1.1, 1)],
  ['p', oval(6.6, -24.2, 1.1, 1)],
  ['f', oval(0, -18, 9.2, 7.6)],
  ['c', oval(-5, -15.6, 3.8, 3)],
  ['c', oval(5, -15.6, 3.8, 3)],
  ['c', oval(0, -15.2, 2.6, 2)],
  ['p', oval(-6.2, -15.8, 1.5, 0.8)],
  ['p', oval(6.2, -15.8, 1.5, 0.8)],
  ['p', box(-1, -17.4, 1, -16.2)],
  ['e', box(-1, -14.6, 1, -13.8)],
  ...(shut
    ? ([
        ['e', box(-5, -18.6, -2.2, -17.8)],
        ['e', box(2.2, -18.6, 5, -17.8)],
      ] as const)
    : ([
        ['e', oval(-3.6, -19, 1.3, 1.7)],
        ['e', oval(3.6, -19, 1.3, 1.7)],
        ['w', box(-4, -20.4, -3, -19.4)],
        ['w', box(3, -20.4, 4, -19.4)],
      ] as const)),
  ['h', both(oval(0, -23.4, 7.8, 5.8), box(-9, -31, 9, -23))],
  ['H', both(oval(0, -23.4, 7.8, 5.8), box(3.5, -31, 9, -23))],
  ['h', box(-10, -23.6, 10, -21.9)],
  ['H', box(-1, -29.4, 1, -23.6)],
];

// Her free arm: down at the pencil on the board, or flung up to point at the wheels.
const bossArm = (pose: BossPose): readonly Part[] =>
  pose === 'point'
    ? [
        ['f', stick([6, -11], [11.5, -21], 1.6)],
        ['e', box(11, -24, 12, -21)],
      ]
    : [
        ['f', stick([6, -11], [1.5, -8], 1.6)],
        ['e', stick([1.5, -8], [-1.5, -11.5], 0.5)],
      ];

const bossParts = (pose: BossPose, shut: boolean): readonly Part[] => [
  ['p', oval(-3.6, -1, 2.4, 1.3)],
  ['p', oval(3.6, -1, 2.4, 1.3)],
  ['f', oval(0, -8.6, 9, 8)],
  ['c', oval(0, -7.4, 6.2, 6)],
  ...bossFace(shut),
  ['b', box(-9, -13, 1, -2)],
  ['P', box(-8, -11.6, 0, -3)],
  ['e', box(-7, -9.6, -1, -9)],
  ['e', box(-7, -7.2, -2, -6.6)],
  ['e', box(-7, -4.8, -3, -4.2)],
  ['s', box(-6, -14, -2, -11.6)],
  ['f', oval(-9, -8, 1.8, 1.6)],
  ...bossArm(pose),
];

const bossPalette = (c: C): Palette => ({
  o: c.ink,
  f: c.fur,
  c: c.cream,
  p: c.pink,
  e: c.ink,
  w: c.paper,
  h: c.hat,
  H: c.hatLo,
  b: c.board,
  P: c.paper,
  s: c.steel,
});

// She nods on every beat and ticks her clipboard; at the end of every other bar she points up at the wheels.
const boss = (ctx: Ctx, f: Frame, c: C): void => {
  const l = layoutOf(f);
  const { index, phase } = beatInBar(f);
  const pose: BossPose = index === meterOf(f) - 1 && f.bar % 2 === 1 ? 'point' : 'write';
  const shut = pose === 'write' && blinking(f.t, 5);
  const size = l.wide ? 1.3 : 1.6;
  const nod = phase < 0.18 ? 1 : 0;
  const stance = { sx: size * (1 + 0.08 * nod), sy: size * (1 - 0.08 * nod) };
  const sprite = sculpt(`hp-boss:${pose}:${shut ? 1 : 0}`, BOSS_W, BOSS_H, () => bossParts(pose, shut), stance);
  fillDither(ctx, c.ink, 0.5, l.boss.x - 10 * size, l.boss.y - 1, 21 * size, 3);
  drawSculpt(ctx, sprite, paletteOf(c, 'hp-boss', bossPalette), l.boss.x, l.boss.y);
  if (pose === 'write' && phase < 0.5)
    fillRect(ctx, c.neon, l.boss.x - Math.round(4 * size), l.boss.y - Math.round((10 - index * 2.4) * size), 2, 1);
};

// ---- the fuel: sacks of sunflower seeds stacked by the supervisor, one open and spilling ----

const SACK_BODY = both(box(-7.5, -15, 7.5, 0), oval(0, -7.5, 9.6, 9.6));

const sackTop = (open: boolean): readonly Part[] =>
  open
    ? [
        ['r', box(-8, -15.4, 8, -12.6)],
        ['e', oval(0, -15.2, 6.4, 2.6)],
        ['c', both(oval(0, -15.2, 6.4, 2.6), (x, y) => (Math.floor(x * 0.8) + Math.floor(y * 1.6)) % 3 === 0)],
      ]
    : [
        ['s', tri([-7.5, -14.5], [-3.5, -14.5], [-9, -18.5])],
        ['s', tri([7.5, -14.5], [3.5, -14.5], [9, -18.5])],
        ['S', box(-7.5, -14.2, 7.5, -13.4)],
      ];

// A grain sack, square with rounded corners and a sunflower stencilled on it; open, its rim is rolled down over a heap.
const sackParts = (open: boolean): readonly Part[] => [
  ['s', SACK_BODY],
  ['S', both(SACK_BODY, (x, y) => x > 4.4 || y > -1.6)],
  ...sackTop(open),
  ['y', oval(0, -6.6, 3.4, 3.4)],
  ['e', oval(0, -6.6, 1.7, 1.7)],
];

const sackPalette = (c: C): Palette => ({ o: c.ink, s: c.sack, S: c.sackLo, e: c.seed, c: c.seedHi, y: c.hat, r: c.cream });

const SACK_CLOSED = sculpt('hp-sack:closed', 17, 20, () => sackParts(false));
const SACK_OPEN = sculpt('hp-sack:open', 17, 20, () => sackParts(true));

/** Where the sacks stand: beside the supervisor, toward the open side of the street. */
const sackSpot = (l: Layout): Pt => [l.boss.x + (l.wide ? 34 : -58), l.boss.y - (l.wide ? 2 : 4)];

const seedAt = (ctx: Ctx, c: C, x: number, y: number): void => {
  fillRect(ctx, c.ink, x, y + 2, 2, 1);
  fillRect(ctx, c.seed, x, y, 2, 2);
  fillRect(ctx, c.seedHi, x + 1, y, 1, 2);
};

// On the first beat of every bar a seed hops out of the open sack and lands on the little heap before it.
const sacks = (ctx: Ctx, f: Frame, c: C): void => {
  const l = layoutOf(f);
  const [x, y] = sackSpot(l);
  const pal = paletteOf(c, 'hp-sack', sackPalette);
  drawSculpt(ctx, SACK_CLOSED, pal, x, y - 1);
  drawSculpt(ctx, SACK_CLOSED, pal, x + 15, y);
  drawSculpt(ctx, SACK_CLOSED, pal, x + 7, y - 15);
  drawSculpt(ctx, SACK_OPEN, pal, x + 29, y + 2);
  for (let k = 0; k < 9; k++) seedAt(ctx, c, x + 25 + Math.round(rand(k, 61) * 14), y + 1 - Math.round(rand(k, 62) * 3));
  const { index, phase } = beatInBar(f);
  if (index > 0) return;
  const hop = Math.sin(Math.PI * phase);
  seedAt(ctx, c, x + 29 + Math.round(phase * 6), y - 18 - Math.round(hop * 10));
};

// ---- the scene ----

export const hamsterPower = defineScene<K>({
  id: 'hamster-power',
  title: 'Hamster Power',
  mood: { valence: 0.45, energy: 0.75 },
  styles: ['eurobeat', 'technopop', 'vocal-electro', 'kawaii-pop', 'fm-funk', 'neon-rush'],
  variants: [
    {
      mood: { valence: 0.45, energy: 0.8 },
      colors: {
        sky0: '#08081e',
        sky1: '#1a1448',
        sky2: '#3c2070',
        star: '#e8e4ff',
        orb: '#f6f0d2',
        far: '#22205a',
        city: '#2a2860',
        cityHi: '#3e3c80',
        window: '#fff2a0',
        windowLo: '#e0a050',
        windowOff: '#1c1a46',
        neon: '#ff4fb0',
        wall: '#8a8aa4',
        wallHi: '#b4b4c8',
        wallLo: '#56566e',
        room: '#2e3c58',
        roomLo: '#243048',
        lamp: '#ffe8a0',
        steel: '#d4dae6',
        steelLo: '#7c8498',
        cable: '#3c3a6c',
        pulse: '#7cf8ff',
        ink: '#120e1e',
        fur: '#f0a858',
        furLo: '#c07038',
        grey: '#c8c4d4',
        greyLo: '#8e8aa0',
        cream: '#fff4e0',
        pink: '#ff8eaa',
        hat: '#ffd23c',
        hatLo: '#d09820',
        board: '#a8703c',
        paper: '#f6f2e8',
        seed: '#3a3438',
        seedHi: '#ece6dc',
        sack: '#d8b880',
        sackLo: '#a8844e',
        alarm: '#ffb424',
        street: '#1c1a30',
        streetHi: '#3a3858',
      },
    },
    {
      mood: { valence: 0.7, energy: 0.55 },
      colors: {
        sky0: '#4a3a8a',
        sky1: '#e07a8a',
        sky2: '#ffc070',
        star: '#4a3a8a',
        orb: '#ffe08a',
        far: '#8a4a78',
        city: '#5a3466',
        cityHi: '#8a5280',
        window: '#fff4b0',
        windowLo: '#ffb060',
        windowOff: '#4a2a58',
        neon: '#7ef0ff',
        wall: '#c09c94',
        wallHi: '#e8cabc',
        wallLo: '#8a6670',
        room: '#5a4458',
        roomLo: '#4a364a',
        lamp: '#fff0b8',
        steel: '#f0e6e0',
        steelLo: '#a08890',
        cable: '#2a1830',
        pulse: '#fff27a',
        ink: '#24142a',
        fur: '#f0a858',
        furLo: '#c07038',
        grey: '#d4ccd4',
        greyLo: '#9a8ea0',
        cream: '#fff4e0',
        pink: '#ff8eaa',
        hat: '#ffd23c',
        hatLo: '#d09820',
        board: '#a8703c',
        paper: '#fff8ec',
        seed: '#3a3036',
        seedHi: '#f2ead8',
        sack: '#e2c088',
        sackLo: '#b08a52',
        alarm: '#ffb424',
        street: '#3a2a44',
        streetHi: '#6a4a6a',
      },
    },
    {
      mood: { valence: -0.35, energy: 0.9 },
      colors: {
        sky0: '#12040a',
        sky1: '#2e0812',
        sky2: '#5a1420',
        star: '#ffb0a0',
        orb: '#ff8a6a',
        far: '#2a0c16',
        city: '#30101c',
        cityHi: '#4c1a28',
        window: '#ffd0a0',
        windowLo: '#ff5a3a',
        windowOff: '#240a14',
        neon: '#ff2a2a',
        wall: '#7a6068',
        wallHi: '#a08890',
        wallLo: '#4a343e',
        room: '#3a1a24',
        roomLo: '#2c121c',
        lamp: '#ff6a4a',
        steel: '#e0d0d0',
        steelLo: '#8a6a70',
        cable: '#4a1a26',
        pulse: '#ffb040',
        ink: '#14060c',
        fur: '#f0a858',
        furLo: '#c07038',
        grey: '#c8bcc4',
        greyLo: '#8e7e8a',
        cream: '#fff0e0',
        pink: '#ff8eaa',
        hat: '#ffd23c',
        hatLo: '#d09820',
        board: '#a06a3c',
        paper: '#f6efe6',
        seed: '#3a3036',
        seedHi: '#ece2d8',
        sack: '#d0ac78',
        sackLo: '#9c7a48',
        alarm: '#ff2a2a',
        street: '#1e0a12',
        streetHi: '#40202a',
      },
    },
  ],
  layers: [sky, city, plant, roof, wheels, sacks, boss],
});
