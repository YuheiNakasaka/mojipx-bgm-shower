// Styles: how a chord chart becomes a band. Every pattern is data, written at eighth-note resolution
// (one token per eighth) for 4/4 and 3/4; the arranger stretches it when a song is written in sixteenths.
import type { Envelope, Voice } from 'mojipx';

// ---- bass ----
// R = chord bass (root or slash bass), 5 = fifth, 3 = third, 8 = root an octave up,
// A = approach note into the next bar's bass, '-' = hold, '.' = rest.

export const BASS_PATTERNS = {
  whole: { 4: 'R - - - - - - -', 3: 'R - - - - -' },
  half: { 4: 'R - - - 5 - - -', 3: 'R - - - 5 -' },
  'root-fifth': { 4: 'R . 5 . R . 5 .', 3: 'R . 5 . 5 .' },
  octave: { 4: 'R 8 R 8 R 8 R 8', 3: 'R 8 R 8 R 8' },
  offbeat: { 4: '. R . R . R . R', 3: '. R . R . R' },
  pedal: { 4: 'R R R R R R R R', 3: 'R R R R R R' },
  walk: { 4: 'R . 3 . 5 . A .', 3: 'R . 3 . 5 .' },
  syncopated: { 4: 'R - . R - . 8 .', 3: 'R - . R 5 .' },
  gallop: { 4: 'R R 8 R R 8 R 8', 3: 'R R 8 R R 8' },
} as const satisfies Readonly<Record<string, MeterPatterns>>;

// ---- harmony ----
// 1–4 = notes of the chord voicing from the bottom, C = the whole chord, '-' = hold, '.' = rest.

export const HARMONY_PATTERNS = {
  pad: { 4: 'C - - - - - - -', 3: 'C - - - - -' },
  'half-pad': { 4: 'C - - - C - - -', 3: 'C - - - C -' },
  'arp-up': { 4: '1 2 3 4 1 2 3 4', 3: '1 2 3 4 3 2' },
  'arp-updown': { 4: '1 2 3 4 3 2 1 2', 3: '1 2 3 4 3 2' },
  broken: { 4: '1 3 2 3 1 3 2 3', 3: '1 3 2 3 2 3' },
  offbeat: { 4: '. C . C . C . C', 3: '. C . C . C' },
  backbeat: { 4: '. . C - . . C -', 3: '. . C - C -' },
  skank: { 4: '. . C . . . C .', 3: '. . C . C .' },
  pulse: { 4: 'C C C C C C C C', 3: 'C C C C C C' },
  charleston: { 4: 'C - - C - - . .', 3: 'C - - C - .' },
} as const satisfies Readonly<Record<string, MeterPatterns>>;

// ---- drums ----
// mojipx drum letters: k kick, s snare, h hat, H two hats, x kick+hat, z snare+hat, o open hat, t tom.
// Each pattern has one or two lines that play together; `fill` replaces `main` on a section's last bar.

