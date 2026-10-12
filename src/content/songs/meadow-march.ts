// Sunny dotted-rhythm stroll; a second voice answers every phrase in the gaps the tune leaves.
import type { SongDef } from '../../domain/music/song.ts';

export const meadowMarch: SongDef = {
  id: 'meadow-march',
  title: 'Meadow March',
  style: 'pixel-quest',
  mood: { valence: 0.65, energy: 0.15 },
  key: 'C',
  bpm: 136,
  sections: {
    a: {
      chords: 'C | F | C | G | Em | F | D7 | G7',
      melody: [
        'E5 - - F5 G5 . E5 .',
        'A5 - - C6 F5 . . .',
        'G5 - - E5 C5 . E5 .',
        'D5 - - B4 D5 . . .',
        'E5 - - F5 G5 . B5 .',
        'C6 - - A5 F5 . . .',
        'F#5 - - A5 C6 . D6 .',
        'B5 - - A5 G5 . . .',
      ].join(' | '),
      counter: [
        '. . . . . . . .',
        '. . . . . A4 B4 C5',
        '. . . . . . . .',
        '. . . . . B4 A4 G4',
        '. . . . . . . .',
        '. . . . . A4 C5 D5',
        '. . . . . . . .',
        '. . . . . F5 D5 B4',
      ].join(' | '),
    },
    b: {
      chords: 'F | G | Em7 | A7 | Dm7 | G7 | Em7 A7 | Dm7 G7',
      melody: [
        'A5 - - B5 C6 . A5 .',
        'D6 - - B5 G5 . . .',
        'E5 - - G5 B5 . G5 .',
        'C#6 - - E6 A5 . . .',
        'F5 - - G5 A5 . C6 .',
        'G5 - - B5 D6 . . .',
        'E6 - - D6 C#6 . A5 .',
        'D6 - - C6 B5 . G5 .',
      ].join(' | '),
      counter: [
        '. . . . . . . .',
        '. . . . . D5 B4 G4',
        '. . . . . . . .',
        '. . . . . E5 C#5 A4',
        '. . . . . . . .',
        '. . . . . F5 G5 B5',
        '. . . . . . . .',
        '. . . . . . . .',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
