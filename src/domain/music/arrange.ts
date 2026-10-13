// Arranging: expand a song's form into bars and let its style write the band parts against the chord chart.
// The result is a mojipx Score plus the bar plan, which the tests use to check the harmony.
import type { Channel, DrumChannel, Score } from 'mojipx';
import { barsOf, type PartOverrides, type Section, type SongDef } from './song.ts';
import {
  BASS_PATTERNS,
  type BassPatternId,
  DRUM_PATTERNS,
  type DrumPatternId,
  HARMONY_PATTERNS,
  type HarmonyPatternId,
  type Instrument,
  type Style,
  styleOf,
} from './styles.ts';
import { atOrAbove, type Chord, fifthOf, type Key, noteNameOf, parseChord, parseKey, thirdOf, voicing } from './theory.ts';

export type Meter = 3 | 4;
export type StepsPerBeat = 2 | 4;

/** One bar of the expanded form. */
export type PlannedBar = {
  readonly section: string;
  /** Position of the bar inside its section, and the section's length in bars. */
  readonly index: number;
  readonly length: number;
  /** The key the bar is in: the song's, or its section's when the section modulates. */
  readonly key: Key;
  readonly chords: readonly Chord[];
  readonly melody: readonly string[];
  readonly counter: readonly string[] | null;
  /** The melody plays on the style's second lead voice. */
  readonly alt: boolean;
  readonly parts: PartOverrides;
};

export type ArrangedSong = {
  readonly def: SongDef;
  readonly key: Key;
  readonly style: Style;
  readonly meter: Meter;
  /** The resolution the score plays at: the song's own, or sixteenths when one of its patterns needs them. */
  readonly stepsPerBeat: StepsPerBeat;
  readonly plan: readonly PlannedBar[];
  readonly loopStartBar: number;
  readonly score: Score;
};

const REST = '.';
const HOLD = '-';

const fail = (def: SongDef, where: string, problem: string): never => {
  throw new Error(`Song "${def.id}" ${where}: ${problem}`);
};

const tokensOf = (bar: string): readonly string[] => (bar === '' ? [] : bar.split(/\s+/));

// ---- planning ----

const planSection = (def: SongDef, name: string, section: Section, perBar: number): readonly PlannedBar[] => {
  const chords = barsOf(section.chords);
  const melody = barsOf(section.melody);
  const counter = section.counter === undefined ? null : barsOf(section.counter);
  if (melody.length !== chords.length) fail(def, `section "${name}"`, `${chords.length} chord bars but ${melody.length} melody bars`);
  if (counter && counter.length !== chords.length)
    fail(def, `section "${name}"`, `${chords.length} chord bars but ${counter.length} counter bars`);
  const { bass, harmony, drums, pad } = section;
  const key = parseKey(section.key ?? def.key);
  return chords.map((bar, index) => {
    const symbols = tokensOf(bar);
    if (symbols.length < 1 || symbols.length > 2) fail(def, `section "${name}" bar ${index + 1}`, 'needs one or two chords');
    const line = tokensOf(melody[index] as string);
    if (line.length !== perBar) fail(def, `section "${name}" bar ${index + 1}`, `melody has ${line.length} steps, expected ${perBar}`);
    const second = counter ? tokensOf(counter[index] as string) : null;
    if (second && second.length !== perBar)
      fail(def, `section "${name}" bar ${index + 1}`, `counter has ${second.length} steps, expected ${perBar}`);
    return {
      section: name,
      index,
      length: chords.length,
      key,
      chords: symbols.map(parseChord),
      melody: line,
      counter: second,
      alt: section.lead === 'alt',
      parts: { bass, harmony, drums, pad },
    };
  });
};

export const planOf = (def: SongDef, perBar: number): readonly PlannedBar[] =>
  def.form.flatMap((name) => {
    const section = def.sections[name];
    return section ? planSection(def, name, section, perBar) : fail(def, 'form', `unknown section "${name}"`);
  });

// ---- what each bar plays ----

