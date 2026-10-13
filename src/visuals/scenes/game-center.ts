// A game center late at night: a row of cabinets glows with invented attract screens, a schoolgirl plays at one with
// her ponytail swaying to the beat, a crane game full of plushies works its claw, and bulbs chase round its sign.
import { type Ctx, drawSprite, fillRect, type Palette, type Sprite } from 'mojipx';
import { disc, ditherGradient, frac, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { type Box, drawGlow, fillDither } from './batch-1-helpers.ts';
import { memoLayer, paletteOf, sigOf } from './batch-3-helpers.ts';
import { tinted } from './batch-4-helpers.ts';
import { bigText, strand } from './batch-8-helpers.ts';

type K =
  | 'wall0'
  | 'wall1'
  | 'panel'
  | 'neonA'
  | 'neonB'
  | 'neonC'
  | 'carpet'
  | 'carpetLo'
  | 'cab0'
  | 'cab1'
  | 'cab2'
  | 'cabLo'
  | 'marquee'
  | 'screen'
  | 'chrome'
  | 'glass'
  | 'plushA'
  | 'plushB'
  | 'plushC'
  | 'bulb'
  | 'ink'
  | 'white'
  | 'tint';

// ---- the girl, from behind: o outline, h/H/d hair, r scrunchie, s/S skin, n/w sailor collar and its stripe,
// W blouse, t/T skirt, c/C stool, k shoes ----

const HEAD: Sprite = [
  '.....oooooooo.....',
  '...ooHHhhhhhhoo...',
  '..oHHhhhhhhhhhho..',
  '.oHhhhhhhhhhhhhho.',
  '.ohhhhhhhhhhhhhho.',
  'ohhHHHhhhhhhHHHhho',
  'ohhhhhhhhhhhhhhhho',
  'ohhhhhhhhhhhhhhhho',
  'ohhhhhhhhhhhhhhhho',
  'ohhhhhhhhhhhhhhhho',
  'ohdhhhhhhhhhhhhdho',
  'osdhhhhhhhhhhhhdso',
  '.oddhhhhhhhhhhddo.',
  '..oddhhhhhhhhddo..',
  '...ooddddddddoo...',
  '.....osssssso.....',
];

const BODY: Sprite = [
  '.......oSSSSo.......',
  '....oonnnnnnnnoo....',
  '..oonnnnnnnnnnnnoo..',
  '.oWnwnnnnnnnnnnwnWo.',
  'oWWnwnnnnnnnnnnwnWWo',
  'oWWnwnnnnnnnnnnwnWWo',
  'oWWnwwwwwwwwwwwwnWWo',
  'oWWnnnnnnnnnnnnnnWWo',
  'oWWWooooooooooooWWWo',
  'oWWWWWWWWWWWWWWWWWWo',
  'oWWWWWWWWWWWWWWWWWWo',
  '.oWWWWWWWWWWWWWWWWo.',
  '.oWWWWWWWWWWWWWWWWo.',
  'otttttttttttttttttto',
  'otttTtttTtttTtttTtto',
  'ottttTtttTtttTtttTto',
  'oooooooooooooooooooo',
];

const STOOL: Sprite = [
  '..oooooooooooooooo..',
  '.occcccccccccccccco.',
  '..oooooooooooooooo..',
  '........oCCo........',
  '........oCCo........',
  '........oCCo........',
  '........oCCo........',
  '......ooCCCCoo......',
  '....oooooooooooo....',
];

// Her calves hang either side of the stool's post.
const LEGS: Sprite = [
  '...oSSo....oSSo...',
  '...oSSo....oSSo...',
  '...oWWo....oWWo...',
  '...oWWo....oWWo...',
  '..okkko...okkko...',
  '..oooo....oooo....',
];

const GIRL: Palette = {
  o: '#1a1020',
  h: '#4a2a2a',
  H: '#9a6a5a',
  d: '#2a1818',
  r: '#ff3a6a',
  s: '#ffe0c8',
  S: '#f0c0a8',
  n: '#2a3a7a',
  w: '#ffffff',
  W: '#f4f4ff',
  t: '#2a3a7a',
  T: '#1a2450',
  c: '#d0d0e0',
  C: '#8a8aa0',
  k: '#3a2a2a',
};
const girlPalette = (c: Colors<K>): Palette => tinted(GIRL, c.tint, 0.18);

// ---- plushies, the claw ----

// A round critter: p fur, P shade, e eyes, b cheeks, a ears.
const PLUSH: Sprite = ['.a.....a.', 'apa...apa', 'opppppppo', 'ppepppepp', 'ppbpppbpp', 'pppPPPppp', '.ppppppp.', '..ppPpp..'];
const CLAW_OPEN: Sprite = ['..ooo..', '.oCCCo.', 'oCo.oCo', 'oo...oo', 'o.....o'];
const CLAW_SHUT: Sprite = ['..ooo..', '.oCCCo.', '.oCoCo.', '..oCo..', '..o.o..'];
const clawPalette = (c: Colors<K>): Palette => ({ o: c.ink, C: c.chrome });
const plushPalettes = (c: Colors<K>): readonly Palette[] =>
  [c.plushA, c.plushB, c.plushC].map((p) => ({ p, P: c.cabLo, e: c.ink, b: c.neonA, a: p, o: c.ink }));
const plushCache = new WeakMap<object, readonly Palette[]>();
const plushOf = (c: Colors<K>, i: number): Palette => {
  let list = plushCache.get(c);
  if (!list) {
    list = plushPalettes(c);
    plushCache.set(c, list);
  }
  return list[((i % 3) + 3) % 3] as Palette;
};

// ---- the hall ----

type Machine = { readonly kind: 'cab' | 'crane'; readonly x: number; readonly floor: number; readonly style: number };
type Hall = { readonly wide: boolean; readonly wallBottom: number; readonly machines: readonly Machine[]; readonly girl: Machine };

const CAB_W = 40;
const CAB_H = 78;
const CRANE_W = 70;
const CRANE_H = 104;

const hallOf = (f: Frame): Hall => {
  if (f.w > f.h) {
    const floor = f.h - 28;
    const craneX = f.w - CRANE_W - 10;
    const n = Math.max(1, Math.floor((craneX - 8) / (CAB_W + 4)));
    const cabs = Array.from({ length: n }, (_, i): Machine => ({ kind: 'cab', x: 6 + i * (CAB_W + 4), floor, style: i % 4 }));
    const girl = cabs[Math.floor(n / 2)] ?? (cabs[0] as Machine);
    return {
      wide: true,
      wallBottom: floor - 6,
      machines: [...cabs, { kind: 'crane', x: craneX, floor, style: 0 }],
      girl: { ...girl, style: 4 },
    };
  }
  const back = Math.round(f.h * 0.56);
  const front = Math.round(f.h * 0.85);
  const cabs = [-24, 20, 64, 108, 152].map(
    (x, i): Machine => ({ kind: 'cab', x: x + Math.round((f.w - 180) / 2), floor: front, style: i % 4 }),
  );
  const girl = { ...(cabs[2] as Machine), style: 4 };
  return {
    wide: false,
    wallBottom: back - 6,
    machines: [
      { kind: 'crane', x: 10, floor: back, style: 0 },
      { kind: 'cab', x: f.w - CAB_W - 12, floor: back, style: 1 },
      ...cabs.filter((_, i) => i !== 2),
      girl,
    ],
    girl,
  };
};

// ---- the room (cached): wall panels and posters, the neon sign's glow, the carpet ----

const paintWall = (g: Ctx, f: Frame, h: Hall, c: Colors<K>): void => {
  g.drawImage(ditherGradient(f.w, h.wallBottom, [c.wall0, c.wall1]), 0, 0);
  for (let x = 0; x < f.w; x += 32) fillRect(g, c.panel, x, 0, 1, h.wallBottom);
  for (let i = 0; i < Math.ceil(f.w / 80); i++) {
    const x = 12 + i * 80 + Math.round(rand(i, 3) * 20);
    const y = Math.round(h.wallBottom * 0.42);
    const colors = [c.neonA, c.neonB, c.neonC];
    fillRect(g, c.ink, x - 1, y - 1, 20, 26);
    fillRect(g, c.panel, x, y, 18, 24);
    disc(g, x + 9, y + 9, 5, () => colors[i % 3] as string);
    fillRect(g, colors[(i + 1) % 3] as string, x + 2, y + 18, 14, 2);
  }
  fillRect(g, c.ink, 0, h.wallBottom, f.w, 2);
};

// The carpet: dark, scattered with neon squiggles and stars in the old style.
const paintCarpet = (g: Ctx, f: Frame, h: Hall, c: Colors<K>): void => {
  const top = h.wallBottom + 2;
  g.drawImage(ditherGradient(f.w, f.h - top, [c.carpetLo, c.carpet]), 0, top);
  const colors = [c.neonA, c.neonB, c.neonC];
  for (let i = 0; i < Math.round((f.w * (f.h - top)) / 260); i++) {
    const x = Math.floor(rand(i, 21) * f.w);
    const y = top + 3 + Math.floor(rand(i, 22) * (f.h - top - 4));
    const color = colors[i % 3] as string;
    if (i % 3 === 0) for (let k = 0; k < 5; k++) fillRect(g, color, x + k, y + (k % 2), 1, 1);
    else if (i % 3 === 1) {
      fillRect(g, color, x - 1, y, 3, 1);
      fillRect(g, color, x, y - 1, 1, 3);
    } else fillRect(g, color, x, y, 2, 2);
  }
};

const roomLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`arcade-room:${f.w}x${f.h}:${sigOf(c)}`, f.w, f.h, (g) => {
    const h = hallOf(f);
    paintWall(g, f, h, c);
    paintCarpet(g, f, h, c);
  });

