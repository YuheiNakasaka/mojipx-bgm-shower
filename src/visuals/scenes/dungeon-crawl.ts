// A first-person dungeon crawl from a game that never existed: a framed view of the corridor in stepped depth bands that
// advances a square every bar, flickering torches, eyes in the dark, and the party's portraits, compass, map and log.
import { type Ctx, drawSprite, fillRect, type Palette, type Sprite } from 'mojipx';
import { frac, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { type Box, drawGlow, wrap } from './batch-1-helpers.ts';
import { sigOf } from './batch-3-helpers.ts';
import { drawText, drawWindow, fillPolygon, memoLayer, type Pt, textWidth, type WindowColors } from './batch-4-helpers.ts';

type K =
  | 'void'
  | 'wall0'
  | 'wall1'
  | 'wall2'
  | 'wall3'
  | 'mortar'
  | 'floor0'
  | 'floor1'
  | 'ceil'
  | 'flame0'
  | 'flame1'
  | 'flame2'
  | 'glow'
  | 'eye'
  | 'panel'
  | 'panelHi'
  | 'gold'
  | 'win0'
  | 'win1'
  | 'rim'
  | 'text'
  | 'hp'
  | 'mp'
  | 'ink';

// ---- portraits ----

const THIEF: Sprite = [
  '.....oooooooooo.....',
  '...ooggggggggggoo...',
  '..oGGgggggggggggo...',
  '..oGgggggggggggggoo.',
  '.ohhhhhhhhhhhhhhgGo.',
  '.ohhHHhhhhhhhhhhhgo.',
  'ohhHhhhhohhhhohhhhho',
  'ohhhhhhosshhhsshhhho',
  'ohhhhhossssssssshhho',
  'ohhhsooossssssooohho',
  'ohhsowwessssswweshho',
  'ohhsoweessssswee.sho',
  'ohhsoeeossssseeoshho',
  'ohhssbbssssssssbbsho',
  '.ohsssssssmmsssssho.',
  '.ohhsssssssssssssho.',
  '..ohoosssssssssoohho',
  '..oho.oooooooooohhho',
  '...o.occccccccco.oo.',
  '....occcccccccccco..',
];
const ELF: Sprite = [
  '.......oooooo.......',
  '.....ooHHHhhhoo.....',
  '....oHHhhhhhhhho....',
  '...oHhhhhhhhhhhhho..',
  '..ohhhhhhhhhhhhhhho.',
  '..ohhhohhhhhhohhhho.',
  'o.ohhosshhhhsshhhho.',
  'oo.ohossssssssshhho.',
  'oso.osooossssooohoo.',
  'osso.owwessswweshoso',
  '.ossowweesssweesooso',
  '..osoeeossssseeosso.',
  '...oossbbssssbbsoo..',
  '...ohssssssssssho...',
  '...ohhssssmmssshho..',
  '..ohhhhssssssshhhho.',
  '..ohhhooooooooohhho.',
  '..ohhho.occco.ohhho.',
  '...ooo.occqcco.ooo..',
  '......occcccccco....',
];
const KNIGHT: Sprite = [
  '......oooooooo......',
  '....ooaaaaaaaaoo....',
  '...oaaAAaaaaaaaao...',
  '..oaaAaaaaaaaaaaao..',
  '..oaaaaaaaaaaaaaao..',
  '.oaaaoooooooooooaao.',
  '.oaaoohhhhhhhhhooao.',
  '.oaaohhsshhhsshhoao.',
  '.oaaossssssssssssao.',
  '.oaaoooossssooooaao.',
  '.oaaowwesssswweoaao.',
  '.oaaoeeossssseeoaao.',
  '.oaaossssssssssoaao.',
  '.oaaossssssssssoaao.',
  '.oaaosssmmmmsssoaao.',
  '.oaaoossssssssooaao.',
  '..oaaaooooooooaaao..',
  '..oaaaaaaaaaaaaaao..',
  '..oRRRRRRRRRRRRRRo..',
  '..oRRRRRRRRRRRRRRo..',
];
const DWARF: Sprite = [
  '.....oooooooooo.....',
  '...oottttttttttoo...',
  '..otTTttttttttttto..',
  '..ottttttttttttttto.',
  '.oooooooooooooooooo.',
  '.ohhhhhhhhhhhhhhhho.',
  '.ohhoossshhssssoohho',
  '.ohossssssssssssoho.',
  '.ohoooosssssooooho..',
  '.ohowwesssssweeoho..',
  '.ohoeeosssssoeeoho..',
  '.oosssssooosssssoo..',
  '.ohhhhhssssshhhhho..',
  'ohhhhhhhhhhhhhhhhho.',
  'ohhHhhhhhmmhhhhhhho.',
  'ohhhhhhhhhhhhhhHhho.',
  '.ohhhHhhhhhhhhhhho..',
  '..ohhhhhhhhhhhhho...',
  '...oohhhhhhhhhoo....',
  '.....ooohhhooo......',
];

const SKIN = { o: '#1a1028', s: '#ffe0c8', e: '#2a1830', w: '#ffffff', b: '#ff9cac', m: '#c05060' };

type Member = {
  readonly name: string;
  readonly face: Sprite;
  readonly shut: Sprite;
  readonly palette: Palette;
  readonly hp: number;
  readonly mp: number;
};

// Closed eyes: eye pixels become skin, the lower lash row a line.
const blinkOf = (sprite: Sprite, top: number): Sprite =>
  sprite.map((row, y) => (y >= top && y < top + 3 ? row.replace(/[we]/g, y === top + 1 ? 'o' : 's') : row));

const PARTY: readonly Member[] = [
  {
    name: 'RINA',
    face: THIEF,
    shut: blinkOf(THIEF, 10),
    palette: { ...SKIN, g: '#3aa878', G: '#7ae0a8', h: '#d8503a', H: '#ff9a7a', c: '#5a4a8a' },
    hp: 0.82,
    mp: 0.4,
  },
  {
    name: 'NEVE',
    face: ELF,
    shut: blinkOf(ELF, 9),
    palette: { ...SKIN, h: '#c8c0f0', H: '#ffffff', c: '#3a6ac0', q: '#ffe060' },
    hp: 0.64,
    mp: 0.9,
  },
  {
    name: 'OSWIN',
    face: KNIGHT,
    shut: blinkOf(KNIGHT, 10),
    palette: { ...SKIN, a: '#a8b4d0', A: '#f0f4ff', h: '#6a4a3a', R: '#c03040' },
    hp: 0.95,
    mp: 0.15,
  },
  {
    name: 'BORK',
    face: DWARF,
    shut: blinkOf(DWARF, 9),
    palette: { ...SKIN, t: '#8a5a30', T: '#c08a50', h: '#c8682a', H: '#f0a050' },
    hp: 0.55,
    mp: 0.3,
  },
];

// ---- layout ----

type Layout = {
  readonly wide: boolean;
  readonly view: Box;
  readonly compass: Pt;
  readonly map: Box | null;
  readonly log: Box;
  readonly cards: readonly Box[];
};

const cardsIn = (x: number, y: number, w: number, h: number, cols: number): readonly Box[] => {
  const rows = Math.ceil(PARTY.length / cols);
  const cw = Math.floor((w - (cols - 1) * 3) / cols);
  const ch = Math.floor((h - (rows - 1) * 3) / rows);
  return PARTY.map((_, k) => ({ x: x + (k % cols) * (cw + 3), y: y + Math.floor(k / cols) * (ch + 3), w: cw, h: ch }));
};

const CARD_H = 34;

const layoutOf = (f: Frame): Layout => {
  if (f.w > f.h) {
    const vw = Math.round(f.w * 0.5);
    const cardsY = f.h - CARD_H - 4;
    const view = { x: Math.round((f.w - vw) / 2), y: 6, w: vw, h: cardsY - 12 };
    const side = view.x - 8;
    return {
      wide: true,
      view,
      compass: [Math.round(4 + side / 2), view.y + 22],
      map: { x: 4, y: view.y + 44, w: side, h: view.h - 44 },
      log: { x: view.x + view.w + 4, y: view.y, w: f.w - view.x - view.w - 8, h: view.h },
      cards: cardsIn(4, cardsY, f.w - 8, CARD_H, 4),
    };
  }
  const cardsH = CARD_H * 2 + 3;
  const vw = f.w - 12;
  const vh = Math.min(Math.round(vw * 1.3), f.h - 44 - 36 - cardsH - 10);
  // Whatever height is left over is split above and below, so the stack sits in the middle.
  const top = Math.max(0, Math.round((f.h - (44 + vh + 37 + cardsH + 6)) / 2));
  const view = { x: 6, y: top + 44, w: vw, h: vh };
  const logY = view.y + view.h + 6;
  return {
    wide: false,
    view,
    compass: [Math.round(f.w / 2), top + 22],
    map: null,
    log: { x: 6, y: logY, w: vw, h: 27 },
    cards: cardsIn(6, logY + 31, vw, cardsH, 2),
  };
};

// ---- the dungeon: a loop of squares, each with walls, openings, torches or an arch ----

type Square = {
  readonly left: boolean;
  readonly right: boolean;
  readonly torchL: boolean;
  readonly torchR: boolean;
  readonly arch: boolean;
};

const SQUARES: readonly Square[] = [
  { left: false, right: false, torchL: true, torchR: false, arch: false },
  { left: true, right: false, torchL: false, torchR: false, arch: true },
  { left: false, right: false, torchL: false, torchR: true, arch: false },
  { left: false, right: true, torchL: true, torchR: false, arch: false },
  { left: false, right: false, torchL: false, torchR: false, arch: true },
  { left: true, right: true, torchL: false, torchR: false, arch: false },
  { left: false, right: false, torchL: true, torchR: true, arch: true },
  { left: false, right: true, torchL: false, torchR: false, arch: false },
];

const squareAt = (k: number): Square => SQUARES[wrap(k, SQUARES.length)] as Square;

// Each band of depth is this much of the one before: the view steps inward square by square.
const SCALE = [1, 0.6, 0.36, 0.22, 0.13, 0.08] as const;
const DEPTH = 5;

type Rect = { readonly l: number; readonly r: number; readonly t: number; readonly b: number };

const rectAt = (w: number, h: number, d: number): Rect => {
  const s = SCALE[d] ?? 0;
  return { l: w / 2 - (w / 2) * s, r: w / 2 + (w / 2) * s, t: h * 0.48 - h * 0.48 * s, b: h * 0.48 + h * 0.52 * s };
};

const toneOf = (c: Colors<K>, d: number): string => [c.wall3, c.wall2, c.wall1, c.wall0, c.void, c.void][d] ?? c.void;

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

// Courses of stone across a wall face between two depths; `x0`/`x1` are its near and far edges.
const courses = (g: Ctx, x0: number, n: Rect, x1: number, fr: Rect, color: string): void => {
  for (const k of [0.2, 0.4, 0.6, 0.8]) {
    const y0 = Math.round(lerp(n.t, n.b, k));
    const y1 = Math.round(lerp(fr.t, fr.b, k));
    fillPolygon(
      g,
      [
        [x0, y0],
        [x1, y1],
        [x1, y1 + 1],
        [x0, y0 + 1],
      ],
      color,
    );
  }
  fillRect(g, color, Math.round((x0 + x1) / 2), Math.round(lerp(n.t, n.b, 0.4)), 1, Math.max(1, Math.round((n.b - n.t) * 0.2)));
};

const sideWall = (g: Ctx, n: Rect, fr: Rect, x0: number, x1: number, d: number, c: Colors<K>): void => {
  fillPolygon(
    g,
    [
      [x0, n.t],
      [x1, fr.t],
      [x1, fr.b],
      [x0, n.b],
    ],
    toneOf(c, d),
  );
  courses(g, x0, n, x1, fr, c.mortar);
};

// An opening: the far wall of the side passage faces us, with its own floor and ceiling.
const sideOpening = (g: Ctx, n: Rect, fr: Rect, x0: number, x1: number, d: number, c: Colors<K>): void => {
  const a = Math.round(Math.min(x0, x1));
  const w = Math.round(Math.abs(x1 - x0));
  fillRect(g, c.ceil, a, Math.round(n.t), w, Math.round(fr.t - n.t));
  fillRect(g, c.floor0, a, Math.round(fr.b), w, Math.round(n.b - fr.b));
  fillRect(g, toneOf(c, d + 1), a, Math.round(fr.t), w, Math.round(fr.b - fr.t));
  for (const k of [0.25, 0.5, 0.75]) fillRect(g, c.mortar, a, Math.round(lerp(fr.t, fr.b, k)), w, 1);
};

const band = (g: Ctx, n: Rect, fr: Rect, k: number, d: number, c: Colors<K>): void => {
  const floor = d >= 3 ? c.floor0 : (k + d) % 2 === 0 ? c.floor1 : c.floor0;
  fillPolygon(
    g,
    [
      [n.l, n.b],
      [n.r, n.b],
      [fr.r, fr.b],
      [fr.l, fr.b],
    ],
    floor,
  );
  fillPolygon(
    g,
    [
      [n.l, n.t],
      [n.r, n.t],
      [fr.r, fr.t],
      [fr.l, fr.t],
    ],
    c.ceil,
  );
};

const arch = (g: Ctx, n: Rect, d: number, c: Colors<K>): void => {
  const t = Math.max(1, Math.round(10 * (SCALE[d] ?? 0)));
  const color = toneOf(c, Math.max(0, d - 1));
  fillRect(g, color, Math.round(n.l), Math.round(n.t), t, Math.round(n.b - n.t));
  fillRect(g, color, Math.round(n.r) - t, Math.round(n.t), t, Math.round(n.b - n.t));
  fillRect(g, color, Math.round(n.l), Math.round(n.t), Math.round(n.r - n.l), t);
  fillRect(g, c.mortar, Math.round(n.l) + t, Math.round(n.t) + t, Math.round(n.r - n.l) - t * 2, 1);
};

const paintSquare = (g: Ctx, w: number, h: number, k: number, d: number, c: Colors<K>): void => {
  const sq = squareAt(k + d);
  const n = rectAt(w, h, d);
  const fr = rectAt(w, h, d + 1);
  band(g, n, fr, k, d, c);
  (sq.left ? sideOpening : sideWall)(g, n, fr, n.l, fr.l, d, c);
  (sq.right ? sideOpening : sideWall)(g, n, fr, n.r, fr.r, d, c);
  if (sq.arch && d > 0) arch(g, n, d, c);
};

const corridorLayer = (w: number, h: number, k: number, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`crawl-view:${wrap(k, SQUARES.length)}:${sigOf(c)}`, w, h, (g) => {
    fillRect(g, c.void, 0, 0, w, h);
    for (let d = DEPTH - 1; d >= 0; d--) paintSquare(g, w, h, k, d, c);
  });

// ---- stepping: a quick push forward at the start of every bar, then the next square ----

type Step = { readonly k: number; readonly zoom: number; readonly bob: number };

const stepOf = (f: Frame): Step => {
  const beat = Math.max(0, f.beat);
  const k = Math.floor(beat / 4);
  const p = beat - k * 4;
  if (p >= 0.45 || k === 0) return { k, zoom: 1, bob: 0 };
  const e = (p / 0.45) ** 2;
  return { k: k - 1, zoom: 1 + e * (1 / (SCALE[1] as number) - 1), bob: Math.round(Math.sin(e * Math.PI) * 2) };
};

type Torch = { readonly x: number; readonly y: number; readonly s: number };

// Torches on the walls of the squares in view, relative to the view's top-left at zoom 1.
const torchesOf = (w: number, h: number, k: number): readonly Torch[] => {
  const out: Torch[] = [];
  for (let d = 0; d < 3; d++) {
    const sq = squareAt(k + d);
    const n = rectAt(w, h, d);
    const fr = rectAt(w, h, d + 1);
    const s = ((SCALE[d] as number) + (SCALE[d + 1] as number)) / 2;
    const y = lerp((n.t + fr.t) / 2, (n.b + fr.b) / 2, 0.36);
    if (sq.torchL && !sq.left) out.push({ x: (n.l + fr.l) / 2, y, s });
    if (sq.torchR && !sq.right) out.push({ x: (n.r + fr.r) / 2, y, s });
  }
  return out;
};

const flame = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, y: number, s: number, id: number): void => {
  const size = Math.max(2, Math.round(9 * s * (0.85 + rand(Math.floor(f.t * 12), id) * 0.35)));
  drawGlow(ctx, c.glow, x, y - size / 2, Math.round(size * 2), Math.round(size * 2), Math.round((0.4 + f.kick * 0.15) * 8) / 8);
  fillRect(ctx, c.ink, x - 1, y, 3, Math.max(2, Math.round(size * 0.8)));
  for (let r = 0; r < size; r++) {
    const half = Math.max(0, Math.round(((r + 1) / size) * size * 0.3));
    const sway = Math.round(Math.sin(f.t * 10 + r + id) * (1 - r / size));
    const color = r < size * 0.4 ? c.flame0 : r < size * 0.75 ? c.flame1 : c.flame2;
    fillRect(ctx, color, x - half + sway, y - size + r, half * 2 + 1, 1);
  }
};

