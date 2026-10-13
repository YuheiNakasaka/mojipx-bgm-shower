// The player as a pure state machine: messages in, a new state and audio commands out.
// The shell (app/engine.ts) runs the commands against mojipx and feeds back where playback is.
import { ANY_MOOD, type MoodChoice, targetOf } from './mood.ts';
import { type Rng, rngOf } from './rng.ts';
import { type Candidate, pickNext } from './selection.ts';

export type PlayMode = 'shuffle' | 'repeat';
export type Status = 'idle' | 'playing' | 'paused';

/** A track as the player sees it: something to pick, and how long one loop lasts. */
export type PlayerTrack = Candidate & { readonly loopSec: number };

export type PlayerState = {
  readonly status: Status;
  readonly mode: PlayMode;
  readonly mood: MoodChoice;
  /** The track heard now (or about to start). */
  readonly current: string | null;
  /** The track waiting to take over at the end of the current loop. */
  readonly queued: string | null;
  /** Finished loops of the current track after which the next one is cued. */
  readonly loops: number;
  /** An upper limit on loops per track (a link can ask for a quick tour), or null. */
  readonly loopCap: number | null;
  /** Ids played, oldest first; includes the current track. */
  readonly history: readonly string[];
  readonly rng: Rng;
};

/** Where playback is, as reported by the audio engine. */
export type Heard = { readonly track: string; readonly loop: number };

export type Msg =
  | { readonly type: 'start'; readonly track?: string }
  | { readonly type: 'toggle' }
  | { readonly type: 'next' }
  | { readonly type: 'prev' }
  | { readonly type: 'select'; readonly track: string }
  | { readonly type: 'setMode'; readonly mode: PlayMode }
  | { readonly type: 'setMood'; readonly mood: MoodChoice }
  | { readonly type: 'heard'; readonly at: Heard | null };

export type Cmd =
  | { readonly type: 'play'; readonly track: string }
  | { readonly type: 'cue'; readonly track: string }
  | { readonly type: 'pause' }
  | { readonly type: 'resume' };

export type Step = readonly [PlayerState, readonly Cmd[]];

/** Roughly how long a track plays in shuffle before the next one takes over. */
export const TRACK_TARGET_SEC = 150;

/** Loops a track plays: as many as fill the target, so loops up to two-thirds of it play at least twice and longer songs once. */
export const loopsFor = (track: PlayerTrack): number => Math.max(1, Math.round(TRACK_TARGET_SEC / track.loopSec));

/** Loops the current track plays in this state, honoring a cap. */
export const plannedLoops = (s: PlayerState, track: PlayerTrack): number =>
  Math.max(1, Math.min(s.loopCap ?? Number.POSITIVE_INFINITY, loopsFor(track)));

export const initialPlayer = (seed: number, mood: MoodChoice = ANY_MOOD, loopCap: number | null = null): PlayerState => ({
  status: 'idle',
  mode: 'shuffle',
  mood,
  current: null,
  queued: null,
  loops: 2,
  loopCap,
  history: [],
  rng: rngOf(seed),
});

const find = (library: readonly PlayerTrack[], id: string | null): PlayerTrack | null => library.find((t) => t.id === id) ?? null;

const choose = (s: PlayerState, library: readonly PlayerTrack[]): readonly [PlayerTrack, Rng] =>
  pickNext(s.rng, { library, target: targetOf(s.mood), current: find(library, s.current), history: s.history });

/** Cut straight to a track (a listener's action). */
const playNow = (s: PlayerState, track: PlayerTrack): Step => [
  { ...s, status: 'playing', current: track.id, queued: null, loops: plannedLoops(s, track), history: [...s.history, track.id] },
  [{ type: 'play', track: track.id }, ...(s.status === 'paused' ? [{ type: 'resume' } as const] : [])],
];

const queueNext = (s: PlayerState, library: readonly PlayerTrack[]): Step => {
  const [next, rng] = choose(s, library);
  return [{ ...s, queued: next.id, rng }, [{ type: 'cue', track: next.id }]];
};

const onHeard = (s: PlayerState, library: readonly PlayerTrack[], at: Heard | null): Step => {
  if (s.status !== 'playing' || at === null) return [s, []];
  if (at.track === s.queued) {
    const track = find(library, at.track);
    return [{ ...s, current: at.track, queued: null, loops: track ? plannedLoops(s, track) : 2, history: [...s.history, at.track] }, []];
  }
  const due = s.mode === 'shuffle' && s.queued === null && at.track === s.current && at.loop >= s.loops - 1;
  return due ? queueNext(s, library) : [s, []];
};

const start = (s: PlayerState, library: readonly PlayerTrack[], id: string | undefined): Step => {
  const asked = find(library, id ?? null);
  if (asked) return playNow(s, asked);
  const [first, rng] = choose(s, library);
  return playNow({ ...s, rng }, first);
};

const toggle = (s: PlayerState, library: readonly PlayerTrack[]): Step => {
  if (s.status === 'idle') return start(s, library, undefined);
  return s.status === 'playing' ? [{ ...s, status: 'paused' }, [{ type: 'pause' }]] : [{ ...s, status: 'playing' }, [{ type: 'resume' }]];
};

const prev = (s: PlayerState, library: readonly PlayerTrack[]): Step => {
  const before = find(library, s.history.at(-2) ?? null);
  if (!before) return s.current ? playNow({ ...s, history: s.history.slice(0, -1) }, find(library, s.current) as PlayerTrack) : [s, []];
  return playNow({ ...s, history: s.history.slice(0, -2) }, before);
};

const setMode = (s: PlayerState, mode: PlayMode): Step => {
  // Leaving shuffle cancels a waiting track by cueing the current one again.
  if (mode === 'repeat' && s.queued !== null && s.current !== null)
    return [{ ...s, mode, queued: null }, [{ type: 'cue', track: s.current }]];
  return [{ ...s, mode }, []];
};

/** A new mood takes over at the end of the current loop: re-pick a waiting track, or make the current loop the last. */
const setMood = (s: PlayerState, library: readonly PlayerTrack[], mood: MoodChoice): Step => {
  const next = { ...s, mood };
  if (s.status === 'idle' || s.mode === 'repeat') return [next, []];
  if (s.queued !== null) return queueNext({ ...next, queued: null }, library);
  return [{ ...next, loops: 0 }, []];
};

export const update = (s: PlayerState, msg: Msg, library: readonly PlayerTrack[]): Step => {
  if (library.length === 0) return [s, []];
  switch (msg.type) {
    case 'start':
      return start(s, library, msg.track);
    case 'toggle':
      return toggle(s, library);
    case 'next': {
      const [next, rng] = choose(s, library);
      return playNow({ ...s, rng }, next);
    }
    case 'prev':
      return prev(s, library);
    case 'select': {
      const track = find(library, msg.track);
      return track ? playNow(s, track) : [s, []];
    }
    case 'setMode':
      return setMode(s, msg.mode);
    case 'setMood':
      return setMood(s, library, msg.mood);
    case 'heard':
      return onHeard(s, library, msg.at);
  }
};
