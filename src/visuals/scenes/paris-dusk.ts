// Paris from a cafe terrace on the quay: the Eiffel Tower lit gold and sparkling on the beat while its beacon sweeps
// the sky, a stone bridge with lamps, a tour boat gliding down the Seine, and the whole view trembling in the water.
import { type Ctx, drawSprite, fillRect, type Sprite } from 'mojipx';
import { bayer, ditherGradient, frac, hexToRgb, memoCanvas, noise1, rand, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { drawGlow, paletteBy, type Rgb, setPixel, spanDisc, wrap } from './batch-1-helpers.ts';
import { festoon, frameLayer, glints, lightStreak, mirrorWater, twinkle, wideOf } from './batch-6-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sky3'
  | 'star'
  | 'beam'
  | 'iron'
  | 'ironHi'
  | 'ironLo'
  | 'facade'
  | 'facadeLo'
  | 'roof'
  | 'win'
  | 'lampHi'
  | 'glow'
  | 'stone'
  | 'stoneLo'
  | 'water0'
  | 'water1'
  | 'awning'
  | 'awningLo'
  | 'cream'
  | 'dark'
  | 'wine';

// g glass frame, w lit cabin, p passengers, f flag, c white hull band, d dark hull.
const BOAT: Sprite = [
  '.ff...........................................',
  '.fd...........................................',
  '..d...gggggggggggggggggggggggggggggggggggg....',
  '....ggwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwgg..',
  '...gwwpwwwpwwwwpwwwpwwwwpwwwpwwwwpwwwpwwwwwwg.',
  '..gwwpppwpppwwpppwpppwwpppwpppwwpppwpppwwwwwwg',
  '.ccccccccccccccccccccccccccccccccccccccccccccc',
  'ccccccccccccccccccccccccccccccccccccccccccccc.',
  '.ddddddddddddddddddddddddddddddddddddddddddd..',
];

// g glass, h glint, w wine.
const GLASS: Sprite = [
  '.g.....g.',
  '.h.....g.',
  '.h.....g.',
  '.hwwwwwg.',
  '.hwwwwwg.',
  '..gwwwg..',
  '...ggg...',
  '....g....',
  '....g....',
  '....g....',
  '....g....',
  '...ggg...',
  '..ggggg..',
];

// r rose, R its light, s stem, g bud vase.
const VASE: Sprite = ['.rr.', 'rRrr', '.rr.', '..s.', '.ss.', '..s.', '.gg.', 'gggg', 'gggg', '.gg.'];

// g jar, c candle.
const CANDLE: Sprite = ['g.....g', 'g.....g', 'g.ccc.g', 'g.ccc.g', 'gcccccg', 'gcccccg', 'ggggggg'];

const boatPalette = paletteBy<K>((c) => ({ g: c.stoneLo, w: c.win, p: c.dark, f: c.awning, c: c.cream, d: c.dark }));
const glassPalette = paletteBy<K>((c) => ({ g: c.cream, h: c.lampHi, w: c.wine }));
const vasePalette = paletteBy<K>((c) => ({ r: c.awning, R: c.lampHi, s: c.roof, g: c.cream }));
const candlePalette = paletteBy<K>((c) => ({ g: c.cream, c: c.win }));

// ---- layout ----

const bankOf = (f: Frame): number => Math.round(f.h * (wideOf(f) ? 0.6 : 0.5));
const waterOf = (f: Frame): number => bankOf(f) + (wideOf(f) ? 7 : 9);
const quayOf = (f: Frame): number => Math.round(f.h * (wideOf(f) ? 0.89 : 0.84));
const awningEdgeOf = (f: Frame): number => Math.round(f.w * (wideOf(f) ? 0.38 : 0.44));
const awningDepthOf = (f: Frame): number => (wideOf(f) ? 10 : 14);
const lampXOf = (f: Frame): number => Math.round(f.w * 0.9);
const lampTopOf = (f: Frame): number => Math.round(f.h * (wideOf(f) ? 0.42 : 0.6));

/** The bistro table: the centre of its round top. */
const tableOf = (f: Frame): readonly [number, number] =>
  wideOf(f) ? [Math.round(f.w * 0.13), f.h - 9] : [Math.round(f.w * 0.3), quayOf(f) + 28];

const SPAN_W = 44;
const SPAN_T = 36;
const PIER = 6;

const piersOf = (f: Frame): readonly number[] => {
  const step = (wideOf(f) ? SPAN_W : SPAN_T) + PIER;
  return Array.from({ length: Math.ceil((f.w + 14) / step) + 1 }, (_, i) => i * step - 14);
};

// ---- the tower: a silhouette function of the height fraction u (0 at the tip, 1 at the ground) ----

type Tower = { readonly cx: number; readonly top: number; readonly h: number };
type Tone = 'hi' | 'iron' | 'lo' | null;

const P2 = 0.6;
const P1 = 0.8;
const ARCH = 0.85;

const towerOf = (f: Frame): Tower => {
  const top = Math.round(f.h * (wideOf(f) ? 0.05 : 0.08));
  return { cx: Math.round(f.w * (wideOf(f) ? 0.64 : 0.56)), top, h: bankOf(f) - 3 - top };
};

// The concave curve of the four legs closing in toward the tip.
const halfAt = (t: Tower, u: number): number => t.h * 0.2 * (0.03 + 0.97 * Math.max(0, (u - 0.05) / 0.95) ** 2.4);

// The great arch between the legs, from the ground up to just under the first platform.
const archAt = (t: Tower, u: number): number => (u > ARCH ? halfAt(t, 1) * 0.6 * Math.sqrt(1 - ((1 - u) / (1 - ARCH)) ** 2) : -1);

// Between the platforms the legs still stand apart: a narrow opening that closes toward the second platform.
const gapAt = (t: Tower, u: number): number => {
  const lo = P2 + 0.05;
  return u > lo && u < P1 ? halfAt(t, u) * 0.4 * ((u - lo) / (P1 - lo)) : -1;
};

// Ironwork: crossed braces; below the second platform the sky shows through between them.
const lattice = (x: number, y: number, u: number): Tone => {
  const cross = (x + y) % 4 === 0 || (x - y + 4096) % 4 === 0;
  if (u < P2) return cross ? 'lo' : 'iron';
  if (cross) return 'iron';
  return bayer(x, y) < 0.5 ? 'lo' : null;
};

const toneAt = (t: Tower, x: number, y: number): Tone => {
  const u = (y - t.top) / t.h;
  const dx = Math.abs(x - t.cx);
  const hw = Math.max(0.5, halfAt(t, u));
  if (dx > hw) return null;
  if (u < 0.06) return dx === 0 ? 'hi' : null;
  const arch = archAt(t, u);
  if (dx < arch || dx < gapAt(t, u)) return null;
  if (dx < arch + 1 || dx > hw - 1) return x <= t.cx ? 'hi' : 'iron';
  return lattice(x, y, u);
};

type Tones = { readonly hi: Rgb; readonly iron: Rgb; readonly lo: Rgb };

const platform = (img: ImageData, t: Tower, u: number, tones: Tones): void => {
  const y0 = Math.round(t.top + u * t.h);
  const half = Math.round(halfAt(t, u)) + 2;
  const thick = Math.max(2, Math.round(t.h * 0.022));
  for (let r = 0; r < thick; r++)
    for (let dx = -half; dx <= half; dx++)
      setPixel(img, t.cx + dx, y0 + r, r === 0 || (r === thick - 1 && dx % 2 === 0) ? tones.hi : tones.iron);
};

const towerImage = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  memoCanvas(`b6:paris-tower:${f.w}x${f.h}:${c.iron}:${c.ironHi}:${c.ironLo}`, f.w, f.h, (img) => {
    const t = towerOf(f);
    const tones: Tones = { hi: hexToRgb(c.ironHi), iron: hexToRgb(c.iron), lo: hexToRgb(c.ironLo) };
    const reach = Math.ceil(halfAt(t, 1)) + 1;
    for (let y = t.top; y < t.top + t.h; y++)
      for (let x = t.cx - reach; x <= t.cx + reach; x++) {
        const tone = toneAt(t, x, y);
        if (tone) setPixel(img, x, y, tones[tone]);
      }
    platform(img, t, P2, tones);
    platform(img, t, P1, tones);
    for (let y = t.top + Math.round(t.h * 0.06); y < t.top + Math.round(t.h * 0.09); y++)
      for (let dx = -1; dx <= 1; dx++) setPixel(img, t.cx + dx, y, dx < 0 ? tones.hi : tones.iron);
  });

// ---- sky ----

// A thin bank of cloud, lit along its underside; its top edge is ragged and its ends taper.
const wisp = (len: number, body: string, lit: string): HTMLCanvasElement =>
  memoCanvas(`b6:wisp:${len}:${body}:${lit}`, len, 6, (img) => {
    const a = hexToRgb(body);
    const b = hexToRgb(lit);
    for (let x = 0; x < len; x++) {
      const edge = Math.min(1, Math.min(x, len - 1 - x) / (len * 0.3));
      const thick = Math.min(6, Math.round(edge ** 0.7 * 6 * (0.3 + 0.8 * noise1(x / 6, len))));
      for (let y = 6 - thick; y < 6; y++) if (y >= 4 || bayer(x, y) < 0.75) setPixel(img, x, y, y >= 4 ? b : a);
    }
  });

const wisps = (ctx: Ctx, f: Frame, c: Colors<K>, water: number): void => {
  for (let i = 0; i < 5; i++) {
    const len = 30 + Math.floor(rand(i, 71) * 50);
    const lane = f.w + len;
    const x = wrap(rand(i, 72) * lane + f.t * (1 + i * 0.4), lane) - len;
    ctx.drawImage(wisp(len, c.sky2, c.sky3), Math.round(x), Math.round(water * (0.1 + 0.5 * rand(i, 73))));
  }
};

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const water = waterOf(f);
  ctx.drawImage(ditherGradient(f.w, water, [c.sky0, c.sky1, c.sky2, c.sky3]), 0, 0);
  if (c.star !== c.sky0) stars(ctx, f.w, water, f.t, [c.star, c.sky3], Math.round((f.w * water) / 450), 61, 0.55);
  wisps(ctx, f, c, water);
};

