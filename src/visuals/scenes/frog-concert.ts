// A rainy-night concert on a pond: three frogs on lily pads play under leaf and mushroom umbrellas. The singer's
// throat sac balloons on every beat, the drummer taps snail shells and acorn cups, the bassist plucks a bent reed;
// raindrops ring the water in time, hydrangeas bloom along the bank, fireflies drift and the moon shines in the pond.
import { type Ctx, drawSprite, fillRect, mixColor, type Palette, type Sprite } from 'mojipx';
import { disc, ditherGradient, fillColumns, frac, pixelLine, rand, ridgeNoise, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { drawGlow, driftingClouds, paletteBy, wrap } from './batch-1-helpers.ts';
import { moon } from './batch-2-helpers.ts';
import { recentBeats } from './batch-3-helpers.ts';
import { frameLayer, glints, mirrorWater, rain, ring } from './batch-6-helpers.ts';
import { blinking, limb } from './batch-7-helpers.ts';
import { type Plan, planOf, puff } from './batch-9-helpers.ts';
import { outlined } from './batch-12-helpers.ts';
import { arc, type Coat, egg, type Inside, type Mark, sculpt, squashOf, within } from './batch-15-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'cloud'
  | 'moon'
  | 'star'
  | 'rain'
  | 'firefly'
  | 'far'
  | 'bank'
  | 'bankLo'
  | 'leaf'
  | 'leafLo'
  | 'hyd1'
  | 'hyd2'
  | 'hyd3'
  | 'hydLit'
  | 'water'
  | 'waterLo'
  | 'waterLit'
  | 'pad'
  | 'padLo'
  | 'padLit'
  | 'lily'
  | 'lilyLit'
  | 'ink'
  | 'frog'
  | 'frogLo'
  | 'frogLit'
  | 'belly'
  | 'sac'
  | 'toad'
  | 'toadLo'
  | 'tree'
  | 'treeLo'
  | 'eye'
  | 'pupil'
  | 'blush'
  | 'mouth'
  | 'cap'
  | 'capLo'
  | 'dot'
  | 'stem'
  | 'shell'
  | 'shellLo'
  | 'acorn'
  | 'acornLo'
  | 'twig'
  | 'note';

// ---- layout ----

type Spot = 'bankTop' | 'shore' | 'singerX' | 'singerY' | 'drumX' | 'drumY' | 'bassX' | 'bassY' | 'moonX' | 'moonY' | 'crowdY';
type Layout = Readonly<Record<Spot, number>>;

const WIDE: Plan<Spot> = {
  ...{ bankTop: ['h', 0.34], shore: ['h', 0.5], singerX: ['w', 0.5], singerY: ['h', 0.84], drumX: ['w', 0.23] },
  ...{ drumY: ['h', 0.74], bassX: ['w', 0.78], bassY: ['h', 0.76], moonX: ['w', 0.7], moonY: ['h', 0.15], crowdY: ['h', 0.95] },
};

const TALL: Plan<Spot> = {
  ...{ bankTop: ['h', 0.27], shore: ['h', 0.37], singerX: ['w', 0.5], singerY: ['h', 0.8], drumX: ['w', 0.28] },
  ...{ drumY: ['h', 0.6], bassX: ['w', 0.74], bassY: ['h', 0.655], moonX: ['w', 0.7], moonY: ['h', 0.1], crowdY: ['h', 0.95] },
};

const layoutOf = (f: Frame): Layout => planOf(f, WIDE, TALL);

// A color equal to the top of the sky switches its part off: no moon by day, no rain on the clear night.
const shows = (c: Colors<K>, key: K): boolean => c[key] !== c.sky0;

// ---- the sky ----

const skyLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('frog-sky', f, c, (g) => {
    const m = layoutOf(f);
    g.drawImage(ditherGradient(f.w, m.shore, [c.sky0, c.sky1, c.sky2]), 0, 0);
    if (!shows(c, 'moon')) return;
    drawGlow(g, c.moon, m.moonX, m.moonY, 20, 20, shows(c, 'rain') ? 0.4 : 0.3, 3);
    moon(g, m.moonX, m.moonY, 9, c.moon, mixColor(c.moon, c.sky2, 0.3));
  });

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  ctx.drawImage(skyLayer(f, c), 0, 0);
  if (shows(c, 'star')) stars(ctx, f.w, m.bankTop, f.t, [c.star, c.moon, c.firefly], Math.round(f.w / 3), 41, 0.9);
  const count = shows(c, 'rain') ? 6 : 3;
  driftingClouds(ctx, f, c.cloud, c.sky1, { count, top: m.bankTop * 0.15, span: m.bankTop * 0.7, size: 14, speed: 3, seed: 43 });
};

// ---- the bank: a dark line of trees, bushes, and hydrangeas in bloom ----

type Tones = { readonly hue: string; readonly lit: string; readonly shade: string };

// One floret pixel of a bloom of radius r: gaps between florets in shade, the upper left lit, the underside shaded.
const floretAt = (t: Tones, x: number, y: number, dx: number, dy: number, r: number): string => {
  const cell = (((x + 2 * y) % 5) + 5) % 5;
  if (cell === 0) return t.shade;
  if (dx + dy < -r * 0.4 && cell !== 3) return t.lit;
  return dy > r * 0.45 ? t.shade : t.hue;
};

