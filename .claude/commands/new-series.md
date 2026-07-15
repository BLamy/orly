---
description: Generate a multi-book O'RLY series from docs/a repo and publish it as a grouped series
---

# /new-series — add a whole book series to the shelf

Turn a docs site or repo into a **grouped series** of explainer books, each its own
narrated, animated book with an O'RLY‑parody cover, all sharing one `series` name so
they render as a labeled shelf row (and a whole-series sidebar) on
https://orly.brett-lamy.workers.dev/.

**Arguments:** `$ARGUMENTS` — ideally `<source> | <series name> | <books or count>`.
From a GitHub issue, parse the form: **Source**, **Series name**, **Books** (one per
line, or a description + a **count** to plan).

Keys come from the gitignored `.env` locally, or from CI env (`ELEVENLABS_API_KEY`,
`OPENAI_API_KEY`, `NOUN_PROJECT_KEY/SECRET`). The storyboards are written by **you
(Claude Code)** — no `ANTHROPIC_API_KEY` needed for the pipeline.

## Steps

A series is just N v3 books that share a `series` name. For EACH book, follow
`.claude/commands/new-book.md` end to end — visualizations first: plan the
chapter visual ideas, author the scenes at `src/viz/books/<slug>/chapter-<n>.tsx`
(captions ARE the narration), then
`node generator/video.mjs --slug <slug> --title "…" …` and
`node generator/verify-book.mjs --slug <slug>`.

1. **Acquire the source** (`git clone --depth 1`, or the docs repo) and digest it
   with `generator/repo.mjs` per book topic.

2. **Plan the series arc.** Decide the books: use the provided list, or plan
   `count` books as a learning arc. Per book: slug, SHORT title + subtitle, a
   distinct cover animal, an accent color, and 3–5 chapters — each with ONE
   visual idea grounded in real identifiers. Differentiate levels; don't repeat
   concepts.

3. **Author + build each book** per new-book.md (scenes → storybook scrub →
   video.mjs → verify-book). Pass the same `series` name so the shelf groups
   them (library.json `series` + `seriesOrder` fields — video.mjs flags or edit
   the entry after upsert).

4. **Publish**: `git add public/generated src/viz/books && git commit -m
   "series: <NAME>" && git push`.
