// A harbour at night: a wall of towers at the foot of dark hills, their facades and searchlights playing a light show
// on the beat, everything mirrored in the water while a red-sailed junk and a ferry cross in front.
import { type Ctx, fillRect } from 'mojipx';
import { bayer, ditherGradient, frac, rand, ridgeNoise, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { drawGlow, wrap } from './batch-1-helpers.ts';
import { fillPolygon } from './batch-4-helpers.ts';
import { frameLayer, glints, lightStreak, mirrorWater, rain, wideOf } from './batch-6-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'hill'
  | 'hillLit'
  | 'tower0'
  | 'tower1'
  | 'edge'
  | 'win'
  | 'winCool'
  | 'neonA'
  | 'neonB'
  | 'neonC'
  | 'water'
  | 'glint'
  | 'hull'
  | 'sail'
  | 'sailLo'
  | 'ink'
  | 'ferry'
  | 'ferryLo'
  | 'rain';

// ---- layout ----

type Layout = {
  /** The water line along the seawall. */
  readonly shore: number;
  /** The hills' highest point above the shore, and where it is. */
  readonly hillH: number;
  readonly hillX: number;
  /** The tallest towers' height above the shore. */
  readonly towerH: number;
  readonly ferryY: number;
  readonly junkY: number;
};

const layoutOf = (f: Frame): Layout =>
  wideOf(f)
    ? {
        shore: Math.round(f.h * 0.6),
        hillH: Math.round(f.h * 0.4),
        hillX: f.w * 0.36,
        towerH: Math.round(f.h * 0.32),
        ferryY: Math.round(f.h * 0.7),
        junkY: Math.round(f.h * 0.9),
      }
    : {
        shore: Math.round(f.h * 0.5),
        hillH: Math.round(f.h * 0.27),
        hillX: f.w * 0.3,
        towerH: Math.round(f.h * 0.25),
        ferryY: Math.round(f.h * 0.6),
        junkY: Math.round(f.h * 0.84),
      };

// ---- the sky and the hills ----

const hillTop = (f: Frame, l: Layout, x: number): number => {
  const u = (x - l.hillX) / f.w;
  return l.shore - l.hillH * (1 - 1.1 * u * u) * (0.62 + 0.38 * ridgeNoise(x / 60, 71));
};

const paintHills = (g: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  for (let x = 0; x < f.w; x++) {
    const top = Math.round(hillTop(f, l, x));
    fillRect(g, c.hill, x, top, 1, l.shore - top);
  }
  // Homes on the slopes: scattered lights, thicker toward the foot of the hills.
  for (let i = 0; i < f.w * 0.5; i++) {
    const x = Math.floor(rand(i, 72) * f.w);
    const top = hillTop(f, l, x);
    const y = Math.round(top + 3 + rand(i, 73) ** 0.6 * (l.shore - top - 3));
    fillRect(g, i % 4 === 0 ? c.winCool : c.hillLit, x, y, 1, 1);
  }
};

const skyLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('harbour-sky', f, c, (g) => {
    const l = layoutOf(f);
    g.drawImage(ditherGradient(f.w, l.shore - Math.round(l.hillH * 0.45), [c.sky0, c.sky0, c.sky1, c.sky2]), 0, 0);
    fillRect(g, c.sky2, 0, l.shore - Math.round(l.hillH * 0.45), f.w, Math.round(l.hillH * 0.45));
    g.drawImage(ditherGradient(f.w, f.h - l.shore, [c.water, c.sky0]), 0, l.shore);
    paintHills(g, f, c, l);
  });

// ---- the towers ----

type Tower = { readonly x: number; readonly w: number; readonly top: number; readonly kind: 'plain' | 'spire' | 'prism' | 'cap' };

// The waterfront: a back rank of tall towers (three landmarks among them) and a lower front rank.
const towersOf = (f: Frame, l: Layout, back: boolean): readonly Tower[] => {
  const out: Tower[] = [];
  const seed = back ? 81 : 82;
  for (let x = -3, i = 0; x < f.w; i++) {
    const w = (back ? 8 : 7) + Math.floor(rand(i, seed) * (back ? 9 : 8));
    const centre = 1 - Math.min(1, Math.abs((x + w / 2) / f.w - 0.52) * 1.6);
    const height = l.towerH * (back ? 0.35 + 0.5 * centre : 0.18 + 0.2 * centre) * (0.65 + 0.35 * rand(i, seed + 1));
    out.push({ x, w, top: Math.round(l.shore - height), kind: 'plain' });
    x += w + (rand(i, seed + 2) < 0.3 ? 1 : 0);
  }
  return out;
};

const landmarksOf = (f: Frame, l: Layout): readonly Tower[] => [
  { x: Math.round(f.w * 0.3), w: 12, top: Math.round(l.shore - l.towerH * 1.02), kind: 'spire' },
  { x: Math.round(f.w * 0.52), w: 14, top: Math.round(l.shore - l.towerH * 0.92), kind: 'prism' },
  { x: Math.round(f.w * 0.7), w: 12, top: Math.round(l.shore - l.towerH * 0.82), kind: 'cap' },
];

// Lit windows: a tower keeps its own share of lights on, some floors brighter than others.
const paintWindows = (g: Ctx, c: Colors<K>, t: Tower, shore: number, pitch: number, seed: number): void => {
  const share = 0.2 + rand(t.x, seed) * 0.4;
  const cool = rand(t.x, seed + 1) < 0.35;
  for (let y = t.top + 3; y < shore - 2; y += pitch + 1)
    for (let x = t.x + 1; x < t.x + t.w - 2; x += pitch) {
      if (rand(x * 31 + y, seed + 2) > share) continue;
      fillRect(g, cool ? c.winCool : c.win, x, y, pitch - 1, 1);
    }
};

// The landmarks' crowns: a stepped top with a spire, a faceted prism with two masts, and a pyramid with a mast.
const paintCrown = (g: Ctx, c: Colors<K>, t: Tower): void => {
  const mid = t.x + Math.floor(t.w / 2);
  if (t.kind === 'spire') {
    fillRect(g, c.tower0, t.x + 2, t.top - 4, t.w - 4, 4);
    fillRect(g, c.tower0, t.x + 4, t.top - 7, t.w - 8, 3);
    fillRect(g, c.edge, mid, t.top - 14, 1, 7);
  } else if (t.kind === 'prism') {
    fillPolygon(
      g,
      [
        [t.x, t.top + 10],
        [t.x + t.w, t.top - 2],
        [t.x + t.w, t.top + 10],
      ],
      c.tower0,
    );
    fillRect(g, c.edge, t.x + t.w - 3, t.top - 10, 1, 8);
    fillRect(g, c.edge, t.x + t.w - 1, t.top - 8, 1, 6);
  } else {
    for (let k = 0; k < Math.ceil(t.w / 2); k++) fillRect(g, c.tower0, t.x + k, t.top - k, t.w - k * 2, 1);
    fillRect(g, c.edge, mid, t.top - Math.ceil(t.w / 2) - 6, 1, 6);
  }
};

const paintLandmark = (g: Ctx, c: Colors<K>, t: Tower, shore: number): void => {
  const bodyTop = t.kind === 'prism' ? t.top + 10 : t.top;
  fillRect(g, c.tower0, t.x, bodyTop, t.w, shore - bodyTop);
  paintCrown(g, c, t);
  fillRect(g, c.edge, t.x + t.w - 1, bodyTop, 1, shore - bodyTop);
  paintWindows(g, c, { ...t, top: bodyTop }, shore, 2, 91);
  if (t.kind !== 'prism') return;
  // The prism's cross-bracing.
  for (let y = bodyTop; y < shore - t.w; y += t.w)
    for (let k = 0; k < t.w; k++) {
      fillRect(g, c.edge, t.x + k, y + k, 1, 1);
      fillRect(g, c.edge, t.x + t.w - 1 - k, y + k, 1, 1);
    }
};

const skylineLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  frameLayer('harbour-skyline', f, c, (g) => {
    const l = layoutOf(f);
    for (const t of towersOf(f, l, true)) {
      fillRect(g, c.tower0, t.x, t.top, t.w, l.shore - t.top);
      paintWindows(g, c, t, l.shore, 2, 83);
    }
    for (const t of landmarksOf(f, l)) paintLandmark(g, c, t, l.shore);
    for (const t of towersOf(f, l, false)) {
      fillRect(g, c.tower1, t.x, t.top, t.w, l.shore - t.top);
      fillRect(g, c.edge, t.x, t.top, t.w, 1);
      paintWindows(g, c, t, l.shore, 3, 84);
    }
    fillRect(g, c.ink, 0, l.shore - 2, f.w, 3);
  });

// ---- the light show ----

const NEON: readonly K[] = ['neonA', 'neonB', 'neonC'];

// One searchlight: a cone of dithered light widening and fading as it reaches up from (x0, y0).
const beam = (ctx: Ctx, color: string, x0: number, y0: number, angle: number, reach: number, power: number): void => {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  for (let k = 4; k < reach; k++) {
    const fade = power * (1 - k / reach) ** 0.7;
    const half = Math.min(4, Math.floor(k * 0.06));
    for (let s = -half; s <= half; s++) {
      const x = Math.round(x0 + sin * k + cos * s);
      const y = Math.round(y0 - cos * k + sin * s);
      if (bayer(x, y) < fade * (1 - Math.abs(s) / (half + 2))) fillRect(ctx, color, x, y, 1, 1);
    }
  }
};

// Searchlights sweeping the sky from the landmark roofs: more of them, and brighter on the kick, when the music is busy.
const beams = (ctx: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  const count = 1 + Math.round(f.energy * 4);
  const marks = landmarksOf(f, l);
  for (let i = 0; i < count; i++) {
    const t = marks[i % marks.length] as Tower;
    const angle = Math.sin(f.t * (0.35 + i * 0.07) + i * 2.1) * 0.5 + (i % 2 === 0 ? -0.15 : 0.15);
    const color = c[NEON[(i + Math.floor(f.bar / 2)) % NEON.length] as K];
    beam(ctx, color, t.x + t.w / 2, t.top - 6, angle, Math.max(t.top + 20, 90), 0.55 + f.kick * 0.35);
  }
};

// The landmark facades: their edges glow in a colour that changes every bar, and a band of light climbs each beat.
const facades = (ctx: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  landmarksOf(f, l).forEach((t, i) => {
    const color = c[NEON[(i + f.bar) % NEON.length] as K];
    const bodyTop = t.kind === 'prism' ? t.top + 10 : t.top;
    const climb = Math.round(l.shore - frac(f.beat + i / 3) * (l.shore - bodyTop));
    for (let y = bodyTop; y < l.shore; y++) if (bayer(t.x, y) < 0.4 + f.kick * 0.6) fillRect(ctx, color, t.x, y, 1, 1);
    fillRect(ctx, color, t.x + t.w - 1, bodyTop, 1, l.shore - bodyTop);
    for (let x = t.x; x < t.x + t.w; x++) if (bayer(x, climb) < 0.5 + f.kick * 0.5) fillRect(ctx, color, x, climb, 1, 2);
  });
};

// Lamps along the promenade, each blinking out now and then.
const promenade = (ctx: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  for (let x = 2, i = 0; x < f.w; x += 7, i++) {
    if (Math.sin(f.t * 1.3 + i * 1.7) < -0.85) continue;
    fillRect(ctx, c.win, x, l.shore - 2, 1, 1);
  }
};

const city = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  ctx.drawImage(skyLayer(f, c), 0, 0);
  stars(ctx, f.w, l.shore - l.hillH, f.t, [c.edge, c.winCool], 14, 85, 0.8);
  beams(ctx, f, c, l);
  ctx.drawImage(skylineLayer(f, c), 0, 0);
  facades(ctx, f, c, l);
  promenade(ctx, f, c, l);
};

