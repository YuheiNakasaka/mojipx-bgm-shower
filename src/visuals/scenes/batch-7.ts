import type { Scene } from '../scene.ts';
import { bathhouseFuji } from './bathhouse-fuji.ts';
import { goldfishRide } from './goldfish-ride.ts';
import { konbiniDj } from './konbini-dj.ts';
import { mechaIcecream } from './mecha-icecream.ts';
import { moonFishing } from './moon-fishing.ts';
import { shrineSynth } from './shrine-synth.ts';

export const SCENE_BATCH_7: readonly Scene[] = [goldfishRide, konbiniDj, shrineSynth, mechaIcecream, moonFishing, bathhouseFuji];
