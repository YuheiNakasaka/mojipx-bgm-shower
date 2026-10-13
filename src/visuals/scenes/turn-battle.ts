// A side-view turn battle from a game that never existed: a swordsman, a mage girl and a young healer face a crystal
// golem; time gauges fill, each turn lands on the beat with damage popping up, and blue windows list commands and HP.
import { type Ctx, drawSprite, fillRect, type Palette, type Recolor, type Sprite } from 'mojipx';
import { ditherGradient, frac, noise1, pixelLine, rand, ridgeNoise } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { drawGlow, wrap } from './batch-1-helpers.ts';
import { paletteOf, sigOf } from './batch-3-helpers.ts';
import {
  drawText,
  drawTextOutlined,
  drawWindow,
  fillPolygon,
  memoLayer,
  type Pt,
  sunWithHalo,
  textWidth,
  type WindowColors,
} from './batch-4-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'orb'
  | 'glow'
  | 'far'
  | 'farLit'
  | 'ground'
  | 'groundLo'
  | 'groundHi'
  | 'rock'
  | 'rockHi'
  | 'rockLo'
  | 'crystal'
  | 'crystalLo'
  | 'crystalHi'
  | 'eye'
  | 'spell'
  | 'heal'
  | 'gauge'
  | 'win0'
  | 'win1'
  | 'rim'
  | 'text'
  | 'ink';

// Palette builders live at module level: palettes are cached per builder and color set.
const shardColors = (k: Colors<K>): Palette => ({ o: k.ink, C: k.crystal, H: k.crystalHi });
const pointerColors = (k: Colors<K>): Palette => ({ o: k.ink, w: k.text });

// ---- the party (facing left) ----

const MAGE: Sprite = [
  '...................oo.........',
  '..................otto........',
  '..................otTo........',
  '.................otTto........',
  '.................otTtto.......',
  '................otTttto.......',
  '................otTtttto......',
  '...............otTttttto......',
  '...............ogggggggo......',
  '..............otgggqgggto.....',
  '.ooo...ooooooottttttttttoooo..',
  'oqQqo.ootttTTTTTTTTTTTTtttttoo',
  'oqqqo.odddddddddddddddddddddo.',
  '.oro.ohhHHhhhhhhhhhhhhhhhhho..',
  '.oroohhHhhhhhhhhhhhhhhHHdhhho.',
  '.oroohhhhohhhhhhohhhhhhHdhhho.',
  '.oroohhhossshhhhsshhhhhhdhhhho',
  '.oroohhosssssshssssshhhhdhhhho',
  '.oroohhsoooosssoooosshhdhhhho.',
  '.oroohhowweessswweeshhdhhhhhho',
  '.oroohsoweeesssweesshhdhhhhhho',
  '.oroohsoeiiessseiieshddhhhhhho',
  '.oroohssoiiosssoiiosshdhhhhhho',
  '.oroohhsbbsssssssbbsshdhhhhdho',
  '.oroohhsssssoosssssshhdhhhhdho',
  '.oro.ohhsssssssssssohhdhhhhdho',
  '.oro.ohoossssssssooohhdhhhhdho',
  '.oro.oho.oolllllooo.ohhhhhhdho',
  '.oro.oho.olllglllo...ohhhhhdho',
  '.oro.hhooccllgllccoo.ohhhhhdho',
  '.oroohooccCcclllcccko.ohhhhdho',
  '.osssooCCcccclcccckko.ohhhdho.',
  '.ossso.oCcccccccccko..ohhhdo..',
  '.oro..oocccccccccckko..ohhdo..',
  '.oro..occcccccccckkkko..ohho..',
  '.oro..occcccccccckkkko...oo...',
  '.oro.occcccccccccckkkko.......',
  '.oro.oCCcccccccccckkkko.......',
  '.oro.olllllllllllllllllo......',
  '.oro..ooooooooooooooooo.......',
  '.oro.....oSso..oSso...........',
  '.oro.....osso..osso...........',
  '.oro.....offo..offo...........',
  '.oro....offfo.offfo...........',
  '..o.....ooooo.ooooo...........',
];

const SWORD: Sprite = [
  'oo.........ooo..ooo......',
  'oAo.......ohhooohhho.....',
  '.oAo.....ohHhhhhhhhhoo...',
  '..oAo...ohHHhhhhhhhhhho..',
  '...oAo.ohhHhhhhhhhhhhhho.',
  '....oAoohhhhhhhhhhhhhhhho',
  '.....oAohhhohhhhhhhhhhho.',
  '......oAhhhossohhhhhhhho.',
  '......ooAhosssssshhhhhho.',
  '.....oRRoAoooossooshhhho.',
  '......ooRRoweesweesshhho.',
  '.......oRoeiissseiisshho.',
  '.......ooosiossssoiosshho',
  '........ossssssssssssho..',
  '........gggsssoosssssho..',
  '.......ogsgosssssssssoo..',
  '......ossgoooossssssoo...',
  '......osssoaoooooooarro..',
  '.......ooaaAaaarrrrrrro..',
  '.......oaaoaaaarrrrraao..',
  '......oaAaaoaaarrrrrraao.',
  '......oaaaaoaaarrrrrraao.',
  '......oaaaoorrrrrrrrraao.',
  '.......ooaoorrrrrrrrrao..',
  '.........oorrrrrrrrrrrco.',
  '.........oarrrrrrrrrrcco.',
  '.........ooaaaaaaaaaacco.',
  '..........obbbbobbbbocco.',
  '..........obbbo.obbbocco.',
  '..........obbbo.obbboco..',
  '..........offfo.offfo....',
  '.........offffo.offffo...',
  '.........oooooo.oooooo...',
];

