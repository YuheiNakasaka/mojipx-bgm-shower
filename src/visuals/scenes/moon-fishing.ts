// A girl in a nightcap sits on the crescent moon with her cat, fishing stars out of the night: one has bitten and
// wriggles on the line above a sea of clouds, others leap from the clouds like fish, and shooting stars slip by.
import { type Ctx, drawSprite, fillRect, type Palette, type Point, type Sprite } from 'mojipx';
import { bayer, ditherGradient, frac, pixelLine, rand, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { cloudCanvas } from './batch-1-helpers.ts';
import { drawGlow, memoLayer, tileX } from './batch-2-helpers.ts';
import { paletteOf, recentBeats, sigOf } from './batch-3-helpers.ts';
import { alternate, catTail, drawGirl, type Girl, wide } from './batch-7-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'milky'
  | 'star'
  | 'moon'
  | 'moonLo'
  | 'moonHi'
  | 'glow'
  | 'cloud'
  | 'cloudLo'
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
  | 'pj'
  | 'gold'
  | 'goldHi'
  | 'rod'
  | 'pink';

// ---- the girl: o outline, s/S skin, b blush, h/H/d hair, e/E eyes, w glint, m mouth,
// c/C star-print nightcap and pyjamas, f/F fluffy trim ----

const HEAD: Sprite = [
  '.............ooooooo............',
  '...........oocccCcccoooo........',
  '..........occccccccCccccoo......',
  '.........occCccccccccccccccoo...',
  '........occccccCccccccccoocccCo.',
  '.......occcCccccccccCcccoocCcco.',
  '......occcccccccCccccccccooccco.',
  '......occCccccccccccccCccooccCo.',
  '.....occcccccCcccccccccCcoocCco.',
  '.....occcCcccccccccCcccccooccco.',
  '....offffffffffffffffffffooccco.',
  '....ofFffFffFffFffFffFfffo.oooo.',
  '.....ohhhhhhhhhhhhhhhhhho.offFfo',
  '....ohhhhhhhhhhhhhhhhhhhhoofffFo',
  '....ohhhhhhhhdhhdhhhhhhhhooffffo',
  '....ohhhhdhhdShhSdhhdhhhho.oooo.',
  '....ohhddSddSsddsSddSddhho......',
  '....ohdSoooossSSssooooSdho......',
  '....ohdssweesssssseewssdho......',
  '....ohdsseEesssssseEessdho......',
  '....ohdssEEEssssssEEEssdho......',
  '....ohdsbbbssssssssbbbsdho......',
  '....ohdsssssssmmsssssssdho......',
  '....ohhoSssssssssssssSohho......',
  '....ohho.oSssssssssSo.ohho......',
  '....ohhho..ooSssSoo..ohhho......',
  '....ohhho....oooo....ohhho......',
];

const BODY: Sprite = [
  '...........oSSSSSSo...........',
  '.........ooccccccccoo.........',
  '.......ooccccccccccccoo.......',
  '......ocCccccccccccccCco......',
  '.....occcccCccccccCccccco.....',
  '....ocCccccoccccccoccccCco....',
  '....occcCcoCccccccCocCccco....',
  '....occcccoccCccCccoccccco....',
  '....ocCcccoCccccccCocccCco....',
  '....occccsoossssssooscccco....',
  '.....ooooooSSssssSSoooooo.....',
  '......occcCccccccccCccco......',
  '.....occCccccccccccccCcco.....',
  '.....occccccccoocccccccco.....',
  '.....occcCccccooccccCccco.....',
  '......ossso..oooo..ossso......',
  '......ossso........ossso......',
  '......oSsso........ossSo......',
  '.......oooo........oooo.......',
];

// Her long hair, and the same hair lifted by the wind.
const HAIR_A: Sprite = [
  '..........oooooooooooo..........',
  '........oohhhhhhhhhhhhoo........',
  '.......ohhhhhhhhhhhhhhhho.......',
  '......ohhhhhhhhhhhhhhhhhho......',
  '......ohhhhhhhhhhhhhhhhhho......',
  '.....ohhhhhhhhhhhhhhhhhhhho.....',
  '.....ohhdhhhhhhhhhhhhhhdhho.....',
  '.....ohhdhhhhhhhhhhhhhhdhho.....',
  '....ohhdhhhhhhhhhhhhhhhhdhho....',
  '....ohhdhhhhhhhhhhhhhhhhdhho....',
  '....ohhdhhhhhhhhhhhhhhhhdhho....',
  '...ohhdhhhhhhhhhhhhhhhhhhdhho...',
  '...ohhdhhhhhhhhhhhhhhhhhhdhho...',
  '...ohhdhhhhhhhhhhhhhhhhhhdhho...',
  '...ohhhdhhhhhhhhhhhhhhhhdhhho...',
  '....ohhdhhhhhhhhhhhhhhhhdhho....',
  '....ohhdhhhhhhhhhhhhhhhhdhho....',
  '.....ohhdhhhhhhhhhhhhhhdhho.....',
  '.....ohhdhhhhhhhhhhhhhhdhho.....',
  '....ohhdhhhhhhhhhhhhhhhhdhho....',
  '....ohhdhhhhhhhhhhhhhhhhdhho....',
  '...ohhdhhhhhhhhhhhhhhhhhhdhho...',
  '...ohhdhhhhhhhhhhhhhhhhhhdhho...',
  '....ohdhhhhhhhhhhhhhhhhhhdho....',
  '.....oohhhhhhhhhhhhhhhhhhoo.....',
  '.......oooooooooooooooooo.......',
];

const HAIR_B: Sprite = [
  '..........oooooooooooo..........',
  '........oohhhhhhhhhhhhoo........',
  '.......ohhhhhhhhhhhhhhhho.......',
  '......ohhhhhhhhhhhhhhhhhho......',
  '......ohhhhhhhhhhhhhhhhhho......',
  '.....ohhhhhhhhhhhhhhhhhhhho.....',
  '.....ohhdhhhhhhhhhhhhhhdhho.....',
  '.....ohhdhhhhhhhhhhhhhhdhho.....',
  '....ohhdhhhhhhhhhhhhhhhhdhho....',
  '....ohhdhhhhhhhhhhhhhhhhdhho....',
  '....ohhdhhhhhhhhhhhhhhhhdhho....',
  '...ohhdhhhhhhhhhhhhhhhhhhdhho...',
  '..ohhdhhhhhhhhhhhhhhhhhhdhho....',
  '..ohhdhhhhhhhhhhhhhhhhhhdhho....',
  '..ohhhdhhhhhhhhhhhhhhhhdhhho....',
  '...ohhdhhhhhhhhhhhhhhhhdhho.....',
  '...ohhdhhhhhhhhhhhhhhhhdhho.....',
  '....ohhdhhhhhhhhhhhhhhdhho......',
  '....ohhdhhhhhhhhhhhhhhdhho......',
  '...ohhdhhhhhhhhhhhhhhhhdhho.....',
  '..ohhdhhhhhhhhhhhhhhhhdhho......',
  '.ohhdhhhhhhhhhhhhhhhhhhdhho.....',
  '.ohhdhhhhhhhhhhhhhhhhhhdhho.....',
  '..ohdhhhhhhhhhhhhhhhhhhdho......',
  '...oohhhhhhhhhhhhhhhhhhoo.......',
  '.....oooooooooooooooooo.........',
];

const GIRL: Girl = {
  eyes: [
    { x: 9, y: 17, out: -1 },
    { x: 18, y: 17, out: 1 },
  ],
  seed: 31,
};
const SEAT = 36;

// The catch: a little star with a face, wriggling. y/Y gold, e eyes.
const STAR_A: Sprite = [
  '....o....',
  '...oyo...',
  '...oyo...',
  'ooooYoooo',
  'oyyeyeyyo',
  '.oyyyyyo.',
  '..oyyyo..',
  '.oyyoyyo.',
  '.oyo.oyo.',
  '.oo...oo.',
];
const STAR_B: Sprite = [
  '....o....',
  '...oyo...',
  'o..oyo..o',
  'oyooYoooy',
  '.oyeyeyyo',
  '..oyyyyo.',
  '..oyyyo..',
  '..oyoyyo.',
  '..oo.oyo.',
  '......oo.',
];

// Her white cat, eyes on the line: k fur, K shade, y eyes, p nose.
const KITTY: Sprite = [
  '.o......o...',
  'oko....oko..',
  'okkoooookko.',
  'okkkkkkkkko.',
  'okkkkykkkyo.',
  'okkkkkkkpko.',
  '.okkkkkkkko.',
  '..okkkkkko..',
  '.okkkkkkkko.',
  'okkkkkkkkkko',
  'okkkkkkkkkko',
  'okKkkkkkkKko',
  'okKkkkkkkKko',
  '.oooooooooo.',
];

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
  c: c.pj,
  C: c.goldHi,
  f: c.white,
  F: c.whiteLo,
});
const starPalette = (c: Colors<K>): Palette => ({ o: c.ink, y: c.gold, Y: c.goldHi, e: c.ink });
const kittyPalette = (c: Colors<K>): Palette => ({ o: c.ink, k: c.white, K: c.whiteLo, y: c.gold, p: c.pink });

