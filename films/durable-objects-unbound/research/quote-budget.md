# Quotation budget — durable-objects-unbound (finalized 2026-11-01)

Author: claude-opus-5-5 (high), narrow quotation finalization before the final clock.

**Rule (one, checkable):** quoted material from any single source URL stays **≤ 25 words in total**. Counted, each
appearance separately (repeats count again): narration quoted spans, on-screen quote cards, credits quotations, any
unmarked run of ≥ 5 consecutive words in narration or labels that is verbatim in that source's verified witness, and
one listed attributed near-verbatim paraphrase (L0408). The film's sources page republishes `research/quotes.json` texts,
so the ledger holds only the delivered excerpts. Check: `node films/durable-objects-unbound/research/tools/quote-budget.mjs`
(the unmarked-run scan uses the full witnesses kept in the ignored `.orly-work/durable-quote-witnesses/`).

| words | source URL | counted appearances |
|---:|---|---|
| 24 | denoland/celld docs/guarantees.md @8702f6d | Q24 card ch03-s05 (7); Q25 card ch06-s04 (11); unmarked run in L0625 (6) |
| 23 | blog.cloudflare.com/introducing-workers-durable-objects (2020) | Q01 card ch02-s01 (10); Q02 card ch02-s02 (13) |
| 22 | blog.cloudflare.com/deno-joins-cloudflare (2026 joint post) | Q10 "we were delighted." L0409 (3); unmarked runs L0409 (8), L0216 (5); L0408 near-verbatim (6) |
| 21 | allthingsdistributed.com 2021 S3 consistency (Vogels) | Q17 card (10); Q18 card (11), both ch03-s04 |
| 21 | cloudflare/workerd commit aa494794 | Q16 narration L0421 (5); Q14 card ch04-s04 (8) + repeated ch08-s03 (8) |
| 17 | blog.cloudflare.com/durable-objects-easy-fast-correct-choose-three (2021) | Q03 card ch02-s03 (17) |
| 16 | blog.cloudflare.com/sqlite-in-durable-objects (2024) | Q05 card (4); Q06 card ch02-s05 (12) |
| 10 | blog.cloudflare.com/workerd-open-source-workers-runtime (2022) | Q04 card ch02-s04 (10) |
| 9 | denoland/celld README.md @8702f6d | Q19 card ch04-s01 (9) |
| 7 | deno.com/blog/cloudflare | Q12 card ch04-s03 (7) |

## Exact narrowed changes

**Excerpts** (each verified as an in-order exact substring of its byte-verified 2026-10-31 witness; "…" marks omitted words):
Q01 "…only one location in the whole world at a time." · Q05 "Latency is effectively zero" · Q06 "Once at least three of these
followers respond… the write is confirmed." · Q10 "we were delighted." · Q12 "the entire Deno team is joining Cloudflare" ·
Q14 "…the beginning of merging celld's functionality into workerd." (both cards) · Q17 "…a witness to writes, notified every time
an object changes." · Q24 "…ignores the condition fails late and silently" · Q25 "…cannot act on a value that a crash can still lose."
Unchanged: Q02, Q03, Q04, Q16, Q18, Q19.

**Quote cards → own-word labels** (kind `label`, ≤ 42 chars, attributed):
ch04-s01 "Ryan Dahl, 2026: why he started celld" · ch04-s02 "Varda: workerd's one gap, Durable Objects" · ch04-s03 "Varda: celld's
code and ideas into workerd" · ch04-s04 "Commit: no ack until the bucket holds it" · ch05-s05 "celld: reads the record, not a clock" ·
ch06-s05 "celld: no ack is no proof of absence" · ch07-s05 "celld: seal the old session, then restore" · ch07-s06 "celld: an error is
not proof of absence". Beats, cue/until timing and shot structure unchanged.

**Narration paraphrased** (IDs, beats and meaning kept; quotation marks removed; directions updated):
L0403 "He wanted a single binary, written in Rust, whose only outside service is object storage." (beat `binary` still anchors) ·
L0413 "After that year, Ryan Dahl writes, the team's work on the Deno runtime comes to an end." (beat `endyear` still anchors "end").
All other 201 spoken lines unchanged.

**Credits** (meta staging.creditsSources, required by validation once the ledger shrank): the five repeated quotations became
citations without quotation ("Source: Kenton Varda, Cloudflare blog, 28 September 2020", … "Source: Ryan Dahl, workerd commit
aa494794, 28 October 2026").

**Ledger:** research/quotes.json and quotes.lock.json hold the 15 delivered excerpts (lock version note added). Retired
(no longer delivered): Q07, Q08, Q09, Q11, Q13, Q15, Q20, Q21, Q22, Q23, Q26. Context fields of Q03 and Q10 reworded so they no
longer quote source text. No speaker, date, URL, claim or source changed.

## Not changed (flagged for root)

- `research/claims.json` claim summaries (republished on the sources page) paraphrase their sources and some share ≥ 5-word
  runs with the original witnesses (e.g. HI01, HI02, HI12, HI13, DU08). Claim facts were out of scope; not film quotations.
- Internal story/research documents: reconciled 2026-11-01 (post-production housekeeping, no clock change). `research/tools/
  build-research.mjs` now holds exactly the 15 delivered excerpts and regenerates `quotes.json` byte-identically (lock agreement
  checked); the HI12 note names the joint post's sections instead of retired IDs. `bible.md`, `outline.json` and `reviews/` replace
  retired quotations with the retained excerpts, claim ids or own-word descriptions (reviews keep their historical IDs with a
  retirement note). Left as is because they are locked clock inputs: plain-word beat descriptions in `story/chapters/ch04.json`
  that still name the retired Q08, Q26, Q11 and Q15 cards (no quotation text), and the generated `story/script.md`.
