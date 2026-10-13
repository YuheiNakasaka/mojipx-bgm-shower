// A shrine maiden plays a synthesizer under the torii on festival night: the lantern strings pulse with the beat,
// fox-fires circle her, and the shrine hall glows at the top of the steps behind the cedars.
import { type Ctx, drawSprite, fillRect, type Palette, type Sprite } from 'mojipx';
import { ditherGradient, rand, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { fillDither, pine } from './batch-1-helpers.ts';
import { drawGlow, memoLayer, moon } from './batch-2-helpers.ts';
import { paletteOf, sigOf } from './batch-3-helpers.ts';
import { alternate, drawGirl, type Girl, onBeat, wide } from './batch-7-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'star'
  | 'moon'
  | 'cedar'
  | 'hall'
  | 'warm'
  | 'stone'
  | 'stoneLo'
  | 'ground'
  | 'groundLo'
  | 'torii'
  | 'toriiLo'
  | 'toriiTop'
  | 'gold'
  | 'glow'
  | 'fox'
  | 'foxHi'
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
  | 'synth'
  | 'screen';

// ---- the shrine maiden: o outline, s/S skin, b blush, h/H/d hair, e/E eyes, w glint, m mouth,
// k/K fox mask, y/Y white robe, r/R red trousers, f sandals ----

const HEAD: Sprite = [
  '.........oooooooooo.........',
  '.......oohhhhhhhhhhoo.....o.',
  '......ohhhhhhhhhhhhoko..oko.',
  '.....ohhhHHHhhhhHHHokkookko.',
  '....ohhHHhhhhhhhhhhokKkkKko.',
  '...ohhHhhhhhhhhhhhhokkkkkko.',
  '...ohhhhhhhhhhhhhhhhokkkko..',
  '..ohhhhhhhhhhhhhhhhhhoKKoo..',
  '..ohhhhhhhhdhhhhdhhhhhooho..',
  '..ohhhhhdhhdhhhhdhhdhhhhho..',
  '.ohhhhhhdhhdhhhhdhhdhhhhhho.',
  '.ohhddddddddddddddddddddhho.',
  '.ohhdSooooSssssssSooooSdhho.',
  '.ohhdssweesssssssseewssdhho.',
  '.ohhdsseEesssssssseEessdhho.',
  '.ohhdssEEEssssssssEEEssdhho.',
  '.ohhdsbbbssssssssssbbbsdhho.',
  '.ohhdssssssssmmssssssssdhho.',
  '.ohhdoSssssssssssssssSodhho.',
  '.ohhd.oSssssssssssssSo.dhho.',
  '.ohhd..ooSssssssssSoo..dhho.',
  '.ohhd....oooooooooo....dhho.',
  '.ohhd..................dhho.',
  '.ohhd..................dhho.',
  '.oooo..................oooo.',
];

const BACK_A: Sprite = [
  '........oooooooooooooooo........',
  '.......ohhhhhhhhhhhhhhhho.......',
  '......ohhhhhhhhhhhhhhhhhho......',
  '......ohhhhhhhhhhhhhhhhhho......',
  '.....ohhhhhhhhhhhhhhhhhhhho.....',
  '.....ohhhhhhhhhhhhhhhhhhhho.....',
  '.....ohdhhhhhhhhhhhhhhhhdho.....',
  '.....ohdhhhhhhhhhhhhhhhhdho.....',
  '....ohhdhhhhhhhhhhhhhhhhdhho....',
  '....ohhdhhhhhhhhhhhhhhhhdhho....',
  '....ohhdhhhhhhhhhhhhhhhhdhho....',
  '....ohhdhhdhhhhhhhhhhdhhdhho....',
  '....ohhdhhdhhhhhhhhhhdhhdhho....',
  '....ohhdhhdhhhhhhhhhhdhhdhho....',
  '....ohhdhhdhhhhhhhhhhdhhdhho....',
  '....ohhdhhdhhhhhhhhhhdhhdhho....',
  '...ohhdhhdhhhhhhhhhhhhdhhdhho...',
  '...ohhdhhdhhhhhhhhhhhhdhhdhho...',
  '...ohhdhhdhhhhhhhhhhhhdhhdhho...',
  '...ohhdhhdhhhhhhhhhhhhdhhdhho...',
  '...ohhdhhdhhhhhhhhhhhhdhhdhho...',
  '...ohhdhhdhhhhhhhhhhhhdhhdhho...',
  '...ohhdhhdhhhhhhhhhhhhdhhdhho...',
  '...ohhdhhdhhhhhhhhhhhhdhhdhho...',
  '...ohhdhhdhhhhhhhhhhhhdhhdhho...',
  '...ohhdhhdhhhhhhhhhhhhdhhdhho...',
  '...ohhdhhdhhhhhhhhhhhhdhhdhho...',
  '...ohhdhhdhhhhhhhhhhhhdhhdhho...',
  '...ohdhhdhhhhhhhhhhhhhhdhhdho...',
  '...ohdhhdhhhhhhhhhhhhhhdhhdho...',
  '...ohdhhdhhhhhhhhhhhhhhdhhdho...',
  '...ohdhhohhhhhhhhhhhhhhohhdho...',
  '....odho.ohhhhhhhhhhhho.ohdo....',
  '....oo....ohhhhhhhhhho....oo....',
  '...........oooooooooo...........',
];

// The same hair with its ends swung a little to one side.
const BACK_B: Sprite = [
  '........oooooooooooooooo........',
  '.......ohhhhhhhhhhhhhhhho.......',
  '......ohhhhhhhhhhhhhhhhhho......',
  '......ohhhhhhhhhhhhhhhhhho......',
  '.....ohhhhhhhhhhhhhhhhhhhho.....',
  '.....ohhhhhhhhhhhhhhhhhhhho.....',
  '.....ohdhhhhhhhhhhhhhhhhdho.....',
  '.....ohdhhhhhhhhhhhhhhhhdho.....',
  '....ohhdhhhhhhhhhhhhhhhhdhho....',
  '....ohhdhhhhhhhhhhhhhhhhdhho....',
  '....ohhdhhhhhhhhhhhhhhhhdhho....',
  '....ohhdhhdhhhhhhhhhhdhhdhho....',
  '....ohhdhhdhhhhhhhhhhdhhdhho....',
  '....ohhdhhdhhhhhhhhhhdhhdhho....',
  '....ohhdhhdhhhhhhhhhhdhhdhho....',
  '....ohhdhhdhhhhhhhhhhdhhdhho....',
  '...ohhdhhdhhhhhhhhhhhhdhhdhho...',
  '...ohhdhhdhhhhhhhhhhhhdhhdhho...',
  '...ohhdhhdhhhhhhhhhhhhdhhdhho...',
  '...ohhdhhdhhhhhhhhhhhhdhhdhho...',
  '....ohhdhhdhhhhhhhhhhhhdhhdhho..',
  '....ohhdhhdhhhhhhhhhhhhdhhdhho..',
  '....ohhdhhdhhhhhhhhhhhhdhhdhho..',
  '....ohhdhhdhhhhhhhhhhhhdhhdhho..',
  '....ohhdhhdhhhhhhhhhhhhdhhdhho..',
  '....ohhdhhdhhhhhhhhhhhhdhhdhho..',
  '....ohhdhhdhhhhhhhhhhhhdhhdhho..',
  '....ohhdhhdhhhhhhhhhhhhdhhdhho..',
  '....ohdhhdhhhhhhhhhhhhhhdhhdho..',
  '.....ohdhhdhhhhhhhhhhhhhhdhhdho.',
  '.....ohdhhdhhhhhhhhhhhhhhdhhdho.',
  '.....ohdhhohhhhhhhhhhhhhhohhdho.',
  '......odho.ohhhhhhhhhhhho.ohdo..',
  '......oo....ohhhhhhhhhho....oo..',
  '.............oooooooooo.........',
];

const BODY: Sprite = [
  '...........oSSSSo...........',
  '...........osssso...........',
  '.......ooyyYssssYyyoo.......',
  '.....ooyyyyyYssYyyyyyoo.....',
  '....oyyyyyyyyYYyyyyyyyyo....',
  '...oYyyyyyyyyYYyyyyyyyyYo...',
  '..oYyyyyYyyyyyyyyyyYyyyyYo..',
  '..oYyyyyYyyyyyyyyyyYyyyyYo..',
  '.oYyyyyyYyyyyyyyyyyYyyyyyYo.',
  '.oYyyyyyYyyyyyyyyyyYyyyyyYo.',
  '.oYyyyyyYrrrrrrrrrrYyyyyyYo.',
  '.oYyyyyyYrRrrrrrrRrYyyyyyYo.',
  '.oYYyyyyoYrrrrrrrrYoyyyyYYo.',
  '..oYYYYooYrrrrrrrrYooYYYYo..',
  '...oooo.oYrRrrrrRrYo.oooo...',
  '........oYrrRrrRrrYo........',
  '........orrrRrrRrrro........',
  '.......orRrrRrrRrrRro.......',
  '.......orRrrRrrRrrRro.......',
  '.......orRrrRrrRrrRro.......',
  '......orRrrrRrrRrrrRro......',
  '......orRrrrRrrRrrrRro......',
  '......orRrrrRrrRrrrRro......',
  '.....orRrrrrRrrRrrrrRro.....',
  '.....orRrrrrRrrRrrrrRro.....',
  '.....orRrrrrRrrRrrrrRro.....',
  '.....orRrrrrRrrRrrrrRro.....',
  '.....oRRRRRRRooRRRRRRRo.....',
  '.......oooo......oooo.......',
  '.......owwo......owwo.......',
  '......offffo....offffo......',
  '......oooooo....oooooo......',
];

const HAND: Sprite = ['.oo.', 'osso', 'oSSo'];

const GIRL: Girl = {
  eyes: [
    { x: 7, y: 12, out: -1 },
    { x: 18, y: 12, out: 1 },
  ],
  seed: 47,
};
const GIRL_H = 53;

// A paper lantern: k caps, l paper, L lit paper, c candle.
const LANTERN: Sprite = ['.kkk.', 'lLLLl', 'LLcLL', 'lLLLl', 'lLLLl', '.kkk.', '..k..'];

// A fox-fire in two flickers: f flame, F bright, W core.
const WISP_A: Sprite = ['..f..', '.fF..', '.fFf.', 'fFWFf', 'fFWWf', '.fFf.', '..f..'];
const WISP_B: Sprite = ['...f.', '..Ff.', '.fFf.', 'fFWFf', 'fWWFf', '.fFf.', '..f..'];

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
  m: c.toriiLo,
  k: c.white,
  K: c.torii,
  y: c.white,
  Y: c.whiteLo,
  r: c.torii,
  R: c.toriiLo,
  f: c.toriiTop,
});
const lanternPalette = (c: Colors<K>): Palette => ({ k: c.toriiTop, l: c.torii, L: c.warm, c: c.white });
const dimLanternPalette = (c: Colors<K>): Palette => ({ k: c.toriiTop, l: c.toriiLo, L: c.torii, c: c.warm });
const wispPalette = (c: Colors<K>): Palette => ({ f: c.fox, F: c.foxHi, W: c.white });

