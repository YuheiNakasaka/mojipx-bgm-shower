// A canal through an entertainment district at night, seen from a bridge: neon signs crowd both banks and flicker on
// the beat, their colours wobble in the water, a tour boat glides toward us and people stream over the next bridge.
import { type Ctx, fillRect } from 'mojipx';
import { bayer, disc, ditherGradient, frac, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { colorKey, drawGlow, wrap } from './batch-1-helpers.ts';
import { memoLayer } from './batch-2-helpers.ts';
import { isWide, pixelLayer, shine } from './batch-5-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'glow'
  | 'wall0'
  | 'wall1'
  | 'win'
  | 'winCool'
  | 'shop'
  | 'water0'
  | 'water1'
  | 'ripple'
  | 'prom'
  | 'ink'
  | 'neonA'
  | 'neonB'
  | 'neonC'
  | 'neonD'
  | 'red'
  | 'paper'
  | 'white'
  | 'boat'
  | 'boatLit';

// ---- one-point perspective along the canal: x across, y up from the water, z away from the bridge we stand on ----

const EYE = 0.9;
const WALL = 1.35;
const BANK = 1;
const PROM = 0.12;
const END = 24;
const BRIDGE = 8;

type View = { readonly cx: number; readonly vy: number; readonly F: number; readonly w: number; readonly h: number };

const viewOf = (f: Frame): View => ({
  cx: Math.round(f.w / 2),
  vy: Math.round(f.h * (isWide(f) ? 0.45 : 0.44)),
  F: Math.round(isWide(f) ? f.w * 0.47 : f.w * 0.62),
  w: f.w,
  h: f.h,
});

const sx = (v: View, x: number, z: number): number => v.cx + (x * v.F) / z;
const sy = (v: View, y: number, z: number): number => v.vy - ((y - EYE) * v.F) / z;

// ---- the street canyon, painted once ----

const heightAt = (z: number, side: number): number => 2.6 + rand(Math.floor(z / 1.3), side > 0 ? 3 : 4) * 2.6;

// Shopfronts at street level: lit windows of different colours between dark pillars, under a strip of awning.
const storefront = (c: Colors<K>, z: number, y: number, side: number): string => {
  const unit = Math.floor(z / 0.55);
  const across = frac(z / 0.55);
  if (across < 0.12 || y > 0.54) return y > 0.54 && y < 0.6 ? c.wall1 : c.ink;
  if (y < 0.22 || Math.abs(y - 0.4) < 0.015 || Math.abs(across - 0.56) < 0.02) return c.ink;
  const tones = [c.shop, c.win, c.wall1, c.winCool, c.shop];
  return tones[Math.floor(rand(unit, side > 0 ? 7 : 8) * tones.length)] as string;
};

// A facade seen at depth z and height y: storefronts glow at the bottom, windows above.
const facade = (c: Colors<K>, z: number, y: number, side: number, px: number, py: number): string => {
  const seg = Math.floor(z / 1.3);
  if (y < 0.62) return storefront(c, z, y, side);
  const col = frac(z / 0.42);
  const row = frac(y / 0.42);
  const base = seg % 2 === 0 ? c.wall0 : c.wall1;
  if (col < 0.2 || col > 0.62 || row < 0.3 || row > 0.75) return base;
  const r = rand(Math.floor(z / 0.42) * 7 + side, Math.floor(y / 0.42));
  if (r < 0.3) return r < 0.2 ? c.win : c.winCool;
  return bayer(px, py) < 0.5 ? base : c.ink;
};

const farEnd = (v: View, c: Colors<K>, x: number, y: number): string | null => {
  const top = sy(v, 3.4 + rand(Math.floor((x - v.cx) / 4), 9) * 1.5, END);
  if (y < top) return null;
  if (y > sy(v, 0.6, END)) return c.shop;
  return rand(x * 3 + y * 7, 13) < 0.25 ? c.win : c.wall0;
};

const wallPick = (v: View, c: Colors<K>, x: number, y: number, zw: number): string | null => {
  const side = x < v.cx ? -1 : 1;
  if (y < sy(v, heightAt(zw, side), zw)) return null;
  return facade(c, zw, EYE - ((y - v.vy) * zw) / v.F, side, x, y);
};

// Each pixel is the facade of whichever wall the column meets, the far end, the promenade along the bank, or open.
const sidePick = (v: View, c: Colors<K>, x: number, y: number): string | null => {
  const dx = Math.abs(x + 0.5 - v.cx);
  const zw = (WALL * v.F) / dx;
  if (zw > END && y < sy(v, 0, END)) return farEnd(v, c, x, y);
  if (zw <= END && y < sy(v, PROM, zw)) return wallPick(v, c, x, y, zw);
  if (y <= v.vy) return null;
  return bankPick(v, c, dx, y);
};

// The promenade along each bank, with a railing along its edge and posts every few paces.
const bankPick = (v: View, c: Colors<K>, dx: number, y: number): string | null => {
  const zr = (BANK * v.F) / dx;
  const rail = sy(v, 0.5, zr);
  if (Math.abs(y - rail) < 0.6 || (y > rail && y < sy(v, PROM, zr) && frac(zr / 0.8) < 0.08)) return c.ink;
  const across = (dx * (EYE - PROM)) / (y - v.vy);
  return across > BANK ? c.prom : null;
};

const canyonLayer = (f: Frame, v: View, c: Colors<K>): HTMLCanvasElement =>
  pixelLayer(`canal-canyon:${colorKey(c)}:${v.vy}:${v.F}`, f.w, f.h, (x, y) => sidePick(v, c, x, y));

// ---- signs: every one stands out from a wall and faces us ----

type Kind = 'glyphs' | 'word' | 'lanterns' | 'chase';
type Sign = {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly z: number;
  readonly kind: Kind;
  readonly color: string;
  readonly seed: number;
};

const KINDS: readonly Kind[] = ['glyphs', 'word', 'lanterns', 'glyphs', 'chase', 'word', 'glyphs'];

const signOf = (v: View, c: Colors<K>, k: number): Sign => {
  const z = 1.45 * 1.2 ** Math.floor(k / 2);
  const side = k % 2 === 0 ? -1 : 1;
  const reach = WALL - 0.3 - rand(k, 1) * 0.18;
  const low = 0.95 + rand(k, 2) * 0.5;
  const high = low + 1 + rand(k, 3) * 0.9;
  const a = sx(v, side * WALL, z);
  const b = sx(v, side * reach, z);
  const colors = [c.neonA, c.neonB, c.neonC, c.neonD, c.red];
  return {
    x: Math.round(Math.min(a, b)),
    y: Math.round(sy(v, high, z)),
    w: Math.max(2, Math.round(Math.abs(b - a))),
    h: Math.max(3, Math.round(sy(v, low, z) - sy(v, high, z))),
    z,
    kind: KINDS[k % KINDS.length] as Kind,
    color: colors[Math.floor(rand(k, 4) * colors.length)] as string,
    seed: k,
  };
};

const signsOf = (v: View, c: Colors<K>): readonly Sign[] => Array.from({ length: 26 }, (_, k) => signOf(v, c, k));

// Letters for the few plain words; the rest of the lettering is invented.
const FONT: Readonly<Record<string, readonly string[]>> = {
  O: ['###', '#.#', '#.#', '#.#', '###'],
  P: ['##.', '#.#', '##.', '#..', '#..'],
  E: ['###', '#..', '##.', '#..', '###'],
  N: ['#.#', '###', '###', '#.#', '#.#'],
  B: ['##.', '#.#', '##.', '#.#', '##.'],
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'],
  S: ['.##', '#..', '.#.', '..#', '##.'],
  K: ['#.#', '#.#', '##.', '#.#', '#.#'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'],
};
const WORDS = ['OPEN', 'BAR', 'SAKE', 'EAT'] as const;

const letter = (g: Ctx, ch: string, x: number, y: number, color: string): void => {
  (FONT[ch] ?? []).forEach((row, r) => {
    for (let k = 0; k < 3; k++) if (row[k] === '#') fillRect(g, color, x + k, y + r, 1, 1);
  });
};

// A made-up character: a few strokes across and down a small cell.
const glyph = (g: Ctx, x: number, y: number, size: number, seed: number, color: string): void => {
  for (let r = 0; r < size; r += 2) if (rand(seed, r) < 0.55) fillRect(g, color, x, y + r, size, 1);
  for (let k = 0; k < size; k += 2) if (rand(seed, k + 20) < 0.5) fillRect(g, color, x + k, y, 1, size);
};

const signBody = (g: Ctx, s: Sign, c: Colors<K>): void => {
  const inner = { x: s.x + 1, y: s.y + 1, w: s.w - 2, h: s.h - 2 };
  if (s.kind === 'lanterns') {
    const size = Math.max(2, Math.min(inner.w, Math.round(inner.h / 4)));
    for (let y = s.y; y + size <= s.y + s.h; y += size + 1) {
      fillRect(g, c.red, s.x + Math.round((s.w - size) / 2), y, size, size);
      fillRect(g, c.paper, s.x + Math.round((s.w - size) / 2), y + Math.floor(size / 2), size, 1);
    }
    return;
  }
  fillRect(g, s.color, s.x, s.y, s.w, s.h);
  fillRect(g, c.ink, inner.x, inner.y, inner.w, inner.h);
  const word = WORDS[s.seed % WORDS.length] as string;
  if (s.kind === 'word' && inner.w >= 5 && inner.h >= word.length * 6 + 2) {
    for (const [i, ch] of [...word].entries()) letter(g, ch, inner.x + Math.floor((inner.w - 3) / 2), inner.y + 2 + i * 6, c.white);
    return;
  }
  const size = Math.max(1, Math.min(inner.w - 2, 7));
  for (let y = inner.y + 1, i = 0; y + size <= inner.y + inner.h - 1; y += size + 2, i++)
    glyph(g, inner.x + Math.floor((inner.w - size) / 2), y, size, s.seed * 13 + i, i % 3 === 2 ? s.color : c.white);
};

const signsLayer = (f: Frame, v: View, c: Colors<K>, near: boolean): HTMLCanvasElement =>
  memoLayer(`canal-signs:${colorKey(c)}:${v.vy}:${v.F}:${near}`, f.w, f.h, (g) => {
    const list = signsOf(v, c).filter((s) => s.z <= BRIDGE === near);
    for (const s of [...list].reverse()) signBody(g, s, c);
  });

// Bulbs run up one edge of a marquee sign and down the other, a step every half beat.
const chase = (ctx: Ctx, f: Frame, s: Sign, c: Colors<K>): void => {
  for (let k = 0; k < s.h; k += 2) {
    const color = (k / 2 + Math.floor(f.beat * 2)) % 3 === 0 ? c.white : s.color;
    fillRect(ctx, color, s.x, s.y + k, 1, 1);
    fillRect(ctx, color, s.x + s.w - 1, s.y + s.h - 1 - k, 1, 1);
  }
};

// On the beat a sign or two blinks out, and the chase lights step along.
const signLife = (ctx: Ctx, f: Frame, v: View, c: Colors<K>, near: boolean): void => {
  const beat = Math.floor(f.beat);
  for (const s of signsOf(v, c)) {
    if (s.z <= BRIDGE !== near) continue;
    if (s.kind !== 'lanterns' && rand(s.seed, beat) < 0.07) fillRect(ctx, c.ink, s.x, s.y, s.w, s.h);
    else if (s.kind === 'chase' && s.w >= 4) chase(ctx, f, s, c);
  }
};

// ---- the water ----

const waterTop = (v: View, z: number): number => sy(v, 0, z);

// The sky, and the water with every sign's colour trembling in it; the walls are drawn over the edges afterwards.
const water = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const v = viewOf(f);
  ctx.drawImage(ditherGradient(f.w, v.vy + 4, [c.sky0, c.sky1, c.glow]), 0, 0);
  ctx.drawImage(ditherGradient(f.w, f.h - v.vy, [c.water1, c.water0, c.water0]), 0, v.vy);
  for (let i = 0; i < Math.round(f.w / 4); i++) {
    const d = rand(i, 31) ** 1.6;
    const y = Math.round(v.vy + 2 + d * (f.h - v.vy - 2));
    const x = wrap(rand(i, 32) * f.w + f.t * (1 + d * 4) * (i % 2 === 0 ? 1 : -1), f.w);
    fillRect(ctx, c.ripple, Math.round(x), y, 2 + Math.round(d * 8), 1);
  }
  for (const s of signsOf(v, c)) {
    const top = Math.round(waterTop(v, s.z)) + 1;
    shine(ctx, f, s.x + 1, Math.max(1, s.w - 2), top, Math.round(s.h * 1.3), s.kind === 'lanterns' ? c.red : s.color);
  }
  // The lit shopfronts glow along both edges of the water.
  for (let z = 1.2; z < END; z *= 1.18) {
    const top = Math.round(waterTop(v, z)) + 1;
    for (const side of [-1, 1]) shine(ctx, f, Math.round(sx(v, side * BANK * 0.97, z)), 1, top, Math.round((0.5 * v.F) / z), c.shop);
  }
};

const canyon = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const v = viewOf(f);
  ctx.drawImage(canyonLayer(f, v, c), 0, 0);
};

