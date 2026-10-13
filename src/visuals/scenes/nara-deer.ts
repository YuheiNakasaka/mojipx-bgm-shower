// Nara's deer park in spring: a girl in a straw hat holds out a cracker and the stag bows to her on the beat, a doe
// and her fawn bow too, the five-storey pagoda rises over the blossoms and petals drift across the lawn.
import { type Ctx, drawSprite, drawSpriteFoot, fillRect, flipped, type Sprite } from 'mojipx';
import { bayer, fillColumns, frac, rand, ridgeNoise } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { drawGlow, driftingClouds, fillDither, paletteBy } from './batch-1-helpers.ts';
import { moon } from './batch-2-helpers.ts';
import { pixelLayer, STONE_LANTERN } from './batch-5-helpers.ts';
import { frameLayer } from './batch-6-helpers.ts';
import { drawGirl, type Girl, limb } from './batch-7-helpers.ts';
import { flutter, type Pagoda, type PagodaColors, type Plan, paintPagoda, planOf, puff, skyBase } from './batch-9-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sky3'
  | 'cloud'
  | 'hill'
  | 'tree'
  | 'treeLo'
  | 'blossom'
  | 'blossomLit'
  | 'blossomLo'
  | 'bark'
  | 'grass'
  | 'grassLit'
  | 'grassLo'
  | 'path'
  | 'pathLo'
  | 'stone'
  | 'stoneLo'
  | 'lamp'
  | 'glow'
  | 'white'
  | 'ink'
  | 'deer'
  | 'deerLit'
  | 'deerLo'
  | 'cream'
  | 'skin'
  | 'hair'
  | 'hairLit'
  | 'dress'
  | 'dressLo';

// ---- layout ----

type Spot =
  | 'treeline'
  | 'pagodaX'
  | 'pagodaBase'
  | 'storey'
  | 'hillX'
  | 'hillTop'
  | 'path'
  | 'girlX'
  | 'ground'
  | 'doeX'
  | 'doeY'
  | 'fawnX'
  | 'fawnY';
type Layout = Readonly<Record<Spot, number>>;

const WIDE: Plan<Spot> = {
  treeline: ['h', 0.6],
  pagodaX: ['w', 0.3],
  pagodaBase: ['h', 0.63],
  storey: ['h', 0.042],
  hillX: ['w', 0.74],
  hillTop: ['h', 0.38],
  path: ['h', 0.69],
  girlX: ['w', 0.36],
  ground: ['h', 0.95],
  doeX: ['w', 0.8],
  doeY: ['h', 0.82],
  fawnX: ['w', 0.67],
  fawnY: ['h', 0.85],
};

const TALL: Plan<Spot> = {
  treeline: ['h', 0.5],
  pagodaX: ['w', 0.42],
  pagodaBase: ['h', 0.525],
  storey: ['h', 0.025],
  hillX: ['w', 0.86],
  hillTop: ['h', 0.38],
  path: ['h', 0.585],
  girlX: ['w', 0.2],
  ground: ['h', 0.9],
  doeX: ['w', 0.74],
  doeY: ['h', 0.74],
  fawnX: ['w', 0.36],
  fawnY: ['h', 0.775],
};

const layoutOf = (f: Frame): Layout => planOf(f, WIDE, TALL);

// By day the lanterns' fire boxes are dark stone; a lit color marks the night.
const nightOf = (c: Colors<K>): boolean => c.lamp !== c.stoneLo;

// ---- deer, built from simple shapes so the neck can bow through several poses ----

type V = readonly [number, number];
type Grid = string[][];
type Inside = (x: number, y: number) => boolean;

const gridOf = (w: number, h: number): Grid => Array.from({ length: h }, () => Array.from({ length: w }, () => '.'));

// Marks with ch every cell whose centre lies inside the shape; `over` limits it to cells already holding one of those.
const stamp = (g: Grid, ch: string, inside: Inside, over?: string): void => {
  g.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (inside(x + 0.5, y + 0.5) && (!over || over.includes(cell))) row[x] = ch;
    });
  });
};

