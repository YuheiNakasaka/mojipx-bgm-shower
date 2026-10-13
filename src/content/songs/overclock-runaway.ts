import type { SongDef } from '../../domain/music/song.ts';

// A machine voice outrunning its own clock: a sixteenth riff that turns around its fifth before tumbling down the
// chord, a rapid-fire verse over a Dorian i–IV that the riff answers, a pre-chorus that resolves its sus4 and rises
// into a vi–IV–V–I chorus of long syncopated notes on the maj7 and the 9th, the riff racing under it on a rolling bass.
const riff = {
  chords: 'F#m7 | Dmaj7 | E | A',
  melody: [
    'C#6 B5 C#6 E6 . C#6 B5 A5 . B5 A5 F#5 . A5 B5 .',
    'C#6 B5 C#6 F#6 . C#6 A5 F#5 . A5 F#5 D5 . F#5 A5 .',
    'B5 A5 B5 E6 . B5 A5 G#5 . A5 G#5 E5 . G#5 B5 .',
    'C#6 B5 C#6 E6 . C#6 B5 A5 - - - - . . . .',
  ].join(' | '),
};

const chorus = {
  chords: 'F#m7 | Dmaj7 | E | A | F#m7 | Dmaj7 | Bm7 E | C#7sus4 C#7',
  melody: [
    'C#6 - - B5 - - C#6 - E6 - - - C#6 - B5 -',
    'C#6 - - - - - - - . . . . F#5 - A5 -',
    'B5 - - A5 - - B5 - E6 - - - B5 - A5 -',
    'B5 - - - - - - - . . . . E6 - F#6 -',
    'F#6 - - E6 - - F#6 - A6 - - - F#6 - E6 -',
    'F#6 - - - - - - - . . . . D6 - E6 -',
    'F#6 - - - D6 - - - E6 - - - G#6 - - -',
    'F#6 - - - - - - - F6 - - - C#6 - . .',
  ].join(' | '),
  counter: [
    'C#6 B5 C#6 E6 . C#6 B5 A5 . B5 A5 F#5 . A5 B5 .',
    'C#6 B5 C#6 F#6 . C#6 A5 F#5 . A5 F#5 D5 . F#5 A5 .',
    'B5 A5 B5 E6 . B5 A5 G#5 . A5 G#5 E5 . G#5 B5 .',
    'C#6 B5 C#6 E6 . C#6 B5 A5 . B5 A5 E5 . A5 B5 .',
    'C#6 B5 C#6 E6 . C#6 B5 A5 . B5 A5 F#5 . A5 B5 .',
    'C#6 B5 C#6 F#6 . C#6 A5 F#5 . A5 F#5 D5 . F#5 A5 .',
    'B5 A5 B5 D6 . B5 A5 F#5 . B5 G#5 E5 . G#5 B5 .',
    'C#6 B5 C#6 F#6 . C#6 G#5 F#5 . C#6 B5 G#5 . F5 G#5 .',
  ].join(' | '),
};

export const overclockRunaway: SongDef = {
  id: 'overclock-runaway',
  title: 'Overclock Runaway',
  style: 'vocal-electro',
  mood: { valence: 0.3, energy: 0.85 },
  key: 'F#m',
  bpm: 170,
  steps: 4,
  parts: { bass: 'roll' },
  sections: {
    intro: { ...riff, drums: false },
    a: {
      chords: 'F#m7 | B7 | F#m7 | B7 | Dmaj7 | C#m7 | Bm7 | C#7sus4 C#7',
      melody: [
        'C#5 C#5 E5 C#5 F#5 . E5 C#5 . . . . . . . .',
        'D#5 D#5 F#5 D#5 A5 . F#5 D#5 . . . . . . . .',
        'C#5 C#5 E5 C#5 F#5 . A5 G#5 . F#5 . E5 . . . .',
        'D#5 - - - F#5 - - - A5 - - - . . . .',
        'F#5 F#5 A5 F#5 C#6 . A5 F#5 . . . . . . . .',
        'E5 E5 G#5 E5 B5 . G#5 E5 . . . . . . . .',
        'D5 . F#5 . A5 . B5 . D6 . C#6 . B5 . A5 .',
        'F#5 - - - - - - - F5 - - - . . . .',
      ].join(' | '),
      counter: [
        '. . . . . . . . . B5 A5 F#5 . A5 B5 .',
        '. . . . . . . . . B5 A5 F#5 . A5 B5 .',
        '. . . . . . . . . . . . C#6 . E6 .',
        '. . . . . . . . . . . . B5 . D#6 .',
        '. . . . . . . . . C#6 A5 F#5 . A5 C#6 .',
        '. . . . . . . . . B5 G#5 E5 . G#5 B5 .',
        '. . . . . . . . . . . . . . . .',
        '. . . . . . . . . . . . C#6 . G#5 .',
      ].join(' | '),
      pad: false,
      harmony: false,
    },
    b: {
      chords: 'Dmaj7 | E/D | C#m7 | F#m7 | Bm7 | C#m7 | Dmaj7 | E7sus4 E7',
      melody: [
        'F#5 - - - A5 - - - C#6 - - - B5 - A5 -',
        'B5 - - - - - - - G#5 - - - . . . .',
        'G#5 - - - B5 - - - E6 - - - C#6 - B5 -',
        'C#6 - - - - - - - A5 - - - . . . .',
        'B5 - - - D6 - - - F#6 - - - E6 - D6 -',
        'E6 - - - - - - - C#6 - - - . . . .',
        'A5 - - - C#6 - - - E6 - - - F#6 - - -',
        'E6 - - - A5 - - - G#5 - - - B5 - - -',
      ].join(' | '),
      harmony: 'arp16',
      bass: 'octave',
    },
    s: chorus,
    riff: { ...riff, lead: 'alt' },
    last: { ...chorus, lead: 'alt' },
  },
  form: ['intro', 'a', 'b', 's', 'riff', 'a', 'b', 's', 'last'],
  loopFrom: 1,
};
