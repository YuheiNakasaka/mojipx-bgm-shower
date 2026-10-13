import type { Track } from '../domain/catalog.ts';
import { GENRES } from '../domain/genre.ts';
import { Sheet } from './Sheet.tsx';

type Props = {
  readonly tracks: readonly Track[];
  readonly current: string | null;
  readonly onSelect: (id: string) => void;
  readonly onClose: () => void;
};

/** Every track, grouped by genre. Picking one plays it now. */
export const TrackSheet = ({ tracks, current, onSelect, onClose }: Props) => {
  const groups = GENRES.map((genre) => ({ genre, tracks: tracks.filter((t) => t.genre === genre.id) })).filter((g) => g.tracks.length > 0);
  return (
    <Sheet
      id="tracks-title"
      title="All tracks"
      note={`${tracks.length} original tracks. Pick one to play it now; the mix carries on from there.`}
      className="track-sheet"
      onClose={onClose}
    >
      <div className="track-groups">
        {groups.map((g) => (
          <section key={g.genre.id} className="track-group" aria-label={g.genre.label}>
            <h3>{g.genre.label}</h3>
            <ul>
              {g.tracks.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className="track-row"
                    aria-current={t.id === current ? 'true' : undefined}
                    onClick={() => {
                      onSelect(t.id);
                      onClose();
                    }}
                  >
                    <span className="track-name">{t.title}</span>
                    <span className="track-meta">
                      {t.styleLabel} · {t.bpm} BPM
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Sheet>
  );
};
