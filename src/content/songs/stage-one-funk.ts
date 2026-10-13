import type { SongDef } from '../../domain/music/song.ts';

// The first stage of a platformer as sixteen-bit funk: a Dorian hook that locks to the slap bass's rhythm and leans on
// the major IV's E natural, a chorus that lifts into the relative major's royal road, and a bass-and-drums breakdown.
const hook = [
  'G5 . . G5 . . Bb5 . C6 . Bb5 . G5 . F5 .',
  'G5 - - - - - . . E5 - F5 - G5 - - -',
  'Bb5 . . Bb5 . . C6 . D6 . C6 . Bb5 . G5 .',
  'Bb5 - - - - - . . A5 - G5 - E5 - - -',
  'D6 - - - - - Bb5 - - - G5 - - - Bb5 -',
  'C6 - - - - - A5 - - - F5 - - - A5 -',
];

const answered = {
  chords: 'Gm7 | C7 | Gm7 | C7 | Ebmaj7 | F | Cm7 | F7sus4 F7',
  melody: [...hook, 'G5 . . G5 . . Bb5 . C6 . Eb6 . D6 . C6 .', 'Bb5 - - - - - - - A5 - - - C6 - - -'].join(' | '),
  counter: [
    '. . . . . . . . . . . . . . . .',
    '. . Bb4 . C5 . E5 . . . . . . . . .',
    '. . . . . . . . . . . . . . . .',
    '. . . . . . . . . . . . Bb4 . C5 .',
    'G4 - - - - - - - Bb4 - - - - - - -',
    'A4 - - - - - - - C5 - - - - - - -',
    'Eb5 - - - - - - - G5 - - - - - - -',
    'Eb5 - - - - - - - F5 - - - - - - -',
  ].join(' | '),
};

const chorus = {
  chords: 'Ebmaj7 | F | Dm7 | Gm7 | Cm7 | F | Ebmaj7 | D7sus4 D7',
  melody: [
    'D6 - - - - - - - - - C6 - Bb5 - C6 -',
    'C6 - - - - - - - . . A5 - C6 - F6 -',
    'E6 - - - - - - - D6 - - - C6 - A5 -',
    'Bb5 - - - - - - - . . . . G5 A5 Bb5 C6',
    'D6 - - - - - - - - - C6 - Bb5 - C6 -',
    'F6 - - - - - - - C6 - - - A5 - C6 -',
    'G6 - - - - - - - F6 - - - D6 - - -',
    'C6 - - - - - - - A5 - - - F#5 - - -',
  ].join(' | '),
  lead: 'alt' as const,
};

export const stageOneFunk: SongDef = {
  id: 'stage-one-funk',
  title: 'Stage One Funk',
  style: 'fm-funk',
  mood: { valence: 0.55, energy: 0.55 },
  key: 'Gm',
  bpm: 120,
  steps: 4,
  sections: {
    intro: {
      chords: 'Gm7 | C7',
      melody: '. . . . . . . . . . . . . . . . | . . . . . . . . . . . . D5 - F5 -',
      harmony: false,
    },
    a: {
      chords: 'Gm7 | C7 | Gm7 | C7 | Ebmaj7 | F | Gm7 | D7sus4 D7',
      melody: [...hook, 'Bb5 . . Bb5 . . A5 . G5 . F5 . D5 . F5 .', 'G5 - - - - - - - F#5 - - - . . . .'].join(' | '),
    },
    a2: answered,
    b: chorus,
    break: {
      chords: 'Gm7 | Gm7 | Ebmaj7 | D7#9',
      melody: [
        'G5 . . . . . . . . . Bb5 . G5 . . .',
        'F5 . . . . . . . . . D5 . F5 . G5 .',
        'Bb5 . . . . . . . . . G5 . Bb5 . D6 .',
        'C6 - - - - - - - A5 - - - F#5 - - -',
      ].join(' | '),
      harmony: false,
      drums: 'half',
    },
    a3: { ...answered, lead: 'alt' },
    b2: {
      ...chorus,
      counter: [
        'G5 - - - - - - - - - - - G5 - - -',
        'A5 - - - - - - - . . F5 - A5 - - -',
        'A5 - - - - - - - F5 - - - - - - -',
        'D5 - - - - - - - . . . . Bb4 C5 D5 Eb5',
        'G5 - - - - - - - - - Eb5 - D5 - Eb5 -',
        'A5 - - - - - - - F5 - - - C5 - F5 -',
        'Bb5 - - - - - - - A5 - - - G5 - - -',
        'A5 - - - - - - - D5 - - - C5 - - -',
      ].join(' | '),
    },
  },
  form: ['intro', 'a', 'a2', 'b', 'break', 'a3', 'b2'],
  loopFrom: 1,
};