const capsule =
  (a: V, b: V, r: number): Inside =>
  (x, y) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy) <= r;
  };

const ellipse =
  (c: V, rx: number, ry: number): Inside =>
  (x, y) =>
    ((x - c[0]) / rx) ** 2 + ((y - c[1]) / ry) ** 2 <= 1;

const NEIGHBOURS: readonly V[] = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
];

// Every empty cell touching the figure becomes outline.
const outlined = (g: Grid): Sprite =>
  g.map((row, y) =>
    row.map((ch, x) => (ch !== '.' || !NEIGHBOURS.some(([dx, dy]) => (g[y + dy]?.[x + dx] ?? '.') !== '.') ? ch : 'o')).join(''),
  );

type Body = { readonly g: Grid; readonly at: (x: number, y: number) => V; readonly s: number };

// Torso, haunch, white rump with its black tail stripe, spots, and four legs (the far pair in shade).
const deerBody = ({ g, at, s }: Body): void => {
  const leg = Math.max(0.8, 1.1 * s);
  stamp(g, 'd', capsule(at(19.5, 24), at(20, 36.5), leg));
  stamp(g, 'd', capsule(at(30, 23), at(32, 29), leg));
  stamp(g, 'd', capsule(at(32, 29), at(31, 36.5), leg));
  stamp(g, 'b', ellipse(at(25, 21), 10 * s, 5.5 * s));
  stamp(g, 'b', ellipse(at(32, 22.5), 3.6 * s, 4.2 * s));
  stamp(g, 'l', (x, y) => ellipse(at(25, 21), 10 * s, 5.5 * s)(x, y) && y < at(0, 17.6)[1]);
  stamp(g, 'c', (x, y) => ellipse(at(24, 21), 9 * s, 5.5 * s)(x, y) && y > at(0, 24)[1]);
  stamp(g, 'w', ellipse(at(34.6, 20), 1.8 * s, 2.8 * s));
  stamp(g, 'k', capsule(at(35.8, 18.5), at(35.8, 21), 0.6 * s));
  for (const [sx, sy] of [
    [19, 19],
    [22, 18],
    [25, 19],
    [28, 18],
    [31, 19],
    [21, 21],
    [24, 20.6],
    [27, 21],
  ] as const)
    stamp(g, 'w', capsule(at(sx, sy), at(sx, sy), 0.45), 'bl');
  stamp(g, 'b', capsule(at(17, 24), at(16.5, 36.5), leg));
  stamp(g, 'b', capsule(at(32.5, 23), at(34.5, 29), leg));
  stamp(g, 'b', capsule(at(34.5, 29), at(33.5, 36.5), leg));
  stamp(g, 'k', (_x, y) => y > at(0, 35.6)[1], 'bd');
};

// The head on its neck: `a` is the neck's lean from upright; the muzzle turns down as the deer bows.
const deerHead = ({ g, at, s }: Body, p: number, stag: boolean): void => {
  const a = 0.55 + p * 1.5;
  const sh = at(18, 19);
  const head: V = [sh[0] - 9.5 * s * Math.sin(a), sh[1] - 9.5 * s * Math.cos(a)];
  const len = Math.hypot(-1 + p * 0.75, 0.35 + p * 0.65);
  const dir: V = [(-1 + p * 0.75) / len, (0.35 + p * 0.65) / len];
  const up: V = [-dir[1], dir[0]];
  const pt = (along: number, rise: number): V => [
    head[0] + (dir[0] * along + up[0] * rise) * s,
    head[1] + (dir[1] * along + up[1] * rise) * s,
  ];
  stamp(g, 'b', capsule(sh, [(sh[0] + head[0]) / 2, (sh[1] + head[1]) / 2], 3 * s));
  stamp(g, 'b', capsule([(sh[0] + head[0]) / 2, (sh[1] + head[1]) / 2], head, 2.2 * s));
  stamp(g, 'd', capsule(pt(-0.6, 2), pt(-1.6, 4.4), 1 * s));
  if (stag) stamp(g, 'a', capsule(pt(-0.4, 2.4), pt(-3.2, 8.5), 0.6));
  stamp(g, 'b', ellipse(head, 3.2 * s, 2.7 * s));
  stamp(g, 'b', capsule(head, pt(4.3, 0), 1.6 * s));
  stamp(g, 'c', capsule(pt(3, -0.9), pt(4.4, -0.9), 0.9 * s));
  stamp(g, 'b', capsule(pt(-1.6, 1.6), pt(-3.6, 3.4), 1.1 * s));
  if (stag) stamp(g, 'a', capsule(pt(-1.5, 5), pt(0.8, 7), 0.55));
  stamp(g, 'k', capsule(pt(5.2, 0), pt(5.2, 0), 0.8));
  const [ex, ey] = pt(0.7, 0.6).map((v) => Math.floor(v - 0.5)) as unknown as V;
  for (const [dx, dy] of [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ] as const) {
    const row = g[ey + dy];
    if (row && ex + dx < row.length) row[ex + dx] = dx === 0 && dy === 0 ? 'e' : 'k';
  }
};

