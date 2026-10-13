// A virtual-pet keychain on a desk at night: under the lamp its little LCD creature hops to the beat, eats a star cookie,
// beams with hearts and falls asleep, beside a sticker-covered notebook, a desk calendar and a steaming mug.
import { type Ctx, drawSprite, fillRect, type Palette, type Sprite } from 'mojipx';
import { bayer, disc, ditherGradient, frac, rand, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { drawGlow, fillDither, smokePlume } from './batch-1-helpers.ts';
import { paletteOf, sigOf } from './batch-3-helpers.ts';
import { drawText, forEachTextPixel, textWidth } from './batch-4-helpers.ts';
import { isDark, mixHex, pixelLayer } from './batch-5-helpers.ts';
import { inEllipse, memoLayer, outlined } from './batch-12-helpers.ts';

type K =
  | 'wall'
  | 'wallLo'
  | 'sky0'
  | 'sky1'
  | 'moon'
  | 'wood'
  | 'woodLo'
  | 'woodHi'
  | 'light'
  | 'shell'
  | 'shellHi'
  | 'shellLo'
  | 'plate'
  | 'lcd'
  | 'lcdOn'
  | 'lcdOff'
  | 'btnA'
  | 'btnB'
  | 'btnC'
  | 'paper'
  | 'paperLo'
  | 'accent'
  | 'metal'
  | 'ink';

// ---- the creature on the LCD, in LCD pixels ('#' dark) ----

const PET_UP: Sprite = [
  '..#....#..',
  '.#.#..#.#.',
  '.#..##..#.',
  '#........#',
  '#.#....#.#',
  '#........#',
  '#...##...#',
  '.#......#.',
  '..######..',
];
const PET_SQUASH: Sprite = [
  '..........',
  '..#....#..',
  '.#.####.#.',
  '#........#',
  '#.#....#.#',
  '#........#',
  '#...##...#',
  '#........#',
  '.########.',
];
const PET_CHOMP: Sprite = [
  '..#....#..',
  '.#.#..#.#.',
  '.#..##..#.',
  '#........#',
  '#.#....#.#',
  '#...##...#',
  '#..#..#..#',
  '.#..##..#.',
  '..######..',
];
const PET_SLEEP: Sprite = [
  '..........',
  '..#....#..',
  '.#.####.#.',
  '#........#',
  '#.##..##.#',
  '#........#',
  '#........#',
  '#........#',
  '.########.',
];
const PET_HAPPY: Sprite = [
  '..#....#..',
  '.#.#..#.#.',
  '.#..##..#.',
  '#........#',
  '#.#....#.#',
  '##.#..#.##',
  '#..####..#',
  '.#......#.',
  '..######..',
];
const COOKIE: Sprite = ['..#..', '.###.', '#####', '.###.', '#...#'];
const HEART: Sprite = ['.#.#.', '#####', '.###.', '..#..'];
const ZED: Sprite = ['###', '..#', '.#.', '###'];

// The day of the pet, 32 beats long: play, a meal, a happy spell, sleep, and waking up.
type Act = 'play' | 'eat' | 'happy' | 'sleep' | 'wake';
const DAY = 32;
const actOf = (beat: number): { readonly act: Act; readonly at: number; readonly day: number } => {
  const b = Math.max(0, beat);
  const day = Math.floor(b / DAY);
  const at = b - day * DAY;
  const act: Act = at < 12 ? 'play' : at < 18 ? 'eat' : at < 22 ? 'happy' : at < 30 ? 'sleep' : 'wake';
  return { act, at, day };
};

// ---- layout ----

type Layout = {
  readonly wide: boolean;
  readonly deskY: number;
  readonly egg: { readonly cx: number; readonly top: number };
  readonly book: { readonly x: number; readonly y: number; readonly w: number; readonly h: number };
  readonly cal: { readonly x: number; readonly y: number };
  readonly mug: { readonly x: number; readonly y: number };
  readonly win: { readonly x: number; readonly y: number; readonly w: number; readonly h: number };
  readonly lamp: { readonly x: number; readonly y: number };
};

const EGG_W = 74;
const EGG_H = 92;

const layoutOf = (f: Frame): Layout => {
  if (f.w > f.h) {
    const deskY = Math.round(f.h * 0.42);
    return {
      wide: true,
      deskY,
      egg: { cx: Math.round(f.w * 0.52), top: f.h - EGG_H - 12 },
      book: { x: Math.round(f.w * 0.06), y: deskY + 34, w: Math.round(f.w * 0.26), h: 58 },
      cal: { x: Math.round(f.w * 0.72), y: deskY + 6 },
      mug: { x: Math.round(f.w * 0.88), y: f.h - 20 },
      win: { x: Math.round(f.w * 0.62), y: 6, w: Math.round(f.w * 0.3), h: deskY - 16 },
      lamp: { x: Math.round(f.w * 0.3), y: 10 },
    };
  }
  const deskY = Math.round(f.h * 0.4);
  return {
    wide: false,
    deskY,
    egg: { cx: Math.round(f.w * 0.5), top: Math.round(f.h * 0.5) },
    book: { x: 10, y: Math.round(f.h * 0.78), w: Math.round(f.w * 0.6), h: 64 },
    cal: { x: Math.round(f.w * 0.62), y: deskY + 12 },
    mug: { x: Math.round(f.w * 0.82), y: Math.round(f.h * 0.86) },
    win: { x: Math.round(f.w * 0.2), y: Math.round(f.h * 0.06), w: Math.round(f.w * 0.6), h: Math.round(f.h * 0.24) },
    lamp: { x: Math.round(f.w * 0.2), y: Math.round(f.h * 0.32) },
  };
};

// ---- the room (one cached layer) ----

const CLOUD_PUFFS = [
  [0.2, 0.7],
  [0.27, 0.64],
  [0.34, 0.7],
] as const;

const windowView = (g: Ctx, l: Layout, c: Colors<K>): void => {
  const { win } = l;
  fillRect(g, c.ink, win.x - 3, win.y - 3, win.w + 6, win.h + 6);
  fillRect(g, c.paperLo, win.x - 2, win.y - 2, win.w + 4, win.h + 4);
  g.drawImage(ditherGradient(win.w, win.h, [c.sky0, c.sky1]), win.x, win.y);
  const mx = win.x + win.w * 0.72;
  const my = win.y + win.h * 0.32;
  disc(g, mx, my, Math.round(win.h * 0.14), () => c.moon);
  if (isDark(c.sky0)) disc(g, mx + 3, my - 2, Math.round(win.h * 0.12), () => c.sky0);
  else for (const [dx, dy] of CLOUD_PUFFS) disc(g, win.x + win.w * dx, win.y + win.h * dy, 5, () => c.moon);
  fillRect(g, c.paperLo, win.x + Math.round(win.w / 2) - 1, win.y, 2, win.h);
  fillRect(g, c.paperLo, win.x, win.y + Math.round(win.h * 0.45), win.w, 2);
};

// The desk top, lit by the lamp: bright wood in the pool under the shade, falling off into the dark around it.
const deskTone = (x: number, y: number, l: Layout, tones: readonly string[]): string => {
  const rx = l.wide ? 120 : 96;
  const d = Math.hypot((x - l.egg.cx) / rx, (y - (l.egg.top + EGG_H - 10)) / (rx * 0.5));
  const v = d + (bayer(x, y) - 0.5) * 0.35 + (rand(Math.floor(x / 23), y) < 0.08 ? 0.25 : 0);
  return tones[Math.min(tones.length - 1, Math.floor(v * 1.8))] as string;
};

const desk = (f: Frame, l: Layout, c: Colors<K>): HTMLCanvasElement => {
  const tones = [mixHex(c.wood, c.light, 0.35), c.wood, c.woodLo, mixHex(c.woodLo, c.ink, 0.45)];
  return pixelLayer(`pet-desk:${l.deskY}:${tones.join('')}`, f.w, f.h - l.deskY, (x, y) => deskTone(x, y + l.deskY, l, tones));
};

const room = (f: Frame, l: Layout, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`pet-room:${sigOf(c)}`, f.w, f.h, (g) => {
    g.drawImage(ditherGradient(f.w, l.deskY, [c.wallLo, c.wall]), 0, 0);
    windowView(g, l, c);
    g.drawImage(desk(f, l, c), 0, l.deskY);
    fillRect(g, c.woodHi, 0, l.deskY, f.w, 1);
    notebook(g, l, c);
  });

const background = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  ctx.drawImage(room(f, l, c), 0, 0);
  if (!isDark(c.sky0)) return;
  ctx.save();
  ctx.translate(l.win.x, l.win.y);
  stars(ctx, l.win.w, l.win.h, f.t, [c.moon], 10, 3);
  ctx.restore();
};

