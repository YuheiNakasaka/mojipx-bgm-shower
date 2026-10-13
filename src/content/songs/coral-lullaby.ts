import type { SongDef } from '../../domain/music/song.ts';

// A sanshin lullaby by a coral sea at dusk: Ryukyu-scale phrases over a falling verse bass, a chorus that climbs the
// island scale to its high fa, then sighs through a borrowed minor iv; the last chorus gets a plucked answer.
const chorus = {
  chords: 'Fmaj7 | Em7 | Dm7 | G7sus4 G7 | Fmaj7 | Em7 A7 | Dm7 Fm6 | G7sus4 G7',
  melody: [
    'E5 - G5 B5 - C6 - -',
    'B5 - G5 E5 - - - -',
    'F5 - E5 C5 - - E5 -',
    'G5 - - - - - . .',
    'E5 - G5 B5 - C6 - E6',
    '- - - - C#6 - E6 -',
    'F6 - - - C6 - Ab5 -',
    'G5 - - - - - . .',
  ].join(' | '),
  lead: 'alt' as const,
};

export const coralLullaby: SongDef = {
  id: 'coral-lullaby',
  title: 'Coral Lullaby',
  style: 'island-breeze',
  mood: { valence: 0.65, energy: -0.55 },
  key: 'C',
  bpm: 92,
  sections: {
    intro: {
      chords: 'Cmaj7 | Fmaj7 | Cmaj7 | G7sus4',
      melody: 'E5 F5 G5 - B5 - C6 - | B5 G5 F5 - E5 - - - | C5 E5 F5 G5 - - B5 - | C6 - - - G5 - - -',
      harmony: 'broken',
      bass: 'whole',
      drums: false,
    },
    a: {
      chords: 'C | Em7/B | Am7 | Am7/G | Fmaj7 | C/E | Dm7 | G7sus4 G7',
      melody: [
        '. . G4 C5 E5 E5 - F5',
        'E5 - - - B4 - G4 -',
        '. . G4 C5 E5 E5 - G5',
        'E5 - - - - - . .',
        '. . C5 E5 F5 F5 - G5',
        'G5 - E5 - C5 - - -',
        '. . F5 E5 F5 - E5 C5',
        'C5 - - - B4 - - -',
      ].join(' | '),
      harmony: 'broken',
      bass: 'half',
      drums: false,
    },
    b: {
      chords: 'Dm7 | Em7 | Fmaj7 | G | Am7 | Em7/G | Fmaj7 | G7sus4 G7',
      melody: [
        '. . D5 E5 F5 - - -',
        'G5 - - - E5 - - -',
        '. . E5 F5 G5 - - -',
        'B5 - - - G5 - - -',
        '. . G5 B5 C6 - - -',
        'B5 - - - - - . .',
        '. . A5 G5 F5 - E5 -',
        'F5 - - - - - . .',
      ].join(' | '),
      drums: 'half',
    },
    s: chorus,
    s2: {
      ...chorus,
      counter: [
        'C5 - - - - - E5 -',
        'G4 - - - B4 - - -',
        'A4 - - - - - G4 A4',
        'C5 - - - B4 - D5 F5',
        'A4 - - - C5 - - B4',
        '- - - - A4 - C#5 -',
        'A4 - - - Ab4 - - -',
        'G4 - - - B4 - D5 -',
      ].join(' | '),
      bass: 'walk',
    },
  },
  form: ['intro', 'a', 'b', 's', 'intro', 's2'],
  loopFrom: 1,
};
