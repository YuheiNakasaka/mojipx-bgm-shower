// Shared pieces for the fictional-game screens of batch 4: a 5×7 pixel font, the classic blue menu window,
// filled polygons for cached layers, and value noise that can wrap around for maps that scroll forever.
import { type Ctx, drawSprite, mixColor, type Palette, type Sprite } from 'mojipx';
import { disc, ditherGradient, memoLayer as kitMemoLayer, rand } from '../kit.ts';
import { glowCanvas } from './batch-1-helpers.ts';

/** A static layer painted once and cached by key (the key must name the size and every color used). */
export const memoLayer = (key: string, w: number, h: number, paint: (ctx: Ctx) => void): HTMLCanvasElement =>
  kitMemoLayer(`b4:${key}:${w}x${h}`, w, h, paint);

// ---- text ----

// Glyph rows separated by '|'; '#' is ink. Narrow glyphs are fine: the advance is the glyph width plus one.
const GLYPH_ROWS: Readonly<Record<string, string>> = {
  A: '.###.|#...#|#...#|#####|#...#|#...#|#...#',
  B: '####.|#...#|#...#|####.|#...#|#...#|####.',
  C: '.###.|#...#|#....|#....|#....|#...#|.###.',
  D: '###..|#..#.|#...#|#...#|#...#|#..#.|###..',
  E: '#####|#....|#....|####.|#....|#....|#####',
  F: '#####|#....|#....|####.|#....|#....|#....',
  G: '.###.|#...#|#....|#.###|#...#|#...#|.####',
  H: '#...#|#...#|#...#|#####|#...#|#...#|#...#',
  I: '###|.#.|.#.|.#.|.#.|.#.|###',
  J: '..###|...#.|...#.|...#.|...#.|#..#.|.##..',
  K: '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#',
  L: '#....|#....|#....|#....|#....|#....|#####',
  M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#',
  N: '#...#|#...#|##..#|#.#.#|#..##|#...#|#...#',
  O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.',
  P: '####.|#...#|#...#|####.|#....|#....|#....',
  Q: '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#',
  R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
  S: '.####|#....|#....|.###.|....#|....#|####.',
  T: '#####|..#..|..#..|..#..|..#..|..#..|..#..',
  U: '#...#|#...#|#...#|#...#|#...#|#...#|.###.',
  V: '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..',
  W: '#...#|#...#|#...#|#.#.#|#.#.#|#.#.#|.#.#.',
  X: '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
  Y: '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..',
  Z: '#####|....#|...#.|..#..|.#...|#....|#####',
  '0': '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.',
  '1': '.#.|##.|.#.|.#.|.#.|.#.|###',
  '2': '.###.|#...#|....#|...#.|..#..|.#...|#####',
  '3': '#####|...#.|..#..|...#.|....#|#...#|.###.',
  '4': '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.',
  '5': '#####|#....|####.|....#|....#|#...#|.###.',
  '6': '..##.|.#...|#....|####.|#...#|#...#|.###.',
  '7': '#####|....#|...#.|..#..|.#...|.#...|.#...',
  '8': '.###.|#...#|#...#|.###.|#...#|#...#|.###.',
  '9': '.###.|#...#|#...#|.####|....#|...#.|.##..',
  '/': '....#|....#|...#.|..#..|.#...|#....|#....',
  ':': '.|#|#|.|#|#|.',
  '!': '#|#|#|#|#|.|#',
  '?': '.###.|#...#|....#|...#.|..#..|.....|..#..',
  '.': '.|.|.|.|.|.|#',
  '-': '...|...|...|###|...|...|...',
  '~': '.....|.....|.#...|#.#.#|...#.|.....|.....',
  '©': '.#####.|#.....#|#.###.#|#.#...#|#.###.#|#.....#|.#####.',
  ' ': '...|...|...|...|...|...|...',
};

const GLYPHS: ReadonlyMap<string, Sprite> = new Map(Object.entries(GLYPH_ROWS).map(([ch, rows]) => [ch, rows.split('|')]));
const BLANK = GLYPHS.get(' ') as Sprite;

export const GLYPH_H = 7;

const glyphOf = (ch: string): Sprite => GLYPHS.get(ch) ?? BLANK;

/** Width in pixels of a line of text. */
export const textWidth = (text: string): number => [...text].reduce((w, ch) => w + ((glyphOf(ch)[0] ?? '').length + 1), 0) - 1;

// One-color palettes for glyphs, kept per color so mojipx rasterizes each glyph once per color.
const inks = new Map<string, Palette>();
const inkOf = (color: string): Palette => {
  const hit = inks.get(color);
  if (hit) return hit;
  const made: Palette = { '#': color };
  inks.set(color, made);
  return made;
};

/** Draws a line of text with its top-left corner at (x, y). */
export const drawText = (ctx: Ctx, text: string, x: number, y: number, color: string): void => {
  let cx = Math.round(x);
  for (const ch of text) {
    const glyph = glyphOf(ch);
    drawSprite(ctx, glyph, inkOf(color), cx, Math.round(y));
    cx += (glyph[0] ?? '').length + 1;
  }
};

const AROUND = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
] as const;

