import type { SongDef } from '../../domain/music/song.ts';

// A desert course in minor fusion: a heat-haze intro over an A pedal, a talky Dorian verse on i9–IV9, a pre-chorus
// that climbs to a harmonic-minor E7♭9, and a chorus whose ninths fall in sequence before the line breaks upward.
const chorus = {
  chords: 'Fmaj7 | G6 | Em7 | Am9 | Dm9 | G | Cmaj7 Fmaj7 | Bm7b5 E7',
  melody: [
    'G6 - - - - - - - E6 - - - C6 - - -',
    'D6 - - - - - - - . . B5 C6 D6 - E6 -',
    'F#6 - - - - - - - D6 - - - B5 - - -',
    'C6 - - - - - - - . . A5 B5 C6 - D6 -',
    'E6 - - - - - - - C6 - - - A5 - - -',
    'B5 - - - - - - - . . G5 A5 B5 - D6 -',
    'G6 - - - - - - - A6 - - - - - - -',
    'F6 - - - D6 - - - B5 - - - G#5 - - -',
  ].join(' | '),
  counter: [
    'A4 - - - - - - - C5 - - - E5 - - -',
    'D5 - - - - - - - G5 - - - - - - -',
    'B4 - - - - - - - D5 - - - G5 - - -',
    'E5 - - - - - - - G5 - - - - - - -',
    'F5 - - - - - - - A5 - - - E5 - - -',
    'D5 - - - - - - - G5 - - - - - - -',
    'E5 - - - G5 - - - A5 - - - C6 - - -',
    'A5 - - - - - - - G#5 - - - - - - -',
  ].join(' | '),
  lead: 'alt' as const,
};

export const mirageCircuit: SongDef = {
  id: 'mirage-circuit',
  title: 'Mirage Circuit',
  style: 'fusion-drive',
  mood: { valence: 0.2, energy: 0.7 },
  key: 'Am',
  bpm: 146,
  steps: 4,
  sections: {
    intro: {
      chords: 'Am9 | D9/A | Fmaj7/A | E7sus4',
      melody: [
        'B5 - - - - - - - - - - - - - - -',
        'A5 - - - - - - - F#5 - - - - - - -',
        'G5 - - - - - - - - - - - E5 - - -',
        'B4 - - - - - - - D5 - - - E5 - - -',
      ].join(' | '),
      drums: false,
      bass: 'whole',
      harmony: 'arp16',
    },
    a: {
      chords: 'Am9 | D9 | Am9 | D9 | Fmaj7 | Em7 | Dm9 | E7sus4 E7',
      melody: [
        'E5 . . E5 . D5 . E5 - - G5 - E5 - . .',
        'F#5 - - - - - - - . . A4 - C5 - D5 -',
        'E5 . . E5 . D5 . E5 - - A5 - G5 - . .',
        'F#5 - - - - - - - E5 - - - D5 - - -',
        'A4 . . A4 . G4 . A4 - - C5 - E5 - . .',
        'D5 - - - - - - - . . B4 - D5 - E5 -',
        'F5 . . F5 . E5 . F5 - - A5 - F5 - . .',
        'A5 - - - - - - - G#5 - - - - - . .',
      ].join(' | '),
      pad: false,
    },
    b: {
      chords: 'Dm9 | Em7 | Fmaj7 | G6 | Am9 | F#m7b5 | Fmaj7 | E7sus4 E7b9',
      melody: [
        'D5 - - F5 - - - - A5 - - G5 - - - -',
        'E5 - - G5 - - - - B5 - - A5 - - - -',
        'F5 - - A5 - - - - C6 - - B5 - - - -',
        'G5 - - B5 - - - - D6 - - E6 - - - -',
        'A5 - - C6 - - - - E6 - - D6 - - - -',
        'C6 - - E6 - - - - F#6 - - E6 - - - -',
        'A5 - - C6 - - - - E6 - - - - - - -',
        'E6 - - - - - - - F6 - - - - - D6 -',
      ].join(' | '),
      bass: 'octave',
    },
    solo: {
      chords: 'Am9 | D9 | Am9 | D9 | Fmaj7 | G6 | Em7 | E7sus4 E7',
      melody: [
        'A5 - - - C6 - D6 - E6 - - - G6 - E6 -',
        'F#6 - - - - - - - E6 D6 C6 - A5 - - -',
        'B5 - C6 - D6 - E6 - - - D6 C6 B5 - A5 -',
        'F#5 - - - A5 - C6 - E6 - - - F#6 - - -',
        'A6 - - - G6 - E6 - - - - - C6 - - -',
        'D6 - - - B5 - D6 - E6 - G6 - - - - -',
        'F#6 - - - E6 - D6 - B5 - - - D6 - E6 -',
        'D6 - - - - - - - B5 - - - G#5 - - -',
      ].join(' | '),
      lead: 'alt',
      pad: false,
    },
    s: chorus,
  },
  form: ['intro', 'a', 'b', 's', 'solo', 'b', 's'],
  loopFrom: 1,
};
