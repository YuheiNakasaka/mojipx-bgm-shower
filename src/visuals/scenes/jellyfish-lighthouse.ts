// A lighthouse keeper on the night rocks, lantern in hand, watching her lighthouse: its lamp is a giant glowing
// jellyfish that pulses on the beat while its beam sweeps the sea, and little jellyfish rise from the waves like lanterns.
import { type Ctx, drawSprite, fillRect, type Palette, type Sprite } from 'mojipx';
import { ditherGradient, frac, noise1, pixelLine, rand, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { colorKey, fillDither } from './batch-1-helpers.ts';
import { drawGlow, memoLayer, moon, paletteOf, tileX, wrap } from './batch-2-helpers.ts';
import { shine } from './batch-5-helpers.ts';
import { rain } from './batch-6-helpers.ts';
import { alternate, drawGirl, type Girl, onBeat, wide } from './batch-7-helpers.ts';
import { drawJelly, type JellyColors } from './batch-11-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'star'
  | 'moon'
  | 'haze'
  | 'rock'
  | 'ink'
  | 'pale'
  | 'paleLo'
  | 'band'
  | 'jelly'
  | 'jellyLo'
  | 'skin'
  | 'skinLo'
  | 'blush'
  | 'hair'
  | 'hairHi'
  | 'hairLo'
  | 'coat'
  | 'coatLo'
  | 'dress'
  | 'lamp'
  | 'brass'
  | 'rain';

// ---- the keeper: o outline, s/S skin, b blush, m mouth, h/H/d hair, e/E eyes, w glint,
// q/Q knit scarf (lit ribbing), Y/y/z/Z duffle coat (moonlit edge, cream, shade, folds) with j its jellyfish-lit rim,
// l/d wooden toggles and cord loops, n/N knit dress, c/C lace, k/K rubber boots ----

const HEAD: Sprite = [
  '..............oo............',
  '.............oHo............',
  '..........ooooHhoooo........',
  '........oohhhhhhhhhhoo......',
  '.......ohhhhhhhhhhhhhho.....',
  '......ohhHHHHhhhhhhHHhho....',
  '.....ohHHhhhhhhhhhhhhHHho...',
  '.....ohhhhhhhhhhhhhhhhhho...',
  '....ohhhhhhhhhhhhhhhhhhho...',
  '....ohhhhdhhhhhdhhhhdhhho...',
  '....ohdhhhdshhhdshhhdhhho...',
  '....ohdssssssssssssssdhho...',
  '....ohdSoooossssooooSdhho...',
  '....ohdsswEesssswEessdhho...',
  '....ohdssEeEssssEeEssdhho...',
  '....ohdssEEEssssEEEssdhho...',
  '....ohdssEEEssssEEEssdhho...',
  '....ohdsbbbssssssbbbsdhho...',
  '....ohdSsssssmmsssssSdhho...',
  '....ohoSssssssssssssSohho...',
  '.....o.oSssssssssssSoohdo...',
  '........oSssssssssSo.oHdo...',
  '..........oooooooo...ohdo...',
];

// The duffle hood lying down, its bulk rising behind her shoulders; the head is drawn over it.
const HOOD: Sprite = ['....o.Y.....................', '...oyYyz............o.......', '...oyYyyzz........zyy.......'];

const TORSO: Sprite = [
  '...oyYyyyzzzSSsszyyyyooo....',
  '....oooYyzQQQQQQQQzyyo......',
  '.....oYyqqqqqqqqqqqqyyo.....',
  '.....oyyQqQqQqQqQqQqyjo.....',
  '....ooyyyoyoNnnNoyoyyjo.....',
  '....oYyydllonnNnoyoyyjo.....',
  '....oYyyyoyonNnnoyoyyjo.....',
  '...ooYyyooyoNnnNoyoyyjo.....',
  '..ooYyyydllonnNnoyoyyjoo....',
  '..oYyyyyoyyonNnnoyoyyyjo....',
  '..oYyyyooyyoNnnNoyoyyyjo....',
  '.ooYyyoodllonnNnoyooyyjo....',
  '.oYyyyooYyyonNnnoyzoyyjo....',
  '.oYyyyooYyyoNnnNoyzoyyjo....',
];

// The coat's hem in two gusts of the sea wind.
const HEM_A: Sprite = [
  '.ozzzooYyyyonnNnoyyoyyjo....',
  '.ossSooYyyyonNnnoyyozzzo....',
  '.oSsSoYyyyyoNnnNoyyossSo....',
  '..ooooYyyyyonnNnoyyooSoo....',
  '.....oYzzzyonNnnoyzzzjo.....',
  '.....oYyyyyoNnnNoyyyzjo.....',
  '.....oYyzyyonnNnoyyzzjo.....',
  '....oYyyzyyonNnnoyyzzjo.....',
  '....oYyyzyyoNnnNoyyzzjo.....',
  '....oYyyzyyonnNnoyyyzzjo....',
  '...oYyyzyyyonNnnoyyyzzjo....',
  '...oYyyzyyyoNnnNoyyyzzjo....',
  '...oZZZZZZZonnNnoZZZZZZo....',
  '....oooooonnnNnnnnooooo.....',
  '.........occcccccco.........',
];

const HEM_B: Sprite = [
  '.ozzzooYyyyonnNnoyyoyyjo....',
  '.ossSooYyyyonNnnoyyozzzo....',
  '.oSsSooYyyyoNnnNoyyossSo....',
  '..ooooYyyyyonnNnoyyooSoo....',
  '.....oYzzzyonNnnoyzzyzjo....',
  '.....oYyyyyoNnnNoyyyyzjo....',
  '.....oYyzyyonnNnoyyyzzjo....',
  '.....oYyzyyonNnnoyyyzyzjo...',
  '.....oYyzyyoNnnNoyyyzyzjo...',
  '.....oYyzyyonnNnoyyyzyyzjo..',
  '....oYyyzyyonNnnoyyyzyyzjo..',
  '....oYyyzyyoNnnNoyyyyzyyzjo.',
  '....oZZZZZZonnNnoZZZZZZZZZo.',
  '.....ooooonnnNnnnnoooooooo..',
  '.........occcccccco.........',
];

const LEGS: Sprite = [
  '.........osSoooosSo.........',
  '.........osSo..osSo.........',
  '.........osSo..osSo.........',
  '.........osSo..osSo.........',
  '.........osSo..osSo.........',
  '.........osSo..osSo.........',
  '.........osSo..osSo.........',
  '........okKkkookKkko........',
  '........okKkkookKkko........',
  '........okKkkookKkko........',
  '........okKkkookKkko........',
  '.......okkkkkookkkkko.......',
  '........ooooo..ooooo........',
];

// The braid lies over her left shoulder and ends in a ribbon; its loose tip flutters in two frames.
const BRAID: Sprite = [
  '...ohdo',
  '...oHdo',
  '..ohHdo',
  '..oHhdo',
  '..odHho',
  '..oHhdo',
  '.ohdHo.',
  '.oHhdo.',
  '.odHho.',
  '.oHhdo.',
  '.odHho.',
  '.oHhdo.',
  '.odHho.',
  '.obbbo.',
  'obbobbo',
  '.oo.oo.',
];
const TIP_A: Sprite = ['..ohho.', '..ohdo.', '...oho.', '....o..'];
const TIP_B: Sprite = ['..ohhoo', '...ohdo', '....oho', '.....o.'];
const BRAID_AT = { x: 18, y: HEAD.length } as const;

// A brass hand lantern: o iron, l brass, L lit glass, f flame.
const LANTERN: Sprite = ['..ooo..', '.o...o.', '.olllo.', 'olLLLlo', 'olLfLlo', 'olLfLlo', 'olLLLlo', '.olllo.', '..ooo..'];

// A wooden rowboat: o outline, w its pale gunwales and seats, i the wood inside, W its painted hull, a an oar.
const BOAT: Sprite = [
  '....................a.........',
  'oo.................a........oo',
  'owo...............a........owo',
  'owwooooooooooooooaooooooooowwo',
  '.owiiiiwiiiiiiiiaiiiiwiiiiiwo.',
  '.owwwwwwwwwwwwwwwwwwwwwwwwwwo.',
  '..oWWWWWWWWWWWWWWWWWWWWWWWWo..',
  '...oWWWWWWWWWWWWWWWWWWWWWWo...',
  '....oooooooooooooooooooooo....',
];

const BODY_FRAMES: readonly Sprite[] = [
  [...TORSO, ...HEM_A, ...LEGS],
  [...TORSO, ...HEM_B, ...LEGS],
];
const GIRL_W = 28;
const GIRL_H = HEAD.length + TORSO.length + HEM_A.length + LEGS.length;
const HAND = { x: 3, y: HEAD.length + 17 } as const;
const KEEPER: Girl = {
  eyes: [
    { x: 9, y: 12, out: -1, h: 5 },
    { x: 16, y: 12, out: 1, h: 5 },
  ],
  seed: 113,
};

const girlPalette = (c: Colors<K>): Palette => ({
  o: c.ink,
  s: c.skin,
  S: c.skinLo,
  b: c.blush,
  m: c.hairLo,
  h: c.hair,
  H: c.hairHi,
  d: c.hairLo,
  e: c.ink,
  E: c.jellyLo,
  w: c.pale,
  y: c.coat,
  Y: c.pale,
  z: c.coatLo,
  Z: c.paleLo,
  j: c.jelly,
  q: c.jellyLo,
  Q: c.jelly,
  n: c.dress,
  N: c.haze,
  c: c.pale,
  C: c.paleLo,
  l: c.hair,
  k: c.band,
  K: c.blush,
});
const boatPalette = (c: Colors<K>): Palette => ({ o: c.ink, w: c.pale, W: c.band, i: c.coatLo, a: c.brass });
const lanternPalette = (c: Colors<K>): Palette => ({ o: c.ink, l: c.brass, L: c.lamp, f: c.pale });
const jellyOf = (c: Colors<K>): JellyColors => ({ rim: c.jellyLo, bell: c.jelly, hi: c.pale, trail: c.jelly });
const lampJellyOf = (c: Colors<K>): JellyColors => ({ rim: c.ink, bell: c.jelly, hi: c.pale, trail: c.pale });

// ---- layout ----

type Layout = {
  readonly s: number;
  /** The horizon, and the waterline round the lighthouse's islet. */
  readonly hy: number;
  readonly wy: number;
  readonly tx: number;
  readonly base: number;
  /** Where the keeper stands (centre, feet) and where her rocks drop into the sea. */
  readonly gx: number;
  readonly gy: number;
  readonly edge: number;
  readonly mx: number;
  readonly my: number;
};

const layoutOf = (f: Frame): Layout => {
  const s = Math.min(f.w, f.h);
  const w = wide(f);
  const hy = Math.round(f.h * (w ? 0.62 : 0.53));
  const wy = hy + Math.round(s * 0.07);
  return {
    s,
    hy,
    wy,
    tx: Math.round(f.w * (w ? 0.69 : 0.64)),
    base: wy - Math.round(s * 0.05),
    gx: Math.round(f.w * (w ? 0.26 : 0.34)),
    gy: Math.round(f.h * (w ? 0.86 : 0.83)),
    edge: Math.round(f.w * (w ? 0.46 : 0.72)),
    mx: Math.round(f.w * (w ? 0.1 : 0.2)),
    my: Math.round(f.h * (w ? 0.17 : 0.09)),
  };
};

type Tower = {
  readonly x: number;
  readonly base: number;
  readonly top: number;
  readonly hw0: number;
  readonly hw1: number;
  /** The jellyfish's radius, and the glass room it lives in. */
  readonly r: number;
  readonly gw: number;
  readonly gh: number;
  readonly glass: number;
};

const towerOf = (l: Layout): Tower => {
  const r = Math.round(l.s * 0.064);
  const gh = Math.round(r * 2.15);
  const top = l.base - Math.round(l.s * 0.34);
  return {
    x: l.tx,
    base: l.base,
    top,
    hw0: Math.round(l.s * 0.07),
    hw1: Math.round(l.s * 0.05),
    r,
    gw: r * 2 + 5,
    gh,
    glass: top - 4 - gh,
  };
};

const lampY = (tw: Tower): number => tw.glass + Math.round(tw.gh * 0.38);

// ---- sky ----

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  ctx.drawImage(ditherGradient(f.w, l.hy, [c.sky0, c.sky1, c.sky2]), 0, 0);
  stars(ctx, f.w, l.hy, f.t, [c.star, c.haze], Math.round((f.w * l.hy) / 240), 23, 0.8);
  const r = Math.round(l.s * 0.055);
  drawGlow(ctx, l.mx, l.my, r * 3, c.haze, 0.7);
  moon(ctx, l.mx, l.my, r, c.moon, c.paleLo);
};

