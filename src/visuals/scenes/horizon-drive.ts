// A racing game that never existed, seen from behind a mint convertible: the road's stripes rush by two to a beat,
// it sweeps left and right toward a huge low sun, palms, lamps and chevron signs fly past, and speed lines flare on the kick.
import { type Ctx, canvasOf, drawSprite, fillRect, flipped, type Palette, type Sprite } from 'mojipx';
import { disc, ditherGradient, frac, pixelLine, rand, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { drawGlow } from './batch-1-helpers.ts';
import { tileX } from './batch-2-helpers.ts';
import { memoLayer, paletteOf } from './batch-3-helpers.ts';
import { drawTextOutlined, fractal2, textWidth } from './batch-4-helpers.ts';
import { isDark } from './batch-5-helpers.ts';
import { limb } from './batch-7-helpers.ts';
import { bigText, digits, strand } from './batch-8-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sun'
  | 'halo'
  | 'cloud'
  | 'star'
  | 'far'
  | 'near'
  | 'city'
  | 'window'
  | 'side'
  | 'sideLo'
  | 'rumble'
  | 'road'
  | 'roadLo'
  | 'line'
  | 'palm'
  | 'palmHi'
  | 'trunk'
  | 'lamp'
  | 'sign'
  | 'ink'
  | 'white'
  | 'hud';

// ---- the car and its two passengers, seen from behind ----

// o outline, h/H/d body, L/l taillights, W/k plate, c/C bumper, t/T tyres, e exhaust.
const CAR: Sprite = [
  '......oooooooooooooooooooooooooooooooooooooooooooo......',
  '....ooHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHoo....',
  '...oHHhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhHHo...',
  '..oHhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhHo..',
  '.ohhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhho.',
  'ohhLLLLLhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhLLLLLhho',
  'ohLLlllLLhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhLLlllLLho',
  'ohLLlllLLhhhhhhhhhhhoooooooooooooooohhhhhhhhhhhLLlllLLho',
  'ohhLLLLLhhhhhhhhhhhhoWWWWWWWWWWWWWWohhhhhhhhhhhhLLLLLhho',
  'ohhhhhhhhhhhhhhhhhhhoWkkWkWkkWkWkkWohhhhhhhhhhhhhhhhhhho',
  'odddddddddddddddddddoWWWWWWWWWWWWWWodddddddddddddddddddo',
  'occcccccccccccccccccccccccccccccccccccccccccccccccccccco',
  'oCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCo',
  '.oooooooooooooooooooooooooooooooooooooooooooooooooooooo.',
  '.ottttttto......................................ottttto.',
  '.ottTttTto...................ee.................ottTtto.',
  '.ottttttto...................ee.................ottttto.',
  '..ooooooo........................................ooooo..',
];

// The windscreen ahead of the seats: g glass.
const CABIN: Sprite = [
  '..........oooooooooooooooooooooooooooooooooooo..........',
  '.........oggggggggggggggggggggggggggggggggggggo.........',
  '........oggggggggggggggggggggggggggggggggggggggo........',
  '.......oooooooooooooooooooooooooooooooooooooooooo.......',
];

const SEAT: Sprite = ['.oooooo.', 'oSSSSSSo', 'oSssssSo', 'oSssssSo'];

// The driver: a/A hair, n/N neck, j/J jacket.
const DRIVER: Sprite = [
  '....oooo....',
  '..ooaaaaoo..',
  '.oaaAAaaaao.',
  '.oaAaaaaaao.',
  'oaaaaaaaaaao',
  'oaaaaaaaaaao',
  'oaaaaaaaaaao',
  '.oaaaaaaaao.',
  '..onaaaano..',
  '.ooonnNNooo.',
  'ojjjjjjjjjjo',
  'ojjJjjjjjjjo',
];

// The passenger: a polka-dot scarf (r/R) over golden hair (y/Y), a white top (v).
const GIRL: Sprite = [
  '....oooo....',
  '..oorrrroo..',
  '.orrRrrrRro.',
  '.orrrrRrrro.',
  'orRrrrrrrRro',
  'orrrrRrrrrro',
  'oyyyyyyyyyyo',
  'oyyYyyyyyyyo',
  'oyyyyyyyyyyo',
  '.oyyyyyyyyo.',
  '.ovyyyyyyvo.',
  'ovvvvvvvvvvo',
];

const HAND: Sprite = ['.oo.', 'onno', 'onno', 'onno', '.oo.'];

const CAR_BASE: Palette = {
  o: '#140a18',
  H: '#a8f4e4',
  h: '#2cbcae',
  d: '#146e72',
  L: '#a01a2a',
  l: '#ff4a3a',
  W: '#f0f0f0',
  k: '#3a3a4a',
  c: '#e0e0f0',
  C: '#8a8aa0',
  t: '#1a1a24',
  T: '#4a4a5a',
  e: '#5a5a6a',
  g: '#9ad0f0',
  S: '#3a2a2a',
  s: '#6a4a3a',
  a: '#3a2a2a',
  A: '#7a5a4a',
  n: '#e8b090',
  N: '#c08a6a',
  j: '#3a5a9a',
  J: '#6a8ad0',
  r: '#ff7ab0',
  R: '#ffe0ee',
  y: '#ffd870',
  Y: '#fff0b0',
  v: '#ffffff',
};
// On a hard kick the taillights flare as if braking into the beat.
const CAR_BRAKE: Palette = { ...CAR_BASE, l: '#fff0c0', L: '#ff3a2a' };

// ---- roadside things, drawn small and scaled up as they come near ----

// g/G fronds, t/T trunk.
const PALM: Sprite = [
  '........gg....gg........',
  '.....gggGGg..gGGggg.....',
  '...ggGGGGgggggggGGGGgg..',
  '..gGGggggGGggGGggggGGg..',
  '.gGgggg.gGGttGGg.ggggGg.',
  'gGggg..gGg.tT.gGg..gggGg',
  'gGg...gGg..tT..gGg...gGg',
  'gg....gg...tT...gg....gg',
  'g.....g....tT....g.....g',
  '..........ttT...........',
  '..........ttT...........',
  '.........ttT............',
  '.........ttT............',
  '.........ttT............',
  '.........ttT............',
  '........ttT.............',
  '........ttT.............',
  '........ttTt............',
  '........ttTt............',
  '.........ttT............',
  '.........ttT............',
  '.........ttTt...........',
  '.........ttTt...........',
  '........ttTTt...........',
  '........ttTTt...........',
];

// A street lamp leaning over the road: p pole, l lamp.
const LAMP: Sprite = [
  'pppppppp....',
  'plllllpppp..',
  '.ppppp...p..',
  '.........p..',
  '.........p..',
  '.........p..',
  '.........p..',
  '.........p..',
  '.........p..',
  '.........p..',
  '.........p..',
  '.........p..',
  '.........p..',
  '.........p..',
  '.........p..',
  '.........p..',
  '.........p..',
  '.........p..',
  '.........p..',
  '.........p..',
  '........ppp.',
  '........ppp.',
];
const LAMP_RIGHT: Sprite = flipped(LAMP);

// A chevron board warning of the bend: s board, k chevrons, p posts.
const CHEVRON: Sprite = [
  'pppppppppppppppp',
  'pskkssskkssskksp',
  'psskkssskkssskkp',
  'psssskkssskksskp',
  'psskkssskkssskkp',
  'pskkssskkssskksp',
  'pppppppppppppppp',
  '...pp......pp...',
  '...pp......pp...',
  '...pp......pp...',
  '...pp......pp...',
];
const CHEVRON_LEFT: Sprite = flipped(CHEVRON);

const carPalette = (): Palette => CAR_BASE;
const brakePalette = (): Palette => CAR_BRAKE;
const palmPalette = (c: Colors<K>): Palette => ({ g: c.palm, G: c.palmHi, t: c.trunk, T: c.palmHi });
const lampPalette = (c: Colors<K>): Palette => ({ p: c.ink, l: c.lamp });
const signPalette = (c: Colors<K>): Palette => ({ p: c.ink, s: c.sign, k: c.rumble });

// ---- the view: horizon, road width and the bends, all from the clock ----

type View = {
  readonly wide: boolean;
  readonly horizon: number;
  readonly cx: number;
  readonly half: number;
  readonly bend: number;
  readonly run: number;
};

// The bend eases between left and right; `swept` is how far the scenery has slid sideways so far (the bend's integral).
const bendAt = (t: number): number => Math.sin(t * 0.23) * 0.7 + Math.sin(t * 0.071) * 0.3;
const swept = (t: number): number => -Math.cos(t * 0.23) * (0.7 / 0.23) - Math.cos(t * 0.071) * (0.3 / 0.071);

const viewOf = (f: Frame): View => {
  const wide = f.w > f.h;
  return {
    wide,
    horizon: Math.round(f.h * (wide ? 0.44 : 0.47)),
    cx: f.w / 2,
    half: f.w * (wide ? 0.52 : 0.66),
    bend: bendAt(f.t),
    // Two stripes go by on every beat.
    run: f.beat * 2,
  };
};

/** Depth share of a row: 0 at the horizon, 1 at the bottom of the screen. */
const shareOf = (f: Frame, v: View, y: number): number => (y - v.horizon) / (f.h - v.horizon);
const centerAt = (f: Frame, v: View, p: number): number => v.cx + v.bend * (1 - p) ** 2 * f.w * 0.55;

// ---- the sky: gradient, stars at night, the sun with its halo, long clouds ----

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const v = viewOf(f);
  ctx.drawImage(ditherGradient(f.w, v.horizon, [c.sky0, c.sky1, c.sky2]), 0, 0);
  stars(ctx, f.w, v.horizon, f.t, [c.star], 40, 23, 0.4);
  const r = Math.round(Math.min(f.w, f.h) * (v.wide ? 0.2 : 0.26));
  const sx = Math.round(v.cx + swept(f.t) * f.w * 0.01);
  const sy = v.horizon - Math.round(r * 0.45);
  drawGlow(ctx, c.halo, sx, sy, r * 2, Math.round(r * 1.5), 0.55, 5);
  disc(ctx, sx, sy, r, () => c.sun);
  const band = cloudBand(f, v, c);
  tileX(ctx, band, f.t * 3 - swept(f.t) * f.w * 0.04, Math.round(v.horizon * 0.18), f.w);
};

