import type { SongDef } from '../../domain/music/song.ts';

// An underground stage in sly minor funk: the slap bass slides up to a ♭II7 and back on every hook bar, the lead sneaks
// in on offbeats, an IVmaj7–III7–vi bridge glows like neon on water, and a line-cliché breakdown shadows the bass down.
const hook = {
  chords: 'Cm7 Db7 | Cm7 | Cm7 Db7 | Cm7 | Fm7 Gb7 | Fm7 | Abmaj7 | G7#9',
  melody: [
    '. C5 . Eb5 . . G5 - F5 - . . . . . .',
    '. Eb5 . D5 . . C5 - - - . . B4 . C5 .',
    '. C5 . Eb5 . . G5 - Ab5 - . . . . . .',
    '. G5 . F5 . . Eb5 - - - . . D5 . Eb5 .',
    '. F5 . Ab5 . . C6 - Bb5 - . . . . . .',
    '. Ab5 . G5 . . F5 - - - . . C5 . F5 .',
    '. Eb5 . G5 . . C6 - - - Bb5 - G5 - Ab5 -',
    'Bb5 - - - G5 - - - F5 - D5 - B4 - - -',
  ].join(' | '),
};

const neon = {
  chords: 'Abmaj7 | G7 | Cm7 | Bbm7 Eb7 | Abmaj7 | G7 | Cm7 Cm7/Bb | Abmaj7 G7',
  melody: [
    'Bb5 - - - - - - - - - G5 - Ab5 - Bb5 -',
    'B5 - - - - - - - . . G5 - B5 - D6 -',
    'Eb6 - - - - - - - D6 - - - C6 - Bb5 -',
    'Db6 - - - - - - - . . Bb5 - G5 - Ab5 -',
    'C6 - - - - - - - - - Ab5 - Bb5 - C6 -',
    'D6 - - - - - - - . . B5 - D6 - F6 -',
    'G6 - - - - - - - F6 - - - Eb6 - D6 -',
    'C6 - - - - - - - B5 - - - - - . .',
  ].join(' | '),
  lead: 'alt' as const,
  harmony: 'arp16' as const,
};

export const neonSewerRun: SongDef = {
  id: 'neon-sewer-run',
  title: 'Neon Sewer Run',
  style: 'fm-funk',
  mood: { valence: -0.45, energy: 0.45 },
  key: 'Cm',
  bpm: 132,
  steps: 4,
  sections: {
    intro: {
      chords: 'Cm7 Db7 | Cm7 Db7',
      melody: '. . . . . . . . . . . . . . . . | . . . . . . . . . . . . . . G4 -',
      harmony: false,
    },
    a: hook,
    b: neon,
    a2: {
      ...hook,
      counter: [
        '. . . . . . . . . . B4 . Bb4 . Ab4 .',
        '. . . . . . . . . . . . . . . .',
        '. . . . . . . . . . B4 . Bb4 . Ab4 .',
        '. . . . . . . . . . . . . . . .',
        '. . . . . . . . . . E5 . Eb5 . Db5 .',
        '. . . . . . . . . . . . . . . .',
        'C5 - - - - - - - Eb5 - - - - - - -',
        'D5 - - - - - - - B4 - - - - - - -',
      ].join(' | '),
    },
    drip: {
      chords: 'Cm | Cm/B | Cm/Bb | Cm/A | Abmaj7 | Fm7 | Dm7b5 | G7#9',
      melody: [
        '. . . . . . . . G5 - - - Eb5 - C5 -',
        '. . . . . . . . G5 - - - D5 - B4 -',
        '. . . . . . . . G5 - - - Eb5 - Bb4 -',
        '. . . . . . . . G5 - - - Eb5 - A4 -',
        'Ab4 - - - C5 - - - Eb5 - - - G5 - - -',
        'Ab5 - - - - - - - F5 - - - C5 - - -',
        'F5 - - - Ab5 - - - C6 - - - - - - -',
        'B5 - - - - - - - G5 - - - F5 - - -',
      ].join(' | '),
      harmony: 'pad',
      bass: 'half',
      drums: 'half',
    },
    b2: {
      ...neon,
      counter: [
        'Eb5 - - - - - - - C5 - - - - - - -',
        'D5 - - - - - - - F5 - - - - - - -',
        'G5 - - - - - - - Eb5 - - - - - - -',
        'F5 - - - - - - - G5 - - - - - - -',
        'Eb5 - - - - - - - C5 - - - - - - -',
        'F5 - - - - - - - D5 - - - - - - -',
        'Eb5 - - - - - - - Bb4 - - - - - - -',
        'Eb5 - - - - - - - D5 - - - - - - -',
      ].join(' | '),
    },
  },
  form: ['intro', 'a', 'b', 'a2', 'drip', 'b2'],
  loopFrom: 1,
};
