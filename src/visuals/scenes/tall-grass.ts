// A summer route at sunset: a girl in a red cap walks through swaying tall grass under a towering thundercloud,
// past power lines and a route sign, while small round creatures peek out of the grass and one is startled on each bar.
import { type Ctx, drawSprite, drawSpriteFoot, fillRect, flipped, mixColor, type Palette, type Sprite } from 'mojipx';
import { bayer, disc, ditherGradient, frac, hexToRgb, memoCanvas, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { wrap } from './batch-1-helpers.ts';
import { paletteOf, sigOf } from './batch-3-helpers.ts';
import { drawText, fractal2, memoLayer, noise2, sunWithHalo, textWidth, tinted } from './batch-4-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sky3'
  | 'sun'
  | 'cloudLit'
  | 'cloudMid'
  | 'cloudShade'
  | 'far'
  | 'mid'
  | 'midLo'
  | 'pole'
  | 'field'
  | 'grassLo'
  | 'grass'
  | 'grassHi'
  | 'tip'
  | 'mote'
  | 'tint'
  | 'ink';

// ---- sprites (drawn facing left, flipped to walk right) ----

const GIRL_A: Sprite = [
  '............oooooooo............',
  '..........ooccCCcccoo...........',
  '.........occCCcccccccoo.........',
  '........occCcccxxxccccco........',
  '.......occccccxxxxxcccccco......',
  '.......occcccccxxxcccccccRo.....',
  '......occcccccccccccccccRRo.....',
  '.oooooooRRRRRRRRRRRRRRRRRRo.....',
  'occcccccoooooooooooooooooooo....',
  '....ohhhhhhhhhhhhhhhhhhhho......',
  '...ohhHHhhhhhhhhhhhhhhhhhho.....',
  '...ohHHhhhhhhhhhhhhhhhHhhho.....',
  '...ohhhhhohhhhhhohhhhhhHdhhoo...',
  '...ohhhhossshhhhsshhhhhhdhhhho..',
  '...ohhhosssssshssssshhhhdhhhhho.',
  '...ohhsoooosssoooosshhhdhhhhhho.',
  '...ohhowweessswweeshhhdhhhhhhho.',
  '...ohsoweeesssweesshhdhhhhhhhho.',
  '...ohsoeiiessseiieshddhhhhhhhho.',
  '...ohssoiiosssoiiosshdhhhhhhhhdo',
  '...ohhsbbsssssssbbsshdhhhhhhhhdo',
  '...ohhssssssoossssshhdhhhhhhhhdo',
  '....ohhsssssssssssohhdhhhhhhhdo.',
  '....ohoossssssssooohhhhhhhhhoo..',
  '....oho.oossssooo.oooooooooo....',
  '........ottttttoo...............',
  '.......ovvtTtttTvvvmmo..........',
  '......ovvvtTTTTtvvvmmo..........',
  '.....ovvvvttTTttvvmmvvo.........',
  '.....ottttvttttvvvmmvvvo........',
  '....ottsstvvttvvvmmvvvvo........',
  '....otsssovvvvvvvmmvvvvvo.......',
  '....ossssovvvvvmmVvvaaaao.......',
  '....ossso.ovvvvmmVvaAAAaao......',
  '.....ooo..ovvvmmVVvaAaaaao......',
  '..........ovvmmVVVvaaaaaao......',
  '..........oppppppppaaaaao.......',
  '..........opppppppppoooo........',
  '..........oppppPPPpppo..........',
  '..........opppo.oPPppo..........',
  '..........osso...osso...........',
  '..........osso...osso...........',
  '..........osso...osso...........',
  '..........osso...osso...........',
  '..........osso...osso...........',
  '..........okko...okko...........',
  '.........offfo..offfo...........',
  '.........ooooo..ooooo...........',
];
const GIRL_B: Sprite = [
  '............oooooooo............',
  '..........ooccCCcccoo...........',
  '.........occCCcccccccoo.........',
  '........occCcccxxxccccco........',
  '.......occccccxxxxxcccccco......',
  '.......occcccccxxxcccccccRo.....',
  '......occcccccccccccccccRRo.....',
  '.oooooooRRRRRRRRRRRRRRRRRRo.....',
  'occcccccoooooooooooooooooooo....',
  '....ohhhhhhhhhhhhhhhhhhhho......',
  '...ohhHHhhhhhhhhhhhhhhhhhho.....',
  '...ohHHhhhhhhhhhhhhhhhHhhho.....',
  '...ohhhhhohhhhhhohhhhhhHdhhoo...',
  '...ohhhhossshhhhsshhhhhhdhhhho..',
  '...ohhhosssssshssssshhhhdhhhhho.',
  '...ohhsoooosssoooosshhhdhhhhhho.',
  '...ohhowweessswweeshhhdhhhhhhho.',
  '...ohsoweeesssweesshhdhhhhhhhho.',
  '...ohsoeiiessseiieshddhhhhhhhho.',
  '...ohssoiiosssoiiosshdhhhhhhhhdo',
  '...ohhsbbsssssssbbsshdhhhhhhhhdo',
  '...ohhssssssoossssshhdhhhhhhhhdo',
  '....ohhsssssssssssohhdhhhhhhhdo.',
  '....ohoossssssssooohhhhhhhhhoo..',
  '....oho.oossssooo.oooooooooo....',
  '........ottttttoo...............',
  '.......ovvtTtttTvvvmmo..........',
  '......ovvvtTTTTtvvvmmo..........',
  '.....ovvvvttTTttvvmmvvo.........',
  '.....ottttvttttvvvmmvvvo........',
  '.....ottttvvttvvvmmvvvvo........',
  '......otttvvvvvvvmmvvvvvo.......',
  '........otvvvvvmmVvvaaaao.......',
  '..........ovvvvmmVvaAAAaao......',
  '..........ovvvmmVVvaAaaaao......',
  '..........ovvmmVVVvaaaaaao......',
  '..........oppppppppaaaaao.......',
  '..........opppppppppoooo........',
  '..........oppppPPPpppo..........',
  '..........opppo.oPPppo..........',
  '...........osso.osso............',
  '...........osso.osso............',
  '............osso.osso...........',
  '............osso.osso...........',
  '............osso..osso..........',
  '............okko..okko..........',
  '...........offfo..offfo.........',
  '...........ooooo..ooooo.........',
];

const PUFF: Sprite = [
  '.oo..........oo.',
  'oEEo........oEEo',
  'oEEcoooooooocEEo',
  '.occCCccccCCcco.',
  'occCCccccccCCcco',
  'occckwccccwkccco',
  'occckkcccckkccco',
  'occckkcccckkccco',
  'ocpccccmmccccpco',
  'occcccccccccccco',
  '.occcccccccccco.',
  '..oooooooooooo..',
];
const SPROUT: Sprite = [
  '.......ooo......',
  '......oLLLo.oo..',
  '.......oLloLLo..',
  '........ooLlo...',
  '...oooooooooo...',
  '..oGGggggggGGo..',
  '.oGGggggggggGGo.',
  'oGggggggggggggGo',
  'oggkwggggggwkggo',
  'oggkkggggggkkggo',
  'oggkkggggggkkggo',
  'ogpggggmmggggpgo',
  '.oggggggggggggo.',
  '..oooooooooooo..',
];
const CHICK: Sprite = [
  '.......oo.......',
  '......oYYo......',
  '...oooooooooo...',
  '..oYYYYYYYYYYo..',
  '.oYYYYYYYYYYYYo.',
  'oYYwkYYYYYYkwYYo',
  'oYYkkYYYYYYkkYYo',
  'oYpYYYoRRoYYYpYo',
  'oyYYYYYooYYYYYyo',
  '.oyyYYYYYYYYyyo.',
  '..oyyyyyyyyyyo..',
  '...oooooooooo...',
];
const BANG: Sprite = ['.ooooo.', 'owwwwwo', 'owwrwwo', 'owwrwwo', 'owwrwwo', 'owwwwwo', 'owwrwwo', '.ooooo.', '...oo..', '...o...'];

// o outline, c/C/R cap, x its badge, h/H/d hair, s/S skin, b blush, e eye, i iris, w light, t/T tee, v/V vest,
// a/A satchel, m strap, p/P shorts, k socks, f shoes.
const GIRL_COLORS: Palette = {
  o: '#2a1820',
  c: '#e03a3a',
  C: '#ff7a6a',
  R: '#a02030',
  x: '#ffffff',
  h: '#3a3458',
  H: '#6a6aa8',
  d: '#241e38',
  s: '#ffe0c8',
  S: '#e8b098',
  b: '#ff9cac',
  e: '#2a1830',
  i: '#3a8ad8',
  w: '#ffffff',
  t: '#ffd84a',
  T: '#e0a020',
  v: '#3a9a4a',
  V: '#24703a',
  a: '#a8683a',
  A: '#d89a5a',
  m: '#6a3a1a',
  p: '#8a6a4a',
  P: '#5a4430',
  k: '#ffffff',
  f: '#e03a3a',
};

const CRITTER_COLORS: Palette = {
  o: '#2a1820',
  E: '#e8a0b0',
  c: '#fff4e0',
  C: '#ffffff',
  k: '#2a1820',
  w: '#ffffff',
  p: '#ff9cac',
  m: '#c05060',
  L: '#7ad860',
  l: '#4a9a40',
  G: '#a8f08a',
  g: '#5ac85a',
  Y: '#ffd84a',
  y: '#e0a020',
  R: '#ff8a3a',
  r: '#e03040',
};

const blinkOf = (sprite: Sprite): Sprite =>
  sprite.map((row, y) => (y >= 16 && y <= 19 ? row.replace(/[wei]/g, y === 18 ? 'o' : 's') : row));

const WALK: readonly Sprite[] = [GIRL_A, GIRL_B].map(flipped);
const WALK_SHUT: readonly Sprite[] = [GIRL_A, GIRL_B].map((s) => flipped(blinkOf(s)));
const CRITTERS: readonly Sprite[] = [PUFF, SPROUT, CHICK];

// Palette builders live at module level: palettes are cached per builder and color set.
const girlColors = (k: Colors<K>): Palette => tinted(GIRL_COLORS, k.tint, 0.15);
const critterColors = (k: Colors<K>): Palette => tinted(CRITTER_COLORS, k.tint, 0.08);
const bangColors = (k: Colors<K>): Palette => ({ o: k.ink, w: '#ffffff', r: '#e03040' });
const dragonflyColors = (k: Colors<K>): Palette => ({ w: mixColor('#ffffff', k.tint, 0.3), r: '#d8402a', h: '#7a1a10' });

const girlPalette = (c: Colors<K>): Palette => paletteOf(c, girlColors);
const critterPalette = (c: Colors<K>): Palette => paletteOf(c, critterColors);

// ---- layout ----

type Layout = {
  readonly wide: boolean;
  readonly horizon: number;
  readonly sunX: number;
  readonly sunY: number;
  readonly sunR: number;
  readonly cloudX: number;
  readonly cloudBase: number;
  readonly cloudH: number;
  readonly girlX: number;
  readonly girlFoot: number;
};

const layoutOf = (f: Frame): Layout => {
  const s = Math.min(f.w, f.h);
  if (f.w > f.h) {
    const horizon = Math.round(f.h * 0.58);
    return {
      wide: true,
      horizon,
      sunX: Math.round(f.w * 0.8),
      sunY: horizon - Math.round(f.h * 0.06),
      sunR: Math.round(s * 0.07),
      cloudX: Math.round(f.w * 0.3),
      cloudBase: horizon - Math.round(f.h * 0.03),
      cloudH: Math.round(f.h * 0.54),
      girlX: Math.round(f.w * 0.42),
      girlFoot: Math.round(f.h * 0.9),
    };
  }
  const horizon = Math.round(f.h * 0.68);
  return {
    wide: false,
    horizon,
    sunX: Math.round(f.w * 0.8),
    sunY: horizon - Math.round(f.h * 0.04),
    sunR: Math.round(s * 0.08),
    cloudX: Math.round(f.w * 0.46),
    cloudBase: horizon - Math.round(f.h * 0.06),
    cloudH: Math.round(f.h * 0.48),
    girlX: Math.round(f.w * 0.44),
    girlFoot: Math.round(f.h * 0.91),
  };
};

/** Pixels the ground at the girl's depth slides by per beat: she takes a step on every beat. */
const PACE = 7;

/** How far a layer moving at `speed` (a share of the girl's pace) has slid. */
const slid = (f: Frame, speed: number): number => Math.max(0, f.beat) * PACE * speed;

// ---- sky and the thundercloud ----

const skyLayer = (f: Frame, l: Layout, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`grass-sky:${sigOf(c)}`, f.w, f.h, (g) => {
    g.drawImage(ditherGradient(f.w, l.horizon + 4, [c.sky0, c.sky1, c.sky2, c.sky3]), 0, 0);
    sunWithHalo(g, l.sunX, l.sunY, l.sunR, c.sun, c.sun, 3.5);
  });

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(skyLayer(f, layoutOf(f), c), 0, 0);
};

