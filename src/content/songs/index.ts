import type { SongDef } from '../../domain/music/song.ts';
import { neonHighway } from './neon-highway.ts';
import { sundayBakery } from './sunday-bakery.ts';

export const SONGS: readonly SongDef[] = [sundayBakery, neonHighway];
