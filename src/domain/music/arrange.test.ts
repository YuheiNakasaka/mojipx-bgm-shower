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

  describe('with sixteenth-note patterns', () => {
    // city-groove plays a sixteenth-note bass, comping and kit under a melody written in eighths.
    const groove = arrange({ ...base, style: 'city-groove' });

    it('plays the whole song in sixteenths, keeping the melody as written', () => {
      expect(groove.stepsPerBeat).toBe(4);
      expect(groove.score.stepsPerBeat).toBe(4);
      expect(channel(groove, 0)[2]).toBe('E5 - - - G5 - - - C6 - - - B5 - A5 -');
      expect(groove.plan[2]?.melody).toHaveLength(16);
    });

    it('changes the chord of a sixteenth-note pattern at the half bar', () => {
      // funk from A1 (33): "R . . R . . 8 . | R . R . 8 . 5 ." over C then Am
      expect(channel(groove, 3)[2]).toBe('C2 . . C2 . . C3 . A1 . A1 . A2 . E2 .');
    });

    it('stretches eighth-note patterns that share the song', () => {
      const mixed = arrange({ ...base, style: 'city-groove', parts: { harmony: 'pad' } });
      expect(channel(mixed, 2)[0]?.split(' ').slice(0, 2)).toEqual(['C4+E4+G4', '-']);
    });

    it('keeps sixteenth-note drum lines as written', () => expect(groove.score.drums[0]?.bars[2]).toBe('x.h.z.hkx.h.z.hh'));

    it('produces a score mojipx can compile', () => expect(() => compile(groove.score)).not.toThrow());
  });

  describe('pad and second lead', () => {
    const band = arrange({
      ...base,
      style: 'band-rock',
      sections: { ...base.sections, a: { ...base.sections.a, chords: 'C Am | F G', lead: 'alt' } as SongDef['sections'][string] },
    });
    const last = band.score.channels.length - 1;

    it('adds the pad after the bass, silenced where a section turns it off', () => {
      const withPad = arrange({
        ...base,
        style: 'band-rock',
        sections: { ...base.sections, intro: { ...base.sections.intro, pad: false } },
      } as SongDef);
      expect(channel(withPad, 4)[0]).toBe('. . . . . . . .');
      // band-rock voices its pad from C4 (60) in three notes; the bar re-strikes on the second chord
      expect(channel(withPad, 4)[2]).toBe('C4+E4+G4 - - - A4+C5+E5 - - -');
    });

    it('moves the melody to the second lead where a section asks for it', () => {
      expect(channel(band, 0)[0]).toBe('C5 - - - - - - -');
      expect(channel(band, 0)[2]).toBe('. . . . . . . .');
      expect(channel(band, last)[0]).toBe('. . . . . . . .');
      expect(channel(band, last)[2]).toBe('E5 - G5 - C6 - B5 A5');
      expect(band.score.channels[last]?.voice).toBe('saw');
    });

    it('rejects a second lead on a style without one', () =>
      expect(() => arrange({ ...base, sections: { ...base.sections, a: { ...base.sections.a, lead: 'alt' } } } as SongDef)).toThrow(
        /no second lead voice/,
      ));
  });

  it('records the key of a modulating section in the plan', () => {
    const lifted = arrange({ ...base, sections: { ...base.sections, a: { ...base.sections.a, key: 'D' } } } as SongDef);
    expect(lifted.plan.map((b) => b.key.tonic)).toEqual([0, 0, 2, 2]);
    expect(lifted.key.tonic).toBe(0);
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
