// An old public bathhouse: a girl soaks with a towel on her head and a bottle of milk in her hand while a rubber
// duck bobs beside her, steam drifts up, and the mountain mural on the wall quietly comes alive.
import { type Ctx, drawSprite, fillRect, type Palette, type Sprite } from 'mojipx';
import { bayer, ditherGradient, frac, noise1, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { ditherStyle, driftingClouds, fillDither, pine, spanDisc } from './batch-1-helpers.ts';
import { memoLayer, wrap } from './batch-2-helpers.ts';
import { paletteOf, recentBeats, sigOf } from './batch-3-helpers.ts';
import { drawGirl, type Girl, limb, onBeat, sipOf, wide } from './batch-7-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'fuji'
  | 'fujiLo'
  | 'snow'
  | 'snowLo'
  | 'lake'
  | 'lakeHi'
  | 'pine'
  | 'cloud'
  | 'tile'
  | 'grout'
  | 'rim'
  | 'rimLo'
  | 'water'
  | 'waterHi'
  | 'waterLo'
  | 'steam'
  | 'ink'
  | 'skin'
  | 'skinLo'
  | 'blush'
  | 'hair'
  | 'hairHi'
  | 'hairLo'
  | 'iris'
  | 'white'
  | 'whiteLo'
  | 'pink'
  | 'duck'
  | 'duckLo'
  | 'beak'
  | 'wood';

// ---- the girl: o outline, s/S skin, b blush, h/H/d hair, e/E eyes, w glint, m mouth, q/Q/p towels ----

const HEAD: Sprite = [
  '.......oooooooooooooo.......',
  '......oqqqqqqqqqqqqqqo......',
  '.....oqqqqqqqqqqqqqqqqo.....',
  '.....oqppppppppppppppqo.....',
  '.....oqqqqqqqqqqqqqqqqo.....',
  '....ooQQQQQQQQQQQQQQQQoo....',
  '...ohhhhHHHhhhhhhHHHhhhho...',
  '..ohhHHhhhhhhhhhhhhhhHHhho..',
  '..ohhhhhhhhhhhhhhhhhhhhhho..',
  '.ohhhhhhhhhhhhhhhhhhhhhhhho.',
  '.ohhhhhhhhhhhhhhhhhhhhhhhho.',
  '.ohhhhhhhhdhhhhhhdhhhhhhhho.',
  '.ohhdddddSddddddddSdddddhho.',
  '.ohdSSoooooSssssSoooooSSdho.',
  '.ohdssswweesssssseewwsssdho.',
  '.ohdsssweeesssssseeewsssdho.',
  '.ohdsssEEEesssssseEEEsssdho.',
  '.ohdsssEEEEssssssEEEEsssdho.',
  '.ohdsbbbbssssssssssbbbbsdho.',
  '.ohdsssssssssmmsssssssssdho.',
  '.ohdssssssssssssssssssssdho.',
  '.ohdoSssssssssssssssssSodho.',
  '...oSssssssssssssssssssSo...',
  '....ooSssssssssssssssSoo....',
  '......oooooooooooooooo......',
];

const BODY: Sprite = [
  '...........oSSSSo...........',
  '...........osssso...........',
  '.......ooooSssssSoooo.......',
  '.....ooSssssssssssssSoo.....',
  '....osssssssssssssssssso....',
  '...oSssssssssssssssssssSo...',
  '..oSsssoooooooooooooosssSo..',
  '..oSssoqqqqqqqqqqqqqqossSo..',
  '..oSssoqppppppppppppqossSo..',
  '..oSssoqqqqqqqqqqqqqqossSo..',
  '..oSssoQqqqqqqqqqqqqQossSo..',
  '..oSssoQqqqqqqqqqqqqQossSo..',
];

const GIRL: Girl = {
  eyes: [
    { x: 7, y: 13, out: -1, w: 4, h: 5 },
    { x: 17, y: 13, out: 1, w: 4, h: 5 },
  ],
  seed: 59,
};
// The rows of her sprite above the water, and where her hand holds the bottle at rest and at her lips.
const ABOVE = 36;
const SHOULDER = { x: 22, y: 30 } as const;
const REST = { x: 26, y: 27 } as const;
const SIP = { x: 19, y: 20 } as const;

// A bottle of milk with a paper cap: r cap, g glass, w milk, W glint.
const BOTTLE: Sprite = ['.ooo.', 'orrro', '.ogo.', 'ogWgo', 'owwwo', 'owWwo', 'owwwo', 'owwwo', '.ooo.'];
const HAND: Sprite = ['.oo.', 'osso', 'oSSo'];

// The rubber duck: y body, Y shade, e eye, r beak.
const DUCK: Sprite = [
  '....oooo......',
  '...oyyyyo.....',
  '..oyyyyyyo....',
  '..oyyeyyyoo...',
  '..oyyyyyyrro..',
  '..ooyyyyyrrro.',
  '.oooyyyyyoo...',
  'oyyyyyyyyyyo..',
  'oyyyyYYyyyyyo.',
  'oyyyyyYYyyyyo.',
  '.oyyyyyyyyyo..',
  '..ooooooooo...',
];

// A little sailboat on the painted lake.
const BOAT: Sprite = ['...w...', '...ww..', '...www.', '...wwww', '...o...', 'ooooooo', '.ooooo.'];

const girlPalette = (c: Colors<K>): Palette => ({
  o: c.ink,
  s: c.skin,
  S: c.skinLo,
  b: c.blush,
  h: c.hair,
  H: c.hairHi,
  d: c.hairLo,
  e: c.ink,
  E: c.iris,
  w: c.white,
  m: c.pink,
  q: c.white,
  Q: c.whiteLo,
  p: c.pink,
  r: c.rim,
  g: c.waterHi,
  W: c.white,
});
const bottlePalette = (c: Colors<K>): Palette => ({ o: c.ink, r: c.rim, g: c.waterHi, w: c.white, W: c.white });
const duckPalette = (c: Colors<K>): Palette => ({ o: c.ink, y: c.duck, Y: c.duckLo, e: c.ink, r: c.beak });
const boatPalette = (c: Colors<K>): Palette => ({ w: c.white, o: c.wood });

// ---- layout ----

type Bath = {
  readonly mural: number;
  readonly rim: number;
  readonly near: number;
  readonly girl: number;
  readonly line: number;
  readonly duck: number;
};

const bathOf = (f: Frame): Bath => {
  const down = (u: number): number => Math.round(f.h * u);
  return wide(f)
    ? { mural: down(0.5), rim: down(0.58), near: down(0.93), girl: Math.round(f.w * 0.45), line: down(0.83), duck: Math.round(f.w * 0.57) }
    : { mural: down(0.42), rim: down(0.5), near: down(0.92), girl: Math.round(f.w * 0.44), line: down(0.72), duck: Math.round(f.w * 0.68) };
};

// ---- the mural ----

type Peak = { readonly cx: number; readonly top: number; readonly base: number; readonly half: number };

const peakOf = (w: number, h: number): Peak => {
  const base = Math.round(h * 0.78);
  const top = Math.round(h * 0.2);
  return { cx: Math.round(w / 2), top, base, half: Math.round(Math.min(w * 0.46, (base - top) * 2.3)) };
};

const halfAt = (p: Peak, y: number): number => 4 + (p.half - 4) * ((y - p.top) / (p.base - p.top)) ** 1.5;

// The painted mountain: lit on the left, a ragged snowcap with gullies running down.
const fujiColor = (p: Peak, x: number, y: number, half: number, c: Colors<K>): string => {
  const lit = x < p.cx + half * 0.12;
  const snowLine = 0.32 + (noise1(x / 3, 5) - 0.5) * 0.14 + (noise1(x / 1.5, 9) > 0.7 ? 0.12 : 0);
  if ((y - p.top) / (p.base - p.top) < snowLine) return lit ? c.snow : c.snowLo;
  return lit ? c.fuji : c.fujiLo;
};

const paintFuji = (g: Ctx, p: Peak, c: Colors<K>): void => {
  for (let y = p.top; y < p.base; y++) {
    const half = Math.round(halfAt(p, y));
    for (let x = p.cx - half; x <= p.cx + half; x++) fillRect(g, fujiColor(p, x, y, half, c), x, y, 1, 1);
  }
};

const paintLake = (g: Ctx, p: Peak, w: number, h: number, c: Colors<K>): void => {
  fillRect(g, c.lake, 0, p.base, w, h - p.base);
  for (let y = p.base + 1; y < h; y++) {
    const half = Math.round(halfAt(p, p.base - (y - p.base) * 1.6));
    if (half > 4) fillDither(g, c.fujiLo, 0.4, p.cx - half, y, half * 2, 1);
    if ((y - p.base) % 3 === 0) for (let x = (y * 7) % 11; x < w; x += 9 + (y % 4)) fillRect(g, c.lakeHi, x, y, 4, 1);
  }
};

const muralLayer = (w: number, h: number, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`bf-mural:${sigOf(c)}`, w, h, (g) => {
    g.drawImage(ditherGradient(w, h, [c.sky0, c.sky1, c.sky1]), 0, 0);
    const p = peakOf(w, h);
    paintFuji(g, p, c);
    paintLake(g, p, w, h, c);
    for (let i = 0; i < 6; i++) {
      const x = i < 3 ? w * (0.02 + i * 0.07) : w * (0.98 - (i - 3) * 0.07);
      pine(g, x, p.base + 2, h * (0.22 + rand(i, 5) * 0.12), c.pine);
    }
    fillRect(g, c.grout, 0, h - 2, w, 2);
  });

// The painting comes alive: its clouds drift and a little boat sails across the lake.
const mural = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const b = bathOf(f);
  ctx.drawImage(muralLayer(f.w, b.mural, c), 0, 0);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, f.w, b.mural - 2);
  ctx.clip();
  const s = Math.min(f.w, f.h);
  driftingClouds(ctx, f, c.cloud, c.sky1, { count: 3, top: b.mural * 0.12, span: b.mural * 0.3, size: s * 0.07, speed: 2.5, seed: 21 });
  const p = peakOf(f.w, b.mural);
  const bx = Math.round(wrap(f.t * 3 + f.w * 0.15, f.w + 20) - 10);
  const by = p.base + Math.round((b.mural - p.base) * 0.35);
  drawSprite(ctx, BOAT, paletteOf(c, boatPalette), bx, by - 6);
  fillDither(ctx, c.white, 0.25, bx + 3, by + 2, 4, 3);
  ctx.restore();
};

