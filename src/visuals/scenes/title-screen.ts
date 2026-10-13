// The title screen of a game that never existed: a sword in a stone on a crag above a sea of clouds, the sun rising
// behind it, birds and thin clouds drifting by, a gold logo that a shine sweeps across, and PRESS START on the beat.
import { type Ctx, drawSprite, fillRect, type Palette, type Sprite } from 'mojipx';
import { bayer, ditherGradient, frac, hexToRgb, memoCanvas, noise1, rand, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { drawGlow, flock, wrap } from './batch-1-helpers.ts';
import { paletteOf, sigOf } from './batch-3-helpers.ts';
import { drawTextOutlined, forEachTextPixel, GLYPH_H, memoLayer, sunWithHalo, textWidth } from './batch-4-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sky3'
  | 'star'
  | 'sun'
  | 'glow'
  | 'cloud'
  | 'cloudLo'
  | 'haze'
  | 'rock'
  | 'rockLit'
  | 'steel'
  | 'steelHi'
  | 'gold'
  | 'goldHi'
  | 'goldLo'
  | 'ribbon'
  | 'ribbonLo'
  | 'ink'
  | 'text';

// Palette builders live at module level: palettes are cached per builder and color set.
const birdColors = (k: Colors<K>): Palette => ({ o: k.ink });
const hiltColors = (k: Colors<K>): Palette => ({ k: k.ink, G: k.goldHi, g: k.gold, d: k.goldLo, r: k.ribbon });

const LOGO = 'OATHSTONE';
const SUBTITLE = 'TALE OF THE FIRST DAWN';

type Layout = {
  readonly wide: boolean;
  /** The top of the far sea of clouds. */
  readonly horizon: number;
  readonly sunX: number;
  readonly sunY: number;
  readonly sunR: number;
  /** The middle of the crag's flat top, where the stone and the sword stand. */
  readonly peakX: number;
  readonly peakY: number;
  /** The centre line of the logo, the subtitle and the prompt. */
  readonly textX: number;
  readonly logoY: number;
  readonly scale: number;
  readonly pressY: number;
};

const layoutOf = (f: Frame): Layout => {
  const s = Math.min(f.w, f.h);
  if (f.w > f.h) {
    const horizon = Math.round(f.h * 0.6);
    const peakX = Math.round(f.w * 0.72);
    return {
      wide: true,
      horizon,
      sunX: peakX,
      sunY: horizon - 2,
      sunR: Math.round(s * 0.13),
      peakX,
      peakY: horizon - 8,
      textX: Math.round(f.w * 0.36),
      logoY: Math.round(f.h * 0.13),
      scale: f.w >= 300 ? 3 : 2,
      pressY: Math.round(f.h * 0.7),
    };
  }
  const horizon = Math.round(f.h * 0.52);
  return {
    wide: false,
    horizon,
    sunX: Math.round(f.w / 2),
    sunY: horizon - 2,
    sunR: Math.round(s * 0.15),
    peakX: Math.round(f.w / 2),
    peakY: horizon - 4,
    textX: Math.round(f.w / 2),
    logoY: Math.round(f.h * 0.14),
    scale: 2,
    pressY: Math.round(f.h * 0.8),
  };
};

// ---- sky ----

// Faint beams fanning out from the sun, every other wedge, thinning with distance.
const raysCanvas = (w: number, h: number, l: Layout, color: string): HTMLCanvasElement =>
  memoCanvas(`b4title-rays:${w}x${h}:${color}`, w, h, (img) => {
    const rgb = hexToRgb(color);
    const reach = Math.max(w, h) * 0.5;
    for (let y = 0; y < l.horizon; y++)
      for (let x = 0; x < w; x++) {
        const d = Math.hypot(x - l.sunX, y - l.sunY);
        const wedge = Math.floor((Math.atan2(y - l.sunY, x - l.sunX) + Math.PI) / (Math.PI / 18));
        if (wedge % 2 === 1 || d > reach || (1 - d / reach) ** 2 * 0.36 <= bayer(x, y)) continue;
        img.data.set([rgb[0], rgb[1], rgb[2], 255], (y * w + x) * 4);
      }
  });

// Two distant spires, pale with haze, rising out of the far deck.
const paintFarSpires = (g: Ctx, f: Frame, l: Layout, c: Colors<K>): void => {
  const spires = l.wide ? [0.1, 0.95] : [0.08, 0.93];
  g.fillStyle = c.haze;
  spires.forEach((at, i) => {
    const cx = f.w * at;
    const top = l.horizon - Math.min(f.w, f.h) * (0.16 - i * 0.05);
    for (let x = Math.floor(cx - 30); x < cx + 30; x++) {
      const y = Math.round(top + Math.max(0, Math.abs(x - cx) - 4) * 2.2 + (noise1(x / 4, i + 40) - 0.5) * 4);
      if (y < l.horizon + 4) g.fillRect(x, y, 1, l.horizon + 4 - y);
    }
  });
};

const paintSky = (g: Ctx, f: Frame, l: Layout, c: Colors<K>): void => {
  g.drawImage(ditherGradient(f.w, l.horizon + 6, [c.sky0, c.sky1, c.sky2, c.sky3]), 0, 0);
  fillRect(g, c.sky3, 0, l.horizon + 6, f.w, f.h);
  g.drawImage(raysCanvas(f.w, f.h, l, c.glow), 0, 0);
};

const paintSun = (g: Ctx, _f: Frame, l: Layout, c: Colors<K>): void => sunWithHalo(g, l.sunX, l.sunY, l.sunR, c.sun, c.glow);

const SKY_PAINTERS = [paintSky, paintSun, paintFarSpires] as const;

const skyLayer = (f: Frame, l: Layout, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`title-sky:${sigOf(c)}`, f.w, f.h, (g) => {
    for (const paint of SKY_PAINTERS) paint(g, f, l, c);
  });

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  ctx.drawImage(skyLayer(f, l, c), 0, 0);
  if (c.star !== c.sky0) stars(ctx, f.w, l.horizon, f.t, [c.star, c.sky2], 26, 61, 0.45);
};

