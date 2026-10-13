import { type SongDef, transposed } from '../../domain/music/song.ts';

// A minor-key anthem for the last dance: the riff's three-step run to a high accent becomes the chorus hook
// over the vi–IV–V–I loop, the verse rides a flamenco-like falling bass, and the final chorus breaks a whole step higher.
const riff = {
  chords: 'Fm | Db | Eb | C7sus4 C7',
  melody: 'Ab5 Bb5 C6 . F6 . C6 . | Ab5 Bb5 C6 . F6 . Db6 . | G5 Bb5 Eb6 . G6 . Eb6 . | F5 G5 C6 . E6 . C6 Bb5',
};

const chorus = {
  chords: 'Fm | Db | Eb | Ab | Dbmaj7 | Eb | Cm7 Fm | Bbm7 C7',
  melody: [
    'Ab5 Bb5 C6 - F6 - - -',
    'Eb6 - Db6 - C6 - Ab5 Bb5',
    'Bb5 C6 Eb6 - G6 - - -',
    'F6 - Eb6 - C6 - . .',
    'Ab5 Bb5 C6 - F6 - - -',
    'G6 - F6 - Eb6 - F6 G6',
    'G6 - - - Ab6 - - -',
    'F6 - - - E6 - - -',
  ].join(' | '),
  counter: [
    'F5 - - - Ab5 - - -',
    'Ab5 - - - F5 - - -',
    'G5 - - - Bb5 - - -',
    'Ab5 - - - Eb5 - - -',
    'F5 - - - Ab5 - - -',
    'Bb5 - - - G5 - - -',
    'C6 - - - C6 - - -',
    'Db6 - - - C6 - - -',
  ].join(' | '),
  lead: 'alt' as const,
};

export const starDancer: SongDef = {
  id: 'star-dancer',
  title: 'Star Dancer',
  style: 'eurobeat',
  mood: { valence: 0.55, energy: 0.8 },
  key: 'Fm',
  bpm: 150,
  sections: {
    intro: { ...riff, harmony: false },
    a: {
      chords: 'Fm | Eb | Db | C7 | Fm | Eb | Bbm7 | C7sus4 C7',
      melody: [
        '. F5 F5 Eb5 . F5 Ab5 F5',
        '. Eb5 Eb5 Db5 . Eb5 G5 Eb5',
        '. Db5 Db5 C5 . Db5 F5 Ab5',
        'G5 - - - E5 - . .',
        '. F5 F5 Eb5 . F5 Ab5 C6',
        '. Bb5 Bb5 Ab5 . G5 Eb5 G5',
        'F5 - - - Db5 - Bb4 -',
        'C5 - - - - - . .',
      ].join(' | '),
      harmony: 'stab',
      drums: 'four',
    },
    b: {
      chords: 'Dbmaj7 | Eb | Cm7 | Fm | Bbm7 | Cm7 | Dbmaj7 | C7sus4 C7',
      melody: [
        'Ab5 - - F5 - - C6 -',
        'Bb5 - - G5 - - Eb6 -',
        'Eb6 - - - - - D6 C6',
        'Ab5 - - - - - . .',
        'Db6 - - Bb5 - - F6 -',
        'Eb6 - - C6 - - G6 -',
        'F6 - - - - - Eb6 Db6',
        'F6 - - - E6 - C6 -',
      ].join(' | '),
      drums: 'half',
    },
    s: chorus,
    riff,
    lift: { chords: 'D7sus4 D7', melody: 'G5 A5 C6 - D6 - F#6 -', key: 'Gm', lead: 'alt' },
    up: transposed(chorus, 2, 'Gm'),
    outro: { chords: 'Dbmaj7 | C7sus4 C7', melody: 'F6 - - - Eb6 - C6 - | C6 - - - Bb5 - G5 -' },
  },
  form: ['intro', 'a', 'b', 's', 'riff', 'b', 's', 'lift', 'up', 'outro'],
  loopFrom: 1,
};
