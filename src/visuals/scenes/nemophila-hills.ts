// The seaside park's hill in spring: a rolling hill carpeted in tiny blue nemophila, deep blue at the crest and paler
// toward us, a path winding up to a lone tree on top, the sea beyond and a Ferris wheel far away on the shore. Gusts roll
// across the flowers in waves on the beat, kites tug at their strings, butterflies flutter and visitors stroll up and
// down. At sunset the wheel lights up; in autumn the same hill is covered in round red kochia and red dragonflies dart.
import { type Ctx, drawSprite, fillRect, type Sprite } from 'mojipx';
import { bayer, disc, ditherGradient, frac, hexToRgb, memoLayer, noise1, pixelLine, rand, ridgeNoise } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { colorKey, drawGlow, driftingClouds, paletteBy, wrap } from './batch-1-helpers.ts';
import { surge } from './batch-3-helpers.ts';
import { pixelLayer } from './batch-5-helpers.ts';
import { frameLayer, glints, ring } from './batch-6-helpers.ts';
import { type Plan, planOf, puff, skyBase } from './batch-9-helpers.ts';
import { outlined, spriteOf } from './batch-12-helpers.ts';
import { drawVisitor, type Visitor } from './batch-18-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sky3'
  | 'sun'
  | 'cloud'
  | 'cloudLo'
  | 'sea'
  | 'seaLo'
  | 'seaLit'
  | 'far'
  | 'farLo'
  | 'hill0'
  | 'hill1'
  | 'hill2'
  | 'hill3'
  | 'bloom'
  | 'heart'
  | 'leaf'
  | 'leafLo'
  | 'path'
  | 'pathLo'
  | 'tree'
  | 'treeLo'
  | 'treeLit'
  | 'bark'
  | 'wheel'
  | 'wheelLit'
  | 'car0'
  | 'car1'
  | 'car2'
  | 'kite0'
  | 'kite1'
  | 'kite2'
  | 'wing'
  | 'body'
  | 'coat0'
  | 'coat1'
  | 'coat2'
  | 'hair'
  | 'skin'
  | 'ink';

// ---- layout ----

type Spot =
  | 'horizon'
  | 'cx'
  | 'top'
  | 'base'
  | 'spread'
  | 'landEdge'
  | 'wheelX'
  | 'wheelR'
  | 'pathX'
  | 'pathAmp'
  | 'pathHalf'
  | 'treeX'
  | 'sunX'
  | 'front';
type Layout = Readonly<Record<Spot, number>>;

const WIDE: Plan<Spot> = {
  horizon: ['h', 0.4],
  cx: ['w', 0.56],
  top: ['h', 0.28],
  base: ['h', 0.56],
  spread: ['w', 0.26],
  landEdge: ['w', 0.42],
  wheelX: ['w', 0.13],
  wheelR: ['h', 0.065],
  pathX: ['w', 0.4],
  pathAmp: ['w', 0.07],
  pathHalf: ['w', 0.032],
  treeX: ['w', 0.585],
  sunX: ['w', 0.84],
  front: ['h', 0.9],
};

const TALL: Plan<Spot> = {
  horizon: ['h', 0.33],
  cx: ['w', 0.5],
  top: ['h', 0.3],
  base: ['h', 0.45],
  spread: ['w', 0.36],
  landEdge: ['w', 0.36],
  wheelX: ['w', 0.14],
  wheelR: ['h', 0.022],
  pathX: ['w', 0.36],
  pathAmp: ['w', 0.16],
  pathHalf: ['w', 0.075],
  treeX: ['w', 0.54],
  sunX: ['w', 0.78],
  front: ['h', 0.93],
};

const layoutOf = (f: Frame): Layout => planOf(f, WIDE, TALL);

// The colors tell the season and the hour: the hill turns red in autumn, and the wheel's lights burn only at dusk.
const autumnOf = (c: Colors<K>): boolean => {
  const [r, , b] = hexToRgb(c.hill1);
  return r > b;
};
const duskOf = (c: Colors<K>): boolean => c.wheelLit !== c.wheel;

// ---- the hill and its path ----

/** The hill's skyline: a broad dome over the crest whose shoulders sink below the horizon, fuzzy with flowers. */
const lineAt = (m: Layout, x: number): number =>
  m.top + (m.base - m.top) * (1 - Math.exp(-(((x - m.cx) / m.spread) ** 2))) + (noise1(x / 4, 3) - 0.5) * 1.5;

