import { type SongDef, transposed } from '../../domain/music/song.ts';

// An eight-beat summer anthem: a canon verse that starts off the beat, a pre-chorus pushing in 3+3+2,
// a royal-road chorus that opens on a long high note, a guitar solo over a borrowed flat seven, and a last chorus up a step.
const chorus = {
  chords: 'Gmaj7 | A | F#m7 | Bm7 | Gmaj7 | A | F#m7 B7 | Em7 A7sus4',
  melody: [
    'D6 - - - - - E6 F#6',
    'E6 - C#6 - A5 - . .',
    'C#6 - - - - - D6 E6',
    'D6 - B5 - F#5 - . .',
    'D6 - - - - - E6 F#6',
    'E6 - C#6 - E6 - - F#6',
    '- - - - D#6 - B5 -',
    'E6 - - - D6 - - -',
  ].join(' | '),
  counter: [
    'B4 - - - - - - -',
    'C#5 - - - - - E5 F#5',
    'E5 - - - C#5 - - -',
    'D5 - - - - - F#5 E5',
    'D5 - - - - - - -',
    'C#5 - - - E5 - - -',
    'A4 - - - B4 - D#5 -',
    'B4 - - - A4 - - -',
  ].join(' | '),
  lead: 'alt' as const,
};

export const runningThroughSummer: SongDef = {
  id: 'running-through-summer',
  title: 'Running Through Summer',
  style: 'band-rock',
  mood: { valence: 0.3, energy: 0.7 },
  key: 'D',
  bpm: 148,
  sections: {
    intro: {
      chords: 'D | Bm7 | Gmaj7 | Asus4 A',
      melody: 'F#5 - A5 D6 - E6 F#6 - | E6 - D6 B5 - A5 B5 - | D6 - B5 A5 - F#5 A5 - | D6 - - - C#6 A5 E5 C#5',
      lead: 'alt',
    },
    a: {
      chords: 'D | A/C# | Bm7 | F#m7 | Gmaj7 | D/F# | Em7 | Asus4 A',
      melody: [
        '. . F#4 A4 D5 - C#5 D5',
        'E5 - C#5 - A4 - . .',
        '. . D4 F#4 B4 - A4 B4',
        'C#5 - A4 - F#4 - . .',
        '. . G4 B4 D5 - C#5 D5',
        'F#5 - E5 - D5 - . .',
        '. . E5 F#5 G5 - F#5 E5',
        'D5 - - - C#5 - . .',
      ].join(' | '),
      pad: false,
      harmony: 'broken',
      bass: 'root-fifth',
      drums: 'eight',
    },
    b: {
      chords: 'Em7 | F#m7 | Gmaj7 | A | F#7 | Bm7 | Em7 | A7sus4 A7',
      melody: [
        'B4 - - E5 - - G5 -',
        'F#5 - - E5 - - C#5 -',
        'D5 - - G5 - - B5 -',
        'A5 - - G5 - - E5 -',
        'F#5 - - A#5 - - C#6 -',
        'B5 - - A5 - - F#5 -',
        'G5 - - B5 - - D6 -',
        'D6 - - - C#6 - . .',
      ].join(' | '),
      harmony: 'syncopate',
      bass: 'syncopated',
      drums: 'push',
    },
    s: chorus,
    solo: {
      chords: 'Bm7 | Gmaj7 | C | Asus4 A',
      melody: 'D5 F#5 B5 - A5 B5 D6 - | F#6 - - - E6 - D6 B5 | C6 - - - E6 - G6 - | E6 - D6 - C#6 - A5 -',
      lead: 'alt',
    },
    lift: { chords: 'B7sus4 B7', melody: 'B5 - E6 - D#6 - F#6 -', key: 'E', lead: 'alt', bass: 'whole', harmony: 'pad', drums: false },
    up: transposed(chorus, 2, 'E'),
    outro: { chords: 'Cmaj7 | Asus4 A', melody: 'G5 - - - E5 - D5 - | D5 - - - C#5 - . .', harmony: 'broken', drums: 'half' },
  },
  form: ['intro', 'a', 'b', 's', 'intro', 'solo', 'b', 's', 'lift', 'up', 'outro'],
  loopFrom: 1,
};
