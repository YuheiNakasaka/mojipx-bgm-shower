// A river winding toward the viewer under a little arched bridge, blossom trees on its banks,
// petals drifting on the wind and floating downstream, and the bridge's reflection wavering in the water.
import { type Ctx, fillRect } from 'mojipx';
import { bayer, ditherGradient, fillColumns, frac, hexToRgb, noise1, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { colorKey, ditherStyle, driftingClouds, memoLayer, memoPixels, setPixel, spanDisc, wrap } from './batch-1-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'cloud'
  | 'cloudShade'
  | 'hillFar'
  | 'hill'
  | 'grass'
  | 'grassDark'
  | 'water'
  | 'waterDark'
  | 'ripple'
  | 'bridge'
  | 'bridgeShade'
  | 'blossom'
  | 'petal'
  | 'blossomLight'
  | 'trunk';

const unitOf = (f: Frame): number => Math.min(f.w, f.h);
const horizonOf = (f: Frame): number => Math.round(f.h * 0.42 - (f.h - unitOf(f)) * 0.05);

// The river: its centre line sways gently and it widens toward the viewer (d = 0 at the horizon, 1 at the bottom).
const depthOf = (f: Frame, y: number): number => (y - horizonOf(f)) / Math.max(1, f.h - horizonOf(f));
const riverX = (f: Frame, y: number): number => f.w / 2 + Math.sin(depthOf(f, y) * 5.2 + 0.6) * unitOf(f) * 0.14 * (0.3 + depthOf(f, y));
const riverHalf = (f: Frame, y: number): number => f.w * (0.02 + 0.46 * depthOf(f, y) ** 1.35);

type Bridge = { readonly x: number; readonly y: number; readonly span: number; readonly arch: number };

const bridgeOf = (f: Frame): Bridge => {
  const y = Math.round(horizonOf(f) + 0.36 * (f.h - horizonOf(f)));
  const span = Math.round(riverHalf(f, y) * 2 + 14);
  return { x: Math.round(riverX(f, y)), y, span, arch: Math.round(span * 0.2) };
};

const sky = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const hz = horizonOf(f);
  ctx.drawImage(ditherGradient(f.w, hz, [c.sky0, c.sky1, c.sky1]), 0, 0);
  const u = unitOf(f);
  const opts = { top: hz * 0.25, span: hz * 0.55, size: u * 0.07, speed: 3 + f.energy * 2 };
  driftingClouds(ctx, f, c.cloud, c.cloudShade, { ...opts, count: Math.max(3, Math.round((f.w * hz) / 8000)), seed: 101 });
};

const paintHills = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const hz = horizonOf(f);
  const u = unitOf(f);
  fillColumns(g, f.w, hz, c.hillFar, (x) => hz - u * (0.06 + 0.12 * noise1(x / 55, 102)));
  fillColumns(g, f.w, hz, c.hill, (x) => hz - u * (0.02 + 0.05 * noise1(x / 30, 103)));
  // Blossom trees dotted along the far banks.
  for (let i = 0, x = 2; x < f.w; i++, x += 4 + rand(i, 104) * 8) {
    const top = hz - u * (0.02 + 0.05 * noise1(x / 30, 103));
    g.fillStyle = i % 3 === 0 ? c.blossomLight : c.blossom;
    spanDisc(g, x, top, 1 + Math.floor(rand(i, 105) * 2.5));
  }
};

const paintBanks = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const hz = horizonOf(f);
  g.drawImage(ditherGradient(f.w, f.h - hz, [c.hill, c.grass, c.grass]), 0, hz);
  const water = hexToRgb(c.water);
  const deep = hexToRgb(c.waterDark);
  const img = g.getImageData(0, hz, f.w, f.h - hz);
  for (let y = hz; y < f.h; y++) {
    const cx = riverX(f, y);
    const half = riverHalf(f, y);
    const d = depthOf(f, y);
    for (let x = Math.max(0, Math.floor(cx - half)); x < Math.min(f.w, Math.ceil(cx + half)); x++) {
      setPixel(img, x, y - hz, d * 1.1 > bayer(x, y) + 0.15 ? deep : water);
    }
  }
  g.putImageData(img, 0, hz);
};

