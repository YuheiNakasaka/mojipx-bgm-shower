// A platformer that never existed: a little fox-eared girl runs across floating islands, taking off on one beat and
// landing on the next, scooping up the coins strung along each jump, a gem at the top of the high ones, and bouncing on
// the acorn soldiers waiting where she lands. Hills, clouds and far-off islands with waterfalls slide by behind.
import { type Ctx, drawSprite, fillRect, type Palette, type Sprite } from 'mojipx';
import { disc, ditherGradient, frac, rand, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { driftingClouds } from './batch-1-helpers.ts';
import { tileX } from './batch-2-helpers.ts';
import { memoLayer, paletteOf, sigOf } from './batch-3-helpers.ts';
import { drawText, drawTextOutlined, textWidth, tinted } from './batch-4-helpers.ts';
import { digits, popup } from './batch-8-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'cloud'
  | 'cloudLo'
  | 'star'
  | 'far'
  | 'farHi'
  | 'hill'
  | 'hillHi'
  | 'tree'
  | 'treeHi'
  | 'fall'
  | 'grass'
  | 'grassHi'
  | 'dirt'
  | 'dirtLo'
  | 'coin'
  | 'coinHi'
  | 'coinLo'
  | 'gem'
  | 'gemHi'
  | 'enemy'
  | 'enemyHi'
  | 'ink'
  | 'white'
  | 'tint';

// ---- the hero: o outline, h/H/d hair and ears, p inner ear, s skin, b blush, k/w eyes, m mouth,
// t/T tunic, y buckle, l boots, f/F tail ----

const HEAD: Sprite = [
  '...oo.......oo....',
  '..ohho.....ohho...',
  '..ohpho...ohpho...',
  '..ohpphooohpphoo..',
  '.ohhhhhhhhhhhhhho.',
  '.ohhHHHhhhhhhhhho.',
  'ohhHhhhhhhhhhhhhho',
  'ohhhhhhhdhhhdhhhho',
  'ohhhhhhdsdhdsdhhso',
  'ohhhhhdsssssssssso',
  'ohhhhdssskkssskkso',
  'ohhhhdssswkssswkso',
  '.ohhhdssskkssskkso',
  '.ohhhosbbsssssbbso',
  '..ohhossssssmssso.',
  '...oho.ossssssoo..',
  '.....o..oooooo....',
];
const HEAD_BLINK: Sprite = HEAD.map((row, y) => {
  if (y === 10 || y === 11) return `${row.slice(0, 9)}ss${row.slice(11, 14)}ss${row.slice(16)}`;
  if (y === 12) return `${row.slice(0, 9)}kk${row.slice(11, 14)}kk${row.slice(16)}`;
  return row;
});

const RUN_A: Sprite = [
  '.....oTTTTo.......',
  '....otttttto......',
  '...osttttttso.....',
  '....ottyyttoo.....',
  '....otttttto......',
  '....oTTTTTTo......',
  '....olo..olo......',
  '...oll....llo.....',
  '..oll......llo....',
  '..ooo......ooo....',
];
const RUN_B: Sprite = [
  '.....oTTTTo.......',
  '....otttttto......',
  '....ottttttso.....',
  '...osttyytto......',
  '....otttttto......',
  '....oTTTTTTo......',
  '.....ollllo.......',
  '.....oll.lo.......',
  '....olll.llo......',
  '....ooooooo.......',
];
const JUMP: Sprite = [
  '...os.oTTTTo.so...',
  '....ootttttoo.....',
  '.....otttttto.....',
  '.....ottyytto.....',
  '.....otttttto.....',
  '.....oTTTTTTo.....',
  '....ollo..ollo....',
  '...olo......olo...',
  '...oo........oo...',
];
const TAIL: Sprite = ['..ooo...', '.offfo..', 'offffo..', 'offfffo.', '.offFFo.', '..oFFFo.', '...ooo..'];

const HERO: Palette = {
  o: '#2a1420',
  h: '#f08a3a',
  H: '#ffc070',
  d: '#b05a2a',
  p: '#ff9ab0',
  s: '#ffe4d0',
  b: '#ff9a9a',
  k: '#2a1430',
  w: '#ffffff',
  m: '#c04050',
  t: '#3aa05a',
  T: '#7ad07a',
  y: '#ffd84a',
  l: '#7a4a2a',
  f: '#f08a3a',
  F: '#ffffff',
};
const heroPalette = (c: Colors<K>): Palette => tinted(HERO, c.tint, 0.12);

// ---- things in the level ----

const COIN: readonly Sprite[] = [
  ['.oooo.', 'oyYYyo', 'oyYyyo', 'oyYyyo', 'oyYyyo', 'oyYyyo', 'oyyyLo', '.oooo.'],
  ['.ooo.', 'oYyyo', 'oYyyo', 'oYyyo', 'oYyyo', 'oYyyo', 'oyyLo', '.ooo.'],
  ['.oo.', 'oYyo', 'oYyo', 'oYyo', 'oYyo', 'oYyo', 'oyLo', '.oo.'],
  ['..o..', '.oYo.', '.oyo.', '.oyo.', '.oyo.', '.oyo.', '.oLo.', '..o..'],
];
const GEM: Sprite = ['...o...', '..oGo..', '.oGggo.', 'oGgggLo', '.oggLo.', '..oLo..', '...o...'];

// An acorn soldier: c cap, a body, k eyes, f feet.
const ACORN: readonly Sprite[] = [
  [
    '...oooo...',
    '..occcco..',
    '.occCccco.',
    'oooooooooo',
    '.oaaaaaao.',
    '.oakaakao.',
    '.oaaaaaao.',
    '..oaaaao..',
    '..of..fo..',
    '..oo..oo..',
  ],
  [
    '...oooo...',
    '..occcco..',
    '.occCccco.',
    'oooooooooo',
    '.oaaaaaao.',
    '.oakaakao.',
    '.oaaaaaao.',
    '..oaaaao..',
    '...offo...',
    '...oooo...',
  ],
];
const ACORN_FLAT: Sprite = ['..oooooo..', '.occCccco.', 'oooooooooo', 'oakkaakkao', 'oooooooooo'];

// A puff of fluff that flutters over the gaps: q fur, Q wing.
const PUFF: readonly Sprite[] = [
  ['Q..ooo..Q', 'QQoqqqoQQ', '.oqkqkqo.', '.oqqqqqo.', '..ooooo..'],
  ['...ooo...', 'QQoqqqoQQ', 'Qoqkqkqo.', '.oqqqqqoQ', '..ooooo..'],
];
const HEART: Sprite = ['.oo.oo.', 'orroRro', 'orrrrro', '.orrro.', '..oro..', '...o...'];

const coinPalette = (c: Colors<K>): Palette => ({ o: c.ink, y: c.coin, Y: c.coinHi, L: c.coinLo });
const gemPalette = (c: Colors<K>): Palette => ({ o: c.ink, g: c.gem, G: c.gemHi, L: c.ink });
const acornPalette = (c: Colors<K>): Palette => ({ o: c.ink, c: c.dirtLo, C: c.dirt, a: c.enemy, k: c.ink, f: c.dirtLo });
const puffPalette = (c: Colors<K>): Palette => ({ o: c.ink, q: c.enemyHi, Q: c.white, k: c.ink });
const heartPalette = (c: Colors<K>): Palette => ({ o: c.ink, r: '#ff4a6a', R: '#ffd0d8' });

// ---- the course: one island per two beats; run on the first beat, jump on the second ----

/** Pixels the world scrolls per beat. */
const STEP = 44;
const LEVEL = 14;

type Course = { readonly wide: boolean; readonly heroX: number; readonly base: number; readonly level: number };

const courseOf = (f: Frame): Course =>
  f.w > f.h
    ? { wide: true, heroX: Math.round(f.w * 0.3), base: f.h - 26, level: LEVEL }
    : { wide: false, heroX: Math.round(f.w * 0.32), base: Math.round(f.h * 0.76), level: LEVEL + 6 };

/** Island i's height in levels above the lowest. */
const heightOf = (i: number): number => Math.floor(rand(i, 3) * 3) + (i % 4 === 2 ? 1 : 0);
const topOf = (c: Course, i: number): number => c.base - heightOf(i) * c.level;
/** Every fifth jump is a high one with a gem at its top. */
const highJump = (i: number): boolean => i % 5 === 3;
const apexOf = (c: Course, i: number): number => (highJump(i) ? 30 : 16) + Math.max(0, topOf(c, i) - topOf(c, i + 1));

/** Where the hero's feet are at beat b: running along island i, or in the air between i and i + 1. */
const heroAt = (c: Course, b: number): { readonly y: number; readonly air: number } => {
  const i = Math.floor(b / 2);
  const u = b - i * 2;
  if (u < 1) return { y: topOf(c, i), air: -1 };
  const k = u - 1;
  return { y: topOf(c, i) + (topOf(c, i + 1) - topOf(c, i)) * k - apexOf(c, i) * 4 * k * (1 - k), air: k };
};

const screenX = (f: Frame, c: Course, worldX: number): number => Math.round(worldX - Math.max(0, f.beat) * STEP + c.heroX);

// ---- the backdrop: sky, far islands with waterfalls, hills with round trees ----

const TILE = 512;

// A far island; a waterfall spills off one side and frays into spray.
const paintFarIsland = (g: Ctx, x: number, y: number, w: number, c: Colors<K>): void => {
  for (let r = 0; r < 12; r++) {
    const inset = Math.round((r / 12) ** 1.5 * w * 0.45);
    fillRect(g, r < 2 ? c.farHi : c.far, x + inset, y + r, w - inset * 2, 1);
  }
  const fx = x + Math.round(w * 0.7);
  for (let k = 0; k < 19; k++) fillRect(g, c.fall, fx, y + 2 + k, 2, 1);
  for (let k = 19; k < 26; k += 2) fillRect(g, c.fall, fx + 1, y + 2 + k, 1, 1);
  for (let k = 0; k < 5; k++) fillRect(g, c.fall, fx - 3 + k * 2, y + 29 + (k % 2), 1, 1);
};

const farLayer = (c: Colors<K>, h: number): HTMLCanvasElement =>
  memoLayer(`coin-far:${h}:${c.far}:${c.farHi}:${c.fall}`, TILE, h, (g) => {
    for (let i = 0; i < 4; i++) {
      const x = 40 + i * 128 + Math.round(rand(i, 5) * 40);
      paintFarIsland(g, x, Math.round(h * (0.25 + rand(i, 6) * 0.3)), 26 + Math.round(rand(i, 7) * 24), c);
    }
  });

const hillLayer = (c: Colors<K>, h: number): HTMLCanvasElement =>
  memoLayer(`coin-hill:${h}:${c.hill}:${c.hillHi}:${c.tree}:${c.treeHi}`, TILE, h, (g) => {
    for (let i = 0; i < 6; i++) {
      const cx = i * 90 + Math.round(rand(i, 9) * 40);
      const r = 40 + Math.round(rand(i, 10) * 30);
      for (const shift of [0, TILE]) disc(g, cx - shift, h + r * 0.35, r, (dy) => (dy < -r + 4 ? c.hillHi : c.hill));
    }
    for (let i = 0; i < 9; i++) {
      const x = Math.round(rand(i, 11) * TILE);
      const y = h - 18 - Math.round(rand(i, 12) * 14);
      fillRect(g, c.tree, x + 3, y + 6, 2, 8);
      disc(g, x + 4, y + 2, 6, (dy) => (dy < -3 ? c.treeHi : c.tree));
    }
  });

const backdrop = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const co = courseOf(f);
  const scroll = Math.max(0, f.beat) * STEP;
  ctx.drawImage(ditherGradient(f.w, f.h, [c.sky0, c.sky1, c.sky2]), 0, 0);
  stars(ctx, f.w, f.h, f.t, [c.star], 50, 41, 0.5);
  driftingClouds(ctx, f, c.cloud, c.cloudLo, { count: co.wide ? 5 : 6, top: f.h * 0.1, span: f.h * 0.4, size: 14, speed: 4, seed: 17 });
  const farH = Math.round(co.base - f.h * 0.08);
  tileX(ctx, farLayer(c, farH), scroll * 0.15, 0, f.w);
  const hillH = Math.round(f.h * (co.wide ? 0.4 : 0.32));
  tileX(ctx, hillLayer(c, hillH), scroll * 0.35, f.h - hillH, f.w);
};

