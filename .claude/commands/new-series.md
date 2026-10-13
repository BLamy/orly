---
description: Generate a multi-book O'RLY series from docs/a repo and publish it as a grouped series
---

# /new-series — add a whole book series to the shelf

Read [the authoring model workflow](../../docs/authoring-models.md) first. **Claude Opus 5.5 (`claude-opus-5-5`, effort high) plans, writes and codes every part of the book** (visual plan, narration, D3/SVG/Canvas/Three.js scenes, Blender Python). Headless sub-sessions run through `node generator/run-opus.mjs --role <role>` (latest CLI via `npx --yes @anthropic-ai/claude-code@latest`, pinned model aliases, strict provenance). A fresh authoring session consumes the written plan; it does not re-plan. Preserve provider provenance and stop on a provider limit without substituting another model.


Turn a docs site or repo into a **grouped series** of explainer books, each its own
narrated, animated book with an O'RLY‑parody cover, all sharing one `series` name so
they render as a labeled shelf row (and a whole-series sidebar) on
https://orly.brett-lamy.workers.dev/.

**Arguments:** `$ARGUMENTS` — ideally `<source> | <series name> | <books or count>`.
From a GitHub issue, parse the form: **Source**, **Series name**, **Books** (one per
line, or a description + a **count** to plan).

Keys come from the gitignored `.env` locally, or from CI env (`ELEVENLABS_API_KEY`,
`OPENAI_API_KEY` for gpt-image covers, `NOUN_PROJECT_KEY/SECRET`). Opus 5.5 writes the series plan, and a fresh Opus 5.5 session authors each book.

## Steps

A series is N v3 books that share a `series` name — and **one session must
never author a whole series** (a v3 book is 3–6 fully authored scenes; a
series is too big a unit of work; runs that try will die partway).

### In CI (the issue → book pipeline): PLAN, then stop — do not author

1. **Digest the source** briefly (repo.mjs) — enough to plan honestly.
2. **Plan the series**: per book — order, SHORT title, subtitle, a distinct
   cover animal, an accent hex, and a 2–4 sentence "what to explain" brief
   naming the real concepts/identifiers the book will ground in.
3. **Write the plan to `/tmp/series-plan.json`** exactly in this shape, print
   it, and STOP (do not author scenes, do not run the generator):
   ```json
   { "series": "<Series Name>", "source": "<repo url>",
     "model": "claude-opus-5-5",
     "books": [ { "order": 1, "title": "…", "subtitle": "…",
                  "animal": "…", "accent": "#38bdf8",
                  "subsystem": "<what to explain — 2–4 sentences>" } ] }
   ```
   The workflow's fan-out step files one 📕 new-book issue per book; a
   collaborator applies the `build` label to start each run — every book gets
   its own complete CI session, PR, and preview, grouped on the shelf by the
   shared series name.

### Working locally

Follow `.claude/commands/new-book.md` end to end once per book, passing
`--series "<name>" --series-order <n>` to `generator/video.mjs`. Build and
verify each book before starting the next.
