# durable-objects-unbound — post-production report (2026-11-01)

Engineer: Claude Code, claude-opus-5-5, high effort. No other model was used, and no story, narration or music was
newly generated. Markers honoured: the mix ran only after `.orly-work/durable-film-score-ready.json` (05:05Z). The
render, sheet checks and publish ran only after `.orly-work/durable-film-shots-ready.json` (07:15Z). Both markers'
timeline sha256 `2482f4b2…253c` equals `narration/timeline.json` and the app copy. The cues sha256 `39a58b1a…8812`
equals `score/cues.json`.

## 1. Clock

`node generator/film/qa.mjs --slug durable-objects-unbound --stage narration,timeline,score` passed:
- the timeline is locked (not a draft) and fresh, and the app copy is identical;
- it holds 203 lines, 42 shots and 341 beats on whole frames;
- the clock is 1439.4167 s (24.0 min) against a 24 min target and a 28 min ceiling.

No re-lock, refit or re-take was needed. The locked story files are unchanged (script.json md5 `e4b86fa3…`,
meta.json md5 `d9b78c69…`).

## 2. Mix

Command: `node generator/film/mix.mjs --slug durable-objects-unbound` (defaults; no configuration change was needed).

| measure | result | target |
|---|---|---|
| integrated loudness | −16.0 LUFS, linear gain only, no master limiting | −16 ±0.5 |
| true peak | −1.7 dBTP | ≤ −1.5 |
| LRA | 3 LU | — |
| duck under narration | 2.85 dB (calibrated: threshold −32.04 → −23.0 dBFS, ratio 3) | depthDb 3 ceiling |
| lowest voice-over-music margin | 10.8 dB (L0423) | fail < 6 dB, warn < 10 dB |
| room-tone floor | −58 LUFS; quietest 400 ms is −58 LUFS | > −70, never zero |
| music-only swells trimmed | 0 (ceiling −18.35 LUFS M) | — |
| fades after last strike | every cue at least 2.44 s after its final strike (m07); minimum required 1.6 s | ≥ 1.6 s |
| narration stem | −19 LUFS, TP −1.8, limiter 0.94 dB, compressor 1.93 dB GR | limiter ≤ 1 dB |

Score: 8 original Strudel cues, m01–m08, covering 24.2 of the 24.0 minutes. Each cue's gain is −6 dB and each ducks at
3:1. There are 7 cue joins, each in the clear before the next line. Music EQ: a 35 Hz high-pass, and below 120 Hz a
keyed shelf takes 1.71 dB more off under speech.

Chapter slices: `mix/chapters/1..8.m4a` at 192 kbps, 2.7–6.2 MB each. Their boundaries equal the timeline chapters
(0, 108.875, 275.125, 482.8333, 640.875, 877.375, 1060.375, 1303.0417 → 1439.4167).

## 3. Render

Command: `FILM_DEV_URL=http://127.0.0.1:5216 node generator/film/render.mjs --slug durable-objects-unbound --dev --workers 3 --crf 20 --resume`

- The render took 543 s wall time, aggregate 67 fps, in 72 segments of 480 frames. All 72 were freshly rendered: no
  earlier segments existed, so no stale cache could be reused. There were no page errors.
- Output: `films/durable-objects-unbound/render/film.mp4`, 687.6 MB.
- No shot source changed after the render, so no segment invalidation was needed.

ffprobe on `film.mp4`:
- video: h264 yuv420p, 1920×1080 at 24/1. The packet count is 34,546, equal to round(1439.4167 × 24) = 34,546.
- audio: AAC, 1439.416667 s, the same as the video duration 1439.416667 s, so A/V agree to well within one frame.
- captions: a mov_text track (eng) built from `render/film.vtt`, which has 296 cues.
- chapters: 8, titled 1–8, with boundaries equal to the timeline chapters and no container warnings.

A spot check of 8 frames cut from the movie shows the real Canvas shots.

## 4. Shot evidence (sheets, cards, depth, legibility)

The animation director's results were reused wherever they were fresh. A film-local freshness check,
`.orly-work/durable-post/freshness.mjs`, compares each shot's evidence against the newest file in its film-local source
closure: the shot, its imported sets and cast, and the timeline.
- 12 sheets predated later edits to the shared `sets/harbourTown.ts` and to `sets/ch04-s01-study.ts`. They were
  re-sheeted on 5216: `node generator/film/sheets.mjs --slug durable-objects-unbound --shot ch02-s02,ch02-s03,ch02-s04,ch02-s05,ch03-s05,ch03-s06,ch04-s01,ch04-s02,ch04-s03,ch07-s02,ch07-s05,ch08-s03`.
  The sheets I read (ch04-s01, ch02-s02) were clean.
- Cards, legibility and depth summaries post-date every source edit: cards at 07:09Z, legibility 07:04Z, depth 07:03Z.
  All 42 shots are fresh.

Final state:
- 42 current sheets.
- Cards: 0 blank probed cards and 0 ghost-text overlaps.
- Depth: 0 moving shots under 3 planes. ch01-s04, ch05-s02, ch05-s06 and ch07-s05 are locked-off, so the audit does
  not judge them.
- Legibility: 0 subject texts under 22 px cap.

## 5. Publish

Command: `node generator/film/publish.mjs --slug durable-objects-unbound`. It was run twice; the second run followed the
claim-text correction in §7 and reused all stems.