// ---- layout: the crescent is a disc with a smaller disc taken out of its upper right ----

type Moon = { readonly cx: number; readonly cy: number; readonly r: number; readonly ix: number; readonly iy: number; readonly ir: number };

const moonOf = (f: Frame): Moon => {
  const short = Math.min(f.w, f.h);
  const r = Math.round(short * (wide(f) ? 0.36 : 0.4));
  const cx = Math.round(f.w * (wide(f) ? 0.34 : 0.42));
  const cy = Math.round(f.h * (wide(f) ? 0.42 : 0.34));
  return { cx, cy, r, ix: Math.round(cx + r * 0.42), iy: Math.round(cy - r * 0.22), ir: Math.round(r * 0.86) };
};

// The top of the lower horn at x: the bottom of the inner disc.
const hornTop = (m: Moon, x: number): number => Math.round(m.iy + Math.sqrt(Math.max(0, m.ir * m.ir - (x - m.ix) ** 2)));

const seaOf = (f: Frame): number => Math.round(f.h * (wide(f) ? 0.8 : 0.76));

// ---- the sky ----

const skyLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`mf-sky:${sigOf(c)}`, f.w, f.h, (g) => {
    g.drawImage(ditherGradient(f.w, f.h, [c.sky0, c.sky1, c.sky2, c.sky2]), 0, 0);
    // A milky way crossing the sky on a slant.
    for (let x = 0; x < f.w; x++) {
      const mid = f.h * 0.15 + x * (wide(f) ? 0.35 : 0.9);
      for (let y = Math.round(mid - 22); y < mid + 22; y++) {
        const d = Math.abs(y - mid) / 22;
        if ((1 - d) * 0.45 > bayer(x, y)) fillRect(g, c.milky, x, y, 1, 1);
        if (rand(x, y) < 0.05 * (1 - d)) fillRect(g, c.star, x, y, 1, 1);
      }
    }
  });