// The cloud's silhouette: half its width at each height (0 top … 1 bottom) — an anvil on top, a column, a broad base.
const PROFILE: readonly (readonly [number, number])[] = [
  [0, 0.16],
  [0.05, 0.4],
  [0.13, 0.46],
  [0.22, 0.27],
  [0.45, 0.25],
  [0.7, 0.33],
  [0.88, 0.44],
  [1, 0.46],
];

const halfWidthAt = (v: number): number => {
  const i = Math.max(
    1,
    PROFILE.findIndex(([at]) => at >= v),
  );
  const [v0, w0] = PROFILE[i - 1] as readonly [number, number];
  const [v1, w1] = PROFILE[i] as readonly [number, number];
  return w0 + ((w1 - w0) * (v - v0)) / Math.max(0.001, v1 - v0);
};

// How lit a point of the cloud is (null outside it): the sun side and the tops of the cauliflower bumps catch the light,
// the flat base sits in shadow.
const cloudLight = (px: number, py: number, w: number, h: number, light: number): number | null => {
  const u = px / w;
  const v = py / h;
  const centre = 0.5 + (0.5 - v) * 0.1 * light;
  const half = halfWidthAt(v) + (fractal2(px / 12, py / 12, 23) - 0.5) * 0.14;
  const side = (u - centre) / Math.max(0.05, half);
  if (Math.abs(side) > 1 || v > 0.96 || v < 0.02 + fractal2(px / 7, 0, 29) * 0.05) return null;
  const bumps = noise2(px / 13, py / 11, 31) - 0.5;
  return side * light * 0.6 + (0.5 - v) * 0.35 + bumps * 0.7 + (v > 0.86 ? -0.5 : 0);
};

