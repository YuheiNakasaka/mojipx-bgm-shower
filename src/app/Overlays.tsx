import type { Catalog, Track } from '../domain/catalog.ts';
import type { GenreChoice } from '../domain/genre.ts';
import type { Msg, PlayerState } from '../domain/player.ts';
import { GenreSheet } from './GenreSheet.tsx';
import { TitleCard } from './TitleCard.tsx';
import { TrackSheet } from './TrackSheet.tsx';

export type SheetName = 'genre' | 'tracks';

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
  const chooseGenre = (genre: GenreChoice) => onMsg({ type: 'setGenre', genre });
  return (
    <>
      {player.status !== 'idle' && track ? <TitleCard key={track.id} track={track} /> : null}
      {sheet === 'genre' ? <GenreSheet choice={player.genre} onChoose={chooseGenre} onClose={onClose} /> : null}
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
