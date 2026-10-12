// A campfire in a clearing at night: flames that leap on the kick and flicker between beats, embers
// drifting up, two tents lit on the side facing the fire, and a starry sky crossed by shooting stars.
import { type Ctx, fillRect } from 'mojipx';
import { bayer, ditherGradient, frac, hexToRgb, noise1, pixelLine, rand, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { colorKey, drawGlow, memoLayer, memoPixels, pine, setPixel } from './batch-1-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'star'
  | 'hill'
  | 'ground'
  | 'groundLit'
  | 'tent'
  | 'tentLit'
  | 'tentDark'
  | 'log'
  | 'stone'
  | 'flame0'
  | 'flame1'
  | 'flame2'
  | 'flame3'
  | 'glow';

const unitOf = (f: Frame): number => Math.min(f.w, f.h);
const horizonOf = (f: Frame): number => Math.round(f.h - 0.4 * unitOf(f) - 0.25 * (f.h - unitOf(f)));
const fireOf = (f: Frame): { x: number; y: number } => ({ x: Math.round(f.w / 2), y: horizonOf(f) + Math.round(unitOf(f) * 0.3) });

// A faint band of the galaxy slanting across the sky, dithered thinner toward its edges.
const galaxy = (w: number, h: number, color: string): HTMLCanvasElement =>
  memoPixels(`cf-galaxy:${w}x${h}:${color}`, w, h, (img) => {
    const rgb = hexToRgb(color);
    const width = Math.min(w, h) * 0.22;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const d = Math.abs(y - (h * 0.9 - (x / w) * h * 0.75)) / width;
        const density = (1 - d) * 0.55 * (0.5 + noise1(x / 9 + y / 13, 302));
        if (d < 1 && density > bayer(x, y)) setPixel(img, x, y, rgb);
      }
  });

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const hz = horizonOf(f);
  ctx.drawImage(ditherGradient(f.w, hz, [c.sky0, c.sky1, c.sky2]), 0, 0);
  ctx.drawImage(galaxy(f.w, hz, c.sky2), 0, 0);
  stars(ctx, f.w, hz, f.t, [c.star, c.sky2], Math.round((f.w * hz) / 260), 301, 0.9);
};

// A shooting star now and then: each slot of a few seconds may hold one streak, crossing in under a second.
const shootingStar = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const period = 3.2 - f.energy;
  const slot = Math.floor(f.t / period);
  const p = (f.t - slot * period) / 0.8;
  if (p >= 1 || rand(slot, 310) > 0.75) return;
  const hz = horizonOf(f);
  const travel = unitOf(f) * 0.4;
  const x = f.w * (0.3 + 0.7 * rand(slot, 311)) - p * travel;
  const y = hz * (0.08 + 0.35 * rand(slot, 312)) + p * travel * 0.45;
  const tail = 12 * (1 - Math.max(0, p - 0.6) * 2.2);
  pixelLine(ctx, x + tail, y - tail * 0.45, x, y, c.sky2);
  pixelLine(ctx, x + tail * 0.5, y - tail * 0.22, x, y, c.star);
  fillRect(ctx, c.flame3, Math.round(x), Math.round(y), 1, 1);
};

const paintTreeline = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const hz = horizonOf(f);
  const u = unitOf(f);
  for (let i = 0, x = -4; x < f.w + 6; i++, x += 4 + rand(i, 320) * 7) {
    pine(g, x, hz + 2, u * (0.08 + 0.1 * rand(i, 321)), c.hill, c.ground);
  }
  g.drawImage(ditherGradient(f.w, f.h - hz, [c.hill, c.ground, c.ground]), 0, hz);
};