// Grassy lips along both banks, thicker toward the viewer.
const paintEdges = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const hz = horizonOf(f);
  for (let y = hz; y < f.h; y++) {
    const cx = riverX(f, y);
    const half = riverHalf(f, y);
    const lip = 1 + Math.round(depthOf(f, y) * 3);
    fillRect(g, c.grassDark, Math.round(cx - half) - lip, y, lip, 1);
    fillRect(g, c.grassDark, Math.round(cx + half), y, lip, 1);
  }
};

// Tufts of grass and fallen petals on the banks, sparser in the distance.
const paintMeadow = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const hz = horizonOf(f);
  for (let i = 0; i < (f.w * (f.h - hz)) / 40; i++) {
    const y = Math.round(hz + 3 + rand(i, 150) ** 0.7 * (f.h - hz - 3));
    const x = Math.round(rand(i, 151) * f.w);
    if (Math.abs(x - riverX(f, y)) < riverHalf(f, y) + 4) continue;
    const near = depthOf(f, y) > 0.4;
    fillRect(g, i % 4 === 0 ? c.petal : c.grassDark, x, y, near && i % 4 !== 0 ? 1 : 1 + (i % 2), near && i % 4 !== 0 ? 2 : 1);
  }
};

const backdrop = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const layer = memoLayer(`pr-back:${f.w}x${f.h}:${colorKey(c)}`, f.w, f.h, (g) => {
    paintHills(g, f, c);
    paintBanks(g, f, c);
    paintEdges(g, f, c);
    paintMeadow(g, f, c);
    paintGrove(g, f, c);
  });
  ctx.drawImage(layer, 0, 0);
};

// The bridge drawn in its own small canvas: a humped deck on slender posts, with a railing.
const deckAt = (b: Bridge, dx: number): number => {
  const k = Math.min(1, Math.abs(dx) / (b.span / 2));
  return -3 - Math.round(b.arch * (1 - k * k));
};

const paintBridgeColumn = (g: Ctx, b: Bridge, c: Colors<K>, x: number, dx: number, base: number): void => {
  const deck = base + deckAt(b, dx);
  fillRect(g, c.bridge, x, deck, 1, 3);
  fillRect(g, c.bridgeShade, x, deck + 3, 1, 1);
  fillRect(g, c.bridge, x, deck - 5, 1, 1);
  const post = Math.abs(dx) % 5 === 0;
  if (post) fillRect(g, c.bridge, x, deck - 5, 1, 5);
  if (post) fillRect(g, c.blossomLight, x, deck - 6, 1, 1);
  const pillar = Math.abs(Math.abs(dx) - Math.round(b.span * 0.47)) <= 1 || Math.abs(Math.abs(dx) - Math.round(b.span * 0.25)) === 0;
  if (pillar) fillRect(g, c.bridgeShade, x, deck + 4, 1, base - deck - 3);
};

const bridgeImage = (f: Frame, c: Colors<K>): HTMLCanvasElement => {
  const b = bridgeOf(f);
  const w = b.span + 2;
  const h = b.arch + 12;
  return memoLayer(`pr-bridge:${f.w}x${f.h}:${colorKey(c)}`, w, h, (g) => {
    for (let x = 0; x < w; x++) paintBridgeColumn(g, b, c, x, Math.round(x - w / 2), h - 1);
  });
};

// The reflection: the bridge flipped under the water line, darkened, each row shifted by the ripples.
const reflection = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const b = bridgeOf(f);
  const img = bridgeImage(f, c);
  const dark = memoLayer(`pr-refl:${f.w}x${f.h}:${colorKey(c)}`, img.width, img.height, (g) => {
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = c.waterDark;
    g.fillRect(0, 0, img.width, img.height);
    g.globalCompositeOperation = 'destination-in';
    g.fillStyle = ditherStyle(g, '#000000', 0.5) ?? '#000000';
    g.fillRect(0, 0, img.width, img.height);
  });
  for (let r = 0; r < img.height - 2; r++) {
    const wobble = Math.round(Math.sin(r * 0.8 + f.t * 2.5) * (0.6 + r * 0.04));
    ctx.drawImage(dark, 0, img.height - 1 - r, img.width, 1, b.x - img.width / 2 + wobble, b.y + r, img.width, 1);
  }
};

const bridge = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const b = bridgeOf(f);
  const img = bridgeImage(f, c);
  ctx.drawImage(img, b.x - Math.round(img.width / 2), b.y - img.height + 1);
};

