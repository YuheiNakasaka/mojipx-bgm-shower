// Shared pieces for the arcade screens of batch 8: HUD gauges and zero-padded counters, text that pops up and blinks
// out, big blocky captions, layers that scroll forever along y, and hair that swings like a pendulum.
import { type Ctx, fillRect } from 'mojipx';
import { frac } from '../kit.ts';
import type { Colors, Frame } from '../scene.ts';
import { drawText, drawTextOutlined, forEachTextPixel, textWidth } from './batch-4-helpers.ts';

/** A counter as a fixed number of digits, padded with zeros (the way score counters show it). */
export const digits = (n: number, width: number): string =>
  String(Math.max(0, Math.floor(n)))
    .padStart(width, '0')
    .slice(-width);

export type GaugeColors = {
  readonly frame: string;
  readonly back: string;
  readonly fill: string;
  readonly hi: string;
  /** The stretch just lost, which drains after the bar. */
  readonly lost: string;
};

/**
 * A HUD gauge: a framed bar filled to `level` (0–1), with a lighter top row; `trail` (≥ level) shows the stretch just
 * lost. With `fromRight` it empties toward the right, as the second player's bar does.
 */
export const gauge = (
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  level: number,
  gc: GaugeColors,
  fromRight = false,
  trail = level,
): void => {
  fillRect(ctx, gc.frame, x - 1, y - 1, w + 2, h + 2);
  fillRect(ctx, gc.back, x, y, w, h);
  const spanOf = (k: number): number => Math.round(Math.min(1, Math.max(0, k)) * w);
  const lost = spanOf(trail);
  const full = spanOf(level);
  const at = (span: number): number => (fromRight ? x + w - span : x);
  fillRect(ctx, gc.lost, at(lost), y, lost, h);
  fillRect(ctx, gc.fill, at(full), y, full, h);
  if (h > 2) fillRect(ctx, gc.hi, at(full), y, full, 1);
};

/** A line of text centred on x, outlined when an outline color is given. */
export const textCentered = (ctx: Ctx, text: string, cx: number, y: number, color: string, outline?: string): void => {
  const x = Math.round(cx - textWidth(text) / 2);
  if (outline) drawTextOutlined(ctx, text, x, y, color, outline);
  else drawText(ctx, text, x, y, color);
};

/** Text that pops up centred on (cx, y) and floats `rise` pixels up while `age` goes 0 → 1, blinking out at the end. */
export const popup = (ctx: Ctx, text: string, cx: number, y: number, age: number, color: string, outline: string, rise = 8): void => {
  if (age < 0 || age >= 1) return;
  if (age > 0.7 && frac(age * 10) < 0.5) return;
  const lift = Math.round(Math.min(1, age * 3) * rise);
  textCentered(ctx, text, cx, y - lift, color, outline);
};

/** Draws a vertically repeating layer scrolled down by `scroll`, covering rows [top, top + h) at x. */
export const tileDown = (ctx: Ctx, layer: HTMLCanvasElement, scroll: number, x: number, top: number, h: number): void => {
  const period = layer.height;
  const start = top + Math.round(((scroll % period) + period) % period) - period;
  for (let y = start; y < top + h; y += period) ctx.drawImage(layer, Math.round(x), y);
};

/** A cache-key fragment naming the frame size and a color set. */
export const sizeKey = (f: Frame, c: Colors<string>): string => `${f.w}x${f.h}:${Object.values(c).join('')}`;

/**
 * Text scaled up `scale` times with a one-pixel outline round every block, centred on cx: the big captions of game
 * screens (PERFECT, FIGHT!, a combo count).
 */
export const bigText = (ctx: Ctx, text: string, cx: number, y: number, scale: number, color: string, outline: string): void => {
  const x0 = Math.round(cx - (textWidth(text) * scale) / 2);
  const y0 = Math.round(y);
  ctx.fillStyle = outline;
  forEachTextPixel(text, (x, py) => ctx.fillRect(x0 + x * scale - 1, y0 + py * scale - 1, scale + 2, scale + 2));
  ctx.fillStyle = color;
  forEachTextPixel(text, (x, py) => ctx.fillRect(x0 + x * scale, y0 + py * scale, scale, scale));
};

export type StrandColors = { readonly ink: string; readonly hair: string; readonly hi: string; readonly lo: string };

/**
 * A lock of hair (a ponytail, a braid) hanging from (x, y): `len` rows, each `width(k)` pixels wide, its tip swinging
 * `sway` pixels sideways (the root stays put) and drifting `lean` pixels outward over its length.
 */
export const strand = (
  ctx: Ctx,
  x: number,
  y: number,
  len: number,
  sway: number,
  lean: number,
  width: (k: number) => number,
  sc: StrandColors,
): void => {
  for (let k = 0; k <= len; k++) {
    const u = k / Math.max(1, len);
    const cx = x + u * lean + u ** 1.6 * sway;
    const w = Math.max(1, Math.round(width(u)));
    const left = Math.round(cx - w / 2);
    fillRect(ctx, sc.ink, left - 1, y + k, w + 2, k === len ? 2 : 1);
    if (k === len) continue;
    fillRect(ctx, sc.hair, left, y + k, w, 1);
    fillRect(ctx, sc.hi, left + 1, y + k, 1, 1);
    if (w > 3) fillRect(ctx, sc.lo, left + w - 1, y + k, 1, 1);
  }
};
