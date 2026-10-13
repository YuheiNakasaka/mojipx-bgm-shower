import type { SongDef } from '../../domain/music/song.ts';

// A slow minor waltz on a winter platform: a held D hangs over a bass that slips down by semitones, the tune sighs
// down with a falling bass through a flat-nine dominant, warms for eight bars in the relative major up to a high G,
// then settles cold again with the counter falling against it.
const platform = ['D6 - - - C6 Bb5', 'A5 - - - . F5', 'G5 - - - Bb5 D6', 'C6 - - - A5 F#5'];

const snow = {
  chords: 'Gm | Gm/F# | Gm/F | Em7b5 D7',
  melody: 'D6 - - - - - | D6 - - - - - | D6 - - - C6 Bb5 | Bb5 - - - A5 -',
  harmony: 'arp-updown' as const,
  bass: 'whole' as const,
  drums: false as const,
};

const home = {
  chords: 'Gm | Gm/F | Ebmaj7 | D7b9 | Cm7 | Gm/Bb | Am7b5 D7 | Gm',
  melody: [...platform, 'G5 - - - C6 D6', 'Bb5 - - - G5 D6', 'Eb6 - C6 - A5 F#5', 'G5 - - - - -'].join(' | '),
};

export const winterPlatform: SongDef = {
  id: 'winter-platform',
  title: 'Winter Platform',
  style: 'town-waltz',
  mood: { valence: -0.55, energy: -0.6 },
  key: 'Gm',
  bpm: 96,
  meter: 3,
  sections: {
    intro: snow,
    a: { ...home, harmony: 'broken', bass: 'whole', drums: false },
    a2: {
      chords: 'Gm | Gm/F | Ebmaj7 | D7b9 | Cm7 | Cm7/Bb | Am7b5 | D7sus4 D7',
      melody: [...platform, 'G5 - - - C6 D6', 'Eb6 - - - D6 C6', 'C6 - - - A5 Eb5', 'G5 - - - F#5 -'].join(' | '),
      drums: 'brush',
    },
    b: {
      chords: 'Ebmaj7 | F7 | Dm7 | Gm7 | Cm7 | F7 | Bbmaj7 Ebmaj7 | Am7b5 D7',
      melody: [
        'G5 - Bb5 - D6 -',
        'C6 - - - A5 Bb5',
        'F5 - A5 - C6 -',
        'D6 - - - - -',
        'Eb6 - - - D6 C6',
        'A5 - - - C6 F6',
        'F6 - - - G6 -',
        'Eb6 - - - D6 -',
      ].join(' | '),
      counter: [
        'Bb4 - - - - -',
        'Eb5 - - - - -',
        'D5 - - - - -',
        'Bb4 - D5 - F5 -',
        'G4 - - - - -',
        'A4 - - - - -',
        'D5 - - - Bb4 -',
        'C5 - - - - -',
      ].join(' | '),
      harmony: 'arp-updown',
      bass: 'ballad',
    },
    a3: {
      ...home,
      counter: [
        'Bb4 - - - - -',
        'A4 - - - - -',
        'G4 - - - - -',
        'Eb5 - - - - -',
        'Eb5 - - - - -',
        'D5 - - - - -',
        'C5 - - - - -',
        'Bb4 - - - - -',
      ].join(' | '),
      drums: 'brush',
    },
    tag: {
      chords: 'Ebmaj7 | Cm7 | Am7b5 | D7sus4 D7',
      melody: 'G5 - - - - - | Eb5 - - - - - | C5 - - - Eb5 - | D5 - - - . .',
      harmony: 'arp-updown',
      bass: 'whole',
      drums: false,
    },
  },
  form: ['intro', 'a', 'a2', 'b', 'intro', 'a3', 'tag'],
  loopFrom: 1,
};