const HEALER: Sprite = [
  '.........oooooo.........',
  '.......oollllllo........',
  '......olLLLllllloo......',
  '.....olLlllllllllloo....',
  '....olllhhhhhhhhllllo...',
  '....ollhhHHhhhhhhhllo...',
  '...ollhhHhhhhhhhhhhllo..',
  '...olhhhhohhhhhohhhhlo..',
  '...olhhhosssshhssshhlo..',
  '...olhhsssssssssssshlo..',
  '...olhsoooossooooosslo..',
  '...olhsowessssweesslo...',
  '...olhsoeiosssoeiosslo..',
  '...olssbbsssssssbbsslo..',
  '...ollsssssoosssssslo...',
  '....olosssssssssssolo...',
  '....olloossssssooollo...',
  '...ollllooooooollllllo..',
  '..olLLllllgggllllllllo..',
  '..olLlllllgGglllllllllo.',
  '.olLllllllgggllllllllo..',
  'oolllllllllllllllllllllo',
  'osoLlllllllllllllllllllo',
  'oooLllllllllllllllllllo.',
  '..oLlllllllllllllllllllo',
  '..olllllllllllllllllllo.',
  '..oggggggggggggggggggo..',
  '..oooooooooooooooooooo..',
  '.......offo..offo.......',
  '......offfo.offfo.......',
  '......ooooo.ooooo.......',
];

// Shared by the three: o outline, s skin, S skin shade, b blush, e eye, i iris, w eye light, g gold, f boots.
const BASE: Palette = {
  o: '#1a1028',
  s: '#ffe0c8',
  S: '#e8b098',
  b: '#ff9cac',
  e: '#2a2050',
  i: '#6a7cf0',
  w: '#ffffff',
  g: '#f2c040',
  G: '#fff0a0',
  f: '#5a3420',
};

const MAGE_PALETTE: Palette = {
  ...BASE,
  t: '#2c3e8c',
  T: '#4a68c8',
  q: '#7ff0ff',
  Q: '#ffffff',
  h: '#f08cb8',
  H: '#ffd0e4',
  d: '#b85488',
  c: '#3c58b8',
  C: '#6a8ae8',
  k: '#24357a',
  l: '#f4f0ff',
  r: '#8a5a30',
};
const SWORD_PALETTE: Palette = {
  ...BASE,
  h: '#8a3a2a',
  H: '#c8664a',
  d: '#5a2018',
  a: '#a8b4d0',
  A: '#f0f4ff',
  R: '#c03040',
  r: '#7a4a2a',
  b: '#3a4a8a',
  c: '#3c58b8',
};
const HEALER_PALETTE: Palette = { ...BASE, l: '#5aa86a', L: '#9ad88a', h: '#c88a4a', H: '#f0c080' };

// Closed eyes: the eye pixels become skin, with a lash line across the middle row.
const blinkOf = (sprite: Sprite, lidRow: number, rows: number): Sprite =>
  sprite.map((row, y) => (y > lidRow && y <= lidRow + rows ? row.replace(/[wei]/g, y === lidRow + 2 ? 'o' : 's') : row));

type Member = {
  readonly name: string;
  readonly hp: number;
  readonly mp: number;
  readonly open: Sprite;
  readonly shut: Sprite;
  readonly palette: Palette;
  /** The quarter of the four-bar cycle in which this member acts. */
  readonly turn: number;
};

const PARTY: readonly Member[] = [
  { name: 'ARDEN', hp: 348, mp: 12, open: SWORD, shut: blinkOf(SWORD, 9, 3), palette: SWORD_PALETTE, turn: 0 },
  { name: 'PIPPA', hp: 216, mp: 96, open: MAGE, shut: blinkOf(MAGE, 18, 4), palette: MAGE_PALETTE, turn: 1 },
  { name: 'OREN', hp: 271, mp: 74, open: HEALER, shut: blinkOf(HEALER, 10, 3), palette: HEALER_PALETTE, turn: 3 },
];

const ENEMY_TURN = 2;

// ---- layout ----

