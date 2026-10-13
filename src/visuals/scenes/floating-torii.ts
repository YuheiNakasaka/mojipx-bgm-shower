// The great vermilion gate standing in the sea at sunset: its reflection trembles on the tide, the sun lays a path
// of glitter across the water, a boatman sculls past behind it and deer graze on the shore.
import { type Ctx, drawSprite, fillRect, flipped, type Sprite } from 'mojipx';
import { disc, ditherGradient, fillColumns, noise1, rand, ridgeNoise, stars } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { colorKey, drawGlow, flock, paletteBy, wrap } from './batch-1-helpers.ts';
import { memoLayer, tileX } from './batch-2-helpers.ts';
import { BIRD, isDark, isWide, pixelLayer, ripple, STONE_LANTERN } from './batch-5-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sky3'
  | 'sun'
  | 'sunGlow'
  | 'cloud'
  | 'cloudLit'
  | 'far'
  | 'mid'
  | 'sea0'
  | 'sea1'
  | 'sea2'
  | 'glint'
  | 'verm'
  | 'vermLit'
  | 'vermShade'
  | 'black'
  | 'sand'
  | 'sandShade'
  | 'foam'
  | 'deer'
  | 'deerShade'
  | 'lamp';

type Layout = {
  readonly horizon: number;
  readonly sunX: number;
  readonly sunY: number;
  readonly sunR: number;
  /** The gate: its centre, the line where it meets the water, and its height. */
  readonly gx: number;
  readonly base: number;
  readonly tall: number;
  /** The beach edge at the left and right of the screen. */
  readonly shoreL: number;
  readonly shoreR: number;
};

const layoutOf = (f: Frame): Layout =>
  isWide(f)
    ? {
        horizon: Math.round(f.h * 0.56),
        sunX: Math.round(f.w * 0.27),
        sunY: Math.round(f.h * 0.5),
        sunR: 13,
        gx: Math.round(f.w * 0.63),
        base: Math.round(f.h * 0.73),
        tall: Math.round(f.h * 0.47),
        shoreL: Math.round(f.h * 0.76),
        shoreR: Math.round(f.h * 1.36),
      }
    : {
        horizon: Math.round(f.h * 0.5),
        sunX: Math.round(f.w * 0.53),
        sunY: Math.round(f.h * 0.35),
        sunR: 14,
        gx: Math.round(f.w * 0.53),
        base: Math.round(f.h * 0.71),
        tall: Math.round(f.h * 0.27),
        shoreL: Math.round(f.h * 0.85),
        shoreR: Math.round(f.h * 0.9),
      };

const shoreAt = (m: Layout, w: number, x: number): number => m.shoreL + ((m.shoreR - m.shoreL) * x) / w;

const night = (c: Colors<K>): boolean => isDark(c.sky2);

// ---- the sky ----

// Thin streaks of cloud whose undersides catch the low sun.
const streaks = (w: number, body: string, lit: string, seed: number): HTMLCanvasElement =>
  memoLayer(`miyajima-streaks:${seed}:${body}:${lit}`, w, 10, (g) => {
    for (let x = 0; x < w; x++) {
      const len = noise1(x / 18, seed) * 0.7 + noise1(x / 5, seed + 1) * 0.3 - 0.55;
      if (len <= 0) continue;
      const thick = Math.min(4, 1 + Math.floor(len * 12));
      const y = 4 - Math.floor(thick / 2) + Math.round((noise1(x / 40, seed + 2) - 0.5) * 4);
      fillRect(g, body, x, y, 1, thick);
      fillRect(g, lit, x, y + thick, 1, 1);
    }
  });

