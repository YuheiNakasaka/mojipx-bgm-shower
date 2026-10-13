import { type SongDef, transposed } from '../../domain/music/song.ts';

// Heroic march under a raised banner: the old call, a Mixolydian swagger, a climb in rising arpeggios, and a
// summit chorus that sighs from major to the minor iv at its peak before the banner goes up a semitone.
const verse = {
  chords: 'A | G | D | A | F#m7 | D | Bm7 E7 | E7sus4 E7',
  melody: [
    'E4 - A4 - - - B4 C#5',
    'D5 - - - B4 - G4 -',
    'A4 - - - F#4 - A4 B4',
    'C#5 - - - - - . E4',
    'F#4 - C#5 - - - D5 E5',
    'F#5 - - - D5 - A4 -',
    'D5 - - C#5 B4 - - A4',
    'A4 - - - G#4 - - -',
  ].join(' | '),
};

const summit = {
  chords: 'A | G | D | E7sus4 E7 | F#m7 | Dmaj7 Dm6 | A/E E7 | A',
  melody: [
    'A5 - - C#6 E6 - - -',
    'D6 - - B5 G5 - - -',
    'F#5 - - A5 D6 - - -',
    'E6 - - - D6 - B5 -',
    'A5 - - B5 C#6 - E6 -',
    'F#6 - - - F6 - - -',
    'E6 - - - D6 - B5 -',
    'A5 - - - - - . .',
  ].join(' | '),
  counter: [
    'E5 - - - C#5 - - -',
    'B4 - - - D5 - - -',
    'D5 - - - F#5 - - -',
    'B4 - - - G#4 - - -',
    'C#5 - - - E5 - - -',
    'A4 - - - B4 - - -',
    'C#5 - - - B4 - G#4 -',
    'A4 - - - E5 - C#5 -',
  ].join(' | '),
  harmony: 'arp16' as const,
  bass: 'gallop' as const,
  drums: 'rock' as const,
};

export const skywardBanner: SongDef = {
  id: 'skyward-banner',
  title: 'Skyward Banner',
  style: 'grand-field',
  mood: { valence: 0.1, energy: 0.7 },
  key: 'A',
  bpm: 136,
  sections: {
    call: {
      chords: 'A | G D/F# | D E | A',
      melody: 'E5 . E5 A5 - - C#6 - | D6 . C#6 D6 E6 - - - | F#5 . F#5 F#5 G#5 . G#5 G#5 | A5 - - - E5 - C#5 -',
      harmony: 'pad',
      bass: 'whole',
    },
    a: { ...verse, drums: 'light', bass: 'half' },
    a2: {
      ...verse,
      counter: [
        'E5 - - - - - - -',
        'G5 - - - - - - -',
        'F#5 - - - - - - -',
        'E5 - - - - - . .',
        'A5 - - - - - - -',
        'A5 - - - F#5 - - -',
        'F#5 - - - G#5 - - -',
        'E5 - - - D5 - - -',
      ].join(' | '),
    },
    b: {
      chords: 'D | E | F#m | D E | Bm7 | C#m7 | Dmaj7 | E7sus4 E7',
      melody: [
        'F#4 - A4 - D5 - C#5 B4',
        'G#4 - B4 - E5 - D5 C#5',
        'A4 - C#5 - F#5 - E5 F#5',
        'D5 - F#5 - G#5 - - -',
        'F#5 - - - D5 - A5 -',
        'G#5 - - - E5 - B5 -',
        'A5 - - - F#5 - C#6 -',
        'B5 - - - - - G#5 -',
      ].join(' | '),
      harmony: 'arp-updown',
      drums: 'half',
      bass: 'half',
    },
    s: summit,
    lift: { chords: 'F7sus4 F7', melody: 'C6 - - - A5 - F5 -', key: 'Bb', drums: 'rock' },
    up: transposed(summit, 1, 'Bb'),
  },
  form: ['call', 'a', 'a2', 'b', 's', 'lift', 'up', 'call'],
  loopFrom: 1,
};