type Layout = {
  readonly wide: boolean;
  readonly horizon: number;
  /** Top of the menu windows; the battlefield ends here. */
  readonly winTop: number;
  readonly cmdW: number;
  readonly golemX: number;
  readonly golemFoot: number;
  /** Where each member stands: centre x and foot y, from the back row to the front. */
  readonly slots: readonly Pt[];
};

const layoutOf = (f: Frame): Layout => {
  if (f.w > f.h) {
    const winTop = f.h - 54;
    return {
      wide: true,
      horizon: Math.round(f.h * 0.4),
      winTop,
      cmdW: 64,
      golemX: Math.round(f.w * 0.27),
      golemFoot: winTop - 6,
      slots: [
        [Math.round(f.w * 0.7), winTop - 42],
        [Math.round(f.w * 0.795), winTop - 22],
        [Math.round(f.w * 0.89), winTop - 4],
      ],
    };
  }
  const winTop = f.h - 76;
  return {
    wide: false,
    horizon: Math.round(f.h * 0.3),
    winTop,
    cmdW: 58,
    golemX: Math.round(f.w * 0.32),
    golemFoot: Math.round(f.h * 0.53),
    slots: [
      [Math.round(f.w * 0.58), winTop - 64],
      [Math.round(f.w * 0.73), winTop - 38],
      [Math.round(f.w * 0.88), winTop - 12],
    ],
  };
};

// ---- the timeline: a four-bar cycle; each bar one turn, the hit on its second beat ----

type Turn = { readonly cycle: number; readonly turn: number; readonly p: number };

const turnOf = (f: Frame): Turn => {
  const b = Math.max(0, f.beat);
  return { cycle: Math.floor(b / 16), turn: Math.floor(b / 4) % 4, p: b - Math.floor(b / 4) * 4 };
};

/** 0 → 1 → 0 over [a, b], easing out and back. */
const bump = (p: number, a: number, b: number): number => (p <= a || p >= b ? 0 : Math.sin(((p - a) / (b - a)) * Math.PI));

const damageOf = (cycle: number, k: number): number => 40 + Math.floor(rand(cycle, k + 3) * 60);

/** Each member's HP: down after the golem's strike, back up after the healer's turn. */
const hpOf = (m: Member, k: number, t: Turn): number => {
  const hurt = (t.turn === ENEMY_TURN && t.p >= 1.5) || (t.turn === 3 && t.p < 1);
  return hurt ? m.hp - damageOf(t.cycle, k) : m.hp;
};

/** How full a member's time gauge is: empty right after their turn, full when it comes round again. */
const gaugeOf = (f: Frame, m: Member): number => {
  const since = wrap(Math.max(0, f.beat) - (m.turn * 4 + 3), 16);
  return Math.min(1, since / 13);
};

// ---- the backdrop ----

// Far mesas: a ridge clipped flat at the top, so the summits become table lands with sloping sides.
const paintMesas = (g: Ctx, f: Frame, l: Layout, c: Colors<K>): void => {
  for (let x = 0; x < f.w; x++) {
    const rise = Math.min(18, Math.max(2, (ridgeNoise(x / 34, 3) * 1.7 - 0.45) * 30));
    const top = Math.round(l.horizon - rise);
    fillRect(g, c.far, x, top, 1, l.horizon - top);
    fillRect(g, c.farLit, x, top, 1, rise >= 18 ? 2 : 1);
  }
};

// Crystal spires on the far plain catch the light: a lit face, a shaded face and a bright edge.
const paintSpires = (g: Ctx, f: Frame, l: Layout, c: Colors<K>): void => {
  for (let i = 0; i < 9; i++) {
    const x = Math.round(rand(i, 11) * f.w);
    const h = Math.round(10 + rand(i, 12) * 22);
    const lean = (rand(i, 13) - 0.5) * 8;
    const base = l.horizon + 1;
    fillPolygon(
      g,
      [
        [x - 3, base],
        [x + lean, base - h],
        [x, base],
      ],
      c.crystal,
    );
    fillPolygon(
      g,
      [
        [x, base],
        [x + lean, base - h],
        [x + 3, base],
      ],
      c.crystalLo,
    );
    pixelLine(g, x, base - 1, x + lean, base - h + 1, c.crystalHi);
  }
};

// The plain: darker toward the horizon, faint furrows spreading out with distance, pebbles and crystal stubs.
const paintGround = (g: Ctx, f: Frame, l: Layout, c: Colors<K>): void => {
  const depth = l.winTop - l.horizon;
  g.drawImage(ditherGradient(f.w, depth, [c.groundLo, c.ground, c.ground]), 0, l.horizon);
  for (let k = 0, y = l.horizon + 3; y < l.winTop; k++, y += 3 + k * 2) {
    for (let x = 0; x < f.w; x++) if (noise1(x / 7, k) > 0.42) fillRect(g, c.groundLo, x, y, 1, 1);
  }
  for (let i = 0; i < 60; i++) {
    const near = rand(i, 21) ** 0.8;
    const y = l.horizon + 3 + Math.floor(near * (depth - 4));
    const x = Math.floor(rand(i, 23) * f.w);
    const size = 1 + Math.round(near * 3 * rand(i, 22));
    fillRect(g, c.groundLo, x, y + 1, size + 1, 1);
    fillRect(g, i % 5 === 0 ? c.crystal : c.groundHi, x, y, size, 1);
  }
};

