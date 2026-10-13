import { type SongDef, transposed } from '../../domain/music/song.ts';

// A piano that plays faster than its metronome: a sixteenth riff that spins around the minor ninth, a stop-time
// verse over a falling cliché bass, a half-time climb into a royal-road chorus in the relative major, then the band
// drops out, the voice sings the hook alone over the piano and the last chorus comes back a half step higher.
const riff = {
  chords: 'C#m9 | Amaj7 | F#m9 | G#7sus4 G#7',
  melody: [
    'C#6 D#6 E6 G#6 . E6 D#6 C#6 B5 C#6 D#6 . G#5 . B5 C#6',
    'C#6 D#6 E6 A6 . E6 D#6 C#6 B5 C#6 E6 . A5 . B5 C#6',
    'A5 B5 C#6 F#6 . C#6 B5 A5 G#5 A5 C#6 . F#5 . G#5 A5',
    'G#5 . C#6 . D#6 . F#6 . F#6 - - - D#6 - C6 -',
  ].join(' | '),
  counter: [
    'C#5 D#5 E5 G#5 . E5 D#5 C#5 B4 C#5 D#5 . G#4 . B4 C#5',
    'C#5 D#5 E5 A5 . E5 D#5 C#5 B4 C#5 E5 . A4 . B4 C#5',
    'A4 B4 C#5 F#5 . C#5 B4 A4 G#4 A4 C#5 . F#4 . G#4 A4',
    'G#4 . C#5 . D#5 . F#5 . F#5 - - - D#5 - C5 -',
  ].join(' | '),
  lead: 'alt' as const,
};

// The hook: a note that flicks down a semitone and back, twice, then drops a fourth; sequenced a step lower on V7.
const chorus = {
  chords: 'Amaj7 | B7 | G#m7 | C#m7 | Amaj7 | B7 | G#7sus4 G#7 | C#m7',
  melody: [
    'E6 - D#6 E6 . E6 - D#6 E6 - B5 - C#6 - - -',
    'D#6 - C#6 D#6 . D#6 - C#6 D#6 - A5 - B5 - - -',
    'B5 - A#5 B5 . B5 - A#5 B5 - F#5 - G#5 - D#6 -',
    'E6 - - - - - - - D#6 - C#6 - B5 - . .',
    'E6 - D#6 E6 . E6 - D#6 E6 - F#6 - G#6 - - -',
    'F#6 - E6 F#6 . F#6 - E6 D#6 - - - B5 - A5 -',
    'C#6 - - - D#6 - - - C6 - - - D#6 - F#6 -',
    'E6 - - - - - - - - - - - D#6 - C#6 -',
  ].join(' | '),
  counter: [
    'C#5 - - - - - - - B4 - - - - - - -',
    'D#5 - - - - - - - C#5 - - - - - - -',
    'B4 - - - - - - - D#5 - - - - - - -',
    'E5 - - - - - - - D#5 - - - - - - -',
    'C#5 - - - - - - - E5 - - - - - - -',
    'D#5 - - - - - - - F#5 - - - - - - -',
    'C#5 - - - - - - - C5 - - - - - - -',
    'C#5 - - - - - - - G#4 - - - - - - -',
  ].join(' | '),
  lead: 'alt' as const,
};

