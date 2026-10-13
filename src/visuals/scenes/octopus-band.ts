// A concert at the bottom of the sea: a peach-haired idol sings on a giant clam shell while an octopus drums with all
// eight arms, jellyfish drift overhead like stage lights, and a crowd of round fish hops and waves glow sticks.
import { type Ctx, drawSprite, fillRect, flipped, type Palette, type Point, type Sprite } from 'mojipx';
import { bayer, disc, ditherGradient, fillColumns, frac, hexToRgb, memoCanvas, pixelLine, rand, ridgeNoise } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { fillDither, drawGlow as ovalGlow, type Rgb, setPixel } from './batch-1-helpers.ts';
import { drawGlow, memoLayer, paletteOf, wrap } from './batch-2-helpers.ts';
import { recentBeats } from './batch-3-helpers.ts';
import { mixHex } from './batch-5-helpers.ts';
import { ring, twinkle } from './batch-6-helpers.ts';
import { alternate, blinking, drawGirl, type Girl, limb, wide } from './batch-7-helpers.ts';
import { drawJelly } from './batch-11-helpers.ts';

type K =
  | 'water0'
  | 'water1'
  | 'water2'
  | 'water3'
  | 'ray'
  | 'far'
  | 'shell'
  | 'shellHi'
  | 'shellLo'
  | 'pearl'
  | 'weed'
  | 'weedLo'
  | 'ink'
  | 'skin'
  | 'skinLo'
  | 'blush'
  | 'mouth'
  | 'hair'
  | 'hairHi'
  | 'hairLo'
  | 'iris'
  | 'white'
  | 'whiteLo'
  | 'frill'
  | 'frillLo'
  | 'gold'
  | 'octo'
  | 'octoHi'
  | 'octoLo'
  | 'drum'
  | 'drumHi'
  | 'fishA'
  | 'fishB'
  | 'fishC'
  | 'glow'
  | 'jelly'
  | 'jellyHi'
  | 'jellyRim'
  | 'bubble';

// ---- layout ----

type Layout = {
  readonly wide: boolean;
  /** The stage floor: the girl stands on it and the crowd gathers just below its lip. */
  readonly stageY: number;
  readonly shellX: number;
  readonly shellRx: number;
  readonly shellRy: number;
  readonly girlX: number;
  /** The bottom centre of the drum kit (on a coral riser on tall screens, so the band stacks up). */
  readonly kitX: number;
  readonly kitY: number;
  readonly crowdY: number;
};

const layoutOf = (f: Frame): Layout => {
  if (wide(f)) {
    const stageY = Math.round(f.h * 0.76);
    return {
      wide: true,
      stageY,
      shellX: Math.round(f.w * 0.52),
      shellRx: Math.min(Math.round(f.w * 0.42), 150),
      shellRy: stageY - Math.round(f.h * 0.07),
      girlX: Math.round(f.w * 0.34),
      kitX: Math.round(f.w * 0.68),
      kitY: stageY - 5,
      crowdY: stageY + 12,
    };
  }
  const stageY = Math.round(f.h * 0.75);
  const shellRx = Math.round(f.w * 0.48);
  return {
    wide: false,
    stageY,
    shellX: Math.round(f.w / 2),
    shellRx,
    shellRy: Math.min(Math.round(shellRx * 1.75), stageY - 50),
    girlX: Math.round(f.w * 0.31),
    kitX: Math.round(f.w * 0.66),
    kitY: stageY - 34,
    crowdY: stageY + 12,
  };
};

// ---- the girl: o outline, s/S skin, b blush, m mouth, h/H/d hair, e/E/i eyes, w glint, y/Y dress, P pearls,
// g/G star brooch, f/F frilled skirt ----

const HEAD: Sprite = [
  '...........oooooooo...........',
  '.........ooHHhhhhHHoo.........',
  '.......oohHHhhhhhhHHhoo.......',
  '......ohHHhhhhhhhhhhHHho......',
  '.....ohHhhhhhhhhhhhhhhHho.....',
  '....ohhhhhhhhhhhhhhhhhhhdo....',
  '...ohhhhhhhhhhhhhhhhhhhhhdo...',
  '...ohhHHHHhhhhhhhhhhHHHHhdo...',
  '..ohhhhhhhhhhhhhhhhhhhhhhhdo..',
  '..ohhhhhhhhhhhhhhhhhhhhhhhdo..',
  '..ohhhhhhdhhhdssdhhhdhhhhhdo..',
  '..ohHhhhdsdhdssssdhdsdhhhHdo..',
  '..ohHhhdsssdssssssdsssdhhHdo..',
  '..ohHhdooooossssssooooodhHdo..',
  '..ohHhdseweEssssssEewesdhHdo..',
  '..ohHhdseeEEssssssEEeesdhHdo..',
  '..ohHhdsEEEEssssssEEEEsdhHdo..',
  '..ohHhdsEiiEssssssEiiEsdhHdo..',
  '..ohHhdssssssssssssssssdhHdo..',
  '..ohhhdbbbssssmmssssbbbdhhdo..',
  '..ohhdoSssssssssssssssSodhdo..',
  '..ohdo.oSssssssssssssSo.oddo..',
  '..odo...ooSssssssssSoo...odo..',
  '...o......oooooooooo......o...',
];

const TORSO: Sprite = [
  '.............oSSo.............',
  '.......oooooPPssPPooooo.......',
  '......oyyyyoyPssPyoyyyyo......',
  '.....oyyyyyoyyPPyyoyyyyyo.....',
  '.....oyyyyyoyyyyyyoyyyyYo.....',
  '.....oYyyyYoyyggyyoYyyyYo.....',
  '.....ofyfyfoygGGgyofyfyfo.....',
  '......ooooooyyggyyoooooo......',
  '...........oYyyyyYo...........',
  '...........oFFFFFFo...........',
  '..........offffffffo..........',
  '.........offffffffffo.........',
  '.........offFffffFffo.........',
  '........offfFffffFfffo........',
  '........oyYyYyYYyYyYyo........',
  '.......offffFffffFffffo.......',
  '.......offfffFffFfffffo.......',
  '......offfffFffffFfffffo......',
  '......oyYyYyYyYYyYyYyYyo......',
  '.....offfffFffffffFfffffo.....',
  '.....offffffFffffFffffffo.....',
  '....oyyyyyyyyyyyyyyyyyyyyo....',
  '....oyYyYyYyYyYYyYyYyYyYyo....',
  '.....oooooooooooooooooooo.....',
];

const LEGS: Sprite = [
  '..........oso....oso..........',
  '..........oSo....oSo..........',
  '.........offfo..offfo.........',
  '.........oyyyo..oyyyo.........',
  '.........oyyYo..oyyYo.........',
  '.........oyyYo..oyyYo.........',
  '........oyyyYo..oyyyYo........',
  '........oooooo..oooooo........',
];

const GIRL_H = HEAD.length + TORSO.length + LEGS.length;
const GIRL: Girl = {
  eyes: [
    { x: 8, y: 13, out: -1, w: 4, h: 5 },
    { x: 18, y: 13, out: 1, w: 4, h: 5 },
  ],
  seed: 47,
};