// A mophead of hydrangea: a dome of little four-petalled florets, lit from the upper left.
const paintBloom = (g: Ctx, c: Colors<K>, x: number, y: number, r: number, hue: string): void => {
  const t: Tones = { hue, lit: mixColor(hue, c.hydLit, 0.6), shade: mixColor(hue, c.ink, 0.45) };
  disc(g, x, y, r + 1, () => c.ink);
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.floor(Math.sqrt(r * r - dy * dy));
    for (let dx = -half; dx <= half; dx++) fillRect(g, floretAt(t, x + dx, y + dy, dx, dy, r), x + dx, y + dy, 1, 1);
  }
};

const HUES = ['hyd1', 'hyd2', 'hyd1', 'hyd3'] as const;

// A clump: leafy puffs at its foot and three to five blooms heaped above them.
// `size` scales the whole clump: 1 on the far bank, larger on the near one.
const paintClump = (g: Ctx, c: Colors<K>, x: number, base: number, seed: number, size = 1): void => {
  for (let k = 0; k < 6; k++)
    puff(g, x + Math.round((k * 4 - 10) * size), base - 2 - (k % 2) * 2, Math.round(4 * size), [c.leafLo, c.leaf, c.leaf]);
  const blooms = 3 + Math.floor(rand(seed, 1) * 3);
  for (let k = 0; k < blooms; k++) {
    const bx = x + Math.round((rand(seed, k + 2) - 0.5) * 18 * size);
    const by = base - Math.round((6 + rand(seed, k + 9) * 7) * size);
    paintBloom(g, c, bx, by, Math.round((3 + Math.floor(rand(seed, k + 15) * 2)) * size), c[HUES[(seed + k) % HUES.length] as K]);
  }
};

// The near bank in the bottom corners: a dark mound heaped with big blooms, framing the pond.
const nearLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('frog-near', f, c, (g) => {
    const corners = f.w > f.h ? [0] : [0, 1];
    for (const side of corners) {
      const x = side === 0 ? 0 : f.w;
      const r = Math.round(Math.min(f.w, f.h) * 0.2);
      disc(g, x, f.h + r * 0.55, r, () => c.ink);
      disc(g, x, f.h + r * 0.55, r - 1, () => c.bankLo);
      paintClump(g, c, x + (side === 0 ? 12 : -12), f.h - 6, 30 + side, 1.5);
    }
  });

const near = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(nearLayer(f, c), 0, 0);
};

// Hydrangea clumps along the bank, with a gap behind the singer so the frog reads against open water.
const paintBankClumps = (g: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  for (let i = 0, x = 8; x < f.w; i++, x += 22 + Math.floor(rand(i, 53) * 16)) {
    if (Math.abs(x - m.singerX) > f.w * 0.12) paintClump(g, c, x, m.shore, i);
  }
};

const bankLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('frog-bank', f, c, (g) => {
    const m = layoutOf(f);
    fillColumns(g, f.w, m.shore, c.far, (x) => m.bankTop + 4 - ridgeNoise(x / 12, 51) * (m.shore - m.bankTop) * 0.7);
    for (let x = -4; x < f.w + 8; x += 7) puff(g, x, m.shore - 5 - Math.round(rand(x, 52) * 4), 6, [c.bankLo, c.bank, c.leaf]);
    fillRect(g, c.bankLo, 0, m.shore - 3, f.w, 3);
    paintBankClumps(g, f, m, c);
  });

const bank = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(bankLayer(f, c), 0, 0);
};

// ---- the pond: the bank and the sky mirrored in it, glints, and a raindrop's rings on every beat ----

const dropRings = (ctx: Ctx, f: Frame, c: Colors<K>, m: Layout): void => {
  const drops = Math.round(f.w / 60) + (shows(c, 'rain') ? 3 : 0);
  recentBeats(f.beat, 2, (b, age) => {
    if (age > 1.3) return;
    for (let i = 0; i < drops; i++) {
      const near = rand(b * 13 + i, 81);
      const [x, y] = [rand(b * 13 + i, 82) * f.w, m.shore + 5 + near * (f.h - m.shore - 8)];
      ring(ctx, x, y, 1 + age * (3 + near * 6), 0.32, age < 0.7 ? c.waterLit : c.hydLit);
      if (age < 0.2) fillRect(ctx, c.waterLit, Math.round(x), Math.round(y - 2 - age * 10), 1, 1);
    }
  });
};

const water = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  // Squashed no more than the sky can fill, so the deepest rows still mirror sky rather than repeating its top row.
  const squash = Math.min(1.4, (m.shore - 1) / (f.h - m.shore));
  mirrorWater(ctx, f, { axis: m.shore, bottom: f.h, squash, amp: 1.5, freq: 0.8, speed: 2.2, tint: c.water, tintLevel: 0.5 });
  fillRect(ctx, c.waterLo, 0, m.shore, f.w, 1);
  glints(ctx, f, m.shore + 2, f.h, c.waterLit, Math.round(f.w / 9), 61);
  dropRings(ctx, f, c, m);
};

// ---- lily pads: p pad, L its lit back, d its shaded rim, v veins ----

