// A two-player falling-gem puzzle duel: pairs of cut gems drop into two wells, chains of matching gems burst on the
// kick with CHAIN popups, stones rain on the rival's well, and the two girls above react to every blow.
import { type Ctx, drawSprite, fillRect, flipped, type Palette, type Sprite } from 'mojipx';
import { cached, ditherGradient, frac, rand } from '../kit.ts';
import { type Colors, defineScene, type Frame } from '../scene.ts';
import { type Box, wrap } from './batch-1-helpers.ts';
import { sigOf } from './batch-3-helpers.ts';
import { drawText, drawTextOutlined, forEachTextPixel, textWidth } from './batch-4-helpers.ts';
import { blinking } from './batch-7-helpers.ts';
import { digits, textCentered } from './batch-8-helpers.ts';
import { drawWordsOutlined, inEllipse, memoLayer, outlined, spriteOf, wordsWidth } from './batch-12-helpers.ts';

type K = 'bg0' | 'bg1' | 'bg2' | 'pattern' | 'well' | 'grid' | 'frame' | 'frameHi' | 'frameLo' | 'panel' | 'text' | 'gold' | 'ink';

const COLS = 6;
const ROWS = 12;
const CELL = 12;
const ROUND_BEATS = 64;
const CYCLE = 8;
const ROCK = 5;

// ---- gems: five cuts in five colors, and the stones that fall on the rival ----

const GEM_SHAPES: readonly Sprite[] = [
  ['..oooooo..', '.ohhwmmmo.', 'ohhmmmmmdo', 'ohmhmmmmdo', 'ohmmmmmddo', 'ommmmmmddo', 'ommmmmdddo', '.ommmdddo.', '..oooooo..'],
  ['oooooooooo', 'ohhhhhhhmo', 'ohwmmmmmdo', 'ohmmmmmmdo', 'ohmmmmmmdo', 'ohmmmmmmdo', 'ohmmmmmmdo', 'omdddddddo', 'oooooooooo'],
  ['..oooooo..', '.ohhhhhmo.', 'ohhwmmmmdo', 'ohmmmmmmdo', 'ohmmmmmmdo', 'ohmmmmmmdo', 'ommmmmmddo', '.oddddddo.', '..oooooo..'],
  ['....oo....', '...ohmo...', '..ohwmmo..', '.ohhmmmdo.', 'ohhmmmmddo', '.ommmmddo.', '..ommddo..', '...oddo...', '....oo....'],
  ['.oo....oo.', 'ohhoo.ohmo', 'ohwhmomhmo', 'ohhmmmmmdo', 'ommmmmmmdo', '.ommmmmdo.', '..ommmdo..', '...omdo...', '....oo....'],
  ['..oooooo..', '.ohhhmmmo.', 'ohhmmmdmmo', 'ohmmmdmmdo', 'ommdmmmmdo', 'ommmdmmddo', 'odmmmmdddo', '.odddddo..', '..oooooo..'],
];
const GEM_TONES: readonly (readonly [string, string, string])[] = [
  ['#ffb0b8', '#f0384a', '#9a1430'],
  ['#b8e4ff', '#3a8af0', '#1a3e9a'],
  ['#b8ffd0', '#28c070', '#147040'],
  ['#fff4a8', '#ffc828', '#c07a10'],
  ['#f0c4ff', '#b04ae0', '#62208e'],
  ['#d8d4e0', '#9a96a8', '#5e5a6e'],
];
const GEM_PALETTES: readonly Palette[] = GEM_TONES.map(([h, m, d]) => ({ o: '#1a1226', h, m, d, w: '#ffffff' }));
const FLASH: Palette = { o: '#ffffff', h: '#ffffff', m: '#ffffff', d: '#ffffff', w: '#ffffff' };

// ---- the simulation: a round of play for one well, worked out once and cached ----

type Snap = readonly (readonly number[])[];
type Ev = {
  readonly t: number;
  readonly kind: 'land' | 'burst' | 'stones';
  readonly before: Snap;
  readonly after: Snap;
  readonly ids: readonly number[];
  readonly chain: number;
};
type Sim = { readonly kinds: readonly number[]; readonly start: Snap; readonly events: readonly Ev[]; readonly pairs: readonly number[] };

type Builder = { readonly kinds: number[]; readonly seed: number };

const gem = (b: Builder, kind: number): number => {
  b.kinds.push(kind);
  return b.kinds.length - 1;
};

// A color unlike the gems to the left and below, so the opening stack holds no ready-made matches.
const freshKind = (b: Builder, cols: readonly (readonly number[])[], c: number, r: number): number => {
  const avoid = new Set([cols[c - 1]?.[r], cols[c]?.[r - 1]].filter((id) => id !== undefined).map((id) => b.kinds[id as number]));
  for (let k = 0; k < 5; k++) {
    const kind = (Math.floor(rand(c * 31 + r, b.seed) * 5) + k) % 5;
    if (!avoid.has(kind)) return kind;
  }
  return 0;
};

