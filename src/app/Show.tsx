import type { DrawFill } from 'mojipx/react';
import { PixelFill } from 'mojipx/react';
import type { RefObject } from 'react';
import type { Catalog } from '../domain/catalog.ts';
import { drawShow } from '../visuals/compositor.ts';
import { type DirectorState, direct } from '../visuals/director.ts';
import { pulseOf } from '../visuals/pulse.ts';
import type { Scene } from '../visuals/scene.ts';
import type { Engine } from './engine.ts';
import { metaOf } from './hooks.ts';

type Props = {
  readonly engine: Engine;
  readonly catalog: Catalog;
  readonly scenes: readonly Scene[];
  readonly sceneMap: ReadonlyMap<string, Scene>;
  readonly director: RefObject<DirectorState>;
  /** The player's current track, used while nothing is heard yet. */
  readonly currentId: string | null;
  readonly label: string;
  readonly onShot: (sceneId: string) => void;
};

/** The full-screen pixel show, redrawn every animation frame in step with what is heard. */
export const Show = ({ engine, catalog, scenes, sceneMap, director, currentId, label, onShot }: Props) => {
  const draw: DrawFill = (ctx, clock, size) => {
    const pos = engine.position();
    const track = catalog.byId.get(pos?.track ?? currentId ?? '') ?? null;
    const pulse = pulseOf(track, pos, clock.now / 1000);
    const before = director.current.shot.scene;
    director.current = direct(director.current, scenes, track ? metaOf(track) : null, pulse.bar, clock.now);
    if (director.current.shot.scene !== before) onShot(director.current.shot.scene);
    drawShow(ctx, {
      scenes: sceneMap,
      director: director.current,
      pulse,
      energy: track ? (track.mood.energy + 1) / 2 : 0.4,
      w: size.width,
      h: size.height,
      now: clock.now,
    });
  };
  return <PixelFill short={180} label={label} draw={draw} className="show" testId="show" />;
};