// ---- the notebook, covered in stickers ----

// Stickers with a white die-cut edge: a star, a heart, a strawberry, a ringed planet and a cat face.
const STICKERS: readonly Sprite[] = [
  ['...w...', '..wyw..', 'wwwyyww', 'wyyyyyw', '.wyyyw.', 'wyywyyw', 'ww...ww'],
  ['.ww.ww.', 'wrrwrrw', 'wrrrrrw', 'wrrrrrw', '.wrrrw.', '..wrw..', '...w...'],
  ['..wgw..', '.wgggw.', 'wrrrrrw', 'wrryrrw', 'wryrrrw', '.wrrrw.', '..www..'],
  ['..www..', '.wbbbw.', 'wwwwwww', 'wbbbbbw', 'wwwwwww', '.wbbbw.', '..www..'],
  ['w.....w', 'wpw.wpw', 'wpppppw', 'wpopopw', 'wpppppw', '.wpppw.', '..www..'],
].map((s) => outlined(s, 'o'));

const notebook = (g: Ctx, l: Layout, c: Colors<K>): void => {
  const b = l.book;
  fillRect(g, c.ink, b.x - 1, b.y - 1, b.w + 3, b.h + 3);
  fillRect(g, c.paperLo, b.x + 1, b.y + 1, b.w, b.h);
  fillRect(g, c.accent, b.x, b.y, b.w, b.h);
  fillRect(g, c.shellHi, b.x, b.y, b.w, 2);
  for (let x = b.x + 4; x < b.x + b.w - 2; x += 5) {
    fillRect(g, c.ink, x, b.y - 3, 2, 5);
    fillRect(g, c.metal, x, b.y - 2, 1, 3);
  }
  const palette: Palette = { o: c.ink, y: '#ffd84a', r: '#ff5a6a', g: '#4ac060', w: '#ffffff', b: '#6ab0ff', p: '#ffb0c8' };
  STICKERS.forEach((s, i) => {
    const x = b.x + 5 + Math.round(((i + 0.5) / STICKERS.length) * (b.w - 18) + (rand(i, 11) - 0.5) * 6);
    const y = b.y + 6 + Math.round(rand(i, 12) * (b.h * 0.4));
    drawSprite(g, s, palette, x, y);
  });
  fillRect(g, c.paper, b.x + Math.round(b.w * 0.3), b.y + Math.round(b.h * 0.55), Math.round(b.w * 0.4), 9);
  fillRect(g, c.paperLo, b.x + Math.round(b.w * 0.3) + 3, b.y + Math.round(b.h * 0.55) + 4, Math.round(b.w * 0.3), 1);
  pencil(g, b.x + b.w - 30, b.y + b.h - 10, c);
};

