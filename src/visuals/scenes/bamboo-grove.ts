// The bamboo path at Arashiyama: towering stalks in three planes on both sides of a fenced path, swaying together
// with the music while light falls through the leaves; a rickshaw is pulled slowly along the path as leaves drift down.
import { type Ctx, drawSprite, fillRect, type Sprite } from 'mojipx';
import { ditherGradient, frac, pixelLine, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { drawGlow, fillDither, paletteBy, wrap } from './batch-1-helpers.ts';
import { isDark, mixHex } from './batch-5-helpers.ts';
import { frameLayer, rain } from './batch-6-helpers.ts';
import { limb } from './batch-7-helpers.ts';
import { flutter, type Plan, planOf } from './batch-9-helpers.ts';
import { both, box, type Inside, oval, stick, tri, type V } from './batch-14-helpers.ts';
import { drawWagasa, figureAt } from './batch-17-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'haze'
  | 'hazeLo'
  | 'far'
  | 'farLit'
  | 'stalk'
  | 'stalkLit'
  | 'stalkLo'
  | 'node'
  | 'near'
  | 'nearLit'
  | 'nearLo'
  | 'leaf'
  | 'leafLit'
  | 'leafLo'
  | 'shaft'
  | 'path'
  | 'pathLit'
  | 'pathLo'
  | 'fence'
  | 'fenceLit'
  | 'fenceLo'
  | 'rail'
  | 'ink'
  | 'skin'
  | 'hair'
  | 'coat'
  | 'hat'
  | 'hatLo'
  | 'kimono'
  | 'kimonoLo'
  | 'robe'
  | 'blanket'
  | 'blanketLo'
  | 'lacquer'
  | 'lacquerLit'
  | 'lamp'
  | 'glow'
  | 'rain'
  | 'mist';

// ---- layout ----

// back: the far fence's foot, where the path begins; road: where the wheels and the puller's feet touch it;
// front: the near fence's foot; canopy: how far the leaves reach down.
type Spot = 'back' | 'road' | 'front' | 'canopy';
type Layout = Readonly<Record<Spot, number>>;

const WIDE: Plan<Spot> = { back: ['h', 0.62], road: ['h', 0.87], front: ['h', 1], canopy: ['h', 0.2] };
const TALL: Plan<Spot> = { back: ['h', 0.7], road: ['h', 0.82], front: ['h', 0.9], canopy: ['h', 0.16] };

const layoutOf = (f: Frame): Layout => planOf(f, WIDE, TALL);

// ---- bamboo ----

type StalkTones = { readonly body: string; readonly lit: string; readonly lo: string; readonly node: string };

/** A plane of stalks across the whole width (it tiles, so the camera can pan along it). */
type Plane = {
  /** The narrowest and widest stalk, and the average gap between stalk centres. */
  readonly thin: number;
  readonly thick: number;
  readonly gap: number;
  /** Rows between nodes, and the seed that places the stalks. */
  readonly seg: number;
  readonly seed: number;
};

const HAZE: Plane = { thin: 1, thick: 2, gap: 4, seg: 12, seed: 2 };
const FAR: Plane = { thin: 2, thick: 3, gap: 6, seg: 16, seed: 3 };
const MID: Plane = { thin: 4, thick: 7, gap: 17, seg: 22, seed: 5 };
const NEAR: Plane = { thin: 11, thick: 15, gap: 320, seg: 34, seed: 7 };

// A node: a pale ridge a pixel proud of the stalk on each side, a dark groove under it and, on thick stalks, the
// white bloom of wax that rings the stalk just below.
const paintNode = (g: Ctx, x: number, w: number, y: number, t: StalkTones): void => {
  const proud = w >= 4 ? 1 : 0;
  fillRect(g, t.node, x - proud, y, w + proud * 2, 1);
  fillRect(g, t.lo, x, y + 1, w, 1);
  if (w >= 8) fillDither(g, t.node, 0.3, x + 1, y + 2, w - 2, 2);
};

// One stalk from its foot up past the top: lit down its left side, shaded down its right, ringed at every node.
const paintStalk = (g: Ctx, x: number, w: number, foot: number, seg: number, t: StalkTones, seed: number): void => {
  const lo = Math.max(1, Math.round(w * 0.3));
  fillRect(g, t.body, x, 0, w, foot);
  fillRect(g, t.lo, x + w - lo, 0, lo, foot);
  fillRect(g, t.lit, x + (w >= 6 ? 1 : 0), 0, w >= 9 ? 2 : 1, foot);
  if (w >= 9) fillRect(g, t.lo, x, 0, 1, foot);
  let y = foot - Math.round(seg * (0.3 + 0.6 * rand(seed, 1)));
  for (let k = 0; y > -2; k++) {
    paintNode(g, x, w, y, t);
    y -= Math.round(seg * (0.85 + 0.3 * rand(seed, k + 2)));
  }
};

/** Calls `each` for every stalk of a plane: its left edge, width and seed, spread evenly so the plane tiles. */
const eachStalk = (p: Plane, w: number, each: (x: number, width: number, seed: number) => void): void => {
  const n = Math.max(1, Math.round(w / p.gap));
  for (let i = 0; i < n; i++) {
    const width = p.thin + Math.round(rand(i, p.seed) * (p.thick - p.thin));
    const x = Math.round(((i + 0.2 + 0.6 * rand(i, p.seed + 1)) * w) / n);
    each(x, width, p.seed * 100 + i);
    if (x + width + 1 > w) each(x - w, width, p.seed * 100 + i);
  }
};

// ---- leaves ----

type LeafTones = readonly [string, string, string];

// A spray of narrow leaves hanging from a twig tip: each blade droops away from it, thick at its base.
const paintSpray = (g: Ctx, x: number, y: number, size: number, tones: LeafTones, seed: number): void => {
  const blades = 3 + Math.round(rand(seed, 1) * 3);
  for (let k = 0; k < blades; k++) {
    const a = Math.PI * (0.15 + 0.7 * ((k + rand(seed, k + 2) * 0.6) / blades));
    const len = size * (0.7 + 0.5 * rand(seed, k + 9));
    const ex = x + Math.cos(a) * len;
    const ey = y + Math.sin(a) * len * 0.8 + 1;
    const tone = tones[(k + seed) % 3] as string;
    pixelLine(g, x, y, ex, ey, tone);
    pixelLine(g, x, y + 1, (x + ex) / 2, (y + ey) / 2 + 1, tone);
  }
};

/** Bamboo grass along a foot line: fans of short blades springing up and out, tiled across the width. */
const paintGrass = (g: Ctx, w: number, foot: number, tones: LeafTones, seed: number): void => {
  for (let x = 0, i = 0; x < w; x += 3 + Math.round(rand(i, seed) * 3), i++) {
    for (let k = 0; k < 3; k++) {
      const a = -Math.PI * (0.2 + 0.6 * rand(i, seed + k + 1));
      const len = 4 + rand(i, seed + k + 5) * 5;
      pixelLine(g, x, foot, x + Math.cos(a) * len, foot + Math.sin(a) * len, tones[(i + k) % 3] as string);
    }
  }
};

/** Leaf sprays thick at the top of the frame and thinning out down to `bottom`, tiled across the width. */
const paintLeaves = (g: Ctx, w: number, bottom: number, size: number, tones: LeafTones, seed: number): void => {
  const n = Math.round((w * bottom) / (size * size * 0.9));
  for (let i = 0; i < n; i++) {
    const x = Math.round(rand(i, seed) * w);
    const y = Math.round(bottom * rand(i, seed + 1) ** 1.8) - 2;
    for (const at of [x - w, x, x + w]) paintSpray(g, at, y, size, tones, seed + i);
  }
};

// ---- the brushwood fences ----

type Fence = { readonly foot: number; readonly tall: number; readonly posts: number; readonly seed: number };

// Bundled brushwood standing on end with a ragged top, tied by two split-bamboo rails, between round posts.
const paintFence = (g: Ctx, w: number, fe: Fence, c: Colors<K>): void => {
  const top = fe.foot - fe.tall;
  fillRect(g, c.fenceLo, 0, top + 2, w, fe.tall - 2);
  for (let x = 0; x < w; x++) {
    const r = rand(x, fe.seed);
    const tip = top + Math.round(rand(x, fe.seed + 1) * 3);
    const tone = r < 0.4 ? c.fence : r < 0.6 ? c.fenceLit : null;
    if (tone) fillRect(g, tone, x, tip, 1, fe.foot - tip);
  }
  for (const k of [0.3, 0.7]) {
    const y = Math.round(top + fe.tall * k);
    fillRect(g, c.rail, 0, y, w, 1);
    fillRect(g, c.fenceLo, 0, y + 1, w, 1);
  }
  const n = Math.max(1, Math.round(w / fe.posts));
  for (let i = 0; i < n; i++) {
    const x = Math.round((i * w) / n);
    fillRect(g, c.ink, x - 1, top - 2, 4, fe.tall + 2);
    fillRect(g, c.fenceLit, x, top - 1, 2, fe.tall + 1);
    fillRect(g, c.rail, x, top - 1, 2, 1);
  }
};

// ---- the planes, cached ----

/** A back plane of stalks with its own leaf row hanging from the canopy at `reach` of its height. */
type BackPlane = {
  readonly plane: Plane;
  readonly stalks: StalkTones;
  readonly leaves: LeafTones;
  readonly reach: number;
  readonly leaf: number;
  readonly seed: number;
};

const backPlanesOf = (c: Colors<K>): readonly BackPlane[] => [
  {
    plane: HAZE,
    stalks: { body: mixHex(c.haze, c.far, 0.45), lit: mixHex(c.haze, c.farLit, 0.5), lo: c.haze, node: c.farLit },
    leaves: [c.haze, c.far, c.farLit],
    reach: 0.7,
    leaf: 4,
    seed: 11,
  },
  {
    plane: FAR,
    stalks: { body: c.far, lit: c.farLit, lo: c.hazeLo, node: c.farLit },
    leaves: [c.hazeLo, c.far, c.farLit],
    reach: 0.9,
    leaf: 5,
    seed: 13,
  },
];

// The hazy and the far plane, back to front.
const farLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('bamboo-far', f, c, (g) => {
    const m = layoutOf(f);
    for (const b of backPlanesOf(c)) {
      eachStalk(b.plane, f.w, (x, w, seed) => paintStalk(g, x, w, m.back, b.plane.seg, b.stalks, seed));
      paintLeaves(g, f.w, Math.round(m.canopy * b.reach), b.leaf, b.leaves, b.seed);
    }
  });

// A twig or two springs from each mid stalk high up, each ending in a spray of leaves.
const paintTwigs = (g: Ctx, m: Layout, c: Colors<K>, x: number, w: number, seed: number): void => {
  for (let k = 0; k < 2; k++) {
    const side = rand(seed, k + 20) < 0.5 ? -1 : 1;
    const y = Math.round(m.canopy * (0.6 + 1.1 * rand(seed, k + 21)));
    const from = side < 0 ? x - 1 : x + w;
    const tip = [from + side * (6 + Math.round(rand(seed, k + 22) * 8)), y - 4 - Math.round(rand(seed, k + 23) * 5)] as const;
    pixelLine(g, from, y, tip[0], tip[1], c.stalkLo);
    paintSpray(g, tip[0], tip[1], 6, [c.leafLo, c.leaf, c.leafLit], seed + k);
  }
};

const midLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('bamboo-mid', f, c, (g) => {
    const m = layoutOf(f);
    const tones = { body: c.stalk, lit: c.stalkLit, lo: c.stalkLo, node: c.node };
    eachStalk(MID, f.w, (x, w, seed) => {
      paintStalk(g, x, w, m.back, MID.seg, tones, seed);
      paintTwigs(g, m, c, x, w, seed);
    });
    paintLeaves(g, f.w, m.canopy, 6, [c.leafLo, c.leaf, c.leafLit], 21);
  });

// The grove floor on our side of the fence (only a tall screen shows it): dark earth under rows of bamboo grass.
const paintUndergrowth = (g: Ctx, f: Frame, top: number, c: Colors<K>): void => {
  g.drawImage(ditherGradient(f.w, f.h - top, [c.nearLo, c.ink]), 0, top);
  for (let y = top + 9, k = 0; y < f.h + 6; y += 8, k++) {
    paintGrass(g, f.w, y, k % 2 === 0 ? [c.nearLo, c.near, c.leaf] : [c.leafLo, c.near, c.nearLit], 50 + k);
  }
};

// A few great stalks right in front of us, full height, outlined against the grove behind.
const paintNearStalks = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const tones = { body: c.near, lit: c.nearLit, lo: c.nearLo, node: c.nearLit };
  eachStalk(NEAR, f.w, (x, w, seed) => {
    fillRect(g, c.ink, x - 1, 0, w + 2, f.h);
    paintStalk(g, x, w, f.h, NEAR.seg, tones, seed);
  });
};

