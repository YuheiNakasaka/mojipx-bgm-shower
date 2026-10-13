// A fishing game at sunrise: a girl in a bucket hat and a yellow raincoat casts from a wooden pier on a misty mountain
// lake; the float bobs on the beat, a fish bites, the tension meter swings while she reels, and the catch leaps out.
import { type Ctx, drawSprite, fillRect, flipped, type Palette, type Point, type Sprite } from 'mojipx';
import { ditherGradient, frac, rand, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { driftingClouds, fillDither, flock, paintRange, wrap } from './batch-1-helpers.ts';
import { paletteOf, sigOf } from './batch-3-helpers.ts';
import { drawText, sunWithHalo, textWidth, tinted } from './batch-4-helpers.ts';
import { BIRD, isDark } from './batch-5-helpers.ts';
import { glints, mirrorWater, ring } from './batch-6-helpers.ts';
import { blinking } from './batch-7-helpers.ts';
import { digits, popup } from './batch-8-helpers.ts';
import { memoLayer } from './batch-12-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sky3'
  | 'sun'
  | 'cloud'
  | 'cloudLo'
  | 'far'
  | 'farLit'
  | 'farShade'
  | 'near'
  | 'pine'
  | 'mist'
  | 'water'
  | 'glint'
  | 'deck'
  | 'deckLo'
  | 'post'
  | 'line'
  | 'float'
  | 'shadow'
  | 'ui'
  | 'uiHi'
  | 'text'
  | 'tint'
  | 'ink';

// ---- the girl, facing the water ----

const E4 = ['oooo', 'wwee', 'weee', 'eiie', 'oiio'];
const E3 = ['ooo', 'wee', 'eee', 'eie', 'oio'];
const LOCKS = ['aaaaAaaaa', 'aaaAaaaAa', 'aaaAaaaAa', 'aaAaaaAaa', 'aaAaaaAaa'];

const ANGLER: Sprite = [
  '..........oooooo............',
  '........oottttttoo..........',
  '.......otttttttttto.........',
  '......ottttttttttTto........',
  '......otttttttttTTTo........',
  '.....oBBBBBBBBBBBBBBo.......',
  '...oottttttttttttttttoo.....',
  '..ottTTTTTTTTTTTTTTTTTtoo...',
  '.otTToooooooooooooooooTTo...',
  '.ooo.oaaaaaaaaaaaaaaaaoooo..',
  '...oaaLLLaaaaaaaaaaaaaso....',
  '...oaLLaaaaaAaaaasssaasso...',
  ...LOCKS.map((h, i) => `...o${h}ss${E4[i]}ss${E3[i]}so..`),
  '...oaaAaaaAaasssbbssssbbso..',
  '...oaaAaaAAaassssssssosso...',
  '...oaAaaoAaaosssssssssso....',
  '....oaoaoaAo.oossssoo.......',
  '.....o.o.oo...osso..........',
  '.........oyyooyyyyoo........',
  '........oyyyyyyyyyyyo.......',
  '........oyyyYyynnyyyo.......',
  '........oyyyYyynNyyyyo......',
  '........oyyyYyynnyyyysso....',
  '........oyyyYyynNyyoossso...',
  '........oyyyYyynnyyyyooo....',
  '........oyyyYyynNyyyyo......',
  '........oyyYYyynnyyyyo......',
  '........oyyYyyyddyyyyo......',
  '.......oyyYyyyyddyyyyyo.....',
  '.......oyyYyyydddyyyyyo.....',
  '.......oyYYyyyoooYyyyyo.....',
  '.......ooooooo...ooooooo....',
  '..........oso....oso........',
  '..........oso....oso........',
  '..........oso....oso........',
  '.........orro...orro........',
  '.........orRro..orRro.......',
  '.........ooooo..ooooo.......',
];
const HAND_X = 23;
const HAND_Y = 26;
const NEAR_EYE = { x: 15, y: 12 };
const FAR_EYE = { x: 21, y: 12 };

const ANGLER_COLORS: Palette = {
  o: '#2a1c2a',
  t: '#f4ead0',
  T: '#c8b898',
  B: '#e86a4a',
  a: '#5ad0d0',
  A: '#2a8aa0',
  L: '#b8fff4',
  s: '#ffe2cc',
  e: '#2a2040',
  i: '#3a6ab0',
  w: '#ffffff',
  b: '#ff9aa8',
  y: '#ffd23a',
  Y: '#e0a01e',
  n: '#2a3a6a',
  N: '#f0f0f8',
  d: '#4a6ab0',
  r: '#e04a4a',
  R: '#a02a3a',
};

const FISH: Sprite = [
  '.....oooo.......',
  '...oobbbbooo..oo',
  '..obbbbbbbbbooko',
  '.obkwbsbbbbbbkko',
  'oobbbbbbsbbbboko',
  '.olllllllllloo.o',
  '..oollllllloo...',
  '....ooooooo.....',
];
// Three kinds of fish: a pink-striped trout, a golden carp, a blue char.
const FISH_KINDS: readonly Palette[] = [
  { o: '#1e2030', b: '#8aa0b8', s: '#ff8aa0', l: '#e8eef4', k: '#5a6a88', w: '#ffffff' },
  { o: '#2a1a10', b: '#f0b040', s: '#ffe080', l: '#fff4d0', k: '#c87a20', w: '#ffffff' },
  { o: '#141c30', b: '#4a7ac8', s: '#a8d8ff', l: '#e0f0ff', k: '#2a4a8a', w: '#ffffff' },
];

const anglerColors = (c: Colors<K>): Palette => tinted(ANGLER_COLORS, c.tint, 0.16);

// ---- the round: sixteen beats from waiting to the catch ----

type Phase = 'wait' | 'nibble' | 'reel' | 'catch';
type Round = { readonly phase: Phase; readonly at: number; readonly n: number };

const ROUND = 16;
const roundOf = (beat: number): Round => {
  const b = Math.max(0, beat);
  const n = Math.floor(b / ROUND);
  const at = b - n * ROUND;
  const phase: Phase = at < 7 ? 'wait' : at < 9 ? 'nibble' : at < 14 ? 'reel' : 'catch';
  return { phase, at, n };
};
const fishSize = (n: number): number => 18 + Math.floor(rand(n, 5) * 30);

// ---- layout ----

type Layout = {
  readonly horizon: number;
  readonly deck: number;
  readonly pierEnd: number;
  readonly girlX: number;
  readonly floatX: number;
  readonly floatY: number;
  readonly sunX: number;
};

const layoutOf = (f: Frame): Layout => {
  const wide = f.w > f.h;
  const horizon = Math.round(f.h * (wide ? 0.5 : 0.52));
  const deck = Math.round(f.h * (wide ? 0.68 : 0.64));
  const pierEnd = Math.round(f.w * (wide ? 0.42 : 0.56));
  return {
    horizon,
    deck,
    pierEnd,
    girlX: pierEnd - (wide ? 34 : 30),
    floatX: Math.round(f.w * (wide ? 0.72 : 0.84)),
    floatY: Math.round(deck + (f.h - deck) * 0.35),
    sunX: Math.round(f.w * (wide ? 0.64 : 0.36)),
  };
};

// ---- sky, mountains and the lake ----

const SNOW = 0.32;

// Snowy peaks catching the first light, their feet lost in a bank of mist.
const peaks = (g: Ctx, f: Frame, horizon: number, c: Colors<K>): void => {
  const height = Math.round(f.h * 0.2);
  paintRange(g, f.w, horizon - 4, height, 31, { rock: c.far, lit: c.farLit, shade: c.farShade }, SNOW);
  const bank = Math.round(height * 0.35);
  fillDither(g, c.mist, 0.5, 0, horizon - bank, f.w, bank);
};

const backdrop = (f: Frame, l: Layout, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`pier-sky:${sigOf(c)}`, f.w, l.horizon, (g) => {
    const sky = ditherGradient(f.w, l.horizon, [c.sky0, c.sky1, c.sky2, c.sky3]);
    g.drawImage(sky, 0, 0);
    sunWithHalo(g, l.sunX, l.horizon - Math.round(f.h * 0.1), Math.round(f.h * 0.05), c.sun, c.sun, 3.6);
    peaks(g, f, l.horizon, c);
    treeline(g, f.w, l.horizon, c);
  });

const treeline = (g: Ctx, w: number, horizon: number, c: Colors<K>): void => {
  g.fillStyle = c.near;
  for (let x = 0; x < w; x++) {
    const h = 5 + Math.round(Math.sin(x * 0.045) * 3 + Math.sin(x * 0.13) * 2);
    g.fillRect(x, horizon - h, 1, h);
  }
  for (let i = 0; i < w / 5; i++) {
    const x = Math.round(i * 5 + rand(i, 41) * 4);
    const h = 6 + Math.round(rand(i, 42) * 7);
    for (let r = 0; r < h; r++) {
      const half = Math.round((r / h) * 2.5);
      g.fillStyle = c.pine;
      g.fillRect(x - half, horizon - 4 - h + r, half * 2 + 1, 1);
    }
  }
};

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  ctx.drawImage(backdrop(f, l, c), 0, 0);
  if (isDark(c.sky0)) stars(ctx, f.w, l.horizon, f.t, [c.glint, c.sun], 40, 13, 0.6);
};

