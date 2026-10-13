import { type SongDef, transposed } from '../../domain/music/song.ts';

// A café window seat on a slow Sunday, in Shibuya-style bossa: a riff of falling seventh leaps, a talky verse,
// a chorus that leaps up a seventh, a sixth and an octave and aches on the borrowed minor iv, then lifts a semitone.
const riff = {
  chords: 'Cmaj7 | Bm7 E7b9 | Am9 | D9sus4 D7',
  melody: 'C5 - B5 - - G5 E5 - | B4 - A5 - - G#5 E5 - | A4 - G5 - - E5 C5 - | D5 - C6 - - A5 F#5 -',
};

const chorus = {
  chords: 'Cmaj9 | D/C | Bm7 | E7b9 | Am9 | Cm6 | Bm7 Bbdim7 | Am9 D7sus4',
  melody: [
    'E5 - - D6 - - - B5',
    '- - - A5 - - F#5 -',
    'D5 - - B5 - - - G#5',
    '- - - F5 - - D5 -',
    'E5 - - E6 - - - D6',
    '- - - Eb6 - - C6 -',
    'D6 - - B5 Bb5 - - G5',
    '- - - A5 - - - .',
  ].join(' | '),
  counter: [
    'G4 - - - B4 - - -',
    'C5 - - - D5 - - -',
    'B4 - - - D5 - - -',
    'D5 - - - B4 - G#4 -',
    'C5 - - - E5 - - -',
    'G4 - - - A4 - - -',
    'F#4 - - - E4 - - -',
    'G4 - - - C5 - - -',
  ].join(' | '),
  lead: 'alt' as const,
};

export const windowTable: SongDef = {
  id: 'window-table',
  title: 'Window Table',
  style: 'bossa-cafe',
  mood: { valence: 0.6, energy: -0.5 },
  key: 'G',
  bpm: 96,
  sections: {
    intro: { ...riff, drums: false },
    a: {
      chords: 'Gmaj9 | Em9 | Am9 | D13 | Gmaj9 | Bm7 E7b9 | Am9 | B7sus4 B7',
      melody: [
        '. D5 - B4 - A4 B4 F#5',
        '- - E5 - D5 - B4 -',
        '. C5 - A4 - G4 A4 E5',
        '- - D5 - C5 - A4 -',
        '. D5 - B4 - A4 B4 A5',
        '- - F#5 - G#5 - E5 D5',
        'C5 - - - B4 - A4 -',
        'E5 - - - D#5 - - .',
      ].join(' | '),
      bass: 'half',
    },
    b: {
      chords: 'Em9 | A13 | Am9 | D9sus4 D7',
      melody: '. E5 - F#5 - G5 B5 - | . F#5 - G5 - A5 C#6 - | . G5 - A5 - B5 D6 - | C6 - - B5 - - A5 -',
      harmony: 'syncopate',
    },
    s: chorus,
    lift: { chords: 'Eb7sus4 Eb7', melody: 'Ab5 - - - G5 - Eb5 -', key: 'Ab', lead: 'alt' },
    up: transposed(chorus, 1, 'Ab'),
    tag: riff,
  },
  form: ['intro', 'a', 'b', 's', 'lift', 'up', 'tag'],
  loopFrom: 1,
};