// The near side: the fence along the path's front edge, bamboo grass at its foot, and the near stalks with leaves
// hanging into the top of the frame.
const nearLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('bamboo-near', f, c, (g) => {
    const m = layoutOf(f);
    if (m.front < f.h) paintUndergrowth(g, f, m.front, c);
    paintFence(g, f.w, { foot: m.front, tall: f.w > f.h ? 15 : 17, posts: 46, seed: 31 }, c);
    paintGrass(g, f.w, m.front, [c.nearLo, c.near, c.nearLit], 33);
    paintNearStalks(g, f, c);
    paintLeaves(g, f.w, Math.round(m.canopy * 0.45), 8, [c.nearLo, c.near, c.nearLit], 37);
  });

// Dry bamboo leaves blown to the edges of the path, a few lying out in the middle.
const paintFallenLeaves = (g: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const depth = m.front - m.back;
  for (let i = 0; i < f.w / 3; i++) {
    const r = rand(i, 45);
    const y = m.back + 4 + Math.round((r < 0.5 ? r * 0.3 : 1 - (1 - r) * 0.5) * (depth - 6));
    const x = Math.round(rand(i, 46) * f.w);
    const tone = rand(i, 47) < 0.5 ? c.hat : c.leafLit;
    fillRect(g, tone, x, y, 2, 1);
    if (rand(i, 48) < 0.4) fillRect(g, c.hatLo, x + 2, y + 1, 1, 1);
  }
};

