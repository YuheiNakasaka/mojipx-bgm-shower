import type { Scene } from '../scene.ts';
import { SCENE_BATCH_1 } from './batch-1.ts';
import { SCENE_BATCH_2 } from './batch-2.ts';
import { SCENE_BATCH_3 } from './batch-3.ts';
import { SCENE_BATCH_4 } from './batch-4.ts';
import { SCENE_BATCH_5 } from './batch-5.ts';
import { SCENE_BATCH_6 } from './batch-6.ts';
import { SCENE_BATCH_7 } from './batch-7.ts';
import { SCENE_BATCH_8 } from './batch-8.ts';
import { SCENE_BATCH_9 } from './batch-9.ts';
import { SCENE_BATCH_10 } from './batch-10.ts';
import { SCENE_BATCH_11 } from './batch-11.ts';
import { SCENE_BATCH_12 } from './batch-12.ts';
import { sunsetGrid } from './sunset-grid.ts';
import { warpStars } from './warp-stars.ts';

export const SCENES: readonly Scene[] = [
  sunsetGrid,
  warpStars,
  ...SCENE_BATCH_1,
  ...SCENE_BATCH_2,
  ...SCENE_BATCH_3,
  ...SCENE_BATCH_4,
  ...SCENE_BATCH_5,
  ...SCENE_BATCH_6,
  ...SCENE_BATCH_7,
  ...SCENE_BATCH_8,
  ...SCENE_BATCH_9,
  ...SCENE_BATCH_10,
  ...SCENE_BATCH_11,
  ...SCENE_BATCH_12,
];
