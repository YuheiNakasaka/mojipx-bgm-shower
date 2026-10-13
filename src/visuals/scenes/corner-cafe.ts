// A table by a cafe window: a steaming cup, a plant on the sill and a sleeping cat that breathes slowly
// and flicks its tail on every beat, while people and the odd car pass in the street outside.
import { type Ctx, drawSprite, drawSpriteFoot, fillRect, type Sprite } from 'mojipx';
import { bayer, ditherGradient, frac, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { drawGlow, memoLayer, paletteOf, smooth, wrap } from './batch-2-helpers.ts';

type K =
  | 'sky0'
  | 'sky1'
  | 'facade'
  | 'facadeLo'
  | 'glass'
  | 'awning'
  | 'road'
  | 'walk'
  | 'wall'
  | 'wallLo'
  | 'wood'
  | 'woodHi'
  | 'table'
  | 'tableLo'
  | 'cup'
  | 'cupHi'
  | 'shade'
  | 'leaf'
  | 'leafHi'
  | 'leafLo'
  | 'pot'
  | 'glow';

type Pane = { readonly left: number; readonly top: number; readonly width: number; readonly height: number };

// o outline, f fur, l light fur, s shaded fur, p pink. The tail is drawn separately so it can move.
const CAT: Sprite = [
  '...o............o.........................',
  '...oo..........oo.........................',
  '...ofo........ofo.........................',
  '...opfo......ofpo.........................',
  '...oppfoooooofppo.........................',
  '...offffsfsfffffo.........................',
  '...offfffsfsffffo.oooooooooooooooo........',
  '..offffffffffffffofllllslllslllsllooo.....',
  '..offffffffffffffffffffsfffsfffsfffsfoo...',
  '.offfffffffffffffffffffsfffsfffsfffsfffo..',
  '.offoffoffffoffoffffffffffffffffffffffffo.',
  '.offfooffffffoofffffffffffffffffffffffffo.',
  '..offffffppffffffffffffffffffffffffffffffo',
  '..offfflloollfffffffffffffffffsssssssssso.',
  '...offffllllffffffffffffffffffsssssssssso.',
  '....offfffffffffffssssssssssssssssssssso..',
  '....olllloolllllffsssssssssssssssssssoo...',
  '....olllo..olllooossssssssssssssssooo.....',
  '.....ooo....ooo...oooooooooooooooo........',
];

// h highlight, w cup, s shade, c coffee, C crema.
const CUP: Sprite = [
  '....wwwwwwwwww........',
  '..wwccccccccccww......',
  '.wcccCCccccccccw......',
  '.hwccccccccccccww.....',
  '.hhwwwwwwwwwwwwwwww...',
  '.hwwwwwwwwwwwwwwssww..',
  '.hwwwwwwwwwwwwwws..ww.',
  '..hwwwwwwwwwwwwws..ww.',
  '..hwwwwwwwwwwwwss.ww..',
  '...hwwwwwwwwwwwsssw...',
  '...wwwwwwwwwwwwss.....',
  '....swwwwwwwwwss......',
  '.hwwwwwwwwwwwwwwwwwws.',
  'swwwwwwwwwwwwwwwwwwwws',
  '.ssssssssssssssssssss.',
];

// g leaf, G light leaf, e dark leaf, T pot highlight, t pot, d pot shade.
const PLANT: Sprite = [
  '...........gge..........',
  '..........gGGge.........',
  '..........gGGge.........',
  '......gge.eGGge.........',
  '.....gGGgeegggeggGge....',
  '....gGGGggeeeeggGGgge...',
  '.....eggge..e.egGGgge...',
  '......eeege..gggegge....',
  '...ggee.gGgeegGgg.......',
  '..gGGgggGGgggGGggegggee.',
  '..gGGggeGGggegggggGGgge.',
  '..eggggeegge.eggeeGGgge.',
  '...eeee..eeggee..eeggee.',
  '.....ggee.gGGge..ge.....',
  '..geeGGggegGGggggGgge...',
  '.gGggeGggeegggeeGGgggGge',
  '.eGggeeeeeeeeeeeegggGGge',
  '..eee..eeeeeeeeeeeeeegge',
  '....TTTTTTTTTTTTTTTT....',
  '.....tttttttttttttt.....',
  '.....Ttttttttttttdd.....',
  '.....Ttttttttttttdd.....',
  '......Ttttttttttdd......',
  '......Ttttttttttdd......',
  '......Ttttttttttdd......',
  '.......Ttttttttdd.......',
  '.......Ttttttttdd.......',
];

// A passer-by in two steps: h head, c coat, l legs.
const WALK_A: Sprite = ['.hh.', '.hh.', 'cccc', 'cccc', 'cccc', 'cccc', '.cc.', '.ll.', 'l..l', 'l..l'];
const WALK_B: Sprite = ['.hh.', '.hh.', 'cccc', 'cccc', 'cccc', 'cccc', '.cc.', '.ll.', '.ll.', '.ll.'];

const CAR: Sprite = [
  '.......bbbbbbbbb.........',
  '......bwwwwbwwwwb........',
  '.....bwwwwwbwwwwwb.......',
  '.bbbbbbbbbbbbbbbbbbbbbbb.',
  'bbbbbbbbbbbbbbbbbbbbbbbbh',
  'bbbbbbbbbbbbbbbbbbbbbbbbb',
  '.bb.kkk.bbbbbbbbbb.kkk.b.',
  '....kkk............kkk...',
];

const wide = (f: Frame): boolean => f.w > f.h;
const tableTopOf = (f: Frame): number => Math.round(f.h * (wide(f) ? 0.68 : 0.7));

const windowOf = (f: Frame): Pane => {
  if (wide(f)) {
    const x = Math.round(f.w * 0.06);
    const y = Math.round(f.h * 0.08);
    return { left: x, top: y, width: Math.round(f.w * 0.56), height: tableTopOf(f) - Math.round(f.h * 0.12) - y };
  }
  const x = Math.round(f.w * 0.1);
  const y = Math.round(f.h * 0.06);
  return { left: x, top: y, width: f.w - 2 * x, height: Math.round(f.h * 0.44) };
};

// Where the pendant lamp hangs: its x and the height of its shade.
const lampOf = (f: Frame): readonly [number, number] =>
  wide(f) ? [Math.round(f.w * 0.82), Math.round(f.h * 0.3)] : [Math.round(f.w * 0.72), Math.round(f.h * 0.56)];

// ---- the street outside ----

const paintFacade = (ctx: Ctx, r: Pane, c: Colors<K>): void => {
  const top = Math.round(r.height * 0.22);
  const shop = Math.round(r.height * 0.58);
  const ground = Math.round(r.height * 0.78);
  fillRect(ctx, c.facade, 0, top, r.width, ground - top);
  for (let x = 0; x < r.width; x += 46) fillRect(ctx, c.facadeLo, x, top, 2, shop - top);
  fillRect(ctx, c.facadeLo, 0, top, r.width, 3);
  for (let y = top + 8; y < shop - 14; y += 22) {
    for (let x = 8; x < r.width - 10; x += 16) {
      fillRect(ctx, c.facadeLo, x - 1, y - 1, 10, 14);
      fillRect(ctx, c.glass, x, y, 8, 12);
      fillRect(ctx, c.sky1, x + 1, y + 1, 1, 4);
    }
  }
  for (let x = 0; x < r.width; x += 6) {
    fillRect(ctx, x % 12 === 0 ? c.awning : c.cup, x, shop, 6, 6);
    fillRect(ctx, x % 12 === 0 ? c.awning : c.cup, x + 1, shop + 6, 4, 1);
  }
  fillRect(ctx, c.glass, 6, shop + 10, r.width - 12, ground - shop - 12);
  for (let x = 30; x < r.width - 12; x += 30) fillRect(ctx, c.facadeLo, x, shop + 10, 2, ground - shop - 12);
  fillRect(ctx, c.facadeLo, 6, ground - 6, r.width - 12, 1);
};

const outsideLayer = (r: Pane, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(
    `cafe-out:${[c.sky0, c.sky1, c.facade, c.facadeLo, c.glass, c.awning, c.cup, c.road, c.walk].join(',')}`,
    r.width,
    r.height,
    (ctx) => {
      ctx.drawImage(ditherGradient(r.width, Math.round(r.height * 0.3), [c.sky0, c.sky1]), 0, 0);
      paintFacade(ctx, r, c);
      const walk = Math.round(r.height * 0.78);
      fillRect(ctx, c.walk, 0, walk, r.width, r.height - walk);
      fillRect(ctx, c.road, 0, Math.round(r.height * 0.82), r.width, Math.round(r.height * 0.11));
      for (let x = 4; x < r.width; x += 18) fillRect(ctx, c.walk, x, Math.round(r.height * 0.87), 8, 1);
    },
  );

const clouds = (ctx: Ctx, f: Frame, r: Pane, c: Colors<K>): void => {
  for (let i = 0; i < 3; i++) {
    const x = r.left + wrap(rand(i, 5) * r.width + f.t * (2 + i), r.width + 30) - 20;
    const y = r.top + 4 + Math.round(rand(i, 6) * r.height * 0.1);
    fillRect(ctx, c.cupHi, x, y, 14, 2);
    fillRect(ctx, c.cupHi, x + 3, y - 2, 7, 2);
  }
};

// People stroll along the near pavement, stepping on the beat; a car crosses now and then.
const passersBy = (ctx: Ctx, f: Frame, r: Pane, c: Colors<K>): void => {
  const coats = [c.awning, c.pot, c.wood];
  const span = r.width + 30;
  for (let i = 0; i < 3; i++) {
    const dir = i % 2 === 0 ? 1 : -1;
    const x = r.left + wrap(rand(i, 7) * span + dir * f.t * (9 + i * 3), span) - 15;
    const step = (Math.floor(f.beat) + i) % 2 === 0 ? WALK_A : WALK_B;
    const palette = paletteOf(c, `walker${i}`, (k) => ({ h: k.wood, c: coats[i] as string, l: k.wood }));
    drawSpriteFoot(ctx, step, palette, x, r.top + r.height - 1 - (i % 2));
  }
  const cx = wrap(f.t * 70 + 200, 1400) - 30;
  if (cx < r.width) {
    const palette = paletteOf(c, 'car', (k) => ({ b: k.pot, w: k.sky1, k: k.wood, h: k.cupHi }));
    drawSprite(ctx, CAR, palette, r.left + cx, r.top + Math.round(r.height * 0.9) - 8);
  }
};

const view = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const r = windowOf(f);
  ctx.drawImage(outsideLayer(r, c), r.left, r.top);
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.left, r.top, r.width, r.height);
  ctx.clip();
  clouds(ctx, f, r, c);
  passersBy(ctx, f, r, c);
  ctx.restore();
};