// One bar in four is a sparkle show: the tower glows and glitters for the whole bar; otherwise only on each beat.
const showOn = (f: Frame): boolean => Math.floor(f.beat / 4) % 4 === 3;

// The rotating beacon on the tip: its beam swings across the sky and shortens as it turns toward or away from us.
const beacon = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const t = towerOf(f);
  if (showOn(f)) drawGlow(ctx, c.glow, t.cx, t.top + t.h * 0.6, Math.round(halfAt(t, 1) * 1.4), Math.round(t.h * 0.55), 0.25);
  if (c.beam === c.sky1) return;
  const y0 = t.top + Math.round(t.h * 0.07);
  const a = f.t * 0.6;
  const len = Math.abs(Math.cos(a)) * f.w * 0.85;
  const dir = Math.cos(a) < 0 ? -1 : 1;
  const strength = Math.sin(a) > 0 ? 0.55 : 0.3;
  for (let i = 3; i < len; i++) {
    const x = t.cx + dir * i;
    const level = strength * (1 - i / len);
    const spread = 1 + Math.floor(i / 70);
    for (let k = -spread; k <= spread; k++) {
      const y = Math.round(y0 + i * 0.05) + k;
      if (bayer(x, y) < level) fillRect(ctx, c.beam, x, y, 1, 1);
    }
  }
};

