// The world map of a game that never existed: three tiny heroes walk a road past forests, peaks and a castle while the
// sea laps the shore, a ship sails by and an airship's shadow slides over the land; after dark the towns light up.
import { type Ctx, drawSpriteFoot, type Palette, type Sprite } from 'mojipx';
import { bayer, frac, hexToRgb, memoCanvas, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { ditherStyle, drawGlow, wrap } from './batch-1-helpers.ts';
import { paletteOf, sigOf } from './batch-3-helpers.ts';
import { fractal2, memoLayer, noise2, tinted } from './batch-4-helpers.ts';

type K =
  | 'deep'
  | 'sea'
  | 'shallow'
  | 'foam'
  | 'sand'
  | 'grass'
  | 'grassLo'
  | 'forest'
  | 'forestLo'
  | 'rock'
  | 'rockLo'
  | 'snow'
  | 'road'
  | 'roof'
  | 'roofHi'
  | 'wall'
  | 'wallLo'
  | 'window'
  | 'shadow'
  | 'tint'
  | 'ink';

// ---- sprites ----

const HERO_A: Sprite = [
  '..oooo....',
  '.ohhhhoo..',
  'ohhHhhhho.',
  'ohhhhssso.',
  '.ohhsseso.',
  '.oossssoo.',
  'occcaaaao.',
  'occcaAaaso',
  '.occaaaoo.',
  '..obbbbo..',
  '..ob..bo..',
  '..oo..oo..',
];
const HERO_B: Sprite = [
  '..oooo....',
  '.ohhhhoo..',
  'ohhHhhhho.',
  'ohhhhssso.',
  '.ohhsseso.',
  '.oossssoo.',
  'occcaaaao.',
  'occcaAaao.',
  '.occaaaso.',
  '..obbbbo..',
  '...obbo...',
  '...oooo...',
];
const MAGE_A: Sprite = [
  '....oo....',
  '...otto...',
  '..otTtto..',
  '.oooooooo.',
  '.ohhhhsso.',
  '.ohhhseso.',
  '.ohhhssso.',
  '.ohoccco..',
  'ohhcccccso',
  '.occcccco.',
  '..occcco..',
  '..oo..oo..',
];
const MAGE_B: Sprite = [
  '....oo....',
  '...otto...',
  '..otTtto..',
  '.oooooooo.',
  '.ohhhhsso.',
  '.ohhhseso.',
  '.ohhhssso.',
  '.ohoccco..',
  'ohhccccco.',
  '.occccsco.',
  '..occcco..',
  '...oooo...',
];
const HEAL_A: Sprite = [
  '...oooo...',
  '..ollllo..',
  '.olLllllo.',
  '.olhhssso.',
  '.olhseseo.',
  '.olssssso.',
  '.ollllllo.',
  'olLlllllso',
  'ollllllllo',
  '.ollllllo.',
  '..oo..oo..',
];
const HEAL_B: Sprite = [
  '...oooo...',
  '..ollllo..',
  '.olLllllo.',
  '.olhhssso.',
  '.olhseseo.',
  '.olssssso.',
  '.ollllllo.',
  'olLllllllo',
  'olllllllso',
  '.ollllllo.',
  '...oooo...',
];
const SHIP: Sprite = [
  '........o.........',
  '........oRR.......',
  '........oR........',
  '.....ooooooooo....',
  '....owwwwwwwwWo...',
  '....owwwwwwwwWo...',
  '...owwwwwwwwwWWo..',
  '...owwwwwwwwwWWo..',
  '....ooooooooooo...',
  '........o.........',
  'oooooooooooooooooo',
  '.oyyyyyyyyyyyyyyo.',
  '..oyYyYyYyYyYyyo..',
  '...oooooooooooo...',
];
const CASTLE: Sprite = [
  '............oR...........',
  '............oRR..........',
  '...o........o........o...',
  '..oro......ooo......oro..',
  '.orRro....orRro....orRro.',
  '.orrRo...orrrRro...orrRo.',
  'orrrrRo.orrrrRro..orrrrRo',
  'ooooooo.oooooooo..ooooooo',
  '.owwWo...owwwwWo...owwWo.',
  '.owwWo...owkkkWo...owwWo.',
  '.okwWo...owwwwWo...okwWo.',
  '.owwWo...owwwwWo...owwWo.',
  '.owwWo.o.owwwwWo.o.owwWo.',
  '.owwWooooooooooooooowwWo.',
  '.owwWowwwwwwwwwwwwwowwWo.',
  '.owwWowwwwwwwwwwwwwowwWo.',
  '.owwWowwkwooooowkwwowwWo.',
  '.owwWowwwwodddowwwwowwWo.',
  '.owwWowwwwodddowwwwowwWo.',
  '.owwWowwwwodddowwwwowwWo.',
  '.owwWowwwwodddowwwwowwWo.',
  '.ooooooooooooooooooooooo.',
];

// o outline, S snow, s snow shade, r rock, R rock shade.
const PEAK: Sprite = [
  '.....o.....',
  '....oSo....',
  '...oSSso...',
  '..orSssRo..',
  '..orrrRRo..',
  '.orrrrRRRo.',
  '.orrrrRRRo.',
  'orrrrrRRRRo',
];
const HILL: Sprite = PEAK.map((row) => row.replace(/S/g, 'r').replace(/s/g, 'R'));

// o outline, F leaves, f shaded leaves, t trunk.
const TREE: Sprite = ['.ooo.', 'oFFfo', 'oFffo', 'offfo', '.ooo.', '..t..'];

// o outline, r roof, R roof light, w wall, k window.
const HOUSE: Sprite = ['..ooo..', '.orRro.', 'orrrrRo', 'owwkwwo', 'owwwwwo', 'ooooooo'];

const PARTY: readonly (readonly [Sprite, Sprite])[] = [
  [HERO_A, HERO_B],
  [MAGE_A, MAGE_B],
  [HEAL_A, HEAL_B],
];

const SKIN = { o: '#1a1028', s: '#ffe0c8', e: '#1a1028' };
const PARTY_COLORS: readonly Palette[] = [
  { ...SKIN, h: '#8a3a2a', H: '#c8664a', c: '#c03040', a: '#a8b4d0', A: '#f0f4ff', b: '#3a4a8a' },
  { ...SKIN, h: '#f08cb8', t: '#2c3e8c', T: '#4a68c8', c: '#3c58b8' },
  { ...SKIN, h: '#c88a4a', l: '#5aa86a', L: '#9ad88a' },
];

// Palette builders live at module level: palettes are cached per builder and color set.
const townColors = (k: Colors<K>): Palette => ({ o: k.ink, r: k.roof, R: k.roofHi, w: k.wall, W: k.wallLo, k: k.window, d: k.ink });
const treeColors = (k: Colors<K>): Palette => ({ o: k.ink, F: k.forest, f: k.forestLo, t: k.ink });
const peakColors = (k: Colors<K>): Palette => ({ o: k.ink, S: k.snow, s: k.rockLo, r: k.rock, R: k.rockLo });
const shipColors = (k: Colors<K>): Palette => ({ o: k.ink, R: k.roof, w: k.wall, W: k.wallLo, y: k.road, Y: k.sand });

// The party's own colors, moved a little toward the light of the hour.
const PARTY_TINTS = PARTY_COLORS.map(
  (base) =>
    (v: Colors<K>): Palette =>
      tinted(base, v.tint, 0.2),
);

// ---- the map: a strip of world that repeats along x, classified once per height ----

const PERIOD = 640;
const TAU = Math.PI * 2;

const DEEP = 0;
const SEA = 1;
const SHALLOW = 2;
const SAND = 3;
const GRASS = 4;
const MEADOW = 5;
const FOREST = 6;
const MOUNT = 7;
const ROAD = 8;

const roadY = (x: number, h: number): number =>
  h * 0.5 + h * 0.07 * Math.sin((x / PERIOD) * TAU * 2) + h * 0.05 * Math.sin((x / PERIOD) * TAU * 3 + 1.3);

type Town = { readonly x: number; readonly castle: boolean };
const TOWNS: readonly Town[] = [
  { x: PERIOD * 0.16, castle: true },
  { x: PERIOD * 0.62, castle: false },
];
const townY = (t: Town, h: number): number => Math.round(roadY(t.x, h) - 16);

// Land rises toward the road and sinks toward the top and bottom of the map, so there is sea along both edges.
const elevation = (x: number, y: number, h: number): number => {
  const d = Math.abs(y - roadY(x, h)) / (h * 0.3);
  const edge = Math.max(0, (y - (h - 30)) / 16) + Math.max(0, (26 - y) / 16);
  return 0.85 - d + (fractal2(x / 40, y / 40, 5, PERIOD / 40) - 0.5) * 1.2 - edge;
};

const nearTown = (x: number, y: number, h: number): boolean =>
  TOWNS.some((t) => Math.abs(wrap(x - t.x + PERIOD / 2, PERIOD) - PERIOD / 2) < 20 && Math.abs(y - townY(t, h)) < 16);

const waterOf = (e: number): number => (e < -0.3 ? DEEP : e < -0.08 ? SEA : SHALLOW);

const landOf = (x: number, y: number, h: number, e: number): number => {
  const fromRoad = Math.abs(y - roadY(x, h));
  if (fromRoad < 1.3) return ROAD;
  if (nearTown(x, y, h)) return GRASS;
  if (e > 0.6 && fromRoad > 9) return MOUNT;
  if (fromRoad > 5 && noise2(x / 32, y / 32, 9, PERIOD / 32) > 0.56) return FOREST;
  return noise2(x / 16, y / 16, 13, PERIOD / 16) > 0.6 ? MEADOW : GRASS;
};

const classify = (x: number, y: number, h: number): number => {
  const e = elevation(x, y, h);
  if (e < 0) return waterOf(e);
  return e < 0.06 ? SAND : landOf(x, y, h, e);
};

const maps = new Map<number, Uint8Array>();

const mapOf = (h: number): Uint8Array => {
  const hit = maps.get(h);
  if (hit) return hit;
  const data = new Uint8Array(PERIOD * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < PERIOD; x++) data[y * PERIOD + x] = classify(x, y, h);
  if (maps.size > 4) maps.clear();
  maps.set(h, data);
  return data;
};

const at = (data: Uint8Array, x: number, y: number, h: number): number =>
  y < 0 || y >= h ? DEEP : (data[y * PERIOD + wrap(x, PERIOD)] as number);

const isWater = (k: number): boolean => k <= SHALLOW;

// ---- painting the map once per size and colors ----

const groundColor = (k: number, x: number, y: number, c: Colors<K>): string => {
  const d = bayer(x, y);
  switch (k) {
    case DEEP:
      return d < 0.12 ? c.sea : c.deep;
    case SEA:
      return c.sea;
    case SHALLOW:
      return d < 0.3 ? c.sea : c.shallow;
    case SAND:
      return c.sand;
    case MEADOW:
      return d < 0.5 ? c.grassLo : c.grass;
    case FOREST:
      return c.forestLo;
    case MOUNT:
      return d < 0.5 ? c.rockLo : c.grassLo;
    case ROAD:
      return c.road;
    default:
      return c.grass;
  }
};

const groundCanvas = (h: number, c: Colors<K>): HTMLCanvasElement =>
  memoCanvas(`b4world-ground:${h}:${sigOf(c)}`, PERIOD, h, (img) => {
    const data = mapOf(h);
    const rgbs = new Map<string, readonly [number, number, number]>();
    for (let y = 0; y < h; y++)
      for (let x = 0; x < PERIOD; x++) {
        const color = groundColor(data[y * PERIOD + x] as number, x, y, c);
        const rgb = rgbs.get(color) ?? hexToRgb(color);
        rgbs.set(color, rgb);
        img.data.set([rgb[0], rgb[1], rgb[2], 255], (y * PERIOD + x) * 4);
      }
  });

// Stamps a sprite on every grid point of one terrain, top to bottom so lower ones overlap; across the seam too.
const stamp = (data: Uint8Array, h: number, kind: number, grid: readonly [number, number], draw: (x: number, y: number) => void): void => {
  const [gx, gy] = grid;
  for (let y = 0, row = 0; y < h; y += gy, row++)
    for (let x = (row % 2) * (gx / 2); x < PERIOD; x += gx) {
      const jx = Math.round(x + (rand(x, y + 3) - 0.5) * 2);
      if (at(data, jx, y, h) !== kind) continue;
      draw(jx, y);
      if (jx < 12) draw(jx + PERIOD, y);
      if (jx > PERIOD - 12) draw(jx - PERIOD, y);
    }
};

const HOUSES = [
  [-9, -4],
  [0, -6],
  [9, -3],
  [-4, 4],
  [6, 5],
] as const;

const drawTown = (g: Ctx, t: Town, x: number, y: number, c: Colors<K>): void => {
  const palette = paletteOf(c, townColors);
  if (t.castle) {
    drawSpriteFoot(g, CASTLE, palette, x, y + 12);
    return;
  }
  for (const [dx, dy] of HOUSES) drawSpriteFoot(g, HOUSE, palette, x + dx, y + dy + 6);
};

const paintTowns = (g: Ctx, h: number, c: Colors<K>): void => {
  for (const t of TOWNS) drawTown(g, t, t.x, townY(t, h), c);
};

const paintGround = (g: Ctx, h: number, c: Colors<K>): void => g.drawImage(groundCanvas(h, c), 0, 0);

const paintForests = (g: Ctx, h: number, c: Colors<K>): void => {
  const trees = paletteOf(c, treeColors);
  stamp(mapOf(h), h, FOREST, [4, 3], (x, y) => drawSpriteFoot(g, TREE, trees, x, y + 3));
};

// Snow caps only on the highest summits.
const paintPeaks = (g: Ctx, h: number, c: Colors<K>): void => {
  const peaks = paletteOf(c, peakColors);
  stamp(mapOf(h), h, MOUNT, [8, 5], (x, y) => drawSpriteFoot(g, elevation(wrap(x, PERIOD), y, h) > 0.85 ? PEAK : HILL, peaks, x, y + 4));
};

const MAP_PAINTERS = [paintGround, paintForests, paintPeaks, paintTowns] as const;

const mapLayer = (h: number, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`world-map:${sigOf(c)}`, PERIOD, h, (g) => {
    for (const paint of MAP_PAINTERS) paint(g, h, c);
  });

// Foam on the shoreline, in four frames that flicker in turn.
const foamLayer = (h: number, color: string, phase: number): HTMLCanvasElement =>
  memoCanvas(`b4world-foam:${h}:${color}:${phase}`, PERIOD, h, (img) => {
    const data = mapOf(h);
    const rgb = hexToRgb(color);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < PERIOD; x++) {
        if (!isWater(at(data, x, y, h))) continue;
        const shore = [at(data, x - 1, y, h), at(data, x + 1, y, h), at(data, x, y - 1, h), at(data, x, y + 1, h)].some((k) => !isWater(k));
        if (shore && frac(rand(x, y) + phase / 4) < 0.45) img.data.set([rgb[0], rgb[1], rgb[2], 255], (y * PERIOD + x) * 4);
      }
  });

