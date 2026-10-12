// A seeded pseudo-random generator (mulberry32) kept as plain data.
// Drawing a number returns it together with the next state, so every choice is reproducible from a seed.

export type Rng = { readonly state: number };

export const rngOf = (seed: number): Rng => ({ state: seed >>> 0 });

/** A float in [0, 1) and the next generator state. */
export const nextFloat = (rng: Rng): readonly [number, Rng] => {
  const state = (rng.state + 0x6d2b79f5) >>> 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, { state }];
};

/** An integer in [0, n) and the next generator state. */
export const nextInt = (rng: Rng, n: number): readonly [number, Rng] => {
  const [x, next] = nextFloat(rng);
  return [Math.min(n - 1, Math.floor(x * n)), next];
};

/**
 * Picks one item with probability proportional to its weight.
 * Non-positive weights are never picked; if every weight is non-positive the pick is uniform.
 */
export const pickWeighted = <T>(rng: Rng, items: readonly T[], weightOf: (item: T) => number): readonly [T, Rng] => {
  if (items.length === 0) throw new Error('pickWeighted needs at least one item');
  const weights = items.map((item) => Math.max(0, weightOf(item)));
  const total = weights.reduce((a, b) => a + b, 0);
  const [x, next] = nextFloat(rng);
  if (total <= 0) return [items[Math.min(items.length - 1, Math.floor(x * items.length))] as T, next];
  let rest = x * total;
  const index = weights.findIndex((w) => {
    rest -= w;
    return rest < 0;
  });
  return [items[index === -1 ? weights.findLastIndex((w) => w > 0) : index] as T, next];
};