const room = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(roomLayer(f, c), 0, 0);
  neonSign(ctx, f, c);
};

// A neon sign over the hall; now and then a letter stutters.
const neonSign = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const h = hallOf(f);
  const cx = Math.round(f.w / 2);
  const y = h.wide ? 8 : Math.round(h.wallBottom * 0.12);
  drawGlow(ctx, c.neonA, cx, y + 7, 46, 14, 0.4, 4);
  const word = 'GAMES';
  const stutter = Math.floor(f.t * 3);
  const dark = rand(stutter, 9) < 0.15 ? Math.floor(rand(stutter, 10) * word.length) : -1;
  const shown = [...word].map((ch, i) => (i === dark ? ' ' : ch)).join('');
  bigText(ctx, shown, cx, y, 2, c.white, c.neonA);
  signBulbs(ctx, f, cx, y, c);
  for (const side of [-1, 1]) {
    const sx = cx + side * 44;
    fillRect(ctx, c.neonB, sx - 4, y + 6, 9, 1);
    fillRect(ctx, c.neonB, sx, y + 2, 1, 9);
    if (frac(f.beat / 2) < 0.5) fillRect(ctx, c.white, sx, y + 6, 1, 1);
  }
};

// Bulbs frame the sign and chase each other round it, a step on every eighth note.
const signBulbs = (ctx: Ctx, f: Frame, cx: number, y: number, c: Colors<K>): void => {
  const step = Math.floor(f.beat * 2);
  const left = cx - 58;
  const right = cx + 58;
  let i = 0;
  for (let x = left; x <= right; x += 6, i++) {
    fillRect(ctx, (i + step) % 3 === 0 ? c.bulb : c.panel, x, y - 5, 2, 2);
    fillRect(ctx, (i - step + 300) % 3 === 0 ? c.bulb : c.panel, x, y + 19, 2, 2);
  }
};

