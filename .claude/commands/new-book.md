---
description: Generate a scene-native (3b1b-quality) video book from a repo + subsystem and publish it to the shelf
---

# /new-book — add a scene-native video book to the O'RLY shelf

Turn a GitHub repo (or local path) + a subsystem into a narrated **3b1b-quality
video**: every chapter IS one custom-authored 3b1bd3 timeline scene, voiced by
ElevenLabs, bound as an O'RLY-parody book on
https://orly.brett-lamy.workers.dev/. There is no diagram slideshow anymore —
the scenes are the whole video, so their quality is the product.

**Arguments:** `$ARGUMENTS` — ideally `<repo-url-or-path> | <subsystem prompt> [| <short title>] [| <animal>]`.
If they're missing or unclear, ask the user for the repo and which subsystem to explain.

Keys come from the gitignored `.env` (`ELEVENLABS_API_KEY`, `OPENAI_API_KEY`).
The planning and the scenes are written by **you (Claude Code)**.

## Steps — VISUALIZATIONS FIRST, video second

1. **Pick a slug** (kebab-case, unique) and a short cover **title**.

2. **Digest the repo** with the real pipeline (don't hand-roll it):
   ```bash
   node -e "import('./generator/repo.mjs').then(m=>{const d=m.acquireAndDigest({repo:process.argv[1],prompt:process.argv[2]});require('fs').writeFileSync('/tmp/nb-digest.txt',d.digest);console.error('digest:',d.chosen.length,'files,',d.digest.length,'chars');})" "<REPO>" "<SUBSYSTEM PROMPT>"
   ```

3. **PLAN THE VISUALIZATIONS** — this is the storyboard now. Read
   `generator/prompts/storyboard.txt` (the v3 authoring doctrine — obey every
   rule) and the digest. Then write a **visual plan** (a scratch markdown file
   is fine) before any code:
   - 3–6 chapters, each built around ONE visual idea that teaches the chapter's
     concept the way 3blue1brown would — a machine you can watch working, not a
     bulleted diagram. Name the concrete metaphor per chapter ("the diff held
     against the recording, hunk by hunk", "a wavefront flooding the graph").
   - For each chapter: the beat sheet — 5–10 beats, what enters/moves/changes
     per beat, and the narration line(s) each beat carries.
   - Inventory what you can reuse: `src/viz/primitives/` (Zone, ServiceNode,
     Connection, RequestFlow, Axes, FunctionPlot, MatrixGrid, ParticleCloud…),
     `src/viz/agent/` (MessageCard, TokenStream, GauntletRail, DiffLanes,
     RecordingStrip, LoopRing…), and prebuilt explainers in
     `src/viz/explainers/` (embeddable by slug). If a chapter needs a visual
     vocabulary that doesn't exist yet, DESIGN it as local subcomponents in the
     scene file — and note in the PR if it deserves promotion to primitives.
   - Ground EVERYTHING in the digest: real file/function/type names in captions
     and visuals. No invented components or flows.

4. **AUTHOR THE SCENES** — the video itself. Use the `viz-scene` skill
   (`.claude/skills/viz-scene/SKILL.md`, "Using scenes in BOOKS — v3"). One
   file per chapter: `src/viz/books/<SLUG>/chapter-<n>.tsx` (layout data +
   `buildScene()` + `Render({s})` + `vizScene()`; auto-registered by glob).
   - **Captions ARE the narration.** Each `tl.caption({at, dur, text})` is one
     spoken line: full, natural sentences (1–2 per caption, ≤ ~220 chars),
     written for the EAR — no markdown, no paths-read-literally, expand
     identifiers ("registering a slot", not `registerSlot()`); on-screen labels
     can carry the exact code. A chapter is typically 8–16 captions / 60–120s.
   - **Study 2–3 exemplars** under `src/viz/explainers/` first (e.g.
     `kalman/`, `pagerank/`, `differential-dataflow/`) — that is the quality
     bar: beat-sheet comments, motion language, restraint.
   - **Keep the stage clean, especially at the end.** Never draw a closing
     beat's text or elements on top of half-faded content: either fade prior
     elements to ≤ 0.15 opacity (not 0.4), slide them off, or give the closing
     text an opaque backdrop panel. A congested final frame is a failed scene.
   - Deterministic and scrub-safe: no `Math.random()`/`Date.now()`; heavy math
     precomputed at module scope. The player renders captions as a CC pill over
     the stage bottom, so keep y ≳ 630 free of load-bearing content.
   - Add a colocated `chapter-<n>.stories.tsx` per chapter (CSF3, title
     `'Books/<Title>/Chapter <n>'`) so every chapter is scrubbable in
     Storybook's Motion panel.

5. **Verify the scenes before narrating** (narration costs money):
   `npx tsc --noEmit` clean · `npm run build` green. Working locally, also
   run `npm run storybook` and scrub every chapter in the Motion panel —
   every slider position must render correctly. In CI (headless), skip the
   interactive scrub; step 7's browser gate covers playback. Either way, DO
   NOT stop before building the video — an authored-but-unbuilt book is a
   failed run.

6. **Build the video** (ElevenLabs narration per chapter + O'RLY cover +
   manifest + shelf):
   ```bash
   node generator/video.mjs --slug "<SLUG>" --title "<TITLE>" \
     --chapter-titles "t1|t2|…" --blurbs "b1|b2|…" \
     [--series "<SERIES NAME>" [--series-order <n>]]   # when the request names a series
   ```
   Omit `--series-order` for `Daily Papers by Hugging Face` and
   `Fresh from arXiv`; those chronological collections sort by `createdAt`
   newest-first and never store or display series numbers.
   This extracts each chapter's captions, narrates them (one MP3 per chapter,
   exact per-caption cues), generates the O'RLY-parody cover (gpt-image seeded
   + vision QA loop), writes `public/generated/<SLUG>/manifest.json`
   (format 3), and upserts the book into `public/generated/library.json`.

