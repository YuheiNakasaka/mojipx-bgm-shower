// A railway crossing by the summer sea: a little two-car train rattles past, the crossing lights blink in turn on the
// beat, and a schoolgirl waits with her bicycle while the sea breeze lifts her hair. Gulls, tall clouds, hydrangeas.
import { type Ctx, drawSprite, fillRect, type Palette, type Sprite } from 'mojipx';
import { bayer, disc, ditherGradient, frac, noise1, pixelLine, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { clamp01, colorKey, drawGlow, driftingClouds, flock, paletteBy, wrap } from './batch-1-helpers.ts';
import { memoLayer } from './batch-2-helpers.ts';
import { BIRD, isDark, isWide, mixHex, noise2, pixelLayer } from './batch-5-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'cloud'
  | 'cloudShade'
  | 'sea0'
  | 'sea1'
  | 'sea2'
  | 'foam'
  | 'sand'
  | 'asphalt'
  | 'concrete'
  | 'leaf'
  | 'leafDark'
  | 'hydBlue'
  | 'hydPurple'
  | 'blush'
  | 'orange'
  | 'red'
  | 'lampOff'
  | 'yellow'
  | 'ink'
  | 'glass'
  | 'navy'
  | 'hair'
  | 'hairHi'
  | 'skin'
  | 'skinShade';

type Layout = {
  readonly horizon: number;
  readonly beach: number;
  readonly road: number;
  readonly bed: number;
  readonly rail: number;
  readonly ground: number;
  readonly girlX: number;
  readonly feet: number;
  readonly poleX: number;
  readonly poleBase: number;
  /** The street's left and right edges where it meets the track, and at the bottom of the screen. */
  readonly streetTop: readonly [number, number];
  readonly streetBottom: readonly [number, number];
};

const layoutOf = (f: Frame): Layout => {
  const { w, h } = f;
  if (isWide(f))
    return {
      horizon: Math.round(h * 0.42),
      beach: Math.round(h * 0.55),
      road: Math.round(h * 0.59),
      bed: Math.round(h * 0.66),
      rail: Math.round(h * 0.73),
      ground: Math.round(h * 0.76),
      girlX: Math.round(w * 0.11),
      feet: Math.round(h * 0.975),
      poleX: Math.round(w * 0.8),
      poleBase: Math.round(h * 0.87),
      streetTop: [Math.round(w * 0.5), Math.round(w * 0.76)],
      streetBottom: [Math.round(w * 0.38), Math.round(w * 0.98)],
    };
  return {
    horizon: Math.round(h * 0.45),
    beach: Math.round(h * 0.535),
    road: Math.round(h * 0.565),
    bed: Math.round(h * 0.6),
    rail: Math.round(h * 0.645),
    ground: Math.round(h * 0.66),
    girlX: Math.round(w * 0.06),
    feet: Math.round(h * 0.86),
    poleX: Math.round(w * 0.86),
    poleBase: Math.round(h * 0.77),
    streetTop: [Math.round(w * 0.52), Math.round(w * 0.8)],
    streetBottom: [Math.round(w * 0.6), Math.round(w * 1.2)],
  };
};

const dusk = (c: Colors<K>): boolean => isDark(c.sky1);

// ---- timing: the crossing warns, the arm comes down, the train passes, the arm goes up; it enters as the scene appears ----

const CYCLE = 17;
const CAR = 60;
const TRAIN_LEN = CAR * 2 + 2;

const phaseOf = (f: Frame): number => wrap(f.t + 2.2, CYCLE);
const warning = (p: number): boolean => p < 10.5;
const armDown = (p: number): number => clamp01((p - 0.4) / 1.2) * (1 - clamp01((p - 9.4) / 1.1));
const trainX = (f: Frame, p: number): number => -TRAIN_LEN + ((p - 2.4) * (f.w + TRAIN_LEN)) / 6;

// ---- the sky ----

// A puff of the thunderhead: its centre and radius.
type Puff = readonly [number, number, number];

// A summer thunderhead: a broad base of puffs and a tower narrowing upward, lit from the upper left.
const puffsOf = (w: number, h: number): readonly Puff[] => {
  const base = Array.from({ length: 6 }, (_, i): Puff => [w * (0.1 + i * 0.16), h - w * 0.1, w * (0.1 + rand(i, 5) * 0.05)]);
  const tower = Array.from(
    { length: 6 },
    (_, k): Puff => [w * (0.46 + (rand(k, 6) - 0.5) * 0.22), h * (0.72 - (k / 5) * 0.56), w * (0.21 - (k / 5) * 0.1)],
  );
  const sides = Array.from(
    { length: 5 },
    (_, k): Puff => [w * (0.22 + rand(k, 7) * 0.56), h * (0.35 + rand(k, 8) * 0.4), w * (0.08 + rand(k, 9) * 0.06)],
  );
  return [...base, ...tower, ...sides];
};

const thunderhead = (w: number, h: number, c: Colors<K>): HTMLCanvasElement => {
  const puffs = puffsOf(w, h);
  return pixelLayer(`seaside-cloud:${c.cloud}:${c.cloudShade}:${c.sky2}`, w, h, (x, y) => {
    if (y > h - 3) return null;
    let lit = Number.NEGATIVE_INFINITY;
    for (const [px, py, pr] of puffs) {
      if (Math.hypot(x - px, y - py) <= pr) lit = Math.max(lit, (-(x - px) * 0.5 - (y - py) * 0.85) / pr + 0.25);
    }
    if (lit === Number.NEGATIVE_INFINITY) return null;
    const low = (y / h) ** 3 * 0.9;
    const v = lit - low + (bayer(x, y) - 0.5) * 0.35;
    return v > 0.05 ? c.cloud : v > -0.45 ? c.cloudShade : c.sky2;
  });
};

const gullPalette = paletteBy<K>((c) => ({ o: c.foam }));

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  ctx.drawImage(ditherGradient(f.w, m.horizon, [c.sky0, c.sky1, c.sky2]), 0, 0);
  const ch = Math.round(m.horizon * (isWide(f) ? 0.82 : 0.7));
  const cloud = thunderhead(Math.round(ch * 1.35), ch, c);
  ctx.drawImage(cloud, Math.round(f.w * 0.62 - cloud.width / 2 + Math.sin(f.t * 0.05) * 4), m.horizon - ch + 2);
  const size = isWide(f) ? 9 : 11;
  driftingClouds(ctx, f, c.cloud, c.cloudShade, { count: 3, top: size + 4, span: m.horizon * 0.45, size, speed: 3, seed: 13 });
  flock(ctx, f, BIRD, gullPalette(c), {
    count: 4,
    top: Math.round(m.horizon * 0.35),
    span: Math.round(m.horizon * 0.4),
    speed: -11,
    seed: 17,
  });
};

