// A slow minor waltz over a falling bass: the tune drifts down in thirds with it, warms briefly, then settles cold again.
import type { SongDef } from '../../domain/music/song.ts';

export const winterPlatform: SongDef = {
  id: 'winter-platform',
  title: 'Winter Platform',
  style: 'town-waltz',
  mood: { valence: -0.55, energy: -0.6 },
  key: 'Gm',
  bpm: 96,
  meter: 3,
  sections: {
    a: {
      chords: 'Gm | Gm/F | Ebmaj7 | D7 | Cm7 | Gm/Bb | Am7b5 D7 | Gm',
      melody: [
        'D6 - - - C6 Bb5',
        'A5 - - - . F5',
        'G5 - - - Bb5 D6',
        'C6 - - - A5 F#5',
        'G5 - - - C6 D6',
        'Bb5 - - - G5 D6',
        'Eb6 - C6 - A5 F#5',
        'G5 - - - - -',
      ].join(' | '),
    },
    b: {
      chords: 'Ebmaj7 | F | Dm7 | Gm7 | Cm7 | F7 | Bbmaj7 Ebmaj7 | Am7b5 D7',
      melody: [
        'G5 - Bb5 - D6 -',
        'C6 - - - - -',
        'F5 - A5 - C6 -',
        'D6 - - - - -',
        'Eb6 - - - D6 C6',
        'A5 - - - C6 Eb6',
        'D6 - - - Bb5 -',
        'C6 - Eb6 - D6 -',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
