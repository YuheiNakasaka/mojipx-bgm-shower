import type { Scene } from '../scene.ts';
import { blockRain } from './block-rain.ts';
import { kaleidoscope } from './kaleidoscope.ts';
import { neonTunnel } from './neon-tunnel.ts';
import { orbitClimb } from './orbit-climb.ts';
import { pixelParade } from './pixel-parade.ts';
import { pixelRunner } from './pixel-runner.ts';
import { plasmaWave } from './plasma-wave.ts';
import { spectrumBars } from './spectrum-bars.ts';
import { starPatrol } from './star-patrol.ts';

export const SCENE_BATCH_3: readonly Scene[] = [
  spectrumBars,
  neonTunnel,
  plasmaWave,
  kaleidoscope,
  starPatrol,
  pixelRunner,
  pixelParade,
  orbitClimb,
  blockRain,
];
