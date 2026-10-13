import { type SongDef, transposed } from '../../domain/music/song.ts';

// The last summer before everyone leaves town: a talky verse, a pre-chorus climbing in sequence, a royal-road chorus
// whose sighs turn upward through the borrowed flat VI and VII, and a bridge climbing into a lift a semitone higher.
const riff = {
  chords: 'Amaj7 | B | G#m7 C#m7 | F#m7 B7sus4',
  melody: ['E6 - C#6 - B5 C#6 E6 -', 'F#6 - D#6 - B5 D#6 F#6 -', 'G#6 - D#6 - E6 - B5 -', 'C#6 - B5 - G#5 - E5 -'].join(' | '),
  lead: 'alt' as const,
};

const chorus = {
  chords: 'Amaj7 | B | G#m7 | C#m7 | Amaj7 | B | Cmaj7 D | E',
  melody: [
    'B5 - - - C#6 - E6 -',
    'D#6 - - - - - C#6 B5',
    '- - - - - - G#5 B5',
    '- - - - G#5 - E5 .',
    'B5 - - - C#6 - E6 -',
    'F#6 - - - - - - E6',
    '- - G6 - F#6 - - -',
    'G#6 - - - - - . .',
  ].join(' | '),
  counter: [
    'E5 - - - A5 - - -',
    'F#5 - - - D#5 - - -',
    'D#5 - - - F#5 - - -',
    'E5 - - - . . G#5 A5',
    'G#5 - - - E5 - - -',
    'D#5 - - - B4 - - -',
    'C5 - - - D5 - - -',
    'E5 - - - - - . .',
  ].join(' | '),
  lead: 'alt' as const,
};

export const shorelinePromise: SongDef = {
  id: 'shoreline-promise',
  title: 'Shoreline Promise',
  style: 'band-rock',
  mood: { valence: 0, energy: 0.35 },
  key: 'E',
  bpm: 132,
  sections: {
    intro: riff,
    a: {
      chords: 'E | B/D# | C#m7 | A | E/G# | Amaj7 | F#m7 | B7sus4 B7',
      melody: [
        '. G#4 G#4 F#4 G#4 - B4 -',
        'C#5 - - - B4 - . .',
        '. G#4 G#4 F#4 G#4 - C#5 E5',
        '- - - - B4 - . .',
        '. B4 B4 A4 B4 - E5 F#5',
        'G#5 - - - E5 - C#5 -',
        'A4 - - B4 C#5 - E5 -',
        'E5 - - - D#5 - . .',
      ].join(' | '),
      pad: false,
      harmony: 'broken',
      bass: 'half',
      drums: 'light',
    },
    b: {
      chords: 'F#m7 | E/G# | Amaj7 | B | G#m7 | C#m7 | F#m7 | B7sus4 B7',
      melody: [
        'C#5 - - - B4 C#5 E5 -',
        'E5 - - - D#5 E5 G#5 -',
        'G#5 - - - F#5 G#5 B5 -',
        'B5 - - - - - . .',
        'D#5 - - - B4 D#5 F#5 -',
        'E5 - - - C#5 E5 G#5 -',
        'A5 - - - F#5 A5 C#6 -',
        'B5 - - - A5 - F#5 A5',
      ].join(' | '),
      bass: 'root-fifth',
      drums: 'half',
    },
    s: chorus,
    solo: {
      ...riff,
      counter: ['C#6 - A5 - G#5 A5 C#6 -', 'D#6 - B5 - F#5 B5 D#6 -', 'D#6 - B5 - C#6 - G#5 -', 'A5 - F#5 - E5 - B4 -'].join(' | '),
    },
    c1: {
      chords: 'C#m7 | G#m7 | A | E/G#',
      melody: ['G#4 - - - E5 - - -', 'D#5 - - - B4 - - -', 'A4 - - - F#5 - - -', 'E5 - - - - - . .'].join(' | '),
      harmony: 'arp-updown',
      bass: 'whole',
      drums: 'half',
    },
    c2: {
      chords: 'F#m7 | G#m7 | Amaj7 | B7sus4',
      melody: ['C#5 - - - A5 - - -', 'G#5 - - - B5 - - -', 'C#6 - - - B5 - - -', 'A5 - - - B5 - E6 -'].join(' | '),
      drums: 'eight',
    },
    lift: { chords: 'C7sus4 C7', melody: 'F6 - - - E6 - - -', key: 'F', lead: 'alt' },
    up: transposed(chorus, 1, 'F'),
    outro: { chords: 'Amaj7 | B7sus4 B7', melody: 'E6 - - - C#6 - - B5 | - - - - A5 - F#5 -', lead: 'alt', drums: 'half' },
  },
  form: ['intro', 'a', 'b', 's', 'solo', 'c1', 'c2', 'lift', 'up', 'outro'],
  loopFrom: 1,
};