const CLOUD_TILE = 240;

// A thin bank of cloud, moonlit along its top.
const paintStreak = (g: Ctx, cx: number, cy: number, half: number, c: Colors<K>): void => {
  for (let r = 0; r < 4; r++) {
    const w = Math.round(half * (0.4 + 0.6 * Math.sin(((r + 1) / 5) * Math.PI)));
    const x = Math.round(cx - w + r * 2);
    fillRect(g, r === 0 ? c.haze : c.sky1, x, Math.round(cy) + r, w * 2, 1);
  }
  fillRect(g, c.haze, Math.round(cx - half * 0.3), Math.round(cy) - 1, Math.round(half * 0.5), 1);
  fillRect(g, c.sky1, Math.round(cx - half * 0.3), Math.round(cy), Math.round(half * 0.5), 1);
};

const cloudBand = (h: number, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`jl-cloud:${h}:${c.sky1},${c.haze}`, CLOUD_TILE, h, (g) => {
    for (let i = 0; i < 4; i++) {
      paintStreak(g, 34 + i * 58 + rand(i, 41) * 10, 2 + rand(i, 42) * (h - 7), 18 + rand(i, 43) * 12, c);
    }
  });

const clouds = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const h = Math.round(l.hy * 0.42);
  tileX(ctx, cloudBand(h, c), f.t * 1.6, Math.round(l.hy * 0.3), f.w);
};

