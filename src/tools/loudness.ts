// Development tool, not part of the site: measures how loud each track sounds so tracks can be evened out.
// Each track is rendered offline through the same mojipx voices, weighted roughly like the ear
// (less deep bass, a little more presence), and measured as RMS after the first second. A track renders its intro and
// one whole loop, since songs build from a sparse verse to a full chorus and any shorter window would hear only the verse.
import { createBgm, createSetting, type StorageLike } from 'mojipx';
import { SONGS } from '../content/songs/index.ts';
import { catalogOf, type Track } from '../domain/catalog.ts';

const RATE = 22050;
const MAX_SECONDS = 150;
const SKIP_SEC = 1;

export type Measured = { readonly id: string; readonly rms: number; readonly peak: number };

const memory: StorageLike = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

// Channel 0 hears the weighted signal, channel 1 the raw one (for the peak).
const outputOf = (ac: OfflineAudioContext): AudioNode => {
  const input = ac.createGain();
  const merger = ac.createChannelMerger(2);
  const highpass = ac.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 60;
  const presence = ac.createBiquadFilter();
  presence.type = 'highshelf';
  presence.frequency.value = 1500;
  presence.gain.value = 4;
  input.connect(highpass);
  highpass.connect(presence);
  presence.connect(merger, 0, 0);
  input.connect(merger, 0, 1);
  merger.connect(ac.destination);
  return input;
};

const rmsOf = (data: Float32Array, from: number): number => {
  let sum = 0;
  for (let i = from; i < data.length; i++) sum += (data[i] ?? 0) ** 2;
  return Math.sqrt(sum / Math.max(1, data.length - from));
};

const peakOf = (data: Float32Array): number => data.reduce((m, v) => Math.max(m, Math.abs(v)), 0);

export const measure = async (track: Track): Promise<Measured> => {
  const seconds = Math.min(MAX_SECONDS, Math.ceil(track.introSec + track.loopSec));
  const ac = new OfflineAudioContext(2, RATE * seconds, RATE);
  const out = outputOf(ac);
  const bgm = createBgm(
    { [track.id]: { ...track.song.score, gain: 1 } },
    createSetting('measure', false, () => memory),
  );
  const sec = bgm.stepSec(track.id, false);
  for (let step = 0; step * sec < seconds; step++) bgm.playStep(ac, out, track.id, step, 0.02 + step * sec, false);
  const buffer = await ac.startRendering();
  return { id: track.id, rms: rmsOf(buffer.getChannelData(0), RATE * SKIP_SEC), peak: peakOf(buffer.getChannelData(1)) };
};

export const measureAll = async (): Promise<readonly Measured[]> => {
  const results: Measured[] = [];
  for (const track of catalogOf(SONGS).tracks) results.push(await measure(track));
  return results;
};
