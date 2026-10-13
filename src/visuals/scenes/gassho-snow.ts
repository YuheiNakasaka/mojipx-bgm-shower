// A mountain village of steep thatched farmhouses in deep snow at blue hour: every gable window glows, smoke seeps
// from the thatch, snow keeps falling, the river mirrors the lights and someone with a lantern crosses the footbridge.
import { type Ctx, drawSprite, fillRect, type Sprite } from 'mojipx';
import { bayer, ditherGradient, fillColumns, pixelLine, rand, ridgeNoise } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { drawGlow, fillDither, paintRange, paletteBy, pine } from './batch-1-helpers.ts';
import { moon } from './batch-2-helpers.ts';
import { fillPolygon } from './batch-4-helpers.ts';
import { isDark } from './batch-5-helpers.ts';
import { frameLayer, mirrorWater, snowfall } from './batch-6-helpers.ts';
import { type Plan, planOf, skyBase } from './batch-9-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sky3'
  | 'star'
  | 'rock'
  | 'forest'
  | 'forestLo'
  | 'snow'
  | 'snowLit'
  | 'snowLo'
  | 'thatch'
  | 'thatchLo'
  | 'wood'
  | 'woodLit'
  | 'win'
  | 'glow'
  | 'water'
  | 'reed'
  | 'ink'
  | 'umbrella';

// ---- layout ----

type Spot = 'field' | 'river' | 'bank' | 'range' | 'nearX' | 'nearY' | 'farX' | 'farY';
type Layout = Readonly<Record<Spot, number>>;

const WIDE: Plan<Spot> = {
  field: ['h', 0.56],
  river: ['h', 0.8],
  bank: ['h', 0.91],
  range: ['h', 0.42],
  nearX: ['w', 0.87],
  nearY: ['h', 0.96],
  farX: ['w', 0.73],
  farY: ['h', 0.79],
};

const TALL: Plan<Spot> = {
  field: ['h', 0.45],
  river: ['h', 0.72],
  bank: ['h', 0.84],
  range: ['h', 0.3],
  nearX: ['w', 0.8],
  nearY: ['h', 0.91],
  farX: ['w', 0.63],
  farY: ['h', 0.71],
};

const layoutOf = (f: Frame): Layout => planOf(f, WIDE, TALL);

/** A farmhouse: the centre of its gable end, the ground it stands on, the gable's half-width and which side shows. */
type House = { readonly x: number; readonly base: number; readonly a: number; readonly dir: 1 | -1 };

// [x share of width, base share of height, half-width share of height, side], back to front.
const WIDE_HOUSES: readonly (readonly [number, number, number, 1 | -1])[] = [
  [0.07, 0.6, 0.03, 1],
  [0.31, 0.59, 0.028, -1],
  [0.55, 0.595, 0.03, 1],
  [0.78, 0.59, 0.028, 1],
  [0.97, 0.6, 0.028, -1],
  [0.22, 0.675, 0.046, 1],
  [0.66, 0.675, 0.044, -1],
  [0.89, 0.68, 0.04, -1],
  [0.1, 0.775, 0.066, 1],
  [0.44, 0.77, 0.072, -1],
];

const TALL_HOUSES: readonly (readonly [number, number, number, 1 | -1])[] = [
  [0.12, 0.49, 0.016, 1],
  [0.52, 0.485, 0.015, -1],
  [0.88, 0.49, 0.016, 1],
  [0.32, 0.555, 0.024, -1],
  [0.8, 0.56, 0.022, 1],
  [0.18, 0.64, 0.034, 1],
  [0.62, 0.665, 0.036, -1],
];

const housesOf = (f: Frame): readonly House[] =>
  (f.w > f.h ? WIDE_HOUSES : TALL_HOUSES).map(([x, base, a, dir]) => ({
    x: Math.round(f.w * x),
    base: Math.round(f.h * base),
    a: Math.max(4, Math.round(f.h * a)),
    dir,
  }));

const nightOf = (c: Colors<K>): boolean => isDark(c.sky2);

// ---- a farmhouse in snow ----

