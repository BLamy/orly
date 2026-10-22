# Handwired Labs — book plan

Status: **plan only, paused 2026-10-20.** No scenes, narration, cover, sources file or blog are built yet.
The caption fact-check is done (`review.md`); building is paused while the Handwired screencast workshop is made.

The first book in a planned Handwired series. It explains each of the 15 experiments in
`lab/` of [chenglou/handwired](https://github.com/chenglou/handwired) at commit
`4ea7fcb27ebe93acf49b9f29a93e162b975bad46`. The `lab/types/` helper is not a lab and is
mentioned only in passing.

## Contents

- `plan.md` — the plan for the whole book: five chapters covering all 15 labs, each with a
  visual metaphor, a beat sheet and caption lines that cite `lab/<name>/<file>:<lines>`.
  Also includes a "claims cut" list.
- `digests/` — one working digest per lab, plus `framing.md` (overall question, per-lab status,
  the 2026-09-03 reassessment). Written from the repo at the pinned commit.
- `planning-assignment.md` — the exact brief given to the planner, so the plan can be re-run.
- `review.md` — Claude Haiku 5.5 fact-check of all 61 captions against the pinned clone (50 OK, 11 FIX with
  corrected wording and verbatim quotes). Apply its FIX rows before authoring scenes.

## How the plan was made

- Planning: `claude-sonnet-5-5`, run once through the Claude Code CLI. The result records that
  model as the only one used.
- Digests: written by Claude subagents from the cloned repo. They are working notes, not
  reviewed research. Check any claim against its `Sources` pointers before narrating it.
- Routing: the book follows the all-Claude routing requested for this book (Sonnet plans,
  Haiku research and review, Opus for visuals). **Repo config still says Astra for planning**
  (`generator/authoring-models.json`); that is not yet updated.

## To pick this up

1. ~~Haiku 5.5 review pass on `plan.md`~~ done: apply the FIX rows in `review.md` to the captions.
2. Opus 5.5 authors one scene per chapter, `apps/bookshelf/src/viz/books/handwired-labs/chapter-<n>.tsx`,
   following the `viz-scene` skill.
3. Narrate each chapter with ElevenLabs; cover is title-only unless OpenAI image credits are available.
4. `npm run book:sources`, the companion blog, `verify-book.mjs`, and the self-graded rubric
   in `docs/book-quality.md`.
5. Only after that, plan the rest of the Handwired series.
