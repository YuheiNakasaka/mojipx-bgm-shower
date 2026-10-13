import type { SongDef } from '../../domain/music/song.ts';

// A sweet "aren't I cute" idol song: a dotted "cu-te, cu-te" cell that bounces down a step and back, a music box of
// bells answering every held note, a royal-road chorus that pushes its long notes onto the 9th, and a tag that
// sighs through the sweet minor iv.
const riffChords = 'Bbmaj7 | C7 | Am7 | Dm7';
const riff = [
  'D6 . . F6  . . D6 .  C6 . . A5  . . C6 .',
  'E6 . . G6  . . E6 .  D6 . . Bb5  . . D6 .',
  'C6 . . E6  . . C6 .  A5 . . G5  . . A5 .',
  'D6 . . F6  . . E6 .  D6 . . .  . . . .',
].join(' | ');
const silent = Array.from({ length: 4 }, () => '. . . .  . . . .  . . . .  . . . .').join(' | ');

const climb = {
  chords: 'Bbmaj7 | C/Bb | Am7 | Dm7 | Gm7 | Am7 | Bbmaj7 | C7sus4 C7',
  melody: [
    'F5 - - -  - - - -  G5 - - -  A5 - - -',
    'G5 - - -  - - - -  . . . .  . . . .',
    'G5 - - -  - - - -  A5 - - -  C6 - - -',
    'A5 - - -  - - - -  . . . .  . . . .',
    'Bb5 - - -  - - - -  C6 - - -  D6 - - -',
    'C6 - - -  - - - -  . . . .  . . . .',
    'D6 - - -  - - - -  C6 - - -  D6 - - -',
    'F6 - - -  - - - -  E6 - - -  . . . .',
  ].join(' | '),
  counter: [
    '. . . .  . . . .  . . . .  . . . .',
    '. . . .  . . . .  C6 . . E6  . . G6 .',
    '. . . .  . . . .  . . . .  . . . .',
    '. . . .  . . . .  D6 . . F6  . . A6 .',
    '. . . .  . . . .  . . . .  . . . .',
    '. . . .  . . . .  E6 . . A6  . . G6 .',
    '. . . .  . . . .  . . . .  . . . .',
    '. . . .  . . . .  . . . .  . . . .',
  ].join(' | '),
  harmony: 'sparkle' as const,
  drums: 'half' as const,
  bass: 'whole' as const,
};

const chorus = {
  chords: 'Bbmaj7 | C7 | Am7 | Dm7 | Bbmaj7 | C7 | Am7 Dm7 | Gm7 C7sus4',
  melody: [
    'D6 - - C6  D6 - - C6  D6 - - .  . . E6 -',
    '- - - -  D6 - - .  . . . .  . . . .',
    'C6 - - Bb5  C6 - - Bb5  C6 - - .  . . E6 -',
    '- - - -  D6 - - .  . . . .  . . F5 -',
    'F6 - - -  - - - -  D6 - - C6  - - D6 -',
    '- - - -  - - - -  . . . .  . . . .',
    'C6 - - A5  C6 - - A5  D6 - - E6  - - F6 -',
    '- - - -  - - E6 -  - - D6 -  - - - .',
  ].join(' | '),
  counter: [
    '. . . .  . . . .  . . . .  . . . .',
    '. . . .  . . . .  E6 . . G6  . . E6 .',
    '. . . .  . . . .  . . . .  . . . .',
    '. . . .  . . . .  D6 . . F6  . . . .',
    '. . . .  . . . .  . . . .  . . . .',
    '. . . .  . . . .  E6 . . G6  . . Bb6 .',
    '. . . .  . . . .  . . . .  . . . .',
    '. . . .  . . . .  . . . .  C6 . . .',
  ].join(' | '),
  lead: 'alt' as const,
};

export const cuterThanYesterday: SongDef = {
  id: 'cuter-than-yesterday',
  title: 'Cuter Than Yesterday',
  style: 'kawaii-pop',
  mood: { valence: 0.8, energy: 0.5 },
  key: 'F',
  bpm: 146,
  steps: 4,
  sections: {
    intro: { chords: riffChords, melody: silent, counter: riff, harmony: 'sparkle', bass: false, drums: false },
    a: {
      chords: 'Fmaj7 | Em7b5 A7 | Dm7 | Dm7/C | Bbmaj7 | Am7 | Gm7 | C7sus4 C7',
      melody: [
        'A5 - - G5  A5 - . .  C6 - - A5  G5 - . .',
        'F5 - - E5  F5 - . .  E5 - - C#5  E5 - . .',
        'D5 - - E5  F5 - . .  A5 - - G5  F5 - . .',
        'E5 - - -  - - - -  . . . .  . . . .',
        'D5 - - C5  D5 - . .  F5 - - D5  C5 - . .',
        'E5 - - D5  E5 - . .  G5 - - E5  D5 - . .',
        'F5 - - -  G5 - - -  A5 - - -  Bb5 - - -',
        'C6 - - -  - - - -  Bb5 - - -  . . . .',
      ].join(' | '),
      counter: [
        '. . . .  . . . .  . . . .  . . . .',
        '. . . .  . . . .  . . . .  . . . .',
        '. . . .  . . . .  . . . .  . . . .',
        '. . . .  . . . .  D6 . . F6  . . E6 .',
        '. . . .  . . . .  . . . .  . . . .',
        '. . . .  . . . .  . . . .  . . . .',
        '. . . .  . . . .  . . . .  . . . .',
        '. . . .  . . . .  . . . .  C6 . E6 .',
      ].join(' | '),
      pad: false,
      harmony: 'offbeat',
    },
    b: climb,
    s: chorus,
    bells: { chords: riffChords, melody: silent, counter: riff, harmony: 'sparkle' },
    tag: {
      chords: 'Bbmaj7 | Bbm6 | F/A | Gm7 C7sus4',
      melody: [
        'F6 - - -  - - - -  D6 - - -  - - - -',
        'F6 - - -  - - - -  Db6 - - -  - - - -',
        'C6 - - -  - - - -  A5 - - -  - - - -',
        'Bb5 - - -  - - A5 -  - - G5 -  - - . .',
      ].join(' | '),
      counter: [
        '. . . .  . . . .  . . . .  A5 . D6 .',
        '. . . .  . . . .  . . . .  Bb5 . Db6 .',
        '. . . .  . . . .  . . . .  F5 . A5 .',
        '. . . .  . . . .  . . . .  E5 . G5 .',
      ].join(' | '),
      harmony: 'sparkle',
      drums: 'half',
      bass: 'whole',
    },
  },
  form: ['intro', 'a', 'b', 's', 'bells', 'b', 's', 'tag'],
  loopFrom: 1,
};
