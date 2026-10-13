import { useCallback, useEffect, useMemo, useState } from 'react';
import { SONGS } from '../content/songs/index.ts';
import { LOUDNESS } from '../content/songs/loudness.ts';
import { catalogOf, type Track } from '../domain/catalog.ts';
import type { GenreChoice } from '../domain/genre.ts';
import type { Msg, PlayerState } from '../domain/player.ts';
import { SCENES } from '../visuals/scenes/index.ts';
import { createEngine } from './engine.ts';
import { setUpFrames } from './frames.ts';
import { Hud } from './Hud.tsx';
import { useAppShortcuts, useAutoHide, useHeard, useLink, usePlayer, usePrefsSync, useScene, useShare } from './hooks.ts';
import { Overlays, type SheetName } from './Overlays.tsx';
import { SharedSplash } from './SharedSplash.tsx';
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

type LandingProps = {
  /** The track a link asks for, when the library has it, and the scene it asks for. */
  readonly linked: Track | null;
  readonly linkedScene: string | null;
  readonly player: PlayerState;
  readonly onMsg: (msg: Msg) => void;
  readonly onStart: () => void;
};

/** What the page shows until the first tap: what a link is about to play, or the genre picker. */
const Landing = ({ linked, linkedScene, player, onMsg, onStart }: LandingProps) =>
  linked ? (
    <SharedSplash
      track={linked}
      sceneTitle={sceneMap.get(linkedScene ?? '')?.title ?? null}
      repeat={player.mode === 'repeat'}
      onStart={onStart}
    />
  ) : (
    <Splash
      genre={player.genre}
      trackCount={catalog.tracks.length}
      sceneCount={SCENES.length}
      onGenre={(genre: GenreChoice) => onMsg({ type: 'setGenre', genre })}
      onStart={onStart}
    />
  );

export const App = () => {
  const { link, saved, prefs } = useLink();
  const linked = catalog.byId.get(link.track ?? '') ?? null;
  const engine = useMemo(() => createEngine(catalog), []);
  const [player, dispatch] = usePlayer(catalog, prefs, link.loops, engine);
  const heard = useHeard(engine, dispatch);
  const track = catalog.byId.get(player.current ?? '') ?? null;
  const scene = useScene(SCENES, link.scene, linked, track);
  const title = sceneMap.get(scene.sceneId)?.title ?? '';
  const { shared, share } = useShare(track, { id: scene.sceneId, title });
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
  usePrefsSync(engine, player, volume, saved.mode);
  useAppShortcuts({ player, dispatch, start, scene, hud, toggleSheet, toggleFullscreen, share });

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
          shared={shared}
          volume={volume}
          canFullscreen={Boolean(document.fullscreenEnabled)}
          onMsg={dispatch}
          onGenre={() => setSheet('genre')}
          onTracks={() => setSheet('tracks')}
          onSkipScene={scene.skip}
          onLock={scene.toggleLock}
          onShare={share}
          onVolume={setVolume}
          onFullscreen={toggleFullscreen}
          onHold={hud.hold}
        />
      ) : (
        <Landing linked={linked} linkedScene={link.scene} player={player} onMsg={dispatch} onStart={start} />
      )}
      <Overlays catalog={catalog} player={player} track={track} sheet={sheet} onMsg={dispatch} onClose={() => setSheet(null)} />
    </div>
  );
};
