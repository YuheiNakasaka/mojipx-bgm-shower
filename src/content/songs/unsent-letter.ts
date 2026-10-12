// A bittersweet minor ballad that keeps almost saying it, then lifts twice through the flat sixth and seventh to a held high note.
import type { SongDef } from '../../domain/music/song.ts';

export const unsentLetter: SongDef = {
  id: 'unsent-letter',
  title: 'Unsent Letter',
  style: 'credits-roll',
  mood: { valence: -0.65, energy: -0.5 },
  key: 'Cm',
  bpm: 80,
  sections: {
    intro: {
      chords: 'Abmaj7 | Gsus4 G',
      melody: 'Eb5 - - - G5 - Bb5 - | C6 - - - B5 - . .',
      drums: false,
    },
    a: {
      chords: 'Cm | Cm/Bb | Abmaj7 | G7 | Fm7 | Bb7 | Ebmaj7 | Gsus4 G',
      melody: [
        'G5 - - - Eb5 - F5 G5',
        'Bb5 - - - . . G5 -',
        'C6 - - - - - Bb5 Ab5',
        'G5 - - - B5 - D6 -',
        'C6 - - - Ab5 - Bb5 C6',
        'D6 - - - C6 - Bb5 .',
        'G5 - - - Bb5 - D6 -',
        'C6 - - - B5 - . .',
      ].join(' | '),
    },
    b: {
      chords: 'Abmaj7 | Bb | Cm | Gm7 | Abmaj7 | Bb | Cm | G7sus4 G7',
      melody: [
        'C6 - - - - - Ab5 Bb5',
        'D6 - - - - - Bb5 C6',
        'Eb6 - - - - - D6 C6',
        'D6 - - - Bb5 - C6 D6',
        'Eb6 - - - - - C6 -',
        'F6 - - - - - D6 -',
        'G6 - - - - - . .',
        'F6 - - - D6 - B5 -',
      ].join(' | '),
      counter: [
        'Eb5 - - - - - - -',
        'F5 - - - - - - -',
        'G5 - - - - - - -',
        'F5 - - - - - - -',
        'Eb5 - - - - - - -',
        'D5 - - - - - - -',
        'Eb5 - - - - - - -',
        'D5 - - - B4 - - -',
      ].join(' | '),
    },
  },
  form: ['intro', 'a', 'b'],
  loopFrom: 1,
};