// Long thin clouds lit from below by the low sun, drifting slowly.
const streaks = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  for (let i = 0; i < 7; i++) {
    const len = Math.round(26 + rand(i, 41) * 58);
    const span = f.w + len;
    const x = Math.round(wrap(rand(i, 42) * span + f.t * (1.2 + rand(i, 43) * 2.2), span) - len);
    const y = Math.round(l.horizon * (0.3 + rand(i, 44) * 0.56));
    fillRect(ctx, c.haze, x + 3, y, len - 8, 1);
    fillRect(ctx, c.haze, x, y + 1, len, 2);
    fillRect(ctx, c.cloud, x + 2, y + 3, len - 5, 1);
  }
};

const BIRD_UP: Sprite = ['o...o', '.o.o.', '..o..'];
const BIRD_DOWN: Sprite = ['.....', 'oo.oo', '..o..'];

const birds = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const palette = paletteOf(c, birdColors);
  flock(ctx, f, [BIRD_UP, BIRD_DOWN], palette, { count: 5, top: l.horizon * 0.42, span: l.horizon * 0.25, speed: -8, seed: 7 });
};

// ---- the sea of clouds: puffs in a repeating tile, each with its own lit top ----

/** One rounded billow of cloud: where its centre sits along the tile and below the top, and how big it is. */
type Puff = { readonly cx: number; readonly cy: number; readonly radius: number };

const puffsOf = (period: number, size: number, seed: number): readonly Puff[] => {
  const count = Math.max(3, Math.round(period / (size * 0.9)));
  return Array.from({ length: count }, (_, k) => ({
    cx: ((k + rand(k, seed) * 0.5) * period) / count,
    cy: size * (1 + rand(k, seed + 1) * 0.9),
    radius: size * (0.6 + rand(k, seed + 2) * 0.8),
  }));
};

// How far below the lit surface of the front-most puff the pixel lies, or null in the open sky.
const depthIn = (puffs: readonly Puff[], period: number, x: number, y: number, body: number): number | null => {
  for (let k = puffs.length - 1; k >= 0; k--) {
    const p = puffs[k] as Puff;
    const dx = Math.abs(wrap(x - p.cx + period / 2, period) - period / 2);
    if (dx * dx + (y - p.cy) ** 2 <= p.radius ** 2) return y - (p.cy - Math.sqrt(p.radius ** 2 - dx * dx));
  }
  return y >= body ? 99 : null;
};

type SeaColors = { readonly lit: string; readonly shade: string; readonly deep: string };

