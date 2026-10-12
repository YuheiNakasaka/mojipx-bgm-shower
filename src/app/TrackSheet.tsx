import type { Track } from '../domain/catalog.ts';
import { MOOD_PRESETS, nearestPreset } from '../domain/mood.ts';
import { Sheet } from './Sheet.tsx';

type Props = {
  readonly tracks: readonly Track[];
  readonly current: string | null;
  readonly onSelect: (id: string) => void;
  readonly onClose: () => void;
};

/** Every track, grouped by the mood it sits nearest. Picking one plays it now. */
export const TrackSheet = ({ tracks, current, onSelect, onClose }: Props) => {
  const groups = MOOD_PRESETS.map((preset) => ({ preset, tracks: tracks.filter((t) => nearestPreset(t.mood).id === preset.id) })).filter(
    (g) => g.tracks.length > 0,
  );
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
          <section key={g.preset.id} className="track-group" aria-label={g.preset.label}>
            <h3>{g.preset.label}</h3>
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