// ---- the room ----

const paintWall = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  fillRect(ctx, c.wall, 0, 0, f.w, f.h);
  for (let x = 3; x < f.w; x += 9) {
    for (let y = 0; y < f.h; y++) if (bayer(x, y) < 0.5) fillRect(ctx, c.wallLo, x, y, 2, 1);
  }
};

const paintTable = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const top = tableTopOf(f);
  fillRect(ctx, c.table, 0, top, f.w, f.h - top);
  fillRect(ctx, c.woodHi, 0, top, f.w, 1);
  for (let y = top + 9; y < f.h; y += 11 + Math.floor((y - top) / 12)) fillRect(ctx, c.tableLo, 0, y, f.w, 1);
  for (let i = 0; i < Math.round(f.w / 3); i++) {
    const y = top + 3 + Math.floor(rand(i, 3) * (f.h - top - 3));
    fillRect(ctx, c.tableLo, Math.floor(rand(i, 4) * f.w), y, 3 + Math.floor(rand(i, 5) * 10), 1);
  }
};

// Light from the window falls on the table as soft, skewed panes.
const paintSunlight = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const top = tableTopOf(f);
  const r = windowOf(f);
  const panes = wide(f) ? 3 : 2;
  const pane = r.width / panes;
  for (let y = top + 2; y < Math.min(f.h, top + Math.min(60, (f.h - top) * 0.75)); y++) {
    const skew = (y - top) * 0.6;
    for (let p = 0; p < panes; p++) {
      const x0 = Math.round(r.left + p * pane + 3 + skew);
      for (let x = x0; x < x0 + pane - 6; x++) if (bayer(x, y) < 0.1) fillRect(ctx, c.glow, x, y, 1, 1);
    }
  }
};