const cloudCanvas = (w: number, h: number, light: number, c: Colors<K>): HTMLCanvasElement =>
  memoCanvas(`b4grass-cloud:${w}x${h}:${light}:${c.cloudLit}:${c.cloudMid}:${c.cloudShade}`, w, h, (img) => {
    const tones = [c.cloudShade, c.cloudMid, c.cloudLit].map(hexToRgb);
    for (let py = 0; py < h; py++)
      for (let px = 0; px < w; px++) {
        const lit = cloudLight(px, py, w, h, light);
        if (lit === null) continue;
        const v = lit + (bayer(px, py) - 0.5) * 0.16;
        const rgb = tones[v > 0.2 ? 2 : v > -0.12 ? 1 : 0] as readonly [number, number, number];
        img.data.set([rgb[0], rgb[1], rgb[2], 255], (py * w + px) * 4);
      }
  });

const thundercloud = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const h = l.cloudH;
  const w = Math.round(Math.min(h * 0.9, f.w * (l.wide ? 0.5 : 0.95)));
  const cloud = cloudCanvas(w, h, l.sunX > l.cloudX ? 1 : -1, c);
  const drift = Math.sin(f.t * 0.05) * 6;
  ctx.drawImage(cloud, Math.round(l.cloudX - w / 2 + drift), l.cloudBase - h);
};