// ---- layout ----

type Stage = {
  readonly ground: number;
  readonly cx: number;
  /** Half the distance between the torii's pillars, and the top of its upper beam. */
  readonly span: number;
  readonly beam: number;
  readonly girlY: number;
  readonly keys: number;
};

const stageOf = (f: Frame): Stage => {
  const ground = Math.round(f.h * (wide(f) ? 0.86 : 0.83));
  const girlY = ground - GIRL_H;
  return {
    ground,
    cx: Math.round(f.w / 2),
    span: Math.round(wide(f) ? f.w * 0.29 : f.w * 0.4),
    beam: Math.round(f.h * (wide(f) ? 0.1 : 0.2)),
    girlY,
    keys: girlY + 21 + 12,
  };
};

// ---- the shrine behind ----

const paintHall = (g: Ctx, cx: number, base: number, hw: number, c: Colors<K>): void => {
  const roof = Math.round(hw * 0.5);
  const body = Math.round(hw * 0.32);
  fillRect(g, c.hall, cx - hw + 6, base - body, (hw - 6) * 2, body);
  for (let x = cx - hw + 9; x < cx + hw - 9; x += 7) fillRect(g, c.warm, x, base - body + 4, 5, body - 6);
  for (let x = cx - hw + 8; x < cx + hw - 8; x += 7) fillRect(g, c.hall, x + 2, base - body + 4, 1, body - 6);
  for (let r = 0; r < roof; r++) {
    const u = r / roof;
    const half = Math.round(hw * (0.45 + 0.55 * u ** 0.8) + (u > 0.85 ? (u - 0.85) * 20 : 0));
    fillRect(g, c.hall, cx - half, base - body - roof + r, half * 2, 1);
  }
  fillRect(g, c.stoneLo, cx - hw - 2, base - body - 2, 4, 1);
  fillRect(g, c.stoneLo, cx + hw - 2, base - body - 2, 4, 1);
  fillRect(g, c.stoneLo, cx - Math.round(hw * 0.45), base - body - roof, Math.round(hw * 0.9), 1);
};

