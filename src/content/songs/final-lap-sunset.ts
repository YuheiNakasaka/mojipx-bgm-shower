import { type SongDef, transposed } from '../../domain/music/song.ts';

// The last lap at golden hour in eighties fusion: a Lydian verse over an E pedal, a pre-chorus climbing by thirds on
// the band's stabs, a IV–V/IV–iii–vi chorus whose rising arpeggios land a beat early, and a last chorus lifted a semitone.
const chorus = {
  chords: 'Amaj7 | B/A | G#m7 | C#m7 | F#m7 | G#7 | Amaj7 B/A | B7sus4 B7',
  melody: [
    'G#5 - - - B5 - - - E6 - - - - - D#6 -',
    '- - - - - - C#6 - B5 - - - F#5 - G#5 -',
    'F#5 - - - B5 - - - D#6 - - - - - C#6 -',
    '- - - - - - B5 - G#5 - - - E5 - F#5 G#5',
    'A5 - - - C#6 - - - F#6 - - - - - D#6 -',
    '- - - - - - - - C6 - - - D#6 - C6 -',
    'C#6 - - - - - - - B5 - - - C#6 - D#6 -',
    'E6 - - - - - - - D#6 - - - - - . .',
  ].join(' | '),
  counter: [
    'E5 - - - - - - - - - - - C#5 - - -',
    '. . . . D#5 - F#5 - A5 - - - F#5 - - -',
    'D#5 - - - - - - - - - - - F#5 - - -',
    '. . . . E5 - G#5 - B5 - - - G#5 - - -',
    'C#5 - - - - - - - A5 - - - - - - -',
    '. . . . C5 - D#5 - F#5 - - - D#5 - - -',
    'E5 - - - - - - - D#5 - - - F#5 - - -',
    'B4 - - - - - - - A4 - - - - - - -',
  ].join(' | '),
  lead: 'alt' as const,
};

export const finalLapSunset: SongDef = {
  id: 'final-lap-sunset',
  title: 'Final Lap Sunset',
  style: 'fusion-drive',
  mood: { valence: 0.6, energy: 0.75 },
  key: 'E',
  bpm: 150,
  steps: 4,
  sections: {
    intro: {
      chords: 'Amaj7 | B/A | Cmaj7 | D/E',
      melody: [
        'G#5 - - - B5 - - - E6 - - - - - D#6 -',
        '- - - - - - C#6 - B5 - - - F#5 - G#5 -',
        'G5 - - - B5 - - - E6 - - - - - F#6 -',
        '- - - - - - E6 - D6 - - - A5 - F#5 -',
      ].join(' | '),
    },
    a: {
      chords: 'Emaj7 | F#/E | Emaj7 | F#/E | C#m7 | G#m7 | Amaj7 | Bsus4 B',
      melody: [
        '. . . . G#4 - B4 - . B4 C#5 - B4 - G#4 -',
        'A#4 - - - - - - - . . F#4 G#4 A#4 - C#5 -',
        'D#5 - - - - - B4 - . B4 C#5 - B4 - G#4 -',
        'A#4 - - - - - - - - - - - . . . .',
        '. . . . E5 - G#5 - . G#5 A5 - G#5 - E5 -',
        'F#5 - - - - - - - . . D#5 - F#5 - G#5 -',
        'B5 - - - - - A5 - . G#5 E5 - C#5 - E5 -',
        'F#5 - - - E5 - - - D#5 - - - - - . .',
      ].join(' | '),
      pad: false,
      bass: 'groove',
    },
    b: {
      chords: 'F#m7 | G#m7 | Amaj7 | B | G#m7 C#m7 | F#m7 B | Cmaj7 | B7sus4 B7',
      melody: [
        'C#5 - - - - - E5 - - - - - A5 - - -',
        'B5 - - - - - G#5 - - - - - F#5 G#5 F#5 D#5',
        'E5 - - - - - G#5 - - - - - C#6 - - -',
        'D#6 - - - - - B5 - - - - - A5 B5 A5 F#5',
        'G#5 - - - - - B5 - - - - - E6 - - -',
        'E6 - - - - - C#6 - - - - - D#6 - - -',
        'G5 - - - - - B5 - - - - - E6 - - -',
        '- - - - - - - - D#6 - - - - - . .',
      ].join(' | '),
      drums: 'half',
    },
    s: chorus,
    lift: { chords: 'C7sus4 C7', melody: 'F6 - - - - - - - E6 - - - - - C6 -', key: 'F', lead: 'alt' },
    up: transposed(chorus, 1, 'F'),
    outro: {
      chords: 'Fmaj7 | B7sus4 B7',
      melody: 'F6 - - - - - - - E6 - - - C6 - A5 - | E5 - - - - - - - D#5 - - - - - . .',
      drums: 'half',
    },
  },
  form: ['intro', 'a', 'b', 's', 'intro', 'b', 's', 'lift', 'up', 'outro'],
  loopFrom: 1,
};
