// Glamorous and alone above the night city: a Dorian riff (the major IV with its bright sixth), a verse that talks
// low, a pre-chorus whose long tones climb over falling fifths, and a chorus hook that falls in a 3+3+2 figure.
import type { SongDef } from '../../domain/music/song.ts';

const riff = {
  chords: 'Fm9 | Bb9 | Fm9 | Bb9',
  melody: '. C6 Eb6 F6 - Eb6 C6 Bb5 | - - . D6 - - C6 - | . C6 Eb6 F6 - Eb6 C6 Ab5 | - - . G5 - - F5 -',
};

const chorus = {
  chords: 'Dbmaj7 | C7 | Fm9 | Ebm7 Ab7 | Dbmaj7 | C7b9 | Fm9 Bb9 | Gm7b5 C7',
  melody: [
    'Eb6 - - C6 - - Ab5 C6',
    '- - - - . . Bb5 C6',
    'Eb6 - - C6 - - Ab5 Bb5',
    '- - - - C6 - - -',
    'F6 - - Eb6 - - C6 Db6',
    '- - C6 - . . E5 G5',
    'Ab5 - - C6 - - D6 -',
    'F6 - - - E6 - - .',
  ].join(' | '),
  lead: 'alt' as const,
};

export const velvetSkyline: SongDef = {
  id: 'velvet-skyline',
  title: 'Velvet Skyline',
  style: 'city-groove',
  mood: { valence: 0, energy: 0.1 },
  key: 'Fm',
  bpm: 104,
  sections: {
    intro: { ...riff, drums: false },
    a: {
      chords: 'Fm9 | Bb9 | Fm9 | Bb9 | Dbmaj7 | Cm7 | Bbm7 | C7sus4 C7',
      melody: [
        '. F4 Ab4 C5 - - Bb4 C5',
        '- - . D5 - C5 Bb4 -',
        '. F4 Ab4 C5 - - Eb5 F5',
        '- - D5 - C5 - . .',
        '. Ab4 C5 Eb5 - - F5 Eb5',
        'D5 - - - . . C5 Db5',
        '- - - - F5 - Eb5 Db5',
        'F5 - - - E5 - C5 -',
      ].join(' | '),
      pad: false,
      bass: 'syncopated',
    },
    b: {
      chords: 'Bbm7 | Eb7 | Abmaj7 | Dbmaj7 | Gm7b5 | C7b9 | Fm7 Fm7/Eb | Dm7b5 C7',
      melody: [
        '. Db5 - F5 Ab5 - G5 F5',
        'G5 - - - . . . .',
        '. Eb5 - G5 Bb5 - Ab5 G5',
        'Ab5 - - - . . . .',
        '. F5 - Bb5 Db6 - C6 Bb5',
        'Bb5 - - - . . . .',
        'Ab5 - - C6 - - Eb6 -',
        'D6 - - C6 - - Bb5 C6',
      ].join(' | '),
      drums: 'half',
    },
    s: chorus,
    inter: riff,
    s2: {
      ...chorus,
      counter: [
        'F5 - - - - - - -',
        'E5 - - - G5 - E5 -',
        'C5 - - - Eb5 - - -',
        'Db5 - - - C5 - - -',
        'F5 - - - Ab5 - - -',
        'G5 - - - Bb5 - - -',
        'Eb5 - - - F5 - - -',
        'Db5 - - - Bb4 - - -',
      ].join(' | '),
    },
    outro: { chords: 'Dbmaj7 | C7sus4 C7', melody: 'Eb6 - - C6 - - Ab5 - | F5 - - - E5 - . .' },
  },
  form: ['intro', 'a', 'b', 's', 'inter', 's2', 'outro'],
  loopFrom: 1,
};
