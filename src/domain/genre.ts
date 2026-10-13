// Genres: what kind of music the listener asks for. Every style belongs to one genre (styles.ts), so every song does.
// The listener picks one genre, or all of them, and the mix stays inside it.

/** Nine genres, laid out as a 3×3 grid in this order. */
export const GENRES = [
  { id: 'idol', label: 'Idol', blurb: 'Disco idols and kawaii stages' },
  { id: 'vocal-synth', label: 'Vocal Synth', blurb: 'Fast, high, sung by machines' },
  { id: 'retro-pop', label: 'Retro Pop', blurb: 'Showa ballads, band rock, 90s hits' },
  { id: 'city-pop', label: 'City Pop', blurb: 'Night drives and seventh chords' },
  { id: 'dance', label: 'Dance', blurb: 'Techno pop, eurobeat, trance' },
  { id: 'arcade', label: 'Arcade', blurb: 'Shooters, bosses, puzzles' },
  { id: 'rpg', label: 'RPG', blurb: 'Quests, dungeons, world maps' },
  { id: 'folk', label: 'Folk', blurb: 'Villages, festivals, islands' },
  { id: 'chill', label: 'Chill', blurb: 'Lo-fi loops and snowy quiet' },
] as const satisfies readonly { id: string; label: string; blurb: string }[];

export type Genre = (typeof GENRES)[number];
export type GenreId = Genre['id'];

/** What the listener asked for: every genre, or one. */
export type GenreChoice = { readonly kind: 'all' } | { readonly kind: 'genre'; readonly id: GenreId };

export const ALL_GENRES: GenreChoice = { kind: 'all' };

export const isGenreId = (id: string): id is GenreId => GENRES.some((g) => g.id === id);

export const genreOf = (id: GenreId): Genre => GENRES.find((g) => g.id === id) ?? GENRES[0];

/** The genre the mix is narrowed to, or null for all of them. */
export const genreFilterOf = (choice: GenreChoice): GenreId | null => (choice.kind === 'all' ? null : choice.id);

export const choiceLabel = (choice: GenreChoice): string => (choice.kind === 'all' ? 'All genres' : genreOf(choice.id).label);
