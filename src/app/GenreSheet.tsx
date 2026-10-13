import type { GenreChoice } from '../domain/genre.ts';
import { GenreGrid } from './GenreGrid.tsx';
import { Sheet } from './Sheet.tsx';

type Props = { readonly choice: GenreChoice; readonly onChoose: (choice: GenreChoice) => void; readonly onClose: () => void };

/** The genre grid in a dialog. The new genre takes over at the end of the current loop. */
export const GenreSheet = ({ choice, onChoose, onClose }: Props) => (
  <Sheet
    id="genre-title"
    title="What do you want to hear?"
    note="The mix moves there when the current loop ends."
    className="genre-sheet"
    onClose={onClose}
  >
    <GenreGrid
      choice={choice}
      onChoose={(c) => {
        onChoose(c);
        onClose();
      }}
    />
  </Sheet>
);