const openingStack = (b: Builder): Snap => {
  const cols: number[][] = Array.from({ length: COLS }, () => []);
  for (let c = 0; c < COLS; c++) {
    const height = 4 + Math.floor(rand(c, b.seed + 1) * 4);
    for (let r = 0; r < height; r++) (cols[c] as number[]).push(gem(b, freshKind(b, cols, c, r)));
  }
  return cols;
};

// Where each gem sits in a state of the well; states never change, so each is mapped once.
const placed = new WeakMap<Snap, Map<number, readonly [number, number]>>();
const positions = (s: Snap): ReadonlyMap<number, readonly [number, number]> => {
  const hit = placed.get(s);
  if (hit) return hit;
  const out = new Map<number, readonly [number, number]>();
  s.forEach((col, c) => {
    col.forEach((id, r) => {
      out.set(id, [c, r]);
    });
  });
  placed.set(s, out);
  return out;
};

const idAt = (s: Snap, c: number, r: number): number | undefined => s[c]?.[r];

const NEIGHBOURS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

// How many gems sit above a gem: taking it lets them fall, which is what sets off the next link of a chain.
const gemsAbove = (s: Snap, pos: ReadonlyMap<number, readonly [number, number]>, id: number): number => {
  const [c, r] = pos.get(id) ?? [0, 0];
  return (s[c]?.length ?? 0) - r - 1;
};

// Four connected gems (stones never join) grown from a starting gem. A chain link must not be made only of gems that fell
// together (they would have matched before falling), so gems in `fellWith` come last; then gems with others on top.
const growGroup = (s: Snap, kinds: readonly number[], from: number, fellWith: readonly number[] = []): readonly number[] => {
  const pos = positions(s);
  const group = [from];
  const rank = (id: number): number => (fellWith.includes(id) ? -100 : 0) + gemsAbove(s, pos, id);
  while (group.length < 4) {
    const options = group.flatMap((id) => {
      const [c, r] = pos.get(id) ?? [0, 0];
      return NEIGHBOURS.map(([dc, dr]) => idAt(s, c + dc, r + dr)).filter(
        (n): n is number => n !== undefined && !group.includes(n) && kinds[n] !== ROCK,
      );
    });
    const next = options.sort((a, z) => rank(z) - rank(a))[0];
    if (next === undefined) break;
    group.push(next);
  }
  return group;
};

// The stones touching a burst crumble with it.
const withStones = (s: Snap, kinds: readonly number[], group: readonly number[]): readonly number[] => {
  const pos = positions(s);
  const near = group.flatMap((id) => {
    const [c, r] = pos.get(id) ?? [0, 0];
    return NEIGHBOURS.map(([dc, dr]) => idAt(s, c + dc, r + dr)).filter((n): n is number => n !== undefined && kinds[n] === ROCK);
  });
  return [...new Set([...group, ...near])];
};

const without = (s: Snap, ids: readonly number[]): Snap => s.map((col) => col.filter((id) => !ids.includes(id)));

const lowestColumn = (s: Snap, seed: number): number => {
  const order = Array.from({ length: COLS }, (_, c) => c).sort(
    (a, z) => (s[a]?.length ?? 0) - (s[z]?.length ?? 0) || rand(a, seed) - rand(z, seed),
  );
  return order[Math.floor(rand(seed, 3) * 2)] ?? 0;
};

const chainsOf = (board: number, round: number, cycle: number): number => 2 + Math.floor(rand(cycle * 13 + board, round * 7 + 5) * 2);

const stonesFor = (board: number, round: number, cycle: number): number => {
  const rival = 1 - board;
  const from = board === 0 ? cycle - 1 : cycle;
  const sent = from < 0 ? 1 : chainsOf(rival, round, from);
  return Math.max(0, sent - 2) * 3;
};

type Step = { readonly s: Snap; readonly events: Ev[] };

const landPair = (b: Builder, st: Step, t: number, cycle: number): Step => {
  const col = lowestColumn(st.s, b.seed + cycle * 17);
  const pair = [gem(b, Math.floor(rand(cycle, b.seed + 9) * 5)), gem(b, Math.floor(rand(cycle, b.seed + 10) * 5))];
  const after = st.s.map((c, i) => (i === col ? [...c, ...pair].slice(0, ROWS) : c));
  st.events.push({ t, kind: 'land', before: st.s, after, ids: pair, chain: 0 });
  return { s: after, events: st.events };
};

// Gems a burst left hanging fall into new company; the next link of the chain grows from one of them.
const movedBy = (e: Ev | undefined, kinds: readonly number[]): readonly number[] => {
  if (e?.kind !== 'burst') return [];
  const before = positions(e.before);
  return [...positions(e.after).entries()]
    .filter(([id, [, row]]) => (before.get(id)?.[1] ?? row) !== row && kinds[id] !== ROCK)
    .map(([id]) => id);
};

// The patch of one color around a gem, flood-filled through its neighbours.
const patchOf = (s: Snap, kindOf: (id: number) => number | undefined, from: number): ReadonlySet<number> => {
  const pos = positions(s);
  const kind = kindOf(from);
  const seen = new Set([from]);
  const queue = [from];
  while (queue.length > 0) {
    const [c, r] = pos.get(queue.pop() as number) ?? [0, 0];
    for (const [dc, dr] of NEIGHBOURS) {
      const n = idAt(s, c + dc, r + dr);
      if (n === undefined || seen.has(n) || kindOf(n) !== kind) continue;
      seen.add(n);
      queue.push(n);
    }
  }
  return seen;
};

