// Majestic hymn in three, carried high over a slow horn line of long guide tones.
import type { SongDef } from '../../domain/music/song.ts';

export const crownOfClouds: SongDef = {
  id: 'crown-of-clouds',
  title: 'Crown of Clouds',
  style: 'grand-field',
  mood: { valence: -0.05, energy: 0.55 },
  key: 'Eb',
  bpm: 120,
  meter: 3,
  sections: {
    a: {
      chords: 'Eb | Ab | Fm7 | Bb | Cm | Ab | Fm7 Bb | Eb',
      melody: [
        'Bb4 - - Eb5 G5 -',
        'Ab5 - - G5 Eb5 -',
        'F5 - - Ab5 C6 -',
        'Bb5 - - - - -',
        'C6 - - Bb5 G5 -',
        'Ab5 - - - Eb5 -',
        'F5 - - Eb5 D5 -',
        'Eb5 - - - - -',
      ].join(' | '),
      counter: [
        'G4 - - - Bb4 -',
        'C5 - - - - -',
        'Ab4 - - - C5 -',
        'D5 - - - - -',
        'Eb5 - - - - -',
        'C5 - - - - -',
        'Ab4 - - - Bb4 -',
        'G4 - - - - -',
      ].join(' | '),
    },
    b: {
      chords: 'Cm | Ab | Bb | Eb | Fm7 | Gm | Ab | Bb7sus4 Bb7',
      melody: [
        'C5 - - Eb5 G5 -',
        'C6 - - - Bb5 Ab5',
        'F5 - - Bb5 D6 -',
        'Eb6 - - - D6 Bb5',
        'C6 - - - Ab5 -',
        'Bb5 - - - D6 -',
        'Eb6 - - - - C6',
        'Ab5 - - G5 F5 D5',
      ].join(' | '),
      counter: [
        'Eb4 - - - G4 -',
        'Ab4 - - - - -',
        'Bb4 - - - - -',
        'G4 - - - - -',
        'Ab4 - - - - -',
        'G4 - - - Bb4 -',
        'C5 - - - - -',
        'Bb4 - - - Ab4 -',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