/** How near a row is, from 0 at the crest to 1 at the bottom of the frame. */
const depthOf = (f: Frame, m: Layout, y: number): number => Math.max(0, (y - m.top) / (f.h - m.top));

// The path winds up from the bottom to the crest, narrowing with distance.
const pathAt = (f: Frame, m: Layout, y: number): number => {
  const u = depthOf(f, m, y);
  return m.cx - 3 + (m.pathX - m.cx + 3) * u + Math.sin(u * Math.PI * 2.4) * m.pathAmp * u ** 0.7;
};
const pathHalfAt = (f: Frame, m: Layout, y: number): number => 0.6 + depthOf(f, m, y) ** 1.25 * m.pathHalf;
const onPath = (f: Frame, m: Layout, x: number, y: number, margin: number): boolean =>
  Math.abs(x - pathAt(f, m, y)) <= pathHalfAt(f, m, y) + margin;

const HILL_TONES = ['hill0', 'hill1', 'hill2', 'hill3'] as const;

// The carpet: deep blue at the crest and paler row by row toward us, rows of plants following the hill's curve, the
// flank that faces the light brighter and the other darker, most strongly near the skyline. The light comes from the
// left by day and from the sun setting on the right at dusk (`side` -1).
const flankLight = (m: Layout, x: number, below: number, side: number): number => {
  const slope = Math.max(-1, Math.min(1, (lineAt(m, x + 2) - lineAt(m, x - 2)) / 3));
  return -side * (slope * Math.exp(-below / 30) * 0.9 + ((x - m.cx) / m.spread) * 0.35 * Math.exp(-below / 70));
};

const bloomTone = (f: Frame, m: Layout, x: number, y: number, line: number, side: number): number => {
  const below = y - line;
  const lit = flankLight(m, x, below, side);
  const row = frac(below ** 0.75 / 2.4) < 0.25 ? -0.5 : 0;
  return 0.9 + depthOf(f, m, y) * 1.7 + lit + row + (bayer(x, y) - 0.5) * 0.9;
};

// Pale flower faces with white hearts are sprinkled over it, thicker toward us.
const springPixel = (f: Frame, m: Layout, c: Colors<K>, x: number, y: number, line: number): string => {
  const r = rand(x * 31 + y * 7, 5);
  const depth = depthOf(f, m, y);
  if (r < 0.004 + depth * 0.05) return c.heart;
  if (r < 0.03 + depth * 0.2) return c.bloom;
  const t = Math.max(0, Math.min(3, Math.round(bloomTone(f, m, x, y, line, duskOf(c) ? -1 : 1))));
  return c[HILL_TONES[t] as K];
};

const pathPixel = (c: Colors<K>, dx: number, half: number, r: number): string | null => {
  if (dx > half - 0.6) return r < 0.5 ? c.pathLo : null;
  return r < 0.1 ? c.pathLo : r > 0.95 ? c.heart : c.path;
};

// The path's pixel at (x, y), or null off it.
const pathColor = (f: Frame, m: Layout, c: Colors<K>, x: number, y: number): string | null => {
  const half = pathHalfAt(f, m, y);
  const dx = Math.abs(x - pathAt(f, m, y));
  return dx <= half + 0.5 ? pathPixel(c, dx, half, rand(x * 17 + y, 9)) : null;
};

// Under the skyline: the path, else the bare soil the kochia will cover in autumn, else the flowers.
const hillPick =
  (f: Frame, m: Layout, c: Colors<K>, autumn: boolean) =>
  (x: number, y: number): string | null => {
    const line = lineAt(m, x);
    if (y < line) return y >= line - 1 && bayer(x, y) < 0.5 ? c.hill1 : null;
    const soil = autumn ? (bayer(x, y) < 0.3 ? c.hill1 : c.hill0) : null;
    return pathColor(f, m, c, x, y) ?? soil ?? springPixel(f, m, c, x, y, line);
  };

// A bush on the sunlit flank glows; one on the far flank sinks into shade.
const kochiaTones = (c: Colors<K>, lit: number): readonly [string, string, string] => {
  if (lit > 0.3) return [c.hill1, c.hill2, c.hill3];
  return lit < -0.3 ? [c.hill0, c.hill0, c.hill1] : [c.hill0, c.hill1, c.hill2];
};

