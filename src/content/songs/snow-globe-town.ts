import { type SongDef, transposed } from '../../domain/music/song.ts';

// A tiny town in a snow globe as a music-box waltz: a chorus that leaps a sixth twice and peaks on a chromatic-mediant
// chord while the glitter swirls in sixteenths, the same chorus a semitone brighter, then the box winds down.
const chorus = {
  chords: 'Abmaj7 | Bb7 | Gm7 | C7 | Fm7 | Cbmaj7 | Bb7sus4 Bb7 | Ebmaj7 Cm7',
  melody: [
    'G5 - - - Eb6 -',
    'D6 - - C6 Bb5 -',
    'F5 - - - D6 -',
    'C6 - - Bb5 G5 -',
    'Ab5 - C6 - F6 -',
    'Gb6 - - - - -',
    'F6 - - - D6 -',
    'Eb6 - - - - -',
  ].join(' | '),
  harmony: 'sparkle' as const,
  bass: 'ballad' as const,
};

export const snowGlobeTown: SongDef = {
  id: 'snow-globe-town',
  title: 'Snow Globe Town',
  style: 'snowfall',
  mood: { valence: 0.6, energy: -0.6 },
  key: 'Eb',
  bpm: 90,
  meter: 3,
  sections: {
    intro: {
      chords: 'Abmaj7 | Gm7 | Fm7 | Bb7sus4 Bb7',
      melody: 'G6 - Eb6 - C6 - | F6 - D6 - Bb5 - | Eb6 - C6 - Ab5 - | Bb5 - - - D6 -',
      harmony: 'arp-down',
      bass: false,
      drums: false,
    },
    a: {
      chords: 'Ebmaj7 | Cm7 | Abmaj7 | Bb7 | Gm7 | C7 | Fm7 | Bb7sus4 Bb7',
      melody: [
        'G5 - - - F5 G5',
        'Bb5 - - - G5 -',
        'C6 - - - Bb5 Ab5',
        'F5 - - - - -',
        'D6 - - - C6 Bb5',
        'G5 - - - E5 -',
        'F5 - - - Ab5 C6',
        'Bb5 - - - Ab5 -',
      ].join(' | '),
      drums: false,
    },
    b: {
      chords: 'Abmaj7 | Bb/Ab | Gm7 | Cm7 | Fm7 | Gm7 | Abmaj7 | Bb7sus4 Bb7',
      melody: [
        'Eb5 - F5 - G5 -',
        'Ab5 - - - F5 -',
        'F5 - G5 - Bb5 -',
        'C6 - - - G5 -',
        'Ab5 - Bb5 - C6 -',
        'D6 - - - Bb5 -',
        'C6 - D6 - Eb6 -',
        'F6 - - - D6 -',
      ].join(' | '),
      harmony: 'arp-up',
    },
    s: chorus,
    lift: { chords: 'B7sus4 B7', melody: 'E6 - - - D#6 -', key: 'E', harmony: 'pad', bass: 'whole', drums: false },
    up: transposed(
      {
        ...chorus,
        counter: [
          'Ab4 - C5 - Eb5 -',
          'F5 - - - D5 -',
          'Bb4 - D5 - F5 -',
          'E5 - - - - -',
          'F5 - - - Ab5 -',
          'Eb5 - Gb5 - Bb5 -',
          'Ab5 - - - F5 -',
          'G5 - - - - -',
        ].join(' | '),
      },
      1,
      'E',
    ),
    tag: {
      chords: 'Cbmaj7 | Abmaj7 | Fm7 | Bb7sus4 Bb7',
      melody: 'Eb6 - - - Bb5 - | C6 - - - G5 - | Ab5 - - - Eb5 - | F5 - - - - -',
      harmony: 'arp-down',
      bass: 'whole',
      drums: false,
    },
  },
  form: ['intro', 'a', 'b', 's', 'intro', 'lift', 'up', 'tag'],
  loopFrom: 1,
};
