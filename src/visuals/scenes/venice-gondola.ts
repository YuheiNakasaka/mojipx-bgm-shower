// A Venetian canal: a row of faded colorful houses with a side canal and its arched stone bridge, laundry swaying
// across the gap, and a gondola gliding past while the gondolier rows on the beat, all rippling in the water.
import { type Ctx, drawSprite, fillRect, type Sprite } from 'mojipx';
import { bayer, ditherGradient, frac, pixelLine, rand, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { drawGlow, driftingClouds, flock, paletteBy, spanDisc, wrap } from './batch-1-helpers.ts';
import { moon } from './batch-2-helpers.ts';
import { frameLayer, glints, lightStreak, mirrorWater, ring, wideOf } from './batch-6-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sky3'
  | 'star'
  | 'haze'
  | 'houseA'
  | 'houseB'
  | 'houseC'
  | 'houseD'
  | 'shade'
  | 'trim'
  | 'trimLo'
  | 'roof'
  | 'shutter'
  | 'win'
  | 'lit'
  | 'glow'
  | 'water0'
  | 'water1'
  | 'hull'
  | 'red'
  | 'blue'
  | 'skin';

// The gondolier, facing the bow: o outline, h straw hat, r ribbon, s skin, e eye, w/b striped shirt, p trousers.
const ROWER: Sprite = [
  '...oooo....',
  '..ohhhho...',
  '..orrrro...',
  'ohhhhhhhho.',
  '..ossssso..',
  '..osssseo..',
  '..osssss...',
  '...osso....',
  '..owwwwo...',
  '.obbbbbbo..',
  '.owwwwwwsso',
  '.obbbbbbo..',
  '..owwwwo...',
  '..obbbbo...',
  '..oppppo...',
  '..opp.po...',
  '..op..po...',
  '..op..po...',
  '..op..po...',
  '.ooo..ooo..',
];

// Leaning into the stroke: the upper body tips toward the bow.
const ROWER_LEAN: Sprite = ROWER.map((row, i) => (i < 13 ? `.${row.slice(0, -1)}` : row));

// A couple on the cushioned seat: o outline, d dark hair, h auburn hair, s skin, r dress, b jacket.
const COUPLE: Sprite = [
  '..ooo....oo..',
  '.ohhho..oddo.',
  '.ohsso..ossso',
  '.ohsso..osso.',
  '..oso....oo..',
  '.orrro..obbo.',
  'orrrrro.obbbo',
  'ooooooooooooo',
];

const GULL_A: Sprite = ['g...g', '.g.g.', '..g..'];
const GULL_B: Sprite = ['.....', 'ggggg', '..g..'];

const rowerPalette = paletteBy<K>((c) => ({ o: c.hull, h: c.houseD, r: c.red, s: c.skin, e: c.hull, w: c.trim, b: c.blue, p: c.hull }));
const couplePalette = paletteBy<K>((c) => ({ o: c.hull, d: c.hull, h: c.roof, s: c.skin, r: c.red, b: c.blue }));
const gullPalette = paletteBy<K>((c) => ({ g: c.trim }));

// ---- layout ----

type House = { readonly x: number; readonly w: number; readonly top: number; readonly tone: number };
type Gap = { readonly x: number; readonly w: number };

const scaleOf = (f: Frame): number => (wideOf(f) ? 1 : 1.6);
const waterOf = (f: Frame): number => Math.round(f.h * (wideOf(f) ? 0.64 : 0.56));
const floorOf = (f: Frame): number => (wideOf(f) ? 12 : 15);

const gapOf = (f: Frame): Gap => {
  const w = wideOf(f) ? 46 : 44;
  return { x: Math.round(f.w * (wideOf(f) ? 0.47 : 0.5) - w / 2), w };
};

const housesOf = (f: Frame): readonly House[] => {
  const wl = waterOf(f);
  const gap = gapOf(f);
  const out: House[] = [];
  let x = -6;
  for (let i = 0; x < f.w; i++) {
    if (x >= gap.x && x < gap.x + gap.w) {
      x = gap.x + gap.w;
      continue;
    }
    const natural = Math.round(24 + rand(i, 11) * 14);
    const w = x < gap.x && x + natural > gap.x - 10 ? gap.x - x : natural;
    out.push({ x, w, top: wl - Math.round((44 + rand(i, 12) * 26) * scaleOf(f)), tone: Math.floor(rand(i, 13) * 4) });
    x += w;
  }
  return out;
};

const lanternsOf = (f: Frame): readonly number[] => {
  const gap = gapOf(f);
  return [gap.x - 5, gap.x + gap.w + 4, Math.round(f.w * 0.12), Math.round(f.w * 0.88)];
};

const lanternYOf = (f: Frame): number => waterOf(f) - (wideOf(f) ? 17 : 22);

// ---- sky: gradient, far landmarks of the lagoon in the haze, moon or clouds ----

const paintCampanile = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const cx = Math.round(f.w * (wideOf(f) ? 0.82 : 0.8));
  const half = wideOf(f) ? 5 : 7;
  const top = Math.round(f.h * (wideOf(f) ? 0.2 : 0.17));
  const belfry = wideOf(f) ? 7 : 9;
  fillRect(g, c.haze, cx - half, top, half * 2, f.h - top);
  fillRect(g, c.sky2, cx - half + 2, top + 2, 2, belfry - 3);
  fillRect(g, c.sky2, cx + half - 4, top + 2, 2, belfry - 3);
  fillRect(g, c.haze, cx - half - 1, top + belfry, half * 2 + 2, 1);
  fillRect(g, c.haze, cx - half + 1, top - 4, half * 2 - 2, 4);
  for (let r = 0; r < half * 2; r++) fillRect(g, c.haze, cx - (r >> 1), top - 4 - half * 2 + r, (r >> 1) * 2 + 1, 1);
  fillRect(g, c.lit, cx - 1, top - 6 - half * 2, 1, 2);
};

