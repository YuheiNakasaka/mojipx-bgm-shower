// A citadel of grey stone on a saddle in the Andes, the steep green peak rising behind it: clouds drift through
// the valley and across the ruins, llamas graze on the terraces in step with the beat and a condor circles overhead.
import { type Ctx, drawSprite, fillRect, flipped, type Sprite } from 'mojipx';
import { bayer, ditherGradient, fillColumns, rand, ridgeNoise, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { colorKey, driftingClouds, paintRange, paletteBy } from './batch-1-helpers.ts';
import { isDark, noise2, pixelLayer } from './batch-5-helpers.ts';
import { frameLayer, wideOf } from './batch-6-helpers.ts';
import { drawMist, galaxyLayer, shootingStar } from './batch-10-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'far'
  | 'farLit'
  | 'haze'
  | 'green0'
  | 'green1'
  | 'green2'
  | 'rock'
  | 'stone'
  | 'stoneLo'
  | 'thatch'
  | 'cloud'
  | 'cloudLo'
  | 'ink'
  | 'llama'
  | 'llamaLo'
  | 'star'
  | 'band'
  | 'core';

// A llama facing right, head up and grazing: o outline, l wool, d wool in shadow, e eye.
// A condor gliding and with its wings lifted: o feathers, w the white of its wings, k its white ruff.
const LLAMA_UP: Sprite = [
  '..........o.o...',
  '..........olo...',
  '.........ollloo.',
  '.........ollleo.',
  '.........olllllo',
  '..........ollooo',
  '..........ollo..',
  '..........ollo..',
  '..........ollo..',
  '..oooooooollllo.',
  '.olllllllllllllo',
  'olllllllllllllo.',
  'oldllllllllllo..',
  'olddddddddddo...',
  '.odo.od.odo.....',
  '.odo.od.odo.....',
  '.odo.od.odo.....',
  '.oo..oo.oo......',
];
const LLAMA_DOWN: Sprite = [
  '..................',
  '..................',
  '..................',
  '..................',
  '..................',
  '..................',
  '..................',
  '..................',
  '..................',
  '..oooooooooo......',
  '.olllllllllloo....',
  'olllllllllllllo...',
  'oldllllllllllllo..',
  'olddddddddddolllo.',
  '.odo.od.odo..ollo.',
  '.odo.od.odo.oolloo',
  '.odo.od.odo.olello',
  '.oo..oo.oo...ooooo',
];
const CONDOR_A: Sprite = [
  '............o............',
  '...........oko...........',
  'o.ooo.....ookoo.....ooo.o',
  '.ooooooooooooooooooooooo.',
  '..oowwwwwwoooowwwwwwoo...',
  '...o.o.o..oooo..o.o.o....',
  '...........o.o...........',
];
const CONDOR_B: Sprite = [
  'o.......................o',
  '.oo.o.......o.......o.oo.',
  '..oooo.....oko.....oooo..',
  '...oowwwoo.ookoo.oowwwoo.',
  '....o.o.ooooooooooo.o.o..',
  '..........oooooo.........',
  '...........o.o...........',
];

const llamaPalette = paletteBy<K>((c) => ({ o: c.ink, l: c.llama, d: c.llamaLo, e: c.ink }));
const condorPalette = paletteBy<K>((c) => ({ o: c.ink, w: c.cloud, k: c.cloud }));

// ---- layout ----

type Layout = {
  /** The far snowy range's foot. */
  readonly far: number;
  /** The steep peak behind the citadel: its axis, summit row, half-width and foot. */
  readonly peakX: number;
  readonly peakTop: number;
  readonly peakHalf: number;
  readonly foot: number;
  /** The citadel: its ends and the row of its back terrace. */
  readonly x0: number;
  readonly x1: number;
  readonly top: number;
  /** The terraced hill in the foreground: its edge runs from (0, hillTop) down to (hillEnd, h). */
  readonly hillTop: number;
  readonly hillEnd: number;
  /** Llamas: a share of the width and the terrace they graze on. */
  readonly llamas: readonly (readonly [number, number])[];
  readonly condor: readonly [number, number, number];
};

const layoutOf = (f: Frame): Layout =>
  wideOf(f)
    ? {
        far: Math.round(f.h * 0.46),
        peakX: Math.round(f.w * 0.6),
        peakTop: Math.round(f.h * 0.07),
        peakHalf: 38,
        foot: Math.round(f.h * 0.6),
        x0: Math.round(f.w * 0.3),
        x1: Math.round(f.w * 0.88),
        top: Math.round(f.h * 0.56),
        hillTop: Math.round(f.h * 0.6),
        hillEnd: Math.round(f.w * 0.36),
        llamas: [
          [0.07, 0],
          [0.2, 2],
        ],
        condor: [Math.round(f.w * 0.24), Math.round(f.h * 0.2), 46],
      }
    : {
        far: Math.round(f.h * 0.3),
        peakX: Math.round(f.w * 0.56),
        peakTop: Math.round(f.h * 0.1),
        peakHalf: 44,
        foot: Math.round(f.h * 0.47),
        x0: Math.round(f.w * 0.06),
        x1: Math.round(f.w * 0.94),
        top: Math.round(f.h * 0.44),
        hillTop: Math.round(f.h * 0.66),
        hillEnd: Math.round(f.w * 0.62),
        llamas: [
          [0.12, 1],
          [0.3, 4],
        ],
        condor: [Math.round(f.w * 0.42), Math.round(f.h * 0.18), 44],
      };

const ROW = 8;
const ROWS = 3;

// ---- the sky and the far mountains ----

// The Milky Way, at night.
const paintSkyLight = (g: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  if (!isDark(c.sky0)) return;
  const galaxy = { x0: f.w * 0.05, y0: l.far, x1: f.w * 0.95, y1: -l.far * 0.2, half: 26, seed: 17, sprinkle: 0.01 };
  g.drawImage(galaxyLayer(f.w, l.far, galaxy, { glow: c.band, core: c.core, dust: c.band, stars: [c.star, c.core] }), 0, 0);
};

const skyLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('machu-sky', f, c, (g) => {
    const l = layoutOf(f);
    g.drawImage(ditherGradient(f.w, f.h, [c.sky0, c.sky1, c.sky2, c.haze]), 0, 0);
    paintSkyLight(g, f, c, l);
    paintRange(g, f.w, l.far + 6, l.far * 0.36, 23, { rock: c.far, lit: c.farLit, shade: c.cloudLo }, 0.38);
    fillColumns(g, f.w, f.h, c.haze, (x) => l.far + 4 - ridgeNoise(x / 34, 29) * 18);
  });

// Sky life: stars and the odd shooting star at night, puffs of cloud by day.
const skyLife = (ctx: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  if (isDark(c.sky0)) {
    stars(ctx, f.w, l.far, f.t, [c.star, c.core], 30, 33, 0.85);
    shootingStar(ctx, f, c.star, c.core, { every: 5.5, top: 4, span: l.far * 0.3, seed: 34 });
    return;
  }
  driftingClouds(ctx, f, c.cloud, c.cloudLo, { count: 3, top: l.far * 0.3, span: l.far * 0.4, size: 11, speed: 2.5, seed: 35 });
};

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  ctx.drawImage(skyLayer(f, c), 0, 0);
  skyLife(ctx, f, c, l);
  // The sea of cloud filling the valleys behind the peak.
  drawMist(ctx, f, c.cloud, c.cloudLo, { y: l.far - 4, h: 24, speed: 1.5, density: 1, seed: 3 });
};