// Lit on top of every puff, shaded below, sinking into the deep tone toward the bottom of the band.
const shadeOf = (d: number, y: number, h: number, x: number, sc: SeaColors): string => {
  if (d < 2 || (d < 7 && (d - 2) / 5 < bayer(x, y))) return sc.lit;
  return y / h - 0.45 > bayer(x, y) * 0.5 ? sc.deep : sc.shade;
};

const seaTile = (period: number, h: number, size: number, seed: number, sc: SeaColors): HTMLCanvasElement =>
  memoCanvas(`b4title-sea:${period}x${h}:${size}:${seed}:${sc.lit}:${sc.shade}:${sc.deep}`, period, h, (img) => {
    const puffs = puffsOf(period, size, seed);
    const body = size * 1.6;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < period; x++) {
        const d = depthIn(puffs, period, x, y, body);
        if (d === null) continue;
        const rgb = hexToRgb(shadeOf(d, y, h, x, sc));
        img.data.set([rgb[0], rgb[1], rgb[2], 255], (y * period + x) * 4);
      }
  });

type Deck = { readonly at: number; readonly size: number; readonly period: number; readonly seed: number; readonly speed: number };

// Three decks of cloud, each lower one nearer: bigger puffs, faster drift.
const DECKS: readonly Deck[] = [
  { at: 0, size: 0.045, period: 192, seed: 5, speed: 1.2 },
  { at: 0.42, size: 0.07, period: 224, seed: 9, speed: 2.6 },
  { at: 0.7, size: 0.1, period: 256, seed: 13, speed: 4.5 },
];

const deck = (ctx: Ctx, f: Frame, d: Deck, sc: SeaColors): void => {
  const l = layoutOf(f);
  const size = Math.round(Math.min(f.w, f.h) * d.size);
  const top = Math.round(l.horizon + (f.h - l.horizon) * d.at) - size;
  const tile = seaTile(d.period, f.h - top, size, d.seed, sc);
  const start = -Math.round(wrap(f.t * d.speed, tile.width));
  for (let x = start; x < f.w; x += tile.width) ctx.drawImage(tile, x, top);
};

const farSea = (ctx: Ctx, f: Frame, c: Colors<K>): void => deck(ctx, f, DECKS[0] as Deck, { lit: c.cloud, shade: c.haze, deep: c.haze });
const midSea = (ctx: Ctx, f: Frame, c: Colors<K>): void => deck(ctx, f, DECKS[1] as Deck, { lit: c.cloud, shade: c.cloudLo, deep: c.haze });
const nearSea = (ctx: Ctx, f: Frame, c: Colors<K>): void =>
  deck(ctx, f, DECKS[2] as Deck, { lit: c.cloud, shade: c.cloudLo, deep: c.haze });

// ---- the crag, the stone and the sword ----

const PLATEAU = 20;

const cragTop = (x: number, l: Layout): number => {
  const dx = x - l.peakX;
  const run = Math.max(0, Math.abs(dx) - PLATEAU);
  const steep = l.wide ? (dx < 0 ? 3 : 2) : 2.8;
  // Steep near the top, broadening into a skirt lower down, with ragged ledges.
  const rise = run < 22 ? run * steep : 22 * steep + (run - 22) * steep * 0.55;
  const ledge = Math.floor(run / 7 + noise1(x / 11, 5) * 1.5) * 3;
  return l.peakY + rise + ledge + (noise1(x / 5, 3) - 0.5) * (run > 0 ? 9 : 1.2);
};

// A dark silhouette rimmed with light where it meets the sky, the glow fading a few pixels into the rock.
const paintCrag = (g: Ctx, f: Frame, l: Layout, c: Colors<K>): void => {
  const tops = Array.from({ length: f.w + 2 }, (_, i) => Math.round(cragTop(i - 1, l)));
  for (let x = 0; x < f.w; x++) {
    const y = tops[x + 1] as number;
    if (y >= f.h) continue;
    fillRect(g, c.rock, x, y, 1, f.h - y);
    const exposed = Math.min(f.h, Math.max(tops[x] as number, tops[x + 2] as number));
    fillRect(g, c.rockLit, x, y, 1, Math.max(1, exposed - y));
    for (let d = 1; d < 5; d++) if (bayer(x, y + d) < 0.5 - d * 0.11) fillRect(g, c.rockLit, x, y + d, 1, 1);
  }
  for (let k = 0; k < 14; k++) {
    const y0 = l.peakY + 10 + k * 8;
    for (let x = 0; x < f.w; x++)
      if ((tops[x + 1] as number) < y0 - 3 && noise1(x / 5, k + 20) > 0.56)
        fillRect(g, c.ink, x, y0 + Math.round(noise1(x / 9, k) * 3), 1, 1);
  }
};