const MOUTH_OPEN: Sprite = ['.oo.', 'omMo', '.oo.'];

// A scallop shell: her hair clip, and the emblem on the bass drum. o outline, p shell, P its light ribs.
const SHELL: Sprite = ['.ooooo.', 'oPpPpPo', 'oPpPpPo', '.oPpPo.', '..oPo..', '.ooooo.'];

// The microphone: W/w grille, f ring, k handle.
const MIC: Sprite = ['.ooo.', 'oWwWo', 'owWwo', 'oWwWo', '.ofo.', '.oko.', '.oko.', '.oko.', '.oko.', '..o..'];

const girlPalette = (c: Colors<K>): Palette => ({
  o: c.ink,
  s: c.skin,
  S: c.skinLo,
  b: c.blush,
  m: c.mouth,
  M: c.blush,
  h: c.hair,
  H: c.hairHi,
  d: c.hairLo,
  e: c.ink,
  E: c.iris,
  i: mixHex(c.iris, c.white, 0.55),
  w: c.white,
  y: c.white,
  Y: c.whiteLo,
  P: c.pearl,
  g: c.gold,
  G: c.white,
  f: c.frill,
  F: c.frillLo,
});
const clipPalette = (c: Colors<K>): Palette => ({ o: c.ink, p: c.shellHi, P: c.pearl });
const emblemPalette = (c: Colors<K>): Palette => ({ o: c.ink, p: c.shell, P: c.shellHi });
const micPalette = (c: Colors<K>): Palette => ({ o: c.ink, W: c.white, w: c.whiteLo, f: c.gold, k: c.frillLo });

// ---- water, light and the far reef ----

const water = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(ditherGradient(f.w, f.h, [c.water0, c.water1, c.water2, c.water3]), 0, 0);
};

// The surface seen from below: a wobbling bright seam with flecks of light breaking through.
const surface = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  for (let x = 0; x < f.w; x += 2) {
    const y = Math.round(2 + Math.sin(x * 0.11 + f.t * 1.4) * 1.5 + Math.sin(x * 0.043 - f.t * 0.9) * 1.5);
    fillRect(ctx, c.ray, x, y, 2, 1);
    if ((x >> 1) % 5 === Math.floor(f.t * 3) % 5) fillRect(ctx, c.ray, x, y + 3, 1, 1);
  }
};

const SLANT = 0.32;

// A shaft of light from the surface: dense just under it, thinning out with depth.
const rayLayer = (h: number, width: number, color: string): HTMLCanvasElement =>
  memoLayer(`ob-ray:${color}`, width + Math.ceil(h * SLANT), h, (g) => {
    for (let y = 0; y < h; y++) fillDither(g, color, 0.42 * (1 - y / h) ** 1.5, Math.round(y * SLANT), y, width, 1);
  });

const rays = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const count = Math.max(3, Math.round(f.w / 70));
  for (let i = 0; i < count; i++) {
    const layer = rayLayer(l.stageY, 7 + Math.round(rand(i, 11) * 10), c.ray);
    const x = ((i + 0.3 + rand(i, 12) * 0.4) / count) * f.w - l.stageY * SLANT * 0.6 + Math.sin(f.t * 0.35 + i * 1.9) * 7;
    ctx.drawImage(layer, Math.round(x), 0);
  }
};

const reefLayer = (f: Frame, l: Layout, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`ob-reef:${c.far}:${c.water1}`, f.w, l.stageY + 2, (g) => {
    fillColumns(g, f.w, l.stageY + 2, mixHex(c.far, c.water1, 0.5), (x) => l.stageY - 34 - ridgeNoise(x / 30, 41) * 36);
    fillColumns(g, f.w, l.stageY + 2, c.far, (x) => l.stageY - 12 - ridgeNoise(x / 14, 43) * 24);
  });

const reef = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(reefLayer(f, layoutOf(f), c), 0, 0);
};

// A far-off school of small fish swims across the open water, rippling as it goes (and passing behind the shell).
const school = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const color = mixHex(c.water3, c.water1, 0.35);
  const lead = wrap(f.t * 9 + f.w * 0.5, f.w + 90) - 20;
  const y0 = f.h * (wide(f) ? 0.3 : 0.21);
  for (let i = 0; i < 16; i++) {
    const x = Math.round(lead - (i % 8) * 7 - (i >> 3) * 4);
    const y = Math.round(y0 + (i >> 3) * 6 + rand(i, 91) * 3 + Math.sin(f.t * 1.3 - x * 0.07) * 4);
    fillRect(ctx, color, x, y, 3, 1);
    fillRect(ctx, color, x - 1, y - 1, 1, 1);
    fillRect(ctx, color, x - 1, y + 1, 1, 1);
  }
};

// ---- the giant clam: its upper half opens behind the band like a fan, its lower half is the stage ----

/** A material's outline and three tones, as RGB for layers painted pixel by pixel. */
type Tones = { readonly ink: Rgb; readonly lo: Rgb; readonly mid: Rgb; readonly hi: Rgb };
const RIBS = 15;

// u runs −1…1 across the shell, v 0 (hinge) … 1 (top). The rim is scalloped at each rib; grooves run between ribs,
// a pearly sheen crosses the middle and the hinge is in shadow.
const shellRgb = (u: number, v: number, x: number, y: number, k: Tones): Rgb | null => {
  const r = Math.hypot(u, v);
  const q = frac((Math.atan2(v, u) / Math.PI) * RIBS);
  const edge = 1 - 0.045 * (1 - Math.sin(q * Math.PI));
  if (r > edge) return null;
  if (r > edge - 0.024) return k.ink;
  if (q < 0.1 || q > 0.93) return k.lo;
  const sheen = Math.abs(r - 0.66) < 0.09 ? 0.55 : q > 0.6 ? 0.3 : 0;
  if (sheen > bayer(x, y)) return k.hi;
  return r < 0.24 && bayer(x, y) < (0.24 - r) * 6 ? k.lo : k.mid;
};

const shellLayer = (l: Layout, c: Colors<K>): HTMLCanvasElement => {
  const w = l.shellRx * 2 + 1;
  const h = l.shellRy + 1;
  const k = { ink: hexToRgb(c.ink), lo: hexToRgb(c.shellLo), mid: hexToRgb(c.shell), hi: hexToRgb(c.shellHi) };
  return memoCanvas(`ob-shell:${w}x${h}:${c.ink}${c.shellLo}${c.shell}${c.shellHi}`, w, h, (img) => {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const rgb = shellRgb((x - l.shellRx) / l.shellRx, (h - 1 - y) / l.shellRy, x, y, k);
        if (rgb) setPixel(img, x, y, rgb);
      }
  });
};

const shell = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  ctx.drawImage(shellLayer(l, c), l.shellX - l.shellRx, l.stageY - l.shellRy);
};