const paintFrame = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const r = windowOf(f);
  const bar = (x: number, y: number, w: number, h: number): void => {
    fillRect(ctx, c.wood, x, y, w, h);
    fillRect(ctx, c.woodHi, x, y, w, 1);
  };
  bar(r.left - 4, r.top - 4, r.width + 8, 4);
  bar(r.left - 4, r.top, 4, r.height);
  bar(r.left + r.width, r.top, 4, r.height);
  const panes = wide(f) ? 3 : 2;
  for (let i = 1; i < panes; i++) bar(Math.round(r.left + (r.width * i) / panes) - 1, r.top, 3, r.height);
  bar(r.left, r.top + Math.round(r.height * 0.3), r.width, 3);
  bar(r.left - 7, r.top + r.height, r.width + 14, 5);
  fillRect(ctx, c.wallLo, r.left - 6, r.top + r.height + 5, r.width + 12, 2);
};

// A shelf with a row of jars on the wall beside the window.
const paintShelf = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const y = wide(f) ? Math.round(f.h * 0.5) : Math.round(f.h * 0.63);
  const x0 = wide(f) ? Math.round(f.w * 0.68) : Math.round(f.w * 0.08);
  const x1 = wide(f) ? Math.round(f.w * 0.97) : Math.round(f.w * 0.52);
  const jars = [c.glass, c.cup, c.pot, c.leafHi, c.cup];
  let x = x0 + 3;
  for (let i = 0; x < x1 - 8; i++) {
    const jw = 6 + Math.floor(rand(i, 21) * 4);
    const jh = 8 + Math.floor(rand(i, 22) * 7);
    fillRect(ctx, jars[i % jars.length] as string, x, y - jh, jw, jh);
    fillRect(ctx, c.wood, x - 1, y - jh - 2, jw + 2, 2);
    fillRect(ctx, c.cupHi, x + 1, y - jh + 2, 1, jh - 4);
    fillRect(ctx, c.shade, x + jw - 1, y - jh, 1, jh);
    x += jw + 3 + Math.floor(rand(i, 23) * 3);
  }
  fillRect(ctx, c.wood, x0, y, x1 - x0, 3);
  fillRect(ctx, c.woodHi, x0, y, x1 - x0, 1);
  fillRect(ctx, c.wallLo, x0 + 1, y + 3, x1 - x0 - 2, 2);
};

