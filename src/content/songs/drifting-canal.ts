// A slow boat on still water at dusk, in lo-fi: long notes ringed by quick sixteenth-note turns like ripples, then a
// wider middle that passes under a bridge on the borrowed minor iv and a chromatic diminished step before drifting home.
import type { SongDef } from '../../domain/music/song.ts';

const ripples = {
  chords: 'Ebmaj9 | F9sus4',
  melody: 'G5 - - - - - A5 G5 F5 G5 - - D5 - - - | C5 - - - - - D5 C5 Bb4 C5 - - - - - -',
  drums: false as const,
  harmony: 'arp16' as const,
  bass: 'whole' as const,
};

const glide = {
  chords: 'Bbmaj9 | Dm7 | Ebmaj7 | F9sus4 F7 | Bbmaj9 | Gm9 | Cm9 | F7sus4 F7',
  melody: [
    'F5 - - - - - G5 F5 Eb5 F5 - - D5 - - -',
    'C5 - - - - - D5 C5 Bb4 C5 - - A4 - - -',
    'Bb4 - - - D5 - - - G5 - - - - - A5 G5',
    'C5 - - - - - D5 C5 A4 - - - . . . .',
    'D5 - - - F5 - - - A5 - - - G5 F5 G5 A5',
    'Bb5 - - - - - - - A5 - G5 - F5 - - -',
    'Eb5 - - - - - F5 Eb5 D5 Eb5 - - C5 - - -',
    'Bb4 - - - C5 Bb4 A4 Bb4 A4 - - - C5 - - -',
  ].join(' | '),
};

export const driftingCanal: SongDef = {
  id: 'drifting-canal',
  title: 'Drifting Canal',
  style: 'lofi-loop',
  mood: { valence: 0.1, energy: -0.6 },
  key: 'Bb',
  bpm: 82,
  steps: 4,
  sections: {
    ripples,
    a: glide,
    b: {
      chords: 'Ebmaj9 | F/Eb | Dm7 | Gm9 | Cm9 | Ebm6 | Bbmaj7/D Dbdim7 | Cm9 F7sus4',
      melody: [
        'G5 - - - - - - - F5 G5 Bb5 - - - - -',
        'A5 - - - - - - - C6 - - - - - Bb5 A5',
        '- - - - - - - - F5 - - - D5 - - -',
        'G5 - - - - - A5 G5 F5 G5 - - D5 - - -',
        'Bb5 - - - - - - - G5 - - - Bb5 C6 D6 -',
        'Eb6 - - - - - - - C6 - - - Gb5 - - -',
        'F5 - - - - - - - E5 - - - G5 - - -',
        'G5 - - - - - F5 Eb5 F5 - - - . . . .',
      ].join(' | '),
      bass: 'groove',
      harmony: 'syncopate',
    },
    a2: {
      ...glide,
      counter: [
        'D4 - - - - - - - A4 - - - - - - -',
        'F4 - - - - - - - D4 - - - - - - -',
        'Eb4 - - - - - - - F4 - - - - - - -',
        'Eb4 - - - - - - - - - - - - - - -',
        'D4 - - - - - - - F4 - - - - - - -',
        'D4 - - - - - - - F4 - - - - - - -',
        'Eb4 - - - - - - - G4 - - - - - - -',
        'Eb4 - - - - - - - - - - - - - - -',
      ].join(' | '),
    },
  },
  form: ['ripples', 'a', 'b', 'a2', 'ripples'],
  loopFrom: 1,
};
