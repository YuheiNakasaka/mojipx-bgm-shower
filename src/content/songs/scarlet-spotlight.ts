import type { SongDef } from '../../domain/music/song.ts';

// A dramatic kayo-flavored dance song: the strings open alone with falling turns over brass hits, the verse talks over
// a bass that sinks a semitone a bar, the pre-chorus floats on IVmaj7–III7–vi7 of the relative major, and the chorus
// climbs to its peak before sighing from the flat ninth of the harmonic-minor V7b9 back home.
const theme = {
  chords: 'Dm9 | Bbmaj7 | Gm9 | A7sus4 A7b9',
  melody: 'D6 - - - E6 D6 C#6 D6 | A5 - - - Bb5 A5 G5 A5 | G5 - - - A5 G5 F5 G5 | E5 - - D5 C#5 - - -',
  counter: 'F5 - - - - - - - | D5 - - - - - - - | Bb4 - - - - - - - | A4 - - - - - - -',
  lead: 'alt' as const,
  harmony: 'stab' as const,
};

// Pre-chorus on the relative major's IVmaj7–III7–vi7–v7 I7, each phrase a long color tone and a pickup a step higher.
const pre = {
  chords: 'Bbmaj7 | A7 | Dm7 | Cm7 F7 | Bbmaj7 | A7 | Dm7 Gm7 | A7sus4 A7b9',
  melody: [
    'A5 - - - - - Bb5 C6',
    'C#6 - - - A5 - . .',
    'C6 - - - - - D6 E6',
    'D6 - - - C6 - . .',
    'D6 - - - - - E6 F6',
    'E6 - - - C#6 - . .',
    'F6 - - - D6 - - -',
    'A5 - D6 - C#6 - - -',
  ].join(' | '),
};

const chorus = {
  chords: 'Bbmaj7 | C7 | Am7 | Dm7 | Gm7 | C7 | Em7b5 A7b9 | Dm9',
  melody: [
    'D6 - - - C6 D6 E6 F6',
    'G6 - - - E6 - D6 -',
    'C6 - - - B5 C6 D6 E6',
    'F6 - - - D6 - A5 -',
    'Bb5 - D6 - F6 - - G6',
    '- - - - A6 - G6 E6',
    'G6 - - F6 E6 - Bb5 -',
    'A5 - - - - - . .',
  ].join(' | '),
  counter: [
    'F5 - - - - - - -',
    'E5 - - - G5 - Bb5 -',
    'A5 - - - - - - -',
    'A5 - - - F5 - D5 -',
    'D5 - - - - - - -',
    'E5 - - - - - G5 -',
    'D5 - - - C#5 - - -',
    'D5 - - - - - . .',
  ].join(' | '),
  lead: 'alt' as const,
};

export const scarletSpotlight: SongDef = {
  id: 'scarlet-spotlight',
  title: 'Scarlet Spotlight',
  style: 'idol-disco',
  mood: { valence: -0.4, energy: 0.6 },
  key: 'Dm',
  bpm: 136,
  sections: {
    intro: { ...theme, drums: false, bass: 'whole' },
    a: {
      chords: 'Dm9 | DmM7/C# | Dm7/C | Bm7b5 | Bbmaj7 | Gm7 | Em7b5 | A7b9',
      melody: [
        '. A4 D5 E5 F5 - E5 D5',
        'E5 - - - . . . .',
        '. A4 D5 E5 F5 - G5 F5',
        'D5 - - - . . . .',
        '. D5 F5 G5 A5 - G5 F5',
        'A5 - - - . . . .',
        '. G5 Bb5 A5 G5 - E5 -',
        'C#5 - - - . . . .',
      ].join(' | '),
      pad: false,
    },
    b: pre,
    s: chorus,
    riff: theme,
    tag: {
      chords: 'Gm9 | A7sus4 A7b9',
      melody: 'Bb5 - - - A5 - G5 - | E5 - - - C#5 - . .',
      counter: 'D5 - - - - - - - | A4 - - - - - - -',
      harmony: 'stab',
      bass: 'whole',
      drums: false,
    },
  },
  form: ['intro', 'a', 'b', 's', 'riff', 'b', 's', 'tag'],
  loopFrom: 1,
};
