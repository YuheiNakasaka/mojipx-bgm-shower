// Hopeful setting-out theme: the hero wakes to the dawn motif, strides out in dotted quest rhythm with a second
// pulse singing in thirds, climbs, and a sunrise bridge glows on the borrowed flat-six and flat-seven.
import type { SongDef } from '../../domain/music/song.ts';

const quest = [
  'B4 - - D5 G5 - - F#5',
  'E5 - - G5 B5 - - A5',
  'G5 - E5 - C5 - E5 G5',
  'A5 - - - F#5 - D5 -',
  'B4 - - D5 G5 - - A5',
  'B5 - - A5 G5 - - E5',
];
const questChords = 'G | Em7 | Cmaj7 | D | G/B | Em7';
const thirds = [
  'G4 - - B4 D5 - - D5',
  'B4 - - E5 G5 - - F#5',
  'E5 - C5 - G4 - C5 E5',
  'F#5 - - - D5 - A4 -',
  'G4 - - B4 D5 - - F#5',
  'G5 - - F#5 E5 - - B4',
];

const climb = {
  chords: 'Cmaj7 | D | Bm7 | Em7 | Am7 | D7 | C D | G',
  melody: [
    'E5 - G5 - C6 - - B5',
    'A5 - - - - - F#5 -',
    'D5 - F#5 - B5 - - A5',
    'G5 - - - - - . .',
    'C6 - - B5 A5 - E5 -',
    'F#5 - - G5 A5 - D6 -',
    'E6 - - D6 A5 - F#5 -',
    'G5 - - - - - . .',
  ].join(' | '),
};

export const firstDawn: SongDef = {
  id: 'first-dawn',
  title: 'First Dawn',
  style: 'pixel-quest',
  mood: { valence: 0.15, energy: 0.6 },
  key: 'G',
  bpm: 148,
  sections: {
    wake: {
      chords: 'G | C D | Em7 | D7sus4 D7',
      melody: 'G4 - - A4 D5 - - - | C5 - B4 - A4 - - - | B4 - - - - - G4 - | A4 - - - F#4 - A4 -',
      bass: 'whole',
      drums: false,
    },
    a: {
      chords: `${questChords} | A7 | D`,
      melody: [...quest, 'C#5 - - E5 A5 - - G5', 'F#5 - - - - - . .'].join(' | '),
      drums: 'light',
      bass: 'half',
    },
    a2: {
      chords: `${questChords} | Am7 D7 | G`,
      melody: [...quest, 'C5 - - E5 A5 - - F#5', 'G5 - - - - - . .'].join(' | '),
      counter: [...thirds, 'A4 - - C5 F#5 - - D5', 'B4 - - - - - . .'].join(' | '),
    },
    b: climb,
    c: {
      chords: 'Ebmaj7 | F | Cm | D7sus4 D7 | Ebmaj7 | F | G | D7sus4 D7',
      melody: [
        'G5 - - - - - Bb5 -',
        'A5 - - - - - C6 -',
        'Eb6 - - - - - C6 -',
        'A5 - - - F#5 - D5 -',
        'Bb5 - - - - - D6 Eb6',
        'F6 - - - - - C6 -',
        'D6 - - - B5 - G5 -',
        'A5 - - - F#5 - D5 -',
      ].join(' | '),
      counter: [
        'Eb5 - - - - - - -',
        'F5 - - - - - - -',
        'G5 - - - - - - -',
        'C5 - - - - - - -',
        'G5 - - - - - - -',
        'A5 - - - - - - -',
        'G5 - - - - - - -',
        'D5 - - - C5 - - -',
      ].join(' | '),
      harmony: 'pad',
      drums: 'half',
      bass: 'whole',
    },
    b2: {
      ...climb,
      counter: [
        'C5 - - - E5 - - -',
        'F#5 - - - D5 - - -',
        'B4 - - - D5 - - -',
        'E5 - - - D5 - - -',
        'E5 - - - C5 - - -',
        'D5 - - - F#5 - - -',
        'G5 - - - D5 - - -',
        'B4 - - - - - . .',
      ].join(' | '),
    },
    a3: {
      chords: `${questChords} | A7 | D`,
      melody: [...quest, 'C#5 - - E5 A5 - - G5', 'F#5 - - - - - . .'].join(' | '),
      counter: [...thirds, 'A4 - - C#5 E5 - - E5', 'D5 - - - - - . .'].join(' | '),
      bass: 'gallop',
    },
  },
  form: ['wake', 'a', 'a2', 'b', 'c', 'b2', 'a3'],
  loopFrom: 1,
};
