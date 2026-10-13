// Manhattan from the far bank: the art-deco skyline with its crown lights changing every bar, windows switching on
// and off, a stone-towered suspension bridge with traffic streaming, yellow cabs below and steam rising from the street.
import { type Ctx, drawSprite, fillRect, flipped, type Sprite } from 'mojipx';
import { ditherGradient, frac, pixelLine, rand, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { ditherStyle, drawGlow, paletteBy, spanDisc, wrap } from './batch-1-helpers.ts';
import { frameLayer, glints, mirrorWater, snowfall, wideOf } from './batch-6-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sky3'
  | 'far'
  | 'farWin'
  | 'mid'
  | 'edge'
  | 'win'
  | 'winCool'
  | 'steel'
  | 'crown'
  | 'stone'
  | 'stoneLo'
  | 'water0'
  | 'water1'
  | 'cab'
  | 'cabLo'
  | 'tail'
  | 'street'
  | 'steam'
  | 'stack'
  | 'flake'
  | 'cap';

// A yellow cab heading right: l roof light, y/Y body, w windows, t tail light, h headlight, k tyres.
const CAB: Sprite = [
  '.........ll.........',
  '......yyyyyyy.......',
  '.....ywwwywwwy......',
  '....ywwwwywwwwy.....',
  'tyyyyyyyyyyyyyyyyyyh',
  'YyyyyyyyyyyyyyyyyyyY',
  'YYkkkYYYYYYYYYkkkYYY',
  '..kkk.........kkk...',
];
const CAB_LEFT: Sprite = flipped(CAB);

const cabPalette = paletteBy<K>((c) => ({ l: c.steam, y: c.cab, Y: c.cabLo, w: c.winCool, t: c.tail, h: c.steam, k: c.street }));

// ---- layout ----

const waterOf = (f: Frame): number => Math.round(f.h * (wideOf(f) ? 0.58 : 0.55));
const deckOf = (f: Frame): number => Math.round(f.h * (wideOf(f) ? 0.71 : 0.66));
const streetOf = (f: Frame): number => Math.round(f.h * (wideOf(f) ? 0.84 : 0.8));
const scaleOf = (f: Frame): number => (wideOf(f) ? 1 : 1.5);

type Tower = { readonly x: number; readonly w: number; readonly top: number; readonly kind: number };

// The skyline at one depth: towers side by side with small gaps, tops between `high` and `low` (fractions of the water line).
const towersOf = (f: Frame, seed: number, minW: number, maxW: number, high: number, low: number): readonly Tower[] => {
  const wl = waterOf(f);
  const out: Tower[] = [];
  for (let x = -4, i = 0; x < f.w; i++) {
    const w = Math.round(minW + rand(i, seed) * (maxW - minW));
    out.push({ x, w, top: Math.round(wl * (high + rand(i, seed + 1) * (low - high))), kind: Math.floor(rand(i, seed + 2) * 3) });
    x += w + Math.floor(rand(i, seed + 3) * 3);
  }
  return out;
};

const farTowers = (f: Frame): readonly Tower[] => towersOf(f, 11, 8, 18, 0.5, 0.8);
const midTowers = (f: Frame): readonly Tower[] => towersOf(f, 23, 12, 24, 0.64, 0.92);

const WIN_PITCH = 3;

const isLit = (x: number, y: number, seed: number): boolean => rand(x * 97 + y, seed) < 0.38;

const paintTower = (g: Ctx, c: Colors<K>, t: Tower, wl: number, body: string, lights: readonly string[], winW: number): void => {
  fillRect(g, body, t.x, t.top, t.w, wl - t.top);
  if (t.kind === 1) fillRect(g, body, t.x + 2, t.top - 3, t.w - 4, 3);
  if (t.kind === 2) fillRect(g, body, t.x + (t.w >> 1), t.top - 6, 1, 6);
  fillRect(g, c.cap, t.x, t.top, t.w, 1);
  for (let y = t.top + 3; y < wl - 2; y += WIN_PITCH)
    for (let x = t.x + 2; x < t.x + t.w - 2; x += WIN_PITCH)
      if (isLit(x, y, t.x)) fillRect(g, lights[(x + y) % lights.length] as string, x, y, winW, 1);
};

// ---- the two landmark towers ----

type Step = { readonly half: number; readonly rise: number };

// The stepped tower: wide base, setbacks, the long shaft, then crown tiers, the mast and the antenna.
const DECO: readonly Step[] = [
  { half: 13, rise: 22 },
  { half: 10, rise: 10 },
  { half: 7, rise: 40 },
  { half: 5, rise: 4 },
  { half: 4, rise: 4 },
  { half: 3, rise: 3 },
  { half: 1, rise: 6 },
  { half: 0, rise: 10 },
];

// Where a landmark stands, as a column of the frame.
const columnOf = (f: Frame, wide: number, tall: number): number => Math.round(f.w * (wideOf(f) ? wide : tall));

// Floodlit from below, the stepped tower is a shade lighter than its neighbours, with columns of lit windows.
const paintDecoStep = (g: Ctx, c: Colors<K>, cx: number, half: number, top: number, rise: number, windows: boolean): void => {
  fillRect(g, c.far, cx - half, top, half * 2 + 1, rise);
  fillRect(g, c.edge, cx - half, top, 1, rise);
  fillRect(g, c.mid, cx + half, top, 1, rise);
  fillRect(g, c.farWin, cx - half, top, half * 2 + 1, 1);
  if (!windows) return;
  for (let x = cx - half + 2; x < cx + half - 1; x += 2)
    for (let wy = top + 2; wy < top + rise - 1; wy += 2) fillRect(g, isLit(x, wy, 5) ? c.win : c.mid, x, wy, 1, 1);
};

const paintDeco = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const cx = columnOf(f, 0.42, 0.4);
  const s = scaleOf(f);
  let y = waterOf(f);
  DECO.forEach((step, i) => {
    const rise = Math.round(step.rise * s);
    paintDecoStep(g, c, cx, Math.round(step.half * s), y - rise, rise, i < 3);
    y -= rise;
  });
};

