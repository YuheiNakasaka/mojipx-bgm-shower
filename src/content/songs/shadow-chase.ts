import type { SongDef } from '../../domain/music/song.ts';

// Dark running chase: clipped minor figures over a pounding pedal bass and galloping drums.
export const shadowChase: SongDef = {
  id: 'shadow-chase',
  title: 'Shadow Chase',
  style: 'deep-dungeon',
  mood: { valence: -0.7, energy: 0.5 },
  key: 'F#m',
  bpm: 144,
  parts: { drums: 'gallop', bass: 'pedal' },
  sections: {
    a: {
      chords: 'F#m | D | Bm | C# | F#m | D | E | C#7',
      melody: [
        'C#5 . F#5 . A5 G#5 F#5 C#5',
        'D5 . F#5 . A5 B5 A5 F#5',
        'D5 - - B4 F#5 - E5 D5',
        'F5 - - - . . G#4 C#5',
        'F#5 . C#5 . F#5 A5 G#5 F#5',
        'A5 . F#5 . A5 D6 C#6 A5',
        'G#5 - - - B5 - E6 D6',
        'C#6 - - - - - G#5 -',
      ].join(' | '),
    },
    b: {
      chords: 'D | E | C#m | F#m | Bm | D | C#7sus4 | C#7',
      melody: [
        'A5 - - D6 - - F#6 -',
        'E6 - - B5 - - G#5 -',
        'G#5 - - C#6 - - E6 -',
        'C#6 - - - - - . .',
        'B5 - - D6 - - F#6 -',
        'E6 - - - D6 - C#6 -',
        'B5 - - - F#5 - G#5 -',
        'F5 - G#5 - B5 - G#5 -',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
