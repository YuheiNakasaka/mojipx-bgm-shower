// A dating-sim screen: an empty classroom at sunset with cherry blossoms outside the window, a girl in a blazer whose
// face changes with every line she says, and a text box typing her words out letter by letter.
import { type Ctx, drawSprite, fillRect, flipped, type Palette, type Sprite } from 'mojipx';
import { bayer, disc, ditherGradient, frac, hexToRgb, memoCanvas, pixelLine, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { type Box, fillDither, wrap } from './batch-1-helpers.ts';
import { paletteOf, sigOf } from './batch-3-helpers.ts';
import { noise2, sunWithHalo, tinted } from './batch-4-helpers.ts';
import { mixHex } from './batch-5-helpers.ts';
import { drawWords, inEllipse, memoLayer, outlined, spriteOf, wordsWidth } from './batch-12-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sky3'
  | 'sun'
  | 'town'
  | 'bloom'
  | 'bloomHi'
  | 'bloomLo'
  | 'branch'
  | 'wall'
  | 'wallLo'
  | 'frame'
  | 'frameLo'
  | 'curtain'
  | 'curtainLo'
  | 'floor'
  | 'floorLo'
  | 'light'
  | 'board'
  | 'box'
  | 'rim'
  | 'text'
  | 'name'
  | 'blush'
  | 'tint'
  | 'ink';

// ---- the girl: a bust generated from shapes, so the hair, face and blazer can be shaded pixel by pixel ----

const BW = 100;
const BH = 170;
const CX = 50;

/** Horizontal distance of a pixel's centre from the middle of the bust. */
const dxOf = (x: number): number => Math.abs(x + 0.5 - CX);
const smooth01 = (k: number): number => {
  const t = Math.min(1, Math.max(0, k));
  return t * t * (3 - 2 * t);
};

// The bangs end in pointed strands; their lower edge is the lowest of the slopes falling away from each tip.
const TIPS: readonly (readonly [number, number])[] = [
  [24, 45],
  [31, 49],
  [38, 47],
  [45, 43],
  [55, 44],
  [62, 48],
  [69, 49],
  [76, 45],
];
const bangBottom = (x: number): number => TIPS.reduce((low, [tx, ty]) => Math.max(low, ty - Math.abs(x + 0.5 - tx) * 1.5), 0);
const tipOffset = (x: number): number => TIPS.reduce((best, [tx]) => Math.min(best, Math.abs(x + 0.5 - tx)), 99);

const inHead = (x: number, y: number): boolean => inEllipse(x + 0.5, y, CX, 45, 30.5, 33);
const faceHalf = (y: number): number => {
  if (y < 30 || y > 77) return -1;
  return y <= 54 ? 25 : 25 - (y - 54) * 0.5 - ((y - 54) / 23) ** 3 * 11;
};
const inFace = (x: number, y: number): boolean => dxOf(x) <= faceHalf(y);
const inNeck = (x: number, y: number): boolean => y >= 64 && y < 90 && dxOf(x) <= 6.5;
const torsoHalf = (y: number): number => (y < 80 ? -1 : 8 + 36 * smooth01((y - 80) / 19));
const inBackHair = (x: number, y: number): boolean =>
  inEllipse(x + 0.5, y, CX, 47, 34, 37) || (y >= 47 && y <= 152 + Math.sin(x * 0.7) * 4 && dxOf(x) <= 40 + (y - 47) * 0.12);
const backHairTone = (x: number, y: number): string => {
  if (x < 21 && y > 40) return (x + Math.floor(y / 3)) % 5 === 0 ? 'H' : 'h';
  return x % 6 === 0 && y > 52 ? 'h' : 'H';
};

// The shine across the crown: a broken ring of light with a brighter core.
const shineOf = (x: number, y: number): string | null => {
  const ring = Math.hypot(x + 0.5 - CX, y - 49);
  if (ring > 24.3 && ring < 25.6 && y < 33 && x % 6 > 2) return 'z';
  return ring > 23.5 && ring < 26.5 && y < 35 && x % 6 !== 2 ? 'l' : null;
};

const hairTone = (x: number, y: number): string => {
  const shine = shineOf(x, y);
  if (shine) return shine;
  const bottom = bangBottom(x);
  if (y >= bottom - 1.5 && y < bottom && inFace(x, y + 1)) return 'H';
  if (y > bottom - 8 && y < bottom && tipOffset(x) > 2.5) return 'H';
  return x + 0.5 - CX > 24 ? 'H' : 'h';
};

const skinTone = (x: number, y: number): string => {
  if (y < bangBottom(x) + 2) return 'S';
  if (dxOf(x) < 8 && !inFace(x, y + 1)) return 'c';
  if (y === 64 && x === 51) return 'S';
  return x + 0.5 - CX > 21 ? 'S' : 's';
};

const inTie = (x: number, y: number): boolean => {
  const dx = dxOf(x);
  const dy = Math.abs(y - 90.5);
  const wing = dx <= 7.5 && dy <= 1 + dx * 0.45;
  const tail = y >= 92 && y < 106 && Math.abs(dx - (y - 92) * 0.28) <= 1.4;
  return wing || tail;
};

const shirtTone = (x: number, y: number): string | null => {
  const dx = dxOf(x);
  if (y < 89 && dx <= 11 - (y - 80) * 0.4) return y > 87 || dx > 9 ? 'W' : 'w';
  const v = 2 + (y - 84) * 0.42;
  if (dx <= v) return dx > v - 1.5 ? 'W' : 'w';
  if (dx <= v + 1.2) return 'L';
  return null;
};

const torsoTone = (x: number, y: number): string => {
  if (inTie(x, y)) return dxOf(x) < 1.6 && y < 93 ? 'G' : 'g';
  const shirt = shirtTone(x, y);
  if (shirt) return shirt;
  const dx = dxOf(x);
  if (y >= 100 && dx >= 31 && dx < 32.2) return 'L';
  if (y >= 104 && y < 112 && x >= 64 && x < 71 && Math.abs(x - 67) <= 3 - Math.max(0, y - 108)) return 'y';
  return x + 0.5 - CX > 30 ? 'B' : 'b';
};

const neckTone = (x: number, y: number): string => (y < 74 || dxOf(x) > 5 ? 'S' : 's');

// Front to back: bangs over the face, the face, the neck, the rest of the head, the blazer, the long hair.
const bustPixel = (x: number, y: number): string => {
  if (inHead(x, y) && y < bangBottom(x)) return hairTone(x, y);
  if (inFace(x, y)) return skinTone(x, y);
  if (inNeck(x, y)) return neckTone(x, y);
  if (inHead(x, y)) return hairTone(x, y);
  if (torsoHalf(y) >= dxOf(x)) return torsoTone(x, y);
  if (inBackHair(x, y)) return backHairTone(x, y);
  return '.';
};

// The window behind her lights a warm rim down the left side of her hair and shoulder.
const RIMMED = new Set(['h', 'H', 'l', 'b', 'B']);
const withRim = (sprite: Sprite): Sprite =>
  sprite.map((row, y) => [...row].map((ch, x) => (RIMMED.has(ch) && (row[x - 1] ?? '.') === '.' && y > 14 && x < CX ? 'q' : ch)).join(''));

const BUST: Sprite = outlined(withRim(spriteOf(BW, BH, bustPixel)), 'o');

// Side locks hang in front of her cheeks and sway; each is pre-drawn at five sway offsets.
const LOCK_W = 16;
const LOCK_H = 82;
// Shade across a lock: a dark edge on the right, a lit strand down the middle and along the left edge near the top.
const lockShade = (d: number, half: number, y: number): string => {
  if (d > half - 1.6) return 'H';
  const strand = Math.abs(d + 0.8) < 0.7 && y > 8 && y < 40;
  const edge = d < -half + 1.5 && y > 4 && y < 34;
  return strand || edge ? 'l' : 'h';
};

const lockPixel =
  (sway: number) =>
  (x: number, y: number): string => {
    const k = y / LOCK_H;
    const cx = 9 - y * 0.04 + Math.sin(y / 11) * 1.2 + sway * k * k;
    const half = 3.4 + Math.min(1, y / 12) * 2.2 - y * 0.055;
    const d = x + 0.5 - cx;
    return Math.abs(d) > half || y < 1 ? '.' : lockShade(d, half, y);
  };
const LOCKS: readonly Sprite[] = [-2, -1, 0, 1, 2].map((s) => outlined(spriteOf(LOCK_W, LOCK_H, lockPixel(s)), 'o'));
const LOCKS_RIGHT: readonly Sprite[] = LOCKS.map(flipped);

// A ribbon bow pinned at the side of her head, built from its left half.
const BOW_LEFT = ['oo....', 'oroo..', 'orrroo', 'orrrrr', 'orrrrr', 'oRrrrr', 'oRRroo', 'ooo.oR', '....oR', '....oo'];
const BOW_KNOT = '..ooRoooo.';
const BOW: Sprite = BOW_LEFT.map((half, y) => `${half}${BOW_KNOT[y]}${[...half].reverse().join('')}`);

const AHOGE: readonly Sprite[] = [
  ['.....oo.', '....ohho', '...ohho.', '..ohho..', '..oho...', '..oho...', '..oho...'],
  ['........', '......oo', '...oohho', '..ohhho.', '..oho...', '..oho...', '..oho...'],
];

// Eyes are drawn open toward the outer corner on the left; the right eye is the mirror image.
const EYE_OPEN: Sprite = [
  '...oooooooo...',
  '.oooooooooooo.',
  'oooIIIIIIIIwo.',
  'o.IIIIIIIIIIw.',
  '..IIIIppIIIIw.',
  '..iIIppppIIi..',
  '..iiippppiii..',
  '..iiiippiiii..',
  '..jiiiiiiiij..',
  '...jjjjjjjj...',
  '....oooooo....',
];
const EYE_HALF: Sprite = [
  '..............',
  '..............',
  '..............',
  '...oooooooo...',
  '.oooooooooooo.',
  'oooIIppppIIwo.',
  '..iiippppiii..',
  '..iiiippiiii..',
  '..jiiiiiiiij..',
  '...jjjjjjjj...',
  '....oooooo....',
];
const BLANK_ROWS: Sprite = ['..............', '..............', '..............'];
const EYE_SHUT: Sprite = [...BLANK_ROWS, '..............', '..............', 'oo..........oo', '.oooooooooooo.'];
const EYE_HAPPY: Sprite = [...BLANK_ROWS, '.....oooo.....', '...oo....oo...', '..o........o..', '.o..........o.'];

type Eyes = 'open' | 'half' | 'happy';
type Mouth = 'line' | 'smile' | 'open' | 'pout' | 'cat';

const MOUTHS: Readonly<Record<Mouth | 'talk', Sprite>> = {
  line: ['.......', '..lll..', '.......', '.......'],
  smile: ['.l...l.', '..lll..', '.......', '.......'],
  open: ['..lll..', '.lmmml.', '.lmttl.', '..lll..'],
  pout: ['..lll..', '.l...l.', '.......', '.......'],
  cat: ['l..l..l', '.ll.ll.', '.......', '.......'],
  talk: ['.......', '..lll..', '.lmtl..', '..ll...'],
};

// o outline, c chin line, s/S skin, h/H/l/q hair (base, shade, light, rim), r/R ribbon, w/W shirt, g/G tie,
// b/B/L blazer (base, shade, seams), y crest; eyes: w white, I/i/j iris (dark to light), p pupil; mouth l/m/t.
const GIRL: Palette = {
  o: '#2a1218',
  c: '#b86a5a',
  s: '#ffe6d6',
  S: '#f2b8a2',
  h: '#962a48',
  H: '#5e1632',
  l: '#d85a78',
  z: '#ff9ab0',
  q: '#ffb27a',
  r: '#fff4e2',
  R: '#e2c4ae',
  w: '#fbf6f2',
  W: '#c8c0d4',
  g: '#2aa070',
  G: '#16684a',
  b: '#2c3266',
  B: '#1c2046',
  L: '#121434',
  y: '#ecc050',
};
const FACE: Palette = {
  o: '#2a1218',
  w: '#ffffff',
  I: '#7a2c1a',
  i: '#d46a2a',
  j: '#ffbc54',
  p: '#3a1008',
  l: '#a03c40',
  m: '#5a1a22',
  t: '#ff8c9c',
};

const girlColors = (c: Colors<K>): Palette => tinted(GIRL, c.tint, 0.14);
const faceColors = (c: Colors<K>): Palette => tinted(FACE, c.tint, 0.1);

// ---- the script: one line every eight beats, typed at eight letters a beat ----

type Face = { readonly eyes: Eyes; readonly mouth: Mouth; readonly blush: 0 | 1 | 2 };
type Line = { readonly rows: readonly string[]; readonly face: Face };

const SCRIPT: readonly Line[] = [
  { rows: ['...the bus is late again.'], face: { eyes: 'open', mouth: 'line', blush: 0 } },
  { rows: ['Hey, want to walk home', 'together today?'], face: { eyes: 'open', mouth: 'smile', blush: 1 } },
  { rows: ['Look... the petals are', 'falling like snow.'], face: { eyes: 'half', mouth: 'smile', blush: 1 } },
  { rows: ['...are you even listening?'], face: { eyes: 'open', mouth: 'pout', blush: 2 } },
  { rows: ['Ehehe. Just kidding!'], face: { eyes: 'happy', mouth: 'cat', blush: 1 } },
  { rows: ["Let's come back here", 'tomorrow, okay? ♥'], face: { eyes: 'open', mouth: 'smile', blush: 2 } },
];
const LINE_BEATS = 8;
const TYPE_RATE = 8;

type Moment = { readonly line: Line; readonly index: number; readonly shown: number; readonly done: boolean };

const momentOf = (beat: number): Moment => {
  const n = Math.floor(Math.max(0, beat) / LINE_BEATS);
  const line = SCRIPT[n % SCRIPT.length] as Line;
  const total = line.rows.join('').length;
  const shown = Math.floor((Math.max(0, beat) - n * LINE_BEATS - 0.3) * TYPE_RATE);
  return { line, index: n, shown: Math.max(0, Math.min(total, shown)), done: shown >= total };
};

// ---- layout ----

type Layout = {
  readonly wide: boolean;
  readonly win: Box;
  readonly panes: number;
  readonly floorY: number;
  readonly box: Box;
  readonly girlX: number;
  readonly girlY: number;
  readonly board: Box | null;
};

const layoutOf = (f: Frame): Layout => {
  if (f.w > f.h) {
    const box = { x: 6, y: f.h - 51, w: f.w - 12, h: 46 };
    const winW = Math.round(f.w * 0.64);
    return {
      wide: true,
      win: { x: -4, y: 8, w: winW, h: Math.round(f.h * 0.56) },
      panes: 3,
      floorY: Math.round(f.h * 0.72),
      box,
      girlX: Math.round(f.w * 0.55 - CX),
      girlY: box.y - 113,
      board: { x: winW + 26, y: Math.round(f.h * 0.2), w: f.w - winW - 20, h: Math.round(f.h * 0.34) },
    };
  }
  const box = { x: 6, y: f.h - 66, w: f.w - 12, h: 52 };
  return {
    wide: false,
    win: { x: -4, y: Math.round(f.h * 0.07), w: f.w + 8, h: Math.round(f.h * 0.62) },
    panes: 2,
    floorY: Math.round(f.h * 0.74),
    box,
    girlX: Math.round(f.w * 0.5 - CX),
    girlY: box.y - 120,
    board: null,
  };
};

// ---- the classroom (one cached layer) ----

/** A clump of blossom: its centre and radius. */
type Clump = readonly [number, number, number];

// Blossom clumps along three boughs reaching in from the top-left corner of the window.
const REACH = [0.8, 0.46, 0.64] as const;
const DROP = [0.14, 0.3, 0.04] as const;
const START = [0.1, 0.24, 0.01] as const;
const CLUMPS = 30;

const clumpsOf = (win: Box): readonly Clump[] =>
  Array.from({ length: CLUMPS }, (_, i) => {
    const bough = i % 3;
    const along = Math.floor(i / 3) / (CLUMPS / 3 - 1);
    const x = win.x - 4 + along * win.w * REACH[bough as 0 | 1 | 2] + rand(i, 3) * 8;
    const y =
      win.y + win.h * (START[bough as 0 | 1 | 2] + along * DROP[bough as 0 | 1 | 2]) + Math.sin(along * Math.PI) * 6 + rand(i, 4) * 8;
    return [x, y, 7 + rand(i, 5) * 6 - along * 3] as const;
  });

const bloomTone = (x: number, y: number, clumps: readonly Clump[], c: Colors<K>): string | null => {
  const hit = clumps.find(([cx, cy, r]) => Math.hypot(x - cx, y - cy) <= r * (0.85 + noise2(x / 3, y / 3, 7) * 0.35));
  if (!hit) return null;
  const [hx, hy, hr] = hit;
  if (noise2(x / 2.5, y / 2.5, 9) > 0.8) return null;
  const v = (y - hy) / hr - (x - hx) / hr / 3 + (noise2(x / 2, y / 2, 11) - 0.5) * 0.8 + (bayer(x, y) - 0.5) * 0.4;
  if (v < -0.45) return c.bloomHi;
  return v > 0.4 ? c.bloomLo : c.bloom;
};

const bloomLayer = (win: Box, c: Colors<K>): HTMLCanvasElement =>
  memoCanvas(`b12vn-bloom:${win.x},${win.y},${win.w},${win.h}:${c.bloom}:${c.bloomHi}:${c.bloomLo}`, win.w, win.h, (img) => {
    const clumps = clumpsOf({ ...win, x: 0, y: 0 });
    for (let y = 0; y < win.h; y++)
      for (let x = 0; x < win.w; x++) {
        const color = bloomTone(x, y, clumps, c);
        if (color) img.data.set([...hexToRgb(color), 255], (y * win.w + x) * 4);
      }
  });

const boughs = (g: Ctx, win: Box, c: Colors<K>): void => {
  const clumps = clumpsOf(win);
  for (let i = 0; i + 3 < clumps.length; i++) {
    const [ax, ay] = clumps[i] as Clump;
    const [bx, by] = clumps[i + 3] as Clump;
    for (let t = 0; t < (i < 12 ? 3 : 2); t++) pixelLine(g, ax, ay + 2 + t, bx, by + 2 + t, c.branch);
  }
};

const town = (g: Ctx, win: Box, c: Colors<K>): void => {
  g.fillStyle = c.town;
  const base = win.y + win.h;
  for (let x = win.x; x < win.x + win.w; x += 6) {
    const roof = 4 + Math.floor(rand(x, 21) * 12);
    g.fillRect(x, base - roof, 6, roof);
    if (rand(x, 22) < 0.25) g.fillRect(x + 2, base - roof - 4, 1, 4);
  }
};

const outside = (g: Ctx, l: Layout, c: Colors<K>): void => {
  const { win } = l;
  g.drawImage(ditherGradient(win.w, win.h, [c.sky0, c.sky1, c.sky2, c.sky3]), win.x, win.y);
  const sunX = win.x + win.w * (l.wide ? 0.3 : 0.32);
  const sunY = win.y + win.h * 0.8;
  sunWithHalo(g, sunX, sunY, l.wide ? 9 : 11, c.sun, c.sun, 3);
  town(g, win, c);
  boughs(g, win, c);
  g.drawImage(bloomLayer(win, c), win.x, win.y);
};

const mullion = (g: Ctx, x: number, top: number, h: number, c: Colors<K>): void => {
  fillRect(g, c.frameLo, x - 2, top, 5, h);
  fillRect(g, c.frame, x - 1, top, 2, h);
};

const frames = (g: Ctx, l: Layout, c: Colors<K>): void => {
  const { win } = l;
  for (let p = 1; p < l.panes; p++) mullion(g, Math.round(win.x + (win.w * p) / l.panes), win.y, win.h, c);
  const transom = win.y + Math.round(win.h * 0.24);
  fillRect(g, c.frameLo, win.x, transom - 1, win.w, 4);
  fillRect(g, c.frame, win.x, transom, win.w, 2);
  fillRect(g, c.frameLo, win.x, win.y - 3, win.w + 3, 4);
  fillRect(g, c.frame, win.x, win.y - 3, win.w + 2, 2);
  mullion(g, win.x + win.w, win.y - 3, win.h + 3, c);
  fillRect(g, c.frameLo, win.x - 2, win.y + win.h, win.w + 8, 6);
  fillRect(g, c.frame, win.x - 2, win.y + win.h, win.w + 8, 2);
};

// Curtains gathered at both ends of the window: pleats of light and shade, flaring toward the hem.
const curtain = (g: Ctx, x: number, top: number, h: number, dir: 1 | -1, c: Colors<K>): void => {
  for (let y = top; y < top + h; y++) {
    const k = (y - top) / h;
    const width = Math.round(8 + Math.max(0, k - 0.35) * 18 + (k < 0.35 ? (0.35 - k) * 10 : 0));
    for (let i = 0; i < width; i++) {
      const pleat = Math.floor((i + k * 3) / 3) % 2 === 0;
      fillRect(g, pleat ? c.curtain : c.curtainLo, x + dir * i, y, 1, 1);
    }
  }
  fillRect(g, c.curtainLo, dir > 0 ? x : x - 12, top + Math.round(h * 0.35), 13, 2);
};

// Sunlight through the panes lies across the floor in skewed patches.
const floorLight = (g: Ctx, l: Layout, f: Frame, c: Colors<K>): void => {
  const pane = l.win.w / l.panes;
  for (let y = l.floorY + 2; y < f.h; y++) {
    const skew = (y - l.floorY) * 0.9;
    for (let p = 0; p < l.panes; p++) fillDither(g, c.light, 0.45, l.win.x + p * pane + 5 + skew, y, pane - 10, 1);
  }
};

const floor = (g: Ctx, l: Layout, f: Frame, c: Colors<K>): void => {
  fillRect(g, c.floor, 0, l.floorY, f.w, f.h - l.floorY);
  fillRect(g, c.floorLo, 0, l.floorY, f.w, 2);
  for (let y = l.floorY + 6, gap = 5; y < f.h; y += gap, gap += 2) fillRect(g, c.floorLo, 0, y, f.w, 1);
  floorLight(g, l, f, c);
  for (let x = 6; x < f.w; x += 34) desk(g, x + (l.wide ? 0 : 10), l.floorY - 12, c);
};

const desk = (g: Ctx, x: number, y: number, c: Colors<K>): void => {
  fillRect(g, c.frameLo, x, y, 24, 3);
  fillRect(g, c.frame, x, y, 24, 1);
  fillRect(g, c.wallLo, x + 2, y + 3, 2, 12);
  fillRect(g, c.wallLo, x + 20, y + 3, 2, 12);
  fillRect(g, c.wallLo, x + 3, y + 8, 18, 4);
};

// A blackboard with a chalk doodle of an umbrella over two hearts, and the chalk tray.
const board = (g: Ctx, b: Box, c: Colors<K>): void => {
  fillRect(g, c.frameLo, b.x - 2, b.y - 2, b.w + 4, b.h + 4);
  fillRect(g, c.board, b.x, b.y, b.w, b.h);
  fillRect(g, c.frame, b.x - 3, b.y + b.h, b.w + 6, 2);
  const ux = b.x + Math.round(b.w * 0.45);
  const uy = b.y + Math.round(b.h * 0.25);
  for (let dx = -9; dx <= 9; dx++) fillRect(g, c.text, ux + dx, uy + Math.round((dx * dx) / 14), 1, 1);
  pixelLine(g, ux - 9, uy + 6, ux + 9, uy + 6, c.text);
  pixelLine(g, ux, uy - 3, ux, uy + 22, c.text);
  for (const side of [-1, 1]) drawWords(g, '♥', ux + side * 7 - 2, uy + 12, c.name);
  for (let i = 0; i < 4; i++) fillRect(g, c.text, b.x + 4 + i * 7, b.y + b.h - 1, 4, 1);
};

const room = (f: Frame, l: Layout, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`vn-room:${sigOf(c)}`, f.w, f.h, (g) => {
    g.drawImage(ditherGradient(f.w, l.floorY, [c.wallLo, c.wall, c.wall]), 0, 0);
    outside(g, l, c);
    frames(g, l, c);
    curtain(g, 0, l.win.y - 2, l.win.h + 2, 1, c);
    curtain(g, l.win.x + l.win.w + (l.wide ? 4 : -1), l.win.y - 2, l.win.h + 2, -1, c);
    if (l.board) board(g, l.board, c);
    floor(g, l, f, c);
  });

const background = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(room(f, layoutOf(f), c), 0, 0);
};

