import type { SongDef } from '../../domain/music/song.ts';
import { BATCH_1 } from './batch-1.ts';
import { BATCH_2 } from './batch-2.ts';
import { BATCH_3 } from './batch-3.ts';
import { BATCH_4 } from './batch-4.ts';
import { BATCH_5 } from './batch-5.ts';
import { BATCH_6 } from './batch-6.ts';
import { neonHighway } from './neon-highway.ts';
import { sundayBakery } from './sunday-bakery.ts';

export const SONGS: readonly SongDef[] = [
  sundayBakery,
  neonHighway,
  ...BATCH_1,
  ...BATCH_2,
  ...BATCH_3,
  ...BATCH_4,
  ...BATCH_5,
  ...BATCH_6,
];