/** The pattern a part plays in a bar: the section's choice, else the song's, else the style's. */
const choose = <P>(section: P | false | undefined, song: P | false | undefined, style: P | null): P | null => {
  const picked = section ?? song ?? style;
  return picked === false || picked === undefined ? null : picked;
};

type Choice = {
  readonly bass: BassPatternId | null;
  readonly harmony: HarmonyPatternId | null;
  readonly drums: DrumPatternId | null;
  readonly pad: boolean;
};

const choiceOf = (def: SongDef, style: Style, bar: PlannedBar): Choice => ({
  bass: choose<BassPatternId>(bar.parts.bass, def.parts?.bass, style.bass.pattern),
  harmony: choose<HarmonyPatternId>(bar.parts.harmony, def.parts?.harmony, style.harmony.pattern),
  drums: choose<DrumPatternId>(bar.parts.drums, def.parts?.drums, style.drums?.pattern ?? null),
  pad: style.pad !== undefined && (bar.parts.pad ?? def.parts?.pad ?? true),
});

/** Tokens per eighth note a pattern is written in: 1 for eighths, 2 for sixteenths. */
const finenessOf = (tokens: number, meter: Meter): 1 | 2 => (tokens > meter * 2 ? 2 : 1);

const patternLengths = (c: Choice, meter: Meter): readonly number[] => [
  ...(c.bass ? [tokensOf(BASS_PATTERNS[c.bass][meter]).length] : []),
  ...(c.harmony ? [tokensOf(HARMONY_PATTERNS[c.harmony][meter]).length] : []),
  ...(c.drums ? [...DRUM_PATTERNS[c.drums].main[meter], ...DRUM_PATTERNS[c.drums].fill[meter]].map((line) => line.length) : []),
];

const stepsOf = (def: SongDef, choices: readonly Choice[], meter: Meter): StepsPerBeat =>
  def.steps === 4 || choices.some((c) => patternLengths(c, meter).some((n) => finenessOf(n, meter) === 2)) ? 4 : 2;

// ---- rendering patterns ----

/** Eighth-note tokens → the song's resolution. Sixteenths keep each eighth's attack and hold or rest its second half. */
const stretch = (tokens: readonly string[], steps: StepsPerBeat): readonly string[] =>
  steps === 2 ? tokens : tokens.flatMap((t) => [t, t === REST ? REST : HOLD]);

const stretchDrums = (line: string, steps: StepsPerBeat, meter: Meter): string =>
  steps === 2 || finenessOf(line.length, meter) === 2 ? line : [...line].map((c) => `${c}.`).join('');

/**
 * Renders a pattern bar against the chords: `resolve` turns a symbol into a mojipx token for a chord.
 * Two chords split a 4/4 bar 2+2 and a 3/4 bar 2+1. A hold that crosses into the second chord re-strikes
 * the last symbol, so a long note follows the harmony.
 */
const renderBar = (
  tokens: readonly string[],
  fine: 1 | 2,
  chords: readonly Chord[],
  resolve: (symbol: string, chord: Chord) => string,
): readonly string[] => {
  const change = 4 * fine;
  return tokens.reduce<{ readonly out: readonly string[]; readonly last: string | null }>(
    ({ out, last }, symbol, i) => {
      const effective = symbol === HOLD && chords.length > 1 && i === change && last !== null ? last : symbol;
      if (effective === HOLD || effective === REST) return { out: [...out, effective], last };
      const chord = (chords.length > 1 && i >= change ? chords[1] : chords[0]) as Chord;
      return { out: [...out, resolve(effective, chord)], last: effective };
    },
    { out: [], last: null },
  ).out;
};

/** A pattern bar rendered against the chords at the score's resolution. */
const renderPattern = (
  pattern: string,
  ctx: PartContext,
  chords: readonly Chord[],
  resolve: (symbol: string, chord: Chord) => string,
): string => {
  const tokens = tokensOf(pattern);
  const fine = finenessOf(tokens.length, ctx.meter);
  const rendered = renderBar(tokens, fine, chords, resolve);
  return (fine === 2 ? rendered : stretch(rendered, ctx.steps)).join(' ');
};

