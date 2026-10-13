import type { Scene } from '../scene.ts';
import { londonRain } from './london-rain.ts';
import { manhattanNight } from './manhattan-night.ts';
import { parisDusk } from './paris-dusk.ts';
import { saltMirror } from './salt-mirror.ts';
import { santoriniSunset } from './santorini-sunset.ts';
import { veniceGondola } from './venice-gondola.ts';

export const SCENE_BATCH_6: readonly Scene[] = [parisDusk, manhattanNight, londonRain, veniceGondola, santoriniSunset, saltMirror];