export const DRUM_PATTERNS = {
  light: { main: { 4: ['x.z.x.z.'], 3: ['x.h.h.'] }, fill: { 4: ['x.z.zzzz'], 3: ['x.zzzz'] } },
  eight: { main: { 4: ['xhzhxhzh'], 3: ['xhzhzh'] }, fill: { 4: ['xhzhzzzz'], 3: ['xhzzzz'] } },
  push: { main: { 4: ['xHzHhxzH'], 3: ['xHzHzH'] }, fill: { 4: ['xHzHzzzz'], 3: ['xHzzzz'] } },
  four: { main: { 4: ['k.k.k.k.', '.ozo.ozo'], 3: ['k.k.k.', '.ozo.o'] }, fill: { 4: ['k.k.k.k.', '.ozozzzz'], 3: ['k.k.k.', '.ozzzz'] } },
  half: { main: { 4: ['x.h.z.h.'], 3: ['x.h.z.'] }, fill: { 4: ['x.h.zzzz'], 3: ['x.zzzz'] } },
  boom: { main: { 4: ['xhzhhxzh'], 3: ['xhzhxh'] }, fill: { 4: ['xhzhzzzH'], 3: ['xhzzzH'] } },
  march: { main: { 4: ['xhzhxhzz'], 3: ['xhzhzz'] }, fill: { 4: ['xhzzzzzz'], 3: ['xzzzzz'] } },
  gallop: { main: { 4: ['xxzhxxzh'], 3: ['xxzhxx'] }, fill: { 4: ['xxzhzzzz'], 3: ['xxzzzz'] } },
  waltz: { main: { 4: ['x.h.z.h.'], 3: ['x.h.h.'] }, fill: { 4: ['x.h.zzzz'], 3: ['x.z.zz'] } },
  taiko: { main: { 4: ['t.tkt.k.', '....s...'], 3: ['t.tkt.'] }, fill: { 4: ['tttttttt'], 3: ['tttttt'] } },
  brush: { main: { 4: ['x.h.s.h.'], 3: ['x.h.s.'] }, fill: { 4: ['x.h.s.ss'], 3: ['x.s.ss'] } },
} as const satisfies Readonly<Record<string, DrumPattern>>;

type MeterPatterns = { readonly 4: string; readonly 3: string };
type DrumLines = { readonly 4: readonly string[]; readonly 3: readonly string[] };
type DrumPattern = { readonly main: DrumLines; readonly fill: DrumLines };

export type BassPatternId = keyof typeof BASS_PATTERNS;
export type HarmonyPatternId = keyof typeof HARMONY_PATTERNS;
export type DrumPatternId = keyof typeof DRUM_PATTERNS;

// ---- instruments and styles ----

export type Instrument = {
  readonly voice: Voice;
  readonly volume: number;
  readonly envelope?: Envelope;
  readonly vibrato?: number;
  readonly pan?: number;
  readonly echo?: number;
};

export type Style = {
  readonly label: string;
  readonly lead: Instrument;
  readonly counter: Instrument;
  /** Chord accompaniment voiced from `low` (MIDI) upward with `size` notes. */
  readonly harmony: Instrument & { readonly pattern: HarmonyPatternId; readonly low: number; readonly size: 3 | 4 };
  /** Bass with its lowest note at `low` (MIDI). */
  readonly bass: Instrument & { readonly pattern: BassPatternId; readonly low: number };
  readonly drums: { readonly pattern: DrumPatternId; readonly volume: number } | null;
  readonly swing?: number;
  readonly echo?: { readonly steps: number; readonly feedback: number };
};

