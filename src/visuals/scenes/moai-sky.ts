// A row of stone giants on their platform, backs to the sea, under the Milky Way: waves breaking on the rocks and
// spray thrown up on the beat, a head buried to its neck in the grass in front; at sunset they stand in silhouette.
import { type Ctx, drawSprite, fillRect, flipped, type Sprite } from 'mojipx';
import { bayer, ditherGradient, frac, rand, ridgeNoise, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { drawGlow, paletteBy, spanDisc } from './batch-1-helpers.ts';
import { isDark } from './batch-5-helpers.ts';
import { frameLayer, glints, rain, wideOf } from './batch-6-helpers.ts';
import { drawMist, galaxyLayer, shootingStar } from './batch-10-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sky3'
  | 'sun'
  | 'band'
  | 'core'
  | 'star'
  | 'sea0'
  | 'sea1'
  | 'foam'
  | 'rock'
  | 'rockLo'
  | 'grass'
  | 'grassLo'
  | 'stone'
  | 'stoneLo'
  | 'stoneHi'
  | 'ink'
  | 'pukao'
  | 'rain';

// The statues, front on: o outline, l lit stone, s stone, d stone in shadow, e the deep eye sockets.
const MOAI: Sprite = [
  '...oooooooo....',
  '..olllllsssoo..',
  '..ollllssssdo..',
  '..ollllssssdo..',
  '..ollllssssdo..',
  '.oolllllsssddo.',
  '.oddddddddddo..',
  '.oleedlleedddo.',
  'oolleelllesddoo',
  'olllsslllsssdo.',
  'olllsslllsssdo.',
  'olllssllllssdo.',
  'olllssllllssdo.',
  'ollldddddddsdo.',
  '.ollssssssssdo.',
  '.olsddddddssdo.',
  '.olssssssssddo.',
  '.ollllllsssddo.',
  '..oddddddddddo.',
  '...olssssssdo..',
  '..olssssssssdo.',
  '.olssssssssssdo',
  '.oldssssssssddo',
  '.oldsssssssssdo',
  '.olsdsssssssddo',
  '.olsdsssssssddo',
  '.olssdssssssddo',
  '.olsssddssssddo',
  '.olsssssdddddo.',
  '.olssssssssssdo',
  '.olssssssssssdo',
  '.oddddddddddddo',
  '.oooooooooooooo',
];
const HEAD: Sprite = [
  '...oooooooooo...',
  '..ollllllsssdo..',
  '..ollllllsssdo..',
  '..ollllllsssdo..',
  '..olllllllssdo..',
  '..olllllllssdo..',
  '.oollllllsssddo.',
  '.oddddddddddddo.',
  '.oleeedllleeedo.',
  'ooleeedllleeddoo',
  'olllllllllsssddo',
  'ollllllllssssddo',
  'olllllslllsssddo',
  'ollllssllllssddo',
  'ollllssllllssddo',
  'ollllsslllllsddo',
  'olllsssllllllddo',
  'olllsddddddddddo',
  '.ollsssssssssdo.',
  '.olllsssssssddo.',
  '.oldddddddddddo.',
  '.olllssssssssdo.',
  '.olllllsssssddo.',
  '.olllllllsssddo.',
  '..odddddddddddo.',
  '...ossssssssdo..',
  '...ossssssssdo..',
];

const TORSO: Sprite = [
  '...ossssssssdo..',
  '..olsssssssssdo.',
  '.olssssssssssddo',
  '.oldssssssssdddo',
  '.oldsssssssssddo',
  '.olsdssssssssddo',
  '.olsdssssssssddo',
  '.olssdsssssssddo',
  '.olsssdssssssddo',
  '.olssssddssssddo',
  '.olsssssdddddddo',
  '.olssssssssssddo',
  '.olssssssssssddo',
  '.odddddddddddddo',
  '.oooooooooooooo.',
];
const MOAI_BIG: Sprite = [...HEAD.slice(0, HEAD.length - 2), ...TORSO];

const PUKAO: Sprite = ['..oooooo..', '.orrrrrro.', '.orrrrRRo.', '..oooooo..'];
const PUKAO_W = 10;

const stonePalette = paletteBy<K>((c) => ({ o: c.ink, l: c.stoneHi, s: c.stone, d: c.stoneLo, e: c.ink, r: c.pukao, R: c.rockLo }));

// ---- layout ----

type Layout = {
  /** The sea's horizon, where it meets the land behind the platform, and the platform's top. */
  readonly hz: number;
  readonly shore: number;
  readonly ahu: number;
  /** The platform's ends and how many stand on it. */
  readonly x0: number;
  readonly x1: number;
  readonly count: number;
  /** The rocks where the waves break, and the heads buried in the foreground (left, foot row, mirrored or not). */
  readonly rocksX: number;
  readonly heads: readonly (readonly [number, number, number])[];
  /** Where the sun goes down, between two of the statues. */
  readonly sunX: number;
};

const layoutOf = (f: Frame): Layout =>
  wideOf(f)
    ? {
        hz: Math.round(f.h * 0.66),
        shore: Math.round(f.h * 0.72),
        ahu: Math.round(f.h * 0.86),
        x0: Math.round(f.w * 0.14),
        x1: Math.round(f.w * 0.84),
        count: 7,
        rocksX: Math.round(f.w * 0.87),
        heads: [[Math.round(f.w * 0.02), f.h + 6, 0]],
        sunX: Math.round(f.w * 0.54),
      }
    : {
        hz: Math.round(f.h * 0.73),
        shore: Math.round(f.h * 0.76),
        ahu: Math.round(f.h * 0.81),
        x0: Math.round(f.w * 0.04),
        x1: Math.round(f.w * 0.96),
        count: 5,
        rocksX: Math.round(f.w * 0.78),
        heads: [
          [Math.round(f.w * 0.64), f.h - 14, 1],
          [Math.round(f.w * 0.12), f.h + 6, 0],
        ],
        sunX: Math.round(f.w * 0.59),
      };

// ---- sky and sea ----

// The sky's light: the Milky Way rising out of the sea at night, the sun's glow at sunset.
const paintLight = (g: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  if (!isDark(c.sky0)) {
    drawGlow(g, c.sun, l.sunX, l.hz, Math.round(f.w * 0.4), Math.round(l.hz * 0.6), 0.55, 6);
    return;
  }
  if (c.rain !== c.sky0) return;
  const galaxy = { x0: f.w * 0.92, y0: l.hz, x1: f.w * 0.05, y1: -l.hz * 0.15, half: 30, seed: 29, sprinkle: 0.011 };
  g.drawImage(galaxyLayer(f.w, l.hz, galaxy, { glow: c.band, core: c.core, dust: c.band, stars: [c.star, c.core, c.sun] }), 0, 0);
};

// The open sea between the horizon and the shore, a bright line where it meets the sky.
const paintSea = (g: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  g.drawImage(ditherGradient(f.w, l.shore - l.hz + 2, [c.sea0, c.sea1]), 0, l.hz);
  fillRect(g, c.sky3, 0, l.hz, f.w, 1);
};

const skyLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('moai-sky', f, c, (g) => {
    const l = layoutOf(f);
    g.drawImage(ditherGradient(f.w, l.hz, [c.sky0, c.sky1, c.sky2, c.sky3]), 0, 0);
    paintLight(g, f, c, l);
    paintSea(g, f, c, l);
  });

// The setting sun: a disc half sunk into the sea, its path broken into dashes on the water.
const sunset = (ctx: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  const x = l.sunX;
  const r = 14;
  ctx.fillStyle = c.sun;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, f.w, l.hz);
  ctx.clip();
  spanDisc(ctx, x, l.hz - 6 + Math.min(1, f.t / 80) * 12, r);
  ctx.restore();
  const flick = Math.floor(f.t * 4);
  for (let y = l.hz + 2; y < l.shore; y += 2) {
    const len = 2 + Math.round(rand(y, flick) * 6);
    fillRect(ctx, c.sun, Math.round(x - len / 2 + (rand(y, flick + 1) - 0.5) * (6 + (y - l.hz) * 0.8)), y, len, 1);
  }
};

