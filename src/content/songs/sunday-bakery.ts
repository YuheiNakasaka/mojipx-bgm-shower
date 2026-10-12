import type { SongDef } from '../../domain/music/song.ts';

export const sundayBakery: SongDef = {
  id: 'sunday-bakery',
  title: 'Sunday Bakery',
  style: 'cozy-village',
  mood: { valence: 0.68, energy: -0.5 },
  key: 'F',
  bpm: 104,
  sections: {
    intro: {
      chords: 'Fmaj7 | C7',
      melody: 'A4 - C5 - F5 - A5 - | G5 - E5 - C5 - - -',
      drums: false,
    },
    a: {
      chords: 'Fmaj7 | Dm7 | Gm7 | C7 | Am7 | Dm7 | Gm7 C7 | Fmaj7',
      melody: [
        'C5 . A4 C5 F5 - E5 .',
        'D5 - C5 - A4 - . .',
        'Bb4 . D5 F5 G5 - F5 .',
        'E5 - - - . . G4 A4',
        'C5 . A4 C5 E5 - D5 .',
        'F5 - E5 - D5 - C5 -',
        'Bb4 - D5 - E5 - G5 -',
        'F5 - - - - - . .',
      ].join(' | '),
    },
    b: {
      chords: 'Bbmaj7 | Am7 | Gm7 | C7 | Bbmaj7 | A7 | Dm7 G7 | Gm7 C7',
      melody: [
        'D5 . F5 D5 A5 - G5 .',
        'E5 - - - C5 . A4 .',
        'Bb4 . D5 F5 A5 - G5 .',
        'E5 - D5 - C5 - Bb4 -',
        'A4 . Bb4 D5 F5 - D5 .',
        'E5 - C#5 - A4 - G4 -',
        'F5 - E5 D5 B4 - D5 -',
        'G5 - F5 - E5 - C5 -',
      ].join(' | '),
      counter: [
        'F4 - - - A4 - - -',
        'G4 - - - E4 - - -',
        'F4 - - - D4 - - -',
        'E4 - - - Bb4 - - -',
        'D4 - - - F4 - - -',
        'C#4 - - - G4 - - -',
        'F4 - - - - - - -',
        'Bb4 - - - Bb4 - - -',
      ].join(' | '),
    },
  },
  form: ['intro', 'a', 'b'],
  loopFrom: 1,
};
