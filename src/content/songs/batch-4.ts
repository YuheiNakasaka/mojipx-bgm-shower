import type { SongDef } from '../../domain/music/song.ts';
import { cipherCave } from './cipher-cave.ts';
import { fadingSignal } from './fading-signal.ts';
import { floatingGarden } from './floating-garden.ts';
import { moonlitRuins } from './moonlit-ruins.ts';
import { phantomMarket } from './phantom-market.ts';
import { sunkenLibrary } from './sunken-library.ts';
import { unsentLetter } from './unsent-letter.ts';

export const BATCH_4: readonly SongDef[] = [
  sunkenLibrary,
  moonlitRuins,
  cipherCave,
  phantomMarket,
  fadingSignal,
  floatingGarden,
  unsentLetter,
];
