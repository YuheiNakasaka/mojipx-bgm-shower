import type { SongDef } from '../../domain/music/song.ts';

// Sugary, quick major bounce: hopping staccato figures, then long sweet notes over a skipping counter.
export const turboCandy: SongDef = {
  id: 'turbo-candy',
  title: 'Turbo Candy',
  style: 'puzzle-pop',
  mood: { valence: 0.75, energy: 0.75 },
  key: 'C',
  bpm: 156,
  sections: {
    a: {
      chords: 'C | Am | Dm7 | G7 | C | E7 | F G | C',
      melody: [
        'E6 . G6 E6 . C6 D6 .',
        'C6 . E6 C6 . A5 B5 .',
        'D6 . F6 D6 . A5 C6 .',
        'B5 - - G5 - - D6 .',
        'E6 . G6 E6 . C6 D6 .',
        'E6 . G#6 E6 . B5 D6 .',
        'C6 . A5 C6 . B5 D6 .',
        'C6 - - - . . D6 E6',
      ].join(' | '),
    },
    b: {
      chords: 'F | G | Em7 | Am | Dm7 | G7 | E7 Am | D7 G7',
      melody: [
        'F6 - - - E6 - C6 -',
        'D6 - - - B5 - G5 -',
        'E6 - - - D6 - B5 -',
        'C6 - - - - - . .',
        'A5 - D6 - F6 - A6 -',
        'G6 - - - F6 - D6 -',
        'E6 - D6 - C6 - B5 -',
        'A5 - C6 - B5 - D6 -',
      ].join(' | '),
      counter: [
        'A4 . C5 . F5 . C5 .',
        'B4 . D5 . G5 . D5 .',
        'G4 . B4 . E5 . B4 .',
        'E5 . C5 . E5 G5 A5 B5',
        'D5 . F5 . A5 . F5 .',
        'B4 . D5 . F5 . D5 .',
        'G#4 . E5 . A4 . E5 .',
        'F#4 . A4 . G4 . B4 .',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
