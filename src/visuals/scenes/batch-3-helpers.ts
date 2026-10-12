// Shared drawing helpers for the third batch of scenes: dithered full-screen fields, cached layers
// painted with a 2D context, per-variant sprite palettes, and beat-scheduled events.
import type { Ctx, Palette } from 'mojipx';
import { bayer, cached, frac, hexToRgb, memoLayer as kitMemoLayer } from '../kit.ts';
import type { Colors, Frame } from '../scene.ts';

const canvasOfSize = (w: number, h: number): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(w));
  canvas.height = Math.max(1, Math.ceil(h));
  return canvas;
};

// Reusable offscreen canvases. They are scratch space redrawn every frame, not state: each frame overwrites them fully.
type Scratch = {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly img: ImageData;
  readonly pixels: Uint32Array;
};
const scratches = new Map<string, Scratch | null>();

const scratchOf = (w: number, h: number): Scratch | null =>
  cached(scratches, 6, `${w}x${h}`, () => {
    const canvas = canvasOfSize(w, h);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const img = ctx.createImageData(w, h);
    return { canvas, ctx, img, pixels: new Uint32Array(img.data.buffer) };
  });

// Ramp colors packed as the 32-bit pixels of ImageData (byte order RGBA in memory, little-endian words), with one extra
// entry at the end so a value just under the top can dither upward: the first color again when wrapping, else the last.
const ramps = new Map<string, Uint32Array>();
const packed = (hex: string): number => {
  const [r, g, b] = hexToRgb(hex);
  return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
};
const rampOf = (colors: readonly string[], wrap: boolean): Uint32Array =>
  cached(ramps, 64, `${wrap}:${colors.join(',')}`, () =>
    Uint32Array.from([...colors, (wrap ? colors[0] : colors.at(-1)) ?? '#000000'], packed),
  );

const fields = new Map<string, Float32Array>();
const fieldOf = (n: number): Float32Array => cached(fields, 6, String(n), () => new Float32Array(n));

// Samples the value once per block, already folded into [0, n - 1] (clamped) or [0, n) (wrapped).
const sampleField = (gw: number, gh: number, cell: number, n: number, wrap: boolean, value: (x: number, y: number) => number) => {
  const field = fieldOf(gw * gh);
  for (let gy = 0; gy < gh; gy++)
    for (let gx = 0; gx < gw; gx++) {
      const v = value(gx * cell + cell / 2, gy * cell + cell / 2);
      field[gy * gw + gx] = wrap ? ((v % n) + n) % n : Math.min(n - 1, Math.max(0, v));
    }
  return field;
};

const THRESHOLDS = Array.from({ length: 4 }, (_, y) => Float32Array.from({ length: 4 }, (_, x) => bayer(x, y)));

/**
 * Paints the whole frame from a value field sampled once per `cell`×`cell` block (the costly part runs at low
 * resolution), then ordered-dithers every pixel between neighbouring ramp entries. `value(x, y)` gets the block
 * centre in canvas pixels and returns a ramp position; with `wrap` it cycles through the ramp, otherwise it clamps.
 */
export const ditherField = (
  ctx: Ctx,
  f: Frame,
  cell: number,
  colors: readonly string[],
  wrap: boolean,
  value: (x: number, y: number) => number,
): void => {
  if (f.w < 1 || f.h < 1) return;
  const out = scratchOf(f.w, f.h);
  if (!out) return;
  const gw = Math.ceil(f.w / cell);
  const field = sampleField(gw, Math.ceil(f.h / cell), cell, colors.length, wrap, value);
  const lut = rampOf(colors, wrap);
  const { pixels } = out;
  for (let y = 0; y < f.h; y++) {
    const row = ((y / cell) | 0) * gw;
    const th = THRESHOLDS[y & 3] as Float32Array;
    const o = y * f.w;
    for (let x = 0; x < f.w; x++) {
      const v = field[row + ((x / cell) | 0)] as number;
      const base = v | 0;
      pixels[o + x] = lut[v - base > (th[x & 3] as number) ? base + 1 : base] as number;
    }
  }
  out.ctx.putImageData(out.img, 0, 0);
  ctx.drawImage(out.canvas, 0, 0);
};

// Static layers painted with a 2D context, cached by key (size + colors). Keys must never contain time.
export const memoLayer = (key: string, w: number, h: number, paint: (ctx: Ctx) => void): HTMLCanvasElement =>
  kitMemoLayer(`b3:${key}`, w, h, paint);

/** A cache-key fragment naming a color set. */
export const sigOf = (c: Readonly<Record<string, string>>): string => Object.values(c).join(',');

// Sprite palettes per color set. The color objects of a scene's variants are fixed, so each palette is built once and
// keeps its identity, which lets mojipx reuse the sprite images it rasterizes.
const palettes = new WeakMap<object, WeakMap<object, Palette>>();

export const paletteOf = <K extends string>(c: Colors<K>, build: (c: Colors<K>) => Palette): Palette => {
  let byColors = palettes.get(build);
  if (!byColors) {
    byColors = new WeakMap();
    palettes.set(build, byColors);
  }
  const hit = byColors.get(c);
  if (hit) return hit;
  const made = build(c);
  byColors.set(c, made);
  return made;
};

/** Beat-scheduled events: calls `each(beatIndex, age)` for every whole beat in the last `span` beats, newest first. */
export const recentBeats = (beat: number, span: number, each: (index: number, age: number) => void): void => {
  const now = Math.floor(beat);
  for (let k = 0; k < span; k++) each(now - k, beat - (now - k));
};

/** Eases a beat's phase so motion surges right after the beat and settles before the next. */
export const surge = (beat: number): number => Math.floor(beat) + 1 - (1 - frac(beat)) ** 3;

// A sine table for per-pixel effects, where Math.sin dominates the cost; 1,024 steps per turn is plenty at this size.
const SINES = Float32Array.from({ length: 1024 }, (_, i) => Math.sin((i / 1024) * Math.PI * 2));
const STEPS_PER_RADIAN = 1024 / (Math.PI * 2);

export const fastSin = (x: number): number => SINES[((x * STEPS_PER_RADIAN) | 0) & 1023] as number;

export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