const padOf = (w: number, h: number): Sprite => {
  const [cx, cy] = [w / 2, h / 2];
  const leaf = within(egg(cx, cy, cx - 1, cy - 1), (x, y) => !(y < cy && Math.abs(x - w * 0.62) < (cy - y) * 1.1));
  const veins: Mark[] = Array.from({ length: 7 }, (_, k): Mark => {
    const a = Math.PI * (0.15 + k * 0.25);
    return [Math.round(cx + Math.cos(a) * (cx - 5)), Math.round(cy + Math.sin(a) * (cy - 2)), 'v'];
  });
  return sculpt(
    w,
    h,
    [
      ['d', leaf],
      ['p', within(leaf, (_x, y) => y < cy + 1.5)],
      ['L', within(leaf, (x, y) => y < cy - 1 && x < cx)],
    ],
    veins,
  );
};

const PAD_BIG = padOf(70, 16);
const PAD = padOf(52, 14);
const PAD_SMALL = padOf(18, 6);

const padPalette = paletteBy<K>((c) => ({ o: c.ink, p: c.pad, L: c.padLit, d: c.padLo, v: c.padLo }));

/** A pad centred on x with its middle at y, bobbing down a pixel when the beat lands on it. */
const drawPad = (ctx: Ctx, c: Colors<K>, pad: Sprite, x: number, y: number, bob: number): void => {
  const w = pad[0]?.length ?? 0;
  ring(ctx, x, y + 2 + bob, w * 0.55, 0.22, c.waterLo);
  drawSprite(ctx, pad, padPalette(c), x - (w >> 1), y - (pad.length >> 1) + bob);
};

// A pink water lily on a small pad of its own.
const LILY: Sprite = outlined(['..L.L..', '.LlLlL.', 'LlyyylL', '.lllll.'], 'o');
const lilyPalette = paletteBy<K>((c) => ({ o: c.ink, l: c.lily, L: c.lilyLit, y: c.note }));

const floaters = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  const spots = f.w > f.h ? [0.08, 0.38, 0.64, 0.93] : [0.12, 0.88];
  for (const [i, k] of spots.entries()) {
    const x = Math.round(f.w * k + Math.sin(f.t * 0.3 + i) * 2);
    const y = Math.round(m.shore + (f.h - m.shore) * (0.2 + 0.55 * rand(i, 91)));
    drawPad(ctx, c, PAD_SMALL, x, y, 0);
    if (i % 2 === 0) drawSprite(ctx, LILY, lilyPalette(c), x - 5, y - 6);
  }
};

// ---- the frogs: o ink, f skin, F its shade, l its shine, b belly, w eye white, n pupil, p blush ----

// The frogs and their gear are modelled in design units and drawn this many pixels to the unit.
const Z = 1.3;
const z = (n: number): number => Math.round(n * Z);
const FROG_W = z(30);

// The head with its two eye bumps; open eyes look up at the rain, shut ones are happy arcs, and a wide smile.
const frogHead = (y: number, shut: boolean): Coat[] => [
  ['o', egg(15, y, 14, 9)],
  ['f', egg(15, y, 13, 8)],
  ['f', egg(8.5, y - 6, 5, 5)],
  ['f', egg(21.5, y - 6, 5, 5)],
  ['l', egg(11, y - 2.5, 4.5, 1.8)],
  ...[8.5, 21.5].flatMap((x): Coat[] =>
    shut
      ? [['o', arc(x, y - 4.6, 2.8, 2, true)]]
      : [
          ['o', egg(x, y - 6, 4.2, 4.2)],
          ['w', egg(x, y - 6, 3.4, 3.4)],
          ['n', egg(x + 0.3, y - 6.6, 1.3, 1.8)],
          ['w', egg(x - 0.2, y - 7.4, 0.6, 0.6)],
        ],
  ),
  ['o', arc(15, y + 1.2, 7.4, 2.4, false)],
  ['p', egg(6, y + 2.5, 2.2, 1.2)],
  ['p', egg(24, y + 2.5, 2.2, 1.2)],
];

// A frog standing on its pad: haunches out to the sides, a pale belly and wide webbed feet. `sq` presses it down.
const standingOf = (sq: number, shut: boolean): Sprite => {
  const hy = 12 + sq;
  return sculpt(
    FROG_W,
    z(32),
    [
      ['F', egg(7 - sq, 26.5, 4.5, 4)],
      ['F', egg(23 + sq, 26.5, 4.5, 4)],
      ['f', egg(15, 24 + sq * 0.5, 9 + sq, 7.5 - sq * 0.5)],
      ['b', egg(15, 25.5 + sq * 0.5, 6 + sq, 5.5 - sq * 0.5)],
      ['f', egg(6 - sq, 30.4, 4.8, 1.6)],
      ['f', egg(24 + sq, 30.4, 4.8, 1.6)],
      ...frogHead(hy, shut),
    ],
    [
      [4 - sq, 31, 'o'],
      [7 - sq, 31, 'o'],
      [23 + sq, 31, 'o'],
      [26 + sq, 31, 'o'],
    ],
    Z,
  );
};

// A frog sitting behind its drums: a squat body whose lower half the drums hide.
const sittingOf = (sq: number, shut: boolean): Sprite => {
  const hy = 11 + sq;
  return sculpt(
    FROG_W,
    z(26),
    [
      ['f', egg(15, 21 + sq * 0.5, 11 + sq, 6.5 - sq * 0.5)],
      ['b', egg(15, 22.5 + sq * 0.5, 7 + sq, 4.5 - sq * 0.5)],
      ...frogHead(hy, shut),
    ],
    [],
    Z,
  );
};