// ---- the peak ----

// A steep sugarloaf with a pointed summit; a lower shoulder leans on its left.
const loaf = (u: number): number => (u >= 1 ? 0 : (1 - u ** 1.5) ** 0.75);

// The citadel's saddle: flat under the houses, falling steeply away at both ends.
const saddleAt = (l: Layout, x: number): number => {
  const out = Math.max(l.x0 - x, x - l.x1, 0);
  return l.top + ROWS * ROW + out * 1.6;
};

const peakTopAt = (l: Layout, x: number): number => {
  const height = l.foot - l.peakTop;
  const main = loaf(Math.abs(x - l.peakX) / l.peakHalf);
  const shoulder = loaf(Math.abs(x - (l.peakX - l.peakHalf * 1.3)) / (l.peakHalf * 0.8)) * 0.38;
  const peaks = l.foot - height * Math.max(main, shoulder) + (ridgeNoise(x / 4, 21) - 0.5) * 2.5;
  return Math.min(peaks, saddleAt(l, x));
};

// Clumps of forest on the flanks, lit from the left, broken by a few cliffs of bare rock.
const peakPixel = (l: Layout, c: Colors<K>, x: number, y: number): string | null => {
  const top = peakTopAt(l, x);
  if (y < top) return null;
  if (y < top + 1) return c.green0;
  if (y < l.foot - 4 && noise2(x / 3, y / 7, 31) > 0.8) return c.rock;
  const side = Math.max(-1, Math.min(1, (x - l.peakX + (noise2(x / 9, y / 9, 32) - 0.5) * 22) / l.peakHalf));
  const clump = noise2(x / 3.5, y / 3, 33);
  const below = Math.min(0.5, Math.max(0, y - l.top) / 50);
  const tone = side * 0.8 + clump * 0.7 - 0.35 + below + (bayer(x, y) - 0.5) * 0.25;
  if (tone < -0.45) return c.green0;
  return tone < 0.1 ? c.green1 : c.green2;
};