// ---- far signs, the boat, the bridge and its crowd, near signs ----

const far = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const v = viewOf(f);
  // A round sign crowns the far end of the canal; its ring of bulbs turns a notch on every beat.
  const r = Math.max(5, Math.round((1.8 * v.F) / END));
  const cy = Math.round(sy(v, 5.2, END) - r);
  drawGlow(ctx, c.neonA, v.cx, cy, r * 2, r * 2, 0.3);
  disc(ctx, v.cx, cy, r, () => c.ink);
  disc(ctx, v.cx, cy, Math.round(r * 0.45), (dy) => (dy < 0 ? c.neonC : c.neonA));
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2 + Math.floor(f.beat) * 0.2;
    fillRect(ctx, k % 2 === 0 ? c.white : c.neonA, Math.round(v.cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1);
  }
  fillRect(ctx, c.ink, v.cx, cy + r, 1, Math.max(0, Math.round(sy(v, 3.6, END)) - cy - r));
  ctx.drawImage(signsLayer(f, v, c, false), 0, 0);
  signLife(ctx, f, v, c, false);
};

// The tour boat comes toward us along the middle of the canal, lanterns along its canopy.
const boatDepth = (f: Frame): number => {
  const p = wrap(f.t / 20 + 0.5, 1);
  return 21 * (1 - p) + 0.9 * p;
};