// ---- islands ----

const ISLAND_W = Math.round(STEP * 1.4);

const islandLayer = (c: Colors<K>, style: number): HTMLCanvasElement =>
  memoLayer(`coin-isle:${style}:${sigOf(c)}`, ISLAND_W, 30, (g) => {
    for (let r = 0; r < 18; r++) {
      const inset = Math.round((r / 18) ** 1.6 * ISLAND_W * 0.42);
      fillRect(g, c.ink, inset, r, ISLAND_W - inset * 2, 1);
      fillRect(g, r % 5 === 2 ? c.dirtLo : c.dirt, inset + 1, r, ISLAND_W - inset * 2 - 2, 1);
    }
    fillRect(g, c.grass, 0, 0, ISLAND_W, 4);
    fillRect(g, c.grassHi, 1, 0, ISLAND_W - 2, 1);
    for (let x = 2; x < ISLAND_W - 2; x += 3) fillRect(g, c.grass, x, 4, 2, 1 + ((x + style) % 3));
    for (let k = 0; k < 3; k++) {
      const x = 8 + Math.round(rand(style, k) * (ISLAND_W - 16));
      fillRect(g, c.tree, x, 18 - k, 1, 4 + k * 2 + style);
    }
    const fx = 6 + style * 14;
    fillRect(g, c.coinHi, fx, 0, 1, 1);
    fillRect(g, c.white, fx + 9, 1, 1, 1);
  });

