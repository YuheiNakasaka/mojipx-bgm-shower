import type { SongDef } from '../../domain/music/song.ts';

// A wish under the northern lights: a celesta line that floats down through Lydian's raised fourth, colors that
// shift between flat and natural A, a darker Dorian middle that rests on a bare G, and a wish held on the sharp eleven.
const sky = {
  chords: 'Ebmaj7 | F/Eb | Ebmaj7 | F/Eb | Cm7 | Bbmaj7 | Abmaj7 | F',
  melody: [
    'D6 - - C6 Bb5 - - -',
    'A5 - - G5 F5 - - -',
    'G5 - - Bb5 Eb6 - D6 -',
    'C6 - - - - - . .',
    'Eb6 - - D6 C6 - - -',
    'Bb5 - - A5 F5 - - -',
    'G5 - - Ab5 C6 - Eb6 -',
    'D6 - - C6 A5 - - -',
  ].join(' | '),
};

export const auroraWish: SongDef = {
  id: 'aurora-wish',
  title: 'Aurora Wish',
  style: 'starlit-dream',
  mood: { valence: -0.3, energy: -0.2 },
  key: 'Eb',
  bpm: 84,
  sections: {
    intro: {
      chords: 'Ebmaj7 | F/Eb | Ebmaj7 | F/Eb',
      melody: '. . . . . . D6 . | . . . . . . C6 . | . . . . . . Bb5 . | . . . . A5 . . .',
      counter: 'G4 - - - - - - - | A4 - - - - - - - | Bb4 - - - - - - - | A4 - - - - - - -',
    },
    a: sky,
    b: {
      chords: 'Cm9 | F/C | Cm9 | F/C | Abmaj7 | Bb6 | Gsus4 | G',
      melody: [
        'C5 Eb5 G5 - - - . .',
        '. . . . A5 G5 F5 -',
        'C5 Eb5 Bb5 - - - . .',
        '. . . . C6 A5 F5 -',
        'Eb5 G5 C6 - - - Bb5 -',
        'D6 - - - C6 - Bb5 -',
        'C6 - - - D6 - - -',
        'B5 - - - - - . .',
      ].join(' | '),
      counter:
        'Eb4 - - - - - - - | F4 - - - - - - - | G4 - - - - - - - | A4 - - - - - - - | Ab4 - - - - - - - | F4 - - - - - - - | G4 - - - - - - - | G4 - - - - - - -',
      harmony: 'arp-updown',
    },
    a2: {
      ...sky,
      counter: [
        'G4 - - - - - - -',
        'A4 - - - - - - -',
        'Bb4 - - - - - - -',
        'C5 - - - A4 - - -',
        'G4 - - - - - - -',
        'F4 - - - - - - -',
        'Eb4 - - - - - - -',
        'F4 - - - - - - -',
      ].join(' | '),
    },
    wish: {
      chords: 'Abmaj7 | Bb/Ab | Gm7 | Cm7 | Abmaj7 | Bb/Ab | Ebmaj7#11 | F/Eb',
      melody: [
        'Eb6 - - F6 G6 - - -',
        'F6 - - D6 Bb5 - - -',
        'D6 - - Eb6 F6 - - -',
        'Eb6 - - D6 C6 - - -',
        'Eb6 - - F6 G6 - - -',
        'F6 - - G6 Bb6 - - -',
        'A6 - - - - - - -',
        'F6 - - - C6 - A5 -',
      ].join(' | '),
      counter: [
        'C5 - - - Eb5 - - -',
        'D5 - - - F5 - - -',
        'Bb4 - - - D5 - - -',
        'G4 - - - Eb5 - - -',
        'C5 - - - Eb5 - - -',
        'D5 - - - F5 - - -',
        'G4 - - - D5 - - -',
        'C5 - - - A4 - - -',
      ].join(' | '),
      bass: 'half',
    },
  },
  form: ['intro', 'a', 'b', 'a2', 'wish'],
  loopFrom: 1,
};
