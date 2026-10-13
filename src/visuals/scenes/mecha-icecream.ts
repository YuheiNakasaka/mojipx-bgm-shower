// Break time on a rooftop at sunset: a girl pilot sits on her giant robot's shoulder eating an ice cream while it
// holds a parasol over her, swings its feet over the edge and blinks its one round eye at the city below.
import { type Ctx, drawSprite, fillRect, type Palette, type Sprite } from 'mojipx';
import { disc, ditherGradient, frac, pixelLine, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { flock } from './batch-1-helpers.ts';
import { drawGlow, glowOf, memoLayer, wrap } from './batch-2-helpers.ts';
import { paletteOf, sigOf } from './batch-3-helpers.ts';
import { alternate, drawGirl, type Girl, limb, onBeat, sipOf, wide } from './batch-7-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sky3'
  | 'sun'
  | 'sunHi'
  | 'cloud'
  | 'cloudLo'
  | 'far'
  | 'mid'
  | 'win'
  | 'facade'
  | 'facadeHi'
  | 'mech'
  | 'mechHi'
  | 'mechLo'
  | 'accent'
  | 'accentLo'
  | 'joint'
  | 'eye'
  | 'para'
  | 'paraHi'
  | 'ink'
  | 'skin'
  | 'skinLo'
  | 'blush'
  | 'hair'
  | 'hairHi'
  | 'hairLo'
  | 'iris'
  | 'white'
  | 'whiteLo'
  | 'suit'
  | 'suitLo';

// ---- the pilot: o outline, s/S skin, b blush, h/H/d hair, e/E eyes, w glint, m mouth, g/G goggles,
// n plaster, t/T vest, j/J flight suit, k/K boots ----

const HEAD: Sprite = [
  '...............oo.........',
  '..............oho.........',
  '..............oo..........',
  '........oooooohooo........',
  '......oohhhhhhhhhhoo......',
  '.....ohhhhhhhhhhhhhho.....',
  '....ohhHHHhhhhhhHHHhho....',
  '...ohhHgggghhhhggggHhho...',
  '..ohhhgGGGGghhgGGGGghhho..',
  '..oggggGwGGggggGGwGggggo..',
  '.ohhhhgGGGGghhgGGGGghhhho.',
  '.ohhhhhggggdhhdgggghhhhho.',
  'ohhhhhhhhhhhhhhhhhhhhhhhho',
  '.ohhhdhdhdhhddhhdhdhdhhho.',
  '.ohhhSdSdSdhSShdSdSdShhho.',
  '.ohhdsooooSdssdSoooosdhho.',
  '.ohhsssweesSssSseewssshho.',
  '.ohhssseEesssssseEessshho.',
  '.ohhsssEEEssssssEEEssshho.',
  '.ohdsbbbssssssssssonnndho.',
  '..oSssssssssmmssssonnnSo..',
  '..oSssssssssssssssssssSo..',
  '...oSssssssssssssssssSo...',
  '....ooSssssssssssssSoo....',
  '......oooooooooooooo......',
];

const TORSO: Sprite = [
  '..........oSSSSo..........',
  '.......oooossssoooo.......',
  '.....osssSttssttSssso.....',
  '....ossssSttttttSsssso....',
  '....osssoTttttttTossso....',
  '....osssoTttttttTossso....',
  '....osssoTttttttTossso....',
  '....oSssoTttttttTossSo....',
  '....oSsSoTttttttToooo.....',
  '....oossojjjjjjjjo........',
  '.....oooojJjjjjJjo........',
  '......ojjjjjjjjjjjjo......',
  '.....ojjjJjjjjjjJjjjo.....',
];

const LEGS_A: Sprite = [
  '......ojjjjo..ojjjJo......',
  '......ojjjJo..ojjjjo......',
  '......ojjjJo..oJjjjo......',
  '......ojjjJo..oJjjjo......',
  '.....okkkkko..oJjjjo......',
  '.....oKkkkko..okkkkko.....',
  '.....okkkkko..okkkkKo.....',
  '.....ooooooo..okkkkko.....',
  '..............ooooooo.....',
];

const LEGS_B: Sprite = [
  '......oJjjjo..ojjjjo......',
  '......ojjjjo..oJjjjo......',
  '......ojjjJo..oJjjjo......',
  '......ojjjJo..oJjjjo......',
  '......ojjjJo..okkkkko.....',
  '.....okkkkko..okkkkKo.....',
  '.....oKkkkko..okkkkko.....',
  '.....okkkkko..ooooooo.....',
  '.....ooooooo..............',
];

const POSES: readonly Sprite[] = [
  [...HEAD, ...TORSO, ...LEGS_A],
  [...HEAD, ...TORSO, ...LEGS_B],
];

// Strawberry over mint in a wafer cone: a/A scoop, c/C scoop, y/Y wafer.
const CONE: Sprite = ['.oaao.', 'oaAaao', 'oaaaao', 'ocCcco', '.oooo.', '.oyyo.', '.oyYo.', '..oy..', '..oo..'];
const HAND: Sprite = ['.oo.', 'osso', 'oSSo'];

const GIRL: Girl = {
  eyes: [
    { x: 7, y: 15, out: -1 },
    { x: 16, y: 15, out: 1 },
  ],
  seed: 13,
};
const SEAT = 36;
const ELBOW = { x: 19, y: 33 } as const;
// Where her hand holds the cone at rest, and up at her mouth.
const REST = { x: 20, y: 30 } as const;
const LICK = { x: 16, y: 21 } as const;

const BIRD_A: Sprite = ['o...o', '.o.o.', '..o..'];
const BIRD_B: Sprite = ['.....', 'ooooo', '..o..'];

const girlPalette = (c: Colors<K>): Palette => ({
  o: c.ink,
  s: c.skin,
  S: c.skinLo,
  b: c.blush,
  h: c.hair,
  H: c.hairHi,
  d: c.hairLo,
  e: c.ink,
  E: c.iris,
  w: c.white,
  m: c.accentLo,
  g: c.joint,
  G: c.eye,
  n: c.cloud,
  t: c.white,
  T: c.whiteLo,
  j: c.suit,
  J: c.suitLo,
  k: c.joint,
  K: c.mechLo,
  a: c.para,
  A: c.paraHi,
  c: c.accent,
  C: c.white,
  y: c.sun,
  Y: c.suitLo,
});
const birdPalette = (c: Colors<K>): Palette => ({ o: c.mid });

// ---- layout ----

type Roof = { readonly rx: number; readonly edge: number; readonly horizon: number; readonly sunX: number };

const roofOf = (f: Frame): Roof =>
  wide(f)
    ? { rx: Math.round(f.w * 0.63), edge: Math.round(f.h * 0.64), horizon: Math.round(f.h * 0.52), sunX: Math.round(f.w * 0.24) }
    : { rx: Math.round(f.w * 0.6), edge: Math.round(f.h * 0.64), horizon: Math.round(f.h * 0.52), sunX: Math.round(f.w * 0.3) };

// ---- the sky, the sun and the city ----

const paintCity = (g: Ctx, w: number, h: number, horizon: number, c: Colors<K>): void => {
  for (let x = 0, i = 0; x < w; i++) {
    const bw = 8 + Math.floor(rand(i, 71) * 14);
    const top = horizon - 3 - Math.floor(rand(i, 72) * 16);
    fillRect(g, c.far, x, top, bw, h - top);
    x += bw;
  }
  for (let x = -3, i = 0; x < w; i++) {
    const bw = 12 + Math.floor(rand(i, 73) * 18);
    const top = horizon + 4 + Math.floor(rand(i, 74) * 22) - (i % 5 === 2 ? 18 : 0);
    fillRect(g, c.mid, x, top, bw, h - top);
    for (let wy = top + 3; wy < h; wy += 4)
      for (let wx = x + 2; wx < x + bw - 2; wx += 3) if (rand(wx, wy) < 0.18) fillRect(g, c.win, wx, wy, 1, 2);
    x += bw + 1;
  }
};

// The building she sits on, in its own shadow: a lit parapet lip, then dim floors with a few lights on.
const paintFacade = (g: Ctx, w: number, h: number, edge: number, c: Colors<K>): void => {
  fillRect(g, c.facade, 0, edge, w, h - edge);
  fillRect(g, c.facadeHi, 0, edge, w, 2);
  fillRect(g, c.mid, 0, edge + 6, w, 2);
  for (let y = edge + 14; y < h; y += 15) {
    fillRect(g, c.mid, 0, y + 11, w, 1);
    for (let x = 5; x < w; x += 16) {
      const lit = rand(x, y) < 0.18;
      fillRect(g, lit ? c.win : c.mid, x, y, 10, 9);
      if (!lit) fillRect(g, c.far, x + 1, y + 1, 3, 2);
    }
  }
};

// A big low sun with a soft halo, its lower half cut by bands of haze.
const paintSun = (g: Ctx, r: Roof, size: number, c: Colors<K>): void => {
  const halo = Math.round(size * 2.2);
  const cy = r.horizon - Math.round(size * 0.25);
  g.drawImage(glowOf(halo, c.sun, 0.55), r.sunX - halo, r.horizon - halo);
  disc(g, r.sunX, cy, size, (dy) => (dy < -size * 0.4 ? c.sunHi : c.sun));
  for (let k = 1; k < 4; k++) fillRect(g, c.sky3, r.sunX - size, cy + Math.round(size * (0.15 + k * 0.22)), size * 2 + 1, k);
  fillRect(g, c.sky3, r.sunX - Math.round(size * 2.6), r.horizon, Math.round(size * 5.2), 4);
};

const backLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`mi-back:${sigOf(c)}`, f.w, f.h, (g) => {
    const r = roofOf(f);
    g.drawImage(ditherGradient(f.w, r.horizon + 4, [c.sky0, c.sky1, c.sky2, c.sky3]), 0, 0);
    paintSun(g, r, Math.round(Math.min(f.w, f.h) * 0.12), c);
    paintCity(g, f.w, f.h, r.horizon, c);
    paintFacade(g, f.w, f.h, r.edge, c);
  });

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(backLayer(f, c), 0, 0);
};

