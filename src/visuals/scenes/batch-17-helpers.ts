// Shared pieces for the famous sights of Japan in batch 17: a Japanese paper umbrella held over someone's head, and
// figures modelled from shapes at any size.
import { type Ctx, fillRect, type Sprite } from 'mojipx';
import { pixelLine } from '../kit.ts';
import { type Dot, figure, type Part } from './batch-14-helpers.ts';

export type WagasaTones = {
  readonly paper: string;
  /** The paper's underside and lower slope, the pale ring painted round it, and the outline, ribs and shaft. */
  readonly shade: string;
  readonly ring: string;
  readonly ink: string;
};

/**
 * A paper umbrella seen from the side, its crown at (cx, crown) and `r` pixels to each side: a shallow dome of paper
 * with a pale ring round it, a scalloped rim where the ribs end, a little cap on top, and the shaft running down to
 * the hand at (hx, hy).
 */
export const drawWagasa = (ctx: Ctx, cx: number, crown: number, r: number, t: WagasaTones, hx: number, hy: number): void => {
  const rise = Math.max(2, Math.round(r * 0.42));
  const ring = Math.round(rise * 0.6);
  pixelLine(ctx, cx, crown + rise, hx, hy, t.ink);
  fillRect(ctx, t.ink, cx, crown - 2, 1, 2);
  for (let dy = 0; dy <= rise; dy++) {
    const half = Math.round(r * Math.sqrt(1 - ((rise - dy) / (rise + 0.6)) ** 2));
    const tone = dy === ring ? t.ring : dy > ring ? t.shade : t.paper;
    fillRect(ctx, t.ink, cx - half - 1, crown + dy, half * 2 + 3, 1);
    fillRect(ctx, tone, cx - half, crown + dy, half * 2 + 1, 1);
  }
  fillRect(ctx, t.ink, cx - 1, crown - 1, 3, 1);
  for (let k = -r; k <= r; k++) fillRect(ctx, (k + r) % 3 === 0 ? t.ink : t.shade, cx + k, crown + rise + 1, 1, 1);
};

/**
 * A figure designed on a small grid and modelled `scale` times larger: every shape grows, the outline stays one
 * pixel, and the hand-set dots land on the nearest pixel.
 */
export const figureAt = (scale: number, w: number, h: number, parts: readonly Part[], dots: readonly Dot[] = []): Sprite =>
  figure(
    Math.ceil(w * scale),
    Math.ceil(h * scale),
    parts.map(([ch, inside]): Part => [ch, (x, y) => inside(x / scale, y / scale)]),
    dots.map(([x, y, ch]): Dot => [Math.floor(x * scale + 0.3), Math.floor(y * scale + 0.3), ch]),
  );
