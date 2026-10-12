// Mood: a point on a plane of valence (dark -1 … bright +1) and energy (calm -1 … energetic +1).
// Songs and scenes carry a mood; the listener picks a point (or "any") and both are drawn toward it.

export type Mood = { readonly valence: number; readonly energy: number };

const LOW = -0.66;
const HIGH = 0.66;

/** Nine named regions laid out as a 3×3 pad: rows are energy (high → low), columns are valence (dark → bright). */
export const MOOD_PRESETS = [
  { id: 'tense', label: 'Tense', mood: { valence: LOW, energy: HIGH }, blurb: 'Boss fights and racing heartbeats' },
  { id: 'epic', label: 'Epic', mood: { valence: 0, energy: HIGH }, blurb: 'Quests, journeys, big skies' },
  { id: 'hype', label: 'Hype', mood: { valence: HIGH, energy: HIGH }, blurb: 'Fast, loud, dance-floor bright' },
  { id: 'mystery', label: 'Mystery', mood: { valence: LOW, energy: 0 }, blurb: 'Caves, ruins, neon alleys' },
  { id: 'nostalgic', label: 'Nostalgic', mood: { valence: 0, energy: 0 }, blurb: 'Bittersweet tunes from another decade' },
  { id: 'happy', label: 'Happy', mood: { valence: HIGH, energy: 0 }, blurb: 'Sunny towns and bouncy steps' },
  { id: 'melancholy', label: 'Melancholy', mood: { valence: LOW, energy: LOW }, blurb: 'Rainy windows, quiet goodbyes' },
  { id: 'chill', label: 'Chill', mood: { valence: 0, energy: LOW }, blurb: 'Late-night loops to drift along' },
  { id: 'cozy', label: 'Cozy', mood: { valence: HIGH, energy: LOW }, blurb: 'Warm villages and lazy afternoons' },
] as const satisfies readonly { id: string; label: string; mood: Mood; blurb: string }[];

export type MoodPreset = (typeof MOOD_PRESETS)[number];
export type MoodPresetId = MoodPreset['id'];

/** What the listener asked for: anything, a named region, or a free point on the pad. */
export type MoodChoice =
  | { readonly kind: 'any' }
  | { readonly kind: 'preset'; readonly id: MoodPresetId }
  | { readonly kind: 'point'; readonly mood: Mood };

export const ANY_MOOD: MoodChoice = { kind: 'any' };

const clampUnit = (x: number): number => Math.min(1, Math.max(-1, x));

export const clampMood = (m: Mood): Mood => ({ valence: clampUnit(m.valence), energy: clampUnit(m.energy) });

export const presetOf = (id: MoodPresetId): MoodPreset => MOOD_PRESETS.find((p) => p.id === id) ?? MOOD_PRESETS[4];

export const isPresetId = (id: string): id is MoodPresetId => MOOD_PRESETS.some((p) => p.id === id);

/** The target point of a choice, or null when any mood is fine. */
export const targetOf = (choice: MoodChoice): Mood | null => {
  if (choice.kind === 'any') return null;
  return choice.kind === 'preset' ? presetOf(choice.id).mood : choice.mood;
};

export const moodDistance = (a: Mood, b: Mood): number => Math.hypot(a.valence - b.valence, a.energy - b.energy);

/** How well two moods match, from 1 (same point) toward 0, as a Gaussian of their distance. */
export const affinity = (a: Mood, b: Mood, spread: number): number => Math.exp(-(moodDistance(a, b) ** 2) / (2 * spread * spread));

/** The named region closest to a point. */
export const nearestPreset = (m: Mood): MoodPreset =>
  MOOD_PRESETS.reduce((best, p) => (moodDistance(p.mood, m) < moodDistance(best.mood, m) ? p : best), MOOD_PRESETS[0] as MoodPreset);

export const choiceLabel = (choice: MoodChoice): string => {
  if (choice.kind === 'any') return 'Any mood';
  if (choice.kind === 'preset') return presetOf(choice.id).label;
  return `Near ${nearestPreset(choice.mood).label}`;
};