const recolored =
  (kinds: readonly number[], group: readonly number[], kind: number) =>
  (id: number): number | undefined =>
    group.includes(id) ? kind : kinds[id];

// A group's color must not have made a patch of four earlier in the round: it would have burst back then. In the
// last few beats, while the stack is still falling into place, a patch of four is let pass (nobody counts that fast).
type Past = { readonly s: Snap; readonly recent: boolean };

const fits = (history: readonly Past[], kinds: readonly number[], group: readonly number[], kind: number): boolean => {
  const kindOf = recolored(kinds, group, kind);
  const present = (s: Snap): readonly number[] => group.filter((id) => s.some((col) => col.includes(id)));
  return !history.some((p) => present(p.s).some((id) => patchOf(p.s, kindOf, id).size >= (p.recent ? 5 : 4)));
};

const groupKind = (st: Step, t: number, kinds: readonly number[], group: readonly number[], prefer: number): number | undefined => {
  const history = st.events.map((e) => ({ s: e.before, recent: t - e.t < 10 }));
  return [prefer, 0, 1, 2, 3, 4].find((k) => fits(history, kinds, group, k));
};

// Where a chain link starts: a gem the last burst sent falling, else any gem with others stacked on it.
const linkSeed = (st: Step, kinds: readonly number[], pick: number): number | undefined => {
  const moved = movedBy(st.events.at(-1), kinds);
  const pos = positions(st.s);
  const pool = moved.length > 0 ? moved : [...pos.keys()].filter((id) => kinds[id] !== ROCK && gemsAbove(st.s, pos, id) > 0);
  return pool[Math.floor(pick * pool.length)];
};

const burst = (b: Builder, st: Step, t: number, chain: number, from: number | undefined): Step => {
  const seedId = from ?? linkSeed(st, b.kinds, rand(chain, b.kinds.length + b.seed));
  if (seedId === undefined || b.kinds[seedId] === ROCK) return st;
  const group = growGroup(st.s, b.kinds, seedId, from === undefined ? movedBy(st.events.at(-1), b.kinds) : []);
  if (group.length < 4) return st;
  const kind = groupKind(st, t, b.kinds, group, b.kinds[seedId] as number);
  if (kind === undefined) return st;
  for (const id of group) b.kinds[id] = kind;
  const patch = [...patchOf(st.s, recolored(b.kinds, group, kind), group[0] as number)];
  const gone = withStones(st.s, b.kinds, patch);
  const after = without(st.s, gone);
  st.events.push({ t, kind: 'burst', before: st.s, after, ids: gone, chain });
  return { s: after, events: st.events };
};

const dropStones = (b: Builder, st: Step, t: number, count: number): Step => {
  if (count <= 0) return st;
  const ids: number[] = [];
  const after = st.s.map((col, c) => {
    const n = Math.floor(count / COLS) + (c < count % COLS ? 1 : 0);
    const add = Array.from({ length: n }, () => gem(b, ROCK));
    ids.push(...add);
    return [...col, ...add].slice(0, ROWS);
  });
  st.events.push({ t, kind: 'stones', before: st.s, after, ids, chain: 0 });
  return { s: after, events: st.events };
};

const playCycle = (b: Builder, st0: Step, board: number, round: number, cycle: number): Step => {
  const start = (board === 0 ? 0 : 4) + cycle * CYCLE;
  let st = landPair(b, st0, start + 4, cycle);
  const pair = st.events.at(-1)?.ids[1];
  const chains = chainsOf(board, round, cycle);
  for (let k = 0; k < chains && (k === 0 || st.events.at(-1)?.chain === k); k++)
    st = burst(b, st, start + 4 + k, k + 1, k === 0 ? pair : undefined);
  return dropStones(b, st, start + 7.5, stonesFor(board, round, cycle));
};

const simulate = (board: number, round: number): Sim => {
  const b: Builder = { kinds: [], seed: board * 7919 + round * 104729 + 11 };
  const start = openingStack(b);
  let st: Step = { s: start, events: [] };
  const cycles = board === 0 ? ROUND_BEATS / CYCLE : ROUND_BEATS / CYCLE - 1;
  const pairs: number[] = [];
  for (let k = 0; k < cycles; k++) {
    st = playCycle(b, st, board, round, k);
    pairs.push(...(st.events.find((e) => e.kind === 'land' && e.t === (board === 0 ? 0 : 4) + k * CYCLE + 4)?.ids ?? []));
  }
  return { kinds: b.kinds, start, events: st.events, pairs };
};

const sims = new Map<string, Sim>();
const simOf = (board: number, round: number): Sim => cached(sims, 8, `${board}:${round}`, () => simulate(board, round));

// ---- what a well shows at a moment ----

