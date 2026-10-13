import type { SongDef } from '../../domain/music/song.ts';

// A chase through dark corridors in G minor: clipped running figures over a pounding G pedal, a galloping
// ostinato joining them, a theme with a limping dotted cell over the Andalusian i–♭VII–♭VI–V that climbs with its
// bass into a cry over the Neapolitan, a half-time breath of dread, and the running figures again, higher.
const runChords = 'Gm | Eb/G | Cm/G | D/G | Gm | Eb/G | Cm/G | D7';

const run = ['D5 . G5 . Bb5 A5 G5 D5', 'Eb5 . G5 . Bb5 C6 Bb5 G5', 'Eb5 . G5 . C6 D6 C6 G5', 'F#5 - - - A5 - D6 -'];

const ostinato = Array.from({ length: 8 }, () => 'G3 G3 D4 G3 G3 D4 G3 D4').join(' | ');

export const shadowChase: SongDef = {
  id: 'shadow-chase',
  title: 'Shadow Chase',
  style: 'deep-dungeon',
  mood: { valence: -0.7, energy: 0.5 },
  key: 'Gm',
  bpm: 144,
  parts: { drums: 'gallop', bass: 'pedal' },
  sections: {
    a: {
      chords: runChords,
      melody: [...run, 'D5 . G5 . Bb5 A5 G5 D5', 'Eb5 . G5 . Bb5 C6 Bb5 G5', 'C6 . Eb6 . D6 C6 Bb5 G5', 'A5 - - - F#5 - D5 -'].join(' | '),
    },
    a2: {
      chords: runChords,
      melody: [...run, 'D5 . G5 . Bb5 A5 G5 D5', 'Eb5 . G5 . Bb5 C6 Bb5 G5', 'C6 . Eb6 . D6 C6 Bb5 G5', 'A5 - - - F#5 - D5 -'].join(' | '),
      counter: ostinato,
    },
    b: {
      chords: 'Gm | F | Eb | D7 | Gm | F | Eb | D7sus4 D7 | Eb | F | D/F# | Gm | Cm | Ab | D7sus4 | D7',
      melody: [
        'D5 - - G5 Bb5 - - -',
        'A5 - - G5 F5 - - -',
        'G5 - - F5 Eb5 - - -',
        'F#5 - - - D5 - - -',
        'D5 - - G5 Bb5 - - D6',
        '- - - - C6 - A5 -',
        'G5 - - Bb5 Eb6 - - -',
        'D6 - - - C6 - A5 -',
        'Bb5 - - - G5 - Bb5 -',
        'C6 - - - A5 - C6 -',
        'D6 - - - A5 - D6 -',
        'Bb5 - - - D6 - F6 -',
        'Eb6 - - - - - D6 C6',
        'C6 - - - Eb6 - - -',
        'D6 - - - - - - -',
        'C6 - - - A5 - F#5 -',
      ].join(' | '),
      counter: [
        'G4 - - - D5 - - -',
        'F4 - - - C5 - - -',
        'Eb4 - - - Bb4 - - -',
        'D4 - - - C5 - - -',
        'G4 - - - D5 - - -',
        'F4 - - - F5 - - -',
        'Eb5 - - - G4 - - -',
        'A4 - - - F#4 - - -',
        'G4 G4 Bb4 G4 G4 Bb4 G4 Bb4',
        'A4 A4 C5 A4 A4 C5 A4 C5',
        'A4 A4 D5 A4 A4 D5 A4 D5',
        'G4 G4 Bb4 G4 G4 D5 G4 D5',
        'G4 G4 C5 G4 G4 Eb5 G4 Eb5',
        'Ab4 Ab4 C5 Ab4 Ab4 Eb5 Ab4 Eb5',
        'A4 A4 D5 A4 A4 D5 A4 D5',
        'A4 A4 C5 A4 F#4 D4 A3 D4',
      ].join(' | '),
      bass: 'octave',
    },
    c: {
      chords: 'Ab | Ab | Gm | Gm | Fm6 | Edim7 | D7sus4 | D7',
      melody: [
        'C6 - - - - - - -',
        'Eb6 - - - C6 - Ab5 -',
        'Bb5 - - - - - - -',
        'D6 - - - Bb5 - G5 -',
        'Ab5 - - - C6 - D6 -',
        'C#6 - - - Bb5 - G5 -',
        'G5 - - - - - - -',
        'F#5 - - - - - . .',
      ].join(' | '),
      drums: 'half',
      bass: 'whole',
      harmony: 'pad',
    },
    a3: {
      chords: runChords,
      melody: [...run, 'G5 . Bb5 . D6 C6 Bb5 G5', 'G5 . Bb5 . Eb6 D6 C6 Bb5', 'C6 . Eb6 . D6 C6 Bb5 G5', 'A5 - - - F#5 - D5 -'].join(' | '),
      counter: ostinato,
    },
  },
  form: ['a', 'a2', 'b', 'c', 'a3'],
};