type Gable = { readonly eave: number; readonly apex: number; readonly dx: number; readonly dy: number };

// The roof is steep (about sixty degrees) and runs back from the gable by `dx` across and `dy` up.
const gableOf = (h: House): Gable => {
  const eave = h.base - Math.max(2, Math.round(h.a * 0.55));
  return { eave, apex: eave - Math.round(h.a * 1.75), dx: Math.round(h.a * 2.3), dy: -Math.round(h.a * 0.25) };
};

// The rows of one column of the snowy roof side, `u` pixels from the gable's centre toward the visible side.
const roofRows = (h: House, g: Gable, u: number): readonly [number, number] => {
  const side = h.a + 2;
  const top = u <= g.dx ? g.apex + (g.dy * u) / g.dx : g.apex + g.dy + ((u - g.dx) / side) * (g.eave + 1 - g.apex);
  const bottom = u >= side ? g.eave + 1 + (g.dy * (u - side)) / g.dx : g.apex + ((g.eave + 1 - g.apex) * u) / side;
  return [Math.round(top), Math.round(bottom)];
};

const roofColumn = (g: Ctx, c: Colors<K>, x: number, rows: readonly [number, number]): void => {
  const [top, bottom] = rows;
  if (bottom <= top) return;
  fillRect(g, c.snow, x, top, 1, bottom - top);
  for (let y = top; y < bottom; y++) if ((y - top) / (bottom - top) - 0.45 > bayer(x, y)) fillRect(g, c.snowLo, x, y, 1, 1);
  fillRect(g, c.snowLit, x, top, 1, 2);
};

// Under the side eave: the thick cut edge of the thatch, then the long side wall with its lit screens.
const sideWall = (g: Ctx, c: Colors<K>, x: number, eave: number, wall: number, u: number): void => {
  fillRect(g, c.thatch, x, eave - 2, 1, 2);
  fillRect(g, c.thatchLo, x, eave, 1, 1);
  fillRect(g, c.wood, x, eave + 1, 1, wall);
  if (u % 4 !== 0 && wall > 2) fillRect(g, c.win, x, eave + 2, 1, wall - 2);
  fillRect(g, c.snow, x, eave + wall, 1, 2);
};

const paintRoofSide = (g: Ctx, c: Colors<K>, h: House, ge: Gable): void => {
  const side = h.a + 2;
  const wall = h.base - ge.eave - 2;
  for (let u = 0; u <= side + ge.dx; u++) {
    const x = h.x + h.dir * u;
    const rows = roofRows(h, ge, u);
    roofColumn(g, c, x, rows);
    if (u > side) sideWall(g, c, x, rows[1], wall, u);
  }
};

// Rows of little windows in the gable, fewer toward the peak; a few are dark.
const gableWindows = (g: Ctx, c: Colors<K>, h: House, ge: Gable): void => {
  const row = Math.max(3, Math.round(h.a * 0.42));
  const size = h.a >= 10 ? 2 : 1;
  for (let y = ge.eave - 2 - size; y > ge.apex + 5; y -= row) {
    const half = ((y - ge.apex - 3) / (ge.eave - ge.apex - 3)) * (h.a - 2);
    fillRect(g, c.woodLit, Math.round(h.x - half), y + size + 1, Math.round(half * 2) + 1, 1);
    const n = Math.floor((half * 2) / (size + 2));
    for (let k = 0; k < n; k++) {
      const wx = Math.round(h.x - (n * (size + 2)) / 2 + k * (size + 2) + 1);
      fillRect(g, rand(wx, y) < 0.2 ? c.ink : c.win, wx, y, size, size + 1);
    }
  }
};