// In autumn the hill is covered in round kochia bushes, row after row following its curve, bigger toward us.
const paintKochia = (g: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const big = f.w > f.h ? 6 : 8;
  for (let o = 1, row = 0; o < f.h; row++) {
    const r = Math.max(1, Math.round(1 + (o / (f.h - m.top)) * big));
    for (let x = -r + (row % 2) * r; x < f.w + r; x += r * 2 + 1) {
      const jx = x + Math.round((rand(row, x + 99) - 0.5) * r);
      const y = Math.round(lineAt(m, jx) + o);
      if (y - r > f.h || onPath(f, m, jx, y, r * 0.6)) continue;
      puff(g, jx, y, r, kochiaTones(c, flankLight(m, jx, o, 1) + (rand(jx, row + 3) - 0.5) * 0.8));
    }
    o += Math.max(2, Math.round(r * 1.5));
  }
};

// ---- the lone tree on the crest ----

type V = readonly [number, number];

const crownSize = (f: Frame): V => (f.w > f.h ? [11, 9] : [13, 10]);
const trunkOf = (f: Frame, m: Layout): V => [Math.round(lineAt(m, m.treeX)) + 1, Math.round(crownSize(f)[1] * 1.2)];

const paintTrunk = (g: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const [base, h] = trunkOf(f, m);
  fillRect(g, c.ink, m.treeX - 2, base - h, 4, h);
  fillRect(g, c.bark, m.treeX - 1, base - h, 2, h);
};

// Puffs of leaves as (x, y, radius) in shares of the crown: the edges first, the sunlit middle last.
const CROWN: readonly (readonly [number, number, number])[] = [
  [-0.55, 0.25, 0.55],
  [0.55, 0.3, 0.55],
  [0, 0.35, 0.6],
  [-0.3, -0.25, 0.6],
  [0.35, -0.2, 0.6],
  [0, -0.05, 0.7],
];

const crownLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement => {
  const [rx, ry] = crownSize(f);
  return memoLayer(`nemo-crown:${rx}:${colorKey(c)}`, rx * 2 + 4, ry * 2 + 4, (g) => {
    for (const [dx, dy, r] of CROWN)
      puff(g, rx + 2 + Math.round(dx * rx), ry + 2 + Math.round(dy * ry), Math.round(r * ry), [c.treeLo, c.tree, c.treeLit]);
  });
};

const hillLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('nemo-hill', f, c, (g) => {
    const m = layoutOf(f);
    const autumn = autumnOf(c);
    g.drawImage(pixelLayer(`nemo-hill:${colorKey(c)}`, f.w, f.h, hillPick(f, m, c, autumn)), 0, 0);
    if (autumn) paintKochia(g, f, m, c);
    paintTrunk(g, f, m, c);
  });

// ---- gusts: patches of flowers bent pale by the wind, rolling across the hill on the beat ----

const BAND = 0.07;

// The flowers a gust turns over: thick at its front, thinning out behind it.
const gustLayer = (f: Frame, c: Colors<K>, dense: boolean): HTMLCanvasElement => {
  const m = layoutOf(f);
  return pixelLayer(`nemo-gust-${dense}:${colorKey(c)}`, f.w, f.h, (x, y) => {
    if (y < lineAt(m, x) + 1 || onPath(f, m, x, y, 0)) return null;
    const r = rand(x * 13 + y * 17, dense ? 7 : 8);
    const pale = autumnOf(c) ? c.hill2 : c.hill3;
    if (!dense) return r < 0.18 ? pale : null;
    return r < 0.4 ? pale : r < 0.52 ? c.bloom : null;
  });
};

// Where gust k's front is on row y: a ragged line that surges forward on each beat and crosses the screen in a bar.
const frontAt = (f: Frame, m: Layout, k: number, y: number): number => {
  const band = f.w * BAND;
  const p = frac(surge(f.beat) / 4 + k / 2);
  return -band * 2 + p * (f.w + band * 4) - (y - m.top) * 0.2 + (noise1(y / 16 + k * 7, 4) - 0.5) * band * 2.5;
};

const gustAt = (f: Frame, m: Layout, x: number, y: number): boolean =>
  [0, 1].some((k) => {
    const d = frontAt(f, m, k, y) - x;
    return d >= 0 && d < f.w * BAND;
  });

const strip = (ctx: Ctx, src: HTMLCanvasElement, x0: number, x1: number, y: number, h: number): void => {
  const a = Math.max(0, Math.round(x0));
  const b = Math.min(src.width, Math.round(x1));
  const rows = Math.min(h, src.height - y);
  if (b > a && rows > 0) ctx.drawImage(src, a, y, b - a, rows, a, y, b - a, rows);
};

