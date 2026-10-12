import { describe, expect, it } from 'vitest';
import {
  chordTones,
  fifthOf,
  keyDistance,
  keyLabel,
  noteNameOf,
  parseChord,
  parseKey,
  pitchClassOf,
  scaleOf,
  thirdOf,
  voicing,
} from './theory.ts';

describe('pitchClassOf / noteNameOf', () => {
  it('reads naturals, sharps and flats', () => {
    expect(pitchClassOf('C')).toBe(0);
    expect(pitchClassOf('F#')).toBe(6);
    expect(pitchClassOf('Bb')).toBe(10);
    expect(pitchClassOf('Cb')).toBe(11);
    expect(pitchClassOf('H')).toBeNull();
  });
  it('names MIDI notes the way mojipx reads them', () => {
    expect(noteNameOf(60)).toBe('C4');
    expect(noteNameOf(61)).toBe('C#4');
    expect(noteNameOf(45)).toBe('A2');
  });
});

describe('parseKey / keyLabel / scaleOf', () => {
  it('reads major and minor keys', () => {
    expect(parseKey('Eb')).toEqual({ tonic: 3, mode: 'major' });
    expect(parseKey('F#m')).toEqual({ tonic: 6, mode: 'minor' });
    expect(() => parseKey('Q')).toThrow();
  });
  it('labels keys with conventional accidentals', () => {
    expect(keyLabel(parseKey('Bb'))).toBe('Bb major');
    expect(keyLabel(parseKey('F#m'))).toBe('F# minor');
    expect(keyLabel(parseKey('Cm'))).toBe('C minor');
  });
  it('lists the scale; minor admits raised 6th and 7th', () => {
    expect(scaleOf(parseKey('C'))).toEqual([0, 2, 4, 5, 7, 9, 11]);
    expect([...scaleOf(parseKey('Am'))].sort((a, b) => a - b)).toEqual([0, 2, 4, 5, 6, 7, 8, 9, 11]);
  });
});

describe('keyDistance', () => {
  it('is 0 for the same key', () => expect(keyDistance(parseKey('G'), parseKey('G'))).toBe(0));
  it('is 0.5 between relative keys', () => expect(keyDistance(parseKey('C'), parseKey('Am'))).toBe(0.5));
  it('counts steps on the circle of fifths', () => {
    expect(keyDistance(parseKey('C'), parseKey('G'))).toBe(1);
    expect(keyDistance(parseKey('C'), parseKey('F'))).toBe(1);
    expect(keyDistance(parseKey('C'), parseKey('F#'))).toBe(6);
    expect(keyDistance(parseKey('Am'), parseKey('Em'))).toBe(1);
  });
  it('is symmetric', () => expect(keyDistance(parseKey('Eb'), parseKey('Bm'))).toBe(keyDistance(parseKey('Bm'), parseKey('Eb'))));
});

describe('parseChord / chordTones', () => {
  it('reads triads, sevenths and extensions', () => {
    expect(chordTones(parseChord('C'))).toEqual([0, 4, 7]);
    expect(chordTones(parseChord('Am7'))).toEqual([9, 0, 4, 7]);
    expect(chordTones(parseChord('F#m7b5'))).toEqual([6, 9, 0, 4]);
    expect(chordTones(parseChord('Dm9'))).toEqual([2, 5, 9, 0, 4]);
  });
  it('puts the slash bass first', () => {
    const c = parseChord('G/B');
    expect(c.bass).toBe(11);
    expect(chordTones(c)).toEqual([11, 7, 2]);
  });
  it('rejects unknown symbols', () => {
    expect(() => parseChord('Cmaj13#11')).toThrow();
    expect(() => parseChord('X7')).toThrow();
  });
  it('finds the fifth and third even when altered or suspended', () => {
    expect(fifthOf(parseChord('Bdim'))).toBe(6);
    expect(fifthOf(parseChord('Caug'))).toBe(8);
    expect(thirdOf(parseChord('Am'))).toBe(3);
    expect(thirdOf(parseChord('Dsus4'))).toBe(5);
  });
});

describe('voicing', () => {
  it('stacks the chord upward from the lowest allowed note', () => expect(voicing(parseChord('C'), 60, 3)).toEqual([60, 64, 67]));
  it('starts on the first chord tone at or above the floor', () => expect(voicing(parseChord('F'), 62, 3)).toEqual([65, 69, 72]));
  it('drops ninths to fit the size', () => expect(voicing(parseChord('Cmaj9'), 60, 4)).toEqual([60, 64, 67, 71]));
  it('keeps ninths when they fit', () => expect(voicing(parseChord('Cadd9'), 60, 4)).toEqual([60, 64, 67, 74]));
});
