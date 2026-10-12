// A log cabin in the snow: a warm window spilling light onto the drifts, smoke from the chimney,
// snow-laden pines, and snow falling in three layers that drift at different speeds.
import { type Ctx, fillRect } from 'mojipx';
import { ditherGradient, fillColumns, hexToRgb, noise1, rand, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { type Box, colorKey, discImage, drawGlow, memoLayer, paintRange, pine, smokePlume, spanDisc, wrap } from './batch-1-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'star'
  | 'moon'
  | 'far'
  | 'snow'
  | 'snowShade'
  | 'pine'
  | 'log'
  | 'logDark'
  | 'stone'
  | 'window'
  | 'glow'
  | 'lit'
  | 'smoke';

const unitOf = (f: Frame): number => Math.min(f.w, f.h);
const horizonOf = (f: Frame): number => Math.round(f.h - 0.36 * unitOf(f) - 0.2 * (f.h - unitOf(f)));

type Cabin = { readonly x: number; readonly base: number; readonly w: number; readonly wallH: number; readonly roofH: number };

const cabinOf = (f: Frame): Cabin => {
  const u = unitOf(f);
  const w = Math.round(u * 0.32) | 1;
  return {
    x: Math.round(f.w / 2 - w / 2),
    base: horizonOf(f) + Math.round(u * 0.2),
    w,
    wallH: Math.round(u * 0.15),
    roofH: Math.round(u * 0.15),
  };
};

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const hz = horizonOf(f);
  ctx.drawImage(ditherGradient(f.w, hz, [c.sky0, c.sky1, c.sky2]), 0, 0);
  stars(ctx, f.w, hz, f.t * 0.6, [c.star], Math.round((f.w * hz) / 700), 51, 0.7);
  const u = unitOf(f);
  const r = Math.round(u * 0.055);
  const cx = Math.round(f.w * 0.24);
  const cy = Math.round(Math.max(u * 0.16, hz * 0.3));
  drawGlow(ctx, c.moon, cx, cy, r * 3, r * 3, 0.3);
  ctx.drawImage(crescent(r, c.moon), cx - r, cy - r);
};

// A crescent moon: the disc minus a slightly smaller disc shifted toward the upper right.
const crescent = (r: number, color: string): HTMLCanvasElement => {
  const rgb = hexToRgb(color);
  return discImage(`sc-moon:${color}`, r, (x, y) => (Math.hypot(x - r - r * 0.45, y - r + r * 0.3) <= r * 0.92 ? null : rgb));
};

const paintHills = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const hz = horizonOf(f);
  const u = unitOf(f);
  paintRange(g, f.w, hz, u * 0.22 + (f.h - u) * 0.25, 52, { rock: c.far, lit: c.snow, shade: c.snowShade }, 0.55);
  fillColumns(g, f.w, hz, c.snowShade, (x) => hz - u * (0.02 + 0.05 * noise1(x / 38, 53)));
  for (let i = 0, x = 3; x < f.w; i++, x += 5 + rand(i, 54) * 9) {
    const top = hz - u * (0.02 + 0.05 * noise1(x / 38, 53));
    pine(g, x, top + 3, u * (0.06 + 0.05 * rand(i, 55)), c.far, c.snowShade);
  }
};

const paintGround = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const hz = horizonOf(f);
  g.drawImage(ditherGradient(f.w, f.h - hz, [c.snowShade, c.snow, c.snow, c.snowShade]), 0, hz);
};

const PINES = [-0.42, -0.3, 0.29, 0.4, -0.62, 0.6] as const;

const paintPines = (g: Ctx, f: Frame, c: Colors<K>, behind: boolean): void => {
  const u = unitOf(f);
  const cab = cabinOf(f);
  PINES.forEach((dx, i) => {
    if (behind !== i < 4) return;
    const x = f.w / 2 + dx * (behind ? u : Math.min(u, f.w * 0.75));
    const front = Math.round(Math.max(u * 0.12, (f.h - cab.base) * 0.45));
    const base = cab.base - (behind ? Math.round(u * (0.05 + 0.03 * (i % 2))) : -front);
    pine(g, x, base, u * (behind ? 0.32 + 0.08 * (i % 2) : 0.55), c.pine, c.snow);
  });
};

const backdrop = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const layer = memoLayer(`sc-back:${f.w}x${f.h}:${colorKey(c)}`, f.w, f.h, (g) => {
    paintHills(g, f, c);
    paintGround(g, f, c);
    paintPines(g, f, c, true);
  });
  ctx.drawImage(layer, 0, 0);
};

// Log walls: stripes of logs with their ends sticking out at the corners.
const paintWalls = (g: Ctx, cab: Cabin, c: Colors<K>): void => {
  const top = cab.base - cab.wallH;
  for (let y = top; y < cab.base; y++) fillRect(g, (y - top) % 3 === 2 ? c.logDark : c.log, cab.x, y, cab.w, 1);
  for (let y = top; y < cab.base; y += 3) {
    fillRect(g, c.logDark, cab.x - 2, y, 2, 2);
    fillRect(g, c.logDark, cab.x + cab.w, y, 2, 2);
  }
  const cx = cab.x + cab.w / 2;
  for (let r = 0; r < cab.roofH; r++) {
    const half = Math.round(((r + 1) / cab.roofH) * (cab.w / 2));
    fillRect(g, r % 3 === 2 ? c.logDark : c.log, cx - half, top - cab.roofH + r, half * 2, 1);
  }
};