// ---- the tiles, the bath and its water ----

const paintTiles = (g: Ctx, w: number, top: number, bottom: number, c: Colors<K>): void => {
  fillRect(g, c.tile, 0, top, w, bottom - top);
  for (let y = top + 5; y < bottom; y += 6) fillRect(g, c.grout, 0, y, w, 1);
  for (let x = 2; x < w; x += 6) fillRect(g, c.grout, x, top, 1, bottom - top);
};

const paintRim = (g: Ctx, w: number, y: number, h: number, size: number, c: Colors<K>): void => {
  fillRect(g, c.rim, 0, y, w, h);
  fillRect(g, c.white, 0, y, w, 1);
  for (let x = 0; x < w; x += size) fillRect(g, c.rimLo, x, y + 1, 1, h - 1);
  fillRect(g, c.rimLo, 0, y + h - 1, w, 1);
};

const roomLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`bf-room:${sigOf(c)}`, f.w, f.h, (g) => {
    const b = bathOf(f);
    paintTiles(g, f.w, b.mural, b.rim, c);
    paintRim(g, f.w, b.rim, 5, 8, c);
    g.drawImage(ditherGradient(f.w, b.near - b.rim - 5, [c.waterHi, c.water, c.water, c.waterLo]), 0, b.rim + 5);
    paintRim(g, f.w, b.near, f.h - b.near, 14, c);
  });

