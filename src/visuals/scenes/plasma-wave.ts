// A demo-style plasma: four interfering sine fields, warped into a slow wave and colored through a cycling,
// ordered-dithered palette. The field is computed on 2×2 blocks; the dither runs per pixel.
import type { Ctx } from 'mojipx';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { ditherField, fastSin, surge } from './batch-3-helpers.ts';

type K = 'p0' | 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | 'p7' | 'p8' | 'p9' | 'p10' | 'p11';

// The palette climbs to its brightest color and back down, so cycling through it never jumps.
const rampOf = (c: Colors<K>): readonly string[] => [c.p0, c.p1, c.p2, c.p3, c.p4, c.p5, c.p6, c.p7, c.p8, c.p9, c.p10, c.p11];

type Field = {
  readonly k: number;
  readonly t: number;
  readonly cx: number;
  readonly cy: number;
  readonly spread: number;
  readonly cycle: number;
};

const fieldOf = (f: Frame): Field => {
  const t = f.t * (0.55 + 0.35 * f.energy);
  const units = 8 / Math.min(f.w, f.h);
  return {
    k: units,
    t,
    cx: f.w * units * (0.5 + 0.3 * Math.sin(t * 0.31)),
    cy: f.h * units * (0.5 + 0.3 * Math.cos(t * 0.23)),
    spread: 3.2,
    cycle: f.t * 1.1 + surge(f.beat) * 0.35 + f.kick * 0.2,
  };
};

const plasmaAt = (x: number, y: number, p: Field): number => {
  const v = y * p.k;
  const u = x * p.k + fastSin(v * 0.9 + p.t * 0.8) * 0.7;
  const dx = u - p.cx;
  const dy = v - p.cy;
  const sum =
    fastSin(u * 1.1 + p.t * 0.7) +
    fastSin(v * 1.25 - p.t * 0.55) +
    fastSin((u + v) * 0.75 + p.t * 0.4) +
    fastSin(Math.sqrt(dx * dx + dy * dy) * 1.4 - p.t * 1.1);
  return sum * p.spread + p.cycle;
};

const plasma = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const p = fieldOf(f);
  ditherField(ctx, f, 2, rampOf(c), true, (x, y) => plasmaAt(x, y, p));
};

export const plasmaWave = defineScene<K>({
  id: 'plasma-wave',
  title: 'Plasma Wave',
  mood: { valence: 0.3, energy: 0.3 },
  styles: ['neon-rush', 'starlit-dream', 'trance-pop', 'technopop'],
  variants: [
    {
      mood: { valence: 0.4, energy: 0.5 },
      colors: {
        p0: '#0d0630',
        p1: '#24106a',
        p2: '#4a1aa0',
        p3: '#7f2bc4',
        p4: '#c23fbf',
        p5: '#ff5fa0',
        p6: '#ffb3a0',
        p7: '#ff7ab0',
        p8: '#c43fc2',
        p9: '#7a26b8',
        p10: '#43179a',
        p11: '#1f0d5c',
      },
    },
    {
      mood: { valence: 0.1, energy: -0.2 },
      colors: {
        p0: '#060b24',
        p1: '#0c1a48',
        p2: '#123a6e',
        p3: '#1d6a8c',
        p4: '#3fa3a8',
        p5: '#8fd8c0',
        p6: '#e6f7ea',
        p7: '#a8c8f0',
        p8: '#7a86e0',
        p9: '#4f4ab4',
        p10: '#2b2678',
        p11: '#141246',
      },
    },
    {
      mood: { valence: 0.6, energy: 0.2 },
      colors: {
        p0: '#1a0507',
        p1: '#3d0b12',
        p2: '#7a1a1c',
        p3: '#c0391f',
        p4: '#f07a1f',
        p5: '#ffc247',
        p6: '#fff2b0',
        p7: '#ffd060',
        p8: '#f5862a',
        p9: '#c8442a',
        p10: '#82202a',
        p11: '#45101c',
      },
    },
  ],
  layers: [plasma],
});