const boatAt = (ctx: Ctx, f: Frame, v: View, c: Colors<K>, z: number): void => {
  const s = v.F / z;
  const box = (x0: number, y0: number, x1: number, y1: number, color: string): void => {
    const l = Math.round(v.cx + x0 * s);
    const t = Math.round(sy(v, y1, z));
    fillRect(ctx, color, l, t, Math.max(1, Math.round(v.cx + x1 * s) - l), Math.max(1, Math.round(sy(v, y0, z)) - t));
  };
  box(-0.42, 0, 0.42, 0.22, c.boat);
  box(-0.36, 0.22, 0.36, 0.62, c.boatLit);
  for (const x of [-0.38, -0.12, 0.12, 0.36]) box(x - 0.02, 0.22, x + 0.02, 0.66, c.ink);
  box(-0.46, 0.62, 0.46, 0.72, c.ink);
  for (let k = 0; k < 5; k++) box(-0.36 + k * 0.18 - 0.03, 0.54, -0.36 + k * 0.18 + 0.03, 0.62, c.red);
  box(-0.3, 0.28, 0.3, 0.36, c.ink);
  const y = Math.round(waterTop(v, z)) + 1;
  shine(ctx, f, Math.round(v.cx - 0.3 * s), Math.max(1, Math.round(0.6 * s)), y, Math.round(0.6 * s), c.boatLit);
  for (const side of [-1, 1]) fillRect(ctx, c.ripple, Math.round(v.cx + side * 0.5 * s), y - 1, Math.max(1, Math.round(0.3 * s)), 1);
};

