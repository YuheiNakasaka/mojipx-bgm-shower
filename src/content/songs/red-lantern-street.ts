import type { SongDef } from '../../domain/music/song.ts';

// A back-alley farewell in minor-key kayo: a falling-bass verse over a habanera bass, the flat-nine of the dominant held
// as a sob, a chorus that climbs to it on an anticipation, and a second chorus that turns into a bolero.
const chorus = {
  chords: 'Fmaj7 | G7 | E7b9 | Am Am/G | Dm7 | E7b9 | Fmaj7 Dm7 | E7sus4 E7',
  melody: [
    'E6 - - - - - C6 E6',
    'D6 - - - - - B5 -',
    'G#5 - - - B5 - D6 -',
    'C6 - - - B5 - A5 -',
    'A5 - - - D6 - - F6',
    '- - - - E6 - D6 -',
    'C6 - - - A5 - - -',
    'B5 - A5 - G#5 - - -',
  ].join(' | '),
  counter: [
    'A4 - C5 - E5 - - -',
    'F5 - - - D5 - B4 -',
    'B4 - - - D5 - F5 -',
    'A4 - - - E4 - - -',
    'F4 - - - A4 - - -',
    'G#4 - - - B4 - D5 -',
    'A4 - - - F4 - - -',
    'E4 - - - B4 - - -',
  ].join(' | '),
  lead: 'alt' as const,
};

export const redLanternStreet: SongDef = {
  id: 'red-lantern-street',
  title: 'Red Lantern Street',
  style: 'showa-ballad',
  mood: { valence: -0.6, energy: -0.35 },
  key: 'Am',
  bpm: 76,
  sections: {
    intro: {
      chords: 'Dm7 | E7b9 | Am Am/G | Fmaj7 E7',
      melody: 'A5 - - - - - C6 B5 | G#5 - - - F5 - E5 - | A5 - - - C6 - B5 - | A5 - - - G#5 - - -',
      lead: 'alt',
      bass: 'whole',
      drums: false,
    },
    a: {
      chords: 'Am | Am/G | Fmaj7 | E7b9 | Dm7 | G7 | Cmaj7 Fmaj7 | Bm7b5 E7b9',
      melody: [
        'E5 - - D5 C5 - B4 C5',
        'A4 - - - - - . .',
        'C5 - - B4 A4 - E5 -',
        'F5 - - - E5 - . .',
        'D5 - - E5 F5 - A5 -',
        'G5 - - - F5 - D5 -',
        'E5 - - - C5 - A4 -',
        'B4 - - - G#4 - . .',
      ].join(' | '),
      counter: [
        '. . . . . . . .',
        '. . . . C5 B4 A4 G4',
        'F4 - - - - - - -',
        'G#4 - - - - - B4 D5',
        'C5 - - - - - - -',
        'B4 - - - - - - -',
        'G4 - - - A4 - - -',
        'F4 - - - E4 - G#4 B4',
      ].join(' | '),
      pad: false,
      bass: 'syncopated',
    },
    b: {
      chords: 'Dm7 | Em7 | Fmaj7 | E7sus4 E7',
      melody: 'D5 - - E5 F5 - - - | E5 - - F#5 G5 - - - | F5 - - G5 A5 - - - | A5 - - - G#5 - B5 -',
      counter: 'A4 - - - - - D5 C5 | B4 - - - - - E5 D5 | C5 - - - - - F5 E5 | D5 - - - B4 - D5 -',
      harmony: 'syncopate',
      drums: 'half',
    },
    s: chorus,
    bolero: { ...chorus, bass: 'syncopated', harmony: 'syncopate', drums: 'bossa' },
    inter: {
      chords: 'Am Am/G | Fmaj7 E7',
      melody: 'A5 - - - C6 - B5 - | A5 - - - G#5 - - -',
      lead: 'alt',
      bass: 'whole',
      drums: false,
    },
  },
  form: ['intro', 'a', 'b', 's', 'bolero', 'inter'],
  loopFrom: 1,
};
