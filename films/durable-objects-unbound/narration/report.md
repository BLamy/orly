# Voice + narration + clock — stage report (2026-11-01)

Author: claude-opus-5-5 (high), film voice/narration engineer, via Claude Code. Provider: ElevenLabs
eleven_multilingual_v2 (with-timestamps character alignment) + scribe_v1 STT. No book pipeline was used.

## Result

| | |
|---|---|
| Voice | George (premade, `JBFqnCBsd6RMkjVDRZzb`), speed 0.9, stability 0.60 / similarity 0.80 / style 0.05 / speaker boost, seed 1398879544. Unused by any other film. Nothing created, cloned or added. |
| Locked clock | **1439.42 s (23.99 min)** @ 24 fps (after the quotation finalization); target 1440 s, ceiling 1680 s, brief range 20–28 min |
| Script | 8 chapters, 42 shots, 203 lines, 3269 display words (story check: 0 errors, 0 warnings) |
| Pace | 160.0 wpm over summed line speech (1226.8 s, 3271 aligned words); QA overall 163 wpm; audition 154.2 wpm |
| Alignment | 203/203 lines matched from provider character alignment; 0 unmatched, 0 estimated; no draft, no synthetic timings |
| Stem | −19 LUFS, TP −1.8 dBTP, limiter 0.94 dB, compressor 1.93 dB GR, rides ≤ 3 dB |
| Clip edges | 242/242 cut edges under −50 dBFS |
| STT | 203/203 lines round-tripped on current takes; all 36 lexicon/cast term lines heard literally |
| QA (narration,timeline) | 12 pass · 3 warn · 0 fail |
| Credits | ledger total **11,674** of the 20,000 cap: audition 251 · narration 10,836 · STT 587 |

## Passes (takes preserved; only changed lines re-paid)

1. Full film, 44 chunks: 8,111 credits. STT: 23 lines failed literal term match. They were transcriber spellings of the
   intended sounds ("Worker D", "Cell D"/"Seldi", "ES3", "ESQL Lite", "or two", "EF sync", "Lightstream").
2. Lexicon respelled to letter forms with the same intended sounds (see voice/lexicon.json $notes): 41 lines
   re-taken, 1,993 credits. 2 left (L0215, L0416 heard "Worker Dee").
3. QA pacing: 18 lines over 200 wpm. Solo re-takes at speed 0.80–0.85: 474 credits; 6 left.
4. Breaths at existing punctuation (insertGaps: L0214 'letter' 0.25, L0525 'defence' 0.32, L0620 'pin' 0.28, L0817 'Well' 0.3)
   + solo re-takes L0318/L0702 @0.72, L0817 @0.75: 71 credits; pacing passes.
5. One solo re-take of L0215/L0416 @0.88: 70 credits; both STT literal.

6. Quotation finalization (2026-11-01, research/quote-budget.md): L0403 and L0413 paraphrased (no quotation); only those two
   lines re-narrated (78 credits). L0413's first take transcribed "Dino" for Deno; one solo re-take at speed 0.88 (39 credits)
   came back literal. L0403 149 wpm, L0413 165 wpm, both clean edges. The other 201 takes kept; timeline rebuilt once.

## Story-file changes made at this stage (recorded; no spoken meaning changed)

- Integration review (.orly-work/durable-film-integration-review.md): every cited ch05/ch07/ch08 line was already
  narrowed in the locked script (L0504 "at most one claimant wins"; L0711 "can answer much sooner"; L0719 "proof rests on two
  copies"; L0809 limited to staged cases; L0814 "make two rooms commit as one"; ch07-s06 both cases kept; L0502 claimed vs
  opened). **No wording correction was needed.**
- **Validation issue → fix: L0710** carried a stale explicit `spoken` ("…called object storage tens or hundreds of milliseconds
  away, and used followers") that disagreed with its reviewed caption ("Cloudflare's hosted relay, back in 2024, answered that
  with followers."; round-1 moved the latency figure to the screen). The `spoken` field was removed so audio = caption.
- **Validation issue → fix: ch07-s03 beat `badge`** anchored the word "celld's" in L0713, an explicit-spoken line whose
  word count differs from its caption (0.6.3), so the timeline uses lexicon-expanded spoken words ("cell D's") and could not
  resolve it while the script validator checks the pre-lexicon spoken text. Anchor changed to word index 2 (= "celld's" for
  the validator, "cell" for the clock: the same instant). Pipeline quirk worth fixing in generator/film (timing vs script
  validator word lists).
- Production fields only (no text change): `tts {solo, speed}` on 21 lines (L0101 L0109 L0111 L0114 L0203 L0214 L0215 L0302
  L0318 L0331 L0332 L0413 L0416 L0517 L0525 L0620 L0702 L0724 L0726 L0734 L0817) and the four `insertGaps` above.
- story/meta.json runtimeCeilingSec was already 1680; not changed.
- Quotation finalization: per-source ≤ 25-word budget; quote cards, L0403/L0413, credits and the quote ledger/lock narrowed
  as listed in research/quote-budget.md.

## Human listening (pending; never signed off by a model)

`npm run film:voice -- listen --slug durable-objects-unbound`, then `film:voice signoff`:
celld (L0324), workerd (L0215), Deno (L0401), SQLite (L0217), S3 (L0301), epoch (L0501, consistency across the film),
Vogels (L0320), Litestream (L0406). Also unassessed by ear: overall voice quality and whether the slower solo re-takes
(speed 0.72–0.88) sit naturally beside their chunk neighbours.
Remaining QA warnings: 4 explicit-spoken lines anchor on spoken words (L0411 L0414 L0713 L0806); lines at 185–199 wpm
(L0101 L0110 L0111 L0114 L0117 L0211 L0214 L0219 …); listening pending.

## Next stages

The clock is locked: `/film-score` and `/film-shots` can start in parallel against
apps/bookshelf/src/viz/films/durable-objects-unbound/timeline.json, then mix/render/QA (`/film-assemble`) and `/film-review`.
Any later line edit: re-run film:narrate (line-level reuse), film:stt, film:timeline, and re-fit cues/shots.
