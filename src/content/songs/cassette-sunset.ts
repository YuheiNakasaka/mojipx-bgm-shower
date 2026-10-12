// Hazy evening city groove: maj7 and m9 colours under a melody that keeps pushing ahead on the last eighth of the bar.
import type { SongDef } from '../../domain/music/song.ts';

export const cassetteSunset: SongDef = {
  id: 'cassette-sunset',
  title: 'Cassette Sunset',
  style: 'city-lights',
  mood: { valence: -0.1, energy: 0 },
  key: 'Eb',
  bpm: 104,
  sections: {
    a: {
      chords: 'Ebmaj7 | Cm9 | Abmaj7 | Bb7sus4 | Gm7 | Cm9 | Fm9 | Bb7',
      melody: [
        '. Bb4 Eb5 F5 G5 - F5 G5',
        '- - Eb5 - D5 - Bb4 -',
        '. C5 Eb5 F5 G5 - F5 Eb5',
        '- - . Bb4 C5 Eb5 - D5',
        '- . Bb4 D5 F5 - G5 Bb5',
        '- - - - G5 - Eb5 F5',
        '- - Ab5 - G5 - F5 Eb5',
        'D5 - - - . F5 Ab5 G5',
      ].join(' | '),
    },
    b: {
      chords: 'Abmaj7 | Gm7 | Fm9 | Ebmaj7 | Abmaj7 | Gm7 C7 | Fm9 | Bb7sus4 Bb7',
      melody: [
        '- - Ab5 - C6 - . Bb5',
        '- - G5 - F5 - D5 G5',
        '- - F5 Ab5 C6 - Eb6 D6',
        '- - - - Bb5 - G5 C6',
        '- - Eb6 - - - F6 Eb6',
        'D6 - - Bb5 E6 - - C6',
        '- - Ab5 - G5 - F5 -',
        'Eb5 - - - D5 - - .',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
