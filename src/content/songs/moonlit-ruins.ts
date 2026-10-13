import type { SongDef } from '../../domain/music/song.ts';

// Pale bells over moonlit stones: a Dorian theme swaying over a pedal bass, darkened by the flat-two chord the second
// time, then a climax that falls deceptively onto VI and walks down the minor circle of fifths, each bar leaping up to
// a held seventh or ninth while a low voice traces the guide tones, before the theme returns with that voice beneath.
const theme = {
  chords: 'Dm | G/D | Dm | G/D | Bbmaj7 | Am7 | Gm7 | Asus4 A7',
  melody: [
    'A5 - - D6 - - C6 A5',
    'B5 - - - G5 - - -',
    'A5 - - D6 - - E6 F6',
    'E6 - - - D6 - B5 -',
    'F5 - - Bb5 - - A5 F5',
    'G5 - - - E5 - - -',
    'F5 - - Bb5 - - D6 -',
    'D6 - - - C#6 - - -',
  ].join(' | '),
};

export const moonlitRuins: SongDef = {
  id: 'moonlit-ruins',
  title: 'Moonlit Ruins',
  style: 'starlit-dream',
  mood: { valence: -0.6, energy: -0.1 },
  key: 'Dm',
  bpm: 84,
  sections: {
    intro: {
      chords: 'Dm | G/D | Dm | Asus4 A7',
      melody: 'F6 - - - - - E6 D6 | B5 - - - - - . . | A5 - - - - - D6 F6 | E6 - - - C#6 - - -',
      bass: 'whole',
      drums: false,
    },
    a: { ...theme, drums: false },
    a2: {
      chords: 'Dm | G/D | Dm | G/D | Ebmaj7 | Gm7 | Em7b5 | Asus4 A7',
      melody: [
        'A5 - - D6 - - C6 A5',
        'B5 - - - G5 - - -',
        'A5 - - D6 - - E6 F6',
        'E6 - - - D6 - B5 -',
        'Eb6 - - - - - D6 Bb5',
        'G5 - - Bb5 - - D6 -',
        'Bb5 - - - G5 - E5 -',
        'D6 - - - C#6 - A5 -',
      ].join(' | '),
    },
    b: {
      chords: 'Bbmaj7 | Em7b5 | A7b9 | Dm9 | Gm9 | C7 | Fmaj7 | Em7b5 A7b9',
      melody: [
        'D6 - - - A6 - - -',
        'G6 - - - - - Bb5 -',
        'C#6 - - - G6 - - -',
        'F6 - - - E6 - - -',
        'Bb5 - - - F6 - - -',
        'E6 - - - Bb6 - - -',
        'A6 - - - - - . .',
        'G6 - - - Bb6 - A6 -',
      ].join(' | '),
      counter: [
        'A4 - - - - - - -',
        'G4 - - - - - - -',
        'G4 - - - - - - -',
        'F4 - - - - - - -',
        'F4 - - - D4 - - -',
        'E4 - - - - - - -',
        'E4 - - - F4 - A4 -',
        'Bb4 - - - C#5 - - -',
      ].join(' | '),
      harmony: 'arp-updown',
      bass: 'ballad',
      drums: 'brush',
    },
    a3: {
      ...theme,
      counter: [
        'F4 - - - - - - -',
        'D4 - - - - - - -',
        'F4 - - - A4 - - -',
        'B4 - - - - - - -',
        'D5 - - - - - - -',
        'C5 - - - - - - -',
        'D5 - - - - - - -',
        'E5 - - - - - - -',
      ].join(' | '),
    },
  },
  form: ['intro', 'a', 'a2', 'b', 'a3'],
  loopFrom: 1,
  parts: { drums: 'half' },
};
