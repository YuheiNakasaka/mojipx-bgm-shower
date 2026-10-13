import type { Scene } from '../scene.ts';
import { bulletCurtain } from './bullet-curtain.ts';
import { coinRun } from './coin-run.ts';
import { gameCenter } from './game-center.ts';
import { horizonDrive } from './horizon-drive.ts';
import { rhythmLanes } from './rhythm-lanes.ts';
import { versusStage } from './versus-stage.ts';

export const SCENE_BATCH_8: readonly Scene[] = [bulletCurtain, horizonDrive, versusStage, coinRun, rhythmLanes, gameCenter];