// ---- the land, far to near: repeating tiles that slide at their own pace ----

const tileX = (ctx: Ctx, f: Frame, tile: HTMLCanvasElement, y: number, speed: number): void => {
  const start = -Math.round(wrap(slid(f, speed), tile.width));
  for (let x = start; x < f.w; x += tile.width) ctx.drawImage(tile, x, y);
};

const ridge = (x: number, period: number, seed: number, cells: number): number =>
  noise2((x / period) * cells, 0.5, seed, cells) * 0.7 + noise2((x / period) * cells * 3, 0.5, seed + 5, cells * 3) * 0.3;

const farTile = (h: number, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`grass-far:${c.far}`, 320, h, (g) => {
    g.fillStyle = c.far;
    for (let x = 0; x < 320; x++) {
      const top = Math.round(h * 0.15 + ridge(x, 320, 7, 5) * h * 0.85 * 0.6);
      g.fillRect(x, top, 1, h - top);
    }
  });

const midTile = (h: number, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`grass-mid:${c.mid}:${c.midLo}`, 288, h, (g) => {
    for (let x = 0; x < 288; x++) {
      const top = Math.round(h * 0.45 + ridge(x, 288, 11, 4) * h * 0.4);
      g.fillStyle = c.mid;
      g.fillRect(x, top, 1, h - top);
    }
    for (let k = 0; k < 14; k++) {
      const x = Math.round((k + rand(k, 5) * 0.6) * (288 / 14));
      const top = Math.round(h * 0.45 + ridge(x, 288, 11, 4) * h * 0.4);
      const r = 3 + Math.round(rand(k, 6) * 4);
      disc(g, x, top - r + 2, r, () => c.midLo);
      g.fillStyle = c.midLo;
      g.fillRect(x, top - 1, 1, 3);
    }
  });