// The stage: the lower half's rim seen from above as a pale ellipse, its ribbed front face below.
const paintStage = (g: Ctx, l: Layout, c: Colors<K>): void => {
  const sw = Math.round(l.shellRx * 0.97);
  for (let x = -sw; x <= sw; x++) {
    const e = Math.sqrt(1 - (x / (sw + 1)) ** 2);
    const back = Math.round(l.stageY - 5 * e);
    const front = Math.round(l.stageY + 4 * e);
    const rib = frac((x + sw) / 6);
    const bottom = front + Math.round(3 + 8 * e) + (rib > 0.3 && rib < 0.7 ? 1 : 0);
    const px = l.shellX + x;
    fillRect(g, c.ink, px, back - 1, 1, bottom - back + 2);
    fillRect(g, c.shellHi, px, back, 1, front - back);
    fillDither(g, c.shell, 0.3, px, back + 2, 1, front - back - 2);
    fillRect(g, rib < 0.34 ? c.shellLo : c.shell, px, front + 1, 1, bottom - front - 1);
  }
};

// On tall screens the drums sit on a mossy rock behind the singer, crusted with little round corals.
const paintRiser = (g: Ctx, l: Layout, c: Colors<K>): void => {
  if (l.stageY - l.kitY < 8) return;
  const half = 44;
  const rock = mixHex(c.far, c.shellLo, 0.55);
  for (let x = -half; x <= half; x++) {
    const corner = Math.max(0, Math.abs(x) - half + 7);
    const top = l.kitY - 2 + Math.round((corner * corner) / 6 + ridgeNoise(x / 4, 61) * 2);
    fillRect(g, c.ink, l.kitX + x, top, 1, l.stageY - top);
    fillRect(g, rock, l.kitX + x, top + 1, 1, l.stageY - top - 1);
    fillRect(g, c.weed, l.kitX + x, top + 1, 1, 2);
    fillDither(g, c.far, 0.3, l.kitX + x, top + 7, 1, l.stageY - top - 7);
  }
  const corals = [c.frill, c.octoHi, c.gold];
  for (let i = 0; i < 6; i++) {
    const x = l.kitX - half + 6 + i * 16 + Math.round(rand(i, 62) * 6);
    const y = l.kitY + 4 + Math.round(rand(i, 63) * (l.stageY - l.kitY - 12));
    disc(g, x, y, 3, () => c.ink);
    disc(g, x, y, 2, () => corals[i % 3] as string);
    fillRect(g, c.white, x - 1, y - 1, 1, 1);
  }
};

// Tube corals at both ends of the stage.
const tubes = (g: Ctx, x0: number, base: number, colors: readonly string[], ink: string): void => {
  for (let i = 0; i < 4; i++) {
    const h = 7 + ((i * 7) % 5) * 3;
    const x = x0 + i * 4 - 8;
    fillRect(g, ink, x - 1, base - h - 1, 5, h + 1);
    fillRect(g, colors[i % colors.length] as string, x, base - h, 3, h);
    fillRect(g, ink, x + 1, base - h, 1, 2);
  }
};

const stageLayer = (f: Frame, l: Layout, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(
    `ob-stage:${[l.stageY, l.kitX, l.kitY, l.shellX, l.shellRx].join(',')}:${[c.ink, c.shell, c.shellHi, c.shellLo, c.far, c.weed, c.weedLo, c.water3, c.frill, c.gold, c.octoHi, c.white].join('')}`,
    f.w,
    f.h,
    (g) => {
      paintRiser(g, l, c);
      paintStage(g, l, c);
      const sw = Math.round(l.shellRx * 0.97);
      tubes(g, l.shellX - sw + 6, l.stageY + 1, [c.frill, c.gold, c.octoHi], c.ink);
      tubes(g, l.shellX + sw - 6, l.stageY + 1, [c.octoHi, c.frill, c.gold], c.ink);
    },
  );

const stage = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(stageLayer(f, layoutOf(f), c), 0, 0);
};

// Pearls set along the stage's lip light up in a chase, two steps a beat.
const pearls = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const sw = Math.round(l.shellRx * 0.97);
  const n = Math.floor((sw * 2) / 12);
  const step = Math.floor(f.beat * 2);
  for (let i = 0; i < n; i++) {
    const x = Math.round(l.shellX - sw + (i + 0.5) * ((sw * 2) / n));
    const e = Math.sqrt(1 - ((x - l.shellX) / (sw + 1)) ** 2);
    const y = Math.round(l.stageY + 4 * e) + 4;
    if ((i + step) % 4 === 0) drawGlow(ctx, x, y, 6, c.pearl, 0.7);
    disc(ctx, x, y, 1, () => c.pearl);
    fillRect(ctx, c.white, x - 1, y - 1, 1, 1);
  }
};

// ---- jellyfish stage lights ----

type Jelly = { readonly x: number; readonly y: number; readonly r: number; readonly tx: number };

// Where each jellyfish hangs (share of width, share of height, radius) and whom its beam lights: 0 girl, 1 stage, 2 drums.
const WIDE_JELLIES = [
  [0.12, 0.2, 7, 0],
  [0.5, 0.1, 8, 1],
  [0.88, 0.24, 7, 2],
] as const;
const TALL_JELLIES = [
  [0.2, 0.09, 9, 0],
  [0.8, 0.16, 10, 2],
  [0.44, 0.27, 11, 1],
] as const;

const jelliesOf = (f: Frame, l: Layout): readonly Jelly[] =>
  (l.wide ? WIDE_JELLIES : TALL_JELLIES).map(([px, py, r, target], i) => ({
    x: Math.round(f.w * px + Math.sin(f.t * 0.37 + i * 2.1) * 5),
    y: Math.round(f.h * py + Math.sin(f.t * 0.8 + i * 1.3) * 3),
    r,
    tx: [l.girlX, l.shellX, l.kitX][target] as number,
  }));

// A soft cone of light from a jellyfish down to the stage.
const beam = (ctx: Ctx, j: Jelly, bottom: number, color: string, level: number): void => {
  const top = j.y + j.r;
  for (let y = top; y < bottom; y += 2) {
    const k = (y - top) / Math.max(1, bottom - top);
    const half = j.r * 0.7 + k * 15;
    fillDither(ctx, color, level * (1 - 0.35 * k), j.x + (j.tx - j.x) * k - half, y, half * 2, 2);
  }
};

// The bell squeezes on the beat (each jelly a little behind the last) and relaxes over the rest of it.
const pulseOf = (beat: number): number => {
  const p = frac(beat);
  return p < 0.15 ? p / 0.15 : Math.max(0, 1 - (p - 0.15) / 0.45);
};

const jellies = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const all = jelliesOf(f, l);
  const level = f.kick > 0.6 ? 0.25 : 0.16;
  for (const j of all) {
    beam(ctx, j, l.stageY, c.jellyHi, level);
    ovalGlow(ctx, c.jellyHi, j.tx, l.stageY, 17, 4, 0.5);
  }
  const colors = { rim: c.jellyRim, bell: c.jelly, hi: c.jellyHi, trail: c.jelly };
  all.forEach((j, i) => {
    drawGlow(ctx, j.x, j.y + Math.round(j.r * 0.5), j.r * 2 + 2, c.jelly, 0.45);
    drawJelly(ctx, f.t + i, j.x, j.y, j.r, colors, pulseOf(f.beat - i * 0.2));
  });
};

