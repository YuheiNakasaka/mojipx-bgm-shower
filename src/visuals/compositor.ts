// Puts the show on the canvas: the current shot, and while a transition runs, the outgoing shot
// dissolving into it through an ordered-dither mask (the way old hardware faded between screens).
import type { Ctx } from 'mojipx';
import { type DirectorState, transitionOf } from './director.ts';
import { bayer } from './kit.ts';
import type { Pulse } from './pulse.ts';
import type { Frame, Scene } from './scene.ts';

const LEVELS = 16;

// 4×4 masks: level n shows the n darkest Bayer cells. Built once per level.
const masks = new Map<number, HTMLCanvasElement>();
const maskOf = (level: number): HTMLCanvasElement => {
  const hit = masks.get(level);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 4;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#fff';
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (bayer(x, y) < level / LEVELS) ctx.fillRect(x, y, 1, 1);
  }
  masks.set(level, c);
  return c;
};

let buffer: HTMLCanvasElement | null = null;
const bufferOf = (w: number, h: number): CanvasRenderingContext2D | null => {
  if (!buffer) buffer = document.createElement('canvas');
  if (buffer.width !== w || buffer.height !== h) {
    buffer.width = w;
    buffer.height = h;
  }
  const ctx = buffer.getContext('2d');
  if (ctx) ctx.imageSmoothingEnabled = false;
  return ctx;
};

export type ShowInput = {
  readonly scenes: ReadonlyMap<string, Scene>;
  readonly director: DirectorState;
  readonly pulse: Pulse;
  readonly energy: number;
  readonly w: number;
  readonly h: number;
  readonly now: number;
};

const frameOf = (input: ShowInput, startedAt: number): Frame => ({
  w: input.w,
  h: input.h,
  t: Math.max(0, input.now - startedAt) / 1000,
  beat: input.pulse.beat,
  bar: input.pulse.bar,
  kick: input.pulse.kick,
  snare: input.pulse.snare,
  energy: input.energy,
});

// Before layout settles the stage can be a pixel or two; scenes lay themselves out from the size, so skip such frames.
const MIN_SIDE = 16;

export const drawShow = (ctx: Ctx, input: ShowInput): void => {
  if (input.w < MIN_SIDE || input.h < MIN_SIDE) return;
  const { director } = input;
  const current = input.scenes.get(director.shot.scene);
  if (!current) return;
  const progress = transitionOf(director, input.now);
  const outgoing = director.previous ? input.scenes.get(director.previous.scene) : undefined;
  if (progress >= 1 || !outgoing || !director.previous) {
    current.draw(ctx, frameOf(input, director.shot.startedAt), director.shot.variant);
    return;
  }
  outgoing.draw(ctx, frameOf(input, director.previous.startedAt), director.previous.variant);
  const level = Math.round(progress * LEVELS);
  if (level <= 0) return;
  const b = bufferOf(input.w, input.h);
  if (!b) return;
  b.globalCompositeOperation = 'source-over';
  current.draw(b, frameOf(input, director.shot.startedAt), director.shot.variant);
  if (level < LEVELS) {
    b.globalCompositeOperation = 'destination-in';
    const pattern = b.createPattern(maskOf(level), 'repeat');
    if (pattern) {
      b.fillStyle = pattern;
      b.fillRect(0, 0, input.w, input.h);
    }
    b.globalCompositeOperation = 'source-over';
  }
  ctx.drawImage(b.canvas, 0, 0);
};