const paintSky = (g: Ctx, f: Frame, l: Layout, c: Colors<K>): void => {
  g.drawImage(ditherGradient(f.w, l.horizon, [c.sky0, c.sky1, c.sky2]), 0, 0);
  const r = Math.round(Math.min(f.w, f.h) * 0.09);
  sunWithHalo(g, Math.round(f.w * (l.wide ? 0.55 : 0.7)), Math.round(l.horizon * 0.62), r, c.orb, c.glow);
};

const BACKDROP = [paintSky, paintMesas, paintSpires, paintGround] as const;

const backdropLayer = (f: Frame, l: Layout, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`battle-back:${sigOf(c)}`, f.w, f.h, (g) => {
    for (const paint of BACKDROP) paint(g, f, l, c);
  });

const backdrop = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(backdropLayer(f, layoutOf(f), c), 0, 0);
};

// Slivers of crystal drift up through the air and twinkle.
const motes = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  for (let i = 0; i < 14; i++) {
    const span = l.winTop + 10;
    const y = Math.round(span - wrap(rand(i, 31) * span + f.t * (3 + rand(i, 32) * 4), span));
    const x = Math.round(rand(i, 33) * f.w + Math.sin(f.t * 0.8 + i) * 4);
    const lit = Math.sin(f.t * 3 + i * 1.7) > 0.3;
    fillRect(ctx, lit ? c.crystalHi : c.crystal, x, y - 1, 1, 3);
    fillRect(ctx, c.crystal, x - 1, y, 3, 1);
  }
};

// ---- the golem: rock and crystal drawn from polygons, cached; a white copy flashes when it is hit ----

type Crystal = { readonly b: Pt; readonly t: Pt; readonly hw: number };

const BACK_CRYSTALS: readonly Crystal[] = [
  { b: [30, 24], t: [17, 2], hw: 5 },
  { b: [40, 20], t: [38, 0], hw: 6 },
  { b: [50, 21], t: [61, 5], hw: 4 },
  { b: [22, 32], t: [5, 19], hw: 4 },
];
const FRONT_CRYSTALS: readonly Crystal[] = [
  { b: [63, 31], t: [73, 15], hw: 4 },
  { b: [40, 50], t: [40, 37], hw: 4 },
  { b: [69, 61], t: [71, 52], hw: 3 },
  { b: [77, 60], t: [82, 53], hw: 2 },
  { b: [9, 58], t: [4, 50], hw: 3 },
];

const BACK_ARM: readonly (readonly Pt[])[] = [
  [
    [18, 28],
    [10, 34],
    [6, 52],
    [10, 60],
    [18, 58],
    [22, 40],
  ],
  [
    [3, 56],
    [18, 56],
    [20, 68],
    [7, 71],
    [2, 64],
  ],
];
const LEGS: readonly (readonly Pt[])[] = [
  [
    [24, 60],
    [36, 60],
    [38, 80],
    [20, 80],
  ],
  [
    [44, 60],
    [58, 60],
    [62, 80],
    [42, 80],
  ],
];
const TORSO: readonly Pt[] = [
  [14, 32],
  [26, 20],
  [50, 16],
  [64, 22],
  [70, 36],
  [66, 56],
  [50, 66],
  [26, 66],
  [14, 54],
];
const TORSO_LIT: readonly Pt[] = [
  [18, 32],
  [28, 22],
  [48, 19],
  [57, 22],
  [40, 27],
  [24, 37],
];
const TORSO_DARK: readonly Pt[] = [
  [60, 40],
  [66, 56],
  [50, 66],
  [28, 66],
  [46, 57],
];
const HEAD: readonly Pt[] = [
  [57, 28],
  [68, 23],
  [78, 27],
  [81, 37],
  [73, 44],
  [60, 42],
];
const FRONT_ARM: readonly (readonly Pt[])[] = [
  [
    [55, 30],
    [68, 31],
    [73, 48],
    [64, 54],
    [57, 44],
  ],
  [
    [62, 47],
    [74, 49],
    [79, 62],
    [66, 64],
  ],
  [
    [61, 60],
    [80, 57],
    [84, 70],
    [78, 78],
    [62, 76],
  ],
];

type Tint = (key: 'rock' | 'rockHi' | 'rockLo' | 'crystal' | 'crystalLo' | 'crystalHi') => string;

