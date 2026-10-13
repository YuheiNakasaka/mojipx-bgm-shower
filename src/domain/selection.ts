// Choosing what plays next. The listener's genre narrows the pool; then, not uniform shuffle: each candidate gets a
// weight from how close its mood is to the current track's, how smoothly it follows it (tempo and key, the way a DJ
// mixes), how long ago it last played, and whether it repeats the current style. Then one is drawn at random by weight.
import type { GenreId } from './genre.ts';
import { affinity, type Mood } from './mood.ts';
import { type Key, keyDistance } from './music/theory.ts';
import { pickWeighted, type Rng } from './rng.ts';

export type Candidate = {
  readonly id: string;
  readonly genre: GenreId;
  readonly mood: Mood;
  readonly bpm: number;
  readonly key: Key;
  readonly style: string;
};

export type PickInput<C extends Candidate> = {
  readonly library: readonly C[];
  /** The asked genre; null lets the mix roam every genre. */
  readonly genre: GenreId | null;
  readonly current: C | null;
  /** Ids played so far, oldest first. */
  readonly history: readonly string[];
};

const MOOD_SPREAD = 0.7;
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

/** Neighbouring moods follow each other more often, so the mix drifts instead of jumping. */
const moodFit = <C extends Candidate>(c: C, input: PickInput<C>): number =>
  input.current ? affinity(c.mood, input.current.mood, MOOD_SPREAD) : 1;

export const weightOf = <C extends Candidate>(c: C, input: PickInput<C>, strict: boolean): number => {
  if (input.current?.id === c.id) return 0;
  const flow = input.current ? tempoFit(input.current.bpm, c.bpm) * keyFit(input.current.key, c.key) : 1;
  const fresh = strict ? freshness(c.id, input.history, input.library.length) : 1;
  return moodFit(c, input) * flow * fresh * varietyOf(c, input);
};

/** The tracks of the asked genre, or every track when the genre is null or has none. */
export const inGenre = <C extends Candidate>(library: readonly C[], genre: GenreId | null): readonly C[] => {
  const picked = genre === null ? library : library.filter((c) => c.genre === genre);
  return picked.length > 0 ? picked : library;
};

/**
 * The next track and the next generator state. Freshness counts within the genre, so a small genre still rotates;
 * it is relaxed when nothing else fits.
 */
export const pickNext = <C extends Candidate>(rng: Rng, input: PickInput<C>): readonly [C, Rng] => {
  const scoped = { ...input, library: inGenre(input.library, input.genre) };
  const pool = scoped.library.length > 1 ? scoped.library.filter((c) => c.id !== input.current?.id) : scoped.library;
  const strict = pool.some((c) => weightOf(c, scoped, true) > 0);
  return pickWeighted(rng, pool, (c) => weightOf(c, scoped, strict));
};
