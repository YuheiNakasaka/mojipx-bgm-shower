import type { SongDef } from '../../domain/music/song.ts';
import { cassetteSunset } from './cassette-sunset.ts';
import { docksideGlow } from './dockside-glow.ts';
import { fireworkDash } from './firework-dash.ts';
import { neonAlley } from './neon-alley.ts';
import { snapshotSummer } from './snapshot-summer.ts';
import { sparkleParade } from './sparkle-parade.ts';
import { summerNightFair } from './summer-night-fair.ts';

export const BATCH_3: readonly SongDef[] = [
  sparkleParade,
  snapshotSummer,
  cassetteSunset,
  neonAlley,
  docksideGlow,
  fireworkDash,
  summerNightFair,
];
