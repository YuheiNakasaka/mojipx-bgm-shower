import { describe, expect, it } from 'vitest';
import { linkOf, shareLinkOf } from './link.ts';

describe('linkOf', () => {
  it('reads every parameter', () =>
    expect(linkOf('?genre=idol&track=sunday-bakery&scene=sunset-grid&mode=repeat&loops=1')).toEqual({
      genre: { kind: 'genre', id: 'idol' },
      track: 'sunday-bakery',
      scene: 'sunset-grid',
      mode: 'repeat',
      loops: 1,
    }));
  it('reads shuffle as a mode too', () => expect(linkOf('?mode=shuffle').mode).toBe('shuffle'));
  it('ignores what is missing or unknown, such as a mood from an older link', () =>
    expect(linkOf('?mood=cozy&genre=polka&mode=loop&loops=many')).toEqual({
      genre: null,
      track: null,
      scene: null,
      mode: null,
      loops: null,
    }));
});

describe('shareLinkOf', () => {
  it('links to the track on repeat and the scene, on the same page', () =>
    expect(shareLinkOf('https://bgm.example/', 'sunday-bakery', 'sunset-grid')).toBe(
      'https://bgm.example/?track=sunday-bakery&scene=sunset-grid&mode=repeat',
    ));
  it('drops the parameters and the fragment of the page it was made on', () =>
    expect(shareLinkOf('https://bgm.example/app/?genre=idol&loops=1&track=old#top', 'neon-highway', 'warp-stars')).toBe(
      'https://bgm.example/app/?track=neon-highway&scene=warp-stars&mode=repeat',
    ));
  it('reads back as the same track, scene and mode', () => {
    const shared = new URL(shareLinkOf('http://localhost:4173/?genre=chill', 'a b&c', 'x/y'));
    expect(linkOf(shared.search)).toEqual({ genre: null, track: 'a b&c', scene: 'x/y', mode: 'repeat', loops: null });
  });
});