// ---- living details: blossoms catching the light, petals, dust in the sunbeams, the clock ----

const shimmer = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const { win } = layoutOf(f);
  for (let i = 0; i < 10; i++) {
    if (frac(f.t * 0.5 + rand(i, 31)) > 0.3) continue;
    const x = Math.round(win.x + rand(i, 32) * win.w * 0.55);
    const y = Math.round(win.y + 4 + rand(i, 33) * win.h * 0.3);
    fillRect(ctx, c.bloomHi, x, y, 1, 1);
  }
};

const petals = (ctx: Ctx, f: Frame, c: Colors<K>, count: number, seed: number): void => {
  for (let i = 0; i < count; i++) {
    const fall = 9 + rand(i, seed) * 8;
    const y = wrap(rand(i, seed + 1) * (f.h + 20) + f.t * fall, f.h + 20) - 10;
    const x = wrap(rand(i, seed + 2) * (f.w + 30) + f.t * (6 + rand(i, seed + 3) * 6) + Math.sin(f.t * 1.4 + i) * 5, f.w + 30) - 15;
    const spin = Math.floor(f.t * 3 + i) % 3;
    const color = i % 3 === 0 ? c.bloomHi : c.bloom;
    fillRect(ctx, color, Math.round(x), Math.round(y), spin === 1 ? 1 : 2, spin === 1 ? 2 : 1);
  }
};

