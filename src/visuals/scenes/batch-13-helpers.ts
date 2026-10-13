// Shared pieces for the animals of batch 13: creatures described by a function of their own coordinates, so one
// figure can be squashed on the beat, tilted as it sways or nods off, and shown with its eyes shut. Each pose is
// rasterised once, outlined, and cached, so drawing it is a single cached sprite.
import { type Ctx, drawSprite, fillRect, type Palette, type Sprite } from 'mojipx';
import { cached, disc } from '../kit.ts';
import { outlined, spriteOf } from './batch-12-helpers.ts';

/**
 * A creature's look: the palette letter at (x, y), or null where it is clear. Coordinates are the creature's own:
 * the origin lies between its feet (or where it meets the counter), x runs right and y runs down, so the body has y < 0.
 */
export type Look = (x: number, y: number, shut: boolean) => string | null;

/** A creature: its look and the box it fills, x in [-w/2, w/2] and y in [-h, 0]. */
export type Figure = { readonly name: string; readonly look: Look; readonly w: number; readonly h: number };

/** How a creature stands: squashed (0 upright, 1 or 2 a beat's squash), tilted (radians, positive leans right), eyes shut. */
export type Pose = { readonly squash: number; readonly tilt: number; readonly shut: boolean };

export const UPRIGHT: Pose = { squash: 0, tilt: 0, shut: false };

const SQUASH = 0.06;
const TILT_STEP = 0.02;

/** Where a point of the creature lands in a pose, relative to the point between its feet. */
export const placeOf = (pose: Pose, x: number, y: number): readonly [number, number] => {
  const sx = x * (1 + pose.squash * SQUASH);
  const sy = y * (1 - pose.squash * SQUASH);
  const cos = Math.cos(pose.tilt);
  const sin = Math.sin(pose.tilt);
  return [Math.round(sx * cos - sy * sin), Math.round(sx * sin + sy * cos)];
};

// The pose's pixels: each sprite pixel is mapped back through the tilt and the squash to the creature's own coordinates.
const rasterOf = (fig: Figure, pose: Pose): Sprite => {
  const pad = Math.ceil(fig.h * Math.abs(Math.sin(pose.tilt))) + 2 + pose.squash;
  const w = fig.w + pad * 2;
  const h = fig.h + 3;
  const cos = Math.cos(pose.tilt);
  const sin = Math.sin(pose.tilt);
  const body = spriteOf(w, h, (col, row) => {
    const u = col + 0.5 - w / 2;
    const v = row + 0.5 - (h - 1);
    const x = (u * cos + v * sin) / (1 + pose.squash * SQUASH);
    const y = (v * cos - u * sin) / (1 - pose.squash * SQUASH);
    return fig.look(x, y, pose.shut) ?? '.';
  });
  return outlined(body, 'o');
};

const poses = new Map<string, Sprite>();

/** The creature's sprite in a pose (the tilt rounded to a few steps so the cache stays small). */
export const spriteOfPose = (fig: Figure, pose: Pose): Sprite => {
  const tilt = Math.round(pose.tilt / TILT_STEP) * TILT_STEP;
  const key = `${fig.name}:${pose.squash}:${tilt.toFixed(2)}:${pose.shut ? 1 : 0}`;
  return cached(poses, 480, key, () => rasterOf(fig, { ...pose, tilt }));
};

/** Draws the creature in a pose with the point between its feet at (x, y). */
export const drawFigure = (ctx: Ctx, fig: Figure, palette: Palette, pose: Pose, x: number, y: number): void => {
  const sprite = spriteOfPose(fig, pose);
  const w = (sprite[0] ?? '').length;
  drawSprite(ctx, sprite, palette, Math.round(x - w / 2), Math.round(y - (sprite.length - 1)));
};

// ---- small parts of faces, in a creature's own coordinates ----

/** Whether (x, y) lies in the ellipse centred on (cx, cy). */
export const inOval = (x: number, y: number, cx: number, cy: number, rx: number, ry: number): boolean =>
  ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

export type EyeSpot = { readonly x: number; readonly y: number; readonly rx: number; readonly ry: number };

/**
 * A tall cartoon eye at the spot: dark, with a glint high on the left (the light comes from there) and a lighter rim
 * low on the right. Shut, it is a sleepy curve sagging in the middle, or with `glad` a smiling arch. Returns the letter
 * for (x, y): e eye, w its lower rim, g glint, or null outside the eye.
 */
export const eyeAt = (x: number, y: number, eye: EyeSpot, shut: boolean, glad = false): string | null => {
  const dx = x - eye.x;
  const dy = y - eye.y;
  const bend = (Math.abs(dx) / eye.rx) ** 2 * 1.4 - 0.7;
  if (shut) return Math.abs(dy - (glad ? bend : -bend)) < 0.62 && Math.abs(dx) <= eye.rx + 0.3 ? 'e' : null;
  if (!inOval(x, y, eye.x, eye.y, eye.rx, eye.ry)) return null;
  if (inOval(x, y, eye.x - eye.rx * 0.35, eye.y - eye.ry * 0.4, Math.max(0.6, eye.rx * 0.42), eye.ry * 0.32)) return 'g';
  return dy > eye.ry * 0.45 && dx > -0.2 ? 'w' : 'e';
};

/** Whiskers: `count` one-pixel strokes on each side of a muzzle at (x, y), fanning out `len` pixels. */
export const whiskers = (ctx: Ctx, x: number, y: number, gap: number, len: number, color: string, count = 2): void => {
  for (let k = 0; k < count; k++)
    for (const dir of [-1, 1]) {
      for (let i = 0; i < len; i++) fillRect(ctx, color, x + dir * (gap + i), y + k * 2 - Math.floor((i * (1 - k)) / 3), 1, 1);
    }
};

export type Pt = readonly [number, number];

/** A tapering limb (a flipper, an arm) inside a one-pixel outline: discs shrinking from radius r0 at `from` to r1 at `to`. */
export const taper = (ctx: Ctx, from: Pt, to: Pt, r0: number, r1: number, fill: string, ink: string): void => {
  const steps = Math.max(1, Math.ceil(Math.hypot(to[0] - from[0], to[1] - from[1]) / 1.5));
  for (const [color, grow] of [
    [ink, 1],
    [fill, 0],
  ] as const)
    for (let k = 0; k <= steps; k++) {
      const u = k / steps;
      const x = from[0] + (to[0] - from[0]) * u;
      disc(ctx, x, from[1] + (to[1] - from[1]) * u, Math.round(r0 + (r1 - r0) * u) + grow, () => color);
    }
};