// ---- the beam: a cone of dithered light turning round the lamp; it is short when it points at us or away ----

const BEAM_PERIOD = 9;

const beamTurn = (t: number): readonly [number, number] => {
  const a = (t / BEAM_PERIOD) * Math.PI * 2;
  return [Math.sin(a), Math.cos(a)];
};

const beamCone = (ctx: Ctx, f: Frame, c: Colors<K>, sx: number, toward: number): void => {
  const tw = towerOf(layoutOf(f));
  const ly = lampY(tw);
  const len = Math.round(Math.abs(sx) * f.w * 0.95);
  const dir = sx >= 0 ? 1 : -1;
  const spread = 0.1 + toward * 0.12;
  const level = 0.62 + toward * 0.25;
  for (let d = 3; d < len; d++) {
    const x = tw.x + dir * d;
    if (x < 0 || x >= f.w) return;
    const half = Math.round(1 + d * spread);
    const y = Math.round(ly + d * 0.04);
    const k = level * (1 - d / len);
    fillDither(ctx, c.jelly, k, x, y - half, 1, half * 2 + 1);
    const core = half >> 2;
    if (k > 0.25) fillDither(ctx, c.pale, k, x, y - core, 1, core * 2 + 1);
  }
};

const beamBehind = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const [sx, cz] = beamTurn(f.t);
  if (cz < 0) beamCone(ctx, f, c, sx, 0);
};

