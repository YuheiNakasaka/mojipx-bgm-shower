// A summer night over a lakeside town: fireworks rise between beats and burst on them, strings of lanterns
// glow along the shore, and everything shimmers back from the water.
import { type Ctx, fillRect } from 'mojipx';
import { ditherGradient, rand, ridgeNoise, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { drawGlow, memoLayer, wrap } from './batch-2-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'star'
  | 'town'
  | 'townHi'
  | 'lantern'
  | 'lanternHi'
  | 'water0'
  | 'water1'
  | 'ripple'
  | 'fwA'
  | 'fwB'
  | 'fwC'
  | 'fwD'
  | 'ember'
  | 'flash';

type Kind = 'peony' | 'ring' | 'willow' | 'double';
type Firework = {
  readonly beat: number;
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly kind: Kind;
  readonly color: string;
  readonly inner: string;
  readonly sparks: number;
  readonly life: number;
  readonly gravity: number;
};

const KINDS: readonly Kind[] = ['peony', 'ring', 'peony', 'willow', 'double'];
const REFLECT = 0.75;

const waterOf = (f: Frame): number => Math.round(f.h * (f.w > f.h ? 0.66 : 0.6));

// Whether a firework bursts on beat b: always on a bar's first beat, otherwise more often when the music is energetic.
const fires = (b: number, f: Frame): boolean => b % 4 === 0 || rand(b, 3) < 0.35 + f.energy * 0.45;

const fireworkOf = (b: number, f: Frame, c: Colors<K>): Firework => {
  const kind = KINDS[Math.floor(rand(b, 4) * KINDS.length)] as Kind;
  const colors = [c.fwA, c.fwB, c.fwC, c.fwD];
  const color = kind === 'willow' ? c.fwB : (colors[Math.floor(rand(b, 5) * colors.length)] as string);
  const short = Math.min(f.w, f.h);
  const big = b % 4 === 0 ? 1.25 : 1;
  return {
    beat: b,
    x: f.w * (0.15 + rand(b, 6) * 0.7),
    y: waterOf(f) * (0.22 + rand(b, 7) * 0.4),
    r: short * (0.13 + rand(b, 8) * 0.09) * big,
    kind,
    color,
    inner: colors[Math.floor(rand(b, 9) * colors.length)] as string,
    sparks: kind === 'ring' ? 30 : 40,
    life: kind === 'willow' ? 3.6 : 2.6,
    gravity: kind === 'willow' ? 0.34 : 0.16,
  };
};

const sparkAt = (fw: Firework, i: number, age: number): readonly [number, number] => {
  const a = (i / fw.sparks) * Math.PI * 2 + rand(i, fw.beat) * 0.18;
  const ring = fw.kind === 'double' && i % 2 === 1 ? 0.55 : 1;
  const speed = fw.kind === 'peony' ? 0.7 + rand(i, fw.beat + 1) * 0.3 : ring;
  const decay = fw.kind === 'willow' ? 2.2 : 3.4;
  const spread = fw.r * speed * (1 - Math.exp(-age * decay));
  return [fw.x + Math.cos(a) * spread, fw.y + Math.sin(a) * spread * 0.92 + fw.r * fw.gravity * age * age];
};

// A spark in the sky, or (in the mirror pass) its reflection broken into every other row of the water.
type Pass = { readonly ctx: Ctx; readonly f: Frame; readonly mirror: boolean };

const dot = ({ ctx, f, mirror }: Pass, x: number, y: number, color: string, reflected: string): void => {
  const water = waterOf(f);
  if (y >= water) return;
  if (!mirror) {
    fillRect(ctx, color, Math.round(x), Math.round(y), 1, 1);
    return;
  }
  const ry = Math.round(water + (water - y) * REFLECT);
  if (ry >= f.h || (ry & 1) === 1) return;
  fillRect(ctx, reflected, Math.round(x + Math.sin(ry * 0.45 + f.t * 3) * 1.5), ry, 1, 1);
};

const sparkColor = (fw: Firework, i: number, age: number, c: Colors<K>): string => {
  if (age < 0.12) return c.flash;
  if (age > fw.life * 0.62) return c.ember;
  return fw.kind === 'double' && i % 2 === 1 ? fw.inner : fw.color;
};

const sparks = (pass: Pass, c: Colors<K>, fw: Firework, age: number): void => {
  const twinkle = Math.floor(pass.f.t * 14);
  for (let i = 0; i < fw.sparks; i++) {
    if (age > fw.life * 0.75 && rand(i, twinkle) < 0.5) continue;
    const color = sparkColor(fw, i, age, c);
    const [x, y] = sparkAt(fw, i, age);
    dot(pass, x, y, color, fw.color);
    const tail = fw.kind === 'willow' ? 6 : 3;
    for (let k = 1; k <= tail; k++) {
      const [tx, ty] = sparkAt(fw, i, Math.max(0, age - k * 0.045));
      dot(pass, tx, ty, k <= 2 ? color : c.ember, c.ember);
    }
  }
};

const rocket = (pass: Pass, c: Colors<K>, fw: Firework, age: number): void => {
  const p = age + 1;
  const water = waterOf(pass.f);
  const climb = 1 - (1 - p) ** 2;
  const x = fw.x + (1 - p) * (rand(fw.beat, 10) - 0.5) * 12;
  const y = water - (water - fw.y) * climb;
  dot(pass, x, y, c.flash, c.lanternHi);
  dot(pass, x, y + 2, c.lanternHi, c.ember);
  dot(pass, x, y + 4, c.ember, c.ember);
};

const fireworks = (pass: Pass, c: Colors<K>): void => {
  const { ctx, f } = pass;
  const now = Math.floor(f.beat);
  for (let b = now - 4; b <= now + 1; b++) {
    if (b < 0 || !fires(b, f)) continue;
    const fw = fireworkOf(b, f, c);
    const age = f.beat - b;
    if (age < -1 || age > fw.life) continue;
    if (age < 0) {
      rocket(pass, c, fw, age);
      continue;
    }
    if (age < 0.25 && !pass.mirror) drawGlow(ctx, fw.x, fw.y, 7, age < 0.1 ? c.flash : fw.color, 1);
    sparks(pass, c, fw, age);
  }
};

const bursts = (ctx: Ctx, f: Frame, c: Colors<K>): void => fireworks({ ctx, f, mirror: false }, c);
const reflections = (ctx: Ctx, f: Frame, c: Colors<K>): void => fireworks({ ctx, f, mirror: true }, c);

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const water = waterOf(f);
  ctx.drawImage(ditherGradient(f.w, water, [c.sky0, c.sky1, c.sky2]), 0, 0);
  stars(ctx, f.w, f.h, f.t, [c.star], Math.round((f.w * water) / 900), 17, 0.45);
};

