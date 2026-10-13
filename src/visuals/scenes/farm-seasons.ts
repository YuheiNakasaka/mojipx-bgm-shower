// A top-down farming game: a girl in a blue kerchief hops along her vegetable patch watering it on the beat, the crops
// grow a stage each time she tends them, hens peck in the yard by the red barn, and the in-game clock runs toward dusk.
import { type Ctx, drawSprite, drawSpriteFoot, fillRect, flipped, type Palette, type Sprite } from 'mojipx';
import { bayer, disc, frac, hexToRgb, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { type Box, drawGlow, memoPixels } from './batch-1-helpers.ts';
import { paletteOf, sigOf } from './batch-3-helpers.ts';
import { drawText, noise2, textWidth } from './batch-4-helpers.ts';
import { blinking } from './batch-7-helpers.ts';
import { digits } from './batch-8-helpers.ts';
import { memoLayer, shiftColors } from './batch-12-helpers.ts';

type K =
  | 'grass'
  | 'grassLo'
  | 'grassHi'
  | 'soil'
  | 'soilLo'
  | 'wet'
  | 'path'
  | 'water'
  | 'waterHi'
  | 'leaf'
  | 'leafLo'
  | 'leafHi'
  | 'fruit'
  | 'fruitLo'
  | 'petal'
  | 'barn'
  | 'barnLo'
  | 'roof'
  | 'roofLo'
  | 'trim'
  | 'hud'
  | 'hudLo'
  | 'text'
  | 'lamp'
  | 'dusk'
  | 'ink';

const T = 22;

// ---- sprites ----

const EYE = ['oooo', 'wwee', 'weee', 'eiie', 'oiio'];
const GIRL_TOP: Sprite = [
  '.........oooooooo.........',
  '.......ookkkkkkkkoo.......',
  '......okkKkkkkkkkkko......',
  '.....okkKkkkkkkkKkkko.....',
  '....okkkkkkKkkkkkkkkko....',
  '....okkkkkkkkkkkkkkKko....',
  '...oooookkkkkkkkkkooooo...',
  '...ohhhhoooooooooohhhho...',
  '..ohhhlllhhhhhhhhhhhhhho..',
  '..ohhhhhhhhhhhhhhhhhhhho..',
  '..ohhhhhshhhhhhhshhhhhho..',
  '..ohhhsssshhhhhhssssshho..',
  ...EYE.map((e) => `..ohhs${e}ssssss${e}shho..`),
  '..ohhssbbsssssssssbbsshho.',
  '..ohhsssssssooosssssshho..',
  '..ohhHosssssssssssssohHho.',
  '..ohhHho.oossssssoo.ohHho.',
  '..ohHHo....osssso...ohHho.',
  '..ohhho..ooowwwwooo.okko..',
  '..ohHo..owwwwgwwwwwo.oko..',
  '...oko.owwwWwwwwWwwwo.o...',
  '...ooo.owwWwwwwwwWwwo.....',
  '......owwoaaaaaaaaowwo....',
  '......osoorRaaaaaRroosso..',
  '......ossorrRaaaaRrrossso.',
  '.......oorRrrAaaArrRroo...',
  '.......orrRrrAAAArrRrro...',
  '......orRrrRrrrrrrRrrRro..',
  '......orrRrrRrrrrrrRrrRo..',
  '.....ooooooooooooooooooo..',
];
const LEGS_STAND: Sprite = [
  '.........oso..oso.........',
  '.........oso..oso.........',
  '.........oso..oso.........',
  '........offo..offo........',
  '........oooo..oooo........',
];
const LEGS_HOP: Sprite = [
  '........osso..osso........',
  '.......offo....offo.......',
  '.......oooo....oooo.......',
  '..........................',
  '..........................',
];
const GIRL_STAND: Sprite = [...GIRL_TOP, ...LEGS_STAND];
const GIRL_HOP: Sprite = [...GIRL_TOP, ...LEGS_HOP];
const GIRL_EYES = {
  eyes: [
    { x: 6, y: 12, out: -1 as const, w: 4, h: 5 },
    { x: 16, y: 12, out: 1 as const, w: 4, h: 5 },
  ],
  seed: 12,
};

const CAN_UP: Sprite = [
  '...oooo.....',
  '..o....o....',
  '.oooooooo..o',
  '.odcccccoood',
  '.odccccccoo.',
  '.occcccco...',
  '.oCCCCCCo...',
  '..oooooo....',
];
const CAN_POUR: Sprite = [
  '.ooo........',
  'o...oo......',
  'o.oooooo....',
  '.odccccco...',
  '..odcccccoo.',
  '..occcccCcoo',
  '...oCCCCCo.d',
  '....ooooo...',
];

const SPROUT: Sprite = ['.oo..oo.', 'oLgooggo', '.ogggGo.', '...oGo..', '...oGo..', '...ooo..'];
const YOUNG: Sprite = ['..oo..oo..', '.oLgooLgo.', '.oggoggGo.', '..ogggGo..', '.oLgoGgo..', '..ooGGo...', '....oGo...', '....ooo...'];
const BUDDING: Sprite = [
  '....oo......',
  '...oLgo.oo..',
  '..oLggooLgo.',
  '..oggggggGo.',
  '.oLgggFgggo.',
  '..oggGggGo..',
  '.oLggoGgggo.',
  '..ooGGGGoo..',
  '....oGGo....',
  '....oGo.....',
  '....ooo.....',
];
const BULB: Sprite = [
  '....o..o......',
  '...oLo.oLo....',
  '..oLgoogLgo...',
  '...oggggGo....',
  '....oGGGo.....',
  '...ooooooo....',
  '..offffffFo...',
  '.offpffffFFo..',
  '.offffffffFo..',
  '.offfffffFFo..',
  '..oFfffffFo...',
  '...ooooooo....',
];
const BUSH: Sprite = [
  '.....ooo......',
  '...ooLggoo....',
  '..oLggggggo...',
  '.oLgfFgggggo..',
  '.ogffFggfFgo..',
  'oggGggggfFggo.',
  'oggfFGgggGggo.',
  'ogffFggGggfFo.',
  '.ogGggfFggffo.',
  '..oGggfFgGgo..',
  '...ooGgggoo...',
  '.....oGo......',
  '.....ooo......',
];
const FLOWER: Sprite = [
  '..ooooo..',
  '.oppppPo.',
  'opppcpppo',
  'oppcccPpo',
  'opppcppPo',
  '.oPpppPo.',
  '..ooGoo..',
  '.oo.oGo..',
  'oLgooGo..',
  '.oggoGooo',
  '..oooGoLo',
  '....oGgo.',
  '....oGoo.',
  '....oGo..',
  '....oGo..',
  '....ooo..',
];

const HEN: Sprite = [
  '.....oo.....',
  '....orro....',
  '...owwwwo...',
  '...owkwwyo..',
  '...owwwwyo..',
  'oo.orwwwoo..',
  'owoowwwwwwo.',
  'owwwwwWwwwo.',
  'owwwwWWwwwo.',
  '.owwwwwwwo..',
  '..oooyoyoo..',
  '....y..y....',
];
const HEN_PECK: Sprite = [
  '............',
  '............',
  '............',
  '............',
  '........oo..',
  'oo.....orro.',
  'owoooooowwo.',
  'owwwwwwwkwyo',
  'owwwwWWwwwyo',
  '.owwwWWwwwo.',
  '..oooyoyoo..',
  '....y..y....',
];
const CHICK: Sprite = ['..ooo..', '.oYYYo.', 'oYkYYyo', 'oYYYYo.', '.oYYYo.', '..y.y..'];

// o outline, k/K kerchief (and its dots), h/H/l hair, s skin, e/i/w eyes, b blush, w/W/g blouse, a/A apron,
// r/R gingham skirt, f boots; the watering can c/C/d.
const GIRL: Palette = {
  o: '#3a2018',
  k: '#4aa8e0',
  K: '#e8f8ff',
  h: '#f4c650',
  H: '#c48a2e',
  l: '#fff2a8',
  s: '#ffe2c8',
  e: '#3a2030',
  i: '#3a8a4a',
  w: '#ffffff',
  W: '#d8d0d0',
  g: '#e85a5a',
  b: '#ff9a9a',
  a: '#fff4dc',
  A: '#e8d0a8',
  r: '#d83a3a',
  R: '#ffb8a8',
  f: '#8a4a2a',
  c: '#6ab4c4',
  C: '#3a7088',
  d: '#d0f4fa',
};

const girlColors = (c: Colors<K>): Palette => Object.fromEntries(Object.entries(GIRL).map(([k, v]) => [k, k === 'o' ? c.ink : v]));
const plantColors = (c: Colors<K>): Palette => ({
  o: c.ink,
  g: c.leaf,
  G: c.leafLo,
  L: c.leafHi,
  f: c.fruit,
  F: c.fruitLo,
  p: c.petal,
  P: c.fruit,
  c: c.soilLo,
});
const henColors = (c: Colors<K>): Palette => ({ o: c.ink, w: c.trim, W: c.path, r: '#e04040', k: c.ink, y: '#f0a030', Y: '#ffe060' });

// ---- the clock: every beat is ten minutes of the in-game day, which runs from 6:00 to 22:00 ----

const DAY_BEATS = 96;
const minutesOf = (beat: number): number => 360 + Math.floor(((Math.max(0, beat) % DAY_BEATS) + DAY_BEATS) % DAY_BEATS) * 10;
const duskLevel = (beat: number): number => {
  const hour = minutesOf(beat) / 60;
  if (hour < 15) return 0;
  return hour < 17 ? 1 : hour < 19 ? 2 : 3;
};

/** The variant's colors at the hour the clock shows: the afternoon warms and the evening sinks toward the dusk color. */
const atHour = (c: Colors<K>, beat: number): Colors<K> => shiftColors(c, c.dusk, duskLevel(beat) * 0.16);

// ---- layout ----

type Field = { readonly x: number; readonly y: number; readonly cols: number };
type Layout = {
  readonly wide: boolean;
  readonly field: Field;
  readonly barn: Box;
  readonly yard: Box;
  readonly pond: Box;
  readonly trees: readonly (readonly [number, number, number])[];
};

const treesWide = (f: Frame, barnX: number): readonly (readonly [number, number, number])[] => [
  [Math.round(f.w * 0.3), 18, 13],
  [Math.round(f.w * 0.42), 12, 11],
  [Math.round(barnX - 18), 24, 12],
  [8, f.h - 4, 14],
  [Math.round(f.w * 0.48), f.h + 2, 12],
];

const layoutOf = (f: Frame): Layout => {
  if (f.w > f.h) {
    const cols = Math.max(4, Math.min(8, Math.round((f.w * 0.46) / T)));
    const field = { x: Math.round(f.w * 0.05), y: Math.round(f.h * 0.27), cols };
    const barn = { x: f.w - 102, y: 8, w: 92, h: 78 };
    return {
      wide: true,
      field,
      barn,
      yard: { x: barn.x - 10, y: barn.y + barn.h + 14, w: f.w - barn.x + 4, h: f.h - barn.y - barn.h - 18 },
      pond: { x: Math.round(f.w * 0.08), y: field.y + 3 * T + 14, w: Math.round(f.w * 0.3), h: f.h - field.y - 3 * T - 18 },
      trees: treesWide(f, barn.x),
    };
  }
  const cols = Math.max(4, Math.min(8, Math.floor((f.w - 16) / T)));
  const field = { x: Math.round((f.w - cols * T) / 2), y: Math.round(f.h * 0.34), cols };
  const barn = { x: Math.round(f.w / 2 - 46), y: Math.round(f.h * 0.07), w: 92, h: 78 };
  const yardY = field.y + 3 * T + 16;
  return {
    wide: false,
    field,
    barn,
    yard: { x: 10, y: yardY, w: f.w - 20, h: Math.round(f.h * 0.2) },
    pond: { x: 24, y: yardY + Math.round(f.h * 0.2) + 20, w: f.w - 48, h: Math.round(f.h * 0.12) },
    trees: [
      [14, barn.y + 30, 13],
      [f.w - 14, barn.y + 40, 14],
      [f.w - 20, f.h - 6, 14],
      [12, f.h + 2, 12],
    ],
  };
};

// ---- the ground (one cached layer per hour) ----

const grassTone = (x: number, y: number): number => {
  if (rand(x, y * 7) < 0.012) return y % 2 === 0 ? 2 : 0;
  const v = noise2(x / 16, y / 11, 5) + (bayer(x, y) - 0.5) * 0.3;
  return v < 0.3 ? 0 : v > 0.8 ? 2 : 1;
};

const grassPixels = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  memoPixels(`b12farm-grass:${f.w}x${f.h}:${c.grass}:${c.grassLo}:${c.grassHi}`, f.w, f.h, (img) => {
    const tones = [c.grassLo, c.grass, c.grassHi].map(hexToRgb);
    for (let y = 0; y < f.h; y++)
      for (let x = 0; x < f.w; x++) {
        const rgb = tones[grassTone(x, y)] as readonly [number, number, number];
        img.data.set([rgb[0], rgb[1], rgb[2], 255], (y * f.w + x) * 4);
      }
  });

const plot = (g: Ctx, x: number, y: number, c: Colors<K>): void => {
  fillRect(g, c.soilLo, x + 1, y + 1, T - 2, T - 2);
  fillRect(g, c.soil, x + 2, y + 2, T - 4, T - 4);
  for (let r = y + 5; r < y + T - 3; r += 4) fillRect(g, c.soilLo, x + 3, r, T - 6, 1);
};

const field = (g: Ctx, fl: Field, c: Colors<K>): void => {
  fillRect(g, c.path, fl.x - 4, fl.y + T, fl.cols * T + 8, T);
  for (let i = 0; i < fl.cols; i++) {
    plot(g, fl.x + i * T, fl.y, c);
    plot(g, fl.x + i * T, fl.y + 2 * T, c);
  }
};

const pondRows = (p: Box, grow: number, each: (y: number, x: number, w: number, k: number) => void): void => {
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;
  for (let y = p.y - grow; y < p.y + p.h + grow; y++) {
    const k = (y + 0.5 - cy) / (p.h / 2 + grow);
    const half = Math.sqrt(Math.max(0, 1 - k * k)) * (p.w / 2 + grow) * (1 + Math.sin(y * 0.4) * 0.04);
    if (half >= 1) each(y, Math.round(cx - half), Math.round(half * 2), k);
  }
};

const pond = (g: Ctx, p: Box, c: Colors<K>): void => {
  pondRows(p, 2, (y, x, w) => fillRect(g, c.path, x, y, w, 1));
  pondRows(p, 0, (y, x, w) => fillRect(g, c.water, x, y, w, 1));
  pondRows(p, -3, (y, x, w, k) => {
    if (k > 0.2 && y % 3 === 0) fillRect(g, c.waterHi, x + Math.round(w * 0.6), y, Math.round(w * 0.2), 1);
  });
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;
  for (const [dx, dy] of [
    [-0.25, 0.1],
    [0.2, -0.05],
    [0.05, 0.3],
  ] as const) {
    disc(g, cx + dx * p.w, cy + dy * p.h, 3, () => c.leaf);
    fillRect(g, c.water, Math.round(cx + dx * p.w), Math.round(cy + dy * p.h) - 3, 1, 3);
  }
};

// The shipping crate at the end of the walkway, where the harvest goes.
const crate = (g: Ctx, x: number, y: number, c: Colors<K>): void => {
  fillRect(g, c.ink, x - 1, y - 1, 20, 17);
  fillRect(g, c.hudLo, x, y, 18, 15);
  fillRect(g, c.hud, x, y, 18, 4);
  for (let k = x + 3; k < x + 18; k += 5) fillRect(g, c.soilLo, k, y + 5, 1, 10);
};

const fence = (g: Ctx, y: Box, c: Colors<K>): void => {
  for (const row of [y.y, y.y + y.h]) {
    fillRect(g, c.ink, y.x, row + 2, y.w, 3);
    fillRect(g, c.trim, y.x, row + 3, y.w, 1);
  }
  for (const col of [y.x, y.x + y.w - 1]) fillRect(g, c.trim, col, y.y, 1, y.h + 4);
  for (let x = y.x; x < y.x + y.w; x += 8) {
    for (const row of [y.y, y.y + y.h]) {
      fillRect(g, c.ink, x - 1, row - 1, 3, 8);
      fillRect(g, c.trim, x, row, 1, 6);
    }
  }
};

const tree = (g: Ctx, x: number, y: number, r: number, c: Colors<K>): void => {
  disc(g, x + 3, y + r * 0.6, r, () => c.grassLo);
  fillRect(g, c.ink, x - 2, y, 5, Math.round(r * 0.7));
  fillRect(g, c.soilLo, x - 1, y, 3, Math.round(r * 0.7));
  disc(g, x, y - r * 0.5, r + 1, () => c.ink);
  disc(g, x, y - r * 0.5, r, (dy) => (dy > r * 0.35 ? c.leafLo : c.leaf));
  disc(g, x - r * 0.3, y - r * 0.85, Math.round(r * 0.45), () => c.leafHi);
};

const barn = (g: Ctx, b: Box, c: Colors<K>): void => {
  const roofH = 40;
  fillRect(g, c.grassLo, b.x + 4, b.y + b.h - 2, b.w, 6);
  for (let r = 0; r < roofH; r++) {
    const inset = Math.round((roofH - r) * 0.12);
    fillRect(g, c.ink, b.x + inset - 1, b.y + r, b.w - inset * 2 + 2, 1);
    fillRect(g, Math.floor(r / 5) % 2 === 0 ? c.roof : c.roofLo, b.x + inset, b.y + r, b.w - inset * 2, 1);
  }
  for (let r = 4; r < roofH; r += 5)
    for (let x = b.x + 6 + (r % 10 === 4 ? 0 : 5); x < b.x + b.w - 6; x += 10) fillRect(g, c.roofLo, x, b.y + r, 1, 5);
  fillRect(g, c.roofLo, b.x + 6, b.y + 1, b.w - 12, 2);
  fillRect(g, c.ink, b.x - 1, b.y + roofH, b.w + 2, b.h - roofH + 1);
  fillRect(g, c.barn, b.x, b.y + roofH, b.w, b.h - roofH);
  for (let x = b.x + 3; x < b.x + b.w; x += 4) fillRect(g, c.barnLo, x, b.y + roofH + 2, 1, b.h - roofH - 2);
  fillRect(g, c.barnLo, b.x, b.y + roofH, b.w, 2);
  barnDoor(g, b.x + b.w / 2 - 14, b.y + b.h - 26, c);
};

const barnDoor = (g: Ctx, x: number, y: number, c: Colors<K>): void => {
  fillRect(g, c.trim, x - 2, y - 2, 32, 28);
  fillRect(g, c.barnLo, x, y, 28, 26);
  for (let k = 0; k < 26; k++) {
    fillRect(g, c.trim, Math.round(x + (k * 13) / 26), y + k, 2, 1);
    fillRect(g, c.trim, Math.round(x + 26 - (k * 13) / 26), y + k, 2, 1);
    fillRect(g, c.trim, Math.round(x + 14 + (k * 13) / 26), y + k, 2, 1);
    fillRect(g, c.trim, Math.round(x + 12 - (k * 13) / 26), y + k, 2, 1);
  }
  fillRect(g, c.trim, x + 13, y, 2, 26);
};

const flowers = (g: Ctx, f: Frame, c: Colors<K>): void => {
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(rand(i, 61) * f.w);
    const y = Math.floor(rand(i, 62) * f.h);
    fillRect(g, i % 3 === 0 ? c.trim : c.petal, x, y, 1, 1);
  }
};