// Now and then a pair of eyes glints in the dark at the end of the corridor.
const eyes = (ctx: Ctx, f: Frame, c: Colors<K>, cx: number, cy: number): void => {
  const phase = frac(f.t / 9);
  if (phase < 0.55 || phase > 0.85 || frac(f.t * 0.8) > 0.92) return;
  const x = Math.round(cx + Math.sin(f.t * 0.4) * 3);
  fillRect(ctx, c.eye, x - 3, Math.round(cy), 2, 1);
  fillRect(ctx, c.eye, x + 2, Math.round(cy), 2, 1);
};

const view = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const { view: v } = layoutOf(f);
  const st = stepOf(f);
  const layer = corridorLayer(v.w, v.h, st.k, c);
  const ox = v.x + v.w / 2;
  const oy = v.y + v.h * 0.48;
  ctx.save();
  ctx.beginPath();
  ctx.rect(v.x, v.y, v.w, v.h);
  ctx.clip();
  ctx.imageSmoothingEnabled = false;
  const dw = Math.round(v.w * st.zoom);
  const dh = Math.round(v.h * st.zoom);
  ctx.drawImage(layer, Math.round(ox - dw / 2), Math.round(oy - dh * 0.48) + st.bob, dw, dh);
  torchesOf(v.w, v.h, st.k).forEach((t, id) => {
    const x = Math.round(ox + (t.x - v.w / 2) * st.zoom);
    const y = Math.round(oy + (t.y - v.h * 0.48) * st.zoom) + st.bob;
    flame(ctx, f, c, x, y, t.s * st.zoom, id);
  });
  if (st.zoom === 1) eyes(ctx, f, c, ox, oy - 1);
  ctx.restore();
};

