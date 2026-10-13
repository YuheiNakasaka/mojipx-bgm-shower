// Fizzy Shibuya-style bossa under a bright sky: an AABA tune that keeps leaping up to a major seventh or ninth on the
// offbeat, a minor iv that clouds it for a bar, and a bridge that drifts up a chromatic mediant into F before the last A.
import type { SongDef } from '../../domain/music/song.ts';

const A_CHORDS = 'Dmaj7 | Em7 A7 | Dmaj7 | Am7 D7 | Gmaj7 | Gm6 | F#m7 B7';

const tune = [
  '. D5 - F#5 - C#6 - -',
  'B5 - - . A5 G5 E5 -',
  '. D5 - F#5 - E6 - -',
  'D6 - - . C6 A5 F#5 -',
  '. G5 - B5 - F#6 - -',
  'E6 - - . D6 Bb5 G5 -',
  '. A5 - C#6 - D#6 - -',
  'E6 - - . C#6 - A5 -',
];

const riff = {
  chords: 'Dmaj7 | Bm7 | Em9 | A13',
  melody: 'C#6 - A5 . F#5 - E5 F#5 | D6 - B5 . F#5 - E5 F#5 | E6 - B5 . G5 - F#5 G5 | F#6 - - - E6 - C#6 -',
};

export const lemonSodaSky: SongDef = {
  id: 'lemon-soda-sky',
  title: 'Lemon Soda Sky',
  style: 'bossa-cafe',
  mood: { valence: 0.7, energy: 0 },
  key: 'D',
  bpm: 116,
  sections: {
    intro: { ...riff, drums: false },
    a: { chords: `${A_CHORDS} | Em7 A7`, melody: tune.join(' | ') },
    a2: { chords: `${A_CHORDS} | Gm7 C7`, melody: [...tune.slice(0, 7), 'D6 - - . C6 - Bb5 G5'].join(' | ') },
    b: {
      chords: 'Fmaj7 | Dm7 | Gm7 | C7 | Am7 | Dm7 | Bbmaj7 | A7sus4 A7',
      melody: [
        'E6 - - - - - C6 -',
        'D6 - - - A5 - - -',
        'D6 - - - - - Bb5 -',
        'A5 - - - G5 - - -',
        'C6 - - - - - A5 -',
        'F6 - - - E6 - D6 -',
        'F6 - - - - - E6 -',
        'D6 - - - C#6 - - -',
      ].join(' | '),
      key: 'F',
      bass: 'half',
      harmony: 'arp-up',
    },
    a3: {
      chords: `${A_CHORDS} | Em7 A7`,
      melody: [...tune.slice(0, 6), '. A5 - C#6 - F#6 - -', 'E6 - - . G6 - C#6 -'].join(' | '),
      counter: [
        'A4 - - - - - - -',
        'G4 - - B4 C#5 - - -',
        'A4 - - - - - - -',
        'C5 - - E5 F#5 - - -',
        'D5 - - - - - - -',
        'Bb4 - - D5 E5 - - -',
        'C#5 - - - B4 - - -',
        'G4 - - B4 A4 - - -',
      ].join(' | '),
      lead: 'alt',
    },
    tag: riff,
  },
  form: ['intro', 'a', 'a2', 'b', 'a3', 'tag'],
  loopFrom: 1,
};
