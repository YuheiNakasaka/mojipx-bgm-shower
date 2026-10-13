import type { SongDef } from '../../domain/music/song.ts';

// The overture of an imaginary journey: a fanfare, the six-note dawn motif (1–2–5, 4–3–2) told plainly, then
// grandly an octave up, darkened once by the minor iv and crowned by the borrowed flat-six, flat-seven, one.
const theme = ['Bb4 - - C5 F5 - - -', 'Eb5 - D5 - C5 - - -', 'D5 - - Eb5 Bb5 - - -', 'G5 - - F5 C5 - . .'];

export const overtureOfDawn: SongDef = {
  id: 'overture-of-dawn',
  title: 'Overture of Dawn',
  style: 'grand-field',
  mood: { valence: 0.15, energy: 0.55 },
  key: 'Bb',
  bpm: 104,
  sections: {
    intro: {
      chords: 'Bb | Eb F | Gb Ab | Bb',
      melody: 'Bb4 . Bb4 Bb4 F5 - - D5 | Eb5 . Eb5 G5 F5 - - C5 | Db5 . Db5 Db5 Eb5 . Eb5 F5 | - - - - - - . .',
      harmony: 'pad',
      bass: 'whole',
    },
    a: {
      chords: 'Bb | Cm7 F | Gm7 | Ebmaj7 F | Bb/D | Gm7 | Ebmaj7 Ebm6 | Bb/F F7',
      melody: [...theme, 'D5 - - Eb5 F5 - - -', 'Bb5 - A5 - G5 - - -', 'G5 - - F5 Gb5 - - -', 'F5 - - - D5 - C5 -'].join(' | '),
      drums: 'light',
      bass: 'half',
    },
    a2: {
      chords: 'Bb | Cm7 F | Gm7 | Ebmaj7 F | Bb/D | Gm7 C7 | Cm7 F7 | Bb',
      melody: [...theme, 'D5 - - Eb5 F5 - - -', 'Bb5 - A5 - G5 - - -', 'G5 - F5 - Eb5 - C5 -', 'D5 - - - - - . .'].join(' | '),
      counter: [
        '. . . . Bb4 - A4 G4',
        'G4 - - - A4 - - -',
        'Bb4 - - - D5 - C5 Bb4',
        'Eb5 - - - A4 - - -',
        'F4 - - - Bb4 - - -',
        'D5 - - - E5 - - -',
        'Eb5 - - - A4 - - -',
        'Bb4 - - - . . . .',
      ].join(' | '),
    },
    b: {
      chords: 'Ebmaj7 | F/Eb | Dm7 | Gm7 | Cm7 | D7/F# | Gm7 | F7sus4 F7',
      melody: [
        '. Bb4 Eb5 F5 G5 - - -',
        '. C5 F5 G5 A5 - - -',
        '. F5 A5 Bb5 C6 - - -',
        'Bb5 - A5 - G5 - D5 -',
        '. Eb5 G5 Bb5 C6 - - -',
        'D6 - - C6 A5 - F#5 -',
        'G5 - - A5 Bb5 - D6 -',
        'Eb6 - - - C6 - A5 -',
      ].join(' | '),
      harmony: 'arp-updown',
      drums: 'half',
      bass: 'half',
    },
    s: {
      chords: 'Bb | Cm7 F | Dm7 Gm7 | Cm7 F7 | Gb | Ab | Bb | F7sus4 F7',
      melody: [
        'Bb5 - - C6 F6 - - -',
        'Eb6 - D6 - C6 - - -',
        'A5 - - Bb5 D6 - - -',
        'C6 - Bb5 - A5 - - -',
        'Db6 - - Eb6 F6 - - -',
        'Eb6 - C6 - Eb6 - - F6',
        '- - - - D6 - Bb5 -',
        'C6 - - Bb5 A5 - F5 -',
      ].join(' | '),
      counter: [
        'D5 - - - - - Eb5 D5',
        'C5 - - - A4 - - -',
        'F4 - - - Bb4 - - -',
        'Eb5 - - - C5 - Eb5 -',
        'Gb4 - Bb4 - Db5 - Bb4 -',
        'C5 - - - Ab4 - - -',
        'D5 - - - F5 - - -',
        'Eb5 - - - C5 - - -',
      ].join(' | '),
      harmony: 'arp16',
      bass: 'gallop',
    },
  },
  form: ['intro', 'a', 'a2', 'b', 's'],
  loopFrom: 1,
};