const STANDING = [
  [standingOf(0, false), standingOf(0, true)],
  [standingOf(1, false), standingOf(1, true)],
] as const;

const SITTING = [
  [sittingOf(0, false), sittingOf(0, true)],
  [sittingOf(1, false), sittingOf(1, true)],
] as const;

const frogSkin = (c: Colors<K>, skin: string, shade: string, shine: string): Palette => ({
  ...{ o: c.ink, f: skin, F: shade, l: shine, b: c.belly, w: c.eye, n: c.pupil, p: c.blush },
});

const singerPalette = paletteBy<K>((c) => frogSkin(c, c.frog, c.frogLo, c.frogLit));
const drummerPalette = paletteBy<K>((c) => frogSkin(c, c.toad, c.toadLo, mixColor(c.toad, c.eye, 0.3)));
const bassistPalette = paletteBy<K>((c) => frogSkin(c, c.tree, c.treeLo, mixColor(c.tree, c.eye, 0.35)));

// ---- umbrellas and instruments ----

// Marks of `ch` along points, kept to those inside `shape`.
const marksAlong = (pts: readonly (readonly [number, number])[], shape: Inside, ch: string): Mark[] =>
  pts.filter(([x, y]) => shape(x + 0.5, y + 0.5)).map(([x, y]): Mark => [x, y, ch]);

// A taro leaf held up as an umbrella, its tips drooping: g leaf, G its shaded rim, l a wet shine, v veins.
const leafUmbrellaOf = (): Sprite => {
  const dome = within(egg(20, 11, 19, 10), (_x, y) => y < 11);
  const veins = Array.from({ length: 5 }, (_, k) => Math.PI * (1.17 + k * 0.165)).flatMap((a) =>
    Array.from({ length: 16 }, (_, r): [number, number] => [
      Math.round(20 + Math.cos(a) * (r + 2)),
      Math.round(10.5 + Math.sin(a) * (r + 2) * 0.52),
    ]),
  );
  return sculpt(
    z(40),
    z(13),
    [
      ['g', dome],
      ['g', egg(2.5, 11, 2.4, 1.6)],
      ['g', egg(37.5, 11, 2.4, 1.6)],
      ['G', within(dome, (_x, y) => y > 8)],
      ['l', egg(12, 4.5, 4, 1.2)],
    ],
    marksAlong(veins, dome, 'v'),
    Z,
  );
};

// A toadstool umbrella: r cap, R its shade, d white spots, g the gills underneath.
const mushroomOf = (): Sprite => {
  const cap = within(egg(16, 11, 15, 10), (_x, y) => y < 10);
  return sculpt(
    z(32),
    z(12),
    [
      ['r', cap],
      ['R', within(cap, (x, y) => y > 7.5 || x > 26)],
      ['d', egg(10, 4, 2.6, 2)],
      ['d', egg(19.5, 2.8, 2, 1.5)],
      ['d', egg(25, 6.5, 2, 1.6)],
      ['d', egg(5.5, 8, 1.8, 1.3)],
      ['d', egg(16, 7.5, 2.2, 1.4)],
      ['m', (x, y) => y >= 10 && Math.abs(x - 16) < 13],
    ],
    [],
    Z,
  );
};

// A snail shell lying on its side, its spiral drawn in: s shell, S the spiral, h shine.
const shellOf = (r: number): Sprite => {
  const body = egg(r + 1, r + 1, r, r * 0.9);
  const turns = Array.from({ length: 80 }, (_, i): [number, number] => {
    const a = (i / 80) * Math.PI * 4;
    const d = 0.6 + (a / (Math.PI * 4)) * (r - 1.6);
    return [Math.round(r + 0.5 + Math.cos(a) * d), Math.round(r + 0.5 + Math.sin(a) * d * 0.9)];
  });
  return sculpt(
    z(r * 2 + 2),
    z(r * 2 + 2),
    [
      ['s', body],
      ['h', egg(r * 0.7, r * 0.55, r * 0.35, r * 0.22)],
    ],
    marksAlong(turns, body, 'S'),
    Z,
  );
};

// An acorn cup turned upside down for a drum: a scaly dome with the nub of its stalk on top.
const acornOf = (w: number): Sprite => {
  const h = Math.ceil(w * 0.6);
  const dome = within(egg(w / 2, h, w / 2 - 1, h - 1.5), (_x, y) => y < h - 0.5);
  return sculpt(
    z(w),
    z(h),
    [
      ['a', dome],
      ['A', within(dome, (x, y) => (Math.floor(x) + Math.floor(y) * 2) % 4 === 0)],
      ['A', within(dome, (_x, y) => y > h - 2)],
    ],
    [[Math.floor(w / 2), 1, 'A']],
    Z,
  );
};

const LEAF_UMBRELLA = leafUmbrellaOf();
const MUSHROOM = mushroomOf();
const SHELL_BIG = shellOf(7);
const SHELL_SMALL = shellOf(4);
const ACORN = acornOf(12);

const gearPalette = paletteBy<K>((c) => ({
  ...{ o: c.ink, g: c.leaf, G: c.leafLo, l: c.padLit, v: c.leafLo, r: c.cap, R: c.capLo, d: c.dot },
  ...{ m: c.stem, s: c.shell, S: c.shellLo, h: c.dot, a: c.acorn, A: c.acornLo },
}));

