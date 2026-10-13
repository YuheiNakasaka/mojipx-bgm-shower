import { type SongDef, transposed } from '../../domain/music/song.ts';

// A late drive home in eighties city pop: a ii–V-rich verse, a pre-chorus that climbs in sequence,
// a royal-road chorus that lands on its first note a beat early, and a last chorus lifted a semitone.
const chorus = {
  chords: 'Abmaj7 | Bb7 | Gm7 | Cm7 | Abmaj7 | Bb7 | Eb/G C7 | Fm7 Bb7',
  melody: [
    'Eb6 - - - D6 - C6 -',
    'D6 - - - - - Bb5 C6',
    'D6 - Bb5 - F6 - - Eb6',
    '- - - - . . C6 D6',
    'Eb6 - - - C6 - Bb5 -',
    'D6 - - - F6 - - -',
    'G6 - - - E6 - - -',
    'F6 - Eb6 - D6 - Bb5 -',
  ].join(' | '),
  counter: [
    'C5 - - - Eb5 - - -',
    'D5 - - - F5 - - -',
    'Bb4 - - - D5 - - -',
    'C5 - - - G4 - - -',
    'Ab4 - - - C5 - - -',
    'Bb4 - - - D5 - - -',
    'Bb4 - - - Bb4 - - -',
    'Ab4 - - - Ab4 - - -',
  ].join(' | '),
  lead: 'alt' as const,
};

export const tailLights: SongDef = {
  id: 'tail-lights',
  title: 'Tail Lights',
  style: 'city-groove',
  mood: { valence: 0.3, energy: 0.2 },
  key: 'Eb',
  bpm: 108,
  sections: {
    intro: {
      chords: 'Abmaj7 | Bb7 | Gm7 C7 | Fm7 Bb7',
      melody: 'G5 - Eb5 - C5 Bb4 C5 Eb5 | F5 - D5 - Bb4 - Ab4 - | Bb4 D5 F5 G5 E5 - C5 - | Ab5 - F5 - D5 - Bb4 -',
    },
    a: {
      chords: 'Ebmaj7 | Dm7b5 G7 | Cm7 | Bbm7 Eb7 | Abmaj7 | Gm7 C7 | Fm7 | Bb7sus4 Bb7',
      melody: [
        '. Bb4 Eb5 F5 G5 - F5 Eb5',
        'D5 - C5 D5 B4 - G4 -',
        'C5 - - - . Eb5 D5 C5',
        'Db5 - C5 Bb4 G4 - Bb4 Db5',
        'C5 - - Bb4 C5 - Eb5 -',
        'D5 - Bb4 - E5 - G5 -',
        'Ab5 - G5 F5 Eb5 - C5 -',
        'Eb5 - - - D5 - . .',
      ].join(' | '),
      pad: false,
    },
    b: {
      chords: 'Abmaj7 | Bb/Ab | Gm7 | Cm7 | Fm7 | Gm7 | Abmaj7 | Bb7sus4 Bb7',
      melody: [
        'Eb5 - - F5 G5 - - Ab5',
        '- - Bb5 - Ab5 - F5 -',
        'G5 - - - D5 - F5 G5',
        'Eb5 - - - . . G5 Bb5',
        'C6 - - - Ab5 - C6 -',
        'D6 - - - Bb5 - D6 -',
        'Eb6 - D6 - C6 - Bb5 -',
        'Ab5 - - - G5 - F5 -',
      ].join(' | '),
    },
    s: chorus,
    lift: { chords: 'B7sus4 B7', melody: 'E6 - - - D#6 - B5 -', key: 'E', lead: 'alt' },
    up: transposed(chorus, 1, 'E'),
    outro: { chords: 'Abmaj7 | Bb7sus4 Bb7', melody: 'C6 - - - - - - - | Bb5 - - - - - . .' },
  },
  form: ['intro', 'a', 'b', 's', 'intro', 'b', 's', 'lift', 'up', 'outro'],
  loopFrom: 1,
};