const pencil = (g: Ctx, x: number, y: number, c: Colors<K>): void => {
  for (let k = 0; k < 34; k++) {
    const px = x + k;
    const py = y - Math.round(k * 0.35);
    fillRect(g, c.ink, px, py - 1, 1, 4);
    fillRect(g, k < 4 ? c.paper : k < 30 ? c.btnB : c.accent, px, py, 1, 2);
  }
};

// ---- the device ----

// An egg: narrower at the top, widest a little below the middle.
const eggHalf = (y: number): number => {
  const v = y / EGG_H;
  const k = (v - 0.58) / (v < 0.58 ? 0.58 : 0.42);
  const round = Math.sqrt(Math.max(0, 1 - k * k));
  return (EGG_W / 2) * round * (v < 0.58 ? 0.8 + 0.2 * (v / 0.58) : 1);
};

const shellTone = (x: number, y: number, c: Colors<K>): string => {
  const dx = x - EGG_W / 2;
  if (inEllipse(dx, y, -16, 26, 5, 14) && dx < -12) return c.shellHi;
  if (dx + y * 0.35 > EGG_W * 0.42 + 18 || y > EGG_H - 7) return c.shellLo;
  if (rand(x, y * 13) < 0.015) return c.shellHi;
  return c.shell;
};

