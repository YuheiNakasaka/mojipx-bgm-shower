// Closing time in a quiet bar: a sax-like line over a minor cliché whose bass falls a semitone a bar, a pre-chorus
// climbing in sequence to a sus4 that resolves upward, and a chorus on the relative major's royal road that never quite comes home.
import type { SongDef } from '../../domain/music/song.ts';

const chorus = {
  chords: 'Abmaj7 | Bb/Ab | Gm7 | Cm9 | Fm9 | Bb13 | Ebmaj7 | Dm7b5 G7#9',
  melody: [
    'G5 - C6 - - Eb6 - -',
    'D6 - - - C6 - Bb5 -',
    'G5 - Bb5 - - D6 - -',
    'Eb6 - - - D6 - C6 -',
    'Ab5 - C6 - - Eb6 - -',
    'F6 - - - - - Eb6 D6',
    '- - - - Bb5 - G5 -',
    'Ab5 - F5 - D5 - B4 -',
  ].join(' | '),
  harmony: 'arp-updown' as const,
  drums: 'half' as const,
};

export const lastOrder: SongDef = {
  id: 'last-order',
  title: 'Last Order',
  style: 'city-lights',
  mood: { valence: -0.5, energy: -0.3 },
  key: 'Cm',
  bpm: 84,
  parts: { drums: 'brush', bass: 'ballad' },
  sections: {
    intro: {
      chords: 'Abmaj7 | G7sus4 G7b9',
      melody: 'Eb5 - - - - - C5 Bb4 | C5 - - - B4 - - -',
      drums: false,
      bass: 'whole',
      harmony: 'pad',
    },
    a: {
      chords: 'Cm9 | Cm/B | Cm7/Bb | Am7b5 | Abmaj7 | Fm9 | Dm7b5 | G7sus4 G7b9',
      melody: [
        '. G4 C5 D5 Eb5 - - -',
        'D5 - - C5 - - . .',
        '. G4 C5 D5 Eb5 - - F5',
        '- - Eb5 - C5 - . .',
        '. C5 Eb5 G5 - - F5 Eb5',
        'F5 - - - G5 - Ab5 -',
        'Ab5 - - F5 - - D5 -',
        'C5 - - - B4 - - -',
      ].join(' | '),
      harmony: 'half-pad',
    },
    b: {
      chords: 'Ebmaj7 | Fm9 | Gm7 | G7sus4 G7',
      melody: '. Bb4 Eb5 F5 G5 - - - | . C5 F5 G5 Ab5 - - - | . D5 G5 A5 Bb5 - - - | C6 - - - B5 - - -',
      harmony: 'arp-updown',
    },
    s: chorus,
    solo: {
      chords: 'Cm9 | Cm/B | Cm7/Bb | Am7b5',
      melody: '. G5 Bb5 C6 - Bb5 G5 F5 | G5 - - - . D5 Eb5 F5 | G5 - Bb5 - D6 - C6 Bb5 | C6 - - - Eb6 - - -',
    },
    s2: {
      ...chorus,
      counter: [
        'Eb5 - - - C5 - - -',
        'D5 - - - F5 - - -',
        'D5 - - - Bb4 - - -',
        'G4 - - - Bb4 - - -',
        'C5 - - - Ab4 - - -',
        'D5 - - - Ab4 - - -',
        'G4 - - - Bb4 - - -',
        'F4 - - - - - - -',
      ].join(' | '),
    },
  },
  form: ['intro', 'a', 'b', 's', 'solo', 's2'],
  loopFrom: 1,
};