// Long, flat sunset clouds lit from below, drifting slowly.
const clouds = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const r = roofOf(f);
  for (let i = 0; i < 5; i++) {
    const len = 30 + Math.floor(rand(i, 81) * 50);
    const span = f.w + len + 20;
    const x = Math.round(wrap(rand(i, 82) * span + f.t * (1.5 + i * 0.6), span) - len);
    const y = Math.round(r.horizon * (0.15 + rand(i, 83) * 0.55));
    fillRect(ctx, c.cloud, x + 8, y, len - 16, 1);
    fillRect(ctx, c.cloud, x, y + 1, len, 2);
    fillRect(ctx, c.cloudLo, x + 4, y + 3, len - 6, 1);
  }
};

const birds = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const r = roofOf(f);
  flock(ctx, f, [BIRD_A, BIRD_B], paletteOf(c, birdPalette), {
    count: 4,
    top: r.horizon * 0.25,
    span: r.horizon * 0.3,
    speed: -9,
    seed: 7,
  });
};

// A radio mast in the city winks red on every other beat.
const mast = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const r = roofOf(f);
  const x = Math.round(f.w * (wide(f) ? 0.08 : 0.12));
  fillRect(ctx, c.mid, x, r.horizon - 26, 1, 30);
  fillRect(ctx, c.mid, x - 1, r.horizon - 14, 3, 1);
  if (alternate(f.beat) === 0) {
    fillRect(ctx, c.para, x, r.horizon - 27, 1, 1);
    drawGlow(ctx, x, r.horizon - 27, 3, c.para, 0.6);
  }
};