const cloudBand = (f: Frame, v: View, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`drive-cloud:${f.w}:${v.horizon}:${c.cloud}`, 512, Math.round(v.horizon * 0.6), (g) => {
    g.fillStyle = c.cloud;
    const h = Math.round(v.horizon * 0.6);
    for (let i = 0; i < 9; i++) {
      const y = Math.round(rand(i, 61) * (h - 3));
      const x = Math.round(rand(i, 62) * 512);
      const w = 30 + Math.round(rand(i, 63) * 70);
      g.fillRect(x, y, w, 2);
      g.fillRect(x + 8, y - 1, Math.round(w * 0.6), 1);
      if (x + w > 512) g.fillRect(x - 512, y, w, 2);
    }
  });

// ---- the land: far mountains with a city, near hills, both sliding with the bends ----

const TILE = 512;

const farLayer = (v: View, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`drive-far:${v.horizon}:${c.far}:${c.city}:${c.window}`, TILE, v.horizon, (g) => {
    for (let x = 0; x < TILE; x++) {
      const top = Math.round(v.horizon - 6 - fractal2(x / 48, 0.5, 4, TILE / 48) * v.horizon * 0.42);
      fillRect(g, c.far, x, top, 1, v.horizon - top);
    }
    for (const [from, to] of [
      [40, 150],
      [290, 430],
    ] as const)
      paintCity(g, v, from, to, c);
  });

