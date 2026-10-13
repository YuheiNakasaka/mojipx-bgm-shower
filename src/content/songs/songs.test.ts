import { compile } from 'mojipx';
import { describe, expect, it } from 'vitest';
import { catalogOf, type Track } from '../../domain/catalog.ts';
import { MOOD_PRESETS, nearestPreset } from '../../domain/mood.ts';
import { lintSong, notesOf } from '../../domain/music/lint.ts';
import { SONGS } from './index.ts';
import { LOUDNESS } from './loudness.ts';

const catalog = catalogOf(SONGS);

/** Songs every mood on the pad must offer. Raised as the library grows. */
const MIN_PER_MOOD = 8;
/** Two songs sharing this many consecutive melodic intervals are too alike (a copy, or two writers converging). */
const SHARED_RUN = 10;
/** Minutes of distinct music: every track's intro and loop heard once (a `?loops=1` tour). */
const MIN_LIBRARY_MINUTES = 60;

const intervalsOf = (track: Track): readonly number[] => {
  const tops = notesOf(track.song.plan.map((bar) => bar.melody)).map((n) => Math.max(...n.midi));
  return tops.slice(1).map((m, i) => m - (tops[i] as number));
};

/** Chord qualities without a seventh, extension or suspension. */
const PLAIN = new Set(['', 'm', 'dim', 'aug']);

const loopOf = (track: Track) => track.song.plan.slice(track.song.loopStartBar);

/** How a bar is played: its band switches, whether a counter line sounds, and which lead voice carries the melody. */
const textureOf = (bar: Track['song']['plan'][number]): string => JSON.stringify([bar.parts, bar.counter !== null, bar.alt]);

/** Share of the loop's chords that carry a seventh, an extension, a suspension or a slash bass. */
const colorShareOf = (track: Track): number => {
  const chords = loopOf(track).flatMap((bar) => bar.chords);
  return chords.filter((c) => !PLAIN.has(c.quality) || c.bass !== c.root).length / Math.max(1, chords.length);
};

const runsOf = (intervals: readonly number[]): ReadonlySet<string> =>
  new Set(intervals.slice(0, Math.max(0, intervals.length - SHARED_RUN + 1)).map((_, i) => intervals.slice(i, i + SHARED_RUN).join(',')));

describe('song library', () => {
  it('has unique ids and titles', () => {
    expect(new Set(SONGS.map((s) => s.id)).size).toBe(SONGS.length);
    expect(new Set(SONGS.map((s) => s.title)).size).toBe(SONGS.length);
  });
  it('uses URL-safe ids and plain English titles', () => {
    for (const s of SONGS) {
      expect(s.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(s.title).toMatch(/^[A-Z][A-Za-z0-9' ,.&-]+$/);
    }
  });
});

describe('library variety', () => {
  it(`offers at least ${MIN_PER_MOOD} songs for every mood`, () => {
    const counts = Object.fromEntries(
      MOOD_PRESETS.map((p) => [p.id, catalog.tracks.filter((t) => nearestPreset(t.mood).id === p.id).length]),
    );
    expect(Object.entries(counts).filter(([, n]) => n < MIN_PER_MOOD)).toEqual([]);
  });

  it(`lasts at least ${MIN_LIBRARY_MINUTES} minutes when every track plays once`, () => {
    const seconds = catalog.tracks.reduce((sum, t) => sum + t.introSec + t.loopSec, 0);
    expect(seconds / 60).toBeGreaterThanOrEqual(MIN_LIBRARY_MINUTES);
  });

  it('has a measured loudness gain for every song (run `npm run loudness`)', () => {
    expect(SONGS.filter((s) => LOUDNESS[s.id] === undefined).map((s) => s.id)).toEqual([]);
    expect(Object.keys(LOUDNESS).filter((id) => !catalog.byId.has(id))).toEqual([]);
  });

  it(`has no two melodies sharing ${SHARED_RUN} consecutive intervals`, () => {
    const runs = catalog.tracks.map((t) => [t.id, runsOf(intervalsOf(t))] as const);
    const alike = runs.flatMap(([a, ra], i) =>
      runs.slice(i + 1).flatMap(([b, rb]) => ([...ra].some((r) => rb.has(r)) ? [`${a} ~ ${b}`] : [])),
    );
    expect(alike).toEqual([]);
  });
});

describe.each(catalog.tracks.map((t) => [t.id, t] as const))('%s', (_, track) => {
  it('compiles in mojipx', () => expect(() => compile(track.song.score)).not.toThrow());
  it('passes the musical checks', () => expect(lintSong(track.song)).toEqual([]));
  // The owner found the first library flat: short two-part loops over plain triads. A song tells a story now.
  it('has an arc: at least three sections, two textures and a counter line in its loop', () => {
    const loop = loopOf(track);
    expect(new Set(loop.map((bar) => bar.section)).size).toBeGreaterThanOrEqual(3);
    expect(new Set(loop.map(textureOf)).size).toBeGreaterThanOrEqual(2);
    expect(loop.some((bar) => bar.counter !== null)).toBe(true);
  });
  it('colors its harmony: at least a third of its chords carry a seventh, extension, suspension or slash bass', () =>
    expect(colorShareOf(track)).toBeGreaterThanOrEqual(1 / 3));
  it('sits on the mood pad', () => {
    expect(Math.abs(track.mood.valence)).toBeLessThanOrEqual(1);
    expect(Math.abs(track.mood.energy)).toBeLessThanOrEqual(1);
  });
  it('loops for 60–150 seconds at a sensible tempo', () => {
    expect(track.loopSec).toBeGreaterThanOrEqual(60);
    expect(track.loopSec).toBeLessThanOrEqual(150);
    expect(track.bpm).toBeGreaterThanOrEqual(60);
    expect(track.bpm).toBeLessThanOrEqual(190);
  });
});
