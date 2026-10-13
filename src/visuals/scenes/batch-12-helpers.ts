// Shared pieces for the cozy fictional-game screens of batch 12: cached layers, mixed-case text for dialogue boxes,
// color sets shifted toward the light of another hour, and sprites generated from a function per pixel.
import { type Ctx, drawSprite, type Palette, type Sprite } from 'mojipx';
import { memoLayer as kitMemoLayer } from '../kit.ts';
import type { Colors } from '../scene.ts';
import { drawText, textWidth } from './batch-4-helpers.ts';
import { mixHex } from './batch-5-helpers.ts';

/** A static layer painted once and cached by key (the key must name the size and every color used). */
export const memoLayer = (key: string, w: number, h: number, paint: (ctx: Ctx) => void): HTMLCanvasElement =>
  kitMemoLayer(`b12:${key}:${w}x${h}`, w, h, paint);

// ---- mixed-case text: lowercase glyphs four pixels wide with descenders; everything else falls back to the 5×7 caps ----

const LOWER_ROWS: Readonly<Record<string, string>> = {
  a: '....|....|.##.|...#|.###|#..#|.###|....|....',
  b: '#...|#...|###.|#..#|#..#|#..#|###.|....|....',
  c: '....|....|.##.|#...|#...|#...|.##.|....|....',
  d: '...#|...#|.###|#..#|#..#|#..#|.###|....|....',
  e: '....|....|.##.|#..#|####|#...|.##.|....|....',
  f: '.##|#..|###|#..|#..|#..|#..|...|...',
  g: '....|....|.###|#..#|#..#|#..#|.###|...#|.##.',
  h: '#...|#...|###.|#..#|#..#|#..#|#..#|....|....',
  i: '#|.|#|#|#|#|#|.|.',
  j: '..#|...|..#|..#|..#|..#|..#|#.#|.#.',
  k: '#...|#...|#..#|#.#.|##..|#.#.|#..#|....|....',
  l: '#.|#.|#.|#.|#.|#.|.#|..|..',
  m: '.....|.....|##.#.|#.#.#|#.#.#|#.#.#|#.#.#|.....|.....',
  n: '....|....|###.|#..#|#..#|#..#|#..#|....|....',
  o: '....|....|.##.|#..#|#..#|#..#|.##.|....|....',
  p: '....|....|###.|#..#|#..#|#..#|###.|#...|#...',
  q: '....|....|.###|#..#|#..#|#..#|.###|...#|...#',
  r: '...|...|#.#|##.|#..|#..|#..|...|...',
  s: '....|....|.###|#...|.##.|...#|###.|....|....',
  t: '.#.|.#.|###|.#.|.#.|.#.|..#|...|...',
  u: '....|....|#..#|#..#|#..#|#..#|.###|....|....',
  v: '.....|.....|#...#|#...#|.#.#.|.#.#.|..#..|.....|.....',
  w: '.....|.....|#...#|#...#|#.#.#|#.#.#|.#.#.|.....|.....',
  x: '....|....|#..#|#..#|.##.|#..#|#..#|....|....',
  y: '....|....|#..#|#..#|#..#|#..#|.###|...#|.##.',
  z: '....|....|####|..#.|.#..|#...|####|....|....',
  ',': '..|..|..|..|..|..|.#|.#|#.',
  "'": '#|#|.|.|.|.|.|.|.',
  '♥': '.....|.....|##.##|#####|#####|.###.|..#..|.....|.....',
};

const LOWER: ReadonlyMap<string, Sprite> = new Map(Object.entries(LOWER_ROWS).map(([ch, rows]) => [ch, rows.split('|')]));

const inks = new Map<string, Palette>();
const inkOf = (color: string): Palette => {
  const hit = inks.get(color);
  if (hit) return hit;
  const made: Palette = { '#': color };
  inks.set(color, made);
  return made;
};

const advanceOf = (ch: string): number => {
  const glyph = LOWER.get(ch);
  return glyph ? (glyph[0] ?? '').length + 1 : textWidth(ch) + 1;
};

/** Width in pixels of a line of mixed-case text. */
export const wordsWidth = (text: string): number => [...text].reduce((w, ch) => w + advanceOf(ch), 0) - 1;

/** Draws mixed-case text with its top-left at (x, y); descenders hang two pixels below the capitals. */
export const drawWords = (ctx: Ctx, text: string, x: number, y: number, color: string): void => {
  let cx = Math.round(x);
  for (const ch of text) {
    const glyph = LOWER.get(ch);
    if (glyph) drawSprite(ctx, glyph, inkOf(color), cx, Math.round(y));
    else drawText(ctx, ch, cx, Math.round(y), color);
    cx += advanceOf(ch);
  }
};

/** Mixed-case text with a one-pixel outline all round. */
export const drawWordsOutlined = (ctx: Ctx, text: string, x: number, y: number, color: string, outline: string): void => {
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx !== 0 || dy !== 0) drawWords(ctx, text, x + dx, y + dy, outline);
  drawWords(ctx, text, x, y, color);
};

// ---- colors at another hour ----

const shifted = new WeakMap<object, Map<string, Colors<string>>>();

/** A color set moved a share `k` of the way toward `to` (hex in, hex out), cached so layers keyed by it stay cached. */
export const shiftColors = <K extends string>(c: Colors<K>, to: string, k: number): Colors<K> => {
  let byShift = shifted.get(c);
  if (!byShift) {
    byShift = new Map();
    shifted.set(c, byShift);
  }
  const key = `${to}:${k}`;
  const hit = byShift.get(key);
  if (hit) return hit as Colors<K>;
  const made = Object.fromEntries(Object.entries(c).map(([name, hex]) => [name, mixHex(hex as string, to, k)])) as Colors<K>;
  byShift.set(key, made);
  return made;
};

// ---- sprites from a function ----

/** A sprite built from a function naming the palette letter of each pixel ('.' for clear). */
export const spriteOf = (w: number, h: number, pick: (x: number, y: number) => string): Sprite =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

const NEIGHBOURS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

/** The sprite with a one-pixel outline of `ink` round every opaque shape (the clear pixels touching it). */
export const outlined = (sprite: Sprite, ink: string): Sprite => {
  const at = (x: number, y: number): string => sprite[y]?.[x] ?? '.';
  return sprite.map((row, y) =>
    [...row].map((ch, x) => (ch === '.' && NEIGHBOURS.some(([dx, dy]) => at(x + dx, y + dy) !== '.') ? ink : ch)).join(''),
  );
};

/** Whether (x, y) lies inside the ellipse centred on (cx, cy) with radii rx and ry. */
export const inEllipse = (x: number, y: number, cx: number, cy: number, rx: number, ry: number): boolean =>
  ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
