import { Pixel } from 'mojipx/react';
import type { Track } from '../domain/catalog.ts';
import { choiceLabel } from '../domain/genre.ts';
import type { Msg, PlayerState } from '../domain/player.ts';
import { FULLSCREEN, ICON_PALETTE, NEXT, PAUSE, PLAY, PREV, SPEAKER } from './icons.ts';
import type { Shared } from './share.ts';

type Props = {
  readonly player: PlayerState;
  readonly track: Track | null;
  /** The track cued to take over at the end of this loop. */
  readonly next: Track | null;
  readonly loop: number;
  readonly sceneTitle: string;
  readonly locked: boolean;
  /** How the last share went, shown for a moment. */
  readonly shared: Shared | null;
  readonly volume: number;
  readonly canFullscreen: boolean;
  readonly onMsg: (msg: Msg) => void;
  readonly onGenre: () => void;
  readonly onTracks: () => void;
  readonly onSkipScene: () => void;
  readonly onLock: () => void;
  readonly onShare: () => void;
  readonly onVolume: (volume: number) => void;
  readonly onFullscreen: () => void;
  /** The pointer rests on (true) or leaves (false) the controls. */
  readonly onHold: (held: boolean) => void;
};

const loopText = (player: PlayerState, track: Track | null, next: Track | null, loop: number): string => {
  if (!track) return '';
  if (player.mode === 'repeat') return 'Repeating';
  if (next) return `Up next: ${next.title}`;
  return `Loop ${Math.min(loop + 1, player.loops)} of ${Math.max(player.loops, loop + 1)}`;
};

const SHARED_NOTE: Readonly<Record<Shared, string>> = { shared: 'Shared', copied: 'Link copied', dismissed: '' };

const IconButton = ({
  label,
  sprite,
  onClick,
  big = false,
}: {
  label: string;
  sprite: readonly string[];
  onClick: () => void;
  big?: boolean;
}) => (
  <button type="button" className={big ? 'px-btn gold icon big' : 'px-btn chip icon'} aria-label={label} title={label} onClick={onClick}>
    <Pixel sprite={sprite} palette={ICON_PALETTE} scale={big ? 4 : 3} />
  </button>
);

/** A text button whose label shortens on narrow screens; the accessible name stays the full label. */
const Chip = ({
  label,
  short,
  onClick,
  pressed,
  dialog = false,
}: {
  label: string;
  short: string;
  onClick: () => void;
  pressed?: boolean;
  dialog?: boolean;
}) => (
  <button
    type="button"
    className="px-btn chip"
    aria-label={label}
    aria-pressed={pressed}
    aria-haspopup={dialog ? 'dialog' : undefined}
    onClick={onClick}
  >
    <span className="chip-long">{label}</span>
    <span className="chip-short" aria-hidden="true">
      {short}
    </span>
  </button>
);

export const Hud = (p: Props) => {
  const playing = p.player.status === 'playing';
  const repeat = p.player.mode === 'repeat';
  return (
    <>
      <header
        className="px-frame panel now-playing"
        aria-live="polite"
        onPointerEnter={() => p.onHold(true)}
        onPointerLeave={() => p.onHold(false)}
      >
        <p className="eyebrow" data-testid="status">
          {playing ? 'Now playing' : 'Paused'}
        </p>
        <h2 className="track-title" data-testid="track-title">
          {p.track?.title ?? '—'}
        </h2>
        <p className="meta">{p.track ? `${p.track.styleLabel} · ${p.track.bpm} BPM · ${p.track.keyLabel}` : ''}</p>
        <p className="meta dim">
          <span data-testid="loop-text">{loopText(p.player, p.track, p.next, p.loop)}</span> · Scene:{' '}
          <span data-testid="scene-title">{p.sceneTitle}</span>
        </p>
      </header>
      <nav
        className="px-frame panel controls"
        aria-label="Player controls"
        onPointerEnter={() => p.onHold(true)}
        onPointerLeave={() => p.onHold(false)}
      >
        <div className="transport">
          <IconButton label="Previous track" sprite={PREV} onClick={() => p.onMsg({ type: 'prev' })} />
          <IconButton label={playing ? 'Pause' : 'Play'} sprite={playing ? PAUSE : PLAY} onClick={() => p.onMsg({ type: 'toggle' })} big />
          <IconButton label="Next track" sprite={NEXT} onClick={() => p.onMsg({ type: 'next' })} />
          {p.canFullscreen ? <IconButton label="Full screen" sprite={FULLSCREEN} onClick={p.onFullscreen} /> : null}
        </div>
        <div className="options">
          <Chip
            label={repeat ? 'Repeat one' : 'Shuffle'}
            short={repeat ? 'Repeat 1' : 'Shuffle'}
            pressed={repeat}
            onClick={() => p.onMsg({ type: 'setMode', mode: repeat ? 'shuffle' : 'repeat' })}
          />
          <Chip label={`Genre: ${choiceLabel(p.player.genre)}`} short="Genre" onClick={p.onGenre} dialog />
          <Chip label="Tracks" short="Tracks" onClick={p.onTracks} dialog />
          <Chip label="Next scene" short="Scene" onClick={p.onSkipScene} />
          <Chip
            label={p.locked ? 'Scene locked' : 'Lock scene'}
            short={p.locked ? 'Locked' : 'Lock'}
            onClick={p.onLock}
            pressed={p.locked}
          />
          <Chip label="Share" short="Share" onClick={p.onShare} />
          <label className="volume">
            <Pixel sprite={SPEAKER} palette={ICON_PALETTE} scale={3} title="Volume" />
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(p.volume * 100)}
              aria-label="Volume"
              onChange={(e) => p.onVolume(Number(e.target.value) / 100)}
            />
          </label>
        </div>
        <p className="px-frame panel share-note" role="status">
          {p.shared ? SHARED_NOTE[p.shared] : ''}
        </p>
      </nav>
    </>
  );
};
