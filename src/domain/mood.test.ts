import { describe, expect, it } from 'vitest';
import { ANY_MOOD, affinity, choiceLabel, clampMood, isPresetId, MOOD_PRESETS, nearestPreset, presetOf, targetOf } from './mood.ts';

describe('MOOD_PRESETS', () => {
  it('has nine distinct regions', () => expect(new Set(MOOD_PRESETS.map((p) => p.id)).size).toBe(9));
  it('lays the regions out on a 3×3 grid', () => {
    const cells = new Set(MOOD_PRESETS.map((p) => `${p.mood.valence},${p.mood.energy}`));
    expect(cells.size).toBe(9);
  });
});

describe('targetOf', () => {
  it('has no target for any mood', () => expect(targetOf(ANY_MOOD)).toBeNull());
  it('uses the preset point', () => expect(targetOf({ kind: 'preset', id: 'cozy' })).toEqual(presetOf('cozy').mood));
  it('uses a free point as is', () =>
    expect(targetOf({ kind: 'point', mood: { valence: 0.1, energy: -0.2 } })).toEqual({ valence: 0.1, energy: -0.2 }));
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

describe('nearestPreset / choiceLabel', () => {
  it('names a free point after the closest region', () => {
    expect(nearestPreset({ valence: 0.9, energy: 0.9 }).id).toBe('hype');
    expect(choiceLabel({ kind: 'point', mood: { valence: -0.8, energy: -0.7 } })).toBe('Near Melancholy');
  });
  it('labels presets and any', () => {
    expect(choiceLabel({ kind: 'preset', id: 'epic' })).toBe('Epic');
    expect(choiceLabel(ANY_MOOD)).toBe('Any mood');
  });
});

describe('clampMood / isPresetId', () => {
  it('keeps points on the pad', () => expect(clampMood({ valence: 3, energy: -2 })).toEqual({ valence: 1, energy: -1 }));
  it('recognises preset ids', () => {
    expect(isPresetId('chill')).toBe(true);
    expect(isPresetId('sleepy')).toBe(false);
  });
});
