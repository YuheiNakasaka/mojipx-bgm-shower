import type { SongDef } from '../../domain/music/song.ts';

// A bold flight in B Mixolydian: four sixteenth-note launches like rocket stages, a theme that swings to the flat-seven A,
// a vi–IV–V–I chorus resolving sus4 to 3 in the melody, and a half-time turn to starboard before twin leads return.
const theme = {
  chords: 'B | A | E | B | G#m | A | E | F#',
  melody: [
    'B4 - F#4 - B4 C#5 D#5 F#5 - - - - D#5 - C#5 -',
    'E5 - C#5 - A4 B4 C#5 E5 - - - - C#5 - B4 -',
    'B4 - G#4 - B4 C#5 E5 G#5 - - - - F#5 - E5 -',
    'D#5 - - - - - - - F#5 E5 D#5 C#5 B4 C#5 D#5 F#5',
    'G#5 - - - D#5 - - - B4 C#5 D#5 B4 G#4 - B4 -',
    'A4 - - - C#5 - - - E5 F#5 E5 C#5 A4 - E5 -',
    'G#5 - - - - - - - F#5 G#5 F#5 E5 B4 - E5 -',
    'F#5 - - - C#5 - - - A#4 B4 C#5 D#5 E5 - F#5 -',
  ].join(' | '),
};

const chorus = {
  chords: 'G#m | Eadd9 | F#sus4 F# | B | G#m7 | Eadd9 | F#sus4 F# | B F#sus4',
  melody: [
    'D#6 - - - - - - - - - - - C#6 - D#6 -',
    'F#6 - - - - - - - E6 - - - B5 - - -',
    'C#6 - - - B5 - - - A#5 - - - C#6 - - -',
    'B5 - - - - - - - - - - - . . C#6 D#6',
    'F#6 - - - - - - - D#6 - - - B5 - D#6 -',
    'G#6 - - - - - - - F#6 - - - E6 - - -',
    'E6 - - - D#6 - - - C#6 - - - A#5 - - -',
    'B5 - - - - - - - - - - - . . . .',
  ].join(' | '),
  drums: 'rock' as const,
  bass: 'octave' as const,
};

export const starboardRun: SongDef = {
  id: 'starboard-run',
  title: 'Starboard Run',
  style: 'star-fighter',
  mood: { valence: 0, energy: 0.8 },
  key: 'B',
  bpm: 164,
  steps: 4,
  sections: {
    launch: {
      chords: 'B | A | E | F#',
      melody: [
        'B4 - F#4 - B4 C#5 D#5 F#5 - - - - . . . .',
        'C#5 - A4 - C#5 D#5 E5 A5 - - - - . . . .',
        'E5 - B4 - E5 F#5 G#5 B5 - - - - . . . .',
        'F#5 - C#5 - F#5 G#5 A#5 C#6 - - - - A#5 - F#5 -',
      ].join(' | '),
      drums: 'march',
    },
    a: theme,
    b: {
      chords: 'E | B/D# | C#m7 | A | E | F# | A | F#7',
      melody: [
        'G#5 - - - - - - - B5 - G#5 - E5 - F#5 -',
        'F#5 - - - - - - - - - - - D#5 E5 F#5 G#5',
        'B5 - - - - - - - C#6 - B5 - G#5 - E5 -',
        'E5 - - - - - - - - - - - C#5 E5 A5 B5',
        'B5 - - - - - - - E6 - B5 - G#5 - B5 -',
        'C#6 - - - - - - - A#5 B5 C#6 D#6 F#6 - E6 -',
        'E6 - - - - - - - C#6 - - - A5 - - -',
        'A#5 - - - C#6 - - - E6 - - - F#6 - - -',
      ].join(' | '),
      drums: 'push',
    },
    c: chorus,
    a2: {
      ...theme,
      counter: [
        'D#6 - - - - - - - - - - - - - - -',
        'C#6 - - - - - - - - - - - - - - -',
        'B5 - - - - - - - - - - - - - - -',
        'B5 - - - - - - - - - - - - - - -',
        'D#6 - - - - - - - B5 - - - - - - -',
        'C#6 - - - - - - - E6 - - - - - - -',
        'E6 - - - - - - - B5 - - - - - - -',
        'A#5 - - - - - - - C#6 - - - - - - -',
      ].join(' | '),
    },
    turn: {
      chords: 'Emaj7 | D#m7 | C#m7 | B/D# | Emaj7 | F#/E | D#m7 G#m7 | C#m7 F#7',
      melody: [
        'D#6 - - - - - - - - - - - B5 - - -',
        'C#6 - - - - - - - - - - - A#5 - - -',
        'B5 - - - - - - - - - - - G#5 - - -',
        'F#5 - - - - - - - - - - - . . . .',
        'G#5 - - - B5 - - - D#6 - - - F#6 - - -',
        'E6 - - - - - - - C#6 - - - A#5 - - -',
        'C#6 - - - - - - - D#6 - - - - - - -',
        'E6 - - - - - - - - - - - . . . .',
      ].join(' | '),
      drums: 'half',
      harmony: 'pad',
      bass: 'whole',
    },
    c2: {
      ...chorus,
      counter: [
        'B5 - - - - - - - - - - - A#5 - B5 -',
        'B5 - - - - - - - G#5 - - - - - - -',
        'F#5 - - - - - - - F#5 - - - - - - -',
        'D#5 - - - - - - - - - - - F#5 - - -',
        'D#6 - - - - - - - B5 - - - G#5 - B5 -',
        'E6 - - - - - - - D#6 - - - B5 - - -',
        'C#6 - - - B5 - - - A#5 - - - F#5 - - -',
        'D#5 - - - - - - - - - - - . . . .',
      ].join(' | '),
    },
  },
  form: ['launch', 'a', 'b', 'c', 'a2', 'turn', 'c2'],
  loopFrom: 1,
};