// ---- the singer: its throat sac balloons on every beat, eyes shut in bliss while it calls ----

/** How full the throat sac is: it swells and empties within the first part of every beat. */
const sacOf = (f: Frame): number => {
  const ph = frac(f.beat);
  return ph < 0.6 ? Math.sin((ph / 0.6) * Math.PI) : 0;
};

// The sac as a bubble under the chin: outlined, shaded along its bottom, with a bright shine.
const sac = (ctx: Ctx, c: Colors<K>, x: number, y: number, k: number): void => {
  if (k < 0.15) return;
  const [rx, ry] = [z(3 + 7 * k), z(2 + 5 * k)];
  const shade = mixColor(c.sac, c.mouth, 0.35);
  for (let dy = -ry - 1; dy <= ry + 1; dy++) {
    const outer = Math.round((rx + 1) * Math.sqrt(Math.max(0, 1 - (dy / (ry + 1)) ** 2)));
    const inner = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy / ry) ** 2)));
    fillRect(ctx, c.ink, x - outer, y + dy, outer * 2 + 1, 1);
    if (Math.abs(dy) <= ry) fillRect(ctx, dy > ry * 0.5 ? shade : c.sac, x - inner, y + dy, inner * 2 + 1, 1);
  }
  fillRect(ctx, c.eye, x - Math.round(rx * 0.5), y - Math.round(ry * 0.5), 2, 2);
  fillRect(ctx, c.eye, x - Math.round(rx * 0.5) + 3, y - Math.round(ry * 0.5), 1, 1);
};

type P = readonly [number, number];

const lerp = (a: P, b: P, k: number): P => [Math.round(a[0] + (b[0] - a[0]) * k), Math.round(a[1] + (b[1] - a[1]) * k)];

// A thin frog arm ending in a round fingertip.
const arm = (ctx: Ctx, c: Colors<K>, from: P, to: P, skin: string): void => {
  limb(ctx, from[0], from[1], to[0], to[1], 2, skin, c.ink);
  disc(ctx, to[0], to[1], 2, () => c.ink);
  disc(ctx, to[0], to[1], 1, () => skin);
};

// Rain runs off an umbrella's tips: a drop gathers and falls on every beat, and drops splash on its top.
const drips = (ctx: Ctx, f: Frame, c: Colors<K>, x0: number, x1: number, y: number): void => {
  if (!shows(c, 'rain')) return;
  const q = frac(f.beat + 0.3);
  for (const x of [x0, x1]) fillRect(ctx, c.waterLit, x, y + Math.round(q * q * 12), 1, 2);
  if (q > 0.85) return;
  const b = Math.floor(f.beat);
  for (let i = 0; i < 2; i++)
    fillRect(ctx, c.waterLit, Math.round(x0 + 6 + rand(b, i) * (x1 - x0 - 12)), y - z(13) - Math.round(q * 4), 1, 1);
};

const singer = (ctx: Ctx, f: Frame, c: Colors<K>, m: Layout): void => {
  const sq = squashOf(f, 0.25);
  const k = sacOf(f);
  const [x, top] = [m.singerX, m.singerY + sq - z(33)];
  const hand: P = [x - z(13), top + z(19)];
  const canopy: P = [x - z(6), top - z(7)];
  drawPad(ctx, c, PAD, x, m.singerY, sq);
  limb(ctx, hand[0], hand[1] + 3, canopy[0], canopy[1], 1, c.stem, c.ink);
  drawSprite(ctx, STANDING[sq][k > 0.5 ? 1 : 0], singerPalette(c), x - (FROG_W >> 1), top);
  arm(ctx, c, [x - z(8), top + z(20)], hand, c.frog);
  const lift = Math.sin(frac(f.beat / 2) * Math.PI);
  arm(ctx, c, [x + z(8), top + z(20)], lerp([x + z(15), top + z(21)], [x + z(17), top + z(9)], lift), c.frog);
  sac(ctx, c, x, top + z(19 + sq + 4 * k), k);
  drawSprite(ctx, LEAF_UMBRELLA, gearPalette(c), canopy[0] - z(20), canopy[1] - z(11));
  drips(ctx, f, c, canopy[0] - z(19), canopy[0] + z(18), canopy[1] + 1);
};

// A spark where a stick lands on a drum.
const spark = (ctx: Ctx, c: Colors<K>, x: number, y: number): void => {
  fillRect(ctx, c.note, x - 3, y - 2, 1, 1);
  fillRect(ctx, c.note, x, y - 4, 1, 2);
  fillRect(ctx, c.note, x + 3, y - 2, 1, 1);
};

// One drumming arm: raised between hits, the stick's tip down on the drum (`at`) when it lands.
const stroke = (ctx: Ctx, c: Colors<K>, shoulder: P, at: P, side: number, down: boolean): void => {
  const hand: P = down ? [at[0] - side, at[1] - z(4)] : [shoulder[0] + side * z(4), shoulder[1] - z(6)];
  const tip: P = down ? at : [hand[0] + side * z(5), hand[1] - z(5)];
  arm(ctx, c, shoulder, hand, c.toad);
  limb(ctx, hand[0], hand[1], tip[0], tip[1], 1, c.twig, c.ink);
  if (down) spark(ctx, c, at[0], at[1]);
};