// ---- the frame around everything ----

const windowColors = (c: Colors<K>): WindowColors => ({ top: c.win0, bottom: c.win1, rim: c.rim, edge: c.ink });

const paintFrame = (g: Ctx, f: Frame, l: Layout, c: Colors<K>): void => {
  fillRect(g, c.panel, 0, 0, f.w, f.h);
  for (let y = 2; y < f.h; y += 6) for (let x = (y / 6) % 2 === 0 ? 0 : 6; x < f.w; x += 12) fillRect(g, c.panelHi, x, y, 11, 1);
  const v = l.view;
  fillRect(g, c.ink, v.x - 3, v.y - 3, v.w + 6, v.h + 6);
  fillRect(g, c.gold, v.x - 2, v.y - 2, v.w + 4, v.h + 4);
  fillRect(g, c.ink, v.x - 1, v.y - 1, v.w + 2, v.h + 2);
  for (const [x, y] of [
    [v.x - 4, v.y - 4],
    [v.x + v.w, v.y - 4],
    [v.x - 4, v.y + v.h],
    [v.x + v.w, v.y + v.h],
  ] as const) {
    fillRect(g, c.ink, x, y, 4, 4);
    fillRect(g, c.gold, x + 1, y + 1, 2, 2);
  }
};

const frameLayer = (f: Frame, l: Layout, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`crawl-frame:${sigOf(c)}`, f.w, f.h, (g) => paintFrame(g, f, l, c));