// The path of packed earth, paler down its middle where feet and wheels go, with the far fence along its back edge.
const pathLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('bamboo-path', f, c, (g) => {
    const m = layoutOf(f);
    g.drawImage(ditherGradient(f.w, m.front - m.back, [c.pathLo, c.path, c.pathLit, c.path]), 0, m.back);
    const n = Math.round((f.w * (m.front - m.back)) / 14);
    for (let i = 0; i < n; i++) {
      const y = m.back + Math.round(rand(i, 27) * (m.front - m.back));
      fillRect(g, rand(i, 28) < 0.6 ? c.pathLo : c.pathLit, Math.round(rand(i, 26) * f.w), y, rand(i, 25) < 0.3 ? 2 : 1, 1);
    }
    for (const dy of [-2, 2]) fillDither(g, c.pathLo, 0.4, 0, m.road + dy, f.w, 1);
    fillDither(g, c.pathLo, 0.5, 0, m.back + 1, f.w, 3);
    fillDither(g, c.pathLo, 0.25, 0, m.back + 4, f.w, 3);
    paintFallenLeaves(g, f, m, c);
    paintFence(g, f.w, { foot: m.back + 1, tall: f.w > f.h ? 12 : 13, posts: 38, seed: 29 }, c);
  });

// Shafts of light slanting down through gaps in the leaves and pooling on the path; `core` keeps only their bright
// middles.
const shaftLayer = (f: Frame, c: Colors<K>, core: boolean): HTMLCanvasElement =>
  frameLayer(core ? 'bamboo-core' : 'bamboo-shafts', f, c, (g) => {
    const m = layoutOf(f);
    const n = Math.max(2, Math.round(f.w / 80));
    for (let i = 0; i < n; i++) {
      const x0 = ((i + rand(i, 41)) * f.w) / n;
      const width = (core ? 3 : 9) + Math.round(rand(i, 42) * 8);
      for (const shift of [-f.w, 0]) beam(g, c.shaft, x0 + shift, width, m.road + 4, core);
    }
  });