const eggRows = (each: (y: number, x0: number, w: number) => void): void => {
  for (let y = 0; y < EGG_H; y++) {
    const half = eggHalf(y + 0.5);
    if (half >= 1) each(y, Math.round(EGG_W / 2 - half), Math.round(half * 2));
  }
};

const eggShell = (c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`pet-egg:${sigOf(c)}`, EGG_W + 2, EGG_H + 2, (g) => {
    eggRows((y, x0, w) => fillRect(g, c.ink, x0, y, w + 2, 3));
    eggRows((y, x0, w) => {
      for (let x = x0 + 1; x < x0 + w; x++) fillRect(g, shellTone(x, y, c), x, y + 1, 1, 1);
    });
    faceplate(g, c);
  });

const LCD_X = 13;
const LCD_Y = 24;
const LCD_W = 48;
const LCD_H = 36;
const PITCH = 2;

const faceplate = (g: Ctx, c: Colors<K>): void => {
  fillRect(g, c.ink, LCD_X - 6, LCD_Y - 9, LCD_W + 12, LCD_H + 18);
  fillRect(g, c.plate, LCD_X - 5, LCD_Y - 8, LCD_W + 10, LCD_H + 16);
  fillRect(g, c.shellHi, LCD_X - 5, LCD_Y - 8, LCD_W + 10, 1);
  fillRect(g, c.ink, LCD_X - 1, LCD_Y - 1, LCD_W + 2, LCD_H + 2);
  fillRect(g, c.lcd, LCD_X, LCD_Y, LCD_W, LCD_H);
  for (let y = 0; y < LCD_H; y += PITCH) for (let x = 0; x < LCD_W; x += PITCH) fillRect(g, c.lcdOff, LCD_X + x + 1, LCD_Y + y + 1, 1, 1);
  for (let i = 0; i < 8; i++) drawSprite(g, ICONS[i % 4] as Sprite, { '#': c.paperLo }, ...iconAt(i));
  for (let k = 0; k < 8; k++) fillRect(g, c.plate, LCD_X + LCD_W - 12 + k, LCD_Y + 1 + k, 1, 1);
  for (let k = 0; k < 5; k++) fillRect(g, c.plate, LCD_X + LCD_W - 7 + k, LCD_Y + 1 + k, 1, 1);
};

const iconAt = (i: number): readonly [number, number] => [LCD_X + 2 + (i % 4) * 12, i < 4 ? LCD_Y - 7 : LCD_Y + LCD_H + 2];

// Printed menu icons above and below the screen: meal, light, game, care (the lower row repeats them).
const ICONS: readonly Sprite[] = [
  ['#.#.#', '#.#.#', '.###.', '..#..', '..#..'],
  ['.###.', '#...#', '.###.', '..#..', '.###.'],
  ['.###.', '#.#.#', '#####', '#.#.#', '.###.'],
  ['.#.#.', '#####', '#####', '.###.', '..#..'],
];

const lcdSprite = (ctx: Ctx, s: Sprite, x0: number, y0: number, lx: number, ly: number, ink: string): void => {
  s.forEach((row, r) => {
    for (let k = 0; k < row.length; k++) if (row[k] === '#') fillRect(ctx, ink, x0 + (lx + k) * PITCH, y0 + (ly + r) * PITCH, PITCH, PITCH);
  });
};

