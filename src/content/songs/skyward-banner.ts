// Heroic march: a short fanfare call, a mixolydian swagger, then a bar-by-bar climb to the summit note.
import type { SongDef } from '../../domain/music/song.ts';

export const skywardBanner: SongDef = {
  id: 'skyward-banner',
  title: 'Skyward Banner',
  style: 'grand-field',
  mood: { valence: 0.1, energy: 0.7 },
  key: 'D',
  bpm: 132,
  sections: {
    intro: {
      chords: 'D | G A',
      melody: 'A4 . A4 D5 - - F#5 - | G5 . F#5 G5 A5 - - -',
      drums: false,
    },
    a: {
      chords: 'D | C | G | D | Bm | G | Em7 A7 | A',
      melody: [
        'A4 - D5 - - - E5 F#5',
        'G5 - - - E5 - C5 -',
        'D5 - - - B4 - D5 E5',
        'F#5 - - - - - . A4',
        'B4 - F#5 - - - G5 A5',
        'B5 - - - G5 - D5 -',
        'G5 - - F#5 E5 - - D5',
        'C#5 - - - - - . .',
      ].join(' | '),
    },
    b: {
      chords: 'G | A | Bm | G A | D | Em7 | G | A7sus4 A7',
      melody: [
        'B4 - D5 - G5 - F#5 E5',
        'C#5 - E5 - A5 - G5 F#5',
        'D5 - F#5 - B5 - A5 B5',
        'G5 - B5 - C#6 - - -',
        'D6 - - - A5 - B5 C#6',
        'E6 - - - - - D6 -',
        'B5 - - - G5 - D5 -',
        'A5 - - - - - G5 E5',
      ].join(' | '),
    },
  },
  form: ['intro', 'a', 'b'],
  loopFrom: 1,
};