const beamFront = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const [sx, cz] = beamTurn(f.t);
  if (cz < 0) return;
  beamCone(ctx, f, c, sx, cz);
  if (cz < 0.6) return;
  // Facing us, the lamp flares: stepped so the cached glows stay few.
  const k = Math.round(((cz - 0.6) / 0.4) * 4) / 4;
  const tw = towerOf(layoutOf(f));
  drawGlow(ctx, tw.x, lampY(tw), Math.round(tw.r * (2 + 1.6 * k)), c.jelly, 0.15 + 0.35 * k);
};

// ---- the sea ----

const waves = (ctx: Ctx, f: Frame, l: Layout, c: Colors<K>): void => {
  const n = Math.round((f.w * (f.h - l.hy)) / 150);
  for (let i = 0; i < n; i++) {
    if (Math.sin(f.t * 1.3 + i * 2.1) < -0.3) continue;
    const d = rand(i, 52) ** 1.4;
    const y = l.hy + 2 + Math.round(d * (f.h - l.hy - 3));
    const len = 2 + Math.round(d * 7);
    const x = wrap(rand(i, 53) * (f.w + 20) + f.t * (1.5 + d * 5), f.w + 20) - 10;
    fillRect(ctx, rand(i, 54) < 0.3 ? c.star : c.haze, Math.round(x), y, len, 1);
  }
};

const sea = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  ctx.drawImage(ditherGradient(f.w, f.h - l.hy, [c.sky1, c.sky0]), 0, l.hy);
  fillRect(ctx, c.haze, 0, l.hy, f.w, 1);
  waves(ctx, f, l, c);
  shine(ctx, f, l.mx - 4, 9, l.hy + 1, Math.round((f.h - l.hy) * 0.7), c.star);
  shine(ctx, f, l.tx - 4, 9, l.wy + 2, Math.round((f.h - l.wy) * 0.55), c.jelly);
};

