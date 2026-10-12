import { describe, expect, it } from 'vitest';
import { nextFloat, nextInt, pickWeighted, type Rng, rngOf } from './rng.ts';

const draws = (rng: Rng, n: number): readonly number[] => {
  const out: number[] = [];
  let r = rng;
  for (let i = 0; i < n; i++) {
    const [x, next] = nextFloat(r);
    out.push(x);
    r = next;
  }
  return out;
};

describe('nextFloat', () => {
  it('is reproducible from the same seed', () => expect(draws(rngOf(42), 5)).toEqual(draws(rngOf(42), 5)));
  it('differs between seeds', () => expect(draws(rngOf(1), 3)).not.toEqual(draws(rngOf(2), 3)));
  it('stays in [0, 1)', () => expect(draws(rngOf(7), 1000).every((x) => x >= 0 && x < 1)).toBe(true));
  it('does not mutate the given state', () => {
    const r = rngOf(9);
    nextFloat(r);
    expect(r).toEqual(rngOf(9));
  });
});

describe('nextInt', () => {
  it('covers every value in [0, n)', () => {
    let r = rngOf(3);
    const seen = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const [v, next] = nextInt(r, 5);
      seen.add(v);
      r = next;
    }
    expect([...seen].sort()).toEqual([0, 1, 2, 3, 4]);
  });
});

describe('pickWeighted', () => {
  const tally = (weights: Readonly<Record<string, number>>, n: number) => {
    let r = rngOf(11);
    const counts: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      const [k, next] = pickWeighted(r, Object.keys(weights), (key) => weights[key] ?? 0);
      counts[k] = (counts[k] ?? 0) + 1;
      r = next;
    }
    return counts;
  };
  it('picks in proportion to the weights', () => {
    const c = tally({ a: 3, b: 1 }, 4000);
    expect((c.a ?? 0) / 4000).toBeGreaterThan(0.7);
    expect((c.a ?? 0) / 4000).toBeLessThan(0.8);
  });
  it('never picks a zero weight while a positive one exists', () => expect(tally({ a: 0, b: 1 }, 500).a).toBeUndefined());
  it('falls back to a uniform pick when all weights are zero', () =>
    expect(Object.keys(tally({ a: 0, b: 0 }, 500)).sort()).toEqual(['a', 'b']));
  it('rejects an empty list', () => expect(() => pickWeighted(rngOf(1), [], () => 1)).toThrow());
});