const beam = (g: Ctx, color: string, x0: number, width: number, bottom: number, core: boolean): void => {
  for (let y = 0; y < bottom; y++) {
    const level = core ? 0.5 : y < bottom * 0.55 ? 0.25 : 0.125;
    fillDither(g, color, level, x0 + y * 0.42 - width / 2, y, width, 1);
  }
  for (let k = 0; k < 3; k++) {
    const half = Math.round(width * (0.9 - k * 0.25));
    fillDither(g, color, k === 1 ? 0.5 : 0.25, x0 + bottom * 0.42 - half, bottom - 2 + k, half * 2, 1);
  }
};

// ---- the rickshaw ----

// The rickshaw is designed on a small grid and drawn larger: every shape is scaled by S, the outline stays one pixel.
const S = 1.4;
const u = (n: number): number => Math.round(n * S);

// The carriage, facing right, without its wheel: the folded black hood behind two passengers (a man in a dark
// kimono at the back, a woman in a pink one with her hair up in front), a red blanket over their knees and the step
// where their feet rest. o ink, k lacquer, K its shine, h hair, s skin, n his kimono, p hers, P its shade,
// w collar, r blanket, R its shade.
const hood: Inside = (x, y) => Math.hypot(x - 9, y - 15) < 10 && x < 9 && y < 15;
const CARRIAGE = figureAt(
  S,
  31,
  27,
  [
    ['k', hood],
    ['K', (x, y) => hood(x, y) && Math.floor(Math.hypot(x - 9, y - 15)) % 3 === 0],
    ['n', oval(10.5, 11, 3.6, 4.2)],
    ['h', oval(11, 4.2, 2.9, 3)],
    ['s', both(oval(11.4, 4.8, 2.5, 2.6), (x, y) => x > 11 && y > 3.6)],
    ['p', oval(16, 11.5, 3.4, 4)],
    ['P', both(oval(16, 11.5, 3.4, 4), (x) => x < 14.5)],
    ['w', stick([16.5, 8.2], [18, 10.5], 0.5)],
    ['h', oval(16, 5.6, 2.8, 2.9)],
    ['h', oval(14, 2.6, 1.7, 1.5)],
    ['s', both(oval(16.6, 6, 2.4, 2.5), (x, y) => x > 16 && y > 4.6)],
    ['k', box(4, 14, 21, 22)],
    ['K', box(5, 14, 21, 15)],
    ['r', box(10, 13, 23, 17)],
    ['r', box(19, 13, 25, 22)],
    ['R', box(19, 19, 25, 22)],
    ['k', box(19, 22, 30, 24)],
    ['K', box(20, 22, 30, 23)],
  ],
  [
    [12, 4, 'o'],
    [17, 5, 'o'],
  ],
);