type Clock = { readonly round: number; readonly at: number };
const clockOf = (beat: number): Clock => {
  const b = Math.max(0, beat);
  const round = Math.floor(b / ROUND_BEATS);
  return { round, at: b - round * ROUND_BEATS };
};

const lastEvent = (sim: Sim, at: number): Ev | undefined => {
  let hit: Ev | undefined;
  for (const e of sim.events) if (e.t <= at) hit = e;
  return hit;
};

type Placed = { readonly id: number; readonly col: number; readonly row: number; readonly flash: boolean };

// Gems that fall after a burst or a landing slide down over the first half beat after it.
const settle = (e: Ev, at: number): readonly Placed[] => {
  const before = positions(e.before);
  const fall = e.kind === 'burst' ? Math.min(1, Math.max(0, (at - e.t - 0.4) / 0.35)) : 1;
  const out: Placed[] = [];
  e.after.forEach((col, c) => {
    col.forEach((id, r) => {
      const from = before.get(id);
      const fromRow = from ? from[1] : r + Math.max(0, 1 - (at - e.t) * 4) * 6;
      out.push({ id, col: c, row: fromRow + (r - fromRow) * (from ? fall : 1), flash: false });
    });
  });
  return out;
};

const flashing = (e: Ev): readonly Placed[] => {
  const pos = positions(e.before);
  return [...pos.entries()].map(([id, [col, row]]) => ({ id, col, row, flash: e.ids.includes(id) }));
};

const placedAt = (sim: Sim, at: number): readonly Placed[] => {
  const e = lastEvent(sim, at);
  if (!e) return [...positions(sim.start).entries()].map(([id, [col, row]]) => ({ id, col, row, flash: false }));
  if (e.kind === 'burst' && at - e.t < 0.4) return flashing(e);
  return settle(e, at);
};

// ---- layout ----

type Layout = {
  readonly wide: boolean;
  readonly wells: readonly [Box, Box];
  readonly faces: readonly [readonly [number, number], readonly [number, number]];
  readonly next: readonly [readonly [number, number], readonly [number, number]];
  readonly vs: readonly [number, number];
};

const WELL_W = COLS * CELL;
const WELL_H = ROWS * CELL;

const layoutOf = (f: Frame): Layout => {
  if (f.w > f.h) {
    const margin = Math.max(8, Math.round((f.w - WELL_W * 2 - 120) / 2));
    const y = Math.round((f.h - WELL_H) / 2) + 4;
    const a = { x: margin, y, w: WELL_W, h: WELL_H };
    const b = { x: f.w - margin - WELL_W, y, w: WELL_W, h: WELL_H };
    const mid = f.w / 2;
    return {
      wide: true,
      wells: [a, b],
      faces: [
        [Math.round(mid - 40), 28],
        [Math.round(mid + 4), 28],
      ],
      next: [
        [a.x + WELL_W + 8, y + 72],
        [b.x - 22, y + 72],
      ],
      vs: [Math.round(mid), 76],
    };
  }
  const gap = 9;
  const x0 = Math.round((f.w - WELL_W * 2 - gap) / 2);
  const top = Math.round((f.h - (WELL_H + 128)) / 2);
  const y = top + 96;
  return {
    wide: false,
    wells: [
      { x: x0, y, w: WELL_W, h: WELL_H },
      { x: x0 + WELL_W + gap, y, w: WELL_W, h: WELL_H },
    ],
    faces: [
      [x0 + 4, top + 22],
      [f.w - x0 - 40, top + 22],
    ],
    next: [
      [x0 + 2, y + WELL_H + 12],
      [x0 + WELL_W * 2 + gap - 16, y + WELL_H + 12],
    ],
    vs: [Math.round(f.w / 2), top + 44],
  };
};

// ---- background ----

const backdrop = (f: Frame, c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`gem-bg:${sigOf(c)}`, f.w, f.h, (g) => {
    g.drawImage(ditherGradient(f.w, f.h, [c.bg0, c.bg1, c.bg2]), 0, 0);
  });

// Diamonds drifting diagonally behind the wells, the way puzzle games fill their backgrounds.
const background = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  ctx.drawImage(backdrop(f, c), 0, 0);
  const step = 24;
  const shift = (f.t * 6) % step;
  ctx.fillStyle = c.pattern;
  for (let y = -step; y < f.h + step; y += step)
    for (let x = -step; x < f.w + step; x += step) {
      const cx = Math.round(x + shift + ((y / step) % 2) * (step / 2));
      const cy = Math.round(y + shift);
      for (let k = -3; k <= 3; k++) ctx.fillRect(cx - (3 - Math.abs(k)), cy + k, (3 - Math.abs(k)) * 2 + 1, 1);
    }
};

// ---- the wells ----

