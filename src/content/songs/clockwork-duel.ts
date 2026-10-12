import type { SongDef } from '../../domain/music/song.ts';

// Galloping minor waltz for a duel: a circle-of-fifths chase in running eighths, then climbing two-bar sequences to the top.
export const clockworkDuel: SongDef = {
  id: 'clockwork-duel',
  title: 'Clockwork Duel',
  style: 'boss-rush',
  mood: { valence: -0.75, energy: 0.6 },
  key: 'Gm',
  bpm: 180,
  meter: 3,
  sections: {
    a: {
      chords: 'Gm | Cm | F | Bb | Eb | Cm | D | D7',
      melody: [
        'G5 - D5 G5 A5 Bb5',
        'C6 - G5 C6 D6 Eb6',
        'F6 - Eb6 D6 C6 A5',
        'Bb5 - - - D6 -',
        'Eb6 - Bb5 G5 Eb5 G5',
        'C6 - Bb5 A5 G5 -',
        'F#5 - A5 D6 C6 A5',
        'F#5 - A5 C6 D6 -',
      ].join(' | '),
    },
    b: {
      chords: 'Eb | F | Bb | Gm | Cm | Am7b5 | D | D7',
      melody: [
        'Eb6 - - - F6 G6',
        'A6 - - - G6 F6',
        'D6 - - - Eb6 F6',
        'G6 - - - D6 Bb5',
        'C6 - Eb6 - G6 -',
        'A6 - G6 - Eb6 -',
        'F#6 - - - D6 -',
        'C6 - A5 F#5 D5 F#5',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
