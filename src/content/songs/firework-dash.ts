// Festival sprint: a five-note melody bouncing over drums, rising to a bright high answer in the second half.
import type { SongDef } from '../../domain/music/song.ts';

export const fireworkDash: SongDef = {
  id: 'firework-dash',
  title: 'Firework Dash',
  style: 'summer-festival',
  mood: { valence: 0.65, energy: 0.7 },
  key: 'D',
  bpm: 140,
  sections: {
    a: {
      chords: 'D | Bm7 | G | Asus4 A | D | Bm7 | Em7 Asus4 | D',
      melody: [
        'D5 . D5 E5 F#5 - A5 -',
        'B5 - A5 F#5 E5 - F#5 -',
        'B4 . B4 D5 E5 - D5 B4',
        'A4 - B4 - E5 - - -',
        'D5 . D5 E5 F#5 - A5 -',
        'B5 - A5 B5 D6 - B5 -',
        'E6 - D6 B5 A5 - B5 A5',
        'F#5 - E5 - D5 - - -',
      ].join(' | '),
    },
    b: {
      chords: 'G | A | F#m7 | Bm7 | G | A | Bm7 Em7 | Asus4 A',
      melody: [
        'B5 - D6 B5 E6 - D6 -',
        'E6 - - - A5 - B5 -',
        'A5 - - F#5 E5 - F#5 A5',
        'B5 - - - - - . .',
        'B5 - D6 B5 E6 - F#6 -',
        'E6 - - - - - F#6 E6',
        'D6 - B5 A5 B5 - D6 -',
        'E6 - D6 - B5 - A5 -',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
