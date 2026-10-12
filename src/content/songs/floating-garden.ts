// Drifting through warm major sevenths and ninths, a soft low swell sighing downward beneath a climbing tune.
import type { SongDef } from '../../domain/music/song.ts';

export const floatingGarden: SongDef = {
  id: 'floating-garden',
  title: 'Floating Garden',
  style: 'starlit-dream',
  mood: { valence: 0.15, energy: -0.75 },
  key: 'A',
  bpm: 70,
  sections: {
    a: {
      chords: 'Amaj7 | Dmaj9 | Amaj7 | Dmaj9 | C#m7 | F#m7 | Bm7 | Esus4 E',
      melody: [
        'E5 - B5 - C#6 - - -',
        'E6 - - - C#6 - A5 -',
        'G#5 - - - - - E5 -',
        'F#5 - - - - - . .',
        'E5 - G#5 - B5 - - -',
        'C#6 - - - A5 - - -',
        'D6 - - - C#6 - B5 -',
        'A5 - - - G#5 - . .',
      ].join(' | '),
      counter: [
        'C#4 - - - - - - -',
        '- - - - - - - -',
        'B3 - - - - - - -',
        'A3 - - - - - - -',
        'G#3 - - - - - - -',
        'A3 - - - - - - -',
        'D4 - - - - - - -',
        'B3 - - - - - - -',
      ].join(' | '),
    },
    b: {
      chords: 'Dmaj7 | C#m7 | Bm7 | Aadd9 | Fmaj7 | Dm6 | Esus4 | E',
      melody: [
        'F#5 - - - A5 - - -',
        'G#5 - - - B5 - - -',
        'A5 - - - D6 - - -',
        'B5 - - - E6 - . .',
        'F6 - - - - - E6 -',
        'D6 - - - B5 - A5 -',
        'B5 - - - A5 - - -',
        'G#5 - - - - - . .',
      ].join(' | '),
      counter: [
        'A3 - - - - - - -',
        'G#3 - - - - - - -',
        'A3 - - - - - - -',
        'C#4 - - - - - - -',
        'C4 - - - - - - -',
        'B3 - - - - - - -',
        'A3 - - - - - - -',
        'G#3 - - - - - - -',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
