import type { SongDef } from '../../domain/music/song.ts';

// The day's diary at a save point under the stars: a Lydian theme floating between I and II with echoes in its rests,
// a middle part leaping to its highest note, and a flat-six, flat-seven cadence before the loop drifts open on the #4.
const theme = {
  chords: 'Amaj7 | B/A | Amaj7 | B/A | F#m7 | G#m7 | Dmaj7 | E9sus4',
  melody: [
    '. . E5 A5 - B5 C#6 -',
    'D#6 - - - - - . .',
    '. . A5 C#6 - E6 G#6 -',
    'F#6 - - - - - . .',
    '. . F#5 A5 - B5 C#6 -',
    'D#6 - - - B5 - - -',
    '. . A5 C#6 - E6 F#6 -',
    'E6 - - - - - . .',
  ].join(' | '),
};

export const constellationDiary: SongDef = {
  id: 'constellation-diary',
  title: 'Constellation Diary',
  style: 'starlit-dream',
  mood: { valence: 0.05, energy: -0.7 },
  key: 'A',
  bpm: 72,
  sections: {
    intro: {
      chords: 'Amaj7 | B/A',
      melody: 'E6 - - B5 - - G#6 - | F#6 - - D#6 - - . .',
    },
    a: theme,
    b: {
      chords: 'Dmaj7 | C#m7 | Bm7 | E7 | Dmaj7 | C#m7 F#7 | Bm7 | E7sus4 E7',
      melody: [
        'A5 - - - F#6 - - -',
        'E6 - - - - - B5 C#6',
        'D6 - - - - - . .',
        'B5 - - - G#5 - - -',
        'A5 - - - F#6 - - G#6',
        '- - - - F#6 - E6 -',
        'D6 - - - - - C#6 B5',
        'A5 - - - G#5 - - -',
      ].join(' | '),
      harmony: 'arp-updown',
      bass: 'half',
    },
    a2: {
      ...theme,
      counter: [
        'C#5 - - - - - - -',
        'B4 - - - - - F#5 -',
        'E5 - - - - - - -',
        'D#5 - - - - - B4 -',
        'A4 - - - - - - -',
        'B4 - - - - - D#5 -',
        'F#5 - - - - - - -',
        'D5 - - - - - B4 -',
      ].join(' | '),
    },
    coda: {
      chords: 'Fmaj7 | G6 | Amaj7 | B/A',
      melody: 'E6 - - - C6 - A5 - | B5 - - - D6 - E6 - | C#6 - - - - - . . | D#6 - - - - - . .',
      counter: 'C5 - - - A4 - - - | D5 - - - B4 - - - | E5 - - - - - - - | D#5 - - - - - - -',
      harmony: 'arp-down',
    },
  },
  form: ['intro', 'a', 'b', 'a2', 'coda'],
  loopFrom: 1,
};