const paintDome = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const cx = Math.round(f.w * (wideOf(f) ? 0.15 : 0.2));
  const r = wideOf(f) ? 13 : 17;
  const drum = Math.round(f.h * (wideOf(f) ? 0.33 : 0.27));
  fillRect(g, c.haze, cx - r, drum, r * 2 + 1, f.h - drum);
  for (let x = cx - r + 2; x < cx + r; x += 3) fillRect(g, c.sky2, x, drum + 3, 1, 3);
  g.fillStyle = c.haze;
  for (let dy = 0; dy <= r; dy++) {
    const half = Math.round(r * Math.sqrt(1 - (dy / (r + 0.5)) ** 2));
    g.fillRect(cx - half, drum - dy, half * 2 + 1, 1);
  }
  fillRect(g, c.haze, cx - 2, drum - r - 5, 5, 5);
  fillRect(g, c.haze, cx, drum - r - 8, 1, 3);
  spanDisc(g, cx - r * 1.6, drum + 4, Math.round(r * 0.45));
  spanDisc(g, cx + r * 1.6, drum + 4, Math.round(r * 0.45));
};

const skyLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('venice-sky', f, c, (g) => {
    const wl = waterOf(f);
    g.drawImage(ditherGradient(f.w, wl, [c.sky0, c.sky1, c.sky2, c.sky3]), 0, 0);
    paintCampanile(g, f, c);
    paintDome(g, f, c);
  });

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const wl = waterOf(f);
  ctx.drawImage(skyLayer(f, c), 0, 0);
  if (c.star !== c.sky0) {
    stars(ctx, f.w, wl, f.t, [c.star], Math.round((f.w * wl) / 600), 23, 0.45);
    const r = wideOf(f) ? 7 : 9;
    drawGlow(ctx, c.sky3, f.w * 0.36, f.h * 0.13, r * 3, r * 3, 0.6);
    moon(ctx, Math.round(f.w * 0.36), Math.round(f.h * 0.13), r, c.trim, c.trimLo);
  }
  const short = Math.min(f.w, f.h);
  driftingClouds(ctx, f, c.sky3, c.sky2, { count: 4, top: short * 0.12, span: short * 0.25, size: short * 0.06, speed: 2, seed: 41 });
  if (c.star === c.sky0)
    flock(ctx, f, [GULL_A, GULL_B], gullPalette(c), { count: 3, top: short * 0.1, span: short * 0.2, speed: 9, seed: 7 });
};

// ---- the houses ----

const toneOf = (c: Colors<K>, tone: number): string => [c.houseA, c.houseB, c.houseC, c.houseD][tone] ?? c.houseA;

