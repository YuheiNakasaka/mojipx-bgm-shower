import type { SongDef } from '../../domain/music/song.ts';

// A slow jig by the inn fire on a rainy night: a fiddle tunes up over a drone, the whistle climbs one arpeggio cell
// bar by bar, and the B part turns to the relative minor, leaps to a held high G over IV and sighs home.
const tune = {
  chords: 'D | G | D | Em7 | G | D/F# | Em7 | A7sus4',
  melody: [
    'A4 - - - D5 - F#5 - - - D5 -',
    'B4 - - - D5 - G5 - - - B5 -',
    'A5 - B5 A5 F#5 - D5 - E5 - F#5 -',
    'G5 - - - E5 - B4 - - - - -',
    'D5 - - - G5 - B5 - - - G5 -',
    'F#5 - - - A5 - D6 - E6 D6 A5 -',
    'B5 - A5 - G5 - E5 - F#5 - G5 -',
    'A5 - B5 A5 G5 - E5 - - - - -',
  ].join(' | '),
};

const home = {
  chords: 'D | G | D | Em7 | G | A | A7 | D',
  melody: [
    'A4 - - - D5 - F#5 - - - D5 -',
    'B4 - - - D5 - G5 - - - B5 -',
    'A5 - B5 A5 F#5 - D5 - E5 - F#5 -',
    'G5 - - - E5 - B4 - - - - -',
    'D5 - - - G5 - B5 - - - G5 -',
    'C#5 - - - E5 - A5 - B5 A5 E5 -',
    'G5 - F#5 - E5 - C#5 - - - E5 -',
    'D5 - - - - - - - - - . .',
  ].join(' | '),
  counter: [
    'D4 - - - - - F#4 - - - - -',
    'G4 - - - - - D4 - - - - -',
    'F#4 - - - - - A4 - - - - -',
    'G4 - - - - - E4 - - - - -',
    'B3 - - - - - D4 - - - - -',
    'C#4 - - - - - E4 - - - - -',
    'E4 - - - - - G4 - - - - -',
    'F#4 - - - - - - - - - - -',
  ].join(' | '),
};

const air = {
  chords: 'Bm | G | Em7 | F#7 | G | A | F#7 | Bm',
  melody: [
    'F#5 - - - B5 - D6 - - - - -',
    'E6 - D6 - B5 - G5 - - - B5 -',
    'A5 - - - G5 - E5 - - - - -',
    'F#5 - A#5 - C#6 - E6 - - - C#6 -',
    'D6 - - - B5 - G6 - - - - -',
    'F#6 - E6 - C#6 - A5 - - - C#6 -',
    'E6 - - - C#6 - A#5 - - - F#5 -',
    'B5 - - - - - - - - - . .',
  ].join(' | '),
  counter: [
    '. . . . . . F#5 - E5 - D5 -',
    'B4 - - - - - D5 - - - - -',
    'E4 - - - - - G4 - B4 - D5 -',
    'C#5 - - - - - A#4 - - - - -',
    'G4 - - - - - B4 - D5 - E5 -',
    'A4 - - - - - E4 - - - - -',
    'A#4 - - - - - C#5 - - - - -',
    '. . . . . . F#5 - E5 - D5 -',
  ].join(' | '),
};

export const hearthsideInn: SongDef = {
  id: 'hearthside-inn',
  title: 'Hearthside Inn',
  style: 'celtic-isle',
  mood: { valence: 0.5, energy: -0.5 },
  key: 'D',
  bpm: 100,
  meter: 3,
  steps: 4,
  sections: {
    intro: {
      chords: 'D | G/D | D | A7sus4',
      melody: 'A4 - - - - - D5 - - - F#5 - | B5 - - - - - A5 - G5 - - - | F#5 - - - - - E5 - D5 - E5 - | E5 - - - - - - - - - . .',
      counter: 'D4+A4 - - - - - - - - - - - | D4+A4 - - - - - - - - - - - | D4+A4 - - - - - - - - - - - | D4+A4 - - - - - - - - - - -',
      lead: 'alt',
      bass: 'whole',
      harmony: 'pad',
      drums: false,
    },
    a: { ...tune, bass: 'whole', drums: false },
    a2: home,
    b: { ...air, harmony: 'syncopate' },
    b2: {
      ...air,
      chords: 'Bm | G | Em7 | F#7 | G | A | G | A7sus4',
      melody: [
        'F#5 - - - B5 - D6 - - - - -',
        'E6 - D6 - B5 - G5 - - - B5 -',
        'A5 - - - G5 - E5 - - - - -',
        'F#5 - A#5 - C#6 - E6 - - - C#6 -',
        'D6 - - - B5 - G6 - - - - -',
        'F#6 - E6 - C#6 - A5 - - - C#6 -',
        'D6 - - - B5 - G5 - A5 - B5 -',
        'A5 - - - - - E5 - - - . .',
      ].join(' | '),
      counter: [
        '. . . . . . F#5 - E5 - D5 -',
        'B4 - - - - - D5 - - - - -',
        'E4 - - - - - G4 - B4 - D5 -',
        'C#5 - - - - - A#4 - - - - -',
        'G4 - - - - - B4 - D5 - E5 -',
        'A4 - - - - - E4 - - - - -',
        'B4 - - - - - D5 - - - - -',
        'A4 - - - - - E4 - - - - -',
      ].join(' | '),
      lead: 'alt',
      harmony: 'syncopate',
      bass: 'syncopated',
    },
    a3: {
      ...tune,
      counter: [
        'A3+E4 - - - - - - - - - - -',
        'A3+E4 - - - - - - - - - - -',
        'A3+E4 - - - - - - - - - - -',
        'A3+E4 - - - - - - - - - - -',
        'A3+E4 - - - - - - - - - - -',
        'A3+E4 - - - - - - - - - - -',
        'A3+E4 - - - - - - - - - - -',
        'A3+E4 - - - - - - - - - - -',
      ].join(' | '),
      lead: 'alt',
      bass: 'gallop',
    },
  },
  form: ['intro', 'a', 'a2', 'b', 'b2', 'a3'],
  loopFrom: 1,
  parts: { bass: 'bossa', drums: 'bossa' },
};
