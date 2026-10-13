import { type SongDef, transposed } from '../../domain/music/song.ts';

// The ending theme: a verse that walks the long way down a falling bass, and the dawn motif's last, fullest
// statement over the royal road, sighing on the minor iv, then lifted a whole step like a final look back.
const chorus = {
  chords: 'F69 | G7sus4 G7 | Em7 | Am7 Am7/G | Dm7 | Em7 A7 | F6 Fm6 | C',
  melody: [
    'G5 - - A5 D6 - - -',
    'C6 - B5 - A5 - - -',
    'G5 - - B5 E6 - - -',
    'D6 - C6 - B5 - - -',
    'F5 - - G5 A5 - C6 -',
    'E6 - - - - - C#6 -',
    'D6 - - C6 Ab5 - - -',
    'G5 - - - - - . .',
  ].join(' | '),
  counter: [
    'A4 - - - . F5 E5 D5',
    'C5 - - - B4 - - -',
    'G4 - - - . B4 C5 D5',
    'E5 - - - D5 - - -',
    'D5 - - - - - E5 F5',
    'G5 - - - E5 - - -',
    'A4 - - - Ab4 - - -',
    'G4 - - - . . . .',
  ].join(' | '),
  harmony: 'arp16' as const,
  bass: 'ballad' as const,
  drums: 'eight' as const,
};

export const whereTheJourneyEnds: SongDef = {
  id: 'where-the-journey-ends',
  title: 'Where the Journey Ends',
  style: 'credits-roll',
  mood: { valence: 0.2, energy: -0.2 },
  key: 'C',
  bpm: 84,
  sections: {
    intro: {
      chords: 'F6 Fm6 | C',
      melody: 'D6 - - C6 Ab5 - - - | G5 - - - - - . .',
      drums: false,
      bass: 'whole',
    },
    a: {
      chords: 'C | G/B | Am7 | Em7/G | Fmaj7 | C/E | Dm7 | G7sus4 G7',
      melody: [
        'C5 - - D5 G5 - - -',
        'F5 - E5 - D5 - - -',
        '. C5 B4 C5 E5 - - -',
        'D5 - - - - - . .',
        'A4 - - B4 E5 - - -',
        'D5 - C5 - G4 - - -',
        'F5 - - E5 D5 - A4 -',
        'C5 - - - B4 - - -',
      ].join(' | '),
      drums: false,
      bass: 'whole',
    },
    b: {
      chords: 'Fmaj7 | G/F | Em7 | A7 | Dm7 | E7/G# | Am7 Am7/G | Dm7 G7sus4',
      melody: [
        '. C5 F5 G5 A5 - - -',
        '. D5 G5 A5 B5 - - -',
        '. E5 G5 B5 D6 - - -',
        'C#6 - - - - - A5 -',
        'A5 - - - F5 - D5 -',
        'G#5 - - - E5 - D5 -',
        'C5 - - - E5 - - -',
        'F5 - - - - - . .',
      ].join(' | '),
    },
    s: chorus,
    lift: { chords: 'A7sus4 A7', melody: 'D5 - - - C#5 - E5 G5', key: 'D' },
    up: transposed(chorus, 2, 'D'),
    home: { chords: 'G7sus4 G7', melody: 'G5 - - - F5 - D5 -' },
  },
  form: ['intro', 'a', 'b', 's', 'lift', 'up', 'home'],
  loopFrom: 1,
};
