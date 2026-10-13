// Mt. Fuji with its snow cap over curving rows of tea: a white bullet train streaks along the viaduct at its foot,
// frost fans turn over the hedges, thin cloud drifts across the slopes and birds cross the sky.
import { type Ctx, fillRect } from 'mojipx';
import { bayer, ditherGradient, fillColumns, frac, noise1, pixelLine, rand, ridgeNoise, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { colorKey, driftingClouds, flock, paletteBy } from './batch-1-helpers.ts';
import { drawGlow, memoLayer, moon, tileX, wrap } from './batch-2-helpers.ts';
import { BIRD, eachCar, isDark, isWide, pixelLayer } from './batch-5-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'snow'
  | 'snowShade'
  | 'rock'
  | 'rockShade'
  | 'cloud'
  | 'cloudShade'
  | 'hill'
  | 'hillMid'
  | 'hillDark'
  | 'roof'
  | 'lamp'
  | 'concrete'
  | 'concreteShade'
  | 'train'
  | 'trainShade'
  | 'stripe'
  | 'glass'
  | 'tea0'
  | 'tea1'
  | 'tea2'
  | 'tea3';

type Layout = {
  readonly cx: number;
  readonly peak: number;
  readonly height: number;
  /** Half the mountain's width at its foot. */
  readonly reach: number;
  readonly deck: number;
  readonly field: number;
  readonly rows: number;
};

const layoutOf = (f: Frame): Layout =>
  isWide(f)
    ? {
        cx: Math.round(f.w * 0.56),
        peak: Math.round(f.h * 0.12),
        height: Math.round(f.h * 0.5),
        reach: Math.round(f.h * 1.15),
        deck: Math.round(f.h * 0.57),
        field: Math.round(f.h * 0.69),
        rows: 9,
      }
    : {
        cx: Math.round(f.w * 0.5),
        peak: Math.round(f.h * 0.2),
        height: Math.round(f.h * 0.3),
        reach: Math.round(f.h * 0.62),
        deck: Math.round(f.h * 0.58),
        field: Math.round(f.h * 0.65),
        rows: 11,
      };

// ---- the mountain ----

const altitudeAt = (m: Layout, x: number): number => {
  const flat = m.reach * 0.045;
  const u = Math.min(1, Math.max(0, (Math.abs(x - m.cx) - flat) / (m.reach - flat)));
  const crater = u === 0 && noise1(x / 2, 7) > 0.6 ? 1 : 0;
  return m.height * (1 - u) ** 1.6 + crater;
};

// The share of the height under snow, measured from the top: a ragged line with thin fingers down the gullies
// and dark ribs of rock biting up into it.
const spikes = (x: number, pitch: number, seed: number): number => {
  const j = Math.floor(x / pitch);
  let best = 0;
  for (let k = j - 1; k <= j + 1; k++) {
    const centre = (k + 0.2 + rand(k, seed) * 0.6) * pitch;
    const half = 1.2 + rand(k, seed + 1) * pitch * 0.45;
    best = Math.max(best, rand(k, seed + 2) ** 1.5 * (1 - Math.abs(x - centre) / half));
  }
  return best;
};

const snowShare = (x: number): number => 0.3 + 0.08 * noise1(x / 9, 3) + 0.2 * spikes(x, 4, 5) - 0.1 * spikes(x + 2, 6, 8);

// The sun comes from the left: the right flank is in shade past a ridge that leans outward as it descends.
const inShade = (m: Layout, x: number, a: number): boolean => {
  const ridge = m.cx - 2 + (m.height - a) * 0.16 + (noise1(a / 7, 9) - 0.5) * 6;
  return x - ridge > (bayer(x, Math.round(a)) - 0.5) * 3;
};

const slopeColor = (m: Layout, c: Colors<K>, x: number, a: number): string => {
  const shade = inShade(m, x, a);
  if (m.height - a < m.height * snowShare(x)) return shade ? c.snowShade : c.snow;
  const haze = 1 - a / (m.height * 0.42);
  if (haze > 0 && haze * 0.9 > bayer(x, Math.round(a))) return c.hill;
  const gully = noise1((x - m.cx) / (1.5 + (m.height - a) * 0.09), 13) > 0.74;
  return shade || gully ? c.rockShade : c.rock;
};

const mountainLayer = (f: Frame, m: Layout, c: Colors<K>): HTMLCanvasElement => {
  const base = m.peak + m.height;
  return pixelLayer(`fuji:${colorKey(c)}:${m.cx}`, f.w, base, (x, y) => {
    const a = base - y;
    return a <= altitudeAt(m, x) ? slopeColor(m, c, x, a) : null;
  });
};

// Wisps of cloud in a band that tiles sideways as it drifts: lens shapes lit on top, frayed at their ends.
const strata = (w: number, light: string, shade: string, seed: number): HTMLCanvasElement =>
  memoLayer(`fuji-strata:${seed}:${light}:${shade}`, w, 12, (ctx) => {
    for (let x = 0; x < w; x++) {
      const body = (ridgeNoise(x / 22, seed) - 0.52) * 18;
      if (body <= 0) continue;
      const thick = Math.max(1, Math.round(body));
      const top = 6 + Math.round((noise1(x / 30, seed + 1) - 0.5) * 5) - Math.ceil(thick / 2);
      if (body < 1.4 && bayer(x, top) > 0.5) continue;
      fillRect(ctx, light, x, top, 1, thick);
      if (thick > 2) fillRect(ctx, shade, x, top + Math.ceil(thick * 0.6), 1, Math.floor(thick * 0.4));
    }
  });

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  ctx.drawImage(ditherGradient(f.w, m.deck, [c.sky0, c.sky1, c.sky2, c.sky2]), 0, 0);
  if (!isDark(c.sky0)) return;
  // A dusk sky keeps its moon; stars come out only once the whole sky is dark.
  if (isDark(c.sky1)) stars(ctx, f.w, f.h, f.t, [c.snow, c.lamp], Math.round((f.w * m.deck) / 380), 23, (m.peak + m.height * 0.4) / f.h);
  const mx = Math.round(f.w * (isWide(f) ? 0.16 : 0.22));
  const my = Math.round(m.peak * (isWide(f) ? 1.6 : 0.6));
  drawGlow(ctx, mx, my, 16, c.sky2, 0.8);
  moon(ctx, mx, my, 6, c.snow, c.snowShade);
};