const backPetals = (ctx: Ctx, f: Frame, c: Colors<K>): void => petals(ctx, f, c, 14, 41);
const frontPetals = (ctx: Ctx, f: Frame, c: Colors<K>): void => petals(ctx, f, c, 7, 47);

const motes = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  for (let i = 0; i < 16; i++) {
    if (Math.sin(f.t * (1.2 + rand(i, 51)) + i * 2) < 0.2) continue;
    const x = Math.round(wrap(rand(i, 52) * f.w + Math.sin(f.t * 0.3 + i) * 6, f.w));
    const y = Math.round(f.h * 0.3 + rand(i, 53) * f.h * 0.4 - frac(f.t * 0.04 + rand(i, 54)) * 20);
    fillRect(ctx, c.light, x, y, 1, 1);
  }
};

const clock = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const cx = l.board ? l.board.x + Math.round(l.board.w * 0.5) : 24;
  const cy = l.board ? Math.round(l.board.y * 0.5) + 2 : l.win.y - 13;
  if (cy < 8) return;
  disc(ctx, cx, cy, 7, () => c.frameLo);
  disc(ctx, cx, cy, 6, () => c.curtain);
  const minute = f.t * 0.05 + 0.6;
  pixelLine(ctx, cx, cy, cx + Math.sin(minute * Math.PI * 2) * 5, cy - Math.cos(minute * Math.PI * 2) * 5, c.ink);
  pixelLine(ctx, cx, cy, cx + 3, cy + 1, c.ink);
};

