# Book quality doctrine — be proactive, cite sources, score it

Every book we generate (`/new-book`, `/new-series`, `/tweak-book`, the GitHub book workflows) follows this page. It
brings books up to the habits of the films: the film pipeline researches before it writes, fact-checks adversarially,
traces every claim to a source, grades itself on an eight-dimension rubric, and fixes what the grade finds. A book is
smaller than a film, so the machinery is lighter, but the habits are the same.

Authoring-model routing is unchanged ([authoring-models.md](authoring-models.md)): Astra plans, Opus 5.5 authors the D3
scenes and, when a book has music, composes the Strudel. Provenance is recorded as for any other stage.

## 1. Be proactive

Do the work a careful author would do without being asked, and report what you did. Do not stop at "authored but unbuilt".

- **Research past the digest.** The repo digest is a starting point. Open the real files, the docs, the tests, the
  issue or PR that explains why the code looks the way it does, and the paper if the subsystem implements one. A
  caption that only restates a function name has not been researched.
- **Verify before narrating.** Check every number, identifier and behaviour a caption states against the source it
  came from, *before* spending ElevenLabs credits. If you cannot find it, cut the line or mark it `inferred` (§2).
- **Self-review against the rubric (§4) before publishing**, then fix what you find and re-grade. Where you can run a
  fresh-eyes reviewer (a second agent that has not seen your reasoning, given only the digest, the narration text and
  the preview frames), do; a reviewer anchored on your conclusions is not a review.
- **Run every check yourself:** `npx tsc --noEmit`, `npm run build`, `node generator/verify-book.mjs --slug <SLUG>`,
  `node generator/blog-viz.mjs --slug <SLUG>`, `npm run book:sources -- --slug <SLUG>`. Look at the preview PNGs;
  fix clipped, overlapping, empty or tiny-text frames instead of noting them.
- **Close the loop.** If a check fails, fix the cause and re-run; do not hand the failure back. Ask the user only when
  you are genuinely blocked (missing credential, an ambiguous subsystem, a decision that is theirs).
- **Say what is true.** The PR description lists what shipped, the self-grade table, what you could not verify (you
  cannot hear the audio; say which judgements rest on timing data alone), and anything you left out on purpose.
  Never claim a check you did not run.

## 2. Cite sources like the films do

A film traces every narrated claim to `claims.json` / `quotes.json` and publishes a sources page. A book does the same
with one file, `public/generated/<SLUG>/sources.json`, authored beside `blog.md` and shown under the player.

```jsonc
{ "version": 1, "slug": "<SLUG>",
  "chapters": [ { "number": 1, "title": "…", "claims": [
    { "id": "c1-manager-fans-out",
      "claim": "A manager spawns a fixed trio of specialists and records each child in its own state.",
      "caption": 1,                       // 0-based index of the narration caption that states it
      "status": "verified",               // verified (default) | paraphrase | inferred
      "sources": [
        { "label": "manager-worker pattern doc",
          "repo": "owner/repo@<full 40-hex commit sha>", "path": "docs/patterns/manager-worker.md",
          "lines": "12-40", "quote": "a short verbatim excerpt" },
        { "label": "Durable Streams protocol", "url": "https://…" } ] } ] } ] }
```

- **Pin code to a commit.** Repo sources carry `owner/repo@<40-hex sha>` (use `git rev-parse HEAD` of the checkout you
  digested) plus a path and, where it helps, `lines`. A branch name drifts; a SHA does not. The player builds a GitHub
  permalink from it.
- **Prefer primary sources:** the code, the project's own docs and tests, the paper, the spec. A secondary write-up is
  a pointer to a primary one, not a substitute.
- **Quote verbatim** when a claim rests on wording. Keep excerpts short.
- **Coverage.** At least 70% of each chapter's captions must be the `caption` of some claim (the validator enforces it);
  the rest is connective tissue. Do not pad claims to hit the number; make the narration say checkable things.
- **Honesty about confidence.** `verified`: you read the source and it says this. `paraphrase`: the source says it in
  other words (keep the quote). `inferred`: your own reading of the code's behaviour; the caption itself should sound
  like an inference ("which means…"), not a fact. Contested or version-dependent behaviour is shown as such.
