// Styles: how a chord chart becomes a band. Every pattern is data for 4/4 and 3/4, written either in eighths
// (one token per eighth) or in sixteenths (twice as many tokens). The arranger stretches eighth patterns for songs
// written in sixteenths, and plays a song in sixteenths when one of its patterns needs them.
import type { Envelope, Voice } from 'mojipx';
import type { GenreId } from '../genre.ts';

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
  ballad: { 4: 'R - - - 5 - 8 -', 3: 'R - 5 - 8 -' },
  drive: { 4: 'R R R R R R R A', 3: 'R R R R R A' },
  groove: { 4: 'R . . R - . 5 A', 3: 'R . . R 5 A' },
  bossa: { 4: 'R - - 5 R - - 5', 3: 'R - - 5 8 -' },
  // sixteenths
  funk: { 4: 'R . . R . . 8 . R . R . 8 . 5 .', 3: 'R . . R . . 8 . 5 . 8 .' },
  roll: { 4: '. R R R . R R R . R R R . R R R', 3: '. R R R . R R R . R R R' },
  sequence: { 4: 'R R 8 R R 8 R 8 R R 8 R R 8 R 8', 3: 'R R 8 R R 8 R R 8 R 5 8' },
  disco: { 4: 'R . 8 R . R 8 . R . 8 R . R 8 A', 3: 'R . 8 R . R 8 . R . 8 A' },
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
  syncopate: { 4: 'C - - C - - C -', 3: 'C - - C - -' },
  stab: { 4: 'C . . C . . C .', 3: 'C . . C . .' },
  'arp-down': { 4: '4 3 2 1 4 3 2 1', 3: '4 3 2 1 2 3' },
  bossa: { 4: 'C . . C . C . .', 3: 'C . . C . C' },
  // sixteenths
  gate: { 4: 'C . C C . C C . C . C C . C C .', 3: 'C . C C . C C . C . C .' },
  arp16: { 4: '1 2 3 4 1 2 3 4 1 2 3 4 1 2 3 4', 3: '1 2 3 4 1 2 3 4 1 2 3 4' },
  sparkle: { 4: '1 2 3 4 3 2 1 2 1 2 3 4 3 2 1 2', 3: '1 2 3 4 3 2 1 2 3 4 3 2' },
  cut: { 4: 'C . . C . . C . . C . . C . C .', 3: 'C . . C . . C . . C . .' },
  wobble: { 4: 'C - C - C C C - C - C - C C C -', 3: 'C - C - C C C - C - C -' },
} as const satisfies Readonly<Record<string, MeterPatterns>>;

// ---- drums ----
// mojipx drum letters: k kick, s snare, h hat, H two hats, x kick+hat, z snare+hat, o open hat, t tom.
// Each pattern has one to three lines that play together; `fill` replaces `main` on a section's last bar.
// Lines are eighths (8 letters in 4/4) or sixteenths (16 letters).

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
  rock: { main: { 4: ['xhzhxxzh'], 3: ['xhzhxh'] }, fill: { 4: ['xhzhzztt'], 3: ['xhzztt'] } },
  robot: { main: { 4: ['xhzhxhzh', '.....t.t'], 3: ['xhzhxh', '.....t'] }, fill: { 4: ['xhzhtttt'], 3: ['xhtttt'] } },
  bossa: { main: { 4: ['xhhkxhhk', '...s..s.'], 3: ['xhhkxh', '...s..'] }, fill: { 4: ['xhhkxhhk', '...s.sss'], 3: ['xhhkxh', '...sss'] } },
  // sixteenths
  euro: {
    main: { 4: ['k...k...k...k...', '.hoh.hoh.hoh.hoh', '....s.......s...'], 3: ['k...k...k...', '.hoh.hoh.hoh', '....s.......'] },
    fill: { 4: ['k...k...k...k...', '.hoh.hoh.hoh.hoh', '....s...s.ssssss'], 3: ['k...k...k...', '.hoh.hoh.hoh', '....s.ssssss'] },
  },
  city: { main: { 4: ['x.h.z.hkx.h.z.hh'], 3: ['x.h.z.hkx.h.'] }, fill: { 4: ['x.h.z.hkx.z.zzzz'], 3: ['x.h.z.zzzzzz'] } },
  break: { main: { 4: ['x.h.z..x.xx.z.hz'], 3: ['x.h.z..x.xz.'] }, fill: { 4: ['x.h.z..x.xz.zzzz'], 3: ['x.h.z..zzzzz'] } },
  // Disco: four on the floor, sixteenth hats opening on the offbeats, a clap on two and four.
  disco: {
    main: { 4: ['k...k...k...k...', 'hhohhhohhhohhhoh', '....s.......s...'], 3: ['k...k...k...', 'hhohhhohhhoh', '....s.......'] },
    fill: { 4: ['k...k...k...k...', 'hhohhhohhhohhhoh', '....s...s.s.ssss'], 3: ['k...k...k...', 'hhohhhohhhoh', '....s.s.ssss'] },
  },
  // Half time with a pushed second kick, for the drop of a future-bass chorus.
  future: { main: { 4: ['x.h.h.hkz.h.h.hh'], 3: ['x.h.h.hkz.h.'] }, fill: { 4: ['x.h.h.hkz.z.zzzz'], 3: ['x.h.hkzzzzzz'] } },
  // Fast rock with sixteenth pushes on the kick and a tom run into each section.
  dash: { main: { 4: ['x.h.z.hxx.hxz.h.'], 3: ['x.h.z.hxz.h.'] }, fill: { 4: ['x.h.z.h.zzzztttt'], 3: ['x.h.zzzztttt'] } },
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

