// A slow, tender waltz: long sighing notes stepping down, then a gentle lift and a soft return home.
import type { SongDef } from '../../domain/music/song.ts';

export const windowSeatWaltz: SongDef = {
  id: 'window-seat-waltz',
  title: 'Window Seat Waltz',
  style: 'town-waltz',
  mood: { valence: 0.65, energy: -0.55 },
  key: 'F',
  bpm: 120,
  meter: 3,
  sections: {
    a: {
      chords: 'F | Dm7 | Bbmaj7 | C7 | Am7 | Dm7 | Gm7 C7 | F',
      melody: [
        'A5 - - - G5 F5',
        'F5 - - - E5 D5',
        'D5 - F5 - A5 -',
        'G5 - - - . .',
        'A5 - - - C6 E6',
        'D6 - - - C6 A5',
        'Bb5 - A5 G5 E5 -',
        'F5 - - - A5 C6',
      ].join(' | '),
    },
    b: {
      chords: 'Bbmaj7 | C7 | Am7 | D7 | Gm7 | C7 | Am7 Dm7 | Gm7 C7',
      melody: [
        'D6 - - - C6 Bb5',
        'C6 - - - Bb5 G5',
        'A5 - - - C6 E6',
        'D6 - - - A5 F#5',
        'G5 - Bb5 - D6 -',
        'E6 - - - - -',
        'C6 - - - A5 -',
        'Bb5 - A5 - G5 -',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
