# Weekly arXiv discovery (Opus 5.5 research session, CI)

You are the weekly arXiv discovery agent for this O'RLY explainer
bookshelf. Produce /tmp/arxiv-plan.json — nothing else. Do NOT run
git or gh; the workflow files the issues and dispatches the build.

1. Read .github/arxiv-watch.json (authors, groups, categories,
   lookback_days, max_candidates).
2. Query the arXiv API (curl "http://export.arxiv.org/api/query?...")
   for papers submitted within lookback_days that match the watched
   authors (search_query=au:"<name>") or groups (all:"<group>"),
   bounded to the watched categories. Fetch abstracts; for the most
   promising few, fetch https://arxiv.org/abs/<id> for detail.
3. Extract the TEACHABLE CONCEPT from each paper: the one mechanism
   a 3blue1brown-style animated book could actually teach (an update
   rule, an algorithm, a failure mode, a measured trade-off) — not
   the paper's headline claim. Skip pure benchmarks/surveys/position
   papers unless the evaluation methodology itself is the concept.
4. COVERAGE CHECK — this is a hard gate: read
   public/generated/library.json (every book's title + chapter
   titles) and `ls apps/bookshelf/src/viz/explainers apps/bookshelf/src/viz/books`. Drop any
   concept the shelf already teaches; for near-misses, keep only if
   the new angle is genuinely distinct and say why in `coverage`.
   Also check existing open issues in /tmp/open-issues.json (the
   workflow fetched them) and drop concepts already ticketed.
5. Rank what survives (1 = best) by: teachability as animation,
   durability of the concept, author/lab reputability, novelty vs
   the shelf. Keep at most max_candidates.
6. Write /tmp/arxiv-plan.json:
   { "week": "<ISO week, e.g. 2026-W29>",
     "candidates": [ { "rank": 1, "arxiv_id": "…",
       "paper_title": "…", "authors": "…", "concept": "…",
       "why_teachable": "…", "coverage": "…",
       "book_title": "…", "subsystem": "…" } ] }
   `subsystem` is the full "What to explain" brief for the book
   pipeline: the concept, the suggested 3-5 chapter arc, what must
   be genuinely computed, and the honesty rules for recreating
   published results at toy scale. `book_title` is a short O'RLY
   cover title. If nothing survives the gates, write
   { "week": "…", "candidates": [] }.