// Ripples and petals carried downstream, speeding up as they come closer.
const floater = (ctx: Ctx, f: Frame, c: Colors<K>, i: number): void => {
  const p = frac(f.t * (0.035 + 0.03 * rand(i, 110)) + rand(i, 111));
  const hz = horizonOf(f);
  const y = Math.round(hz + 2 + p ** 1.6 * (f.h - hz));
  const d = depthOf(f, y);
  const x = riverX(f, y) + (rand(i, 112) * 2 - 1) * riverHalf(f, y) * 0.85;
  const petal = i % 4 === 0;
  const len = petal ? 1 + Math.round(d) : 1 + Math.round(d * 6 * rand(i, 113));
  fillRect(ctx, petal ? c.petal : c.ripple, Math.round(x), y, len, 1);
};

const river = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const count = Math.round(40 + f.w * 0.15);
  for (let i = 0; i < count; i++) floater(ctx, f, c, i);
};

type Rgb = readonly [number, number, number];

const stamp = (img: ImageData, x: number, y: number, r: number, rgb: Rgb): void => {
  for (let dy = -Math.ceil(r); dy <= r; dy++)
    for (let dx = -Math.ceil(r); dx <= r; dx++) {
      const px = Math.round(x + dx);
      const py = Math.round(y + dy);
      if (dx * dx + dy * dy <= r * r + 0.3 && px >= 0 && py >= 0 && px < img.width && py < img.height) setPixel(img, px, py, rgb);
    }
};

// A limb from (x0, y0) to (x1, y1), tapering from radius r0 to r1.
const limb = (img: ImageData, from: readonly [number, number, number], to: readonly [number, number, number], rgb: Rgb): void => {
  const steps = Math.ceil(Math.hypot(to[0] - from[0], to[1] - from[1]));
  for (let s = 0; s <= steps; s++) {
    const k = s / Math.max(1, steps);
    stamp(img, from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k, from[2] + (to[2] - from[2]) * k, rgb);
  }
};

const paintBlossoms = (img: ImageData, w: number, h: number, c: Colors<K>, seed: number): void => {
  const tones = [hexToRgb(c.blossomLight), hexToRgb(c.petal), hexToRgb(c.blossom)];
  const puffs = Array.from({ length: 14 }, (_, k) => ({
    x: w * (0.12 + 0.76 * rand(k, seed)),
    y: h * (0.1 + 0.32 * rand(k, seed + 1)),
    r: w * (0.08 + 0.07 * rand(k, seed + 2)),
  }));
  for (let y = 0; y < h * 0.62; y++)
    for (let x = 0; x < w; x++) {
      const hit = puffs.find((p) => Math.hypot(x - p.x, y - p.y) <= p.r);
      if (!hit) continue;
      const shade = (x - hit.x) * 0.5 + (y - hit.y) * 1.2;
      const tone = shade < -hit.r * (0.5 - bayer(x, y) * 0.4) ? 0 : shade > hit.r * (0.35 + bayer(x, y) * 0.5) ? 2 : 1;
      setPixel(img, x, y, tones[tone] as Rgb);
    }
};

// A blossom tree: a tapering trunk forking into limbs under clusters of blossom; cached per size and side.
const treeImage = (u: number, c: Colors<K>, side: -1 | 1): HTMLCanvasElement => {
  const w = Math.round(u * 0.62);
  const h = Math.round(u * 0.78);
  return memoPixels(`pr-tree:${w}:${side}:${colorKey(c)}`, w, h, (img) => {
    const bark = hexToRgb(c.trunk);
    const lean = side * w * 0.08;
    const fork: [number, number, number] = [w * 0.5 + lean, h * 0.5, u * 0.018];
    limb(img, [w * 0.5, h, u * 0.03], fork, bark);
    limb(img, fork, [w * 0.18, h * 0.24, u * 0.008], bark);
    limb(img, fork, [w * 0.84, h * 0.2, u * 0.008], bark);
    limb(img, fork, [w * 0.52 + lean * 2, h * 0.12, u * 0.008], bark);
    paintBlossoms(img, w, h, c, side < 0 ? 120 : 130);
  });
};