const bassToken =
  (low: number, next: Chord) =>
  (symbol: string, chord: Chord): string => {
    const root = atOrAbove(chord.bass, low);
    const target = atOrAbove(next.bass, low);
    const approach = next.bass === chord.bass ? atOrAbove(chord.root + fifthOf(chord), root) : target - 1 >= low ? target - 1 : target + 1;
    const notes: Readonly<Record<string, number>> = {
      R: root,
      '5': atOrAbove(chord.root + fifthOf(chord), root),
      '3': atOrAbove(chord.root + thirdOf(chord), root),
      '8': root + 12,
      A: approach,
    };
    const midi = notes[symbol];
    if (midi === undefined) throw new Error(`Unknown bass symbol "${symbol}"`);
    return noteNameOf(midi);
  };

const harmonyToken =
  (low: number, size: 3 | 4) =>
  (symbol: string, chord: Chord): string => {
    const voiced = voicing(chord, low, size);
    if (symbol === 'C') return voiced.map(noteNameOf).join('+');
    const arp = voiced.length >= 4 ? voiced : [...voiced, (voiced[0] as number) + 12];
    const midi = arp[Number(symbol) - 1];
    if (midi === undefined) throw new Error(`Unknown harmony symbol "${symbol}"`);
    return noteNameOf(midi);
  };

const restBar = (perBar: number): string => Array.from({ length: perBar }, () => REST).join(' ');

// ---- parts ----

type PartContext = {
  readonly plan: readonly PlannedBar[];
  readonly choices: readonly Choice[];
  readonly style: Style;
  readonly meter: Meter;
  readonly steps: StepsPerBeat;
  readonly loopStartBar: number;
};

const choiceAt = (ctx: PartContext, i: number): Choice => ctx.choices[i] as Choice;

const nextChordOf = (ctx: PartContext, i: number): Chord => {
  const next = ctx.plan[i + 1] ?? ctx.plan[ctx.loopStartBar];
  return (next?.chords[0] ?? ctx.plan[i]?.chords[0]) as Chord;
};

const bassBars = (ctx: PartContext): readonly string[] =>
  ctx.plan.map((bar, i) => {
    const id = choiceAt(ctx, i).bass;
    if (id === null) return restBar(ctx.meter * ctx.steps);
    return renderPattern(BASS_PATTERNS[id][ctx.meter], ctx, bar.chords, bassToken(ctx.style.bass.low, nextChordOf(ctx, i)));
  });

const harmonyBars = (ctx: PartContext): readonly string[] =>
  ctx.plan.map((bar, i) => {
    const id = choiceAt(ctx, i).harmony;
    if (id === null) return restBar(ctx.meter * ctx.steps);
    return renderPattern(HARMONY_PATTERNS[id][ctx.meter], ctx, bar.chords, harmonyToken(ctx.style.harmony.low, ctx.style.harmony.size));
  });

/** The pad's bars, or null when the style has no pad or no bar plays it. */
const padBars = (ctx: PartContext): readonly string[] | null => {
  const pad = ctx.style.pad;
  if (!pad || !ctx.choices.some((c) => c.pad)) return null;
  return ctx.plan.map((bar, i) =>
    choiceAt(ctx, i).pad
      ? renderPattern(HARMONY_PATTERNS.pad[ctx.meter], ctx, bar.chords, harmonyToken(pad.low, pad.size))
      : restBar(ctx.meter * ctx.steps),
  );
};

/** Drum lines per bar; every bar gets the same number of lines (missing ones rest). */
const drumBars = (ctx: PartContext): readonly (readonly string[])[] => {
  const rest = '.'.repeat(ctx.meter * ctx.steps);
  const perBar = ctx.plan.map((bar, i) => {
    const id = choiceAt(ctx, i).drums;
    if (id === null) return [];
    const fill = bar.index === bar.length - 1 && bar.length >= 2;
    return DRUM_PATTERNS[id][fill ? 'fill' : 'main'][ctx.meter].map((line) => stretchDrums(line, ctx.steps, ctx.meter));
  });
  const lines = Math.max(0, ...perBar.map((b) => b.length));
  return Array.from({ length: lines }, (_, l) => perBar.map((b) => b[l] ?? rest));
};

