import type { SongDef } from '../../domain/music/song.ts';
import { blueSkyPromise } from './blue-sky-promise.ts';
import { crimsonResolve } from './crimson-resolve.ts';
import { distantStarlight } from './distant-starlight.ts';
import { hometownStation } from './hometown-station.ts';
import { redLanternStreet } from './red-lantern-street.ts';
import { runningThroughSummer } from './running-through-summer.ts';

export const BATCH_9: readonly SongDef[] = [
  runningThroughSummer,
  blueSkyPromise,
  crimsonResolve,
  redLanternStreet,
  distantStarlight,
  hometownStation,
];
