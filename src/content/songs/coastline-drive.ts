import { type SongDef, transposed } from '../../domain/music/song.ts';

// Top down along the sea in summer: a verse cruising over a tonic pedal, a pre-chorus climbing by sequence, a chorus
// that turns from the royal road into the IVmaj7–III7–vi loop, and the intro riff handing over to a last chorus a step up.
const riff = {
  chords: 'Bbmaj7 | C/Bb | Am7 Dm7 | Gm7 C7sus4',
  melody: 'D5 F5 A5 C6 - - A5 - | E5 G5 C6 D6 - - C6 - | E6 - - - F6 - - - | D6 - Bb5 - G5 - - -',
};

const chorus = {
  chords: 'Bbmaj7 | C7 | Am7 | Dm7 | Bbmaj7 | A7 | Dm7 | Cm7 F7',
  melody: [
    'D6 - - - C6 A5 - C6',
    '- - D6 - E6 - G6 -',
    'E6 - - - D6 C6 - A5',
    '- - - - . . C6 D6',
    'F6 - - - E6 D6 - E6',
    '- - C#6 D6 E6 - - -',
    'G6 - - - F6 E6 - D6',
    '- - - Eb6 - - C6 .',
  ].join(' | '),
  counter: [
    'F5 - - - - - - -',
    'E5 - - - G5 - - -',
    'C5 - - - E5 - - -',
    'F5 - - - A5 G5 F5 -',
    'D5 - - - A5 - - -',
    'C#5 - - - E5 - - -',
    'D5 - - - F5 - A5 -',
    'Eb5 - - - C5 - - -',
  ].join(' | '),
  lead: 'alt' as const,
};

export const coastlineDrive: SongDef = {
  id: 'coastline-drive',
  title: 'Coastline Drive',
  style: 'city-groove',
  mood: { valence: 0.6, energy: 0.2 },
  key: 'F',
  bpm: 112,
  sections: {
    intro: { ...riff, drums: false },
    a: {
      chords: 'Fmaj7 | Gm7/F | Fmaj7 | Gm7/F | Dm7 | Dm7/C | Bbmaj7 | C7sus4',
      melody: [
        '. . A4 C5 E5 - D5 C5',
        'D5 - - - . . A4 C5',
        '. . A4 C5 E5 - G5 F5',
        '- - - - D5 - . .',
        '. . D5 F5 A5 - G5 F5',
        'E5 - - - . . D5 E5',
        '. . D5 F5 A5 - C6 -',
        'Bb5 - - - G5 - F5 -',
      ].join(' | '),
      pad: false,
      bass: 'groove',
    },
    b: {
      chords: 'Gm7 | Am7 | Bbmaj7 | Am7 D7 | Gm7 | Am7 | Bbmaj7 Bdim7 | C7sus4 C7',
      melody: [
        '. D5 - F5 G5 - A5 -',
        '. E5 - G5 A5 - C6 -',
        '. F5 - A5 Bb5 - C6 -',
        'D6 - C6 - . . A5 -',
        'Bb5 - - A5 Bb5 - D6 -',
        'C6 - - G5 C6 - E6 -',
        'D6 - - C6 D6 - - -',
        'F6 - - - E6 - C6 -',
      ].join(' | '),
      drums: 'half',
    },
    s: chorus,
    inter: riff,
    lift: { chords: 'D7sus4 D7', melody: 'G5 - - - F#5 - A5 C6', key: 'G', lead: 'alt' },
    up: transposed(chorus, 2, 'G'),
    outro: { chords: 'Gm7 | C7sus4 C7', melody: 'Bb5 - - - A5 - G5 - | F5 - - - E5 - . .' },
  },
  form: ['intro', 'a', 'b', 's', 'inter', 'lift', 'up', 'outro'],
  loopFrom: 1,
};
