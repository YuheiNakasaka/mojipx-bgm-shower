import { describe, expect, it } from 'vitest';
import { presetOf } from './mood.ts';
import { parseKey } from './music/theory.ts';
import { rngOf } from './rng.ts';
import { arcOf, type Candidate, freshness, keyFit, pickNext, tempoFit, weightOf } from './selection.ts';

const c = (id: string, mood: Candidate['mood'], bpm = 120, key = 'C', style = 's'): Candidate => ({
  id,
  mood,
  bpm,
  key: parseKey(key),
  style,
});
const cozy = presetOf('cozy').mood;
const hype = presetOf('hype').mood;

describe('tempoFit', () => {
  it('is 1 for the same tempo', () => expect(tempoFit(120, 120)).toBe(1));
  it('prefers nearer tempos', () => expect(tempoFit(120, 126)).toBeGreaterThan(tempoFit(120, 150)));
  it('treats half and double time as close', () => expect(tempoFit(80, 160)).toBe(1));
  it('never drops below 0.15', () => expect(tempoFit(120, 170)).toBeGreaterThanOrEqual(0.15));
});

describe('keyFit', () => {
  it('prefers the same key, then neighbours on the circle of fifths', () => {
    expect(keyFit(parseKey('C'), parseKey('C'))).toBe(1);
    expect(keyFit(parseKey('C'), parseKey('G'))).toBeGreaterThan(keyFit(parseKey('C'), parseKey('D')));
    expect(keyFit(parseKey('C'), parseKey('F#'))).toBeGreaterThanOrEqual(0.35);
  });
});

describe('freshness', () => {
  it('is 1 for tracks never played', () => expect(freshness('a', ['b', 'c'], 20)).toBe(1));
  it('blocks recent tracks', () => expect(freshness('a', ['a', 'b', 'c'], 20)).toBe(0));
  it('recovers with age', () => {
    const history = ['a', ...Array.from({ length: 12 }, (_, i) => `x${i}`)];
    expect(freshness('a', history, 20)).toBeGreaterThan(0);
    expect(freshness('a', history, 20)).toBeLessThan(1);
  });
  it('blocks fewer tracks in a small library', () => expect(freshness('a', ['a', 'b', 'c'], 4)).toBeGreaterThan(0));
});

describe('weightOf', () => {
  const library = [c('near', cozy), c('far', hype)];
  it('never weights the current track', () =>
    expect(weightOf(library[0] as Candidate, { library, target: null, current: library[0] as Candidate, history: [] }, true)).toBe(0));
  it('favours the asked mood', () => {
    const input = { library, target: cozy, current: null, history: [] };
    expect(weightOf(library[0] as Candidate, input, true)).toBeGreaterThan(weightOf(library[1] as Candidate, input, true) * 50);
  });
  it('drifts from the current mood when any mood is fine', () => {
    const current = c('now', cozy);
    const input = { library: [...library, current], target: null, current, history: ['now'] };
    expect(weightOf(library[0] as Candidate, input, true)).toBeGreaterThan(weightOf(library[1] as Candidate, input, true));
  });
  it('discourages the same style twice in a row, and more so three times', () => {
    const [a, b, e] = ['a', 'b', 'e'].map((id) => c(id, cozy, 120, 'C', 'waltz')) as [Candidate, Candidate, Candidate];
    const d = c('d', cozy, 120, 'C', 'other');
    const library = [a, b, d, e];
    const input = (history: readonly string[]) => ({ library, target: cozy, current: a, history });
    const other = weightOf(d, input(['e', 'a']), true);
    const second = weightOf(b, input(['d', 'a']), true);
    const third = weightOf(b, input(['e', 'a']), true);
    expect(second).toBeLessThan(other);
    expect(third).toBeLessThan(second);
  });
});

describe('arcOf', () => {
  it('keeps valence and bends energy within ±0.15', () => {
    const arc = Array.from({ length: 6 }, (_, i) => arcOf(cozy, i));
    expect(arc.every((m) => m.valence === cozy.valence)).toBe(true);
    expect(Math.max(...arc.map((m) => m.energy)) - cozy.energy).toBeCloseTo(0.13, 1);
  });
});

describe('pickNext', () => {
  const library = [
    c('cozy-1', cozy, 100, 'F'),
    c('cozy-2', { valence: 0.6, energy: -0.6 }, 104, 'C'),
    c('cozy-3', { valence: 0.7, energy: -0.5 }, 96, 'Bb'),
    c('hype-1', hype, 150, 'E'),
    c('hype-2', hype, 155, 'A'),
  ];

  it('is reproducible from the seed', () => {
    const input = { library, target: cozy, current: null, history: [] };
    expect(pickNext(rngOf(5), input)[0].id).toBe(pickNext(rngOf(5), input)[0].id);
  });

  it('mostly stays inside the asked mood', () => {
    let rng = rngOf(1);
    let inside = 0;
    for (let i = 0; i < 300; i++) {
      const [pick, next] = pickNext(rng, { library, target: cozy, current: null, history: [] });
      if (pick.id.startsWith('cozy')) inside++;
      rng = next;
    }
    expect(inside / 300).toBeGreaterThan(0.97);
  });

  it('never repeats the current track, and avoids recent ones while others fit', () => {
    let rng = rngOf(2);
    let history: readonly string[] = ['cozy-1'];
    for (let i = 0; i < 30; i++) {
      const current = library.find((x) => x.id === history.at(-1)) ?? null;
      const [pick, next] = pickNext(rng, { library, target: cozy, current, history });
      expect(pick.id).not.toBe(current?.id);
      history = [...history, pick.id];
      rng = next;
    }
    const cozyRun = history.filter((id) => id.startsWith('cozy'));
    expect(cozyRun.slice(1).every((id, i) => id !== cozyRun[i])).toBe(true);
  });

  it('still returns something when every track was played recently', () => {
    const [pick] = pickNext(rngOf(3), {
      library: library.slice(0, 2),
      target: cozy,
      current: library[0] as Candidate,
      history: ['cozy-2', 'cozy-1'],
    });
    expect(pick.id).toBe('cozy-2');
  });

  it('can play a one-track library forever', () => {
    const solo = [library[0] as Candidate];
    expect(pickNext(rngOf(4), { library: solo, target: null, current: solo[0] as Candidate, history: ['cozy-1'] })[0].id).toBe('cozy-1');
  });
});