const land = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const farH = Math.round(f.h * 0.09);
  tileX(ctx, f, farTile(farH, c), l.horizon - farH + 2, 0.08);
  const midH = Math.round(f.h * 0.1);
  tileX(ctx, f, midTile(midH, c), l.horizon - midH + 6, 0.2);
};

// Wooden poles marching along the field with three sagging wires between each pair.
const POLE_GAP = 150;

const poleTile = (top: number, base: number, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`grass-poles:${top}:${base}:${c.pole}`, POLE_GAP, base + 1, (g) => {
    g.fillStyle = c.pole;
    g.fillRect(20, top, 2, base - top);
    g.fillRect(12, top + 3, 18, 2);
    g.fillRect(14, top + 9, 14, 1);
    for (const [dx, dy] of [
      [-8, 2],
      [8, 2],
      [-6, 8],
    ] as const) {
      g.fillRect(21 + dx, top + dy - 1, 1, 1);
      for (let x = 0; x < POLE_GAP; x++) {
        const u = x / POLE_GAP;
        g.fillRect(wrap(21 + dx + x, POLE_GAP), Math.round(top + dy + 9 * 4 * u * (1 - u)), 1, 1);
      }
    }
  });

const poles = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const top = Math.round(l.horizon - f.h * (l.wide ? 0.36 : 0.26));
  tileX(ctx, f, poleTile(top, l.horizon + 4, c), 0, 0.4);
};

const fieldTile = (w: number, h: number, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`grass-field:${sigOf(c)}`, w, h, (g) => {
    g.drawImage(ditherGradient(w, h, [c.field, c.grass, c.grassLo]), 0, 0);
    for (let i = 0; i < w; i++) {
      const y = Math.floor(rand(i, 41) ** 0.7 * h);
      const x = Math.floor(rand(i, 42) * w);
      const tall = 1 + Math.round((y / h) * 3);
      g.fillStyle = i % 3 === 0 ? c.grassHi : c.grassLo;
      g.fillRect(x, y - tall, 1, tall);
    }
  });

