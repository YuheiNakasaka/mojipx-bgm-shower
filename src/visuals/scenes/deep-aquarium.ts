// Underwater: light shafts swaying down from the surface, kelp waving over a sandy floor, schools of fish
// gliding past with tails flicking on the beat, jellyfish pulsing upward on the kick, and rising bubbles.
import { type Ctx, drawSprite, fillRect, flipped, type Sprite } from 'mojipx';
import { bayer, ditherGradient, fillColumns, frac, hexToRgb, noise1, pixelLine, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { colorKey, ditherStyle, memoLayer, memoPixels, paletteBy, setPixel, spanDisc, wrap } from './batch-1-helpers.ts';

type K =
  | 'water0'
  | 'water1'
  | 'water2'
  | 'shaft'
  | 'sand'
  | 'sandDark'
  | 'rock'
  | 'kelp'
  | 'kelpDark'
  | 'fishA'
  | 'fishAShade'
  | 'fishB'
  | 'fishBShade'
  | 'coral'
  | 'coralShade'
  | 'bubble'
  | 'speck';

const unitOf = (f: Frame): number => Math.min(f.w, f.h);
const floorOf = (f: Frame): number => Math.round(f.h - 0.12 * unitOf(f) - 0.05 * (f.h - unitOf(f)));

const water = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(ditherGradient(f.w, f.h, [c.water0, c.water1, c.water2, c.water2]), 0, 0);
};

// A slanted shaft of light, densest under the surface and fading with depth and toward its edges.
const shaftImage = (w: number, h: number, slant: number, color: string, peak: number): HTMLCanvasElement =>
  memoPixels(`da-shaft:${w}:${h}:${slant}:${color}:${peak}`, w + Math.ceil(slant * h), h, (img) => {
    const rgb = hexToRgb(color);
    for (let y = 0; y < h; y++) {
      const fade = peak * (1 - y / h) ** 1.3;
      const width = w * (1 + (0.6 * y) / h);
      for (let x = 0; x < width; x++) {
        const edge = 1 - Math.abs((x / width) * 2 - 1);
        const px = Math.round(x + slant * y - (width - w) / 2);
        if (px >= 0 && px < img.width && fade * Math.min(1, edge * 2.5) > bayer(px, y)) setPixel(img, px, y, rgb);
      }
    }
  });

const shafts = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const u = unitOf(f);
  const count = Math.max(3, Math.round(f.w / 70));
  const bright = f.kick > 0.55 ? 0.42 : 0.34;
  for (let i = 0; i < count; i++) {
    const w = Math.round(u * (0.08 + 0.08 * rand(i, 200)));
    const img = shaftImage(w, Math.round(f.h * 0.8), 0.35, c.shaft, bright);
    const x = ((i + 0.3 * rand(i, 201)) / count) * (f.w + f.h * 0.2) - f.h * 0.25 + Math.sin(f.t * 0.25 + i * 1.7) * 10;
    ctx.drawImage(img, Math.round(x), 0);
  }
};

const paintSeabed = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const bed = floorOf(f);
  const u = unitOf(f);
  fillColumns(g, f.w, bed + 2, c.rock, (x) => bed - u * (0.02 + 0.2 * noise1(x / 26, 210) ** 2.2));
  g.drawImage(ditherGradient(f.w, f.h - bed, [c.sand, c.sand, c.sandDark]), 0, bed);
  fillColumns(g, f.w, bed + 1, c.sand, (x) => bed - 1 - 2 * noise1(x / 9, 211));
  for (let i = 0; i < f.w / 5; i++) {
    const x = Math.floor(rand(i, 212) * f.w);
    const y = bed + 2 + Math.floor(rand(i, 213) * (f.h - bed - 2));
    fillRect(g, i % 3 === 0 ? c.rock : c.sandDark, x, y, 1 + (i % 2), 1);
  }
};

// A branching coral: limbs forking upward from the seabed.
const coralBranch = (g: Ctx, x: number, y: number, len: number, angle: number, depth: number, c: Colors<K>, seed: number): void => {
  const x1 = x + Math.cos(angle) * len;
  const y1 = y - Math.sin(angle) * len;
  pixelLine(g, x, y, x1, y1, depth % 2 === 0 ? c.coral : c.coralShade);
  pixelLine(g, x + 1, y, x1 + 1, y1, c.coralShade);
  if (depth <= 0) return;
  coralBranch(g, x1, y1, len * 0.7, angle + 0.45 + rand(depth, seed) * 0.2, depth - 1, c, seed + 1);
  coralBranch(g, x1, y1, len * 0.7, angle - 0.45 - rand(depth, seed + 2) * 0.2, depth - 1, c, seed + 3);
};

const paintCorals = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const bed = floorOf(f);
  const u = unitOf(f);
  const count = Math.max(3, Math.round(f.w / 60));
  for (let i = 0; i < count; i++) {
    const x = ((i + 0.5 + (rand(i, 214) - 0.5) * 0.6) / count) * f.w;
    if (i % 2 === 0) coralBranch(g, x, bed + 3, u * (0.05 + 0.03 * rand(i, 215)), Math.PI / 2, 3, c, i * 9);
    else {
      g.fillStyle = c.coralShade;
      spanDisc(g, x, bed + 2, Math.round(u * 0.035));
      g.fillStyle = c.coral;
      spanDisc(g, x - 1, bed + 1, Math.round(u * 0.025));
    }
  }
};

