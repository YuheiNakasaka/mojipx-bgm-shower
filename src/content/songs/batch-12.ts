import type { SongDef } from '../../domain/music/song.ts';
import { constellationDiary } from './constellation-diary.ts';
import { coralLullaby } from './coral-lullaby.ts';
import { hibiscusLetter } from './hibiscus-letter.ts';
import { islandFestivalNight } from './island-festival-night.ts';
import { lastTrainFirstSnow } from './last-train-first-snow.ts';
import { snowGlobeTown } from './snow-globe-town.ts';

export const BATCH_12: readonly SongDef[] = [
  coralLullaby,
  islandFestivalNight,
  hibiscusLetter,
  snowGlobeTown,
  lastTrainFirstSnow,
  constellationDiary,
];
