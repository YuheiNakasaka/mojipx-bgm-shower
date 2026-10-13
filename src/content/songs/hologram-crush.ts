import type { SongDef } from '../../domain/music/song.ts';

// An electronic-era idol dance track: gated chords pulse through the whole song, a one-bar synth riff keeps its top
// note on the same accent, the verse hops over a pedal bass, the pre-chorus climbs in half time, the chorus slams into
// four on the floor on vi–IV–V–I, and a robotic break has the group chanting on two notes over toms and a sequencer.
const riff = {
  chords: 'C#m7 | Aadd9 | B7sus4 | B7',
  melody: 'C#6 . G#5 C#6 . E6 . B5 | C#6 . A5 C#6 . E6 . B5 | B5 . F#5 B5 . E6 . A5 | B5 . F#5 B5 . D#6 . F#5',
};

// The chorus hook is the riff's rhythm sung: a turn, then a leap to the accent, then a tie over the bar line.
const chorus = {
  chords: 'C#m7 | Aadd9 | B7 | E/G# | C#m7 | Aadd9 | B7sus4 B7 | E',
  melody: [
    'C#6 - B5 C#6 - E6 - C#6',
    '- - B5 - A5 - E5 -',
    'B5 - A5 B5 - D#6 - B5',
    '- - G#5 - E5 - . .',
    'C#6 - B5 C#6 - E6 - F#6',
    '- - - - E6 - C#6 -',
    'E6 - - - D#6 - B5 -',
    'E6 - - - - - . .',
  ].join(' | '),
  counter: [
    'E5 - - - G#5 - - -',
    'A5 - - - E5 - - -',
    'F#5 - - - A5 - - -',
    'G#5 - - - E5 - - -',
    'E5 - - - G#5 - - -',
    'A5 - - - - - E5 -',
    'A5 - - - F#5 - - -',
    'G#5 - - - - - . .',
  ].join(' | '),
  lead: 'alt' as const,
};

// The robotic break: the group chants on two notes, the synth answers with the hook's turn.
const chant = {
  chords: 'C#m7 | C#m7 | Aadd9 | Aadd9 | F#m7 | F#m7 | B7sus4 | B7',
  melody: [
    'G#5 . G#5 . B5 . G#5 .',
    '. . G#5 G#5 . B5 - .',
    'A5 . A5 . C#6 . A5 .',
    '. . A5 A5 . B5 - .',
    'A5 . A5 . C#6 . A5 .',
    '. . A5 A5 . E6 - .',
    'B5 . B5 . E6 . B5 .',
    '. . B5 B5 . D#6 - .',
  ].join(' | '),
  counter: [
    '. . . . . . . .',
    'C#5 - B4 C#5 - E5 - .',
    '. . . . . . . .',
    'C#5 - B4 C#5 - E5 - .',
    '. . . . . . . .',
    'C#5 - B4 C#5 - E5 - .',
    '. . . . . . . .',
    'B4 - A4 B4 - D#5 - .',
  ].join(' | '),
  drums: 'robot' as const,
  bass: 'sequence' as const,
  pad: false,
};

export const hologramCrush: SongDef = {
  id: 'hologram-crush',
  title: 'Hologram Crush',
  style: 'idol-disco',
  mood: { valence: 0.2, energy: 0.8 },
  key: 'E',
  bpm: 128,
  parts: { harmony: 'gate' },
  sections: {
    intro: { ...riff, drums: 'four', bass: false, pad: false },
    a: {
      chords: 'C#m7 | A/C# | C#m7 | A/C# | Amaj7 | B/A | G#m7 | C#m7',
      melody: [
        'C#5 . C#5 E5 . F#5 E5 .',
        'C#5 - - B4 - - . .',
        'C#5 . C#5 E5 . G#5 F#5 .',
        'E5 - - C#5 - - . .',
        'E5 . E5 A5 . B5 A5 .',
        'F#5 - - D#5 - - . .',
        'D#5 . D#5 F#5 . G#5 F#5 .',
        'G#5 - - E5 - - . .',
      ].join(' | '),
      drums: 'four',
      bass: 'octave',
      pad: false,
    },
    b: {
      chords: 'F#m7 | G#m7 | Amaj7 | B7sus4 B7',
      melody: 'A5 - F#5 - C#6 - - B5 | B5 - G#5 - D#6 - - C#6 | C#6 - A5 - E6 - - D#6 | E6 - - - D#6 - B5 -',
      drums: 'half',
      bass: 'whole',
    },
    s: chorus,
    chant,
    riff: { ...riff, lead: 'alt' },
  },
  form: ['intro', 'a', 'b', 's', 'chant', 'b', 's', 'riff'],
  loopFrom: 1,
};