// The sun sinks in slices, the old way; the moon rides higher and stays whole.
const sunDisc = (ctx: Ctx, m: Layout, c: Colors<K>): void => {
  const dark = night(c);
  const y = dark ? Math.round(m.sunY - m.horizon * 0.3) : m.sunY;
  const r = dark ? Math.round(m.sunR * 0.6) : m.sunR;
  drawGlow(ctx, c.sunGlow, m.sunX, y, m.sunR * 3, m.sunR * 2, dark ? 0.5 : 0.75, 4);
  disc(ctx, m.sunX, y, r, (dy) => (!dark && dy > r * 0.15 && (dy & 3) === 2 ? null : c.sun));
};

const mountainsLayer = (f: Frame, m: Layout, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`miyajima-hills:${colorKey(c)}`, f.w, m.horizon + 1, (g) => {
    fillColumns(g, f.w, m.horizon + 1, c.far, (x) => m.horizon - 4 - ridgeNoise(x / 34, 31) * 14);
    fillColumns(g, f.w, m.horizon + 1, c.mid, (x) => m.horizon - 1 - Math.max(0, ridgeNoise(x / 22, 32) - 0.45) * 26);
  });

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  ctx.drawImage(ditherGradient(f.w, m.horizon, [c.sky0, c.sky1, c.sky2, c.sky3]), 0, 0);
  if (night(c)) stars(ctx, f.w, f.h, f.t, [c.foam, c.glint], Math.round((f.w * m.horizon) / 300), 37, (m.horizon * 0.8) / f.h);
  sunDisc(ctx, m, c);
  tileX(ctx, streaks(400, c.cloud, c.cloudLit, 3), f.t * 2, Math.round(m.horizon * 0.22), f.w);
  tileX(ctx, streaks(340, c.cloud, c.cloudLit, 9), f.t * 3.5 + 120, Math.round(m.horizon * 0.42), f.w);
  tileX(ctx, streaks(460, c.cloudLit, c.sunGlow, 14), f.t * 5 + 40, Math.round(m.sunY - m.sunR * 0.8), f.w);
  ctx.drawImage(mountainsLayer(f, m, c), 0, 0);
};

// ---- the sea ----

const swell = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const deep = f.h - m.horizon;
  const count = Math.round((f.w * deep) / 260);
  for (let i = 0; i < count; i++) {
    const d = rand(i, 71) ** 1.4;
    const y = m.horizon + 2 + Math.floor(d * (deep - 2));
    const x = wrap(rand(i, 73) * (f.w + 20) + f.t * (1 + d * 5), f.w + 20) - 10;
    fillRect(ctx, i % 3 === 0 ? c.sea0 : c.sea1, Math.round(x), y, 2 + Math.round(d * 9 * rand(i, 72)), 1);
  }
};

// A column of glitter below a light, flickering a few times a second and widening toward the viewer.
const glitter = (ctx: Ctx, f: Frame, m: Layout, x0: number, color: string, spread: number): void => {
  const tick = Math.floor(f.t * 4);
  for (let y = m.horizon + 1; y < f.h; y += 2) {
    const d = (y - m.horizon) / (f.h - m.horizon);
    for (let k = 0; k < 3; k++) {
      if (rand(y * 7 + k, tick) < 0.3) continue;
      const x = x0 + (rand(y * 3 + k, tick + 99) - 0.5) * (3 + d * spread);
      fillRect(ctx, color, Math.round(x), y, 1 + Math.floor(rand(k + y, tick) * (2 + d * 5)), 1);
    }
  }
};

// o silhouette, h the lit rim of the gunwale. The boatman sculls from the stern with a long oar.
const BOAT: Sprite = [
  '....ooo...............',
  '..ooooooo.............',
  '....ooo...............',
  '....oooo..............',
  '...oooooo.............',
  '..o.oooo..............',
  '.o..oooo..............',
  'o...o..o..............',
  'hhhhhhhhhhhhhhhhhhhhhh',
  '.oooooooooooooooooooo.',
  '...oooooooooooooooo...',
];

const boatPalette = paletteBy<K>((c) => ({ o: c.black, h: c.cloudLit }));

