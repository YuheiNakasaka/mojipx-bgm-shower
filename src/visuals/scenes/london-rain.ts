// The clock tower by the Thames in the rain: a lit clock whose minute hand ticks on the beat, the gothic palace along
// the river, lamps and umbrellas on the embankment, a red double-decker passing and a red phone box glowing.
import { type Ctx, drawSprite, fillRect, type Sprite } from 'mojipx';
import { disc, ditherGradient, pixelLine, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { drawGlow, paletteBy, wrap } from './batch-1-helpers.ts';
import { frameLayer, glints, lightStreak, mirrorWater, rain, rainRings, wideOf } from './batch-6-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sky3'
  | 'cloud'
  | 'stone'
  | 'stoneLo'
  | 'roof'
  | 'gold'
  | 'face'
  | 'win'
  | 'lit'
  | 'glow'
  | 'water0'
  | 'water1'
  | 'red'
  | 'redLo'
  | 'dark'
  | 'pave'
  | 'paveLo'
  | 'drop'
  | 'skin';

// A double-decker heading left: r/R red body, w lit windows, p passengers, l lamps and the blank destination blind, k tyres.
const BUS: Sprite = [
  '..rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr..',
  '.rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr.',
  'rrwwwwwrwwwwwwrwwwwwwrwwwwwwrwwwwwwrwwwwwwrwwwwwrr',
  'rrwwpwwrwwwpwwrwwwwwwrwwpwwwrwwwwwwrwwwpwwrwwwwwrr',
  'rrwppwwrwwppwwrwwwwwwrwppwwwrwwwwwwrwwppwwrwwwwwrr',
  'rrwwwwwrwwwwwwrwwwwwwrwwwwwwrwwwwwwrwwwwwwrwwwwwrr',
  'rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
  'rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
  'rllllrrwwwwwwrwwwwwwrwwwwwwrwwwwwwrwwwwwwrwwwwwwrr',
  'rwwwwrrwwpwwwrwwwwwwrwwpwwwrwwwwwwrwwpwwwrwwwwwwrr',
  'rwwwwrrwppwwwrwwwwwwrwppwwwrwwwwwwrwppwwwrwwwwwwrr',
  'rwwwwrrwwwwwwrwwwwwwrwwwwwwrwwwwwwrwwwwwwrwwwwwwrr',
  'rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
  'lrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
  '.RRRkkkkkRRRRRRRRRRRRRRRRRRRRRRRRRRRRRkkkkkRRRRRR.',
  '...kkkkkkk..........................kkkkkkk.......',
  '...kkkRkkk..........................kkkRkkk.......',
  '....kkkkk............................kkkkk........',
];

// A red phone box: domed roof, a lit (blank) sign band, and small glazed panes.
const BOX: Sprite = [
  '....rrrr....',
  '..rrrrrrrr..',
  '.rrRRRRRRrr.',
  '.rllllllllr.',
  'rrrrrrrrrrrr',
  'rrwwrwwrwwrr',
  'rrwwrwwrwwrr',
  'rrrrrrrrrrrr',
  'rrwwrwwrwwrr',
  'rrwwrwwrwwrr',
  'rrrrrrrrrrrr',
  'rrwwrwwrwwrr',
  'rrwwrwwrwwrr',
  'rrrrrrrrrrrr',
  'rrwwrwwrwwrr',
  'rrwwrwwrwwrr',
  'rrrrrrrrrrrr',
  'rrwwrwwrwwrr',
  'rrwwrwwrwwrr',
  'rrrrrrrrrrrr',
  'rRRRRRRRRRRr',
  'rRRRRRRRRRRr',
  'RRRRRRRRRRRR',
];

// Someone under an umbrella: u canopy, U its sheen, h head, k handle and legs, c coat; two steps.
const WALK_A: Sprite = [
  '...uuu...',
  '.uuUuuuu.',
  'uuUuuuuuu',
  'u.u.k.u.u',
  '....k....',
  '...hhk...',
  '...hhk...',
  '..cccc...',
  '..ccccc..',
  '..cccc...',
  '..cccc...',
  '..cccc...',
  '...kk....',
  '..k..k...',
  '..k..k...',
];
const WALK_B: Sprite = [...WALK_A.slice(0, 13), '...kk....', '...kk....'];

const busPalette = paletteBy<K>((c) => ({ r: c.red, R: c.redLo, w: c.lit, p: c.dark, l: c.face, k: c.dark }));
const boxPalette = paletteBy<K>((c) => ({ r: c.red, R: c.redLo, w: c.lit, l: c.face }));
const walkers = [
  paletteBy<K>((c) => ({ u: c.dark, U: c.roof, h: c.skin, k: c.dark, c: c.stoneLo })),
  paletteBy<K>((c) => ({ u: c.red, U: c.face, h: c.skin, k: c.dark, c: c.roof })),
  paletteBy<K>((c) => ({ u: c.gold, U: c.face, h: c.skin, k: c.dark, c: c.redLo })),
  paletteBy<K>((c) => ({ u: c.roof, U: c.sky3, h: c.skin, k: c.dark, c: c.dark })),
];

// ---- layout ----

const waterOf = (f: Frame): number => Math.round(f.h * (wideOf(f) ? 0.62 : 0.6));
const parapetOf = (f: Frame): number => Math.round(f.h * (wideOf(f) ? 0.8 : 0.84));
const roadOf = (f: Frame): number => Math.round(f.h * (wideOf(f) ? 0.98 : 0.955));
const lampXs = (f: Frame): readonly number[] => {
  const gap = wideOf(f) ? 92 : 98;
  return Array.from({ length: Math.ceil(f.w / gap) }, (_, i) => Math.round(gap * 0.3 + i * gap));
};

type Tower = { readonly cx: number; readonly top: number; readonly h: number; readonly half: number };

const towerOf = (f: Frame): Tower => {
  const top = Math.round(f.h * (wideOf(f) ? 0.05 : 0.1));
  const h = waterOf(f) - top;
  return { cx: Math.round(f.w * (wideOf(f) ? 0.68 : 0.58)), top, h, half: Math.round(h * 0.085) };
};

// The clock face's centre and radius.
const clockOf = (t: Tower): readonly [number, number, number] => [t.cx, Math.round(t.top + t.h * 0.31), Math.round(t.half * 0.8)];

// ---- sky ----

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const wl = waterOf(f);
  ctx.drawImage(ditherGradient(f.w, wl, [c.sky0, c.sky1, c.sky2, c.sky3]), 0, 0);
  // Low, heavy cloud dragging across.
  for (let i = 0; i < 7; i++) {
    const len = 50 + Math.round(rand(i, 3) * 90);
    const x = Math.round(wrap(rand(i, 4) * (f.w + len) - f.t * (2 + rand(i, 5) * 2), f.w + len) - len);
    const y = Math.round(wl * (0.06 + rand(i, 6) * 0.5));
    const thick = 2 + Math.floor(rand(i, 7) * 4);
    fillRect(ctx, c.cloud, x, y, len, thick);
    fillRect(ctx, c.cloud, x + Math.round(len * 0.2), y - 2, Math.round(len * 0.5), 2);
    fillRect(ctx, c.sky2, x + 4, y + thick, len - 8, 1);
  }
};

