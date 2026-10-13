import type { SongDef } from '../../domain/music/song.ts';
import { castleOfFallenKings } from './castle-of-fallen-kings.ts';
import { harborTownMorning } from './harbor-town-morning.ts';
import { overtureOfDawn } from './overture-of-dawn.ts';
import { skyShipDeparture } from './sky-ship-departure.ts';
import { whereTheJourneyEnds } from './where-the-journey-ends.ts';
import { wideWorldMap } from './wide-world-map.ts';

// Themes for an imaginary 16-bit role-playing game, bound by one six-note dawn motif from overture to ending.
export const BATCH_10: readonly SongDef[] = [
  overtureOfDawn,
  wideWorldMap,
  skyShipDeparture,
  castleOfFallenKings,
  harborTownMorning,
  whereTheJourneyEnds,
];
