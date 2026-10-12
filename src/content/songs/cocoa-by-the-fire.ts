// Warm and homely: an easy singing line by the fireside, a borrowed minor chord for a moment of wistfulness, and a soft second voice.
import type { SongDef } from '../../domain/music/song.ts';

export const cocoaByTheFire: SongDef = {
  id: 'cocoa-by-the-fire',
  title: 'Cocoa by the Fire',
  style: 'snowfall',
  mood: { valence: 0.6, energy: -0.7 },
  key: 'G',
  bpm: 92,
  sections: {
    intro: {
      chords: 'Cmaj7 | Am7 D7',
      melody: 'G4 - B4 - E5 - - - | D5 - - C5 A4 - - -',
      drums: false,
    },
    a: {
      chords: 'G | Bm7 | Cmaj7 | D7 | G | E7 | Am7 D7 | G',
      melody: [
        'B4 - D5 - G5 - - A5',
        'F#5 - - - E5 - D5 -',
        'C5 - E5 - G5 - - A5',
        'F#5 - - E5 D5 - - .',
        'B4 - D5 - G5 - - A5',
        'G#5 - - - B5 - - -',
        'C6 - - B5 A5 - F#5 -',
        'G5 - - - - - . .',
      ].join(' | '),
    },
    b: {
      chords: 'Cmaj7 | D | Bm7 | Em7 | Cmaj7 | Cm6 | G/B Am7 | D7sus4 D7',
      melody: [
        '. E5 G5 - B5 - - -',
        'A5 - - G5 F#5 - - -',
        '. D5 F#5 - A5 - - -',
        'G5 - - F#5 E5 - - -',
        '. G5 B5 - D6 - - -',
        'C6 - - - G5 - Eb5 -',
        'D5 - - G5 E5 - - C5',
        '- - D5 - F#5 - - -',
      ].join(' | '),
      counter: [
        'G4 - - - B4 - - -',
        'D5 - - - A4 - - -',
        'B4 - - - F#4 - - -',
        'E4 - - - G4 - - -',
        'C5 - - - B4 - - -',
        'A4 - - - G4 - - -',
        'B4 - - - A4 - - -',
        'G4 - - - A4 - - -',
      ].join(' | '),
    },
  },
  form: ['intro', 'a', 'b'],
  loopFrom: 1,
};
