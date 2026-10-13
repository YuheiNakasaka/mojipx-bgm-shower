// Kyoto's golden pavilion across its mirror pond: a storey of plain wood and white shutters under two storeys of gold
// leaf, the pyramid roof crowned by a bronze phoenix, pine-topped islets and rocks, and the whole of it upside down in
// the still water. Carp rise and ring the reflection, the gold glints on the beat, and the season sets the hill's
// colors: snow on every roof, the maples ablaze, or the fresh green of early summer.
import { type Ctx, drawSprite, fillRect, flipped, type Sprite } from 'mojipx';
import { fillColumns, hexToRgb, memoLayer, noise1, rand, ridgeNoise } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { colorKey, driftingClouds, flock, paletteBy, wrap } from './batch-1-helpers.ts';
import { recentBeats } from './batch-3-helpers.ts';
import { BIRD } from './batch-5-helpers.ts';
import { frameLayer, glints, mirrorWater, ring, snowfall, twinkle } from './batch-6-helpers.ts';
import { flutter, type Plan, planOf, puff, skyBase } from './batch-9-helpers.ts';
import {
  needlePad,
  type PineTones,
  paintBough,
  paintCanopy,
  paintEaves,
  paintPine,
  px,
  type RoofTones,
  scaleOf,
  type Tones,
} from './batch-16-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sky3'
  | 'cloud'
  | 'hill'
  | 'pine'
  | 'pineLo'
  | 'pineLit'
  | 'maple0'
  | 'maple1'
  | 'maple2'
  | 'snow'
  | 'gold'
  | 'goldLit'
  | 'goldLo'
  | 'glint'
  | 'phoenix'
  | 'wood'
  | 'woodLo'
  | 'white'
  | 'roof'
  | 'roofLit'
  | 'roofLo'
  | 'ink'
  | 'stone'
  | 'stoneLit'
  | 'stoneLo'
  | 'water'
  | 'waterLit'
  | 'koi'
  | 'koiLit'
  | 'koiRed';

// ---- layout ----

type Spot = 'padX' | 'water' | 'hillTop' | 'isleL' | 'isleR';
type Layout = Readonly<Record<Spot, number>>;

const WIDE: Plan<Spot> = { padX: ['w', 0.5], water: ['h', 0.63], hillTop: ['h', 0.19], isleL: ['w', 0.13], isleR: ['w', 0.84] };
const TALL: Plan<Spot> = { padX: ['w', 0.5], water: ['h', 0.54], hillTop: ['h', 0.3], isleL: ['w', 0.08], isleR: ['w', 0.87] };

const layoutOf = (f: Frame): Layout => planOf(f, WIDE, TALL);

// The colors tell the season: snow differs from the bare roof in winter, and the maples turn red in autumn.
const snowyOf = (c: Colors<K>): boolean => c.snow !== c.roof;
const autumnOf = (c: Colors<K>): boolean => {
  const [r, g] = hexToRgb(c.maple1);
  return r > g * 1.4;
};

// ---- the pavilion, drawn at design size and scaled ----

/** The pavilion picture's size and the row of its foundation's foot, at design size. */
const PICTURE = [96, 70] as const;
const FOOT = 68;

type Rows = {
  readonly ground: number;
  readonly roof1: number;
  readonly middle: number;
  readonly roof2: number;
  readonly top: number;
  readonly roof3: number;
  readonly apex: number;
};

// Bottom rows of the three storeys and the eave rows of the three roofs, from the foundation up.
const rowsOf = (foot: number, s: number): Rows => {
  const ground = foot - px(3, s);
  const roof1 = ground - px(12, s) + 1;
  const middle = roof1 - px(4, s);
  const roof2 = middle - px(11, s) + 1;
  const top = roof2 - px(7, s);
  const roof3 = top - px(11, s) + 1;
  return { ground, roof1, middle, roof2, top, roof3, apex: roof3 - px(12, s) };
};

const roofTones = (c: Colors<K>): RoofTones => {
  const snow = snowyOf(c) ? c.snow : c.roof;
  return { body: c.roof, seam: c.roof, hip: snowyOf(c) ? c.snow : c.roofLit, edge: c.roofLit, under: c.roofLo, snow };
};

