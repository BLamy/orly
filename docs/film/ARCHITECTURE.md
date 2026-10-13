# orly-2 film pipeline — architecture

orly-2 is the Opus 5.5 edition of orly. Books (narrated D3 explainers of codebases)
still work exactly as before. **Films** are the new production level: 20–40 minute,
art-directed, narrated and scored animated documentaries rendered frame-exactly in
JavaScript. The visual register is silhouette / paper-cut theatre
([style bible](research/silhouette-style-bible.md)).

Research that grounds this design lives in `docs/film/research/`:
[pipeline map](research/orly-pipeline-map.md) ·
[ops & model routing](research/orly-ops-and-model-routing.md) ·
[ElevenLabs narration](research/elevenlabs-narration.md) ·
[ML asset inventory](research/ml-asset-inventory.md) ·
[style bible](research/silhouette-style-bible.md) ·
[Strudel music backend](research/strudel-music-backend.md) ·
[frame-exact rendering](research/frame-exact-rendering.md).

## 1. Principles

1. **Opus 5.5 writes all code and all story** — `claude-opus-5-5`, effort `high`, pinned
   explicitly in every workflow `agent()` call and every headless CLI launch
   (`generator/run-opus.mjs`). Provenance is recorded per stage. Nothing substitutes.
2. **Audio-first, locked edit.** The script is locked, then narrated; the narration's
   word timings become the film clock (`timeline.json`). Music is composed to that clock,
   and shots are animated to it. Nothing is retimed after the fact, so a gesture can land
   on a word and a cut can land on a downbeat.