export const brokenMetronome: SongDef = {
  id: 'broken-metronome',
  title: 'Broken Metronome',
  style: 'vocal-rock',
  mood: { valence: -0.4, energy: 0.85 },
  key: 'C#m',
  bpm: 184,
  steps: 4,
  sections: {
    // The riff on the piano alone, then the band crashes in with the guitar doubling it.
    intro: {
      chords: 'C#m9 | Amaj7',
      melody: '. . . . . . . . . . . . . . . . | . . . . . . . . . . . . . . . .',
      counter: riff.counter.split(' | ').slice(0, 2).join(' | '),
      drums: false,
      bass: false,
      pad: false,
      harmony: false,
    },
    riff,
    // Stop time: the band only hits with the piano stabs while the bass falls by semitones under C#m.
    a1: {
      chords: 'C#m | C#m/C | C#m/B | F#/A#',
      melody: [
        'E5 E5 D#5 E5 . G#5 F#5 E5 C#5 - . B4 . C#5 E5 .',
        'E5 E5 D#5 E5 . A5 G#5 E5 C5 - . B4 . C5 D#5 .',
        'E5 E5 D#5 E5 . G#5 F#5 E5 B4 - . A4 . B4 C#5 .',
        'F#5 - - - E5 - D#5 - C#5 - - - A#4 - . .',
      ].join(' | '),
      drums: false,
      bass: 'syncopated',
      harmony: 'stab',
      pad: false,
    },
    // Go: the kit and the piano arpeggio come in, the cell sequences down a step and turns up into the climb.
    a2: {
      chords: 'Amaj7 | B | G#m7 C#m7 | F#m7 G#7',
      melody: [
        'C#5 C#5 B4 C#5 . E5 D#5 C#5 G#5 - . E5 . F#5 G#5 .',
        'B4 B4 A#4 B4 . D#5 C#5 B4 F#5 - . D#5 . E5 F#5 .',
        'G#5 - F#5 G#5 B5 - G#5 F#5 E5 - G#5 E5 C#5 - B4 C#5',
        'A5 - G#5 F#5 E5 - C#5 - C6 - - - D#5 - - -',
      ].join(' | '),
      drums: 'rock',
      pad: false,
    },
    // Half time: dotted calls that climb two bars at a time, the guitar wall swelling in, ending on B7 for E major.
    b: {
      chords: 'Amaj7 | B/A | G#m7 | C#m7 | F#m7 | G#m7 | Amaj7 | B7sus4 B7',
      melody: [
        'C#5 - - E5 - - G#5 - - - - - F#5 E5 F#5 G#5',
        'A5 - - - - - - - F#5 - - - D#5 - . .',
        'D#5 - - F#5 - - B5 - - - - - A#5 G#5 A#5 B5',
        'C#6 - - - - - - - G#5 - - - E5 - . .',
        'E5 - - A5 - - C#6 - - - - - B5 A5 B5 C#6',
        'D#6 - - - - - - - B5 - - - F#5 - . .',
        'E5 - - G#5 - - C#6 - E6 - - - D#6 C#6 B5 C#6',
        'E6 - - - - - - - D#6 - - - F#6 - . .',
      ].join(' | '),
      drums: 'half',
      harmony: 'pulse',
      bass: 'half',
    },
    s: chorus,
    // The band drops out: the voice sings the hook an octave down over the bare piano, then pivots on C7 into D minor.
    brk: {
      chords: 'Amaj7 | B7 | G#m7 C#m7 | C7sus4 C7',
      melody: [
        'E5 - D#5 E5 . E5 - D#5 E5 - B4 - C#5 - - -',
        'D#5 - C#5 D#5 . D#5 - C#5 D#5 - A4 - B4 - - -',
        'B4 - - - - - - - E5 - - - G#5 - B5 -',
        'C6 - - - - - - - G5 - Bb5 - C6 - E6 -',
      ].join(' | '),
      drums: false,
      bass: false,
      pad: false,
    },
    up: transposed(chorus, 1, 'Dm'),
    // Bbmaj7 slides down a whole step onto the home dominant so the stop-time verse can start again.
    outro: {
      chords: 'Bbmaj7 | G#7sus4 G#7',
      melody: 'D6 - - - - - - - F6 - - - A5 - - - | G#5 - - - C#6 - - - C6 - - - D#6 - - -',
      drums: 'half',
      harmony: 'pulse',
    },
  },
  form: ['intro', 'riff', 'a1', 'a2', 'b', 's', 'riff', 'a1', 'a2', 'b', 's', 'brk', 'up', 'outro'],
  loopFrom: 2,
};
