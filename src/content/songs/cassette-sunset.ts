// A summer kept on a worn cassette: the old pushing verse, then a chorus on the canon's falling bass whose long notes
// fall with it in tenths, each bar dipping low and leaping to the next one early, and a minor iv as the sun goes down.
import type { SongDef } from '../../domain/music/song.ts';

const memory = {
  chords: 'Dbmaj7 | Ab/C | Bbm7 | Ab7sus4',
  melody: 'F6 - - - - - Ab5 Eb6 | - - - - - - Ab5 Db6 | - - - - - - F5 Ab5 | Db6 - - - Bb5 - Eb5 -',
  drums: false as const,
  bass: 'whole' as const,
  harmony: 'half-pad' as const,
};

const chorus = {
  chords: 'Dbmaj7 | Ab/C | Bbm7 | Fm7/Ab | Gbmaj7 | Gbm6 | Fm7 Bb7 | Ebm9 Ab7sus4',
  melody: [
    'F6 - - - - - Ab5 Eb6',
    '- - - - - - Ab5 Db6',
    '- - - - - - F5 C6',
    '- - - - Eb6 - Ab5 Bb5',
    '- - - - - - Db6 A5',
    '- - - - - - Ab5 C6',
    '- - - D6 - - - -',
    'Db6 - - - Eb6 - - .',
  ].join(' | '),
};

export const cassetteSunset: SongDef = {
  id: 'cassette-sunset',
  title: 'Cassette Sunset',
  style: 'city-groove',
  mood: { valence: -0.1, energy: 0 },
  key: 'Db',
  bpm: 100,
  sections: {
    intro: memory,
    a: {
      chords: 'Dbmaj7 | Bbm9 | Gbmaj7 | Ab7sus4 | Fm7 | Bbm9 | Ebm9 | Ab7',
      melody: [
        '. Ab4 Db5 Eb5 F5 - Eb5 F5',
        '- - Db5 - C5 - Ab4 -',
        '. Bb4 Db5 Eb5 F5 - Eb5 Db5',
        '- - . Ab4 Bb4 Db5 - C5',
        '- . Ab4 C5 Eb5 - F5 Ab5',
        '- - - - F5 - Db5 Eb5',
        '- - Gb5 - F5 - Eb5 Db5',
        'C5 - - - . Eb5 Gb5 F5',
      ].join(' | '),
      pad: false,
      bass: 'groove',
    },
    b: {
      chords: 'Gbmaj7 | Fm7 | Ebm9 | Dbmaj7 | Gbmaj7 | Fm7 Bb7 | Ebm9 | Ab7sus4 Ab7',
      melody: [
        '- - Gb5 - Bb5 - . Ab5',
        '- - F5 - Eb5 - C5 F5',
        '- - Eb5 Gb5 Bb5 - Db6 C6',
        '- - - - Ab5 - F5 Bb5',
        '- - Db6 - - - Eb6 Db6',
        'C6 - - Ab5 D6 - - Bb5',
        '- - Gb5 - Bb5 - Db6 -',
        'Eb6 - - Db6 C6 - Eb6 -',
      ].join(' | '),
      drums: 'half',
    },
    s: chorus,
    s2: {
      ...chorus,
      counter: [
        '. . Ab4 C5 Db5 - - -',
        '. . C5 Bb4 Ab4 - - -',
        '. . F4 Ab4 Bb4 - - -',
        '. . Ab4 C5 Eb5 - - -',
        '. . Db5 F5 Gb5 - - -',
        '. . Eb5 Db5 A4 - - -',
        '. . C5 Eb5 D5 - - -',
        '. . Gb4 Bb4 Db5 - - -',
      ].join(' | '),
      lead: 'alt',
    },
    outro: memory,
  },
  form: ['intro', 'a', 'b', 's', 's2', 'outro'],
  loopFrom: 1,
};
