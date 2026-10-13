// A rooftop pool party at full tilt: four on the floor and an octave bass, a chorus whose long notes land an eighth
// early while brass stabs fill the space, a minor iv sighing at the end of the pre-chorus, and a last chorus a semitone up.
import { type SongDef, transposed } from '../../domain/music/song.ts';

const riff = {
  chords: 'Dmaj7 | E/D | C#m7 F#7 | Bm7 E7',
  melody: 'F#5 A5 C#6 E6 - C#6 A5 - | G#5 B5 D6 F#6 - D6 B5 - | E6 - C#6 - . A#5 C#6 E6 | D6 - B5 - . G#5 B5 D6',
  counter: ['. F#5+A5 . F#5+A5 - . . .', '. E5+G#5 . E5+G#5 - . . .', '. E5+G#5 . . E5+A#5 - . .', '. D5+A5 . . D5+G#5 - . .'].join(' | '),
};

const chorus = {
  chords: 'Dmaj7 | E/D | C#m7 | F#7 | Bm7 | E7 | C#m7 F#7 | Bm7 E7',
  melody: [
    'F#6 - - - - E6 C#6 B5',
    '- - - - - C#6 D6 E6',
    '- - - - - C#6 B5 A#5',
    '- - - - - C#6 E6 F#6',
    '- - - - - E6 F#6 G#6',
    '- - - - F#6 E6 D6 C#6',
    '- - - E6 - - A#5 C#6',
    '- - - B5 - - . .',
  ].join(' | '),
  counter: [
    '. F#5+A5 . F#5+A5 - . . .',
    '. E5+G#5 . E5+G#5 - . . .',
    '. E5+G#5 . E5+G#5 - . . .',
    '. A#4+E5 . A#4+E5 - . . .',
    '. D5+A5 . D5+A5 - . . .',
    '. D5+G#5 . D5+G#5 - . . .',
    '. E5+G#5 . . E5+A#5 - . .',
    '. D5+F#5 . . D5+G#5 - . .',
  ].join(' | '),
  lead: 'alt' as const,
};

export const poolsideMirrorball: SongDef = {
  id: 'poolside-mirrorball',
  title: 'Poolside Mirrorball',
  style: 'city-groove',
  mood: { valence: 0.65, energy: 0.6 },
  key: 'A',
  bpm: 122,
  parts: { bass: 'octave', drums: 'euro' },
  sections: {
    intro: { ...riff, drums: 'four' },
    a: {
      chords: 'Amaj7 | Bm7 | C#m7 | Bm7 | Amaj7 | Bm7 | C#m7 | Dmaj7 E7',
      melody: [
        '. E5 . C#5 E5 - F#5 E5',
        '- - . D5 F#5 - E5 D5',
        '. E5 . C#5 E5 - F#5 E5',
        '- - . D5 B4 - . .',
        '. E5 . C#5 E5 - A5 G#5',
        '- - . F#5 A5 - F#5 D5',
        '. G#5 . E5 G#5 - B5 G#5',
        '- - . F#5 E5 - D5 -',
      ].join(' | '),
      pad: false,
      bass: 'funk',
      drums: 'city',
    },
    b: {
      chords: 'F#m7 | E | Dmaj7 | C#m7 | Bm7 | C#m7 | Dmaj7 Dm6 | E7sus4 E7',
      melody: [
        'C#5 - E5 - F#5 G#5 A5 -',
        'G#5 - - - . . . .',
        'D5 - F#5 - A5 B5 C#6 -',
        'B5 - - - . . . .',
        'E5 - F#5 - A5 B5 D6 -',
        'C#6 - - - . . . .',
        'D6 - C#6 - D6 - F6 -',
        'E6 - - - D6 - E6 -',
      ].join(' | '),
      drums: 'four',
    },
    s: chorus,
    lift: { chords: 'F7sus4 F7', melody: 'Eb6 - - - C6 - D6 F6', key: 'Bb', lead: 'alt' },
    up: transposed(chorus, 1, 'Bb'),
    brk: riff,
  },
  form: ['intro', 'a', 'b', 's', 'lift', 'up', 'brk'],
  loopFrom: 1,
};
