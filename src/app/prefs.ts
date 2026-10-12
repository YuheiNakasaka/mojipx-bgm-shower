// Listener preferences kept in this browser: mood, play mode and volume.
import { createStore } from 'mojipx';
import { isPresetId, type MoodChoice } from '../domain/mood.ts';
import type { PlayMode } from '../domain/player.ts';

export type Prefs = { readonly mood: MoodChoice; readonly mode: PlayMode; readonly volume: number };

export const DEFAULT_PREFS: Prefs = { mood: { kind: 'any' }, mode: 'shuffle', volume: 0.8 };

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

const parseMood = (v: unknown): MoodChoice | null => {
  if (!isRecord(v)) return null;
  if (v.kind === 'any') return { kind: 'any' };
  if (v.kind === 'preset' && typeof v.id === 'string' && isPresetId(v.id)) return { kind: 'preset', id: v.id };
  return null;
};

export const parsePrefs = (v: unknown): Prefs | null => {
  if (!isRecord(v)) return null;
  const mood = parseMood(v.mood);
  const mode = v.mode === 'shuffle' || v.mode === 'repeat' ? v.mode : null;
  const volume = typeof v.volume === 'number' && v.volume >= 0 && v.volume <= 1 ? v.volume : null;
  return mood && mode && volume !== null ? { mood, mode, volume } : null;
};

export const prefsStore = createStore('bgm-shower:prefs', parsePrefs);
