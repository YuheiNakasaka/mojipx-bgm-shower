import type { SongDef } from '../../domain/music/song.ts';

// Grim siege theme in harmonic minor: a siren over a Phrygian flat II, a heroic stand in the relative major, a breakdown
// over a dominant pedal, and a last charge where the call returns as the counter beneath its own variation.
const call = ['C5 G4 C5 D5 Eb5 - G5 -', 'Ab5 - G5 F5 Eb5 - C5 -', 'F5 C5 F5 G5 Ab5 - C6 -', 'B5 - G5 - F5 - D5 -'];
const callChords = 'Cm | Abmaj7 | Fm7 | G7';

const stand = {
  chords: 'Abmaj7 | Bb | Eb/G | Cm | Fm7 | Abmaj7 | Dm7b5 | G7',
  melody: [
    'Eb5 - - - Ab5 - C6 -',
    'D6 - - - C6 - Bb5 -',
    'G5 - - - Bb5 - Eb6 -',
    'D6 - C6 - G5 - - -',
    'Ab5 G5 F5 G5 Ab5 - C6 -',
    'Eb6 D6 C6 D6 Eb6 - C6 -',
    'Ab5 - - G5 F5 - Ab5 -',
    'G5 - F5 - D5 - B4 -',
  ].join(' | '),
};

export const lastBastion: SongDef = {
  id: 'last-bastion',
  title: 'Last Bastion',
  style: 'pixel-quest',
  mood: { valence: -0.6, energy: 0.6 },
  key: 'Cm',
  bpm: 150,
  sections: {
    siren: {
      chords: 'Cm | Db/C | Cm | G7',
      melody: 'G5 - - - - - - - | Ab5 - - - - - - - | G5 - - - - - - - | F5 - - - D5 - B4 -',
      harmony: 'pulse',
      bass: 'pedal',
    },
    a: {
      chords: `${callChords} | Cm | Bb | Abmaj7 | G7`,
      melody: [...call, 'C5 G4 C5 D5 Eb5 - G5 -', 'D5 Bb4 D5 Eb5 F5 - Bb5 -', 'C6 - Bb5 Ab5 Eb5 - C5 -', 'D5 - - - B4 - - -'].join(' | '),
    },
    a2: {
      chords: `${callChords} | Cm | Bb | Ab G7 | Cm`,
      melody: [...call, 'Eb5 C5 Eb5 F5 G5 - C6 -', 'D6 - C6 Bb5 F5 - Bb5 -', 'Ab5 - F5 - D5 - B4 -', 'C5 - - - - - . .'].join(' | '),
      counter: [
        'G5 - - - - - - -',
        'C6 - - - - - - -',
        'C6 - - - Ab5 - - -',
        'D6 - - - B5 - - -',
        'G5 - - - - - - -',
        'F5 - - - - - - -',
        'Eb5 - - - D5 - - -',
        'Eb5 - - - - - . .',
      ].join(' | '),
    },
    b: { ...stand, harmony: 'arp-updown', drums: 'half' },
    c: {
      chords: 'Cm/G | Ab/G | Fm/G | G7 | Cm/G | Db/G | Fm/G | G7',
      melody: [
        'Eb5 - - - - - D5 Eb5',
        'C5 - - - - - . .',
        'F5 - - - - - Eb5 F5',
        'D5 - - - - - . .',
        'G5 - - - - - F5 G5',
        'Ab5 - - - - - . .',
        'C6 - - - Ab5 - F5 -',
        'B5 - - - G5 - F5 -',
      ].join(' | '),
      harmony: 'pad',
      bass: 'pedal',
      drums: 'half',
    },
    b2: {
      ...stand,
      counter: [
        'C5 - - - - - - -',
        'D5 - - - F5 - - -',
        'Bb4 - - - Eb5 - G5 -',
        'G5 - - - Eb5 - - -',
        'C5 - - - - - Eb5 -',
        'Ab4 - - - C5 - Eb5 -',
        'F5 - - - D5 - - -',
        'D5 - - - B4 - - -',
      ].join(' | '),
      bass: 'gallop',
    },
    a3: {
      chords: `${callChords} | Cm | Bb | Abmaj7 | G7sus4 G7`,
      melody: [...call, 'Eb5 C5 Eb5 F5 G5 - C6 -', 'D6 - C6 Bb5 F5 - Bb5 -', 'C6 - Bb5 C6 Eb6 - - -', 'D6 - - C6 B5 - G5 -'].join(' | '),
      counter: [
        'Eb4 - Eb4 F4 G4 - C5 -',
        'Eb5 - Eb5 C5 C5 - Ab4 -',
        'C5 - C5 Eb5 F5 - Ab5 -',
        'G5 - D5 - B4 - G4 -',
        'C5 G4 C5 D5 Eb5 - G5 -',
        'D5 Bb4 D5 Eb5 F5 - Bb5 -',
        'Ab5 - G5 Ab5 C6 - - -',
        'F5 - - - D5 - - -',
      ].join(' | '),
      bass: 'gallop',
    },
  },
  form: ['siren', 'a', 'a2', 'b', 'c', 'b2', 'a3'],
  loopFrom: 1,
};