// Smaller blossom trees along both banks, between the hills and the bridge.
const paintGrove = (g: Ctx, f: Frame, c: Colors<K>): void => {
  const hz = horizonOf(f);
  const u = unitOf(f);
  [0.05, 0.12, 0.2, 0.29].forEach((d, k) => {
    const y = Math.round(hz + d * (f.h - hz));
    const img = treeImage(u * (0.16 + 0.6 * d), c, k % 2 === 0 ? -1 : 1);
    for (const side of [-1, 1]) {
      const reach = riverHalf(f, y) + img.width * (0.45 + rand(k, side + 160) * 0.9);
      g.drawImage(img, Math.round(riverX(f, y) + side * reach - img.width / 2), y - img.height + 1);
    }
  });
};

const blossomTree = (ctx: Ctx, f: Frame, c: Colors<K>, side: -1 | 1): void => {
  const u = unitOf(f);
  const img = treeImage(u, c, side);
  const x = side < 0 ? Math.round(f.w * 0.07 - img.width / 2) : Math.round(f.w * 0.93 - img.width / 2);
  const y = f.h - img.height + Math.round(u * 0.04);
  const sway = Math.sin(f.beat * Math.PI + (side < 0 ? 0 : 1.3)) * (0.7 + f.energy * 1.3);
  const third = Math.ceil(img.height / 3);
  for (let k = 0; k < 3; k++) {
    ctx.drawImage(img, 0, k * third, img.width, third, Math.round(x + sway * (1 - k / 2)), y + k * third, img.width, third);
  }
};

const trees = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  blossomTree(ctx, f, c, -1);
  blossomTree(ctx, f, c, 1);
};

// A petal tumbling on the wind; its shape flips with the beat as it turns over.
const petal = (ctx: Ctx, f: Frame, c: Colors<K>, i: number): void => {
  const spanX = f.w + 20;
  const spanY = f.h + 20;
  const vx = 9 + 8 * rand(i, 140) + f.energy * 6;
  const vy = 7 + 6 * rand(i, 141);
  const x = wrap(rand(i, 142) * spanX + f.t * vx + Math.sin(f.t * 1.1 + i) * 6, spanX) - 10;
  const y = wrap(rand(i, 143) * spanY + f.t * vy + Math.sin(f.t * 2.3 + i * 1.7) * 2, spanY) - 10;
  const turn = frac(f.beat / 2 + rand(i, 144));
  const color = i % 3 === 0 ? c.blossomLight : c.petal;
  if (turn < 0.5) fillRect(ctx, color, Math.round(x), Math.round(y), 2, 1);
  else if (turn < 0.75) fillRect(ctx, color, Math.round(x), Math.round(y), 1, 1);
  else fillRect(ctx, color, Math.round(x), Math.round(y), 1, 2);
};

const petals = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const count = Math.round((f.w * f.h) / 900 + f.energy * 20);
  for (let i = 0; i < count; i++) petal(ctx, f, c, i);
};

export const petalRiver = defineScene<K>({
  id: 'petal-river',
  title: 'Petal River',
  mood: { valence: 0.4, energy: 0 },
  styles: ['nineties-pop', 'town-waltz', 'summer-festival', 'showa-ballad', 'kawaii-pop'],
  variants: [
    {
      mood: { valence: 0.6, energy: 0.15 },
      colors: {
        sky0: '#78bcea',
        sky1: '#d8eef8',
        cloud: '#ffffff',
        cloudShade: '#d6e4f4',
        hillFar: '#a6c6dc',
        hill: '#84b688',
        grass: '#9ccc6c',
        grassDark: '#5c9656',
        water: '#8cd2ea',
        waterDark: '#3e84b2',
        ripple: '#eefaff',
        bridge: '#d64a40',
        bridgeShade: '#86283a',
        blossom: '#e486aa',
        petal: '#f8b6ce',
        blossomLight: '#ffe2ee',
        trunk: '#5a3842',
      },
    },
    {
      mood: { valence: 0.2, energy: -0.15 },
      colors: {
        sky0: '#4a4a8e',
        sky1: '#f6aa8a',
        cloud: '#ffd2b6',
        cloudShade: '#c88aa6',
        hillFar: '#9a7aa6',
        hill: '#6c7a76',
        grass: '#8c9a62',
        grassDark: '#4e6450',
        water: '#d09aae',
        waterDark: '#4c4a84',
        ripple: '#ffe8d8',
        bridge: '#cc4440',
        bridgeShade: '#682236',
        blossom: '#d87ea6',
        petal: '#f6aac6',
        blossomLight: '#ffd2e2',
        trunk: '#3e2a3a',
      },
    },
  ],
  layers: [sky, backdrop, reflection, river, bridge, trees, petals],
});
