import { compile } from 'mojipx';
import { describe, expect, it } from 'vitest';
import { arrange } from './arrange.ts';
import type { SongDef } from './song.ts';

const base: SongDef = {
  id: 'fixture',
  title: 'Fixture',
  style: 'pixel-quest',
  mood: { valence: 0, energy: 0 },
  key: 'C',
  bpm: 120,
  sections: {
    intro: { chords: 'C | G', melody: 'C5 - - - - - - - | D5 - - - - - - -', drums: false },
    a: {
      chords: 'C Am | F G',
      melody: 'E5 - G5 - C6 - B5 A5 | G5 - - - . . . .',
      counter: 'C5 - - - - - - - | B4 - - - - - - -',
    },
  },
  form: ['intro', 'a'],
  loopFrom: 1,
};

const channel = (song: ReturnType<typeof arrange>, i: number) => song.score.channels[i]?.bars ?? [];

describe('arrange', () => {
  const song = arrange(base);

  it('expands the form into bars and starts the loop after the intro', () => {
    expect(song.plan.map((b) => `${b.section}:${b.index}/${b.length}`)).toEqual(['intro:0/2', 'intro:1/2', 'a:0/2', 'a:1/2']);
    expect(song.loopStartBar).toBe(2);
    expect(song.score.loopFrom).toBe(2);
  });

  it('keeps the melody as written', () => expect(channel(song, 0)[2]).toBe('E5 - G5 - C6 - B5 A5'));

  it('adds a counter channel and rests it where a section has none', () => {
    expect(song.score.channels).toHaveLength(4);
    expect(channel(song, 1)[0]).toBe('. . . . . . . .');
    expect(channel(song, 1)[2]).toBe('C5 - - - - - - -');
  });

  it('writes the bass from the chords, splitting a two-chord bar in half', () => {
    // pixel-quest plays root-fifth from C2 (MIDI 36)
    expect(channel(song, 3)[0]).toBe('C2 . G2 . C2 . G2 .');
    expect(channel(song, 3)[2]).toBe('C2 . G2 . A2 . E3 .');
  });

  it('arpeggiates the harmony from the voicing, adding the octave to a triad', () => {
    // pixel-quest arpeggiates three-note voicings from G3 (55)
    expect(channel(song, 2)[0]).toBe('C4 E4 G4 C5 C4 E4 G4 C5');
  });

  it('silences drums where a section asks, and fills the last bar of a section', () => {
    const drums = song.score.drums[0]?.bars ?? [];
    expect(drums[0]).toBe('........');
    expect(drums[2]).toBe('xhzhxhzz');
    expect(drums[3]).toBe('xhzzzzzz');
  });

  it('produces a score mojipx can compile', () => expect(() => compile(song.score)).not.toThrow());

  it('stretches the band to sixteenths for songs written in sixteenths', () => {
    const fine = arrange({
      ...base,
      steps: 4,
      sections: {
        intro: { chords: 'C', melody: 'C5 D5 E5 F5 G5 - - - . . . . C6 - - -', drums: false, counter: '. . . . . . . . . . . . . . . .' },
        a: { chords: 'C', melody: 'C5 - - - - - - - - - - - - - - -', counter: '. . . . . . . . . . . . . . . .' },
      },
    });
    expect(channel(fine, 3)[0]).toBe('C2 - . . G2 - . . C2 - . . G2 - . .');
    expect(fine.score.drums[0]?.bars[1]).toBe('x.h.z.h.x.h.z.z.');
    expect(() => compile(fine.score)).not.toThrow();
  });

  it('re-strikes a held pattern note when the chord changes mid-bar', () => {
    const held = arrange({ ...base, parts: { bass: 'whole' } });
    expect(channel(held, 3)[2]).toBe('C2 - - - A2 - - -');
  });

  it('approaches the next bar from a semitone below in a walking bass', () => {
    const walk = arrange({ ...base, style: 'cozy-village' });
    // bar 3 is "C Am" and the next bar starts on F2 (41), so the walk approaches from E2 (40)
    expect(channel(walk, 3)[2]?.split(' ')[6]).toBe('E2');
  });

  it('rejects malformed songs with a message naming the place', () => {
    const broken = (sections: SongDef['sections']) => () => arrange({ ...base, sections, form: ['a'], loopFrom: 0 });
    expect(broken({ a: { chords: 'C | G', melody: 'C5 - - - - - - -' } })).toThrow(/section "a".*2 chord bars but 1 melody/);
    expect(broken({ a: { chords: 'C', melody: 'C5 - - -' } })).toThrow(/bar 1.*4 steps, expected 8/);
    expect(broken({ a: { chords: 'C D E', melody: 'C5 - - - - - - -' } })).toThrow(/one or two chords/);
    expect(() => arrange({ ...base, form: ['x'] })).toThrow(/unknown section "x"/);
    expect(() => arrange({ ...base, loopFrom: 5 })).toThrow(/loopFrom/);
  });
});