// A pointed Gothic window with green shutters and a stone sill.
const paintWindow = (g: Ctx, c: Colors<K>, x: number, y: number, lit: boolean): void => {
  const glass = lit ? c.lit : c.win;
  fillRect(g, c.shutter, x - 1, y + 1, 1, 5);
  fillRect(g, c.shutter, x + 3, y + 1, 1, 5);
  fillRect(g, glass, x, y + 1, 3, 5);
  fillRect(g, glass, x + 1, y, 1, 1);
  fillRect(g, c.trim, x - 1, y + 6, 5, 1);
};

const paintFloors = (g: Ctx, f: Frame, c: Colors<K>, h: House, i: number): void => {
  const wl = waterOf(f);
  const n = Math.max(1, Math.floor((h.w - 6) / 8));
  const step = (h.w - n * 3) / (n + 1);
  for (let y = h.top + 7, floor = 0; y < wl - 16; y += floorOf(f), floor++) {
    for (let k = 0; k < n; k++) paintWindow(g, c, Math.round(h.x + step + k * (step + 3)), y, rand(i * 17 + k, floor + 3) < 0.35);
    if (floor === 1 && i % 3 === 0) {
      fillRect(g, c.trim, h.x + 2, y + 7, h.w - 4, 1);
      for (let x = h.x + 3; x < h.x + h.w - 3; x += 2) fillRect(g, x % 4 === 0 ? c.red : c.shutter, x, y + 6, 1, 1);
    }
  }
};

const paintRoof = (g: Ctx, c: Colors<K>, h: House, i: number): void => {
  fillRect(g, c.trim, h.x, h.top + 2, h.w, 1);
  fillRect(g, c.roof, h.x - 1, h.top, h.w + 2, 2);
  const cx = h.x + 4 + Math.floor(rand(i, 14) * (h.w - 8));
  fillRect(g, c.roof, cx, h.top - 4, 2, 4);
  fillRect(g, c.roof, cx - 1, h.top - 6, 4, 2);
  fillRect(g, c.trimLo, cx - 1, h.top - 6, 4, 1);
  if (i % 4 !== 1) return;
  // A rooftop terrace on stilts.
  fillRect(g, c.hull, h.x + 3, h.top - 6, 1, 6);
  fillRect(g, c.hull, h.x + 12, h.top - 6, 1, 6);
  fillRect(g, c.hull, h.x + 2, h.top - 6, 12, 1);
};

const paintBase = (g: Ctx, f: Frame, c: Colors<K>, h: House): void => {
  const wl = waterOf(f);
  for (let y = wl - 4; y < wl; y++) for (let x = h.x; x < h.x + h.w; x++) if (bayer(x, y) < 0.5) fillRect(g, c.shade, x, y, 1, 1);
  const dx = h.x + Math.round(h.w / 2) - 3;
  fillRect(g, c.shade, dx, wl - 9, 6, 9);
  fillRect(g, c.shade, dx + 1, wl - 10, 4, 1);
  fillRect(g, c.trim, dx - 1, wl - 1, 8, 1);
};

const paintHouse = (g: Ctx, f: Frame, c: Colors<K>, h: House, i: number): void => {
  const wl = waterOf(f);
  fillRect(g, toneOf(c, h.tone), h.x, h.top, h.w, wl - h.top);
  fillRect(g, c.shade, h.x + h.w - 1, h.top, 1, wl - h.top);
  paintRoof(g, c, h, i);
  paintFloors(g, f, c, h, i);
  paintBase(g, f, c, h);
};

// The side canal seen through the gap: walls closing toward a dim far facade.
const paintSideCanal = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const wl = waterOf(f);
  const gap = gapOf(f);
  const farTop = wl - Math.round(40 * scaleOf(f));
  const inset = 9;
  fillRect(g, c.shade, gap.x + inset, farTop, gap.w - inset * 2, wl - farTop);
  for (let k = 0; k < inset; k++) {
    const top = farTop - Math.round((inset - k) * 2.5);
    fillRect(g, c.trimLo, gap.x + k, top, 1, wl - top);
    fillRect(g, c.shade, gap.x + gap.w - 1 - k, top, 1, wl - top);
  }
  for (let y = farTop + 4; y < wl - 8; y += 7)
    for (let x = gap.x + inset + 3; x < gap.x + gap.w - inset - 3; x += 5) fillRect(g, rand(x, y) < 0.4 ? c.lit : c.win, x, y, 2, 3);
  fillRect(g, c.water0, gap.x, wl - 3, gap.w, 3);
};