const paintGable = (g: Ctx, c: Colors<K>, h: House, ge: Gable): void => {
  fillPolygon(
    g,
    [
      [h.x + 0.5, ge.apex - 1],
      [h.x + h.a + 3, ge.eave + 2],
      [h.x - h.a - 2, ge.eave + 2],
    ],
    c.thatch,
  );
  fillPolygon(
    g,
    [
      [h.x + 0.5, ge.apex + 3],
      [h.x + h.a - 1, ge.eave + 1],
      [h.x - h.a + 2, ge.eave + 1],
    ],
    c.wood,
  );
  pixelLine(g, h.x - h.a - 2, ge.eave, h.x, ge.apex - 1, c.snowLit);
  pixelLine(g, h.x + h.a + 2, ge.eave, h.x, ge.apex - 1, c.snowLit);
  gableWindows(g, c, h, ge);
};

// The low ground floor under the eaves: posts, glowing paper screens and a dark door, banked with snow.
const paintGroundFloor = (g: Ctx, c: Colors<K>, h: House, ge: Gable): void => {
  const top = ge.eave + 2;
  const height = h.base - top;
  fillRect(g, c.wood, h.x - h.a + 1, top, h.a * 2 - 1, height);
  for (let x = h.x - h.a + 2; x < h.x + h.a - 3; x += 5) fillRect(g, c.win, x, top + 1, 3, Math.max(1, height - 2));
  fillRect(g, c.ink, h.x - 1, top + 1, 3, height - 1);
  fillRect(g, c.snow, h.x - h.a - 3, h.base - 1, h.a * 2 + 7, 2);
  fillRect(g, c.snowLit, h.x - h.a - 2, h.base - 1, h.a * 2 + 5, 1);
};

const paintHouse = (g: Ctx, c: Colors<K>, h: House): void => {
  const ge = gableOf(h);
  paintRoofSide(g, c, h, ge);
  paintGroundFloor(g, c, h, ge);
  paintGable(g, c, h, ge);
};

// ---- the valley: mountains, cedar woods, the snowy fields and the farmhouses ----

const paintWoods = (g: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  fillColumns(g, f.w, m.field + 2, c.forestLo, (x) => m.field - 6 - ridgeNoise(x / 12, 5) * 10);
  for (let i = 0; i < f.w / 4; i++) {
    const x = Math.round(rand(i, 6) * f.w);
    pine(g, x, m.field + 2, 8 + Math.round(rand(i, 7) * 10), i % 3 === 0 ? c.forestLo : c.forest, c.snowLo);
  }
};

const paintField = (g: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  g.drawImage(ditherGradient(f.w, m.river - m.field, [c.snowLo, c.snow, c.snow]), 0, m.field);
  for (let y = m.field + 6, k = 0; y < m.river - 2; y += 4 + k, k++) fillDither(g, c.snowLo, 0.5, 0, y, f.w, 1);
};

// Tall cedars standing among the houses.
const paintCedars = (g: Ctx, c: Colors<K>, houses: readonly House[]): void => {
  for (const [i, h] of houses.entries()) {
    if (i % 3 !== 1) continue;
    const x = h.x + h.dir * -(h.a + 6);
    pine(g, x, h.base, Math.round(h.a * 4), c.forest, c.snowLit);
  }
};

const valleyLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('gassho-valley', f, c, (g) => {
    const m = layoutOf(f);
    paintRange(g, f.w, m.field, m.range, 31, { rock: c.rock, lit: c.snowLit, shade: c.snowLo }, 0.6);
    paintWoods(g, f, m, c);
    paintField(g, f, m, c);
    const houses = housesOf(f);
    paintCedars(g, c, houses);
    for (const h of houses) paintHouse(g, c, h);
    fillRect(g, c.snowLit, 0, m.river - 2, f.w, 1);
    fillRect(g, c.snow, 0, m.river - 1, f.w, 1);
  });

// ---- the near bank and the footbridge ----

// Dry reeds poking through the snow on the near bank, each capped with a little snow.
const paintReeds = (g: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  for (let i = 0; i < f.w / 6; i++) {
    const x = Math.round(rand(i, 43) * f.w);
    const y = m.bank + 2 + Math.round(rand(i, 44) * (f.h - m.bank) * 0.8);
    pixelLine(g, x, y, x + (i % 3) - 1, y - 2 - Math.round(rand(i, 45) * 6), c.reed);
    fillRect(g, c.snowLit, x, y - 1, 1, 1);
  }
};