const boat = (ctx: Ctx, f: Frame, m: Layout, c: Colors<K>): void => {
  const x = Math.round(wrap(f.t * 5 + f.w * 0.12, f.w + 60) - 30);
  const y = Math.round(m.horizon + (m.base - m.horizon) * 0.4) - BOAT.length;
  drawSprite(ctx, BOAT, boatPalette(c), x, y);
  fillRect(ctx, c.sea2, x + 1, y + BOAT.length, 20, 1);
  if (night(c)) {
    drawGlow(ctx, c.lamp, x + 20, y + 6, 6, 5, 0.6);
    fillRect(ctx, c.lamp, x + 20, y + 5, 1, 2);
  }
};

const sea = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  ctx.drawImage(ditherGradient(f.w, f.h - m.horizon, [c.sea0, c.sea1, c.sea2]), 0, m.horizon);
  swell(ctx, f, m, c);
  glitter(ctx, f, m, m.sunX, c.glint, f.w * 0.3);
  boat(ctx, f, m, c);
};

// ---- the gate ----

type GatePaint = { readonly body: string; readonly lit: string; readonly shade: string; readonly top: string; readonly plaque: string };

// A round post lit from the left.
const post = (g: Ctx, p: GatePaint, x: number, w: number, y0: number, y1: number): void => {
  fillRect(g, p.body, x, y0, w, y1 - y0);
  fillRect(g, p.lit, x, y0, Math.max(1, Math.floor(w / 3)), y1 - y0);
  fillRect(g, p.shade, x + w - 1, y0, 1, y1 - y0);
};

const bar = (g: Ctx, p: GatePaint, x0: number, x1: number, y0: number, y1: number): void => {
  fillRect(g, p.body, Math.round(x0), y0, Math.round(x1 - x0), y1 - y0);
  fillRect(g, p.lit, Math.round(x0), y0, Math.round(x1 - x0), 1);
  fillRect(g, p.shade, Math.round(x0), y1 - 1, Math.round(x1 - x0), 1);
};

// The four shorter legs that brace each main pillar, tied to it by two rails and capped with little roofs.
const braces = (g: Ctx, p: GatePaint, tall: number, mid: number, at: (k: number) => number): void => {
  const lw = Math.max(3, Math.round(tall * 0.05));
  const rail = Math.max(1, Math.round(tall * 0.02));
  for (const dx of [-1, 1]) {
    const lx = Math.round(mid + dx * tall * 0.15 - lw / 2);
    post(g, p, lx, lw, at(0.38), at(0));
    fillRect(g, p.top, lx - 1, at(0.38) - 2, lw + 2, 2);
    for (const k of [0.17, 0.32]) fillRect(g, p.body, Math.min(lx, mid), at(k), Math.abs(lx - mid) + lw, rail);
  }
};

// The top beam: a dark roof over vermilion, sweeping up toward its tips.
const kasagi = (g: Ctx, p: GatePaint, tall: number, cx: number, at: (k: number) => number): void => {
  const half = tall * 0.74;
  const straight = tall * 0.28;
  for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) {
    const u = Math.max(0, (Math.abs(x - cx) - straight) / (half - straight));
    const rise = Math.round(u * u * tall * 0.1);
    const top = at(0.98) - rise;
    const bottom = at(0.86) - Math.round(rise * 0.75);
    const roof = Math.max(1, Math.round((bottom - top) * 0.45));
    fillRect(g, p.top, x, top, 1, roof);
    fillRect(g, p.body, x, top + roof, 1, bottom - top - roof);
  }
};