const tower = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(towerImage(f, c), 0, 0);
};

const sparkle = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const show = showOn(f);
  if (!show && frac(f.beat) > 0.3) return;
  const t = towerOf(f);
  const count = show ? 48 : Math.round(8 + f.energy * 14);
  const seed = Math.floor(f.t * 12);
  for (let i = 0; i < count; i++) {
    const u = 0.08 + 0.92 * rand(i, seed);
    const x = Math.round(t.cx + (rand(i, seed + 1) * 2 - 1) * halfAt(t, u));
    const y = Math.round(t.top + u * t.h);
    if (Math.abs(x - t.cx) < archAt(t, u)) continue;
    if (i % 6 === 0) twinkle(ctx, x, y, c.star, 1);
    else fillRect(ctx, c.lampHi, x, y, 1, 1);
  }
};

// ---- the far bank: Haussmann blocks with mansard roofs, trees at the tower's feet, and the bridge ----

const paintWindows = (g: Ctx, c: Colors<K>, x: number, w: number, top: number, base: number, i: number): void => {
  for (let y = top + 2; y < base - 5; y += 4)
    for (let wx = x + 1; wx < x + w - 2; wx += 3) fillRect(g, rand(wx * 7 + y, i + 90) < 0.45 ? c.win : c.facadeLo, wx, y, 1, 2);
  fillRect(g, c.dark, x, top + 5, w, 1);
  fillRect(g, c.win, x + 1, base - 3, w - 2, 2);
};

