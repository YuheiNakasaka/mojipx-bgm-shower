// Windswept minor march on a high ridge: the old i–VI–III–VII call, a Dorian lull that hums the chorus an octave
// low, a climb onto the dominant that falls deceptively to VI, and a relative-major chorus that holds its maj7, leaps
// a sixth and blazes through flat VI–flat VII to a major I before the gust comes round again.
import type { SongDef } from '../../domain/music/song.ts';

const opening = [
  'F#5 - - - B4 - D5 -',
  'G5 - - - F#5 E5 D5 -',
  'A5 - - - D5 - F#5 -',
  'E5 - - - C#5 D5 E5 F#5',
  'B5 - - - F#5 - D5 -',
  'D6 - - - B5 - A5 G5',
];
const openingChords = 'Bm | Gmaj7 | D/F# | Asus4 A | Bm Bm/A | Gmaj7 Em7';

const GUST_CHORDS = 'Bm | Gmaj7 | Em7 | F#7sus4 F#7';

export const ridgelineWind: SongDef = {
  id: 'ridgeline-wind',
  title: 'Ridgeline Wind',
  style: 'grand-field',
  mood: { valence: -0.1, energy: 0.65 },
  key: 'Bm',
  bpm: 126,
  sections: {
    intro: {
      chords: GUST_CHORDS,
      melody: 'B4 - - - F#5 - - - | G5 - - - F#5 - D5 - | E5 - - - G5 - B5 - | B5 - - - A#5 - - -',
      harmony: 'sparkle',
      bass: 'whole',
      drums: false,
    },
    a: {
      chords: `${openingChords} | Em7 | F#7sus4 F#7`,
      melody: [...opening, 'E5 - - - G5 - A5 -', 'B5 - - - A#5 - - -'].join(' | '),
      drums: 'light',
      bass: 'half',
    },
    lull: {
      chords: 'Bm7 | E/B | Bm7 | E/B',
      melody: 'F#5 - - - - - E5 D5 | E5 - - - B4 - - - | D5 - - - - - C#5 B4 | G#4 - - - B4 - - -',
      harmony: 'arp-updown',
      drums: 'half',
      bass: 'whole',
    },
    climb: {
      chords: 'Em7 | F#m7 | Gmaj7 | F#7sus4 F#7',
      melody: 'E5 - G5 - B5 - - - | F#5 - A5 - C#6 - - - | G5 - B5 - D6 - - - | E6 - - - - - A#5 C#6',
      bass: 'drive',
    },
    s: {
      chords: 'Gmaj7 | A | F#m7 | Bm7 | Em7 | A7sus4 A7 | Bb C | D',
      melody: [
        'F#6 - - - - - E6 D6',
        'E6 - - - A5 - - -',
        'C#6 - - - - - B5 A5',
        'B5 - - - F#5 - A5 B5',
        'G6 - - - - - F#6 E6',
        'D6 - - - C#6 - E6 -',
        'F6 - - - G6 - - A6',
        '- - - - F#6 - . .',
      ].join(' | '),
      counter: [
        'G4 - B4 - D5 - F#5 -',
        'A4 - C#5 - E5 - C#5 -',
        'F#4 - A4 - C#5 - E5 -',
        'D5 - - - B4 - - -',
        'E5 - G5 - B5 - - -',
        'D5 - A4 - C#5 - G5 -',
        'Bb4 - D5 - C5 - E5 -',
        'F#5 - - - D5 - - -',
      ].join(' | '),
      harmony: 'arp16',
      bass: 'gallop',
      drums: 'rock',
    },
    a2: {
      chords: `${openingChords} | Em7 | A7sus4 A7`,
      melody: [...opening, 'E5 - G5 - B5 - D6 -', 'E6 - - - C#6 - D6 E6'].join(' | '),
      counter: [
        'D5 - - - - - - -',
        'B4 - - - - - - -',
        'F#4 - - - A4 - - -',
        'A4 - - - E4 - - -',
        'F#4 - - - A4 - - -',
        'B4 - - - G4 - - -',
        'G4 - - - B4 - - -',
        'A4 - - - G4 - - -',
      ].join(' | '),
    },
    gust: {
      chords: GUST_CHORDS,
      melody: 'B5 - - - - - A5 G5 | F#5 - - - D5 - - - | E5 - - - G5 - B5 - | B5 - - - A#5 - - -',
      harmony: 'sparkle',
      bass: 'whole',
      drums: false,
    },
  },
  form: ['intro', 'a', 'lull', 'climb', 's', 'a2', 's', 'gust'],
  loopFrom: 1,
};
