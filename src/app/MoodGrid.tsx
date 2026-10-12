import { MOOD_PRESETS, type MoodChoice } from '../domain/mood.ts';

type Props = {
  readonly choice: MoodChoice;
  readonly onChoose: (choice: MoodChoice) => void;
  readonly compact?: boolean;
};

const isChosen = (choice: MoodChoice, id: string): boolean => choice.kind === 'preset' && choice.id === id;

/** The 3×3 mood pad: energy rises upward, brightness grows to the right. */
export const MoodGrid = ({ choice, onChoose, compact = false }: Props) => (
  <div className={compact ? 'mood-grid compact' : 'mood-grid'}>
    <fieldset className="mood-cells">
      <legend className="sr-only">Mood</legend>
      {MOOD_PRESETS.map((p) => (
        <button
          key={p.id}
          type="button"
          className={`px-btn chip mood-cell mood-${p.id}`}
          aria-pressed={isChosen(choice, p.id)}
          onClick={() => onChoose({ kind: 'preset', id: p.id })}
        >
          <span className="mood-label">{p.label}</span>
          {compact ? null : <span className="mood-blurb">{p.blurb}</span>}
        </button>
      ))}
    </fieldset>
    <div className="mood-axes" aria-hidden="true">
      <span className="axis-y">Energy ↑</span>
      <span className="axis-x">Dark ← → Bright</span>
    </div>
    <button type="button" className="px-btn chip mood-any" aria-pressed={choice.kind === 'any'} onClick={() => onChoose({ kind: 'any' })}>
      Any mood · drift
    </button>
  </div>
);