/** How far the map has scrolled: the party takes a step on every beat. */
const scrollOf = (f: Frame): number => Math.max(0, f.beat) * 3.5;

const drawStrip = (ctx: Ctx, f: Frame, layer: HTMLCanvasElement): void => {
  const start = -Math.round(wrap(scrollOf(f), PERIOD));
  for (let x = start; x < f.w; x += PERIOD) ctx.drawImage(layer, x, 0);
};

const world = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  drawStrip(ctx, f, mapLayer(f.h, c));
  drawStrip(ctx, f, foamLayer(f.h, c.foam, Math.floor(f.t * 2.5) % 4));
};

// Little crests that come and go on the open sea.
const waves = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const data = mapOf(f.h);
  const scroll = scrollOf(f);
  ctx.fillStyle = c.foam;
  for (let y = 6; y < f.h; y += 9)
    for (let x = Math.floor(scroll / 14) * 14 - 14; x < scroll + f.w + 14; x += 14) {
      const k = x * 31 + y;
      const wx = Math.round(x + rand(k, 1) * 8);
      if (at(data, wx, y, f.h) > SEA || Math.sin(f.t * 1.6 + rand(k, 2) * 9) < 0.3) continue;
      const sx = Math.round(wx - scroll + Math.sin(f.t * 0.7 + k) * 1.5);
      ctx.fillRect(sx, y, 1, 1);
      ctx.fillRect(sx + 1, y - 1, 2, 1);
      ctx.fillRect(sx + 3, y, 1, 1);
    }
};

