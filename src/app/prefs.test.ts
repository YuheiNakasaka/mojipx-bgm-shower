import { describe, expect, it } from 'vitest';
import { DEFAULT_PREFS, parsePrefs } from './prefs.ts';

describe('parsePrefs', () => {
  it('reads saved preferences', () => {
    const saved = { genre: { kind: 'genre', id: 'idol' }, mode: 'repeat', volume: 0.4 };
    expect(parsePrefs(saved)).toEqual(saved);
    expect(parsePrefs(DEFAULT_PREFS)).toEqual(DEFAULT_PREFS);
  });
  it('rejects what is not a record', () => {
    expect(parsePrefs(null)).toBeNull();
    expect(parsePrefs('idol')).toBeNull();
  });
  it('falls back to the default for each malformed preference, keeping the others', () => {
    expect(parsePrefs({ ...DEFAULT_PREFS, genre: { kind: 'genre', id: 'polka' } })).toEqual(DEFAULT_PREFS);
    expect(parsePrefs({ ...DEFAULT_PREFS, mode: 'loop', volume: 0.3 })).toEqual({ ...DEFAULT_PREFS, volume: 0.3 });
    expect(parsePrefs({ ...DEFAULT_PREFS, volume: 3 })).toEqual(DEFAULT_PREFS);
  });
  it('keeps the mode and volume saved by the version that asked for a mood', () =>
    expect(parsePrefs({ mood: { kind: 'preset', id: 'cozy' }, mode: 'repeat', volume: 0.5 })).toEqual({
      genre: DEFAULT_PREFS.genre,
      mode: 'repeat',
      volume: 0.5,
    }));
});
