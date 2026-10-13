// A cliff-top village on a volcanic island at sunset: white cubic houses and blue domes cascading toward the sea,
// a windmill turning, bells swinging on the beat, and a cat on the wall watching the sun sink into the water.
import { type Ctx, drawSprite, fillRect, type Sprite } from 'mojipx';
import { bayer, ditherGradient, frac, noise1, pixelLine, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { clamp01, drawGlow, paletteBy, spanDisc, wrap } from './batch-1-helpers.ts';
import { frameLayer, glints, wideOf } from './batch-6-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sky3'
  | 'sun'
  | 'sunLo'
  | 'sea0'
  | 'sea1'
  | 'glint'
  | 'wall'
  | 'wallLo'
  | 'ochre'
  | 'dome'
  | 'domeHi'
  | 'win'
  | 'lit'
  | 'rock'
  | 'rockLo'
  | 'rockHi'
  | 'flower'
  | 'flowerHi'
  | 'leaf'
  | 'cat'
  | 'catHi'
  | 'dark';

// A cat sitting with its back to us, looking out to sea: o outline, c fur, h fur lit by the low sun.
const CAT: Sprite = [
  '..o.........o.....',
  '.oco.......oco....',
  '.occo.....occho...',
  '.occcoooooocccho..',
  '.occccccccccchho..',
  '.occcccccccccchho.',
  '.occcccccccccchho.',
  '.occcccccccccchho.',
  '..occcccccccchho..',
  '...occcccccchho...',
  '....occcccchho....',
  '...occcccccchho...',
  '..occcccccccchho..',
  '.occcccccccccchho.',
  '.occcccccccccchho.',
  'occcccccccccccchho',
  'occcccccccccccchho',
  'occcccccccccccchho',
  '.occcccccccccchho.',
  '..oooooooooooooo..',
];

// A small sailing boat: d hull, s sail, m mast.
const SAILBOAT: Sprite = [
  '....m....',
  '...ms....',
  '..mss....',
  '..msss...',
  '.mssss...',
  '.msssss..',
  '..m......',
  'ddddddddd',
  '.ddddddd.',
];

const catPalette = paletteBy<K>((c) => ({ o: c.dark, c: c.cat, h: c.catHi }));
const boatPalette = paletteBy<K>((c) => ({ d: c.dark, s: c.wall, m: c.dark }));

// ---- layout: the cliff's ridge falls from the top left toward the sea on the right ----

type Slope = {
  readonly hz: number;
  readonly yA: number;
  readonly yB: number;
  readonly xEnd: number;
  readonly band: number;
  readonly wall: number;
  readonly unit: number;
};

const slopeOf = (f: Frame): Slope =>
  wideOf(f)
    ? {
        hz: Math.round(f.h * 0.56),
        yA: Math.round(f.h * 0.22),
        yB: Math.round(f.h * 0.5),
        xEnd: Math.round(f.w * 0.58),
        band: 66,
        wall: Math.round(f.h * 0.87),
        unit: 1,
      }
    : {
        hz: Math.round(f.h * 0.42),
        yA: Math.round(f.h * 0.3),
        yB: Math.round(f.h * 0.55),
        xEnd: Math.round(f.w * 0.66),
        band: 150,
        wall: Math.round(f.h * 0.88),
        unit: 1.25,
      };

const ridgeAt = (s: Slope, x: number): number => s.yA + (s.yB - s.yA) * clamp01(x / s.xEnd);

// The top of the rock in a column: the ridge, then the cliff face dropping steeply into the sea.
const rockTopAt = (s: Slope, x: number): number => (x <= s.xEnd ? ridgeAt(s, x) : s.yB + (x - s.xEnd) * 2.6);

// ---- sky and sea ----

// The sun's centre and radius.
const sunOf = (f: Frame): readonly [number, number, number] => {
  const s = slopeOf(f);
  const r = Math.round(Math.min(f.w, f.h) * 0.075);
  // The sun sinks slowly while the scene is on, stopping when it is two-thirds under.
  return [Math.round(f.w * (wideOf(f) ? 0.79 : 0.74)), Math.round(s.hz - r * 0.7 + Math.min(1, f.t / 70) * r * 1.0), r];
};

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const s = slopeOf(f);
  const [sunX, sunY, sunR] = sunOf(f);
  ctx.drawImage(ditherGradient(f.w, s.hz, [c.sky0, c.sky1, c.sky2, c.sky3]), 0, 0);
  drawGlow(ctx, c.sunLo, sunX, s.hz - 4, sunR * 7, sunR * 3, 0.55);
  drawGlow(ctx, c.sun, sunX, sunY, sunR * 3, sunR * 3, 0.5 + f.kick * 0.2);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, f.w, s.hz);
  ctx.clip();
  ctx.fillStyle = c.sun;
  spanDisc(ctx, sunX, sunY, sunR);
  ctx.fillStyle = c.sunLo;
  for (let y = sunY + 2; y < sunY + sunR; y += 3) ctx.fillRect(sunX - sunR, y, sunR * 2 + 1, 1);
  ctx.restore();
  streaks(ctx, f, c, s.hz);
};