// ---- the palace and the clock tower ----

const paintBays = (g: Ctx, c: Colors<K>, x0: number, x1: number, roof: number, wl: number): void => {
  fillRect(g, c.stone, x0, roof, x1 - x0, wl - roof);
  for (let x = x0 + 1; x < x1 - 1; x += 4) {
    fillRect(g, c.stoneLo, x + 3, roof + 2, 1, wl - roof - 4);
    for (let y = roof + 3; y < wl - 4; y += 5) fillRect(g, rand(x, y) < 0.3 ? c.lit : c.win, x + 1, y, 2, 3);
  }
  fillRect(g, c.roof, x0, roof - 3, x1 - x0, 3);
  for (let x = x0 + 2; x < x1; x += 6) {
    fillRect(g, c.stone, x, roof - 7, 1, 5);
    fillRect(g, c.gold, x, roof - 8, 1, 1);
  }
  fillRect(g, c.stoneLo, x0, wl - 2, x1 - x0, 2);
};

// A square tower with corner pinnacles and a pyramid cap, rising from the palace roof.
const paintTurret = (g: Ctx, c: Colors<K>, x: number, w: number, top: number, wl: number): void => {
  fillRect(g, c.stone, x, top, w, wl - top);
  for (let k = x + 2; k < x + w - 1; k += 3) fillRect(g, c.stoneLo, k, top + 2, 1, wl - top - 2);
  for (let y = top + 4; y < wl - 6; y += 10) fillRect(g, c.win, x + Math.floor(w / 2) - 1, y, 2, 6);
  fillRect(g, c.stoneLo, x + w - 1, top, 1, wl - top);
  fillRect(g, c.gold, x, top, w, 1);
  for (let r = 0; r < Math.ceil(w / 2); r++) fillRect(g, c.roof, x + r, top - Math.ceil(w / 2) + r, w - r * 2, 1);
  fillRect(g, c.stone, x, top - 5, 1, 5);
  fillRect(g, c.stone, x + w - 1, top - 5, 1, 5);
  fillRect(g, c.gold, x + Math.floor(w / 2), top - Math.ceil(w / 2) - 3, 1, 3);
};

