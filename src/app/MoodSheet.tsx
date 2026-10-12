import type { MoodChoice } from '../domain/mood.ts';
import { MoodGrid } from './MoodGrid.tsx';
import { Sheet } from './Sheet.tsx';

type Props = { readonly choice: MoodChoice; readonly onChoose: (choice: MoodChoice) => void; readonly onClose: () => void };

/** The mood pad in a dialog. The new mood takes over at the end of the current loop. */
export const MoodSheet = ({ choice, onChoose, onClose }: Props) => (
  <Sheet
    id="mood-title"
    title="How do you feel?"
    note="The mix glides there when the current loop ends."
    className="mood-sheet"
    onClose={onClose}
  >
    <MoodGrid
      choice={choice}
      onChoose={(c) => {
        onChoose(c);
        onClose();
      }}
    />
  </Sheet>
);
