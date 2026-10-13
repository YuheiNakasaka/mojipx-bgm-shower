import type { SongDef } from '../../domain/music/song.ts';
import { coastlineDrive } from './coastline-drive.ts';
import { lastOrder } from './last-order.ts';
import { lemonSodaSky } from './lemon-soda-sky.ts';
import { poolsideMirrorball } from './poolside-mirrorball.ts';
import { taxiAtMidnight } from './taxi-at-midnight.ts';
import { velvetSkyline } from './velvet-skyline.ts';

export const BATCH_7: readonly SongDef[] = [coastlineDrive, velvetSkyline, poolsideMirrorball, taxiAtMidnight, lastOrder, lemonSodaSky];
