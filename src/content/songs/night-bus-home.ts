// A late ride home as the credits roll, in the ending-theme form A–B–A–B–C: the old window-gazing verse sung low,
// a climb that sours for a bar on the minor iv, and a peak over the borrowed flat seven that leaps up and steps back down.
import type { SongDef } from '../../domain/music/song.ts';

const bell = { chords: 'Cmaj7 | D7sus4', melody: 'E5 - - - G5 - - - | A5 - - - - - . .', drums: false as const };

const verse = [
  'B4 - - - A4 - G4 -',
  'F#4 - - - G#4 - B4 -',
  'C5 - - - B4 A4 E4 -',
  'F#4 - A4 - C5 - B4 A4',
  'B4 - - - A4 - G4 -',
  'D5 - - - B4 - G#4 -',
  'A4 - C5 B4 A4 - F#4 -',
  'G4 - - - - . B4 D5',
];

export const nightBusHome: SongDef = {
  id: 'night-bus-home',
  title: 'Night Bus Home',
  style: 'credits-roll',
  mood: { valence: -0.15, energy: -0.05 },
  key: 'G',
  bpm: 88,
  sections: {
    intro: bell,
    a: { chords: 'Gmaj7 | Bm7 E7 | Am7 | D7 | Gmaj7 | Bm7 E7 | Am7 D7 | G', melody: verse.join(' | '), bass: 'whole' },
    b: {
      chords: 'Em7 | Bm7 | Cmaj7 | D7sus4 D7',
      melody: 'D5 - - - E5 - G5 - | F#5 - - - A5 - B5 - | G5 - - - B5 - C6 - | D6 - - - C6 - A5 -',
    },
    a2: {
      chords: 'Gmaj7 | Bm7 E7 | Am7 | D7',
      melody: verse.slice(0, 4).join(' | '),
      counter: 'D4 - - - - - - - | D4 - - - D4 - - - | C4 - - - E4 - - - | C4 - - - A3 - - -',
    },
    b2: {
      chords: 'Em7 | Bm7 | Cmaj7 Cm6 | D7sus4 D7',
      melody: 'G5 - - - A5 - B5 - | A5 - - - B5 - D6 - | E6 - - - Eb6 - - - | D6 - - - C6 - - -',
    },
    c: {
      chords: 'Cmaj7 | D | Bm7 | Em7 | Am7 | F | Cmaj7 | D7sus4 D7',
      melody: [
        'E6 - - - D6 - B5 -',
        'A5 - - - - - F#5 A5',
        'D6 - - - B5 - A5 -',
        'G5 - - - - - E5 G5',
        'C6 - - - E6 - G6 -',
        'F6 - - - - - C6 -',
        'E6 - - - - - D6 C6',
        'D6 - - - C6 - A5 -',
      ].join(' | '),
      counter: [
        'G4 - - - B4 - - -',
        'F#4 - - - A4 - - -',
        'F#4 - - - D5 - - -',
        'B4 - - - - - - -',
        'E5 - - - C5 - - -',
        'A4 - - - C5 - - -',
        'G4 - - - - - - -',
        'G4 - - - F#4 - - -',
      ].join(' | '),
      bass: 'ballad',
      drums: 'half',
    },
    tag: bell,
  },
  form: ['intro', 'a', 'b', 'a2', 'b2', 'c', 'tag'],
  loopFrom: 1,
};