// ---- the girl ----

const blinking = (t: number): boolean => {
  const p = frac(t / 3.7);
  return p < 0.035 || (Math.floor(t / 3.7) % 3 === 1 && p > 0.07 && p < 0.1);
};

const eyesOf = (f: Frame, face: Face): Sprite => {
  if (face.eyes === 'happy') return EYE_HAPPY;
  if (blinking(f.t)) return EYE_SHUT;
  return face.eyes === 'half' ? EYE_HALF : EYE_OPEN;
};

const eyes = (ctx: Ctx, f: Frame, x: number, y: number, face: Face, palette: Palette): void => {
  const sprite = eyesOf(f, face);
  drawSprite(ctx, sprite, palette, x + 29, y + 49);
  drawSprite(ctx, flipped(sprite), palette, x + 57, y + 49);
  if (sprite !== EYE_OPEN && sprite !== EYE_HALF) return;
  const half = sprite === EYE_HALF;
  for (const ex of [x + 29, x + 57]) {
    fillRect(ctx, '#ffffff', ex + 4, y + 49 + (half ? 5 : 3), 2, half ? 1 : 2);
    fillRect(ctx, '#ffffff', ex + 9, y + 56, 1, 1);
  }
};

// `soft` must be a hex color (it is dithered); `line` may be any CSS color.
const blush = (ctx: Ctx, x: number, y: number, level: number, soft: string, line: string): void => {
  if (level <= 0) return;
  for (const bx of [x + 31, x + 61]) {
    fillDither(ctx, soft, level > 1 ? 0.6 : 0.4, bx, y + 62, 9, 3);
    for (let k = 0; k < level + 1; k++) {
      fillRect(ctx, line, bx + 2 + k * 3, y + 62, 1, 1);
      fillRect(ctx, line, bx + 1 + k * 3, y + 63, 1, 1);
    }
  }
};