const deerOf = (s: number, p: number, stag: boolean): Sprite => {
  const g = gridOf(Math.ceil(40 * s), Math.ceil(38 * s));
  const body: Body = { g, at: (x, y) => [x * s, y * s], s };
  deerBody(body);
  deerHead(body, p, stag);
  return outlined(g);
};

const POSES = [0, 0.25, 0.5, 0.75, 1] as const;
const STAG = POSES.map((p) => deerOf(1.4, p, true));
const DOE = POSES.map((p) => flipped(deerOf(1, p, false)));
const FAWN = POSES.map((p) => deerOf(0.72, p, false));

const deerPalette = paletteBy<K>((c) => ({
  ...{ o: c.ink, b: c.deer, l: c.deerLit, d: c.deerLo, c: c.cream },
  ...{ w: c.white, k: c.ink, e: c.white, a: c.cream },
}));

/** How far a deer is bowed: once every `every` beats it dips its head and rises again within one beat. */
const bowOf = (beat: number, every: number, offset: number): number => {
  const ph = frac((beat + offset) / every) * every;
  return ph < 1 ? Math.sin(ph * Math.PI) : 0;
};

const poseOf = (poses: readonly Sprite[], bow: number): Sprite => poses[Math.round(bow * (poses.length - 1))] as Sprite;

// ---- the girl ----

// A girl in a straw hat with a ribbon, a blue sailor dress and white socks. o ink, t straw, T ribbon, h hair,
// H its shine, s skin, i iris, e eye light, r blush, m mouth, w white, d dress, D its shade, k shoes.
const GIRL: Sprite = [
  '......oooooooooo......',
  '.....otttttttttto.....',
  '....otttttttttttto....',
  '....oTTTTTTTTTTTTo....',
  '..ooottttttttttttooo..',
  '.ottttttttttttttttttto.',
  'otttttttttttttttttttto',
  '.ooohhhhhhhhhhhhhhooo.',
  '..ohhHHHhhhhhhhhhhho..',
  '.ohhhhhhhhhhhhhhhhhho.',
  '.ohhhshhsssssshhshhho.',
  '.ohhsssssssssssssshho.',
  '.ohsssooossssooosssho.',
  '.ohsssieissssieisssho.',
  '.ohsssiiissssiiisssho.',
  '.ohsrrssssssssssrrsho.',
  '..ohssssssmmssssssho..',
  '...oossssssssssssoo...',
  '......owwwwwwwwo......',
  '.....owwwddddwwwo.....',
  '.....oddddTTddddo.....',
  '....oddddddddddddo....',
  '....oddddddddddddo....',
  '...oddddddddddddddo...',
  '...oDddddddddddddDo...',
  '..oDDddddddddddddDDo..',
  '..oDDDddddddddddDDDo..',
  '..owwwwwwwwwwwwwwwwo..',
  '...oooooooooooooooo...',
  '.......oso..oso.......',
  '.......oso..oso.......',
  '.......owo..owo.......',
  '.......owo..owo.......',
  '......okko.okko.......',
  '......oooo.oooo.......',
];

