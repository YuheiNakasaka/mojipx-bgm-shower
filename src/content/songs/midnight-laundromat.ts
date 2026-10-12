// Lazy ninth-chord loop at night: every phrase leans in late, on the off-beat, and drifts around the ii–V–I.
import type { SongDef } from '../../domain/music/song.ts';

export const midnightLaundromat: SongDef = {
  id: 'midnight-laundromat',
  title: 'Midnight Laundromat',
  style: 'lofi-loop',
  mood: { valence: 0.05, energy: -0.7 },
  key: 'F',
  bpm: 76,
  sections: {
    a: {
      chords: 'Fmaj9 | Dm9 | Gm9 | C9 | Fmaj9 | Dm9 | Gm9 | C9',
      melody: [
        '. C5 - E5 - - G5 -',
        '- - F5 - E5 - . .',
        '. D5 - F5 - - A5 -',
        '- - G5 - E5 - D5 -',
        '. G5 - A5 - - C6 -',
        '- - A5 - G5 - F5 -',
        '. Bb5 - G5 - D5 - C5',
        '- - . E5 - - G5 -',
      ].join(' | '),
    },
    b: {
      chords: 'Bbmaj9 | Am7 | Gm9 | Fmaj9 | Bbmaj9 | Am7 D7 | Gm9 | C9',
      melody: [
        '. D6 - - - - C6 -',
        '- - . A5 - - G5 -',
        '- - . Bb5 - - A5 -',
        '- - . G5 - - F5 -',
        '- - . A5 - C6 - D6',
        '- - E6 - - - D6 -',
        '- - . Bb5 - - A5 -',
        '- - . G5 - E5 D5 -',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
