// Looking at an old summer photo: the verse walks a falling bass line, the pre-chorus climbs on the old motif,
// and the royal-road chorus turns its major four minor (F sharp sinking to F) just as the memory starts to hurt.
import type { SongDef } from '../../domain/music/song.ts';

const chorus = {
  chords: 'Dmaj7 | E | C#m7 | F#m7 | Dmaj7 | Dm6 | C#m7 F#7 | Bm7 E7sus4',
  melody: [
    'E6 - - - C#6 - - B5',
    '- - - - G#5 - B5 -',
    'E6 - - - B5 - - A5',
    '- - - - . . A5 B5',
    'C#6 - - - E6 - F#6 -',
    'F6 - - - - - E6 D6',
    'E6 - - - A#5 - C#6 -',
    'D6 - - - B5 - - -',
  ].join(' | '),
  harmony: 'backbeat' as const,
  // The verses keep the song-wide half time; the chorus opens up into a straight eight-beat and an octave bass.
  drums: 'eight' as const,
  bass: 'octave' as const,
};

export const snapshotSummer: SongDef = {
  id: 'snapshot-summer',
  title: 'Snapshot Summer',
  style: 'nineties-pop',
  mood: { valence: 0.1, energy: 0.05 },
  key: 'A',
  bpm: 118,
  parts: { drums: 'half', bass: 'ballad', harmony: 'broken' },
  sections: {
    intro: {
      chords: 'Dmaj7 | E/D | C#m7 F#m7 | Bm7 E7sus4',
      melody: 'E6 - - - C#6 - - B5 | - - - - G#5 - B5 - | E6 - - - B5 - A5 - | B5 - - - - - . .',
      drums: false,
      bass: 'whole',
    },
    a: {
      chords: 'Amaj7 | E/G# | F#m7 | F#m7/E | Dmaj7 | C#m7 | Bm7 | E7sus4 E7',
      melody: [
        '. E5 A5 G#5 A5 - E5 -',
        'G#5 - - - . E5 F#5 G#5',
        'A5 - - F#5 E5 - F#5 -',
        'C#5 - - B4 A4 - . .',
        '. E5 A5 G#5 A5 - C#6 -',
        'B5 - - - G#5 - E5 F#5',
        'A5 - - - F#5 - E5 D5',
        'B4 - A4 - G#4 - - -',
      ].join(' | '),
    },
    b: {
      chords: 'Dmaj7 | E/D | C#m7 | F#m7 | Bm7 | C#m7 | Dmaj7 | E7sus4 E7',
      melody: [
        'E5 F#5 A5 - - - B5 A5',
        'B5 - G#5 - E5 - F#5 G#5',
        'E5 F#5 G#5 - - - B5 G#5',
        'A5 - - - . F#5 E5 C#5',
        'F#5 A5 C#6 - - - D6 C#6',
        'B5 - - - E6 - D6 B5',
        'C#6 - B5 - A5 - - -',
        'B5 - A5 F#5 G#5 - - -',
      ].join(' | '),
    },
    s: chorus,
    s2: {
      ...chorus,
      counter: [
        'A5 - - - F#5 - - -',
        'G#5 - - - E5 - - -',
        'G#5 - - - E5 - - -',
        'F#5 - - - C#6 - B5 A5',
        'A5 - - - F#5 - - -',
        'F5 - - - - - - -',
        'E5 - - - - - - -',
        'F#5 - - - D5 - - -',
      ].join(' | '),
    },
    outro: { chords: 'Dmaj7 | E7sus4 E7', melody: 'C#6 - - - - - - - | B5 - - - - - . .' },
  },
  form: ['intro', 'a', 'b', 's', 'intro', 'b', 's2', 'outro'],
  loopFrom: 1,
};
