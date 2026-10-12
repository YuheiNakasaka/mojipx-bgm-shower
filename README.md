# BGM Shower

Endless original chiptune with full-screen pixel-art visuals, picked by your mood.

Press start, choose how you feel, and let it play: one track flows into the next on the bar line,
and the pixel scenes behind it pulse with the kick drum and cut on the phrase.
Everything — every note and every pixel — is generated in your browser. There are no audio files and no server.

Built as a showcase for [mojipx](https://github.com/YuheiNakasaka/mojipx), a toolkit for pixel-art browser games.

## Features

- **Original music only.** Songs are written as chord charts and hand-written melodies; a style (cozy village, 8-bit quest, city lights, neon rush, …) arranges the band around them. mojipx plays the result with Web Audio pulse, triangle and noise voices.
- **Endless mix.** In shuffle, each track plays for about two and a half minutes, then the next one takes over seamlessly at the end of a loop. Repeat one loops a track forever.
- **Mood pad.** Nine moods on a 3×3 pad (energy upward, brightness to the right), or "any mood" to drift.
- **A DJ-minded shuffle.** The next track is drawn at random, weighted by how well it fits the mood, how smoothly it follows the current one (tempo, with half and double time, and key on the circle of fifths), how long ago it played, and whether it repeats the style.
- **Beat-synced visuals.** Scenes are stateless functions of time and the music's pulse, recolored to the track's mood, dissolving into each other through an ordered-dither mask.
- **Phones and desktops.** Full-bleed canvas at any aspect ratio, touch-sized controls, safe-area insets, keyboard shortcuts.

## Shortcuts

| Key | Action |
|---|---|
| Space | Start / play / pause |
| → / ← | Next / previous track |
| R | Shuffle ↔ repeat one |
| M | Mood pad |
| T | All tracks |
| V | Next scene |
| L | Lock the scene |
| F | Full screen |
| H | Hide or show the controls |

Links can preset things: `?mood=cozy`, `?track=sunday-bakery`, `?scene=sunset-grid` (locks the scene), `?loops=1` (a quick tour: one loop per track).

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

How the site is put together, and how to add a song or a scene, is in [docs/design.md](docs/design.md).

## Deploy

The site is static. `npm run deploy` builds it and uploads `dist/` to Cloudflare Workers as static assets (`wrangler.jsonc`); run `npx wrangler login` once first.

## Known limits

- Browsers only allow sound after a tap or key press, so the site starts with "Press start".
- On iPhone and iPad, Web Audio may follow the silent switch on older iOS versions, and playback stops when the screen locks.
- If your system asks for reduced motion, the scenes are drawn as still pictures (the music still plays).
- The preview image link (`og:image`) is relative until the site has its final address.

## License

Code, songs and scenes: MIT. Fonts: [Silkscreen](https://fontsource.org/fonts/silkscreen) and [Pixelify Sans](https://fontsource.org/fonts/pixelify-sans), SIL Open Font License 1.1, bundled from Fontsource.
