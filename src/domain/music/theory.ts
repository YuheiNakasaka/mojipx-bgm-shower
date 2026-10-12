// Pitch classes, keys and chord symbols. Pure; no audio.

/** 0 = C … 11 = B. */
export type PitchClass = number;
export type Mode = 'major' | 'minor';
export type Key = { readonly tonic: PitchClass; readonly mode: Mode };

const LETTER: Readonly<Record<string, number>> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

export const mod12 = (n: number): PitchClass => ((n % 12) + 12) % 12;

/** 'C', 'F#', 'Bb' → pitch class; null if unreadable. */
export const pitchClassOf = (name: string): PitchClass | null => {
  const m = /^([A-G])(#|b)?$/.exec(name);
  if (!m) return null;
  const base = LETTER[m[1] as string] as number;
  return mod12(base + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0));
};

/** MIDI number → note name readable by mojipx (sharps), e.g. 61 → 'C#4'. */
export const noteNameOf = (midi: number): string => `${SHARP_NAMES[mod12(midi)]}${Math.floor(midi / 12) - 1}`;

// ---- keys ----

/** 'C' → C major, 'F#m' → F# minor. Throws on unreadable keys (song data is checked by tests). */
export const parseKey = (s: string): Key => {
  const m = /^([A-G](?:#|b)?)(m?)$/.exec(s);
  const tonic = m ? pitchClassOf(m[1] as string) : null;
  if (!m || tonic === null) throw new Error(`Unreadable key: ${s}`);
  return { tonic, mode: m[2] === 'm' ? 'minor' : 'major' };
};

// Flats read better for these tonics.
const prefersFlats = (k: Key): boolean => (k.mode === 'major' ? [5, 10, 3, 8, 1, 6] : [2, 7, 0, 5, 10, 3]).includes(k.tonic);

export const keyLabel = (k: Key): string => `${(prefersFlats(k) ? FLAT_NAMES : SHARP_NAMES)[k.tonic]} ${k.mode}`;

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11] as const;
const NATURAL_MINOR = [0, 2, 3, 5, 7, 8, 10] as const;

/** Pitch classes that belong to the key. Minor keys also admit the raised 6th and 7th (melodic and harmonic minor). */
export const scaleOf = (k: Key): readonly PitchClass[] =>
  k.mode === 'major' ? MAJOR_SCALE.map((i) => mod12(k.tonic + i)) : [...NATURAL_MINOR, 9, 11].map((i) => mod12(k.tonic + i));

/** Position of the key's signature on the circle of fifths (relative keys share a position). */
const circlePosition = (k: Key): number => mod12((k.mode === 'major' ? k.tonic : k.tonic + 3) * 7);

/**
 * How far apart two keys sound when one follows the other: steps on the circle of fifths (0–6),
 * plus 0.5 when only the mode changes between relative keys. 0 means the same key.
 */
export const keyDistance = (a: Key, b: Key): number => {
  const d = Math.abs(circlePosition(a) - circlePosition(b));
  const steps = Math.min(d, 12 - d);
  return steps + (a.mode === b.mode ? 0 : 0.5);
};

// ---- chords ----

const QUALITIES = {
  '': [0, 4, 7],
  m: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  '7': [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  m7b5: [0, 3, 6, 10],
  dim7: [0, 3, 6, 9],
  '6': [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
  add9: [0, 4, 7, 14],
  madd9: [0, 3, 7, 14],
  '9': [0, 4, 7, 10, 14],
  maj9: [0, 4, 7, 11, 14],
  m9: [0, 3, 7, 10, 14],
  mM7: [0, 3, 7, 11],
  '7sus4': [0, 5, 7, 10],
} as const satisfies Readonly<Record<string, readonly number[]>>;

export type ChordQuality = keyof typeof QUALITIES;

export type Chord = {
  readonly symbol: string;
  readonly root: PitchClass;
  readonly quality: ChordQuality;
  /** The lowest note (slash chords); the root otherwise. */
  readonly bass: PitchClass;
  /** Semitones above the root, possibly beyond an octave (9ths). */
  readonly intervals: readonly number[];
};

const isQuality = (s: string): s is ChordQuality => Object.hasOwn(QUALITIES, s);

/** 'Cmaj7', 'F#m7b5', 'G/B' → chord. Throws on unreadable symbols (song data is checked by tests). */
export const parseChord = (symbol: string): Chord => {
  const m = /^([A-G](?:#|b)?)([A-Za-z0-9]*)(?:\/([A-G](?:#|b)?))?$/.exec(symbol);
  const root = m ? pitchClassOf(m[1] as string) : null;
  const quality = m?.[2] ?? '';
  const bass = m?.[3] ? pitchClassOf(m[3]) : root;
  if (!m || root === null || bass === null || !isQuality(quality)) throw new Error(`Unreadable chord: ${symbol}`);
  return { symbol, root, quality, bass, intervals: QUALITIES[quality] };
};

/** Pitch classes sounding in the chord, including a slash bass. */
export const chordTones = (c: Chord): readonly PitchClass[] => [...new Set([c.bass, ...c.intervals.map((i) => mod12(c.root + i))])];

/** The interval (semitones, 0–11) of the chord's fifth-like tone: the fifth when present, else the highest triad tone. */
export const fifthOf = (c: Chord): number => (c.intervals.find((i) => i === 6 || i === 7 || i === 8) ?? 7) % 12;

/** The chord's third-like tone (or the suspended tone), 0–11. */
export const thirdOf = (c: Chord): number => (c.intervals.find((i) => i >= 2 && i <= 5) ?? 4) % 12;

/** The lowest MIDI note with pitch class pc at or above `low`. */
export const atOrAbove = (pc: PitchClass, low: number): number => low + mod12(pc - low);

/**
 * A close voicing of the chord's upper tones (the bass is left to the bass line), with at most `size` notes,
 * starting at or above `low`. Ninths are dropped first when the chord has more tones than fit.
 */
/** Pitch classes stacked upward, each just above the one before it, starting at or above `floor`. */
const stackUp = (pcs: readonly PitchClass[], floor: number): readonly number[] => {
  const [first, ...rest] = pcs;
  if (first === undefined) return [];
  const note = atOrAbove(first, floor);
  return [note, ...stackUp(rest, note + 1)];
};

// What a voicing keeps when the chord has more tones than voices: the guide tones (third, then seventh or
// sixth), then extensions, then the fifth, and the root last, since the bass already plays it.
const roleRank = (interval: number, third: number): number => {
  if (interval === third) return 0;
  if (interval >= 9 && interval <= 11) return 1;
  if (interval >= 12) return 2;
  return interval === 0 ? 4 : 3;
};

export const voicing = (c: Chord, low: number, size: number): readonly number[] => {
  if (c.intervals.length <= size)
    return stackUp(
      c.intervals.map((i) => mod12(c.root + i)),
      low,
    );
  const third = thirdOf(c);
  const kept = [...c.intervals].sort((a, b) => roleRank(a, third) - roleRank(b, third)).slice(0, size);
  // Stack from the third upward, so the most telling tone sits at the bottom of the voicing.
  const fromThird = [...kept].sort((a, b) => mod12(a - third) - mod12(b - third));
  return stackUp(
    fromThird.map((i) => mod12(c.root + i)),
    low,
  );
};
