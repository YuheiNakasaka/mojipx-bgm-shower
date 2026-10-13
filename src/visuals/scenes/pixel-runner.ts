// A tiny hooded runner with a trailing scarf dashes over parallax hills. The world scrolls a fixed distance per beat,
// so every crate, rock and stump sits half a beat after a downbeat: the hero takes off on the beat and lands on the next.
import { type Ctx, drawSpriteFoot, fillRect, type Palette, type Sprite } from 'mojipx';
import { bayer, disc, ditherGradient, frac, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { memoLayer, paletteOf, sigOf } from './batch-3-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sun'
  | 'cloud'
  | 'cloudShade'
  | 'hillFar'
  | 'hillNear'
  | 'tree'
  | 'grass'
  | 'grassLight'
  | 'dirt'
  | 'dirtDark'
  | 'outline'
  | 'hood'
  | 'hoodLight'
  | 'skin'
  | 'tunic'
  | 'boots'
  | 'scarf'
  | 'coin'
  | 'coinLight'
  | 'wood'
  | 'woodDark'
  | 'stone'
  | 'stoneDark';

// ---- sprites (facing right) ----

const HEAD = [
  '....oooo....',
  '..oohhhhoo..',
  '.ohHHhhhhho.',
  '.ohHhhhhhhho',
  'ohhhhhsssso.',
  'ohhhhssosso.',
  'ohhhhssosso.',
  '.ohhhssssso.',
  '..oohhssso..',
] as const;

const RUN_A: Sprite = [...HEAD, '...obbbbo...', '..obbbbbbo..', '.osobbbbos..', '...obbbbo...', '..of.oo.fo..', '.off....ffo.'];

const RUN_B: Sprite = [...HEAD, '...obbbbo...', '...obbbbso..', '...osbbbo...', '...obbbbo...', '....offo....', '....offo....'];

const JUMP: Sprite = [...HEAD, '.os.obbbo.so', '..oobbbbboo.', '...obbbbo...', '...obbbbo...', '..offo.offo.', '............'];

const CRATE: Sprite = [
  'oooooooooo',
  'owwwwwwwwo',
  'oWoooooWWo',
  'owWwwwwWwo',
  'owwWwwWwwo',
  'owwwWWwwwo',
  'owwWwwWwwo',
  'owWwwwwWwo',
  'oWoooooWWo',
  'oooooooooo',
];

const ROCK: Sprite = ['....oooo....', '..oossssoo..', '.osssssSsso.', 'ossSssssSSso', 'osssssSSsSso', 'oSsssSSSSSSo', 'oooooooooooo'];

const STUMP: Sprite = [
  '..oooooo..',
  '.oWwwwwWo.',
  '.owWWWWwo.',
  '.oWwwwwWo.',
  '.owwwWwwo.',
  '.owWwwwwo.',
  '.owwwwWwo.',
  'oowwWwwwoo',
  'oooooooooo',
];

const HURDLES = { crate: CRATE, rock: ROCK, stump: STUMP } as const;

const heroPalette = (c: Colors<K>): Palette => ({
  o: c.outline,
  h: c.hood,
  H: c.hoodLight,
  s: c.skin,
  b: c.tunic,
  f: c.boots,
});
const propPalette = (c: Colors<K>): Palette => ({ o: c.outline, w: c.wood, W: c.woodDark, s: c.stone, S: c.stoneDark });

// ---- the course: everything is placed by beat index ----

type Course = { readonly ground: number; readonly hero: number; readonly speed: number; readonly jump: number };

const courseOf = (f: Frame): Course => ({
  ground: Math.round(f.h * (f.h > f.w ? 0.8 : 0.76)),
  hero: Math.round(f.w * 0.3),
  speed: 26,
  jump: 24,
});

type Hurdle = 'crate' | 'rock' | 'stump' | null;

// Obstacles mostly on even beats; an odd beat gets one only when the even beat before it was clear, so the hero
// always lands before the next take-off.
const hurdleAt = (n: number): Hurdle => {
  const even = n % 2 === 0;
  if (!even && rand(n - 1, 5) < 0.75) return null;
  if (rand(n, 5) >= (even ? 0.75 : 0.5)) return null;
  const kind = rand(n, 6);
  return kind < 0.4 ? 'crate' : kind < 0.7 ? 'rock' : 'stump';
};

const hasCoin = (n: number): boolean => hurdleAt(n) !== null && rand(n, 7) < 0.65;

// Screen x of the thing crossed half a beat after beat n.
const hurdleX = (f: Frame, k: Course, n: number): number => Math.round(k.hero + k.speed * (n + 0.5 - f.beat));

const heroLift = (f: Frame, k: Course): number => {
  const n = Math.floor(f.beat);
  if (!hurdleAt(n)) return 0;
  const p = frac(f.beat);
  return Math.round(k.jump * 4 * p * (1 - p));
};

// ---- scenery tiles: each repeats horizontally with a period, so it can scroll forever ----

const wave = (x: number, period: number, parts: readonly (readonly [number, number, number])[]): number =>
  parts.reduce((s, [freq, amp, phase]) => s + amp * Math.sin((x / period) * Math.PI * 2 * freq + phase), 0);

const hillTile = (key: string, period: number, h: number, color: string, top: (x: number) => number): HTMLCanvasElement =>
  memoLayer(key, period, h, (g) => {
    g.fillStyle = color;
    for (let x = 0; x < period; x++) {
      const y = Math.round(top(x));
      g.fillRect(x, y, 1, h - y);
    }
  });

const treeTile = (period: number, h: number, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`runner-trees:${period}x${h}:${sigOf(c)}`, period, h, (g) => {
    const top = (x: number): number =>
      h * 0.55 +
      wave(x, period, [
        [1, h * 0.12, 0.4],
        [3, h * 0.06, 1.1],
      ]);
    g.fillStyle = c.hillNear;
    for (let x = 0; x < period; x++) g.fillRect(x, Math.round(top(x)), 1, h);
    for (let i = 0; i < 6; i++) {
      const x = Math.round(((i + 0.5) / 6) * period + (rand(i, 51) - 0.5) * 12);
      const base = Math.round(top(x)) + 2;
      const r = 4 + Math.round(rand(i, 52) * 3);
      fillRect(g, c.tree, x, base - r - 3, 1, r + 3);
      disc(g, x, base - r - 4, r, (dy) => (dy < -r * 0.3 ? c.hillNear : c.tree));
    }
  });

// Soil darkens with depth; pebbles are scattered by hash so the 32-pixel tile repeats without a seam.
const soil = (x: number, y: number): number =>
  0.15 + 0.25 * rand(Math.floor(x / 8) + Math.floor(y / 6) * 7, 61) + Math.max(0, (y - 24) / 90);

const groundTile = (h: number, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`runner-ground:${h}:${sigOf(c)}`, 32, h, (g) => {
    fillRect(g, c.dirt, 0, 0, 32, h);
    for (let y = 4; y < h; y++) for (let x = 0; x < 32; x++) if (bayer(x, y) < soil(x, y)) fillRect(g, c.dirtDark, x, y, 1, 1);
    for (let i = 0; i < Math.round(h / 12); i++)
      fillRect(g, c.stone, Math.floor(rand(i, 65) * 30), 8 + Math.floor(rand(i, 66) * (h - 10)), 2, 1);
    fillRect(g, c.grass, 0, 0, 32, 4);
    for (let x = 0; x < 32; x++) if (rand(x, 62) < 0.4) fillRect(g, c.grass, x, 4, 1, 1 + Math.round(rand(x, 63)));
    for (let x = 0; x < 32; x += 3) fillRect(g, c.grassLight, x + Math.round(rand(x, 64) * 2), 0, 1, 1);
  });

const scroll = (ctx: Ctx, tile: HTMLCanvasElement, offset: number, y: number, w: number): void => {
  const start = -Math.round(((offset % tile.width) + tile.width) % tile.width);
  for (let x = start; x < w; x += tile.width) ctx.drawImage(tile, x, y);
};

// ---- layers ----

const farHeight = (f: Frame): number => Math.round(f.h * 0.3);

const cloudImage = (r: number, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`runner-cloud:${r}:${c.cloud}:${c.cloudShade}`, r * 5, r * 2 + 2, (g) => {
    const puff = (x: number, y: number, rr: number): void => disc(g, x, y, rr, (dy) => (dy > rr * 0.4 ? c.cloudShade : c.cloud));
    puff(r * 1.2, r + 1, r * 0.8);
    puff(r * 2.4, r * 0.9, r);
    puff(r * 3.7, r + 1, r * 0.75);
    fillRect(g, c.cloudShade, r * 0.6, r * 1.7, r * 3.8, 1);
  });

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const k = courseOf(f);
  ctx.drawImage(ditherGradient(f.w, k.ground, [c.sky0, c.sky1, c.sky2]), 0, 0);
  const r = Math.round(Math.min(f.w, f.h) * 0.08);
  disc(ctx, f.w * 0.78, f.h * 0.2, r + (f.kick > 0.6 ? 1 : 0), () => c.sun);
  const clouds = Math.max(4, Math.round(f.h / 48));
  const band = (k.ground - farHeight(f)) / f.h;
  for (let i = 0; i < clouds; i++) {
    const img = cloudImage(4 + Math.round(rand(i, 41) * 4), c);
    const span = f.w + img.width;
    const x = frac(rand(i, 42) - (f.t * (3 + 3 * rand(i, 43))) / span) * span - img.width;
    ctx.drawImage(img, Math.round(x), Math.round(f.h * (0.06 + (band - 0.12) * ((i + rand(i, 44)) / clouds))));
  }
};