const moonLayer = (m: Moon, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`mf-moon:${m.r}:${sigOf(c)}`, m.r * 2 + 3, m.r * 2 + 3, (g) => {
    const o = m.r + 1;
    for (let y = -m.r - 1; y <= m.r + 1; y++) {
      for (let x = -m.r - 1; x <= m.r + 1; x++) {
        const d = Math.hypot(x, y);
        const inner = Math.hypot(x + m.cx - m.ix, y + m.cy - m.iy);
        if (inner <= m.ir || d > m.r + 1) continue;
        const rim = d > m.r || inner < m.ir + 1;
        fillRect(g, rim ? c.ink : moonShade(x, y, d, inner, m, c), x + o, y + o, 1, 1);
      }
    }
  });

// Bright along the outer edge, cooler toward the inner curve, with a few soft craters.
const moonShade = (x: number, y: number, d: number, inner: number, m: Moon, c: Colors<K>): string => {
  const crater =
    (Math.hypot(x + m.r * 0.5, y - m.r * 0.2) < m.r * 0.12 || Math.hypot(x + m.r * 0.15, y - m.r * 0.65) < m.r * 0.08) && bayer(x, y) < 0.6;
  if (crater) return c.moonLo;
  if (d > m.r - 3) return c.moonHi;
  return (inner - m.ir) / (m.r * 0.5) < bayer(x, y) * 0.6 ? c.moonLo : c.moon;
};

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(skyLayer(f, c), 0, 0);
  stars(ctx, f.w, f.h, f.t, [c.star, c.goldHi, c.white], Math.round((f.w * f.h) / 450), 61, 0.78);
  shootingStar(ctx, f, c);
};

// Every so often a shooting star slips down across the sky.
const shootingStar = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const cycle = Math.floor(f.t / 6);
  const age = frac(f.t / 6) * 6;
  if (age > 0.8) return;
  const x0 = f.w * (0.3 + rand(cycle, 71) * 0.6);
  const y0 = f.h * (0.05 + rand(cycle, 72) * 0.25);
  const x = x0 - age * 90;
  const y = y0 + age * 40;
  for (let k = 0; k < 10; k++) fillRect(ctx, k < 3 ? c.white : c.milky, Math.round(x + k * 2), Math.round(y - k * 0.9), 1, 1);
};

const moonGlow = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = moonOf(f);
  drawGlow(ctx, m.cx - Math.round(m.r * 0.2), m.cy, Math.round(m.r * 1.3), c.glow, 0.45);
  ctx.drawImage(moonLayer(m, c), m.cx - m.r - 1, m.cy - m.r - 1);
};