const wellFrame = (c: Colors<K>): HTMLCanvasElement =>
  memoLayer(`gem-well:${sigOf(c)}`, WELL_W + 8, WELL_H + 8, (g) => {
    fillRect(g, c.ink, 0, 0, WELL_W + 8, WELL_H + 8);
    fillRect(g, c.frameLo, 1, 1, WELL_W + 6, WELL_H + 6);
    fillRect(g, c.frame, 2, 2, WELL_W + 4, WELL_H + 4);
    fillRect(g, c.frameHi, 2, 2, WELL_W + 4, 1);
    fillRect(g, c.ink, 3, 3, WELL_W + 2, WELL_H + 2);
    g.drawImage(ditherGradient(WELL_W, WELL_H, [c.well, c.ink]), 4, 4);
    for (let x = 1; x < COLS; x++) for (let y = 4; y < WELL_H + 4; y += 2) fillRect(g, c.grid, 4 + x * CELL, y, 1, 1);
  });

const cellXY = (w: Box, col: number, row: number): readonly [number, number] => [
  w.x + col * CELL + 1,
  Math.round(w.y + (ROWS - 1 - row) * CELL + 1),
];

const drawGem = (ctx: Ctx, kind: number, x: number, y: number, flash: boolean, beat: number): void => {
  const shape = GEM_SHAPES[kind] as Sprite;
  const bright = flash && frac(beat * 6) < 0.5;
  drawSprite(ctx, shape, bright ? FLASH : (GEM_PALETTES[kind] as Palette), x, y + (shape.length < 10 ? 1 : 0));
};

const wellOf = (ctx: Ctx, f: Frame, board: 0 | 1, c: Colors<K>): void => {
  const l = layoutOf(f);
  const w = l.wells[board];
  ctx.drawImage(wellFrame(c), w.x - 4, w.y - 4);
  const { round, at } = clockOf(f.beat);
  const sim = simOf(board, round);
  for (const p of placedAt(sim, at)) {
    const [x, y] = cellXY(w, p.col, p.row);
    drawGem(ctx, sim.kinds[p.id] ?? 0, x, y, p.flash, f.beat);
  }
  fallingPair(ctx, f, w, sim, at);
  fallingStones(ctx, w, sim, at);
  pops(ctx, w, sim, at, c);
};

const wells = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  wellOf(ctx, f, 0, c);
  wellOf(ctx, f, 1, c);
};

// The pair drops one cell every half beat until it lands on the fourth beat of the cycle.
const fallingPair = (ctx: Ctx, f: Frame, w: Box, sim: Sim, at: number): void => {
  const land = sim.events.find((e) => e.kind === 'land' && e.t > at && e.t - at <= 4);
  if (!land) return;
  const [a, b] = land.ids;
  const pos = positions(land.after);
  const [col, row] = pos.get(a ?? 0) ?? [0, 0];
  const drop = Math.floor((land.t - at) * 2) * 1.5;
  for (const [id, dr] of [
    [a, 0],
    [b, 1],
  ] as const) {
    if (id === undefined) continue;
    const [x, y] = cellXY(w, col, row + drop + dr);
    if (y >= w.y - 2) drawGem(ctx, sim.kinds[id] ?? 0, x, y, false, f.beat);
  }
};

const fallingStones = (ctx: Ctx, w: Box, sim: Sim, at: number): void => {
  const e = sim.events.find((ev) => ev.kind === 'stones' && ev.t > at && ev.t - at < 0.6);
  if (!e) return;
  const pos = positions(e.after);
  for (const id of e.ids) {
    const [col, row] = pos.get(id) ?? [0, 0];
    const [x, y] = cellXY(w, col, row + (e.t - at) * 20);
    if (y >= w.y - 2) drawGem(ctx, ROCK, x, y, false, 0);
  }
};

// Each burst throws out sparks from the gems it took and shows its chain count over the well.
const pops = (ctx: Ctx, w: Box, sim: Sim, at: number, c: Colors<K>): void => {
  for (const e of sim.events) {
    const age = at - e.t - 0.4;
    if (e.kind !== 'burst' || age < 0 || age > 1.4) continue;
    const pos = positions(e.before);
    for (const id of e.ids) sparks(ctx, w, pos.get(id) ?? [0, 0], age, sim.kinds[id] ?? 0, id);
    if (e.chain >= 2) chainCall(ctx, e.chain, w.x + WELL_W / 2, w.y + 44 - e.chain * 4, age / 1.4, c);
  }
};

// "CHAIN x2": it jumps up over the well and blinks out.
const chainCall = (ctx: Ctx, n: number, cx: number, y: number, age: number, c: Colors<K>): void => {
  if (age > 0.75 && frac(age * 10) < 0.5) return;
  const text = `CHAIN x${n}`;
  const rise = Math.round(Math.min(1, age * 3) * 10);
  drawWordsOutlined(ctx, text, Math.round(cx - wordsWidth(text) / 2), y - rise, n >= 3 ? c.text : c.gold, c.ink);
};

const sparks = (ctx: Ctx, w: Box, at: readonly [number, number], age: number, kind: number, id: number): void => {
  if (age > 0.6) return;
  const [x, y] = cellXY(w, at[0], at[1]);
  const tone = (GEM_TONES[kind] ?? GEM_TONES[0]) as readonly [string, string, string];
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + id;
    const r = 2 + age * 22;
    fillRect(ctx, k % 2 === 0 ? tone[0] : '#ffffff', Math.round(x + 5 + Math.cos(a) * r), Math.round(y + 5 + Math.sin(a) * r), 2, 2);
  }
};

