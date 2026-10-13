import type { SongDef } from '../../domain/music/song.ts';

// A spinning teacup ride: twirling turns that pick up speed, a soaring strain lifted by secondary dominants, a lyrical
// trio in the key of IV where the cup slows and the sky turns, then the soaring strain again in a two-against-three
// hemiola while the counter walks down against it.
const twirl = [
  'A5 B5 A5 F#5 D5 F#5',
  'F#5 - B5 - D6 -',
  'D6 E6 D6 B5 G5 B5',
  'C#6 - B5 - A5 -',
  'A5 B5 A5 F#5 D5 F#5',
  'C#6 D6 C#6 A#5 F#5 A#5',
];

const spin = {
  chords: 'D | Bm7 | Gmaj7 | A7 | D | F#7 | Bm7 E7 | Em7 A7',
  melody: [...twirl, 'B5 A5 B5 D6 G#5 B5', 'E6 - D6 - C#6 -'].join(' | '),
};

const soar = {
  chords: 'Gmaj7 | A/G | F#m7 | B7 | Em7 | A7 | F#m7 Bm7 | Em7 A7',
  melody: [
    'G5 A5 B5 - D6 -',
    'A5 B5 C#6 - E6 -',
    'F#6 - - - C#6 A5',
    'D#6 C#6 B5 - F#5 -',
    'G5 A5 B5 - E6 -',
    'C#6 - - - E6 -',
    'F#6 - - - D6 -',
    'E6 - D6 - C#6 -',
  ].join(' | '),
};

export const teacupWaltz: SongDef = {
  id: 'teacup-waltz',
  title: 'Teacup Waltz',
  style: 'town-waltz',
  mood: { valence: 0.7, energy: -0.05 },
  key: 'D',
  bpm: 144,
  meter: 3,
  sections: {
    intro: {
      chords: 'Dmaj7 | Em7 | F#m7 | Gmaj7 A7',
      melody: 'A5 B5 A5 . . . | B5 C#6 B5 . . . | C#6 D6 C#6 . . . | D6 E6 D6 - C#6 -',
      harmony: 'arp-up',
      bass: false,
      drums: false,
    },
    a: spin,
    a2: {
      chords: 'D | Bm7 | Gmaj7 | A7 | D | F#7 | Em7 A7 | D',
      melody: [...twirl, 'B5 A5 G5 - E5 G5', 'F#5 - D5 - . .'].join(' | '),
      harmony: 'arp-up',
    },
    b: { ...soar, harmony: 'broken', bass: 'ballad' },
    trio: {
      key: 'G',
      chords: 'Cmaj7 | D/C | Bm7 | Em7 | Am7 | D7 | Gmaj7 | G7 | Cmaj7 | D/C | Bm7 | E7 | Am7 | D7 | Gmaj7 | Em7 A7',
      melody: [
        'E6 - - D6 B5 -',
        'C6 - - - A5 -',
        'D6 - - B5 F#5 -',
        'G5 - - - E5 -',
        'E5 - - A5 C6 -',
        'D6 - - - C6 -',
        'B5 - - - D6 -',
        'F6 - - - E6 D6',
        'E6 - - D6 B5 -',
        'C6 - - - A5 -',
        'D6 - - B5 F#5 -',
        'G#5 - - - B5 -',
        'C6 - - E6 A6 -',
        'F#6 - - - - -',
        'D6 - - - B5 -',
        'E6 - - - C#6 -',
      ].join(' | '),
      counter: [
        'G4 - - - B4 -',
        'A4 - - - D5 -',
        'B4 - - - D5 -',
        'B4 - - - G4 -',
        'A4 - - - C5 -',
        'F#4 - - - A4 -',
        'G4 - - - B4 -',
        'B4 - - - D5 -',
        'G4 - - - C5 -',
        'A4 - - - F#4 -',
        'F#4 - - - B4 -',
        'G#4 - - - D5 -',
        'A4 - - - E5 -',
        'D5 - C5 - A4 -',
        'B4 - - - G4 -',
        'G4 - - - E4 -',
      ].join(' | '),
      harmony: 'half-pad',
      bass: 'whole',
      drums: 'brush',
    },
    a3: {
      ...spin,
      counter: [
        'F#4 - - - A4 -',
        'D5 - - - B4 -',
        'B4 - - - G4 -',
        'G4 - - - E4 -',
        'F#4 - - - A4 -',
        'A#4 - - - C#5 -',
        'D5 - - - E5 -',
        'G4 - - - G4 -',
      ].join(' | '),
    },
    b2: {
      ...soar,
      counter: [
        'D5 - - - - -',
        'C#5 - - - - -',
        'C#5 - - - - -',
        'B4 - - - A4 -',
        'B4 - - - - -',
        'A4 - - - - -',
        'A4 - - - - -',
        'G4 - - - - -',
      ].join(' | '),
      harmony: 'syncopate',
      bass: 'ballad',
    },
  },
  form: ['intro', 'a', 'a2', 'b', 'trio', 'a3', 'b2'],
  loopFrom: 1,
};