const mountain = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  const size = isWide(f) ? 13 : 11;
  driftingClouds(ctx, f, c.cloud, c.cloudShade, { count: 4, top: m.peak + size, span: m.height * 0.45, size, speed: 3, seed: 5 });
  ctx.drawImage(mountainLayer(f, m, c), 0, 0);
  tileX(ctx, strata(380, c.cloud, c.cloudShade, 7), f.t * 4 + 90, m.peak + Math.round(m.height * 0.52), f.w);
  tileX(ctx, strata(460, c.cloudShade, c.hill, 11), f.t * 6 + 200, m.peak + Math.round(m.height * 0.7), f.w);
};

// ---- the town and the foothills ----

const paintHouses = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  let x = -3;
  for (let i = 0; x < f.w; i++) {
    const hw = 7 + Math.floor(rand(i, 41) * 8);
    const hh = 5 + Math.floor(rand(i, 42) * 6);
    const top = m.field - hh;
    fillRect(ctx, c.concreteShade, x, top, hw, hh);
    fillRect(ctx, c.roof, x - 1, top - 2, hw + 2, 2);
    fillRect(ctx, c.roof, x + 1, top - 3, hw - 2, 1);
    if (rand(i, 43) < 0.7) fillRect(ctx, c.glass, x + 2 + Math.floor(rand(i, 44) * (hw - 4)), top + 2, 2, 2);
    x += hw + 1 + Math.floor(rand(i, 45) * 5);
  }
};

// Three ridges of foothills, each nearer one darker and rougher: [color, height above the deck, relief, scale, seed].
const RIDGES: readonly (readonly ['hill' | 'hillMid' | 'hillDark', number, number, number, number])[] = [
  ['hill', 1.1, 1.3, 46, 21],
  ['hillMid', 0.6, 0.9, 30, 24],
  ['hillDark', 0.1, 0.7, 18, 22],
];