const mouthOf = (f: Frame, m: Moment): Sprite => {
  const talking = !m.done && frac(f.beat * 2) < 0.5;
  return MOUTHS[talking ? 'talk' : m.line.face.mouth];
};

const girl = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const m = momentOf(f.beat);
  const breath = frac(f.beat / 4) < 0.5 ? 0 : 1;
  const x = l.girlX;
  const y = l.girlY + breath;
  const palette = paletteOf(c, girlColors);
  const face = paletteOf(c, faceColors);
  drawSprite(ctx, BUST, palette, x, y);
  drawSprite(ctx, AHOGE[frac(f.beat) < 0.25 ? 1 : 0] as Sprite, palette, x + 48, y + 6);
  drawSprite(ctx, BOW, palette, x + 66, y + 14);
  blush(ctx, x, y, m.line.face.blush, c.blush, face.t ?? c.name);
  eyes(ctx, f, x, y, m.line.face, face);
  drawSprite(ctx, mouthOf(f, m), face, x + 47, y + 68);
  const sway = Math.round(Math.sin(f.t * 1.3) * 2) + 2;
  drawSprite(ctx, LOCKS[sway] as Sprite, palette, x + 16, y + 35);
  drawSprite(ctx, LOCKS_RIGHT[4 - sway] as Sprite, palette, x + BW - 16 - LOCK_W, y + 35);
};

