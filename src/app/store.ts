// A minimal external store for React's useSyncExternalStore: the state is replaced, never mutated.
export type Store<S, M> = {
  readonly get: () => S;
  readonly dispatch: (msg: M) => void;
  readonly subscribe: (listener: () => void) => () => void;
};

export const createStore = <S, M>(initial: S, step: (state: S, msg: M) => S): Store<S, M> => {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    dispatch: (msg) => {
      const next = step(state, msg);
      if (next === state) return;
      state = next;
      for (const l of listeners) l();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};