// ---- the sea and the coast ----

const islandLayer = (f: Frame, m: Layout, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`seaside-island:${colorKey(c)}`, f.w, m.horizon + 1, (g) => {
    const haze = mixHex(c.leafDark, c.sky2, 0.55);
    const cx = f.w * 0.83;
    const half = Math.max(22, f.w * 0.1);
    g.fillStyle = haze;
    for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) {
      const u = (x - cx) / half;
      const top = Math.round(m.horizon - Math.sqrt(Math.max(0, 1 - u * u)) * 9 - noise1(x / 3, 4) * 1.5);
      g.fillRect(x, top, 1, m.horizon - top + 1);
    }
    fillRect(g, c.foam, Math.round(cx + 2), m.horizon - 15, 2, 6);
    fillRect(g, c.red, Math.round(cx + 2), m.horizon - 16, 2, 1);
  });

const sparkles = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const deep = m.beach - m.horizon;
  for (let i = 0; i < Math.round(f.w / 5); i++) {
    if (Math.sin(f.t * 3 + i * 1.7) < 0.55) continue;
    const y = m.horizon + 1 + Math.floor(rand(i, 21) ** 1.3 * (deep - 2));
    fillRect(ctx, c.foam, Math.floor(rand(i, 22) * f.w), y, y - m.horizon > deep / 2 ? 2 : 1, 1);
  }
};

// Breakers roll in toward the sand and fade as they arrive.
const breakers = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  for (let k = 0; k < 3; k++) {
    const age = frac(f.t * 0.22 + k / 3);
    const y = Math.round(m.beach - 1 - (1 - age) * 7);
    ctx.fillStyle = c.foam;
    for (let x = 0; x < f.w; x += 2) if (noise1(x / 9 + k * 7, 31) > 0.35 + age * 0.4) ctx.fillRect(x, y, 2, 1);
  }
};

