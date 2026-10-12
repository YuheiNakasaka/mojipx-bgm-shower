// A scene is a full-screen pixel animation drawn as a pure function of time and the music's pulse:
// it keeps no state between frames, so any frame can be drawn from the numbers it is given.
import type { Ctx } from 'mojipx';
import type { Mood } from '../domain/mood.ts';
import type { StyleId } from '../domain/music/styles.ts';

/** What a scene knows about the moment it draws. Sizes are in canvas pixels. */
export type Frame = {
  readonly w: number;
  readonly h: number;
  /** Seconds since the scene appeared. */
  readonly t: number;
  /** Beats since the track started (continuous), and whole bars. */
  readonly beat: number;
  readonly bar: number;
  /** 1 on a kick (or snare) and decaying toward 0 between hits. */
  readonly kick: number;
  readonly snare: number;
  /** The track's energy mapped to 0 (calm) … 1 (energetic). */
  readonly energy: number;
};

export type Colors<K extends string> = Readonly<Record<K, string>>;
export type Layer<K extends string> = (ctx: Ctx, f: Frame, c: Colors<K>) => void;

type SceneDef<K extends string> = {
  readonly id: string;
  readonly title: string;
  readonly mood: Mood;
  /** Styles this scene suits especially well. */
  readonly styles: readonly StyleId[];
  /** Color sets; the one nearest the track's mood is used. */
  readonly variants: readonly [
    { readonly mood: Mood; readonly colors: Colors<K> },
    ...{ readonly mood: Mood; readonly colors: Colors<K> }[],
  ];
  readonly layers: readonly Layer<K>[];
};

/** A scene with its colors bound: draw it with the index of a variant. */
export type Scene = {
  readonly id: string;
  readonly title: string;
  readonly mood: Mood;
  readonly styles: readonly StyleId[];
  readonly variantMoods: readonly Mood[];
  readonly draw: (ctx: Ctx, f: Frame, variant: number) => void;
};

export const defineScene = <K extends string>(def: SceneDef<K>): Scene => ({
  id: def.id,
  title: def.title,
  mood: def.mood,
  styles: def.styles,
  variantMoods: def.variants.map((v) => v.mood),
  draw: (ctx, f, variant) => {
    const colors = (def.variants[variant] ?? def.variants[0]).colors;
    for (const layer of def.layers) layer(ctx, f, colors);
  },
});