// ---- sea grass ----

// A ribbon of sea grass three pixels wide, lighter down its middle, bending more toward its pointed tip.
const ribbon = (ctx: Ctx, f: Frame, c: Colors<K>, x0: number, base: number, len: number, seed: number): void => {
  for (let j = 0; j < len; j++) {
    const k = j / len;
    const x = Math.round(x0 + Math.sin(f.t * 1.1 + seed * 1.7 - j * 0.07) * 5 * k * k);
    const w = j > len - 4 ? 1 : 3;
    fillRect(ctx, c.weedLo, x - (w >> 1), base - j, w, 1);
    if (w === 3 && j % 3 !== 0) fillRect(ctx, c.weed, x, base - j, 1, 1);
  }
};

const seaGrass = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const tufts = l.wide ? [0.02, 0.05, 0.08, 0.92, 0.95, 0.98] : [0.03, 0.08, 0.92, 0.97];
  tufts.forEach((px, i) => {
    const len = Math.round(f.h * (l.wide ? 0.38 : 0.22) * (0.75 + rand(i, 31) * 0.5));
    ribbon(ctx, f, c, Math.round(f.w * px), l.crowdY + 6, len, i);
  });
};

// ---- bubbles ----

const BUBBLES: readonly Sprite[] = [['o'], ['.o.', 'w.o', '.o.'], ['.oo.', 'ow.o', 'o..o', '.oo.']];

// Streams of bubbles rising from vents behind the stage, growing as they rise.
const vents = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const count = Math.max(3, Math.round(f.w / 60));
  const pal = paletteOf(c, 'ob-bubble', (k) => ({ o: k.bubble, w: k.white }));
  for (let v = 0; v < count; v++) {
    const vx = (v + 0.5 + (rand(v, 81) - 0.5) * 0.6) * (f.w / count);
    const rise = l.stageY * (0.6 + rand(v, 82) * 0.3);
    for (let k = 0; k < 6; k++) {
      const age = frac(f.t * (0.12 + rand(v, 83) * 0.08) + k / 6);
      const x = Math.round(vx + Math.sin(age * 10 + k * 2 + v) * (1 + age * 2));
      drawSprite(ctx, BUBBLES[Math.min(2, Math.floor(age * 3.2))] as Sprite, pal, x, Math.round(l.stageY + 6 - age * rise));
    }
  }
};

// ---- the octopus and its drums ----

const MANTLE_RX = 17;
const MANTLE_RY = 19;

const inMantle = (x: number, y: number): number => {
  const v = (y - MANTLE_RY) / MANTLE_RY;
  return Math.hypot((x - MANTLE_RX) / MANTLE_RX, v * (v > 0 ? 1.15 : 1));
};

// A round head lit from the upper left, shading dithered between its three tones.
const mantleRgb = (x: number, y: number, k: Tones): Rgb | null => {
  const d = inMantle(x, y);
  if (d > 1) return null;
  if (d > 1 - 1.4 / MANTLE_RX) return k.ink;
  const light = -0.55 * ((x - MANTLE_RX) / MANTLE_RX) - 0.65 * ((y - MANTLE_RY) / MANTLE_RY);
  if (light > 0.45 + bayer(x, y) * 0.25) return k.hi;
  if (light < -0.35 + bayer(x, y) * 0.3) return k.lo;
  return k.mid;
};

const mantleBody = (c: Colors<K>): HTMLCanvasElement => {
  const k = { ink: hexToRgb(c.ink), lo: hexToRgb(c.octoLo), mid: hexToRgb(c.octo), hi: hexToRgb(c.octoHi) };
  return memoCanvas(`ob-mantle:${c.ink}${c.octoLo}${c.octo}${c.octoHi}`, MANTLE_RX * 2 + 1, MANTLE_RY * 2 + 1, (img) => {
    for (let y = 0; y <= MANTLE_RY * 2; y++)
      for (let x = 0; x <= MANTLE_RX * 2; x++) {
        const rgb = mantleRgb(x, y, k);
        if (rgb) setPixel(img, x, y, rgb);
      }
  });
};

// Big glossy black eyes: o ink, g glint.
const OCTO_EYE: Sprite = ['.oooo.', 'oggooo', 'oggooo', 'oooooo', 'oooogo', 'oooooo', '.oooo.'];
const EYE_L = { x: MANTLE_RX - 9, y: MANTLE_RY - 4 } as const;
const EYE_R = { x: MANTLE_RX + 4, y: MANTLE_RY - 4 } as const;

// A drummer's sweatband round the head, a smile, blush and a few spots.
const paintOctoFace = (g: Ctx, c: Colors<K>): void => {
  for (let y = MANTLE_RY - 12; y <= MANTLE_RY - 9; y++)
    for (let x = 1; x < MANTLE_RX * 2; x++) {
      if (inMantle(x, y) > 1 - 1.4 / MANTLE_RX) continue;
      fillRect(g, y === MANTLE_RY - 11 ? c.frill : y === MANTLE_RY - 9 ? c.whiteLo : c.white, x, y, 1, 1);
    }
  const eye = { o: c.ink, g: c.white };
  drawSprite(g, OCTO_EYE, eye, EYE_L.x, EYE_L.y);
  drawSprite(g, OCTO_EYE, eye, EYE_R.x, EYE_R.y);
  fillRect(g, c.blush, EYE_L.x - 3, EYE_L.y + 7, 3, 1);
  fillRect(g, c.blush, EYE_R.x + 6, EYE_R.y + 7, 3, 1);
  for (const [dx, dy] of [
    [-2, 9],
    [-1, 10],
    [0, 9],
    [1, 10],
    [2, 9],
  ] as const)
    fillRect(g, c.ink, MANTLE_RX + dx, MANTLE_RY + dy - 3, 1, 1);
  disc(g, MANTLE_RX - 7, MANTLE_RY - 15, 2, () => c.octoHi);
  disc(g, MANTLE_RX + 5, MANTLE_RY - 16, 1, () => c.octoHi);
  disc(g, MANTLE_RX + 11, MANTLE_RY - 3, 1, () => c.octoLo);
};

const octoLayer = (c: Colors<K>): HTMLCanvasElement =>
  memoLayer(
    `ob-octo:${[c.ink, c.octo, c.octoHi, c.octoLo, c.white, c.whiteLo, c.frill, c.blush].join('')}`,
    MANTLE_RX * 2 + 1,
    MANTLE_RY * 2 + 1,
    (g) => {
      g.drawImage(mantleBody(c), 0, 0);
      paintOctoFace(g, c);
    },
  );

// Happy closed eyes (^ ^), for a blink or a big crash.
const happyEyes = (ctx: Ctx, x: number, y: number, c: Colors<K>): void => {
  for (const e of [EYE_L, EYE_R]) {
    fillRect(ctx, c.octo, x + e.x, y + e.y, 6, 7);
    for (let k = 0; k < 6; k++) fillRect(ctx, c.ink, x + e.x + k, y + e.y + 2 + Math.abs(k - 2.5) - 0.5, 1, 1);
  }
};