// The crown floors, lit in a color that changes with every bar.
const decoCrown = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const cx = columnOf(f, 0.42, 0.4);
  const s = scaleOf(f);
  const colors = [c.crown, c.winCool, c.win, c.steam];
  const color = colors[Math.floor(f.beat / 4) % colors.length] as string;
  let y = waterOf(f);
  for (const [i, step] of DECO.entries()) {
    const rise = Math.round(step.rise * s);
    const half = Math.round(step.half * s);
    if (i >= 3 && i <= 5) fillRect(ctx, color, cx - half, y - rise, half * 2 + 1, 1);
    if (i >= 3 && i <= 5) fillRect(ctx, color, cx - half, y - rise + 2, half * 2 + 1, 1);
    y -= rise;
  }
  drawGlow(ctx, color, cx, y + Math.round(16 * s), Math.round(10 * s), Math.round(14 * s), 0.3);
  if (Math.floor(f.beat) % 2 === 0) fillRect(ctx, c.tail, cx, y, 1, 1);
};

// The steel crown: shrinking arches stacked up, each pierced with a row of lit triangular windows, then the needle.
const paintSpire = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const cx = columnOf(f, 0.64, 0.78);
  const s = scaleOf(f);
  const wl = waterOf(f);
  const half = Math.round(6 * s);
  const shaftTop = wl - Math.round(64 * s);
  fillRect(g, c.mid, cx - half, shaftTop, half * 2 + 1, wl - shaftTop);
  fillRect(g, c.edge, cx + half, shaftTop, 1, wl - shaftTop);
  for (let y = shaftTop + 3; y < wl - 2; y += 3)
    for (let x = cx - half + 1; x < cx + half; x += 2) if (isLit(x, y, 9)) fillRect(g, c.winCool, x, y, 1, 1);
  let base = shaftTop;
  for (let tier = 0; tier < 4; tier++) {
    const r = Math.round((half - tier * 1.4) * 1);
    for (let k = -r; k <= r; k++) {
      const lift = Math.round(Math.sqrt(Math.max(0, 1 - (k / (r + 0.5)) ** 2)) * r * 0.9);
      fillRect(g, c.steel, cx + k, base - lift, 1, lift);
      if ((k + tier) % 2 === 0 && Math.abs(k) < r) fillRect(g, c.win, cx + k, base - lift + 1, 1, 1);
    }
    base -= Math.max(2, Math.round(r * 0.6));
  }
  fillRect(g, c.steel, cx, base - Math.round(16 * s), 1, Math.round(16 * s));
};