// A far city: towers of lit windows (unlit by day, when the windows take the towers' color).
const paintCity = (g: Ctx, v: View, from: number, to: number, c: Colors<K>): void => {
  for (let i = from, x = from; x < to; i++) {
    const w = 6 + Math.floor(rand(i, 71) * 8);
    const h = 8 + Math.floor(rand(i, 72) * v.horizon * 0.32 * (1 - Math.abs((x - from) / (to - from) - 0.5)));
    fillRect(g, c.city, x, v.horizon - h, w, h);
    for (let wy = v.horizon - h + 2; wy < v.horizon - 2; wy += 3)
      for (let wx = x + 1; wx < x + w - 1; wx += 2) if (rand(wx, wy) < 0.45) fillRect(g, c.window, wx, wy, 1, 1);
    x += w + 1;
  }
};

const nearLayer = (v: View, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`drive-near:${v.horizon}:${c.near}`, TILE, v.horizon, (g) => {
    for (let x = 0; x < TILE; x++) {
      const top = Math.round(v.horizon - 2 - fractal2(x / 22, 3.5, 9, TILE / 22) * v.horizon * 0.16);
      fillRect(g, c.near, x, top, 1, v.horizon - top);
    }
  });

const land = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const v = viewOf(f);
  const slide = swept(f.t) * f.w * 0.08;
  tileX(ctx, farLayer(v, c), slide * 0.4, 0, f.w);
  tileX(ctx, nearLayer(v, c), slide, 0, f.w);
};