const bezier = (a: Point, b: Point, e: Point, s: number): Point => ({
  x: (1 - s) * (1 - s) * a.x + 2 * (1 - s) * s * b.x + s * s * e.x,
  y: (1 - s) * (1 - s) * a.y + 2 * (1 - s) * s * b.y + s * s * e.y,
});

// A tentacle along a curve from a to e, bending toward b: thick at the root, thin at the tip, suckers underneath.
const tentacle = (ctx: Ctx, a: Point, b: Point, e: Point, c: Colors<K>): void => {
  const n = Math.ceil(Math.hypot(e.x - a.x, e.y - a.y)) + 2;
  for (const pass of [0, 1]) {
    for (let k = 0; k <= n; k++) {
      const p = bezier(a, b, e, k / n);
      const w = Math.round(4 - (2.4 * k) / n) + (pass === 0 ? 2 : 0);
      fillRect(ctx, pass === 0 ? c.ink : c.octo, Math.round(p.x) - (w >> 1), Math.round(p.y) - (w >> 1), w, w);
    }
  }
  for (let k = 3; k < n - 2; k += 3) {
    const p = bezier(a, b, e, k / n);
    fillRect(ctx, c.octoHi, Math.round(p.x), Math.round(p.y) + 1, 1, 1);
  }
};

type Arm = { readonly base: number; readonly tx: number; readonly ty: number; readonly period: number; readonly offset: number };

// Six arms play (where each stick lands, from the bottom centre of the kit, and when, in beats); two more wave.
const ARMS: readonly Arm[] = [
  { base: -9, tx: -39, ty: -32, period: 0.5, offset: 0.5 },
  { base: -5, tx: -25, ty: -22, period: 2, offset: 1 },
  { base: -2, tx: -9, ty: -33, period: 4, offset: 0 },
  { base: 2, tx: 9, ty: -33, period: 4, offset: 2 },
  { base: 5, tx: 25, ty: -18, period: 4, offset: 3 },
  { base: 9, tx: 36, ty: -45, period: 8, offset: 0 },
];

// 0 the moment a stick lands, rising to 1 soon after and dropping back just before the next hit.
const liftOf = (beat: number, period: number, offset: number): number => {
  const dt = wrap(beat - offset, period);
  return Math.min(1, dt / 0.22, (period - dt) / 0.14);
};

const playingArm = (ctx: Ctx, f: Frame, c: Colors<K>, kit: Point, body: Point, arm: Arm): void => {
  const side = Math.sign(arm.tx) || 1;
  const lift = liftOf(f.beat, arm.period, arm.offset);
  const hand = { x: kit.x + arm.tx + side * (2 + Math.round(lift * 2)), y: kit.y + arm.ty - 6 - Math.round(lift * 9) };
  const root = { x: body.x + arm.base, y: body.y + MANTLE_RY - 3 };
  tentacle(ctx, root, { x: root.x + (hand.x - root.x) * 0.35, y: Math.max(root.y, hand.y) + 8 }, hand, c);
  pixelLine(ctx, hand.x, hand.y, hand.x - side * 2, hand.y + 6, c.whiteLo);
};

const idleArms = (ctx: Ctx, f: Frame, c: Colors<K>, body: Point): void => {
  const wave = Math.sin(f.beat * Math.PI);
  const left = { x: body.x - 31 + Math.round(wave * 4), y: body.y - 12 - Math.round(Math.abs(wave) * 2) };
  tentacle(ctx, { x: body.x - 12, y: body.y + 12 }, { x: body.x - 32, y: body.y + 14 }, left, c);
  const right = { x: body.x + 31 + Math.round(Math.sin(f.t * 1.7) * 2), y: body.y - 9 + Math.round(Math.sin(f.t * 1.7 + 1) * 3) };
  tentacle(ctx, { x: body.x + 12, y: body.y + 12 }, { x: body.x + 33, y: body.y + 16 }, right, c);
};

const KIT_W = 100;
const KIT_H = 52;

const drumBody = (g: Ctx, cx: number, top: number, w: number, h: number, c: Colors<K>): void => {
  const x = cx - (w >> 1);
  fillRect(g, c.ink, x - 1, top - 1, w + 2, h + 3);
  fillRect(g, c.drum, x, top + 1, w, h);
  fillRect(g, c.drumHi, x + 1, top + 2, 2, h - 2);
  fillRect(g, c.white, x, top, w, 1);
  fillRect(g, c.gold, x, top + 1, w, 1);
  fillRect(g, c.gold, x, top + h, w, 1);
};

const paintStands = (g: Ctx, ox: number, oy: number, c: Colors<K>): void => {
  for (const [x, top] of [
    [ox - 39, oy - 31],
    [ox + 36, oy - 44],
  ] as const) {
    fillRect(g, c.whiteLo, x, top, 1, oy - top);
    fillRect(g, c.whiteLo, x - 2, oy - 1, 5, 1);
  }
  pixelLine(g, ox - 25, oy - 15, ox - 28, oy - 1, c.whiteLo);
  pixelLine(g, ox - 25, oy - 15, ox - 22, oy - 1, c.whiteLo);
  pixelLine(g, ox + 20, oy - 6, ox + 19, oy - 1, c.whiteLo);
  pixelLine(g, ox + 30, oy - 6, ox + 31, oy - 1, c.whiteLo);
};

const paintBassDrum = (g: Ctx, ox: number, oy: number, c: Colors<K>): void => {
  const cy = oy - 14;
  disc(g, ox, cy, 13, () => c.ink);
  disc(g, ox, cy, 12, () => c.drum);
  disc(g, ox, cy, 10, (dy) => (dy < -6 ? c.whiteLo : c.white));
  for (let a = 0; a < 8; a++)
    fillRect(g, c.gold, Math.round(ox + Math.cos(a * 0.785) * 11), Math.round(cy + Math.sin(a * 0.785) * 11), 1, 1);
  drawSprite(g, SHELL, emblemPalette(c), ox - 3, cy - 3);
};

const kitLayer = (c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`ob-kit:${[c.ink, c.drum, c.drumHi, c.white, c.whiteLo, c.gold, c.shell, c.shellHi].join('')}`, KIT_W, KIT_H, (g) => {
    const ox = KIT_W >> 1;
    const oy = KIT_H - 1;
    paintStands(g, ox, oy, c);
    drumBody(g, ox + 25, oy - 17, 13, 11, c);
    paintBassDrum(g, ox, oy, c);
    drumBody(g, ox - 9, oy - 32, 11, 6, c);
    drumBody(g, ox + 9, oy - 32, 11, 6, c);
    drumBody(g, ox - 25, oy - 21, 13, 5, c);
  });

