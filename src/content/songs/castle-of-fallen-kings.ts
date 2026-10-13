import type { SongDef } from '../../domain/music/song.ts';

// A throne room in ruins: the dawn motif sinks through D harmonic minor in falling sequence, an echo answers it
// from the empty hall, the old kingdom's march returns in major and caves in on the minor iv.
const motif = [
  'D5 - - E5 A5 - - -',
  'G5 - F5 - E5 - - -',
  'C5 - - D5 G5 - - -',
  'F5 - E5 - D5 - - -',
  'Bb4 - - C5 F5 - - -',
  'E5 - D5 - C#5 - - -',
];
const motifChords = 'Dm | Gm A7 | C | F Gm | Bbmaj7 | Gm6 A7';

export const castleOfFallenKings: SongDef = {
  id: 'castle-of-fallen-kings',
  title: 'Castle of Fallen Kings',
  style: 'pixel-quest',
  mood: { valence: -0.5, energy: 0.1 },
  key: 'Dm',
  bpm: 96,
  sections: {
    intro: {
      chords: 'Dm | Bb | Gm6 | A7',
      melody: 'A4 . A4 A4 D5 - - - | D5 . D5 D5 F5 - - - | E5 . E5 E5 G5 - - - | E5 - - - - - . .',
      harmony: 'pad',
      bass: 'whole',
      drums: false,
    },
    a: {
      chords: `${motifChords} | Dm Bbmaj7 | A7sus4 A7`,
      melody: [...motif, 'D5 - - - . . F5 E5', 'D5 - - - C#5 - - -'].join(' | '),
      drums: 'half',
      bass: 'whole',
    },
    a2: {
      chords: `${motifChords} | Gm7 C7 | F`,
      melody: [...motif, 'D5 - - - E5 - G5 -', 'F5 - - - - - . .'].join(' | '),
      counter: [
        '. . . . D4 E4 A4 -',
        '. . . . G4 F4 E4 -',
        '. . . . C4 D4 G4 -',
        '. . . . F4 E4 D4 -',
        '. . . . Bb3 C4 F4 -',
        '. . . . E4 D4 C#4 -',
        '. . . . D4 - E4 -',
        '. . . . F4 - - -',
      ].join(' | '),
      drums: 'half',
      bass: 'half',
    },
    b: {
      chords: 'F | Bb C | Am7 Dm7 | Gm7 C7 | F F/A | Bb Bbm6 | Gm6 | A7sus4 A7',
      melody: [
        'F5 - - G5 C6 - - -',
        'Bb5 - A5 - G5 - - -',
        'E5 - - G5 A5 - - -',
        'D6 - C6 - Bb5 - - -',
        'A5 - - Bb5 C6 - F6 -',
        'D6 - - - Db6 - - -',
        'Bb5 - - A5 G5 - E5 -',
        'E5 - - - C#5 - - -',
      ].join(' | '),
      counter: [
        'C5 - - - A4 - - -',
        'D5 - - - E5 - - -',
        'C5 - - - D5 - - -',
        'Bb4 - - - E5 - - -',
        'C5 - - - C5 - - -',
        'F5 - - - - - - -',
        'D5 - - - Bb4 - - -',
        'A4 - - - - - - -',
      ].join(' | '),
    },
    a3: {
      chords: `${motifChords} | Dm DmM7/C# | Dm7/C Dm6/B | Bbmaj7 | A7sus4 A7`,
      melody: [...motif, 'D5 - - - - - - -', '. . A4 - F5 - D5 -', 'F5 - - - D5 - C5 -', 'D5 - - - C#5 - - -'].join(' | '),
      counter: [
        'F5 - - - - - - -',
        'D5 - - - C#5 - - -',
        'E5 - - - - - - -',
        'C5 - - - Bb4 - - -',
        'D5 - - - - - - -',
        'Bb4 - - - A4 - - -',
        'A4 - - - - - - -',
        'C5 - - - B4 - - -',
        'Bb4 - - - A4 - - -',
        'A4 - - - - - - -',
      ].join(' | '),
      bass: 'half',
    },
  },
  form: ['intro', 'a', 'a2', 'b', 'a3'],
  loopFrom: 1,
};