const paintTufts = (g: Ctx, l: Layout, c: Colors<K>): void => {
  for (let x = l.peakX - PLATEAU - 3; x <= l.peakX + PLATEAU + 3; x++) {
    if (rand(x, 9) > 0.45) continue;
    const top = Math.round(cragTop(x, l));
    const h = 1 + Math.floor(rand(x, 10) * 3);
    fillRect(g, c.rock, x, top - h, 1, h);
    fillRect(g, c.rockLit, x, top - h, 1, 1);
  }
};

const stoneTopOf = (l: Layout): number => l.peakY - 12;
const BLADE = 26;

const paintStone = (g: Ctx, l: Layout, c: Colors<K>): void => {
  const cy = l.peakY - 5;
  for (let dy = -7; dy <= 5; dy++) {
    const half = Math.round(15 * Math.sqrt(1 - (Math.min(dy, 2) / 8) ** 2));
    fillRect(g, c.rock, l.peakX - half, cy + dy, half * 2 + 1, 1);
    fillRect(g, c.rockLit, l.peakX - half, cy + dy, 1, 1);
    fillRect(g, c.rockLit, l.peakX + half, cy + dy, 1, 1);
  }
  fillRect(g, c.rockLit, l.peakX - 10, cy - 7, 21, 1);
  fillRect(g, c.ink, l.peakX + 5, cy - 4, 1, 3);
  fillRect(g, c.ink, l.peakX + 6, cy - 1, 2, 1);
  fillRect(g, c.ink, l.peakX - 9, cy + 1, 4, 1);
  fillRect(g, c.ink, l.peakX - 5, cy + 2, 1, 2);
};

// k ink, G bright gold, g gold, d dark gold, r the gem.
const HILT: Sprite = [
  '........kkk........',
  '.......kGgdk.......',
  '.......kgrdk.......',
  '.......kkkkk.......',
  '.......kGddk.......',
  '.......kdGdk.......',
  '.......kddGk.......',
  '.......kGddk.......',
  '.......kdGdk.......',
  '.......kkkkk.......',
  'kk...............kk',
  'kGkkkkkkkkkkkkkkkGk',
  'kGGGGGGGGrGGGGGGGGk',
  'kdgggggggggggggggdk',
  '.kkkkkkkkkkkkkkkkk.',
];

const paintSword = (g: Ctx, l: Layout, c: Colors<K>): void => {
  const x = l.peakX;
  const bottom = stoneTopOf(l) + 3;
  const top = bottom - BLADE;
  fillRect(g, c.ink, x - 2, top, 5, BLADE);
  fillRect(g, c.steel, x - 1, top, 3, BLADE - 1);
  fillRect(g, c.steelHi, x, top + 1, 1, BLADE - 4);
  const palette = paletteOf(c, hiltColors);
  drawSprite(g, HILT, palette, x - 9, top - HILT.length);
};

const cragLayer = (f: Frame, l: Layout, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`title-crag:${sigOf(c)}`, f.w, f.h, (g) => {
    paintCrag(g, f, l, c);
    paintTufts(g, l, c);
    paintStone(g, l, c);
    paintSword(g, l, c);
  });

const guardYOf = (l: Layout): number => stoneTopOf(l) + 3 - BLADE - 3;

const swordGlow = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const pulse = 0.35 + 0.25 * (1 - frac(f.beat)) ** 2 + f.kick * 0.15;
  drawGlow(ctx, c.glow, l.peakX, guardYOf(l), 20, 20, Math.round(pulse * 8) / 8, 4);
};

const crag = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(cragLayer(f, layoutOf(f), c), 0, 0);
};

// A cloth tied below the guard streams out in the wind.
const ribbon = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const x0 = l.peakX + 3;
  const y0 = guardYOf(l) + 3;
  for (let k = 0; k < 22; k++) {
    const phase = f.t * 5 - k * 0.45;
    const y = Math.round(y0 + k * 0.35 + Math.sin(phase) * (k / 22) * 3.5);
    fillRect(ctx, c.ink, x0 + k, y - 1, 1, k > 18 ? 3 : 4);
    fillRect(ctx, Math.cos(phase) > 0 ? c.ribbon : c.ribbonLo, x0 + k, y, 1, k > 18 ? 1 : 2);
  }
};