// Natural wood: a post lit on its left.
const post = (g: Ctx, c: Colors<K>, x: number, y: number, h: number): void => {
  fillRect(g, c.wood, x, y, 2, h);
  fillRect(g, c.white, x, y, 1, h);
};

// Lattice shutters hinged up under the eave, white boards below.
const shutter = (g: Ctx, c: Colors<K>, x: number, y: number, size: readonly [number, number]): void => {
  const [w, h] = size;
  fillRect(g, c.white, x, y, w, h);
  for (let k = y + 1; k < y + h; k += 2) fillRect(g, c.wood, x, k, w, 1);
  for (let k = x + 2; k < x + w; k += 3) fillRect(g, c.wood, k, y, 1, h);
};

const paintGroundFloor = (g: Ctx, c: Colors<K>, cx: number, bottom: number, s: number): void => {
  const half = px(30, s);
  const h = px(12, s);
  const top = bottom - h;
  const bay = (half * 2) / 5;
  fillRect(g, c.woodLo, cx - half, top, half * 2 + 1, h);
  for (let i = 0; i < 5; i++) {
    const x = Math.round(cx - half + i * bay) + 2;
    if (i !== 2) shutter(g, c, x, top + 1, [Math.round(bay) - 2, Math.round(h * 0.55)]);
    if (i !== 2) fillRect(g, c.white, x, top + Math.round(h * 0.55) + 2, Math.round(bay) - 2, h - Math.round(h * 0.55) - 3);
  }
  for (let i = 0; i <= 5; i++) post(g, c, Math.round(cx - half + i * bay) - (i === 5 ? 1 : 0), top, h);
  fillRect(g, c.wood, cx - half - px(3, s), bottom - 2, (half + px(3, s)) * 2 + 1, 2);
  fillRect(g, c.white, cx - half - px(3, s), bottom - 2, (half + px(3, s)) * 2 + 1, 1);
};

// The foundation stones, and short posts standing in the water.
const paintPlinth = (g: Ctx, c: Colors<K>, cx: number, foot: number, s: number): void => {
  const half = px(32, s);
  fillRect(g, c.stone, cx - half, foot - px(3, s) + 1, half * 2 + 1, px(3, s));
  fillRect(g, c.stoneLit, cx - half, foot - px(3, s) + 1, half * 2 + 1, 1);
  for (let x = cx - half + 2; x < cx + half; x += 4) fillRect(g, c.stoneLo, x, foot - 1, 2, 2);
};

type Storey = { readonly cx: number; readonly bottom: number; readonly half: number; readonly h: number };

// A balcony rail round a gilded storey: a bright top rail on close-set balusters.
const railing = (g: Ctx, c: Colors<K>, st: Storey, s: number): void => {
  const half = st.half + px(3, s);
  const y = st.bottom - px(4, s);
  for (let x = st.cx - half; x <= st.cx + half; x += 2) fillRect(g, c.goldLo, x, y + 1, 1, st.bottom - y - 1);
  fillRect(g, c.goldLit, st.cx - half, y, half * 2 + 1, 1);
  fillRect(g, c.goldLo, st.cx - half, st.bottom - 1, half * 2 + 1, 1);
};

// A gilded storey: gold leaf lit from the left, darker posts, lattice doors in the middle bays.
const paintGilded = (g: Ctx, c: Colors<K>, st: Storey, s: number): void => {
  const top = st.bottom - st.h;
  const bays = st.half > px(20, s) ? 5 : 3;
  const bay = (st.half * 2) / bays;
  fillRect(g, c.gold, st.cx - st.half, top, st.half * 2 + 1, st.h);
  fillRect(g, c.goldLit, st.cx - st.half, top, 2, st.h);
  fillRect(g, c.goldLo, st.cx + st.half - 1, top, 2, st.h);
  for (let i = 1; i < bays; i++) fillRect(g, c.goldLo, Math.round(st.cx - st.half + i * bay), top, 1, st.h);
  const door = Math.max(3, Math.round(bay) - px(4, s));
  for (let i = 1; i < bays - 1; i++) {
    const x = Math.round(st.cx - st.half + i * bay + (bay - door) / 2);
    fillRect(g, c.goldLo, x, top + 2, door, st.h - 5);
    for (let k = x + 1; k < x + door; k += 2) fillRect(g, c.gold, k, top + 3, 1, st.h - 7);
  }
  fillRect(g, c.goldLit, st.cx - st.half, top + 1, st.half * 2 + 1, 1);
  railing(g, c, st, s);
};

