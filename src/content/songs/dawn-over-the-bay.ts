import type { SongDef } from '../../domain/music/song.ts';

// The sky going pale over the water: a hushed verse over a rising bass, a breakdown where only the pad and a lone
// saw remain, then the anthem in dotted 3-3-2 rhythm, its 9th aching over the flat sixth and a pluck answering it.
const anthem = {
  chords: 'Dm | Bbmaj7 | F | C | Gm7 | Bbmaj7 | Csus4 C | A7sus4 A7',
  melody: [
    'F5 - - A5 - - D6 -',
    'C6 - - - - - A5 -',
    'A5 - - C6 - - F6 -',
    'E6 - - - - - D6 C6',
    'Bb5 - - D6 - - G6 -',
    'A6 - - - G6 - F6 -',
    'F6 - - - E6 - - -',
    'D6 - - - C#6 - - -',
  ].join(' | '),
  lead: 'alt' as const,
};

export const dawnOverTheBay: SongDef = {
  id: 'dawn-over-the-bay',
  title: 'Dawn Over The Bay',
  style: 'trance-pop',
  mood: { valence: 0.1, energy: 0.65 },
  key: 'Dm',
  bpm: 138,
  sections: {
    intro: {
      chords: 'Dm | Bbmaj7 | F | C',
      melody: 'D6 - - - - - - - | C6 - - - - - - - | A5 - - - - - - - | G5 - - - - - . .',
      drums: false,
      bass: false,
    },
    a: {
      chords: 'Dm | C/E | F | Gm7 | Bbmaj7 | F/A | Gm7 | A7',
      melody: [
        '. D5 E5 F5 - - . .',
        '. E5 F5 G5 - - . .',
        '. F5 G5 A5 - - C6 -',
        'Bb5 - - - A5 - G5 -',
        '. D5 F5 A5 - - . .',
        '. C5 F5 A5 - - G5 F5',
        'D5 - - - Bb4 - D5 -',
        'C#5 - - - E5 - - -',
      ].join(' | '),
      pad: false,
      drums: 'half',
      bass: 'offbeat',
    },
    b: {
      chords: 'Bbmaj7 | C | Am7 | Dm | Gm7 | C | Fmaj7 | A7sus4 A7',
      melody: [
        'F5 - - - G5 - A5 -',
        'G5 - - - A5 - Bb5 -',
        'A5 - - - B5 - C6 -',
        'D6 - - - - - . .',
        'Bb5 - - - C6 - D6 -',
        'C6 - - - D6 - E6 -',
        'F6 - - - E6 - - -',
        'D6 - - - C#6 - - -',
      ].join(' | '),
    },
    s: anthem,
    brk: {
      chords: anthem.chords,
      melody: [
        'F5 - - - A5 - - -',
        'C6 - - - - - - -',
        'C6 - - - F6 - - -',
        'E6 - - - - - - -',
        'D6 - - - Bb5 - - -',
        'A5 - - - - - - -',
        'G5 - - - - - - -',
        'A5 - - - - - . .',
      ].join(' | '),
      drums: false,
      bass: false,
      harmony: false,
    },
    build: {
      chords: 'Gm7 | Bbmaj7 | C | A7sus4 A7',
      melody: 'D5 - - F5 - - G5 - | F5 - - A5 - - Bb5 - | G5 - - C6 - - E6 - | E6 - - - C#6 - A5 -',
      bass: 'pedal',
      harmony: 'arp16',
    },
    s2: {
      ...anthem,
      counter: [
        'D5 F5 A5 D5 F5 A5 D5 F5',
        'D5 F5 A5 D5 F5 A5 D5 F5',
        'C5 F5 A5 C5 F5 A5 C5 F5',
        'C5 E5 G5 C5 E5 G5 C5 E5',
        'D5 G5 Bb5 D5 G5 Bb5 D5 G5',
        'D5 F5 A5 D5 F5 A5 D5 F5',
        'C5 F5 G5 C5 E5 G5 C5 E5',
        'A4 D5 E5 A4 C#5 E5 A4 C#5',
      ].join(' | '),
    },
  },
  form: ['intro', 'a', 'b', 's', 'brk', 'build', 's', 's2'],
  loopFrom: 1,
};