export const STYLES = {
  'cozy-village': {
    label: 'Cozy Village',
    lead: { voice: 'sine', volume: 1, envelope: 'pluck', echo: 0.18 },
    counter: { voice: 'pulse12', volume: 0.45, envelope: 'pluck', pan: 0.35 },
    harmony: { voice: 'pulse12', volume: 0.3, pattern: 'skank', low: 57, size: 3, pan: -0.3 },
    bass: { voice: 'triangle', volume: 0.95, pattern: 'walk', low: 36 },
    drums: { pattern: 'light', volume: 0.4 },
    swing: 0.18,
    echo: { steps: 3, feedback: 0.3 },
  },
  'town-waltz': {
    label: 'Town Waltz',
    lead: { voice: 'pulse', volume: 0.85, vibrato: 8 },
    counter: { voice: 'triangle', volume: 0.6 },
    harmony: { voice: 'square', volume: 0.3, pattern: 'backbeat', low: 55, size: 3, pan: 0.25 },
    bass: { voice: 'triangle', volume: 0.95, pattern: 'half', low: 36 },
    drums: { pattern: 'waltz', volume: 0.4 },
  },
  'pixel-quest': {
    label: 'Pixel Quest',
    lead: { voice: 'pulse', volume: 1 },
    counter: { voice: 'pulse12', volume: 0.55, pan: -0.25 },
    harmony: { voice: 'pulse12', volume: 0.4, pattern: 'arp-up', low: 55, size: 3, pan: 0.25 },
    bass: { voice: 'triangle', volume: 1, pattern: 'root-fifth', low: 36 },
    drums: { pattern: 'march', volume: 0.65 },
  },
  'deep-dungeon': {
    label: 'Deep Dungeon',
    lead: { voice: 'square', volume: 0.7, echo: 0.35 },
    counter: { voice: 'pulse12', volume: 0.4, pan: 0.3, echo: 0.3 },
    harmony: { voice: 'triangle', volume: 0.55, pattern: 'arp-updown', low: 52, size: 3 },
    bass: { voice: 'triangle', volume: 0.9, pattern: 'half', low: 33 },
    drums: { pattern: 'half', volume: 0.45 },
    echo: { steps: 3, feedback: 0.45 },
  },
  'boss-rush': {
    label: 'Boss Rush',
    lead: { voice: 'square', volume: 0.85, vibrato: 10 },
    counter: { voice: 'pulse', volume: 0.5, pan: 0.3 },
    harmony: { voice: 'pulse12', volume: 0.3, pattern: 'pulse', low: 52, size: 3, pan: -0.3 },
    bass: { voice: 'triangle', volume: 1, pattern: 'octave', low: 33 },
    drums: { pattern: 'gallop', volume: 0.8 },
  },
  'grand-field': {
    label: 'Grand Field',
    lead: { voice: 'saw', volume: 0.85, vibrato: 14, echo: 0.15 },
    counter: { voice: 'square', volume: 0.45, vibrato: 8, pan: -0.3 },
    harmony: { voice: 'sine', volume: 0.5, pattern: 'arp-up', low: 55, size: 4, envelope: 'pluck', pan: 0.3, echo: 0.2 },
    bass: { voice: 'triangle', volume: 1, pattern: 'root-fifth', low: 36 },
    drums: { pattern: 'march', volume: 0.5 },
    echo: { steps: 2, feedback: 0.3 },
  },
  'nineties-pop': {
    label: 'Nineties Pop',
    lead: { voice: 'saw', volume: 0.8, vibrato: 12, echo: 0.12 },
    counter: { voice: 'pulse', volume: 0.45, pan: 0.35 },
    harmony: { voice: 'square', volume: 0.32, pattern: 'backbeat', low: 57, size: 3, pan: -0.3 },
    bass: { voice: 'pulse', volume: 0.75, pattern: 'octave', low: 36 },
    drums: { pattern: 'push', volume: 0.8 },
    echo: { steps: 3, feedback: 0.25 },
  },
  'city-lights': {
    label: 'City Lights',
    lead: { voice: 'pulse12', volume: 0.85, vibrato: 6, echo: 0.2 },
    counter: { voice: 'saw', volume: 0.35, vibrato: 8, pan: 0.3 },
    harmony: { voice: 'sine', volume: 0.55, pattern: 'charleston', low: 55, size: 4, envelope: 'pluck', pan: -0.25 },
    bass: { voice: 'triangle', volume: 1, pattern: 'syncopated', low: 33 },
    drums: { pattern: 'boom', volume: 0.6 },
    swing: 0.06,
    echo: { steps: 3, feedback: 0.3 },
  },
  'neon-rush': {
    label: 'Neon Rush',
    lead: { voice: 'saw', volume: 0.85, vibrato: 10, echo: 0.15 },
    counter: { voice: 'pulse', volume: 0.45, pan: -0.35 },
    harmony: { voice: 'pulse', volume: 0.3, pattern: 'offbeat', low: 57, size: 3, pan: 0.3 },
    bass: { voice: 'triangle', volume: 1, pattern: 'offbeat', low: 36 },
    drums: { pattern: 'four', volume: 0.85 },
    echo: { steps: 3, feedback: 0.25 },
  },
  'lofi-loop': {
    label: 'Lo-Fi Loop',
    lead: { voice: 'sine', volume: 0.85, echo: 0.3 },
    counter: { voice: 'triangle', volume: 0.5, pan: 0.3 },
    harmony: { voice: 'sine', volume: 0.45, pattern: 'half-pad', low: 55, size: 4, envelope: 'swell', pan: -0.2 },
    bass: { voice: 'triangle', volume: 0.95, pattern: 'half', low: 33 },
    drums: { pattern: 'boom', volume: 0.5 },
    swing: 0.22,
    echo: { steps: 3, feedback: 0.35 },
  },
  'starlit-dream': {
    label: 'Starlit Dream',
    lead: { voice: 'sine', volume: 0.9, envelope: 'pluck', echo: 0.45 },
    counter: { voice: 'triangle', volume: 0.5, envelope: 'swell', pan: -0.3 },
    harmony: { voice: 'pulse12', volume: 0.25, pattern: 'arp-up', low: 60, size: 4, pan: 0.3, echo: 0.3 },
    bass: { voice: 'sine', volume: 0.7, pattern: 'whole', low: 36 },
    drums: null,
    echo: { steps: 3, feedback: 0.5 },
  },
  'credits-roll': {
    label: 'Credits Roll',
    lead: { voice: 'square', volume: 0.7, vibrato: 10, echo: 0.15 },
    counter: { voice: 'triangle', volume: 0.55, pan: 0.3 },
    harmony: { voice: 'sine', volume: 0.5, pattern: 'arp-updown', low: 55, size: 4, envelope: 'pluck', pan: -0.25 },
    bass: { voice: 'triangle', volume: 0.95, pattern: 'half', low: 36 },
    drums: { pattern: 'brush', volume: 0.4 },
    echo: { steps: 3, feedback: 0.3 },
  },
  'puzzle-pop': {
    label: 'Puzzle Pop',
    lead: { voice: 'pulse12', volume: 1 },
    counter: { voice: 'triangle', volume: 0.6, pan: -0.3 },
    harmony: { voice: 'square', volume: 0.3, pattern: 'offbeat', low: 57, size: 3, pan: 0.3 },
    bass: { voice: 'triangle', volume: 1, pattern: 'root-fifth', low: 36 },
    drums: { pattern: 'eight', volume: 0.6 },
  },
  'summer-festival': {
    label: 'Summer Festival',
    lead: { voice: 'sine', volume: 0.95, vibrato: 12 },
    counter: { voice: 'pulse12', volume: 0.45, envelope: 'pluck', pan: 0.3 },
    harmony: { voice: 'pulse12', volume: 0.35, pattern: 'broken', low: 57, size: 3, envelope: 'pluck', pan: -0.3 },
    bass: { voice: 'triangle', volume: 1, pattern: 'root-fifth', low: 36 },
    drums: { pattern: 'taiko', volume: 0.75 },
  },
  'star-fighter': {
    label: 'Star Fighter',
    lead: { voice: 'pulse', volume: 0.95, vibrato: 6 },
    counter: { voice: 'square', volume: 0.4, pan: -0.3 },
    harmony: { voice: 'pulse12', volume: 0.35, pattern: 'arp-up', low: 55, size: 3, pan: 0.3, echo: 0.2 },
    bass: { voice: 'triangle', volume: 1, pattern: 'pedal', low: 33 },
    drums: { pattern: 'eight', volume: 0.8 },
    echo: { steps: 2, feedback: 0.3 },
  },
  snowfall: {
    label: 'Snowfall',
    lead: { voice: 'sine', volume: 0.9, envelope: 'pluck', echo: 0.35 },
    counter: { voice: 'triangle', volume: 0.5, pan: 0.3 },
    harmony: { voice: 'triangle', volume: 0.45, pattern: 'broken', low: 55, size: 3, pan: -0.2 },
    bass: { voice: 'triangle', volume: 0.85, pattern: 'half', low: 36 },
    drums: { pattern: 'light', volume: 0.25 },
    echo: { steps: 3, feedback: 0.4 },
  },
} as const satisfies Readonly<Record<string, Style>>;

export type StyleId = keyof typeof STYLES;

export const styleOf = (id: StyleId): Style => STYLES[id];