// Each gust leaves gaps here and there, reshuffled on every beat, so it reads as wind in patches.
const gusts = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const dense = gustLayer(f, c, true);
  const sparse = gustLayer(f, c, false);
  const band = f.w * BAND;
  const beat = Math.floor(f.beat);
  for (let k = 0; k < 2; k++)
    for (let y = m.top - 2; y < f.h; y += 3) {
      if (rand(Math.floor(y / 9), k * 31 + beat) < 0.2) continue;
      const x = frontAt(f, m, k, y);
      strip(ctx, dense, x - band * 0.45, x, y, 3);
      strip(ctx, sparse, x - band * 1.4, x - band * 0.45, y, 3);
    }
};

// ---- the sea, the far shore and the Ferris wheel ----

const landAt = (m: Layout, x: number): number =>
  x > m.landEdge ? m.base + 20 : m.horizon - 1 - ridgeNoise(x / 5, 9) * 3 + Math.max(0, (x - m.landEdge + 24) / 24) * 4;

const wheelY = (m: Layout): number => m.horizon - m.wheelR - 4;

const paintStand = (g: Ctx, m: Layout, c: Colors<K>): void => {
  const cy = wheelY(m);
  const foot = m.horizon + 1;
  const spread = Math.round(m.wheelR * 0.55);
  pixelLine(g, m.wheelX, cy, m.wheelX - spread, foot, c.wheel);
  pixelLine(g, m.wheelX, cy, m.wheelX + spread, foot, c.wheel);
  fillRect(g, c.farLo, m.wheelX - spread - 2, foot, spread * 2 + 5, 2);
};

// The far shore: a dark line of woods, then the hazy lowland of the park striped with distant fields.
const paintShore = (g: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const bottom = m.base + 8;
  for (let x = 0; x < f.w; x++) {
    const top = Math.round(landAt(m, x));
    if (top >= bottom) continue;
    fillRect(g, c.far, x, top, 1, bottom - top);
    fillRect(g, c.farLo, x, top, 1, 2);
    for (let y = top + 4 + (x % 2); y < bottom; y += 4) fillRect(g, c.farLo, x, y, 1, 1);
  }
  for (let i = 0; i < m.landEdge / 4; i++) {
    const x = Math.round(rand(i, 21) * (m.landEdge - 16));
    puff(g, x, Math.round(landAt(m, x) + 4 + rand(i, 22) * (bottom - landAt(m, x))), 2, [c.farLo, c.farLo, c.far]);
  }
};

const seaLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('nemo-sea', f, c, (g) => {
    const m = layoutOf(f);
    g.drawImage(ditherGradient(f.w, m.base - m.horizon + 8, [c.sea, c.seaLo]), 0, m.horizon);
    fillRect(g, c.seaLit, 0, m.horizon, f.w, 1);
  });

const shoreLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('nemo-shore', f, c, (g) => {
    const m = layoutOf(f);
    paintShore(g, f, m, c);
    paintStand(g, m, c);
  });

// The wheel turns slowly; at dusk its cars light up in a chase that steps on the beat.
const cars = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>, turn: number): void => {
  const lit = duskOf(c);
  const step = Math.floor(f.beat);
  const colors = [c.car0, c.car1, c.car2];
  for (let k = 0; k < 12; k++) {
    const a = turn + (k * Math.PI) / 6;
    const x = Math.round(m.wheelX + Math.cos(a) * m.wheelR);
    const y = Math.round(wheelY(m) + Math.sin(a) * m.wheelR);
    const glow = lit && (k + step) % 3 === 0;
    if (glow) drawGlow(ctx, c.wheelLit, x, y + 1, 3, 3, 0.6);
    fillRect(ctx, glow ? c.wheelLit : (colors[k % 3] as string), x - 1, y, 2, 2);
  }
};

const ferrisWheel = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const cy = wheelY(m);
  const turn = f.t * 0.15;
  for (let k = 0; k < 8; k++) {
    const a = turn + (k * Math.PI) / 4;
    pixelLine(ctx, m.wheelX, cy, m.wheelX + Math.cos(a) * m.wheelR, cy + Math.sin(a) * m.wheelR, c.wheel);
  }
  ring(ctx, m.wheelX, cy, m.wheelR, 1, c.wheel);
  cars(ctx, f, m, c, turn);
};

// ---- kites ----