// ---- sky and skyline ----

const skylineLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('nyc-skyline', f, c, (g) => {
    const wl = waterOf(f);
    for (const t of farTowers(f)) paintTower(g, c, t, wl, c.far, [c.farWin], 1);
    paintSpire(g, f, c);
    for (const t of midTowers(f)) paintTower(g, c, t, wl, c.mid, [c.win, c.win, c.winCool], 2);
    paintDeco(g, f, c);
  });

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const wl = waterOf(f);
  ctx.drawImage(ditherGradient(f.w, wl, [c.sky0, c.sky1, c.sky2, c.sky3]), 0, 0);
  stars(ctx, f.w, wl, f.t, [c.farWin], Math.round((f.w * wl) / 900), 19, 0.4);
};

// Each beat a handful of windows change: lit ones go dark and dark ones light up.
const twinkle = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const wl = waterOf(f);
  const towers = midTowers(f);
  const b = Math.floor(f.beat);
  const count = 6 + Math.round(f.energy * 8);
  for (let k = 0; k < count; k++) {
    const t = towers[Math.floor(rand(b, k * 3) * towers.length)] as Tower;
    const x = t.x + 2 + Math.floor(rand(b, k * 3 + 1) * Math.max(1, (t.w - 4) / WIN_PITCH)) * WIN_PITCH;
    const y = t.top + 3 + Math.floor(rand(b, k * 3 + 2) * Math.max(1, (wl - t.top - 5) / WIN_PITCH)) * WIN_PITCH;
    fillRect(ctx, isLit(x, y, t.x) ? c.mid : c.win, x, y, 2, 1);
  }
};

const skyline = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(skylineLayer(f, c), 0, 0);
  twinkle(ctx, f, c);
  decoCrown(ctx, f, c);
};

// ---- the river and the bridge ----

const river = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const wl = waterOf(f);
  const bottom = streetOf(f);
  mirrorWater(ctx, f, { axis: wl, bottom, squash: 1.4, amp: 1.5, freq: 1, speed: 2.4, tint: c.water0, tintLevel: 0.4 });
  glints(ctx, f, wl + 2, bottom, c.water1, Math.round(f.w / 5), 33);
};

const bridgeTowersOf = (f: Frame): readonly number[] =>
  wideOf(f) ? [Math.round(f.w * 0.13), Math.round(f.w * 0.87)] : [Math.round(f.w * 0.2), Math.round(f.w * 1.25)];

const towerTopOf = (f: Frame): number => Math.round(f.h * (wideOf(f) ? 0.3 : 0.38));

// The main cable sags between the towers and drops toward the deck beyond them.
const cableAt = (f: Frame, x: number): number => {
  const [a = 0, b = f.w] = bridgeTowersOf(f);
  const top = towerTopOf(f) + 3;
  const deck = deckOf(f);
  if (x < a) return top + ((a - x) / Math.max(1, a)) * (deck - top) * 0.85;
  if (x > b) return top + ((x - b) / Math.max(1, f.w - b)) * (deck - top) * 0.85;
  const u = ((x - a) / (b - a)) * 2 - 1;
  return top + (deck - 4 - top) * (1 - u * u);
};

const paintCables = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const deck = deckOf(f);
  for (let x = 0; x < f.w; x++) {
    const y = Math.round(cableAt(f, x));
    fillRect(g, c.edge, x, y, 1, 1);
    if (x % 4 === 0) fillRect(g, c.stoneLo, x, y + 1, 1, Math.max(0, deck - y - 1));
  }
  const top = towerTopOf(f) + 3;
  for (const tx of bridgeTowersOf(f))
    for (let k = 1; k <= 6; k++) {
      pixelLine(g, tx, top, tx - k * 9, deck, c.stoneLo);
      pixelLine(g, tx, top, tx + k * 9, deck, c.stoneLo);
    }
};

