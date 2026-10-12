# BGM Shower — design

This document describes how BGM Shower is built and how to add music and visuals to it.
Readers are people changing the site or writing songs and scenes for it.

## Goals

| Goal | Decision |
|---|---|
| What it is | A VJ-style page: endless original chiptune with full-screen pixel animation behind it |
| Music | Original songs only, in styles reminiscent of 8- and 16-bit game music and 80s–90s pop, generated live with Web Audio (no audio files) |
| Flow | Shuffle by default, each track for about 150 seconds, the next one taking over at the end of a loop; or repeat one track |
| Choice | The listener picks a mood; music and visuals lean toward it, chosen by weights rather than uniform randomness |
| Devices | Desktop and phone, any aspect ratio, touch and keyboard |
| Language | English |
| Hosting | Static files on Cloudflare (Workers static assets). No server, no database: songs are text and stay small |
| Code | TypeScript; no classes and no `function` keyword; immutable data; functional domain modeling |

## Architecture

The site is a functional core with a thin imperative shell.

```
src/
  domain/            pure: no DOM, no audio
    mood.ts          the mood plane and its presets
    rng.ts           a seeded random generator kept as data
    selection.ts     how the next track is chosen
    player.ts        the player state machine: (state, message) → (state, commands)
    catalog.ts       songs arranged into tracks
    music/
      theory.ts      keys, chords, voicings
      song.ts        how a song is written
      styles.ts      band patterns and instruments, as data
      arrange.ts     song + style → mojipx Score
      lint.ts        musical checks every song must pass
  content/songs/     the songs
  visuals/
    scene.ts         the scene contract
    kit.ts           pixel drawing helpers
    scenes/          the scenes
    director.ts      pure: which scene, which colors, when to cut
    pulse.ts         pure: beats, bars and drum hits from the playback position
    compositor.ts    draws the current shot and dissolves between shots
  app/               React shell: engine adapter, hooks, components, CSS
```

Dependencies point inward: `app` uses `visuals` and `domain`; `visuals` uses `domain`; `domain` uses only mojipx types and pure functions.
Canvas drawing helpers use local loops for speed; data passed between modules is never mutated.

### mojipx

mojipx provides the sound engine (scores, voices, the look-ahead scheduler), the full-bleed canvas (`PixelFill`, `fillSize`), sprites, frames and storage.
Features this site needed were added to mojipx itself: gapless `cue` at the end of a loop, `position()` for beat sync, `setVolume`, playing on while the tab is hidden, intros (`loopFrom`), sixteenth notes, more voices and envelopes, vibrato, pan, echo, swing, and `PixelFill`.

## Music

### How a song is written

A song (`SongDef`) has a key, a tempo, sections and a form. Each section has a chord chart (one or two chords per bar) and a melody in mojipx tokens; it may add a counter line and switch band parts per section (`drums: false` for an intro, say).

```ts
a: {
  chords: 'Fmaj7 | Dm7 | Gm7 | C7',
  melody: 'C5 . A4 C5 F5 - E5 . | D5 - C5 - A4 - . . | Bb4 . D5 F5 G5 - F5 . | E5 - - - . . G4 A4',
}
```

`form` lists the sections in order; `loopFrom` says where repeats start, so an intro plays once.

### Arranging

A style is data: a lead, counter, harmony and bass instrument, a bass pattern, a harmony pattern, a drum pattern, and optional swing and echo.
Patterns are token strings at eighth-note resolution with symbols resolved against the chord in that half bar:

- bass: `R` root (or slash bass), `5` fifth, `3` third, `8` octave, `A` approach note into the next bar;
- harmony: `1`–`4` voicing notes from the bottom, `C` the whole chord;
- drums: mojipx drum letters, plus a fill for the last bar of each section.

A held note that crosses into the second chord of a bar is struck again on that chord.
Songs written in sixteenths get the patterns stretched to match.

### Musical checks

`lintSong` checks the melody and counter line of every song (the tests run it on the whole library):

| Rule | Why |
|---|---|
| Notes stay in range (melody G3–C7, counter A2–C7) | Keeps lines singable and audible over the band |
| Every note belongs to the key or to the current chord | Borrowed and secondary chords may bring their own chromatic tones |
| No note of a beat or longer sits a semitone above a chord tone | The minor-ninth clash is the harshest dissonance |
| No non-chord tone of two beats or more starts on a strong beat, except ninths, sixths, elevenths on minor chords and major sevenths on major triads | Long unstable tones sound like mistakes; tensions sound intentional |
| No leap beyond an octave | Keeps melodies connected |

### Choosing the next track

`pickNext` gives each candidate a weight and draws one at random by weight, from a seeded generator:

- **mood fit**: a Gaussian of the distance between the track's mood and the asked mood (spread 0.45), squared, so neighbours on the pad are possible but rare. With "any mood", the target is the current track's mood with a wider spread, so the mix drifts;
- **flow**: tempo closeness on a log scale with half and double time counting as close, times key closeness on the circle of fifths (relative major and minor are neighbours);
- **freshness**: zero while a track is among the last few plays (up to 8, or half the library), recovering as it ages;
- **variety**: the same style twice in a row weighs 0.6, three times 0.25;
- **arc**: over a session the asked energy bends up and down by 0.15 every six tracks, so a long mix builds and settles.

If nothing fits under the freshness rule, it is relaxed rather than returning nothing.

### Loudness

Styles stack different instruments, so tracks would differ in loudness and every handover would jump in volume.
`npm run loudness` renders each track offline in a headless browser through the same mojipx voices, weights the signal roughly like the ear (a 60 Hz high-pass and a +4 dB shelf above 1.5 kHz), measures RMS after the first second, and writes `src/content/songs/loudness.ts`: a gain per track (0.5–2) that brings it to the library's median.
The catalog applies it as the score's `gain`. Run it after adding or changing songs; a test fails when a song has no measured gain.

### The player

`update(state, message, library)` returns the next state and commands (`play`, `cue`, `pause`, `resume`); `app/engine.ts` runs them against mojipx.
The app reports what is heard five times a second. During the last planned loop of the current track, the player cues the next one; when the cued track is heard, it becomes current.
A mood change makes the current loop the last one, so the new mood arrives seamlessly within one loop.

## Visuals

A scene draws one frame from a `Frame` (size, time, beats, bars, kick and snare envelopes, energy) and a color set; it keeps no state.
Scenes declare their colors as typed keys (`defineScene<K>`), several color variants with a mood each, and the styles they suit.

The director cuts to a new shot for every new track and every phrase (8 bars when energetic, 16 when calm), picking scenes by mood affinity, a bonus for suited styles, and a penalty for the last two scenes. The listener can skip or lock a scene.
Shots dissolve into each other over 1.4 seconds through a 4×4 Bayer mask.

The canvas is a `PixelFill` whose short side is about 180 pixels, scaled by whole numbers and cropped, so pixels stay square at any aspect ratio.
Touch devices draw at most 30 frames a second (`maxFps`); pixel motion reads fine at that rate and the battery lasts longer.

## Page

- The splash asks for a mood and a tap ("Press start"); browsers allow sound only after one.
- While playing, the controls fade after 3.5 seconds without pointer or focus activity, never while the pointer rests on them; keyboard focus brings them back.
- A title card names each new track as it starts, even with the controls hidden.
- The track list groups every track by its nearest mood and plays the one picked.
- `public/_headers` serves a strict content security policy (everything is self-hosted: the fonts come from npm packages, the music and visuals are generated) and caches hashed assets for a year.

## Adding content

- **A song**: add a file to `src/content/songs/` and list it in `index.ts`. Run `npm test`: the library tests compile it, run the musical checks, and check loop length and tempo. Titles must be original and plain English.
- **A scene**: add a file to `src/visuals/scenes/` with `defineScene`, and list it in `index.ts`. Draw with whole pixels (`kit.ts`), derive motion from `f.t` and `f.beat` only, and react to `f.kick` sparingly.

Content must be original. Do not name or imitate real games, companies, artists or songs in code, data or commit messages.

## Quality

| Check | Tool |
|---|---|
| Formatting, lint, no classes and no `function` keyword | Biome with GritQL plugins (`lint/`) |
| Types | TypeScript strict, `noUncheckedIndexedAccess` |
| Domain, songs, director | Vitest |
| Pages at desktop, tablet, phone portrait and landscape | Playwright |
| Complexity ≤ 15 per function | cccc |
| Duplicate code | similarity-ts |

### Test matrix (player)

| State | Message | Expected |
|---|---|---|
| idle | start / start a track / start an unknown track | plays a picked / the asked / a picked track |
| playing | toggle | paused, `pause` |
| paused | toggle | playing, `resume` |
| idle | toggle | same as start |
| playing / paused | next | another track, `play` (+ `resume` when paused) |
| two tracks played | prev | the previous track |
| one track played | prev | restarts it |
| idle | prev | nothing |
| playing | select known / unknown | plays it / nothing |
| shuffle, loops remain | heard | nothing |
| shuffle, last loop | heard | queues and `cue`s the next, once |
| next cued | heard the cued track | it becomes current |
| repeat | heard any loop | nothing |
| shuffle with a cued track | set repeat | cancels the cue |
| repeat | set shuffle | nothing else |
| idle / repeat | set mood | remembers it |
| playing, nothing cued | set mood | the current loop becomes the last |
| playing, a track cued | set mood | re-picks the cued track |
| paused | heard | nothing |
| empty library | anything | nothing |

## Known limits

- Browsers need a tap or key press before sound, hence "Press start".
- iOS may silence Web Audio with the ring switch on older versions and stops it when the screen locks.
