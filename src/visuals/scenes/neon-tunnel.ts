// A square neon tunnel: rings rush toward the viewer, the tunnel twists with depth and sways, and the edges flare on kicks.
import type { Ctx } from 'mojipx';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { clamp01, ditherField, surge } from './batch-3-helpers.ts';

type K = 'void' | 'wallDark' | 'wall' | 'aDark' | 'a' | 'bDark' | 'b' | 'hot';

// Ramp families laid end to end; a value is a family's offset plus a level inside it, so dithering stays in one family.
const WALL = 0;
const NEON_A = 3;
const NEON_B = 7;
const rampOf = (c: Colors<K>): readonly string[] => [c.void, c.wallDark, c.wall, c.void, c.aDark, c.a, c.hot, c.void, c.bDark, c.b, c.hot];

// Rings per e-fold of distance: ring spacing grows with the radius, as the walls of a tunnel do.
const RINGS = 3.4;

type View = {
  readonly cx: number;
  readonly cy: number;
  readonly r0: number;
  readonly travel: number;
  readonly flare: number;
  /** cos and sin of the twist angle for every whole radius: the angle depends on the distance only. */
  readonly turn: Float32Array;
};

// Scratch table, refilled every frame.
let turnTable = new Float32Array(0);

const turnOf = (f: Frame, r0: number): Float32Array => {
  const radii = Math.ceil(Math.hypot(f.w, f.h)) + 2;
  if (turnTable.length < radii * 2) turnTable = new Float32Array(radii * 2);
  const spin = f.t * 0.3 + Math.sin(f.beat * (Math.PI / 8)) * 0.4;
  const twist = Math.sin(f.t * 0.23);
  for (let r = 0; r < radii; r++) {
    const a = spin + (twist * r0) / (r + r0 * 0.35);
    turnTable[r * 2] = Math.cos(a);
    turnTable[r * 2 + 1] = Math.sin(a);
  }
  return turnTable;
};

const viewOf = (f: Frame): View => {
  const r0 = Math.min(f.w, f.h) * 0.5;
  return {
    cx: f.w / 2 + Math.sin(f.t * 0.53) * f.w * 0.08,
    cy: f.h / 2 + Math.sin(f.t * 0.41 + 1) * f.h * 0.06,
    r0,
    travel: f.t * (0.6 + 0.8 * f.energy) + 0.6 * surge(f.beat),
    flare: f.kick,
    turn: turnOf(f, r0),
  };
};

const neonAt = (ring: number, along: number, edge: number, fade: number, flare: number): number => {
  const level = Math.min(2.99, fade * (2.1 + flare * 0.6) * (1 - (along / edge) * 0.4));
  return (ring % 2 === 0 ? NEON_A : NEON_B) + level;
};

// Rotate by an angle that grows with depth (the twist), then rings are squares: the max-norm distance picks the ring,
// the min/max ratio says where along a side the pixel is (for the wall panels).
const valueAt = (x: number, y: number, v: View): number => {
  const dx = x - v.cx;
  const dy = y - v.cy;
  const r = Math.round(Math.sqrt(dx * dx + dy * dy)) * 2;
  const cos = v.turn[r] as number;
  const sin = v.turn[r + 1] as number;
  const qx = Math.abs(dx * cos - dy * sin);
  const qy = Math.abs(dx * sin + dy * cos);
  const major = Math.max(qx, qy) + 0.5;
  const s = Math.log(v.r0 / major) * RINGS + v.travel + 100;
  const ring = Math.floor(s);
  const along = s - ring;
  const fade = clamp01((major - 5) / (v.r0 * 0.55));
  const edge = Math.min(0.45, ((1 + 3 * clamp01(major / v.r0)) * (1 + 0.6 * v.flare) * RINGS) / major);
  if (along > 1 - edge) return neonAt(ring, 1 - along, edge, fade, v.flare);
  const panel = Math.floor((Math.min(qx, qy) / major) * 2);
  const shade = (ring + panel) % 2 === 0 ? 1 : 0.55;
  return WALL + Math.min(1.99, fade * shade * (1.6 + v.flare * 0.3) * (0.55 + along * 0.45));
};

const tunnel = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const v = viewOf(f);
  ditherField(ctx, f, 2, rampOf(c), false, (x, y) => valueAt(x, y, v));
};

export const neonTunnel = defineScene<K>({
  id: 'neon-tunnel',
  title: 'Neon Tunnel',
  mood: { valence: -0.2, energy: 0.8 },
  styles: ['boss-rush', 'star-fighter', 'neon-rush'],
  variants: [
    {
      mood: { valence: 0.1, energy: 0.8 },
      colors: {
        void: '#04020c',
        wallDark: '#120a2a',
        wall: '#24124a',
        aDark: '#7a1a8c',
        a: '#ff3df0',
        bDark: '#0f5f80',
        b: '#2ee6ff',
        hot: '#ffffff',
      },
    },
    {
      mood: { valence: -0.6, energy: 0.85 },
      colors: {
        void: '#070102',
        wallDark: '#1c0506',
        wall: '#360b0c',
        aDark: '#8a2208',
        a: '#ff5a1a',
        bDark: '#8a5a08',
        b: '#ffc21f',
        hot: '#fff3d6',
      },
    },
    {
      mood: { valence: -0.3, energy: 0.6 },
      colors: {
        void: '#010805',
        wallDark: '#05170f',
        wall: '#0b2a1d',
        aDark: '#1f7a3a',
        a: '#5dff7a',
        bDark: '#3f5f12',
        b: '#d8ff3d',
        hot: '#f2ffe8',
      },
    },
  ],
  layers: [tunnel],
});