// A stone tower with two pointed arches the roadway runs through.
const paintBridgeTower = (g: Ctx, f: Frame, c: Colors<K>, x: number): void => {
  const s = scaleOf(f);
  const half = Math.round(8 * s);
  const top = towerTopOf(f);
  const deck = deckOf(f);
  fillRect(g, c.stone, x - half, top, half * 2 + 1, f.h - top);
  fillRect(g, c.stoneLo, x + half - 1, top, 2, f.h - top);
  fillRect(g, c.cap, x - half - 1, top, half * 2 + 3, 2);
  const archTop = deck - Math.round(20 * s);
  for (const ax of [x - Math.round(5 * s), x + Math.round(2 * s)]) {
    const aw = Math.round(3 * s);
    fillRect(g, c.water0, ax, archTop + 2, aw, deck - archTop - 1);
    fillRect(g, c.water0, ax + 1, archTop, Math.max(1, aw - 2), 2);
  }
  fillRect(g, c.stoneLo, x - half, top + Math.round(10 * s), half * 2 + 1, 1);
};

const bridgeLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('nyc-bridge', f, c, (g) => {
    const deck = deckOf(f);
    paintCables(g, f, c);
    fillRect(g, c.stoneLo, 0, deck, f.w, 4);
    fillRect(g, c.cap, 0, deck, f.w, 1);
    for (let x = 0; x < f.w; x += 3) fillRect(g, c.edge, x, deck - 2, 1, 2);
    for (const x of bridgeTowersOf(f)) paintBridgeTower(g, f, c, x);
  });

// Traffic on the bridge: headlights one way, tail lights the other.
const deckTraffic = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const deck = deckOf(f);
  const span = f.w + 20;
  for (let i = 0; i < 14; i++) {
    const dir = i % 2 === 0 ? 1 : -1;
    const x = Math.round(wrap(rand(i, 51) * span + dir * f.t * (18 + rand(i, 52) * 10), span) - 10);
    fillRect(ctx, c.cab, x, deck + 1, 3, 1);
    fillRect(ctx, dir > 0 ? c.steam : c.tail, dir > 0 ? x + 3 : x - 1, deck + 1, 1, 1);
  }
};

const bridge = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(bridgeLayer(f, c), 0, 0);
  deckTraffic(ctx, f, c);
};

// ---- the street ----

const stackXOf = (f: Frame): number => Math.round(f.w * (wideOf(f) ? 0.3 : 0.62));

const streetLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('nyc-street', f, c, (g) => {
    const top = streetOf(f);
    g.drawImage(ditherGradient(f.w, f.h - top, [c.street, c.street, c.stoneLo]), 0, top);
    fillRect(g, c.cap, 0, top, f.w, 1);
    fillRect(g, c.edge, 0, top + 2, f.w, 1);
    const lane = Math.round((top + f.h) / 2) + 2;
    for (let x = 2; x < f.w; x += 14) fillRect(g, c.cabLo, x, lane, 7, 1);
    // The striped stack that carries steam up from below the street.
    const sx = stackXOf(f);
    const base = f.h - 2;
    for (let y = base - 14; y < base; y++) {
      const half = Math.round(1 + (y - (base - 14)) / 7);
      fillRect(g, Math.floor((y - base) / 3) % 2 === 0 ? c.stack : c.steam, sx - half, y, half * 2 + 1, 1);
    }
  });

const cabs = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const top = streetOf(f);
  const far = top + Math.round((f.h - top) * 0.45);
  const near = f.h - 1;
  const span = f.w + 160;
  for (let i = 0; i < 4; i++) {
    const right = i % 2 === 0;
    const x = Math.round(wrap(i * 97 + (right ? 1 : -1) * f.t * (34 + i * 4), span) - 60);
    const y = right ? near : far;
    const sprite = right ? CAB : CAB_LEFT;
    drawGlow(ctx, c.steam, right ? x + 25 : x - 5, y - 3, 7, 2, 0.4);
    drawSprite(ctx, sprite, cabPalette(c), x, y - CAB.length);
  }
};

// Steam billowing out of the street: soft dithered clouds that swell, lean downwind and thin out as they rise.
const steam = (ctx: Ctx, f: Frame, x: number, y: number, color: string, rise: number, seed: number): void => {
  const puffs = 8;
  for (let k = 0; k < puffs; k++) {
    const age = frac(f.t * 0.3 + k / puffs + rand(seed, 1));
    const style = ditherStyle(ctx, color, age < 0.45 ? 0.75 : (1 - age) * 1.3);
    if (!style) continue;
    ctx.fillStyle = style;
    spanDisc(ctx, x + age * age * rise * 0.6 + Math.sin(f.t + k * 2.3) * age * 3, y - age * rise, Math.round(2 + age * rise * 0.24));
  }
};