const paintSteps = (g: Ctx, cx: number, top: number, bottom: number, hw: number, c: Colors<K>): void => {
  for (let y = top; y < bottom; y++) {
    const u = (y - top) / Math.max(1, bottom - top);
    const half = Math.round(hw * (0.3 + 0.5 * u));
    fillRect(g, (y - top) % 3 === 0 ? c.stone : c.stoneLo, cx - half, y, half * 2, 1);
  }
};

const paintGround = (g: Ctx, w: number, h: number, ground: number, c: Colors<K>): void => {
  const horizon = ground - Math.round(h * 0.12);
  fillRect(g, c.ground, 0, horizon, w, h - horizon);
  for (let y = horizon + 2, k = 1; y < h; y += k + 1, k++) {
    fillRect(g, c.groundLo, 0, y, w, 1);
    for (let x = (k % 2) * 6; x < w; x += 12 + k * 2) fillRect(g, c.groundLo, x, y - k, 1, k);
  }
};

// Where things stand in the background: the foot of the cedars and of the hall, and the hall's half width.
type Grounds = {
  readonly f: Frame;
  readonly s: Stage;
  readonly short: number;
  readonly trees: number;
  readonly hall: number;
  readonly hw: number;
};

const groundsOf = (f: Frame): Grounds => {
  const s = stageOf(f);
  const short = Math.min(f.w, f.h);
  const trees = s.ground - Math.round(f.h * 0.1);
  return { f, s, short, trees, hall: trees - Math.round(short * 0.08), hw: Math.round(short * 0.22) };
};