const paintHouse = (ctx: Ctx, c: Colors<K>, x: number, base: number, w: number, h: number, i: number): void => {
  fillRect(ctx, c.town, x, base - h, w, h);
  for (let k = 0; k < w; k++) {
    const rise = Math.round(Math.min(k, w - 1 - k) * 0.6);
    fillRect(ctx, c.town, x + k, base - h - rise, 1, rise + 1);
  }
  if (rand(i, 31) < 0.6) fillRect(ctx, c.lanternHi, x + 2 + Math.floor(rand(i, 32) * (w - 5)), base - h + 3, 2, 2);
  if (rand(i, 33) < 0.4) fillRect(ctx, c.lantern, x + 2 + Math.floor(rand(i, 34) * (w - 5)), base - h + 7, 2, 2);
};

const paintLanterns = (ctx: Ctx, f: Frame, c: Colors<K>, base: number): void => {
  const span = 64;
  for (let x0 = 0; x0 < f.w; x0 += span) {
    fillRect(ctx, c.town, x0, base - 26, 1, 26);
    for (let k = 0; k < span; k++) {
      const u = k / span;
      const y = Math.round(base - 25 + Math.sin(u * Math.PI) * 6);
      fillRect(ctx, c.townHi, x0 + k, y, 1, 1);
      if (k % 6 === 3) fillRect(ctx, k % 12 === 3 ? c.lantern : c.lanternHi, x0 + k, y + 1, 2, 2);
    }
  }
};

const townLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`fireworks-town:${[c.town, c.townHi, c.lantern, c.lanternHi].join(',')}`, f.w, f.h, (ctx) => {
    const base = waterOf(f);
    const hill = Math.min(f.w, f.h) * 0.16;
    ctx.fillStyle = c.townHi;
    for (let x = 0; x < f.w; x++) {
      const y = Math.round(base - hill * (0.35 + ridgeNoise(x / 60, 12) * 0.65));
      ctx.fillRect(x, y, 1, base - y);
    }
    let x = -4;
    for (let i = 0; x < f.w; i++) {
      const w = 10 + Math.floor(rand(i, 35) * 12);
      const h = 7 + Math.floor(rand(i, 36) * 10);
      paintHouse(ctx, c, x, base, w, h, i);
      x += w + Math.floor(rand(i, 37) * 4);
    }
    paintLanterns(ctx, f, c, base);
  });

const waterLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement => {
  const water = waterOf(f);
  return ditherGradient(f.w, f.h - water, [c.water1, c.water0, c.water0]);
};

const water = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const top = waterOf(f);
  ctx.drawImage(waterLayer(f, c), 0, top);
  // Lantern light trembling on the water, and slow ripples.
  for (let x0 = 3; x0 < f.w; x0 += 12) {
    for (let k = 0; k < 4; k++) {
      const y = top + 3 + k * 4;
      const x = x0 + Math.round(Math.sin(y * 0.7 + f.t * 2.5 + x0) * 1.5);
      fillRect(ctx, k < 2 ? c.lanternHi : c.lantern, x, y, k < 2 ? 2 : 1, 1);
    }
  }
  const count = Math.round(f.w / 6);
  for (let i = 0; i < count; i++) {
    const y = top + 4 + Math.floor(rand(i, 41) ** 1.5 * (f.h - top - 4));
    const x = wrap(rand(i, 42) * f.w + f.t * (3 + rand(i, 43) * 4), f.w + 10) - 5;
    fillRect(ctx, f.kick > 0.6 && i % 3 === 0 ? c.townHi : c.ripple, Math.round(x), y, 3 + Math.floor(rand(i, 44) * 5), 1);
  }
};

const town = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(townLayer(f, c), 0, 0);
  fillRect(ctx, c.townHi, 0, waterOf(f), f.w, 1);
};

export const summerFireworks = defineScene<K>({
  id: 'summer-fireworks',
  title: 'Summer Fireworks',
  mood: { valence: 0.6, energy: 0.5 },
  styles: ['summer-festival', 'nineties-pop', 'neon-rush', 'band-rock'],
  variants: [
    {
      mood: { valence: 0.6, energy: 0.4 },
      colors: {
        sky0: '#07081f',
        sky1: '#141340',
        sky2: '#2e1f5a',
        star: '#d8d0ff',
        town: '#06051a',
        townHi: '#231c48',
        lantern: '#ff7a3c',
        lanternHi: '#ffd27a',
        water0: '#070820',
        water1: '#121536',
        ripple: '#33367a',
        fwA: '#ff5f86',
        fwB: '#ffd84a',
        fwC: '#62dcff',
        fwD: '#a6ff6e',
        ember: '#a2465a',
        flash: '#ffffff',
      },
    },
    {
      mood: { valence: 0.3, energy: 0.8 },
      colors: {
        sky0: '#10031b',
        sky1: '#2a0734',
        sky2: '#520f4c',
        star: '#ffc8f0',
        town: '#090210',
        townHi: '#360c3a',
        lantern: '#ff3e8a',
        lanternHi: '#ffb0e0',
        water0: '#0d0215',
        water1: '#1c0726',
        ripple: '#561c66',
        fwA: '#ff4ad8',
        fwB: '#ffe24a',
        fwC: '#4affe8',
        fwD: '#ff8a3a',
        ember: '#8a2a6a',
        flash: '#ffffff',
      },
    },
  ],
  layers: [sky, bursts, town, water, reflections],
});