const paintRidges = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const span = m.field - m.deck;
  for (const [key, lift, relief, scale, seed] of RIDGES) {
    const rough = key === 'hillDark' ? 2 : 0;
    fillColumns(
      ctx,
      f.w,
      m.field,
      c[key],
      (x) => m.deck - span * (lift + ridgeNoise(x / scale, seed) * relief) - noise1(x / 2, seed) * rough,
    );
  }
};

const PIER = 30;
const MAST = 60;

// The viaduct: piers standing in the town, a beam under the deck, and catenary masts carrying the wire.
const paintViaduct = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const legs = m.field - m.deck - 4;
  for (let x = 6; x < f.w; x += PIER) {
    fillRect(ctx, c.concrete, x, m.deck + 4, 4, legs);
    fillRect(ctx, c.concreteShade, x + 3, m.deck + 4, 1, legs);
  }
  fillRect(ctx, c.concreteShade, 0, m.deck + 4, f.w, 2);
  for (let x = 20; x < f.w; x += MAST) fillRect(ctx, c.concreteShade, x, m.deck - 20, 1, 20);
  for (let x = 17; x < f.w; x += MAST) fillRect(ctx, c.concreteShade, x, m.deck - 19, 7, 1);
  for (const y of [m.deck - 18, m.deck - 1]) fillRect(ctx, c.concreteShade, 0, y, f.w, 1);
};

const landLayer = (f: Frame, m: Layout, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`fuji-land:${colorKey(c)}`, f.w, m.field, (ctx) => {
    paintRidges(ctx, f, m, c);
    paintHouses(ctx, f, m, c);
    paintViaduct(ctx, f, m, c);
  });

const hills = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  ctx.drawImage(landLayer(f, m, c), 0, 0);
};

// ---- the train: it enters within the first second, so it is on screen for the first few seconds of every shot ----

const CARS = 8;
const CAR = 44;
const NOSE = 26;
const TRAIN_H = 11;
const TRAIN_LEN = CARS * CAR;

// The train crosses in about four seconds and comes back about every ten; it enters as the scene appears.
const trainRear = (f: Frame): number => {
  const course = f.w + TRAIN_LEN;
  return wrap((f.t * course) / 4.2 + 30, course * 2.4) - TRAIN_LEN;
};

const carBody = (ctx: Ctx, c: Colors<K>, x: number, top: number, len: number): void => {
  fillRect(ctx, c.train, x, top, len, TRAIN_H);
  fillRect(ctx, c.trainShade, x, top + TRAIN_H - 2, len, 2);
  fillRect(ctx, c.stripe, x, top + 7, len, 1);
  fillRect(ctx, c.glass, x + 2, top + 3, len - 4, 2);
  for (let k = x + 6; k < x + len - 4; k += 6) fillRect(ctx, c.train, k, top + 3, 1, 2);
  fillRect(ctx, c.trainShade, x, top, 1, TRAIN_H);
};

// A nose tapering over NOSE pixels: the roof slopes down to a rounded tip; `dir` 1 points right, -1 left.
const nose = (ctx: Ctx, c: Colors<K>, x: number, top: number, dir: number, light: boolean): void => {
  for (let k = 0; k < NOSE; k++) {
    const u = k / NOSE;
    const drop = Math.round(8 * u ** 1.7);
    const lift = Math.round(3 * u ** 4);
    const col = dir > 0 ? x + k : x - k;
    fillRect(ctx, c.train, col, top + drop, 1, TRAIN_H - drop - lift);
    fillRect(ctx, c.trainShade, col, top + TRAIN_H - 2 - lift, 1, 2);
    if (k < NOSE - 6) fillRect(ctx, c.stripe, col, top + 7, 1, 1);
    if (k >= 5 && k < 12) fillRect(ctx, c.glass, col, top + drop + 1, 1, 2);
  }
  const tip = dir > 0 ? x + NOSE - 4 : x - NOSE + 3;
  fillRect(ctx, light ? c.lamp : c.stripe, tip, top + TRAIN_H - 5, 2, 1);
};

