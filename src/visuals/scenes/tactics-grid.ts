// A tactics battle from a game that never existed: two small armies face each other across a river on raised tiles,
// and a cursor hops a tile per beat from the chosen unit to its target over pulsing move and attack ranges.
import { type Ctx, drawSpriteFoot, fillRect, type Palette, type Sprite } from 'mojipx';
import { frac } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { ditherStyle } from './batch-1-helpers.ts';
import { paletteOf, sigOf } from './batch-3-helpers.ts';
import { drawText, drawWindow, fillPolygon, memoLayer, noise2, textWidth, type WindowColors } from './batch-4-helpers.ts';

type K =
  | 'grass'
  | 'grassHi'
  | 'edge'
  | 'dirt'
  | 'dirtLo'
  | 'stone'
  | 'stoneLo'
  | 'water'
  | 'waterHi'
  | 'leaf'
  | 'leafLo'
  | 'wood'
  | 'move'
  | 'attack'
  | 'cursor'
  | 'blue'
  | 'red'
  | 'win0'
  | 'win1'
  | 'rim'
  | 'text'
  | 'ink';

// ---- sprites ----

const SOLDIER: Sprite = [
  '....oo......',
  '...oPPo.....',
  '..oHHHHo....',
  '.oHhHHHHo...',
  '.oHooooHo...',
  '.ohsesesho..',
  '..osssssoo..',
  '.oaoaaaaoAo.',
  'oaAoaaaacAo.',
  'oaaocccccAo.',
  '.ooaaaaaoAo.',
  '..oaaaaao.o.',
  '..obbobbo...',
  '..obo.obo...',
  '..oo..oo....',
];
const MAGE: Sprite = [
  '.....oo.....',
  '....otto....',
  '...otTtto...',
  '..oooooooo..',
  '..ohhhhhho..',
  '.ohsesesho..',
  '.ohsssssho..',
  '.ohoccccoho.',
  'ohocCcccoho.',
  '.oqccccccqo.',
  '..occccccoo.',
  '.occccccco..',
  '.oooooooooo.',
  '..obo..obo..',
  '..oo...oo...',
];
const ARCHER: Sprite = [
  '...oooo.....',
  '..ollllo....',
  '.olLllllo..o',
  '.olhhhhlo.oo',
  '.ohsesesho.o',
  '..osssssoo.w',
  '.olololllo.w',
  'olLlllllsow.',
  'olllllllloo.',
  '.olllllllo..',
  '..oaaaaao...',
  '..obbobbo...',
  '..obo.obo...',
  '..oo..oo....',
  '............',
];
const BEAST: Sprite = [
  '.o.......o..',
  '.oo.....oo..',
  '..oooooooo..',
  '.offffffffo.',
  'offFffffFffo',
  'ofgrffffgrfo',
  'offffwwffffo',
  '.offwowoffo.',
  '..offffffo..',
  '.offffffffo.',
  'offfffffffoo',
  'offoffffoffo',
  '.oo.oo.oo.oo',
  '............',
  '............',
];

// o outline, L leaves, l shaded leaves, t trunk.
const TREE: Sprite = [
  '.....ooo.....',
  '...ooLLloo...',
  '..oLLLLLllo..',
  '.oLLLLLLlllo.',
  '.oLLLLLllllo.',
  'oLLLLLlllllo.',
  'oLLLLlllllloo',
  '.oLLllllllo..',
  '..oollllloo..',
  '....ootoo....',
  '.....oto.....',
  '.....oto.....',
];
const ARROW: Sprite = ['ooooooo', 'oyyyyyo', '.oyyyo.', '..oyo..', '...o...'];
const FLAG: readonly Sprite[] = [
  ['oooooo.', 'offffo.', 'offffoo', 'offffo.', 'oooooo.', 'o......', 'o......', 'o......', 'o......', 'o......'],
  ['ooooo..', 'offffoo', 'offfffo', 'offffoo', 'ooooo..', 'o......', 'o......', 'o......', 'o......', 'o......'],
];