- **Validate:** `npm run book:sources -- --slug <SLUG>` fails on missing sources, unpinned repos, non-https links,
  out-of-range caption indices, duplicate ids and low coverage, and on success binds `manifest.sources`. Run it after
  `video.mjs` (it needs the manifest's cue count) and again after any narration edit.
- The blog post's closing section names the main sources in prose, as the film's end card does.

## 3. Music with Strudel (optional, when asked)

A book can carry a quiet music bed per chapter, composed as Strudel live-coding patterns, the same engine and render path
the films use. It is a bed under a voice, not a score to be noticed.

1. Build the book first (narration durations must exist). Then write
   `public/generated/<SLUG>/music/chapter-<n>.strudel`, one per chapter, **committed**: the code is the score.
2. `npm run book:score -- --slug <SLUG>` renders each pattern through strudel.cc's Export to WAV
   (`generator/film/score.mjs` `file` mode, headless, sample-exact), sizes it to the chapter's narrated duration, encodes
   `music/chapter-<n>.mp3` (leveled to about -20 LUFS, 3 s fade-out), and binds `chapters[].music` in the manifest.
   `--chapter n` re-renders one; unchanged patterns are skipped; `--force` re-renders. About 1.5 minutes per chapter.
   After editing narration, re-run it: the chapter length may have changed.
3. The player (`player/music-bed.ts`) mirrors the narration clock: it plays, pauses, seeks and mutes with it, plays at
   `music.gain` (default 0.3) and fades out over the last 3 s. Narration never depends on it.

How to compose for a voice (you cannot hear it, so lean on the recipe):

- **Stay out of the voice's way.** Low-mid register, slow attacks, `lpf` around 1.5–2 kHz, no bright leads and no
  transient-heavy percussion; sparse and slow (about 54-76 bpm, `setcpm(bpm/4)`). Nothing busy in the 1–4 kHz band.
- **One motif per book**, stated in chapter 1 and varied by chapter (re-voiced, re-harmonised, thinned or thickened) so
  the book sounds like one thing. Let the harmony open up as the idea resolves; end on a held chord, never a loop seam.
- **Match the beat sheet.** The chapter's tension and release come from its scene (the fan-out, the failure, the
  payoff), not from a template. Machines clack and tick; they never chime.
- **Length is exact in cycles.** `duration × cps` cycles; use `arrange([cycles, pattern], …)` or `<…>` sequences so the
  music ends rather than loops. Deterministic only: no unseeded randomness.
- Useful instruments (`gm_string_ensemble_1`, `piano`, `gm_cello`, `gm_celesta` sparingly), `chord("<…>").voicing()`,
  `.room()`, `.lpf()`. Recipe and measured results: `docs/film/research/strudel-music-backend.md`.
- Record in the PR that the music is Strudel code authored by the composing model, and credit it in the blog post's
  closing line ("Music: Strudel patterns, rendered with strudel.cc").

## 4. The rubric (the film excellence gate, adapted)

Eight dimensions, 1-10; 8 is genuinely excellent, 9-10 are exceptional, a merely competent book is 6-7.
**Pass = every dimension ≥ 8, mean ≥ 8.5, no critical issue** (the film bar).

| dimension | for a book |
|---|---|
| accuracy | every claim concrete and traceable to the cited source (§2); no invented components; contested points shown as contested |
| depth | mechanisms, numbers, edge cases and trade-offs, not a glossy overview; an expert would respect it |
| clarity | a curious newcomer follows it: terms defined before use, one idea per beat, speakable sentences |
| story | arc across chapters, a planted question paid off, chapters that connect, a closing line worth remembering |
| visual | the picture carries the idea; legible, uncluttered frames; a clean last frame; no clipping off the stage |
| sync | motion lands on the words; captions and cues agree; nothing cut off before the chapter ends |
| sound | narration pace 110-170 wpm, identifiers expanded for the ear, pronunciation risks handled; music (if any) sits under the voice |
| curiosity | leaves a sharp question or a new mental model; makes you want to look at the code |

Grade honestly, and say what you could not judge: from timing data and still frames alone you cannot see the motion or
hear the audio, so `sync` and `sound` are judged from the narration cue times and the script, and stay in the 6.5-7.5
range unless someone has actually watched the book.
