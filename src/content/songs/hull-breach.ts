import type { SongDef } from '../../domain/music/song.ts';

// Urgent minor flight: held alarm notes broken up by sixteenth-note runs, rising to a long-noted climax.
export const hullBreach: SongDef = {
  id: 'hull-breach',
  title: 'Hull Breach',
  style: 'star-fighter',
  mood: { valence: -0.55, energy: 0.8 },
  key: 'Em',
  bpm: 168,
  steps: 4,
  sections: {
    a: {
      chords: 'Em | Cmaj7 | D | B7 | Em | Cmaj7 | Am7 B7 | Em',
      melody: [
        'E5 - - - B5 - - - A5 B5 A5 G5 F#5 G5 A5 B5',
        'C6 - - - - - - - B5 C6 B5 G5 E5 - G5 -',
        'D6 - - - A5 - - - F#5 G5 A5 F#5 D5 E5 F#5 A5',
        'B5 - - - - - - - A5 - F#5 - D#5 - F#5 -',
        'E5 - - - B5 - - - C6 B5 A5 G5 A5 B5 C6 D6',
        'E6 - - - - - - - D6 E6 D6 C6 B5 - G5 -',
        'C6 - - - A5 B5 C6 E6 D#6 - - - F#6 - - -',
        'E6 - - - - - - - B5 - G5 - B5 C6 D6 E6',
      ].join(' | '),
    },
    b: {
      chords: 'C | D | Bm7 | Em | Am7 | D | Cmaj7 | B7',
      melody: [
        'G6 - - - - - - - - - - - E6 F#6 G6 E6',
        'F#6 - - - - - - - - - - - D6 E6 F#6 D6',
        'D6 - - - - - - - B5 C#6 D6 E6 F#6 - - -',
        'G6 - - - - - - - - - - - . . . .',
        'A6 - - - - - - - G6 - E6 - C6 - E6 -',
        'F#6 - - - - - - - E6 F#6 E6 D6 C6 D6 E6 F#6',
        'G6 - - - - - - - E6 - - - B5 - - -',
        'D#6 - - - F#6 - - - B5 A5 G5 F#5 D#5 F#5 A5 B5',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
