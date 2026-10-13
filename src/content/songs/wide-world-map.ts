import type { SongDef } from '../../domain/music/song.ts';

// The field theme of a long journey: the dawn motif stretched into open fifths, a minor iv where the road
// gets lonely, a Dorian middle that keeps walking, and a climb through flat-six and flat-seven to the horizon.
const head = ['D5 - - A5 E6 - - -', 'D6 - C#6 - A5 - - -', 'B4 - - F#5 C#6 - - -', 'B5 - A5 - F#5 - . .'];
const headChords = 'D | G A | Bm7 | Em7 A7';
const turn = ['G5 - - A5 B5 - D6 -', 'E6 - - - D6 - Bb5 -'];

const theme = {
  chords: `${headChords} | Gmaj7 | Gm6 | F#m7 B7 | Em7 A7sus4`,
  melody: [...head, ...turn, 'A5 - - - - - B5 -', 'G5 - - - E5 - - -'].join(' | '),
};

const answer = [
  '. . . . F#5 - E5 D5',
  'B4 - - - C#5 - - -',
  'D5 - - - . . E5 F#5',
  'G5 - - - E5 - - -',
  'D5 - - - - - - -',
  'Bb4 - - - - - - -',
];

export const wideWorldMap: SongDef = {
  id: 'wide-world-map',
  title: 'Wide World Map',
  style: 'grand-field',
  mood: { valence: 0.3, energy: 0.5 },
  key: 'D',
  bpm: 132,
  sections: {
    intro: {
      chords: 'D | G/D | D | A7sus4',
      melody: 'A4 - - - D5 - - - | B4 - - - - - - - | A4 - - - F#5 - - - | E5 - - - - - . .',
      bass: 'whole',
      drums: false,
    },
    a: { ...theme, drums: 'light', bass: 'half' },
    a2: {
      chords: `${headChords} | Gmaj7 | Gm6 | D/A A7 | D`,
      melody: [...head, ...turn, 'A5 - - - E5 - G5 -', 'F#5 - - - - - . .'].join(' | '),
      counter: [...answer, 'F#5 - - - C#5 - - -', 'D5 - - - A4 - - -'].join(' | '),
    },
    b: {
      chords: 'Bm7 | E | Bm7 | E7 | Gmaj7 | F#m7 | Em7 | A7sus4 A7',
      melody: [
        'B4 - D5 - F#5 - - -',
        'G#5 - - - E5 - B4 -',
        'B4 - D5 - A5 - - -',
        'G#5 - - - B5 - D6 -',
        'D6 - - - B5 - G5 -',
        'C#6 - - - A5 - F#5 -',
        'G5 - - - B5 - E6 -',
        'D6 - - - C#6 - - -',
      ].join(' | '),
      harmony: 'arp-updown',
      drums: 'half',
      bass: 'half',
    },
    c: {
      chords: 'Gmaj7 | A/G | F#7 | Bm7 | Em7 | Gm6 | Bb C | D',
      melody: [
        'B5 - - - - - A5 B5',
        'C#6 - - - - - B5 C#6',
        'E6 - - - - - D6 C#6',
        'D6 - - - - - . .',
        '. G5 B5 D6 E6 - - -',
        'E6 - - - D6 - Bb5 -',
        'D6 - - - E6 - - -',
        'F#6 - - - D6 - A5 -',
      ].join(' | '),
      counter: [
        'D5 - - - - - - -',
        'C#5 - - - - - - -',
        'A#4 - - - - - - -',
        'B4 - - - F#5 E5 D5 C#5',
        'B4 - - - - - - -',
        'D5 - - - Bb4 - - -',
        'F5 - - - G5 - - -',
        'A5 - - - F#5 - - -',
      ].join(' | '),
      harmony: 'arp16',
      bass: 'drive',
    },
    a3: {
      ...theme,
      counter: [...answer, 'C#5 - - - D#5 - - -', 'B4 - - - A4 - - -'].join(' | '),
    },
  },
  form: ['intro', 'a', 'a2', 'b', 'c', 'a3'],
  loopFrom: 1,
};
