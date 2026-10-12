import { describe, expect, it } from 'vitest';
import { arrange } from './arrange.ts';
import { lintSong, notesOf } from './lint.ts';
import type { SongDef } from './song.ts';

const songWith = (chords: string, melody: string, key = 'C'): SongDef => ({
  id: 'lint-fixture',
  title: 'Lint Fixture',
  style: 'pixel-quest',
  mood: { valence: 0, energy: 0 },
  key,
  bpm: 120,
  sections: { a: { chords, melody } },
  form: ['a'],
});

const problems = (chords: string, melody: string, key?: string) => lintSong(arrange(songWith(chords, melody, key))).map((f) => f.problem);

describe('notesOf', () => {
  it('follows holds across bar lines', () => {
    expect(
      notesOf([
        ['C5', '-', '.', 'D5'],
        ['-', '-', 'E5', '.'],
      ]),
    ).toEqual([
      { bar: 0, step: 0, length: 2, midi: [72] },
      { bar: 0, step: 3, length: 3, midi: [74] },
      { bar: 1, step: 2, length: 1, midi: [76] },
    ]);
  });
});

describe('lintSong', () => {
  it('accepts chord tones, passing tones and tensions', () =>
    expect(problems('C | G7', 'E5 D5 C5 D5 E5 - G5 - | D6 - - - B5 - - -')).toEqual([]));
  it('accepts a ninth held on a strong beat', () => expect(problems('C', 'D5 - - - E5 - - -')).toEqual([]));
  it('flags a held note a semitone above a chord tone', () =>
    expect(problems('C', 'F5 - - - E5 - - -')).toContain('clashes a semitone above a tone of C'));
  it('accepts the ninth held over a minor chord', () => expect(problems('Am', 'B5 - - - - - - -')).toEqual([]));
  it('flags a long unstable tone on a strong beat', () =>
    expect(problems('Am', 'G5 - - - - - - -')).toContain('unstable over Am for 4 beats'));
  it('accepts the same tone as a short passing note', () => expect(problems('Am', 'A5 G5 E5 - - - - -')).toEqual([]));
  it('flags the fourth held over a major chord', () =>
    expect(problems('G', 'C6 - - - - - - -')).toContain('clashes a semitone above a tone of G'));
  it('flags notes outside both key and chord', () => expect(problems('C', 'C#5 . . . C5 - - -')).toContain('neither in C nor in the key'));
  it('allows chromatic chord tones of borrowed chords', () => expect(problems('E7', 'G#5 - - - B5 - - -')).toEqual([]));
  it('allows the raised seventh in minor', () => expect(problems('E', 'G#5 - - - B5 - - -', 'Am')).toEqual([]));
  it('flags leaps beyond an octave', () => expect(problems('C', 'C5 - - - E6 - - -')).toContain('leaps more than an octave'));
  it('flags notes outside the range', () => expect(problems('C', 'C3 - - - - - - -')[0]).toMatch(/out of range/));
  it('uses the second chord from beat three', () => expect(problems('C G', 'C5 - - - D5 - - -')).toEqual([]));
  it('flags a note held into a chord it clashes with', () =>
    expect(problems('F E', 'A5 - - - - - - -')).toContain('held into E, a semitone above one of its tones'));
  it('accepts a note held into a chord it belongs to', () => expect(problems('C Am', 'E5 - - - - - - -')).toEqual([]));
  it('ignores a clash that lasts less than a beat after the change', () => expect(problems('F E', 'A5 - - - - G#5 - -')).toEqual([]));
  it('flags a leap beyond an octave from the end of the loop back to its start', () =>
    expect(problems('C | C', 'C5 - - - - - - - | C6 - - - E6 - - -')).toContain('leaps more than an octave back to the loop start'));
});

describe('lintSong with a counter line', () => {
  const withCounter = (melody: string, counter: string) =>
    lintSong(arrange({ ...songWith('C', melody), sections: { a: { chords: 'C', melody, counter } } })).map((f) => f.problem);
  it('accepts consonant voices', () => expect(withCounter('E5 - - - G5 - - -', 'C5 - - - E5 - - -')).toEqual([]));
  it('flags voices a semitone or a minor ninth apart for a beat', () =>
    expect(withCounter('C6 - - - - - - -', 'B4 - - - - - - -')[0]).toMatch(/a semitone against the melody/));
  it('lets a passing semitone through', () => expect(withCounter('C6 B5 C6 - - - - -', 'G4 - - - - - - -')).toEqual([]));
});
