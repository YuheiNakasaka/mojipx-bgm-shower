import type { SongDef } from '../../domain/music/song.ts';
import { fireworksAfterRain } from './fireworks-after-rain.ts';
import { foreverSummerSignal } from './forever-summer-signal.ts';
import { shorelinePromise } from './shoreline-promise.ts';

export const BATCH_16: readonly SongDef[] = [fireworksAfterRain, shorelinePromise, foreverSummerSignal];