// ---- things on the map ----

const isNight = (c: Colors<K>): boolean => {
  const [r, g, b] = hexToRgb(c.grass);
  return r * 0.3 + g * 0.59 + b * 0.11 < 70;
};

// After dark the towns glow and their windows shine.
const townLights = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  if (!isNight(c)) return;
  const scroll = scrollOf(f);
  for (const t of TOWNS) {
    const x = Math.round(wrap(t.x - scroll + 40, PERIOD) - 40);
    if (x < -40 || x > f.w + 40) continue;
    const flicker = 0.3 + 0.08 * Math.sin(f.t * 3 + t.x) + f.kick * 0.1;
    drawGlow(ctx, c.window, x, townY(t, f.h) + 2, 26, 17, Math.round(flicker * 8) / 8, 3);
    drawTown(ctx, t, x, townY(t, f.h), c);
  }
};

const shipLane = (h: number): number => Math.round(h - Math.max(12, h * 0.07));

const ship = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const span = PERIOD;
  const x = Math.round(wrap(PERIOD * 0.4 - f.t * 3 - scrollOf(f), span) - 40);
  if (x < -30 || x > f.w + 30) return;
  const y = shipLane(f.h) + (Math.sin(f.t * 2) > 0 ? 1 : 0);
  ctx.fillStyle = c.foam;
  for (let k = 1; k < 5; k++) {
    if ((Math.floor(f.t * 4) + k) % 2 === 0) continue;
    ctx.fillRect(x + 9 + k * 3, y - 2 - k, 2, 1);
    ctx.fillRect(x + 9 + k * 3, y + 1 + k, 2, 1);
  }
  const palette = paletteOf(c, shipColors);
  drawSpriteFoot(ctx, SHIP, palette, x, y + 4);
};