const peak = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  ctx.drawImage(
    pixelLayer(`machu-peak:${colorKey(c)}`, f.w, f.h, (x, y) => peakPixel(l, c, x, y)),
    0,
    0,
  );
  drawMist(ctx, f, c.cloud, c.cloudLo, { y: l.foot - 16, h: 16, speed: 3, density: 0.6, seed: 5 });
};

// ---- the citadel, the valley and the terraces ----

type Building = { readonly x: number; readonly base: number; readonly w: number; readonly h: number; readonly roof: boolean };

const rowEnds = (l: Layout, row: number): readonly [number, number] => [l.x0 + row * 4, l.x1 - row * 6];

const buildingsOf = (l: Layout): readonly Building[] => {
  const out: Building[] = [];
  for (let row = 0; row < ROWS; row++) {
    const [a, b] = rowEnds(l, row);
    const base = l.top + row * ROW + 6;
    for (let x = a + 2, i = 0; x < b; i++) {
      const w = 8 + Math.floor(rand(i, row + 50) * 8);
      const plaza = row > 0 && x + w > a + (b - a) * 0.4 && x < a + (b - a) * 0.66;
      if (!plaza && x + w < b - 1) out.push({ x, base, w, h: 5 + Math.floor(rand(i, row + 51) * 2), roof: rand(i, row + 52) < 0.2 });
      x += w + 1 + Math.floor(rand(i, row + 53) * 4);
    }
  }
  return out;
};

const paintThatch = (g: Ctx, c: Colors<K>, b: Building, top: number): void => {
  for (let k = 0; k < 4; k++) fillRect(g, k % 2 === 0 ? c.thatch : c.stoneLo, b.x - 1 + k, top - 1 - k, b.w + 2 - k * 2, 1);
};

// A roofless house seen from above: the tops of its walls around a floor in shadow, a pointed gable at each end;
// a few have been thatched again.
const paintBuilding = (g: Ctx, c: Colors<K>, b: Building): void => {
  const top = b.base - b.h;
  fillRect(g, c.stone, b.x, top, b.w, b.h);
  fillRect(g, c.stoneLo, b.x, b.base - 2, b.w, 2);
  fillRect(g, c.ink, b.x, b.base, b.w, 1);
  if (b.roof) {
    paintThatch(g, c, b, top);
    return;
  }
  fillRect(g, c.green2, b.x + 1, top + 1, b.w - 2, b.h - 4);
  for (const gx of [b.x, b.x + b.w - 3]) {
    fillRect(g, c.stone, gx, top - 1, 3, 1);
    fillRect(g, c.stone, gx + 1, top - 2, 1, 1);
  }
};

