# lab/json-search digest

**Question:** Is there a point where regex search, the JSON highlighter, or both in one app become "clearly more performant from the gpu parallelism" by running one program over 100,000 JSON documents at once?

**Mechanism:** The code is in src/json-search. lab/json-search holds the measurement pages, the harnesses and the raw results. Each program is built as one step for a single position (`buildJsonLoop`, `buildSearchLoop`) and written into a WGSL `for` loop over 512 positions. Each GPU thread handles one document. The highlighter's display kinds stay on the GPU and feed the search. `compilePattern` turns a pattern into automaton cells, so one program per state capacity (8, 16, 32) serves every pattern. There were three stages: the highlighter written out position by position, then loop-emit.ts loops (one f32 statement per operation), then bit-emit.ts, which writes the same gated reads as ANDs of 32-bit words. gpu/combined-run.ts, writers-run.ts and review-run.ts drive headless Chrome, time `createGpuSearcher`, and check every readback against plain-JS references.

**Result:** (README.md) For 100,000 documents, one search takes 4.6, 4.7 and 5.2 ms back to back at 8/16/32 states with bit-emit.ts, versus 7.8, 69 and 945 ms with loop-emit.ts ("1.7, 15 and 180 times less"). It takes 11 to 16 ms after a 200 ms pause. RegExp on one thread takes 8 to 43 ms, and 2.1 s on the backtracking `([a-z]+)+x`. The same programs on the CPU take "200 to 40,000 times as long". No GPU value differed from the CPU: about a billion compared per run.

**Status:** The answer is mixed. Against RegExp on one thread the GPU is faster for most patterns, but "Against JavaScript in several workers: no." The highlighter is "clearly faster only as a repeated pass". The README says the demo is honest only if it doesn't "claim to beat RegExp on every pattern". A review "corrected the write-up where it claimed more than the measurements show." Still open: other GPUs and browsers, a million documents, and the pause slowdown ("The cause wasn't found"). The page moved to src/json-search on October 14, 2026 (lab/status.md:103).

**Visual idea:** A 100,000-cell map with one cell per document. As a pattern is typed, every cell lights up at the same moment, with a GPU timer next to a RegExp bar. Then the 32-state pattern bar shrinks from 945 ms to 5.2 ms as rows of f32 statements fold into single 32-bit AND words.

**Sources:**
- lab/json-search/README.md:1-212, 247-271, 606-616, 775-814, 896-950
- lab/json-search/report.ts:1-30
- lab/json-search/gpu/combined-page.ts:12-22, 112-235 (imports and searcher calls)
- src/json-search/search-step.ts and searcher.ts (export lines only)
- lab/status.md:103, 107, 116
- commit 4ea7fcb