const frame = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(frameLayer(f, layoutOf(f), c), 0, 0);
};

// ---- compass, map and log ----

const compass = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const [x, y] = layoutOf(f).compass;
  ctx.fillStyle = c.ink;
  for (let a = 0; a < 36; a++)
    ctx.fillRect(Math.round(x + Math.cos((a / 36) * Math.PI * 2) * 15), Math.round(y + Math.sin((a / 36) * Math.PI * 2) * 15), 2, 2);
  ctx.fillStyle = c.gold;
  for (let a = 0; a < 36; a++)
    ctx.fillRect(Math.round(x + Math.cos((a / 36) * Math.PI * 2) * 14), Math.round(y + Math.sin((a / 36) * Math.PI * 2) * 14), 1, 1);
  drawText(ctx, 'N', x - 2, y - 12, c.text);
  const sway = Math.sin(f.t * 2.3) * 0.12 + Math.sin(f.t * 5.1) * 0.05;
  for (let r = 1; r < 9; r++) {
    fillRect(ctx, c.eye, Math.round(x + Math.sin(sway) * r), Math.round(y - Math.cos(sway) * r), 1, 1);
    fillRect(ctx, c.rim, Math.round(x - Math.sin(sway) * r * 0.6), Math.round(y + Math.cos(sway) * r * 0.6), 1, 1);
  }
  fillRect(ctx, c.gold, x - 1, y - 1, 3, 3);
};