// The bell-shaped windows of the top storey.
const bellWindow = (g: Ctx, c: Colors<K>, cx: number, y: number, h: number): void => {
  fillRect(g, c.ink, cx, y, 1, 1);
  fillRect(g, c.ink, cx - 1, y + 1, 3, 1);
  fillRect(g, c.ink, cx - 2, y + 2, 5, h - 2);
  fillRect(g, c.goldLo, cx - 2, y + h - 1, 5, 1);
};

// A small open-sided annex on stilts off the west side.
const paintAnnex = (g: Ctx, c: Colors<K>, cx: number, foot: number, s: number): void => {
  const x0 = cx - px(46, s);
  const w = px(16, s);
  const top = foot - px(10, s);
  fillRect(g, c.woodLo, x0, top, w, px(8, s));
  for (const x of [x0, x0 + Math.round(w / 2), x0 + w - 2]) post(g, c, x, top, foot - top + 1);
  fillRect(g, c.wood, x0 - 1, foot - px(3, s), w + 2, 2);
  paintEaves(
    g,
    { cx: x0 + Math.round(w / 2), eave: top + 1, half: Math.round(w / 2) + px(3, s), top: px(2, s), rise: px(5, s), lift: 1, edge: 1 },
    roofTones(c),
  );
};

// The phoenix on the peak, wings raised. p bronze, h the light on it.
const PHOENIX: Sprite = ['h.....p', 'hp...pp', '.hpppp.', '..hpp..', '.hpp...', 'hp.pp..', '...p.p.'];
const phoenixPalette = paletteBy<K>((c) => ({ p: c.phoenix, h: c.goldLit }));

const paintTop = (g: Ctx, c: Colors<K>, cx: number, r: Rows, s: number): void => {
  const st = { cx, bottom: r.top, half: px(15, s), h: px(11, s) };
  paintGilded(g, c, st, s);
  for (const dx of [-8, 8]) bellWindow(g, c, cx + Math.round(dx * s), r.top - st.h + px(3, s), px(6, s));
  paintEaves(g, { cx, eave: r.roof3, half: px(24, s), top: 1, rise: px(12, s), lift: px(3, s), edge: 2 }, roofTones(c));
  fillRect(g, c.phoenix, cx, r.apex - 2, 1, 3);
  drawSprite(g, PHOENIX, phoenixPalette(c), cx - 3, r.apex - 2 - PHOENIX.length);
};

const pavilionImage = (s: number, c: Colors<K>): HTMLCanvasElement => {
  const w = px(PICTURE[0], s);
  return memoLayer(`kinkaku:${s}:${colorKey(c)}`, w, px(PICTURE[1], s), (g) => {
    const cx = Math.floor(w / 2) + px(4, s);
    const foot = px(FOOT, s);
    const r = rowsOf(foot, s);
    paintAnnex(g, c, cx, foot, s);
    paintPlinth(g, c, cx, foot, s);
    paintGroundFloor(g, c, cx, r.ground, s);
    paintEaves(g, { cx, eave: r.roof1, half: px(36, s), top: px(28, s), rise: px(4, s), lift: px(2, s), edge: 2 }, roofTones(c));
    paintGilded(g, c, { cx, bottom: r.middle, half: px(28, s), h: px(11, s) }, s);
    paintEaves(g, { cx, eave: r.roof2, half: px(38, s), top: px(15, s), rise: px(7, s), lift: px(3, s), edge: 2 }, roofTones(c));
    paintTop(g, c, cx, r, s);
  });
};

