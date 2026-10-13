// A walk through a tunnel of vermilion torii gates: one gate passes overhead every two beats, sunlight dapples
// the stone path, and in the clearings between stretches stone foxes and lanterns keep watch.
import { type Ctx, canvasOf, fillRect, flipped, type Palette, type Sprite } from 'mojipx';
import { bayer, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { colorKey, drawGlow, fillDither, paletteBy, wrap } from './batch-1-helpers.ts';
import { isDark, isWide, mixHex, noise2, pixelLayer, STONE_LANTERN } from './batch-5-helpers.ts';

type K =
  | 'canopy0'
  | 'canopy1'
  | 'canopy2'
  | 'exit'
  | 'fog'
  | 'verm'
  | 'vermLit'
  | 'vermShade'
  | 'vermDark'
  | 'black'
  | 'blackHi'
  | 'path'
  | 'pathShade'
  | 'gravel'
  | 'moss'
  | 'stoneHi'
  | 'stone'
  | 'stoneShade'
  | 'stoneDark'
  | 'bib'
  | 'lamp'
  | 'spot';

// World units: x across the path, y up from the ground, z ahead of the walker.
const GX = 1.25;
const PW = 0.22;
const PD = 0.22;
const TOP = 3;
const NEMAKI = 0.32;
const DZ = 0.8;
const EYE = 1.45;
const PATH = 0.7;
const SLOTS = 12;
const NEAR = 0.4;
const FAR = 19;
const FOGGED = 7;

type Beam = { readonly y: number; readonly h: number; readonly x: number };
const NUKI: Beam = { y: 2.35, h: 0.2, x: 1.85 };
const SHIMAKI: Beam = { y: 3, h: 0.14, x: 1.85 };
const KASAGI: Beam = { y: 3.14, h: 0.22, x: 2.25 };
const SORI = 0.22;

type View = {
  readonly cx: number;
  readonly hy: number;
  readonly F: number;
  readonly eye: number;
  readonly w: number;
  readonly h: number;
  readonly cam: number;
};

// The walker advances one gate every two beats and dips a little on each step.
const viewOf = (f: Frame): View => ({
  cx: Math.round(f.w / 2),
  hy: Math.round(f.h * (isWide(f) ? 0.5 : 0.52)),
  F: Math.round(Math.max(f.w * 0.42, f.h * 0.36)),
  eye: EYE + Math.abs(Math.sin(f.beat * Math.PI)) * 0.035,
  w: f.w,
  h: f.h,
  cam: (f.beat * DZ) / 2,
});

const sx = (v: View, x: number, z: number): number => v.cx + (x * v.F) / z;
const sy = (v: View, y: number, z: number): number => v.hy - ((y - v.eye) * v.F) / z;

const box = (ctx: Ctx, color: string, x0: number, y0: number, x1: number, y1: number): void => {
  const l = Math.round(Math.min(x0, x1));
  const t = Math.round(Math.min(y0, y1));
  const r = Math.round(Math.max(x0, x1));
  const b = Math.round(Math.max(y0, y1));
  if (r > l && b > t) fillRect(ctx, color, l, t, r - l, b - t);
};

const night = (c: Colors<K>): boolean => isDark(c.canopy1);

// Distance fades every color toward the haze in a few steps, like the palette fades of old hardware.
const FADES = [0, 0.2, 0.4, 0.58, 0.74] as const;
const fades = new WeakMap<Colors<K>, readonly Colors<K>[]>();

const fadedSet = (c: Colors<K>, k: number): Colors<K> =>
  k === 0 ? c : (Object.fromEntries(Object.entries(c).map(([key, hex]) => [key, mixHex(hex as string, c.fog, k)])) as Colors<K>);

const toneAt = (c: Colors<K>, z: number): Colors<K> => {
  const sets = fades.get(c) ?? FADES.map((k) => fadedSet(c, k));
  fades.set(c, sets);
  const step = z < 4 ? 0 : z < 6.5 ? 1 : z < 9.5 ? 2 : z < 13 ? 3 : 4;
  return sets[step] ?? c;
};

// ---- the gates ----

// The face of a pillar that looks onto the path, receding from z to z + PD; a sunny gate has dappled light on it.
type Light = 'sun' | 'lamp' | null;

// Light on one column of an inner face: a dappled patch of sun high up, or lamplight pooling near the foot.
const facePatch = (ctx: Ctx, v: View, c: Colors<K>, x: number, zz: number, light: Light): void => {
  if (light === 'lamp') {
    const top = sy(v, 1.1, zz);
    fillDither(ctx, c.vermLit, 0.4, x, top, 1, sy(v, NEMAKI, zz) - top);
    return;
  }
  const top = sy(v, 2.05, zz);
  fillDither(ctx, c.vermLit, 0.5, x, top, 1, sy(v, 1.2, zz) - top);
};

const innerFace = (ctx: Ctx, v: View, c: Colors<K>, z: number, side: number, light: Light): void => {
  const a = sx(v, side * GX, z);
  const b = sx(v, side * GX, z + PD);
  const to = Math.min(v.w, Math.round(Math.max(a, b)));
  for (let x = Math.max(0, Math.round(Math.min(a, b))); x < to; x++) {
    const zz = (GX * v.F) / Math.max(0.5, Math.abs(x + 0.5 - v.cx));
    box(ctx, c.vermShade, x, sy(v, TOP, zz), x + 1, sy(v, NEMAKI, zz));
    box(ctx, c.black, x, sy(v, NEMAKI, zz), x + 1, sy(v, 0, zz));
    if (light) facePatch(ctx, v, c, x, zz, light);
  }
};

const pillar = (ctx: Ctx, v: View, c: Colors<K>, z: number, side: number): void => {
  const inner = sx(v, side * GX, z);
  const outer = sx(v, side * (GX + PW), z);
  box(ctx, c.verm, inner, sy(v, TOP, z), outer, sy(v, NEMAKI, z));
  box(ctx, c.black, inner, sy(v, NEMAKI, z), outer, sy(v, 0, z));
  const edge = Math.round(inner) - (side < 0 ? 1 : 0);
  box(ctx, c.vermLit, edge, sy(v, TOP, z), edge + 1, sy(v, NEMAKI, z));
};

// A beam seen from below: its underside recedes toward the horizon, then its front face.
const beam = (ctx: Ctx, v: View, z: number, b: Beam, face: string, under: string): void => {
  box(ctx, under, sx(v, -b.x, z + PD), sy(v, b.y, z), sx(v, b.x, z + PD), sy(v, b.y, z + PD));
  box(ctx, face, sx(v, -b.x, z), sy(v, b.y + b.h, z), sx(v, b.x, z), sy(v, b.y, z));
};

// The black top beam: straight between the pillars, sweeping upward toward its tips.
const kasagi = (ctx: Ctx, v: View, c: Colors<K>, z: number): void => {
  const inner = GX + PW;
  beam(ctx, v, z, { ...KASAGI, x: inner }, c.black, c.black);
  for (const side of [-1, 1]) {
    const a = sx(v, side * inner, z);
    const b = sx(v, side * KASAGI.x, z);
    const to = Math.min(v.w, Math.round(Math.max(a, b)));
    for (let x = Math.max(0, Math.round(Math.min(a, b))); x < to; x++) {
      const u = (Math.abs(((x + 0.5 - v.cx) * z) / v.F) - inner) / (KASAGI.x - inner);
      const rise = SORI * u * u;
      box(ctx, c.black, x, sy(v, KASAGI.y + KASAGI.h + rise, z), x + 1, sy(v, KASAGI.y + rise * 0.6, z));
    }
  }
  box(ctx, c.blackHi, sx(v, -inner, z), sy(v, KASAGI.y + KASAGI.h, z), sx(v, inner, z), sy(v, KASAGI.y + KASAGI.h, z) + 1);
};

const gate = (ctx: Ctx, v: View, c: Colors<K>, z: number, left: Light, right: Light): void => {
  innerFace(ctx, v, c, z, -1, left);
  innerFace(ctx, v, c, z, 1, right);
  pillar(ctx, v, c, z, -1);
  pillar(ctx, v, c, z, 1);
  beam(ctx, v, z, NUKI, c.verm, c.vermDark);
  beam(ctx, v, z, SHIMAKI, c.verm, c.vermDark);
  kasagi(ctx, v, c, z);
};

// ---- the clearings: a pair of stone foxes on pedestals and a pair of lanterns ----

// o outline, h light stone, s stone, d shade, r red bib. Sitting, facing the path, tail curled up behind.
const FOX: Sprite = [
  '.o.......o.....',
  '.oo.....oo.....',
  '.oho...odo.....',
  '.ohsooosdo.....',
  'ohsssssssdo....',
  'ohsosssosdo....',
  'ohssssssddo....',
  '.ohsssssdo.....',
  '..ohsosdo......',
  '...orrro.......',
  '..orrrrro......',
  '.ohrrrrrdo..oo.',
  '.ohsrrrsdo.ohdo',
  'ohsssrsssdoohdo',
  'ohssssssssdohdo',
  'ohssssssssddhdo',
  'ohsoossoossddo.',
  'ohsoossoossdo..',
  'ooooooooooooo..',
];
const FOX_LEFT = flipped(FOX);

const stonePalette = paletteBy<K>((c) => ({ o: c.stoneDark, h: c.stoneHi, s: c.stone, d: c.stoneShade, r: c.bib, L: c.lamp }));

// A sprite standing at (x, y) in the world, scaled with distance the way old hardware scaled sprites.
const standee = (ctx: Ctx, v: View, sprite: Sprite, palette: Palette, at: { x: number; y: number; z: number; tall: number }): void => {
  const img = canvasOf(sprite, palette);
  const h = (at.tall * v.F) / at.z;
  const w = (img.width * h) / img.height;
  const x = Math.round(sx(v, at.x, at.z) - w / 2);
  const y = Math.round(sy(v, at.y, at.z) - h);
  ctx.drawImage(img, x, y, Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
};

const pedestal = (ctx: Ctx, v: View, c: Colors<K>, x: number, z: number): void => {
  box(ctx, c.stone, sx(v, x - 0.26, z), sy(v, 0.55, z), sx(v, x + 0.26, z), sy(v, 0, z));
  box(ctx, c.stoneShade, sx(v, x + 0.12, z), sy(v, 0.55, z), sx(v, x + 0.26, z), sy(v, 0, z));
  box(ctx, c.stoneHi, sx(v, x - 0.3, z), sy(v, 0.6, z), sx(v, x + 0.3, z), sy(v, 0.53, z));
};

// Glows come in a few fixed sizes so their cached images stay few.
const glowSize = (r: number): number => [6, 10, 16, 24, 34].find((s) => s >= r) ?? 34;

// `c` is the scene's colors (glows need them as they are), `t` the same colors faded for the distance.
const clearing = (ctx: Ctx, v: View, c: Colors<K>, t: Colors<K>, z: number): void => {
  for (const side of [-1, 1]) {
    lantern(ctx, v, c, t, { x: side * 1.65, y: 0, z, tall: 1.9 });
    pedestal(ctx, v, t, side * 0.98, z);
    standee(ctx, v, side < 0 ? FOX_LEFT : FOX, stonePalette(t), { x: side * 0.98, y: 0.55, z, tall: 0.8 });
  }
};

// A stone lantern; after dark its glow spreads behind it first.
const lantern = (ctx: Ctx, v: View, c: Colors<K>, t: Colors<K>, at: { x: number; y: number; z: number; tall: number }): void => {
  if (night(c)) {
    const r = glowSize((at.tall * 0.55 * v.F) / at.z);
    drawGlow(ctx, c.lamp, sx(v, at.x, at.z), sy(v, at.tall * 0.62, at.z), r, Math.round(r * 0.8), 0.4);
  }
  standee(ctx, v, STONE_LANTERN, stonePalette(t), at);
};

// By day a gate may catch a patch of sun on one side; after dark lamplight pools at the foot of every pillar.
const lightOf = (c: Colors<K>, n: number, side: number): Light => {
  if (night(c)) return 'lamp';
  return rand(n, 3) < 0.45 && (rand(n, 4) < 0.5 ? -1 : 1) === side ? 'sun' : null;
};

// Every SLOTS gates the tunnel opens for a few paces: a clearing sits in the middle of the gap.
const slots = (ctx: Ctx, v: View, c: Colors<K>, near: number, far: number): void => {
  const first = Math.floor((v.cam + far) / DZ);
  const last = Math.ceil((v.cam + near) / DZ);
  for (let n = first; n >= last; n--) {
    const z = n * DZ - v.cam;
    const k = wrap(n, SLOTS);
    const t = toneAt(c, z);
    if (k < SLOTS - 4 && k % 3 === 1) lantern(ctx, v, c, t, { x: (k % 2 === 0 ? -1 : 1) * 1.08, y: 0, z: z + DZ / 2, tall: 0.8 });
    if (k < SLOTS - 3) gate(ctx, v, t, z, lightOf(c, n, -1), lightOf(c, n, 1));
    else if (k === SLOTS - 2) clearing(ctx, v, c, t, z);
  }
};

// ---- the forest, the path and the light ----

const foliage = (v: View, c: Colors<K>, x: number, y: number): string => {
  const trunk = noise2(x / 5, 0.5, 41) > 0.78 && y > v.hy * 0.35;
  if (trunk) return c.canopy0;
  const leaves = noise2(x / 7, y / 6, 42) * 0.65 + noise2(x / 2.5, y / 2.5, 43) * 0.35;
  const light = leaves + (1 - y / v.hy) * 0.35 + (bayer(x, y) - 0.5) * 0.18;
  if (light > 0.98) return c.fog;
  if (light > 0.78) return c.canopy2;
  return light > 0.52 ? c.canopy1 : c.canopy0;
};

// Outside the corridor the forest runs down to the ground as dark undergrowth.
const undergrowth = (c: Colors<K>, x: number, y: number): string => {
  const leaves = noise2(x / 4, y / 3, 45) + (bayer(x, y) - 0.5) * 0.15;
  if (leaves > 0.66) return c.canopy1;
  return leaves > 0.42 ? c.moss : c.canopy0;
};

const groundAt = (v: View, c: Colors<K>, x: number, y: number): string => {
  const z = (EYE * v.F) / (y - v.hy + 0.5);
  const across = (Math.abs(x + 0.5 - v.cx) * z) / v.F;
  if (across > GX + PW + 0.15) return undergrowth(c, x, y);
  if ((z - FOGGED) / 9 > bayer(x, y)) return c.fog;
  if (across < PATH) return c.path;
  return rand(x * 31 + y * 17, 9) < 0.3 ? c.pathShade : c.gravel;
};

const backdropPick = (v: View, c: Colors<K>) => {
  return (x: number, y: number): string => {
    const r = Math.hypot(x - v.cx, (y - v.hy) * 1.3) / v.F;
    if (r < 0.05) return c.exit;
    if (r < 0.15 && (0.15 - r) / 0.1 > bayer(x, y)) return c.fog;
    return y < v.hy ? foliage(v, c, x, y) : groundAt(v, c, x, y);
  };
};

const backdrop = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const v = viewOf(f);
  ctx.drawImage(pixelLayer(`torii-bg:${colorKey(c)}:${v.hy}:${v.F}`, f.w, f.h, backdropPick(v, c)), 0, 0);
};

// Joints between the paving stones stream toward the walker.
const paving = (ctx: Ctx, v: View, c: Colors<K>): void => {
  const step = 0.42;
  for (let j = Math.ceil((v.cam + NEAR) / step); j * step - v.cam < FOGGED; j++) {
    const z = j * step - v.cam;
    const half = (PATH * v.F) / z;
    const y = Math.round(sy(v, 0, z));
    box(ctx, c.pathShade, v.cx - half, y, v.cx + half, y + 1);
    const seam = sx(v, j % 2 === 0 ? -0.22 : 0.26, z);
    box(ctx, c.pathShade, seam, y, seam + 1, sy(v, 0, z - step));
  }
};

// Sunlight through the leaves: soft patches on the path that shimmer as the canopy sways.
const sunSpots = (ctx: Ctx, f: Frame, v: View, c: Colors<K>): void => {
  const pitch = 0.45;
  for (let i = Math.floor(v.cam / pitch); i * pitch - v.cam < FOGGED; i++) {
    const z = i * pitch + rand(i, 51) * 0.5 - v.cam;
    if (z < NEAR) continue;
    const w = ((0.1 + rand(i, 52) * 0.18) * v.F) / z;
    const h = Math.max(1, w * 0.3);
    const x = sx(v, (rand(i, 53) - 0.5) * 2.2, z);
    const y = sy(v, 0, z);
    const level = 0.4 + 0.3 * Math.sin(f.t * 1.6 + i * 2.1);
    for (let k = -Math.floor(h); k <= Math.floor(h); k++) {
      const half = w * Math.sqrt(1 - (k / (h + 1)) ** 2);
      fillDither(ctx, c.spot, level * 0.6, x - half, y + k, half * 2, 1);
      fillDither(ctx, c.spot, level + 0.2, x - half * 0.55, y + k, half * 1.1, 1);
    }
  }
};

const ground = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const v = viewOf(f);
  paving(ctx, v, c);
  if (!night(c)) sunSpots(ctx, f, v, c);
};

