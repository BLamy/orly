---
description: Edit or fine-tune an existing book on the shelf (one targeted change)
---

# /tweak-book — fine-tune an existing book

Make the change a follow-up issue asks for to a book that's already published,
touching as little as possible. Use this when you don't like something and want
it adjusted — not to add a whole new book.

**Arguments / issue:** the "✏️ Tweak a book" form gives you a **book** (its label
ends with ` — <slug>`), an optional **chapter** number, and a **What should change?**
description. Parse the `<slug>` from the dropdown selection.

Keys come from `.env` locally or CI env (`ELEVENLABS_API_KEY`, `OPENAI_API_KEY`,
`NOUN_PROJECT_KEY/SECRET`).

## The book's files
`public/generated/<slug>/` holds `storyboard.json` (the editable source),
`manifest.json` (what the app reads), `audio/chapter-N.mp3`, and `animal.png`.
`public/generated/library.json` has the shelf entry (title, subtitle, color,
series, chapters). Keep storyboard.json and manifest.json consistent.

## Pick the smallest change that does the job

- **Reword narration / fix a step / relabel a node / adjust a diagram in one
  chapter** → edit that chapter in `storyboard.json` (`spoken` is the TTS script,
  `displayNarration` carries the rich `code`), then rebuild just that chapter:
  ```bash
  node generator/regen-chapter.mjs <slug> <N>          # re-narrates chapter N
  node generator/regen-chapter.mjs <slug> <N> --no-tts # keep audio (label/layout-only change)
  ```
  Use `--no-tts` only when `spoken` text and the step count are unchanged.

- **Swap / redo the cover animal** → regenerate just the animal (text-free, QA'd):
  ```bash
  node --env-file=.env -e "import('./generator/cover.mjs').then(m=>m.generateAnimal({animal:'a fox', topic:'<topic>', outPath:'public/generated/<slug>/animal.png', log:console.error}))"
  ```

- **Title / subtitle / accent color / series / order** → edit the book's entry in
  `public/generated/library.json` directly (then it also flows to the cover + sidebar).

- **Refresh layout + icons across the whole book** (no text change) →
  `node generator/enhance-book.mjs <slug>`.

- **Add a brand-new chapter** → that's `/new-book`'s territory via
  `generator/add-chapter.mjs <slug> <chapter.json>`, not a tweak.

## Rules
- Change ONLY what the issue asks for. Don't re-narrate or relayout chapters you
  didn't touch; don't regenerate the cover unless asked.
- Keep `storyboard.json` and `manifest.json` in sync (the regen tools do this).
- **Never** show the real publisher "O'Reilly" — only the parody "O'RLY?".
- **Publish:** locally `git commit && git push`. **In CI: STOP after the edit** —
  the workflow commits, opens the PR, and auto-merges.