// ---- the robot ----

const box = (ctx: Ctx, x: number, y: number, w: number, h: number, fill: string, ink: string): void => {
  fillRect(ctx, ink, x + 1, y, w - 2, h);
  fillRect(ctx, ink, x, y + 1, w, h - 2);
  fillRect(ctx, fill, x + 1, y + 1, w - 2, h - 2);
};

const torso = (g: Ctx, rx: number, edge: number, c: Colors<K>): void => {
  box(g, rx - 27, edge - 40, 54, 40, c.mech, c.ink);
  fillRect(g, c.mechHi, rx - 26, edge - 39, 2, 38);
  fillRect(g, c.mechLo, rx + 21, edge - 39, 5, 38);
  fillRect(g, c.mechLo, rx - 26, edge - 5, 52, 4);
  box(g, rx - 16, edge - 34, 32, 18, c.mechHi, c.joint);
  for (let k = 0; k < 3; k++) fillRect(g, c.joint, rx - 12, edge - 12 + k * 3, 24, 1);
  fillRect(g, c.accent, rx - 24, edge - 30, 4, 2);
  fillRect(g, c.accent, rx - 24, edge - 26, 4, 2);
  fillRect(g, c.joint, rx - 5, edge - 43, 10, 4);
};

const legs = (ctx: Ctx, f: Frame, rx: number, edge: number, c: Colors<K>): void => {
  for (const side of [-1, 1] as const) {
    const swing = Math.round(Math.sin(f.t * 1.6 + (side > 0 ? Math.PI : 0)) * 2);
    const x = rx + (side < 0 ? -21 : 7);
    box(ctx, x + swing, edge + 2, 14, 34, c.mech, c.ink);
    fillRect(ctx, c.mechLo, x + swing + 10, edge + 3, 3, 32);
    fillRect(ctx, c.joint, x + swing + 1, edge + 14, 12, 2);
    box(ctx, x - 2 + swing * 2, edge + 34, 18, 9, c.accent, c.ink);
    fillRect(ctx, c.accentLo, x - 1 + swing * 2, edge + 39, 16, 3);
    box(ctx, x - 1, edge - 7, 16, 11, c.mech, c.ink);
    fillRect(ctx, c.mechHi, x, edge - 6, 14, 2);
  }
};

