// A rhythm game that never existed: an idol sings and dances on a stage under sweeping spotlights while notes rush down
// four lanes in perspective and land on the judgment line exactly on the beat, popping PERFECT as the combo climbs.
import { type Ctx, drawSprite, fillRect, type Palette, type Sprite } from 'mojipx';
import { ditherGradient, frac, pixelLine, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { ditherStyle, fillDither } from './batch-1-helpers.ts';
import { memoLayer, paletteOf, sigOf } from './batch-3-helpers.ts';
import { drawText, type Pt, textWidth, tinted } from './batch-4-helpers.ts';
import { drawGirl, type Girl, limb } from './batch-7-helpers.ts';
import { bigText, digits, strand } from './batch-8-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'truss'
  | 'wall'
  | 'led'
  | 'ledHi'
  | 'beam'
  | 'stage'
  | 'stageHi'
  | 'stageLo'
  | 'lane'
  | 'laneHi'
  | 'edge'
  | 'note0'
  | 'note1'
  | 'note2'
  | 'note3'
  | 'crowd'
  | 'crowdHi'
  | 'floor'
  | 'text'
  | 'ink'
  | 'white'
  | 'tint';

// ---- the idol: o outline, h/H/d hair, s/S skin, b blush, e/i/I/w eyes, m/M mouth, W white, p/P pink, r/R bow,
// y/Y star clip. Arms are drawn as limbs so she can strike a new pose on every beat. ----

const HEAD: Sprite = [
  '..........oooooooo..........',
  '........ooHHHHHHhhoo........',
  '......ooHHhhhhhhhhhhoo......',
  '.....oHHhhhhhhhhhhhhhho.....',
  '....oHhhhhhhhhhhhhhhhhhho...',
  '...ohhhHHHHhhhhhhhHHHHhhho..',
  '..ohhhhhhhhhhhhhhhhhhhhhho..',
  '..ohhhhhhhhhhhhhhhhhhhhhhho.',
  '.ohhhhhhhhhhhhhhhhhhhhhhhho.',
  '.ohhhhhhhhhhhhhhhhhhhhhhhho.',
  '.ohhhhdhhhhhhhhhhhhhdhhhhho.',
  '.ohhhdsdhhhhdhhdhhhdsdhhhho.',
  '.ohhdssssdhdssssdhdssssdhho.',
  '.ohhdeeeeeesssssseeeeeedhho.',
  '.ohhdsewwiessssssewwiesdhho.',
  '.ohhdseiiiesssssseiiiesdhho.',
  '.ohhdseiIIesssssseiIIesdhho.',
  '.ohhdsseeesssssssseeessdhho.',
  '.ohhdsbbbssssssssssbbbsdhho.',
  '.ohhdssssssssmmssssssssdhho.',
  '.ohhdSssssssssssssssssSdhho.',
  '.ohhdSSssssssssssssssSSdhho.',
  '.ohhhdSSSssssssssssSSSdhhho.',
  '.ohhhhdooSSSssssSSSoodhhhho.',
  '.ohhhhho..oooooooo..ohhhhho.',
  '.ohhhhho............ohhhhho.',
  '..ohhhdo............odhhho..',
  '..ohhdo..............odhho..',
  '...oho................oho...',
  '....o..................o....',
];

// Singing: the mouth opens wide on the off-beats.
const HEAD_SING: Sprite = HEAD.map((row, y) => {
  if (y === 19) return `${row.slice(0, 11)}smmmms${row.slice(17)}`;
  if (y === 20) return `${row.slice(0, 12)}sMMs${row.slice(16)}`;
  return row;
});

const TORSO: Sprite = [
  '.......oSSo.......',
  '....oooWSSWooo....',
  '..ooPpoWWWWopPoo..',
  '.oPpppoWrrWoppPpo.',
  '.oPpppoRrrRoppPpo.',
  '.oPPpoWWrrWWopPPo.',
  '..ooo.oWWWWo.ooo..',
  '......oWWWWo......',
  '......oppppo......',
];

const SKIRT: Sprite = [
  '......oppppppo......',
  '.....oppWppWppo.....',
  '....opppWppWpppo....',
  '...oppppWppWppppo...',
  '..opppppWppWpppppo..',
  '.oPpppppWppWpppppPo.',
  'oWWWWWWWWWWWWWWWWWWo',
  'oWoWWoWWoWWoWWoWWoWo',
  '.o.oo.oo.oo.oo.oo.o.',
];

const LEGS: Sprite = [
  '..oso..oso..',
  '..oso..oso..',
  '..oso..oso..',
  '..oso..oso..',
  '..opo..opo..',
  '..oWo..oWo..',
  '..oWo..oWo..',
  '..oWo..oWo..',
  '..oWo..oWo..',
  '.oWWo..oWWo.',
  'oWWWo..oWWWo',
  'ooooo..ooooo',
];

// One boot rises onto its toe.
const LEGS_STEP: Sprite = [
  '..oso..oso..',
  '..oso..oso..',
  '..oso..oso..',
  '..oso..oso..',
  '..opo..opo..',
  '..oWo..oWo..',
  '..oWo..oWo..',
  '..oWo.oWo...',
  '..oWo.oWo...',
  '.oWWo.oWWo..',
  'oWWWo.oooo..',
  'ooooo.......',
];

const STAR: Sprite = ['...o...', '..oyo..', 'ooyYyoo', 'oyYYYyo', '.oyyyo.', '.oyoyo.', '.o...o.'];
const HEART: Sprite = ['.oo.oo.', 'orroRro', 'orrrrro', '.orrro.', '..oro..', '...o...'];
const GLOVE: Sprite = ['.oo.', 'oWWo', 'oWWo', '.oo.'];

const IDOL: Palette = {
  o: '#2a1440',
  h: '#a77ce8',
  H: '#e0c8ff',
  d: '#6a48b0',
  s: '#ffe4d4',
  S: '#f4b8a8',
  b: '#ff94b4',
  e: '#2a1650',
  i: '#e04ab0',
  I: '#ff9ae0',
  w: '#ffffff',
  m: '#b03060',
  M: '#ff7090',
  W: '#ffffff',
  p: '#ff5aa8',
  P: '#c02a78',
  r: '#ff3a6a',
  R: '#c01a4a',
  y: '#ffd84a',
  Y: '#fff6b0',
};

// She keeps her own colors, only catching a little of the stage light.
const idolPalette = (c: Colors<K>): Palette => tinted(IDOL, c.tint, 0.14);

const IDOL_GIRL: Girl = {
  eyes: [
    { x: 5, y: 13, out: -1, w: 6, h: 5 },
    { x: 17, y: 13, out: 1, w: 6, h: 5 },
  ],
  seed: 57,
};

// A pose: the elbow and the hand of each arm, relative to its shoulder; whether a boot is up; how the head leans.
type Pose = { readonly left: readonly [Pt, Pt]; readonly right: readonly [Pt, Pt]; readonly step: boolean; readonly lean: number };

const POSES: readonly Pose[] = [
  {
    left: [
      [-5, -4],
      [-7, -12],
    ],
    right: [
      [4, 5],
      [1, 9],
    ],
    step: true,
    lean: -1,
  },
  {
    left: [
      [-6, 1],
      [-11, -4],
    ],
    right: [
      [6, 1],
      [11, -4],
    ],
    step: false,
    lean: 0,
  },
  {
    left: [
      [-4, 5],
      [-1, 9],
    ],
    right: [
      [5, -4],
      [7, -12],
    ],
    step: true,
    lean: 1,
  },
  {
    left: [
      [-5, 4],
      [-1, 1],
    ],
    right: [
      [5, 4],
      [1, 1],
    ],
    step: false,
    lean: 0,
  },
];

// ---- layout ----

type Lanes = { readonly cx: number; readonly top: number; readonly judge: number; readonly topHalf: number; readonly judgeHalf: number };

type Stage = {
  readonly wide: boolean;
  readonly cx: number;
  /** Where the idol's boots touch the floor, and the stage's front edge (the lanes start just below it). */
  readonly floor: number;
  readonly edge: number;
  readonly wallTop: number;
  readonly wallBottom: number;
  readonly wallHalf: number;
  readonly lanes: Lanes;
};

const stageOf = (f: Frame): Stage => {
  const cx = Math.round(f.w / 2);
  if (f.w > f.h) {
    const edge = Math.round(f.h * 0.5);
    return {
      wide: true,
      cx,
      floor: edge - 4,
      edge,
      wallTop: 10,
      wallBottom: edge - 16,
      wallHalf: Math.round(f.w * 0.24),
      lanes: { cx, top: edge + 1, judge: f.h - 22, topHalf: 30, judgeHalf: 92 },
    };
  }
  const edge = Math.round(f.h * 0.4);
  return {
    wide: false,
    cx,
    floor: edge - 5,
    edge,
    wallTop: 20,
    wallBottom: edge - 22,
    wallHalf: Math.round(f.w * 0.44),
    lanes: { cx, top: edge + 1, judge: f.h - 46, topHalf: 30, judgeHalf: Math.round(f.w * 0.46) },
  };
};

// The lanes are a plane in perspective: half-width grows linearly down the screen from the vanishing row.
const vanishOf = (l: Lanes): number => l.top - (l.topHalf * (l.judge - l.top)) / (l.judgeHalf - l.topHalf);
const halfAt = (l: Lanes, y: number): number => l.topHalf + ((l.judgeHalf - l.topHalf) * (y - l.top)) / (l.judge - l.top);

const LOOKAHEAD = 3;

/** The row of a note `d` beats from the judgment line: far notes crawl near the stage and rush in at the end. */
const rowOf = (l: Lanes, d: number): number => {
  const v = vanishOf(l);
  const speed = ((l.judge - v) / (l.top - v) - 1) / LOOKAHEAD;
  return v + (l.judge - v) / (1 + d * speed);
};

const laneSpan = (l: Lanes, y: number, lane: number): readonly [number, number] => {
  const hw = halfAt(l, y);
  const lw = (hw * 2) / 4;
  const x0 = l.cx - hw + lane * lw;
  return [Math.round(x0), Math.round(x0 + lw)];
};

// ---- the chart: 64 half-beat slots per eight bars, the same every eight bars so the combo can be counted ----

const lanesOfSlot = (slot: number): readonly number[] => {
  const beat = slot / 2;
  if (slot % 2 === 1) return Math.floor(beat / 4) % 2 === 1 && rand(slot, 4) < 0.7 ? [Math.floor(rand(slot, 5) * 4)] : [];
  if (beat % 8 === 0) return rand(slot, 6) < 0.5 ? [0, 3] : [1, 2];
  const stairs = [0, 1, 2, 3, 3, 2, 1, 0];
  return [Math.floor(beat / 8) % 2 === 0 ? (stairs[beat % 8] ?? 0) : Math.floor(rand(slot, 7) * 4)];
};

const CHART: readonly (readonly number[])[] = Array.from({ length: 64 }, (_, s) => lanesOfSlot(s));
const BEFORE: readonly number[] = Array.from({ length: 65 }, (_, s) => CHART.slice(0, s).reduce((n, lanes) => n + lanes.length, 0));
const PER_CYCLE = BEFORE[64] ?? 0;

const lanesAt = (slot: number): readonly number[] => CHART[((slot % 64) + 64) % 64] ?? [];

/** Notes already hit by this beat. */
const comboOf = (beat: number): number => {
  const slot = Math.floor(Math.max(0, beat) * 2);
  return Math.floor(slot / 64) * PER_CYCLE + (BEFORE[(slot % 64) + 1] ?? 0);
};

// ---- the venue (cached): the sky or the hall, the truss, the LED wall, the stage and the lanes ----

const paintTruss = (g: Ctx, f: Frame, st: Stage, c: Colors<K>): void => {
  const y = st.wide ? 2 : 6;
  fillRect(g, c.truss, 0, y, f.w, 1);
  fillRect(g, c.truss, 0, y + 4, f.w, 1);
  for (let x = 0; x < f.w; x += 4) pixelLine(g, x, y + 1, x + 3, y + 3, c.truss);
  for (const lx of lampsOf(f)) {
    fillRect(g, c.ink, lx - 3, y + 4, 7, 5);
    fillRect(g, c.truss, lx - 2, y + 5, 5, 3);
  }
};

const paintWall = (g: Ctx, st: Stage, c: Colors<K>): void => {
  const x = st.cx - st.wallHalf;
  const w = st.wallHalf * 2;
  const h = st.wallBottom - st.wallTop;
  fillRect(g, c.ink, x - 2, st.wallTop - 2, w + 4, h + 4);
  fillRect(g, c.wall, x, st.wallTop, w, h);
  for (let gx = x + 1; gx < x + w; gx += 2) for (let gy = st.wallTop + 1; gy < st.wallBottom; gy += 2) fillRect(g, c.sky0, gx, gy, 1, 1);
};

const paintStage = (g: Ctx, f: Frame, st: Stage, c: Colors<K>): void => {
  const back = st.wallBottom;
  g.drawImage(ditherGradient(f.w, st.edge - back, [c.stageLo, c.stage]), 0, back);
  for (let k = 1; k < 4; k++) fillRect(g, c.stageLo, 0, back + Math.round(((st.edge - back) * k * k) / 16), f.w, 1);
  fillRect(g, c.stageHi, 0, st.edge - 1, f.w, 1);
  fillRect(g, c.ink, 0, st.edge, f.w, 1);
};

const paintLanes = (g: Ctx, f: Frame, l: Lanes, c: Colors<K>): void => {
  for (let y = l.top; y < f.h; y++) {
    const hw = Math.round(halfAt(l, y));
    fillRect(g, c.ink, l.cx - hw - 2, y, hw * 2 + 4, 1);
    fillRect(g, (y - l.top) / (l.judge - l.top) > 0.55 + (y % 2) * 0.08 ? c.laneHi : c.lane, l.cx - hw, y, hw * 2, 1);
  }
  const bottom = f.h + 4;
  for (let k = 0; k <= 4; k++) {
    const top = l.cx - l.topHalf + (l.topHalf * 2 * k) / 4;
    const low = l.cx - halfAt(l, bottom) + (halfAt(l, bottom) * 2 * k) / 4;
    pixelLine(g, top, l.top, low, bottom, k === 0 || k === 4 ? c.white : c.edge);
  }
};

// The hall above the stage, and the audience floor below it in the haze the stage lights spill.
const paintSky = (g: Ctx, f: Frame, st: Stage, c: Colors<K>): void => {
  g.drawImage(ditherGradient(f.w, st.edge, [c.sky0, c.sky1, c.sky2]), 0, 0);
  g.drawImage(ditherGradient(f.w, f.h - st.edge, [c.crowdHi, c.floor]), 0, st.edge);
};

const venueLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`lanes-venue:${f.w}x${f.h}:${sigOf(c)}`, f.w, f.h, (g) => {
    const st = stageOf(f);
    paintSky(g, f, st, c);
    paintWall(g, st, c);
    paintStage(g, f, st, c);
    paintTruss(g, f, st, c);
    paintLanes(g, f, st.lanes, c);
  });