// ---- the harbour ----

const water = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const squash = Math.min(1.3, (l.shore - 1) / (f.h - l.shore));
  mirrorWater(ctx, f, { axis: l.shore + 1, bottom: f.h, squash, amp: 2, freq: 0.8, speed: 2.4, tint: c.water, tintLevel: 0.4 });
  glints(ctx, f, l.shore + 3, f.h, c.glint, Math.round(f.w / 5), 86);
};

// A ferry crossing right to left: a dark hull, two decks of lit windows and a mast light, its lights streaking the water.
const ferry = (ctx: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  const len = 34;
  const x = Math.round(f.w + 20 - wrap(f.t * 7 + f.w * 0.4, f.w + 80));
  const y = l.ferryY;
  fillRect(ctx, c.ferryLo, x, y - 3, len, 3);
  fillRect(ctx, c.ferryLo, x + 2, y, len - 4, 1);
  fillRect(ctx, c.ferry, x + 1, y - 7, len - 2, 4);
  fillRect(ctx, c.ferry, x + 6, y - 10, len - 14, 3);
  for (let k = 0; k < len - 4; k += 2) fillRect(ctx, c.win, x + 2 + k, y - 6, 1, 2);
  for (let k = 0; k < len - 18; k += 2) fillRect(ctx, c.win, x + 8 + k, y - 9, 1, 1);
  fillRect(ctx, c.ink, x + len / 2, y - 14, 1, 4);
  fillRect(ctx, c.neonA, x + len / 2, y - 15, 1, 1);
  for (const k of [6, 16, 26]) lightStreak(ctx, f, x + k, y + 2, 10, c.win);
};

