// Blocks bouncing into place on a quiet puzzle board: the octave-hop theme over a walking bass, a legato B section
// that sinks from IV to the minor iv, the same hops turned to D minor while you think, and the theme back in the light.
import type { SongDef } from '../../domain/music/song.ts';

const hops = [
  'F4 . F5 . C5 . A4 C5',
  'D5 . D6 . A5 . F5 A5',
  'Bb5 . Bb4 . D5 F5 A5 .',
  'C6 . . Bb5 . G5 E5 C5',
  'A4 . A5 . E5 . C5 E5',
  'D5 . D6 . A5 F#5 D5 .',
  'G4 . G5 . E5 . C5 .',
];

const themeChords = 'F6 | Dm9 | Bbmaj7 | C7 | Am7 | D7 | Gm7 C7';

const longTones = [
  'A4 - - - - - - -',
  'F4 - - - - - - -',
  'D5 - - - - - - -',
  'Bb4 - - - - - - -',
  'C5 - - - - - - -',
  'C5 - - - - - - -',
  'Bb4 - - - - - - -',
];

export const bouncyBlocks: SongDef = {
  id: 'bouncy-blocks',
  title: 'Bouncy Blocks',
  style: 'puzzle-pop',
  mood: { valence: 0.7, energy: 0.05 },
  key: 'F',
  bpm: 126,
  sections: {
    intro: {
      chords: 'C7sus4 | C7',
      melody: 'G5 . C6 . G5 . F5 . | E5 . C5 . . . . .',
      drums: false,
      bass: 'whole',
    },
    a: {
      chords: `${themeChords} | F6`,
      melody: [...hops, 'F5 . F4 . F5 . . .'].join(' | '),
      drums: 'light',
      bass: 'walk',
    },
    a2: {
      chords: `${themeChords} | F6`,
      melody: [...hops, 'F5 . F4 . F5 . . .'].join(' | '),
      counter: [...longTones, 'A4 - - - - - - -'].join(' | '),
      drums: 'light',
      bass: 'walk',
    },
    b: {
      chords: 'Bbmaj7 | Bbm6 | Am7 | D7 | Gm7 | C7 | Am7 D7 | Gm7 C7',
      melody: [
        'F5 - A5 - D6 - - -',
        'Db6 - - - - - Bb5 -',
        'C6 - - - - - A5 -',
        'F#5 - - - A5 - C6 -',
        'Bb5 - - - - - D6 -',
        'C6 - - - Bb5 - G5 -',
        'A5 - - - F#5 - - -',
        'G5 - - - E5 - - -',
      ].join(' | '),
      counter: [
        'D5 - - - - - - -',
        'F5 - - - - - - -',
        'E5 - - - - - - -',
        'D5 - - - - - - -',
        'D5 - - - - - - -',
        'E5 - - - - - - -',
        'C5 - - - D5 - - -',
        'Bb4 - - - - - - -',
      ].join(' | '),
      harmony: 'arp-up',
    },
    c: {
      chords: 'Dm | Dm/C | Bbmaj7 | A7 | Dm | Dm/C | Gm6 | A7sus4 A7',
      melody: [
        'D5 . D6 . A5 . F5 A5',
        'C5 . C6 . A5 . F5 A5',
        'Bb4 . Bb5 . F5 . D5 F5',
        'A4 . A5 . E5 . C#5 E5',
        'D5 . D6 . A5 . F5 A5',
        'C6 . A5 C6 . F6 . .',
        'E6 . D6 Bb5 . G5 . .',
        'D5 - - - C#5 - E5 -',
      ].join(' | '),
      drums: 'half',
      bass: 'half',
      harmony: 'stab',
    },
    a3: {
      chords: `${themeChords} | C7sus4 C7`,
      melody: [...hops, 'F5 . C5 . E5 . C5 .'].join(' | '),
      counter: [...longTones, 'C5 - - - Bb4 - - -'].join(' | '),
      harmony: 'arp-up',
    },
  },
  form: ['intro', 'a', 'a2', 'b', 'c', 'a3'],
  loopFrom: 1,
};