const venue = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(venueLayer(f, c), 0, 0);
};

// ---- the LED wall: an equalizer across it and a heart that beats in the middle ----

const eqBars = (ctx: Ctx, f: Frame, st: Stage, c: Colors<K>): void => {
  const x0 = st.cx - st.wallHalf + 2;
  const cols = Math.floor((st.wallHalf * 2 - 4) / 6);
  const h = st.wallBottom - st.wallTop - 4;
  for (let i = 0; i < cols; i++) {
    const wave = 0.5 + 0.5 * Math.sin(f.t * 2.2 + i * 0.7) * Math.cos(f.t * 1.3 - i * 0.4);
    const level = Math.min(1, wave * 0.6 + f.kick * 0.35 * rand(i, Math.floor(f.beat)));
    const blocks = Math.round(level * (h / 3));
    for (let b = 0; b < blocks; b++) {
      fillRect(ctx, b > h / 3 - 3 ? c.ledHi : c.led, x0 + i * 6, st.wallBottom - 3 - b * 3, 5, 2);
    }
  }
};

const ledHeart = (ctx: Ctx, f: Frame, st: Stage, c: Colors<K>): void => {
  const cy = Math.round(st.wallTop + (st.wallBottom - st.wallTop) * 0.42);
  const big = frac(f.beat) < 0.25 ? 1 : 0;
  const r = Math.round((st.wallBottom - st.wallTop) * (st.wide ? 0.18 : 0.11)) + big * 2;
  ctx.fillStyle = ditherStyle(ctx, c.ledHi, 0.75) ?? c.ledHi;
  for (let dy = -r; dy <= r * 2; dy++) {
    const half = dy < r * 0.2 ? r + Math.sqrt(Math.max(0, r * r - (dy + r * 0.2) ** 2)) * 0.9 : (r * 2 - dy) * 1.1;
    const notch = dy < -r * 0.35 ? Math.max(0, r * 0.5 - Math.abs(dy + r) * 0.9) : 0;
    const w = Math.round(half * 2);
    ctx.fillRect(Math.round(st.cx - w / 2), cy + dy, Math.round(w / 2 - notch), 1);
    ctx.fillRect(Math.round(st.cx + notch), cy + dy, Math.round(w / 2 - notch), 1);
  }
};