const islands = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const co = courseOf(f);
  const first = Math.floor((Math.max(0, f.beat) * STEP - co.heroX - ISLAND_W) / (STEP * 2));
  for (let i = first; i < first + Math.ceil(f.w / (STEP * 2)) + 3; i++) {
    const x = screenX(f, co, i * 2 * STEP - STEP * 0.3);
    ctx.drawImage(islandLayer(c, i % 3), x, topOf(co, i));
  }
};

// ---- coins along every jump, a gem on the high ones, acorns where she lands, puffs over the gaps ----

const spinOf = (t: number, k: number): Sprite => COIN[Math.floor(t * 8 + k) % 4] ?? (COIN[0] as Sprite);

// A coin (or the gem) waits on the arc until she passes it, then sparkles away.
const loot = (ctx: Ctx, f: Frame, x: number, y: number, since: number, spin: number, gem: boolean, c: Colors<K>): void => {
  if (gem) popup(ctx, '1000', x, y - 10, since / 0.8, c.gemHi, c.ink);
  if (since >= 0) {
    if (since < 0.3) sparkle(ctx, x, y - 2 - Math.round(since * 20), gem ? c.gemHi : c.coinHi);
    return;
  }
  if (gem) drawSprite(ctx, GEM, paletteOf(c, gemPalette), x - 3, y - 4 + Math.round(Math.sin(f.t * 4)));
  else drawSprite(ctx, spinOf(f.t, spin), paletteOf(c, coinPalette), x - 3, y - 4);
};

