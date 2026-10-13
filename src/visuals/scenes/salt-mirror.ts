// A salt flat after the rain, a perfect mirror: clouds (or the Milky Way, or a rising sun) above and below,
// an old 4x4 parked far off, and a girl in a straw hat standing on the sky, sending out ripples as she steps.
import { type Ctx, drawSprite, fillRect, type Sprite } from 'mojipx';
import { bayer, ditherGradient, frac, hexToRgb, memoCanvas, noise1, pixelLine, rand, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { drawGlow, driftingClouds, paletteBy, setPixel, spanDisc } from './batch-1-helpers.ts';
import { frameLayer, glints, mirrorWater, ring, wideOf } from './batch-6-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sky3'
  | 'cloud'
  | 'mount'
  | 'salt'
  | 'sun'
  | 'star'
  | 'car'
  | 'carLo'
  | 'lamp'
  | 'outline'
  | 'hat'
  | 'hatLo'
  | 'hair'
  | 'hairHi'
  | 'hairLo'
  | 'skin'
  | 'skinLo'
  | 'blush'
  | 'dress'
  | 'dressLo'
  | 'scarf'
  | 'scarfLo';

// The traveler: o outline, H/h straw hat, r/R ribbon, a/A/d hair, s/S skin, e eye, w eye light, i iris, b blush,
// m mouth, f/F coral shawl, D/E white sundress.
const GIRL: Sprite = [
  '..........oooooooooo..........',
  '.........oHHHHHHHHHHo.........',
  '........oHHHHHHHHHHHHo........',
  '........oHHHHHHHHHhhho........',
  '........orrrrrrrrrrrRo........',
  '...ooHHHHHHHHHHHHHHHHHHHHoo...',
  '.ooHHHHHHHHHHHHHHHHHHHHHHHHoo.',
  '.ohhhhhhhhhhhhhhhhhhhhhhhhhho.',
  '..oooodaaaaaaaaaaaaaaaaadooo..',
  '.....oaaAAaaaaaaaaaaaaAAaao...',
  '....oaaAAaaaaaaaaaaaaaaAAaaao.',
  '....oaaaaasaaaasaaaasaaaaaaao.',
  '....oaadsasssasssssassdaaaaao.',
  '....oaadssssssssssssssdaaaaaao',
  '....oaadoooossssssoooodaaaaaao',
  '....oaadsweessssssweesdaaaaaao',
  '....oaadseeesssssseeesdaaaaaao',
  '....oaadsiiissssssiiisdaaaaaao',
  '....oaadsbbsssssssbbsdAaaaaaao',
  '....oaaadSssssmsssssdAaaaaaao.',
  '....oaaaadSssssssssdaAaaaaao..',
  '....oaaaaadoSssssodaaaAaaaao..',
  '....oaaaaaaaooSsoodaaaaAaaaao.',
  '....oaaaaaaoffSSfffoaaaaAaaaao',
  '....oaaaaaoffffffffffoaaaaAaao',
  '.....oaaaofffffffffffffoaaaaao',
  '.....oaaoffFffffffffFfffoaaao.',
  '......oaoSoDDDDDDDDDDoSsoffo..',
  '.......osSoDDDDDDDDDDoSsoFfo..',
  '.......osSoDDDDDDDDDDoSsofo...',
  '.......osSoEDDDDDDDDEoSso.....',
  '.......osSorrrrrrrrrroSso.....',
  '.......osSoDDDDDDDDDDoSso.....',
  '.......ossoDDDDDDDDDDDosso....',
  '.......ossDDDDDDDDDDDDDsso....',
  '........ooDDDDDDDDDDDDDDoo....',
  '.........oDDDDDDDDDDDDDDo.....',
  '........oDDDDDDDDDDDDDDDDo....',
  '........oDDDDDDDDDDDDDDDDo....',
  '.......oDDDDDDDDDDDDDDDDDDo...',
  '.......oDDDDDDDDDDDDDDDDDDo...',
  '......oDDDDDDDDDDDDDDDDDDDDo..',
  '......oEDDDEDDDDDDEDDDDDEDDo..',
  '.....oEEEDEEEDEEEEEDEEEEDEEEo.',
  '.....oooooooooooooooooooooooo.',
  '...........osSo..osSo.........',
  '...........osSo..osSo.........',
  '...........osSo..osSo.........',
  '...........osSo..osSo.........',
  '...........osSo..osSo.........',
  '..........orrSo.orrSo.........',
  '..........ooooo.ooooo.........',
];

// One foot lifted for a step.
const LEGS_STEP: Sprite = [
  '...........osSo..osSo.........',
  '...........osSo..osSo.........',
  '...........osSo..osSo.........',
  '..........orrSo..osSo.........',
  '..........ooooo..osSo.........',
  '................orrSo.........',
  '................ooooo.........',
];

const EYE = new Set(['w', 'e', 'i']);

// Eyes closed: the eye pixels become skin, with the lash line moved down to where the lids meet.
const blinked = (s: Sprite): Sprite =>
  s.map((row, y) =>
    y < 14 || y > 17
      ? row
      : [...row].map((ch, x) => (x > 7 && x < 22 && (EYE.has(ch) || (y === 14 && ch === 'o')) ? (y === 16 ? 'o' : 's') : ch)).join(''),
  );

// The skirt caught by the breeze, one pixel to the side.
const swayed = (s: Sprite): Sprite => s.map((row, y) => (y >= 36 && y <= 43 ? `.${row.slice(0, -1)}` : row));

const STEP: Sprite = [...GIRL.slice(0, GIRL.length - LEGS_STEP.length), ...LEGS_STEP];

// Every combination of step, sway and blink, built once so each keeps its identity for the sprite cache.
const FRAMES: readonly Sprite[] = [GIRL, STEP].flatMap((base) => [base, blinked(base), swayed(base), swayed(blinked(base))]);
const UNDER: readonly Sprite[] = FRAMES.map((s) => [...s].reverse());

// An old four-by-four with bags on the roof rack: L/M/N luggage, k rack and tyres, b/B body, g glass, h headlight.
const CAR: Sprite = [
  '........LLLLL.MMMMMM..........',
  '.......LLLLLLLMMMMMMNN........',
  '.....kkkkkkkkkkkkkkkkkkkk.....',
  '.....k....k.....k.....k.k.....',
  '....obbbbbbbbbbbbbbbbbbbbbo...',
  '...obggggobggggggobgggggbbo...',
  '..obgggggobggggggobggggggbbo..',
  '.obbgggggobggggggobggggggbbbok',
  'obbbbbbbbbbbbbbbbbbbbbbbbbbbkk',
  'hbbbbbbbbbbbkbbbbbbbbbbbbbbbkk',
  'oBBBBBBBBBBBBBBBBBBBBBBBBBBBko',
  'kkkBBBBBBBBBBBBBBBBBBBBBBBkkk.',
  '..kkkkk..............kkkkk....',
  '.kkkBkkk............kkkBkkk...',
  '.kkBBBkk............kkBBBkk...',
  '.kkkBkkk............kkkBkkk...',
  '..kkkkk..............kkkkk....',
];
const CAR_UNDER: Sprite = [...CAR].reverse();

const girlPalette = paletteBy<K>((c) => ({
  o: c.outline,
  H: c.hat,
  h: c.hatLo,
  r: c.scarf,
  R: c.scarfLo,
  a: c.hair,
  A: c.hairHi,
  d: c.hairLo,
  s: c.skin,
  S: c.skinLo,
  e: c.outline,
  w: c.dress,
  i: c.hairHi,
  b: c.blush,
  m: c.scarfLo,
  D: c.dress,
  E: c.dressLo,
  f: c.scarf,
  F: c.scarfLo,
}));

const carPalette = paletteBy<K>((c) => ({
  L: c.scarf,
  M: c.mount,
  N: c.outline,
  k: c.outline,
  o: c.outline,
  b: c.car,
  B: c.carLo,
  g: c.sky2,
  h: c.lamp,
}));

// ---- layout ----

const horizonOf = (f: Frame): number => Math.round(f.h * 0.5);
const girlOf = (f: Frame): { readonly x: number; readonly feet: number } => ({
  x: Math.round(f.w * (wideOf(f) ? 0.36 : 0.42)),
  feet: horizonOf(f) + (wideOf(f) ? 24 : 34),
});
const carOf = (f: Frame): { readonly x: number; readonly base: number } => ({
  x: Math.round(f.w * (wideOf(f) ? 0.72 : 0.7)),
  base: horizonOf(f) + (wideOf(f) ? 5 : 7),
});

const night = (c: Colors<K>): boolean => c.star !== c.sky0;

// ---- sky ----

// Which tone a pixel of the Milky Way takes, by its distance d from the band's spine (0 … 1): 0 the dark rift,
// 1 a star, 2 the bright core, 3 the glow, or -1 for none.
const milkyTone = (x: number, y: number, d: number): number => {
  const core = (1 - d) ** 2 * (0.45 + 0.4 * noise1(y / 9 + x / 30, 9));
  if (d < 0.22 && noise1(y / 6, 10) > 0.45) return 0;
  if (rand(x * 131 + y, 12) < core * 0.22) return 1;
  if (bayer(x, y) < core - 0.45) return 2;
  return bayer(x, y) < core * 1.2 ? 3 : -1;
};

// The Milky Way: a dithered band slanting down to the horizon, a dark rift along its middle, thick with small stars.
const milkyWay = (f: Frame, hz: number, c: Colors<K>): HTMLCanvasElement =>
  memoCanvas(`b6:milky:${f.w}x${hz}:${c.sky1}:${c.sky2}:${c.star}:${c.salt}`, f.w, hz, (img) => {
    const tones = [c.sky1, c.star, c.salt, c.sky2].map(hexToRgb);
    const half = Math.min(f.w, f.h) * 0.16;
    for (let y = 0; y < hz; y++) {
      const spine = f.w * (0.12 + (0.78 * y) / hz) - (noise1(y / 14, 8) - 0.5) * half * 0.8;
      for (let x = Math.max(0, Math.floor(spine - half)); x < Math.min(f.w, spine + half); x++) {
        const tone = tones[milkyTone(x, y, Math.abs(x - spine) / half)];
        if (tone) setPixel(img, x, y, tone);
      }
    }
  });

const skyLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('salt-sky', f, c, (g) => {
    const hz = horizonOf(f);
    g.drawImage(ditherGradient(f.w, hz, [c.sky0, c.sky1, c.sky2, c.sky3]), 0, 0);
    if (night(c)) g.drawImage(milkyWay(f, hz, c), 0, 0);
  });

// Far volcanoes, low on the horizon (in front of the rising sun).
const mountLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('salt-mounts', f, c, (g) => {
    const hz = horizonOf(f);
    // On a tall screen the range is shifted so the nearer volcano stands clear of the parked car.
    const shift = wideOf(f) ? 0 : 100;
    g.fillStyle = c.mount;
    for (let x = 0; x < f.w; x++) {
      const rise = (noise1((x + shift) / 22, 21) - 0.4) * 26 + (noise1(x / 5, 22) - 0.5) * 3;
      if (rise > 0.5) g.fillRect(x, Math.round(hz - rise), 1, Math.ceil(rise));
    }
  });

const meteor = (ctx: Ctx, f: Frame, c: Colors<K>, hz: number): void => {
  const cycle = Math.floor(f.beat / 32);
  const p = frac(f.beat / 32) / 0.05;
  if (p > 1) return;
  const x = f.w * (0.3 + rand(cycle, 31) * 0.6) - p * 40;
  const y = hz * (0.1 + rand(cycle, 32) * 0.3) + p * 22;
  pixelLine(ctx, x, y, x + 12, y - 6, c.sky2);
  pixelLine(ctx, x, y, x + 5, y - 2, c.star);
};

// The sun coming up behind the flat, rising a little while the scene is on.
const sunrise = (ctx: Ctx, f: Frame, c: Colors<K>, hz: number): void => {
  const r = Math.round(Math.min(f.w, f.h) * 0.07);
  const x = Math.round(f.w * 0.56);
  const y = Math.round(hz + r * 0.2 - Math.min(1, f.t / 80) * r * 0.9);
  drawGlow(ctx, c.sun, x, hz - 2, r * 6, r * 2, 0.6);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, f.w, hz);
  ctx.clip();
  ctx.fillStyle = c.sun;
  spanDisc(ctx, x, y, r);
  ctx.restore();
};

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const hz = horizonOf(f);
  ctx.drawImage(skyLayer(f, c), 0, 0);
  if (night(c)) {
    stars(ctx, f.w, hz - 3, f.t, [c.star, c.salt], Math.round((f.w * hz) / 260), 77, 1);
    meteor(ctx, f, c, hz);
  }
  if (c.sun !== c.sky0) sunrise(ctx, f, c, hz);
  ctx.drawImage(mountLayer(f, c), 0, 0);
  if (c.cloud === c.sky0) return;
  const short = Math.min(f.w, f.h);
  driftingClouds(ctx, f, c.cloud, c.sky2, { count: 5, top: hz * 0.25, span: hz * 0.55, size: short * 0.09, speed: 1.6, seed: 13 });
};