// Long thin clouds catching the light, drifting very slowly.
const streaks = (ctx: Ctx, f: Frame, c: Colors<K>, hz: number): void => {
  for (let i = 0; i < 6; i++) {
    const len = Math.round(18 + rand(i, 51) * 46);
    const x = Math.round(wrap(rand(i, 52) * (f.w + len) + f.t * 1.2, f.w + len) - len);
    const y = Math.round(hz * (0.18 + rand(i, 53) * 0.62));
    fillRect(ctx, i % 2 === 0 ? c.sky3 : c.sky2, x, y, len, 1);
    fillRect(ctx, c.sky1, x + 4, y - 1, Math.round(len * 0.6), 1);
  }
};

const seaLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('santorini-sea', f, c, (g) => {
    const s = slopeOf(f);
    g.drawImage(ditherGradient(f.w, f.h - s.hz, [c.sea0, c.sea1, c.sea1]), 0, s.hz);
    // Islands of the caldera low on the horizon.
    g.fillStyle = c.rockLo;
    for (let x = 0; x < f.w; x++) {
      const isle = noise1(x / 26, 3) - 0.58;
      if (isle > 0) g.fillRect(x, Math.round(s.hz - isle * 24), 1, Math.ceil(isle * 24));
    }
    fillRect(g, c.sky3, 0, s.hz, f.w, 1);
  });

// The sun's path on the water: dashes that shimmer in place, wider toward us.
const sunPath = (ctx: Ctx, f: Frame, c: Colors<K>, hz: number): void => {
  const [sunX, , sunR] = sunOf(f);
  const flick = Math.floor(f.t * 5);
  for (let y = hz + 1; y < f.h; y += 2) {
    const d = (y - hz) / (f.h - hz);
    const half = sunR * (0.6 + d * 2.2);
    const len = 1 + Math.round(rand(y, flick) * (2 + (1 - d) * 4));
    const x = sunX + (rand(y, flick + 7) * 2 - 1) * half;
    fillRect(ctx, d < 0.3 ? c.sun : c.glint, Math.round(x - len / 2), y, len, 1);
  }
};

const sea = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const s = slopeOf(f);
  ctx.drawImage(seaLayer(f, c), 0, 0);
  sunPath(ctx, f, c, s.hz);
  glints(ctx, f, s.hz + 2, f.h, c.glint, Math.round(f.w / 6), 31);
  const bx = Math.round(wrap(f.t * 2.5 + f.w * 0.7, f.w + 40) - 20);
  const by = Math.round(s.hz + (f.h - s.hz) * 0.18 + Math.sin(f.t * 1.4));
  drawSprite(ctx, SAILBOAT, boatPalette(c), bx, by - SAILBOAT.length);
};

