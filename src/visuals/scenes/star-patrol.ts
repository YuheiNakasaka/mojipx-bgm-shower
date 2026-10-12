// A patrol of five small fighters in a V, flying up through scrolling stars. Every beat the squadron fires a volley;
// drones snake down from above and burst into pixel explosions exactly where a bolt meets them.
import { type Ctx, drawSpriteFoot, fillRect, type Palette, type Sprite } from 'mojipx';
import { bayer, disc, ditherGradient, frac, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { memoLayer, paletteOf, recentBeats, sigOf } from './batch-3-helpers.ts';

type K =
  | 'space0'
  | 'space1'
  | 'space2'
  | 'nebula'
  | 'starFar'
  | 'starNear'
  | 'planet'
  | 'planetBand'
  | 'planetDark'
  | 'hull'
  | 'hullDark'
  | 'cockpit'
  | 'accent'
  | 'flame'
  | 'flameCore'
  | 'laser'
  | 'laserCore'
  | 'drone'
  | 'droneDark'
  | 'droneCore'
  | 'boom0'
  | 'boom1'
  | 'boom2'
  | 'boom3';

// ---- sprites ----

const SHIP: Sprite = [
  '......a......',
  '.....hhh.....',
  '.....hch.....',
  '.....hch.....',
  '....dhhhd....',
  '....dhhhd....',
  '...adhhhda...',
  '..adhhahhda..',
  '.adhhhahhhda.',
  'adhhhhahhhhda',
  'ddhhhhhhhhhdd',
  'd...dnhnd...d',
  '.....n.n.....',
];

const DRONE: Sprite = ['..o...o..', '..oo.oo..', '.oEEEEEo.', 'oEEyyyEEo', 'oEyYYYyEo', 'oEEyyyEEo', '.oEEEEEo.', '..o.o.o..'];

const shipPalette = (c: Colors<K>): Palette => ({ h: c.hull, d: c.hullDark, c: c.cockpit, a: c.accent, n: c.hullDark });
const dronePalette = (c: Colors<K>): Palette => ({ o: c.droneDark, E: c.drone, y: c.droneDark, Y: c.droneCore });

// ---- the squadron: positions are functions of the beat, so a bolt can be traced back to where it was fired ----

const FORMATION = [
  [0, 0],
  [-1, 0.55],
  [1, 0.55],
  [-2, 1.1],
  [2, 1.1],
] as const;

type Wing = { readonly spacing: number; readonly leadY: number; readonly boltSpeed: number };

const wingOf = (f: Frame): Wing => {
  const spacing = Math.min(30, Math.max(18, Math.round(f.w * 0.12)));
  const leadY = Math.round(f.h * 0.86 - spacing * 1.1 - 13);
  return { spacing, leadY, boltSpeed: (leadY + 30) / 0.55 };
};

const swayAt = (f: Frame, beat: number): number => f.w / 2 + Math.sin(beat * (Math.PI / 8)) * f.w * 0.1;

const shipX = (f: Frame, wing: Wing, k: number, beat: number): number =>
  Math.round(swayAt(f, beat) + (FORMATION[k]?.[0] ?? 0) * wing.spacing);

const shipY = (wing: Wing, k: number, beat: number): number =>
  wing.leadY + Math.round((FORMATION[k]?.[1] ?? 0) * wing.spacing + Math.sin(beat * (Math.PI / 2) + k * 1.3));

// The top of the ship sprite (its nose), given the foot position the sprite is drawn at.
const noseOf = (y: number): number => y - SHIP.length;

// ---- drones: wave j enters every bar; its five drones die to the volleys on beats 2, 3 and 4 of the bar ----

type Drone = { readonly kill: number; readonly x: number; readonly y: number; readonly amp: number; readonly speed: number };

const VOLLEY_SLOTS = [2, 2, 3, 3, 4] as const;

const droneOf = (f: Frame, wing: Wing, j: number, m: number): Drone => {
  const volley = j * 4 + (VOLLEY_SLOTS[m] ?? 2);
  const k = (((j + 2 * m) % 5) + 5) % 5;
  const y = Math.round(f.h * (0.14 + 0.24 * rand(j * 5 + m, 71)));
  const x = shipX(f, wing, k, volley);
  const age = (noseOf(shipY(wing, k, volley)) - y) / wing.boltSpeed;
  return { kill: volley + age, x, y, amp: f.w * (0.06 + 0.12 * rand(j * 5 + m, 72)), speed: f.h * 0.075 };
};

// Which drone, if any, the bolt fired by ship k on beat b is aimed at.
const targetOf = (f: Frame, wing: Wing, b: number, k: number): Drone | null => {
  const j = Math.floor((b - 2) / 4);
  for (let m = 0; m < 5; m++) {
    if (j * 4 + (VOLLEY_SLOTS[m] ?? 0) !== b) continue;
    if ((((j + 2 * m) % 5) + 5) % 5 === k) return droneOf(f, wing, j, m);
  }
  return null;
};

const dronePos = (d: Drone, beat: number): readonly [number, number] => {
  const dt = beat - d.kill;
  return [Math.round(d.x + d.amp * Math.sin(dt * (Math.PI / 2.4))), Math.round(d.y + d.speed * dt)];
};

// ---- layers ----

// The night side: the part of the planet covered by the same disc shifted toward the lower right.
const nightRow = (g: Ctx, r: number, dy: number, color: string): void => {
  const sy = dy - r * 0.35;
  if (Math.abs(sy) > r) return;
  const half = Math.floor(Math.sqrt(r * r - dy * dy));
  const shifted = Math.sqrt(r * r - sy * sy);
  const from = Math.max(-half, Math.round(r * 0.45 - shifted));
  const to = Math.min(half, Math.round(r * 0.45 + shifted));
  if (to >= from) fillRect(g, color, r + from, r + dy, to - from + 1, 1);
};

const planetImage = (r: number, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`patrol-planet:${r}:${sigOf(c)}`, r * 2 + 1, r * 2 + 1, (g) => {
    disc(g, r, r, r, (dy) => (Math.floor((dy + r) / Math.max(2, r / 4)) % 3 === 1 ? c.planetBand : c.planet));
    for (let dy = -r; dy <= r; dy++) nightRow(g, r, dy, c.planetDark);
  });

// Faint nebula clouds on a tile twice the screen height that wraps vertically, so it can scroll forever.
const nebulaDensity = (w: number, tile: number, x: number, y: number): number => {
  let sum = 0;
  for (let i = 0; i < 5; i++) {
    const dx = (x - rand(i, 81) * w) / (w * (0.18 + 0.15 * rand(i, 82)));
    const wrapY = Math.abs(y - rand(i, 83) * tile);
    const dy = Math.min(wrapY, tile - wrapY) / (tile * 0.12);
    sum += Math.exp(-(dx * dx + dy * dy));
  }
  return sum;
};

const nebula = (w: number, h: number, color: string): HTMLCanvasElement =>
  memoLayer(`patrol-nebula:${w}x${h}:${color}`, w, h * 2, (g) => {
    g.fillStyle = color;
    for (let y = 0; y < h * 2; y++)
      for (let x = 0; x < w; x++) if (bayer(x, y) < nebulaDensity(w, h * 2, x, y) * 0.45) g.fillRect(x, y, 1, 1);
  });

const space = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(ditherGradient(f.w, f.h, [c.space0, c.space1, c.space2]), 0, 0);
  const cloud = nebula(f.w, f.h, c.nebula);
  const drift = Math.round(frac(f.t / 70) * f.h * 2);
  ctx.drawImage(cloud, 0, drift - f.h * 2);
  ctx.drawImage(cloud, 0, drift);
  const r = Math.round(Math.min(f.w, f.h) * 0.16);
  const y = -2 * r + frac(f.t / 90 + 0.35) * (f.h + 3 * r);
  ctx.drawImage(planetImage(r, c), Math.round(f.w * 0.74 - r), Math.round(y));
};

