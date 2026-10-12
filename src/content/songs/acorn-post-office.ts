// A brisk little errand walk: stamp-stamp repeated notes, a skip down, guide tones trotting alongside.
import type { SongDef } from '../../domain/music/song.ts';

export const acornPostOffice: SongDef = {
  id: 'acorn-post-office',
  title: 'Acorn Post Office',
  style: 'cozy-village',
  mood: { valence: 0.7, energy: -0.6 },
  key: 'C',
  bpm: 100,
  sections: {
    a: {
      chords: 'C | Am7 | Dm7 | G7 | Em7 | A7 | Dm7 G7 | C',
      melody: [
        'G5 . G5 . E5 F5 G5 .',
        'A5 - G5 E5 C5 . . .',
        'F5 . F5 . D5 E5 F5 .',
        'G5 - F5 D5 B4 . D5 G5',
        'B5 . B5 . G5 A5 B5 .',
        'C#6 - B5 A5 E5 . A5 C#6',
        'D6 - C6 A5 G5 - F5 D5',
        'E5 - C5 - - - . .',
      ].join(' | '),
    },
    b: {
      chords: 'Fmaj7 | G7 | Em7 | Am7 | Dm7 | G7 | Em7 A7 | Dm7 G7',
      melody: [
        'A5 . F5 A5 C6 - A5 .',
        'B5 . G5 B5 D6 - B5 .',
        'G5 . E5 G5 B5 - A5 G5',
        'A5 - - - E5 . . .',
        'F5 . A5 . D6 - - -',
        'E6 - D6 B5 G5 - . .',
        'G5 . B5 . A5 . C#6 .',
        'D6 - C6 A5 B5 - G5 .',
      ].join(' | '),
      counter: [
        'A4 - - - E4 - - -',
        'F4 - - - B4 - - -',
        'G4 - - - D5 - - -',
        'C5 - - - G4 - - -',
        'F4 - - - C5 - - -',
        'B4 - - - F4 - - -',
        'G4 - - - G4 - - -',
        'F4 - - - F4 - - -',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