// The clock tower as rows: a gilded spire, the belfry, the clock stage, then the long paneled shaft.
const paintSpire = (g: Ctx, c: Colors<K>, t: Tower): void => {
  const spireTop = t.top + Math.round(t.h * 0.03);
  const spireBase = t.top + Math.round(t.h * 0.19);
  fillRect(g, c.gold, t.cx, t.top, 1, spireTop - t.top);
  for (let y = spireTop; y < spireBase; y++) {
    const half = Math.round(((y - spireTop) / (spireBase - spireTop)) * t.half * 0.75);
    fillRect(g, c.roof, t.cx - half, y, half * 2 + 1, 1);
    fillRect(g, c.gold, t.cx - half, y, 1, 1);
    fillRect(g, c.gold, t.cx + half, y, 1, 1);
  }
  for (let k = -1; k <= 1; k += 2) fillRect(g, c.gold, t.cx + k * Math.round(t.half * 0.85), spireBase - 6, 1, 6);
};

const paintBelfry = (g: Ctx, c: Colors<K>, t: Tower): void => {
  const y0 = t.top + Math.round(t.h * 0.19);
  const y1 = t.top + Math.round(t.h * 0.25);
  const half = Math.round(t.half * 0.9);
  fillRect(g, c.stone, t.cx - half, y0, half * 2 + 1, y1 - y0);
  for (let x = t.cx - half + 1; x < t.cx + half; x += 3) fillRect(g, c.dark, x, y0 + 2, 2, y1 - y0 - 3);
  fillRect(g, c.gold, t.cx - half, y0, half * 2 + 1, 1);
};

const paintClockStage = (g: Ctx, c: Colors<K>, t: Tower): void => {
  const y0 = t.top + Math.round(t.h * 0.25);
  const y1 = t.top + Math.round(t.h * 0.39);
  fillRect(g, c.stone, t.cx - t.half, y0, t.half * 2 + 1, y1 - y0);
  fillRect(g, c.stoneLo, t.cx + t.half - 1, y0, 2, y1 - y0);
  for (const dx of [-t.half, t.half]) fillRect(g, c.gold, t.cx + dx, y0 - 3, 1, 3);
  const [kx, ky, kr] = clockOf(t);
  disc(g, kx, ky, kr + 1, () => c.gold);
  disc(g, kx, ky, kr, () => c.face);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    fillRect(g, c.stoneLo, Math.round(kx + Math.cos(a) * (kr - 1)), Math.round(ky + Math.sin(a) * (kr - 1)), 1, 1);
  }
};

const paintShaft = (g: Ctx, c: Colors<K>, t: Tower, wl: number): void => {
  const y0 = t.top + Math.round(t.h * 0.39);
  const half = Math.round(t.half * 0.82);
  fillRect(g, c.stone, t.cx - half, y0, half * 2 + 1, wl - y0);
  for (let x = t.cx - half + 2; x < t.cx + half - 1; x += 3) fillRect(g, c.stoneLo, x, y0 + 2, 1, wl - y0 - 2);
  for (let y = y0 + 6; y < wl - 4; y += 9) fillRect(g, c.win, t.cx - 1, y, 3, 4);
  fillRect(g, c.stoneLo, t.cx + half - 1, y0, 2, wl - y0);
  fillRect(g, c.gold, t.cx - half, y0, half * 2 + 1, 1);
};

const paintPalace = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const wl = waterOf(f);
  const t = towerOf(f);
  const s = wideOf(f) ? 1 : 1.4;
  const roof = wl - Math.round(24 * s);
  paintBays(g, c, 0, t.cx - t.half - 1, roof, wl);
  paintBays(g, c, t.cx + t.half, Math.round(f.w * (wideOf(f) ? 0.86 : 1)), roof + 6, wl);
  paintTurret(g, c, Math.round(f.w * 0.04), Math.round(16 * s), wl - Math.round(62 * s), wl);
  paintTurret(g, c, Math.round(f.w * 0.3), Math.round(7 * s), roof - Math.round(16 * s), wl);
  paintTurret(g, c, Math.round(f.w * 0.48), Math.round(6 * s), roof - Math.round(10 * s), wl);
};

const townLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('london-town', f, c, (g) => {
    const t = towerOf(f);
    paintPalace(g, f, c);
    paintShaft(g, c, t, waterOf(f));
    paintClockStage(g, c, t);
    paintBelfry(g, c, t);
    paintSpire(g, c, t);
  });

// The hands: the minute hand ticks one minute per beat, the hour hand creeps along with it.
const hands = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const [kx, ky, kr] = clockOf(towerOf(f));
  const minutes = 50 + Math.floor(f.beat);
  const m = (minutes / 60) * Math.PI * 2 - Math.PI / 2;
  const h = ((5 + minutes / 60) / 12) * Math.PI * 2 - Math.PI / 2;
  pixelLine(ctx, kx, ky, kx + Math.cos(h) * kr * 0.5, ky + Math.sin(h) * kr * 0.5, c.dark);
  pixelLine(ctx, kx, ky, kx + Math.cos(m) * (kr - 1), ky + Math.sin(m) * (kr - 1), c.dark);
};

const town = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const [kx, ky, kr] = clockOf(towerOf(f));
  // The face glows a little brighter as each bar begins, like a chime.
  drawGlow(ctx, c.glow, kx, ky, kr * 3, kr * 3, Math.floor(f.beat) % 4 === 0 ? 0.55 : 0.35);
  ctx.drawImage(townLayer(f, c), 0, 0);
  hands(ctx, f, c);
};

// ---- the river ----

const river = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const wl = waterOf(f);
  const bottom = parapetOf(f);
  mirrorWater(ctx, f, { axis: wl, bottom, squash: 1.6, amp: 1.5, freq: 1.1, speed: 2.6, tint: c.water0, tintLevel: 0.45 });
  glints(ctx, f, wl + 2, bottom, c.water1, Math.round(f.w / 5), 21);
  rainRings(ctx, f, wl + 2, bottom, c.water1, Math.round(10 + f.energy * 10), 22);
};

// ---- the embankment ----

const paintParapet = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const top = parapetOf(f);
  fillRect(g, c.stoneLo, 0, top, f.w, 6);
  fillRect(g, c.stone, 0, top, f.w, 2);
  for (let x = 1; x < f.w; x += 4) fillRect(g, c.paveLo, x, top + 3, 2, 3);
  g.drawImage(ditherGradient(f.w, f.h - top - 6, [c.paveLo, c.pave, c.pave]), 0, top + 6);
  fillRect(g, c.paveLo, 0, roadOf(f) - 1, f.w, 1);
  for (const x of lampXs(f)) {
    const lampTop = Math.round(f.h * (wideOf(f) ? 0.52 : 0.62));
    fillRect(g, c.dark, x - 1, lampTop + 6, 2, top - lampTop);
    fillRect(g, c.dark, x - 2, top - 3, 4, 3);
    fillRect(g, c.dark, x - 2, lampTop - 2, 5, 9);
    fillRect(g, c.face, x - 1, lampTop, 3, 5);
    fillRect(g, c.dark, x - 1, lampTop - 4, 3, 2);
  }
};

const embankmentLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement => frameLayer('london-embankment', f, c, (g) => paintParapet(g, f, c));

const embankment = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const lampTop = Math.round(f.h * (wideOf(f) ? 0.52 : 0.62));
  for (const x of lampXs(f)) drawGlow(ctx, c.glow, x, lampTop + 2, 14, 12, f.kick > 0.6 ? 0.7 : 0.5);
  ctx.drawImage(embankmentLayer(f, c), 0, 0);
  const top = parapetOf(f) + 7;
  for (const x of lampXs(f)) lightStreak(ctx, f, x, top, f.h - top, c.glow);
};

// The bus comes by every so often, its lights smeared on the wet road beneath it.
const bus = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const len = BUS[0]?.length ?? 0;
  const x = Math.round(f.w + 20 - wrap(f.t * 34 + f.w * 0.5, f.w + len + 260));
  if (x > f.w || x + len < 0) return;
  const base = roadOf(f);
  ctx.save();
  ctx.globalAlpha = 0.3;
  fillRect(ctx, c.red, x + 2, base, len - 4, 3);
  ctx.restore();
  drawGlow(ctx, c.face, x - 2, base - 6, 4, 3, 0.6);
  drawSprite(ctx, BUS, busPalette(c), x, base - BUS.length);
};

