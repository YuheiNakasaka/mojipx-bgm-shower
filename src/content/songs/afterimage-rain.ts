import type { SongDef } from '../../domain/music/song.ts';

// A machine voice remembering someone in the rain: a music-box arpeggio riff, a half-time verse over a falling bass,
// a pre-chorus climbing on ii–iii–IV–V of the relative major, and a royal-road chorus whose hook steps up and falls
// a fourth, sequenced down the scale under four on the floor; then a breakdown leaves the voice alone with the pad.
const riff = {
  chords: 'Gmaj7 | A7 | F#m7 | Bm9',
  melody: ['F#5 D5 B4 D5 A5 - F#5 -', 'E5 C#5 A4 C#5 G5 - E5 -', 'C#5 A4 F#4 A4 E5 - C#5 -', 'D5 B4 F#4 B4 C#5 - - -'].join(' | '),
};

const chorus = {
  chords: 'Gmaj7 | A7 | F#m7 | Bm7 | Gmaj7 | A7 | Em7 F#7 | Bm9',
  melody: [
    'D6 - - E6 B5 - - -',
    'C#6 - - D6 A5 - - -',
    'A5 - - B5 F#5 - - -',
    'C#6 - - B5 D6 - - -',
    'D6 - - E6 B5 - - -',
    'C#6 - - D6 E6 - - -',
    'G6 - - F#6 E6 - - -',
    'D6 - - C#6 B5 - - .',
  ].join(' | '),
  counter: [
    '. . . . G4 B4 D5 F#5',
    '. . . . G5 E5 C#5 A4',
    '. . . . F#4 A4 C#5 E5',
    '. . . . A5 F#5 D5 B4',
    '. . . . G4 B4 D5 F#5',
    '. . . . G5 E5 C#5 A4',
    '. . . . F#4 A#4 C#5 E5',
    '. . . . C#6 A5 F#5 D5',
  ].join(' | '),
};

export const afterimageRain: SongDef = {
  id: 'afterimage-rain',
  title: 'Afterimage Rain',
  style: 'vocal-electro',
  mood: { valence: -0.3, energy: 0.3 },
  key: 'Bm',
  bpm: 130,
  sections: {
    intro: { ...riff, drums: false, bass: false },
    a: {
      chords: 'Bm9 | Bm/A | Gmaj7 | F#m7 | Em7 | D/F# | Gmaj7 | F#7sus4 F#7',
      melody: [
        '. B4 D5 E5 F#5 - E5 D5',
        'C#5 - - - . . . .',
        '. B4 D5 E5 F#5 - E5 D5',
        'C#5 - - - . . . .',
        '. E5 G5 A5 B5 - A5 G5',
        'F#5 - - - . . . .',
        '. D5 E5 F#5 G5 - F#5 E5',
        'B4 - - - A#4 - - -',
      ].join(' | '),
      counter: [
        '. . . . . . . .',
        '. . . . F#5 D5 B4 D5',
        '. . . . . . . .',
        '. . . . E5 C#5 A4 C#5',
        '. . . . . . . .',
        '. . . . A5 F#5 D5 F#5',
        '. . . . . . . .',
        '. . . . C#5 E5 F#5 -',
      ].join(' | '),
      pad: false,
      harmony: 'arp16',
      bass: 'half',
      drums: 'half',
    },
    b: {
      chords: 'Em7 | F#m7 | Gmaj7 | A | Em7 | F#m7 | Gmaj7 | F#7sus4 F#7',
      melody: [
        'B4 - E5 - F#5 - G5 -',
        'A5 - - - - - . .',
        'D5 - G5 - A5 - B5 -',
        'C#6 - - - - - . .',
        'E5 - G5 - B5 - D6 -',
        'C#6 - - - A5 - - -',
        'B5 - D6 - F#6 - E6 -',
        'B5 - - - A#5 - - -',
      ].join(' | '),
      bass: 'offbeat',
      drums: 'half',
    },
    s: chorus,
    riff: { ...riff, lead: 'alt' },
    brk: {
      chords: 'Gmaj7 | F#m7 | Em7 | Bm/D | Gmaj7 | F#m7 | Em9 | F#7sus4 F#7',
      melody: [
        'B5 - - - - - A5 -',
        'F#5 - - - - - . .',
        'G5 - - - - - F#5 -',
        'D5 - - - - - . .',
        'B5 - - - D6 - - -',
        'C#6 - - - - - . .',
        'B5 - - - G5 - - -',
        'F#5 - B5 - A#5 - C#6 -',
      ].join(' | '),
      drums: false,
      bass: false,
      harmony: false,
    },
    last: { ...chorus, lead: 'alt' },
  },
  form: ['intro', 'a', 'b', 's', 'riff', 'brk', 'last'],
  loopFrom: 1,
};
