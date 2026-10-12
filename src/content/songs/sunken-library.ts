// Slow drips under stone: each phrase is answered a bar later by a fainter voice, sinking through a lament bass.
import type { SongDef } from '../../domain/music/song.ts';

export const sunkenLibrary: SongDef = {
  id: 'sunken-library',
  title: 'Sunken Library',
  style: 'deep-dungeon',
  mood: { valence: -0.7, energy: -0.05 },
  key: 'Am',
  bpm: 92,
  sections: {
    a: {
      chords: 'Am | Am/G | Fmaj7 | Dm7 | Bm7b5 | E7 | Am | Am',
      melody: [
        'E5 - - A5 G5 - E5 .',
        'C5 - - - . . A4 B4',
        'C5 - - F5 E5 - C5 .',
        'A4 - - - . . . E5',
        'F5 - - D5 B4 - A4 .',
        'G#4 - - - . . B4 D5',
        'E5 - D5 C5 B4 - A4 -',
        '- - - - . . D5 E5',
      ].join(' | '),
      counter: [
        '. . . . . . . .',
        'E5 - - A5 G5 - E5 .',
        '. . . . . . . .',
        'C5 - - F5 E5 - C5 .',
        '. . . . . . . .',
        'E5 - - D5 B4 - G#4 .',
        '. . . . . . . .',
        'E5 - D5 C5 B4 - A4 -',
      ].join(' | '),
    },
    b: {
      chords: 'Dm7 | Fmaj7 | G | Em7 | Bbmaj7 | Bm7b5 | E7sus4 | E7',
      melody: [
        'F5 - A5 - C6 - - -',
        '- - - - . . G5 A5',
        'B5 - - D6 C6 B5 G5 .',
        'E5 - - - . . B5 C6',
        'D6 - - - - - A5 -',
        'F5 - - - D5 - B4 -',
        'E5 - - D5 B4 - A4 -',
        'G#4 - - - - - . .',
      ].join(' | '),
      counter: [
        '- - . . . . . .',
        'F5 - A5 - C6 - - -',
        '. . . . . . . .',
        'B5 - - D6 C6 B5 G5 .',
        '. . . . . . . .',
        'D6 - - - - - A5 -',
        '- - . . . . . .',
        'E5 - - D5 B4 - G#4 .',
      ].join(' | '),
    },
  },
  form: ['a', 'b'],
};
