// A dark waltz at a cave's cipher lock: every bar of the theme leans on a ninth or an eleventh and sighs down to the
// chord, over diminished passing chords and an inner line that sinks a step a bar; tumblers tick while the bass climbs
// chromatically, the lock gives and the same sighs glow in B major until a borrowed minor iv dims them, then a single
// pin ticks on B as the minor closes back in and the theme returns, climbing higher.
import type { SongDef } from '../../domain/music/song.ts';

const themeChords = 'Bm | Bm/A | G A#dim7 | Bm/F# | D D#dim7 | Em | C#m7b5 F#7';

const theme = ['C#6 - - - B5 F#5', 'E6 - - - D6 A5', 'A5 - - - G5 E5', 'F#5 - - - - -'];

const innerLine = ['D5 - - - - -', 'C#5 - - - - -', 'B4 - - - C#5 -', 'B4 - - - - -', 'A4 - - - A4 -', 'G4 - - - - -', 'G4 - - - F#4 -'];

const tick = (bars: number): string => Array.from({ length: bars }, () => 'B4 . B4 . B4 .').join(' | ');

export const cipherCave: SongDef = {
  id: 'cipher-cave',
  title: 'Cipher Cave',
  style: 'deep-dungeon',
  mood: { valence: -0.75, energy: 0.15 },
  key: 'Bm',
  bpm: 100,
  meter: 3,
  sections: {
    intro: {
      chords: 'Bm | Bm/A | G A#dim7 | F#7',
      melody: '. . . . . . | . . . . . . | . . . . . . | . . . . . .',
      counter: tick(4),
      drums: false,
      bass: 'whole',
    },
    a: {
      chords: `${themeChords} | Bm`,
      melody: [...theme, 'E6 - - - D6 C6', 'F#6 - - - E6 B5', 'E6 - - - C#6 A#5', 'B5 - - - - .'].join(' | '),
    },
    a2: {
      chords: `${themeChords} | Bm`,
      melody: [...theme, 'E6 - - - D6 C6', 'F#6 - - - E6 B5', 'E6 - - - C#6 A#5', 'B5 - - - - .'].join(' | '),
      counter: [...innerLine, 'F#4 - - - - -'].join(' | '),
    },
    b: {
      chords: 'G | G#dim7 | A | A#dim7 | Bm | Em7 C#m7b5 | F#7sus4 | F#7',
      melody: [
        'A5 - - G5 B5 -',
        'D6 - - B5 G#5 -',
        'B5 - - A5 C#6 -',
        'E6 - - C#6 A#5 -',
        'B5 - D6 - F#6 -',
        'E6 - - D6 C#6 -',
        'B5 - - C#6 B5 -',
        'A#5 - - - - .',
      ].join(' | '),
      counter: [
        'D4 . D4 . D4 .',
        'D4 . D4 . D4 .',
        'E4 . E4 . E4 .',
        'E4 . E4 . E4 .',
        'F#4 . F#4 . F#4 .',
        'G4 . G4 . G4 .',
        'B4 . B4 . B4 .',
        'A#4 . A#4 . A#4 .',
      ].join(' | '),
    },
    open: {
      chords: 'Bmaj7 | Emaj7/B | Bmaj7 | Emaj7/B | G#m7 | C#m7 | Emaj7 | Em6',
      melody: [
        'C#6 - - - B5 F#5',
        'D#6 - - - C#6 G#5',
        'C#6 - - - D#6 F#6',
        'G#6 - - - - -',
        'F#6 - - - D#6 B5',
        'D#6 - - - C#6 G#5',
        'G#5 - B5 - D#6 -',
        'G6 - - - E6 C#6',
      ].join(' | '),
      counter: 'D#5 - - - - - | E5 - - - - - | F#5 - - - - - | G#5 - - - B5 - | D#5 - - - - - | E5 - - - - - | B4 - - - - - | B4 - - - - -',
      key: 'B',
      drums: 'waltz',
      bass: 'whole',
      harmony: 'broken',
    },
    close: {
      chords: 'G | Em/G | F#7/A# | Bm | Gmaj7 | Em7 | F#7sus4 | F#7',
      melody: [
        'A5 - - - - -',
        'B5 - - - G5 -',
        'C#6 - - - A#5 -',
        'D6 - - - - -',
        'F#6 - - - - -',
        'G6 - - - F#6 E6',
        'C#6 - - - B5 -',
        'A#5 - - - - .',
      ].join(' | '),
      counter: tick(8),
      drums: false,
      harmony: 'pad',
    },
    a3: {
      chords: `${themeChords} | F#7sus4 F#7`,
      melody: [...theme, 'A5 - D6 - F#6 -', 'G6 - - - F#6 E6', 'E6 - - - C#6 A#5', 'B5 - - - A#5 -'].join(' | '),
      counter: [...innerLine, 'F#4 - - - - -'].join(' | '),
      drums: 'waltz',
    },
  },
  form: ['intro', 'a', 'a2', 'b', 'open', 'close', 'a3'],
  loopFrom: 1,
};
