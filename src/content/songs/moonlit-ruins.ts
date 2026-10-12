// Pale bells over old stones: a modal minor sway with a raised sixth, a soft half-time pulse and a darker turn in the second half.
import type { SongDef } from '../../domain/music/song.ts';

export const moonlitRuins: SongDef = {
  id: 'moonlit-ruins',
  title: 'Moonlit Ruins',
  style: 'starlit-dream',
  mood: { valence: -0.6, energy: -0.1 },
  key: 'Dm',
  bpm: 84,
  sections: {
    a: {
      chords: 'Dm | G/D | Bbmaj7 | Asus4 A | Dm | G/D | Gm7 | A7',
      melody: [
        'A5 - - D6 - - C6 A5',
        'B5 - - - G5 - - -',
        'F5 - - - A5 - G5 F5',
        'E5 - D5 - C#5 - . .',
        'A5 - - D6 - - E6 F6',
        'E6 - - - D6 - B5 -',
        'Bb5 - - - A5 - G5 F5',
        'E5 - - - - - . .',
      ].join(' | '),
    },
    b: {
      chords: 'Bbmaj7 | Am7 | Gm7 | Dm | Ebmaj7 | Gm7 | Asus4 | A7',
      melody: [
        'F5 - A5 - D6 - - -',
        'E6 - - - D6 - C6 -',
        'D6 - - - Bb5 - G5 -',
        'A5 - - - F5 - . .',
        'Bb5 - - - D6 - Eb6 -',
        'F6 - - - - - D6 -',
        'E6 - - - D6 - - -',
        'C#6 - - - - - . .',
      ].join(' | '),
      counter: [
        'D4 - - - - - - -',
        'G4 - - - - - - -',
        'F4 - - - - - - -',
        '- - - - - - - -',
        'G4 - - - - - - -',
        'F4 - - - - - - -',
        'D4 - - - - - - -',
        'C#4 - - - - - - -',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
  parts: { drums: 'half' },
};