const jumpLoot = (ctx: Ctx, f: Frame, co: Course, i: number, c: Colors<K>): void => {
  for (const u of [0.2, 0.5, 0.8]) {
    const at = i * 2 + 1 + u;
    const y = Math.round(heroAt(co, at).y - 16);
    loot(ctx, f, screenX(f, co, at * STEP), y, f.beat - at, i + u * 4, highJump(i) && u === 0.5, c);
  }
};

const sparkle = (ctx: Ctx, x: number, y: number, color: string): void => {
  fillRect(ctx, color, x - 2, y, 5, 1);
  fillRect(ctx, color, x, y - 2, 1, 5);
};

// An acorn waits on every third island right where she lands, pacing until she bounces on it.
const acorn = (ctx: Ctx, f: Frame, co: Course, i: number, c: Colors<K>): void => {
  if (i % 3 !== 1) return;
  const land = i * 2;
  const since = f.beat - land;
  const x = screenX(f, co, land * STEP + 4);
  const y = topOf(co, i);
  const palette = paletteOf(c, acornPalette);
  if (since < 0) {
    const pace = Math.round(Math.sin(f.t * 2 + i) * 5);
    drawSprite(ctx, ACORN[Math.floor(f.t * 6) % 2] ?? (ACORN[0] as Sprite), palette, x - 5 + pace, y - 10);
    return;
  }
  if (since < 0.6) drawSprite(ctx, ACORN_FLAT, palette, x - 5, y - 5);
  popup(ctx, '200', x, y - 18, since / 0.9, c.white, c.ink);
};

