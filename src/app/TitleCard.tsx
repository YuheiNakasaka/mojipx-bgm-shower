import type { Track } from '../domain/catalog.ts';

/** A title card that slides in when a track starts, then fades; give it the track id as key so it replays. */
export const TitleCard = ({ track }: { readonly track: Track }) => (
  <div className="title-card" aria-hidden="true">
    <span className="title-card-eyebrow">Now playing</span>
    <span className="title-card-title">{track.title}</span>
    <span className="title-card-meta">
      {track.styleLabel} · {track.keyLabel}
    </span>
  </div>
);
