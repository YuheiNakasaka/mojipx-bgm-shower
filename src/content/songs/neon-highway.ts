import type { SongDef } from '../../domain/music/song.ts';

export const neonHighway: SongDef = {
  id: 'neon-highway',
  title: 'Neon Highway',
  style: 'neon-rush',
  mood: { valence: 0.4, energy: 0.85 },
  key: 'Am',
  bpm: 150,
  sections: {
    a: {
      chords: 'Am | F | G | Am | Am | F | G | E',
      melody: [
        'A5 - E5 - A5 - C6 -',
        'C6 - A5 - F5 - A5 -',
        'B5 - G5 - D5 - G5 -',
        'A5 - - - . . E5 G5',
        'A5 - E5 - A5 - C6 D6',
        'E6 - D6 - C6 - A5 -',
        'D6 - B5 - G5 - B5 -',
        'G#5 - - - B5 - - -',
      ].join(' | '),
    },
    b: {
      chords: 'F | G | Em7 | Am | Dm7 | G | E | E7',
      melody: [
        'C6 - - - A5 - C6 -',
        'D6 - - - B5 - D6 -',
        'E6 - D6 - B5 - G5 -',
        'A5 - - - - - . .',
        'F5 - A5 - D6 - C6 -',
        'B5 - D6 - G6 - F6 -',
        'E6 - - - D6 - B5 -',
        'G#5 - B5 - D6 - E6 -',
      ].join(' | '),
      counter: [
        'A5 - - - F5 - A5 -',
        'B5 - - - G5 - B5 -',
        'B5 - B5 - G5 - E5 -',
        'E5 - - - - - . .',
        'D5 - F5 - A5 - A5 -',
        'G5 - B5 - D6 - D6 -',
        'B5 - - - B5 - G#5 -',
        'E5 - G#5 - B5 - B5 -',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