// An A-frame tent; the half facing the fire is lit.
const paintTent = (g: Ctx, cx: number, base: number, size: number, faceRight: boolean, c: Colors<K>): void => {
  const half = Math.round(size * 0.5);
  const height = Math.round(size * 0.62);
  for (let r = 0; r < height; r++) {
    const span = Math.round(((r + 1) / height) * half);
    const y = base - height + r;
    fillRect(g, faceRight ? c.tent : c.tentLit, cx - span, y, span, 1);
    fillRect(g, faceRight ? c.tentLit : c.tent, cx, y, span + 1, 1);
  }
  const door = Math.round(height * 0.55);
  for (let r = 0; r < door; r++) {
    const span = Math.round(((r + 1) / door) * half * 0.38);
    fillRect(g, c.tentDark, cx - span, base - door + r, span * 2 + 1, 1);
  }
  fillRect(g, c.tentDark, cx, base - height - 2, 1, 3);
  pixelLine(g, cx - half, base, cx - half - Math.round(size * 0.12), base + 1, c.tentDark);
  pixelLine(g, cx + half, base, cx + half + Math.round(size * 0.12), base + 1, c.tentDark);
};

const paintCamp = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const u = unitOf(f);
  const fire = fireOf(f);
  const reach = Math.min(u * 0.36, f.w * 0.3);
  paintTent(g, fire.x - reach, fire.y - Math.round(u * 0.05), u * 0.3, true, c);
  paintTent(g, fire.x + reach * 1.05, fire.y - Math.round(u * 0.1), u * 0.24, false, c);
  // A log bench in front, lit on top, its cut ends showing rings.
  const benchY = fire.y + Math.round(u * 0.03);
  const benchX = fire.x + Math.round(u * 0.16);
  const benchW = Math.round(u * 0.2);
  fillRect(g, c.log, benchX, benchY, benchW, 4);
  fillRect(g, c.tentLit, benchX, benchY, benchW, 1);
  fillRect(g, c.tentDark, benchX, benchY + 4, benchW, 1);
  fillRect(g, c.groundLit, benchX - 1, benchY, 2, 4);
  fillRect(g, c.log, benchX - 1, benchY + 1, 1, 2);
};

const paintFrame = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const u = unitOf(f);
  pine(g, f.w * 0.02, f.h + 4, u * 0.7, c.tentDark);
  pine(g, f.w * 0.98, f.h + 6, u * 0.6, c.tentDark);
};

const backdrop = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(
    memoLayer(`cf-back:${f.w}x${f.h}:${colorKey(c)}`, f.w, f.h, (g) => paintTreeline(g, f, c)),
    0,
    0,
  );
};

const flicker = (f: Frame): number => 0.75 + 0.25 * noise1(f.t * 7, 330) + 0.3 * f.kick;

const camp = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const u = unitOf(f);
  const fire = fireOf(f);
  const level = Math.round(flicker(f) * 4) / 4;
  drawGlow(ctx, c.groundLit, fire.x, fire.y + 2, u * 0.5 + level * 4, u * 0.15 + level, 0.7, 4);
  ctx.drawImage(
    memoLayer(`cf-camp:${f.w}x${f.h}:${colorKey(c)}`, f.w, f.h, (g) => paintCamp(g, f, c)),
    0,
    0,
  );
  drawGlow(ctx, c.glow, fire.x, fire.y - u * 0.1, u * 0.15 + level * 2, u * 0.17 + level * 2, 0.22);
};

const hearth = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const u = unitOf(f);
  const fire = fireOf(f);
  const half = Math.round(u * 0.09);
  pixelLine(ctx, fire.x - half, fire.y + 1, fire.x + half, fire.y - 3, c.log);
  pixelLine(ctx, fire.x - half, fire.y, fire.x + half, fire.y - 4, c.log);
  pixelLine(ctx, fire.x + half, fire.y + 1, fire.x - half, fire.y - 3, c.log);
  pixelLine(ctx, fire.x + half, fire.y, fire.x - half, fire.y - 4, c.log);
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2 + 0.3;
    const x = Math.round(fire.x + Math.cos(a) * half * 1.25) - 1;
    const y = Math.round(fire.y + 1 + Math.sin(a) * half * 0.35);
    fillRect(ctx, c.stone, x, y, 3, 2);
    fillRect(ctx, c.groundLit, x, y, 2, 1);
  }
};

