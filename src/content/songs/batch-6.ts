import type { SongDef } from '../../domain/music/song.ts';
import { acornPostOffice } from './acorn-post-office.ts';
import { bouncyBlocks } from './bouncy-blocks.ts';
import { nightBusHome } from './night-bus-home.ts';
import { paperLanterns } from './paper-lanterns.ts';
import { sunlitLane } from './sunlit-lane.ts';
import { teacupWaltz } from './teacup-waltz.ts';
import { windowSeatWaltz } from './window-seat-waltz.ts';
import { winterPlatform } from './winter-platform.ts';

export const BATCH_6: readonly SongDef[] = [
  acornPostOffice,
  windowSeatWaltz,
  teacupWaltz,
  paperLanterns,
  winterPlatform,
  bouncyBlocks,
  sunlitLane,
  nightBusHome,
];
