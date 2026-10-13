import type { SongDef } from '../../domain/music/song.ts';

// A wind-up toy wakes: its Dorian riff ticks alone, the sequencer kicks in, and a pre-chorus that rises
// on the leading tone falls deceptively onto the chorus while the counter plays the riff back underneath.
const riff = {
  chords: 'Am7 | D/A | Am7 | D/A',
  melody: 'E5 . A5 C6 . B5 A5 . | F#5 . A5 D6 . C6 A5 . | E5 . A5 C6 . E6 D6 . | D6 - B5 - A5 . F#5 .',
};

const chorus = {
  chords: 'Fmaj7 | G | Am7 | D | Fmaj7 | G | Em7 Am7 | Dm7 E7',
  melody: [
    'A5 - - G5 A5 - C6 -',
    'B5 - - A5 B5 - D6 -',
    'E6 - - - D6 - C6 D6',
    'E6 - - - . . A5 B5',
    'C6 - - B5 C6 - E6 -',
    'D6 - - C6 D6 - E6 F6',
    'G6 - - - E6 - - -',
    'F6 - - E6 D6 - B5 -',
  ].join(' | '),
  counter: [
    'F4 . C5 F5 . E5 C5 .',
    'G4 . D5 G5 . D5 B4 .',
    'A4 . E5 A5 . G5 E5 .',
    'A4 . F#5 A5 . F#5 D5 .',
    'F4 . C5 F5 . E5 C5 .',
    'G4 . D5 G5 . D5 B4 .',
    'E4 . B4 E5 . E5 C5 .',
    'D4 . A4 D5 . D5 B4 .',
  ].join(' | '),
  lead: 'alt' as const,
};

export const pocketRobot: SongDef = {
  id: 'pocket-robot',
  title: 'Pocket Robot',
  style: 'technopop',
  mood: { valence: 0.5, energy: 0.3 },
  key: 'Am',
  bpm: 128,
  sections: {
    intro: { ...riff, drums: false, bass: false },
    a: {
      chords: 'Am7 | D/A | Am7 | D/A | Fmaj7 | G | Em7 | Am7',
      melody: [
        '. C5 C5 D5 . E5 . .',
        '. D5 D5 E5 . F#5 . .',
        '. E5 E5 G5 . A5 G5 E5',
        'F#5 - - - . . . .',
        '. C5 C5 E5 . G5 . E5',
        '. D5 D5 E5 . G5 . .',
        '. B4 B4 D5 . E5 D5 B4',
        'C5 - - - B4 - . .',
      ].join(' | '),
      drums: 'half',
      bass: 'octave',
    },
    b: {
      chords: 'Fmaj7 | G | Em7 | Am7 | Dm7 | Em7 | Fmaj7 | E7sus4 E7',
      melody: [
        'A4 - - C5 - - E5 -',
        'B4 - - D5 - - G5 -',
        'B5 - - - - - A5 G5',
        'E5 - - - . . E5 G5',
        'F5 - - A5 - - C6 -',
        'G5 - - B5 - - D6 -',
        'E6 - - - C6 - A5 -',
        'B5 - - - G#5 - - -',
      ].join(' | '),
    },
    s: chorus,
    riff,
    c: {
      chords: 'Am7 | Bm7 | Cmaj7 | D | Am7 | Bm7 | Cmaj7 D | E7sus4 E7',
      melody: [
        'A5 . C6 . E6 - - -',
        '. . . . . . . .',
        'G5 . B5 . E6 - - -',
        '. . . . . . . .',
        'E6 . D6 . C6 - - -',
        '. . . . . . . .',
        'E6 - - - F#6 - - -',
        'E6 - - - D6 - B5 G#5',
      ].join(' | '),
      counter: [
        '. . . . . . . .',
        'F#5 . A5 . B5 - - -',
        '. . . . . . . .',
        'F#5 . A5 . D6 - - -',
        '. . . . . . . .',
        'D6 . B5 . F#5 - - -',
        'G5 - - - F#5 - - -',
        'E5 - - - D5 - - -',
      ].join(' | '),
      drums: 'half',
      bass: 'octave',
    },
  },
  form: ['intro', 'a', 'b', 's', 'riff', 'c', 's', 'riff'],
  loopFrom: 1,
};