// The next bridge downstream, its deck crossing the canal, people streaming both ways and nodding on the beat.
const bridge = (ctx: Ctx, f: Frame, v: View, c: Colors<K>): void => {
  const l = Math.round(sx(v, -WALL, BRIDGE));
  const r = Math.round(sx(v, WALL, BRIDGE));
  const deck = Math.round(sy(v, 0.95, BRIDGE));
  const under = Math.round(sy(v, 0.72, BRIDGE));
  fillRect(ctx, c.ink, l, deck, r - l, under - deck);
  for (let x = l; x < r; x++) {
    const u = (x - (l + r) / 2) / ((r - l) / 2);
    const arch = Math.round((1 - Math.sqrt(Math.max(0, 1 - u * u * 0.9))) * (waterTop(v, BRIDGE) - under));
    if (arch > 0) fillRect(ctx, c.ink, x, under, 1, arch);
  }
  const rail = Math.round(sy(v, 1.15, BRIDGE));
  fillRect(ctx, c.prom, l, rail, r - l, 1);
  for (let x = l; x < r; x += 4) fillRect(ctx, c.prom, x, rail, 1, deck - rail);
  const people = 14;
  const tall = Math.max(4, Math.round((0.6 * v.F) / BRIDGE));
  for (let i = 0; i < people; i++) {
    const dir = i % 2 === 0 ? 1 : -1;
    const x = l + wrap(rand(i, 41) * (r - l) + dir * f.t * (4 + rand(i, 42) * 4), r - l);
    const bob = (Math.floor(f.beat) + i) % 2;
    fillRect(ctx, c.ink, Math.round(x), deck - tall + bob, 2, tall - bob);
    fillRect(ctx, c.ink, Math.round(x), deck - tall - 2 + bob, 2, 2);
  }
  drawGlow(ctx, c.win, l + 3, rail - 3, 5, 4, 0.6);
  drawGlow(ctx, c.win, r - 3, rail - 3, 5, 4, 0.6);
};