const sailboat = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const x = Math.round(wrap(f.w * 0.3 + f.t * 2.5, f.w + 20) - 10);
  const y = m.horizon + 4 + Math.round(Math.sin(f.t * 1.4));
  for (let k = 0; k < 5; k++) fillRect(ctx, c.foam, x + 2, y - 6 + k, Math.ceil(k / 1.5) + 1, 1);
  fillRect(ctx, c.ink, x + 1, y - 7, 1, 7);
  fillRect(ctx, c.ink, x - 1, y, 6, 1);
};

const sea = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  ctx.drawImage(ditherGradient(f.w, m.beach - m.horizon, [c.sea0, c.sea1, c.sea2]), 0, m.horizon);
  ctx.drawImage(islandLayer(f, m, c), 0, 0);
  sparkles(ctx, f, m, c);
  sailboat(ctx, f, m, c);
  breakers(ctx, f, m, c);
};

// The beach, the sea wall and the coast road, with a car going by now and then.
const coastLayer = (f: Frame, m: Layout, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`seaside-coast:${colorKey(c)}`, f.w, m.bed - m.beach, (g) => {
    const wall = m.road - m.beach - 2;
    fillRect(g, c.sand, 0, 0, f.w, wall);
    fillRect(g, c.concrete, 0, wall, f.w, 2);
    fillRect(g, c.asphalt, 0, wall + 2, f.w, m.bed - m.road);
    for (let x = 4; x < f.w; x += 14) fillRect(g, c.foam, x, wall + 2 + Math.floor((m.bed - m.road) / 2), 7, 1);
    for (let x = 0; x < f.w; x += 2) if (bayer(x, 1) < 0.5) fillRect(g, c.cloudShade, x, Math.floor(wall / 2), 1, 1);
  });

const car = (ctx: Ctx, c: Colors<K>, x: number, y: number, body: string): void => {
  fillRect(ctx, body, x, y - 4, 13, 3);
  fillRect(ctx, body, x + 3, y - 6, 7, 2);
  fillRect(ctx, c.glass, x + 4, y - 6, 5, 1);
  fillRect(ctx, c.ink, x + 2, y - 1, 2, 1);
  fillRect(ctx, c.ink, x + 9, y - 1, 2, 1);
};

const coast = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  ctx.drawImage(coastLayer(f, m, c), 0, m.beach);
  const lane = m.bed - 1;
  car(ctx, c, Math.round(wrap(f.t * 34, f.w * 3) - 20), lane - 2, c.hydBlue);
  car(ctx, c, Math.round(f.w + 20 - wrap(f.t * 28 + f.w, f.w * 4)), lane, c.foam);
};

// ---- the railway ----

const MAST = 72;
const wireOf = (m: Layout): number => m.rail - 38;

// Ballast in two close greys, sleepers under the rails, and the road paved across where the street crosses.
const paintBed = (g: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  fillRect(g, c.concrete, 0, m.bed, f.w, m.ground - m.bed);
  const grit = mixHex(c.concrete, c.asphalt, 0.6);
  for (let y = m.bed; y < m.ground; y++)
    for (let x = (y * 3) % 4; x < f.w; x += 4) if (rand(x * 7 + y * 131, 41) < 0.6) fillRect(g, grit, x, y, 2, 1);
  const [l, r] = m.streetTop;
  for (let x = 2; x < f.w; x += 5) if (x < l || x > r) fillRect(g, c.ink, x, m.rail - 4, 2, 5);
  fillRect(g, c.asphalt, l, m.bed, r - l, m.ground - m.bed);
};

const railLayer = (f: Frame, m: Layout, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`seaside-rail:${colorKey(c)}`, f.w, m.ground, (g) => {
    paintBed(g, f, m, c);
    for (const y of [m.rail - 5, m.rail]) {
      fillRect(g, c.ink, 0, y, f.w, 1);
      fillRect(g, c.foam, 0, y - 1, f.w, 1);
    }
    for (let x = 30; x < f.w; x += MAST) {
      fillRect(g, c.concrete, x, wireOf(m) - 4, 2, m.bed - wireOf(m) + 4);
      fillRect(g, c.concrete, x - 6, wireOf(m) - 2, 10, 1);
    }
  });

