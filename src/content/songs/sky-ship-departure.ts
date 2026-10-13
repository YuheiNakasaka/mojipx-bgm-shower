import { type SongDef, transposed } from '../../domain/music/song.ts';

// The airship lifts off: the dawn motif turns Lydian (its fourth raised over the II chord), a chorus climbs by
// falling octave leaps to the top of the sky, and the last chorus rises a whole step before gliding home.
const chorus = {
  chords: 'Bbmaj7 | C/E | Am7 | Dm7 | Gm7 | G/B | Bbmaj7 C7 | F',
  melody: [
    'D5 - - D6 - - C6 Bb5',
    'C6 - - - G5 - - -',
    'C5 - - C6 - - Bb5 A5',
    'A5 - - - F5 - - -',
    'Bb4 - - Bb5 - - A5 G5',
    'B5 - - - D6 - - -',
    'F6 - - - E6 - - -',
    'F6 - - - - - . .',
  ].join(' | '),
  counter: [
    'F4 - - - - - - -',
    'E4 - - - . C5 D5 E5',
    'A4 - - - - - - -',
    'D5 - - - . A4 C5 D5',
    'G4 - - - D5 - - -',
    'G4 - - - B4 - - -',
    'D5 - - - Bb4 - - -',
    'A4 - - - C5 - F5 -',
  ].join(' | '),
  harmony: 'sparkle' as const,
  bass: 'gallop' as const,
  drums: 'rock' as const,
};

const lydianHead = ['F5 - - G5 C6 - - -', 'B5 - A5 - G5 - - -', '. E5 G5 B5 D6 - - -', 'C6 - - B5 A5 - E5 -'];

export const skyShipDeparture: SongDef = {
  id: 'sky-ship-departure',
  title: 'Sky Ship Departure',
  style: 'grand-field',
  mood: { valence: 0.55, energy: 0.6 },
  key: 'F',
  bpm: 140,
  sections: {
    intro: {
      chords: 'Fmaj7 | Fmaj7 | G/F | G/F',
      melody: 'F4 - - - - - G4 - | C5 - - - - - - - | B4 - - - A4 - - - | G4 - - - - - . .',
      harmony: 'sparkle',
      bass: 'pedal',
      drums: false,
    },
    a: {
      chords: 'Fmaj7 | G/F | Em7 | Am9 | Dm7 | Em7 | Fmaj7 | G/F',
      melody: [...lydianHead, 'F5 - - E5 D5 - A5 -', 'G5 - - A5 B5 - D6 -', 'E6 - - D6 C6 - A5 -', 'B5 - - - - - . .'].join(' | '),
      drums: 'light',
    },
    a2: {
      chords: 'Fmaj7 | G/F | Em7 | Am9 | Dm7 | Em7 | Bbmaj7 | C7sus4 C7',
      melody: [...lydianHead, 'F5 - - E5 D5 - A5 -', 'G5 - - A5 B5 - D6 -', 'D6 - - C6 A5 - F5 -', 'G5 - - - E5 - - -'].join(' | '),
      counter: [
        'A4 - - - E5 - - -',
        'D5 - - - B4 - - -',
        'E4 - - - G4 - A4 B4',
        'E5 - - - C5 - - -',
        'A4 - - - F4 - - -',
        'B4 - - - G4 - - -',
        'Bb4 - - - D5 - - -',
        'C5 - - - Bb4 - - -',
      ].join(' | '),
    },
    b: {
      chords: 'Dm7 | Bbmaj7 | Gm7 | C | Dm7 | Ebmaj7 | Gm7 Am7 | Bbmaj7 C7sus4',
      melody: [
        'A4 - - C5 D5 - - -',
        'F5 - - E5 D5 - - -',
        'Bb4 - - D5 F5 - - -',
        'G5 - - F5 E5 - - -',
        'A5 - - Bb5 C6 - - -',
        'D6 - - C6 Bb5 - - -',
        'Bb5 - - - C6 - - -',
        'D6 - - - C6 - Bb5 -',
      ].join(' | '),
      harmony: 'arp-updown',
      drums: 'half',
      bass: 'half',
    },
    s: chorus,
    lift: { chords: 'D7sus4 D7', melody: 'A5 - - - F#5 - D5 -', key: 'G', drums: 'rock' },
    up: transposed(chorus, 2, 'G'),
    outro: { chords: 'Ebmaj7 | C7sus4 C7', melody: 'Bb5 - - - G5 - - - | F5 - - - E5 - - -', harmony: 'arp-updown' },
  },
  form: ['intro', 'a', 'a2', 'b', 's', 'lift', 'up', 'outro'],
  loopFrom: 1,
};