3. **Pure frames.** Every frame is a pure function of `t` (orly's `Timeline.sample`).
   Rendering is frame-stepped and exact: no real-time capture, no dropped frames.
4. **Truth before beauty.** Every claim, date, number and quote in narration or on screen
   traces to `research/claims.json` / `research/quotes.json`. Real people are depicted as
   respectful silhouettes and never given invented words. No voice imitates a real person.
5. **Resumable stages.** Each stage writes its outputs to disk and records status in
   `films/<slug>/film.json`. Re-running a stage skips finished, valid work. Provider limits
   stop the loop cleanly with a resume note; they never trigger a model substitution.
6. **Measured quality.** Each stage has machine checks plus an Opus review against a
   rubric; the excellence gate decides when the film is done.

## 2. Layout

```
films/<slug>/                      # one film's production folder (sources + ledgers)
  brief.md                         # the request, verbatim + normalized parameters
  film.json                        # stage ledger: status, provenance, budgets, review scores
  research/  plan.json dossiers/ factcheck/ bible.md claims.json quotes.json
  story/     treatments/ treatment.md script.json script.md reviews/
  voice/     voice.json lexicon.json auditions/
  narration/ cache/ narration.wav timeline.json ledger.json
  score/     cues.json cues/<id>.strudel renders/<id>.wav analysis/ notes.md
  mix/       master.wav loudness.json chapters/<n>.m4a
  qa/        stills/ sheets/ reports/
  render/    segments/ film.mp4 film.vtt chapters.txt          (gitignored media)

apps/bookshelf/src/viz/film/       # the film engine (shared by all films)
  contracts.ts                     # THE seams — read first
  core/      timing.ts shot.ts frame.ts multiplane.ts reel.ts harness.tsx studio.tsx
  silhouette/                      # the kit
    palette.ts palettes.json light.ts atmosphere.ts finish.ts transitions.ts type.ts
    ornament.ts lathe.ts architecture/ nature/ props/ puppet/ metaphors/
  gallery/   <piece>.gallery.ts    # visual self-test pages for every kit piece
  index.ts

apps/bookshelf/src/viz/films/<slug>/   # one film's shots (auto-registered by glob)
  timeline.json (generated)  cast.ts  shots/<shotId>.tsx

generator/film/                    # Node pipeline
  narrate.mjs timeline.mjs score.mjs mix.mjs render.mjs stills.mjs sheets.mjs
  qa.mjs publish.mjs snap.mjs voice.mjs lib/
generator/run-opus.mjs             # the only headless authoring launcher (Opus 5.5, high)

.claude/workflows/film-*.js        # saved workflows (run as /film-research, /film-loop …)
.claude/commands/new-film.md       # the playbook
.claude/skills/film-shot/ film-score/ film-story/   # authoring skills
```

## 3. Stages

| # | stage | how | output | gate |
|---|---|---|---|---|
| 1 | research | `/film-research` workflow | bible.md, claims.json, quotes.json | adversarial fact-check per dossier; completeness critic |
| 2 | story | `/film-story` workflow | script.json (+ script.md) | treatment panel → script → reviewer panel loop until rubric ≥ bar; claims check |
| 3 | voice | `generator/film/voice.mjs` | voice.json, lexicon.json | audition metrics; human ear if available |
| 4 | narration | `generator/film/narrate.mjs` then `timeline.mjs` | narration.wav, timeline.json (THE clock) | alignment exact, STT round-trip on names, pacing |
| 5 | score | `/film-score` workflow + `score.mjs` (strudel.cc Export to WAV) | cues.json, renders/*.wav | loudness, spectrogram review, cue-length exact |
| 6 | shots | `/film-shots` workflow | shots/*.tsx | typecheck, stills/contact-sheet vision review loop |
| 7 | mix | `mix.mjs` | master.wav (-16 LUFS, TP -1.5), chapter slices | loudness/peaks/duck depth |
| 8 | render | `render.mjs` | film.mp4 (1080p24 H.264 crf 18-20 -tune grain), film.vtt, chapters | frame count = duration × fps; A/V length match |
| 9 | review | `/film-review` workflow | review round report + fix list | excellence gate (§8) |
| 10 | publish | `publish.mjs` | manifest kind `film` + library entry (local; deploy is a human decision) | verify |

`/film-loop` runs 1→10, then loops review → targeted fixes (shots / score / script lines)
→ re-render until the gate passes or the round budget is spent.

## 4. Timing model (the locked edit)

`script.json` (types in `contracts.ts`: `FilmScript`) holds chapters → shots → narration lines
and visual beats. `narrate.mjs` synthesizes each shot's lines (ElevenLabs
`eleven_multilingual_v2`, with-timestamps, request stitching, content-hash cache, credit
ledger + budget cap) and `timeline.mjs` lays them end to end:

```
shot.start = previous shot end
lines: leadIn (0.6 s default) · line · gap · line … · holdAfter (0.8 s default)
gap  = next line's preGap ?? this line's pauseAfter ?? 0.45 s
duration = max(computed, minDuration)
```

Per-line stem fields: each line is ridden to -20 LUFS, then `wordRides` ({"right": 5}) lift
under-stressed words and `levelDb` (-3 for a hushed opening) offsets the whole line, all before
the speech compressor. Changing `preGap`, `pauseAfter` or `levelDb` needs only `film:timeline`
(no re-narration); `insertGaps` re-cuts clips from the cache in `film:narrate`.

Word times come from the character alignment. Beats anchored to `{line, word, edge, offset}`
resolve to shot-local seconds. The result (`FilmTimelineData`) is written to
`films/<slug>/narration/timeline.json` and copied to `apps/bookshelf/src/viz/films/<slug>/timeline.json`.
Shots read it through `ShotTiming` (`T.line(id).start`, `T.word(id, 'learn')`, `T.beat('reveal')`,
`T.emphasis()` for gesture beats).

Transitions straddle shot boundaries: a transition of duration d paints shot A on
`[end - d/2, end + d/2]` and shot B on `[start - d/2, …]` (timelines clamp; fog/flicker keep moving).

## 5. Engine

### 5.1 Painter architecture
Films paint **Canvas2D** (glow compositing, rim passes, bloom and cached offscreen layers need
it; SVG filters per frame are too slow at 50k frames). A frame is a DOM stack:

```
<div 1920×1080>
  <canvas scene/>      ← shot.paint(f, s, scene): backlight → L1 → L2 → fog A → L3 → fog B → L4 → rim → practicals → L5 → L6
  <svg overlay/>       ← shot.overlay(): optional plates/KaTeX in stage coordinates
  <canvas finish/>     ← bloom, grain, vignette, flicker (kit finish pass)
</div>
```

`Frame` (contracts) is the painter API: `camera()`, `setMood()`, `backlight()`, `layer()`,
`fog()`, `cached()`, `practical()`, `rim()`. Static layer art is drawn once into offscreen
bitmaps (`cached`) with depth blur baked in, then placed with the layer transform each frame.

### 5.2 Multiplane
`scale(layer) = (ZA·lens)/(z − cam.z)`; `screen = centre + (world − cam.xy)·scale`. Pan
produces parallax, dolly grows near layers faster, lens zoom is flat. Layer table and camera
grammar: style bible §3.2–3.3 (`LAYERS` in contracts).

Painters draw in **rest-screen coordinates**: each layer's world is rescaled by its rest scale, so at
`CAMERA3_HOME` a point (x, y) drawn in any layer lands at (x, y) on the 1280×720 stage, and camera
moves apply the true parallax `screen = C + (p − C)·k − (cam.xy − home)·s` with `s = ZA·lens/(z − cam.z)`,
`k = s/(ZA/z)`. Author static art wider than the frame using `overscan(layer, cams, pad)`.
The shot-authoring guide is the `film-shot` skill (`.claude/skills/film-shot/SKILL.md`).

### 5.3 Shots and reel
`defineShot({ id, mood, build(ctx), paint(f, s, scene, ctx), overlay? })` (contracts:
`ShotModule`). Shot files live in `apps/bookshelf/src/viz/films/<slug>/shots/<shotId>.tsx` and
are auto-registered by `import.meta.glob`. The reel maps film time → active shot(s) + local
time + transition progress, renders each active shot into its own offscreen canvas, and
composites through the transition (`TransitionFn`).

### 5.4 Harness and studio
`/?film-render=<slug>` mounts the reel at full output resolution with no chrome and exposes:

```ts
window.__film = { slug, fps, duration, width, height, ready: Promise<void>,
                  seek(t: number): Promise<void>,   // resolves after paint (fonts loaded, double rAF)
                  shots: {id,start,end}[], frameInfo(): {...} }
```

`/?film-studio=<slug>` is the same reel with a scrubber, shot list and narration text, for
human review in a browser. `film/gallery/*.gallery.ts` modules render kit showcases at
`/film-gallery.html?g=<name>&t=<sec>` for visual self-tests (`generator/film/snap.mjs`).

### 5.5 Silhouette kit
Implements the style bible: moods & Lab crossfades (`palette.ts`, generated `palettes.json`),
backlight/practicals/rim/light-wrap (`light.ts`), fog sheets, dust, snow, rain, embers,
smoke (`atmosphere.ts`), bloom/grain/vignette/flicker/paper (`finish.ts`), iris/ink-bleed/
paper-wipe/fade/lamp-change (`transitions.ts`), title/date/place/name/quote/chapter cards and
labels (`type.ts`, fonts self-hosted, preloaded with `document.fonts.load`). Ornament and
lathe generators make period detail cheap (balusters, candlesticks, chair legs, finials,
scrolls, tracery, tassels). `architecture/`, `nature/`, `props/` are the set and prop
vocabulary (style bible §5). `puppet/` is the articulated cut-out rig, wardrobe by era, hand
swaps, pose library, walk cycles on twos, word-driven head bob and gesture beats (§4).
`metaphors/` are the teaching machines (§6) — real math (actual perceptron updates, actual
convolution, actual attention weights for a real toy sentence), drawn in the same language.
Existing orly explainers can appear as **parchment plates** through the overlay with the film
palette swapped in (ML inventory report).

## 6. Narration
`generator/film/narrate.mjs` (promoted from the ElevenLabs probe's `narrate-film.mjs`):
`eleven_multilingual_v2`, voice from `voice/voice.json` (default: a distinguished mid-life British
narrator, forties or fifties, not elderly, from the shared library; each film has its own voice; never a clone or imitation of a real person), settings
stability 0.60 / similarity 0.80 / style 0.05 / speaker boost / speed ≈ 0.9–1.05, one seed per
film, chunks ≤ 1,200 chars within a shot joined by blank lines, `previous_request_ids` +
`next_text` stitching, per-line times from alignment, a content-hash cache, a spend ledger
and `--budget` cap. `lexicon.json` maps on-screen words to spoken forms (AlexNet → "Alex Net",
LeCun → "luh-Kun", …) and replaces the book pipeline's speakability gate for films. Output is
a 48 kHz WAV, loudness-normalized as a stem.

## 7. Music
Each cue is Strudel code (`score/cues/<id>.strudel`). `generator/film/score.mjs` drives
**strudel.cc's own "Export to WAV"** (offline OfflineAudioContext render, ~5× real time) in
headless Chromium: open strudel.cc → **real click gesture** (Strudel waits for one before audio
init) → set code → evaluate without playing → Export with start cycle 0, end cycle
`ceil((duration+tail)·cps)` → pull the float buffer → 24-bit 48 kHz WAV (cycle 0 = sample 0).
Patterns are clipped (`filterWhen(t < bodyCycles)`) so the tail is pure decay. Composers use
Claude in Chrome on strudel.cc to audition and to see `pianoroll()`/`punchcard()` feedback,
then render with `score.mjs`. Analysis per cue: duration, EBU R128 loudness, true peak,
spectrogram PNG for review.

## 8. Mix, render, review
* **Narration stem** (`timeline.mjs`): each line ridden to one speech loudness (−20 LUFS, ±6 dB), a 70 Hz
  high-pass and a gentle speech compressor (2.5:1, 10/120 ms, threshold searched for ≈3.5 dB GR), a fast
  peak stage only if the crest factor still needs it, then one gain to −18 LUFS with ≤ 1 dB of limiting
  (all reported in `narration/stem.json`; QA warns above 1 dB).
* **Mix** (`mix.mjs`): narration stem + cues placed at their film times with fades; music ducked
  under the voice (sidechain compression keyed by narration; per-cue `duck` object sets ratio /
  attack / release / depthDb); ONE constant gain to −16 LUFS, −1.5 dBTP (a look-ahead limiter only
  takes any true-peak overshoot, reported as `preLimit.reductionDb`, QA warns above 2 dB); chapter
  slices for the shelf (each < 25 MiB). Score renders with a Strudel `[webaudio] error` (e.g. "no
  soundfont zone found": a note outside a GM voice's sample range was dropped) count as failed.
* **Render** (`render.mjs`): `vite build` + preview server; N headless-shell workers
  (`--enable-gpu --use-angle=metal --enable-gpu-rasterization --ignore-gpu-blocklist`), native
  1920×1080 viewport, CDP `Page.captureScreenshot` JPEG q95 `optimizeForSpeed` (≈ 25 fps per
  worker measured) piped to ffmpeg (`libx264 -crf 18 -preset medium -tune grain -pix_fmt yuv420p`)
  per segment; concat demuxer (no re-encode); mux master AAC 256k; chapters metadata (the mov_text
  captions are re-timed to a 1/1000 time base, or the QT chapter track overflows and is dropped); WebVTT
  from line timings. `--preview` = 960×540 / 12 fps; `--shots a,b` renders a subset.
* **Stills & sheets** (`stills.mjs`, `sheets.mjs`): frames at given times / per-shot contact
  sheets with timestamps and the narration under each thumbnail — what reviewers look at.
* **Review / excellence gate**: reviewers score 1–10 on accuracy, clarity & depth, story &
  emotion, visual artistry, motion & sync, sound (by proxies: loudness, duck depth, STT, cue
  analysis), curiosity & novelty. **Pass = every dimension ≥ 8, mean ≥ 8.5, no critical issue.**
  Fixes are routed to their owner stage (line rewrite → re-narrate that shot only; shot visual
  → re-author shot; cue → recompose cue) and the loop runs again.

## 9. Shelf integration — films are VHS tapes
A film publishes as a format-3 manifest with `kind: "film"` (chapter audio slices with `filmStart`,
captions, a `film` block) and a library entry `{kind: "film", href: "?film=<slug>", runtime, vhs}`.
On the shelf it is **not an O'RLY book but a VHS tape** (`apps/bookshelf/src/library/vhs.ts`): a black
clamshell whose sleeve is drawn in the browser in the style of early-'90s educational videotapes —
six themes (cosmos, grid, jungle, lab, ocean, sunset), a starburst title in chunky black-outlined
type, a subject banner, procedural clip-art (neuron, brain, chip, atom, globe, crt, rocket …), the
VHS mark, the parody "O'RLY? EDUCATIONAL VIDEO · VOL. n" strip and shelf wear. The desktop shelf
stands films spine-out in a **Video Library** case at its head (same hover-turn as books); other
views get the sleeve through `composeCover`/`drawSpine`. Each film's sleeve comes from
`story/meta.json` `vhs: {subject, theme, icons, tagline}` (written by the head writer).
Preview every theme at `/film-gallery.html?g=vhs`.

Clicking a tape opens **`?film=<slug>`** (`apps/bookshelf/src/player/FilmPlayer.tsx`): the reel is
painted live in the browser from the same shot modules the frame-exact renderer uses, with the
chapter audio as the clock; VCR chrome (insert/tracking moment, ▶ PLAY / ❚❚ PAUSE on-screen
display, SP counter, EJECT, chapter skip, a whole-film scrubber, captions). The master MP4 stays
out of Workers static assets (25 MiB per-file cap); deployment remains a human decision.

## 10. Model routing & provenance
`generator/authoring-models.json` maps every role to `claude-opus-5-5` / effort `high`.
`generator/run-opus.mjs` is the only headless launcher: `--model claude-opus-5-5 --effort high`,
all model aliases pinned to Opus via env, `ANTHROPIC_API_KEY` stripped (subscription OAuth),
strict check that every `modelUsage` key is Opus 5.5, provenance JSON written per run. In
workflows every `agent()` passes `{ model: 'claude-opus-5-5', effort: 'high' }`.
