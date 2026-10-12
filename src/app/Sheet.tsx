import { type ReactNode, useEffect, useRef } from 'react';

type Props = {
  readonly id: string;
  readonly title: string;
  readonly note: ReactNode;
  readonly className?: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
};

/** A modal dialog in a pixel frame, opened on mount; Escape, the backdrop's cancel and Close all close it. */
export const Sheet = ({ id, title, note, className, onClose, children }: Props) => {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);
  return (
    <dialog ref={ref} className={`px-frame panel sheet ${className ?? ''}`} aria-labelledby={id} onClose={onClose} onCancel={onClose}>
      <h2 id={id}>{title}</h2>
      <p className="fine">{note}</p>
      {children}
      <button type="button" className="px-btn chip close" onClick={onClose}>
        Close
      </button>
    </dialog>
  );
};
