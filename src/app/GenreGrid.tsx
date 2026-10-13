import { GENRES, type GenreChoice } from '../domain/genre.ts';

type Props = {
  readonly choice: GenreChoice;
  readonly onChoose: (choice: GenreChoice) => void;
  readonly compact?: boolean;
};

const isChosen = (choice: GenreChoice, id: string): boolean => choice.kind === 'genre' && choice.id === id;

/** The nine genres as a 3×3 grid, and every genre at once below them. */
export const GenreGrid = ({ choice, onChoose, compact = false }: Props) => (
  <div className={compact ? 'genre-grid compact' : 'genre-grid'}>
    <fieldset className="genre-cells">
      <legend className="sr-only">Genre</legend>
      {GENRES.map((g) => (
        <button
          key={g.id}
          type="button"
          className={`px-btn chip genre-cell genre-${g.id}`}
          aria-pressed={isChosen(choice, g.id)}
          onClick={() => onChoose({ kind: 'genre', id: g.id })}
        >
          <span className="genre-label">{g.label}</span>
          {compact ? null : <span className="genre-blurb">{g.blurb}</span>}
        </button>
      ))}
    </fieldset>
    <button type="button" className="px-btn chip genre-all" aria-pressed={choice.kind === 'all'} onClick={() => onChoose({ kind: 'all' })}>
      All genres · mix
    </button>
  </div>
);