const phoneBox = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const x = Math.round(f.w * (wideOf(f) ? 0.9 : 0.8));
  const base = f.h - 1;
  drawGlow(ctx, c.lit, x + 6, base - 12, 12, 14, 0.4);
  drawSprite(ctx, BOX, boxPalette(c), x, base - BOX.length);
};

// People walking both ways along the near pavement, stepping on the beat.
const umbrellas = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const span = f.w + 30;
  walkers.forEach((palette, i) => {
    const dir = i % 2 === 0 ? 1 : -1;
    const x = wrap(rand(i, 41) * span + dir * f.t * (6 + i * 2), span) - 15;
    const step = (Math.floor(f.beat) + i) % 2 === 0 ? WALK_A : WALK_B;
    drawSprite(ctx, step, palette(c), Math.round(x), f.h - WALK_A.length + 2 - (i % 2) * 2);
  });
};

const weather = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const count = Math.round(((f.w * f.h) / 200) * (0.6 + f.energy * 0.6));
  rain(ctx, f, c.drop, { count, len: 4, slant: -0.25, speed: 150, seed: 9 });
  rainRings(ctx, f, parapetOf(f) + 8, f.h, c.drop, 8, 23);
};

export const londonRain = defineScene<K>({
  id: 'london-rain',
  title: 'London Drizzle',
  mood: { valence: -0.3, energy: -0.3 },
  styles: ['lofi-loop', 'city-lights', 'nineties-pop', 'showa-ballad', 'bossa-cafe'],
  variants: [
    {
      // A grey afternoon drizzle.
      mood: { valence: -0.2, energy: -0.45 },
      colors: {
        sky0: '#56606e',
        sky1: '#78808c',
        sky2: '#98a0aa',
        sky3: '#b8bcc0',
        cloud: '#646c7a',
        stone: '#c8b48a',
        stoneLo: '#8a7a62',
        roof: '#4a5a6a',
        gold: '#d8b860',
        face: '#f0ead8',
        win: '#4a5262',
        lit: '#ffd88a',
        glow: '#ffd88a',
        water0: '#3a4652',
        water1: '#9aa6b2',
        red: '#c8282e',
        redLo: '#8a1a22',
        dark: '#1c2028',
        pave: '#4a4e58',
        paveLo: '#3a3e48',
        drop: '#c0c8d4',
        skin: '#e8c0a0',
      },
    },
    {
      // A wet night: the palace floodlit gold, the clock glowing.
      mood: { valence: -0.55, energy: 0 },
      colors: {
        sky0: '#080c1a',
        sky1: '#121a2e',
        sky2: '#1e263c',
        sky3: '#2c3248',
        cloud: '#161c30',
        stone: '#d0a056',
        stoneLo: '#84592c',
        roof: '#2a3040',
        gold: '#ffd070',
        face: '#fff4c8',
        win: '#2a2430',
        lit: '#ffcc66',
        glow: '#ffb050',
        water0: '#060a16',
        water1: '#4a5470',
        red: '#c0202a',
        redLo: '#701018',
        dark: '#06080e',
        pave: '#1c2030',
        paveLo: '#141824',
        drop: '#8a96b0',
        skin: '#c8a088',
      },
    },
    {
      // The rain easing at dusk, a pink break low in the west.
      mood: { valence: 0.15, energy: 0.3 },
      colors: {
        sky0: '#3a3e5a',
        sky1: '#6a5a78',
        sky2: '#c07a7a',
        sky3: '#f0b080',
        cloud: '#4a4a66',
        stone: '#e0b47a',
        stoneLo: '#9a6e52',
        roof: '#3e4258',
        gold: '#ffd27a',
        face: '#fff0c0',
        win: '#3a3040',
        lit: '#ffd27a',
        glow: '#ffb860',
        water0: '#2a2a44',
        water1: '#d0947a',
        red: '#d02a30',
        redLo: '#801a24',
        dark: '#14141e',
        pave: '#3a3848',
        paveLo: '#2a2836',
        drop: '#c8bccc',
        skin: '#f0c0a0',
      },
    },
  ],
  layers: [sky, town, river, embankment, bus, umbrellas, phoneBox, weather],
});
