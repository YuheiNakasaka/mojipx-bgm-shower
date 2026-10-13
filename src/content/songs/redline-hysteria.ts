import { type SongDef, transposed } from '../../domain/music/song.ts';

// Everything at once, at the redline: a riff in threes against the beat whose top note climbs over a pedal, a verse
// where the voice calls and the piano answers, a pushing pre-chorus, and a vi–IV–V–I chorus that reuses the riff's
// threes and never lets go, the riff still racing under it. A half-time break, two bars of voice alone, a half step up.
const riff = {
  chords: 'Gm7 | Ebmaj7 | Cm7 | D7sus4 D7',
  melody: [
    'D6 Bb5 G5 Eb6 Bb5 G5 F6 Bb5 G5 G6 Bb5 G5 F6 D6 Bb5 D6',
    'D6 Bb5 G5 Eb6 Bb5 G5 F6 Bb5 G5 G6 Bb5 G5 F6 D6 Bb5 D6',
    'Eb6 C6 G5 F6 C6 G5 G6 C6 G5 F6 C6 G5 Eb6 D6 C6 Bb5',
    'D6 A5 G5 D6 A5 G5 C6 A5 F#5 - - - A5 - C6 -',
  ].join(' | '),
  harmony: 'pulse' as const,
  pad: false,
};

const chorus = {
  chords: 'Gm7 | Ebmaj7 | F7sus4 F7 | Bb D7/F# | Gm7 | Ebmaj7 | Cm7 F7 | D7sus4 D7',
  melody: [
    'D6 F6 - D6 G6 - D6 A6 - G6 F6 - D6 - F6 -',
    'Bb5 D6 - Bb5 Eb6 - Bb5 F6 - Eb6 D6 - Bb5 - C6 -',
    'C6 Eb6 - C6 F6 - C6 G6 - F6 Eb6 - C6 - A5 -',
    'Bb5 D6 - F6 D6 - Bb5 - A5 C6 - D6 F#6 - D6 -',
    'D6 F6 - D6 G6 - D6 A6 - Bb6 A6 - G6 - F6 -',
    'G6 - - F6 G6 - Bb6 - - G6 F6 - Eb6 - D6 -',
    'Eb6 - - D6 Eb6 - G6 - F6 - - Eb6 - C6 A5 -',
    'G6 - - - A6 - G6 - F#6 - A6 - D6 - C6 -',
  ].join(' | '),
  // The piano keeps running the riff in threes an octave down.
  counter: [
    'D5 Bb4 G4 Eb5 Bb4 G4 F5 Bb4 G4 G5 Bb4 G4 F5 D5 Bb4 D5',
    'D5 Bb4 G4 Eb5 Bb4 G4 F5 Bb4 G4 G5 Bb4 G4 F5 D5 Bb4 D5',
    'C5 Bb4 F4 C5 Bb4 F4 Eb5 Bb4 F4 A4 C5 F4 A4 C5 Eb5 C5',
    'D5 Bb4 F4 D5 Bb4 F4 F5 Bb4 F#4 A4 D5 F#4 A4 D5 C5 A4',
    'D5 Bb4 G4 Eb5 Bb4 G4 F5 Bb4 G4 G5 Bb4 G4 F5 D5 Bb4 D5',
    'D5 Bb4 G4 Eb5 Bb4 G4 F5 Bb4 G4 G5 Bb4 G4 F5 D5 Bb4 D5',
    'Eb5 C5 G4 Eb5 C5 G4 G5 C5 A4 C5 F5 A4 C5 F5 Eb5 C5',
    'D5 A4 G4 D5 A4 G4 C5 A4 F#4 A4 D5 F#4 A4 D5 C5 A4',
  ].join(' | '),
  lead: 'alt' as const,
};