const deckAt = (f: Frame, x: number): number => {
  const gap = gapOf(f);
  const u = (x - gap.x + 4) / (gap.w + 8);
  return Math.round(waterOf(f) - 5 - Math.sin(Math.min(1, Math.max(0, u)) * Math.PI) * 8);
};

// The footbridge over the side canal: a stone hump with an arch beneath and an iron railing.
const paintBridge = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const wl = waterOf(f);
  const gap = gapOf(f);
  const rise = 10;
  for (let x = gap.x - 4; x < gap.x + gap.w + 4; x++) {
    const deck = deckAt(f, x);
    const u = ((x - gap.x) / gap.w) * 2 - 1;
    const open = Math.abs(u) < 0.68 ? Math.round(wl - rise * Math.sqrt(1 - (u / 0.68) ** 2)) : wl;
    fillRect(g, c.trim, x, deck, 1, open - deck);
    fillRect(g, c.trimLo, x, deck + 2, 1, 1);
    if (open < wl) fillRect(g, c.shade, x, open, 1, wl - open);
    if (open < wl) fillRect(g, c.trimLo, x, open, 1, 1);
    fillRect(g, c.hull, x, deck - 4, 1, 1);
    if (x % 3 === 0) fillRect(g, c.hull, x, deck - 3, 1, 3);
  }
};

const paintPoles = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const wl = waterOf(f);
  const xs = [0.07, 0.11, 0.84, 0.9].map((u) => Math.round(f.w * u));
  xs.forEach((x, i) => {
    const top = wl - (wideOf(f) ? 14 : 20) + (i % 2) * 2;
    for (let y = top; y < wl; y += 2) fillRect(g, (y - top) % 4 === 0 ? c.trim : i < 2 ? c.blue : c.red, x, y, 2, 2);
    fillRect(g, c.hull, x, top - 1, 2, 1);
  });
};

const paintLanterns = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const y = lanternYOf(f);
  for (const x of lanternsOf(f)) {
    fillRect(g, c.hull, x - 1, y - 4, 3, 1);
    fillRect(g, c.hull, x, y - 3, 1, 1);
    fillRect(g, c.hull, x - 1, y - 2, 3, 4);
    fillRect(g, c.lit, x, y - 1, 1, 2);
  }
};

const townLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('venice-town', f, c, (g) => {
    housesOf(f).forEach((h, i) => {
      paintHouse(g, f, c, h, i);
    });
    paintSideCanal(g, f, c);
    paintBridge(g, f, c);
    paintPoles(g, f, c);
    paintLanterns(g, f, c);
  });

// Washing on a line across the gap, each piece swinging a little out of step with the others.
const laundry = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const gap = gapOf(f);
  const y0 = waterOf(f) - Math.round(31 * scaleOf(f));
  const colors = [c.trim, c.red, c.houseD, c.blue, c.trim, c.houseC];
  for (let x = gap.x - 2; x < gap.x + gap.w + 2; x++)
    fillRect(ctx, c.hull, x, y0 + Math.round(Math.sin(((x - gap.x + 2) / (gap.w + 4)) * Math.PI) * 4), 1, 1);
  for (let k = 0; k < 6; k++) {
    const x = gap.x + 4 + k * Math.floor((gap.w - 8) / 6);
    const y = y0 + Math.round(Math.sin(((x - gap.x + 2) / (gap.w + 4)) * Math.PI) * 4) + 1;
    const sway = Math.round(Math.sin(f.t * 2.2 + k * 1.3) * 0.8);
    const tall = k % 3 === 1 ? 6 : 4;
    fillRect(ctx, colors[k] as string, x + sway, y, 4, tall);
    if (k % 3 === 0) fillRect(ctx, colors[k] as string, x - 1 + sway, y, 6, 2);
  }
};

