// Drawing helpers shared by the scenes of batch 2: cached layers drawn with fillRect, dithered glows,
// horizontal tiling, palettes bound to a variant's colors, and a moon.
import { type Ctx, fillRect, type Palette } from 'mojipx';
import { bayer, disc, hexToRgb, memoCanvas } from '../kit.ts';

/** A static layer drawn once with ordinary canvas calls and cached by key and size (the key must name every color used). */
export const memoLayer = (key: string, w: number, h: number, paint: (ctx: Ctx) => void): HTMLCanvasElement =>
  memoCanvas(`b2:${key}:${w}x${h}`, w, h, (img) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    paint(ctx);
    img.data.set(ctx.getImageData(0, 0, img.width, img.height).data);
  });

/** A round glow of one color, ordered-dithered from dense at the centre to nothing at radius `r`. */
export const glowOf = (r: number, color: string, density: number): HTMLCanvasElement =>
  memoCanvas(`b2glow:${r}:${color}:${density}`, r * 2 + 1, r * 2 + 1, (img) => {
    const [cr, cg, cb] = hexToRgb(color);
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        const d = Math.hypot(x - r, y - r) / Math.max(1, r);
        if (d >= 1 || (1 - d) ** 2 * density <= bayer(x, y)) continue;
        const o = (y * img.width + x) * 4;
        img.data[o] = cr;
        img.data[o + 1] = cg;
        img.data[o + 2] = cb;
        img.data[o + 3] = 255;
      }
    }
  });

/** Draws a glow centred on (cx, cy). */
export const drawGlow = (ctx: Ctx, cx: number, cy: number, r: number, color: string, density: number): void => {
  ctx.drawImage(glowOf(r, color, density), Math.round(cx - r), Math.round(cy - r));
};

/** x modulo `period`, always in [0, period). */
export const wrap = (x: number, period: number): number => ((x % period) + period) % period;

/** Smoothstep from 0 to 1 as x goes from a to b. */
export const smooth = (a: number, b: number, x: number): number => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

/** Draws a horizontally repeating layer scrolled left by `scroll`, covering the width `w`. */
export const tileX = (ctx: Ctx, layer: HTMLCanvasElement, scroll: number, y: number, w: number): void => {
  const start = -Math.round(wrap(scroll, layer.width));
  for (let x = start; x < w; x += layer.width) ctx.drawImage(layer, x, Math.round(y));
};

// Palettes are cached per color set (a variant's colors never change), so sprite canvases are built once.
const palettes = new WeakMap<object, Map<string, Palette>>();

export const paletteOf = <C extends object>(colors: C, tag: string, build: (c: C) => Palette): Palette => {
  let byTag = palettes.get(colors);
  if (!byTag) {
    byTag = new Map();
    palettes.set(colors, byTag);
  }
  const hit = byTag.get(tag);
  if (hit) return hit;
  const made = build(colors);
  byTag.set(tag, made);
  return made;
};

/** A full moon with a few darker seas, lit from the upper left. */
export const moon = (ctx: Ctx, cx: number, cy: number, r: number, lit: string, sea: string): void => {
  disc(ctx, cx, cy, r, () => lit);
  disc(ctx, cx + r * 0.3, cy - r * 0.15, Math.max(1, Math.round(r * 0.28)), () => sea);
  disc(ctx, cx - r * 0.25, cy + r * 0.35, Math.max(1, Math.round(r * 0.2)), () => sea);
  disc(ctx, cx + r * 0.05, cy + r * 0.55, Math.max(1, Math.round(r * 0.12)), () => sea);
  fillRect(ctx, sea, Math.round(cx - r * 0.45), Math.round(cy - r * 0.4), 2, 1);
};
