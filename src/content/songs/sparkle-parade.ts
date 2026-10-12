// Bright parade pop: a bouncing verse, a pre-chorus that climbs in sequence, and a big chorus lit by secondary dominants.
import type { SongDef } from '../../domain/music/song.ts';

export const sparkleParade: SongDef = {
  id: 'sparkle-parade',
  title: 'Sparkle Parade',
  style: 'nineties-pop',
  mood: { valence: 0.7, energy: 0.6 },
  key: 'E',
  bpm: 144,
  sections: {
    verse: {
      chords: 'E | B/D# | C#m7 | A | E | B/D# | F#m7 | B7sus4 B',
      melody: [
        'G#4 B4 E5 - . E5 D#5 E5',
        'F#5 - D#5 - B4 - C#5 D#5',
        'E5 - . C#5 E5 G#5 - F#5',
        'E5 - - - C#5 - . .',
        'G#4 B4 E5 - . E5 F#5 G#5',
        'B5 - - - G#5 - F#5 D#5',
        'A5 - G#5 F#5 E5 - C#5 E5',
        'F#5 - E5 - D#5 - - .',
      ].join(' | '),
      drums: 'eight',
    },
    pre: {
      chords: 'A | B | G#m7 C#m7 | F#m7 B7',
      melody: ['. A4 C#5 E5 - - F#5 E5', '. B4 D#5 F#5 - - G#5 F#5', '. D#5 F#5 G#5 - - B5 G#5', 'A5 - C#6 - B5 - D#6 -'].join(' | '),
    },
    chorus: {
      chords: 'E | G#7 | C#m7 | E7 | A | B | E/G# C#m7 | F#m7 B',
      melody: [
        'E6 - - - - - D#6 C#6',
        'C6 - - - D#6 - C6 G#5',
        'C#6 - - - E6 - D#6 C#6',
        'B5 - G#5 - D6 - - -',
        'C#6 - - - A5 - B5 C#6',
        'D#6 - - - F#6 - E6 D#6',
        'G#6 - - - E6 - C#6 -',
        'A5 - F#5 - D#5 - - -',
      ].join(' | '),
    },
  },
  form: ['verse', 'pre', 'chorus'],
};
