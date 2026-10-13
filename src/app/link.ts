// Links into the site: what a page address asks for, and the address that shares what is playing.
import { type GenreChoice, isGenreId } from '../domain/genre.ts';
import type { PlayMode } from '../domain/player.ts';

export type Link = {
  readonly genre: GenreChoice | null;
  readonly track: string | null;
  readonly scene: string | null;
  readonly mode: PlayMode | null;
  readonly loops: number | null;
};

const modeOf = (v: string | null): PlayMode | null => (v === 'shuffle' || v === 'repeat' ? v : null);

/** ?genre=idol&track=sunday-bakery&scene=sunset-grid&mode=repeat&loops=1 (loops caps each track, for a quick tour). */
export const linkOf = (search: string): Link => {
  const q = new URLSearchParams(search);
  const genre = q.get('genre');
  return {
    genre: genre && isGenreId(genre) ? { kind: 'genre', id: genre } : null,
    track: q.get('track'),
    scene: q.get('scene'),
    mode: modeOf(q.get('mode')),
    loops: Number.parseInt(q.get('loops') ?? '', 10) || null,
  };
};

/** The page's address with only a track and a scene that stay on: the track on repeat, the scene locked. */
export const shareLinkOf = (page: string, track: string, scene: string): string => {
  const url = new URL(page);
  url.search = new URLSearchParams({ track, scene, mode: 'repeat' }).toString();
  url.hash = '';
  return url.toString();
};
