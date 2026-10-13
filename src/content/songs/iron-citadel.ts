import type { SongDef } from '../../domain/music/song.ts';

// A fortress boss in D minor: a melody climbing step by step while the bass sinks by semitones (then sung over that
// sinking line), a ♭VI–V standoff, a dark climax peaking over ♭II, and a breakdown grinding E♭ against a D pedal.
const climb = {
  chords: 'Dm | Dm/C# | Dm/C | G/B | Gm/Bb | A7 | Gm A7 | Dm',
  melody: [
    'D5 . A4 D5 F5 - E5 D5',
    'E5 . C#5 E5 G5 - F5 E5',
    'F5 . D5 F5 A5 - G5 F5',
    'G5 . D5 G5 B5 - A5 G5',
    'Bb5 - - A5 Bb5 - D6 -',
    'C#6 - - - - - E6 -',
    'D6 - Bb5 - C#6 - A5 -',
    'D6 - - - . . A5 C6',
  ].join(' | '),
};

const climax = {
  chords: 'Bb | C | A/C# | Dm | Gm | Eb/G | Dm/A | A7',
  melody: [
    'D6 - - - - - C6 D6',
    'E6 - - - - - D6 E6',
    'A6 - - - E6 - C#6 -',
    'D6 - - - - - . .',
    'Bb5 - D6 - G6 - - -',
    'Bb6 - - - G6 - Eb6 -',
    'F6 - - - D6 - A5 -',
    'C#6 - - - E6 - A5 -',
  ].join(' | '),
  bass: 'gallop' as const,
};

export const ironCitadel: SongDef = {
  id: 'iron-citadel',
  title: 'Iron Citadel',
  style: 'boss-rush',
  mood: { valence: -0.7, energy: 0.75 },
  key: 'Dm',
  bpm: 176,
  sections: {
    gate: {
      chords: 'Dm | Eb/D | Dm | A7b9',
      melody: ['D5 D5 A4 D5 F5 D5 E5 D5', 'Eb5 Eb5 Bb4 Eb5 G5 Eb5 F5 Eb5', 'D5 D5 A4 D5 F5 D5 A5 F5', 'C#5 - E5 - G5 - Bb5 -'].join(' | '),
      harmony: 'stab',
    },
    a: climb,
    a2: {
      ...climb,
      counter: [
        'D5 - - D5 - - D5 -',
        'C#5 - - C#5 - - C#5 -',
        'C5 - - C5 - - C5 -',
        'B4 - - B4 - - B4 -',
        'Bb4 - - Bb4 - - Bb4 -',
        'A4 - - A4 - - A4 -',
        'G4 - - - A4 - - -',
        'A4 - - - - - - -',
      ].join(' | '),
    },
    b: {
      chords: 'Bb | A7 | Gm | A7 | Bb | C | Eb | A7',
      melody: [
        'D5 - - F5 - - Bb5 -',
        'A5 - - - - - . .',
        'D5 - - G5 - - Bb5 -',
        'A5 - - - - - . .',
        'F5 - - Bb5 - - D6 -',
        'C6 - - - - - . .',
        'G5 - - Bb5 - - Eb6 -',
        'C#6 - - - - - - -',
      ].join(' | '),
      counter: [
        '. . . . . . . .',
        '. . . . E5 D5 C#5 A4',
        '. . . . . . . .',
        '. . . . G5 F5 E5 C#5',
        '. . . . . . . .',
        '. . . . G5 E5 C5 G4',
        '. . . . . . . .',
        '. . . . E5 C#5 A4 E4',
      ].join(' | '),
      drums: 'rock',
      bass: 'drive',
    },
    c: climax,
    grind: {
      chords: 'Dm | Dm | Eb/D | Eb/D | Dm | Dm | C#dim7 | A7',
      melody: [
        'F5 - - - - - - -',
        'E5 - - - D5 - - -',
        'Eb5 - - - - - - -',
        'D5 - - - Bb4 - - -',
        'F5 - - - A5 - - -',
        'D6 - - - - - - -',
        'C#6 - - - Bb5 - - -',
        'A5 - - - - - - -',
      ].join(' | '),
      counter: [
        'D4 D4 A3 D4 F4 D4 A3 D4',
        'D4 D4 A3 D4 F4 D4 A3 D4',
        'D4 D4 Bb3 D4 G4 D4 Bb3 D4',
        'D4 D4 Bb3 D4 G4 D4 Bb3 D4',
        'D4 D4 A3 D4 F4 D4 A3 D4',
        'D4 D4 A3 D4 F4 D4 A3 D4',
        'C#4 C#4 Bb3 C#4 E4 C#4 Bb3 C#4',
        'A3 A3 C#4 A3 E4 A3 G4 C#5',
      ].join(' | '),
      drums: 'robot',
      harmony: 'pad',
      bass: 'pedal',
    },
    c2: {
      ...climax,
      counter: [
        'F5 - - - - - - -',
        'G5 - - - - - - -',
        'C#6 - - - A5 - - -',
        'F5 - - - - - - -',
        'D5 - - - Bb5 - - -',
        'D6 - - - Bb5 - G5 -',
        'A5 - - - F5 - - -',
        'E5 - - - G5 - C#5 -',
      ].join(' | '),
    },
  },
  form: ['gate', 'a', 'a2', 'b', 'c', 'gate', 'grind', 'c2'],
  loopFrom: 1,
};
