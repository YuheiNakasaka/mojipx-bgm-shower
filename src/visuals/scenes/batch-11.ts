import type { Scene } from '../scene.ts';
import { catTrain } from './cat-train.ts';
import { jellyfishLighthouse } from './jellyfish-lighthouse.ts';
import { kotatsuOrbit } from './kotatsu-orbit.ts';
import { octopusBand } from './octopus-band.ts';
import { ramenWitch } from './ramen-witch.ts';
import { skyWhale } from './sky-whale.ts';

export const SCENE_BATCH_11: readonly Scene[] = [kotatsuOrbit, jellyfishLighthouse, ramenWitch, skyWhale, octopusBand, catTrain];