// The moon hangs framed by the gate, above the hall and between the cedars.
const paintNight = (g: Ctx, at: Grounds, c: Colors<K>): void => {
  const { f, s, short } = at;
  g.drawImage(ditherGradient(f.w, s.ground, [c.sky0, c.sky1, c.sky2]), 0, 0);
  const r = Math.round(short * 0.075);
  const my = Math.round((s.beam + 20 + at.trees - short * 0.26) / 2);
  drawGlow(g, s.cx, my, r * 3, c.sky2, 0.6);
  moon(g, s.cx, my, r, c.moon, c.whiteLo);
};

const paintCedars = (g: Ctx, at: Grounds, c: Colors<K>): void => {
  for (let i = 0; i < 9; i++) {
    const x = at.f.w * (i < 5 ? i * 0.07 : 1 - (i - 5) * 0.07) + (rand(i, 3) - 0.5) * 10;
    pine(g, x, at.trees, at.short * (0.5 + rand(i, 4) * 0.25), c.cedar);
  }
};

const paintShrine = (g: Ctx, at: Grounds, c: Colors<K>): void => {
  paintHall(g, at.s.cx, at.hall, at.hw, c);
  paintSteps(g, at.s.cx, at.hall, at.s.ground - Math.round(at.f.h * 0.12), at.hw, c);
};

const paintYard = (g: Ctx, at: Grounds, c: Colors<K>): void => paintGround(g, at.f.w, at.f.h, at.s.ground, c);

const PAINTERS = [paintNight, paintCedars, paintShrine, paintYard] as const;

const backLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`ss-back:${sigOf(c)}`, f.w, f.h, (g) => {
    const at = groundsOf(f);
    for (const paint of PAINTERS) paint(g, at, c);
  });

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(backLayer(f, c), 0, 0);
  stars(ctx, f.w, Math.round(f.h * 0.5), f.t, [c.star], Math.round(f.w / 6), 53, 1);
};

// ---- the torii ----