// The party walks the road in single file, each a step behind the one ahead.
const party = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const scroll = scrollOf(f);
  const lead = Math.round(f.w * (f.w > f.h ? 0.5 : 0.62));
  PARTY.forEach((frames, k) => {
    const sx = lead - k * 11;
    const y = Math.round(roadY(scroll + sx, f.h)) + 1;
    const frame = frames[(Math.floor(f.beat) + k) % 2] as Sprite;
    const palette = paletteOf(c, PARTY_TINTS[k] as (v: Colors<K>) => Palette);
    ctx.fillStyle = c.shadow;
    ctx.fillRect(sx - 3, y, 7, 1);
    drawSpriteFoot(ctx, frame, palette, sx, y);
  });
};

// An airship passes overhead now and then; only its shadow is seen, sliding over the land.
const airship = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const x = wrap(f.t * 16, f.w + 160) - 80;
  const y = f.h * 0.15 + (x / f.w) * f.h * 0.45;
  const style = ditherStyle(ctx, c.shadow, 0.5);
  if (!style) return;
  ctx.fillStyle = style;
  for (let dy = -5; dy <= 5; dy++) {
    const half = Math.round(17 * Math.sqrt(1 - (dy / 5.5) ** 2));
    ctx.fillRect(Math.round(x - half), Math.round(y + dy), half * 2, 1);
  }
  ctx.fillRect(Math.round(x - 4), Math.round(y + 6), 12, 3);
  ctx.fillRect(Math.round(x - 21), Math.round(y - 3), 3, 6);
  ctx.fillRect(Math.round(x + 17), Math.round(y - 1), 2, 2);
};

