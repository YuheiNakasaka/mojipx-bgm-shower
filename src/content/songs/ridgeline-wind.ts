// Windswept minor ballad-march; the bridge breaks into the relative major before the wind returns.
import type { SongDef } from '../../domain/music/song.ts';

const opening = [
  'F#5 - - - B4 - D5 -',
  'G5 - - - F#5 E5 D5 -',
  'A5 - - - D5 - F#5 -',
  'E5 - - - C#5 D5 E5 F#5',
  'B5 - - - F#5 - D5 -',
  'D6 - - - B5 - A5 G5',
];

export const ridgelineWind: SongDef = {
  id: 'ridgeline-wind',
  title: 'Ridgeline Wind',
  style: 'grand-field',
  mood: { valence: -0.1, energy: 0.65 },
  key: 'Bm',
  bpm: 126,
  sections: {
    a: {
      chords: 'Bm | G | D | A | Bm | G | Em7 | F#7sus4 F#7',
      melody: [...opening, 'E5 - - - G5 - A5 -', 'B5 - - - A#5 - - -'].join(' | '),
    },
    a2: {
      chords: 'Bm | G | D | A | Bm | G | Em7 F#7 | Bm',
      melody: [...opening, 'E5 - G5 - A#5 - C#6 -', 'B5 - - - - - . .'].join(' | '),
    },
    b: {
      chords: 'D | G | A | F#m | G | A | Em7 | F#7',
      melody: [
        'F#5 - - E5 D5 - A5 -',
        'B5 - - A5 G5 - D5 -',
        'E5 - - F#5 A5 - - B5',
        'C#6 - - B5 A5 - - -',
        'B5 - - C#6 D6 - B5 -',
        'E6 - - - C#6 - A5 -',
        'B5 - - - G5 - E5 -',
        'F#5 - - - A#5 - C#6 -',
      ].join(' | '),
    },
  },
  form: ['a', 'a2', 'b', 'a2'],
};