// ---- the lighthouse ----

const paintIslet = (g: Ctx, l: Layout, tw: Tower, c: Colors<K>): void => {
  const iw = Math.round(l.s * 0.2);
  for (let x = tw.x - iw; x <= tw.x + iw; x++) {
    const u = Math.abs(x - tw.x) / iw;
    const top = Math.round(tw.base - 2 + u ** 1.6 * (l.wy - tw.base + 2) - (noise1(x / 3, 61) - 0.5) * 4);
    if (top >= l.wy) continue;
    fillRect(g, x < tw.x ? c.rock : c.ink, x, top, 1, l.wy - top);
    fillRect(g, x < tw.x ? c.haze : c.rock, x, top, 1, 1);
  }
};

const towerRow = (g: Ctx, tw: Tower, y: number, c: Colors<K>): void => {
  const k = (y - tw.top) / (tw.base - tw.top);
  const hw = Math.round(tw.hw1 + (tw.hw0 - tw.hw1) * k);
  const banded = (k > 0.22 && k < 0.36) || (k > 0.6 && k < 0.74);
  const split = Math.round(hw * 0.35);
  fillRect(g, c.ink, tw.x - hw - 1, y, hw * 2 + 3, 1);
  fillRect(g, banded ? c.band : c.pale, tw.x - hw, y, hw + split, 1);
  fillRect(g, banded ? c.hair : c.paleLo, tw.x + split, y, hw - split + 1, 1);
};

const paintTower = (g: Ctx, tw: Tower, c: Colors<K>): void => {
  for (let y = tw.top; y < tw.base; y++) towerRow(g, tw, y, c);
  const h = tw.base - tw.top;
  fillRect(g, c.ink, tw.x - 2, tw.base - 6, 4, 6);
  fillRect(g, c.lamp, tw.x - 3, Math.round(tw.top + h * 0.47), 2, 3);
  fillRect(g, c.ink, tw.x + 1, Math.round(tw.top + h * 0.13), 2, 3);
  // The gallery: a ledge and a railing of posts below the glass room.
  const half = (tw.gw >> 1) + 2;
  fillRect(g, c.ink, tw.x - half - 1, tw.top - 1, half * 2 + 3, 2);
  fillRect(g, c.paleLo, tw.x - half, tw.top - 1, half * 2 + 1, 1);
  fillRect(g, c.ink, tw.x - half, tw.top - 4, half * 2 + 1, 1);
  for (let x = tw.x - half; x <= tw.x + half; x += 2) fillRect(g, c.ink, x, tw.top - 4, 1, 3);
};

const paintRoom = (g: Ctx, tw: Tower, c: Colors<K>): void => {
  const left = tw.x - (tw.gw >> 1);
  fillRect(g, c.ink, left - 1, tw.glass - 1, tw.gw + 2, tw.gh + 2);
  fillRect(g, c.ink, left, tw.glass, tw.gw, tw.gh);
  fillDither(g, c.jellyLo, 0.55, left, tw.glass, tw.gw, tw.gh);
  const half = (tw.gw >> 1) + 2;
  const rows = Math.round(tw.gh * 0.5);
  for (let r = 0; r < rows; r++) {
    const w = Math.round(half * Math.sqrt(1 - (r / rows) ** 2));
    const y = tw.glass - 2 - r;
    fillRect(g, c.ink, tw.x - w - 1, y, w * 2 + 3, 1);
    fillRect(g, c.band, tw.x - w, y, w, 1);
    fillRect(g, c.hair, tw.x, y, w + 1, 1);
  }
  fillRect(g, c.ink, tw.x - half - 2, tw.glass - 2, half * 2 + 5, 1);
  fillRect(g, c.ink, tw.x, tw.glass - rows - 6, 1, 5);
  fillRect(g, c.paleLo, tw.x - 1, tw.glass - rows - 3, 3, 2);
};

const towerLayer = (f: Frame, l: Layout, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`jl-tower:${f.w}x${f.h}:${colorKey(c)}`, f.w, f.h, (g) => {
    const tw = towerOf(l);
    paintIslet(g, l, tw, c);
    paintTower(g, tw, c);
    paintRoom(g, tw, c);
  });