// ---- the cliff and the village ----

const paintRock = (g: Ctx, f: Frame, c: Colors<K>, s: Slope): void => {
  const tones = [c.rockHi, c.rock, c.rock, c.rockLo, c.rock, c.rockHi, c.rock, c.rockLo, c.rockLo];
  for (let x = 0; x < f.w; x++) {
    const top = Math.round(rockTopAt(s, x));
    for (let y = top; y < s.wall + 2; y++) {
      const band = (y + noise1(x / 14, 5) * 8 + noise1(x / 4, 6) * 2) / 9 + (y - top) / 60;
      const i = Math.min(tones.length - 1, (Math.floor(band) % 6) + Math.floor((y - top) / 40));
      const tone = frac(band) > 0.82 + bayer(x, y) * 0.18 ? c.rockLo : tones[i];
      fillRect(g, tone as string, x, y, 1, 1);
    }
  }
};

type House = { readonly x: number; readonly base: number; readonly w: number; readonly h: number; readonly i: number };

const paintOpenings = (g: Ctx, c: Colors<K>, b: House): void => {
  const top = b.base - b.h;
  const door = b.x + 2 + Math.floor(rand(b.i, 61) * Math.max(1, b.w - 6));
  fillRect(g, b.i % 3 === 0 ? c.dome : c.win, door, b.base - 4, 2, 4);
  const wx = b.x + b.w - 4;
  if (wx > door + 2) fillRect(g, rand(b.i, 62) < 0.4 ? c.lit : c.win, wx, top + 3, 2, 2);
};

const paintHouse = (g: Ctx, c: Colors<K>, b: House): void => {
  const top = b.base - b.h;
  const body = b.i % 7 === 3 ? c.ochre : c.wall;
  fillRect(g, body, b.x, top, b.w, b.h);
  fillRect(g, c.wallLo, b.x, top, 1, b.h);
  fillRect(g, c.wallLo, b.x, b.base - 1, b.w, 1);
  if (b.i % 3 === 1) {
    // A barrel-vaulted roof.
    for (let k = 1; k < b.w - 1; k++) {
      const lift = Math.round(Math.sqrt(1 - ((k - (b.w - 1) / 2) / ((b.w - 1) / 2)) ** 2) * 3);
      fillRect(g, body, b.x + k, top - lift, 1, lift);
    }
  } else fillRect(g, c.wallLo, b.x + 1, top + 1, b.w - 1, 1);
  paintOpenings(g, c, b);
};

const housesOf = (s: Slope): readonly House[] => {
  const out: House[] = [];
  const tierH = Math.round(10 * s.unit);
  const tiers = Math.floor(s.band / tierH);
  for (let r = 0; r < tiers; r++)
    for (let x = -6 + (r % 2) * 7, i = 0; x < s.xEnd + 40; i++) {
      const w = Math.round((11 + rand(i, r + 70) * 9) * s.unit);
      const base = Math.round(ridgeAt(s, x + w / 2) + 5 + r * tierH + rand(i, r + 71) * 3);
      if (x + w <= cliffLimit(s, base) && base < s.wall)
        out.push({ x, base, w, h: Math.round((8 + rand(i, r + 72) * 5) * s.unit), i: i * 7 + r });
      x += w + Math.floor(rand(i, r + 73) * 3);
    }
  return out;
};

// How far right a house resting at `base` may reach before the cliff falls away under it.
const cliffLimit = (s: Slope, base: number): number => s.xEnd + Math.max(0, base - s.yB) / 2.6 - 2;