const FACES: Palette = { o: '#141020', s: '#ffe0c8', e: '#141020', q: '#ffe0c8', w: '#a87a4a', b: '#4a3a5a' };

// Palette builders live at module level: palettes are cached per builder and color set.
const treeColors = (k: Colors<K>): Palette => ({ o: k.ink, L: k.leaf, l: k.leafLo, t: k.wood });
const blueFlagColors = (k: Colors<K>): Palette => ({ o: k.ink, f: k.blue });
const redFlagColors = (k: Colors<K>): Palette => ({ o: k.ink, f: k.red });
const arrowColors = (k: Colors<K>): Palette => ({ o: k.ink, y: k.cursor });

// ---- the board ----

const GRASS = 0;
const STONE = 1;
const WATER = 2;
const BRIDGE = 3;
const TREED = 4;

type Unit = {
  readonly di: number;
  readonly dj: number;
  readonly sprite: Sprite;
  readonly blue: boolean;
  readonly name: string;
  readonly lv: number;
  readonly hp: number;
  readonly max: number;
};

// Offsets from the middle of the board.
const UNITS: readonly Unit[] = [
  { di: -3, dj: -1, sprite: SOLDIER, blue: true, name: 'GARRET', lv: 12, hp: 48, max: 52 },
  { di: -2, dj: 2, sprite: ARCHER, blue: true, name: 'WREN', lv: 10, hp: 31, max: 36 },
  { di: -4, dj: 1, sprite: MAGE, blue: true, name: 'LIORA', lv: 11, hp: 27, max: 30 },
  { di: -1, dj: -3, sprite: SOLDIER, blue: true, name: 'BRAM', lv: 9, hp: 40, max: 44 },
  { di: 5, dj: -1, sprite: SOLDIER, blue: false, name: 'RAIDER', lv: 8, hp: 35, max: 35 },
  { di: 6, dj: 2, sprite: BEAST, blue: false, name: 'GLOOMHORN', lv: 13, hp: 61, max: 64 },
  { di: 4, dj: 3, sprite: SOLDIER, blue: false, name: 'RAIDER', lv: 9, hp: 22, max: 38 },
  { di: 7, dj: 0, sprite: BEAST, blue: false, name: 'GLOOMHORN', lv: 12, hp: 58, max: 58 },
];

type Board = {
  readonly n: number;
  readonly mid: number;
  readonly ox: number;
  readonly oy: number;
  readonly kinds: Uint8Array;
  readonly heights: Uint8Array;
};

const riverAt = (j: number, mid: number): number => mid + 2 + Math.round(Math.sin(j * 0.45) * 1.4);

// The river bends a tile at a time; where it shifts it covers both columns so it never breaks.
const inRiver = (i: number, j: number, mid: number): boolean => {
  const a = riverAt(j, mid);
  const b = riverAt(j - 1, mid);
  return i >= Math.min(a, b) && i <= Math.max(a, b);
};

const isUnitTile = (i: number, j: number, mid: number): boolean => UNITS.some((u) => u.di + mid === i && u.dj + mid === j);

const kindOf = (i: number, j: number, mid: number, h: number): number => {
  const river = riverAt(j, mid);
  if (inRiver(i, j, mid)) return j === mid ? BRIDGE : WATER;
  if (isUnitTile(i, j, mid)) return GRASS;
  if (Math.abs(i - river) > 1 && noise2(i / 2.6, j / 2.6, 7) > 0.66) return TREED;
  return h >= 3 ? STONE : GRASS;
};

const heightOf = (i: number, j: number, mid: number): number => {
  const nearRiver = Math.abs(i - riverAt(j, mid)) <= 1 || inRiver(i, j, mid);
  if (nearRiver) return 0;
  const near = Math.max(Math.abs(i - mid - 1), Math.abs(j - mid)) < 7;
  const raw = Math.floor((noise2(i / 6, j / 6, 3) - 0.25) * 5);
  return Math.max(0, Math.min(near ? 1 : 3, raw));
};

