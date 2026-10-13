// A southern island shore: an emerald and turquoise sea over a coral reef, waves washing white sand on the beat, an
// old red-tiled house with lion-dog guardians behind its coral-stone wall, hibiscus in bloom, palms and a little boat.
import { type Ctx, drawSprite, fillRect, type Sprite } from 'mojipx';
import { bayer, disc, fillColumns, frac, noise1, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { cloudCanvas, drawGlow, flock, paletteBy, wrap } from './batch-1-helpers.ts';
import { moon } from './batch-2-helpers.ts';
import { BIRD, isDark, pixelLayer } from './batch-5-helpers.ts';
import { frameLayer, glints } from './batch-6-helpers.ts';
import { type Plan, planOf, puff, skyBase } from './batch-9-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sky3'
  | 'sun'
  | 'cloud'
  | 'cloudLo'
  | 'sea0'
  | 'sea1'
  | 'sea2'
  | 'sea3'
  | 'sea4'
  | 'foam'
  | 'sand'
  | 'sandLo'
  | 'roof'
  | 'roofLo'
  | 'mortar'
  | 'wood'
  | 'woodLo'
  | 'stone'
  | 'stoneLo'
  | 'leaf'
  | 'leafLo'
  | 'leafLit'
  | 'flower'
  | 'trunk'
  | 'trunkLo'
  | 'shisa'
  | 'ink'
  | 'glow';

// ---- layout ----

type Spot =
  | 'horizon'
  | 'shoreL'
  | 'shoreR'
  | 'houseL'
  | 'houseR'
  | 'eave'
  | 'ridge'
  | 'base'
  | 'wallTop'
  | 'wallR'
  | 'gate'
  | 'isleX'
  | 'sunX'
  | 'palmX'
  | 'crownX'
  | 'crownY';
type Layout = Readonly<Record<Spot, number>>;

const WIDE: Plan<Spot> = {
  horizon: ['h', 0.42],
  shoreL: ['h', 0.66],
  shoreR: ['h', 0.8],
  houseL: ['w', 0.02],
  houseR: ['w', 0.3],
  eave: ['h', 0.56],
  ridge: ['h', 0.43],
  base: ['h', 0.72],
  wallTop: ['h', 0.655],
  wallR: ['w', 0.37],
  gate: ['w', 0.3],
  isleX: ['w', 0.66],
  sunX: ['w', 0.55],
  palmX: ['w', 0.9],
  crownX: ['w', 0.76],
  crownY: ['h', 0.2],
};

const TALL: Plan<Spot> = {
  horizon: ['h', 0.36],
  shoreL: ['h', 0.62],
  shoreR: ['h', 0.68],
  houseL: ['w', 0.02],
  houseR: ['w', 0.6],
  eave: ['h', 0.665],
  ridge: ['h', 0.59],
  base: ['h', 0.8],
  wallTop: ['h', 0.755],
  wallR: ['w', 0.74],
  gate: ['w', 0.6],
  isleX: ['w', 0.24],
  sunX: ['w', 0.55],
  palmX: ['w', 0.97],
  crownX: ['w', 0.8],
  crownY: ['h', 0.42],
};

const layoutOf = (f: Frame): Layout => planOf(f, WIDE, TALL);

type Hour = 'day' | 'dusk' | 'night';
// The colors tell the hour: a dark top of the sky is dusk, a dark sky near the horizon is night.
const hourOf = (c: Colors<K>): Hour => (isDark(c.sky3) ? 'night' : isDark(c.sky0) ? 'dusk' : 'day');

const shoreAt = (f: Frame, m: Layout, x: number): number =>
  m.shoreL + ((m.shoreR - m.shoreL) * x) / f.w + Math.round(noise1(x / 23, 3) * 3);

// ---- sea and beach ----

// Bands of color from the deep sea to the shallows over the reef, their edges wavering and dithered.
const seaPixel = (f: Frame, m: Layout, c: Colors<K>, x: number, y: number): string => {
  const shore = shoreAt(f, m, x);
  const u = (y - m.horizon) / Math.max(1, shore - m.horizon);
  const bands = [c.sea0, c.sea1, c.sea2, c.sea3, c.sea4];
  const pos = Math.min(3.999, Math.max(0, (u ** 0.8 + (noise1(x / 17, Math.floor(u * 5)) - 0.5) * 0.08) * 4));
  const i = Math.floor(pos);
  return (pos - i > 0.5 + (bayer(x, y) - 0.5) * 0.9 ? bands[i + 1] : bands[i]) as string;
};

const sandPixel = (f: Frame, m: Layout, c: Colors<K>, x: number, y: number): string => {
  const r = rand(x * 13 + y, 7);
  if (y - shoreAt(f, m, x) < 3) return r < 0.5 ? c.sandLo : c.sand;
  return r < 0.06 ? c.sandLo : r > 0.985 ? c.foam : c.sand;
};

const shoreLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement => {
  const m = layoutOf(f);
  return pixelLayer(`okinawa-shore:${Object.values(c).join('')}`, f.w, f.h - m.horizon, (x, y0) => {
    const y = y0 + m.horizon;
    return y < shoreAt(f, m, x) ? seaPixel(f, m, c, x, y) : sandPixel(f, m, c, x, y);
  });
};

// A small island on the horizon: a rocky flank under a cap of green.
const paintIsle = (g: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const half = Math.round(f.w * (f.w > f.h ? 0.09 : 0.16));
  fillColumns(g, f.w, m.horizon + 1, c.stoneLo, (x) => {
    const u = Math.abs(x - m.isleX) / half;
    return u > 1 ? m.horizon + 1 : m.horizon - (1 - u * u) * half * 0.22 - noise1(x / 4, 9) * 2;
  });
  fillColumns(g, f.w, m.horizon - 2, c.leafLo, (x) => {
    const u = Math.abs(x - m.isleX) / (half * 0.85);
    return u > 1 ? m.horizon : m.horizon - (1 - u * u) * half * 0.26 - noise1(x / 3, 10) * 3;
  });
};

// The waves wash up the beach and slide back once every four beats, leaving a foam line and wet sand.
const wash = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const phase = frac(f.beat / 4);
  const reach = Math.sin(phase * Math.PI) ** 0.7 * (f.w > f.h ? 9 : 11);
  for (let x = 0; x < f.w; x += 1) {
    const shore = shoreAt(f, m, x) - 2;
    const edge = Math.round(shore + reach + Math.sin(x / 9 + f.t * 0.8) * 1.5);
    if (edge > shore) {
      ctx.fillStyle = (x + edge) % 2 === 0 ? c.sea4 : c.sea3;
      ctx.fillRect(x, shore, 1, edge - shore);
    }
    if (noise1(x / 5 + f.t * 0.6, 17) > 0.3) fillRect(ctx, c.foam, x, edge, 1, 1);
  }
};

