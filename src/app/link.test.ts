import { describe, expect, it } from 'vitest';
import { linkOf } from './hooks.ts';

describe('linkOf', () => {
  it('reads every parameter', () =>
    expect(linkOf('?genre=idol&track=sunday-bakery&scene=sunset-grid&loops=1')).toEqual({
      genre: { kind: 'genre', id: 'idol' },
      track: 'sunday-bakery',
      scene: 'sunset-grid',
      loops: 1,
    }));
  it('ignores what is missing or unknown, such as a mood from an older link', () =>
    expect(linkOf('?mood=cozy&genre=polka&loops=many')).toEqual({ genre: null, track: null, scene: null, loops: null }));
});