7. **Verify the built book end-to-end**:
   ```bash
   npm run build && node generator/verify-book.mjs --slug "<SLUG>"
   ```
   Every chapter must play in headless Chromium with a clean console, the
   scene mounted, and a mid-chapter screenshot written to
   `public/generated/<SLUG>/previews/`.

8. **Write the companion blog post** — a comments-style written version of the
   book, rendered under the video in the player:
   ```bash
   node generator/screenshot-chapters.mjs --slug "<SLUG>"
   ```
   This seeks each chapter's `<audio>` to every value in its manifest `cues`
   and screenshots the mounted scene, writing
   `public/generated/<SLUG>/blog/chapter-<n>-<cueIndex>.png`. Then write
   `public/generated/<SLUG>/blog.md`: one heading per chapter, prose that
   expands on the chapter's blurb/captions (richer and more essay-like than
   the blurb alone, still grounded in the real code — no new claims), with
   each cue's screenshot embedded as a GitBook figure block so the player's
   `docstream` renderer picks up the caption:
   ```html
   <figure><img src="/generated/<SLUG>/blog/chapter-1-2.png" alt="…"><figcaption>What this beat shows</figcaption></figure>
   ```
   Use the **absolute** `/generated/<SLUG>/blog/...` path (not a relative one)
   so it resolves correctly wherever the post is rendered.

9. **Publish** (the scenes ship with the book — add BOTH paths):
   ```bash
   git add public/generated src/viz/books && git commit -m "book: <TITLE>" && git push
   ```

10. Tell the user the live URL: `https://orly.brett-lamy.workers.dev/?bundle=<SLUG>`.

## Rules
- **Never** show the real publisher "O'Reilly" anywhere — only the parody "O'RLY?".
- **Ground everything in real code** — no invented components, files, or flows;
  captions cite behavior the digest shows.
- **A book with weak scenes is a failed book.** If a chapter's visual idea is
  just "boxes and arrows appear", redesign it before authoring.