const field = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  tileX(ctx, f, fieldTile(128, f.h - l.horizon, c), l.horizon, 0.6);
};

// A route sign comes by now and then.
const SIGN_GAP = 520;

const sign = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const x = Math.round(wrap(f.w * 0.9 - slid(f, 0.85), SIGN_GAP + f.w) - 30);
  const base = Math.round(l.horizon + (l.girlFoot - l.horizon) * 0.55);
  const text = 'RT 7';
  const bw = textWidth(text) + 8;
  fillRect(ctx, c.ink, x - 2, base - 30, 4, 30);
  fillRect(ctx, c.pole, x - 1, base - 30, 2, 30);
  fillRect(ctx, c.ink, x - bw / 2 - 1, base - 36, bw + 2, 13);
  fillRect(ctx, c.tip, x - bw / 2, base - 35, bw, 11);
  fillRect(ctx, c.pole, x - bw / 2, base - 26, bw, 2);
  drawText(ctx, text, Math.round(x - bw / 2 + 4), base - 34, c.ink);
};

// ---- grass blades: stacked segments that lean further toward the tip, swayed by a wind wave ----

type Blades = {
  readonly base: number;
  /** Width at the root; blades taper by a pixel per piece. */
  readonly wide: number;
  /** How far the tips swing. */
  readonly sway: number;
  readonly minH: number;
  readonly maxH: number;
  readonly step: number;
  /** A share of the girl's pace. */
  readonly speed: number;
  readonly seed: number;
};

// A blade in four stacked pieces that narrow and bend further toward the tip, its sunny edge picked out.
const BLADE_BEND = [0, 0.12, 0.4, 1] as const;

const blade = (ctx: Ctx, x: number, base: number, h: number, lean: number, color: string, tip: string, wide: number): void => {
  const piece = Math.max(1, Math.round(h / 4));
  BLADE_BEND.forEach((bend, k) => {
    const w = Math.max(1, wide - k);
    const px = x + Math.round(lean * bend);
    const py = base - (k + 1) * piece;
    fillRect(ctx, color, px, py, w, piece);
    if (w > 1) fillRect(ctx, tip, px + w - 1, py, 1, piece);
  });
  fillRect(ctx, tip, x + Math.round(lean), base - 4 * piece, 1, 1);
};

const drawBlades = (ctx: Ctx, f: Frame, b: Blades, tones: readonly string[], tip: string): void => {
  const scroll = slid(f, b.speed);
  const first = Math.floor(scroll / b.step) - 3;
  for (let k = first; k <= first + Math.ceil(f.w / b.step) + 6; k++) {
    const x = Math.round(k * b.step - scroll + rand(k, b.seed) * b.step);
    const giant = rand(k, b.seed + 2) < 0.03 ? 1.8 : 1;
    const h = (b.minH + rand(k, b.seed + 1) * (b.maxH - b.minH)) * giant;
    const lean = (Math.sin(f.t * 1.9 - k * b.step * 0.03) * b.sway + b.sway * 0.6) * (h / b.maxH);
    blade(ctx, x, b.base, h, lean, tones[k % tones.length] as string, tip, b.wide);
  }
};

// Behind her: a lit row the creatures hide in.
const backBlades = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const b = { base: l.girlFoot - 10, wide: 1, sway: 2.4, minH: 7, maxH: 15, step: 2, speed: 0.95, seed: 51 };
  drawBlades(ctx, f, b, [c.grass, c.grassHi, c.grass], c.tip);
};

// In front of her: a row up to her waist, the mass of grass below it, and tall dark blades close to the lens.
const frontBlades = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const below = f.h - l.girlFoot;
  fillRect(ctx, c.grassLo, 0, l.girlFoot - 2, f.w, below + 2);
  drawBlades(
    ctx,
    f,
    { base: l.girlFoot + 2, wide: 2, sway: 2.6, minH: 9, maxH: 17, step: 2, speed: 1.05, seed: 61 },
    [c.grass, c.grassLo, c.grass],
    c.tip,
  );
  const near = { base: f.h + 2, wide: 4, sway: 6, minH: below - 2, maxH: below + 12, step: 6, speed: 1.5, seed: 67 };
  drawBlades(ctx, f, near, [c.grassLo, c.grass, c.grassLo], c.grassHi);
};