// One car of the train, facing right: cream above, tangerine below, a row of windows and two doors.
const paintCar = (g: Ctx, c: Colors<K>, x: number, top: number, front: boolean): void => {
  fillRect(g, c.concrete, x + 3, top, CAR - 6, 2);
  fillRect(g, c.sand, x, top + 2, CAR, 10);
  fillRect(g, c.orange, x, top + 12, CAR, 9);
  fillRect(g, c.ink, x, top + 12, CAR, 1);
  fillRect(g, c.ink, x + 1, top + 21, CAR - 2, 2);
  for (let k = 0; k < 8; k++) fillRect(g, c.glass, x + 5 + k * 6, top + 4, 4, 5);
  for (const d of [12, 42]) {
    fillRect(g, c.ink, x + d, top + 3, 6, 18);
    fillRect(g, c.glass, x + d + 1, top + 4, 4, 5);
    fillRect(g, c.sand, x + d + 1, top + 10, 4, 1);
    fillRect(g, c.orange, x + d + 1, top + 13, 4, 7);
  }
  for (const b of [6, 44]) {
    fillRect(g, c.ink, x + b, top + 23, 11, 2);
    fillRect(g, c.concrete, x + b + 2, top + 24, 2, 1);
    fillRect(g, c.concrete, x + b + 7, top + 24, 2, 1);
  }
  g.clearRect(x, top + 2, 1, 1);
  g.clearRect(x + CAR - 1, top + 2, 1, 1);
  if (front) {
    fillRect(g, c.glass, x + CAR - 7, top + 4, 6, 6);
    fillRect(g, c.foam, x + CAR - 3, top + 16, 2, 2);
    fillRect(g, c.ink, x + CAR - 1, top + 3, 1, 18);
  }
};

// The pantograph reaches up to the wire, which runs PANTO pixels above the roof.
const PANTO = 12;

const trainImage = (c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`seaside-train:${colorKey(c)}`, TRAIN_LEN, 25 + PANTO, (g) => {
    paintCar(g, c, 0, PANTO, false);
    paintCar(g, c, CAR + 2, PANTO, true);
    fillRect(g, c.ink, CAR, PANTO + 6, 2, 12);
    for (const px of [24, CAR + 26]) {
      pixelLine(g, px, PANTO, px + 5, 2, c.ink);
      pixelLine(g, px + 5, 2, px + 10, PANTO, c.ink);
      fillRect(g, c.ink, px + 2, 1, 7, 1);
    }
  });

const train = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  ctx.drawImage(railLayer(f, m, c), 0, 0);
  const x = Math.round(trainX(f, phaseOf(f)));
  const img = trainImage(c);
  if (x < f.w && x + img.width > 0) {
    ctx.drawImage(img, x, m.rail - img.height + 1);
    if (dusk(c)) drawGlow(ctx, c.foam, x + TRAIN_LEN + 2, m.rail - 7, 9, 5, 0.5);
  }
  fillRect(ctx, c.ink, 0, wireOf(m), f.w, 1);
};

// ---- the street, the hydrangeas and the crossing signal ----

const edgeAt = (m: Layout, h: number, y: number, side: 0 | 1): number => {
  const u = (y - m.ground) / (h - m.ground);
  return m.streetTop[side] + (m.streetBottom[side] - m.streetTop[side]) * u;
};

const streetPick = (f: Frame, m: Layout, c: Colors<K>) => {
  const paving = mixHex(c.sand, c.concrete, 0.4);
  return (x: number, y: number): string => {
    const gy = y + m.ground;
    const l = edgeAt(m, f.h, gy, 0);
    const r = edgeAt(m, f.h, gy, 1);
    if (x >= l && x <= r) return Math.abs(x - l) < 1.5 || Math.abs(x - r) < 1.5 ? c.foam : c.asphalt;
    if (Math.abs(x - l) < 3.5 || Math.abs(x - r) < 3.5) return c.concrete;
    return rand(x * 17 + gy * 3, 51) < 0.08 ? c.sand : paving;
  };
};

type Bush = { readonly x: number; readonly y: number; readonly rx: number; readonly ry: number; readonly seed: number };

