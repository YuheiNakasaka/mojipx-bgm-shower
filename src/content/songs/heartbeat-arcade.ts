import { type SongDef, transposed } from '../../domain/music/song.ts';

// An idol anime opening: a sparkling riff over the royal road, a chatty verse over a bass walking down from E, a
// pre-chorus that repeats one figure while the bass climbs under it, and a vi–IV–V–I chorus that leaps up a sixth
// and peaks on the sixth of IV; the last chorus is lifted a whole step and slides home through the ♭VII.
const chorus = {
  chords: 'C#m7 | Aadd9 | B | E/G# | C#m7 | Aadd9 | Bsus4 B | E',
  melody: [
    'G#5 - E6 - - - D#6 B5',
    'C#6 - - - B5 - . .',
    'F#5 - D#6 - - - C#6 A5',
    'B5 - - - G#5 - . .',
    'B5 - E6 - - - F#6 E6',
    'F#6 - - - E6 - C#6 -',
    'E6 - - - D#6 - B5 -',
    'E6 - - - - - . .',
  ].join(' | '),
  counter: [
    'E5 - - - G#5 - - -',
    'A5 - - - . E5 F#5 G#5',
    'D#5 - - - F#5 - - -',
    'G#5 - - - . B4 C#5 D#5',
    'E5 - - - G#5 - - -',
    'A5 - - - G#5 - - -',
    'B5 - - - F#5 - - -',
    'G#5 - - - . B5 C#6 D#6',
  ].join(' | '),
  harmony: 'arp-up' as const,
};

export const heartbeatArcade: SongDef = {
  id: 'heartbeat-arcade',
  title: 'Heartbeat Arcade',
  style: 'nineties-pop',
  mood: { valence: 0.7, energy: 0.7 },
  key: 'E',
  bpm: 140,
  sections: {
    inter: {
      chords: 'Amaj7 | B | G#m7 | C#m7',
      melody: ['E6 . C#6 E6 . B5 C#6 E6', 'F#6 . D#6 F#6 . B5 D#6 F#6', 'D#6 . B5 D#6 . F#5 G#5 B5', 'C#6 - - - B5 - G#5 -'].join(' | '),
    },
    a: {
      chords: 'E | E/D | C#m7 | C#m7/B | Amaj7 | G#m7 | F#m7 | B7sus4 B7',
      melody: [
        '. B4 B4 E5 - E5 F#5 G#5',
        '- - F#5 E5 - . . .',
        '. C#5 C#5 E5 - E5 F#5 G#5',
        '- - B5 G#5 - . . .',
        '. A4 A4 C#5 - C#5 E5 G#5',
        '- - F#5 D#5 - . . .',
        '. F#5 F#5 A5 - A5 G#5 F#5',
        'E5 - - - D#5 - . .',
      ].join(' | '),
      drums: 'eight',
      bass: 'root-fifth',
    },
    b: {
      chords: 'F#m7 | G#m7 | Amaj7 | A#m7b5 | Bsus4 B | G#7 | Amaj7 | B7sus4 B7',
      melody: [
        'C#5 - E5 - A5 - - -',
        'D#5 - F#5 - B5 - - -',
        'E5 - G#5 - C#6 - - -',
        'E5 - G#5 - C#6 - - -',
        'E6 - - - D#6 - - -',
        'C6 - - - G#5 - - -',
        'C#6 - - - E6 - - -',
        'E6 - - - D#6 - - -',
      ].join(' | '),
      drums: 'half',
      bass: 'half',
      harmony: 'syncopate',
    },
    s: chorus,
    lift: { chords: 'C#7sus4 C#7', melody: 'F#6 - - - F6 - C#6 -', key: 'F#' },
    up: transposed(chorus, 2, 'F#'),
    outro: { chords: 'D | B7sus4 B7', melody: 'A5 - - - D6 - F#6 - | E6 - - - D#6 - B5 -' },
  },
  form: ['inter', 'a', 'b', 's', 'inter', 'b', 's', 'lift', 'up', 'outro'],
  loopFrom: 1,
};