const paintTorii = (g: Ctx, s: Stage, c: Colors<K>): void => {
  const left = s.cx - s.span;
  const right = s.cx + s.span;
  const pw = 7;
  const reach = s.span + 18;
  for (let x = -reach; x <= reach; x++) {
    const lift = Math.round((Math.abs(x) / reach) ** 4 * 5);
    fillRect(g, c.toriiTop, s.cx + x, s.beam - lift, 1, 3);
    fillRect(g, c.torii, s.cx + x, s.beam + 3 - lift, 1, 4);
    fillRect(g, c.toriiLo, s.cx + x, s.beam + 6 - lift, 1, 1);
  }
  const nuki = s.beam + 16;
  fillRect(g, c.torii, left - 10, nuki, right - left + 20, 4);
  fillRect(g, c.toriiLo, left - 10, nuki + 3, right - left + 20, 1);
  fillRect(g, c.torii, s.cx - 2, s.beam + 7, 4, 9);
  fillRect(g, c.toriiTop, s.cx - 6, s.beam + 6, 12, 12);
  fillRect(g, c.gold, s.cx - 5, s.beam + 7, 10, 10);
  fillRect(g, c.toriiTop, s.cx - 4, s.beam + 8, 8, 8);
  fillRect(g, c.gold, s.cx - 2, s.beam + 9, 3, 2);
  fillRect(g, c.gold, s.cx - 1, s.beam + 12, 2, 3);
  for (const x of [left, right]) {
    fillRect(g, c.torii, x - (pw >> 1), s.beam + 7, pw, s.ground - s.beam - 7);
    fillRect(g, c.toriiLo, x + (pw >> 1) - 1, s.beam + 7, 2, s.ground - s.beam - 7);
    fillRect(g, c.toriiTop, x - (pw >> 1) - 1, s.ground - 7, pw + 2, 7);
  }
};

const toriiLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`ss-torii:${sigOf(c)}`, f.w, f.h, (g) => paintTorii(g, stageOf(f), c));

const torii = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(toriiLayer(f, c), 0, 0);
};

// ---- lanterns: strings of paper lanterns that light up in turn on the beat, and stone lanterns ----

type Run = { readonly x0: number; readonly y0: number; readonly x1: number; readonly y1: number; readonly sag: number };

const runsOf = (f: Frame, s: Stage): readonly Run[] => {
  const y = s.beam + 18;
  const left = s.cx - s.span;
  const right = s.cx + s.span;
  return [
    { x0: left, y0: y, x1: right, y1: y, sag: 14 },
    { x0: left, y0: y, x1: -20, y1: y - 8, sag: 16 },
    { x0: right, y0: y, x1: f.w + 20, y1: y - 8, sag: 16 },
  ];
};

const lanternRun = (ctx: Ctx, f: Frame, c: Colors<K>, run: Run, seed: number): void => {
  const len = Math.hypot(run.x1 - run.x0, run.y1 - run.y0);
  const count = Math.floor(len / 12);
  const beat = Math.floor(f.beat);
  for (let k = 0; k <= Math.ceil(len); k += 1) {
    const u = k / Math.max(1, len);
    fillRect(
      ctx,
      c.toriiTop,
      Math.round(run.x0 + (run.x1 - run.x0) * u),
      Math.round(run.y0 + (run.y1 - run.y0) * u + Math.sin(u * Math.PI) * run.sag),
      1,
      1,
    );
  }
  for (let i = 1; i < count; i++) {
    const u = i / count;
    const x = Math.round(run.x0 + (run.x1 - run.x0) * u) - 2;
    const y = Math.round(run.y0 + (run.y1 - run.y0) * u + Math.sin(u * Math.PI) * run.sag) + 1;
    const lit = (i + seed + beat) % 3 !== 0;
    if (lit) drawGlow(ctx, x + 2, y + 3, 7, c.glow, f.kick > 0.5 ? 0.6 : 0.4);
    drawSprite(ctx, LANTERN, paletteOf(c, lit ? lanternPalette : dimLanternPalette), x, y);
  }
};

const lanterns = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const s = stageOf(f);
  runsOf(f, s).forEach((run, i) => {
    lanternRun(ctx, f, c, run, i);
  });
};

const stoneLantern = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, ground: number): void => {
  const flicker = rand(Math.floor(f.t * 8), x) < 0.2 ? 0.35 : 0.5;
  drawGlow(ctx, x, ground - 17, 14, c.glow, flicker);
  fillRect(ctx, c.stoneLo, x - 6, ground - 3, 13, 3);
  fillRect(ctx, c.stone, x - 2, ground - 12, 5, 9);
  fillRect(ctx, c.stoneLo, x + 1, ground - 12, 2, 9);
  fillRect(ctx, c.stone, x - 4, ground - 14, 9, 2);
  fillRect(ctx, c.stone, x - 3, ground - 20, 7, 6);
  fillRect(ctx, c.warm, x - 1, ground - 19, 3, 4);
  fillRect(ctx, c.white, x, ground - 18, 1, 2);
  fillRect(ctx, c.stone, x - 6, ground - 23, 13, 3);
  fillRect(ctx, c.stoneLo, x - 4, ground - 25, 9, 2);
  fillRect(ctx, c.stone, x - 1, ground - 27, 3, 2);
};

