import { useCallback, useEffect, useMemo, useState } from 'react';
import { SONGS } from '../content/songs/index.ts';
import { catalogOf } from '../domain/catalog.ts';
import { isPresetId, type MoodChoice } from '../domain/mood.ts';
import { SCENES } from '../visuals/scenes/index.ts';
import { createEngine } from './engine.ts';
import { setUpFrames } from './frames.ts';
import { Hud } from './Hud.tsx';
import { useAutoHide, useHeard, usePlayer, useScene, useShortcuts } from './hooks.ts';
import { MoodSheet } from './MoodSheet.tsx';
import { DEFAULT_PREFS, type Prefs, prefsStore } from './prefs.ts';
import { Show } from './Show.tsx';
import { Splash } from './Splash.tsx';

const catalog = catalogOf(SONGS);
const sceneMap = new Map(SCENES.map((s) => [s.id, s]));

/** Shareable links: ?mood=cozy&track=sunday-bakery&scene=sunset-grid&loops=1 (loops caps each track, for a quick tour). */
const linkParams = () => {
  const q = new URLSearchParams(window.location.search);
  const mood = q.get('mood');
  return {
    mood: mood && isPresetId(mood) ? ({ kind: 'preset', id: mood } as const) : null,
    track: q.get('track'),
    scene: q.get('scene'),
    loops: Number.parseInt(q.get('loops') ?? '', 10) || null,
  };
};

const toggleFullscreen = (): void => {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen?.();
};

export const App = () => {
  const link = useMemo(linkParams, []);
  const prefs = useMemo<Prefs>(() => ({ ...(prefsStore.load() ?? DEFAULT_PREFS), ...(link.mood ? { mood: link.mood } : {}) }), [link]);
  const engine = useMemo(() => createEngine(catalog), []);
  const [player, dispatch] = usePlayer(catalog, prefs, link.loops, engine);
  const heard = useHeard(engine, dispatch);
  const track = catalog.byId.get(player.current ?? '') ?? null;
  const scene = useScene(SCENES, link.scene, prefs.mood, track);
  const [volume, setVolume] = useState(prefs.volume);
  const [moodOpen, setMoodOpen] = useState(false);
  const started = player.status !== 'idle';
  const hud = useAutoHide(player.status === 'playing' && !moodOpen);

  useEffect(setUpFrames, []);
  useEffect(() => engine.setVolume(volume), [engine, volume]);
  useEffect(
    () => prefsStore.save({ mood: player.mood.kind === 'point' ? DEFAULT_PREFS.mood : player.mood, mode: player.mode, volume }),
    [player.mood, player.mode, volume],
  );

  const start = useCallback(() => {
    engine.unlock();
    dispatch({ type: 'start', track: link.track ?? undefined });
  }, [engine, dispatch, link]);

  const keys = useMemo(
    () => ({
      ' ': () => (started ? dispatch({ type: 'toggle' }) : start()),
      ArrowRight: () => dispatch({ type: 'next' }),
      ArrowLeft: () => dispatch({ type: 'prev' }),
      r: () => dispatch({ type: 'setMode', mode: player.mode === 'repeat' ? 'shuffle' : 'repeat' }),
      m: () => setMoodOpen((open) => !open),
      v: scene.skip,
      l: scene.toggleLock,
      f: toggleFullscreen,
      h: () => (hud.visible ? hud.hide() : hud.poke()),
    }),
    [started, dispatch, start, player.mode, scene.skip, scene.toggleLock, hud],
  );
  useShortcuts(
    keys,
    useCallback((key: string) => key !== 'h' && hud.poke(), [hud]),
  );

  const chooseMood = (mood: MoodChoice) => dispatch({ type: 'setMood', mood });
  const title = sceneMap.get(scene.sceneId)?.title ?? '';

  return (
    <div
      className={`app ${started ? 'started' : 'idle'} ${hud.visible || !started ? 'hud-on' : 'hud-off'}`}
      data-heard={heard?.track ?? ''}
    >
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
          loop={heard?.loop ?? 0}
          sceneTitle={title}
          locked={scene.locked}
          volume={volume}
          canFullscreen={Boolean(document.fullscreenEnabled)}
          onMsg={dispatch}
          onMood={() => setMoodOpen(true)}
          onSkipScene={scene.skip}
          onLock={scene.toggleLock}
          onVolume={setVolume}
          onFullscreen={toggleFullscreen}
          onHold={hud.hold}
        />
      ) : (
        <Splash mood={player.mood} trackCount={catalog.tracks.length} sceneCount={SCENES.length} onMood={chooseMood} onStart={start} />
      )}
      {moodOpen ? <MoodSheet choice={player.mood} onChoose={chooseMood} onClose={() => setMoodOpen(false)} /> : null}
    </div>
  );
};
