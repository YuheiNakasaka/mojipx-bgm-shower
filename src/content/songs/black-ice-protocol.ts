import type { SongDef } from '../../domain/music/song.ts';

// A machine voice inside a cold network: a riff of octave-jumping sixteenth pairs that leans on a flat-II chord over
// the tonic pedal, a robotic staccato verse that the riff answers, a pre-chorus climbing to the Neapolitan, and a
// chorus that launches up to its ninth on a dotted cell and peaks over the flat II before falling home through sus4.
// The bridge strips the band to robot drums and the pad.
const riff = {
  chords: 'Dm7 | Ebmaj7/D | Dm7 | Ebmaj7/D',
  melody: [
    'D5 D6 . A5 C6 . A5 . D5 D6 . A5 F5 . E5 .',
    'D5 D6 . Bb5 Eb6 . Bb5 . D5 D6 . Bb5 G5 . F5 .',
    'D5 D6 . A5 C6 . A5 . D5 D6 . A5 F6 . E6 .',
    'Eb6 - - D6 - - Bb5 - G5 - - - . . . .',
  ].join(' | '),
};

const chorus = {
  chords: 'Dm9 | Bbmaj7 | C | Dm7 | Dm9 | Bbmaj7 | Ebmaj7 | A7sus4 A7',
  melody: [
    'A5 - - D6 - - E6 - - - - - F6 - E6 -',
    'D6 - - - - - - - . . . . A5 - Bb5 -',
    'G5 - - C6 - - D6 - - - - - E6 - D6 -',
    'C6 - - - - - - - A5 - - - . . . .',
    'A5 - - D6 - - E6 - - - - - F6 - G6 -',
    'F6 - - - - - - - D6 - - - F6 - G6 -',
    'G6 - - - - - - - F6 - - - Eb6 - - -',
    'D6 - - - - - - - C#6 - - - A5 - - -',
  ].join(' | '),
  counter: [
    'D5 D6 . A5 C6 . A5 . D5 D6 . A5 F5 . E5 .',
    'D5 D6 . Bb5 A5 . F5 . D5 D6 . Bb5 F5 . D5 .',
    'C5 C6 . G5 E5 . G5 . C5 C6 . G5 E5 . D5 .',
    'D5 D6 . A5 C6 . A5 . D5 D6 . A5 F5 . E5 .',
    'D5 D6 . A5 C6 . A5 . D5 D6 . A5 F5 . E5 .',
    'D5 D6 . Bb5 A5 . F5 . D5 D6 . Bb5 F5 . D5 .',
    'Eb5 Eb6 . Bb5 G5 . Bb5 . Eb5 Eb6 . Bb5 G5 . F5 .',
    'A4 A5 . E5 D5 . E5 . A4 A5 . E5 C#5 . E5 .',
  ].join(' | '),
  lead: 'alt' as const,
};

const prechorus = {
  chords: 'Gm7 | Am7 | Bbmaj7 | C | Gm7 | Am7 | Ebmaj7 | A7sus4 A7',
  melody: [
    'D5 - - - F5 - - - G5 - - - A5 - Bb5 -',
    'C6 - - - - - - - A5 - - - . . . .',
    'F5 - - - A5 - - - Bb5 - - - C6 - D6 -',
    'E6 - - - - - - - C6 - - - . . . .',
    'G5 - - - Bb5 - - - D6 - - - C6 - Bb5 -',
    'C6 - - - E6 - - - - - - - . . . .',
    'G5 - - - Bb5 - - - Eb6 - - - D6 - Bb5 -',
    'D6 - - - - - - - C#6 - - - . . . .',
  ].join(' | '),
  harmony: 'arp16' as const,
  bass: 'octave' as const,
};

export const blackIceProtocol: SongDef = {
  id: 'black-ice-protocol',
  title: 'Black Ice Protocol',
  style: 'vocal-electro',
  mood: { valence: -0.6, energy: 0.75 },
  key: 'Dm',
  bpm: 156,
  steps: 4,
  sections: {
    intro: { ...riff, drums: false, bass: 'whole' },
    a: {
      chords: 'Dm7 | Ebmaj7/D | Dm7 | Ebmaj7/D | Bbmaj7 | C | Gm7 | A7sus4 A7',
      melody: [
        'A4 A4 . C5 . A4 D5 . . . . . . . . .',
        'Bb4 Bb4 . D5 . Bb4 Eb5 . . . . . . . . .',
        'A4 A4 . C5 . A4 F5 . E5 . D5 . . . . .',
        'G4 . G4 Bb4 . D5 . Eb5 - - - . . . . .',
        'F5 F5 . D5 . F5 A5 . . . . . . . . .',
        'G5 G5 . E5 . G5 C6 . . . . . . . . .',
        'F5 - - - D5 - - - Bb4 - - - . . . .',
        'D5 - - - - - - - C#5 - - - . . . .',
      ].join(' | '),
      counter: [
        '. . . . . . . . D5 D6 . A5 F5 . E5 .',
        '. . . . . . . . D5 D6 . Bb5 G5 . F5 .',
        '. . . . . . . . . . . . . . . .',
        '. . . . . . . . . . . . Bb5 . G5 .',
        '. . . . . . . . D5 D6 . Bb5 F5 . D5 .',
        '. . . . . . . . C5 C6 . G5 E5 . D5 .',
        '. . . . . . . . . . . . . . . .',
        '. . . . . . . . . . . . E5 . G5 .',
      ].join(' | '),
      pad: false,
      harmony: 'offbeat',
      drums: 'robot',
    },
    b: prechorus,
    s: chorus,
    riff: { ...riff, lead: 'alt' },
    c: {
      chords: 'Ebmaj7/D | Dm9 | Ebmaj7/D | Dm9 | Bbmaj7 | Gm7 | Ebmaj7 | A7sus4 A7',
      melody: [
        'G5 - - - - - - - F5 - - - Eb5 - - -',
        'D5 - - - - - - - . . . . . . . .',
        'Bb5 - - - - - - - A5 - - - G5 - - -',
        'F5 - - - - - - - . . . . . . . .',
        'D6 - - - - - - - C6 - - - Bb5 - - -',
        'Bb5 - - - A5 - - - G5 - - - D5 - - -',
        'G5 - - - Bb5 - - - D6 - - - Eb6 - - -',
        'D6 - - - - - - - C#6 - - - . . . .',
      ].join(' | '),
      counter: [
        '. . . . . . . . . . . . . . . .',
        '. . . . . . . . D5 D6 . A5 F5 . E5 .',
        '. . . . . . . . . . . . . . . .',
        '. . . . . . . . D5 D6 . A5 C6 . A5 .',
        '. . . . . . . . . . . . . . . .',
        '. . . . . . . . . . . . . . . .',
        '. . . . . . . . . . . . . . . .',
        '. . . . . . . . . . . . E5 . G5 .',
      ].join(' | '),
      drums: 'robot',
      bass: false,
      harmony: false,
    },
  },
  form: ['intro', 'a', 'b', 's', 'riff', 'c', 'b', 's'],
  loopFrom: 1,
};