// ---- the mirror and what stands on it ----

const flat = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const hz = horizonOf(f);
  mirrorWater(ctx, f, { axis: hz, bottom: f.h, squash: 1, amp: 0.6, freq: 0.35, speed: 0.9, tint: c.sky1, tintLevel: 0.16 });
  fillRect(ctx, c.salt, 0, hz, f.w, 1);
  glints(ctx, f, hz + Math.round((f.h - hz) * 0.45), f.h, c.salt, Math.round(f.w / 7), 44);
};

const car = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const p = carOf(f);
  const x = p.x - (CAR[0]?.length ?? 0) / 2;
  if (c.lamp !== c.car) drawGlow(ctx, c.lamp, x - 4, p.base - 6, 14, 5, 0.5);
  drawSprite(ctx, CAR, carPalette(c), x, p.base - CAR.length);
  ctx.save();
  ctx.globalAlpha = 0.7;
  drawSprite(ctx, CAR_UNDER, carPalette(c), x, p.base);
  ctx.restore();
};

// The lantern she carries after dark, hanging from her right hand: its cap at row y, the handle on the hand's side
// (above, or below in the reflection) and the lit body on the other.
const LANTERN_ROW = 37;

const lantern = (ctx: Ctx, c: Colors<K>, x: number, y: number, upright: boolean): void => {
  const body = upright ? y + 1 : y - 3;
  drawGlow(ctx, c.lamp, x + 1, body + 1, 9, 9, 0.55);
  fillRect(ctx, c.outline, x + 1, upright ? y - 2 : y + 1, 1, 2);
  fillRect(ctx, c.outline, x, y, 3, 1);
  fillRect(ctx, c.lamp, x, body, 3, 3);
};

