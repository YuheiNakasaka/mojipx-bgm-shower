// Mood: a point on a plane of valence (dark -1 … bright +1) and energy (calm -1 … energetic +1).
// Songs and scenes carry a mood: the mix drifts between neighbouring moods, and scenes choose their colors by it.

export type Mood = { readonly valence: number; readonly energy: number };

export const moodDistance = (a: Mood, b: Mood): number => Math.hypot(a.valence - b.valence, a.energy - b.energy);

/** How well two moods match, from 1 (same point) toward 0, as a Gaussian of their distance. */
export const affinity = (a: Mood, b: Mood, spread: number): number => Math.exp(-(moodDistance(a, b) ** 2) / (2 * spread * spread));
