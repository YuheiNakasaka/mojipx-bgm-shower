import type { SongDef } from '../../domain/music/song.ts';

// The companions' last night before parting, as a slow Dorian air over an open-fifth drone: the raised sixth on the
// major IV keeps hope in it, the middle strain turns to the relative major on a brighter voice, snapping up a sixth
// to a held ninth and peaking over the borrowed flat VI before sus4 sighs to the dominant, and the last strain closes
// on flat VI–flat VII–i.
const DRONE = 'E3+B3 - - - - - - - - - - -';
const droned = (bars: number): string => Array.from({ length: bars }, () => DRONE).join(' | ');

const STRAIN_CHORDS = 'Em | A/E | Em7 | Dadd9 | Gadd9 | D/F#';
const strain = [
  'E5 - - - F#5 - G5 - B5 - C#6 B5',
  'C#6 - - - - - - - B5 A5 B5 -',
  'G5 - A5 G5 - - F#5 - E5 - - -',
  'D5 - - - - - - - . . E5 F#5',
  'G5 - - - A5 - B5 - D6 - - -',
  'E6 - - - - - - - D6 C#6 D6 -',
];

export const partingEmbers: SongDef = {
  id: 'parting-embers',
  title: 'Parting Embers',
  style: 'celtic-isle',
  mood: { valence: 0.1, energy: -0.55 },
  key: 'Em',
  bpm: 88,
  meter: 3,
  steps: 4,
  sections: {
    intro: {
      chords: 'Em | A/E | Em | D/E',
      melody: '. . . . B4 - - - E5 - - - | C#5 - - - - - - - E5 - - - | B4 - - - - - - - G4 - - - | A4 - - - - - - - - - . .',
      counter: droned(4),
      lead: 'alt',
      harmony: 'pad',
      bass: 'whole',
      drums: false,
    },
    a: {
      chords: `${STRAIN_CHORDS} | A | Bm7`,
      melody: [...strain, 'C#6 - D6 C#6 - - B5 - A5 - - -', 'B5 - - - - - - - - - . .'].join(' | '),
      counter: droned(8),
      bass: 'whole',
      drums: false,
    },
    a2: {
      chords: `${STRAIN_CHORDS} | Dsus4 D | Em`,
      melody: [...strain, 'A5 - - - - - G5 - F#5 - D5 -', 'E5 - - - - - - - - - . .'].join(' | '),
      counter: [
        'G4 - - - - - - - E4 - - -',
        'E5 - - - - - - - C#5 - - -',
        'B4 - - - - - - - G4 - - -',
        'F#4 - - - - - - - A4 - B4 -',
        'D5 - - - - - - - B4 - - -',
        'A4 - - - - - - - F#4 - - -',
        'D5 - - - - - - - A4 - - -',
        'G4 - - - - - - - B4 - - -',
      ].join(' | '),
      drums: 'brush',
    },
    b: {
      chords: 'G | D/F# | Em7 | Cadd9 | G/B | Cmaj7 | B7sus4 | B7',
      melody: [
        'B5 D6 - - - - - - B5 - G5 -',
        'F#5 A5 - - - - - - F#5 - D5 -',
        'G5 E6 - - - - - - D6 - B5 -',
        'C6 D6 - - - - - - - - . .',
        'B5 D6 - - - - - - E6 - F#6 -',
        'G6 - - - - - - - E6 - D6 -',
        'F#6 - - - E6 - - - - - - -',
        'D#6 - - - - - - - - - . .',
      ].join(' | '),
      counter: [
        'G4 - - - - - - - D5 - - -',
        'D5 - - - - - - - A4 - - -',
        'B4 - - - - - - - G4 - - -',
        'E4 - - - - - - - G4 - - -',
        'D5 - - - - - - - G4 - - -',
        'E5 - D5 - C5 - B4 - G4 - - -',
        'A4 - - - - - - - B4 - - -',
        'F#4 - - - - - - - A4 - - -',
      ].join(' | '),
      lead: 'alt',
      harmony: 'arp-up',
      drums: 'boom',
    },
    a3: {
      chords: `${STRAIN_CHORDS} | Cmaj7 | Dsus4 D`,
      melody: [...strain, 'E6 - - - - - D6 - C6 - B5 -', 'A5 - - - - - - - - - . .'].join(' | '),
      counter: [
        'B4 - - - - - - - E4 - - -',
        'E5 - - - - - - - C#5 - - -',
        'B4 - - - - - - - G4 - - -',
        'F#4 - - - - - - - A4 - B4 -',
        'D5 - - - - - - - B4 - - -',
        'A4 - - - - - - - F#4 - - -',
        'G4 - - - - - - - E4 - - -',
        'G4 - - - - - - - D4 - - -',
      ].join(' | '),
      lead: 'alt',
      bass: 'ballad',
    },
  },
  form: ['intro', 'a', 'a2', 'b', 'a3', 'intro'],
  loopFrom: 1,
};