const cymbal = (ctx: Ctx, cx: number, y: number, w: number, c: Colors<K>): void => {
  const x = cx - (w >> 1);
  fillRect(ctx, c.ink, x - 1, y - 1, w + 2, 3);
  fillRect(ctx, c.ink, x + 2, y - 2, w - 4, 1);
  fillRect(ctx, c.gold, x, y, w, 1);
  fillRect(ctx, c.gold, x + 3, y - 1, w - 6, 1);
  fillRect(ctx, c.white, x + 2, y, 3, 1);
  fillRect(ctx, c.ink, cx, y - 3, 1, 2);
};

// The hi-hat opens between its off-beat taps; the crash shivers and sparkles after each hit; the bass drum thumps.
const cymbals = (ctx: Ctx, f: Frame, c: Colors<K>, kit: Point): void => {
  const open = liftOf(f.beat, 0.5, 0.5) > 0.5 ? 1 : 0;
  cymbal(ctx, kit.x - 39, kit.y - 30, 13, c);
  cymbal(ctx, kit.x - 39, kit.y - 32 - open, 13, c);
  const age = wrap(f.beat, 8);
  const shake = age < 1.2 ? Math.round(Math.sin(age * 22) * (1.2 - age) * 1.4) : 0;
  cymbal(ctx, kit.x + 36, kit.y - 43 + shake, 17, c);
  if (age < 0.6) twinkle(ctx, kit.x + 42, kit.y - 47, c.white, age < 0.3 ? 3 : 2);
  if (f.kick > 0.5) ring(ctx, kit.x, kit.y - 14, 10, 1, c.drumHi);
  if (f.kick > 0.15) ring(ctx, kit.x, kit.y - 14, 15 + Math.round((1 - f.kick) * 10), 0.8, c.jellyHi);
};

const octopus = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const kit = { x: l.kitX, y: l.kitY };
  const body = { x: l.kitX, y: l.kitY - 50 + (frac(f.beat) < 0.25 ? 1 : 0) };
  idleArms(ctx, f, c, body);
  ctx.drawImage(octoLayer(c), body.x - MANTLE_RX, body.y - MANTLE_RY);
  if (blinking(f.t, 13) || wrap(f.beat, 8) < 0.5) happyEyes(ctx, body.x - MANTLE_RX, body.y - MANTLE_RY, c);
  ctx.drawImage(kitLayer(c), kit.x - (KIT_W >> 1), kit.y - KIT_H + 1);
  cymbals(ctx, f, c, kit);
  for (const arm of ARMS) playingArm(ctx, f, c, kit, body, arm);
};

// ---- the singer ----

const TAIL_STEPS = 22;

// One pass of discs along the ponytail, `grow` pixels wider than its body and moved `shift` pixels down and right.
const tailPass = (ctx: Ctx, curve: readonly [Point, Point, Point], color: string, grow: number, shift: number): void => {
  for (let k = 0; k <= TAIL_STEPS; k++) {
    const s = k / TAIL_STEPS;
    const p = bezier(curve[0], curve[1], curve[2], s);
    const r = Math.round(1 + 3.4 * (1 - s) ** 0.8 * Math.min(1, 0.55 + s * 4));
    disc(ctx, Math.round(p.x) + shift, Math.round(p.y) + shift, r + grow, () => color);
  }
};

// Her high ponytail streams from the crown and sways in the current: outlined, shaded underneath, lit along its top.
const ponytail = (ctx: Ctx, f: Frame, c: Colors<K>, hx: number, hy: number): void => {
  const sway = Math.sin(f.t * 1.5) * 3 + Math.sin(f.t * 2.6 + 1) * 1.2;
  const curve = [
    { x: hx + 17, y: hy + 1 },
    { x: hx + 28 + sway * 0.4, y: hy - 13 },
    { x: hx + 32 + sway, y: hy + 30 },
  ] as const;
  tailPass(ctx, curve, c.ink, 1, 0);
  tailPass(ctx, curve, c.hairLo, 0, 0);
  tailPass(ctx, curve, c.hair, -1, -1);
  for (let k = 2; k < TAIL_STEPS * 0.6; k++) {
    const p = bezier(curve[0], curve[1], curve[2], k / TAIL_STEPS);
    fillRect(ctx, c.hairHi, Math.round(p.x) - 2, Math.round(p.y) - 2, 1, 1);
  }
};

// Her free arm points up for a bar, then waves out to the side for a bar.
const freeArm = (ctx: Ctx, f: Frame, c: Colors<K>, gx: number, gy: number): void => {
  if (alternate(f.beat, 4) === 0) {
    limb(ctx, gx + 23, gy + 28, gx + 28, gy + 14, 2, c.skin, c.ink);
    fillRect(ctx, c.ink, gx + 26, gy + 10, 5, 5);
    fillRect(ctx, c.skin, gx + 27, gy + 11, 3, 3);
    fillRect(ctx, c.ink, gx + 27, gy + 5, 3, 6);
    fillRect(ctx, c.skin, gx + 28, gy + 6, 1, 5);
    return;
  }
  const wave = alternate(f.beat) === 0 ? 0 : 1;
  limb(ctx, gx + 23, gy + 29, gx + 31, gy + 25 - wave, 2, c.skin, c.ink);
  fillRect(ctx, c.ink, gx + 30, gy + 19 - wave, 5, 7);
  fillRect(ctx, c.skin, gx + 31, gy + 20 - wave, 3, 5);
  fillRect(ctx, c.skinLo, gx + 32 + wave, gy + 20 - wave, 1, 2);
};

const micHand = (ctx: Ctx, c: Colors<K>, gx: number, gy: number): void => {
  limb(ctx, gx + 8, gy + 33, gx + 8, gy + 30, 2, c.skin, c.ink);
  drawSprite(ctx, MIC, paletteOf(c, 'ob-mic', micPalette), gx + 6, gy + 21);
  fillRect(ctx, c.ink, gx + 6, gy + 27, 5, 4);
  fillRect(ctx, c.skin, gx + 7, gy + 28, 3, 2);
};

const girlAt = (f: Frame): Point => {
  const l = layoutOf(f);
  return { x: l.girlX - 15, y: l.stageY + 2 - GIRL_H };
};

const singer = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const { x: gx, y: gy } = girlAt(f);
  const dip = frac(f.beat) < 0.25 ? 1 : 0;
  const hx = gx + (alternate(f.beat) === 0 ? -1 : 1);
  const hy = gy + dip;
  const pal = paletteOf(c, 'ob-girl', girlPalette);
  ponytail(ctx, f, c, hx, hy);
  freeArm(ctx, f, c, gx, gy + dip);
  drawSprite(ctx, LEGS, pal, gx, gy + HEAD.length + TORSO.length);
  drawSprite(ctx, TORSO, pal, gx, gy + HEAD.length + dip);
  drawGirl(ctx, f, HEAD, pal, hx, hy, GIRL);
  if (frac(f.beat) < 0.45) drawSprite(ctx, MOUTH_OPEN, pal, hx + 13, hy + 19);
  drawSprite(ctx, SHELL, paletteOf(c, 'ob-clip', clipPalette), hx + 16, hy - 3);
  micHand(ctx, c, gx, gy + dip);
};

// ---- notes ----

