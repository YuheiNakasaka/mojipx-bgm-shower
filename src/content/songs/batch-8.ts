import type { SongDef } from '../../domain/music/song.ts';
import { circuitGarden } from './circuit-garden.ts';
import { dawnOverTheBay } from './dawn-over-the-bay.ts';
import { midnightLaser } from './midnight-laser.ts';
import { pocketRobot } from './pocket-robot.ts';
import { satelliteParade } from './satellite-parade.ts';
import { starDancer } from './star-dancer.ts';

export const BATCH_8: readonly SongDef[] = [pocketRobot, satelliteParade, circuitGarden, midnightLaser, starDancer, dawnOverTheBay];