const town = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(townLayer(f, c), 0, 0);
  laundry(ctx, f, c);
  const y = lanternYOf(f);
  for (const x of lanternsOf(f)) drawGlow(ctx, c.glow, x, y, 7, 7, f.kick > 0.6 ? 0.7 : 0.5);
  // Someone crossing the bridge now and then.
  const gap = gapOf(f);
  const wx = gap.x - 6 + wrap(f.t * 5, gap.w + 60);
  if (wx < gap.x + gap.w + 6) {
    const top = deckAt(f, wx) - 7;
    fillRect(ctx, c.hull, Math.round(wx), top, 2, 2);
    fillRect(ctx, c.red, Math.round(wx) - 1, top + 2, 4, 4);
    fillRect(ctx, c.hull, Math.round(wx) + (Math.floor(f.t * 4) % 2), top + 6, 1, 1);
  }
};

// ---- the canal ----

const water = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const wl = waterOf(f);
  mirrorWater(ctx, f, { axis: wl, bottom: f.h, squash: 1, amp: 1.5, freq: 0.7, speed: 2, tint: c.water0, tintLevel: 0.4 });
  for (const x of lanternsOf(f)) lightStreak(ctx, f, x, wl + (wl - lanternYOf(f)) - 2, Math.round((f.h - wl) * 0.5), c.lit);
  glints(ctx, f, wl + 2, f.h, c.water1, Math.round(f.w / 4), 15);
};

// ---- the gondola ----

type Boat = { readonly x: number; readonly y: number; readonly len: number };

const boatOf = (f: Frame): Boat => {
  const len = wideOf(f) ? 72 : 76;
  const wl = waterOf(f);
  return {
    x: Math.round(wrap(f.t * 6 + f.w * 0.2 + 90, f.w + 130) - 90),
    y: Math.round(wl + (f.h - wl) * (wideOf(f) ? 0.5 : 0.42)),
    len,
  };
};

// The hull, column by column (top and bottom rows from the gunwale line): a long crescent, the stern curling up
// behind the gondolier and the bow rising higher to carry its iron comb.
const hullColumn = (len: number, k: number): readonly [number, number] => {
  const u = k / (len - 1);
  const stern = u < 0.12 ? ((0.12 - u) / 0.12) ** 1.5 * 7 : 0;
  const bow = u > 0.84 ? ((u - 0.84) / 0.16) ** 1.6 * 10 : 0;
  const top = Math.round(-1 - stern - bow);
  return [top, Math.max(top + 1, Math.round(3 - Math.abs(2 * u - 1) ** 3 * 6))];
};

const hull = (ctx: Ctx, c: Colors<K>, b: Boat): void => {
  for (let k = 0; k < b.len; k++) {
    const [top, bottom] = hullColumn(b.len, k);
    fillRect(ctx, c.hull, b.x + k, b.y + top, 1, bottom - top);
    fillRect(ctx, c.trimLo, b.x + k, b.y + top, 1, 1);
  }
  const [sternTop] = hullColumn(b.len, 0);
  fillRect(ctx, c.hull, b.x - 1, b.y + sternTop - 1, 2, 1);
  const bowX = b.x + b.len - 2;
  const [bowTop] = hullColumn(b.len, b.len - 2);
  fillRect(ctx, c.trim, bowX, b.y + bowTop - 4, 1, 7);
  fillRect(ctx, c.trim, bowX - 1, b.y + bowTop - 5, 3, 1);
  for (let t = 0; t < 3; t++) fillRect(ctx, c.trim, bowX + 1, b.y + bowTop - 2 + t * 2, 2, 1);
  fillRect(ctx, c.red, b.x + Math.round(b.len * 0.42), b.y - 3, 15, 2);
  fillRect(ctx, c.houseD, b.x + Math.round(b.len * 0.42), b.y - 4, 15, 1);
};

// A faint upside-down copy of the boat on the water.
const ROWER_UNDER: Sprite = [...ROWER].reverse();

const boatReflection = (ctx: Ctx, f: Frame, c: Colors<K>, b: Boat): void => {
  ctx.save();
  ctx.globalAlpha = 0.45;
  for (let k = 0; k < b.len; k++) {
    const [top, bottom] = hullColumn(b.len, k);
    fillRect(ctx, c.hull, b.x + k + Math.round(Math.sin(f.t * 2 + k * 0.2)), b.y + bottom, 1, bottom - top);
  }
  ctx.globalAlpha = 0.3;
  drawSprite(ctx, ROWER_UNDER, rowerPalette(c), b.x + 6 + Math.round(Math.sin(f.t * 2.4)), b.y + 7);
  ctx.restore();
};