// A diamond kite, 7 by 8 inside a one-pixel margin for its outline: the colors a and b in opposite quarters, crossed by
// its spars (s).
const kitePixel =
  (a: string, b: string) =>
  (px: number, py: number): string => {
    const x = px - 1;
    const y = py - 1;
    const half = y <= 3 ? y : Math.round(3 - (y - 3) * 0.75);
    if (y < 0 || Math.abs(x - 3) > half) return '.';
    if (x === 3 || y === 3) return 's';
    return x < 3 === y < 3 ? a : b;
  };
const KITES = [outlined(spriteOf(9, 10, kitePixel('a', 'b')), 'o'), outlined(spriteOf(9, 10, kitePixel('b', 'a')), 'o')] as const;
const kitePalette = paletteBy<K>((c) => ({ a: c.kite0, b: c.kite1, s: c.kite2, o: c.ink }));

// Where each kite flies (shares of the frame) and how far down the path its flyer stands.
const KITE_SPOTS: Readonly<Record<'wide' | 'tall', readonly (readonly [number, number, number])[]>> = {
  wide: [
    [0.34, 0.13, 0.06],
    [0.8, 0.22, 0.3],
  ],
  tall: [
    [0.24, 0.1, 0.05],
    [0.78, 0.18, 0.3],
  ],
};

// The string sags a little between the kite and the flyer's hand: every other pixel, so it reads thin.
const kiteString = (ctx: Ctx, from: V, to: V, color: string): void => {
  const n = Math.max(1, Math.round(Math.hypot(to[0] - from[0], to[1] - from[1])));
  ctx.fillStyle = color;
  for (let k = 0; k <= n; k += 2) {
    const t = k / n;
    ctx.fillRect(
      Math.round(from[0] + (to[0] - from[0]) * t),
      Math.round(from[1] + (to[1] - from[1]) * t + Math.sin(Math.PI * t) * n * 0.06),
      1,
      1,
    );
  }
};

const kiteTail = (ctx: Ctx, f: Frame, x: number, y: number, c: Colors<K>): void => {
  for (let k = 0; k < 8; k++) {
    const tx = Math.round(x + Math.sin(f.t * 3 + k * 0.8) * k * 0.35);
    const bow = k % 3 === 2;
    fillRect(ctx, bow ? c.kite1 : c.kite0, tx - (bow ? 1 : 0), y + k * 2, bow ? 3 : 1, bow ? 1 : 2);
  }
};

const footOf = (f: Frame, m: Layout, u: number): number => Math.round(m.top + 3 + u * (f.h - m.top + 8));
const sizeOf = (f: Frame, u: number): number => Math.max(6, Math.round(4 + u * (f.w > f.h ? 11 : 15)));

const looksOf = (c: Colors<K>): readonly Visitor[] => [
  { hair: c.hair, face: c.skin, coat: c.coat0, legs: c.ink, brolly: null },
  { hair: c.hair, face: c.skin, coat: c.coat1, legs: c.ink, brolly: null },
  { hair: c.hair, face: c.skin, coat: c.coat2, legs: c.ink, brolly: null },
];

// Each kite bobs on the breeze and gives a little tug upward on the beat.
const kite = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>, i: number): void => {
  const [kx, ky, u] = (f.w > f.h ? KITE_SPOTS.wide : KITE_SPOTS.tall)[i] ?? [0.5, 0.1, 0.1];
  const fy = footOf(f, m, u);
  const fx = Math.round(pathAt(f, m, fy) + 2);
  const fh = sizeOf(f, u);
  const tug = (1 - frac(f.beat + i * 0.5)) ** 4 * 2;
  const x = Math.round(f.w * kx + Math.sin(f.t * 0.6 + i * 2) * 4);
  const y = Math.round(f.h * ky + Math.sin(f.t * 0.9 + i) * 3 - tug);
  kiteString(ctx, [x, y + 6], [fx + 1, fy - fh + 2], c.kite2);
  kiteTail(ctx, f, x, y + 9, c);
  drawSprite(ctx, KITES[i % 2] as Sprite, kitePalette(c), x - 4, y - 1);
  drawVisitor(ctx, fx, fy, fh, looksOf(c)[(i + 1) % 3] as Visitor, 2);
};

// ---- visitors strolling on the path, butterflies and dragonflies ----

