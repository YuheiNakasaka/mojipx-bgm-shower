import { describe, expect, it } from 'vitest';
import { ALL_GENRES, choiceLabel, GENRES, genreFilterOf, genreOf, isGenreId } from './genre.ts';
import { STYLES } from './music/styles.ts';

describe('GENRES', () => {
  it('has nine distinct genres for a 3×3 grid', () => {
    expect(GENRES).toHaveLength(9);
    expect(new Set(GENRES.map((g) => g.id)).size).toBe(9);
  });
  it('is fed by at least one style each', () => {
    const fed = new Set(Object.values(STYLES).map((s) => s.genre));
    expect(GENRES.filter((g) => !fed.has(g.id)).map((g) => g.id)).toEqual([]);
  });
});

describe('isGenreId / genreOf', () => {
  it('recognises genre ids', () => {
    expect(isGenreId('idol')).toBe(true);
    expect(isGenreId('cozy')).toBe(false);
  });
  it('finds a genre by id', () => expect(genreOf('vocal-synth').label).toBe('Vocal Synth'));
});

describe('genreFilterOf / choiceLabel', () => {
  it('narrows to the chosen genre, or to none for all', () => {
    expect(genreFilterOf({ kind: 'genre', id: 'rpg' })).toBe('rpg');
    expect(genreFilterOf(ALL_GENRES)).toBeNull();
  });
  it('labels a choice', () => {
    expect(choiceLabel({ kind: 'genre', id: 'city-pop' })).toBe('City Pop');
    expect(choiceLabel(ALL_GENRES)).toBe('All genres');
  });
});
