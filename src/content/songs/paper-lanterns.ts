// A nostalgic waltz that dims for a moment: the borrowed minor four bends one note down before the tune finds home.
import type { SongDef } from '../../domain/music/song.ts';

export const paperLanterns: SongDef = {
  id: 'paper-lanterns',
  title: 'Paper Lanterns',
  style: 'town-waltz',
  mood: { valence: 0.05, energy: -0.1 },
  key: 'Bb',
  bpm: 126,
  meter: 3,
  sections: {
    a: {
      chords: 'Bb | Dm7 | Ebmaj7 | Ebm6 | Bb/D | Gm7 | Cm7 F7 | Bb',
      melody: [
        'F5 - - - G5 F5',
        'A5 - - - F5 D5',
        'G5 - Bb5 - D6 -',
        'C6 - - - Bb5 Gb5',
        'F5 - - - D5 F5',
        'Bb5 - - - A5 G5',
        'Eb5 F5 G5 - A5 -',
        'Bb5 - - - . .',
      ].join(' | '),
    },
    b: {
      chords: 'Gm7 | Dm7 | Ebmaj7 | Bb/D | Cm7 | Ebm6 | Bb/F Gm7 | Cm7 F7',
      melody: [
        'D6 - - - - -',
        'C6 - - - A5 F5',
        'Bb5 - - - G5 Eb5',
        'F5 - - - Bb5 D6',
        'Eb6 - - - D6 C6',
        'Eb6 - - - Bb5 Gb5',
        'F5 - - - D5 -',
        'Eb5 - - - C5 Eb5',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