const paintBlock = (g: Ctx, c: Colors<K>, x: number, w: number, base: number, tall: number, i: number): void => {
  const roofH = Math.max(3, Math.round(tall * 0.24));
  const top = base - tall;
  fillRect(g, c.facade, x, top, w, tall);
  fillRect(g, c.facadeLo, x + w - 1, top, 1, tall);
  for (let r = 0; r < roofH; r++) {
    const inset = Math.floor((roofH - r) / 2);
    fillRect(g, c.roof, x + inset, top - roofH + r, w - inset * 2, 1);
  }
  for (let dx = 3; dx < w - 3; dx += 4) fillRect(g, rand(dx, i + 91) < 0.4 ? c.win : c.facadeLo, x + dx, top - Math.ceil(roofH / 2), 1, 1);
  fillRect(g, c.facadeLo, x + 2 + Math.floor(rand(i, 81) * (w - 6)), top - roofH - 2, 2, 3);
  paintWindows(g, c, x, w, top, base, i);
};

const paintTrees = (g: Ctx, f: Frame, c: Colors<K>, t: Tower, bank: number): void => {
  const r = wideOf(f) ? 4 : 6;
  for (let i = 0; i < 9; i++) {
    const x = t.cx + (i - 4) * r * 1.6 + (rand(i, 84) - 0.5) * r;
    const y = bank - r - 1 - Math.floor(rand(i, 85) * 3);
    g.fillStyle = c.dark;
    spanDisc(g, x, y, r);
    g.fillStyle = c.roof;
    spanDisc(g, x - 1, y - 1, Math.max(1, r - 3));
  }
};

const paintArch = (g: Ctx, c: Colors<K>, x0: number, span: number, top: number, water: number): void => {
  const rise = water - top;
  for (let k = 0; k < span; k++) {
    const u = ((k + 0.5) / span) * 2 - 1;
    const y = Math.round(water - rise * Math.sqrt(1 - u * u));
    fillRect(g, c.stoneLo, x0 + k, y, 1, 1);
    fillRect(g, c.water0, x0 + k, y + 1, 1, water - y - 1);
  }
};

const paintBridge = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const deck = bankOf(f) - 4;
  const water = waterOf(f);
  fillRect(g, c.stone, 0, deck, f.w, water - deck);
  for (const x of piersOf(f)) {
    paintArch(g, c, x + PIER, wideOf(f) ? SPAN_W : SPAN_T, deck + 4, water);
    fillRect(g, c.dark, x + 2, deck - 11, 1, 8);
    fillRect(g, c.dark, x + 1, deck - 13, 3, 1);
    fillRect(g, c.lampHi, x + 1, deck - 12, 3, 2);
  }
  fillRect(g, c.stoneLo, 0, deck + 3, f.w, 1);
  for (let x = 0; x < f.w; x += 2) fillRect(g, c.stoneLo, x, deck - 3, 1, 3);
  fillRect(g, c.stone, 0, deck - 4, f.w, 1);
};

const bankLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('paris-bank', f, c, (g) => {
    const bank = bankOf(f);
    const t = towerOf(f);
    const foot = Math.round(halfAt(t, 1)) + 8;
    const scale = wideOf(f) ? 1 : 1.5;
    let x = -3;
    for (let i = 0; x < f.w; i++) {
      const w = Math.round((16 + rand(i, 82) * 14) * scale);
      if (x + w > t.cx - foot && x < t.cx + foot) {
        x = t.cx + foot;
        continue;
      }
      paintBlock(g, c, x, w, bank, Math.round((13 + rand(i, 83) * 8) * scale), i);
      x += w + 1;
    }
    paintTrees(g, f, c, t, bank);
    fillRect(g, c.stoneLo, 0, bank - 2, f.w, 2);
    paintBridge(g, f, c);
  });

const bank = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(bankLayer(f, c), 0, 0);
  const peak = f.kick > 0.6 ? 0.8 : 0.55;
  for (const x of piersOf(f)) drawGlow(ctx, c.glow, x + 2, bankOf(f) - 15, 6, 5, peak);
};

// ---- the Seine ----