type Voiced = { readonly low: number; readonly size: 3 | 4 };

export type Style = {
  readonly label: string;
  readonly genre: GenreId;
  readonly lead: Instrument;
  /** A second lead voice that sections may switch the melody to (a brighter voice for a chorus, say). */
  readonly alt?: Instrument;
  readonly counter: Instrument;
  /** Chord accompaniment voiced from `low` (MIDI) upward with `size` notes. */
  readonly harmony: Instrument & Voiced & { readonly pattern: HarmonyPatternId };
  /** Sustained chords under the band, one per chord change, voiced like the harmony. Sections may turn it off. */
  readonly pad?: Instrument & Voiced;
  /** Bass with its lowest note at `low` (MIDI). */
  readonly bass: Instrument & { readonly pattern: BassPatternId; readonly low: number };
  readonly drums: { readonly pattern: DrumPatternId; readonly volume: number } | null;
  readonly swing?: number;
  readonly echo?: { readonly steps: number; readonly feedback: number };
};

export const STYLES = {
  'cozy-village': {
    label: 'Cozy Village',
    genre: 'folk',
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
    genre: 'folk',
    lead: { voice: 'pulse', volume: 0.85, vibrato: 8 },
    counter: { voice: 'triangle', volume: 0.6 },
    harmony: { voice: 'square', volume: 0.3, pattern: 'backbeat', low: 55, size: 3, pan: 0.25 },
    bass: { voice: 'triangle', volume: 0.95, pattern: 'half', low: 36 },
    drums: { pattern: 'waltz', volume: 0.4 },
  },
  'pixel-quest': {
    label: 'Pixel Quest',
    genre: 'rpg',
    lead: { voice: 'pulse', volume: 1 },
    counter: { voice: 'pulse12', volume: 0.55, pan: -0.25 },
    harmony: { voice: 'pulse12', volume: 0.4, pattern: 'arp-up', low: 55, size: 3, pan: 0.25 },
    bass: { voice: 'triangle', volume: 1, pattern: 'root-fifth', low: 36 },
    drums: { pattern: 'march', volume: 0.65 },
  },
  'deep-dungeon': {
    label: 'Deep Dungeon',
    genre: 'rpg',
    lead: { voice: 'square', volume: 0.7, echo: 0.35 },
    counter: { voice: 'pulse12', volume: 0.4, pan: 0.3, echo: 0.3 },
    harmony: { voice: 'triangle', volume: 0.55, pattern: 'arp-updown', low: 52, size: 3 },
    bass: { voice: 'triangle', volume: 0.9, pattern: 'half', low: 33 },
    drums: { pattern: 'half', volume: 0.45 },
    echo: { steps: 3, feedback: 0.45 },
  },
  'boss-rush': {
    label: 'Boss Rush',
    genre: 'arcade',
    lead: { voice: 'square', volume: 0.85, vibrato: 10 },
    counter: { voice: 'pulse', volume: 0.5, pan: 0.3 },
    harmony: { voice: 'pulse12', volume: 0.3, pattern: 'pulse', low: 52, size: 3, pan: -0.3 },
    bass: { voice: 'triangle', volume: 1, pattern: 'octave', low: 33 },
    drums: { pattern: 'gallop', volume: 0.8 },
  },
  'grand-field': {
    label: 'Grand Field',
    genre: 'rpg',
    lead: { voice: 'saw', volume: 0.85, vibrato: 14, echo: 0.15 },
    counter: { voice: 'square', volume: 0.45, vibrato: 8, pan: -0.3 },
    harmony: { voice: 'sine', volume: 0.5, pattern: 'arp-up', low: 55, size: 4, envelope: 'pluck', pan: 0.3, echo: 0.2 },
    bass: { voice: 'triangle', volume: 1, pattern: 'root-fifth', low: 36 },
    drums: { pattern: 'march', volume: 0.5 },
    echo: { steps: 2, feedback: 0.3 },
  },
  'nineties-pop': {
    label: 'Nineties Pop',
    genre: 'retro-pop',
    lead: { voice: 'saw', volume: 1.04, vibrato: 12, echo: 0.12 },
    counter: { voice: 'pulse', volume: 0.59, pan: 0.35 },
    harmony: { voice: 'square', volume: 0.42, pattern: 'backbeat', low: 57, size: 3, pan: -0.3 },
    bass: { voice: 'pulse', volume: 0.98, pattern: 'octave', low: 36 },
    drums: { pattern: 'push', volume: 1.04 },
    echo: { steps: 3, feedback: 0.25 },
  },
  'city-lights': {
    label: 'City Lights',
    genre: 'city-pop',
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
    genre: 'dance',
    lead: { voice: 'saw', volume: 0.85, vibrato: 10, echo: 0.15 },
    counter: { voice: 'pulse', volume: 0.45, pan: -0.35 },
    harmony: { voice: 'pulse', volume: 0.3, pattern: 'offbeat', low: 57, size: 3, pan: 0.3 },
    bass: { voice: 'triangle', volume: 1, pattern: 'offbeat', low: 36 },
    drums: { pattern: 'four', volume: 0.85 },
    echo: { steps: 3, feedback: 0.25 },
  },
  'lofi-loop': {
    label: 'Lo-Fi Loop',
    genre: 'chill',
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
    genre: 'chill',
    lead: { voice: 'sine', volume: 0.9, envelope: 'pluck', echo: 0.45 },
    counter: { voice: 'triangle', volume: 0.5, envelope: 'swell', pan: -0.3 },
    harmony: { voice: 'pulse12', volume: 0.25, pattern: 'arp-up', low: 60, size: 4, pan: 0.3, echo: 0.3 },
    bass: { voice: 'sine', volume: 0.7, pattern: 'whole', low: 36 },
    drums: null,
    echo: { steps: 3, feedback: 0.5 },
  },
  'credits-roll': {
    label: 'Credits Roll',
    genre: 'rpg',
    lead: { voice: 'square', volume: 0.7, vibrato: 10, echo: 0.15 },
    counter: { voice: 'triangle', volume: 0.55, pan: 0.3 },
    harmony: { voice: 'sine', volume: 0.5, pattern: 'arp-updown', low: 55, size: 4, envelope: 'pluck', pan: -0.25 },
    bass: { voice: 'triangle', volume: 0.95, pattern: 'half', low: 36 },
    drums: { pattern: 'brush', volume: 0.4 },
    echo: { steps: 3, feedback: 0.3 },
  },
  'puzzle-pop': {
    label: 'Puzzle Pop',
    genre: 'arcade',
    lead: { voice: 'pulse12', volume: 1 },
    counter: { voice: 'triangle', volume: 0.6, pan: -0.3 },
    harmony: { voice: 'square', volume: 0.3, pattern: 'offbeat', low: 57, size: 3, pan: 0.3 },
    bass: { voice: 'triangle', volume: 1, pattern: 'root-fifth', low: 36 },
    drums: { pattern: 'eight', volume: 0.6 },
  },
  'summer-festival': {
    label: 'Summer Festival',
    genre: 'folk',
    lead: { voice: 'sine', volume: 0.95, vibrato: 12 },
    counter: { voice: 'pulse12', volume: 0.45, envelope: 'pluck', pan: 0.3 },
    harmony: { voice: 'pulse12', volume: 0.35, pattern: 'broken', low: 57, size: 3, envelope: 'pluck', pan: -0.3 },
    bass: { voice: 'triangle', volume: 1, pattern: 'root-fifth', low: 36 },
    drums: { pattern: 'taiko', volume: 0.75 },
  },
  'star-fighter': {
    label: 'Star Fighter',
    genre: 'arcade',
    lead: { voice: 'pulse', volume: 0.95, vibrato: 6 },
    counter: { voice: 'square', volume: 0.4, pan: -0.3 },
    harmony: { voice: 'pulse12', volume: 0.35, pattern: 'arp-up', low: 55, size: 3, pan: 0.3, echo: 0.2 },
    bass: { voice: 'triangle', volume: 1, pattern: 'pedal', low: 33 },
    drums: { pattern: 'eight', volume: 0.8 },
    echo: { steps: 2, feedback: 0.3 },
  },
  snowfall: {
    label: 'Snowfall',
    genre: 'chill',
    lead: { voice: 'sine', volume: 0.9, envelope: 'pluck', echo: 0.35 },
    counter: { voice: 'triangle', volume: 0.5, pan: 0.3 },
    harmony: { voice: 'triangle', volume: 0.45, pattern: 'broken', low: 55, size: 3, pan: -0.2 },
    bass: { voice: 'triangle', volume: 0.85, pattern: 'half', low: 36 },
    drums: { pattern: 'light', volume: 0.25 },
    echo: { steps: 3, feedback: 0.4 },
  },
  // City pop: a sixteenth-note groove, electric-piano cutting, a syncopated bass and a string pad.
  'city-groove': {
    label: 'City Groove',
    genre: 'city-pop',
    lead: { voice: 'pulse', volume: 0.85, vibrato: 8, echo: 0.2 },
    alt: { voice: 'saw', volume: 0.7, vibrato: 12, echo: 0.2 },
    counter: { voice: 'saw', volume: 0.35, pan: 0.35 },
    harmony: { voice: 'sine', volume: 0.5, pattern: 'cut', low: 55, size: 4, envelope: 'pluck', pan: -0.3 },
    pad: { voice: 'triangle', volume: 0.3, low: 55, size: 4, envelope: 'swell', pan: 0.2 },
    bass: { voice: 'triangle', volume: 1, pattern: 'funk', low: 33 },
    drums: { pattern: 'city', volume: 0.6 },
    echo: { steps: 3, feedback: 0.3 },
  },
  'bossa-cafe': {
    label: 'Bossa Cafe',
    genre: 'city-pop',
    lead: { voice: 'sine', volume: 0.9, vibrato: 6, echo: 0.2 },
    alt: { voice: 'pulse12', volume: 0.8, vibrato: 6, echo: 0.2 },
    counter: { voice: 'triangle', volume: 0.5, pan: -0.3 },
    harmony: { voice: 'pulse12', volume: 0.35, pattern: 'bossa', low: 55, size: 4, envelope: 'pluck', pan: 0.3 },
    bass: { voice: 'triangle', volume: 0.95, pattern: 'bossa', low: 33 },
    drums: { pattern: 'bossa', volume: 0.45 },
    swing: 0.08,
    echo: { steps: 3, feedback: 0.3 },
  },
  // Techno pop: a sixteenth-note sequencer bass and arpeggio, robotic drums and a straight square lead.
  technopop: {
    label: 'Techno Pop',
    genre: 'dance',
    lead: { voice: 'square', volume: 1.04 },
    alt: { voice: 'pulse12', volume: 1.23, echo: 0.25 },
    counter: { voice: 'pulse', volume: 0.59, envelope: 'pluck', pan: -0.35 },
    harmony: { voice: 'pulse12', volume: 0.39, pattern: 'sparkle', low: 60, size: 4, envelope: 'pluck', pan: 0.35, echo: 0.2 },
    bass: { voice: 'pulse', volume: 0.91, pattern: 'sequence', low: 36, envelope: 'pluck' },
    drums: { pattern: 'robot', volume: 0.91 },
    echo: { steps: 3, feedback: 0.3 },
  },
  // Nineties dance pop: four on the floor with open hats, an octave bass, a gated chord and a synth-brass riff.
  eurobeat: {
    label: 'Eurobeat',
    genre: 'dance',
    lead: { voice: 'saw', volume: 0.8, vibrato: 10, echo: 0.15 },
    alt: { voice: 'square', volume: 0.75, vibrato: 12, echo: 0.2 },
    counter: { voice: 'square', volume: 0.4, pan: 0.35 },
    harmony: { voice: 'pulse', volume: 0.28, pattern: 'gate', low: 57, size: 3, pan: -0.3 },
    bass: { voice: 'triangle', volume: 1, pattern: 'octave', low: 36 },
    drums: { pattern: 'euro', volume: 0.85 },
    echo: { steps: 3, feedback: 0.25 },
  },
  'trance-pop': {
    label: 'Trance Pop',
    genre: 'dance',
    lead: { voice: 'saw', volume: 0.8, vibrato: 8, echo: 0.25 },
    alt: { voice: 'pulse12', volume: 0.9, vibrato: 8, echo: 0.3 },
    counter: { voice: 'sine', volume: 0.5, envelope: 'pluck', pan: 0.3, echo: 0.3 },
    harmony: { voice: 'saw', volume: 0.22, pattern: 'gate', low: 57, size: 3, pan: -0.3 },
    pad: { voice: 'sine', volume: 0.35, low: 52, size: 4, envelope: 'swell', pan: 0.2 },
    bass: { voice: 'triangle', volume: 1, pattern: 'roll', low: 33 },
    drums: { pattern: 'four', volume: 0.85 },
    echo: { steps: 3, feedback: 0.35 },
  },
  // A guitar band of the early nineties: eighth-note chord strokes, a driving bass, an eight-beat kit.
  'band-rock': {
    label: 'Band Rock',
    genre: 'retro-pop',
    lead: { voice: 'pulse', volume: 0.85, vibrato: 10 },
    alt: { voice: 'saw', volume: 0.75, vibrato: 14, echo: 0.12 },
    counter: { voice: 'square', volume: 0.4, pan: -0.3 },
    harmony: { voice: 'pulse12', volume: 0.32, pattern: 'pulse', low: 52, size: 3, pan: 0.3 },
    pad: { voice: 'sine', volume: 0.3, low: 60, size: 3, envelope: 'swell', pan: -0.2 },
    bass: { voice: 'triangle', volume: 1, pattern: 'drive', low: 36 },
    drums: { pattern: 'rock', volume: 0.8 },
  },
  'showa-ballad': {
    label: 'Showa Ballad',
    genre: 'retro-pop',
    lead: { voice: 'square', volume: 0.7, vibrato: 16, echo: 0.2 },
    alt: { voice: 'saw', volume: 0.65, vibrato: 18, echo: 0.2 },
    counter: { voice: 'triangle', volume: 0.55, pan: 0.3 },
    harmony: { voice: 'sine', volume: 0.5, pattern: 'arp-updown', low: 55, size: 4, envelope: 'pluck', pan: -0.25 },
    pad: { voice: 'triangle', volume: 0.35, low: 55, size: 3, envelope: 'swell', pan: 0.25 },
    bass: { voice: 'triangle', volume: 0.95, pattern: 'ballad', low: 33 },
    drums: { pattern: 'brush', volume: 0.35 },
    echo: { steps: 3, feedback: 0.35 },
  },
  // Eighties fusion as racing games heard it: electric-piano stabs, a slap-like bass and a singing lead.
  'fusion-drive': {
    label: 'Fusion Drive',
    genre: 'city-pop',
    lead: { voice: 'saw', volume: 0.8, vibrato: 12, echo: 0.12 },
    alt: { voice: 'square', volume: 0.8, vibrato: 10, echo: 0.15 },
    counter: { voice: 'pulse', volume: 0.4, pan: 0.3 },
    harmony: { voice: 'sine', volume: 0.5, pattern: 'stab', low: 55, size: 4, envelope: 'pluck', pan: -0.3 },
    pad: { voice: 'triangle', volume: 0.3, low: 55, size: 4, envelope: 'swell', pan: 0.25 },
    bass: { voice: 'triangle', volume: 1, pattern: 'funk', low: 33 },
    drums: { pattern: 'city', volume: 0.7 },
    echo: { steps: 3, feedback: 0.25 },
  },
  // Sixteen-bit stage funk: a plucked saw bass that slaps, cutting chords and a breakbeat.
  'fm-funk': {
    label: '16-Bit Funk',
    genre: 'arcade',
    lead: { voice: 'square', volume: 0.98, vibrato: 6 },
    alt: { voice: 'saw', volume: 0.91, vibrato: 10, echo: 0.15 },
    counter: { voice: 'pulse12', volume: 0.59, envelope: 'pluck', pan: 0.3 },
    harmony: { voice: 'pulse', volume: 0.39, pattern: 'cut', low: 57, size: 3, envelope: 'pluck', pan: -0.3 },
    bass: { voice: 'saw', volume: 0.78, pattern: 'funk', low: 36, envelope: 'pluck' },
    drums: { pattern: 'break', volume: 0.91 },
    echo: { steps: 3, feedback: 0.2 },
  },
  // Late-nineties drum and bass: fast breaks under slow, wide chords and a sub bass.
  'jungle-run': {
    label: 'Jungle Run',
    genre: 'dance',
    lead: { voice: 'sine', volume: 0.85, vibrato: 8, echo: 0.35 },
    alt: { voice: 'pulse12', volume: 0.75, vibrato: 8, echo: 0.3 },
    counter: { voice: 'triangle', volume: 0.5, pan: -0.3 },
    harmony: { voice: 'pulse12', volume: 0.22, pattern: 'sparkle', low: 60, size: 4, envelope: 'pluck', pan: 0.3, echo: 0.3 },
    pad: { voice: 'triangle', volume: 0.35, low: 52, size: 4, envelope: 'swell', pan: -0.2 },
    bass: { voice: 'sine', volume: 0.95, pattern: 'half', low: 33 },
    drums: { pattern: 'break', volume: 0.75 },
    echo: { steps: 6, feedback: 0.35 },
  },
  'celtic-isle': {
    label: 'Celtic Isle',
    genre: 'folk',
    lead: { voice: 'sine', volume: 0.95, vibrato: 10, echo: 0.15 },
    alt: { voice: 'pulse12', volume: 0.85, vibrato: 8, echo: 0.15 },
    counter: { voice: 'triangle', volume: 0.55, pan: -0.3 },
    harmony: { voice: 'pulse12', volume: 0.32, pattern: 'broken', low: 55, size: 3, envelope: 'pluck', pan: 0.3 },
    bass: { voice: 'triangle', volume: 0.95, pattern: 'root-fifth', low: 36 },
    drums: { pattern: 'light', volume: 0.35 },
    echo: { steps: 3, feedback: 0.25 },
  },
  'island-breeze': {
    label: 'Island Breeze',
    genre: 'folk',
    lead: { voice: 'pulse12', volume: 0.9, envelope: 'pluck', echo: 0.2 },
    alt: { voice: 'sine', volume: 0.9, vibrato: 12, echo: 0.2 },
    counter: { voice: 'sine', volume: 0.45, envelope: 'pluck', pan: 0.3 },
    harmony: { voice: 'square', volume: 0.25, pattern: 'skank', low: 57, size: 3, envelope: 'pluck', pan: -0.3 },
    bass: { voice: 'triangle', volume: 0.95, pattern: 'root-fifth', low: 36 },
    drums: { pattern: 'light', volume: 0.45 },
    swing: 0.2,
    echo: { steps: 3, feedback: 0.25 },
  },
  // Turn-of-the-millennium idol disco: four on the floor, a hopping octave bass, guitar cutting, strings answering
  // the singer, and a minor-key melody sung with a Showa singer's vibrato over the dance floor.
  'idol-disco': {
    label: 'Idol Disco',
    genre: 'idol',
    lead: { voice: 'square', volume: 0.85, vibrato: 12, echo: 0.12 },
    alt: { voice: 'saw', volume: 0.75, vibrato: 14, echo: 0.15 },
    counter: { voice: 'saw', volume: 0.38, vibrato: 6, pan: 0.3 },
    harmony: { voice: 'pulse', volume: 0.3, pattern: 'cut', low: 57, size: 3, envelope: 'pluck', pan: -0.3 },
    pad: { voice: 'triangle', volume: 0.3, low: 55, size: 4, envelope: 'swell', pan: 0.2 },
    bass: { voice: 'triangle', volume: 1, pattern: 'disco', low: 33 },
    drums: { pattern: 'disco', volume: 0.85 },
    echo: { steps: 3, feedback: 0.25 },
  },
  // Kawaii idol pop of the 2020s: sparkling bells, gated supersaw chords, four on the floor that drops to a
  // half-time future-bass chorus, and a bright, high, sing-along hook.
  'kawaii-pop': {
    label: 'Kawaii Pop',
    genre: 'idol',
    lead: { voice: 'pulse12', volume: 0.95, vibrato: 6, echo: 0.15 },
    alt: { voice: 'square', volume: 0.85, vibrato: 8, echo: 0.2 },
    counter: { voice: 'sine', volume: 0.5, envelope: 'pluck', pan: 0.3, echo: 0.3 },
    harmony: { voice: 'saw', volume: 0.22, pattern: 'gate', low: 57, size: 4, pan: -0.25 },
    pad: { voice: 'sine', volume: 0.32, low: 52, size: 4, envelope: 'swell', pan: 0.2 },
    bass: { voice: 'triangle', volume: 1, pattern: 'offbeat', low: 33 },
    drums: { pattern: 'four', volume: 0.85 },
    echo: { steps: 3, feedback: 0.3 },
  },
  // Vocal-synth rock: a machine singer fast and high over sixteenth-note piano, a wall of guitar and a driving kit.
  'vocal-rock': {
    label: 'Vocal Synth Rock',
    genre: 'vocal-synth',
    lead: { voice: 'square', volume: 0.85, vibrato: 5, echo: 0.1 },
    alt: { voice: 'saw', volume: 0.75, vibrato: 8, echo: 0.15 },
    counter: { voice: 'pulse12', volume: 0.45, envelope: 'pluck', pan: 0.3 },
    harmony: { voice: 'pulse12', volume: 0.3, pattern: 'arp16', low: 55, size: 4, envelope: 'pluck', pan: -0.3 },
    pad: { voice: 'saw', volume: 0.2, low: 52, size: 3, envelope: 'swell', pan: 0.25 },
    bass: { voice: 'triangle', volume: 1, pattern: 'drive', low: 33 },
    drums: { pattern: 'dash', volume: 0.85 },
  },
  // Vocal-synth electro pop: a straight, bright machine voice over a sixteenth bass, gated chords and four on the floor.
  'vocal-electro': {
    label: 'Vocal Synth Electro',
    genre: 'vocal-synth',
    lead: { voice: 'pulse', volume: 0.95, echo: 0.15 },
    alt: { voice: 'square', volume: 0.9, echo: 0.2 },
    counter: { voice: 'pulse12', volume: 0.45, envelope: 'pluck', pan: -0.3, echo: 0.25 },
    harmony: { voice: 'saw', volume: 0.22, pattern: 'gate', low: 57, size: 3, pan: 0.3 },
    pad: { voice: 'sine', volume: 0.3, low: 52, size: 4, envelope: 'swell', pan: -0.2 },
    bass: { voice: 'pulse', volume: 0.9, pattern: 'sequence', low: 36, envelope: 'pluck' },
    drums: { pattern: 'euro', volume: 0.85 },
    echo: { steps: 3, feedback: 0.3 },
  },
} as const satisfies Readonly<Record<string, Style>>;

export type StyleId = keyof typeof STYLES;

export const styleOf = (id: StyleId): Style => STYLES[id];