const bushesOf = (f: Frame, m: Layout): readonly Bush[] => {
  const s = Math.min(f.w, f.h);
  const near = { x: 0, y: f.h - s * 0.06, rx: s * 0.2, ry: s * 0.16, seed: 1 };
  const far = { x: m.poleX + s * 0.1, y: m.poleBase + s * 0.04, rx: s * 0.16, ry: s * 0.1, seed: 2 };
  const fence = { x: m.streetTop[0] - s * 0.18, y: m.ground + s * 0.05, rx: s * 0.2, ry: s * 0.06, seed: 3 };
  const corner = { x: f.w + s * 0.02, y: f.h - s * 0.02, rx: s * 0.14, ry: s * 0.12, seed: 4 };
  const front = { x: s * 0.3, y: f.h + s * 0.04, rx: s * 0.45, ry: s * 0.2, seed: 6 };
  return isWide(f) ? [fence, far, near, corner] : [fence, far, front, corner, { ...fence, x: s * 0.05, y: m.ground + s * 0.2, seed: 5 }];
};

// Inside a bush: round heads of florets over the leaves, each lit on its upper left.
const bloomAt = (b: Bush, c: Colors<K>, x: number, y: number): string | null => {
  const colors = [c.hydBlue, c.hydPurple, c.blush];
  for (let k = 0; k < 9; k++) {
    const bx = b.x + (rand(k, b.seed) - 0.5) * b.rx * 1.6;
    const by = b.y - b.ry * (0.15 + rand(k, b.seed + 1) * 0.65);
    const r = 3 + rand(k, b.seed + 2) * 3;
    const d = Math.hypot(x - bx, y - by);
    if (d > r) continue;
    const tone = colors[(k + b.seed) % 3] as string;
    if (x - bx + (y - by) < -r * 0.6 && bayer(x, y) < 0.5) return c.foam;
    return rand(x * 5 + y * 11, k) < 0.25 ? (colors[(k + b.seed + 1) % 3] as string) : tone;
  }
  return null;
};

const bushPick = (bushes: readonly Bush[], c: Colors<K>) => {
  return (x: number, y: number): string | null => {
    for (const b of bushes) {
      const d = Math.hypot((x - b.x) / b.rx, (y - b.y) / b.ry);
      const edge = 1 + (noise2(x / 3, y / 3, b.seed) - 0.5) * 0.35;
      if (d > edge) continue;
      const bloom = bloomAt(b, c, x, y);
      if (bloom) return bloom;
      return noise2(x / 2.5, y / 2.5, b.seed + 9) > 0.5 ? c.leaf : c.leafDark;
    }
    return null;
  };
};

const street = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  ctx.drawImage(pixelLayer(`seaside-street:${colorKey(c)}`, f.w, f.h - m.ground, streetPick(f, m, c)), 0, m.ground);
  ctx.drawImage(pixelLayer(`seaside-bushes:${colorKey(c)}`, f.w, f.h, bushPick(bushesOf(f, m), c)), 0, 0);
};

// The crossbuck, two lamps that take turns on the beat while the crossing warns, and the striped arm.
const lamps = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, y: number): void => {
  const on = warning(phaseOf(f));
  const left = Math.floor(f.beat) % 2 === 0;
  fillRect(ctx, c.ink, x - 7, y - 1, 15, 2);
  for (const side of [-1, 1]) {
    const lit = on && left === side < 0;
    const lx = x + side * 7;
    if (lit) drawGlow(ctx, c.red, lx, y, 10, 9, f.kick > 0.5 ? 0.55 : 0.4);
    disc(ctx, lx, y, 4, () => c.ink);
    disc(ctx, lx, y, 2, () => (lit ? c.red : c.lampOff));
    if (lit) fillRect(ctx, c.foam, lx - 1, y - 1, 1, 1);
  }
};

const crossbuck = (ctx: Ctx, c: Colors<K>, x: number, y: number): void => {
  for (let k = -7; k <= 7; k++) {
    const color = Math.floor((k + 7) / 3) % 2 === 0 ? c.yellow : c.ink;
    fillRect(ctx, color, x + k, y + Math.round(k * 0.6), 2, 2);
    fillRect(ctx, color, x + k, y - Math.round(k * 0.6), 2, 2);
  }
};

const arm = (ctx: Ctx, c: Colors<K>, x: number, y: number, down: number, reach: number): void => {
  const a = (down * Math.PI) / 2;
  for (let k = 0; k < reach; k += 2) {
    const color = Math.floor(k / 6) % 2 === 0 ? c.yellow : c.ink;
    fillRect(ctx, color, Math.round(x - Math.sin(a) * k), Math.round(y - Math.cos(a) * k), 2, 2);
  }
};

