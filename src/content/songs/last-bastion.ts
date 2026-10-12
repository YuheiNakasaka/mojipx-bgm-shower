// Grim, driving siege theme in harmonic minor; every phrase is pulled home by the raised leading tone.
import type { SongDef } from '../../domain/music/song.ts';

const call = ['C5 G4 C5 D5 Eb5 - G5 -', 'Ab5 - G5 F5 Eb5 - C5 -', 'F5 C5 F5 G5 Ab5 - C6 -', 'B5 - G5 - F5 - D5 -'];

export const lastBastion: SongDef = {
  id: 'last-bastion',
  title: 'Last Bastion',
  style: 'pixel-quest',
  mood: { valence: -0.6, energy: 0.6 },
  key: 'Cm',
  bpm: 150,
  sections: {
    a: {
      chords: 'Cm | Ab | Fm | G7 | Cm | Bb | Ab | G7',
      melody: [...call, 'C5 G4 C5 D5 Eb5 - G5 -', 'D5 Bb4 D5 Eb5 F5 - Bb5 -', 'C6 - Bb5 Ab5 Eb5 - C5 -', 'D5 - - - B4 - - -'].join(' | '),
    },
    a2: {
      chords: 'Cm | Ab | Fm | G7 | Cm | Bb | Ab G7 | Cm',
      melody: [...call, 'Eb5 C5 Eb5 F5 G5 - C6 -', 'D6 - C6 Bb5 F5 - Bb5 -', 'Ab5 - F5 - D5 - B4 -', 'C5 - - - - - . .'].join(' | '),
    },
    b: {
      chords: 'Ab | Bb | Eb | Cm | Fm | Ab | Dm7b5 | G7',
      melody: [
        'Eb5 - - - Ab5 - C6 -',
        'D6 - - - C6 - Bb5 -',
        'G5 - - - Bb5 - Eb6 -',
        'D6 - C6 - G5 - - -',
        'Ab5 G5 F5 G5 Ab5 - C6 -',
        'Eb6 D6 C6 D6 Eb6 - C6 -',
        'Ab5 - - G5 F5 - Ab5 -',
        'G5 - F5 - D5 - B4 -',
      ].join(' | '),
    },
  },
  form: ['a', 'a2', 'b'],
};
