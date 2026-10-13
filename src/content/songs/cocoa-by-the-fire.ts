// A mug of cocoa by the fireside, as a music-box waltz: a verse that leaps up a sixth and sighs back down a step at a
// time (and reaches an octave when it answers itself), a middle that turns wistful on the borrowed minor iv (C → C♭),
// and a warm last strain that takes the leap up high, holds its peak a beat early over the ♭VII9 back door and lets a
// soft second voice answer every held note.
import type { SongDef } from '../../domain/music/song.ts';

const embers = {
  chords: 'Abmaj7 | Gm7 | Fm7 | Bb7sus4',
  melody: 'C5 - Eb5 - G5 - | F5 - - - D5 - | Ab4 - C5 - Eb5 - | F5 - - - Eb5 -',
  drums: false as const,
};

const verse = {
  chords: 'Ebmaj7 | Cm7 | Abmaj7 | Bb7sus4 Bb7 | Eb | C7 | Fm7 Bb7 | Eb',
  melody: [
    'Bb4 - G5 - - F5',
    'Eb5 - - - - -',
    'C5 - Ab5 - - G5',
    'F5 - - - D5 -',
    'Bb4 - Bb5 - - Ab5',
    'G5 - - - E5 -',
    'Ab5 - - G5 F5 -',
    'Eb5 - - - - -',
  ].join(' | '),
  bass: 'whole' as const,
};

export const cocoaByTheFire: SongDef = {
  id: 'cocoa-by-the-fire',
  title: 'Cocoa by the Fire',
  style: 'snowfall',
  mood: { valence: 0.6, energy: -0.7 },
  key: 'Eb',
  bpm: 84,
  meter: 3,
  sections: {
    embers,
    a: verse,
    b: {
      chords: 'Abmaj7 | Bb | Gm7 | Cm7 | Abmaj7 | Abm6 | Eb/G Fm7 | Bb7sus4 Bb7',
      melody: [
        '. C5 Eb5 - G5 -',
        'F5 - - Eb5 D5 -',
        '. Bb4 D5 - F5 -',
        'Eb5 - - D5 C5 -',
        '. Eb5 Ab5 - C6 -',
        'Cb6 - - - Ab5 -',
        'Bb5 - - - Ab5 -',
        'Ab5 - - - F5 D5',
      ].join(' | '),
      harmony: 'arp-up',
    },
    a2: {
      ...verse,
      counter: [
        'G4 - - - - -',
        '. . G4 Bb4 C5 -',
        'Ab4 - - - - -',
        '. . Ab4 - Bb4 -',
        'Eb4 - - - - -',
        '. . E4 G4 Bb4 -',
        'C5 - - - D5 -',
        'G4 - - - - -',
      ].join(' | '),
    },
    c: {
      chords: 'Abmaj7 | Bb/Ab | Gm7 | C7 | Fm9 | Db9 | Eb/Bb | Bb7sus4 Bb7',
      melody: [
        'Eb5 - C6 - - Bb5',
        'Ab5 - - - - -',
        'F5 - D6 - - C6',
        'Bb5 - - - G5 E5',
        'Ab5 - Eb6 - - F6',
        '- - - - Eb6 -',
        'Bb5 - - - - G5',
        'F5 - - - D5 -',
      ].join(' | '),
      counter: [
        'C5 - - - - -',
        '. . D5 - F5 -',
        'Bb4 - - - - -',
        '. . E5 - C5 -',
        'C5 - - - - -',
        '. . Ab4 - F5 -',
        'Eb5 - - - - -',
        'Eb5 - - - Ab4 -',
      ].join(' | '),
      bass: 'ballad',
      harmony: 'arp-updown',
    },
  },
  form: ['embers', 'a', 'b', 'a2', 'c', 'embers'],
  loopFrom: 1,
};
