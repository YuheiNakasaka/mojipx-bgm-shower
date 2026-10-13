// A round of a fighting game that never existed, on a harbor pier: a karate girl with a teal headband takes on a huge
// mohawked wrestler while the crowd cheers behind the railing. Combos land on the beat, sparks fly, the timer runs down.
import { type Ctx, drawSprite, fillRect, type Palette, type Sprite } from 'mojipx';
import { disc, ditherGradient, frac, pixelLine, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { ditherStyle, fillDither } from './batch-1-helpers.ts';
import { memoLayer, paletteOf, sigOf } from './batch-3-helpers.ts';
import { drawText, fillPolygon, type Pt, sunWithHalo, textWidth, tinted } from './batch-4-helpers.ts';
import { drawGirl, type Girl, limb } from './batch-7-helpers.ts';
import { bigText, gauge, strand } from './batch-8-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sun'
  | 'halo'
  | 'sea'
  | 'seaHi'
  | 'far'
  | 'farLit'
  | 'crowd'
  | 'crowdHi'
  | 'shirtA'
  | 'shirtB'
  | 'rail'
  | 'plank'
  | 'plankLo'
  | 'plankHi'
  | 'bulb'
  | 'ink'
  | 'white'
  | 'hudLo'
  | 'life'
  | 'lost'
  | 'text'
  | 'tint';

// ---- the karate girl (facing right): o outline, h/H/d hair, r/R headband, s/S skin, b blush, e/i/I/w eyes,
// m mouth, W/w gi, k belt ----

const HEAD: Sprite = [
  '.........oooooo..........',
  '.......oohhhhhhoo........',
  '.....oohhhhhHHHhhoo......',
  '....ohhhhhhHHhhhhhho.....',
  '...ohhhhhhhhhhhhhhhhhho..',
  '...orrrrrrrrrrrrrrrrrrro.',
  '..ohRRRRRRRRRRRRRRRRRRRo.',
  '..ohhhhhhhhhhdhhhhhdhhhho',
  '..ohhhhhhhhhdsdhhhdsdhhso',
  '.ohhhhhhhhhdsssssssssssso',
  '.ohhhhhhhhdseeeeesseeesso',
  '.ohhhhhhhhdssewiessewisso',
  '.ohhhhhhhhdsseiiesseiisso',
  '.ohhhhhhhhdsseIIesseIIsso',
  '.ohhhhhhhhdssseessseessso',
  '.ohhhhhhhosssbbbsssssbbso',
  '..ohhhhhhossssssssssssso.',
  '..ohhhhhoSssssssssmmsso..',
  '...ohhhhoSSssssssssso....',
  '....ohhhhoSSSssssSSo.....',
  '.....oohhooSSSSSSoo......',
  '.......oo...oSSSo........',
];

// A shout as she strikes.
const HEAD_KIAI: Sprite = HEAD.map((row, y) => (y === 17 ? `${row.slice(0, 17)}mmm${row.slice(20)}` : row));

const TORSO: Sprite = [
  '......oWWWo.......',
  '....ooWWsWWoo.....',
  '..ooWWWWssWWWoo...',
  '.oWWWWWWWsWWWWWo..',
  '.oWWWWWWWWsWWWWo..',
  '.oWgWWWWWWsWWWWo..',
  '.oWgWWWWWWWWWWWo..',
  '..oWgWWWWWWWWWo...',
  '..oWgWWWWWWWWWo...',
  '..okkkkkkkkkkko...',
  '..okkkkkkkkkkko...',
  '...oWWWWWWWWWo....',
];

const FIST: Sprite = ['.oo.', 'orro', 'orRo', '.oo.'];
const FOOT: Sprite = ['.ooo..', 'osssoo', 'osssso', '.oooo.'];

const GIRL_BASE: Palette = {
  o: '#1a1020',
  h: '#3a2a3a',
  H: '#7a6a8a',
  d: '#24182a',
  s: '#ffe0c8',
  S: '#e8b49a',
  b: '#ff9aa0',
  e: '#2a1430',
  i: '#c8602a',
  I: '#ffb070',
  w: '#ffffff',
  m: '#c0404a',
  r: '#4ad8e0',
  R: '#1a7a9a',
  W: '#fafaff',
  k: '#2a2a3a',
  g: '#d0d0e8',
};
const GIRL_GIRL: Girl = {
  eyes: [
    { x: 12, y: 10, out: -1, w: 5, h: 5 },
    { x: 19, y: 10, out: 1, w: 3, h: 5 },
  ],
  seed: 31,
};

// ---- the wrestler (facing left): t/T skin, m mohawk, M beard and brows, b brows, p/P singlet, y star, g/G belt ----

const W_HEAD: Sprite = [
  '........o.o.o.......',
  '.......omomomo......',
  '......ommMmMmmo.....',
  '.....oommmmmmmoo....',
  '...oottmmmmmmmtoo...',
  '..otttttttttttttto..',
  '.otttttttttttttttto.',
  'otttbbbbttbbbbtttto.',
  'otttwewtttwewttttTo.',
  'ottttttttttttttttTo.',
  'ottttttTtttttttttTo.',
  'otttMMMMMMMMMtttTTo.',
  'ottMMMMMMMMMMMMtTTo.',
  'ottMMMwwwwwMMMMTTo..',
  '.otMMMMMMMMMMMMTTo..',
  '..oMMMMMMMMMMMMoo...',
  '...ooMMMMMMMMoo.....',
  '.....oooooooo.......',
];

// Hit: eyes squeezed shut, mouth wide open.
const W_HEAD_HIT: Sprite = W_HEAD.map((row, y) => {
  if (y === 8) return 'otttbbbtttbbbttttTo.';
  if (y === 13) return 'ottMMMwoooowMMMTTo..';
  return row;
});

const W_TORSO: Sprite = [
  '.......ooooo..........ooooo......',
  '.....ootttttoo......oottttttoo...',
  '....otttttttttoooooottttttttttto.',
  '...ottttpptttttttttttttttpptttto.',
  '..otttttpppttttttttttttpppttttto.',
  '..ottttttpppppppppppppppptttttTo.',
  '..otttttttppppppppppppppttttttTo.',
  '..otttttttTpppppyyppppppTtttttTo.',
  '..ottttttttTppppyyyyppppTttttTTo.',
  '..otttttttttpppyyyyyypppTtttTTo..',
  '...ottttttttppppyyyyppppTtttTo...',
  '...ottttttttpppyyppyypppTtttTo...',
  '....otttttttpppppppppppptttTo....',
  '....otttttttppppppppppppttTTo....',
  '....ottttttttpppppppppppptTTo....',
  '.....oooooooopppppppppppooooo....',
  '.....oggggggggggggggggggggggo....',
  '.....oGGGGGGGGgggggggggggggo.....',
  '.....oppppppppppppppppppppppo....',
  '......oppppppppppppppppppppo.....',
  '......opppppppPPPPppppppppPo.....',
  '.......oPPPPPPo..oPPPPPPPo.......',
];

const W_FIST: Sprite = ['.oooo.', 'otttto', 'otttTo', 'otttTo', 'owwwwo', '.oooo.'];
const BOOT: Sprite = ['.oooooo.', '.oBBBBo.', '.oBBBBo.', 'ooBBBBo.', 'oBBBBBBo', 'oooooooo'];

const BRUTE_BASE: Palette = {
  o: '#1a1020',
  t: '#d0905a',
  T: '#a06038',
  m: '#e03aa0',
  M: '#3a2420',
  b: '#3a2420',
  w: '#ffffff',
  e: '#2a1430',
  p: '#5a3aa8',
  P: '#3a2470',
  y: '#ffd84a',
  g: '#ffd84a',
  G: '#fff6b0',
  B: '#7a2a2a',
};

const SPARK: Sprite = [
  '.....y.....',
  '.....y.....',
  '..y..w..y..',
  '...y.w.y...',
  '....www....',
  'yywwwwwwwyy',
  '....www....',
  '...y.w.y...',
  '..y..w..y..',
  '.....y.....',
  '.....y.....',
];
const SPARK_SMALL: Sprite = ['...y...', '.y.w.y.', '..www..', 'ywwwwwy', '..www..', '.y.w.y.', '...y...'];
const GUARD: Sprite = ['..b..', '.bwb.', 'bwwwb', '.bwb.', '..b..'];

// Fighters keep their own colors and catch a little of the sky's light.
const girlPalette = (c: Colors<K>): Palette => tinted(GIRL_BASE, c.tint, 0.12);
const brutePalette = (c: Colors<K>): Palette => tinted(BRUTE_BASE, c.tint, 0.12);
const sparkPalette = (c: Colors<K>): Palette => ({ y: c.bulb, w: c.white, b: c.seaHi });

// ---- the round: 64 beats; four of intro, a fight in 8-beat combos, then a knockout ----

const ROUND = 64;
const KO_AT = 58;

type Move = 'idle' | 'punch' | 'kick' | 'block' | 'win';
type Moment = {
  readonly round: number;
  /** Beats into the round, and into the current move. */
  readonly t: number;
  readonly age: number;
  readonly girl: Move;
  readonly brute: 'idle' | 'hit' | 'swing' | 'down';
};

// The girl's 8-beat combo: punch, kick, punch, a breath, block his swing, a breath, kick, a breath.
const COMBO: readonly Move[] = ['punch', 'kick', 'punch', 'idle', 'block', 'idle', 'kick', 'idle'];

const momentOf = (beat: number): Moment => {
  const b = Math.max(0, beat);
  const round = Math.floor(b / ROUND);
  const t = b - round * ROUND;
  const age = frac(t);
  if (t < 4) return { round, t, age, girl: 'idle', brute: 'idle' };
  if (t >= KO_AT + 1) return { round, t, age, girl: 'win', brute: 'down' };
  if (t >= KO_AT) return { round, t, age, girl: 'kick', brute: 'hit' };
  const girl = COMBO[Math.floor(t - 4) % 8] ?? 'idle';
  const active = age < 0.45;
  const brute = girl === 'block' ? 'swing' : girl === 'punch' || girl === 'kick' ? 'hit' : 'idle';
  return { round, t, age, girl: active ? girl : 'idle', brute: active ? brute : 'idle' };
};

/** Hits landed on the wrestler (and his blows the girl blocked) this round by beat t of it. */
const landedBy = (t: number, beats: readonly number[]): number => {
  if (t < 4) return 0;
  const done = Math.floor((Math.min(t, KO_AT) - 4) / 8);
  const rest = Math.min(t, KO_AT) - 4 - done * 8;
  return done * beats.length + beats.filter((b) => b <= rest).length;
};
const HITS = [0, 1, 2, 6];
const BLOCKS = [4];
const bruteLife = (t: number): number => (t >= KO_AT ? 0 : 1 - landedBy(t, HITS) / (landedBy(KO_AT - 0.01, HITS) + 2));
const girlLife = (t: number): number => 1 - landedBy(t, BLOCKS) * 0.035;

// ---- layout ----

type Arena = {
  readonly wide: boolean;
  readonly cx: number;
  readonly horizon: number;
  readonly rail: number;
  readonly floor: number;
};

const arenaOf = (f: Frame): Arena =>
  f.w > f.h
    ? { wide: true, cx: Math.round(f.w / 2), horizon: Math.round(f.h * 0.42), rail: Math.round(f.h * 0.66), floor: f.h - 16 }
    : {
        wide: false,
        cx: Math.round(f.w / 2),
        horizon: Math.round(f.h * 0.5),
        rail: Math.round(f.h * 0.66),
        floor: Math.round(f.h * 0.85),
      };

// ---- the backdrop (cached): sky and sun, a lighthouse on the far headland, a ship and cranes, the sea, the pier ----

const paintHarbor = (g: Ctx, f: Frame, a: Arena, c: Colors<K>): void => {
  const lx = Math.round(f.w * 0.1);
  fillPolygon(
    g,
    [
      [-4, a.horizon],
      [-4, a.horizon - 10],
      [lx - 8, a.horizon - 14],
      [lx + 14, a.horizon - 9],
      [lx + 34, a.horizon],
    ],
    c.far,
  );
  fillRect(g, c.far, lx - 2, a.horizon - 34, 6, 22);
  fillRect(g, c.farLit, lx - 2, a.horizon - 30, 6, 2);
  fillRect(g, c.far, lx - 3, a.horizon - 37, 8, 3);
  const sx = Math.round(f.w * 0.72);
  fillRect(g, c.far, sx, a.horizon - 5, 44, 5);
  fillRect(g, c.far, sx + 33, a.horizon - 12, 8, 7);
  for (let k = 0; k < 5; k++) fillRect(g, k % 2 ? c.far : c.farLit, sx + 4 + k * 6, a.horizon - 9, 5, 4);
  for (const x of [f.w - 26, f.w - 8]) {
    fillRect(g, c.far, x, a.horizon - 40, 3, 40);
    fillRect(g, c.far, x - 16, a.horizon - 40, 30, 3);
    pixelLine(g, x + 1, a.horizon - 52, x - 15, a.horizon - 39, c.far);
  }
};

const paintSea = (g: Ctx, f: Frame, a: Arena, c: Colors<K>): void => {
  g.drawImage(ditherGradient(f.w, a.rail - a.horizon, [c.sea, c.sky0]), 0, a.horizon);
  const sunX = Math.round(f.w * 0.42);
  for (let y = a.horizon + 1, k = 0; y < a.rail; y += 2, k++) {
    const half = 3 + k * 1.2 + rand(k, 5) * 4;
    fillRect(g, c.seaHi, Math.round(sunX - half), y, Math.round(half * 2 * (0.4 + rand(k, 6) * 0.5)), 1);
  }
};

const paintPier = (g: Ctx, f: Frame, a: Arena, c: Colors<K>): void => {
  g.drawImage(ditherGradient(f.w, f.h - a.rail, [c.plankLo, c.plank]), 0, a.rail);
  for (let k = 1, y = a.rail + 3; y < f.h; k++, y += 2 + k) {
    fillRect(g, c.plankLo, 0, y, f.w, 1);
    for (let x = Math.floor(rand(k, 1) * 40); x < f.w; x += 40 + Math.floor(rand(k, x) * 30))
      fillRect(g, c.plankLo, x, y - k - 1, 1, k + 1);
  }
  fillRect(g, c.plankHi, 0, a.rail, f.w, 1);
};

const backLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`versus-back:${f.w}x${f.h}:${sigOf(c)}`, f.w, f.h, (g) => {
    const a = arenaOf(f);
    g.drawImage(ditherGradient(f.w, a.horizon, [c.sky0, c.sky1, c.sky2]), 0, 0);
    sunWithHalo(g, Math.round(f.w * 0.42), a.horizon - Math.round(f.h * 0.06), Math.round(Math.min(f.w, f.h) * 0.09), c.sun, c.halo, 2.6);
    paintSea(g, f, a, c);
    paintHarbor(g, f, a, c);
    paintPier(g, f, a, c);
    paintWire(g, f, a, c);
  });