const ground = (ctx: Ctx, f: Frame, base: Colors<K>): void => {
  const c = atHour(base, f.beat);
  const l = layoutOf(f);
  const layer = memoLayer(`farm-ground:${sigOf(c)}`, f.w, f.h, (g) => {
    g.drawImage(grassPixels(f, c), 0, 0);
    flowers(g, f, c);
    fillRect(g, c.path, l.barn.x + l.barn.w / 2 - 10, l.barn.y + l.barn.h, 20, l.wide ? 8 : l.field.y - l.barn.y - l.barn.h + T);
    field(g, l.field, c);
    crate(g, l.wide ? l.field.x + l.field.cols * T + 8 : l.barn.x + l.barn.w - 22, l.wide ? l.field.y + T + 3 : l.barn.y + l.barn.h + 4, c);
    pond(g, l.pond, c);
    fence(g, l.yard, c);
    barn(g, l.barn, c);
    for (const [x, y, r] of l.trees) tree(g, x, y, r, c);
  });
  ctx.drawImage(layer, 0, 0);
};

// ---- the girl's round: she hops plot to plot along the walkway and back, two beats at each ----

const stationsOf = (cols: number): number => Math.max(1, cols * 2 - 2);
const plotAt = (station: number, cols: number): number => (station < cols ? station : cols * 2 - 2 - station);