const ledWall = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const st = stageOf(f);
  eqBars(ctx, f, st, c);
  ledHeart(ctx, f, st, c);
};

// ---- spotlights sweeping the stage from the truss ----

const lampsOf = (f: Frame): readonly number[] => [0.12, 0.3, 0.7, 0.88].map((u) => Math.round(f.w * u));

const beams = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const st = stageOf(f);
  const top = st.wide ? 10 : 14;
  const style = ditherStyle(ctx, c.beam, 0.22 + f.kick * 0.15);
  if (!style) return;
  ctx.fillStyle = style;
  lampsOf(f).forEach((lx, i) => {
    const tx = st.cx + (lx - st.cx) * 0.25 + Math.sin(f.t * 0.8 + i * 1.9) * f.w * 0.16;
    for (let y = top; y < st.floor; y++) {
      const u = (y - top) / (st.floor - top);
      const half = 1 + u * 12;
      ctx.fillRect(Math.round(lx + (tx - lx) * u - half), y, Math.round(half * 2), 1);
    }
  });
};

// Bulbs along the stage edge chase each other twice a beat.
const chaser = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const st = stageOf(f);
  const notes = [c.note0, c.note1, c.note2, c.note3];
  const step = Math.floor(f.beat * 2);
  for (let i = 0, x = 3; x < f.w; i++, x += 7) {
    const lit = (i + step) % 3 === 0;
    fillRect(ctx, lit ? (notes[i % 4] ?? c.white) : c.stageLo, x, st.edge - 3, 2, 2);
  }
};

