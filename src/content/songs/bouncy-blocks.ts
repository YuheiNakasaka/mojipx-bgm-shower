// Springy staccato hops: each figure jumps an octave and tumbles back down, like blocks bouncing into place.
import type { SongDef } from '../../domain/music/song.ts';

export const bouncyBlocks: SongDef = {
  id: 'bouncy-blocks',
  title: 'Bouncy Blocks',
  style: 'puzzle-pop',
  mood: { valence: 0.7, energy: 0.05 },
  key: 'G',
  bpm: 132,
  sections: {
    a: {
      chords: 'G | Em | C | D7 | G | Em | Am7 D7 | G',
      melody: [
        'G4 . G5 . D5 . B4 D5',
        'E5 . E6 . B5 . G5 B5',
        'C6 . C5 . E5 G5 C6 .',
        'D6 . . C6 . A5 F#5 D5',
        'G4 . G5 . D5 . B4 D5',
        'E5 . E6 . B5 G5 E5 .',
        'A4 . A5 . F#5 . D5 .',
        'G5 . G4 . G5 . . .',
      ].join(' | '),
    },
    b: {
      chords: 'C | D | Bm7 | Em7 | Am7 | D | G/B C | Am7 D7',
      melody: [
        'E5 . E6 . C6 . G5 .',
        'F#5 . F#6 . D6 . A5 .',
        'B5 - - - A5 . F#5 .',
        'G5 - - - E5 . D5 .',
        'C5 . C6 . A5 . E5 .',
        'F#5 . A5 . D6 - - -',
        'B5 . G5 . C6 . E6 .',
        'C6 . A5 . F#5 . D5 .',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