// ---- the text box ----

const boxLayer = (b: Box, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`vn-box:${c.box}:${c.rim}:${c.ink}`, b.w, b.h, (g) => {
    g.drawImage(ditherGradient(b.w - 4, b.h - 4, [mixHex(c.box, c.rim, 0.14), c.box, c.box]), 2, 2);
    fillRect(g, c.rim, 2, 0, b.w - 4, 1);
    fillRect(g, c.rim, 2, b.h - 1, b.w - 4, 1);
    fillRect(g, c.rim, 0, 2, 1, b.h - 4);
    fillRect(g, c.rim, b.w - 1, 2, 1, b.h - 4);
    for (const [x, y] of [
      [1, 1],
      [b.w - 2, 1],
      [1, b.h - 2],
      [b.w - 2, b.h - 2],
    ] as const)
      fillRect(g, c.rim, x, y, 1, 1);
    fillRect(g, c.ink, 2, 1, b.w - 4, 1);
  });

const typedRows = (m: Moment): readonly string[] => {
  let left = m.shown;
  return m.line.rows.map((row) => {
    const part = row.slice(0, Math.max(0, left));
    left -= row.length;
    return part;
  });
};

const textBox = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const { box } = layoutOf(f);
  const m = momentOf(f.beat);
  ctx.drawImage(boxLayer(box, c), box.x, box.y);
  const rows = typedRows(m);
  const left = box.x + 10;
  const top = box.y + 12;
  rows.forEach((row, i) => {
    drawWords(ctx, row, left + 1, top + i * 12 + 1, c.ink);
    drawWords(ctx, row, left, top + i * 12, c.text);
  });
  if (m.done && frac(f.beat) < 0.7) cursor(ctx, left + wordsWidth(rows.at(-1) ?? '') + 4, top + (rows.length - 1) * 12 + 3, f, c);
  nameTab(ctx, box, c);
};

