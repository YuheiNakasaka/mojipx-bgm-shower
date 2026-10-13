import type { SongDef } from '../../domain/music/song.ts';

// A shooter stage above the clouds: long notes that swoop up in sixteenths over a bass falling to ♭VI–♭VII, flown again
// by twin leads in thirds, a minor run with an arpeggio escort, and a Lydian sky where the melody leaps sixths to its peak.
const theme = {
  chords: 'A | G | F#m7 | E | D | C#m7 | F G | E7sus4 E7',
  melody: [
    'C#6 - - - - - - - - - - - B5 C#6 D6 E6',
    'D6 - - - - - - - B5 - - - G5 - - -',
    'A5 - - - - - - - - - - - G#5 A5 B5 C#6',
    'B5 - - - - - - - G#5 - - - E5 - - -',
    'D6 - - - - - - - - - - - C#6 D6 E6 F#6',
    'E6 - - - - - - - C#6 - - - G#5 - - -',
    'A5 - - - C6 - - - B5 - - - D6 - - -',
    'E6 - - - - - - - D6 - - - B5 - - -',
  ].join(' | '),
};

const run = {
  chords: 'F#m | D | E | F#m | Bm7 | D | C#7sus4 | C#7',
  melody: [
    'C#6 - - - - - B5 - A5 - - - - - - -',
    'B5 - - - - - A5 - F#5 - - - - - - -',
    'G#5 - - - - - A5 - B5 - - - - - - -',
    'C#6 - - - - - - - - - - - . . . .',
    'D6 - - - - - C#6 - B5 - - - - - - -',
    'F#6 - - - - - E6 - D6 - - - - - - -',
    'F#6 - - - - - - - - - - - - - - -',
    'F6 - - - - - - - - - - - . . . .',
  ].join(' | '),
  harmony: 'arp16' as const,
  bass: 'octave' as const,
};

export const twinStarSquadron: SongDef = {
  id: 'twin-star-squadron',
  title: 'Twin Star Squadron',
  style: 'star-fighter',
  mood: { valence: 0.1, energy: 0.8 },
  key: 'A',
  bpm: 160,
  steps: 4,
  sections: {
    launch: {
      chords: 'A | G/A | F/A | E7sus4 E7',
      melody: [
        'A5 - - - - - - - E6 - - - - - - -',
        'D6 - - - - - - - B5 - - - G5 - - -',
        'C6 - - - - - - - A5 - - - F5 - - -',
        'E5 - - - A5 - - - G#5 - - - B5 - - -',
      ].join(' | '),
      drums: 'march',
    },
    a: theme,
    a2: {
      ...theme,
      counter: [
        'A5 - - - - - - - - - - - G#5 A5 B5 C#6',
        'B5 - - - - - - - G5 - - - D5 - - -',
        'F#5 - - - - - - - - - - - E5 F#5 G#5 A5',
        'G#5 - - - - - - - E5 - - - B4 - - -',
        'F#5 - - - - - - - - - - - E5 F#5 G#5 A5',
        'G#5 - - - - - - - E5 - - - C#5 - - -',
        'F5 - - - A5 - - - G5 - - - B5 - - -',
        'A5 - - - - - - - G#5 - - - - - - -',
      ].join(' | '),
    },
    b: run,
    b2: {
      ...run,
      counter: [
        '. . . . . . . . A4 C#5 F#5 C#5 E5 C#5 A4 C#5',
        '. . . . . . . . D4 F#4 A4 D5 C#5 A4 F#4 A4',
        '. . . . . . . . E4 G#4 B4 E5 D5 B4 G#4 B4',
        '. . . . . . . . . . . . C#5 E5 F#5 A5',
        '. . . . . . . . B4 D5 F#5 B5 A5 F#5 D5 F#5',
        '. . . . . . . . D5 F#5 A5 D6 A5 F#5 D5 F#5',
        'C#5 - - - F#5 - - - G#5 - - - B5 - - -',
        'C#5 - - - F5 - - - G#5 - - - B5 - - -',
      ].join(' | '),
    },
    sky: {
      chords: 'Fmaj7 | G | Em7 | Am7 | Dm7 | G | Fmaj7 | E7sus4 E7',
      melody: [
        'A5 - - - - - - - F6 - - - - - E6 -',
        'D6 - - - - - - - - - - - . . B5 D6',
        'B5 - - - - - - - G6 - - - - - F#6 -',
        'E6 - - - - - - - - - - - . . C6 E6',
        'F6 - - - - - - - - - - - E6 - D6 -',
        'D6 - - - - - - - B5 - - - - - . .',
        'C6 - - - F6 - - - A6 - - - - - - -',
        '- - - - - - - - G#6 - - - - - E6 -',
      ].join(' | '),
      counter: [
        'C5 - - - - - - - A5 - - - - - - -',
        'B4 - - - - - - - D5 - - - G5 - - -',
        'G5 - - - - - - - B5 - - - - - - -',
        'C6 - - - - - - - - - - - A5 - - -',
        'A5 - - - - - - - - - - - C6 - A5 -',
        'B5 - - - - - - - G5 - - - - - - -',
        'A5 - - - C6 - - - F6 - - - - - - -',
        'E6 - - - - - - - D6 - - - - - B5 -',
      ].join(' | '),
      drums: 'half',
      bass: 'half',
    },
  },
  form: ['launch', 'a', 'a2', 'b', 'b2', 'launch', 'sky', 'a2'],
  loopFrom: 1,
};
