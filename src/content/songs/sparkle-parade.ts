// Bright parade pop: a synth riff that keeps landing on the same high E, a canon verse, a pre-chorus climbing in
// sequence, the chorus lit by secondary dominants with the riff under it, and a second chorus lifted a semitone.
import { type SongDef, transposed } from '../../domain/music/song.ts';

const riff = {
  chords: 'E | C#m7 | Amaj7 | B7sus4 B7',
  melody: 'E5 G#5 . B5 - E6 . B5 | E5 G#5 . B5 - E6 . C#6 | E5 A5 . C#6 - E6 . C#6 | E5 F#5 . B5 - D#6 . B5',
};

const chorus = {
  chords: 'E | G#7 | C#m7 | E7 | Amaj7 | B | G#m7 C#m7 | F#m7 B7',
  melody: [
    'E6 - - - - - D#6 C#6',
    'C6 - - - D#6 - C6 G#5',
    'C#6 - - - E6 - D#6 C#6',
    'B5 - G#5 - D6 - - -',
    'C#6 - - - A5 - B5 C#6',
    'D#6 - - - F#6 - E6 D#6',
    'G#6 - - - E6 - C#6 -',
    'A5 - F#5 - D#5 - - -',
  ].join(' | '),
  counter: [
    'E4 G#4 . B4 - E5 . B4',
    'D#4 G#4 . C5 - D#5 . C5',
    'E4 G#4 . C#5 - E5 . C#5',
    'D4 G#4 . B4 - D5 . B4',
    'E4 A4 . C#5 - E5 . C#5',
    'F#4 B4 . D#5 - F#5 . D#5',
    'D#4 G#4 . B4 - E5 . C#5',
    'C#5 F#5 . A5 - D#5 . B4',
  ].join(' | '),
};

export const sparkleParade: SongDef = {
  id: 'sparkle-parade',
  title: 'Sparkle Parade',
  style: 'nineties-pop',
  mood: { valence: 0.7, energy: 0.6 },
  key: 'E',
  bpm: 144,
  sections: {
    intro: { ...riff, bass: false, harmony: false },
    a: {
      chords: 'E | B/D# | C#m7 | G#m7 | Amaj7 | E/G# | F#m7 | B7sus4 B7',
      melody: [
        '. B4 E5 F#5 G#5 - E5 -',
        '. B4 D#5 E5 F#5 - D#5 -',
        '. C#5 E5 F#5 G#5 - B5 -',
        'B5 - - - G#5 - . .',
        '. A4 C#5 E5 G#5 - E5 -',
        '. G#4 B4 E5 F#5 - E5 -',
        'A5 - - - F#5 - C#5 -',
        'E5 - - - D#5 - - -',
      ].join(' | '),
      drums: 'eight',
      bass: 'root-fifth',
    },
    b: {
      chords: 'Amaj7 | B/A | G#m7 | C#m7 | F#m7 | G#m7 | Amaj7 | B7sus4 B7',
      melody: [
        'C#5 - - E5 - - G#5 -',
        'F#5 - - - D#5 - B4 -',
        'D#5 - - F#5 - - B5 -',
        'G#5 - - - E5 - . .',
        'F#5 - - A5 - - C#6 -',
        'G#5 - - B5 - - D#6 -',
        'A5 - - C#6 - - E6 -',
        'F#6 - - - D#6 - - -',
      ].join(' | '),
      harmony: 'syncopate',
    },
    s: chorus,
    riff,
    lift: { chords: 'C7sus4 C7', melody: 'F6 - - - E6 - C6 -', key: 'F' },
    up: transposed(chorus, 1, 'F'),
    outro: { chords: 'Cmaj7 | B7sus4 B7', melody: 'E5 - - - G5 - B5 - | A5 - - - - - . .' },
  },
  form: ['intro', 'a', 'b', 's', 'riff', 'a', 'b', 'lift', 'up', 'outro'],
  loopFrom: 1,
};
