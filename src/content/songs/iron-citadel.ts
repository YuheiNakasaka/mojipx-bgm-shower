import type { SongDef } from '../../domain/music/song.ts';

// Driving minor boss theme: a riff climbing step by step against a bass that sinks by semitones, then a high, dark climax.
export const ironCitadel: SongDef = {
  id: 'iron-citadel',
  title: 'Iron Citadel',
  style: 'boss-rush',
  mood: { valence: -0.7, energy: 0.75 },
  key: 'Dm',
  bpm: 176,
  sections: {
    intro: {
      chords: 'Dm | A7',
      melody: 'D5 . . A4 . . D5 . | C#5 . . A4 . . E5 .',
      harmony: false,
    },
    a: {
      chords: 'Dm | Dm/C# | Dm/C | G/B | Gm/Bb | A7 | Gm A7 | Dm',
      melody: [
        'D5 . A4 D5 F5 - E5 D5',
        'E5 . C#5 E5 G5 - F5 E5',
        'F5 . D5 F5 A5 - G5 F5',
        'G5 . D5 G5 B5 - A5 G5',
        'Bb5 - - A5 Bb5 - D6 -',
        'C#6 - - - - - E6 -',
        'D6 - Bb5 - C#6 - A5 -',
        'D6 - - - . . A5 C6',
      ].join(' | '),
    },
    b: {
      chords: 'Bb | C | A/C# | Dm | Gm | Eb/G | Dm/A | A7',
      melody: [
        'D6 - - - - - C6 D6',
        'E6 - - - - - D6 E6',
        'A6 - - - E6 - C#6 -',
        'D6 - - - - - . .',
        'Bb5 - D6 - G6 - - -',
        'Bb6 - - - G6 - Eb6 -',
        'F6 - - - D6 - A5 -',
        'C#6 - - - E6 - A5 -',
      ].join(' | '),
    },
  },
  form: ['intro', 'a', 'b'],
  loopFrom: 1,
};
