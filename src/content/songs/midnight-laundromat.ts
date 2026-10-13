// Two in the morning under a fluorescent hum, in city-pop lo-fi: a spinning-drum figure, a verse whose every phrase
// leans in an eighth late round I–vi–ii–V, a royal-road chorus whose little runs land early on held ninths and
// sevenths and reach higher each time, and a bridge stepping down from IV that sours on the minor iv.
import type { SongDef } from '../../domain/music/song.ts';

const spin = {
  chords: 'Gbmaj9 | Ab13',
  melody: 'F5 Ab5 Bb5 Ab5 F5 Db5 Eb5 F5 | - - - - . . . .',
  drums: false as const,
  harmony: 'arp-up' as const,
  bass: 'whole' as const,
};

export const midnightLaundromat: SongDef = {
  id: 'midnight-laundromat',
  title: 'Midnight Laundromat',
  style: 'lofi-loop',
  mood: { valence: 0.05, energy: -0.7 },
  key: 'Db',
  bpm: 76,
  sections: {
    spin,
    a: {
      chords: 'Dbmaj9 | Bbm9 | Ebm9 | Ab13 | Fm7 | Bb7b9 | Ebm9 | Ab9sus4 Ab9',
      melody: [
        '. Ab4 - C5 - - Eb5 -',
        '- - Db5 - C5 - . .',
        '. Bb4 - Db5 - - F5 -',
        '- - Eb5 - Bb4 - . .',
        '. C5 - Eb5 - - Ab5 -',
        '- - F5 - D5 - . .',
        '. Gb5 - F5 - - Db5 -',
        '- - Eb5 - C5 - . .',
      ].join(' | '),
      drums: 'half',
      bass: 'whole',
    },
    s: {
      chords: 'Gbmaj9 | Ab13 | Fm7 | Bbm9 | Gbmaj9 | Ab13 | Fm7 Bb7b9 | Ebm9 Ab9sus4',
      melody: [
        'Ab5 - - - - Bb5 Db6 F6',
        '- - - - Eb6 - . .',
        'Ab5 - - - - Bb5 C6 Eb6',
        '- - - - Db6 - . .',
        'Bb5 - - - - Db6 Eb6 Gb6',
        '- - - - F6 - Eb6 -',
        'Eb6 - - - D6 - - -',
        'Db6 - - - - - . .',
      ].join(' | '),
      counter: [
        'Bb4 - - - - - - -',
        'C5 - - - . Eb5 F5 Ab5',
        'C5 - - - - - - -',
        'Db5 - - - . F5 Ab5 C6',
        'F5 - - - - - - -',
        'Eb5 - - - C5 - - -',
        'C5 - - - Ab4 - - -',
        'Gb4 - - - Gb4 - Eb4 F4',
      ].join(' | '),
      bass: 'groove',
      harmony: 'arp-up',
    },
    b: {
      chords: 'Gbmaj9 | Fm7 | Ebm9 | Dbmaj9 | Gbmaj9 | Gbm6 | Fm7 Bb7b9 | Ebm9 Ab13',
      melody: [
        '. Bb5 - - - - Ab5 -',
        '- - . F5 - - Eb5 -',
        '- - . Gb5 - - F5 -',
        '- - . Ab5 - - F5 -',
        '. Db6 - - - - Bb5 -',
        'A5 - - - - - Gb5 -',
        'Ab5 - - - F5 - D5 -',
        'Eb5 - - Gb5 F5 - - .',
      ].join(' | '),
      bass: 'walk',
      harmony: 'charleston',
    },
  },
  form: ['spin', 'a', 's', 'b', 's', 'spin'],
  loopFrom: 1,
};