const signal = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  const x = m.poleX;
  const top = m.poleBase - 56;
  fillRect(ctx, c.concrete, x, top, 2, 56);
  for (let y = m.poleBase - 12; y < m.poleBase; y += 4) fillRect(ctx, c.ink, x, y, 2, 2);
  crossbuck(ctx, c, x + 1, top + 4);
  lamps(ctx, f, c, x + 1, top + 16);
  fillRect(ctx, c.ink, x - 3, m.poleBase - 16, 7, 8);
  fillRect(ctx, c.yellow, x - 2, m.poleBase - 15, 5, 2);
  arm(ctx, c, x - 2, m.poleBase - 13, armDown(phaseOf(f)), Math.round(x - m.streetTop[0] + 4));
};

// ---- the girl and her bicycle ----

// The girl, 50 rows tall: o outline, h hair, H gloss, k hair shade, s skin, S shade, E eye light, i iris, e eye,
// I light iris, b blush, m mouth, w blouse, W its shade, n navy collar and skirt, N pleats, l collar stripe, r scarf, R its shade, f loafers.
const HEAD: Sprite = [
  '.............oooooooo...........',
  '...........ohhhhhhhhhko.........',
  '..........ohhHHHhhhhhhko........',
  '.........ohHHHHhhhhHHHhko.......',
  '........ohhhhhhhhhHHhhhhko......',
  '........ohhhhhhhhhhhhhhhko......',
  '.......ohhhhhhhhhhhhhhhhhko.....',
  '.......ohhhhhhhhhhhhhhhhhko.....',
  '.......ohhhhshhhsshhhshhhko.....',
  '.......ohhssshhsssshhssshko.....',
  '.......ohhsoooossssooooshko.....',
  '.......ohhssEiessssEiesshko.....',
  '.......ohhssiiessssiiesshko.....',
  '.......ohhssIIissssIIisshko.....',
  '.......ohhsbbssssssssbbshko.....',
  '.......ohhssssssmmsssssshko.....',
  '.......ohhossssssssssssohko.....',
  '.......ohhhoossssssssoohhko.....',
  '.......ohhhhhooSSSSoohhhhko.....',
  '.......ohho...osssso...ohko.....',
];
const HEAD_BLINK: Sprite = [
  '.............oooooooo...........',
  '...........ohhhhhhhhhko.........',
  '..........ohhHHHhhhhhhko........',
  '.........ohHHHHhhhhHHHhko.......',
  '........ohhhhhhhhhHHhhhhko......',
  '........ohhhhhhhhhhhhhhhko......',
  '.......ohhhhhhhhhhhhhhhhhko.....',
  '.......ohhhhhhhhhhhhhhhhhko.....',
  '.......ohhhhshhhsshhhshhhko.....',
  '.......ohhssshhsssshhssshko.....',
  '.......ohhsoooossssooooshko.....',
  '.......ohhsssssssssssssshko.....',
  '.......ohhssooossssooosshko.....',
  '.......ohhsssssssssssssshko.....',
  '.......ohhsbbssssssssbbshko.....',
  '.......ohhssssssmmsssssshko.....',
  '.......ohhossssssssssssohko.....',
  '.......ohhhoossssssssoohhko.....',
  '.......ohhhhhooSSSSoohhhhko.....',
  '.......ohho...osssso...ohko.....',
];
const BODY: Sprite = [
  '.........onnnnlSSSSlnnnno.......',
  '........ownnnnnlsslnnnnnwo......',
  '.......owwnnnnnrrrrnnnnnwwo.....',
  '......owwwnnnnrRrrRrnnnnwwwo....',
  '......owwwwwwwwrRRrwwwwwWwwo....',
  '.....osowwwwwwwwrrwwwwwwWwoso...',
  '.....osowwwwwwwwrrwwwwwwWwoso...',
  '.....osowwwwwwwwwwwwwwwwWwoso...',
  '.....osoWWWWWWWWWWWWWWWWWWoso...',
  '.....osoonnnnnnnnnnnnnnnnooso...',
  '.....osoonnNnnNnnnnNnnNnnooso...',
  '.....oSoonnNnnNnnnnNnnNnnooSo...',
  '......o.onnNnnNnnnnNnnNnno.o....',
  '.......onnNnnNnnnnnnNnnNnno.....',
  '......onnnNnnNnnnnnnNnnNnnno....',
  '......onnnNnnNnnnnnnNnnNnnno....',
  '......oooooooooooooooooooooo....',
  '............oSo....oSo..........',
  '............oso....oso..........',
  '............oso....oso..........',
  '............oso....oso..........',
  '............oso....oso..........',
  '............oso....oso..........',
  '............owo....owo..........',
  '............owo....owo..........',
  '............owo....owo..........',
  '............owo....owo..........',
  '...........offo....offo.........',
  '..........offfo....offfo........',
  '..........ooooo....ooooo........',
];

