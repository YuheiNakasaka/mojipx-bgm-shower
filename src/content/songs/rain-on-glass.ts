// Rain on a window late at night, in minor-ninth lo-fi: a verse of falling three-note sighs, a pre-chorus that turns
// the same rhythm upward, and a chorus that opens on the relative major, aches through G♯7♭9 and lands on the sigh again.
import type { SongDef } from '../../domain/music/song.ts';

const VERSE_CHORDS = 'C#m9 | Amaj7 | F#m9 | G#7sus4 G#7 | C#m9 | Emaj7 | Amaj7 | D#m7b5 G#7b9';

const verse = ['. . G#5 F#5 E5 - D#5 -', 'C#5 - - - . . G#4 A4', 'B4 - A4 - . . C#5 E5', 'F#5 - - - D#5 - - .'];

export const rainOnGlass: SongDef = {
  id: 'rain-on-glass',
  title: 'Rain on Glass',
  style: 'lofi-loop',
  mood: { valence: -0.7, energy: -0.6 },
  key: 'C#m',
  bpm: 78,
  sections: {
    intro: {
      chords: 'Amaj7 | G#7sus4 G#7',
      melody: '. . G#5 F#5 E5 - C#5 - | D#5 - - - B#4 - - .',
      drums: false,
      harmony: 'pad',
      bass: 'whole',
    },
    a: {
      chords: VERSE_CHORDS,
      melody: [...verse, '. . G#5 F#5 E5 - C#6 -', 'B5 - G#5 - . . F#5 E5', 'G#5 - E5 - . . C#5 E5', 'F#5 - - E5 D#5 - - .'].join(' | '),
      drums: 'half',
      bass: 'whole',
    },
    a2: {
      chords: VERSE_CHORDS,
      melody: [...verse, '. . G#5 F#5 E5 - G#5 B5', '- - - - G#5 - F#5 E5', 'C#6 - - - B5 - A5 -', 'F#5 - - E5 D#5 - - .'].join(' | '),
      drums: 'half',
    },
    b: {
      chords: 'F#m9 | G#m7 | Amaj7 | B9sus4 B7',
      melody: '. . A4 B4 C#5 - E5 - | . . D#5 E5 F#5 - B5 - | . . E5 F#5 G#5 - C#6 - | B5 - - - D#6 - - .',
    },
    s: {
      chords: 'Emaj7 | G#7b9 | C#m9 | C#m9/B | Amaj7 | B9 | G#m7 C#m9 | F#m9 G#7sus4',
      melody: [
        '. . E5 G#5 D#6 - - -',
        '- - - - B#5 - G#5 -',
        '. . E5 G#5 C#6 - - -',
        '- - - - B5 - G#5 -',
        '. . E5 A5 E6 - - -',
        'D#6 - - - C#6 - B5 -',
        '. . G#5 F#5 E5 - D#5 -',
        'C#5 - - - - - . .',
      ].join(' | '),
      counter: [
        'G#4 - - - B4 - D#5 -',
        'B#4 - - - D#5 - - -',
        'C#5 - - - E5 - - -',
        'D#5 - - - B4 - - -',
        'C#5 - - - - - - -',
        'B4 - - - F#5 - - -',
        'B4 - - - G#4 - - -',
        'A4 - - - G#4 - - -',
      ].join(' | '),
      bass: 'groove',
      harmony: 'arp-updown',
    },
  },
  form: ['intro', 'a', 'a2', 'b', 's'],
  loopFrom: 1,
};
