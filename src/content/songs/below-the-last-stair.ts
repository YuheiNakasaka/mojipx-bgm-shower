import type { SongDef } from '../../domain/music/song.ts';

// The deepest floor: a three-note ostinato ticks across the bar over a C# pedal while the theme climbs four steps and
// drops through a Phrygian trapdoor (D over C#), a warm memory of E major passes by, then a lament bass sinks
// chromatically under the theme slowed to long tones before it returns over a march.
const ostinato = [
  'C#4 E4 G#4 C#4 E4 G#4 C#4 E4',
  'D4 F#4 A4 D4 F#4 A4 D4 F#4',
  'C#4 E4 G#4 C#4 E4 G#4 C#4 E4',
  'D4 F#4 A4 D4 F#4 A4 D4 F#4',
  'C#4 E4 G#4 C#4 E4 G#4 C#4 E4',
  'C#4 F#4 A4 C#4 F#4 A4 C#4 F#4',
  'D4 F#4 A4 D4 F#4 A4 C#4 F#4',
  'C#4 D#4 G#4 C#4 C4 D#4 G#4 C4',
].join(' | ');

const themeChords = 'C#m | D/C# | C#m | D/C# | Amaj7 | F#m9 | Dmaj7 | G#7sus4 G#7';

const themeOpening = ['G#4 - C#5 - D#5 - E5 -', 'D5 - - - - - . .', 'E5 - D#5 - C#5 - G#4 -', 'A4 - - - - - . .'];

export const belowTheLastStair: SongDef = {
  id: 'below-the-last-stair',
  title: 'Below the Last Stair',
  style: 'deep-dungeon',
  mood: { valence: -0.7, energy: 0.3 },
  key: 'C#m',
  bpm: 108,
  sections: {
    intro: {
      chords: 'C#m | D/C# | C#m | D/C#',
      melody: '. . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . .',
      counter: ostinato.split(' | ').slice(0, 4).join(' | '),
      drums: false,
      harmony: false,
      bass: 'whole',
    },
    a: {
      chords: themeChords,
      melody: [...themeOpening, 'C#5 - E5 - G#5 - - -', 'A5 - - - G#5 - F#5 -', 'F#5 - - - E5 - D5 -', 'C#5 - - - C5 - . .'].join(' | '),
      counter: ostinato,
      harmony: 'pad',
      bass: 'whole',
    },
    a2: {
      chords: themeChords,
      melody: [...themeOpening, 'E5 - G#5 - C#6 - - -', 'B5 - - - A5 - G#5 -', 'A5 - - - - - F#5 -', 'F#5 - - - D#5 - C5 -'].join(' | '),
      counter: ostinato,
      harmony: 'pad',
    },
    b: {
      chords: 'Amaj7 | B/A | G#m7 | C#m9 | F#m9 | B7 | Emaj7 | G#7sus4 G#7',
      melody: [
        'E5 - G#5 - C#6 - - -',
        'D#6 - - - C#6 - B5 -',
        'D#6 - - - - - B5 -',
        'G#5 - - - - - . .',
        'A5 - C#6 - E6 - - -',
        'D#6 - - - C#6 - B5 -',
        'B5 - - - - - G#5 -',
        'C#6 - - - C6 - . .',
      ].join(' | '),
      counter: [
        'E4 - - - - - - -',
        'F#4 - - - - - - -',
        'B4 - - - - - - -',
        'G#4 - - - - - - -',
        'A4 - - - - - - -',
        'F#4 - - - - - - -',
        'G#4 - - - - - - -',
        'F#4 - - - - - - -',
      ].join(' | '),
    },
    c: {
      chords: 'C#m | C#m/C | C#m/B | F#/A# | Amaj7 | Am6 | G#7sus4 | G#7',
      melody: [
        'E6 - - - - - - -',
        'D#6 - - - - - - -',
        'C#6 - - - - - - -',
        'C#6 - - - A#5 - - -',
        'G#5 - - - - - - -',
        'A5 - - - C6 - - -',
        'C#6 - - - - - - -',
        'C6 - - - G#5 - D#5 -',
      ].join(' | '),
      counter: [
        'C#4 E4 G#4 C#4 E4 G#4 C#4 E4',
        'C4 E4 G#4 C4 E4 G#4 C4 E4',
        'B3 E4 G#4 B3 E4 G#4 B3 E4',
        'A#3 C#4 F#4 A#3 C#4 F#4 A#3 C#4',
        'A3 C#4 E4 A3 C#4 E4 A3 C#4',
        'A3 C4 E4 A3 C4 E4 A3 F#4',
        'G#3 C#4 D#4 G#3 C#4 D#4 G#3 C#4',
        'G#3 C4 D#4 G#3 C4 D#4 F#4 G#4',
      ].join(' | '),
      drums: false,
      harmony: 'pad',
      bass: 'whole',
    },
    a3: {
      chords: themeChords,
      melody: [...themeOpening, 'E5 - G#5 - C#6 - E6 -', 'C#6 - - - B5 - A5 -', 'A5 - - - F#5 - D5 -', 'C#5 - - - C5 - . .'].join(' | '),
      counter: ostinato,
      drums: 'march',
      harmony: 'arp-updown',
    },
  },
  form: ['intro', 'a', 'a2', 'b', 'c', 'a3'],
  loopFrom: 1,
};