const boards = new Map<string, Board>();

const boardOf = (f: Frame): Board => {
  const key = `${f.w}x${f.h}`;
  const hit = boards.get(key);
  if (hit) return hit;
  const n = Math.ceil(f.w / TW + f.h / TH) + 4;
  const mid = Math.floor(n / 2);
  const heights = new Uint8Array(n * n);
  const kinds = new Uint8Array(n * n);
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      heights[j * n + i] = heightOf(i, j, mid);
      kinds[j * n + i] = kindOf(i, j, mid, heights[j * n + i] as number);
    }
  // The middle of the fight (between the two armies, a tile and a half past the middle tile) sits mid-screen.
  const ox = Math.round(f.w / 2 - TW / 2);
  const oy = Math.round(f.h * (f.w > f.h ? 0.5 : 0.45) - (mid + 1) * TH);
  const board = { n, mid, ox, oy, kinds, heights };
  if (boards.size > 4) boards.clear();
  boards.set(key, board);
  return board;
};

/** Tiles are diamonds TW wide and TH tall; each step of height lifts a tile by LIFT. */
const TW = 24;
const TH = 12;
const LIFT = 5;

/** Screen position of the top corner of a tile's top face. */
const tileTop = (b: Board, i: number, j: number): readonly [number, number] => [
  b.ox + ((i - j) * TW) / 2,
  b.oy + ((i + j) * TH) / 2 - (b.heights[j * b.n + i] ?? 0) * LIFT,
];

// ---- painting the board once ----

// Half the width of each row of a tile's top face.
const DIAMOND: readonly number[] = Array.from({ length: TH }, (_, r) => 2 * (r < TH / 2 ? r + 1 : TH - r));

const fillDiamond = (g: Ctx, x: number, y: number, inset: number): void => {
  DIAMOND.forEach((half, r) => {
    if (r < inset || r > TH - 1 - inset) return;
    g.fillRect(x - half + inset * 2, y + r, (half - inset * 2) * 2, 1);
  });
};

type Faces = { readonly top: string; readonly left: string; readonly right: string };

const facesOf = (kind: number, c: Colors<K>): Faces => {
  if (kind === STONE) return { top: c.stone, left: c.stoneLo, right: c.dirtLo };
  if (kind === WATER) return { top: c.water, left: c.dirtLo, right: c.dirtLo };
  if (kind === BRIDGE) return { top: c.wood, left: c.dirtLo, right: c.dirtLo };
  return { top: c.grass, left: c.dirt, right: c.dirtLo };
};

const paintTile = (g: Ctx, b: Board, i: number, j: number, c: Colors<K>): void => {
  const [x, y] = tileTop(b, i, j);
  const kind = b.kinds[j * b.n + i] as number;
  const depth = (b.heights[j * b.n + i] ?? 0) * LIFT + 7;
  const faces = facesOf(kind, c);
  const sink = kind === WATER ? 2 : 0;
  const hw = TW / 2;
  const hh = TH / 2;
  fillPolygon(
    g,
    [
      [x - hw, y + hh],
      [x, y + TH],
      [x, y + TH + depth],
      [x - hw, y + hh + depth],
    ],
    faces.left,
  );
  fillPolygon(
    g,
    [
      [x, y + TH],
      [x + hw, y + hh],
      [x + hw, y + hh + depth],
      [x, y + TH + depth],
    ],
    faces.right,
  );
  g.fillStyle = faces.top;
  fillDiamond(g, x, y + sink, 0);
  g.fillStyle = kind === GRASS || kind === TREED ? c.grassHi : kind === STONE ? c.stoneLo : faces.top;
  if ((i + j) % 2 === 0) fillDiamond(g, x, y + sink, 3);
  paintEdges(g, x, y + sink, kind === BRIDGE ? c.dirtLo : kind === STONE ? c.stoneLo : c.edge);
  if (kind === TREED) drawSpriteFoot(g, TREE, paletteOf(c, treeColors), x, y + hh + 3);
};

