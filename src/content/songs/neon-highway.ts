import { type SongDef, transposed } from '../../domain/music/song.ts';

// Racing the city lights: a riff that keeps striking the same high E while the chords move under it, a verse over a
// climbing slash bass, a pre-chorus whose bass slides A–G–F♯–E into a deceptive IVmaj7, a royal-road chorus that holds
// the maj7 and lands every phrase a beat early, a saw solo, and a last chorus a semitone up.
const riff = {
  chords: 'Am9 | Fmaj7 | G6 | E7sus4 E7',
  melody: 'E6 . A5 E6 . B5 C6 E6 | E6 . A5 E6 . C6 A5 E6 | E6 . G5 E6 . B5 D6 E6 | E6 . A5 E6 . G#5 B5 D6',
};

const chorus = {
  chords: 'Fmaj7 | G6 | Em7 | Am9 | Dm9 | G7 | Fmaj7 G6 | E7sus4 E7',
  melody: [
    'E6 - - E6 - - D6 E6',
    '- - - - D6 - B5 -',
    'D6 - - D6 - - C6 D6',
    '- - - - C6 - A5 -',
    'F6 - - F6 - - E6 F6',
    '- - - - G6 - - A6',
    '- - - - G6 - E6 -',
    'D6 - - - B5 - G#5 -',
  ].join(' | '),
  counter: [
    'A4 - - - C5 - - -',
    'B4 . D5 E5 . D5 B4 .',
    'G4 - - - E5 - - -',
    'C5 . E5 G5 . E5 C5 .',
    'D5 - - - A4 - - -',
    'B4 . D5 F5 . D5 B4 .',
    'C5 - - - D5 - - -',
    'B4 - - - G#4 - - -',
  ].join(' | '),
  bass: 'octave' as const,
};

const pre = {
  chords: 'Dm9 | G7 | Cmaj7 | Fmaj7 | Bm7b5 | E7b9 | Am9 Am/G | F#m7b5 E7',
  melody: [
    'F5 - A5 - C6 - E6 -',
    'D6 - - - B5 - . .',
    'E5 - G5 - B5 - D6 -',
    'C6 - - - A5 - . .',
    'F5 - A5 - D6 - F6 -',
    'F6 - - - E6 - . .',
    'E6 - - - - - D6 C6',
    'C6 - - - B5 - G#5 B5',
  ].join(' | '),
  harmony: 'pulse' as const,
  bass: 'drive' as const,
};

export const neonHighway: SongDef = {
  id: 'neon-highway',
  title: 'Neon Highway',
  style: 'neon-rush',
  mood: { valence: 0.4, energy: 0.85 },
  key: 'Am',
  bpm: 150,
  sections: {
    intro: { ...riff, drums: false },
    a: {
      chords: 'Am9 | G/B | Fmaj7/C | G6/D | Am9 | Em7/G | Fmaj7 | E7sus4 E7',
      melody: [
        'E5 - - C5 D5 - E5 -',
        'D5 - - B4 A4 - B4 -',
        'C5 - - A4 C5 - E5 -',
        'D5 - - - . . . .',
        'E5 - - C5 D5 - E5 -',
        'G5 - - D5 E5 - G5 -',
        'A5 - - E5 F5 - A5 -',
        'B5 - - - G#5 - - -',
      ].join(' | '),
      harmony: 'stab',
      drums: 'half',
    },
    b: pre,
    s: chorus,
    riff,
    solo: {
      chords: 'Fmaj7 | G6 | Em7 | Am9 | Dm9 | G7 | Cmaj7 | E7sus4 E7',
      melody: [
        'A5 C6 E6 C6 A5 C6 E6 F6',
        'G6 - D6 B5 G5 B5 D6 E6',
        'E6 - B5 G5 E5 G5 B5 D6',
        'C6 - - - . . E6 D6',
        'C6 A5 F5 A5 C6 D6 F6 -',
        'D6 - B5 G5 D6 E6 G6 -',
        'G6 - E6 C6 B5 C6 E6 G6',
        'E6 - D6 - B5 - G#5 -',
      ].join(' | '),
      bass: 'octave',
    },
    lift: { chords: 'F7sus4 F7', melody: 'Eb6 - - - C6 - A5 C6', key: 'Bbm' },
    up: transposed(chorus, 1, 'Bbm'),
  },
  form: ['intro', 'a', 'b', 's', 'riff', 'solo', 'b', 'lift', 'up', 'riff'],
  loopFrom: 1,
};
