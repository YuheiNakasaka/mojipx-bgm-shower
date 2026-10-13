import type { Scene } from '../scene.ts';
import { greatWall } from './great-wall.ts';
import { harbourJunk } from './harbour-junk.ts';
import { machuPicchu } from './machu-picchu.ts';
import { moaiSky } from './moai-sky.ts';
import { pyramidStars } from './pyramid-stars.ts';
import { tajReflection } from './taj-reflection.ts';

export const SCENE_BATCH_10: readonly Scene[] = [pyramidStars, machuPicchu, harbourJunk, tajReflection, greatWall, moaiSky];
