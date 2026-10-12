// Musical checks for written lines. Every shipped song must come back without findings,
// which keeps hand-written melodies consonant with the chord chart the band plays.
import { midiOf } from 'mojipx';
import type { ArrangedSong, PlannedBar } from './arrange.ts';
import { type Chord, chordTones, mod12, noteNameOf, scaleOf } from './theory.ts';

export type Finding = {
  readonly line: 'melody' | 'counter';
  readonly bar: number;
  readonly beat: number;
  readonly note: string;
  readonly problem: string;
};

type Note = { readonly bar: number; readonly step: number; readonly length: number; readonly midi: readonly number[] };

/** Notes of a line with their lengths, following holds across bar lines. */
export const notesOf = (bars: readonly (readonly string[])[]): readonly Note[] => {
  const perBar = bars[0]?.length ?? 0;
  const flat = bars.flat();
  return flat.flatMap((token, i) => {
    if (token === '-' || token === '.') return [];
    const end = flat.findIndex((t, j) => j > i && t !== '-');
    const length = (end === -1 ? flat.length : end) - i;
    const midi = token.split('+').map((name) => midiOf(name) ?? Number.NaN);
    return [{ bar: Math.floor(i / perBar), step: i % perBar, length, midi }];
  });
};

/** The chord under a step; a second chord starts two beats into the bar (as the arranger plays it). */
const chordAt = (bar: PlannedBar, step: number, stepsPerBeat: number): Chord =>
  (bar.chords.length > 1 && step >= stepsPerBeat * 2 ? bar.chords[1] : bar.chords[0]) as Chord;

/** Tones that may sit on a strong beat over a chord without being chord tones: ninths, sixths, elevenths on minor chords, major sevenths on major triads. */
const tensionsOf = (c: Chord): readonly number[] => {
  const iv = new Set(c.intervals.map((i) => i % 12));
  const minor = iv.has(3);
  const diminished = iv.has(6) && !iv.has(7);
  if (diminished) return [];
  return [2, ...(iv.has(10) || iv.has(11) ? [] : [9]), ...(minor ? [5] : []), ...(!minor && !iv.has(10) ? [11] : [])].map((i) =>
    mod12(c.root + i),
  );
};

type Range = { readonly low: number; readonly high: number };
const RANGES: Readonly<Record<Finding['line'], Range>> = { melody: { low: 55, high: 96 }, counter: { low: 45, high: 96 } };

/** One pitch of a note, with everything the rules look at. */
type Pitch = {
  readonly midi: number;
  readonly pc: number;
  readonly chord: Chord;
  readonly tones: readonly number[];
  readonly isTone: boolean;
  readonly scale: readonly number[];
  readonly beats: number;
  readonly strong: boolean;
  readonly range: Range;
  readonly before: number | undefined;
};

type Rule = (p: Pitch) => string | null;

const RULES: readonly Rule[] = [
  (p) => (p.midi < p.range.low || p.midi > p.range.high ? `out of range ${noteNameOf(p.range.low)}–${noteNameOf(p.range.high)}` : null),
  (p) => (!p.isTone && !p.scale.includes(p.pc) ? `neither in ${p.chord.symbol} nor in the key` : null),
  // A held tone a semitone above a chord tone is the harshest clash (a minor ninth).
  (p) =>
    !p.isTone && p.beats >= 1 && p.tones.some((t) => mod12(p.pc - t) === 1) ? `clashes a semitone above a tone of ${p.chord.symbol}` : null,
  (p) =>
    !p.isTone && p.strong && p.beats >= 2 && !tensionsOf(p.chord).includes(p.pc)
      ? `unstable over ${p.chord.symbol} for ${p.beats} beats`
      : null,
  (p) => (p.before !== undefined && Math.abs(p.midi - p.before) > 12 ? 'leaps more than an octave' : null),
];

const checkNote = (song: ArrangedSong, line: Finding['line'], note: Note, prev: Note | undefined): readonly string[] => {
  const chord = chordAt(song.plan[note.bar] as PlannedBar, note.step, song.stepsPerBeat);
  const tones = chordTones(chord);
  const context = {
    chord,
    tones,
    scale: scaleOf(song.key),
    beats: note.length / song.stepsPerBeat,
    strong: note.step % (song.stepsPerBeat * 2) === 0,
    range: RANGES[line],
    before: prev?.midi.at(-1),
  };
  return note.midi.flatMap((midi) => {
    if (Number.isNaN(midi)) return ['unreadable note'];
    const pitch: Pitch = { ...context, midi, pc: mod12(midi), isTone: tones.includes(mod12(midi)) };
    return RULES.map((rule) => rule(pitch)).filter((problem): problem is string => problem !== null);
  });
};

