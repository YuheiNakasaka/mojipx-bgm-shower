import type { SongDef } from '../../domain/music/song.ts';

// A sunny field march: the dotted stroll answered in the gaps, a Dorian turn where the second voice takes the step
// while the tune sings long, and a horizon of rising thirds over the borrowed flat VI and VII before it strolls on.
const strollChords = 'C | F/C | C | Gsus4 G';
const stroll = ['E5 - - F5 G5 . E5 .', 'A5 - - C6 F5 . . .', 'G5 - - E5 C5 . E5 .', 'D5 - - C5 B4 . . .'];
const thirds = ['C5 - - D5 E5 . C5 .', 'F5 - - A5 C5 . . .', 'E5 - - C5 G4 . C5 .', 'G4 - - A4 G4 . . .'];

export const meadowMarch: SongDef = {
  id: 'meadow-march',
  title: 'Meadow March',
  style: 'pixel-quest',
  mood: { valence: 0.65, energy: 0.15 },
  key: 'C',
  bpm: 136,
  sections: {
    intro: {
      chords: 'Ab | Bb | C | G7sus4 G7',
      melody: 'C5 - - Eb5 Ab5 - - - | D5 - - F5 Bb5 - - - | E5 - - G5 C6 - - - | D6 - - - B5 - - -',
      harmony: 'pad',
      bass: 'half',
    },
    a: {
      chords: `${strollChords} | Am7 | Fmaj7 | D7/F# | G7sus4 G7`,
      melody: [...stroll, 'E5 - - F5 G5 . B5 .', 'C6 - - A5 F5 . . .', 'F#5 - - A5 C6 . D6 .', 'D6 - - C6 B5 . . .'].join(' | '),
      counter: [
        '. . . . . . . .',
        '. . . . . A4 B4 C5',
        '. . . . . . . .',
        '. . . . . B4 A4 G4',
        '. . . . . . . .',
        '. . . . . A4 C5 E5',
        '. . . . . . . .',
        '. . . . . F5 D5 B4',
      ].join(' | '),
    },
    a2: {
      chords: `${strollChords} | Fmaj7 | Em7 | Ab Bb | C`,
      melody: [...stroll, 'A5 - - B5 C6 . A5 .', 'G5 - - A5 B5 . G5 .', 'C6 - - Eb6 D6 - F6 -', 'E6 - - - - - . .'].join(' | '),
      counter: [...thirds, 'F5 - - G5 A5 . F5 .', 'E5 - - - D5 . E5 .', 'Eb5 - - C5 D5 - F5 -', 'C5 - - - - - . .'].join(' | '),
    },
    b: {
      chords: 'Am7 | D | Fmaj7 | G | Am7 | D | Fmaj7 | Esus4 E',
      melody: [
        'E5 - - - A5 - - -',
        'F#5 - - - - - E5 D5',
        'E5 - - - C6 - - -',
        'B5 - - - - - A5 G5',
        'A5 - - - G5 - E5 -',
        'F#5 - - - A5 - D6 -',
        'C6 - - - - - B5 A5',
        'A5 - - - G#5 - - -',
      ].join(' | '),
      counter: [
        'A4 - - B4 C5 . A4 .',
        'D4 - - E4 F#4 . D4 .',
        'F4 - - G4 A4 . F4 .',
        'G4 - - A4 B4 . G4 .',
        'A4 - - B4 C5 . A4 .',
        'D4 - - E4 F#4 . A4 .',
        'F4 - - G4 A4 . C5 .',
        'E4 - - - B4 - G#4 -',
      ].join(' | '),
      harmony: 'broken',
      bass: 'half',
      drums: 'half',
    },
    c: {
      chords: 'Ab | Bb | C | Am7 | Ab | Bb | Fmaj7 | G7sus4 G7',
      melody: [
        'C6 - - - - - G5 C6',
        'D6 - - - - - C6 D6',
        'E6 - - - - - D6 E6',
        'G6 - - - E6 - C6 -',
        'Eb6 - - - - - D6 C6',
        'D6 - - - - - C6 Bb5',
        'C6 - - - A5 - F5 -',
        'G5 - - - - - . .',
      ].join(' | '),
      counter: [
        'Ab4 - - C5 Eb5 . C5 .',
        'Bb4 - - D5 F5 . D5 .',
        'C5 - - E5 G5 . E5 .',
        'A4 - - C5 E5 . C5 .',
        'Ab4 - - C5 Eb5 . C5 .',
        'Bb4 - - D5 F5 . D5 .',
        'A4 - - C5 F5 . C5 .',
        'D5 - - C5 B4 . G4 .',
      ].join(' | '),
      bass: 'gallop',
    },
    a3: {
      chords: `${strollChords} | Am7 | Fmaj7 | D7/F# | G7sus4 G7`,
      melody: [...stroll, 'E5 - - F5 G5 . C6 .', 'E6 - - D6 C6 . A5 .', 'F#5 - - A5 C6 . D6 .', 'D6 - - C6 B5 . G5 .'].join(' | '),
      counter: [...thirds, 'C5 - - D5 E5 . A5 .', 'C6 - - B5 A5 . F5 .', 'D5 - - F#5 A5 . B5 .', 'G5 - - A5 G5 . D5 .'].join(' | '),
    },
  },
  form: ['intro', 'a', 'a2', 'b', 'c', 'a3'],
  loopFrom: 1,
};