const backdrop = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const a = arenaOf(f);
  ctx.drawImage(backLayer(f, c), 0, 0);
  // Glints drift across the sea, and the lighthouse lamp blinks.
  for (let i = 0; i < 18; i++) {
    const y = a.horizon + 2 + Math.floor(rand(i, 3) * (a.rail - a.horizon - 4));
    const x = Math.round((rand(i, 4) * f.w + f.t * (4 + (y - a.horizon) * 0.3)) % (f.w + 8)) - 4;
    if (Math.sin(f.t * 2 + i) > -0.3) fillRect(ctx, c.seaHi, x, y, 2 + (i % 3), 1);
  }
  if (frac(f.t / 2) < 0.5) fillRect(ctx, c.bulb, Math.round(f.w * 0.1) - 1, a.horizon - 33, 4, 2);
};

// ---- the crowd behind the railing, cheering on the beat; bulbs strung above them ----

const FAN: Sprite = [
  '....ooo....',
  '...oKKko...',
  '..oKkkkko..',
  '..oKkkkko..',
  '..okkkkko..',
  '...okkko...',
  '..ooKkkoo..',
  '.oKssssSSo.',
  'oKsssssSSSo',
  'oKsssssSSSo',
  'oksssssSSko',
  'oksssssSSko',
];
const FAN_UP: Sprite = [
  '.o.......o.',
  'oko.....oko',
  'oKo.ooo.oko',
  'oKooKKkooko',
  'oKoKkkkkoko',
  '.oKKkkkkko.',
  '..oKkkkko..',
  '..okkkkko..',
  '...okkko...',
  '..ooKkkoo..',
  '.oKssssSSo.',
  '.oKssssSSo.',
  '.oKssssSSo.',
  '.oksssSSko.',
  '.oksssSSko.',
];
const fanPalettes = (c: Colors<K>): readonly Palette[] => [
  { o: c.ink, k: c.crowd, K: c.crowdHi, s: c.shirtA, S: c.crowd },
  { o: c.ink, k: c.crowd, K: c.crowdHi, s: c.shirtB, S: c.crowd },
  { o: c.ink, k: c.crowd, K: c.crowdHi, s: c.crowdHi, S: c.crowd },
];

