import type { SongDef } from '../../domain/music/song.ts';

// The walk home after school: long notes on the 9th broken by quick sixteenth runs, a minor iv that tugs, a friend's
// voice answering in Dorian, a sunset over the flat VII and the flat VI, and a homecoming left open on a sus chord.
const theme = [
  'G5 - - - - - - - A5 - - - C6 - - -',
  'E6 - - - - - - - . . D6 C6 A5 G5 A5 C6',
  'D6 - - - - - - - C6 - - - Bb5 - A5 -',
  'Db6 - - - - - - - . . C6 Db6 C6 Bb5 G5 F5',
];
const themeChords = 'F | Am7 | Bbmaj7 | Bbm6';
const under = [
  'C5 - - - - - - - F5 - - - A5 - - -',
  'C5 - - - - - - - E5 - - - - - - -',
  'F5 - - - - - - - A5 - - - F5 - - -',
  'F5 - - - - - - - Bb4 - - - - - - -',
];

export const afterSchool: SongDef = {
  id: 'after-school',
  title: 'After School',
  style: 'pixel-quest',
  mood: { valence: 0, energy: 0.05 },
  key: 'F',
  bpm: 124,
  steps: 4,
  sections: {
    bell: {
      chords: 'Bbmaj7 | Am7 | Gm7 | C7sus4 C7',
      melody: [
        'F6 - - - - - - - D6 - - - A5 - - -',
        'E6 - - - - - - - C6 - - - G5 - - -',
        'D6 - - - - - - - Bb5 - - - F5 - - -',
        'C6 - - - - - - - Bb5 - - - G5 - - -',
      ].join(' | '),
      harmony: 'arp-updown',
      bass: 'whole',
      drums: false,
    },
    a: {
      chords: `${themeChords} | F/A | Dm7 | Gm7 | C7sus4 C7`,
      melody: [
        ...theme,
        'A5 - - - - - - - C6 - - - F6 - - -',
        'E6 - - - - - - - . . D6 C6 A5 - C6 -',
        'D6 - - - - - Bb5 - A5 - - - G5 - - -',
        'F5 - - - - - - - E5 - - - . . . .',
      ].join(' | '),
      harmony: 'broken',
      bass: 'half',
    },
    b: {
      chords: 'Dm7 | G/D | Dm7 | G/D | Gm7 | Am7 | Bbmaj7 | C7sus4 C7',
      melody: [
        'D5 - F5 - A5 - - - . . . . . . . .',
        'B4 - D5 - G5 - - - . . . . . . . .',
        'F5 - A5 - D6 - - - . . . . . . . .',
        'D6 - B5 - G5 - - - . . . . . . . .',
        'Bb5 - - - - - A5 - G5 - - - D5 - - -',
        'C6 - - - - - D6 - E6 - - - C6 - - -',
        'D6 - - - - - - - F6 - - - D6 - - -',
        'C6 - - - - - - - Bb5 - - - G5 - - -',
      ].join(' | '),
      counter: [
        '. . . . . . . . A5 - G5 - F5 - E5 -',
        '. . . . . . . . D5 - C5 - B4 - - -',
        '. . . . . . . . A5 - C6 - F5 - - -',
        '. . . . . . . . B5 - A5 - G5 - - -',
        'D5 - - - - - - - Bb4 - - - - - - -',
        'E5 - - - - - - - G5 - - - - - - -',
        'F5 - - - - - - - A5 - - - - - - -',
        'F5 - - - - - - - E5 - - - - - - -',
      ].join(' | '),
      drums: 'eight',
    },
    a2: {
      chords: `${themeChords} | F/A | Dm7 | Gm7 C7 | F`,
      melody: [
        ...theme,
        'A5 - - - - - - - C6 - - - F6 - - -',
        'E6 - - - - - - - . . D6 C6 A5 - C6 -',
        'Bb5 - - - - - - - E5 - - - G5 - - -',
        'F5 - - - - - - - - - - - . . . .',
      ].join(' | '),
      counter: [
        ...under,
        'F5 - - - - - - - A5 - - - C6 - - -',
        'A5 - - - - - - - F5 - - - - - - -',
        'D5 - - - - - - - C5 - - - Bb4 - - -',
        'A4 - - - - - - - C5 - - - . . . .',
      ].join(' | '),
    },
    c: {
      chords: 'Eb | Bb | F | Dm7 | Eb | Bb/D | Dbmaj9 | C7sus4 C7',
      melody: [
        'G5 - - - - - - - Bb5 - - - Eb6 - - -',
        'D6 - - - - - - - - - - - C6 - Bb5 -',
        'A5 - - - - - - - C6 - - - F6 - - -',
        'E6 - - - - - - - . . D6 C6 A5 - - -',
        'Bb5 - - - - - - - Eb6 - - - G6 - - -',
        'F6 - - - - - - - - - - - D6 - - -',
        'F6 - - - - - - - Eb6 - - - C6 - - -',
        'C6 - - - - - - - Bb5 - - - G5 - - -',
      ].join(' | '),
      counter: [
        'Eb5 - - - - - - - - - - - - - - -',
        'D5 - - - - - - - - - - - F5 - - -',
        'C5 - - - - - - - - - - - A4 - - -',
        'A4 - - - - - - - F4 - - - - - - -',
        'G4 - - - - - - - Bb4 - - - - - - -',
        'D5 - - - - - - - F5 - - - - - - -',
        'F5 - - - - - - - Ab5 - - - - - - -',
        'F5 - - - - - - - E5 - - - - - - -',
      ].join(' | '),
      harmony: 'arp-updown',
      bass: 'walk',
      drums: 'eight',
    },
    a3: {
      chords: `${themeChords} | Dm7 | Dm7/C | Bbmaj7 | C7sus4`,
      melody: [
        ...theme,
        'A5 - - - - - - - F5 - - - D6 - - -',
        'C6 - - - - - - - . . A5 G5 F5 G5 A5 C6',
        'D6 - - - - - - - C6 - - - A5 - - -',
        'G5 - - - - - - - - - - - . . . .',
      ].join(' | '),
      counter: [
        ...under,
        'F5 - - - - - - - D5 - - - A5 - - -',
        'A5 - - - - - - - F5 - - - - - - -',
        'F5 - - - - - - - A5 - - - F5 - - -',
        'Bb4 - - - - - - - C5 - - - . . . .',
      ].join(' | '),
      harmony: 'broken',
      bass: 'half',
    },
  },
  form: ['bell', 'a', 'b', 'a2', 'c', 'a3'],
  loopFrom: 1,
  parts: { drums: 'light' },
};