// The map scrolls a square per step; the party's arrow stays near the bottom.
const minimap = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const { map } = layoutOf(f);
  if (!map) return;
  drawWindow(ctx, map.x, map.y, map.w, map.h, windowColors(c));
  const k = Math.floor(Math.max(0, f.beat) / 4);
  const cell = 6;
  const cx = Math.round(map.x + map.w / 2 - cell / 2);
  const rows = Math.floor((map.h - 10) / cell);
  for (let r = 0; r < rows; r++) {
    const sq = squareAt(k + r - 1);
    const y = map.y + map.h - 6 - (r + 1) * cell;
    fillRect(ctx, c.rim, cx, y, cell - 1, cell - 1);
    if (sq.left) fillRect(ctx, c.rim, cx - cell, y, cell - 1, cell - 1);
    if (sq.right) fillRect(ctx, c.rim, cx + cell, y, cell - 1, cell - 1);
  }
  const ay = map.y + map.h - 6 - 2 * cell;
  if (frac(f.beat) < 0.7) {
    fillRect(ctx, c.eye, cx + 2, ay + 1, 1, 1);
    fillRect(ctx, c.eye, cx + 1, ay + 2, 3, 2);
  }
};

const MESSAGES = ['COLD DRAFT', 'DRIP...', 'FOOTSTEPS?', 'ALL QUIET', 'A FAR BELL'] as const;

