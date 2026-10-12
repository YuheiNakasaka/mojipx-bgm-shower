import { describe, expect, it } from 'vitest';
import { DEFAULT_PREFS, parsePrefs } from './prefs.ts';

describe('parsePrefs', () => {
  it('reads saved preferences', () => {
    const saved = { mood: { kind: 'preset', id: 'cozy' }, mode: 'repeat', volume: 0.4 };
    expect(parsePrefs(saved)).toEqual(saved);
    expect(parsePrefs(DEFAULT_PREFS)).toEqual(DEFAULT_PREFS);
  });
  it('rejects anything malformed', () => {
    expect(parsePrefs(null)).toBeNull();
    expect(parsePrefs({ ...DEFAULT_PREFS, mood: { kind: 'preset', id: 'sleepy' } })).toBeNull();
    expect(parsePrefs({ ...DEFAULT_PREFS, mode: 'loop' })).toBeNull();
    expect(parsePrefs({ ...DEFAULT_PREFS, volume: 3 })).toBeNull();
  });
});
