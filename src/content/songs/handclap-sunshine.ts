import type { SongDef } from '../../domain/music/song.ts';

// A happy major-key disco: the hook is a repeated note that jumps an octave and tumbles down, sung over a vi–IV–V–I
// chorus with a III7 pulling back to vi, the verse climbs a step every two bars, the pre-chorus pushes in 3+3+2 with
// brass hits, and a dance break leaves only the handclaps, the bass and the guitar cutting before the last chorus.
const chorus = {
  chords: 'Gm7 | Ebmaj7 | F7sus4 F7 | Bbmaj7 D7 | Gm7 | Ebmaj7 | Cm7 F7 | Bb6',
  melody: [
    'F5 F5 F6 - D6 - C6 Bb5',
    '- - - - G5 - . .',
    'F5 F5 F6 - Eb6 - C6 A5',
    '- - - Bb5 A5 - F#5 -',
    'G5 Bb5 D6 - F6 - G6 -',
    '- - - F6 - Eb6 - D6',
    '- - - Eb6 - - C6 -',
    'D6 - - - - - . .',
  ].join(' | '),
  counter: [
    'D5 - - - - - - -',
    'Eb5 - - - . Bb5 C6 D6',
    'C6 - - - A5 - - -',
    'F5 - - - . F#5 A5 C6',
    'Bb5 - - - - - - -',
    'Bb5 - - - G5 - - -',
    'G5 - - - A5 - - -',
    'F5 - - - . . . .',
  ].join(' | '),
  lead: 'alt' as const,
};

const rest = Array.from({ length: 8 }, () => '. . . . . . . .').join(' | ');

export const handclapSunshine: SongDef = {
  id: 'handclap-sunshine',
  title: 'Handclap Sunshine',
  style: 'idol-disco',
  mood: { valence: 0.6, energy: 0.65 },
  key: 'Bb',
  bpm: 124,
  sections: {
    intro: {
      chords: 'Ebmaj7 | F/Eb | Dm7 Gm7 | Cm7 F7',
      melody: 'F5 F5 F6 - D6 - C6 A5 | - - - - C6 - . . | F5 F5 F6 - D6 - Bb5 - | C6 - - - A5 - - -',
      harmony: 'stab',
      bass: 'octave',
      drums: 'four',
    },
    a: {
      chords: 'Bbmaj7 | Gm7 | Cm7 | F7 | Dm7 | Gm7 | Cm7 | F7sus4 F7',
      melody: [
        '. D5 D5 F5 . D5 C5 Bb4',
        'C5 - D5 - . . . .',
        '. Eb5 Eb5 G5 . Eb5 D5 C5',
        'D5 - Eb5 - . . . .',
        '. F5 F5 A5 . G5 F5 D5',
        'F5 - G5 - . . . .',
        '. G5 G5 Bb5 . G5 F5 Eb5',
        'F5 - - - Eb5 - . .',
      ].join(' | '),
      pad: false,
    },
    b: {
      chords: 'Ebmaj7 | F/Eb | Dm7 | Gm7 | Cm7 | Dm7 | Ebmaj7 | F7sus4 F7',
      melody: [
        'G5 - - Bb5 - - G5 -',
        'A5 - - C6 - - A5 -',
        'F5 - - A5 - - D6 -',
        'D6 - - - C6 - . .',
        'Eb6 - - C6 - - G5 -',
        'F6 - - D6 - - A5 -',
        'F6 - - Eb6 - - Bb5 -',
        'C6 - - - - - . .',
      ].join(' | '),
      harmony: 'stab',
    },
    s: chorus,
    brk: {
      chords: 'Gm7 | C9 | Gm7 | C9 | Ebmaj7 | Dm7 | Cm7 | F7sus4 F7',
      melody: rest,
      bass: 'funk',
      pad: false,
    },
    outro: {
      chords: 'Ebmaj7 | F7sus4 F7',
      melody: 'G5 - - - Bb5 - - - | C6 - - - A5 - . .',
      drums: 'four',
    },
  },
  form: ['intro', 'a', 'b', 's', 'brk', 's', 'outro'],
  loopFrom: 1,
};