const paintCrystal = (g: Ctx, cr: Crystal, ox: number, oy: number, tint: Tint): void => {
  const [bx, by] = cr.b;
  const [tx, ty] = cr.t;
  const len = Math.hypot(tx - bx, ty - by);
  const nx = (-(ty - by) / len) * cr.hw;
  const ny = ((tx - bx) / len) * cr.hw;
  const sx = bx + (tx - bx) * 0.7;
  const sy = by + (ty - by) * 0.7;
  const at = (x: number, y: number): Pt => [ox + x, oy + y];
  fillPolygon(g, [at(bx - nx, by - ny), at(sx - nx, sy - ny), at(tx, ty), at(bx, by)], tint('crystal'));
  fillPolygon(g, [at(bx, by), at(tx, ty), at(sx + nx, sy + ny), at(bx + nx, by + ny)], tint('crystalLo'));
  pixelLine(g, ox + bx, oy + by, ox + tx, oy + ty + 1, tint('crystalHi'));
};

const shape = (g: Ctx, pts: readonly Pt[], ox: number, oy: number, color: string): void =>
  fillPolygon(
    g,
    pts.map(([x, y]) => [ox + x, oy + y]),
    color,
  );

const paintGolemShapes = (g: Ctx, ox: number, oy: number, tint: Tint): void => {
  for (const cr of BACK_CRYSTALS) paintCrystal(g, cr, ox, oy, tint);
  for (const part of BACK_ARM) shape(g, part, ox, oy, tint('rockLo'));
  for (const leg of LEGS) shape(g, leg, ox, oy, tint('rockLo'));
  shape(g, TORSO, ox, oy, tint('rock'));
  shape(g, TORSO_LIT, ox, oy, tint('rockHi'));
  shape(g, TORSO_DARK, ox, oy, tint('rockLo'));
  shape(g, HEAD, ox, oy, tint('rock'));
  for (const part of FRONT_ARM) shape(g, part, ox, oy, tint('rock'));
  for (const cr of FRONT_CRYSTALS) paintCrystal(g, cr, ox, oy, tint);
};

const AROUND: readonly Pt[] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

const GOLEM_W = 88;
const GOLEM_H = 84;

const golemLayer = (c: Colors<K>, flash: boolean): HTMLCanvasElement =>
  memoLayer(`battle-golem:${flash}:${sigOf(c)}`, GOLEM_W, GOLEM_H, (g) => {
    for (const [dx, dy] of AROUND) paintGolemShapes(g, 2 + dx, 2 + dy, () => c.ink);
    paintGolemShapes(g, 2, 2, flash ? () => c.text : (key) => c[key]);
    if (!flash)
      for (const [x, y] of [
        [30, 44],
        [52, 30],
        [26, 58],
        [62, 70],
      ] as const)
        fillRect(g, c.ink, x, y, 3, 1);
  });

type Pose = { readonly x: number; readonly y: number; readonly flash: boolean };

const golemPose = (f: Frame, l: Layout): Pose => {
  const t = turnOf(f);
  const hit = t.turn < ENEMY_TURN && t.p >= 1 && t.p < 1.45;
  const shake = hit ? (Math.floor(t.p * 16) % 2 === 0 ? 2 : -2) : 0;
  const lunge = t.turn === ENEMY_TURN ? Math.round(bump(t.p, 0.4, 1.8) * 10) : 0;
  const breathe = Math.round(Math.sin(f.beat * Math.PI) * 0.6 + 0.4);
  return {
    x: l.golemX - GOLEM_W / 2 + shake + lunge,
    y: l.golemFoot - GOLEM_H + 2 + breathe,
    flash: hit && Math.floor(t.p * 12) % 3 !== 2,
  };
};

const golem = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const pose = golemPose(f, l);
  ctx.fillStyle = c.groundLo;
  ctx.fillRect(l.golemX - 34, l.golemFoot - 2, 68, 4);
  ctx.fillRect(l.golemX - 28, l.golemFoot - 3, 56, 6);
  const core = 0.45 + 0.35 * (1 - frac(f.beat)) ** 2 + f.kick * 0.2;
  drawGlow(ctx, c.crystalHi, pose.x + 42, pose.y + 46, 12, 12, Math.round(core * 8) / 8, 3);
  ctx.drawImage(golemLayer(c, pose.flash), Math.round(pose.x), Math.round(pose.y));
  const blink = frac(f.t / 4.3) > 0.96;
  if (!pose.flash && !blink) {
    fillRect(ctx, c.eye, pose.x + 71, pose.y + 34, 3, 2);
    fillRect(ctx, c.eye, pose.x + 77, pose.y + 34, 2, 2);
    fillRect(ctx, c.text, pose.x + 72, pose.y + 34, 1, 1);
  }
};

// ---- the party on the field ----

const memberX = (f: Frame, m: Member, slot: Pt): number => {
  const t = turnOf(f);
  const step = t.turn === m.turn ? bump(t.p, 0, 3.2) : 0;
  return Math.round(slot[0] - Math.min(1, step * 1.6) * 14);
};

// Hurt members flinch back and flash; the others bob on the beat.
const memberY = (f: Frame, slot: Pt, k: number): number => slot[1] + ((Math.floor(f.beat) + k) % 2 === 0 ? 0 : 1);

