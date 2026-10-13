import type { SongDef } from '../../domain/music/song.ts';

// A walled garden of wires at dusk: a staccato riff that always strikes its top E in the same place opens the gate
// over a Phrygian F on an E pedal, a pentatonic theme walks a falling bass, and the chorus climbs a royal road in the
// relative major in 3-3-2 arpeggios, leaning on a secondary dominant's G# before it peaks; the riff returns as an
// interlude over a rising inner line, and the last chorus gets its answer a fourth below, like temple bells.
const riff = {
  chords: 'Em7 | Fmaj7/E | Em7 | Fmaj7/E',
  melody: 'E5 . B5 E6 . B5 D6 . | C6 . A5 E6 . A5 B5 . | E5 . B5 E6 . B5 D6 . | C6 . A5 E6 - - . .',
};

const theme = {
  chords: 'Em7 | Cmaj7 | Am7 | Bm7 | Em7 | Cmaj7 | Am7 | B7sus4 B7',
  melody: [
    'B5 - - - E5 - A5 -',
    'G5 - - - D5 - E5 -',
    'A5 - G5 - E5 - D5 -',
    'E5 - - - - - . .',
    'B5 - - - E6 - D6 -',
    'B5 - - - G5 - A5 -',
    'E6 - - - D6 - B5 -',
    'A5 - - - - - . .',
  ].join(' | '),
};

const chorus = {
  chords: 'Cmaj7 | D/C | Bm7 | Em7 E7 | Am7 | Bm7 | Cmaj7 | B7sus4 B7',
  melody: [
    'E5 - - G5 - - B5 -',
    'A5 - - - - - . .',
    'F#5 - - A5 - - D6 -',
    'B5 - - - G#5 - - -',
    'A5 - - C6 - - E6 -',
    'F#6 - - - - - E6 D6',
    'E6 - - - G6 - - -',
    'F#6 - - - D#6 - - -',
  ].join(' | '),
  lead: 'alt' as const,
};

export const circuitGarden: SongDef = {
  id: 'circuit-garden',
  title: 'Circuit Garden',
  style: 'technopop',
  mood: { valence: -0.4, energy: 0.2 },
  key: 'Em',
  bpm: 120,
  sections: {
    intro: { ...riff, drums: false },
    a: { ...theme, drums: 'half', bass: 'octave' },
    s: chorus,
    riff: {
      ...riff,
      counter: 'G4 - - - - - - - | A4 - - - - - - - | B4 - - - - - - - | C5 - - - - - - -',
      lead: 'alt',
      harmony: 'arp16',
    },
    a2: {
      chords: theme.chords,
      melody: [
        'B5 - - - E5 - A5 -',
        'G5 - - - D5 - E5 -',
        'A5 - G5 - E5 - D5 -',
        'E5 - - - - - . .',
        'D6 - - - B5 - E6 -',
        'D6 - - - B5 - G5 -',
        'A5 - - - B5 - D6 -',
        'E6 - - - D#6 - B5 -',
      ].join(' | '),
      counter: [
        '. B4 D5 E5 . . . .',
        '. C5 B4 G4 . . . .',
        '. . . . . . . .',
        '. . . . . F#4 A4 B4',
        '. G4 B4 E5 . . . .',
        '. E5 D5 B4 . . . .',
        '. . . . . . . .',
        '. . . . A4 - - -',
      ].join(' | '),
    },
    s2: {
      ...chorus,
      counter: [
        'B4 - - D5 - - F#5 -',
        'E5 - - - - - . .',
        'C#5 - - E5 - - A5 -',
        'F#5 - - - - - . .',
        'E5 - - G5 - - B5 -',
        'C#6 - - - - - B5 A5',
        'B5 - - - D6 - - -',
        'B5 - - - A5 - - -',
      ].join(' | '),
    },
  },
  form: ['intro', 'a', 's', 'riff', 'a2', 's2'],
  loopFrom: 1,
};