// ---- cabinets: the body cached, the attract screens live ----

/** A flat part of a machine: its color (or the machine's own body color), position and size. */
type Part = readonly [K | 'body', number, number, number, number];

const paintParts = (g: Ctx, parts: readonly Part[], c: Colors<K>, body: string): void => {
  for (const [key, x, y, w, h] of parts) fillRect(g, key === 'body' ? body : c[key], x, y, w, h);
};

// Cabinet: outline, side, body, marquee, screen bezel, control panel and stick, coin door with its slots.
const CAB_PARTS: readonly Part[] = [
  ['ink', 0, 0, CAB_W + 3, CAB_H],
  ['cabLo', CAB_W - 1, 2, 3, CAB_H - 3],
  ['body', 1, 1, CAB_W - 2, CAB_H - 2],
  ['marquee', 3, 2, CAB_W - 6, 9],
  ['ink', 4, 13, CAB_W - 8, 29],
  ['cabLo', 2, 43, CAB_W - 4, 8],
  ['chrome', 2, 43, CAB_W - 4, 1],
  ['ink', 10, 44, 2, 5],
  ['ink', 13, 57, 14, 13],
  ['neonA', 17, 60, 6, 1],
  ['neonA', 17, 63, 6, 1],
  ['cabLo', 16, 66, 8, 2],
];