const girlPalette = paletteBy<K>(
  (c): Palette => ({
    o: c.ink,
    h: c.hair,
    H: c.hairHi,
    k: mixHex(c.hair, c.ink, 0.45),
    s: c.skin,
    S: c.skinShade,
    E: c.foam,
    i: c.hydPurple,
    I: mixHex(c.hydPurple, c.foam, 0.45),
    e: c.ink,
    b: c.blush,
    m: mixHex(c.skinShade, c.red, 0.45),
    w: c.foam,
    W: c.cloudShade,
    n: c.navy,
    N: mixHex(c.navy, c.ink, 0.5),
    l: c.foam,
    r: c.red,
    R: c.lampOff,
    f: mixHex(c.orange, c.ink, 0.7),
  }),
);

// Long hair behind her, lifted by the breeze: the lower a strand, the further it reaches and the more it swings.
const backHair = (ctx: Ctx, f: Frame, c: Colors<K>, x0: number, y0: number): void => {
  for (let r = 6; r <= 31; r++) {
    const u = (r - 6) / 25;
    const swing = (Math.sin(f.t * 2.6 - r * 0.33) + 1) * u * 2.4;
    const left = Math.round(x0 + 7 - u * 5 - swing);
    const inner = x0 + 10 - Math.max(0, r - 26) * 2;
    if (inner > left + 1) {
      fillRect(ctx, c.ink, left, y0 + r, 1, 1);
      fillRect(ctx, c.hair, left + 1, y0 + r, inner - left - 1, 1);
      if (r % 5 === 2) fillRect(ctx, c.hairHi, left + 2, y0 + r, 2, 1);
    }
    const outer = Math.round(x0 + 26 + u * 1.5 - swing * 0.3) - Math.max(0, r - 27);
    if (outer > x0 + 24) {
      fillRect(ctx, c.hair, x0 + 24, y0 + r, outer - x0 - 24, 1);
      fillRect(ctx, c.ink, outer, y0 + r, 1, 1);
    }
  }
  const tip = Math.sin(f.t * 2.6 - 9) * 2;
  pixelLine(ctx, x0 + 3, y0 + 26, x0 - 2 + tip, y0 + 30 - tip * 0.5, c.hair);
};

const ring = (g: Ctx, cx: number, cy: number, r: number, color: string): void => {
  for (let k = 0; k < 48; k++) {
    const a = (k / 48) * Math.PI * 2;
    fillRect(g, color, Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1);
  }
};

// A town bicycle with a step-through frame and a front basket, facing right.
const bikeImage = (c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`seaside-bike:${colorKey(c)}`, 40, 26, (g) => {
    for (const cx of [9, 31]) {
      ring(g, cx, 17, 8, c.ink);
      ring(g, cx, 17, 7, c.ink);
      ring(g, cx, 17, 5, c.concrete);
      for (let k = 0; k < 6; k++) pixelLine(g, cx, 17, cx + Math.cos(k) * 5, 17 + Math.sin(k) * 5, c.concrete);
    }
    const frame = (x0: number, y0: number, x1: number, y1: number): void => pixelLine(g, x0, y0, x1, y1, c.hydBlue);
    frame(9, 17, 17, 18);
    frame(17, 18, 13, 6);
    frame(9, 17, 13, 7);
    frame(17, 18, 22, 14);
    frame(22, 14, 27, 8);
    frame(27, 6, 31, 17);
    frame(28, 6, 26, 2);
    fillRect(g, c.ink, 22, 2, 5, 1);
    fillRect(g, c.ink, 10, 5, 6, 2);
    fillRect(g, c.hydBlue, 12, 18, 7, 2);
    fillRect(g, c.concrete, 29, 3, 8, 6);
    for (let x = 30; x < 37; x += 2) fillRect(g, c.cloudShade, x, 4, 1, 4);
    fillRect(g, c.ink, 29, 3, 8, 1);
  });

