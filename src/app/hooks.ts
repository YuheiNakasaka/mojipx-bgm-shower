// React hooks that connect the pure modules (player, director) to the audio engine and the page.
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { Catalog, Track } from '../domain/catalog.ts';
import { type MoodChoice, targetOf } from '../domain/mood.ts';
import { type Heard, initialPlayer, type Msg, type PlayerState, update } from '../domain/player.ts';
import { type DirectorState, direct, initialDirector, setLocked, skipScene, type TrackMeta } from '../visuals/director.ts';
import type { Scene } from '../visuals/scene.ts';
import type { Engine } from './engine.ts';
import type { Prefs } from './prefs.ts';
import { createStore } from './store.ts';

const HIDE_AFTER_MS = 3500;
const HEARD_EVERY_MS = 200;

const seedOf = (): number => Math.floor(Math.random() * 2 ** 32);

export const metaOf = (t: Track): TrackMeta => ({ id: t.id, mood: t.mood, style: t.style });

/** The player state machine, with its commands run against the engine. */
export const usePlayer = (catalog: Catalog, prefs: Prefs, loopCap: number | null, engine: Engine) => {
  const store = useMemo(
    () => createStore<PlayerState, PlayerState>({ ...initialPlayer(seedOf(), prefs.mood, loopCap), mode: prefs.mode }, (_, next) => next),
    [prefs, loopCap],
  );
  const state = useSyncExternalStore(store.subscribe, store.get, store.get);
  const dispatch = useCallback(
    (msg: Msg) => {
      const [next, cmds] = update(store.get(), msg, catalog.tracks);
      store.dispatch(next);
      for (const cmd of cmds) engine.run(cmd);
    },
    [store, engine, catalog],
  );
  return [state, dispatch] as const;
};

/** Reports what is heard a few times a second, so the player can cue the next track and take over when it starts. */
export const useHeard = (engine: Engine, dispatch: (msg: Msg) => void): Heard | null => {
  const [heard, setHeard] = useState<Heard | null>(null);
  useEffect(() => {
    const id = window.setInterval(() => {
      const now = engine.heard();
      dispatch({ type: 'heard', at: now });
      setHeard((prev) => (prev?.track === now?.track && prev?.loop === now?.loop ? prev : now));
    }, HEARD_EVERY_MS);
    return () => window.clearInterval(id);
  }, [engine, dispatch]);
  return heard;
};

const firstDirector = (scenes: readonly Scene[], linked: string | null, mood: MoodChoice): DirectorState => {
  const now = performance.now();
  const start = initialDirector(seedOf(), scenes, now);
  if (linked && scenes.some((s) => s.id === linked))
    return setLocked({ ...start, shot: { scene: linked, variant: 0, startedAt: now }, previous: null }, true);
  return direct(start, scenes, { id: 'splash', mood: targetOf(mood) ?? { valence: 0.2, energy: 0.3 }, style: '' }, 0, now);
};

export type SceneControl = {
  readonly director: RefObject<DirectorState>;
  readonly sceneId: string;
  readonly locked: boolean;
  /** Called by the render loop when it cuts to another scene. */
  readonly onShot: (sceneId: string) => void;
  readonly skip: () => void;
  readonly toggleLock: () => void;
};

/** The visual director lives in a ref (the render loop updates it every frame); React only hears about cuts. */
export const useScene = (scenes: readonly Scene[], linked: string | null, mood: MoodChoice, track: Track | null): SceneControl => {
  const director = useRef<DirectorState>(firstDirector(scenes, linked, mood));
  const [sceneId, setSceneId] = useState(director.current.shot.scene);
  const [locked, setLockedState] = useState(director.current.locked);
  const skip = useCallback(() => {
    director.current = skipScene(director.current, scenes, track ? metaOf(track) : null, performance.now());
    setSceneId(director.current.shot.scene);
  }, [scenes, track]);
  const toggleLock = useCallback(() => {
    director.current = setLocked(director.current, !director.current.locked);
    setLockedState(director.current.locked);
  }, []);
  return { director, sceneId, locked, onShot: setSceneId, skip, toggleLock };
};

export type AutoHide = {
  readonly visible: boolean;
  readonly poke: () => void;
  readonly hide: () => void;
  readonly hold: (held: boolean) => void;
};

/** The controls fade after a while without pointer or focus activity, but never while the pointer rests on them. */
export const useAutoHide = (active: boolean): AutoHide => {
  const [visible, setVisible] = useState(true);
  const timer = useRef(0);
  const held = useRef(false);
  const poke = useCallback(() => {
    setVisible(true);
    window.clearTimeout(timer.current);
    if (active) timer.current = window.setTimeout(() => setVisible(held.current), HIDE_AFTER_MS);
  }, [active]);
  const hide = useCallback(() => {
    window.clearTimeout(timer.current);
    setVisible(false);
  }, []);
  const hold = useCallback(
    (on: boolean) => {
      held.current = on;
      if (!on) poke();
    },
    [poke],
  );
  useEffect(() => {
    poke();
    const events = ['pointermove', 'pointerdown', 'focusin'] as const;
    for (const e of events) window.addEventListener(e, poke);
    return () => {
      window.clearTimeout(timer.current);
      for (const e of events) window.removeEventListener(e, poke);
    };
  }, [poke]);
  return useMemo(() => ({ visible, poke, hide, hold }), [visible, poke, hide, hold]);
};

/** The key a shortcut map is looked up with: letters case-insensitively, others by name. */
const keyOf = (e: KeyboardEvent): string => (e.key.length === 1 ? e.key.toLowerCase() : e.key);

// Space on a focused button presses it; typing in the volume slider keeps its arrow keys.
const ownedByControl = (e: KeyboardEvent): boolean =>
  (e.key === ' ' && e.target instanceof HTMLButtonElement) || (e.target instanceof HTMLInputElement && e.key !== ' ');

/** Global keyboard shortcuts. `after` runs after every handled key. */
export const useShortcuts = (keys: Readonly<Record<string, () => void>>, after: (key: string) => void): void => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const action = keys[keyOf(e)];
      if (!action || ownedByControl(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      action();
      after(keyOf(e));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [keys, after]);
};