const frameOf = (f: Frame): number => {
  const step = Math.floor(f.beat) % 4 === 3 && frac(f.beat) < 0.5 ? 4 : 0;
  const sway = frac(f.t * 0.45) < 0.5 ? 2 : 0;
  const blink = frac(f.t / 3.4 + 0.3) < 0.05 ? 1 : 0;
  return step + sway + blink;
};

// Rings spreading from her feet, a new one on every beat.
const ripples = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, feet: number): void => {
  for (let k = 0; k < 3; k++) {
    const age = frac(f.beat) + k;
    ring(ctx, x, feet, 3 + age * 8, 0.22, k === 0 ? c.salt : c.sky3);
  }
};

// Ribbon tails and a loose strand of hair fluttering in the wind.
const flutter = (ctx: Ctx, f: Frame, c: Colors<K>, left: number, top: number): void => {
  const wave = Math.floor(f.t * 4) % 2;
  fillRect(ctx, c.scarf, left + 22, top + 4 + wave, 3, 1);
  fillRect(ctx, c.scarfLo, left + 25, top + 5 - wave, 2, 1);
  fillRect(ctx, c.hair, left + 30, top + 24 + wave, 1, 3);
};

const girl = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const g = girlOf(f);
  const i = frameOf(f);
  const left = g.x - 15;
  const top = g.feet - GIRL.length;
  const palette = girlPalette(c);
  ctx.save();
  ctx.globalAlpha = 0.75;
  drawSprite(ctx, UNDER[i] as Sprite, palette, left, g.feet);
  if (night(c)) lantern(ctx, c, left + 22, g.feet + GIRL.length - 1 - LANTERN_ROW, false);
  ctx.restore();
  ripples(ctx, f, c, g.x, g.feet);
  drawSprite(ctx, FRAMES[i] as Sprite, palette, left, top);
  flutter(ctx, f, c, left, top);
  if (night(c)) lantern(ctx, c, left + 22, top + LANTERN_ROW, true);
};