// ---- creatures peeking out of the grass ----

const CRITTER_GAP = 64;

type Critter = { readonly k: number; readonly x: number };

const crittersAt = (f: Frame, beat: number): readonly Critter[] => {
  const scroll = Math.max(0, beat) * PACE * 0.95;
  const first = Math.floor(scroll / CRITTER_GAP) - 1;
  const out: Critter[] = [];
  for (let k = first; k <= first + Math.ceil(f.w / CRITTER_GAP) + 2; k++) {
    if (rand(k, 71) < 0.35) continue;
    out.push({ k, x: Math.round(k * CRITTER_GAP + rand(k, 72) * 30 - scroll) });
  }
  return out;
};

// The startled one: the creature just ahead of the girl when the bar began (so it stays the same all bar).
const startledOf = (f: Frame, l: Layout): number | undefined => {
  const barStart = Math.floor(Math.max(0, f.beat) / 4) * 4;
  return crittersAt(f, barStart).find((cr) => cr.x > l.girlX + 18 && cr.x < l.girlX + 140)?.k;
};

// Where a creature's feet are: low in the grass, rising to peek out now and then; the startled one jumps.
const critterFoot = (f: Frame, l: Layout, cr: Critter, startled: boolean): number => {
  const peek = Math.max(0, Math.min(1, Math.sin(f.t * 0.9 + cr.k * 2.3) * 1.6 + 0.5));
  const hop = startled ? Math.round(Math.sin(Math.min(1, frac(f.beat / 4) * 4) * Math.PI) * 6) + 3 : 0;
  return l.girlFoot - 6 - Math.round((startled ? 1 : peek) * 12) - hop;
};

const critterSprite = (cr: Critter): Sprite => CRITTERS[Math.floor(rand(cr.k, 73) * CRITTERS.length)] as Sprite;

const critters = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const startled = startledOf(f, l);
  for (const cr of crittersAt(f, f.beat)) {
    drawSpriteFoot(ctx, critterSprite(cr), critterPalette(c), cr.x, critterFoot(f, l, cr, cr.k === startled));
  }
};

const bang = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const k = startledOf(f, l);
  const startled = crittersAt(f, f.beat).find((cr) => cr.k === k);
  const age = frac(f.beat / 4) * 4;
  if (!startled || age > 2.2) return;
  const pop = age < 0.15 ? Math.round((age / 0.15) * 4) : 4;
  const top = critterFoot(f, l, startled, true) - critterSprite(startled).length;
  drawSpriteFoot(ctx, BANG, paletteOf(c, bangColors), startled.x + 6, top - 1 - pop);
};

// ---- the girl ----

const girl = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const step = Math.floor(f.beat) % 2;
  const bob = frac(f.beat) < 0.5 ? 0 : 1;
  const shut = frac(f.t / 3.3) > 0.95;
  const sprite = (shut ? WALK_SHUT : WALK)[step] as Sprite;
  drawSpriteFoot(ctx, sprite, girlPalette(c), l.girlX, l.girlFoot + bob);
};

// Red dragonflies hover around her, darting now and then; at dusk the motes become fireflies.
const DRAGONFLY: readonly Sprite[] = [
  ['w.w....', '.w.w...', 'rrrrrrh', '.w.w...', 'w.w....'],
  ['.......', 'ww.ww..', 'rrrrrrh', 'ww.ww..', '.......'],
];

