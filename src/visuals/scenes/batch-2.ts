import type { Scene } from '../scene.ts';
import { codeRain } from './code-rain.ts';
import { cornerCafe } from './corner-cafe.ts';
import { desertCaravan } from './desert-caravan.ts';
import { midnightSkyline } from './midnight-skyline.ts';
import { mountainDawn } from './mountain-dawn.ts';
import { rainyWindow } from './rainy-window.ts';
import { summerFireworks } from './summer-fireworks.ts';
import { torchlitHalls } from './torchlit-halls.ts';

export const SCENE_BATCH_2: readonly Scene[] = [
  midnightSkyline,
  rainyWindow,
  cornerCafe,
  summerFireworks,
  torchlitHalls,
  desertCaravan,
  codeRain,
  mountainDawn,
];