// A recolor that turns everything but the outline white, for the flash of a hit.
const whites = new WeakMap<Palette, Recolor>();
const whiteOf = (palette: Palette): Recolor => {
  const hit = whites.get(palette);
  if (hit) return hit;
  const made: Recolor = Object.fromEntries(Object.keys(palette).map((k) => [k, k === 'o' ? (palette.o ?? '#000000') : '#ffffff']));
  whites.set(palette, made);
  return made;
};

const hurtNow = (f: Frame): boolean => {
  const t = turnOf(f);
  return t.turn === ENEMY_TURN && t.p >= 1.5 && t.p < 1.9;
};

const party = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const hurt = hurtNow(f);
  PARTY.forEach((m, k) => {
    const slot = l.slots[k] as Pt;
    const x = memberX(f, m, slot) + (hurt ? 3 : 0);
    const y = memberY(f, slot, k);
    fillRect(ctx, c.groundLo, x - 9, slot[1] - 1, 18, 2);
    const shut = frac(f.t / 3.7 + k * 0.31) > 0.95;
    const sprite = shut ? m.shut : m.open;
    const flash = hurt && Math.floor(f.t * 20) % 2 === 0 ? whiteOf(m.palette) : undefined;
    drawSprite(ctx, sprite, m.palette, x - Math.round((sprite[0] ?? '').length / 2), y - sprite.length, flash);
  });
};

// ---- effects ----

const slash = (ctx: Ctx, c: Colors<K>, l: Layout, p: number): void => {
  const reach = Math.min(1, (p - 0.85) / 0.2);
  const cx = l.golemX + 4;
  const cy = l.golemFoot - 44;
  for (let k = -1; k <= 1; k++) {
    const x0 = cx + 22 + k * 7;
    const y0 = cy - 22 + k * 3;
    pixelLine(ctx, x0, y0, x0 - 44 * reach, y0 + 44 * reach, k === 0 ? c.text : c.crystalHi);
  }
};

const starfall = (ctx: Ctx, f: Frame, c: Colors<K>, l: Layout, p: number): void => {
  const cy = l.golemFoot - 44;
  if (p < 1) {
    for (let k = 0; k < 4; k++) {
      const q = Math.min(1, (p - 0.45 - k * 0.1) / 0.4);
      if (q < 0) continue;
      const x = l.golemX - 20 + k * 14 + (1 - q) * 30;
      const y = cy - 70 * (1 - q);
      fillRect(ctx, c.spell, x - 3, y, 7, 1);
      fillRect(ctx, c.spell, x, y - 3, 1, 7);
      fillRect(ctx, c.text, x - 1, y - 1, 3, 3);
    }
    return;
  }
  const r = Math.round(6 + (p - 1) * 40);
  ctx.fillStyle = c.spell;
  for (let a = 0; a < 48; a++) {
    const ang = (a / 48) * Math.PI * 2 + f.t;
    ctx.fillRect(Math.round(l.golemX + Math.cos(ang) * r), Math.round(cy + Math.sin(ang) * r * 0.8), 2, 2);
  }
  drawGlow(ctx, c.spell, l.golemX, cy, 22, 22, Math.max(0, Math.round((0.9 - (p - 1) * 1.4) * 8) / 8), 4);
};

const magicCircle = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, y: number): void => {
  ctx.fillStyle = c.spell;
  for (let a = 0; a < 20; a++) {
    const ang = (a / 20) * Math.PI * 2 + f.t * 2;
    ctx.fillRect(Math.round(x + Math.cos(ang) * 13), Math.round(y + Math.sin(ang) * 4), 1, 1);
  }
  for (let a = 0; a < 6; a++) {
    const ang = (a / 6) * Math.PI * 2 - f.t * 3;
    ctx.fillRect(Math.round(x + Math.cos(ang) * 8), Math.round(y + Math.sin(ang) * 2.5), 1, 1);
  }
};

const SHARD: Sprite = ['...o...', '..oCo..', '.oCHCo.', 'oCHHHCo', '.oCHCo.', '..oCo..', '...o...'];

const shardStorm = (ctx: Ctx, c: Colors<K>, l: Layout, p: number): void => {
  const q = (p - 1) / 0.5;
  if (q < 0 || q > 1) return;
  const from: Pt = [l.golemX + 40, l.golemFoot - 30];
  const palette = paletteOf(c, shardColors);
  l.slots.forEach(([sx, sy], k) => {
    const at = (e: number): Pt => [
      Math.round(from[0] + (sx - 6 - from[0]) * e),
      Math.round(from[1] + (sy - 22 - from[1]) * e - Math.sin(e * Math.PI) * (12 + k * 5)),
    ];
    for (let j = 1; j <= 3; j++) {
      const [tx, ty] = at(Math.max(0, q - j * 0.07));
      fillRect(ctx, j === 1 ? c.crystalHi : c.crystal, tx, ty, 2 - Math.floor(j / 3), 2 - Math.floor(j / 3));
    }
    const [x, y] = at(q);
    drawSprite(ctx, SHARD, palette, x - 3, y - 3);
  });
};

