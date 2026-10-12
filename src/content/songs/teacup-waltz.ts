// A lively spinning waltz: twirling eighth-note turns, a soaring second half with sustained guide tones underneath.
import type { SongDef } from '../../domain/music/song.ts';

export const teacupWaltz: SongDef = {
  id: 'teacup-waltz',
  title: 'Teacup Waltz',
  style: 'town-waltz',
  mood: { valence: 0.7, energy: -0.05 },
  key: 'D',
  bpm: 144,
  meter: 3,
  sections: {
    a: {
      chords: 'D | Bm | G | A7 | D | F#m | Em7 A7 | D',
      melody: [
        'A5 B5 A5 F#5 D5 F#5',
        'F#5 - B5 - D6 -',
        'D6 E6 D6 B5 G5 B5',
        'C#6 - B5 - A5 -',
        'A5 B5 A5 F#5 D5 F#5',
        'C#6 D6 C#6 A5 F#5 A5',
        'B5 A5 G5 - E5 G5',
        'F#5 - D5 - . .',
      ].join(' | '),
    },
    b: {
      chords: 'G | A | F#m | Bm | Em7 | A7 | D/F# G | Em7 A7',
      melody: [
        'G5 A5 B5 - D6 -',
        'A5 B5 C#6 - E6 -',
        'F#6 - - - C#6 A5',
        'D6 C#6 B5 - F#5 -',
        'G5 A5 B5 - E6 -',
        'C#6 - - - E6 -',
        'F#6 - - - D6 -',
        'E6 - D6 - C#6 -',
      ].join(' | '),
      counter: [
        'B4 - - - D5 -',
        'C#5 - - - E5 -',
        'C#5 - - - A4 -',
        'B4 - - - D5 -',
        'D5 - - - B4 -',
        'C#5 - - - G4 -',
        'A4 - - - B4 -',
        'G4 - - - G4 -',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