const room = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(roomLayer(f, c), 0, 0);
};

// Light dancing on the water: short bright dashes sliding back and forth.
const caustics = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const b = bathOf(f);
  const count = Math.round(f.w / 5);
  for (let i = 0; i < count; i++) {
    const y = b.rim + 7 + Math.floor(rand(i, 41) * (b.near - b.rim - 9));
    const x = rand(i, 42) * f.w + Math.sin(f.t * (0.8 + rand(i, 43)) + i) * 6;
    const len = 2 + Math.floor(rand(i, 44) * 4);
    if (bayer(i, Math.floor(f.t * 2)) < 0.8) fillRect(ctx, c.waterHi, Math.round(x), y, len, 1);
  }
};

// A ring of ripple per beat spreading from where she sits.
const ripples = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const b = bathOf(f);
  recentBeats(f.beat, 3, (beat, age) => {
    if (beat < 0) return;
    const rx = 16 + age * 14;
    const ry = 3 + age * 3;
    for (let k = 0; k < 48; k++) {
      const a = (k / 48) * Math.PI * 2;
      if (age > 1.5 && k % 2 === 0) continue;
      const y = Math.round(b.line + 2 + Math.sin(a) * ry);
      if (y > b.rim + 5 && y < b.near) fillRect(ctx, c.waterHi, Math.round(b.girl + Math.cos(a) * rx), y, 2, 1);
    }
  });
};

