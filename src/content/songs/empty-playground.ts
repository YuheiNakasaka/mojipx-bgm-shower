// A small music-box tune in minor, simple as a nursery song but lonely, with a low second voice answering in the second half.
import type { SongDef } from '../../domain/music/song.ts';

export const emptyPlayground: SongDef = {
  id: 'empty-playground',
  title: 'Empty Playground',
  style: 'snowfall',
  mood: { valence: -0.6, energy: -0.7 },
  key: 'Am',
  bpm: 84,
  sections: {
    a: {
      chords: 'Am | Fmaj7 | C | G | Dm | Am | F E | Am',
      melody: [
        'E5 - - D5 C5 - E5 -',
        'A5 - - - - - G5 -',
        'E5 - - D5 C5 - G4 -',
        'B4 - - - D5 - - -',
        'F5 - - E5 D5 - A4 -',
        'C5 - - B4 A4 - - -',
        'D5 - - C5 B4 - G#4 -',
        'A4 - - - . . E5 G5',
      ].join(' | '),
    },
    b: {
      chords: 'F | C | G | Am | Dm | Am | F | E7',
      melody: [
        'A5 - - G5 F5 - - -',
        'G5 - - F5 E5 - - -',
        'D5 - G5 - B5 - D6 -',
        'C6 - - - - - B5 A5',
        'A5 - - G5 F5 - - -',
        'E5 - - D5 C5 - - -',
        'D5 - - - C5 - A4 -',
        'B4 - - - - - . .',
      ].join(' | '),
      counter: [
        'F4 - - - A4 - - -',
        'C5 - - - G4 - E4 -',
        'B4 - - - G4 - D4 -',
        'E4 - - - A4 - - -',
        'F4 - - - A4 - D5 -',
        'C5 - - - E4 - A4 -',
        'A4 - - - F4 - - -',
        'G#4 - - - E4 - - -',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
