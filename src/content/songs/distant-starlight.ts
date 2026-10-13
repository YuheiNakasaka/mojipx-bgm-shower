import { type SongDef, transposed } from '../../domain/music/song.ts';

// A tearful major-key ballad: a verse whose bass falls through a secondary dominant, the borrowed minor iv turning the
// melody's third down a semitone in both pre-chorus and chorus, then a hushed pivot and the chorus again a whole step up.
const chorus = {
  chords: 'Gbmaj7 | Ab/Gb | Fm7 | Bbm7 Bbm7/Ab | Gbmaj7 | Gbm6 | Fm7 Bb7 | Ebm7 Ab7sus4',
  melody: [
    'Ab5 - - - - - Bb5 Ab5',
    'Gb5 - - - Eb5 - - -',
    'Ab5 - - - - - Bb5 Ab5',
    'F5 - - - Db5 - - -',
    'Db6 - - - - - Bb5 A5',
    '- - - - Gb5 - Eb5 -',
    'Ab5 - - - - - F5 -',
    'Gb5 - - - - - . .',
  ].join(' | '),
  counter: [
    'Bb4 - Db5 - F5 - - -',
    'Eb5 - - - C5 - Ab4 -',
    'C5 - Eb5 - F5 - - -',
    'Db5 - - - Ab4 - - -',
    'Bb4 - Db5 - F5 - - -',
    'Eb5 - - - Db5 - - -',
    'C5 - - - D5 - - -',
    'Db5 - - - - - Eb5 Db5',
  ].join(' | '),
  lead: 'alt' as const,
};

export const distantStarlight: SongDef = {
  id: 'distant-starlight',
  title: 'Distant Starlight',
  style: 'showa-ballad',
  mood: { valence: -0.4, energy: -0.55 },
  key: 'Db',
  bpm: 72,
  sections: {
    intro: {
      chords: 'Gbmaj7 | Ab7sus4 Ab7',
      melody: 'Db6 - - - Bb5 - Ab5 - | Gb5 - - - - - F5 -',
      lead: 'alt',
      bass: 'whole',
      drums: false,
    },
    a: {
      chords: 'Dbmaj7 | Cm7b5 F7 | Bbm7 | Bbm7/Ab | Gbmaj7 | Fm7 | Ebm7 | Ab7sus4 Ab7',
      melody: [
        '. . Ab4 Bb4 C5 - Ab4 F4',
        'Gb4 - - - A4 - C5 -',
        'Db5 - - - - - C5 Bb4',
        'C5 - - - - - . .',
        '. . Bb4 Db5 F5 - - Eb5',
        '- - - - C5 - Ab4 -',
        'Bb4 - - - Gb4 - Ab4 Bb4',
        'Db5 - - - C5 - . .',
      ].join(' | '),
      counter: [
        'Db4 - - - - - - -',
        'Eb4 - - - C4 - - -',
        'F4 - - - - - - -',
        'F4 - Ab4 - Bb4 - Db5 F5',
        'Gb4 - - - - - - -',
        'Ab4 - - - - - - -',
        'Gb4 - - - Eb4 - - -',
        'Gb4 - - - - - Ab4 Bb4',
      ].join(' | '),
      pad: false,
      drums: false,
    },
    b: {
      chords: 'Gbmaj7 | Gbm6 | Fm7 Bb7 | Ebm7 Ab7',
      melody: 'Bb4 - - Db5 F5 - Eb5 Db5 | Eb5 - - - A4 - - - | Ab4 - C5 - D5 - F5 - | Gb5 - - - F5 - Eb5 -',
      counter: 'Gb4 - - - - - - - | Gb4 - - - Db5 - Eb5 - | C5 - - - Bb4 - - - | Bb4 - - - C5 - - -',
    },
    s: chorus,
    lift: { chords: 'Bb7sus4 Bb7', melody: 'Eb5 - F5 - Ab5 - - -', key: 'Eb', lead: 'alt', harmony: 'pad', drums: false },
    up: { ...transposed(chorus, 2, 'Eb'), drums: 'eight' },
    outro: { chords: 'Gbmaj7 | Ab7sus4 Ab7', melody: 'F5 - - - Eb5 - Db5 - | Db5 - - - C5 - . .', drums: false },
  },
  form: ['intro', 'a', 'b', 's', 'lift', 'up', 'outro'],
  loopFrom: 1,
};