const gates = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const v = viewOf(f);
  slots(ctx, v, c, FOGGED, FAR);
  drawGlow(ctx, c.fog, v.cx, v.hy, Math.round(v.F * 0.16), Math.round(v.F * 0.13), 0.7);
  drawGlow(ctx, c.exit, v.cx, v.hy, Math.round(v.F * 0.07), Math.round(v.F * 0.06), 1);
  slots(ctx, v, c, NEAR, FOGGED);
};

// Dust drifting through the light by day, fireflies blinking by night.
const motes = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const dark = night(c);
  for (let i = 0; i < 18; i++) {
    if (dark && Math.sin(f.t * 2.2 + i * 1.7) < 0.3) continue;
    const x = wrap(rand(i, 61) * f.w + Math.sin(f.t * 0.6 + i) * 8 + f.t * 2, f.w);
    const y = wrap(rand(i, 62) * f.h + f.t * (dark ? -3 : 4) * (0.5 + rand(i, 63)), f.h);
    fillRect(ctx, c.spot, Math.round(x), Math.round(y), 1, 1);
  }
};

export const toriiTunnel = defineScene<K>({
  id: 'torii-tunnel',
  title: 'Thousand Gates',
  mood: { valence: 0, energy: -0.1 },
  styles: ['lofi-loop', 'starlit-dream', 'pixel-quest'],
  variants: [
    {
      mood: { valence: 0.3, energy: 0.1 },
      colors: {
        canopy0: '#15301e',
        canopy1: '#2f6034',
        canopy2: '#64984a',
        exit: '#fff7dc',
        fog: '#f0dca6',
        verm: '#e9482a',
        vermLit: '#ff8e54',
        vermShade: '#b63220',
        vermDark: '#7a1e14',
        black: '#2a1816',
        blackHi: '#5c3a30',
        path: '#c4baa6',
        pathShade: '#8e8472',
        gravel: '#837862',
        moss: '#3f5c30',
        stoneHi: '#d2cec2',
        stone: '#a8a496',
        stoneShade: '#77736a',
        stoneDark: '#45423c',
        bib: '#d8342a',
        lamp: '#8e8a80',
        spot: '#ffe9a8',
      },
    },
    {
      mood: { valence: -0.35, energy: -0.35 },
      colors: {
        canopy0: '#0b0e20',
        canopy1: '#171d3c',
        canopy2: '#2c3864',
        exit: '#ffd896',
        fog: '#5e4466',
        verm: '#a8322a',
        vermLit: '#f08048',
        vermShade: '#6c1e1c',
        vermDark: '#3c1016',
        black: '#140c12',
        blackHi: '#3a2426',
        path: '#6c6272',
        pathShade: '#463e50',
        gravel: '#3c3444',
        moss: '#1a2632',
        stoneHi: '#a49cae',
        stone: '#7a7286',
        stoneShade: '#524c5e',
        stoneDark: '#2a2634',
        bib: '#d0342c',
        lamp: '#ffd27a',
        spot: '#ffd98a',
      },
    },
  ],
  layers: [backdrop, ground, gates, motes],
});
