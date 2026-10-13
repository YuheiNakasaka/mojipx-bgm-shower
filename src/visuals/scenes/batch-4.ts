import type { Scene } from '../scene.ts';
import { dungeonCrawl } from './dungeon-crawl.ts';
import { overworldVoyage } from './overworld-voyage.ts';
import { tacticsGrid } from './tactics-grid.ts';
import { tallGrass } from './tall-grass.ts';
import { titleScreen } from './title-screen.ts';
import { turnBattle } from './turn-battle.ts';

export const SCENE_BATCH_4: readonly Scene[] = [overworldVoyage, turnBattle, titleScreen, tacticsGrid, dungeonCrawl, tallGrass];