const BIRD_UP: Sprite = ['o...o', '.o.o.', '..o..'];
const BIRD_DOWN: Sprite = ['.....', 'oo.oo', '..o..'];
const birdPalette = (c: Colors<K>): Palette => ({ o: c.outline });

// A small flock gliding across, flapping on every half beat.
const birds = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const pal = paletteOf(c, birdPalette);
  const span = f.w + 40;
  const lead = frac(f.t / 26) * span - 20;
  for (let i = 0; i < 4; i++) {
    const flap = Math.floor(f.beat * 2 + i) % 2 === 0 ? BIRD_UP : BIRD_DOWN;
    const x = lead - i * 7 - (i % 2) * 2;
    const y = f.h * 0.16 + (i % 2) * 4 + i * 2 + Math.sin(f.t * 1.5 + i) * 2;
    drawSpriteFoot(ctx, flap, pal, Math.round(f.w - x), Math.round(y));
  }
};

const hills = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const k = courseOf(f);
  const travel = f.beat * k.speed;
  const farH = farHeight(f);
  const far = hillTile(
    `runner-far:${farH}:${c.hillFar}`,
    240,
    farH,
    c.hillFar,
    (x) =>
      farH * 0.45 +
      wave(x, 240, [
        [1, farH * 0.25, 0],
        [2, farH * 0.12, 2],
        [5, farH * 0.04, 1],
      ]),
  );
  scroll(ctx, far, travel * 0.12, k.ground - farH, f.w);
  const nearH = Math.round(f.h * 0.2);
  scroll(ctx, treeTile(160, nearH, c), travel * 0.35, k.ground - nearH, f.w);
};