const starLayer = (ctx: Ctx, f: Frame, count: number, speed: number, seed: number, color: string, len: number): void => {
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rand(i, seed) * f.w);
    const y = Math.floor(frac(rand(i, seed + 1) + (f.t * speed * (0.7 + 0.6 * rand(i, seed + 2))) / f.h) * (f.h + len)) - len;
    fillRect(ctx, color, x, y, 1, len);
  }
};

const starfield = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const n = Math.round((f.w * f.h) / 700);
  starLayer(ctx, f, n, 7, 11, c.starFar, 1);
  starLayer(ctx, f, Math.round(n / 3), 22, 21, c.starNear, 1);
  starLayer(ctx, f, 10, 110 + 120 * f.energy, 31, c.starNear, 3 + Math.round(3 * f.energy));
};

// A burst: a white flash, a fireball that swells and cools, and sparks flung outward that fade to embers.
const fireball = (ctx: Ctx, c: Colors<K>, x: number, y: number, e: number): void => {
  if (e < 0.1) {
    disc(ctx, x, y, 4, () => c.boom0);
    return;
  }
  if (e > 0.75) return;
  const r = Math.round(e < 0.35 ? 4 + e * 6 : 6 * (1 - (e - 0.35) / 0.4));
  disc(ctx, x, y, r, (dy) => (e < 0.35 ? c.boom1 : Math.abs(dy) < r * 0.5 ? c.boom2 : c.boom3));
  if (e < 0.4) disc(ctx, x, y, Math.max(1, r - 3), () => c.boom0);
};

const sparkColor = (c: Colors<K>, e: number): string => (e < 0.3 ? c.boom1 : e < 0.7 ? c.boom2 : c.boom3);

const explosion = (ctx: Ctx, c: Colors<K>, x: number, y: number, e: number, seed: number): void => {
  const out = 1 - (1 - Math.min(1, e / 1.1)) ** 2;
  const color = sparkColor(c, e);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + rand(i, seed) * 0.5;
    const reach = (8 + 14 * rand(i, seed + 1)) * out;
    const size = e < 0.6 && i % 2 === 0 ? 2 : 1;
    fillRect(ctx, color, Math.round(x + Math.cos(a) * reach), Math.round(y + Math.sin(a) * reach + e * 6), size, size);
  }
  fireball(ctx, c, x, y, e);
};