const paintChurch = (g: Ctx, c: Colors<K>, s: Slope, x: number): void => {
  const u = s.unit;
  const base = Math.round(ridgeAt(s, x) + 16 * u);
  const w = Math.round(16 * u);
  const top = base - Math.round(11 * u);
  fillRect(g, c.wall, x, top, w, base - top);
  fillRect(g, c.wallLo, x, top, 1, base - top);
  fillRect(g, c.dome, x + Math.round(w / 2) - 1, base - 6, 3, 6);
  const r = Math.round(6 * u);
  const cx = x + Math.round(w / 2);
  for (let dy = 0; dy <= r; dy++) {
    const half = Math.round(r * Math.sqrt(1 - (dy / (r + 0.5)) ** 2));
    fillRect(g, dy > r * 0.55 ? c.domeHi : c.dome, cx - half, top - dy, half * 2 + 1, 1);
    fillRect(g, c.domeHi, cx - half + 1, top - dy, 1, 1);
  }
  fillRect(g, c.wall, cx, top - r - 5, 1, 4);
  fillRect(g, c.wall, cx - 1, top - r - 4, 3, 1);
};

const towerOf = (f: Frame): { readonly x: number; readonly top: number; readonly w: number } => {
  const s = slopeOf(f);
  const x = Math.round(s.xEnd * 0.52) + Math.round(18 * s.unit);
  const w = Math.round(9 * s.unit);
  return { x, top: Math.round(ridgeAt(s, x) - 4 * s.unit), w };
};

const paintBelfry = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const t = towerOf(f);
  const s = slopeOf(f);
  const base = Math.round(ridgeAt(s, t.x) + 16 * s.unit);
  fillRect(g, c.wall, t.x, t.top, t.w, base - t.top);
  fillRect(g, c.wallLo, t.x, t.top, 1, base - t.top);
  fillRect(g, c.win, t.x + 2, t.top + 3, t.w - 4, 5);
  fillRect(g, c.wall, t.x + Math.floor(t.w / 2), t.top + 3, 1, 5);
  for (let k = 0; k < t.w; k++)
    fillRect(g, c.dome, t.x + k, t.top - Math.round(Math.sqrt(1 - ((k - (t.w - 1) / 2) / (t.w / 2)) ** 2) * 3), 1, 3);
  fillRect(g, c.wall, t.x + Math.floor(t.w / 2), t.top - 7, 1, 4);
  fillRect(g, c.wall, t.x + Math.floor(t.w / 2) - 1, t.top - 6, 3, 1);
};

const windmillOf = (f: Frame): { readonly x: number; readonly y: number; readonly arm: number } => {
  const s = slopeOf(f);
  const x = Math.round(s.xEnd * 0.16);
  return { x, y: Math.round(ridgeAt(s, x) - 20 * s.unit), arm: Math.round(16 * s.unit) };
};

const paintWindmill = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const m = windmillOf(f);
  const s = slopeOf(f);
  const half = Math.round(6 * s.unit);
  const base = Math.round(ridgeAt(s, m.x) + 6);
  fillRect(g, c.wall, m.x - half, m.y, half * 2 + 1, base - m.y);
  fillRect(g, c.wallLo, m.x - half, m.y, 2, base - m.y);
  fillRect(g, c.win, m.x - 1, base - 6, 2, 6);
  for (let r = 0; r < half + 2; r++) fillRect(g, c.rockLo, m.x - r, m.y - half - 2 + r, r * 2 + 1, 1);
};

const villageLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('santorini-village', f, c, (g) => {
    const s = slopeOf(f);
    paintRock(g, f, c, s);
    for (const h of housesOf(s)) paintHouse(g, c, h);
    paintWindmill(g, f, c);
    paintChurch(g, c, s, Math.round(s.xEnd * 0.52));
    paintBelfry(g, f, c);
  });

