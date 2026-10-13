import { type SongDef, transposed } from '../../domain/music/song.ts';

// A piano left playing in an empty hall: the piano alone states the chorus motif, the voice enters over a bass that
// falls by semitones under A minor, the guitar wall and the bass grow in the pre-chorus, and the chorus floats on
// IVmaj7–III7–vi7–v7 I7 before climbing an octave. The band falls away for two bars and the last chorus rises a whole
// step with the full kit, then the piano is alone again.
const motif = {
  chords: 'Fmaj7 | E7 | Am7 | E7sus4 E7',
  melody: Array.from({ length: 4 }, () => '. . . . . . . .').join(' | '),
  counter: ['E5 - - - D5 C5 D5 E5', '- - - - B4 - G#4 B4', 'C5 - - - B4 A4 B4 -', '- - - - G#4 - - -'].join(' | '),
};

const chorus = {
  chords: 'Fmaj7 | E7 | Am7 | Gm7 C7 | Fmaj7 | Em7 A7 | Dm7 G7 | Cmaj7 E7',
  melody: [
    'E6 - - - D6 C6 D6 E6',
    '- - - - B5 - G#5 B5',
    'C6 - - - B5 A5 B5 C6',
    '- - - - Bb5 - A5 G5',
    'A5 - C6 - F6 - E6 -',
    'G6 - - - - - E6 G6',
    'A6 - - - G6 - F6 -',
    'E6 - - - D6 - - -',
  ].join(' | '),
  // The piano answers each held note with a rising arpeggio.
  counter: [
    '. . . . . . . .',
    'G#5 B5 D6 E6 . . . .',
    '. . . . . . . .',
    'G5 Bb5 D6 F6 . . . .',
    '. . . . . . . .',
    'G5 B5 D6 E6 C#6 - - -',
    'D5 F5 A5 C6 B5 - - -',
    'C5 E5 G5 B5 G#5 - - -',
  ].join(' | '),
  lead: 'alt' as const,
  drums: 'eight' as const,
  bass: 'half' as const,
};

export const encoreForNoOne: SongDef = {
  id: 'encore-for-no-one',
  title: 'Encore for No One',
  style: 'vocal-rock',
  mood: { valence: -0.25, energy: 0.3 },
  key: 'Am',
  bpm: 136,
  sections: {
    // The piano alone.
    intro: { ...motif, drums: false, bass: false, pad: false },
    // Voice and piano; the bass line falls A–G#–G–F# under the held A minor.
    a: {
      chords: 'Am | Am/G# | Am/G | D/F# | Fmaj7 | Em7 | Dm7 | E7sus4 E7',
      melody: [
        '. C5 E5 A5 B5 - C6 A5',
        'B5 - - - - - . .',
        '. C5 E5 A5 B5 - C6 D6',
        'D6 - - - A5 - - -',
        '. C5 F5 G5 A5 - G5 F5',
        'G5 - - - - - . .',
        '. D5 F5 G5 A5 - C6 B5',
        'A5 - - - G#5 - - -',
      ].join(' | '),
      drums: false,
      bass: false,
      pad: false,
    },
    // The bass and the guitar wall come in; still no drums.
    b: {
      chords: 'Dm7 | Em7 | Fmaj7 | G6 | Dm7 | Em7 | Fmaj7 | E7sus4 E7',
      melody: [
        '. D5 F5 A5 C6 - - -',
        'B5 - - - G5 - - -',
        '. E5 A5 C6 E6 - - -',
        'D6 - - - B5 - - -',
        '. F5 A5 C6 F6 - - -',
        'E6 - - - D6 - B5 -',
        'C6 - - - A5 - C6 D6',
        'E6 - - - - - D6 -',
      ].join(' | '),
      drums: false,
      bass: 'whole',
    },
    s: chorus,
    inter: { ...motif, drums: 'eight', bass: 'half' },
    // The band falls away for two bars; F#7 points at B minor.
    brk: {
      chords: 'Dm7 | F#7sus4 F#7',
      melody: 'F5 - - - A5 - C6 - | B5 - - - A#5 - C#6 E6',
      drums: false,
      bass: false,
      pad: false,
    },
    // The last chorus a whole step up, and only now the full pushing kit.
    up: { ...transposed(chorus, 2, 'Bm'), drums: 'dash', bass: 'drive' },
    // F#7 slips down a half step to Fmaj7 and home to E7; the piano is alone again.
    outro: {
      chords: 'Fmaj7 | E7sus4 E7',
      melody: 'E6 - - - C6 - A5 - | B5 - - - G#5 - - -',
      drums: false,
      bass: false,
      pad: false,
    },
  },
  form: ['intro', 'a', 'b', 's', 'inter', 'b', 's', 'brk', 'up', 'outro'],
  loopFrom: 1,
};