// The reef's edge far out, where small breakers keep turning white.
const reef = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const y = Math.round(m.horizon + (m.shoreL - m.horizon) * 0.32);
  for (let x = 0; x < f.w; x += 2) {
    const n = noise1(x / 7 - f.t * 0.7, 23);
    if (n > 0.55) fillRect(ctx, c.foam, x, y + Math.round(noise1(x / 30, 24) * 3), n > 0.7 ? 2 : 1, 1);
  }
};

// ---- the old house ----

// The hipped roof: red tiles in rows ribbed with white mortar, a white ridge and hips.
const paintRoof = (g: Ctx, m: Layout, c: Colors<K>): void => {
  const w = m.houseR - m.houseL;
  const rise = m.eave - m.ridge;
  for (let y = m.ridge; y <= m.eave; y++) {
    const u = (y - m.ridge) / rise;
    const inset = Math.round((1 - u) * w * 0.26);
    const l = m.houseL - 3 + inset;
    const r = m.houseR + 3 - inset;
    for (let x = l; x <= r; x++) {
      g.fillStyle = (x - m.houseL) % 3 === 0 ? c.mortar : (y - m.ridge) % 2 === 0 ? c.roof : c.roofLo;
      g.fillRect(x, y, 1, 1);
    }
    fillRect(g, c.mortar, l, y, 1, 1);
    fillRect(g, c.mortar, r, y, 1, 1);
  }
  fillRect(g, c.mortar, m.houseL - 3 + Math.round(w * 0.26), m.ridge - 1, w + 6 - Math.round(w * 0.52), 2);
  fillRect(g, c.ink, m.houseL - 3, m.eave + 1, w + 7, 1);
};

