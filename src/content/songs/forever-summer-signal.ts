import { type SongDef, transposed } from '../../domain/music/song.ts';

// A radio signal from a summer that never ends: one beeping F stays put while the chords change its meaning, a
// vi–IV–V–I chorus hangs its 9th over the IV, and the lifted anthem fades on the flat VII into a deceptive restart.
const signal = {
  chords: 'Gm7 | Ebmaj7 | F | Bb',
  melody: ['F6 . D6 F6 . D6 Bb5 D6', 'F6 . D6 F6 . D6 G5 D6', 'F6 . C6 F6 . C6 A5 C6', 'F6 . D6 F6 . D6 Bb5 D6'].join(' | '),
  lead: 'alt' as const,
};

const chorus = {
  chords: 'Gm7 | Ebmaj7 | F | Bb D7/F# | Gm7 | Ebmaj7 | Cm7 F7sus4 | Bb',
  melody: [
    'D6 - - Bb5 - D6 - F6',
    '- - - - D6 - C6 Bb5',
    'C6 - - A5 - C6 - F6',
    '- - - - C6 - A5 -',
    'D6 - - Bb5 - D6 - G6',
    '- - - - F6 - D6 F6',
    '- - - - Eb6 - C6 -',
    'D6 - - - - - . .',
  ].join(' | '),
  counter: [
    'F5 . D5 F5 . D5 Bb4 D5',
    'F5 . D5 F5 . D5 G4 D5',
    'F5 . C5 F5 . C5 A4 C5',
    'F5 . D5 F5 . C5 A4 F#4',
    'F5 . D5 F5 . D5 Bb4 D5',
    'F5 . D5 F5 . D5 G4 D5',
    'F5 . Eb5 F5 . C5 Bb4 C5',
    'F5 . D5 F5 . D5 Bb4 D5',
  ].join(' | '),
  lead: 'alt' as const,
};

export const foreverSummerSignal: SongDef = {
  id: 'forever-summer-signal',
  title: 'Forever Summer Signal',
  style: 'trance-pop',
  mood: { valence: 0.2, energy: 0.45 },
  key: 'Bb',
  bpm: 136,
  sections: {
    intro: { ...signal, drums: false, bass: false, harmony: false },
    a: {
      chords: 'Gm9 | Ebmaj7 | Gm9 | Ebmaj7 | Cm7 | Dm7 | Ebmaj7 | F7sus4 F',
      melody: [
        'D5 . F5 G5 . A5 - -',
        '- - . . G5 F5 D5 -',
        'D5 . F5 G5 . Bb5 - -',
        '- - . . G5 F5 G5 -',
        'Eb5 . G5 Bb5 . C6 - -',
        '- - . . A5 F5 D5 -',
        'G5 - - - F5 - D5 -',
        'Bb4 - - - A4 - . .',
      ].join(' | '),
      pad: false,
      harmony: 'offbeat',
      bass: 'offbeat',
      drums: 'half',
    },
    b: {
      chords: 'Ebmaj7 | F/Eb | Dm7 | Gm7 | Cm7 | Dm7 | Ebmaj7 | F7sus4 F',
      melody: [
        'G5 - - - F5 - G5 Bb5',
        'A5 - - - - - . .',
        'A5 - - - G5 - A5 C6',
        'Bb5 - - - - - . .',
        'C6 - - - Bb5 - C6 Eb6',
        'D6 - - - - - . .',
        'Eb6 - - - D6 - C6 -',
        'Bb5 - - - A5 - C6 -',
      ].join(' | '),
      harmony: 'arp16',
      bass: 'octave',
    },
    s: chorus,
    riff: signal,
    brk: {
      chords: 'Ebmaj7 | Bb/D | Cm7 | Bb | Ebmaj7 | Bb/D | Cm7 | F',
      melody: [
        'G5 - - - Eb6 - - -',
        'D6 - - - - - C6 -',
        'Bb5 - - - G5 - - -',
        'F5 - - - - - . .',
        'G5 - - - F6 - - -',
        '- - - - D6 - - -',
        'Eb6 - - - C6 - - -',
        'C6 - - - A5 - - -',
      ].join(' | '),
      counter: Array.from({ length: 8 }, () => 'F5 . . F5 . . . .').join(' | '),
      drums: false,
      bass: false,
      harmony: false,
    },
    build: {
      chords: 'Cm7 | Dm7 | Ebmaj7 F | G7sus4 G7',
      melody: ['Eb5 - G5 - C6 - Bb5 -', 'F5 - A5 - D6 - C6 -', 'G5 - Bb5 - A5 - C6 -', 'D6 - - - B5 - D6 -'].join(' | '),
      harmony: 'arp16',
      bass: 'pedal',
    },
    up: transposed(chorus, 2, 'C'),
    outro: {
      chords: 'Abmaj7 | F7sus4 F7',
      melody: 'C6 - - - - - - - | Bb5 - - - A5 - - -',
      counter: 'F5 . . F5 . . . . | F5 . . F5 . . . .',
      lead: 'alt',
      harmony: false,
      bass: 'whole',
      drums: 'half',
    },
  },
  form: ['intro', 'a', 'b', 's', 'riff', 'brk', 'build', 'up', 'outro'],
  loopFrom: 1,
};