// Round shoulder domes: the left one is her seat.
const pads = (ctx: Ctx, rx: number, edge: number, c: Colors<K>): void => {
  for (const cx of [rx - 35, rx + 35]) {
    for (let dy = -12; dy <= 4; dy++) {
      const half = dy < 0 ? Math.round(Math.sqrt(144 - dy * dy)) : 12;
      fillRect(ctx, c.ink, cx - half - 1, edge - 34 + dy, half * 2 + 3, 1);
      fillRect(ctx, dy > 0 ? c.accentLo : c.accent, cx - half, edge - 34 + dy, half * 2 + 1, 1);
    }
    fillRect(ctx, c.ink, cx - 12, edge - 29, 25, 1);
    fillRect(ctx, c.white, cx - 6, edge - 44, 6, 1);
    fillRect(ctx, c.white, cx - 9, edge - 42, 2, 1);
  }
};

// The head nods on the beat; its one eye glows brighter on the kick and blinks now and then.
const head = (ctx: Ctx, f: Frame, rx: number, edge: number, c: Colors<K>): void => {
  const y = edge - 68 + onBeat(f.beat, 0.25);
  fillRect(ctx, c.joint, rx + 8, y - 8, 1, 8);
  const tip = alternate(f.beat) === 0 ? c.white : c.para;
  fillRect(ctx, tip, rx + 7, y - 10, 3, 3);
  box(ctx, rx - 22, y + 7, 6, 12, c.accent, c.ink);
  box(ctx, rx + 16, y + 7, 6, 12, c.accentLo, c.ink);
  box(ctx, rx - 18, y, 36, 26, c.mech, c.ink);
  fillRect(ctx, c.mechHi, rx - 17, y + 1, 34, 2);
  fillRect(ctx, c.mechLo, rx + 13, y + 3, 4, 22);
  fillRect(ctx, c.mechLo, rx - 17, y + 22, 34, 3);
  box(ctx, rx - 14, y + 6, 28, 12, c.ink, c.joint);
  for (let k = 0; k < 3; k++) fillRect(ctx, c.joint, rx - 6 + k * 5, y + 20, 3, 1);
  eye(ctx, f, rx + 1, y + 12, c);
};

const eye = (ctx: Ctx, f: Frame, x: number, y: number, c: Colors<K>): void => {
  if (frac(f.t / 5.3 + 0.3) < 0.035) {
    fillRect(ctx, c.eye, x - 5, y, 11, 1);
    return;
  }
  drawGlow(ctx, x, y, 9, c.eye, f.kick > 0.5 ? 0.7 : 0.45);
  disc(ctx, x, y, 5, () => c.eye);
  disc(ctx, x, y, 2, () => c.white);
  fillRect(ctx, c.white, x - 4, y - 3, 2, 1);
};

