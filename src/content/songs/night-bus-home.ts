// A late ride home as the credits roll: long singing lines, a bittersweet borrowed chord, a soft line of guide tones underneath.
import type { SongDef } from '../../domain/music/song.ts';

export const nightBusHome: SongDef = {
  id: 'night-bus-home',
  title: 'Night Bus Home',
  style: 'credits-roll',
  mood: { valence: -0.15, energy: -0.05 },
  key: 'G',
  bpm: 90,
  sections: {
    intro: {
      chords: 'Cmaj7 | D7sus4',
      melody: 'E5 - - - G5 - - - | A5 - - - - - . .',
      drums: false,
    },
    a: {
      chords: 'Gmaj7 | Bm7 E7 | Am7 | D7 | Gmaj7 | Bm7 E7 | Am7 D7 | G',
      melody: [
        'B5 - - - A5 - G5 -',
        'F#5 - - - G#5 - B5 -',
        'C6 - - - B5 A5 E5 -',
        'F#5 - A5 - C6 - B5 A5',
        'B5 - - - A5 - G5 -',
        'D6 - - - B5 - G#5 -',
        'A5 - C6 B5 A5 - F#5 -',
        'G5 - - - - . B5 D6',
      ].join(' | '),
    },
    b: {
      chords: 'Cmaj7 | D | Bm7 | Em7 | Am7 | F | Cmaj7 | D7sus4 D7',
      melody: [
        'E6 - - - D6 - B5 -',
        'A5 - - - - - F#5 A5',
        'D6 - - - B5 - A5 -',
        'G5 - - - - - E5 G5',
        'C6 - - - E6 - D6 C6',
        'C6 - - - A5 - F5 -',
        'G5 - - - E5 - G5 -',
        'A5 - - - C6 - - -',
      ].join(' | '),
      counter: [
        'G4 - - - B4 - - -',
        'A4 - - - D5 - - -',
        'D5 - - - F#5 - - -',
        'E5 - - - B4 - - -',
        'E5 - - - C5 - - -',
        'F5 - - - C5 - - -',
        'E5 - - - B4 - - -',
        'G4 - - - F#4 - - -',
      ].join(' | '),
    },
  },
  form: ['intro', 'a', 'b'],
  loopFrom: 1,
};
