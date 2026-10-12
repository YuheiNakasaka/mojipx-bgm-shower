// A far-off beacon: lone falling fifths ringing over suspended chords, with long silences for the echoes to fill.
import type { SongDef } from '../../domain/music/song.ts';

export const fadingSignal: SongDef = {
  id: 'fading-signal',
  title: 'Fading Signal',
  style: 'starlit-dream',
  mood: { valence: -0.7, energy: -0.75 },
  key: 'F#m',
  bpm: 72,
  sections: {
    a: {
      chords: 'F#m | Dsus2 | Bm7 | C#7sus4 | F#m | Esus4 | Dmaj7 | C#7sus4 C#7',
      melody: [
        'C#6 - - - F#5 - . .',
        'E6 - - - A5 - . .',
        'D6 - - - - - C#6 -',
        'B5 - - - . . . .',
        'C#6 - - - F#5 - A5 -',
        'B5 - - - E5 - . .',
        'A5 - - - C#6 - - -',
        'F#5 - - - F5 - . .',
      ].join(' | '),
    },
    b: {
      chords: 'Bm7 | Esus4 | Amaj7 | Dmaj7 | Bm7 | Gmaj7 | C#7sus4 | C#7',
      melody: [
        'D6 - - - F#6 - - -',
        'E6 - - - . . B5 -',
        'C#6 - - - G#6 - - -',
        'F#6 - - - - - . .',
        'D6 - - - - - . .',
        'B5 - - - G5 - . .',
        'F#5 - - - G#5 - - -',
        'F5 - - - . . . .',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