const clouds = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  driftingClouds(ctx, f, c.cloud, c.cloudLo, { count: 4, top: l.horizon * 0.2, span: l.horizon * 0.35, size: 9, speed: 2.5, seed: 17 });
};

const birds = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  flock(ctx, f, BIRD, paletteOf(c, birdColors), { count: 3, top: l.horizon * 0.25, span: l.horizon * 0.2, speed: 7, seed: 23 });
};
const birdColors = (c: Colors<K>): Palette => ({ o: c.pine });

const lake = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  mirrorWater(ctx, f, { axis: l.horizon, bottom: f.h, squash: 1.3, amp: 1.6, freq: 0.7, speed: 1.6, tint: c.water, tintLevel: 0.35 });
  glints(ctx, f, l.horizon + 2, f.h, c.glint, 26, 7);
};

// Mist drifting low over the water, in two thin bands that slide past each other.
const mist = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  for (let band = 0; band < 3; band++) {
    const y = l.horizon - 3 + band * 7;
    for (let k = 0; k < 6; k++) {
      const w = 40 + rand(k, band) * 50;
      const x = wrap(rand(k, band + 9) * (f.w + w) + f.t * (2 + band * 1.5), f.w + w) - w;
      fillDither(ctx, c.mist, 0.35 - band * 0.08, x, y + Math.round(rand(k, band + 5) * 4), w, 3 + band);
    }
  }
};