const isletFoam = (ctx: Ctx, f: Frame, l: Layout, c: Colors<K>): void => {
  const iw = Math.round(l.s * 0.21);
  for (let x = l.tx - iw; x <= l.tx + iw; x++) {
    const v = Math.sin(x * 0.7 + f.t * 2.6) + Math.sin(x * 0.23 - f.t * 1.1);
    if (v > 0.4) fillRect(ctx, c.pale, x, l.wy - (v > 1.2 ? 1 : 0), 1, 1);
  }
};

const lighthouse = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  ctx.drawImage(towerLayer(f, l, c), 0, 0);
  isletFoam(ctx, f, l, c);
};

// The jellyfish in the glass room squeezes on every beat; its light spills out round the room.
const jellyLamp = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const tw = towerOf(layoutOf(f));
  const left = tw.x - (tw.gw >> 1);
  const pulse = Math.max(0, 1 - frac(f.beat) * 3);
  const ly = lampY(tw);
  drawGlow(ctx, tw.x, ly, Math.round(tw.r * 2.6), c.jelly, f.kick > 0.5 ? 0.5 : 0.34);
  ctx.save();
  ctx.beginPath();
  ctx.rect(left, tw.glass, tw.gw, tw.gh);
  ctx.clip();
  drawGlow(ctx, tw.x, ly, Math.round(tw.r * 1.5), c.jelly, pulse > 0.3 ? 0.6 : 0.4);
  drawJelly(ctx, f.t, tw.x, tw.glass + 3 - Math.round(pulse), tw.r, lampJellyOf(c), pulse);
  ctx.restore();
  for (const x of [left + Math.round(tw.gw * 0.22), left + Math.round(tw.gw * 0.78)]) fillDither(ctx, c.ink, 0.5, x, tw.glass, 1, tw.gh);
};

// ---- little jellyfish rising out of the sea like lanterns ----

const drifter = (ctx: Ctx, f: Frame, l: Layout, c: Colors<K>, i: number): void => {
  const z = rand(i, 71);
  const p = frac(f.t / (18 + rand(i, 72) * 10) + rand(i, 73));
  const from = l.hy + 6 + rand(i, 74) * (f.h - l.hy) * 0.45;
  const y = Math.round(from - p * (from + 30));
  const x = Math.round(rand(i, 75) * f.w + Math.sin(f.t * 0.6 + i * 2.3) * 5);
  const r = 2 + Math.round(z * 3);
  drawGlow(ctx, x, y + r, r * 3, c.jelly, p < 0.05 ? 0.2 : 0.4);
  if (p < 0.05) return;
  drawJelly(ctx, f.t + i, x, y, r, jellyOf(c), Math.max(0, 1 - frac(f.beat + rand(i, 76)) * 3));
};

const drifters = (ctx: Ctx, f: Frame, c: Colors<K>, near: boolean): void => {
  const l = layoutOf(f);
  const count = Math.round((f.w * f.h) / 5000);
  for (let i = 0; i < count; i++) if (rand(i, 71) > 0.45 === near) drifter(ctx, f, l, c, i);
};

const farDrifters = (ctx: Ctx, f: Frame, c: Colors<K>): void => drifters(ctx, f, c, false);
const nearDrifters = (ctx: Ctx, f: Frame, c: Colors<K>): void => drifters(ctx, f, c, true);

// ---- the rocks she stands on ----

const rockTop = (x: number, l: Layout): number => {
  const boulder = Math.max(0, 1 - Math.abs(x - l.gx * 0.2) / (l.s * 0.14)) * l.s * 0.09;
  const rough = Math.abs(x - l.gx) < 10 ? 0 : (noise1(x / 6, 31) - 0.5) * 5;
  const lip = l.edge - 18;
  const drop = x > lip ? ((x - lip) / 18) ** 2 * l.s * 0.1 : 0;
  return Math.round(l.gy - 1 - boulder + rough + drop);
};

const paintRocks = (g: Ctx, f: Frame, l: Layout, c: Colors<K>): void => {
  let prev = rockTop(0, l);
  for (let x = 0; x <= l.edge; x++) {
    const top = rockTop(x, l);
    fillRect(g, c.rock, x, top, 1, f.h - top);
    fillDither(g, c.ink, 0.5, x, top + 6, 1, f.h - top - 6);
    fillRect(g, c.haze, x, top, 1, top <= prev ? 2 : 1);
    if (rand(x, 33) < 0.12) fillRect(g, c.ink, x, top + 3 + Math.floor(rand(x, 34) * 8), 1, 4);
    paintLedges(g, f, x, top, c);
    prev = top;
  }
};

