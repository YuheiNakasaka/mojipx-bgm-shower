// A rocket climbs out of a sea of clouds: cloud layers stream past at two depths, the sky darkens into space,
// stars come out and planets drift by. The flame pulses on the kick; the smoke trail thins out as the air does.
import { type Ctx, drawSpriteFoot, fillRect, type Palette, type Point, type Sprite } from 'mojipx';
import { bayer, disc, ditherGradient, frac, noise1, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { clamp01, memoLayer, paletteOf, sigOf } from './batch-3-helpers.ts';

type K =
  | 'space0'
  | 'space1'
  | 'upper'
  | 'mid'
  | 'low'
  | 'star'
  | 'cloud'
  | 'cloudShade'
  | 'cloudFar'
  | 'body'
  | 'bodyShade'
  | 'accent'
  | 'accentDark'
  | 'glass'
  | 'glassLight'
  | 'nozzle'
  | 'flameCore'
  | 'flame'
  | 'flameOuter'
  | 'smoke'
  | 'giant'
  | 'giantBand'
  | 'giantShade'
  | 'ring'
  | 'moon'
  | 'moonShade';

const ROCKET: Sprite = [
  '.......r.......',
  '......rrr......',
  '......rrR......',
  '.....rrrRR.....',
  '.....rrrRR.....',
  '....wwwwwWW....',
  '....wwwwwWW....',
  '...wwwbbbWWW...',
  '...wwbcCcbWW...',
  '...wwbcccbWW...',
  '...wwbcccbWW...',
  '...wwwbbbWWW...',
  '...wwwwwwWWW...',
  '...wwwwwwWWW...',
  '...wwwwwwWWW...',
  '...rrrrrrRRR...',
  '...wwwwwwWWW...',
  '...wwwwwwWWW...',
  '..rwwwwwwWWWR..',
  '.rrwwwwwwWWWRR.',
  '.rrwwwwrwWWWRR.',
  'rrrwwwwrwWWWRRR',
  'rrrwwwwrwWWWRRR',
  'rr.wwwwwwWWW.RR',
  'r...ggggggg...R',
  '.....ggggg.....',
];

const rocketPalette = (c: Colors<K>): Palette => ({
  w: c.body,
  W: c.bodyShade,
  r: c.accent,
  R: c.accentDark,
  b: c.bodyShade,
  c: c.glass,
  C: c.glassLight,
  g: c.nozzle,
});

// ---- the climb: altitude in pixels grows steadily; how far into space we are follows from it ----

// The climb eases in over the first couple of seconds (lift-off), then holds a steady speed.
const RAMP = 2.2;
const climbSpeed = (f: Frame): number => f.h * (0.3 + 0.12 * f.energy);
const altitudeOf = (f: Frame): number => climbSpeed(f) * (f.t - RAMP * (1 - Math.exp(-f.t / RAMP)));
const spaceOf = (f: Frame): number => clamp01((altitudeOf(f) / f.h - 1.3) / 1.6);

const rocketAt = (f: Frame, t: number): Point => ({
  x: Math.round(f.w / 2 + Math.sin(t * 0.6) * f.w * 0.05),
  y: Math.round(f.h * 0.6 + Math.sin(f.beat * (Math.PI / 2)) * 1.5),
});

// ---- sky ----

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const tall = Math.round(f.h * 2.5);
  const grad = ditherGradient(f.w, tall, [c.space0, c.space1, c.upper, c.mid, c.low]);
  const src = Math.max(0, Math.round(tall - f.h - altitudeOf(f) * 0.5));
  ctx.drawImage(grad, 0, src, f.w, f.h, 0, 0, f.w, f.h);
};

const starfield = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const k = spaceOf(f);
  if (k <= 0) return;
  const n = Math.round(((f.w * f.h) / 500) * k);
  const drift = altitudeOf(f) * 0.03;
  for (let i = 0; i < n; i++) {
    const x = Math.floor(rand(i, 3) * f.w);
    const y = Math.floor(frac(rand(i, 4) + drift / f.h) * f.h);
    if (Math.sin(f.t * (1 + rand(i, 5) * 3) + i) > -0.5) fillRect(ctx, c.star, x, y, 1, 1);
  }
  if (k < 0.6) return;
  for (let i = 0; i < 8; i++) {
    const x = Math.floor(rand(i, 6) * f.w);
    const y = Math.floor(frac(rand(i, 7) + f.t * (0.9 + 0.8 * f.energy)) * (f.h + 12)) - 12;
    fillRect(ctx, c.star, x, y, 1, 4 + Math.round(4 * f.energy));
  }
};

// ---- planets: one every few seconds once the sky is dark enough, crossing the screen slowly ----