// The puller, facing right in a straw hat, a black short coat and tights, leaning into the shafts; two steps.
// t straw, T its shade, h hair, s skin, c coat and tights, w collar.
const pullerOf = (front: readonly [V, V], back: readonly [V, V]): Sprite =>
  figureAt(
    S,
    16,
    29,
    [
      ['c', stick(back[0], back[1], 1.1)],
      ['t', box(back[1][0] - 1.5, back[1][1] + 0.5, back[1][0] + 1.5, back[1][1] + 1.6)],
      ['c', box(5.5, 10, 11.5, 19)],
      ['w', stick([10, 10.5], [10.5, 14], 0.5)],
      ['c', stick(front[0], front[1], 1.1)],
      ['t', box(front[1][0] - 1, front[1][1] + 0.5, front[1][0] + 2.5, front[1][1] + 1.6)],
      ['s', oval(10.5, 8.2, 2.4, 2.2)],
      ['h', box(7, 6.5, 9, 9.5)],
      ['t', tri([0.5, 6.6], [15.6, 6.6], [8.5, 0.4])],
      ['T', both(tri([0.5, 6.6], [15.6, 6.6], [8.5, 0.4]), (x, y) => x > 10 && y > 3.5)],
      ['c', stick([9, 11], [6, 16.5], 1)],
      ['s', oval(5.6, 17, 1.2, 1.2)],
    ],
    [[12, 8, 'o']],
  );

const PULLER: readonly Sprite[] = [
  pullerOf(
    [
      [9.5, 19],
      [12.5, 26],
    ],
    [
      [7, 19],
      [3.5, 26],
    ],
  ),
  pullerOf(
    [
      [9, 19],
      [9.5, 26],
    ],
    [
      [7.5, 19],
      [5.5, 23.5],
    ],
  ),
];

const carriagePalette = paletteBy<K>((c) => ({
  ...{ o: c.ink, k: c.lacquer, K: c.lacquerLit, h: c.hair, s: c.skin, n: c.robe },
  ...{ p: c.kimono, P: c.kimonoLo, w: c.pathLit, r: c.blanket, R: c.blanketLo },
}));
const pullerPalette = paletteBy<K>((c) => ({ o: c.ink, t: c.hat, T: c.hatLo, h: c.hair, s: c.skin, c: c.coat, w: c.pathLit }));

// ---- motion ----

/** How far the bamboo leans this moment (−1 … 1): one slow sway each bar, pushed a little further by the kick. */
const leanOf = (f: Frame): number => {
  const s = Math.sin((f.beat / 4) * Math.PI * 2);
  return s * 0.85 + Math.sign(s) * f.kick * 0.15;
};

/** The camera pans slowly along the path; nearer planes slide past faster. */
const PAN = { far: 0.6, mid: 1.2, path: 2, near: 3.5 } as const;
const panOf = (f: Frame, speed: number): number => -f.t * speed;

// A plane drawn in runs of rows sharing one sideways shift: still at the foot, swinging most at the top. The plane
// tiles, so each run is drawn twice to cover the width wherever the pan has taken it.
const drawSwaying = (ctx: Ctx, f: Frame, layer: HTMLCanvasElement, foot: number, swing: number, pan: number): void => {
  const shiftAt = (y: number): number => (y >= foot ? 0 : Math.round(swing * ((foot - y) / foot) ** 2));
  for (let y0 = 0; y0 < f.h; ) {
    const dx = shiftAt(y0);
    let y1 = y0 + 1;
    while (y1 < f.h && shiftAt(y1) === dx) y1++;
    const x = Math.round(wrap(pan + dx, f.w));
    ctx.drawImage(layer, 0, y0, f.w, y1 - y0, x, y0, f.w, y1 - y0);
    ctx.drawImage(layer, 0, y0, f.w, y1 - y0, x - f.w, y0, f.w, y1 - y0);
    y0 = y1;
  }
};

