import { compile } from 'mojipx';
import { describe, expect, it } from 'vitest';
import { catalogOf, type Track } from '../../domain/catalog.ts';
import { MOOD_PRESETS, nearestPreset } from '../../domain/mood.ts';
import { lintSong, notesOf } from '../../domain/music/lint.ts';
import { SONGS } from './index.ts';

const catalog = catalogOf(SONGS);

/** Songs every mood on the pad must offer. Raised as the library grows. */
const MIN_PER_MOOD = 0;
/** Two songs sharing this many consecutive melodic intervals are too alike (a copy, or two writers converging). */
const SHARED_RUN = 10;

const intervalsOf = (track: Track): readonly number[] => {
  const tops = notesOf(track.song.plan.map((bar) => bar.melody)).map((n) => Math.max(...n.midi));
  return tops.slice(1).map((m, i) => m - (tops[i] as number));
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
  it('sits on the mood pad', () => {
    expect(Math.abs(track.mood.valence)).toBeLessThanOrEqual(1);
    expect(Math.abs(track.mood.energy)).toBeLessThanOrEqual(1);
  });
  it('loops for 15–75 seconds at a sensible tempo', () => {
    expect(track.loopSec).toBeGreaterThanOrEqual(15);
    expect(track.loopSec).toBeLessThanOrEqual(75);
    expect(track.bpm).toBeGreaterThanOrEqual(60);
    expect(track.bpm).toBeLessThanOrEqual(190);
  });
});