// ---- the pier ----

const pierLayer = (f: Frame, l: Layout, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`pier-deck:${sigOf(c)}`, f.w, f.h, (g) => {
    for (let x = l.pierEnd - 6; x > -10; x -= 22) {
      fillRect(g, c.ink, x - 1, l.deck, 6, f.h - l.deck);
      fillRect(g, c.post, x, l.deck, 4, f.h - l.deck);
      fillDither(g, c.water, 0.5, x, l.horizon + (l.deck - l.horizon) + 18, 4, f.h);
    }
    fillRect(g, c.ink, -1, l.deck - 1, l.pierEnd + 2, 8);
    fillRect(g, c.deck, 0, l.deck, l.pierEnd, 3);
    fillRect(g, c.deckLo, 0, l.deck + 3, l.pierEnd, 3);
    for (let x = 4; x < l.pierEnd; x += 9) fillRect(g, c.deckLo, x, l.deck, 1, 3);
    bucket(g, l.girlX - 16, l.deck, c);
  });

const bucket = (g: Ctx, x: number, base: number, c: Colors<K>): void => {
  fillRect(g, c.ink, x - 1, base - 11, 12, 11);
  fillRect(g, c.float, x, base - 10, 10, 9);
  fillRect(g, c.glint, x + 1, base - 9, 2, 7);
  fillRect(g, c.ink, x, base - 13, 10, 1);
  fillRect(g, c.ink, x - 1, base - 12, 1, 1);
  fillRect(g, c.ink, x + 10, base - 12, 1, 1);
};

const pier = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(pierLayer(f, layoutOf(f), c), 0, 0);
};

// ---- rod, line and float ----

type Pt = Point;

const handOf = (l: Layout): Pt => ({ x: l.girlX - 14 + HAND_X, y: l.deck - ANGLER.length + HAND_Y });

/** Where the line meets the water: the float, or the fish pulling it about while she reels. */
const lineEnd = (f: Frame, l: Layout, r: Round): Pt => {
  if (r.phase !== 'reel') return { x: l.floatX, y: l.floatY };
  const pull = (r.at - 9) / 5;
  return { x: Math.round(l.floatX - pull * 30 + Math.sin(f.t * 5) * 6), y: l.floatY + Math.round(Math.sin(f.t * 7) * 2) };
};

const rodTip = (f: Frame, l: Layout, r: Round): Pt => {
  const hand = handOf(l);
  const bend = r.phase === 'reel' ? 8 + Math.round(f.kick * 4) : r.phase === 'catch' ? -2 : 0;
  return { x: hand.x + 26 - Math.round(bend * 0.4), y: hand.y - 30 + bend };
};