// Lightning in the storm: a forked bolt on the first kick of every other bar.
const lightning = (ctx: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  if (f.bar % 2 !== 0 || frac(f.beat / 4) > 0.12) return;
  let x = f.w * (0.2 + 0.6 * rand(f.bar, 41));
  for (let y = 0; y < l.hz; y += 3) {
    const nx = x + (rand(y, f.bar) - 0.5) * 8;
    fillRect(ctx, c.star, Math.round(Math.min(x, nx)), y, Math.max(1, Math.round(Math.abs(nx - x))), 1);
    fillRect(ctx, c.star, Math.round(nx), y, 1, 3);
    x = nx;
  }
};

const skyLife = (ctx: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  if (!isDark(c.sky0)) {
    sunset(ctx, f, c, l);
    return;
  }
  if (c.rain === c.sky0) {
    stars(ctx, f.w, l.hz, f.t, [c.star, c.core], 34, 42, 0.95);
    shootingStar(ctx, f, c.star, c.core, { every: 4, top: 2, span: l.hz * 0.4, seed: 43 });
    return;
  }
  drawMist(ctx, f, c.sky2, c.sky1, { y: l.hz * 0.1, h: 30, speed: 5, density: 1, seed: 44 });
  drawMist(ctx, f, c.sky3, c.sky2, { y: l.hz * 0.45, h: 26, speed: -4, density: 0.9, seed: 45 });
  lightning(ctx, f, c, l);
};