// A steep roof under a thick, rounded layer of snow, overhanging the walls.
const paintRoof = (g: Ctx, cab: Cabin, c: Colors<K>): void => {
  const top = cab.base - cab.wallH;
  const cx = cab.x + cab.w / 2;
  const thick = Math.max(3, Math.round(cab.w * 0.09));
  const chimneyX = Math.round(cx + cab.w * 0.2);
  fillRect(g, c.stone, chimneyX, top - cab.roofH * 0.95, Math.max(3, Math.round(cab.w * 0.1)), cab.roofH * 0.6);
  fillRect(g, c.snow, chimneyX - 1, top - cab.roofH * 0.95 - 1, Math.max(3, Math.round(cab.w * 0.1)) + 2, 2);
  for (let r = -thick; r < cab.roofH + 2; r++) {
    const half = Math.round(((r + 1) / cab.roofH) * (cab.w / 2 + 4));
    const y = top - cab.roofH + r;
    if (half <= 0) continue;
    fillRect(g, c.snow, cx - half - thick, y, thick + 1, 1);
    fillRect(g, c.snow, cx + half, y, thick + 1, 1);
    fillRect(g, c.snowShade, cx + half + thick, y, 1, 1);
  }
  fillRect(g, c.snow, cx - 2, top - cab.roofH - thick, 4, thick);
  // Icicles along the eaves.
  for (let x = cab.x - 3; x < cab.x + cab.w + 3; x += 3) fillRect(g, c.snowShade, x, top + 2, 1, 1 + ((x * 7) % 3));
};

const windowRect = (cab: Cabin): Box => {
  const w = Math.max(5, Math.round(cab.w * 0.26));
  const h = Math.max(4, Math.round(cab.wallH * 0.42));
  return { x: cab.x + Math.round(cab.w * 0.62), y: cab.base - Math.round(cab.wallH * 0.75), w, h };
};

const paintOpenings = (g: Ctx, cab: Cabin, c: Colors<K>): void => {
  const win = windowRect(cab);
  fillRect(g, c.logDark, win.x - 1, win.y - 1, win.w + 2, win.h + 2);
  fillRect(g, c.window, win.x, win.y, win.w, win.h);
  fillRect(g, c.logDark, win.x + Math.floor(win.w / 2), win.y, 1, win.h);
  fillRect(g, c.logDark, win.x, win.y + Math.floor(win.h / 2), win.w, 1);
  fillRect(g, c.snow, win.x - 2, win.y + win.h + 1, win.w + 4, 2);
  const doorW = Math.max(4, Math.round(cab.w * 0.2));
  const doorH = Math.round(cab.wallH * 0.78);
  fillRect(g, c.logDark, cab.x + Math.round(cab.w * 0.16), cab.base - doorH, doorW, doorH);
  fillRect(g, c.window, cab.x + Math.round(cab.w * 0.16) + doorW - 2, cab.base - Math.round(doorH / 2), 1, 1);
  const attic = Math.max(2, Math.round(cab.w * 0.08));
  g.fillStyle = c.window;
  spanDisc(g, cab.x + cab.w / 2, cab.base - cab.wallH - Math.round(cab.roofH * 0.4), attic);
};

const paintDrift = (g: Ctx, cab: Cabin, c: Colors<K>): void => {
  g.fillStyle = c.snow;
  for (let k = 0; k < 7; k++) spanDisc(g, cab.x - 6 + (k * (cab.w + 12)) / 6, cab.base + 1, 2 + (k % 3));
  fillRect(g, c.snow, cab.x - 6, cab.base - 1, cab.w + 12, 3);
};

const cabin = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const cab = cabinOf(f);
  const win = windowRect(cab);
  const u = unitOf(f);
  // Window light on the snow, swelling a little on the kick.
  const swell = Math.round(f.kick * 3) / 3;
  drawGlow(ctx, c.lit, win.x + win.w / 2, cab.base + u * 0.04, u * 0.19 + swell * 2, u * 0.045 + swell, 0.8, 3);
  const layer = memoLayer(`sc-cabin:${f.w}x${f.h}:${colorKey(c)}`, f.w, f.h, (g) => {
    paintWalls(g, cab, c);
    paintRoof(g, cab, c);
    paintOpenings(g, cab, c);
    paintDrift(g, cab, c);
  });
  ctx.drawImage(layer, 0, 0);
  drawGlow(ctx, c.glow, win.x + win.w / 2, win.y + win.h / 2, win.w * 0.9 + swell * 2, win.h * 1.1 + swell * 2, 0.35);
  const chimneyX = Math.round(cab.x + cab.w / 2 + cab.w * 0.2 + cab.w * 0.05);
  smokePlume(ctx, f, chimneyX, cab.base - cab.wallH - cab.roofH * 0.95 - 3, c.smoke, 3, u * 0.22);
};

