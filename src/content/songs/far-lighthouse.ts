import type { SongDef } from '../../domain/music/song.ts';

// A lighthouse beam sweeping an empty sea: a four-note sweep (5–1–9–5) that passes every two bars, a lonely line of held
// fifths and ninths over i–♭VI–iv–V, then the beam itself becomes the chorus: the sweep sung high in a 3+3+2 lilt over
// ♭VI, iv9, the Dorian IV (B9, its D♯ shining far out) and a ♭VI–♭VII–i landing on its peak, sinking onto V7♭9.
const beams = {
  chords: 'F#m9 | Dmaj9 | F#m9 | C#7sus4',
  melody: '. . . . C#5 F#5 G#5 C#6 | - - - - - - . . | . . . . C#5 F#5 G#5 B5 | - - - - - - . .',
};

const shore = {
  chords: 'F#m9 | Dmaj7 | Bm9 | C#7sus4 C#7 | F#m9 | Dmaj7 | Bm9 | C#7sus4 C#7b9',
  melody: [
    'C#6 - - - - - B5 A5',
    '- - - - . C#5 F#5 A5',
    '- - - - F#5 - E5 -',
    'F#5 - - - E#5 - - .',
    'C#6 - - - - - B5 D6',
    '- - - - . F#5 A5 C#6',
    '- - - - B5 - A5 -',
    'F#5 - - - E#5 - - .',
  ].join(' | '),
};

const light = {
  chords: 'Dmaj9 | Bm9 | F#m9 | B9 | Dmaj9 | E6 | F#m9 | C#7sus4 C#7b9',
  melody: [
    'A5 - - D6 - - E6 -',
    'A6 - - - - - F#6 -',
    'C#6 - - F#6 - - G#6 -',
    '- - - - F#6 - D#6 -',
    'A5 - - D6 - - E6 -',
    'G#6 - - - - - E6 -',
    'A6 - - - G#6 - - -',
    'F#6 - - - D6 - B5 -',
  ].join(' | '),
};

export const farLighthouse: SongDef = {
  id: 'far-lighthouse',
  title: 'Far Lighthouse',
  style: 'starlit-dream',
  mood: { valence: -0.55, energy: -0.5 },
  key: 'F#m',
  bpm: 76,
  sections: {
    beams,
    a: shore,
    s: { ...light, harmony: 'broken', bass: 'half' },
    a2: {
      chords: 'F#m9 | Dmaj7 | Bm9 | C#7sus4 C#7',
      melody: shore.melody.split(' | ').slice(0, 4).join(' | '),
      counter: 'F#4 - - - G#4 - - - | A4 - - - - - - - | D5 - - - C#5 - - - | B4 - - - G#4 - - -',
    },
    s2: {
      ...light,
      counter: [
        'F#4 - - - - - - -',
        '. . D5 - C#5 - B4 -',
        'A4 - - - - - - -',
        '. . A4 - B4 - C#5 -',
        'D5 - - - - - - -',
        'B4 - - - C#5 - - -',
        'C#5 - - - - - - -',
        'B4 - - - - - - -',
      ].join(' | '),
      harmony: 'arp16',
      bass: 'ballad',
    },
  },
  form: ['beams', 'a', 's', 'beams', 'a2', 's2'],
  loopFrom: 1,
};