const core = (ctx: Ctx, f: Frame, rx: number, edge: number, c: Colors<K>): void => {
  drawGlow(ctx, rx, edge - 25, 7, c.eye, f.kick > 0.5 ? 0.65 : 0.35);
  disc(ctx, rx, edge - 25, 4, () => c.accent);
  disc(ctx, rx, edge - 25, 2, () => c.eye);
};

// The right arm rests on the parapet; the left one holds the parasol up over the girl.
const arms = (ctx: Ctx, rx: number, edge: number, c: Colors<K>): void => {
  limb(ctx, rx + 36, edge - 32, rx + 42, edge - 16, 8, c.mech, c.ink);
  limb(ctx, rx + 42, edge - 16, rx + 46, edge - 4, 8, c.mechLo, c.ink);
  box(ctx, rx + 40, edge - 6, 13, 6, c.accentLo, c.ink);
  limb(ctx, rx - 38, edge - 32, rx - 50, edge - 16, 8, c.mech, c.ink);
  limb(ctx, rx - 50, edge - 16, rx - 54, edge - 34, 7, c.mechLo, c.ink);
};

const parasol = (ctx: Ctx, f: Frame, rx: number, edge: number, c: Colors<K>): void => {
  const px = canopyX(f, rx);
  const py = edge - 86;
  for (let dy = -12; dy <= 0; dy++) {
    const half = Math.round(24 * Math.sqrt(1 - (dy / 13) ** 2));
    fillRect(ctx, c.ink, px - half - 1, py + dy, half * 2 + 3, 1);
    for (let x0 = -24; x0 < 24; x0 += 8) {
      const from = Math.max(x0, -half);
      const to = Math.min(x0 + 8, half + 1);
      if (to > from) fillRect(ctx, (x0 / 8) % 2 === 0 ? c.para : c.paraHi, px + from, py + dy, to - from, 1);
    }
  }
  for (let x = -24; x <= 24; x += 8) fillRect(ctx, c.ink, px + x - 3, py + 1, 7, 1);
  for (let x = -24; x <= 24; x += 8) fillRect(ctx, c.para, px + x - 2, py + 1, 5, 1);
  fillRect(ctx, c.ink, px - 1, py - 15, 3, 3);
};

const canopyX = (f: Frame, rx: number): number => rx - 33 + Math.round(Math.sin(f.t * 0.8) * 1.2);

// The parasol's shaft runs behind her from the robot's fist.
const shaft = (ctx: Ctx, f: Frame, rx: number, edge: number, c: Colors<K>): void => {
  pixelLine(ctx, rx - 54, edge - 36, canopyX(f, rx), edge - 86, c.joint);
  box(ctx, rx - 57, edge - 39, 7, 7, c.accentLo, c.ink);
};

const robotLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`mi-robot:${sigOf(c)}`, f.w, f.h, (g) => {
    const r = roofOf(f);
    torso(g, r.rx, r.edge, c);
  });

const robot = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const r = roofOf(f);
  legs(ctx, f, r.rx, r.edge, c);
  ctx.drawImage(robotLayer(f, c), 0, 0);
  core(ctx, f, r.rx, r.edge, c);
  head(ctx, f, r.rx, r.edge, c);
  arms(ctx, r.rx, r.edge, c);
  pads(ctx, r.rx, r.edge, c);
  shaft(ctx, f, r.rx, r.edge, c);
};

// ---- the girl and her ice cream ----

const girl = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const r = roofOf(f);
  const x = r.rx - 48;
  const y = r.edge - 46 - SEAT + 3;
  const palette = paletteOf(c, girlPalette);
  const lick = sipOf(f.beat);
  drawGirl(ctx, f, POSES[alternate(f.beat)] as Sprite, palette, x, y, GIRL, lick > 0.8);
  const hx = Math.round(x + REST.x + (LICK.x - REST.x) * lick);
  const hy = Math.round(y + REST.y + (LICK.y - REST.y) * lick);
  limb(ctx, x + ELBOW.x, y + ELBOW.y, hx + 1, hy + 2, 2, c.skin, c.ink);
  drawSprite(ctx, CONE, palette, hx - 2, hy - 6);
  drawSprite(ctx, HAND, palette, hx - 1, hy);
  if (lick > 0.8) fillRect(ctx, c.para, x + 13, y + 21, 1, 1);
};