type Visit = { readonly station: number; readonly plot: number; readonly into: number };

const visitOf = (beat: number, cols: number): Visit => {
  const n = stationsOf(cols);
  const step = Math.floor(Math.max(0, beat) / 2);
  const station = step % n;
  return { station, plot: plotAt(station, cols), into: Math.max(0, beat) / 2 - step };
};

// How often a plot has been tended by `beat`: a visit counts once she has watered for a beat.
const tendedCount = (plotIndex: number, beat: number, cols: number): number => {
  const n = stationsOf(cols);
  const period = n * 2;
  const b = Math.max(0, beat);
  const cycles = Math.floor(b / period);
  const into = b - cycles * period;
  let count = 0;
  for (let s = 0; s < n; s++) {
    if (plotAt(s, cols) !== plotIndex) continue;
    count += cycles + (s * 2 + 1.5 <= into ? 1 : 0);
  }
  return count;
};

const stageOf = (i: number, beat: number, cols: number): number => (tendedCount(i, beat, cols) + Math.floor(rand(i, 71) * 5)) % 5;

const girlX = (l: Layout, station: number): number => l.field.x + plotAt(station, l.field.cols) * T + T / 2 - 6;

const girl = (ctx: Ctx, f: Frame, base: Colors<K>): void => {
  const c = atHour(base, f.beat);
  const l = layoutOf(f);
  const v = visitOf(f.beat, l.field.cols);
  const prev = (v.station + stationsOf(l.field.cols) - 1) % stationsOf(l.field.cols);
  const hop = Math.min(1, v.into * 4);
  const x = Math.round(girlX(l, prev) + (girlX(l, v.station) - girlX(l, prev)) * hop);
  const lift = hop < 1 ? Math.round(Math.sin(hop * Math.PI) * 7) : 0;
  const foot = l.field.y + 2 * T - 2;
  const palette = paletteOf(c, girlColors);
  fillRect(ctx, c.grassLo, x - 8, foot - 1, 16, 2);
  const sprite = lift > 0 ? GIRL_HOP : GIRL_STAND;
  const top = foot - lift - sprite.length;
  drawSprite(ctx, sprite, palette, x - 13, top);
  if (blinking(f.t, 12)) for (const e of GIRL_EYES.eyes) fillRect(ctx, palette.s ?? '#ffe2c8', x - 13 + e.x, top + e.y + 1, 4, 4);
  const pouring = hop >= 1 && v.into > 0.3;
  drawSprite(ctx, pouring ? CAN_POUR : CAN_UP, palette, x + 7, top + (pouring ? 26 : 28));
  if (pouring) water(ctx, f, x + 18, top + 32, l.field.y + 2 * T + 12, c);
};

