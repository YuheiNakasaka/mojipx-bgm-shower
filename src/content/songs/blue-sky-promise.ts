import type { SongDef } from '../../domain/music/song.ts';

// Graduation-day hope: a verse over a tonic pedal, a pre-chorus climbing to the borrowed minor iv, a chorus that
// descends in sighs before rising chromatically through a secondary dominant, then a quiet drop chorus and a full last one.
const chorus = {
  chords: 'Dmaj7 | E/D | C#m7 | F#m7 | Bm7 | C#7 | Dmaj7 Dm6 | E7sus4 E7',
  melody: [
    'C#6 - - - D6 - C#6 -',
    'B5 - - - - - G#5 B5',
    '- - - - C#6 - B5 -',
    'A5 - - - - - F#5 D6',
    '- - - - E6 - D6 -',
    'F6 - - - - - - F#6',
    '- - - - F6 - - -',
    'E6 - - - - - . .',
  ].join(' | '),
};

const counter = [
  'F#5 - - - A5 - - -',
  'G#5 - - - E5 - D5 -',
  'E5 - - - - - G#5 -',
  'F#5 - - - A4 - - -',
  'F#5 - - - - - A5 -',
  'G#5 - - - B5 - - -',
  'A5 - - - - - - -',
  'A5 - - - G#5 - - -',
].join(' | ');

export const blueSkyPromise: SongDef = {
  id: 'blue-sky-promise',
  title: 'Blue Sky Promise',
  style: 'band-rock',
  mood: { valence: 0.6, energy: 0.45 },
  key: 'A',
  bpm: 140,
  sections: {
    intro: {
      chords: 'Dmaj7 | E/D | C#m7 F#m7 | Bm7 E7sus4',
      melody: 'C#6 - D6 C#6 A5 - F#5 A5 | B5 - - - G#5 - E5 - | B5 - C#6 B5 A5 - - - | D6 - B5 - A5 - - -',
      lead: 'alt',
    },
    a: {
      chords: 'A | D/A | A | D/A | F#m7 | Bm7 | Dmaj7 | Esus4 E',
      melody: [
        '. C#5 C#5 B4 C#5 - E5 -',
        'D5 - - C#5 B4 - A4 -',
        '. C#5 C#5 B4 C#5 - F#5 -',
        'E5 - - D5 C#5 - . .',
        '. A4 A4 G#4 A4 - C#5 -',
        'B4 - - A4 F#4 - . .',
        '. F#4 A4 C#5 E5 - D5 C#5',
        'B4 - A4 - G#4 - . .',
      ].join(' | '),
      pad: false,
      harmony: 'arp-updown',
      bass: 'half',
      drums: 'half',
    },
    b: {
      chords: 'F#m7 | E/G# | A | Dmaj7 | Bm7 | C#m7 | Dm6 | E7sus4 E7',
      melody: [
        'C#5 - - - B4 C#5 E5 -',
        'E5 - D5 - B4 - . .',
        'E5 - - - D5 E5 A5 -',
        'A5 - F#5 - E5 - . .',
        'F#5 - - - E5 F#5 A5 -',
        'G#5 - - - E5 - . .',
        'F5 - - - D5 - F5 -',
        'A5 - - - G#5 - B5 -',
      ].join(' | '),
      harmony: 'arp-up',
      bass: 'root-fifth',
      drums: 'eight',
    },
    s: { ...chorus, lead: 'alt' },
    drop: { ...chorus, harmony: 'arp-updown', bass: 'whole', drums: false },
    last: { ...chorus, counter, lead: 'alt' },
    outro: { chords: 'Dmaj7 | Dm6', melody: 'F#5 - - - A5 - - - | F5 - - - E5 - . .', harmony: 'arp-updown', drums: 'half' },
  },
  form: ['intro', 'a', 'b', 's', 'intro', 'b', 'drop', 'last', 'outro'],
  loopFrom: 1,
};
