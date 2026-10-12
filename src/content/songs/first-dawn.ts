// Hopeful setting-out theme in dotted quest rhythm; a sunrise bridge glows on borrowed chords.
import type { SongDef } from '../../domain/music/song.ts';

export const firstDawn: SongDef = {
  id: 'first-dawn',
  title: 'First Dawn',
  style: 'pixel-quest',
  mood: { valence: 0.15, energy: 0.6 },
  key: 'G',
  bpm: 148,
  sections: {
    a: {
      chords: 'G | Em | C | D | G | Em | A7 | D',
      melody: [
        'B4 - - D5 G5 - - F#5',
        'E5 - - G5 B5 - - A5',
        'G5 - E5 - C5 - E5 G5',
        'A5 - - - F#5 - D5 -',
        'B4 - - D5 G5 - - A5',
        'B5 - - A5 G5 - - E5',
        'C#5 - - E5 A5 - - G5',
        'F#5 - - - - - . .',
      ].join(' | '),
    },
    b: {
      chords: 'C | D | Bm7 | Em7 | Am7 | D | C D | G',
      melody: [
        'E5 - G5 - C6 - - B5',
        'A5 - - - - - F#5 -',
        'D5 - F#5 - B5 - - A5',
        'G5 - - - - - . .',
        'C6 - - B5 A5 - E5 -',
        'F#5 - - G5 A5 - D6 -',
        'E6 - - D6 A5 - F#5 -',
        'G5 - - - - - . .',
      ].join(' | '),
      counter: [
        'C5 - - - E5 - - -',
        'F#5 - - - D5 - - -',
        'B4 - - - D5 - - -',
        'E5 - - - D5 - - -',
        'E5 - - - C5 - - -',
        'D5 - - - F#5 - - -',
        'G5 - - - D5 - - -',
        'B4 - - - - - . .',
      ].join(' | '),
    },
    c: {
      chords: 'Ebmaj7 | F | Cm | D7sus4 D7',
      melody: 'G5 - - - - - Bb5 - | A5 - - - - - C6 - | Eb6 - - - - - C6 - | A5 - - - F#5 - D5 -',
      harmony: 'pad',
      drums: 'half',
    },
  },
  form: ['a', 'b', 'c'],
};