// Broken ledges catch the moonlight down the rock face, each with a dark crack beneath it.
const paintLedges = (g: Ctx, f: Frame, x: number, top: number, c: Colors<K>): void => {
  for (let k = 0, y = top + 9; y < f.h - 2; k++, y += 8 + (k % 3) * 2) {
    if (noise1(x / 5 + k * 7, 37) < 0.58) continue;
    fillRect(g, c.haze, x, y + Math.round(noise1(x / 9, k + 40) * 2), 1, 1);
    fillRect(g, c.ink, x, y + 1 + Math.round(noise1(x / 9, k + 40) * 2), 1, 2);
  }
};

const rocksLayer = (f: Frame, l: Layout, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`jl-rocks:${f.w}x${f.h}:${colorKey(c)}`, f.w, f.h, (g) => paintRocks(g, f, l, c));

// Surf churns where the rocks meet the sea, and on every bar a wave breaks and throws spray up.
const surf = (ctx: Ctx, f: Frame, l: Layout, c: Colors<K>): void => {
  const wl = l.gy + Math.round(l.s * 0.05);
  for (let x = l.edge - 10; x < l.edge + 14; x++) {
    const v = Math.sin(x * 0.9 + f.t * 3.2) + Math.sin(x * 0.31 - f.t * 1.7);
    if (v > 0) fillRect(ctx, v > 1 ? c.pale : c.star, x, wl - Math.round(v), 1, 1);
  }
  const age = f.beat - Math.floor(f.beat / 4) * 4;
  if (age > 1.6) return;
  for (let j = 0; j < 12; j++) {
    const vx = (rand(j, 81) - 0.6) * 10;
    const vy = 14 + rand(j, 82) * 12;
    const x = l.edge - 4 + vx * age;
    const y = wl - vy * age + 9 * age * age;
    fillRect(ctx, j % 3 === 0 ? c.star : c.pale, Math.round(x), Math.round(y), age < 0.8 ? 2 : 1, 1);
  }
};

// The keeper's rowboat, moored to the rocks by a slack rope, rocking on the swell.
const rowboat = (ctx: Ctx, f: Frame, l: Layout, c: Colors<K>): void => {
  const wl = l.gy + Math.round(l.s * 0.05);
  const x = l.edge + 5;
  const y = wl - BOAT.length + 2 + Math.round(Math.sin(f.t * 1.7) * 1.2);
  const tie = rockTop(l.edge - 8, l);
  pixelLine(ctx, l.edge - 8, tie, l.edge - 2, wl - 1, c.coatLo);
  pixelLine(ctx, l.edge - 2, wl - 1, x + 1, y + 1, c.coatLo);
  for (let k = 0; k < 5; k++) fillRect(ctx, c.sky0, x + 3 + k * 5, wl + 2 + (k % 2), 4 - (k % 2), 1);
  drawSprite(ctx, BOAT, paletteOf(c, 'jl-boat', boatPalette), x, y);
};

const rocks = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  ctx.drawImage(rocksLayer(f, l, c), 0, 0);
  rowboat(ctx, f, l, c);
  surf(ctx, f, l, c);
};

// ---- the keeper ----

const lantern = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, y: number): void => {
  const swing = Math.round(Math.sin(f.t * 2.3) * 1.4);
  fillRect(ctx, c.ink, x, y, 1, 2);
  drawSprite(ctx, LANTERN, paletteOf(c, 'jl-lantern', lanternPalette), x - 3 + swing, y + 1);
};

const keeper = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const x = l.gx - (GIRL_W >> 1);
  const y = l.gy - GIRL_H;
  const nod = onBeat(f.beat, 0.25);
  const palette = paletteOf(c, 'jl-girl', girlPalette);
  drawGlow(ctx, x + HAND.x, y + HAND.y + 6, Math.round(l.s * 0.075), c.lamp, f.kick > 0.5 ? 0.36 : 0.26);
  drawGlow(ctx, x + HAND.x, y + HAND.y + 6, Math.round(l.s * 0.04), c.lamp, 0.55);
  fillDither(ctx, c.ink, 0.5, x + 6, l.gy - 1, 18, 2);
  drawSprite(ctx, BODY_FRAMES[alternate(f.beat)] as Sprite, palette, x, y + HEAD.length);
  drawSprite(ctx, HOOD, palette, x, y + HEAD.length - HOOD.length);
  drawGirl(ctx, f, HEAD, palette, x, y + nod, KEEPER);
  const tip = alternate(f.beat + 0.5) === 0 ? TIP_A : TIP_B;
  drawSprite(ctx, tip, palette, x + BRAID_AT.x, y + BRAID_AT.y + BRAID.length - 1);
  drawSprite(ctx, BRAID, palette, x + BRAID_AT.x, y + BRAID_AT.y);
  lantern(ctx, f, c, x + HAND.x, y + HAND.y);
};