const stoneLanterns = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const s = stageOf(f);
  const off = s.span + (wide(f) ? 26 : 2);
  if (wide(f)) {
    stoneLantern(ctx, f, c, s.cx - off, s.ground + 4);
    stoneLantern(ctx, f, c, s.cx + off, s.ground + 4);
    return;
  }
  stoneLantern(ctx, f, c, s.cx - off + 10, f.h - 8);
  stoneLantern(ctx, f, c, s.cx + off - 10, f.h - 8);
};

// ---- fox-fires circling her: the ones behind her are drawn before her, the rest after ----

const wisps = (ctx: Ctx, f: Frame, c: Colors<K>, front: boolean): void => {
  const s = stageOf(f);
  const rx = Math.min(f.w * 0.36, 70);
  const cy = s.girlY + 22;
  for (let i = 0; i < 6; i++) {
    const a = f.t * 0.55 + (i / 6) * Math.PI * 2;
    if (Math.sin(a) > 0 !== front) continue;
    const hop = onBeat(f.beat + i * 0.25, 0.3) * 2;
    const x = Math.round(s.cx + Math.cos(a) * rx);
    const y = Math.round(cy + Math.sin(a) * 14 + Math.sin(f.t * 1.7 + i) * 4 - hop);
    drawGlow(ctx, x + 2, y + 4, 9, c.fox, 0.45);
    drawSprite(ctx, (Math.floor(f.t * 6) + i) % 2 === 0 ? WISP_A : WISP_B, paletteOf(c, wispPalette), x, y);
  }
};

const wispsBack = (ctx: Ctx, f: Frame, c: Colors<K>): void => wisps(ctx, f, c, false);
const wispsFront = (ctx: Ctx, f: Frame, c: Colors<K>): void => wisps(ctx, f, c, true);

// ---- the girl at her synthesizer ----

const girl = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const s = stageOf(f);
  const x = s.cx - 16;
  const palette = paletteOf(c, girlPalette);
  fillDither(ctx, c.ink, 0.5, s.cx - 16, s.ground - 2, 32, 3);
  drawSprite(ctx, alternate(f.beat, 2) === 0 ? BACK_A : BACK_B, palette, x, s.girlY + 8);
  drawSprite(ctx, BODY, palette, x + 2, s.girlY + 21);
  drawGirl(ctx, f, HEAD, palette, x + 2, s.girlY + onBeat(f.beat, 0.2), GIRL);
};

const synth = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const s = stageOf(f);
  const x = s.cx - 24;
  const y = s.keys;
  for (let k = 0; k < s.ground - y - 5; k++) {
    const u = k / (s.ground - y - 5);
    fillRect(ctx, c.stoneLo, Math.round(s.cx - 12 + u * 24), y + 5 + k, 1, 1);
    fillRect(ctx, c.stoneLo, Math.round(s.cx + 12 - u * 24), y + 5 + k, 1, 1);
  }
  drawGlow(ctx, x + 5, y - 2, 10, c.screen, 0.35);
  fillRect(ctx, c.ink, x - 1, y - 1, 50, 7);
  fillRect(ctx, c.synth, x, y, 48, 5);
  fillRect(ctx, c.white, x + 10, y + 1, 37, 2);
  for (let k = x + 11; k < x + 47; k += 2) if ((k - x) % 7 !== 3) fillRect(ctx, c.ink, k, y + 1, 1, 1);
  fillRect(ctx, c.screen, x + 2, y + 1, 6, 2);
  fillRect(ctx, c.white, x + 2 + (Math.floor(f.beat * 2) % 6), y + 1, 1, 1);
  fillRect(ctx, c.foxHi, x + 3, y + 3, 1, 1);
  fillRect(ctx, c.foxHi, x + 6, y + 3, 1, 1);
};