const crowd = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const a = arenaOf(f);
  const palettes = fanPalettesOf(c);
  const beat = Math.floor(f.beat);
  for (let row = 0; row < 2; row++) {
    for (let i = 0, x = row * 6 - 8; x < f.w; i++, x += 12) {
      const cheer = (i + beat + row) % 3 !== 0 && frac(f.beat) < 0.5;
      const y = a.rail - 16 - (1 - row) * 6 - (cheer ? 2 : 0);
      drawSprite(ctx, cheer ? FAN_UP : FAN, palettes[(i * 7 + row) % 3] as Palette, x, y);
    }
  }
  fillRect(ctx, c.rail, 0, a.rail - 6, f.w, 2);
  fillRect(ctx, c.ink, 0, a.rail - 4, f.w, 1);
  for (let x = 6; x < f.w; x += 24) fillRect(ctx, c.rail, x, a.rail - 6, 2, 6);
  lights(ctx, f, a, c);
};

const fanCache = new WeakMap<object, readonly Palette[]>();
const fanPalettesOf = (c: Colors<K>): readonly Palette[] => {
  const hit = fanCache.get(c);
  if (hit) return hit;
  const made = fanPalettes(c);
  fanCache.set(c, made);
  return made;
};

const lights = (ctx: Ctx, f: Frame, a: Arena, c: Colors<K>): void => {
  const top = a.rail - 30;
  const step = Math.floor(f.beat);
  for (let x = 2, i = 0; x < f.w; x += 8, i++) {
    const sag = Math.sin(((x % 80) / 80) * Math.PI) * 6;
    const y = Math.round(top + sag);
    fillRect(ctx, c.ink, x, y - 1, 1, 1);
    fillRect(ctx, (i + step) % 2 === 0 ? c.bulb : c.white, x - 1, y, 3, 2);
  }
};

