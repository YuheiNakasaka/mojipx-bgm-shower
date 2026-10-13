import { describe, expect, it } from 'vitest';
import { presetOf } from './mood.ts';
import { parseKey } from './music/theory.ts';
import { type Cmd, initialPlayer, loopsFor, type Msg, type PlayerState, type PlayerTrack, update } from './player.ts';

const track = (id: string, preset: Parameters<typeof presetOf>[0], loopSec = 30): PlayerTrack => ({
  id,
  mood: presetOf(preset).mood,
  bpm: 120,
  key: parseKey('C'),
  style: id,
  loopSec,
});

const library = [
  track('cozy-a', 'cozy'),
  track('cozy-b', 'cozy'),
  track('cozy-c', 'cozy'),
  track('hype-a', 'hype'),
  track('hype-b', 'hype'),
];

const run = (s: PlayerState, ...msgs: Msg[]): readonly [PlayerState, readonly Cmd[]] =>
  msgs.reduce<readonly [PlayerState, readonly Cmd[]]>(([state], msg) => update(state, msg, library), [s, []]);

const playing = (): PlayerState => run(initialPlayer(1), { type: 'start', track: 'cozy-a' })[0];

describe('loopsFor', () => {
  it('plays short loops several times', () => expect(loopsFor(track('x', 'cozy', 20))).toBe(8));
  it('plays loops up to two-thirds of the target at least twice', () => expect(loopsFor(track('x', 'cozy', 100))).toBe(2));
  it('plays a song longer than that once', () => expect(loopsFor(track('x', 'cozy', 120))).toBe(1));
});

describe('loop cap', () => {
  it('limits how many loops a track plays', () => {
    const [s] = run(initialPlayer(1, undefined, 1), { type: 'start', track: 'cozy-a' });
    expect(s.loops).toBe(1);
    const [cued, cmds] = run(s, { type: 'heard', at: { track: 'cozy-a', loop: 0 } });
    expect(cued.queued).not.toBeNull();
    expect(cmds[0]?.type).toBe('cue');
  });
  it('never raises the planned loops', () =>
    expect(run(initialPlayer(1, undefined, 99), { type: 'start', track: 'cozy-a' })[0].loops).toBe(5));
});

describe('start', () => {
  it('picks a track and plays it', () => {
    const [s, cmds] = run(initialPlayer(1), { type: 'start' });
    expect(s.status).toBe('playing');
    expect(s.current).not.toBeNull();
    expect(s.history).toEqual([s.current]);
    expect(cmds).toEqual([{ type: 'play', track: s.current }]);
  });
  it('plays an asked track', () => expect(run(initialPlayer(1), { type: 'start', track: 'hype-b' })[0].current).toBe('hype-b'));
  it('picks when the asked track is unknown', () =>
    expect(run(initialPlayer(1), { type: 'start', track: 'nope' })[0].current).not.toBe('nope'));
  it('follows the chosen mood', () => {
    const s = initialPlayer(7, { kind: 'preset', id: 'hype' });
    expect(run(s, { type: 'start' })[0].current?.startsWith('hype')).toBe(true);
  });
});

describe('toggle', () => {
  it('pauses while playing', () =>
    expect(run(playing(), { type: 'toggle' })).toEqual([{ ...playing(), status: 'paused' }, [{ type: 'pause' }]]));
  it('resumes while paused', () => {
    const [s, cmds] = run(playing(), { type: 'toggle' }, { type: 'toggle' });
    expect(s.status).toBe('playing');
    expect(cmds).toEqual([{ type: 'resume' }]);
  });
  it('starts when idle', () => expect(run(initialPlayer(1), { type: 'toggle' })[1][0]?.type).toBe('play'));
});

describe('next / prev / select', () => {
  it('cuts to another track', () => {
    const [s, cmds] = run(playing(), { type: 'next' });
    expect(s.current).not.toBe('cozy-a');
    expect(s.history).toEqual(['cozy-a', s.current]);
    expect(cmds).toEqual([{ type: 'play', track: s.current }]);
  });
  it('resumes when skipping while paused', () => {
    const [s, cmds] = run(playing(), { type: 'toggle' }, { type: 'next' });
    expect(s.status).toBe('playing');
    expect(cmds.map((c) => c.type)).toEqual(['play', 'resume']);
  });
  it('goes back to the previous track', () => {
    const [s, cmds] = run(playing(), { type: 'select', track: 'hype-a' }, { type: 'prev' });
    expect(s.current).toBe('cozy-a');
    expect(s.history).toEqual(['cozy-a']);
    expect(cmds).toEqual([{ type: 'play', track: 'cozy-a' }]);
  });
  it('restarts the only track played so far', () => {
    const [s, cmds] = run(playing(), { type: 'prev' });
    expect(s.current).toBe('cozy-a');
    expect(s.history).toEqual(['cozy-a']);
    expect(cmds).toEqual([{ type: 'play', track: 'cozy-a' }]);
  });
  it('ignores prev before anything played', () => expect(run(initialPlayer(1), { type: 'prev' })[1]).toEqual([]));
  it('plays a selected track', () => expect(run(playing(), { type: 'select', track: 'hype-b' })[0].current).toBe('hype-b'));
  it('ignores an unknown selection', () => expect(run(playing(), { type: 'select', track: 'nope' })).toEqual([playing(), []]));
});

