// Slow minor-ninth drizzle: two-note sighs falling over the chords, rising to a held high line in the second half.
import type { SongDef } from '../../domain/music/song.ts';

export const rainOnGlass: SongDef = {
  id: 'rain-on-glass',
  title: 'Rain on Glass',
  style: 'lofi-loop',
  mood: { valence: -0.7, energy: -0.6 },
  key: 'Em',
  bpm: 78,
  sections: {
    a: {
      chords: 'Em9 | Cmaj7 | Am9 | B7sus4 B7 | Em9 | Cmaj7 | Am9 | B7',
      melody: [
        '. . B5 A5 G5 - F#5 -',
        'E5 - - - . . B4 C5',
        'D5 - C5 - . . E5 G5',
        'A5 - - - F#5 - - .',
        '. . B5 A5 G5 - E6 -',
        'D6 - B5 - . . A5 G5',
        'B5 - A5 - . . G5 E5',
        'F#5 - - E5 D#5 - - .',
      ].join(' | '),
    },
    b: {
      chords: 'Cmaj7 | Bm7 | Am9 | Em9 | Cmaj7 | Bm7 | Am9 | F#m7b5 B7',
      melody: [
        '. . G5 B5 E6 - - -',
        'D6 - - - B5 - A5 -',
        'C6 - - - B5 - - A5',
        'G5 - - - . . E5 F#5',
        'G5 - - - E6 - - -',
        'D6 - - - C#6 - B5 -',
        'E6 - - - C6 - B5 -',
        'A5 - - - F#5 - - -',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