const giantImage = (r: number, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`climb-giant:${r}:${sigOf(c)}`, r * 4 + 1, r * 2 + 5, (g) => {
    const cx = r * 2;
    const cy = r + 2;
    const ringRow = (dy: number, front: boolean): void => {
      for (let x = -r * 2; x <= r * 2; x++) {
        const e = (x / (r * 2)) ** 2 + (dy / (r * 0.45)) ** 2;
        if (e > 1 || e < 0.62 || dy > 0 !== front) continue;
        fillRect(g, c.ring, cx + x, cy + dy, 1, 1);
      }
    };
    for (let dy = -r; dy <= 0; dy++) ringRow(dy, false);
    disc(g, cx, cy, r, (dy) => {
      const band = Math.floor(((dy + r) / (2 * r)) * 7);
      if (dy > r * 0.45) return c.giantShade;
      return band % 2 === 1 ? c.giantBand : c.giant;
    });
    for (let dy = 1; dy <= r; dy++) ringRow(dy, true);
  });

const moonImage = (r: number, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`climb-moon:${r}:${sigOf(c)}`, r * 2 + 1, r * 2 + 1, (g) => {
    disc(g, r, r, r, (dy) => (dy > r * 0.35 ? c.moonShade : c.moon));
    for (let i = 0; i < 4; i++) {
      const a = rand(i, 91) * Math.PI * 2;
      const d = rand(i, 92) * r * 0.6;
      disc(g, r + Math.cos(a) * d, r + Math.sin(a) * d * 0.7, 1 + Math.round(rand(i, 93) * 2), () => c.moonShade);
    }
  });

const PLANET_EVERY = 7;
const PLANET_CROSS = 14;

const planets = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const first = Math.max(0, Math.floor((f.t - 4 - PLANET_CROSS) / PLANET_EVERY));
  for (let i = first; i <= first + 3; i++) {
    const age = f.t - (4 + i * PLANET_EVERY);
    if (age < 0 || age > PLANET_CROSS) continue;
    const giant = i % 3 !== 2;
    const r = Math.round(Math.min(f.w, f.h) * (giant ? 0.09 + 0.05 * rand(i, 94) : 0.05));
    const img = giant ? giantImage(r, c) : moonImage(r, c);
    const x = f.w * (0.15 + 0.7 * rand(i, 95)) + age * (rand(i, 96) - 0.5) * 3 - img.width / 2;
    const y = -img.height + (age / PLANET_CROSS) * (f.h + img.height * 2);
    ctx.drawImage(img, Math.round(x), Math.round(y));
  }
};

// ---- clouds: placed at world altitudes; a layer with parallax p moves down p pixels per pixel climbed ----

const cloudImage = (r: number, light: string, shade: string): HTMLCanvasElement =>
  memoLayer(`climb-cloud:${r}:${light}:${shade}`, r * 6, r * 3, (g) => {
    const puff = (x: number, y: number, rr: number): void => disc(g, x, y, Math.round(rr), (dy) => (dy > rr * 0.35 ? shade : light));
    puff(r * 1.4, r * 1.8, r * 0.9);
    puff(r * 2.6, r * 1.4, r * 1.2);
    puff(r * 3.9, r * 1.6, r);
    puff(r * 4.9, r * 2, r * 0.7);
  });

const cloudLayer = (ctx: Ctx, f: Frame, img: HTMLCanvasElement, count: number, gap: number, parallax: number, seed: number): void => {
  const climbed = altitudeOf(f) * parallax;
  for (let i = 0; i < count; i++) {
    const y = f.h * 0.75 - i * gap + climbed;
    if (y < -img.height || y > f.h + img.height) continue;
    const x = rand(i, seed) * (f.w + img.width) - img.width + Math.sin(f.t * 0.3 + i) * 3;
    ctx.drawImage(img, Math.round(x), Math.round(y - img.height / 2));
  }
};

const farClouds = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const img = cloudImage(Math.round(Math.min(f.w, f.h) * 0.035), c.cloudFar, c.cloudShade);
  cloudLayer(ctx, f, img, 12, f.h * 0.18, 0.55, 21);
};

const nearClouds = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const img = cloudImage(Math.round(Math.min(f.w, f.h) * 0.06), c.cloud, c.cloudShade);
  cloudLayer(ctx, f, img, 7, f.h * 0.4, 1.1, 22);
  // The cloud sea the rocket rises out of.
  const sea = cloudImage(Math.round(Math.min(f.w, f.h) * 0.09), c.cloud, c.cloudShade);
  const y = f.h * 0.74 + altitudeOf(f) * 0.9;
  if (y > f.h + sea.height) return;
  for (let x = -sea.width / 3; x < f.w; x += sea.width * 0.55) ctx.drawImage(sea, Math.round(x), Math.round(y - sea.height * 0.4));
  const floor = Math.round(y + sea.height * 0.45);
  for (let x = -sea.width / 2; x < f.w; x += sea.width * 0.55) ctx.drawImage(sea, Math.round(x), floor - Math.round(sea.height * 0.3));
  if (floor < f.h) fillRect(ctx, c.cloudShade, 0, floor + Math.round(sea.height * 0.5), f.w, f.h - floor);
};