const ground = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const k = courseOf(f);
  scroll(ctx, groundTile(f.h - k.ground, c), f.beat * k.speed, k.ground, f.w);
};

const coin = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, y: number): void => {
  const width = [5, 3, 1, 3][Math.floor(f.t * 8) % 4] ?? 5;
  const left = x - Math.floor(width / 2);
  fillRect(ctx, c.outline, left - 1, y - 2, width + 2, 5);
  fillRect(ctx, c.outline, left, y - 3, width, 7);
  fillRect(ctx, c.coin, left, y - 2, width, 5);
  fillRect(ctx, c.coinLight, left, y - 2, 1, 2);
};

const sparkle = (ctx: Ctx, c: Colors<K>, x: number, y: number, age: number): void => {
  const r = Math.round(2 + age * 10);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    fillRect(ctx, age < 0.25 ? c.coinLight : c.coin, Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r - age * 6), 1, 1);
  }
};

const props = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const k = courseOf(f);
  const pal = paletteOf(c, propPalette);
  const coinY = k.ground - k.jump - 6;
  const first = Math.floor(f.beat - k.hero / k.speed) - 1;
  const last = Math.ceil(f.beat + (f.w - k.hero) / k.speed) + 1;
  for (let n = first; n <= last; n++) {
    const kind = hurdleAt(n);
    if (!kind) continue;
    const x = hurdleX(f, k, n);
    drawSpriteFoot(ctx, HURDLES[kind], pal, x, k.ground);
    const since = f.beat - (n + 0.5);
    if (hasCoin(n) && since < 0) coin(ctx, f, c, x, coinY);
    else if (hasCoin(n) && since < 0.5) sparkle(ctx, c, x, coinY, since);
  }
};

