// The visual director: which scene is on screen, in which colors, and when to cut to another.
// Pure. A new track always gets a new shot; within a track the shot changes every phrase
// (8 bars for energetic tracks, 16 for calm ones) unless the listener locks the scene.
import { affinity, type Mood, moodDistance } from '../domain/mood.ts';
import { pickWeighted, type Rng, rngOf } from '../domain/rng.ts';
import type { Scene } from './scene.ts';

export type SceneMeta = Pick<Scene, 'id' | 'mood' | 'styles' | 'variantMoods'>;
export type TrackMeta = { readonly id: string; readonly mood: Mood; readonly style: string };

export type Shot = { readonly scene: string; readonly variant: number; readonly startedAt: number };

export type DirectorState = {
  readonly shot: Shot;
  /** The shot being faded out, while a transition runs. */
  readonly previous: Shot | null;
  readonly track: string | null;
  readonly phrase: number;
  readonly history: readonly string[];
  readonly locked: boolean;
  readonly rng: Rng;
};

export const TRANSITION_MS = 1400;

export const phraseBarsOf = (mood: Mood): number => (mood.energy > 0.35 ? 8 : 16);

/** The variant whose mood is nearest the track's. */
export const variantFor = (scene: SceneMeta, mood: Mood): number =>
  scene.variantMoods.reduce((best, m, i) => (moodDistance(m, mood) < moodDistance(scene.variantMoods[best] as Mood, mood) ? i : best), 0);

const sceneWeight = (scene: SceneMeta, track: TrackMeta, history: readonly string[], current: string): number => {
  if (scene.id === current) return 0;
  const recent = history.slice(-2).includes(scene.id) ? 0.15 : 1;
  const suits = (scene.styles as readonly string[]).includes(track.style) ? 2.5 : 1;
  return affinity(scene.mood, track.mood, 0.55) ** 2 * recent * suits;
};

const shoot = (s: DirectorState, scenes: readonly SceneMeta[], track: TrackMeta, now: number, phrase: number): DirectorState => {
  const [scene, rng] = pickWeighted(s.rng, scenes, (x) => sceneWeight(x, track, s.history, scenes.length > 1 ? s.shot.scene : ''));
  return {
    ...s,
    rng,
    shot: { scene: scene.id, variant: variantFor(scene, track.mood), startedAt: now },
    previous: s.shot,
    track: track.id,
    phrase,
    history: [...s.history.slice(-7), scene.id],
  };
};

export const initialDirector = (seed: number, scenes: readonly SceneMeta[], now: number): DirectorState => {
  const first = scenes[0] as SceneMeta;
  return {
    shot: { scene: first.id, variant: 0, startedAt: now },
    previous: null,
    track: null,
    phrase: 0,
    history: [first.id],
    locked: false,
    rng: rngOf(seed),
  };
};

/** Called every frame; returns the same object when nothing changes. */
export const direct = (
  s: DirectorState,
  scenes: readonly SceneMeta[],
  track: TrackMeta | null,
  bar: number,
  now: number,
): DirectorState => {
  const settled = s.previous && now - s.shot.startedAt >= TRANSITION_MS ? { ...s, previous: null } : s;
  if (!track) return settled;
  const phrase = Math.floor(Math.max(0, bar) / phraseBarsOf(track.mood));
  if (track.id !== settled.track) {
    if (settled.locked) {
      const scene = scenes.find((x) => x.id === settled.shot.scene) as SceneMeta;
      return { ...settled, track: track.id, phrase, shot: { ...settled.shot, variant: variantFor(scene, track.mood) } };
    }
    return shoot(settled, scenes, track, now, phrase);
  }
  if (phrase > settled.phrase && !settled.locked && scenes.length > 1) return shoot(settled, scenes, track, now, phrase);
  return phrase === settled.phrase ? settled : { ...settled, phrase };
};

/** The listener asks for another scene now. */
export const skipScene = (s: DirectorState, scenes: readonly SceneMeta[], track: TrackMeta | null, now: number): DirectorState =>
  shoot(s, scenes, track ?? { id: s.track ?? '', mood: { valence: 0, energy: 0 }, style: '' }, now, s.phrase);

export const setLocked = (s: DirectorState, locked: boolean): DirectorState => ({ ...s, locked });

/** 0 when a transition starts, 1 when it is done (or there is none). */
export const transitionOf = (s: DirectorState, now: number): number =>
  s.previous ? Math.min(1, Math.max(0, (now - s.shot.startedAt) / TRANSITION_MS)) : 1;
