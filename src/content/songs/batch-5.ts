import type { SongDef } from '../../domain/music/song.ts';
import { cocoaByTheFire } from './cocoa-by-the-fire.ts';
import { driftingCanal } from './drifting-canal.ts';
import { emptyPlayground } from './empty-playground.ts';
import { gardenHammock } from './garden-hammock.ts';
import { midnightLaundromat } from './midnight-laundromat.ts';
import { rainOnGlass } from './rain-on-glass.ts';
import { slowClouds } from './slow-clouds.ts';

export const BATCH_5: readonly SongDef[] = [
  rainOnGlass,
  emptyPlayground,
  midnightLaundromat,
  slowClouds,
  driftingCanal,
  cocoaByTheFire,
  gardenHammock,
];