export const redlineHysteria: SongDef = {
  id: 'redline-hysteria',
  title: 'Redline Hysteria',
  style: 'vocal-rock',
  mood: { valence: -0.1, energy: 0.9 },
  key: 'Gm',
  bpm: 188,
  steps: 4,
  parts: { bass: 'roll' },
  sections: {
    riff,
    // The voice calls for two beats, the piano answers in the same rhythm.
    a: {
      chords: 'Gm7 | Ebmaj7 | Cm7 | D7sus4 D7 | Gm7 | Ebmaj7 | Cm7 F7 | Bbmaj7',
      melody: [
        'Bb5 Bb5 D6 Bb5 F6 . D6 Bb5 . . . . . . . .',
        'Bb5 Bb5 Eb6 Bb5 G6 . Eb6 Bb5 . . . . . . . .',
        'C6 C6 Eb6 C6 G6 . Eb6 C6 . . . . . . . .',
        'A5 A5 D6 A5 G6 . D6 A5 . . . . . . . .',
        'D6 D6 F6 D6 G6 . F6 D6 . . . . . . . .',
        'Eb6 Eb6 G6 Eb6 F6 . D6 Bb5 . . . . . . . .',
        'Eb6 Eb6 G6 Eb6 C6 . Bb5 C6 A5 - - - C6 - Eb6 -',
        'D6 - - - - - - - . . . . . . . .',
      ].join(' | '),
      counter: [
        '. . . . . . . . D5 D5 Bb4 D5 G4 . F4 .',
        '. . . . . . . . Eb5 Eb5 Bb4 Eb5 G4 . F4 .',
        '. . . . . . . . Eb5 Eb5 C5 Eb5 G4 . Bb4 .',
        '. . . . . . . . F#4 A4 C5 D5 F#4 . A4 .',
        '. . . . . . . . Bb4 Bb4 D5 Bb4 F5 . D5 .',
        '. . . . . . . . G4 G4 Bb4 G4 D5 . Bb4 .',
        '. . . . . . . . . . . . . . . .',
        '. . . . . . . . F4 Bb4 D5 F5 A4 . Bb4 .',
      ].join(' | '),
      harmony: false,
      pad: false,
    },
    // Pushing eighths, dotted calls that climb a third every two bars onto F7.
    b: {
      chords: 'Ebmaj7 | F | Dm7 | Gm7 | Cm7 | Dm7 | Ebmaj7 | F7sus4 F7',
      melody: [
        'G5 - - Bb5 - - D6 - Eb6 - - D6 - - Bb5 -',
        'A5 - - C6 - - F6 - - - - - . . . .',
        'F5 - - A5 - - C6 - D6 - - C6 - - A5 -',
        'Bb5 - - D6 - - G6 - - - - - . . . .',
        'G5 - - C6 - - Eb6 - F6 - - Eb6 - - C6 -',
        'D6 - - F6 - - A6 - - - - - . . . .',
        'G6 - - F6 - - Eb6 - D6 - - Eb6 - - F6 -',
        'G6 - - - - - - - A6 - - - - - . .',
      ].join(' | '),
      drums: 'push',
      harmony: 'pulse',
      bass: 'octave',
      pad: false,
    },
    s: chorus,
    // Half time: long falling calls, the piano answering each with a turn.
    half: {
      chords: 'Ebmaj7 | F/Eb | Dm7 | Gm7 | Cm7 | D7sus4 D7',
      melody: [
        'G6 - - - F6 - D6 - . . . . . . . .',
        'F6 - - - Eb6 - C6 - . . . . . . . .',
        'F6 - - - D6 - A5 - . . . . . . . .',
        'Bb5 - - - - - - - . . . . . . . .',
        'C6 - - - Eb6 - G6 - . . . . . . . .',
        'A6 - - - G6 - - - F#6 - - - - - - -',
      ].join(' | '),
      counter: [
        '. . . . . . . . Bb4 D5 G5 D5 Bb4 . . .',
        '. . . . . . . . A4 C5 F5 C5 A4 . . .',
        '. . . . . . . . A4 D5 F5 D5 A4 . . .',
        '. . . . . . . . Bb4 D5 G5 D5 Bb4 . . .',
        '. . . . . . . . G4 C5 Eb5 G5 Eb5 . . .',
        '. . . . . . . . . . . . . . . .',
      ].join(' | '),
      drums: 'half',
      bass: 'whole',
    },
    // Two bars of the voice over the guitar wall: Eb turns into D#7, the dominant of G# minor.
    drop: {
      chords: 'Ebmaj7 | D#7sus4 D#7',
      melody: 'G6 - - - - - - - Bb5 - D6 - Eb6 - D6 - | D#6 - - - C#6 - - - A#5 - - - C#6 - D#6 -',
      drums: false,
      bass: false,
      harmony: false,
    },
    up: transposed(chorus, 1, 'G#m'),
    // Emaj7 slides a whole step down onto the home dominant.
    outro: {
      chords: 'Emaj7 | D7sus4 D7',
      melody: 'B5 - - - - - - - D#6 - - - E6 - - - | D6 - - - - - - - C6 - - - A5 - - -',
      drums: 'half',
      bass: 'octave',
    },
  },
  form: ['riff', 'a', 'b', 's', 'riff', 'a', 'b', 's', 'half', 'drop', 'up', 'outro'],
  loopFrom: 1,
};
