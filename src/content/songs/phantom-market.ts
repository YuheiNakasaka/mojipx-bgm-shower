// A ghost market after midnight: the tiptoeing theme over a bass creeping down by semitones, then the same steps
// echoed a quarter later and an octave lower by a fainter voice, a lantern-lit B on the floating IVmaj7–III7–vi7
// loop of the relative major, a Phrygian haggle over F/E with a sly flat-seventh turn, and the theme back over a
// line that climbs against the falling bass.
import type { SongDef } from '../../domain/music/song.ts';

const themeChords = 'Em | Em/D# | Em/D | Em/C# | Cmaj7 | Am7 | F#m7b5 B7 | B7';

const theme = [
  'E5 . . B5 . . G5 .',
  'F#5 . G5 . F#5 . D#5 .',
  'E5 . . B5 . . D6 .',
  'C#6 . B5 . G5 . E5 .',
  'G5 . . C6 . . B5 .',
  'A5 . B5 . C6 . E6 .',
  'C6 . A5 . . D#6 . B5',
  'A5 . F#5 . D#5 . . .',
].join(' | ');

export const phantomMarket: SongDef = {
  id: 'phantom-market',
  title: 'Phantom Market',
  style: 'puzzle-pop',
  mood: { valence: -0.55, energy: 0.05 },
  key: 'Em',
  bpm: 116,
  sections: {
    a: { chords: themeChords, melody: theme, drums: 'light', bass: 'walk' },
    a2: {
      chords: themeChords,
      melody: theme,
      counter: [
        '. . E4 . . B4 . .',
        'G4 . F#4 . G4 . F#4 .',
        'D#4 . E4 . . B4 . .',
        'D5 . C#5 . B4 . G4 .',
        'E4 . G4 . . C5 . .',
        'B4 . A4 . B4 . C5 .',
        'E5 . C5 . A4 . . D#5',
        '. B4 A4 . F#4 . D#4 .',
      ].join(' | '),
      drums: 'light',
      bass: 'walk',
    },
    b: {
      chords: 'Cmaj7 | B7 | Em7 | Dm7 G7 | Cmaj7 | B7 | Em7 | F#m7b5 B7',
      melody: [
        'G5 - - B5 - - E6 -',
        'D#6 - - - - - . .',
        'G5 - - B5 - - D6 -',
        'C6 - - A5 B5 - - -',
        'G5 - - B5 - - E6 -',
        'D#6 - - B5 - - F#5 -',
        'G5 - - - - - E5 -',
        'A5 - - C6 B5 - - -',
      ].join(' | '),
      counter: [
        'E4 - - - - - - -',
        'F#4 - - - - - - -',
        'E4 - - - - - - -',
        'F4 - - - D4 - - -',
        'E4 - - - - - - -',
        'D#4 - - - - - - -',
        'D4 - - - - - - -',
        'C4 - - - D#4 - - -',
      ].join(' | '),
      harmony: 'charleston',
    },
    c: {
      chords: 'Em | Fmaj7/E | Em | Fmaj7/E | Am7 | C7 | Em/B | B7',
      melody: [
        'E5 F#5 G5 . B5 . G5 .',
        'F5 G5 A5 . C6 . A5 .',
        'B5 A5 G5 . E5 . G5 .',
        'A5 G5 F5 . E5 . . .',
        'C6 . E6 . C6 . A5 .',
        'Bb5 . G5 . E5 . C5 .',
        'B4 . E5 . G5 . B5 .',
        'A5 - - - F#5 - D#5 -',
      ].join(' | '),
      drums: 'push',
      bass: 'octave',
      harmony: 'stab',
    },
    a3: {
      chords: themeChords,
      melody: theme,
      counter: [
        'G4 - - - - - - -',
        'A4 - - - - - - -',
        'B4 - - - - - - -',
        'C#5 - - - - - - -',
        'C5 - - - - - - -',
        'C5 - - - - - - -',
        'A4 - - - - - - -',
        'F#4 - - - D#4 - - -',
      ].join(' | '),
    },
  },
  form: ['a', 'a2', 'b', 'c', 'a3'],
};