/** Where the pavilion picture goes: its left edge, its top row, and its centre line on screen. */
const placeOf = (f: Frame, m: Layout): { readonly x: number; readonly y: number; readonly cx: number } => {
  const s = scaleOf(f);
  const x = m.padX - Math.floor(px(PICTURE[0], s) / 2) - px(4, s);
  return { x, y: m.water - px(FOOT, s) - 1, cx: m.padX };
};

// ---- the hill, the far shore, the islets ----

const pineTones = (c: Colors<K>): PineTones => ({
  ...{ ink: c.ink, bark: c.woodLo, dark: c.pineLo, mid: c.pine, lit: c.pineLit },
  snow: snowyOf(c) ? c.snow : c.pineLit,
});

const hillKinds = (c: Colors<K>): readonly Tones[] => {
  const lit = snowyOf(c) ? c.snow : c.pineLit;
  return [
    [c.pineLo, c.pine, lit],
    [c.pineLo, c.pineLo, c.pine],
    [c.maple0, c.maple1, c.maple2],
    [c.pineLo, c.pine, lit],
    [c.maple0, c.maple1, c.maple2],
  ];
};

// The wooded hill behind rises a little left of the pavilion and falls away to both sides.
const hillTop = (f: Frame, m: Layout, x: number): number => {
  const spread = f.w > f.h ? f.w * 0.75 : f.w * 1.3;
  return m.hillTop + ((x - f.w * 0.38) / spread) ** 2 * (m.water - m.hillTop) * 1.2 - ridgeNoise(x / 9, 5) * 5;
};

// The far shore: a hedge of clipped shrubs along the stone edge of the pond.
const paintShore = (g: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const shrub: Tones = [c.pineLo, c.pine, snowyOf(c) ? c.snow : c.pineLit];
  for (let x = 0, i = 0; x < f.w + 4; x += 5, i++) puff(g, x, m.water - 3 - Math.round(rand(i, 13) * 2), 3, shrub);
  fillRect(g, c.stoneLo, 0, m.water - 1, f.w, 1);
};

// The misty ridge far behind, then the wooded hill.
const paintHill = (g: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const top = (x: number): number => hillTop(f, m, x);
  fillColumns(g, f.w, m.water, c.hill, (x) => m.hillTop + 16 - ridgeNoise(x / 34, 3) * 22);
  fillColumns(g, f.w, m.water, c.pineLo, (x) => top(x) + 4);
  paintCanopy(g, { w: f.w, bottom: m.water - 2, r: 5, seed: 11 }, top, hillKinds(c));
};

const hillLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('kinkaku-hill', f, c, (g) => {
    paintHill(g, f, layoutOf(f), c);
    paintShore(g, f, layoutOf(f), c);
  });

// A rock: a lumpy mound lit from the upper left, snow on its crown in winter.
const paintRock = (g: Ctx, c: Colors<K>, at: readonly [number, number], size: readonly [number, number], seed: number): void => {
  const [cx, base] = at;
  const [half, h] = size;
  for (let dx = -half; dx <= half; dx++) {
    const u = dx / (half + 0.5);
    const top = base - Math.round(h * Math.sqrt(1 - u * u) * (0.75 + 0.5 * noise1(dx / 2, seed)));
    fillRect(g, dx < -half / 3 ? c.stoneLit : c.stone, cx + dx, top, 1, base - top + 1);
    fillRect(g, c.stoneLo, cx + dx, Math.max(top + 1, base - 1), 1, Math.min(2, base - top));
    fillRect(g, snowyOf(c) ? c.snow : c.stoneLit, cx + dx, top, 1, 1);
  }
};

type Isle = {
  readonly half: number;
  readonly pines: readonly (readonly [number, number])[];
  readonly rocks: readonly (readonly [number, number, number])[];
};

const ISLE_R: Isle = {
  half: 30,
  pines: [
    [-12, 28],
    [9, 22],
    [22, 15],
  ],
  rocks: [
    [-25, 5, 5],
    [27, 4, 3],
    [2, 3, 2],
  ],
};

const ISLE_L: Isle = {
  half: 17,
  pines: [[3, 22]],
  rocks: [
    [-10, 4, 5],
    [12, 5, 3],
  ],
};