const strollers = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const looks = looksOf(c);
  const walkers = Array.from({ length: 5 }, (_, i) => ({ i, u: wrap(rand(i, 81) + f.t * 0.006 * (i % 2 === 0 ? 1 : -1), 1.1) }));
  for (const { i, u } of walkers.sort((p, q) => p.u - q.u)) {
    const y = footOf(f, m, u);
    const x = Math.round(pathAt(f, m, y) + (i % 2 === 0 ? -1 : 1) * pathHalfAt(f, m, y) * 0.4);
    drawVisitor(ctx, x, y, sizeOf(f, u), looks[i % looks.length] as Visitor, Math.floor(f.beat + i) % 2);
  }
};

// A butterfly from afar: wings open, half open, closed. a wings, b body.
const BUTTERFLY: readonly Sprite[] = [
  ['aa.aa', 'aabaa', '.a.a.'],
  ['.a.a.', '.aba.', '..a..'],
  ['..a..', '..b..', '..a..'],
];
const butterflyPalettes = [paletteBy<K>((c) => ({ a: c.wing, b: c.body })), paletteBy<K>((c) => ({ a: c.coat2, b: c.body }))] as const;

const butterflies = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const n = f.w > f.h ? 6 : 5;
  for (let i = 0; i < n; i++) {
    const x = wrap(rand(i, 61) * f.w + f.t * (3 + rand(i, 62) * 4) * (i % 2 === 0 ? 1 : -1) + Math.sin(f.t * 1.3 + i) * 10, f.w + 10) - 5;
    const y = m.base + (f.h - m.base) * (0.1 + 0.6 * rand(i, 63)) + Math.sin(f.t * 2.1 + i * 1.7) * 6;
    const frame = BUTTERFLY[Math.floor(frac(f.beat * 2 + i * 0.3) * 3)] as Sprite;
    const palette = i % 2 === 0 ? butterflyPalettes[0] : butterflyPalettes[1];
    drawSprite(ctx, frame, palette(c), Math.round(x), Math.round(y));
  }
};

// A red dragonfly seen from above, flying right: w wings (two flicks), r body, h head.
const DRAGONFLY: readonly Sprite[] = [
  ['.w.w..', 'rrrrrh', '.w.w..'],
  ['w..w..', 'rrrrrh', 'w..w..'],
];
const dragonflyPalette = paletteBy<K>((c) => ({ w: c.wing, r: c.body, h: c.ink }));

// They hover, then dart a few pixels on the beat.
const dragonflies = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const n = f.w > f.h ? 7 : 5;
  for (let i = 0; i < n; i++) {
    const x = wrap(rand(i, 64) * f.w + surge(f.beat * 0.5 + rand(i, 65)) * 7, f.w + 10) - 5;
    const y = m.horizon + (f.h - m.horizon) * (0.05 + 0.6 * rand(i, 66)) + Math.sin(f.t * 1.7 + i * 2.3) * 3;
    drawSprite(ctx, DRAGONFLY[Math.floor(f.t * 12 + i) % 2] as Sprite, dragonflyPalette(c), Math.round(x), Math.round(y));
  }
};

// ---- the foreground: big flowers on their stems (or big kochia in autumn) along the bottom ----

// Nemophila flowers: a petals, b their pale inner halves, w the white heart, c the dark eye. A near one, a middling one
// and a far one.
const FLOWER: Sprite = ['.aa.aa.', 'aabbbaa', 'abwwwba', '.bwcwb.', 'abwwwba', 'aabbbaa', '.aa.aa.'];
const MID: Sprite = ['.aba.', 'abwba', 'awcwa', 'abwba', '.aba.'];
const SMALL: Sprite = ['.a.', 'awa', '.a.'];
const flowerPalette = paletteBy<K>((c) => ({ a: c.hill2, b: c.hill3, w: c.heart, c: c.hill0 }));
const midPalette = paletteBy<K>((c) => ({ a: c.hill3, b: c.bloom, w: c.heart, c: c.hill0 }));
const smallPalette = paletteBy<K>((c) => ({ a: c.hill3, w: c.heart }));

// The near meadow: leaves and stems with small and middling flowers among them, keeping clear of the path.
// One plant of the near meadow: a leaf or a stem, and on every third a middling or a small flower.
const plant = (g: Ctx, c: Colors<K>, i: number, x: number, y: number): void => {
  if (rand(i, 77) < 0.5) fillRect(g, c.leaf, x, y + 1, 2, 1);
  else fillRect(g, c.leafLo, x, y + 1, 1, 3);
  if (i % 6 === 0) drawSprite(g, MID, midPalette(c), x - 1, y - 2);
  else if (i % 3 === 0) drawSprite(g, SMALL, smallPalette(c), x - 1, y - 2);
};