// ---- weather ----

const storm = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  if (c.rain === c.sky0) return;
  rain(ctx, f, c.rain, { count: Math.round((f.w * f.h) / 380), len: 5, slant: -0.3, speed: 170, seed: 7 });
};

export const jellyfishLighthouse = defineScene<K>({
  id: 'jellyfish-lighthouse',
  title: 'Jellyfish Lighthouse',
  mood: { valence: -0.3, energy: -0.3 },
  styles: ['starlit-dream', 'lofi-loop', 'credits-roll', 'showa-ballad'],
  variants: [
    {
      // Moonlit night: an aqua jellyfish lamp over a deep blue sea.
      mood: { valence: -0.2, energy: -0.3 },
      colors: {
        sky0: '#060a1e',
        sky1: '#13204a',
        sky2: '#2c4a7e',
        star: '#e2eaff',
        moon: '#fff4d6',
        haze: '#3e5e98',
        rock: '#1c1b30',
        ink: '#0a0814',
        pale: '#eef0f8',
        paleLo: '#98a2c4',
        band: '#c8404e',
        jelly: '#58dce6',
        jellyLo: '#1d6c8e',
        skin: '#ffe0cc',
        skinLo: '#e6a490',
        blush: '#ff7488',
        hair: '#8c2e2a',
        hairHi: '#c45a48',
        hairLo: '#4c141e',
        coat: '#e6d4b4',
        coatLo: '#b89a72',
        dress: '#22356a',
        lamp: '#ffc45c',
        brass: '#b07e30',
        rain: '#060a1e',
      },
    },
    {
      // A stormy night: slanting rain, a veiled moon, a grey-green sea and a paler, lonelier lamp.
      mood: { valence: -0.5, energy: -0.4 },
      colors: {
        sky0: '#05080e',
        sky1: '#141c26',
        sky2: '#2a3a44',
        star: '#5e7078',
        moon: '#9eaab4',
        haze: '#34464e',
        rock: '#16191e',
        ink: '#06070a',
        pale: '#dfe6e8',
        paleLo: '#86949a',
        band: '#9a3a40',
        jelly: '#6cd6cc',
        jellyLo: '#235e62',
        skin: '#f6dccc',
        skinLo: '#d29c8c',
        blush: '#e8707e',
        hair: '#7a2a28',
        hairHi: '#ac5040',
        hairLo: '#40121a',
        coat: '#cfc4aa',
        coatLo: '#9c8a6c',
        dress: '#1e2c4c',
        lamp: '#ffb850',
        brass: '#94692a',
        rain: '#86949a',
      },
    },
    {
      // Blue hour before dawn: a violet sky with a pink horizon, and the jellyfish glowing rose.
      mood: { valence: 0.1, energy: -0.4 },
      colors: {
        sky0: '#24245e',
        sky1: '#5c4890',
        sky2: '#e89aaa',
        star: '#fff0f6',
        moon: '#fff6f0',
        haze: '#8a6ab4',
        rock: '#2a2244',
        ink: '#120c22',
        pale: '#fbf2f8',
        paleLo: '#b4a2cc',
        band: '#d8485a',
        jelly: '#ff94cc',
        jellyLo: '#6a3c9e',
        skin: '#ffe2d2',
        skinLo: '#eaa898',
        blush: '#ff6e8a',
        hair: '#90302e',
        hairHi: '#cc6252',
        hairLo: '#4e1622',
        coat: '#f0dcc0',
        coatLo: '#c8a682',
        dress: '#2a3470',
        lamp: '#ffca6a',
        brass: '#b8823a',
        rain: '#24245e',
      },
    },
  ],
  layers: [sky, clouds, beamBehind, sea, farDrifters, lighthouse, jellyLamp, beamFront, nearDrifters, rocks, keeper, storm],
});
