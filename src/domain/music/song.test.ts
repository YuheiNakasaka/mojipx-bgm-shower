import { describe, expect, it } from 'vitest';
import { barsOf, transposed } from './song.ts';
import { parseKey, transposeChord } from './theory.ts';

describe('barsOf', () => {
  it('splits a line at bar lines and trims each bar', () => expect(barsOf('C5 - | D5 . ')).toEqual(['C5 -', 'D5 .']));
});

describe('transposeChord', () => {
  it('moves the root and a slash bass, spelled for the target key', () => {
    expect(transposeChord('Fm7/Bb', 1, parseKey('E'))).toBe('F#m7/B');
    expect(transposeChord('C#m7b5', 1, parseKey('F'))).toBe('Dm7b5');
    expect(transposeChord('G7#9', 2, parseKey('Eb'))).toBe('A7#9');
    expect(transposeChord('Abmaj7', 2, parseKey('Bb'))).toBe('Bbmaj7');
  });
});

describe('transposed', () => {
  const chorus = {
    chords: 'Abmaj7 | Bb7 Eb/G',
    melody: 'Eb6 - D6 - C6 - Bb5 - | G5+Bb5 - . . F5 - - -',
    counter: 'C5 - - - - - - - | Bb4 - - - - - - -',
    drums: false as const,
  };
  const lifted = transposed(chorus, 1, 'E');

  it('moves chords, melody and counter and records the new key', () => {
    expect(lifted.key).toBe('E');
    expect(lifted.chords).toBe('Amaj7 | B7 E/G#');
    expect(lifted.melody).toBe('E6 - D#6 - C#6 - B5 - | G#5+B5 - . . F#5 - - -');
    expect(lifted.counter).toBe('C#5 - - - - - - - | B4 - - - - - - -');
  });

  it('keeps the section switches', () => expect(lifted.drums).toBe(false));

  it('leaves a missing counter missing', () => expect('counter' in transposed({ chords: 'C', melody: 'C5' }, 2, 'D')).toBe(false));
});
