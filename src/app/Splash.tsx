import type { GenreChoice } from '../domain/genre.ts';
import { GenreGrid } from './GenreGrid.tsx';

type Props = {
  readonly genre: GenreChoice;
  readonly trackCount: number;
  readonly sceneCount: number;
  readonly onGenre: (choice: GenreChoice) => void;
  readonly onStart: () => void;
};

export const Splash = ({ genre, trackCount, sceneCount, onGenre, onStart }: Props) => (
  <main className="splash">
    <section className="px-frame panel splash-panel" aria-labelledby="title">
      <h1 id="title" className="logo">
        <span>BGM</span> <span>SHOWER</span>
      </h1>
      <p className="tagline">Endless original chiptune with full-screen pixel visuals. Pick a genre and let it rain.</p>
      <GenreGrid choice={genre} onChoose={onGenre} compact />
      <button type="button" className="px-btn gold start" onClick={onStart}>
        Press start
      </button>
      <p className="fine">
        {trackCount} tracks · {sceneCount} scenes · made in the browser, no downloads. Headphones recommended.
      </p>
    </section>
  </main>
);
