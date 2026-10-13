import { type SongDef, transposed } from '../../domain/music/song.ts';

// An empty classroom after school, dust drifting in the sunbeams: a canon verse that keeps reaching up a sixth,
// a royal-road chorus whose major IV turns minor (G → Gm6) at its peak, and a last chorus lifted a whole step.
const chorus = {
  chords: 'Gmaj7 | A7 | F#m7 | Bm9 | Gmaj7 | Gm6 | F#m7 B7 | Em9 A7sus4',
  melody: [
    'D5 - - - B5 - - A5',
    '- - - - G5 - E5 -',
    'C#5 - - - A5 - - F#5',
    '- - - - E5 - C#5 -',
    'D5 - - - B5 - - D6',
    '- - - - Bb5 - - A5',
    '- - - - F#5 - D#5 -',
    'E5 - - - D5 - - .',
  ].join(' | '),
  counter: [
    'B4 - - - - - - -',
    '. . E5 - C#5 - A4 -',
    'A4 - - - C#5 - - -',
    '. . B4 - D5 - F#4 -',
    'G4 - - - D5 - - -',
    '. . G4 Bb4 D5 - - -',
    'C#5 - - - B4 - - -',
    'G4 - - - A4 - - -',
  ].join(' | '),
  bass: 'ballad' as const,
};

export const sunbeamClassroom: SongDef = {
  id: 'sunbeam-classroom',
  title: 'Sunbeam Classroom',
  style: 'credits-roll',
  mood: { valence: 0, energy: -0.3 },
  key: 'D',
  bpm: 84,
  sections: {
    intro: {
      chords: 'Gmaj7 | F#m7 | Em9 | A7sus4',
      melody: 'B5 - - - A5 - F#5 - | A5 - - - E5 - C#5 - | G5 - - - F#5 - D5 - | E5 - - - D5 - - .',
      drums: false,
      bass: 'whole',
    },
    a: {
      chords: 'Dmaj7 | A/C# | Bm9 | F#m7/A | Gmaj7 | D/F# | Em9 | A9sus4 A7',
      melody: [
        '. . A4 F#5 - - E5 D5',
        'C#5 - - - . . . .',
        '. . F#4 D5 - - C#5 B4',
        'A4 - - - . . . .',
        '. . B4 G5 - - F#5 E5',
        'D5 - - - . . E5 F#5',
        'G5 - - F#5 E5 - D5 -',
        'E5 - - - C#5 - - .',
      ].join(' | '),
      drums: false,
      bass: 'whole',
    },
    b: {
      chords: 'Gmaj7 | A/G | F#m7 B7 | Em9 A7sus4',
      melody: '. B4 D5 F#5 A5 - - - | . C#5 E5 G5 B5 - - - | C#6 - - - B5 - A5 - | G5 - - - A5 - - .',
      drums: 'half',
    },
    s: chorus,
    lift: { chords: 'B7sus4 B7', melody: 'E5 - - - D#5 - F#5 -', key: 'E' },
    up: transposed(chorus, 2, 'E'),
    outro: { chords: 'Cmaj7 | A7sus4 A7', melody: 'G5 - - - E5 - - B4 | - - D5 - C#5 - - .', bass: 'whole' },
  },
  form: ['intro', 'a', 'b', 's', 'lift', 'up', 'outro'],
  loopFrom: 1,
};