const girl = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  const x0 = m.girlX;
  const y0 = m.feet - 50;
  ctx.drawImage(bikeImage(c), x0 + 15, m.feet - 26);
  backHair(ctx, f, c, x0, y0);
  const palette = girlPalette(c);
  drawSprite(ctx, BODY, palette, x0, y0 + 20);
  // The breeze tugs at the hem of her skirt.
  if (Math.sin(f.t * 2.6 - 11) > 0.2) fillRect(ctx, c.navy, x0 + 5, y0 + 35, 1, 1);
  const blink = frac(f.t / 3.7) < 0.045;
  drawSprite(ctx, blink ? HEAD_BLINK : HEAD, palette, x0, y0);
};

export const seasideRailway = defineScene<K>({
  id: 'seaside-railway',
  title: 'Seaside Crossing',
  mood: { valence: 0.4, energy: -0.1 },
  styles: ['nineties-pop', 'summer-festival', 'town-waltz', 'band-rock', 'city-groove'],
  variants: [
    {
      mood: { valence: 0.55, energy: 0 },
      colors: {
        sky0: '#2a78dc',
        sky1: '#62aef2',
        sky2: '#bfe6fa',
        cloud: '#ffffff',
        cloudShade: '#c4d6f0',
        sea0: '#1d5aa8',
        sea1: '#2a8acc',
        sea2: '#5cc6dc',
        foam: '#ffffff',
        sand: '#ecdcb2',
        asphalt: '#6c7180',
        concrete: '#a8adb8',
        leaf: '#4f9a40',
        leafDark: '#2a5e30',
        hydBlue: '#6488ea',
        hydPurple: '#9a6ad6',
        blush: '#f49ab4',
        orange: '#f0843a',
        red: '#f2363a',
        lampOff: '#6a1e26',
        yellow: '#ffd23a',
        ink: '#1e2030',
        glass: '#2c3c5c',
        navy: '#283c70',
        hair: '#3c2a40',
        hairHi: '#7c5c86',
        skin: '#ffe2cc',
        skinShade: '#f0b49e',
      },
    },
    {
      mood: { valence: 0.05, energy: -0.45 },
      colors: {
        sky0: '#4a3a86',
        sky1: '#d8708a',
        sky2: '#ffc28a',
        cloud: '#ffd6a8',
        cloudShade: '#d0809a',
        sea0: '#5a4a8a',
        sea1: '#c87894',
        sea2: '#f4b08c',
        foam: '#fff2dc',
        sand: '#e8b894',
        asphalt: '#5a4c64',
        concrete: '#a08896',
        leaf: '#5a7a3c',
        leafDark: '#33442c',
        hydBlue: '#6a76d0',
        hydPurple: '#a060b8',
        blush: '#ff8aa0',
        orange: '#f07a34',
        red: '#ff3a36',
        lampOff: '#6a2230',
        yellow: '#ffc83a',
        ink: '#24182a',
        glass: '#ffd890',
        navy: '#2c2c5c',
        hair: '#3a2232',
        hairHi: '#a8607a',
        skin: '#ffd2b8',
        skinShade: '#e89884',
      },
    },
    {
      mood: { valence: -0.45, energy: -0.2 },
      colors: {
        sky0: '#0c1438',
        sky1: '#1e2c64',
        sky2: '#5a5c96',
        cloud: '#8a8cc0',
        cloudShade: '#4a4e88',
        sea0: '#0e1840',
        sea1: '#1c2c5e',
        sea2: '#34487c',
        foam: '#dfe6ff',
        sand: '#5c5a7c',
        asphalt: '#2c2e46',
        concrete: '#6a6c8c',
        leaf: '#2c4a48',
        leafDark: '#16262e',
        hydBlue: '#5a6ad8',
        hydPurple: '#8458c4',
        blush: '#e07a9c',
        orange: '#c8642e',
        red: '#ff3030',
        lampOff: '#4a1620',
        yellow: '#e8b832',
        ink: '#0c0c1a',
        glass: '#ffe08a',
        navy: '#1e2650',
        hair: '#24182c',
        hairHi: '#5c4a7c',
        skin: '#e8c4b8',
        skinShade: '#b08490',
      },
    },
  ],
  layers: [sky, sea, coast, train, street, signal, girl],
});