const water = (ctx: Ctx, f: Frame, x: number, y: number, bottom: number, c: Colors<K>): void => {
  for (let k = 0; k < 6; k++) {
    const p = frac(f.t * 2.2 + k / 6);
    const dx = Math.round(p * 5 + Math.sin(k * 2) * 1.5);
    const dy = Math.round(p * (bottom - y));
    fillRect(ctx, k % 2 === 0 ? c.waterHi : c.trim, x + dx, y + dy, 1, 2);
  }
  if (frac(f.t * 3) < 0.5) fillRect(ctx, c.waterHi, x + 3, bottom, 3, 1);
};

// ---- crops ----

const cropSprite = (i: number, stage: number): Sprite | null => {
  if (stage === 1) return SPROUT;
  if (stage === 2) return YOUNG;
  if (stage === 3) return BUDDING;
  if (stage === 4) return i % 2 === 0 ? BULB : BUSH;
  return null;
};

const seeds = (ctx: Ctx, x: number, y: number, color: string): void => {
  for (const [dx, dy] of [
    [-4, -2],
    [1, 0],
    [5, -3],
  ] as const)
    fillRect(ctx, color, x + dx, y + dy, 2, 1);
};

const crops = (ctx: Ctx, f: Frame, base: Colors<K>): void => {
  const c = atHour(base, f.beat);
  const { field: fl } = layoutOf(f);
  const palette = paletteOf(c, plantColors);
  for (let i = 0; i < fl.cols; i++) {
    const x = fl.x + i * T + T / 2;
    const y = fl.y + 3 * T - 4;
    if (Math.max(0, f.beat) - lastTended(i, f.beat, fl.cols) < 12) fillRect(ctx, c.wet, fl.x + i * T + 3, fl.y + 2 * T + 3, T - 6, T - 6);
    const stage = stageOf(i, f.beat, fl.cols);
    const sprite = cropSprite(i, stage);
    if (sprite) drawSpriteFoot(ctx, sprite, palette, x, y);
    else seeds(ctx, x, y - 4, c.ink);
  }
};