const paintBank = (g: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const rim = (x: number): number => m.bank - Math.round(ridgeNoise(x / 6, 41) * 3);
  fillColumns(g, f.w, f.h, c.snow, rim);
  fillColumns(g, f.w, f.h, c.snowLit, (x) => rim(x) + 2);
  g.drawImage(ditherGradient(f.w, f.h - m.bank - 4, [c.snowLit, c.snow, c.snowLo]), 0, m.bank + 4);
  paintReeds(g, f, m, c);
};

// The footbridge runs from the near bank out across the river: deck and handrails narrow with distance.
const deckAt = (m: Layout, u: number): readonly [number, number, number] => [
  m.nearX + (m.farX - m.nearX) * u,
  m.nearY + (m.farY - m.nearY) * u,
  7 - 5 * u,
];

const paintBridge = (g: Ctx, m: Layout, c: Colors<K>): void => {
  for (let y = m.farY; y <= m.nearY; y++) {
    const [x, , half] = deckAt(m, (m.nearY - y) / Math.max(1, m.nearY - m.farY));
    fillRect(g, c.snowLit, Math.round(x - half), y, Math.round(half * 2), 1);
    fillRect(g, c.wood, Math.round(x + half), y, 1, 2);
  }
  for (const side of [-1, 1]) {
    for (let u = 0; u <= 1; u += 0.125) {
      const [x, y, half] = deckAt(m, u);
      fillRect(g, c.wood, Math.round(x + side * half), Math.round(y - 9 + 6 * u), 1, Math.round(9 - 6 * u));
    }
    const [x0, y0, h0] = deckAt(m, 0);
    const [x1, y1, h1] = deckAt(m, 1);
    pixelLine(g, x0 + side * h0, y0 - 9, x1 + side * h1, y1 - 3, c.wood);
    pixelLine(g, x0 + side * h0, y0 - 16, (x0 + x1) / 2 + (side * (h0 + h1)) / 2, (y0 + y1) / 2 - 6, c.ink);
    pixelLine(g, (x0 + x1) / 2 + (side * (h0 + h1)) / 2, (y0 + y1) / 2 - 6, x1 + side * h1, y1 - 8, c.ink);
    fillRect(g, c.ink, Math.round(x0 + side * h0), y0 - 16, 1, 16);
    fillRect(g, c.ink, Math.round(x1 + side * h1), y1 - 8, 1, 8);
  }
};

const nearLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('gassho-near', f, c, (g) => {
    const m = layoutOf(f);
    paintBank(g, f, m, c);
    paintBridge(g, m, c);
  });

// ---- per-frame layers ----

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  skyBase(ctx, f, { bottom: m.field, stops: [c.sky0, c.sky1, c.sky2, c.sky3], stars: isDark(c.sky1) ? [c.star, c.sky3] : null, seed: 29 });
  if (nightOf(c)) moon(ctx, Math.round(f.w * 0.78), Math.round(m.field * 0.18), 6, c.star, c.sky3);
};

// The light-up: warm light pooled on the snow around each house, swelling a little on the kick.
const village = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const houses = housesOf(f);
  for (const h of houses) drawGlow(ctx, c.glow, h.x, h.base - h.a, h.a * 3, h.a * 2, 0.3);
  ctx.drawImage(valleyLayer(f, c), 0, 0);
  for (const h of houses)
    drawGlow(ctx, c.glow, h.x + h.dir * h.a, h.base + 1, h.a * 3, Math.max(2, Math.round(h.a * 0.5)), 0.3 + f.kick * 0.2);
};

const river = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  mirrorWater(ctx, f, { axis: m.river, bottom: m.bank + 4, squash: 1.1, amp: 1.2, freq: 0.8, speed: 1.6, tint: c.water, tintLevel: 0.45 });
};

