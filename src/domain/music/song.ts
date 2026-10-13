// A song as it is written: a chord chart, a hand-written melody and a form, plus the style that arranges it.
// Arranging (arrange.ts) turns it into a mojipx Score; nothing here touches audio.
import { midiOf } from 'mojipx';
import type { Mood } from '../mood.ts';
import type { BassPatternId, DrumPatternId, HarmonyPatternId, StyleId } from './styles.ts';
import { noteNameOf, parseKey, transposeChord } from './theory.ts';

/** Per-section switches: a pattern id replaces the style's pattern, `false` silences that part. */
export type PartOverrides = {
  readonly bass?: BassPatternId | false;
  readonly harmony?: HarmonyPatternId | false;
  readonly drums?: DrumPatternId | false;
  /** The style's sustained pad, if it has one: on unless turned off. */
  readonly pad?: boolean;
};

export type Section = PartOverrides & {
  /** One or two chord symbols per bar, bars separated by '|'. Two chords split the bar. */
  readonly chords: string;
  /** Lead line in mojipx tokens ('C5', '-', '.', 'E4+G4'), bars separated by '|'. */
  readonly melody: string;
  /** An optional second line (counter melody or harmony), same notation. */
  readonly counter?: string;
  /** The section's key when it modulates (a last chorus lifted a step, say); the song's key otherwise. */
  readonly key?: string;
  /** 'alt' plays the melody on the style's second lead voice. */
  readonly lead?: 'alt';
};

export type SongDef = {
  /** Stable, URL-safe id. */
  readonly id: string;
  readonly title: string;
  readonly style: StyleId;
  readonly mood: Mood;
  /** 'C' for C major, 'Am' for A minor. */
  readonly key: string;
  readonly bpm: number;
  readonly meter?: 3 | 4;
  /** Melody tokens per beat: 2 (eighths, the default) or 4 (sixteenths). */
  readonly steps?: 2 | 4;
  readonly sections: Readonly<Record<string, Section>>;
  /** Section names in playing order. */
  readonly form: readonly string[];
  /** Index into `form` where repeats start; sections before it (an intro) play once. */
  readonly loopFrom?: number;
  /** Song-wide pattern choices that replace the style's defaults. */
  readonly parts?: PartOverrides;
};

export const barsOf = (line: string): readonly string[] => line.split('|').map((bar) => bar.trim());

const moveLine = (line: string, semitones: number): string =>
  line
    .split(/(\s+|\|)/)
    .map((token) =>
      /^[A-G]/.test(token)
        ? token
            .split('+')
            .map((name) => noteNameOf((midiOf(name) ?? Number.NaN) + semitones))
            .join('+')
        : token,
    )
    .join('');

/**
 * The same section moved by `semitones` into `key`: chords, melody and counter all follow, so a chorus can come
 * back lifted a step for the finale without being written twice.
 */
export const transposed = (section: Section, semitones: number, key: string): Section => {
  const target = parseKey(key);
  return {
    ...section,
    key,
    chords: barsOf(section.chords)
      .map((bar) =>
        bar
          .split(/\s+/)
          .map((symbol) => transposeChord(symbol, semitones, target))
          .join(' '),
      )
      .join(' | '),
    melody: moveLine(section.melody, semitones),
    ...(section.counter === undefined ? {} : { counter: moveLine(section.counter, semitones) }),
  };
};