const paintGate = (g: Ctx, tall: number, w: number, p: GatePaint): void => {
  const cx = w / 2;
  const at = (k: number): number => Math.round(tall * 1.06 - k * tall);
  const pw = Math.max(4, Math.round(tall * 0.09));
  for (const side of [-1, 1]) {
    const mid = cx + side * tall * 0.33;
    braces(g, p, tall, mid, at);
    post(g, p, Math.round(mid - pw / 2), pw, at(0.86), at(0));
  }
  bar(g, p, cx - tall * 0.48, cx + tall * 0.48, at(0.7), at(0.64));
  fillRect(g, p.body, Math.round(cx - tall * 0.02), at(0.81), Math.max(2, Math.round(tall * 0.04)), at(0.7) - at(0.81));
  const pl = Math.round(tall * 0.055);
  fillRect(g, p.plaque, Math.round(cx) - pl, at(0.8), pl * 2, at(0.71) - at(0.8));
  fillRect(g, p.top, Math.round(cx) - pl + 1, at(0.8) + 1, pl * 2 - 2, at(0.71) - at(0.8) - 2);
  bar(g, p, cx - tall * 0.53, cx + tall * 0.53, at(0.86), at(0.8));
  kasagi(g, p, tall, cx, at);
};

const gateImage = (m: Layout, p: GatePaint): HTMLCanvasElement => {
  const w = Math.round(m.tall * 1.56) + 4;
  return memoLayer(`miyajima-gate:${m.tall}:${Object.values(p).join(',')}`, w, Math.round(m.tall * 1.06) + 1, (g) =>
    paintGate(g, m.tall, w, p),
  );
};

const gate = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  if (night(c))
    drawGlow(
      ctx,
      c.vermShade,
      m.gx,
      m.base - m.tall * 0.4,
      Math.round(m.tall * 0.75),
      Math.round(m.tall * 0.55),
      f.kick > 0.5 ? 0.55 : 0.45,
    );
  const front = gateImage(m, { body: c.verm, lit: c.vermLit, shade: c.vermShade, top: c.black, plaque: c.sunGlow });
  const mirror = gateImage(m, { body: c.vermShade, lit: c.verm, shade: c.black, top: c.black, plaque: c.vermShade });
  const x = Math.round(m.gx - front.width / 2);
  ripple(
    ctx,
    f,
    mirror,
    { x, top: m.base, bottom: Math.min(f.h, m.base + mirror.height) },
    { amp: 1.6, freq: 0.55, speed: 2.4, squash: 1, gap: 4 },
  );
  if (night(c)) glitter(ctx, f, { ...m, horizon: m.base }, m.gx, c.glint, m.tall * 0.9);
  ctx.drawImage(front, x, m.base - front.height + 1);
  fillRect(ctx, c.foam, x + Math.round(front.width / 2 - m.tall * 0.42), m.base + 1, Math.round(m.tall * 0.84), 1);
};

// ---- the shore ----

const beachPick = (f: Frame, m: Layout, c: Colors<K>) => {
  return (x: number, y: number): string | null => {
    const edge = shoreAt(m, f.w, x);
    if (y < edge) return null;
    if (y < edge + 2) return c.sandShade;
    return rand(x * 13 + y * 7, 81) < 0.08 ? c.sandShade : c.sand;
  };
};

const shore = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  ctx.drawImage(pixelLayer(`miyajima-beach:${colorKey(c)}`, f.w, f.h, beachPick(f, m, c)), 0, 0);
  // Little waves run up the sand and slide back.
  const reach = (Math.sin(f.t * 0.9) + 1) * 1.5;
  ctx.fillStyle = c.foam;
  for (let x = 0; x < f.w; x++) {
    const y = shoreAt(m, f.w, x) - 1 + Math.round(reach + Math.sin(x * 0.2 + f.t * 2) * 0.8);
    if (y < f.h) ctx.fillRect(x, y, 1, 1);
  }
};

// ---- deer, a lantern and birds ----

// Sika deer facing left: o outline, b coat, d shade, w white spots and rump, e eye. Two frames per pose.
const DEER_LEGS = [
  '......obbbbbbbbbbbbbbo',
  '......odbbbbbbbbbbbbdo',
  '.......oddddddddddddo.',
  '.......ob.ob.....ob.ob',
  '.......ob.ob.....ob.ob',
  '.......oo.oo.....oo.oo',
];