const paintMeadow = (g: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  for (let i = 0; i < f.w * 1.2; i++) {
    const x = Math.floor(rand(i, 71) * f.w);
    const y = m.front + Math.floor(rand(i, 72) * (f.h - m.front + 6)) - 6;
    if (!onPath(f, m, x, y, 2)) plant(g, c, i, x, y);
  }
};

const paintBigKochia = (g: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const r = f.w > f.h ? 9 : 11;
  for (let x = -r, i = 0; x < f.w + r; x += r * 2 - 2, i++) {
    const y = m.front + Math.round(rand(i, 73) * r) + 4;
    if (!onPath(f, m, x, y, r)) puff(g, x, y, r + Math.round(rand(i, 74) * 3), [c.hill0, c.hill1, c.hill2]);
  }
};

const frontLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('nemo-front', f, c, (g) => {
    const m = layoutOf(f);
    if (autumnOf(c)) paintBigKochia(g, f, m, c);
    else paintMeadow(g, f, m, c);
  });

// The big flowers nod as a gust passes over them.
const bigFlowers = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const n = Math.round(f.w / 12);
  for (let i = 0; i < n; i++) {
    const x = Math.round(rand(i, 75) * f.w);
    const y = m.front + Math.round(rand(i, 76) * (f.h - m.front));
    if (onPath(f, m, x, y, 4)) continue;
    const nod = gustAt(f, m, x, y) ? 1 : 0;
    fillRect(ctx, c.leafLo, x, y + 3, 1, 6);
    fillRect(ctx, c.leaf, x + 1, y + 6, 2, 1);
    drawSprite(ctx, FLOWER, flowerPalette(c), x - 3 + nod, y - 3 + nod);
  }
};

// ---- per-frame layers ----

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  skyBase(ctx, f, { bottom: m.horizon + 1, stops: [c.sky0, c.sky1, c.sky2, c.sky3], stars: null, seed: 1 });
  if (duskOf(c)) {
    drawGlow(ctx, c.sun, m.sunX, m.horizon, Math.round(f.w * 0.3), Math.round(m.horizon * 0.6), 0.5, 5);
    disc(ctx, m.sunX, m.horizon - 3, 9, () => c.sun);
  }
  driftingClouds(ctx, f, c.cloud, c.cloudLo, { count: 4, top: m.horizon * 0.2, span: m.horizon * 0.6, size: 10, speed: 2, seed: 5 });
};

const far = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  ctx.drawImage(seaLayer(f, c), 0, 0);
  glints(ctx, f, m.horizon + 2, m.base + 6, duskOf(c) ? c.sun : c.seaLit, Math.round(f.w / 8), 11);
  ctx.drawImage(shoreLayer(f, c), 0, 0);
  ferrisWheel(ctx, f, m, c);
};

const hill = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  ctx.drawImage(hillLayer(f, c), 0, 0);
  gusts(ctx, f, m, c);
  const [base, h] = trunkOf(f, m);
  const [rx, ry] = crownSize(f);
  const sway = gustAt(f, m, m.treeX, base) ? 1 : 0;
  ctx.drawImage(crownLayer(f, c), m.treeX - rx - 2 + sway, base - h - Math.round(ry * 1.6) - 2);
};

const life = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  strollers(ctx, f, m, c);
  for (let i = 0; i < 2; i++) kite(ctx, f, m, c, i);
  if (autumnOf(c)) dragonflies(ctx, f, m, c);
  else butterflies(ctx, f, m, c);
};

const front = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  ctx.drawImage(frontLayer(f, c), 0, 0);
  if (!autumnOf(c)) bigFlowers(ctx, f, m, c);
};