// Faint steam drifting up off the water and thinning as it rises.
const steam = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const b = bathOf(f);
  for (let i = 0; i < 8; i++) {
    const age = frac(f.t * 0.1 + rand(i, 51));
    const style = ditherStyle(ctx, c.steam, 0.32 * (1 - age));
    if (!style) continue;
    ctx.fillStyle = style;
    const x = f.w * rand(i, 52) + Math.sin(f.t * 0.6 + i * 2) * 8 + age * 12;
    spanDisc(ctx, x, b.line + 10 - age * f.h * 0.5, Math.round(5 + age * 12));
  }
};

// ---- the girl, her milk and the duck ----

const girl = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const b = bathOf(f);
  const x = b.girl - 14;
  const y = b.line - ABOVE + onBeat(f.beat / 2, 0.5);
  const palette = paletteOf(c, girlPalette);
  const sip = sipOf(f.beat);
  fillDither(ctx, c.waterLo, 0.5, x + 2, b.line + 3, 24, 10);
  drawSprite(ctx, BODY, palette, x, y + 25);
  drawGirl(ctx, f, HEAD, palette, x, y, GIRL, sip > 0.8);
  const hx = Math.round(x + REST.x + (SIP.x - REST.x) * sip);
  const hy = Math.round(y + REST.y + (SIP.y - REST.y) * sip);
  limb(ctx, x + SHOULDER.x, y + SHOULDER.y, hx + 1, hy + 2, 2, c.skin, c.ink);
  drawSprite(ctx, BOTTLE, paletteOf(c, bottlePalette), hx - 1, hy - 4);
  drawSprite(ctx, HAND, palette, hx - 1, hy);
  fillRect(ctx, c.water, x + 1, b.line, 26, 4);
  fillRect(ctx, c.waterHi, x + 2, b.line, 24, 1);
};

const duck = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const b = bathOf(f);
  const x = Math.round(b.duck + Math.sin(f.t * 0.5) * 10);
  const y = b.line - 2 - onBeat(f.beat, 0.3);
  fillDither(ctx, c.waterLo, 0.5, x, y + 11, 14, 3);
  drawSprite(ctx, DUCK, paletteOf(c, duckPalette), x, y);
  fillRect(ctx, c.waterHi, x - 1, y + 10, 16, 1);
};

// A wooden bucket waits on the near edge of the bath.
const bucket = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const b = bathOf(f);
  const x = Math.round(f.w * (wide(f) ? 0.8 : 0.12));
  const y = b.near - 9;
  fillRect(ctx, c.ink, x - 1, y - 1, 18, 12);
  fillRect(ctx, c.wood, x, y, 16, 10);
  fillRect(ctx, c.hairHi, x, y, 16, 1);
  fillRect(ctx, c.ink, x, y + 2, 16, 1);
  fillRect(ctx, c.ink, x, y + 7, 16, 1);
  for (let k = x + 3; k < x + 16; k += 4) fillRect(ctx, c.hairLo, k, y + 3, 1, 4);
};

