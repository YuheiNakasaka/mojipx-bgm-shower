import type { SongDef } from '../../domain/music/song.ts';

// A sugar-rush future-bass song: a dreamy Lydian float (the major II over the tonic) frames it, the verse chatters in
// syncopated sixteenths, and the chorus drops to half time under wobbling chords with a 3-3-3-3-4 cell that leaps an
// octave into the title and leans on the IV chord's raised 4th.
const float = {
  chords: 'Gmaj7 | A/G | Gmaj7 | A/G',
  melody: [
    'B5 - - -  D6 - - -  F#6 - - -  - - - -',
    'E6 - - -  - - - -  C#6 - - -  - - - -',
    'B5 - - -  D6 - - -  A6 - - -  - - - -',
    'F#6 - - -  - - E6 -  - - C#6 -  - - A5 -',
  ].join(' | '),
  harmony: 'sparkle' as const,
  drums: 'half' as const,
  bass: 'whole' as const,
};

export const cottonCandyComet: SongDef = {
  id: 'cotton-candy-comet',
  title: 'Cotton Candy Comet',
  style: 'kawaii-pop',
  mood: { valence: 0.7, energy: 0.6 },
  key: 'G',
  bpm: 150,
  steps: 4,
  sections: {
    intro: { ...float, drums: false },
    a: {
      chords: 'Gmaj7 | Bm7 | Em7 | Cmaj7 | Am7 | Bm7 | Cmaj7 D | D7sus4 D',
      melody: [
        'B4 . D5 E5  . D5 . B5  - - A5 .  F#5 . . .',
        'F#5 - - -  - - D5 -  - - . .  . . . .',
        'G4 . B4 D5  . B4 . G5  - - F#5 .  D5 . . .',
        'E5 - - -  - - C5 -  - - . .  . . . .',
        'A4 . C5 D5  . C5 . A5  - - G5 .  E5 . . .',
        'D5 - - -  - - F#5 -  - - . .  . . . .',
        'E5 . G5 A5  . G5 . E5  F#5 - - .  A5 . . .',
        'G5 - - -  - - - -  F#5 - - -  . . . .',
      ].join(' | '),
      pad: false,
    },
    b: {
      chords: 'Cmaj7 | D/C | Bm7 | Em7 | Am7 | Bm7 | Cmaj7 | D7sus4 D',
      melody: [
        'E5 - - -  - - - -  . . G5 A5  B5 - - -',
        'A5 - - -  - - - -  . . . .  . . . .',
        'F#5 - - -  - - - -  . . A5 B5  D6 - - -',
        'B5 - - -  - - - -  . . . .  . . . .',
        'A5 - - -  - - - -  . . C6 D6  E6 - - -',
        'D6 - - -  - - - -  . . . .  . . . .',
        'A5 - - -  B5 - - -  C6 - - -  D6 - - -',
        'G5 - - -  - - - -  F#5 - - -  A5 - . .',
      ].join(' | '),
      counter: [
        '. . . .  . . . .  . . . .  . . . .',
        '. . . .  . . . .  F#5 . A5 .  D6 . . .',
        '. . . .  . . . .  . . . .  . . . .',
        '. . . .  . . . .  G5 . B5 .  E6 . . .',
        '. . . .  . . . .  . . . .  . . . .',
        '. . . .  . . . .  A5 . D6 .  F#6 . . .',
        '. . . .  . . . .  . . . .  . . . .',
        '. . . .  . . . .  . . . .  . . . .',
      ].join(' | '),
      harmony: 'arp16',
      bass: 'roll',
      drums: 'euro',
    },
    s: {
      chords: 'Cmaj7 | D/C | Bm7 | Em7 | Cmaj7 | D/C | Bm7 E7 | Am7 D7sus4',
      melody: [
        'E6 - . D6  - . E6 -  . D6 - .  B5 - - -',
        'A5 - - -  - - - -  . . . .  . . . .',
        'F#6 - . E6  - . F#6 -  . E6 - .  D6 - - -',
        'B5 - - -  - - - -  . . . .  . . E5 -',
        'E6 - - -  - - G6 -  - - - -  F#6 - - -',
        '- - - -  - - E6 -  - - D6 -  . . . .',
        'D6 - . B5  - . D6 -  . B5 - .  G#5 - - -',
        'C6 - - -  - - B5 -  - - E6 -  . . . .',
      ].join(' | '),
      counter: [
        '. . . .  . . . .  . . . .  . . . .',
        '. . . .  . . . .  D6 . F#6 .  A6 . . .',
        '. . . .  . . . .  . . . .  . . . .',
        '. . . .  . . . .  G6 . E6 .  B5 . . .',
        '. . . .  . . . .  . . . .  . . . .',
        '. . . .  . . . .  . . . .  A6 . F#6 .',
        '. . . .  . . . .  . . . .  . . . .',
        '. . . .  . . . .  . . . .  D6 . A5 .',
      ].join(' | '),
      lead: 'alt',
      harmony: 'wobble',
      drums: 'future',
      bass: 'whole',
    },
    float,
  },
  form: ['intro', 'a', 'b', 's', 'float', 'b', 's', 'float'],
  loopFrom: 1,
};