const rainyOf = (c: Colors<K>): boolean => c.rain !== c.sky0;
const nightOf = (c: Colors<K>): boolean => isDark(c.sky1);

// ---- the rickshaw on the move ----

const WHEEL = u(8);
// How fast the rickshaw crosses the screen, and its speed over the path once the camera's pan is added back.
const CROSS = 6;
const TRAVEL = CROSS + PAN.path;

// A spoked wheel turned by `angle`: a thick black rim, eight spokes and a brass hub.
const drawWheel = (ctx: Ctx, cx: number, cy: number, angle: number, c: Colors<K>): void => {
  for (let k = 0; k < 10; k++) {
    const a = angle + (k * Math.PI) / 5;
    pixelLine(ctx, cx, cy, cx + Math.cos(a) * (WHEEL - 1.5), cy + Math.sin(a) * (WHEEL - 1.5), c.lacquerLit);
  }
  for (let dy = -WHEEL; dy <= WHEEL; dy++) {
    const outer = Math.floor(Math.sqrt(WHEEL * WHEEL - dy * dy) + 0.3);
    const inner = Math.abs(dy) < WHEEL - 1 ? Math.floor(Math.sqrt((WHEEL - 2) ** 2 - dy * dy) + 0.3) : -1;
    const color = dy > WHEEL / 2 ? c.ink : c.lacquer;
    fillRect(ctx, color, cx - outer, cy + dy, outer - inner, 1);
    fillRect(ctx, color, cx + inner + 1, cy + dy, outer - inner, 1);
  }
  fillRect(ctx, c.ink, cx - 2, cy - 2, 5, 5);
  fillRect(ctx, c.rail, cx - 1, cy - 1, 3, 3);
};

// A paper lantern hanging from the carriage after dark, swinging a little with each step.
const drawChochin = (ctx: Ctx, x: number, y: number, swing: number, c: Colors<K>): void => {
  drawGlow(ctx, c.glow, x + swing, y + 4, 10, 8, 0.45);
  pixelLine(ctx, x, y, x + swing, y + 2, c.ink);
  fillRect(ctx, c.ink, x + swing - 1, y + 2, 3, 1);
  fillRect(ctx, c.lamp, x + swing - 1, y + 3, 3, 4);
  fillRect(ctx, c.blanket, x + swing - 1, y + 5, 3, 1);
  fillRect(ctx, c.ink, x + swing - 1, y + 7, 3, 1);
};

/** The rickshaw with its rear at x and wheels on `foot`: it bobs on every beat and the puller steps once a beat. */
const drawRickshaw = (ctx: Ctx, f: Frame, x: number, foot: number, c: Colors<K>): void => {
  const step = Math.floor(f.beat) % 2;
  const bob = frac(f.beat) < 0.3 ? 1 : 0;
  const top = foot - u(34) + bob;
  const px = x + u(40);
  drawSprite(ctx, CARRIAGE, carriagePalette(c), x, top);
  drawWheel(ctx, x + u(13), foot - WHEEL, (f.t * TRAVEL) / WHEEL, c);
  limb(ctx, x + u(24), foot - u(14) + bob, px + u(8), foot - u(11), 1, c.lacquer, c.ink);
  drawSprite(ctx, PULLER[step] as Sprite, pullerPalette(c), px, foot - u(28) - step);
  if (nightOf(c)) drawChochin(ctx, x + u(29), top + u(13), step === 0 ? 1 : 0, c);
  const paper = { paper: c.blanket, shade: c.blanketLo, ring: c.pathLit, ink: c.ink };
  if (rainyOf(c)) drawWagasa(ctx, x + u(14), top - u(8), u(12), paper, x + u(18), top + u(9));
};

// The paper lanterns of the festival, set along the foot of the far fence and lighting the stalks above them.
const ANDON: Sprite = ['ooooo', 'oLLLo', 'oLlLo', 'oLLLo', 'oLlLo', 'oLLLo', 'ooooo', 'o...o'];
const andonPalette = paletteBy<K>((c) => ({ o: c.ink, L: c.lamp, l: c.glow }));

