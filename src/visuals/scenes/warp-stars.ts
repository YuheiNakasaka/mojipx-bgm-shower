// Flying through a starfield: streaks rush outward from the centre and surge forward on every beat.
import { type Ctx, fillRect } from 'mojipx';
import { disc, frac, pixelLine, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';

type K = 'space' | 'core' | 'halo' | 'far' | 'near' | 'tip';

const STARS = 220;

// Distance travelled: steady drift plus a surge that eases out after each beat.
const travel = (f: Frame): number => f.t * (0.08 + 0.12 * f.energy) + 0.06 * (Math.floor(f.beat) + 1 - (1 - frac(f.beat)) ** 3);

const space = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  fillRect(ctx, c.space, 0, 0, f.w, f.h);
  const r = Math.round(Math.min(f.w, f.h) * (0.12 + 0.04 * f.kick));
  disc(ctx, f.w / 2, f.h / 2, r, (dy) => (Math.abs(dy) < r * 0.45 ? c.core : c.halo));
};

const streaks = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const cx = f.w / 2;
  const cy = f.h / 2;
  const scale = Math.max(f.w, f.h) * 0.6;
  const go = travel(f);
  const tail = 0.03 + 0.05 * f.kick;
  for (let i = 0; i < STARS; i++) {
    const sx = rand(i, 1) * 2 - 1;
    const sy = rand(i, 2) * 2 - 1;
    const z = 1 - frac(rand(i, 3) + go);
    if (z < 0.02) continue;
    const x = cx + (sx / z) * scale * 0.25;
    const y = cy + (sy / z) * scale * 0.25;
    if (x < -2 || y < -2 || x > f.w + 2 || y > f.h + 2) continue;
    const zt = Math.min(1, z + tail);
    const near = z < 0.25;
    pixelLine(ctx, cx + (sx / zt) * scale * 0.25, cy + (sy / zt) * scale * 0.25, x, y, near ? c.near : c.far);
    if (near) fillRect(ctx, c.tip, Math.round(x), Math.round(y), 1, 1);
  }
};

export const warpStars = defineScene<K>({
  id: 'warp-stars',
  title: 'Warp Stars',
  mood: { valence: 0.1, energy: 0.8 },
  styles: ['star-fighter', 'neon-rush', 'boss-rush', 'trance-pop'],
  variants: [
    {
      mood: { valence: 0.5, energy: 0.8 },
      colors: { space: '#07031a', core: '#fff3c4', halo: '#3b1d6e', far: '#6c5bd4', near: '#c9b8ff', tip: '#ffffff' },
    },
    {
      mood: { valence: -0.5, energy: 0.8 },
      colors: { space: '#030806', core: '#d8ffe6', halo: '#0d3a2a', far: '#2f8f6a', near: '#8dffc8', tip: '#ffffff' },
    },
  ],
  layers: [space, streaks],
});