// The lower two edges of the top face, so the grid reads.
const paintEdges = (g: Ctx, x: number, y: number, color: string): void => {
  g.fillStyle = color;
  for (let r = TH / 2; r < TH; r++) {
    const half = DIAMOND[r] ?? 0;
    g.fillRect(x - half, y + r, 2, 1);
    g.fillRect(x + half - 2, y + r, 2, 1);
  }
};

const visible = (b: Board, f: Frame, i: number, j: number): boolean => {
  const [x, y] = tileTop(b, i, j);
  return x > -TW && x < f.w + TW && y > -40 && y < f.h + 4;
};

const boardLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`tactics-board:${sigOf(c)}`, f.w, f.h, (g) => {
    const b = boardOf(f);
    g.fillStyle = c.ink;
    g.fillRect(0, 0, f.w, f.h);
    for (let d = 0; d <= 2 * (b.n - 1); d++)
      for (let i = Math.max(0, d - b.n + 1); i <= Math.min(b.n - 1, d); i++) if (visible(b, f, i, d - i)) paintTile(g, b, i, d - i, c);
  });

const board = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(boardLayer(f, c), 0, 0);
};

// Glints drift across the river.
const river = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const b = boardOf(f);
  ctx.fillStyle = c.waterHi;
  for (let j = 0; j < b.n; j++) {
    const i = riverAt(j, b.mid);
    if (b.kinds[j * b.n + i] !== WATER) continue;
    const [x, y] = tileTop(b, i, j);
    const run = frac(f.t * 0.6 + j * 0.37);
    ctx.fillRect(Math.round(x - 8 + run * 12), Math.round(y + 5 + run * 4), 3, 1);
    if (Math.sin(f.t * 3 + j) > 0.4) ctx.fillRect(x + 3, y + 9, 1, 1);
  }
};

// ---- the turn: every two bars the next blue unit is chosen and the cursor walks to an enemy ----

const BLUE = UNITS.filter((u) => u.blue);
const RED = UNITS.filter((u) => !u.blue);

type Turn = { readonly unit: Unit; readonly target: Unit; readonly step: number; readonly index: number };

const turnOf = (f: Frame): Turn => {
  const beat = Math.max(0, f.beat);
  const index = Math.floor(beat / 8);
  return {
    unit: BLUE[index % BLUE.length] as Unit,
    target: RED[(index * 3 + 1) % RED.length] as Unit,
    step: Math.floor(beat - index * 8),
    index,
  };
};

// The cursor's path: along i first, then along j, one tile per beat after a beat's pause on the unit.
const cursorTile = (t: Turn): readonly [number, number] => {
  const di = t.target.di - t.unit.di;
  const dj = t.target.dj - t.unit.dj;
  const walked = Math.max(0, t.step - 1);
  const alongI = Math.min(Math.abs(di), walked);
  const alongJ = Math.min(Math.abs(dj), walked - alongI);
  return [t.unit.di + Math.sign(di) * alongI, t.unit.dj + Math.sign(dj) * alongJ];
};

const occupied = (di: number, dj: number): boolean => UNITS.some((u) => u.di === di && u.dj === dj);

const pulseLevel = (f: Frame, base: number): number => Math.round((base + 0.18 * Math.sin(f.t * 4) + f.kick * 0.1) * 16) / 16;

// The tiles around the chosen unit: within three steps it can move (unless the tile is water or taken),
// one step further it can strike.
const RANGE: readonly (readonly [number, number])[] = Array.from(
  { length: 81 },
  (_, k) => [(k % 9) - 4, Math.floor(k / 9) - 4] as const,
).filter(([di, dj]) => Math.abs(di) + Math.abs(dj) > 0 && Math.abs(di) + Math.abs(dj) <= 4);

const canMove = (b: Board, u: Unit, di: number, dj: number): boolean =>
  Math.abs(di) + Math.abs(dj) <= 3 && b.kinds[(u.dj + dj + b.mid) * b.n + u.di + di + b.mid] !== WATER && !occupied(u.di + di, u.dj + dj);