// The stack and a manhole both breathe steam, more of it when the music is energetic.
const vents = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const rise = Math.round((wideOf(f) ? 40 : 60) * (0.8 + f.energy * 0.4));
  steam(ctx, f, stackXOf(f), f.h - 17, c.steam, rise, 3);
  steam(ctx, f, columnOf(f, 0.74, 0.2), f.h - 3, c.steam, Math.round(rise * 0.6), 8);
};

const street = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(streetLayer(f, c), 0, 0);
  vents(ctx, f, c);
  cabs(ctx, f, c);
};

// Snow, only in the winter colors (elsewhere the flake color is the sky's own and nothing falls).
const weather = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  if (c.flake === c.sky0) return;
  snowfall(ctx, f, c.flake, Math.round((f.w * f.h) / 260), 17);
};

export const manhattanNight = defineScene<K>({
  id: 'manhattan-night',
  title: 'Empire Nights',
  mood: { valence: 0, energy: 0.4 },
  styles: ['city-lights', 'neon-rush', 'nineties-pop', 'snowfall', 'city-groove', 'jungle-run'],
  variants: [
    {
      // Night: navy sky, a sea of warm windows.
      mood: { valence: 0.05, energy: 0.5 },
      colors: {
        sky0: '#070a1e',
        sky1: '#101838',
        sky2: '#22265a',
        sky3: '#3e2e66',
        far: '#182046',
        farWin: '#4a5a96',
        mid: '#0c1230',
        edge: '#2c3668',
        win: '#ffd27a',
        winCool: '#9ad8ff',
        steel: '#c8d0e4',
        crown: '#ff5a8a',
        stone: '#4e4a68',
        stoneLo: '#2e2c48',
        water0: '#05081a',
        water1: '#3a4a8a',
        cab: '#ffcc2a',
        cabLo: '#a8801a',
        tail: '#ff3a3a',
        street: '#14141e',
        steam: '#d8dcec',
        stack: '#ff7a2a',
        flake: '#070a1e',
        cap: '#2c3668',
      },
    },
    {
      // Dusk: the sky still burning orange behind the towers, the first windows on.
      mood: { valence: 0.45, energy: 0.3 },
      colors: {
        sky0: '#2a2a6a',
        sky1: '#7a4a8a',
        sky2: '#e0707a',
        sky3: '#ffb070',
        far: '#8a5a8a',
        farWin: '#ffd0a0',
        mid: '#3a2a52',
        edge: '#6a4a7a',
        win: '#ffd27a',
        winCool: '#ffe8c0',
        steel: '#ffe0c8',
        crown: '#ffffff',
        stone: '#6a4a6a',
        stoneLo: '#4a3252',
        water0: '#2a1e44',
        water1: '#ffb07a',
        cab: '#ffcc2a',
        cabLo: '#b8801a',
        tail: '#ff3a3a',
        street: '#2a2032',
        steam: '#ffe6d8',
        stack: '#ff7a2a',
        flake: '#2a2a6a',
        cap: '#6a4a7a',
      },
    },
    {
      // A snowy night: lavender haze, white rooftops and railings, flakes drifting past the cabs.
      mood: { valence: -0.25, energy: -0.3 },
      colors: {
        sky0: '#1c1c34',
        sky1: '#2c2c4a',
        sky2: '#46446a',
        sky3: '#6a6088',
        far: '#3a3a5c',
        farWin: '#8a8ab8',
        mid: '#1a1a30',
        edge: '#4a4a70',
        win: '#ffd890',
        winCool: '#c8e4ff',
        steel: '#e0e4f0',
        crown: '#9ad8ff',
        stone: '#5a5674',
        stoneLo: '#3a3854',
        water0: '#121228',
        water1: '#7a7aa8',
        cab: '#f0c030',
        cabLo: '#9a7a2a',
        tail: '#ff4a4a',
        street: '#c8cad8',
        steam: '#f0f2fa',
        stack: '#ff7a2a',
        flake: '#ffffff',
        cap: '#f4f6ff',
      },
    },
  ],
  layers: [sky, skyline, river, bridge, street, weather],
});
