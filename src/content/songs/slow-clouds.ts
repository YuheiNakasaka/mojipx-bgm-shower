// Clouds crossing a wide afternoon sky, in music-box bells: notes struck far apart with sixths and octaves between
// them, a Lydian IV that floats, a sung strain (twice, the second time over a fuller bass) that clouds over on the
// borrowed minor iv, and bells drifting back down.
import type { SongDef } from '../../domain/music/song.ts';

const bells = {
  chords: 'Abmaj9 | Cm7 | Dbmaj7#11 | Ebsus4 Eb | Abmaj9 | Fm9 | Bbm9 | Eb9sus4',
  melody: [
    'Ab4 . Eb5 . C6 - - .',
    'Bb5 - - . G5 . Eb5 .',
    'F4 . C5 . G5 - - .',
    'Eb5 - - . Bb4 . G4 .',
    'Eb4 . C5 . Ab5 - - .',
    'G5 - - . C5 . F5 .',
    'Db5 . Ab5 . F5 - - .',
    'F5 - - . Db5 . Bb4 .',
  ].join(' | '),
};

// The sung strain: a two-note lift-off onto a long colour tone, then a 3+3+2 drift down, four times over the royal
// road of A♭, peaking on the major third of D♭ just before the borrowed D♭m6 turns it minor.
const sung = {
  chords: 'Dbmaj9 | Eb6 | Cm7 | Fm9 | Dbmaj7 | Dbm6 | Bbm9 | Eb7sus4 Eb7',
  melody: [
    '. . Ab5 C6 Eb6 - - -',
    'C6 - - Bb5 - - G5 -',
    '. . G5 Bb5 Eb6 - - -',
    'C6 - - Ab5 - - G5 -',
    '. . Ab5 C6 F6 - - -',
    'Fb6 - - Db6 - - Bb5 -',
    '. . F5 Ab5 C6 - - -',
    'Bb5 - - Ab5 G5 - - -',
  ].join(' | '),
};

const low = [
  'F4 - - - - - - -',
  'G4 - - - - - - -',
  'G4 - - - Bb4 - - -',
  'Ab4 - - - - - - -',
  'F4 - - - Ab4 - - -',
  'Ab4 - - - - - - -',
  'Db5 - - - - - - -',
  'Eb5 - - - Db5 - - -',
].join(' | ');

const high = [
  'Db5 - - - - - - -',
  'Bb4 - - - - - Eb5 -',
  'Eb5 - - - - - - -',
  'F5 - - - Eb5 - - -',
  'F5 - - - - - - -',
  'Ab4 - - - - - - -',
  'Db5 - - - - - - -',
  'Eb5 - - - Db5 - - -',
].join(' | ');

export const slowClouds: SongDef = {
  id: 'slow-clouds',
  title: 'Slow Clouds',
  style: 'snowfall',
  mood: { valence: 0, energy: -0.65 },
  key: 'Ab',
  bpm: 88,
  sections: {
    a: { ...bells, drums: false },
    b: { ...sung, counter: low },
    a2: {
      ...bells,
      counter: [
        'Eb4 - - - - - - -',
        'Eb4 - - - G4 - - -',
        'F4 - - - - - - -',
        'Ab4 - - - G4 - - -',
        'C4 - - - Eb4 - - -',
        'Ab4 - - - - - - -',
        'F4 - - - - - - -',
        'Ab4 - - - - - - -',
      ].join(' | '),
    },
    b2: { ...sung, counter: high, bass: 'ballad' },
    fall: {
      chords: 'Dbmaj7#11 | Cm7 | Bbm9 | Eb9sus4',
      melody: 'F5 - - . C6 . G5 . | Eb6 - - . Bb5 . G5 . | Db6 - - . Ab5 . F5 . | Ab5 - - . F5 . Db5 .',
      drums: false,
    },
  },
  form: ['a', 'b', 'a2', 'b2', 'fall'],
};