const pantograph = (ctx: Ctx, c: Colors<K>, x: number, top: number, wire: number): void => {
  pixelLine(ctx, x, top - 1, x + 3, wire + 2, c.concreteShade);
  pixelLine(ctx, x + 3, wire + 2, x, wire + 1, c.concreteShade);
  fillRect(ctx, c.concreteShade, x - 2, wire + 1, 5, 1);
};

const train = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  const top = m.deck - TRAIN_H - 1;
  const x0 = trainRear(f);
  const night = isDark(c.sky0);
  eachCar(x0, CARS, CAR, f.w + NOSE, (x, i) => {
    const front = i === CARS - 1;
    const rear = i === 0;
    const len = CAR - 1 - (front || rear ? NOSE - 6 : 0);
    carBody(ctx, c, rear ? x + NOSE - 6 : x, top, len);
    if (rear) nose(ctx, c, x + NOSE - 6, top, -1, false);
    if (front) nose(ctx, c, x + len, top, 1, true);
    if (i === 2 || i === 5) pantograph(ctx, c, x + 20, top, m.deck - 18);
  });
  const tip = Math.round(x0 + TRAIN_LEN + 2);
  if (night && tip > -10 && tip < f.w + 30) drawGlow(ctx, tip + 6, top + TRAIN_H - 5, 10, c.lamp, f.kick > 0.5 ? 0.8 : 0.55);
  // The near parapet hides the wheels.
  fillRect(ctx, c.concrete, 0, m.deck, f.w, 4);
  fillRect(ctx, c.train, 0, m.deck, f.w, 1);
};

// ---- the tea fields ----

const rowTop = (m: Layout, h: number, k: number, x: number): number => {
  const y = m.field + (h - m.field) * (k / m.rows) ** 1.35;
  const band = ((h - m.field) / m.rows) * (0.35 + k / m.rows);
  return y + Math.sin(x * 0.017 + k * 0.22) * band * 0.75 + Math.sin(x * 0.043 + k * 0.4) * band * 0.2;
};

// One hedge row: a rounded top catching the light, darker toward its foot, then the furrow before the next row.
const teaColor = (c: Colors<K>, x: number, y: number, r: number): string => {
  if (r > 0.8) return c.tea0;
  const leaf = rand(x * 7 + y * 131, 5) < 0.14 ? 0.18 : 0;
  const v = r + leaf + (bayer(x, y) - 0.5) * 0.12;
  if (v < 0.1) return c.tea3;
  if (v < 0.36) return c.tea2;
  return v < 0.7 ? c.tea1 : c.tea0;
};

const teaPick = (m: Layout, h: number, c: Colors<K>) => {
  return (x: number, ly: number): string => {
    const y = ly + m.field;
    let k = 0;
    while (k < m.rows + 2 && rowTop(m, h, k + 1, x) <= y) k++;
    const top = rowTop(m, h, k, x);
    const next = rowTop(m, h, k + 1, x);
    return y < top ? c.tea0 : teaColor(c, x, y, (y - top) / Math.max(1, next - top));
  };
};

const fields = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  fillRect(ctx, c.tea0, 0, m.field, f.w, f.h - m.field);
  ctx.drawImage(pixelLayer(`fuji-tea:${colorKey(c)}`, f.w, f.h - m.field, teaPick(m, f.h, c)), 0, m.field);
};

// Frost fans on tall poles over the rows: a motor on an arm and a propeller turning steadily, faster with the music.
const fan = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, foot: number, i: number): void => {
  const tall = Math.round(12 + (foot - layoutOf(f).field) * 0.5);
  const big = tall > 34;
  const top = foot - tall;
  fillRect(ctx, c.concreteShade, x, top, big ? 2 : 1, tall);
  fillRect(ctx, c.concreteShade, x, top, 4, 1);
  fillRect(ctx, c.concrete, x + 3, top - 1, big ? 4 : 3, 3);
  const a = f.t * (7 + f.energy * 6) + i * 1.3;
  const r = big ? 5 : 3;
  const hx = x + (big ? 7 : 6);
  const hy = top + 1;
  pixelLine(ctx, hx - Math.cos(a) * r, hy - Math.sin(a) * r, hx + Math.cos(a) * r, hy + Math.sin(a) * r, c.concrete);
  fillRect(ctx, c.concreteShade, hx, hy, 1, 1);
};

