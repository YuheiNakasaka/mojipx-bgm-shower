// Majestic hymn in three: the old horn-led tune, a climb through C minor, a crown chorus that shimmers on the
// borrowed flat-three above the clouds, a descant over the last verse and a minor-iv sigh before it begins again.
import type { SongDef } from '../../domain/music/song.ts';

const hymn = [
  'Bb4 - - Eb5 G5 -',
  'Ab5 - - G5 Eb5 -',
  'F5 - - Ab5 C6 -',
  'Bb5 - - - - -',
  'C6 - - Bb5 G5 -',
  'Ab5 - - - Eb5 -',
  'F5 - - Eb5 D5 -',
];
const hymnChords = 'Eb | Abmaj7 | Fm7 | Bb | Cm7 | Abmaj7';

export const crownOfClouds: SongDef = {
  id: 'crown-of-clouds',
  title: 'Crown of Clouds',
  style: 'grand-field',
  mood: { valence: -0.05, energy: 0.55 },
  key: 'Eb',
  bpm: 108,
  meter: 3,
  sections: {
    intro: {
      chords: 'Ebmaj7 | Abmaj7 | Fm7 | Bb7sus4',
      melody: 'D6 - - - - - | C6 - - - - - | Ab5 - - - - - | F5 - - - Eb5 -',
      bass: 'whole',
      drums: false,
    },
    a: {
      chords: `${hymnChords} | Fm7 Bb | Eb`,
      melody: [...hymn, 'Eb5 - - - - -'].join(' | '),
      drums: 'waltz',
      bass: 'half',
    },
    a2: {
      chords: `${hymnChords} | Fm7 G7 | Cm`,
      melody: [...hymn, 'Eb5 - - - - -'].join(' | '),
      counter: [
        'G4 - - - Bb4 -',
        'C5 - - - - -',
        'Ab4 - - - C5 -',
        'D5 - - - - -',
        'Eb5 - - - - -',
        'C5 - - - - -',
        'Ab4 - - - B4 -',
        'G4 - - - - -',
      ].join(' | '),
    },
    b: {
      chords: 'Cm | Ab | Bb | Eb | Fm7 | Gm7 | Abmaj7 | Bb7sus4 Bb7',
      melody: [
        'C5 - - Eb5 G5 -',
        'C6 - - - Bb5 Ab5',
        'F5 - - Bb5 D6 -',
        'Eb6 - - - D6 Bb5',
        'C6 - - - Ab5 -',
        'Bb5 - - - D6 -',
        'Eb6 - - - - C6',
        'Ab5 - - G5 F5 Bb5',
      ].join(' | '),
      counter: [
        'Eb4 - - - G4 -',
        'Ab4 - - - - -',
        'Bb4 - - - - -',
        'G4 - - - - -',
        'Ab4 - - - - -',
        'G4 - - - Bb4 -',
        'C5 - - - - -',
        'Bb4 - - - Ab4 -',
      ].join(' | '),
      harmony: 'arp-updown',
    },
    c: {
      chords: 'Abmaj7 | Bb/Ab | Gm7 | Cm7 | Fm7 | Gb | Ab Bb | Eb',
      melody: [
        'Eb6 - - - - C6',
        'D6 - - - - Bb5',
        'Bb5 - - C6 D6 -',
        'Eb6 - - - - -',
        'C6 - - Eb6 F6 -',
        'F6 - - - Db6 -',
        'Eb6 - - - D6 -',
        'Eb6 - - - Bb5 G5',
      ].join(' | '),
      counter: [
        'C5 - - - Ab4 -',
        'F5 - - - D5 -',
        'D5 - - - Bb4 -',
        'G4 - - - Bb4 -',
        'Ab4 - - - C5 -',
        'Bb4 - - - Db5 -',
        'C5 - - - F5 -',
        'G4 - - - Bb4 -',
      ].join(' | '),
      harmony: 'sparkle',
      bass: 'gallop',
    },
    a3: {
      chords: `${hymnChords} | Fm7 Bb | Eb`,
      melody: [...hymn, 'Eb5 - - - - -'].join(' | '),
      counter: [
        'G5 - - - Bb5 -',
        'C6 - - - - -',
        'C6 - - - Eb6 -',
        'D6 - - - - -',
        'Eb6 - - - - -',
        'C6 - - - - -',
        'Ab5 - - - F5 -',
        'G5 - - - - -',
      ].join(' | '),
    },
    tag: {
      chords: 'Abmaj7 | Abm6 | Eb/Bb | Bb7sus4 Bb7',
      melody: 'C6 - - - - - | B5 - - - - - | Bb5 - - - G5 - | F5 - - - D5 -',
      counter: 'Eb5 - - - - - | Eb5 - - - - - | Eb5 - - - - - | Ab4 - - - - -',
      drums: 'waltz',
      bass: 'whole',
    },
  },
  form: ['intro', 'a', 'a2', 'b', 'c', 'a3', 'tag'],
  loopFrom: 1,
};
