import { type SongDef, transposed } from '../../domain/music/song.ts';

// A slow, glittering kawaii ballad: sparkle arpeggios over half-time drums, a chorus that leaps a sixth onto the 5th
// and steps down onto the 9th, a sweet minor iv that sighs on its flat 3rd, and four on the floor only once, when
// the last chorus comes back a whole step up with bells.
const chorus = {
  chords: 'Abmaj7 | Bb | Gm7 C7 | Fm7 | Abmaj7 | Abm6 | Eb/G C7 | Fm7 Bb7sus4',
  melody: [
    'G5 - Eb6 - - - D6 -',
    'C6 - - - Bb5 - - -',
    'Bb5 - D6 - E6 - - -',
    'F6 - - - Eb6 - C6 -',
    'G5 - Eb6 - - - D6 -',
    'Eb6 - - - B5 - - -',
    'Bb5 - - - - - G5 -',
    'Ab5 - - - C6 - - -',
  ].join(' | '),
};

const bells = [
  'Eb5 - - - G5 - - -',
  'D5 - - - F5 - - -',
  'D5 - - - E5 - - -',
  'Ab5 - - - - - - -',
  'Eb5 - - - G5 - - -',
  'Eb5 - - - F5 - - -',
  'G5 - - - E5 - - -',
  'C5 - - - Eb5 - - -',
].join(' | ');

const jar = {
  chords: 'Abmaj7 | Bb/Ab | Gm7 | Cm7',
  melody: ['G5 - Eb6 - - - D6 -', 'C6 - - - Bb5 - - -', 'Bb5 - D6 - F6 - - -', 'Eb6 - - - C6 - G5 -'].join(' | '),
};

export const starlightInAJar: SongDef = {
  id: 'starlight-in-a-jar',
  title: 'Starlight in a Jar',
  style: 'kawaii-pop',
  mood: { valence: 0.6, energy: 0.2 },
  key: 'Eb',
  bpm: 130,
  sections: {
    intro: { ...jar, drums: false, bass: 'whole' },
    a: {
      chords: 'Ebmaj7 | Bb/D | Cm7 | Gm7/Bb | Abmaj7 | Eb/G | Fm7 | Bb7sus4 Bb7',
      melody: [
        '. . Bb4 Eb5 F5 - G5 -',
        'F5 - - - D5 - . .',
        '. . G4 C5 D5 - Eb5 -',
        'D5 - - - Bb4 - . .',
        '. . C5 Eb5 G5 - Ab5 -',
        'G5 - - - - - F5 Eb5',
        'F5 - - - Ab5 - G5 -',
        'F5 - - - - - . .',
      ].join(' | '),
      pad: false,
    },
    b: {
      chords: 'Abmaj7 | Bb/Ab | Gm7 | C7 | Fm7 | Gm7 | Abmaj7 | Bb7sus4 Bb7',
      melody: [
        'C5 - Eb5 - G5 - Ab5 -',
        'F5 - - - - - . .',
        'D5 - F5 - Bb5 - C6 -',
        'G5 - - - E5 - . .',
        'Eb5 - F5 - Ab5 - C6 -',
        'Bb5 - - - D6 - - -',
        'C6 - - - Eb6 - - -',
        'Eb6 - - - D6 - . .',
      ].join(' | '),
      counter: [
        '. . . . . . . .',
        '. . . . . . Ab5 C6',
        '. . . . . . . .',
        '. . . . . . C6 E6',
        '. . . . . . . .',
        '. . . . . . F5 Bb5',
        '. . . . . . . .',
        '. . . . . . . .',
      ].join(' | '),
    },
    s: chorus,
    jar,
    up: transposed({ ...chorus, counter: bells, drums: 'four', bass: 'offbeat', lead: 'alt' }, 2, 'F'),
    outro: {
      ...jar,
      chords: 'Abmaj7 | Bb/Ab | Gm7 | Fm7 Bb7sus4',
      melody: ['G5 - Eb6 - - - D6 -', 'C6 - - - Bb5 - - -', 'Bb5 - - - - - - -', 'Ab5 - - - F5 - - -'].join(' | '),
      pad: false,
    },
  },
  form: ['intro', 'a', 'b', 's', 'jar', 'b', 'up', 'outro'],
  loopFrom: 1,
  parts: { drums: 'half', harmony: 'sparkle', bass: 'ballad' },
};