const lastTended = (i: number, beat: number, cols: number): number => {
  for (let back = 0; back < stationsOf(cols) * 2; back += 2) {
    const b = Math.max(0, beat) - back;
    if (b < 0) return -99;
    const v = visitOf(b, cols);
    if (v.plot === i && (back > 0 || v.into >= 0.75)) return Math.floor(b / 2) * 2 + 1.5;
  }
  return -99;
};

// Tall flowers along the back row sway to the beat, each a little out of step.
const backRow = (ctx: Ctx, f: Frame, base: Colors<K>): void => {
  const c = atHour(base, f.beat);
  const { field: fl } = layoutOf(f);
  const palette = paletteOf(c, plantColors);
  for (let i = 0; i < fl.cols; i++) {
    const lean = Math.floor(f.beat + i * 0.5) % 2 === 0 ? 0 : 1;
    const sprite = lean ? FLOWER : flipped(FLOWER);
    drawSpriteFoot(ctx, sprite, palette, fl.x + i * T + T / 2, fl.y + T - 3);
  }
};

// A harvest: when a ripe crop is tended it pops out of the ground and floats up with a sparkle.
const harvests = (ctx: Ctx, f: Frame, base: Colors<K>): void => {
  const c = atHour(base, f.beat);
  const { field: fl } = layoutOf(f);
  const v = visitOf(f.beat, fl.cols);
  if (v.into < 0.75 || stageOf(v.plot, f.beat, fl.cols) !== 0) return;
  const age = (v.into - 0.75) * 2;
  const x = fl.x + v.plot * T + T / 2;
  const y = Math.round(fl.y + 2 * T - age * 16);
  drawSpriteFoot(ctx, v.plot % 2 === 0 ? BULB : BUSH, paletteOf(c, plantColors), x, y);
  const arm = frac(f.t * 4) < 0.5 ? 2 : 3;
  fillRect(ctx, c.trim, x + 8 - arm, y - 14, arm * 2 + 1, 1);
  fillRect(ctx, c.trim, x + 8, y - 14 - arm, 1, arm * 2 + 1);
};