// Under the deep eaves: posts, sliding doors pushed open on a dim room, and the shade of the eaves.
const paintHouseFront = (g: Ctx, m: Layout, c: Colors<K>): void => {
  const top = m.eave + 2;
  const w = m.houseR - m.houseL;
  fillRect(g, c.woodLo, m.houseL, top, w, m.base - top);
  for (let x = m.houseL + 1; x < m.houseR - 2; x += 8) {
    fillRect(g, c.wood, x, top, 2, m.base - top);
    fillRect(g, x % 16 < 8 ? c.glow : c.wood, x + 3, top + 3, 4, m.base - top - 3);
  }
  fillRect(g, c.ink, m.houseL, top, w, 2);
};

// A wall of rounded coral stones with a gap for the gate.
const paintStoneWall = (g: Ctx, m: Layout, c: Colors<K>): void => {
  const bottom = m.base + 3;
  for (let y = m.wallTop, row = 0; y < bottom; y += 3, row++) {
    for (let x = -2 + (row % 2) * 3; x < m.wallR; x += 6) {
      if (x + 5 > m.gate && x < m.gate + 13) continue;
      fillRect(g, c.stoneLo, x, y, 6, 3);
      fillRect(g, c.stone, x + 1, y, 4, 2);
      fillRect(g, c.mortar, x + 1, y, 2, 1);
    }
  }
};

// A lion-dog guardian sitting up and facing us, mouth open (the other of the pair keeps it shut). o ink, s glaze,
// d the curls of its mane, k eyes and mouth, w teeth.
const SHISA: Sprite = [
  '..o.oooo.o..',
  '.oooddddooo.',
  'oddssssssddo',
  'odskssssksdo',
  'odssskksssdo',
  'odswwwwwwsdo',
  'odskkkkkksdo',
  '.oddssssddo.',
  '..osssssso..',
  '.osdsssdso..',
  '.osdsssdso..',
  'osssdsdssso.',
  'oooooooooooo',
];
const SHISA_SHUT: Sprite = SHISA.map((row, y) => (y === 5 ? 'odssssssssdo' : y === 6 ? 'odskkkkkksdo' : row));
const shisaPalette = paletteBy<K>((c) => ({ o: c.ink, s: c.shisa, d: c.roofLo, k: c.ink, w: c.mortar }));

// A hibiscus bloom: r petals, y its stamen.
const HIBISCUS: Sprite = ['.r.r.', 'rrrrr', '.ryr.', 'rrrrr', '.r.r.'];
const hibiscusPalette = paletteBy<K>((c) => ({ r: c.flower, y: c.sun }));

const paintGarden = (g: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  for (let i = 0; i < 9; i++) {
    const x = m.houseL + Math.round(rand(i, 41) * (m.gate - m.houseL - 6));
    const y = m.wallTop + 2 + Math.round(rand(i, 42) * 6);
    puff(g, x, y, 4 + Math.round(rand(i, 43) * 3), [c.leafLo, c.leaf, c.leafLit]);
  }
  for (let i = 0; i < 10; i++)
    drawSprite(
      g,
      HIBISCUS,
      hibiscusPalette(c),
      m.houseL + Math.round(rand(i, 44) * (m.gate - m.houseL - 8)),
      m.wallTop + Math.round(rand(i, 45) * 9) - 3,
    );
  const big = f.w > f.h ? 0 : 1;
  for (const x of [m.gate - 3, m.gate + 12]) {
    fillRect(g, c.stoneLo, x - 1, m.wallTop - 3, 5, m.base + 3 - m.wallTop + 3);
    fillRect(g, c.stone, x, m.wallTop - 3, 3, m.base + 3 - m.wallTop + 3);
  }
  drawSprite(g, SHISA, shisaPalette(c), m.gate - 7 - big, m.wallTop - 16);
  drawSprite(g, SHISA_SHUT, shisaPalette(c), m.gate + 8, m.wallTop - 16);
};

// A starfish (s, with its shade d) and shells (w, p) washed up, and footprints from the gate down to the water.
const STARFISH: Sprite = ['..s..', 'sssss', '.sds.', 's...s'];
const SHELL: Sprite = ['.ww.', 'wpww'];
const beachPalette = paletteBy<K>((c) => ({ s: c.shisa, d: c.roofLo, w: c.mortar, p: c.flower }));