const puff = (ctx: Ctx, f: Frame, co: Course, i: number, c: Colors<K>): void => {
  if (i % 4 !== 0) return;
  const x = screenX(f, co, (i * 2 + 1.5) * STEP) + Math.round(Math.sin(f.t * 1.5 + i) * 6);
  const y = Math.min(topOf(co, i), topOf(co, i + 1)) - apexOf(co, i) - 34 + Math.round(Math.sin(f.t * 3 + i) * 3);
  drawSprite(ctx, PUFF[Math.floor(f.beat * 2) % 2] ?? (PUFF[0] as Sprite), paletteOf(c, puffPalette), x - 4, y);
};

// On tall screens a second route runs high above hers, islands strung with coins she will never reach.
const upperRoute = (ctx: Ctx, f: Frame, co: Course, c: Colors<K>): void => {
  if (co.wide) return;
  const span = STEP * 3;
  const first = Math.floor((Math.max(0, f.beat) * STEP - co.heroX - ISLAND_W) / span);
  for (let j = first; j < first + Math.ceil(f.w / span) + 2; j++) {
    const x = screenX(f, co, j * span);
    const y = co.base - co.level * 4 - 64 - (j % 2) * 34 - Math.round(rand(j, 13) * 16);
    ctx.drawImage(islandLayer(c, (j + 1) % 3), x, y);
    for (let k = 0; k < 4; k++) {
      const loot = j % 3 === 0 && k === 1;
      if (loot) drawSprite(ctx, GEM, paletteOf(c, gemPalette), x + 12 + k * 10, y - 12 + Math.round(Math.sin(f.t * 4) * 1));
      else drawSprite(ctx, spinOf(f.t, j + k), paletteOf(c, coinPalette), x + 12 + k * 10, y - 12);
    }
  }
};

const level = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const co = courseOf(f);
  upperRoute(ctx, f, co, c);
  const first = Math.floor((Math.max(0, f.beat) * STEP - co.heroX) / (STEP * 2)) - 1;
  for (let i = first; i < first + Math.ceil(f.w / (STEP * 2)) + 3; i++) {
    jumpLoot(ctx, f, co, i, c);
    acorn(ctx, f, co, i, c);
    puff(ctx, f, co, i, c);
  }
};

// ---- the hero ----

const hero = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const co = courseOf(f);
  const { y, air } = heroAt(co, Math.max(0, f.beat));
  const feet = Math.round(y);
  const x = co.heroX - 9;
  const p = paletteOf(c, heroPalette);
  const running = air < 0;
  const stride = Math.floor(f.t * 10) % 2 === 0;
  const body = running ? (stride ? RUN_A : RUN_B) : JUMP;
  const bob = running && stride ? 1 : 0;
  const top = feet - body.length - 15 + bob;
  const wag = running ? (stride ? 0 : 1) : air < 0.5 ? 2 : -1;
  drawSprite(ctx, TAIL, p, x - 4, top + 15 + wag);
  drawSprite(ctx, body, p, x, top + 15);
  const blink = frac(f.t / 3.3) < 0.04;
  drawSprite(ctx, blink ? HEAD_BLINK : HEAD, p, x + 1, top);
};

// ---- the HUD: hearts, coins, score and the stage ----

const coinsBy = (b: number): number => {
  const jumps = Math.max(0, Math.floor((b - 1) / 2));
  const part = Math.max(0, b - 1 - jumps * 2);
  return jumps * 3 + [0.2, 0.5, 0.8].filter((u) => u <= part).length;
};