// A glint runs down the blade every two beats, and motes of light rise around the sword.
const glint = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const p = frac(f.beat / 2);
  if (p >= 0.5) return;
  const y = Math.round(guardYOf(l) + 5 + p * 2 * (BLADE - 6));
  const r = p < 0.1 || p > 0.4 ? 2 : 3;
  fillRect(ctx, c.text, l.peakX - r, y, r * 2 + 1, 1);
  fillRect(ctx, c.text, l.peakX, y - r, 1, r * 2 + 1);
};

// Motes of light drift up around the sword, flickering as they fade.
const MOTES = Array.from({ length: 14 }, (_, i) => ({ seed: rand(i, 71), dx: (rand(i, 72) - 0.5) * 60, bright: i % 3 === 0 }));

const motes = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  MOTES.forEach((m, i) => {
    const age = frac(f.t * 0.12 + m.seed);
    const fading = age > 0.85 && (i + Math.floor(f.t * 6)) % 2 === 1;
    const x = Math.round(l.peakX + m.dx + Math.sin(f.t * 1.3 + i) * 3);
    if (!fading) fillRect(ctx, m.bright ? c.text : c.goldHi, x, Math.round(stoneTopOf(l) + 8 - age * 70), 1, 1);
  });
};

// ---- the logo ----

// The logo's size: the letters, their extrusion (as deep as one block) and the outline.
const logoGeomOf = (scale: number): { readonly w: number; readonly h: number } => ({
  w: textWidth(LOGO) * scale + scale + 2,
  h: GLYPH_H * scale + scale + 2,
});

// Gold face shading from bright at the top of the letters to deep at the bottom, ordered-dithered.
const faceColor = (y: number, x: number, height: number, c: Colors<K>): string => {
  const t = y / height + (bayer(x, y) - 0.5) * 0.18;
  return t < 0.32 ? c.goldHi : t < 0.68 ? c.gold : c.goldLo;
};

const LOGO_PIXELS: readonly (readonly [number, number])[] = (() => {
  const pixels: [number, number][] = [];
  forEachTextPixel(LOGO, (x, y) => pixels.push([x, y]));
  return pixels;
})();
const LOGO_SET = new Set(LOGO_PIXELS.map(([x, y]) => `${x},${y}`));

const DIAGONALS = [
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
] as const;
const SIDES = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;

// Each font pixel becomes a scale×scale block, extruded down-right in crimson and outlined in ink.
const paintRelief = (g: Ctx, scale: number, c: Colors<K>): void => {
  const block = (x: number, y: number, dx: number, dy: number, color: string): void =>
    fillRect(g, color, 1 + x * scale + dx, 1 + y * scale + dy, scale, scale);
  for (const [x, y] of LOGO_PIXELS) {
    for (const [dx, dy] of DIAGONALS) block(x, y, dx + scale, dy + scale, c.ink);
    for (const [dx, dy] of SIDES) block(x, y, dx, dy, c.ink);
  }
  for (let d = scale; d >= 1; d--) for (const [x, y] of LOGO_PIXELS) block(x, y, d, d, d === scale ? c.ribbonLo : c.ribbon);
};

// The face: gold with a white top edge, or plain white for the mask the shine is cut from.
const paintFace = (g: Ctx, scale: number, c: Colors<K>, gold: boolean): void => {
  for (const [x, y] of LOGO_PIXELS)
    for (let py = 0; py < scale; py++)
      for (let px = 0; px < scale; px++) {
        const sx = 1 + x * scale + px;
        const sy = 1 + y * scale + py;
        const edge = py === 0 && !LOGO_SET.has(`${x},${y - 1}`);
        fillRect(g, gold && !edge ? faceColor(sy, sx, GLYPH_H * scale, c) : c.text, sx, sy, 1, 1);
      }
};

const logoLayer = (scale: number, c: Colors<K>, gold: boolean): HTMLCanvasElement => {
  const geom = logoGeomOf(scale);
  return memoLayer(`title-logo:${scale}:${gold}:${sigOf(c)}`, geom.w, geom.h, (g) => {
    if (gold) paintRelief(g, scale, c);
    paintFace(g, scale, c, gold);
  });
};