// ---- the idol ----

const arm = (ctx: Ctx, sx: number, sy: number, joint: readonly [Pt, Pt], p: Palette): void => {
  const [[ex, ey], [hx, hy]] = joint;
  const skin = p.s ?? '#ffe4d4';
  const ink = p.o ?? '#000000';
  limb(ctx, sx, sy, sx + ex, sy + ey, 1, skin, ink);
  limb(ctx, sx + ex, sy + ey, sx + hx, sy + hy, 1, skin, ink);
  drawSprite(ctx, GLOVE, p, sx + hx - 2, sy + hy - 2);
};

const idol = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const st = stageOf(f);
  const p = paletteOf(c, idolPalette);
  const pose = POSES[Math.floor(f.beat) % POSES.length] ?? (POSES[0] as Pose);
  const hop = frac(f.beat) < 0.18 ? 2 : frac(f.beat) < 0.32 ? 1 : 0;
  const x = st.cx - 14;
  const legsY = st.floor - 12 - hop;
  const skirtY = legsY - 8;
  const torsoY = skirtY - 8;
  const headY = torsoY - 23;
  const sway = Math.round(Math.sin(f.beat * Math.PI) * 5);
  strand(ctx, x + 25 + pose.lean, headY + 6, 24, sway, 5, (u) => 6 - u * 3 + Math.sin(u * Math.PI) * 2, {
    ink: p.o ?? c.ink,
    hair: p.h ?? c.white,
    hi: p.H ?? c.white,
    lo: p.d ?? c.ink,
  });
  drawSprite(ctx, pose.step ? LEGS_STEP : LEGS, p, x + 8, legsY);
  drawSprite(ctx, SKIRT, p, x + 4, skirtY);
  drawSprite(ctx, TORSO, p, x + 5, torsoY);
  arm(ctx, x + 7, torsoY + 4, pose.left, p);
  arm(ctx, x + 20, torsoY + 4, pose.right, p);
  if (pose === POSES[3]) drawSprite(ctx, HEART, p, x + 11, torsoY + 1);
  const singing = frac(f.beat * 2) >= 0.5;
  drawGirl(ctx, f, singing ? HEAD_SING : HEAD, p, x + pose.lean, headY, IDOL_GIRL);
  drawSprite(ctx, STAR, p, x + 22 + pose.lean, headY + 3);
};

