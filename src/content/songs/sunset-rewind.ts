import { type SongDef, transposed } from '../../domain/music/song.ts';

// Rewinding one summer evening: a guitar riff that circles a pedal B, a talky B minor verse, a half-time climb in
// sequences, and a royal-road chorus of long high notes that land a beat early, the guitar wall opening only there.
// The band falls away to the wall alone, and the last chorus comes back a half step higher.
const chorus = {
  chords: 'Gmaj7 | A7 | F#m7 | Bm7 | Gmaj7 | A7 | F#7sus4 F#7 | Bm7',
  melody: [
    'B5 - D6 - F#6 - - E6',
    '- - - - C#6 - D6 E6',
    'F#6 - - - A5 - C#6 E6',
    '- - - - D6 - C#6 B5',
    'B5 - D6 - G6 - - F#6',
    '- - - - E6 - C#6 E6',
    '- - - - F#6 - E6 C#6',
    'D6 - - - - - . .',
  ].join(' | '),
  // The piano answers each held note with a falling run.
  counter: [
    '. . . . . . . .',
    '. C#6 B5 A5 G5 - - -',
    'A5 - - - - - - -',
    '. D6 C#6 B5 F#5 - - -',
    'G5 - - - - - - -',
    '. C#6 B5 A5 G5 - - -',
    'F#5 - - - A#5 - - -',
    '. F#6 D6 B5 F#5 - - -',
  ].join(' | '),
  lead: 'alt' as const,
};

export const sunsetRewind: SongDef = {
  id: 'sunset-rewind',
  title: 'Sunset Rewind',
  style: 'vocal-rock',
  mood: { valence: 0.1, energy: 0.6 },
  key: 'Bm',
  bpm: 146,
  sections: {
    intro: {
      chords: 'Gmaj7 | A7 | F#m7 | Bm7',
      melody: ['D6 B5 F#6 B5 E6 B5 D6 B5', 'C#6 A5 E6 A5 D6 A5 C#6 A5', 'C#6 A5 E6 A5 F#6 A5 E6 A5', 'D6 - - - C#6 - - -'].join(' | '),
      lead: 'alt',
    },
    a: {
      chords: 'Bm7 | Gmaj7 | Em7 | F#7sus4 F#7 | Bm7 | Gmaj7 | Em7 A7 | Dmaj7',
      melody: [
        '. F#5 A5 B5 C#6 - B5 A5',
        'B5 - - - . D5 E5 F#5',
        'G5 - F#5 E5 D5 - E5 F#5',
        'E5 - - - . C#5 E5 F#5',
        '. F#5 A5 B5 C#6 - B5 A5',
        'B5 - - - . B5 A5 G5',
        'F#5 - E5 D5 E5 - A5 C#6',
        'D6 - - - - - . .',
      ].join(' | '),
      drums: 'eight',
      bass: 'root-fifth',
      pad: false,
    },
    b: {
      chords: 'Em7 | F#m7 | Gmaj7 | A6 | Em7 | F#m7 | Gmaj7 | A7sus4 A7',
      melody: [
        'G5 - - A5 B5 - D6 -',
        'C#6 - - - - - . .',
        'A5 - - B5 D6 - F#6 -',
        'E6 - - - - - . .',
        'B5 - - C#6 D6 - G6 -',
        'F#6 - - - E6 - - -',
        'D6 - - E6 F#6 - E6 D6',
        'D6 - - - C#6 - A5 -',
      ].join(' | '),
      drums: 'half',
      harmony: 'pulse',
      bass: 'half',
      pad: false,
    },
    s: chorus,
    // Only the guitar wall holds on under the voice, then Bb7 points at E flat for the lift.
    brk: {
      chords: 'Gmaj7 | A7 | Bm7 | Bb7sus4 Bb7',
      melody: ['F#5 - - - D5 - E5 F#5', 'E5 - - - C#5 - D5 E5', 'F#5 - - - - - A5 -', 'Ab5 - - - F5 - Ab5 -'].join(' | '),
      drums: false,
      bass: false,
      harmony: false,
    },
    up: transposed(chorus, 1, 'Cm'),
    // Gmaj7 sits a fifth under C minor and a third over B minor: it lets the song step back down onto F#7.
    outro: {
      chords: 'Gmaj7 | F#7sus4 F#7',
      melody: 'D6 - - - B5 - - - | B5 - - - A#5 - C#6 -',
      drums: 'half',
    },
  },
  form: ['intro', 'a', 'b', 's', 'intro', 'b', 's', 'brk', 'up', 'outro'],
  loopFrom: 1,
};
