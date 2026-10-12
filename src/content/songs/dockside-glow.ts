// Laid-back harbour evening: a sparse melody of long notes over soft maj7 changes, with a counter line answering in the gaps.
import type { SongDef } from '../../domain/music/song.ts';

export const docksideGlow: SongDef = {
  id: 'dockside-glow',
  title: 'Dockside Glow',
  style: 'city-lights',
  mood: { valence: 0.1, energy: -0.55 },
  key: 'D',
  bpm: 100,
  parts: { drums: 'half' },
  sections: {
    a: {
      chords: 'Dmaj7 | Bm9 | Gmaj7 | A7sus4 | F#m7 | Bm7 | Em9 | A7sus4 A7',
      melody: [
        '. . F#5 A5 C#6 - - -',
        'B5 - - - - - . .',
        '. . D5 F#5 A5 - - -',
        'G5 - - - - - E5 -',
        'A5 - - - - - B5 A5',
        'F#5 - - - - - D5 E5',
        'F#5 - - - G5 - B5 -',
        'A5 - - - E5 - - -',
      ].join(' | '),
      counter: [
        'F#4 - - - A4 - - -',
        'D5 - - - . C#5 B4 A4',
        'B4 - - - F#4 - - -',
        'G4 - - - . A4 B4 D5',
        'C#5 - - - E5 - - -',
        'D5 - - - B4 - A4 -',
        'B4 - - - D5 - - -',
        'D5 - - - C#5 - - -',
      ].join(' | '),
    },
    b: {
      chords: 'Gmaj7 | F#m7 | Em9 | Dmaj7 | Gmaj7 | F#m7 B7 | Em9 | A7sus4 A7',
      melody: [
        '. . G5 B5 D6 - - -',
        'C#6 - - - - - A5 B5',
        'B5 - - - F#5 - G5 A5',
        'A5 - - - - - . .',
        '. . B5 D6 F#6 - - -',
        'E6 - - - D#6 - - -',
        'E6 - - - D6 - B5 -',
        'D6 - - - C#6 - - -',
      ].join(' | '),
      counter: [
        'D5 - - - B4 - - -',
        'A4 - - - . C#5 E5 F#5',
        'G5 - - - D5 - - -',
        'F#5 - - - E5 - C#5 A4',
        'B4 - - - D5 - - -',
        'A4 - - - B4 - A4 -',
        'G4 - - - B4 - - -',
        'A4 - - - G4 - - -',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