// ---- the crowd: heads in silhouette, each waving a penlight from side to side on the beat ----

const PERSON: Sprite = [
  '...KKK...',
  '..Kkkkk..',
  '.Kkkkkkk.',
  '.Kkkkkkk.',
  '..kkkkk..',
  '...kkk...',
  '.KKkkkkk.',
  'Kkkkkkkkk',
  'Kkkkkkkkk',
  'kkkkkkkkk',
  'kkkkkkkkk',
];
const crowdPalette = (c: Colors<K>): Palette => ({ k: c.crowd, K: c.crowdHi });

type Fan = { readonly x: number; readonly y: number; readonly i: number };

const fansOf = (f: Frame, st: Stage): readonly Fan[] => {
  const l = st.lanes;
  const fans: Fan[] = [];
  const rows = st.wide ? [l.top + 58, l.top + 44, l.top + 31, l.top + 19] : [l.top + 52, l.top + 40, l.top + 28];
  rows.forEach((base, r) => {
    const room = Math.round(l.cx - halfAt(l, base) - 10);
    for (let x = 4 + r * 5; x < room; x += 10) {
      fans.push({ x, y: base, i: fans.length }, { x: f.w - x, y: base, i: fans.length + 1 });
    }
  });
  return fans;
};

const crowd = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const st = stageOf(f);
  const notes = [c.note0, c.note1, c.note2, c.note3];
  const palette = paletteOf(c, crowdPalette);
  const swing = Math.floor(f.beat) % 2 === 0 ? 1 : -1;
  for (const fan of fansOf(f, st)) {
    const bob = (fan.i + Math.floor(f.beat)) % 2 === 0 && frac(f.beat) < 0.3 ? 1 : 0;
    const top = fan.y - 11 - bob;
    const color = notes[fan.i % 4] ?? c.white;
    const hand = fan.x + (fan.i % 2 === 0 ? 3 : -3);
    pixelLine(ctx, hand, top + 4, hand + swing * 3, top - 4, color);
    fillRect(ctx, c.white, hand + swing * 3, top - 4, 1, 1);
    drawSprite(ctx, PERSON, palette, fan.x - 4, top);
  }
};

