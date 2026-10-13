// A lazy sunny afternoon swinging in the garden, in lo-fi: a verse that leans on bright sixths over add9 chords and
// warms through G♯7 and F♯9, and a chorus that climbs to its high E and lets it cloud for a bar on the borrowed Am6.
import type { SongDef } from '../../domain/music/song.ts';

const verse = ['. G#5 B5 C#6 - - B5 G#5', 'F#5 - - - E5 - C#5 -', '. E5 G#5 B5 - - G#5 F#5', 'G#5 - - - F#5 - D#5 -'];

const chorus = {
  chords: 'Aadd9 | B6 | G#m7 | C#m9 | F#m9 | Am6 | E/G# C#m7 | F#m9 B9sus4',
  melody: [
    'B5 - - - - - C#6 D#6',
    '- - - - C#6 - B5 -',
    '. F#5 G#5 B5 - - D#6 -',
    '- - C#6 - B5 - G#5 -',
    '. A5 C#6 E6 - - - -',
    '- - - - C6 - A5 -',
    'B5 - - - G#5 - E5 -',
    'A5 - - - - - . .',
  ].join(' | '),
  bass: 'groove' as const,
  harmony: 'syncopate' as const,
};

export const gardenHammock: SongDef = {
  id: 'garden-hammock',
  title: 'Garden Hammock',
  style: 'lofi-loop',
  mood: { valence: 0.6, energy: -0.45 },
  key: 'E',
  bpm: 84,
  sections: {
    intro: {
      chords: 'Aadd9 | B6',
      melody: '. C#6 B5 G#5 - - F#5 E5 | D#5 - - - . . . .',
      drums: false,
      harmony: 'pad',
      bass: 'whole',
    },
    a: {
      chords: 'Eadd9 | Aadd9 | C#m7 | B6 | Eadd9 | G#7 | C#m7 F#9 | Amaj7 B9sus4',
      melody: [...verse, '. G#5 B5 C#6 - - B5 G#5', 'F#5 - - - D#5 - B#4 -', '. C#5 E5 G#5 A#5 - G#5 -', 'G#5 - - - F#5 - - .'].join(' | '),
    },
    s: chorus,
    a2: { chords: 'Eadd9 | Aadd9 | C#m7 | B6', melody: verse.join(' | '), drums: 'half' },
    s2: {
      ...chorus,
      counter: [
        'E5 - - - C#5 - - -',
        'D#5 - - - F#5 - - -',
        'B4 - - - D#5 - - -',
        'E5 - - - - - - -',
        'C#5 - - - - - - -',
        'C5 - - - E5 - - -',
        'E5 - - - C#5 - - -',
        'A4 - - - - - - -',
      ].join(' | '),
      bass: 'walk',
    },
  },
  form: ['intro', 'a', 's', 'a2', 's2'],
  loopFrom: 1,
};
