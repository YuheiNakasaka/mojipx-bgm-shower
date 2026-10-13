import { type SongDef, transposed } from '../../domain/music/song.ts';

// A beach dance under lanterns: taiko and a sanshin riff, a 3+3+2 chorus hook bent into a secondary dominant, a last
// chorus a step up, then the drums stop and the lone sanshin plays the hook over a minor iv as the lanterns go out.
const chorus = {
  chords: 'Bbmaj7 | C7sus4 C7 | Am7 | Dm7 | Bbmaj7 | A7 | Dm7 Dm7/C | Gm7 C7sus4',
  melody: [
    'F6 - - E6 - - C6 -',
    'Bb5 C6 - - - - A5 -',
    'E6 - - C6 - - A5 -',
    'C6 - - - - - . .',
    'F6 - - E6 - - F6 G6',
    '- - - E6 - - C#6 -',
    'F6 - - - - - E6 -',
    'D6 - - - C6 - - -',
  ].join(' | '),
  lead: 'alt' as const,
  harmony: 'offbeat' as const,
  drums: 'taiko' as const,
};

export const islandFestivalNight: SongDef = {
  id: 'island-festival-night',
  title: 'Island Festival Night',
  style: 'island-breeze',
  mood: { valence: 0.6, energy: 0.2 },
  key: 'F',
  bpm: 118,
  sections: {
    intro: {
      chords: 'F | Bbmaj7 | F | C7sus4 C7',
      melody: 'A5 C6 F6 - E6 C6 A5 C6 | Bb5 - A5 F5 - - . . | A5 C6 F6 - E6 C6 E6 F6 | G6 - F6 - E6 - C6 -',
      harmony: 'offbeat',
      drums: 'taiko',
    },
    a: {
      chords: 'F | Bb/F | F | Bb/F | Dm7 | Am7 | Bbmaj7 | C7sus4 C7',
      melody: [
        '. . C5 C5 A4 C5 - -',
        'Bb4 A4 F4 - - - . .',
        '. . C5 C5 A4 C5 - E5',
        'F5 - - - - - . .',
        '. . F5 F5 E5 C5 - A4',
        'C5 - - - A4 - - -',
        '. . Bb4 C5 Bb4 A4 - F4',
        'G4 - - - - - . .',
      ].join(' | '),
    },
    b: {
      chords: 'Gm7 | Am7 | Bbmaj7 | C | Gm7 | Am7 | Bbmaj7 Bb/C | C7',
      melody: [
        '. . Bb4 C5 D5 - F5 -',
        'E5 - - - C5 - - -',
        '. . C5 D5 F5 - A5 -',
        'G5 - - - E5 - - -',
        '. . D5 F5 Bb5 - D6 -',
        'C6 - - - - - . .',
        'D6 - - - C6 - - -',
        'E6 - - - - - . .',
      ].join(' | '),
      bass: 'walk',
      drums: 'half',
    },
    s: chorus,
    lift: { chords: 'D7sus4 D7', melody: 'G5 - A5 - C6 - D6 -', key: 'G', lead: 'alt', drums: false },
    up: transposed(
      {
        ...chorus,
        counter: [
          'D5 - - C5 - - A4 -',
          'F5 - - - E5 - - -',
          'C5 - - A4 - - E4 -',
          'F4 - - - A4 C5 D5 F5',
          'D5 - - C5 - - D5 E5',
          'E5 - - - C#5 - - -',
          'D5 - - - C5 - - -',
          'Bb4 - - - - - - -',
        ].join(' | '),
      },
      2,
      'G',
    ),
    outro: {
      chords: 'Bbmaj7 | Bbm6 | Am7 Dm7 | Gm7 C7sus4',
      melody: 'F6 - - - E6 - C6 - | Db6 - - - C6 - Bb5 - | A5 - - - - - . . | G5 - - - - - . .',
      harmony: 'broken',
      bass: 'whole',
      drums: false,
    },
  },
  form: ['intro', 'a', 'b', 's', 'intro', 'lift', 'up', 'outro'],
  loopFrom: 1,
};
