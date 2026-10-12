import type { Scene } from '../scene.ts';
import { sunsetGrid } from './sunset-grid.ts';
import { warpStars } from './warp-stars.ts';

export const SCENES: readonly Scene[] = [sunsetGrid, warpStars];