// One battened sail: a fan of red cloth narrow at the top and swept back toward the stern, ribbed by dark battens.
const sail = (ctx: Ctx, f: Frame, c: Colors<K>, mast: number, foot: number, high: number, wide: number): void => {
  const top = foot - high;
  fillRect(ctx, c.ink, mast, top - 3, 1, high + 4);
  for (let r = 0; r < high; r++) {
    const share = r / high;
    const back = Math.round(wide * (0.35 + 0.65 * share ** 0.6) + Math.sin(f.t * 2.2 + r * 0.4) * share);
    const front = Math.round(1 + wide * 0.22 * share);
    const y = top + r;
    if (r % 5 === 4) {
      fillRect(ctx, c.ink, mast - back - 1, y, back + front + 2, 1);
      continue;
    }
    fillRect(ctx, c.sail, mast - back, y, back + front, 1);
    for (let x = mast - back; x < mast - back * 0.4; x++) if (bayer(x, y) < share * 0.7) fillRect(ctx, c.sailLo, x, y, 1, 1);
  }
};

// The junk: a high-sterned wooden hull under three red sails, a lantern at the stern, bobbing as it sails right.
const junk = (ctx: Ctx, f: Frame, c: Colors<K>, l: Layout): void => {
  const x = Math.round(wrap(f.t * 5 + f.w * 0.3 + 60, f.w + 120) - 60);
  const y = l.junkY + Math.round(Math.sin(f.t * 1.5));
  for (let k = 1; k < 9; k++)
    for (let dx = -22; dx < 22; dx++)
      if (bayer(x + dx, y + k) < 0.5 - k * 0.05) fillRect(ctx, k < 4 ? c.ink : c.sailLo, x + dx, y + k, 1, 1);
  sail(ctx, f, c, x - 15, y - 10, 22, 11);
  sail(ctx, f, c, x + 3, y - 10, 34, 17);
  sail(ctx, f, c, x + 19, y - 10, 25, 11);
  fillPolygon(
    ctx,
    [
      [x - 26, y - 14],
      [x - 21, y - 9],
      [x + 15, y - 9],
      [x + 27, y - 12],
      [x + 21, y - 2],
      [x + 15, y + 1],
      [x - 19, y + 1],
      [x - 25, y - 6],
    ],
    c.hull,
  );
  fillRect(ctx, c.sailLo, x - 21, y - 9, 36, 1);
  fillRect(ctx, c.win, x - 23, y - 9, 2, 2);
  drawGlow(ctx, c.win, x - 25, y - 15, 5, 4, 0.6 + f.kick * 0.3);
  fillRect(ctx, c.win, x - 25, y - 16, 1, 2);
};

