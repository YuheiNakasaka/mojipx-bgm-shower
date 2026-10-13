import { type SongDef, transposed } from '../../domain/music/song.ts';

// A hyper-bright idol anthem: a two-note "ri-bbon, ri-bbon" cell in a 3+3+2 bounce, an octave leap into the title
// line that lands on the maj7, a half-time future-bass drop of chopped syllables, and a last chorus a whole step up.
const chorus = {
  chords: 'D | A/C# | Bm7 | Gmaj7 | D/F# | Gmaj7 | Em7 A7sus4 | D',
  melody: [
    'B5 . A5 -  . . B5 .  A5 - . .  D6 - - -',
    'C#6 - - -  - . A5 -  - - - .  E5 - - .',
    'B5 . A5 -  . . B5 .  A5 - . .  D6 - - -',
    'E6 - - -  - - D6 -  - - . .  . . D5 -',
    'D6 - - -  - - E6 -  - - - -  . . F#6 -',
    '- - - -  E6 - - -  D6 - - -  B5 - . .',
    'D6 - - -  - - B5 -  - - - -  A5 - - -',
    'E6 - - -  - - - -  - - - -  . . . .',
  ].join(' | '),
  counter: [
    '. . . .  . . . .  . . . .  F#5 . A5 .',
    'C#5 . . .  E5 . . .  A5 . . .  E5 . A5 .',
    '. . . .  . . . .  . . . .  F#5 . A5 .',
    'D5 . . .  G5 . . .  B5 . . .  F#5 . D5 .',
    '. . . .  . . . .  . . . .  A5 . F#5 .',
    'G5 . . .  B5 . . .  D6 . . .  B5 . G5 .',
    '. . . .  . . . .  . . . .  E5 . D5 .',
    'F#5 . . .  A5 . . .  D6 . . .  A5 . . .',
  ].join(' | '),
  lead: 'alt' as const,
};

// The post-chorus: syllables chopped in pairs over half-time drums and wobbling chords, ending on III7 into vi.
const drop = {
  chords: 'Gmaj7 | A | F#m7 | Bm7 | Gmaj7 | A | F#7 | Bm7',
  melody: [
    'F#6 . F#6 .  E6 - . .  D6 . D6 .  B5 - . .',
    'C#6 . C#6 .  E6 - . .  A5 - - -  - - . .',
    'A5 . A5 .  C#6 - . .  E6 . E6 .  C#6 - . .',
    'D6 - - -  - - - -  C#6 - - -  B5 - . .',
    'F#6 . F#6 .  E6 - . .  D6 . D6 .  B5 - . .',
    'C#6 . C#6 .  A5 - . .  E6 - - -  - - . .',
    'A#5 . A#5 .  C#6 - . .  E6 . E6 .  F#6 - . .',
    'D6 - - -  - - - -  B5 - - -  . . . .',
  ].join(' | '),
  drums: 'future' as const,
  harmony: 'wobble' as const,
  bass: 'whole' as const,
};

const climb = {
  chords: 'Em7 | F#m7 | Gmaj7 | A7sus4 A',
  melody: [
    'E5 - - -  - - G5 -  - - - -  B5 - - -',
    'A5 - - -  - - - -  C#6 - - -  - - - -',
    'B5 - - -  - - - -  D6 - - -  - - - -',
    'D6 - - -  - - - -  C#6 - - -  . . A5 -',
  ].join(' | '),
  harmony: 'arp16' as const,
  drums: 'half' as const,
  bass: 'roll' as const,
};

export const ribbonRocket: SongDef = {
  id: 'ribbon-rocket',
  title: 'Ribbon Rocket',
  style: 'kawaii-pop',
  mood: { valence: 0.85, energy: 0.85 },
  key: 'D',
  bpm: 172,
  steps: 4,
  sections: {
    intro: {
      chords: 'D | A/C# | Bm7 | Gmaj7',
      melody: chorus.melody.split(' | ').slice(0, 4).join(' | '),
      harmony: 'sparkle',
      bass: false,
      drums: false,
    },
    a: {
      chords: 'D | A/C# | Bm7 | F#m7 | Gmaj7 | D/F# | Em7 | A7sus4 A',
      melody: [
        '. . F#5 .  E5 . F#5 -  A5 - - .  F#5 - . .',
        'E5 - - -  C#5 - - .  . . . .  . . . .',
        '. . D5 .  C#5 . D5 -  F#5 - - .  D5 - . .',
        'C#5 - - -  A4 - - .  . . . .  . . . .',
        '. . B4 .  A4 . B4 -  D5 - - .  B4 - . .',
        'A4 - - -  - - F#5 -  - - - -  E5 - - .',
        'G5 - - -  F#5 - - -  E5 - - -  D5 - - .',
        'E5 - - -  - - - -  C#5 - - -  . . . .',
      ].join(' | '),
      counter: [
        '. . . .  . . . .  . . . .  . . . .',
        '. . . .  . . . .  A5 . C#6 .  E6 . . .',
        '. . . .  . . . .  . . . .  . . . .',
        '. . . .  . . . .  F#5 . A5 .  C#6 . . .',
        '. . . .  . . . .  . . . .  . . . .',
        '. . . .  . . . .  . . . .  . . . .',
        '. . . .  . . . .  . . . .  . . . .',
        '. . . .  . . . .  . . . .  E6 . C#6 .',
      ].join(' | '),
      pad: false,
      harmony: 'stab',
    },
    b: {
      chords: `Gmaj7 | A | F#m7 | Bm7 | ${climb.chords}`,
      melody: [
        'B4 - - -  - - D5 -  - - - -  F#5 - - -',
        'E5 - - -  - - - -  - - - -  . . . .',
        'C#5 - - -  - - E5 -  - - - -  A5 - - -',
        'F#5 - - -  - - - -  - - - -  . . . .',
        climb.melody,
      ].join(' | '),
      counter: [
        '. . . .  . . . .  . . . .  . . . .',
        '. . . .  . . . .  . . . .  A5 . C#6 .',
        '. . . .  . . . .  . . . .  . . . .',
        '. . . .  . . . .  . . . .  B5 . D6 .',
        '. . . .  . . . .  . . . .  . . . .',
        '. . . .  . . . .  . . . .  . . . .',
        '. . . .  . . . .  . . . .  . . . .',
        '. . . .  . . . .  . . . .  . . . .',
      ].join(' | '),
      harmony: climb.harmony,
      drums: climb.drums,
      bass: climb.bass,
    },
    s: chorus,
    drop,
    b2: climb,
    lift: { chords: 'B7sus4 B7', melody: 'E6 - - -  - - - -  D#6 - - -  B5 - . .', key: 'E', lead: 'alt' },
    up: transposed(chorus, 2, 'E'),
    updrop: transposed(drop, 2, 'E'),
    outro: {
      chords: 'Aadd9 | G/A A7',
      melody: ['B5 - - -  - - - -  - - - -  A5 - - -', 'D6 - - -  - - - -  C#6 - - -  . . . .'].join(' | '),
      lead: 'alt',
      harmony: 'sparkle',
      drums: 'half',
    },
  },
  form: ['intro', 'a', 'b', 's', 'drop', 'b2', 's', 'lift', 'up', 'updrop', 'outro'],
  loopFrom: 1,
};
