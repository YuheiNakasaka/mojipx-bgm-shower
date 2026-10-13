import type { SongDef } from '../../domain/music/song.ts';

// A garden drifting in the sky, in a slow three: a tune climbing in pickups over major ninths with no dominant to pull
// it down, a pre-chorus whose bass steps down onto the first V7, then a chorus of long tones tied over each bar line
// on the royal road that climbs the tune's own pickups to a high A over the borrowed minor iv and sinks back to A♭.
// A relative-minor afterglow floats home through the flat-seven chord, and the tune returns with a low swell beneath.
const theme = {
  chords: 'Dbmaj9 | Gbmaj9 | Dbmaj9 | Gbmaj9 | Bbm9 | Ebm9 | Gbmaj7 | Ab9sus4',
  melody: [
    '. Ab4 Db5 Eb5 F5 -',
    'Ab5 - - - - -',
    '. Db5 Eb5 F5 Ab5 -',
    'Bb5 - - - - -',
    '. F5 Ab5 Bb5 C6 -',
    'Db6 - - - Bb5 -',
    'Ab5 - - - F5 -',
    'Eb5 - - - - -',
  ].join(' | '),
};

export const floatingGarden: SongDef = {
  id: 'floating-garden',
  title: 'Floating Garden',
  style: 'starlit-dream',
  mood: { valence: 0.15, energy: -0.75 },
  key: 'Db',
  bpm: 72,
  meter: 3,
  sections: {
    intro: { chords: 'Dbmaj9 | Gbmaj9', melody: 'Ab5 - - - F5 - | Db5 - - - - -' },
    a: theme,
    b: {
      chords: 'Bbm9 | Bbm9/Ab | Gbmaj7 | Ab7sus4 Ab7',
      melody: '. F5 Ab5 Bb5 C6 - | Db6 - - - - - | . Ab5 Bb5 Db6 Eb6 - | Db6 - - - C6 -',
      bass: 'half',
    },
    s: {
      chords: 'Gbmaj7 | Ab/Gb | Fm7 | Bbm9 | Gbmaj7 | Gbm6 | Dbmaj7/F | Ebm9 Ab9sus4',
      melody: [
        'F6 - - - Db6 Eb6',
        '- - - - Ab5 C6',
        '- - - - Ab5 Bb5',
        '- - - - C6 -',
        '. Db6 Eb6 F6 Ab6 -',
        'A6 - - - - -',
        'Ab6 - - - F6 Db6',
        'Bb5 - - - Ab5 -',
      ].join(' | '),
      counter: [
        'Bb4 - - - - -',
        'C5 - - - - -',
        'Ab4 - - - C5 -',
        'Db5 - - - - -',
        'Db5 - - - F5 -',
        'Eb5 - - - Db5 -',
        'F5 - - - - -',
        'Gb5 - - - Eb5 -',
      ].join(' | '),
      harmony: 'arp-updown',
      bass: 'ballad',
    },
    float: {
      chords: 'Bbm9 | Fm7 | Gbmaj7 | Dbmaj7/F | Ebm9 | Fm7 | Gbmaj7 | Cbmaj7 Ab9sus4',
      melody: [
        'Db6 - - - C6 Bb5',
        'Ab5 - - - - -',
        'Bb5 - - - Ab5 Gb5',
        'F5 - - - - -',
        'Gb5 - Bb5 - Db6 -',
        'Eb6 - - - C6 -',
        'Db6 - - - Bb5 -',
        'Bb5 - - - Eb5 -',
      ].join(' | '),
      harmony: 'arp-down',
      bass: 'half',
    },
    a2: {
      ...theme,
      counter: [
        'F4 - - - Eb4 -',
        'Db4 - - - - -',
        'Eb4 - - - C4 -',
        'Bb3 - - - - -',
        'Db4 - - - C4 -',
        'Bb3 - - - Gb3 -',
        'Bb3 - - - Ab3 -',
        'Gb3 - - - - -',
      ].join(' | '),
    },
  },
  form: ['intro', 'a', 'b', 's', 'float', 'a2'],
  loopFrom: 1,
};