const log = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const b = l.log;
  drawWindow(ctx, b.x, b.y, b.w, b.h, windowColors(c));
  const k = Math.floor(Math.max(0, f.beat) / 4);
  const watched = frac(f.t / 9) > 0.55 && frac(f.t / 9) < 0.85;
  // Only lines that fit the window are told, so a narrow screen just hears less.
  const fits = [...MESSAGES, 'EYES...!'].filter((m) => textWidth(m) <= b.w - 14);
  const quiet = fits.filter((m) => m !== 'EYES...!');
  const message = watched ? (fits.includes('EYES...!') ? 'EYES...!' : '') : (quiet[k % Math.max(1, quiet.length)] ?? '');
  const steps = `STEP ${String(212 + k).padStart(4, '0')}`;
  if (l.wide) {
    drawText(ctx, 'B3F', b.x + 7, b.y + 7, c.gold);
    drawText(ctx, steps.replace('STEP ', ''), b.x + 7, b.y + 18, c.text);
    drawText(ctx, message, b.x + 7, b.y + 34, watched ? c.eye : c.text);
    return;
  }
  drawText(ctx, `B3F  ${steps}`, b.x + 7, b.y + 6, c.gold);
  drawText(ctx, message, b.x + 7, b.y + 16, watched ? c.eye : c.text);
};

// ---- the party ----

const bar = (ctx: Ctx, c: Colors<K>, x: number, y: number, w: number, fill: number, color: string): void => {
  fillRect(ctx, c.ink, x, y, w, 4);
  fillRect(ctx, color, x + 1, y + 1, Math.round((w - 2) * fill), 2);
};

// On narrow screens a long name loses letters from its end rather than spilling out of the card.
const nameFitting = (name: string, room: number): string => {
  let shown = name;
  while (shown.length > 1 && textWidth(shown) > room) shown = shown.slice(0, -1);
  return shown;
};