// The wire the bulbs hang from, sagging between poles (it never moves, so it is painted with the backdrop).
const paintWire = (g: Ctx, f: Frame, a: Arena, c: Colors<K>): void => {
  g.fillStyle = c.ink;
  for (let x = 0; x < f.w; x++) g.fillRect(x, Math.round(a.rail - 31 + Math.sin(((x % 80) / 80) * Math.PI) * 6), 1, 1);
};

// ---- the fighters, posed limb by limb ----

/** An elbow (or knee) and a fist (or ankle), relative to the shoulder (or hip). */
type Limb = readonly [Pt, Pt];
type Pose = { readonly shift: Pt; readonly front: Limb; readonly back: Limb; readonly frontLeg: Limb; readonly backLeg: Limb };

const GIRL_POSES: Readonly<Record<Move, Pose>> = {
  idle: {
    shift: [0, 0],
    front: [
      [4, 5],
      [9, 0],
    ],
    back: [
      [1, 6],
      [5, 1],
    ],
    frontLeg: [
      [5, 9],
      [8, 18],
    ],
    backLeg: [
      [-3, 9],
      [-7, 18],
    ],
  },
  punch: {
    shift: [5, 1],
    front: [
      [8, 1],
      [16, 0],
    ],
    back: [
      [-3, 5],
      [1, 8],
    ],
    frontLeg: [
      [7, 8],
      [12, 17],
    ],
    backLeg: [
      [-5, 8],
      [-11, 17],
    ],
  },
  kick: {
    shift: [-1, -1],
    front: [
      [2, 5],
      [6, -1],
    ],
    back: [
      [-4, 4],
      [-2, -2],
    ],
    frontLeg: [
      [9, -3],
      [20, -10],
    ],
    backLeg: [
      [0, 9],
      [-2, 19],
    ],
  },
  block: {
    shift: [-3, 0],
    front: [
      [5, 2],
      [7, -6],
    ],
    back: [
      [5, 5],
      [8, -2],
    ],
    frontLeg: [
      [4, 9],
      [6, 18],
    ],
    backLeg: [
      [-4, 9],
      [-9, 18],
    ],
  },
  win: {
    shift: [0, 0],
    front: [
      [3, -6],
      [5, -14],
    ],
    back: [
      [-2, 6],
      [1, 9],
    ],
    frontLeg: [
      [3, 9],
      [4, 18],
    ],
    backLeg: [
      [-2, 9],
      [-4, 18],
    ],
  },
};

