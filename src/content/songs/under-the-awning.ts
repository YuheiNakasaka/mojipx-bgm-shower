import type { SongDef } from '../../domain/music/song.ts';

// Rain on a café awning, in minor bossa: drips between the beats, a verse that sighs down the D–C–B–B♭ cliché,
// a pre-chorus that climbs alone without drums, and a chorus that rises in a 3+3+2 arpeggio onto held colour tones
// an octave above the verse, where the Dorian IV (B natural) opens a moment of hope that sours back to the minor iv
// before the chorus peaks on the ninth of the relative major.
const drops = {
  chords: 'Dm9 | Gm9 | Em7b5 | A7b9',
  melody: '. A5 . E5 . F5 - D5 | - - . Bb5 . A5 - F5 | . G5 . D5 . E5 - Bb4 | - - - - C#5 - - .',
};

const chorus = {
  chords: 'Bbmaj7 | A7b9 | Dm9 | G13 | Gm9 | C9 | Fmaj9 | Em7b5 A7b9',
  melody: [
    'A5 - - D6 - - F6 -',
    'E6 - - - C#6 - - .',
    'A5 - - C6 - - E6 -',
    'D6 - - - B5 - - .',
    'Bb5 - - D6 - - F6 -',
    'E6 - - - D6 - Bb5 -',
    'G6 - - - - - E6 -',
    'D6 - - Bb5 C#6 - - .',
  ].join(' | '),
  counter: [
    'A4 - - - - - - -',
    'G4 - - - - - - -',
    'F4 - - - A4 - - -',
    'B4 - - - - - - -',
    'Bb4 - - - - - - -',
    'Bb4 - - - G4 - - -',
    'A4 - - - C5 - - -',
    'G4 - - - C#5 - - -',
  ].join(' | '),
  lead: 'alt' as const,
};

export const underTheAwning: SongDef = {
  id: 'under-the-awning',
  title: 'Under the Awning',
  style: 'bossa-cafe',
  mood: { valence: 0, energy: -0.6 },
  key: 'Dm',
  bpm: 88,
  sections: {
    intro: { ...drops, drums: false },
    a: {
      chords: 'Dm9 | Dm9/C | Bm7b5 | Bbmaj7 | Gm9 | A7b9 | Dm9 | Em7b5 A7b9',
      melody: [
        '. . F5 E5 - - D5 -',
        '. . E5 D5 - - C5 -',
        '. . F5 D5 - - B4 -',
        '. . D5 C5 - - A4 -',
        '. . Bb4 D5 - - F5 -',
        'E5 - - C#5 - - Bb4 -',
        '. . A4 D5 - - E5 F5',
        'G5 - - . E5 - C#5 -',
      ].join(' | '),
      bass: 'half',
    },
    // The band drops out under the climbing pre-chorus so the chorus can open up.
    b: {
      chords: 'Gm9 | C9 | Fmaj9 | A7sus4 A7',
      melody: '. D5 F5 A5 - - G5 F5 | . E5 G5 Bb5 - - A5 G5 | . F5 A5 C6 - - Bb5 A5 | D6 - - - C#6 - - .',
      harmony: 'arp-up',
      drums: false,
    },
    s: chorus,
    drops,
    s2: {
      ...chorus,
      counter: [
        'F4 - - - D5 - - -',
        'E5 - - - . A4 C#5 E5',
        'D5 - - - A4 - - -',
        'B4 - - - - - D5 E5',
        'F5 - - - D5 - - -',
        'E5 - - - . G4 Bb4 D5',
        'C5 - - - - - E5 -',
        'D5 - - - C#5 - - -',
      ].join(' | '),
    },
  },
  form: ['intro', 'a', 'b', 's', 'drops', 's2'],
  loopFrom: 1,
};
