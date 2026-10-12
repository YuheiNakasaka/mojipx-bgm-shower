// The audio shell: runs the player's commands against mojipx and reports what is heard.
import { audioContext, type BgmPosition, createBgm, createSetting, type StorageLike } from 'mojipx';
import type { Catalog } from '../domain/catalog.ts';
import type { Cmd, Heard } from '../domain/player.ts';

export type Engine = {
  /** Call inside the listener's first tap or key press; browsers only allow sound after one. */
  readonly unlock: () => void;
  readonly run: (cmd: Cmd) => void;
  readonly position: () => BgmPosition<string> | null;
  readonly heard: () => Heard | null;
  readonly setVolume: (volume: number) => void;
};

// The site never switches the BGM off (pausing suspends the audio clock instead), so nothing needs remembering.
const memory: StorageLike = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

type AudioSessionNavigator = Navigator & { readonly audioSession?: { type: string } };

export const createEngine = (catalog: Catalog): Engine => {
  const scores = Object.fromEntries(catalog.tracks.map((t) => [t.id, t.song.score]));
  const bgm = createBgm(
    scores,
    createSetting('bgm-shower:sound', true, () => memory),
    { pauseWhenHidden: false, master: 0.22 },
  );
  const position = (): BgmPosition<string> | null => bgm.position();
  return {
    unlock: () => {
      // Lets phones play through the silent switch where the browser supports it.
      const session = (navigator as AudioSessionNavigator).audioSession;
      if (session) session.type = 'playback';
      bgm.setOn(true);
    },
    run: (cmd) => {
      if (cmd.type === 'play') bgm.want(cmd.track);
      else if (cmd.type === 'cue') bgm.cue(cmd.track);
      else if (cmd.type === 'pause') void audioContext(false)?.suspend();
      else void audioContext(true)?.resume();
    },
    position,
    heard: () => {
      const p = position();
      return p ? { track: p.track, loop: p.loop } : null;
    },
    setVolume: (volume) => bgm.setVolume(volume),
  };
};