const lanterns = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const n = Math.max(2, Math.round(f.w / 56));
  const pan = panOf(f, PAN.path);
  for (let i = 0; i < n; i++) {
    const x = Math.round(wrap(((i + 0.5) * f.w) / n + pan, f.w));
    const flicker = rand(Math.floor(f.t * 6), i) < 0.2 || f.kick > 0.7 ? 0.625 : 0.5;
    drawGlow(ctx, c.glow, x, m.back - 1, 7, 7, 0.5);
    drawGlow(ctx, c.glow, x, m.back + 1, 16, 5, flicker, 2);
    drawSprite(ctx, ANDON, andonPalette(c), x - 2, m.back - 4);
  }
};

// ---- weather ----

// Ribbons of mist drifting between the stalks in the rain, thickest down their middles.
const mist = (ctx: Ctx, f: Frame, bottom: number, c: Colors<K>): void => {
  for (let i = 0; i < 6; i++) {
    const len = 90 + Math.round(rand(i, 71) * 90);
    const x = wrap(rand(i, 72) * f.w + f.t * (2 + rand(i, 73) * 2), f.w + len) - len;
    const y = Math.round(bottom * (0.3 + 0.62 * rand(i, 74)));
    const thick = 6 + Math.round(rand(i, 75) * 6);
    for (let k = 0; k < 3; k++) {
      const inset = k * Math.round(thick / 5);
      fillDither(ctx, c.mist, 0.125 * (k + 1), x + inset * 4, y + inset, len - inset * 8, thick - inset * 2);
    }
  }
};

// A falling bamboo leaf turning over: a narrow blade seen flat, edge-on and slanting both ways.
const LEAF: readonly Sprite[] = [['aab'], ['a', 'a', 'b'], ['a..', '.ab'], ['..a', 'ba.']];
const leafPalettes = [
  paletteBy<K>((c) => ({ a: c.leafLit, b: c.leaf })),
  paletteBy<K>((c) => ({ a: c.hat, b: c.hatLo })),
  paletteBy<K>((c) => ({ a: c.leaf, b: c.leafLo })),
] as const;

// ---- per-frame layers ----

const deep = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  ctx.drawImage(ditherGradient(f.w, m.back, [c.sky0, c.sky1, c.haze, c.hazeLo]), 0, 0);
  drawSwaying(ctx, f, farLayer(f, c), m.back, 2 * leanOf(f), panOf(f, PAN.far));
  if (rainyOf(c)) mist(ctx, f, m.back, c);
};

const middle = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  drawSwaying(ctx, f, midLayer(f, c), m.back, 3 * leanOf(f), panOf(f, PAN.mid));
  drawSwaying(ctx, f, pathLayer(f, c), f.h, 0, panOf(f, PAN.path));
  if (c.shaft === c.haze) return;
  drawSwaying(ctx, f, shaftLayer(f, c, false), f.h, 0, panOf(f, PAN.mid));
  if (frac(f.beat / 4) < 0.25) drawSwaying(ctx, f, shaftLayer(f, c, true), f.h, 0, panOf(f, PAN.mid));
};

// The rickshaw is already on the path when the shot opens, crosses slowly and comes round again.
const travellers = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  if (nightOf(c)) lanterns(ctx, f, m, c);
  const x = Math.round(wrap(f.w * 0.3 + 80 + f.t * CROSS, f.w + 80) - 80);
  drawRickshaw(ctx, f, x, m.road, c);
};

const front = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  drawSwaying(ctx, f, nearLayer(f, c), f.h, 4 * leanOf(f), panOf(f, PAN.near) - f.w * 0.42);
};

// Leaves come down all the time, faster in the rain, which falls in long streaks over everything.
const air = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const rainy = rainyOf(c);
  flutter(
    ctx,
    f,
    LEAF,
    leafPalettes.map((p) => p(c)),
    { count: Math.round((f.w * f.h) / 2400), seed: 81, fall: rainy ? 18 : 9, drift: 4, sway: 6, spin: 2, top: 0, bottom: f.h },
  );
  if (rainy) rain(ctx, f, c.rain, { count: Math.round((f.w * f.h) / 650), len: 7, slant: 0.1, speed: 150, seed: 83 });
};

