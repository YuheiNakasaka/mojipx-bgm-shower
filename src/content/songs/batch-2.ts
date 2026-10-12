import type { SongDef } from '../../domain/music/song.ts';
import { clockworkDuel } from './clockwork-duel.ts';
import { hullBreach } from './hull-breach.ts';
import { ironCitadel } from './iron-citadel.ts';
import { rooftopRave } from './rooftop-rave.ts';
import { shadowChase } from './shadow-chase.ts';
import { starboardRun } from './starboard-run.ts';
import { turboCandy } from './turbo-candy.ts';

export const BATCH_2: readonly SongDef[] = [ironCitadel, hullBreach, clockworkDuel, shadowChase, starboardRun, rooftopRave, turboCandy];
