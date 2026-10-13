import type { SongDef } from '../../domain/music/song.ts';

// A letter from someone who left the island: a verse leaning on the wistful iii, secondary dominants slipping onto IV,
// and a chorus climbing in Ryukyu thirds before a sus4 resolves onto a raised note of longing; the sanshin signs off.
const chorus = {
  chords: 'Cmaj7 | D | Bm7 | Em7 | Cmaj7 | D | B7sus4 B7 | Em7 D7sus4',
  melody: [
    'G5 - B5 - D6 - - -',
    'C6 - - B5 A5 - - -',
    'B5 - D6 - F#6 - - -',
    'E6 - - D6 B5 - - -',
    'G5 - B5 - D6 - - F#6',
    '- - - E6 D6 - - -',
    'E6 - - - D#6 - - -',
    'B5 - - - A5 - - -',
  ].join(' | '),
  lead: 'alt' as const,
  drums: 'eight' as const,
};

export const hibiscusLetter: SongDef = {
  id: 'hibiscus-letter',
  title: 'Hibiscus Letter',
  style: 'island-breeze',
  mood: { valence: 0.1, energy: -0.2 },
  key: 'G',
  bpm: 100,
  sections: {
    intro: {
      chords: 'Cmaj7 | Bm7 | Am7 | D7sus4',
      melody: 'D6 - C6 B5 - G5 B5 - | F#5 - - - - - . . | C6 - B5 G5 - E5 G5 - | A5 - - - - - . .',
      harmony: 'broken',
      bass: 'whole',
      drums: false,
    },
    a: {
      chords: 'Gmaj7 | Bm7 | Cmaj7 | Bm7 | Am7 | Bm7 | Cmaj7 | D7sus4 D7',
      melody: [
        'B4 - - C5 B4 - G4 -',
        'F#4 - - - - - . .',
        'C5 - - D5 C5 - B4 -',
        'B4 - - - - - . .',
        'C5 - - D5 E5 - G5 -',
        'F#5 - - - D5 - - -',
        'E5 - - D5 C5 - B4 -',
        'A4 - - - - - . .',
      ].join(' | '),
      bass: 'half',
    },
    b: {
      chords: 'Am7 | D7 | Bm7 | E7 | Am7 | D7 | Gmaj7 | B7',
      melody: [
        '. . A4 B4 C5 - E5 -',
        'D5 - - - C5 - - -',
        '. . B4 D5 F#5 - A5 -',
        'G#5 - - - - - . .',
        '. . C5 E5 A5 - C6 -',
        'B5 - - - A5 - - -',
        '. . G5 F#5 G5 - B5 -',
        'F#5 - - - - - . .',
      ].join(' | '),
      harmony: 'broken',
      drums: 'half',
    },
    s: chorus,
    s2: {
      ...chorus,
      counter: [
        'E5 - - - - - - -',
        '- - - - F#5 E5 D5 -',
        'D5 - - - - - - -',
        '- - - - G5 F#5 E5 -',
        'E5 - - - - - - A5',
        '- - - - A5 F#5 D5 -',
        'A5 - - - F#5 - - -',
        'G5 - - - - - - -',
      ].join(' | '),
      bass: 'walk',
    },
    outro: {
      chords: 'Cmaj7 | D7sus4 D7',
      melody: 'D6 - - C6 B5 - - - | A5 - - - - - . .',
      harmony: 'broken',
      bass: 'whole',
      drums: false,
    },
  },
  form: ['intro', 'a', 'b', 's', 'intro', 's2', 'outro'],
  loopFrom: 1,
};
