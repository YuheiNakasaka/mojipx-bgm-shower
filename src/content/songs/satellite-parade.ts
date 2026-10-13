import { type SongDef, transposed } from '../../domain/music/song.ts';

// A future city on parade: one riff keeps striking the same high note while the chords move under it
// (a Lydian D/C among them), and the royal-road chorus opens on that very note before the last chorus climbs a step.
const riff = {
  chords: 'Cmaj7 | D/C | Fmaj7 | G',
  melody: 'G5 . C6 . D6 E6 - C6 | F#5 . A5 . D6 E6 - D6 | F5 . A5 . C6 E6 - C6 | G5 . B5 . D6 E6 - G5',
};

const chorus = {
  chords: 'Fmaj7 | G | Em7 | Am7 | Fmaj7 | G | Cmaj7 A7 | Dm7 G7',
  melody: [
    'E6 - - - - - C6 D6',
    '- - - - - - A5 B5',
    '- - - - E6 - D6 C6',
    '- - - - . . F5 G5',
    'A5 . C6 . D6 E6 - F6',
    'G6 - - - - - E6 D6',
    'E6 - - - - - C#6 E6',
    'F6 - - - D6 - B5 -',
  ].join(' | '),
  counter: [
    '. . F5 A5 C6 . . .',
    '. . G5 B5 D6 . . .',
    '. . E5 G5 B5 . . .',
    '. . A5 C6 E6 . . .',
    'F5 - - - - - - -',
    '. . D5 G5 B5 . . .',
    'C5 - - - C#5 - - -',
    'D5 - - - B4 - - -',
  ].join(' | '),
  lead: 'alt' as const,
};

export const satelliteParade: SongDef = {
  id: 'satellite-parade',
  title: 'Satellite Parade',
  style: 'technopop',
  mood: { valence: 0.6, energy: 0.65 },
  key: 'C',
  bpm: 132,
  sections: {
    intro: { ...riff, drums: false },
    a: {
      chords: 'Cmaj7 | D/C | Cmaj7 | D/C | Am7 | Em7 | Fmaj7 | G',
      melody: [
        '. G4 C5 . E5 . D5 .',
        '. A4 D5 . F#5 . E5 .',
        '. B4 E5 . G5 . A5 .',
        'F#5 - - - D5 - . .',
        '. C5 E5 . A5 . G5 .',
        '. B4 E5 . G5 . D5 .',
        '. A4 C5 . F5 . E5 .',
        'D5 - - - . . . .',
      ].join(' | '),
      harmony: 'arp-up',
      bass: 'octave',
    },
    b: {
      chords: 'Fmaj7 | G/F | Em7 | A7 | Dm7 | Em7 | Fmaj7 | G7sus4 G7',
      melody: [
        'E5 - - - - - F5 G5',
        'A5 - - - G5 - F5 E5',
        'G5 - - - - - A5 B5',
        'C#6 - - - B5 - A5 G5',
        'A5 - - - - - B5 C6',
        'D6 - - - B5 - C6 D6',
        'E6 - - - - - D6 C6',
        'C6 - - - B5 - D6 -',
      ].join(' | '),
      drums: 'half',
    },
    s: chorus,
    riff,
    lift: { chords: 'A7sus4 A7', melody: 'E6 - - - C#6 - A5 -', key: 'D', lead: 'alt' },
    up: transposed(chorus, 2, 'D'),
    outro: { chords: 'Bbmaj7 | G7sus4 G7', melody: 'D6 - - - C6 - A5 - | C6 - - - B5 - G5 -' },
  },
  form: ['intro', 'a', 'b', 's', 'riff', 'b', 'lift', 'up', 'outro'],
  loopFrom: 1,
};
