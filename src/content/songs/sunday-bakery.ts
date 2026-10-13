import type { SongDef } from '../../domain/music/song.ts';

// A swinging Sunday-morning town theme: a skipping tune over a walking bass and a secondary dominant, a brighter strain
// in the key of IV that comes home on flat VII, a bell-like counter answering the second pass, and a wistful
// relative-minor bridge that leans back into the tune.
const skip = [
  'C5 . A4 C5 F5 - E5 .',
  'D5 - C5 - A4 - . .',
  'Bb4 . D5 F5 G5 - F5 .',
  'E5 - - - . . G4 A4',
  'C5 . A4 C5 E5 - D5 .',
  'F5 - E5 - D5 - C5 -',
  'Bb4 - D5 - E5 - G5 -',
];

const tune = {
  chords: 'Fmaj7 | D7 | Gm7 | C7 | Am7 | Dm7 | Gm7 C7 | F',
  melody: [...skip, 'F5 - - - - - . .'].join(' | '),
};

export const sundayBakery: SongDef = {
  id: 'sunday-bakery',
  title: 'Sunday Bakery',
  style: 'cozy-village',
  mood: { valence: 0.68, energy: -0.5 },
  key: 'F',
  bpm: 104,
  sections: {
    intro: {
      chords: 'Fmaj7 | C7',
      melody: 'A4 - C5 - F5 - A5 - | G5 - E5 - C5 - - -',
      drums: false,
    },
    a: {
      chords: 'Fmaj7 | D7 | Gm7 | C7 | Am7 | Dm7 | Gm7 C7 | F F7',
      melody: [...skip, 'F5 - - - Eb5 - . .'].join(' | '),
    },
    b: {
      key: 'Bb',
      chords: 'Bbmaj7 | G7 | Cm7 | F7 | Dm7 | Gm7 | Ebmaj7 | Gm7 C7',
      melody: [
        '. F5 Bb5 D6 C6 - A5 -',
        'B5 - - - D6 - - -',
        '. G5 C6 Eb6 D6 - C6 -',
        'A5 - - - - - . .',
        '. A5 D6 F6 G6 - F6 -',
        'D6 - - - Bb5 - G5 -',
        'G5 - Bb5 - D6 - - -',
        'C6 - Bb5 - G5 - E5 -',
      ].join(' | '),
      counter: [
        'D5 - - - - - - -',
        'F5 - - - - - - -',
        'Eb5 - - - - - - -',
        'Eb5 - - - C5 D5 Eb5 -',
        'F5 - - - - - - -',
        'Bb4 - - - D5 - - -',
        'Eb5 - - - - - - -',
        'D5 - - - Bb4 - - -',
      ].join(' | '),
      harmony: 'broken',
    },
    a2: {
      ...tune,
      counter: [
        '. . . . . . A5 G5',
        'F#5 - - - . . A5 C6',
        'Bb5 - - - . . . .',
        'G5 - - - E5 F5 G5 -',
        '. . . . . . . .',
        'A5 - - - F5 - - -',
        'G5 - - - Bb5 - - -',
        'A5 - - - . . C6 A5',
      ].join(' | '),
    },
    c: {
      chords: 'Dm7 | Bbmaj7 | Gm7 | A7 | Dm7 | Bbmaj7 | Gm7 | C7sus4 C7',
      melody: [
        'F5 - - - E5 - D5 -',
        'D5 - - - A4 - - -',
        'Bb4 - D5 - G5 - F5 -',
        'E5 - - - C#5 - - -',
        'F5 - A5 - D6 - C6 -',
        'Bb5 - - - A5 - F5 -',
        'G5 - - - F5 - D5 -',
        'F5 - - - E5 - . .',
      ].join(' | '),
      counter: [
        'A4 - - - - - - -',
        'F4 - - - - - - -',
        'G4 - - - Bb4 - - -',
        'G4 - - - A4 - - -',
        'A4 - - - D5 - - -',
        'D5 - - - C5 - - -',
        'Bb4 - - - - - - -',
        'Bb4 - - - - - - -',
      ].join(' | '),
      harmony: 'broken',
      bass: 'half',
      drums: false,
    },
  },
  form: ['intro', 'a', 'b', 'a2', 'c'],
  loopFrom: 1,
};