// ---- the road, row by row: the verge and the kerb alternate in stripes that rush toward us ----

const roadRow = (ctx: Ctx, f: Frame, v: View, y: number, c: Colors<K>): void => {
  const p = shareOf(f, v, y);
  const stripe = Math.floor(3 / p + v.run) % 2 === 0;
  const center = centerAt(f, v, p);
  const half = v.half * p;
  const kerb = Math.max(1, half * 0.1);
  fillRect(ctx, stripe ? c.side : c.sideLo, 0, y, f.w, 1);
  fillRect(ctx, stripe ? c.rumble : c.white, Math.round(center - half - kerb), y, Math.round((half + kerb) * 2), 1);
  fillRect(ctx, stripe ? c.road : c.roadLo, Math.round(center - half), y, Math.round(half * 2), 1);
  if (!stripe) return;
  const line = Math.max(1, Math.round(half * 0.025));
  for (const k of [-1, 1]) fillRect(ctx, c.line, Math.round(center + (k * half) / 3 - line / 2), y, line, 1);
};

const road = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const v = viewOf(f);
  for (let y = v.horizon; y < f.h; y++) roadRow(ctx, f, v, y, c);
};

// ---- roadside things: one slot per stripe, far to near so the near ones cover the far ----

type Thing = { readonly sprite: Sprite; readonly palette: Palette; readonly side: -1 | 1; readonly gap: number; readonly glow?: string };

const thingAt = (n: number, v: View, c: Colors<K>): Thing | null => {
  const side = n % 2 === 0 ? -1 : 1;
  if (n % 6 === 3 || n % 6 === 0) {
    // Lamps throw a pool of light only once the sky has gone dark.
    const glow = isDark(c.sky1) ? c.lamp : undefined;
    return { sprite: side < 0 ? LAMP_RIGHT : LAMP, palette: paletteOf(c, lampPalette), side, gap: 1.12, glow };
  }
  const outer = v.bend > 0 ? -1 : 1;
  if (Math.abs(v.bend) > 0.35 && side === outer && n % 4 === 0)
    return { sprite: v.bend > 0 ? CHEVRON : CHEVRON_LEFT, palette: paletteOf(c, signPalette), side, gap: 1.25 };
  if (rand(n, 81) < 0.3) return null;
  return { sprite: PALM, palette: paletteOf(c, palmPalette), side, gap: 1.35 + rand(n, 82) * 0.4 };
};

const placeThing = (ctx: Ctx, f: Frame, v: View, thing: Thing, p: number, scale: number): void => {
  const y = v.horizon + p * (f.h - v.horizon);
  const x = centerAt(f, v, p) + thing.side * v.half * p * thing.gap;
  const image = canvasOf(thing.sprite, thing.palette);
  const w = Math.max(1, Math.round(image.width * p * scale));
  const h = Math.max(1, Math.round(image.height * p * scale));
  const left = thing.side < 0 && thing.sprite !== PALM ? x - w * 0.25 : x - w / 2;
  ctx.drawImage(image, Math.round(left), Math.round(y - h), w, h);
  // Pools of light come in three sizes (each one a cached canvas); the farthest lamps have none.
  const pool = w < 8 ? 0 : w < 20 ? 8 : w < 40 ? 16 : 30;
  if (thing.glow && pool > 0) {
    const lx = thing.side < 0 ? left + w * 0.75 : left + w * 0.25;
    drawGlow(ctx, thing.glow, lx, y - h + 2, pool, Math.round(pool * 0.6), 0.4, 3);
  }
};

const things = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const v = viewOf(f);
  const scale = (f.h - v.horizon) / 34;
  for (let n = Math.floor(v.run + 60); n > v.run; n--) {
    const p = 3 / (n - v.run);
    if (p < 0.05 || p > 2.4) continue;
    const thing = thingAt(n, v, c);
    if (thing) placeThing(ctx, f, v, thing, p, scale);
  }
};

// ---- the car ----