const fans = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  for (let i = 0; i < 4; i++) {
    const k = 1 + i * Math.floor((m.rows - 1) / 4) + (i % 2);
    const x = Math.round(f.w * (0.08 + i * 0.25 + rand(i, 61) * 0.08));
    fan(ctx, f, c, x, Math.round(rowTop(m, f.h, k, x)) + 2, i);
  }
};

// ---- birds ----

const birdPalette = paletteBy<K>((c) => ({ o: c.hillDark }));

const birds = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  const lane = { count: 4, top: Math.round(m.peak * 0.4), span: Math.round(m.height * 0.35), speed: -9, seed: 71 };
  flock(ctx, f, BIRD, birdPalette(c), lane);
  if (frac(f.beat / 4) < 0.5 && isDark(c.sky0)) fillRect(ctx, c.lamp, 20 + MAST, m.deck - 21, 1, 1);
};

export const fujiBulletTrain = defineScene<K>({
  id: 'fuji-bullet-train',
  title: 'Fuji Line',
  mood: { valence: 0.5, energy: 0.3 },
  styles: ['grand-field', 'credits-roll', 'nineties-pop', 'fusion-drive', 'band-rock'],
  variants: [
    {
      mood: { valence: 0.6, energy: 0.4 },
      colors: {
        sky0: '#3a78d4',
        sky1: '#78b4ec',
        sky2: '#cfe6f6',
        snow: '#ffffff',
        snowShade: '#b4c6e4',
        rock: '#5b6fb2',
        rockShade: '#3f4d8c',
        cloud: '#ffffff',
        cloudShade: '#c6d6ee',
        hill: '#8fb4cc',
        hillMid: '#6f9a9e',
        hillDark: '#2f6a50',
        roof: '#45577a',
        lamp: '#fff3c4',
        concrete: '#e2ded6',
        concreteShade: '#8e8c88',
        train: '#fbfbf8',
        trainShade: '#b6bcc8',
        stripe: '#e0503c',
        glass: '#2a3452',
        tea0: '#1d4628',
        tea1: '#2e7638',
        tea2: '#55a643',
        tea3: '#a8dc5c',
      },
    },
    {
      mood: { valence: 0.15, energy: -0.35 },
      colors: {
        sky0: '#3a2a6c',
        sky1: '#b8577c',
        sky2: '#ffae78',
        snow: '#ffd4c4',
        snowShade: '#c4788c',
        rock: '#b4443a',
        rockShade: '#6c2a4a',
        cloud: '#ffc79c',
        cloudShade: '#c06a7c',
        hill: '#8a5278',
        hillMid: '#6a3c66',
        hillDark: '#3a2448',
        roof: '#2a1c3a',
        lamp: '#ffd27a',
        concrete: '#e0aa9c',
        concreteShade: '#7c5870',
        train: '#ffe8dc',
        trainShade: '#c08a98',
        stripe: '#cc3646',
        glass: '#3a2442',
        tea0: '#1c2628',
        tea1: '#3a5634',
        tea2: '#6c8a3c',
        tea3: '#e0b65a',
      },
    },
    {
      mood: { valence: -0.45, energy: -0.05 },
      colors: {
        sky0: '#050a1e',
        sky1: '#0f1b40',
        sky2: '#26345f',
        snow: '#cfd8f2',
        snowShade: '#7884b2',
        rock: '#202c56',
        rockShade: '#151d40',
        cloud: '#3c4a7c',
        cloudShade: '#29335e',
        hill: '#1a244c',
        hillMid: '#121a3c',
        hillDark: '#0c1430',
        roof: '#080d22',
        lamp: '#ffd36e',
        concrete: '#4c5884',
        concreteShade: '#2c345c',
        train: '#a2aed0',
        trainShade: '#5c6890',
        stripe: '#83406a',
        glass: '#ffe08a',
        tea0: '#060c18',
        tea1: '#10243a',
        tea2: '#1d3c4c',
        tea3: '#3e6e6c',
      },
    },
  ],
  layers: [sky, mountain, hills, train, fields, fans, birds],
});
