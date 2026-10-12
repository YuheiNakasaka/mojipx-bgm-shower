// Gentle bells far apart: wide leaps with room to ring between them, over slow major and minor sevenths.
import type { SongDef } from '../../domain/music/song.ts';

export const slowClouds: SongDef = {
  id: 'slow-clouds',
  title: 'Slow Clouds',
  style: 'snowfall',
  mood: { valence: 0, energy: -0.65 },
  key: 'C',
  bpm: 88,
  sections: {
    a: {
      chords: 'Cmaj7 | Em7 | Fmaj7 | Gsus4 G | Cmaj7 | Am7 | Dm7 | G',
      melody: [
        'C5 . G5 . E6 - - .',
        'D6 - - . B5 . G5 .',
        'A4 . E5 . C6 - - .',
        'G5 - - . D5 . B4 .',
        'G4 . E5 . C6 - - .',
        'B5 - - . E5 . A5 .',
        'F5 . C6 . A5 - - .',
        'B5 - - . G5 . D5 .',
      ].join(' | '),
    },
    b: {
      chords: 'Fmaj7 | G | Em7 | Am7 | Fmaj7 | G | Dm7 | G7sus4 G7',
      melody: [
        'F5 . C6 . A5 - - .',
        'G5 . D6 . B5 - - .',
        'E6 - - - - - D6 .',
        'C6 - - - G5 . E5 .',
        'A5 . E6 . C6 - - .',
        'B5 - - . D6 . G5 .',
        'A5 - - . F5 . D6 .',
        'C6 - - . B5 . G5 .',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