const river = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const water = waterOf(f);
  const quay = quayOf(f);
  mirrorWater(ctx, f, { axis: water, bottom: quay, squash: 1.25, amp: 1.5, freq: 0.9, speed: 2.2, tint: c.water0, tintLevel: 0.35 });
  for (const x of piersOf(f)) lightStreak(ctx, f, x + 2, water + 2, Math.round((quay - water) * 0.6), c.win);
  glints(ctx, f, water + 2, quay - 1, c.water1, Math.round(f.w / 5), 5);
  glints(ctx, f, water + 2, quay - 1, c.sky3, Math.round(f.w / 12), 6);
};

const boat = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const water = waterOf(f);
  const y = Math.round(water + (quayOf(f) - water) * 0.5 + Math.sin(f.t * 1.6) * 0.6) - BOAT.length;
  const x = Math.round(wrap(f.t * 8 + 40, f.w + 120) - 50);
  for (let k = 5; k < 44; k += 5) lightStreak(ctx, f, x + k, y + BOAT.length + 1, 8, c.win);
  drawSprite(ctx, BOAT, boatPalette(c), x, y);
};

// ---- the terrace: quay, lamp post, awning, chair and table ----

const paintQuay = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const quay = quayOf(f);
  fillRect(g, c.dark, 0, quay, f.w, f.h - quay);
  fillRect(g, c.stone, 0, quay, f.w, 2);
  fillRect(g, c.stoneLo, 0, quay + 2, f.w, 1);
  for (let i = 0; i < f.w / 2; i++)
    fillRect(g, c.stoneLo, Math.floor(rand(i, 95) * f.w), quay + 4 + Math.floor(rand(i, 96) * (f.h - quay)), 2, 1);
};

const paintLampPost = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const x = lampXOf(f);
  const top = lampTopOf(f);
  fillRect(g, c.dark, x - 1, top + 8, 2, f.h - top - 8);
  fillRect(g, c.dark, x - 3, f.h - 6, 6, 6);
  fillRect(g, c.dark, x - 2, top + 16, 4, 2);
  fillRect(g, c.dark, x - 3, top, 7, 9);
  fillRect(g, c.lampHi, x - 2, top + 2, 5, 5);
  fillRect(g, c.win, x - 2, top + 6, 5, 1);
  fillRect(g, c.dark, x - 2, top - 2, 5, 2);
  fillRect(g, c.dark, x, top - 4, 1, 2);
};

const paintAwning = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const right = awningEdgeOf(f);
  const depth = awningDepthOf(f);
  for (let x = 0; x < right; x++) {
    const edge = depth + Math.round((right - x) * 0.1);
    const stripe = Math.floor(x / 5) % 2 === 0 ? c.awning : c.cream;
    fillRect(g, stripe, x, 0, 1, edge);
    fillRect(g, c.awningLo, x, edge - 4, 1, 1);
    fillRect(g, stripe, x, edge, 1, Math.round(Math.sqrt(Math.max(0, 6.25 - ((x % 5) - 2) ** 2))));
  }
  fillRect(g, c.dark, right, 0, 1, depth + 3);
};

const paintTable = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const [tx, ty] = tableOf(f);
  const rx = wideOf(f) ? 30 : 34;
  fillRect(g, c.stoneLo, tx - 2, ty + 4, 4, f.h - ty);
  fillRect(g, c.stoneLo, tx - 9, ty + 34, 19, 2);
  for (let dy = -5; dy <= 5; dy++) {
    const half = Math.round(rx * Math.sqrt(1 - (dy / 5.5) ** 2));
    fillRect(g, dy > 2 ? c.stoneLo : c.cream, tx - half, ty + dy, half * 2 + 1, 1);
  }
  fillRect(g, c.lampHi, tx - rx + 8, ty - 3, 10, 1);
  fillRect(g, c.lampHi, tx - rx + 4, ty - 2, 3, 1);
  drawSprite(g, GLASS, glassPalette(c), tx - 16, ty - GLASS.length + 1);
  drawSprite(g, CANDLE, candlePalette(c), tx + 8, ty - CANDLE.length + 1);
  drawSprite(g, VASE, vasePalette(c), tx - 3, ty - VASE.length);
};

const frontLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('paris-front', f, c, (g) => {
    paintQuay(g, f, c);
    paintLampPost(g, f, c);
    paintAwning(g, f, c);
    paintTable(g, f, c);
  });

