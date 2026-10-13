import type { SongDef } from '../../domain/music/song.ts';

// A port town at seven: a skipping market tune sung in thirds, a sailor whistling the dawn motif one key over,
// and gulls crying falling fourths between the phrases.
const tune = {
  chords: 'Gmaj7 | Em7 | Am7 | D7 | Gmaj7 | E7 | Am7 D7 | G',
  melody: [
    '. D5 E5 F#5 G5 - D5 -',
    '. B4 C5 D5 E5 - B4 -',
    '. C5 D5 E5 A5 - G5 E5',
    'F#5 - - E5 D5 - . .',
    '. D5 E5 F#5 G5 - B5 -',
    '. B4 D5 E5 G#5 - E5 -',
    'C6 - - B5 A5 - F#5 -',
    'G5 - - - . . . .',
  ].join(' | '),
};

export const harborTownMorning: SongDef = {
  id: 'harbor-town-morning',
  title: 'Harbor Town Morning',
  style: 'cozy-village',
  mood: { valence: 0.65, energy: -0.35 },
  key: 'G',
  bpm: 112,
  sections: {
    gulls: {
      chords: 'Cmaj7 | Bm7 | Am7 | D7sus4',
      melody: 'E6 . B5 . . . . . | D6 . A5 . . . . . | E6 . B5 . . . D6 B5 | A5 - - - . . . .',
      harmony: 'broken',
      bass: 'whole',
      drums: false,
    },
    a: tune,
    a2: {
      ...tune,
      counter: [
        '. B4 C5 D5 E5 - B4 -',
        '. G4 A4 B4 B4 - G4 -',
        '. A4 B4 C5 E5 - E5 C5',
        'D5 - - C5 A4 - . .',
        '. B4 C5 D5 E5 - G5 -',
        '. G#4 B4 B4 E5 - B4 -',
        'A5 - - G5 F#5 - D5 -',
        'G5 - - - . . E6 B5',
      ].join(' | '),
    },
    b: {
      key: 'C',
      chords: 'Cmaj7 | Fmaj7 G7 | Am7 | Dm7 G7 | Fmaj7 | E7 | Am7 D7 | D7sus4 D7',
      melody: [
        'C5 - - D5 G5 - - -',
        'F5 - E5 - D5 - - -',
        'A4 - - B4 E5 - - -',
        'D5 - C5 - B4 - - -',
        '. A4 C5 E5 A5 - G5 -',
        'G#5 - - - E5 - D5 -',
        'C6 - - - A5 - F#5 -',
        'G5 - - - F#5 - - -',
      ].join(' | '),
      counter: [
        '. . . . E5 - D5 C5',
        'A4 - - - B4 - - -',
        '. . . . C5 - B4 A4',
        'F4 - - - G4 - - -',
        'F4 - - - C5 - - -',
        'E5 - - - B4 - - -',
        'E5 - - - A5 - - -',
        'C6 - - - - - - -',
      ].join(' | '),
      harmony: 'broken',
      bass: 'half',
    },
    a3: {
      ...tune,
      counter: [
        '. . . . . . . .',
        '. . . . . . E6 B5',
        '. . . . . . . .',
        '. . . . . . D6 A5',
        '. . . . . . . .',
        '. . . . . . E6 B5',
        '. . . . . . . .',
        '. . . . E6 B5 E6 B5',
      ].join(' | '),
    },
  },
  form: ['gulls', 'a', 'a2', 'b', 'a3', 'gulls'],
  loopFrom: 1,
};