type Show = { readonly sprite: Sprite; readonly x: number; readonly extras: readonly (readonly [Sprite, number, number])[] };

const playShow = (beat: number, at: number): Show => {
  const step = Math.floor(beat);
  const x = 7 + ((step % 6 < 3 ? step % 3 : 3 - (step % 3)) - 1) * 3;
  return { sprite: frac(beat) < 0.3 ? PET_SQUASH : PET_UP, x, extras: at > 10 ? [[HEART, 18, 1]] : [] };
};

const eatShow = (beat: number, at: number): Show => {
  const bites = Math.min(4, Math.floor(at - 12));
  const cookie = COOKIE.map((row, r) => (r < bites ? '.....' : row));
  return { sprite: frac(beat) < 0.5 ? PET_CHOMP : PET_UP, x: 4, extras: bites < 4 ? [[cookie, 16, 11]] : [] };
};

const happyShow = (beat: number): Show => ({
  sprite: PET_HAPPY,
  x: 7,
  extras: [
    [HEART, 2, Math.max(0, 4 - Math.floor(frac(beat) * 4))],
    [HEART, 18, Math.max(0, 5 - Math.floor(frac(beat + 0.5) * 4))],
  ],
});

const sleepShow = (beat: number): Show => ({
  sprite: PET_SLEEP,
  x: 7,
  extras: [
    [ZED, 18, 4 - (Math.floor(beat) % 3)],
    [ZED, 20, 1 + (Math.floor(beat + 1) % 3)],
  ],
});

const showOf = (beat: number): Show => {
  const { act, at } = actOf(beat);
  if (act === 'play') return playShow(beat, at);
  if (act === 'eat') return eatShow(beat, at);
  if (act === 'happy') return happyShow(beat);
  if (act === 'sleep') return sleepShow(beat);
  return { sprite: Math.floor(beat * 2) % 2 === 0 ? PET_UP : PET_HAPPY, x: 7, extras: [] };
};

const screen = (ctx: Ctx, f: Frame, x0: number, y0: number, c: Colors<K>): void => {
  const { act } = actOf(f.beat);
  const dark = act === 'sleep';
  if (dark) fillRect(ctx, c.lcdOn, x0 + LCD_X, y0 + LCD_Y, LCD_W, LCD_H);
  const ink = dark ? c.lcd : c.lcdOn;
  const show = showOf(f.beat);
  lcdSprite(ctx, show.sprite, x0 + LCD_X, y0 + LCD_Y, show.x, 7, ink);
  for (const [s, lx, ly] of show.extras) lcdSprite(ctx, s, x0 + LCD_X, y0 + LCD_Y, lx, ly, ink);
  fillRect(ctx, ink, x0 + LCD_X, y0 + LCD_Y + LCD_H - 3, LCD_W, 1);
  const pick = Math.floor(Math.max(0, f.beat) / 4) % 8;
  const [ix, iy] = iconAt(pick);
  if (frac(f.beat) < 0.6) drawSprite(ctx, ICONS[pick % 4] as Sprite, paletteOf(c, iconColors), x0 + ix, y0 + iy);
};

const iconColors = (c: Colors<K>): Palette => ({ '#': c.lcdOn });

const BUTTONS = [-16, 0, 16] as const;

const buttons = (ctx: Ctx, f: Frame, x0: number, y0: number, c: Colors<K>): void => {
  const pressed = Math.floor(Math.max(0, f.beat)) % 3;
  const colors = [c.btnA, c.btnB, c.btnC];
  BUTTONS.forEach((dx, i) => {
    const down = i === pressed && frac(f.beat) < 0.3 ? 1 : 0;
    const cx = x0 + EGG_W / 2 + dx;
    const cy = y0 + 76 - Math.abs(dx) * 0.15;
    disc(ctx, cx, cy + 1, 5, () => c.ink);
    disc(ctx, cx, cy + down, 4, (dy) => (dy < -1 ? c.shellHi : (colors[i] as string)));
  });
};