// ---- the yard ----

type Hen = { readonly x: number; readonly y: number; readonly left: boolean; readonly peck: boolean };

const henSpot = (yard: Box, i: number, bar: number): readonly [number, number] => [
  yard.x + 14 + rand(bar, i * 3 + 1) * (yard.w - 28),
  yard.y + 16 + rand(bar, i * 3 + 2) * Math.max(1, yard.h - 18),
];

const henAt = (yard: Box, i: number, beat: number): Hen => {
  const b = Math.max(0, beat) + i * 1.3;
  const bar = Math.floor(b / 4);
  const walk = Math.min(1, (b - bar * 4) / 1.5);
  const [x0, y0] = henSpot(yard, i, bar - 1);
  const [x1, y1] = henSpot(yard, i, bar);
  return {
    x: Math.round(x0 + (x1 - x0) * walk),
    y: Math.round(y0 + (y1 - y0) * walk),
    left: x1 < x0,
    peck: walk >= 1 && frac(b) < 0.4,
  };
};

const hens = (ctx: Ctx, f: Frame, base: Colors<K>): void => {
  const c = atHour(base, f.beat);
  const { yard, wide } = layoutOf(f);
  const palette = paletteOf(c, henColors);
  const flock = wide ? 4 : 6;
  for (let i = 0; i < flock; i++) {
    const hen = henAt(yard, i, f.beat);
    const sprite = i >= flock - 2 && i % 2 === 1 ? CHICK : hen.peck ? HEN_PECK : HEN;
    drawSpriteFoot(ctx, hen.left ? flipped(sprite) : sprite, palette, hen.x, hen.y);
  }
};