// ---- the notes ----

const noteColor = (c: Colors<K>, lane: number): string => [c.note0, c.note1, c.note2, c.note3][lane] ?? c.white;

const beatLines = (ctx: Ctx, f: Frame, l: Lanes, c: Colors<K>): void => {
  for (let n = Math.ceil(f.beat); n < f.beat + LOOKAHEAD; n++) {
    const y = Math.round(rowOf(l, n - f.beat));
    const hw = Math.round(halfAt(l, y));
    fillRect(ctx, n % 4 === 0 ? c.edge : c.lane, l.cx - hw, y, hw * 2, 1);
  }
};

const note = (ctx: Ctx, l: Lanes, d: number, lane: number, c: Colors<K>): void => {
  const y = rowOf(l, d);
  const scale = (y - vanishOf(l)) / (l.judge - vanishOf(l));
  const h = Math.max(2, Math.round(7 * scale));
  const [x0, x1] = laneSpan(l, y, lane);
  const top = Math.round(y - h / 2);
  fillRect(ctx, c.ink, x0, top - 1, x1 - x0 + 1, h + 2);
  fillRect(ctx, noteColor(c, lane), x0 + 1, top, x1 - x0 - 1, h);
  fillRect(ctx, c.white, x0 + 2, top, x1 - x0 - 3, 1);
};

/** Fills one lane between two rows, following its edges. */
const laneFill = (ctx: Ctx, l: Lanes, lane: number, top: number, bottom: number, style: string | CanvasPattern | null): void => {
  if (!style) return;
  ctx.fillStyle = style;
  for (let y = Math.round(top); y < Math.round(bottom); y++) {
    const [x0, x1] = laneSpan(l, y, lane);
    ctx.fillRect(x0 + 2, y, x1 - x0 - 3, 1);
  }
};

// Every eight beats a long note: held for two beats in an outer lane, its band shrinking into the judgment line.
const holds = (ctx: Ctx, f: Frame, l: Lanes, c: Colors<K>): void => {
  for (let k = Math.floor((f.beat - 6) / 8); k <= Math.floor((f.beat + LOOKAHEAD - 4) / 8); k++) {
    const start = k * 8 + 4;
    const lane = k % 2 === 0 ? 0 : 3;
    const head = start - f.beat;
    const tail = start + 2 - f.beat;
    if (tail < 0 || head > LOOKAHEAD) continue;
    const yTail = tail > LOOKAHEAD ? l.top : rowOf(l, tail);
    const yHead = head < 0 ? l.judge : rowOf(l, head);
    laneFill(ctx, l, lane, yTail, yHead, ditherStyle(ctx, noteColor(c, lane), 0.5));
    note(ctx, l, Math.min(LOOKAHEAD, tail), lane, c);
    if (head < 0) burst(ctx, l, lane, frac(f.t * 4) * 0.2, c);
  }
};

