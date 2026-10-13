import type { SongDef } from '../../domain/music/song.ts';
import { duelAtDusk } from './duel-at-dusk.ts';
import { finalLapSunset } from './final-lap-sunset.ts';
import { mirageCircuit } from './mirage-circuit.ts';
import { neonSewerRun } from './neon-sewer-run.ts';
import { stageOneFunk } from './stage-one-funk.ts';
import { twinStarSquadron } from './twin-star-squadron.ts';

export const BATCH_11: readonly SongDef[] = [finalLapSunset, mirageCircuit, stageOneFunk, neonSewerRun, duelAtDusk, twinStarSquadron];