const seabed = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const layer = memoLayer(`da-bed:${f.w}x${f.h}:${colorKey(c)}`, f.w, f.h, (g) => {
    paintSeabed(g, f, c);
    paintCorals(g, f, c);
  });
  ctx.drawImage(layer, 0, 0);
};

// A strand of kelp: stacked segments bending further the higher they are, with blades on alternate sides.
const strand = (ctx: Ctx, f: Frame, c: Colors<K>, i: number, count: number): void => {
  const bed = floorOf(f);
  const group = Math.floor(i / 3);
  const x0 = ((group + 0.5) / Math.ceil(count / 3)) * f.w + ((i % 3) - 1) * 7 + (rand(group, 220) - 0.5) * 20;
  const height = (0.28 + 0.37 * rand(i, 221)) * Math.min(f.h, unitOf(f) * 1.8);
  const segs = Math.round(height / 3);
  const amp = 3 + 2 * f.energy;
  const beatSway = Math.sin(f.beat * Math.PI * 0.5 + i) * 1.5;
  ctx.fillStyle = i % 3 === 1 ? c.kelp : c.kelpDark;
  for (let j = 0; j < segs; j++) {
    const k = j / segs;
    const x = Math.round(x0 + Math.sin(f.t * 0.9 + j * 0.16 + i * 2.3) * amp * k ** 1.2 + beatSway * k);
    const y = bed + 2 - j * 3;
    ctx.fillRect(x, y - 3, 2, 3);
    if (j % 3 !== 1 || j < 2) continue;
    const side = (j + i) % 2 === 0 ? -1 : 1;
    ctx.fillRect(side < 0 ? x - 3 : x + 2, y - 2, 3, 2);
    ctx.fillRect(side < 0 ? x - 5 : x + 5, y - 4, 2, 2);
  }
};

const kelp = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const count = Math.max(6, Math.round(f.w / 16));
  for (let i = 0; i < count; i++) strand(ctx, f, c, i, count);
};

const FISH_A: readonly Sprite[] = [
  ['....aaa....', 'b.aaaaaaa..', 'bbaaaaaakaa', 'b.ssssssss.', '....sss....'],
  ['....aaa....', '..aaaaaaa..', 'bbbaaaaakaa', '..ssssssss.', '....sss....'],
];
const FISH_B: readonly Sprite[] = [
  [
    '.......aaa......',
    '.....aaaaaaa....',
    'b..aaaaaaaaaaa..',
    'bbaaaaaaaaaaaka.',
    'bbaaaaaaaaaaaaaa',
    'b..ssssssssssss.',
    '.....ssssssss...',
    '.......ss.......',
  ],
  [
    '.......aaa......',
    '.....aaaaaaa....',
    '...aaaaaaaaaaa..',
    'bbbaaaaaaaaaaka.',
    'bbbaaaaaaaaaaaaa',
    '...ssssssssssss.',
    '.....ssssssss...',
    '.......ss.......',
  ],
];
const FISH_A_LEFT = FISH_A.map(flipped);
const FISH_B_LEFT = FISH_B.map(flipped);

const paletteA = paletteBy<K>((c) => ({ a: c.fishA, s: c.fishAShade, b: c.fishAShade, k: c.water2 }));
const paletteB = paletteBy<K>((c) => ({ a: c.fishB, s: c.fishBShade, b: c.fishBShade, k: c.water2 }));

type School = { readonly seed: number; readonly size: number; readonly big: boolean };

// A school crossing the screen: each fish keeps its place in the formation, jostles a little and flicks its tail on the beat.
const school = (ctx: Ctx, f: Frame, c: Colors<K>, s: School): void => {
  const right = s.seed % 2 === 0;
  const span = f.w + 140;
  const speed = (s.big ? 5 : 9) + 5 * rand(s.seed, 230);
  const cx = wrap(rand(s.seed, 231) * span + f.t * speed, span) - 70;
  const cy = f.h * (0.18 + 0.5 * rand(s.seed, 232)) + Math.sin(f.t * 0.4 + s.seed) * 8;
  const frames = s.big ? (right ? FISH_B : FISH_B_LEFT) : right ? FISH_A : FISH_A_LEFT;
  const palette = s.big ? paletteB(c) : paletteA(c);
  for (let k = 0; k < s.size; k++) {
    const dx = (rand(k, s.seed + 233) - 0.5) * (s.big ? 90 : 64) + Math.sin(f.t * 1.3 + k) * 1.5;
    const dy = (rand(k, s.seed + 234) - 0.5) * (s.big ? 40 : 26) + Math.cos(f.t * 1.1 + k * 2) * 1.2;
    const sprite = frames[(Math.floor(f.beat * 2) + k) % 2] as Sprite;
    drawSprite(ctx, sprite, palette, Math.round(right ? cx + dx : f.w - cx + dx), Math.round(cy + dy));
  }
};