// Every eight beats a bright diagonal band sweeps across the letters.
const shine = (ctx: Ctx, f: Frame, c: Colors<K>, x0: number, y0: number, scale: number): void => {
  const p = frac(f.beat / 8) * 4;
  if (p >= 1) return;
  const mask = logoLayer(scale, c, false);
  const band = 3 + scale;
  const x = Math.round(-mask.height + p * (mask.width + mask.height * 2));
  for (let y = 0; y < mask.height; y++) {
    const sx = x + Math.round((mask.height - y) * 0.6);
    const a = Math.max(0, sx);
    const b = Math.min(mask.width, sx + band);
    if (b > a) ctx.drawImage(mask, a, y, b - a, 1, x0 + a, y0 + y, b - a, 1);
  }
};

const logo = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const layer = logoLayer(l.scale, c, true);
  const x0 = Math.round(l.textX - layer.width / 2);
  ctx.drawImage(layer, x0, l.logoY);
  shine(ctx, f, c, x0, l.logoY, l.scale);
  const subY = l.logoY + layer.height + 5;
  drawTextOutlined(ctx, SUBTITLE, Math.round(l.textX - textWidth(SUBTITLE) / 2), subY, c.goldHi, c.ink);
};

const prompt = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  if (frac(f.beat) < 0.62) {
    const text = 'PRESS START';
    drawTextOutlined(ctx, text, Math.round(l.textX - textWidth(text) / 2), l.pressY, c.text, c.ink);
  }
  const year = '© 1996';
  drawTextOutlined(ctx, year, Math.round(l.textX - textWidth(year) / 2), f.h - 12, c.cloud, c.ink);
};

export const titleScreen = defineScene<K>({
  id: 'title-screen',
  title: 'Title Screen',
  mood: { valence: 0.1, energy: 0.2 },
  styles: ['pixel-quest', 'grand-field', 'credits-roll', 'celtic-isle'],
  variants: [
    {
      mood: { valence: 0.1, energy: 0.2 },
      colors: {
        sky0: '#1b1d4f',
        sky1: '#4b2f78',
        sky2: '#c25a83',
        sky3: '#ffb27a',
        star: '#fff6e0',
        sun: '#fff3c2',
        glow: '#ffd27a',
        cloud: '#ffe0b8',
        cloudLo: '#c97a8f',
        haze: '#8a5a8f',
        rock: '#241a33',
        rockLit: '#ff9f6a',
        steel: '#a7b4d6',
        steelHi: '#f4f7ff',
        gold: '#f2b23e',
        goldHi: '#ffe9a0',
        goldLo: '#b8682a',
        ribbon: '#d8344f',
        ribbonLo: '#8c1c3c',
        ink: '#140d24',
        text: '#ffffff',
      },
    },
    {
      mood: { valence: 0.55, energy: 0.45 },
      colors: {
        sky0: '#2a64c8',
        sky1: '#4d94e6',
        sky2: '#8cc6f2',
        sky3: '#d8f0ff',
        star: '#2a64c8',
        sun: '#ffffff',
        glow: '#fff6c8',
        cloud: '#ffffff',
        cloudLo: '#b8d4ee',
        haze: '#94b8e0',
        rock: '#33405a',
        rockLit: '#e8f4ff',
        steel: '#c4d0e8',
        steelHi: '#ffffff',
        gold: '#f5c242',
        goldHi: '#fff2b0',
        goldLo: '#c07a28',
        ribbon: '#e0384a',
        ribbonLo: '#962440',
        ink: '#18203a',
        text: '#ffffff',
      },
    },
    {
      mood: { valence: -0.35, energy: -0.2 },
      colors: {
        sky0: '#060a1c',
        sky1: '#101d45',
        sky2: '#22357a',
        sky3: '#4a5fa8',
        star: '#e8f0ff',
        sun: '#f4f4e0',
        glow: '#8fb0ff',
        cloud: '#b8c8f0',
        cloudLo: '#4a5a9a',
        haze: '#2c3a74',
        rock: '#0a0e1e',
        rockLit: '#8fb0ff',
        steel: '#8ea0d0',
        steelHi: '#e8f0ff',
        gold: '#d8a640',
        goldHi: '#fff0b8',
        goldLo: '#94602c',
        ribbon: '#c43a5c',
        ribbonLo: '#7a1e44',
        ink: '#04060f',
        text: '#ffffff',
      },
    },
  ],
  layers: [sky, streaks, birds, farSea, swordGlow, crag, ribbon, glint, motes, midSea, nearSea, logo, prompt],
});
