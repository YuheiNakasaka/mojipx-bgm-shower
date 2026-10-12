// Bittersweet sunlit pop: a looking-back verse, then a four-to-five-to-three-to-six chorus with a guide-tone counter line.
import type { SongDef } from '../../domain/music/song.ts';

export const snapshotSummer: SongDef = {
  id: 'snapshot-summer',
  title: 'Snapshot Summer',
  style: 'nineties-pop',
  mood: { valence: 0.1, energy: 0.05 },
  key: 'A',
  bpm: 118,
  sections: {
    a: {
      chords: 'A | C#m7 | Dmaj7 | Bm7 E | A | C#m7 | Dmaj7 | E7sus4 E',
      melody: [
        '. E5 A5 G#5 A5 - E5 -',
        'G#5 - - - . E5 F#5 G#5',
        'A5 - - F#5 E5 - F#5 -',
        'D5 - - C#5 B4 - . .',
        '. E5 A5 G#5 A5 - C#6 -',
        'B5 - - - G#5 - E5 F#5',
        'A5 - - - F#5 - E5 D5',
        'B4 - A4 - G#4 - - -',
      ].join(' | '),
    },
    b: {
      chords: 'Dmaj7 | E | C#m7 | F#m7 | Dmaj7 | E | C#m7 F#m7 | Bm7 E7',
      melody: [
        'E5 F#5 A5 - - - B5 A5',
        'B5 - G#5 - E5 - F#5 G#5',
        'E5 F#5 G#5 - - - B5 G#5',
        'A5 - - - . F#5 E5 C#5',
        'F#5 A5 C#6 - - - D6 C#6',
        'B5 - - - E6 - D6 B5',
        'C#6 - B5 - A5 - - -',
        'B5 - A5 F#5 G#5 - - -',
      ].join(' | '),
      counter: [
        'A4 - - - C#5 - - -',
        'B4 - - - G#4 - - -',
        'G#4 - - - B4 - - -',
        'C#5 - - - A4 - - -',
        'D5 - - - C#5 - - -',
        'G#4 - - - B4 - - -',
        'E5 - - - C#5 - - -',
        'D5 - - - - - - -',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
