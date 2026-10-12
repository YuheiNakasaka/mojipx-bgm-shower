// Warm night at the fair: a lilting five-note melody over easy changes, with a plucked counter line holding the guide tones.
import type { SongDef } from '../../domain/music/song.ts';

export const summerNightFair: SongDef = {
  id: 'summer-night-fair',
  title: 'Summer Night Fair',
  style: 'summer-festival',
  mood: { valence: 0.6, energy: 0 },
  key: 'F',
  bpm: 118,
  sections: {
    intro: {
      chords: 'Bb | C7sus4',
      melody: '. . D5 F5 G5 - F5 D5 | C5 - - - . . A4 C5',
      drums: false,
    },
    a: {
      chords: 'F | Dm7 | Bb | C7sus4 C | F | Am7 | Bb Csus4 | F',
      melody: [
        'F5 - - G5 A5 - C6 -',
        'D6 - C6 A5 G5 - F5 -',
        'D5 - - F5 G5 - F5 D5',
        'F5 - - - G5 - - -',
        'F5 - - G5 A5 - C6 -',
        'C6 - D6 C6 A5 - G5 -',
        'D5 - F5 - G5 - - -',
        'F5 - - - - - . .',
      ].join(' | '),
      counter: [
        'A4 - - - C5 - - -',
        'A4 - - - F4 - - -',
        'F4 - - - D4 - - -',
        'F4 - - - E4 - - -',
        'F4 - - - A4 - - -',
        'G4 - - - E4 - - -',
        'F4 - - - G4 - - -',
        'A4 - - - . . C5 D5',
      ].join(' | '),
    },
    b: {
      chords: 'Bb | C | Am7 | Dm7 | Bb | C | Gm7 | C7sus4 C',
      melody: [
        'D6 - - C6 D6 - F6 -',
        'C6 - - - A5 - G5 -',
        'A5 - - G5 A5 - C6 -',
        'D6 - - - - - . .',
        'D6 - - F6 G6 - F6 D6',
        'G6 - - - - - F6 D6',
        'D6 - - C6 A5 - G5 -',
        'F5 - G5 - C5 - - -',
      ].join(' | '),
      counter: [
        'D5 - - - F5 - - -',
        'E5 - - - C5 - - -',
        'C5 - - - E5 - - -',
        'F5 - - - . A5 G5 F5',
        'D5 - - - F5 - - -',
        'E5 - - - G5 - - -',
        'Bb4 - - - D5 - - -',
        'Bb4 - - - G4 - - -',
      ].join(' | '),
    },
  },
  form: ['intro', 'a', 'b'],
  loopFrom: 1,
};
