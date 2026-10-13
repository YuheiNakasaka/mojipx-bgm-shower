// A harbour at dusk, lights on slow water: a verse rocking between I and a Lydian IV, a pre-chorus climbing in
// seventh-chord arpeggios, and a chorus that strikes the same high note a beat early every bar while the answer below
// it darkens (VI7 under the third, the minor iv under the leap); the last chorus rises a semitone and the Lydian
// glow carries it home.
import { type SongDef, transposed } from '../../domain/music/song.ts';

const glow = {
  chords: 'Dbmaj7#11 | Eb7sus4',
  melody: 'G5 - - - - - F5 - | Eb5 - - - - - . .',
  drums: false as const,
  bass: 'whole' as const,
  harmony: 'arp-updown' as const,
};

const chorus = {
  chords: 'Dbmaj7 | Eb/Db | Cm7 | F7 | Dbmaj7 | Dbm6 | Cm7 Fm7 | Bbm9 Eb7sus4',
  melody: [
    'Eb6 - - C6 - Ab5 - Eb6',
    '- - - Db6 - Bb5 - Eb6',
    '- - - C6 - Bb5 - Eb6',
    '- - - - C6 - A5 C6',
    'Eb6 - - C6 - Ab5 - E6',
    '- - - - Eb6 - Db6 Eb6',
    'G6 - - - F6 - Eb6 C6',
    'Db6 - - - C6 - Bb5 -',
  ].join(' | '),
  counter: [
    'F5 - - - - - - -',
    'G5 - - - - - - -',
    'G5 - - - - - - -',
    'A5 - - - F5 - - -',
    'Ab5 - - - F5 - - -',
    'Bb5 - - - Ab5 - - -',
    'G5 - - - Ab5 - - -',
    'F5 - - - - - - -',
  ].join(' | '),
};

export const docksideGlow: SongDef = {
  id: 'dockside-glow',
  title: 'Dockside Glow',
  style: 'city-lights',
  mood: { valence: 0.1, energy: -0.55 },
  key: 'Ab',
  bpm: 90,
  sections: {
    glow,
    a: {
      chords: 'Abmaj7 | Dbmaj7#11 | Abmaj7 | Dbmaj7#11 | Cm7 | Fm9 | Bbm9 | Eb7sus4 Eb7',
      melody: [
        '. . C5 Eb5 G5 - - -',
        'F5 - - - - - . .',
        '. . Eb5 G5 Bb5 - - -',
        'G5 - - - F5 - - -',
        '. . C5 Eb5 G5 - - -',
        'Ab5 - - - - - G5 F5',
        '- - - - . . Db5 Eb5',
        'Ab5 - - - G5 - - -',
      ].join(' | '),
      drums: 'brush',
      bass: 'half',
      harmony: 'half-pad',
    },
    b: {
      chords: 'Bbm7 | Cm7 | Dbmaj7 | Eb7sus4 Eb7',
      melody: '. Db5 F5 Ab5 - - F5 - | . Eb5 G5 Bb5 - - G5 - | . F5 Ab5 C6 - - Ab5 - | Bb5 - - - G5 - Ab5 Bb5',
      drums: 'brush',
      bass: 'walk',
      harmony: 'syncopate',
    },
    s: chorus,
    lift: { chords: 'E7sus4 E7', melody: 'B5 - - - - - G#5 -', key: 'A' },
    up: transposed(chorus, 1, 'A'),
  },
  form: ['glow', 'a', 'b', 's', 'glow', 'b', 'lift', 'up', 'glow'],
  loopFrom: 1,
};
