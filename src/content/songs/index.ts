import type { SongDef } from '../../domain/music/song.ts';
import { BATCH_1 } from './batch-1.ts';
import { BATCH_2 } from './batch-2.ts';
import { BATCH_3 } from './batch-3.ts';
import { BATCH_4 } from './batch-4.ts';
import { BATCH_5 } from './batch-5.ts';
import { BATCH_6 } from './batch-6.ts';
import { BATCH_7 } from './batch-7.ts';
import { BATCH_8 } from './batch-8.ts';
import { BATCH_9 } from './batch-9.ts';
import { BATCH_10 } from './batch-10.ts';
import { BATCH_11 } from './batch-11.ts';
import { BATCH_12 } from './batch-12.ts';
import { BATCH_13 } from './batch-13.ts';
import { BATCH_14 } from './batch-14.ts';
import { BATCH_15 } from './batch-15.ts';
import { BATCH_16 } from './batch-16.ts';
import { BATCH_17 } from './batch-17.ts';
import { BATCH_18 } from './batch-18.ts';
import { BATCH_19 } from './batch-19.ts';
import { BATCH_20 } from './batch-20.ts';
import { neonHighway } from './neon-highway.ts';
import { sundayBakery } from './sunday-bakery.ts';
import { tailLights } from './tail-lights.ts';

export const SONGS: readonly SongDef[] = [
  sundayBakery,
  neonHighway,
  tailLights,
  ...BATCH_1,
  ...BATCH_2,
  ...BATCH_3,
  ...BATCH_4,
  ...BATCH_5,
  ...BATCH_6,
  ...BATCH_7,
  ...BATCH_8,
  ...BATCH_9,
  ...BATCH_10,
  ...BATCH_11,
  ...BATCH_12,
  ...BATCH_13,
  ...BATCH_14,
  ...BATCH_15,
  ...BATCH_16,
  ...BATCH_17,
  ...BATCH_18,
  ...BATCH_19,
  ...BATCH_20,
];
