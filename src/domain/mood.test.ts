import { describe, expect, it } from 'vitest';
import { affinity, moodDistance } from './mood.ts';

describe('moodDistance', () => {
  it('is the straight-line distance on the plane', () =>
    expect(moodDistance({ valence: 0, energy: 0 }, { valence: 0.3, energy: 0.4 })).toBeCloseTo(0.5));
});

describe('affinity', () => {
  const a = { valence: 0, energy: 0 };
  it('is 1 for the same point', () => expect(affinity(a, a, 0.5)).toBe(1));
  it('falls with distance', () => {
    expect(affinity(a, { valence: 0.5, energy: 0 }, 0.5)).toBeLessThan(1);
    expect(affinity(a, { valence: 1, energy: 0 }, 0.5)).toBeLessThan(affinity(a, { valence: 0.5, energy: 0 }, 0.5));
  });
  it('falls slower with a wider spread', () =>
    expect(affinity(a, { valence: 1, energy: 0 }, 1)).toBeGreaterThan(affinity(a, { valence: 1, energy: 0 }, 0.5)));
});