/** Text with a one-pixel outline all round, like the numbers and captions of old game screens. */
export const drawTextOutlined = (ctx: Ctx, text: string, x: number, y: number, color: string, outline: string): void => {
  for (const [dx, dy] of AROUND) drawText(ctx, text, x + dx, y + dy, outline);
  drawText(ctx, text, x, y, color);
};

/** Calls `each(x, y)` for every inked pixel of a line of text, relative to its top-left corner. */
export const forEachTextPixel = (text: string, each: (x: number, y: number) => void): void => {
  let cx = 0;
  for (const ch of text) {
    const glyph = glyphOf(ch);
    glyph.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) if (row[x] === '#') each(cx + x, y);
    });
    cx += (glyph[0] ?? '').length + 1;
  }
};

// ---- the menu window ----

export type WindowColors = {
  /** The fill, from its top to its bottom. */
  readonly top: string;
  readonly bottom: string;
  /** The bright frame and the dark lines either side of it. */
  readonly rim: string;
  readonly edge: string;
};

/** A menu window: a dark line, a bright frame, a dark line and a dithered gradient fill, with rounded corners. */
export const drawWindow = (ctx: Ctx, x: number, y: number, w: number, h: number, wc: WindowColors): void => {
  const x0 = Math.round(x);
  const y0 = Math.round(y);
  ctx.fillStyle = wc.edge;
  ctx.fillRect(x0 + 2, y0, w - 4, h);
  ctx.fillRect(x0, y0 + 2, w, h - 4);
  ctx.fillRect(x0 + 1, y0 + 1, w - 2, h - 2);
  ctx.fillStyle = wc.rim;
  ctx.fillRect(x0 + 2, y0 + 1, w - 4, h - 2);
  ctx.fillRect(x0 + 1, y0 + 2, w - 2, h - 4);
  ctx.fillStyle = wc.edge;
  ctx.fillRect(x0 + 3, y0 + 2, w - 6, h - 4);
  ctx.fillRect(x0 + 2, y0 + 3, w - 4, h - 6);
  if (w > 6 && h > 6) ctx.drawImage(ditherGradient(w - 6, h - 6, [wc.top, wc.bottom]), x0 + 3, y0 + 3);
};

// ---- shapes ----

/** A sun or moon: a disc in a banded halo of dithered light `reach` times its radius. */
export const sunWithHalo = (g: Ctx, x: number, y: number, r: number, sun: string, halo: string, reach = 3): void => {
  const hr = Math.max(1, Math.round(r * reach));
  g.drawImage(glowCanvas(halo, hr, hr, 0.75, 6), Math.round(x) - hr, Math.round(y) - hr);
  disc(g, x, y, r, () => sun);
};

export type Pt = readonly [number, number];

// Where the polygon's edges cross the horizontal line at height y, sorted left to right.
const crossings = (pts: readonly Pt[], y: number): readonly number[] => {
  const xs: number[] = [];
  for (let i = 0; i < pts.length; i++) {
    const [ax, ay] = pts[i] as Pt;
    const [bx, by] = pts[(i + 1) % pts.length] as Pt;
    if (ay <= y !== by <= y) xs.push(ax + ((y - ay) / (by - ay)) * (bx - ax));
  }
  return xs.sort((p, q) => p - q);
};

/** A filled polygon (even-odd rule) sampled at pixel centres, painted as horizontal runs. */
export const fillPolygon = (ctx: Ctx, pts: readonly Pt[], color: string): void => {
  if (pts.length < 3) return;
  const ys = pts.map((p) => p[1]);
  ctx.fillStyle = color;
  for (let y = Math.floor(Math.min(...ys)); y < Math.ceil(Math.max(...ys)); y++) {
    const xs = crossings(pts, y + 0.5);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const a = Math.round(xs[k] as number);
      const b = Math.round(xs[k + 1] as number);
      if (b > a) ctx.fillRect(a, y, b - a, 1);
    }
  }
};

// ---- palettes ----

/** A sprite palette moved a share `k` of the way toward a color: characters keep their own colors but catch the light. */
export const tinted = (base: Palette, to: string, k: number): Palette =>
  Object.fromEntries(Object.entries(base).map(([key, hex]) => [key, mixColor(hex, to, k)]));

// ---- noise ----

const ease = (f: number): number => f * f * (3 - 2 * f);
const wrapCell = (i: number, period: number): number => (period > 0 ? ((i % period) + period) % period : i);

/** Smooth 2-D value noise in [0, 1); with a whole-number `period` it repeats along x every that many cells. */
export const noise2 = (x: number, y: number, seed: number, period = 0): number => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const sx = ease(x - ix);
  const sy = ease(y - iy);
  const at = (i: number, j: number): number => rand(wrapCell(i, period) + j * 7919, seed);
  const top = at(ix, iy) * (1 - sx) + at(ix + 1, iy) * sx;
  const bottom = at(ix, iy + 1) * (1 - sx) + at(ix + 1, iy + 1) * sx;
  return top * (1 - sy) + bottom * sy;
};

/** Two octaves of `noise2`, for coastlines and terrain. */
export const fractal2 = (x: number, y: number, seed: number, period = 0): number =>
  noise2(x, y, seed, period) * 0.65 + noise2(x * 2, y * 2, seed + 31, period * 2) * 0.35;
