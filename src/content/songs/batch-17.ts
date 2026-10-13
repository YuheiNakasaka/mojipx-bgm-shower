import type { SongDef } from '../../domain/music/song.ts';
import { brokenMetronome } from './broken-metronome.ts';
import { encoreForNoOne } from './encore-for-no-one.ts';
import { ironLotus } from './iron-lotus.ts';
import { redlineHysteria } from './redline-hysteria.ts';
import { sunsetRewind } from './sunset-rewind.ts';

export const BATCH_17: readonly SongDef[] = [brokenMetronome, ironLotus, sunsetRewind, redlineHysteria, encoreForNoOne];
