import type { SongDef } from '../../domain/music/song.ts';

// Euphoric minor club anthem: a syncopated hook over a lighter beat, then a drop to four-on-the-floor with a pumping arpeggio.
export const rooftopRave: SongDef = {
  id: 'rooftop-rave',
  title: 'Rooftop Rave',
  style: 'neon-rush',
  mood: { valence: 0.5, energy: 0.9 },
  key: 'F#m',
  bpm: 152,
  sections: {
    intro: {
      chords: 'F#m | E',
      melody: '. . . . . . . . | . . . . . . . .',
      harmony: false,
      drums: 'eight',
    },
    a: {
      chords: 'F#m | D | A | E | F#m | D | Bm | E',
      melody: [
        'C#6 . C#6 B5 - A5 - F#5',
        'D6 . D6 C#6 - A5 - F#5',
        'E6 . E6 C#6 - B5 - A5',
        'B5 - - - . . G#5 B5',
        'C#6 . C#6 B5 - A5 - F#5',
        'D6 . D6 F#6 - E6 - D6',
        'D6 - - - C#6 - B5 -',
        'B5 - - - - - . .',
      ].join(' | '),
      drums: 'eight',
    },
    b: {
      chords: 'D | E | C#m | F#m | D | E | A/C# | C#7',
      melody: [
        'F#6 - - - - - E6 F#6',
        'G#6 - - - - - F#6 E6',
        'E6 - - - - - C#6 E6',
        'F#6 - - - C#6 - A5 -',
        'A6 - - - F#6 - D6 -',
        'G#6 - - - E6 - B5 -',
        'C#6 - E6 - A6 - - -',
        'G#6 - - - F6 - C#6 -',
      ].join(' | '),
      counter: [
        'F#4 A4 D5 A4 F#4 A4 D5 A4',
        'G#4 B4 E5 B4 G#4 B4 E5 B4',
        'G#4 C#5 E5 C#5 G#4 C#5 E5 C#5',
        'A4 C#5 F#5 C#5 A4 C#5 F#5 C#5',
        'A4 D5 F#5 D5 A4 D5 F#5 D5',
        'B4 E5 G#5 E5 B4 E5 G#5 E5',
        'C#5 E5 A5 E5 C#5 E5 A5 E5',
        'B4 C#5 F5 G#5 F5 C#5 B4 G#4',
      ].join(' | '),
    },
  },
  form: ['intro', 'a', 'b'],
  loopFrom: 1,
};
