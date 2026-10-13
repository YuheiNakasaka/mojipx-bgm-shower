import type { Scene } from '../scene.ts';
import { farmSeasons } from './farm-seasons.ts';
import { gemDuel } from './gem-duel.ts';
import { isoTown } from './iso-town.ts';
import { pierFishing } from './pier-fishing.ts';
import { pocketPet } from './pocket-pet.ts';
import { visualNovel } from './visual-novel.ts';

export const SCENE_BATCH_12: readonly Scene[] = [farmSeasons, visualNovel, pocketPet, pierFishing, gemDuel, isoTown];
