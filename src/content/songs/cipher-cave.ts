// A dark waltz that picks its way between diminished chords, then climbs a chromatic bass like a lock turning.
import type { SongDef } from '../../domain/music/song.ts';

export const cipherCave: SongDef = {
  id: 'cipher-cave',
  title: 'Cipher Cave',
  style: 'deep-dungeon',
  mood: { valence: -0.75, energy: 0.15 },
  key: 'Bm',
  bpm: 100,
  meter: 3,
  sections: {
    a: {
      chords: 'Bm | Bm/A | G A#dim7 | Bm | D D#dim7 | Em | C#m7b5 F#7 | Bm',
      melody: [
        'F#5 - - G5 F#5 D5',
        'B4 - - - C#5 D5',
        'G5 - - F#5 E5 -',
        'D5 - - - . E5',
        'F#5 - A5 - C6 -',
        'B5 - - A5 G5 -',
        'E5 - G5 - A#5 -',
        'B5 - - - - .',
      ].join(' | '),
    },
    b: {
      chords: 'G | G#dim7 | A | A#dim7 | Bm | Em7 C#m7b5 | F#7sus4 | F#7',
      melody: [
        'B5 - - A5 G5 -',
        'D6 - - B5 G#5 -',
        'C#6 - - B5 A5 -',
        'E6 - - C#6 A#5 -',
        'B5 - D6 - F#6 -',
        'E6 - - D6 C#6 -',
        'B5 - - C#6 B5 -',
        'A#5 - - - - .',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
