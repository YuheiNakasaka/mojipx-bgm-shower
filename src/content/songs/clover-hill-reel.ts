import type { SongDef } from '../../domain/music/song.ts';

// A Mixolydian reel for dancing on a green hill: the whistle runs with cuts and turns over I and flat VII, the B part
// slows into a royal-road air that peaks on the flat seventh, and its second time home rides flat VI–flat VII–I.
const reel = {
  chords: 'A | G | A | Em7 | A | G | D | Em7',
  melody: [
    'E5 - - - A5 - B5 - C#6 - D6 C#6 B5 - A5 -',
    'D5 - - - G5 - A5 - B5 - C#6 B5 A5 - G5 -',
    'E5 - A5 - C#6 - E6 - F#6 - - - E6 - C#6 -',
    'D6 - B5 - G5 - B5 - E5 - - - - - . .',
    'E5 - - - A5 - B5 - C#6 - D6 C#6 B5 - A5 -',
    'D5 - - - G5 - A5 - B5 - - - D6 - B5 -',
    'A5 - F#5 - A5 - D6 - F#6 - E6 D6 C#6 - A5 -',
    'B5 - A5 - G5 - E5 - G5 - - - - - . .',
  ].join(' | '),
};

const homeward = {
  ...reel,
  chords: 'A | G | A | Em7 | A | G | G | A',
  melody: reel.melody
    .split(' | ')
    .slice(0, 6)
    .concat(['B5 - A5 - G5 - B5 - D6 - - - B5 - G5 -', 'A5 - - - - - - - . . . . C#6 - B5 -'])
    .join(' | '),
};

const air = {
  chords: 'Dmaj7 | E7 | C#m7 | F#m7 | Bm7 | E7 | F#m7 | G',
  melody: [
    'D6 C#6 - - - - - - B5 - A5 - F#5 - A5 -',
    'B5 - - - - - - - G#5 - E5 - . . E5 F#5',
    'F#6 E6 - - - - - - C#6 - B5 - G#5 - B5 -',
    'A5 - - - - - - - G#5 A5 B5 - C#6 - E6 -',
    'F#6 - - - - - - - E6 - D6 - B5 - D6 -',
    'E6 - - - - - - - D6 - B5 - G#5 - B5 -',
    'C#6 - - - - - - - A5 - C#6 - E6 - F#6 -',
    'G6 - - - - - - - D6 - - - B5 - - -',
  ].join(' | '),
  counter: [
    'F#5 - - - - - - - D5 - - - - - - -',
    'G#5 - - - - - - - D5 - - - - - - -',
    'G#5 - - - - - - - E5 - - - - - - -',
    'C#5 - - - - - - - E5 - - - - - - -',
    'D5 - - - - - - - F#5 - - - - - - -',
    'G#5 - - - - - - - E5 - - - - - - -',
    'E5 - - - - - - - A5 - - - - - - -',
    'B5 - - - - - - - G5 - - - - - - -',
  ].join(' | '),
};

export const cloverHillReel: SongDef = {
  id: 'clover-hill-reel',
  title: 'Clover Hill Reel',
  style: 'celtic-isle',
  mood: { valence: 0.6, energy: 0.3 },
  key: 'A',
  bpm: 140,
  steps: 4,
  sections: {
    intro: {
      chords: 'A | G/A | A | G/A',
      melody: [
        'E6 - - - - - - - C#6 - - - A5 - - -',
        'D6 - - - - - - - B5 - - - G5 - - -',
        'C#6 - - - - - - - E6 - - - A6 - - -',
        'G6 - - - - - - - E6 - D6 - B5 - G5 -',
      ].join(' | '),
      counter:
        'A3+E4 - - - - - - - - - - - - - - - | A3+E4 - - - - - - - - - - - - - - - | A3+E4 - - - - - - - - - - - - - - - | A3+E4 - - - - - - - - - - - - - - -',
      lead: 'alt',
      bass: 'whole',
      harmony: 'pad',
    },
    a: { ...reel, drums: 'light' },
    a2: {
      ...homeward,
      counter: [
        'C#5 - - - - - - - A4 - - - - - - -',
        'B4 - - - - - - - D5 - - - - - - -',
        'C#5 - - - - - - - E5 - - - - - - -',
        'B4 - - - - - - - G4 - - - - - - -',
        'A4 - - - - - - - C#5 - - - - - - -',
        'B4 - - - - - - - G4 - - - - - - -',
        'D5 - - - - - - - B4 - - - - - - -',
        'C#5 - - - - - - - E5 - - - - - - -',
      ].join(' | '),
      drums: 'eight',
    },
    b: { ...air, bass: 'half', harmony: 'syncopate', drums: 'half' },
    b2: {
      ...air,
      chords: 'Dmaj7 | E7 | C#m7 | F#m7 | Bm7 | E7 | F G | A',
      melody: air.melody
        .split(' | ')
        .slice(0, 6)
        .concat(['C6 - - - A5 - - - D6 - - - B5 - - -', 'C#6 - - - - - - - - - - - . . . .'])
        .join(' | '),
      counter: air.counter
        .split(' | ')
        .slice(0, 6)
        .concat(['A5 - - - F5 - - - G5 - - - D5 - - -', 'C#5 - - - - - - - A4 - - - . . . .'])
        .join(' | '),
      lead: 'alt',
      drums: 'eight',
    },
    a3: {
      ...reel,
      counter: [
        'A4 - - - - - - - E5 - - - - - - -',
        'G4 - - - - - - - D5 - - - - - - -',
        'A4 - - - - - - - C#5 - - - - - - -',
        'B4 - - - - - - - G4 - - - - - - -',
        'A4 - - - - - - - E5 - - - - - - -',
        'G4 - - - - - - - D5 - - - - - - -',
        'F#4 - - - - - - - A4 - - - - - - -',
        'G4 - - - - - - - B4 - - - - - - -',
      ].join(' | '),
      lead: 'alt',
      bass: 'drive',
      drums: 'push',
    },
  },
  form: ['intro', 'a', 'a2', 'b', 'b2', 'intro', 'a3'],
  loopFrom: 1,
};
