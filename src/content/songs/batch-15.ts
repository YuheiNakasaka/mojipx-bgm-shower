import type { SongDef } from '../../domain/music/song.ts';
import { auroraWish } from './aurora-wish.ts';
import { carouselAtDusk } from './carousel-at-dusk.ts';
import { cloverHillReel } from './clover-hill-reel.ts';
import { hearthsideInn } from './hearthside-inn.ts';
import { partingEmbers } from './parting-embers.ts';

export const BATCH_15: readonly SongDef[] = [hearthsideInn, cloverHillReel, partingEmbers, carouselAtDusk, auroraWish];