const NOTES: readonly Sprite[] = [
  ['..oo.', '..o.o', '..o..', '.oo..', 'ooo..', '.o...'],
  ['.oooo', '.o..o', '.o..o', 'oo.oo', 'oo.oo'],
];

// A note leaves the microphone on every beat and floats up and away, with a few bubbles from her song.
const song = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const { x: gx, y: gy } = girlAt(f);
  const pal = paletteOf(c, 'ob-note', (k) => ({ o: k.gold }));
  const bubbles = paletteOf(c, 'ob-bubble', (k) => ({ o: k.bubble, w: k.white }));
  recentBeats(f.beat, 4, (b, age) => {
    if (b < 0) return;
    const x = gx - 4 - age * 5 + Math.sin(age * 3 + b) * 2;
    const y = gy + 20 - age * 10;
    drawSprite(ctx, NOTES[b % 2] as Sprite, pal, Math.round(x), Math.round(y));
    drawSprite(ctx, BUBBLES[1] as Sprite, bubbles, Math.round(gx + 2 + Math.sin(age * 4 + b) * 2), Math.round(gy + 19 - age * 14));
  });
};

// ---- the crowd ----

// Round fish facing right, fin down and fin up: o outline, b body, B belly, x stripe, f fin, t tail, e eye, w glint,
// m mouth. The big ones stand at the front, the middle-sized behind them and the small ones at the back.
const FRONT_DOWN: Sprite = [
  '........oooooo........',
  '.....ooobbbbbbooo.....',
  '....obbbbxbbbbbbbbo...',
  'oo.obbbbbxbbbbbbbbbo..',
  'otoobbbbbxbbbbbbweebo.',
  'otbbbbbbbxbbbbbbeeebo.',
  'otbbbbbbbxbbbbbbbeebbo',
  'otbbbbfffxbbbbbbbbbbbo',
  'otoobbbffBBbbbbbbbmbbo',
  'oo.oBBBBBBBBBBBbbbbbo.',
  '....oBBBBBBBBBBBBbbo..',
  '.....oBBBBBBBBBBBbo...',
  '.......ooBBBBBBBoo....',
  '.........ooooooo......',
];
const FRONT_UP: Sprite = [
  '........oooooo........',
  '.....ooobbbbbbooo.....',
  '....obbbbxbbbbbbbbo...',
  'oo.obbfffxbbbbbbbbbo..',
  'otoobbbffxbbbbbbweebo.',
  'otbbbbbbbxbbbbbbeeebo.',
  'otbbbbbbbxbbbbbbbeebbo',
  'otbbbbbbbxbbbbbbbbbbbo',
  'otoobbbbbBBbbbbbbbmbbo',
  'oo.oBBBBBBBBBBBbbbbbo.',
  '....oBBBBBBBBBBBBbbo..',
  '.....oBBBBBBBBBBBbo...',
  '.......ooBBBBBBBoo....',
  '.........ooooooo......',
];
const MID_DOWN: Sprite = [
  '......ooooo.....',
  '....oobbxbboo...',
  'oo.obbbbxbbbbo..',
  'otoobbbbxbbweeo.',
  'otbbbbbbxbbeeeo.',
  'otbbbffbxbbbbbbo',
  'otoobbfffBbbbmbo',
  'oo.oBBBBBBBBbbo.',
  '....oBBBBBBBBo..',
  '.....ooooooo....',
];
const MID_UP: Sprite = [
  '......ooooo.....',
  '....oobbxbboo...',
  'oo.obfffxbbbbo..',
  'otoobbffxbbweeo.',
  'otbbbbbbxbbeeeo.',
  'otbbbbbbxbbbbbbo',
  'otoobBBBBBbbbmbo',
  'oo.oBBBBBBBBbbo.',
  '....oBBBBBBBBo..',
  '.....ooooooo....',
];
const BACK: Sprite = ['...oooo...', 'o.obbbbo..', 'oobbbbweo.', 'otbbbbbbbo', 'oobBBBBbo.', 'o.oBBBBo..', '...oooo...'];

type Rank = { readonly frames: readonly Sprite[]; readonly left: readonly Sprite[]; readonly pitch: number; readonly sticks: boolean };
const RANKS = {
  front: { frames: [FRONT_DOWN, FRONT_UP], left: [flipped(FRONT_DOWN), flipped(FRONT_UP)], pitch: 27, sticks: true },
  mid: { frames: [MID_DOWN, MID_UP], left: [flipped(MID_DOWN), flipped(MID_UP)], pitch: 19, sticks: true },
  back: { frames: [BACK], left: [flipped(BACK)], pitch: 12, sticks: false },
} as const satisfies Record<string, Rank>;

// The front row is backlit by the stage and darker; rows farther back sink into the blue of the water.
const fanPalette = (c: Colors<K>, species: number, shade: number): Palette =>
  paletteOf(c, `ob-fan${species}:${shade}`, (k) => {
    const body = [k.fishA, k.fishB, k.fishC][species] ?? k.fishA;
    const tone = (hex: string): string => (shade < 0 ? mixHex(hex, k.ink, 0.3) : mixHex(hex, k.water2, shade * 0.28));
    const stripe = [body, k.white, mixHex(body, k.ink, 0.3)][species] ?? body;
    return {
      o: tone(k.ink),
      b: tone(body),
      B: tone(mixHex(body, k.white, 0.55)),
      x: tone(stripe),
      f: tone(mixHex(body, k.ink, 0.3)),
      t: tone(mixHex(body, k.ink, 0.15)),
      e: tone(k.ink),
      w: tone(k.white),
      m: tone(k.mouth),
    };
  });

type Fan = {
  readonly x: number;
  readonly base: number;
  readonly rank: Rank;
  readonly shade: number;
  readonly seed: number;
  readonly right: boolean;
};

// A glow stick held up by the fin, swinging from side to side through each beat.
const glowStick = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, y: number, seed: number): void => {
  const a = Math.sin(f.beat * Math.PI + rand(seed, 6)) * 0.7;
  const tip = { x: Math.round(x + Math.sin(a) * 12), y: Math.round(y - Math.cos(a) * 12) };
  const color = [c.glow, c.frill, c.jelly, c.gold][Math.floor(rand(seed, 7) * 4)] ?? c.glow;
  drawGlow(ctx, Math.round(x * 0.4 + tip.x * 0.6), Math.round(y * 0.4 + tip.y * 0.6), 9, color, 0.5);
  pixelLine(ctx, x - 1, y, tip.x - 1, tip.y, color);
  pixelLine(ctx, x + 1, y, tip.x + 1, tip.y, color);
  pixelLine(ctx, x, y, tip.x, tip.y, c.white);
};