export const nemophilaHills = defineScene<K>({
  id: 'nemophila-hills',
  title: 'Blue Hills',
  mood: { valence: 0.7, energy: 0.15 },
  styles: ['kawaii-pop', 'nineties-pop', 'cozy-village', 'celtic-isle', 'trance-pop'],
  variants: [
    {
      // A spring morning: the hill a sea of blue under a bright sky, the real sea beyond it.
      mood: { valence: 0.8, energy: 0.2 },
      colors: {
        sky0: '#3a84e0',
        sky1: '#64a6ec',
        sky2: '#9ccaf2',
        sky3: '#d8eef8',
        sun: '#fffbe6',
        cloud: '#ffffff',
        cloudLo: '#c6dcf2',
        sea: '#2c6cc0',
        seaLo: '#4a92d6',
        seaLit: '#e6f4ff',
        far: '#7aa894',
        farLo: '#4e7e6e',
        hill0: '#1c3c9a',
        hill1: '#2c5ac6',
        hill2: '#4a86e4',
        hill3: '#86b6f4',
        bloom: '#bcdcff',
        heart: '#ffffff',
        leaf: '#4a9a52',
        leafLo: '#2a6a3e',
        path: '#ece0c4',
        pathLo: '#bcaa8a',
        tree: '#3e8e40',
        treeLo: '#245a30',
        treeLit: '#80c45c',
        bark: '#5a4030',
        wheel: '#9aa6c0',
        wheelLit: '#9aa6c0',
        car0: '#f05a6a',
        car1: '#f6c43a',
        car2: '#ffffff',
        kite0: '#f04a5a',
        kite1: '#ffd040',
        kite2: '#ffffff',
        wing: '#fffbe8',
        body: '#3a3020',
        coat0: '#f48aa4',
        coat1: '#ffffff',
        coat2: '#f6c64e',
        hair: '#3a2a24',
        skin: '#f6d0b0',
        ink: '#1a2244',
      },
    },
    {
      // Sunset: the flowers gone violet, the sun setting into the sea and the wheel's lights coming on.
      mood: { valence: 0.55, energy: -0.2 },
      colors: {
        sky0: '#34407e',
        sky1: '#7a5a9c',
        sky2: '#e8867e',
        sky3: '#ffcf98',
        sun: '#fff0b8',
        cloud: '#ffb08e',
        cloudLo: '#a8668a',
        sea: '#4a4a8c',
        seaLo: '#8a6a9c',
        seaLit: '#ffd8a0',
        far: '#6a5486',
        farLo: '#4a3a6a',
        hill0: '#26286e',
        hill1: '#3e46a4',
        hill2: '#6a6ac8',
        hill3: '#b49ade',
        bloom: '#e8bce4',
        heart: '#fff0e4',
        leaf: '#4a6a5a',
        leafLo: '#2e4448',
        path: '#e8b89a',
        pathLo: '#a87a72',
        tree: '#3a4a4a',
        treeLo: '#22283a',
        treeLit: '#7a6a6a',
        bark: '#2e2430',
        wheel: '#3a3058',
        wheelLit: '#ffe08a',
        car0: '#ff8a7a',
        car1: '#ffd070',
        car2: '#fff0e0',
        kite0: '#e8404e',
        kite1: '#ffc040',
        kite2: '#fff0e0',
        wing: '#ffe8d0',
        body: '#2a2030',
        coat0: '#e87a8a',
        coat1: '#f0e0e8',
        coat2: '#e8b04a',
        hair: '#2a1e24',
        skin: '#f0b8a0',
        ink: '#1a1430',
      },
    },
    {
      // Autumn: the same hill covered in round kochia bushes turned crimson, red dragonflies over them.
      mood: { valence: 0.65, energy: 0.45 },
      colors: {
        sky0: '#2e74d6',
        sky1: '#5c9ce6',
        sky2: '#98c4ee',
        sky3: '#dcecf4',
        sun: '#fffbe6',
        cloud: '#ffffff',
        cloudLo: '#c8daee',
        sea: '#2a62b2',
        seaLo: '#4a8acc',
        seaLit: '#e6f2ff',
        far: '#a0a070',
        farLo: '#6a7050',
        hill0: '#5e1620',
        hill1: '#b0222c',
        hill2: '#e2462e',
        hill3: '#ff9a6a',
        bloom: '#ffc0a0',
        heart: '#ffe8d0',
        leaf: '#8a8a3a',
        leafLo: '#5a5a2a',
        path: '#eadcbc',
        pathLo: '#b8a07e',
        tree: '#d0962a',
        treeLo: '#8a5a1e',
        treeLit: '#f6cc5a',
        bark: '#4a3026',
        wheel: '#9aa6c0',
        wheelLit: '#9aa6c0',
        car0: '#f05a6a',
        car1: '#f6c43a',
        car2: '#ffffff',
        kite0: '#2a6ad0',
        kite1: '#ffd040',
        kite2: '#ffffff',
        wing: '#f0f4ff',
        body: '#d8301e',
        coat0: '#3a5aa0',
        coat1: '#f0e8dc',
        coat2: '#e8a040',
        hair: '#3a2a24',
        skin: '#f6d0b0',
        ink: '#2a1a1a',
      },
    },
  ],
  layers: [sky, far, hill, life, front],
});