// A villager under a paper umbrella, lantern in hand. u umbrella, o ink, b coat, l lantern.
const WALKER: readonly Sprite[] = [
  ['..uuu..', '.uuuuu.', 'uuuuuuu', '...o...', '..obo..', '..bbbl.', '..bbb..', '..o.o..'],
  ['..uuu..', '.uuuuu.', 'uuuuuuu', '...o...', '..obo..', '..bbbl.', '..bbb..', '...o...'],
];
const walkerPalette = paletteBy<K>((c) => ({ u: c.umbrella, o: c.ink, b: c.wood, l: c.win }));

const near = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(nearLayer(f, c), 0, 0);
  const m = layoutOf(f);
  const leg = (f.t * 0.035) % 2;
  const u = 0.1 + 0.8 * (leg < 1 ? leg : 2 - leg);
  const [x, y] = deckAt(m, u);
  drawGlow(ctx, c.glow, x + 2, y - 3, 7, 6, 0.55);
  drawSprite(ctx, WALKER[Math.floor(f.beat) % 2] as Sprite, walkerPalette(c), Math.round(x) - 3, Math.round(y) - 9);
};

const weather = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  snowfall(ctx, f, c.snowLit, Math.round((f.w * f.h) / 200), 53);
};

export const gasshoSnow = defineScene<K>({
  id: 'gassho-snow',
  title: 'Snow Village',
  mood: { valence: 0.3, energy: -0.7 },
  styles: ['snowfall', 'cozy-village', 'starlit-dream', 'credits-roll', 'showa-ballad'],
  variants: [
    {
      // Blue hour on the night of the light-up: the snow turns blue and every window glows amber.
      mood: { valence: 0.3, energy: -0.7 },
      colors: {
        sky0: '#14204e',
        sky1: '#26387a',
        sky2: '#4a64a8',
        sky3: '#8a9ad0',
        star: '#e8eeff',
        rock: '#28366a',
        forest: '#1c2c50',
        forestLo: '#141e3c',
        snow: '#a8b8e4',
        snowLit: '#e4ecff',
        snowLo: '#6e80bc',
        thatch: '#8a5e44',
        thatchLo: '#4a3030',
        wood: '#3a2630',
        woodLit: '#6a4440',
        win: '#ffc860',
        glow: '#ffa850',
        water: '#14204a',
        reed: '#5a4a5a',
        ink: '#0e0c1c',
        umbrella: '#d8504a',
      },
    },
    {
      // A quiet snowy afternoon: grey-white sky, soft lamps already lit inside.
      mood: { valence: 0.55, energy: -0.35 },
      colors: {
        sky0: '#9aa8bc',
        sky1: '#b4c0d0',
        sky2: '#ccd4e0',
        sky3: '#e2e6ee',
        star: '#ffffff',
        rock: '#6e7a90',
        forest: '#3e5058',
        forestLo: '#2c3a44',
        snow: '#dfe4ee',
        snowLit: '#ffffff',
        snowLo: '#aab4c8',
        thatch: '#9a6e4c',
        thatchLo: '#5e4034',
        wood: '#4a3430',
        woodLit: '#7a5a4a',
        win: '#ffd890',
        glow: '#ffe0a8',
        water: '#56667a',
        reed: '#6e5a4e',
        ink: '#1e1a20',
        umbrella: '#c8443e',
      },
    },
    {
      // Deep night under the moon: stars over the ridge, the village a cluster of embers in the snow.
      mood: { valence: -0.25, energy: -0.45 },
      colors: {
        sky0: '#04061a',
        sky1: '#0a1030',
        sky2: '#141e48',
        sky3: '#283468',
        star: '#f4f0dc',
        rock: '#141c3c',
        forest: '#0e1630',
        forestLo: '#080e22',
        snow: '#5a6ca0',
        snowLit: '#b0c0ec',
        snowLo: '#34447a',
        thatch: '#5a3c34',
        thatchLo: '#2c1c20',
        wood: '#24161e',
        woodLit: '#4a3034',
        win: '#ffb848',
        glow: '#ff9838',
        water: '#060a22',
        reed: '#2c2838',
        ink: '#06040c',
        umbrella: '#c03a3a',
      },
    },
  ],
  layers: [sky, village, river, near, weather],
});