/** A bent limb: both segments outlined first so the joint shows no seam, then filled (upper and lower in their colors). */
const bent = (ctx: Ctx, root: Pt, l: Limb, width: number, upper: string, lower: string, ink: string): Pt => {
  const [rx, ry] = root;
  const [[jx, jy], [ex, ey]] = l;
  limb(ctx, rx, ry, rx + jx, ry + jy, width, ink, ink);
  limb(ctx, rx + jx, ry + jy, rx + ex, ry + ey, width, ink, ink);
  limb(ctx, rx, ry, rx + jx, ry + jy, width - 2, upper, upper);
  limb(ctx, rx + jx, ry + jy, rx + ex, ry + ey, width - 2, lower, lower);
  return [rx + ex, ry + ey];
};

/** Where the girl's torso goes: her stance shifts with each move and bobs on the off-beat while she waits. */
const girlAt = (f: Frame, a: Arena, m: Moment): Pt => {
  const pose = GIRL_POSES[m.girl];
  const bob = m.girl === 'idle' && frac(f.beat) >= 0.5 ? 1 : 0;
  return [a.cx - 38 + pose.shift[0], a.floor - 30 + pose.shift[1] + bob];
};

const headband = (ctx: Ctx, f: Frame, x: number, y: number, p: Palette): void => {
  for (let k = 0; k < 2; k++) {
    for (let i = 0; i < 8; i++) {
      const wave = Math.round(Math.sin(f.t * 9 - i * 0.8 + k * 1.3) * (i / 4));
      fillRect(ctx, p.R ?? '#1a7a9a', x - i, y + k * 2 + wave + Math.floor(i / 3), 1, 2);
    }
  }
};

