// Tiptoeing minor stalls: staccato hops over a bass creeping down by semitones, with a sly flat-seventh turn at the end.
import type { SongDef } from '../../domain/music/song.ts';

export const phantomMarket: SongDef = {
  id: 'phantom-market',
  title: 'Phantom Market',
  style: 'puzzle-pop',
  mood: { valence: -0.55, energy: 0.05 },
  key: 'Em',
  bpm: 116,
  sections: {
    a: {
      chords: 'Em | Em/D# | Em/D | Em/C# | Cmaj7 | Am7 | F#m7b5 B7 | B7',
      melody: [
        'E5 . . B5 . . G5 .',
        'F#5 . G5 . F#5 . D#5 .',
        'E5 . . B5 . . D6 .',
        'C#6 . B5 . G5 . E5 .',
        'G5 . . C6 . . B5 .',
        'A5 . B5 . C6 . E6 .',
        'C6 . A5 . . D#6 . B5',
        'A5 . F#5 . D#5 . . .',
      ].join(' | '),
      counter: [
        'G4 - - - - - - -',
        'A4 - - - - - - -',
        'B4 - - - - - - -',
        'C#5 - - - - - - -',
        'B4 - - - - - - -',
        'A4 - - - G4 - - -',
        'A4 - - - - - - -',
        'F#4 - - - - - - -',
      ].join(' | '),
    },
    b: {
      chords: 'Am7 | D7 | Gmaj7 | Cmaj7 | F#m7b5 | B7 | Em C7 | B7',
      melody: [
        'E5 . . A5 . . C6 .',
        'F#5 . A5 . C6 . D6 .',
        'B5 . D6 . F#6 - - -',
        'E6 - - - . . D6 C6',
        'A5 . . C6 . . E6 .',
        'D#6 . B5 . A5 . F#5 .',
        'G5 . B5 . Bb5 . G5 .',
        'F#5 . A5 . B5 . . .',
      ].join(' | '),
      counter: [
        'E4 - - - G4 - - -',
        'F#4 - - - - - - -',
        '- - - - - - - -',
        'E4 - - - - - - -',
        '- - - - - - - -',
        'D#4 - - - - - - -',
        'E4 - - - - - - -',
        'D#4 - - - - - - -',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
