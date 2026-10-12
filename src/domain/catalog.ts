// Tracks: arranged songs with what the player and the visuals need to know about them.
import { compile } from 'mojipx';
import { type ArrangedSong, arrange } from './music/arrange.ts';
import type { SongDef } from './music/song.ts';
import { keyLabel } from './music/theory.ts';
import type { PlayerTrack } from './player.ts';

/** Per-step drum accents of a track, for beat-reactive visuals. */
export type Accents = { readonly kick: readonly boolean[]; readonly snare: readonly boolean[] };

export type Track = PlayerTrack & {
  readonly title: string;
  readonly styleLabel: string;
  readonly keyLabel: string;
  readonly song: ArrangedSong;
  readonly stepsPerBar: number;
  readonly introSec: number;
  readonly accents: Accents;
};

const accentsOf = (song: ArrangedSong): Accents => {
  const drums = compile(song.score).drums;
  return {
    kick: drums.map((hits) => hits.some((d) => d.drum === 'kick' || d.drum === 'tom')),
    snare: drums.map((hits) => hits.some((d) => d.drum === 'snare')),
  };
};

export const trackOf = (def: SongDef): Track => {
  const song = arrange(def);
  const secPerBar = (song.meter * 60) / def.bpm;
  return {
    id: def.id,
    title: def.title,
    mood: def.mood,
    bpm: def.bpm,
    key: song.key,
    style: def.style,
    styleLabel: song.style.label,
    keyLabel: keyLabel(song.key),
    loopSec: (song.plan.length - song.loopStartBar) * secPerBar,
    introSec: song.loopStartBar * secPerBar,
    stepsPerBar: song.meter * song.stepsPerBeat,
    song,
    accents: accentsOf(song),
  };
};

export type Catalog = { readonly tracks: readonly Track[]; readonly byId: ReadonlyMap<string, Track> };

export const catalogOf = (defs: readonly SongDef[]): Catalog => {
  const tracks = defs.map(trackOf);
  return { tracks, byId: new Map(tracks.map((t) => [t.id, t])) };
};