const fighterGirl = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const a = arenaOf(f);
  const m = momentOf(f.beat);
  const pose = GIRL_POSES[m.girl];
  const p = paletteOf(c, girlPalette);
  const ink = p.o ?? c.ink;
  const skin = p.s ?? c.white;
  const gi = p.W ?? c.white;
  const [x, y] = girlAt(f, a, m);
  shadow(ctx, x + 9, a.floor + 1, 14, c);
  const sway = Math.round(Math.sin(f.beat * Math.PI) * 4) - (m.girl === 'idle' ? 0 : 3);
  strand(ctx, x - 1, y - 18, 20, sway, -6, (u) => 5 - u * 3, { ink, hair: p.h ?? ink, hi: p.H ?? ink, lo: p.d ?? ink });
  const backFoot = bent(ctx, [x + 5, y + 11], pose.backLeg, 4, gi, gi, ink);
  drawSprite(ctx, FOOT, p, backFoot[0] - 2, backFoot[1] - 1);
  const backFist = bent(ctx, [x + 4, y + 3], pose.back, 3, gi, skin, ink);
  drawSprite(ctx, FIST, p, backFist[0] - 2, backFist[1] - 2);
  drawSprite(ctx, TORSO, p, x, y);
  const frontFoot = bent(ctx, [x + 10, y + 11], pose.frontLeg, 4, gi, gi, ink);
  drawSprite(ctx, FOOT, p, frontFoot[0] - 2, frontFoot[1] - 1);
  drawGirl(ctx, f, m.girl === 'idle' || m.girl === 'block' ? HEAD : HEAD_KIAI, p, x - 6, y - 21, GIRL_GIRL);
  headband(ctx, f, x - 4, y - 16, p);
  const frontFist = bent(ctx, [x + 12, y + 3], pose.front, 3, gi, skin, ink);
  drawSprite(ctx, FIST, p, frontFist[0] - 2, frontFist[1] - 2);
  impact(ctx, f, m, m.girl === 'kick' ? frontFoot : frontFist, c);
};

const shadow = (ctx: Ctx, cx: number, y: number, half: number, c: Colors<K>): void => {
  fillDither(ctx, c.ink, 0.5, cx - half, y - 1, half * 2, 3);
  fillDither(ctx, c.ink, 0.5, cx - half + 3, y, half * 2 - 6, 1);
};

// Sparks where a blow lands (bigger when the kick drum hits with it), a guard flash where one is blocked.
const impact = (ctx: Ctx, f: Frame, m: Moment, at: Pt, c: Colors<K>): void => {
  if (m.age > 0.3) return;
  const palette = paletteOf(c, sparkPalette);
  const [x, y] = at;
  if (m.girl === 'punch' || m.girl === 'kick') {
    const big = m.age < 0.2 || f.kick > 0.6;
    if (big) drawSprite(ctx, SPARK, palette, x - 3, y - 5);
    else drawSprite(ctx, SPARK_SMALL, palette, x - 1, y - 3);
  }
  if (m.girl === 'block') drawSprite(ctx, GUARD, palette, x + 1, y - 2);
};

type Brute = { readonly shift: Pt; readonly front: Limb; readonly back: Limb; readonly head: Sprite; readonly sink: number };

const BRUTE_POSES: Readonly<Record<Moment['brute'], Brute>> = {
  idle: {
    shift: [0, 0],
    front: [
      [-6, 9],
      [-5, -1],
    ],
    back: [
      [6, 9],
      [3, -1],
    ],
    head: W_HEAD,
    sink: 0,
  },
  hit: {
    shift: [4, 1],
    front: [
      [-4, 8],
      [-9, 12],
    ],
    back: [
      [8, -1],
      [12, -8],
    ],
    head: W_HEAD_HIT,
    sink: 0,
  },
  swing: {
    shift: [-6, 0],
    front: [
      [-10, 3],
      [-21, 2],
    ],
    back: [
      [5, 9],
      [2, 14],
    ],
    head: W_HEAD,
    sink: 0,
  },
  down: {
    shift: [6, 0],
    front: [
      [-5, 10],
      [-8, 18],
    ],
    back: [
      [6, 10],
      [9, 18],
    ],
    head: W_HEAD_HIT,
    sink: 12,
  },
};