const cabinetLayer = (c: Colors<K>, style: number): HTMLCanvasElement =>
  memoLayer(`arcade-cab:${style}:${sigOf(c)}`, CAB_W + 3, CAB_H, (g) => {
    paintParts(g, CAB_PARTS, c, [c.cab0, c.cab1, c.cab2, c.cab1, c.cab0][style] ?? c.cab0);
    paintLogo(g, style, c);
    disc(g, 11, 44, 2, () => c.neonA);
    for (const [k, button] of [c.neonB, c.neonC, c.white].entries()) disc(g, 21 + k * 5, 47, 1, () => button);
    for (let y = 52; y < CAB_H - 2; y += 4) fillRect(g, c.cabLo, 2, y, 4, 2);
  });

// Each marquee carries an invented emblem: stars, a wave, a rocket, rings, a heart.
const paintLogo = (g: Ctx, style: number, c: Colors<K>): void => {
  const colors = [c.neonA, c.neonB, c.neonC];
  for (let k = 0; k < 4; k++) {
    const x = 7 + k * 7;
    const color = colors[(k + style) % 3] as string;
    if (style % 2 === 0) disc(g, x + 2, 6, 2, () => color);
    else fillRect(g, color, x, 4 + (k % 2) * 2, 5, 3);
  }
};

type Screen = Box;

// Falling blocks stack up and clear.
const blocksScreen = (ctx: Ctx, f: Frame, s: Screen, c: Colors<K>): void => {
  const colors = [c.neonA, c.neonB, c.neonC, c.white];
  const step = Math.floor(f.beat * 2);
  for (let col = 0; col < 7; col++) {
    const stack = Math.floor(rand(col, Math.floor(step / 16)) * 4) + Math.floor((step % 16) / 5);
    for (let r = 0; r < stack; r++) fillRect(ctx, colors[(col + r) % 4] as string, s.x + 1 + col * 4, s.y + s.h - 4 - r * 4, 3, 3);
  }
  const fall = step % 8;
  fillRect(ctx, c.white, s.x + 1 + (Math.floor(step / 8) % 7) * 4, s.y + 1 + fall * 2, 3, 3);
};

// A tiny ship sweeps under a row of diamonds and fires on every beat.
const spaceScreen = (ctx: Ctx, f: Frame, s: Screen, c: Colors<K>): void => {
  for (let i = 0; i < 8; i++)
    fillRect(ctx, c.white, s.x + Math.floor(rand(i, 4) * s.w), s.y + Math.floor((rand(i, 5) * s.h + f.t * 8) % s.h), 1, 1);
  for (let k = 0; k < 5; k++) {
    const x = s.x + 3 + k * 5 + Math.round(Math.sin(f.t * 2) * 2);
    fillRect(ctx, c.neonA, x, s.y + 4, 3, 1);
    fillRect(ctx, c.neonA, x + 1, s.y + 3, 1, 3);
  }
  const sx = s.x + Math.round(s.w / 2 + Math.sin(f.t * 1.5) * 9);
  fillRect(ctx, c.neonB, sx - 1, s.y + s.h - 3, 3, 2);
  fillRect(ctx, c.neonB, sx, s.y + s.h - 4, 1, 1);
  const shot = frac(f.beat);
  if (shot < 0.5) fillRect(ctx, c.white, sx, s.y + s.h - 6 - Math.round(shot * 30), 1, 2);
};

// A tiny road rushing toward a tiny car.
const roadScreen = (ctx: Ctx, f: Frame, s: Screen, c: Colors<K>): void => {
  const horizon = s.y + 8;
  fillRect(ctx, c.neonC, s.x, s.y, s.w, 8);
  for (let y = horizon; y < s.y + s.h; y++) {
    const p = (y - horizon) / (s.y + s.h - horizon);
    const half = 2 + p * 12;
    const stripe = Math.floor(2 / (p + 0.1) + f.beat * 2) % 2 === 0;
    fillRect(ctx, stripe ? c.neonB : c.cabLo, s.x, y, s.w, 1);
    fillRect(ctx, c.ink, Math.round(s.x + s.w / 2 - half), y, Math.round(half * 2), 1);
  }
  fillRect(ctx, c.neonA, s.x + 11, s.y + s.h - 5, 6, 3);
};