const cursor = (ctx: Ctx, x: number, y: number, f: Frame, c: Colors<K>): void => {
  const dy = frac(f.beat) < 0.25 ? 1 : 0;
  fillRect(ctx, c.name, x, y + dy, 5, 1);
  fillRect(ctx, c.name, x + 1, y + dy + 1, 3, 1);
  fillRect(ctx, c.name, x + 2, y + dy + 2, 1, 1);
};

const NAME = 'Koharu';

const nameTab = (ctx: Ctx, box: Box, c: Colors<K>): void => {
  const w = wordsWidth(NAME) + 12;
  const x = box.x + 6;
  const y = box.y - 6;
  fillRect(ctx, c.ink, x - 1, y - 1, w + 2, 12);
  fillRect(ctx, c.name, x, y, w, 10);
  fillRect(ctx, c.rim, x, y, w, 1);
  drawWords(ctx, NAME, x + 6, y + 2, c.text);
};

// A heart in the corner fills as the afternoon goes on, and beats with the kick.
const HEART: Sprite = [
  '.ooo...ooo.',
  'ollloooffo.',
  'olllloffffo',
  'olllllffffo',
  'olllllfffo.',
  '.olllllffo.',
  '..olllllo..',
  '...olllo...',
  '....olo....',
  '.....o.....',
];