const paintBeach = (g: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const sand = m.base + 6;
  drawSprite(g, STARFISH, beachPalette(c), Math.round(f.w * 0.55), Math.round(sand + (f.h - sand) * 0.55));
  for (let i = 0; i < 5; i++)
    drawSprite(g, SHELL, beachPalette(c), Math.round(rand(i, 81) * f.w * 0.9), Math.round(sand + rand(i, 82) * (f.h - sand)));
  for (let k = 0; k < 14; k++) {
    const x = Math.round(m.gate + 5 + k * 4 + (k % 2) * 2);
    const y = Math.round(m.base + 5 + k * ((f.h - m.base) * 0.04) + (k % 2) * 2);
    if (y < f.h) fillRect(g, c.sandLo, x, y, 2, 1);
  }
};

// Big dark trees behind the house that shelter it from typhoons.
const paintGrove = (g: Ctx, m: Layout, c: Colors<K>): void => {
  for (let i = 0; i < 14; i++) {
    const x = m.houseL - 4 + Math.round(rand(i, 51) * (m.houseR - m.houseL + 14));
    const y = m.ridge + Math.round(rand(i, 52) * (m.eave - m.ridge));
    puff(g, x, y, 5 + Math.round(rand(i, 53) * 4), [c.leafLo, c.leafLo, c.leaf]);
  }
};

const houseLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('okinawa-house', f, c, (g) => {
    const m = layoutOf(f);
    paintGrove(g, m, c);
    paintHouseFront(g, m, c);
    paintRoof(g, m, c);
    drawSprite(g, SHISA, shisaPalette(c), Math.round((m.houseL + m.houseR) / 2) - 6, m.ridge - 13);
    paintBeach(g, f, m, c);
    paintStoneWall(g, m, c);
    paintGarden(g, f, m, c);
  });

// ---- the palm ----

// The trunk bends from its foot up to the crown, ringed in two browns.
const palmTrunk = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const foot = f.h + 4;
  for (let y = m.crownY; y < foot; y++) {
    const u = (y - m.crownY) / (foot - m.crownY);
    const x = Math.round(m.crownX + (m.palmX - m.crownX) * u ** 0.6);
    const half = 2 + Math.round(u * 2);
    fillRect(ctx, c.trunkLo, x - half, y, half * 2 + 1, 1);
    fillRect(ctx, y % 4 < 2 ? c.trunk : c.trunkLo, x - half + 1, y, half * 2 - 1, 1);
  }
};

// One frond: a spine arching out and drooping, with leaflets hanging from it that shorten toward the tip.
const frond = (ctx: Ctx, x0: number, y0: number, angle: number, len: number, c: Colors<K>): void => {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  for (let k = 0; k < len; k++) {
    const t = k / len;
    const x = Math.round(x0 + dx * k);
    const y = Math.round(y0 + dy * k + t * t * len * 0.6);
    const leaf = Math.round((1 - t) * 6 * (k % 3 === 0 ? 0.6 : 1)) + 1;
    fillRect(ctx, k % 2 === 0 ? c.leaf : c.leafLo, x, y + 1, 1, leaf);
    fillRect(ctx, c.leafLit, x, y, 1, 1);
  }
};

const palmCrown = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const len = Math.round(f.h * (f.w > f.h ? 0.2 : 0.11));
  const sway = Math.sin(f.t * 0.9) * 0.06 + f.kick * 0.03;
  for (let i = 0; i < 11; i++)
    frond(ctx, m.crownX, m.crownY, -Math.PI * (1.12 - i * 0.12) + sway * (i % 2 === 0 ? 1 : -1), len * (i % 2 === 0 ? 1 : 0.8), c);
  for (let k = 0; k < 3; k++) disc(ctx, m.crownX - 2 + k * 2, m.crownY + 3, 1, () => c.trunkLo);
};

// ---- boat, crab and sky ----

// A narrow island boat with a small sail. s sail, l its seam, o ink, w hull, d hull shade, p boatman.
const BOAT: Sprite = [
  '.......s.........',
  '.......ss........',
  '.......sss.......',
  '.......slss......',
  '.......ssss..p...',
  '.......o....ppp..',
  'wwwwwwwwwwwwwwwww',
  '.ddddddddddddddd.',
  '...ddddddddddd...',
];
const boatPalette = paletteBy<K>((c) => ({ s: c.mortar, l: c.flower, o: c.ink, w: c.wood, d: c.woodLo, p: c.ink }));