const fighterBrute = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const a = arenaOf(f);
  const m = momentOf(f.beat);
  const pose = BRUTE_POSES[m.brute];
  const p = paletteOf(c, brutePalette);
  const ink = p.o ?? c.ink;
  const skin = p.t ?? c.white;
  const tights = p.P ?? c.ink;
  const bob = m.brute === 'idle' && frac(f.beat + 0.5) < 0.5 ? 1 : 0;
  const x = a.cx + 2 + pose.shift[0];
  const y = a.floor - 46 + pose.shift[1] + bob + pose.sink;
  shadow(ctx, x + 17, a.floor + 1, 20, c);
  const backFist = bent(ctx, [x + 28, y + 4], pose.back, 6, skin, skin, ink);
  drawSprite(ctx, W_FIST, p, backFist[0] - 3, backFist[1] - 3);
  const knee = pose.sink > 0 ? 5 : 11;
  for (const [hx, dx] of [
    [11, -3],
    [23, 3],
  ] as const) {
    const foot = bent(
      ctx,
      [x + hx, y + 20],
      [
        [dx, knee],
        [dx + Math.sign(dx), 21 - pose.sink],
      ] as Limb,
      6,
      tights,
      tights,
      ink,
    );
    drawSprite(ctx, BOOT, p, foot[0] - 4, Math.min(a.floor - 6, foot[1] - 1));
  }
  drawSprite(ctx, W_TORSO, p, x, y);
  drawSprite(ctx, pose.head, p, x + 6, y - 14);
  const frontFist = bent(ctx, [x + 5, y + 4], pose.front, 6, skin, skin, ink);
  drawSprite(ctx, W_FIST, p, frontFist[0] - 3, frontFist[1] - 3);
};

// ---- the HUD: life bars with the timer between them, names, combo count, and the round calls ----

const hud = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const a = arenaOf(f);
  const m = momentOf(f.beat);
  const half = a.cx - 16;
  const gc = { frame: c.ink, back: c.hudLo, fill: c.life, hi: c.white, lost: c.lost };
  gauge(ctx, 6, 7, half - 6, 6, girlLife(m.t), gc, false, girlLife(m.t - 1.5));
  gauge(ctx, a.cx + 16, 7, half - 6, 6, bruteLife(m.t), gc, true, bruteLife(m.t - 1.5));
  drawText(ctx, 'SAKI', 6, 16, c.text);
  drawText(ctx, 'DOZER', f.w - 6 - textWidth('DOZER'), 16, c.text);
  fillRect(ctx, c.ink, a.cx - 13, 1, 26, 19);
  fillRect(ctx, c.hudLo, a.cx - 12, 2, 24, 17);
  const time = String(Math.max(0, 99 - Math.floor(Math.max(0, m.t - 4) / 2)));
  bigText(ctx, time, a.cx, 4, 2, c.life, c.ink);
  for (let k = 0; k < 2; k++) disc(ctx, a.cx - 22 - k * 7, 20, 2, () => (k < m.round % 3 ? c.life : c.hudLo));
  comboCount(ctx, f, m, a, c);
  calls(ctx, f, m, a, c);
  power(ctx, f, m, c);
};

// Super meters along the bottom, filling with every combo.
const power = (ctx: Ctx, f: Frame, m: Moment, c: Colors<K>): void => {
  const y = f.h - 8;
  const w = Math.min(56, Math.round(f.w * 0.22));
  const gc = { frame: c.ink, back: c.hudLo, fill: c.shirtB, hi: c.white, lost: c.hudLo };
  const full = frac(m.t / 24) > 0.85 && frac(f.t * 4) < 0.5;
  drawText(ctx, 'LV1', 4, y - 2, full ? c.life : c.text);
  gauge(ctx, 23, y, w, 3, frac(m.t / 24), gc);
  drawText(ctx, 'LV2', f.w - 4 - textWidth('LV2'), y - 2, c.text);
  gauge(ctx, f.w - 24 - w, y, w, 3, 0.3 + frac(m.t / 40) * 0.6, gc, true);
};

const comboCount = (ctx: Ctx, f: Frame, m: Moment, a: Arena, c: Colors<K>): void => {
  if (m.t < 4 || m.t >= KO_AT) return;
  const step = Math.floor(m.t - 4) % 8;
  if (step < 1 || step > 3) return;
  const y = a.wide ? 28 : 30;
  bigText(ctx, String(step + 1), 14, y, 2, c.bulb, c.ink);
  drawText(ctx, 'HITS', 22, y + 4, c.white);
  if (frac(f.t * 6) < 0.5 && step === 3) drawText(ctx, 'COMBO!', 6, y + 16, c.life);
};