// The citadel's terraces, back to front: a stone wall, a strip of lawn, the houses (and the open plaza), then
// narrow farming terraces stepping down its front.
const paintCitadel = (g: Ctx, c: Colors<K>, l: Layout): void => {
  for (let row = 0; row < ROWS; row++) {
    const [a, b] = rowEnds(l, row);
    const y = l.top + row * ROW;
    fillRect(g, row === 1 ? c.green0 : c.green1, a, y, b - a, ROW);
    fillRect(g, c.green0, a, y, b - a, 1);
    fillRect(g, c.stoneLo, a, y + ROW - 1, b - a, 1);
  }
  const [a, b] = rowEnds(l, ROWS);
  for (let k = 0; k < 4; k++) {
    const y = l.top + ROWS * ROW + k * 4;
    fillRect(g, c.green1, a + k * 3, y, b - a - k * 5, 3);
    fillRect(g, c.stoneLo, a + k * 3, y + 3, b - a - k * 5, 1);
  }
  for (const bld of buildingsOf(l)) paintBuilding(g, c, bld);
};

// The terraced hill in the foreground: broad grassy steps held up by stone walls, curving with the slope.
const TERRACE = 10;

const hillEdge = (f: Frame, l: Layout, y: number): number => ((y - l.hillTop) / (f.h - l.hillTop)) * l.hillEnd + 30;

const paintHill = (g: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  for (let k = 0, y = l.hillTop; y < f.h; k++, y += TERRACE) {
    const reach = Math.round(hillEdge(f, l, y + TERRACE) + Math.sin(k * 1.7) * 3);
    fillRect(g, c.green1, 0, y, reach, TERRACE);
    fillRect(g, c.green0, 0, y, reach - 3, 3);
    const wall = y + TERRACE - 4;
    for (let x = 0; x < reach; x++) fillRect(g, (x + k * 3) % 6 === 0 ? c.stoneLo : c.stone, x, wall, 1, 3);
    fillRect(g, c.ink, 0, wall + 3, reach, 1);
  }
};

const landLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('machu-land', f, c, (g) => {
    const l = layoutOf(f);
    paintCitadel(g, c, l);
    paintHill(g, f, c, l);
  });

// ---- life ----

const LLAMAS_RIGHT = [LLAMA_UP, LLAMA_DOWN] as const;
const LLAMAS_LEFT = [flipped(LLAMA_UP), flipped(LLAMA_DOWN)] as const;

const llama = (ctx: Ctx, f: Frame, c: Colors<K>, l: Layout, at: readonly [number, number], i: number): void => {
  const ground = l.hillTop + at[1] * TERRACE + TERRACE - 4;
  const x = Math.round(Math.min(hillEdge(f, l, ground) - 26, f.w * at[0]));
  const grazing = (Math.floor(f.beat / 2) + i) % 3 !== 0 ? 1 : 0;
  const sprite = (i % 2 === 0 ? LLAMAS_RIGHT : LLAMAS_LEFT)[grazing] as Sprite;
  drawSprite(ctx, sprite, llamaPalette(c), x, ground - sprite.length);
};

const CONDOR_LEFT = [flipped(CONDOR_A), flipped(CONDOR_B)] as const;

// The condor circles slowly on a wide, flattened loop, lifting its wings once every two bars.
const condor = (ctx: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  const [cx, cy, r] = l.condor;
  const a = f.t * 0.18;
  const x = cx + Math.cos(a) * r;
  const y = cy + Math.sin(a) * r * 0.22;
  const lift = (f.beat % 8) / 8 < 0.12 ? 1 : 0;
  const frames = Math.sin(a) > 0 ? [CONDOR_A, CONDOR_B] : CONDOR_LEFT;
  const sprite = frames[lift] as Sprite;
  drawSprite(ctx, sprite, condorPalette(c), Math.round(x - (sprite[0]?.length ?? 0) / 2), Math.round(y));
};