const rod = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const r = roundOf(f.beat);
  const hand = handOf(l);
  const tip = rodTip(f, l, r);
  const bow = r.phase === 'reel' ? 5 : 1;
  for (let k = 0; k <= 30; k++) {
    const u = k / 30;
    const x = hand.x + (tip.x - hand.x) * u + Math.sin(u * Math.PI) * bow * 0.6;
    const y = hand.y + (tip.y - hand.y) * u + u * u * bow;
    fillRect(ctx, k < 8 ? c.ink : c.deckLo, Math.round(x), Math.round(y), k < 8 ? 2 : 1, 1);
  }
  fishingLine(ctx, tip, lineEnd(f, l, r), r, c);
};

const fishingLine = (ctx: Ctx, tip: Pt, end: Pt, r: Round, c: Colors<K>): void => {
  const sag = r.phase === 'reel' ? 1 : 10;
  const steps = Math.max(8, Math.round(Math.hypot(end.x - tip.x, end.y - tip.y)));
  for (let k = 0; k <= steps; k++) {
    const u = k / steps;
    const x = tip.x + (end.x - tip.x) * u;
    const y = tip.y + (end.y - tip.y) * u + Math.sin(u * Math.PI) * sag;
    if (k % 2 === 0 || r.phase === 'reel') fillRect(ctx, c.line, Math.round(x), Math.round(y), 1, 1);
  }
};

// The float sits on the water and bobs with the beat; nibbles tug it down, the bite pulls it under.
const floatDip = (f: Frame, r: Round): number => {
  if (r.phase === 'wait') return frac(f.beat) < 0.2 ? 1 : 0;
  if (r.phase === 'nibble') return frac(f.beat) < 0.3 ? 3 : 0;
  return 0;
};

const float = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const r = roundOf(f.beat);
  if (r.phase === 'reel' || r.phase === 'catch') {
    splash(ctx, f, lineEnd(f, l, r), r, c);
    return;
  }
  const y = l.floatY + floatDip(f, r);
  ring(ctx, l.floatX, l.floatY + 2, 3 + frac(f.beat) * 6, 0.3, c.glint);
  fillRect(ctx, c.ink, l.floatX - 2, y - 5, 5, 7);
  fillRect(ctx, c.float, l.floatX - 1, y - 4, 3, 3);
  fillRect(ctx, c.text, l.floatX - 1, y - 1, 3, 2);
  fillRect(ctx, c.ink, l.floatX, y - 7, 1, 2);
};

const splash = (ctx: Ctx, f: Frame, at: Pt, r: Round, c: Colors<K>): void => {
  if (r.phase === 'catch' && r.at > 14.5) return;
  ring(ctx, at.x, at.y + 1, 2 + frac(f.beat) * 8, 0.3, c.glint);
  ring(ctx, at.x, at.y + 1, 1 + frac(f.beat + 0.5) * 5, 0.3, c.text);
  if (f.kick > 0.4) for (let k = -2; k <= 2; k++) fillRect(ctx, c.text, at.x + k * 2, at.y - 2 - Math.abs(k), 1, 2);
};

// Shadows of fish circle under the float; while she reels the hooked one darts about at the end of the line.
const shadows = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const r = roundOf(f.beat);
  for (let i = 0; i < 3; i++) {
    const hooked = i === 0 && r.phase === 'reel';
    const a = f.t * (0.5 + i * 0.15) + i * 2.1;
    const end = lineEnd(f, l, r);
    const x = hooked ? end.x : l.floatX - 6 + Math.cos(a) * (16 + i * 6);
    const y = hooked ? end.y + 4 : l.floatY + 6 + Math.sin(a) * (4 + i * 2);
    const dir = hooked ? Math.sign(Math.cos(f.t * 5)) : -Math.sign(Math.sin(a)) || 1;
    fillDither(ctx, c.shadow, 0.6, x - 6, y, 12, 3);
    fillDither(ctx, c.shadow, 0.6, x - 4, y - 1, 8, 5);
    fillDither(ctx, c.shadow, 0.6, x + dir * 7 - 1, y, 3, 3);
  }
};

// ---- the girl ----