const hud = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const b = Math.max(0, f.beat);
  for (let k = 0; k < 3; k++) drawSprite(ctx, HEART, paletteOf(c, heartPalette), 4 + k * 8, 4);
  const coinX = Math.round(f.w * 0.3);
  drawSprite(ctx, COIN[0] as Sprite, paletteOf(c, coinPalette), coinX, 3);
  drawTextOutlined(ctx, `X${digits(coinsBy(b), 3)}`, coinX + 9, 4, c.white, c.ink);
  const score = digits(coinsBy(b) * 100 + Math.floor(b / 6) * 200, 7);
  drawTextOutlined(ctx, score, f.w - 4 - textWidth(score), 4, c.white, c.ink);
  const stage = 'STAGE 2-4';
  if (b < 8 || frac(b / 64) < 0.06)
    drawText(ctx, stage, Math.round(f.w / 2 - textWidth(stage) / 2), Math.round(f.h * (f.w > f.h ? 0.3 : 0.12)), c.white);
};

export const coinRun = defineScene<K>({
  id: 'coin-run',
  title: 'Coin Run',
  mood: { valence: 0.6, energy: 0.5 },
  styles: ['pixel-quest', 'puzzle-pop', 'cozy-village', 'grand-field', 'fm-funk'],
  variants: [
    {
      mood: { valence: 0.6, energy: 0.5 },
      colors: {
        sky0: '#4a9aff',
        sky1: '#8ad0ff',
        sky2: '#d8f4ff',
        cloud: '#ffffff',
        cloudLo: '#c8e0f8',
        star: '#4a9aff',
        far: '#8ab0d8',
        farHi: '#b8d8f0',
        fall: '#e0f4ff',
        hill: '#5ac06a',
        hillHi: '#8ae08a',
        tree: '#2a8a4a',
        treeHi: '#5ab85a',
        grass: '#4ac04a',
        grassHi: '#a8f070',
        dirt: '#b0704a',
        dirtLo: '#7a4a30',
        coin: '#ffc020',
        coinHi: '#fff0a0',
        coinLo: '#c07a10',
        gem: '#ff4a8a',
        gemHi: '#ffd0e8',
        enemy: '#d8a060',
        enemyHi: '#ffe0f0',
        ink: '#20141e',
        white: '#ffffff',
        tint: '#ffffff',
      },
    },
    {
      mood: { valence: 0.2, energy: 0.3 },
      colors: {
        sky0: '#5a3a8a',
        sky1: '#e07a8a',
        sky2: '#ffc070',
        cloud: '#ffd0b0',
        cloudLo: '#e08a8a',
        star: '#5a3a8a',
        far: '#a0607a',
        farHi: '#d08a8a',
        fall: '#ffd8c0',
        hill: '#7a4a6a',
        hillHi: '#a06a7a',
        tree: '#4a2a4a',
        treeHi: '#7a4a5a',
        grass: '#6aa04a',
        grassHi: '#e0d070',
        dirt: '#9a5a4a',
        dirtLo: '#6a3a3a',
        coin: '#ffc020',
        coinHi: '#fff0a0',
        coinLo: '#b06a10',
        gem: '#4ad0ff',
        gemHi: '#d0f8ff',
        enemy: '#d89060',
        enemyHi: '#ffe0d0',
        ink: '#20101a',
        white: '#ffffff',
        tint: '#ff9a6a',
      },
    },
    {
      mood: { valence: -0.2, energy: 0.3 },
      colors: {
        sky0: '#060a24',
        sky1: '#141a4a',
        sky2: '#2a2a6a',
        cloud: '#3a4a7a',
        cloudLo: '#26305a',
        star: '#e0e8ff',
        far: '#1a2048',
        farHi: '#2a3468',
        fall: '#5a7ac0',
        hill: '#141c40',
        hillHi: '#22305a',
        tree: '#0e1430',
        treeHi: '#1e2a50',
        grass: '#2a6a5a',
        grassHi: '#6ad0a0',
        dirt: '#4a3a5a',
        dirtLo: '#2a2040',
        coin: '#ffc83a',
        coinHi: '#fff4b0',
        coinLo: '#a06a1a',
        gem: '#7affd0',
        gemHi: '#e0fff4',
        enemy: '#a08070',
        enemyHi: '#d0d8ff',
        ink: '#06060e',
        white: '#ffffff',
        tint: '#4a5ab0',
      },
    },
  ],
  layers: [backdrop, islands, level, hero, hud],
});
