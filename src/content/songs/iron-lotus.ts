import { type SongDef, transposed } from '../../domain/music/song.ts';

// A dark-heroic net-rock song on the old Japanese scales: a koto figure over taiko that bends E minor towards the
// in-scale with a Phrygian Fmaj7, a pentatonic verse the koto answers, a half-time climb over Am7–Bm7–Cmaj7, and a
// chorus that falls from the royal road onto the harmonic-minor B7; the band drops to taiko and the chorus rises a step.
const koto = {
  chords: 'Em7 | Fmaj7 | Em7 | D6',
  counter: [
    'B4 E5 . E5 B4 E5 G5 . A5 . G5 E5 D5 E5 . .',
    'C5 F5 . F5 C5 F5 A5 . B5 . A5 F5 E5 F5 . .',
    'B4 E5 . E5 B4 E5 G5 . A5 . B5 D6 B5 A5 . .',
    'A4 D5 . D5 A4 D5 F#5 . A5 - - - B5 - - -',
  ].join(' | '),
};

const chorus = {
  chords: 'Cmaj7 | D | Bm7 | Em7 | Cmaj7 | D | B7sus4 B7 | Em7',
  melody: [
    'E6 D6 E6 - G6 - E6 - D6 B5 D6 - E6 - - -',
    'D6 B5 D6 - F#6 - D6 - B5 A5 B5 - A5 - - -',
    'B5 A5 B5 - D6 - B5 - A5 F#5 A5 - B5 - - -',
    'E6 - - - - - - - D6 - B5 - . . . .',
    'E6 D6 E6 - G6 - E6 - D6 B5 D6 - G6 - - -',
    'A6 G6 A6 - F#6 - D6 - E6 D6 E6 - F#6 - - -',
    'E6 - - - - - F#6 - D#6 - - - B5 - - -',
    'E6 - - - - - - - - - - - . . . .',
  ].join(' | '),
  // The koto keeps plucking root and fifth under the hook like a drone.
  counter: [
    'E5 . B4 E5 . B4 G5 . E5 . B4 E5 . B4 G5 .',
    'D5 . A4 D5 . A4 F#5 . D5 . A4 D5 . A4 F#5 .',
    'D5 . B4 D5 . B4 F#5 . D5 . B4 D5 . B4 A5 .',
    'E5 . B4 E5 . B4 G5 . E5 . B4 E5 . B4 D5 .',
    'E5 . B4 E5 . B4 G5 . E5 . B4 E5 . B4 G5 .',
    'D5 . A4 D5 . A4 F#5 . D5 . A4 D5 . A4 F#5 .',
    'E5 . B4 E5 . B4 F#5 . D#5 . B4 D#5 . B4 F#5 .',
    'E5 . B4 E5 . B4 G5 . B5 . G5 E5 . B4 E5 .',
  ].join(' | '),
  lead: 'alt' as const,
};

export const ironLotus: SongDef = {
  id: 'iron-lotus',
  title: 'Iron Lotus',
  style: 'vocal-rock',
  mood: { valence: -0.5, energy: 0.7 },
  key: 'Em',
  bpm: 156,
  steps: 4,
  parts: { harmony: 'pulse' },
  sections: {
    intro: {
      ...koto,
      melody: Array.from({ length: 4 }, () => '. . . . . . . . . . . . . . . .').join(' | '),
      drums: 'taiko',
      bass: false,
      harmony: false,
      pad: false,
    },
    // Pentatonic calls in the first half of each bar; the koto answers in the gap.
    a: {
      chords: 'Em7 | Cmaj7 | Dsus4 D | Em7 | Em7 | Cmaj7 | Am7 | B7sus4 B7',
      melody: [
        'E5 E5 G5 E5 A5 - G5 E5 D5 - E5 - . . . .',
        'E5 E5 G5 E5 B5 - A5 G5 E5 - G5 - . . . .',
        'D5 D5 G5 D5 A5 - G5 D5 F#5 - A5 - . . . .',
        'B5 - A5 G5 E5 - - - - - - - . . . .',
        'E5 E5 G5 E5 A5 - G5 E5 D5 - E5 - . . . .',
        'E5 E5 G5 E5 B5 - D6 B5 A5 - G5 - . . . .',
        'C6 C6 B5 A5 E5 - G5 A5 B5 - C6 - . . . .',
        'B5 - - - A5 - E5 - D#5 - - - F#5 - B5 -',
      ].join(' | '),
      counter: [
        '. . . . . . . . . . . . B5 A5 G5 E5',
        '. . . . . . . . . . . . G5 E5 D5 B4',
        '. . . . . . . . . . . . A5 F#5 D5 A4',
        '. . . . . . . . E5 B4 E5 G5 B5 . . .',
        '. . . . . . . . . . . . B5 A5 G5 E5',
        '. . . . . . . . . . . . G5 E5 D5 B4',
        '. . . . . . . . . . . . A5 C6 E6 C6',
        '. . . . . . . . . . . . . . . .',
      ].join(' | '),
      drums: 'eight',
      pad: false,
    },
    // Half time: each two-bar step climbs a third higher, from Am7 to the B7 that falls into the chorus.
    b: {
      chords: 'Am7 | Bm7 | Cmaj7 | D6 | Am7 | Bm7 | Cmaj7 | B7sus4 B7',
      melody: [
        'A5 - - - - - G5 A5 C6 - - - B5 - A5 -',
        'B5 - - - - - A5 B5 D6 - - - - - . .',
        'C6 - - - - - B5 C6 E6 - - - D6 - C6 -',
        'D6 - - - - - - - B5 - - - A5 - . .',
        'E6 - - - - - D6 E6 G6 - - - E6 - D6 -',
        'F#6 - - - - - - - D6 - - - B5 - . .',
        'G6 - - - E6 - - - B5 - - - C6 - D6 -',
        'E6 - - - - - - - D#6 - - - - - . .',
      ].join(' | '),
      drums: 'half',
      bass: 'half',
    },
    s: chorus,
    // The koto figure again, the guitar singing long pentatonic notes over it.
    inter: {
      ...koto,
      melody: [
        'B5 - - - - - - - A5 - G5 - E5 - G5 -',
        'A5 - - - - - - - C6 - B5 - A5 - E5 -',
        'G5 - - - - - - - B5 - D6 - E6 - - -',
        'D6 - - - - - - - B5 - - - A5 - - -',
      ].join(' | '),
      lead: 'alt',
    },
    // The band drops out: taiko and voice only, the hook an octave down, then the dominant of F# minor.
    brk: {
      chords: 'Cmaj7 | D | Bm7 Em7 | C#7sus4 C#7',
      melody: [
        'E5 D5 E5 - G5 - E5 - D5 B4 D5 - E5 - - -',
        'D5 B4 D5 - F#5 - D5 - B4 A4 B4 - A4 - - -',
        'B4 - - - D5 - - - E5 - - - G5 - B5 -',
        'C#6 - - - B5 - - - G#5 - - - B5 - C#6 -',
      ].join(' | '),
      drums: 'taiko',
      bass: false,
      harmony: false,
      pad: false,
    },
    up: transposed(chorus, 2, 'F#m'),
    // Dmaj7 is the new key's VI and the home key's borrowed VII: it steps back down onto B7.
    outro: {
      chords: 'Dmaj7 | B7sus4 B7',
      melody: 'F#6 - - - - - - - E6 - - - C#6 - - - | B5 - - - - - - - A5 - - - F#5 - - -',
      drums: 'half',
    },
  },
  form: ['intro', 'a', 'b', 's', 'inter', 'b', 's', 'brk', 'up', 'outro'],
  loopFrom: 1,
};