const angler = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const r = roundOf(f.beat);
  const lean = r.phase === 'reel' ? (frac(f.beat) < 0.5 ? -1 : 0) : 0;
  const x = l.girlX - 14 + lean;
  const y = l.deck - ANGLER.length + (r.phase === 'catch' && frac(f.beat) < 0.3 ? -2 : 0);
  const palette = paletteOf(c, anglerColors);
  drawSprite(ctx, ANGLER, palette, x, y);
  const happy = r.phase === 'catch' && r.at > 14.5;
  if (happy || blinking(f.t, 41)) shutEyes(ctx, x, y, palette, happy);
};

const shutEyes = (ctx: Ctx, x: number, y: number, p: Palette, happy: boolean): void => {
  const skin = p.s ?? '#ffe2cc';
  const ink = p.o ?? '#2a1c2a';
  for (const [eye, w] of [
    [NEAR_EYE, 4],
    [FAR_EYE, 3],
  ] as const) {
    fillRect(ctx, skin, x + eye.x, y + eye.y, w, 5);
    if (happy) {
      fillRect(ctx, ink, x + eye.x + 1, y + eye.y + 1, w - 2, 1);
      fillRect(ctx, ink, x + eye.x, y + eye.y + 2, 1, 1);
      fillRect(ctx, ink, x + eye.x + w - 1, y + eye.y + 2, 1, 1);
    } else fillRect(ctx, ink, x + eye.x, y + eye.y + 3, w, 1);
  }
};

// ---- the catch ----

const leapingFish = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const r = roundOf(f.beat);
  if (r.phase !== 'catch') return;
  const u = Math.min(1, (r.at - 14) / 0.8);
  const from = lineEnd(f, l, { ...r, phase: 'reel', at: 13.9 });
  const hand = handOf(l);
  const x = from.x + (hand.x + 4 - from.x) * u;
  const y = from.y + (hand.y - 34 - from.y) * u - Math.sin(u * Math.PI) * 24;
  const palette = FISH_KINDS[r.n % FISH_KINDS.length] as Palette;
  const wiggle = Math.floor(f.t * 10) % 2 === 0;
  drawSprite(ctx, wiggle ? FISH : flipped(FISH), palette, Math.round(x - 8), Math.round(y - 4));
  if (u < 1) for (let k = 0; k < 4; k++) fillRect(ctx, c.glint, Math.round(x - 10 - k * 4), Math.round(y + 4 + k * 3), 1, 1);
  else popup(ctx, `GET! ${fishSize(r.n)}CM`, x, Math.round(y - 14), (r.at - 14.8) / 1.2, c.uiHi, c.ink, 6);
};

// The bite: an exclamation mark pops over her hat.
const alert = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const r = roundOf(f.beat);
  if (r.phase !== 'reel' || r.at > 10.2) return;
  const x = l.girlX + 4;
  const y = l.deck - ANGLER.length - 14 - (r.at < 9.15 ? 3 : 0);
  fillRect(ctx, c.ink, x - 3, y - 1, 7, 12);
  fillRect(ctx, c.text, x - 2, y, 5, 10);
  fillRect(ctx, c.float, x, y + 1, 1, 5);
  fillRect(ctx, c.float, x, y + 8, 1, 1);
};

// ---- the HUD: the tension meter, and the day's catch ----

const meter = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const r = roundOf(f.beat);
  const w = Math.min(96, Math.round(f.w * 0.4));
  const x = f.w - w - 6;
  const y = 6;
  fillRect(ctx, c.ink, x - 1, y - 1, w + 2, 22);
  fillRect(ctx, c.ui, x, y, w, 20);
  fillRect(ctx, c.uiHi, x, y, w, 1);
  const label = r.phase === 'reel' ? 'REEL!' : r.phase === 'catch' ? 'NICE!' : 'WAIT...';
  drawText(ctx, label, x + 4, y + 3, r.phase === 'reel' && frac(f.beat * 2) < 0.5 ? c.uiHi : c.text);
  const barX = x + 4;
  const barW = w - 8;
  fillRect(ctx, c.ink, barX, y + 13, barW, 4);
  fillRect(ctx, c.cloudLo, barX + Math.round(barW * 0.35), y + 13, Math.round(barW * 0.3), 4);
  if (r.phase !== 'reel') return;
  const swing = 0.5 + Math.sin(f.t * 4.2) * 0.22 + Math.sin(f.t * 9.1) * 0.08 + f.kick * 0.08;
  const mx = barX + Math.round(Math.min(1, Math.max(0, swing)) * (barW - 3));
  fillRect(ctx, c.uiHi, mx, y + 11, 3, 8);
};