const healSparkles = (ctx: Ctx, c: Colors<K>, l: Layout, p: number): void => {
  const age = p - 0.9;
  if (age < 0 || age > 1.4) return;
  l.slots.forEach(([sx, sy], k) => {
    for (let j = 0; j < 5; j++) {
      const rise = frac(age * 0.8 + rand(j, k) * 0.6);
      const x = Math.round(sx - 10 + rand(j, k + 7) * 20);
      const y = Math.round(sy - 6 - rise * 40);
      fillRect(ctx, c.heal, x - 1, y, 3, 1);
      fillRect(ctx, c.heal, x, y - 1, 1, 3);
      if (j % 2 === 0) fillRect(ctx, c.text, x, y, 1, 1);
    }
  });
};

const effects = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const t = turnOf(f);
  if (t.turn === 0 && t.p >= 0.85 && t.p < 1.3) slash(ctx, c, l, t.p);
  if (t.turn === 1 && t.p < 1.8) {
    const slot = l.slots[1] as Pt;
    magicCircle(ctx, f, c, memberX(f, PARTY[1] as Member, slot), slot[1]);
    if (t.p >= 0.45) starfall(ctx, f, c, l, t.p);
  }
  if (t.turn === ENEMY_TURN) shardStorm(ctx, c, l, t.p);
  if (t.turn === 3) healSparkles(ctx, c, l, t.p);
};

// ---- numbers that pop up where a hit lands ----

// Rises fast, drops back a little, then holds until it vanishes.
const popLift = (age: number): number => (age < 0.25 ? (age / 0.25) * 8 : age < 0.45 ? 8 - ((age - 0.25) / 0.2) * 3 : 5);

const popNumber = (ctx: Ctx, text: string, x: number, y: number, age: number, color: string, c: Colors<K>): void => {
  if (age < 0 || age > 1.6) return;
  drawTextOutlined(ctx, text, Math.round(x - textWidth(text) / 2), Math.round(y - popLift(age)), color, c.ink);
};

const numbers = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const t = turnOf(f);
  const top = l.golemFoot - 40;
  if (t.turn === 0) popNumber(ctx, String(120 + Math.floor(rand(t.cycle, 1) * 90)), l.golemX + 6, top, t.p - 1, c.text, c);
  if (t.turn === 1) popNumber(ctx, String(300 + Math.floor(rand(t.cycle, 2) * 200)), l.golemX + 6, top, t.p - 1.05, c.text, c);
  PARTY.forEach((_, k) => {
    const [sx, sy] = l.slots[k] as Pt;
    if (t.turn === ENEMY_TURN) popNumber(ctx, String(damageOf(t.cycle, k)), sx, sy - 48, t.p - 1.5, c.text, c);
    if (t.turn === 3) popNumber(ctx, String(damageOf(t.cycle, k)), sx, sy - 48, t.p - 1, c.heal, c);
  });
};

// ---- windows ----

const windowColors = (c: Colors<K>): WindowColors => ({ top: c.win0, bottom: c.win1, rim: c.rim, edge: c.ink });

const COMMANDS = ['FIGHT', 'MAGIC', 'ITEM', 'RUN'] as const;
const CHOICE = [0, 1, 1, 1] as const;

const POINTER: Sprite = ['oo....', 'owoo..', 'owwwoo', 'owwwwo', 'owwwoo', 'owoo..', 'oo....'];

const commandWindow = (ctx: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  const h = f.h - l.winTop - 2;
  drawWindow(ctx, 2, l.winTop, l.cmdW, h, windowColors(c));
  const pitch = Math.floor((h - 10) / COMMANDS.length);
  COMMANDS.forEach((cmd, k) => {
    drawText(ctx, cmd, 16, l.winTop + 6 + k * pitch, c.text);
  });
  const row = CHOICE[turnOf(f).turn] ?? 0;
  const nudge = frac(f.beat) < 0.5 ? 0 : 1;
  drawSprite(ctx, POINTER, paletteOf(c, pointerColors), 7 + nudge, l.winTop + 6 + row * pitch);
};

const gaugeBar = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, y: number, w: number, fill: number): void => {
  fillRect(ctx, c.ink, x, y, w, 4);
  const full = fill >= 1;
  fillRect(ctx, full && frac(f.beat * 2) < 0.5 ? c.text : c.gauge, x + 1, y + 1, Math.round((w - 2) * fill), 2);
};

