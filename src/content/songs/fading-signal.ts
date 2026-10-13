import type { SongDef } from '../../domain/music/song.ts';

// A far-off beacon: one C♯ pinging over a falling cliché bass while the chords change its meaning, a pre-chorus climbing
// on rising pickups, then a remembered song on the relative major's royal road whose rising sixths peak over iv9 and ache
// on the maj7 of the Neapolitan before a sus4 sighs onto the raised seventh; the beacon returns with no reply.
const ping = ['C#6 - - - F#5 - . .', 'C#6 - - - G#5 - . .', 'C#6 - - - A5 - . .'];

export const fadingSignal: SongDef = {
  id: 'fading-signal',
  title: 'Fading Signal',
  style: 'starlit-dream',
  mood: { valence: -0.7, energy: -0.75 },
  key: 'F#m',
  bpm: 72,
  sections: {
    intro: { chords: 'F#m9 | Dmaj7', melody: 'F#6 - - - . . . . | C#6 - - - . . . .', bass: false },
    a: {
      chords: 'F#m9 | F#m/E | Dmaj7 | C#7sus4 | Bm7 | Esus4 E | Amaj7 | C#7sus4 C#7',
      melody: [
        ...ping,
        'B5 - - - F#5 - . .',
        'D6 - - - - - C#6 B5',
        'A5 - - - G#5 - - -',
        'E5 - - - A5 - C#6 -',
        'B5 - - - G#5 - E#5 -',
      ].join(' | '),
    },
    b: {
      chords: 'Bm7 | C#m7 | Dmaj7 | E7sus4 E7',
      melody: '. . D5 E5 F#5 - - - | . . E5 F#5 G#5 - - - | . . F#5 G#5 A5 - C#6 - | B5 - - - - - G#5 -',
      harmony: 'arp-updown',
      bass: 'half',
    },
    s: {
      chords: 'Dmaj7 | E7 | C#m7 | F#m7 | Bm9 | Gmaj7 | C#7sus4 | C#7',
      melody: [
        'A5 - - F#6 - - - E6',
        '- - - - D6 - C#6 B5',
        'G#5 - - E6 - - - C#6',
        '- - - - . . F#5 A5',
        'C#6 - - A6 - - - F#6',
        '- - - - - - E6 D6',
        'F#6 - - - - - - -',
        'E#6 - - - C#6 - G#5 -',
      ].join(' | '),
      counter: [
        'F#5 - - - E5 - - -',
        'D5 - - - - - - -',
        'E5 - - - - - - -',
        'E5 - - - C#5 - - -',
        'D5 - - - - - - -',
        'B4 - - - D5 - - -',
        'B4 - - - - - - -',
        'B4 - - - G#4 - - -',
      ].join(' | '),
      harmony: 'sparkle',
      bass: 'ballad',
    },
    a2: {
      chords: 'F#m9 | F#m/E | Dmaj7 | C#7sus4 C#7',
      melody: [...ping, 'B5 - - - G#5 - . .'].join(' | '),
      counter: 'A4 - - - - - - - | G#4 - - - - - - - | F#4 - - - - - - - | F#4 - - - E#4 - - -',
    },
    coda: {
      chords: 'Dmaj7 | C#7sus4',
      melody: 'C#6 - - - A5 - . . | F#5 - - - - - . .',
      harmony: 'arp-down',
    },
  },
  form: ['intro', 'a', 'b', 's', 'a2', 'coda'],
  loopFrom: 1,
};