const life = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const valley = l.top + ROWS * ROW + 20;
  ctx.drawImage(landLayer(f, c), 0, 0);
  // Cloud welling up out of the valley and drifting through the ruins.
  drawMist(ctx, f, c.cloud, c.cloudLo, { y: valley, h: 30, speed: -2.5, density: 1, seed: 7 });
  drawMist(ctx, f, c.cloud, c.cloudLo, { y: l.top - 7, h: 12, speed: 4, density: 0.5, seed: 6 });
  drawMist(ctx, f, c.cloud, c.cloudLo, { y: f.h - 34, h: 34, speed: 2, density: 1, seed: 8 });
  if (!wideOf(f)) drawMist(ctx, f, c.cloud, c.cloudLo, { y: f.h * 0.72, h: 28, speed: -1.5, density: 0.9, seed: 9 });
  l.llamas.forEach((at, i) => {
    llama(ctx, f, c, l, at, i);
  });
  if (!isDark(c.sky0)) condor(ctx, f, c, l);
};

export const machuPicchu = defineScene<K>({
  id: 'machu-picchu',
  title: 'Cloud Citadel',
  mood: { valence: 0.2, energy: 0.2 },
  styles: ['grand-field', 'pixel-quest', 'credits-roll', 'town-waltz', 'celtic-isle'],
  variants: [
    {
      // Morning: the clouds still sitting in the valleys, the peak bright green.
      mood: { valence: 0.2, energy: 0.2 },
      colors: {
        sky0: '#5a96d4',
        sky1: '#a6cde8',
        sky2: '#eef0dc',
        far: '#7d9cc0',
        farLit: '#f4f8ff',
        haze: '#6a92ac',
        green0: '#a2d474',
        green1: '#5c9e4e',
        green2: '#2e6644',
        rock: '#74847a',
        stone: '#cfc6b4',
        stoneLo: '#8a8476',
        thatch: '#c49a5a',
        cloud: '#ffffff',
        cloudLo: '#cfdeec',
        ink: '#1c2826',
        llama: '#f6eedc',
        llamaLo: '#b89878',
        star: '#ffffff',
        band: '#a6cde8',
        core: '#ffffff',
      },
    },
    {
      // Late afternoon: gold on the stone, the clouds blushing.
      mood: { valence: 0.55, energy: -0.35 },
      colors: {
        sky0: '#6878b8',
        sky1: '#f0a284',
        sky2: '#ffdc94',
        far: '#9a7ca4',
        farLit: '#ffd4a8',
        haze: '#8a6c8e',
        green0: '#cac466',
        green1: '#6c9a4a',
        green2: '#3a5a40',
        rock: '#8a7a70',
        stone: '#f2caa0',
        stoneLo: '#a27c6a',
        thatch: '#dc9a4c',
        cloud: '#ffead0',
        cloudLo: '#f0aa94',
        ink: '#2a1e26',
        llama: '#fff2dc',
        llamaLo: '#c89272',
        star: '#ffffff',
        band: '#f0a284',
        core: '#ffffff',
      },
    },
    {
      // Night: the Milky Way over the ruins, moonlit cloud below.
      mood: { valence: -0.45, energy: -0.5 },
      colors: {
        sky0: '#060a1e',
        sky1: '#122042',
        sky2: '#2c3c60',
        far: '#28345a',
        farLit: '#a6b6d8',
        haze: '#1c2a48',
        green0: '#3e5e54',
        green1: '#26423e',
        green2: '#152a30',
        rock: '#3a4650',
        stone: '#7c84a0',
        stoneLo: '#464c66',
        thatch: '#5c5248',
        cloud: '#8c9cbc',
        cloudLo: '#4a5a7c',
        ink: '#080a12',
        llama: '#c8ccdc',
        llamaLo: '#6a6c84',
        star: '#f0f4ff',
        band: '#2a3a62',
        core: '#8e9cc4',
      },
    },
  ],
  layers: [sky, peak, life],
});