const tally = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const r = roundOf(f.beat);
  const caught = (r.n % 99) + (r.phase === 'catch' && r.at > 14.8 ? 1 : 0);
  const text = `x${digits(caught, 2)}`;
  const w = textWidth(text) + 24;
  fillRect(ctx, c.ink, 5, 5, w + 2, 15);
  fillRect(ctx, c.ui, 6, 6, w, 13);
  drawSprite(ctx, FISH, FISH_KINDS[0] as Palette, 8, 8);
  drawText(ctx, text, 26, 9, c.text);
};

const lantern = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  if (!isDark(c.sky0)) return;
  const l = layoutOf(f);
  const x = l.pierEnd - 4;
  const y = l.deck - 26;
  fillRect(ctx, c.ink, x - 1, y, 2, 26);
  fillDither(ctx, c.uiHi, 0.25 + f.kick * 0.1, x - 10, y - 6, 20, 20);
  fillRect(ctx, c.ink, x - 3, y + 1, 7, 8);
  fillRect(ctx, c.uiHi, x - 2, y + 2, 5, 6);
};

export const pierFishing = defineScene<K>({
  id: 'pier-fishing',
  title: 'Pier Fishing',
  mood: { valence: 0.3, energy: -0.5 },
  styles: ['lofi-loop', 'grand-field', 'cozy-village', 'celtic-isle', 'bossa-cafe'],
  variants: [
    {
      mood: { valence: 0.3, energy: -0.5 },
      colors: {
        sky0: '#4a4a8c',
        sky1: '#a87aaa',
        sky2: '#f2a08a',
        sky3: '#ffdaa2',
        sun: '#fff4d2',
        cloud: '#ffd2bc',
        cloudLo: '#c88aa2',
        far: '#8a7aaa',
        farLit: '#ffdcca',
        farShade: '#b0a2cc',
        near: '#5a5276',
        pine: '#34344e',
        mist: '#f6dcd4',
        water: '#5a6a9c',
        glint: '#fff2d2',
        deck: '#b47e5c',
        deckLo: '#74503e',
        post: '#4a3428',
        line: '#f4f0f4',
        float: '#ff4a3a',
        shadow: '#2a2e52',
        ui: '#2e2c4e',
        uiHi: '#ffe0a0',
        text: '#ffffff',
        tint: '#ffb090',
        ink: '#1a1424',
      },
    },
    {
      mood: { valence: 0.65, energy: 0.1 },
      colors: {
        sky0: '#3a84d8',
        sky1: '#6aaaf0',
        sky2: '#a8d8fa',
        sky3: '#e4f6ff',
        sun: '#ffffff',
        cloud: '#ffffff',
        cloudLo: '#b8cce4',
        far: '#5a7ab0',
        farLit: '#ffffff',
        farShade: '#c4d4ec',
        near: '#3a7a54',
        pine: '#245a40',
        mist: '#e8f4ff',
        water: '#2a7ab0',
        glint: '#ffffff',
        deck: '#c8905e',
        deckLo: '#86583a',
        post: '#5a3a28',
        line: '#ffffff',
        float: '#ff3a3a',
        shadow: '#1a3a5e',
        ui: '#26406e',
        uiHi: '#ffe46a',
        text: '#ffffff',
        tint: '#ffffff',
        ink: '#141c2a',
      },
    },
    {
      mood: { valence: -0.3, energy: -0.6 },
      colors: {
        sky0: '#0a0e2a',
        sky1: '#1a2250',
        sky2: '#3a3a74',
        sky3: '#8a5a7a',
        sun: '#f0c8a8',
        cloud: '#4a4a7a',
        cloudLo: '#2a2a52',
        far: '#2a2e5a',
        farLit: '#9aa0cc',
        farShade: '#5a6094',
        near: '#1a1c3a',
        pine: '#10122a',
        mist: '#8a8ab8',
        water: '#141a3e',
        glint: '#c8d0ff',
        deck: '#5a4a5a',
        deckLo: '#3a2e3e',
        post: '#241c28',
        line: '#c8c8e8',
        float: '#ff6a5a',
        shadow: '#06081a',
        ui: '#16163a',
        uiHi: '#ffd88a',
        text: '#e8e8ff',
        tint: '#3a3a8a',
        ink: '#06060e',
      },
    },
  ],
  layers: [sky, clouds, birds, lake, mist, shadows, pier, lantern, float, rod, angler, leapingFish, alert, meter, tally],
});