const perBarOf = (song: ArrangedSong): number => song.meter * song.stepsPerBeat;

/** The chord under an absolute step of the song, or null past its end. */
const chordAtStep = (song: ArrangedSong, abs: number): Chord | null => {
  const bar = song.plan[Math.floor(abs / perBarOf(song))];
  return bar ? chordAt(bar, abs % perBarOf(song), song.stepsPerBeat) : null;
};

/** A note held into a later chord must not end up a semitone above one of that chord's tones for a beat or more. */
const heldClashes = (song: ArrangedSong, note: Note): readonly string[] => {
  const start = note.bar * perBarOf(song) + note.step;
  const first = chordAtStep(song, start);
  const later = Array.from({ length: note.length }, (_, i) => chordAtStep(song, start + i)).filter(
    (c): c is Chord => c !== null && c !== first,
  );
  const chords = [...new Set(later)].filter((c) => later.filter((x) => x === c).length >= song.stepsPerBeat);
  return chords.flatMap((chord) => {
    const tones = chordTones(chord);
    return note.midi
      .map(mod12)
      .filter((pc) => !tones.includes(pc) && tones.some((t) => mod12(pc - t) === 1))
      .map(() => `held into ${chord.symbol}, a semitone above one of its tones`);
  });
};

const findingOf = (song: ArrangedSong, line: Finding['line'], note: Note, problem: string): Finding => ({
  line,
  bar: note.bar + 1,
  beat: note.step / song.stepsPerBeat + 1,
  note: note.midi.map(noteNameOf).join('+'),
  problem,
});

const lineFindings = (song: ArrangedSong, line: Finding['line'], bars: readonly (readonly string[])[]): readonly Finding[] => {
  const notes = notesOf(bars);
  return notes.flatMap((note, i) =>
    [...checkNote(song, line, note, notes[i - 1]), ...heldClashes(song, note)].map((problem) => findingOf(song, line, note, problem)),
  );
};

/** For every step, the pitches a line sounds there and the note they belong to. */
const soundingOf = (song: ArrangedSong, notes: readonly Note[]): readonly (Note | undefined)[] => {
  const steps: (Note | undefined)[] = Array.from({ length: song.plan.length * perBarOf(song) });
  for (const n of notes) for (let i = 0; i < n.length; i++) steps[n.bar * perBarOf(song) + n.step + i] = n;
  return steps;
};

const semitoneApart = (a: Note, b: Note): boolean => a.midi.some((x) => b.midi.some((y) => Math.abs(x - y) % 12 === 1));

/** Melody and counter must not grind a semitone (or a minor ninth) apart for a beat or more. */
const voiceClashes = (song: ArrangedSong, melody: readonly Note[], counter: readonly Note[]): readonly Finding[] => {
  const top = soundingOf(song, melody);
  const low = soundingOf(song, counter);
  const pairs = new Map<Note, { readonly with: Note; readonly steps: number }>();
  top.forEach((m, i) => {
    const c = low[i];
    if (!m || !c || !semitoneApart(m, c)) return;
    pairs.set(c, { with: m, steps: (pairs.get(c)?.steps ?? 0) + 1 });
  });
  return [...pairs.entries()]
    .filter(([, p]) => p.steps >= song.stepsPerBeat)
    .map(([c, p]) => findingOf(song, 'counter', c, `a semitone against the melody's ${p.with.midi.map(noteNameOf).join('+')}`));
};

/** When the loop starts over, the jump from its last melody note to the first one must stay within an octave. */
const loopLeap = (song: ArrangedSong, melody: readonly Note[]): readonly Finding[] => {
  const last = melody.at(-1);
  const first = melody.find((n) => n.bar >= song.loopStartBar);
  if (!last || !first || Math.abs((last.midi.at(-1) ?? 0) - (first.midi[0] ?? 0)) <= 12) return [];
  return [findingOf(song, 'melody', last, 'leaps more than an octave back to the loop start')];
};

export const lintSong = (song: ArrangedSong): readonly Finding[] => {
  const melodyBars = song.plan.map((b) => b.melody);
  const melody = [...lineFindings(song, 'melody', melodyBars), ...loopLeap(song, notesOf(melodyBars))];
  if (!song.plan.some((b) => b.counter)) return melody;
  const counterBars = song.plan.map((b) => b.counter ?? b.melody.map(() => '.'));
  return [...melody, ...lineFindings(song, 'counter', counterBars), ...voiceClashes(song, notesOf(melodyBars), notesOf(counterBars))];
};