// ---- light and life ----

const BUTTERFLY: readonly Sprite[] = [
  ['p.p', '.o.', 'p.p'],
  ['...', 'pop', '...'],
];

const butterflies = (ctx: Ctx, f: Frame, base: Colors<K>): void => {
  const c = atHour(base, f.beat);
  if (duskLevel(f.beat) >= 3) {
    fireflies(ctx, f, c);
    return;
  }
  for (let i = 0; i < 3; i++) {
    const x = f.w * (0.15 + i * 0.3) + Math.sin(f.t * 0.6 + i * 2) * 30;
    const y = f.h * (0.2 + 0.25 * (i % 2)) + Math.sin(f.t * 1.3 + i) * 12;
    drawSprite(
      ctx,
      BUTTERFLY[Math.floor(f.t * 8 + i) % 2] as Sprite,
      { p: i === 1 ? c.petal : c.trim, o: c.ink },
      Math.round(x),
      Math.round(y),
    );
  }
};

const fireflies = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  for (let i = 0; i < 12; i++) {
    if (Math.sin(f.t * 2 + i * 1.7) < 0) continue;
    const x = Math.round(rand(i, 81) * f.w + Math.sin(f.t * 0.5 + i) * 10);
    const y = Math.round(rand(i, 82) * f.h + Math.cos(f.t * 0.4 + i) * 8);
    fillRect(ctx, c.lamp, x, y, 1, 1);
  }
};

const barnLights = (ctx: Ctx, f: Frame, base: Colors<K>): void => {
  const c = atHour(base, f.beat);
  const { barn: b } = layoutOf(f);
  const lit = duskLevel(f.beat) >= 2;
  for (const x of [b.x + 10, b.x + b.w - 22]) {
    fillRect(ctx, c.trim, x - 1, b.y + 47, 14, 11);
    fillRect(ctx, lit ? base.lamp : c.waterHi, x, b.y + 48, 12, 9);
    fillRect(ctx, c.trim, x + 5, b.y + 48, 1, 9);
    if (lit) drawGlow(ctx, base.lamp, x + 6, b.y + 53, 14, 10, 0.35 + f.kick * 0.1);
  }
};

// ---- the HUD: date and clock, and the money earned from harvests ----

const panel = (ctx: Ctx, x: number, y: number, w: number, h: number, c: Colors<K>): void => {
  fillRect(ctx, c.ink, x, y, w, h);
  fillRect(ctx, c.hudLo, x + 1, y + 1, w - 2, h - 2);
  fillRect(ctx, c.hud, x + 2, y + 2, w - 4, h - 4);
};

