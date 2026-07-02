---
description: Generate a new O'RLY explainer "book" from a repo + subsystem and publish it to the shelf
---

# /new-book — add a book to the O'RLY shelf

Turn a GitHub repo (or local path) + a subsystem into a narrated, animated D3
explainer with an O'RLY‑parody cover, and publish it to https://orly.brett-lamy.workers.dev/.

**Arguments:** `$ARGUMENTS` — ideally `<repo-url-or-path> | <subsystem prompt> [| <short title>] [| <animal>]`.
If they're missing or unclear, ask the user for the repo and which subsystem to explain.

Keys come from the gitignored `.env` (`ELEVENLABS_API_KEY`, `OPENAI_API_KEY`,
`NOUN_PROJECT_KEY/SECRET`). The storyboard is written by **you (Claude Code)** —
no `ANTHROPIC_API_KEY` needed.

## Steps

1. **Pick a slug** (kebab‑case, unique) and a short cover **title** (e.g. "Koa.js").

2. **Digest the repo** with the real pipeline (don't hand‑roll it):
   ```bash
   node -e "import('./generator/repo.mjs').then(m=>{const d=m.acquireAndDigest({repo:process.argv[1],prompt:process.argv[2]});require('fs').writeFileSync('/tmp/nb-digest.txt',d.digest);console.error('digest:',d.chosen.length,'files,',d.digest.length,'chars');})" "<REPO>" "<SUBSYSTEM PROMPT>"
   ```

3. **Write the storyboard.** Read `generator/prompts/storyboard.txt` (the system
   prompt — obey every rule) and `generator/storyboard.schema.json` (conform
   exactly), plus `/tmp/nb-digest.txt`. Ground EVERYTHING in the digest (real
   file/function/type names). Optionally also set each node's `iconTerm` (e.g.
   "key", "database", "clock") and a `iconTerm` on auth/data messages.
   **The primary visual of every chapter is a custom-authored 3b1b scene**
   (prompt section "VIZ SCENES"): plan ONE scene per chapter at
   `books/<SLUG>/chapter-<n>` and put `viz: {"scene": "books/<SLUG>/chapter-<n>",
   "beat": <i>}` on EVERY non-cover step, `<i>` = the step's 0-based position
   among the chapter's non-cover steps. Diagram-only steps are for beats where
   boxes-and-arrows teach best; a prebuilt catalog scene
   (`generator/viz-catalog.json`) may ALSO be embedded (usually without `beat`)
   when the code genuinely uses that concept. A book with zero authored scenes
   is a failed storyboard unless explicitly justified.
   Write the JSON to `/tmp/nb-storyboard.json`, then validate + auto‑fix layout:
   ```bash
   node -e "import('./generator/validate.mjs').then(m=>{const fs=require('fs');const sb=JSON.parse(fs.readFileSync('/tmp/nb-storyboard.json','utf8'));const v=m.validateStoryboard(sb);fs.writeFileSync('/tmp/nb-storyboard.json',JSON.stringify(sb,null,2));console.log(JSON.stringify(v))})"
   ```
   Fix every error and re‑validate — EXCEPT the "no scene file" hard errors for
   your `books/...` scenes, which are expected until step 4 authors them.
   *(For higher quality you may instead run a Workflow that generates the
   storyboard and adversarially verifies its fidelity to the code — see the
   koa-storyboard-test workflow as a template.)*

4. **AUTHOR THE SCENES** (the chapters' primary visuals — do NOT skip to the
   build). Follow `.claude/skills/viz-scene/SKILL.md` ("Using scenes in BOOKS"):
   1. **Study 2–3 relevant exemplar explainers** under `src/viz/explainers/`
      first — e.g. `almostnode-server/` (architecture/relay story) and
      `differential-dataflow/` (algorithmic story), each `scene.ts` + component.
      They are the quality bar: beat-sheet structure, arch/agent primitives
      (`Zone`/`ServiceNode`/`Connection`/`RequestFlow`), `MathLabel` for math,
      the motion-language durations, and restraint.
   2. **Write `src/viz/books/<SLUG>/chapter-<n>.tsx`** for each chapter — a
      single-file scene (layout data + `buildScene()` + `Render({s})` +
      `vizScene()` exports in one .tsx): one caption per non-cover step whose
      text mirrors that step's `displayNarration` (captions define the beats),
      channels for everything that moves, deterministic (no `Math.random()`/
      `Date.now()`), bottom ~12% of the 1280×720 stage kept clear. It is
      auto-registered by glob — no edit to `src/viz/scenes.ts`.
   3. **Wire `viz: {scene, beat}` into the storyboard steps** (if not already
      done in step 3) — beat `<i>` per non-cover step, in order.
   4. **Verify**: `npx tsc --noEmit` is clean, `npm run build` is green, the
      step-3 validator now returns `ok:true` with the scene files present, AND
      each scene scrubs correctly in the Storybook **Motion** panel: add a
      colocated `.stories.tsx` (the glob covers `src/viz/**`), run
      `npm run storybook`, and drag through every beat — each caption window
      must render its beat's state at ANY slider position (state leaks show up
      as frames that only look right when played from 0).

      When this runs **in CI** (the issue → book pipeline), the workflow ALSO
      browser-verifies the finished book automatically after you're done:
      `generator/verify-book.mjs` plays every chapter in headless Chromium,
      asserts a clean console and that the authored viz scene is mounted where
      the manifest declares it, and screenshots each chapter to
      `public/generated/<slug>/previews/chapter-<n>.png` — those PNGs are
      committed with the book and ship on the PR. That gate is a backstop, not
      a substitute: still run `npx tsc --noEmit`, `npm run build`, and the
      validator yourself before finishing.

5. **Build the book** (TTS + cover + icons + library), no browser:
   ```bash
   node generator/cli.mjs --storyboard /tmp/nb-storyboard.json --slug "<SLUG>" --title "<TITLE>" --prompt "<SUBSYSTEM PROMPT>"
   ```
   This narrates each chapter (ElevenLabs, exact cues), generates an O'RLY‑parody
   cover (gpt‑image animal **seeded** by a random parody cover + a vision **QA
   loop** that rejects any real‑publisher/stray text), fetches Noun Project icons
   for nodes + packets, and upserts the book into `public/generated/library.json`.

6. **Publish** (triggers the Pages redeploy — the authored scenes ship with the
   book, so add BOTH paths):
   ```bash
   git add public/generated src/viz/books && git commit -m "book: <TITLE>" && git push
   ```

7. Tell the user the live URL: `https://orly.brett-lamy.workers.dev/?bundle=<SLUG>`
   (and optionally open it locally with `npm run dev` + `?bundle=<SLUG>`).

## Rules
- **Never** show the real publisher "O'Reilly" anywhere — only the parody "O'RLY?".
  The cover chrome is composited in‑browser (you control the text); the gpt‑image
  step's QA loop guards against stray lettering in the animal.
- Keep it grounded: no invented components, files, or data flows.