// Swells rolling in toward the shore: bands of foam that form, run in and fade, over and over.
const swell = (ctx: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  const depth = l.shore - l.hz;
  for (let k = 0; k < 4; k++) {
    const age = frac(f.t * 0.12 + k / 4);
    const y = Math.round(l.hz + 2 + age ** 1.6 * depth);
    for (let x = 0; x < f.w; x++) {
      const crest = ridgeNoise(x / 14 + k * 9, 46);
      if (crest > 0.4 + age * 0.3 && bayer(x, y) < 0.8 - age * 0.4) fillRect(ctx, c.foam, x, y, 1, 1);
    }
  }
  glints(ctx, f, l.hz + 2, l.shore, c.foam, Math.round(f.w / 10), 47);
};

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  ctx.drawImage(skyLayer(f, c), 0, 0);
  skyLife(ctx, f, c, l);
  swell(ctx, f, c, l);
};

// ---- the land: grass, rocks, the platform and its statues ----

const paintField = (g: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  g.drawImage(ditherGradient(f.w, f.h - l.shore, [c.grass, c.grassLo, c.grassLo]), 0, l.shore);
  for (let x = 0; x < f.w; x++) {
    const top = Math.round(l.shore - 2 + (ridgeNoise(x / 30, 48) - 0.5) * 4);
    fillRect(g, c.grass, x, top, 1, l.shore - top);
  }
  for (let y = l.shore + 2; y < f.h; y += 2)
    for (let x = (y >> 1) % 3; x < f.w; x += 3) if (rand(x, y) < (y - l.shore) / (f.h - l.shore)) fillRect(g, c.grass, x, y, 1, 1);
};

// Black volcanic rocks at the water's edge, where the waves break.
const paintRocks = (g: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  for (let x = l.rocksX - 10; x < f.w; x++) {
    const rise = Math.max(0, ridgeNoise(x / 6, 49) * 16 - 4) * Math.min(1, (x - l.rocksX + 10) / 14);
    const top = Math.round(l.shore + 2 - rise);
    fillRect(g, c.rock, x, top, 1, l.shore + 6 - top);
    fillRect(g, c.rockLo, x, top + 2, 1, l.shore + 6 - top - 2);
  }
};

const statuesOf = (l: Layout): readonly { readonly x: number; readonly sprite: Sprite; readonly hat: boolean }[] => {
  const pitch = (l.x1 - l.x0) / l.count;
  return Array.from({ length: l.count }, (_, i) => {
    const base = i % 3 === 1 ? MOAI : MOAI_BIG;
    return {
      x: Math.round(l.x0 + pitch * (i + 0.5) - (base[0]?.length ?? 0) / 2),
      sprite: i % 2 === 0 ? base : flipped(base),
      hat: i === 2 || i === l.count - 2,
    };
  });
};

// The platform: a long low wall of fitted stones.
const paintPlatform = (g: Ctx, c: Colors<K>, l: Layout): void => {
  const w = l.x1 - l.x0 + 8;
  fillRect(g, c.stoneLo, l.x0 - 4, l.ahu, w, 6);
  fillRect(g, c.stone, l.x0 - 4, l.ahu, w, 1);
  for (let x = l.x0 - 2; x < l.x1 + 4; x += 5) fillRect(g, c.ink, x, l.ahu + 2 + (x % 2), 1, 2);
  fillRect(g, c.ink, l.x0 - 4, l.ahu + 6, w, 1);
};

// The statues standing on it, a couple wearing their red stone topknots.
const paintStatues = (g: Ctx, c: Colors<K>, l: Layout): void => {
  const palette = stonePalette(c);
  for (const s of statuesOf(l)) {
    const top = l.ahu - s.sprite.length;
    const width = s.sprite[0]?.length ?? 0;
    drawSprite(g, s.sprite, palette, s.x, top);
    if (s.hat) drawSprite(g, PUKAO, palette, s.x + Math.round((width - PUKAO_W) / 2), top - 3);
  }
};

const landLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('moai-land', f, c, (g) => {
    const l = layoutOf(f);
    paintField(g, f, c, l);
    paintRocks(g, f, c, l);
    paintPlatform(g, c, l);
    paintStatues(g, c, l);
    for (const [x, foot, mirror] of l.heads) drawSprite(g, mirror ? flipped(HEAD) : HEAD, stonePalette(c), x, foot - HEAD.length);
  });