const GIRL_EYES: Girl = {
  eyes: [
    { x: 6, y: 12, out: -1, w: 3, h: 3 },
    { x: 13, y: 12, out: 1, w: 3, h: 3 },
  ],
  seed: 5,
};

const girlPalette = paletteBy<K>((c) => ({
  ...{ o: c.ink, t: c.cream, T: c.blossomLo, h: c.hair, H: c.hairLit, s: c.skin, i: c.deerLo, e: c.white },
  ...{ r: c.blossom, m: c.blossomLo, w: c.white, d: c.dress, D: c.dressLo, k: c.deerLo },
}));

// A deer cracker: o rim, c biscuit, C its toasted spots.
const CRACKER: Sprite = ['.ooo.', 'occCo', 'oCcco', 'occco', '.ooo.'];
const crackerPalette = paletteBy<K>((c) => ({ o: c.deerLo, c: c.cream, C: c.deer }));

// ---- the backdrop: the grassy hill, the treeline, the pagoda ----

const hillAt = (f: Frame, m: Layout, x: number): number => m.hillTop + ((x - m.hillX) / (f.w * 0.42)) ** 2 * (m.treeline - m.hillTop) * 1.6;

const treelineAt = (m: Layout, x: number): number => m.treeline - 4 - ridgeNoise(x / 7, 13) * 9;

const pagodaOf = (m: Layout): Pagoda => ({
  cx: m.pagodaX,
  base: m.pagodaBase,
  tiers: 5,
  storey: m.storey,
  width: Math.round(m.storey * 2),
  span: Math.round(m.storey * 2.4),
});

const pagodaTones = (c: Colors<K>): PagodaColors => ({
  ...{ roof: c.stoneLo, roofLit: c.stone, under: c.ink, body: c.bark },
  ...{ bodyLit: c.deerLit, panel: c.white, spire: c.ink, spireLit: c.lamp === c.stoneLo ? c.stone : c.lamp },
});

const backdropLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('nara-backdrop', f, c, (g) => {
    const m = layoutOf(f);
    fillColumns(g, f.w, m.treeline + 2, c.hill, (x) => hillAt(f, m, x));
    for (let k = 1; k < 3; k++) fillDither(g, c.grassLit, 0.25, 0, Math.round(m.hillTop + (m.treeline - m.hillTop) * k * 0.3), f.w, 1);
    fillColumns(g, f.w, m.treeline + 2, c.treeLo, (x) => treelineAt(m, x) + 3);
    paintPagoda(g, pagodaOf(m), pagodaTones(c));
    for (let x = 0, i = 0; x < f.w; x += 5, i++) {
      const pink = rand(i, 15) < 0.3;
      puff(g, x, treelineAt(m, x) + 4, 4, pink ? [c.blossomLo, c.blossom, c.blossomLit] : [c.treeLo, c.tree, c.grassLit]);
    }
  });

// ---- cherry trees ----

type Tree = {
  readonly x: number;
  readonly base: number;
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
};

const treesOf = (f: Frame, m: Layout): readonly Tree[] =>
  f.w > f.h
    ? [
        {
          x: Math.round(f.w * 0.05),
          base: m.path - 2,
          cx: Math.round(f.w * 0.06),
          cy: Math.round(f.h * 0.3),
          rx: Math.round(f.w * 0.15),
          ry: Math.round(f.h * 0.2),
        },
        {
          x: Math.round(f.w * 0.95),
          base: m.path - 2,
          cx: Math.round(f.w * 0.96),
          cy: Math.round(f.h * 0.26),
          rx: Math.round(f.w * 0.14),
          ry: Math.round(f.h * 0.19),
        },
      ]
    : [
        {
          x: Math.round(f.w * 0.04),
          base: m.path - 2,
          cx: Math.round(f.w * 0.06),
          cy: Math.round(f.h * 0.17),
          rx: Math.round(f.w * 0.36),
          ry: Math.round(f.h * 0.1),
        },
        {
          x: Math.round(f.w * 0.97),
          base: m.path - 2,
          cx: Math.round(f.w * 1),
          cy: Math.round(f.h * 0.33),
          rx: Math.round(f.w * 0.26),
          ry: Math.round(f.h * 0.07),
        },
      ];