// Sails turning in sixteen steps per turn so they never shimmer.
const sails = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = windmillOf(f);
  const turn = Math.floor(f.t * 2.4) / 16;
  for (let k = 0; k < 6; k++) {
    const a = (turn + k / 6) * Math.PI * 2;
    pixelLine(ctx, m.x, m.y, m.x + Math.cos(a) * m.arm, m.y + Math.sin(a) * m.arm, c.dark);
    for (let d = 0.4; d <= 1; d += 0.2) {
      const b = a + 0.38;
      pixelLine(
        ctx,
        m.x + Math.cos(a) * m.arm * d,
        m.y + Math.sin(a) * m.arm * d,
        m.x + Math.cos(b) * m.arm * d * 0.9,
        m.y + Math.sin(b) * m.arm * d * 0.9,
        c.wall,
      );
    }
  }
  fillRect(ctx, c.dark, m.x - 1, m.y - 1, 3, 3);
};

// Two bells in the belfry, swinging one way on even beats and the other way on odd ones.
const bells = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const t = towerOf(f);
  const swing = Math.round(Math.sin(frac(f.beat / 2) * Math.PI * 2) * 1.2);
  const mid = t.x + Math.floor(t.w / 2);
  for (const x of [t.x + 3, mid + 2]) {
    if (x > t.x + t.w - 3) continue;
    fillRect(ctx, c.ochre, x + swing, t.top + 4, 1, 1);
    fillRect(ctx, c.ochre, x - 1 + swing, t.top + 5, 2, 2);
  }
};

const village = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(villageLayer(f, c), 0, 0);
  sails(ctx, f, c);
  bells(ctx, f, c);
};

// ---- the wall in front: bougainvillea spilling over it, falling petals, and the cat ----

const paintBush = (g: Ctx, f: Frame, c: Colors<K>, s: Slope): void => {
  const reach = Math.round(f.w * (wideOf(f) ? 0.26 : 0.42));
  for (let i = 0; i < 70; i++) {
    const x = rand(i, 81) ** 1.4 * reach;
    const y = s.wall - 4 - rand(i, 82) * (reach - x) * 0.45 + rand(i, 83) * 10;
    g.fillStyle = i % 3 === 0 ? c.leaf : c.flower;
    spanDisc(g, x, y, 2 + Math.floor(rand(i, 84) * 3));
    if (i % 3 !== 0) fillRect(g, c.flowerHi, Math.round(x) - 1, Math.round(y) - 1, 2, 1);
  }
};

const frontLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('santorini-front', f, c, (g) => {
    const s = slopeOf(f);
    fillRect(g, c.wall, 0, s.wall, f.w, f.h - s.wall);
    fillRect(g, c.wallLo, 0, s.wall + 3, f.w, 1);
    for (let y = s.wall + 5; y < f.h; y++)
      for (let x = 0; x < f.w; x++) if (bayer(x, y) < (y - s.wall) / (f.h - s.wall) / 2) fillRect(g, c.wallLo, x, y, 1, 1);
    paintBush(g, f, c, s);
  });

const tail = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, y: number): void => {
  const flick = Math.sin(frac(f.beat) * Math.PI) * (0.5 + f.energy * 0.5);
  for (let k = 0; k < 10; k++) {
    const curl = Math.round((k / 9) ** 2 * (2 + flick * 4));
    fillRect(ctx, c.dark, x + k, y - curl - 1, 1, 3);
    fillRect(ctx, k > 6 ? c.catHi : c.cat, x + k, y - curl, 1, 1);
  }
};

const petals = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  for (let i = 0; i < 10; i++) {
    const fall = wrap(f.t * (8 + rand(i, 91) * 6) + rand(i, 92) * f.h, f.h + 10) - 5;
    const x = wrap(rand(i, 93) * f.w * 0.5 + fall * 0.5 + Math.sin(f.t * 1.7 + i) * 4, f.w);
    fillRect(ctx, i % 2 === 0 ? c.flowerHi : c.flower, Math.round(x), Math.round(fall), 1 + (i % 3 === 0 ? 1 : 0), 1);
  }
};