const notes = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = stageOf(f).lanes;
  beatLines(ctx, f, l, c);
  holds(ctx, f, l, c);
  const first = Math.floor(f.beat * 2) + 1;
  for (let slot = first + LOOKAHEAD * 2; slot >= first; slot--) {
    const d = slot / 2 - f.beat;
    if (d > LOOKAHEAD) continue;
    for (const lane of lanesAt(slot)) note(ctx, l, d, lane, c);
  }
  combo(ctx, f, l, c);
};

// ---- the judgment line, the hit bursts, PERFECT and the combo ----

const burst = (ctx: Ctx, l: Lanes, lane: number, age: number, c: Colors<K>): void => {
  const [x0, x1] = laneSpan(l, l.judge, lane);
  const cx = Math.round((x0 + x1) / 2);
  const color = noteColor(c, lane);
  laneFill(ctx, l, lane, l.judge - 36, l.judge, ditherStyle(ctx, color, (1 - age / 0.5) * 0.4));
  const r = Math.round(4 + age * 26);
  fillRect(ctx, c.white, cx - r, l.judge - 1, r * 2 + 1, 1);
  for (const [dx, dy] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ] as const) {
    fillRect(ctx, color, cx + dx * r * 0.6 - 1, l.judge + dy * r * 0.4, 3, 1);
    fillRect(ctx, color, cx + dx * r * 0.6, l.judge + dy * r * 0.4 - 1, 1, 3);
  }
};

const judgeLine = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = stageOf(f).lanes;
  const hw = Math.round(halfAt(l, l.judge));
  fillRect(ctx, frac(f.beat) < 0.15 ? c.white : c.edge, l.cx - hw, l.judge - 1, hw * 2, 3);
  const slot = Math.floor(f.beat * 2);
  for (let s = slot; s > slot - 2; s--) {
    const age = f.beat - s / 2;
    if (age >= 0.5) continue;
    for (const lane of lanesAt(s)) burst(ctx, l, lane, age, c);
  }
  for (let lane = 0; lane < 4; lane++) {
    const [x0, x1] = laneSpan(l, l.judge + 6, lane);
    const lit = lanesAt(slot).includes(lane) && frac(f.beat * 2) < 0.4;
    fillRect(ctx, c.ink, x0 + 3, l.judge + 4, x1 - x0 - 5, 6);
    fillRect(ctx, lit ? c.white : noteColor(c, lane), x0 + 4, l.judge + 5, x1 - x0 - 7, 4);
  }
};

const combo = (ctx: Ctx, f: Frame, l: Lanes, c: Colors<K>): void => {
  const n = comboOf(f.beat);
  if (n < 2) return;
  const scale = l.judge - l.top > 120 ? 3 : 2;
  const y = l.top + Math.round((l.judge - l.top) * 0.18) - (frac(f.beat) < 0.12 ? 1 : 0);
  bigText(ctx, String(n), l.cx, y, scale, c.white, c.ink);
  const label = 'COMBO';
  drawText(ctx, label, Math.round(l.cx - textWidth(label) / 2), y + 7 * scale + 3, c.note0);
};

const perfect = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = stageOf(f).lanes;
  const slot = Math.floor(f.beat * 2);
  const hit = [slot, slot - 1].find((s) => lanesAt(s).length > 0 && f.beat - s / 2 < 0.6);
  if (hit === undefined) return;
  const age = (f.beat - hit / 2) / 0.6;
  if (age > 0.8 && frac(age * 10) < 0.5) return;
  const word = rand(hit, 11) < 0.12 ? 'GREAT' : 'PERFECT';
  bigText(ctx, word, l.cx, l.judge - 24 - Math.round(Math.min(1, age * 4) * 3), 2, word === 'GREAT' ? c.note2 : c.note1, c.ink);
};

// ---- the HUD: score, and how far through the song we are ----