// ---- the sea of clouds, and stars leaping out of it like fish ----

const seaLayer = (w: number, size: number, light: string, shade: string, seed: number): HTMLCanvasElement =>
  memoLayer(`mf-sea:${size}:${light}:${shade}:${seed}`, w, size * 2, (g) => {
    for (let x = -size, i = 0; x < w; i++) {
      const cloud = cloudCanvas(i % 3, size * (0.8 + rand(i, seed) * 0.5), light, shade);
      g.drawImage(cloud, x, size * 2 - cloud.height);
      x += Math.round(cloud.width * 0.55);
    }
    fillRect(g, shade, 0, size * 2 - 2, w, 2);
  });

const sea = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const top = seaOf(f);
  const s = Math.round(Math.min(f.w, f.h) * 0.07);
  tileX(ctx, seaLayer(240, s, c.cloudLo, c.sky2, 3), f.t * 2, top - s, f.w);
  fillRect(ctx, c.sky2, 0, top + s - 1, f.w, f.h - top);
  tileX(ctx, seaLayer(256, s + 3, c.cloud, c.cloudLo, 7), f.t * 4 + 40, top + 2, f.w);
  const floor = top + s * 2 + 6;
  ctx.drawImage(ditherGradient(f.w, Math.max(1, f.h - floor), [c.cloudLo, c.cloudLo, c.sky2]), 0, floor);
  tileX(ctx, seaLayer(272, s + 8, c.cloud, c.cloudLo, 11), f.t * 7 + 90, floor + Math.round((f.h - floor) * 0.35), f.w);
};

const leaps = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const top = seaOf(f) + 4;
  recentBeats(f.beat, 3, (b, age) => {
    if (b % 3 !== 0) return;
    const x0 = f.w * (0.55 + rand(b, 81) * 0.4);
    const k = age / 3;
    const x = Math.round(x0 + k * 26);
    const y = Math.round(top - Math.sin(k * Math.PI) * 30);
    fillRect(ctx, c.goldHi, x, y, 2, 2);
    fillRect(ctx, c.gold, x - 1, y + 1, 1, 1);
    fillRect(ctx, c.gold, x + 2, y + 1, 1, 1);
    fillRect(ctx, c.gold, Math.round(x - k * 6), y + 3, 1, 1);
  });
};

// ---- the girl, her cat, the rod and the catch ----

// The star tugs at the start of every bar; the rod dips and springs back.
const tugOf = (beat: number): number => {
  const age = (((beat % 4) + 4) % 4) * 0.6;
  return Math.exp(-age * 2.5) * Math.sin(age * 9);
};

type Rod = { readonly x0: number; readonly y0: number; readonly tx: number; readonly ty: number };

const rodOf = (f: Frame): Rod => {
  const m = moonOf(f);
  const sx = Math.round(m.cx + m.r * 0.1);
  const top = hornTop(m, sx);
  const tug = tugOf(f.beat);
  return { x0: sx + 2, y0: top - 2, tx: sx + 46, ty: Math.round(top - 34 + tug * 4) };
};

const girl = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = moonOf(f);
  const sx = Math.round(m.cx + m.r * 0.1);
  const x = sx - 16;
  const y = hornTop(m, sx) - SEAT;
  const palette = paletteOf(c, girlPalette);
  drawSprite(ctx, alternate(f.t, 1.3) === 0 ? HAIR_A : HAIR_B, palette, x, y + 8);
  drawSprite(ctx, BODY, palette, x + 1, y + 26);
  drawGirl(ctx, f, HEAD, palette, x, y, GIRL);
};

const kitty = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = moonOf(f);
  const kx = Math.round(m.cx + m.r * 0.5);
  const top = hornTop(m, kx + 6);
  catTail(ctx, kx + 11, top - 3, 6, 4 + Math.sin(f.beat * Math.PI) * 3, c.white, c.ink, 1);
  drawSprite(ctx, KITTY, paletteOf(c, kittyPalette), kx, top - 13);
};

const rod = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const r = rodOf(f);
  pixelLine(ctx, r.x0, r.y0, r.tx, r.ty, c.rod);
  pixelLine(ctx, r.x0, r.y0 + 1, Math.round((r.x0 + r.tx) / 2), Math.round((r.y0 + r.ty) / 2) + 1, c.rod);
  fillRect(ctx, c.white, r.tx, r.ty, 1, 1);
};