export const bathhouseFuji = defineScene<K>({
  id: 'bathhouse-fuji',
  title: 'Bathhouse Mural',
  mood: { valence: 0.6, energy: -0.6 },
  styles: ['cozy-village', 'lofi-loop', 'town-waltz', 'snowfall'],
  variants: [
    {
      mood: { valence: 0.6, energy: -0.5 },
      colors: {
        sky0: '#4a90e0',
        sky1: '#bfe4ff',
        fuji: '#4a68b8',
        fujiLo: '#34489a',
        snow: '#ffffff',
        snowLo: '#c8d8f0',
        lake: '#3a88c8',
        lakeHi: '#a8dcff',
        pine: '#1e5a46',
        cloud: '#ffffff',
        tile: '#f0f4f4',
        grout: '#b8c8cc',
        rim: '#4ab0d0',
        rimLo: '#2a7aa0',
        water: '#6ad0d8',
        waterHi: '#c4f4f4',
        waterLo: '#3a9ab0',
        steam: '#ffffff',
        ink: '#1e1a26',
        skin: '#ffe0cc',
        skinLo: '#f2ae96',
        blush: '#ff7088',
        hair: '#a8502a',
        hairHi: '#e08a50',
        hairLo: '#6a2a1a',
        iris: '#c8702e',
        white: '#fdfcf8',
        whiteLo: '#cdd6e0',
        pink: '#ff8aa8',
        duck: '#ffd840',
        duckLo: '#e8a820',
        beak: '#ff8a30',
        wood: '#c8884a',
      },
    },
    {
      mood: { valence: 0.4, energy: -0.6 },
      colors: {
        sky0: '#f08a6a',
        sky1: '#ffd8a0',
        fuji: '#8a5aa0',
        fujiLo: '#6a4088',
        snow: '#fff4f0',
        snowLo: '#f0b8c8',
        lake: '#d0789a',
        lakeHi: '#ffd0c0',
        pine: '#3a2a4a',
        cloud: '#fff0e0',
        tile: '#fbf0e0',
        grout: '#d8c0a8',
        rim: '#e0786a',
        rimLo: '#a84a4a',
        water: '#78c8c8',
        waterHi: '#d8f4e8',
        waterLo: '#4a98a8',
        steam: '#fff4ec',
        ink: '#261a20',
        skin: '#ffdcc6',
        skinLo: '#f0a890',
        blush: '#ff6a80',
        hair: '#9a4a28',
        hairHi: '#d8844c',
        hairLo: '#622818',
        iris: '#c0662a',
        white: '#fffaf2',
        whiteLo: '#e0cbbe',
        pink: '#ff7a9a',
        duck: '#ffd040',
        duckLo: '#e09a20',
        beak: '#ff7a2a',
        wood: '#b87a40',
      },
    },
    {
      mood: { valence: 0.2, energy: -0.8 },
      colors: {
        sky0: '#1c2a5a',
        sky1: '#4a6aa0',
        fuji: '#2a3a6a',
        fujiLo: '#1c2850',
        snow: '#d8e4f8',
        snowLo: '#8ea4cc',
        lake: '#22447a',
        lakeHi: '#6a90c8',
        pine: '#0e2030',
        cloud: '#b8c8e8',
        tile: '#c8d4dc',
        grout: '#8a9aa8',
        rim: '#3a7a9a',
        rimLo: '#24506a',
        water: '#3a8a9a',
        waterHi: '#8ed0d8',
        waterLo: '#24606e',
        steam: '#e0ecf4',
        ink: '#10141c',
        skin: '#f8dccc',
        skinLo: '#dca694',
        blush: '#f07088',
        hair: '#8a4a2e',
        hairHi: '#c47a4e',
        hairLo: '#56281c',
        iris: '#b06a34',
        white: '#f2f6fa',
        whiteLo: '#b4c0cc',
        pink: '#f07c9a',
        duck: '#f0cc48',
        duckLo: '#c8962a',
        beak: '#f07a34',
        wood: '#9a6a42',
      },
    },
  ],
  layers: [mural, room, caustics, ripples, girl, duck, bucket, steam],
});