const scarf = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, y: number, lift: number): void => {
  for (let i = 0; i < 7; i++) {
    const sway = Math.sin(f.t * 14 - i * 0.9) * (i / 6) * 1.6;
    const rise = lift > 0 ? Math.round(i * 0.5) : 0;
    fillRect(ctx, c.scarf, x - 2 - i, Math.round(y + sway) + rise, 1, i < 4 ? 2 : 1);
  }
};

const dust = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, ground: number): void => {
  const p = frac(f.beat);
  if (p > 0.3 || !hurdleAt(Math.floor(f.beat) - 1)) return;
  for (let i = 0; i < 3; i++) {
    const d = Math.round(2 + p * 14 + i * 2);
    fillRect(ctx, c.cloud, x - d - 2, ground - 1 - i, 1, 1);
    fillRect(ctx, c.cloud, x + d - 2, ground - 1 - i, 1, 1);
  }
};

const runner = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const k = courseOf(f);
  const lift = heroLift(f, k);
  const y = k.ground - lift;
  const step = Math.floor(f.beat * 4) % 2;
  const sprite = lift > 0 ? JUMP : step === 0 ? RUN_A : RUN_B;
  const bob = lift === 0 && step === 1 ? -1 : 0;
  scarf(ctx, f, c, k.hero - 2, y - 7 + bob, lift);
  drawSpriteFoot(ctx, sprite, paletteOf(c, heroPalette), k.hero, y + bob);
  dust(ctx, f, c, k.hero, k.ground);
};

export const pixelRunner = defineScene<K>({
  id: 'pixel-runner',
  title: 'Pixel Runner',
  mood: { valence: 0.5, energy: 0.5 },
  styles: ['pixel-quest', 'puzzle-pop', 'nineties-pop', 'fm-funk'],
  variants: [
    {
      mood: { valence: 0.7, energy: 0.5 },
      colors: {
        sky0: '#4fb8f5',
        sky1: '#86d2fa',
        sky2: '#c8ecff',
        sun: '#fff3a8',
        cloud: '#ffffff',
        cloudShade: '#d3eaf8',
        hillFar: '#8fd0b4',
        hillNear: '#5fb877',
        tree: '#3a8a52',
        grass: '#6fd34f',
        grassLight: '#b4f27a',
        dirt: '#a5653a',
        dirtDark: '#7d4727',
        outline: '#2a1a24',
        hood: '#ff6b3d',
        hoodLight: '#ffa070',
        skin: '#ffd8b0',
        tunic: '#3b6fd8',
        boots: '#5a3a2a',
        scarf: '#ffd23f',
        coin: '#ffc93a',
        coinLight: '#fff6c8',
        wood: '#c98a4a',
        woodDark: '#8a5428',
        stone: '#9aa0b0',
        stoneDark: '#6a7084',
      },
    },
    {
      mood: { valence: 0.2, energy: 0.4 },
      colors: {
        sky0: '#3a2266',
        sky1: '#b4488a',
        sky2: '#ff9a62',
        sun: '#ffd36b',
        cloud: '#ffc0a8',
        cloudShade: '#e0809a',
        hillFar: '#7a4a8a',
        hillNear: '#55316e',
        tree: '#3a1f50',
        grass: '#4fa86a',
        grassLight: '#9ad88a',
        dirt: '#7a4438',
        dirtDark: '#552c2a',
        outline: '#1a0e1e',
        hood: '#ff5a5a',
        hoodLight: '#ff9a8a',
        skin: '#ffd0b0',
        tunic: '#4a6ae0',
        boots: '#3a2430',
        scarf: '#ffe066',
        coin: '#ffc93a',
        coinLight: '#fff6c8',
        wood: '#b8784a',
        woodDark: '#7a4628',
        stone: '#a08aa8',
        stoneDark: '#6a5878',
      },
    },
  ],
  layers: [sky, birds, hills, ground, props, runner],
});