// ---- the HUD: scores, the next pair, round calls ----

const scoreOf = (sim: Sim, at: number): number =>
  sim.events.filter((e) => e.kind === 'burst' && e.t <= at).reduce((sum, e) => sum + e.ids.length * 10 * e.chain * e.chain, 0);

const hud = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const { round, at } = clockOf(f.beat);
  for (const board of [0, 1] as const) {
    const w = l.wells[board];
    const sim = simOf(board, round);
    const text = digits(scoreOf(sim, at) + round * 1000, 6);
    drawTextOutlined(ctx, text, Math.round(w.x + (WELL_W - textWidth(text)) / 2), w.y - 14, c.text, c.ink);
    nextBox(ctx, f, l.next[board], sim, board, at, c);
  }
  if (at < 3) {
    const word = at < 1.8 ? `ROUND ${(round % 9) + 1}` : 'GO!';
    if (frac(at * 4) < 0.75) textCentered(ctx, word, f.w / 2, Math.round(f.h * (l.wide ? 0.55 : 0.5)), c.gold, c.ink);
  }
};

const nextBox = (ctx: Ctx, f: Frame, at: readonly [number, number], sim: Sim, board: number, now: number, c: Colors<K>): void => {
  const [x, y] = at;
  fillRect(ctx, c.ink, x - 1, y - 9, 16, 37);
  fillRect(ctx, c.panel, x, y - 8, 14, 35);
  drawText(ctx, 'N', x + 5, y - 7, c.gold);
  const cycle = Math.max(0, Math.floor((now - (board === 0 ? 0 : 4)) / CYCLE) + 1);
  const a = sim.pairs[cycle * 2];
  const b = sim.pairs[cycle * 2 + 1];
  if (b !== undefined) drawGem(ctx, sim.kinds[b] ?? 0, x + 2, y + 2, false, f.beat);
  if (a !== undefined) drawGem(ctx, sim.kinds[a] ?? 0, x + 2, y + 14, false, f.beat);
};

// ---- the rivals: two chibi girls whose faces follow the fight ----

const FW = 36;
const FH = 40;
const FX = 18;

type Style = 'twin' | 'hime';

const smooth01 = (k: number): number => {
  const t = Math.min(1, Math.max(0, k));
  return t * t * (3 - 2 * t);
};
const dx = (x: number): number => Math.abs(x + 0.5 - FX);
const faceHalf = (y: number): number => (y < 9 || y > 28 ? -1 : y <= 20 ? 11.5 : 11.5 - (y - 20) * 1.1 - ((y - 20) / 8) ** 2 * 2);
const inHead = (x: number, y: number): boolean => inEllipse(x + 0.5, y, FX, 16, 13.5, 13);
const TWIN_TIPS = [8, 12, 16, 20, 24, 28];
const bangsOf = (style: Style, x: number): number => {
  if (style === 'hime') return 14 + (x % 5 === 0 ? 1 : 0);
  return TWIN_TIPS.reduce((low, tx, i) => Math.max(low, 13 + (i % 2) * 2 - Math.abs(x + 0.5 - tx) * 1.3), 0);
};

const twinTail = (x: number, y: number): boolean => inEllipse(dx(x), y, 15.5, 23, 4.2, 10.5) && dx(x) > 11;
const himeLock = (x: number, y: number): boolean => dx(x) >= 9.5 && dx(x) <= 13.5 && y >= 12 && y <= 37;

const hairExtra = (style: Style, x: number, y: number): boolean => (style === 'twin' ? twinTail(x, y) : himeLock(x, y));

const outfitTone = (style: Style, x: number, y: number): string => {
  const d = dx(x);
  if (style === 'hime') return y < 32 && d < 5 ? 'w' : d < 1 && y > 33 ? 'Y' : 'y';
  if (y < 33 && d < 4 + (y - 29)) return 'w';
  return (d > 2.5 && d < 3.5 && y > 33) || (y > 36 && d < 1) ? 'Y' : 'y';
};

const hairTone = (style: Style, x: number, y: number): string => {
  if (style === 'hime' && y >= 6 && y <= 7 && inHead(x, y)) return 'k';
  const ring = Math.hypot(x + 0.5 - FX, y - 18);
  if (ring > 10 && ring < 11.6 && y < 12 && x % 4 !== 1) return 'l';
  if (y > bangsOf(style, x) - 3 && y < bangsOf(style, x)) return 'd';
  return x + 0.5 - FX > 9 ? 'd' : 'h';
};

const facePixel = (style: Style, x: number, y: number): string | null => {
  if (inHead(x, y) && y < bangsOf(style, x)) return hairTone(style, x, y);
  if (dx(x) <= faceHalf(y)) return y < bangsOf(style, x) + 1.5 ? 'S' : 's';
  return null;
};

