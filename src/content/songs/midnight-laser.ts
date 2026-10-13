import type { SongDef } from '../../domain/music/song.ts';

// A night race in G minor: a synth-brass riff climbs the tonic triad over a falling bass, the verse revs on
// repeated notes, and the vi–IV–V–I chorus rises in triads to a harmonic-minor sus4 that will not let go.
const riff = {
  chords: 'Gm | Gm/F | Ebmaj7 | D7sus4 D7',
  melody: 'G5 . Bb5 D6 . G6 F6 D6 | F5 . Bb5 D6 . F6 Eb6 D6 | G5 . Bb5 Eb6 . G6 F6 Eb6 | G5 . C6 D6 . A5 F#5 .',
};

const chorus = {
  chords: 'Gm | Ebmaj7 | F | Bb | Cm7 | D7 | Ebmaj7 F | D7sus4 D7',
  melody: [
    'Bb5 - D6 - G6 - - -',
    'F6 - - Eb6 D6 - Bb5 -',
    'A5 - C6 - F6 - - -',
    'D6 - - C6 Bb5 - . .',
    'G5 - C6 - Eb6 - - -',
    'F#6 - - - D6 - C6 -',
    'G6 - - - A6 - - -',
    'G6 - - - F#6 - - -',
  ].join(' | '),
  counter: [
    'G4 . Bb4 D5 . G5 F5 D5',
    'G4 . Bb4 Eb5 . G5 F5 Eb5',
    'A4 . C5 F5 . A5 G5 F5',
    'Bb4 . D5 F5 . Bb5 A5 F5',
    'G4 . C5 Eb5 . G5 F5 Eb5',
    'F#4 . A4 D5 . F#5 E5 D5',
    'G4 . Bb4 Eb5 . A4 C5 F5',
    'G4 . C5 D5 . F#4 A4 C5',
  ].join(' | '),
  lead: 'alt' as const,
};

export const midnightLaser: SongDef = {
  id: 'midnight-laser',
  title: 'Midnight Laser',
  style: 'eurobeat',
  mood: { valence: -0.55, energy: 0.75 },
  key: 'Gm',
  bpm: 155,
  sections: {
    intro: { ...riff, drums: false },
    a: {
      chords: 'Gm | F | Ebmaj7 | D7 | Gm | F | Cm7 | D7',
      melody: [
        '. D5 D5 Eb5 . D5 Bb4 .',
        '. C5 C5 D5 . C5 A4 .',
        '. Bb4 Bb4 C5 . Bb4 G4 .',
        'A4 - - - F#4 - . .',
        '. D5 D5 F5 . G5 F5 D5',
        '. C5 C5 F5 . A5 G5 F5',
        'Eb5 - - - D5 - C5 -',
        'D5 - - - - - . .',
      ].join(' | '),
      harmony: 'offbeat',
      drums: 'four',
    },
    b: {
      chords: 'Ebmaj7 | F | Dm7 | Gm | Cm7 | Dm7 | Ebmaj7 | D7sus4 D7',
      melody: [
        'G5 - - Bb5 - - D6 -',
        'C6 - - - - - A5 -',
        'A5 - - C6 - - F6 -',
        'D6 - - - - - . .',
        'Eb6 - - - D6 - C6 -',
        'D6 - - - F6 - - -',
        'G6 - - - - - F6 Eb6',
        'D6 - - - C6 - A5 -',
      ].join(' | '),
      drums: 'half',
    },
    s: chorus,
    riff,
  },
  form: ['intro', 'a', 'b', 's', 'riff', 'a', 'b', 's', 'riff'],
  loopFrom: 1,
};