const MORNING: Colors<K> = {
  ...{ sky0: '#f6f4cc', sky1: '#d4e8a2', haze: '#a2cc8c', hazeLo: '#78aa78', far: '#86b47c', farLit: '#b0d49a' },
  ...{ stalk: '#4f9a4e', stalkLit: '#92cc6c', stalkLo: '#2e6840', node: '#dcedaa', near: '#2c6a3a', nearLit: '#58a04a' },
  ...{ nearLo: '#18462c', leaf: '#4e9440', leafLit: '#a8d46a', leafLo: '#2a5e34', shaft: '#fff4b8' },
  ...{ path: '#d8c8a0', pathLit: '#efe2bc', pathLo: '#a89470', fence: '#8a6a42', fenceLit: '#b8945e', fenceLo: '#5a4230' },
  ...{ rail: '#dcc88c', ink: '#1a2418', skin: '#f8d2b2', hair: '#2a1e1e', coat: '#262a3a', hat: '#dcbc74', hatLo: '#a8844c' },
  ...{ kimono: '#ec8ea2', kimonoLo: '#b85a78', robe: '#3c4c7e', blanket: '#cc3640', blanketLo: '#8a2030' },
  ...{ lacquer: '#24202a', lacquerLit: '#5e5464', lamp: '#fff0c0', glow: '#ffbe68', rain: '#f6f4cc', mist: '#e4eecc' },
};

// Misty rain: grey-green light, no sun, rain streaks and drifting mist; the passengers share a red paper umbrella.
const RAIN: Colors<K> = {
  ...{ sky0: '#ccd8d0', sky1: '#aabeb2', haze: '#8ca69c', hazeLo: '#6a8880', far: '#7c988e', farLit: '#96aea4' },
  ...{ stalk: '#3e7a5a', stalkLit: '#6ea27a', stalkLo: '#285242', node: '#acc8aa', near: '#24503e', nearLit: '#3e7058' },
  ...{ nearLo: '#163628', leaf: '#3e7458', leafLit: '#72a07a', leafLo: '#234838', shaft: '#8ca69c' },
  ...{ path: '#8c867a', pathLit: '#aaa496', pathLo: '#625e56', fence: '#5e4a38', fenceLit: '#80684e', fenceLo: '#3e3028' },
  ...{ rail: '#a69672', ink: '#141c1a', skin: '#f0cdb0', hair: '#241c1e', coat: '#24283a', hat: '#bca46e', hatLo: '#8a7450' },
  ...{ kimono: '#b48cc8', kimonoLo: '#7e5c9a', robe: '#3a465e', blanket: '#b8343c', blanketLo: '#7a2230' },
  ...{ lacquer: '#1e1c22', lacquerLit: '#4e4a56', lamp: '#fff0c0', glow: '#ffbe68', rain: '#dce8e2', mist: '#c6d4ce' },
};

// The lantern festival at night: paper lanterns along the fences light the stalks gold from below.
const NIGHT: Colors<K> = {
  ...{ sky0: '#0c1430', sky1: '#16243e', haze: '#14303a', hazeLo: '#0e2028', far: '#1e4038', farLit: '#2e5a48' },
  ...{ stalk: '#2e6a48', stalkLit: '#7ab860', stalkLo: '#18402e', node: '#a8d080', near: '#123022', nearLit: '#2a5a38' },
  ...{ nearLo: '#0a1e16', leaf: '#1e4a34', leafLit: '#3e7a4a', leafLo: '#10281e', shaft: '#14303a' },
  ...{ path: '#4a4438', pathLit: '#7a6a50', pathLo: '#2e2a26', fence: '#4a3628', fenceLit: '#8a6438', fenceLo: '#2a1e18' },
  ...{ rail: '#a07a48', ink: '#06080a', skin: '#e8c0a0', hair: '#1a1416', coat: '#1c1e2a', hat: '#a88a54', hatLo: '#76603c' },
  ...{ kimono: '#d87a96', kimonoLo: '#9a4a6a', robe: '#34406a', blanket: '#b02e38', blanketLo: '#701c28' },
  ...{ lacquer: '#1a161e', lacquerLit: '#4a4050', lamp: '#fff2c8', glow: '#ffb050', rain: '#0c1430', mist: '#2a4048' },
};

export const bambooGrove = defineScene<K>({
  id: 'bamboo-grove',
  title: 'Bamboo Path',
  mood: { valence: 0.15, energy: -0.45 },
  styles: ['lofi-loop', 'starlit-dream', 'bossa-cafe', 'celtic-isle', 'vocal-rock'],
  variants: [
    // Morning: low sun slanting through the leaves in long shafts of light.
    { mood: { valence: 0.4, energy: -0.3 }, colors: MORNING },
    { mood: { valence: -0.3, energy: -0.55 }, colors: RAIN },
    { mood: { valence: 0.05, energy: -0.7 }, colors: NIGHT },
  ],
  layers: [deep, middle, travellers, front, air],
});