const passengers = (ctx: Ctx, f: Frame, x: number, y: number): void => {
  const lean = Math.round(-viewOf(f).bend * 2);
  drawSprite(ctx, DRIVER, CAR_BASE, x + 12 + lean, y);
  if (frac(f.beat / 4) < 0.25) {
    limb(ctx, x + 41 + lean, y + 10, x + 46 + lean, y - 3, 1, CAR_BASE.n as string, CAR_BASE.o as string);
    drawSprite(ctx, HAND, CAR_BASE, x + 44 + lean, y - 7);
  }
  const sway = Math.round(Math.sin(f.t * 7) * 2);
  const ink = CAR_BASE.o as string;
  strand(ctx, x + 41 + lean, y + 6, 9, 4 + sway, 3, (u) => 4 - u * 2, {
    ink,
    hair: CAR_BASE.y as string,
    hi: CAR_BASE.Y as string,
    lo: '#e0a040',
  });
  drawSprite(ctx, GIRL, CAR_BASE, x + 32 + lean, y);
  for (let k = 0; k < 2; k++) {
    const flap = Math.round(Math.sin(f.t * 14 + k * 2) * 1.5);
    fillRect(ctx, CAR_BASE.r as string, x + 43 + lean + k * 2, y + 6 + k + flap, 3, 1);
  }
};

const car = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const v = viewOf(f);
  const bob = frac(f.beat) < 0.2 ? 1 : 0;
  const x = Math.round(v.cx - 28 - v.bend * 6);
  const y = f.h - (v.wide ? 24 : 44) + bob;
  shadowUnder(ctx, x, y, c);
  drawSprite(ctx, CABIN, paletteOf(c, carPalette), x, y - 4);
  passengers(ctx, f, x, y - 12);
  drawSprite(ctx, SEAT, CAR_BASE, x + 14, y - 3);
  drawSprite(ctx, SEAT, CAR_BASE, x + 34, y - 3);
  drawSprite(ctx, CAR, paletteOf(c, f.kick > 0.7 ? brakePalette : carPalette), x, y);
  exhaust(ctx, f, x + 30, y + 17, c);
};

const shadowUnder = (ctx: Ctx, x: number, y: number, c: Colors<K>): void => {
  fillRect(ctx, c.ink, x + 2, y + 17, 52, 2);
};

// A puff leaves the exhaust on every beat and thins out behind the car.
const exhaust = (ctx: Ctx, f: Frame, x: number, y: number, c: Colors<K>): void => {
  const age = frac(f.beat);
  if (age > 0.6) return;
  const r = 1 + Math.round(age * 4);
  const px = x + Math.round(age * 6);
  const py = y + Math.round(age * 5);
  ctx.fillStyle = c.cloud;
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.floor(Math.sqrt(r * r - dy * dy));
    for (let dx = -half; dx <= half; dx++) if ((dx + dy + Math.floor(age * 10)) % 2 === 0) ctx.fillRect(px + dx, py + dy, 1, 1);
  }
};

// ---- speed lines on the kick, streaking out from the vanishing point ----

const speedLines = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  if (f.kick < 0.3) return;
  const v = viewOf(f);
  const n = Math.floor(f.beat * 4);
  const count = Math.round(f.kick * 10);
  for (let i = 0; i < count; i++) {
    const a = Math.PI * (0.05 + rand(n, i) * 0.9);
    const side = i % 2 === 0 ? 1 : -1;
    const dx = Math.cos(a) * side;
    const dy = Math.sin(a) * 0.6;
    const r0 = f.w * (0.35 + rand(n, i + 50) * 0.3);
    const len = 8 + f.kick * 18;
    pixelLine(ctx, v.cx + dx * r0, v.horizon + dy * r0, v.cx + dx * (r0 + len), v.horizon + dy * (r0 + len), c.white);
  }
};

// ---- the HUD: score, time, lap, speed ----

const speedOf = (f: Frame): number => Math.round(236 + f.energy * 40 + f.kick * 14 + Math.sin(f.t * 1.7) * 4);

const hud = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const v = viewOf(f);
  drawTextOutlined(ctx, 'SCORE', 4, 4, c.hud, c.ink);
  drawTextOutlined(ctx, digits(Math.max(0, f.beat) * 1530, 7), 4, 13, c.white, c.ink);
  const left = 60 - (Math.floor(Math.max(0, f.beat) / 2) % 60);
  drawTextOutlined(ctx, 'TIME', Math.round(v.cx - textWidth('TIME') / 2), 3, c.hud, c.ink);
  if (left > 10 || frac(f.t * 2) < 0.6) bigText(ctx, String(left), v.cx, 12, 2, c.white, c.ink);
  drawTextOutlined(ctx, 'LAP', f.w - 4 - textWidth('LAP 2/3'), 4, c.hud, c.ink);
  drawTextOutlined(ctx, '2/3', f.w - 4 - textWidth('2/3'), 13, c.white, c.ink);
  speedometer(ctx, f, v, c);
};