const chain = (g: Ctx, x0: number, y0: number, c: Colors<K>): void => {
  disc(g, x0 + EGG_W / 2, y0 - 3, 5, () => c.ink);
  disc(g, x0 + EGG_W / 2, y0 - 3, 4, () => c.metal);
  disc(g, x0 + EGG_W / 2, y0 - 3, 2, () => c.wallLo);
  for (let k = 0; k < 22; k++) {
    const x = x0 + EGG_W / 2 - 6 - k * 2.2;
    const y = y0 - 6 + Math.round(Math.sin((k / 21) * Math.PI) * -6 + k * 1.6);
    fillRect(g, c.ink, Math.round(x) - 1, y - 1, 3, 3);
    fillRect(g, c.metal, Math.round(x), y, 1, 1);
  }
};

const device = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const x0 = l.egg.cx - EGG_W / 2;
  const y0 = l.egg.top;
  fillDither(ctx, c.ink, 0.5, x0 + 8, y0 + EGG_H - 2, EGG_W - 4, 4);
  chain(ctx, x0, y0, c);
  ctx.drawImage(eggShell(c), x0, y0);
  screen(ctx, f, x0, y0, c);
  buttons(ctx, f, x0, y0, c);
};

// ---- the desk calendar and the mug ----

const bigNumber = (ctx: Ctx, text: string, x: number, y: number, color: string): void => {
  forEachTextPixel(text, (px, py) => fillRect(ctx, color, x + px * 2, y + py * 2, 2, 2));
};

const calendar = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const { cal } = layoutOf(f);
  const { day } = actOf(f.beat);
  const date = String(12 + (day % 18));
  fillRect(ctx, c.ink, cal.x - 1, cal.y - 1, 40, 38);
  fillRect(ctx, c.paperLo, cal.x, cal.y + 33, 38, 3);
  fillRect(ctx, c.paper, cal.x, cal.y, 38, 33);
  fillRect(ctx, c.accent, cal.x, cal.y, 38, 9);
  drawText(ctx, 'OCT', cal.x + Math.round((38 - textWidth('OCT')) / 2), cal.y + 1, c.paper);
  bigNumber(ctx, date, cal.x + Math.round((38 - textWidth(date) * 2) / 2), cal.y + 13, c.ink);
  for (let x = cal.x + 4; x < cal.x + 36; x += 6) fillRect(ctx, c.metal, x, cal.y - 2, 2, 3);
};

const mug = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const { mug: m } = layoutOf(f);
  fillRect(ctx, c.ink, m.x - 1, m.y - 17, 20, 19);
  fillRect(ctx, c.btnC, m.x, m.y - 16, 18, 17);
  fillRect(ctx, c.shellHi, m.x + 2, m.y - 14, 2, 12);
  fillRect(ctx, c.woodLo, m.x + 1, m.y - 16, 16, 2);
  disc(ctx, m.x + 21, m.y - 9, 5, () => c.ink);
  disc(ctx, m.x + 21, m.y - 9, 3, () => c.btnC);
  disc(ctx, m.x + 21, m.y - 9, 2, () => c.woodLo);
  smokePlume(ctx, f, m.x + 9, m.y - 18, c.paperLo, 3, 20);
};

// ---- the lamp ----

const lamp = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const { x, y } = l.lamp;
  for (let k = 0; k < 40; k++) fillRect(ctx, c.ink, x - 40 + k, y - 14 + Math.round(k * 0.3), 2, 2);
  for (let r = 0; r < 12; r++) {
    const half = 4 + Math.round(r * 0.9);
    fillRect(ctx, c.ink, x - half - 1, y + r, half * 2 + 2, 1);
    fillRect(ctx, r < 2 ? c.metal : c.btnA, x - half, y + r, half * 2, 1);
  }
  fillRect(ctx, c.light, x - 9, y + 12, 18, 2);
  drawGlow(ctx, c.light, x, y + 14, 14, 6, 0.5 + f.kick * 0.15, 3);
};

