// Choosing what plays next. Not uniform shuffle: each candidate gets a weight from how well it fits
// the asked mood, how smoothly it follows the current track (tempo and key, the way a DJ mixes),
// how long ago it last played, and whether it repeats the current style. Then one is drawn at random by weight.
import { affinity, type Mood } from './mood.ts';
import { type Key, keyDistance } from './music/theory.ts';
import { pickWeighted, type Rng } from './rng.ts';

export type Candidate = {
  readonly id: string;
  readonly mood: Mood;
  readonly bpm: number;
  readonly key: Key;
  readonly style: string;
};

export type PickInput<C extends Candidate> = {
  readonly library: readonly C[];
  /** The asked mood; null lets the mix drift from the current track's mood. */
  readonly target: Mood | null;
  readonly current: C | null;
  /** Ids played so far, oldest first. */
  readonly history: readonly string[];
};

const MOOD_SPREAD = 0.45;
const DRIFT_SPREAD = 0.7;
const TEMPO_SPREAD = 0.25;

/** 1 for the same tempo, falling with the tempo ratio; half and double time count as close. Never below 0.15. */
export const tempoFit = (from: number, to: number): number => {
  const r = Math.log2(to / from);
  const d = Math.min(Math.abs(r), Math.abs(r - 1), Math.abs(r + 1));
  return 0.15 + 0.85 * Math.exp(-((d / TEMPO_SPREAD) ** 2));
};

/** 1 for the same key, about 0.86 a fifth away, never below 0.35. */
export const keyFit = (from: Key, to: Key): number => 0.35 + 0.65 * Math.exp(-((keyDistance(from, to) / 2) ** 2));

/** 0 while a track is among the most recent plays, recovering toward 1 as it ages; 1 if never played. */
export const freshness = (id: string, history: readonly string[], librarySize: number): number => {
  const last = history.lastIndexOf(id);
  if (last === -1) return 1;
  const age = history.length - last;
  const blocked = Math.max(1, Math.min(8, Math.floor(librarySize / 2)));
  return age <= blocked ? 0 : 1 - 0.6 * 0.7 ** (age - blocked);
};

const varietyOf = <C extends Candidate>(c: C, input: PickInput<C>): number => {
  if (!input.current || input.current.style !== c.style) return 1;
  const before = input.library.find((x) => x.id === input.history.at(-2));
  return before?.style === c.style ? 0.25 : 0.6;
};

const moodFit = <C extends Candidate>(c: C, input: PickInput<C>): number => {
  if (input.target) return affinity(c.mood, input.target, MOOD_SPREAD) ** 2;
  return input.current ? affinity(c.mood, input.current.mood, DRIFT_SPREAD) : 1;
};

export const weightOf = <C extends Candidate>(c: C, input: PickInput<C>, strict: boolean): number => {
  if (input.current?.id === c.id) return 0;
  const flow = input.current ? tempoFit(input.current.bpm, c.bpm) * keyFit(input.current.key, c.key) : 1;
  const fresh = strict ? freshness(c.id, input.history, input.library.length) : 1;
  return moodFit(c, input) * flow * fresh * varietyOf(c, input);
};

/**
 * Bends the asked mood's energy up and down over a session (about six tracks per wave),
 * so a long mix builds and settles instead of staying flat.
 */
export const arcOf = (target: Mood, played: number): Mood => ({
  valence: target.valence,
  energy: Math.max(-1, Math.min(1, target.energy + 0.15 * Math.sin((2 * Math.PI * played) / 6))),
});

/** The next track and the next generator state. Falls back to ignoring freshness when nothing else fits. */
export const pickNext = <C extends Candidate>(rng: Rng, input: PickInput<C>): readonly [C, Rng] => {
  const pool = input.library.length > 1 ? input.library.filter((c) => c.id !== input.current?.id) : input.library;
  const shaped = input.target ? { ...input, target: arcOf(input.target, input.history.length) } : input;
  const strict = pool.some((c) => weightOf(c, shaped, true) > 0);
  return pickWeighted(rng, pool, (c) => weightOf(c, shaped, strict));
};
