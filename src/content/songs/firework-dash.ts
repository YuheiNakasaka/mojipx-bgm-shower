// Festival sprint: a flute call over taiko, a five-note pentatonic verse, arpeggios climbing to a bouncing chorus,
// a call-and-response drum break, and the chorus again a whole step up like the last rocket of the night.
import { type SongDef, transposed } from '../../domain/music/song.ts';

const chorus = {
  chords: 'G | A | F#m7 | Bm7 | G | A | Bm7 Em7 | Asus4 A',
  melody: [
    'B5 - D6 B5 E6 - D6 -',
    'E6 - - - A5 - B5 -',
    'C#6 - - A5 F#5 - A5 -',
    'B5 - - - - - . .',
    'B5 - D6 B5 E6 - F#6 -',
    'E6 - - - - - F#6 E6',
    'D6 - B5 A5 B5 - D6 -',
    'E6 - D6 - C#6 - A5 -',
  ].join(' | '),
  counter: [
    'G4 - - - B4 - - -',
    'C#5 - - - E5 - - -',
    'A4 - - - C#5 - - -',
    'D5 - - - . F#5 E5 D5',
    'G4 - - - B4 - - -',
    'C#5 - - - E5 - - -',
    'F#4 - - - G4 - - -',
    'A4 - - - E5 - - -',
  ].join(' | '),
  bass: 'octave' as const,
};

const climb = {
  chords: 'Em7 | F#m7 | G | A',
  melody: 'E5 - G5 - B5 - G5 - | F#5 - A5 - C#6 - A5 - | G5 - B5 - D6 - B5 - | A5 - C#6 - E6 - - -',
  counter: 'B4 - - - - - - - | C#5 - - - - - - - | D5 - - - - - - - | E5 - - - C#5 - - -',
  harmony: 'offbeat' as const,
  drums: 'march' as const,
};

export const fireworkDash: SongDef = {
  id: 'firework-dash',
  title: 'Firework Dash',
  style: 'summer-festival',
  mood: { valence: 0.65, energy: 0.7 },
  key: 'D',
  bpm: 140,
  sections: {
    intro: {
      chords: 'D | D | Bm7 | Asus4 A',
      melody: 'D6 - - E6 D6 B5 A5 - | B5 - A5 F#5 A5 - - - | D6 - - E6 D6 B5 A5 B5 | D6 - - - C#6 - . .',
      harmony: false,
      bass: false,
    },
    a: {
      chords: 'D | Bm7 | G | Asus4 A | D | Bm7 | Em7 Asus4 | D',
      melody: [
        'D5 . D5 E5 F#5 - A5 -',
        'B5 - A5 F#5 E5 - F#5 -',
        'B4 . B4 D5 E5 - D5 B4',
        'A4 - D5 - C#5 - - -',
        'D5 . D5 E5 F#5 - A5 -',
        'B5 - A5 B5 D6 - B5 -',
        'A5 - G5 E5 D5 - E5 -',
        'F#5 - E5 - D5 - - -',
      ].join(' | '),
      harmony: 'skank',
      bass: 'half',
    },
    b: climb,
    s: chorus,
    brk: {
      chords: 'D | D | Bm7 | Asus4 A',
      melody: 'A5 B5 D6 - . . . . | E6 D6 B5 A5 . . . . | D6 E6 F#6 - . . . . | E6 - D6 - C#6 - . .',
      counter: '. . . . F#4 A4 D5 - | . . . . E5 D5 B4 A4 | . . . . D5 E5 F#5 - | A4 - - - A4 - . .',
      harmony: false,
      bass: 'pedal',
    },
    lift: { chords: 'B7sus4 B7', melody: 'A5 - B5 - D#6 - F#6 -', key: 'E' },
    up: transposed(chorus, 2, 'E'),
    outro: { chords: 'G | Asus4 A', melody: 'B5 - - - G5 - B5 - | D6 - - - C#6 - . .', bass: 'half' },
  },
  form: ['intro', 'a', 'b', 's', 'brk', 'b', 's', 'lift', 'up', 'outro'],
  loopFrom: 1,
};