const STAND: readonly Sprite[] = [
  [
    '..o..o................',
    '.obo.obo..............',
    '..obboo...............',
    '..obbbbo..............',
    '.obebbbo..............',
    'obbbbbbo..............',
    'oobbbbo...............',
    '.oooobbo..............',
    '.....obbo.............',
    '.....obbbo............',
    '.....obbbbooooooooo...',
    '.....obbbbbbbbbbbbbwo.',
    '.....obbbwbbbbwbbbwwwo',
    '......obbbbbwbbbbwbwwo',
    ...DEER_LEGS,
  ],
  [
    '.o...o................',
    'obo.obo...............',
    '.oboboo...............',
    '..obbbbo..............',
    '.obebbbo..............',
    'obbbbbbo..............',
    'oobbbbo...............',
    '.oooobbo..............',
    '.....obbo.............',
    '.....obbbo............',
    '.....obbbbooooooooo.o.',
    '.....obbbbbbbbbbbbbowo',
    '.....obbbwbbbbwbbbwwwo',
    '......obbbbbwbbbbwbwwo',
    ...DEER_LEGS,
  ],
];

const GRAZE: readonly Sprite[] = [
  [
    '.....oooooooooooooo...',
    '....obbbbbbbbbbbbbbwo.',
    '...obbbbwbbbbwbbbbwwwo',
    '..obbobbbbbwbbbbwbbwwo',
    '.obbo.obbbbbbbbbbbbbbo',
    'oobbo.odbbbbbbbbbbbbdo',
    'obeo...oddddddddddddo.',
    'obbo...ob.ob.....ob.ob',
    'oobo...ob.ob.....ob.ob',
    '.oo....oo.oo.....oo.oo',
  ],
  [
    '.....oooooooooooooo...',
    '....obbbbbbbbbbbbbbwo.',
    '...obbbbwbbbbwbbbbwwwo',
    '..obbobbbbbwbbbbwbbwwo',
    '.obbo.obbbbbbbbbbbbbbo',
    '.obbo.odbbbbbbbbbbbbdo',
    'oobbo..oddddddddddddo.',
    'obeo...ob.ob.....ob.ob',
    'obbo...ob.ob.....ob.ob',
    'ooo....oo.oo.....oo.oo',
  ],
];

const deerPalette = paletteBy<K>((c) => ({ o: c.black, b: c.deer, d: c.deerShade, w: c.foam, e: c.black }));
const stonePalette = paletteBy<K>((c) => ({ o: c.black, h: c.sand, s: c.sandShade, d: c.deerShade, L: c.lamp }));

const STAND_RIGHT = STAND.map(flipped);

// One deer stands looking out at the gate and flicks its ears every other bar; another grazes, nibbling on the beat.
const deer = (ctx: Ctx, f: Frame, c: Colors<K>, at: { readonly x: number; readonly foot: number; readonly grazing: boolean }): void => {
  const frames = at.grazing ? GRAZE : STAND_RIGHT;
  const k = at.grazing ? Math.floor(f.beat) % 2 : Math.floor(f.bar / 2) % 2;
  const sprite = frames[k] ?? (frames[0] as Sprite);
  drawSprite(ctx, sprite, deerPalette(c), at.x, at.foot - sprite.length);
};

