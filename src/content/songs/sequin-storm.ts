import { type SongDef, transposed } from '../../domain/music/song.ts';

// A minor-key disco anthem for a girl group: the chorus walks the minor circle of fifths with a long note and a
// falling turn, sequenced a step lower, then climbs to a b9 sigh over the harmonic-minor V7. Between the choruses the
// group shouts a chant over brass hits while the strings run up and answer, and the last chorus is lifted a half step.
const chorus = {
  chords: 'Bm7 | Em7 | A7 | Dmaj7 | Gmaj7 | C#m7b5 F#7 | Em7 A7 | F#7b9',
  melody: [
    'F#6 - - G6 F#6 E6 D6 E6',
    '- - - - B5 - . .',
    'E6 - - F#6 E6 D6 C#6 D6',
    '- - - - A5 - . .',
    'B5 - D6 - F#6 - - G6',
    '- - - - F#6 - E6 -',
    'B5 E6 G6 - - - A6 -',
    'G6 - - F#6 - - E6 C#6',
  ].join(' | '),
  counter: [
    'D5 - - - - - - -',
    'G4 - - - . B4 D5 F#5',
    'G5 - - - E5 - - -',
    'F#5 - - - . A5 F#5 E5',
    'D5 - - - - - - -',
    'E5 - - - A#4 - - -',
    'B4 - - - C#5 - - -',
    'A#4 - - - C#5 - E5 -',
  ].join(' | '),
  lead: 'alt' as const,
};

const pre = {
  chords: 'Em9 | F#m7 | Gmaj7 | A7sus4 A7 | Em9 | F#m7 | Gmaj7 | F#7sus4 F#7b9',
  melody: [
    'G5 - - F#5 G5 - B5 -',
    'A5 - - - - - . .',
    'A5 - - G5 A5 - D6 -',
    'D6 - - - C#6 - . .',
    'B5 - - A5 B5 - E6 -',
    'C#6 - - - - - . .',
    'D6 - - C#6 D6 - F#6 -',
    'C#6 - - D6 E6 - G6 -',
  ].join(' | '),
  counter: [
    'B4 - - - - - - -',
    'A4 - - - . C#5 E5 F#5',
    'D5 - - - - - - -',
    'E5 - - - . G5 A5 B5',
    'G5 - - - - - - -',
    'A5 - - - . F#5 E5 C#5',
    'B4 - - - D5 - - -',
    'C#5 - - - A#4 - - -',
  ].join(' | '),
  harmony: 'offbeat' as const,
};

export const sequinStorm: SongDef = {
  id: 'sequin-storm',
  title: 'Sequin Storm',
  style: 'idol-disco',
  mood: { valence: -0.1, energy: 0.75 },
  key: 'Bm',
  bpm: 130,
  sections: {
    intro: {
      chords: 'Bm7 | Gmaj7 | Em7 | F#7b9',
      melody: 'F#6 - - G6 F#6 E6 D6 C#6 | D6 - - - B5 - . . | E6 - - F#6 E6 D6 C#6 B5 | A#5 - - - - - . .',
      counter: 'B4 - - - - - - - | B4 - - - . . D5 F#5 | G5 - - - - - - - | E5 - - - C#5 E5 G5 A#5',
      lead: 'alt',
      drums: false,
      bass: 'whole',
      harmony: 'stab',
    },
    a: {
      chords: 'Bm7 | Bm7/A | Gmaj7 | F#7 | Bm7 | Bm7/A | Em7 | F#7sus4 F#7',
      melody: [
        'F#5 . F#5 E5 - D5 . .',
        '. C#5 D5 F#5 - E5 D5 C#5',
        'D5 . D5 C#5 - B4 . .',
        '. A#4 C#5 E5 - - . .',
        'F#5 . F#5 E5 - D5 . F#5',
        'A5 . G5 F#5 - E5 D5 E5',
        'G5 . G5 F#5 - E5 . .',
        'B4 - C#5 - A#4 - . .',
      ].join(' | '),
      pad: false,
    },
    b: pre,
    s: chorus,
    chant: {
      chords: 'Bm7 | Bm7/A | Gmaj7 | F#7 | Bm7 | Bm7/A | Gmaj7 | F#7sus4 F#7',
      melody: [
        'D5 . D5 . F#5 - . .',
        '. . . . . . . .',
        'D5 . D5 . G5 - . .',
        '. . . . . . . .',
        'D5 . D5 D5 . F#5 . .',
        'E5 . E5 E5 . C#5 . .',
        'D5 . D5 D5 . B4 . .',
        'C#5 . C#5 . A#4 - . .',
      ].join(' | '),
      counter: [
        '. . . . . . . .',
        'B4 C#5 D5 E5 F#5 G5 A5 B5',
        '. . . . . . . .',
        'A#5 - C#6 - A#5 F#5 E5 C#5',
        '. . . . . . . .',
        '. . . . . . F#5 A5',
        'D6 - - - - - . .',
        'B5 - - - A#5 - - -',
      ].join(' | '),
      harmony: 'stab',
      bass: 'octave',
      pad: false,
    },
    lift: { chords: 'G7sus4 G7', melody: 'C6 - - - B5 - D6 F6', key: 'Cm', lead: 'alt' },
    up: transposed(chorus, 1, 'Cm'),
    outro: {
      chords: 'Gmaj7 | F#7sus4 F#7',
      melody: 'D6 - - - - - B5 - | C#6 - - - A#5 - - -',
      harmony: 'stab',
      drums: 'half',
    },
  },
  form: ['intro', 'a', 'b', 's', 'chant', 'b', 'lift', 'up', 'outro'],
  loopFrom: 1,
};
