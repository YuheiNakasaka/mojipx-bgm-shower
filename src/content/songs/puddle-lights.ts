import type { SongDef } from '../../domain/music/song.ts';

// City lights in puddles after midnight, in swung lo-fi: drips falling down the chromatic line of a IVmaj7–III7–vi loop (C–B–B♭–A♭),
// a talky verse that sours on the borrowed minor iv, and a chorus of sighs (9th → maj7, ♭9 → 7th) that never lands home.
const drips = {
  chords: 'Abmaj7 | G7b9 | Cm9 | Fm9 Bb7sus4',
  melody: 'C6 - - G5 - - Eb5 - | B5 - - Ab5 - - F5 - | Bb5 - - G5 - - D5 - | Ab5 - - G5 - - F5 -',
  drums: false as const,
  harmony: 'pad' as const,
  bass: 'whole' as const,
};

const chorus = {
  chords: 'Abmaj7 | G7b9 | Cm9 | Bbm9 Eb7 | Abmaj7 | G7b9 | Cm9 | Fm9 Bb7sus4',
  melody: [
    '. Eb5 G5 C6 - - Bb5 G5',
    'Ab5 - - G5 F5 - - .',
    '. Eb5 G5 D6 - - C6 Bb5',
    'Db6 - - C6 Bb5 - G5 -',
    '. Eb5 G5 C6 - - Bb5 G5',
    'Ab5 - - G5 B5 - D6 -',
    'Eb6 - - - D6 - C6 -',
    'Ab5 - - G5 F5 - - .',
  ].join(' | '),
  bass: 'groove' as const,
  harmony: 'charleston' as const,
};

export const puddleLights: SongDef = {
  id: 'puddle-lights',
  title: 'Puddle Lights',
  style: 'lofi-loop',
  mood: { valence: -0.1, energy: -0.55 },
  key: 'Eb',
  bpm: 80,
  sections: {
    intro: drips,
    a: {
      chords: 'Ebmaj9 | Dm7b5 G7b9 | Cm9 | Bbm9 Eb9 | Abmaj7 | Abm6 | Gm7 C7 | Fm9 Bb7sus4',
      melody: [
        '. . Bb4 C5 D5 - - Bb4',
        'C5 - Ab4 - G4 - B4 -',
        'C5 - - Eb5 D5 - - .',
        '. . Db5 C5 Bb4 - G4 -',
        '. . Eb4 G4 C5 - - Ab4',
        'Cb5 - - - Ab4 - F4 -',
        'G4 - Bb4 D5 E5 - C5 -',
        'Eb5 - - - F5 - - .',
      ].join(' | '),
      drums: 'half',
      bass: 'whole',
    },
    b: {
      chords: 'Fm9 | Gm7 | Abmaj7 | Bb9sus4 Bb7',
      melody: '. Ab4 C5 Eb5 G5 - - . | . Bb4 D5 F5 Bb5 - - . | . C5 Eb5 G5 C6 - - Bb5 | - - Ab5 - F5 - D5 -',
    },
    s: chorus,
    drips,
    s2: {
      ...chorus,
      counter: [
        'C5 - - - - - - -',
        'B4 - - - . G4 B4 D5',
        'Eb5 - - - - - D5 -',
        'Db5 - - - Bb4 - - -',
        'C5 - - - Eb5 - - -',
        'D5 - - - F5 - - -',
        'G5 - - - Eb5 - - -',
        'C5 - - - Eb5 - - -',
      ].join(' | '),
    },
  },
  form: ['intro', 'a', 'b', 's', 'drips', 's2'],
  loopFrom: 1,
};