// One fan hops on the beat and flaps a fin; some hold up a glow stick.
const drawFan = (ctx: Ctx, f: Frame, c: Colors<K>, fan: Fan): void => {
  const frames = fan.right ? fan.rank.frames : fan.rank.left;
  const sprite = frames[alternate(f.beat + rand(fan.seed, 4) * 0.5) % frames.length] as Sprite;
  const phase = frac(f.beat + rand(fan.seed, 3) * 0.25);
  const hop = phase < 0.3 ? 2 : phase < 0.5 ? 1 : 0;
  const w = (sprite[0] ?? '').length;
  const x = fan.x - (w >> 1);
  const y = fan.base - sprite.length - hop;
  if (fan.rank.sticks && rand(fan.seed, 5) < 0.4) glowStick(ctx, f, c, x + (fan.right ? w >> 1 : (w >> 1) - 1), y + 3, fan.seed);
  drawSprite(ctx, sprite, fanPalette(c, Math.floor(rand(fan.seed, 8) * 3), fan.shade), x, y);
};

const crowdRow = (
  ctx: Ctx,
  f: Frame,
  c: Colors<K>,
  row: { readonly rank: Rank; readonly base: number; readonly shade: number; readonly seed: number },
): void => {
  const center = layoutOf(f).shellX;
  const pitch = row.rank.pitch;
  for (let i = 0; i * pitch < f.w + pitch; i++) {
    const seed = i * 13 + row.seed;
    if (rand(seed, 9) < 0.12) continue;
    const x = Math.round((i + (row.seed % 2) * 0.5) * pitch + (rand(seed, 10) - 0.5) * pitch * 0.4);
    const right = x < center !== rand(seed, 11) < 0.15;
    drawFan(ctx, f, c, { x, base: row.base + Math.round(rand(seed, 12) * 3), rank: row.rank, shade: row.shade, seed, right });
  }
};

// Rows of fans from the back to the front; tall screens have room for more of them.
const crowd = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const top = layoutOf(f).crowdY;
  const rows =
    f.h - top > 70
      ? [
          { rank: RANKS.back, base: top + 8, shade: 2, seed: 1 },
          { rank: RANKS.back, base: top + 19, shade: 1, seed: 2 },
          { rank: RANKS.mid, base: top + 36, shade: 1, seed: 3 },
          { rank: RANKS.mid, base: top + 56, shade: 0, seed: 5 },
        ]
      : [
          { rank: RANKS.back, base: top + 8, shade: 1, seed: 1 },
          { rank: RANKS.mid, base: top + 21, shade: 0, seed: 3 },
        ];
  for (const row of rows) crowdRow(ctx, f, c, row);
  crowdRow(ctx, f, c, { rank: RANKS.front, base: f.h + 4, shade: -1, seed: 4 });
};

export const octopusBand = defineScene<K>({
  id: 'octopus-band',
  title: 'Deep Sea Band',
  mood: { valence: 0.6, energy: 0.6 },
  styles: ['nineties-pop', 'puzzle-pop', 'summer-festival', 'neon-rush', 'eurobeat', 'island-breeze', 'fm-funk'],
  variants: [
    {
      mood: { valence: 0.6, energy: 0.6 },
      colors: {
        water0: '#c4f4ea',
        water1: '#55c8d6',
        water2: '#2584b8',
        water3: '#164a8a',
        ray: '#eafff8',
        far: '#2e6fa0',
        shell: '#a99cf0',
        shellHi: '#d8d0ff',
        shellLo: '#7564c8',
        pearl: '#fff8ec',
        weed: '#46c27a',
        weedLo: '#23806a',
        ink: '#1c1640',
        skin: '#ffe4d4',
        skinLo: '#f2b6a6',
        blush: '#ff80a6',
        mouth: '#a8264e',
        hair: '#ff9a78',
        hairHi: '#ffd6b2',
        hairLo: '#d85a66',
        iris: '#5a3ad0',
        white: '#fffaf6',
        whiteLo: '#cdd6f2',
        frill: '#30cfc4',
        frillLo: '#17858f',
        gold: '#ffd046',
        octo: '#d84a9e',
        octoHi: '#ff92cf',
        octoLo: '#8c2474',
        drum: '#2b56d0',
        drumHi: '#7aa0ff',
        fishA: '#ffd43e',
        fishB: '#ff8c42',
        fishC: '#60b0ff',
        glow: '#b4ff5a',
        jelly: '#efb0ff',
        jellyHi: '#fff2ff',
        jellyRim: '#9a5ad2',
        bubble: '#e6fffb',
      },
    },
    {
      mood: { valence: 0.2, energy: 0.7 },
      colors: {
        water0: '#46307e',
        water1: '#2a1b60',
        water2: '#170f40',
        water3: '#0b0724',
        ray: '#6a52b8',
        far: '#24185a',
        shell: '#5c2c9c',
        shellHi: '#9060d8',
        shellLo: '#381a6e',
        pearl: '#fff0ff',
        weed: '#2a8a8a',
        weedLo: '#164c5c',
        ink: '#0d0822',
        skin: '#ffe2d8',
        skinLo: '#e4a8b4',
        blush: '#ff70aa',
        mouth: '#a01e50',
        hair: '#ff9674',
        hairHi: '#ffd4ae',
        hairLo: '#d04e66',
        iris: '#9c5cff',
        white: '#fff6ff',
        whiteLo: '#c4b4ee',
        frill: '#2ee4d4',
        frillLo: '#1696a4',
        gold: '#ffd84c',
        octo: '#e84ab4',
        octoHi: '#ff9ce4',
        octoLo: '#8a1c7a',
        drum: '#20d0c0',
        drumHi: '#9cfff0',
        fishA: '#ffe24a',
        fishB: '#ff7860',
        fishC: '#4cc8ff',
        glow: '#80ff4c',
        jelly: '#5ae6ff',
        jellyHi: '#e2ffff',
        jellyRim: '#2a74b8',
        bubble: '#a8b4ff',
      },
    },
    {
      mood: { valence: 0.5, energy: 0.2 },
      colors: {
        water0: '#ffe4a4',
        water1: '#f2aa7c',
        water2: '#8a78b8',
        water3: '#40407c',
        ray: '#fff6d0',
        far: '#6c5c9c',
        shell: '#c8a2e2',
        shellHi: '#f2dcff',
        shellLo: '#9070b8',
        pearl: '#fffaf0',
        weed: '#62a26e',
        weedLo: '#3c6c5e',
        ink: '#2a1a3c',
        skin: '#ffe6d2',
        skinLo: '#f0b29a',
        blush: '#ff7c8c',
        mouth: '#a82e48',
        hair: '#f88468',
        hairHi: '#ffcca6',
        hairLo: '#b8405c',
        iris: '#6a3cc0',
        white: '#fffaf2',
        whiteLo: '#e2cad0',
        frill: '#36c2bc',
        frillLo: '#1c7e8c',
        gold: '#ffd25c',
        octo: '#cc4a9c',
        octoHi: '#ff92c2',
        octoLo: '#7c2a6c',
        drum: '#3c6cd2',
        drumHi: '#84aaff',
        fishA: '#ffd84c',
        fishB: '#ff9c5c',
        fishC: '#5cb8e2',
        glow: '#ffff7c',
        jelly: '#ffc2da',
        jellyHi: '#fff6fa',
        jellyRim: '#c8729c',
        bubble: '#fff2e2',
      },
    },
  ],
  layers: [water, surface, rays, reef, school, shell, vents, jellies, seaGrass, stage, octopus, pearls, singer, song, crowd],
});
