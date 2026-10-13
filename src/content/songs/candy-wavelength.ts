import { type SongDef, transposed } from '../../domain/music/song.ts';

// A crush confessed by a machine voice: a skipping synth riff, a talky staccato verse that the riff answers, a
// pre-chorus climbing on ii–iii–IV, and a royal-road chorus on the square lead whose hook hops up two steps and
// falls, doubled in thirds on its second pass, then lifted a semitone and brought home through a flat-VI chord.
const riff = {
  chords: 'Amaj7 | B7 | G#m7 | C#m7 B7sus4',
  melody: [
    'E6 . C#6 E6 . C#6 B5 . G#5 . B5 . C#6 . E6 .',
    'F#6 . D#6 F#6 . D#6 B5 . A5 . B5 . D#6 . F#6 .',
    'D#6 . B5 D#6 . B5 G#5 . F#5 . G#5 . B5 . D#6 .',
    'E6 . C#6 E6 . C#6 B5 . A5 . F#5 . E5 - - -',
  ].join(' | '),
};

const chorus = {
  chords: 'Amaj7 | B7 | G#m7 | C#m7 | Amaj7 | B7 | G#m7 C#7 | F#m7 B7sus4',
  melody: [
    'B5 . C#6 . E6 - - - C#6 - B5 - G#5 - - -',
    'A5 . B5 . D#6 - - - B5 - A5 - F#5 - - -',
    'G#5 . B5 . D#6 - - - F#6 - - - D#6 - - -',
    'E6 - - - - - - - . . . . B5 - C#6 -',
    'B5 . C#6 . E6 - - - C#6 - B5 - G#5 - - -',
    'A5 . B5 . D#6 - - - F#6 - - - A6 - - -',
    'G#6 - - - - - - - F6 - - - C#6 - - -',
    'F#6 - - - - - - - E6 - - - - - . .',
  ].join(' | '),
  counter: [
    '. . . . . . . . . . . . . . . .',
    '. . . . . . . . . . . . . . . .',
    '. . . . . . . . . . . . . . . .',
    'C#6 - - - - - - - B5 . G#5 B5 . G#5 E5 .',
    'G#5 . A5 . C#6 - - - A5 - G#5 - E5 - - -',
    'F#5 . F#5 . B5 - - - D#6 - - - F#6 - - -',
    'D#6 - - - - - - - C#6 - - - G#5 - - -',
    'C#6 - - - - - - - B5 - - - - - . .',
  ].join(' | '),
  lead: 'alt' as const,
};

export const candyWavelength: SongDef = {
  id: 'candy-wavelength',
  title: 'Candy Wavelength',
  style: 'vocal-electro',
  mood: { valence: 0.6, energy: 0.6 },
  key: 'E',
  bpm: 138,
  steps: 4,
  sections: {
    intro: { ...riff, drums: false, bass: 'whole' },
    a: {
      chords: 'Emaj7 | B/D# | C#m7 | G#m7 | Amaj7 | E/G# | F#m7 | B7sus4 B7',
      melody: [
        'E5 . E5 F#5 G#5 . E5 . B4 - - - . . . .',
        'D#5 . D#5 E5 F#5 . D#5 . B4 - - - . . . .',
        'C#5 . C#5 D#5 E5 . G#5 . B5 - - - G#5 - . .',
        'F#5 - - - D#5 - - - B4 - - - . . . .',
        'A4 . A4 B4 C#5 . A4 . E5 - - - . . . .',
        'G#4 . G#4 A4 B4 . G#4 . E5 - - - . . . .',
        'F#4 . A4 . C#5 . E5 . F#5 - - - E5 - C#5 -',
        'E5 - - - - - - - D#5 - - - . . . .',
      ].join(' | '),
      counter: [
        '. . . . . . . . B5 . G#5 B5 . G#5 E5 .',
        '. . . . . . . . B5 . F#5 B5 . F#5 D#5 .',
        '. . . . . . . . . . . . . . . .',
        '. . . . . . . . . . . . F#5 . D#5 .',
        '. . . . . . . . C#6 . A5 C#6 . A5 E5 .',
        '. . . . . . . . B5 . G#5 B5 . G#5 E5 .',
        '. . . . . . . . . . . . . . . .',
        '. . . . . . . . . . . . F#5 . A5 .',
      ].join(' | '),
      pad: false,
      harmony: 'offbeat',
    },
    b: {
      chords: 'F#m7 | G#m7 | Amaj7 | E/G# | F#m7 | G#m7 | Amaj7 | B7sus4 B7',
      melody: [
        'A4 - - - C#5 - E5 - - - F#5 - E5 - C#5 -',
        'B4 - - - D#5 - F#5 - - - G#5 - F#5 - D#5 -',
        'C#5 - - - E5 - G#5 - - - A5 - G#5 - E5 -',
        'B4 - - - - - - - G#4 - - - . . . .',
        'C#5 - - - E5 - A5 - - - C#6 - B5 - A5 -',
        'D#5 - - - F#5 - B5 - - - D#6 - C#6 - B5 -',
        'E5 - - - A5 - C#6 - - - E6 - D#6 - C#6 -',
        'E6 - - - - - - - D#6 - - - - - . .',
      ].join(' | '),
      harmony: 'sparkle',
      bass: 'octave',
    },
    s: chorus,
    riff: { ...riff, lead: 'alt' },
    lift: { chords: 'C7sus4 C7', melody: 'F6 - - - - - - - E6 - - - . . . .', key: 'F', lead: 'alt' },
    up: transposed(chorus, 1, 'F'),
    outro: {
      chords: 'Cmaj7 | B7sus4 B7',
      melody: 'G6 - - - - - - - E6 - - - - - - - | E6 - - - - - - - D#6 - - - B5 - - -',
      lead: 'alt',
    },
  },
  form: ['intro', 'a', 'b', 's', 'riff', 'b', 's', 'lift', 'up', 'outro'],
  loopFrom: 1,
};