// Spray thrown up off the rocks when a wave breaks there, once a beat (higher on a kick), and foam left at their foot.
const spray = (ctx: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  const wave = Math.floor(f.beat);
  const age = frac(f.beat);
  const lift = 12 + f.kick * 10 + f.energy * 6;
  for (let i = 0; i < 24; i++) {
    if (rand(i, wave + 7) > 1 - age * 0.8) continue;
    const x = l.rocksX - 8 + rand(i, wave + 8) * (f.w - l.rocksX + 8);
    fillRect(ctx, c.foam, Math.round(x), Math.round(l.shore + rand(i, wave + 9) * 4), 1 + (i % 3 === 0 ? 1 : 0), 1);
  }
  if (age > 0.9) return;
  for (let i = 0; i < 16; i++) {
    const a = (rand(i, wave) - 0.5) * 1.6;
    const x = l.rocksX + rand(i, 51) * (f.w - l.rocksX) + Math.sin(a) * age * lift;
    const y = l.shore - Math.sin(age * Math.PI) * lift * (0.5 + rand(i, 52) * 0.5);
    fillRect(ctx, c.foam, Math.round(x), Math.round(y), age < 0.5 ? 2 : 1, 1);
  }
};

// Tufts of grass in the foreground, swaying in the sea wind.
const tufts = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  for (let i = 0; i < 30; i++) {
    const x = Math.round(rand(i, 53) * f.w);
    const y = Math.round(f.h - 2 - rand(i, 54) * 14);
    const lean = Math.round(Math.sin(f.t * 1.6 + i * 0.7) * 1.5);
    for (let k = 0; k < 4; k++) fillRect(ctx, c.grass, x + Math.round((lean * k) / 3), y - k, 1, 1);
  }
};

const land = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  ctx.drawImage(landLayer(f, c), 0, 0);
  spray(ctx, f, c, l);
  tufts(ctx, f, c);
  // A variant without rain gives the rain its sky's colour.
  if (c.rain !== c.sky0) rain(ctx, f, c.rain, { count: Math.round(f.w / 2.5), len: 6, slant: 0.35, speed: 170, seed: 55 });
};

export const moaiSky = defineScene<K>({
  id: 'moai-sky',
  title: 'Stone Watchers',
  mood: { valence: -0.4, energy: -0.2 },
  styles: ['starlit-dream', 'deep-dungeon', 'credits-roll', 'grand-field', 'trance-pop'],
  variants: [
    {
      // Night: the Milky Way rising out of the sea behind them, starlight on the stone.
      mood: { valence: -0.4, energy: -0.2 },
      colors: {
        sky0: '#04061a',
        sky1: '#0c1438',
        sky2: '#1c2a58',
        sky3: '#34406e',
        sun: '#ffe2a8',
        band: '#26346a',
        core: '#9aa2d0',
        star: '#f0f2ff',
        sea0: '#1a2450',
        sea1: '#0a1030',
        foam: '#a8b8e0',
        rock: '#14182a',
        rockLo: '#0a0c18',
        grass: '#2a4048',
        grassLo: '#121e28',
        stone: '#2c2f4a',
        stoneLo: '#1a1c30',
        stoneHi: '#4c5276',
        ink: '#06060e',
        pukao: '#6a3a40',
        rain: '#04061a',
      },
    },
    {
      // Sunset: the sun going down behind the row, the statues black against the fire.
      mood: { valence: 0.35, energy: 0.3 },
      colors: {
        sky0: '#3a3a86',
        sky1: '#a0507e',
        sky2: '#f0805a',
        sky3: '#ffc870',
        sun: '#fff0b0',
        band: '#a0507e',
        core: '#ffffff',
        star: '#ffffff',
        sea0: '#f09a6a',
        sea1: '#6a3a6a',
        foam: '#fff6e6',
        rock: '#2a1628',
        rockLo: '#1a0c1a',
        grass: '#5a4a3a',
        grassLo: '#2e1e2a',
        stone: '#2a1626',
        stoneLo: '#200e1c',
        stoneHi: '#4e2434',
        ink: '#14080e',
        pukao: '#7a2a2a',
        rain: '#3a3a86',
      },
    },
    {
      // A storm coming in off the ocean: low cloud, rain and lightning, the sea white with foam.
      mood: { valence: -0.7, energy: 0.6 },
      colors: {
        sky0: '#0e1018',
        sky1: '#1e222e',
        sky2: '#363a48',
        sky3: '#4e5262',
        sun: '#c8d0e0',
        band: '#1e222e',
        core: '#4e5262',
        star: '#f4f8ff',
        sea0: '#2a3240',
        sea1: '#141a24',
        foam: '#d8e0ec',
        rock: '#16181e',
        rockLo: '#0a0b10',
        grass: '#2e3a34',
        grassLo: '#161e1c',
        stone: '#3e4048',
        stoneLo: '#26282e',
        stoneHi: '#5c606a',
        ink: '#060608',
        pukao: '#5a2e2e',
        rain: '#7a8496',
      },
    },
  ],
  layers: [sky, land],
});