// A trunk leaning up into the crown, lit on its left, and a few boughs spreading under the blossom.
const paintTrunk = (g: Ctx, c: Colors<K>, t: Tree): void => {
  const top = Math.round(t.cy + t.ry * 0.3);
  for (let y = top; y <= t.base; y++) {
    const u = (y - top) / Math.max(1, t.base - top);
    const x = Math.round(t.cx + (t.x - t.cx) * u + Math.sin(u * 3) * 2);
    const half = 2 + Math.round(u * 1.5);
    fillRect(g, c.ink, x - half - 1, y, half * 2 + 3, 1);
    fillRect(g, c.bark, x - half, y, half * 2 + 1, 1);
    fillRect(g, c.deerLo, x - half, y, 1, 1);
  }
  for (let j = 0; j < 4; j++) {
    const ex = t.cx + (rand(j, t.x) - 0.5) * t.rx * 1.6;
    limb(g, t.cx, t.cy + t.ry * 0.35, ex, t.cy + (rand(j, t.x + 1) - 0.2) * t.ry * 0.6, 1, c.bark, c.ink);
  }
};

// Outer puffs first so the crown's middle stays in front and lit.
const paintBlossoms = (g: Ctx, c: Colors<K>, t: Tree): void => {
  const n = Math.round((t.rx * t.ry) / 10);
  const spots = Array.from({ length: n }, (_, i) => ({
    a: rand(i, t.x + 2) * Math.PI * 2,
    d: Math.sqrt(rand(i, t.x + 3)),
    r: 3 + Math.round(rand(i, t.x + 4) * 4),
  }));
  for (const { a, d, r } of spots.sort((p, q) => q.d - p.d))
    puff(g, Math.round(t.cx + Math.cos(a) * d * t.rx), Math.round(t.cy + Math.sin(a) * d * t.ry), r, [
      c.blossomLo,
      c.blossom,
      c.blossomLit,
    ]);
};

const treesLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('nara-trees', f, c, (g) => {
    for (const t of treesOf(f, layoutOf(f))) {
      paintTrunk(g, c, t);
      paintBlossoms(g, c, t);
    }
  });

// ---- the lawn and the gravel path with its stone lanterns ----

const lanternXs = (f: Frame): readonly number[] => (f.w > f.h ? [0.17, 0.53, 0.86] : [0.14, 0.7]).map((k) => Math.round(f.w * k));

// Grass with the shade of the cherry trees on it, sprinkled with fallen petals and clover.
const grassAt = (c: Colors<K>, near: number, r: number, shade: boolean): string => {
  if (r < 0.006 + near * 0.01) return c.blossomLit;
  if (r > 0.997) return c.white;
  if (shade || r < 0.05 + near * 0.12) return c.grassLo;
  return r > 0.97 - near * 0.05 ? c.grassLit : near > 0.35 ? c.grass : c.grassLit;
};

const lawnLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement => {
  const m = layoutOf(f);
  const trees = treesOf(f, m);
  const pathHalf = Math.round(f.h * 0.022);
  return pixelLayer(`nara-lawn:${Object.values(c).join('')}`, f.w, f.h - m.treeline, (x, y0) => {
    const y = y0 + m.treeline;
    const r = rand(x * 7 + y, 61);
    if (Math.abs(y - m.path) <= pathHalf) return r < 0.12 ? c.pathLo : r > 0.94 ? c.white : c.path;
    const shade = trees.some((t) => ((x - t.x) / (t.rx * 0.6)) ** 2 + ((y - t.base - 5) / 5) ** 2 <= 1) && bayer(x, y) < 0.5;
    return grassAt(c, (y - m.treeline) / (f.h - m.treeline), r, shade);
  });
};

const lanternPalette = paletteBy<K>((c) => ({ o: c.ink, h: c.stone, s: c.stone, d: c.stoneLo, L: c.lamp }));