const gondola = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const b = boatOf(f);
  if (b.x > f.w || b.x + b.len < 0) return;
  boatReflection(ctx, f, c, b);
  const phase = frac(f.beat);
  const push = phase < 0.5 ? phase * 2 : 2 - phase * 2;
  const lean = phase < 0.45;
  const rx = b.x + 6;
  drawSprite(ctx, lean ? ROWER_LEAN : ROWER, rowerPalette(c), rx, b.y - ROWER.length - 1);
  const handX = rx + (lean ? 10 : 9);
  const handY = b.y - ROWER.length + 9;
  const bladeX = Math.round(rx + 22 - push * 14);
  pixelLine(ctx, handX, handY, bladeX, b.y + 4, c.trimLo);
  ring(ctx, bladeX, b.y + 5, 1 + phase * 5, 0.3, c.water1);
  drawSprite(ctx, COUPLE, couplePalette(c), b.x + Math.round(b.len * 0.46), b.y - COUPLE.length - 1);
  hull(ctx, c, b);
};

export const veniceGondola = defineScene<K>({
  id: 'venice-gondola',
  title: 'Venice Waters',
  mood: { valence: 0.4, energy: -0.4 },
  styles: ['town-waltz', 'cozy-village', 'lofi-loop', 'bossa-cafe'],
  variants: [
    {
      // Sunset: warm stone, a golden canal.
      mood: { valence: 0.45, energy: -0.35 },
      colors: {
        sky0: '#3a3f86',
        sky1: '#c06a8e',
        sky2: '#f49a6c',
        sky3: '#ffd890',
        star: '#3a3f86',
        haze: '#b7708a',
        houseA: '#f0a860',
        houseB: '#de6e58',
        houseC: '#f2b8a0',
        houseD: '#f6d68a',
        shade: '#7a4060',
        trim: '#fbe8d0',
        trimLo: '#c49080',
        roof: '#b04838',
        shutter: '#4a7a5a',
        win: '#5a3048',
        lit: '#ffd27a',
        glow: '#ffb860',
        water0: '#5a3f78',
        water1: '#ffcf8a',
        hull: '#1c1220',
        red: '#d23a3a',
        blue: '#3a4a8a',
        skin: '#f4c09a',
      },
    },
    {
      // Moonlight: blue walls, warm lanterns and windows.
      mood: { valence: -0.1, energy: -0.6 },
      colors: {
        sky0: '#070b24',
        sky1: '#101a40',
        sky2: '#22306a',
        sky3: '#3a4a86',
        star: '#d8e0ff',
        haze: '#1a2450',
        houseA: '#5a5070',
        houseB: '#56405e',
        houseC: '#64566e',
        houseD: '#6a6476',
        shade: '#1c1a34',
        trim: '#a4a4c4',
        trimLo: '#5a5a7c',
        roof: '#4a3046',
        shutter: '#2a4048',
        win: '#141428',
        lit: '#ffc66a',
        glow: '#ffa848',
        water0: '#060a20',
        water1: '#4a5a96',
        hull: '#06060e',
        red: '#8a2a3a',
        blue: '#2a3466',
        skin: '#c8a088',
      },
    },
    {
      // A bright morning: vivid plaster over a green canal.
      mood: { valence: 0.65, energy: 0.25 },
      colors: {
        sky0: '#3a86d8',
        sky1: '#6ab0ec',
        sky2: '#a8d8f6',
        sky3: '#e8f6ff',
        star: '#3a86d8',
        haze: '#9ab8d8',
        houseA: '#f2b04a',
        houseB: '#e0583e',
        houseC: '#f4a8a0',
        houseD: '#fbe08a',
        shade: '#a0604a',
        trim: '#fff6e6',
        trimLo: '#d0b8a0',
        roof: '#c0503a',
        shutter: '#3e8a5a',
        win: '#4a5a7a',
        lit: '#bfe6ff',
        glow: '#fff0c0',
        water0: '#1e6e72',
        water1: '#8ae0d8',
        hull: '#16141c',
        red: '#e03a3a',
        blue: '#2a5ab8',
        skin: '#f6c8a0',
      },
    },
  ],
  layers: [sky, town, water, gondola],
});