const fish = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  school(ctx, f, c, { seed: 1, size: 2, big: true });
  school(ctx, f, c, { seed: 2, size: 14, big: false });
  school(ctx, f, c, { seed: 5, size: 10 + Math.round(f.energy * 6), big: false });
};

// A jellyfish: a translucent bell that squeezes on the kick and pushes the jelly upward each beat.
const jelly = (ctx: Ctx, f: Frame, c: Colors<K>, i: number): void => {
  const span = f.h + 50;
  const push = Math.floor(f.beat) * 1.2 + (1 - (1 - frac(f.beat)) ** 3) * 1.2;
  const y = Math.round(wrap(rand(i, 240) * span - f.t * 1.5 - push, span) - 25);
  const x = Math.round(f.w * (0.2 + 0.6 * rand(i, 241)) + Math.sin(f.t * 0.3 + i) * 12);
  const u = unitOf(f);
  const rx = Math.round(u * 0.045 - f.kick * 1.5);
  const ry = Math.round(u * 0.032 + f.kick);
  const veil = ditherStyle(ctx, c.bubble, 0.5);
  for (let dy = -ry; dy <= 0; dy++) {
    const half = Math.round(rx * Math.sqrt(1 - (dy / (ry + 0.5)) ** 2));
    ctx.fillStyle = dy === -ry || !veil ? c.bubble : veil;
    ctx.fillRect(x - half, y + dy, half * 2 + 1, 1);
  }
  ctx.fillStyle = c.bubble;
  const length = Math.round(u * 0.1);
  for (let k = 0; k < 5; k++) {
    const tx = x - rx + 2 + Math.round((k * (rx * 2 - 4)) / 4);
    for (let j = 1; j < length; j += 2) ctx.fillRect(tx + Math.round(Math.sin(f.t * 3 + j * 0.3 + k) * (j / 8)), y + j, 1, 1);
  }
};

const BUBBLES: readonly Sprite[] = [['o'], ['.o.', 'o.o', '.o.'], ['.oo.', 'o..o', 'o..o', '.oo.']];
const bubblePalette = paletteBy<K>((c) => ({ o: c.bubble }));

const bubbles = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const span = f.h + 10;
  const count = Math.round(16 + f.w * 0.06);
  for (let i = 0; i < count; i++) {
    const y = wrap(rand(i, 250) * span - f.t * (12 + 14 * rand(i, 251)), span) - 5;
    const x = rand(i, 252) * f.w + Math.sin(f.t * 2.2 + i) * 1.5;
    drawSprite(ctx, BUBBLES[i % 3] as Sprite, bubblePalette(c), Math.round(x), Math.round(y));
  }
};

const life = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  // Specks of drifting matter.
  ctx.fillStyle = c.speck;
  for (let i = 0; i < (f.w * f.h) / 1200; i++) {
    const x = wrap(rand(i, 260) * f.w + Math.sin(f.t * 0.3 + i) * 4, f.w);
    const y = wrap(rand(i, 261) * f.h + f.t * 2, f.h);
    ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }
  fish(ctx, f, c);
  jelly(ctx, f, c, 0);
  jelly(ctx, f, c, 1);
};

export const deepAquarium = defineScene<K>({
  id: 'deep-aquarium',
  title: 'Deep Aquarium',
  mood: { valence: 0, energy: -0.6 },
  styles: ['starlit-dream', 'deep-dungeon', 'lofi-loop'],
  variants: [
    {
      mood: { valence: 0.25, energy: -0.5 },
      colors: {
        water0: '#5ccfd8',
        water1: '#248eae',
        water2: '#0c4876',
        shaft: '#bcf6ee',
        sand: '#e4d09a',
        sandDark: '#b0986c',
        rock: '#2a586e',
        kelp: '#4c9e58',
        kelpDark: '#2a6c4a',
        fishA: '#ffa242',
        fishAShade: '#cc5e2a',
        fishB: '#eaf4ff',
        fishBShade: '#86aed0',
        coral: '#ff7c8c',
        coralShade: '#c2466a',
        bubble: '#e8ffff',
        speck: '#a4e6ea',
      },
    },
    {
      mood: { valence: -0.3, energy: -0.7 },
      colors: {
        water0: '#1e3c7a',
        water1: '#101e4a',
        water2: '#060a22',
        shaft: '#5c7cd2',
        sand: '#3c3c60',
        sandDark: '#222240',
        rock: '#141634',
        kelp: '#2a5c6c',
        kelpDark: '#183a4c',
        fishA: '#5ef2e2',
        fishAShade: '#2a98b0',
        fishB: '#ff8cd8',
        fishBShade: '#a04ca2',
        coral: '#9a5ad2',
        coralShade: '#5a3494',
        bubble: '#aad2ff',
        speck: '#6a8ad2',
      },
    },
  ],
  layers: [water, shafts, seabed, kelp, life, bubbles],
});
