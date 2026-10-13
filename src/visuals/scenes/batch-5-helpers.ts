// Shared pieces for the Japanese landmark scenes of batch 5: layout checks, cached per-pixel layers,
// trains made of cars, and reflections that wobble on water or wet asphalt.
import { type Ctx, fillRect, type Sprite } from 'mojipx';
import { hexToRgb, memoCanvas, rand } from '../kit.ts';
import type { Frame } from '../scene.ts';

export const isWide = (f: Frame): boolean => f.w > f.h;

/** Whether a color is dark enough to be a night sky (lights and stars come out). */
export const isDark = (hex: string): boolean => {
  const [r, g, b] = hexToRgb(hex);
  return r * 0.3 + g * 0.59 + b * 0.11 < 60;
};

/** The hex color k of the way from a to b (hex, unlike mojipx's mixColor, so per-pixel layers and dithers can read it). */
export const mixHex = (a: string, b: string, k: number): string => {
  const from = hexToRgb(a);
  const to = hexToRgb(b);
  const channel = (i: 0 | 1 | 2): string =>
    Math.round(from[i] + (to[i] - from[i]) * k)
      .toString(16)
      .padStart(2, '0');
  return `#${channel(0)}${channel(1)}${channel(2)}`;
};

/** Smooth 2-D value noise in [0, 1), for foliage, clouds and stone. */
export const noise2 = (x: number, y: number, seed: number): number => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const u = x - xi;
  const v = y - yi;
  const su = u * u * (3 - 2 * u);
  const sv = v * v * (3 - 2 * v);
  const at = (dx: number, dy: number): number => rand(xi + dx + (yi + dy) * 7919, seed);
  return (at(0, 0) * (1 - su) + at(1, 0) * su) * (1 - sv) + (at(0, 1) * (1 - su) + at(1, 1) * su) * sv;
};

/** A cached layer painted pixel by pixel: `pick` names each pixel's color, or null to leave it clear. The key must name every color. */
export const pixelLayer = (key: string, w: number, h: number, pick: (x: number, y: number) => string | null): HTMLCanvasElement =>
  memoCanvas(`b5:${key}:${w}x${h}`, w, h, (img) => {
    const rgbs = new Map<string, readonly [number, number, number]>();
    for (let y = 0; y < img.height; y++)
      for (let x = 0; x < img.width; x++) {
        const color = pick(x, y);
        if (!color) continue;
        const rgb = rgbs.get(color) ?? hexToRgb(color);
        rgbs.set(color, rgb);
        const o = (y * img.width + x) * 4;
        img.data[o] = rgb[0];
        img.data[o + 1] = rgb[1];
        img.data[o + 2] = rgb[2];
        img.data[o + 3] = 255;
      }
  });

/** Calls `car(x, i)` for each car of a train whose rear end is at x0 (cars numbered from the rear), skipping cars off screen. */
export const eachCar = (x0: number, cars: number, pitch: number, w: number, car: (x: number, i: number) => void): void => {
  for (let i = 0; i < cars; i++) {
    const x = Math.round(x0 + i * pitch);
    if (x <= w && x + pitch >= 0) car(x, i);
  }
};

export type Wave = {
  readonly amp: number;
  readonly freq: number;
  readonly speed: number;
  /** Rows of the reflection per row of the picture (more than 1 stretches it, less squashes it). */
  readonly squash: number;
  /** Every `gap`-th row is left out, and the gaps drift, so the reflection breaks up like water (0 keeps every row). */
  readonly gap: number;
};

/**
 * A reflection: rows of `src` (a cached picture whose bottom row sits on the water line) drawn upside down from `top`
 * down to `bottom`, each row shifted sideways by a ripple that grows with distance from the line. One drawImage per row.
 */
export const ripple = (
  ctx: Ctx,
  f: Frame,
  src: HTMLCanvasElement,
  pos: { readonly x: number; readonly top: number; readonly bottom: number },
  wave: Wave,
): void => {
  const drift = Math.floor(f.t * 5);
  for (let y = pos.top; y < pos.bottom; y++) {
    const depth = y - pos.top;
    const sy = src.height - 1 - Math.floor(depth / wave.squash);
    if (sy < 0) return;
    if (wave.gap > 0 && depth > 1 && (y + drift) % wave.gap === 0) continue;
    const dx = Math.round(Math.sin(y * wave.freq + f.t * wave.speed) * wave.amp * Math.min(1, 0.3 + depth / 24));
    ctx.drawImage(src, 0, sy, src.width, 1, pos.x + dx, y, src.width, 1);
  }
};

/** A small bird seen from afar, wings up and wings level (one character, `o`). */
export const BIRD: readonly Sprite[] = [
  ['o...o', '.o.o.', '..o..'],
  ['.....', 'oo.oo', '..o..'],
];

/** A stone lantern: o outline, h light stone, s stone, d shade, L the window of its fire box. */
export const STONE_LANTERN: Sprite = [
  '.....o.....',
  '....oho....',
  '..oohhsoo..',
  '.ohhhsssdo.',
  'ohhssssssdo',
  'ooooooooooo',
  '..ohLLLdo..',
  '..ohLoLdo..',
  '..ohLLLdo..',
  '.ooooooooo.',
  '.ohsssssdo.',
  '..ooooooo..',
  '...ohsdo...',
  '...ohsdo...',
  '...ohsdo...',
  '...ohsdo...',
  '..oohsdoo..',
  '.ohssssddo.',
  'ohsssssssdo',
  'ooooooooooo',
];

/** Light on water or wet asphalt: thin broken streaks below a bright thing, `w` wide, that wobble and thin out downward. */
export const shine = (ctx: Ctx, f: Frame, x: number, w: number, top: number, length: number, color: string): void => {
  const streaks = Math.max(1, Math.round(w / 9));
  for (let k = 0; k < streaks; k++) {
    const sx = x + (streaks === 1 ? 0 : Math.round((k / (streaks - 1)) * (w - 1)));
    const len = length * (0.5 + rand(k, Math.round(x)) * 0.5);
    for (let y = 0; y < len; y++) {
      if (rand(k * 31 + (y >> 1), Math.floor(f.t * 6)) < 0.25 + (y / len) * 0.6) continue;
      const dx = Math.round(Math.sin((top + y) * 0.35 + f.t * 3 + k) * (0.4 + y * 0.02));
      fillRect(ctx, color, sx + dx, top + y, 1, 1);
    }
  }
};