const hud = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const st = stageOf(f);
  const y = st.wide ? 12 : 4;
  const left = st.wide ? 4 : 6;
  fillDither(ctx, c.ink, 0.75, left - 2, y - 2, 58, 21);
  drawText(ctx, 'SCORE', left, y, c.note0);
  drawText(ctx, digits(comboOf(f.beat) * 3170, 7), left, y + 10, c.text);
  const barW = st.wide ? 56 : 52;
  const bx = f.w - barW - (st.wide ? 6 : 8);
  fillDither(ctx, c.ink, 0.75, bx - 2, y - 2, barW + 4, 21);
  drawText(ctx, 'LIVE', bx, y, c.note1);
  if (frac(f.t) < 0.6) fillRect(ctx, c.note0, bx + 26, y + 2, 3, 3);
  fillRect(ctx, c.lane, bx, y + 11, barW, 4);
  fillRect(ctx, c.note2, bx, y + 11, Math.round(frac(Math.max(0, f.beat) / 256) * barW), 4);
};

export const rhythmLanes = defineScene<K>({
  id: 'rhythm-lanes',
  title: 'Rhythm Lanes',
  mood: { valence: 0.7, energy: 0.8 },
  styles: ['nineties-pop', 'neon-rush', 'summer-festival', 'puzzle-pop', 'trance-pop', 'eurobeat', 'technopop', 'idol-disco', 'kawaii-pop'],
  variants: [
    {
      mood: { valence: 0.7, energy: 0.8 },
      colors: {
        sky0: '#140824',
        sky1: '#2e0e4a',
        sky2: '#5a1a6a',
        truss: '#6a5a8a',
        wall: '#0e0618',
        led: '#c03a9a',
        ledHi: '#ff8ad8',
        beam: '#ffe0f4',
        stage: '#4a2a6a',
        stageHi: '#c08ae8',
        stageLo: '#24123a',
        lane: '#120c2a',
        laneHi: '#1e1640',
        edge: '#6a5aa8',
        note0: '#ff5aa8',
        note1: '#ffd84a',
        note2: '#4ae0ff',
        note3: '#a87aff',
        crowd: '#0a0618',
        crowdHi: '#4a2a6a',
        floor: '#140824',
        text: '#ffffff',
        ink: '#0a0414',
        white: '#ffffff',
        tint: '#ff9ad8',
      },
    },
    {
      mood: { valence: -0.3, energy: 0.7 },
      colors: {
        sky0: '#040616',
        sky1: '#0a1434',
        sky2: '#16285a',
        truss: '#4a5a7a',
        wall: '#04060e',
        led: '#2a6ac8',
        ledHi: '#8ad8ff',
        beam: '#b0d8ff',
        stage: '#1a2a4a',
        stageHi: '#6a9ad8',
        stageLo: '#0a1228',
        lane: '#060a1a',
        laneHi: '#0e1630',
        edge: '#3a5a9a',
        note0: '#4ae0ff',
        note1: '#ffffff',
        note2: '#7a8aff',
        note3: '#ff6ab8',
        crowd: '#03050c',
        crowdHi: '#1e2e50',
        floor: '#040616',
        text: '#e8f4ff',
        ink: '#02040a',
        white: '#ffffff',
        tint: '#6aa0ff',
      },
    },
    {
      mood: { valence: 0.8, energy: 0.35 },
      colors: {
        sky0: '#3a7ad8',
        sky1: '#8ab0e8',
        sky2: '#ffc890',
        truss: '#5a4a6a',
        wall: '#1a1028',
        led: '#ff8a3a',
        ledHi: '#ffe07a',
        beam: '#fff4d0',
        stage: '#8a5a4a',
        stageHi: '#ffc8a0',
        stageLo: '#4a2a2a',
        lane: '#2a1a3a',
        laneHi: '#3a2a4a',
        edge: '#a07ab0',
        note0: '#ff7a3a',
        note1: '#5ae06a',
        note2: '#ff5aa8',
        note3: '#4ab0ff',
        crowd: '#3a2050',
        crowdHi: '#c08a7a',
        floor: '#4a3a6a',
        text: '#ffffff',
        ink: '#1a0e1e',
        white: '#ffffff',
        tint: '#ffd8a0',
      },
    },
  ],
  layers: [venue, ledWall, beams, chaser, idol, crowd, notes, judgeLine, perfect, hud],
});