// Rocks standing in the water in front of the pavilion.
const FRONT_ROCKS: readonly (readonly [number, number, number])[] = [
  [-50, 4, 4],
  [-43, 2, 2],
  [47, 3, 3],
];

// A low mossy islet with its pines and rocks.
const paintIsle = (g: Ctx, c: Colors<K>, isle: Isle, at: readonly [number, number], s: number): void => {
  const [x, base] = at;
  const half = px(isle.half, s);
  for (let dx = -half; dx <= half; dx++) {
    const top = base - Math.round(px(4, s) * (1 - (dx / half) ** 2));
    fillRect(g, c.pineLo, x + dx, top, 1, base - top + 1);
    fillRect(g, snowyOf(c) ? c.snow : c.pine, x + dx, top, 1, 1);
  }
  for (const [dx, size] of isle.pines) paintPine(g, x + Math.round(dx * s), base - 2, px(size, s), pineTones(c), dx + 40);
  for (const [dx, rh, rv] of isle.rocks) paintRock(g, c, [x + Math.round(dx * s), base], [px(rh, s), px(rv, s)], dx + 50);
};

const islesLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('kinkaku-isles', f, c, (g) => {
    const m = layoutOf(f);
    const s = scaleOf(f);
    paintIsle(g, c, ISLE_L, [m.isleL, m.water], s);
    paintIsle(g, c, ISLE_R, [m.isleR, m.water], s);
    for (const [dx, rh, rv] of FRONT_ROCKS) paintRock(g, c, [m.padX + Math.round(dx * s), m.water], [px(rh, s), px(rv, s)], dx + 60);
  });

// ---- a pine bough reaching in from the top-right corner ----

const boughLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('kinkaku-bough', f, c, (g) =>
    paintBough(g, Math.round(f.w * (f.w > f.h ? 0.26 : 0.46)), c.ink, c.woodLo, (x, y, k) =>
      needlePad(g, x, y, 5 + Math.round(rand(k, 3) * 3), pineTones(c), k),
    ),
  );

// ---- carp ----

// A carp seen from above, swimming right, its tail swishing between two frames. t tail, a body, b patches, w head.
const KOI: readonly Sprite[] = [
  ['t...ab.', '.taaabw', 't...ab.'],
  ['.t..ab.', '.taaabw', '..t.ab.'],
];
const KOI_L = KOI.map(flipped);

const koiPalettes = [
  paletteBy<K>((c) => ({ t: c.koiRed, a: c.koiLit, b: c.koiRed, w: c.koiLit })),
  paletteBy<K>((c) => ({ t: c.koi, a: c.koi, b: c.koiLit, w: c.koi })),
  paletteBy<K>((c) => ({ t: c.koiLit, a: c.koiRed, b: c.ink, w: c.koiLit })),
  paletteBy<K>((c) => ({ t: c.koi, a: c.koiLit, b: c.koi, w: c.koiLit })),
] as const;

const KOI_COUNT = 4;

// Each carp cruises its own lane of the pond, turning back at the ends; deeper lanes lie nearer the viewer.
const koiAt = (f: Frame, m: Layout, i: number): { readonly x: number; readonly y: number; readonly dir: 1 | -1 } => {
  const span = f.w - 30;
  const run = wrap(rand(i, 21) * span * 2 + f.t * (3 + rand(i, 22) * 3), span * 2);
  const dir = run < span ? 1 : -1;
  const lane = m.water + 6 + Math.round(((i + 0.5) / KOI_COUNT) * (f.h - m.water - 14));
  return { x: 12 + Math.round(dir === 1 ? run : span * 2 - run), y: lane + Math.round(Math.sin(f.t * 0.6 + i * 2) * 3), dir };
};

const carp = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  for (let i = 0; i < KOI_COUNT; i++) {
    const k = koiAt(f, m, i);
    const frames = k.dir === 1 ? KOI : KOI_L;
    const palette = (koiPalettes[i] ?? koiPalettes[0])(c);
    drawSprite(ctx, frames[Math.floor(f.beat * 2 + i) % 2] as Sprite, palette, k.x - 3, k.y - 1);
  }
};