// ---- per-frame layers ----

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  const night = nightOf(c);
  skyBase(ctx, f, { bottom: m.treeline, stops: [c.sky0, c.sky1, c.sky2, c.sky3], stars: night ? [c.white, c.sky3] : null, seed: 19 });
  if (night) moon(ctx, Math.round(f.w * 0.62), Math.round(f.h * 0.12), 7, c.white, c.sky3);
  driftingClouds(ctx, f, c.cloud, c.sky2, { count: 4, top: m.treeline * 0.1, span: m.treeline * 0.4, size: 10, speed: 2, seed: 17 });
};

const backdrop = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(backdropLayer(f, c), 0, 0);
  const m = layoutOf(f);
  ctx.drawImage(lawnLayer(f, c), 0, m.treeline);
  ctx.drawImage(treesLayer(f, c), 0, 0);
};

const lanterns = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  const night = nightOf(c);
  for (const [i, x] of lanternXs(f).entries()) {
    const top = m.path - Math.round(f.h * 0.015) - STONE_LANTERN.length;
    if (night) drawGlow(ctx, c.glow, x, m.path, 18, 5, 0.3);
    if (night) drawGlow(ctx, c.glow, x, top + 7, 12, 10, 0.45 + 0.15 * rand(Math.floor(f.t * 8), i) + f.kick * 0.15);
    drawSprite(ctx, STONE_LANTERN, lanternPalette(c), x - 5, top);
  }
};

const shadow = (ctx: Ctx, c: Colors<K>, x: number, y: number, w: number): void => {
  fillDither(ctx, c.grassLo, 0.75, x - w / 2, y - 1, w, 2);
  fillDither(ctx, c.grassLo, 0.5, x - w / 2 + 2, y + 1, w - 4, 1);
};

const family = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  shadow(ctx, c, m.doeX, m.doeY, 30);
  drawSpriteFoot(ctx, poseOf(DOE, bowOf(f.beat, 4, 1)), deerPalette(c), m.doeX, m.doeY);
  shadow(ctx, c, m.fawnX, m.fawnY, 22);
  drawSpriteFoot(ctx, poseOf(FAWN, bowOf(f.beat, 2, 1)), deerPalette(c), m.fawnX, m.fawnY);
};

// The stag bows to the girl every other beat; she lifts the cracker a little each time.
const meeting = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  const bow = bowOf(f.beat, 2, 0);
  const stag = poseOf(STAG, bow);
  const gx = m.girlX - 11;
  const gy = m.ground - GIRL.length;
  shadow(ctx, c, m.girlX, m.ground, 18);
  shadow(ctx, c, m.girlX + 36, m.ground, 40);
  drawSprite(ctx, stag, deerPalette(c), m.girlX + 7, m.ground - stag.length);
  drawGirl(ctx, f, GIRL, girlPalette(c), gx, gy, GIRL_EYES);
  const lift = bow > 0.5 ? 1 : 0;
  limb(ctx, gx + 17, gy + 21, gx + 22, gy + 19 - lift, 1, c.skin, c.ink);
  drawSprite(ctx, CRACKER, crackerPalette(c), gx + 21, gy + 15 - lift);
};

const PETALS: readonly Sprite[] = [['.a.', 'aab', '.b.'], ['ab.', '.ab'], ['aab'], ['.b.', 'baa', '.a.']];
const petalPalettes = [
  paletteBy<K>((c) => ({ a: c.blossomLit, b: c.blossom })),
  paletteBy<K>((c) => ({ a: c.blossom, b: c.blossomLo })),
  paletteBy<K>((c) => ({ a: c.white, b: c.blossomLit })),
] as const;

const air = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const palettes = petalPalettes.map((p) => p(c));
  flutter(ctx, f, PETALS, palettes, {
    count: Math.round((f.w * f.h) / 1500),
    seed: 91,
    fall: 8,
    drift: 6,
    sway: 5,
    spin: 2.5,
    top: 0,
    bottom: f.h,
  });
};