const terrace = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  drawGlow(ctx, c.glow, lampXOf(f), lampTopOf(f) + 4, 16, 14, f.kick > 0.6 ? 0.75 : 0.55);
  ctx.drawImage(frontLayer(f, c), 0, 0);
};

// The festoon under the awning, and the candle flame flickering on the table.
const lights = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const right = awningEdgeOf(f);
  const depth = awningDepthOf(f);
  festoon(ctx, f, { x0: right, y0: depth + 2, x1: f.w + 2, y1: 3, sag: depth + 4, gap: 10 }, c.dark, c.lampHi, c.glow);
  const [tx, ty] = tableOf(f);
  const flick = rand(Math.floor(f.t * 9), 7);
  drawGlow(ctx, c.glow, tx + 11, ty - 6, 14, 8, flick > 0.5 ? 0.5 : 0.4);
  fillRect(ctx, c.win, tx + 11, ty - 6, 1, 2);
  fillRect(ctx, c.lampHi, tx + 11 - (flick > 0.8 ? 1 : 0), ty - 8 - (flick > 0.6 ? 1 : 0), 1, 2 + (flick > 0.3 ? 1 : 0));
};

export const parisDusk = defineScene<K>({
  id: 'paris-dusk',
  title: 'Seine at Dusk',
  mood: { valence: 0.2, energy: -0.3 },
  styles: ['town-waltz', 'lofi-loop', 'city-lights', 'starlit-dream', 'bossa-cafe', 'city-groove'],
  variants: [
    {
      // Blue hour: the lights have just come on against the last of the pink.
      mood: { valence: 0.15, energy: -0.4 },
      colors: {
        sky0: '#141a46',
        sky1: '#2a3478',
        sky2: '#5c5aa2',
        sky3: '#e8949a',
        star: '#c8d4ff',
        beam: '#ffe9a8',
        iron: '#e29a38',
        ironHi: '#ffe08a',
        ironLo: '#8a4a22',
        facade: '#6a6890',
        facadeLo: '#46466e',
        roof: '#2e2e58',
        win: '#ffcc6a',
        lampHi: '#fff4cc',
        glow: '#ffb050',
        stone: '#5a5a86',
        stoneLo: '#3a3a62',
        water0: '#10163a',
        water1: '#3a4488',
        awning: '#b0303c',
        awningLo: '#5a1828',
        cream: '#e8dcc8',
        dark: '#0c0c22',
        wine: '#701020',
      },
    },
    {
      // Golden hour: the tower a dark lace against an orange sky, rimmed with the last sun.
      mood: { valence: 0.55, energy: 0 },
      colors: {
        sky0: '#3b4a8c',
        sky1: '#b86a92',
        sky2: '#f29a6a',
        sky3: '#ffd88a',
        star: '#3b4a8c',
        beam: '#b86a92',
        iron: '#4a2f48',
        ironHi: '#ff9f5a',
        ironLo: '#2f1f36',
        facade: '#f0c49a',
        facadeLo: '#b07a72',
        roof: '#5d5a80',
        win: '#ffe0a0',
        lampHi: '#fff6d8',
        glow: '#ffbf6a',
        stone: '#c99a86',
        stoneLo: '#8a5e62',
        water0: '#4a3a6a',
        water1: '#c08a9a',
        awning: '#c43a3a',
        awningLo: '#7a2232',
        cream: '#f4e6d0',
        dark: '#24182c',
        wine: '#8a1a2a',
      },
    },
    {
      // Deep night: a black sky full of stars and the tower glittering.
      mood: { valence: -0.1, energy: 0.5 },
      colors: {
        sky0: '#05061a',
        sky1: '#0c1236',
        sky2: '#1c2252',
        sky3: '#3e2c5e',
        star: '#e8ecff',
        beam: '#fff2b0',
        iron: '#f0a830',
        ironHi: '#fff0a0',
        ironLo: '#9a5418',
        facade: '#3a3a5c',
        facadeLo: '#28284a',
        roof: '#1a1a38',
        win: '#ffc860',
        lampHi: '#ffffff',
        glow: '#ffaa40',
        stone: '#33355a',
        stoneLo: '#202040',
        water0: '#05081e',
        water1: '#22285a',
        awning: '#a02834',
        awningLo: '#4a1020',
        cream: '#d8ccb8',
        dark: '#04040e',
        wine: '#601020',
      },
    },
  ],
  layers: [sky, beacon, tower, sparkle, bank, river, boat, terrace, lights],
});