// A hermit crab scuttling along the sand. s shell, l legs, e eyes.
const CRAB: readonly Sprite[] = [
  ['..oo...', '.osso..', 'osshso.', 'ossssoe', '.l.l.ll'],
  ['..oo...', '.osso..', 'osshso.', 'ossssoe', 'l.l.l.l'],
];
const crabPalette = paletteBy<K>((c) => ({ o: c.ink, s: c.shisa, h: c.sun, l: c.ink, e: c.ink }));
const birdPalette = paletteBy<K>((c) => ({ o: c.foam }));

// The sun sinks in slices into the sea; the moon rides high.
const lights = (ctx: Ctx, m: Layout, c: Colors<K>): void => {
  const hour = hourOf(c);
  if (hour === 'night') moon(ctx, m.sunX, Math.round(m.horizon * 0.3), 7, c.sun, c.cloudLo);
  if (hour !== 'dusk') return;
  drawGlow(ctx, c.glow, m.sunX, m.horizon, 40, 22, 0.6, 5);
  disc(ctx, m.sunX, m.horizon - 4, 10, (dy) => (dy > 2 && (dy & 3) === 3 ? null : c.sun));
};

// Towering clouds standing on the horizon and smaller ones higher up, drifting slowly.
const clouds = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  for (let i = 0; i < 5; i++) {
    const cloud = cloudCanvas(i % 3, 12 + (i % 2) * 8, c.cloud, c.cloudLo);
    const x = wrap(rand(i, 61) * (f.w + cloud.width) + f.t * 1.5, f.w + cloud.width) - cloud.width;
    ctx.drawImage(cloud, Math.round(x), m.horizon - cloud.height + 2 - (i % 2) * Math.round(m.horizon * 0.35));
  }
};

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  skyBase(ctx, f, {
    bottom: m.horizon + 1,
    stops: [c.sky0, c.sky1, c.sky2, c.sky3],
    stars: hourOf(c) === 'night' ? [c.foam, c.cloud] : null,
    seed: 67,
  });
  lights(ctx, m, c);
  clouds(ctx, f, m, c);
};

const isleLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement => frameLayer('okinawa-isle', f, c, (g) => paintIsle(g, f, layoutOf(f), c));

// The light's path on the water, glittering more on the beat.
const sunPath = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const tick = Math.floor(f.t * 4);
  const count = hourOf(c) === 'day' ? 0 : 3 + Math.round(f.kick * 2);
  for (let y = m.horizon + 1; y < m.shoreL; y += 2) {
    const d = (y - m.horizon) / (m.shoreL - m.horizon);
    for (let k = 0; k < count; k++) {
      if (rand(y * 7 + k, tick) < 0.35) continue;
      fillRect(ctx, c.sun, Math.round(m.sunX + (rand(y * 3 + k, tick + 9) - 0.5) * (4 + d * 40)), y, 1 + Math.floor(d * 4 * rand(k, y)), 1);
    }
  }
};

const sea = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  ctx.drawImage(shoreLayer(f, c), 0, m.horizon);
  ctx.drawImage(isleLayer(f, c), 0, 0);
  reef(ctx, f, m, c);
  glints(ctx, f, m.horizon + 2, m.shoreL, c.foam, Math.round(f.w / (f.kick > 0.5 ? 5 : 8)), 71);
  sunPath(ctx, f, m, c);
  const bx = Math.round(wrap(f.t * 3 + f.w * 0.5, f.w + 60) - 30);
  const by = Math.round(m.horizon + (m.shoreL - m.horizon) * 0.45 + Math.sin(f.t * 1.4) * 0.8) - BOAT.length;
  drawSprite(ctx, BOAT, boatPalette(c), bx, by);
  wash(ctx, f, m, c);
};

const land = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  if (hourOf(c) !== 'day')
    drawGlow(ctx, c.glow, (m.houseL + m.houseR) / 2, m.base - 4, (m.houseR - m.houseL) * 0.6, 10, 0.35 + f.kick * 0.15);
  ctx.drawImage(houseLayer(f, c), 0, 0);
  const cx = Math.round(wrap(f.t * 2.5, f.w * 0.5) + f.w * 0.35);
  drawSprite(ctx, CRAB[Math.floor(f.beat * 2) % 2] as Sprite, crabPalette(c), cx, Math.round(shoreAt(f, m, cx) + (f.h - m.shoreR) * 0.6));
};