const chibiPixel =
  (style: Style) =>
  (x: number, y: number): string => {
    const face = facePixel(style, x, y);
    if (face) return face;
    if (y >= 27 && y < 31 && dx(x) <= 2.5) return 'S';
    if (y >= 29 && dx(x) <= 5 + 11 * smooth01((y - 28) / 7)) return outfitTone(style, x, y);
    if (inHead(x, y) || hairExtra(style, x, y)) return hairTone(style, x, y);
    if (style === 'hime' && y > 14 && dx(x) < 15) return 'd';
    return '.';
  };

const CHIBI: Readonly<Record<Style, Sprite>> = {
  twin: outlined(spriteOf(FW, FH, chibiPixel('twin')), 'o'),
  hime: outlined(spriteOf(FW, FH, chibiPixel('hime')), 'o'),
};

// h/l/d hair, k headband, s/S skin, y/Y/w outfit; the face parts e/i/j/w and m/t.
const RIVAL_COLORS: readonly Palette[] = [
  {
    o: '#2a1420',
    h: '#ff7a5a',
    l: '#ffc4a4',
    d: '#c84a3a',
    k: '#2a1a2a',
    s: '#ffe4d0',
    S: '#f4b8a0',
    y: '#ffd84a',
    Y: '#e09a1e',
    w: '#ffffff',
    e: '#1a2a3a',
    i: '#2aa8a8',
    j: '#a8fff0',
    m: '#8a2a3a',
    t: '#ff8a9a',
    b: '#ff9aa0',
  },
  {
    o: '#1a1a2a',
    h: '#6ad8b0',
    l: '#d0fff0',
    d: '#2a9a80',
    k: '#2a2034',
    s: '#fff0e4',
    S: '#f0c4b0',
    y: '#7a4ab0',
    Y: '#4e2a80',
    w: '#ffffff',
    e: '#2a1a2a',
    i: '#c84a8a',
    j: '#ffb0d8',
    m: '#7a2a4a',
    t: '#ff8aa8',
    b: '#ffa0b8',
  },
];

const EYE_OPEN: Sprite = ['.oooo.', 'oeeeeo', 'oeeeeo', 'oiiiio', 'oiijio', 'oijjio', '.oooo.'];
const EYE_HAPPY: Sprite = ['......', '......', '..oo..', '.o..o.', 'o....o', '......', '......'];
const EYE_HURT: Sprite = ['o.....', '.oo...', '...oo.', '.oo...', 'o.....', '......', '......'];
const EYE_SHUT: Sprite = ['......', '......', '......', '......', 'oooooo', '......', '......'];
const MOUTH_IDLE: Sprite = ['o..o', '.oo.'];
const MOUTH_OPEN: Sprite = ['.oo.', 'ommo', 'otto', '.oo.'];
const MOUTH_HURT: Sprite = ['.o.o', 'o.o.'];

type Mood = 'idle' | 'attack' | 'hurt';

const moodOf = (board: number, beat: number): Mood => {
  const { round, at } = clockOf(beat);
  const mine = simOf(board, round).events;
  if (mine.some((e) => e.kind === 'burst' && e.chain >= 2 && at >= e.t && at - e.t < 1.6)) return 'attack';
  if (mine.some((e) => e.kind === 'stones' && at >= e.t - 0.5 && at - e.t < 1.5)) return 'hurt';
  return 'idle';
};

const face = (ctx: Ctx, f: Frame, x: number, y: number, mood: Mood, p: Palette, seed: number): void => {
  const eye = mood === 'attack' ? EYE_HAPPY : mood === 'hurt' ? EYE_HURT : blinking(f.t, seed) ? EYE_SHUT : EYE_OPEN;
  drawSprite(ctx, eye, p, x + 9, y + 15);
  drawSprite(ctx, flipped(eye), p, x + 21, y + 15);
  if (eye === EYE_OPEN) {
    fillRect(ctx, '#ffffff', x + 10, y + 16, 2, 2);
    fillRect(ctx, '#ffffff', x + 22, y + 16, 2, 2);
  }
  fillRect(ctx, p.b ?? '#ff9aa0', x + 8, y + 22, 3, 1);
  fillRect(ctx, p.b ?? '#ff9aa0', x + 25, y + 22, 3, 1);
  const mouth = mood === 'attack' ? MOUTH_OPEN : mood === 'hurt' ? MOUTH_HURT : MOUTH_IDLE;
  drawSprite(ctx, mouth, p, x + 16, y + 23);
};

const STAR: Sprite = ['..o..', '.oyo.', 'oyyyo', '.oyo.', 'o.o.o'];
const DROP: Sprite = ['.o.', 'owo', 'owo', '.o.'];

const rivals = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const styles: readonly Style[] = ['twin', 'hime'];
  styles.forEach((style, board) => {
    const [x0, y0] = l.faces[board] as readonly [number, number];
    const mood = moodOf(board, f.beat);
    const hop = mood === 'attack' ? (frac(f.beat * 2) < 0.5 ? -3 : -1) : frac(f.beat) < 0.2 ? -1 : 0;
    const shake = mood === 'hurt' ? (Math.floor(f.t * 20) % 2 === 0 ? -1 : 1) : 0;
    const x = x0 + shake;
    const y = y0 + hop;
    const palette = RIVAL_COLORS[board] as Palette;
    const sprite = CHIBI[style];
    drawSprite(ctx, board === 1 ? flipped(sprite) : sprite, palette, x, y);
    face(ctx, f, x, y, mood, palette, board * 5 + 3);
    if (style === 'twin') for (const sx of [x + 3, x + 28]) drawSprite(ctx, STAR, { o: c.ink, y: c.gold }, sx, y + 7);
    if (mood === 'hurt') drawSprite(ctx, DROP, { o: c.ink, w: '#a8e0ff' }, x + 29, y + 8);
  });
  vs(ctx, f, c);
};

