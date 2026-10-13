// Listener preferences kept in this browser: genre, play mode and volume.
import { createStore } from 'mojipx';
import { ALL_GENRES, type GenreChoice, isGenreId } from '../domain/genre.ts';
import type { PlayMode } from '../domain/player.ts';

export type Prefs = { readonly genre: GenreChoice; readonly mode: PlayMode; readonly volume: number };

export const DEFAULT_PREFS: Prefs = { genre: ALL_GENRES, mode: 'shuffle', volume: 0.8 };

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

const parseGenre = (v: unknown): GenreChoice | null => {
  if (!isRecord(v)) return null;
  if (v.kind === 'all') return ALL_GENRES;
  return v.kind === 'genre' && typeof v.id === 'string' && isGenreId(v.id) ? { kind: 'genre', id: v.id } : null;
};

/** Each preference on its own: one that is missing or malformed (a mood saved by an older version, say) falls back to its default. */
export const parsePrefs = (v: unknown): Prefs | null => {
  if (!isRecord(v)) return null;
  const mode = v.mode === 'shuffle' || v.mode === 'repeat' ? v.mode : DEFAULT_PREFS.mode;
  const volume = typeof v.volume === 'number' && v.volume >= 0 && v.volume <= 1 ? v.volume : DEFAULT_PREFS.volume;
  return { genre: parseGenre(v.genre) ?? DEFAULT_PREFS.genre, mode, volume };
};

export const prefsStore = createStore('bgm-shower:prefs', parsePrefs);
