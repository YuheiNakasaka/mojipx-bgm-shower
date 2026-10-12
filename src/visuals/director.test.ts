import { describe, expect, it } from 'vitest';
import {
  direct,
  initialDirector,
  phraseBarsOf,
  type SceneMeta,
  setLocked,
  skipScene,
  TRANSITION_MS,
  type TrackMeta,
  transitionOf,
  variantFor,
} from './director.ts';

const scene = (id: string, valence: number, energy: number, styles: readonly string[] = []): SceneMeta => ({
  id,
  mood: { valence, energy },
  styles: styles as SceneMeta['styles'],
  variantMoods: [
    { valence: 0.6, energy },
    { valence: -0.6, energy },
  ],
});
const scenes = [
  scene('calm-a', 0.5, -0.6),
  scene('calm-b', 0.4, -0.5),
  scene('loud-a', 0.4, 0.8, ['neon-rush']),
  scene('loud-b', 0.2, 0.7),
];
const calm: TrackMeta = { id: 't-calm', mood: { valence: 0.5, energy: -0.6 }, style: 'lofi-loop' };
const loud: TrackMeta = { id: 't-loud', mood: { valence: 0.4, energy: 0.8 }, style: 'neon-rush' };

describe('phraseBarsOf / variantFor', () => {
  it('cuts every 8 bars for energetic tracks and 16 for calm ones', () => {
    expect(phraseBarsOf(loud.mood)).toBe(8);
    expect(phraseBarsOf(calm.mood)).toBe(16);
  });
  it('uses the variant nearest the track mood', () => {
    expect(variantFor(scenes[0] as SceneMeta, { valence: 0.7, energy: 0 })).toBe(0);
    expect(variantFor(scenes[0] as SceneMeta, { valence: -0.7, energy: 0 })).toBe(1);
  });
});

describe('direct', () => {
  const start = initialDirector(1, scenes, 0);

  it('keeps the same state when nothing happens', () => expect(direct(start, scenes, null, 0, 10)).toBe(start));

  it('cuts to a new shot when a track starts, starting a transition', () => {
    const s = direct(start, scenes, loud, 0, 1000);
    expect(s.track).toBe('t-loud');
    expect(s.shot.startedAt).toBe(1000);
    expect(s.previous).toEqual(start.shot);
    expect(transitionOf(s, 1000)).toBe(0);
    expect(transitionOf(s, 1000 + TRANSITION_MS / 2)).toBeCloseTo(0.5);
  });

  it('prefers scenes that suit the track', () => {
    let s = start;
    const picks: Record<string, number> = {};
    for (let i = 0; i < 200; i++) {
      s = direct(s, scenes, { ...loud, id: `t${i}` }, 0, i * 10_000);
      picks[s.shot.scene] = (picks[s.shot.scene] ?? 0) + 1;
    }
    expect((picks['loud-a'] ?? 0) + (picks['loud-b'] ?? 0)).toBeGreaterThan(180);
  });

  it('never repeats the scene on screen', () => {
    let s = direct(start, scenes, loud, 0, 0);
    for (let bar = 8; bar < 400; bar += 8) {
      const next = direct(s, scenes, loud, bar, bar * 1000);
      expect(next.shot.scene).not.toBe(s.shot.scene);
      s = next;
    }
  });

  it('cuts on phrase boundaries only', () => {
    const s = direct(start, scenes, loud, 0, 0);
    expect(direct(s, scenes, loud, 7, 5000).shot).toBe(s.shot);
    expect(direct(s, scenes, loud, 8, 6000).shot.startedAt).toBe(6000);
  });

  it('clears the outgoing shot once the transition ends', () => {
    const s = direct(start, scenes, loud, 0, 0);
    expect(direct(s, scenes, loud, 1, TRANSITION_MS).previous).toBeNull();
  });

  it('holds a locked scene, only recoloring it for a new track', () => {
    const locked = setLocked(direct(start, scenes, calm, 0, 0), true);
    const later = direct(locked, scenes, calm, 64, 9000);
    expect(later.shot.scene).toBe(locked.shot.scene);
    const other = direct(locked, scenes, { ...loud, mood: { valence: -0.7, energy: 0.8 } }, 0, 9000);
    expect(other.shot.scene).toBe(locked.shot.scene);
    expect(other.shot.variant).toBe(1);
  });

  it('restarts phrase counting when the same track starts over', () => {
    const s = direct(direct(start, scenes, loud, 0, 0), scenes, loud, 40, 1000);
    const again = direct(s, scenes, loud, 0, 2000);
    expect(again.phrase).toBe(0);
    expect(direct(again, scenes, loud, 8, 3000).shot.startedAt).toBe(3000);
  });

  it('skips to another scene on request', () => {
    const s = direct(start, scenes, loud, 0, 0);
    const skipped = skipScene(s, scenes, loud, 500);
    expect(skipped.shot.scene).not.toBe(s.shot.scene);
    expect(skipped.previous).toEqual(s.shot);
  });
});