// One tongue of flame: rows narrowing toward the tip, wavering more the higher they are, hotter inside.
const tongue = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, base: number, width: number, height: number, i: number): void => {
  const layers = [c.flame0, c.flame1, c.flame2, c.flame3];
  for (let r = 0; r < height; r++) {
    const k = r / height;
    const sway = Math.sin(f.t * 9 + r * 0.45 + i * 2) * k * 2.2;
    const half = width * (1 - k) ** 0.75;
    for (let l = 0; l < 4; l++) {
      const w = half * (1 - l * 0.28);
      if (w < 0.5 || k > 1 - l * 0.22) break;
      fillRect(ctx, layers[l] as string, Math.round(x + sway - w), base - r, Math.round(w * 2) + 1, 1);
    }
  }
};

const flames = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const u = unitOf(f);
  const fire = fireOf(f);
  const height = u * 0.26 * (0.8 + 0.1 * f.energy) * flicker(f);
  const offsets = [-0.55, 0.5, -0.2, 0.22, 0];
  offsets.forEach((o, i) => {
    const tall = (i === 4 ? 1 : 0.55 + 0.25 * noise1(f.t * 5 + i * 9, 331)) * height;
    tongue(ctx, f, c, fire.x + o * u * 0.08, fire.y - 2, u * (i === 4 ? 0.065 : 0.04), Math.round(tall), i);
  });
};

// Embers rising from the fire and cooling from yellow to red as they climb.
const embers = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const u = unitOf(f);
  const fire = fireOf(f);
  const count = 14 + Math.round(f.energy * 10);
  for (let i = 0; i < count; i++) {
    const a = frac(f.t * (0.35 + 0.25 * rand(i, 340)) + rand(i, 341));
    if (a > 0.92) continue;
    const x = fire.x + (rand(i, 342) - 0.5) * u * 0.1 + Math.sin(f.t * 2.5 + i) * 4 * a;
    const y = fire.y - u * 0.08 - a * u * 0.45;
    fillRect(ctx, a < 0.3 ? c.flame2 : a < 0.6 ? c.flame1 : c.flame0, Math.round(x), Math.round(y), 1, 1);
  }
};

const foreground = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(
    memoLayer(`cf-front:${f.w}x${f.h}:${colorKey(c)}`, f.w, f.h, (g) => paintFrame(g, f, c)),
    0,
    0,
  );
};

export const campfireNight = defineScene<K>({
  id: 'campfire-night',
  title: 'Campfire Night',
  mood: { valence: 0.4, energy: -0.5 },
  styles: ['snowfall', 'credits-roll', 'cozy-village'],
  variants: [
    {
      mood: { valence: 0.5, energy: -0.4 },
      colors: {
        sky0: '#060a1e',
        sky1: '#101c40',
        sky2: '#26345e',
        star: '#e8ecff',
        hill: '#0c1630',
        ground: '#16261e',
        groundLit: '#6a4a2a',
        tent: '#34445e',
        tentLit: '#d27c3c',
        tentDark: '#080a14',
        log: '#5c3424',
        stone: '#50505e',
        flame0: '#d8402a',
        flame1: '#ff8a2a',
        flame2: '#ffd04a',
        flame3: '#fff6d2',
        glow: '#ff9a3a',
      },
    },
    {
      mood: { valence: 0.25, energy: -0.6 },
      colors: {
        sky0: '#0a0e26',
        sky1: '#1a2852',
        sky2: '#3a4c7c',
        star: '#f0f4ff',
        hill: '#1a2442',
        ground: '#8c9cc2',
        groundLit: '#e8b88c',
        tent: '#5a6a8c',
        tentLit: '#e88c4c',
        tentDark: '#141628',
        log: '#5c3424',
        stone: '#6a6a80',
        flame0: '#e0482a',
        flame1: '#ff922e',
        flame2: '#ffd650',
        flame3: '#fff8dc',
        glow: '#ffa040',
      },
    },
  ],
  layers: [sky, shootingStar, backdrop, camp, hearth, flames, embers, foreground],
});
