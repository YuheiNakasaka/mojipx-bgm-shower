import type { SongDef } from '../../domain/music/song.ts';

// The rival's theme at sundown: a galloping pedal riff, a verse falling onto a Neapolitan C, a pre-chorus that lands on V7
// and sidesteps to ♭VI, a falling-fifths chorus for twin leads in sixths, and a half-time bridge where the rival remembers.
const verse = {
  chords: 'Bm | Bm | G | A | Bm | Bm/A | C | F#7',
  melody: [
    'B4 - - D5 - - F#5 - E5 - D5 - C#5 - D5 -',
    'B4 - - - - - - - . . F#4 - A4 - B4 -',
    'B4 - - D5 - - G5 - F#5 - E5 - D5 - E5 -',
    'C#5 - - - - - - - . . A4 - C#5 - E5 -',
    'D5 - - F#5 - - B5 - A5 - G5 - F#5 - G5 -',
    'F#5 - - - - - - - . . D5 - E5 - F#5 -',
    'G5 - - - - - E5 - - - C5 - - - E5 -',
    'F#5 - - - - - - - E5 - - - C#5 - A#4 -',
  ].join(' | '),
  harmony: 'stab' as const,
};

const chorus = {
  chords: 'Em7 | A7 | Dmaj7 | Gmaj7 | C#m7b5 | F#7 | Bm Bm/A | G F#7',
  melody: [
    'B5 - - - E6 - - - - - - - D6 - B5 -',
    'C#6 - - - - - - - - - - - A5 - C#6 -',
    'A5 - - - D6 - - - - - - - C#6 - A5 -',
    'B5 - - - - - - - - - - - . . F#5 G5',
    'G5 - - - C#6 - - - - - - - B5 - G5 -',
    'A#5 - - - - - - - C#6 - - - E6 - - -',
    'F#6 - - - - - - - - - - - E6 - D6 -',
    'B5 - - - - - - - A#5 - - - - - - -',
  ].join(' | '),
  bass: 'gallop' as const,
};

export const duelAtDusk: SongDef = {
  id: 'duel-at-dusk',
  title: 'Duel At Dusk',
  style: 'boss-rush',
  mood: { valence: -0.65, energy: 0.75 },
  key: 'Bm',
  bpm: 168,
  steps: 4,
  sections: {
    riff: {
      chords: 'Bm | Bm | C | F#7',
      melody: [
        'B4 - B4 B4 D5 - B4 B4 F#5 - B4 B4 E5 - D5 -',
        'B4 - B4 B4 D5 - B4 B4 G5 - F#5 - E5 - D5 -',
        'C5 - C5 C5 E5 - C5 C5 G5 - E5 - C5 - B4 -',
        'A#4 - A#4 A#4 C#5 - A#4 A#4 E5 - C#5 - A#4 - F#4 -',
      ].join(' | '),
    },
    a: verse,
    b: {
      chords: 'G | A | F#m7 | Bm | G | A | Bsus4 | B7',
      melody: [
        'D5 - - - - - G5 - - - - - F#5 - - -',
        'E5 - - - - - A5 - - - - - G5 - - -',
        'F#5 - - - - - B5 - - - - - A5 - - -',
        'F#5 - - - - - - - - - - - . . . .',
        'G5 - - - - - B5 - - - - - D6 - - -',
        'A5 - - - - - C#6 - - - - - E6 - - -',
        'E6 - - - - - - - - - - - - - - -',
        'D#6 - - - - - - - . . . . F#5 G5 A5 -',
      ].join(' | '),
      drums: 'rock',
      bass: 'drive',
    },
    c: chorus,
    a2: {
      ...verse,
      counter: [
        'D4 - - F#4 - - A4 - G4 - F#4 - E4 - F#4 -',
        'D4 - - - - - - - . . B3 - D4 - D4 -',
        'D4 - - F#4 - - B4 - A4 - G4 - F#4 - G4 -',
        'E4 - - - - - - - . . C#4 - E4 - A4 -',
        'F#4 - - A4 - - D5 - C#5 - B4 - A4 - B4 -',
        'A4 - - - - - - - . . F#4 - G4 - A4 -',
        'E5 - - - - - C5 - - - G4 - - - C5 -',
        'A#4 - - - - - - - C#5 - - - A#4 - F#4 -',
      ].join(' | '),
    },
    c2: {
      ...chorus,
      counter: [
        'D5 - - - G5 - - - - - - - F#5 - D5 -',
        'E5 - - - - - - - - - - - C#5 - E5 -',
        'C#5 - - - F#5 - - - - - - - E5 - C#5 -',
        'D5 - - - - - - - - - - - . . A4 B4',
        'B4 - - - E5 - - - - - - - D5 - B4 -',
        'C#5 - - - - - - - E5 - - - F#5 - - -',
        'D6 - - - - - - - - - - - C#6 - B5 -',
        'D5 - - - - - - - C#5 - - - - - - -',
      ].join(' | '),
    },
    bridge: {
      chords: 'Dmaj7 | A/C# | Bm7 | F#m7/A | Gmaj7 | D/F# | Em7 | F#7sus4 F#7',
      melody: [
        'F#5 - - - - - - - A5 - - - C#6 - - -',
        'B5 - - - - - - - - - - - A5 - - -',
        'D5 - - - - - - - F#5 - - - A5 - - -',
        'G#5 - - - - - - - - - - - F#5 - - -',
        'B5 - - - - - - - D6 - - - F#6 - - -',
        'E6 - - - - - - - - - - - D6 - - -',
        'E6 - - - D6 - - - B5 - - - G5 - - -',
        'B5 - - - - - - - A#5 - - - - - . .',
      ].join(' | '),
      counter: [
        '. . . . D5 - - - - - - - E5 - - -',
        '. . . . C#5 - - - - - - - E5 - - -',
        '. . . . F#4 - - - - - - - D5 - - -',
        '. . . . A4 - - - - - - - C#5 - - -',
        '. . . . D5 - - - - - - - F#5 - - -',
        '. . . . A4 - - - - - - - F#5 - - -',
        '. . . . G4 - - - - - - - B4 - - -',
        '. . . . E5 - - - - - - - C#5 - - -',
      ].join(' | '),
      drums: 'half',
      harmony: 'pad',
      bass: 'whole',
    },
  },
  form: ['riff', 'a', 'b', 'c', 'riff', 'a2', 'b', 'c2', 'bridge'],
  loopFrom: 1,
};