// A ball bounced between two paddles.
const rallyScreen = (ctx: Ctx, f: Frame, s: Screen, c: Colors<K>): void => {
  const u = frac(f.beat / 2);
  const there = u < 0.5 ? u * 2 : 2 - u * 2;
  const bx = s.x + 2 + Math.round(there * (s.w - 5));
  const by = s.y + 2 + Math.round(Math.abs(Math.sin(f.beat * 1.7)) * (s.h - 5));
  for (let y = s.y; y < s.y + s.h; y += 3) fillRect(ctx, c.cabLo, s.x + s.w / 2, y, 1, 2);
  fillRect(ctx, c.white, s.x + 1, by - 3, 1, 6);
  fillRect(ctx, c.white, s.x + s.w - 2, by - 2, 1, 6);
  fillRect(ctx, c.neonC, bx, by, 2, 2);
};

// Her game: a grid of gems where a line flashes and clears on every beat.
const gemScreen = (ctx: Ctx, f: Frame, s: Screen, c: Colors<K>): void => {
  const colors = [c.neonA, c.neonB, c.neonC, c.white];
  const n = Math.floor(f.beat);
  const flash = frac(f.beat) < 0.3;
  for (let r = 0; r < 6; r++)
    for (let q = 0; q < 7; q++) {
      const lit = flash && r === n % 6;
      fillRect(
        ctx,
        lit ? c.white : (colors[Math.floor(rand(q, r + Math.floor(n / 6) * 7) * 4)] as string),
        s.x + 1 + q * 4,
        s.y + 1 + r * 4,
        3,
        3,
      );
    }
};

const SCREENS = [blocksScreen, spaceScreen, roadScreen, rallyScreen, gemScreen] as const;

const cabinet = (ctx: Ctx, f: Frame, m: Machine, c: Colors<K>): void => {
  const top = m.floor - CAB_H;
  // The screen's light spills onto the carpet in front.
  drawGlow(ctx, [c.neonB, c.neonA, c.neonC, c.neonB, c.neonA][m.style] ?? c.neonB, m.x + CAB_W / 2, m.floor + 4, 24, 6, 0.3, 3);
  drawGlow(ctx, c.screen, m.x + CAB_W / 2, top + 28, 26, 22, 0.25, 3);
  ctx.drawImage(cabinetLayer(c, m.style), m.x, top);
  const s: Screen = { x: m.x + 6, y: top + 15, w: CAB_W - 12, h: 25 };
  fillRect(ctx, c.screen, s.x, s.y, s.w, s.h);
  (SCREENS[m.style] ?? blocksScreen)(ctx, f, s, c);
  for (let y = s.y + 1; y < s.y + s.h; y += 3) fillDither(ctx, c.ink, 0.25, s.x, y, s.w, 1);
  if (frac(f.t * 0.7 + m.x * 0.01) < 0.5) fillRect(ctx, c.white, m.x + 4, top + 3, 1, 1);
};

// ---- the crane game ----

// Crane: outline, sign, glass box between chrome posts, the rail, the base with its prize flap and stick.
const CRANE_PARTS: readonly Part[] = [
  ['ink', 0, 0, CRANE_W, CRANE_H],
  ['marquee', 2, 2, CRANE_W - 4, 12],
  ['glass', 3, 17, CRANE_W - 6, 54],
  ['chrome', 2, 16, 2, 56],
  ['chrome', CRANE_W - 4, 16, 2, 56],
  ['chrome', 4, 19, CRANE_W - 8, 1],
  ['body', 2, 72, CRANE_W - 4, CRANE_H - 74],
  ['cabLo', 2, 72, CRANE_W - 4, 2],
  ['ink', 6, 78, 18, 14],
  ['glass', 7, 79, 16, 12],
  ['ink', 52, 80, 2, 6],
];

const craneLayer = (c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`arcade-crane:${sigOf(c)}`, CRANE_W, CRANE_H, (g) => {
    paintParts(g, CRANE_PARTS, c, c.cab2);
    disc(g, 44, 82, 3, () => c.neonA);
    disc(g, 53, 79, 2, () => c.neonC);
    for (let x = 6; x < CRANE_W - 6; x += 6) fillRect(g, c.cabLo, x, CRANE_H - 8, 3, 4);
    paintPile(g, c);
  });