const card = (ctx: Ctx, f: Frame, c: Colors<K>, b: Box, m: Member, k: number): void => {
  const turn = Math.floor(Math.max(0, f.beat) / 4) % PARTY.length === k;
  drawWindow(ctx, b.x, b.y, b.w, b.h, windowColors(c));
  const shut = frac(f.t / 3.9 + k * 0.27) > 0.95;
  drawSprite(ctx, shut ? m.shut : m.face, m.palette, b.x + 5, b.y + 5);
  if (turn && frac(f.beat) < 0.5) fillRect(ctx, c.gold, b.x + 5, b.y + 26, 20, 1);
  const tx = b.x + 29;
  drawText(ctx, nameFitting(m.name, b.w - 33), tx, b.y + 6, turn ? c.gold : c.text);
  const w = b.w - 34;
  const watched = frac(f.t / 9) > 0.62 && frac(f.t / 9) < 0.66 && k === 0;
  bar(ctx, c, tx, b.y + 16, w, watched ? m.hp - 0.2 : m.hp, c.hp);
  bar(ctx, c, tx, b.y + 22, w, m.mp, c.mp);
};

const party = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const { cards } = layoutOf(f);
  PARTY.forEach((m, k) => {
    card(ctx, f, c, cards[k] as Box, m, k);
  });
};

export const dungeonCrawl = defineScene<K>({
  id: 'dungeon-crawl',
  title: 'Dungeon Crawl',
  mood: { valence: -0.6, energy: 0 },
  styles: ['deep-dungeon', 'pixel-quest'],
  variants: [
    {
      mood: { valence: -0.6, energy: 0 },
      colors: {
        void: '#05040a',
        wall0: '#1e1c2c',
        wall1: '#34304a',
        wall2: '#4e4868',
        wall3: '#6c6488',
        mortar: '#0e0c16',
        floor0: '#1a1622',
        floor1: '#2a2434',
        ceil: '#100e18',
        flame0: '#d0401c',
        flame1: '#ff8a24',
        flame2: '#ffe070',
        glow: '#ff8a3a',
        eye: '#ff3a4a',
        panel: '#1a1624',
        panelHi: '#241e32',
        gold: '#c8a050',
        win0: '#2a3a8a',
        win1: '#0c1238',
        rim: '#c8ccec',
        text: '#ffffff',
        hp: '#5ae07a',
        mp: '#5aa8ff',
        ink: '#05040a',
      },
    },
    {
      mood: { valence: -0.4, energy: -0.35 },
      colors: {
        void: '#030806',
        wall0: '#14241e',
        wall1: '#22392e',
        wall2: '#345440',
        wall3: '#4c7258',
        mortar: '#08120c',
        floor0: '#101c16',
        floor1: '#1c2c22',
        ceil: '#0a140e',
        flame0: '#1a8a6a',
        flame1: '#3ae0a0',
        flame2: '#c8ffe0',
        glow: '#3ad8a0',
        eye: '#ffe03a',
        panel: '#121a16',
        panelHi: '#1a261e',
        gold: '#a8b070',
        win0: '#1e4a4a',
        win1: '#08201e',
        rim: '#c8e8d8',
        text: '#ffffff',
        hp: '#7ae05a',
        mp: '#5ac8ff',
        ink: '#030806',
      },
    },
    {
      mood: { valence: -0.65, energy: 0.5 },
      colors: {
        void: '#0a0204',
        wall0: '#2c0e10',
        wall1: '#4a1a18',
        wall2: '#6e2a20',
        wall3: '#94402a',
        mortar: '#140406',
        floor0: '#200a0a',
        floor1: '#341210',
        ceil: '#160606',
        flame0: '#e0301a',
        flame1: '#ff7a1a',
        flame2: '#ffd85a',
        glow: '#ff5a2a',
        eye: '#ffe84a',
        panel: '#1c0a0c',
        panelHi: '#2a1012',
        gold: '#d89a40',
        win0: '#4a1a3a',
        win1: '#1a0614',
        rim: '#f0d0c8',
        text: '#ffffff',
        hp: '#7ae05a',
        mp: '#5aa8ff',
        ink: '#0a0204',
      },
    },
  ],
  layers: [frame, view, compass, minimap, log, party],
});
