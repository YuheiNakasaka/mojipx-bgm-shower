import type { SongDef } from '../../domain/music/song.ts';

// A cheeky, sweet idol funk: a slap bass and a city groove kit under a verse that hops on staccato offbeats, winks
// at the borrowed minor iv, and a chorus that floats on IVmaj7–III7–vi7–v7 I7 without ever landing on the tonic,
// sliding a semitone down from the IV's 3rd to the III7's 3rd for a grin.
const riff = {
  chords: 'Dmaj7 | C#m7 | Bm7 | E7sus4 E7',
  melody: 'A5 . F#5 A5 . C#6 . A5 | B5 . G#5 E5 - - . . | A5 . F#5 A5 . D6 . B5 | A5 - - - G#5 - . .',
};

const verse = {
  chords: 'Amaj7 | F#m9 | Bm7 | E9sus4 E7 | Dmaj7 | Dm6 | C#m7 F#7 | Bm7 E7sus4',
  melody: [
    '. C#5 E5 . G#5 - E5 .',
    'F#5 . E5 C#5 - - . .',
    '. D5 F#5 . A5 - F#5 .',
    'A5 . F#5 D5 - - . .',
    '. F#5 A5 . C#6 - A5 .',
    'B5 . A5 F5 - - . .',
    '. E5 G#5 . A#5 - G#5 .',
    'A5 . F#5 D5 - - E5 .',
  ].join(' | '),
  pad: false,
};

// The pre-chorus climbs the bass B–C#–D–E in long tones over brass hits, then stops for a breath.
const pre = {
  chords: 'Bm7 | C#m7 | Dmaj7 | E7sus4 E7',
  melody: 'F#5 - - - A5 - B5 - | G#5 - - - B5 - C#6 - | A5 - - - C#6 - E6 - | D6 - - - - - . .',
  harmony: 'stab' as const,
};

const chorus = {
  chords: 'Dmaj7 | C#7 | F#m7 | Em7 A7 | Dmaj7 | C#7 | F#m7 B7 | Bm7 E7',
  melody: [
    '. F#5 A5 C#6 - - A5 B5',
    '- - G#5 F5 - - . .',
    '. E5 A5 C#6 - - A5 B5',
    '- - G5 E5 - - . .',
    '. F#5 A5 C#6 - - E6 F#6',
    'F6 - - - - - . .',
    '. E6 C#6 A5 - - D#6 -',
    'D6 - - C#6 B5 - G#5 -',
  ].join(' | '),
  counter: [
    'D5 - - - - - F#5 -',
    'F5 - - - - - - -',
    'C#5 - - - - - E5 -',
    'D5 - - - C#5 - - -',
    'D5 - - - - - A5 -',
    'G#5 - - - - - - -',
    'A5 - - - F#5 - - -',
    'F#5 - - - E5 - D5 -',
  ].join(' | '),
  lead: 'alt' as const,
};

export const strawberryStrut: SongDef = {
  id: 'strawberry-strut',
  title: 'Strawberry Strut',
  style: 'idol-disco',
  mood: { valence: 0.4, energy: 0.35 },
  key: 'A',
  bpm: 114,
  parts: { bass: 'funk', drums: 'city' },
  sections: {
    intro: { ...riff, pad: false },
    a: verse,
    b: pre,
    s: chorus,
    // The riff again on the brighter voice, a low string line walking under it.
    brk: {
      ...riff,
      counter: 'F#4 - - - A4 - - - | G#4 - - - E4 - - - | F#4 - - - A4 - - - | B4 - - - G#4 - - -',
      lead: 'alt',
      pad: false,
    },
    // The second verse with strings holding long tones under it.
    a2: {
      ...verse,
      counter: [
        'A4 - - - - - - -',
        'A4 - - - - - B4 C#5',
        'B4 - - - - - - -',
        'B4 - - - - - - -',
        'A4 - - - - - - -',
        'D5 - - - - - - -',
        'C#5 - - - A#4 - - -',
        'B4 - - - - - - -',
      ].join(' | '),
      pad: true,
    },
  },
  form: ['intro', 'a', 'b', 's', 'brk', 'a2', 'b', 's'],
  loopFrom: 1,
};