const calls = (ctx: Ctx, f: Frame, m: Moment, a: Arena, c: Colors<K>): void => {
  const y = Math.round(a.wide ? f.h * 0.3 : f.h * 0.3);
  if (m.t < 2) bigText(ctx, `ROUND ${(m.round % 3) + 1}`, a.cx, y, 2, c.white, c.ink);
  else if (m.t < 4) bigText(ctx, 'FIGHT!', a.cx, y - 4, 3, c.life, c.ink);
  else if (m.t >= KO_AT && frac(f.t * 3) < 0.7) bigText(ctx, 'K.O.', a.cx, y - 4, 4, c.lost, c.white);
};

// The screen flashes when the knockout blow lands.
const flash = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const m = momentOf(f.beat);
  if (m.t < KO_AT || m.t > KO_AT + 0.5) return;
  const style = ditherStyle(ctx, c.white, (KO_AT + 0.5 - m.t) * 1.4);
  if (!style) return;
  ctx.fillStyle = style;
  ctx.fillRect(0, 0, f.w, f.h);
};

export const versusStage = defineScene<K>({
  id: 'versus-stage',
  title: 'Versus Stage',
  mood: { valence: -0.2, energy: 0.8 },
  styles: ['boss-rush', 'neon-rush', 'nineties-pop', 'band-rock', 'fm-funk'],
  variants: [
    {
      mood: { valence: -0.2, energy: 0.8 },
      colors: {
        sky0: '#2a1a4a',
        sky1: '#a04a6a',
        sky2: '#ff9a5a',
        sun: '#fff0b0',
        halo: '#ffc070',
        sea: '#5a3a6a',
        seaHi: '#ffc890',
        far: '#3a2244',
        farLit: '#ff9a5a',
        crowd: '#2a1830',
        crowdHi: '#8a4a5a',
        shirtA: '#c04a4a',
        shirtB: '#3a6aa0',
        rail: '#6a3a3a',
        plank: '#a0603a',
        plankLo: '#6a3a2a',
        plankHi: '#e09a5a',
        bulb: '#ffd84a',
        ink: '#140a14',
        white: '#ffffff',
        hudLo: '#2a1a2a',
        life: '#ffd84a',
        lost: '#e03a3a',
        text: '#ffffff',
        tint: '#ff9a5a',
      },
    },
    {
      mood: { valence: -0.6, energy: 0.6 },
      colors: {
        sky0: '#06081a',
        sky1: '#141c40',
        sky2: '#2a2a5a',
        sun: '#f0f0ff',
        halo: '#6a7ab0',
        sea: '#0e1430',
        seaHi: '#8aa0e0',
        far: '#0a0c20',
        farLit: '#ffd06a',
        crowd: '#080a18',
        crowdHi: '#3a4a7a',
        shirtA: '#5a2a4a',
        shirtB: '#2a3a5a',
        rail: '#2a3050',
        plank: '#3a3a5a',
        plankLo: '#1a1a30',
        plankHi: '#7a7ab0',
        bulb: '#ffc84a',
        ink: '#04040c',
        white: '#ffffff',
        hudLo: '#141830',
        life: '#ffd84a',
        lost: '#e03a3a',
        text: '#e8f0ff',
        tint: '#4a6ab0',
      },
    },
    {
      mood: { valence: 0.4, energy: 0.7 },
      colors: {
        sky0: '#3a8ae8',
        sky1: '#7ac0f8',
        sky2: '#d0f0ff',
        sun: '#ffffff',
        halo: '#fff8c0',
        sea: '#2a7ac8',
        seaHi: '#ffffff',
        far: '#5a8aa8',
        farLit: '#d0e8f8',
        crowd: '#3a3a5a',
        crowdHi: '#8a8ab0',
        shirtA: '#e05a5a',
        shirtB: '#ffd04a',
        rail: '#f0f0f0',
        plank: '#d8a870',
        plankLo: '#a07040',
        plankHi: '#fff0c0',
        bulb: '#ff6a4a',
        ink: '#1a1420',
        white: '#ffffff',
        hudLo: '#2a2440',
        life: '#ffd84a',
        lost: '#e03a3a',
        text: '#ffffff',
        tint: '#fff0d0',
      },
    },
  ],
  layers: [backdrop, crowd, fighterBrute, fighterGirl, hud, flash],
});