// The drummer under a toadstool: the right stick on a snail shell with the kick, the left on an acorn cup with the
// snare (or on the off-beat when there is none), the big shell in front thumping with every kick.
const drummer = (ctx: Ctx, f: Frame, c: Colors<K>, m: Layout): void => {
  const sq = squashOf(f, 0.25, 0.5);
  const [x, y] = [m.drumX, m.drumY + sq];
  const kick = f.kick > 0.6 ? 1 : 0;
  const snare = f.snare > 0.6 || (f.snare < 0.05 && frac(f.beat) > 0.5 && frac(f.beat) < 0.62);
  drawPad(ctx, c, PAD_BIG, m.drumX, m.drumY, sq);
  limb(ctx, x + z(13), y - 2, x + z(6), y - z(34), 1, c.stem, c.ink);
  drawSprite(ctx, SITTING[sq][kick], drummerPalette(c), x - (FROG_W >> 1), y - z(27));
  drawSprite(ctx, ACORN, gearPalette(c), x - z(23), y - z(9) + (snare ? 1 : 0));
  drawSprite(ctx, SHELL_SMALL, gearPalette(c), x + z(12), y - z(11) + kick);
  drawSprite(ctx, SHELL_BIG, gearPalette(c), x - z(8), y - z(15) + kick);
  stroke(ctx, c, [x - z(9), y - z(13)], [x - z(17), y - z(9)], -1, snare);
  stroke(ctx, c, [x + z(9), y - z(13)], [x + z(16), y - z(11)], 1, kick === 1);
  drawSprite(ctx, MUSHROOM, gearPalette(c), x - z(10), y - z(46));
  drips(ctx, f, c, x - z(9), x + z(21), y - z(34));
};

// A small leaf worn as a rain hat, its stalk curling up.
const LEAF_HAT: Sprite = sculpt(
  z(18),
  z(8),
  [
    ['g', egg(9, 5.5, 8.2, 2.6)],
    ['G', within(egg(9, 5.5, 8.2, 2.6), (_x, y) => y > 6.5)],
  ],
  [[9, 1, 'G'], [9, 2, 'G'], [10, 0, 'G'], ...Array.from({ length: 11 }, (_, k): Mark => [4 + k, 5, 'v'])],
  Z,
);

// The bass: a reed bent into a bow by a string of grass, a cattail nodding on top.
const reed = (ctx: Ctx, c: Colors<K>, base: P, tip: P): void => {
  const ctrl: P = [base[0] + z(10), (base[1] + tip[1]) / 2];
  let prev = base;
  for (let i = 1; i <= 8; i++) {
    const t = i / 8;
    const pt: P = [
      (1 - t) ** 2 * base[0] + 2 * (1 - t) * t * ctrl[0] + t * t * tip[0],
      (1 - t) ** 2 * base[1] + 2 * (1 - t) * t * ctrl[1] + t * t * tip[1],
    ];
    limb(ctx, prev[0], prev[1], pt[0], pt[1], 2, c.leaf, c.ink);
    prev = pt;
  }
  limb(ctx, tip[0], tip[1] - 2, tip[0], tip[1] - z(10), 3, c.acorn, c.ink);
  fillRect(ctx, c.acornLo, tip[0] + 1, tip[1] - z(10), 1, z(9));
  fillRect(ctx, c.ink, tip[0], tip[1] - z(15), 1, z(3));
};

// The string, still between beats and shivering just after each pluck.
const bassString = (ctx: Ctx, f: Frame, c: Colors<K>, base: P, tip: P): void => {
  const shiver = (1 - frac(f.beat)) ** 3;
  const mid: P = [Math.round((base[0] + tip[0]) / 2 + Math.sin(f.t * 80) * 2 * shiver), Math.round((base[1] + tip[1]) / 2)];
  pixelLine(ctx, base[0], base[1], mid[0], mid[1], c.dot);
  pixelLine(ctx, mid[0], mid[1], tip[0], tip[1], c.dot);
};

// The bassist pulls the reed taut with one hand and plucks the string with the other on every beat.
const bassist = (ctx: Ctx, f: Frame, c: Colors<K>, m: Layout): void => {
  const sq = squashOf(f, 0.25, 0.5);
  const [x, y] = [m.bassX, m.bassY + sq];
  const [base, tip]: [P, P] = [
    [x + z(15), y - 2],
    [x + z(17), y - z(50)],
  ];
  drawPad(ctx, c, PAD, m.bassX, m.bassY, sq);
  reed(ctx, c, base, tip);
  bassString(ctx, f, c, base, tip);
  drawSprite(ctx, STANDING[sq][frac(f.beat) < 0.2 ? 1 : 0], bassistPalette(c), x - (FROG_W >> 1), y - z(33));
  drawSprite(ctx, LEAF_HAT, gearPalette(c), x - z(10), y - z(36));
  arm(ctx, c, [x + z(8), y - z(13)], [x + z(21), y - z(27)], c.tree);
  const pluck = frac(f.beat) < 0.15 ? 3 : 0;
  arm(ctx, c, [x - z(7), y - z(12)], [x + z(14) + pluck, y - z(17) + pluck], c.tree);
};

const band = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  drummer(ctx, f, c, m);
  bassist(ctx, f, c, m);
  singer(ctx, f, c, m);
};

// ---- the audience: little frogs peeking out of the water, bobbing to the beat ----

