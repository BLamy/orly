---
description: Produce a long-form, art-directed silhouette documentary film (research → story → narration → score → shots → render) and loop until it passes the excellence gate
---

# /new-film — make a film at the orly-2 production level

Read `docs/film/ARCHITECTURE.md` first. **Claude Opus 5.5 (`claude-opus-5-5`) at high effort
writes all code and all story**; every saved workflow pins it on each agent.

**Arguments:** `$ARGUMENTS` — `<slug> | <the request, verbatim>` (or just a slug whose
`films/<slug>/brief.md` already exists). Ask for the subject if it is missing.

## 1. Brief

Create `films/<slug>/brief.md` with the request **verbatim**, then normalized production
parameters (form, target length, look, must-cover topics, deep dives, narrator archetype,
music, models, as-of date) and the editorial guardrails. Copy the structure of
`films/neural-net-history/brief.md`. The narrator is always an **archetype**; never clone or
imitate a real person's voice.

## 2. Produce

Run the whole loop:

```
/film-loop {"slug":"<slug>"}
```

or stage by stage (each is resumable and skips finished work):

| stage | workflow | writes |
|---|---|---|
| research | `/film-research {"slug","asOf":"YYYY-MM-DD"}` | `research/bible.md`, `claims.json`, `quotes.json` |
| story | `/film-story {"slug","runtimeTargetMin":32}` | `story/script.json`, `script.md` |
| voice + narration | `/film-narrate {"slug","budgetCredits":40000}` | `voice/`, `narration/`, `timeline.json` (the locked clock) |
| score | `/film-score {"slug"}` | `score/cues/*.strudel`, `score/renders/*.wav` |
| shots | `/film-shots {"slug"}` | `apps/bookshelf/src/viz/films/<slug>/shots/*.tsx` |
| assemble | `/film-assemble {"slug"}` (add `"preview":true` for a fast 540p/12 fps pass) | `mix/`, `render/film.mp4`, `qa/` |
| review | `/film-review {"slug","round":1}` | `qa/reviews/round-1/verdict.json` |

Watch progress with `/workflows`. Review a film in the browser at
`http://127.0.0.1:5199/?film-studio=<slug>` (start the dev server with `npm run film:dev`).

## 3. The loop that keeps producing films

Queue films in `films/queue.json`:

```json
[{ "slug": "<slug>", "brief": "<the request, verbatim>", "status": "pending" }]
```

then run, in a session you leave open:

```
/loop /film-loop {"queue":true}
```

Each iteration takes the next in-progress or pending film, resumes it from whatever stage it
reached, loops review → fixes until the excellence gate passes (every dimension ≥ 8, mean ≥ 8.5,
no critical issue) or the round budget is spent, publishes it locally, and marks it done.
Provider limits stop a run cleanly; the next iteration resumes it.

## Rules

- Facts only from the film's verified research bible; quotes verbatim from `quotes.json`.
- Real people appear as respectful silhouettes with name cards; never invented words.
- Even-handed on contested history, geopolitics and every lab, including Anthropic.
- Spend: ElevenLabs runs through `narrate.mjs` with `--budget`; Strudel and rendering are local.
- Deployment (Cloudflare) and git pushes stay human decisions.