const dragonflies = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const palette = paletteOf(c, dragonflyColors);
  for (let i = 0; i < 2; i++) {
    const dart = Math.floor(f.t * 0.6 + i * 0.5);
    const x = l.girlX + 20 + i * 26 + Math.sin(f.t * 0.7 + i * 2) * 22 + (rand(dart, i + 81) - 0.5) * 20;
    const y = l.girlFoot - 62 - i * 14 + Math.sin(f.t * 1.3 + i) * 8 + (rand(dart, i + 82) - 0.5) * 10;
    drawSprite(ctx, DRAGONFLY[Math.floor(f.t * 24 + i) % 2] as Sprite, palette, Math.round(x), Math.round(y));
  }
};

const motes = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  for (let i = 0; i < 18; i++) {
    const x = Math.round(wrap(rand(i, 91) * f.w - f.t * (4 + rand(i, 92) * 6), f.w));
    const y = Math.round(l.horizon + rand(i, 93) * (f.h - l.horizon) * 0.8 + Math.sin(f.t * 0.9 + i * 1.7) * 5);
    if (Math.sin(f.t * (1.5 + rand(i, 94)) + i) < -0.2) continue;
    fillRect(ctx, c.mote, x, y, 1, 1);
    if (i % 4 === 0) {
      fillRect(ctx, c.mote, x - 1, y, 3, 1);
      fillRect(ctx, c.mote, x, y - 1, 1, 3);
    }
  }
};

export const tallGrass = defineScene<K>({
  id: 'tall-grass',
  title: 'Tall Grass',
  mood: { valence: 0.5, energy: 0 },
  styles: ['grand-field', 'cozy-village', 'nineties-pop', 'band-rock', 'celtic-isle'],
  variants: [
    {
      mood: { valence: 0.45, energy: -0.05 },
      colors: {
        sky0: '#3a3c8a',
        sky1: '#9a5aa0',
        sky2: '#f08078',
        sky3: '#ffc880',
        sun: '#fff0b8',
        cloudLit: '#ffd8a8',
        cloudMid: '#f0a0a0',
        cloudShade: '#9a78b8',
        far: '#8a6aa8',
        mid: '#5a6a7a',
        midLo: '#3e4a5e',
        pole: '#3a2a3a',
        field: '#c0a868',
        grassLo: '#3a5a2a',
        grass: '#6a8a34',
        grassHi: '#a8b850',
        tip: '#ffd890',
        mote: '#fff0c0',
        tint: '#ff9a6a',
        ink: '#2a1820',
      },
    },
    {
      mood: { valence: 0.7, energy: 0.35 },
      colors: {
        sky0: '#2a70e0',
        sky1: '#4a98f0',
        sky2: '#8ac8ff',
        sky3: '#d8f0ff',
        sun: '#ffffff',
        cloudLit: '#ffffff',
        cloudMid: '#e0ecf8',
        cloudShade: '#a8bcd8',
        far: '#7aa0d0',
        mid: '#4a9a5a',
        midLo: '#2e7a44',
        pole: '#4a3a3a',
        field: '#a8d870',
        grassLo: '#2a7a34',
        grass: '#4aa83a',
        grassHi: '#8ad84a',
        tip: '#d8f8a0',
        mote: '#ffffff',
        tint: '#fff8e8',
        ink: '#1e1820',
      },
    },
    {
      mood: { valence: 0.1, energy: -0.45 },
      colors: {
        sky0: '#0e1440',
        sky1: '#24306e',
        sky2: '#5a4a8a',
        sky3: '#e08a7a',
        sun: '#ffc8a0',
        cloudLit: '#d890a0',
        cloudMid: '#6a5a96',
        cloudShade: '#34386e',
        far: '#3a3a74',
        mid: '#24304e',
        midLo: '#18203a',
        pole: '#10101e',
        field: '#3a5a5a',
        grassLo: '#142a2a',
        grass: '#22443a',
        grassHi: '#3a6a4a',
        tip: '#e8a888',
        mote: '#d8ff7a',
        tint: '#3a4a8a',
        ink: '#0a0a14',
      },
    },
  ],
  layers: [sky, thundercloud, land, poles, field, sign, critters, backBlades, girl, dragonflies, frontBlades, bang, motes],
});