const peekOf = (shut: boolean): Sprite =>
  sculpt(
    16,
    8,
    [
      ['f', egg(8, 9.5, 7.5, 4.5)],
      ['f', egg(4.5, 4.5, 3.6, 3.6)],
      ['f', egg(11.5, 4.5, 3.6, 3.6)],
      ...(shut
        ? []
        : ([
            ['o', egg(4.5, 4.5, 2.8, 2.8)],
            ['o', egg(11.5, 4.5, 2.8, 2.8)],
            ['w', egg(4.5, 4.5, 2.1, 2.1)],
            ['w', egg(11.5, 4.5, 2.1, 2.1)],
          ] as Coat[])),
    ],
    shut
      ? [
          [3, 4, 'o'],
          [4, 3, 'o'],
          [5, 4, 'o'],
          [10, 4, 'o'],
          [11, 3, 'o'],
          [12, 4, 'o'],
        ]
      : [
          [4, 3, 'n'],
          [5, 3, 'n'],
          [11, 3, 'n'],
          [12, 3, 'n'],
        ],
  );

const PEEK = [peekOf(false), peekOf(true)] as const;
const peekPalettes = [singerPalette, drummerPalette, bassistPalette, singerPalette] as const;

const audience = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  const n = Math.max(3, Math.round(f.w / 55));
  for (let i = 0; i < n; i++) {
    const x = Math.round(((i + 0.5) / n) * f.w + (rand(i, 101) - 0.5) * 20);
    const y = m.crowdY - Math.round(rand(i, 102) * 6) - (frac(f.beat + i * 0.25) < 0.3 ? 1 : 0);
    const shut = blinking(f.t, i + 7) ? 1 : 0;
    drawSprite(ctx, PEEK[shut], (peekPalettes[i % 4] ?? singerPalette)(c), x - 8, y - 8);
    fillRect(ctx, c.waterLit, x - 9, y, 18, 1);
    fillRect(ctx, c.water, x - 7, y + 1, 14, 1);
  }
};

// ---- foreground reeds, music notes, fireflies and the rain ----

const reeds = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const sides = f.w > f.h ? [0.02, 0.05, 0.94, 0.975] : [0.03, 0.96];
  for (const [i, k] of sides.entries()) {
    const [x, tall] = [Math.round(f.w * k), Math.round(f.h * (0.3 + 0.12 * rand(i, 111)))];
    const sway = Math.sin(f.t * 0.9 + i * 1.3) * 2.5;
    limb(ctx, x, f.h, x + sway, f.h - tall, 1, c.leafLo, c.ink);
    limb(ctx, x, f.h, x - 8 + sway * 0.5, f.h - tall * 0.55, 1, c.leaf, c.ink);
    limb(ctx, x + sway, f.h - tall - 2, x + sway, f.h - tall - 9, 3, c.acorn, c.ink);
  }
};

const NOTES: readonly Sprite[] = [
  outlined(['..nn.', '..n.n', '..n..', 'nnn..', 'nnn..'], 'o'),
  outlined(['.nnnnn', '.n...n', '.n...n', 'nn..nn', 'nn..nn'], 'o'),
];
const notePalette = paletteBy<K>((c) => ({ o: c.ink, n: c.note }));

// A note floats up from the singer on every beat, sways and is gone two beats later.
const notes = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  recentBeats(f.beat, 2, (b, age) => {
    const x = m.singerX + 10 + Math.round(age * 8 + Math.sin(age * 4 + b) * 3);
    const y = m.singerY - 40 - Math.round(age * 12);
    if (age < 1.7) drawSprite(ctx, NOTES[b & 1] ?? (NOTES[0] as Sprite), notePalette(c), x, y);
  });
};

const CROSS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

const fireflies = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  if (!shows(c, 'firefly')) return;
  const m = layoutOf(f);
  const n = shows(c, 'rain') ? 5 : Math.round(f.w / 14);
  for (let i = 0; i < n; i++) {
    const glow = Math.sin(f.t * (1.1 + rand(i, 121)) + i * 1.7);
    if (glow < 0.1) continue;
    const x = wrap(rand(i, 122) * f.w + Math.sin(f.t * 0.35 + i) * 18 + f.t * 2, f.w);
    const y = m.shore - 18 + rand(i, 123) * (f.h - m.shore) * 0.7 + Math.sin(f.t * 0.6 + i * 2.1) * 6;
    const [px, py] = [Math.round(x), Math.round(y)];
    drawGlow(ctx, c.firefly, px, py, 3, 3, 0.35 * glow);
    if (glow > 0.6) for (const [dx, dy] of CROSS) fillRect(ctx, c.firefly, px + dx, py + dy, 1, 1);
    fillRect(ctx, c.eye, px, py, 1, 1);
  }
};

const air = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  notes(ctx, f, c);
  fireflies(ctx, f, c);
  if (shows(c, 'rain')) rain(ctx, f, c.rain, { count: Math.round((f.w * f.h) / 420), len: 5, slant: 0.18, speed: 150, seed: 7 });
};

