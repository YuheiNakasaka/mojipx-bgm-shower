# BGM Shower

Endless original chiptune with full-screen pixel-art visuals, picked by genre.

**Play it: [mojipx-bgm-shower.razokulover.workers.dev](https://mojipx-bgm-shower.razokulover.workers.dev)**

Press start, choose a genre, and let it play: one track flows into the next on the bar line,
and the pixel scenes behind it pulse with the kick drum and cut on the phrase.
Everything — every note and every pixel — is generated in your browser. There are no audio files and no server.

Built as a showcase for [mojipx](https://github.com/YuheiNakasaka/mojipx), a toolkit for pixel-art browser games.

## Features

- **Original music only.** 120 songs, about three hours when each plays once. They are written as chord charts and hand-written melodies in the spirit of Japanese pop and 8- and 16-bit game music: idol disco and kawaii idol pop, vocal-synth rock and electro, city pop, techno pop, eurobeat, band rock, Showa ballads, fusion, drum and bass, Celtic and island tunes, JRPG themes and more. A style arranges the band around each song, and mojipx plays the result with Web Audio pulse, triangle and noise voices. How the songs are written is in [docs/songwriting.md](docs/songwriting.md).
- **Many scenes.** Pixel scenes of famous places in Japan and around the world, screens from games that never existed, girls and animals in unexpected places, and abstract visuals for the loud end.
- **Endless mix.** In shuffle, each track plays for about two and a half minutes, then the next one takes over seamlessly at the end of a loop. Repeat one loops a track forever.
- **Genres.** Nine genres on a 3×3 grid — Idol, Vocal Synth, Retro Pop, City Pop, Dance, Arcade, RPG, Folk, Chill — or all of them to mix.
- **A DJ-minded shuffle.** The next track is drawn at random from the genre, weighted by how close its mood is to the current one, how smoothly it follows it (tempo, with half and double time, and key on the circle of fifths), how long ago it played, and whether it repeats the style.
- **Share a pair.** Found a track and a scene that belong together? Share sends a link that opens with that track on repeat and that scene locked, until the listener changes them.
- **Beat-synced visuals.** Scenes are stateless functions of time and the music's pulse, recolored to the track's mood, dissolving into each other through an ordered-dither mask.
- **Phones and desktops.** Full-bleed canvas at any aspect ratio, touch-sized controls, safe-area insets, keyboard shortcuts.

## Shortcuts

| Key | Action |
|---|---|
| Space | Start / play / pause |
| → / ← | Next / previous track |
| R | Shuffle ↔ repeat one |
| G | Genres |
| T | All tracks |
| V | Next scene |
| L | Lock the scene |
| S | Share the track and the scene |
| F | Full screen |
| H | Hide or show the controls |

Links can preset things: `?genre=idol`, `?track=sunday-bakery`, `?scene=sunset-grid` (locks the scene), `?mode=repeat` (repeat one), `?loops=1` (a quick tour: one loop per track).
Share makes `?track=…&scene=…&mode=repeat`: the share sheet gets it on phones and tablets, the clipboard elsewhere.
A link's mode is not saved as the listener's own until they change it, so the site does not stay on repeat after a shared link.

## Development

```sh
npm install
npm run dev
```

| Command | Checks |
|---|---|
| `npm run lint` | Formatting and lint (Biome), including "no classes, no `function` keyword" (`lint/*.grit`) |
| `npm run typecheck` | Types |
| `npm test` | Unit tests (Vitest): the domain, every song's musical checks, the visual director |
| `npm run e2e` | Browser tests (Playwright) at desktop, tablet and phone sizes |
| `npm run complexity` | Per-function cognitive and cyclomatic complexity ≤ 15 ([cccc](https://github.com/moznion/cccc), `cccc.toml`) |
| `npm run similarity` | Duplicate-code detection ([similarity-ts](https://github.com/mizchi/similarity)) |
| `npm run build` | Type-check and bundle into `dist/` |

| Tool | Does |
|---|---|
| `npm run shots -- <scene-id> …` | Renders scenes at a desktop and a phone size into `test-results/shots/`, to look at them |
| `npm run loudness` | Measures every track and writes the gains that even out their loudness (run after changing songs) |

How the site is put together, and how to add a song or a scene, is in [docs/design.md](docs/design.md).

## Deploy

The site is static. `npm run deploy` builds it and uploads `dist/` to Cloudflare Workers as static assets (`wrangler.jsonc`); run `npx wrangler login` once first.

## Known limits

- Browsers only allow sound after a tap or key press, so the site starts with "Press start". A link to a track shows what it will play above that button.
- On iPhone and iPad, Web Audio may follow the silent switch on older iOS versions, and playback stops when the screen locks.
- If your system asks for reduced motion, the scenes are drawn as still pictures (the music still plays).

## License

Code, songs and scenes: MIT. Fonts: [Silkscreen](https://fontsource.org/fonts/silkscreen) and [Pixelify Sans](https://fontsource.org/fonts/pixelify-sans), SIL Open Font License 1.1, bundled from Fontsource.