Output: `public/generated/durable-objects-unbound/`:
- `manifest.json`: format 3, kind `film`, timing `locked`, runtime 1439.4167, 24 fps, 1920×1080. It carries the
  loudness and the score block (strudel, 8 cues).
- `audio/film-audio.json`: stems for 203 narration lines and 8 cues.
- `audio/chapter-1..8.m4a`: the fresh mastered slices.
- `film.vtt`.
- `previews/chapter-1..8.jpg`: cut by ffmpeg from the rendered `film.mp4`.
- `credits.json`.
- `sources/index.html` and `sources.json`: 109 claims, 15 quotations and 38 sources.

Library: one entry was added, `{kind: film, href: ?film=durable-objects-unbound, runtime 1439.42, vhs: ocean}`. The
library went from 181 to 182 entries, and the other 181 are byte-identical. The predecessor book's public assets and
library entry had already been removed upstream (cd951455), so there was nothing obsolete left to delete.

The master MP4 stays out of `public/` because of the 25 MiB static asset cap. The largest public file is under 24 MiB,
and the whole public folder is 80 MB.

Film-specific credits correction: `.orly-work/durable-post/fix-credits.mjs` must be re-run after every publish. The
shared helpers say Anthropic is "a lab in this story", which is false for this film. The script corrects that only in
this film's generated `public/.../credits.json`, `public/.../sources/index.html` and
`apps/bookshelf/src/viz/films/durable-objects-unbound/credits.json`. It keeps the true disclosure, "Claude Opus 5.5 is
made by Anthropic". No shot imports `credits.json`, so the movie's picture never showed the phrase. The shared engine
was not edited.

## 6. QA

Command: `node generator/film/qa.mjs --slug durable-objects-unbound`. Result: **40 pass · 6 warn · 0 fail · 0 skip**
(`qa/reports/latest.json`). The warnings are real and stay open:
- `narration.listening`: human sign-off is pending for celld, workerd, Deno, SQLite, S3, epoch, Vogels and Litestream.
  These were not signed here; machine STT passes on all 203 current takes.
- `narration.pacing`: 163 wpm overall. The fastest lines are L0101 at 199 wpm and L0117 at 198, both under the
  200 wpm fail threshold.
- `narration.wordMap`: L0411, L0414, L0713 and L0806 anchor on their spoken words.
- `mix.lineLevels`: L0423 sits 1.87 dB under the level target. The eight −2 dB lines are intentional hints.
- `sheets.cards`: the audit flags unprobed paper as suspect in ch06-s01, ch06-s03 and ch03-s03. The shot authors read
  these frames as the ribbon's paper and the brass swap cards.
- `sheets.ghostText`: in two transitions, text fades over the other shot's picture for about 0.42 s:
  - ch02-s04: "#42 · the ferry is late";
  - ch08-s03: "workerd · 31 Oct" and "AS OF · 31 OCTOBER 2026".

No excellence pass is claimed. The independent final review has not run.

## 7. Quotation and reference housekeeping (no clock change)

- `research/tools/build-research.mjs` now holds exactly the 15 delivered excerpts, carrying their excerpt markers.
  - Regenerating reproduces `quotes.json` byte for byte and agrees with `quotes.lock.json`.
  - The quote budget passes: every source is at most 25 words.
  - The HI12 note now names the joint post's sections instead of the retired Q07 and Q26.
- On the published sources page, 18 claim summaries (HI01, HI02, HI06, HI08, HI12, HI13, HI14, HI15, HI18, HI20, HI21,
  HI23, SB03, SB11, LE12, DU08, CE07, CE09) re-expanded retired or narrowed quotations: long verbatim runs, and in
  HI01 and DU08 explicit "in the post's / celld's own words" quotes. Each was reworded in its own words.
  - Ids, sources, status, dates and facts are unchanged; the 118 claims are still 118.
  - Identifiers stay quoted: the commit title, error strings, the "Acquisitions" tag and the illustrative fixtures.
- `bible.md`, `outline.json` and `story/reviews/` replace retired quotations with the retained excerpts, claim ids or
  own-word descriptions. The reviews keep their historical ids under a retirement note, and their outcomes are
  unchanged.
- `quote-budget.md` records the above.
- A film-local `.gitignore` keeps the `qa/sets/*.png` snapshots and the `narration/narrate-run*.log` files out of git.
  Both stay on disk.

## Residual limits (for root)

- **Retired quote run in a locked chapter blurb.** The ch04 blurb in the locked `story/chapters/ch04.json` (copied
  into `script.json` and the published manifest) says "one binary with object storage as its only outside
  dependency". That is a 6-word unmarked run from the retired Q09 (2026 joint post). The joint post sits at 22 of
  25 words under the narration-and-labels rule. Counted conservatively, this blurb would take it to 28. Fixing it needs
  a story or meta edit, which this run was not authorised to make.
- **Beat descriptions name retired quote cards.** Some beat descriptions in `story/chapters/ch04.json` name the retired
  Q08, Q26, Q11 and Q15 cards (plain words, no quotation text).
- **No cover.** No `films/<slug>/cover/animal.*` exists. Films use the VHS sleeve, so publish only notes this.
- **Disk space.** About 1.3 GiB is free after the render. `render/segments/` (≈ 0.6 GB) is kept as the resume cache
  next to `film.mp4` (687.6 MB).