const front = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const s = slopeOf(f);
  ctx.drawImage(frontLayer(f, c), 0, 0);
  const cx = Math.round(f.w * (wideOf(f) ? 0.6 : 0.62));
  const breathe = frac(f.beat / 4) < 0.5 ? 0 : 1;
  tail(ctx, f, c, cx + 15, s.wall - 1);
  drawSprite(ctx, CAT, catPalette(c), cx, s.wall - CAT.length + breathe);
  petals(ctx, f, c);
};

export const santoriniSunset = defineScene<K>({
  id: 'santorini-sunset',
  title: 'Aegean Sunset',
  mood: { valence: 0.6, energy: -0.5 },
  styles: ['cozy-village', 'summer-festival', 'town-waltz', 'credits-roll', 'bossa-cafe', 'island-breeze'],
  variants: [
    {
      // Sunset: white walls blushing peach, the sea going violet.
      mood: { valence: 0.6, energy: -0.5 },
      colors: {
        sky0: '#2c3a7a',
        sky1: '#a05a8e',
        sky2: '#f0806a',
        sky3: '#ffc46a',
        sun: '#fff0b0',
        sunLo: '#ff9a4a',
        sea0: '#c0708a',
        sea1: '#3a3270',
        glint: '#ffc88a',
        wall: '#fbe2cc',
        wallLo: '#c7a0b8',
        ochre: '#f0b070',
        dome: '#2f5fb0',
        domeHi: '#5a8ad8',
        win: '#4a3050',
        lit: '#ffd27a',
        rock: '#8a4a4a',
        rockLo: '#5a2e3e',
        rockHi: '#b8705a',
        flower: '#d8308e',
        flowerHi: '#ff7ac0',
        leaf: '#3a5a3a',
        cat: '#2e2232',
        catHi: '#ff9a5a',
        dark: '#1e1626',
      },
    },
    {
      // After the sun has gone: lilac houses, windows lit, a red ember on the horizon.
      mood: { valence: 0.15, energy: -0.75 },
      colors: {
        sky0: '#141a40',
        sky1: '#3a3a78',
        sky2: '#8a5a92',
        sky3: '#e08a7a',
        sun: '#ff8a5a',
        sunLo: '#c04a5a',
        sea0: '#6a4a7a',
        sea1: '#141a3a',
        glint: '#e08a7a',
        wall: '#aaa8cc',
        wallLo: '#6a6a9a',
        ochre: '#b08a8a',
        dome: '#2a3f8a',
        domeHi: '#4a64b0',
        win: '#1a1a3a',
        lit: '#ffc870',
        rock: '#4a3048',
        rockLo: '#2a1e34',
        rockHi: '#6a4a5a',
        flower: '#a0307a',
        flowerHi: '#d050a0',
        leaf: '#24402e',
        cat: '#16121e',
        catHi: '#e08a7a',
        dark: '#0e0c1a',
      },
    },
    {
      // Golden late afternoon: dazzling white, deep blue domes, an orange cat.
      mood: { valence: 0.8, energy: 0.2 },
      colors: {
        sky0: '#2a7ad0',
        sky1: '#7ab8e8',
        sky2: '#f6d0a0',
        sky3: '#ffe6a0',
        sun: '#fffbe0',
        sunLo: '#ffd060',
        sea0: '#5aa8d8',
        sea1: '#1a4a8a',
        glint: '#fff2c0',
        wall: '#ffffff',
        wallLo: '#c8d0e8',
        ochre: '#f6c070',
        dome: '#1f5fc0',
        domeHi: '#4a8ae8',
        win: '#2a3a5a',
        lit: '#ffe8a0',
        rock: '#a8584a',
        rockLo: '#6a3a3a',
        rockHi: '#d08a6a',
        flower: '#ff3aa0',
        flowerHi: '#ff8ad0',
        leaf: '#3a8a3a',
        cat: '#f0a050',
        catHi: '#ffe0b0',
        dark: '#3a2a30',
      },
    },
  ],
  layers: [sky, sea, village, front],
});
