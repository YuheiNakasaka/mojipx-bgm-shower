// Drawing helpers for scenes. Coordinates are canvas pixels; everything lands on whole pixels.
import { type Ctx, fillRect, hash2 } from 'mojipx';

/** A deterministic number in [0, 1) from two integers. */
export const rand = (a: number, b: number): number => hash2(a, b) / 4294967296;

export const frac = (x: number): number => x - Math.floor(x);

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5] as const;

/** Ordered-dither threshold in [0, 1) for a pixel. */
export const bayer = (x: number, y: number): number => (BAYER4[(y & 3) * 4 + (x & 3)] as number) / 16;

export const hexToRgb = (hex: string): readonly [number, number, number] => {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** Looks a key up in a bounded cache, making and storing the value on a miss; the least recently used entry goes first. */
export const cached = <T>(store: Map<string, T>, limit: number, key: string, make: () => T): T => {
  const hit = store.get(key);
  if (hit !== undefined) {
    store.delete(key);
    store.set(key, hit);
    return hit;
  }
  const made = make();
  if (store.size >= limit) store.delete(store.keys().next().value as string);
  store.set(key, made);
  return made;
};

// Static layers, shared by every scene. A transition shows two scenes at once, each with a handful of layers.
const layers = new Map<string, HTMLCanvasElement>();
const LAYER_LIMIT = 96;

/** A layer painted once with canvas calls and reused while its key stays the same; the key must name the size and every color. */
export const memoLayer = (key: string, w: number, h: number, paint: (ctx: Ctx) => void): HTMLCanvasElement =>
  cached(layers, LAYER_LIMIT, key, () => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.ceil(w));
    canvas.height = Math.max(1, Math.ceil(h));
    const ctx = canvas.getContext('2d');
    if (ctx) paint(ctx);
    return canvas;
  });

/** A layer painted pixel by pixel into ImageData; pixels left untouched stay transparent. */
export const memoCanvas = (key: string, w: number, h: number, paint: (img: ImageData) => void): HTMLCanvasElement =>
  memoLayer(`px:${key}`, w, h, (ctx) => {
    const img = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);
    paint(img);
    ctx.putImageData(img, 0, 0);
  });

/** A vertical gradient through color stops, ordered-dithered between neighbours like old hardware. */
export const ditherGradient = (w: number, h: number, stops: readonly string[]): HTMLCanvasElement =>
  memoCanvas(`grad:${w}x${h}:${stops.join(',')}`, w, h, (img) => {
    const rgb = stops.map(hexToRgb);
    for (let y = 0; y < img.height; y++) {
      const pos = (y / Math.max(1, img.height - 1)) * (rgb.length - 1);
      const i = Math.min(rgb.length - 2, Math.floor(pos));
      const f = pos - i;
      for (let x = 0; x < img.width; x++) {
        const c = (f > bayer(x, y) ? rgb[i + 1] : rgb[i]) ?? [0, 0, 0];
        const o = (y * img.width + x) * 4;
        img.data[o] = c[0];
        img.data[o + 1] = c[1];
        img.data[o + 2] = c[2];
        img.data[o + 3] = 255;
      }
    }
  });

/** Smooth 1-D value noise in [0, 1). */
export const noise1 = (x: number, seed: number): number => {
  const i = Math.floor(x);
  const f = x - i;
  const s = f * f * (3 - 2 * f);
  return rand(i, seed) * (1 - s) + rand(i + 1, seed) * s;
};

/** Two octaves of value noise, for ridges and cloud edges. */
export const ridgeNoise = (x: number, seed: number): number => noise1(x, seed) * 0.65 + noise1(x * 2.7, seed + 17) * 0.35;

/** A filled skyline: for each column, from `top(x)` down to `bottom`. */
export const fillColumns = (ctx: Ctx, w: number, bottom: number, color: string, top: (x: number) => number): void => {
  ctx.fillStyle = color;
  for (let x = 0; x < w; x++) {
    const y = Math.round(top(x));
    if (y < bottom) ctx.fillRect(x, y, 1, bottom - y);
  }
};

/** A one-pixel line on whole pixels (Bresenham), drawn as horizontal runs. */
export const pixelLine = (ctx: Ctx, x0: number, y0: number, x1: number, y1: number, color: string): void => {
  ctx.fillStyle = color;
  let x = Math.round(x0);
  let y = Math.round(y0);
  const tx = Math.round(x1);
  const ty = Math.round(y1);
  const dx = Math.abs(tx - x);
  const dy = -Math.abs(ty - y);
  const sx = x < tx ? 1 : -1;
  const sy = y < ty ? 1 : -1;
  let err = dx + dy;
  for (let guard = 0; guard < 4096; guard++) {
    ctx.fillRect(x, y, 1, 1);
    if (x === tx && y === ty) return;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
};

/** A filled disc as horizontal spans; `row` may skip or recolor rows (for striped suns and shading). */
export const disc = (ctx: Ctx, cx: number, cy: number, r: number, row: (dy: number) => string | null): void => {
  for (let dy = -r; dy <= r; dy++) {
    const color = row(dy);
    if (!color) continue;
    const half = Math.floor(Math.sqrt(r * r - dy * dy));
    fillRect(ctx, color, Math.round(cx - half), Math.round(cy + dy), half * 2 + 1, 1);
  }
};

/** Twinkling stars scattered over the top `fraction` of the screen. */
export const stars = (
  ctx: Ctx,
  w: number,
  h: number,
  t: number,
  colors: readonly string[],
  count: number,
  seed: number,
  fraction = 1,
): void => {
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rand(i, seed) * w);
    const y = Math.floor(rand(i, seed + 1) * h * fraction);
    const tw = Math.sin(t * (1 + rand(i, seed + 2) * 3) + i);
    if (tw < -0.6) continue;
    const color = colors[i % colors.length] as string;
    fillRect(ctx, color, x, y, 1, 1);
    if (tw > 0.92 && i % 5 === 0) {
      fillRect(ctx, color, x - 1, y, 3, 1);
      fillRect(ctx, color, x, y - 1, 1, 3);
    }
  }
};