// A short fence of posts capped with snow, to the left of the cabin.
const paintFence = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const u = unitOf(f);
  const reach = Math.min(u, f.w * 0.75);
  const y = cabinOf(f).base + Math.round(u * 0.09);
  const post = Math.max(6, Math.round(u * 0.06));
  const x0 = Math.round(f.w / 2 - reach * 0.5);
  for (let k = 0; k < 4; k++) {
    const x = x0 + Math.round(k * u * 0.07);
    fillRect(g, c.logDark, x, y - post + k, 2, post);
    fillRect(g, c.snow, x - 1, y - post - 1 + k, 4, 2);
  }
  fillRect(g, c.logDark, x0, y - Math.round(post * 0.6), Math.round(u * 0.22), 1);
};

// Footprints winding from the door toward the viewer.
const paintFootprints = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const cab = cabinOf(f);
  const door = cab.x + Math.round(cab.w * 0.26);
  g.fillStyle = c.snowShade;
  for (let y = cab.base + 3, k = 0; y < f.h; y += 3 + Math.floor((y - cab.base) / 24), k++) {
    const d = (y - cab.base) / Math.max(1, f.h - cab.base);
    const x = door + Math.sin(d * 4) * unitOf(f) * 0.08 * d - d * unitOf(f) * 0.1 + (k % 2 === 0 ? -2 : 1);
    g.fillRect(Math.round(x), y, 1 + Math.round(d * 2), 1);
  }
};

const foreground = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const layer = memoLayer(`sc-front:${f.w}x${f.h}:${colorKey(c)}`, f.w, f.h, (g) => {
    paintFootprints(g, f, c);
    paintFence(g, f, c);
    paintPines(g, f, c, false);
  });
  ctx.drawImage(layer, 0, 0);
};

type Flake = { readonly count: number; readonly speed: number; readonly size: number; readonly sway: number; readonly seed: number };

const flake = (ctx: Ctx, f: Frame, layer: Flake, i: number): void => {
  const span = f.h + 8;
  const fall = layer.speed * (0.8 + 0.4 * rand(i, layer.seed));
  const y = wrap(rand(i, layer.seed + 1) * span + f.t * fall, span) - 4;
  const sway = Math.sin(f.t * (0.6 + rand(i, layer.seed + 2)) + i) * layer.sway + Math.sin(f.beat * Math.PI * 0.5 + i) * 0.8;
  const x = wrap(rand(i, layer.seed + 3) * f.w + sway - f.t * layer.speed * 0.25, f.w);
  ctx.fillRect(Math.round(x), Math.round(y), layer.size, layer.size);
};

const snowfall = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const area = (f.w * f.h) / 1000;
  const layers: readonly (Flake & { color: string })[] = [
    { count: Math.round(area * 2.2), speed: 9, size: 1, sway: 2, seed: 60, color: c.snowShade },
    { count: Math.round(area * 1.4), speed: 17, size: 1, sway: 3, seed: 64, color: c.snow },
    { count: Math.round(area * (0.4 + 0.3 * f.energy)), speed: 30, size: 2, sway: 5, seed: 68, color: c.snow },
  ];
  for (const layer of layers) {
    ctx.fillStyle = layer.color;
    for (let i = 0; i < layer.count; i++) flake(ctx, f, layer, i);
  }
};

export const snowyCabin = defineScene<K>({
  id: 'snowy-cabin',
  title: 'Snowy Cabin',
  mood: { valence: 0.5, energy: -0.6 },
  styles: ['snowfall', 'cozy-village'],
  variants: [
    {
      mood: { valence: 0.35, energy: -0.7 },
      colors: {
        sky0: '#0a1230',
        sky1: '#1c2f5e',
        sky2: '#40609a',
        star: '#e8f0ff',
        moon: '#fff4d2',
        far: '#506aa0',
        snow: '#eaf2fc',
        snowShade: '#9eb4da',
        pine: '#173d4a',
        log: '#80503a',
        logDark: '#462a3a',
        stone: '#6c6c86',
        window: '#ffdc7e',
        glow: '#ffb862',
        lit: '#f6dcb4',
        smoke: '#b6c4e0',
      },
    },
    {
      mood: { valence: 0.65, energy: -0.45 },
      colors: {
        sky0: '#5c5ca4',
        sky1: '#c48cba',
        sky2: '#ffcab2',
        star: '#ead2ec',
        moon: '#fff2f0',
        far: '#a48cc4',
        snow: '#fff7f4',
        snowShade: '#c9b6da',
        pine: '#2f4c5e',
        log: '#8e5c42',
        logDark: '#4e3042',
        stone: '#8a7c96',
        window: '#ffe490',
        glow: '#ffc07c',
        lit: '#ffe2c4',
        smoke: '#f2e2ee',
      },
    },
  ],
  layers: [sky, backdrop, cabin, foreground, snowfall],
});
