import type { SongDef } from '../../domain/music/song.ts';

// Euphoric minor rave on a rooftop: the old syncopated hook opens the night, the verse climbs a stepwise bass,
// a build stacks chord tones to the sky, and the drop sings the hook's rhythm over a vi–IV–V–I loop with pumping plucks.
const hook = {
  chords: 'F#m | D | A | E | F#m | D | Bm | E',
  melody: [
    'C#6 . C#6 B5 - A5 - F#5',
    'D6 . D6 C#6 - A5 - F#5',
    'E6 . E6 C#6 - B5 - A5',
    'B5 - - - . . G#5 B5',
    'C#6 . C#6 B5 - A5 - F#5',
    'D6 . D6 F#6 - E6 - D6',
    'D6 - - - C#6 - B5 -',
    'B5 - - - - - . .',
  ].join(' | '),
};

const drop = {
  chords: 'F#m | D | E | A | Bm7 | D | C#7sus4 | C#7',
  melody: [
    'A5 . A5 C#6 - E6 - F#6',
    '- - - - E6 - D6 -',
    'G#5 . G#5 B5 - E6 - G#6',
    '- - - - F#6 - E6 -',
    'B5 . B5 D6 - F#6 - A6',
    '- - - - F#6 - E6 -',
    'G#6 - - - F#6 - - -',
    'F6 - - - - - . .',
  ].join(' | '),
  lead: 'alt' as const,
};

export const rooftopRave: SongDef = {
  id: 'rooftop-rave',
  title: 'Rooftop Rave',
  style: 'trance-pop',
  mood: { valence: 0.5, energy: 0.9 },
  key: 'F#m',
  bpm: 152,
  sections: {
    intro: {
      chords: 'F#m | D | A | E',
      melody: 'C#6 . C#6 B5 - A5 - F#5 | D6 . D6 C#6 - A5 - F#5 | E6 . E6 C#6 - B5 - A5 | B5 - - - . . G#5 B5',
      drums: false,
      bass: false,
    },
    a: {
      chords: 'F#m | E/G# | A | Bm7 | Dmaj7 | C#m7 | Bm7 | C#7sus4 C#7',
      melody: [
        '. C#5 C#5 E5 . F#5 . .',
        '. B4 B4 E5 . G#5 . .',
        '. C#5 C#5 E5 . A5 . .',
        'A5 - - - F#5 - D5 -',
        '. D5 D5 F#5 . A5 . C#6',
        'B5 - - - G#5 - E5 -',
        'F#5 - - - E5 - D5 -',
        'F#5 - - - F5 - - -',
      ].join(' | '),
      pad: false,
      drums: 'half',
      bass: 'offbeat',
    },
    b: {
      chords: 'Dmaj7 | E | C#m7 | F#m | Bm7 | C#m7 | Dmaj7 | E',
      melody: [
        'A5 - - F#5 - - A5 -',
        'B5 - - G#5 - - B5 -',
        'C#6 - - G#5 - - C#6 -',
        'C#6 - - - - - . .',
        'D6 - - B5 - - D6 -',
        'E6 - - C#6 - - E6 -',
        'F#6 - - D6 - - F#6 -',
        'G#6 - - - - - . .',
      ].join(' | '),
      drums: 'half',
      harmony: 'arp16',
    },
    s: drop,
    hook,
    brk: {
      chords: 'Dmaj7 | E | C#m7 | C#7sus4 C#7',
      melody: 'C#6 - - - - - - - | B5 - - - - - - - | E6 - - - - - - - | F#5 - - - F5 - - -',
      drums: false,
      bass: false,
      harmony: false,
    },
    s2: {
      ...drop,
      counter: [
        '. F#5 . A5 . C#6 . A5',
        '. F#5 . A5 . D6 . A5',
        '. G#5 . B5 . E6 . B5',
        '. A5 . C#6 . E6 . C#6',
        '. F#5 . B5 . D6 . B5',
        '. F#5 . A5 . D6 . A5',
        '. F#5 . G#5 . C#6 . G#5',
        '. F5 . G#5 . B5 . G#5',
      ].join(' | '),
    },
  },
  form: ['intro', 'a', 'b', 's', 'brk', 's', 's2', 'hook'],
  loopFrom: 1,
};