// Plushies piled in the glass box, the front row nearest.
const paintPile = (g: Ctx, c: Colors<K>): void => {
  for (let row = 0; row < 3; row++)
    for (let k = 0; k < 7; k++) {
      const x = 22 + k * 7 - row * 3 + Math.round(rand(k, row) * 3);
      const y = 52 + row * 6 - Math.round(Math.sin(k * 1.3) * 2);
      if (x > CRANE_W - 13) continue;
      const p = plushOf(c, k + row);
      PLUSH.forEach((line, dy) => {
        for (let dx = 0; dx < line.length; dx++) {
          const key = line[dx] ?? '.';
          if (key !== '.') fillRect(g, p[key] ?? c.ink, x + dx, y + dy, 1, 1);
        }
      });
    }
};

// The claw's eight-beat round: over to a plush, down, grab, up, back to the chute and let go.
const clawOf = (beat: number): { readonly u: number; readonly drop: number; readonly shut: boolean; readonly carry: boolean } => {
  const round = Math.floor(beat / 8);
  const p = beat - round * 8;
  const target = 0.35 + rand(round, 3) * 0.6;
  const lucky = rand(round, 4) < 0.6;
  if (p < 3) return { u: (p / 3) * target, drop: 0, shut: false, carry: false };
  if (p < 4) return { u: target, drop: p - 3, shut: false, carry: false };
  if (p < 4.5) return { u: target, drop: 1, shut: true, carry: lucky };
  if (p < 5.5) return { u: target, drop: 5.5 - p, shut: true, carry: lucky };
  if (p < 7.5) return { u: target * (1 - (p - 5.5) / 2), drop: 0, shut: true, carry: lucky };
  return { u: 0, drop: 0, shut: false, carry: false };
};

const crane = (ctx: Ctx, f: Frame, m: Machine, c: Colors<K>): void => {
  const top = m.floor - CRANE_H;
  ctx.drawImage(craneLayer(c), m.x, top);
  const claw = clawOf(Math.max(0, f.beat));
  const cx = m.x + 12 + Math.round(claw.u * (CRANE_W - 26));
  const cable = 4 + Math.round(claw.drop * 26);
  fillRect(ctx, c.chrome, cx - 3, top + 18, 7, 2);
  fillRect(ctx, c.ink, cx, top + 20, 1, cable);
  const cy = top + 20 + cable;
  if (claw.carry) drawSprite(ctx, PLUSH, plushOf(c, Math.floor(f.beat / 8)), cx - 4, cy + 3);
  drawSprite(ctx, claw.shut ? CLAW_SHUT : CLAW_OPEN, paletteOf(c, clawPalette), cx - 3, cy);
  bulbs(ctx, f, m.x, top, c);
  // Two glints slant across the glass.
  for (let k = 0; k < 2; k++)
    for (let r = 0; r < 22 - k * 8; r += 2) fillRect(ctx, c.white, m.x + 8 + k * 30 + Math.round(r * 0.4), top + 24 + k * 6 + r, 1, 1);
};

// Bulbs chase each other round the crane's sign.
const bulbs = (ctx: Ctx, f: Frame, x: number, top: number, c: Colors<K>): void => {
  const step = Math.floor(f.beat * 4);
  let i = 0;
  for (let bx = x + 2; bx < x + CRANE_W - 2; bx += 4, i++) {
    fillRect(ctx, (i + step) % 4 === 0 ? c.bulb : c.cabLo, bx, top + 2, 2, 1);
    fillRect(ctx, (i + step + 2) % 4 === 0 ? c.bulb : c.cabLo, bx, top + 13, 2, 1);
  }
  bigText(ctx, 'CATCH', x + CRANE_W / 2, top + 4, 1, c.white, c.neonA);
};

const machines = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  for (const m of hallOf(f).machines) {
    if (m.kind === 'crane') crane(ctx, f, m, c);
    else cabinet(ctx, f, m, c);
  }
};

// ---- the girl at her cabinet ----