// Her hands play: the left keeps the pulse, the right climbs an arpeggio, a step every half beat.
const hands = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const s = stageOf(f);
  const palette = paletteOf(c, girlPalette);
  const step = Math.floor(f.beat * 2) % 4;
  drawSprite(ctx, HAND, palette, s.cx - 12, s.keys - 2 + onBeat(f.beat, 0.25));
  drawSprite(ctx, HAND, palette, s.cx + 4 + step * 3, s.keys - 2 + onBeat(f.beat * 2, 0.3));
};

export const shrineSynth = defineScene<K>({
  id: 'shrine-synth',
  title: 'Shrine Synth',
  mood: { valence: -0.2, energy: 0.4 },
  styles: ['summer-festival', 'neon-rush', 'starlit-dream', 'deep-dungeon', 'technopop', 'trance-pop'],
  variants: [
    {
      mood: { valence: -0.2, energy: 0.4 },
      colors: {
        sky0: '#070a24',
        sky1: '#151a4a',
        sky2: '#2e2a66',
        star: '#cfd6ff',
        moon: '#f4f0d8',
        cedar: '#0a0e26',
        hall: '#120f2c',
        warm: '#ffb04a',
        stone: '#5a5a7c',
        stoneLo: '#3a3a5a',
        ground: '#2a2a48',
        groundLo: '#1e1e38',
        torii: '#e8402e',
        toriiLo: '#9a2028',
        toriiTop: '#1a1420',
        gold: '#f0c050',
        glow: '#ff9a40',
        fox: '#3ac8ff',
        foxHi: '#a8f0ff',
        ink: '#110c1e',
        skin: '#ffe4d4',
        skinLo: '#eeb4a2',
        blush: '#ff8a9a',
        hair: '#d4ccf0',
        hairHi: '#f8f6ff',
        hairLo: '#9486c4',
        iris: '#ffae2a',
        white: '#fbfaff',
        whiteLo: '#bcb8da',
        synth: '#2a2838',
        screen: '#3af0e0',
      },
    },
    {
      mood: { valence: 0.3, energy: 0.6 },
      colors: {
        sky0: '#1a0a36',
        sky1: '#4a1a5e',
        sky2: '#a8406a',
        star: '#ffd8f0',
        moon: '#fff2d8',
        cedar: '#1a0a28',
        hall: '#240c30',
        warm: '#ffc060',
        stone: '#7a5a84',
        stoneLo: '#523c62',
        ground: '#3e2848',
        groundLo: '#2c1c38',
        torii: '#ff4a36',
        toriiLo: '#a82230',
        toriiTop: '#1e1018',
        gold: '#ffd060',
        glow: '#ffa048',
        fox: '#7ab8ff',
        foxHi: '#d8eaff',
        ink: '#170c1c',
        skin: '#ffe2d0',
        skinLo: '#f0b09c',
        blush: '#ff7e98',
        hair: '#dccff4',
        hairHi: '#fbf8ff',
        hairLo: '#9a84c8',
        iris: '#ffb432',
        white: '#fffaff',
        whiteLo: '#c8bcdc',
        synth: '#2e2034',
        screen: '#ff7ad8',
      },
    },
    {
      mood: { valence: -0.6, energy: 0.1 },
      colors: {
        sky0: '#020c10',
        sky1: '#0a2228',
        sky2: '#164040',
        star: '#c8fff0',
        moon: '#e0fff4',
        cedar: '#03100f',
        hall: '#061616',
        warm: '#e8b860',
        stone: '#46625e',
        stoneLo: '#2c4442',
        ground: '#1a2e2e',
        groundLo: '#102222',
        torii: '#c83a30',
        toriiLo: '#7a1e22',
        toriiTop: '#0c0e10',
        gold: '#d8b850',
        glow: '#e8904a',
        fox: '#5affb0',
        foxHi: '#c8ffe8',
        ink: '#060e10',
        skin: '#fbe2d4',
        skinLo: '#e2aa9c',
        blush: '#f08896',
        hair: '#cfe0e8',
        hairHi: '#f4fcff',
        hairLo: '#86a2b4',
        iris: '#f0a02a',
        white: '#f4fbff',
        whiteLo: '#a8c0c8',
        synth: '#1c2428',
        screen: '#5affb0',
      },
    },
  ],
  layers: [sky, torii, lanterns, stoneLanterns, wispsBack, girl, synth, hands, wispsFront],
});
