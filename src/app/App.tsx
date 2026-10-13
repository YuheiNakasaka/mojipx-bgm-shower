import { useCallback, useEffect, useMemo, useState } from 'react';
import { SONGS } from '../content/songs/index.ts';
import { LOUDNESS } from '../content/songs/loudness.ts';
import { catalogOf } from '../domain/catalog.ts';
import type { GenreChoice } from '../domain/genre.ts';
import { SCENES } from '../visuals/scenes/index.ts';
import { createEngine } from './engine.ts';
import { setUpFrames } from './frames.ts';
import { Hud } from './Hud.tsx';
import { useAppShortcuts, useAutoHide, useHeard, useLink, usePlayer, usePrefsSync, useScene } from './hooks.ts';
import { Overlays, type SheetName } from './Overlays.tsx';
import { Show } from './Show.tsx';
import { Splash } from './Splash.tsx';

const catalog = catalogOf(SONGS, LOUDNESS);
const sceneMap = new Map(SCENES.map((s) => [s.id, s]));

const appClass = (started: boolean, hudVisible: boolean): string =>
  `app ${started ? 'started' : 'idle'} ${hudVisible || !started ? 'hud-on' : 'hud-off'}`;

const toggleFullscreen = (): void => {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen?.();
};

export const App = () => {
  const { link, prefs } = useLink();
  const engine = useMemo(() => createEngine(catalog), []);
  const [player, dispatch] = usePlayer(catalog, prefs, link.loops, engine);
  const heard = useHeard(engine, dispatch);
  const track = catalog.byId.get(player.current ?? '') ?? null;
  const scene = useScene(SCENES, link.scene, track);
  const [volume, setVolume] = useState(prefs.volume);
  const [sheet, setSheet] = useState<SheetName | null>(null);
  const started = player.status !== 'idle';
  const hud = useAutoHide(player.status === 'playing' && sheet === null);
  const toggleSheet = useCallback((name: SheetName) => setSheet((open) => (open === name ? null : name)), []);
  const start = useCallback(() => {
    engine.unlock();
    dispatch({ type: 'start', track: link.track ?? undefined });
  }, [engine, dispatch, link]);

  useEffect(setUpFrames, []);
  usePrefsSync(engine, player, volume);
  useAppShortcuts({ player, dispatch, start, scene, hud, toggleSheet, toggleFullscreen });

  const title = sceneMap.get(scene.sceneId)?.title ?? '';
  return (
    <div className={appClass(started, hud.visible)} data-heard={heard?.track ?? ''}>
      <Show
        engine={engine}
        catalog={catalog}
        scenes={SCENES}
        sceneMap={sceneMap}
        director={scene.director}
        currentId={player.current}
        label={`Pixel animation: ${title}`}
        onShot={scene.onShot}
      />
      <div className="crt" aria-hidden="true" />
      {started ? (
        <Hud
          player={player}
          track={track}
          next={catalog.byId.get(player.queued ?? '') ?? null}
          loop={heard?.loop ?? 0}
          sceneTitle={title}
          locked={scene.locked}
          volume={volume}
          canFullscreen={Boolean(document.fullscreenEnabled)}
          onMsg={dispatch}
          onGenre={() => setSheet('genre')}
          onTracks={() => setSheet('tracks')}
          onSkipScene={scene.skip}
          onLock={scene.toggleLock}
          onVolume={setVolume}
          onFullscreen={toggleFullscreen}
          onHold={hud.hold}
        />
      ) : (
        <Splash
          genre={player.genre}
          trackCount={catalog.tracks.length}
          sceneCount={SCENES.length}
          onGenre={(genre: GenreChoice) => dispatch({ type: 'setGenre', genre })}
          onStart={start}
        />
      )}
      <Overlays catalog={catalog} player={player} track={track} sheet={sheet} onMsg={dispatch} onClose={() => setSheet(null)} />
    </div>
  );
};
