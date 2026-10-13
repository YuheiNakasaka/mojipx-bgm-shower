import { type SongDef, transposed } from '../../domain/music/song.ts';

// Waiting on a winter platform for someone who may not come: a verse over a bass falling by semitones, a chorus of
// long sighing tones pushed ahead into its peak, then the last chorus a whole step up before the breath fades.
const chorus = {
  chords: 'Gmaj7 | A | F#m7 | Bm7 | Em7 | F#7sus4 F#7 | Gmaj7 A | Bm',
  melody: [
    'F#6 - - - - - E6 D6',
    'E6 - - - - - D6 C#6',
    'C#6 - - - - - B5 C#6',
    'D6 - - - - - . G6',
    '- - - - F#6 - E6 -',
    'F#6 - - - - - A#5 -',
    'B5 - - - C#6 - - -',
    'D6 - - - - - . .',
  ].join(' | '),
  harmony: 'arp-updown' as const,
  bass: 'ballad' as const,
};

export const lastTrainFirstSnow: SongDef = {
  id: 'last-train-first-snow',
  title: 'Last Train, First Snow',
  style: 'snowfall',
  mood: { valence: -0.5, energy: -0.6 },
  key: 'Bm',
  bpm: 80,
  sections: {
    intro: {
      chords: 'Gmaj7 | F#7sus4 F#7',
      melody: 'F#5 B5 C#6 D6 - - - - | C#6 - - - A#5 - - -',
      harmony: 'arp-down',
      bass: 'whole',
      drums: false,
    },
    a: {
      chords: 'Bm | F#/A# | A | E/G# | Gmaj7 | D/F# | Em7 | F#7sus4 F#7',
      melody: [
        '. . B4 D5 F#5 F#5 E5 D5',
        'C#5 - - - . . . .',
        '. . A4 C#5 E5 E5 D5 C#5',
        'B4 - - - . . . .',
        '. . B4 D5 F#5 F#5 G5 F#5',
        'D5 - - - A4 - - -',
        '. . B4 E5 G5 G5 F#5 E5',
        'F#5 - - - E5 - - -',
      ].join(' | '),
      drums: false,
    },
    b: {
      chords: 'Em7 | F#m7 | G6 | F#7sus4 F#7',
      melody: '. . E5 F#5 G5 - B5 - | A5 - - - F#5 - - - | . . G5 A5 B5 - D6 - | C#6 - B5 - A#5 - - -',
      harmony: 'arp-updown',
    },
    s: chorus,
    lift: { chords: 'G#7sus4 G#7', melody: 'C#6 - - - C6 - - -', key: 'C#m', harmony: 'pad', drums: false },
    up: transposed(
      {
        ...chorus,
        counter: [
          'B4 - D5 - F#5 - - -',
          'C#5 - E5 - A5 - - -',
          'A4 - C#5 - E5 - - -',
          'F#5 - - - D5 - - -',
          'E5 - G5 - B5 - - -',
          'E5 - - - C#5 - - -',
          'D5 - - - E5 - - -',
          'F#5 - - - - - - -',
        ].join(' | '),
        harmony: 'arp16',
        drums: 'half',
      },
      2,
      'C#m',
    ),
    outro: {
      chords: 'A Gmaj7 | F#7sus4 F#7',
      melody: 'C#6 - - - B5 - - - | F#5 - - - - - . .',
      harmony: 'arp-down',
      bass: 'whole',
      drums: false,
    },
  },
  form: ['intro', 'a', 'b', 's', 'lift', 'up', 'outro'],
  loopFrom: 1,
};