const life = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = layoutOf(f);
  const lx = Math.round(f.w * (isWide(f) ? 0.03 : 0.06));
  drawSprite(ctx, STONE_LANTERN, stonePalette(c), lx, Math.round(shoreAt(m, f.w, lx + 5)) + 4 - STONE_LANTERN.length + 12);
  if (night(c)) drawGlow(ctx, c.lamp, lx + 5, Math.round(shoreAt(m, f.w, lx + 5)) + 4, 9, 7, 0.5);
  const ax = Math.round(f.w * (isWide(f) ? 0.1 : 0.22));
  const bx = Math.round(f.w * (isWide(f) ? 0.2 : 0.55));
  const footAt = (x: number, below: number): number => Math.min(f.h - 3, Math.round(shoreAt(m, f.w, x + 8)) + below);
  deer(ctx, f, c, { x: ax, foot: footAt(ax, 16), grazing: false });
  deer(ctx, f, c, { x: bx, foot: footAt(bx, 19), grazing: true });
  const lane = { count: 3, top: Math.round(m.horizon * 0.25), span: Math.round(m.horizon * 0.3), speed: 7, seed: 91 };
  flock(ctx, f, BIRD, deerPalette(c), lane);
};

export const floatingTorii = defineScene<K>({
  id: 'floating-torii',
  title: 'Floating Gate',
  mood: { valence: 0.2, energy: -0.4 },
  styles: ['credits-roll', 'starlit-dream', 'lofi-loop', 'showa-ballad'],
  variants: [
    {
      mood: { valence: 0.25, energy: -0.4 },
      colors: {
        sky0: '#2a1f5c',
        sky1: '#7a3a7a',
        sky2: '#e0607a',
        sky3: '#ffb070',
        sun: '#fff2b0',
        sunGlow: '#ffcf70',
        cloud: '#6a3270',
        cloudLit: '#ff9a6a',
        far: '#6a4080',
        mid: '#3a2456',
        sea0: '#f0a070',
        sea1: '#a0507a',
        sea2: '#40265a',
        glint: '#fff0b0',
        verm: '#e04a2c',
        vermLit: '#ff9050',
        vermShade: '#90281e',
        black: '#1e1220',
        sand: '#c08a6a',
        sandShade: '#8a5a5a',
        foam: '#ffe0c0',
        deer: '#b0703e',
        deerShade: '#7a4428',
        lamp: '#ffd27a',
      },
    },
    {
      mood: { valence: -0.45, energy: -0.6 },
      colors: {
        sky0: '#04061a',
        sky1: '#0a1236',
        sky2: '#18245a',
        sky3: '#2c3a72',
        sun: '#f4f0d8',
        sunGlow: '#5c6aa8',
        cloud: '#1a2250',
        cloudLit: '#3c4a84',
        far: '#121a40',
        mid: '#080d26',
        sea0: '#26346a',
        sea1: '#121c48',
        sea2: '#060a22',
        glint: '#ffcf6a',
        verm: '#ff5a32',
        vermLit: '#ffb070',
        vermShade: '#a82c1e',
        black: '#120a14',
        sand: '#4a4660',
        sandShade: '#2e2a44',
        foam: '#8a94c8',
        deer: '#6a5a5a',
        deerShade: '#3e3440',
        lamp: '#ffd27a',
      },
    },
    {
      mood: { valence: 0.55, energy: 0.1 },
      colors: {
        sky0: '#4f86d4',
        sky1: '#86b6ea',
        sky2: '#c6e0f4',
        sky3: '#f6f0dc',
        sun: '#ffffff',
        sunGlow: '#fff2c8',
        cloud: '#ffffff',
        cloudLit: '#cddcf0',
        far: '#94accc',
        mid: '#5c7c9c',
        sea0: '#acd4ea',
        sea1: '#5a9ac8',
        sea2: '#2a6a9a',
        glint: '#ffffff',
        verm: '#ee4a2a',
        vermLit: '#ff8a5a',
        vermShade: '#a82c1e',
        black: '#2a1a1e',
        sand: '#e8d4a8',
        sandShade: '#b89e78',
        foam: '#ffffff',
        deer: '#b0743e',
        deerShade: '#7a4a28',
        lamp: '#ffe9a8',
      },
    },
  ],
  layers: [sky, sea, gate, shore, life],
});