const middle = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const v = viewOf(f);
  const z = boatDepth(f);
  if (z > BRIDGE) boatAt(ctx, f, v, c, z);
  bridge(ctx, f, v, c);
  if (z <= BRIDGE) boatAt(ctx, f, v, c, z);
};

const near = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const v = viewOf(f);
  ctx.drawImage(signsLayer(f, v, c, true), 0, 0);
  signLife(ctx, f, v, c, true);
  // Our own bridge rail runs along the bottom, with a few people leaning on it, a phone screen glowing.
  const rail = f.h - Math.round(f.h * 0.06);
  fillRect(ctx, c.ink, 0, rail, f.w, f.h - rail);
  fillRect(ctx, c.prom, 0, rail, f.w, 1);
  for (let i = 0; i < 5; i++) {
    const x = Math.round(f.w * (0.08 + i * 0.2 + rand(i, 51) * 0.08));
    const sway = Math.round(Math.sin(f.t * 0.8 + i * 2) * 1);
    fillRect(ctx, c.ink, x - 4 + sway, rail - 5, 9, 6);
    fillRect(ctx, c.ink, x - 3 + sway, rail - 6, 7, 1);
    fillRect(ctx, c.ink, x - 1 + sway, rail - 12, 3, 1);
    fillRect(ctx, c.ink, x - 2 + sway, rail - 11, 5, 4);
    fillRect(ctx, c.ink, x - 1 + sway, rail - 7, 3, 1);
    if (i % 2 === 1) fillRect(ctx, c.white, x + 3 + sway, rail - 5, 2, 3);
  }
};

export const canalNeon = defineScene<K>({
  id: 'canal-neon',
  title: 'Neon Canal',
  mood: { valence: 0.4, energy: 0.6 },
  styles: ['neon-rush', 'city-lights', 'summer-festival', 'city-groove', 'eurobeat', 'idol-disco'],
  variants: [
    {
      mood: { valence: 0.5, energy: 0.6 },
      colors: {
        sky0: '#08061a',
        sky1: '#1c0e3a',
        glow: '#3e1652',
        wall0: '#160e2a',
        wall1: '#1e1436',
        win: '#ffcf6a',
        winCool: '#7ad8ff',
        shop: '#ff9a4a',
        water0: '#0a0a20',
        water1: '#2a1446',
        ripple: '#3e2a6a',
        prom: '#4a3a6a',
        ink: '#05040c',
        neonA: '#ff3aa0',
        neonB: '#3af0ff',
        neonC: '#ffe84a',
        neonD: '#7aff5a',
        red: '#ff3a3a',
        paper: '#ffe8c8',
        white: '#fff6ee',
        boat: '#2a1e3a',
        boatLit: '#ffd88a',
      },
    },
    {
      mood: { valence: 0.15, energy: -0.2 },
      colors: {
        sky0: '#1a2a6a',
        sky1: '#4a4a9a',
        glow: '#c87a9a',
        wall0: '#262a54',
        wall1: '#2e3462',
        win: '#ffd88a',
        winCool: '#a8d8ff',
        shop: '#ffb26a',
        water0: '#141c48',
        water1: '#4a4a8a',
        ripple: '#6a6aa8',
        prom: '#5a5a8a',
        ink: '#0c0e24',
        neonA: '#ff6ab4',
        neonB: '#6ae8ff',
        neonC: '#fff07a',
        neonD: '#9aff8a',
        red: '#ff5a4a',
        paper: '#fff0d8',
        white: '#ffffff',
        boat: '#30345c',
        boatLit: '#ffe0a0',
      },
    },
    {
      mood: { valence: -0.35, energy: 0.25 },
      colors: {
        sky0: '#030308',
        sky1: '#0a0c1a',
        glow: '#1e2440',
        wall0: '#0a0c16',
        wall1: '#10121e',
        win: '#c8a05a',
        winCool: '#5a8aaa',
        shop: '#a85a3a',
        water0: '#040408',
        water1: '#10142a',
        ripple: '#1e2440',
        prom: '#262a40',
        ink: '#020204',
        neonA: '#e02a6a',
        neonB: '#2ab8d0',
        neonC: '#e0c040',
        neonD: '#5ac04a',
        red: '#d02a2a',
        paper: '#d8c0a0',
        white: '#e8e0d8',
        boat: '#141420',
        boatLit: '#e0b060',
      },
    },
  ],
  layers: [water, canyon, far, middle, near],
});
