// Prowling a neon back alley: a low riff that leans on the Phrygian flat second, a pre-chorus climbing a staircase of
// arpeggios, a minor chorus on the urgent vi–IV–V–I whose long notes land early, and a last chorus a semitone up.
import { type SongDef, transposed } from '../../domain/music/song.ts';

const RIFF_CHORDS = 'Em9 | Fmaj7 | Em9 | B7sus4 B7';
const riff = ['. E4 G4 A4 B4 - D5 B4', 'C5 - - A4 - - F4 -', '. E4 G4 A4 B4 - D5 E5', 'F#5 - - E5 D#5 - B4 -'];

const chorus = {
  chords: 'Em9 | Cmaj7 | D | Gmaj7 | Cmaj7 | Bm7 | Am9 D | B7sus4 B7',
  melody: [
    'E6 - - - - - D6 G6',
    '- - - - - - E6 D6',
    '- - - - A5 - D6 F#6',
    '- - - - D6 - B5 -',
    'E6 - - - - - D6 F#6',
    '- - - - - - E6 G6',
    '- - - - F#6 - - -',
    'E6 - - - D#6 - B5 -',
  ].join(' | '),
  counter: [
    'G5 - - - - - B5 -',
    'E5 - - - G5 - - -',
    'F#5 - - - D5 - - -',
    'B4 - - - D5 - - -',
    'G5 - - - E5 - - -',
    'D5 - - - A5 - - -',
    'E5 - - - D5 - - -',
    'B4 - - - A4 - - -',
  ].join(' | '),
  lead: 'alt' as const,
};

export const neonAlley: SongDef = {
  id: 'neon-alley',
  title: 'Neon Alley',
  style: 'city-groove',
  mood: { valence: -0.5, energy: 0.2 },
  key: 'Em',
  bpm: 114,
  sections: {
    intro: { chords: RIFF_CHORDS, melody: riff.join(' | '), harmony: false, pad: false },
    a: {
      chords: 'Em9 | Fmaj7 | Em9 | Fmaj7 | Am9 | Bm7 | Cmaj7 | B7sus4 B7',
      melody: [
        riff[0],
        'C5 - - A4 - - . .',
        riff[2],
        'F5 - - E5 - - C5 -',
        '. A4 C5 D5 E5 - G5 E5',
        'D5 - - B4 - - . .',
        '. C5 E5 G5 B5 - - A5',
        riff[3],
      ].join(' | '),
      pad: false,
      harmony: 'stab',
    },
    b: {
      chords: 'Am9 | Bm7 | Cmaj7 | D | Am9 | Bm7 | Cmaj7 C#m7b5 | B7sus4 B7',
      melody: [
        'C5 - E5 - G5 - - -',
        'D5 - F#5 - A5 - - -',
        'E5 - G5 - B5 - - -',
        'F#5 - A5 - D6 - - -',
        'E5 - A5 - C6 - B5 -',
        'F#5 - B5 - D6 - C#6 -',
        'G5 - C6 - E6 - - -',
        'E6 - - - D#6 - - -',
      ].join(' | '),
      drums: 'half',
    },
    s: chorus,
    brk: {
      chords: RIFF_CHORDS,
      melody: '. E5 G5 A5 B5 - D6 B5 | C6 - - A5 - - F5 - | . E5 G5 A5 B5 - D6 E6 | F#6 - - E6 D#6 - B5 -',
      harmony: false,
      pad: false,
      drums: 'break',
    },
    lift: { chords: 'C7sus4 C7', melody: 'F6 - - - E6 - C6 -', key: 'Fm', lead: 'alt' },
    up: transposed(chorus, 1, 'Fm'),
    outro: { chords: 'Cmaj7 | B7sus4 B7', melody: 'C6 - - - G5 - E5 - | F#5 - - - D#5 - B4 -' },
  },
  form: ['intro', 'a', 'b', 's', 'brk', 'lift', 'up', 'outro'],
  loopFrom: 1,
};