const roomLayer = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(
    `cafe-room:${[c.wall, c.wallLo, c.wood, c.woodHi, c.table, c.tableLo, c.glow, c.glass, c.cup, c.cupHi, c.pot, c.leafHi, c.shade].join(',')}`,
    f.w,
    f.h,
    (ctx) => {
      paintWall(ctx, f, c);
      paintShelf(ctx, f, c);
      paintTable(ctx, f, c);
      paintSunlight(ctx, f, c);
    },
  );

const room = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(roomLayer(f, c), 0, 0);
};

const frame = (ctx: Ctx, f: Frame, c: Colors<K>): void => paintFrame(ctx, f, c);

const lamp = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const [x, y] = lampOf(f);
  drawGlow(ctx, x, y + 9, Math.round(Math.min(f.w, f.h) * 0.13), c.glow, f.kick > 0.5 ? 1.1 : 0.85);
  fillRect(ctx, c.wood, x, 0, 1, y);
  fillRect(ctx, c.wood, x - 2, y, 5, 2);
  fillRect(ctx, c.awning, x - 5, y + 2, 11, 2);
  fillRect(ctx, c.awning, x - 7, y + 4, 15, 3);
  fillRect(ctx, c.woodHi, x - 5, y + 2, 11, 1);
  fillRect(ctx, c.wood, x - 7, y + 6, 15, 1);
  fillRect(ctx, c.cupHi, x - 2, y + 7, 5, 2);
};

// ---- things on the table ----

const shadow = (ctx: Ctx, c: Colors<K>, cx: number, y: number, w: number): void => {
  fillRect(ctx, c.tableLo, Math.round(cx - w / 2), y - 1, w, 2);
  fillRect(ctx, c.tableLo, Math.round(cx - w / 2 + 3), y + 1, w - 6, 1);
};

const plant = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const r = windowOf(f);
  const palette = paletteOf(c, 'plant', (k) => ({ g: k.leaf, G: k.leafHi, e: k.leafLo, T: k.facade, t: k.pot, d: k.wood }));
  drawSpriteFoot(ctx, PLANT, palette, r.left + 16, r.top + r.height);
};

// The tail curls up from the cat's hip and flicks to the other side on each beat.
const tail = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, y: number): void => {
  const side = Math.floor(f.beat) % 2 === 0 ? 1 : -1;
  const lift = side * (2 * smooth(0, 0.3, frac(f.beat)) - 1);
  const at = (k: number): number => Math.round(y - (k / 9) ** 2 * (5 + 3 * lift));
  for (let k = 0; k <= 9; k++) fillRect(ctx, c.wood, x + k, at(k) - 1, 1, 3);
  fillRect(ctx, c.wood, x + 10, at(9) - 1, 1, 2);
  for (let k = 0; k <= 9; k++) fillRect(ctx, k > 6 ? c.shade : c.cup, x + k, at(k), 1, 1);
};

