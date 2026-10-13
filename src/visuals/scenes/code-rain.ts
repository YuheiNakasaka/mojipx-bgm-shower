// Streams of tiny glyphs pour down the screen in two depths, stepping a cell at a time with the beat;
// each stream's head burns brightest, and kicks tear a few rows sideways in a flash of accent color.
import { type Ctx, drawSprite, type Palette, type Sprite } from 'mojipx';
import { ditherGradient, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { paletteOf } from './batch-2-helpers.ts';

type K = 'bg0' | 'bg1' | 'farDim' | 'far' | 'dim' | 'mid' | 'bright' | 'head' | 'glitch';
type Tone = Exclude<K, 'bg0' | 'bg1'>;

// Sixteen 3×5 glyphs of an invented script.
const GLYPHS: readonly Sprite[] = [
  ['###', '#.#', '#.#', '#.#', '###'],
  ['.#.', '##.', '.#.', '.#.', '###'],
  ['##.', '..#', '.#.', '#..', '###'],
  ['#.#', '#.#', '###', '..#', '..#'],
  ['###', '#..', '###', '..#', '##.'],
  ['#..', '###', '#.#', '###', '..#'],
  ['###', '..#', '.##', '..#', '###'],
  ['#.#', '.#.', '#.#', '.#.', '#.#'],
  ['##.', '#.#', '##.', '#.#', '##.'],
  ['.#.', '###', '.#.', '#.#', '#.#'],
  ['###', '.#.', '.#.', '.#.', '.##'],
  ['#..', '#..', '###', '..#', '..#'],
  ['..#', '.#.', '###', '.#.', '#..'],
  ['###', '#.#', '###', '#..', '#..'],
  ['.##', '#..', '###', '#.#', '##.'],
  ['#.#', '###', '...', '###', '#.#'],
];

const CELL_W = 4;
const CELL_H = 6;

type Depth = {
  readonly seed: number;
  /** Every n-th column carries a stream at this depth. */
  readonly every: number;
  readonly dx: number;
  readonly minLen: number;
  readonly varLen: number;
  /** Cells per beat. */
  readonly speeds: readonly number[];
  readonly near: boolean;
};

const FAR: Depth = { seed: 300, every: 2, dx: 2, minLen: 5, varLen: 9, speeds: [1, 1.5, 2], near: false };
const NEAR: Depth = { seed: 100, every: 1, dx: 0, minLen: 6, varLen: 14, speeds: [2, 3, 4], near: true };

type Glitch = { readonly from: number; readonly to: number; readonly dx: number; readonly seed: number };

const tone = (c: Colors<K>, key: Tone): Palette => paletteOf(c, key, (k) => ({ '#': k[key] }));

const toneOf = (d: Depth, k: number, len: number): Tone => {
  if (!d.near) return k < len * 0.4 ? 'far' : 'farDim';
  if (k === 0) return 'head';
  if (k < 3) return 'bright';
  return k < len * 0.55 ? 'mid' : 'dim';
};

// Kicks pick a couple of bands of rows that jump sideways for a moment.
const glitchesOf = (f: Frame, rows: number): readonly Glitch[] => {
  const b = Math.floor(f.beat);
  if (f.kick < 0.6 || (b % 4 !== 0 && rand(b, 69) > 0.25 + f.energy * 0.4)) return [];
  return [0, 1].map((k) => {
    const from = Math.floor(rand(b, 70 + k) * rows);
    const dx = (rand(b, 80 + k) < 0.5 ? -1 : 1) * (1 + Math.floor(rand(b, 90 + k) * 2));
    return { from, to: from + 1 + Math.floor(rand(b, 60 + k) * 2), dx, seed: b * 2 + k };
  });
};

// Only some columns of a band jump, so the tear looks ragged rather than ruled.
const shiftOf = (glitches: readonly Glitch[], row: number, col: number): number =>
  glitches.find((g) => row >= g.from && row < g.to && rand(col, g.seed) < 0.45)?.dx ?? 0;

const column = (ctx: Ctx, f: Frame, c: Colors<K>, d: Depth, col: number, glitches: readonly Glitch[]): void => {
  const rows = Math.ceil(f.h / CELL_H);
  // Streams grow with the screen's height so tall screens are as full as wide ones.
  const len = Math.round((d.minLen + rand(col, d.seed + 1) * d.varLen) * Math.sqrt(rows / 30));
  const cycle = rows + len + Math.floor(rand(col, d.seed + 2) * rows * 0.6);
  const speed = (d.speeds[Math.floor(rand(col, d.seed) * d.speeds.length)] as number) * (0.75 + f.energy * 0.5);
  const head = Math.floor(f.beat * speed + rand(col, d.seed + 3) * cycle) % cycle;
  for (let k = 0; k < len; k++) {
    const row = head - k;
    if (row < 0 || row >= rows) continue;
    const shift = d.near ? shiftOf(glitches, row, col) : 0;
    const flicker = Math.floor(f.t * (2 + rand(col, row) * 4) + rand(row, col) * 9);
    const glyph = GLYPHS[Math.floor(rand(col * 977 + row, k === 0 ? head : flicker) * GLYPHS.length)] as Sprite;
    const key = shift === 0 ? toneOf(d, k, len) : 'glitch';
    drawSprite(ctx, glyph, tone(c, key), col * CELL_W + d.dx + shift, row * CELL_H);
  }
};

const depth = (ctx: Ctx, f: Frame, c: Colors<K>, d: Depth): void => {
  const cols = Math.ceil(f.w / CELL_W);
  const glitches = glitchesOf(f, Math.ceil(f.h / CELL_H));
  for (let col = 0; col < cols; col += d.every) if (rand(col, d.seed + 4) < 0.78) column(ctx, f, c, d, col, glitches);
};

const background = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(ditherGradient(f.w, f.h, [c.bg0, c.bg1, c.bg0]), 0, 0);
};

const farRain = (ctx: Ctx, f: Frame, c: Colors<K>): void => depth(ctx, f, c, FAR);
const nearRain = (ctx: Ctx, f: Frame, c: Colors<K>): void => depth(ctx, f, c, NEAR);

export const codeRain = defineScene<K>({
  id: 'code-rain',
  title: 'Code Rain',
  mood: { valence: -0.5, energy: 0.4 },
  styles: ['star-fighter', 'boss-rush', 'neon-rush', 'technopop', 'jungle-run'],
  variants: [
    {
      mood: { valence: -0.5, energy: 0.4 },
      colors: {
        bg0: '#02060c',
        bg1: '#071420',
        farDim: '#08222e',
        far: '#0e3a4a',
        dim: '#0f5870',
        mid: '#1fa4c2',
        bright: '#6ae4ff',
        head: '#e8fdff',
        glitch: '#ff4f8f',
      },
    },
    {
      mood: { valence: -0.2, energy: 0.8 },
      colors: {
        bg0: '#0a0402',
        bg1: '#180b04',
        farDim: '#2a1406',
        far: '#4a2408',
        dim: '#6c3308',
        mid: '#c66c12',
        bright: '#ffb23c',
        head: '#fff2cc',
        glitch: '#3fe2ff',
      },
    },
    {
      mood: { valence: -0.8, energy: 0.6 },
      colors: {
        bg0: '#06020c',
        bg1: '#110722',
        farDim: '#1b0c32',
        far: '#2e1452',
        dim: '#4b1f82',
        mid: '#8b4ce2',
        bright: '#c69cff',
        head: '#f7ecff',
        glitch: '#5cffc8',
      },
    },
  ],
  layers: [background, farRain, nearRain],
});
