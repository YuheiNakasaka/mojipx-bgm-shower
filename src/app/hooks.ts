// React hooks that connect the pure modules (player, director) to the audio engine and the page.
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { Catalog, Track } from '../domain/catalog.ts';
import { type Heard, initialPlayer, type Msg, type PlayerState, type PlayMode, update } from '../domain/player.ts';
import { type DirectorState, direct, initialDirector, setLocked, skipScene, type TrackMeta, variantFor } from '../visuals/director.ts';
import type { Scene } from '../visuals/scene.ts';
import type { Engine } from './engine.ts';
import { type Link, linkOf, shareLinkOf } from './link.ts';
import { DEFAULT_PREFS, type Prefs, prefsStore } from './prefs.ts';
import { type Shared, shareLink } from './share.ts';
import { createStore } from './store.ts';

const HIDE_AFTER_MS = 3500;
const HEARD_EVERY_MS = 200;
const SHARED_SHOWN_MS = 2500;

const seedOf = (): number => Math.floor(Math.random() * 2 ** 32);

export type Opening = {
  readonly link: Link;
  /** What the listener saved in this browser. */
  readonly saved: Prefs;
  /** What the page starts with: the saved preferences, with the link's genre and mode taking precedence. */
  readonly prefs: Prefs;
};

/** The page's link, read once. */
export const useLink = (): Opening =>
  useMemo(() => {
    const link = linkOf(window.location.search);
    const saved = prefsStore.load() ?? DEFAULT_PREFS;
    return { link, saved, prefs: { ...saved, genre: link.genre ?? saved.genre, mode: link.mode ?? saved.mode } };
  }, []);

export const metaOf = (t: Track): TrackMeta => ({ id: t.id, mood: t.mood, style: t.style });

/** What the splash shows before any track plays: a bright, lively scene. */
const SPLASH: TrackMeta = { id: 'splash', mood: { valence: 0.2, energy: 0.3 }, style: '' };

/** The player state machine, with its commands run against the engine. */
export const usePlayer = (catalog: Catalog, prefs: Prefs, loopCap: number | null, engine: Engine) => {
  const store = useMemo(
    () => createStore<PlayerState, PlayerState>({ ...initialPlayer(seedOf(), prefs.genre, loopCap), mode: prefs.mode }, (_, next) => next),
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

/** The first shot, drawn behind the splash: the linked scene, locked and colored for the track to come, or one picked for it. */
const firstDirector = (scenes: readonly Scene[], linked: string | null, coming: TrackMeta): DirectorState => {
  const now = performance.now();
  const start = initialDirector(seedOf(), scenes, now);
  const scene = scenes.find((s) => s.id === linked);
  if (!scene) return direct(start, scenes, coming, 0, now);
  const shot = { scene: scene.id, variant: variantFor(scene, coming.mood), startedAt: now };
  return setLocked({ ...start, shot, previous: null }, true);
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

/**
 * The visual director lives in a ref (the render loop updates it every frame); React only hears about cuts.
 * `linked` is the scene a link asks for, `coming` the track a link asks for; `track` is the one playing.
 */
export const useScene = (scenes: readonly Scene[], linked: string | null, coming: Track | null, track: Track | null): SceneControl => {
  const director = useRef<DirectorState>(firstDirector(scenes, linked, coming ? metaOf(coming) : SPLASH));
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

export type ShareControl = {
  /** How the last share went, for a moment afterwards. */
  readonly shared: Shared | null;
  readonly share: () => void;
};

/** Shares a link to the playing track with the scene on screen, both kept on for whoever opens it. */
export const useShare = (track: Track | null, scene: { readonly id: string; readonly title: string }): ShareControl => {
  const [shared, setShared] = useState<Shared | null>(null);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const share = useCallback(() => {
    if (!track) return;
    const url = shareLinkOf(window.location.href, track.id, scene.id);
    void shareLink({ title: 'BGM Shower', text: `${track.title} × ${scene.title}`, url }).then((outcome) => {
      setShared(outcome);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setShared(null), SHARED_SHOWN_MS);
    });
  }, [track, scene.id, scene.title]);
  return { shared, share };
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

/**
 * Remembers the listener's genre, play mode and volume in this browser, and applies the volume.
 * A mode a link asked for is not remembered until the listener changes it, so a shared track on repeat stays with that link.
 */
export const usePrefsSync = (engine: Engine, player: PlayerState, volume: number, savedMode: PlayMode): void => {
  const firstMode = useRef(player.mode);
  const modeChanged = useRef(false);
  useEffect(() => engine.setVolume(volume), [engine, volume]);
  useEffect(() => {
    modeChanged.current ||= player.mode !== firstMode.current;
    prefsStore.save({ genre: player.genre, mode: modeChanged.current ? player.mode : savedMode, volume });
  }, [player.genre, player.mode, volume, savedMode]);
};

type ShortcutDeps = {
  readonly player: PlayerState;
  readonly dispatch: (msg: Msg) => void;
  readonly start: () => void;
  readonly scene: SceneControl;
  readonly hud: AutoHide;
  readonly toggleSheet: (name: 'genre' | 'tracks') => void;
  readonly toggleFullscreen: () => void;
  readonly share: () => void;
};

/** The site's keyboard shortcuts (listed in the README). */
export const useAppShortcuts = ({ player, dispatch, start, scene, hud, toggleSheet, toggleFullscreen, share }: ShortcutDeps): void => {
  const started = player.status !== 'idle';
  const keys = useMemo(
    () => ({
      ' ': () => (started ? dispatch({ type: 'toggle' }) : start()),
      ArrowRight: () => dispatch({ type: 'next' }),
      ArrowLeft: () => dispatch({ type: 'prev' }),
      r: () => dispatch({ type: 'setMode', mode: player.mode === 'repeat' ? 'shuffle' : 'repeat' }),
      g: () => toggleSheet('genre'),
      t: () => toggleSheet('tracks'),
      v: scene.skip,
      l: scene.toggleLock,
      f: toggleFullscreen,
      s: share,
      h: () => (hud.visible ? hud.hide() : hud.poke()),
    }),
    [started, dispatch, start, player.mode, scene.skip, scene.toggleLock, hud, toggleSheet, toggleFullscreen, share],
  );
  useShortcuts(
    keys,
    useCallback((key: string) => key !== 'h' && hud.poke(), [hud]),
  );
};
