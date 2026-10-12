// Sunny lazy afternoon: added-ninth and sixth chords, a relaxed syncopated tune that leans on the bright sixths and ninths.
import type { SongDef } from '../../domain/music/song.ts';

export const gardenHammock: SongDef = {
  id: 'garden-hammock',
  title: 'Garden Hammock',
  style: 'lofi-loop',
  mood: { valence: 0.6, energy: -0.45 },
  key: 'D',
  bpm: 84,
  sections: {
    a: {
      chords: 'Dadd9 | Gadd9 | Bm7 | A6 | Dadd9 | Gadd9 | Em7 | Asus4 A',
      melody: [
        '. F#5 A5 B5 - - A5 F#5',
        'E5 - - - D5 - B4 -',
        '. D5 F#5 A5 - - F#5 E5',
        'F#5 - - - E5 - C#5 -',
        '. F#5 A5 B5 - - D6 -',
        'B5 - - A5 - - G5 -',
        'F#5 - - E5 - - B4 -',
        'D5 - - - C#5 - - -',
      ].join(' | '),
    },
    b: {
      chords: 'Gadd9 | A6 | F#m7 | Bm7 | Gadd9 | A6 | D6 | Em7 A7',
      melody: [
        '. D5 G5 A5 B5 - - -',
        'C#6 - - B5 A5 - F#5 -',
        '. C#5 E5 F#5 A5 - - -',
        'B5 - - A5 F#5 - - -',
        '. D6 - B5 D6 - - -',
        'E6 - - - - - C#6 -',
        'B5 - - - A5 - F#5 -',
        'G5 - - F#5 E5 - - -',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
