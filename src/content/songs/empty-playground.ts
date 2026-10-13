import type { SongDef } from '../../domain/music/song.ts';

// An empty playground in the snow: a nursery tune on a music box, sung again over a low answering voice, a remembered
// summer in the relative major, then the tune once more, breaking off half way and left hanging on the dominant.
const tune = ['E5 - - D5 C5 - E5 -', 'A5 - - - - - G5 -', 'E5 - - D5 C5 - G4 -', 'B4 - - - D5 - - -'];

export const emptyPlayground: SongDef = {
  id: 'empty-playground',
  title: 'Empty Playground',
  style: 'snowfall',
  mood: { valence: -0.6, energy: -0.7 },
  key: 'Am',
  bpm: 84,
  sections: {
    intro: {
      chords: 'Am | E7sus4 E7',
      melody: 'E6 - C6 - A5 - E5 - | D6 - - - B5 - G#5 -',
      harmony: 'arp-down',
      bass: false,
      drums: false,
    },
    a: {
      chords: 'Am | Fmaj7 | C | G | Dm7 | Am/C | Bm7b5 E7 | Am',
      melody: [...tune, 'F5 - - E5 D5 - A4 -', 'C5 - - B4 A4 - - -', 'D5 - - C5 B4 - G#4 -', 'A4 - - - - - . .'].join(' | '),
      bass: 'whole',
      drums: false,
    },
    a2: {
      chords: 'Am | Fmaj7 | C | G | Dm7 | Fmaj7 | Dm6 E7 | Am',
      melody: [...tune, 'F5 - - E5 D5 - A5 -', 'C6 - - B5 A5 - - -', 'B5 - - A5 G#5 - E5 -', 'A5 - - - . . E5 G5'].join(' | '),
      counter: [
        'A3 - - - E4 - - -',
        'F4 - A4 - C5 - E5 -',
        'G4 - - - E4 - - -',
        'D4 - G4 - B4 - D5 -',
        'D4 - - - F4 - - -',
        'A4 - - - E5 - - -',
        'F4 - - - E4 - D4 -',
        'C4 - - - - - - -',
      ].join(' | '),
      drums: false,
    },
    b: {
      chords: 'Fmaj7 | G | Em7 | Am | Dm7 | G | Cmaj7 | E7sus4 E7',
      melody: [
        'A5 - - G5 F5 - - -',
        'B5 - - A5 G5 - - -',
        'E5 - G5 - B5 - D6 -',
        'C6 - - - - - B5 A5',
        'F5 - A5 - D6 - F6 -',
        'E6 - - - D6 - B5 -',
        'C6 - - - - - B5 -',
        'A5 - - - G#5 - - -',
      ].join(' | '),
      harmony: 'arp-updown',
      bass: 'walk',
    },
    a3: {
      chords: 'Am | Fmaj7 | C | G | Fmaj7 | Dm6 | Am | E7sus4 E7',
      melody: [...tune, 'C5 - - - A4 - - -', 'B4 - - - - - . .', 'C5 - - - B4 - A4 -', 'A4 - - - G#4 - - -'].join(' | '),
      counter: [
        'A3 - - - - - - -',
        'C4 - - - - - - -',
        'E4 - - - - - - -',
        'D4 - - - - - - -',
        'A3 - - - - - E4 F4',
        'F4 - - - D4 - - -',
        'E4 - - - - - - -',
        'D4 - - - - - - -',
      ].join(' | '),
      bass: 'whole',
      drums: false,
    },
  },
  form: ['intro', 'a', 'a2', 'b', 'a3'],
  loopFrom: 1,
};