const palm = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  palmTrunk(ctx, f, m, c);
  palmCrown(ctx, f, m, c);
  if (hourOf(c) !== 'night')
    flock(ctx, f, BIRD, birdPalette(c), { count: 3, top: m.horizon * 0.25, span: m.horizon * 0.3, speed: 7, seed: 73 });
};

export const okinawaShore = defineScene<K>({
  id: 'okinawa-shore',
  title: 'Island Shore',
  mood: { valence: 0.7, energy: 0 },
  styles: ['summer-festival', 'nineties-pop', 'grand-field', 'cozy-village', 'island-breeze'],
  variants: [
    {
      // High noon: a deep blue sky, towering clouds and the reef glowing emerald.
      mood: { valence: 0.8, energy: 0.4 },
      colors: {
        sky0: '#1e6ad8',
        sky1: '#3c8ee8',
        sky2: '#72b6f2',
        sky3: '#bfe4fa',
        sun: '#fff6b8',
        cloud: '#ffffff',
        cloudLo: '#c4daf0',
        sea0: '#1a58b0',
        sea1: '#1c86c4',
        sea2: '#16b0a8',
        sea3: '#48d8c4',
        sea4: '#a6f0e0',
        foam: '#ffffff',
        sand: '#fbf2dc',
        sandLo: '#e6d6b2',
        roof: '#d8503a',
        roofLo: '#a8382e',
        mortar: '#fff6ea',
        wood: '#8a5a3a',
        woodLo: '#3e2a24',
        stone: '#dcd0b4',
        stoneLo: '#a8987a',
        leaf: '#2e9a4a',
        leafLo: '#1a5e36',
        leafLit: '#7cd062',
        flower: '#f0283c',
        trunk: '#a8825a',
        trunkLo: '#6e5038',
        shisa: '#d8803e',
        ink: '#2a1a18',
        glow: '#3e2a24',
      },
    },
    {
      // Sunset: the sun sinking beside the island, the sea gone gold and violet.
      mood: { valence: 0.4, energy: -0.2 },
      colors: {
        sky0: '#2c2a66',
        sky1: '#8a4a7e',
        sky2: '#f0786a',
        sky3: '#ffc078',
        sun: '#fff0b0',
        cloud: '#ffb08a',
        cloudLo: '#a85a7a',
        sea0: '#3a3a7a',
        sea1: '#6a4a8a',
        sea2: '#c86a7a',
        sea3: '#f09a7a',
        sea4: '#ffcc9a',
        foam: '#fff0dc',
        sand: '#f4c8a0',
        sandLo: '#c89480',
        roof: '#c8442e',
        roofLo: '#842a2a',
        mortar: '#ffe6cc',
        wood: '#6a3e30',
        woodLo: '#2e1a22',
        stone: '#d4a88c',
        stoneLo: '#8e6a6a',
        leaf: '#3a5a3a',
        leafLo: '#22302e',
        leafLit: '#8a9a52',
        flower: '#e8283a',
        trunk: '#7a5444',
        trunkLo: '#4a3034',
        shisa: '#d07040',
        ink: '#1e1018',
        glow: '#ffb060',
      },
    },
    {
      // A warm moonlit night: the sea dark teal, a lamp lit inside the house.
      mood: { valence: 0.05, energy: -0.5 },
      colors: {
        sky0: '#060c26',
        sky1: '#0e1a40',
        sky2: '#16285a',
        sky3: '#20386a',
        sun: '#f6f2dc',
        cloud: '#4a5a8a',
        cloudLo: '#2a3460',
        sea0: '#0a1a3a',
        sea1: '#0c2a4a',
        sea2: '#0e4250',
        sea3: '#1a6a6a',
        sea4: '#3a9a8a',
        foam: '#d8f0f0',
        sand: '#8a94aa',
        sandLo: '#5e6884',
        roof: '#8a3a3a',
        roofLo: '#5a2630',
        mortar: '#b8bcd0',
        wood: '#4a3438',
        woodLo: '#1a1220',
        stone: '#7a7c94',
        stoneLo: '#4a4c66',
        leaf: '#1a3a3a',
        leafLo: '#0e1e26',
        leafLit: '#3a6a52',
        flower: '#b8203a',
        trunk: '#4a4048',
        trunkLo: '#2a2230',
        shisa: '#8a5a4a',
        ink: '#06060e',
        glow: '#ffb050',
      },
    },
  ],
  layers: [sky, sea, land, palm],
});
