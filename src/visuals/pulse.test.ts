import { describe, expect, it } from 'vitest';
import { trackOf } from '../domain/catalog.ts';
import type { SongDef } from '../domain/music/song.ts';
import { absoluteStep, pulseOf, songStep } from './pulse.ts';

const def: SongDef = {
  id: 'p',
  title: 'Pulse Fixture',
  style: 'neon-rush',
  mood: { valence: 0, energy: 0.8 },
  key: 'C',
  bpm: 120,
  sections: {
    intro: { chords: 'C', melody: 'C5 - - - - - - -', drums: false },
    a: { chords: 'C | C', melody: 'C5 - - - - - - - | C5 - - - - - - -' },
  },
  form: ['intro', 'a'],
  loopFrom: 1,
};
const track = trackOf(def);
const at = (step: number, loop = 0, phase = 0) => ({ track: 'p', step, loop, phase, stepSec: 0.25 });

describe('absoluteStep', () => {
  it('counts the intro once and each loop after it', () => {
    expect(absoluteStep(track, at(3))).toBe(3);
    expect(absoluteStep(track, at(8, 1))).toBe(24);
    expect(absoluteStep(track, at(9, 2))).toBe(41);
  });
});

describe('songStep', () => {
  it('maps absolute steps back into the song, skipping the intro on repeats', () => {
    expect(songStep(track, 5)).toBe(5);
    expect(songStep(track, 24)).toBe(8);
    expect(songStep(track, 41)).toBe(9);
  });
});

describe('pulseOf', () => {
  it('runs a free clock when nothing plays', () => {
    const p = pulseOf(track, null, 10);
    expect(p.beat).toBeCloseTo(16);
    expect(p.kick).toBe(0);
  });
  it('ignores a position of another track', () => expect(pulseOf(track, { ...at(0), track: 'other' }, 0).kick).toBe(0));
  it('counts beats and bars from the position', () => {
    const p = pulseOf(track, at(10, 0, 0.5), 0);
    expect(p.beat).toBeCloseTo(5.25);
    expect(p.bar).toBe(1);
  });
  it('peaks right on a kick and decays after it', () => {
    // neon-rush plays four-on-the-floor: kicks on every beat (even steps)
    expect(pulseOf(track, at(8), 0).kick).toBeCloseTo(1);
    expect(pulseOf(track, at(9, 0, 0.5), 0).kick).toBeLessThan(0.1);
  });
  it('has no kick during a drumless intro', () => expect(pulseOf(track, at(2), 0).kick).toBe(0));
  it('feels the last kick of the loop right after the loop restarts', () =>
    expect(pulseOf(track, at(8, 1, 0.5), 0).kick).toBeGreaterThan(0.3));
});
