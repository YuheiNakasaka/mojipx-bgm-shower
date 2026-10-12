// The music's pulse for the visuals: how many beats have passed and how hard the last drum hit.
// Derived from the playback position mojipx reports; when nothing plays, a free-running clock keeps things moving.
import type { BgmPosition } from 'mojipx';
import type { Track } from '../domain/catalog.ts';

export type Pulse = { readonly beat: number; readonly bar: number; readonly kick: number; readonly snare: number };

const KICK_DECAY_SEC = 0.11;
const SNARE_DECAY_SEC = 0.09;
const IDLE_BPM = 96;

/** Steps since the track started, counting the intro once and every loop after it. */
export const absoluteStep = (track: Track, pos: BgmPosition<string>): number => {
  const length = track.accents.kick.length;
  const loopStart = track.song.loopStartBar * track.stepsPerBar;
  if (pos.loop === 0) return pos.step;
  return length + (pos.loop - 1) * (length - loopStart) + (pos.step - loopStart);
};

/** The in-song step of an absolute step: the intro once, then the loop over and over. */
export const songStep = (track: Track, abs: number): number => {
  const length = track.accents.kick.length;
  const loopStart = track.song.loopStartBar * track.stepsPerBar;
  return abs < length ? abs : loopStart + ((abs - length) % (length - loopStart));
};

// Seconds since the most recent hit at or before absolute step `abs`, looking back at most one bar.
const sinceHit = (track: Track, hits: readonly boolean[], abs: number, phase: number, stepSec: number): number | null => {
  const back = Array.from({ length: Math.min(track.stepsPerBar, abs + 1) }, (_, i) => i).find((i) => hits[songStep(track, abs - i)]);
  return back === undefined ? null : (back + phase) * stepSec;
};

const envelope = (since: number | null, decay: number): number => (since === null ? 0 : Math.exp(-since / decay));

export const pulseOf = (track: Track | null, pos: BgmPosition<string> | null, nowSec: number): Pulse => {
  if (!track || !pos || pos.track !== track.id) {
    const beat = (nowSec * IDLE_BPM) / 60;
    return { beat, bar: Math.floor(beat / 4), kick: 0, snare: 0 };
  }
  const abs = absoluteStep(track, pos);
  const beat = (abs + pos.phase) / track.song.stepsPerBeat;
  return {
    beat,
    bar: Math.floor(beat / track.song.meter),
    kick: envelope(sinceHit(track, track.accents.kick, abs, pos.phase, pos.stepSec), KICK_DECAY_SEC),
    snare: envelope(sinceHit(track, track.accents.snare, abs, pos.phase, pos.stepSec), SNARE_DECAY_SEC),
  };
};
