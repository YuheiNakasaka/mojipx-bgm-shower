import type { SongDef } from '../../domain/music/song.ts';

// Bright-and-bold flight in a mixolydian major: flat-seven chord swings and sixteenth-note launches.
export const starboardRun: SongDef = {
  id: 'starboard-run',
  title: 'Starboard Run',
  style: 'star-fighter',
  mood: { valence: 0, energy: 0.8 },
  key: 'A',
  bpm: 164,
  steps: 4,
  sections: {
    a: {
      chords: 'A | G | D | A | F#m | G | D | E',
      melody: [
        'A5 - E5 - A5 B5 C#6 E6 - - - - C#6 - B5 -',
        'D6 - B5 - G5 A5 B5 D6 - - - - B5 - A5 -',
        'A5 - F#5 - A5 B5 D6 F#6 - - - - E6 - D6 -',
        'C#6 - - - - - - - E6 D6 C#6 B5 A5 B5 C#6 E6',
        'F#6 - - - C#6 - - - A5 B5 C#6 A5 F#5 - A5 -',
        'G5 - - - B5 - - - D6 E6 D6 B5 G5 - D6 -',
        'F#6 - - - - - - - E6 F#6 E6 D6 A5 - D6 -',
        'E6 - - - B5 - - - G#5 A5 B5 C#6 D6 - E6 -',
      ].join(' | '),
    },
    b: {
      chords: 'D | A/C# | Bm | G | D | E | G | E7',
      melody: [
        'F#6 - - - - - - - A6 - F#6 - D6 - E6 -',
        'E6 - - - - - - - C#6 D6 E6 C#6 A5 - C#6 -',
        'D6 - - - - - - - F#6 E6 D6 C#6 B5 - D6 -',
        'B5 - - - D6 - G6 - - - - - . . . .',
        'F#6 - - - A6 - - - F#6 E6 D6 E6 F#6 - D6 -',
        'E6 - - - B5 - - - G#5 A5 B5 E6 - - D6 -',
        'D6 - - - B5 - - - G5 A5 B5 D6 G6 - - -',
        'G#6 - - - E6 - - - D6 - B5 - G#5 - B5 -',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