// The line runs down from the rod's tip to the star, which swings and wriggles.
const catchOf = (f: Frame): Point => {
  const r = rodOf(f);
  const tug = tugOf(f.beat);
  return { x: Math.round(r.tx + 6 + Math.sin(f.t * 1.7) * 3), y: Math.round(seaOf(f) - 22 - tug * 6) };
};

const line = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const r = rodOf(f);
  const s = catchOf(f);
  pixelLine(ctx, r.tx, r.ty, s.x, s.y - 4, c.whiteLo);
  drawGlow(ctx, s.x, s.y + 3, 11, c.gold, f.kick > 0.5 ? 0.6 : 0.45);
  drawSprite(ctx, alternate(f.t * 3) === 0 ? STAR_A : STAR_B, paletteOf(c, starPalette), s.x - 4, s.y - 4);
  for (let k = 0; k < 4; k++) {
    if (frac(f.t * 1.5 + k * 0.25) > 0.5) continue;
    fillRect(
      ctx,
      c.goldHi,
      s.x - 7 + Math.round(rand(k, Math.floor(f.t * 1.5)) * 14),
      s.y - 6 + Math.round(rand(k + 9, Math.floor(f.t * 1.5)) * 14),
      1,
      1,
    );
  }
};

export const moonFishing = defineScene<K>({
  id: 'moon-fishing',
  title: 'Star Fishing',
  mood: { valence: 0.2, energy: -0.6 },
  styles: ['starlit-dream', 'lofi-loop', 'snowfall', 'credits-roll', 'showa-ballad'],
  variants: [
    {
      mood: { valence: 0.2, energy: -0.6 },
      colors: {
        sky0: '#060a26',
        sky1: '#14205a',
        sky2: '#34407e',
        milky: '#3c4c94',
        star: '#d8e0ff',
        moon: '#ffe9a0',
        moonLo: '#e8c070',
        moonHi: '#fff8d8',
        glow: '#2a3a80',
        cloud: '#c0c8f0',
        cloudLo: '#7a86c8',
        ink: '#0e0c22',
        skin: '#ffe4d4',
        skinLo: '#efb4a2',
        blush: '#ff8aa0',
        hair: '#b8a8f0',
        hairHi: '#e8e0ff',
        hairLo: '#7a68c0',
        iris: '#3a7ad8',
        white: '#fbfaff',
        whiteLo: '#c4c8e8',
        pj: '#8ab8f0',
        gold: '#ffd84a',
        goldHi: '#fff6b0',
        rod: '#8a5a3a',
        pink: '#e85a7a',
      },
    },
    {
      mood: { valence: 0.6, energy: -0.4 },
      colors: {
        sky0: '#1c1446',
        sky1: '#4a2a76',
        sky2: '#a85a90',
        milky: '#6a4a96',
        star: '#ffe0f4',
        moon: '#fff2c4',
        moonLo: '#f0c89a',
        moonHi: '#ffffff',
        glow: '#5a3a86',
        cloud: '#ffd0e0',
        cloudLo: '#c87aa8',
        ink: '#1a1028',
        skin: '#ffe6d6',
        skinLo: '#f2b4a4',
        blush: '#ff86a8',
        hair: '#c8b0f8',
        hairHi: '#f0e6ff',
        hairLo: '#8a6ac8',
        iris: '#5a6ae8',
        white: '#fffaff',
        whiteLo: '#d8c4e4',
        pj: '#a8c4f8',
        gold: '#ffe066',
        goldHi: '#fff8c8',
        rod: '#9a6040',
        pink: '#f0608a',
      },
    },
    {
      mood: { valence: -0.3, energy: -0.8 },
      colors: {
        sky0: '#04070e',
        sky1: '#0e1626',
        sky2: '#22304a',
        milky: '#1e2a44',
        star: '#c4d0e8',
        moon: '#e8eef8',
        moonLo: '#a8b4c8',
        moonHi: '#ffffff',
        glow: '#18243c',
        cloud: '#8e9ab8',
        cloudLo: '#4a5878',
        ink: '#06080e',
        skin: '#f6e0d8',
        skinLo: '#dcaaa2',
        blush: '#e88a9c',
        hair: '#a8b0d8',
        hairHi: '#dce2f8',
        hairLo: '#6a74a8',
        iris: '#4a7ab0',
        white: '#f2f6ff',
        whiteLo: '#aab4cc',
        pj: '#7a9ac8',
        gold: '#f0d070',
        goldHi: '#fff4c8',
        rod: '#6a4a3a',
        pink: '#d0687c',
      },
    },
  ],
  layers: [sky, moonGlow, sea, leaps, kitty, girl, rod, line],
});