const statusRow = (ctx: Ctx, f: Frame, c: Colors<K>, l: Layout, k: number, x: number, y: number, w: number): void => {
  const m = PARTY[k] as Member;
  const t = turnOf(f);
  const hp = hpOf(m, k, t);
  drawText(ctx, m.name, x, y, t.turn === m.turn ? c.gauge : c.text);
  const hpText = `${hp}/${m.hp}`;
  if (l.wide) {
    drawText(ctx, hpText, x + 38, y, hp < m.hp ? c.gauge : c.text);
    drawText(ctx, 'MP', x + 92, y, c.rim);
    drawText(ctx, String(m.mp), x + 106, y, c.text);
    const gw = Math.min(72, w - 130);
    gaugeBar(ctx, f, c, x + w - gw, y + 2, gw, gaugeOf(f, m));
    return;
  }
  drawText(ctx, hpText, x + w - textWidth(hpText), y, hp < m.hp ? c.gauge : c.text);
  gaugeBar(ctx, f, c, x, y + 9, w, gaugeOf(f, m));
};

const statusWindow = (ctx: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  const x = 2 + l.cmdW;
  const w = f.w - x - 2;
  const h = f.h - l.winTop - 2;
  drawWindow(ctx, x, l.winTop, w, h, windowColors(c));
  const pitch = l.wide ? 14 : 23;
  for (let k = 0; k < PARTY.length; k++) statusRow(ctx, f, c, l, k, x + 7, l.winTop + 7 + k * pitch, w - 14);
};

const BANNERS = ['', 'STARFALL', 'SHARD STORM', 'MEND'] as const;

const banner = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const t = turnOf(f);
  const text = BANNERS[t.turn] ?? '';
  if (text === '' || t.p < 0.2 || t.p > 2.6) return;
  const w = textWidth(text) + 18;
  const x = Math.round(f.w / 2 - w / 2);
  drawWindow(ctx, x, 4, w, 17, windowColors(c));
  drawText(ctx, text, x + 9, 9, c.text);
};

const windows = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  commandWindow(ctx, f, c, l);
  statusWindow(ctx, f, c, l);
  banner(ctx, f, c);
};

export const turnBattle = defineScene<K>({
  id: 'turn-battle',
  title: 'Turn Battle',
  mood: { valence: -0.2, energy: 0.7 },
  styles: ['boss-rush', 'pixel-quest', 'deep-dungeon', 'band-rock'],
  variants: [
    {
      mood: { valence: -0.2, energy: 0.7 },
      colors: {
        sky0: '#2a1240',
        sky1: '#8a2a52',
        sky2: '#f0784a',
        orb: '#ffd890',
        glow: '#ff9a5a',
        far: '#4a2048',
        farLit: '#c8506a',
        ground: '#5a3044',
        groundLo: '#3e2034',
        groundHi: '#8a4a5a',
        rock: '#5c5a7a',
        rockHi: '#8a88aa',
        rockLo: '#3a3854',
        crystal: '#5ad8e8',
        crystalLo: '#2a7aa8',
        crystalHi: '#d8fcff',
        eye: '#ff4a6a',
        spell: '#ffd84a',
        heal: '#7af08a',
        gauge: '#ffe066',
        win0: '#3a5ad0',
        win1: '#101a5a',
        rim: '#e8ecff',
        text: '#ffffff',
        ink: '#0c0818',
      },
    },
    {
      mood: { valence: -0.6, energy: 0.5 },
      colors: {
        sky0: '#04040e',
        sky1: '#14143a',
        sky2: '#2a2a6a',
        orb: '#e8f0ff',
        glow: '#6a7ae0',
        far: '#10123a',
        farLit: '#4a58b0',
        ground: '#1c1a40',
        groundLo: '#100e2a',
        groundHi: '#34326a',
        rock: '#4a4466',
        rockHi: '#706a92',
        rockLo: '#2a2642',
        crystal: '#b46aff',
        crystalLo: '#6a2ab0',
        crystalHi: '#f0d8ff',
        eye: '#ffe24a',
        spell: '#ff7ad8',
        heal: '#6aff9a',
        gauge: '#ffd84a',
        win0: '#2c3c9a',
        win1: '#0a0e3a',
        rim: '#d8dcf8',
        text: '#ffffff',
        ink: '#05040c',
      },
    },
    {
      mood: { valence: 0.3, energy: 0.65 },
      colors: {
        sky0: '#2a6ad8',
        sky1: '#6aaaf0',
        sky2: '#d0ecff',
        orb: '#ffffff',
        glow: '#fff4c0',
        far: '#6a8ab8',
        farLit: '#d8e8ff',
        ground: '#7a9a4a',
        groundLo: '#5a7a38',
        groundHi: '#a8c870',
        rock: '#7a6a62',
        rockHi: '#a8988a',
        rockLo: '#4e423e',
        crystal: '#ff7a9a',
        crystalLo: '#c03a6a',
        crystalHi: '#ffe0ea',
        eye: '#ffef6a',
        spell: '#ffb02a',
        heal: '#4ae07a',
        gauge: '#ffe066',
        win0: '#3a5ad0',
        win1: '#101a5a',
        rim: '#f0f2ff',
        text: '#ffffff',
        ink: '#120e1e',
      },
    },
  ],
  layers: [backdrop, motes, golem, party, effects, numbers, windows],
});