// ---- the rocket ----

const flame = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, top: number): void => {
  const flicker = rand(Math.floor(f.t * 24), 9);
  const len = Math.round(9 + 6 * f.kick + 3 * f.energy + flicker * 3);
  for (let i = 0; i < len; i++) {
    const half = Math.max(0, Math.round(3 - (i / len) * 3.4));
    const color = i < len * 0.3 ? c.flameCore : i < len * 0.7 ? c.flame : c.flameOuter;
    fillRect(ctx, color, x - half, top + i, half * 2 + 1, 1);
  }
};

// The trail stays where it was made, so each row below the rocket is smoke from a moment ago: older rows sit lower,
// wider and drift aside. It shortens as the air thins and is gone in space.
const smoke = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const life = 2.2 * (1 - spaceOf(f));
  if (life <= 0.05) return;
  const top = rocketAt(f, f.t).y + 8;
  const fall = climbSpeed(f) * Math.min(1, f.t / RAMP);
  for (let y = top; y < f.h; y++) {
    const age = (y - top) / Math.max(1, fall);
    const then = f.t - age;
    if (age > life || then < 0) return;
    const puff = noise1(then * 7, 13) * 2.5;
    const half = Math.round(Math.min(8, 1 + age * 5 + puff) + (bayer(0, y) < 0.5 ? 0 : 0.5));
    const x = Math.round(rocketAt(f, then).x + (noise1(then * 1.3, 14) - 0.5) * age * 14);
    fillRect(ctx, age > life * 0.75 && y % 2 === 0 ? c.cloudShade : c.smoke, x - half, y, half * 2 + 1, 1);
    fillRect(ctx, c.cloudShade, x + half - 1, y, 2, 1);
  }
};

const rocket = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const p = rocketAt(f, f.t);
  flame(ctx, f, c, p.x, p.y);
  drawSpriteFoot(ctx, ROCKET, paletteOf(c, rocketPalette), p.x, p.y);
};

export const orbitClimb = defineScene<K>({
  id: 'orbit-climb',
  title: 'Orbit Climb',
  mood: { valence: 0.2, energy: 0.6 },
  styles: ['grand-field', 'star-fighter'],
  variants: [
    {
      mood: { valence: 0.45, energy: 0.6 },
      colors: {
        space0: '#04061a',
        space1: '#0c1642',
        upper: '#1f4a9a',
        mid: '#4d9be8',
        low: '#a6e0ff',
        star: '#e8efff',
        cloud: '#ffffff',
        cloudShade: '#c6dcf2',
        cloudFar: '#e6f2fc',
        body: '#f2f4f8',
        bodyShade: '#a9b2c6',
        accent: '#ff4f4f',
        accentDark: '#b02a3a',
        glass: '#3fc6ff',
        glassLight: '#c8f2ff',
        nozzle: '#5a6078',
        flameCore: '#fff6c8',
        flame: '#ffc23a',
        flameOuter: '#ff6a1f',
        smoke: '#f2f6fa',
        giant: '#ffb35c',
        giantBand: '#e57c3c',
        giantShade: '#9a4a2c',
        ring: '#ffe0a8',
        moon: '#c9cfe0',
        moonShade: '#8a92b0',
      },
    },
    {
      mood: { valence: -0.1, energy: 0.5 },
      colors: {
        space0: '#090414',
        space1: '#200e3c',
        upper: '#55287a',
        mid: '#d0607e',
        low: '#ffb088',
        star: '#ffe8f0',
        cloud: '#ffd8c8',
        cloudShade: '#e2909c',
        cloudFar: '#f4b8b0',
        body: '#f4eef0',
        bodyShade: '#b0a0b8',
        accent: '#3fd0c0',
        accentDark: '#1f7a80',
        glass: '#ffd36b',
        glassLight: '#fff2c8',
        nozzle: '#5a4a6a',
        flameCore: '#ffffff',
        flame: '#ffd36b',
        flameOuter: '#ff7a5a',
        smoke: '#ffe8e0',
        giant: '#3fd0c0',
        giantBand: '#2a9a9a',
        giantShade: '#1a5a66',
        ring: '#c8fff0',
        moon: '#e0c8d8',
        moonShade: '#a088a8',
      },
    },
  ],
  layers: [sky, starfield, planets, farClouds, smoke, rocket, nearClouds],
});
