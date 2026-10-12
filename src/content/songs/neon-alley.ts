// Dark minor city groove: a low prowling riff over m9 chords, suspended dominants, and a climb under the streetlights.
import type { SongDef } from '../../domain/music/song.ts';

export const neonAlley: SongDef = {
  id: 'neon-alley',
  title: 'Neon Alley',
  style: 'city-lights',
  mood: { valence: -0.5, energy: 0.1 },
  key: 'Cm',
  bpm: 108,
  sections: {
    a: {
      chords: 'Cm9 | Fm9 | Cm9 | Abmaj7 G7sus4 | Cm9 | Fm9 | Abmaj7 | G7sus4 G7',
      melody: [
        '. G4 Bb4 C5 - - Eb5 D5',
        'C5 - - - . Ab4 Bb4 C5',
        'Eb5 - - F5 G5 - F5 Eb5',
        'C5 - - - D5 - C5 -',
        '. G4 Bb4 C5 - - G5 F5',
        'Ab5 - - - G5 F5 Eb5 C5',
        'Eb5 - C5 Eb5 G5 - - F5',
        '- - D5 - B4 - - -',
      ].join(' | '),
    },
    b: {
      chords: 'Abmaj7 | Bb7sus4 | Gm7 | Cm9 | Abmaj7 | Fm9 | Dm7b5 | G7sus4 G7',
      melody: [
        'C5 - Eb5 - G5 - - Ab5',
        '- - G5 - F5 - Eb5 F5',
        'G5 - Bb5 - D6 - - C6',
        '- - Bb5 - G5 - . .',
        '. C6 Eb6 - - - D6 C6',
        'Ab5 - - - F5 - Ab5 G5',
        'F5 - Ab5 - C6 - Ab5 -',
        'G5 - F5 - D5 - B4 -',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
