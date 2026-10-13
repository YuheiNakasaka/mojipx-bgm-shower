// A minor ballad in the old kayo manner, for a letter never posted: the verse sinks down a chromatic bass (C–B–B♭–A–A♭),
// the pre-chorus turns the tonic into a dominant that pulls to the minor iv, and the chorus hook falls in a lilting
// long–short–long figure and then leaps a sixth to a held note, through the royal road and a minor ii–V with a flat
// nine. The last chorus reaches higher and lingers on the Neapolitan before it lets go.
import type { SongDef } from '../../domain/music/song.ts';

const intro = {
  chords: 'Abmaj7 | Gsus4 G | Fm7 Fm7/Eb | Dm7b5 G7b9',
  melody: 'Eb5 - G5 - Bb5 - | C6 - - - B5 - | Ab5 - G5 - F5 - | D5 - - - B4 -',
  lead: 'alt' as const,
};

const pre = {
  chords: 'Fm7 | Gm7 C7b9 | Fm9 | G7sus4 G7b9',
  melody: 'C5 - Eb5 F5 - Ab5 | G5 - - E5 - - | F5 - G5 Ab5 - C6 | - - - - B5 -',
  counter: 'Ab4 - - - - - | . . . Bb4 C5 Db5 | C5 - - - - - | F5 - - - D5 -',
  bass: 'half' as const,
  drums: 'light' as const,
};

// The hook: long–short–long falling, then a leap of a sixth to a note held for the whole bar.
const hook = ['C6 - - Bb5 Ab5 -', 'F6 - - - - -', 'D6 - - C6 Bb5 -', 'Eb6 - - - E6 -', 'F6 - - Eb6 C6 -'];
const answers = ['Ab4 - - - - -', '. . Bb4 C5 D5 F5', 'D5 - - - - -', '. . G4 Bb4 C5 E5', 'F5 - - - - -'];
const hookChords = 'Abmaj7 | Bb7 | Gm7 | Cm7 C7 | Fm7';

export const unsentLetter: SongDef = {
  id: 'unsent-letter',
  title: 'Unsent Letter',
  style: 'showa-ballad',
  mood: { valence: -0.65, energy: -0.5 },
  key: 'Cm',
  bpm: 80,
  meter: 3,
  sections: {
    intro: { ...intro, bass: 'whole', drums: false },
    a: {
      chords: 'Cm | CmM7/B | Cm7/Bb | Cm6/A | Fm7/Ab | Bb7 | Ebmaj7 | Dm7b5 G7b9',
      melody: [
        '. G4 C5 - D5 Eb5',
        'D5 - - C5 - -',
        '. C5 Eb5 - F5 G5',
        'F5 - - D5 - B4',
        '. Ab4 C5 - Eb5 F5',
        'D5 - - Bb4 - Ab4',
        '. G4 Bb4 - D5 Eb5',
        'C5 - - - B4 -',
      ].join(' | '),
      counter: [
        'C5 - - - - -',
        '. . . Eb5 D5 C5',
        'G4 - - - - -',
        '. . . B4 C5 D5',
        'Eb4 - - - - -',
        '. . . F4 G4 Ab4',
        'G4 - - - - -',
        '. . . D5 Eb5 F5',
      ].join(' | '),
      bass: 'whole',
      pad: false,
      drums: false,
    },
    b: pre,
    s: {
      chords: `${hookChords} | Bb7 | Ebmaj7 Abmaj7 | Dm7b5 G7b9`,
      melody: [...hook, 'G6 - - - - -', 'F6 - - - Eb6 C6', 'D6 - - - B5 -'].join(' | '),
      counter: [...answers, '. . D5 F5 Ab5 -', 'G5 - - - Eb5 -', '. . Ab5 - G5 F5'].join(' | '),
      lead: 'alt',
      drums: 'half',
    },
    inter: { ...intro, drums: 'light' },
    s2: {
      chords: `${hookChords} | Bb7 | Ebmaj7 Abmaj7 | Dbmaj7 | G7sus4 G7b9 | Cm9`,
      melody: [...hook, 'Ab6 - - - - -', 'G6 - - - F6 Eb6', 'F6 - - - - -', 'G6 - - - F6 -', 'Eb6 - - - - -'].join(' | '),
      counter: [...answers, '. . D5 F5 Bb5 -', 'Bb5 - - - C6 -', 'Ab5 - - - F5 -', 'D5 - - - B4 D5', 'C5 - - - - -'].join(' | '),
      lead: 'alt',
      drums: 'half',
    },
    outro: {
      chords: 'Abmaj7 | G7sus4 G7b9',
      melody: 'C6 - - Bb5 G5 Eb5 | D5 - - C5 B4 -',
      counter: 'Ab4 - - - - - | G4 - - - - -',
      drums: false,
    },
  },
  form: ['intro', 'a', 'b', 's', 'inter', 'b', 's2', 'outro'],
  loopFrom: 1,
};
