import { compile } from 'mojipx';
import { describe, expect, it } from 'vitest';
import { catalogOf } from '../../domain/catalog.ts';
import { lintSong } from '../../domain/music/lint.ts';
import { SONGS } from './index.ts';

const catalog = catalogOf(SONGS);

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
