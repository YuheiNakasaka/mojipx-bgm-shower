import type { Catalog, Track } from '../domain/catalog.ts';
import type { MoodChoice } from '../domain/mood.ts';
import type { Msg, PlayerState } from '../domain/player.ts';
import { MoodSheet } from './MoodSheet.tsx';
import { TitleCard } from './TitleCard.tsx';
import { TrackSheet } from './TrackSheet.tsx';

export type SheetName = 'mood' | 'tracks';

type Props = {
  readonly catalog: Catalog;
  readonly player: PlayerState;
  readonly track: Track | null;
  readonly sheet: SheetName | null;
  readonly onMsg: (msg: Msg) => void;
  readonly onClose: () => void;
};

/** What floats above the show: the title card of a new track and the open dialog, if any. */
export const Overlays = ({ catalog, player, track, sheet, onMsg, onClose }: Props) => {
  const chooseMood = (mood: MoodChoice) => onMsg({ type: 'setMood', mood });
  return (
    <>
      {player.status !== 'idle' && track ? <TitleCard key={track.id} track={track} /> : null}
      {sheet === 'mood' ? <MoodSheet choice={player.mood} onChoose={chooseMood} onClose={onClose} /> : null}
      {sheet === 'tracks' ? (
        <TrackSheet
          tracks={catalog.tracks}
          current={player.current}
          onSelect={(id) => onMsg({ type: 'select', track: id })}
          onClose={onClose}
        />
      ) : null}
    </>
  );
};
