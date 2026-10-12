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
  readonly chords: readonly Chord[];
  readonly melody: readonly string[];
  readonly counter: readonly string[] | null;
  readonly parts: PartOverrides;
};

export type ArrangedSong = {
  readonly def: SongDef;
  readonly key: Key;
  readonly style: Style;
  readonly meter: Meter;
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
  const { bass, harmony, drums } = section;
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
      chords: symbols.map(parseChord),
      melody: line,
      counter: second,
      parts: { bass, harmony, drums },
    };
  });
};

export const planOf = (def: SongDef, perBar: number): readonly PlannedBar[] =>
  def.form.flatMap((name) => {
    const section = def.sections[name];
    return section ? planSection(def, name, section, perBar) : fail(def, 'form', `unknown section "${name}"`);
  });

// ---- rendering patterns ----

/** The chord sounding at an eighth-note position of a bar. Two chords split a 4/4 bar 2+2 and a 3/4 bar 2+1. */
const chordAtEighth = (chords: readonly Chord[], eighth: number): Chord =>
  (chords.length > 1 && eighth >= 4 ? chords[1] : chords[0]) as Chord;

/** Eighth-note tokens → the song's resolution. Sixteenths keep each eighth's attack and hold or rest its second half. */
const stretch = (tokens: readonly string[], steps: StepsPerBeat): readonly string[] =>
  steps === 2 ? tokens : tokens.flatMap((t) => [t, t === REST ? REST : HOLD]);

const stretchDrums = (line: string, steps: StepsPerBeat): string => (steps === 2 ? line : [...line].map((c) => `${c}.`).join(''));

/**
 * Renders a pattern bar against the chords: `resolve` turns a symbol into a mojipx token for a chord.
 * A hold that crosses into the second chord re-strikes the last symbol, so a long note follows the harmony.
 */
const renderBar = (pattern: string, chords: readonly Chord[], resolve: (symbol: string, chord: Chord) => string): readonly string[] =>
  tokensOf(pattern).reduce<{ readonly out: readonly string[]; readonly last: string | null }>(
    ({ out, last }, symbol, eighth) => {
      const changes = chords.length > 1 && eighth === 4;
      const effective = symbol === HOLD && changes && last !== null ? last : symbol;
      if (effective === HOLD || effective === REST) return { out: [...out, effective], last };
      return { out: [...out, resolve(effective, chordAtEighth(chords, eighth))], last: effective };
    },
    { out: [], last: null },
  ).out;

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

/** The pattern a part plays in a bar: the section's choice, else the song's, else the style's. */
const choose = <P>(section: P | false | undefined, song: P | false | undefined, style: P | null): P | null => {
  const picked = section ?? song ?? style;
  return picked === false || picked === undefined ? null : picked;
};

// ---- parts ----

type PartContext = {
  readonly plan: readonly PlannedBar[];
  readonly def: SongDef;
  readonly style: Style;
  readonly meter: Meter;
  readonly steps: StepsPerBeat;
};

const nextChordOf = (ctx: PartContext, i: number, loopStartBar: number): Chord => {
  const next = ctx.plan[i + 1] ?? ctx.plan[loopStartBar];
  return (next?.chords[0] ?? ctx.plan[i]?.chords[0]) as Chord;
};

const bassBars = (ctx: PartContext, loopStartBar: number): readonly string[] =>
  ctx.plan.map((bar, i) => {
    const id = choose<BassPatternId>(bar.parts.bass, ctx.def.parts?.bass, ctx.style.bass.pattern);
    if (id === null) return restBar(ctx.meter * ctx.steps);
    const tokens = renderBar(BASS_PATTERNS[id][ctx.meter], bar.chords, bassToken(ctx.style.bass.low, nextChordOf(ctx, i, loopStartBar)));
    return stretch(tokens, ctx.steps).join(' ');
  });

const harmonyBars = (ctx: PartContext): readonly string[] =>
  ctx.plan.map((bar) => {
    const id = choose<HarmonyPatternId>(bar.parts.harmony, ctx.def.parts?.harmony, ctx.style.harmony.pattern);
    if (id === null) return restBar(ctx.meter * ctx.steps);
    const tokens = renderBar(HARMONY_PATTERNS[id][ctx.meter], bar.chords, harmonyToken(ctx.style.harmony.low, ctx.style.harmony.size));
    return stretch(tokens, ctx.steps).join(' ');
  });

/** Drum lines per bar; every bar gets the same number of lines (missing ones rest). */
const drumBars = (ctx: PartContext): readonly (readonly string[])[] => {
  const rest = '.'.repeat(ctx.meter * ctx.steps);
  const perBar = ctx.plan.map((bar) => {
    const id = choose<DrumPatternId>(bar.parts.drums, ctx.def.parts?.drums, ctx.style.drums?.pattern ?? null);
    if (id === null) return [];
    const fill = bar.index === bar.length - 1 && bar.length >= 2;
    return DRUM_PATTERNS[id][fill ? 'fill' : 'main'][ctx.meter].map((line) => stretchDrums(line, ctx.steps));
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

const loopStartBarOf = (def: SongDef): number => {
  const from = def.loopFrom ?? 0;
  if (from < 0 || from >= def.form.length) fail(def, 'loopFrom', `${from} is outside the form`);
  return def.form.slice(0, from).reduce((bars, name) => bars + barsOf(def.sections[name]?.chords ?? '').length, 0);
};

export const arrange = (def: SongDef): ArrangedSong => {
  const meter: Meter = def.meter ?? 4;
  const steps: StepsPerBeat = def.steps ?? 2;
  const style = styleOf(def.style);
  const plan = planOf(def, meter * steps);
  const loopStartBar = loopStartBarOf(def);
  const ctx: PartContext = { plan, def, style, meter, steps };
  const hasCounter = plan.some((bar) => bar.counter !== null);
  const drumVolume = style.drums?.volume ?? 0.6;
  const channels = [
    channelOf(
      style.lead,
      plan.map((bar) => bar.melody.join(' ')),
    ),
    ...(hasCounter
      ? [
          channelOf(
            style.counter,
            plan.map((bar) => (bar.counter ?? []).join(' ') || restBar(meter * steps)),
          ),
        ]
      : []),
    channelOf(style.harmony, harmonyBars(ctx)),
    channelOf(style.bass, bassBars(ctx, loopStartBar)),
  ];
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
