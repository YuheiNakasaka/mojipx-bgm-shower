import { useEffect, useRef } from 'react';
import type { MoodChoice } from '../domain/mood.ts';
import { MoodGrid } from './MoodGrid.tsx';

type Props = { readonly choice: MoodChoice; readonly onChoose: (choice: MoodChoice) => void; readonly onClose: () => void };

/** A dialog with the mood pad. The new mood takes over at the end of the current loop. */
export const MoodSheet = ({ choice, onChoose, onClose }: Props) => {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);
  return (
    <dialog ref={ref} className="px-frame panel mood-sheet" aria-labelledby="mood-title" onClose={onClose} onCancel={onClose}>
      <h2 id="mood-title">How do you feel?</h2>
      <p className="fine">The mix glides there when the current loop ends.</p>
      <MoodGrid
        choice={choice}
        onChoose={(c) => {
          onChoose(c);
          onClose();
        }}
      />
      <button type="button" className="px-btn chip close" onClick={onClose}>
        Close
      </button>
    </dialog>
  );
};