const player = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = hallOf(f).girl;
  const p = paletteOf(c, girlPalette);
  const top = m.floor - CAB_H;
  const x = m.x + CAB_W / 2 - 10;
  const nod = frac(f.beat) < 0.25 ? 1 : 0;
  const mash = f.kick > 0.6 ? 1 : 0;
  drawSprite(ctx, LEGS, p, x + 1, top + 74);
  drawSprite(ctx, STOOL, p, x, top + 72);
  for (const side of [-1, 1]) fillRect(ctx, p.W ?? c.white, x + (side < 0 ? -1 : 20), top + 52 - mash, 1, 4);
  drawSprite(ctx, BODY, p, x, top + 46 + nod);
  const sway = Math.round(Math.sin(f.beat * Math.PI) * 4);
  drawSprite(ctx, HEAD, p, x + 1, top + 31 + nod);
  strand(ctx, x + 10, top + 33 + nod, 20, sway, 0, (u) => 6 - u * 3 + Math.sin(u * Math.PI) * 1.5, {
    ink: p.o ?? c.ink,
    hair: p.h ?? c.ink,
    hi: p.H ?? c.white,
    lo: p.d ?? c.ink,
  });
  fillRect(ctx, p.r ?? c.neonA, x + 8, top + 32 + nod, 5, 2);
  // The screen's light on her hair.
  fillRect(ctx, c.screen, x + 6, top + 31 + nod, 8, 1);
};

export const gameCenter = defineScene<K>({
  id: 'game-center',
  title: 'Game Center',
  mood: { valence: 0.3, energy: 0.3 },
  styles: ['nineties-pop', 'city-lights', 'lofi-loop', 'puzzle-pop', 'technopop', 'city-groove', 'kawaii-pop', 'vocal-electro'],
  variants: [
    {
      mood: { valence: 0.3, energy: 0.3 },
      colors: {
        wall0: '#0e0820',
        wall1: '#24143e',
        panel: '#1a1030',
        neonA: '#ff4ab0',
        neonB: '#4ae0ff',
        neonC: '#ffd84a',
        carpet: '#1e0e38',
        carpetLo: '#0c0618',
        cab0: '#3a2a8a',
        cab1: '#8a2a5a',
        cab2: '#2a6a8a',
        cabLo: '#140c28',
        marquee: '#ffe0f4',
        screen: '#0a1a3a',
        chrome: '#c8c8e0',
        glass: '#2a2a5a',
        plushA: '#ffb0d0',
        plushB: '#b0e8ff',
        plushC: '#fff0a0',
        bulb: '#fff4b0',
        ink: '#06040c',
        white: '#ffffff',
        tint: '#7a5ad0',
      },
    },
    {
      mood: { valence: -0.4, energy: 0.0 },
      colors: {
        wall0: '#040a14',
        wall1: '#0a1a2a',
        panel: '#0a1420',
        neonA: '#4ae0d0',
        neonB: '#5a8aff',
        neonC: '#c8f0ff',
        carpet: '#0a1828',
        carpetLo: '#040a12',
        cab0: '#1a2a4a',
        cab1: '#2a3a5a',
        cab2: '#1a4a5a',
        cabLo: '#060c16',
        marquee: '#c8f0f0',
        screen: '#06142a',
        chrome: '#9ab0c8',
        glass: '#14243a',
        plushA: '#a0c8e0',
        plushB: '#c0b0e0',
        plushC: '#e0e0d0',
        bulb: '#d0f0ff',
        ink: '#02040a',
        white: '#e8f8ff',
        tint: '#2a6a8a',
      },
    },
    {
      mood: { valence: 0.7, energy: 0.1 },
      colors: {
        wall0: '#3a1e1a',
        wall1: '#6a3a2a',
        panel: '#4a2a22',
        neonA: '#ff6a3a',
        neonB: '#ffd84a',
        neonC: '#6ae0a0',
        carpet: '#4a2030',
        carpetLo: '#2a1018',
        cab0: '#c04a3a',
        cab1: '#e08a2a',
        cab2: '#3a8a6a',
        cabLo: '#2a1418',
        marquee: '#fff4d8',
        screen: '#1a1a3a',
        chrome: '#f0e0c8',
        glass: '#5a3a4a',
        plushA: '#ffc0a0',
        plushB: '#fff0b0',
        plushC: '#c0f0d0',
        bulb: '#fffbe0',
        ink: '#140808',
        white: '#ffffff',
        tint: '#ffb070',
      },
    },
  ],
  layers: [room, machines, player],
});