const clockText = (beat: number): string => {
  const m = minutesOf(beat);
  const h = Math.floor(m / 60);
  return `${((h + 11) % 12) + 1}:${digits(m % 60, 2)}${h < 12 ? 'AM' : 'PM'}`;
};

const hud = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const day = (Math.floor(Math.max(0, f.beat) / DAY_BEATS) % 28) + 3;
  panel(ctx, 4, 4, 62, 25, c);
  const evening = duskLevel(f.beat) >= 3;
  if (evening) disc(ctx, 12, 11, 3, () => c.lamp);
  else disc(ctx, 12, 11, 3, () => c.fruit);
  if (evening) disc(ctx, 13, 10, 2, () => c.hud);
  drawText(ctx, `DAY ${day}`, 19, 8, c.text);
  drawText(ctx, clockText(f.beat), 9, 18, c.text);
  const { field: fl } = layoutOf(f);
  const gold = 1200 + (Array.from({ length: fl.cols }, (_, i) => tendedCount(i, f.beat, fl.cols)).reduce((a, b) => a + b, 0) >> 2) * 40;
  const text = `G ${digits(gold, 5)}`;
  const w = textWidth(text) + 10;
  panel(ctx, f.w - w - 4, 4, w, 13, c);
  drawText(ctx, text, f.w - w + 1, 7, c.text);
};

export const farmSeasons = defineScene<K>({
  id: 'farm-seasons',
  title: 'Harvest Days',
  mood: { valence: 0.6, energy: -0.2 },
  styles: ['cozy-village', 'town-waltz', 'grand-field', 'celtic-isle'],
  variants: [
    {
      mood: { valence: 0.6, energy: -0.2 },
      colors: {
        grass: '#6ab84a',
        grassLo: '#4a9a3e',
        grassHi: '#9ad464',
        soil: '#9a6440',
        soilLo: '#6e4430',
        wet: '#5a3626',
        path: '#d8b47a',
        water: '#4a9ad8',
        waterHi: '#a8e0ff',
        leaf: '#4aa83a',
        leafLo: '#2e7a32',
        leafHi: '#9ae05a',
        fruit: '#ff7a9a',
        fruitLo: '#c84a72',
        petal: '#ffb8d0',
        barn: '#c83a34',
        barnLo: '#8a2428',
        roof: '#6a4a5a',
        roofLo: '#4a3242',
        trim: '#fff6e8',
        hud: '#f4dcae',
        hudLo: '#a8744a',
        text: '#4a2a1a',
        lamp: '#ffd870',
        dusk: '#ff8a4a',
        ink: '#2a1a14',
      },
    },
    {
      mood: { valence: 0.75, energy: 0.35 },
      colors: {
        grass: '#5ac040',
        grassLo: '#3a9a34',
        grassHi: '#a0e050',
        soil: '#a86a3a',
        soilLo: '#74462a',
        wet: '#5e3620',
        path: '#e8c47a',
        water: '#38a0e8',
        waterHi: '#b8ecff',
        leaf: '#3aa830',
        leafLo: '#26782c',
        leafHi: '#a8e848',
        fruit: '#ff4a3a',
        fruitLo: '#b82a2a',
        petal: '#ffd83a',
        barn: '#d8402e',
        barnLo: '#9a2a22',
        roof: '#5a5a7a',
        roofLo: '#3e3e5a',
        trim: '#ffffff',
        hud: '#ffe8b8',
        hudLo: '#b07a48',
        text: '#4a2a1a',
        lamp: '#ffe080',
        dusk: '#ff7a3a',
        ink: '#221810',
      },
    },
    {
      mood: { valence: 0.25, energy: -0.5 },
      colors: {
        grass: '#a8a44a',
        grassLo: '#7e7e3a',
        grassHi: '#d0c060',
        soil: '#8a5a3a',
        soilLo: '#5e3a2a',
        wet: '#4a2c20',
        path: '#d8a86a',
        water: '#4a7ab0',
        waterHi: '#a0c8e8',
        leaf: '#8a9a3a',
        leafLo: '#5e6e2e',
        leafHi: '#d0b84a',
        fruit: '#f08a2a',
        fruitLo: '#b85a1e',
        petal: '#ff9a6a',
        barn: '#b03a30',
        barnLo: '#7a2424',
        roof: '#5a4440',
        roofLo: '#3e2e2c',
        trim: '#f8ead4',
        hud: '#ecd0a0',
        hudLo: '#9a6a40',
        text: '#4a2a1a',
        lamp: '#ffc860',
        dusk: '#d8603a',
        ink: '#261812',
      },
    },
  ],
  layers: [ground, backRow, crops, barnLights, girl, harvests, hens, butterflies, (ctx, f, c) => hud(ctx, f, atHour(c, f.beat))],
});