describe('heard (automatic advance)', () => {
  const loops = loopsFor(library[0] as PlayerTrack);
  it('waits while loops remain', () => expect(run(playing(), { type: 'heard', at: { track: 'cozy-a', loop: loops - 2 } })[1]).toEqual([]));
  it('cues the next track during the last loop', () => {
    const [s, cmds] = run(playing(), { type: 'heard', at: { track: 'cozy-a', loop: loops - 1 } });
    expect(s.queued).not.toBeNull();
    expect(s.queued).not.toBe('cozy-a');
    expect(cmds).toEqual([{ type: 'cue', track: s.queued }]);
  });
  it('cues only once', () => {
    const at = { track: 'cozy-a', loop: loops - 1 };
    expect(run(playing(), { type: 'heard', at }, { type: 'heard', at })[1]).toEqual([]);
  });
  it('takes over when the cued track is heard', () => {
    const [cued] = run(playing(), { type: 'heard', at: { track: 'cozy-a', loop: loops - 1 } });
    const [s, cmds] = run(cued, { type: 'heard', at: { track: cued.queued as string, loop: 0 } });
    expect(s.current).toBe(cued.queued);
    expect(s.queued).toBeNull();
    expect(s.history).toEqual(['cozy-a', cued.queued]);
    expect(cmds).toEqual([]);
  });
  it('keeps looping in repeat mode', () => {
    const [s, cmds] = run(playing(), { type: 'setMode', mode: 'repeat' }, { type: 'heard', at: { track: 'cozy-a', loop: 99 } });
    expect(s.queued).toBeNull();
    expect(cmds).toEqual([]);
  });
  it('ignores reports while paused, and empty reports', () => {
    const paused = run(playing(), { type: 'toggle' })[0];
    expect(run(paused, { type: 'heard', at: { track: 'cozy-a', loop: 99 } })).toEqual([paused, []]);
    expect(run(playing(), { type: 'heard', at: null })).toEqual([playing(), []]);
  });
});

describe('setMode', () => {
  it('cancels a waiting track when switching to repeat', () => {
    const [cued] = run(playing(), { type: 'heard', at: { track: 'cozy-a', loop: 99 } });
    const [s, cmds] = run(cued, { type: 'setMode', mode: 'repeat' });
    expect(s.queued).toBeNull();
    expect(cmds).toEqual([{ type: 'cue', track: 'cozy-a' }]);
  });
  it('switches back to shuffle without commands', () => {
    const [s, cmds] = run(playing(), { type: 'setMode', mode: 'repeat' }, { type: 'setMode', mode: 'shuffle' });
    expect(s.mode).toBe('shuffle');
    expect(cmds).toEqual([]);
  });
});

describe('setMood', () => {
  const hype = { kind: 'preset', id: 'hype' } as const;
  it('only remembers the mood while idle', () =>
    expect(run(initialPlayer(1), { type: 'setMood', mood: hype })).toEqual([{ ...initialPlayer(1), mood: hype }, []]));
  it('makes the current loop the last one, so the change lands seamlessly', () => {
    const [s] = run(playing(), { type: 'setMood', mood: hype });
    const [after, cmds] = run(s, { type: 'heard', at: { track: 'cozy-a', loop: 0 } });
    expect(after.queued?.startsWith('hype')).toBe(true);
    expect(cmds[0]?.type).toBe('cue');
  });
  it('re-picks a waiting track for the new mood', () => {
    const [cued] = run(playing(), { type: 'heard', at: { track: 'cozy-a', loop: 99 } });
    const [s, cmds] = run(cued, { type: 'setMood', mood: hype });
    expect(s.queued?.startsWith('hype')).toBe(true);
    expect(cmds).toEqual([{ type: 'cue', track: s.queued }]);
  });
  it('does not interrupt repeat mode', () => {
    const [s, cmds] = run(playing(), { type: 'setMode', mode: 'repeat' }, { type: 'setMood', mood: hype });
    expect(s.mood).toEqual(hype);
    expect(cmds).toEqual([]);
  });
});

describe('empty library', () => {
  it('does nothing', () => expect(update(initialPlayer(1), { type: 'start' }, [])).toEqual([initialPlayer(1), []]));
});
