---
description: Generate a multi-book O'RLY series from docs/a repo and publish it as a grouped series
---

# /new-series — add a whole book series to the shelf

Turn a docs site or repo into a **grouped series** of explainer books, each its own
narrated, animated book with an O'RLY‑parody cover, all sharing one `series` name so
they render as a labeled shelf row (and a whole-series sidebar) on
https://blamy.github.io/orly/.

**Arguments:** `$ARGUMENTS` — ideally `<source> | <series name> | <books or count>`.
From a GitHub issue, parse the form: **Source**, **Series name**, **Books** (one per
line, or a description + a **count** to plan).

Keys come from the gitignored `.env` locally, or from CI env (`ELEVENLABS_API_KEY`,
`OPENAI_API_KEY`, `NOUN_PROJECT_KEY/SECRET`). The storyboards are written by **you
(Claude Code)** — no `ANTHROPIC_API_KEY` needed for the pipeline.

## Steps

1. **Acquire the source.** If it's a GitHub repo, `git clone --depth 1` it. If it's a
   docs site, clone its docs repo (e.g. `Effect-TS/website`) or fetch the key pages.
   Find the real content (md/mdx/source) to ground everything in.

2. **Plan the series.** Decide the books: use the provided list, or plan `count` books
   as a learning arc. For each book choose: a **slug** (kebab), a SHORT cover **title**
   + **subtitle**, a **level**, a distinct cover **animal**, an accent **color**, and
   **3–5 chapters** — each naming the ONE concept it explains, the REAL API/identifiers
   to ground it, and the key beats. Differentiate the levels; don't repeat concepts.
   Write the plan to `/tmp/series-plan.json`.

3. **Author each storyboard.** For every book, read `generator/prompts/storyboard.txt`
   (obey it) and `generator/storyboard.schema.json` (conform), then write a storyboard
   grounded in the real source (cite files in `sourceRefs`). For a library/framework,
   show a value/type flowing through the API (nodes = real functions/types, messages =
   what flows). Write to `/tmp/<slug>-sb.json` and validate + auto-fix layout:
   ```bash
   node -e "import('./generator/validate.mjs').then(m=>{const fs=require('fs');const sb=JSON.parse(fs.readFileSync('/tmp/<slug>-sb.json','utf8'));const v=m.validateStoryboard(sb);fs.writeFileSync('/tmp/<slug>-sb.json',JSON.stringify(sb,null,2));console.log(JSON.stringify(v))})"
   ```
   Fix every error until `ok:true`. (For higher quality you may run Workflow fan-outs to
   study + author + adversarially verify — but inline is fine.)

4. **Build each book** (TTS + cover + icons + library), in series order:
   ```bash
   node generator/cli.mjs --storyboard /tmp/<slug>-sb.json --slug "<slug>" \
     --title "<title>" --subtitle "<subtitle>" --animal "<animal>" --color "<hex>" \
     --series "<SERIES NAME>" --series-order <N> --prompt "<source/topic>"
   ```
   Each narrates the chapters, makes an O'RLY cover (seeded/QA loop, parody-only) and
   Noun icons, and upserts the book into `public/generated/library.json` with its
   chapters + durations. All books share the same `--series` name; `--series-order`
   gives the reading order.

5. **Publish.** Locally: `git add public/generated && git commit -m "series: <name>" && git push`.
   **In CI: STOP after step 4** — do NOT run git/gh; the workflow commits, opens the PR,
   and auto-merges.

## Rules
- **Never** show the real publisher "O'Reilly" — only the parody "O'RLY?".
- Ground everything in the real source — no invented components, files, or flows.
- All books in one series share the exact same `--series` string.
