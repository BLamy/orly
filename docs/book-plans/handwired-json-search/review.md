# Review: handwired-json-search captions

Source: `.orly-work/hw-books/repo` at `4ea7fcb27ebe93acf49b9f29a93e162b975bad46` (read-only). Every caption was checked against the cited source file and, for the numbers, against `lab/json-search/README.md` and `lab/status.md`. I ran `bun lab/json-search/report.ts loops` and `documents` from the clone; they reproduce the operation counts (18,961, 107 statements, 1,025 reads at 32 states, 122,888 and 1,167,392 per document) and the defect and length counts (89,943 valid, 10,057 broken, 16 defect kinds). I did not run the GPU measurements. The search-step size of 240 per position and the "error" match of five positions are hand-derived from the source comments and were not executed.

Tally: 48 captions, 42 OK, 6 FIX (chapter 1 #11, chapter 2 #8, chapter 4 #2, #3, #6, #7). Each FIX was applied in place in `book.json` and in the matching caption line of `plan.md`. Nothing else was edited.

| chapter | # | verdict | old → new | source path:line | verbatim quote |
| --- | --- | --- | --- | --- | --- |
| 1. One Thread Per Document | 1 | OK | | lab/json-search/README.md:52 | `I was wondering if there's a point where regex search or json highlighter` |
| 1. One Thread Per Document | 2 | OK | | lab/json-search/README.md:52 | `On the CPU executor one document took 80 µs for the highlighter` (GPU round trip: `a round trip to the GPU alone takes 0.6 ms or more`) |
| 1. One Thread Per Document | 3 | OK | | lab/json-search/README.md:52 | `every document runs the same operations, and no document reads another one's values` |
| 1. One Thread Per Document | 4 | OK | | src/json-search/json-step.ts:65 | `512 code points, then the text's length` |
| 1. One Thread Per Document | 5 | OK | | lab/json-search/README.md:199; :189 | `89,943 are valid and 10,057 are broken` / `16 defects, in 1 document of 10` (report.ts documents: 16 defect kinds) |
| 1. One Thread Per Document | 6 | OK | | lab/json-search/report.ts (run: `loops`); src/json-search/json-step.ts:158 | `step 37, end 17` and `18,961` (JSON highlighter row, 512 positions) |
| 1. One Thread Per Document | 7 | OK | | lab/json-search/README.md:55 (report.ts loops: 107 statements) | `compiles in 0.04 s` (statement count 107) |
| 1. One Thread Per Document | 8 | OK | | lab/json-search/README.md:54; :205 | `the shader took about 2 s to compile` / `The shader took 1.9 s to compile for the summary and 2.3 s with the display kinds` |
| 1. One Thread Per Document | 9 | OK | | lab/json-search/report.ts (run: `loops`) | `18,961 per document`; 18,961 × 100,000 = 1.90 billion, "about 1.9 billion" |
| 1. One Thread Per Document | 10 | OK | | lab/json-search/README.md:118; :141 | `the highlighter's pass takes 2.2 ms` (documents already on the GPU, passes back to back) |
| 1. One Thread Per Document | 11 | FIX | "takes 2.1 seconds, and on the CPU executor 8.4 to 9.2 seconds" → "takes about 2.1 seconds, extrapolated from 5,000 documents. On the CPU executor it takes 8.4 to 9.2 seconds. Every value from the GPU matched the CPU's." | lab/json-search/README.md:140 (also :118; the 51.6 million values are at :244 and :771, not "~line 780" as the pointer says) | `2.1 s, extrapolated from 5,000 documents, and 8.4 to 9.2 s, with every position written out` |
| 1. One Thread Per Document | 12 | OK | | lab/json-search/README.md:170 | `One Apple M5 Max, one browser, headless` |
| 2. Search Is a Matrix Product | 1 | OK | | src/json-search/regex/data-program.ts:1-5; src/json-search/search-step.ts:2-3 | `its automaton and its character classes sit in cells, so a new pattern writes cells and changes no program` |
| 2. Search Is a Matrix Product | 2 | OK | | lab/json-search/README.md:150 | `A pattern has one state per character or class it reads, plus one` / `e.g. error has 6 and connection reset has 17` |
| 2. Search Is a Matrix Product | 3 | OK | | src/json-search/search-step.ts:9-10 | `export const classCapacity = 16` / `export const boundaryCapacity = 32` |
| 2. Search Is a Matrix Product | 4 | OK | | src/json-search/regex/data-program.ts:27-28; src/json-search/search-step.ts:7-8 | `transitions[c][s][t] is 1 when a step from state s reads a code point of class c` / `each step multiplies the code point's transition` |
| 2. Search Is a Matrix Product | 5 | OK | | lab/json-search/report.ts (run: `loops`); src/json-search/regex/data-program.ts:48-50 | forward-pass table reads `0, 65, 64` at 8 states and `0, 1,025, 1,024` at 32 (one lookup per pair of states) |
| 2. Search Is a Matrix Product | 6 | OK | | src/json-search/search-step.ts:9-11 | `reach[j][s] is 1 when some path from state s at position j reads at` |
| 2. Search Is a Matrix Product | 7 | OK | | src/json-search/search-step.ts:11-12 | `reached[j][s] is 1 when the match in progress has reached state s by position j` / `Code point j continues the match when reached[j][s] && reach[j][s] for some state s` |
| 2. Search Is a Matrix Product | 8 | FIX | "A new match starts where the reverse pass marks the initial state. So the forward pass already knows a longer match exists, and never backtracks." → "When no match is in progress, a new one starts where the reverse pass marks the initial state. So the forward pass already knows whether a longer match exists, and never backtracks." | src/json-search/search-step.ts:12-14 | `when no match continues, a match starts at j when reach[j][initial state]` (the caption dropped the condition) |
| 2. Search Is a Matrix Product | 9 | OK (hand-derived, not executed) | | src/json-search/search-step.ts:9-14; lab/json-search/README.md:150 | `error` is five code points; the reverse pass starts a match only at the `e`, and the forward pass carries it through five positions. Not executed. |
| 2. Search Is a Matrix Product | 10 | OK | | src/json-search/search-step.ts:2; lab/json-search/report.ts (run: `loops`) | `240 operations at 8 states, whatever the number of positions` (148 + 92; 356 + 308 = 664; 1,156 + 1,124 = 2,280) |
| 2. Search Is a Matrix Product | 11 | OK | | lab/json-search/report.ts (run: `loops`); src/json-search/bit-emit.ts:14-16 | `FP32 then computes every one of them without rounding` (122,888 and 1,167,392 per document at 512 positions; the exactness claim rests on bit-emit's header, not on search-step.ts:11-12) |
| 2. Search Is a Matrix Product | 12 | OK | | src/json-search/search-step.ts:58-59; :13-15 | `searched = searchable[kind] ? codePoint : -1` / `so no match of 'strings' or 'keys' crosses one` |
| 3. Packing the Bits | 1 | OK | | lab/json-search/README.md:631-633 | `7.81 (7.32 to 10.3)` at 8 states; `68.8 (64.1 to 74.3)` at 16; `945 (923 to 1012)` at 32 (loop-emit, back to back) |
| 3. Packing the Bits | 2 | OK | | lab/json-search/README.md:268; lab/json-search/report.ts (run: `loops`) | `4,648` WGSL statements; `1,156, 1,124` operations per position, reads `0, 1,025, 1,024` at 32 states |
| 3. Packing the Bits | 3 | OK | | lab/status.md:116; src/json-search/searcher.ts:467-468 | `The search program as written didn't change` / `it is still weighted sums, ReGLU gates and index reads` |
| 3. Packing the Bits | 4 | OK | | src/json-search/bit-emit.ts:35 | `E.g. relu(a - b) is a & (b ^ 1u)` |
| 3. Packing the Bits | 5 | OK | | src/json-search/bit-emit.ts:47-49; lab/json-search/README.md:435 | `(word[base] & opens) == 0u` / `since a row of up to 32 states is one word there` (README:435 is about the hand-written kernel; bit-emit's rule is the gate form) |
| 3. Packing the Bits | 6 | OK | | src/json-search/bit-emit.ts:10-11; :5-6 | `A value is "whole" when it is a whole number within a range inside ±2^24` / `Every other operation is written by emit.ts's row writer, as loop-emit.ts writes it` |
| 3. Packing the Bits | 7 | OK | | lab/json-search/README.md:631-632 | `7.81 (7.32 to 10.3)` → `4.60 (4.13 to 8.46)`; `68.8 (64.1 to 74.3)` → `4.72 (4.32 to 5.71)` |
| 3. Packing the Bits | 8 | OK | | lab/json-search/README.md:633; :777 | `That is 1.7, 15 and 180 times less` (7.81/4.60 = 1.70; 68.8/4.72 = 14.6; 945/5.24 = 180) |
| 3. Packing the Bits | 9 | OK | | lab/json-search/README.md:780 | `100 to 10,000 documents take 0.6 to 1.9 ms at any of the three sizes` (back-to-back table, README:697-721) |
| 3. Packing the Bits | 10 | OK | | lab/json-search/README.md:162; :257 | `A search after a pause of 200 ms or more takes 2.4 to 3.2 times the back to back time` |
| 3. Packing the Bits | 11 | OK | | src/json-search/searcher.ts:13-14; lab/json-search/README.md:782 | `options.writers?.search ?? 'bit-emit'` / `options.writers?.highlighter ?? 'loop-emit'` / `So the searcher keeps loop-emit.ts's shader for the highlighter` |
| 3. Packing the Bits | 12 | OK | | lab/json-search/README.md:779; :658 | `2.4 million match counts and marks in 18 searches` / `103 million values of the highlighter` |
| 4. Who Does It Beat | 1 | OK | | lab/json-search/README.md:118 | `Against the same programs on the CPU: yes, by a wide margin, from about ten documents on` |
| 4. Who Does It Beat | 2 | FIX | "The highlighter takes 2.1 seconds as JavaScript, a search 14 seconds. That is 200 to 40,000 times as long as the GPU." → "The highlighter takes about 2.1 seconds, extrapolated, and a search 14 seconds. That is 950 to 3,100 times the GPU's time." | lab/json-search/README.md:140; :118; :129-130 | `2.1 s, extrapolated from 5,000 documents` (2.1 s is extrapolated, not measured). The "200 to 40,000" range is not reproduced by the cited numbers: 200 is 2.1 s against an after-pause search (11 ms), 40,000 is the executor's 3.2-minute search against a back-to-back search (4.5 ms). The new range is 2.1 s over the 2.2 ms highlighter pass ≈ 950, and 14 s over 4.5 ms ≈ 3,100. |
| 4. Who Does It Beat | 3 | FIX | "ten ordinary patterns" → "nine ordinary patterns" | lab/json-search/README.md:436 | `RegExp takes 0.08 to 0.43 µs per document on the nine ordinary patterns` (the tenth, `([a-z]+)+x`, takes 2.1 s, so it is outside 8–43 ms) |
| 4. Who Does It Beat | 4 | OK | | lab/json-search/README.md:123; :121 | `it takes less on seven of the ten, up to 3.5 times less, about the same on one, and more on the two` / `11 to 16 ms after a pause of 200 ms or more` |
| 4. Who Does It Beat | 5 | OK | | lab/json-search/README.md:124 | `it takes 5 to 12 ms against 2.1 s` |
| 4. Who Does It Beat | 6 | FIX | "The crossover is a few thousand documents back to back" → "The crossover is about 2,000 to 13,000 documents back to back" | lab/json-search/README.md:784; :160 | `from 2,000 to 13,000 documents on, depending on the pattern and the run` / `These counts are interpolated between four measured counts`. README:129 still says "from a few thousand documents on", which is the older wording. |
| 4. Who Does It Beat | 7 | FIX | "Eight workers count a pattern's matches in 1.9 to 6.7 milliseconds. After a pause, the GPU is two to eight times slower." → "Eight workers count a pattern's matches in 1.9 to 6.7 milliseconds, where the GPU takes 4.5 to 5.2 back to back. Workers were not timed after a pause." | lab/json-search/README.md:126; lab/status.md:120 | `its 11 to 16 ms after a pause is 2 to 8 times as long, with workers that weren't timed after a pause`. The caption compared the GPU after a pause with workers, which were never timed after a pause; 11 ÷ 6.7 = 1.6, not 2. |
| 4. Who Does It Beat | 8 | OK | | lab/json-search/README.md:120; :141 | `where the JavaScript highlighter takes 0.12 to 0.15 s` / `0.15 s from the texts` |
| 4. Who Does It Beat | 9 | OK | | lab/json-search/README.md:787-813; :791 | `It found these problems in the write-up and gaps in the checks, which are fixed` |
| 4. Who Does It Beat | 10 | OK | | lab/status.md:114; lab/json-search/README.md:208; :935 | `Why an evaluation after a pause takes longer wasn't found` / `The cause wasn't found.` |
| 4. Who Does It Beat | 11 | OK | | lab/json-search/README.md:129; :131 | `It doesn't take less than RegExp in 8 workers.` |
| 4. Who Does It Beat | 12 | OK | | lab/json-search/README.md:131 | `It isn't honest if it claims to beat RegExp on every pattern, or JavaScript in several workers.` |

## Visuals in plan.md with a wrong or unlabelled number

The scene authors read this file. These are not edited here.

1. **Chapter 4, visual beat 2, "multiplier badge `200 – 40,000×`"**: wrong. Use `950 – 3,100×`, matching caption 4.2.
2. **Chapter 4, visual, "RegExp ten-pattern bar 8–43 ms"** (beat 3 and the axis): wrong label. The 8–43 ms range covers nine ordinary patterns. The tenth pattern in the set, `([a-z]+)+x`, is the backtracker at 2.1 s and is shown separately in beat 5. Say "nine ordinary patterns".
3. **Chapter 4, visual, "CPU highlighter 2.1 s"** (axis, beat 2, and the on-screen labels): the 2.1 s is extrapolated from 5,000 documents (lab/json-search/README.md:140). Label it "extrapolated" or "about".
4. **Chapter 1, visual beat 8, "`2.1 s` generated JavaScript"**: same caveat as 3. The `8.4–9.2 s` executor time and the `51.6 million values · 0 different` seal were measured over all 100,000 documents.
5. Checked and correct: `2.2 ms`, `18,961 operations per document`, `step 37 · end 17`, `107 WGSL statements`, `3,994 shared cells` (report.ts loops), `89,943 valid · 10,057 broken`, the defect counts (`616 / 608 / 616 / 622`, the 474–748 range), `240 / 664 / 2,280 per position`, `122,888 / 339,984 / 1,167,392 per document`, `classCapacity = 16`, `boundaryCapacity = 32`, `4,648 WGSL statements`, `1,025 table reads`, `7.81 → 4.60`, `68.8 → 4.72`, `945 → 5.24 ms`, `1.7 · 15 · 180 times less`, `0.6–1.9 ms`, the pause ghosts `11.3, 11.9, 13.2`, `2.4 million · 18 searches · 0 different`, `103 million highlighter values`, `8 workers 1.9–6.7 ms`, `16 workers 1.3–4.0 ms`, `JSON.parse 77.7 ms → 6.19 ms`, `executor 8.4–9.2 s · 3.2 min`, the crossovers `~2,000–13,000` and `15,000–54,000`, and the ten-dot strip (7 green, 1 neutral, 2 red).

## Source inconsistencies noticed (not edited; the book and plan follow the corrected wording)

- `lab/json-search/README.md:129` says "from a few thousand documents on" for the back-to-back crossover. README:784 has the narrowed 2,000 to 13,000.
- `lab/json-search/README.md:129-130` and `lab/status.md:118` say "200 to 40,000 times". The cited numbers do not reproduce that range (see row 4.2).
- `lab/status.md:120` and `lab/json-search/README.md:126` say the GPU after a pause is "2 to 8 times" slower than 8 workers. Those workers were not timed after a pause, and 11 ÷ 6.7 is 1.6.
- `lab/json-search/README.md:123` says "seven of the ten" patterns, and `:436` says "nine ordinary patterns". The ten includes the backtracker.
- `lab/json-search/README.md:118` gives the 2.1 s highlighter time without the "extrapolated from 5,000 documents" caveat that `:140` gives.
