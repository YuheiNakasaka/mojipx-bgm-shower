import type { SongDef } from '../../domain/music/song.ts';
import { farLighthouse } from './far-lighthouse.ts';
import { puddleLights } from './puddle-lights.ts';
import { sunbeamClassroom } from './sunbeam-classroom.ts';
import { underTheAwning } from './under-the-awning.ts';
import { windowTable } from './window-table.ts';

export const BATCH_13: readonly SongDef[] = [windowTable, underTheAwning, puddleLights, sunbeamClassroom, farLighthouse];
