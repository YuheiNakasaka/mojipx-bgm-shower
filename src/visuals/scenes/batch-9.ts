import type { Scene } from '../scene.ts';
import { gasshoSnow } from './gassho-snow.ts';
import { kiyomizuAutumn } from './kiyomizu-autumn.ts';
import { naraDeer } from './nara-deer.ts';
import { okinawaShore } from './okinawa-shore.ts';
import { otaruCanal } from './otaru-canal.ts';
import { towerNight } from './tower-night.ts';

export const SCENE_BATCH_9: readonly Scene[] = [kiyomizuAutumn, gasshoSnow, otaruCanal, okinawaShore, naraDeer, towerNight];