const ranges = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const b = boardOf(f);
  const { unit } = turnOf(f);
  const move = ditherStyle(ctx, c.move, pulseLevel(f, 0.5));
  const attack = ditherStyle(ctx, c.attack, pulseLevel(f, 0.45));
  for (const [di, dj] of RANGE) {
    const style = canMove(b, unit, di, dj) ? move : attack;
    if (!style) continue;
    const i = unit.di + di + b.mid;
    const j = unit.dj + dj + b.mid;
    const [x, y] = tileTop(b, i, j);
    ctx.fillStyle = style;
    fillDiamond(ctx, x, y + (b.kinds[j * b.n + i] === WATER ? 2 : 0), 1);
  }
};

// ---- units ----

const unitPalette = (c: Colors<K>, blue: boolean): Palette => paletteOf(c, blue ? bluePalette : redPalette);

const teamPalette = (team: string, c: Colors<K>): Palette => ({
  ...FACES,
  P: c.red,
  H: team,
  h: c.ink,
  a: c.stone,
  A: c.text,
  c: team,
  C: c.text,
  t: team,
  T: c.text,
  l: team,
  L: c.grassHi,
  f: team,
  F: c.dirt,
  g: c.cursor,
  r: c.red,
});
const bluePalette = (c: Colors<K>): Palette => teamPalette(c.blue, c);
const redPalette = (c: Colors<K>): Palette => teamPalette(c.red, c);

const units = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const b = boardOf(f);
  const t = turnOf(f);
  const order = [...UNITS].sort((p, q) => p.di + p.dj - (q.di + q.dj));
  for (const u of order) {
    const [x, y] = tileTop(b, u.di + b.mid, u.dj + b.mid);
    const bob = (Math.floor(f.beat) + (u.blue ? 0 : 1)) % 2;
    const chosen = u === t.unit && frac(f.beat * 2) < 0.5;
    fillRect(ctx, c.edge, x - 5, y + TH / 2, 11, 2);
    drawSpriteFoot(ctx, u.sprite, unitPalette(c, u.blue), x, y + TH / 2 + 2 - bob - (chosen ? 1 : 0));
  }
  const flagFrame = FLAG[Math.floor(f.t * 3) % 2] as Sprite;
  const [bx, by] = tileTop(b, b.mid - 6, b.mid);
  drawSpriteFoot(ctx, flagFrame, paletteOf(c, blueFlagColors), bx + 3, by + TH / 2 + 1);
  const [rx, ry] = tileTop(b, b.mid + 9, b.mid + 1);
  drawSpriteFoot(ctx, flagFrame, paletteOf(c, redFlagColors), rx + 3, ry + TH / 2 + 1);
};

// ---- the cursor ----

const cursor = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const b = boardOf(f);
  const [di, dj] = cursorTile(turnOf(f));
  const [x, y] = tileTop(b, di + b.mid, dj + b.mid);
  const hop = Math.round(Math.sin(Math.min(1, frac(f.beat) * 3) * Math.PI) * 3);
  ctx.fillStyle = frac(f.beat) < 0.5 ? c.text : c.cursor;
  DIAMOND.forEach((half, r) => {
    ctx.fillRect(x - half, y + r, 2, 1);
    ctx.fillRect(x + half - 2, y + r, 2, 1);
  });
  ctx.fillRect(x - 2, y - 1, 4, 1);
  ctx.fillRect(x - 2, y + TH, 4, 1);
  const bob = frac(f.beat) < 0.5 ? 0 : 1;
  drawSpriteFoot(ctx, ARROW, paletteOf(c, arrowColors), x, y - 14 - hop - bob);
};

// ---- windows ----

const windowColors = (c: Colors<K>): WindowColors => ({ top: c.win0, bottom: c.win1, rim: c.rim, edge: c.ink });

const shownUnit = (f: Frame): Unit => {
  const t = turnOf(f);
  const [di, dj] = cursorTile(t);
  return UNITS.find((u) => u.di === di && u.dj === dj) ?? t.unit;
};

