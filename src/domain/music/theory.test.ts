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
  it('reads the minor-major seventh', () => expect(chordTones(parseChord('EmM7'))).toEqual([4, 7, 11, 3]));
  it('reads altered dominants, elevenths, thirteenths and six-nines', () => {
    expect(chordTones(parseChord('G7b9'))).toEqual([7, 11, 2, 5, 8]);
    expect(chordTones(parseChord('G7#9'))).toEqual([7, 11, 2, 5, 10]);
    expect(chordTones(parseChord('G7b5'))).toEqual([7, 11, 1, 5]);
    expect(chordTones(parseChord('Gaug7'))).toEqual([7, 11, 3, 5]);
    expect(chordTones(parseChord('G13'))).toEqual([7, 11, 2, 5, 9, 4]);
    expect(chordTones(parseChord('Dm11'))).toEqual([2, 5, 9, 0, 4, 7]);
    expect(chordTones(parseChord('Fmaj7#11'))).toEqual([5, 9, 4, 11]);
    expect(chordTones(parseChord('C69'))).toEqual([0, 4, 7, 9, 2]);
    expect(chordTones(parseChord('G9sus4'))).toEqual([7, 0, 2, 5, 9]);
  });
  it('still reads a sharp root before a quality', () => {
    expect(parseChord('C#m7').root).toBe(1);
    expect(parseChord('F#7#9').root).toBe(6);
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
  it('keeps the guide tones and drops the root first when the chord has more tones than voices', () => {
    expect(voicing(parseChord('Cmaj9'), 60, 4)).toEqual([64, 67, 71, 74]);
    expect(voicing(parseChord('Cmaj7'), 60, 3)).toEqual([64, 67, 71]);
    expect(voicing(parseChord('C9'), 60, 3)).toEqual([64, 70, 74]);
  });
  it('keeps a suspended tone as the third', () => expect(voicing(parseChord('D7sus4'), 60, 3)).toEqual([67, 69, 72]));
  it('keeps ninths when they fit', () => expect(voicing(parseChord('Cadd9'), 60, 4)).toEqual([60, 64, 67, 74]));
  it('voices a thirteenth on its guide tones and colors', () => expect(voicing(parseChord('G13'), 60, 4)).toEqual([71, 77, 81, 88]));
  it('opens up a sharp-eleven chord without its fifth', () => expect(voicing(parseChord('Cmaj7#11'), 60, 4)).toEqual([60, 64, 71, 78]));
});
