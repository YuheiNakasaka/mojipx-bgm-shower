import type { SongDef } from '../../domain/music/song.ts';
import { afterSchool } from './after-school.ts';
import { crownOfClouds } from './crown-of-clouds.ts';
import { firstDawn } from './first-dawn.ts';
import { lastBastion } from './last-bastion.ts';
import { meadowMarch } from './meadow-march.ts';
import { ridgelineWind } from './ridgeline-wind.ts';
import { skywardBanner } from './skyward-banner.ts';

export const BATCH_1: readonly SongDef[] = [skywardBanner, firstDawn, ridgelineWind, crownOfClouds, meadowMarch, lastBastion, afterSchool];