const statusWindow = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const u = shownUnit(f);
  const w = 92;
  const h = 34;
  const x = 4;
  const y = f.h - h - 4;
  drawWindow(ctx, x, y, w, h, windowColors(c));
  drawText(ctx, u.name, x + 7, y + 6, u.blue ? c.text : c.attack);
  const stats = `LV ${u.lv}  HP ${u.hp}/${u.max}`;
  drawText(ctx, stats, x + 7, y + 15, c.text);
  fillRect(ctx, c.ink, x + 7, y + 25, w - 14, 3);
  fillRect(ctx, u.hp / u.max > 0.5 ? c.move : c.attack, x + 8, y + 26, Math.round((w - 16) * (u.hp / u.max)), 1);
};

const turnWindow = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const t = turnOf(f);
  const text = `TURN ${1 + Math.floor(t.index / BLUE.length)}`;
  const w = textWidth(text) + 16;
  drawWindow(ctx, f.w - w - 4, 4, w, 17, windowColors(c));
  drawText(ctx, text, f.w - w + 4, 9, c.text);
};

const windows = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  statusWindow(ctx, f, c);
  turnWindow(ctx, f, c);
};

export const tacticsGrid = defineScene<K>({
  id: 'tactics-grid',
  title: 'Tactics Map',
  mood: { valence: -0.1, energy: 0.35 },
  styles: ['pixel-quest', 'boss-rush', 'grand-field'],
  variants: [
    {
      mood: { valence: 0.25, energy: 0.35 },
      colors: {
        grass: '#6ab84a',
        grassHi: '#7cc858',
        edge: '#3a7a34',
        dirt: '#a07a50',
        dirtLo: '#6e5038',
        stone: '#a8a8b0',
        stoneLo: '#7a7a88',
        water: '#3a7ad8',
        waterHi: '#bfe4ff',
        leaf: '#3a9a44',
        leafLo: '#246a34',
        wood: '#a8784a',
        move: '#4aa0ff',
        attack: '#ff4a5a',
        cursor: '#ffd84a',
        blue: '#3a5ad0',
        red: '#c83040',
        win0: '#3a5ad0',
        win1: '#101a5a',
        rim: '#e8ecff',
        text: '#ffffff',
        ink: '#141020',
      },
    },
    {
      mood: { valence: -0.15, energy: 0.4 },
      colors: {
        grass: '#a89a48',
        grassHi: '#b8a858',
        edge: '#7a6a34',
        dirt: '#a0603a',
        dirtLo: '#6a3a2a',
        stone: '#b0948a',
        stoneLo: '#806060',
        water: '#5a5aa8',
        waterHi: '#ffc8a0',
        leaf: '#c0702a',
        leafLo: '#8a3a20',
        wood: '#9a6a40',
        move: '#5aa8ff',
        attack: '#ff3a3a',
        cursor: '#fff0a0',
        blue: '#3a5ad0',
        red: '#c02a3a',
        win0: '#4a4ac0',
        win1: '#1a1250',
        rim: '#ffe8d8',
        text: '#ffffff',
        ink: '#180c14',
      },
    },
    {
      mood: { valence: -0.5, energy: 0.15 },
      colors: {
        grass: '#2a4a5a',
        grassHi: '#325666',
        edge: '#1a3040',
        dirt: '#3a3a5a',
        dirtLo: '#24243e',
        stone: '#5a6a8a',
        stoneLo: '#3a4660',
        water: '#14285a',
        waterHi: '#a8c8ff',
        leaf: '#1e4a4a',
        leafLo: '#123030',
        wood: '#4a3a3a',
        move: '#4ab0ff',
        attack: '#ff4a6a',
        cursor: '#ffe06a',
        blue: '#4a6ae0',
        red: '#d0384a',
        win0: '#2c3c9a',
        win1: '#0a0e3a',
        rim: '#d8dcf8',
        text: '#ffffff',
        ink: '#060814',
      },
    },
  ],
  layers: [board, river, ranges, units, cursor, windows],
});