export const naraDeer = defineScene<K>({
  id: 'nara-deer',
  title: 'Deer Park',
  mood: { valence: 0.6, energy: -0.2 },
  styles: ['cozy-village', 'town-waltz', 'puzzle-pop', 'lofi-loop', 'celtic-isle'],
  variants: [
    {
      // A bright spring noon: blossoms at their fullest and the grassy hill green behind the pagoda.
      mood: { valence: 0.75, energy: 0.2 },
      colors: {
        sky0: '#5aa6e8',
        sky1: '#86c2f0',
        sky2: '#b8dcf4',
        sky3: '#e4f2f4',
        cloud: '#ffffff',
        hill: '#8cc070',
        tree: '#4e8a52',
        treeLo: '#2e5e44',
        blossom: '#f4a8c0',
        blossomLit: '#ffd8e4',
        blossomLo: '#d0708e',
        bark: '#5a3a30',
        grass: '#6cb050',
        grassLit: '#9ccc64',
        grassLo: '#3e7a3a',
        path: '#e2d2ae',
        pathLo: '#b4a07c',
        stone: '#b8b4a8',
        stoneLo: '#6e6a62',
        lamp: '#6e6a62',
        glow: '#ffd890',
        white: '#fff8f0',
        ink: '#2a1a18',
        deer: '#b06a3a',
        deerLit: '#d08e52',
        deerLo: '#7a4426',
        cream: '#f2dcb4',
        skin: '#ffd8bc',
        hair: '#5a3424',
        hairLit: '#8e5a3a',
        dress: '#5aa0e0',
        dressLo: '#3a6eb0',
      },
    },
    {
      // A golden late afternoon: long warm light, peach clouds.
      mood: { valence: 0.45, energy: -0.35 },
      colors: {
        sky0: '#6a8ac8',
        sky1: '#c8a0b8',
        sky2: '#f4c49a',
        sky3: '#ffe6b0',
        cloud: '#fff0d8',
        hill: '#a8b468',
        tree: '#5e7a44',
        treeLo: '#3a4a3a',
        blossom: '#f6a6a8',
        blossomLit: '#ffdcc8',
        blossomLo: '#c86a7a',
        bark: '#523028',
        grass: '#8aaa48',
        grassLit: '#c0c460',
        grassLo: '#4e6a34',
        path: '#ecd0a0',
        pathLo: '#b8946a',
        stone: '#c8b49a',
        stoneLo: '#7a6658',
        lamp: '#7a6658',
        glow: '#ffd890',
        white: '#fff4e4',
        ink: '#2e1a1a',
        deer: '#c06e38',
        deerLit: '#e89a58',
        deerLo: '#80422a',
        cream: '#f8dcb0',
        skin: '#ffd4b0',
        hair: '#4e2c22',
        hairLit: '#8a5236',
        dress: '#e8807a',
        dressLo: '#b05660',
      },
    },
    {
      // A spring night: the stone lanterns lit, the pagoda glowing gold under the moon.
      mood: { valence: 0.15, energy: -0.6 },
      colors: {
        sky0: '#0a0e2a',
        sky1: '#16204a',
        sky2: '#28306a',
        sky3: '#4a3a7a',
        cloud: '#3a4280',
        hill: '#1e3040',
        tree: '#1e3a3c',
        treeLo: '#122428',
        blossom: '#d890b0',
        blossomLit: '#ffd0e0',
        blossomLo: '#8a4a74',
        bark: '#a8683a',
        grass: '#1e4038',
        grassLit: '#2e5a46',
        grassLo: '#0e2624',
        path: '#8a8070',
        pathLo: '#5a5250',
        stone: '#8a8478',
        stoneLo: '#4a4648',
        lamp: '#ffd27a',
        glow: '#ffb050',
        white: '#ffeed8',
        ink: '#0c0a14',
        deer: '#8a5636',
        deerLit: '#d89a5a',
        deerLo: '#55321e',
        cream: '#d8c0a0',
        skin: '#f0c8b0',
        hair: '#2e1e22',
        hairLit: '#6a4646',
        dress: '#6a7ad0',
        dressLo: '#44509a',
      },
    },
  ],
  layers: [sky, backdrop, lanterns, family, meeting, air],
});
