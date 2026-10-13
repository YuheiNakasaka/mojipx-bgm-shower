import type { SongDef } from '../../domain/music/song.ts';

// A sleepy village post office: the stamp-stamp tune walks in sequence, warms through the backdoor flat VII7, a
// letter from far away floats on a Lydian II over the tonic while the second voice keeps stamping, and the round ends
// resting on V.
const stamp = ['G5 . G5 . E5 F5 G5 .', 'A5 - G5 E5 C5 . . .', 'F5 . F5 . D5 E5 F5 .', 'G5 - F5 D5 B4 . D5 G5'];
const stampChords = 'Cmaj7 | Am7 | Dm7 | G7sus4 G7';

export const acornPostOffice: SongDef = {
  id: 'acorn-post-office',
  title: 'Acorn Post Office',
  style: 'cozy-village',
  mood: { valence: 0.7, energy: -0.6 },
  key: 'C',
  bpm: 96,
  sections: {
    bell: {
      chords: 'Fmaj7 | G7sus4 G7',
      melody: 'A5 . C6 . E6 - - - | D6 - - - B5 - . .',
      drums: false,
      bass: 'whole',
    },
    a: {
      chords: `${stampChords} | Em7 | A7 | Dm7 G7 | C6`,
      melody: [...stamp, 'B5 . B5 . G5 A5 B5 .', 'C#6 - B5 A5 E5 . A5 C#6', 'D6 - C6 A5 G5 - F5 D5', 'E5 - C5 - - - . .'].join(' | '),
    },
    a2: {
      chords: `${stampChords} | Em7 | A7 | Fm7 Bb7 | Cmaj7`,
      melody: [...stamp, 'B5 . B5 . G5 A5 B5 .', 'C#6 - B5 A5 E5 . A5 C#6', 'C6 - Ab5 F5 D6 - Ab5 -', 'B5 - - - - - G5 -'].join(' | '),
      counter: [
        'E5 . E5 . C5 D5 E5 .',
        '. . . . . E5 G5 A5',
        'D5 . D5 . A4 C5 D5 .',
        'D5 - C5 - G4 . . .',
        'G5 . G5 . E5 . G5 .',
        'E5 - - - . . . .',
        'Ab4 - - - - - - -',
        'E5 - - - - - . .',
      ].join(' | '),
    },
    letter: {
      chords: 'Cmaj7 | D/C | Cmaj7 | D/C | Fmaj7 | Em7 | Dm7 | G7sus4 G7',
      melody: [
        'G5 - - - B5 - - -',
        'F#5 - - - A5 - - -',
        'G5 - - - E6 - - -',
        'D6 - - - - - C6 A5',
        'C6 - - - A5 - - -',
        'B5 - - - G5 - - -',
        'A5 - - - F5 - - -',
        'G5 - - - - - . .',
      ].join(' | '),
      counter: [
        'C5 . C5 . E5 D5 C5 .',
        'D5 . D5 . F#5 E5 D5 .',
        'C5 . C5 . E5 D5 C5 .',
        'D5 . D5 . A4 B4 C5 .',
        'F4 . F4 . A4 G4 F4 .',
        'E4 . E4 . G4 A4 B4 .',
        'D4 . D4 . F4 E4 D4 .',
        'G4 . G4 . F4 . D4 .',
      ].join(' | '),
      harmony: 'broken',
      bass: 'half',
      drums: false,
    },
    a3: {
      chords: `${stampChords} | Em7 | A7 | Dm7 | G7sus4 G7`,
      melody: [...stamp, 'B5 . B5 . G5 A5 B5 .', 'C#6 - B5 A5 E5 . A5 C#6', 'D6 - C6 A5 F5 - E5 D5', 'D5 - - - - - . .'].join(' | '),
      counter: [
        '. . . . . . . .',
        '. . . . . C5 B4 A4',
        '. . . . . . . .',
        '. . . . . . . .',
        '. . . . . . . .',
        '. . . . . G4 . .',
        'F4 - - - A4 - - -',
        '. . . . B4 D5 F5 G5',
      ].join(' | '),
    },
  },
  form: ['bell', 'a', 'a2', 'letter', 'a3'],
  loopFrom: 1,
};