const heartMeter = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const m = momentOf(f.beat);
  const level = ((m.index % SCRIPT.length) + 1) / SCRIPT.length;
  const x = f.w - 18;
  const y = l.wide ? 6 : 8;
  const filled = Math.round(level * 10);
  const sprite = HEART.map((row, r) => (r < 10 - filled ? row.replace(/l/g, 'f') : row.replace(/f/g, 'l')));
  const pump = f.kick > 0.6 ? 1 : 0;
  if (pump) fillRect(ctx, c.name, x - 1, y + 3, 13, 3);
  drawSprite(ctx, sprite, { o: c.ink, l: c.name, f: c.box }, x, y - pump);
};

export const visualNovel = defineScene<K>({
  id: 'visual-novel',
  title: 'Heart Route',
  mood: { valence: 0.3, energy: -0.2 },
  styles: ['nineties-pop', 'lofi-loop', 'town-waltz', 'showa-ballad', 'band-rock', 'city-groove'],
  variants: [
    {
      mood: { valence: 0.3, energy: -0.2 },
      colors: {
        sky0: '#3e2a6e',
        sky1: '#a24a7c',
        sky2: '#f2885a',
        sky3: '#ffd28a',
        sun: '#fff2c4',
        town: '#5a2e52',
        bloom: '#f6a2bc',
        bloomHi: '#ffdce4',
        bloomLo: '#c0608a',
        branch: '#3e1a2c',
        wall: '#c88e6c',
        wallLo: '#6c3e52',
        frame: '#ecdcc4',
        frameLo: '#8c6468',
        curtain: '#ffe8c8',
        curtainLo: '#d8a488',
        floor: '#9e5e3c',
        floorLo: '#6a3a2c',
        light: '#ffc888',
        board: '#2c4a3e',
        box: '#221a3a',
        rim: '#ffd8e6',
        text: '#fff8f0',
        name: '#e85a8c',
        blush: '#ff8a96',
        tint: '#ff9a6a',
        ink: '#1a0e18',
      },
    },
    {
      mood: { valence: 0.7, energy: 0.3 },
      colors: {
        sky0: '#3a86e0',
        sky1: '#62a8f0',
        sky2: '#9cd0fa',
        sky3: '#e2f4ff',
        sun: '#ffffff',
        town: '#7a9ac8',
        bloom: '#ffb4c8',
        bloomHi: '#fff0f4',
        bloomLo: '#e07aa0',
        branch: '#5a3a3a',
        wall: '#f2e2c8',
        wallLo: '#b8a698',
        frame: '#ffffff',
        frameLo: '#a8a0a8',
        curtain: '#ffffff',
        curtainLo: '#d8d0d8',
        floor: '#c8905a',
        floorLo: '#94603e',
        light: '#fff6d0',
        board: '#2e5a48',
        box: '#24305a',
        rim: '#ffffff',
        text: '#ffffff',
        name: '#ff6a9a',
        blush: '#ff9cae',
        tint: '#fff8f0',
        ink: '#141828',
      },
    },
    {
      mood: { valence: -0.3, energy: -0.5 },
      colors: {
        sky0: '#0e1236',
        sky1: '#222a66',
        sky2: '#4a3e86',
        sky3: '#a2668e',
        sun: '#ffe4c0',
        town: '#141638',
        bloom: '#a07ab0',
        bloomHi: '#e2c4e6',
        bloomLo: '#5e4a82',
        branch: '#0e0c22',
        wall: '#4a4a7a',
        wallLo: '#20203e',
        frame: '#8c8cb8',
        frameLo: '#3a3a62',
        curtain: '#a4a2cc',
        curtainLo: '#62628e',
        floor: '#3a3458',
        floorLo: '#24203c',
        light: '#c4b4ff',
        board: '#1a2a32',
        box: '#0e0e24',
        rim: '#c8c4ff',
        text: '#f0eeff',
        name: '#b45a9c',
        blush: '#d87a9e',
        tint: '#5a5aa8',
        ink: '#08081a',
      },
    },
  ],
  layers: [background, shimmer, backPetals, motes, clock, girl, frontPetals, textBox, heartMeter],
});
