import type { Scene } from '../scene.ts';
import { auroraPeaks } from './aurora-peaks.ts';
import { campfireNight } from './campfire-night.ts';
import { deepAquarium } from './deep-aquarium.ts';
import { fireflyForest } from './firefly-forest.ts';
import { oceanSunset } from './ocean-sunset.ts';
import { petalRiver } from './petal-river.ts';
import { snowyCabin } from './snowy-cabin.ts';
import { villageMorning } from './village-morning.ts';

export const SCENE_BATCH_1: readonly Scene[] = [
  villageMorning,
  fireflyForest,
  snowyCabin,
  oceanSunset,
  petalRiver,
  deepAquarium,
  campfireNight,
  auroraPeaks,
];
