import type { Track } from '../domain/catalog.ts';

type Props = {
  readonly track: Track;
  /** The scene the link locks, drawn behind this card, if it names one. */
  readonly sceneTitle: string | null;
  readonly repeat: boolean;
  readonly onStart: () => void;
};

/** The splash for a link to a track: what is about to play, and the tap browsers need before they make a sound. */
export const SharedSplash = ({ track, sceneTitle, repeat, onStart }: Props) => (
  <main className="splash">
    <section className="px-frame panel splash-panel" aria-labelledby="title">
      <h1 id="title" className="logo small">
        <span>BGM</span> <span>SHOWER</span>
      </h1>
      <div className="shared-pair">
        <p className="eyebrow">Shared with you</p>
        <h2 className="track-title" data-testid="shared-track">
          {track.title}
        </h2>
        <p className="meta">
          {track.styleLabel} · {track.bpm} BPM · {track.keyLabel}
        </p>
        {sceneTitle ? <p className="meta dim">Scene: {sceneTitle}</p> : null}
      </div>
      <p className="tagline">{repeat ? 'It stays on repeat until you change it.' : 'Then the mix carries on.'}</p>
      <button type="button" className="px-btn gold start" onClick={onStart}>
        Press start
      </button>
      <p className="fine">
        Sound starts when you press start. Headphones recommended. <a href={window.location.pathname}>Pick a genre instead</a>
      </p>
    </section>
  </main>
);
