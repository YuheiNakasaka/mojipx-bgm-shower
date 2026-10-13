import { type SongDef, transposed } from '../../domain/music/song.ts';

// The fair starts again after a summer shower: the raindrop motif returns as the fireworks, and the chorus's last
// firework hangs over a borrowed minor iv (E falls to E-flat) before a finale a step higher fades on the flat VII.
const sparks = {
  chords: 'Cmaj7 | Bm7 | Am7 | D7sus4 D7',
  melody: ['E5 G5 B5 D6 - - B5 -', 'A5 - - - F#5 - D5 -', 'C5 E5 G5 B5 - - A5 -', 'G5 - - - F#5 - - -'].join(' | '),
};

const chorus = {
  chords: 'Cmaj7 | D | Bm7 | Em7 | Am7 | Bm7 | Cmaj7 Cm6 | G',
  melody: [
    'E6 - - - D6 - B5 D6',
    '- - - - - - A5 B5',
    '- - - - A5 - F#5 -',
    'G5 - - - - - . .',
    '. A5 C6 E6 - G6 - F#6',
    '- - - - D6 - B5 -',
    'E6 - - - Eb6 - - -',
    'D6 - - - - - . .',
  ].join(' | '),
  counter: [
    '. . G5 E5 C5 . . .',
    '. . F#5 D5 A4 . . .',
    '. . D5 B4 F#4 . . .',
    '. . E5 G5 B5 - A5 -',
    'C5 - - - E5 - - -',
    '. . D5 B4 F#4 . . .',
    'G4 - - - A4 - - -',
    'B4 - - - D5 - G5 -',
  ].join(' | '),
};

export const fireworksAfterRain: SongDef = {
  id: 'fireworks-after-rain',
  title: 'Fireworks After Rain',
  style: 'summer-festival',
  mood: { valence: 0.3, energy: 0.1 },
  key: 'G',
  bpm: 116,
  sections: {
    intro: { ...sparks, drums: false, bass: 'whole' },
    a: {
      chords: 'G | D/F# | Em7 | Bm7/D | Cmaj7 | G/B | Am7 | D7sus4 D7',
      melody: [
        '. B4 D5 E5 D5 - B4 -',
        'A4 - - - . . A4 B4',
        '. B4 D5 E5 G5 - E5 -',
        'F#5 - - - . . D5 E5',
        '. E5 G5 B5 - - A5 G5',
        'A5 - - - G5 - D5 -',
        'E5 - - D5 C5 - A4 -',
        'G4 - - - F#4 - . .',
      ].join(' | '),
      harmony: 'skank',
      bass: 'half',
      drums: 'light',
    },
    b: {
      chords: 'Am7 | Bm7 | Cmaj7 | D | Am7 | Bm7 | Cmaj7 | D7sus4 D7',
      melody: [
        'A4 - - C5 - - E5 -',
        'D5 - - - - - . .',
        'C5 - - E5 - - G5 -',
        'F#5 - - - - - . .',
        'E5 - - A5 - - C6 -',
        'B5 - - - - - A5 B5',
        '- - - - A5 - G5 -',
        'A5 - - - - - B5 C6',
      ].join(' | '),
    },
    s: chorus,
    hanabi: {
      ...sparks,
      counter: ['. . . . B5 - G5 -', 'F#5 - - - D5 - B4 -', '. . . . G5 - E5 -', 'D5 - - - C5 - A4 -'].join(' | '),
    },
    b2: {
      chords: 'Am7 | Bm7 | Cmaj7 | D',
      melody: ['E5 - - A5 - - C6 -', 'B5 - - - - - A5 B5', '- - - - C6 - D6 -', 'E6 - - - D6 - - -'].join(' | '),
      harmony: 'pulse',
    },
    lift: { chords: 'E7sus4 E7', melody: 'A5 - - - G#5 - B5 -', key: 'A' },
    up: transposed(chorus, 2, 'A'),
    outro: {
      chords: 'Fmaj7 | D7sus4 D7',
      melody: 'E6 - - - - - - - | D6 - - C6 A5 - F#5 -',
      harmony: 'pad',
      bass: 'whole',
      drums: false,
    },
  },
  form: ['intro', 'a', 'b', 's', 'hanabi', 'b2', 'lift', 'up', 'outro'],
  loopFrom: 1,
};