const front = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const r = roofOf(f);
  parasol(ctx, f, r.rx, r.edge, c);
};

export const mechaIcecream = defineScene<K>({
  id: 'mecha-icecream',
  title: 'Mech Break',
  mood: { valence: 0.5, energy: 0.1 },
  styles: ['nineties-pop', 'city-lights', 'grand-field', 'credits-roll', 'band-rock'],
  variants: [
    {
      mood: { valence: 0.5, energy: 0.1 },
      colors: {
        sky0: '#3a3a8a',
        sky1: '#8a4a9a',
        sky2: '#f0708a',
        sky3: '#ffb070',
        sun: '#ffd27a',
        sunHi: '#fff4c8',
        cloud: '#ffc8a0',
        cloudLo: '#d0708a',
        far: '#b0587e',
        mid: '#4a2a5e',
        win: '#ffd890',
        facade: '#5a3a6e',
        facadeHi: '#9a6a9a',
        mech: '#efe6d6',
        mechHi: '#ffffff',
        mechLo: '#b4a6a8',
        accent: '#38b8a8',
        accentLo: '#227a78',
        joint: '#3a3448',
        eye: '#7af8ff',
        para: '#ff7aa8',
        paraHi: '#fff0f4',
        ink: '#1e1424',
        skin: '#ffe0cc',
        skinLo: '#f0b096',
        blush: '#ff8a8a',
        hair: '#e8742c',
        hairHi: '#ffb468',
        hairLo: '#a03e1c',
        iris: '#3aa860',
        white: '#fffaf4',
        whiteLo: '#d8ccd0',
        suit: '#ff8a30',
        suitLo: '#c25a1c',
      },
    },
    {
      mood: { valence: 0.8, energy: 0.4 },
      colors: {
        sky0: '#8a9ee6',
        sky1: '#f2aabc',
        sky2: '#ffc070',
        sky3: '#fff0a0',
        sun: '#fff4b0',
        sunHi: '#ffffff',
        cloud: '#fff4e0',
        cloudLo: '#f0a8a0',
        far: '#d890a0',
        mid: '#7a4a7a',
        win: '#fff0b0',
        facade: '#8a5a7e',
        facadeHi: '#c898b0',
        mech: '#f6eee0',
        mechHi: '#ffffff',
        mechLo: '#c4b2b0',
        accent: '#3ac8b4',
        accentLo: '#24887e',
        joint: '#443a50',
        eye: '#8affff',
        para: '#ff6a9a',
        paraHi: '#fff6f8',
        ink: '#2a1a2a',
        skin: '#ffe4d2',
        skinLo: '#f4b49c',
        blush: '#ff8a8a',
        hair: '#ee7a30',
        hairHi: '#ffbe74',
        hairLo: '#a8441e',
        iris: '#2ab060',
        white: '#ffffff',
        whiteLo: '#e0d4d8',
        suit: '#ff9238',
        suitLo: '#cc6020',
      },
    },
    {
      mood: { valence: 0.1, energy: -0.3 },
      colors: {
        sky0: '#141a48',
        sky1: '#3a2a6e',
        sky2: '#8a3a7a',
        sky3: '#e86a6a',
        sun: '#ff9a6a',
        sunHi: '#ffd0a0',
        cloud: '#c8708a',
        cloudLo: '#5a2a6a',
        far: '#5a2a66',
        mid: '#22163e',
        win: '#ffcc70',
        facade: '#2c2048',
        facadeHi: '#5a4a7a',
        mech: '#d8cce0',
        mechHi: '#f4eefc',
        mechLo: '#8e84a8',
        accent: '#2aa0a0',
        accentLo: '#1a6070',
        joint: '#262238',
        eye: '#6af8ff',
        para: '#f06a9a',
        paraHi: '#f8dcec',
        ink: '#120c1e',
        skin: '#fadcd0',
        skinLo: '#e0a49a',
        blush: '#f07a90',
        hair: '#d0662e',
        hairHi: '#f8a066',
        hairLo: '#8a321e',
        iris: '#3a9a68',
        white: '#f6f0fa',
        whiteLo: '#bcb0cc',
        suit: '#e87a34',
        suitLo: '#a84c22',
      },
    },
  ],
  layers: [sky, clouds, mast, birds, robot, girl, front],
});
