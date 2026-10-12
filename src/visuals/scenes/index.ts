import type { Scene } from '../scene.ts';
import { SCENE_BATCH_1 } from './batch-1.ts';
import { SCENE_BATCH_2 } from './batch-2.ts';
import { SCENE_BATCH_3 } from './batch-3.ts';
import { sunsetGrid } from './sunset-grid.ts';
import { warpStars } from './warp-stars.ts';

export const SCENES: readonly Scene[] = [sunsetGrid, warpStars, ...SCENE_BATCH_1, ...SCENE_BATCH_2, ...SCENE_BATCH_3];