const beam = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const top = l.lamp.y + 14;
  const bottom = l.egg.top + EGG_H;
  for (let y = top; y < bottom; y += 1) {
    const k = (y - top) / (bottom - top);
    const cx = l.lamp.x + (l.egg.cx - l.lamp.x) * k;
    const half = 9 + k * (l.wide ? 60 : 50);
    fillDither(ctx, c.light, 0.12 - k * 0.06, cx - half, y, half * 2, 1);
  }
};

const motes = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  for (let i = 0; i < 10; i++) {
    if (Math.sin(f.t * 1.5 + i * 2.3) < 0) continue;
    const k = frac(rand(i, 3) + f.t * 0.02);
    const x = l.lamp.x + (l.egg.cx - l.lamp.x) * k + (rand(i, 4) - 0.5) * 40 * k;
    const y = l.lamp.y + 20 + (l.egg.top - l.lamp.y) * k;
    fillRect(ctx, c.light, Math.round(x), Math.round(y), 1, 1);
  }
};

export const pocketPet = defineScene<K>({
  id: 'pocket-pet',
  title: 'Pocket Pet',
  mood: { valence: 0.6, energy: 0.1 },
  styles: ['nineties-pop', 'lofi-loop', 'puzzle-pop', 'technopop', 'kawaii-pop'],
  variants: [
    {
      mood: { valence: 0.6, energy: 0.1 },
      colors: {
        wall: '#3a3462',
        wallLo: '#1e1c3a',
        sky0: '#0e1236',
        sky1: '#2a3470',
        moon: '#fff2c4',
        wood: '#a8683e',
        woodLo: '#6a3e28',
        woodHi: '#e0a070',
        light: '#ffd68a',
        shell: '#ff8ab8',
        shellHi: '#ffd4e6',
        shellLo: '#c8508a',
        plate: '#fff4f0',
        lcd: '#b4c89a',
        lcdOn: '#28342a',
        lcdOff: '#a6ba8e',
        btnA: '#ffd84a',
        btnB: '#6ab4ff',
        btnC: '#7ad0a0',
        paper: '#fff8ec',
        paperLo: '#c8b8b0',
        accent: '#e85a6a',
        metal: '#d0d4e0',
        ink: '#160e1e',
      },
    },
    {
      mood: { valence: 0.15, energy: -0.5 },
      colors: {
        wall: '#1e2a4a',
        wallLo: '#0c1226',
        sky0: '#060a1e',
        sky1: '#141e44',
        moon: '#e8eeff',
        wood: '#5a4a5a',
        woodLo: '#34283a',
        woodHi: '#8a7a8a',
        light: '#ffc878',
        shell: '#7ad8c4',
        shellHi: '#d0fff4',
        shellLo: '#3a9a8e',
        plate: '#eef8f6',
        lcd: '#a8bc96',
        lcdOn: '#1e2a24',
        lcdOff: '#9cb08a',
        btnA: '#ff8aa8',
        btnB: '#ffd06a',
        btnC: '#a89aff',
        paper: '#e8e4f0',
        paperLo: '#8a86a0',
        accent: '#6a7ad8',
        metal: '#b8bcd0',
        ink: '#06080e',
      },
    },
    {
      mood: { valence: 0.75, energy: 0.5 },
      colors: {
        wall: '#ffe4c4',
        wallLo: '#f0c8a8',
        sky0: '#4aa8ff',
        sky1: '#b8e4ff',
        moon: '#ffffff',
        wood: '#e0a868',
        woodLo: '#b47a48',
        woodHi: '#fff0c8',
        light: '#ffe2a8',
        shell: '#b48aff',
        shellHi: '#ece0ff',
        shellLo: '#7a5ad0',
        plate: '#ffffff',
        lcd: '#c0d4a4',
        lcdOn: '#2a3a2a',
        lcdOff: '#b2c696',
        btnA: '#ff6a8a',
        btnB: '#ffd23a',
        btnC: '#4ac8e0',
        paper: '#ffffff',
        paperLo: '#d0c4c0',
        accent: '#ff8a5a',
        metal: '#e0e4ec',
        ink: '#2a1a2a',
      },
    },
  ],
  layers: [background, beam, calendar, device, mug, lamp, motes],
});