const vs = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const [x, y] = layoutOf(f).vs;
  const pump = f.kick > 0.6 ? 1 : 0;
  textCentered(ctx, 'VS', x, y - pump, c.gold, c.ink);
};

// A round clock between the wells, and a star for each round won.
const timer = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  const { round, at } = clockOf(f.beat);
  const x = Math.round(f.w / 2 - 26);
  const y = l.wide ? Math.round(f.h * 0.6) : l.wells[0].y + WELL_H + 12;
  fillRect(ctx, c.ink, x - 1, y - 1, 54, 34);
  fillRect(ctx, c.panel, x, y, 52, 32);
  fillRect(ctx, c.frameHi, x, y, 52, 1);
  textCentered(ctx, 'TIME', x + 26, y + 4, c.gold);
  textCentered(ctx, digits(99 - Math.floor(at * 1.5), 2), x + 26, y + 14, c.text);
  for (let k = 0; k < 3; k++) {
    for (const side of [0, 1]) {
      const won = k < (round + side) % 3;
      fillRect(ctx, won ? c.gold : c.grid, x + 4 + side * 34 + k * 5, y + 25, 3, 3);
    }
  }
};

// On tall screens the game's logo heads the screen: big outlined letters with a shine that sweeps across.
const logo = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  if (l.wide) return;
  const text = 'GEM DUEL';
  const w = textWidth(text) * 2;
  const x = Math.round((f.w - w) / 2);
  const y = Math.max(10, l.faces[0][1] - 52);
  const shine = Math.floor(wrap(f.t * 40, w + 60)) - 30;
  for (const [dx, dy] of [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [1, 1],
    [2, 2],
  ] as const)
    forEachTextPixel(text, (px, py) => fillRect(ctx, c.ink, x + px * 2 + dx, y + py * 2 + dy, 2, 2));
  forEachTextPixel(text, (px, py) =>
    fillRect(ctx, Math.abs(px * 2 - shine) < 4 ? c.frameHi : py < 3 ? c.gold : c.frame, x + px * 2, y + py * 2, 2, 2),
  );
};

const ticker = (ctx: Ctx, f: Frame, c: Colors<K>): void => {
  const l = layoutOf(f);
  if (l.wide) return;
  const text = 'GEM DUEL  CHAIN TO WIN  ';
  const w = textWidth(text);
  const y = f.h - 16;
  fillRect(ctx, c.ink, 0, y - 3, f.w, 13);
  for (let x = -Math.round(wrap(f.t * 20, w)); x < f.w; x += w) drawText(ctx, text, x, y, c.frameHi);
};

export const gemDuel = defineScene<K>({
  id: 'gem-duel',
  title: 'Gem Duel',
  mood: { valence: 0.6, energy: 0.6 },
  styles: ['puzzle-pop', 'nineties-pop', 'neon-rush', 'eurobeat', 'technopop'],
  variants: [
    {
      mood: { valence: 0.6, energy: 0.6 },
      colors: {
        bg0: '#3a1a6a',
        bg1: '#8a3a9a',
        bg2: '#ff7aa8',
        pattern: '#a04aa8',
        well: '#1e1440',
        grid: '#3a2a6a',
        frame: '#ffc84a',
        frameHi: '#fff4b0',
        frameLo: '#a8641e',
        panel: '#2a1a4a',
        text: '#ffffff',
        gold: '#ffe04a',
        ink: '#120a1e',
      },
    },
    {
      mood: { valence: -0.2, energy: 0.5 },
      colors: {
        bg0: '#06121e',
        bg1: '#0e2a40',
        bg2: '#14506a',
        pattern: '#12384e',
        well: '#081420',
        grid: '#1a3a4e',
        frame: '#3ae0e0',
        frameHi: '#c8ffff',
        frameLo: '#1a7a8a',
        panel: '#0a1e2e',
        text: '#e8ffff',
        gold: '#ff7ad8',
        ink: '#02060c',
      },
    },
    {
      mood: { valence: 0.7, energy: 0.1 },
      colors: {
        bg0: '#7ad0c8',
        bg1: '#b0e8d8',
        bg2: '#fff0c8',
        pattern: '#9adccc',
        well: '#2a3a5a',
        grid: '#4a5a7a',
        frame: '#ff9ab0',
        frameHi: '#ffe0e8',
        frameLo: '#c05a7a',
        panel: '#3a4a6a',
        text: '#ffffff',
        gold: '#ffe04a',
        ink: '#1a1a2e',
      },
    },
  ],
  layers: [background, wells, hud, rivals, timer, logo, ticker],
});