export const overworldVoyage = defineScene<K>({
  id: 'overworld-voyage',
  title: 'Overworld Voyage',
  mood: { valence: 0.3, energy: 0.3 },
  styles: ['pixel-quest', 'grand-field', 'town-waltz', 'celtic-isle'],
  variants: [
    {
      mood: { valence: 0.4, energy: 0.35 },
      colors: {
        deep: '#1c3f9a',
        sea: '#2a5cc8',
        shallow: '#4a8ae0',
        foam: '#e8f4ff',
        sand: '#f0d890',
        grass: '#5ab840',
        grassLo: '#3e9636',
        forest: '#2e8a3a',
        forestLo: '#1e6030',
        rock: '#a88a6a',
        rockLo: '#7a6050',
        snow: '#ffffff',
        road: '#d8b070',
        roof: '#d84a3a',
        roofHi: '#ff8a6a',
        wall: '#f4ecdc',
        wallLo: '#c8b8a0',
        window: '#3a4a7a',
        shadow: '#14304a',
        tint: '#ffffff',
        ink: '#14182a',
      },
    },
    {
      mood: { valence: 0, energy: 0.05 },
      colors: {
        deep: '#2a2a78',
        sea: '#4a3e98',
        shallow: '#7a5ab0',
        foam: '#ffd8c0',
        sand: '#e8a878',
        grass: '#8a9a48',
        grassLo: '#6a7a3e',
        forest: '#4a6a3a',
        forestLo: '#30482e',
        rock: '#b07a6a',
        rockLo: '#7a5058',
        snow: '#ffe0d0',
        road: '#e0a070',
        roof: '#b03a4a',
        roofHi: '#f07a6a',
        wall: '#f0d0b8',
        wallLo: '#b88a80',
        window: '#ffd070',
        shadow: '#2a1a3a',
        tint: '#ff9a6a',
        ink: '#1a1024',
      },
    },
    {
      mood: { valence: -0.3, energy: -0.3 },
      colors: {
        deep: '#060c2a',
        sea: '#0c1a48',
        shallow: '#1a3070',
        foam: '#8aa8e0',
        sand: '#5a5a78',
        grass: '#1e3a3a',
        grassLo: '#162e30',
        forest: '#18302e',
        forestLo: '#0e1e22',
        rock: '#4a4a6a',
        rockLo: '#30304a',
        snow: '#c8d8f8',
        road: '#5a5070',
        roof: '#3a3a6a',
        roofHi: '#5a5a8a',
        wall: '#6a6a8a',
        wallLo: '#4a4a68',
        window: '#ffd060',
        shadow: '#04060e',
        tint: '#2a3a7a',
        ink: '#04060e',
      },
    },
  ],
  layers: [world, waves, townLights, ship, party, airship],
});