export const saltMirror = defineScene<K>({
  id: 'salt-mirror',
  title: 'Sky Mirror',
  mood: { valence: 0.1, energy: -0.7 },
  styles: ['starlit-dream', 'lofi-loop', 'grand-field', 'credits-roll', 'trance-pop'],
  variants: [
    {
      // Midday after rain: blue sky and white clouds, above and below.
      mood: { valence: 0.2, energy: -0.7 },
      colors: {
        sky0: '#2a64c8',
        sky1: '#4a8ee2',
        sky2: '#8cc4f4',
        sky3: '#e2f2ff',
        cloud: '#ffffff',
        mount: '#7a96c4',
        salt: '#ffffff',
        sun: '#2a64c8',
        star: '#2a64c8',
        car: '#e8d8b0',
        carLo: '#a89870',
        lamp: '#e8d8b0',
        outline: '#3a2430',
        hat: '#f6dca0',
        hatLo: '#d0a868',
        hair: '#6a3a2a',
        hairHi: '#b0603a',
        hairLo: '#4a2620',
        skin: '#ffe0cc',
        skinLo: '#f0b8a0',
        blush: '#ff9ab0',
        dress: '#ffffff',
        dressLo: '#c8d8f0',
        scarf: '#f07a5a',
        scarfLo: '#c04a4a',
      },
    },
    {
      // Night: the Milky Way doubled in the flat, a lantern in her hand and the car's lights on.
      mood: { valence: -0.3, energy: -0.45 },
      colors: {
        sky0: '#04051a',
        sky1: '#0a0f32',
        sky2: '#2c2c6e',
        sky3: '#1e2c5e',
        cloud: '#04051a',
        mount: '#080c26',
        salt: '#6a74c8',
        sun: '#04051a',
        star: '#f4f0ff',
        car: '#3a3a52',
        carLo: '#24243a',
        lamp: '#ffd890',
        outline: '#0e0c1a',
        hat: '#b0a49c',
        hatLo: '#76687a',
        hair: '#3a2a3e',
        hairHi: '#7a5a6a',
        hairLo: '#24182a',
        skin: '#e0c4c0',
        skinLo: '#b090a0',
        blush: '#e88aa0',
        dress: '#c4cae8',
        dressLo: '#8088b4',
        scarf: '#c86a6a',
        scarfLo: '#8a3a52',
      },
    },
    {
      // Sunrise: a pink sky, the sun coming up twice.
      mood: { valence: 0.5, energy: 0.1 },
      colors: {
        sky0: '#3a4a9a',
        sky1: '#9a7ab8',
        sky2: '#f0a0a8',
        sky3: '#ffd8a8',
        cloud: '#ffd0c0',
        mount: '#6a5a8a',
        salt: '#fff0d8',
        sun: '#fff4c8',
        star: '#3a4a9a',
        car: '#e8c8a8',
        carLo: '#9a7a80',
        lamp: '#e8c8a8',
        outline: '#3a2236',
        hat: '#ffd8a0',
        hatLo: '#d09a78',
        hair: '#6a3434',
        hairHi: '#c0684a',
        hairLo: '#4a2028',
        skin: '#ffd8c4',
        skinLo: '#f0a898',
        blush: '#ff8aa0',
        dress: '#fff2ea',
        dressLo: '#e0b8c8',
        scarf: '#ff7a6a',
        scarfLo: '#c84a5a',
      },
    },
  ],
  layers: [sky, flat, car, girl],
});