// On every beat a carp noses up to the surface and a ring spreads out across the reflection.
const rings = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  recentBeats(f.beat, 2, (beat, age) => {
    const k = koiAt(f, m, ((beat % KOI_COUNT) + KOI_COUNT) % KOI_COUNT);
    ring(ctx, k.x + k.dir * 3, k.y, 1 + age * 5, 0.35, age < 1 ? c.waterLit : c.water);
  });
};

// ---- per-frame layers ----

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  skyBase(ctx, f, { bottom: m.water, stops: [c.sky0, c.sky1, c.sky2, c.sky3], stars: null, seed: 3 });
  driftingClouds(ctx, f, c.cloud, c.sky2, { count: 4, top: m.hillTop * 0.4, span: m.hillTop * 1.3, size: 9, speed: 1.5, seed: 7 });
  ctx.drawImage(hillLayer(f, c), 0, 0);
};

// The gold catches the light on the beat: a twinkle flares somewhere on the gilded walls and fades within two beats.
const goldGlints = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const s = scaleOf(f);
  const at = placeOf(f, m);
  const r = rowsOf(at.y + px(FOOT, s), s);
  recentBeats(f.beat, 2, (beat, age) => {
    const high = rand(beat, 31) < 0.35;
    const half = px(high ? 13 : 26, s);
    const x = at.cx - half + Math.floor(rand(beat, 32) * half * 2);
    const y = (high ? r.top : r.middle) - px(9, s) + Math.floor(rand(beat, 33) * px(5, s));
    const arm = age < 0.3 ? 2 : age < 0.8 ? 1 : 0;
    if (age < 1.4) twinkle(ctx, x, y, c.glint, arm);
  });
};

const pavilion = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  const at = placeOf(f, m);
  ctx.drawImage(pavilionImage(scaleOf(f), c), at.x, at.y);
  goldGlints(ctx, f, m, c);
  ctx.drawImage(islesLayer(f, c), 0, 0);
};

const pond = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  mirrorWater(ctx, f, { axis: m.water, bottom: f.h, squash: 1, amp: 0.8, freq: 0.7, speed: 1.2, tint: c.water, tintLevel: 0.32 });
  glints(ctx, f, m.water + 2, f.h, c.waterLit, Math.round(f.w / 20), 17);
  carp(ctx, f, m, c);
  rings(ctx, f, m, c);
};

// A maple leaf tumbling: face on, turning, edge on, back.
const LEAF: readonly Sprite[] = [['.a.', 'aba', '.a.'], ['a..', '.ab', '..a'], ['aba'], ['..a', 'ba.', 'a..']];
const leafPalettes = [paletteBy<K>((c) => ({ a: c.maple1, b: c.maple0 })), paletteBy<K>((c) => ({ a: c.maple2, b: c.maple1 }))] as const;
const swallowPalette = paletteBy<K>((c) => ({ o: c.ink }));

// Snow falls in winter, maple leaves drift down in autumn, and swallows skim the pond in early summer.
const air = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  if (snowyOf(c)) snowfall(ctx, f, c.snow, Math.round((f.w * f.h) / 500), 41);
  else if (autumnOf(c))
    flutter(
      ctx,
      f,
      LEAF,
      leafPalettes.map((p) => p(c)),
      { count: Math.round((f.w * f.h) / 2400), seed: 43, fall: 9, drift: -5, sway: 4, spin: 2.5, top: 0, bottom: f.h },
    );
  else flock(ctx, f, BIRD, swallowPalette(c), { count: 3, top: m.water - 30, span: 24, speed: 22, seed: 45 });
  const layer = boughLayer(f, c);
  ctx.save();
  ctx.translate(f.w + Math.round(Math.sin(f.t * 0.7) * 0.7), 0);
  ctx.scale(-1, 1);
  ctx.drawImage(layer, 0, 0);
  ctx.restore();
};

