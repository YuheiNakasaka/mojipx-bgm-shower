import type { SongDef } from '../../domain/music/song.ts';

// A breach alarm in E minor: a B–C siren over ♭VI, held notes broken by sixteenth-note runs, a weightless breakdown over
// a Lydian ♭II, and an escape in the relative major before the long-noted climb returns with a twin lead in thirds.
const flight = {
  chords: 'Em | Cmaj7 | D | B7 | Em | Cmaj7 | Am7 B7 | Em',
  melody: [
    'E5 - - - B5 - - - A5 B5 A5 G5 F#5 G5 A5 B5',
    'C6 - - - - - - - B5 C6 B5 G5 E5 - G5 -',
    'D6 - - - A5 - - - F#5 G5 A5 F#5 D5 E5 F#5 A5',
    'B5 - - - - - - - A5 - F#5 - D#5 - F#5 -',
    'E5 - - - B5 - - - C6 B5 A5 G5 A5 B5 C6 D6',
    'E6 - - - - - - - D6 E6 D6 C6 B5 - G5 -',
    'C6 - - - A5 B5 C6 E6 D#6 - - - F#6 - - -',
    'E6 - - - - - - - B5 - G5 - B5 C6 D6 E6',
  ].join(' | '),
};

const summit = {
  chords: 'C | D | Bm7 | Em | Am7 | D | Cmaj7 | B7',
  melody: [
    'G6 - - - - - - - - - - - E6 F#6 G6 E6',
    'F#6 - - - - - - - - - - - D6 E6 F#6 D6',
    'D6 - - - - - - - B5 C#6 D6 E6 F#6 - - -',
    'G6 - - - - - - - - - - - . . . .',
    'A6 - - - - - - - G6 - E6 - C6 - E6 -',
    'F#6 - - - - - - - E6 F#6 E6 D6 C6 D6 E6 F#6',
    'G6 - - - - - - - E6 - - - B5 - - -',
    'D#6 - - - F#6 - - - B5 A5 G5 F#5 D#5 F#5 A5 B5',
  ].join(' | '),
  bass: 'octave' as const,
};

export const hullBreach: SongDef = {
  id: 'hull-breach',
  title: 'Hull Breach',
  style: 'star-fighter',
  mood: { valence: -0.55, energy: 0.8 },
  key: 'Em',
  bpm: 168,
  steps: 4,
  sections: {
    alarm: {
      chords: 'Cmaj7 | Cmaj7 | Am7 | B7',
      melody: [
        'B5 - - - - - - - C6 - - - - - - -',
        'B5 - - - - - - - C6 - - - - - - -',
        'B5 - - - - - - - C6 - - - - - - -',
        'B5 - - - - - - - A5 - - - F#5 - - -',
      ].join(' | '),
      drums: false,
      harmony: 'pulse',
    },
    a: flight,
    a2: {
      ...flight,
      counter: [
        'G4 - - - - - - - - - - - - - - -',
        'G4 - - - - - - - - - - - - - - -',
        'F#4 - - - - - - - - - - - - - - -',
        'F#4 - - - - - - - D#4 - - - - - - -',
        'G4 - - - - - - - - - - - - - - -',
        'E4 - - - - - - - - - - - - - - -',
        'C5 - - - - - - - B4 - - - - - - -',
        'B4 - - - - - - - E5 - - - - - - -',
      ].join(' | '),
    },
    b: summit,
    vacuum: {
      chords: 'Am9 | Em/G | Fmaj7#11 | Em | Am9 | Em/G | Cmaj7 | B7sus4 B7',
      melody: [
        'E6 - - - - - - - - - - - B5 - - -',
        'B5 - - - - - - - - - - - . . . .',
        'A5 - - - - - - - B5 - - - - - - -',
        'G5 - - - - - - - - - - - . . . .',
        'C6 - - - - - - - B5 - - - A5 - - -',
        'B5 - - - - - - - G5 - - - - - - -',
        'E5 - - - G5 - - - B5 - - - E6 - - -',
        'E6 - - - - - - - D#6 - - - F#6 - - -',
      ].join(' | '),
      drums: 'half',
      harmony: 'pad',
      bass: 'whole',
    },
    escape: {
      chords: 'G | D/F# | Em | Bm/D | Cmaj7 | G/B | Am7 | B7sus4 B7',
      melody: [
        'D6 - - - - - - - B5 C6 D6 E6 D6 - B5 -',
        'A5 - - - - - - - F#5 G5 A5 B5 A5 - F#5 -',
        'G5 - - - - - - - E5 F#5 G5 A5 B5 - E6 -',
        'D6 - - - - - - - - - - - . . . .',
        'E6 - - - - - - - D6 C6 B5 C6 E6 - G6 -',
        'D6 - - - - - - - B5 - D6 - G6 - - -',
        'E6 - - - - - - - C6 - A5 - C6 - E6 -',
        'E6 - - - - - - - D#6 - - - - - - -',
      ].join(' | '),
      drums: 'push',
    },
    b2: {
      ...summit,
      counter: [
        'E6 - - - - - - - - - - - C6 D6 E6 C6',
        'D6 - - - - - - - - - - - B5 C#6 D6 B5',
        'B5 - - - - - - - G5 A5 B5 C#6 D6 - - -',
        'B5 - - - - - - - - - - - . . . .',
        'E6 - - - - - - - - - C6 - A5 - C6 -',
        'D6 - - - - - - - C6 D6 C6 B5 A5 B5 C6 D6',
        'E6 - - - - - - - C6 - - - G5 - - -',
        'B5 - - - D#6 - - - . . . . . . . .',
      ].join(' | '),
      drums: 'rock',
    },
  },
  form: ['alarm', 'a', 'a2', 'b', 'alarm', 'vacuum', 'escape', 'b2'],
  loopFrom: 1,
};