const channelOf = (instrument: Instrument, bars: readonly string[]): Channel => ({
  voice: instrument.voice,
  volume: instrument.volume,
  layer: 'both',
  bars,
  envelope: instrument.envelope,
  vibrato: instrument.vibrato,
  pan: instrument.pan,
  echo: instrument.echo,
});

/** The melody on the main lead and, for sections that ask for it, on the style's second lead voice. */
const leadChannels = (ctx: PartContext): readonly Channel[] => {
  const rest = restBar(ctx.meter * ctx.steps);
  const line = (bar: PlannedBar): string => bar.melody.join(' ');
  const alt = ctx.style.alt;
  if (!alt || !ctx.plan.some((bar) => bar.alt)) return [channelOf(ctx.style.lead, ctx.plan.map(line))];
  return [
    channelOf(
      ctx.style.lead,
      ctx.plan.map((bar) => (bar.alt ? rest : line(bar))),
    ),
    channelOf(
      alt,
      ctx.plan.map((bar) => (bar.alt ? line(bar) : rest)),
    ),
  ];
};

const counterChannels = (ctx: PartContext): readonly Channel[] =>
  ctx.plan.some((bar) => bar.counter !== null)
    ? [
        channelOf(
          ctx.style.counter,
          ctx.plan.map((bar) => (bar.counter ?? []).join(' ') || restBar(ctx.meter * ctx.steps)),
        ),
      ]
    : [];

const loopStartBarOf = (def: SongDef): number => {
  const from = def.loopFrom ?? 0;
  if (from < 0 || from >= def.form.length) fail(def, 'loopFrom', `${from} is outside the form`);
  return def.form.slice(0, from).reduce((bars, name) => bars + barsOf(def.sections[name]?.chords ?? '').length, 0);
};

/** Bars at the score's resolution: a song written in eighths is stretched when its band plays sixteenths. */
const refine = (plan: readonly PlannedBar[], from: StepsPerBeat, to: StepsPerBeat): readonly PlannedBar[] =>
  from === to ? plan : plan.map((bar) => ({ ...bar, melody: stretch(bar.melody, to), counter: bar.counter && stretch(bar.counter, to) }));

export const arrange = (def: SongDef): ArrangedSong => {
  const meter: Meter = def.meter ?? 4;
  const written: StepsPerBeat = def.steps ?? 2;
  const style = styleOf(def.style);
  const planned = planOf(def, meter * written);
  if (!style.alt && planned.some((bar) => bar.alt)) fail(def, 'lead', `style "${def.style}" has no second lead voice`);
  const choices = planned.map((bar) => choiceOf(def, style, bar));
  const steps = stepsOf(def, choices, meter);
  const plan = refine(planned, written, steps);
  const loopStartBar = loopStartBarOf(def);
  const ctx: PartContext = { plan, choices, style, meter, steps, loopStartBar };
  const [lead, ...alt] = leadChannels(ctx);
  const pad = padBars(ctx);
  const channels = [
    lead as Channel,
    ...counterChannels(ctx),
    channelOf(style.harmony, harmonyBars(ctx)),
    channelOf(style.bass, bassBars(ctx)),
    ...(style.pad && pad ? [channelOf(style.pad, pad)] : []),
    ...alt,
  ];
  const drumVolume = style.drums?.volume ?? 0.6;
  const drums: readonly DrumChannel[] = drumBars(ctx).map((bars) => ({ volume: drumVolume, layer: 'both', bars }));
  return {
    def,
    key: parseKey(def.key),
    style,
    meter,
    stepsPerBeat: steps,
    plan,
    loopStartBar,
    score: {
      bpm: def.bpm,
      beatsPerBar: meter,
      stepsPerBeat: steps,
      channels,
      drums,
      loopFrom: loopStartBar,
      swing: style.swing,
      echo: style.echo,
    },
  };
};
