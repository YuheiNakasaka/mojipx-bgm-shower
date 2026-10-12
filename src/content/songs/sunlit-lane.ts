// An upbeat swung stroll: syncopated pushes, each secondary dominant nudging the tune one step further down the lane.
import type { SongDef } from '../../domain/music/song.ts';

export const sunlitLane: SongDef = {
  id: 'sunlit-lane',
  title: 'Sunlit Lane',
  style: 'cozy-village',
  mood: { valence: 0.75, energy: 0.1 },
  key: 'Bb',
  bpm: 120,
  sections: {
    a: {
      chords: 'Bb | D7 | Gm7 | C7 | Cm7 | F7 | Bb | G7',
      melody: [
        'D5 F5 . G5 - F5 D5 .',
        'F#5 A5 . C6 - A5 F#5 .',
        'G5 . Bb5 A5 G5 . D5 .',
        'E5 . G5 . Bb5 - - .',
        'C6 . Bb5 G5 Eb5 . G5 .',
        'A5 . C6 A5 F5 . Eb5 .',
        'D5 . F5 . Bb5 - - .',
        'G5 . F5 D5 B4 . . .',
      ].join(' | '),
    },
    b: {
      chords: 'Cm7 | F7 | Dm7 | G7 | Ebmaj7 | Edim7 | Bb/F G7 | Cm7 F7',
      melody: [
        'C5 Eb5 . G5 - - Bb5 .',
        'A5 - G5 - F5 . . .',
        'D5 F5 . A5 - - C6 .',
        'B5 - A5 - G5 . . .',
        'Bb5 . D6 Eb6 - - D6 .',
        'Db6 - - - Bb5 . G5 .',
        'F5 . D5 F5 G5 . B5 .',
        'C6 . Bb5 G5 A5 . F5 .',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