export const goldenPavilion = defineScene<K>({
  id: 'golden-pavilion',
  title: 'Golden Pavilion',
  mood: { valence: 0.25, energy: -0.35 },
  styles: ['showa-ballad', 'snowfall', 'starlit-dream', 'credits-roll', 'town-waltz'],
  variants: [
    {
      // Snow on every roof and pine, the gold glowing under a pale sky.
      mood: { valence: 0.1, energy: -0.55 },
      colors: {
        sky0: '#8a9ab4',
        sky1: '#a8b4c8',
        sky2: '#c4ccd8',
        sky3: '#dde2e8',
        cloud: '#eef0f4',
        hill: '#9aa6b4',
        pine: '#3e5a4e',
        pineLo: '#24382e',
        pineLit: '#5a7a68',
        maple0: '#2e443a',
        maple1: '#5a6e66',
        maple2: '#e8eef2',
        snow: '#f8fafc',
        gold: '#d8a838',
        goldLit: '#f8dc78',
        goldLo: '#9a6c1c',
        glint: '#fffbe8',
        phoenix: '#b08a3a',
        wood: '#8a6a50',
        woodLo: '#3e3028',
        white: '#e6e0d4',
        roof: '#4a3e3a',
        roofLit: '#7a6250',
        roofLo: '#2a2224',
        ink: '#1e1a1e',
        stone: '#7e8088',
        stoneLit: '#a8aab2',
        stoneLo: '#50525a',
        water: '#46566a',
        waterLit: '#d0dae6',
        koi: '#f0903a',
        koiLit: '#fff8f0',
        koiRed: '#d83a2a',
      },
    },
    {
      // A clear autumn day: the hill ablaze with maples behind the gold.
      mood: { valence: 0.35, energy: -0.25 },
      colors: {
        sky0: '#4e86d0',
        sky1: '#7aaee4',
        sky2: '#aed0ee',
        sky3: '#e4eef0',
        cloud: '#ffffff',
        hill: '#8a9aa8',
        pine: '#3a6a40',
        pineLo: '#22442c',
        pineLit: '#5a8a50',
        maple0: '#a01c1c',
        maple1: '#e04a24',
        maple2: '#f8a038',
        snow: '#4a3e3a',
        gold: '#dcac34',
        goldLit: '#fae27a',
        goldLo: '#a0701a',
        glint: '#ffffff',
        phoenix: '#b08a3a',
        wood: '#8a6448',
        woodLo: '#3e2e26',
        white: '#eee6d4',
        roof: '#4a3e3a',
        roofLit: '#8a6a52',
        roofLo: '#2a2022',
        ink: '#1e161a',
        stone: '#8a8478',
        stoneLit: '#b8b0a0',
        stoneLo: '#5a5650',
        water: '#2e4a50',
        waterLit: '#b8dce0',
        koi: '#f88a2a',
        koiLit: '#ffffff',
        koiRed: '#e0302a',
      },
    },
    {
      // Early summer: fresh green maples, a deep blue sky and swallows over the pond.
      mood: { valence: 0.5, energy: -0.05 },
      colors: {
        sky0: '#3a86e0',
        sky1: '#6aaaf0',
        sky2: '#a4cef6',
        sky3: '#e0f0f4',
        cloud: '#ffffff',
        hill: '#7aa0a8',
        pine: '#2e6a3a',
        pineLo: '#1a4428',
        pineLit: '#5a9a48',
        maple0: '#3a8a3a',
        maple1: '#6ab848',
        maple2: '#a8dc6a',
        snow: '#4a3e3a',
        gold: '#dcac34',
        goldLit: '#fae27a',
        goldLo: '#a0701a',
        glint: '#ffffff',
        phoenix: '#b08a3a',
        wood: '#8a6448',
        woodLo: '#3e2e26',
        white: '#eee6d4',
        roof: '#4a3e3a',
        roofLit: '#8a6a52',
        roofLo: '#2a2022',
        ink: '#1a1a16',
        stone: '#868478',
        stoneLit: '#b4b2a0',
        stoneLo: '#565650',
        water: '#2a5a50',
        waterLit: '#c0eae0',
        koi: '#f88a2a',
        koiLit: '#ffffff',
        koiRed: '#e0302a',
      },
    },
  ],
  layers: [sky, pavilion, pond, air],
});
