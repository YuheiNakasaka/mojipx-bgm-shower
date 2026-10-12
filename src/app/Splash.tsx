import type { MoodChoice } from '../domain/mood.ts';
import { MoodGrid } from './MoodGrid.tsx';

type Props = {
  readonly mood: MoodChoice;
  readonly trackCount: number;
  readonly sceneCount: number;
  readonly onMood: (choice: MoodChoice) => void;
  readonly onStart: () => void;
};

export const Splash = ({ mood, trackCount, sceneCount, onMood, onStart }: Props) => (
  <main className="splash">
    <section className="px-frame panel splash-panel" aria-labelledby="title">
      <h1 id="title" className="logo">
        <span>BGM</span> <span>SHOWER</span>
      </h1>
      <p className="tagline">Endless original chiptune with full-screen pixel visuals. Pick a mood and let it rain.</p>
      <MoodGrid choice={mood} onChoose={onMood} compact />
      <button type="button" className="px-btn gold start" onClick={onStart}>
        Press start
      </button>
      <p className="fine">
        {trackCount} tracks · {sceneCount} scenes · made in the browser, no downloads. Headphones recommended.
      </p>
    </section>
  </main>
);