export const frogConcert = defineScene<K>({
  id: 'frog-concert',
  title: 'Frog Chorus',
  mood: { valence: 0.45, energy: 0.1 },
  styles: ['island-breeze', 'cozy-village', 'band-rock', 'lofi-loop', 'vocal-rock'],
  variants: [
    {
      // A rainy night: a hazy moon behind the rain, the pond dark and ringing with drops.
      mood: { valence: 0.25, energy: 0 },
      colors: {
        ...{ sky0: '#0c1430', sky1: '#1a2850', sky2: '#2e3e6c', cloud: '#26305c', moon: '#e8e4c8', star: '#0c1430' },
        ...{ rain: '#6a80b8', firefly: '#d8f070', far: '#101c30', bank: '#1c3a3a', bankLo: '#12282a' },
        ...{ leaf: '#2e6a4a', leafLo: '#1c4636', hyd1: '#5a7ae0', hyd2: '#8a6ad8', hyd3: '#d070b0', hydLit: '#b8c8ff' },
        ...{ water: '#1a2c50', waterLo: '#0e1a34', waterLit: '#5a78b0', pad: '#3a8a4a', padLo: '#245e38', padLit: '#6ab45a' },
        ...{ lily: '#f0a0c0', lilyLit: '#fff0f4', ink: '#0a0a18', frog: '#5ab83c', frogLo: '#357a2c', frogLit: '#9ade5a' },
        ...{ belly: '#f0f0c0', sac: '#ffc8dc', toad: '#c8803a', toadLo: '#8a5028', tree: '#3ab0b8', treeLo: '#26768a' },
        ...{ eye: '#ffffff', pupil: '#101018', blush: '#ff8aa0', mouth: '#b83a4a', cap: '#e04a3a', capLo: '#a02c2c' },
        ...{ dot: '#fff4e0', stem: '#f0e0c0', shell: '#f0dcb0', shellLo: '#8a5030', acorn: '#a86a32', acornLo: '#6a4020' },
        ...{ twig: '#7a5230', note: '#ffe890' },
      },
    },
    {
      // A rainy-season afternoon: soft grey light, the hydrangeas at their bluest, the pond pale with the sky.
      mood: { valence: 0.65, energy: 0.3 },
      colors: {
        ...{ sky0: '#8aa0c8', sky1: '#aabcd8', sky2: '#d0dce8', cloud: '#e8eef4', moon: '#8aa0c8', star: '#8aa0c8' },
        ...{ rain: '#e8f0ff', firefly: '#8aa0c8', far: '#5a7a7a', bank: '#4a8a5a', bankLo: '#356a48' },
        ...{ leaf: '#4a9a5a', leafLo: '#2e6a44', hyd1: '#4a7ee8', hyd2: '#8a70e0', hyd3: '#e88ac0', hydLit: '#c8d8ff' },
        ...{ water: '#7a98c0', waterLo: '#5a7aa4', waterLit: '#d8e4f4', pad: '#4aa04a', padLo: '#2e7a3a', padLit: '#8ad064' },
        ...{ lily: '#f8a8c8', lilyLit: '#fff4f8', ink: '#1a2228', frog: '#64c43c', frogLo: '#3a8a30', frogLit: '#a8e870' },
        ...{ belly: '#fafad0', sac: '#ffd0e4', toad: '#d88a40', toadLo: '#9a5a2c', tree: '#40c0c8', treeLo: '#2a8496' },
        ...{ eye: '#ffffff', pupil: '#141418', blush: '#ff90a0', mouth: '#c03c4c', cap: '#e85040', capLo: '#b03430' },
        ...{ dot: '#fff8e8', stem: '#f4e6c8', shell: '#f4e2b8', shellLo: '#9a5c34', acorn: '#b0723a', acornLo: '#744826' },
        ...{ twig: '#80583a', note: '#ffffff' },
      },
    },
    {
      // A clear night after the rain: stars, a bright moon on still water and fireflies everywhere.
      mood: { valence: 0.45, energy: -0.25 },
      colors: {
        ...{ sky0: '#0a0c28', sky1: '#18184a', sky2: '#2e2a64', cloud: '#2a2a5a', moon: '#fff4d0', star: '#e8e8ff' },
        ...{ rain: '#0a0c28', firefly: '#e8ff80', far: '#0e1228', bank: '#18303a', bankLo: '#10202a' },
        ...{ leaf: '#285a48', leafLo: '#183c34', hyd1: '#6a80e8', hyd2: '#9a74e0', hyd3: '#e07cc0', hydLit: '#c8ccff' },
        ...{ water: '#161c48', waterLo: '#0c1030', waterLit: '#7088d0', pad: '#348048', padLo: '#205634', padLit: '#64ac58' },
        ...{ lily: '#f4a6c8', lilyLit: '#fff2f8', ink: '#08081a', frog: '#58b440', frogLo: '#34782e', frogLit: '#96da60' },
        ...{ belly: '#eeeec4', sac: '#ffc4dc', toad: '#c47c3c', toadLo: '#864c2a', tree: '#38aab4', treeLo: '#247088' },
        ...{ eye: '#ffffff', pupil: '#0e0e16', blush: '#ff88a4', mouth: '#b4384c', cap: '#dc4838', capLo: '#9c2c2c' },
        ...{ dot: '#fff4e0', stem: '#ecdcc0', shell: '#e8d4a8', shellLo: '#86502e', acorn: '#a46830', acornLo: '#683e20' },
        ...{ twig: '#765030', note: '#fff0a0' },
      },
    },
  ],
  layers: [sky, bank, water, floaters, band, audience, near, reeds, air],
});
