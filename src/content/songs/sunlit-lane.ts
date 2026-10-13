import type { SongDef } from '../../domain/music/song.ts';

// A swung stroll down a sunny lane: secondary dominants nudge the pushed tune along, ii–Vs climb, a deceptive turn
// opens onto a plaza a minor third up where the second voice takes the tune, and the stroll comes back to rest on V.
const lane = [
  'D5 F5 . G5 - F5 D5 .',
  'F#5 A5 . C6 - A5 F#5 .',
  'G5 . Bb5 A5 G5 . D5 .',
  'E5 . G5 . Bb5 - - .',
  'C6 . Bb5 G5 Eb5 . G5 .',
  'A5 . C6 A5 F5 . Eb5 .',
];
const laneChords = 'Bbmaj7 | D7 | Gm7 | C7 | Cm7 | F7';

export const sunlitLane: SongDef = {
  id: 'sunlit-lane',
  title: 'Sunlit Lane',
  style: 'cozy-village',
  mood: { valence: 0.75, energy: 0.1 },
  key: 'Bb',
  bpm: 120,
  sections: {
    gate: {
      chords: 'Ebmaj7 | F7sus4 F7',
      melody: 'G5 . Bb5 . D6 - - . | C6 - - - A5 - . .',
      drums: false,
      bass: 'whole',
    },
    a: {
      chords: `${laneChords} | Bb6 | G7`,
      melody: [...lane, 'D5 . F5 . Bb5 - - .', 'G5 . F5 D5 B4 . . .'].join(' | '),
    },
    b: {
      chords: 'Cm7 | F7 | Dm7 | G7 | Ebmaj7 | Edim7 | Bb/F G7 | Cm7 F7',
      melody: [
        'C5 Eb5 . G5 - - Bb5 .',
        'A5 - G5 - F5 . . .',
        'D5 F5 . A5 - - C6 .',
        'B5 - A5 - G5 . . .',
        'Bb5 . D6 Eb6 - - D6 .',
        'Db6 - - - Bb5 . G5 .',
        'F5 . D5 F5 G5 . B5 .',
        'C6 . Bb5 G5 A5 . F5 .',
      ].join(' | '),
      counter: [
        '. . . . . . . .',
        '. . . . . C6 A5 F5',
        '. . . . . . . .',
        '. . . . . D6 B5 G5',
        'G5 - - - - - - -',
        'E5 - - - - - - -',
        'D5 - - - F5 - - -',
        'Eb5 - - - Eb5 - - -',
      ].join(' | '),
      harmony: 'offbeat',
    },
    a2: {
      chords: `${laneChords} | Dm7 G7 | Cm7 F7`,
      melody: [...lane, 'F5 . A5 . D6 - B5 .', 'C6 . Bb5 G5 A5 - - .'].join(' | '),
      counter: [
        'F4 A4 . Bb4 - A4 F4 .',
        'A4 C5 . D5 - C5 A4 .',
        'D5 . G5 F5 D5 . Bb4 .',
        'C5 . E5 . G5 - - .',
        'Eb5 . G5 Eb5 C5 . Eb5 .',
        'F5 . A5 F5 C5 . C5 .',
        'D5 . F5 . G5 - D5 .',
        'Eb5 . G5 Eb5 F5 - - .',
      ].join(' | '),
    },
    plaza: {
      key: 'Db',
      chords: 'Gbmaj7 | Ab7 | Fm7 | Bbm7 | Ebm7 | Ab7 | Dbmaj7 | F7sus4 F7',
      melody: [
        'Bb5 - - - Db6 - F6 -',
        'Eb6 - - - - - C6 Ab5',
        'Ab5 - - - C6 - Eb6 -',
        'Db6 - - - - - . .',
        'Gb5 - - - Bb5 - Db6 -',
        'C6 - - - - - Bb5 Ab5',
        'F5 - - - Ab5 - C6 -',
        'Bb5 - - - A5 - - -',
      ].join(' | '),
      counter: [
        'Db5 F5 . Gb5 - F5 Db5 .',
        'C5 Eb5 . F5 - Eb5 C5 .',
        'F4 Ab4 . C5 - Ab4 F4 .',
        'Db5 F5 . Ab5 - F5 Db5 .',
        'Gb4 Bb4 . Db5 - Bb4 Gb4 .',
        'Ab4 C5 . Eb5 - C5 Ab4 .',
        'Ab4 C5 . Db5 - C5 Ab4 .',
        'C5 Eb5 . F5 - Eb5 C5 .',
      ].join(' | '),
      harmony: 'broken',
      drums: 'eight',
    },
    a3: {
      chords: `${laneChords} | Bb/D G7 | Cm7 F7sus4`,
      melody: [...lane, 'D5 . F5 . G5 - B4 .', 'Eb5 . D5 Eb5 C5 - - .'].join(' | '),
      counter: [
        'Bb5 - - - A5 - - -',
        'D6 - - - C6 - - -',
        'D6 - - - Bb5 - - -',
        'C6 - - - Bb5 - - -',
        'Eb6 - - - - - - -',
        'Eb6 - - - C6 - - -',
        'D6 - - - B5 - - -',
        'C6 - - - Bb5 - - -',
      ].join(' | '),
    },
  },
  form: ['gate', 'a', 'b', 'a2', 'plaza', 'a3'],
  loopFrom: 1,
};