const boats = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  ferry(ctx, f, c, l);
  junk(ctx, f, c, l);
  // A variant without rain gives the rain its sky's colour.
  if (c.rain !== c.sky0) rain(ctx, f, c.rain, { count: Math.round(f.w / 3), len: 5, slant: 0.25, speed: 150, seed: 87 });
};

export const harbourJunk = defineScene<K>({
  id: 'harbour-junk',
  title: 'Harbour Lights',
  mood: { valence: 0.2, energy: 0.6 },
  styles: ['city-lights', 'neon-rush', 'nineties-pop', 'lofi-loop', 'city-groove', 'eurobeat', 'jungle-run'],
  variants: [
    {
      // The light show: lasers and searchlights over a glittering waterfront.
      mood: { valence: 0.2, energy: 0.6 },
      colors: {
        sky0: '#070a24',
        sky1: '#1a1446',
        sky2: '#4c2468',
        hill: '#0d1230',
        hillLit: '#ffcf80',
        tower0: '#141c3e',
        tower1: '#212a54',
        edge: '#45558c',
        win: '#ffd27a',
        winCool: '#9ae0ff',
        neonA: '#ff3aa0',
        neonB: '#3af0ff',
        neonC: '#b6ff4a',
        water: '#080c2a',
        glint: '#ffe0a0',
        hull: '#4a2a22',
        sail: '#e0382e',
        sailLo: '#8a1e2a',
        ink: '#06060e',
        ferry: '#e8e4d8',
        ferryLo: '#1e2e66',
        rain: '#070a24',
      },
    },
    {
      // Blue hour: the last pink over the hills, the towers lighting up one by one.
      mood: { valence: 0.45, energy: -0.3 },
      colors: {
        sky0: '#1c2a6a',
        sky1: '#5a4a8e',
        sky2: '#ea8c8a',
        hill: '#262a58',
        hillLit: '#ffd890',
        tower0: '#363e70',
        tower1: '#464e82',
        edge: '#8a92c4',
        win: '#ffe2a2',
        winCool: '#c4eaff',
        neonA: '#ff8ac4',
        neonB: '#8ae8ff',
        neonC: '#ffe08a',
        water: '#262c62',
        glint: '#ffc8a4',
        hull: '#3a2228',
        sail: '#d24a3a',
        sailLo: '#7a2a3a',
        ink: '#141026',
        ferry: '#f0ece0',
        ferryLo: '#26346e',
        rain: '#1c2a6a',
      },
    },
    {
      // A wet night: low cloud swallowing the hilltops, rain on the water, the neon smeared.
      mood: { valence: -0.45, energy: 0.2 },
      colors: {
        sky0: '#0e1218',
        sky1: '#1e2430',
        sky2: '#3e3650',
        hill: '#161a24',
        hillLit: '#d0a070',
        tower0: '#1e2430',
        tower1: '#2a3240',
        edge: '#4a5466',
        win: '#e8b870',
        winCool: '#80c0d0',
        neonA: '#ff4a7a',
        neonB: '#4ad0e0',
        neonC: '#a0e060',
        water: '#0e1218',
        glint: '#c0a070',
        hull: '#2a1e1e',
        sail: '#a82c2c',
        sailLo: '#5a1a22',
        ink: '#05060a',
        ferry: '#c8c4b8',
        ferryLo: '#1a2240',
        rain: '#5a6478',
      },
    },
  ],
  layers: [city, water, boats],
});
