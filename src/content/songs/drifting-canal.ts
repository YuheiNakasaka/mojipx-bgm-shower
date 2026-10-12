// Slow boat on still water: a lazy line decorated with quick sixteenth-note turns around its long notes.
import type { SongDef } from '../../domain/music/song.ts';

export const driftingCanal: SongDef = {
  id: 'drifting-canal',
  title: 'Drifting Canal',
  style: 'lofi-loop',
  mood: { valence: 0.1, energy: -0.6 },
  key: 'Bb',
  bpm: 82,
  steps: 4,
  sections: {
    a: {
      chords: 'Bbmaj7 | Dm7 | Ebmaj7 | F7 | Bbmaj7 | Gm7 | Cm7 | F7',
      melody: [
        'F5 - - - - - G5 F5 Eb5 F5 - - D5 - - -',
        'A4 - - - - - Bb4 A4 G4 A4 - - F4 - - -',
        'G4 - - - Bb4 - - - D5 - - - - - Eb5 D5',
        'C5 - - - - - D5 C5 A4 - - - . . . .',
        'D5 - - - F5 - - - A5 - - - G5 F5 G5 A5',
        'Bb5 - - - - - - - A5 - G5 - F5 - - -',
        'Eb5 - - - - - F5 Eb5 D5 Eb5 - - C5 - - -',
        'A4 - - - Bb4 A4 G4 A4 - - - - C5 - - -',
      ].join(' | '),
    },
    b: {
      chords: 'Ebmaj7 | F | Dm7 | Gm7 | Ebmaj7 | F | Cm7 | F7sus4 F7',
      melody: [
        'G5 - - - - - - - F5 G5 Bb5 - - - - -',
        'A5 - - - - - - - C6 - - - - - Bb5 A5',
        '- - - - - - - - F5 - - - D5 - - -',
        'G5 - - - - - A5 G5 F5 G5 - - D5 - - -',
        'Bb5 - - - - - - - G5 - - - Bb5 C6 D6 -',
        'C6 - - - - - - - - - D6 C6 A5 - - -',
        'G5 - - - - - - - F5 Eb5 D5 Eb5 C5 - - -',
        'Bb4 - - - - - - - A4 - - - - - - -',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