const cat = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, y: number): void => {
  shadow(ctx, c, x + 4, y, 44);
  const left = x - 21;
  const top = y - CAT.length;
  tail(ctx, f, c, left + 39, top + 15);
  const palette = paletteOf(c, 'cat', (k) => ({ o: k.wood, f: k.cup, l: k.cupHi, s: k.shade, p: k.pot }));
  drawSprite(ctx, CAT, palette, left, top);
  // Slow breathing: the back rises by a pixel for half of every two bars.
  if (frac(f.beat / 8) < 0.5) {
    fillRect(ctx, c.wood, left + 19, top + 5, 16, 1);
    fillRect(ctx, c.cupHi, left + 19, top + 6, 16, 1);
  }
};

const steam = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, y: number): void => {
  for (let j = 0; j < 24; j++) {
    const age = frac(f.t * (0.3 + f.energy * 0.2) + j / 24);
    const lane = (j % 3) - 1;
    const sx = x + lane * 3 + Math.sin(age * 7 + f.t * 1.3 + lane) * (1 + age * 3);
    const sy = y - age * 30;
    if (age > 0.65 && (j + Math.floor(f.t * 8)) % 2 === 0) continue;
    fillRect(ctx, c.cupHi, Math.round(sx), Math.round(sy), age < 0.3 ? 2 : 1, 1);
  }
};

const cup = (ctx: Ctx, f: Frame, c: Colors<K>, x: number, y: number): void => {
  shadow(ctx, c, x, y + 1, 22);
  const palette = paletteOf(c, 'cup', (k) => ({ h: k.cupHi, w: k.cup, s: k.shade, c: k.wood, C: k.pot }));
  drawSpriteFoot(ctx, CUP, palette, x, y);
  steam(ctx, f, c, x - 3, y - CUP.length - 1);
};

const things = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const top = tableTopOf(f);
  const depth = f.h - top;
  plant(ctx, f, c);
  cat(ctx, f, c, Math.round(f.w * (wide(f) ? 0.34 : 0.36)), Math.round(top + depth * 0.4));
  cup(ctx, f, c, Math.round(f.w * (wide(f) ? 0.7 : 0.74)), Math.round(top + depth * 0.72));
};

export const cornerCafe = defineScene<K>({
  id: 'corner-cafe',
  title: 'Corner Cafe',
  mood: { valence: 0.3, energy: -0.6 },
  styles: ['lofi-loop', 'cozy-village', 'city-lights', 'bossa-cafe'],
  variants: [
    {
      mood: { valence: 0.5, energy: -0.5 },
      colors: {
        sky0: '#7cc4ec',
        sky1: '#d4f0fa',
        facade: '#e6b38c',
        facadeLo: '#bf8668',
        glass: '#5f84ad',
        awning: '#3e8a6c',
        road: '#6c6874',
        walk: '#b9aea2',
        wall: '#7b4b3a',
        wallLo: '#6b3e31',
        wood: '#38211a',
        woodHi: '#6c4632',
        table: '#b2713d',
        tableLo: '#8f5632',
        cup: '#f3ebdf',
        cupHi: '#ffffff',
        shade: '#c4b4a6',
        leaf: '#4b8a4c',
        leafHi: '#7fc46c',
        leafLo: '#2e5a36',
        pot: '#c4613c',
        glow: '#ffdf9a',
      },
    },
    {
      mood: { valence: 0, energy: -0.6 },
      colors: {
        sky0: '#26335f',
        sky1: '#d98a74',
        facade: '#57486a',
        facadeLo: '#433859',
        glass: '#ffd27a',
        awning: '#a33c4c',
        road: '#2a2838',
        walk: '#4a4459',
        wall: '#4b2f2a',
        wallLo: '#3f2723',
        wood: '#1e120e',
        woodHi: '#4c3122',
        table: '#7c4b2b',
        tableLo: '#5f3920',
        cup: '#e8dccb',
        cupHi: '#fff8e8',
        shade: '#a8988c',
        leaf: '#3b6b45',
        leafHi: '#5f9c5b',
        leafLo: '#24402c',
        pot: '#a3523b',
        glow: '#ffc56e',
      },
    },
  ],
  layers: [room, view, frame, lamp, things],
});
