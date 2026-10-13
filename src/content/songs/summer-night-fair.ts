// Warm night at the fair: a lilting pentatonic verse with plucked guide tones, a low chorus, a bridge that turns
// wistful through a secondary dominant and the borrowed minor iv, then the chorus again an octave higher.
import { type SongDef, transposed } from '../../domain/music/song.ts';

const chorus = {
  chords: 'Bbmaj7 | C | Am7 | Dm7 | Bbmaj7 | C | Gm7 | C7sus4 C7',
  melody: [
    'D6 - - C6 D6 - F6 -',
    'C6 - - - A5 - G5 -',
    'A5 - - G5 A5 - C6 -',
    'D6 - - - - - . .',
    'D6 - - F6 G6 - F6 D6',
    'G6 - - - - - F6 D6',
    'D6 - - C6 A5 - G5 -',
    'F5 - G5 - C5 - - -',
  ].join(' | '),
  counter: [
    'D5 - - - F5 - - -',
    'E5 - - - C5 - - -',
    'C5 - - - E5 - - -',
    'F5 - - - . A5 G5 F5',
    'D5 - - - F5 - - -',
    'E5 - - - G5 - - -',
    'Bb4 - - - D5 - - -',
    'Bb4 - - - G4 - - -',
  ].join(' | '),
};

const verse = {
  chords: 'Fmaj7 | Dm7 | Bbmaj7 | C7sus4 C7 | Fmaj7 | Am7 | Bbmaj7 Csus4 | F6',
  melody: [
    'F4 - - G4 A4 - C5 -',
    'D5 - C5 A4 G4 - F4 -',
    'D4 - - F4 G4 - F4 D4',
    'F4 - - - G4 - - -',
    'F4 - - G4 A4 - C5 -',
    'C5 - D5 C5 A4 - G4 -',
    'D4 - F4 - G4 - - -',
    'F4 - - - - - . .',
  ].join(' | '),
  counter: [
    'A5 - - - C6 - - -',
    'A5 - - - F5 - - -',
    'F5 - - - D5 - - -',
    'F5 - - - E5 - - -',
    'F5 - - - A5 - - -',
    'G5 - - - E5 - - -',
    'F5 - - - G5 - - -',
    'A5 - - - . . C6 D6',
  ].join(' | '),
};

export const summerNightFair: SongDef = {
  id: 'summer-night-fair',
  title: 'Summer Night Fair',
  style: 'summer-festival',
  mood: { valence: 0.6, energy: 0 },
  key: 'F',
  bpm: 118,
  sections: {
    intro: {
      chords: 'Bb | C7sus4',
      melody: '. . D5 F5 G5 - F5 D5 | C5 - - - . . A4 C5',
      drums: false,
    },
    a: { ...verse, bass: 'half', drums: 'light' },
    s: {
      ...transposed(chorus, -12, 'F'),
      counter: transposed(chorus, 12, 'F').counter,
    },
    a2: {
      ...verse,
      melody: [
        'F4 - - G4 A4 - C5 -',
        'D5 - C5 A4 G4 - F4 -',
        'D4 - - F4 G4 - F4 D4',
        'F4 - - - G4 - - -',
        'F4 - - G4 A4 - C5 -',
        'E5 - D5 C5 A4 - C5 -',
        'D5 - F5 - G5 - - -',
        'A5 - - - - - . .',
      ].join(' | '),
      counter: [
        'A5 - - - C6 - - -',
        'A5 - - - F5 - - -',
        'F5 - - - D5 - - -',
        'F5 - - - E5 - - -',
        'F5 - - - A5 - - -',
        'G5 - - - E5 - - -',
        'Bb5 - - - C6 - - -',
        'C6 - - - - - . .',
      ].join(' | '),
      harmony: 'skank',
    },
    bridge: {
      chords: 'Dm7 | Am7 | Bbmaj7 | A7 | Dm7 Dm7/C | Bbmaj7 | Bbm6 | C7sus4 C7',
      melody: [
        'F5 - - - E5 - D5 -',
        'E5 - - - - - C5 -',
        'D5 - - - F5 - A5 -',
        'G5 - - - - - E5 C#5',
        'D5 - - - F5 - A5 -',
        'Bb5 - - - A5 - F5 -',
        'Db6 - - - - - Bb5 -',
        'C6 - - - Bb5 - - -',
      ].join(' | '),
      counter: [
        'A5 - - - - - - -',
        '. . . . A5 G5 E5 -',
        'F5 - - - - - - -',
        '. . . . A5 - G5 -',
        'A5 - - - C6 - - -',
        'D6 - - - - - - -',
        'F5 - - - - - - -',
        'F5 - - - E5 - - -',
      ].join(' | '),
      harmony: 'arp-updown',
      bass: 'half',
      drums: 'half',
    },
    s2: chorus,
  },
  form: ['intro', 'a', 's', 'a2', 'bridge', 's2'],
  loopFrom: 1,
};
