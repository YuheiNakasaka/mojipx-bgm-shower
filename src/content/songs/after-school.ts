// Wistful walk home: long notes broken by quick sixteenth runs, and a minor iv that tugs at the heart.
import type { SongDef } from '../../domain/music/song.ts';

export const afterSchool: SongDef = {
  id: 'after-school',
  title: 'After School',
  style: 'pixel-quest',
  mood: { valence: 0, energy: 0.05 },
  key: 'F',
  bpm: 124,
  steps: 4,
  sections: {
    a: {
      chords: 'F | Am7 | Bb | Bbm | F | Dm7 | Gm7 | C7',
      melody: [
        'A5 - - - - - - - F5 - G5 - C5 - - -',
        'E5 - - - - - - - . . C5 D5 E5 F5 G5 A5',
        'Bb5 - - - - - - - A5 - - - G5 - - -',
        'F5 - - - - - - - Db5 - - - C5 - Bb4 -',
        'C5 - - - - - A4 - C5 - - - F5 - A5 -',
        'C6 - - - - - - - . . A5 Bb5 C6 Bb5 A5 G5',
        'F5 - - - - - G5 F5 D5 - - - Bb4 - - -',
        'C5 - - - - - - - . . . . G4 A4 Bb4 C5',
      ].join(' | '),
    },
    b: {
      chords: 'Bbmaj7 | C | Am7 | Dm7 | Gm7 | Bbm | F | Gm7 C7',
      melody: [
        'D5 - - - - - - - F5 - A5 - D6 - - -',
        'C6 - - - - - - - . . Bb5 A5 G5 A5 Bb5 C6',
        'E6 - - - - - - - D6 - C6 - A5 - - -',
        'F5 - - - - - - - . . A5 G5 A5 C6 D6 E6',
        'D6 - - - - - - - Bb5 - - - C6 - - -',
        'Db6 - - - - - - - C6 - Bb5 - F5 - - -',
        'A5 - - - - - - - . . C6 A5 G5 F5 E5 F5',
        'G5 - - - Bb5 - - - E5 - - - . . F5 G5',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
  parts: { drums: 'light' },
};
