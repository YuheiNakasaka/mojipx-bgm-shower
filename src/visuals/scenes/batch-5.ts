import type { Scene } from '../scene.ts';
import { canalNeon } from './canal-neon.ts';
import { floatingTorii } from './floating-torii.ts';
import { fujiBulletTrain } from './fuji-bullet-train.ts';
import { scrambleCrossing } from './scramble-crossing.ts';
import { seasideRailway } from './seaside-railway.ts';
import { toriiTunnel } from './torii-tunnel.ts';

export const SCENE_BATCH_5: readonly Scene[] = [fujiBulletTrain, toriiTunnel, floatingTorii, seasideRailway, scrambleCrossing, canalNeon];