const drones = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const wing = wingOf(f);
  const pal = paletteOf(c, dronePalette);
  const first = Math.floor(f.beat / 4) - 2;
  for (let j = first; j <= first + 3; j++)
    for (let m = 0; m < 5; m++) {
      const d = droneOf(f, wing, j, m);
      const e = f.beat - d.kill;
      if (e >= 1.2) continue;
      const [x, y] = dronePos(d, Math.min(f.beat, d.kill));
      if (e >= 0) explosion(ctx, c, x, y, e, j * 5 + m);
      else if (y > -10) drawSpriteFoot(ctx, DRONE, pal, x, y + 4);
    }
};

const bolt = (ctx: Ctx, f: Frame, c: Colors<K>, wing: Wing, k: number, b: number, age: number): void => {
  const x = shipX(f, wing, k, b);
  const nose = noseOf(shipY(wing, k, b));
  const y = Math.round(nose - age * wing.boltSpeed);
  const target = Number.isInteger(b) ? targetOf(f, wing, b, k) : null;
  if (target && f.beat >= target.kill) return;
  if (y < -8) return;
  const wide = k === 0 ? 2 : 1;
  fillRect(ctx, c.laser, x - (wide - 1), y, wide, 7);
  fillRect(ctx, c.laserCore, x - (wide - 1), y, wide, 3);
};

const volleys = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const wing = wingOf(f);
  const doubleTime = f.energy > 0.6;
  recentBeats(f.beat, 2, (b, age) => {
    for (let k = 0; k < 5; k++) {
      bolt(ctx, f, c, wing, k, b, age);
      if (doubleTime && k > 0 && age >= 0.5) bolt(ctx, f, c, wing, k, b + 0.5, age - 0.5);
    }
  });
};

const flame = (ctx: Ctx, c: Colors<K>, x: number, y: number, len: number): void => {
  fillRect(ctx, c.flame, x, y, 1, len);
  fillRect(ctx, c.flameCore, x, y, 1, Math.max(1, len - 2));
};

const squadron = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const wing = wingOf(f);
  const pal = paletteOf(c, shipPalette);
  const muzzle = frac(f.beat) < 0.1;
  for (let k = 0; k < 5; k++) {
    const x = shipX(f, wing, k, f.beat);
    const y = shipY(wing, k, f.beat);
    const len = 2 + Math.round(2 * f.kick + rand(Math.floor(f.t * 20), k) * 2);
    flame(ctx, c, x - 1, y, len);
    flame(ctx, c, x + 1, y, len);
    drawSpriteFoot(ctx, SHIP, pal, x, y);
    if (muzzle) fillRect(ctx, c.laserCore, x - 1, noseOf(y) - 2, 3, 2);
  }
};

export const starPatrol = defineScene<K>({
  id: 'star-patrol',
  title: 'Star Patrol',
  mood: { valence: 0, energy: 0.8 },
  styles: ['star-fighter', 'boss-rush'],
  variants: [
    {
      mood: { valence: 0.4, energy: 0.8 },
      colors: {
        space0: '#03040f',
        space1: '#070c26',
        space2: '#101a45',
        nebula: '#1a2560',
        starFar: '#5a6cb0',
        starNear: '#e6ecff',
        planet: '#3f5bb5',
        planetBand: '#3550a0',
        planetDark: '#1b2a63',
        hull: '#e8eef7',
        hullDark: '#7886a6',
        cockpit: '#3fd0ff',
        accent: '#ff4f6d',
        flame: '#ff8a2a',
        flameCore: '#fff0a0',
        laser: '#4dfff0',
        laserCore: '#ffffff',
        drone: '#a65cff',
        droneDark: '#4e2394',
        droneCore: '#ffd23f',
        boom0: '#ffffff',
        boom1: '#ffe066',
        boom2: '#ff8a2a',
        boom3: '#a8343a',
      },
    },
    {
      mood: { valence: -0.4, energy: 0.8 },
      colors: {
        space0: '#0b0207',
        space1: '#1c0513',
        space2: '#33091f',
        nebula: '#3d0d2a',
        starFar: '#8a3a5a',
        starNear: '#ffe0ea',
        planet: '#7a2a4a',
        planetBand: '#6a2242',
        planetDark: '#3a0f26',
        hull: '#d9dde3',
        hullDark: '#6b7280',
        cockpit: '#ffd23f',
        accent: '#22d3ee',
        flame: '#ff5a1f',
        flameCore: '#ffe3a0',
        laser: '#ff4df0',
        laserCore: '#ffe0ff',
        drone: '#34d399',
        droneDark: '#0f6b4a',
        droneCore: '#ff3d3d',
        boom0: '#ffffff',
        boom1: '#ffd84d',
        boom2: '#ff6a2a',
        boom3: '#8a1f2a',
      },
    },
  ],
  layers: [space, starfield, drones, volleys, squadron],
});