const speedometer = (ctx: Ctx, f: Frame, v: View, c: Colors<K>): void => {
  const speed = speedOf(f);
  const right = f.w - 4;
  const y = v.wide ? f.h - 22 : f.h - 21;
  const x = v.wide ? right - 52 : Math.round(v.cx - 22);
  bigText(ctx, String(speed), x + 10, y, 2, c.white, c.ink);
  drawTextOutlined(ctx, 'KM/H', x + 30, y + 7, c.hud, c.ink);
  const lit = Math.round(((speed - 220) / 70) * 10);
  for (let i = 0; i < 10; i++) {
    fillRect(ctx, c.ink, x - 4 + i * 5, y + 16, 4, 3);
    fillRect(ctx, i < lit ? (i > 7 ? c.rumble : c.hud) : c.roadLo, x - 3 + i * 5, y + 17, 2, 1);
  }
};

export const horizonDrive = defineScene<K>({
  id: 'horizon-drive',
  title: 'Horizon Drive',
  mood: { valence: 0.6, energy: 0.75 },
  styles: ['neon-rush', 'nineties-pop', 'city-lights', 'grand-field', 'fusion-drive', 'eurobeat'],
  variants: [
    {
      mood: { valence: 0.6, energy: 0.75 },
      colors: {
        sky0: '#2a1a5a',
        sky1: '#c04a7a',
        sky2: '#ffb060',
        sun: '#fff0a0',
        halo: '#ffd070',
        cloud: '#ff9a9a',
        star: '#ffd8e8',
        far: '#7a3a7a',
        near: '#4a2050',
        city: '#5a2a60',
        window: '#ffd890',
        side: '#e0a060',
        sideLo: '#c88050',
        rumble: '#ff3a4a',
        road: '#5a4a6a',
        roadLo: '#52425f',
        line: '#fff0e0',
        palm: '#2a1030',
        palmHi: '#5a2a4a',
        trunk: '#3a1a30',
        lamp: '#ffe0a0',
        sign: '#ffd040',
        ink: '#140a18',
        white: '#ffffff',
        hud: '#ffd040',
      },
    },
    {
      mood: { valence: -0.3, energy: 0.85 },
      colors: {
        sky0: '#04061a',
        sky1: '#0e1440',
        sky2: '#2a2a6a',
        sun: '#e8ecff',
        halo: '#4a5aa0',
        cloud: '#3a4a7a',
        star: '#c8d8ff',
        far: '#10183a',
        near: '#0a1028',
        city: '#141c40',
        window: '#ffe07a',
        side: '#142a3a',
        sideLo: '#10202e',
        rumble: '#ff3a6a',
        road: '#2a2a40',
        roadLo: '#26263a',
        line: '#e0e8ff',
        palm: '#060a18',
        palmHi: '#1a2a4a',
        trunk: '#0a0e20',
        lamp: '#fff0b0',
        sign: '#ffc83a',
        ink: '#04040c',
        white: '#ffffff',
        hud: '#4ae0ff',
      },
    },
    {
      mood: { valence: 0.8, energy: 0.4 },
      colors: {
        sky0: '#4a7ad8',
        sky1: '#f0a0b0',
        sky2: '#ffe0a0',
        sun: '#fffbe0',
        halo: '#fff0b0',
        cloud: '#fff0f0',
        star: '#4a7ad8',
        far: '#c06a5a',
        near: '#a0504a',
        city: '#c06a5a',
        window: '#c06a5a',
        side: '#f0c080',
        sideLo: '#e0b070',
        rumble: '#e03a3a',
        road: '#7a6a7a',
        roadLo: '#746474',
        line: '#ffffff',
        palm: '#3a8a4a',
        palmHi: '#7ac06a',
        trunk: '#8a5a3a',
        lamp: '#fff8e0',
        sign: '#ffd040',
        ink: '#1a1018',
        white: '#ffffff',
        hud: '#ffffff',
      },
    },
  ],
  layers: [sky, land, road, things, car, speedLines, hud],
});
