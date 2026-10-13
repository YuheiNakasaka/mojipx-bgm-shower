// Rain on a taxi window at midnight: falling sighs in the verse, a chorus whose line drips down by semitones where
// tritone substitutes slide into their targets, a sharp-nine dominant, and a hushed half verse before the last chorus.
import type { SongDef } from '../../domain/music/song.ts';

const verse = {
  chords: 'Bbm9 | Gbmaj7 | Ebm9 | F7#9 | Bbm9 | Gbmaj7 | Ebm9 | Ab13',
  bars: [
    '. F5 Db5 C5 - - Bb4 -',
    '. F5 Db5 Bb4 - - Ab4 -',
    '. Gb5 Eb5 Db5 - - F5 -',
    'Eb5 - C5 - A4 - . .',
    '. F5 Db5 C5 - - Bb4 -',
    '. F5 Db5 Bb4 - - Db5 Eb5',
    'F5 - - Gb5 - - F5 Eb5',
    'C5 - - - Eb5 - . .',
  ],
};

const chorus = {
  chords: 'Gbmaj7 | Fm7 E7 | Ebm9 | Ab13 | Dbmaj7 | Gbmaj7 | Cm7b5 F7#9 | Bbm9 B7',
  melody: [
    'F6 - - - Db6 - Bb5 Db6',
    'C6 - - B5 - - G#5 -',
    'Bb5 - - - - - Gb5 Ab5',
    '- - Gb5 - F5 - Eb5 F5',
    '. Ab5 C6 Eb6 F6 - - -',
    'Gb6 - - - F6 - Db6 -',
    'Eb6 - - C6 - - Ab5 -',
    'Bb5 - - - A5 - - .',
  ].join(' | '),
};

export const taxiAtMidnight: SongDef = {
  id: 'taxi-at-midnight',
  title: 'Taxi at Midnight',
  style: 'city-lights',
  mood: { valence: -0.55, energy: 0.05 },
  key: 'Bbm',
  bpm: 98,
  sections: {
    intro: {
      chords: 'Gbmaj7 | Fm7 | Ebm9 | B7',
      melody: 'F6 - - - . . Db6 - | C6 - - - . . Ab5 - | Bb5 - - - . . Gb5 - | A5 - - - F#5 - - .',
      drums: false,
      bass: 'whole',
    },
    a: { chords: verse.chords, melody: verse.bars.join(' | '), drums: 'brush', bass: 'half' },
    b: {
      chords: 'Dbmaj7 | C7b9 | Fm7 | Bbm9 | Ebm9 | Fm7 | Gbmaj7 Gdim7 | F7sus4 F7#9',
      melody: [
        '. Db5 F5 Ab5 C6 - - -',
        '- - Bb5 - G5 - E5 -',
        '. Eb5 F5 Ab5 Bb5 - - -',
        '- - Ab5 - F5 - Db5 -',
        '. Eb5 Gb5 Bb5 Db6 - C6 -',
        'C6 - - - Ab5 - Bb5 C6',
        'Db6 - - Bb5 - - Db6 -',
        'Eb6 - - - C6 - A5 -',
      ].join(' | '),
    },
    s: chorus,
    hush: {
      chords: 'Bbm9 | Gbmaj7 | Ebm9 | F7#9',
      melody: [...verse.bars.slice(0, 3), 'Eb5 - C5 - A5 - C6 Eb6'].join(' | '),
      drums: false,
      bass: 'whole',
    },
    s2: {
      ...chorus,
      counter: [
        'Bb4 - - - Db5 - - -',
        'Ab4 - - - - - - -',
        'Gb4 - - - Bb4 - - -',
        'C5 - - - Gb4 - - -',
        'F4 - - - Ab4 - - -',
        'Bb4 - - - Db5 - - -',
        'Gb4 - - - A4 - - -',
        'Db5 - - - D#5 - - -',
      ].join(' | '),
    },
  },
  form: ['intro', 'a', 'b', 's', 'hush', 's2'],
  loopFrom: 1,
};
