import type { SongDef } from '../../domain/music/song.ts';

// A machine voice drifting between sleep and waking: a chiming riff over the Lydian II/I, a floating verse of dotted
// arpeggios that each land on a held note, a pre-chorus over a rising bass, and a chorus that drops to half-time
// future bass with wobbling chords under falling IV–iii–ii–I, its hook leaping up an octave each time.
const riff = {
  chords: 'Fmaj7 | G/F | Fmaj7 | G/F',
  melody: ['A5 C6 E6 - C6 A5 G5 -', 'B5 D6 G6 - D6 B5 A5 -', 'A5 C6 E6 - C6 A5 G5 -', 'B5 D6 G6 - D6 B5 G5 -'].join(' | '),
};

const chorus = {
  chords: 'Bbmaj7 | Am7 | Gm7 | Fmaj7 | Bbmaj7 | Am7 | Gm7 | C7sus4 C7',
  melody: [
    'F5 - F6 - - - D6 -',
    'E6 - - - C6 - - -',
    'D5 - D6 - - - Bb5 -',
    'C6 - - - A5 - - -',
    'F5 - F6 - - - G6 -',
    'A6 - - - - - G6 -',
    'F6 - - - D6 - - -',
    'C6 - - - Bb5 - G5 -',
  ].join(' | '),
  counter: [
    '. F5 . A5 . D6 . A5',
    '. E5 . G5 . C6 . G5',
    '. D5 . F5 . Bb5 . F5',
    '. C5 . E5 . A5 . E5',
    '. F5 . A5 . D6 . A5',
    '. E5 . G5 . C6 . G5',
    '. D5 . F5 . Bb5 . F5',
    '. C5 . F5 . E5 . G5',
  ].join(' | '),
  lead: 'alt' as const,
  drums: 'future' as const,
  harmony: 'wobble' as const,
  bass: 'half' as const,
};

const prechorus = {
  chords: 'Dm7 | C/E | Fmaj7 | G/F | Em7 | A7 | Bbmaj7 | C7sus4 C7',
  melody: [
    'D5 - F5 - - - A5 -',
    'G5 - - - - - . .',
    'F5 - A5 - - - C6 -',
    'B5 - - - - - . .',
    'G5 - B5 - - - D6 -',
    'C#6 - - - - - . .',
    'Bb5 - D6 - - - F6 -',
    'F6 - - - E6 - - -',
  ].join(' | '),
  harmony: 'arp16' as const,
  bass: 'octave' as const,
};

export const lucidOrbit: SongDef = {
  id: 'lucid-orbit',
  title: 'Lucid Orbit',
  style: 'vocal-electro',
  mood: { valence: 0.2, energy: 0.45 },
  key: 'F',
  bpm: 142,
  sections: {
    intro: { ...riff, drums: false, bass: false },
    a: {
      chords: 'Fmaj7 | G/F | Em7 | Am7 | Dm9 | Bbmaj7 | Gm7 | C7sus4 C7',
      melody: [
        'C5 - - E5 - - A5 -',
        'B5 - - - - - . .',
        'D5 - - G5 - - B5 -',
        'C6 - - - - - . .',
        'D5 - - F5 - - A5 -',
        'D6 - - - - - . .',
        'F5 - - G5 - - Bb5 -',
        'F5 - - - E5 - - -',
      ].join(' | '),
      counter: [
        '. . . . . . . .',
        '. . . . D6 B5 G5 B5',
        '. . . . . . . .',
        '. . . . E6 C6 A5 C6',
        '. . . . . . . .',
        '. . . . F6 D6 Bb5 D6',
        '. . . . . . . .',
        '. . . . . . . .',
      ].join(' | '),
      harmony: 'sparkle',
      bass: 'offbeat',
    },
    b: prechorus,
    s: chorus,
    riff: { ...riff, lead: 'alt' },
    brk: {
      chords: 'Fmaj7 | G/F | Fmaj7 | G/F | Bbmaj7 | Am7 | Gm7 | C7sus4 C7',
      melody: [
        'A5 - - - E6 - - -',
        'D6 - - - - - B5 -',
        'C6 - - - G6 - - -',
        'F6 - - - D6 - - -',
        'D6 - - - - - C6 -',
        'C6 - - - - - . .',
        'Bb5 - - - D6 - - -',
        'C6 - - - Bb5 - - -',
      ].join(' | '),
      drums: false,
      bass: false,
      harmony: 'sparkle',
    },
  },
  form: ['intro', 'a', 'b', 's', 'riff', 'brk', 'b', 's'],
  loopFrom: 1,
};
