// Slow drips in a drowned library: each falling phrase is answered a bar later by a fainter voice while the bass
// sinks a semitone at a time under F minor (F–E–E♭–D–D♭–C). Then light reaches down through the water: a rise to a
// held major seventh and a sus4 sigh, sung again a step higher over the royal road of A♭, a climb to the Neapolitan
// G♭ at the peak, and a ♭VI–♭VII that opens onto F major for one bar before the drips turn it minor again.
import type { SongDef } from '../../domain/music/song.ts';

const dripChords = 'Fm | Fm | Fm/E | Fm/E | Fm/Eb | Fm/Eb | Fm/D Dbmaj7 | C7sus4 C7';

const drips = [
  'C6 - - Ab5 G5 - F5 -',
  '- - - - . . . .',
  'Ab5 - - G5 F5 - E5 -',
  '- - - - . . . .',
  'G5 - - F5 Eb5 - C5 -',
  '- - - - . . . .',
  'F5 - - Eb5 Db5 - C5 -',
  '- - - - E5 - - -',
].join(' | ');

const echoes = [
  '. . . . . . . .',
  'C5 - - Ab4 G4 - F4 -',
  '. . . . . . . .',
  'Ab4 - - G4 F4 - E4 -',
  '. . . . . . . .',
  'G4 - - F4 Eb4 - C4 -',
  '. . . . . . . .',
  'F4 - - Eb4 D4 - C4 -',
].join(' | ');

// The hook: a rise to a held note, then a sigh down; sung again a step higher, then climbing to the peak.
const light = {
  chords: 'Dbmaj7 | Ebsus4 Eb | Cm7 | Fm7 | Bbm9 | Gbmaj7 | Dbmaj7 Eb | F',
  melody: [
    'F5 - - Ab5 C6 - - -',
    'Bb5 - - Ab5 G5 - - -',
    'G5 - - Bb5 Eb6 - - -',
    'C6 - - Bb5 Ab5 - - -',
    'Bb5 - - Db6 F6 - - -',
    'Gb6 - - F6 - - Db6 -',
    'Eb6 - - Db6 C6 - Bb5 -',
    'A5 - - - - - - -',
  ].join(' | '),
  counter: [
    'Ab4 - - - - - - -',
    'Bb4 - - - G4 - - -',
    'G4 - - - - - - -',
    'F4 - - - Ab4 - C5 -',
    'Db5 - - - - - - -',
    'Bb4 - - - Db5 - - -',
    'F5 - - - G5 - - -',
    'F5 - - - C5 - A4 -',
  ].join(' | '),
};

export const sunkenLibrary: SongDef = {
  id: 'sunken-library',
  title: 'Sunken Library',
  style: 'deep-dungeon',
  mood: { valence: -0.7, energy: -0.05 },
  key: 'Fm',
  bpm: 92,
  sections: {
    intro: {
      chords: 'Fm | Fm',
      melody: '. . . . C6 - . . | . . F5 - . . . .',
      drums: false,
      harmony: 'pad',
      bass: 'whole',
    },
    a: { chords: dripChords, melody: drips, counter: echoes, drums: false, bass: 'whole' },
    b: light,
    a2: { chords: dripChords, melody: drips, counter: echoes, harmony: 'pad' },
    // The last time, the counter echoes the hook a bar behind, as the drips echo each other.
    b2: {
      ...light,
      counter: [
        'Ab4 - - - - - - -',
        'F4 - - Ab4 C5 - - -',
        'Bb4 - - Ab4 G4 - - -',
        'G4 - - Bb4 Eb5 - - -',
        'C5 - - Bb4 Ab4 - - -',
        'Bb4 - - Db5 F5 - - -',
        'Ab4 - - F4 - - Db5 -',
        'C5 - - - A4 - F4 -',
      ].join(' | '),
      bass: 'ballad',
    },
  },
  form: ['intro', 'a', 'b', 'a2', 'b2'],
  loopFrom: 1,
};
